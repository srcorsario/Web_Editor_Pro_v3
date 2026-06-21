# INFORME DE IMPACTO
**Archivos Afectados:** 
- `FUNCTION_MAP.md` (Reescritura completa para reflejar el estado real del código, corregir dependencias cruzadas obsoletas y agregar funciones faltantes críticas).

**Razón de la modificación:** 
El `FUNCTION_MAP.md` actual contenía información desactualizada heredada de versiones previas que causaría errores fatales si se usara como referencia para modificar el código. Específicamente:
1. Aún listaba `ESTRUCTURA`, `categoriesList` y `subCatsLang` en `languages.js`, cuando en el código real fueron migradas a `data.js`.
2. Indicaba que `getWebAppUrl()` y `getCsvUrl()` leían de `window.currentMode`, pero el código real las refactorizó a funciones puras que reciben el `modo` por parámetro.
3. Omitía más de una docena de funciones clave en `app.js` (como `moverPlato`, `prepararNuevoPlato`, `generarTraduccionEN`, etc.) que son vitales para la lógica de negocio.
4. No documentaba varias funciones internas de `ui.js` ni `sugerencias-print.js`.
5. No listaba las funciones globales inyectadas al `window` mediante IIFEs o asignaciones explícitas (`window.renderCarta`, `window.toggleQR`, etc.).

# SUPOSICIONES NECESARIAS
- Se asume que la variable `window.lastSaveAttempt` mencionada en `ui.js` (`cargarGoogleSheets`) es un leftover de una versión antigua o se inyecta desde un entorno externo no proporcionado, ya que no se escribe en ningún archivo del repositorio actual. Se ha señalado en el mapa como "No definido en el repositorio".

---

El archivo `app.js` no requiere modificaciones.
El archivo `config.js` no requiere modificaciones.
El archivo `data.js` no requiere modificaciones.
El archivo `index.html` no requiere modificaciones.
El archivo `languages.js` no requiere modificaciones.
El archivo `state.js` no requiere modificaciones.
El archivo `styles.css` no requiere modificaciones.
El archivo `sugerencias-print.js` no requiere modificaciones.
El archivo `ui.js` no requiere modificaciones.
El archivo `utils.js` no requiere modificaciones.

```markdown
// [🔒 ARCHIVO REESCRITO COMPLETAMENTE - VERSIÓN ACTUALIZADA v2.0]
```javascript
Regla de Oro: Antes de renombrar, mover o eliminar una función/variable listada aquí, verifica su sección ⚠️ DEPENDENCIAS CRUZADAS para evitar romper otros módulos o los onclick del HTML.

================================================================================
🌐 Estado Global Compartido (window.*)
================================================================================
El núcleo de la aplicación. Alterar una de estas variables afecta a múltiples archivos simultáneamente.

Variable                     Tipo      Archivo Origen        Escritores                                                                 Lectores
----------------------------------------------------------------------------------------------------------------------------------------------------
window.currentMode           String    index.html            index.html (switchTab), ui.js (confirmarImportacion, loadSheets...)     config.js (indirecto via params), app.js, index.html, ui.js
window.datosLocales          Array     app.js                app.js (cargar)                                                          app.js (múltiples), sugerencias-print.js, index.html
window.hayCambiosSinGuardar  Boolean   app.js                app.js (moverPlato, aplicarCambiosPlato, toggleActivo, cargar...)      index.html (switchTab)
window.optimisticState       Object    app.js                app.js (cargar, enviarAlExcel, cancelarModoOptimista)                   app.js, sugerencias-print.js, index.html
window.optimisticTimers      Object    app.js                app.js (iniciarContadorOptimista, cancelarModoOptimista)               index.html (switchTab, updateDebugPanel)
window.APP_VERSIONS          Object    Varios                app.js, ui.js, sugerencias-print.js                                     index.html (updateDebugPanel)
window.UI.tempImportFile     File      ui.js                 ui.js (listener archivoLocal)                                            ui.js (confirmarImportacion, cancelarImportacion)
window.lastSaveAttempt       Number    No definido en repo   -                                                                          ui.js (cargarGoogleSheets) - ⚠️ POSIBLE LEFTOVER

