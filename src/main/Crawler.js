import axios from "axios";
import * as cheerio from 'cheerio';

import { AttackSurface } from "./AttackSurface";

export class Crawler {
    static url = "";
    static urlWWW = "";

    //Constructeur, pense à chercher les cas ou l'utilisateur n'entre pas http ou https
    constructor(attackSurface, url) {
        Crawler.url = Crawler.ensureTrailingSlashatEnd(url);
        Crawler.urlWWW = url.replace("https://", "").replace("http://", "").replace("/", "");
        
        this.attackSurface = attackSurface;
        this.visitedURL = new Set();
    }
    
    async startCrawl(){
        await this.crawl(Crawler.url);
        console.log("Crawling finished.");
        console.log(this.attackSurface.attackSurface);
    }

    //Fonction princiale du crawler
    async crawl(URL){
        console.log("-----------Crawling: " + URL + " -----------");
        let HTMLPage = await this.sendRequest(URL);
        let links = this.scanHTMLPage(HTMLPage, URL);
        links = links
            .map(link => Crawler.isInternalLink(link) ? Crawler.formatLink(link, this) : null)
            .filter(link => link !== null && link !== undefined);
        
        console.log("Found " + links.length + " internal links on " + URL);
        console.log(links);
        this.visitedURL.add(URL);
        for(const link of links){
            if(!this.visitedURL.has(link))
                await this.crawl(link);
        }
    }

    //Envoyer une requete HTTP pour recuperer le contenu HTML d'une page
    async sendRequest(URL) {
        try {
            const response = await axios.get(URL);
            return response.data;
        } catch (error) {
            console.log("can't get into the page : " + error);
            return "error";
        }
    }

    //Analyser le contenu HTML pour extraire les liens
    scanHTMLPage(HTMLPage, URL) {
        if(HTMLPage === "error") return [];
        const $ = cheerio.load(HTMLPage);

        //Forms
        const formsHTML = $('form');
        if (formsHTML.length > 0)
            this.attackSurface.addFormstoAttackSurface(formsHTML, URL);
        
        //Links
        const aLinks = $('a').map((_, el) => $(el).attr("href")).get();
        return aLinks;
    }

    //Vérifier si le lien est externe ou interne, ignore les sous-domaines pour l'instant, sera rajouté plus tard
    //Les # sont les formulaires, gérer ça plus tard
    //Return true si interne, false si externe
    static isInternalLink(link) {
        try {
            const host = new URL(link, Crawler.url).hostname;
            return host === Crawler.urlWWW;
        } catch (e) {
            console.log("Error ici: " + e);
            return false;
        }
    }
    
    //Formater le lien
    static formatLink(link, crawler) {
        let formattedLink = link.toLowerCase();
        if(link.includes('#')){
            formattedLink = formattedLink.split('#')[0];
        }
        if(!link.includes(Crawler.url)){
            formattedLink = formattedLink.startsWith('/') ? formattedLink.slice(1) : formattedLink;
            formattedLink = Crawler.url + formattedLink;
        }
        const params = AttackSurface.extractParamsFromURL(formattedLink);
        if(params.length > 0){
            crawler.addSignatureToVisitedURLs(formattedLink, params);
            return;
        }

        formattedLink = Crawler.ensureTrailingSlashatEnd(formattedLink);
        return formattedLink;
    }

    addSignatureToVisitedURLs(formattedLink, params) {
        formattedLink = Crawler.removeTrailingSlashatEnd(formattedLink);
        this.attackSurface.addLinkToAttackSurface(formattedLink.split("=")[0], params);
        let signature = "GET | " + formattedLink.split("?")[0] + " | " + params;
            if(!this.visitedURL.has(signature))
                this.visitedURL.add(signature);
                console.log("Visited URLs updated with: " + signature);
    }

    static ensureTrailingSlashatEnd(url) {
        return url.endsWith('/') ? url : url + '/';
    }

    static removeTrailingSlashatEnd(url) {
        return url.endsWith('/') ? url.slice(0, -1) : url;
    }
}
