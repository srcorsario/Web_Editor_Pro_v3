// =========================================================================================
// almacen-json.js — la carta en datos.json (GitHub) en vez de Google Sheets.
//
// Imita al Código.gs: intercepta las llamadas del editor a la URL de Apps Script / CSV
// publicado de cada modo (getWebAppUrl / getCsvUrl de config.js) y las resuelve contra el
// datos.json del repo de la web en GitHub:
//   GET  ?accion=csv            -> CSV con las mismas columnas y orden que "Hoja 1"
//   GET  ?accion=categorias     -> "ID,Activa" (las de "ocultas" en NO)
//   POST (sin accion)           -> guardado completo (misma mezcla que doPost: lo que no venga
//                                  en el payload se conserva; los platos que no vengan se borran)
//   POST ?accion=categorias     -> activa/desactiva pestaña o interruptor (fotos / info)
//   POST ?accion=infoplato      -> Info de un plato (+ huella INFO_HASH_FICHA)
// El resto de peticiones (Gemini, Menús Especiales...) pasan tal cual.
//
// Token de GitHub: se pide la 1ª vez y se guarda en este navegador (hace de contraseña).
// Para cambiarlo: consola -> AlmacenJSON.cambiarToken()
// activo (abajo): 'url' = solo con ?json en la dirección; true = siempre; false = nunca.
// Se carga justo después de config.js (ver index.html).
// =========================================================================================
(function () {
    'use strict';
    window.APP_VERSIONS = window.APP_VERSIONS || {};
    window.APP_VERSIONS.almacenJson = '1.0.0';

    const BASE_RG = [
        'ID', 'Precio', 'Activa', 'Nombre_ES', 'Carpeta', 'Archivo_Foto', 'Alergenos_Cod',
        'Nombre_EN', 'Nombre_DE', 'Nombre_FR', 'Nombre_IT', 'Nombre_RU', 'Nombre_NL',
        'Nombre_PL', 'Nombre_SV', 'Nombre_NO', 'Nombre_DA', 'Nombre_FI', 'Nombre_PT',
        'Nombre_RO', 'Nombre_HU', 'Nombre_CS', 'Nombre_EL', 'Nombre_TR', 'Nombre_AR',
        'Nombre_ZH', 'Nombre_JA', 'Nombre_CA', 'Nombre_EU', 'Nombre_GL', 'Nombre_VA', 'Nombre_KO',
        'Opciones_Inactivas'
    ];

    // ---------- CONFIGURACIÓN ----------
    const CONFIG = /*CONFIG_INICIO*/{
        // 'url'  = solo si abres el editor con ?json (en pruebas: el editor normal sigue con Sheets)
        // true   = siempre (cuando las webs reales pasen a JSON) · false = nunca
        activo: 'url',
        modos: {
            restaurante001: { repo: 'srcorsario/cartas-pruebas', ruta: 'rg/datos.json', restaurante: 'rg', columnasBase: BASE_RG },
            restaurante002: { repo: 'srcorsario/cartas-pruebas', ruta: 'usopen/datos.json', restaurante: 'usopen', columnasBase: BASE_RG }
        }
    }/*CONFIG_FIN*/;
    // -----------------------------------

    const fetchOriginal = window.fetch.bind(window);
    const CLAVE_TOKEN = 'almacenJson.token';
    const API = 'https://api.github.com/repos/';

    // ---------- token ----------
    function leerToken() { try { return localStorage.getItem(CLAVE_TOKEN) || ''; } catch (e) { return ''; } }
    function pedirToken(motivo) {
        const t = (window.prompt((motivo ? motivo + '\n\n' : '') +
            'Token de GitHub para leer y guardar la carta (datos.json).\nSe guarda solo en este navegador.') || '').trim();
        if (t) { try { localStorage.setItem(CLAVE_TOKEN, t); } catch (e) { } }
        return t;
    }
    function token() { return leerToken() || pedirToken(); }

    // ---------- utilidades ----------
    const b64aTexto = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));
    function textoAB64(txt) {
        const bytes = new TextEncoder().encode(txt);
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return btoa(bin);
    }
    const clonar = (o) => JSON.parse(JSON.stringify(o));
    const respuesta = (texto, estado, tipo) => new Response(texto, { status: estado || 200, headers: { 'Content-Type': tipo || 'text/plain; charset=utf-8' } });
    const idNum = (v) => parseFloat(v);

    function escaparCsv(v) {
        const t = (v === null || v === undefined) ? '' : String(v);
        return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }

    // ---------- datos.json <-> filas de "Hoja 1" ----------
    function cabecerasDe(datos, cfg) {
        const info = new Set(), extra = [];
        (datos.platos || []).forEach(p => {
            Object.keys(p.info || {}).forEach(k => info.add('INFO_' + k.toUpperCase()));
            Object.keys(p.extra || {}).forEach(k => { if (!extra.some(e => e.toUpperCase() === k.toUpperCase())) extra.push(k); });
        });
        const infos = Array.from(info).sort().map(k => 'INFO_' + k.replace('INFO_', '').toLowerCase());
        return cfg.columnasBase.concat(infos, extra, ['Hash_Fila']);
    }

    function valorDePlato(p, h) {
        const H = h.toUpperCase();
        switch (H) {
            case 'ID': return p.id;
            case 'PRECIO': return p.precio;
            case 'ACTIVA': return p.activa;
            case 'CARPETA': return p.carpeta;
            case 'ARCHIVO_FOTO': return p.archivo;
            case 'ALERGENOS_COD': return (p.alergenos || []).join(',');
            case 'OPCIONES_INACTIVAS': return (p.opcionesInactivas || []).join(',');
            case 'PRECIO_MEDIA': return p.precioMedia;
            case 'HASH_FILA': return '';
        }
        if (H.indexOf('NOMBRE_') === 0) return (p.nombre || {})[H.slice(7)];
        if (H.indexOf('INFO_') === 0) return (p.info || {})[H.slice(5)];
        const ex = p.extra || {};
        const k = Object.keys(ex).find(x => x.toUpperCase() === H);
        return k ? ex[k] : '';
    }

    // fila: { CABECERA_MAYUS: valor }. Parte del plato anterior para no perder nada que no
    // esté en las columnas de este editor (p. ej. precioMedia en RG).
    function platoDeFila(fila, previo) {
        const p = previo ? clonar(previo) : { id: '', activa: '', precio: '', precioMedia: '', carpeta: '', archivo: '', alergenos: [], opcionesInactivas: [], nombre: {}, info: {} };
        p.nombre = p.nombre || {}; p.info = p.info || {};
        const s = (v) => (v === null || v === undefined) ? '' : String(v).trim();
        Object.keys(fila).forEach(H => {
            const v = s(fila[H]);
            switch (H) {
                case 'ID': p.id = v; break;
                case 'PRECIO': p.precio = v; break;
                case 'ACTIVA': p.activa = v; break;
                case 'CARPETA': p.carpeta = v; break;
                case 'ARCHIVO_FOTO': p.archivo = v; break;
                case 'ALERGENOS_COD': p.alergenos = v.split(',').map(x => x.trim()).filter(x => x); break;
                case 'OPCIONES_INACTIVAS': p.opcionesInactivas = v.split(',').map(x => parseInt(x, 10)).filter(n => !isNaN(n)); break;
                case 'PRECIO_MEDIA': p.precioMedia = v; break;
                case 'HASH_FILA': break;
                default:
                    if (H.indexOf('NOMBRE_') === 0) { if (v) p.nombre[H.slice(7)] = v; else delete p.nombre[H.slice(7)]; }
                    else if (H.indexOf('INFO_') === 0) { if (v) p.info[H.slice(5)] = v; else delete p.info[H.slice(5)]; }
                    else {
                        p.extra = p.extra || {};
                        const k = Object.keys(p.extra).find(x => x.toUpperCase() === H) || H;
                        if (v) p.extra[k] = v; else delete p.extra[k];
                        if (!Object.keys(p.extra).length) delete p.extra;
                    }
            }
        });
        return p;
    }

    function csvDe(datos, cfg) {
        const cab = cabecerasDe(datos, cfg);
        const lineas = [cab.map(escaparCsv).join(',')];
        (datos.platos || []).forEach(p => lineas.push(cab.map(h => escaparCsv(valorDePlato(p, h))).join(',')));
        return lineas.join('\r\n');
    }

    // Mismo formato que hoja-a-json.ps1 (un plato por bloque) para que los cambios se lean bien.
    function serializar(d) {
        const J = JSON.stringify;
        const dic = (o, sangria) => {
            const ks = Object.keys(o || {});
            if (!ks.length) return '{}';
            return '{\n' + ks.map(k => sangria + '    ' + J(k) + ': ' + J(String(o[k]))).join(',\n') + '\n' + sangria + '}';
        };
        const platos = (d.platos || []).map(p => {
            let b = '    {\n' +
                '        "id": ' + J(String(p.id)) + ', "activa": ' + J(String(p.activa || '')) +
                ', "precio": ' + J(String(p.precio == null ? '' : p.precio)) + ', "precioMedia": ' + J(String(p.precioMedia == null ? '' : p.precioMedia)) + ',\n' +
                '        "carpeta": ' + J(String(p.carpeta || '')) + ', "archivo": ' + J(String(p.archivo || '')) + ',\n' +
                '        "alergenos": ' + J(p.alergenos || []).replace(/","/g, '", "') + ', "opcionesInactivas": ' + J(p.opcionesInactivas || []).replace(/,/g, ', ') + ',\n' +
                '        "nombre": ' + dic(p.nombre, '        ') + ',\n' +
                '        "info": ' + dic(p.info, '        ');
            if (p.extra && Object.keys(p.extra).length) b += ',\n        "extra": ' + dic(p.extra, '        ');
            return b + '\n    }';
        });
        return '{\n' +
            '  "formato": ' + J(d.formato || 1) + ',\n' +
            '  "restaurante": ' + J(d.restaurante || '') + ',\n' +
            '  "generado": ' + J(d.generado || '') + ',\n' +
            '  "guardado": ' + J(new Date().toISOString()) + ',\n' +
            '  "ocultas": ' + J(d.ocultas || []).replace(/","/g, '", "') + ',\n' +
            '  "platos": [\n' + platos.join(',\n') + '\n  ]\n}\n';
    }

    // ---------- GitHub ----------
    async function gh(cfg, opciones, intentoToken) {
        const t = token();
        if (!t) throw new Error('Sin token de GitHub');
        const r = await fetchOriginal(API + cfg.repo + '/contents/' + cfg.ruta, Object.assign({ cache: 'no-store' }, opciones, {
            headers: Object.assign({ Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json' }, (opciones && opciones.headers) || {})
        }));
        if ((r.status === 401 || r.status === 403) && !intentoToken) {
            try { localStorage.removeItem(CLAVE_TOKEN); } catch (e) { }
            if (pedirToken('El token no vale o no tiene permiso para ' + cfg.repo + ' (HTTP ' + r.status + ').')) return gh(cfg, opciones, true);
        }
        return r;
    }

    async function leerRemoto(cfg) {
        const r = await gh(cfg, { method: 'GET' });
        if (r.status === 404) return { datos: { formato: 1, restaurante: cfg.restaurante, generado: '', ocultas: [], platos: [] }, sha: null };
        if (!r.ok) throw new Error('GitHub HTTP ' + r.status + ' leyendo ' + cfg.repo + '/' + cfg.ruta);
        const j = await r.json();
        let texto;
        if (j.content && j.encoding === 'base64') texto = b64aTexto(j.content);
        else {
            const r2 = await gh(cfg, { method: 'GET', headers: { Accept: 'application/vnd.github.raw' } });
            if (!r2.ok) throw new Error('GitHub HTTP ' + r2.status + ' (raw)');
            texto = await r2.text();
        }
        return { datos: JSON.parse(texto), sha: j.sha };
    }

    async function escribirRemoto(cfg, datos, sha, mensaje) {
        const cuerpo = { message: mensaje, content: textoAB64(serializar(datos)) };
        if (sha) cuerpo.sha = sha;
        const r = await gh(cfg, { method: 'PUT', body: JSON.stringify(cuerpo), headers: { 'Content-Type': 'application/json' } });
        if (r.status === 409 || r.status === 422) { const e = new Error('conflicto'); e.conflicto = true; throw e; }
        if (!r.ok) throw new Error('GitHub HTTP ' + r.status + ' guardando: ' + (await r.text()).slice(0, 200));
        return (await r.json()).content.sha;
    }

    // ---------- estado y cola de guardado por modo ----------
    // vista = remoto + cambios aún no confirmados. Los cambios se agrupan (unos segundos) en un
    // solo commit; si otro dispositivo guardó entretanto, se relee y se vuelven a aplicar.
    const estados = {};
    function est(modo) {
        return estados[modo] || (estados[modo] = { base: null, sha: null, vista: null, sinConfirmar: [], temporizador: null, cadena: Promise.resolve(), esperando: [] });
    }

    async function refrescar(modo) {
        const e = est(modo), cfg = CONFIG.modos[modo];
        const { datos, sha } = await leerRemoto(cfg);
        e.base = datos; e.sha = sha;
        e.vista = clonar(datos);
        e.sinConfirmar.forEach(c => c.op(e.vista));
    }

    async function vista(modo, fresca) {
        const e = est(modo);
        if (!e.vista || (fresca && e.sinConfirmar.length === 0)) await refrescar(modo);
        return e.vista;
    }

    function encolar(modo, op, mensaje, retraso) {
        const e = est(modo);
        return vista(modo).then(v => {
            op(v);
            e.sinConfirmar.push({ op, mensaje });
            return new Promise((resolver, rechazar) => {
                e.esperando.push({ resolver, rechazar });
                clearTimeout(e.temporizador);
                e.temporizador = setTimeout(() => { e.cadena = e.cadena.then(() => vaciar(modo)); }, retraso);
            });
        });
    }

    async function vaciar(modo) {
        const e = est(modo), cfg = CONFIG.modos[modo];
        const lote = e.sinConfirmar.slice(), esperando = e.esperando.splice(0);
        if (!lote.length) { esperando.forEach(w => w.resolver()); return; }
        const mensajes = Array.from(new Set(lote.map(c => c.mensaje)));
        const mensaje = 'Editor: ' + mensajes.slice(0, 3).join(' · ') + (mensajes.length > 3 ? ' (+' + (mensajes.length - 3) + ')' : '');
        try {
            for (let intento = 0; ; intento++) {
                try {
                    const datos = clonar(e.vista);
                    e.sha = await escribirRemoto(cfg, datos, e.sha, mensaje);
                    // Confirmados los del lote; los que llegaran después siguen pendientes.
                    e.sinConfirmar = e.sinConfirmar.filter(c => lote.indexOf(c) === -1);
                    e.base = datos;
                    break;
                } catch (err) {
                    if (!err.conflicto || intento >= 3) throw err;
                    await refrescar(modo);
                }
            }
            esperando.forEach(w => w.resolver());
        } catch (err) {
            console.error('[almacen-json] No se pudo guardar en GitHub:', err);
            alert('❌ NO se ha guardado en GitHub (' + cfg.repo + '/' + cfg.ruta + '):\n' + err.message + '\n\nLos cambios siguen en esta pestaña; vuelve a guardar.');
            esperando.forEach(w => w.rechazar(err));
        }
    }

    // ---------- operaciones (equivalentes a Código.gs) ----------
    function opGuardarTodo(payload, cfg) {
        return (datos) => {
            const previos = {};
            (datos.platos || []).forEach(p => { previos[idNum(p.id)] = p; });
            const infoSet = {};
            cabecerasDe(datos, cfg).forEach(h => { if (h.toUpperCase().indexOf('INFO_') === 0) infoSet[h.toUpperCase()] = true; });
            payload.forEach(p => Object.keys(p).forEach(k => { if (k.toUpperCase().indexOf('INFO_') === 0) infoSet[k.toUpperCase()] = true; }));
            const cabs = cfg.columnasBase.concat(Object.keys(infoSet).sort().map(k => 'INFO_' + k.replace('INFO_', '').toLowerCase()));

            const ordenados = payload.slice().sort((a, b) => (idNum(a.id || a.ID) || 0) - (idNum(b.id || b.ID) || 0));
            datos.platos = ordenados.map(p => {
                const previo = previos[idNum(p.id || p.ID)] || null;
                const fila = {};
                cabs.forEach(k => {
                    const K = k.toUpperCase();
                    let claves = [k, k.toLowerCase(), K, k.toLowerCase().replace(/_/g, ''), k.toLowerCase().replace(/([a-z])([A-Z])/g, '$1_$2')];
                    if (K === 'ACTIVA') claves = ['activa', 'Activa', 'ACTIVA'];
                    else if (K === 'ARCHIVO_FOTO') claves = ['archivo_foto', 'archivoFoto', 'Archivo_Foto', 'ARCHIVO_FOTO', 'imagen', 'foto'];
                    else if (K === 'ALERGENOS_COD') claves = ['alergenos_cod', 'alergenosCod', 'Alergenos_Cod', 'ALERGENOS_COD', 'alergenos'];
                    else if (K === 'PRECIO') claves = ['precio', 'Precio', 'PRECIO'];
                    else if (K === 'CARPETA') claves = ['carpeta', 'Carpeta', 'CARPETA'];
                    else if (K === 'OPCIONES_INACTIVAS') claves = ['opciones_inactivas', 'opcionesInactivas', 'Opciones_Inactivas', 'OPCIONES_INACTIVAS'];
                    else if (K === 'PRECIO_MEDIA') claves = ['precio_media', 'precioMedia', 'Precio_Media', 'PRECIO_MEDIA'];
                    else if (K.indexOf('INFO_') === 0) { const l = K.slice(5).toLowerCase(); claves = ['info_' + l, 'info_' + l.toUpperCase(), 'INFO_' + l.toUpperCase()]; }
                    let v, hay = false;
                    for (const c of claves) { if (p[c] !== undefined && p[c] !== null) { v = p[c]; hay = true; break; } }
                    if (!hay) Object.keys(p).forEach(prop => { if (prop.toUpperCase() === K && p[prop] !== undefined && p[prop] !== null) { v = p[prop]; hay = true; } });
                    if (!hay && previo) { v = valorDePlato(previo, k); hay = v !== undefined && v !== null; }
                    fila[K] = hay ? (typeof v === 'object' ? JSON.stringify(v) : v) : '';
                });
                return platoDeFila(fila, previo);
            });
        };
    }

    function opCategoria(cuerpo) {
        return (datos) => {
            const id = String(cuerpo.id || '').trim();
            if (!id) return;
            const s = new Set((datos.ocultas || []).map(String));
            if (cuerpo.activa) s.delete(id); else s.add(id);
            datos.ocultas = Array.from(s);
        };
    }

    function opInfoPlato(cuerpo) {
        return (datos) => {
            const p = (datos.platos || []).find(x => idNum(x.id) === idNum(cuerpo.id));
            if (!p) { console.warn('[almacen-json] infoplato: no existe el plato', cuerpo.id); return; }
            p.info = p.info || {};
            Object.keys(cuerpo.info || {}).forEach(l => {
                const v = cuerpo.info[l];
                p.info[l.toUpperCase()] = typeof v === 'string' ? v : JSON.stringify(v);
            });
            if (cuerpo.hashFicha !== undefined && cuerpo.hashFicha !== null && String(cuerpo.hashFicha)) p.info.HASH_FICHA = String(cuerpo.hashFicha);
        };
    }

    // ---------- interceptor ----------
    function baseUrl(u) { return String(u || '').split('?')[0].split('#')[0]; }
    function modoDeUrl(url) {
        const b = baseUrl(url);
        if (!b) return null;
        for (const modo of Object.keys(CONFIG.modos)) {
            const w = typeof window.getWebAppUrl === 'function' ? window.getWebAppUrl(modo) : '';
            const c = typeof window.getCsvUrl === 'function' ? window.getCsvUrl(modo) : '';
            if ((w && baseUrl(w) === b) || (c && baseUrl(c) === b)) return modo;
        }
        return null;
    }

    async function manejar(modo, url, init) {
        const cfg = CONFIG.modos[modo];
        const params = new URL(url, location.href).searchParams;
        const accion = params.get('accion') || '';
        const metodo = String(init.method || 'GET').toUpperCase();
        try {
            if (metodo === 'GET') {
                const d = await vista(modo, true);
                if (accion === 'categorias') {
                    return respuesta(['ID,Activa'].concat((d.ocultas || []).map(id => escaparCsv(id) + ',NO')).join('\r\n'), 200, 'text/csv; charset=utf-8');
                }
                return respuesta(csvDe(d, cfg), 200, 'text/csv; charset=utf-8');
            }
            const cuerpo = init.body ? JSON.parse(init.body) : null;
            if (accion === 'categorias') {
                await encolar(modo, opCategoria(cuerpo), 'pestaña ' + cuerpo.id + (cuerpo.activa ? ' activa' : ' oculta'), 300);
                return respuesta('OK: pestaña ' + cuerpo.id);
            }
            if (accion === 'infoplato') {
                // No se espera al commit: los lotes de Info mandan muchas seguidas y se agrupan.
                encolar(modo, opInfoPlato(cuerpo), 'info', 4000).catch(() => { });
                return respuesta('OK: Info guardada para el plato ID ' + cuerpo.id);
            }
            if (!Array.isArray(cuerpo) || !cuerpo.length) return respuesta('Error: Datos vacíos recibidos.');
            await encolar(modo, opGuardarTodo(cuerpo, cfg), 'guardar carta (' + cuerpo.length + ' platos)', 300);
            return respuesta('Sincronización Correcta: ' + cuerpo.length + ' filas.');
        } catch (err) {
            console.error('[almacen-json]', err);
            return respuesta('Error: ' + err.message, 500);
        }
    }

    let activo = CONFIG.activo === true;
    if (CONFIG.activo === 'url') {
        try {
            const q = new URLSearchParams(location.search);
            if (q.has('json')) sessionStorage.setItem('almacenJson.activo', q.get('json') === '0' ? '0' : '1');
            activo = sessionStorage.getItem('almacenJson.activo') === '1';
        } catch (e) { activo = /[?&]json(=1)?(&|$)/.test(location.search); }
    }

    if (activo) {
        window.fetch = function (input, init) {
            const url = typeof input === 'string' ? input : (input && input.url) || '';
            const modo = modoDeUrl(url);
            if (!modo) return fetchOriginal(input, init);
            return manejar(modo, url, init || {});
        };
        window.addEventListener('beforeunload', (ev) => {
            if (Object.values(estados).some(e => e.sinConfirmar.length)) { ev.preventDefault(); ev.returnValue = ''; }
        });
        console.log('[almacen-json] Carta en GitHub:', Object.values(CONFIG.modos).map(m => m.repo + '/' + m.ruta).join(', '));
    }

    window.AlmacenJSON = {
        config: CONFIG,
        activo: activo,
        cambiarToken: () => { try { localStorage.removeItem(CLAVE_TOKEN); } catch (e) { } return !!pedirToken(); },
        pendientes: () => Object.fromEntries(Object.entries(estados).map(([m, e]) => [m, e.sinConfirmar.length])),
        _serializar: serializar, _csvDe: csvDe
    };
})();
