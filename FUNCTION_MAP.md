```javascript
// --- app.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.app = '1.0.46-IMAGENES-FIX-EMOJI'; 

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

function getWebAppUrlSafe() {
    if (typeof window.WEB_APP_URL !== 'undefined') return window.WEB_APP_URL;
    if (typeof window.getWebAppUrl === 'function') return window.getWebAppUrl();
    return '';
}

function getCsvUrlSafe() {
    // Prioridad a la variable global dinámica (controlada por index.html/pestañas)
    if (typeof window.CSV_URL !== 'undefined') return window.CSV_URL;
    if (typeof window.getCsvUrl === 'function') return window.getCsvUrl();
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
            UI.log(`[Editor] Conectando con Google Sheets remoto (${modo})...`);
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
                    UI.log(`[Alerta] CDN ${modo} desactualizado. Asegurando ${parchesAplicados} ediciones locales.`);
                }
            }
        }

        console.log(`[Editor] ${datosLocales.length} platos cargados (${modo}).`);
        
        // Exponer a window para otros scripts
        window.datosLocales = datosLocales;

        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) {
            statusCarga.innerText = `✅ Datos Sincronizados ${modo} (${window.IDIOMAS_ORDEN ? window.IDIOMAS_ORDEN.length : 0} Idiomas)`;
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
            if (timerMode) timerMode.innerText = modo;
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
        
        alert(`✅ Petición enviada para ${modo}. Memoria local bloqueada por 3 min.`);
        
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

```markdown
Regla de Oro: Antes de renombrar, mover o eliminar una función/variable listada aquí, verifica su sección ⚠️ DEPENDENCIAS CRUZADAS para evitar romper otros módulos o los onclick del HTML.

================================================================================
🌐 Estado Global Compartido (window.*)
================================================================================
El núcleo de la aplicación. Alterar una de estas variables afecta a múltiples archivos simultáneamente.

Variable                   Tipo     Archivo Origen   Escritores                                                         Lectores
------------------------------------------------------------------------------------------------------------------------------------
window.currentMode         String   index.html       index.html (switchTab), ui.js (confirmarImportacion, hack...)     config.js, app.js, index.html, ui.js
window.datosLocales        Array    app.js           app.js (cargar)                                                  app.js (múltiples), sugerencias-print.js, index.html
window.hayCambiosSinGuardar Boolean  app.js         app.js (moverPlato, aplicarCambiosPlato, toggleActivo, ...)     index.html (switchTab)
window.optimisticState     Object   app.js           app.js (cargar, enviarAlExcel, cancelarModoOptimista)            app.js, sugerencias-print.js, index.html
window.optimisticTimers    Object   app.js           app.js (iniciarContadorOptimista, cancelarModoOptimista)        index.html (switchTab, updateDebugPanel)
window.APP_VERSIONS        Object   Varios           app.js, ui.js, sugerencias-print.js                              index.html (updateDebugPanel)
window.UI.tempImportFile   File     ui.js            ui.js (listener archivoLocal)                                   ui.js (confirmarImportacion, cancelarImportacion)
window.lastSaveAttempt     Number   No definido      -                                                                  ui.js (cargarGoogleSheets)

--- NUEVAS VARIABLES DE SUPER-CONFIG (Inyectadas por config.js) ---
CONSISTENCY_WINDOW_MS      Number   config.js       (Estática)                                                         app.js (cargar, iniciarContadorOptimista), index.html (updateDebugPanel), sugerencias-print.js (aplicarParcheOptimista)
PATH_IMAGENES              String   config.js       (Estática)                                                         sugerencias-print.js (para contexto, no usado en app.js renderizar)
PATH_ALERGENOS             String   config.js       (Estática)                                                         sugerencias-print.js (procesarYRender)
LOGO_RG                    String   config.js       (Estática)                                                         index.html (header img src), sugerencias-print.js (SUGERENCIAS_CONFIG)
LOGO_USOPEN                String   config.js       (Estática)                                                         index.html (header img src), sugerencias-print.js (SUGERENCIAS_CONFIG)
QR_RG_DEFAULT              String   config.js       (Estática)                                                         sugerencias-print.js (SUGERENCIAS_CONFIG)
QR_RG_MOD                  String   config.js       (Estática)                                                         sugerencias-print.js (SUGERENCIAS_CONFIG)
QR_USOPEN_DEFAULT          String   config.js       (Estática)                                                         sugerencias-print.js (SUGERENCIAS_CONFIG)
QR_USOPEN_MOD              String   config.js       (Estática)                                                         sugerencias-print.js (SUGERENCIAS_CONFIG)

