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
            @page { size: A4; margin: 15mm 10mm; } /* Margen superior/inferior a 15mm (10mm original + 5mm más) */
            .sugerencias-panel { background: #ffffff !important; padding: 15px 25px !important; width: 100% !important; max-width: 190mm !important; min-height: 267mm !important; margin: 0 auto !important; font-family: 'Montserrat', sans-serif !important; box-sizing: border-box !important; display: flex !important; flex-direction: column !important; position: relative !important; }
            /* NUEVO: rectángulo de depuración visual — marca exactamente los 190mm x 267mm de zona
               imprimible real (el resultado de A4 menos los márgenes de @page). Se ancla al propio
               .sugerencias-panel (que ya tiene position:relative) para que top/left:0 coincida con
               su esquina real sin depender de márgenes del body, y con height fija en mm para que
               NO crezca si el contenido se desborda — así se ve a simple vista si algo se pasa de la
               línea roja. Solo en pantalla: oculto en la impresión real vía @media print más abajo.
            */
            .sugerencias-debug-a4 { position: absolute !important; top: 0; left: 0 !important; width: 100% !important; height: 267mm !important; border: 2px solid red !important; box-sizing: border-box !important; pointer-events: none !important; z-index: 9998 !important; }
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
            .sugerencias-footer { padding-top: 15px !important; display: flex !important; flex-direction: column !important; align-items: center !important; width: 100% !important; }
            .sugerencias-advertencia-alergenos { font-size: 0.6rem !important; color: #64748b !important; max-width: 80% !important; line-height: 1.3 !important; text-align: center !important; font-style: italic !important; margin: 0 auto 5px auto !important; }
            .sugerencias-qr-container { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 5px !important; }
            .sugerencias-qr-img { width: 90px !important; height: 90px !important; object-fit: contain !important; } 
            .sugerencias-qr-toggle { font-size: 0.7rem !important; color: #64748b !important; cursor: pointer !important; display: flex !important; user-select: none !important; gap: 5px !important; }
            .sugerencias-qr-toggle input:checked + span { font-weight: bold; }
            .sugerencias-qr-img { transition: opacity 0.3s; }
            .sugerencias-vino-imagen-wrapper { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center !important; padding: 20px 0 8px 0 !important; column-gap: 10px !important; }
            .sugerencias-vino-imagen { justify-self: center !important; height: 140px; width: auto; max-width: 300px; object-fit: contain !important; transition: height 0.15s ease !important; }
            .sugerencias-vino-imagen-wrapper .sugerencias-qr-img { justify-self: end !important; }
            .vino-imagen-selector-wrapper { font-size: 0.75rem !important; color: #64748b !important; }
            .btn-imprimir-a4 { display: block; width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; margin-bottom: 15px; text-align: center; }
            /* NUEVO: box de controles, deliberadamente separado y con estilo distinto (fondo gris,
               borde, debajo de la hoja blanca) para que se note a simple vista que NO es parte de
               la hoja A4 que se imprime — solo agrupa el botón de imprimir y las opciones (imagen
               del vino, tamaño, tipo de QR), extraídas de dentro de la hoja para dejarla como un
               espejo fiel de lo que sale impreso. */
            .sugerencias-controles-box { max-width: 190mm; margin: 15px auto 0 auto; padding: 15px 20px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 10px; box-sizing: border-box; font-family: 'Montserrat', sans-serif; }
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
            @media print { body { -webkit-print-color-adjust: exact !important; } .sugerencias-controles-box, .sugerencias-debug-a4 { display: none !important; } }
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
    // MODIFICADO: ya no se usa un ancho porcentual — ver .sugerencias-vino-imagen (height fijo,
    // width:auto). Un porcentaje se resolvía de forma poco fiable dentro de la columna "auto"
    // del grid, dejando la botella más corta que el QR aunque compartieran la misma base.
    const VINO_IMAGEN_ESCALAS = [1, 1.2, 1.4, 1.6];
    // MODIFICADO: tamaño por defecto ahora es 1.4x (antes 1x).
    const VINO_IMAGEN_ESCALA_DEFAULT = 1.4;
    // MODIFICADO: base del QR igualada a VINO_IMAGEN_BASE_MAX_HEIGHT (antes 90px, un tamaño
    // propio distinto) — así, al aplicar la misma escala a ambas, el QR sale siempre con la
    // misma altura vertical que la botella (antes no coincidían: 90px vs 140px en la base).
    const QR_IMAGEN_BASE_SIZE = VINO_IMAGEN_BASE_MAX_HEIGHT; // px

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
            img.style.height = (VINO_IMAGEN_BASE_MAX_HEIGHT * escala) + 'px';
        }
        const qrImg = wrapper.querySelector('.sugerencias-qr-img');
        if (qrImg) {
            const qrTamano = (QR_IMAGEN_BASE_SIZE * escala) + 'px';
            qrImg.style.setProperty('width', qrTamano, 'important');
            qrImg.style.setProperty('height', qrTamano, 'important');
        }
    };

    // NUEVO: coloca el rectángulo de depuración (.sugerencias-debug-a4) justo debajo del botón
    // "Imprimir Sugerencias..." — ese botón solo existe en pantalla (se oculta con @media print),
    // así que el rectángulo debe empezar en la CABECERA real (logo/título), no en el borde superior
    // absoluto del panel, o si no "engloba" también al botón, que nunca sale impreso. Se ancla vía
    // offsetTop del propio header (el panel ya es position:relative) para que no dependa de a qué
    // altura empiece a pintarse el botón en cada caso.
    function posicionarDebugA4(panel) {
        if (!panel) return;
        const debugDiv = panel.querySelector('.sugerencias-debug-a4');
        const header = panel.querySelector('.sugerencias-header-layout');
        if (debugDiv && header) debugDiv.style.top = header.offsetTop + 'px';
    }
    window.posicionarDebugA4 = posicionarDebugA4;

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

        // MODIFICADO: la hoja A4 real (.sugerencias-panel) ya NO contiene el botón de imprimir ni
        // ninguna opción — así lo que se ve dentro de ella en pantalla es EXACTAMENTE lo que se
        // imprime, sin nada de interfaz mezclado. El botón y las opciones (Imagen Vino, Tamaño,
        // Tipo de QR) se juntan en un box aparte, debajo de la hoja (ver más abajo, sugerencias-controles-box).
        let html = `<div class="sugerencias-panel">
            <div class="sugerencias-debug-a4"></div>
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
        const vinoImgAlturaInicial = VINO_IMAGEN_BASE_MAX_HEIGHT * VINO_IMAGEN_ESCALA_DEFAULT;
        const qrTamanoInicial = QR_IMAGEN_BASE_SIZE * VINO_IMAGEN_ESCALA_DEFAULT;
        const vinoImagenHtml = tieneVinoEspecial
            ? `<div class="sugerencias-vino-imagen-wrapper" id="${config.vinoImagenWrapperId}">
                <span></span>
                <img src="${config.vinoImagenSrc}" class="sugerencias-vino-imagen" style="display:${vinoImagenDefaultCon ? '' : 'none'}; height:${vinoImgAlturaInicial}px;" onerror="this.style.display='none';">
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
                ${tieneVinoEspecial ? '' : `<div class="sugerencias-qr-container"><img src="${initialImgSrc}" class="sugerencias-qr-img" id="${config.qrImgId}"></div>`}
            </div>
        </div>`;

        // NUEVO: box de controles, SEPARADO de la hoja A4 y colocado debajo de ella — agrupa
        // todo lo que antes vivía disperso dentro de la propia hoja (botón de imprimir arriba del
        // todo, opciones de imagen del vino/tamaño y de QR abajo del todo): así la hoja de encima
        // es un espejo fiel y exclusivo de lo que se va a imprimir, y aquí abajo se controla cómo.
        let controlesHtml = `<div class="sugerencias-controles-box">
                <button onclick="window.imprimirSugerencias('${modoSeguro}')" class="btn-imprimir-a4">🖨️ Imprimir Sugerencias ${getModoAlias(modoSeguro)} (A4)</button>
                ${(vinoImagenButtonsHtml || vinoImagenEscalaHtml) ? `<div class="qr-selector-wrapper" style="font-size: 0.75rem; color: #64748b; text-align: center; margin-bottom: 3px; user-select:none; display: flex; flex-direction: row; align-items: center; justify-content: center; flex-wrap: nowrap; gap: 8px; white-space: nowrap;">${vinoImagenButtonsHtml ? `<span class="vino-imagen-selector-wrapper" style="display:flex; align-items:center; gap:8px; padding-right:10px; border-right:1px solid #cbd5e1;">Imagen Vino: ${vinoImagenButtonsHtml}</span>` : ''}${vinoImagenEscalaHtml ? `<span class="vino-imagen-selector-wrapper" style="display:flex; align-items:center; gap:6px;">Tamaño: ${vinoImagenEscalaHtml}</span>` : ''}</div>` : ''}
                <div class="qr-selector-wrapper" style="font-size: 0.75rem; color: #64748b; text-align: center; margin-bottom: 0; user-select:none; display: flex; flex-direction: row; align-items: center; justify-content: center; flex-wrap: nowrap; gap: 8px; white-space: nowrap;">Tipo de QR: ${qrButtonsHtml}</div>
            </div>`;

        contenedor.innerHTML = html + controlesHtml;
        posicionarDebugA4(contenedor);
    }

    window.imprimirSugerencias = function(modo) {
        const config = SUGERENCIAS_CONFIG[modo];
        if (!config) return;
        const contenedor = document.getElementById(config.containerId);
        if (!contenedor) return;
        // MODIFICADO: contenedor ya no ES la hoja — ahora también incluye debajo el box de
        // controles (botón imprimir, opciones). Se busca el div.sugerencias-panel real dentro,
        // que es exactamente lo único que debe imprimirse.
        const panelReal = contenedor.querySelector('.sugerencias-panel');
        if (!panelReal) return;
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

            function mmDesdePx(px, maxAlturaPx) { return (px * 267 / maxAlturaPx).toFixed(1); }

            // NUEVO: mismo posicionamiento que en la pestaña general (ver posicionarDebugA4 en
            // sugerencias-print.js) — duplicado aquí porque esta ventana emergente es un documento
            // JS completamente aparte y no puede llamar a funciones del documento padre sin depender
            // de window.opener (poco fiable con bloqueadores de popups).
            function posicionarDebugA4(panel) {
                var debugDiv = panel.querySelector('.sugerencias-debug-a4');
                var header = panel.querySelector('.sugerencias-header-layout');
                if (debugDiv && header) debugDiv.style.top = header.offsetTop + 'px';
            }
            posicionarDebugA4(document.querySelector('.sugerencias-panel'));

            // NUEVO: mide por separado el "bloque fijo" de abajo — el aviso de alérgenos (2 líneas)
            // más la sección BODEGA / WINE CELLAR completa (título + nombre del vino + imagen del
            // vino a su escala actual, p.ej. 1.4x, + QR) — porque su altura NO depende de cuántos
            // entrantes/principales/postres haya. Conociendo esta altura fija (y la de la cabecera,
            // que tampoco varía) se puede calcular de una vez cuánto sitio le queda de verdad a
            // Entrantes/Principales/Postres, en vez de ir remidiendo el panel entero a ciegas en
            // cada paso.
            function medirBloqueFijo(panel) {
                var header = panel.querySelector('.sugerencias-header-layout');
                var alturaHeader = header ? header.getBoundingClientRect().height : 0;

                var footer = panel.querySelector('.sugerencias-footer');
                var alturaFooter = footer ? footer.getBoundingClientRect().height : 0;

                var alturaBodega = 0;
                panel.querySelectorAll('.sugerencias-seccion-titulo').forEach(function(titulo) {
                    if (titulo.textContent.indexOf('BODEGA') !== -1 && titulo.parentElement) {
                        alturaBodega = titulo.parentElement.getBoundingClientRect().height;
                    }
                });

                return { alturaHeader: alturaHeader, alturaFooter: alturaFooter, alturaBodega: alturaBodega, alturaFija: alturaHeader + alturaFooter + alturaBodega };
            }

            function ajustarAUnaPagina() {
                var resultado = { espacioCategoriasReducido: false, imagenVinoQuitada: false, qrQuitado: false, textoReducido: false, medidas: [] };
                var panel = document.querySelector('.sugerencias-panel');
                if (!panel) return resultado;

                var probe = document.createElement('div');
                probe.style.cssText = 'position:absolute; visibility:hidden; height:267mm; width:0;';
                document.body.appendChild(probe);
                var maxAlturaPx = probe.getBoundingClientRect().height;
                document.body.removeChild(probe);

                // CORREGIDO: antes había que ocultar aquí las filas de selectores y el botón de
                // imprimir antes de medir (solo existían para pantalla, se ocultaban vía @media
                // print). Ya no hace falta: ahora viven en un box de controles aparte, en la
                // página principal — a esta ventana de impresión solo se copia la hoja real
                // (.sugerencias-panel), así que nunca llegan a existir aquí.
                // .sugerencias-debug-a4 SÍ sigue formando parte de la hoja, y sigue haciendo falta
                // ocultarlo antes de medir. Es position:absolute con una altura FIJA de 267mm
                // dentro de un panel position:relative — eso hace que cuente para el scrollHeight
                // del panel (el navegador incluye el alcance de los descendientes posicionados al
                // calcularlo). En cuanto el contenido real se queda más corto que esos 267mm fijos,
                // el rectángulo pasa a ser el elemento más bajo del panel y el scrollHeight deja de
                // reflejar el contenido real — se queda "pegado" a la altura del rectángulo y no
                // baja aunque se quite la imagen del vino, el QR, o se reduzca el texto. Se vuelve
                // a mostrar y reposicionar al final, con el resultado ya decidido, solo para que la
                // persona lo vea en la pantalla de aviso.
                document.querySelectorAll('.sugerencias-debug-a4').forEach(function(el) {
                    el.style.setProperty('display', 'none', 'important');
                });


                function medir(etiqueta) {
                    void panel.offsetHeight;
                    var bloqueFijo = medirBloqueFijo(panel);
                    var alturaMm = mmDesdePx(panel.scrollHeight, maxAlturaPx);
                    var pieFijoMm = mmDesdePx(bloqueFijo.alturaFija, maxAlturaPx);
                    var disponibleCategoriasMm = mmDesdePx(maxAlturaPx - bloqueFijo.alturaFija, maxAlturaPx);
                    resultado.medidas.push(etiqueta + ': ' + alturaMm + 'mm de 267mm (cabecera+alérgenos+BODEGA: ' + pieFijoMm + 'mm → tope máximo disponible para Entrantes/Principales/Postres: ' + disponibleCategoriasMm + 'mm)');
                    // CORREGIDO: la tolerancia estaba en "+2" sin unidad — como maxAlturaPx está en
                    // píxeles, esos "+2" eran 2px (~0.5mm), un margen casi nulo. Se calcula ahora el
                    // equivalente real a 1mm de margen de tolerancia (imperceptible en el resultado
                    // impreso), para no forzar pasos de más por un desajuste de décimas de milímetro.
                    var pxPorMm = maxAlturaPx / 267;
                    return panel.scrollHeight <= (maxAlturaPx + pxPorMm);
                }

                if (medir('Original')) return resultado;

                // AFINADO: pasos más finos (4% en vez de 15%, hasta 18 pasos = 72% de reducción
                // máxima en vez de solo 60%) — con los saltos grandes de antes, un desajuste de
                // apenas 0.5mm por encima del límite (267mm + ~0.5mm de margen de tolerancia) ya
                // hacía saltar directamente a quitar la imagen del vino. Con pasos finos, el bucle
                // encuentra el punto justo de apriete que hace falta y para ahí mismo.
                var pasosGap = 0, MAX_PASOS_GAP = 18;
                while (!medir('Apretando espacio entre categorías, paso ' + pasosGap) && pasosGap < MAX_PASOS_GAP) {
                    pasosGap++;
                    var factorGap = 1 - (pasosGap * 0.04); // 12px baja de 4% en 4% hasta el 72% (3.4px) como mucho
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

                // NUEVO: en vez de arrancar la reducción de texto en 100% e ir bajando de 3% en 3%
                // a ciegas (hasta 12 remedidas del panel entero), se calcula primero un factor de
                // arranque directamente a partir del tope máximo real ya conocido (cabecera +
                // alérgenos + BODEGA a su escala actual) frente a lo que ocupan de verdad ahora
                // mismo Entrantes/Principales/Postres. Así se salta en un solo paso cerca del punto
                // necesario, y el bucle de abajo solo tiene que afinar (normalmente 0-1 pasos más)
                // en vez de recorrer la escala entera paso a paso.
                var bloqueFijoActual = medirBloqueFijo(panel);
                var disponibleParaCategoriasPx = maxAlturaPx - bloqueFijoActual.alturaFija;
                var alturaCategoriasActualPx = 0;
                panel.querySelectorAll('.sugerencias-seccion').forEach(function(sec) {
                    var titulo = sec.querySelector('.sugerencias-seccion-titulo');
                    if (titulo && titulo.textContent.indexOf('BODEGA') !== -1) return; // Bodega ya cuenta como bloque fijo
                    alturaCategoriasActualPx += sec.getBoundingClientRect().height;
                });
                if (alturaCategoriasActualPx > 0 && disponibleParaCategoriasPx > 0) {
                    var factorEstimado = disponibleParaCategoriasPx / alturaCategoriasActualPx;
                    // -0.03 de margen de seguridad extra (el texto no encoge 100% proporcional al alto
                    // por el interlineado), y nunca se salta de golpe por debajo del 70%.
                    var factorInicial = Math.max(0.7, Math.min(1, factorEstimado - 0.03));
                    if (factorInicial < 1) {
                        factor = factorInicial;
                        pasos = Math.max(1, Math.round((1 - factor) / 0.03));
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
                        resultado.medidas.push('Salto directo a factor ' + (factor * 100).toFixed(0) + '% (disponible categorías: ' + mmDesdePx(disponibleParaCategoriasPx, maxAlturaPx) + 'mm, necesario: ' + mmDesdePx(alturaCategoriasActualPx, maxAlturaPx) + 'mm)');
                    }
                }

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

            // NUEVO: aunque el contenido quepa en una página (con o sin reducciones), casi nunca
            // ocupa EXACTAMENTE 267mm — sobra algo de hueco. Antes ese hueco quedaba todo junto
            // entre BODEGA y el aviso de alérgenos (un salto grande y feo), porque .sugerencias-body
            // tiene flex:1 (se estira para llenar el alto disponible) pero sus hijos no repartían
            // ese sobrante entre ellos. Aquí se mide el hueco real y se reparte como margen extra
            // ÚNICAMENTE entre Entrantes/Principales/Postres (nunca tras BODEGA), para que BODEGA
            // quede siempre pegada al aviso de alérgenos, sea cual sea el hueco sobrante.
            function repartirEspacioSobrante() {
                var panel = document.querySelector('.sugerencias-panel');
                if (!panel) return;

                var probe = document.createElement('div');
                probe.style.cssText = 'position:absolute; visibility:hidden; height:267mm; width:0;';
                document.body.appendChild(probe);
                var maxAlturaPx = probe.getBoundingClientRect().height;
                document.body.removeChild(probe);

                var footer = panel.querySelector('.sugerencias-footer');
                if (!footer) return;
                void panel.offsetHeight;

                // CORREGIDO: panel.scrollHeight no servía aquí — .sugerencias-panel tiene
                // min-height:267mm !important, así que el propio panel YA mide 267mm aunque el
                // contenido real ocupe mucho menos (una carta corta), y "maxAlturaPx - scrollHeight"
                // salía siempre ~0 (nunca se repartía nada). Se mide en su lugar dónde termina DE
                // VERDAD el contenido: el borde inferior real del footer respecto al borde superior
                // de la hoja — esa es la altura que el contenido ocupa de verdad.
                var panelRect = panel.getBoundingClientRect();
                var footerRect = footer.getBoundingClientRect();
                var alturaContenidoReal = footerRect.bottom - panelRect.top;
                var libre = maxAlturaPx - alturaContenidoReal;
                if (libre <= 0) return; // no hay hueco que repartir (o el contenido ya está muy justo)

                var secciones = [];
                panel.querySelectorAll('.sugerencias-seccion').forEach(function(sec) {
                    var titulo = sec.querySelector('.sugerencias-seccion-titulo');
                    if (titulo && titulo.textContent.indexOf('BODEGA') === -1) secciones.push(sec);
                });
                if (secciones.length === 0) return;

                // MODIFICADO: sin tope — se reparte el sobrante COMPLETO entre Entrantes/
                // Principales/Postres. Con cartas muy cortas (pocas categorías) esto puede dejar
                // más separación entre ellas de lo habitual, pero es preferible a dejar un hueco
                // muerto sin usar después del aviso de alérgenos.
                var extraPorSeccion = libre / secciones.length;
                secciones.forEach(function(sec) {
                    var actual = parseFloat(getComputedStyle(sec).marginBottom) || 0;
                    sec.style.setProperty('margin-bottom', (actual + extraPorSeccion) + 'px', 'important');
                });
            }

            esperarImagenes(document.body).then(function() {
                var resultado = ajustarAUnaPagina();
                repartirEspacioSobrante();
                // Volver a mostrar el rectángulo de depuración con el resultado YA decidido (no
                // afecta a ninguna medición a partir de aquí) y reposicionarlo, porque la cabecera
                // puede haberse movido un poco tras apretar el espacio entre categorías.
                var debugDiv = document.querySelector('.sugerencias-debug-a4');
                if (debugDiv) { debugDiv.style.removeProperty('display'); posicionarDebugA4(document.querySelector('.sugerencias-panel')); }
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

        pWin.document.write(`<html><head><title>Sugerencias ${getModoAlias(modo)}</title><style>${styleContent}@media print { #sugerencias-aviso-ajuste { display: none !important; } }</style></head><body>${panelReal.outerHTML}<script>${scriptAjuste}<\/script></body></html>`);
        pWin.document.close();
    };
})();
