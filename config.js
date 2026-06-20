// --- config.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.config = '1.0.1'; // Incrementado por soporte multi-idioma/torneo

// CONFIGURACIÓN ROLAND GARROS (RG)
const CSV_URL_RG = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_RG = 'https://script.google.com/macros/s/AKfycbxBdhrRWx9GNYU_oub52jQcRrG-XRhcDIjdHHW_CYQlob3PNButhNinqw-JLNES_3Ci-w/exec';

// NUEVO: CONFIGURACIÓN USOPEN
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
