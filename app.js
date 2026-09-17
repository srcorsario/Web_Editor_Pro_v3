// --- app.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.app = '2.11.0'; // NUEVO: consola de Info automática dentro del modal de plato (#consola-info-plato, debajo de Alérgenos) con historial por plato (window.logsInfoPorPlato) + reintento automático x2 de la traducción a otros idiomas + aviso "⚠️ faltan otros idiomas" con botón de reintento manual en la ficha del plato

console.group("%c[Editor] Inicializando sistema de control...", "color: orange; font-weight: bold;");

window.hayCambiosSinGuardar = false;

// NUEVO: estado en memoria de qué pestañas (categorías de nivel superior) están desactivadas
// en la web pública, por restaurante. Se guarda como Set de pestanaId (ver estructuras.js).
// Se carga desde la hoja "Categorias" del backend (cargarEstadoCategorias) al hacer cargar();
// una pestaña ausente de este Set se considera ACTIVA por defecto.
const categoriasDeshabilitadas = { restaurante001: new Set(), restaurante002: new Set() };

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
// NUEVO: estado del modo "Plato con ingredientes" (checkbox #chk-modo-ingredientes) — ver
// abrirEditor(), toggleModoIngredientes() y aplicarCambiosPlato(). modoIngredientesActivo
// indica si el plato que se está editando ahora mismo usa la lista editable de
// opciones/ingredientes en vez del campo de detalle simple (edit-es-uvas/edit-en-uvas).
// ingredientesPlatoActual es esa lista de trabajo: [{ es, en, activo }, ...], en el mismo
// orden/posición que espera Opciones_Inactivas (compartida por todos los idiomas).
let modoIngredientesActivo = false;
let ingredientesPlatoActual = [];

// NUEVO: generación automática de "Info" (descripción + preguntas/respuestas) al crear/editar
// un plato — ver aplicarCambiosPlato(), generarInfoAutomaticaPlato() y enviarAlExcel() más
// abajo. platosPendientesInfoAlGuardar guarda los IDs de platos NUEVOS cuya Info todavía no se
// puede generar (su fila no existe aún en la hoja) hasta que se pulse "GUARDAR CAMBIOS EN WEB".
// window.platosGenerandoInfo es el Set de IDs con una generación en curso AHORA MISMO, usado
// solo para pintar el aviso "🤖 generando…" en renderPlatoItemHtml().
let platosPendientesInfoAlGuardar = [];
window.platosGenerandoInfo = window.platosGenerandoInfo || new Set();

// NUEVO: IDs de platos a los que se les generó bien la Info ES/EN pero falló la traducción
// automática al resto de idiomas (Paso B, ver generarInfoOtrosIdiomasPlato() más abajo). El
// aviso de ese fallo antes solo se veía con UI.log(), que escribe en la consola de "Ajustes
// Expertos" — invisible mientras se está en la pestaña normal del Editor, que es donde
// realmente se crea/edita el plato. Este Set se usa para pintar un aviso "⚠️ faltan otros
// idiomas" con botón de reintento directamente en la ficha del plato (renderPlatoItemHtml).
window.platosInfoOtrosIdiomasFallidos = window.platosInfoOtrosIdiomasFallidos || new Set();

