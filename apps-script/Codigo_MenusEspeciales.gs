// REPOSITORIO: google-apps-script (proyecto NUEVO, independiente de RG y de US Open)
// ARCHIVO: Código.gs — backend de "Menús Especiales" para Web_Editor_Pro_v3
// -----------------------------------------------------------------------------------------
// QUÉ ES ESTO: backend dedicado SOLO a guardar/recuperar plantillas de "menú especial"
// (menús de evento tipo boda/grupo, sin precio, con logo opcional, entrantes/primero/
// principal/postre activables y bebidas). Vive en un Google Sheet y un proyecto de Apps
// Script COMPLETAMENTE NUEVOS, sin relación con las hojas ni los Código.gs de RG ni de
// US Open — así un menú especial puede combinar libremente platos de las dos cartas sin
// "pertenecer" a ninguna, y sin ningún riesgo de interferir con "GUARDAR CAMBIOS EN WEB"
// (que en RG/US Open reescribe su Hoja 1 entera) ni con el espacio de IDs de esas cartas
// (el rango 13400-14499 de RG/US Open, por ejemplo, ya está ocupado por "Cavas & Champagne"
// — reutilizar esos IDs para menús habría chocado con platos reales).
//
// DISEÑO DELIBERADO: este script NO entiende ni valida el contenido de cada menú — solo
// guarda y devuelve un bloque de texto JSON ("config") tal cual se lo pasan. Toda la lógica
// de qué campos tiene un menú (idiomas, secciones, platos, bebidas...) vive en el frontend
// (Web_Editor_Pro_v3). Esto es a propósito: significa que se puede seguir mejorando la
// plantilla del menú especial (añadir un campo, cambiar cómo se imprime, etc.) SOLO tocando
// el frontend, sin volver a tocar ni redesplegar este Apps Script.
//
// CÓMO DESPLEGARLO (primera vez):
//   1. Crea un Google Sheet NUEVO y vacío (el nombre da igual, p.ej. "Menús Especiales - RG").
//   2. Extensiones > Apps Script.
//   3. Borra el contenido de Código.gs que trae por defecto y pega TODO el contenido de este
//      archivo.
//   4. Implementar > Nueva implementación > tipo "Aplicación web".
//        - Ejecutar como: Yo (tu cuenta).
//        - Quién tiene acceso: Cualquier usuario.
//   5. Autoriza los permisos que pida Google la primera vez.
//   6. Copia la URL /exec que te da al terminar — esa es la que hay que pegar en el
//      frontend (config.js de Web_Editor_Pro_v3) para que la pestaña de Menú Especial pueda
//      guardar y leer datos. Pásamela en cuanto la tengas.
//   7. Para cambios futuros SOLO de este archivo (no hace falta si algún día tocamos el
//      frontend nada más): Implementar > Gestionar implementaciones > icono de lápiz sobre
//      la implementación existente > Versión: Nueva versión > Implementar. Así la URL /exec
//      NO cambia. Solo hace falta una implementación nueva (con URL nueva) si en algún
//      momento borras y vuelves a crear la implementación desde cero.
// =============================================================================================

var NOMBRE_HOJA_MENUS = "MenusEspeciales";
// NUEVO (19 sept): "Mis Platos" — biblioteca propia de platos añadidos a mano en algún menú
// especial (no forman parte de la carta real de RG/US Open), guardados para poder reutilizarlos
// en menús futuros sin tener que volver a escribirlos ni a traducirlos. Hoja/backend
// COMPLETAMENTE INDEPENDIENTE de la de menús (ver diseño deliberado al principio del archivo):
// el frontend decide cuándo guardar aquí (al añadir un plato manual a un menú, ver
// menu-especial.js > agregarPlatoManual), este script solo guarda/lista/borra filas sueltas
// {ES, EN, Tipo}, sin más lógica.
var NOMBRE_HOJA_PLATOS_MANUALES = "PlatosManuales";

