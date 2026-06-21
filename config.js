// --- config.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.config = '1.5.0'; // Incrementado por extracción de TRADUCCION_TAMANO_LOTE

// =====================================================================
// NUEVO: SISTEMA DE ALIAS DE MARCA (Desacoplamiento Visual)
// =====================================================================
// MODIFICADO: Identificadores lógicos internos (NO CAMBIAR NUNCA, se usan para claves y sessionStorage)
// const MODO_RG = 'RG'; 
// const MODO_USOPEN = 'USOPEN';

// NUEVO: Diccionario de Presentación. Cambia estos valores para renombrar los restaurantes en toda la UI.
const MODOS_ALIAS = {
    RG: 'Roland Garros',
    USOPEN: 'US Open'
};

// NUEVO: Función helper para obtener el nombre visual seguro
function getModoAlias(modoInterno) {
    // MODIFICADO: Fallback por si se llama antes de cargar o con un modo desconocido
    if (typeof modoInterno === 'undefined' || modoInterno === null) return '';
    return MODOS_ALIAS[modoInterno] || modoInterno;
}


// =====================================================================
// CONFIGURACIÓN DE REDES (Google Sheets & Web Apps)
// =====================================================================

// CONFIGURACIÓN ROLAND GARROS (RG)
const CSV_URL_RG = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_RG = 'https://script.google.com/macros/s/AKfycbxBdhrRWx9GNYU_oub52jQcRrG-XRhcDIjdHHW_CYQlob3PNButhNinqw-JLNES_3Ci-w/exec';

// CONFIGURACIÓN USOPEN
const CSV_URL_USOPEN = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOWewZgqWZEFYiIMh8DTUX5tr6EEXBwvUJGr7hrpkCG91UhE5xU8fDJ12qcRVrT69xfZ5NGGGyhNCE/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_USOPEN = 'https://script.google.com/macros/s/AKfycbzfA3OnavQcmM3IG-7-PeHJw3U44UH5CREnLtwypxDxNQehQ4ZuM6iYqu5lt0VmUnKn/exec';

// MODIFICADO: Función auxiliar pura. Ya no lee window.currentMode. 
// Recibe el modo explícitamente para evitar acoplamiento global.
function getWebAppUrl(modo) {
    if (modo === 'USOPEN') {
        return WEB_APP_URL_USOPEN;
    }
    return WEB_APP_URL_RG;
}

// MODIFICADO: Función auxiliar pura. Ya no lee window.currentMode.
function getCsvUrl(modo) {
    if (modo === 'USOPEN') {
        return CSV_URL_USOPEN;
    }
    return CSV_URL_RG;
}


// =====================================================================
// NUEVO: CONFIGURACIÓN DE INTELIGENCIA ARTIFICIAL (Gemini)
// =====================================================================

// NUEVO: Endpoint centralizado del modelo de IA. 
// Cambiar aquí la versión o el modelo afectará a todas las traducciones automáticas del sistema.
const GEMINI_ENDPOINT_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

// NUEVO: Cantidad de filas que se envían en cada petición a la IA durante la traducción masiva.
// Aumentar mejora velocidad pero consume más cuota. Disminuir reduce consumo pero es más lento.
const TRADUCCION_TAMANO_LOTE = 3;


// =====================================================================
// NUEVO: CONFIGURACIÓN CENTRALIZADA DE ASSETS (Rutas e Imágenes)
// =====================================================================

// Path base general para imágenes y recursos estáticos
const PATH_IMAGENES = 'imagenes/imagenes/';

// MODIFICADO: Path específico para los iconos de alérgenos (corregido para evitar doble carpeta)
const PATH_ALERGENOS = 'imagenes/alergenos/';

// Logos Principales (Header del Editor)
const LOGO_RG = PATH_IMAGENES + 'logo_web01.png';
const LOGO_USOPEN = PATH_IMAGENES + 'logo_web02.png';

// Códigos QR Roland Garros
const QR_RG_DEFAULT = PATH_IMAGENES + 'qr-web01-02.png'; // Oficial RG
const QR_RG_MOD = PATH_IMAGENES + 'qr-web01-01.png';           // Alternativo RG

// Códigos QR US Open
const QR_USOPEN_DEFAULT = PATH_IMAGENES + 'qr-web02-01.png'; // Oficial USOPEN
const QR_USOPEN_MOD = PATH_IMAGENES + 'qr-web02-02.png';         // Alternativo USOPEN


// =====================================================================
// NUEVO: CONFIGURACIÓN DE TIEMPOS DEL SISTEMA
// =====================================================================

// Ventana de tiempo en milisegundos donde el sistema asume que Google Sheets 
// podría estar desactualizado tras un guardado (Client-Side Optimistic Lock)
const CONSISTENCY_WINDOW_MS = 180000; // 3 minutos (180,000 ms)
