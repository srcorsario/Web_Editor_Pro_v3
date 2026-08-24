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

// NUEVO: regla compartida contra un fallo real visto en producción — al generar texto en
// alemán (y potencialmente otros idiomas con comillas tipográficas propias: „", «», 「」...),
// Gemini a veces usa esas comillas COMO SI fueran el delimitador de la cadena JSON en vez de
// las comillas rectas ("), rompiendo el JSON aunque el contenido en sí esté bien formado
// (finishReason STOP, respuesta completa — el fallo es puramente de sintaxis JSON). Se añade a
// TODOS los prompts que piden salida JSON, no solo al que lo disparó (infoOtrosIdiomasLote),
// porque cualquier prompt que genere texto en esos idiomas corre el mismo riesgo.
const REGLA_COMILLAS_JSON = 'REGLA DE FORMATO JSON (obligatoria): usa SIEMPRE comillas dobles rectas (") como delimitador de cada cadena del JSON, en TODOS los idiomas de la respuesta — nunca uses comillas tipográficas o angulares propias de un idioma (p.ej. „ " " « » 「」) como delimitador de una cadena JSON, aunque sean las comillas habituales de ese idioma. Si necesitas citar un término dentro del texto, usa las comillas propias de ese idioma como texto normal DENTRO de la cadena (nunca sustituyendo el delimitador), y si necesitas usar comillas rectas dentro del texto, escápalas con barra invertida (\\").';

