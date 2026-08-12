// --- app.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.app = '2.4.1'; // MODIFICADO: reparte el hueco sobrante de la hoja como margen extra entre Entrantes/Principales/Postres (nunca tras BODEGA), para que el aviso de alérgenos no quede con un salto grande debajo

console.group("%c[Editor] Inicializando sistema de control...", "color: orange; font-weight: bold;");

window.hayCambiosSinGuardar = false;

// MODIFICADO: Estado de consistencia segregado por restaurante (Abstract Keys)
window.optimisticState = {
    restaurante001: { t: 0, s: [] },
    restaurante002: { t: 0, s: [] }
};

window.optimisticTimers = { restaurante001: null, restaurante002: null };

try {
    const st001 = JSON.parse(sessionStorage.getItem('optState_restaurante001') || 'null');
    const st002 = JSON.parse(sessionStorage.getItem('optState_restaurante002') || 'null');
    if (st001) window.optimisticState.restaurante001 = st001;
    if (st002) window.optimisticState.restaurante002 = st002;
} catch (e) {
    console.warn("[Editor] Error recuperando estados de sessionStorage:", e);
}

let datosLocales = [];
let platoEditandoId = null;
let esNuevoPlato = false; 
let datosTempNuevo = null; 
let opcionesENActuales = [];

// CORREGIDO: esta constante faltaba por completo (no estaba definida en ningún
// archivo), lo que hacía que abrirEditor() lanzara "ALERGENOS_LISTA is not
// defined" y se detuviera a mitad de camino — por eso el modal nunca llegaba
// a mostrarse ni con la rueda ⚙️ ni al crear un plato nuevo. Los nombres
// coinciden exactamente con los que ya usas en la columna Alergenos_Cod y con
// los 16 iconos que ya tienes en imagenes/alergenos/.
const ALERGENOS_LISTA = [
    "🌾 GLUTEN",
    "🦐 CRUSTACEO",
    "🥚 HUEVO",
    "🐟 PESCADO",
    "🥜 CACAHUETE",
    "🫘 SOJA",
    "🥛 LACTOSA",
    "🌰 FRUTOSCASCARA",
    "🥬 APIO",
    "🟡 MOSTAZA",
    "◽ SESAMO",
    "🧪 SULFITOS",
    "🫛 ALTRAMUCES",
    "🐚 MOLUSCO",
    "🥦 VEGETARIANO",
    "🌱 VEGANO"
];

// CORREGIDO: esta constante también faltaba por completo (no estaba definida
// en ningún archivo), lo que rompía abrirEditor() igual que ALERGENOS_LISTA
// en cuanto se abría un plato de croquetas (ID 12100-12299).
const CROQUETAS_CONFIG = {
    carne: ["Gambas al ajillo", "Cecina de vaca", "Rabo de toro", "Pollo", "Jamón serrano"],
    vegetariana: ["Setas", "Coliflor con curry"]
};

function getWebAppUrlSafe() {
    const modoActual = window.currentMode || 'restaurante001';
    if (typeof window.getWebAppUrl === 'function') return window.getWebAppUrl(modoActual);
    return '';
}

function getCsvUrlSafe() {
    const modoActual = window.currentMode || 'restaurante001';
    if (typeof window.getCsvUrl === 'function') return window.getCsvUrl(modoActual);
    return '';
}

