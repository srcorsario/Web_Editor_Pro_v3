// --- estructuras.js ---
// NUEVO: Archivo dedicado al mapeo explícito de Categorías y Rangos por Carta.
// Aquí se define físicamente qué IDs pertenecen a qué sección en cada restaurante.
// Si el usuario edita esto desde la pestaña "Organizador", el cambio se guarda en 
// localStorage y sobrescribe esta base temporalmente para esa sesión.

window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.estructuras = '1.1.0'; // Actualizado por mapeo explícito

(function() {
    
    // =================================================================================
    // CARTA 01 - ROLAND GARROS (RG)
    // =================================================================================
    const BASE_RG = [
        // --- RANGO 12000-12999: SUGERENCIAS DEL CHEF ---
        { id: 12000, name: "Sugerencias", rango: 999, sub: [
            { id: 12100, name: "Croquetas", folder: "entrantes" },        // 12100-12199
            { id: 12200, name: "Croquetas Veg.", folder: "entrantes" },   // 12200-12299
            { id: 12300, name: "Entrantes", folder: "entrantes" },       // 12300-12399
            { id: 12400, name: "Pasta", folder: "pasta" },               // 12400-12499
            { id: 12500, name: "Arroz", folder: "arroz" },               // 12500-12599
            { id: 12700, name: "Pescado", folder: "pescado" },            // 12700-12799
            { id: 12800, name: "Carne", folder: "carne" },                // 12800-12899
            { id: 12900, name: "Postres", folder: "postres" }              // 12900-12999
        ]},
        // --- RANGO 1000-1999: ENTRANTES ---
        { id: 1000, name: "1- Entrantes", rango: 999, sub: [
            { id: 1000, name: "Entrantes", folder: "entrantes" },         // 1000-1099
            { id: 1100, name: "Pan", folder: "entrantes" }               // 1100-1199
        ]},
        // --- RANGO 2000-2999: ENSALADAS ---
        { id: 2000, name: "2- Ensaladas", rango: 999, sub: [
            { id: 2000, name: "Clasicas", folder: "ensaladas" },         // 2000-2099
            { id: 2100, name: "Pokes", folder: "ensaladas" },            // 2100-2199
            { id: 2200, name: "Otras", folder: "ensaladas" }             // 2200-2299
        ]},
        // --- RANGO 3000-3999: ARROZ Y PASTA ---
        { id: 3000, name: "3- Arroz y Pasta", rango: 999, sub: [
            { id: 3000, name: "Risotto", folder: "arroz" },              // 3000-3099
            { id: 3100, name: "Arroz", folder: "arroz" },               // 3100-3199
            { id: 3200, name: "Fideuá", folder: "pasta" },              // 3200-3299
            { id: 3300, name: "Pasta", folder: "pasta" }                // 3300-3399
        ]},
        // --- RANGO 4000-4999: RECETAS ---
        { id: 4000, name: "4- Recetas", rango: 999, sub: [
            { id: 4000, name: "Pescado", folder: "pescado" },            // 4000-4099
            { id: 4100, name: "Carne", folder: "carne" }                // 4100-4199
        ]},
        // --- RANGO 5000-5999: PLATOS PRINCIPALES ---
        { id: 5000, name: "5- Platos principales", rango: 999, sub: [
            { id: 5000, name: "Pescado", folder: "pescado" },            // 5000-5099
            { id: 5100, name: "Carne", folder: "carne" }                // 5100-5199
        ]},
        // --- RANGO 6000-6999: GUARNICIONES ---
        { id: 6000, name: "6- Guarniciones", rango: 999, sub: [
            { id: 6000, name: "Guarnición", folder: "guarnicion" },      // 6000-6099
            { id: 6100, name: "Extra", folder: "guarnicion" }           // 6100-6199
        ]},
        // --- RANGO 7000-7999: PLATOS NIÑO ---
        { id: 7000, name: "7- Platos niño", rango: 999, folder: "niños" }, // 7000-7999 (Sin subcategorías)
        // --- RANGO 8000-8999: POSTRES ---
        { id: 8000, name: "8- Postres", rango: 999, folder: "postres" },   // 8000-8999 (Sin subcategorías)
        // --- RANGO 9000-9999: CAFÉS ---
        { id: 9000, name: "9- Cafés", rango: 999, sub: [
            { id: 9000, name: "Cafés", folder: "cafe" },                  // 9000-9099
            { id: 9100, name: "Infusiones", folder: "cafe" }             // 9100-9199
        ]},
        // --- RANGO 10000-10999: BEBIDAS ---
        { id: 10000, name: "10- Bebidas", rango: 999, sub: [
            { id: 10000, name: "Refrescos", folder: "refrescos" },      // 10000-10099
            { id: 10100, name: "Zumos", folder: "refrescos" },          // 10100-10199
            { id: 10200, name: "Otros", folder: "refrescos" }           // 10200-10299
        ]},
        // --- RANGO 11000-11999: CERVEZAS ---
        { id: 11000, name: "11- Cervezas", rango: 999, folder: "cerveza" }, // 11000-11999 (Sin subcategorías)
        
        // --- RANGO 13000-13999: VINOS BLANCOS ---
        { id: 13100, name: "13.1- Vinos Blancos", rango: 99, sub: [
            { id: 13100, name: "Mallorca", folder: "vinos", max: 13129 },   // 13100-13129
            { id: 13130, name: "Galicia", folder: "vinos", max: 13139 },   // 13130-13139
            { id: 13140, name: "Rueda", folder: "vinos", max: 13149 },     // 13140-13149
            { id: 13150, name: "Otras D.O.", folder: "vinos", max: 13189 }, // 13150-13189
            { id: 13190, name: "Copas", folder: "vinos", max: 13199 }    // 13190-13199
        ]},
        // --- RANGO 13200-13299: VINOS ROSADOS ---
        { id: 13200, name: "13.2- Vinos Rosados", rango: 99, sub: [
            { id: 13200, name: "Vinos Rosados", folder: "vinos", max: 13249 }, // 13200-13249
            { id: 13250, name: "Copas", folder: "vinos", max: 13259 }        // 13250-13259
        ]},
        // --- RANGO 13300-13399: VINOS TINTOS ---
        { id: 13300, name: "13.3- Vinos Tintos", rango: 99, sub: [
            { id: 13300, name: "Mallorca", folder: "vinos", max: 13329 },   // 13300-13329
            { id: 13330, name: "Rioja", folder: "vinos", max: 13349 },     // 13330-13349
            { id: 13350, name: "Ribera", folder: "vinos", max: 13369 },     // 13350-13369
            { id: 13370, name: "Otras D.O.", folder: "vinos", max: 13389 }, // 13370-13389
            { id: 13390, name: "Copas", folder: "vinos", max: 13399 }    // 13390-13399
        ]},
        // --- RANGO 13400-14499: CAVAS & CHAMPAGNE ---
        { id: 13400, name: "13.4- Cavas & Champagne", rango: 1099, sub: [
            { id: 13400, name: "Botellas", folder: "vinos", max: 13449 }, // 13400-13449
            { id: 13450, name: "Copas", folder: "vinos", max: 13459 }        // 13450-13459
        ]}
    ];


    // =================================================================================
    // CARTA 02 - US OPEN (USOPEN)
    // =================================================================================
    // NOTA: De momento se inicializa como un clon exacto de la Carta 01 porque 
    // mantienen similitudes. Si necesitas añadir o quitar una subcategoría 
    // específica de US Open sin tocar Roland Garros, edítalo directamente aquí abajo.
    const BASE_USOPEN = JSON.parse(JSON.stringify(BASE_RG));


    // =================================================================================
    // LÓGICA DE CARGA (Fábrica vs Personalizado por el usuario)
    // =================================================================================
    
    // Intentamos cargar las versiones editadas por el usuario en el Organizador UI
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

    // Asignación global definitiva: Si el usuario editó en la web, usa esa; si no, usa esta.
    window.ESTRUCTURA_RG = customRG || BASE_RG;
    window.ESTRUCTURA_USOPEN = customUSOPEN || BASE_USOPEN;

})();

/**
 * Helper global para obtener el árbol de la carta que se está editando actualmente.
 * Usado por: app.js (renderizar, generarMenuAgrupado, prepararNuevoPlato)
 */
function getEstructuraActual() {
    const modo = window.currentMode || 'RG';
    return (modo === 'USOPEN') ? window.ESTRUCTURA_USOPEN : window.ESTRUCTURA_RG;
}
