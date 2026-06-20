```markdown
Regla de Oro: Antes de renombrar, mover o eliminar una función/variable listada aquí, verifica su sección ⚠️ DEPENDENCIAS CRUZADAS para evitar romper otros módulos o los onclick del HTML.

# 🌐 Estado Global Compartido (window.*)

El núcleo de la aplicación. Alterar una de estas variables afecta a múltiples archivos simultáneamente.

| Variable | Tipo | Archivo Origen | Escritores | Lectores |
| :--- | :--- | :--- | :--- | :--- |
| `window.currentMode` | String | index.html | index.html (switchTab), ui.js (confirmarImportacion, hack en sincronizarConGoogleSheets) | config.js, app.js, index.html, ui.js |
| `window.datosLocales` | Array | app.js | app.js (cargar) | app.js (múltiples), sugerencias-print.js, index.html (updateDebugPanel) |
| `window.hayCambiosSinGuardar` | Boolean | app.js | app.js (moverPlato, aplicarCambiosPlato, toggleActivo, cargar, enviarAlExcel) | index.html (switchTab) |
| `window.optimisticState` | Object | app.js | app.js (cargar, enviarAlExcel, cancelarModoOptimista) | app.js, sugerencias-print.js, index.html (updateDebugPanel) |
| `window.optimisticTimers` | Object | app.js | app.js (iniciarContadorOptimista, cancelarModoOptimista) | index.html (switchTab, updateDebugPanel) |
| `window.APP_VERSIONS` | Object | Varios | app.js, ui.js, sugerencias-print.js | index.html (updateDebugPanel) |
| `window.UI.tempImportFile` | File | ui.js | ui.js (listener archivoLocal) | ui.js (confirmarImportacion, cancelarImportacion) |
| `window.lastSaveAttempt` | Number | No definido explícitamente | - | ui.js (cargarGoogleSheets) |

---

# 📁 config.js
No usa módulos. Se ejecuta en el scope global.

**Constantes**
*   `CSV_URL_RG`, `CSV_URL_USOPEN`, `WEB_APP_URL_RG`, `WEB_APP_URL_USOPEN`
    *   Es usado por: `getWebAppUrl()`, `getCsvUrl()` (ambas internas).

**getWebAppUrl()**
*   Retorna: String (URL del Web App de Google)
*   Lee: `window.currentMode`, `WEB_APP_URL_RG`, `WEB_APP_URL_USOPEN`
*   Es usado por: app.js (vía `getWebAppUrlSafe()`), ui.js (en `sincronizarConGoogleSheets`)

**getCsvUrl()**
*   Retorna: String (URL del CSV de Google Sheets)
*   Lee: `window.currentMode`, `CSV_URL_RG`, `CSV_URL_USOPEN`
*   Es usado por: app.js (vía `getCsvUrlSafe()`), index.html (en `switchTab`)

---

# 📁 state.js
No usa módulos. Se ejecuta en el scope global.

**getKeys()**
*   Retorna: `Array<String>`
*   Lee: `localStorage`
*   Es usado por: app.js (`generarTraduccionEN`, `ejecutarTraduccionAutomatica`), ui.js (`iniciarTraduccionPorLotes`)

**saveKey(key)**
*   Escribe en: `localStorage`
*   Es usado por: app.js (`agregarKey`), ui.js (listener de `addKeyBtn`)

**deleteKey(key)**
*   Escribe en: `localStorage`
*   Es usado por: app.js (`eliminarKeySeleccionada`), ui.js (listener de `btnEliminarKeySeleccionada`)

---

# 📁 utils.js
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo de funciones puras (no tocan DOM ni estado).

**Funciones Globales Inyectadas**
*   **`desglosarNombre(texto)`**
    *   Retorna: `{ nombre: String, uvas: String }`
    *   Es usado por: app.js (varios lugares de renderizado y guardado), sugerencias-print.js (como principal).
*   **`superLimpiar(texto)`**
    *   Retorna: String
    *   Es usado por: app.js (`cargar`, `aplicarCambiosPlato`).
*   **`formatWineName(texto)`**
    *   Retorna: String
    *   Es usado por: app.js (`abrirEditor`, `aplicarCambiosPlato`, `ejecutarTraduccionAutomatica`).
*   **`extraerJSON(texto)`**
    *   Retorna: Object (JSON parseado buscando el primer bloque `{...}` válido)
    *   Es usado por: app.js (`generarTraduccionEN`, `ejecutarTraduccionAutomatica`). *Nota: ui.js no usa esta función, hace un parseo directo tras limpiar marcadores con regex.*

Lectores: app.js (carga, renderizado, traducción), ui.js (carga de columnas, render de radios).

---

# 📁 languages.js
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo.

**Variables Globales Inyectadas**
*   `IDIOMAS_CONFIG` (Object): Mapeo ISO -> Nombre visible.
*   `IDIOMAS_ORDEN` (Array): Orden de procesamiento.
*   `IDIOMAS_CSV_INDICES` (Object): Mapeo de qué columna del CSV pertenece a qué idioma.
*   `ESTRUCTURA` (Array): Arbol de categorías, subcategorías, IDs y rangos.
*   `categoriesList`, `subCatsLang` (Object/Array): Diccionarios de traducción de categorías.

Lectores: app.js (carga, renderizado, traducción), ui.js (carga de columnas, render de radios).

---

# 📁 app.js
No usa módulos. Se ejecuta en el scope global. Contiene la lógica principal del Editor.

**Variables Locales (Scope de archivo)**
*   `datosLocales` (Array): Reflejo local de `window.datosLocales`.
*   `platoEditandoId` (Number), `esNuevoPlato` (Boolean), `datosTempNuevo` (Object): Estado del modal editor.
*   `opcionesENActuales` (Array): Almacena temporalmente las opciones de IA de traducción EN.
*   `ALERGENOS_LISTA` (Array), `CROQUETAS_CONFIG` (Object): Constantes estáticas de configuración de UI.

**Funciones Utilitarias (Compartidas)**
*Nota: Estas funciones se han movido a utils.js. app.js las consume desde ahí.*
`desglosarNombre(texto)`, `extraerJSON(texto)`, `superLimpiar(texto)`, `formatWineName(texto)`

**Funciones de Red y Estado**
*   **`getWebAppUrlSafe()` / `getCsvUrlSafe()`**
    *   Retorna: String
    *   Lee: `window.WEB_APP_URL`, `window.CSV_URL`, y sus funciones equivalentes.
    *   Es usado por: Internamente en app.js.

*   **`cargar(retryCount)`**
    *   Lee: `getCsvUrlSafe()`, `window.optimisticState`, `window.ESTRUCTURA`, `window.IDIOMAS_ORDEN`, `window.IDIOMAS_CSV_INDICES`
    *   Escribe en: `window.datosLocales`, `window.hayCambiosSinGuardar`, DOM (`#status-carga`, `#editor-dinamico`)
    *   Es usado por: index.html (`switchTab`), se auto-invoca al final del archivo.