--- NUEVAS VARIABLES DE UTILIDADES (Inyectadas por utils.js) ---
window.desglosarNombre     Function utils.js       (Estática)                                                         app.js, sugerencias-print.js
window.superLimpiar        Function utils.js       (Estática)                                                         app.js
window.formatWineName      Function utils.js       (Estática)                                                         app.js
window.extraerJSON         Function utils.js       (Estática)                                                         app.js


================================================================================
📁 config.js
================================================================================
No usa módulos. Se ejecuta en el scope global.

Constantes de Red
- CSV_URL_RG, CSV_URL_USOPEN, WEB_APP_URL_RG, WEB_APP_URL_USOPEN
  Es usado por: getWebAppUrl(), getCsvUrl() (ambas internas).

Funciones de Red
- getWebAppUrl()
  Retorna: String (URL del Web App de Google)
  Lee: window.currentMode, WEB_APP_URL_RG, WEB_APP_URL_USOPEN
  Es usado por: app.js (vía getWebAppUrlSafe()), ui.js (en sincronizarConGoogleSheets)

- getCsvUrl()
  Retorna: String (URL del CSV de Google Sheets)
  Lee: window.currentMode, CSV_URL_RG, CSV_URL_USOPEN
  Es usado por: app.js (vía getCsvUrlSafe()), index.html (en switchTab)

NUEVAS: Constantes de Assets y Sistema
- PATH_IMAGENES, PATH_ALERGENOS, LOGO_RG, LOGO_USOPEN
  Es usado por: index.html, sugerencias-print.js (inyectadas en SUGERENCIAS_CONFIG)
- QR_RG_DEFAULT, QR_RG_MOD, QR_USOPEN_DEFAULT, QR_USOPEN_MOD
  Es usado por: sugerencias-print.js (inyectadas en SUGERENCIAS_CONFIG)
- CONSISTENCY_WINDOW_MS
  Es usado por: app.js, index.html, sugerencias-print.js


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

- IDIOMAS_CONFIG (Object): Mapeo ISO -> Nombre visible.
- IDIOMAS_ORDEN (Array): Orden de procesamiento.
- IDIOMAS_CSV_INDICES (Object): Mapeo de qué columna del CSV pertenece a qué idioma.
- ESTRUCTURA (Array): Arbol de categorías, subcategorías, IDs y rangos.
- categoriesList, subCatsLang (Object/Array): Diccionarios de traducción de categorías.

Lectores: app.js (carga, renderizado, traducción), ui.js (carga de columnas, render de radios).


================================================================================
📁 data.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo.

- ESTRUCTURA (Object): Re-definición o complemento del árbol de categorías (verificar integración con languages.js).
- categoriesList, subCatsLang (Object/Array): Diccionarios de traducción de categorías.

NUEVAS: Constantes de UI del Editor
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
Nota: Estas funciones se han movido a utils.js. app.js las consume desde ahí.
- desglosarNombre(texto), extraerJSON(texto), superLimpiar(texto), formatWineName(texto)

Funciones de Red y Estado

- getWebAppUrlSafe() / getCsvUrlSafe()
  Retorna: String
  Lee: window.WEB_APP_URL, window.CSV_URL, y sus funciones equivalentes.
  Es usado por: Internamente en app.js.

