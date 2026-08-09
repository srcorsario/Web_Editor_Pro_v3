// [🔒 ARCHIVO REESCRITO COMPLETAMENTE - VERSIÓN ACTUALIZADA v10.0 - ARQUITECTURA DIRECTA POR ARCHIVOS + SPLIT DE ui.js EN MÓDULOS ES]

Regla de Oro: Antes de renombrar, mover o eliminar una función/variable listada aquí, verifica su sección ⚠️ DEPENDENCIAS CRUZADAS para evitar romper otros módulos o los onclick del HTML.

================================================================================
🌐 Estado Global Compartido (window.*)
================================================================================
El núcleo de la aplicación. Alterar una de estas variables afecta a múltiples archivos simultáneamente.

Variable                     Tipo      Archivo Origen        Escritores                                                                 Lectores
----------------------------------------------------------------------------------------------------------------------------------------------------
window.currentMode           String    index.html            index.html (switchTab), ui-core.js (confirmarImportacion, loadSheets...)  config.js (indirecto via params), app.js, index.html, ui-*.js
window.datosLocales          Array     app.js                app.js (cargar)                                                          app.js (múltiples), sugerencias-print.js, index.html
window.hayCambiosSinGuardar  Boolean   app.js                app.js (moverPlato, aplicarCambiosPlato, toggleActivo, cargar...)      index.html (switchTab)
window.optimisticState       Object    app.js                app.js (cargar, enviarAlExcel, cancelarModoOptimista)                   app.js, sugerencias-print.js, index.html
window.optimisticTimers      Object    app.js                app.js (iniciarContadorOptimista, cancelarModoOptimista)               index.html (switchTab, updateDebugPanel)
window.APP_VERSIONS          Object    Varios                app.js, ui.js, sugerencias-print.js, organizador.js, estructuras.js   index.html (updateDebugPanel)
window.UI.tempImportFile     File      ui-core.js             ui-core.js (listener archivoLocal)                                       ui-core.js (confirmarImportacion, cancelarImportacion)
window.lastSaveAttempt       Number    app.js, ui-core.js     app.js (enviarAlExcel), ui-core.js (sincronizarConGoogleSheets)        ui-core.js (cargarGoogleSheets - Zona de Peligro)

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
window.UI                    Object    ui.js (orquestador)   ui.js (spread de UICore+UIRender+UIBatchInfo+UIBatchNombres + asignación final) app.js, index.html (onclick modales)
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
GEMINI_ENDPOINT_URL          String    config.js             (Estática)                                                                app.js, ui-batch-info.js, ui-batch-nombres.js
TRADUCCION_TAMANO_LOTE       Number    config.js             (Estática)                                                                ui-batch-nombres.js
INFO_EXTENDIDA_TAMANO_LOTE   Number    config.js             (Estática)                                                                ui-batch-info.js

// Sistema de Alias de Marca (Inyectado por config.js)
MODOS_ALIAS                  Object    config.js             (Estática - Diccionario)                                               index.html (Pestañas, Botones), app.js (Alertas, Status), ui-core.js (Logs, Botones), sugerencias-print.js (Impresión), organizador.js (Pestañas internas)

// Funciones de utilidad de config.js
isRestauranteA               Function  config.js             (Estática)                                                                app.js, index.html
getModoAlias                 Function  config.js             (Estática)                                                                Varios
getWebAppUrl                 Function  config.js             (Estática)                                                                app.js, ui-core.js
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
  Es usado por: app.js, ui-core.js, sugerencias-print.js, index.html, organizador.js

Constantes de Red
- CSV_URL_RESTAURANTE001, CSV_URL_RESTAURANTE002, WEB_APP_URL_RESTAURANTE001, WEB_APP_URL_RESTAURANTE002
  Es usado por: getWebAppUrl(), getCsvUrl()
  ⚠️ CSV_URL_RESTAURANTE00X es la URL de "publicar en la web" de Google Sheets — cacheada por Google
  varios minutos. cargar() (app.js) y los inputs "Cargar web RG/USOPEN" (precargados desde aquí en
  index.html) dependen de ella; UI.sincronizarConGoogleSheets() (ui-core.js) puede sobrescribir datos
  reales con datos obsoletos si se sincroniza justo tras cargar una versión cacheada.

