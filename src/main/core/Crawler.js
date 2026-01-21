import * as cheerio from "cheerio";
import { AttackSurface } from "./AttackSurface";

import { sendRequest, ensureTrailingSlash, removeTrailingSlash } from "./utils.js";


export class Crawler {
    // Base URL complète (ex: https://example.com/)
    static baseUrl = "";
    // Host de base sans http/https (ex: example.com)
    static baseHost = "";

    /**
     * Constructeur du Crawler
     * @param {AttackSurface} attackSurface - Instance pour stocker les forms et liens détectés
     * @param {string} url - URL de départ du crawl
     */
    constructor(url) {
        Crawler.baseUrl = ensureTrailingSlash(url);
        Crawler.baseHost = url.replace("https://", "").replace("http://", "").replace("/", "");
        
        this.attackSurface = new AttackSurface(this);
        this.visitedURL = new Set(); // Stocke les URLs déjà visitées
    }

    /**
     * Démarre le crawl à partir de la base URL
     * Affiche le résultat final dans la console
     */
    async startCrawl() {
        await this.crawl(Crawler.baseUrl);
        console.log(`----------- Crawling Finished -----------`);
        return this.attackSurface;
    }

    /**
     * Fonction principale du crawler : visite la page, récupère les liens internes et les explore récursivement
     * @param {string} url - URL à crawler
     */
    async crawl(url) {
        console.log(`----------- Crawling: ${url} -----------`);

        const html = await sendRequest(url)
            .then(response => response ? response.data : null)
            .catch(() => null);

        // Récupération des liens internes valides
        const links = this.scanHTMLPage(html, url)
            .map(link => this.isInternalLink(link) ? Crawler.formatLink(link, this) : null)
            .filter(link => link !== null && link !== undefined);

        console.log(`Found ${links.length} internal links on ${url}`);
        console.log(links);

        this.visitedURL.add(url);

        // Crawl récursif des liens internes non visités
        for (const link of links) {
            if (!this.visitedURL.has(link)) {
                await this.crawl(link);
            }
        }
    }

    /**
     * Analyse le contenu HTML pour extraire les forms et liens
     * @param {string} html - Contenu HTML de la page
     * @param {string} url - URL de la page
     * @returns {string[]} - Liste des liens présents sur la page
     */
    scanHTMLPage(html, url) {
        if (html === null) return [];
        const $ = cheerio.load(html);

        // Analyse des forms et ajout dans l'attack surface
        const forms = $("form");
        if (forms.length > 0) {
            this.attackSurface.addFormstoAttackSurface(forms, url);
        }
        // Extraction des liens <a href>
        return $("a")
            .map((_, el) => $(el).attr("href"))
            .get();
    }

    /**
     * Formate un lien en URL complète, gère les paramètres GET et les ancres (#)
     * @param {string} link - Lien à formater
     * @param {Crawler} crawler - Instance du crawler pour ajouter à visitedURL
     * @returns {string|undefined} - Lien formaté ou undefined si déjà traité
     */
    static formatLink(link, crawler) {
        // Mise en minuscule et suppression des ancres
        let formatted = link.split("#")[0];

        // Si le lien est relatif, on ajoute la base URL
        if (!formatted.includes(Crawler.baseUrl)) {
            formatted = formatted.startsWith("/")
                ? formatted.slice(1)
                : formatted;
            formatted = ensureTrailingSlash(Crawler.baseUrl) + formatted;
        }

        // Extraction des paramètres GET
        const params = AttackSurface.extractParamsFromURL(formatted);
        if (params.length > 0) {
            crawler.addSignatureToVisitedURLs(formatted, params);
            return;
        }

        return formatted.toLowerCase();
    }

    /**
     * Vérifie si un lien est interne au site (même host)
     * @param {string} link - URL à tester
     * @returns {boolean} - true si interne, false sinon
     */
    isInternalLink(link) {
        try {
            const host = new URL(link, Crawler.baseUrl).hostname;
            return host === Crawler.baseHost;
        } catch {
            return false;
        }
    }

    /**
     * Ajoute un lien et ses paramètres à visitedURL avec signature unique
     * @param {string} link - URL du lien
     * @param {string[]} params - Paramètres GET extraits
     */
    addSignatureToVisitedURLs(link, params) {
        const cleanLink = removeTrailingSlash(link);
        const base = cleanLink.split("?")[0].toLowerCase();

        this.attackSurface.addLinkToAttackSurface(base, params);

        const signature = `GET | ${base} | ${params}`;
        if (!this.visitedURL.has(signature)) {
            this.visitedURL.add(signature);
        }
    }
}