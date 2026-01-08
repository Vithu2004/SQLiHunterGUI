import * as cheerio from 'cheerio';

import { Crawler } from "./Crawler";

export class AttackSurface {
    constructor() {
        this.attackSurface = [];
    }

    //Add JSON representation of each forms to attack surface
    addFormstoAttackSurface(formsHTML, url) {
        formsHTML.each((_, form) => {
            console.log("Found " + formsHTML.length + " forms on " + url);
            const $ = cheerio.load(form);
            const params = $('form').find('input, select, textarea').map((_, el) => $(el).attr('type') !== 'submit' ? $(el).attr('name') : null).get();
            if (params.length === 0) return;
            let jsonRepresentation = {};
            jsonRepresentation['url'] = Crawler.formatLink($('form').attr('action') === undefined ? url : $('form').attr('action'));
            jsonRepresentation['method'] = $('form').attr('method') || 'GET';
            jsonRepresentation['params'] = params;
            jsonRepresentation['source'] = 'form';
            this.attackSurface.push(jsonRepresentation);
            console.log(jsonRepresentation);
        });
    }

    addLinksToAttackSurface(linksHref, url) {
        linksHref.forEach(link => {
            const params = this.extractParamsFromURL(link, url);
            if (!Crawler.isInternalLink(link) || params.length === 0) return;
            let jsonRepresentation = {};
            jsonRepresentation['url'] = Crawler.formatLink(link);
            jsonRepresentation['method'] = 'GET';
            jsonRepresentation['params'] = params;
            jsonRepresentation['source'] = 'link';
            console.log(jsonRepresentation);
            this.attackSurface.push(jsonRepresentation);
        });
    }

    //Extract params from URL
    extractParamsFromURL(link, url) {
        try {
            const urlObj = new URL(link, Crawler.url);
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

    getAttackSurface() {
        return this.attackSurface;
    }
}