window.PROMPTS = {

    // ---------------------------------------------------------
    // Usado en app.js > generarTraduccionEN()
    // Genera 3 opciones de traducción al inglés del nombre del plato/vino.
    // ---------------------------------------------------------
    opcionesEN: (textoCompletoEs, esVino) => `Actúa como un translator profesional de menús de restaurantes. Te paso un elemento en español: "${textoCompletoEs}".
    ${textoCompletoEs.includes('//') ? `El separador "//" distingue el nombre ${esVino ? 'del vino' : 'del plato'} de ${esVino ? 'la variedad de uva o detalles' : 'una segunda línea de ingredientes/opciones'} que le sigue. Debes traducir ambas partes y mantener el separador "//" en el resultado, EXACTAMENTE con esos dos caracteres "//" (nunca lo sustituyas por un guion "-", dos puntos ":", una pleca "|", una coma u otro signo de puntuación, aunque te parezca más natural en ese idioma), en la misma posición. Ejemplo de formato correcto: "Nombre traducido //Segunda parte traducida".
    ATENCIÓN — CUENTA CUÁNTAS VECES aparece "//" en el texto original ANTES de traducir: a veces hay MÁS DE UNA opción, cada una envuelta en su propio par "//...//" (p. ej. una lista de sabores o ingredientes a elegir). Debes reproducir EXACTAMENTE el mismo número de pares "//...//" que el original, traduciendo cada opción por separado — NUNCA te quedes solo con la primera opción y omitas el resto, y NUNCA fusiones varias opciones dentro de un único par "//...//". Ejemplo con varias opciones — ES: "Mix de Gyozas //Pato// , //Langostino// , //Pollo//" → correcto: "Gyoza Mix //Duck// , //Prawn// , //Chicken//" (¡las 3 opciones, cada una en su propio "//...//"!) — INCORRECTO: "Gyoza Mix //Duck//" (le faltan 2 opciones) o "Gyoza Mix //Duck, Prawn, Chicken//" (las fusionó en un solo par).` : ''}
    ${esVino ? 'El nombre del vino debe ir en MAYÚSCULAS, pero el contenido entre paréntesis (como la D.O.) debe mantener su formato original.' : ''}
    Necesito que me des EXACTAMENTE 3 opciones de traducción al inglés con diferentes enfoques para un menú:
    1. Traducción directa/literal.
    2. Traducción gastronómica/descriptiva (más elegante).
    3. Traducción corta/concisa (estilo menú).
    ${REGLA_COMILLAS_JSON}
    Responde EXCLUSIVAMENTE con un objeto JSON válido. No incluyas texto fuera del JSON. Las comillas dobles dentro de las traducciones deben estar escapadas con barra invertida (\").
    Estructura exacta: {"directa": "...", "gastronomica": "...", "corta": "..."}`,

    // ---------------------------------------------------------
    // Usado en app.js > ejecutarTraduccionAutomatica()
    // Traduce el nombre del plato/vino (ES + EN de referencia) al resto de idiomas.
    // ---------------------------------------------------------
    autoTraduccionResto: (textoCompletoEs, textoCompletoEn, esVino, idiomasObjetivo) => `Actúa como un traductor experto de menús de restaurantes. Traduce el siguiente elemento en español: "${textoCompletoEs}" ${textoCompletoEn ? `y su texto en Inglés como referencia: "${textoCompletoEn}"` : ""}.
    ${textoCompletoEs.includes('//') ? `El separador "//" distingue el nombre ${esVino ? 'del vino' : 'del plato'} de ${esVino ? 'la variedad de uva o detalles' : 'una segunda línea de ingredientes/opciones'} que le sigue. Debes traducir ambas partes y mantener el separador "//" en el resultado, EXACTAMENTE con esos dos caracteres "//" (nunca lo sustituyas por un guion "-", dos puntos ":", una pleca "|", una coma u otro signo de puntuación habitual de ese idioma, aunque te parezca más natural ahí), en la misma posición, en TODOS los idiomas sin excepción. Ejemplo de formato correcto: "Nombre traducido //Segunda parte traducida".
    ATENCIÓN — CUENTA CUÁNTAS VECES aparece "//" en el texto original ANTES de traducir: a veces hay MÁS DE UNA opción, cada una envuelta en su propio par "//...//" (p. ej. una lista de sabores o ingredientes a elegir, con varias apariciones de "//" seguidas). Debes reproducir EXACTAMENTE el mismo número de pares "//...//" que el original en CADA idioma de destino, traduciendo cada opción por separado — NUNCA te quedes solo con la primera opción y omitas el resto, y NUNCA fusiones varias opciones dentro de un único par "//...//". Ejemplo con varias opciones — ES: "Mix de Gyozas //Pato// , //Langostino// , //Pollo//" → correcto (en cualquier idioma): "Gyoza Mix //Duck// , //Prawn// , //Chicken//" (¡las 3 opciones, cada una en su propio "//...//"!) — INCORRECTO: "Gyoza Mix //Duck//" (le faltan 2 opciones) o "Gyoza Mix //Duck, Prawn, Chicken//" (las fusionó en un solo par).` : ''}
    ${esVino ? 'El nombre del vino debe ir en MAYÚSCULAS, pero el contenido entre paréntesis (ej: EL COTO (D.O. Rioja)) debe mantener su formato original en todos los idiomas.' : ''}

REGLA DE FIDELIDAD TERMINOLÓGICA (obligatoria): si el nombre en español usa un término específico de especie, corte o variedad (ej. "atún rojo" frente a atún blanco/bonito, "ternera" frente a buey/vacuno adulto, "gamba" frente a langostino), tradúcelo SIEMPRE por el término equivalente exacto en cada idioma de destino — nunca lo sustituyas por una especie, corte o variedad distinta aunque sea similar o más común en ese idioma. En concreto, "ternera" en esta carta es siempre carne roja de vacuno ADULTO (nunca ternera lechal/joven ni vaca vieja): tradúcela como "beef" en inglés, nunca como "veal".

REGLA DE CONSISTENCIA CON EL INGLÉS DE REFERENCIA: si el texto en inglés ya ha optado por un término distinto de la traducción literal del español (por ejemplo, "beef" en vez de "veal" para "ternera"), sigue ese MISMO criterio en todos los idiomas de destino en vez de traducir literalmente desde el español. Si no hay texto en inglés de referencia porque también se está generando en esta misma llamada, aplica igualmente el criterio de la regla anterior ("ternera"="beef", etc.) al generar el propio inglés, para que quede alineado con el resto de idiomas desde el principio.

REGLA DE TÉRMINOS TÉCNICOS/EXTRANJEROS (ej. AOJISO, AOVE, siglas, técnicas en otro idioma ya presentes en el nombre): mantenlos SIN traducir su significado en todos los idiomas que usan alfabeto latino (cirílico, griego, etc. incluidos: transcríbelos fonéticamente, no los sustituyas por su significado). Solo en idiomas sin alfabeto fonético equivalente claro (ej. chino, japonés, coreano, árabe) puedes optar por la transcripción fonética habitual del término en ese idioma; evita traducir su significado salvo que sea el término nativo real de ese idioma (p. ej. si el término ya es una palabra japonesa y traduces al japonés).

Traduce a los siguientes idiomas (usa los códigos ISO proporcionados): ${idiomasObjetivo.join(', ')}.
    ${REGLA_COMILLAS_JSON}
    Responde EXCLUSIVAMENTE con un objeto JSON válido. No incluyas texto fuera del JSON.
    Usa los códigos ISO EN MAYÚSCULAS como claves, tal cual se han listado arriba. Ejemplo de formato de respuesta esperado: {"DE": "Nombre // Uva", "FR": "Nom Français"}`,

    // ---------------------------------------------------------
    // Usado en ui.js > iniciarTraduccionNombresPorLotes() [Fase 2: traducción de nombres en bloque]
    // Traduce varios platos/vinos EN UNA SOLA LLAMADA a la IA (ahorra tokens de instrucciones
    // repetidas y reduce el número de peticiones frente a la cuota de la API).
    // ---------------------------------------------------------
    autoTraduccionRestoLote: (itemsArray, idiomasObjetivo) => `Actúa como un traductor experto de menús de restaurantes. Te paso una lista de ${itemsArray.length} elementos en español (con su texto en inglés de referencia cuando esté disponible). Traduce CADA UNO de ellos a los siguientes idiomas (usa los códigos ISO proporcionados): ${idiomasObjetivo.join(', ')}.

Si el nombre de un elemento contiene el separador "//": distingue el nombre de una segunda parte que le sigue (en vinos, la variedad de uva o detalles; en platos, una segunda línea de ingredientes/opciones). Traduce ambas partes y mantén el separador "//" en el resultado, EXACTAMENTE con esos dos caracteres "//" (NUNCA lo sustituyas por un guion "-", dos puntos ":", una pleca "|", una coma u otro signo de puntuación habitual de ese idioma, aunque te parezca más natural ahí), en la misma posición — esto aplica a CUALQUIER elemento que tenga "//" en su texto, sea plato o vino, y en TODOS los idiomas de destino sin excepción. Ejemplo de formato correcto (aplícalo igual en cualquier idioma de la lista): "Nombre traducido //Segunda parte traducida".

ATENCIÓN — ELEMENTOS CON VARIAS OPCIONES (MUY IMPORTANTE): cuenta cuántas veces aparece "//" en CADA elemento antes de traducirlo. Algunos elementos tienen MÁS DE UNA opción, cada una envuelta en su propio par "//...//" y separadas entre sí por comas u otro texto (p. ej. una lista de sabores o rellenos a elegir, con varias apariciones seguidas de "//"). Para esos elementos debes reproducir EXACTAMENTE el mismo número de pares "//...//" que trae el original, en CADA idioma de destino, traduciendo cada opción por separado — NUNCA te quedes solo con la primera opción y omitas el resto, y NUNCA fusiones varias opciones dentro de un único par "//...//". Ejemplo con varias opciones — ES: "Mix de Gyozas //Pato// , //Langostino// , //Pollo//" → correcto (en cualquier idioma): "Gyoza Mix //Duck// , //Prawn// , //Chicken//" (las 3 opciones, cada una en su propio "//...//") — INCORRECTO: "Gyoza Mix //Duck//" (le faltan 2 opciones) o "Gyoza Mix //Duck, Prawn, Chicken//" (las fusionó en un solo par). Esta regla aplica IGUAL a cada elemento de la lista de forma independiente, según el número de "//" que tenga SU PROPIO texto en español.

Para los elementos marcados como [VINO], además: el nombre del vino debe ir en MAYÚSCULAS, pero el contenido entre paréntesis (ej: EL COTO (D.O. Rioja)) debe mantener su formato original en todos los idiomas.

REGLA DE FIDELIDAD TERMINOLÓGICA (obligatoria, la más importante): si el nombre en español usa un término específico de especie, corte o variedad (ej. "atún rojo" frente a atún blanco/bonito, "ternera" frente a buey/vacuno adulto, "gamba" frente a langostino), tradúcelo SIEMPRE por el término equivalente exacto en cada idioma de destino — nunca lo sustituyas por una especie, corte o variedad distinta aunque sea similar o más habitual en ese idioma. Esto es especialmente crítico en pescados/mariscos y tipos de carne, donde confundir la especie es un error grave de carta. En concreto, "ternera" en esta carta es siempre carne roja de vacuno ADULTO (nunca ternera lechal/joven ni vaca vieja): tradúcela como "beef" en inglés, nunca como "veal".

REGLA DE CONSISTENCIA CON EL INGLÉS DE REFERENCIA: cuando el texto en inglés de un elemento ya haya optado por un término distinto de la traducción literal del español (por ejemplo, "beef" en vez de "veal" para "ternera"), sigue ese MISMO criterio en todos los idiomas de destino para ese elemento, en vez de traducir literalmente desde el español. Si un elemento no trae texto en inglés de referencia porque también se está generando en esta misma llamada (el inglés es uno de los idiomas objetivo de la lista), aplica igualmente el criterio de la regla anterior al generar el propio inglés de ese elemento, para que quede alineado con el resto de idiomas desde el principio.

REGLA DE TÉRMINOS TÉCNICOS/EXTRANJEROS (ej. AOJISO, AOVE, siglas, técnicas ya presentes en el nombre en otro idioma): mantenlos SIN traducir su significado en todos los idiomas que usan alfabeto latino, cirílico o griego (transcríbelos fonéticamente si hace falta, nunca los sustituyas por su significado). Solo en idiomas sin ese alfabeto (chino, japonés, coreano, árabe...) puedes usar la transcripción fonética habitual del término en ese idioma; no traduzcas su significado salvo que el término ya sea una palabra nativa de ese idioma concreto.
- No mezcles la terminología de un elemento con la de otro: cada elemento de la lista es independiente y debe evaluarse solo con sus propios datos (ES/EN).

Elementos a traducir (el número al inicio de cada línea es su índice, empezando en 0):
${itemsArray.map((it, idx) => `${idx}. ${it.esVino ? '[VINO] ' : ''}ES: "${it.textoCompletoEs}"${it.textoCompletoEn ? ` | EN: "${it.textoCompletoEn}"` : ''}`).join('\n')}

${REGLA_COMILLAS_JSON}
Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto fuera del JSON ni markdown. La clave de primer nivel debe ser el índice numérico del elemento tal cual aparece arriba (como string), y dentro de cada uno, usa los códigos ISO en MAYÚSCULAS como claves.
Estructura exacta esperada (ejemplo con 2 elementos y 2 idiomas): {"0": {"DE": "Nombre // Uva", "FR": "Nom // Cépage"}, "1": {"DE": "...", "FR": "..."}}`,

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

REGLA DE TERMINOLOGÍA CÁRNICA/ESPECIE EN EL NOMBRE EN INGLÉS (nombre_en) Y EN EL TEXTO "en": en esta carta, "ternera" se refiere siempre a carne roja de vacuno ADULTO (ni ternera lechal/muy joven, ni vaca vieja) — tradúcela SIEMPRE como "beef", NUNCA como "veal" (en inglés "veal" designa específicamente la ternera lechal muy joven, un producto distinto al que se sirve aquí). Aplica el mismo criterio de fidelidad a cualquier otra especie o variedad ambigua que aparezca en el nombre (ej. "atún rojo" no es atún blanco/bonito y debe traducirse como ese pescado concreto, no por una especie distinta aunque sea similar): nunca cambies la especie, corte o variedad al traducir al inglés.

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
}`,

    // ---------------------------------------------------------
    // Usado en ui.js > iniciarTraduccionPorLotes() [Vinos: solo descripción, sin Q&A]
    // Genera únicamente una descripción breve, en ES y EN, para un vino.
    // ---------------------------------------------------------
    vino: (nombreVino) => `Actúa como sumiller redactando una ficha breve de carta de vinos. Redacta una descripción breve (máximo 2 frases cortas) del siguiente vino, basándote ÚNICAMENTE en el nombre proporcionado (que puede incluir denominación de origen tras un guion, y variedad de uva tras el separador "//").