*   **`enviarAlExcel()`**
    *   Lee: `getWebAppUrlSafe()`, `window.datosLocales`, `window.currentMode`, `window.IDIOMAS_ORDEN`
    *   Escribe en: `window.optimisticState`, `sessionStorage`, `window.hayCambiosSinGuardar`, DOM (`#btn-guardar-dinamico`)
    *   Es usado por: index.html (botón `#btn-guardar-dinamico` inline onclick), index.html (`switchTab`)

*   **`iniciarContadorOptimista(modo)`**
    *   Lee: `window.optimisticTimers`, `window.currentMode`
    *   Escribe en: `window.optimisticTimers`, `sessionStorage`, DOM (`#optimistic-timer`)
    *   Es usado por: app.js (`enviarAlExcel`)

*   **`cancelarModoOptimista(modo)`**
    *   Escribe en: `window.optimisticTimers`, `window.optimisticState`, `sessionStorage`, DOM (`#optimistic-timer`)
    *   Es usado por: index.html (botón inline onclick en el timer)

**Funciones de Renderizado y UI**
*   **`renderizar()`**
    *   Lee: `datosLocales`, `window.ESTRUCTURA`
    *   Escribe en: DOM (`#editor-dinamico`)

*   **`generarMenuAgrupado()`**
    *   Lee: `datosLocales`, `window.ESTRUCTURA`
    *   Escribe en: DOM (`#lista-agrupada`)

*   **`abrirEditor(id, esNuevo)`**
    *   Lee: `window.datosLocales`, `window.IDIOMAS_ORDEN`, `window.IDIOMAS_CONFIG`
    *   Escribe en: Variables locales (`platoEditandoId`, `esNuevoPlato`), DOM (inputs del modal)
    *   Es usado por: app.js (`prepararNuevoPlato`), index.html (botones dinámicos onclick)

