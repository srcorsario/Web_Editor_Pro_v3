// =========================================
// REPOSITORIO: Web_Editor_Pro_v3 (PRINCIPAL)
// ARCHIVO: prompts.js
// -----------------------------------------
// Centraliza todos los prompts de IA (Gemini) del proyecto para
// facilitar su lectura y edición sin tener que buscarlos dentro
// de la lógica de app.js / ui.js.
//
// Se carga como script CLÁSICO (no type="module") a propósito:
// así tanto app.js (script clásico, con funciones llamadas desde
// onclick="..." en el HTML) como ui.js (type="module") pueden
// acceder a él por igual a través de window.PROMPTS.
//
// IMPORTANTE: debe cargarse en el HTML ANTES que app.js y ui.js.
// =========================================

window.PROMPTS = {

    // ---------------------------------------------------------
    // Usado en app.js > generarTraduccionEN()
    // Genera 3 opciones de traducción al inglés del nombre del plato/vino.
    // ---------------------------------------------------------
    opcionesEN: (textoCompletoEs, esVino) => `Actúa como un translator profesional de menús de restaurantes. Te paso un elemento en español: "${textoCompletoEs}".
    ${esVino ? 'Es un vino. El separador "//" distingue el nombre del vino de la variedad de uva o detalles. Debes traducir ambas partes y mantener el separador "//" en el resultado. El nombre del vino debe ir en MAYÚSCULAS, pero el contenido entre paréntesis (como la D.O.) debe mantener su formato original.' : ''}
    Necesito que me des EXACTAMENTE 3 opciones de traducción al inglés con diferentes enfoques para un menú:
    1. Traducción directa/literal.
    2. Traducción gastronómica/descriptiva (más elegante).
    3. Traducción corta/concisa (estilo menú).
    Responde EXCLUSIVAMENTE con un objeto JSON válido. No incluyas texto fuera del JSON. Las comillas dobles dentro de las traducciones deben estar escapadas con barra invertida (\"). 
    Estructura exacta: {"directa": "...", "gastronomica": "...", "corta": "..."}`,

    // ---------------------------------------------------------
    // Usado en app.js > ejecutarTraduccionAutomatica()
    // Traduce el nombre del plato/vino (ES + EN de referencia) al resto de idiomas.
    // ---------------------------------------------------------
    autoTraduccionResto: (textoCompletoEs, textoCompletoEn, esVino, idiomasObjetivo) => `Actúa como un traductor experto de menús de restaurantes. Traduce el siguiente elemento en español: "${textoCompletoEs}" ${textoCompletoEn ? `y su texto en Inglés como referencia: "${textoCompletoEn}"` : ""}.
    ${esVino ? 'Es un vino. El separador "//" distingue el nombre del vino de la variedad de uva o detalles. Debes traducir ambas partes y mantener el separador "//" en el resultado. El nombre del vino debe ir en MAYÚSCULAS, pero el contenido entre paréntesis (ej: EL COTO (D.O. Rioja)) debe mantener su formato original en todos los idiomas.' : ''}
    Traduce a los siguientes idiomas (usa los códigos ISO proporcionados): ${idiomasObjetivo.join(', ')}.
    Responde EXCLUSIVAMENTE con un objeto JSON válido. No incluyas texto fuera del JSON. 
    Usa los códigos ISO como claves. Ejemplo de formato de respuesta esperado: {"de": "Nombre // Uva", "fr": "Nom Français"}`,

    // ---------------------------------------------------------
    // Usado en ui.js > iniciarTraduccionPorLotes() [Flujo Piloto ES/EN]
    // Genera: nombre en inglés (si falta) + descripción y 3 preguntas/
    // respuestas en ES y EN. Sin maridajes de vino. Alérgenos blindados
    // en q3/r3 con fidelidad total pero redacción natural y variable.
    // ---------------------------------------------------------
    piloto: (nombreEs, tieneAlergenos, alergenosValor) => `Actúa como un responsable de carta de restaurante de alta gama. Define el siguiente plato de forma clara, natural, concisa y profesional, basándote ÚNICAMENTE en el nombre del plato proporcionado. 

REGLAS DE ESTILO OBLIGATORIAS:
- CERO saludos informales o muletillas. Ve directo al grano.
- Evita lenguaje gourmet pomposo y adjetivos vacíos ("exquisito", "delicioso", "auténtico", "delicado").

REGLA DE PRECISIÓN OBLIGATORIA (LA MÁS IMPORTANTE):
- Usa EXCLUSIVAMENTE la información que aparece en el nombre del plato. NO inventes ni asumas datos que no estén ahí escritos: nada de variedad o raza concreta de un ingrediente (ej. "atún de aleta amarilla", "ternera de pasto", "gamba de Huelva"), origen o procedencia, temperatura de servicio (frío/caliente/templado), grado de cocción, tiempos, tamaño de ración, ni acompañamientos no mencionados.
- Si el nombre ya incluye una técnica culinaria (ej. "tataki", "a la brasa", "al horno Josper", "frito", "carpaccio"), puedes explicar en qué consiste esa técnica EN GENERAL, pero sin afirmar detalles concretos de cómo se ha aplicado a este plato en particular si no están en el nombre.
- Si no puedes responder una pregunta con datos verificables del propio nombre del plato, cambia la pregunta por otra que sí puedas responder con seguridad (p. ej. qué significa un término del nombre, o una pregunta orientada a alérgenos).

PREGUNTAS LÓGICAS: q1 y q2 deben tratar exclusivamente sobre el significado de términos culinarios ya presentes en el nombre del plato, la técnica de cocinado (explicada de forma genérica) o los ingredientes ya mencionados — nunca sobre datos no verificables como origen, raza, o temperatura de servicio.
- PROHIBICIÓN ABSOLUTA: NUNCA sugieras maridajes de vino ni menciones bebidas (cerveza, vino, sake, etc.). No incluyas preguntas sobre maridaje.

REGLA ESTRICTA DE ALÉRGENOS (q3 y r3):
${tieneAlergenos ? `- q3 debe ser una pregunta relacionada con alérgenos o necesidades alimentarias, pero NO uses siempre la misma frase literal: varía la redacción de un plato a otro (ej. "¿Contiene este plato algún alérgeno?", "¿Es apto si tengo alguna alergia alimentaria?", "¿Puedo saber si este plato es seguro para mí?", "¿Qué debo tener en cuenta si tengo restricciones alimentarias?", u otra formulación natural equivalente).
- r3 debe ser una frase natural y breve (no una lista de códigos en mayúsculas) que mencione TODOS y CADA UNO de los siguientes alérgenos, ni uno más ni uno menos, traducidos a su nombre común en el idioma correspondiente: ${alergenosValor}. 
- PROHIBIDO en r3: pegar el texto en bruto tal cual viene ("${alergenosValor}"), inventar alérgenos que no estén en esa lista, u omitir alguno de los listados. Es información de seguridad alimentaria: la fidelidad total con la lista es obligatoria, solo cambia la forma de redactarlo (natural, en frase), nunca el contenido.` : `- Si no hay alérgenos registrados, formula q3/r3 sobre otro aspecto culinario verificable del plato (ver regla de precisión).`}

Plato ES: "${nombreEs}"

Genera un JSON estricto sin markdown con esta estructura exacta:
{
  "nombre_en": "...",
  "es": { 
    "desc": "...", 
    "q1": "...", 
    "r1": "...", 
    "q2": "...", 
    "r2": "..." 
    ${tieneAlergenos ? `, "q3": "...", "r3": "..."` : ""} 
  },
  "en": { 
    "desc": "...", 
    "q1": "...", 
    "r1": "...", 
    "q2": "...", 
    "r2": "..." 
    ${tieneAlergenos ? `, "q3": "...", "r3": "..."` : ""} 
  }
}`

};
