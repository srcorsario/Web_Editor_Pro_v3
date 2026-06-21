# INFORME DE IMPACTO
**Archivos Afectados:** 
- `config.js` (Se añade el diccionario de alias y la función helper).
- `app.js` (Se modifican las salidas de texto visual para usar el alias).
- `ui.js` (Se modifican textos de botones y logs para usar el alias).
- `sugerencias-print.js` (Se modifican textos dinámicos del HTML generado para usar el alias).
- `index.html` (Se inyectan IDs en las pestañas y un script que reescribe sus textos usando el alias, y se mejora el panel debug).
- `FUNCTION_MAP.md` (Actualización completa reflejando el nuevo sistema).

**Razón de la modificación:** 
Implementar el sistema de "Alias de Marca" solicitado. A partir de ahora, los identificadores lógicos (`RG`, `USOPEN`) siguen siendo invisibles al usuario y se usan estrictamente para lógica interna (claves de objetos, sessionStorage, IDs del DOM). Cualquier texto que vea el usuario (pestañas, alertas, botones, títulos de impresión) se extrae de `MODOS_ALIAS` en `config.js`. Para cambiar "Roland Garros" por "CARTA 01" o "WB", solo basta con modificar el objeto `MODOS_ALIAS`.

---
El archivo `data.js` no requiere modificaciones.
El archivo `languages.js` no requiere modificaciones.
El archivo `state.js` no requiere modificaciones.
El archivo `styles.css` no requiere modificaciones.
El archivo `utils.js` no requiere modificaciones.

---

