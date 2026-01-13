import axios from "axios";
import { Crawler } from "./Crawler.js";

export class Scanner {
    /**
     * Constructeur du scanner
     * @param {AttackSurface} attackSurface - Surface d’attaque générée par le crawler
     */
    constructor(attackSurface) {
        this.attackSurface = attackSurface;
        this.attackResults = []; // Réservé pour stocker les résultats futurs des attaques
    }

    /**
     * Injecte un payload sur toutes les cibles présentes dans l'attack surface
     * @param {string} payload - Payload à injecter
     */
    async injectPayloads(payload) {
        for (const cible of this.attackSurface.attackSurface) {
            const url = new URL(cible.url);

            if (cible.source === "link") {
                await this.injectPayloadsGET(cible, url.toString(), payload);
            } 
            else if (cible.source === "form") {
                await this.injectPayloadsForm(cible, url, payload);
            }
        }
    }

    /**
     * Injecte un payload dans un url ou un formulaire GET  utilisant la méthode GET
     * Chaque paramètre est testé individuellement
     * @param {object} cible - Formulaire cible
     * @param {string} url - URL du formulaire
     * @param {string} payload - Payload à injecter
     */
    async injectPayloadsGET(cible, url, payload) {
        // Création des paramètres par défaut
        const formParams = cible.params.map(param => [param, "test"]);

        for (const [param, value] of formParams) {
            let craftedUrl = Crawler.ensureTrailingSlash(url) +`?${param}=${value}${payload}`;

            // Ajout des autres paramètres sans payload
            for (const [otherParam, otherValue] of formParams) {
                if (otherParam !== param) {
                    craftedUrl += `&${otherParam}=${otherValue}`;
                }
            }

            console.log(`Injecting payload into form (GET): ${craftedUrl}`);
            await this.sendRequest(craftedUrl, "GET");
        }
    }

    /**
     * Redirige l’injection vers la méthode GET ou POST selon le type de formulaire
     * @param {object} cible - Élément de l’attack surface
     * @param {URL} url - URL du formulaire
     * @param {string} payload - Payload à injecter
     */
    async injectPayloadsForm(cible, url, payload) {
        const formUrl = url.toString();

        if (cible.method === "GET") {
            await this.injectPayloadsGET(cible, formUrl, payload);
        } 
        else if (cible.method === "POST") {
            await this.injectPayloadsFormPOST(cible, formUrl, payload);
        }
    }

    /**
     * Injecte un payload dans un formulaire utilisant la méthode POST
     * Chaque paramètre est testé individuellement
     * @param {object} cible - Formulaire cible
     * @param {string} url - URL du formulaire
     * @param {string} payload - Payload à injecter
     */
    async injectPayloadsFormPOST(cible, url, payload) {
        for (const param of cible.params) {
            const postData = {};

            // Paramètre ciblé avec payload
            postData[param] = `test${payload}`;

            // Autres paramètres avec valeur par défaut
            cible.params.forEach(otherParam => {
                if (otherParam !== param) {
                    postData[otherParam] = "test";
                }
            });

            console.log(`Injecting payload into form (POST): ${url} with data ${JSON.stringify(postData)}`);
            await this.sendRequest(url, "POST", postData);
        }
    }

    /**
     * Envoie une requête HTTP GET ou POST
     * @param {string} url - URL cible
     * @param {string} method - Méthode HTTP ("GET" ou "POST")
     * @param {object} [data] - Données POST (optionnel)
     * @returns {any|null} - Réponse du serveur ou null en cas d’erreur
     */
    async sendRequest(url, method = "GET", data = null) {
        try {
            const response =
                method === "GET"
                    ? await axios.get(url)
                    : await axios.post(url, data);

            console.log(`Response status for ${url}: ${response.status}`);
            return response.data;
        } catch (error) {
            console.log("Can't access page:", error.message);
            return null;
        }
    }
    
}