REGLAS OBLIGATORIAS:
- Estilo sencillo y directo, sin adjetivos vacíos ni lenguaje grandilocuente ("exquisito", "excepcional", "auténtico").
- Si el nombre incluye una D.O./D.O.P./I.G.P., puedes mencionarla. Si incluye variedad de uva, puedes describir el perfil de sabor GENÉRICO y conocido de esa variedad (ej. lo típico de un Monastrell o un Chardonnay en general), pero sin inventar notas de cata específicas de esta añada/botella concretas que no puedas conocer.
- PROHIBIDO: inventar año de cosecha, premios, puntuaciones, tiempo de crianza, o cualquier dato que no esté literalmente en el nombre proporcionado.
- PROHIBIDO: sugerir maridajes con platos o comida concreta.

Vino ES: "${nombreVino}"

Genera un JSON estricto sin markdown con esta estructura exacta:
{
  "nombre_en": "...",
  "es": { "desc": "..." },
  "en": { "desc": "..." }
}`,

    // ---------------------------------------------------------
    // Usado en ui.js > iniciarTraduccionPorLotes() [Flujo Piloto ES/EN EN BLOQUE]
    // Igual que piloto(), pero para varios platos EN UNA SOLA LLAMADA a la IA
    // (ahorra tokens de instrucciones repetidas y reduce peticiones frente a la cuota).
    // ---------------------------------------------------------
    pilotoLote: (itemsArray) => `Actúa como un responsable de carta de restaurante de alta gama. Te paso una lista de ${itemsArray.length} platos. Para CADA UNO, define su información de forma clara, natural, concisa y profesional, basándote ÚNICAMENTE en el nombre de ese plato.

