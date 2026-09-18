// --- menu-especial.js ---
// NUEVO (18 sept): módulo de la pestaña "6. Menú Especial" — plantillas de menú de evento
// (boda/grupo/celebración), sin precio, con logo RG opcional, en ES y/o EN, con secciones
// Entrantes/Primero/Principal/Postre activables de forma independiente (cada una con varios
// platos posibles, sacados de la carta de RG y/o de US Open mediante un selector grande con
// checks -- o escritos a mano si el plato no está en ninguna carta), más una sección de Bebida
// fija (Agua/Cerveza/Refresco/Café o infusiones + Vino Blanco/Tinto "a especificar", solo con
// sugerencias de vinos y cavas de verdad, nunca platos de comida). Los menús se guardan de
// verdad (no es solo una herramienta de "componer e imprimir") en un backend de Apps Script
// COMPLETAMENTE NUEVO e independiente de RG y de US Open (ver Codigo_MenusEspeciales.gs y
// config.js/WEBAPP_URL_MENUS_ESPECIALES). Se imprime SIEMPRE en una sola hoja A4 horizontal (2
// copias del menú, con guía de corte para la guillotina) reduciendo la letra automáticamente
// si hace falta -- igual que ya hace "Sugerencias" (sugerencias-print.js) con su patrón de
// ventana emergente (window.open + document.write), para no depender de @media print peleándose
// con el resto de la interfaz del editor.
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.menuEspecial = '1.3.0'; // MODIFICADO: el popup de platos ya NO descarta los inactivos en la web pública (una plantilla de evento es independiente de lo que esté activo ahora mismo en la carta en vivo); impresión con márgenes horizontales más ajustados y letra base algo mayor; Agua/Cerveza/Refresco en una sola línea; nombres de vino solo en castellano (la etiqueta de categoría sigue siendo bilingüe, "Vino Blanco / White Wine:"); títulos de sección (Entrantes, Primero - A Elegir, etc.) también salen en inglés si ese idioma está activo; los índices de platos/vinos ahora se precargan en segundo plano al arrancar la web (igual que ya se hace con "el otro restaurante" del Editor normal), así que abrir esta pestaña ya no suele mostrar overlay de carga.