// -----------------------------------------------------------------------------------------
// Devuelve (y crea si no existe) la hoja de menús especiales, con su cabecera fija. Se llama
// sola la primera vez que hace falta — no requiere ningún paso manual en Sheets aparte de la
// creación inicial de la spreadsheet (paso 1 de las instrucciones de arriba).
// -----------------------------------------------------------------------------------------
function obtenerHojaMenus(ss) {
  var hoja = ss.getSheetByName(NOMBRE_HOJA_MENUS);
  if (!hoja) {
    hoja = ss.insertSheet(NOMBRE_HOJA_MENUS);
    hoja.getRange(1, 1, 1, 5).setValues([["ID", "Nombre", "Config_JSON", "Fecha_Creacion", "Fecha_Modificacion"]]);
  }
  return hoja;
}

// Igual que obtenerHojaMenus() pero para "Mis Platos" -- se crea sola la primera vez que hace
// falta (p.ej. la primera vez que se añade un plato manual en cualquier menú), sin ningún paso
// manual en Sheets.
function obtenerHojaPlatosManuales(ss) {
  var hoja = ss.getSheetByName(NOMBRE_HOJA_PLATOS_MANUALES);
  if (!hoja) {
    hoja = ss.insertSheet(NOMBRE_HOJA_PLATOS_MANUALES);
    hoja.getRange(1, 1, 1, 5).setValues([["ID", "ES", "EN", "Tipo", "Fecha_Creacion"]]);
  }
  return hoja;
}

// Normaliza un nombre para comparar sin distinguir mayúsculas/acentos ni espacios de más --
// misma lógica que normalizarNombre() del frontend (menu-especial.js), reimplementada aquí
// porque este script de Apps Script no comparte código con el frontend.
function normalizarNombrePlatoManual(txt) {
  return (txt || "").toString().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ").trim();
}

function doGet(e) {
  var accion = e && e.parameter && e.parameter.accion;
  // GET ?accion=listarPlatosManuales — devuelve la biblioteca de "Mis Platos" (ver arriba).
  if (accion === 'listarPlatosManuales') return listarPlatosManuales();
  // GET ?accion=listarMenus — devuelve TODOS los menús guardados, en JSON (no CSV: el campo
  // Config_JSON de cada uno ya es un objeto anidado, más cómodo en JSON que en columnas CSV).
  // Sin parámetro "accion" reconocido, se hace lo mismo por defecto (es la acción "principal"
  // de este backend), para que un simple fetch a la URL /exec sin más también funcione.
  return listarMenus();
}

function listarMenus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = obtenerHojaMenus(ss);
  var ultimaFila = hoja.getLastRow();

  var menus = [];
  if (ultimaFila >= 2) {
    var filas = hoja.getRange(2, 1, ultimaFila - 1, 5).getValues();
    filas.forEach(function(fila) {
      var id = String(fila[0] || "").trim();
      if (!id) return; // fila vacía (huecos tras un borrado) — se ignora
      var config = {};
      try {
        config = fila[2] ? JSON.parse(fila[2]) : {};
      } catch (err) {
        config = {}; // JSON corrupto/manual mal editado: se devuelve vacío en vez de romper la lista entera
      }
      menus.push({
        id: id,
        nombre: fila[1] || "",
        config: config,
        fechaCreacion: fila[3] ? String(fila[3]) : "",
        fechaModificacion: fila[4] ? String(fila[4]) : ""
      });
    });
  }

  // Los más recientes primero (por fecha de modificación), para que la lista del editor no
  // obligue a buscar el menú que se acaba de guardar al final.
  menus.sort(function(a, b) { return (b.fechaModificacion || "").localeCompare(a.fechaModificacion || ""); });

  return ContentService.createTextOutput(JSON.stringify({ ok: true, menus: menus })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var accion = e && e.parameter && e.parameter.accion;
  if (accion === 'eliminarMenu') return eliminarMenu(e);
  if (accion === 'guardarPlatoManual') return guardarPlatoManual(e);
  if (accion === 'eliminarPlatoManual') return eliminarPlatoManual(e);
  // 'guardarMenu' (crear o actualizar) es la acción por defecto si no se reconoce otra — así
  // un POST sin parámetro "accion" (p.ej. si algún día se simplifica el frontend) también
  // guarda, en vez de fallar en silencio.
  return guardarMenu(e);
}

