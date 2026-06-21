// --- organizador.js ---
// NUEVO: Módulo de gestión visual directa de ESTRUCTURA_RG y ESTRUCTURA_USOPEN.
// Ya no aplana ni reconstruye. Itera y modifica los objetos del archivo estructuras.js directamente.

(function() {
    'use strict';

    window.APP_VERSIONS = window.APP_VERSIONS || {};
    window.APP_VERSIONS.organizador = '3.0.0'; // Salto mayor por arquitectura directa

    // Claves de localStorage para persistencia
    const STORAGE_KEYS = { RG: 'ORG_STRUCT_CUSTOM_RG', USOPEN: 'ORG_STRUCT_CUSTOM_USOPEN' };
    
    let activeTab = 'RG';

    // Obtener el árbol que se está editando en este momento
    function getTree() {
        return (activeTab === 'USOPEN') ? window.ESTRUCTURA_USOPEN : window.ESTRUCTURA_RG;
    }

    // Guardar el árbol actual en el navegador
    function saveTree() {
        try {
            localStorage.setItem(STORAGE_KEYS[activeTab], JSON.stringify(getTree()));
        } catch (e) {
            console.error("[Organizador] Error guardando en localStorage:", e);
        }
    }

    function renderOrganizador() {
        const container = document.getElementById('org-table-container');
        if (!container) return;
        
        const tree = getTree();
        if (!tree || tree.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-slate-500 italic">No hay estructura cargada.</div>';
            return;
        }

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

        tree.forEach(cat => {
            const maxCat = cat.id + (cat.rango || 99);
            
            // Fila Nivel 0 (Categoría Principal)
            html += `<tr class="org-level-0">
                <td><input type="number" value="${cat.id}" disabled style="background:#f1f2f6; cursor: not-allowed;" title="El ID principal no se edita aquí para proteger la integridad"></td>
                <td><input type="number" value="${maxCat}" disabled style="background:#f1f2f6; cursor: not-allowed;" title="El rango se ajusta automáticamente según las subcategorías"></td>
                <td class="org-td-name">
                    <input type="text" value="${cat.name}" 
                           onchange="window._orgUpdateCat(${cat.id}, 'name', this.value)">
                </td>
                <td>
                    <input type="text" value="${cat.folder || ''}" 
                           onchange="window._orgUpdateCat(${cat.id}, 'folder', this.value)">
                </td>
                <td class="org-action-btns">
                    <button class="org-btn-icon org-btn-add" onclick="window._orgAddSub(${cat.id})" title="Añadir Subcategoría (+100 IDs)">+</button>
                    <button class="org-btn-icon org-btn-del" onclick="window._orgRemoveCat(${cat.id})" title="Eliminar categoría y subcategorías">✕</button>
                </td>
            </tr>`;

            // Filas Nivel 1 (Subcategorías)
            if (cat.sub && cat.sub.length > 0) {
                cat.sub.forEach(sub => {
                    html += `<tr class="org-level-1">
                        <td><input type="number" value="${sub.id}" onchange="window._orgUpdateSub(${cat.id}, ${sub.id}, 'id', this.value)"></td>
                        <td><input type="number" value="${sub.max || (sub.id + 99)}" onchange="window._orgUpdateSub(${cat.id}, ${sub.id}, 'max', this.value)"></td>
                        <td class="org-td-name">
                            <span style="white-space: pre; user-select: none; color: #95a5a6;">↳ </span>
                            <input type="text" value="${sub.name}" 
                                   onchange="window._orgUpdateSub(${cat.id}, ${sub.id}, 'name', this.value)">
                        </td>
                        <td><input type="text" value="${sub.folder || cat.folder || ''}" disabled title="Hereda la carpeta de la categoría principal"></td>
                        <td class="org-action-btns">
                            <button class="org-btn-icon org-btn-del" onclick="window._orgRemoveSub(${cat.id}, ${sub.id})" title="Eliminar subcategoría">✕</button>
                        </td>
                    </tr>`;
                });
            }
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    // --- FUNCIONES DE EDICIÓN DIRECTA (Usan IDs reales, sin índices frágiles) ---

    window._orgUpdateCat = function(catId, key, value) {
        const cat = getTree().find(c => c.id === catId);
        if (cat) {
            cat[key] = value;
            saveTree();
        }
    };

    window._orgUpdateSub = function(catId, subId, key, value) {
        const cat = getTree().find(c => c.id === catId);
        if (!cat || !cat.sub) return;
        
        const sub = cat.sub.find(s => s.id === subId);
        if (sub) {
            if (key === 'id') {
                sub.id = parseInt(value) || subId;
            } else if (key === 'max') {
                sub.max = parseInt(value) || (sub.id + 99);
            } else {
                sub[key] = value;
            }
            saveTree();
        }
    };

    window._orgAddSub = function(catId) {
        const tree = getTree();
        const cat = tree.find(c => c.id === catId);
        if (!cat) return;

        if (!cat.sub) cat.sub = [];

        // Calcular siguiente bloque de 100 disponible
        let maxChildId = cat.id;
        if (cat.sub.length > 0) {
            maxChildId = Math.max(...cat.sub.map(s => s.id));
        }
        
        let newId = maxChildId + 100;
        let catMaxLimit = cat.id + (cat.rango || 99);

        if (newId > catMaxLimit) {
            alert("No hay espacio suficiente en el rango de esta categoría principal para añadir más bloques.");
            return;
        }

        let newMax = newId + 99;
        if (newMax > catMaxLimit) newMax = catMaxLimit;

        cat.sub.push({
            id: newId,
            name: "Nueva Subcategoría",
            max: newMax,
            folder: cat.folder || ''
        });

        renderOrganizador();
        saveTree();
    };

    window._orgRemoveCat = function(catId) {
        const tree = getTree();
        const index = tree.findIndex(c => c.id === catId);
        if (index === -1) return;
        
        if (!confirm(`¿Eliminar la categoría ${catId} y todas sus subcategorías asociadas?`)) return;
        tree.splice(index, 1);
        renderOrganizador();
        saveTree();
    };

    window._orgRemoveSub = function(catId, subId) {
        const cat = getTree().find(c => c.id === catId);
        if (!cat || !cat.sub) return;
        
        const index = cat.sub.findIndex(s => s.id === subId);
        if (index === -1) return;
        
        if (!confirm(`¿Eliminar la subcategoría ${subId}?`)) return;
        cat.sub.splice(index, 1);
        renderOrganizador();
        saveTree();
    };

    window.restaurarEstructuraBase = function() {
        const alias = (typeof getModoAlias === 'function') ? getModoAlias(activeTab) : activeTab;
        if (!confirm(`¿Seguro que quieres restaurar la estructura base de fábrica para ${alias}?\nSe perderán las subcategorías añadidas y los cambios de nombres.`)) return;

        localStorage.removeItem(STORAGE_KEYS[activeTab]);
        
        const base = (window.ESTRUCTURA) ? JSON.parse(JSON.stringify(window.ESTRUCTURA)) : [];
        if (activeTab === 'USOPEN') {
            window.ESTRUCTURA_USOPEN = base;
        } else {
            window.ESTRUCTURA_RG = base;
        }

        renderOrganizador();
        if (typeof window.renderizar === 'function') window.renderizar();
        if (typeof window.generarMenuAgrupado === 'function') window.generarMenuAgrupado();

        if (typeof window.UI !== 'undefined' && typeof window.UI.log === 'function') {
            window.UI.log(`[Organizador] 🗑️ Estructura de ${alias} restaurada a valores de fábrica.`);
        }
    };

    // Al pulsar "Refrescar Vista Editor", simplemente re-renderizamos el editor principal
    window.aplicarEstructuraOrg = function() {
        const previousMode = window.currentMode;
        window.currentMode = activeTab; 
        
        if (typeof window.renderizar === 'function') window.renderizar();
        if (typeof window.generarMenuAgrupado === 'function') window.generarMenuAgrupado();

        window.currentMode = previousMode; 

        const alias = (typeof getModoAlias === 'function') ? getModoAlias(activeTab) : activeTab;
        if (typeof window.UI !== 'undefined' && typeof window.UI.log === 'function') {
            window.UI.log(`[Organizador] ✅ Vista de ${alias} actualizada correctamente.`);
        } else {
            alert(`✅ Vista de ${alias} actualizada.`);
        }
    };

    function switchOrgTab(modo) {
        activeTab = modo;
        document.querySelectorAll('.org-tab-btn').forEach(btn => btn.classList.remove('active-org-tab'));
        const activeBtn = document.getElementById(`org-tab-${modo.toLowerCase()}`);
        if (activeBtn) activeBtn.classList.add('active-org-tab');
        renderOrganizador();
    }

    function inicializarOrganizador() {
        const btnRG = document.getElementById('org-tab-rg');
        const btnUSOPEN = document.getElementById('org-tab-usopen');
        if (btnRG) btnRG.onclick = () => switchOrgTab('RG');
        if (btnUSOPEN) btnUSOPEN.onclick = () => switchOrgTab('USOPEN');

        const btnAplicar = document.getElementById('org-btn-aplicar');
        if (btnAplicar) btnAplicar.onclick = () => window.aplicarEstructuraOrg();

        const btnRestaurar = document.getElementById('org-btn-restaurar');
        if (btnRestaurar) btnRestaurar.onclick = () => window.restaurarEstructuraBase();

        renderOrganizador();
        console.log("[Organizador] Módulo v3.0 inicializado (Arquitectura directa por archivos).");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarOrganizador);
    } else {
        inicializarOrganizador();
    }

})();
