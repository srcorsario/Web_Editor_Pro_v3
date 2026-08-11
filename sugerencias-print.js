(function () {
    'use strict';

    // MODIFICADO: Mapa de configuración unificado usando Abstract Keys estrictas
    const SUGERENCIAS_CONFIG = {
        restaurante001: {
            versionStr: 'v2.9.6-Abstract-Keys',
            versionKey: 'sugerencias_restaurante001',
            containerId: 'sugerencias-contenido',
            logoSrc: LOGO_RESTAURANTE001,
            logoFallback: 'https://z-cdn-media.chatglm.cn/files/fc4b4919-b148-470d-97a2-c740c58d1178.png?auth_key=1881113734-9f1ef8e42c5a4eae8f4f0f9055730ecf-0-f7b585f0f08f5f78de683fb163bec75d',
            qrImgId: 'img-qr-rg',
            qrRadioName: 'qr-mode-rg-footer',
            qrDefault: QR_RESTAURANTE001_DEFAULT, 
            qrMod: QR_RESTAURANTE001_MOD,           
            defaultQrSelection: 'mod',       
            qrOptions: [
                { value: 'none', label: 'Sin QR', isDefault: false },
                { value: 'default', label: 'Oficial', isDefault: false },
                { value: 'mod', label: 'Alternativo', isDefault: true }
            ],
            vinoImagenSrc: VINO_IMAGEN_TENISTA,
            vinoImagenWrapperId: 'vino-imagen-rg',
            vinoImagenRadioName: 'vino-imagen-mode-rg-footer',
            vinoImagenOptions: [
                { value: 'con', label: 'Con imagen Vino', isDefault: VINO_IMAGEN_DEFAULT_RESTAURANTE001 },
                { value: 'sin', label: 'Sin imagen Vino', isDefault: !VINO_IMAGEN_DEFAULT_RESTAURANTE001 }
            ]
        },
        restaurante002: {
            versionStr: 'v2.9.6-Abstract-Keys',
            versionKey: 'sugerencias_restaurante002',
            containerId: 'sugerencias-contenido-usopen',
            logoSrc: LOGO_RESTAURANTE002,
            logoFallback: 'https://z-cdn-media.chatglm.cn/files/fc4b4919-b148-470d-97a2-c740c58d1178.png?auth_key=1881113734-9f1ef8e42c5a4eae8f4f0f9055730ecf-0-f7b585f0f08f5f78de683fb163bec75d',
            qrImgId: 'img-qr-usopen',
            qrRadioName: 'qr-mode-usopen-footer',
            qrDefault: QR_RESTAURANTE002_DEFAULT, 
            qrMod: QR_RESTAURANTE002_MOD,         
            defaultQrSelection: 'default',      
            qrOptions: [
                { value: 'none', label: 'Sin QR', isDefault: false },
                { value: 'default', label: 'Oficial', isDefault: true },
                { value: 'mod', label: 'Alternativo', isDefault: false }
            ],
            vinoImagenSrc: VINO_IMAGEN_TENISTA,
            vinoImagenWrapperId: 'vino-imagen-usopen',
            vinoImagenRadioName: 'vino-imagen-mode-usopen-footer',
            vinoImagenOptions: [
                { value: 'con', label: 'Con imagen Vino', isDefault: VINO_IMAGEN_DEFAULT_RESTAURANTE002 },
                { value: 'sin', label: 'Sin imagen Vino', isDefault: !VINO_IMAGEN_DEFAULT_RESTAURANTE002 }
            ]
        }
    };

    if (!document.getElementById('sugerencias-print-styles')) {
        const stylePrint = document.createElement('style');
        stylePrint.id = 'sugerencias-print-styles';
        stylePrint.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap');
            @page { size: A4; margin: 10mm; }
            .sugerencias-panel { background: #ffffff !important; padding: 15px 25px !important; width: 100% !important; max-width: 190mm !important; min-height: 277mm !important; margin: 0 auto !important; font-family: 'Montserrat', sans-serif !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; }
            .sugerencias-header-layout { display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 15px !important; position: relative !important; }
            .sugerencias-brand-title-group { display: flex !important; flex-direction: column !important; gap: 2px !important; }
            .sugerencias-title-es { font-weight: 700 !important; font-size: 1.7rem !important; color: #e05a2b !important; text-transform: uppercase !important; margin:0 !important; } 
            .sugerencias-title-en { font-weight: 300 !important; font-size: 1.2rem !important; color: #0d5c63 !important; text-transform: uppercase !important; margin:0 !important; } 
            .sugerencias-version-tag { position: absolute !important; top: -15px !important; left: 0 !important; font-size: 0.6rem !important; color: #94a3b8 !important; font-family: monospace !important; }
            .sugerencias-logo-img { width: 135px !important; height: auto !important; object-fit: contain !important; } 
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
            .sugerencias-vino-imagen-wrapper { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center !important; padding: 8px 0 !important; column-gap: 10px !important; }
            .sugerencias-vino-imagen { justify-self: center !important; max-width: 55%; max-height: 140px; object-fit: contain !important; transition: max-height 0.15s ease, max-width 0.15s ease !important; }
            .sugerencias-vino-imagen-wrapper .sugerencias-qr-img { justify-self: end !important; }
            .vino-imagen-selector-wrapper { font-size: 0.75rem !important; color: #64748b !important; }
            .btn-imprimir-a4 { display: block; width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; margin-bottom: 20px; text-align: center; }
            /* NUEVO: en pantallas estrechas (móvil), las filas "Imagen Vino:" y "Tipo de QR:"
               se generan con flex-wrap:nowrap y white-space:nowrap en línea (para que en
               pantallas normales queden en una sola fila compacta), lo que en móvil las hacía
               desbordarse por el borde derecho. Aquí se sobreescribe con !important (gana al
               estilo en línea, que no lo es) permitiendo que cada grupo de opciones baje de
               línea si no cabe, y se quita el borde/padding lateral que separaba "Imagen Vino"
               de "Tamaño" (no tiene sentido ya en vertical). */
            @media (max-width: 600px) {
                .qr-selector-wrapper { flex-wrap: wrap !important; white-space: normal !important; }
                .vino-imagen-selector-wrapper { border-right: none !important; padding-right: 0 !important; }
            }
            @media print { body { -webkit-print-color-adjust: exact !important; } .btn-imprimir-a4, .sugerencias-qr-toggle, .qr-selector-wrapper, .vino-imagen-selector-wrapper { display: none !important; } }
        `;
        document.head.appendChild(stylePrint);
    }

    // MODIFICADO: Ahora recibe 'restaurante001' o 'restaurante002'
    window.toggleQR = function(tipo, modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const img = document.getElementById(config.qrImgId);
        if (!img) return;
        if (tipo === 'none') { img.style.display = 'none'; return; }
        img.style.display = 'block';
        img.src = (tipo === 'default') ? config.qrDefault : config.qrMod;
    };

    // NUEVO: tamaño base de la imagen del vino (debe coincidir con el CSS .sugerencias-vino-imagen)
    // y multiplicadores disponibles para agrandarla desde la pantalla.
    const VINO_IMAGEN_BASE_MAX_HEIGHT = 140; // px
    const VINO_IMAGEN_BASE_MAX_WIDTH = 55;   // %
    const VINO_IMAGEN_ESCALAS = [1, 1.2, 1.4, 1.6];
    // MODIFICADO: tamaño por defecto ahora es 1.4x (antes 1x).
    const VINO_IMAGEN_ESCALA_DEFAULT = 1.4;
    // NUEVO: tamaño base del QR (debe coincidir con el CSS .sugerencias-qr-img: 90px !important),
    // para poder escalarlo en la misma proporción que la imagen del vino cuando comparten fila.
    const QR_IMAGEN_BASE_SIZE = 90; // px

    // MODIFICADO: solo oculta/muestra la imagen del vino en sí, NUNCA el wrapper entero — desde
    // que el QR vive en la misma fila, ocultar el wrapper apagaba el QR también.
    window.toggleVinoImagen = function(tipo, modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const wrapper = document.getElementById(config.vinoImagenWrapperId);
        if (!wrapper) return;
        const img = wrapper.querySelector('.sugerencias-vino-imagen');
        if (img) img.style.display = (tipo === 'con') ? '' : 'none';
    };

    // NUEVO: ajusta el tamaño de la imagen del vino aplicando un multiplicador sobre el tamaño
    // base (p.ej. 1.2 = un 20% más grande). Reajusta max-height y max-width a la vez para que
    // crezca de forma proporcionada.
    // MODIFICADO: ahora también reescala el QR en la misma proporción (antes se quedaba fijo
    // en 90px mientras la botella crecía, descuadrando la fila); su CSS base tiene
    // width/height con !important, así que el ajuste se fuerza con setProperty(..., 'important')
    // para poder ganarle, en vez de una simple asignación de style que perdería frente a él.
    window.setVinoImagenEscala = function(escala, modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const wrapper = document.getElementById(config.vinoImagenWrapperId);
        if (!wrapper) return;
        const img = wrapper.querySelector('.sugerencias-vino-imagen');
        if (img) {
            img.style.maxHeight = (VINO_IMAGEN_BASE_MAX_HEIGHT * escala) + 'px';
            img.style.maxWidth = (VINO_IMAGEN_BASE_MAX_WIDTH * escala) + '%';
        }
        const qrImg = wrapper.querySelector('.sugerencias-qr-img');
        if (qrImg) {
            const qrTamano = (QR_IMAGEN_BASE_SIZE * escala) + 'px';
            qrImg.style.setProperty('width', qrTamano, 'important');
            qrImg.style.setProperty('height', qrTamano, 'important');
        }
    };

    window.renderCarta = function(modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const contenedor = document.getElementById(config.containerId);
        if (!contenedor) return;

        window.APP_VERSIONS = window.APP_VERSIONS || {};
        window.APP_VERSIONS[config.versionKey] = config.versionStr;

        let intentos = 0; const MAX_INTENTOS = 10;
        function intentarRenderizado() {
            let fuente = window.datosLocales || [];
            const tieneDatosEnRango = fuente.some(p => p && p.activa && parseInt(p.id, 10) >= 12000 && parseInt(p.id, 10) <= 12999);
            if (tieneDatosEnRango) procesarYRender(fuente, contenedor, config, modo);
            else if (intentos < MAX_INTENTOS) { intentos++; setTimeout(intentarRenderizado, 500); }
            else contenedor.innerHTML = `<div class="p-4 text-center text-slate-500 italic">Esperando origen de datos...</div>`;
        }
        intentarRenderizado();
    };

    function aplicarParcheOptimista(fuente, modo) {
        const state = window.optimisticState ? window.optimisticState[modo] : { t: 0, s: [] };
        const timeSinceSave = Date.now() - state.t;
        if (timeSinceSave < CONSISTENCY_WINDOW_MS && state.s && state.s.length > 0) {
            let parchesAplicados = 0;
            fuente.forEach(item => { if (!item || !item.id) return; const savedItem = state.s.find(s => s.id === item.id); if (savedItem && JSON.stringify(item) !== JSON.stringify(savedItem)) { parchesAplicados++; Object.keys(savedItem).forEach(k => { item[k] = savedItem[k]; }); } });
        }
        return fuente;
    }

    function procesarYRender(fuente, contenedor, config, modoSeguro) {
        aplicarParcheOptimista(fuente, modoSeguro);
        const platos = fuente.filter(p => p && p.activa && parseInt(p.id, 10) >= 12000 && parseInt(p.id, 10) <= 12999);
        let entrantes = [], principales = [], postres = [], vinos = [];
        platos.forEach(p => { const id = parseInt(p.id, 10); if (id === 12990) vinos.push(p); else if (id >= 12100 && id <= 12399) entrantes.push(p); else if (id >= 12400 && id <= 12899) principales.push(p); else if (id >= 12900 && id <= 12999) postres.push(p); else entrantes.push(p); });

        let html = `<button onclick="window.imprimirSugerencias('${modoSeguro}')" class="btn-imprimir-a4">🖨️ Imprimir Sugerencias ${getModoAlias(modoSeguro)} (A4)</button>
            <div class="sugerencias-header-layout">
                <span class="sugerencias-version-tag" style="display:none;">Módulo ${config.versionStr}</span>
                <div class="sugerencias-brand-title-group"><div class="sugerencias-title-es">SUGERENCIAS DEL CHEF</div><div class="sugerencias-title-en">CHEF'S SUGGESTIONS</div></div>
                <img src="${config.logoSrc}" class="sugerencias-logo-img" onerror="this.src='${config.logoFallback}';">
            </div><div class="sugerencias-body">`;

        const renderCat = (titulo, lista, extraHtml = '') => {
            if (lista.length === 0) return '';
            let h = `<div class="sugerencias-seccion"><div class="sugerencias-seccion-titulo">${titulo}</div>`;
            lista.forEach(p => {
                let iconsHtml = '';
                if (p.alergenos) iconsHtml = '<div class="sugerencias-alergenos">' + p.alergenos.split(',').map(a => `<img src="${PATH_ALERGENOS}${a.trim()}.webp" class="sugerencias-alergeno-icon" onerror="this.style.display='none'">`).join('') + '</div>';
                const objEs = window.desglosarNombre(p.es); const objEn = window.desglosarNombre(p.en);
                const esVino = (p.id === 12990 || p.id >= 13000);
                let htmlNombreEs = "", htmlNombreEn = "";
                if (esVino) htmlNombreEs = objEs.uvas ? `<span class="sugerencias-nombre-es">${objEs.nombre} <span class="sugerencias-detalles-uvas-inline">(${objEs.uvas})</span></span>` : `<span class="sugerencias-nombre-es">${objEs.nombre}</span>`;
                else { htmlNombreEs = `<span class="sugerencias-nombre-es">${objEs.nombre}</span>`; htmlNombreEn = `<span class="sugerencias-nombre-en">${objEn.nombre}</span>`; }
                const precioFormateado = p.precio ? parseFloat(p.precio).toFixed(2) + '€' : '0.00€';
                h += `<div class="sugerencias-plato"><div class="sugerencias-plato-nombres">${htmlNombreEs}${htmlNombreEn}${iconsHtml}</div><div class="sugerencias-puntos"></div><div class="sugerencias-precio">${precioFormateado}</div></div>`;
            });
            if (extraHtml) h += extraHtml;
            return h + '</div>';
        };

        let initialImgSrc = config.qrMod;
        const defaultOpt = config.qrOptions.find(o => o.isDefault);
        if (defaultOpt && defaultOpt.value === 'default') initialImgSrc = config.qrDefault;

        // NUEVO: si el vino especial (ID 12990) está activo, el QR se mueve a la MISMA fila que
        // la imagen del vino — imagen del vino centrada (columna central de un grid de 3), QR
        // pegado a la derecha (columna derecha) — en vez de vivir abajo del todo junto al aviso
        // de alérgenos.
        const tieneVinoEspecial = vinos.some(p => parseInt(p.id, 10) === 12990);
        const vinoImagenDefaultCon = config.vinoImagenOptions.find(o => o.isDefault)?.value === 'con';
        // MODIFICADO: tamaño inicial ya a VINO_IMAGEN_ESCALA_DEFAULT (1.4x) en vez del 1x base,
        // tanto para la botella como para el QR (proporcional, ver QR_IMAGEN_BASE_SIZE). El
        // !important en el QR es necesario para ganarle al width/height !important de su CSS base.
        const vinoImgMaxHeightInicial = VINO_IMAGEN_BASE_MAX_HEIGHT * VINO_IMAGEN_ESCALA_DEFAULT;
        const vinoImgMaxWidthInicial = VINO_IMAGEN_BASE_MAX_WIDTH * VINO_IMAGEN_ESCALA_DEFAULT;
        const qrTamanoInicial = QR_IMAGEN_BASE_SIZE * VINO_IMAGEN_ESCALA_DEFAULT;
        const vinoImagenHtml = tieneVinoEspecial
            ? `<div class="sugerencias-vino-imagen-wrapper" id="${config.vinoImagenWrapperId}">
                <span></span>
                <img src="${config.vinoImagenSrc}" class="sugerencias-vino-imagen" style="display:${vinoImagenDefaultCon ? '' : 'none'}; max-height:${vinoImgMaxHeightInicial}px; max-width:${vinoImgMaxWidthInicial}%;" onerror="this.style.display='none';">
                <img src="${initialImgSrc}" class="sugerencias-qr-img" id="${config.qrImgId}" style="width:${qrTamanoInicial}px !important; height:${qrTamanoInicial}px !important;">
               </div>`
            : '';

        html += renderCat("ENTRANTES / STARTERS", entrantes);
        html += renderCat("PRINCIPALES / MAIN COURSES", principales);
        html += renderCat("POSTRES / DESSERTS", postres);
        html += renderCat("BODEGA / WINE CELLAR", vinos, vinoImagenHtml);

        let qrButtonsHtml = '';
        config.qrOptions.forEach(opt => {
            const isActive = opt.isDefault;
            const style = `cursor: pointer; color: ${isActive ? '#0d5c63' : '#64748b'}; font-weight: ${isActive ? 'bold' : 'normal'};`;
            qrButtonsHtml += `<label style="${style}"><input type="radio" name="${config.qrRadioName}" value="${opt.value}" ${isActive ? 'checked' : ''} onchange="window.toggleQR('${opt.value}', '${modoSeguro}')"> ${opt.label}</label>`;
        });

        // NUEVO: botones del toggle "Con/Sin imagen Vino" + selector de tamaño, solo se muestran
        // si el vino especial (ID 12990) está activo en esta hoja de Sugerencias.
        let vinoImagenButtonsHtml = '';
        let vinoImagenEscalaHtml = '';
        if (tieneVinoEspecial) {
            config.vinoImagenOptions.forEach(opt => {
                const isActive = opt.isDefault;
                const style = `cursor: pointer; color: ${isActive ? '#0d5c63' : '#64748b'}; font-weight: ${isActive ? 'bold' : 'normal'};`;
                vinoImagenButtonsHtml += `<label style="${style}"><input type="radio" name="${config.vinoImagenRadioName}" value="${opt.value}" ${isActive ? 'checked' : ''} onchange="window.toggleVinoImagen('${opt.value}', '${modoSeguro}')"> ${opt.label}</label>`;
            });
            VINO_IMAGEN_ESCALAS.forEach((escala, idx) => {
                const isActive = escala === VINO_IMAGEN_ESCALA_DEFAULT; // MODIFICADO: 1.4x por defecto (antes 1x)
                const style = `cursor: pointer; color: ${isActive ? '#0d5c63' : '#64748b'}; font-weight: ${isActive ? 'bold' : 'normal'};`;
                const etiqueta = escala === 1 ? '1x' : `${escala}x`;
                vinoImagenEscalaHtml += `<label style="${style}"><input type="radio" name="vino-imagen-escala-${modoSeguro}" value="${escala}" ${isActive ? 'checked' : ''} onchange="window.setVinoImagenEscala(${escala}, '${modoSeguro}')"> ${etiqueta}</label>`;
            });
        }
        
        html += `</div><div class="sugerencias-footer">
                <div class="sugerencias-advertencia-alergenos">Si usted tiene algún tipo de alergia alimentaria, por favor comuníquelo a nuestro personal.<br>If you have any food allergies, please inform our staff.</div>
                <div class="sugerencias-qr-container">
                    ${(vinoImagenButtonsHtml || vinoImagenEscalaHtml) ? `<div class="qr-selector-wrapper" style="font-size: 0.75rem; color: #64748b; text-align: center; margin-bottom: 3px; user-select:none; display: flex; flex-direction: row; align-items: center; justify-content: center; flex-wrap: nowrap; gap: 8px; white-space: nowrap;">${vinoImagenButtonsHtml ? `<span class="vino-imagen-selector-wrapper" style="display:flex; align-items:center; gap:8px; padding-right:10px; border-right:1px solid #cbd5e1;">Imagen Vino: ${vinoImagenButtonsHtml}</span>` : ''}${vinoImagenEscalaHtml ? `<span class="vino-imagen-selector-wrapper" style="display:flex; align-items:center; gap:6px;">Tamaño: ${vinoImagenEscalaHtml}</span>` : ''}</div>` : ''}
                    <div class="qr-selector-wrapper" style="font-size: 0.75rem; color: #64748b; text-align: center; margin-bottom: 5px; user-select:none; display: flex; flex-direction: row; align-items: center; justify-content: center; flex-wrap: nowrap; gap: 8px; white-space: nowrap;">Tipo de QR: ${qrButtonsHtml}</div>
                    ${tieneVinoEspecial ? '' : `<img src="${initialImgSrc}" class="sugerencias-qr-img" id="${config.qrImgId}">`}
                </div></div>`;
        contenedor.innerHTML = html;
    }

    window.imprimirSugerencias = function(modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const contenedor = document.getElementById(config.containerId);
        if (!contenedor) return;
        const styleContent = document.getElementById('sugerencias-print-styles').innerHTML;
        const pWin = window.open('', '_blank', 'width=800,height=1000');

        // MODIFICADO: el aviso ya no depende de window.opener (poco fiable: bloqueadores de
        // popups, o que el admin corra embebido en un iframe de Apps Script pueden romper esa
        // comunicación en silencio, sin error visible). Ahora el aviso se muestra DENTRO de esta
        // misma ventana de impresión, antes de imprimir, con las medidas reales en mm para poder
        // depurar si algo se quita sin hacer falta.
        const scriptAjuste = `
            function esperarImagenes(root) {
                var imgs = Array.prototype.slice.call(root.querySelectorAll('img'));
                return Promise.all(imgs.map(function(img) {
                    if (img.complete) return Promise.resolve();
                    return new Promise(function(resolve) {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', resolve);
                    });
                }));
            }

            function mmDesdePx(px, maxAlturaPx) { return (px * 277 / maxAlturaPx).toFixed(1); }

            function ajustarAUnaPagina() {
                var resultado = { espacioCategoriasReducido: false, imagenVinoQuitada: false, qrQuitado: false, textoReducido: false, medidas: [] };
                var panel = document.querySelector('.sugerencias-panel');
                if (!panel) return resultado;

                var probe = document.createElement('div');
                probe.style.cssText = 'position:absolute; visibility:hidden; height:277mm; width:0;';
                document.body.appendChild(probe);
                var maxAlturaPx = probe.getBoundingClientRect().height;
                document.body.removeChild(probe);

                // CORREGIDO: las filas de selectores (Tipo de QR, Imagen Vino, Tamaño) solo
                // existen para la pantalla — en el papel se ocultan vía @media print. Si se
                // miden con ellas visibles, la altura sale más alta de lo que de verdad ocupa
                // la hoja impresa, y el script cree que hace falta quitar más de lo necesario
                // (incluido un QR que ya estuviera desactivado). Se ocultan ANTES de la primera
                // medición para que coincida con el resultado real en papel desde el principio.
                document.querySelectorAll('.qr-selector-wrapper').forEach(function(el) {
                    el.style.setProperty('display', 'none', 'important');
                });

                function medir(etiqueta) {
                    void panel.offsetHeight;
                    var alturaMm = mmDesdePx(panel.scrollHeight, maxAlturaPx);
                    resultado.medidas.push(etiqueta + ': ' + alturaMm + 'mm de 277mm');
                    return panel.scrollHeight <= (maxAlturaPx + 2);
                }

                if (medir('Original')) return resultado;

                // NUEVO: Paso 0 — antes de quitar nada visual (imagen del vino, QR), se prueba
                // un apretón pequeño SOLO en el espacio entre categorías (Entrantes/Principales/
                // Postres/Bodega) y bajo cada título de sección, sin tocar el tamaño de letra ni
                // el espacio entre platos. Muchas veces con esto de sobra basta (diferencias de
                // 1-2mm), y así no se sacrifica la imagen del vino por un desajuste mínimo.
                var pasosGap = 0, MAX_PASOS_GAP = 4;
                while (!medir('Apretando espacio entre categorías, paso ' + pasosGap) && pasosGap < MAX_PASOS_GAP) {
                    pasosGap++;
                    var factorGap = 1 - (pasosGap * 0.15); // 12px -> ~10.2 -> 8.4 -> 6.6 -> 4.8
                    panel.querySelectorAll('.sugerencias-seccion').forEach(function(el) {
                        el.style.setProperty('margin-bottom', (12 * factorGap) + 'px', 'important');
                    });
                    panel.querySelectorAll('.sugerencias-seccion-titulo').forEach(function(el) {
                        el.style.setProperty('margin-bottom', (8 * factorGap) + 'px', 'important');
                    });
                }
                if (pasosGap > 0) resultado.espacioCategoriasReducido = true;
                if (medir('Tras apretar categorías')) return resultado;

                var vinoImg = panel.querySelector('.sugerencias-vino-imagen');
                if (vinoImg && vinoImg.style.display !== 'none') {
                    vinoImg.style.setProperty('display', 'none', 'important');
                    resultado.imagenVinoQuitada = true;
                }
                if (medir('Sin imagen vino')) return resultado;

                var qrImg = panel.querySelector('.sugerencias-qr-img');
                var qrYaEstabaVisible = qrImg && qrImg.style.display !== 'none' && qrImg.offsetHeight > 0;
                if (qrImg) {
                    qrImg.style.setProperty('display', 'none', 'important');
                    if (qrYaEstabaVisible) resultado.qrQuitado = true;
                }
                if (medir('Sin QR')) return resultado;

                var factor = 1, pasos = 0, MAX_PASOS = 12;
                while (!medir('Reduciendo texto, paso ' + pasos) && pasos < MAX_PASOS) {
                    factor -= 0.03;
                    pasos++;
                    document.documentElement.style.setProperty('font-size', (factor * 100) + '%', 'important');
                    panel.querySelectorAll('.sugerencias-plato').forEach(function(el) {
                        el.style.setProperty('margin-bottom', (5 * factor) + 'px', 'important');
                    });
                    panel.querySelectorAll('.sugerencias-seccion').forEach(function(el) {
                        el.style.setProperty('margin-bottom', (12 * factor) + 'px', 'important');
                    });
                    panel.querySelectorAll('.sugerencias-seccion-titulo').forEach(function(el) {
                        el.style.setProperty('margin-bottom', (8 * factor) + 'px', 'important');
                    });
                }
                if (pasos > 0) resultado.textoReducido = true;
                return resultado;
            }

            function mostrarAviso(resultado) {
                if (!resultado.espacioCategoriasReducido && !resultado.imagenVinoQuitada && !resultado.qrQuitado && !resultado.textoReducido) return;
                var mensajes = [];
                if (resultado.espacioCategoriasReducido) mensajes.push('Se ha reducido un poco el espacio entre categorías.');
                if (resultado.imagenVinoQuitada) mensajes.push('No se ha usado la imagen del vino, para que quepa todo en una hoja A4.');
                if (resultado.qrQuitado) mensajes.push('No se ha incluido el código QR, para que quepa todo en una hoja A4.');
                if (resultado.textoReducido) mensajes.push('Se ha reducido ligeramente el tamaño de letra y el espaciado.');
                var caja = document.createElement('div');
                caja.id = 'sugerencias-aviso-ajuste';
                caja.style.cssText = 'position:fixed; top:16px; right:16px; z-index:9999; background:#fff7ed; border:1px solid #f59e0b; color:#92400e; padding:12px 16px; border-radius:8px; font-size:13px; max-width:340px; box-shadow:0 4px 12px rgba(0,0,0,0.15); font-family:sans-serif;';
                caja.innerHTML = '<b>⚠️ Ajuste automático a una página</b>' +
                    '<ul style="margin:6px 0 0 18px; padding:0;">' + mensajes.map(function(m){ return '<li>' + m + '</li>'; }).join('') + '</ul>' +
                    '<details style="margin-top:8px; font-size:11px; color:#78716c;"><summary style="cursor:pointer;">Ver medidas</summary>' + resultado.medidas.join('<br>') + '</details>' +
                    '<div style="text-align:right; margin-top:8px;"><button id="btn-continuar-impresion" style="cursor:pointer; background:#f59e0b; color:#fff; border:none; padding:5px 12px; border-radius:5px; font-size:12px;">Imprimir ahora</button></div>';
                document.body.appendChild(caja);
                return caja;
            }

            esperarImagenes(document.body).then(function() {
                var resultado = ajustarAUnaPagina();
                var caja = mostrarAviso(resultado);
                if (!caja) {
                    // Nada que avisar: todo cabía de partida, seguimos con el flujo rápido de siempre
                    setTimeout(function() { window.print(); window.close(); }, 150);
                } else {
                    // Hay algo que avisar: se espera a que la persona pulse "Imprimir ahora" para
                    // dar tiempo real a leer el aviso (no se cierra sola la ventana esta vez).
                    document.getElementById('btn-continuar-impresion').onclick = function() { window.print(); };
                }
            });
        `;

        pWin.document.write(`<html><head><title>Sugerencias ${getModoAlias(modo)}</title><style>${styleContent}@media print { #sugerencias-aviso-ajuste { display: none !important; } }</style></head><body><div class="sugerencias-panel">${contenedor.innerHTML}</div><script>${scriptAjuste}<\/script></body></html>`);
        pWin.document.close();
    };
})();
