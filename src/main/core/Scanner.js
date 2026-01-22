import { Injecter } from "./Injecter"

/**
 * Classe Scanner
 * Responsable de l'orchestration des attaques SQL Injection
 * et de l'analyse des réponses serveur
 */
export class Scanner {
    /**
     * Signatures d'erreurs SQL connues par type de base de données
     * Utilisées pour détecter les injections SQL Error-based
     */
    static SQL_ERRORS = {
        "MySQL": [
            "you have an error in your sql syntax",
            "check the manual that corresponds to your mysql server version",
            "mysql_fetch_array",
            "mysql_fetch_assoc",
            "mysql_num_rows",
            "is not a valid MySQL result",
            "warning: mysql_",
            "mySQL Error",
            "XPATH syntax error: '~8.0.x'",
        ],
        "PostgreSQL": [
            "PostgreSQL query failed",
            "ERROR: parser: parse error at or near",
            "syntax error at or near",
            "invalid input syntax for integer",
            "unterminated quoted string",
            "PSQLException"
        ],
        "Microsoft SQL Server": [
            "unclosed quotation mark after the character string",
            "driver] [sql server] syntax error",
            "microsoft ole db provider for sql server",
            "sqlserver exception",
            "system.data.sqlclient.sqlexception",
            "incorrect syntax near",
            "Conversion failed when converting the nvarchar value... to data type int",
        ],
        "Oracle": [
            "ORA-00933: SQL command not properly ended",
            "ORA-01756: quoted string not properly terminated",
            "Oracle Error",
            "ORA-00933",
            "Oracle exception",
            "quoted string not properly terminated"
        ],
        "SQLite": [
            "SQLite3::SQLException",
            "unrecognized token:",
            "near \"...\": syntax error",
            "[sqlite] error",
            "quoted string not properly terminated"
        ]    
    };

    /**
     * Constructeur du scanner
     * @param {AttackSurface} attackSurface - Surface d’attaque générée par le crawler
     */
    constructor(attackSurface) {
        this.attackSurface = attackSurface;
        //Stocke les résultats des attaques pour chaque cible
        this.attackResults = [];
    }


    //Lance le scan sur l'ensemble de l'attack surface
    async scan() {
        const cibles = this.attackSurface.getAttackSurface();
        for (const cible of cibles) {
            const injecter = new Injecter(cible);
            const result = await injecter.inject();
            this.attackResults.push(result);
            //console.log("-------------------------------");
        }
        //console.log(this.attackResults);
        this.sortAttackResultsByScore();
        return this.attackResults;
    }

    sortAttackResultsByScore(){
        for (let i = 0; i < this.attackResults.length; i++) {
            for (let y = 0; y < this.attackResults.length; y++) {
                if (this.attackResults[y].score < this.attackResults[i].score) {
                    let temps = this.attackResults[i];
                    this.attackResults[i] = this.attackResults[y];
                    this.attackResults[y] = temps;
                }
            }
        }
        console.log(this.attackResults);
    }

    /**
     * Analyse les résultats après injection d'un payload de fuzzing
     * @param {object} baseline - Réponse sans injection
     * @param {object} response - Réponse après injection
     * @param {Injecter} injecter - Instance d'injecter
     * @returns {string|null}
     */
    static scanFuzzingPayload(baseline, response, injecter) {
        const statusErrorResult = Scanner.checkStatusError(response, injecter);
        const SQLErrorResult = Scanner.checkSQLError(baseline, response, injecter);
        if (SQLErrorResult !== null) {
            return SQLErrorResult;
        } else if (statusErrorResult !== null) {
            return statusErrorResult;
        }
        return null;
    }

    /**
     * Analyse les réponses issues d'une injection Boolean-based
     * Compare la taille des réponses TRUE / FALSE
     */
    static scanBooleanPayload(responseTrue, responseFalse, injecter) {
        const responseTrueContentLength = Scanner.getContentLength(responseTrue);
        const responseFalseContentLength = Scanner.getContentLength(responseFalse);
        // Tolérance de 2% sur la taille du contenu
        if ((responseTrueContentLength + (responseTrueContentLength * 0.02)) >= responseFalseContentLength 
            && (responseTrueContentLength - (responseTrueContentLength * 0.02)) <= responseFalseContentLength) {
            injecter.changeResult(responseTrue.injectedParam, "BOOLEAN-BASED INJECTION", "HIGH", 80, null);
            return true;
        }
        return false;
    }

    /**
     * Calcule la taille du contenu d'une réponse HTTP
     * @param {object} response
     * @returns {number}
     */
    static getContentLength(response) {
        if (response.headers['content-length'] === undefined || response.headers['content-length'] === null) {
            const size = Buffer.byteLength(
                typeof response.data === "string"
                    ? response.data
                    : JSON.stringify(response.data)
            );
            return size;
        }
        return response.headers['content-length'];
    }

    /**
     * Analyse le code HTTP de la réponse
     * @returns {string}
     */
    static checkStatusError(response, injecter) {
        switch (response.status) {
            case 500 :
                injecter.changeResult(null, "Internal Server Error", "MEDIUM", 45, null);
                return "CONTINUE";
            case 301 :
            case 302 : 
                injecter.changeResult(null, "Redirection", "-", 25, null);
                return "COMPLEX CONTINUE";
            case 403 : 
            case 400 :
            case 406 :
                injecter.changeResult(null, "Blocked By WAF", "-", 20, null);
                return "END";
            default :
                return "CONTINUE";
        } 
    }

    /**
     * Détecte les erreurs SQL dans la réponse
     * Compare avec la baseline pour éviter les faux positifs
     */
    static checkSQLError(baseline, response, injecter) {
        const htmlResponse = response.status !== 200 ? response.response.data.toLowerCase() : response.data.toLowerCase();
        const htmlBaseline = baseline.status !== 200 ? baseline.response.data.toLowerCase() : baseline.data.toLowerCase();
        for (const [dbtype, errors] of Object.entries(Scanner.SQL_ERRORS)) {
            for (const error of errors) {
                const errorLower = error.toLowerCase();
                if (htmlResponse.includes(errorLower) &&!htmlBaseline.includes(errorLower)) {
                    injecter.changeResult(null, `Error SQL Injection : [${error}], Database type : ${dbtype}`, "CONFIRMED", 100, null);
                    return "END";
                }
            }
        }
        return "CONTINUE";
    }
}