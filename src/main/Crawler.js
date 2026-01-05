import axios from "axios";
import * as cheerio from 'cheerio';

export class Crawler {
    //Constructeur, pense à chercher les cas ou l'utilisateur n'entre pas http ou https
    constructor(url) {
        this.url = url;
        this.urlWWW = url.replace("https://", "").replace("http://", "");
        this.visitedURL = new Set();
        this.Crawl(url);
    }

    //Fonction princiale du crawler
    async Crawl(URL){
        let HTMLPage = await this.sendRequest(URL);
        let links = this.scanHTMLPage(HTMLPage);
        let internalLinks = links.map(link => this.isInternalLink(link) ? this.formatLink(link, URL) : null);
        internalLinks = internalLinks.filter(link => link !== null);
        console.log(internalLinks);
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
    scanHTMLPage(HTMLPage) {
        const $ = cheerio.load(HTMLPage);
        const aLinks = $('a').map((_, el) => $(el).attr("href")).get();
        const formLinks = $('form').map((_,el) => $(el).attr("action")).get();
        return [...aLinks, ...formLinks];
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
}