REGLAS DE ESTILO OBLIGATORIAS:
- CERO saludos informales o muletillas. Ve directo al grano.
- Evita lenguaje gourmet pomposo y adjetivos vacíos ("exquisito", "delicioso", "auténtico", "delicado").

REGLA DE PRECISIÓN OBLIGATORIA (LA MÁS IMPORTANTE):
- Usa EXCLUSIVAMENTE la información que aparece en el nombre de cada plato. NO inventes ni asumas datos que no estén ahí escritos: nada de variedad o raza concreta de un ingrediente (ej. "atún de aleta amarilla", "ternera de pasto", "gamba de Huelva"), origen o procedencia, temperatura de servicio (frío/caliente/templado), grado de cocción, tiempos, tamaño de ración, ni acompañamientos no mencionados.
- Si el nombre ya incluye una técnica culinaria (ej. "tataki", "a la brasa", "al horno Josper", "frito", "carpaccio"), puedes explicar en qué consiste esa técnica EN GENERAL, pero sin afirmar detalles concretos de cómo se ha aplicado a ese plato en particular si no están en el nombre.
- Si no puedes responder una pregunta con datos verificables del propio nombre del plato, cambia la pregunta por otra que sí puedas responder con seguridad (p. ej. qué significa un término del nombre, o una pregunta orientada a alérgenos).

