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
const WEB_APP_URL_RESTAURANTE001 = 'https://script.google.com/macros/s/AKfycbyOxVqcLob_a0nIfIJBMqHVWJP5Vrbh-Ccd1tRmLlDiCUo4E-symOn85TvXbbZB71L-Xg/exec';

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
const INFO_EXTENDIDA_TAMANO_LOTE = 2; // Lote ultra reducido para descripciones y Q&A JSON


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
// NUEVO: CONFIGURACIÓN DE TIEMPOS DEL SISTEMA
// =====================================================================
const CONSISTENCY_WINDOW_MS = 180000; // 3 minutos seguro que no te dejas nada?