async function cargar(retryCount = 0) {
    const modo = window.currentMode || 'restaurante001';
    
    // NUEVO: Validar si el restaurante está habilitado antes de cargar
    if (typeof isRestauranteA === 'function' && !isRestauranteA(modo)) {
        const alias = getModoAlias(modo);
        console.warn(`[Editor] ⛔️ Operación cancelada: El restaurante "${alias}" está deshabilitado.`);
        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) {
            statusCarga.innerText = `⛔ El restaurante "${alias}" está deshabilitado en la configuración.`;
            statusCarga.className = "status-error";
            statusCarga.style.display = "";
        }
        return;
    }
    
    const state = window.optimisticState[modo];
    const timeSinceSave = Date.now() - state.t;
    const isConsistencyZone = timeSinceSave < CONSISTENCY_WINDOW_MS;

    console.log(`[Editor] Cargando datos para ${modo} (${getModoAlias(modo)})... (Zona de peligro: ${isConsistencyZone})`);
    try {
        const url = getCsvUrlSafe();
        if (!url) return;
        
        if (typeof UI !== 'undefined' && typeof UI.log === 'function') {
            UI.log(`[Editor] Conectando con Google Sheets remoto (${getModoAlias(modo)})...`);
        }
        
        // OJO: no añadir cabeceras manuales aquí (Cache-Control/Pragma): fuerzan un preflight
        // CORS (OPTIONS) que el CSV publicado de Google Sheets/Apps Script no responde bien,
        // y el navegador bloquea la petición real. "no-store" ya evita la caché del navegador.
        const resp = await fetch(url + '&zx=' + Date.now(), { 
            cache: "no-store"
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
        
        if (isConsistencyZone && state.s && state.s.length > 0) {
            let parchesAplicados = 0;
            state.s.forEach(savedItem => {
                const loadedItem = datosLocales.find(i => i.id === savedItem.id);
                if (loadedItem) {
                    if (JSON.stringify(loadedItem) !== JSON.stringify(savedItem)) {
                        console.warn(`[Editor] ⚠️ Inconsistencia detectada en ${modo} - ID ${savedItem.id}. Aplicando parche.`);
                        parchesAplicados++;
                        Object.keys(savedItem).forEach(k => loadedItem[k] = savedItem[k]);
                    }
                }
            });
            if (parchesAplicados > 0 && typeof UI !== 'undefined' && typeof UI.log === 'function') {
                UI.log(`[Alerta] CDN ${getModoAlias(modo)} desactualizado. Asegurando ${parchesAplicados} ediciones locales.`);
            }
        }

        console.log(`[Editor] ${datosLocales.length} platos cargados (${modo}).`);
        window.datosLocales = datosLocales;

        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) {
            // NUEVO: ya no se muestra el aviso verde "✅ Datos Sincronizados..." tras una
            // carga correcta; el box se oculta directamente. Se mantiene visible para errores
            // (ver el catch de abajo) y para otros mensajes de estado (conectando, deshabilitado).
            statusCarga.style.display = "none";
        }
        
        window.hayCambiosSinGuardar = false;
        renderizar();
        generarMenuAgrupado(); 
    } catch (e) { 
        console.error("[Editor] Error cargando:", e);
        const statusCarga = document.getElementById('status-carga');
        if (statusCarga) {
            statusCarga.innerText = "❌ Error al cargar base multidireccional"; 
            statusCarga.className = "status-error";
            statusCarga.style.display = "";
        }
    }
}

function iniciarContadorOptimista(modo) {
    const timerDiv = document.getElementById('optimistic-timer');
    const timerSeconds = document.getElementById('timer-seconds');
    const timerMode = document.getElementById('timer-mode');
    
    if (window.optimisticTimers[modo]) {
        clearInterval(window.optimisticTimers[modo]);
        window.optimisticTimers[modo] = null;
    }
    
    const endTime = Date.now() + CONSISTENCY_WINDOW_MS;
    
    window.optimisticTimers[modo] = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        
        if (window.currentMode === modo) {
            if (timerDiv) timerDiv.style.display = 'block';
            if (timerSeconds) timerSeconds.innerText = remaining;
            if(timerMode) timerMode.innerText = getModoAlias(modo);
        }
        
        if (remaining <= 0) {
            clearInterval(window.optimisticTimers[modo]);
            window.optimisticTimers[modo] = null;
            window.optimisticState[modo] = { t: 0, s: [] };
            sessionStorage.removeItem('optState_' + modo);
            if (window.currentMode === modo && timerDiv) timerDiv.style.display = 'none';
        }
    }, 1000);
}

