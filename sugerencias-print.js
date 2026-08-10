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
            .sugerencias-panel { background: #ffffff !important; padding: 15px 25px !important; width: 190mm !important; min-height: 277mm !important; margin: 0 auto !important; font-family: 'Montserrat', sans-serif !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; }
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
            .sugerencias-vino-imagen-wrapper { display: flex; align-items: center !important; justify-content: center !important; padding: 8px 0 !important; }
            .sugerencias-vino-imagen { max-width: 55%; max-height: 140px; object-fit: contain !important; transition: max-height 0.15s ease, max-width 0.15s ease !important; }
            .vino-imagen-selector-wrapper { font-size: 0.75rem !important; color: #64748b !important; }
            .btn-imprimir-a4 { display: block; width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; margin-bottom: 20px; text-align: center; }
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

    // NUEVO: muestra/oculta la imagen del vino "El Tenista" (ID 12990) en la hoja de Sugerencias
    window.toggleVinoImagen = function(tipo, modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const wrapper = document.getElementById(config.vinoImagenWrapperId);
        if (!wrapper) return;
        wrapper.style.display = (tipo === 'con') ? 'flex' : 'none';
    };

    // NUEVO: ajusta el tamaño de la imagen del vino aplicando un multiplicador sobre el tamaño
    // base (p.ej. 1.2 = un 20% más grande). Reajusta max-height y max-width a la vez para que
    // crezca de forma proporcionada.
    window.setVinoImagenEscala = function(escala, modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const wrapper = document.getElementById(config.vinoImagenWrapperId);
        if (!wrapper) return;
        const img = wrapper.querySelector('.sugerencias-vino-imagen');
        if (!img) return;
        img.style.maxHeight = (VINO_IMAGEN_BASE_MAX_HEIGHT * escala) + 'px';
        img.style.maxWidth = (VINO_IMAGEN_BASE_MAX_WIDTH * escala) + '%';
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

        // NUEVO: si el vino especial (ID 12990) está activo, se prepara el bloque de imagen que
        // se centra debajo de su nombre, ocupando el espacio libre de la sección hasta el pie
        // (footer/QR) — controlable con el toggle "Con/Sin imagen Vino".
        const tieneVinoEspecial = vinos.some(p => parseInt(p.id, 10) === 12990);
        const vinoImagenDefaultCon = config.vinoImagenOptions.find(o => o.isDefault)?.value === 'con';
        const vinoImagenHtml = tieneVinoEspecial
            ? `<div class="sugerencias-vino-imagen-wrapper" id="${config.vinoImagenWrapperId}" style="display:${vinoImagenDefaultCon ? 'flex' : 'none'};"><img src="${config.vinoImagenSrc}" class="sugerencias-vino-imagen" onerror="this.parentElement.style.display='none';"></div>`
            : '';

        html += renderCat("ENTRANTES / STARTERS", entrantes);
        html += renderCat("PRINCIPALES / MAIN COURSES", principales);
        html += renderCat("POSTRES / DESSERTS", postres);
        html += renderCat("BODEGA / WINE CELLAR", vinos, vinoImagenHtml);

        let initialImgSrc = config.qrMod;
        const defaultOpt = config.qrOptions.find(o => o.isDefault);
        if (defaultOpt && defaultOpt.value === 'default') initialImgSrc = config.qrDefault;

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
                const isActive = idx === 0; // 1x por defecto
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
                    <img src="${initialImgSrc}" class="sugerencias-qr-img" id="${config.qrImgId}">
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

        // MODIFICADO: antes se medía tras un setTimeout fijo de 500ms, sin garantía de que la
        // imagen del vino, el QR o el logo hubieran terminado de cargar — si alguna aún no tenía
        // tamaño real, la medida inicial salía más baja de lo real y podía arrastrar un recorte
        // de más (p.ej. quitar el QR sin hacer falta). Ahora se espera explícitamente a que TODAS
        // las imágenes carguen (o fallen) antes de medir nada, y se fuerza un reflow antes de
        // cada comprobación de altura.
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

            function ajustarAUnaPagina() {
                var resultado = { imagenVinoQuitada: false, qrQuitado: false, textoReducido: false };
                var panel = document.querySelector('.sugerencias-panel');
                if (!panel) return resultado;

                var probe = document.createElement('div');
                probe.style.cssText = 'position:absolute; visibility:hidden; height:277mm; width:0;';
                document.body.appendChild(probe);
                var maxAlturaPx = probe.getBoundingClientRect().height;
                document.body.removeChild(probe);

                function cabe() { void panel.offsetHeight; return panel.scrollHeight <= (maxAlturaPx + 2); }
                if (cabe()) return resultado;

                // Paso 1: quitar imagen del vino
                var vinoImg = panel.querySelector('.sugerencias-vino-imagen-wrapper');
                if (vinoImg && vinoImg.style.display !== 'none') {
                    vinoImg.style.setProperty('display', 'none', 'important');
                    resultado.imagenVinoQuitada = true;
                }
                if (cabe()) return resultado;

                // Paso 2: quitar el QR (bloque completo)
                var qrCont = panel.querySelector('.sugerencias-qr-container');
                if (qrCont) {
                    qrCont.style.setProperty('display', 'none', 'important');
                    resultado.qrQuitado = true;
                }
                if (cabe()) return resultado;

                // Paso 3: reducir tipografía e interlineado, en pasos pequeños, lo mínimo necesario
                var factor = 1, pasos = 0, MAX_PASOS = 12;
                while (!cabe() && pasos < MAX_PASOS) {
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

            esperarImagenes(document.body).then(function() {
                var resultado = ajustarAUnaPagina();
                if (window.opener && window.opener.mostrarAvisoAjusteSugerencias) {
                    window.opener.mostrarAvisoAjusteSugerencias(resultado);
                }
                setTimeout(function() { window.print(); window.close(); }, 150);
            });
        `;

        pWin.document.write(`<html><head><title>Sugerencias ${getModoAlias(modo)}</title><style>${styleContent}</style></head><body><div class="sugerencias-panel">${contenedor.innerHTML}</div><script>${scriptAjuste}<\/script></body></html>`);
        pWin.document.close();
    };

    // NUEVO: aviso en la ventana principal (no en la de impresión, que se cierra sola) de qué
    // se ha tenido que quitar/reducir para que la hoja de Sugerencias quepa en una sola A4.
    window.mostrarAvisoAjusteSugerencias = function(resultado) {
        if (!resultado || (!resultado.imagenVinoQuitada && !resultado.qrQuitado && !resultado.textoReducido)) return;
        const mensajes = [];
        if (resultado.imagenVinoQuitada) mensajes.push('No se ha usado la imagen del vino, para que quepa todo en una hoja A4.');
        if (resultado.qrQuitado) mensajes.push('No se ha incluido el código QR, para que quepa todo en una hoja A4.');
        if (resultado.textoReducido) mensajes.push('Se ha reducido ligeramente el tamaño de letra y el espaciado, para que quepa todo en una hoja A4.');

        let caja = document.getElementById('sugerencias-aviso-ajuste');
        if (!caja) {
            caja = document.createElement('div');
            caja.id = 'sugerencias-aviso-ajuste';
            caja.style.cssText = 'position:fixed; top:16px; right:16px; z-index:9999; background:#fff7ed; border:1px solid #f59e0b; color:#92400e; padding:12px 16px; border-radius:8px; font-size:0.85rem; max-width:320px; box-shadow:0 4px 12px rgba(0,0,0,0.15); font-family:sans-serif;';
            document.body.appendChild(caja);
        }
        caja.innerHTML = '<b>⚠️ Ajuste automático a una página</b><ul style="margin:6px 0 0 18px; padding:0;">' +
            mensajes.map(m => `<li>${m}</li>`).join('') +
            '</ul><div style="text-align:right; margin-top:8px;"><button onclick="document.getElementById(\'sugerencias-aviso-ajuste\').remove()" style="cursor:pointer; background:none; border:none; color:#92400e; text-decoration:underline; font-size:0.8rem; padding:0;">Cerrar</button></div>';
    };
})();