Funciones de Red
- getWebAppUrl(modo), getCsvUrl(modo)
  Es usado por: app.js (vía Safe wrappers), ui-core.js, index.html

Configuración de Inteligencia Artificial (Gemini)
- GEMINI_ENDPOINT_URL, TRADUCCION_TAMANO_LOTE, INFO_EXTENDIDA_TAMANO_LOTE
  Es usado por: app.js, ui-batch-info.js, ui-batch-nombres.js

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

// NUEVO (agosto 2026): faltaban por completo, no estaban definidas en ningún archivo del
// proyecto y rompían abrirEditor() con "ReferenceError" a mitad de ejecución (por eso el
// modal de edición no llegaba a mostrarse). Reconstruidas con los datos reales del negocio.
- ALERGENOS_LISTA (Array): los 16 códigos usados en la columna Alergenos_Cod (14 alérgenos UE +
  Vegano/Vegetariano), en formato "EMOJI NOMBRE". Es usado por: abrirEditor() (pintar grid),
  aplicarCambiosPlato() (leer selección).
- CROQUETAS_CONFIG (Object): { carne: [...5 sabores], vegetariana: [...2 sabores] }. Es usado por:
  abrirEditor(), actualizarNombreCroquetas() (solo para platos ID 12100-12299).

Funciones de Red y Estado
- getWebAppUrlSafe(), getCsvUrlSafe()
- cargar(retryCount) [Usa isRestauranteA]
- enviarAlExcel()
- iniciarContadorOptimista(modo), window.cancelarModoOptimista()

Funciones de Renderizado y UI
- renderizar(), generarMenuAgrupado()
- moverPlato(id, direccion)
- abrirEditor(id, esNuevo), actualizarNombreCroquetas(), comprobarRequisitosTraduccion()
  ⚠️ abrirEditor() debe terminar SIEMPRE con modalEditor.style.display = 'block' (se perdió una
  vez y el editor se quedaba oculto sin avisar). Los ids de los inputs de nombre son 'edit-es' y
  'edit-en' — 'en' a secas NO existe en el HTML; usar el id corto rompía el precargado del inglés
  sin lanzar error, dejando el campo con el valor residual del plato editado justo antes.
- aplicarCambiosPlato(), toggleActivo(id, v)
- abrirSelector(), cerrarModal(id), prepararNuevoPlato(baseId, folder)

Funciones de Traducción
- generarTraduccionEN(), abrirModalTraduccionEN(), seleccionarOpcionEN(), confirmarTraduccionEN(), cerrarModalTraduccionEN()
- ejecutarTraduccionAutomatica()

Funciones de API Keys (Fallback)
- eliminarKeySeleccionada()


================================================================================
📁 ui.js + ui-state.js + ui-core.js + ui-render.js + ui-batch-info.js + ui-batch-nombres.js (Módulos ES)
================================================================================
// REESCRITO (agosto 2026): lo que antes era un único ui.js de ~970 líneas se dividió en 6
// módulos ES (import/export) agrupados por estabilidad — de lo que casi nunca cambia a lo que
// se toca con más frecuencia. index.html NO cambió: ya cargaba <script type="module" src="ui.js">,
// y ui.js ahora solo importa y fusiona los demás.

--- ui-state.js (estado compartido — casi nunca cambia) ---
- stateContainer (Object: headers, csvData, currentProMode) — antes vivía suelto en ui.js
- procesoState (Object: currentKeyIndex, detenido, pausado) — antes eran 3 variables sueltas
  (currentKeyIndex, procesoDetenido, procesoPausado); ahora son propiedades de un objeto para
  poder mutarlas desde otros módulos sin reasignar el binding del import
- langState (Object: activeLang) — antes variable suelta 'activeLang'
- asegurarColumnasEstructura(container) [Exportada]
  ⚠️ Cualquier módulo que necesite estas variables las importa desde aquí — nunca declararlas
  de nuevo en otro archivo.

