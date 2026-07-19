// ui.js (Web_Editor_Pro)
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.ui = '1.1.0-ABSTRACT-KEYS'; // MODIFICADO: Salto versión por limpieza de modos

window.APP_VERSIONS.config = window.APP_VERSIONS.config || '1.0.0';
window.APP_VERSIONS.app = window.APP_VERSIONS.app || '1.0.33';

let currentKeyIndex = 0;
let procesoDetenido = false;
let procesoPausado = false;
let activeLang = 'EN';

const stateContainer = {
    headers: [],
    csvData: [],
    // MODIFICADO: Estado local mapeado a Abstract Keys
    currentProMode: 'restaurante001' 
};

export const UI = {
    log: (mensaje) => {
        console.log(`[Editor Pro] ${mensaje}`);
        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) statusCarga.innerText = mensaje;
        const consolaVisual = document.getElementById('consola');
        if (consolaVisual) {
            const div = document.createElement('div');
            div.textContent = mensaje;
            consolaVisual.appendChild(div);
            consolaVisual.scrollTop = consolaVisual.scrollHeight;
        }
    },
    setLoadingState: (buttonId, isLoading, text = "Guardando...") => {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        btn.disabled = isLoading;
        btn.innerText = isLoading ? text : "Guardar";
    },
    
    actualizarListaKeys: (selectorElemento = '.select-keys') => {
        const selectEl = document.querySelector(selectorElemento) || document.getElementById('selectKeys');
        if (!selectEl) return;
        const keys = getKeys();
        if (keys.length === 0) { selectEl.innerHTML = '<option value="">No hay API Keys cargadas</option>'; selectEl.disabled = true; return; }
        selectEl.disabled = false;
        selectEl.innerHTML = keys.map((k, i) => {
            const resumida = k.length > 10 ? `${k.substring(0, 6)}...${k.substring(k.length - 4)}` : k;
            return `<option value="${k}">Key ${i + 1}: ${resumida}</option>`;
        }).join('');
    },

    renderRadiosIdiomas: () => {
        const container = document.getElementById('radiosIdiomas');
        if (!container) return;
        let idiomas = window.IDIOMAS_CONFIG || { "EN": "🇬🇧 English", "KO": "🇰🇷 한국어" };
        if (!idiomas.hasOwnProperty("KO")) idiomas["KO"] = "🇰🇷 한국어";
        let html = '<div class="flex flex-wrap gap-1.5">';
        for (const [code, name] of Object.entries(idiomas)) {
            if (code === 'ES') continue; 
            const isActive = code === activeLang ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600';
            html += `<button class="lang-btn text-xs py-1.5 px-2.5 rounded font-semibold transition-all ${isActive}" data-lang="${code}">${name}</button>`;
        }
        html += '</div>';
        container.innerHTML = html;
        container.querySelectorAll('.lang-btn').forEach(btn => {
            btn.onclick = () => {
                activeLang = btn.dataset.lang;
                container.querySelectorAll('.lang-btn').forEach(b => { b.classList.remove('bg-amber-600', 'text-white', 'shadow-md'); b.classList.add('bg-slate-700', 'text-slate-300'); });
                btn.classList.remove('bg-slate-700', 'text-slate-300');
                btn.classList.add('bg-amber-600', 'text-white', 'shadow-md');
                UI.renderTable();
            };
        });
    },

    renderTable: () => {
        const tableHeadRow = document.getElementById('tableHeadRow');
        const tablaBody = document.getElementById('tablaBody');
        if (!tableHeadRow || !tablaBody) return;
        if (stateContainer.headers.length === 0) { tableHeadRow.innerHTML = ''; tablaBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500 italic">Ningún archivo cargado.</td></tr>'; return; }
        const selectedLang = activeLang;
        let idiomas = window.IDIOMAS_CONFIG || { "EN": "🇬🇧 English" };
        const idIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'ID');
        const esIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');
        const langIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === `NOMBRE_${selectedLang}`);
        if (idIdx === -1 || esIdx === -1) { tablaBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500 italic">Estructura CSV no reconocida.</td></tr>'; return; }
        const langName = idiomas[selectedLang] || selectedLang;
        tableHeadRow.innerHTML = `<tr><th style="width: 60px;">Fila</th><th style="width: 70px;">ID</th><th style="width: calc(50% - 65px);">Castellano (ES)</th><th style="width: calc(50% - 65px);">${langName} (${selectedLang})</th></tr>`;
        const rangoInicioEl = document.getElementById('rangoInicio');
        const rangoFinEl = document.getElementById('rangoFin');
        const inicio = rangoInicioEl ? Math.max(0, parseInt(rangoInicioEl.value) - 2) : 0;
        const fin = rangoFinEl ? Math.min(stateContainer.csvData.length, parseInt(rangoFinEl.value) - 1) : stateContainer.csvData.length;
        tablaBody.innerHTML = stateContainer.csvData.slice(inicio, fin).map((row, index) => {
            const rowNum = inicio + index + 2; 
            return `<tr><td style="width: 60px; text-align: center;">${rowNum}</td><td style="width: 70px; text-align: center;">${row[idIdx] || ''}</td><td style="width: calc(50% - 65px);">${row[esIdx] || ''}</td><td style="width: calc(50% - 65px);">${langIdx !== -1 ? (row[langIdx] || '') : 'N/A'}</td></tr>`;
        }).join('');
    },

    cargarGoogleSheets: async (targetUrl, retryCount = 0) => {
        const DANGER_WINDOW_MS = 15000;
        const MAX_RETRIES = 5;
        if (!targetUrl) return UI.log("[Error] No se proporcionó una URL válida.");
        const timeSinceSave = Date.now() - (window.lastSaveAttempt || 0); 
        if (timeSinceSave < DANGER_WINDOW_MS && retryCount < MAX_RETRIES) {
            console.warn(`[UI] ⚠️ Zona de Peligro. Reintento automático #${retryCount + 1}...`);
            UI.log(`[Info] Verificando datos post-guardado (Intento ${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(r => setTimeout(r, 300));
            return UI.cargarGoogleSheets(targetUrl, retryCount + 1);
        }
        UI.log(`[Info] Descargando CSV...`);
        try {
            const resp = await fetch(targetUrl + '&zx=' + Date.now(), { cache: "no-store", headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
            if (!resp.ok) throw new Error("Error HTTP " + resp.status);
            const text = await resp.text();
            if (window.Papa) {
                window.Papa.parse(text, { skipEmptyLines: true, complete: (resultado) => { if (resultado.data && resultado.data.length > 0) { stateContainer.headers = resultado.data[0]; stateContainer.csvData = resultado.data.slice(1); UI.log(`[OK] CSV cargado. Filas: ${stateContainer.csvData.length}`); UI.actualizarTextoBotonSync(); UI.renderTable(); } } });
            } else {
                const lineas = text.split(/\r?\n/).filter(line => line.trim() !== "");
                if (lineas.length > 0) { stateContainer.headers = lineas[0].split(",").map(h => h.replace(/^"|"$/g, '').trim()); stateContainer.csvData = lineas.slice(1).map(f => f.split(",").map(v => v.replace(/^"|"$/g, '').trim())); UI.log(`[OK] CSV cargado (Fallback).`); UI.actualizarTextoBotonSync(); UI.renderTable(); }
            }
        } catch (e) { UI.log("[Error] Fallo al descargar CSV: " + e.message); }
    },

    actualizarTextoBotonSync: () => {
        const btn = document.getElementById('btnSyncSheets');
        if (!btn) return;
        const contexto = stateContainer.currentProMode || 'restaurante001';
        btn.innerText = `☁️ Sincronizar con Google Sheet ${getModoAlias(contexto)}`;
    },

    sincronizarConGoogleSheets: async () => {
        if (stateContainer.headers.length === 0 || stateContainer.csvData.length === 0) return UI.log("[Error] No hay datos en memoria.");
        const modo = stateContainer.currentProMode;
        const contextoNombre = getModoAlias(modo);
        UI.log(`[Sincro] Preparando envío a: ${contextoNombre}...`);
        
        const findIdx = (keywords) => { for (const kw of keywords) { const idx = stateContainer.headers.findIndex(h => h && h.toUpperCase().includes(kw)); if (idx !== -1) return idx; } return -1; };
        const idxId = findIdx(['ID']); const idxPrecio = findIdx(['PRECIO', 'PRICE']); const idxEstado = findIdx(['ACTIVA', 'ESTADO', 'ACTIVO']); const idxCarpeta = findIdx(['CARPETA', 'FOLDER']); const idxImagen = findIdx(['ARCHIVO_FOTO', 'IMAGEN', 'FOTO']); const idxAlergenos = findIdx(['ALERGENOS_COD', 'ALERG']);
        if (idxId === -1) return UI.log("[Error Crítico] No se encuentra la columna 'ID'.");
        
        const totalColumnasEsperadas = stateContainer.headers.length;
        const payload = stateContainer.csvData.map(row => {
            while (row.length < totalColumnasEsperadas) row.push("");
            let obj = { id: parseInt(row[idxId]), precio: idxPrecio !== -1 ? (row[idxPrecio] || "0.00") : "0.00", estado: idxEstado !== -1 ? (row[idxEstado] || "no") : "no", carpeta: idxCarpeta !== -1 ? (row[idxCarpeta] || "") : "", imagen: idxImagen !== -1 ? (row[idxImagen] || "") : "", alergenos: idxAlergenos !== -1 ? (row[idxAlergenos] || "") : "" };
            stateContainer.headers.forEach((h, i) => { if (h && h.trim().toUpperCase().startsWith("NOMBRE_")) { let langKey = h.trim().toUpperCase().replace("NOMBRE_", "").toLowerCase(); obj[`nombre_${langKey}`] = row[i] || ""; } });
            return obj;
        }).filter(x => !isNaN(x.id) && x.id > 0);

        if (payload.length === 0) return UI.log("[Error] La compilación no generó filas válidas.");
        UI.log(`[Sincro] Enviando ${payload.length} filas a ${contextoNombre}...`);
        try {
            let urlDestino = window.getWebAppUrl ? window.getWebAppUrl(modo) : '';
            if (!urlDestino) return UI.log(`[Error Crítico] getWebAppUrl() no devolvió URL para '${modo}'.`);
            window.lastSaveAttempt = Date.now();
            const response = await fetch(urlDestino, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (response.type === 'opaque') UI.log(`⚠️ [Sincro] Modo 'no-cors'. No se puede leer la respuesta. Petición enviada a ${contextoNombre}.`);
            else UI.log(`✅ [Sincro] ¡Éxito hacia ${contextoNombre}!`);
        } catch (e) { UI.log(`❌ [Sincro] Error de red en ${contextoNombre}: ` + e.message); }
    },

    inicializarAjustesExpertos: () => {
        window.APP_VERSIONS.css = window.APP_VERSIONS.css || '1.0.6';
        const btnExportar = document.getElementById('saveCsvBtn');
        if (btnExportar) btnExportar.onclick = () => { if (stateContainer.headers && stateContainer.csvData) UI.exportarCSV(stateContainer.headers, stateContainer.csvData); else UI.log("[Error] Sin datos para exportar."); };
        
        const btnSyncSheets = document.getElementById('btnSyncSheets');
        if (btnSyncSheets) btnSyncSheets.onclick = () => UI.sincronizarConGoogleSheets();

        const loadSheetsBtnRG = document.getElementById('loadSheetsBtnRG');
        const inputRG = document.getElementById('sheetsUrlRG');
        if (loadSheetsBtnRG && inputRG) {
            loadSheetsBtnRG.onclick = () => {
                const url = inputRG.value.trim();
                if (url) { stateContainer.currentProMode = 'restaurante001'; window.currentMode = 'restaurante001'; UI.cargarGoogleSheets(url); }
                else UI.log("[Error] La URL para RG está vacía.");
            };
        }

        const loadSheetsBtnUSOpen = document.getElementById('loadSheetsBtnUSOpen');
        const inputUSOpen = document.getElementById('sheetsUrlUSOpen');
        if (loadSheetsBtnUSOpen && inputUSOpen) {
            loadSheetsBtnUSOpen.onclick = () => {
                const url = inputUSOpen.value.trim();
                if (url) { stateContainer.currentProMode = 'restaurante002'; window.currentMode = 'restaurante002'; UI.cargarGoogleSheets(url); }
                else UI.log("[Error] La URL para USOPEN está vacía.");
            };
        }

        const inputImportar = document.getElementById('archivoLocal');
        if (inputImportar) {
            inputImportar.onchange = (e) => {
                const file = e.target.files[0];
                if (file) { window.UI.tempImportFile = file; document.getElementById('modal-seleccionar-destino').style.display = 'block'; }
            };
        }

        const btnIniciar = document.getElementById('btnIniciar');
        if (btnIniciar) btnIniciar.onclick = () => UI.iniciarTraduccionPorLotes(stateContainer);
        const btnPausa = document.getElementById('btnPausa');
        if (btnPausa) btnPausa.onclick = () => { procesoPausado = !procesoPausado; btnPausa.innerText = procesoPausado ? "REANUDAR" : "PAUSAR"; UI.log(procesoPausado ? "[Info] Pausado." : "[Info] Reanudando..."); };
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) btnCancelar.onclick = () => { procesoDetenido = true; UI.log("[Info] Deteniendo bucle..."); };
    },

    confirmarImportacion: (mode) => {
        const file = window.UI.tempImportFile;
        if (!file) return UI.log("[Error] No se encontró el archivo temporal.");
        // MODIFICADO: Asegurar modo abstracto
        const modoDefinitivo = (mode === 'RG') ? 'restaurante001' : (mode === 'USOPEN') ? 'restaurante002' : mode;
        stateContainer.currentProMode = modoDefinitivo;
        window.currentMode = modoDefinitivo;
        UI.log(`[Import] Destino asignado: ${getModoAlias(modoDefinitivo)}`);
        UI.importarCSV(file, (headers, data) => {
            stateContainer.headers = headers; stateContainer.csvData = data;
            UI.log(`[OK] Archivo cargado. Filas: ${data.length}`);
            UI.actualizarTextoBotonSync();
            if (typeof UI.renderTable === 'function') UI.renderTable();
        });
        UI.cancelarImportacion();
    },

    cancelarImportacion: () => {
        const modal = document.getElementById('modal-seleccionar-destino');
        if (modal) modal.style.display = 'none';
        const input = document.getElementById('archivoLocal');
        if (input) input.value = '';
        window.UI.tempImportFile = null;
    },

    exportarCSV: (headers, csvData) => {
        try {
            let resultadoTexto = "";
            if (window.Papa) resultadoTexto = window.Papa.unparse([headers, ...csvData]);
            else resultadoTexto = [headers, ...csvData].map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([resultadoTexto], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = 'exportacion_expertos_final.csv'; link.click();
            UI.log("[OK] CSV descargado.");
        } catch (err) { UI.log(`[Error Exportar] ${err.message}`); }
    },

    importarCSV: (file, callback) => {
        const lector = new FileReader();
        lector.onload = (e) => {
            const contenidoCrudo = e.target.result;
            try {
                if (window.Papa) { window.Papa.parse(contenidoCrudo, { skipEmptyLines: true, complete: (resultado) => { if (resultado.data && resultado.data.length > 0) callback(resultado.data[0], resultado.data.slice(1)); } }); }
                else { const lineas = contenidoCrudo.split(/\r?\n/).filter(line => line.trim() !== ""); if (lineas.length > 0) callback(lineas[0].split(",").map(h => h.replace(/^"|"$/g, '').trim()), lineas.slice(1).map(f => f.split(",").map(v => v.replace(/^"|"$/g, '').trim()))); }
            } catch (err) { UI.log(`[Error Importar] ${err.message}`); }
        };
        lector.readAsText(file);
    },

    iniciarTraduccionPorLotes: async (stateContainerParam) => {
        procesoDetenido = false; procesoPausado = false;
        const listaClavesAPI = getKeys();
        if (listaClavesAPI.length === 0) return UI.log("[Error] Introduzca al menos una API Key.");
        const activeStateContainer = stateContainerParam || stateContainer;
        if (!activeStateContainer || !activeStateContainer.headers || !activeStateContainer.csvData) return UI.log("[Error] Estructura de datos vacía.");
        
        const selectorInicio = document.getElementById('rangoInicio');
        const selectorFin = document.getElementById('rangoFin');
        const rangoInicio = selectorInicio ? (parseInt(selectorInicio.value) - 2 || 0) : 0;
        const rangoFin = selectorFin ? (parseInt(selectorFin.value) - 1 || activeStateContainer.csvData.length) : activeStateContainer.csvData.length;
        const columnasIdiomasDestino = activeStateContainer.headers.map((h, i) => (h && h.toUpperCase().startsWith("NOMBRE_") && h.toUpperCase() !== "NOMBRE_ES") ? i : -1).filter(i => i !== -1);
        const indiceCastellanoBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');
        if (indiceCastellanoBase === -1) return UI.log("[Error] Falta la columna 'Nombre_ES'.");

        let totalPeticionesExitosas = 0;
        const matrizFilasPendientes = [];
        const techoLimiteEvaluacion = Math.min(rangoFin, activeStateContainer.csvData.length);

        for (let i = Math.max(0, rangoInicio); i < techoLimiteEvaluacion; i++) {
            const cadenaCastellano = activeStateContainer.csvData[i][indiceCastellanoBase] || "Sin nombre";
            const indicesColumnasVacias = columnasIdiomasDestino.filter(idx => !activeStateContainer.csvData[i][idx] || activeStateContainer.csvData[i][idx].trim() === "");
            if (indicesColumnasVacias.length > 0) { matrizFilasPendientes.push({ indiceMatriz: i, numeroFilaHumana: i + 2, textoES: cadenaCastellano, indicesColumnasFaltantes: indicesColumnasVacias, codigosIdiomas: indicesColumnasVacias.map(idx => activeStateContainer.headers[idx].replace("Nombre_", "").replace("nombre_", "")) }); }
        }
        if (matrizFilasPendientes.length === 0) return UI.log("[FIN] No quedan celdas vacías por traducir.");
        UI.log(`[Info] Detectadas ${matrizFilasPendientes.length} filas incompletas. Agrupando...`);
        
        for (let j = 0; j < matrizFilasPendientes.length; j += TRADUCCION_TAMANO_LOTE) {
            if (procesoDetenido) break;
            while (procesoPausado) await new Promise(resolve => setTimeout(resolve, 500));
            const loteActual = matrizFilasPendientes.slice(j, j + TRADUCCION_TAMANO_LOTE);
            const estructuraPromptPayload = loteActual.map(p => ({ id_fila: p.numeroFilaHumana, texto: p.textoES, idiomas_requeridos: p.codigosIdiomas }));
            const secuenciaImpresionFilas = loteActual.map(p => p.numeroFilaHumana).join(', ');
            UI.log(`[Procesando Lote] [${secuenciaImpresionFilas}]...`);
            let peticionSatisfecha = false;
            while (!peticionSatisfecha && !procesoDetenido) {
                try {
                    const instruccionesEstructuralesIA = `Actúa como un traductor experto de menús. Datos: ${JSON.stringify(estructuraPromptPayload)}. Responde SOLO con JSON: {"lote": [{"id_fila": 8, "traducciones": {"EN": "Name"}}]}`;
                    const callResponse = await fetch(`${GEMINI_ENDPOINT_URL}?key=${listaClavesAPI[currentKeyIndex]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: instruccionesEstructuralesIA }] }] }) });
                    const respuestaJsonData = await callResponse.json();
                    if (respuestaJsonData.error?.code === 429) { currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length; UI.log(`[Aviso] Límite superado. Rotando Key...`); await new Promise(resolve => setTimeout(resolve, 3000)); continue; }
                    const textoLimpioIA = respuestaJsonData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textoLimpioIA) {
                        const jsonSanitizado = textoLimpioIA.replace(/```json/g, '').replace(/```/g, '').trim();
                        const objetoParseadoFinal = JSON.parse(jsonSanitizado);
                        if (objetoParseadoFinal && objetoParseadoFinal.lote) {
                            objetoParseadoFinal.lote.forEach(filaLote => {
                                const objetivoFilaMemoria = loteActual.find(p => p.numeroFilaHumana === parseInt(filaLote.id_fila));
                                if (objetivoFilaMemoria && filaLote.traducciones) {
                                    objetivoFilaMemoria.indicesColumnasFaltantes.forEach(idxCol => {
                                        const codigoIdiomaISO = activeStateContainer.headers[idxCol].replace("Nombre_", "").replace("nombre_", "");
                                        if (filaLote.traducciones[codigoIdiomaISO]) activeStateContainer.csvData[objetivoFilaMemoria.indiceMatriz][idxCol] = filaLote.traducciones[codigoIdiomaISO].replace(/[\(\)""'']/g, '');
                                    });
                                }
                            });
                            UI.log(`[OK Lote] [${secuenciaImpresionFilas}] inyectado.`);
                            totalPeticionesExitosas++; peticionSatisfecha = true;
                        } else throw new Error("JSON no contiene nodo 'lote'.");
                    }
                } catch (errorCapturado) {
                    UI.log(`[Error Lote] [${secuenciaImpresionFilas}]: ${errorCapturado.message}`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    if (errorCapturado.message.includes("Unexpected token") || errorCapturado.message.includes("API key")) break;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 2500)); 
            if (typeof UI.renderTable === 'function') UI.renderTable();
        }
        if (procesoDetenido) UI.log(`[FIN] Abortado. Peticiones: ${totalPeticionesExitosas}`);
        else UI.log(`[FIN] ¡Flujo masivo completado! Peticiones: ${totalPeticionesExitosas}`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.actualizarListaKeys(); UI.renderRadiosIdiomas(); UI.inicializarAjustesExpertos();
    const addKeyBtn = document.getElementById('addKeyBtn');
    if (addKeyBtn) addKeyBtn.onclick = () => { const input = document.getElementById('nuevaKey'); if (input && input.value.trim()) { saveKey(input.value.trim()); input.value = ""; UI.actualizarListaKeys(); UI.log("[OK] Key agregada."); } };
    const btnEliminarKeySeleccionada = document.getElementById('btnEliminarKeySeleccionada');
    if (btnEliminarKeySeleccionada) btnEliminarKeySeleccionada.onclick = () => { const selectEl = document.getElementById('selectKeys'); if (selectEl && selectEl.value) { deleteKey(selectEl.value); UI.actualizarListaKeys(); UI.log("[OK] Key eliminada."); } else UI.log("[Aviso] No hay Key seleccionada."); };
});

window.UI = UI;
