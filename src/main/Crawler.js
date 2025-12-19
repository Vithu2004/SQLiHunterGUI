import axios from "axios";
import * as cheerio from 'cheerio';

export class Crawler {
    constructor(url) {
        this.url = url;
        this.visitedURL = new Set();
        this.Crawl(url);
    }

    async Crawl(URL){
        let HTMLPage = await this.sendRequest(URL);
        console.log(HTMLPage);
        this.scanHTMLPage(HTMLPage);
    }

    async sendRequest(URL) {
        try {
            const response = await axios.get(URL);
            console.log(response.data);
            return response.data;
        } catch (error) {
            console.log("can't get into the page");
        }
    }

    scanHTMLPage(HTMLPage) {
        const $ = cheerio.load(HTMLPage);
        const aLinks = $('a').map((_, el) => $(el).attr("href")).get();
        const formLinks = $('form').map((_,el) => $(el).attr("action")).get();
        console.log(aLinks, formLinks);
        return [...aLinks, ...formLinks];
    }

    isExternal(URL) {
        try {
            const host = new URL(URL, `https://${url}`).hostname;
            return host !== this.url;
        } catch (e) {
            return false;
        }
    }

    formatLink(link, URL) {
        formattedLink = link.toLowerCase();
        if(link.includes('#')){
            formattedLink = formattedLink.split('#')[0];
        }
        if(!link.includes(URL)){
            formattedLink = URL + formattedLink;
        }
        return formattedLink;
    }
}
