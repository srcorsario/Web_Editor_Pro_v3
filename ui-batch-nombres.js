// =========================================
// REPOSITORIO: Web_Editor_Pro_v3 (PRINCIPAL)
// ARCHIVO: ui-batch-nombres.js
// FASE 2: Traducción por lotes de NOMBRE_ES al resto de idiomas (incluido el
// inglés si también falta), vía Gemini.
// Botón: "Traducir Platos en ES a Todos los Idiomas Faltantes".
// =========================================

import { stateContainer, procesoState, asegurarColumnasEstructura } from './ui-state.js';

export const UIBatchNombres = {
    // ==========================================
    // FASE 2 - TRADUCCIÓN AUTOMÁTICA DE NOMBRES AL RESTO DE IDIOMAS
    // Reutiliza el mismo prompt (window.PROMPTS.autoTraduccionResto) y la misma
    // lógica que ya usaba el botón manual de un solo plato (ejecutarTraduccionAutomatica
    // en app.js), pero recorriendo TODOS los platos pendientes en bloques
    // (tamaño configurable vía TRADUCCION_TAMANO_LOTE en config.js).
    // NUEVO: el inglés (NOMBRE_EN) ya no está excluido — "Todos los Idiomas
    // Faltantes" incluye el inglés si también está vacío. Si NOMBRE_EN ya tiene
    // valor, se sigue usando como referencia para el resto de idiomas (igual que
    // antes); si está vacío, se traduce en la misma llamada que el resto.
    // ==========================================
    iniciarTraduccionNombresPorLotes: async (stateContainerParam) => {
        procesoState.detenido = false; procesoState.pausado = false;
        const listaClavesAPI = (typeof getKeys === 'function') ? getKeys() : [];
        if (listaClavesAPI.length === 0) return window.UI.log("[Error] Introduzca al menos una API Key.");
        const activeStateContainer = stateContainerParam || stateContainer;
        if (!activeStateContainer || !activeStateContainer.headers || !activeStateContainer.csvData) return window.UI.log("[Error] Estructura de datos vacía.");

        window.UI.log("[Info] Asegurando estructura de columnas en memoria...");
        asegurarColumnasEstructura(activeStateContainer);

        const selectorInicio = document.getElementById('rangoInicio');
        const selectorFin = document.getElementById('rangoFin');
        const rangoInicio = selectorInicio ? (parseInt(selectorInicio.value) - 2 || 0) : 0;
        const rangoFin = selectorFin ? (parseInt(selectorFin.value) - 1 || activeStateContainer.csvData.length) : activeStateContainer.csvData.length;

        const idiomasBase = (window.IDIOMAS_ORDEN && window.IDIOMAS_ORDEN.length) ? window.IDIOMAS_ORDEN : Object.keys(window.IDIOMAS_CONFIG || {}).map(l => l.toLowerCase());
        // NUEVO: solo se excluye ES (el idioma origen); EN ya se traduce como uno más si falta.
        const idiomasObjetivo = idiomasBase.filter(l => l !== 'es');

        const indiceCastellanoBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');
        const indiceInglesBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_EN');
        const indiceId = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'ID');
        const indiceCarpeta = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'CARPETA');

        if (indiceCastellanoBase === -1 || indiceInglesBase === -1) {
            return window.UI.log("[Error Crítico] Faltan columnas base obligatorias (NOMBRE_ES o NOMBRE_EN).");
        }

        // Índice de la columna NOMBRE_<idioma> de cada idioma objetivo.
        const indicesObjetivo = {};
        idiomasObjetivo.forEach(l => {
            indicesObjetivo[l] = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === `NOMBRE_${l.toUpperCase()}`);
        });

        const techoLimiteEvaluacion = Math.min(rangoFin, activeStateContainer.csvData.length);
        const CARPETAS_SIN_IA = ['cafe', 'refrescos', 'cerveza'];
        const TAMANO_LOTE = (typeof window.TRADUCCION_TAMANO_LOTE === 'number' && window.TRADUCCION_TAMANO_LOTE > 0) ? window.TRADUCCION_TAMANO_LOTE : 3;

        // Construir la lista de filas a las que les falta la traducción de al menos un idioma objetivo.
        const filasPendientes = [];
        for (let i = Math.max(0, rangoInicio); i < techoLimiteEvaluacion; i++) {
            const row = activeStateContainer.csvData[i];
            while (row.length < activeStateContainer.headers.length) row.push("");

            const idValor = indiceId !== -1 ? parseInt(row[indiceId]) : NaN;
            const carpetaValor = indiceCarpeta !== -1 ? (row[indiceCarpeta] || "").trim().toLowerCase() : "";
            const esCabeceraCategoria = !isNaN(idValor) && idValor >= 1 && idValor <= 12;
            const esBebidaSimple = CARPETAS_SIN_IA.includes(carpetaValor);
            if (esCabeceraCategoria || esBebidaSimple) continue;

            const nombreEs = row[indiceCastellanoBase] || "";
            if (!nombreEs) continue;

            const faltaAlgunIdioma = idiomasObjetivo.some(l => indicesObjetivo[l] !== -1 && !(row[indicesObjetivo[l]] || "").trim());
            if (faltaAlgunIdioma) filasPendientes.push(i);
        }

        window.UI.log(`[Paso 2] Traduciendo nombres al resto de idiomas (${idiomasObjetivo.length} idiomas) en bloques de ${TAMANO_LOTE}. Platos pendientes: ${filasPendientes.length}.`);

        let platosCompletados = 0, cuotaAgotada = false;

        for (let lote = 0; lote < filasPendientes.length; lote += TAMANO_LOTE) {
            if (procesoState.detenido || cuotaAgotada) break;
            while (procesoState.pausado) await new Promise(resolve => setTimeout(resolve, 500));

            const indicesLote = filasPendientes.slice(lote, lote + TAMANO_LOTE);
            window.UI.log(`[Lote ${Math.floor(lote / TAMANO_LOTE) + 1}/${Math.ceil(filasPendientes.length / TAMANO_LOTE)}] Procesando filas ${indicesLote.map(i => i + 2).join(', ')}...`);

            // Preparar los datos de cada plato del lote (sin llamar aún a la IA)
            const itemsLote = indicesLote.map(i => {
                const row = activeStateContainer.csvData[i];
                const nombreEs = row[indiceCastellanoBase] || "";
                const nombreEn = row[indiceInglesBase] || "";
                const carpetaValor = indiceCarpeta !== -1 ? (row[indiceCarpeta] || "").trim().toLowerCase() : "";
                const esVino = carpetaValor === 'vinos';

                const desglosadoEs = (typeof window.desglosarNombre === 'function') ? window.desglosarNombre(nombreEs) : { nombre: nombreEs, uvas: "" };
                const desglosadoEn = (typeof window.desglosarNombre === 'function') ? window.desglosarNombre(nombreEn) : { nombre: nombreEn, uvas: "" };
                const textoCompletoEs = (desglosadoEs.nombre + (desglosadoEs.uvas ? ' // ' + desglosadoEs.uvas : '')).replace(/"/g, "'");
                const textoCompletoEn = (desglosadoEn.nombre + (desglosadoEn.uvas ? ' // ' + desglosadoEn.uvas : '')).replace(/"/g, "'");

                return { fila: i, row, esVino, textoCompletoEs, textoCompletoEn };
            }).filter(it => it.textoCompletoEs);

            if (itemsLote.length === 0) continue;

            // CORREGIDO: una única llamada a Gemini para TODO el lote (antes se hacía una llamada
            // por plato en paralelo, lo que multiplicaba el consumo de cuota/tokens por 3 en vez de
            // amortizar las instrucciones del prompt entre los 3 platos, como se hacía originalmente).
            const promptTraduccion = window.PROMPTS.autoTraduccionRestoLote(itemsLote, idiomasObjetivo.map(l => l.toUpperCase()));

            let satisfecho = false;
            let intentosLote = 0;
            let limitesConsecutivos = 0; // contador de 429 seguidos SIN ningún éxito entre medio
            const maxIntentosLote = Math.max(3, listaClavesAPI.length * 2);

            while (!satisfecho && !procesoState.detenido && intentosLote < maxIntentosLote) {
                try {
                    const callResponse = await fetch(`${window.GEMINI_ENDPOINT_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'}?key=${listaClavesAPI[procesoState.currentKeyIndex]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptTraduccion }] }], generationConfig: { maxOutputTokens: window.GEMINI_MAX_OUTPUT_TOKENS || 65536 } }) });

                    const textResponse = await callResponse.text();
                    let respuestaJsonData;
                    try {
                        respuestaJsonData = JSON.parse(textResponse);
                    } catch (e) {
                        throw new Error("La API devolvió HTML o texto plano (Posible 403 o error de cuota).");
                    }

                    if (respuestaJsonData.error?.code === 429) {
                        procesoState.currentKeyIndex = (procesoState.currentKeyIndex + 1) % listaClavesAPI.length;
                        limitesConsecutivos++;
                        if (limitesConsecutivos >= listaClavesAPI.length) {
                            window.UI.log(`[Error Crítico] Cuota de Gemini agotada en TODAS las keys disponibles (${listaClavesAPI.length}). Deteniendo el proceso para no malgastar más peticiones.`);
                            cuotaAgotada = true;
                            break;
                        }
                        window.UI.log(`[Aviso] Límite superado en el lote (filas ${itemsLote.map(it => it.fila + 2).join(', ')}). Rotando Key (${limitesConsecutivos}/${listaClavesAPI.length})...`);
                        await new Promise(r => setTimeout(r, 4000));
                        intentosLote++;
                        continue;
                    }

                    const textoLimpioIA = respuestaJsonData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!textoLimpioIA) throw new Error("La API no devolvió contenido.");

                    const traduccionesLote = (typeof window.extraerJSON === 'function')
                        ? window.extraerJSON(textoLimpioIA)
                        : JSON.parse(textoLimpioIA.replace(/```json/g, '').replace(/```/g, '').trim());

                    itemsLote.forEach((it, idx) => {
                        const traducciones = traduccionesLote[String(idx)] || traduccionesLote[idx];
                        if (!traducciones) return;
                        let algunoAplicado = false;
                        idiomasObjetivo.forEach(l => {
                            if (indicesObjetivo[l] === -1) return;
                            if ((it.row[indicesObjetivo[l]] || "").trim()) return; // ya tenía valor: no lo tocamos
                            const lUpper = l.toUpperCase();
                            const valorTraducido = traducciones[lUpper] || traducciones[l];
                            if (!valorTraducido) return;
                            const desglosadoTraduccion = (typeof window.desglosarNombre === 'function') ? window.desglosarNombre(valorTraducido) : { nombre: valorTraducido, uvas: "" };
                            let nombreFinal = desglosadoTraduccion.nombre;
                            if (it.esVino && typeof window.formatWineName === 'function') nombreFinal = window.formatWineName(nombreFinal);
                            it.row[indicesObjetivo[l]] = desglosadoTraduccion.uvas ? `${nombreFinal} // ${desglosadoTraduccion.uvas}` : nombreFinal;
                            algunoAplicado = true;
                        });
                        if (algunoAplicado) platosCompletados++;
                    });
                    satisfecho = true;
                } catch (err) {
                    limitesConsecutivos = 0; // un error que no es 429 rompe la racha de "cuota agotada"
                    window.UI.log(`[Error Traducción Nombres] Lote (filas ${itemsLote.map(it => it.fila + 2).join(', ')}): ${err.message}`);
                    await new Promise(r => setTimeout(r, 3000));
                    procesoState.currentKeyIndex = (procesoState.currentKeyIndex + 1) % listaClavesAPI.length;
                    intentosLote++;
                }
            }

            if (cuotaAgotada) break;
            if (typeof window.UI.renderTable === 'function') window.UI.renderTable();
            await new Promise(r => setTimeout(r, 1000));
        }

        const totalPendiente = filasPendientes.length - platosCompletados;
        if (cuotaAgotada) {
            window.UI.log(`[FIN - CUOTA AGOTADA] Se detuvo el proceso por falta de cuota en la API. Completados: ${platosCompletados} platos. Pendientes: ${totalPendiente}. Vuelve a pulsar "Traducir Platos en ES a Todos los Idiomas Faltantes" más tarde para continuar solo con lo que falta.`);
        } else if (totalPendiente > 0) {
            window.UI.log(`[FIN - INCOMPLETO] Completados: ${platosCompletados} platos. Pendientes: ${totalPendiente} (revisa los errores anteriores). Puedes volver a pulsar "Traducir Platos en ES a Todos los Idiomas Faltantes" para reintentar solo lo pendiente.`);
        } else {
            window.UI.log(`[FIN] Traducción de nombres finalizada con éxito. Completados: ${platosCompletados} platos.`);
        }
    }
};