// --- Funciones inyectadas explícitamente en window ---
window.cancelarModoOptimista Function app.js                app.js (asignación)                                                     index.html (botón inline onclick)
window.renderCarta           Function sugerencias-print.js sugerencias-print.js (asignación)                                      index.html (switchTab)
window.imprimirSugerencias   Function sugerencias-print.js sugerencias-print.js (asignación)                                      sugerencias-print.js (HTML dinámico onclick)
window.toggleQR              Function sugerencias-print.js sugerencias-print.js (asignación)                                      sugerencias-print.js (HTML dinámico onchange)
window.UI                    Object    ui.js                 ui.js (asignación final)                                                app.js, index.html (onclick modales)

// --- Variables de Super-Config (Inyectadas por config.js) ---
CONSISTENCY_WINDOW_MS        Number    config.js             (Estática)                                                                app.js, index.html, sugerencias-print.js
PATH_IMAGENES                String    config.js             (Estática)                                                                sugerencias-print.js
PATH_ALERGENOS               String    config.js             (Estática)                                                                sugerencias-print.js
LOGO_RG                      String    config.js             (Estática)                                                                index.html, sugerencias-print.js
LOGO_USOPEN                  String    config.js             (Estática)                                                                index.html, sugerencias-print.js
QR_RG_DEFAULT                String    config.js             (Estática)                                                                sugerencias-print.js
QR_RG_MOD                    String    config.js             (Estática)                                                                sugerencias-print.js
QR_USOPEN_DEFAULT            String    config.js             (Estática)                                                                sugerencias-print.js
QR_USOPEN_MOD                String    config.js             (Estática)                                                                sugerencias-print.js

// --- Variables de Utilidades (Inyectadas por utils.js de forma global implícita) ---
window.desglosarNombre       Function utils.js              (Estática global)                                                        app.js, sugerencias-print.js
window.superLimpiar          Function utils.js              (Estática global)                                                        app.js
window.formatWineName        Function utils.js              (Estática global)                                                        app.js
window.extraerJSON           Function utils.js              (Estática global)                                                        app.js


================================================================================
📁 config.js
================================================================================
No usa módulos. Se ejecuta en el scope global.

Constantes de Red
- CSV_URL_RG, CSV_URL_USOPEN, WEB_APP_URL_RG, WEB_APP_URL_USOPEN
  Es usado por: getWebAppUrl(), getCsvUrl() (ambas internas).

Funciones de Red
- getWebAppUrl(modo)
  Retorna: String (URL del Web App de Google)
  Lee: modo (Parámetro inyectado por app.js/ui.js), WEB_APP_URL_RG, WEB_APP_URL_USOPEN
  Es usado por: app.js (vía getWebAppUrlSafe()), ui.js (en sincronizarConGoogleSheets)

- getCsvUrl(modo)
  Retorna: String (URL del CSV de Google Sheets)
  Lee: modo (Parámetro inyectado por app.js/ui.js), CSV_URL_RG, CSV_URL_USOPEN
  Es usado por: app.js (vía getCsvUrlSafe()), index.html (en switchTab)

NUEVAS: Constantes de Assets y Sistema
- PATH_IMAGENES, PATH_ALERGENOS, LOGO_RG, LOGO_USOPEN
  Es usado por: index.html, sugerencias-print.js (inyectadas en SUGERENCIAS_CONFIG)
- QR_RG_DEFAULT, QR_RG_MOD, QR_USOPEN_DEFAULT, QR_USOPEN_MOD
  Es usado por: sugerencias-print.js (inyectadas en SUGERENCIAS_CONFIG)
- CONSISTENCY_WINDOW_MS
  Es usado por: app.js, index.html, sugerencias-print.js


================================================================================
📁 state.js
================================================================================
No usa módulos. Se ejecuta en el scope global.

- getKeys()
  Retorna: Array<String>
  Lee: localStorage
  Es usado por: app.js (generarTraduccionEN, ejecutarTraduccionAutomatica), ui.js (iniciarTraduccionPorLotes)