// CORREGIDO: esta constante faltaba por completo (no estaba definida en ningún
// archivo), lo que hacía que abrirEditor() lanzara "ALERGENOS_LISTA is not
// defined" y se detuviera a mitad de camino — por eso el modal nunca llegaba
// a mostrarse ni con la rueda ⚙️ ni al crear un plato nuevo. Los nombres
// coinciden exactamente con los que ya usas en la columna Alergenos_Cod y con
// los 16 iconos que ya tienes en imagenes/alergenos/.
// MODIFICADO: antes era "EMOJI NOMBRE" (p.ej. "🌾 GLUTEN") — ahora que abrirEditor() pinta
// cada botón con el icono real de imagenes/alergenos/<CODIGO>.webp (el mismo que usa la web
// pública) en vez de un emoji, la lista pasa a ser solo los códigos.
const ALERGENOS_LISTA = [
    "GLUTEN",
    "CRUSTACEO",
    "HUEVO",
    "PESCADO",
    "CACAHUETE",
    "SOJA",
    "LACTOSA",
    "FRUTOSCASCARA",
    "APIO",
    "MOSTAZA",
    "SESAMO",
    "SULFITOS",
    "ALTRAMUCES",
    "MOLUSCO",
    "VEGETARIANO",
    "VEGANO"
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

// NUEVO: lee el estado activa/inactiva de las pestañas (hoja "Categorias" del backend, ver
// Código.gs) para el modo indicado. Usa el endpoint EN VIVO (Apps Script, no el CSV publicado
// y cacheado) porque esta hoja es nueva y no tiene ruta de "publicar en la web" propia. Si
// falla, se deja el Set tal cual estaba (todas activas por defecto la primera vez) — no debe
// romper la carga normal de platos.
async function cargarEstadoCategorias(modo) {
    try {
        const url = (typeof window.getWebAppUrl === 'function') ? window.getWebAppUrl(modo) : '';
        if (!url) return;
        const resp = await fetch(url + '?accion=categorias&zx=' + Date.now(), { cache: "no-store" });
        const text = await resp.text();
        const filas = text.split(/\r?\n/).filter(f => f.trim() !== "");
        const deshabilitadas = new Set();
        filas.forEach((f, i) => {
            if (i === 0) return; // cabecera "ID,Activa"
            const c = f.split(',');
            const id = (c[0] || '').trim();
            const activa = (c[1] || '').trim().toUpperCase();
            if (id && activa === 'NO') deshabilitadas.add(id);
        });
        categoriasDeshabilitadas[modo] = deshabilitadas;
    } catch (e) {
        console.warn(`[Editor] No se pudo leer el estado de pestañas (${modo}):`, e.message);
    }
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

        // NUEVO: a diferencia de las columnas NOMBRE_* (posición fija, ver IDIOMAS_CSV_INDICES
        // en languages.js), las columnas INFO_* son dinámicas — Código.gs solo las crea a
        // medida que hacen falta, así que su posición varía. Se localizan por NOMBRE leyendo la
        // fila de cabeceras (fila 0), igual que ya hace el "Ajustes Expertos" (stateContainer)
        // con su propio CSV. Solo se usan para decidir si ya hay Info generada (y su huella de
        // cambio) antes de disparar la generación automática — ver aplicarCambiosPlato().
        const cabecerasCsv = filas.length > 0 ? filas[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => superLimpiar(h)) : [];
        const idxInfoPorIdioma = {};
        if (window.IDIOMAS_ORDEN) {
            window.IDIOMAS_ORDEN.forEach(lang => {
                idxInfoPorIdioma[lang] = cabecerasCsv.findIndex(h => h && h.toUpperCase() === ('INFO_' + lang.toUpperCase()));
            });
        }
        const idxInfoHashFicha = cabecerasCsv.findIndex(h => h && h.toUpperCase() === 'INFO_HASH_FICHA');

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
                    alergenos: superLimpiar(c[6]),
                    // NUEVO: posiciones desactivadas de "Opciones del plato" (ver languages.js).
                    opcionesInactivas: superLimpiar(c[window.IDX_OPCIONES_INACTIVAS] || ""),
                    // NUEVO: Info (descripción + preguntas/respuestas) ya generada, por idioma —
                    // JSON en bruto tal cual viene de la hoja (se parsea solo cuando hace falta).
                    info: {},
                    infoHashFicha: (idxInfoHashFicha !== -1 && c[idxInfoHashFicha] !== undefined) ? superLimpiar(c[idxInfoHashFicha]) : ""
                };

                if (window.IDIOMAS_ORDEN && window.IDIOMAS_CSV_INDICES) {
                    window.IDIOMAS_ORDEN.forEach(lang => {
                        const index = window.IDIOMAS_CSV_INDICES[lang];
                        if (index !== undefined && c[index] !== undefined) {
                            item[lang] = superLimpiar(c[index]);
                        }
                        const idxInfo = idxInfoPorIdioma[lang];
                        item.info[lang] = (idxInfo !== undefined && idxInfo !== -1 && c[idxInfo] !== undefined) ? superLimpiar(c[idxInfo]) : "";
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
        
        // NUEVO: estado de pestañas activas/inactivas, ANTES de renderizar, para que el
        // interruptor de cada cabecera de acordeón nazca ya con el estado real (si esto
        // fallara, cargarEstadoCategorias ya deja el Set tal cual estaba y no bloquea nada).
        await cargarEstadoCategorias(modo);

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

// NUEVO: HTML de una fila de plato, extraído de renderizar() para poder reutilizarlo tanto en
// la lista plana de siempre como dentro del acordeón anidado de subcategorías (ver
// cat.subAcordeon más abajo). Comportamiento idéntico al de antes, solo movido a función.
function renderPlatoItemHtml(p) {
    let htmlImagenPC = p.imagen ? `<span style="margin-right: 5px;">📷</span>` : "";
    let htmlCarpetaPC = p.carpeta ? `<span class="tag-carpeta">${p.carpeta}</span>` : "";
    // NUEVO: además del nombre principal (antes del primer "//"), se muestra también lo que
    // había tras los separadores "//" — la uva/detalle en vinos (id >= 13000), o las opciones
    // (segunda línea de ingredientes/sabores intercambiables) en platos — que antes solo era
    // visible abriendo el editor de cada elemento.
    const esVino = (p.id >= 13000);
    const desglosado = desglosarNombre(p.es);
    const nombreLimpio = desglosado.nombre;
    const detalle = esVino ? desglosado.uvas : desglosado.opciones.join(' // ');
    const htmlDetalle = detalle ? `<span class="plato-detalle">${detalle}</span>` : "";

    // NUEVO: aviso discreto mientras la Info (descripción + preguntas/respuestas) de este plato
    // se está generando/guardando automáticamente en segundo plano — ver
    // generarInfoAutomaticaPlato() (app.js). No bloquea nada, es solo visual.
    const generandoInfo = window.platosGenerandoInfo && window.platosGenerandoInfo.has(p.id);
    const htmlGenerandoInfo = generandoInfo ? `<span class="badge-generando-info" title="Generando la Info (descripción + preguntas/respuestas) con IA en segundo plano...">🤖 generando info…</span>` : "";

    // NUEVO: si la Info ES/EN se generó bien pero falló la traducción automática al resto de
    // idiomas (ver generarInfoOtrosIdiomasPlato()), se avisa aquí mismo con un botón para
    // reintentar SOLO ese paso (no hace falta regenerar ES/EN de nuevo ni tocar nada más).
    const infoOtrosFallido = !generandoInfo && window.platosInfoOtrosIdiomasFallidos && window.platosInfoOtrosIdiomasFallidos.has(p.id);
    const htmlInfoOtrosFallido = infoOtrosFallido ? `<span class="badge-info-otros-fallido" title="La Info se generó en ES/EN, pero falló la traducción automática al resto de idiomas. Pulsa para reintentar solo ese paso.">⚠️ faltan otros idiomas <button type="button" class="btn-reintentar-info-otros" onclick="event.stopPropagation(); reintentarInfoOtrosIdiomasPlato(${p.id});">🔄 reintentar</button></span>` : "";

    return `<div class="plato-item">
        <div class="plato-orden-btns">
            <button class="btn-orden" onclick="moverPlato(${p.id}, 'subir')">▲</button>
            <button class="btn-orden" onclick="moverPlato(${p.id}, 'bajar')">▼</button>
        </div>
        <div class="plato-info">
            <span class="plato-nombre">${nombreLimpio}</span>
            ${htmlDetalle}
            ${htmlGenerandoInfo}
            ${htmlInfoOtrosFallido}
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
}

function renderizar() {
    let h = "";
    datosLocales.sort((a, b) => a.id - b.id);
    const estructuraActual = getEstructuraActual();
    if (!estructuraActual) return;

    // NUEVO: modo actual, para poder consultar categoriasDeshabilitadas[modo] al pintar el
    // interruptor de cada pestaña.
    const modoActual = window.currentMode || 'restaurante001';

    // NUEVO: barra "Ajustes generales" (interruptores de fotos/info para TODA la web del
    // restaurante actual, no por categoría). Usa el mismo mecanismo que las pestañas —misma
    // hoja "Categorias", misma función toggleCategoriaPestana()— solo que con un id fijo
    // ("fotos" / "info") en vez de cat.pestanaId. Se repinta en cada renderizar() para que
    // refleje siempre el restaurante activo al cambiar de pestaña del editor.
    const ajustesBar = document.getElementById('ajustes-generales-bar');
    if (ajustesBar) {
        const fotosActivas = !categoriasDeshabilitadas[modoActual].has('fotos');
        const infoActiva = !categoriasDeshabilitadas[modoActual].has('info');
        ajustesBar.innerHTML = `
            <span class="ajustes-generales-titulo">Ajustes generales de la web:</span>
            <div class="ajustes-generales-item">
                <label class="switch-container" title="Mostrar/ocultar el icono de fotos (galería) en toda la web">
                    <input type="checkbox" ${fotosActivas ? 'checked' : ''} onchange="toggleCategoriaPestana('fotos', this.checked, this)">
                    <span class="slider-switch"></span>
                </label>
                <span class="ajustes-generales-label">📸 Fotos</span>
            </div>
            <div class="ajustes-generales-item">
                <label class="switch-container" title="Mostrar/ocultar el icono de info en toda la web">
                    <input type="checkbox" ${infoActiva ? 'checked' : ''} onchange="toggleCategoriaPestana('info', this.checked, this)">
                    <span class="slider-switch"></span>
                </label>
                <span class="ajustes-generales-label">ℹ️ Info</span>
            </div>`;
    }

    estructuraActual.forEach(cat => {
        const platos = datosLocales.filter(p => p.id >= cat.id && p.id <= (cat.id + cat.rango));
        // NUEVO (8 septiembre): "cat.sinPlatos" -- categorías que a propósito no tienen (ni
        // tendrán) platos reales, como "Alérgenos e Intolerancias" (página de contenido fijo en
        // la web pública, ver estructuras.js). Sin este flag, la línea de abajo las ocultaría
        // del acordeón por no tener ningún plato, y su interruptor de activar/desactivar sería
        // imposible de encontrar.
        if (platos.length === 0 && !cat.sinPlatos) return;

        // NUEVO: efecto acordeón — cada categoría empieza compactada (colapsada) y se
        // despliega al pulsar su título. El estado expandido/colapsado se guarda en
        // categoriasExpandidas (memoria, por catId) para que sobreviva a los re-renders que
        // disparan otras acciones (activar/desactivar plato, subir/bajar orden), y así no se
        // vuelva a cerrar la categoría en la que se está trabajando.
        const catKey = String(cat.id);
        const expandida = categoriasExpandidas[catKey] === true;

        // NUEVO: interruptor de "mostrar/ocultar esta pestaña en la web pública", en la misma
        // línea del título del acordeón (visible aunque esté colapsado). Solo se pinta si la
        // categoría tiene pestanaId (ver estructuras.js) — algunas, como "Guarniciones" en
        // Roland Garros, no tienen pestaña propia en la web pública y no llevan interruptor.
        // El stopPropagation en el <label> evita que pulsar el interruptor también
        // abra/cierre el acordeón (el título entero tiene su propio onclick).
        let htmlSwitchPestana = "";
        if (cat.pestanaId) {
            const pestanaActiva = !categoriasDeshabilitadas[modoActual].has(cat.pestanaId);
            htmlSwitchPestana = `
                <label class="switch-container switch-pestana" onclick="event.stopPropagation()" title="Mostrar/ocultar esta sección en la web">
                    <input type="checkbox" ${pestanaActiva ? 'checked' : ''} onchange="toggleCategoriaPestana('${cat.pestanaId}', this.checked, this)">
                    <span class="slider-switch"></span>
                </label>`;
        }

        // NUEVO: contador "activos/total" (antes solo mostraba el total) — así se ve de un
        // vistazo cuántos de los platos de la categoría están realmente encendidos en la web.
        const activosCat = platos.filter(p => p.activa).length;

        // NUEVO: el contador "activos/total" no tiene sentido en una categoría "sinPlatos" sin
        // ningún plato real (siempre sería "0/0") -- se omite en ese caso.
        const htmlContador = (platos.length > 0 || !cat.sinPlatos) ? `<span class="categoria-contador">${activosCat}/${platos.length}</span>` : "";

        h += `<div class="categoria-tarjeta">
            <div class="categoria-titulo categoria-titulo-clicable" onclick="toggleCategoria('${catKey}')">
                <span class="categoria-flecha" id="categoria-flecha-${catKey}">${expandida ? '▼' : '▶'}</span>
                ${cat.name}
                ${htmlContador}
                ${htmlSwitchPestana}
            </div>
            <div class="categoria-contenido${expandida ? ' expandida' : ''}" id="categoria-contenido-${catKey}">`;

        // NUEVO: acordeón anidado por subcategoría — solo para las categorías marcadas con
        // subAcordeon:true en estructuras.js (de momento, "Sugerencias" en ambas cartas, que
        // ya acumula muchos platos y se beneficia de agruparlos por tipo). El resto de
        // categorías sigue mostrando la lista plana de siempre, sin cambios.
        if (cat.subAcordeon && cat.sub && cat.sub.length > 0) {
            // Mismo criterio de rango que prepararNuevoPlato(): cada subcategoría cubre desde
            // su id hasta su "max" explícito, o hasta id+99 por defecto si no lo tiene.
            const grupos = cat.sub.map(s => ({
                key: String(s.id),
                name: s.name,
                min: s.id,
                max: s.max || (s.id + 99),
                platos: []
            }));
            const otros = [];
            platos.forEach(p => {
                const grupo = grupos.find(g => p.id >= g.min && p.id <= g.max);
                if (grupo) grupo.platos.push(p); else otros.push(p);
            });
            // Por si algún plato queda fuera de todos los rangos definidos (hueco entre
            // subcategorías) — para que nunca desaparezca de la vista, aunque no encaje.
            if (otros.length > 0) grupos.push({ key: 'otros', name: 'Otros', platos: otros });

            grupos.forEach(g => {
                if (g.platos.length === 0) return;
                const subKey = `${catKey}-${g.key}`;
                const subExpandida = subcategoriasExpandidas[subKey] === true;
                const activosSub = g.platos.filter(p => p.activa).length;
                h += `<div class="subcategoria-tarjeta">
                    <div class="subcategoria-titulo subcategoria-titulo-clicable" onclick="toggleSubcategoria('${subKey}')">
                        <span class="subcategoria-flecha" id="subcategoria-flecha-${subKey}">${subExpandida ? '▼' : '▶'}</span>
                        ${g.name}
                        <span class="subcategoria-contador">${activosSub}/${g.platos.length}</span>
                    </div>
                    <div class="subcategoria-contenido${subExpandida ? ' expandida' : ''}" id="subcategoria-contenido-${subKey}">`;
                g.platos.forEach(p => { h += renderPlatoItemHtml(p); });
                h += `</div></div>`;
            });
        } else if (platos.length === 0 && cat.sinPlatos) {
            // NUEVO: mensaje explicativo en vez de una lista vacía -- esta categoría es a
            // propósito "sinPlatos" (página de contenido fijo en la web pública, ver
            // estructuras.js), así que no hay nada que listar aquí, solo el interruptor de
            // activar/desactivar de arriba.
            h += `<p style="padding: 12px 6px; color: #7f8c8d; font-size: 0.85rem;">Esta sección no tiene platos que gestionar: es una página de contenido fijo en la web pública. Usa el interruptor de arriba para mostrarla u ocultarla.</p>`;
        } else {
            platos.forEach(p => { h += renderPlatoItemHtml(p); });
        }

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

// NUEVO: mismo mecanismo que categoriasExpandidas/toggleCategoria pero para el segundo nivel
// del acordeón (subcategorías dentro de una categoría con subAcordeon:true, ver renderizar()).
// Clave compuesta "<catId>-<subId>" para no chocar entre categorías distintas.
const subcategoriasExpandidas = {};

function toggleSubcategoria(subKey) {
    subcategoriasExpandidas[subKey] = !subcategoriasExpandidas[subKey];
    const contenido = document.getElementById('subcategoria-contenido-' + subKey);
    const flecha = document.getElementById('subcategoria-flecha-' + subKey);
    if (contenido) contenido.classList.toggle('expandida', subcategoriasExpandidas[subKey]);
    if (flecha) flecha.innerText = subcategoriasExpandidas[subKey] ? '▼' : '▶';
}
window.toggleSubcategoria = toggleSubcategoria;

// NUEVO: activa/desactiva un "flag" en la hoja "Categorias" (una pestaña completa, o uno de
// los ajustes generales "fotos"/"info" — mismo mecanismo, solo cambia el id). A diferencia del interruptor
// "Activa" de cada plato (que solo se guarda al pulsar el botón grande "Guardar"), este se
// guarda AL INSTANTE — es una hoja aparte ("Categorias") y no tiene nada que ver con el resto
// de cambios pendientes de datosLocales, así que no tiene sentido hacerlo esperar al guardado
// general. Optimista: cambia el estado en memoria ya, y si el guardado fallara, revierte el
// interruptor visualmente y avisa.
async function toggleCategoriaPestana(pestanaId, activa, checkboxEl) {
    const modo = window.currentMode || 'restaurante001';

    if (activa) categoriasDeshabilitadas[modo].delete(pestanaId);
    else categoriasDeshabilitadas[modo].add(pestanaId);

    try {
        const url = getWebAppUrlSafe();
        if (!url) throw new Error('Sin URL de Apps Script configurada.');

        await fetch(url + '?accion=categorias', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: pestanaId, activa: activa })
        });

        if (typeof UI !== 'undefined' && typeof UI.log === 'function') {
            UI.log(`[Pestañas] "${pestanaId}" ${activa ? 'activada' : 'desactivada'} en ${getModoAlias(modo)}.`);
        }
    } catch (e) {
        console.error('[Editor] Error al guardar el estado de la pestaña:', e);
        alert('No se pudo guardar el cambio de esta pestaña. Revisa la conexión e inténtalo de nuevo.');

        // Revertir: tanto el estado en memoria como el interruptor visual
        if (activa) categoriasDeshabilitadas[modo].add(pestanaId);
        else categoriasDeshabilitadas[modo].delete(pestanaId);
        if (checkboxEl) checkboxEl.checked = !activa;
    }
}
window.toggleCategoriaPestana = toggleCategoriaPestana;

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

// CORREGIDO (heredado de copiar la plantilla de Roland Garros a US Open): el rango de IDs
// 12100-12299 solo significa "Croquetas"/"Croquetas Veg." en Roland Garros — en US Open esos
// mismos IDs son "Entrantes"/"Ensaladas" (ver estructuras.js, sub de "Sugerencias" en cada
// carta). Antes esCroqueta/esCroquetaVeg miraban solo el ID sin comprobar el restaurante activo,
// así que crear un plato en Entrantes o Ensaladas de US Open activaba por error la rueda de
// "Sabores de Croquetas" y precargaba la imagen de croquetas. Centralizado aquí para no repetir
// el chequeo de currentMode en los 4 sitios que lo necesitan (abrirEditor,
// actualizarNombreCroquetas, prepararNuevoPlato).
function esRangoCroquetasRG(id) {
    const modo = window.currentMode || 'restaurante001';
    return modo === 'restaurante001' && id >= 12100 && id <= 12299;
}

function abrirEditor(id, esNuevo = false) {
    let p = esNuevo ? datosTempNuevo : datosLocales.find(x => x.id === id);
    if (!p) return;

    esNuevoPlato = esNuevo;
    platoEditandoId = id;
    const esVino = (id >= 13000);
    const esCroqueta = esRangoCroquetasRG(id);
    const esCroquetaVeg = esCroqueta && id >= 12200;
    
    // MODIFICADO: el campo de "detalle" (antes solo visible para vinos, la variedad de uva)
    // ahora se muestra también en platos normales — es la "segunda línea" de siempre, pero
    // ahora editable como texto libre en vez de quedar fija con lo que trajera la hoja (antes
    // aplicarCambiosPlato() la conservaba intacta pasara lo que pasara aquí). Para platos con
    // VARIAS opciones intercambiables (Mix de Gyozas...) está además el modo "Plato con
    // ingredientes" de más abajo, que sustituye este campo simple por una lista editable.
    const labelUvas = document.getElementById('label-uvas');
    if (labelUvas) labelUvas.innerText = esVino ? "Nombres y Detalles del Plato / Vino (Uvas)" : "Nombres y Detalles del Plato";

    const dataEs = desglosarNombre(p['es'] || "");
    const editEs = document.getElementById('edit-es');
    if (editEs) editEs.value = esVino ? formatWineName(dataEs.nombre) : dataEs.nombre;

    const dataEn = desglosarNombre(p['en'] || "");
    const editEn = document.getElementById('edit-en');
    if (editEn) editEn.value = esVino ? formatWineName(dataEn.nombre) : dataEn.nombre;

    // NUEVO: modo "Plato con ingredientes" — arranca activado solo si el plato YA tenía más
    // de una opción detectada entre "//.../ /" (p.ej. importado de la hoja con varias ya
    // escritas a mano); con 0 o 1 opción arranca en modo simple (el caso normal), pero el
    // usuario puede marcar la casilla en cualquier momento, tanto para uno ya existente como
    // al crear uno nuevo. No se ofrece ni para vinos (tienen su propio campo de uva) ni para
    // croquetas (tienen su propio selector de sabores dedicado, ver contenedor-croquetas).
    modoIngredientesActivo = !esVino && !esCroqueta && (dataEs.opciones || []).length > 1;
    ingredientesPlatoActual = construirListaIngredientes(dataEs.opciones || [], dataEn.opciones || [], p.opcionesInactivas || "");

    const contenedorToggleIngredientes = document.getElementById('contenedor-toggle-ingredientes');
    if (contenedorToggleIngredientes) contenedorToggleIngredientes.style.display = (!esVino && !esCroqueta) ? "" : "none";
    const chkModoIngredientes = document.getElementById('chk-modo-ingredientes');
    if (chkModoIngredientes) chkModoIngredientes.checked = modoIngredientesActivo;

    aplicarVisibilidadModoIngredientes(dataEs.uvas, dataEn.uvas);

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
                        <input id="edit-${l}-uvas" class="input-estandar input-uvas" placeholder="Detalle / Detail (${labelIdioma})" value="${dataLang.uvas}" style="display: ${modoIngredientesActivo ? 'none' : 'block'}">
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
        // MODIFICADO: en vez de un emoji, cada botón pinta el icono real de
        // imagenes/alergenos/<CODIGO>.webp (el mismo que usa la web pública), para
        // reconocerlo de un vistazo al activar/desactivar. El código para guardar ya no se
        // lee del texto del botón — va en data-code (ver aplicarCambiosPlato()).
        const botonAlergeno = (codigo, sel) => `<div class="alergeno-btn ${sel ? 'selected' : ''}" data-code="${codigo}" onclick="this.classList.toggle('selected')"><img src="${PATH_ALERGENOS}${codigo}.webp" alt="" loading="lazy" onerror="this.style.display='none'"><span>${codigo}</span></div>`;
        let alergenosHtml = "";
        if (esVino) {
            const sel = actuales.includes("SULFITOS") || actuales.includes("SULFITO");
            alergenosHtml = botonAlergeno("SULFITOS", sel);
        } else {
            alergenosHtml = ALERGENOS_LISTA.map(codigo => {
                const sel = actuales.some(act => act.includes(codigo));
                return botonAlergeno(codigo, sel);
            }).join('');
        }
        alergenosGrid.innerHTML = alergenosHtml;
    }

    // NUEVO: repinta la consola de Info automática (ver logInfoAutomatica() más abajo) con el
    // historial de ESTE plato — así, si la generación se disparó/siguió en segundo plano tras
    // cerrar el editor la última vez, al reabrirlo se ve igualmente qué pasó (éxito o error).
    // Un plato recién creado (esNuevo) no tiene historial todavía: queda vacío (ver placeholder
    // por CSS en .consola-info-automatica:empty).
    renderConsolaInfoPlato(id);

    // La rueda de solo activar/desactivar de antes se sustituyó por la lista editable de
    // ingredientes — ver aplicarVisibilidadModoIngredientes()/renderIngredientesPlato() más
    // arriba, ya invocada para este plato.

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

    // NUEVO: el botón "Eliminar Plato" solo tiene sentido para un plato que ya existe —
    // al crear uno nuevo ("Añadir Nuevo Plato") todavía no hay nada que borrar.
    const btnEliminar = document.getElementById('btn-eliminar-plato');
    if (btnEliminar) btnEliminar.style.display = esNuevo ? 'none' : '';

    // CORREGIDO: faltaba mostrar el modal — antes se rellenaban los campos
    // pero el editor se quedaba oculto (display:none por CSS), así que tanto
    // la rueda de un plato existente como "Añadir Nuevo Plato" no hacían nada visible.
    const modalEditor = document.getElementById('modal-editor');
    if (modalEditor) modalEditor.style.display = 'block';
}

// NUEVO: construye la lista de trabajo de "ingredientes/opciones" a partir de los arrays ya
// separados de ES y EN (ver desglosarNombre en utils.js) y de las posiciones desactivadas
// guardadas. Si ES y EN tienen distinto número de opciones (traducción desincronizada — ver
// ui-batch-auditoria-separadores.js, que existe justo para detectar esto) se usa el mayor de
// los dos y se deja vacío el lado que falte; renderIngredientesPlato() resalta esa fila para
// que se note a simple vista que le falta la traducción.
function construirListaIngredientes(opcionesEs, opcionesEn, opcionesInactivasStr) {
    const inactivas = (opcionesInactivasStr || "").split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    const total = Math.max(opcionesEs.length, opcionesEn.length);
    const lista = [];
    for (let i = 0; i < total; i++) {
        lista.push({
            es: opcionesEs[i] || "",
            en: opcionesEn[i] || "",
            activo: !inactivas.includes(i + 1)
        });
    }
    return lista;
}

// NUEVO: casilla "Plato con ingredientes" (onchange en index.html) — alterna entre el campo
// de detalle simple (edit-es-uvas/edit-en-uvas) y la lista editable de opciones.
function toggleModoIngredientes() {
    const chk = document.getElementById('chk-modo-ingredientes');
    modoIngredientesActivo = !!(chk && chk.checked);

    // Al ENCENDER el modo con la lista todavía vacía (plato nuevo, o uno que solo tenía el
    // campo simple relleno), se arranca con lo que hubiera en ese campo como primera opción,
    // para no perder lo ya escrito al cambiar de modo.
    if (modoIngredientesActivo && ingredientesPlatoActual.length === 0) {
        const esActual = superLimpiar(document.getElementById('edit-es-uvas')?.value || "");
        const enActual = superLimpiar(document.getElementById('edit-en-uvas')?.value || "");
        if (esActual || enActual) ingredientesPlatoActual.push({ es: esActual, en: enActual, activo: true });
    }

    aplicarVisibilidadModoIngredientes();
}

// NUEVO: muestra/oculta el campo de detalle simple (ES/EN/resto de idiomas) frente a la
// lista de ingredientes, según el modo actual, y (re)pinta la lista si toca. esUvasInicial /
// enUvasInicial solo se usan la primera vez que se abre el editor, para rellenar el campo
// simple; en repintados posteriores (tras marcar/desmarcar la casilla) no se tocan los
// valores que el usuario ya haya escrito.
function aplicarVisibilidadModoIngredientes(esUvasInicial, enUvasInicial) {
    const inputEsUvas = document.getElementById('edit-es-uvas');
    const inputEnUvas = document.getElementById('edit-en-uvas');
    const contenedorOpciones = document.getElementById('contenedor-opciones-plato');

    if (inputEsUvas) {
        if (esUvasInicial !== undefined) inputEsUvas.value = esUvasInicial;
        inputEsUvas.style.display = modoIngredientesActivo ? "none" : "block";
    }
    if (inputEnUvas) {
        if (enUvasInicial !== undefined) inputEnUvas.value = enUvasInicial;
        inputEnUvas.style.display = modoIngredientesActivo ? "none" : "block";
    }

    // Los campos de detalle del resto de idiomas (generados en abrirEditor(), ver
    // contenedor-resto-idiomas) tampoco tienen sentido en modo ingredientes: ese modo solo
    // gestiona ES/EN a mano; el resto se traduce con el botón "Auto-Traducir" como siempre.
    document.querySelectorAll('.input-uvas[id^="edit-"][id$="-uvas"]').forEach(el => {
        if (el === inputEsUvas || el === inputEnUvas) return;
        el.style.display = modoIngredientesActivo ? "none" : "block";
    });

    if (contenedorOpciones) {
        contenedorOpciones.style.display = modoIngredientesActivo ? "" : "none";
        if (modoIngredientesActivo) renderIngredientesPlato();
    }
}

// NUEVO: pinta la lista editable de ingredientes/opciones (modo "Plato con ingredientes").
// Cada fila tiene texto ES, texto EN, un interruptor activo/inactivo (mismo criterio que la
// rueda de antes: si está inactivo, la web pública no lo muestra) y un botón para eliminar la
// fila entera. "➕ Añadir opción" al final crea una fila vacía nueva.
function renderIngredientesPlato() {
    const contenedor = document.getElementById('contenedor-opciones-plato');
    if (!contenedor) return;

    const filasHtml = ingredientesPlatoActual.map((ing, idx) => `
        <div class="ingrediente-fila">
            <input class="input-estandar input-ingrediente" placeholder="Español (ej: Pato)" value="${(ing.es || "").replace(/"/g, '&quot;')}" oninput="ingredientesPlatoActual[${idx}].es = this.value">
            <input class="input-estandar input-ingrediente ${!ing.en ? 'input-ingrediente-vacio' : ''}" placeholder="Inglés (ej: Duck)" value="${(ing.en || "").replace(/"/g, '&quot;')}" oninput="ingredientesPlatoActual[${idx}].en = this.value">
            <div class="ingrediente-activo-toggle ${ing.activo ? 'selected' : ''}" title="${ing.activo ? 'Visible en la web (clic para ocultar)' : 'Oculto en la web (clic para mostrar)'}" onclick="ingredientesPlatoActual[${idx}].activo = !ingredientesPlatoActual[${idx}].activo; renderIngredientesPlato()">${ing.activo ? '👁️' : '🚫'}</div>
            <button type="button" class="btn-eliminar-ingrediente" title="Eliminar esta opción" onclick="ingredientesPlatoActual.splice(${idx}, 1); renderIngredientesPlato()">🗑️</button>
        </div>`).join('');

    contenedor.innerHTML = `
        <label class="label-seccion">Opciones / Ingredientes del Plato</label>
        <div class="ingredientes-lista">${filasHtml || '<p class="ingredientes-vacio">Todavía no hay opciones — añade la primera abajo.</p>'}</div>
        <button type="button" class="btn-add-ingrediente" onclick="ingredientesPlatoActual.push({es:'', en:'', activo:true}); renderIngredientesPlato()">➕ Añadir opción</button>`;
}

function actualizarNombreCroquetas() {
    // CORREGIDO: mismo problema que en abrirEditor() — sin el chequeo de currentMode dentro de
    // esRangoCroquetasRG(), esto se disparaba también para IDs de Entrantes/Ensaladas en US Open.
    const esCroquetaVeg = esRangoCroquetasRG(platoEditandoId) && platoEditandoId >= 12200;
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

// CORREGIDO: antes estas dos funciones (generarTraduccionEN y ejecutarTraduccionAutomatica,
// más abajo) solo incluían el detalle/opciones del plato al traducir SI ERA VINO
// (uvasEs/uvasEn se forzaban a "" para cualquier plato normal) — así que el detalle escrito a
// mano en modo simple, o las opciones del modo "Plato con ingredientes", nunca llegaban a la
// IA con los botones individuales de traducción, aunque sí se guardaran bien al pulsar
// "Aplicar Cambios". Además, para no repetir el mismo bug de "solo la primera opción" que
// tenía ui-batch-nombres.js, esto usa reconstruirNombreConOpciones() (utils.js) en vez de
// reconstruir el texto a mano.
function construirTextoCompletoParaTraducir(l) {
    const esVino = (platoEditandoId >= 13000);
    const nom = (document.getElementById(`edit-${l}`)?.value || "").trim();

    if (esVino) {
        const detalle = (document.getElementById(`edit-${l}-uvas`)?.value || "").trim();
        return detalle ? `${nom} // ${detalle}` : nom;
    }
    if (modoIngredientesActivo) {
        const filasValidas = ingredientesPlatoActual.filter(ing => superLimpiar(ing.es || "") !== "" || superLimpiar(ing.en || "") !== "");
        const opciones = filasValidas.map(ing => superLimpiar((l === 'es' ? ing.es : ing.en) || ""));
        // Si este idioma concreto no tiene NADA todavía (ni nombre ni ninguna opción — típico
        // de EN antes de generarlo por primera vez), se devuelve "" en vez de un texto con
        // huecos vacíos entre "//" (p.ej. " //// , ////"), para que el "¿hay texto en inglés
        // de referencia?" de los prompts (ver prompts.js) siga funcionando igual que antes.
        const hayContenido = nom !== "" || opciones.some(o => o !== "");
        if (!hayContenido) return "";
        return reconstruirNombreConOpciones({ nombre: nom, opciones });
    }
    const detalle = (document.getElementById(`edit-${l}-uvas`)?.value || "").trim();
    return detalle ? `${nom} // ${detalle}` : nom;
}

