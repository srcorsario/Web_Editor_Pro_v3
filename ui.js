// =========================================
// REPOSITORIO: Web_Editor_Pro_v3 (PRINCIPAL)
// ARCHIVO: ui.js (Versión Completa y Definitiva - Sin Maridaje de Vinos)
// =========================================

window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.ui = '1.5.3-SIN-MARIDAJE';

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

        if (typeof UI.renderQA === 'function') UI.renderQA();
    },

    // ==========================================
    // EDICIÓN DE PREGUNTAS Y RESPUESTAS (ES / EN)
    // Usa la misma lista cargada (stateContainer) que la pestaña "Traductor Pro".
    // Lee/edita las columnas INFO_ES e INFO_EN (JSON: desc, q1, r1, q2, r2, q3, r3).
    // ==========================================
    renderQA: () => {
        const cont = document.getElementById('qa-lista');
        if (!cont) return; // La pestaña QA no está presente en esta página.

        if (!stateContainer.headers || stateContainer.headers.length === 0 || !stateContainer.csvData || stateContainer.csvData.length === 0) {
            cont.innerHTML = '<p class="text-center py-8 text-slate-500 italic">No hay ninguna lista cargada. Ve a la pestaña "3. Traductor Pro" y carga un CSV o una Google Sheet primero.</p>';
            return;
        }

        const esIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');
        const infoEsIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'INFO_ES');
        const infoEnIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'INFO_EN');
        const carpetaIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'CARPETA');

        if (esIdx === -1 || infoEsIdx === -1 || infoEnIdx === -1) {
            cont.innerHTML = '<p class="text-center py-8 text-slate-500 italic">Faltan columnas NOMBRE_ES, INFO_ES o INFO_EN en la lista cargada.</p>';
            return;
        }

        const rangoInicioEl = document.getElementById('rangoInicio');
        const rangoFinEl = document.getElementById('rangoFin');
        const inicio = rangoInicioEl ? Math.max(0, parseInt(rangoInicioEl.value) - 2) : 0;
        const fin = rangoFinEl ? Math.min(stateContainer.csvData.length, parseInt(rangoFinEl.value) - 1) : stateContainer.csvData.length;

        const filtroEl = document.getElementById('qa-filtro');
        const soloConDatosEl = document.getElementById('qa-solo-con-datos');
        const filtroTexto = filtroEl ? filtroEl.value.trim().toLowerCase() : '';
        const mostrarSoloConDatos = soloConDatosEl ? soloConDatosEl.checked : false;

        const parseInfo = (raw) => {
            if (!raw || !raw.trim()) return {};
            try { return JSON.parse(raw); } catch (e) { return { _errorParse: true, _raw: raw }; }
        };

        const filas = stateContainer.csvData
            .map((row, index) => ({ row, index }))
            .slice(inicio, fin)
            .filter(({ row }) => {
                const nombre = (row[esIdx] || '').toLowerCase();
                if (filtroTexto && !nombre.includes(filtroTexto)) return false;
                if (mostrarSoloConDatos) {
                    const tieneEs = row[infoEsIdx] && row[infoEsIdx].trim();
                    const tieneEn = row[infoEnIdx] && row[infoEnIdx].trim();
                    if (!tieneEs && !tieneEn) return false;
                }
                return true;
            });

        if (filas.length === 0) {
            cont.innerHTML = '<p class="text-center py-8 text-slate-500 italic">Ningún plato coincide con el filtro actual.</p>';
            return;
        }

        const CAMPOS = [
            { key: 'desc', label: 'Descripción' },
            { key: 'q1', label: 'Pregunta 1' },
            { key: 'r1', label: 'Respuesta 1' },
            { key: 'q2', label: 'Pregunta 2' },
            { key: 'r2', label: 'Respuesta 2' },
            { key: 'q3', label: 'Pregunta 3 (alérgenos)' },
            { key: 'r3', label: 'Respuesta 3 (alérgenos)' },
        ];

        // Auto-size vertical de un textarea según su contenido (sin scroll interno).
        const autoResize = (ta) => {
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
        };

        // Iguala la altura entre el textarea ES y el EN del mismo campo (usa la más alta de las dos).
        const sincronizarCampo = (bodyDiv, key) => {
            const tas = bodyDiv.querySelectorAll(`textarea[data-field="${key}"]`);
            if (tas.length === 0) return;
            tas.forEach(ta => { ta.style.height = 'auto'; });
            let maxH = 0;
            tas.forEach(ta => { maxH = Math.max(maxH, ta.scrollHeight); });
            tas.forEach(ta => { ta.style.height = maxH + 'px'; });
        };

        const sincronizarTodoElCuerpo = (bodyDiv) => {
            CAMPOS.forEach(campo => sincronizarCampo(bodyDiv, campo.key));
        };

        cont.innerHTML = '';

        filas.forEach(({ row, index }) => {
            const nombreEs = row[esIdx] || `(Fila ${index + 2} sin nombre)`;
            const esVinoFila = carpetaIdx !== -1 && (row[carpetaIdx] || '').trim().toLowerCase() === 'vinos';

            // --- Cabecera del acordeón (siempre visible) ---
            const item = document.createElement('div');
            item.className = 'card mb-2';
            item.style.padding = '0';

            const headerBtn = document.createElement('button');
            headerBtn.type = 'button';
            headerBtn.className = 'w-full text-left flex items-center justify-between';
            headerBtn.style.cssText = 'padding:12px 14px; background:transparent; border:none; cursor:pointer; color:inherit;';
            headerBtn.innerHTML = `<span class="font-semibold text-sm">Fila ${index + 2} — ${nombreEs}</span><span class="qa-chevron text-slate-400" style="display:inline-block; transition: transform 0.15s;">▸</span>`;

            const bodyDiv = document.createElement('div');
            bodyDiv.style.display = 'none';
            bodyDiv.style.padding = '0 14px 14px 14px';
            bodyDiv.style.borderTop = '1px solid #334155';

            let construido = false;

            // --- Construcción perezosa del contenido (solo al desplegar por primera vez) ---
            const construirCuerpo = () => {
                const infoEs = parseInfo(row[infoEsIdx]);
                const infoEn = parseInfo(row[infoEnIdx]);

                const guardarEs = () => { row[infoEsIdx] = infoEs._errorParse ? infoEs._raw : (Object.keys(infoEs).length ? JSON.stringify(infoEs) : ''); };
                const guardarEn = () => { row[infoEnIdx] = infoEn._errorParse ? infoEn._raw : (Object.keys(infoEn).length ? JSON.stringify(infoEn) : ''); };

                const buildCol = (obj, guardar, titulo) => {
                    const colDiv = document.createElement('div');
                    const h4 = document.createElement('h4');
                    h4.className = 'text-xs font-bold uppercase text-slate-400 mb-2 pt-3';
                    h4.innerText = titulo;
                    colDiv.appendChild(h4);

                    if (obj._errorParse) {
                        const warn = document.createElement('p');
                        warn.className = 'text-xs mb-1';
                        warn.style.color = '#f87171';
                        warn.innerText = '⚠️ Contenido guardado no es un JSON válido. Edítalo con cuidado:';
                        colDiv.appendChild(warn);
                        const raw = document.createElement('textarea');
                        raw.className = 'input-estandar text-xs w-full';
                        raw.style.cssText = 'overflow:hidden; resize:none; min-height:60px;';
                        raw.value = obj._raw;
                        raw.addEventListener('input', () => { obj._raw = raw.value; guardar(); autoResize(raw); });
                        colDiv.appendChild(raw);
                        return colDiv;
                    }

                    CAMPOS.forEach(campo => {
                        // Los vinos solo llevan descripción (sin preguntas/respuestas).
                        if (esVinoFila && campo.key !== 'desc') return;
                        // q3/r3 solo se muestran si el plato ya los tiene (no todos llevan alérgenos)
                        if ((campo.key === 'q3' || campo.key === 'r3') && obj[campo.key] === undefined) return;
                        const wrap = document.createElement('div');
                        wrap.className = 'mb-2';
                        const lbl = document.createElement('label');
                        lbl.className = 'text-[10px] font-semibold text-slate-400 block mb-0.5';
                        lbl.innerText = campo.label;
                        const txt = document.createElement('textarea');
                        txt.className = 'input-estandar text-xs w-full';
                        txt.dataset.field = campo.key;
                        txt.style.cssText = 'overflow:hidden; resize:none; min-height:30px;';
                        txt.value = obj[campo.key] || '';
                        txt.addEventListener('input', () => {
                            obj[campo.key] = txt.value;
                            guardar();
                            sincronizarCampo(bodyDiv, campo.key);
                        });
                        wrap.appendChild(lbl);
                        wrap.appendChild(txt);
                        colDiv.appendChild(wrap);
                    });
                    return colDiv;
                };

                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
                grid.appendChild(buildCol(infoEs, guardarEs, '🇪🇸 Español'));
                grid.appendChild(buildCol(infoEn, guardarEn, '🇬🇧 Inglés'));
                bodyDiv.appendChild(grid);
            };

            headerBtn.addEventListener('click', () => {
                const abierto = bodyDiv.style.display !== 'none';
                const chevron = headerBtn.querySelector('.qa-chevron');
                if (abierto) {
                    bodyDiv.style.display = 'none';
                    if (chevron) chevron.style.transform = 'rotate(0deg)';
                } else {
                    if (!construido) { construirCuerpo(); construido = true; }
                    bodyDiv.style.display = 'block';
                    if (chevron) chevron.style.transform = 'rotate(90deg)';
                    // El auto-size necesita que el bloque ya sea visible para medir el alto real.
                    requestAnimationFrame(() => sincronizarTodoElCuerpo(bodyDiv));
                }
            });

            item.appendChild(headerBtn);
            item.appendChild(bodyDiv);
            cont.appendChild(item);
        });
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
        const btnIniciarNombres = document.getElementById('btnIniciarNombres');
        if (btnIniciarNombres) btnIniciarNombres.onclick = () => UI.iniciarTraduccionNombresPorLotes(stateContainer);
        const btnPausa = document.getElementById('btnPausa');
        if (btnPausa) btnPausa.onclick = () => { procesoPausado = !procesoPausado; btnPausa.innerText = procesoPausado ? "REANUDAR" : "PAUSAR"; UI.log(procesoPausado ? "[Info] Pausado." : "[Info] Reanudando..."); };
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) btnCancelar.onclick = () => { procesoDetenido = true; UI.log("[Info] Deteniendo bucle..."); };

        const btnQaRefrescar = document.getElementById('qa-refrescar');
        if (btnQaRefrescar) btnQaRefrescar.onclick = () => UI.renderQA();
        const inputQaFiltro = document.getElementById('qa-filtro');
        if (inputQaFiltro) inputQaFiltro.oninput = () => UI.renderQA();
        const checkQaSoloConDatos = document.getElementById('qa-solo-con-datos');
        if (checkQaSoloConDatos) checkQaSoloConDatos.onchange = () => UI.renderQA();
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
    // FLUJO PILOTO (ES Y EN - CONTROL ESTRICTO Y BLINDADO DE ALÉRGENOS SIN MARIDAJE)
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
        const indiceId = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'ID');
        const indiceCarpeta = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'CARPETA');

        if (indiceCastellanoBase === -1 || indiceInglesBase === -1 || indiceInfoEs === -1 || indiceInfoIngles === -1) {
            return UI.log("[Error Crítico] Faltan columnas base obligatorias (NOMBRE_ES, NOMBRE_EN, INFO_ES o INFO_EN).");
        }

        const techoLimiteEvaluacion = Math.min(rangoFin, activeStateContainer.csvData.length);

        // Carpetas de bebidas simples que no necesitan descripción ni preguntas generadas por IA.
        const CARPETAS_SIN_IA = ['cafe', 'refrescos', 'cerveza'];
        const TAMANO_LOTE_INFO = (typeof window.INFO_EXTENDIDA_TAMANO_LOTE === 'number' && window.INFO_EXTENDIDA_TAMANO_LOTE > 0) ? window.INFO_EXTENDIDA_TAMANO_LOTE : 2;

        UI.log("[Paso 1] Generando contenido en Castellano e Inglés (ES / EN) sin maridajes y con alérgenos blindados. Vinos: solo descripción. Bebidas simples (café/refrescos/cerveza) y cabeceras de categoría: omitidas...");

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

        UI.log(`[Info] Pendientes: ${pendientesPlatos.length} platos, ${pendientesVinos.length} vinos. Lotes de ${TAMANO_LOTE_INFO}.`);

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

            while (!satisfecho && !procesoDetenido && intentosLote < maxIntentosLote) {
                try {
                    const callResponse = await fetch(`${window.GEMINI_ENDPOINT_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'}?key=${listaClavesAPI[currentKeyIndex]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptLote }] }] }) });

                    const textResponse = await callResponse.text();
                    let respuestaJsonData;
                    try {
                        respuestaJsonData = JSON.parse(textResponse);
                    } catch (e) {
                        throw new Error("La API devolvió HTML o texto plano (Posible 403 o error de cuota).");
                    }

                    if (respuestaJsonData.error?.code === 429) {
                        currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length;
                        limitesConsecutivos++;
                        if (limitesConsecutivos >= listaClavesAPI.length) {
                            UI.log(`[Error Crítico] Cuota de Gemini agotada en TODAS las keys disponibles (${listaClavesAPI.length}). Deteniendo el proceso para no malgastar más peticiones.`);
                            return 'cuota_agotada';
                        }
                        UI.log(`[Aviso] Límite superado en el lote (filas ${items.map(it => it.fila + 2).join(', ')}). Rotando Key (${limitesConsecutivos}/${listaClavesAPI.length})...`);
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
                        algunoAplicado = true;
                        if (esVino) vinosCompletados++; else platosCompletados++;
                    });
                    satisfecho = true;
                    return algunoAplicado ? 'ok' : 'error';
                } catch (err) {
                    limitesConsecutivos = 0; // un error que no es 429 rompe la racha de "cuota agotada"
                    UI.log(`[Error ${esVino ? 'Vino' : 'Piloto'} Lote] Filas ${items.map(it => it.fila + 2).join(', ')}: ${err.message}`);
                    await new Promise(r => setTimeout(r, 3000));
                    currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length;
                    intentosLote++;
                }
            }
            return satisfecho ? 'ok' : 'error';
        };

        // ---------- Fase 1a: platos ----------
        for (let lote = 0; lote < pendientesPlatos.length && !cuotaAgotada; lote += TAMANO_LOTE_INFO) {
            if (procesoDetenido) break;
            while (procesoPausado) await new Promise(resolve => setTimeout(resolve, 500));

            const indicesLote = pendientesPlatos.slice(lote, lote + TAMANO_LOTE_INFO);
            UI.log(`[Piloto ES/EN - Lote ${Math.floor(lote / TAMANO_LOTE_INFO) + 1}/${Math.ceil(pendientesPlatos.length / TAMANO_LOTE_INFO)}] Procesando filas ${indicesLote.map(i => i + 2).join(', ')}...`);
            const resultado = await procesarLoteInfo(indicesLote, false);
            if (resultado === 'cuota_agotada') { cuotaAgotada = true; break; }

            if (typeof UI.renderTable === 'function') UI.renderTable();
            await new Promise(r => setTimeout(r, 1000));
        }

        // ---------- Fase 1b: vinos ----------
        for (let lote = 0; lote < pendientesVinos.length && !cuotaAgotada; lote += TAMANO_LOTE_INFO) {
            if (procesoDetenido) break;
            while (procesoPausado) await new Promise(resolve => setTimeout(resolve, 500));

            const indicesLote = pendientesVinos.slice(lote, lote + TAMANO_LOTE_INFO);
            UI.log(`[Vino - Lote ${Math.floor(lote / TAMANO_LOTE_INFO) + 1}/${Math.ceil(pendientesVinos.length / TAMANO_LOTE_INFO)}] Procesando filas ${indicesLote.map(i => i + 2).join(', ')}...`);
            const resultado = await procesarLoteInfo(indicesLote, true);
            if (resultado === 'cuota_agotada') { cuotaAgotada = true; break; }

            if (typeof UI.renderTable === 'function') UI.renderTable();
            await new Promise(r => setTimeout(r, 1000));
        }

        const totalPendiente = (pendientesPlatos.length - platosCompletados) + (pendientesVinos.length - vinosCompletados);
        if (cuotaAgotada) {
            UI.log(`[FIN - CUOTA AGOTADA] Se detuvo el proceso por falta de cuota en la API. Completados: ${platosCompletados} platos y ${vinosCompletados} vinos. Pendientes: ${totalPendiente}. Vuelve a pulsar "Generar Info Platos ES/EN" más tarde para continuar solo con lo que falta.`);
        } else if (totalPendiente > 0) {
            UI.log(`[FIN - INCOMPLETO] Completados: ${platosCompletados} platos y ${vinosCompletados} vinos. Pendientes: ${totalPendiente} (revisa los errores anteriores). Puedes volver a pulsar "Generar Info Platos ES/EN" para reintentar solo lo pendiente.`);
        } else {
            UI.log(`[FIN] Proceso finalizado con éxito. Completados: ${platosCompletados} platos y ${vinosCompletados} vinos.`);
        }
    },

    // ==========================================
    // NUEVO: FASE 2 - TRADUCCIÓN AUTOMÁTICA DE NOMBRES AL RESTO DE IDIOMAS
    // Reutiliza el mismo prompt (window.PROMPTS.autoTraduccionResto) y la misma
    // lógica que ya usaba el botón manual de un solo plato (ejecutarTraduccionAutomatica
    // en app.js), pero recorriendo TODOS los platos pendientes en bloques
    // (tamaño configurable vía TRADUCCION_TAMANO_LOTE en config.js).
    // ==========================================
    iniciarTraduccionNombresPorLotes: async (stateContainerParam) => {
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

        const idiomasBase = (window.IDIOMAS_ORDEN && window.IDIOMAS_ORDEN.length) ? window.IDIOMAS_ORDEN : Object.keys(window.IDIOMAS_CONFIG || {}).map(l => l.toLowerCase());
        const idiomasObjetivo = idiomasBase.filter(l => l !== 'es' && l !== 'en');

        const indiceCastellanoBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');
        const indiceInglesBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_EN');
        const indiceId = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'ID');
        const indiceCarpeta = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'CARPETA');

        if (indiceCastellanoBase === -1 || indiceInglesBase === -1) {
            return UI.log("[Error Crítico] Faltan columnas base obligatorias (NOMBRE_ES o NOMBRE_EN).");
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

        UI.log(`[Paso 2] Traduciendo nombres al resto de idiomas (${idiomasObjetivo.length} idiomas) en bloques de ${TAMANO_LOTE}. Platos pendientes: ${filasPendientes.length}.`);

        let platosCompletados = 0, cuotaAgotada = false;

        for (let lote = 0; lote < filasPendientes.length; lote += TAMANO_LOTE) {
            if (procesoDetenido || cuotaAgotada) break;
            while (procesoPausado) await new Promise(resolve => setTimeout(resolve, 500));

            const indicesLote = filasPendientes.slice(lote, lote + TAMANO_LOTE);
            UI.log(`[Lote ${Math.floor(lote / TAMANO_LOTE) + 1}/${Math.ceil(filasPendientes.length / TAMANO_LOTE)}] Procesando filas ${indicesLote.map(i => i + 2).join(', ')}...`);

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

            while (!satisfecho && !procesoDetenido && intentosLote < maxIntentosLote) {
                try {
                    const callResponse = await fetch(`${window.GEMINI_ENDPOINT_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'}?key=${listaClavesAPI[currentKeyIndex]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: promptTraduccion }] }] }) });

                    const textResponse = await callResponse.text();
                    let respuestaJsonData;
                    try {
                        respuestaJsonData = JSON.parse(textResponse);
                    } catch (e) {
                        throw new Error("La API devolvió HTML o texto plano (Posible 403 o error de cuota).");
                    }

                    if (respuestaJsonData.error?.code === 429) {
                        currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length;
                        limitesConsecutivos++;
                        if (limitesConsecutivos >= listaClavesAPI.length) {
                            UI.log(`[Error Crítico] Cuota de Gemini agotada en TODAS las keys disponibles (${listaClavesAPI.length}). Deteniendo el proceso para no malgastar más peticiones.`);
                            cuotaAgotada = true;
                            break;
                        }
                        UI.log(`[Aviso] Límite superado en el lote (filas ${itemsLote.map(it => it.fila + 2).join(', ')}). Rotando Key (${limitesConsecutivos}/${listaClavesAPI.length})...`);
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
                    UI.log(`[Error Traducción Nombres] Lote (filas ${itemsLote.map(it => it.fila + 2).join(', ')}): ${err.message}`);
                    await new Promise(r => setTimeout(r, 3000));
                    currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length;
                    intentosLote++;
                }
            }

            if (cuotaAgotada) break;
            if (typeof UI.renderTable === 'function') UI.renderTable();
            await new Promise(r => setTimeout(r, 1000));
        }

        const totalPendiente = filasPendientes.length - platosCompletados;
        if (cuotaAgotada) {
            UI.log(`[FIN - CUOTA AGOTADA] Se detuvo el proceso por falta de cuota en la API. Completados: ${platosCompletados} platos. Pendientes: ${totalPendiente}. Vuelve a pulsar el botón más tarde para continuar solo con lo que falta.`);
        } else if (totalPendiente > 0) {
            UI.log(`[FIN - INCOMPLETO] Completados: ${platosCompletados} platos. Pendientes: ${totalPendiente} (revisa los errores anteriores). Puedes volver a pulsar el botón para reintentar solo lo pendiente.`);
        } else {
            UI.log(`[FIN] Traducción de nombres finalizada con éxito. Completados: ${platosCompletados} platos.`);
        }
    }
};

// Exponer UI globalmente: necesario porque los onclick="UI...." del HTML (script clásico)
// y switchTab() no pueden acceder a las exportaciones de un <script type="module">.
window.UI = UI;

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