- saveKey(key)
  Escribe en: localStorage
  Es usado por: app.js (agregarKey), ui.js (listener de addKeyBtn)

- deleteKey(key)
  Escribe en: localStorage
  Es usado por: app.js (eliminarKeySeleccionada), ui.js (listener de btnEliminarKeySeleccionada)


================================================================================
📁 utils.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo de funciones puras (no tocan DOM ni estado).

- desglosarNombre(texto)
  Retorna: { nombre: String, uvas: String }
  Es usado por: app.js (varios lugares de renderizado y guardado), sugerencias-print.js (como principal).

- superLimpiar(texto)
  Retorna: String
  Es usado por: app.js (cargar, aplicarCambiosPlato).

- formatWineName(texto)
  Retorna: String
  Es usado por: app.js (abrirEditor, aplicarCambiosPlato, ejecutarTraduccionAutomatica).

- extraerJSON(texto)
  Retorna: Object (JSON parseado buscando el primer bloque válido)
  Es usado por: app.js (generarTraduccionEN, ejecutarTraduccionAutomatica). 
  NOTA: ui.js no usa esta función, hace un JSON.parse() directo tras limpiar marcadores con regex.


================================================================================
📁 languages.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo.
⚠️ ADVERTENCIA: ESTRUCTURA, categoriesList y subCatsLang se movieron a data.js. NO buscarlas aquí.

- IDIOMAS_CONFIG (Object): Mapeo ISO -> Nombre visible.
- IDIOMAS_ORDEN (Array): Orden de procesamiento.
- IDIOMAS_CSV_INDICES (Object): Mapeo de qué columna del CSV pertenece a qué idioma.

Lectores: app.js (carga, renderizado, traducción), ui.js (carga de columnas, render de radios).


================================================================================
📁 data.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Archivo puramente declarativo.

- ESTRUCTURA (Array): Arbol de categorías, subcategorías, IDs y rangos.
- categoriesList, subCatsLang (Object/Array): Diccionarios de traducción de categorías.
- ALERGENOS_LISTA (Array): Lista de alérgenos con emojis.
  Es usado por: app.js (abrirEditor, renderizado de modal).
- CROQUETAS_CONFIG (Object): Configuración de sabores de croquetas.
  Es usado por: app.js (abrirEditor, actualizarNombreCroquetas).

Lectores: app.js (carga, renderizado, traducción), ui.js (carga de columnas, render de radios).


================================================================================
📁 app.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Contiene la lógica principal del Editor.

Variables Locales (Scope de archivo)
- datosLocales (Array): Reflejo local de window.datosLocales.
- platoEditandoId (Number), esNuevoPlato (Boolean), datosTempNuevo (Object): Estado del modal editor.
- opcionesENActuales (Array): Almacena temporalmente las opciones de IA de traducción EN.

Funciones Utilitarias (Compartidas)
Nota: Estas funciones se consumen desde utils.js de forma global.
- desglosarNombre(texto), extraerJSON(texto), superLimpiar(texto), formatWineName(texto)

Funciones de Red y Estado

- getWebAppUrlSafe()
  Retorna: String
  Lee: window.currentMode, window.WEB_APP_URL, window.getWebAppUrl (inyectando modo por parámetro)
  Es usado por: Internamente en app.js (enviarAlExcel, cargar).

- getCsvUrlSafe()
  Retorna: String
  Lee: window.currentMode, window.CSV_URL, window.getCsvUrl (inyectando modo por parámetro)
  Es usado por: Internamente en app.js (cargar).