*   **`aplicarCambiosPlato()`**
    *   Lee: DOM (inputs del modal), `window.IDIOMAS_ORDEN`, `platoEditandoId`, `esNuevoPlato`
    *   Escribe en: `window.datosLocales`, `window.hayCambiosSinGuardar`
    *   Es usado por: index.html (botón modal onclick)

*   **`abrirSelector()` / `cerrarModal(id)`**
    *   Escribe en: DOM (`#modal-selector`)
    *   Es usado por: index.html (botón flotante onclick)

**Funciones de Traducción**
*   **`generarTraduccionEN()`**
    *   Lee: DOM (`#edit-es`), `getKeys()`
    *   Escribe en: DOM (`#modal-traduccion-en`), `opcionesENActuales`
    *   Es usado por: index.html (botón onclick)

*   **`abrirModalTraduccionEN()`, `seleccionarOpcionEN()`, `confirmarTraduccionEN()`, `cerrarModalTraduccionEN()`**
    *   Gestionan: El flujo interno del modal de selección de traducción EN.
    *   Es usado por: index.html (botones onclick del modal)

*   **`ejecutarTraduccionAutomatica()`**
    *   Lee: DOM, `window.IDIOMAS_ORDEN`, `getKeys()`
    *   Escribe en: DOM (inputs de idiomas restantes)
    *   Es usado por: index.html (botón onclick)

**Funciones de API Keys (Legacy/Fallback en app.js)**
*   **`actualizarListaKeys()`, `agregarKey()`, `eliminarKeySeleccionada()`**
    *   Nota: Intentan delegar a `UI.actualizarListaKeys()`. Si UI no existe aún (por ser módulo), actúan como fallback manipulando el DOM directamente.

---

# 📁 ui.js (Módulo ES)
Usa `type="module"`. Todo está encapsulado, pero se expone globalmente al final via `window.UI = UI;`.

**Variables Internas**
*   `currentKeyIndex` (Number): Para balanceo de carga en traducción masiva.
*   `procesoDetenido`, `procesoPausado` (Boolean): Control de flujo de `iniciarTraduccionPorLotes`.
*   `activeLang` (String): Idioma activo en la vista previa de la pestaña Pro.
*   `stateContainer` (Object): ¡CRÍTICO! NO es `window.datosLocales`. Es una copia exclusiva para la pestaña "Traductor Pro" con sus propias `headers` y `csvData`.

*   **`UI.log(mensaje)`**
    *   Escribe en: Consola del navegador, DOM (`#status-carga`), DOM (`#consola`)
    *   Es usado por: Casi todas las funciones de ui.js.

*   **`UI.renderRadiosIdiomas()`**
    *   Lee: `window.IDIOMAS_CONFIG`, `activeLang`
    *   Escribe en: DOM (`#radiosIdiomas`), `activeLang`
    *   Es usado por: ui.js (al final, en DOMContentLoaded)

*   **`UI.renderTable()`**
    *   Lee: `stateContainer`, `activeLang`, `window.IDIOMAS_CONFIG`
    *   Escribe en: DOM (`#tableHeadRow`, `#tablaBody`)
    *   Es usado por: ui.js (Interno tras cargar datos o traducir)

*   **`UI.cargarGoogleSheets(targetUrl, retryCount)`**
    *   Lee: `window.Papa`, `window.lastSaveAttempt`
    *   Escribe en: `stateContainer`, DOM (`#consola`)
    *   Es usado por: Listeners internos de `loadSheetsBtnRG` y `loadSheetsBtnUSOpen`

*   **`UI.actualizarTextoBotonSync()`**
    *   Lee: `stateContainer.currentProMode`
    *   Escribe en: DOM (`#btnSyncSheets`)

*   **`UI.sincronizarConGoogleSheets()`**
    *   Lee: `stateContainer`, `stateContainer.currentProMode`, `window.getWebAppUrl` (desde config.js)
    *   Escribe en: `window.currentMode` (Temporalmente como hack para obtener la URL correcta de config.js), Red (Fetch POST), DOM (`#consola`)
    *   Es usado por: Listener interno de `btnSyncSheets`

*   **`UI.confirmarImportacion(mode)` / `UI.cancelarImportacion()`**
    *   Lee/Escribe: `window.UI.tempImportFile`, `stateContainer`, `window.currentMode`, DOM (`#modal-seleccionar-destino`, `#archivoLocal`)
    *   Es usado por: index.html (botones inline onclick en `#modal-seleccionar-destino`)