REGLA DE TERMINOLOGÍA CÁRNICA/ESPECIE EN EL NOMBRE EN INGLÉS (nombre_en) Y EN EL TEXTO "en" DE CADA PLATO: en esta carta, "ternera" se refiere siempre a carne roja de vacuno ADULTO (ni ternera lechal/muy joven, ni vaca vieja) — tradúcela SIEMPRE como "beef", NUNCA como "veal" (en inglés "veal" designa específicamente la ternera lechal muy joven, un producto distinto al que se sirve aquí). Aplica el mismo criterio de fidelidad a cualquier otra especie o variedad ambigua que aparezca en el nombre de un plato (ej. "atún rojo" no es atún blanco/bonito y debe traducirse como ese pescado concreto, no por una especie distinta aunque sea similar): nunca cambies la especie, corte o variedad al traducir al inglés, en ningún plato de la lista.

PREGUNTAS LÓGICAS: q1 y q2 deben tratar exclusivamente sobre el significado de términos culinarios ya presentes en el nombre del plato, la técnica de cocinado (explicada de forma genérica) o los ingredientes ya mencionados — nunca sobre datos no verificables como origen, raza, o temperatura de servicio.
- PROHIBICIÓN ABSOLUTA: NUNCA sugieras maridajes de vino ni menciones bebidas (cerveza, vino, sake, etc.). No incluyas preguntas sobre maridaje.

