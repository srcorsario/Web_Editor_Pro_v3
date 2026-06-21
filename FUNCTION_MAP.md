# INFORME DE IMPACTO
**Archivos Afectados:** 
- `config.js` (Añadida la constante `TRADUCCION_TAMANO_LOTE`).
- `ui.js` (Eliminada la variable local `TAMANO_LOTE` y sustituida por la variable global inyectada desde `config.js` en el bucle de lotes).
- `FUNCTION_MAP.md` (Actualizadas las secciones de `config.js` y `ui.js` para reflejar el nuevo parámetro).

**Razón de la modificación:** 
Extraer el tamaño del lote de traducción masiva hacia `config.js` para convertirlo en una "Única fuente de verdad". Anteriormente estaba embebido como una constante local (`const TAMANO_LOTE = 3;`) dentro de la función en `ui.js`, lo que obligaba a editar el módulo de lógica si se quería ajustar la carga de la API.

---
El archivo `app.js` no requiere modificaciones.
El archivo `data.js` no requiere modificaciones.
El archivo `index.html` no requiere modificaciones.
El archivo `languages.js` no requiere modificaciones.
El archivo `state.js` no requiere modificaciones.
El archivo `styles.css` no requiere modificaciones.
El archivo `sugerencias-print.js` no requiere modificaciones.
El archivo `utils.js` no requiere modificaciones.

---

```javascript
// --- config.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.config = '1.5.0'; // Incrementado por extracción de TRADUCCION_TAMANO_LOTE

// =====================================================================
// NUEVO: SISTEMA DE ALIAS DE MARCA (Desacoplamiento Visual)
// =====================================================================
// MODIFICADO: Identificadores lógicos internos (NO CAMBIAR NUNCA, se usan para claves y sessionStorage)
// const MODO_RG = 'RG'; 
// const MODO_USOPEN = 'USOPEN';

// NUEVO: Diccionario de Presentación. Cambia estos valores para renombrar los restaurantes en toda la UI.
const MODOS_ALIAS = {
    RG: 'Roland Garros',
    USOPEN: 'US Open'
};

// NUEVO: Función helper para obtener el nombre visual seguro
function getModoAlias(modoInterno) {
    // MODIFICADO: Fallback por si se llama antes de cargar o con un modo desconocido
    if (typeof modoInterno === 'undefined' || modoInterno === null) return '';
    return MODOS_ALIAS[modoInterno] || modoInterno;
}


// =====================================================================
// CONFIGURACIÓN DE REDES (Google Sheets & Web Apps)
// =====================================================================

// CONFIGURACIÓN ROLAND GARROS (RG)
const CSV_URL_RG = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_RG = 'https://script.google.com/macros/s/AKfycbxBdhrRWx9GNYU_oub52jQcRrG-XRhcDIjdHHW_CYQlob3PNButhNinqw-JLNES_3Ci-w/exec';

// CONFIGURACIÓN USOPEN
const CSV_URL_USOPEN = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOWewZgqWZEFYiIMh8DTUX5tr6EEXBwvUJGr7hrpkCG91UhE5xU8fDJ12qcRVrT69xfZ5NGGGyhNCE/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_USOPEN = 'https://script.google.com/macros/s/AKfycbzfA3OnavQcmM3IG-7-PeHJw3U44UH5CREnLtwypxDxNQehQ4ZuM6iYqu5lt0VmUnKn/exec';

// MODIFICADO: Función auxiliar pura. Ya no lee window.currentMode. 
// Recibe el modo explícitamente para evitar acoplamiento global.
function getWebAppUrl(modo) {
    if (modo === 'USOPEN') {
        return WEB_APP_URL_USOPEN;
    }
    return WEB_APP_URL_RG;
}

// MODIFICADO: Función auxiliar pura. Ya no lee window.currentMode.
function getCsvUrl(modo) {
    if (modo === 'USOPEN') {
        return CSV_URL_USOPEN;
    }
    return CSV_URL_RG;
}


// =====================================================================
// NUEVO: CONFIGURACIÓN DE INTELIGENCIA ARTIFICIAL (Gemini)
// =====================================================================

// NUEVO: Endpoint centralizado del modelo de IA. 
// Cambiar aquí la versión o el modelo afectará a todas las traducciones automáticas del sistema.
const GEMINI_ENDPOINT_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

// NUEVO: Cantidad de filas que se envían en cada petición a la IA durante la traducción masiva.
// Aumentar mejora velocidad pero consume más cuota. Disminuir reduce consumo pero es más lento.
const TRADUCCION_TAMANO_LOTE = 3;


// =====================================================================
// NUEVO: CONFIGURACIÓN CENTRALIZADA DE ASSETS (Rutas e Imágenes)
// =====================================================================

// Path base general para imágenes y recursos estáticos
const PATH_IMAGENES = 'imagenes/imagenes/';

// MODIFICADO: Path específico para los iconos de alérgenos (corregido para evitar doble carpeta)
const PATH_ALERGENOS = 'imagenes/alergenos/';

// Logos Principales (Header del Editor)
const LOGO_RG = PATH_IMAGENES + 'logo RG_REST.png';
const LOGO_USOPEN = PATH_IMAGENES + 'USOPEN_REST.png';

// Códigos QR Roland Garros
const QR_RG_DEFAULT = PATH_IMAGENES + 'qr-code-RG-MOD.png'; // Oficial RG
const QR_RG_MOD = PATH_IMAGENES + 'qr-code.png';           // Alternativo RG

// Código QR US Open
const QR_USOPEN_DEFAULT = PATH_IMAGENES + 'qr-usopen_oficial.png'; // Oficial USOPEN
const QR_USOPEN_MOD = PATH_IMAGENES + 'qr-usopen_mod.png';         // Alternativo USOPEN


// =====================================================================
// NUEVO: CONFIGURACIÓN DE TIEMPOS DEL SISTEMA
// =====================================================================

// Ventana de tiempo en milisegundos donde el sistema asume que Google Sheets 
// podría estar desactualizado tras un guardado (Client-Side Optimistic Lock)
const CONSISTENCY_WINDOW_MS = 180000; // 3 minutos (180,000 ms)
```

