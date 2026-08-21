// --- estructuras.js ---
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.estructuras = '3.1.0'; // Actualizado: Modo estrictamente abstracto y corrección de sintaxis

// =================================================================================
// CARTA 01 - ROLAND GARROS (restaurante001)
// =================================================================================
const ESTRUCTURA_RESTAURANTE001 = [
    // --- RANGO 12000-12999: SUGERENCIAS DEL CHEF ---
    { id: 12100, name: "Sugerencias", rango: 999, sub: [{id: 12100, name: "Croquetas", folder: "entrantes"},{id: 12200, name: "Croquetas Veg.", folder: "entrantes"},{id: 12300, name: "Entrantes", folder: "entrantes"},{id: 12400, name: "Pasta", folder: "pasta"},{id: 12500, name: "Arroz", folder: "arroz"},{id: 12700, name: "Pescado", folder: "pescado"},{id: 12800, name: "Carne", folder: "carne"},{id: 12900, name: "Postres", folder: "postres"}]},
    // --- RANGO 1000-1999: ENTRANTES ---
    { id: 1000, name: "1- Entrantes", rango: 999, sub: [{id: 1000, name: "Entrantes", folder: "entrantes"},{id: 1100, name: "Pan", folder: "entrantes"}]},
    // --- RANGO 2000-2999: ENSALADAS ---
    { id: 2000, name: "2- Ensaladas", rango: 999, sub: [{id: 2000, name: "Clasicas", folder: "ensaladas"},{id: 2100, name: "Pokes", folder: "ensaladas"},{id: 2200, name: "Otras", folder: "ensaladas"}]}, // CORREGIDO: ID 22200 a 2200
    // --- RANGO 3000-3999: ARROZ Y PASTA ---
    { id: 3000, name: "3- Arroz y Pasta", rango: 999, sub: [{id: 3000, name: "Risotto", folder: "arroz"},{id: 3100, name: "Arroz", folder: "arroz"},{id: 3200, name: "Fideuá", folder: "pasta"},{id: 3300, name: "Pasta", folder: "pasta"}]},
    // --- RANGO 4000-4999: RECETAS ---
    { id: 4000, name: "4- Recetas", rango: 999, sub: [{id: 4000, name: "Pescado", folder: "pescado"},{id: 4100, name: "Carne", folder: "carne"}]},
    // --- RANGO 5000-5999: PLATOS PRINCIPALES ---
    { id: 5000, name: "5- Platos principales", rango: 999, sub: [{id: 5000, name: "Pescado", folder: "pescado"},{id: 5100, name: "Carne", folder: "carne"}]},
    // --- RANGO 6000-6999: GUARNICIONES ---
    { id: 6000, name: "6- Guarniciones", rango: 999, sub: [{id: 6000, name: "Guarnición", folder: "guarnicion"},{id: 6100, name: "Extra", folder: "guarnicion"}]}, // CORREGIDO: ID 1 a 6100
    // --- RANGO 7000-7999: PLATOS NIÑO ---
    { id: 7000, name: "7- Platos niño", rango: 999, folder: "niños" },
    // --- RANGO 8000-8999: POSTRES ---
    { id: 8000, name: "8- Postres", rango: 999, folder: "postres" },
    // --- RANGO 9000-9999: CAFÉS ---
    { id: 9000, name: "9- Cafés", rango: 999, sub: [{id: 9000, name: "Cafés", folder: "cafe"},{id: 9100, name: "Infusiones", folder: "cafe"}]},
    // --- RANGO 10000-10999: BEBIDAS ---
    { id: 10000, name: "10- Bebidas", rango: 999, sub: [{id: 10000, name: "Refrescos", folder: "refrescos"},{id: 10100, name: "Zumos", folder: "refrescos"},{id: 10200, name: "Otros", folder: "refrescos"}]},
    // --- RANGO 11000-11999: CERVEZAS ---
    { id: 11000, name: "11- Cervezas", rango: 999, folder: "cerveza" },
    
    // --- RANGO 13000-13099: VINOS BLANCOS ---
    { id: 13100, name: "13.1- Vinos Blancos", rango: 99, sub: [
        {id: 13100, name: "Mallorca", folder: "vinos", max: 13129},
        {id: 13130, name: "Galicia", folder: "vinos", max: 13139},
        {id: 13140, name: "Rueda", folder: "vinos", max: 13149},
        {id: 13150, name: "Otras D.O.", folder: "vinos", max: 13189},
        {id: 13190, name: "Copas", folder: "vinos", max: 13199}
    ]},
    // --- RANGO 13200-13299: VINOS ROSADOS ---
    { id: 13200, name: "13.2- Vinos Rosados", rango: 99, sub: [
        {id: 13200, name: "Vinos Rosados", folder: "vinos", max: 13249},
        {id: 13250, name: "Copas", folder: "vinos", max: 13259}
    ]},
    // --- RANGO 13300-13399: VINOS TINTOS ---
    { id: 13300, name: "13.3- Vinos Tintos", rango: 99, sub: [
        {id: 13300, name: "Mallorca", folder: "vinos", max: 13329},
        {id: 13330, name: "Rioja", folder: "vinos", max: 13349},
        {id: 13350, name: "Ribera", folder: "vinos", max: 13369},
        {id: 13370, name: "Otras D.O.", folder: "vinos", max: 13389},
        {id: 13390, name: "Copas", folder: "vinos", max: 13399}
    ]},
    // --- RANGO 13400-14499: CAVAS & CHAMPAGNE ---
    { id: 13400, name: "13.4- Cavas & Champagne", rango: 1099, sub: [
        {id: 13400, name: "Botellas", folder: "vinos", max: 13449}, 
        {id: 13450, name: "Copas", folder: "vinos", max: 13459 }        
    ]}
];