REGLA ESTRICTA DE ALÉRGENOS (q3 y r3) — se indica por plato en la lista de abajo si tiene alérgenos registrados:
- Si un plato SÍ tiene alérgenos indicados: q3 debe ser una pregunta relacionada con alérgenos o necesidades alimentarias (varía la redacción de un plato a otro, no uses siempre la misma frase). r3 debe ser una frase natural y breve (no una lista de códigos en mayúsculas) que mencione TODOS y CADA UNO de los alérgenos indicados para ese plato, ni uno más ni uno menos, traducidos a su nombre común en el idioma correspondiente. PROHIBIDO pegar el texto en bruto de los códigos tal cual, inventar alérgenos que no estén en la lista de ese plato, u omitir alguno. Es información de seguridad alimentaria: la fidelidad total es obligatoria, solo cambia la redacción.
- Si un plato NO tiene alérgenos indicados: formula su q3/r3 sobre otro aspecto culinario verificable de ESE plato (ver regla de precisión), nunca sobre alérgenos.
- No mezcles alérgenos de un plato con los de otro: cada plato de la lista es independiente.

Platos a procesar (el número al inicio de cada línea es su índice, empezando en 0):
${itemsArray.map((it, idx) => `${idx}. ES: "${it.nombreEs}"${it.tieneAlergenos ? ` | Alérgenos de ESTE plato a mencionar en su q3/r3: ${it.alergenosValor}` : ' | Sin alérgenos registrados para este plato'}`).join('\n')}

${REGLA_COMILLAS_JSON}
Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto fuera del JSON ni markdown. La clave de primer nivel debe ser el índice numérico del plato tal cual aparece arriba (como string).
Estructura exacta esperada (ejemplo con 2 platos):
{
  "0": { "nombre_en": "...", "es": { "desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "...", "q3": "...", "r3": "..." }, "en": { "desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "...", "q3": "...", "r3": "..." } },
  "1": { "nombre_en": "...", "es": { "desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "...", "q3": "...", "r3": "..." }, "en": { "desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "...", "q3": "...", "r3": "..." } }
}`,

    // ---------------------------------------------------------
    // Usado en ui.js > iniciarTraduccionPorLotes() [Vinos EN BLOQUE: solo descripción, sin Q&A]
    // Igual que vino(), pero para varios vinos EN UNA SOLA LLAMADA a la IA.
    // ---------------------------------------------------------
    vinoLote: (itemsArray) => `Actúa como sumiller redactando fichas breves de carta de vinos. Te paso una lista de ${itemsArray.length} vinos. Para CADA UNO, redacta una descripción breve (máximo 2 frases cortas), basándote ÚNICAMENTE en el nombre proporcionado (que puede incluir denominación de origen tras un guion, y variedad de uva tras el separador "//").

REGLAS OBLIGATORIAS:
- Estilo sencillo y directo, sin adjetivos vacíos ni lenguaje grandilocuente ("exquisito", "excepcional", "auténtico").
- Si el nombre incluye una D.O./D.O.P./I.G.P., puedes mencionarla. Si incluye variedad de uva, puedes describir el perfil de sabor GENÉRICO y conocido de esa variedad (ej. lo típico de un Monastrell o un Chardonnay en general), pero sin inventar notas de cata específicas de esta añada/botella concretas que no puedas conocer.
- PROHIBIDO: inventar año de cosecha, premios, puntuaciones, tiempo de crianza, o cualquier dato que no esté literalmente en el nombre proporcionado.
- PROHIBIDO: sugerir maridajes con platos o comida concreta.
- No mezcles datos de un vino con los de otro: cada vino de la lista es independiente.

Vinos a procesar (el número al inicio de cada línea es su índice, empezando en 0):
${itemsArray.map((it, idx) => `${idx}. ES: "${it.nombreVino}"`).join('\n')}

