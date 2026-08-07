// =========================================
// REPOSITORIO: Web_Editor_Pro_v3 (PRINCIPAL)
// ARCHIVO: ui.js (Versión Completa y Definitiva - ES/EN Directo y Profesional)
// =========================================

window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.ui = '1.5.0-DIRECTO-ES-EN';

window.APP_VERSIONS.config = window.APP_VERSIONS.config || '2.2.0';
window.APP_VERSIONS.app = window.APP_VERSIONS.app || '1.0.33';

let currentKeyIndex = 0;
let procesoDetenido = false;
let procesoPausado = false;
let activeLang = 'EN';

const stateContainer = {
    headers: [],
    csvData: [],
    currentProMode: 'restaurante001' 
};

function asegurarColumnasEstructura(container) {
    if (!container || !container.headers || !container.csvData) {
        console.error("[CRÍTICO] Contenedor de datos inválido en asegurarColumnasEstructura");
        return;
    }
    
    console.log("-----------------------------------------");
    console.log("[DIAGNÓSTICO] 1. Columnas originales leídas del CSV:");
    console.log(JSON.stringify(container.headers));
    console.log("-----------------------------------------");

    const idiomasConfigurados = Object.keys(window.IDIOMAS_CONFIG || {
        "ES": 1, "EN": 1, "DE": 1, "FR": 1, "IT": 1, "RU": 1, "NL": 1, "PL": 1, 
        "SV": 1, "NO": 1, "DA": 1, "FI": 1, "PT": 1, "RO": 1, "HU": 1, "CS": 1, 
        "EL": 1, "TR": 1, "AR": 1, "ZH": 1, "JA": 1, "CA": 1, "EU": 1, "GL": 1, 
        "VA": 1, "KO": 1
    });

    container.headers = container.headers.map(h => h ? String(h).trim() : "");

    let columnasCreadasNuevas = [];

    idiomasConfigurados.forEach(lang => {
        const nombreHeader = `NOMBRE_${lang}`;
        if (!container.headers.some(h => h.toUpperCase() === nombreHeader.toUpperCase())) {
            container.headers.push(nombreHeader);
            columnasCreadasNuevas.push(nombreHeader);
        }

        const infoHeader = `INFO_${lang}`;
        if (!container.headers.some(h => h.toUpperCase() === infoHeader.toUpperCase())) {
            container.headers.push(infoHeader);
            columnasCreadasNuevas.push(infoHeader);
        }
    });

    console.log("[DIAGNÓSTICO] 2. Columnas nuevas creadas/añadidas en memoria:");
    console.log(columnasCreadasNuevas.length > 0 ? JSON.stringify(columnasCreadasNuevas) : "Ninguna (todas ya existían)");
    console.log("-----------------------------------------");

    const totalColumnas = container.headers.length;
    container.csvData.forEach((row) => {
        while (row.length < totalColumnas) {
            row.push("");
        }
    });

    console.log(`[DIAGNÓSTICO] 3. Listado total definitivo de columnas en memoria (${totalColumnas} columnas):`);
    container.headers.forEach((h, index) => {
        console.log(`  [Columna índice ${index}] -> ${h}`);
    });
    console.log("=========================================");
}

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
        const keys = (typeof getKeys === 'function') ? getKeys() : [];
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
            await new Promise(r => setTimeout(r, 300));
            return UI.cargarGoogleSheets(targetUrl, retryCount + 1);
        }
        UI.log(`[Info] Descargando CSV...`);
        try {
            const resp = await fetch(targetUrl + '&zx=' + Date.now(), { cache: "no-store", headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
            if (!resp.ok) throw new Error("Error HTTP " + resp.status);
            const text = await resp.text();
            
            if (window.Papa) {
                window.Papa.parse(text, { skipEmptyLines: true, complete: (resultado) => { 
                    if (resultado.data && resultado.data.length > 0) { 
                        stateContainer.headers = resultado.data[0]; 
                        stateContainer.csvData = resultado.data.slice(1); 
                        asegurarColumnasEstructura(stateContainer);
                        UI.log(`[OK] CSV cargado y columnas aseguradas. Filas: ${stateContainer.csvData.length}`); 
                        UI.actualizarTextoBotonSync(); 
                        UI.renderTable(); 
                    } 
                } });
            } else {
                const lineas = text.split(/\r?\n/).filter(line => line.trim() !== "");
                if (lineas.length > 0) { 
                    stateContainer.headers = lineas[0].split(",").map(h => h.replace(/^"|"$/g, '').trim()); 
                    stateContainer.csvData = lineas.slice(1).map(f => f.split(",").map(v => v.replace(/^"|"$/g, '').trim())); 
                    asegurarColumnasEstructura(stateContainer);
                    UI.log(`[OK] CSV cargado (Fallback) y columnas aseguradas.`); 
                    UI.actualizarTextoBotonSync(); 
                    UI.renderTable(); 
                }
            }
        } catch (e) { UI.log("[Error] Fallo al descargar CSV: " + e.message); }
    },

    actualizarTextoBotonSync: () => {
        const btn = document.getElementById('btnSyncSheets');
        if (!btn) return;
        const contexto = stateContainer.currentProMode || 'restaurante001';
        const alias = (typeof getModoAlias === 'function') ? getModoAlias(contexto) : contexto;
        btn.innerText = `☁️ Sincronizar con Google Sheet ${alias}`;
    },

    sincronizarConGoogleSheets: async () => {
        if (stateContainer.headers.length === 0 || stateContainer.csvData.length === 0) return UI.log("[Error] No hay datos en memoria.");
        const modo = stateContainer.currentProMode;
        const contextoNombre = (typeof getModoAlias === 'function') ? getModoAlias(modo) : modo;
        UI.log(`[Sincro] Preparando envío a: ${contextoNombre}...`);
        
        const findExactIdx = (name) => stateContainer.headers.findIndex(h => h && h.toUpperCase() === name.toUpperCase());
        
        const idxId = findExactIdx('ID'); 
        const idxPrecio = findExactIdx('PRECIO'); 
        const idxActiva = findExactIdx('ACTIVA'); 
        const idxCarpeta = findExactIdx('CARPETA'); 
        const idxImagen = findExactIdx('ARCHIVO_FOTO'); 
        const idxAlergenos = findExactIdx('ALERGENOS_COD'); 
        
        if (idxId === -1) return UI.log("[Error Crítico] No se encuentra la columna 'ID'.");
        
        const totalColumnasEsperadas = stateContainer.headers.length;
        const payload = stateContainer.csvData.map(row => {
            while (row.length < totalColumnasEsperadas) row.push("");
            
            let valActiva = "si";
            if (idxActiva !== -1 && row[idxActiva] !== undefined && row[idxActiva] !== null) {
                let rawVal = String(row[idxActiva]).trim().toLowerCase();
                if (rawVal === "no" || rawVal === "false" || rawVal === "0") {
                    valActiva = "no";
                } else if (rawVal === "si" || rawVal === "sí" || rawVal === "true" || rawVal === "1") {
                    valActiva = "si";
                } else if (rawVal !== "") {
                    valActiva = rawVal;
                } else {
                    valActiva = "no";
                }
            }

            let obj = { 
                id: parseInt(row[idxId]), 
                precio: idxPrecio !== -1 ? (row[idxPrecio] || "0.00") : "0.00", 
                activa: valActiva,
                carpeta: idxCarpeta !== -1 ? (row[idxCarpeta] || "") : "", 
                archivo_foto: idxImagen !== -1 ? (row[idxImagen] || "") : "", 
                alergenos_cod: idxAlergenos !== -1 ? (row[idxAlergenos] || "") : "" 
            };
            
            stateContainer.headers.forEach((h, i) => { 
                if (!h) return;
                const hUpper = h.trim().toUpperCase();
                if (hUpper.startsWith("NOMBRE_")) { 
                    let langKey = hUpper.replace("NOMBRE_", "").toLowerCase(); 
                    obj[`nombre_${langKey}`] = row[i] || ""; 
                } else if (hUpper.startsWith("INFO_")) {
                    let langKey = hUpper.replace("INFO_", "").toLowerCase(); 
                    obj[`info_${langKey}`] = row[i] || ""; 
                }
            });
            return obj;
        }).filter(x => !isNaN(x.id) && x.id > 0);

        if (payload.length === 0) return UI.log("[Error] La compilación no generó filas válidas.");
        UI.log(`[Sincro] Enviando ${payload.length} filas a ${contextoNombre}...`);
        try {
            let urlDestino = window.getWebAppUrl ? window.getWebAppUrl(modo) : '';
            if (!urlDestino) return UI.log(`[Error Crítico] getWebAppUrl() no devolvió URL para '${modo}'.`);
            window.lastSaveAttempt = Date.now();
            const response = await fetch(urlDestino, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (response.type === 'opaque') UI.log(`⚠️ [Sincro] Modo 'no-cors'. Petición enviada a ${contextoNombre}.`);
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
                if (file) { 
                    window.UI.tempImportFile = file; 
                    const modal = document.getElementById('modal-seleccionar-destino');
                    if (modal) modal.style.display = 'block'; 
                }
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
        const modoDefinitivo = (mode === 'RG') ? 'restaurante001' : (mode === 'USOPEN') ? 'restaurante002' : mode;
        stateContainer.currentProMode = modoDefinitivo;
        window.currentMode = modoDefinitivo;
        const alias = (typeof getModoAlias === 'function') ? getModoAlias(modoDefinitivo) : modoDefinitivo;
        UI.log(`[Import] Destino asignado: ${alias}`);
        UI.importarCSV(file, (headers, data) => {
            stateContainer.headers = headers; stateContainer.csvData = data;
            asegurarColumnasEstructura(stateContainer);
            UI.log(`[OK] Archivo cargado y columnas aseguradas. Filas: ${data.length}`);
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
        if (window.UI) window.UI.tempImportFile = null;
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

    // ==========================================
    // FLUJO PILOTO (ES Y EN - DIRECTO, CLARO Y SIN ADORNOS)
    // ==========================================
    iniciarTraduccionPorLotes: async (stateContainerParam) => {
        procesoDetenido = false; procesoPausado = false;
        const listaClavesAPI = (typeof getKeys === 'function') ? getKeys() : [];
        if (listaClavesAPI.length === 0) return UI.log("[Error] Introduzca al menos una API Key.");
        const activeStateContainer = stateContainerParam || stateContainer;
        if (!activeStateContainer || !activeStateContainer.headers || !activeStateContainer.csvData) return UI.log("[Error] Estructura de datos vacía.");
        
        UI.log("[Info] Asegurando estructura de columnas en memoria...");
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

        if (indiceCastellanoBase === -1 || indiceInglesBase === -1 || indiceInfoEs === -1 || indiceInfoIngles === -1) {
            return UI.log("[Error Crítico] Faltan columnas base obligatorias (NOMBRE_ES, NOMBRE_EN, INFO_ES o INFO_EN).");
        }

        const techoLimiteEvaluacion = Math.min(rangoFin, activeStateContainer.csvData.length);

        UI.log("[Paso 1] Generando contenido en Castellano e Inglés (ES / EN)...");
        
        for (let i = Math.max(0, rangoInicio); i < techoLimiteEvaluacion; i++) {
            if (procesoDetenido) break;
            while (procesoPausado) await new Promise(resolve => setTimeout(resolve, 500));

            const row = activeStateContainer.csvData[i];
            while (row.length < activeStateContainer.headers.length) row.push("");

            const nombreEs = row[indiceCastellanoBase] || "";
            const nombreEnActual = row[indiceInglesBase] || "";
            const infoEsActual = row[indiceInfoEs] || "";
            const infoEnActual = row[indiceInfoIngles] || "";
            const alergenosValor = indiceAlergenos !== -1 ? (row[indiceAlergenos] || "Ninguno") : "No especificado";

            if (!nombreEnActual || !infoEsActual || !infoEnActual) {
                UI.log(`[Piloto ES/EN] Procesando fila ${i + 2}: "${nombreEs}"...`);
                let satisfechoPiloto = false;

                while (!satisfechoPiloto && !procesoDetenido) {
                    try {
                        const promptPiloto = `Actúa como un responsable de carta de restaurante. Define el siguiente plato de forma clara, natural, concisa y estrictamente profesional. 
REGLAS DE ESTILO OBLIGATORIAS:
- CERO saludos informales, muletillas o frases coloquiales (prohibido "Hey there!", "So...", "Sure!"). Ve absolutamente directo al grano.
- Evita lenguaje gourmet pomposo o adjetivos exagerados (ej: nada de "melt-in-your-mouth", "exquisite", etc.). 
- Las respuestas sobre alérgenos deben ser exactas según los datos proporcionados.

Plato ES: "${nombreEs}"
Alérgenos reales: "${alergenosValor}"

Genera un JSON estricto sin markdown con esta estructura exacta para castellano (es) e inglés (en):
{
  "nombre_en": "...",
  "es": {"desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "...", "q3": "...", "r3": "..."},
  "en": {"desc": "...", "q1": "...", "r1": "...", "q2": "...", "r2": "...", "q3": "...", "r3": "..."}
}`;

                        const callResponse = await fetch(`${window.GEMINI_ENDPOINT_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'}?key=${listaClavesAPI[currentKeyIndex]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptPiloto }] }] }) });
                        
                        const textResponse = await callResponse.text();
                        let respuestaJsonData;
                        try {
                            respuestaJsonData = JSON.parse(textResponse);
                        } catch (e) {
                            throw new Error("La API devolvió HTML o texto plano (Posible 403 o error de cuota).");
                        }

                        if (respuestaJsonData.error?.code === 429) { 
                            currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length; 
                            UI.log(`[Aviso] Límite superado. Rotando Key...`);
                            await new Promise(r => setTimeout(r, 4000)); 
                            continue; 
                        }

                        const textoLimpioIA = respuestaJsonData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (!textoLimpioIA) throw new Error("La API no devolvió contenido.");

                        const jsonSanitizado = textoLimpioIA.replace(/```json/g, '').replace(/```/g, '').trim();
                        const parsed = JSON.parse(jsonSanitizado);

                        if (parsed.nombre_en && parsed.es && parsed.en) {
                            if (!nombreEnActual) row[indiceInglesBase] = parsed.nombre_en;
                            if (!infoEsActual) row[indiceInfoEs] = JSON.stringify(parsed.es);
                            if (!infoEnActual) row[indiceInfoIngles] = JSON.stringify(parsed.en);
                            satisfechoPiloto = true;
                        } else throw new Error("Estructura JSON inválida en piloto ES/EN.");
                    } catch (err) {
                        UI.log(`[Error Piloto ES/EN] Fila ${i + 2}: ${err.message}`);
                        await new Promise(r => setTimeout(r, 3000));
                        currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length;
                    }
                }
                await new Promise(r => setTimeout(r, 1000));
                if (typeof UI.renderTable === 'function') UI.renderTable();
            }
        }

        UI.log("[FIN] Proceso finalizado. Contenido en Castellano e Inglés generado con éxito.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        try {
            if (typeof UI.renderRadiosIdiomas === 'function') UI.renderRadiosIdiomas();
            if (typeof UI.inicializarAjustesExpertos === 'function') UI.inicializarAjustesExpertos();
            if (typeof UI.actualizarListaKeys === 'function') UI.actualizarListaKeys();
        } catch (e) {
            console.warn("[Aviso Auto-UI] Interfaz inicializada parcialmente o esperando datos del app.js:", e.message);
        }
    }, 150);
});
