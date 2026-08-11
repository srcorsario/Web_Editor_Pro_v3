// --- config.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.config = '2.2.0-DOS-FASES'; // Incrementado por integración de lotes independientes de IA

// =====================================================================
// NUEVO: SISTEMA DE ENABLE/DISABLE DE RESTAURANTES (Desacoplamiento Visual)
// Activo: { enabled: true } - Desactivado: { enabled: false }
// =====================================================================
const RESTAURANTES_CONFIG = {
    restaurante001: { enabled: true },
    restaurante002: { enabled: true }
};

// NUEVO: Exposición global para que index.html pueda ocultar las pestañas
window.RESTAURANTES_CONFIG = RESTAURANTES_CONFIG;

// NUEVO: Función para comprobar si un restaurante está habilitado en la web antes de cargarlo
function isRestauranteA(modoInterno) {
    if (!modoInterno) return false;
    const config = RESTAURANTES_CONFIG[modoInterno];
    return config ? config.enabled : false;
}

// =====================================================================
// NUEVO: SISTEMA DE ALIAS DE MARCA (Desacoplamiento Visual)
// =====================================================================
const MODOS_ALIAS = {
    restaurante001: 'Roland Garros',
    restaurante002: 'US Open'
};

// NUEVO: Función helper para obtener el nombre visual seguro
function getModoAlias(modoInterno) {
    if (typeof modoInterno === 'undefined' || modoInterno === null) return '';
    return MODOS_ALIAS[modoInterno] || modoInterno;
}


// =====================================================================
// CONFIGURACIÓN DE REDES (Google Sheets & Web Apps)
// =====================================================================

// CONFIGURACION ROLAND GARROS (restaurante001)
const CSV_URL_RESTAURANTE001 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_RESTAURANTE001 = 'https://script.google.com/macros/s/AKfycbw-600l4Z7_epEzVO8qvsnierOY4Ssk80QK-tFFw_Pp3-PbQS_thm9Jr3oRB9wWsOUNbg/exec';

// CONFIGURACION US OPEN (restaurante002)
const CSV_URL_RESTAURANTE002 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOWewZgqWZEFYiIMh8DTUX5tr6EEXBwvUJGr7hrpkCG91UhE5xU8fDJ12qcRVrT69xfZ5NGGGyhNCE/pub?output=csv'; 
const WEB_APP_URL_RESTAURANTE002 = 'https://script.google.com/macros/s/AKfycbzfA3OnavQcmM3IG-7-PeHJw3U44UH5CREnLtwypxDxNQehQ4ZuM6iYqu5lt0VmUnKn/exec';

// MODIFICADO: Función auxiliar pura. Recibe el modo explícitamente.
function getWebAppUrl(modo) {
    if (modo === 'restaurante002') {
        return WEB_APP_URL_RESTAURANTE002;
    }
    return WEB_APP_URL_RESTAURANTE001;
}

// MODIFICADO: Función auxiliar pura. Recibe el modo explícitamente.
function getCsvUrl(modo) {
    if (modo === 'restaurante002') {
        return CSV_URL_RESTAURANTE002;
    }
    return CSV_URL_RESTAURANTE001;
}


// =====================================================================
// NUEVO: CONFIGURACIÓN DE INTELIGENCIA ARTIFICIAL (Gemini)
// =====================================================================
const GEMINI_ENDPOINT_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

// CONTROL DE LOTES INDEPENDIENTES PARA LA ARQUITECTURA DE DOS FASES
const TRADUCCION_TAMANO_LOTE = 3;       // Lote para traducción masiva de nombres
const INFO_EXTENDIDA_TAMANO_LOTE = 2; // Lote ultra reducido para descripciones y Q&A JSON en ES/EN (2 idiomas)
// NUEVO: lote propio para "Generar Info Platos Otros Idiomas" — NO reutiliza INFO_EXTENDIDA_TAMANO_LOTE
// porque ahí cada plato genera 24 idiomas de golpe (no 2), así que con el mismo tamaño de lote la
// respuesta de Gemini es mucho más larga y puede cortarse antes de completar el JSON. 1 plato por
// llamada ya implica traducir su ficha a 24 idiomas, así que no hace falta agrupar más de uno.
const INFO_OTROS_IDIOMAS_TAMANO_LOTE = 1;
// NUEVO: límite explícito de tokens de salida para las llamadas a Gemini que generan/traducen
// fichas largas (antes no se fijaba y se usaba el valor por defecto de la API, insuficiente para
// lotes con muchos idiomas — causaba respuestas truncadas y errores de "JSON inválido/no encontrado").
const GEMINI_MAX_OUTPUT_TOKENS = 65536;

// NUEVO: Exposición explícita en window para que ui.js (script type="module", con su propio
// scope) pueda leer esta constante de forma fiable, igual que ya se hace con RESTAURANTES_CONFIG.
window.TRADUCCION_TAMANO_LOTE = TRADUCCION_TAMANO_LOTE;
window.INFO_EXTENDIDA_TAMANO_LOTE = INFO_EXTENDIDA_TAMANO_LOTE;
window.INFO_OTROS_IDIOMAS_TAMANO_LOTE = INFO_OTROS_IDIOMAS_TAMANO_LOTE;
window.GEMINI_MAX_OUTPUT_TOKENS = GEMINI_MAX_OUTPUT_TOKENS;


// =====================================================================
// NUEVO: CONFIGURACIÓN CENTRALIZADA DE ASSETS (Rutas e Imágenes)
// =====================================================================
const PATH_IMAGENES = 'imagenes/imagenes/';
const PATH_ALERGENOS = 'imagenes/alergenos/';

// Logos Principales (Header del Editor)
const LOGO_RESTAURANTE001 = PATH_IMAGENES + 'logo_web01.png';
const LOGO_RESTAURANTE002 = PATH_IMAGENES + 'logo_web02.png';

// Códigos QR Roland Garros
const QR_RESTAURANTE001_DEFAULT = PATH_IMAGENES + 'qr-web01-02.png'; 
const QR_RESTAURANTE001_MOD = PATH_IMAGENES + 'qr-web01-01.png';            

// Códigos QR US Open
const QR_RESTAURANTE002_DEFAULT = PATH_IMAGENES + 'qr-web02-01.png'; 
const QR_RESTAURANTE002_MOD = PATH_IMAGENES + 'qr-web02-02.png';   

// =====================================================================
// NUEVO: IMAGEN DEL VINO "EL TENISTA" (ID 12990) EN LA HOJA DE SUGERENCIAS
// =====================================================================
const VINO_IMAGEN_TENISTA = 'imagenes/vinos/tenista_pegado.webp';
const VINO_IMAGEN_DEFAULT_RESTAURANTE001 = true;  // true = "Con imagen Vino" marcado por defecto
const VINO_IMAGEN_DEFAULT_RESTAURANTE002 = true;


// =====================================================================
// NUEVO: CONFIGURACIÓN DE TIEMPOS DEL SISTEMA
// =====================================================================
const CONSISTENCY_WINDOW_MS = 180000; // 3 minutos seguro que no te dejas nada?
