// --- organizador.js ---
// NUEVO: Módulo de gestión visual de Estructuras (IDs y Categorías)
// Se ejecuta en scope aislado pero expone funciones clave a window para los onclick del HTML.

(function() {
    'use strict';

    // Registro de versión
    window.APP_VERSIONS = window.APP_VERSIONS || {};
    window.APP_VERSIONS.organizador = '1.1.0'; // MODIFICADO: Incrementado por aislamiento de nombres por modo

    // Estado interno del módulo
    const estadoOrganizador = {
        activeTab: 'RG', // 'RG' o 'USOPEN'
        data: {
            RG: [],      // Estructura aplanada para editar
            USOPEN: []   // Estructura aplanada para editar
        }
    };

    /**
     * Convierte el árbol jerárquico de data.js en un array plano fácil de renderizar en una tabla.
     * @param {Array} est Arbol ESTRUCTURA original
     * @returns {Array} Array de objetos planos { id, name, max, folder, level, hasChildren }
     */
    function aplanarEstructura(est) {
        if (!est || !Array.isArray(est)) return [];
        let flat = [];
        
        est.forEach(cat => {
            if (cat.sub && cat.sub.length > 0) {
                flat.push({
                    id: cat.id,
                    name: cat.name,
                    max: cat.id + (cat.rango || 99), 
                    folder: cat.folder || '',
                    level: 0,
                    hasChildren: true
                });
                
                cat.sub.forEach(sub => {
                    flat.push({
                        id: sub.id,
                        name: sub.name,
                        max: sub.max || (sub.id + 99), 
                        folder: sub.folder || cat.folder || '', 
                        level: 1,
                        hasChildren: false
                    });
                });
            } else {
                flat.push({
                    id: cat.id,
                    name: cat.name,
                    max: cat.id + (cat.rango || 99),
                    folder: cat.folder || '',
                    level: 0,
                    hasChildren: false
                });
            }
        });
        
        return flat;
    }

    /**
     * Renderiza la tabla de edición basada en la pestaña activa actual
     */
    function renderOrganizador() {
        const container = document.getElementById('org-table-container');
        if (!container) return;

        const currentData = estadoOrganizador.data[estadoOrganizador.activeTab];
        if (!currentData || currentData.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-slate-500 italic">No hay estructura cargada para este restaurante.</div>';
            return;
        }

        let html = `<table class="org-table">
            <thead>
                <tr>
                    <th style="width: 120px;">ID Inicio</th>
                    <th style="width: 120px;">ID Fin (Max)</th>
                    <th>Nombre Categoría</th>
                    <th style="width: 130px;">Carpeta</th>
                </tr>
            </thead>
            <tbody>`;

        currentData.forEach((item, index) => {
            const rowClass = `org-level-${item.level}`;
            const indent = item.level === 1 ? '&nbsp;&nbsp;&nbsp;↳ ' : '';
            const disabledAttr = item.level === 1 ? 'disabled title="Hereda de la principal o se ignora en subcategorías"' : '';
            
            html += `<tr class="${rowClass}">
                <td>
                    <input type="number" value="${item.id}" 
                           onchange="window._orgUpdateItem(${index}, 'id', this.value)">
                </td>
                <td>
                    <input type="number" value="${item.max}" 
                           onchange="window._orgUpdateItem(${index}, 'max', this.value)">
                </td>
                <td style="display: flex; align-items: center;">
                    <span style="white-space: pre; user-select: none; color: #95a5a6;">${indent}</span>
                    <input type="text" value="${item.name}" 
                           onchange="window._orgUpdateItem(${index}, 'name', this.value)"
                           style="flex: 1;">
                </td>
                <td>
                    <input type="text" value="${item.folder}" 
                           onchange="window._orgUpdateItem(${index}, 'folder', this.value)"
                           ${disabledAttr}>
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    window._orgUpdateItem = function(index, key, value) {
        const data = estadoOrganizador.data[estadoOrganizador.activeTab];
        if (!data || !data[index]) return;
        
        if (key === 'id' || key === 'max') {
            data[index][key] = parseInt(value) || 0;
        } else {
            data[index][key] = value;
        }
    };

    function switchOrgTab(modo) {
        estadoOrganizador.activeTab = modo;
        
        document.querySelectorAll('.org-tab-btn').forEach(btn => {
            btn.classList.remove('active-org-tab');
        });
        const activeBtn = document.getElementById(`org-tab-${modo.toLowerCase()}`);
        if (activeBtn) activeBtn.classList.add('active-org-tab');
        
        renderOrganizador();
    }

    /**
     * Reconstruye el árbol jerárquico desde la tabla aplanada y sobrescribe la ESTRUCTURA global.
     * MODIFICADO: Ahora aplica ÚNICAMENTE los NOMBRES de forma aislada por modo (Carta 01 vs Carta 02)
     * mediante el diccionario CATEGORY_OVERRIDES, evitando que un cambio de texto pise al otro restaurante.
     */
    window.aplicarEstructuraOrg = function() {
        const flatData = estadoOrganizador.data[estadoOrganizador.activeTab];
        if (!flatData || flatData.length === 0) return;

        const modo = estadoOrganizador.activeTab;
        
        // Asegurar que el sistema de overrides existe
        if (!window.CATEGORY_OVERRIDES) {
            window.CATEGORY_OVERRIDES = { RG: {}, USOPEN: {} };
        }
        
        // Limpiar overrides anteriores para este modo y aplicar los nuevos nombres
        window.CATEGORY_OVERRIDES[modo] = {};
        flatData.forEach(item => {
            // Guardar el nombre personalizado exclusivamente para este modo
            window.CATEGORY_OVERRIDES[modo][item.id] = item.name;
        });

        // Forzar la recarga visual del Editor Principal
        // Para que renderice con el override correcto, forzamos temporalmente el modo activo
        const previousMode = window.currentMode;
        window.currentMode = modo; 
        
        if (typeof window.renderizar === 'function') window.renderizar();
        if (typeof window.generarMenuAgrupado === 'function') window.generarMenuAgrupado();

        window.currentMode = previousMode; // Restaurar contexto real

        // Feedback visual en la consola del sistema
        const alias = (typeof getModoAlias === 'function') ? getModoAlias(modo) : modo;
        if (typeof window.UI !== 'undefined' && typeof window.UI.log === 'function') {
            window.UI.log(`[Organizador] ✅ Nombres de ${alias} aplicados de forma aislada. La Carta 01 no se ha visto afectada. (Recargar la página restaura los nombres originales).`);
        } else {
            alert(`✅ Nombres de ${alias} aplicados de forma aislada.`);
        }
    };

    function inicializarOrganizador() {
        if (!window.ESTRUCTURA) {
            console.warn("[Organizador] ESTRUCTURA global no encontrada. Abortando inicialización.");
            return;
        }

        estadoOrganizador.data.RG = aplanarEstructura(window.ESTRUCTURA);
        estadoOrganizador.data.USOPEN = aplanarEstructura(window.ESTRUCTURA);

        const btnRG = document.getElementById('org-tab-rg');
        const btnUSOPEN = document.getElementById('org-tab-usopen');
        
        if (btnRG) btnRG.onclick = () => switchOrgTab('RG');
        if (btnUSOPEN) btnUSOPEN.onclick = () => switchOrgTab('USOPEN');

        const btnAplicar = document.getElementById('org-btn-aplicar');
        if (btnAplicar) {
            btnAplicar.onclick = () => window.aplicarEstructuraOrg();
        }

        renderOrganizador();
        console.log("[Organizador] Módulo inicializado correctamente.");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarOrganizador);
    } else {
        inicializarOrganizador();
    }

})();
