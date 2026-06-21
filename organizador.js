// --- organizador.js ---
// NUEVO: Módulo de gestión visual de Estructuras (IDs y Categorías)
// Se ejecuta en scope aislado pero expone funciones clave a window para los onclick del HTML.

(function() {
    'use strict';

    // Registro de versión
    window.APP_VERSIONS = window.APP_VERSIONS || {};
    window.APP_VERSIONS.organizador = '1.2.0'; // MODIFICADO: Incrementado por auto-cálculo de rangos

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

    /**
     * Función auxiliar expuesta a window para actualizar el estado interno desde los inputs.
     * MODIFICADO: Ahora incluye auto-cálculo de rangos para evitar solapamientos matemáticos.
     */
    window._orgUpdateItem = function(index, key, value) {
        const data = estadoOrganizador.data[estadoOrganizador.activeTab];
        if (!data || !data[index]) return;
        
        if (key === 'id') {
            const newId = parseInt(value) || 0;
            data[index].id = newId;
            
            // 1. Calcular el nuevo 'max' basado en el inicio de la categoría siguiente
            let nuevoMaxCalculado = newId + 99; // Fallback por defecto
            if (index < data.length - 1) {
                // Buscar el siguiente elemento de nivel 0 (Categoría Principal)
                let nextMainIndex = index + 1;
                while (nextMainIndex < data.length && data[nextMainIndex].level !== 0) {
                    nextMainIndex++;
                }
                
                if (nextMainIndex < data.length) {
                    const nextId = data[nextMainIndex].id;
                    if (newId >= nextId) {
                        // El nuevo ID pisa o supera al siguiente. Forzamos el máximo al límite seguro.
                        nuevoMaxCalculado = nextId - 1;
                    } else {
                        // Hay espacio. El máximo puede ser el del siguiente ID menos 1.
                        nuevoMaxCalculado = nextId - 1;
                    }
                }
            }
            
            data[index].max = nuevoMaxCalculado;
            
            // 2. Ajustar el 'max' de la categoría ANTERIOR para que no queden huecos
            if (index > 0) {
                let prevMainIndex = index - 1;
                // Si el anterior es una subcategoría, subimos hasta encontrar la principal
                while (prevMainIndex > 0 && data[prevMainIndex].level !== 0) {
                    prevMainIndex--;
                }
                
                if (prevMainIndex >= 0 && data[prevMainIndex].level === 0) {
                    // El máximo de la categoría anterior debe ser el ID actual menos 1
                    data[prevMainIndex].max = newId - 1;
                }
            }
            
            // Forzar re-render para que el usuario vea los límites ajustados al instante
            renderOrganizador();
            
        } else if (key === 'max') {
            data[index].max = parseInt(value) || 0;
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
     * MODIFICADO: Aplica ÚNICAMENTE los NOMBRES de forma aislada por modo (Carta 01 vs Carta 02)
     * mediante el diccionario CATEGORY_OVERRIDES. Los IDs se mantienen intactos para proteger la estructura global compartida.
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
