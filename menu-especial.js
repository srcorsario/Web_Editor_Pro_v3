// --- menu-especial.js ---
// NUEVO (18 sept): módulo de la pestaña "6. Menú Especial" — plantillas de menú de evento
// (boda/grupo/celebración), sin precio, con logo RG opcional, en ES y/o EN, con secciones
// Entrantes/Primero/Principal/Postre activables de forma independiente (cada una con varios
// platos posibles, sacados de la carta de RG y/o de US Open, o escritos a mano si el plato no
// está en ninguna carta), más una sección de Bebida fija (Agua/Cerveza/Refresco/Café o
// infusiones + Vino Blanco/Tinto "a especificar"). Los menús se guardan de verdad (no es solo
// una herramienta de "componer e imprimir") en un backend de Apps Script COMPLETAMENTE NUEVO e
// independiente de RG y de US Open (ver Codigo_MenusEspeciales.gs y
// config.js/WEBAPP_URL_MENUS_ESPECIALES) — así un menú puede mezclar libremente platos de las
// dos cartas sin "pertenecer" a ninguna. Se imprime en A4 horizontal, 2 copias por hoja con una
// guía de corte para la guillotina, igual que ya hace "Sugerencias" (sugerencias-print.js) con
// su patrón de ventana emergente (window.open + document.write) para no depender de @media
// print peleándose con el resto de la interfaz del editor.
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.menuEspecial = '1.0.0';