(function () {
    'use strict';

    // =================================================================================
    // ESTADO DEL MÓDULO
    // =================================================================================
    let platosParaPopup = [];                 // [{modo,alias,id,es,en,tipo}] -- solo comida de verdad (ver CARPETAS_EXCLUIDAS_DE_PLATOS); tipo: 'postre' | 'principal'
    let indiceVinos = [];                     // [{modo,id,es,en,tipo}] -- SOLO vinos y cavas (id 13100-14499); tipo: 'blanco'|'rosado'|'tinto'|'cava'
    let menusGuardados = [];                  // última lista conocida (GET listarMenus), más recientes primero
    let menuActual = null;                    // el menú que se está editando ahora mismo en pantalla
    let modalGrupoActual = null;              // 'comida' | 'vino' -- a qué pool pertenece el popup abierto ahora mismo
    let modalSeccionActual = null;            // clave de sección ('entrantes'/'primero'/.../'postre') o de vino ('vinoBlanco'/'vinoRosado'/'vinoTinto'/'cava') a la que añade el popup abierto
    const seleccionEnModal = {};              // "modo|id" -> true, mientras el popup está abierto

    // Cafés, refrescos/bebidas y cervezas nunca son "platos" de una sección de comida -- ver
    // estructuras.js: en RG caen en el rango de ID 9000-11999, en US Open en 9001-11099 (mismo
    // rango de millar, por seguridad se descarta TODO el bloque 9000-11999 en los dos). Además,
    // por si algún plato antiguo no llevara ese rango de ID bien puesto, se descarta también por
    // "carpeta" (cafe/refrescos/cerveza) -- y 'vinos' por si acaso algún vino colgara de un ID
    // fuera del rango de vinos reconocido (p.ej. el "Vino" de Sugerencias en US Open, ID 12991-
    // 12999, carpeta "vinos" pero FUERA del rango 13100-14499).
    const CARPETAS_EXCLUIDAS_DE_PLATOS = ['cafe', 'refrescos', 'cerveza', 'vinos'];

    // "tituloEn" solo se usa al imprimir (etiquetaBilingue en construirHtmlMenuImpreso) -- el
    // formulario de edición sigue mostrando siempre "titulo" (en español), ver renderSeccionHtml.
    const SECCIONES_INFO = [
        { key: 'entrantes', titulo: 'Entrantes', tituloEn: 'Starters', conCompartir: true },
        { key: 'primero', titulo: 'Primero', tituloEn: 'First Course', conAElegir: true },
        { key: 'principal', titulo: 'Principal (Segundo)', tituloEn: 'Main Course', conAElegir: true },
        { key: 'postre', titulo: 'Postre', tituloEn: 'Dessert', conAElegir: true }
    ];

    // Los 4 vinos/cavas de la sección Bebida -- cada uno se activa/desactiva por separado ("por
    // si hay veces que lo ponemos y otras que no") y tiene su PROPIO popup grande con checks que
    // SOLO ofrece vinos de su propio "tipo" (ver indiceVinos más abajo) -- nunca se mezclan
    // blancos con tintos, ni cavas con rosados, etc.
    const WINES_INFO = [
        { key: 'vinoBlanco', tituloEs: 'Vino Blanco', tituloEn: 'White Wine', emoji: '🥂', tipo: 'blanco' },
        { key: 'vinoRosado', tituloEs: 'Vino Rosado', tituloEn: 'Rosé Wine', emoji: '🌸', tipo: 'rosado' },
        { key: 'vinoTinto', tituloEs: 'Vino Tinto', tituloEn: 'Red Wine', emoji: '🍷', tipo: 'tinto' },
        { key: 'cava', tituloEs: 'Cava', tituloEn: 'Cava', emoji: '🍾', tipo: 'cava' }
    ];

    function nuevoMenuVacio() {
        const bebida = { agua: true, cerveza: true, refresco: true, cafe: true };
        WINES_INFO.forEach(w => { bebida[w.key] = { activo: false, platos: [] }; });
        return {
            id: null,
            nombre: '',
            logo: true,
            idiomas: { es: true, en: false },
            secciones: {
                entrantes: { activo: true, compartir: false, platos: [] },
                primero: { activo: false, aElegir: false, platos: [] },
                principal: { activo: true, aElegir: false, platos: [] },
                postre: { activo: true, aElegir: false, platos: [] }
            },
            bebida: bebida
        };
    }

    function escHtml(txt) {
        return String(txt === null || txt === undefined ? '' : txt)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function mostrarCargando(activo, texto) {
        if (activo) {
            if (typeof window.mostrarOverlayCarga === 'function') window.mostrarOverlayCarga(texto || '🍽️ Cargando Menú Especial...');
        } else {
            if (typeof window.ocultarOverlayCarga === 'function') window.ocultarOverlayCarga();
        }
    }

    function formatearFecha(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function claveModoId(modo, id) { return modo + '|' + id; }

    // =================================================================================
    // ESTILOS PROPIOS — inyectados una sola vez, igual que hace sugerencias-print.js con los
    // suyos (ver document.getElementById('sugerencias-print-styles') en ese archivo).
    // =================================================================================
    function inyectarEstilos() {
        if (document.getElementById('menu-especial-styles')) return;
        const style = document.createElement('style');
        style.id = 'menu-especial-styles';
        style.innerHTML = `
            .me-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px 18px; margin-bottom:14px; }
            .me-fila { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
            .me-check-label { display:flex; align-items:center; gap:7px; font-weight:700; font-size:0.92rem; cursor:pointer; user-select:none; white-space:nowrap; }
            .me-check-label input { width:17px; height:17px; cursor:pointer; margin:0; }
            .me-sub-check { font-weight:500; font-size:0.8rem; color:#666; }
            .me-plato-row { display:flex; align-items:center; justify-content:space-between; gap:10px; background:#f8f9fa; border:1px solid #eee; border-radius:8px; padding:7px 10px; margin-bottom:6px; font-size:0.86rem; }
            .me-plato-row .me-plato-nombre { flex:1; }
            .me-plato-tag { font-size:0.65rem; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:4px; margin-right:8px; }
            .me-tag-rg { background:#fde7d6; color:#c0530b; }
            .me-tag-us { background:#dbeafe; color:#1d4ed8; }
            .me-tag-manual { background:#e5e7eb; color:#4b5563; }
            .me-btn-quitar { background:#fdecea; color:#e74c3c; border:none; border-radius:6px; width:26px; height:26px; cursor:pointer; font-weight:700; flex-shrink:0; }
            .me-btn-quitar:hover { background:#f8d7d3; }
            .me-layout { display:flex; gap:20px; align-items:flex-start; }
            .me-sidebar { width:270px; flex-shrink:0; }
            .me-menu-item { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:9px 11px; margin-bottom:8px; font-size:0.8rem; }
            .me-menu-item-nombre { font-weight:700; display:block; margin-bottom:3px; word-break:break-word; }
            .me-menu-item-fecha { color:#999; font-size:0.68rem; display:block; margin-bottom:7px; }
            .me-menu-item-btns { display:flex; gap:5px; flex-wrap:wrap; }
            .me-menu-item-btns button { font-size:0.68rem; padding:3px 7px; border-radius:5px; border:1px solid #ddd; background:#f8f9fa; cursor:pointer; }
            .me-menu-item-btns button:hover { background:#eee; }
            .me-modal-plato-row { display:flex; align-items:center; gap:10px; padding:7px 6px; border-bottom:1px solid #f2f2f2; font-size:0.85rem; cursor:pointer; }
            .me-modal-plato-row:hover { background:#f8f9fa; }
            .me-modal-plato-row input { width:16px; height:16px; cursor:pointer; flex-shrink:0; margin:0; }
            @media (max-width: 900px) { .me-layout { flex-direction: column; } .me-sidebar { width:100%; } }
        `;
        document.head.appendChild(style);
    }

    // =================================================================================
    // CARGA DE PLATOS — combina RG + US Open, reutilizando cargarYCachearModo(modo) de app.js
    // (misma caché de siempre, así no se duplica ninguna descarga de CSV ya hecha por el
    // editor normal). Se ejecutan en paralelo porque son independientes entre sí. Separa
    // estrictamente "platos de comida" (para Entrantes/Primero/Principal/Postre) de "vinos y
    // cavas" (para la sección Bebida) -- nunca se mezclan en ningún sentido.
    // =================================================================================
    async function cargarIndiceDePlatos() {
        let datosRG = null, datosUS = null;
        try {
            const resultados = await Promise.all([
                (typeof window.cargarYCachearModo === 'function') ? window.cargarYCachearModo('restaurante001') : Promise.resolve(null),
                (typeof window.cargarYCachearModo === 'function') ? window.cargarYCachearModo('restaurante002') : Promise.resolve(null)
            ]);
            datosRG = resultados[0];
            datosUS = resultados[1];
        } catch (e) {
            console.error('[MenuEspecial] Error cargando las cartas de RG/US Open:', e);
        }

        platosParaPopup = [];
        indiceVinos = [];

        // Limpia el "//" (segunda línea de ingredientes/opciones) del nombre para que la
        // plantilla de menú especial muestre solo el nombre principal del plato.
        function limpiarNombre(txt) { return (txt || '').split('//')[0].trim(); }

        function procesar(datos, modo, alias) {
            if (!Array.isArray(datos)) return;
            datos.forEach(item => {
                // NOTA: a diferencia de las webs públicas, aquí NO se filtra por item.activa --
                // un "Menú Especial" es una plantilla propia para eventos, independiente de lo
                // que esté visible/activo ahora mismo en la web pública (un plato desactivado
                // temporalmente en la carta normal puede seguir siendo válido para una boda).
                // Antes se descartaban los platos inactivos aquí, lo que hacía que el popup
                // pareciera tener "menos platos de los que hay realmente" en la carta.

                // Vinos y cavas de verdad (blancos/rosados/tintos/Cavas & Champagne -- mismos
                // rangos en RG y en US Open, ver estructuras.js): van SOLO al selector de
                // Bebida, nunca al de comida. Se etiquetan con su "tipo" exacto para que el
                // popup de cada uno de los 4 vinos de Bebida ofrezca SOLO su propio tipo (un
                // Vino Blanco jamás debe poder añadir un tinto, ni un Cava un rosado, etc.).
                if (item.id >= 13100 && item.id <= 14499) {
                    const nombreVino = limpiarNombre(item.es);
                    if (nombreVino) {
                        let tipoVino;
                        if (item.id <= 13199) tipoVino = 'blanco';
                        else if (item.id <= 13299) tipoVino = 'rosado';
                        else if (item.id <= 13399) tipoVino = 'tinto';
                        else tipoVino = 'cava';
                        indiceVinos.push({ modo: modo, id: item.id, es: nombreVino, en: limpiarNombre(item.en), tipo: tipoVino });
                    }
                    return;
                }
                if (item.id >= 13000) return; // otro ID de vino fuera del rango reconocido: se descarta (ni plato ni vino)

                // Cafés / Refrescos-Bebidas / Cervezas: nunca son "platos" de Entrantes,
                // Primero, Principal o Postre.
                if (item.id >= 9000 && item.id <= 11999) return;
                const carpeta = (item.carpeta || '').toLowerCase().trim();
                if (CARPETAS_EXCLUIDAS_DE_PLATOS.indexOf(carpeta) !== -1) return;

                const nombreEs = limpiarNombre(item.es);
                if (!nombreEs) return;
                // "tipo" separa Postre del resto (Entrantes/Primero/Principal comparten pool,
                // pero Postre nunca se mezcla con ellos en ningún sentido -- ver poolParaModal).
                const tipo = (carpeta === 'postres') ? 'postre' : 'principal';
                platosParaPopup.push({ modo: modo, alias: alias, id: item.id, es: nombreEs, en: limpiarNombre(item.en), tipo: tipo });
            });
        }
        procesar(datosRG, 'restaurante001', 'RG');
        procesar(datosUS, 'restaurante002', 'US Open');
        platosParaPopup.sort((a, b) => a.es.localeCompare(b.es, 'es'));
    }

    // =================================================================================
    // BACKEND — Codigo_MenusEspeciales.gs (proyecto nuevo, ver config.js). Las lecturas (GET
    // listarMenus) son fetch normales (sí se puede leer la respuesta). Los guardados/borrados
    // (POST) usan "no-cors, fire-and-forget" — el MISMO patrón que ya usa el resto del proyecto
    // para escribir en Apps Script (ver toggleCategoriaPestana en app.js) — porque un POST con
    // Content-Type JSON dispara un preflight CORS que Apps Script no responde bien; con
    // "no-cors" el navegador SÍ espera a que el servidor termine, solo que no puede leer la
    // respuesta. Por eso, tras guardar, se vuelve a pedir la lista completa (esa sí legible)
    // para saber el id real que ha asignado el servidor a un menú recién creado.
    // =================================================================================
    function urlBackend() {
        return (typeof window.WEBAPP_URL_MENUS_ESPECIALES !== 'undefined') ? window.WEBAPP_URL_MENUS_ESPECIALES : '';
    }

    async function listarMenus() {
        const url = urlBackend();
        if (!url) { console.warn('[MenuEspecial] Falta configurar WEBAPP_URL_MENUS_ESPECIALES en config.js'); return []; }
        try {
            const resp = await fetch(url + '?accion=listarMenus&zx=' + Date.now(), { cache: 'no-store' });
            const data = await resp.json();
            return (data && data.ok && Array.isArray(data.menus)) ? data.menus : [];
        } catch (e) {
            console.error('[MenuEspecial] Error al listar menús guardados:', e);
            return [];
        }
    }

    async function guardarMenuEnServidor(menu) {
        const url = urlBackend();
        if (!url) throw new Error('Falta configurar WEBAPP_URL_MENUS_ESPECIALES en config.js');

        const eraNuevo = !menu.id;
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: menu.id || '', nombre: menu.nombre, config: menu })
        });

        // Refresca la lista para tener la versión real del servidor (fechas, y el id nuevo si
        // era un menú recién creado). El backend ya devuelve la lista ordenada por
        // Fecha_Modificacion descendente, así que el menú recién guardado es siempre el [0].
        menusGuardados = await listarMenus();
        if (eraNuevo && menusGuardados[0]) menu.id = menusGuardados[0].id;
        return menu.id;
    }

    async function eliminarMenuEnServidor(id) {
        const url = urlBackend();
        if (!url) throw new Error('Falta configurar WEBAPP_URL_MENUS_ESPECIALES en config.js');
        await fetch(url + '?accion=eliminarMenu', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        menusGuardados = await listarMenus();
    }

    function buscarMenuPorId(id) { return menusGuardados.find(m => String(m.id) === String(id)); }

    // Reconstruye un menú editable a partir de lo guardado, rellenando con los valores por
    // defecto de nuevoMenuVacio() cualquier campo que faltara (por si se guardó con una versión
    // anterior de la plantilla y luego se ha añadido algún campo nuevo, p.ej. "aElegir").
    function mergeMenuDesdeGuardado(m) {
        const base = nuevoMenuVacio();
        const cfg = m.config || {};
        const menu = Object.assign({}, base, cfg, { id: m.id, nombre: m.nombre });
        menu.idiomas = Object.assign({}, base.idiomas, cfg.idiomas);
        menu.secciones = {};
        Object.keys(base.secciones).forEach(k => {
            menu.secciones[k] = Object.assign({}, base.secciones[k], (cfg.secciones && cfg.secciones[k]) || {});
            if (!Array.isArray(menu.secciones[k].platos)) menu.secciones[k].platos = [];
        });
        menu.bebida = Object.assign({}, base.bebida, cfg.bebida);
        WINES_INFO.forEach(w => {
            const guardado = (cfg.bebida && cfg.bebida[w.key]) || {};
            const slot = Object.assign({}, base.bebida[w.key], guardado);
            if (!Array.isArray(slot.platos)) slot.platos = [];
            // Compatibilidad con menús guardados con el modelo antiguo (solo 2 vinos, cada uno
            // con un campo de texto libre "texto" en vez de una lista de platos): si tenía
            // "texto" pero no lista, migra ese texto a una entrada manual para no perder el dato.
            if (guardado.texto && !slot.platos.length) {
                slot.platos = [{ manual: true, modo: null, id: null, es: guardado.texto, en: '' }];
            }
            menu.bebida[w.key] = slot;
        });
        return menu;
    }

    // =================================================================================
    // RENDER — esqueleto fijo (se construye una sola vez) + dos zonas que se repintan por
    // separado (sidebar de menús guardados / formulario de edición), para no reconstruir toda
    // la pestaña en cada tecla y perder el foco de los campos de texto que sí se escriben del
    // tirón (nombre del menú, texto de los vinos, búsqueda del popup): esos campos NO disparan
    // un repintado completo, solo actualizan el estado o una zona pequeña — se relee entero al
    // guardar/imprimir.
    // =================================================================================
    function construirEsqueleto() {
        const cont = document.getElementById('menu-especial-contenido');
        if (!cont) return;
        if (document.getElementById('me-form-area')) return; // ya construido — no lo tocamos
        cont.innerHTML = `
            <div class="me-layout">
                <div class="me-sidebar">
                    <div class="me-card">
                        <label class="label-seccion">📋 Menús guardados</label>
                        <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" onclick="MenuEspecial.nuevoMenu()">+ Nuevo menú</button>
                        <button class="btn btn-secondary" style="width:100%;margin-bottom:10px;" onclick="MenuEspecial.refrescarLista()">🔄 Refrescar lista</button>
                        <div id="me-sidebar-lista"></div>
                    </div>
                </div>
                <div id="me-form-area" style="flex:1;min-width:0;"></div>
            </div>

            <div id="me-modal-platos" class="modal">
                <div class="modal-content" style="max-width:920px; max-height:88vh; display:flex; flex-direction:column;">
                    <h2 id="me-modal-titulo" style="margin-top:0;margin-bottom:4px;">🍽️ Elegir platos</h2>
                    <p id="me-modal-subtitulo" style="margin:0 0 14px 0; font-size:0.82rem; color:#777;"></p>
                    <div class="me-fila" style="margin-bottom:12px;">
                        <input type="text" id="me-modal-buscar" class="input-estandar" style="flex:2;min-width:200px;margin-bottom:0;" placeholder="Buscar por nombre..." oninput="MenuEspecial.filtrarModalLista()">
                        <select id="me-modal-filtro-restaurante" class="input-estandar" style="flex:0 0 170px;margin-bottom:0;" onchange="MenuEspecial.filtrarModalLista()">
                            <option value="">RG y US Open</option>
                            <option value="restaurante001">Solo RG</option>
                            <option value="restaurante002">Solo US Open</option>
                        </select>
                    </div>
                    <div id="me-modal-lista" style="flex:1;overflow-y:auto;border:1px solid #eee;border-radius:8px;padding:6px 10px;min-height:200px;"></div>
                    <div class="me-fila" style="margin-top:14px;justify-content:flex-end;">
                        <button class="btn btn-secondary" onclick="MenuEspecial.cerrarModalPlatos()">Cancelar</button>
                        <button class="btn btn-success" onclick="MenuEspecial.confirmarSeleccionPlatos()">+ Añadir seleccionados (<span id="me-modal-contador">0</span>)</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderSidebarLista() {
        const cont = document.getElementById('me-sidebar-lista');
        if (!cont) return;
        if (!menusGuardados.length) {
            cont.innerHTML = `<p style="font-size:0.78rem;color:#999;margin:0;">Todavía no hay ningún menú guardado.</p>`;
            return;
        }
        cont.innerHTML = menusGuardados.map(m => {
            const activo = menuActual && String(menuActual.id) === String(m.id);
            return `<div class="me-menu-item" style="${activo ? 'border-color:var(--primario);box-shadow:0 0 0 1px var(--primario);' : ''}">
                <span class="me-menu-item-nombre">${escHtml(m.nombre)}</span>
                <span class="me-menu-item-fecha">Modificado: ${escHtml(formatearFecha(m.fechaModificacion))}</span>
                <div class="me-menu-item-btns">
                    <button onclick="MenuEspecial.cargarMenu('${m.id}')">✏️ Editar</button>
                    <button onclick="MenuEspecial.duplicarMenu('${m.id}')">📄 Duplicar</button>
                    <button onclick="MenuEspecial.imprimirMenuGuardado('${m.id}')">🖨️ Imprimir</button>
                    <button onclick="MenuEspecial.eliminarMenu('${m.id}')" style="color:#e74c3c;">🗑️ Borrar</button>
                </div>
            </div>`;
        }).join('');
    }

    function renderFormulario() {
        const cont = document.getElementById('me-form-area');
        if (!cont || !menuActual) return;

        let html = `<div class="me-card">
            <div class="me-fila" style="justify-content:space-between;">
                <div style="flex:1;min-width:260px;">
                    <label class="label-seccion">Nombre del menú <span style="font-weight:500;text-transform:none;color:#999;">(aparecerá impreso como título del menú)</span></label>
                    <input type="text" id="me-nombre" class="input-estandar" style="margin-bottom:0;" placeholder="Ej: Boda García — 20 septiembre" value="${escHtml(menuActual.nombre)}" oninput="MenuEspecial.actualizarNombre(this.value)">
                </div>
                <label class="me-check-label"><input type="checkbox" ${menuActual.logo ? 'checked' : ''} onchange="MenuEspecial.toggleLogo(this.checked)"> 🎾 Logo RG</label>
                <label class="me-check-label"><input type="checkbox" ${menuActual.idiomas.es ? 'checked' : ''} onchange="MenuEspecial.toggleIdioma('es', this.checked)"> 🇪🇸 Español</label>
                <label class="me-check-label"><input type="checkbox" ${menuActual.idiomas.en ? 'checked' : ''} onchange="MenuEspecial.toggleIdioma('en', this.checked)"> 🇬🇧 Inglés</label>
            </div>
            <div class="me-fila" style="margin-top:14px;">
                <button class="btn btn-success" onclick="MenuEspecial.guardarMenuActual()">💾 Guardar menú</button>
                <button class="btn btn-primary" onclick="MenuEspecial.imprimirMenuActual()">🖨️ Imprimir (A4 horizontal, 1 hoja, 2 menús)</button>
            </div>
        </div>`;

        SECCIONES_INFO.forEach(info => { html += renderSeccionHtml(info); });
        html += renderBebidaHtml();

        cont.innerHTML = html;
    }

    function renderSeccionHtml(info) {
        const sec = menuActual.secciones[info.key];
        const conEn = menuActual.idiomas.en;
        return `<div class="me-card">
            <div class="me-fila">
                <label class="me-check-label"><input type="checkbox" ${sec.activo ? 'checked' : ''} onchange="MenuEspecial.toggleSeccion('${info.key}', this.checked)"> ${info.titulo}</label>
                ${info.conCompartir ? `<label class="me-check-label me-sub-check"><input type="checkbox" ${sec.compartir ? 'checked' : ''} onchange="MenuEspecial.toggleCompartir(this.checked)"> A compartir (si no, se imprime "Entrantes" individual)</label>` : ''}
                ${info.conAElegir ? `<label class="me-check-label me-sub-check"><input type="checkbox" ${sec.aElegir ? 'checked' : ''} onchange="MenuEspecial.toggleAElegir('${info.key}', this.checked)"> A elegir (el comensal elige una opción de la lista)</label>` : ''}
            </div>
            ${sec.activo ? `
            <div style="margin-top:12px;">
                <div class="me-fila" style="margin-bottom:10px;">
                    <button class="btn btn-secondary" onclick="MenuEspecial.abrirModalPlatos('comida', '${info.key}')">🔍 Elegir platos de la carta (RG / US Open)...</button>
                </div>
                <div class="me-fila" style="margin-bottom:10px;">
                    <input type="text" id="me-input-manual-comida-${info.key}" class="input-estandar" style="flex:2;min-width:200px;margin-bottom:0;" placeholder="¿No está en la carta? Escríbelo aquí...">
                    ${conEn ? `<input type="text" id="me-input-manual-comida-${info.key}-en" class="input-estandar" style="flex:1;min-width:160px;margin-bottom:0;" placeholder="Nombre en inglés">` : ''}
                    <button class="btn btn-secondary" onclick="MenuEspecial.agregarPlatoManual('comida', '${info.key}')">+ Añadir manual</button>
                </div>
                <div id="me-lista-${info.key}">${renderListaPlatosHtml('comida', info.key)}</div>
            </div>` : ''}
        </div>`;
    }

    // Devuelve el array real (dentro de menuActual) donde viven los platos/vinos de un
    // "grupo|key" concreto -- centraliza el único sitio donde hay que saber que 'comida' vive en
    // menuActual.secciones[key].platos y 'vino' en menuActual.bebida[key].platos.
    function obtenerListaDestino(grupo, key) {
        return (grupo === 'vino') ? menuActual.bebida[key].platos : menuActual.secciones[key].platos;
    }

    // Id del <div> donde se pinta la lista de platos/vinos añadidos de un "grupo|key" concreto.
    function idListaPara(grupo, key) {
        return (grupo === 'vino') ? `me-lista-vino-${key}` : `me-lista-${key}`;
    }

    function renderListaPlatosHtml(grupo, key) {
        const platos = obtenerListaDestino(grupo, key);
        if (!platos.length) return `<p style="font-size:0.8rem;color:#999;margin:0;">Ningún ${grupo === 'vino' ? 'vino' : 'plato'} añadido todavía.</p>`;
        const conEn = menuActual.idiomas.en;
        return platos.map((p, i) => {
            const tag = p.manual
                ? `<span class="me-plato-tag me-tag-manual">Manual</span>`
                : (p.modo === 'restaurante002' ? `<span class="me-plato-tag me-tag-us">US Open</span>` : `<span class="me-plato-tag me-tag-rg">RG</span>`);
            const nombre = (conEn && p.en) ? `${escHtml(p.es)} <span style="color:#999;">/ ${escHtml(p.en)}</span>` : escHtml(p.es);
            return `<div class="me-plato-row">
                <span class="me-plato-nombre">${tag}${nombre}</span>
                <button class="me-btn-quitar" onclick="MenuEspecial.quitarPlato('${grupo}', '${key}', ${i})" title="Quitar">✕</button>
            </div>`;
        }).join('');
    }

    function renderVinoSlotHtml(w) {
        const slot = menuActual.bebida[w.key];
        const conEn = menuActual.idiomas.en;
        return `<div style="flex:1;min-width:230px;">
            <label class="me-check-label" style="margin-bottom:6px;"><input type="checkbox" ${slot.activo ? 'checked' : ''} onchange="MenuEspecial.toggleVino('${w.key}', this.checked)"> ${w.emoji} ${escHtml(w.tituloEs)}</label>
            ${slot.activo ? `
            <div class="me-fila" style="margin-bottom:8px;">
                <button class="btn btn-secondary" style="font-size:0.78rem;padding:6px 10px;" onclick="MenuEspecial.abrirModalPlatos('vino', '${w.key}')">🔍 Elegir de la carta...</button>
            </div>
            <div class="me-fila" style="margin-bottom:8px;">
                <input type="text" id="me-input-manual-vino-${w.key}" class="input-estandar" style="flex:1;min-width:140px;margin-bottom:0;font-size:0.8rem;" placeholder="¿No está en la carta? Escríbelo...">
                ${conEn ? `<input type="text" id="me-input-manual-vino-${w.key}-en" class="input-estandar" style="flex:1;min-width:120px;margin-bottom:0;font-size:0.8rem;" placeholder="En inglés">` : ''}
                <button class="btn btn-secondary" style="font-size:0.78rem;padding:6px 10px;" onclick="MenuEspecial.agregarPlatoManual('vino', '${w.key}')">+ Añadir</button>
            </div>
            <div id="me-lista-vino-${w.key}">${renderListaPlatosHtml('vino', w.key)}</div>
            ` : ''}
        </div>`;
    }

    function renderBebidaHtml() {
        const b = menuActual.bebida;
        return `<div class="me-card">
            <label class="label-seccion">🥤 Bebida</label>
            <div class="me-fila" style="margin-bottom:14px;">
                <label class="me-check-label me-sub-check"><input type="checkbox" ${b.agua ? 'checked' : ''} onchange="MenuEspecial.toggleBebida('agua', this.checked)"> Agua</label>
                <label class="me-check-label me-sub-check"><input type="checkbox" ${b.cerveza ? 'checked' : ''} onchange="MenuEspecial.toggleBebida('cerveza', this.checked)"> Cerveza</label>
                <label class="me-check-label me-sub-check"><input type="checkbox" ${b.refresco ? 'checked' : ''} onchange="MenuEspecial.toggleBebida('refresco', this.checked)"> Refresco</label>
                <label class="me-check-label me-sub-check"><input type="checkbox" ${b.cafe ? 'checked' : ''} onchange="MenuEspecial.toggleBebida('cafe', this.checked)"> Café o infusiones</label>
            </div>
            <div class="me-fila" style="align-items:flex-start;flex-wrap:wrap;gap:18px;">
                ${WINES_INFO.map(renderVinoSlotHtml).join('')}
            </div>
        </div>`;
    }

    // =================================================================================
    // POPUP DE SELECCIÓN — grande, con buscador + filtro de restaurante, un check por fila
    // (multi-selección) y "+ Añadir seleccionados" para meterlos todos de golpe. Un ÚNICO popup
    // genérico sirve tanto para elegir platos (grupo 'comida', para Entrantes/Primero/
    // Principal/Postre) como para elegir vinos (grupo 'vino', para cada uno de los 4 vinos de
    // Bebida) -- lo único que cambia es de qué "pool" saca las opciones (poolParaModal) y en qué
    // lista de menuActual las mete al confirmar (obtenerListaDestino). El pool está SIEMPRE
    // acotado de forma estricta:
    //  - grupo 'comida': solo Postre ve platos tipo:'postre'; el resto de secciones ve todo lo
    //    demás (tipo:'principal') -- nunca se mezclan platos de Postre con los de otra sección.
    //  - grupo 'vino': cada uno de los 4 vinos ve SOLO su propio tipo (blanco/rosado/tinto/cava),
    //    nunca los de otro vino.
    // =================================================================================
    function abrirModalPlatos(grupo, key) {
        modalGrupoActual = grupo;
        modalSeccionActual = key;
        Object.keys(seleccionEnModal).forEach(k => delete seleccionEnModal[k]);
        const buscar = document.getElementById('me-modal-buscar');
        const filtro = document.getElementById('me-modal-filtro-restaurante');
        if (buscar) buscar.value = '';
        if (filtro) filtro.value = '';

        let titulo = '';
        let tituloModal = '🍽️ Elegir platos';
        if (grupo === 'vino') {
            const w = WINES_INFO.find(x => x.key === key);
            titulo = w ? w.tituloEs : '';
            tituloModal = '🍷 Elegir vinos';
        } else {
            const s = SECCIONES_INFO.find(x => x.key === key);
            titulo = s ? s.titulo : '';
        }
        const tituloEl = document.getElementById('me-modal-titulo');
        if (tituloEl) tituloEl.textContent = tituloModal;
        const sub = document.getElementById('me-modal-subtitulo');
        if (sub) sub.textContent = titulo ? `Añadiendo a: ${titulo}` : '';

        renderModalLista();
        const modal = document.getElementById('me-modal-platos');
        if (modal) modal.style.display = 'flex';
    }

    function cerrarModalPlatos() {
        const modal = document.getElementById('me-modal-platos');
        if (modal) modal.style.display = 'none';
        modalGrupoActual = null;
        modalSeccionActual = null;
    }

    function filtrarModalLista() { renderModalLista(); }

    // El conjunto de opciones que puede ofrecer el popup abierto ahora mismo, ya estrictamente
    // acotado según grupo/tipo (ver comentario de arriba).
    function poolParaModal() {
        if (modalGrupoActual === 'vino') {
            const w = WINES_INFO.find(x => x.key === modalSeccionActual);
            const tipo = w ? w.tipo : null;
            return indiceVinos.filter(v => v.tipo === tipo);
        }
        const esPostre = modalSeccionActual === 'postre';
        return platosParaPopup.filter(p => esPostre ? p.tipo === 'postre' : p.tipo !== 'postre');
    }

    function renderModalLista() {
        const cont = document.getElementById('me-modal-lista');
        if (!cont || !modalSeccionActual || !modalGrupoActual) return;
        const buscarEl = document.getElementById('me-modal-buscar');
        const filtroEl = document.getElementById('me-modal-filtro-restaurante');
        const textoBusqueda = (buscarEl && buscarEl.value || '').trim().toLowerCase();
        const filtroModo = filtroEl ? filtroEl.value : '';

        const yaAnadidos = new Set(
            obtenerListaDestino(modalGrupoActual, modalSeccionActual).filter(p => !p.manual).map(p => claveModoId(p.modo, p.id))
        );

        const items = poolParaModal().filter(p => {
            if (yaAnadidos.has(claveModoId(p.modo, p.id))) return false;
            if (filtroModo && p.modo !== filtroModo) return false;
            if (textoBusqueda && p.es.toLowerCase().indexOf(textoBusqueda) === -1) return false;
            return true;
        });

        if (!items.length) {
            cont.innerHTML = `<p style="font-size:0.82rem;color:#999;text-align:center;padding:24px 0;">No hay ${modalGrupoActual === 'vino' ? 'vinos' : 'platos'} que coincidan (o ya están todos añadidos).</p>`;
            actualizarContadorModal();
            return;
        }

        cont.innerHTML = items.map(p => {
            const clave = claveModoId(p.modo, p.id);
            const marcado = !!seleccionEnModal[clave];
            const tag = p.modo === 'restaurante002' ? `<span class="me-plato-tag me-tag-us">US Open</span>` : `<span class="me-plato-tag me-tag-rg">RG</span>`;
            return `<label class="me-modal-plato-row">
                <input type="checkbox" ${marcado ? 'checked' : ''} onchange="MenuEspecial.toggleSeleccionModal('${clave}', this.checked)">
                <span>${tag}${escHtml(p.es)}</span>
            </label>`;
        }).join('');
        actualizarContadorModal();
    }

    function toggleSeleccionModal(clave, marcado) {
        if (marcado) seleccionEnModal[clave] = true; else delete seleccionEnModal[clave];
        actualizarContadorModal();
    }

    function actualizarContadorModal() {
        const el = document.getElementById('me-modal-contador');
        if (el) el.textContent = Object.keys(seleccionEnModal).length;
    }

    function confirmarSeleccionPlatos() {
        if (!modalSeccionActual || !modalGrupoActual) return;
        const claves = Object.keys(seleccionEnModal);
        const grupo = modalGrupoActual;
        const key = modalSeccionActual;
        if (claves.length) {
            const poolOrigen = (grupo === 'vino') ? indiceVinos : platosParaPopup;
            const destino = obtenerListaDestino(grupo, key);
            claves.forEach(clave => {
                const idxSep = clave.indexOf('|');
                const modo = clave.substring(0, idxSep);
                const id = parseInt(clave.substring(idxSep + 1), 10);
                const p = poolOrigen.find(x => x.modo === modo && x.id === id);
                if (p) destino.push({ manual: false, modo: p.modo, id: p.id, es: p.es, en: p.en });
            });
        }
        cerrarModalPlatos();
        const listaEl = document.getElementById(idListaPara(grupo, key));
        if (listaEl) listaEl.innerHTML = renderListaPlatosHtml(grupo, key);
    }

    // =================================================================================
    // ACCIONES — expuestas en window.MenuEspecial, llamadas desde los onclick/onchange/oninput
    // generados arriba.
    // =================================================================================
    function actualizarNombre(v) { menuActual.nombre = v; }
    function toggleLogo(v) { menuActual.logo = v; }

    function toggleIdioma(lang, v) {
        const otro = (lang === 'es') ? 'en' : 'es';
        if (!v && !menuActual.idiomas[otro]) {
            alert('Debe quedar activado al menos un idioma (Español o Inglés).');
            renderFormulario(); // revierte el checkbox visualmente, el estado no ha cambiado
            return;
        }
        menuActual.idiomas[lang] = v;
        renderFormulario();
    }

    function toggleSeccion(key, v) { menuActual.secciones[key].activo = v; renderFormulario(); }
    function toggleCompartir(v) { menuActual.secciones.entrantes.compartir = v; renderFormulario(); }
    function toggleAElegir(key, v) { menuActual.secciones[key].aElegir = v; }
    function toggleBebida(key, v) { menuActual.bebida[key] = v; }
    function toggleVino(key, v) { menuActual.bebida[key].activo = v; renderFormulario(); }

    function agregarPlatoManual(grupo, key) {
        const prefijo = `me-input-manual-${grupo}-${key}`;
        const inputEs = document.getElementById(prefijo);
        const inputEn = document.getElementById(prefijo + '-en');
        if (!inputEs) return;
        const valor = (inputEs.value || '').trim();
        if (!valor) return;
        obtenerListaDestino(grupo, key).push({ manual: true, modo: null, id: null, es: valor, en: inputEn ? (inputEn.value || '').trim() : '' });
        inputEs.value = '';
        if (inputEn) inputEn.value = '';
        const listaEl = document.getElementById(idListaPara(grupo, key));
        if (listaEl) listaEl.innerHTML = renderListaPlatosHtml(grupo, key);
    }

    function quitarPlato(grupo, key, index) {
        obtenerListaDestino(grupo, key).splice(index, 1);
        const listaEl = document.getElementById(idListaPara(grupo, key));
        if (listaEl) listaEl.innerHTML = renderListaPlatosHtml(grupo, key);
    }

    function nuevoMenu() {
        if (menuActual && (menuActual.nombre || algunaSeccionConPlatos(menuActual)) &&
            !confirm('¿Empezar un menú nuevo? Se perderá cualquier cambio sin guardar del que estás editando ahora.')) return;
        menuActual = nuevoMenuVacio();
        renderFormulario();
        renderSidebarLista();
    }

    async function refrescarLista() {
        mostrarCargando(true, '🔄 Actualizando lista de menús...');
        try { menusGuardados = await listarMenus(); } finally { mostrarCargando(false); }
        renderSidebarLista();
    }

    function cargarMenu(id) {
        const m = buscarMenuPorId(id);
        if (!m) { alert('No se ha encontrado ese menú (puede que la lista esté desactualizada — pulsa "🔄 Refrescar lista").'); return; }
        menuActual = mergeMenuDesdeGuardado(m);
        renderFormulario();
        renderSidebarLista();
    }

    function duplicarMenu(id) {
        const m = buscarMenuPorId(id);
        if (!m) return;
        menuActual = mergeMenuDesdeGuardado(m);
        menuActual.id = null;
        menuActual.nombre = m.nombre + ' (copia)';
        renderFormulario();
        renderSidebarLista();
    }

    async function guardarMenuActual() {
        if (!menuActual.nombre || !menuActual.nombre.trim()) {
            alert('Ponle un nombre al menú antes de guardarlo (por ejemplo, el evento o la fecha).');
            return;
        }
        mostrarCargando(true, '💾 Guardando menú...');
        try {
            await guardarMenuEnServidor(menuActual);
            renderSidebarLista();
            alert('✅ Menú guardado correctamente.');
        } catch (e) {
            console.error('[MenuEspecial] Error al guardar el menú:', e);
            alert('❌ No se ha podido guardar el menú. Revisa la conexión e inténtalo de nuevo.');
        } finally {
            mostrarCargando(false);
        }
    }

    async function eliminarMenu(id) {
        const m = buscarMenuPorId(id);
        const nombre = m ? m.nombre : '';
        if (!confirm(`¿Seguro que quieres borrar el menú "${nombre}"? Esta acción no se puede deshacer.`)) return;
        mostrarCargando(true, '🗑️ Borrando menú...');
        try {
            await eliminarMenuEnServidor(id);
            if (menuActual && String(menuActual.id) === String(id)) { menuActual = nuevoMenuVacio(); renderFormulario(); }
            renderSidebarLista();
        } catch (e) {
            console.error('[MenuEspecial] Error al borrar el menú:', e);
            alert('❌ No se ha podido borrar el menú. Revisa la conexión e inténtalo de nuevo.');
        } finally {
            mostrarCargando(false);
        }
    }

    function algunaSeccionConPlatos(menu) {
        return SECCIONES_INFO.some(info => menu.secciones[info.key].activo && menu.secciones[info.key].platos.length > 0);
    }

    // =================================================================================
    // IMPRESIÓN — A4 horizontal, SIEMPRE en una sola hoja (no negociable): 2 copias del mismo
    // menú por hoja con una línea de corte discontinua en el centro (guillotina), reduciendo la
    // letra automáticamente (con márgenes/paddings apretados desde el principio) si el
    // contenido no cabe a tamaño normal — mismo tipo de ajuste automático que ya usa
    // "Sugerencias" (ajustarAUnaPagina en sugerencias-print.js), simplificado aquí a un único
    // factor de escala en em (texto + espaciados + logo escalan juntos) porque el contenido de
    // un menú especial es mucho más corto que una carta completa. Se usa el MISMO patrón de
    // ventana emergente (window.open + document.write) que ya usa sugerencias-print.js, en vez
    // de @media print sobre la propia interfaz del editor.
    // =================================================================================
    function construirHtmlMenuImpreso(menu) {
        const mostrarEs = menu.idiomas.es;
        const mostrarEn = menu.idiomas.en;

        function nombrePlato(p) {
            const es = escHtml(p.es);
            const en = escHtml(p.en);
            if (mostrarEs && mostrarEn) return en ? `${es}<br><em>${en}</em>` : es;
            if (mostrarEn && !mostrarEs) return en || es;
            return es;
        }

        // Etiqueta de una categoría/título en el idioma o idiomas activos: "Vino Blanco / White
        // Wine" si ES+EN están los dos activos, solo uno de los dos si solo hay uno activo --
        // MISMO criterio en todos los títulos de sección y de vino (nunca el nombre del propio
        // plato/vino, que es libre y no se traduce, ver más abajo).
        function etiquetaBilingue(tituloEs, tituloEn) {
            if (mostrarEs && mostrarEn) return `${escHtml(tituloEs)} / ${escHtml(tituloEn)}`;
            if (mostrarEn && !mostrarEs) return escHtml(tituloEn);
            return escHtml(tituloEs);
        }

        function seccionHtml(info) {
            const sec = menu.secciones[info.key];
            if (!sec.activo || !sec.platos.length) return '';
            let sufijoEs = '', sufijoEn = '';
            if (info.key === 'entrantes' && sec.compartir) {
                sufijoEs = ' - A Compartir'; sufijoEn = ' - To Share';
            } else if (info.conAElegir && sec.aElegir) {
                sufijoEs = ' - A Elegir'; sufijoEn = ' - To Choose';
            }
            const titulo = etiquetaBilingue(info.titulo + sufijoEs, info.tituloEn + sufijoEn);
            const items = sec.platos.map(p => `<div class="me-print-plato">${nombrePlato(p)}</div>`).join('');
            return `<div class="me-print-seccion"><div class="me-print-seccion-titulo">${titulo}</div>${items}</div>`;
        }

        const bebidaItems = [];
        // Agua/Cerveza/Refresco en una única línea (más compacto); Café e infusiones aparte,
        // como pidió el usuario.
        const basicos = [];
        if (menu.bebida.agua) basicos.push(mostrarEs ? 'Agua' : 'Water');
        if (menu.bebida.cerveza) basicos.push(mostrarEs ? 'Cerveza' : 'Beer');
        if (menu.bebida.refresco) basicos.push(mostrarEs ? 'Refresco' : 'Soft drink');
        if (basicos.length) bebidaItems.push(basicos.join(mostrarEs && mostrarEn ? ' · ' : ', '));
        if (menu.bebida.cafe) bebidaItems.push(mostrarEs ? 'Café o infusiones' : 'Coffee or tea');
        // Los NOMBRES de los vinos van solo en castellano (son nombres propios/marca, no hace
        // falta repetirlos en inglés) -- solo la ETIQUETA de la categoría ("Vino Blanco / White
        // Wine:") es bilingüe si ES+EN están los dos activos.
        WINES_INFO.forEach(w => {
            const slot = menu.bebida[w.key];
            if (slot.activo && slot.platos && slot.platos.length) {
                const etiqueta = etiquetaBilingue(w.tituloEs, w.tituloEn);
                const nombres = slot.platos.map(p => escHtml(p.es)).join(', ');
                bebidaItems.push(`${etiqueta}: ${nombres}`);
            }
        });
        const bebidaHtml = bebidaItems.length
            ? `<div class="me-print-seccion"><div class="me-print-seccion-titulo">${etiquetaBilingue('Bebida', 'Drinks')}</div>${bebidaItems.map(t => `<div class="me-print-plato">${t}</div>`).join('')}</div>`
            : '';

        const logoHtml = menu.logo ? `<img src="logo RG_REST.png" class="me-print-logo" alt="Logo RG">` : '';

        return `<div class="me-print-menu"><div class="me-print-inner">
            ${logoHtml}
            <div class="me-print-titulo">${escHtml(menu.nombre || 'Menú')}</div>
            ${SECCIONES_INFO.map(seccionHtml).join('')}
            ${bebidaHtml}
        </div></div>`;
    }

    function imprimir(menu) {
        if (!menu) return;
        if (!menu.nombre && !algunaSeccionConPlatos(menu)) {
            if (!confirm('El menú está vacío y sin nombre. ¿Imprimir igualmente?')) return;
        }
        const menuHtml = construirHtmlMenuImpreso(menu);
        // ALTO_DISPONIBLE_MM = 210mm (A4 horizontal) - 2×6mm de margen VERTICAL de @page = 198mm
        // (el margen HORIZONTAL se apretó más, a 4mm, a petición del usuario -- no afecta a este
        // cálculo, que solo mide el alto disponible de la página). Ver ALTO_DISPONIBLE_MM más
        // abajo en scriptAjuste, debe coincidir con este margen vertical si se vuelve a tocar.
        const estilos = `
            * { box-sizing: border-box; }
            html, body { margin:0; }
            body { font-family: 'Montserrat', Georgia, serif; -webkit-print-color-adjust: exact; }
            @page { size: A4 landscape; margin: 6mm 4mm; }
            .me-print-sheet { display:flex; width:100%; }
            .me-print-menu { flex:1 1 50%; padding: 4mm 5mm; display:flex; flex-direction:column; align-items:center; }
            .me-print-inner { width:100%; display:flex; flex-direction:column; align-items:center; text-align:center; font-size:13px; }
            .me-print-cutline { width:0; border-left:1.5px dashed #999; position:relative; margin:0 2mm; }
            .me-print-cutline::before, .me-print-cutline::after { content:'✂'; position:absolute; left:50%; transform:translateX(-50%) rotate(90deg); font-size:13px; color:#999; }
            .me-print-cutline::before { top:-6mm; }
            .me-print-cutline::after { bottom:-6mm; }
            .me-print-logo { max-height:4.4em; max-width:13em; object-fit:contain; margin-bottom:0.5em; }
            .me-print-titulo { font-size:1.65em; font-weight:800; letter-spacing:0.02em; text-transform:uppercase; margin-bottom:0.85em; }
            .me-print-seccion { width:100%; max-width:31em; margin:0 auto 0.5em auto; }
            .me-print-seccion-titulo { font-size:0.82em; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#b8860b; border-bottom:1px solid #ddd; padding-bottom:0.15em; margin-bottom:0.3em; }
            .me-print-plato { font-size:0.92em; line-height:1.25; margin-bottom:0.22em; }
            .me-print-plato em { font-style:italic; color:#555; font-size:0.85em; }
        `;
        const bodyHtml = `<div class="me-print-sheet">${menuHtml}<div class="me-print-cutline"></div>${menuHtml}</div>`;

        // Script embebido en la propia ventana emergente: espera imágenes/fuentes, mide el
        // alto real disponible de la página (misma técnica de "sonda" que ya usa
        // ajustarAUnaPagina en sugerencias-print.js: crear un div oculto con una altura en mm
        // conocida y leer a cuántos px equivale, evitando asumir una resolución fija) y reduce
        // el font-size de .me-print-inner (todo lo demás está en "em", así que espaciados y
        // logo se achican en proporción) hasta que quepa en una sola hoja, o hasta un mínimo
        // legible -- si ni así cupiera (menú realmente muy largo), avisa y deja decidir.
        const scriptAjuste = `
            (function () {
                var ALTO_DISPONIBLE_MM = 198;
                var BASE_PX = 13;
                var FACTOR_MIN = 0.62;
                var PASO = 0.035;
                var MAX_INTENTOS = 16;

                function alturaDisponiblePx() {
                    var probe = document.createElement('div');
                    probe.style.cssText = 'position:absolute; visibility:hidden; height:' + ALTO_DISPONIBLE_MM + 'mm; width:0;';
                    document.body.appendChild(probe);
                    var px = probe.getBoundingClientRect().height;
                    document.body.removeChild(probe);
                    return px;
                }

                function aplicarFactor(f) {
                    var styleEl = document.getElementById('me-ajuste-dinamico');
                    if (styleEl) styleEl.textContent = '.me-print-inner{ font-size:' + (BASE_PX * f) + 'px !important; }';
                }

                function ajustarYimprimir() {
                    var maxAlturaPx = alturaDisponiblePx();
                    var menuEl = document.querySelector('.me-print-menu');
                    if (!menuEl) { window.print(); return; }

                    function cabe() { void menuEl.offsetHeight; return menuEl.getBoundingClientRect().height <= maxAlturaPx; }

                    var factor = 1, intentos = 0;
                    aplicarFactor(factor);
                    while (!cabe() && intentos < MAX_INTENTOS && (factor - PASO) >= FACTOR_MIN) {
                        factor -= PASO;
                        aplicarFactor(factor);
                        intentos++;
                    }

                    if (cabe()) {
                        setTimeout(function () { window.print(); }, 150);
                    } else {
                        var aviso = document.createElement('div');
                        aviso.style.cssText = 'position:fixed; top:10px; left:50%; transform:translateX(-50%); background:#fef2f2; border:1px solid #dc2626; color:#991b1b; padding:10px 16px; border-radius:8px; font-family:sans-serif; font-size:13px; z-index:9999; text-align:center; box-shadow:0 4px 10px rgba(0,0,0,0.15);';
                        aviso.innerHTML = '⚠️ Hay demasiados platos para que quepa todo en una sola hoja, incluso con la letra al mínimo legible.<br>Quita algún plato del menú antes de imprimir.<br><button id="me-print-btn-forzar" style="margin-top:8px;cursor:pointer;background:#dc2626;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;">Imprimir de todas formas</button>';
                        document.body.appendChild(aviso);
                        document.getElementById('me-print-btn-forzar').onclick = function () {
                            aviso.parentNode.removeChild(aviso);
                            window.print();
                        };
                    }
                }

                function esperar() {
                    var imgs = Array.prototype.slice.call(document.images);
                    var promesasImgs = imgs.map(function (img) {
                        if (img.complete) return Promise.resolve();
                        return new Promise(function (res) { img.onload = img.onerror = res; });
                    });
                    var promesaFuentes = (document.fonts && document.fonts.ready) ? document.fonts.ready.catch(function () {}) : Promise.resolve();
                    return Promise.all(promesasImgs.concat([promesaFuentes])).then(function () {
                        return new Promise(function (res) { requestAnimationFrame(function () { requestAnimationFrame(res); }); });
                    });
                }

                esperar().then(ajustarYimprimir);
            })();
        `;

        const pWin = window.open('', '_blank', 'width=1100,height=800');
        if (!pWin) { alert('El navegador ha bloqueado la ventana de impresión (bloqueador de pop-ups). Permite las ventanas emergentes para esta web e inténtalo de nuevo.'); return; }
        pWin.document.write(`<html><head><title>${escHtml(menu.nombre || 'Menú Especial')}</title><style>${estilos}</style><style id="me-ajuste-dinamico"></style></head><body>${bodyHtml}<script>${scriptAjuste}<\/script></body></html>`);
        pWin.document.close();
    }

    function imprimirMenuActual() { imprimir(menuActual); }

    function imprimirMenuGuardado(id) {
        const m = buscarMenuPorId(id);
        if (!m) { alert('No se ha encontrado ese menú.'); return; }
        imprimir(mergeMenuDesdeGuardado(m));
    }

    // =================================================================================
    // PRECARGA DE ÍNDICES — punto único que deja platosParaPopup/indiceVinos listos, con el
    // mismo espíritu de "no repetir trabajo" que ya usa cargarYCachearModo() de app.js para
    // RG/US Open: si ya se cargaron antes (típicamente por precargarEnSegundoPlano() más abajo,
    // lanzada al arrancar la web -- ver index.html) no se vuelve a tocar la red ni a reprocesar
    // nada; si ya hay una carga en marcha (dos llamadas casi a la vez) se espera esa misma en
    // vez de lanzar una segunda en paralelo.
    // =================================================================================
    let indicesListos = false;
    let indicesPromesaEnCurso = null;

    async function asegurarIndicesCargados() {
        if (indicesListos) return;
        if (indicesPromesaEnCurso) { await indicesPromesaEnCurso; return; }
        indicesPromesaEnCurso = cargarIndiceDePlatos().then(() => { indicesListos = true; });
        try {
            await indicesPromesaEnCurso;
        } finally {
            indicesPromesaEnCurso = null;
        }
    }

    // NUEVO: precarga en segundo plano (sin overlay, sin tocar la interfaz de esta pestaña --
    // de hecho puede llamarse ANTES de que construirEsqueleto() haya montado nada) de las
    // cartas de RG y US Open que necesita "Menú Especial". Pensada para lanzarse nada más
    // arrancar la web, exactamente igual que ya hace precargarEnSegundoPlano(otroModo) en
    // app.js con "el otro restaurante" del Editor normal (ver index.html) -- de hecho, como
    // cargarIndiceDePlatos() reutiliza cargarYCachearModo() (la misma caché compartida de
    // siempre), si RG/US Open ya se estaban cargando o ya estaban en caché por ese motivo, esto
    // no duplica ninguna descarga, solo se une a la que ya hubiera en marcha o reutiliza el
    // resultado ya guardado. Respeta el mismo checkbox "⚡ Precargar" de la cabecera (mismo
    // localStorage que ya usa esa función de app.js) para no descargar nada si el usuario lo
    // desactivó.
    async function precargarEnSegundoPlano() {
        try {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('precargaSegundoPlanoDesactivada') === '1') return;
        } catch (e) { /* si localStorage no está disponible, seguimos con la precarga activada */ }
        try {
            await asegurarIndicesCargados();
        } catch (e) {
            // Una precarga fallida no es un error visible para el usuario: si de verdad entra
            // en la pestaña, init() simplemente hará la carga normal en ese momento.
            console.warn('[MenuEspecial] Precarga en segundo plano falló (sin problema):', e);
        }
    }

    // =================================================================================
    // INICIALIZACIÓN — llamada desde switchTab() en index.html cada vez que se abre la
    // pestaña. No reinicia menuActual si ya había uno en edición (para no perder cambios al
    // cambiar de pestaña y volver). Si los índices de platos/vinos YA estaban listos (lo más
    // habitual gracias a precargarEnSegundoPlano(), lanzada al arrancar la web -- ver
    // index.html) no muestra overlay de carga ni reprocesa nada, solo refresca la lista de
    // menús guardados (una petición GET ligera).
    // =================================================================================
    async function init() {
        inyectarEstilos();
        construirEsqueleto();
        if (!menuActual) menuActual = nuevoMenuVacio();

        const yaEstabanListos = indicesListos;
        if (!yaEstabanListos) mostrarCargando(true, '🍽️ Cargando cartas de RG y US Open...');
        try {
            await asegurarIndicesCargados();
            menusGuardados = await listarMenus();
        } finally {
            if (!yaEstabanListos) mostrarCargando(false);
        }

        renderSidebarLista();
        renderFormulario();
    }

    window.MenuEspecial = {
        init: init,
        precargarEnSegundoPlano: precargarEnSegundoPlano,
        nuevoMenu: nuevoMenu,
        refrescarLista: refrescarLista,
        cargarMenu: cargarMenu,
        duplicarMenu: duplicarMenu,
        guardarMenuActual: guardarMenuActual,
        eliminarMenu: eliminarMenu,
        imprimirMenuActual: imprimirMenuActual,
        imprimirMenuGuardado: imprimirMenuGuardado,
        actualizarNombre: actualizarNombre,
        toggleLogo: toggleLogo,
        toggleIdioma: toggleIdioma,
        toggleSeccion: toggleSeccion,
        toggleCompartir: toggleCompartir,
        toggleAElegir: toggleAElegir,
        toggleBebida: toggleBebida,
        toggleVino: toggleVino,
        agregarPlatoManual: agregarPlatoManual,
        quitarPlato: quitarPlato,
        abrirModalPlatos: abrirModalPlatos,
        cerrarModalPlatos: cerrarModalPlatos,
        filtrarModalLista: filtrarModalLista,
        toggleSeleccionModal: toggleSeleccionModal,
        confirmarSeleccionPlatos: confirmarSeleccionPlatos
    };
})();
