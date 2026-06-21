// --- organizador.js ---
// NUEVO: Módulo de gestión visual y estructural de Categorías por restaurante.
// Se ejecuta en scope aislado pero expone funciones clave a window para los onclick del HTML.

(function() {
    'use strict';

    // Registro de versión
    window.APP_VERSIONS = window.APP_VERSIONS || {};
    window.APP_VERSIONS.organizador = '2.0.1'; // MODIFICADO: Patch por cálculo de nuevos IDs y anchos de tabla

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

    // NUEVO: Reconstruye el árbol jerárquico desde la tabla aplanada para inyectarlo en el Editor
    function reconstruirArbol(flatData) {
        let tree = [];
        let currentCat = null;
        
        flatData.forEach(item => {
            if (item.level === 0) {
                currentCat = { 
                    id: item.id, 
                    name: item.name, 
                    rango: (item.max - item.id), 
                    folder: item.folder || ''
                };
                tree.push(currentCat);
            } else if (item.level === 1 && currentCat) {
                if (!currentCat.sub) currentCat.sub = [];
                currentCat.sub.push({
                    id: item.id,
                    name: item.name,
                    max: item.max,
                    folder: item.folder
                });
            }
        });
        
        // Limpiar sub vacíos para mantener compatibilidad estricta con data.js (ej. categoría 7000 sin subs)
        tree.forEach(cat => {
            if (cat.sub && cat.sub.length === 0) {
                delete cat.sub;
            }
        });
        
        return tree;
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

        // MODIFICADO: Ajustes estrictos de anchos de columna (IDs a 6 digitos, Nombre a la mitad, Carpeta al doble)
        let html = `<table class="org-table">
            <thead>
                <tr>
                    <th style="width: 90px;">ID Inicio</th>
                    <th style="width: 90px;">ID Fin</th>
                    <th style="width: 35%;">Nombre Categoría</th>
                    <th style="width: 180px;">Carpeta</th>
                    <th style="width: 80px;">Acciones</th>
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
                <td class="org-td-name">
                    <span style="white-space: pre; user-select: none; color: #95a5a6;">${indent}</span>
                    <input type="text" value="${item.name}" 
                           onchange="window._orgUpdateItem(${index}, 'name', this.value)">
                </td>
                <td>
                    <input type="text" value="${item.folder}" 
                           onchange="window._orgUpdateItem(${index}, 'folder', this.value)"
                           ${disabledAttr}>
                </td>
                <td class="org-action-btns">
                    ${item.level === 0 ? `<button class="org-btn-icon org-btn-add" onclick="window._orgAddSub(${index})" title="Añadir Subcategoría">+</button>` : ''}
                    <button class="org-btn-icon org-btn-del" onclick="window._orgRemoveItem(${index})" title="Eliminar elemento">✕</button>
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    /**
     * Función auxiliar expuesta a window para actualizar el estado interno desde los inputs.
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
                        nuevoMaxCalculado = nextId - 1;
                    } else {
                        nuevoMaxCalculado = nextId - 1;
                    }
                }
            }
            
            data[index].max = nuevoMaxCalculado;
            
            // 2. Ajustar el 'max' de la categoría ANTERIOR para que no queden huecos
            if (index > 0) {
                let prevMainIndex = index - 1;
                while (prevMainIndex > 0 && data[prevMainIndex].level !== 0) {
                    prevMainIndex--;
                }
                
                if (prevMainIndex >= 0 && data[prevMainIndex].level === 0) {
                    data[prevMainIndex].max = newId - 1;
                }
            }
            
            renderOrganizador();
            
        } else if (key === 'max') {
            data[index].max = parseInt(value) || 0;
        } else {
            data[index][key] = value;
        }
    };

    // MODIFICADO: Corregida la lógica para sumar bloques de 100 en lugar de secuencial +1
    window._orgAddSub = function(parentIndex) {
        const data = estadoOrganizador.data[estadoOrganizador.activeTab];
        const parent = data[parentIndex];
        if (!parent || parent.level !== 0) return;

        let insertIndex = parentIndex + 1;
        let childIds = [];
        
        // Avanzar hasta pasar todos los hijos actuales de este padre y recolectar sus IDs
        while (insertIndex < data.length && data[insertIndex].level === 1) {
            childIds.push(data[insertIndex].id);
            insertIndex++;
        }
        
        // Calcular el siguiente bloque de 100 disponible
        // Si no hay hijos, el primer hijo será el ID del padre + 100 (ej: 1000 -> 1100)
        // Si hay hijos, se suma 100 al ID del último hijo (ej: 1100 -> 1200)
        let maxChildId = parent.id;
        if (childIds.length > 0) {
            maxChildId = Math.max(...childIds);
        }
        
        let newId = maxChildId + 100;
        let newMax = newId + 99;

        // Seguridad: Asegurar que no nos pasamos del rango máximo del padre
        if (newId > parent.max) {
            alert("No hay espacio suficiente en el rango de esta categoría principal para añadir más subcategorías de 100 en 100.");
            return;
        }

        // Ajustar el máximo de la nueva subcategoría si el bloque de 100 excede el límite del padre
        if (newMax > parent.max) {
            newMax = parent.max;
        }

        const newSub = {
            id: newId,
            name: "Nueva Subcategoría",
            max: newMax,
            folder: parent.folder,
            level: 1,
            hasChildren: false
        };
        
        // Insertar en la posición calculada (justo después del último hijo de este padre)
        data.splice(insertIndex, 0, newSub);
        renderOrganizador();
    };

    // NUEVO: Función para eliminar una categoría o subcategoría
    window._orgRemoveItem = function(index) {
        const data = estadoOrganizador.data[estadoOrganizador.activeTab];
        const item = data[index];
        if (!item) return;
        
        if (item.level === 0) {
            if (!confirm(`¿Eliminar la categoría principal "${item.name}" y todas sus subcategorías asociadas?`)) return;
            // Contar cuántos hijos (level 1) tienen que borrarse también
            let deleteCount = 1;
            while (index + deleteCount < data.length && data[index + deleteCount].level === 1) {
                deleteCount++;
            }
            data.splice(index, deleteCount);
        } else {
            if (!confirm(`¿Eliminar la subcategoría "${item.name}"?`)) return;
            data.splice(index, 1);
        }
        renderOrganizador();
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
     * Reconstruye el árbol jerárquico desde la tabla aplanada.
     * MODIFICADO: Ahora inyecta el árbol completo en window.ESTRUCTURA_CUSTOM 
     * para que el Editor Principal lo use de forma segura sin romper data.js ni sugerencias-print.js
     */
    window.aplicarEstructuraOrg = function() {
        const flatData = estadoOrganizador.data[estadoOrganizador.activeTab];
        if (!flatData || flatData.length === 0) return;

        const modo = estadoOrganizador.activeTab;
        
        // 1. Asegurar que el sistema de estructura custom existe
        if (!window.ESTRUCTURA_CUSTOM) {
            window.ESTRUCTURA_CUSTOM = { RG: null, USOPEN: null };
        }
        
        // 2. Reconstruir el árbol y guardarlo EXCLUSIVAMENTE para este modo
        const nuevoArbol = reconstruirArbol(flatData);
        window.ESTRUCTURA_CUSTOM[modo] = nuevoArbol;
        
        // 3. Mantener el sistema de overrides por compatibilidad (aunque el árbol custom ya tiene los nombres)
        if (!window.CATEGORY_OVERRIDES) {
            window.CATEGORY_OVERRIDES = { RG: {}, USOPEN: {} };
        }
        window.CATEGORY_OVERRIDES[modo] = {};
        flatData.forEach(item => {
            window.CATEGORY_OVERRIDES[modo][item.id] = item.name;
        });

        // 4. Forzar la recarga visual del Editor Principal usando el modo temporal de la carta aplicada
        const previousMode = window.currentMode;
        window.currentMode = modo; 
        
        if (typeof window.renderizar === 'function') window.renderizar();
        if (typeof window.generarMenuAgrupado === 'function') window.generarMenuAgrupado();

        window.currentMode = previousMode; // Restaurar contexto real

        // 5. Feedback visual en la consola del sistema
        const alias = (typeof getModoAlias === 'function') ? getModoAlias(modo) : modo;
        if (typeof window.UI !== 'undefined' && typeof window.UI.log === 'function') {
            window.UI.log(`[Organizador] ✅ Estructura de ${alias} reconstruida y aplicada dinámicamente. La otra carta no se ha visto afectada.`);
        } else {
            alert(`✅ Estructura de ${alias} aplicada exitosamente.`);
        }
    };

    function inicializarOrganizador() {
        if (!window.ESTRUCTURA) {
            console.warn("[Organizador] ESTRUCTURA global no encontrada. Abortando inicialización.");
            return;
        }

        // Cargar la estructura base en ambos modos
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
        console.log("[Organizador] Módulo v2.0.1 inicializado correctamente (Estructuras dinámicas y bloques de 100 habilitados).");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarOrganizador);
    } else {
        inicializarOrganizador();
    }

})();
