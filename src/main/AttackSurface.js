import * as cheerio from 'cheerio';

import { Crawler } from "./Crawler";

export class AttackSurface {
    constructor() {
        this.attackSurface = [];
        this.crawler;
    }

    addCrawler(crawler) {
        this.crawler = crawler;
    }

    //Add JSON representation of each forms to attack surface
    addFormstoAttackSurface(formsHTML, link) {
        formsHTML.each((_, form) => {
            const $ = cheerio.load(form);
            const params = $('form').find('input, select, textarea').map((_, el) => $(el).attr('type') !== 'submit' ? $(el).attr('name') : null).get();
            if (params.length === 0) return;
            let jsonRepresentation = {};
            jsonRepresentation['url'] = Crawler.formatLink($('form').attr('action') === undefined ? link : $('form').attr('action'), this.crawler);
            jsonRepresentation['method'] = $('form').attr('method') || 'GET';
            jsonRepresentation['params'] = params;
            jsonRepresentation['source'] = 'form';
            if(this.checkIfInAttackSurface(jsonRepresentation, 'form')) return;
            console.log(jsonRepresentation);
            this.attackSurface.push(jsonRepresentation);
        });
    }

    addLinkToAttackSurface(link, params) {
        let jsonRepresentation = {};
        jsonRepresentation['url'] = link;
        jsonRepresentation['method'] = 'GET';
        jsonRepresentation['params'] = params;
        jsonRepresentation['source'] = 'link';
        if(this.checkIfInAttackSurface(jsonRepresentation, 'link')) return;
        console.log(jsonRepresentation);
        this.attackSurface.push(jsonRepresentation);
    }

    checkIfInAttackSurface(jsonRepresentation, type) {
        for(const item of this.attackSurface){
            if(item.source == type && item.url === jsonRepresentation.url)
                if (jsonRepresentation.params.every(param => item.params.includes(param)))
                    return true;
        }
        return false;
    }

    //Extract params from URL
    static extractParamsFromURL(link) {
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