```javascript
// ui.js (Web_Editor_Pro)
// Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.ui = '1.0.18-CENTRALIZED-LOTE-SIZE'; 

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
        
        // MODIFICADO: Uso de getModoAlias para desacoplar el nombre visual
        const contexto = stateContainer.currentProMode || 'RG';
        btn.innerText = `☁️ Sincronizar con Google Sheet ${getModoAlias(contexto)}`;
    },

    sincronizarConGoogleSheets: async () => {
        if (stateContainer.headers.length === 0 || stateContainer.csvData.length === 0) {
            return UI.log("[Error] No hay datos en memoria para sincronizar. Carga un archivo primero.");
        }

        // NUEVO: Usar currentProMode para determinar destino
        const modo = stateContainer.currentProMode;
        // MODIFICADO: Uso de getModoAlias para los logs visuales
        const contextoNombre = getModoAlias(modo);
        
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
            // MODIFICADO: Uso de inyección de dependencia directa. Ya no se manipula window.currentMode
            const modoSincronizacion = stateContainer.currentProMode || 'RG';
            let urlDestino = window.getWebAppUrl ? window.getWebAppUrl(modoSincronizacion) : '';
            
            // ELIMINADO: Fallback hardcodeado. Si config.js falla, se aborta con un error visible.
            // Esto asegura que config.js sea la ÚNICA fuente de verdad.
            if (!urlDestino) {
                return UI.log(`[Error Crítico] La función getWebAppUrl() de config.js no devolvió una URL para el modo '${modoSincronizacion}'. Sincronización cancelada.`);
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
        
        // MODIFICADO: Uso de getModoAlias en logs
        UI.log(`[Import] Archivo local seleccionado. Destino asignado: ${getModoAlias(modoDefinitivo)}`);
        
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

        // MODIFICADO: Eliminada la variable local ENDPOINT_GATEWAY y TAMANO_LOTE. 
        // Ahora usa las variables globales GEMINI_ENDPOINT_URL y TRADUCCION_TAMANO_LOTE de config.js
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
        
        for (let j = 0; j < matrizFilasPendientes.length; j += TRADUCCION_TAMANO_LOTE) {
            if (procesoDetenido) break;
            while (procesoPausado) { 
                await new Promise(resolve => setTimeout(resolve, 500)); 
            }

            const loteActual = matrizFilasPendientes.slice(j, j + TRADUCCION_TAMANO_LOTE);
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

                    const callResponse = await fetch(`${GEMINI_ENDPOINT_URL}?key=${listaClavesAPI[currentKeyIndex]}`, {
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
```