// POST ?accion=guardarMenu — body JSON: { "id": "..." (opcional, vacío = nuevo menú),
// "nombre": "Boda García 20 sept", "config": { ...lo que decida el frontend... } }
// Si "id" viene vacío/ausente, se genera uno nuevo (UUID) y se añade una fila; si "id" viene
// y existe, se actualiza esa fila (nombre + config + fecha de modificación), conservando su
// fecha de creación original.
function guardarMenu(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Servidor ocupado (bloqueo), reintenta en unos segundos." })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var datos = JSON.parse(e.postData.contents);
    var nombre = String(datos.nombre || "").trim();
    if (!nombre) return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Falta el nombre del menú." })).setMimeType(ContentService.MimeType.JSON);

    // El config se guarda tal cual llega, como texto JSON — este script no valida ni conoce
    // su estructura interna (ver nota de diseño al principio del archivo).
    var configTexto = JSON.stringify(datos.config || {});

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = obtenerHojaMenus(ss);
    var ahora = new Date().toISOString();

    var idEntrante = String(datos.id || "").trim();
    var filaEncontrada = -1;
    var fechaCreacionExistente = "";

    if (idEntrante) {
      var ultimaFila = hoja.getLastRow();
      if (ultimaFila >= 2) {
        var idsActuales = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
        for (var i = 0; i < idsActuales.length; i++) {
          if (String(idsActuales[i][0]).trim() === idEntrante) {
            filaEncontrada = i + 2; // +2: getValues() es 0-index y la hoja empieza en la fila 2
            break;
          }
        }
      }
    }

    if (filaEncontrada !== -1) {
      // Actualiza un menú existente: conserva su Fecha_Creacion original (columna 4).
      fechaCreacionExistente = hoja.getRange(filaEncontrada, 4).getValue();
      hoja.getRange(filaEncontrada, 2, 1, 4).setValues([[nombre, configTexto, fechaCreacionExistente, ahora]]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, id: idEntrante, creado: false })).setMimeType(ContentService.MimeType.JSON);
    }

    // Menú nuevo: genera un ID propio (UUID), completamente ajeno al espacio de IDs de
    // platos de RG/US Open — nunca puede colisionar con un plato real.
    var idNuevo = Utilities.getUuid();
    hoja.appendRow([idNuevo, nombre, configTexto, ahora, ahora]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, id: idNuevo, creado: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// POST ?accion=eliminarMenu — body JSON: { "id": "..." }. Borra esa fila por completo.
function eliminarMenu(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Servidor ocupado (bloqueo), reintenta en unos segundos." })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var datos = JSON.parse(e.postData.contents);
    var id = String(datos.id || "").trim();
    if (!id) return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Falta el id del menú a eliminar." })).setMimeType(ContentService.MimeType.JSON);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = obtenerHojaMenus(ss);
    var ultimaFila = hoja.getLastRow();

    if (ultimaFila >= 2) {
      var idsActuales = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
      for (var i = 0; i < idsActuales.length; i++) {
        if (String(idsActuales[i][0]).trim() === id) {
          hoja.deleteRow(i + 2); // +2: 0-index y la hoja empieza en la fila 2
          return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "No se encontró ningún menú con ese id." })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// =============================================================================================
// "MIS PLATOS" — biblioteca de platos añadidos a mano (ver nota junto a NOMBRE_HOJA_PLATOS_MANUALES
// al principio del archivo). 3 acciones, mismo patrón que las de menús de arriba.
// =============================================================================================

// GET ?accion=listarPlatosManuales — devuelve TODOS los platos guardados en "Mis Platos", en JSON.
function listarPlatosManuales() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = obtenerHojaPlatosManuales(ss);
  var ultimaFila = hoja.getLastRow();

  var platos = [];
  if (ultimaFila >= 2) {
    var filas = hoja.getRange(2, 1, ultimaFila - 1, 5).getValues();
    filas.forEach(function(fila) {
      // "" o null en la columna ID = fila vacía (hueco tras un borrado) -- se ignora, igual que
      // hace listarMenus() con su columna ID.
      if (fila[0] === "" || fila[0] === null || fila[0] === undefined) return;
      platos.push({
        id: Number(fila[0]),
        es: String(fila[1] || ""),
        en: String(fila[2] || ""),
        tipo: (String(fila[3] || "") === "postre") ? "postre" : "principal"
      });
    });
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, platos: platos })).setMimeType(ContentService.MimeType.JSON);
}

