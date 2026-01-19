import axios from "axios";
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

/**
 * Envoie une requête HTTP GET ou POST
 * @param {string} url - URL cible
 * @param {string} method - Méthode HTTP ("GET" ou "POST")
 * @param {object} [data] - Données POST (optionnel)
 * @returns {any} - Réponse du serveur ou error en cas d’erreur
 */

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

export async function sendRequest(url, method = "GET", data = null) {
    try {
        let response = null;
            if(method === "GET") {
                response = await client.get(url);
            }
            else {
                data = new URLSearchParams(data);
                response = await client.post(url, data);
            }
        console.log(`Response Status: ${response.status} for ${method} request to ${url}`);
        return response;
    } catch (error) {
        if (error.response) {
            // Le serveur a répondu avec un code ≠ 2xx
            console.log('Status :', error.response.status);
            console.log('Message :', error.response.data);
        } else if (error.request) {
            // La requête a été envoyée mais aucune réponse reçue
            console.log('Aucune réponse du serveur');
        } else {
            // Erreur lors de la configuration de la requête
            console.log('Erreur :', error.message);
        }
        return error;
    }
}

/**
 * Ajoute un / à la fin de l'URL si absent
 */
export  function ensureTrailingSlash(url) {
    return url.endsWith("/") ? url : `${url}/`;
}

/**
 * Supprime le / final de l'URL si présent
 */
export function removeTrailingSlash(url) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
}
 