*   **`UI.exportarCSV(headers, csvData)` / `UI.importarCSV(file, callback)`**
    *   Lee/Escribe: `window.Papa`, Blob API, FileReader API.
    *   Es usado por: Listeners internos de `saveCsvBtn` y flujo de importación.

*   **`UI.iniciarTraduccionPorLotes(stateContainerParam)`**
    *   Lee: `getKeys()`, `stateContainer`, DOM (rangos)
    *   Escribe en: `stateContainer.csvData`, `currentKeyIndex`, DOM (`#consola`, `#tablaBody`)
    *   Es usado por: Listener interno de `btnIniciar`

---

# 📁 sugerencias-print.js (IIFE Unificada)
IIFE (Invocación Inmediata). Se ejecuta en scope aislado pero inyecta en window. Sustituye a los antiguos archivos separados de RG y USOPEN.

**SUGERENCIAS_CONFIG (Variable Interna de Configuración)**
*   Tipo: Object
*   Claves obligatorias: `'RG'`, `'USOPEN'` (Ambas en MAYÚSCULAS estrictas).
*   Contiene: `versionStr`, `versionKey`, `containerId`, `logoSrc`, `qrImgId`, `qrRadioName`, `qrDefault`, `qrMod`, `defaultQrSelection`, `qrOptions` (Array de objetos con value, label, isDefault).

*   **`window.renderCarta(modo)`**
    *   Contrato de modo: String. DEBE ser `'RG'` o `'USOPEN'` (La función aplica `.toUpperCase()` por seguridad interna, pero el contrato es mayúsculas).
    *   Lee: `SUGERENCIAS_CONFIG[modo]`, `window.datosLocales`, `window.optimisticState[modo]`
    *   Escribe en: `window.APP_VERSIONS`, DOM (contenedor configurado en SUGERENCIAS_CONFIG)
    *   Es usado por: index.html (`switchTab` -> `window.renderCarta('RG')` o `window.renderCarta('USOPEN')`)

*   **`window.imprimirSugerencias(modo)`**
    *   Contrato de modo: String. DEBE ser `'RG'` o `'USOPEN'`.
    *   Lee: `SUGERENCIAS_CONFIG[modo]`, DOM (contenedor configurado), Estilos inyectados (`#sugerencias-print-styles`)
    *   Escribe en: Nueva ventana del navegador (`Window.open`)
    *   Es usado por: HTML generado dinámicamente (botón imprimir onclick)

*   **`window.toggleQR(tipo, modo)`**
    *   Contrato de tipo: String. VALORES ESTRICTOS: `'none'`, `'default'`, `'mod'`.
    *   Contrato de modo: String. DEBE ser `'RG'` o `'USOPEN'` (Obligatoriedad de mayúsculas crítica para resolver SUGERENCIAS_CONFIG).
    *   Lee: `SUGERENCIAS_CONFIG[modo]`
    *   Escribe en: DOM (img `#img-qr-rg` o `#img-qr-usopen` -> atributo src y style.display)
    *   Es usado por: HTML generado dinámicamente (inputs radio inline onchange)

---

# 📁 index.html (Scripts Inline)
Contiene la orquestación de pestañas, sistema de arrastre del panel Debug y toggle de visibilidad.

*   **`actualizarTextoBotonGuardar()`**
    *   Lee: `window.currentMode`
    *   Escribe en: DOM (`#btn-guardar-dinamico`)
    *   Es usado por: `switchTab`, inicialización.

*   **`switchTab(tabId, btnElement)`**
    *   Lee: `window.hayCambiosSinGuardar`, `window.cargar`, `window.renderCarta`, `window.optimisticTimers`
    *   Escribe en: `window.currentMode`, DOM (tabs, botones flotantes, `#optimistic-timer`)
    *   Es usado por: Botones `.tab-btn` inline onclick

*   **`updateDebugPanel()`**
    *   Lee: `window.APP_VERSIONS`, `window.optimisticState`, `window.datosLocales`, `window.currentMode`
    *   Escribe en: DOM (`#debug-versions`, `#debug-state`)
    *   Es usado por: `setInterval` interno (cada 1s)

**Listeners de Arrastre (Debug Panel)**
*   Objetivo: `#debug-panel`
*   Eventos: `mousedown`, `mousemove`, `mouseup`
*   Escribe en: Estilos inline de `#debug-panel` (left, top, cursor)

**Listeners de Toggle (Debug Panel)**
*   Objetivo: `#toggle-debug-panel`
*   Eventos: `change`
*   Escribe en: Estilo display de `#debug-panel` (none o block)
```
