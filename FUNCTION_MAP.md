```markdown
// [🔒 ARCHIVO REESCRITO COMPLETAMENTE - VERSIÓN ACTUALIZADA v9.0 - ARQUITECTURA DIRECTA POR ARCHIVOS]

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
window.APP_VERSIONS          Object    Varios                app.js, ui.js, sugerencias-print.js, organizador.js, estructuras.js   index.html (updateDebugPanel)
window.UI.tempImportFile     File      ui.js                 ui.js (listener archivoLocal)                                            ui.js (confirmarImportacion, cancelarImportacion)
window.lastSaveAttempt       Number    app.js, ui.js         app.js (enviarAlExcel), ui.js (sincronizarConGoogleSheets)             ui.js (cargarGoogleSheets - Zona de Peligro)

// NUEVO: Árboles de Estructura Dinámicos por Carta (Fuentes de verdad del Editor)
window.ESTRUCTURA_RESTAURANTE001 Array estructuras.js       estructuras.js (init), organizador.js (ediciones)                 app.js (via getEstructuraActual)
window.ESTRUCTURA_RESTAURANTE002 Array estructuras.js       estructuras.js (init), organizador.js (ediciones)                 app.js (via getEstructuraActual)

// NUEVO: Configuración de disponibilidad de restaurantes
window.RESTAURANTES_CONFIG   Object    config.js             (Estática)                                                                index.html (Inyección post-config para ocultar tabs)

// --- Funciones inyectadas explícitamente en window ---
window.cancelarModoOptimista Function app.js                app.js (asignación)                                                     index.html (botón inline onclick)
window.renderCarta           Function sugerencias-print.js sugerencias-print.js (asignación)                                      index.html (switchTab)
window.imprimirSugerencias   Function sugerencias-print.js sugerencias-print.js (asignación)                                      sugerencias-print.js (HTML dinámico onclick)
window.toggleQR              Function sugerencias-print.js sugerencias-print.js (asignación)                                      sugerencias-print.js (HTML dinámico onchange)
window.UI                    Object    ui.js                 ui.js (asignación final)                                                app.js, index.html (onclick modales)
window.getEstructuraActual    Function estructuras.js     estructuras.js (asignación)                                            app.js (renderizar, generarMenuAgrupado, prepararNuevoPlato)
window.aplicarEstructuraOrg   Function organizador.js       organizador.js (asignación)                                            index.html (botón inline onclick)
window.restaurarEstructuraBase Function organizador.js       organizador.js (asignación)                                            index.html (botón inline onclick)
window._orgUpdateCat         Function organizador.js       organizador.js (asignación)                                            organizador.js (HTML dinámico onchange)
window._orgUpdateSub         Function organizador.js       organizador.js (asignación)                                            organizador.js (HTML dinámico onchange)
window._orgAddSub            Function organizador.js       organizador.js (asignación)                                            organizador.js (HTML dinámico onclick)
window._orgRemoveCat         Function organizador.js       organizador.js (asignación)                                            organizador.js (HTML dinámico onclick)
window._orgRemoveSub         Function organizador.js       organizador.js (asignación)                                            organizador.js (HTML dinámico onchange)

// --- Variables de Super-Config (Inyectadas por config.js) ---
CONSISTENCY_WINDOW_MS        Number    config.js             (Estática)                                                                app.js, index.html, sugerencias-print.js
PATH_IMAGENES                String    config.js             (Estática)                                                                sugerencias-print.js
PATH_ALERGENOS               String    config.js             (Estática)                                                                sugerencias-print.js
LOGO_RESTAURANTE001          String    config.js             (Estática)                                                                index.html, sugerencias-print.js
LOGO_RESTAURANTE002          String    config.js             (Estática)                                                                index.html, sugerencias-print.js
QR_RESTAURANTE001_DEFAULT    String    config.js             (Estática)                                                                sugerencias-print.js
QR_RESTAURANTE001_MOD        String    config.js             (Estática)                                                                sugerencias-print.js
QR_RESTAURANTE002_DEFAULT    String    config.js             (Estática)                                                                sugerencias-print.js
QR_RESTAURANTE002_MOD        String    config.js             (Estática)                                                                sugerencias-print.js
GEMINI_ENDPOINT_URL          String    config.js             (Estática)                                                                app.js, ui.js
TRADUCCION_TAMANO_LOTE       Number    config.js             (Estática)                                                                ui.js

// Sistema de Alias de Marca (Inyectado por config.js)
MODOS_ALIAS                  Object    config.js             (Estática - Diccionario)                                               index.html (Pestañas, Botones), app.js (Alertas, Status), ui.js (Logs, Botones), sugerencias-print.js (Impresión), organizador.js (Pestañas internas)

// Funciones de utilidad de config.js
isRestauranteA               Function  config.js             (Estática)                                                                app.js, index.html
getModoAlias                 Function  config.js             (Estática)                                                                Varios
getWebAppUrl                 Function  config.js             (Estática)                                                                app.js, ui.js
getCsvUrl                    Function  config.js             (Estática)                                                                app.js, index.html

// --- Variables de Utilidades (Inyectadas por utils.js de forma global implícita) ---
window.desglosarNombre       Function utils.js              (Estática global)                                                        app.js, sugerencias-print.js
window.superLimpiar          Function utils.js              (Estática global)                                                        app.js
window.formatWineName        Function utils.js              (Estática global)                                                        app.js
window.extraerJSON           Function utils.js              (Estática global)                                                        app.js


================================================================================
📁 config.js
================================================================================
No usa módulos. Se ejecuta en el scope global.

Sistema de Control de Restaurantes
- RESTAURANTES_CONFIG (Object): Diccionario abstracto que controla la visibilidad.
  Escritores: (Estática)
  Lectores: index.html (para ocultar pestañas), isRestauranteA()

- isRestauranteA(modoInterno)
  Retorna: Boolean
  Lee: RESTAURANTES_CONFIG, modoInterno
  Es usado por: app.js (cargar)

Sistema de Alias de Marca
- MODOS_ALIAS (Object): Mapea 'restaurante001' a 'Roland Garros', etc.
- getModoAlias(modoInterno)
  Retorna: String
  Es usado por: app.js, ui.js, sugerencias-print.js, index.html, organizador.js

Constantes de Red
- CSV_URL_RESTAURANTE001, CSV_URL_RESTAURANTE002, WEB_APP_URL_RESTAURANTE001, WEB_APP_URL_RESTAURANTE002
  Es usado por: getWebAppUrl(), getCsvUrl()

Funciones de Red
- getWebAppUrl(modo), getCsvUrl(modo)
  Es usado por: app.js (vía Safe wrappers), ui.js, index.html

Configuración de Inteligencia Artificial (Gemini)
- GEMINI_ENDPOINT_URL, TRADUCCION_TAMANO_LOTE
  Es usado por: app.js, ui.js

Constantes de Assets y Sistema
- PATH_IMAGENES, PATH_ALERGENOS, LOGO_*, QR_*, CONSISTENCY_WINDOW_MS
  Es usado por: Varios.


================================================================================
📁 estructuras.js
================================================================================
No usa módulos. Se ejecuta en el scope global.

- window.ESTRUCTURA_RESTAURANTE001 (Array), window.ESTRUCTURA_RESTAURANTE002 (Array)
  Escritores: estructuras.js (init), organizador.js
  Lectores: app.js (via getEstructuraActual)

- getEstructuraActual()
  Retorna: Array (El árbol de la carta activa)
  Lee: window.currentMode
  Es usado por: app.js


================================================================================
📁 app.js
================================================================================
No usa módulos. Se ejecuta en el scope global. Contiene la lógica principal del Editor.

Variables Locales (Scope de archivo)
- datosLocales, platoEditandoId, esNuevoPlato, datosTempNuevo, opcionesENActuales

Funciones de Red y Estado
- getWebAppUrlSafe(), getCsvUrlSafe()
- cargar(retryCount) [Usa isRestauranteA]
- enviarAlExcel()
- iniciarContadorOptimista(modo), window.cancelarModoOptimista()

Funciones de Renderizado y UI
- renderizar(), generarMenuAgrupado()
- moverPlato(id, direccion)
- abrirEditor(id, esNuevo), actualizarNombreCroquetas(), comprobarRequisitosTraduccion()
- aplicarCambiosPlato(), toggleActivo(id, v)
- abrirSelector(), cerrarModal(id), prepararNuevoPlato(baseId, folder)

Funciones de Traducción
- generarTraduccionEN(), abrirModalTraduccionEN(), seleccionarOpcionEN(), confirmarTraduccionEN(), cerrarModalTraduccionEN()
- ejecutarTraduccionAutomatica()

Funciones de API Keys (Fallback)
- eliminarKeySeleccionada()


================================================================================
📁 ui.js (Módulo ES)
================================================================================
Usa type="module". Expone window.UI al final.

Variables Internas
- currentKeyIndex, procesoDetenido, procesoPausado, activeLang
- stateContainer (Objeto exclusivo para pestaña Pro: headers, csvData, currentProMode)

Funciones Principales
- UI.log(), UI.setLoadingState(), UI.actualizarListaKeys(), UI.renderRadiosIdiomas(), UI.renderTable()
- UI.cargarGoogleSheets(targetUrl, retryCount), UI.actualizarTextoBotonSync()
- UI.sincronizarConGoogleSheets() [Usa getWebAppUrl inyectando modo abstracto]
- UI.inicializarAjustesExpertos() [Vincula listeners, asigna 'restaurante001' o 'restaurante002']
- UI.confirmarImportacion(mode), UI.cancelarImportacion()
- UI.exportarCSV(), UI.importarCSV()
- UI.iniciarTraduccionPorLotes()


================================================================================
📁 organizador.js (IIFE Unificada)
================================================================================
Módulo aislado para gestión estructural.
- activeTab (String: 'restaurante001' o 'restaurante002')
- getTree(), saveTree(), renderOrganizador() [Internas]
- Funciones window._org* expuestas para HTML dinámico.
- window.restaurarEstructuraBase(), window.aplicarEstructuraOrg() [Expuestas]


================================================================================
📁 sugerencias-print.js (IIFE Unificada)
================================================================================
IIFE aislado. Inyecta en window.
- SUGERENCIAS_CONFIG (Object): Claves STRICT 'restaurante001', 'restaurante002'.
- window.renderCarta(modo) [Espera 'restaurante001' o 'restaurante002']
- window.imprimirSugerencias(modo)
- window.toggleQR(tipo, modo)
- procesarYRender(), aplicarParcheOptimista() [Internas]


================================================================================
📁 index.html (Scripts Inline)
================================================================================
Orquestación de pestañas, inyección dinámica de config.js, debug panel.
- actualizarTextoBotonGuardar()
- switchTab(tabId, btnElement) [Mapea tabs visuales a 'restaurante001'/'restaurante002']
- updateDebugPanel()
- Listeners Debug y Toggle
- Bloque de Inyección de Alias y Visibilidad (Post-Config)
```