```javascript
// --- config.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.config = '1.3.0'; // Incrementado por sistema de Alias de Marca

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

// Códigos QR US Open
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
// --- app.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.app = '1.0.48-ALIAS-SYSTEM'; 

console.group("%c[Editor] Inicializando sistema de control...", "color: orange; font-weight: bold;");

// NUEVO: Flag global para controlar cambios sin guardar
window.hayCambiosSinGuardar = false;

// NUEVO: Estado de consistencia separado por restaurante para evitar cruces
window.optimisticState = {
    RG: { t: 0, s: [] },
    USOPEN: { t: 0, s: [] }
};
window.optimisticTimers = { RG: null, USOPEN: null };

// NUEVO: Recuperar estado de consistencia desde sessionStorage para sobrevivir a recargas (F5)
try {
    const stateRG = JSON.parse(sessionStorage.getItem('optState_RG') || 'null');
    const stateUSOPEN = JSON.parse(sessionStorage.getItem('optState_USOPEN') || 'null');
    if (stateRG) window.optimisticState.RG = stateRG;
    if (stateUSOPEN) window.optimisticState.USOPEN = stateUSOPEN;
} catch (e) {
    console.warn("[Editor] Error recuperando estados de sessionStorage:", e);
}

let datosLocales = [];
let platoEditandoId = null;
let esNuevoPlato = false; 
let datosTempNuevo = null; 
let opcionesENActuales = [];

// MODIFICADO: Eliminadas las constantes ALERGENOS_LISTA y CROQUETAS_CONFIG.
// Ahora se consumen directamente desde data.js como variables globales.

// MODIFICADO: Safe wrappers ahora inyectan el modo actual explícitamente a config.js
function getWebAppUrlSafe() {
    const modoActual = window.currentMode || 'RG';
    if (typeof window.WEB_APP_URL !== 'undefined') return window.WEB_APP_URL;
    if (typeof window.getWebAppUrl === 'function') return window.getWebAppUrl(modoActual);
    return '';
}

function getCsvUrlSafe() {
    const modoActual = window.currentMode || 'RG';
    if (typeof window.CSV_URL !== 'undefined') return window.CSV_URL;
    if (typeof window.getCsvUrl === 'function') return window.getCsvUrl(modoActual);
    return '';
}

async function cargar(retryCount = 0) {
    // MODIFICADO: Usar variable global CONSISTENCY_WINDOW_MS inyectada desde config.js
    const modo = window.currentMode || 'RG';
    const state = window.optimisticState[modo];
    
    const timeSinceSave = Date.now() - state.t;
    const isConsistencyZone = timeSinceSave < CONSISTENCY_WINDOW_MS;

    console.log(`[Editor] Cargando datos para ${modo}... (Zona de peligro: ${isConsistencyZone}, Snapshot: ${state.s.length} items)`);
    try {
        const url = getCsvUrlSafe();
        if (!url) return;
        
        console.log("[Editor] URL Objetivo: " + url.substring(0, 50) + "...");
        
        if (typeof UI !== 'undefined' && typeof UI.log === 'function') {
            UI.log(`[Editor] Conectando con Google Sheets remoto (${getModoAlias(modo)})...`);
        }
        
        // Parámetro 'zx' y cabeceras forzadas
        const resp = await fetch(url + '&zx=' + Date.now(), { 
            cache: "no-store",
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } 
        });
        const text = await resp.text();
        
        const filas = text.split(/\r?\n/).filter(f => f.trim() !== "");
        datosLocales = [];
        
        filas.forEach((f, i) => {
            if (i === 0) return; 
            const c = f.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const id = parseInt(c[0]);
            
            if (!isNaN(id)) {
                let item = {
                    id: id,
                    precio: c[1] || "0.00", 
                    activa: (c[2] || "").trim().toUpperCase() === "SI",
                    carpeta: c[4] || "",
                    imagen: c[5] || "",
                    alergenos: superLimpiar(c[6])
                };
                
                if (window.IDIOMAS_ORDEN && window.IDIOMAS_CSV_INDICES) {
                    window.IDIOMAS_ORDEN.forEach(lang => {
                        const index = window.IDIOMAS_CSV_INDICES[lang];
                        if (index !== undefined && c[index] !== undefined) {
                            item[lang] = superLimpiar(c[index]);
                        }
                    });
                }
                datosLocales.push(item);
            }
        });
        
        // NUEVO: Lógica "Client-Side Optimistic Lock" definitiva segregada por modo.
        if (isConsistencyZone && state.s && state.s.length > 0) {
            let parchesAplicados = 0;
            state.s.forEach(savedItem => {
                const loadedItem = datosLocales.find(i => i.id === savedItem.id);
                if (loadedItem) {
                    const esIgual = JSON.stringify(loadedItem) === JSON.stringify(savedItem);
                    if (!esIgual) {
                        console.warn(`[Editor] ⚠️ Inconsistencia detectada en ${modo} - ID ${savedItem.id}. Aplicando parche.`);
                        parchesAplicados++;
                        Object.keys(savedItem).forEach(k => loadedItem[k] = savedItem[k]);
                    }
                }
            });

            if (parchesAplicados > 0) {
                if (typeof UI !== 'undefined' && typeof UI.log === 'function') {
                    UI.log(`[Alerta] CDN ${getModoAlias(modo)} desactualizado. Asegurando ${parchesAplicados} ediciones locales.`);
                }
            }
        }

        console.log(`[Editor] ${datosLocales.length} platos cargados (${modo}).`);
        
        // Exponer a window para otros scripts
        window.datosLocales = datosLocales;

        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) {
            // MODIFICADO: Uso de getModoAlias para el texto visual
            statusCarga.innerText = `✅ Datos Sincronizados ${getModoAlias(modo)} (${window.IDIOMAS_ORDEN ? window.IDIOMAS_ORDEN.length : 0} Idiomas)`;
            statusCarga.className = "status-ok";
        }
        
        // NUEVO: Al cargar nuevos datos desde CSV, los cambios pendientes locales se descartan/resetean
        window.hayCambiosSinGuardar = false;
        
        renderizar();
        generarMenuAgrupado(); 
    } catch (e) { 
        console.error("[Editor] Error cargando:", e);
        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) {
            statusCarga.innerText = "❌ Error al cargar base multidireccional"; 
            statusCarga.className = "status-error";
        }
    }
}

function iniciarContadorOptimista(modo) {
    // MODIFICADO: Usar variable global CONSISTENCY_WINDOW_MS inyectada desde config.js
    const timerDiv = document.getElementById('optimistic-timer');
    const timerSeconds = document.getElementById('timer-seconds');
    const timerMode = document.getElementById('timer-mode');
    
    if (window.optimisticTimers[modo]) {
        clearInterval(window.optimisticTimers[modo]);
    }
    
    const endTime = Date.now() + CONSISTENCY_WINDOW_MS;
    
    window.optimisticTimers[modo] = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        
        if (window.currentMode === modo) {
            if (timerDiv) timerDiv.style.display = 'block';
            if (timerSeconds) timerSeconds.innerText = remaining;
            // MODIFICADO: Mostrar alias en el contador visual
            if (timerMode) timerMode.innerText = getModoAlias(modo);
        }
        
        if (remaining <= 0) {
            clearInterval(window.optimisticTimers[modo]);
            window.optimisticTimers[modo] = null;
            window.optimisticState[modo] = { t: 0, s: [] };
            sessionStorage.removeItem('optState_' + modo);
            console.log(`[Editor] Ventana de consistencia optimista finalizada para ${modo}.`);
            if (window.currentMode === modo && timerDiv) {
                timerDiv.style.display = 'none';
            }
        }
    }, 1000);
}

window.cancelarModoOptimista = function(modo) {
    if (!modo) modo = window.currentMode || 'RG';
    console.log(`[Editor] Cancelando manualmente modo optimista para ${modo}`);
    
    if (window.optimisticTimers[modo]) {
        clearInterval(window.optimisticTimers[modo]);
        window.optimisticTimers[modo] = null;
    }
    
    window.optimisticState[modo] = { t: 0, s: [] };
    sessionStorage.removeItem('optState_' + modo);
    
    const timerDiv = document.getElementById('optimistic-timer');
    if (window.currentMode === modo && timerDiv) {
        timerDiv.style.display = 'none';
    }
};

function renderizar() {
    let h = "";
    datosLocales.sort((a, b) => a.id - b.id);
    
    if (!window.ESTRUCTURA) return;

    ESTRUCTURA.forEach(cat => {
        const platos = datosLocales.filter(p => p.id >= cat.id && p.id <= (cat.id + cat.rango));
        if (platos.length === 0) return;
        
        h += `<div class="categoria-tarjeta"><div class="categoria-titulo">${cat.name}</div>`;
        platos.forEach((p) => {
            // CORREGIDO: Revertido a indicador visual de cámara (emoji). 
            // No se deben cargar las imágenes físicas reales en el proyecto del Editor.
            let htmlImagenPC = p.imagen ? `<span style="margin-right: 5px;">📷</span>` : "";
            let htmlCarpetaPC = p.carpeta ? `<span class="tag-carpeta">${p.carpeta}</span>` : "";
            const nombreLimpio = desglosarNombre(p.es).nombre;
            
            h += `<div class="plato-item">
                <div class="plato-orden-btns">
                    <button class="btn-orden" onclick="moverPlato(${p.id}, 'subir')">▲</button>
                    <button class="btn-orden" onclick="moverPlato(${p.id}, 'bajar')">▼</button>
                </div>
                <div class="plato-info">
                    <span class="plato-nombre">${nombreLimpio}</span>
                    <div style="font-size: 0.7rem; color: #7f8c8d; margin-top: 4px; display: flex; gap: 10px; align-items: center;">${htmlCarpetaPC} ${htmlImagenPC}</div>
                </div>
                <div class="plato-meta-footer">
                    <div><small>ID ${p.id} | ${p.precio}€</small></div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <button class="btn-config" onclick="abrirEditor(${p.id})">⚙️</button>
                        <label class="switch-container">
                            <input type="checkbox" ${p.activa ? 'checked' : ''} onchange="toggleActivo(${p.id}, this.checked)">
                            <span class="slider-switch"></span>
                        </label>
                    </div>
                </div>
            </div>`;
        });
        h += `</div>`;
    });
    
    const editorDinamico = document.getElementById('editor-dinamico');
    if(editorDinamico) editorDinamico.innerHTML = h;
}

function moverPlato(id, direccion) {
    const idx = datosLocales.findIndex(x => x.id === id);
    // CORREGIDO: Error de tipeo anterior (direction -> direccion)
    if (direccion === 'subir' && idx > 0) {
        const temp = datosLocales[idx].id;
        datosLocales[idx].id = datosLocales[idx-1].id;
        datosLocales[idx-1].id = temp;
    } else if (direccion === 'bajar' && idx < datosLocales.length - 1) {
        const temp = datosLocales[idx].id;
        datosLocales[idx].id = datosLocales[idx+1].id;
        datosLocales[idx+1].id = temp;
    }
    window.hayCambiosSinGuardar = true;
    renderizar();
}

function abrirEditor(id, esNuevo = false) {
    let p = esNuevo ? datosTempNuevo : datosLocales.find(x => x.id === id);
    if (!p) return; 
    
    esNuevoPlato = esNuevo;
    platoEditandoId = id;
    const esVino = (id >= 13000);
    const esCroqueta = (id >= 12100 && id <= 12299);
    const esCroquetaVeg = (id >= 12200 && id <= 12299);
    
    const labelUvas = document.getElementById('label-uvas');
    if (labelUvas) labelUvas.innerText = esVino ? "Nombres y Detalles del Plato / Vino (Uvas)" : "Nombres y Detalles del Plato";
    
    const dataEs = desglosarNombre(p['es'] || "");
    const editEs = document.getElementById('edit-es');
    if (editEs) editEs.value = esVino ? formatWineName(dataEs.nombre) : dataEs.nombre;
    
    const inputEsUvas = document.getElementById('edit-es-uvas');
    if (inputEsUvas) {
        inputEsUvas.value = dataEs.uvas;
        inputEsUvas.style.display = esVino ? "block" : "none";
    }

    const dataEn = desglosarNombre(p['en'] || "");
    const editEn = document.getElementById('edit-en');
    if (editEn) editEn.value = esVino ? formatWineName(dataEn.nombre) : dataEn.nombre;
    
    const inputEnUvas = document.getElementById('edit-en-uvas');
    if (inputEnUvas) {
        inputEnUvas.value = dataEn.uvas;
        inputEnUvas.style.display = esVino ? "block" : "none";
    }
    
    const containerResto = document.getElementById('contenedor-resto-idiomas');
    if (containerResto && window.IDIOMAS_ORDEN) {
        let htmlRestoLangs = `<div class="langs-fluid-container">`;
        IDIOMAS_ORDEN.forEach(l => {
            if (l === 'es' || l === 'en') return;
            const dataLang = desglosarNombre(p[l] || "");
            const labelIdioma = window.IDIOMAS_CONFIG ? (window.IDIOMAS_CONFIG[l.toUpperCase()] || l.toUpperCase()) : l.toUpperCase();
            
            htmlRestoLangs += `
                <div class="input-row-lang">
                    <div class="lang-tag">${l.toUpperCase()}</div>
                    <div style="flex:1">
                        <input id="edit-${l}" class="input-estandar input-nombre-corto" placeholder="Nombre en ${labelIdioma}" value="${esVino ? formatWineName(dataLang.nombre) : dataLang.nombre}">
                        <input id="edit-${l}-uvas" class="input-estandar input-uvas" placeholder="Detalles / Grapes (${labelIdioma})" value="${dataLang.uvas}" style="display: ${esVino ? 'block' : 'none'};">
                    </div>
                </div>`;
        });
        htmlRestoLangs += `</div>`;
        containerResto.innerHTML = htmlRestoLangs;
    }
    
    const editPrecio = document.getElementById('edit-precio');
    if (editPrecio) editPrecio.value = p.precio;
    
    const editImagen = document.getElementById('edit-imagen');
    if (editImagen) editImagen.value = p.imagen;
    
    const alergenosGrid = document.getElementById('alergenos-grid');
    if (alergenosGrid) {
        const actuales = (p.alergenos || "").split(',').map(s => s.trim().toUpperCase());
        let alergenosHtml = "";
        if (esVino) {
            const sel = actuales.includes("🧪 SULFITOS") || actuales.includes("SULFITOS") ? 'selected' : '';
            alergenosHtml = `<div class="alergeno-btn ${sel}" onclick="this.classList.toggle('selected')">🧪 SULFITOS</div>`;
        } else {
            alergenosHtml = ALERGENOS_LISTA.map(a => {
                const sel = actuales.some(act => act.includes(a.split(" ").pop())) ? 'selected' : '';
                return `<div class="alergeno-btn ${sel}" onclick="this.classList.toggle('selected')">${a}</div>`;
            }).join('');
        }
        alergenosGrid.innerHTML = alergenosHtml;
    }
    
    const containerCroquetas = document.getElementById('contenedor-croquetas');
    if (containerCroquetas) {
        let croquetasHtml = "";
        if (esCroqueta) {
            croquetasHtml += `<div class="input-group"><label class="label-seccion">Sabores de Croquetas</label><div class="croquetas-grid">`;
            
            if (!esCroquetaVeg) {
                croquetasHtml += `<div class="croqueta-category"><div class="croqueta-cat-title carne">Carne</div><div class="croqueta-cat-btns">`;
                CROQUETAS_CONFIG.carne.forEach(c => {
                    croquetasHtml += `<div class="croqueta-btn carne" onclick="this.classList.toggle('selected'); actualizarNombreCroquetas()">${c}</div>`;
                });
                croquetasHtml += `</div></div>`;

                croquetasHtml += `<div class="croqueta-category"><div class="croqueta-cat-title pescado">Pescado</div><div class="croqueta-cat-btns">`;
                CROQUETAS_CONFIG.pescado.forEach(c => {
                    croquetasHtml += `<div class="croqueta-btn pescado" onclick="this.classList.toggle('selected'); actualizarNombreCroquetas()">${c}</div>`;
                });
                croquetasHtml += `</div></div>`;
            }

            croquetasHtml += `<div class="croqueta-category"><div class="croqueta-cat-title vegetariana">Vegetarianas</div><div class="croqueta-cat-btns">`;
            CROQUETAS_CONFIG.vegetariana.forEach(c => {
                croquetasHtml += `<div class="croqueta-btn vegetariana" onclick="this.classList.toggle('selected'); actualizarNombreCroquetas()">${c}</div>`;
            });
            croquetasHtml += `</div></div>`;

            croquetasHtml += `</div></div>`;
        }
        containerCroquetas.innerHTML = croquetasHtml;
        
        if (esCroqueta && p['es']) {
            const todosSabores = [...CROQUETAS_CONFIG.carne, ...CROQUETAS_CONFIG.pescado, ...CROQUETAS_CONFIG.vegetariana];
            todosSabores.forEach(sabor => {
                if (p['es'].includes(sabor)) {
                    const btns = document.querySelectorAll('.croqueta-btn');
                    btns.forEach(btn => {
                        if (btn.innerText.trim() === sabor) btn.classList.add('selected');
                    });
                }
            });
        }
    }
    
    comprobarRequisitosTraduccion();
    const modalEditor = document.getElementById('modal-editor');
    if (modalEditor) modalEditor.style.display = 'block';
}

function actualizarNombreCroquetas() {
    const esCroquetaVeg = (platoEditandoId >= 12200 && platoEditandoId <= 12299);

    const seleccionadas = Array.from(document.querySelectorAll('.croqueta-btn.selected')).map(el => el.innerText.trim());
    
    if (seleccionadas.length === 0) {
        const editEs = document.getElementById('edit-es');
        if (editEs) editEs.value = "";
        comprobarRequisitosTraduccion();
        return;
    }

    const soloVegetarianas = seleccionadas.every(s => CROQUETAS_CONFIG.vegetariana.includes(s));
    const cantidad = (soloVegetarianas || esCroquetaVeg) ? 6 : 2;

    const textoCroquetas = seleccionadas.map(s => `${cantidad} ${s}`).join(' - ');
    
    let titulo = esCroquetaVeg ? "Croquetas Vegetarianas:" : "Surtido de Croquetas:";
    if (!esCroquetaVeg && soloVegetarianas) titulo = "Croquetas Vegetarianas:";

    const editEs = document.getElementById('edit-es');
    if (editEs) editEs.value = `${titulo} ${textoCroquetas}`;
    comprobarRequisitosTraduccion();
}

function comprobarRequisitosTraduccion() {
    const editEs = document.getElementById('edit-es');
    const editEn = document.getElementById('edit-en');
    const btnAuto = document.getElementById('btn-autotraducir');
    
    const esValido = editEs && editEn && editEs.value.trim() !== "" && editEn.value.trim() !== "";
    if (btnAuto) btnAuto.disabled = !esValido;
}

async function generarTraduccionEN() {
    const nombreEs = document.getElementById('edit-es').value.trim();
    const esVino = (platoEditandoId >= 13000);

    const uvasEs = esVino ? document.getElementById('edit-es-uvas').value.trim() : "";
    
    if (!nombreEs) {
        alert("❌ Debes introducir primero el nombre en Español.");
        return;
    }

    let keys = [];
    if (typeof getKeys === 'function') {
        keys = getKeys();
    } else if (window.UI && typeof window.UI.getKeysList === 'function') {
        keys = window.UI.getKeysList();
    }

    if (keys.length === 0) {
        alert("❌ No hay API Keys de Gemini configuradas.");
        return;
    }

    const btn = document.getElementById('btn-generar-en');
    const originalText = btn.innerText;

    btn.innerText = "🇬🇧 Generando opciones...";
    btn.disabled = true;

    const textoCompletoEs = (nombreEs + (uvasEs ? ' // ' + uvasEs : '')).replace(/"/g, "'");

    const URL_MODELO = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";
    const instruccion = `Actúa como un translator profesional de menús de restaurantes. Te paso un elemento en español: "${textoCompletoEs}".
    ${esVino ? 'Es un vino. El separador "//" distingue el nombre del vino de la variedad de uva o detalles. Debes traducir ambas partes y mantener el separador "//" en el resultado. El nombre del vino debe ir en MAYÚSCULAS, pero el contenido entre paréntesis (como la D.O.) debe mantener su formato original (ej: EL COTO (D.O. Rioja)).' : ''}
    Necesito que me des EXACTAMENTE 3 opciones de traducción al inglés con diferentes enfoques para un menú:
    1. Traducción directa/literal.
    2. Traducción gastronómica/descriptiva (más elegante).
    3. Traducción corta/concisa (estilo menú rápido).
    
    Responde EXCLUSIVAMENTE con un objeto JSON válido. No incluyas texto fuera del JSON. Las comillas dobles dentro de las traducciones deben estar escapadas con barra invertida (\").
    Estructura exacta: {"directa": "...", "gastronomica": "...", "corta": "..."}`;

    let exito = false;
    let intentos = 0;
    let opciones = {};
    let ultimoError = "";

    while (!exito && intentos < keys.length) {
        try {
            const apiKey = keys[intentos];
            const response = await fetch(`${URL_MODELO}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }] })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                ultimoError = data.error?.message || "Error HTTP " + response.status;
                console.warn(`Error con Key ${intentos + 1}, rotando...`, ultimoError);
                if (data.error?.code === 429 || response.status === 429) {
                    await new Promise(r => setTimeout(r, 3000));
                }
                intentos++;
                continue;
            }

            const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (txt) {
                opciones = extraerJSON(txt);
                if (opciones.directa || opciones.gastronomica || opciones.corta) {
                    exito = true;
                } else {
                    throw new Error("El JSON no contiene las claves esperadas.");
                }
            } else {
                throw new Error("Respuesta vacía de Gemini.");
            }
        } catch (err) {
            ultimoError = err.message;
            console.error(`Error procesando Key ${intentos + 1}:`, err);
            intentos++;
        }
    }

    if (exito) {
        abrirModalTraduccionEN(opciones);
    } else {
        alert("❌ Error al generar las opciones en Inglés.\nDetalles: " + ultimoError);
    }

    btn.innerText = originalText;
    btn.disabled = false;
}