- cargar(retryCount)
  Lee: getCsvUrlSafe(), window.optimisticState, window.ESTRUCTURA, window.IDIOMAS_ORDEN, window.IDIOMAS_CSV_INDICES, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: window.datosLocales, window.hayCambiosSinGuardar, DOM (#status-carga, #editor-dinamico)
  Es usado por: index.html (switchTab), se auto-invoca al final del archivo.

- enviarAlExcel()
  Lee: getWebAppUrlSafe(), window.datosLocales, window.currentMode, window.IDIOMAS_ORDEN
  Escribe en: window.optimisticState, sessionStorage, window.hayCambiosSinGuardar, DOM (#btn-guardar-dinamico)
  Es usado por: index.html (botón #btn-guardar-dinamico inline onclick), index.html (switchTab)

- iniciarContadorOptimista(modo)
  Lee: window.optimisticTimers, window.currentMode, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: window.optimisticTimers, sessionStorage, DOM (#optimistic-timer)
  Es usado por: app.js (enviarAlExcel)

- cancelarModoOptimista(modo)
  Escribe en: window.optimisticTimers, window.optimisticState, sessionStorage, DOM (#optimistic-timer)
  Es usado por: index.html (botón inline onclick en el timer)

Funciones de Renderizado y UI

- renderizar()
  Lee: datosLocales, window.ESTRUCTURA
  Escribe en: DOM (#editor-dinamico)

- generarMenuAgrupado()
  Lee: datosLocales, window.ESTRUCTURA
  Escribe en: DOM (#lista-agrupada)

- moverPlato(id, direccion)
  Lee: datosLocales
  Escribe en: datosLocales (IDs), window.hayCambiosSinGuardar
  Es usado por: HTML generado en renderizar() (botones inline onclick)

- abrirEditor(id, esNuevo)
  Lee: window.datosLocales, window.IDIOMAS_ORDEN, window.IDIOMAS_CONFIG, ALERGENOS_LISTA (GLOBAL), CROQUETAS_CONFIG (GLOBAL)
  Escribe en: Variables locales (platoEditandoId, esNuevoPlato), DOM (inputs del modal)
  Es usado por: app.js (prepararNuevoPlato), index.html (botones dinámicos onclick)

- actualizarNombreCroquetas()
  Lee: platoEditandoId, CROQUETAS_CONFIG (GLOBAL), DOM (.croqueta-btn.selected)
  Escribe en: DOM (#edit-es)
  Es usado por: HTML generado en abrirEditor() (botones de croqueta inline onclick)

- comprobarRequisitosTraduccion()
  Lee: DOM (#edit-es, #edit-en)
  Escribe en: DOM (#btn-autotraducir disabled state)
  Es usado por: app.js (abrirEditor, actualizarNombreCroquetas, confirmarTraduccionEN)

- aplicarCambiosPlato()
  Lee: DOM (inputs del modal), window.IDIOMAS_ORDEN, platoEditandoId, esNuevoPlato
  Escribe en: window.datosLocales, window.hayCambiosSinGuardar
  Es usado por: index.html (botón modal onclick)

- toggleActivo(id, v)
  Lee: datosLocales
  Escribe en: datosLocales, window.hayCambiosSinGuardar
  Es usado por: HTML generado en renderizar() (switch inline onchange)

- abrirSelector() / cerrarModal(id)
  Escribe en: DOM (#modal-selector u ID proporcionado)
  Es usado por: index.html (botón flotante onclick, botones de modal)

- prepararNuevoPlato(baseId, folder)
  Lee: window.ESTRUCTURA, datosLocales
  Escribe en: datosTempNuevo
  Es usado por: HTML generado en generarMenuAgrupado() (botones inline onclick)

Funciones de Traducción

- generarTraduccionEN()
  Lee: DOM (#edit-es), getKeys()
  Escribe en: DOM (#modal-traduccion-en), opcionesENActuales
  Es usado por: index.html (botón onclick)

- abrirModalTraduccionEN(), seleccionarOpcionEN(), confirmarTraduccionEN(), cerrarModalTraduccionEN()
  Gestionan: El flujo interno del modal de selección de traducción EN.
  Es usado por: index.html (botones onclick del modal)

- ejecutarTraduccionAutomatica()
  Lee: DOM, window.IDIOMAS_ORDEN, getKeys()
  Escribe en: DOM (inputs de idiomas restantes)
  Es usado por: index.html (botón onclick)

Funciones de API Keys (Legacy/Fallback en app.js)

- actualizarListaKeys(), agregarKey(), eliminarKeySeleccionada()
  Nota: Intentan delegar a UI.actualizarListaKeys(). Si UI no existe aún (por ser módulo), actúan como fallback manipulando el DOM directamente.


================================================================================
📁 ui.js (Módulo ES)
================================================================================
Usa type="module". Todo está encapsulado, pero se expone globalmente al final via window.UI = UI;.

Variables Internas
- currentKeyIndex (Number): Para balanceo de carga en traducción masiva.
- procesoDetenido, procesoPausado (Boolean): Control de flujo de iniciarTraduccionPorLotes.
- activeLang (String): Idioma activo en la vista previa de la pestaña Pro.
- stateContainer (Object): ¡CRÍTICO! NO es window.datosLocales. Es una copia exclusiva para la pestaña "Traductor Pro" con sus propias headers y csvData.

- UI.log(mensaje)
  Escribe en: Consola del navegador, DOM (#status-carga), DOM (#consola)
  Es usado por: Casi todas las funciones de ui.js.

- UI.setLoadingState(buttonId, isLoading, text)
  Escribe en: DOM (botón proporcionado)
  Es usado por: Definida, pero sin uso directo en el flujo actual (reservada/futura).

- UI.actualizarListaKeys(selectorElemento)
  Lee: getKeys()
  Escribe en: DOM (#selectKeys o selector proporcionado)
  Es usado por: ui.js (DOMContentLoaded), app.js (fallback)

- UI.renderRadiosIdiomas()
  Lee: window.IDIOMAS_CONFIG, activeLang
  Escribe en: DOM (#radiosIdiomas), activeLang
  Es usado por: ui.js (DOMContentLoaded)

- UI.renderTable()
  Lee: stateContainer, activeLang, window.IDIOMAS_CONFIG
  Escribe en: DOM (#tableHeadRow, #tablaBody)
  Es usado por: ui.js (Interno tras cargar datos o traducir)

- UI.cargarGoogleSheets(targetUrl, retryCount)
  Lee: window.Papa, window.lastSaveAttempt, targetUrl (Parámetro)
  Escribe en: stateContainer, DOM (#consola)
  Es usado por: Listeners internos de loadSheetsBtnRG y loadSheetsBtnUSOpen

- UI.actualizarTextoBotonSync()
  Lee: stateContainer.currentProMode
  Escribe en: DOM (#btnSyncSheets)
  Es usado por: ui.js (tras cargar datos o importar)

- UI.sincronizarConGoogleSheets()
  Lee: stateContainer, stateContainer.currentProMode, window.getWebAppUrl (desde config.js, pasando modo por parámetro)
  Escribe en: Red (Fetch POST), DOM (#consola)
  Es usado por: Listener interno de btnSyncSheets

- UI.inicializarAjustesExpertos()
  Escribe en: Listeners de DOM para loadSheetsBtnRG, loadSheetsBtnUSOpen, btnIniciar, btnPausa, btnCancelar, saveCsvBtn, btnSyncSheets, archivoLocal.
  Es usado por: ui.js (DOMContentLoaded)

- UI.confirmarImportacion(mode) / UI.cancelarImportacion()
  Lee/Escribe: window.UI.tempImportFile, stateContainer, window.currentMode, DOM (#modal-seleccionar-destino, #archivoLocal)
  Es usado por: index.html (botones inline onclick en #modal-seleccionar-destino)

- UI.exportarCSV(headers, csvData) / UI.importarCSV(file, callback)
  Lee/Escribe: window.Papa, Blob API, FileReader API.
  Es usado por: Listeners internos de saveCsvBtn y flujo de importación.

- UI.iniciarTraduccionPorLotes(stateContainerParam)
  Lee: getKeys(), stateContainer, DOM (rangos)
  Escribe en: stateContainer.csvData, currentKeyIndex, DOM (#consola, #tablaBody)
  Es usado por: Listener interno de btnIniciar


================================================================================
📁 sugerencias-print.js (IIFE Unificada)
================================================================================
IIFE (Invocación Inmediata). Se ejecuta en scope aislado pero inyecta en window. Sustituye a los antiguos archivos separados de RG y USOPEN.

SUGERENCIAS_CONFIG (Variable Interna de Configuración)
- Tipo: Object
- Claves obligatorias: 'RG', 'USOPEN' (Ambas en MAYÚSCULAS estrictas).
- Contiene: versionStr, versionKey, containerId, logoSrc, qrImgId, qrRadioName, qrDefault, qrMod, defaultQrSelection, qrOptions (Array de objetos con value, label, isDefault).
- MODIFICADO: Ahora los valores de logoSrc, qrDefault y qrMod apuntan a variables globales inyectadas por config.js (LOGO_RG, QR_RG_DEFAULT, etc.) en lugar de strings hardcoded.

- window.renderCarta(modo)
  Contrato de modo: String. DEBE ser 'RG' o 'USOPEN' (La función aplica .toUpperCase() por seguridad interna, pero el contrato es mayúsculas).
  Lee: SUGERENCIAS_CONFIG[modo], window.datosLocales, window.optimisticState[modo], window.desglosarNombre (desde utils.js), PATH_ALERGENOS (desde config.js)
  Escribe en: window.APP_VERSIONS, DOM (contenedor configurado en SUGERENCIAS_CONFIG)
  Es usado por: index.html (switchTab -> window.renderCarta('RG') o window.renderCarta('USOPEN'))

- procesarYRender(fuente, contenedor, config, modoSeguro) [Interna]
  Lee: fuente (Array), config, window.desglosarNombre, PATH_ALERGENOS
  Escribe en: DOM (contenedor)
  Es usado por: window.renderCarta (Interna)

- window.imprimirSugerencias(modo)
  Contrato de modo: String. DEBE ser 'RG' o 'USOPEN'.
  Lee: SUGERENCIAS_CONFIG[modo], DOM (contenedor configurado), Estilos inyectados (#sugerencias-print-styles)
  Escribe en: Nueva ventana del navegador (Window.open)
  Es usado por: HTML generado dinámicamente (botón imprimir onclick)

- window.toggleQR(tipo, modo)
  Contrato de tipo: String. VALORES ESTRICTOS: 'none', 'default', 'mod'.
  Contrato de modo: String. DEBE ser 'RG' o 'USOPEN' (Obligatoriedad de mayúsculas crítica para resolver SUGERENCIAS_CONFIG).
  Lee: SUGERENCIAS_CONFIG[modo]
  Escribe en: DOM (img #img-qr-rg o #img-qr-usopen -> atributo src y style.display)
  Es usado por: HTML generado dinámicamente (inputs radio inline onchange)

- aplicarParcheOptimista(fuente, modo) [Interna]
  Lee: window.optimisticState, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: Array fuente (por referencia)
  Es usado por: procesarYRender (Interna)


================================================================================
📁 index.html (Scripts Inline)
================================================================================
Contiene la orquestación de pestañas, sistema de arrastre del panel Debug y toggle de visibilidad.
Los src de las imágenes del header apuntan a la ruta centralizada en config.js (inyectada mediante script instantáneo post-carga de config.js).

- actualizarTextoBotonGuardar()
  Lee: window.currentMode
  Escribe en: DOM (#btn-guardar-dinamico)
  Es usado por: switchTab, inicialización.

- switchTab(tabId, btnElement)
  Lee: window.hayCambiosSinGuardar, window.cargar, window.renderCarta, window.optimisticTimers
  Escribe en: window.currentMode, DOM (tabs, botones flotantes, #optimistic-timer)
  Es usado por: Botones .tab-btn inline onclick

- updateDebugPanel()
  Lee: window.APP_VERSIONS, window.optimisticState, window.datosLocales, window.currentMode, CONSISTENCY_WINDOW_MS (GLOBAL)
  Escribe en: DOM (#debug-versions, #debug-state)
  Es usado por: setInterval interno (cada 1s)

Listeners de Arrastre (Debug Panel)
- Objetivo: #debug-panel
- Eventos: mousedown, mousemove, mouseup
- Escribe en: Estilos inline de #debug-panel (left, top, cursor)

Listeners de Toggle (Debug Panel)
- Objetivo: #toggle-debug-panel
- Eventos: change
- Escribe en: Estilo display de #debug-panel (none o block)
```
