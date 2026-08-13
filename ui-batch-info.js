// =========================================
// REPOSITORIO: Web_Editor_Pro_v3 (PRINCIPAL)
// ARCHIVO: ui-batch-info.js
// FASE 1: Generación por lotes de INFO_ES / INFO_EN (descripción +
// preguntas/respuestas) y del nombre en inglés, vía Gemini.
// Botón: "Generar Info Platos ES/EN".
// =========================================

import { stateContainer, procesoState, asegurarColumnasEstructura } from './ui-state.js';

export const UIBatchInfo = {
    // ==========================================
    // FLUJO PILOTO (ES Y EN - CONTROL ESTRICTO Y BLINDADO DE ALÉRGENOS SIN MARIDAJE)
    // ==========================================
    iniciarTraduccionPorLotes: async (stateContainerParam) => {
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

        const indiceCastellanoBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');
        const indiceInglesBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_EN');
        const indiceInfoEs = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'INFO_ES');
        const indiceInfoIngles = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'INFO_EN');
        const indiceAlergenos = activeStateContainer.headers.findIndex(h => h && h.toUpperCase().replace(/[^A-Z]/g, '') === 'ALERGENOSCOD');
        const indiceId = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'ID');
        const indiceCarpeta = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'CARPETA');
        // NUEVO: huella de (NOMBRE_ES + ALERGENOS_COD) en el momento de generar la ficha —
        // usada por revisarConsistencia() (ui-batch-revision.js) para saber si el nombre o los
        // alérgenos han cambiado desde entonces y haría falta regenerar la ficha en todos los idiomas.
        const indiceHashFicha = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'INFO_HASH_FICHA');

        if (indiceCastellanoBase === -1 || indiceInglesBase === -1 || indiceInfoEs === -1 || indiceInfoIngles === -1) {
            return window.UI.log("[Error Crítico] Faltan columnas base obligatorias (NOMBRE_ES, NOMBRE_EN, INFO_ES o INFO_EN).");
        }

        const techoLimiteEvaluacion = Math.min(rangoFin, activeStateContainer.csvData.length);

        // Carpetas de bebidas simples que no necesitan descripción ni preguntas generadas por IA.
        const CARPETAS_SIN_IA = ['cafe', 'refrescos', 'cerveza'];
        const TAMANO_LOTE_INFO = (typeof window.INFO_EXTENDIDA_TAMANO_LOTE === 'number' && window.INFO_EXTENDIDA_TAMANO_LOTE > 0) ? window.INFO_EXTENDIDA_TAMANO_LOTE : 2;

        window.UI.log("[Paso 1] Generando contenido en Castellano e Inglés (ES / EN) sin maridajes y con alérgenos blindados. Vinos: solo descripción. Bebidas simples (café/refrescos/cerveza) y cabeceras de categoría: omitidas...");

        // CORREGIDO: se agrupan varios platos (y, por separado, varios vinos) en una sola
        // llamada a la IA en vez de una llamada por fila, para ahorrar tokens de instrucciones
        // repetidas y no agotar la cuota tan rápido. Se separan platos y vinos porque usan
        // prompts distintos (los vinos no llevan preguntas/respuestas).
        const pendientesPlatos = [];
        const pendientesVinos = [];
        for (let i = Math.max(0, rangoInicio); i < techoLimiteEvaluacion; i++) {
            const row = activeStateContainer.csvData[i];
            while (row.length < activeStateContainer.headers.length) row.push("");

            const nombreEs = row[indiceCastellanoBase] || "";
            const nombreEnActual = row[indiceInglesBase] || "";
            const infoEsActual = row[indiceInfoEs] || "";
            const infoEnActual = row[indiceInfoIngles] || "";
            const idValor = indiceId !== -1 ? parseInt(row[indiceId]) : NaN;
            const carpetaValor = indiceCarpeta !== -1 ? (row[indiceCarpeta] || "").trim().toLowerCase() : "";

            const esCabeceraCategoria = !isNaN(idValor) && idValor >= 1 && idValor <= 12;
            const esBebidaSimple = CARPETAS_SIN_IA.includes(carpetaValor);
            if (esCabeceraCategoria || esBebidaSimple) continue;
            if (!nombreEs) continue;

            const esVino = carpetaValor === 'vinos';
            if (nombreEnActual && infoEsActual && infoEnActual) continue; // ya está completo

            if (esVino) pendientesVinos.push(i); else pendientesPlatos.push(i);
        }

        window.UI.log(`[Info] Pendientes: ${pendientesPlatos.length} platos, ${pendientesVinos.length} vinos. Lotes de ${TAMANO_LOTE_INFO}.`);

        let platosCompletados = 0, vinosCompletados = 0, cuotaAgotada = false;

        // ---------- Función interna reutilizada para procesar un lote (platos o vinos) ----------
        // Devuelve 'ok', 'cuota_agotada' (se han probado TODAS las keys disponibles y todas han
        // dado 429 sin ni un solo éxito de por medio -> seguir insistiendo es inútil, hay que
        // parar el proceso entero en vez de machacar el resto de lotes contra la misma pared) o 'error'.
        const procesarLoteInfo = async (indicesLote, esVino) => {
            const items = indicesLote.map(i => {
                const row = activeStateContainer.csvData[i];
                const nombreEs = row[indiceCastellanoBase] || "";
                const alergenosValor = indiceAlergenos !== -1 ? (row[indiceAlergenos] || "").trim() : "";
                const tieneAlergenos = alergenosValor && alergenosValor.toUpperCase() !== 'NINGUNO' && alergenosValor !== '0' && alergenosValor !== '';
                return esVino ? { fila: i, row, nombreVino: nombreEs } : { fila: i, row, nombreEs, tieneAlergenos, alergenosValor };
            });

            const promptLote = esVino ? window.PROMPTS.vinoLote(items) : window.PROMPTS.pilotoLote(items);

            let satisfecho = false;
            let intentosLote = 0;
            let limitesConsecutivos = 0; // contador de 429 seguidos SIN ningún éxito entre medio
            const maxIntentosLote = Math.max(3, listaClavesAPI.length * 2);

            while (!satisfecho && !procesoState.detenido && intentosLote < maxIntentosLote) {
                try {
                    const callResponse = await fetch(`${window.GEMINI_ENDPOINT_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'}?key=${listaClavesAPI[procesoState.currentKeyIndex]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptLote }] }], generationConfig: { maxOutputTokens: window.GEMINI_MAX_OUTPUT_TOKENS || 65536 } }) });

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
                            return 'cuota_agotada';
                        }
                        window.UI.log(`[Aviso] Límite superado en el lote (filas ${items.map(it => it.fila + 2).join(', ')}). Rotando Key (${limitesConsecutivos}/${listaClavesAPI.length})...`);
                        await new Promise(r => setTimeout(r, 4000));
                        intentosLote++;
                        continue;
                    }

                    const textoLimpioIA = respuestaJsonData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!textoLimpioIA) throw new Error("La API no devolvió contenido.");

                    const jsonSanitizado = textoLimpioIA.replace(/```json/g, '').replace(/```/g, '').trim();
                    const resultadoLote = JSON.parse(jsonSanitizado);

                    let algunoAplicado = false;
                    items.forEach((it, idx) => {
                        const parsed = resultadoLote[String(idx)] || resultadoLote[idx];
                        if (!parsed || !parsed.es || !parsed.en) return;

                        const row = it.row;
                        const nombreEnActual = row[indiceInglesBase] || "";
                        const infoEsActual = row[indiceInfoEs] || "";
                        const infoEnActual = row[indiceInfoIngles] || "";

                        if (!esVino && it.tieneAlergenos) {
                            if (!parsed.es.q3 || !parsed.es.r3 || !parsed.es.r3.trim()) {
                                parsed.es.q3 = parsed.es.q3 || "¿Contiene este plato algún alérgeno?";
                                parsed.es.r3 = `Este plato contiene: ${it.alergenosValor}.`;
                            }
                            if (!parsed.en.q3 || !parsed.en.r3 || !parsed.en.r3.trim()) {
                                parsed.en.q3 = parsed.en.q3 || "Does this dish contain any allergens?";
                                parsed.en.r3 = `This dish contains: ${it.alergenosValor}.`;
                            }
                        }

                        if (!nombreEnActual && parsed.nombre_en) row[indiceInglesBase] = parsed.nombre_en;
                        if (!infoEsActual) row[indiceInfoEs] = JSON.stringify(parsed.es);
                        if (!infoEnActual) row[indiceInfoIngles] = JSON.stringify(parsed.en);

                        // NUEVO: si se ha (re)generado la ficha ES/EN de esta fila, se anota la
                        // huella de NOMBRE_ES + ALERGENOS_COD usados, para poder detectar más
                        // adelante si vuelven a cambiar y haría falta regenerarla en todos los idiomas.
                        if ((!infoEsActual || !infoEnActual) && indiceHashFicha !== -1 && typeof window.calcularHashContenido === 'function') {
                            const nombreEsRow = row[indiceCastellanoBase] || "";
                            const alergenosRow = indiceAlergenos !== -1 ? (row[indiceAlergenos] || "") : "";
                            row[indiceHashFicha] = window.calcularHashContenido(`${nombreEsRow}|${alergenosRow}`);
                        }
                        algunoAplicado = true;
                        if (esVino) vinosCompletados++; else platosCompletados++;
                    });
                    satisfecho = true;
                    return algunoAplicado ? 'ok' : 'error';
                } catch (err) {
                    limitesConsecutivos = 0; // un error que no es 429 rompe la racha de "cuota agotada"
                    window.UI.log(`[Error ${esVino ? 'Vino' : 'Piloto'} Lote] Filas ${items.map(it => it.fila + 2).join(', ')}: ${err.message}`);
                    await new Promise(r => setTimeout(r, 3000));
                    procesoState.currentKeyIndex = (procesoState.currentKeyIndex + 1) % listaClavesAPI.length;
                    intentosLote++;
                }
            }
            return satisfecho ? 'ok' : 'error';
        };

        // ---------- Fase 1a: platos ----------
        for (let lote = 0; lote < pendientesPlatos.length && !cuotaAgotada; lote += TAMANO_LOTE_INFO) {
            if (procesoState.detenido) break;
            while (procesoState.pausado) await new Promise(resolve => setTimeout(resolve, 500));

            const indicesLote = pendientesPlatos.slice(lote, lote + TAMANO_LOTE_INFO);
            window.UI.log(`[Piloto ES/EN - Lote ${Math.floor(lote / TAMANO_LOTE_INFO) + 1}/${Math.ceil(pendientesPlatos.length / TAMANO_LOTE_INFO)}] Procesando filas ${indicesLote.map(i => i + 2).join(', ')}...`);
            const resultado = await procesarLoteInfo(indicesLote, false);
            if (resultado === 'cuota_agotada') { cuotaAgotada = true; break; }

            if (typeof window.UI.renderTable === 'function') window.UI.renderTable();
            await new Promise(r => setTimeout(r, 1000));
        }

        // ---------- Fase 1b: vinos ----------
        for (let lote = 0; lote < pendientesVinos.length && !cuotaAgotada; lote += TAMANO_LOTE_INFO) {
            if (procesoState.detenido) break;
            while (procesoState.pausado) await new Promise(resolve => setTimeout(resolve, 500));

            const indicesLote = pendientesVinos.slice(lote, lote + TAMANO_LOTE_INFO);
            window.UI.log(`[Vino - Lote ${Math.floor(lote / TAMANO_LOTE_INFO) + 1}/${Math.ceil(pendientesVinos.length / TAMANO_LOTE_INFO)}] Procesando filas ${indicesLote.map(i => i + 2).join(', ')}...`);
            const resultado = await procesarLoteInfo(indicesLote, true);
            if (resultado === 'cuota_agotada') { cuotaAgotada = true; break; }

            if (typeof window.UI.renderTable === 'function') window.UI.renderTable();
            await new Promise(r => setTimeout(r, 1000));
        }

        const totalPendiente = (pendientesPlatos.length - platosCompletados) + (pendientesVinos.length - vinosCompletados);
        if (cuotaAgotada) {
            window.UI.log(`[FIN - CUOTA AGOTADA] Se detuvo el proceso por falta de cuota en la API. Completados: ${platosCompletados} platos y ${vinosCompletados} vinos. Pendientes: ${totalPendiente}. Vuelve a pulsar "Generar Info Platos ES/EN" más tarde para continuar solo con lo que falta.`);
        } else if (totalPendiente > 0) {
            window.UI.log(`[FIN - INCOMPLETO] Completados: ${platosCompletados} platos y ${vinosCompletados} vinos. Pendientes: ${totalPendiente} (revisa los errores anteriores). Puedes volver a pulsar "Generar Info Platos ES/EN" para reintentar solo lo pendiente.`);
        } else {
            window.UI.log(`[FIN] Proceso finalizado con éxito. Completados: ${platosCompletados} platos y ${vinosCompletados} vinos.`);
        }
    }
};