function abrirModalTraduccionEN(opciones) {
    const container = document.getElementById('opciones-en-container');
    const textarea = document.getElementById('editar-opcion-en');
    if (!container || !textarea) return;

    textarea.value = "";
    opcionesENActuales = [];

    let html = "";
    const mapaOpciones = {
        directa: "Directa / Literal",
        gastronomica: "Gastronómica / Elegante",
        corta: "Corta / Menú"
    };

    let index = 0;
    for (const [key, value] of Object.entries(opciones)) {
        if (value) {
            const label = mapaOpciones[key] || key;
            opcionesENActuales.push(value);
            html += `<div class="opcion-en-btn" onclick="seleccionarOpcionEN(this, ${index})">
                <span class="opcion-en-label">${label}</span>
                ${value}
            </div>`;
            index++;
        }
    }

    container.innerHTML = html;
    document.getElementById('modal-traduccion-en').style.display = 'flex';
}

function seleccionarOpcionEN(elemento, index) {
    document.querySelectorAll('.opcion-en-btn').forEach(el => el.classList.remove('selected'));
    elemento.classList.add('selected');
    document.getElementById('editar-opcion-en').value = opcionesENActuales[index];
}

function confirmarTraduccionEN() {
    const textoFinal = document.getElementById('editar-opcion-en').value.trim();
    if (!textoFinal) {
        alert("❌ Selecciona una opción o escribe la traducción antes de confirmar.");
        return;
    }
    
    const desglosado = desglosarNombre(textoFinal);
    const esVino = (platoEditandoId >= 13000);
    const editEn = document.getElementById('edit-en');
    if (editEn) editEn.value = esVino ? formatWineName(desglosado.nombre) : desglosado.nombre;
    
    const inputEnUvas = document.getElementById('edit-en-uvas');
    if (inputEnUvas && inputEnUvas.style.display !== "none") {
        inputEnUvas.value = desglosado.uvas;
    }
    
    cerrarModalTraduccionEN();
    comprobarRequisitosTraduccion();
}

function cerrarModalTraduccionEN() {
    const modal = document.getElementById('modal-traduccion-en');
    if (modal) modal.style.display = 'none';
}