window.cancelarModoOptimista = function() {
    const modo = window.currentMode || 'restaurante001';
    if (window.optimisticTimers[modo]) {
        clearInterval(window.optimisticTimers[modo]);
        window.optimisticTimers[modo] = null;
    }
    window.optimisticState[modo] = { t: 0, s: [] };
    sessionStorage.removeItem('optState_' + modo);
    const timerDiv = document.getElementById('optimistic-timer');
    if (window.currentMode === modo && timerDiv) timerDiv.style.display = 'none';
};

function renderizar() {
    let h = "";
    datosLocales.sort((a, b) => a.id - b.id);
    const estructuraActual = getEstructuraActual();
    if (!estructuraActual) return;

    estructuraActual.forEach(cat => {
        const platos = datosLocales.filter(p => p.id >= cat.id && p.id <= (cat.id + cat.rango));
        if (platos.length === 0) return;

        // NUEVO: efecto acordeón — cada categoría empieza compactada (colapsada) y se
        // despliega al pulsar su título. El estado expandido/colapsado se guarda en
        // categoriasExpandidas (memoria, por catId) para que sobreviva a los re-renders que
        // disparan otras acciones (activar/desactivar plato, subir/bajar orden), y así no se
        // vuelva a cerrar la categoría en la que se está trabajando.
        const catKey = String(cat.id);
        const expandida = categoriasExpandidas[catKey] === true;

        h += `<div class="categoria-tarjeta">
            <div class="categoria-titulo categoria-titulo-clicable" onclick="toggleCategoria('${catKey}')">
                <span class="categoria-flecha" id="categoria-flecha-${catKey}">${expandida ? '▼' : '▶'}</span>
                ${cat.name}
                <span class="categoria-contador">${platos.length}</span>
            </div>
            <div class="categoria-contenido${expandida ? ' expandida' : ''}" id="categoria-contenido-${catKey}">`;
        platos.forEach((p) => {
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
        h += `</div></div>`;
    });
    
    const editorDinamico = document.getElementById('editor-dinamico');
    if(editorDinamico) editorDinamico.innerHTML = h;
}

// NUEVO: estado en memoria de qué categorías están desplegadas, por catId. Vacío al cargar
// la página = todas colapsadas de inicio, tal como se pidió.
const categoriasExpandidas = {};

function toggleCategoria(catKey) {
    categoriasExpandidas[catKey] = !categoriasExpandidas[catKey];
    const contenido = document.getElementById('categoria-contenido-' + catKey);
    const flecha = document.getElementById('categoria-flecha-' + catKey);
    if (contenido) contenido.classList.toggle('expandida', categoriasExpandidas[catKey]);
    if (flecha) flecha.innerText = categoriasExpandidas[catKey] ? '▼' : '▶';
}
window.toggleCategoria = toggleCategoria;

function moverPlato(id, direccion) {
    const idx = datosLocales.findIndex(x => x.id === id);
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
        window.IDIOMAS_ORDEN.forEach(l => {
            if (l === 'es' || l === 'en') return;
            const dataLang = desglosarNombre(p[l] || "");
            const labelIdioma = window.IDIOMAS_CONFIG ? (window.IDIOMAS_CONFIG[l.toUpperCase()] || l.toUpperCase()) : l.toUpperCase();
            
            htmlRestoLangs += `
                <div class="input-row-lang">
                    <div class="lang-tag">${l.toUpperCase()}</div>
                    <div style="flex:1">
                        <input id="edit-${l}" class="input-estandar input-nombre-corto" placeholder="Nombre en ${labelIdioma}" value="${esVino ? formatWineName(dataLang.nombre) : dataLang.nombre}">
                        <input id="edit-${l}-uvas" class="input-estandar input-uvas" placeholder="Detalles / Grapes (${labelIdioma})" value="${dataLang.uvas}" style="display: ${esVino ? 'block' : 'none'}">
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
        const actuales = (p.alergenos || "").split(',').map(s => s.trim().toUpperCase()).filter(a => a.length > 0).map(a => a.split(" ").pop());
        let alergenosHtml = "";
        if (esVino) {
            const sel = actuales.includes("SULFITOS") || actuales.includes("SULFITO");
            alergenosHtml = `<div class="alergeno-btn ${sel ? 'selected' : ''}">🧪 SULFITOS</div>`;
        } else {
            alergenosHtml = ALERGENOS_LISTA.map(a => {
                const sel = actuales.some(act => act.includes(a.split(" ").pop()));
                return `<div class="alergeno-btn ${sel ? 'selected' : ''}">${a}</div>`;
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
                    croquetasHtml += `<div class="croqueta-btn carne" onclick="this.classList.toggle('selected'); actualizarNombreCroquetas()"> ${c}</div>`;
                });
                croquetasHtml += `</div></div>`;
            }
            croquetasHtml += `<div class="croqueta-category"><div class="croqueta-cat-title vegetariana">Vegetarianas</div><div class="croqueta-cat-btns">`;
            CROQUETAS_CONFIG.vegetariana.forEach(c => {
                croquetasHtml += `<div class="croqueta-btn vegetariana" onclick="this.classList.toggle('selected'); actualizarNombreCroquetas()"> ${c}</div>`;
            });
            croquetasHtml += `</div></div></div></div>`;
        }
        containerCroquetas.innerHTML = croquetasHtml;
        
        // MODIFICADO: Pre-selección segura de sabores si el plato ya existe
        if (esCroqueta && p['es']) {
            const todosSabores = [...CROQUETAS_CONFIG.carne, ...CROQUETAS_CONFIG.vegetariana];
            todosSabores.forEach(sabor => {
                if (p['es'].includes(sabor)) {
                    const btns = document.querySelectorAll('.croqueta-btn');
                    btns.forEach(btn => { if (btn.innerText.trim() === sabor) btn.classList.add('selected'); });
                }
            });
        }
    }
    
    // NUEVO: Llamada independiente a la función de requisitos
    comprobarRequisitosTraduccion();

    // CORREGIDO: faltaba mostrar el modal — antes se rellenaban los campos
    // pero el editor se quedaba oculto (display:none por CSS), así que tanto
    // la rueda de un plato existente como "Añadir Nuevo Plato" no hacían nada visible.
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
    const textoCroquetas = seleccionadas.map(sabor => `${cantidad} ${sabor}`).join(' - '); 
    const titulo = esCroquetaVeg ? "Croquetas Vegetarianas:" : "Surtido de Croquetas:";

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
     
    if (!nombreEs) { alert("❌ Debes introducir primero el nombre en Español."); return; }

    let keys = []; 
    if (typeof getKeys === 'function') keys = getKeys(); 
    if (keys.length === 0) { alert("❌ No hay API Keys de Gemini configuradas."); return; }
    
    const btn = document.getElementById('btn-generar-en'); 
    const originalText = btn.innerText; 
    btn.innerText = "🇬🇧 Generando opciones..."; 
    btn.disabled = true; 

    const textoCompletoEs = (nombreEs + (uvasEs ? ' // ' + uvasEs : '')).replace(/"/g, "'");
    // Prompt centralizado en prompts.js (window.PROMPTS.opcionesEN)
    const instruccion = window.PROMPTS.opcionesEN(textoCompletoEs, esVino);
    
    let exito = false; 
    let intentos = 0; 
    let ultimoError = ""; 
    let opciones = {};
    
    while (!exito && intentos < keys.length) { 
        try { 
            const apiKey = keys[intentos]; 
            const response = await fetch(`${GEMINI_ENDPOINT_URL}?key=${apiKey}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }], generationConfig: { maxOutputTokens: window.GEMINI_MAX_OUTPUT_TOKENS || 65536 } })
            }); 
            
            const data = await response.json(); 
            
            if (!response.ok || data.error) { 
                ultimoError = data.error?.message || "Error HTTP " + response.status; 
                if (data.error?.code === 429 || response.status === 429) await new Promise(r => setTimeout(r, 3000));
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
            } 
        } catch(err) { 
            ultimoError = err.message; 
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
    const mapaOpciones = { directa: "Directa / Literal", gastronomica: "Gastronómica / Elegante", corta: "Corta / Menú" };
    let index = 0;
    for (const [key, value] of Object.entries(opciones)) {
        if (value) {
            opcionesENActuales.push(value);
            html += `<div class="opcion-en-btn" onclick="seleccionarOpcionEN(this, ${index})"><span class="opcion-en-label">${mapaOpciones[key] || key}</span>${value}</div>`;
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
    if (!textoFinal) { alert("❌ Selecciona una opción o escribe la traducción antes de confirmar."); return; } 
    const desglosado = desglosarNombre(textoFinal); 
    const esVino = (platoEditandoId >= 13000); 
    const editEn = document.getElementById('edit-en'); 
    if (editEn) editEn.value = esVino ? formatWineName(desglosado.nombre) : desglosado.nombre; 
    
    const inputEnUva = document.getElementById('edit-en-uvas');
    if (inputEnUva && inputEnUva.style.display !== "none") { 
        inputEnUva.value = desglosado.uvas;
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
    if (typeof getKeys === 'function') keys = getKeys(); 
    if (keys.length === 0) { alert("❌ No hay API Keys de Gemini configuradas."); btn.innerText = originalText; btn.disabled = false; return; } 
    
    const textoCompletoEs = (nombreEs + (uvasEs ? ' // ' + uvasEs : '')).replace(/"/g, "'");
    const textoCompletoEn = (nombreEn + (uvasEn ? ' // ' + uvasEn : '')).replace(/"/g, "'");
    const idiomasObjetivo = window.IDIOMAS_ORDEN ? window.IDIOMAS_ORDEN.filter(l => l !== 'es' && l !== 'en').map(l => l.toUpperCase()) : [];
    
    // Prompt centralizado en prompts.js (window.PROMPTS.autoTraduccionResto)
    const instruccion = window.PROMPTS.autoTraduccionResto(textoCompletoEs, textoCompletoEn, esVino, idiomasObjetivo);
    
    let exito = false; 
    let intentos = 0; 
    let ultimoError = ""; 
    
    while (!exito && intentos < keys.length) { 
        try { 
            const apiKey = keys[intentos]; 
            const response = await fetch(`${GEMINI_ENDPOINT_URL}?key=${apiKey}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }], generationConfig: { maxOutputTokens: window.GEMINI_MAX_OUTPUT_TOKENS || 65536 } })
            }); 
            
            const data = await response.json(); 
            
            if (!response.ok || data.error) { 
                ultimoError = data.error?.message || "Error HTTP " + response.status; 
                if (data.error?.code === 429 || response.status === 429) await new Promise(r => setTimeout(r, 3000));
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
                        const inputField = document.getElementById(`edit-${l.toLowerCase()}`); 
                        if (inputField) inputField.value = finalName; 
                        
                        const inputUva = document.getElementById(`edit-${l.toLowerCase()}-uvas`); 
                        if (inputUva && inputUva.style.display !== "none") { 
                            inputUva.value = desglosado.uvas; 
                        } 
                    } 
                }); 
                exito = true; 
            } 
        } catch(err) { 
            ultimoError = err.message; 
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
    
    if (esNuevoPlato) datosLocales.push(p);
    
    const esVino = (platoEditandoId >= 13000);

    if (window.IDIOMAS_ORDEN) {
        window.IDIOMAS_ORDEN.forEach(l => {
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
        let rawText = el.innerText.trim().toUpperCase();
        let spaceIdx = rawText.indexOf(' ');
        return spaceIdx !== -1 ? rawText.substring(spaceIdx + 1).trim() : rawText;
    }).join(', ');
    
    window.hayCambiosSinGuardar = true;
    cerrarModal('modal-editor');
    renderizar();
}

function generarMenuAgrupado() { 
    const estructuraActual = getEstructuraActual(); 
    if (!estructuraActual) return;
    
    let h = "";
    estructuraActual.forEach(cat => {
        h += `<div style="margin-bottom:10px;"><div style="background:#eee;padding:5px;font-size:0.7rem;font-weight:bold;text-transform:uppercase;">${cat.name}</div>`;
        if (cat.sub) { 
            cat.sub.forEach(s => { 
                h += `<button onclick="prepararNuevoPlato(${s.id}, '${s.folder}')" style="width:100%;text-align:left;padding:10px;background:white;border:1px solid #ddd;font-family:'Montserrat',sans-serif;cursor:pointer;">➕ ${s.name}</button>`;
            }); 
        } else { 
            h += `<button onclick="prepararNuevoPlato(${cat.id}, '${cat.folder}')" style="width:100%;text-align:left;padding:10px;background:white;border:1px solid #ddd;font-family:'Montserrat',sans-serif;cursor:pointer;">➕ ${cat.name}</button>`;
        } 
        h += `</div>`;
    }); 
    
    const listaAgrupada = document.getElementById('lista-agrupada'); 
    if (listaAgrupada) listaAgrupada.innerHTML = h;
} 

function prepararNuevoPlato(baseId, folder) { 
    const estructuraActual = getEstructuraActual(); 
    if (!estructuraActual) return; 
    
    let maxPermitido = baseId + 99; 
    estructuraActual.forEach(cat => { 
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
    
    if (baseId >= 12200 && baseId <= 12299) datosTempNuevo.imagen = "croquetasvegetarianas01.webp"; 
    else if (baseId >= 12100 && baseId <= 12199) datosTempNuevo.imagen = "croquetas01.webp"; 
    
    if (window.IDIOMAS_ORDEN) { 
        window.IDIOMAS_ORDEN.forEach(l => { datosTempNuevo[l] = ""; }); 
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
    
    const modo = window.currentMode || 'restaurante001';
    console.log(`[Editor] Guardando cambios para ${modo}...`);
    
    datosLocales.sort((a, b) => a.id - b.id);
    
    window.optimisticState[modo] = { t: Date.now(), s: JSON.parse(JSON.stringify(datosLocales)) };
    window.lastSaveAttempt = Date.now();
    sessionStorage.setItem('optState_' + modo, JSON.stringify(window.optimisticState[modo]));
    
    const payload = datosLocales.map(p => {
        let obj = { id: p.id, precio: p.precio, activa: p.activa ? 'si' : 'no', carpeta: p.carpeta, imagen: p.imagen, alergenos: p.alergenos };
        if (window.IDIOMAS_ORDEN) {
            window.IDIOMAS_ORDEN.forEach(l => { obj[`nombre_${l}`] = p[l] || ""; });
        }
        return obj;
    }).filter(x => !isNaN(x.id) && x.id > 0);

    try {
        const urlDestino = getWebAppUrlSafe();
        const response = await fetch(urlDestino, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) 
        });
        
        if (response.type === 'opaque') {
            console.warn("[Editor] Modo 'no-cors' activo: No se puede confirmar la respuesta del servidor.");
        }
        
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

function eliminarKeySeleccionada() { 
    const selectEl = document.getElementById('selectKeys'); 
    if (selectEl && selectEl.value) { 
        deleteKey(selectEl.value); 
        if (typeof UI !== 'undefined' && typeof UI.actualizarListaKeys === 'function') { 
            UI.actualizarListaKeys(); 
            UI.log("[OK] API Key eliminada del almacenamiento local.");
        }
    } else { 
        alert("No hay ninguna Key seleccionada para eliminar."); 
    } 
}

// Auto-invocación inicial
cargar();
