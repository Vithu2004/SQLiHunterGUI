import * as cheerio from "cheerio";
import { Crawler } from "./Crawler";

export class AttackSurface {
    constructor(crawler) {
        this.attackSurface = []; // Liste de tous les forms et liens détectés qui peuvent être attaqués
        this.crawler = crawler; // Référence au crawler
    }

    /**
     * Ajoute les forms d'une page à l'attack surface
     * @param {Cheerio} formsHTML - Cheerio object contenant tous les forms
     * @param {string} link - URL de la page
     */
    addFormstoAttackSurface(formsHTML, link) {
        formsHTML.each((_, form) => {
            const $ = cheerio.load(form);

            // Extraction des paramètres des inputs (ignore submit)
            const params = $("form")
                .find("input, select, textarea")
                .map((_, el) =>
                    $(el).attr("type") !== "submit" ? $(el).attr("name") : null
                )
                .get()
                .filter(Boolean);

            if (params.length < 0) return;

            const action = $("form").attr("action") ?? link;

            const json = {
                url: Crawler.formatLink(action, this.crawler),
                method: $("form").attr("method").toUpperCase() || "GET",
                params,
                source: "form",
            };

            if (this.isAlreadyInAttackSurface(json)) return;

            console.log(json);
            this.attackSurface.push(json);
        });
    }

    /**
     * Ajoute un lien GET à l'attack surface
     * @param {string} link - URL
     * @param {string[]} params - Paramètres GET
     */
    addLinkToAttackSurface(link, params) {
        const json = {
            url: link,
            method: "GET",
            params,
            source: "link",
        };

        if (this.isAlreadyInAttackSurface(json)) return;

        console.log(json);
        this.attackSurface.push(json);
    }

    /**
     * Vérifie si un élément est déjà présent dans l'attack surface
     * @param {object} candidate - Objet à tester
     * @returns {boolean}
     */
    isAlreadyInAttackSurface(candidate) {
        return this.attackSurface.some(item =>
            item.source === candidate.source &&
            item.url === candidate.url &&
            candidate.params.every(p => item.params.includes(p))
        );
    }

    /**
     * Extrait les paramètres GET d'une URL
     * @param {string} link - URL
     * @returns {string[]} - Liste des paramètres
     */
    static extractParamsFromURL(link) {
        try {
            const url = new URL(link, Crawler.baseUrl);
            return [...url.searchParams.keys()];
        } catch {
            return [];
        }
    }

    /**
     * Retourne l'attack surface complète
     */
    getAttackSurface() {
        return this.attackSurface;
    }
}
