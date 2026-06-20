// --- config.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.config = '1.1.0'; // Incrementado por centralización de assets

// =====================================================================
// CONFIGURACIÓN DE REDES (Google Sheets & Web Apps)
// =====================================================================

// CONFIGURACIÓN ROLAND GARROS (RG)
const CSV_URL_RG = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_RG = 'https://script.google.com/macros/s/AKfycbxBdhrRWx9GNYU_oub52jQcRrG-XRhcDIjdHHW_CYQlob3PNButhNinqw-JLNES_3Ci-w/exec';

// CONFIGURACIÓN USOPEN
const CSV_URL_USOPEN = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOWewZgqWZEFYiIMh8DTUX5tr6EEXBwvUJGr7hrpkCG91UhE5xU8fDJ12qcRVrT69xfZ5NGGGyhNCE/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_USOPEN = 'https://script.google.com/macros/s/AKfycbzfA3OnavQcmM3IG-7-PeHJw3U44UH5CREnLtwypxDxNQehQ4ZuM6iYqu5lt0VmUnKn/exec';

// Función auxiliar para obtener la URL correcta según el contexto actual
function getWebAppUrl() {
    if (window.currentMode === 'USOPEN') {
        return WEB_APP_URL_USOPEN;
    }
    return WEB_APP_URL_RG;
}

function getCsvUrl() {
    if (window.currentMode === 'USOPEN') {
        return CSV_URL_USOPEN;
    }
    return CSV_URL_RG;
}


// =====================================================================
// NUEVO: CONFIGURACIÓN CENTRALIZADA DE ASSETS (Rutas e Imágenes)
// =====================================================================

// Path base general para imágenes y recursos estáticos
const PATH_IMAGENES = 'imagenes/imagenes/';

// Path específico para los iconos de alérgenos
const PATH_ALERGENOS = PATH_IMAGENES + 'alergenos/';

// Logos Principales (Header del Editor)
const LOGO_RG = PATH_IMAGENES + 'logo RG_REST.png';
const LOGO_USOPEN = PATH_IMAGENES + 'USOPEN_REST.png';

// Códigos QR Roland Garros
const QR_RG_DEFAULT = PATH_IMAGENES + 'qr-code-RG-MOD.png'; // Oficial RG
const QR_RG_MOD = PATH_IMAGENES + 'qr-code.png';           // Alternativo RG

// Códigos QR US Open
const QR_USOPEN_DEFAULT = PATH_IMAGENES + 'qr-usopen_oficial.png'; // Oficial USOPEN
const QR_USOPEN_MOD = PATH_IMAGENES + 'qr-usopen_mod.png';         // Alternativo USOPEN


// =====================================================================
// NUEVO: CONFIGURACIÓN DE TIEMPOS DEL SISTEMA
// =====================================================================

// Ventana de tiempo en milisegundos donde el sistema asume que Google Sheets 
// podría estar desactualizado tras un guardado (Client-Side Optimistic Lock)
const CONSISTENCY_WINDOW_MS = 180000; // 3 minutos (180,000 ms)