```markdown
// [🔒 ARCHIVO REESCRITO COMPLETAMENTE - VERSIÓN ACTUALIZADA v4.0 - SISTEMA DE ALIAS Y LOTES IA]
```javascript
Regla de Oro: Antes de renombrar, mover o eliminar una función/variable listada aquí, verifica su sección ⚠️ DEPENDENCIAS CRUZADAS para evitar romper otros módulos o los onclick del HTML.

================================================================================
🌐 Estado Global Compartido (window.*)
================================================================================
El núcleo de la aplicación. Alterar una de estas variables afecta a múltiples archivos simultáneamente.

Variable                     Tipo      Archivo Origen        Escritores                                                                 Lectores
----------------------------------------------------------------------------------------------------------------------------------------------------
window.currentMode           String    index.html            index.html (switchTab), ui.js (confirmarImportacion, loadSheets...)     config.js (indirecto via params), app.js, index.html, ui.js
window.datosLocales          Array     app.js                app.js (cargar)                                                          app.js (múltiples), sugerencias-print.js, index.html
window.hayCambiosSinGuardar  Boolean   app.js                app.js (moverPlato, aplicarCambiosPlato, toggleActivo, cargar...)      index.html (switchTab)
window.optimisticState       Object    app.js                app.js (cargar, enviarAlExcel, cancelarModoOptimista)                   app.js, sugerencias-print.js, index.html
window.optimisticTimers      Object    app.js                app.js (iniciarContadorOptimista, cancelarModoOptimista)               index.html (switchTab, updateDebugPanel)
window.APP_VERSIONS          Object    Varios                app.js, ui.js, sugerencias-print.js                                     index.html (updateDebugPanel)
window.UI.tempImportFile     File      ui.js                 ui.js (listener archivoLocal)                                            ui.js (confirmarImportacion, cancelarImportacion)
window.lastSaveAttempt       Number    No definido en repo   -                                                                          ui.js (cargarGoogleSheets) - ⚠️ POSIBLE LEFTOVER

// --- Funciones inyectadas explícitamente en window ---
window.cancelarModoOptimista Function app.js                app.js (asignación)                                                     index.html (botón inline onclick)
window.renderCarta           Function sugerencias-print.js sugerencias-print.js (asignación)                                      index.html (switchTab)
window.imprimirSugerencias   Function sugerencias-print.js sugerencias-print.js (asignación)                                      sugerencias-print.js (HTML dinámico onclick)
window.toggleQR              Function sugerencias-print.js sugerencias-print.js (asignación)                                      sugerencias-print.js (HTML dinámico onchange)
window.UI                    Object    ui.js                 ui.js (asignación final)                                                app.js, index.html (onclick modales)

// --- Variables de Super-Config (Inyectadas por config.js) ---
CONSISTENCY_WINDOW_MS        Number    config.js             (Estática)                                                                app.js, index.html, sugerencias-print.js
PATH_IMAGENES                String    config.js             (Estática)                                                                sugerencias-print.js
PATH_ALERGENOS               String    config.js             (Estática)                                                                sugerencias-print.js
LOGO_RG                      String    config.js             (Estática)                                                                index.html, sugerencias-print.js
LOGO_USOPEN                  String    config.js             (Estática)                                                                index.html, sugerencias-print.js
QR_RG_DEFAULT                String    config.js             (Estática)                                                                sugerencias-print.js
QR_RG_MOD                    String    config.js             (Estática)                                                                sugerencias-print.js
QR_USOPEN_DEFAULT            String    config.js             (Estática)                                                                sugerencias-print.js
QR_USOPEN_MOD                String    config.js             (Estática)                                                                sugerencias-print.js