${REGLA_COMILLAS_JSON}
Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto fuera del JSON ni markdown. La clave de primer nivel debe ser el índice numérico del vino tal cual aparece arriba (como string).
Estructura exacta esperada (ejemplo con 2 vinos):
{
  "0": { "nombre_en": "...", "es": { "desc": "..." }, "en": { "desc": "..." } },
  "1": { "nombre_en": "...", "es": { "desc": "..." }, "en": { "desc": "..." } }
}`,

    // ---------------------------------------------------------
    // Usado en ui.js > iniciarInfoOtrosIdiomasPorLotes() [Fase 3: traduce el
    // JSON de INFO_ES (descripción + preguntas/respuestas) ya generado al
    // resto de idiomas objetivo, EN BLOQUE (varios platos/vinos por llamada).
    // Es una TRADUCCIÓN fiel del contenido ya existente en INFO_ES, no una
    // generación nueva: no debe inventar ni cambiar el contenido, solo
    // traducirlo manteniendo exactamente las mismas claves JSON.
    // ---------------------------------------------------------
    infoOtrosIdiomasLote: (itemsArray, idiomasObjetivo) => `Actúa como un traductor experto de menús de restaurantes. Te paso una lista de ${itemsArray.length} elementos, cada uno con su ficha en español ya redactada (descripción y, si las tiene, preguntas/respuestas) y, cuando esté disponible, su ficha en inglés como referencia. Tu única tarea es TRADUCIR fielmente cada ficha (basándote en la española) a los siguientes idiomas (usa los códigos ISO proporcionados): ${idiomasObjetivo.join(', ')}.

REGLAS OBLIGATORIAS:
- Es una traducción, no una redacción nueva: no añadas, quites ni inventes información que no esté ya en el texto en español. No cambies el sentido de ninguna pregunta o respuesta.
- Mantén EXACTAMENTE las mismas claves JSON que trae cada ficha en español (por ejemplo, si trae "desc", "q1", "r1", "q2", "r2", "q3", "r3", tradúcelas todas; si a un elemento le faltan q3/r3, no las añadas en la traducción).
- Si la ficha incluye alérgenos en r3, tradúcelos a su nombre común habitual en cada idioma de destino, sin omitir ninguno ni añadir otros.
- Estilo natural y profesional propio de una carta de restaurante en cada idioma, evitando traducciones literales torpes.

REGLA DE FIDELIDAD TERMINOLÓGICA (obligatoria): si el texto en español usa un término específico de especie, corte o variedad (ej. "atún rojo" frente a atún blanco/bonito, "ternera" frente a buey/vacuno adulto), tradúcelo SIEMPRE por el término equivalente exacto en cada idioma de destino — nunca lo sustituyas por una especie, corte o variedad distinta aunque sea similar o más habitual en ese idioma.

REGLA DE CONSISTENCIA CON EL INGLÉS DE REFERENCIA (crítica): cuando la ficha en inglés de un elemento ya haya optado por un término distinto de la traducción literal del español (por ejemplo, "beef" en vez de "veal" para "ternera"), sigue ese MISMO criterio en todos los idiomas de destino para ese elemento, en vez de traducir literalmente desde el español. Esto es imprescindible porque el NOMBRE del plato en cada idioma (que no ves aquí, pero ya existe en la carta) se tradujo siguiendo ese mismo criterio del inglés — si esta ficha usa un término distinto al del nombre del plato en ese idioma, quedaría inconsistente dentro de la propia carta.
- No mezcles la terminología de un elemento con la de otro: cada elemento de la lista es independiente.

Elementos a traducir (el número al inicio de cada línea es su índice, empezando en 0; la ficha en español de cada uno va en JSON tras "ES:", y la de inglés (si existe) tras "EN (referencia):"):
${itemsArray.map((it, idx) => `${idx}. ${it.esVino ? '[VINO] ' : ''}ES: ${JSON.stringify(it.infoEs)}${it.infoEn ? ` | EN (referencia): ${JSON.stringify(it.infoEn)}` : ''}`).join('\n')}

${REGLA_COMILLAS_JSON}
Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto fuera del JSON ni markdown. La clave de primer nivel debe ser el índice numérico del elemento tal cual aparece arriba (como string), y dentro de cada uno, usa los códigos ISO en MAYÚSCULAS como claves de segundo nivel, cada una con el mismo objeto de claves que la ficha en español de ese elemento.
Estructura exacta esperada (ejemplo con 1 elemento y 2 idiomas, ficha con desc+q1+r1+q2+r2):
{"0": {"DE": {"desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "..."}, "FR": {"desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "..."}}}`

};
