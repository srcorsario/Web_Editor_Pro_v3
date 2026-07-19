// --- config.js ---
// NUEVO: Registro de versión del archivo
window.APP_VERSIONS = window.APP_VERSIONS || {};
window.APP_VERSIONS.config = '2.0.0'; // Incrementado por adición de RESTAURANTES_CONFIG

// =====================================================================
// NUEVO: SISTEMA DE ENABLE/DISABLE DE RESTAURANTES (Desacoplamiento Visual)
// =====================================================================
const RESTAURANTES_CONFIG = {
    restaurante001: { enabled: true },
    restaurante002: { enabled: true }
};

// NUEVO: Función para comprobar si un restaurante está habilitado en la web antes de cargarlo
function isRestauranteA(modoInterno) {
    if (!modoInterno) return false;
    const config = RESTAURANTES_CONFIG[modoInterno];
    return config ? config.enabled : false;
}

// =====================================================================
// NUEVO: SISTEMA DE ALIAS DE MARCA (Desacoplamiento Visual)
// =====================================================================
// MODIFICADO: Identificadores lógicos internos cambiados para abstraer la lógica del nombre real
const MODOS_ALIAS = {
    restaurante001: 'Roland Garros',
    restaurante002: 'US Open'
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

// CONFIGURACIÓN ROLAND GARROS (restaurante001)
// NOTA: El nombre físico de la variable se mantiene LOGO_RESTAURANTE001 para no tener que renombrar archivos físicos
const CSV_URL_RESTAURANTE001 = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
const WEB_APP_URL_RESTAURANTE001 = 'https://script.google.com/macros/s/AKfycbxBdhrRWx9GNYU_oub52jQcRrG-XRhcDIjdHHW_CYQlob3PNButhNinqw-JLNES_3Ci-w/exec';

// CONFIGURACIÓN US OPEN (restaurante002)
const CSV_URL_RESTAURANTE002 = 'https://docs.google.com/spres Felix viewId de tu Sheets aqui...'; // MODIFICADO: El usuario debe actualizarlo con su URL real
const WEB_APP_URL_RESTAURANTE002 = 'https://script.google.com/macros/s/AKfycbzfA3OnavQcmM3IG-7-PeHJw3U44UH5CREnLtwypxDxNQehQ4ZuM6iYqu5lt0VmUnKn/exec';

// MODIFICADO: Función auxiliar pura. Ya no lee window.currentMode. 
// Recibe el modo explícitamente para evitar acoplamiento global y usar el nuevo diccionario
function getWebAppUrl(modo) {
    if (modo === 'restaurante002') {
        return WEB_APP_URL_RESTAURANTE002;
    }
    return WEB_APP_URL_RESTAURANTE001;
}

// MODIFICADO: Función auxiliar pura. Ya no lee window.currentMode.
function getCsvUrl(modo) {
    if (modo === 'restaurante002') {
        return CSV_URL_RESTAURANTE002;
    }
    return CSV_URL_RESTAURANTE001;
}


// =====================================================================
// NUEVO: CONFIGURACIÓN DE INTELIGENCIA ARTIFICIAL (Gemini)
// =====================================================================

// NUEVO: Endpoint centralizado del modelo de IA. 
const GEMINI_ENDPOINT_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

// NUEVO: Cantidad de filas que se envían en cada petición a la IA durante la traducción masiva.
const TRADUCCION_TAMANO_LOTE = 3;


// =====================================================================
// NUEVO: CONFIGURACIÓN CENTRALIZADA DE ASSETS (Rutas e Imágenes)
// =====================================================================

// Path base general para imágenes y recursos estáticos
const PATH_IMAGENES = 'imagenes/imagenes/';

// MODIFICADO: Path específico para los iconos de alérgenos (corregido para evitar doble carpeta)
const PATH_ALERGENOS = 'imagenes/alergenos/';

// Logos Principales (Header del Editor)
// NOTA: El nombre físico de la variable se mantiene LOGO_RESTAURANTE001 para no tener que renombrar archivos físicos
const LOGO_RESTAURANTE001 = PATH_IMAGENES + 'logo_web01.png';
const LOGO_RESTAUREANTE002 = PATH_IMAGENES + 'logo_web02.png';

// Códigos QR Roland Garros
const QR_RESTAURANTE001_DEFAULT = PATH_IMAGENES + 'qr-web01-02.png'; // Oficial RG
const QR_RESTAURANTE001_MOD = PATH_IMAGENES + 'qr-web01-01.png';           // Alternativo RG

// Códigos QR US Open
const QR_RESTAURANTE002_DEFAULT = PATH_IMAGENES + 'qr-web02-01.png'; // Oficial USOPEN
const QR_RESTAURANTE002_MOD = PATH_IMAGENES + 'qr-web02-02.png';         // Alternativo USOPEN


// =====================================================================
// NUEVO: CONFIGURACIÓN DE TIEMPOS DEL SISTEMA
// =====================================================================

// Ventana de tiempo en milisegundos donde el sistema asume que Google Sheets 
// podría estar desactualizado tras un guardado (Client-Side Optimistic Lock)
const CONSISTENCY_WINDOW_MS = 180000; // 3 minutos (180,000 ms)