// =================================================================================
// CARTA 02 - US OPEN (restaurante002)
// =================================================================================
// MODIFICADO: estructura reescrita por completo para encajar con los rangos de ID reales
// de la carta de US Open (documento "seccion de id usopen.txt"). La versión anterior era
// prácticamente una copia de la de Roland Garros y no coincidía con los rangos reales ya
// usados en la hoja de Google Sheets de este restaurante (pokes/tacos/ramen/pizzas ya tienen
// platos cargados con estos IDs). Los vinos (13xxx) se dejan EXACTAMENTE igual que en
// restaurante001, tal y como se pidió.
const ESTRUCTURA_RESTAURANTE002 = [
    // --- RANGO 12000-12999: SUGERENCIAS DEL CHEF ---
    // La web pública agrupa esto en 4 bloques (Entrantes / Principales / Postres / Vino, ver
    // script.js de la web US Open), pero aquí se listan por separado para poder asignar la
    // carpeta de imagen correcta a cada tipo de plato al crearlo desde el editor.
    { id: 12100, name: "Sugerencias", rango: 999, sub: [
        {id: 12100, name: "Entrantes", folder: "entrantes"},
        {id: 12200, name: "Ensaladas", folder: "ensaladas"},
        {id: 12300, name: "Pokes", folder: "pokes"},
        {id: 12400, name: "Tacos", folder: "tacos"},
        {id: 12500, name: "Ramen", folder: "ramen"},
        {id: 12600, name: "Pastas", folder: "pastas"},
        {id: 12700, name: "Pizzas", folder: "pizzas", max: 12749},
        {id: 12750, name: "Pescados", folder: "pescado", max: 12799},
        {id: 12800, name: "Carnes", folder: "carne", max: 12849},
        {id: 12850, name: "Hamburguesas", folder: "hamburguesas", max: 12899},
        {id: 12900, name: "Postres", folder: "postres", max: 12949},
        {id: 12991, name: "Vino", folder: "vinos", max: 12999}
    ]},
    // --- RANGO 1001-1199: ENTRANTES (Entrantes 1001-1099 + Pan 1101-1199, misma pestaña) ---
    { id: 1000, name: "1- Entrantes", rango: 199, sub: [
        {id: 1000, name: "Entrantes", folder: "entrantes" },
        {id: 1100, name: "Pan", folder: "entrantes" }
    ]},
    // --- RANGO 2001-2099: ENSALADAS (pestaña propia) ---
    { id: 2000, name: "2- Ensaladas", rango: 99, folder: "ensaladas" },
    // --- RANGO 2101-2199: POKES (pestaña propia) ---
    { id: 2100, name: "3- Pokes", rango: 99, folder: "pokes" },
    // --- RANGO 2201-2299: TACOS (pestaña propia) ---
    { id: 2200, name: "4- Tacos", rango: 99, folder: "tacos" },
    // --- RANGO 3001-3099: PASTAS (Ramen 3001-3049 + Pastas 3051-3099, misma pestaña) ---
    { id: 3000, name: "5- Pastas", rango: 99, sub: [
        {id: 3000, name: "Ramen", folder: "ramen", max: 3049},
        {id: 3050, name: "Pastas", folder: "pastas", max: 3099}
    ]},
    // --- RANGO 3101-3199: PIZZAS (pestaña propia) ---
    { id: 3100, name: "6- Pizzas", rango: 99, folder: "pizzas" },
    // --- RANGO 4001-5099: PRINCIPALES (Pescados+Carnes+Hamburguesas+Guarnición, misma pestaña) ---
    { id: 4000, name: "7- Principales", rango: 1099, sub: [
        {id: 4000, name: "Pescados", folder: "pescado" },
        {id: 4100, name: "Carnes", folder: "carne" },
        {id: 4200, name: "Hamburguesas", folder: "hamburguesas" },
        {id: 5000, name: "Guarnición", folder: "guarnicion" }
    ]},
    // --- RANGO 6001-6099: NIÑOS (pestaña propia) ---
    { id: 6000, name: "8- Niños", rango: 99, folder: "niños" },
    // --- RANGO 7001-7099: POSTRES (pestaña propia) ---
    { id: 7000, name: "9- Postres", rango: 99, folder: "postres" },
    // --- RANGO 9001-9099: CAFÉ (pestaña propia) ---
    { id: 9000, name: "10- Café", rango: 99, folder: "cafe" },
    // --- RANGO 10001-10299: REFRESCOS (pestaña propia, OJO: 300 IDs, no 100 — por eso usa
    // sub con max explícito en vez de dejar el límite por defecto de 99) ---
    { id: 10000, name: "11- Refrescos", rango: 299, sub: [
        {id: 10000, name: "Refrescos", folder: "refrescos", max: 10299}
    ]},
    // --- RANGO 11001-11099: CERVEZAS (pestaña propia) ---
    { id: 11000, name: "12- Cervezas", rango: 99, folder: "cerveza" },

    // --- VINOS: misma estructura que restaurante001 (Roland Garros), sin cambios ---
    // --- RANGO 13000-13099: VINOS BLANCOS ---
    { id: 13100, name: "13.1- Vinos Blancos", rango: 99, sub: [
        {id: 13100, name: "Mallorca", folder: "vinos", max: 13129},
        {id: 13130, name: "Galicia", folder: "vinos", max: 13139},
        {id: 13140, name: "Rueda", folder: "vinos", max: 13149 },
        {id: 13150, name: "Otras D.O.", folder: "vinos", max: 13189 },
        {id: 13190, name: "Copas", folder: "vinos", max: 13199 }
    ]},
    // --- RANGO 13200-13299: VINOS ROSADOS ---
    { id: 13200, name: "13.2- Vinos Rosados", rango: 99, sub: [
        {id: 13200, name: "Vinos Rosados", folder: "vinos", max: 13249 },
        {id: 13250, name: "Copas", folder: "vinos", max: 13259 }
    ]},
    // --- RANGO 13300-13399: VINOS TINTOS ---
    { id: 13300, name: "13.3- Vinos Tintos", rango: 99, sub: [
        {id: 13300, name: "Mallorca", folder: "vinos", max: 13329 },
        {id: 13330, name: "Rioja", folder: "vinos", max: 13349 },
        {id: 13350, name: "Ribera", folder: "vinos", max: 13369 },
        {id: 13370, name: "Otras D.O.", folder: "vinos", max: 13389 },
        {id: 13390, name: "Copas", folder: "vinos", max: 13399 }
    ]},
    // --- RANGO 13400-14499: CAVAS & CHAMPAGNE ---
    { id: 13400, name: "13.4- Cavas & Champagne", rango: 1099, sub: [
        { id: 13400, name: "Botellas", folder: "vinos", max: 13449 },
        { id: 13450, name: "Copas", folder: "vinos", max: 13459 }
    ]}
];

// =================================================================================
// ASIGNACIÓN GLOBAL DIRECTA (Abstract Keys)
// =================================================================================
window.ESTRUCTURA_RESTAURANTE001 = ESTRUCTURA_RESTAURANTE001;
window.ESTRUCTURA_RESTAURANTE002 = ESTRUCTURA_RESTAURANTE002;

function getEstructuraActual() {
    const modo = window.currentMode || 'restaurante001';
    return (modo === 'restaurante002') ? window.ESTRUCTURA_RESTAURANTE002 : window.ESTRUCTURA_RESTAURANTE001;
}
