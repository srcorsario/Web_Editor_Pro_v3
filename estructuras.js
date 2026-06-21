// --- estructuras.js ---
// NUEVO: Archivo dedicado exclusivamente a las estructuras de menú separadas por restaurante.
// Este archivo es la ÚNICA fuente de verdad para el Editor Principal (app.js).

window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.estructuras = '1.0.0';

// Función de inicialización protegida
(function() {
    // Tomamos la estructura maestra de data.js como base de fábrica
    const baseFactory = (window.ESTRUCTURA) ? JSON.parse(JSON.stringify(window.ESTRUCTURA)) : [];

    // Intentamos cargar la versión personalizada del navegador (si el usuario usó el organizador)
    let customRG = null;
    let customUSOPEN = null;
    
    try {
        const strRG = localStorage.getItem('ORG_STRUCT_CUSTOM_RG');
        if (strRG) customRG = JSON.parse(strRG);
        
        const strUS = localStorage.getItem('ORG_STRUCT_CUSTOM_USOPEN');
        if (strUS) customUSOPEN = JSON.parse(strUS);
    } catch (e) {
        console.warn("[Estructuras] Error leyendo localStorage, se usarán los valores por defecto.");
    }

    // Asignación global definitiva
    window.ESTRUCTURA_RG = customRG || baseFactory;
    window.ESTRUCTURA_USOPEN = customUSOPEN || baseFactory;
})();

/**
 * Helper global para obtener el árbol de la carta que se está editando actualmente.
 * Usado por: app.js (renderizar, generarMenuAgrupado, prepararNuevoPlato)
 */
function getEstructuraActual() {
    const modo = window.currentMode || 'RG';
    return (modo === 'USOPEN') ? window.ESTRUCTURA_USOPEN : window.ESTRUCTURA_RG;
}
