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
