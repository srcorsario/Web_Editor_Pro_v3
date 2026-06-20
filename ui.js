// ui.js (Web_Editor_Pro)
// Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.ui = '1.0.13-BRUTE-FORCE-RETRY'; 

// NUEVO: Referencias globales reestablecidas para compatibilidad con version antigua
window.APP_VERSIONS.config = window.APP_VERSIONS.config || '1.0.0';
window.APP_VERSIONS.app = window.APP_VERSIONS.app || '1.0.33';

let currentKeyIndex = 0;
let procesoDetenido = false;
let procesoPausado = false;
let activeLang = 'EN';

const stateContainer = {
    headers: [],
    csvData: [],
    currentProMode: 'RG' // NUEVO: Estado local para la pestaña Pro (RG o USOPEN)
};

export const UI = {
    log: (mensaje) => {
        console.log(`[Editor Pro] ${mensaje}`);
        
        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) {
            statusCarga.innerText = mensaje;
        }

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
        if (keys.length === 0) {
            selectEl.innerHTML = '<option value="">No hay API Keys cargadas</option>';
            selectEl.disabled = true;
            return;
        }

        selectEl.disabled = false;
        selectEl.innerHTML = keys.map((k, i) => {
            const resumida = k.length > 10 ? `${k.substring(0, 6)}...${k.substring(k.length - 4)}` : k;
            return `<option value="${k}">Key ${i + 1}: ${resumida}</option>`;
        }).join('');
    },

    renderRadiosIdiomas: () => {
        const container = document.getElementById('radiosIdiomas');
        if (!container) return;

        // MODIFICADO: Validación defensiva estricta para asegurar la existencia del diccionario de idiomas
        let idiomas = window.IDIOMAS_CONFIG || {};
        if (Object.keys(idiomas).length === 0) {
            idiomas = {
                "EN": "🇬🇧 English",
                "ES": "🇪🇸 Español",
                "KO": "🇰🇷 한국어"
            };
        } else if (!idiomas.hasOwnProperty("KO")) {
            idiomas["KO"] = "🇰🇷 한국어";
        }

        let html = '<div class="flex flex-wrap gap-1.5">';

        for (const [code, name] of Object.entries(idiomas)) {
            if (code === 'ES') continue; 
            const isActive = code === activeLang ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600';
            html += `<button class="lang-btn text-xs py-1.5 px-2.5 rounded font-semibold transition-all ${isActive}" data-lang="${code}">${name}</button>`;
        }
        html += '</div>';
        
        // NUEVO: Sanitización e inserción segura en el contenedor del DOM verificado
        container.innerHTML = html;

        container.querySelectorAll('.lang-btn').forEach(btn => {
            btn.onclick = () => {
                activeLang = btn.dataset.lang;
                
                container.querySelectorAll('.lang-btn').forEach(b => {
                    b.classList.remove('bg-amber-600', 'text-white', 'shadow-md');
                    b.classList.add('bg-slate-700', 'text-slate-300');
                });
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

        if (stateContainer.headers.length === 0) {
            tableHeadRow.innerHTML = '';
            tablaBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500 italic">Ningún archivo cargado en el sistema. Selecciona un origen arriba.</td></tr>';
            return;
        }

        const selectedLang = activeLang;
        let idiomas = window.IDIOMAS_CONFIG || { "EN": "🇬🇧 English", "KO": "🇰🇷 한국어" };
        if (!idiomas.hasOwnProperty("KO")) idiomas["KO"] = "🇰🇷 한국어";

        const idIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'ID');
        const esIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');
        const langIdx = stateContainer.headers.findIndex(h => h && h.toUpperCase() === `NOMBRE_${selectedLang}`);

        if (idIdx === -1 || esIdx === -1) {
            tablaBody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500 italic">Estructura de CSV no reconocida (Faltan columnas ID o Nombre_ES).</td></tr>';
            return;
        }

        const langName = idiomas[selectedLang] || selectedLang;

        tableHeadRow.innerHTML = `<tr>
            <th style="width: 60px;">Fila</th>
            <th style="width: 70px;">ID</th>
            <th style="width: calc(50% - 65px);">Castellano (ES)</th>
            <th style="width: calc(50% - 65px);">${langName} (${selectedLang})</th>
        </tr>`;

        const rangoInicioEl = document.getElementById('rangoInicio');
        const rangoFinEl = document.getElementById('rangoFin');
        const inicio = rangoInicioEl ? Math.max(0, parseInt(rangoInicioEl.value) - 2) : 0;
        const fin = rangoFinEl ? Math.min(stateContainer.csvData.length, parseInt(rangoFinEl.value) - 1) : stateContainer.csvData.length;
        const datosFiltrados = stateContainer.csvData.slice(inicio, fin);

        tablaBody.innerHTML = datosFiltrados.map((row, index) => {
            const rowNum = inicio + index + 2; 
            const idVal = row[idIdx] || '';
            const esVal = row[esIdx] || '';
            const langVal = langIdx !== -1 ? (row[langIdx] || '') : 'N/A';
            return `<tr>
                <td style="width: 60px; text-align: center;">${rowNum}</td>
                <td style="width: 70px; text-align: center;">${idVal}</td>
                <td style="width: calc(50% - 65px);">${esVal}</td>
                <td style="width: calc(50% - 65px);">${langVal}</td>
            </tr>`;
        }).join('');
    },

    // MODIFICADO: Ahora acepta una URL explícita para evitar confusión con múltiples inputs
    cargarGoogleSheets: async (targetUrl, retryCount = 0) => {
        const DANGER_WINDOW_MS = 15000;
        const MAX_RETRIES = 5;
        
        if (!targetUrl) return UI.log("[Error] No se proporcionó una URL válida.");
        
        const timeSinceSave = Date.now() - window.lastSaveAttempt;
        const isDangerZone = timeSinceSave < DANGER_WINDOW_MS;

        UI.log(`[Info] Descargando CSV desde Google Sheets (${targetUrl.substring(0, 40)}...)...`);
        try {
            // MODIFICADO: Parámetro 'zx' y cabeceras forzadas
            const resp = await fetch(targetUrl + '&zx=' + Date.now(), { 
                cache: "no-store",
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } 
            });
            if (!resp.ok) throw new Error("Error HTTP " + resp.status);
            const text = await resp.text();
            
            // NUEVO: Lógica "Brute Force" para CDN
            if (isDangerZone && retryCount < MAX_RETRIES) {
                console.warn(`[UI] ⚠️ Zona de Peligro. Reintento automático #${retryCount + 1}...`);
                UI.log(`[Info] Verificando datos post-guardado (Intento ${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(r => setTimeout(r, 300));
                return UI.cargarGoogleSheets(targetUrl, retryCount + 1);
            }

            if (window.Papa) {
                window.Papa.parse(text, {
                    skipEmptyLines: true,
                    complete: (resultado) => {
                        if (resultado.data && resultado.data.length > 0) {
                            stateContainer.headers = resultado.data[0];
                            stateContainer.csvData = resultado.data.slice(1);
                            UI.log(`[OK] CSV de Google Sheets cargado. Filas: ${stateContainer.csvData.length}, Columnas: ${stateContainer.headers.length}`);
                            
                            // NUEVO: Actualizar el texto del botón de sincronización
                            UI.actualizarTextoBotonSync();
                            
                            UI.renderTable();
                        }
                    }
                });
            } else {
                const lineas = text.split(/\r?\n/).filter(line => line.trim() !== "");
                if (lineas.length > 0) {
                    stateContainer.headers = lineas[0].split(",").map(h => h.replace(/^"|"$/g, '').trim());
                    stateContainer.csvData = lineas.slice(1).map(f => f.split(",").map(v => v.replace(/^"|"$/g, '').trim()));
                    UI.log(`[OK] CSV cargado (Fallback). Filas: ${stateContainer.csvData.length}`);
                    
                    // NUEVO: Actualizar el texto del botón de sincronización
                    UI.actualizarTextoBotonSync();
                    
                    UI.renderTable();
                }
            }
        } catch (e) {
            UI.log("[Error] Fallo al descargar o procesar el CSV: " + e.message);
        }
    },

    // NUEVO: Función auxiliar para actualizar el texto del botón de sincronización
    actualizarTextoBotonSync: () => {
        const btn = document.getElementById('btnSyncSheets');
        if (!btn) return;
        
        const contexto = stateContainer.currentProMode;
        if (contexto === 'USOPEN') {
            btn.innerText = "☁️ Sincronizar con Google Sheet USOPEN";
        } else {
            btn.innerText = "☁️ Sincronizar con Google Sheet RG";
        }
    },

    sincronizarConGoogleSheets: async () => {
        if (stateContainer.headers.length === 0 || stateContainer.csvData.length === 0) {
            return UI.log("[Error] No hay datos en memoria para sincronizar. Carga un archivo primero.");
        }

        // NUEVO: Usar currentProMode para determinar destino
        const modo = stateContainer.currentProMode;
        const contextoNombre = modo === 'USOPEN' ? 'USOPEN' : 'RG';
        
        UI.log(`[Sincro] Preparando envío a: ${contextoNombre}...`);

        UI.log("[Sincro] Analizando cabeceras reales de la hoja para mapeo seguro...");
        
        const findIdx = (keywords) => {
            for (const kw of keywords) {
                const idx = stateContainer.headers.findIndex(h => h && h.toUpperCase().includes(kw));
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const idxId = findIdx(['ID']);
        const idxPrecio = findIdx(['PRECIO', 'PRICE']);
        const idxEstado = findIdx(['ACTIVA', 'ESTADO', 'ACTIVO']);
        const idxCarpeta = findIdx(['CARPETA', 'FOLDER']);
        const idxImagen = findIdx(['ARCHIVO_FOTO', 'IMAGEN', 'FOTO']);
        const idxAlergenos = findIdx(['ALERGENOS_COD', 'ALERG']);

        if (idxId === -1) {
            return UI.log("[Error Crítico] No se encuentra la columna 'ID'. Sincronización cancelada por seguridad.");
        }

        UI.log(`[Sincro] Mapeo detectado -> ID:${idxId} | Precio:${idxPrecio} | Estado/Activa:${idxEstado} | Carpeta:${idxCarpeta} | Imagen:${idxImagen} | Alergenos:${idxAlergenos}`);

        const mappedLangs = stateContainer.headers.map((h, i) => {
            if (h && h.trim().toUpperCase().startsWith("NOMBRE_")) {
                let langKey = h.trim().toUpperCase().replace("NOMBRE_", "").toLowerCase();
                return `${h.trim()} (col ${i}) -> nombre_${langKey}`;
            }
            return null;
        }).filter(Boolean);
        UI.log(`[Sincro-Debug] Idiomas detectados en cabeceras para envío: ${mappedLangs.join(', ')}`);

        const totalColumnasEsperadas = stateContainer.headers.length;

        const payload = stateContainer.csvData.map(row => {
            while (row.length < totalColumnasEsperadas) {
                row.push("");
            }

            let obj = {
                id: parseInt(row[idxId]),
                precio: idxPrecio !== -1 ? (row[idxPrecio] || "0.00") : "0.00",
                estado: idxEstado !== -1 ? (row[idxEstado] || "no") : "no",
                carpeta: idxCarpeta !== -1 ? (row[idxCarpeta] || "") : "",
                imagen: idxImagen !== -1 ? (row[idxImagen] || "") : "",
                alergenos: idxAlergenos !== -1 ? (row[idxAlergenos] || "") : ""
            };

            stateContainer.headers.forEach((h, i) => {
                if (h && h.trim().toUpperCase().startsWith("NOMBRE_")) {
                    let langKey = h.trim().toUpperCase().replace("NOMBRE_", "").toLowerCase();
                    obj[`nombre_${langKey}`] = row[i] || "";
                }
            });

            return obj;
        }).filter(x => !isNaN(x.id) && x.id > 0);

        if (payload.length === 0) {
            return UI.log("[Error] La compilación no generó filas válidas. Verifica que la columna 'ID' exista y sea correcta.");
        }

        UI.log(`[Sincro] Enviando ${payload.length} filas completas y preservando datos originales al servidor (${contextoNombre})...`);
        
        const jsonPayload = JSON.stringify(payload);
        UI.log(`[Sincro-Debug] Tamaño del payload serializado: ${(new Blob([jsonPayload])).size / 1024} KB`);
        if (payload.length > 0) {
            UI.log(`[Sincro-Debug] Muestra del primer elemento del payload: ${JSON.stringify(payload[0])}`);
        }

        try {
            // NUEVO: Determinar URL basada en currentProMode
            let urlDestino = '';
            // MODIFICADO: Forzamos el uso de config.js basado en nuestro estado local
            if (stateContainer.currentProMode === 'USOPEN') {
                 // Hack temporal para asegurar que config.js devuelva la correcta
                 const originalMode = window.currentMode;
                 window.currentMode = 'USOPEN';
                 urlDestino = window.getWebAppUrl ? window.getWebAppUrl() : 'https://script.google.com/macros/s/AKfycbzfA3OnavQcmM3IG-7-PeHJw3U44UH5CREnLtwypxDxNQehQ4ZuM6iYqu5lt0VmUnKn/exec';
                 window.currentMode = originalMode; // Restaurar
            } else {
                 urlDestino = window.getWebAppUrl ? window.getWebAppUrl() : 'https://script.google.com/macros/s/AKfycbxBdhrRWx9GNYU_oub52jQcRrG-XRhcDIjdHHW_CYQlob3PNButhNinqw-JLNES_3Ci-w/exec';
            }

            
            UI.log(`[Sincro-Debug] URL de destino: ${urlDestino}`);
            
            const response = await fetch(urlDestino, { 
                method: 'POST', 
                mode: 'no-cors', 
                headers: { 'Content-Type': 'application/json' },
                body: jsonPayload 
            });
            
            UI.log(`[Sincro-Debug] Fetch finalizado. Tipo de respuesta: ${response.type}, Status: ${response.status}`);
            
            if (response.type === 'opaque') {
                UI.log("⚠️ [Sincro-Debug] Modo 'no-cors' activo: El navegador ha ocultado la respuesta del servidor por políticas CORS. No se puede leer si hubo un error interno en Google Apps Script.");
                UI.log(`✅ [Sincro] Petición de sincronización enviada a ${contextoNombre}. Verifica tu Google Sheet manualmente para confirmar que los datos llegaron correctamente.`);
            } else {
                UI.log(`✅ [Sincro] ¡Éxito! Sincronización completada hacia ${contextoNombre} sin pérdidas de datos.`);
            }
        } catch (e) { 
            UI.log(`❌ [Sincro] Error de red al intentar impactar los datos en Google Sheets (${contextoNombre}): ` + e.message); 
        }
    },

    inicializarAjustesExpertos: () => {
        UI.log("[Expertos] Vinculando componentes interactivos del panel avanzado de control...");

        // MODIFICADO: Ya no se establece el texto de versión aquí para evitar conflicto con index.html
        // Solo nos aseguramos de que window.APP_VERSIONS.css esté definido para que index.html lo lea.
        window.APP_VERSIONS.css = window.APP_VERSIONS.css || '1.0.6';

        const btnExportar = document.getElementById('saveCsvBtn');
        if (btnExportar) {
            btnExportar.onclick = () => {
                if (stateContainer.headers && stateContainer.csvData) {
                    UI.exportarCSV(stateContainer.headers, stateContainer.csvData);
                } else {
                    UI.log("[Error] El estado del sistema no contiene estructuras válidas de datos para proceder.");
                }
            };
        }

        const btnSyncSheets = document.getElementById('btnSyncSheets');
        if (btnSyncSheets) {
            btnSyncSheets.onclick = () => {
                UI.sincronizarConGoogleSheets();
            };
        }

        // MODIFICADO: Lógica para inputs de URL de Google Sheets (RG y USOpen)
        const loadSheetsBtnRG = document.getElementById('loadSheetsBtnRG');
        const inputRG = document.getElementById('sheetsUrlRG');
        
        if (loadSheetsBtnRG && inputRG) {
            loadSheetsBtnRG.onclick = () => {
                const url = inputRG.value.trim();
                if (url) {
                    // NUEVO: Establecer modo y cargar
                    stateContainer.currentProMode = 'RG';
                    // Sincronizar globalmente para que config.js funcione
                    window.currentMode = 'RG';
                    
                    UI.cargarGoogleSheets(url);
                } else {
                    UI.log("[Error] La URL para RG está vacía.");
                }
            };
        }

        const loadSheetsBtnUSOpen = document.getElementById('loadSheetsBtnUSOpen');
        const inputUSOpen = document.getElementById('sheetsUrlUSOpen');

        if (loadSheetsBtnUSOpen && inputUSOpen) {
            loadSheetsBtnUSOpen.onclick = () => {
                const url = inputUSOpen.value.trim();
                if (url) {
                    // NUEVO: Establecer modo y cargar
                    stateContainer.currentProMode = 'USOPEN';
                    // Sincronizar globalmente
                    window.currentMode = 'USOPEN';
                    
                    UI.cargarGoogleSheets(url);
                } else {
                    UI.log("[Error] La URL para USOpen está vacía.");
                }
            };
        }

        // NUEVO: Lógica para importar CSV local con Modal de Selección
        const inputImportar = document.getElementById('archivoLocal');
        if (inputImportar) {
            inputImportar.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Guardamos el archivo temporalmente y mostramos el modal
                    window.UI.tempImportFile = file;
                    document.getElementById('modal-seleccionar-destino').style.display = 'block';
                }
            };
        }

        const btnIniciar = document.getElementById('btnIniciar');
        if (btnIniciar) {
            btnIniciar.onclick = () => {
                UI.iniciarTraduccionPorLotes(stateContainer);
            };
        }

        const btnPausa = document.getElementById('btnPausa');
        if (btnPausa) {
            btnPausa.onclick = () => {
                procesoPausado = !procesoPausado;
                btnPausa.innerText = procesoPausado ? "REANUDAR" : "PAUSAR";
                UI.log(procesoPausado ? "[Info] Ejecución en segundo plano pausada temporalmente." : "[Info] Reanudando procesamiento de traducciones...");
            };
        }

        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.onclick = () => {
                procesoDetenido = true;
                UI.log("[Info] Enviando señal de interrupción al bucle de peticiones distribuidas...");
            };
        }
    },

    // NUEVO: Función llamada por el modal para confirmar importación
    confirmarImportacion: (mode) => {
        const file = window.UI.tempImportFile;
        if (!file) return UI.log("[Error] No se encontró el archivo temporal.");

        const modoDefinitivo = mode.toUpperCase();
        stateContainer.currentProMode = modoDefinitivo;
        window.currentMode = modoDefinitivo;
        
        UI.log(`[Import] Archivo local seleccionado. Destino asignado: ${modoDefinitivo}`);
        
        UI.importarCSV(file, (headers, data) => {
            stateContainer.headers = headers;
            stateContainer.csvData = data;
            UI.log(`[OK] Archivo cargado en memoria externa. Filas procesadas: ${data.length}`);
            
            // NUEVO: Actualizar botón sync
            UI.actualizarTextoBotonSync();
            
            if (typeof UI.renderTable === 'function') {
                UI.renderTable();
            }
        });

        // Limpiar y cerrar modal
        UI.cancelarImportacion();
    },

    // NUEVO: Función para cerrar modal y limpiar input
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
            if (window.Papa) {
                resultadoTexto = window.Papa.unparse([headers, ...csvData]);
            } else {
                resultadoTexto = [headers, ...csvData].map(row => 
                    row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
                ).join("\n");
            }
            const blob = new Blob([resultadoTexto], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = 'exportacion_expertos_final.csv';
            link.click();
            UI.log("[OK] Operación exitosa: Archivo binario CSV transferido al almacenamiento local del PC.");
        } catch (err) {
            UI.log(`[Error Exportar] Interrupción crítica en la compilación de datos: ${err.message}`);
        }
    },

    importarCSV: (file, callback) => {
        const lector = new FileReader();
        lector.onload = (e) => {
            const contenidoCrudo = e.target.result;
            try {
                if (window.Papa) {
                    window.Papa.parse(contenidoCrudo, {
                        skipEmptyLines: true,
                        complete: (resultado) => {
                            if (resultado.data && resultado.data.length > 0) {
                                const headers = resultado.data[0];
                                const data = resultado.data.slice(1);
                                callback(headers, data);
                            }
                        }
                    });
                } else {
                    const lineas = contenidoCrudo.split(/\r?\n/).filter(line => line.trim() !== "");
                    if (lineas.length > 0) {
                        const headers = lineas[0].split(",").map(h => h.replace(/^"|"$/g, '').trim());
                        const data = lineas.slice(1).map(f => f.split(",").map(v => v.replace(/^"|"$/g, '').trim()));
                        callback(headers, data);
                    }
                }
            } catch (err) {
                UI.log(`[Error Importar] Imposible procesar la estructura tabular provista: ${err.message}`);
            }
        };
        lector.readAsText(file);
    },

    iniciarTraduccionPorLotes: async (stateContainerParam) => {
        procesoDetenido = false;
        procesoPausado = false;
        
        const listaClavesAPI = getKeys();
        if (listaClavesAPI.length === 0) {
            return UI.log("[Error] Operación abortada: Introduzca al menos una API Key válida en el almacenamiento local.");
        }

        const activeStateContainer = stateContainerParam || stateContainer;

        if (!activeStateContainer || !activeStateContainer.headers || !activeStateContainer.csvData) {
            return UI.log("[Error] La estructura de datos o cabeceras del estado se encuentra corrupta o vacía.");
        }

        const selectorInicio = document.getElementById('rangoInicio');
        const selectorFin = document.getElementById('rangoFin');
        const rangoInicio = selectorInicio ? (parseInt(selectorInicio.value) - 2 || 0) : 0;
        const rangoFin = selectorFin ? (parseInt(selectorFin.value) - 1 || activeStateContainer.csvData.length) : activeStateContainer.csvData.length;

        const ENDPOINT_GATEWAY = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";
        const columnasIdiomasDestino = activeStateContainer.headers.map((h, i) => (h && h.toUpperCase().startsWith("NOMBRE_") && h.toUpperCase() !== "NOMBRE_ES") ? i : -1).filter(i => i !== -1);
        const indiceCastellanoBase = activeStateContainer.headers.findIndex(h => h && h.toUpperCase() === 'NOMBRE_ES');

        if (indiceCastellanoBase === -1) {
            return UI.log("[Error] Estructura incompatible: Falta la columna pivote requerida 'Nombre_ES'.");
        }

        let totalPeticionesExitosas = 0;
        const matrizFilasPendientes = [];
        const techoLimiteEvaluacion = Math.min(rangoFin, activeStateContainer.csvData.length);

        for (let i = Math.max(0, rangoInicio); i < techoLimiteEvaluacion; i++) {
            const cadenaCastellano = activeStateContainer.csvData[i][indiceCastellanoBase] || "Sin nombre";
            const indicesColumnasVacias = columnasIdiomasDestino.filter(idx => !activeStateContainer.csvData[i][idx] || activeStateContainer.csvData[i][idx].trim() === "");
            
            if (indicesColumnasVacias.length > 0) {
                matrizFilasPendientes.push({
                    indiceMatriz: i,
                    numeroFilaHumana: i + 2,
                    textoES: cadenaCastellano,
                    indicesColumnasFaltantes: indicesColumnasVacias,
                    codigosIdiomas: indicesColumnasVacias.map(idx => activeStateContainer.headers[idx].replace("Nombre_", "").replace("nombre_", ""))
                });
            }
        }

        if (matrizFilasPendientes.length === 0) {
            UI.log("[FIN] Integridad total verificada: No quedan celdas vacías por traducir en el rango seleccionado.");
            return;
        }

        UI.log(`[Info] Auditoría completada. Se detectaron ${matrizFilasPendientes.length} filas incompletas. Agrupando en micro-lotes distribuidos...`);
        const TAMANO_LOTE = 3;

        for (let j = 0; j < matrizFilasPendientes.length; j += TAMANO_LOTE) {
            if (procesoDetenido) break;
            while (procesoPausado) { 
                await new Promise(resolve => setTimeout(resolve, 500)); 
            }

            const loteActual = matrizFilasPendientes.slice(j, j + TAMANO_LOTE);
            const estructuraPromptPayload = loteActual.map(p => ({
                id_fila: p.numeroFilaHumana,
                texto: p.textoES,
                idiomas_requeridos: p.codigosIdiomas
            }));

            const secuenciaImpresionFilas = loteActual.map(p => p.numeroFilaHumana).join(', ');
            UI.log(`[Procesando Lote] Segmento Filas [${secuenciaImpresionFilas}] -> Transmitiendo payload agrupado a la API de Gemini...`);

            let peticionSatisfecha = false;
            while (!peticionSatisfecha && !procesoDetenido) {
                try {
                    const instruccionesEstructuralesIA = `Actúa como un traductor experto de menús de restaurantes. Te paso un array de objetos con textos en español, su id_fila correspondiente y los idiomas ISO a los que debes traducirlos.
                    Datos de entrada: ${JSON.stringify(estructuraPromptPayload)}
                    Responde EXCLUSIVAMENTE con un JSON plano que contenga una propiedad raíz llamada "lote", la cual guardará un array de objetos. Cada objeto debe mantener obligatoriamente su "id_fila" y un objeto "traducciones" con las claves de idioma solicitadas. No inventes filas, no agregues texto explicativo, ni abras bloques de código fuera del JSON.
                    Ejemplo de formato de respuesta esperado:
                    {"lote": [{"id_fila": 8, "traducciones": {"EN": "Children menu", "FR": "Menu enfant"}} ]}`;

                    const callResponse = await fetch(`${ENDPOINT_GATEWAY}?key=${listaClavesAPI[currentKeyIndex]}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: instruccionesEstructuralesIA }] }] })
                    });

                    const respuestaJsonData = await callResponse.json();
                    
                    if (respuestaJsonData.error?.code === 429) {
                        currentKeyIndex = (currentKeyIndex + 1) % listaClavesAPI.length;
                        UI.log(`[Aviso de Red] Límite superado. Rotando balanceo defensivo hacia la Key Índice: ${currentKeyIndex + 1}...`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        continue; 
                    }

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
                                        if (filaLote.traducciones[codigoIdiomaISO]) {
                                            activeStateContainer.csvData[objetivoFilaMemoria.indiceMatriz][idxCol] = filaLote.traducciones[codigoIdiomaISO].replace(/[\(\)""'']/g, '');
                                        }
                                    });
                                }
                            });

                            UI.log(`[OK Lote] Bloque de filas [${secuenciaImpresionFilas}] inyectado exitosamente en caliente.`);
                            totalPeticionesExitosas++; 
                            peticionSatisfecha = true;
                        } else {
                            throw new Error("La firma del JSON no contiene el nodo raíz de encapsulación 'lote'.");
                        }
                    }
                } catch (errorCapturado) {
                    UI.log(`[Error Lote] Fallo en la resolución del segmento [${secuenciaImpresionFilas}]: ${errorCapturado.message}. Reintentando en 3000ms...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    if (errorCapturado.message.includes("Unexpected token") || errorCapturado.message.includes("API key")) {
                        break;
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 2500)); 
            if (typeof UI.renderTable === 'function') {
                UI.renderTable();
            }
        }

        if (procesoDetenido) {
            UI.log(`[FIN] Ejecución abortada manualmente por demanda explícita del usuario. Peticiones consumidas: ${totalPeticionesExitosas}`);
        } else {
            UI.log(`----------------------------------------------------------------------`);
            UI.log(`[FIN] ¡Flujo masivo completado! Base de datos de traducciones al día.`);
            UI.log(`[Estadísticas] Peticiones de red totales consumidas en Gemini: ${totalPeticionesExitosas}`);
            UI.log(`----------------------------------------------------------------------`);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.actualizarListaKeys();
    UI.renderRadiosIdiomas();
    UI.inicializarAjustesExpertos();

    const addKeyBtn = document.getElementById('addKeyBtn');
    if (addKeyBtn) {
        addKeyBtn.onclick = () => {
            const input = document.getElementById('nuevaKey');
            if (input && input.value.trim()) {
                saveKey(input.value.trim());
                input.value = "";
                UI.actualizarListaKeys();
                UI.log("[OK] Nueva API Key agregada al sistema.");
            }
        };
    }

    const btnEliminarKeySeleccionada = document.getElementById('btnEliminarKeySeleccionada');
    if (btnEliminarKeySeleccionada) {
        btnEliminarKeySeleccionada.onclick = () => {
            const selectEl = document.getElementById('selectKeys');
            if (selectEl && selectEl.value) {
                deleteKey(selectEl.value);
                UI.actualizarListaKeys();
                UI.log("[OK] API Key eliminada del almacenamiento local.");
            } else {
                UI.log("[Aviso] No hay ninguna Key seleccionada para eliminar.");
            }
        };
    }
});

// CORRECCIÓN: Exponer UI al objeto global para que funcione con los onclick del HTML
window.UI = UI;