// NUEVO: Sistema de Alias de Marca (Inyectado por config.js)
MODOS_ALIAS                  Object    config.js             (Estática - Diccionario)                                               index.html (Pestañas, Botones), app.js (Alertas, Status), ui.js (Logs, Botones), sugerencias-print.js (Impresión)

// --- Variables de Utilidades (Inyectadas por utils.js de forma global implícita) ---
window.desglosarNombre       Function utils.js              (Estática global)                                                        app.js, sugerencias-print.js
window.superLimpiar          Function utils.js              (Estática global)                                                        app.js
window.formatWineName        Function utils.js              (Estática global)                                                        app.js
window.extraerJSON           Function utils.js              (Estática global)                                                        app.js


================================================================================
📁 config.js
================================================================================
No usa módulos. Se ejecuta en el scope global.

NUEVO: Sistema de Alias de Marca
- MODOS_ALIAS (Object): Diccionario que mapea Modo Interno ('RG', 'USOPEN') al Nombre Comercial ('Roland Garros', 'US Open').
  Es usado por: getModoAlias(), index.html (inyección inicial de textos).

- getModoAlias(modoInterno)
  Retorna: String (Nombre visual o modo interno como fallback)
  Lee: MODOS_ALIAS, modoInterno (Parámetro)
  Es usado por: app.js, ui.js, sugerencias-print.js, index.html

Constantes de Red
- CSV_URL_RG, CSV_URL_USOPEN, WEB_APP_URL_RG, WEB_APP_URL_USOPEN
  Es usado por: getWebAppUrl(), getCsvUrl() (ambas internas).

Funciones de Red
- getWebAppUrl(modo)
  Retorna: String (URL del Web App de Google)
  Lee: modo (Parámetro inyectado por app.js/ui.js), WEB_APP_URL_RG, WEB_APP_URL_USOPEN
  Es usado por: app.js (vía getWebAppUrlSafe()), ui.js (en sincronizarConGoogleSheets)

- getCsvUrl(modo)
  Retorna: String (URL del CSV de Google Sheets)
  Lee: modo (Parámetro inyectado por app.js/ui.js), CSV_URL_RG, CSV_URL_USOPEN
  Es usado por: app.js (vía getCsvUrlSafe()), index.html (en switchTab)

NUEVO: Configuración de Inteligencia Artificial (Gemini)
- GEMINI_ENDPOINT_URL (String): URL base del modelo de IA (Gemini 2.5 Flash).
  Es usado por: app.js (generarTraduccionEN, ejecutarTraduccionAutomatica), ui.js (iniciarTraduccionPorLotes)
- TRADUCCION_TAMANO_LOTE (Number): Cantidad de filas que se agrupan en cada petición a la IA en el traductor masivo.
  Es usado por: ui.js (iniciarTraduccionPorLotes)

Constantes de Assets y Sistema
- PATH_IMAGENES, PATH_ALERGENOS, LOGO_RG, LOGO_USOPEN, QR_*, CONSISTENCY_WINDOW_MS
  Es usado por: Varios (ver tabla Estado Global Compartido).


================================================================================
📁 state.js
================================================================================
No usa módulos. Se ejecuta en el scope global.

- getKeys()
  Retorna: Array<String>
  Lee: localStorage
  Es usado por: app.js (generarTraduccionEN, ejecutarTraduccionAutomatica), ui.js (iniciarTraduccionPorLotes)

- saveKey(key)
  Escribe en: localStorage
  Es usado por: app.js (agregarKey), ui.js (listener de addKeyBtn)

- deleteKey(key)
  Escribe en: localStorage
  Es usado por: app.js (eliminarKeySeleccionada), ui.js (listener de btnEliminarKeySeleccionada)


================================================================================
📁 utils.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo de funciones puras (no tocan DOM ni estado).

- desglosarNombre(texto)
  Retorna: { nombre: String, uvas: String }
  Es usado por: app.js (varios lugares de renderizado y guardado), sugerencias-print.js (como principal).

- superLimpiar(texto)
  Retorna: String
  Es usado por: app.js (cargar, aplicarCambiosPlato).

- formatWineName(texto)
  Retorna: String
  Es usado por: app.js (abrirEditor, aplicarCambiosPlato, ejecutarTraduccionAutomatica).

