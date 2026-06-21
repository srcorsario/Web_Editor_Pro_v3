// --- organizador.js ---
// NUEVO: Módulo de gestión visual de Estructuras (IDs y Categorías)
// Se ejecuta en scope aislado pero expone funciones clave a window para los onclick del HTML.

(function() {
    'use strict';

    // Registro de versión
    window.APP_VERSIONS = window.APP_VERSIONS || {};
    window.APP_VERSIONS.organizador = '1.0.1'; // MODIFICADO: Incrementado por ajuste de UI

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
                // Categoría Principal con subcategorías
                flat.push({
                    id: cat.id,
                    name: cat.name,
                    max: cat.id + (cat.rango || 99), // Calculamos el máximo basándonos en el rango
                    folder: cat.folder || '',
                    level: 0,
                    hasChildren: true
                });
                
                // Subcategorías
                cat.sub.forEach(sub => {
                    flat.push({
                        id: sub.id,
                        name: sub.name,
                        max: sub.max || (sub.id + 99), 
                        folder: sub.folder || cat.folder || '', // Hereda la carpeta del padre si no tiene
                        level: 1,
                        hasChildren: false
                    });
                });
            } else {
                // Categoría sin subcategorías (ej. Niños, Cafés)
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

        // MODIFICADO: Ajustado el ancho de las columnas de ID a 120px para visualizar correctamente 5 dígitos
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

    /**
     * Función auxiliar expuesta a window para actualizar el estado interno desde los inputs
     * sin usar eval ni generar funciones anónimas masivamente en el HTML.
     */
    window._orgUpdateItem = function(index, key, value) {
        const data = estadoOrganizador.data[estadoOrganizador.activeTab];
        if (!data || !data[index]) return;
        
        if (key === 'id' || key === 'max') {
            data[index][key] = parseInt(value) || 0;
        } else {
            data[index][key] = value;
        }
    };

    /**
     * Cambia la pestaña visual interna del organizador (Carta 01 vs Carta 02)
     */
    function switchOrgTab(modo) {
        estadoOrganizador.activeTab = modo;
        
        // Actualizar clases visuales
        document.querySelectorAll('.org-tab-btn').forEach(btn => {
            btn.classList.remove('active-org-tab');
        });
        const activeBtn = document.getElementById(`org-tab-${modo.toLowerCase()}`);
        if (activeBtn) activeBtn.classList.add('active-org-tab');
        
        renderOrganizador();
    }

    /**
     * Reconstruye el árbol jerárquico desde la tabla aplanada y sobrescribe la ESTRUCTURA global.
     * Expuesta a window para el onclick del botón "Aplicar".
     */
    window.aplicarEstructuraOrg = function() {
        const flatData = estadoOrganizador.data[estadoOrganizador.activeTab];
        if (!flatData || flatData.length === 0) return;

        const newEstructura = [];
        let currentParent = null;

        flatData.forEach(item => {
            if (item.level === 0) {
                // Para las categorías principales, ESTRUCTURA usa 'rango', no 'max'
                currentParent = {
                    id: item.id,
                    name: item.name,
                    rango: Math.max(0, item.max - item.id), // NUEVO: Recalculamos el rango dinámicamente
                    folder: item.folder,
                    sub: []
                };
                newEstructura.push(currentParent);
            } else if (item.level === 1) {
                // Las subcategorías usan 'max' explícito
                if (currentParent && currentParent.sub) {
                    currentParent.sub.push({
                        id: item.id,
                        name: item.name,
                        max: item.max,
                        folder: item.folder || currentParent.folder // Si está vacío, hereda del padre
                    });
                }
            }
        });

        // Sobrescribir la estructura global que usa app.js
        window.ESTRUCTURA = newEstructura;

        // Forzar la recarga visual del Editor Principal (Pestaña 1 y botón flotante +)
        if (typeof window.renderizar === 'function') window.renderizar();
        if (typeof window.generarMenuAgrupado === 'function') window.generarMenuAgrupado();

        // Feedback visual en la consola del sistema
        const alias = (typeof getModoAlias === 'function') ? getModoAlias(estadoOrganizador.activeTab) : estadoOrganizador.activeTab;
        if (typeof window.UI !== 'undefined' && typeof window.UI.log === 'function') {
            window.UI.log(`[Organizador] ✅ Estructura de ${alias} aplicada en memoria local. (Nota: Al recargar la página se restaurá la original de data.js a menos que la guardes en el servidor).`);
        } else {
            alert(`✅ Estructura de ${alias} aplicada en memoria local.`);
        }
    };

    /**
     * Inicialización del módulo
     */
    function inicializarOrganizador() {
        // Esperar a que data.js inyecte la estructura global
        if (!window.ESTRUCTURA) {
            console.warn("[Organizador] ESTRUCTURA global no encontrada. Abortando inicialización.");
            return;
        }

        // Como actualmente solo hay una ESTRUCTURA en data.js, inicializamos ambas pestañas 
        // con la misma base para que el usuario pueda bifurcarlas y editarlas por separado.
        estadoOrganizador.data.RG = aplanarEstructura(window.ESTRUCTURA);
        estadoOrganizador.data.USOPEN = aplanarEstructura(window.ESTRUCTURA);

        // Vincular eventos de pestañas
        const btnRG = document.getElementById('org-tab-rg');
        const btnUSOPEN = document.getElementById('org-tab-usopen');
        
        if (btnRG) btnRG.onclick = () => switchOrgTab('RG');
        if (btnUSOPEN) btnUSOPEN.onclick = () => switchOrgTab('USOPEN');

        // Vincular evento de aplicar (Ya está en el HTML como onclick, pero por consistencia)
        const btnAplicar = document.getElementById('org-btn-aplicar');
        if (btnAplicar) {
            btnAplicar.onclick = () => window.aplicarEstructuraOrg();
        }

        // Renderizar estado inicial
        renderOrganizador();
        console.log("[Organizador] Módulo inicializado correctamente.");
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarOrganizador);
    } else {
        // Si el script se carga al final del body, el DOM ya existe
        inicializarOrganizador();
    }

})();