- cargar(retryCount)
  Lee: getCsvUrlSafe(), window.optimisticState, window.ESTRUCTURA, window.IDIOMAS_ORDEN, window.IDIOMAS_CSV_INDICES, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: window.datosLocales, window.hayCambiosSinGuardar, DOM (#status-carga, #editor-dinamico)
  Es usado por: index.html (switchTab), se auto-invoca al final del archivo.

- enviarAlExcel()
  Lee: getWebAppUrlSafe(), window.datosLocales, window.currentMode, window.IDIOMAS_ORDEN
  Escribe en: window.optimisticState, sessionStorage, window.hayCambiosSinGuardar, DOM (#btn-guardar-dinamico)
  Es usado por: index.html (botón #btn-guardar-dinamico inline onclick), index.html (switchTab)

- iniciarContadorOptimista(modo)
  Lee: window.optimisticTimers, window.currentMode, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: window.optimisticTimers, sessionStorage, DOM (#optimistic-timer)
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

- abrirEditor(id, esNuevo)
  Lee: window.datosLocales, window.IDIOMAS_ORDEN, window.IDIOMAS_CONFIG, ALERGENOS_LISTA (GLOBAL), CROQUETAS_CONFIG (GLOBAL)
  Escribe en: Variables locales (platoEditandoId, esNuevoPlato), DOM (inputs del modal)
  Es usado por: app.js (prepararNuevoPlato), index.html (botones dinámicos onclick)

- aplicarCambiosPlato()
  Lee: DOM (inputs del modal), window.IDIOMAS_ORDEN, platoEditandoId, esNuevoPlato
  Escribe en: window.datosLocales, window.hayCambiosSinGuardar
  Es usado por: index.html (botón modal onclick)

- abrirSelector() / cerrarModal(id)
  Escribe en: DOM (#modal-selector)
  Es usado por: index.html (botón flotante onclick)

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

- UI.renderRadiosIdiomas()
  Lee: window.IDIOMAS_CONFIG, activeLang
  Escribe en: DOM (#radiosIdiomas), activeLang
  Es usado por: ui.js (al final, en DOMContentLoaded)

- UI.renderTable()
  Lee: stateContainer, activeLang, window.IDIOMAS_CONFIG
  Escribe en: DOM (#tableHeadRow, #tablaBody)
  Es usado por: ui.js (Interno tras cargar datos o traducir)

- UI.cargarGoogleSheets(targetUrl, retryCount)
  Lee: window.Papa, window.lastSaveAttempt
  Escribe en: stateContainer, DOM (#consola)
  Es usado por: Listeners internos de loadSheetsBtnRG y loadSheetsBtnUSOpen

- UI.actualizarTextoBotonSync()
  Lee: stateContainer.currentProMode
  Escribe en: DOM (#btnSyncSheets)

- UI.sincronizarConGoogleSheets()
  Lee: stateContainer, stateContainer.currentProMode, window.getWebAppUrl (desde config.js)
  Escribe en: window.currentMode (Temporalmente como hack para obtener la URL correcta de config.js), Red (Fetch POST), DOM (#consola)
  Es usado por: Listener interno de btnSyncSheets

- UI.confirmarImportacion(mode) / UI.cancelarImportacion()
  Lee/Escribe: window.UI.tempImportFile, stateContainer, window.currentMode, DOM (#modal-seleccionar-destino, #archivoLocal)
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

- window.imprimirSugerencias(modo)
  Contrato de modo: String. DEBE ser 'RG' o 'USOPEN'.
  Lee: SUGERENCIAS_CONFIG[modo], DOM (contenedor configurado), Estilos inyectados (#sugerencias-print-styles)
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
MODIFICADO: Los src de las imágenes del header ahora apuntan a la ruta centralizada en config.js (imagenes/imagenes/...).

- actualizarTextoBotonGuardar()
  Lee: window.currentMode
  Escribe en: DOM (#btn-guardar-dinamico)
  Es usado por: switchTab, inicialización.

- switchTab(tabId, btnElement)
  Lee: window.hayCambiosSinGuardar, window.cargar, window.renderCarta, window.optimisticTimers
  Escribe en: window.currentMode, DOM (tabs, botones flotantes, #optimistic-timer)
  Es usado por: Botones .tab-btn inline onclick

- updateDebugPanel()
  Lee: window.APP_VERSIONS, window.optimisticState, window.datosLocales, window.currentMode, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: DOM (#debug-versions, #debug-state)
  Es usado por: setInterval interno (cada 1s)

Listeners de Arrastre (Debug Panel)
- Objetivo: #debug-panel
- Eventos: mousedown, mousemove, mouseup
- Escribe en: Estilos inline de #debug-panel (left, top, cursor)

Listeners de Toggle (Debug Panel)
- Objetivo: #toggle-debug-panel
- Eventos: change
- Escribe en: Estilo display de #debug-panel (none o block)
```
