import { Injecter } from "./Injecter"
import { sendRequest, removeTrailingSlash } from "./utils.js";

export class Scanner {
    //Tableau des erreurs SQL
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
        this.attackResults = []; // Réservé pour stocker les résultats futurs des attaques
    }

    async scan() {
        const cibles = this.attackSurface.getAttackSurface()
        for (const cible of cibles) {
            console.log(cible);
            const injecter = new Injecter(cible);
            const result = await injecter.inject();
            console.log("-------------------------------")
        }
    }

    static scanFuzzingPayload(baseline, response) {
        const statusErrorResult = Scanner.checkStatusError(response);
        const SQLErrorResult = Scanner.checkSQLError(baseline, response);
        if (SQLErrorResult !== null) {
            return SQLErrorResult;
        } else if (statusErrorResult !== null) {
            return statusErrorResult;
        }
        return null;
    }

    static scanBooleanPayload(responseTrue, responseFalse) {
        const responseTrueContentLength = Scanner.getContentLength(responseTrue);
        const responseFalseContentLength = Scanner.getContentLength(responseFalse);
        if ((responseTrueContentLength + (responseTrueContentLength * 0.02)) >= responseFalseContentLength 
            && (responseTrueContentLength - (responseTrueContentLength * 0.02)) <= responseFalseContentLength) {
                return true;
        }
        return false;

    }
    
    static getContentLength(response) {
        if (response.headers['content-length'] === undefined || response.headers['content-length'] === null) {
            const size = Buffer.byteLength(
                typeof response.data === "string"
                    ? response.data
                    : JSON.stringify(response.data)
                );
            console.log(size);
            return size;
        }
            return response.headers['content-length'];
    }


    static checkStatusError(response) {
        const status = response.status;
        let error = {
            type : "Status Error",
            error : status,
            message : status !== 200 ? response.response.data : null
        };
        
        switch (status) {
            case 500 :
                error.addToScore = 45;
                return error;
            case 301 :
            case 302 : 
                error.addToScore = 25;
                return error;
            case 403 : 
            case 400 :
            case 406 :
                error.addToScore = 20;
                return error;
            default :
                return null;
        } 
    }

    static checkSQLError(baseline, response) {
        const htmlResponse = response.status !== 200 ? response.response.data.toLowerCase() : response.data.toLowerCase();
        const htmlBaseline = baseline.status !== 200 ? baseline.response.data.toLowerCase() : baseline.data.toLowerCase();
        for (const [dbtype, errors] of Object.entries(Scanner.SQL_ERRORS)) {
            for (const error of errors) {
                const errorLower = error.toLowerCase();
                if (htmlResponse.includes(errorLower) && !htmlBaseline.includes(errorLower)) {
                    //Mettre suspect ici dans l'objet plus tard, le type de db et l'erreur utilisé
                    return {
                        type : "Error-based SQL Injection",
                        database : dbtype,
                        evidence : error,
                        addToScore : 100
                    }
                }
            }
        }
        return null;
    }
}