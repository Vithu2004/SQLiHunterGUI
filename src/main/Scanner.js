import * as cheerio from "cheerio";

import { Crawler } from "./Crawler.js";

export class Scanner {
    constructor(attackSurface) {
        this.attackSurface = attackSurface;
        this.attackResults = [];
    }

    async injectPayloads(payload) {
        for (const cible of this.attackSurface.attackSurface) {
            const url = new URL(cible.url);
            if (cible.source === "link") {
                await this.injectPayloadsLink(url, payload);
            }
            else if (cible.source === "form") {
                await this.injectPayloadsForm(cible, url, payload);
            }
        }
    }

    async injectPayloadsLink(url, payload) {
        url.searchParams.forEach((_, param) => {
            url.searchParams.set(param, payload);
        });
        console.log(`Injecting payload into link: ${url.toString()}`);
        const response = await this.sendRequest(url.toString());
    }

    async injectPayloadsForm(cible, url, payload) {
        url = url.toString();
        if (cible.method === "GET") {
            const formData = [];
            cible.params.forEach(param => {
                formData.push ([param, "test"]);
            });
            for (const [param, value] of formData) {
                url = Crawler.ensureTrailingSlash(url) + `?${param}=${value}${payload}`;
                for (const [otherParam, otherValue] of formData) {
                    if (otherParam !== param) {
                        url += `&${otherParam}=${otherValue}`;
                    }   
                }
            }
            console.log(`Injecting payload into form (GET): ${url}`);
            const response = await this.sendRequest(url);
        }
    }

    async sendRequest(url) {
        try {
            const response = await fetch(url);
            console.log(`Response status for ${url}: ${response.status}`);
            return response.data;
        } catch (error) {
            console.log("Can't access page:", error.message);
            return error.message;
        }
    }

}