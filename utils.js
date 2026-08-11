// --- utils.js ---
// Funciones puras de procesamiento de texto y datos.
// No leen del DOM, no escriben en el DOM, no modifican variables globales.
// Se cargan antes que app.js y sugerencias-print.js para estar disponibles globalmente.

/**
 * Separa el nombre principal de los detalles/uvas usando el separador '//'
 * @param {String} texto 
 * @returns {Object} { nombre: String, uvas: String }
 */
function desglosarNombre(texto) {
    if (!texto) return { nombre: "", uvas: "" };
    const partes = texto.split('//');
    return {
        nombre: partes[0] ? partes[0].trim() : "",
        uvas: partes[1] ? partes[1].trim() : ""
    };
}

/**
 * Limpia comillas dobles redundantes típicas de exportaciones CSV
 * @param {String} texto 
 * @returns {String}
 */
function superLimpiar(texto) {
    if (!texto) return "";
    let t = texto.toString().trim();
    if (t.startsWith('"') && t.endsWith('"')) t = t.substring(1, t.length - 1);
    t = t.replace(/""/g, '"');
    return t.trim();
}

/**
 * Formatea el nombre de un vino poniendo el nombre en mayúsculas 
 * pero respetando el contenido entre paréntesis (ej. la D.O.).
 * @param {String} texto 
 * @returns {String}
 */
function formatWineName(texto) {
    if (!texto) return "";
    const partes = texto.split('(');
    let nombrePrincipal = partes[0].toUpperCase();
    if (partes.length > 1) {
        return nombrePrincipal + '(' + partes.slice(1).join('(');
    }
    return nombrePrincipal;
}

/**
 * Busca y extrae el primer objeto JSON válido dentro de un string (incluso si tiene texto basura alrededor).
 * Ideal para respuestas de la IA que incluyen bloques de código markdown.
 * NUEVO: el conteo de llaves es consciente de las cadenas de texto — ignora cualquier '{' o '}' que
 * aparezca DENTRO de una cadena JSON (p.ej. si una traducción incluye una llave suelta en el texto),
 * y respeta comillas escapadas (\"). Antes contaba las llaves de todo el texto sin distinción, lo que
 * podía descuadrar el conteo y fallar con "No se encontró un JSON válido" aunque la respuesta de la
 * IA estuviera completa y bien formada.
 * @param {String} texto 
 * @returns {Object} El JSON parseado.
 * @throws {Error} Si no encuentra un JSON válido.
 */
function extraerJSON(texto) {
    let limpio = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    let braceCount = 0;
    let startIndex = -1;
    let dentroDeString = false;
    let escapado = false;

    for (let i = 0; i < limpio.length; i++) {
        const ch = limpio[i];

        if (dentroDeString) {
            if (escapado) {
                escapado = false;
            } else if (ch === '\\') {
                escapado = true;
            } else if (ch === '"') {
                dentroDeString = false;
            }
            continue; // dentro de una cadena: ignorar '{'/'}' hasta que cierre
        }

        if (ch === '"') {
            dentroDeString = true;
            continue;
        }

        if (ch === '{') {
            if (braceCount === 0) startIndex = i;
            braceCount++;
        } else if (ch === '}') {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
                const jsonString = limpio.substring(startIndex, i + 1);
                try {
                    return JSON.parse(jsonString);
                } catch (e) {
                    console.error("JSON aislado pero inválido:", jsonString);
                    throw new Error("JSON inválido: " + e.message);
                }
            }
        }
    }
    throw new Error("No se encontró un JSON válido en la respuesta de la IA.");
}