--- ui-core.js (infraestructura — rara vez cambia) ---
Exporta UICore, fusionado en UI por ui.js.
- UI.log(), UI.setLoadingState(), UI.actualizarListaKeys()
- UI.cargarGoogleSheets(targetUrl, retryCount), UI.actualizarTextoBotonSync()
- UI.sincronizarConGoogleSheets() [Usa getWebAppUrl inyectando modo abstracto]
  ⚠️ Manda info_<lang> siempre, incluso vacío (row[i] || "") — si stateContainer viene de una
  carga con Google Sheets cacheado, puede sobrescribir INFO_* real con vacío en Código.gs.
- UI.inicializarAjustesExpertos() [Vincula TODOS los listeners de botones: guardar, sync, cargar
  RG/USOPEN, importar, btnIniciar, btnIniciarNombres, pausa/cancelar, QA]
- UI.confirmarImportacion(mode), UI.cancelarImportacion()
- UI.exportarCSV(), UI.importarCSV()

--- ui-render.js (renderizado visual — cambia si se retoca el aspecto) ---
Exporta UIRender, fusionado en UI por ui.js.
- UI.renderRadiosIdiomas(), UI.renderTable()
- UI.renderQA() [Editor de Preguntas/Respuestas — pestaña QA; edita INFO_ES/INFO_EN directamente
  en stateContainer.csvData; NO tiene botón de guardado propio, depende de UI.sincronizarConGoogleSheets()]

--- ui-batch-info.js (Fase 1 — cambia a menudo, es donde más se itera) ---
Exporta UIBatchInfo, fusionado en UI por ui.js.
- UI.iniciarTraduccionPorLotes(stateContainerParam) — botón "Generar Info Platos ES/EN"
  (antes "Iniciar Traducción"); genera INFO_ES/INFO_EN + NOMBRE_EN por lotes de
  INFO_EXTENDIDA_TAMANO_LOTE vía Gemini, separando platos y vinos (prompts distintos);
  salta lo que ya está completo para no gastar tokens de más.

--- ui-batch-nombres.js (Fase 2 — cambia a menudo, es donde más se itera) ---
Exporta UIBatchNombres, fusionado en UI por ui.js.
- UI.iniciarTraduccionNombresPorLotes(stateContainerParam) — botón "Traducir Platos en ES a Todos
  los Idiomas Faltantes" (antes "Traducir Nombres (resto idiomas)"); traduce NOMBRE_ES al resto de
  24 idiomas por lotes de TRADUCCION_TAMANO_LOTE vía Gemini.

--- ui.js (orquestador — ~40 líneas, nunca cambia) ---
- Importa UICore, UIRender, UIBatchInfo, UIBatchNombres y las fusiona: `UI = {...UICore, ...UIRender, ...UIBatchInfo, ...UIBatchNombres}`
- window.UI = UI (necesario porque los onclick="UI...." del HTML no pueden acceder a exports de un módulo)
- Listener DOMContentLoaded: llama a renderRadiosIdiomas(), inicializarAjustesExpertos(), actualizarListaKeys()
  ⚠️ Si necesitas tocar una función concreta, casi seguro está en uno de los 5 archivos de arriba,
  no en ui.js.


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
- Lee p.activa y el rango de ID 12000-12999 de window.datosLocales (app.js) para filtrar
  sugerencias del chef; NO escribe nada, es de solo lectura.


================================================================================
📁 index.html (Scripts Inline)
================================================================================
Orquestación de pestañas, inyección dinámica de config.js, debug panel.
- actualizarTextoBotonGuardar()
- switchTab(tabId, btnElement) [Mapea tabs visuales a 'restaurante001'/'restaurante002'; llama a
  window.cargar() en CADA cambio de pestaña, incluida "Sugerencias" — usa la URL cacheada de
  Google Sheets, mitigado por la ventana de consistencia de 3 min (CONSISTENCY_WINDOW_MS)]
- updateDebugPanel()
- Listeners Debug y Toggle
- Bloque de Inyección de Alias y Visibilidad (Post-Config)
- Precarga sheetsUrlRG / sheetsUrlUSOpen con CSV_URL_RESTAURANTE001/002 (URL cacheada de "publicar
  en la web", no en vivo)
