import axios from "axios";
import * as cheerio from 'cheerio';

import { AttackSurface } from "./AttackSurface";

export class Crawler {
    //Constructeur, pense à chercher les cas ou l'utilisateur n'entre pas http ou https
    constructor(url) {
        this.url = url;
        this.urlWWW = url.replace("https://", "").replace("http://", "");
        this.visitedURL = new Set();
        this.crawl(url);
    }

    //Fonction princiale du crawler
    async crawl(URL){
        let HTMLPage = await this.sendRequest(URL);
        let links = this.scanHTMLPage(HTMLPage, URL);
        let internalLinks = links.map(link => this.isInternalLink(link) ? this.formatLink(link, URL) : null);
        internalLinks = internalLinks.filter(link => link !== null);
        this.visitedURL.add(URL);
        for(const link of internalLinks){
            if(!this.visitedURL.has(link)){
                await this.crawl(link);
            }
        }
    }

    //Envoyer une requete HTTP pour recuperer le contenu HTML d'une page
    async sendRequest(URL) {
        try {
            const response = await axios.get(URL);
            return response.data;
        } catch (error) {
            console.log("can't get into the page");
        }
    }

    //Analyser le contenu HTML pour extraire les liens
    scanHTMLPage(HTMLPage, URL) {
        const $ = cheerio.load(HTMLPage);
        //Links
        const aLinks = $('a').map((_, el) => $(el).attr("href")).get();
        this.addLinksToAttackSurface(aLinks, URL);
        //Forms
        const formHTML = $('form');
        this.addFormstoAttackSurface(formHTML, URL);
        return aLinks;
    }

    //Vérifier si le lien est externe ou interne, ignore les sous-domaines pour l'instant, sera rajouté plus tard
    //Les # sont les formulaires, gérer ça plus tard
    //Return true si interne, false si externe
    isInternalLink(link) {
        try {
            const host = new URL(link, this.url).hostname;
            return host === this.urlWWW;
        } catch (e) {
            console.log("Error : " + e);
            return false;
        }
    }
    
    //Formater le lien
    formatLink(link, URL) {
        let formattedLink = link.toLowerCase();
        if(link.includes('#')){
            formattedLink = formattedLink.split('#')[0];
        }
        if(!link.includes(URL)){
            formattedLink = URL + formattedLink;
        }
        return formattedLink;
    }

    //Essaie de voir si tu peux mettre ces fonctions dans AttackSurface.js plus tard
    //Add JSON representation of each forms to attack surface
    addFormstoAttackSurface(formsHTML, URL) {
        formsHTML.each((_, form) => {
            const $ = cheerio.load(form);
            const params = $('form').find('input, select, textarea').map((_, el) => $(el).attr('type') !== 'submit' ? $(el).attr('name') : null).get();
            if (params.length === 0) return;
            let jsonRepresentation = {};
            jsonRepresentation['url'] = this.formatLink($('form').attr('action'), URL);
            jsonRepresentation['method'] = $('form').attr('method') || 'GET';
            jsonRepresentation['params'] = params;
            jsonRepresentation['source'] = 'form';
            console.log(jsonRepresentation);
            //Rajoute dans attack surface ici plus tard
        });
    }

    addLinksToAttackSurface(linksHref, URL) {
        linksHref.forEach(link => {
            if (!this.isInternalLink(link)) return;
            const params = this.extractParamsFromURL(link);
            if (params.length === 0) return;
            let jsonRepresentation = {};
            jsonRepresentation['url'] = this.formatLink(link, URL);
            jsonRepresentation['method'] = 'GET';
            jsonRepresentation['params'] = params;
            jsonRepresentation['source'] = 'link';
            console.log(jsonRepresentation);
            //Rajoute dans attack surface ici plus tard
        });
    }

    //Extract params from URL
    extractParamsFromURL(link) {
        try {
            const urlObj = new URL(link, this.url);
            const params = [];
            urlObj.searchParams.forEach((_, key) => {
                params.push(key);
            });
            return params;
        } catch (e) {
            console.log("Error extracting params: " + e);
            return [];
        }
    }

}