- extraerJSON(texto)
  Retorna: Object (JSON parseado buscando el primer bloque válido)
  Es usado por: app.js (generarTraduccionEN, ejecutarTraduccionAutomatica). 
  NOTA: ui.js no usa esta función, hace un JSON.parse() directo tras limpiar marcadores con regex.


================================================================================
📁 languages.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo.
⚠️ ADVERTENCIA: ESTRUCTURA, categoriesList y subCatsLang se movieron a data.js. NO buscarlas aquí.

- IDIOMAS_CONFIG (Object): Mapeo ISO -> Nombre visible.
- IDIOMAS_ORDEN (Array): Orden de procesamiento.
- IDIOMAS_CSV_INDICES (Object): Mapeo de qué columna del CSV pertenece a qué idioma.

Lectores: app.js (carga, renderizado, traducción), ui.js (carga de columnas, render de radios).


================================================================================
📁 data.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo.

- ESTRUCTURA (Array): Arbol de categorías, subcategorías, IDs y rangos.
- categoriesList, subCatsLang (Object/Array): Diccionarios de traducción de categorías.
- ALERGENOS_LISTA (Array): Lista de alérgenos con emojis.
  Es usado por: app.js (abrirEditor, renderizado de modal).
- CROQUETAS_CONFIG (Object): Configuración de sabores de croquetas.
  Es usado por: app.js (abrirEditor, actualizarNombreCroquetas).

Lectores: app.js (carga, renderizado, traducción), ui.js (carga de columnas, render de radios).


================================================================================
📁 app.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Contiene la lógica principal del Editor.

Variables Locales (Scope de archivo)
- datosLocales (Array): Reflejo local de window.datosLocales.
- platoEditandoId (Number), esNuevoPlato (Boolean), datosTempNuevo (Object): Estado del modal editor.
- opcionesENActuales (Array): Almacena temporalmente las opciones de IA de traducción EN.

Funciones Utilitarias (Compartidas)
Nota: Estas funciones se consumen desde utils.js de forma global.
- desglosarNombre(texto), extraerJSON(texto), superLimpiar(texto), formatWineName(texto)

Funciones de Red y Estado

- getWebAppUrlSafe()
  Retorna: String
  Lee: window.currentMode, window.WEB_APP_URL, window.getWebAppUrl (inyectando modo por parámetro)
  Es usado por: Internamente en app.js (enviarAlExcel, cargar).

- getCsvUrlSafe()
  Retorna: String
  Lee: window.currentMode, window.CSV_URL, window.getCsvUrl (inyectando modo por parámetro)
  Es usado por: Internamente en app.js (cargar).

