import { Crawler } from "./Crawler.js";
import { sendRequest, ensureTrailingSlash, removeTrailingSlash } from "./utils.js";

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
                const baseline = await sendRequest(url.toString());
                await this.injectPayloadsForm(cible, url, payload, baseline);
            }
            console.log(`Finished injecting payloads for ${cible.url}`);
            console.log('---------------------------------------');
        }
    }

    /**
     * Redirige l’injection vers la méthode GET ou POST selon le type de formulaire
     * @param {object} cible - Élément de l’attack surface
     * @param {URL} url - URL du formulaire
     * @param {string} payload - Payload à injecter
     */
    async injectPayloadsForm(cible, url, payload, baseline) {
        const formUrl = url.toString();

        if (cible.method === "GET") {
            await this.injectPayloadsGET(cible, formUrl, payload, baseline);
        } 
        else if (cible.method === "POST") {
            await this.injectPayloadsFormPOST(cible, formUrl, payload, baseline);
        }
    }

        /**
     * Injecte un payload dans un url ou un formulaire GET  utilisant la méthode GET
     * Chaque paramètre est testé individuellement
     * @param {object} cible - Formulaire cible
     * @param {string} url - URL du formulaire
     * @param {string} payload - Payload à injecter
     */
    async injectPayloadsGET(cible, url, payload, baseline = null) {
        // Création des paramètres par défaut
        const params = cible.params.map(param => {
            if(param instanceof Object) {
                return [Object.keys(param)[0], Object.values(param)[0]];
            } else {
                return [param, "1"];
            }
        });
        let craftedUrlBaseline = "";
        for (const [param, value] of params) {
            craftedUrlBaseline = removeTrailingSlash(url) +`?${param}=${value}`;
        }
        const baselineResponse = await sendRequest(craftedUrlBaseline);


        for (const [param, value] of params) {
            let craftedUrl = removeTrailingSlash(url) +`?${param}=${value}${payload}`;
            // Ajout des autres paramètres sans payload
            for (const [otherParam, otherValue] of params) {
                if (otherParam !== param) {
                    craftedUrl += `&${otherParam}=${otherValue}`;
                }
            }

            console.log(`Injecting payload into (GET): ${craftedUrl}`);
            const response = await sendRequest(craftedUrl);
        }
    }


    /**
     * Injecte un payload dans un formulaire utilisant la méthode POST
     * Chaque paramètre est testé individuellement
     * @param {object} cible - Formulaire cible
     * @param {string} url - URL du formulaire
     * @param {string} payload - Payload à injecter
     */
    async injectPayloadsFormPOST(cible, url, payload, baseline) {
        for (const param of cible.params) {
            const postData = {};

            // Paramètre ciblé avec payload
            if(param instanceof Object) {
                const key = Object.keys(param)[0];
                postData[key] = `${Object.values(param)[0]}${payload}`;
            } else {
                postData[param] = `test${payload}`;
            }

            // Autres paramètres avec valeur par défaut
            cible.params.forEach(otherParam => {
                if (otherParam !== param) {
                    if(otherParam instanceof Object) {
                        const key = Object.keys(otherParam)[0];
                        postData[key] = Object.values(otherParam)[0];
                    } else {
                        postData[otherParam] = "test";
                    }
                }
            });
            console.log(postData);
            console.log(`Injecting payload into form (POST): ${url}`);
            const response = await sendRequest(url, "POST", postData);
            //Probleme avec le formulaire, tu recois une reponse 200 quand tu fais l'injection à la place d'internal server error
            //const score = this.scorePayloadResponse(baseline, response);
        }
    }

    scorePayloadResponse(baseline, response) {
        
    }
}