async function generarTraduccionEN() {
    const nombreEs = document.getElementById('edit-es').value.trim();
    const esVino = (platoEditandoId >= 13000);

    if (!nombreEs) { alert("❌ Debes introducir primero el nombre en Español."); return; }

    let keys = [];
    if (typeof getKeys === 'function') keys = getKeys();
    if (keys.length === 0) { alert("❌ No hay API Keys de Gemini configuradas."); return; }

    const btn = document.getElementById('btn-generar-en');
    const originalText = btn.innerText;
    btn.innerText = "🇬🇧 Generando opciones...";
    btn.disabled = true;

    const textoCompletoEs = construirTextoCompletoParaTraducir('es').replace(/"/g, "'");
    // Prompt centralizado en prompts.js (window.PROMPTS.opcionesEN)
    const instruccion = window.PROMPTS.opcionesEN(textoCompletoEs, esVino);
    
    let exito = false; 
    let intentos = 0; 
    let ultimoError = ""; 
    let opciones = {};
    
    while (!exito && intentos < keys.length) {
        try {
            const apiKey = keys[intentos];
            if (typeof UI !== 'undefined' && typeof UI.log === 'function') UI.log(`[Info] Usando Key ${intentos + 1}/${keys.length}...`);
            const response = await fetch(`${GEMINI_ENDPOINT_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }], generationConfig: { maxOutputTokens: window.GEMINI_MAX_OUTPUT_TOKENS || 65536, thinkingConfig: { thinkingLevel: window.GEMINI_THINKING_LEVEL || "medium" } } })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                ultimoError = data.error?.message || "Error HTTP " + response.status;
                if (data.error?.code === 429 || response.status === 429) await new Promise(r => setTimeout(r, 3000));
                intentos++;
                continue;
            }

            const txt = (typeof extraerTextoCompletoRespuesta === 'function') ? extraerTextoCompletoRespuesta(data.candidates?.[0]) : data.candidates?.[0]?.content?.parts?.[0]?.text;
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
    
    const esVino = (platoEditandoId >= 13000);

    let keys = [];
    if (typeof getKeys === 'function') keys = getKeys();
    if (keys.length === 0) { alert("❌ No hay API Keys de Gemini configuradas."); btn.innerText = originalText; btn.disabled = false; return; }

    const textoCompletoEs = construirTextoCompletoParaTraducir('es').replace(/"/g, "'");
    const textoCompletoEn = construirTextoCompletoParaTraducir('en').replace(/"/g, "'");
    const idiomasObjetivo = window.IDIOMAS_ORDEN ? window.IDIOMAS_ORDEN.filter(l => l !== 'es' && l !== 'en').map(l => l.toUpperCase()) : [];
    
    // Prompt centralizado en prompts.js (window.PROMPTS.autoTraduccionResto)
    const instruccion = window.PROMPTS.autoTraduccionResto(textoCompletoEs, textoCompletoEn, esVino, idiomasObjetivo);
    
    let exito = false; 
    let intentos = 0; 
    let ultimoError = ""; 
    
    while (!exito && intentos < keys.length) {
        try {
            const apiKey = keys[intentos];
            if (typeof UI !== 'undefined' && typeof UI.log === 'function') UI.log(`[Info] Usando Key ${intentos + 1}/${keys.length}...`);
            const response = await fetch(`${GEMINI_ENDPOINT_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }], generationConfig: { maxOutputTokens: window.GEMINI_MAX_OUTPUT_TOKENS || 65536, thinkingConfig: { thinkingLevel: window.GEMINI_THINKING_LEVEL || "medium" } } })
            });

            const data = await response.json();

            if (!response.ok || data.error) { 
                ultimoError = data.error?.message || "Error HTTP " + response.status; 
                if (data.error?.code === 429 || response.status === 429) await new Promise(r => setTimeout(r, 3000));
                intentos++; 
                continue; 
            } 
            
            const txt = (typeof extraerTextoCompletoRespuesta === 'function') ? extraerTextoCompletoRespuesta(data.candidates?.[0]) : data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (txt) {
                const traducciones = extraerJSON(txt);
                // CORREGIDO: Gemini a veces devuelve las claves de idioma en minúscula
                // pese a pedirse en MAYÚSCULAS (o viceversa). Antes esto hacía que
                // traducciones[l] fallara en silencio (ningún campo se rellenaba pero
                // exito se marcaba true igualmente, sin avisar al usuario). Ahora se
                // busca la clave sin distinguir mayúsculas/minúsculas.
                const clavesRespuesta = Object.keys(traducciones);
                let rellenados = 0;
                idiomasObjetivo.forEach(l => {
                    const claveReal = clavesRespuesta.find(k => k.toUpperCase() === l.toUpperCase());
                    const valor = claveReal ? traducciones[claveReal] : undefined;
                    if (valor) {
                        rellenados++;
                        const desglosado = desglosarNombre(valor);
                        const finalName = esVino ? formatWineName(desglosado.nombre) : desglosado.nombre;
                        const inputField = document.getElementById(`edit-${l.toLowerCase()}`);
                        if (inputField) inputField.value = finalName;

                        const inputUva = document.getElementById(`edit-${l.toLowerCase()}-uvas`);
                        if (inputUva && inputUva.style.display !== "none") {
                            inputUva.value = desglosado.uvas;
                        }
                    }
                });
                // NUEVO: si la IA respondió pero ninguna traducción coincidió con los
                // idiomas pedidos, no lo tratamos como éxito: reintenta con la
                // siguiente key y, si se agotan, se avisa con el alert de abajo en
                // vez de cerrar el modal como si todo hubiera ido bien.
                if (rellenados > 0) {
                    exito = true;
                } else {
                    ultimoError = "La respuesta de Gemini no contenía ninguna de las claves de idioma esperadas (" + idiomasObjetivo.join(', ') + ").";
                    intentos++;
                }
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

    // NUEVO: nº de opciones que tenía ES ANTES de este guardado — para saber, una vez
    // reconstruido, si el modo ingredientes ha añadido o quitado alguna (ver más abajo).
    const opcionesEsAntes = esVino ? 0 : desglosarNombre(p['es'] || "").opciones.length;

    if (window.IDIOMAS_ORDEN) {
        window.IDIOMAS_ORDEN.forEach(l => {
            let nom = superLimpiar(document.getElementById(`edit-${l}`)?.value || "");
            if (esVino) nom = formatWineName(nom);

            if (esVino) {
                // Vinos: sin cambios — un único detalle/uva editable por su propio campo.
                const inputUva = document.getElementById(`edit-${l}-uvas`);
                const uvas = (inputUva && inputUva.style.display !== "none") ? superLimpiar(inputUva.value) : "";
                p[l] = uvas ? `${nom} // ${uvas}` : nom;
            } else if (modoIngredientesActivo && (l === 'es' || l === 'en')) {
                // NUEVO: modo "Plato con ingredientes" — ES/EN se reconstruyen desde la lista
                // editable (ingredientesPlatoActual), en el mismo formato "//opcion// , //opcion//"
                // que ya leen la web pública y desglosarNombre() (ver utils.js). Se descartan
                // las filas totalmente vacías (sin texto ni en ES ni en EN).
                const filasValidas = ingredientesPlatoActual.filter(ing => superLimpiar(ing.es || "") !== "" || superLimpiar(ing.en || "") !== "");
                const opciones = filasValidas.map(ing => superLimpiar((l === 'es' ? ing.es : ing.en) || ""));
                const sufijoOpciones = opciones.length > 0 ? ` //${opciones.join('// , //')}//` : "";
                p[l] = sufijoOpciones ? `${nom}${sufijoOpciones}` : nom;
            } else if (l === 'es' || l === 'en') {
                // MODIFICADO: modo simple — campo de detalle único, ahora editable para
                // cualquier plato (antes solo para vinos). Mismo criterio que el vino de
                // arriba: si hay texto en el campo, se guarda como "nombre // detalle".
                const inputUva = document.getElementById(`edit-${l}-uvas`);
                const detalle = (inputUva && inputUva.style.display !== "none") ? superLimpiar(inputUva.value) : "";
                p[l] = detalle ? `${nom} // ${detalle}` : nom;
            } else {
                // Resto de idiomas: se sustituye el nombre (lo que va ANTES de la primera
                // "//"); el sufijo "//..." que ya tuviera (traducido por IA) se conserva tal
                // cual aquí — se invalida aparte, más abajo, solo si el nº de opciones de ES
                // ha cambiado con este guardado.
                const original = p[l] || "";
                const idxSlash = original.indexOf('//');
                const sufijoOpciones = idxSlash !== -1 ? original.substring(idxSlash) : "";
                p[l] = sufijoOpciones ? `${nom} ${sufijoOpciones}` : nom;
            }
        });
    }

    // NUEVO: si el modo ingredientes ha cambiado el Nº de opciones de ES respecto a lo que
    // había al abrir el editor, el resto de idiomas (traducidos por IA, no tocados arriba) se
    // queda con un nº de opciones desalineado — y Opciones_Inactivas es por POSICIÓN,
    // compartida entre TODOS los idiomas. Se vacían esas celdas para que la Fase 2 de
    // traducción por lotes (o el botón "Auditar Separadores // Ahora") las regenere ya
    // alineadas, en vez de dejar en la web una traducción con las opciones descolocadas.
    if (!esVino && window.IDIOMAS_ORDEN) {
        const opcionesEsAhora = desglosarNombre(p['es'] || "").opciones.length;
        if (opcionesEsAhora !== opcionesEsAntes) {
            window.IDIOMAS_ORDEN.forEach(l => {
                if (l === 'es' || l === 'en') return;
                if ((p[l] || "").indexOf('//') !== -1) p[l] = "";
            });
        }
    }

    let preVal = document.getElementById('edit-precio').value || "0.00";
    p.precio = parseFloat(preVal).toFixed(2);
    if(isNaN(p.precio)) p.precio = "0.00";

    p.imagen = superLimpiar(document.getElementById('edit-imagen').value);

    const selectedAlergenos = document.querySelectorAll('.alergeno-btn.selected');
    p.alergenos = Array.from(selectedAlergenos).map(el => el.dataset.code || "").filter(c => c).join(', ');

    // MODIFICADO: las posiciones (1-based) que quedan DESACTIVADAS ahora salen de la lista
    // editable de ingredientes (ingredientesPlatoActual) en vez de leerse de los botones
    // .opcion-btn de la rueda antigua (ya no existe) — mismo formato de salida que antes
    // ("1,3,5..."), y en el mismo orden que las opciones que se acaban de guardar arriba
    // (filas totalmente vacías descartadas, igual que arriba).
    if (modoIngredientesActivo) {
        const filasValidas = ingredientesPlatoActual.filter(ing => superLimpiar(ing.es || "") !== "" || superLimpiar(ing.en || "") !== "");
        p.opcionesInactivas = filasValidas
            .map((ing, idx) => ({ pos: idx + 1, activo: ing.activo }))
            .filter(o => !o.activo)
            .map(o => o.pos)
            .join(',');
    } else {
        p.opcionesInactivas = "";
    }

    window.hayCambiosSinGuardar = true;

    // NUEVO: dispara la generación automática de la Info (descripción + preguntas/respuestas)
    // en ES/EN y, encadenado, en el resto de idiomas — en segundo plano, sin bloquear el editor
    // ni pedir nada más al usuario (ver generarInfoAutomaticaPlato() más abajo). Si el plato es
    // NUEVO, su fila todavía no existe en la hoja (se creará al pulsar "GUARDAR CAMBIOS EN
    // WEB"), así que se encola para procesarse justo después de ese guardado (ver
    // enviarAlExcel()); si ya existía, se dispara ya mismo contra el endpoint seguro
    // "?accion=infoplato" de Código.gs, que solo toca la fila de ESTE plato — nunca reenvía ni
    // toca el resto de la carta, así que no hay riesgo de pisar la Info ya generada de otros
    // platos aunque la caché de "publicar en la web" esté desactualizada en este momento.
    if (esNuevoPlato) {
        if (!platosPendientesInfoAlGuardar.includes(p.id)) platosPendientesInfoAlGuardar.push(p.id);
        // Plato nuevo: la generación no arrancará hasta unos segundos después de pulsar el botón
        // grande "GUARDAR CAMBIOS EN WEB" (ver enviarAlExcel()), así que aquí todavía no hay nada
        // que ver en la consola — se cierra el modal como antes.
        cerrarModal('modal-editor');
    } else {
        dispararGeneracionInfoAutomatica(p);
        // NUEVO: ya NO se cierra el modal al instante en este caso (plato ya existente) — se deja
        // abierto para que el usuario pueda ver en vivo, en la consola de debajo de "Alérgenos",
        // si la generación automática de Info tiene éxito o falla (antes se cerraba enseguida y
        // ese aviso solo aparecía en la consola de "Ajustes Expertos", invisible desde aquí). Los
        // cambios ya están aplicados en memoria a esta altura, así que cerrar con "Cancelar" en
        // cualquier momento no deshace nada; la generación sigue en segundo plano igualmente
        // aunque se cierre antes de que termine (y su resultado queda guardado para la próxima
        // vez que se reabra el editor de este plato, ver abrirEditor() > renderConsolaInfoPlato()).
    }

    renderizar();
}