async function ejecutarTraduccionAutomatica() {
    const btn = document.getElementById('btn-autotraducir');
    if (!btn) return;
    
    const originalText = btn.innerText;
    btn.innerText = "✨ Traduciendo con Gemini 2.5...";
    btn.disabled = true;
    
    const nombreEs = document.getElementById('edit-es').value.trim();
    const nombreEn = document.getElementById('edit-en').value.trim();
    const esVino = (platoEditandoId >= 13000);
    const uvasEs = esVino ? document.getElementById('edit-es-uvas').value.trim() : "";
    const uvasEn = esVino ? document.getElementById('edit-en-uvas').value.trim() : "";
    
    let keys = [];
    if (typeof getKeys === 'function') {
        keys = getKeys();
    } else if (window.UI && typeof window.UI.getKeysList === 'function') {
        keys = window.UI.getKeysList();
    }
    
    if (keys.length === 0) {
        alert("❌ No hay API Keys de Gemini configuradas.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }
    
    const textoCompletoEs = (nombreEs + (uvasEs ? ' // ' + uvasEs : '')).replace(/"/g, "'");
    const textoCompletoEn = (nombreEn + (uvasEn ? ' // ' + uvasEn : '')).replace(/"/g, "'");
    
    const idiomasObjetivo = window.IDIOMAS_ORDEN ? window.IDIOMAS_ORDEN.filter(l => l !== 'es' && l !== 'en') : [];
    const URL_MODELO = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";
    
    const instruccion = `Actúa como un traductor experto de menús de restaurantes. Traduce el siguiente elemento basándote en su texto en Español: "${textoCompletoEs}" ${textoCompletoEn ? `y su texto en Inglés (como referencia): "${textoCompletoEn}"` : ''}.
    ${esVino ? 'Es un vino. El separador "//" distingue el nombre del vino de la variedad de uva o detalles. Debes traducir ambas partes y mantener el separador "//" en el resultado para todos los idiomas. El nombre del vino debe ir en MAYÚSCULAS, pero el contenido entre paréntesis (como la D.O.) debe mantener su formato original en todos los idiomas (ej: EL COTO (D.O. Rioja)).' : ''}
    
    Traduce a los siguientes idiomas (usa los códigos ISO proporcionados): ${idiomasObjetivo.join(', ')}.
    
    Responde EXCLUSIVAMENTE con un objeto JSON válido. No incluyas texto fuera del JSON. Las comillas dobles dentro de las traducciones deben estar escapadas con barra invertida (\").
    Usa los códigos ISO como claves.
    Ejemplo de formato de respuesta esperado: {"de": "Nombre // Uva", "fr": "Nombre // Uva"}`;
    
    let exito = false;
    let intentos = 0;
    let ultimoError = "";
    
    while (!exito && intentos < keys.length) {
        try {
            const apiKey = keys[intentos];
            const response = await fetch(`${URL_MODELO}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }] })
            });
            
            const data = await response.json();
            
            if (!response.ok || data.error) {
                ultimoError = data.error?.message || "Error HTTP " + response.status;
                console.warn(`Error con Key ${intentos + 1}, rotando...`, ultimoError);
                if (data.error?.code === 429 || response.status === 429) {
                    await new Promise(r => setTimeout(r, 3000));
                }
                intentos++;
                continue; 
            }
            
            const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (txt) {
                const traducciones = extraerJSON(txt);
                
                idiomasObjetivo.forEach(l => {
                    if (traducciones[l]) {
                        const desglosado = desglosarNombre(traducciones[l]);
                        const finalName = esVino ? formatWineName(desglosado.nombre) : desglosado.nombre;
                        const inputField = document.getElementById(`edit-${l}`);
                        if (inputField) inputField.value = finalName;
                        
                        const inputUva = document.getElementById(`edit-${l}-uvas`);
                        if (inputUva && inputUva.style.display !== "none") {
                            inputUva.value = desglosado.uvas;
                        }
                    }
                });
                
                exito = true;
            } else {
                throw new Error("La respuesta de Gemini no contiene texto válido.");
            }
        } catch (err) {
            ultimoError = err.message;
            console.error(`Error procesando Key ${intentos + 1}:`, err);
            intentos++;
        }
    }
    
    if (!exito) {
        alert("❌ Error al traducir con Gemini.\nDetalles del error: " + ultimoError);
    }
    
    btn.innerText = originalText;
    btn.disabled = false;
}

function aplicarCambiosPlato() {
    let p = esNuevoPlato ? datosTempNuevo : datosLocales.find(x => x.id === platoEditandoId);
    if (!p) return;
    
    if (esNuevoPlato) {
        datosLocales.push(p);
    }
    
    const esVino = (platoEditandoId >= 13000);

    if (window.IDIOMAS_ORDEN) {
        IDIOMAS_ORDEN.forEach(l => {
            let nom = superLimpiar(document.getElementById(`edit-${l}`)?.value || "");
            const inputUva = document.getElementById(`edit-${l}-uvas`);
            const uvas = (inputUva && inputUva.style.display !== "none") ? superLimpiar(inputUva.value) : "";
            
            if (esVino) nom = formatWineName(nom);
            
            p[l] = uvas ? `${nom} // ${uvas}` : nom;
        });
    }
    
    let preVal = document.getElementById('edit-precio').value || "0.00";
    p.precio = parseFloat(preVal).toFixed(2);
    if(isNaN(p.precio)) p.precio = "0.00";
    
    p.imagen = superLimpiar(document.getElementById('edit-imagen').value);
    
    const selectedAlergenos = document.querySelectorAll('.alergeno-btn.selected');
    p.alergenos = Array.from(selectedAlergenos).map(el => {
        let rawText = el.innerText.trim();
        let spaceIdx = rawText.indexOf(' ');
        return spaceIdx !== -1 ? rawText.substring(spaceIdx + 1).trim() : rawText;
    }).join(', ');
    
    window.hayCambiosSinGuardar = true;
    
    cerrarModal('modal-editor');
    renderizar();
}

function generarMenuAgrupado() {
    if (!window.ESTRUCTURA) return;
    
    let h = "";
    ESTRUCTURA.forEach(cat => {
        h += `<div style="margin-bottom:10px;"><div style="background:#eee;padding:5px;font-size:0.7rem;font-weight:bold;text-transform:uppercase;">${cat.name}</div>`;
        if (cat.sub) {
            cat.sub.forEach(s => {
                h += `<button onclick="prepararNuevoPlato(${s.id}, '${s.folder}')" style="width:100%;text-align:left;padding:10px;background:white;border:1px solid #ddd;font-family:'Montserrat';cursor:pointer;">+ ${s.name}</button>`;
            });
        } else {
            h += `<button onclick="prepararNuevoPlato(${cat.id}, '${cat.folder || ''}')" style="width:100%;text-align:left;padding:10px;background:white;border:1px solid #ddd;font-family:'Montserrat';cursor:pointer;">+ ${cat.name}</button>`;
        }
        h += `</div>`;
    });
    const listaAgrupada = document.getElementById('lista-agrupada');
    if (listaAgrupada) listaAgrupada.innerHTML = h;
}

function prepararNuevoPlato(baseId, folder) {
    if (!window.ESTRUCTURA) return;

    let maxPermitido = baseId + 99;
    ESTRUCTURA.forEach(cat => {
        if (cat.sub) {
            const sub = cat.sub.find(s => s.id === baseId);
            if (sub && sub.max) maxPermitido = sub.max;
        }
    });

    const similares = datosLocales.filter(p => p.id >= baseId && p.id <= maxPermitido);
    const nuevoId = similares.length > 0 ? Math.max(...similares.map(p => p.id)) + 1 : baseId;
    
    if (nuevoId > maxPermitido) {
        alert("Límite de IDs alcanzado para esta subcategoría específica.");
        return;
    }

    datosTempNuevo = { 
        id: nuevoId, 
        precio: "0.00", 
        activa: true, 
        carpeta: folder, 
        imagen: "", 
        alergenos: "" 
    };
    
    if (baseId >= 12200 && baseId <= 12299) {
        datosTempNuevo.imagen = "croquetasvegetarianas01.webp";
    } else if (baseId >= 12100 && baseId <= 12199) {
        datosTempNuevo.imagen = "croquetas01.webp";
    }
    
    if (window.IDIOMAS_ORDEN) {
        IDIOMAS_ORDEN.forEach(l => { datosTempNuevo[l] = ""; });
    }
    datosTempNuevo['es'] = "NUEVO ELEMENTO";

    cerrarModal('modal-selector');
    abrirEditor(nuevoId, true);
}

async function enviarAlExcel() {
    const btn = document.querySelector('.btn-guardar-main');
    if (!btn) return;
    
    const textoOriginal = btn.innerText;
    btn.innerText = "⏳ ENVIANDO..."; 
    btn.disabled = true;
    
    const modo = window.currentMode || 'RG';
    console.log(`[Editor] Guardando cambios para ${modo}...`);
    
    datosLocales.sort((a, b) => a.id - b.id);
    
    window.optimisticState[modo].t = Date.now();
    window.optimisticState[modo].s = JSON.parse(JSON.stringify(datosLocales));
    
    sessionStorage.setItem('optState_' + modo, JSON.stringify(window.optimisticState[modo]));
    
    const payload = datosLocales.map(p => {
        let obj = {
            id: p.id, 
            precio: p.precio, 
            estado: p.activa ? 'si' : 'no', 
            carpeta: p.carpeta, 
            imagen: p.imagen, 
            alergenos: p.alergenos
        };
        if (window.IDIOMAS_ORDEN) {
            IDIOMAS_ORDEN.forEach(l => {
                obj[`nombre_${l}`] = p[l] || "";
            });
        }
        return obj;
    });
    
    try {
        const urlDestino = getWebAppUrlSafe();
        
        console.log(`[Editor] Enviando a URL: ${urlDestino}`);
        
        const response = await fetch(urlDestino, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) 
        });
        
        if (response.type === 'opaque') {
            console.warn("[Editor] Modo 'no-cors' activo: No se puede confirmar la respuesta del servidor.");
        }
        
        // MODIFICADO: Uso de getModoAlias para el texto visual del alert
        alert(`✅ Petición enviada para ${getModoAlias(modo)}. Memoria local bloqueada por 3 min.`);
        
        window.hayCambiosSinGuardar = false;
        btn.innerText = textoOriginal;
        btn.disabled = false;
        
        iniciarContadorOptimista(modo);
        
    } catch (e) { 
        alert("Error al intentar impactar los datos.");
        console.error("[Editor] Error de red: ", e);
        btn.disabled = false; 
        btn.innerText = textoOriginal; 
    }
}

function toggleActivo(id, v) { 
    const p = datosLocales.find(x => x.id === id);
    if(p) {
        p.activa = v; 
        window.hayCambiosSinGuardar = true; 
    }
}

function abrirSelector() { 
    const modal = document.getElementById('modal-selector');
    if (modal) modal.style.display = 'block';
}

function cerrarModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none'; 
}

// --- SISTEMA DE GESTIÓN DE API KEYS EN LOCAL ---
function actualizarListaKeys() {
    if (typeof UI !== 'undefined' && typeof UI.actualizarListaKeys === 'function') {
        UI.actualizarListaKeys();
        return;
    }

    const select = document.getElementById('selectKeys');
    const keys = getKeys();
    
    if (!select) return;
    
    if (keys.length === 0) {
        select.innerHTML = '<option value="">No hay API Keys</option>';
        select.disabled = true;
        return;
    }
    
    select.disabled = false;
    select.innerHTML = keys.map((k, i) => {
        const resumida = `${k.substring(0, 6)}...${k.substring(k.length - 4)}`;
        return `<option value="${k}">Key ${i + 1}: ${resumida}</option>`;
    }).join('');
}

function agregarKey() {
    const input = document.getElementById('nuevaKey');
    if (input && input.value.trim()) {
        saveKey(input.value.trim());
        input.value = "";
        
        if (typeof UI !== 'undefined' && typeof UI.log === 'function') {
            UI.log('[Editor] Nueva API Key agregada con éxito.');
        }
        actualizarListaKeys();
    }
}

function eliminarKeySeleccionada() {
    const select = document.getElementById('selectKeys');
    if (select && select.value) {
        deleteKey(select.value);
        
        if (typeof UI !== 'undefined' && typeof UI.log === 'function') {
            UI.log('[Editor] API Key removida del almacenamiento local.');
        }
        actualizarListaKeys();
    } else {
        alert("No hay ninguna Key seleccionada para eliminar.");
    }
}

cargar();
actualizarListaKeys();

const editPrecioInput = document.getElementById('edit-precio');
if (editPrecioInput) {
    editPrecioInput.addEventListener('input', function() {
        if (this.value.includes('.')) {
            let parts = this.value.split('.');
            if (parts[1] && parts[1].length > 2) {
                parts[1] = parts[1].substring(0, 2);
                this.value = parts.join('.');
            }
        }
    });
}

console.groupEnd();
```

```javascript
// ui.js (Web_Editor_Pro)
// Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.ui = '1.0.15-ALIAS-SYSTEM'; 

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
            
            // Fallback hardcodeado por seguridad extrema si config.js falla
            if (!urlDestino) {
                if (modoSincronizacion === 'USOPEN') {
                    urlDestino = 'https://script.google.com/macros/s/AKfycbzfA3OnavQcmM3IG-7-PeHJw3U44UH5CREnLtwypxDxNQehQ4ZuM6iYqu5lt0VmUnKn/exec';
                } else {
                    urlDestino = 'https://script.google.com/macros/s/AKfycbxBdhrRWx9GNYU_oub52jQcRrG-XRhcDIjdHHW_CYQlob3PNButhNinqw-JLNES_3Ci-w/exec';
                }
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
```

```javascript
(function () {
    'use strict';

    // Mapa de configuración unificado
    // MODIFICADO: Ahora consume las variables globales inyectadas por config.js
    const SUGERENCIAS_CONFIG = {
        RG: {
            versionStr: 'v2.9.5-Alias-System',
            versionKey: 'sugerencias_rg',
            containerId: 'sugerencias-contenido',
            logoSrc: LOGO_RG,
            logoFallback: 'https://z-cdn-media.chatglm.cn/files/fc4b4919-b148-470d-97a2-c740c58d1178.png?auth_key=1881113734-9f1ef8e42c5a4eae8f4f0f9055730ecf-0-f7b585f0f08f5f78de683fb163bec75d',
            qrImgId: 'img-qr-rg',
            qrRadioName: 'qr-mode-rg-footer',
            qrDefault: QR_RG_DEFAULT, 
            qrMod: QR_RG_MOD,           
            defaultQrSelection: 'mod',       
            // 3 Opciones restauradas para RG
            qrOptions: [
                { value: 'none', label: 'Sin QR', isDefault: false },
                { value: 'default', label: 'Oficial', isDefault: false },
                { value: 'mod', label: 'Alternativo', isDefault: true }
            ]
        },
        USOPEN: {
            versionStr: 'v2.9.5-Alias-System',
            versionKey: 'sugerencias_usopen',
            containerId: 'sugerencias-contenido-usopen',
            logoSrc: LOGO_USOPEN,
            logoFallback: 'https://z-cdn-media.chatglm.cn/files/fc4b4919-b148-470d-97a2-c740c58d1178.png?auth_key=1881113734-9f1ef8e42c5a4eae8f4f0f9055730ecf-0-f7b585f0f08f5f78de683fb163bec75d',
            qrImgId: 'img-qr-usopen',
            qrRadioName: 'qr-mode-usopen-footer',
            qrDefault: QR_USOPEN_DEFAULT, 
            qrMod: QR_USOPEN_MOD,         
            defaultQrSelection: 'default',      
            // 3 Opciones para USOPEN
            qrOptions: [
                { value: 'none', label: 'Sin QR', isDefault: false },
                { value: 'default', label: 'Oficial', isDefault: true },
                { value: 'mod', label: 'Alternativo', isDefault: false }
            ]
        }
    };

    // Inyectar estilos de impresión una sola vez de forma segura
    if (!document.getElementById('sugerencias-print-styles')) {
        const stylePrint = document.createElement('style');
        stylePrint.id = 'sugerencias-print-styles';
        stylePrint.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
            @page { size: A4; margin: 10mm; }
            .sugerencias-panel { 
                background: #ffffff !important; padding: 15px 25px !important; width: 190mm !important; 
                min-height: 277mm !important; margin: 0 auto !important; font-family: 'Montserrat', sans-serif !important;
                box-sizing: border-box !important; display: flex !important; flex-direction: column !important;
            }
            .sugerencias-header-layout { display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 15px !important; position: relative !important; }
            .sugerencias-brand-title-group { display: flex !important; flex-direction: column !important; gap: 2px !important; }
            .sugerencias-title-es { font-weight: 700 !important; font-size: 1.3rem !important; color: #e05a2b !important; text-transform: uppercase !important; margin:0 !important; } 
            .sugerencias-title-en { font-weight: 300 !important; font-size: 0.95rem !important; color: #0d5c63 !important; text-transform: uppercase !important; margin:0 !important; } 
            .sugerencias-version-tag { position: absolute !important; top: -15px !important; left: 0 !important; font-size: 0.6rem !important; color: #94a3b8 !important; font-family: monospace !important; }
            .sugerencias-logo-img { width: 110px !important; height: auto !important; object-fit: contain !important; } 
            .sugerencias-body { flex: 1 1 auto !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; }
            .sugerencias-seccion { flex: 1 1 auto !important; display: flex !important; flex-direction: column !important; margin-bottom: 12px !important; }
            .sugerencias-seccion-titulo { font-size: 0.85rem !important; font-weight: 700 !important; color: #d97706 !important; border-bottom: 1px solid #334155 !important; margin-bottom: 8px !important; text-transform: uppercase !important; }
            .sugerencias-plato { display: flex !important; align-items: baseline !important; margin-bottom: 5px !important; width: 100% !important; } 
            .sugerencias-plato-nombres { flex: 0 1 auto !important; max-width: 93% !important; display: flex !important; flex-direction: column !important; }
            .sugerencias-nombre-es { font-size: 0.9rem !important; font-weight: 600 !important; color: #000000 !important; } 
            .sugerencias-nombre-en { font-size: 0.8rem !important; color: #7f8c8d !important; font-style: italic !important; }
            .sugerencias-detalles-uvas-inline { display: inline !important; margin-left: 4px !important; font-size: 0.8rem !important; color: #555 !important; font-style: normal !important; font-weight: 400 !important; }
            .sugerencias-alergenos { display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; margin-top: 2px !important; align-items: center !important; }
            .sugerencias-alergeno-icon { display: inline-block !important; width: 16px !important; height: 16px !important; object-fit: contain !important; vertical-align: middle !important; margin-right: 2px !important; } 
            .sugerencias-puntos { flex: 1 !important; border-bottom: 1px dotted #94a3b8 !important; margin: 0 8px !important; height: 1px !important; }
            .sugerencias-precio { font-size: 0.9rem !important; font-weight: 700 !important; flex-shrink: 0 !important; } 
            .sugerencias-footer { margin-top: auto !important; padding-top: 15px !important; display: flex !important; justify-content: space-between !important; align-items: flex-end !important; width: 100% !important; }
            .sugerencias-advertencia-alergenos { font-size: 0.6rem !important; color: #64748b !important; max-width: 65% !important; line-height: 1.3 !important; text-align: left !important; font-style: italic !important; margin-bottom: 5px !important; }
            .sugerencias-qr-container { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 5px !important; margin-left: auto !important; }
            .sugerencias-qr-img { width: 90px !important; height: 90px !important; object-fit: contain !important; } 
            .sugerencias-qr-toggle { font-size: 0.7rem !important; color: #64748b !important; cursor: pointer !important; display: flex !important; user-select: none !important; gap: 5px !important; }
            .sugerencias-qr-toggle input:checked + span { font-weight: bold; }
            .sugerencias-qr-img { transition: opacity 0.3s; }
            .btn-imprimir-a4 { display: block; width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; margin-bottom: 20px; text-align: center; }
            @media print { body { -webkit-print-color-adjust: exact !important; } .btn-imprimir-a4, .sugerencias-qr-toggle, .qr-selector-wrapper { display: none !important; } }
        `;
        document.head.appendChild(stylePrint);
    }

    // CORRECCIÓN CRÍTICA: Forzar modo a MAYÚSCULAS porque el config usa claves 'RG' y 'USOPEN'
    window.toggleQR = function(tipo, modo) {
        const modoSeguro = modo ? modo.toUpperCase() : 'RG';
        const config = SUGERENCIAS_CONFIG[modoSeguro];
        if (!config) return;

        const img = document.getElementById(config.qrImgId);
        if (!img) return;

        if (tipo === 'none') {
            img.style.display = 'none';
            return;
        }

        img.style.display = 'block';

        if (tipo === 'default') {
            img.src = config.qrDefault;
        } else if (tipo === 'mod') {
            img.src = config.qrMod;
        }
    };

    window.renderCarta = function(modo) {
        const modoSeguro = modo ? modo.toUpperCase() : 'RG';
        const config = SUGERENCIAS_CONFIG[modoSeguro];
        if (!config) return;

        const contenedor = document.getElementById(config.containerId);
        if (!contenedor) return;

        window.APP_VERSIONS = window.APP_VERSIONS || {};
        window.APP_VERSIONS[config.versionKey] = config.versionStr;

        let intentos = 0;
        const MAX_INTENTOS = 10;

        function intentarRenderizado() {
            let fuente = window.datosLocales || [];
            const tieneDatosEnRango = fuente.some(p => p && p.activa && parseInt(p.id, 10) >= 12000 && parseInt(p.id, 10) <= 12999);
            
            if (tieneDatosEnRango) {
                procesarYRender(fuente, contenedor, config, modoSeguro);
            } else if (intentos < MAX_INTENTOS) {
                intentos++;
                console.log(`[Sugerencias ${modoSeguro}] Intento ${intentos}/${MAX_INTENTOS}. Fuente actual: ${fuente.length} items.`);
                setTimeout(intentarRenderizado, 500);
            } else {
                contenedor.innerHTML = `<div class="p-4 text-center text-slate-500 italic">Esperando origen de datos válido de la carta estándar (vuelve a la Pestaña 1 un segundo para activar la memoria)...</div>`;
            }
        }

        intentarRenderizado();
    };

    function aplicarParcheOptimista(fuente, modo) {
        // MODIFICADO: Usar variable global CONSISTENCY_WINDOW_MS inyectada desde config.js
        const state = window.optimisticState ? window.optimisticState[modo] : { t: 0, s: [] };
        const timeSinceSave = Date.now() - state.t;
        
        if (timeSinceSave < CONSISTENCY_WINDOW_MS && state.s && state.s.length > 0) {
            let parchesAplicados = 0;
            fuente.forEach(item => {
                if (!item || !item.id) return;
                const savedItem = state.s.find(s => s.id === item.id);
                if (savedItem) {
                    if (JSON.stringify(item) !== JSON.stringify(savedItem)) {
                        console.warn(`[Sugerencias ${modo}] ⚠️ CDN desactualizado ID ${item.id}. Aplicando parche.`);
                        parchesAplicados++;
                        Object.keys(savedItem).forEach(k => { item[k] = savedItem[k]; });
                    }
                }
            });
            if (parchesAplicados > 0) {
                console.log(`[Sugerencias ${modo}] ✅ Restaurados ${parchesAplicados} elementos.`);
            }
        }
        return fuente;
    }

    function procesarYRender(fuente, contenedor, config, modoSeguro) {
        aplicarParcheOptimista(fuente, modoSeguro);

        const platos = fuente.filter(p => p && p.activa && parseInt(p.id, 10) >= 12000 && parseInt(p.id, 10) <= 12999);
        let entrantes = [], principales = [], postres = [], vinos = [];

        platos.forEach(p => {
            const id = parseInt(p.id, 10);
            if (id === 12990) { vinos.push(p); }
            else if (id >= 12100 && id <= 12399) { entrantes.push(p); }
            else if (id >= 12400 && id <= 12899) { principales.push(p); }
            else if (id >= 12900 && id <= 12999) { postres.push(p); }
            else { entrantes.push(p); }
        });

        // MODIFICADO: Uso de getModoAlias en el botón de imprimir
        let html = `
            <button onclick="window.imprimirSugerencias('${modoSeguro}')" class="btn-imprimir-a4">🖨️ Imprimir Sugerencias ${getModoAlias(modoSeguro)} (A4)</button>
            <div class="sugerencias-header-layout">
                <span class="sugerencias-version-tag" style="display:none;">Módulo ${config.versionStr}</span>
                <div class="sugerencias-brand-title-group">
                    <div class="sugerencias-title-es">SUGERENCIAS DEL CHEF</div>
                    <div class="sugerencias-title-en">CHEF'S SUGGESTIONS</div>
                </div>
                <img src="${config.logoSrc}" class="sugerencias-logo-img" onerror="this.src='${config.logoFallback}';">
            </div>
            <div class="sugerencias-body">
        `;

        const renderCat = (titulo, lista, className) => {
            if (lista.length === 0) return '';
            let h = `<div class="sugerencias-seccion ${className}"><div class="sugerencias-seccion-titulo">${titulo}</div>`;
            lista.forEach(p => {
                let iconsHtml = '';
                if (p.alergenos) {
                    // MODIFICADO: Uso de PATH_ALERGENOS global de config.js
                    iconsHtml = '<div class="sugerencias-alergenos">' + p.alergenos.split(',').map(a => `<img src="${PATH_ALERGENOS}${a.trim()}.webp" class="sugerencias-alergeno-icon" onerror="this.style.display='none'">`).join('') + '</div>';
                }
                const objEs = window.desglosarNombre(p.es);
                const objEn = window.desglosarNombre(p.en);
                const esVino = (p.id === 12990 || p.id >= 13000);
                let htmlNombreEs = "", htmlNombreEn = "";

                if (esVino) {
                    htmlNombreEs = objEs.uvas ? `<span class="sugerencias-nombre-es">${objEs.nombre} <span class="sugerencias-detalles-uvas-inline">(${objEs.uvas})</span></span>` : `<span class="sugerencias-nombre-es">${objEs.nombre}</span>`;
                } else {
                    htmlNombreEs = `<span class="sugerencias-nombre-es">${objEs.nombre}</span>` + (objEs.uvas ? `<span class="sugerencias-detalles-uvas">${objEs.uvas}</span>` : '');
                    htmlNombreEn = `<span class="sugerencias-nombre-en">${objEn.nombre}</span>` + (objEn.uvas ? `<span class="sugerencias-detalles-uvas-en">${objEn.uvas}</span>` : '');
                }
                const precioFormateado = p.precio ? parseFloat(p.precio).toFixed(2) + '€' : '0.00€';
                h += `<div class="sugerencias-plato"><div class="sugerencias-plato-nombres">${htmlNombreEs}${htmlNombreEn}${iconsHtml}</div><div class="sugerencias-puntos"></div><div class="sugerencias-precio">${precioFormateado}</div></div>`;
            });
            return h + '</div>';
        };

        html += renderCat("ENTRANTES / STARTERS", entrantes, "sugerencias-seccion-entrantes");
        html += renderCat("PRINCIPALES / MAIN COURSES", principales, "sugerencias-seccion-principales");
        html += renderCat("POSTRES / DESSERTS", postres, "sugerencias-seccion-postres");
        html += renderCat("BODEGA / WINE CELLAR", vinos, "sugerencias-seccion-vinos");

        // Generador de botones QR
        let initialImgSrc = config.qrMod;
        const defaultOpt = config.qrOptions.find(o => o.isDefault);
        if (defaultOpt && defaultOpt.value === 'default') {
            initialImgSrc = config.qrDefault;
        }

        let qrButtonsHtml = '';
        config.qrOptions.forEach(opt => {
            const isActive = opt.isDefault;
            const style = `cursor: pointer; color: ${isActive ? '#0d5c63' : '#64748b'}; font-weight: ${isActive ? 'bold' : 'normal'};`;
            // Se pasa modoSeguro (MAYÚSCULAS) para evitar el bug
            qrButtonsHtml += `<label style="${style}"><input type="radio" name="${config.qrRadioName}" value="${opt.value}" ${isActive ? 'checked' : ''} onchange="window.toggleQR('${opt.value}', '${modoSeguro}')"> ${opt.label}</label>`;
        });
        
        html += `
            </div>
            <div class="sugerencias-footer">
                <div class="sugerencias-advertencia-alergenos">
                    Si usted tiene algún tipo de alergia alimentaria, por favor comuníquelo a nuestro personal.<br>
                    If you have any food allergies, please inform our staff.
                </div>
                <div class="sugerencias-qr-container">
                    <div class="qr-selector-wrapper" style="font-size: 0.75rem; color: #64748b; text-align: center; margin-bottom: 5px; user-select:none; display: flex; flex-direction: row; align-items: center; justify-content: center; flex-wrap: nowrap; gap: 8px; white-space: nowrap;">
                        Tipo de QR: ${qrButtonsHtml}
                    </div>
                    <img src="${initialImgSrc}" class="sugerencias-qr-img" id="${config.qrImgId}">
                </div>
            </div>
        `;

        contenedor.innerHTML = html;
    }

    window.imprimirSugerencias = function(modo) {
        const modoSeguro = modo ? modo.toUpperCase() : 'RG';
        const config = SUGERENCIAS_CONFIG[modoSeguro];
        if (!config) return;

        const contenedor = document.getElementById(config.containerId);
        if (!contenedor) return;
        
        const styleContent = document.getElementById('sugerencias-print-styles').innerHTML;
        // MODIFICADO: Uso de getModoAlias en el título de la ventana de impresión
        const pWin = window.open('', '_blank', 'width=800,height=1000');
        pWin.document.write(`<html><head><title>Sugerencias ${getModoAlias(modoSeguro)}</title><style>${styleContent}</style></head><body><div class="sugerencias-panel">${contenedor.innerHTML}</div><script>setTimeout(() => { window.print(); window.close(); }, 500);<\/script></body></html>`);
        pWin.document.close();
    };

})();
```

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Editor Pro</title>
    <link rel="icon" href="setting.png" type="image/png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <div class="container">
        <div class="header-admin">
            <!-- MODIFICADO: Usar un placeholder transparente para evitar parpadeos, el script de abajo lo llenará -->
            <img id="header-logo-rg" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" class="header-logo header-logo-left" alt="Logo RG">
            
            <div class="header-center-wrapper">
                <h1>Web Editor Pro <span id="app-version" style="font-size: 0.65rem; color: #95a5a6; font-weight: 400; margin-left: 10px; vertical-align: middle; display: inline-block;"></span></h1>
                
                <div style="display: flex; align-items: center; gap: 10px; width: 100%; margin-bottom: 10px;">
                    <div id="status-carga" class="status-ok" style="flex: 1;">⏳ Conectando...</div>
                    <div style="font-size: 0.7rem; display: flex; align-items: center; gap: 4px; white-space: nowrap; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; border: 1px solid #ddd;">
                        <input type="checkbox" id="toggle-debug-panel" style="cursor: pointer; margin: 0;">
                        <label for="toggle-debug-panel" style="cursor: pointer; color: #555; font-weight: 600; margin: 0;">DEBUG</label>
                    </div>
                </div>
                
                <div id="optimistic-timer" style="display:none; font-size: 0.7rem; color: #c0392b; font-weight: bold; margin-top: 5px; background: #fce4e4; padding: 4px 8px; border-radius: 4px; align-items: center; gap: 5px;">
                    🔒 Consistencia <span id="timer-mode" style="background:#c0392b; color:white; padding: 1px 4px; border-radius: 3px; font-size: 0.65rem;">RG</span>: <span id="timer-seconds">180</span>s
                    <button onclick="cancelarModoOptimista()" style="margin-left: 10px; background: transparent; border: 1px solid #c0392b; color: #c0392b; padding: 1px 5px; border-radius: 3px; cursor: pointer; font-size: 0.6rem; font-weight: bold;">✕ CANCELAR</button>
                </div>

                <div class="api-keys-manager">
                    <label class="label-seccion">Gestión de API Keys Gemini</label>
                    <div class="api-keys-inputs">
                        <input type="text" id="nuevaKey" placeholder="Pega tu Gemini Key aquí..." class="input-estandar">
                        <button id="addKeyBtn" class="btn-add-key">Añadir Key</button>
                    </div>
                    <div class="api-keys-list">
                        <div id="contenedorSelectKeys" class="flex-1">
                            <select id="selectKeys" class="select-keys"></select>
                        </div>
                        <button id="btnEliminarKeySeleccionada" class="btn-delete-key" title="Eliminar key">✕</button>
                    </div>
                </div>
            </div>

            <!-- MODIFICADO: Usar un placeholder transparente para evitar parpadeos, el script de abajo lo llenará -->
            <img id="header-logo-usopen" src="data:image/gif;base64,R0lGODlhAQABAAD/ACWAAAAAAQABAAACADs=" class="header-logo header-logo-right" alt="Logo USOPEN">
        </div>

        <div class="tabs-container">
            <!-- MODIFICADO: Añadidos IDs para inyección dinámica de Alias -->
            <button id="tab-btn-rg" class="tab-btn active" onclick="switchTab('editor', this)">1. Editor Carta RG</button>
            <button id="tab-btn-sug-rg" class="tab-btn" onclick="switchTab('sugerencias', this)">2. Sugerencias RG</button>
            <button class="tab-btn" onclick="switchTab('pro', this)" style="margin-left: auto; margin-right: auto;">3. Traductor Pro</button>
            <button id="tab-btn-usopen" class="tab-btn" onclick="switchTab('editor-usopen', this)">4. Editor Carta USOpen</button>
            <button id="tab-btn-sug-usopen" class="tab-btn" onclick="switchTab('sugerencias-usopen', this)">5. Sugerencias USOpen</button>
        </div>

        <div id="tab-editor" class="tab-content active">
            <div id="editor-dinamico"></div>
        </div>

        <div id="tab-pro" class="tab-content pro-panel" style="display: none;">
            <div class="flex flex-col md:flex-row gap-4 mb-4">
                <div class="card md:w-3/10 flex-none flex flex-col justify-between h-[310px]" style="width: 30%; min-width: 330px;">
                    <div class="space-y-1.5">
                        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2">1. Orígenes de Datos</h3>
                        <div class="grid grid-cols-1 gap-1 text-sm mb-2">
                            <div class="flex gap-2 items-center"><label class="text-xs whitespace-nowrap font-bold text-slate-400">WEB RG:</label></div>
                            <div class="flex gap-1.5">
                                <!-- MODIFICADO: Eliminado el value hardcodeado, el script de config lo llenará -->
                                <input type="text" id="sheetsUrlRG" placeholder="Cargando URL RG desde config.js..." class="flex-1 text-xs py-1 px-2">
                                <button id="loadSheetsBtnRG" class="btn btn-secondary text-xs py-1 px-2 whitespace-nowrap">Cargar web RG</button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 gap-1 text-sm mb-2">
                            <div class="flex gap-2 items-center"><label class="text-xs whitespace-nowrap font-bold text-slate-400">WEB USOPEN:</label></div>
                            <div class="flex gap-1.5">
                                <!-- MODIFICADO: Eliminado el value hardcodeado, el script de config lo llenará -->
                                <input type="text" id="sheetsUrlUSOpen" placeholder="Cargando URL USOPEN desde config.js..." class="flex-1 text-xs py-1 px-2">
                                <button id="loadSheetsBtnUSOpen" class="btn btn-secondary text-xs py-1 px-2 whitespace-nowrap">Cargar web USOpen</button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 gap-1 text-sm">
                            <div class="flex gap-2 items-center"><label class="text-xs whitespace-nowrap">CSV Local:</label><input type="file" id="archivoLocal" accept=".csv" class="text-xs flex-1 p-0.5"></div>
                        </div>
                    </div>
                    <div class="border-t pt-1.5 space-y-1.5 mt-2">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-medium">Rango de Filas:</span>
                            <div class="flex items-center gap: 2px">
                                <label class="text-slate-400">Desde: <input type="number" id="rangoInicio" value="2" min="2" class="w-20 text-center text-xs py-0.5 px-1 ml-1"></label>
                                <label class="text-slate-400">Hasta: <input type="number" id="rangoFin" value="9999" min="2" class="w-20 text-center text-xs py-0.5 px-1 ml-1"></label>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-1.5 text-xs">
                            <button id="btnIniciar" class="btn btn-success font-bold py-1 px-1 text-[11px] tracking-tight uppercase">Iniciar Traducción</button>
                            <button id="btnPausa" class="btn btn-secondary font-bold py-1 px-1 uppercase">Pausar</button>
                            <button id="btnCancelar" class="btn btn-danger font-bold py-1 px-1 uppercase">Cancelar</button>
                            <button id="saveCsvBtn" class="btn btn-primary font-bold py-1 px-1 text-[11px] whitespace-nowrap uppercase">Descargar CSV</button>
                        </div>
                        <button id="btnSyncSheets" class="btn btn-success font-bold py-2 px-1 text-[11px] tracking-tight uppercase w-full col-span-2 mt-1 border border-emerald-400" style="grid-column: span 2;">☁️ Sincronizar con Google Sheet</button>
                    </div>
                </div>
                <div class="card md:w-1/5 flex-none flex flex-col h-[310px]" style="width: 20%; min-width: 200px">
                    <h3 class="text-sm font-semibold uppercase tracking-wider mb-2">2. Idioma Vista</h3>
                    <div id="radiosIdiomas" class="w-full overflow-y-auto pr-1 flex-1"></div>
                </div>
                <div class="card flex-1 md:w-1/2 c-consola flex flex-col h-[310px]" style="width: 50%;">
                    <h3 class="text-sm font-semibold uppercase tracking-wider mb-2">3. Monitor de Sistema</h3>
                    <div id="consola"></div>
                </div>
            </div>
            <div class="card overflow-x-auto">
                <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Previsualización de Datos en Memoria</h3>
                <div class="max-h-[580px] overflow-y-auto">
                    <table class="w-full">
                        <thead id="tableHeadRow" class="sticky top-0 z-10"></thead>
                        <tbody id="tablaBody" class="text-sm text-selle-300">
                            <tr><td colspan="4" class="text-center py-8 text-slate-500 italic">Ningún archivo cargado en el sistema. Selecciona un origen arriba.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="tab-sugerencias" class="tab-content" style="display: none;">
            <div class="sugerencias-panel" id="sugerencias-contenido"></div>
        </div>

        <div id="tab-sugerencias-usopen" class="tab-content" style="display: none;">
            <div class="sugerencias-panel" id="sugerencias-contenido-usopen"></div>
        </div>
    </div>

    <button class="btn-add-float" onclick="abrirSelector()">+</button>
    <button class="btn-guardar-main" id="btn-guardar-dinamico" onclick="enviarAlExcel()">GUARDAR CAMBIOS EN WEB</button>

    <div id="modal-selector" class="modal">
        <div class="modal-content">
            <h2 style="margin-top:0;">Añadir Nuevo Plato</h2>
            <div id="lista-agrupada"></div>
            <button class="btn-modal-cancelar" onclick="cerrarModal('modal-selector')" style="margin-top:20px;">Cancelar</button>
        </div>
    </div>

    <div id="modal-seleccionar-destino" class="modal">
        <div class="modal-content" style="max-width: 400px; text-align: center; padding: 30px;">
            <h3 style="margin-top:0; margin-bottom: 10px;">¿Destino de la Importación?</h3>
            <p style="color: #666; margin-bottom: 25px;">Selecciona a qué restaurante deseas subir los datos del archivo seleccionado:</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button class="btn-modal-aceptar" id="modal-dest-rg" onclick="UI.confirmarImportacion('RG')" style="background-color: #e67e22; width: 100%; padding: 15px; font-size: 1.1rem;">RG (Roland Garros)</button>
                <button class="btn-modal-aceptar" id="modal-dest-usopen" onclick="UI.confirmarImportacion('USOPEN')" style="background-color: #2ecc71; width: 100%; padding: 15px; font-size: 1.1rem;">US Open</button>
            </div>
            <button class="btn-modal-cancelar" onclick="UI.cancelarImportacion()" style="margin-top: 25px;">Cancelar</button>
        </div>
    </div>

    <div id="modal-editor" class="modal">
        <div class="modal-content modal-full-layout">
            <div class="modal-col-izquierda">
                <div class="input-group">
                    <label id="label-uvas" class="label-seccion">Nombres y Detalles del Plato</label>
                    <input id="edit-es" class="input-estandar" placeholder="Nombre en Español">
                    <input id="edit-es-uvas" class="input-estandar input-uvas" placeholder="Detalles / Uvas (Español)" style="display: none;">
                </div>
                <div class="input-group">
                    <button id="btn-generar-en" class="btn-traducir-en" onclick="generarTraduccionEN()">🇬🇧 Generar opciones en Inglés con IA</button>
                    <input id="edit-en" class="input-estandar" placeholder="Nombre en Inglés">
                    <input id="edit-en-uvas" class="input-estandar input-uvas" placeholder="Detalles / Uvas (Inglés)" style="display: none;">
                </div>
                <button id="btn-autotraducir" class="btn-traductor-magico" onclick="ejecutarTraduccionAutomatica()" disabled>✨ Auto-Traducir resto de idiomas con Gemini</button>
                <div class="input-group">
                    <label class="label-seccion">Resto de Idiomas</label>
                    <div id="contenedor-resto-idiomas"></div>
                </div>
            </div>
            <div class="modal-col-derecha">
                <div class="input-group">
                    <label class="label-seccion">Configuración</label>
                    <div class="panel-control-precio">
                        <div class="input-group" style="margin-bottom: 0;">
                            <label style="font-size:0.7rem; font-weight:bold; color:#7f8c8d;">Precio (€)</label>
                            <input id="edit-precio" type="number" step="0.01" class="input-estandar input-precio-super-mini input-precio-mini">
                        </div>
                        <div class="input-group" style="margin-bottom: 0;">
                            <label style="font-size:0.7rem; font-weight:bold; color:#7f8c8d;">Nombre Imagen</label>
                            <input id="edit-imagen" class="input-estandar input-imagen-flexible" placeholder="ej: paella01.webp">
                        </div>
                    </div>
                </div>
                <div class="input-group">
                    <label class="label-seccion">Alérgenos</label>
                    <div id="alergenos-grid" class="alergenos-grid"></div>
                </div>
                <div id="contenedor-croquetas"></div>
                <div class="modal-acciones-footer">
                    <button class="btn-modal-aceptar" onclick="aplicarCambiosPlato()">✅ Aplicar Cambios</button>
                    <button class="btn-modal-cancelar" onclick="cerrarModal('modal-editor')">Cancelar</button>
                </div>
            </div>
        </div>
    </div>

    <div id="modal-traduccion-en" class="modal">
        <div class="modal-content modal-box-en">
            <h2 style="margin-top:0; margin-bottom: 10px;">Selecciona la mejor traducción al Inglés</h2>
            <div id="opciones-en-container" class="opciones-en-scroll"></div>
            <div class="footer-box-en">
                <textarea id="editar-opcion-en" class="input-estandar" rows="3" placeholder="Puedes editar la opción seleccionada aquí antes de confirmar..."></textarea>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn-modal-aceptar" onclick="confirmarTraduccionEN()" style="margin:0;">Confirmar Selección</button>
                    <button class="btn-modal-cancelar" onclick="cerrarModalTraduccionEN()" style="margin:0;">Cancelar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Carga de Librerías y Scripts -->
    <script src="config.js"></script>
    <!-- MODIFICADO: Script instantáneo que inyecta las URLs, Logos y ALIAS de config.js en los inputs, header y pestañas -->
    <script>
        if (typeof CSV_URL_RG !== 'undefined') document.getElementById('sheetsUrlRG').value = CSV_URL_RG;
        if (typeof CSV_URL_USOPEN !== 'undefined') document.getElementById('sheetsUrlUSOpen').value = CSV_URL_USOPEN;
        
        // NUEVO: Inyección de Logos del Header desde config.js
        const logoRGEl = document.getElementById('header-logo-rg');
        const logoUSOPENEl = document.getElementById('header-logo-usopen');
        if (typeof LOGO_RG !== 'undefined' && logoRGEl) logoRGEl.src = LOGO_RG;
        if (typeof LOGO_USOPEN !== 'undefined' && logoUSOPENEl) logoUSOPENEl.src = LOGO_USOPEN;

        // NUEVO: Inyección de ALIAS en las pestañas y botones de modales
        if (typeof getModoAlias === 'function') {
            const tabRG = document.getElementById('tab-btn-rg');
            if (tabRG) tabRG.innerText = `1. Editor Carta ${getModoAlias('RG')}`;
            
            const tabSugRG = document.getElementById('tab-btn-sug-rg');
            if (tabSugRG) tabSugRG.innerText = `2. Sugerencias ${getModoAlias('RG')}`;
            
            const tabUSOPEN = document.getElementById('tab-btn-usopen');
            if (tabUSOPEN) tabUSOPEN.innerText = `4. Editor Carta ${getModoAlias('USOPEN')}`;
            
            const tabSugUSOPEN = document.getElementById('tab-btn-sug-usopen');
            if (tabSugUSOPEN) tabSugUSOPEN.innerText = `5. Sugerencias ${getModoAlias('USOPEN')}`;

            // NUEVO: Inyección de Alias en los botones del modal de importación
            const modalDestRG = document.getElementById('modal-dest-rg');
            if (modalDestRG) modalDestRG.innerText = getModoAlias('RG');

            const modalDestUSOPEN = document.getElementById('modal-dest-usopen');
            if (modalDestUSOPEN) modalDestUSOPEN.innerText = getModoAlias('USOPEN');
        }
    </script>
    <script src="languages.js"></script>
    <!-- NUEVO: Datos estáticos pesados del menú y configuraciones de UI -->
    <script src="data.js"></script>
    <script src="state.js"></script>
    <!-- NUEVO: Utilidades puras de procesamiento de texto (Sin dependencias) -->
    <script src="utils.js"></script>
    <!-- Lógica principal del Editor -->
    <script src="app.js"></script>
    <!-- Lógica del Traductor Pro (Módulo ES) -->
    <script type="module" src="ui.js"></script>
    <!-- Impresión Unificada -->
    <script src="sugerencias-print.js"></script>

    <!-- Pantalla Flotante de Carga -->
    <div id="loading-overlay" class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">Cargando datos...</div>
    </div>

    <!-- Panel de Debug Visual Fijo -->
    <div id="debug-panel" style="display: none; position: fixed; bottom: 20px; left: 20px; background: #111827; color: #4ade80; padding: 12px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; z-index: 9998; max-width: 320px; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); line-height: 1.4; cursor: grab;">
        <div style="color: #f8fafc; margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 4px;">🐛 DEBUG MODE ACTIVO</div>
        <div id="debug-versions" style="margin-bottom: 8px; color: #94a3b8;"></div>
        <hr style="border-color: #334155; margin: 5px 0;">
        <div id="debug-state"></div>
    </div>

    <script>
        console.log("%c[Editor] Inicializando configuración de URLs...", "color: blue; font-weight: bold;");

        function actualizarTextoBotonGuardar() {
            const btn = document.getElementById('btn-guardar-dinamico');
            if (!btn) return;
            const modo = window.currentMode || 'RG';
            // MODIFICADO: Uso de getModoAlias para el texto visual
            btn.innerText = `GUARDAR CAMBIOS EN WEB ${getModoAlias(modo)}`;
            console.log(`[Editor] Botón actualizado a contexto: ${modo}`);
        }

        async function switchTab(tabId, btnElement) {
            console.log(`[Editor] Cambiando a pestaña: ${tabId}`);
            
            const loader = document.getElementById('loading-overlay');
            if (loader) loader.style.display = 'flex';

            try {
                const esEditorActual = document.getElementById('tab-editor').style.display !== 'none' || document.getElementById('tab-editor').classList.contains('active');
                
                if (esEditorActual && window.hayCambiosSinGuardar) {
                    const confirmarGuardar = confirm("⚠️ Tienes cambios sin guardar en esta pestaña. ¿Quieres guardarlos antes de cambiar?");
                    if (confirmarGuardar) {
                        await window.enviarAlExcel();
                        return; 
                    }
                    console.log("[Editor] Usuario descartó cambios o guardado falló. Procediendo con cambio...");
                }

                document.querySelectorAll('.tab-content').forEach(el => {
                    el.classList.remove('active');
                    el.style.display = 'none';
                });
                document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
                
                let targetTabId = tabId;
                if (tabId === 'editor-usopen') {
                    targetTabId = 'editor';
                }
                
                const targetTab = document.getElementById('tab-' + targetTabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                    targetTab.style.display = 'block';
                }

                if(btnElement) btnElement.classList.add('active');

                const floatBtn = document.querySelector('.btn-add-float');
                const saveBtn = document.getElementById('btn-guardar-dinamico');
                
                if (targetTabId === 'editor') {
                    if(floatBtn) floatBtn.style.display = 'block';
                    if(saveBtn) saveBtn.style.display = 'block';
                } else {
                    if(floatBtn) floatBtn.style.display = 'none';
                    if(saveBtn) saveBtn.style.display = 'none';
                }

                let dataContext = "RG";

                if (tabId === 'sugerencias-usopen' || tabId === 'editor-usopen') {
                    window.currentMode = 'USOPEN';
                    dataContext = "USOPEN";
                } else {
                    window.currentMode = 'RG';
                    dataContext = "RG";
                }

                console.log(`[Editor] Contexto de datos establecido a: ${dataContext} (window.currentMode: ${window.currentMode})`);

                actualizarTextoBotonGuardar();

                const timerDiv = document.getElementById('optimistic-timer');
                if (timerDiv) {
                    if (window.optimisticTimers && window.optimisticTimers[window.currentMode]) {
                        timerDiv.style.display = 'flex';
                        const timerMode = document.getElementById('timer-mode');
                        // MODIFICADO: Inyectar alias visual en el timer también
                        if(timerMode && typeof getModoAlias === 'function') timerMode.innerText = getModoAlias(window.currentMode);
                    } else {
                        timerDiv.style.display = 'none';
                    }
                }

                if (typeof window.cargar === 'function') {
                    try {
                        await window.cargar();
                    } catch (e) {
                        console.error("[Editor] Error cargando datos:", e);
                        alert("Error cargando datos: " + e.message);
                    }
                } else {
                    console.error("[Editor] ERROR CRÍTICO: window.cargar NO está definido.");
                }

                if (tabId === 'sugerencias') {
                    if (typeof window.renderCarta === 'function') window.renderCarta('RG');
                } else if (tabId === 'sugerencias-usopen') {
                    if (typeof window.renderCarta === 'function') window.renderCarta('USOPEN');
                }
                
                actualizarTextoBotonGuardar();
            } finally {
                if (loader) loader.style.display = 'none';
            }
        }

        if (!window.currentMode) {
            window.currentMode = 'RG';
        }
        actualizarTextoBotonGuardar();

        function updateDebugPanel() {
            const vDiv = document.getElementById('debug-versions');
            const sDiv = document.getElementById('debug-state');
            if (!vDiv || !sDiv) return;

            let vHtml = '';
            if (window.APP_VERSIONS) {
                for (const [key, val] of Object.entries(window.APP_VERSIONS)) {
                    vHtml += `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${key}: ${val}">${key}: <span style="color: #fbbf24;">${val}</span></div>`;
                }
            }
            vDiv.innerHTML = vHtml;

            // MODIFICADO: Mostrar Alias junto al modo interno en el panel Debug
            const modoAliasDebug = (typeof getModoAlias === 'function') ? getModoAlias(window.currentMode || 'RG') : '';
            let sHtml = `<div>Modo Activo: <span style="color: #60a5fa;">${window.currentMode || 'RG'}</span> ${modoAliasDebug ? `(${modoAliasDebug})` : ''}</div><hr style="border-color: #334155; margin: 4px 0;">`;
            
            ['RG', 'USOPEN'].forEach(modo => {
                const state = window.optimisticState ? window.optimisticState[modo] : { t: 0, s: [] };
                const timeSinceSave = Date.now() - state.t;
                const isZone = timeSinceSave < CONSISTENCY_WINDOW_MS; 
                
                sHtml += `<div style="margin-bottom: 4px; color: ${modo === window.currentMode ? '#f8fafc' : '#64748b'}">--- ${modo} ---</div>`;
                sHtml += `<div>Hace: <span style="color: ${timeSinceSave < 10000 ? '#4ade80' : '#f87171'}">${Math.round(timeSinceSave/1000)}s</span></div>`;
                sHtml += `<div style="color: ${isZone ? '#f87171' : '#4ade80'}; font-weight: bold;">Zona Peligro: ${isZone ? '⛔ ACTIVA' : '✅ INACTIVA'}</div>`;
                sHtml += `<div>Snapshot: <span style="color: #c084fc;">${state.s ? state.s.length : 0} items</span></div>`;
            });

            sHtml += `<hr style="border-color: #334155; margin: 4px 0;">`;
            sHtml += `<div>Mem Local: <span style="color: #38bdf8;">${window.datosLocales ? window.datosLocales.length : 0} items</span></div>`;

            sDiv.innerHTML = sHtml;
        }

        (function() {
            const panel = document.getElementById('debug-panel');
            if (!panel) return;

            let isDragging = false;
            let startX = 0, startY = 0;
            let initialLeft = 0, initialTop = 0;

            panel.addEventListener('mousedown', function(e) {
                isDragging = true;
                const rect = panel.getBoundingClientRect();
                startX = e.clientX;
                startY = e.clientY;
                initialLeft = rect.left;
                initialTop = rect.top;
                panel.style.left = initialLeft + 'px';
                panel.style.top = initialTop + 'px';
                panel.style.bottom = 'auto';
                panel.style.right = 'auto';
                panel.style.cursor = 'grabbing';
                e.preventDefault();
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                panel.style.left = (initialLeft + dx) + 'px';
                panel.style.top = (initialTop + dy) + 'px';
            });

            document.addEventListener('mouseup', function() {
                if (!isDragging) return;
                isDragging = false;
                panel.style.cursor = 'grab';
            });
        })();

        (function() {
            const checkbox = document.getElementById('toggle-debug-panel');
            const panel = document.getElementById('debug-panel');
            if (checkbox && panel) {
                checkbox.addEventListener('change', function() {
                    panel.style.display = this.checked ? 'block' : 'none';
                });
            }
        })();

        setInterval(updateDebugPanel, 1000);
        updateDebugPanel();
    </script>
</body>
</html>
```

```markdown
// [🔒 ARCHIVO REESCRITO COMPLETAMENTE - VERSIÓN ACTUALIZADA v3.0 - SISTEMA DE ALIAS]
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
  Lee: DOM (#edit-es), getKeys()
  Escribe en: DOM (#modal-traduccion-en), opcionesENActuales
  Es usado por: index.html (botón onclick)

- abrirModalTraduccionEN(), seleccionarOpcionEN(), confirmarTraduccionEN(), cerrarModalTraduccionEN()
  Gestionan: El flujo interno del modal de selección de traducción EN.
  Es usado por: index.html (botones onclick del modal)

- ejecutarTraduccionAutomatica()
  Lee: DOM, window.IDIOMAS_ORDEN, getKeys()
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
  Lee: getKeys(), stateContainer, DOM (rangos)
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
  Lee: fuente (Array), config, window.desglosarNombre, PATH_ALERGENOS, getModoAlias (para botón imprimir)
  Escribe en: DOM (contenedor)
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
NUEVO: Los textos estáticos de las pestañas y botones se reescriben dinámicamente usando getModoAlias() en el bloque de inyección post-config.

- actualizarTextoBotonGuardar()
  Lee: window.currentMode, getModoAlias()
  Escribe en: DOM (#btn-guardar-dinamico)
  Es usado por: switchTab, inicialización.

- switchTab(tabId, btnElement)
  Lee: window.hayCambiosSinGuardar, window.cargar, window.renderCarta, window.optimisticTimers, getModoAlias()
  Escribe en: window.currentMode, DOM (tabs, botones flotantes, #optimistic-timer usando getModoAlias en #timer-mode)
  Es usado por: Botones .tab-btn inline onclick

- updateDebugPanel()
  Lee: window.APP_VERSIONS, window.optimisticState, window.datosLocales, window.currentMode, CONSISTENCY_WINDOW_MS (GLOBAL), getModoAlias()
  Escribe en: DOM (#debug-versions, #debug-state mostrando Alias entre paréntesis)
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
- Objetivo: #tab-btn-rg, #tab-btn-sug-rg, #tab-btn-usopen, #tab-btn-sug-usopen, #modal-dest-rg, #modal-dest-usopen
- Escribe en: innerText de los botones usando getModoAlias('RG') y getModoAlias('USOPEN')
- Es usado por: Ejecución inmediata al cargar index.html
```