// POST ?accion=guardarPlatoManual — body JSON: { "es": "...", "en": "..." (opcional), "tipo":
// "principal"|"postre" }. Si ya existe un plato con el mismo nombre en español (comparado en
// minúsculas y sin acentos, para no duplicar por una simple diferencia de mayúsculas), se
// actualiza esa fila (inglés + tipo) en vez de crear una nueva; si no, añade una fila con un ID
// propio autoincremental (independiente del espacio de IDs de las cartas de RG/US Open, que
// nunca vive en esta hoja).
function guardarPlatoManual(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Servidor ocupado (bloqueo), reintenta en unos segundos." })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var datos = JSON.parse(e.postData.contents);
    var es = String(datos.es || "").trim();
    if (!es) return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Falta el nombre del plato." })).setMimeType(ContentService.MimeType.JSON);
    var en = String(datos.en || "").trim();
    var tipo = (String(datos.tipo || "") === "postre") ? "postre" : "principal";

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = obtenerHojaPlatosManuales(ss);
    var ultimaFila = hoja.getLastRow();
    var esNormalizado = normalizarNombrePlatoManual(es);

    if (ultimaFila >= 2) {
      var filas = hoja.getRange(2, 1, ultimaFila - 1, 5).getValues();
      for (var i = 0; i < filas.length; i++) {
        if (normalizarNombrePlatoManual(filas[i][1]) === esNormalizado) {
          // Ya existe (mismo nombre): actualiza inglés y tipo, conserva ID y fecha de creación
          // originales -- así no se duplica cada vez que se vuelve a añadir el mismo plato.
          hoja.getRange(i + 2, 3, 1, 2).setValues([[en, tipo]]);
          return ContentService.createTextOutput(JSON.stringify({ ok: true, id: Number(filas[i][0]), creado: false })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Nuevo: ID autoincremental propio de esta hoja (1, 2, 3...), nunca coincide con un ID real
    // de plato de RG/US Open porque ni siquiera vive en el mismo espacio de datos.
    var idsActuales = (ultimaFila >= 2)
      ? hoja.getRange(2, 1, ultimaFila - 1, 1).getValues().map(function(f) { return Number(f[0]) || 0; })
      : [];
    var idNuevo = idsActuales.length ? Math.max.apply(null, idsActuales) + 1 : 1;
    hoja.appendRow([idNuevo, es, en, tipo, new Date().toISOString()]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, id: idNuevo, creado: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// POST ?accion=eliminarPlatoManual — body JSON: { "id": 3 }. Borra esa fila de "Mis Platos" (solo
// esta lista propia -- nunca toca ni afecta a las cartas reales de RG/US Open).
function eliminarPlatoManual(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Servidor ocupado (bloqueo), reintenta en unos segundos." })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var datos = JSON.parse(e.postData.contents);
    var id = Number(datos.id);
    if (!id) return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "Falta el id del plato a eliminar." })).setMimeType(ContentService.MimeType.JSON);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = obtenerHojaPlatosManuales(ss);
    var ultimaFila = hoja.getLastRow();

    if (ultimaFila >= 2) {
      var idsActuales = hoja.getRange(2, 1, ultimaFila - 1, 1).getValues();
      for (var i = 0; i < idsActuales.length; i++) {
        if (Number(idsActuales[i][0]) === id) {
          hoja.deleteRow(i + 2); // +2: 0-index y la hoja empieza en la fila 2
          return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "No se encontró ningún plato con ese id." })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}