(function () {
    'use strict';

    // =================================================================================
    // ESTADO DEL MÓDULO
    // =================================================================================
    let indicePlatos = {};                    // "Nombre — RG" / "Nombre — US Open" -> {modo,id,es,en}
    let indiceVinos = { blanco: [], tinto: [] };
    let menusGuardados = [];                  // última lista conocida (GET listarMenus), más recientes primero
    let menuActual = null;                    // el menú que se está editando ahora mismo en pantalla

    const SECCIONES_INFO = [
        { key: 'entrantes', titulo: 'Entrantes', conCompartir: true },
        { key: 'primero', titulo: 'Primero' },
        { key: 'principal', titulo: 'Principal (Segundo)' },
        { key: 'postre', titulo: 'Postre' }
    ];

    function nuevoMenuVacio() {
        return {
            id: null,
            nombre: '',
            logo: true,
            idiomas: { es: true, en: false },
            secciones: {
                entrantes: { activo: true, compartir: false, platos: [] },
                primero: { activo: false, platos: [] },
                principal: { activo: true, platos: [] },
                postre: { activo: true, platos: [] }
            },
            bebida: {
                agua: true, cerveza: true, refresco: true, cafe: true,
                vinoBlanco: { activo: false, texto: '' },
                vinoTinto: { activo: false, texto: '' }
            }
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
            @media (max-width: 900px) { .me-layout { flex-direction: column; } .me-sidebar { width:100%; } }
        `;
        document.head.appendChild(style);
    }

    // =================================================================================
    // CARGA DE PLATOS — combina RG + US Open, reutilizando cargarYCachearModo(modo) de app.js
    // (misma caché de siempre, así no se duplica ninguna descarga de CSV ya hecha por el
    // editor normal). Se ejecutan en paralelo porque son independientes entre sí.
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

        indicePlatos = {};
        indiceVinos = { blanco: [], tinto: [] };

        // Limpia el "//" (segunda línea de ingredientes/opciones) del nombre para que la
        // plantilla de menú especial muestre solo el nombre principal del plato.
        function limpiarNombre(txt) { return (txt || '').split('//')[0].trim(); }

        function procesar(datos, modo, alias) {
            if (!Array.isArray(datos)) return;
            datos.forEach(item => {
                if (!item.activa) return; // solo platos activos en la web de verdad
                if (item.id >= 13000) {
                    // Vinos: se clasifican por rango de ID (ver estructuras.js — mismos rangos
                    // en RG y en US Open: 13100-13199 blancos, 13300-13399 tintos).
                    if (item.id >= 13100 && item.id < 13200) indiceVinos.blanco.push({ modo: modo, id: item.id, es: limpiarNombre(item.es), en: limpiarNombre(item.en) });
                    else if (item.id >= 13300 && item.id < 13400) indiceVinos.tinto.push({ modo: modo, id: item.id, es: limpiarNombre(item.es), en: limpiarNombre(item.en) });
                    return;
                }
                const nombreEs = limpiarNombre(item.es);
                if (!nombreEs) return;
                const label = `${nombreEs} — ${alias}`;
                indicePlatos[label] = { modo: modo, id: item.id, es: nombreEs, en: limpiarNombre(item.en) };
            });
        }
        procesar(datosRG, 'restaurante001', 'RG');
        procesar(datosUS, 'restaurante002', 'US Open');
    }

    function renderDatalists() {
        const dl = document.getElementById('me-datalist-platos');
        if (dl) dl.innerHTML = Object.keys(indicePlatos).sort().map(l => `<option value="${escHtml(l)}">`).join('');
        const dlBlanco = document.getElementById('me-datalist-vinoblanco');
        if (dlBlanco) dlBlanco.innerHTML = indiceVinos.blanco.map(v => `<option value="${escHtml(v.es)}">`).join('');
        const dlTinto = document.getElementById('me-datalist-vinotinto');
        if (dlTinto) dlTinto.innerHTML = indiceVinos.tinto.map(v => `<option value="${escHtml(v.es)}">`).join('');
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
    // anterior de la plantilla y luego se ha añadido algún campo nuevo).
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
        menu.bebida.vinoBlanco = Object.assign({}, base.bebida.vinoBlanco, (cfg.bebida && cfg.bebida.vinoBlanco) || {});
        menu.bebida.vinoTinto = Object.assign({}, base.bebida.vinoTinto, (cfg.bebida && cfg.bebida.vinoTinto) || {});
        return menu;
    }

    // =================================================================================
    // RENDER — esqueleto fijo (se construye una sola vez) + dos zonas que se repintan por
    // separado (sidebar de menús guardados / formulario de edición), para no reconstruir toda
    // la pestaña en cada tecla y perder el foco de los campos de texto que sí se escriben del
    // tirón (nombre del menú, texto de los vinos): esos campos NO disparan un repintado en cada
    // "input", solo actualizan el estado en memoria — se relee al guardar/imprimir.
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
            <datalist id="me-datalist-platos"></datalist>
            <datalist id="me-datalist-vinoblanco"></datalist>
            <datalist id="me-datalist-vinotinto"></datalist>
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
                    <label class="label-seccion">Nombre del menú</label>
                    <input type="text" id="me-nombre" class="input-estandar" style="margin-bottom:0;" placeholder="Ej: Boda García — 20 septiembre" value="${escHtml(menuActual.nombre)}" oninput="MenuEspecial.actualizarNombre(this.value)">
                </div>
                <label class="me-check-label"><input type="checkbox" ${menuActual.logo ? 'checked' : ''} onchange="MenuEspecial.toggleLogo(this.checked)"> 🎾 Logo RG</label>
                <label class="me-check-label"><input type="checkbox" ${menuActual.idiomas.es ? 'checked' : ''} onchange="MenuEspecial.toggleIdioma('es', this.checked)"> 🇪🇸 Español</label>
                <label class="me-check-label"><input type="checkbox" ${menuActual.idiomas.en ? 'checked' : ''} onchange="MenuEspecial.toggleIdioma('en', this.checked)"> 🇬🇧 Inglés</label>
            </div>
            <div class="me-fila" style="margin-top:14px;">
                <button class="btn btn-success" onclick="MenuEspecial.guardarMenuActual()">💾 Guardar menú</button>
                <button class="btn btn-primary" onclick="MenuEspecial.imprimirMenuActual()">🖨️ Imprimir (A4 horizontal, 2 por hoja)</button>
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
            </div>
            ${sec.activo ? `
            <div style="margin-top:12px;">
                <div class="me-fila" style="margin-bottom:10px;">
                    <input list="me-datalist-platos" id="me-input-${info.key}" class="input-estandar" style="flex:2;min-width:220px;margin-bottom:0;" placeholder="Escribe o elige un plato de la carta (RG / US Open)... o texto libre si no está en la carta">
                    ${conEn ? `<input type="text" id="me-input-${info.key}-en" class="input-estandar" style="flex:1;min-width:160px;margin-bottom:0;" placeholder="Nombre en inglés (solo si el plato es manual)">` : ''}
                    <button class="btn btn-secondary" onclick="MenuEspecial.agregarPlato('${info.key}')">+ Añadir</button>
                </div>
                <div id="me-lista-${info.key}">${renderListaPlatosHtml(info.key)}</div>
            </div>` : ''}
        </div>`;
    }

    function renderListaPlatosHtml(key) {
        const platos = menuActual.secciones[key].platos;
        if (!platos.length) return `<p style="font-size:0.8rem;color:#999;margin:0;">Ningún plato añadido todavía.</p>`;
        const conEn = menuActual.idiomas.en;
        return platos.map((p, i) => {
            const tag = p.manual
                ? `<span class="me-plato-tag me-tag-manual">Manual</span>`
                : (p.modo === 'restaurante002' ? `<span class="me-plato-tag me-tag-us">US Open</span>` : `<span class="me-plato-tag me-tag-rg">RG</span>`);
            const nombre = (conEn && p.en) ? `${escHtml(p.es)} <span style="color:#999;">/ ${escHtml(p.en)}</span>` : escHtml(p.es);
            return `<div class="me-plato-row">
                <span class="me-plato-nombre">${tag}${nombre}</span>
                <button class="me-btn-quitar" onclick="MenuEspecial.quitarPlato('${key}', ${i})" title="Quitar">✕</button>
            </div>`;
        }).join('');
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
            <div class="me-fila" style="align-items:flex-start;">
                <div style="flex:1;min-width:220px;">
                    <label class="me-check-label" style="margin-bottom:6px;"><input type="checkbox" ${b.vinoBlanco.activo ? 'checked' : ''} onchange="MenuEspecial.toggleVino('vinoBlanco', this.checked)"> 🥂 Vino Blanco</label>
                    ${b.vinoBlanco.activo ? `<input list="me-datalist-vinoblanco" class="input-estandar" style="margin-bottom:0;" placeholder="Elige uno de la carta o escribe el nombre..." value="${escHtml(b.vinoBlanco.texto)}" oninput="MenuEspecial.actualizarVinoTexto('vinoBlanco', this.value)">` : ''}
                </div>
                <div style="flex:1;min-width:220px;">
                    <label class="me-check-label" style="margin-bottom:6px;"><input type="checkbox" ${b.vinoTinto.activo ? 'checked' : ''} onchange="MenuEspecial.toggleVino('vinoTinto', this.checked)"> 🍷 Vino Tinto</label>
                    ${b.vinoTinto.activo ? `<input list="me-datalist-vinotinto" class="input-estandar" style="margin-bottom:0;" placeholder="Elige uno de la carta o escribe el nombre..." value="${escHtml(b.vinoTinto.texto)}" oninput="MenuEspecial.actualizarVinoTexto('vinoTinto', this.value)">` : ''}
                </div>
            </div>
        </div>`;
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
    function toggleBebida(key, v) { menuActual.bebida[key] = v; }
    function toggleVino(key, v) { menuActual.bebida[key].activo = v; renderFormulario(); }
    function actualizarVinoTexto(key, v) { menuActual.bebida[key].texto = v; }

    function agregarPlato(key) {
        const inputEs = document.getElementById(`me-input-${key}`);
        const inputEn = document.getElementById(`me-input-${key}-en`);
        if (!inputEs) return;
        const valor = (inputEs.value || '').trim();
        if (!valor) return;

        const match = indicePlatos[valor];
        let entrada;
        if (match) {
            entrada = { manual: false, modo: match.modo, id: match.id, es: match.es, en: match.en };
        } else {
            // No coincide con ningún plato de la carta: se guarda como plato manual (la
            // "categoría extra" que pedía el usuario para lo que no está en ninguna carta).
            entrada = { manual: true, modo: null, id: null, es: valor, en: inputEn ? (inputEn.value || '').trim() : '' };
        }
        menuActual.secciones[key].platos.push(entrada);
        inputEs.value = '';
        if (inputEn) inputEn.value = '';
        const listaEl = document.getElementById(`me-lista-${key}`);
        if (listaEl) listaEl.innerHTML = renderListaPlatosHtml(key);
    }

    function quitarPlato(key, index) {
        menuActual.secciones[key].platos.splice(index, 1);
        const listaEl = document.getElementById(`me-lista-${key}`);
        if (listaEl) listaEl.innerHTML = renderListaPlatosHtml(key);
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
    // IMPRESIÓN — A4 horizontal, 2 copias del mismo menú por hoja con una línea de corte
    // discontinua en el centro (guillotina). Se usa el MISMO patrón que ya usa
    // sugerencias-print.js (window.open('', ...) + document.write con estilos inline) en vez de
    // @media print sobre la propia interfaz del editor, para no arriesgarse a que la cabecera,
    // las pestañas o el overlay de carga se cuelen en el papel.
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

        function seccionHtml(info) {
            const sec = menu.secciones[info.key];
            if (!sec.activo || !sec.platos.length) return '';
            let titulo = info.titulo;
            if (info.key === 'entrantes') titulo = sec.compartir ? 'Entrantes - A Compartir' : 'Entrantes';
            const items = sec.platos.map(p => `<div class="me-print-plato">${nombrePlato(p)}</div>`).join('');
            return `<div class="me-print-seccion"><div class="me-print-seccion-titulo">${escHtml(titulo)}</div>${items}</div>`;
        }

        const bebidaItems = [];
        if (menu.bebida.agua) bebidaItems.push(mostrarEs ? 'Agua' : 'Water');
        if (menu.bebida.cerveza) bebidaItems.push(mostrarEs ? 'Cerveza' : 'Beer');
        if (menu.bebida.refresco) bebidaItems.push(mostrarEs ? 'Refresco' : 'Soft drink');
        if (menu.bebida.cafe) bebidaItems.push(mostrarEs ? 'Café o infusiones' : 'Coffee or tea');
        if (menu.bebida.vinoBlanco.activo && menu.bebida.vinoBlanco.texto) bebidaItems.push(`${mostrarEs ? 'Vino Blanco' : 'White Wine'}: ${escHtml(menu.bebida.vinoBlanco.texto)}`);
        if (menu.bebida.vinoTinto.activo && menu.bebida.vinoTinto.texto) bebidaItems.push(`${mostrarEs ? 'Vino Tinto' : 'Red Wine'}: ${escHtml(menu.bebida.vinoTinto.texto)}`);
        const bebidaHtml = bebidaItems.length
            ? `<div class="me-print-seccion"><div class="me-print-seccion-titulo">${mostrarEs ? 'Bebida' : 'Drinks'}</div>${bebidaItems.map(t => `<div class="me-print-plato">${t}</div>`).join('')}</div>`
            : '';

        const logoHtml = menu.logo ? `<img src="logo RG_REST.png" class="me-print-logo" alt="Logo RG">` : '';

        return `<div class="me-print-menu">
            ${logoHtml}
            <div class="me-print-titulo">${escHtml(menu.nombre || 'Menú')}</div>
            ${SECCIONES_INFO.map(seccionHtml).join('')}
            ${bebidaHtml}
        </div>`;
    }

    function imprimir(menu) {
        if (!menu) return;
        if (!menu.nombre && !algunaSeccionConPlatos(menu)) {
            if (!confirm('El menú está vacío y sin nombre. ¿Imprimir igualmente?')) return;
        }
        const menuHtml = construirHtmlMenuImpreso(menu);
        const estilos = `
            * { box-sizing: border-box; }
            body { margin:0; font-family: 'Montserrat', Georgia, serif; -webkit-print-color-adjust: exact; }
            @page { size: A4 landscape; margin: 8mm; }
            .me-print-sheet { display:flex; width:100%; }
            .me-print-menu { flex:1 1 50%; padding: 8mm 12mm; display:flex; flex-direction:column; align-items:center; text-align:center; }
            .me-print-cutline { width:0; border-left:1.5px dashed #999; position:relative; margin:0 3mm; }
            .me-print-cutline::before, .me-print-cutline::after { content:'✂'; position:absolute; left:50%; transform:translateX(-50%) rotate(90deg); font-size:13px; color:#999; }
            .me-print-cutline::before { top:-6mm; }
            .me-print-cutline::after { bottom:-6mm; }
            .me-print-logo { max-width:120px; max-height:70px; object-fit:contain; margin-bottom:10px; }
            .me-print-titulo { font-size:20px; font-weight:800; letter-spacing:0.03em; text-transform:uppercase; margin-bottom:16px; }
            .me-print-seccion { width:100%; max-width:340px; margin-bottom:12px; }
            .me-print-seccion-titulo { font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#b8860b; border-bottom:1px solid #ddd; padding-bottom:3px; margin-bottom:6px; }
            .me-print-plato { font-size:13px; line-height:1.35; margin-bottom:5px; }
            .me-print-plato em { font-style:italic; color:#555; font-size:11px; }
        `;
        const bodyHtml = `<div class="me-print-sheet">${menuHtml}<div class="me-print-cutline"></div>${menuHtml}</div>`;

        const pWin = window.open('', '_blank', 'width=1100,height=800');
        if (!pWin) { alert('El navegador ha bloqueado la ventana de impresión (bloqueador de pop-ups). Permite las ventanas emergentes para esta web e inténtalo de nuevo.'); return; }
        pWin.document.write(`<html><head><title>${escHtml(menu.nombre || 'Menú Especial')}</title><style>${estilos}</style></head><body>${bodyHtml}<script>window.onload=function(){setTimeout(function(){window.print();},200);};<\/script></body></html>`);
        pWin.document.close();
    }

    function imprimirMenuActual() { imprimir(menuActual); }

    function imprimirMenuGuardado(id) {
        const m = buscarMenuPorId(id);
        if (!m) { alert('No se ha encontrado ese menú.'); return; }
        imprimir(mergeMenuDesdeGuardado(m));
    }

    // =================================================================================
    // INICIALIZACIÓN — llamada desde switchTab() en index.html cada vez que se abre la
    // pestaña. No reinicia menuActual si ya había uno en edición (para no perder cambios al
    // cambiar de pestaña y volver), pero SÍ refresca la lista de menús guardados y reconstruye
    // los índices de platos (baratos gracias a la caché de cargarYCachearModo).
    // =================================================================================
    async function init() {
        inyectarEstilos();
        construirEsqueleto();
        if (!menuActual) menuActual = nuevoMenuVacio();

        mostrarCargando(true, '🍽️ Cargando cartas de RG y US Open...');
        try {
            await cargarIndiceDePlatos();
            renderDatalists();
            menusGuardados = await listarMenus();
        } finally {
            mostrarCargando(false);
        }

        renderSidebarLista();
        renderFormulario();
    }

    window.MenuEspecial = {
        init: init,
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
        toggleBebida: toggleBebida,
        toggleVino: toggleVino,
        actualizarVinoTexto: actualizarVinoTexto,
        agregarPlato: agregarPlato,
        quitarPlato: quitarPlato
    };
})();