- cargar(retryCount)
  Lee: getCsvUrlSafe(), window.optimisticState, window.ESTRUCTURA, window.IDIOMAS_ORDEN, window.IDIOMAS_CSV_INDICES, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: window.datosLocales, window.hayCambiosSinGuardar, DOM (#status-carga usando getModoAlias, #editor-dinamico)
  Es usado por: index.html (switchTab), se auto-invoca al final del archivo.

- enviarAlExcel()
  Lee: getWebAppUrlSafe(), window.datosLocales, window.currentMode, window.IDIOMAS_ORDEN
  Escribe en: window.optimisticState, sessionStorage, window.hayCambiosSinGuardar, DOM (#btn-guardar-dinamico), Alert (usando getModoAlias)
  Es usado por: index.html (botón #btn-guardar-dinamico inline onclick), index.html (switchTab)

- iniciarContadorOptimista(modo)
  Lee: window.optimisticTimers, window.currentMode, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: window.optimisticTimers, sessionStorage, DOM (#optimistic-timer, usando getModoAlias para #timer-mode)
  Es usado por: app.js (enviarAlExcel)

- cancelarModoOptimista(modo)
  Escribe en: window.optimisticTimers, window.optimisticState, sessionStorage, DOM (#optimistic-timer)
  Es usado por: index.html (botón inline onclick en el timer)

Funciones de Renderizado y UI

- renderizar()
  Lee: datosLocales, window.ESTRUCTURA
  Escribe en: DOM (#editor-dinamico)

- generarMenuAgrupado()
  Lee: datosLocales, window.ESTRUCTURA
  Escribe en: DOM (#lista-agrupada)

- moverPlato(id, direccion)
  Lee: datosLocales
  Escribe en: datosLocales (IDs), window.hayCambiosSinGuardar
  Es usado por: HTML generado en renderizar() (botones inline onclick)

- abrirEditor(id, esNuevo)
  Lee: window.datosLocales, window.IDIOMAS_ORDEN, window.IDIOMAS_CONFIG, ALERGENOS_LISTA (GLOBAL), CROQUETAS_CONFIG (GLOBAL)
  Escribe en: Variables locales (platoEditandoId, esNuevoPlato), DOM (inputs del modal)
  Es usado por: app.js (prepararNuevoPlato), index.html (botones dinámicos onclick)

- actualizarNombreCroquetas()
  Lee: platoEditandoId, CROQUETAS_CONFIG (GLOBAL), DOM (.croqueta-btn.selected)
  Escribe en: DOM (#edit-es)
  Es usado por: HTML generado en abrirEditor() (botones de croqueta inline onclick)

- comprobarRequisitosTraduccion()
  Lee: DOM (#edit-es, #edit-en)
  Escribe en: DOM (#btn-autotraducir disabled state)
  Es usado por: app.js (abrirEditor, actualizarNombreCroquetas, confirmarTraduccionEN)

- aplicarCambiosPlato()
  Lee: DOM (inputs del modal), window.IDIOMAS_ORDEN, platoEditandoId, esNuevoPlato
  Escribe en: window.datosLocales, window.hayCambiosSinGuardar
  Es usado por: index.html (botón modal onclick)

- toggleActivo(id, v)
  Lee: datosLocales
  Escribe en: datosLocales, window.hayCambiosSinGuardar
  Es usado por: HTML generado en renderizar() (switch inline onchange)

- abrirSelector() / cerrarModal(id)
  Escribe en: DOM (#modal-selector u ID proporcionado)
  Es usado por: index.html (botón flotante onclick, botones de modal)

- prepararNuevoPlato(baseId, folder)
  Lee: window.ESTRUCTURA, datosLocales
  Escribe en: datosTempNuevo
  Es usado por: HTML generado en generarMenuAgrupado() (botones inline onclick)

Funciones de Traducción

- generarTraduccionEN()
  Lee: DOM (#edit-es), getKeys(), GEMINI_ENDPOINT_URL (GLOBAL)
  Escribe en: DOM (#modal-traduccion-en), opcionesENActuales
  Es usado por: index.html (botón onclick)

- abrirModalTraduccionEN(), seleccionarOpcionEN(), confirmarTraduccionEN(), cerrarModalTraduccionEN()
  Gestionan: El flujo interno del modal de selección de traducción EN.
  Es usado por: index.html (botones onclick del modal)

- ejecutarTraduccionAutomatica()
  Lee: DOM, window.IDIOMAS_ORDEN, getKeys(), GEMINI_ENDPOINT_URL (GLOBAL)
  Escribe en: DOM (inputs de idiomas restantes)
  Es usado por: index.html (botón onclick)

Funciones de API Keys (Legacy/Fallback en app.js)

- actualizarListaKeys(), agregarKey(), eliminarKeySeleccionada()
  Nota: Intentan delegar a UI.actualizarListaKeys(). Si UI no existe aún (por ser módulo), actúan como fallback manipulando el DOM directamente.


================================================================================
📁 ui.js (Módulo ES)
================================================================================
Usa type="module". Todo está encapsulado, pero se expone globalmente al final via window.UI = UI;.

Variables Internas
- currentKeyIndex (Number): Para balanceo de carga en traducción masiva.
- procesoDetenido, procesoPausado (Boolean): Control de flujo de iniciarTraduccionPorLotes.
- activeLang (String): Idioma activo en la vista previa de la pestaña Pro.
- stateContainer (Object): ¡CRÍTICO! NO es window.datosLocales. Es una copia exclusiva para la pestaña "Traductor Pro" con sus propias headers y csvData.

- UI.log(mensaje)
  Escribe en: Consola del navegador, DOM (#status-carga), DOM (#consola)
  Es usado por: Casi todas las funciones de ui.js.

- UI.setLoadingState(buttonId, isLoading, text)
  Escribe en: DOM (botón proporcionado)
  Es usado por: Definida, pero sin uso directo en el flujo actual (reservada/futura).

- UI.actualizarListaKeys(selectorElemento)
  Lee: getKeys()
  Escribe en: DOM (#selectKeys o selector proporcionado)
  Es usado por: ui.js (DOMContentLoaded), app.js (fallback)

- UI.renderRadiosIdiomas()
  Lee: window.IDIOMAS_CONFIG, activeLang
  Escribe en: DOM (#radiosIdiomas), activeLang
  Es usado por: ui.js (DOMContentLoaded)

- UI.renderTable()
  Lee: stateContainer, activeLang, window.IDIOMAS_CONFIG
  Escribe en: DOM (#tableHeadRow, #tablaBody)
  Es usado por: ui.js (Interno tras cargar datos o traducir)

- UI.cargarGoogleSheets(targetUrl, retryCount)
  Lee: window.Papa, window.lastSaveAttempt, targetUrl (Parámetro)
  Escribe en: stateContainer, DOM (#consola)
  Es usado por: Listeners internos de loadSheetsBtnRG y loadSheetsBtnUSOpen

- UI.actualizarTextoBotonSync()
  Lee: stateContainer.currentProMode
  Escribe en: DOM (#btnSyncSheets usando getModoAlias)
  Es usado por: ui.js (tras cargar datos o importar)

- UI.sincronizarConGoogleSheets()
  Lee: stateContainer, stateContainer.currentProMode, window.getWebAppUrl (desde config.js, pasando modo por parámetro)
  Escribe en: Red (Fetch POST), DOM (#consola usando getModoAlias)
  Es usado por: Listener interno de btnSyncSheets

- UI.inicializarAjustesExpertos()
  Escribe en: Listeners de DOM para loadSheetsBtnRG, loadSheetsBtnUSOpen, btnIniciar, btnPausa, btnCancelar, saveCsvBtn, btnSyncSheets, archivoLocal.
  Es usado por: ui.js (DOMContentLoaded)

- UI.confirmarImportacion(mode) / UI.cancelarImportacion()
  Lee/Escribe: window.UI.tempImportFile, stateContainer, window.currentMode, DOM (#modal-seleccionar-destino, #archivoLocal). Usa getModoAlias en logs.
  Es usado por: index.html (botones inline onclick en #modal-seleccionar-destino)

- UI.exportarCSV(headers, csvData) / UI.importarCSV(file, callback)
  Lee/Escribe: window.Papa, Blob API, FileReader API.
  Es usado por: Listeners internos de saveCsvBtn y flujo de importación.

- UI.iniciarTraduccionPorLotes(stateContainerParam)
  Lee: getKeys(), stateContainer, DOM (rangos), GEMINI_ENDPOINT_URL (GLOBAL), TRADUCCION_TAMANO_LOTE (GLOBAL)
  Escribe en: stateContainer.csvData, currentKeyIndex, DOM (#consola, #tablaBody)
  Es usado por: Listener interno de btnIniciar


================================================================================
📁 sugerencias-print.js (IIFE Unificada)
================================================================================
IIFE (Invocación Inmediata). Se ejecuta en scope aislado pero inyecta en window. Sustituye a los antiguos archivos separados de RG y USOPEN.

SUGERENCIAS_CONFIG (Variable Interna de Configuración)
- Tipo: Object
- Claves obligatorias: 'RG', 'USOPEN' (Ambas en MAYÚSCULAS estrictas).
- Contiene: versionStr, versionKey, containerId, logoSrc, qrImgId, qrRadioName, qrDefault, qrMod, defaultQrSelection, qrOptions (Array de objetos con value, label, isDefault).
- MODIFICADO: Ahora los valores de logoSrc, qrDefault y qrMod apuntan a variables globales inyectadas por config.js (LOGO_RG, QR_RG_DEFAULT, etc.) en lugar de strings hardcoded.

- window.renderCarta(modo)
  Contrato de modo: String. DEBE ser 'RG' o 'USOPEN' (La función aplica .toUpperCase() por seguridad interna, pero el contrato es mayúsculas).
  Lee: SUGERENCIAS_CONFIG[modo], window.datosLocales, window.optimisticState[modo], window.desglosarNombre (desde utils.js), PATH_ALERGENOS (desde config.js)
  Escribe en: window.APP_VERSIONS, DOM (contenedor configurado en SUGERENCIAS_CONFIG)
  Es usado por: index.html (switchTab -> window.renderCarta('RG') o window.renderCarta('USOPEN'))

- procesarYRender(fuente, contenedor, config, modoSeguro) [Interna]
  Lee: fuente (Array), config, window.desglosarNombre, PATH_ALERGENOS, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: Array fuente (por referencia)
  Es usado por: window.renderCarta (Interna)

- window.imprimirSugerencias(modo)
  Contrato de modo: String. DEBE ser 'RG' o 'USOPEN'.
  Lee: SUGERENCIAS_CONFIG[modo], DOM (contenedor configurado), Estilos inyectados (#sugerencias-print-styles), getModoAlias (para título de ventana)
  Escribe en: Nueva ventana del navegador (Window.open)
  Es usado por: HTML generado dinámicamente (botón imprimir onclick)

- window.toggleQR(tipo, modo)
  Contrato de tipo: String. VALORES ESTRICTOS: 'none', 'default', 'mod'.
  Contrato de modo: String. DEBE ser 'RG' o 'USOPEN' (Obligatoriedad de mayúsculas crítica para resolver SUGERENCIAS_CONFIG).
  Lee: SUGERENCIAS_CONFIG[modo]
  Escribe en: DOM (img #img-qr-rg o #img-qr-usopen -> atributo src y style.display)
  Es usado por: HTML generado dinámicamente (inputs radio inline onchange)

- aplicarParcheOptimista(fuente, modo) [Interna]
  Lee: window.optimisticState, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: Array fuente (por referencia)
  Es usado por: procesarYRender (Interna)


================================================================================
📁 index.html (Scripts Inline)
================================================================================
Contiene la orquestación de pestañas, sistema de arrastre del panel Debug y toggle de visibilidad.
Los src de las imágenes del header apuntan a la ruta centralizada en config.js (inyectada mediante script instantáneo post-carga de config.js).
NUEVO: Los textos estáticos de las pestañas se reescriben dinámicamente usando getModoAlias() en el bloque de inyección post-config.

- actualizarTextoBotonGuardar()
  Lee: window.currentMode, getModoAlias()
  Escribe en: DOM (#btn-guardar-dinamico)
  Es usado por: switchTab, inicialización.

- switchTab(tabId, btnElement)
  Lee: window.hayCambiosSinGuardar, window.cargar, window.renderCarta, window.optimisticTimers, getModoAlias()
  Escribe en: window.currentMode, DOM (tabs, botones flotantes, #optimistic-timer usando getModoAlias), getModoAlias() para el timer
  Es usado por: Botones .tab-btn inline onclick

- updateDebugPanel()
  Lee: window.APP_VERSIONS, window.optimisticState, window.datosLocales, window.currentMode, CONSISTENCY_WINDOW_MS (GLOBAL), getModoAlias()
  Escribe en: DOM (#debug-versions, #debug-state mostrando Alias en cabeceras y modo activo sin paréntesis técnicos)
  Es usado por: setInterval interno (cada 1s)

Listeners de Arrastre (Debug Panel)
- Objetivo: #debug-panel
- Eventos: mousedown, mousemove, mouseup
- Escribe en: Estilos inline de #debug-panel (left, top, cursor)

Listeners de Toggle (Debug Panel)
- Objetivo: #toggle-debug-panel
- Eventos: change
- Escribe en: Estilo display de #debug-panel (none o block)

Bloque de Inyección de Alias (Post-Config)
- Objetivo: #tab-btn-rg, #tab-btn-sug-rg, #tab-btn-usopen, #tab-btn-sug-usopen, #modal-dest-rg, #modal-dest-usopen, #label-web-rg, #label-web-usopen, #loadSheetsBtnRG, #loadSheetsBtnUSOPEN, #btnSyncSheets
- Escribe en: innerText de los botones usando getModoAlias()
- Es usado por: Ejecución inmediata al cargar index.html
```