// =========================================================================================
// NUEVO: GENERACIÓN AUTOMÁTICA DE INFO (descripción + preguntas/respuestas) AL CREAR/EDITAR UN
// PLATO. Reutiliza los mismos prompts que ya usaba "Ajustes Expertos" (window.PROMPTS.piloto /
// vino / infoOtrosIdiomasLote — ver prompts.js), pero para UN SOLO plato/vino a la vez, y
// guarda el resultado con el endpoint seguro "?accion=infoplato" (Código.gs), que actualiza
// SOLO la fila de ese plato sin tocar ni reenviar el resto de la carta.
// =========================================================================================

// Idéntico patrón de reintento-por-key que ya usaban generarTraduccionEN()/
// ejecutarTraduccionAutomatica(), extraído aquí para reutilizarlo. Devuelve el JSON ya
// parseado, o null si ninguna key tuvo éxito (nunca lanza excepción: este flujo es 100% en
// segundo plano y no debe interrumpir al usuario con ningún alert()).
async function llamarGeminiConReintentos(instruccion, keys) {
    let intentos = 0;
    while (intentos < keys.length) {
        try {
            const apiKey = keys[intentos];
            const response = await fetch(`${GEMINI_ENDPOINT_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: instruccion }] }], generationConfig: { maxOutputTokens: window.GEMINI_MAX_OUTPUT_TOKENS || 65536, thinkingConfig: { thinkingLevel: window.GEMINI_THINKING_LEVEL || "medium" } } })
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                if (data.error?.code === 429 || response.status === 429) await new Promise(r => setTimeout(r, 3000));
                intentos++;
                continue;
            }
            const txt = (typeof extraerTextoCompletoRespuesta === 'function') ? extraerTextoCompletoRespuesta(data.candidates?.[0]) : data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (txt) return extraerJSON(txt);
            intentos++;
        } catch (err) {
            intentos++;
        }
    }
    return null;
}

// Envía al backend (Código.gs, acción "infoplato") la Info ya generada de UN plato concreto,
// para uno o varios idiomas a la vez. "no-cors" (igual que el resto de guardados del editor)
// significa que no se puede leer la respuesta real — se asume éxito de forma optimista, igual
// que ya hace enviarAlExcel()/toggleCategoriaPestana().
async function guardarInfoPlatoEnBackend(id, infoPorIdioma) {
    try {
        const url = getWebAppUrlSafe();
        if (!url) return;
        await fetch(url + '?accion=infoplato', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, info: infoPorIdioma })
        });
    } catch (err) {
        console.warn('[Editor] Error al guardar Info automática en el backend:', err);
    }
}

// Añade/quita el ID del Set de "generando ahora mismo" y repinta para que
// renderPlatoItemHtml() muestre/oculte el aviso "🤖 generando info…".
function marcarPlatoGenerandoInfo(id, activo) {
    if (activo) window.platosGenerandoInfo.add(id); else window.platosGenerandoInfo.delete(id);
    renderizar();
}

// Punto de entrada "fire-and-forget" llamado desde aplicarCambiosPlato()/enviarAlExcel(): no se
// espera (await) su resultado a propósito, para no bloquear el editor ni el guardado normal.
function dispararGeneracionInfoAutomatica(p) {
    generarInfoAutomaticaPlato(p);
}

// Carpetas de bebidas simples que "Ajustes Expertos" también omite de la generación de Info
// (café, refrescos, cerveza) — mismo criterio aquí para no generar fichas de sabor a un café.
const CARPETAS_SIN_IA_INFO = ['cafe', 'refrescos', 'cerveza'];

// NUEVO: historial de mensajes de la generación automática de Info, por ID de plato (ver
// logInfoAutomatica()/renderConsolaInfoPlato() más abajo). Se guarda SIEMPRE (haya o no un
// modal abierto en ese momento) para poder pintarlo en cuanto el usuario abra/reabra el editor
// de ESE plato concreto — ver abrirEditor(), que llama a renderConsolaInfoPlato(id).
window.logsInfoPorPlato = window.logsInfoPorPlato || {};

// NUEVO: consola visible DENTRO del propio modal de crear/editar plato, justo debajo de
// "Alérgenos" (ver #consola-info-plato en index.html, dentro de .modal-col-derecha). Antes todo
// el rastro de la generación automática de Info solo se veía con UI.log(), que escribe en la
// consola de "Ajustes Expertos" — invisible mientras se está creando/editando un plato, que es
// justo cuando el usuario quiere ver si está funcionando. Cada línea se guarda en
// window.logsInfoPorPlato[idPlato] (para poder repintarla si se reabre el editor de ese plato
// más tarde, ya que la generación sigue en marcha en segundo plano aunque se cierre el modal) y,
// si el modal está abierto AHORA MISMO para ese mismo plato (platoEditandoId === idPlato), se
// añade también en vivo a la consola visible.
function logInfoAutomatica(mensaje, idPlato, esError = false) {
    console.log(`[Info automática] ${mensaje}`);
    if (typeof UI !== 'undefined' && typeof UI.log === 'function') UI.log(`[Info automática] ${mensaje}`);

    const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const historial = window.logsInfoPorPlato[idPlato] = window.logsInfoPorPlato[idPlato] || [];
    historial.push({ hora, mensaje, esError });
    while (historial.length > 20) historial.shift(); // no crecer indefinidamente por plato

    if (typeof platoEditandoId !== 'undefined' && platoEditandoId === idPlato) {
        renderConsolaInfoPlato(idPlato);
    }
}

// Repinta la consola del modal (#consola-info-plato) con el historial guardado de ESE plato —
// se llama al abrir/reabrir el editor de un plato (abrirEditor()) y, en vivo, desde
// logInfoAutomatica() mientras el modal de ese mismo plato sigue abierto.
function renderConsolaInfoPlato(idPlato) {
    const consola = document.getElementById('consola-info-plato');
    if (!consola) return;
    const historial = window.logsInfoPorPlato[idPlato] || [];
    consola.innerHTML = "";
    historial.forEach(linea => {
        const div = document.createElement('div');
        div.className = 'consola-info-automatica-linea' + (linea.esError ? ' es-error' : '');
        div.textContent = `[${linea.hora}] ${linea.mensaje}`;
        consola.appendChild(div);
    });
    consola.scrollTop = consola.scrollHeight;
}

async function generarInfoAutomaticaPlato(p) {
    try {
        if (!p || isNaN(p.id) || p.id < 13) return; // ids 1-12 son cabeceras de categoría heredadas, sin info real
        const carpetaValor = (p.carpeta || "").trim().toLowerCase();
        if (CARPETAS_SIN_IA_INFO.includes(carpetaValor)) return;

        let keys = [];
        if (typeof getKeys === 'function') keys = getKeys();
        if (keys.length === 0) {
            logInfoAutomatica(`No hay ninguna API Key de Gemini configurada — no se puede generar la Info de "${p['es'] || ('ID ' + p.id)}" automáticamente. Añade al menos una en "Ajustes Expertos".`, p.id, true);
            return;
        }

        const esVino = (p.id >= 13000);
        const nombreEs = p['es'] || "";
        if (!nombreEs) return;

        const alergenosValor = p.alergenos || "";
        const tieneAlergenos = !!(alergenosValor && alergenosValor.toUpperCase() !== 'NINGUNO' && alergenosValor !== '0');
        const nuevoHashFicha = (typeof calcularHashContenido === 'function') ? calcularHashContenido(`${nombreEs}|${alergenosValor}`) : "";

        p.info = p.info || {};
        const yaCompleto = p.info.es && p.info.en && p.infoHashFicha && p.infoHashFicha === nuevoHashFicha;
        if (yaCompleto) {
            logInfoAutomatica(`"${nombreEs}" (ID ${p.id}) ya tenía su ficha generada y ni el nombre ni los alérgenos han cambiado: no se regenera.`, p.id);
            return;
        }

        marcarPlatoGenerandoInfo(p.id, true);
        logInfoAutomatica(`Generando ficha ES/EN de "${nombreEs}" (ID ${p.id})...`, p.id);

        // --- Paso A: INFO_ES + INFO_EN (mismo prompt que "Generar Info Platos ES/EN", 1 plato) ---
        const promptPiloto = esVino ? window.PROMPTS.vino(nombreEs) : window.PROMPTS.piloto(nombreEs, tieneAlergenos, alergenosValor);
        const resultadoEsEn = await llamarGeminiConReintentos(promptPiloto, keys);
        if (!resultadoEsEn || !resultadoEsEn.es || !resultadoEsEn.en) {
            logInfoAutomatica(`No se pudo generar la ficha ES/EN de "${nombreEs}" (ID ${p.id}) — puede que ninguna API Key haya respondido bien (cuota agotada, key inválida...). Puedes generarla luego a mano desde "Ajustes Expertos".`, p.id, true);
            return;
        }

        // NUEVO: a propósito NO se toca el nombre en inglés (parsed.nombre_en) desde aquí — el
        // editor ya tiene su propio flujo manual para elegir el nombre EN ("🇬🇧 Generar EN",
        // con 3 estilos a elegir), y pisarlo en silencio desde este proceso de fondo iría en
        // contra de esa elección del usuario.
        p.info.es = JSON.stringify(resultadoEsEn.es);
        p.info.en = JSON.stringify(resultadoEsEn.en);
        p.infoHashFicha = nuevoHashFicha;
        window.hayCambiosSinGuardar = true;

        await guardarInfoPlatoEnBackend(p.id, { es: resultadoEsEn.es, en: resultadoEsEn.en });
        logInfoAutomatica(`Ficha ES/EN guardada para "${nombreEs}" (ID ${p.id}). Traduciendo al resto de idiomas...`, p.id);

        // --- Paso B: encadenado, resto de idiomas (mismo prompt que "Generar Info Platos Otros
        // Idiomas", 1 plato) — traduce fielmente la ficha ES/EN recién generada, no redacta contenido nuevo.
        const otrosOk = await generarInfoOtrosIdiomasPlato(p, keys, resultadoEsEn.es, resultadoEsEn.en);

        logInfoAutomatica(otrosOk
            ? `Ficha generada y guardada en TODOS los idiomas para "${nombreEs}" (ID ${p.id}).`
            : `ES/EN guardados para "${nombreEs}" (ID ${p.id}), pero falló la traducción al resto de idiomas. Aviso "⚠️ faltan otros idiomas" en su ficha del Editor.`,
            p.id, !otrosOk);
    } catch (err) {
        console.warn('[Editor] Error en generación automática de Info:', err);
        if (p) logInfoAutomatica(`Error inesperado generando la Info de "${p['es'] || ('ID ' + p.id)}": ${err && err.message ? err.message : err}`, p.id, true);
    } finally {
        marcarPlatoGenerandoInfo(p.id, false);
    }
}

// NUEVO: Paso B extraído a su propia función para poder reutilizarlo tanto encadenado desde
// generarInfoAutomaticaPlato() (recién generado ES/EN) como desde un reintento manual posterior
// (reintentarInfoOtrosIdiomasPlato(), botón "🔄 reintentar" del aviso "⚠️ faltan otros idiomas").
// infoEsObj/infoEnObj deben ser objetos ya parseados (no JSON.stringify-ados). Reintenta hasta
// MAX_INTENTOS_OTROS veces (fallos puntuales: 429, JSON truncado por el propio modelo, etc.)
// antes de darse por vencido; si al final falla, marca el plato en
// window.platosInfoOtrosIdiomasFallidos para que quede visible en su ficha. Devuelve true/false.
async function generarInfoOtrosIdiomasPlato(p, keys, infoEsObj, infoEnObj) {
    const esVino = (p.id >= 13000);
    const idiomasObjetivo = (window.IDIOMAS_ORDEN || []).filter(l => l !== 'es' && l !== 'en');
    if (idiomasObjetivo.length === 0) { window.platosInfoOtrosIdiomasFallidos.delete(p.id); return true; }

    const MAX_INTENTOS_OTROS = 2;
    let traducciones = null;
    for (let intento = 0; intento < MAX_INTENTOS_OTROS && !traducciones; intento++) {
        const promptOtros = window.PROMPTS.infoOtrosIdiomasLote(
            [{ esVino: esVino, infoEs: infoEsObj, infoEn: infoEnObj }],
            idiomasObjetivo.map(l => l.toUpperCase())
        );
        const resultadoOtros = await llamarGeminiConReintentos(promptOtros, keys);
        traducciones = resultadoOtros ? (resultadoOtros['0'] || resultadoOtros[0]) : null;
    }

    if (!traducciones) {
        window.platosInfoOtrosIdiomasFallidos.add(p.id);
        logInfoAutomatica(`Falló la traducción de Info al resto de idiomas del plato "${p['es'] || ''}" (ID ${p.id}) tras ${MAX_INTENTOS_OTROS} intento(s).`, p.id, true);
        return false;
    }

    p.info = p.info || {};
    const paraGuardar = {};
    idiomasObjetivo.forEach(l => {
        const valor = traducciones[l.toUpperCase()] || traducciones[l];
        if (valor) { p.info[l] = JSON.stringify(valor); paraGuardar[l] = valor; }
    });
    if (Object.keys(paraGuardar).length > 0) {
        window.hayCambiosSinGuardar = true;
        await guardarInfoPlatoEnBackend(p.id, paraGuardar);
    }
    window.platosInfoOtrosIdiomasFallidos.delete(p.id);
    return true;
}

// NUEVO: entrada manual del botón "🔄 reintentar" del aviso "⚠️ faltan otros idiomas" —
// reintenta SOLO el Paso B (resto de idiomas) a partir de la ficha ES/EN ya guardada, sin
// gastar otra llamada a Gemini para regenerarla ni tocar el resto de la carta.
async function reintentarInfoOtrosIdiomasPlato(id) {
    const p = datosLocales.find(x => x.id === id);
    if (!p) return;

    let keys = [];
    if (typeof getKeys === 'function') keys = getKeys();
    if (keys.length === 0) { alert('Añade al menos una API Key de Gemini en "Ajustes Expertos" antes de reintentar.'); return; }

    if (!p.info || !p.info.es || !p.info.en) {
        alert('Este plato todavía no tiene guardada su ficha ES/EN; no se puede traducir al resto de idiomas todavía.');
        return;
    }
    let infoEsObj, infoEnObj;
    try {
        infoEsObj = JSON.parse(p.info.es);
        infoEnObj = JSON.parse(p.info.en);
    } catch (err) {
        alert('La ficha ES/EN guardada de este plato no es un JSON válido; regenérala primero desde "Ajustes Expertos".');
        return;
    }

    marcarPlatoGenerandoInfo(id, true);
    logInfoAutomatica(`Reintentando la traducción al resto de idiomas de "${p['es'] || ''}" (ID ${id})...`, id);
    try {
        const ok = await generarInfoOtrosIdiomasPlato(p, keys, infoEsObj, infoEnObj);
        if (ok) logInfoAutomatica(`Reintento correcto: "${p['es'] || ''}" (ID ${id}) ya tiene la Info en todos los idiomas.`, id);
        if (!ok) alert('Ha vuelto a fallar la traducción al resto de idiomas. Puedes reintentarlo de nuevo, o completarla desde "Ajustes Expertos" (Paso 3).');
    } finally {
        marcarPlatoGenerandoInfo(id, false);
    }
}
window.reintentarInfoOtrosIdiomasPlato = reintentarInfoOtrosIdiomasPlato;

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
        alergenos: "",
        opcionesInactivas: ""
    };
    
    // CORREGIDO: mismo problema que en abrirEditor() — antes precargaba la imagen de croquetas
    // para cualquier ID 12100-12299 sin importar el restaurante, así que un plato nuevo en
    // Entrantes/Ensaladas de US Open salía con la foto de croquetas puesta por defecto.
    if (esRangoCroquetasRG(baseId) && baseId >= 12200) datosTempNuevo.imagen = "croquetasvegetarianas01.webp";
    else if (esRangoCroquetasRG(baseId) && baseId <= 12199) datosTempNuevo.imagen = "croquetas01.webp";
    
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
        let obj = { id: p.id, precio: p.precio, activa: p.activa ? 'si' : 'no', carpeta: p.carpeta, imagen: p.imagen, alergenos: p.alergenos, opciones_inactivas: p.opcionesInactivas || "" };
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

        // NUEVO: platos NUEVOS cuya Info automática quedó en cola (ver aplicarCambiosPlato())
        // porque su fila todavía no existía en la hoja — ahora que este guardado ya la ha
        // creado, se procesan. Margen de unos segundos para darle tiempo a Apps Script a
        // terminar de escribir antes de que el endpoint seguro "?accion=infoplato" intente
        // localizar la fila por ID.
        if (platosPendientesInfoAlGuardar.length > 0) {
            const idsAProcesar = platosPendientesInfoAlGuardar.slice();
            platosPendientesInfoAlGuardar = [];
            setTimeout(() => {
                idsAProcesar.forEach(idPlato => {
                    const plato = datosLocales.find(x => x.id === idPlato);
                    if (plato) dispararGeneracionInfoAutomatica(plato);
                });
            }, 4000);
        }
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

// NUEVO: paso 1 de "Eliminar Plato" — cierra el editor y abre la modal de confirmación con
// contraseña (ver PASSWORD_ELIMINAR_PLATO en config.js), mostrando el nombre del plato para
// que quede claro cuál se va a borrar antes de escribir la contraseña.
function abrirModalEliminarPlato() {
    const p = datosLocales.find(x => x.id === platoEditandoId);
    if (!p) return;

    cerrarModal('modal-editor');

    const nombreLimpio = desglosarNombre(p.es || "").nombre || `ID ${p.id}`;
    const textoPlato = document.getElementById('texto-plato-a-eliminar');
    if (textoPlato) textoPlato.innerText = `"${nombreLimpio}" (ID ${p.id})`;

    const inputPassword = document.getElementById('password-eliminar-plato');
    if (inputPassword) inputPassword.value = "";
    const errorPassword = document.getElementById('error-password-eliminar');
    if (errorPassword) errorPassword.style.display = 'none';

    const modal = document.getElementById('modal-eliminar-plato');
    if (modal) modal.style.display = 'block';
    if (inputPassword) inputPassword.focus();
}
window.abrirModalEliminarPlato = abrirModalEliminarPlato;

function cerrarModalEliminarPlato() {
    cerrarModal('modal-eliminar-plato');
}
window.cerrarModalEliminarPlato = cerrarModalEliminarPlato;

// NUEVO: paso 2 — comprueba la contraseña y, si es correcta, borra el plato de datosLocales de
// verdad (splice, no un simple "activa:false"). El borrado se aplica en la web la próxima vez
// que se pulse "GUARDAR CAMBIOS EN WEB", exactamente igual que el resto de cambios del editor
// (activar/desactivar, reordenar, editar nombre/precio) — no hay una llamada de red aparte para
// esto, por eso el aviso final recuerda pulsar Guardar. La contraseña NO se recuerda de un
// borrado a otro: el permiso es solo para esa eliminación, hay que volver a escribirla cada vez.
function confirmarEliminarPlato() {
    const inputPassword = document.getElementById('password-eliminar-plato');
    const errorPassword = document.getElementById('error-password-eliminar');
    const passwordIntroducida = inputPassword ? inputPassword.value : "";

    if (passwordIntroducida !== PASSWORD_ELIMINAR_PLATO) {
        if (errorPassword) errorPassword.style.display = 'block';
        if (inputPassword) { inputPassword.value = ""; inputPassword.focus(); }
        return;
    }

    const idx = datosLocales.findIndex(x => x.id === platoEditandoId);
    if (idx === -1) { cerrarModalEliminarPlato(); return; }

    datosLocales.splice(idx, 1);
    window.hayCambiosSinGuardar = true;

    cerrarModalEliminarPlato();
    renderizar();
    alert('🗑️ Plato eliminado. Pulsa "GUARDAR CAMBIOS EN WEB" para que el borrado se aplique también en la web.');
}
window.confirmarEliminarPlato = confirmarEliminarPlato;

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

// NUEVO: faltaba por completo — el botón "Añadir Key" (#addKeyBtn) no tenía ningún onclick en el
// HTML y esta función (leer #nuevaKey, guardarla con saveKey() de state.js y refrescar el
// desplegable) no existía en ningún archivo, así que pulsar el botón no hacía nada. Ver también
// eliminarKeySeleccionada() arriba, que sí existía pero tampoco estaba conectada a su botón.
// MODIFICADO: admite pegar VARIAS keys de golpe (una por línea, o separadas por comas/punto y
// coma) además de una sola — así se puede copiar y pegar directamente el contenido de un .txt con
// varias keys en vez de añadirlas una a una. #nuevaKey pasó de <input> a <textarea> para que el
// pegado multilínea se vea bien. saveKey() ya evita duplicados por su cuenta, así que si se pega
// dos veces la misma key no pasa nada raro.
function agregarKeyDesdeInput() {
    const inputKey = document.getElementById('nuevaKey');
    const textoBruto = inputKey ? inputKey.value : "";
    const candidatas = textoBruto.split(/[\n\r,;]+/).map(k => k.trim()).filter(k => k.length > 0);
    if (candidatas.length === 0) {
        alert("Pega antes una o varias API Keys de Gemini en el campo de texto (una por línea, o separadas por comas).");
        return;
    }
    if (typeof saveKey !== 'function' || typeof getKeys !== 'function') return;
    const antes = getKeys().length;
    candidatas.forEach(k => saveKey(k));
    const despues = getKeys().length;
    const nuevasAnadidas = despues - antes;
    const yaExistian = candidatas.length - nuevasAnadidas;
    if (inputKey) inputKey.value = "";
    if (typeof UI !== 'undefined' && typeof UI.actualizarListaKeys === 'function') {
        UI.actualizarListaKeys();
        UI.log(`[OK] ${nuevasAnadidas} API Key(s) nueva(s) añadida(s)${yaExistian > 0 ? ` (${yaExistian} ya existían, no se duplicaron)` : ''}.`);
    }
}

// Auto-invocación inicial
cargar();
