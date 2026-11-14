/**
 * Panel de Cauce Studio — analítica propia de la web.
 * Guarda las visitas en una Hoja de cálculo tuya y sirve el panel solo para ti.
 * Instalación: ver INSTALAR.md
 */

var CFG = {
  nombre: 'Cauce Studio',
  web: 'https://miiguelcamus.github.io/cauce-web/',
  avisoLead: true          // email a ti cuando llega una solicitud
};

var EV_COLS  = ['ts','fecha','sid','tipo','pagina','origen','dispositivo','ancho','valor','extra'];
var LEAD_COLS = ['ts','fecha','nombre','contacto','negocio','interes','mensaje','origen','estado'];

// ---------- hoja ----------
function props(){ return PropertiesService.getScriptProperties(); }

function libro() {
  var id = props().getProperty('SS_ID'), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create('Cauce · Analítica web');
    props().setProperty('SS_ID', ss.getId());
    hoja_(ss, 'Eventos', EV_COLS);
    hoja_(ss, 'Solicitudes', LEAD_COLS);
    var d = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
    if (d) ss.deleteSheet(d);
  }
  return ss;
}

function hoja_(ss, nombre, cols) {
  var h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

function hoja(nombre) {
  var cols = nombre === 'Eventos' ? EV_COLS : LEAD_COLS;
  return hoja_(libro(), nombre, cols);
}

function instalar() {
  var ss = libro();
  hoja('Eventos'); hoja('Solicitudes');
  return 'Listo. Hoja de datos: ' + ss.getUrl();
}

// ---------- entrada web ----------
function doPost(e) {
  var out = { ok: false };
  try {
    var b = JSON.parse(e.postData.contents || '{}');
    if (b.api === 'ev') out = registra(b);
  } catch (err) { out = { ok: false, error: String(err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.api === 'ev') { return ContentService.createTextOutput(JSON.stringify(registra(p))).setMimeType(ContentService.MimeType.JSON); }
  if (p.api === 'datos') {
    if (!esPropietario()) return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'no autorizado' })).setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify(panelDatos(+p.dias || 30))).setMimeType(ContentService.MimeType.JSON);
  }
  if (!esPropietario()) return HtmlService.createHtmlOutput('<p style="font:16px system-ui;padding:40px">Panel privado.</p>');
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Panel · Cauce Studio')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function esPropietario() {
  try {
    var a = Session.getActiveUser().getEmail(), b = Session.getEffectiveUser().getEmail();
    return !!a && a === b;
  } catch (e) { return false; }
}

function soloPropietario() { if (!esPropietario()) throw new Error('Solo el propietario.'); }

// ---------- registro ----------
function registra(b) {
  var tipo = String(b.t || '').slice(0, 20);
  if (!tipo) return { ok: false };
  var tz = Session.getScriptTimeZone(), ahora = new Date();
  if (tipo === 'lead') return guardaLead(b, ahora, tz);

  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (e) { return { ok: false }; }
  try {
    hoja('Eventos').appendRow([
      ahora, Utilities.formatDate(ahora, tz, 'yyyy-MM-dd'),
      String(b.sid || '').slice(0, 30), tipo,
      String(b.pg || '').slice(0, 40), String(b.src || '').slice(0, 40),
      String(b.dev || '').slice(0, 12), +b.w || 0,
      b.v !== undefined ? b.v : (b.seg !== undefined ? b.seg : ''),
      String(b.q || b.ref || '').slice(0, 120)
    ]);
  } finally { lock.releaseLock(); }
  return { ok: true };
}

function guardaLead(b, ahora, tz) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (e) { return { ok: false }; }
  try {
    hoja('Solicitudes').appendRow([
      ahora, Utilities.formatDate(ahora, tz, 'yyyy-MM-dd HH:mm'),
      String(b.n || '').slice(0, 80), String(b.c || '').slice(0, 80),
      String(b.b || '').slice(0, 120), String(b.s || '').slice(0, 40),
      String(b.m || '').slice(0, 900), String(b.src || '').slice(0, 40), 'nueva'
    ]);
  } finally { lock.releaseLock(); }

  if (CFG.avisoLead) {
    try {
      var to = Session.getEffectiveUser().getEmail();
      var tel = String(b.c || '').replace(/\D/g, '');
      var wa = tel.length >= 9 ? '<p><a href="https://wa.me/34' + tel.slice(-9) + '" style="background:#25d366;color:#fff;padding:11px 18px;border-radius:9px;text-decoration:none;font-weight:600">Responder por WhatsApp</a></p>' : '';
      MailApp.sendEmail({
        to: to, subject: '🟢 Nueva solicitud en la web: ' + (b.b || b.n || ''),
        htmlBody: '<div style="font:15px/1.6 system-ui;max-width:520px">' +
          '<h2 style="font-size:19px;margin:0 0 14px">Nueva solicitud</h2>' +
          '<p><b>Nombre:</b> ' + esc(b.n) + '<br><b>Contacto:</b> ' + esc(b.c) +
          '<br><b>Negocio:</b> ' + esc(b.b) + '<br><b>Le interesa:</b> ' + esc(b.s) +
          '<br><b>Llegó desde:</b> ' + esc(b.src) + '</p>' +
          (b.m ? '<p style="background:#f4f6f8;padding:12px 15px;border-radius:9px">' + esc(b.m) + '</p>' : '') +
          wa + '</div>'
      });
    } catch (e) {}
  }
  return { ok: true };
}

function esc(s) { return String(s == null ? '' : s).replace(/[<>&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]; }); }

// ---------- lectura ----------
function leer(nombre, cols) {
  var h = hoja(nombre), n = h.getLastRow() - 1;
  if (n < 1) return [];
  var v = h.getRange(2, 1, n, cols.length).getValues();
  return v.map(function (f) { var o = {}; cols.forEach(function (c, i) { o[c] = f[i]; }); return o; });
}

function panelDatos(dias) {
  soloPropietario();
  dias = dias || 30;
  var tz = Session.getScriptTimeZone();
  var hoy = new Date(); hoy.setHours(23, 59, 59, 999);
  var desde = new Date(hoy); desde.setDate(hoy.getDate() - dias + 1); desde.setHours(0, 0, 0, 0);
  var antes = new Date(desde); antes.setDate(desde.getDate() - dias);

  var ev = leer('Eventos', EV_COLS).filter(function (r) { return r.ts instanceof Date; });
  var leads = leer('Solicitudes', LEAD_COLS).filter(function (r) { return r.ts instanceof Date; });

  var dentro = ev.filter(function (r) { return r.ts >= desde; });
  var previo = ev.filter(function (r) { return r.ts >= antes && r.ts < desde; });
  var leadsIn = leads.filter(function (r) { return r.ts >= desde; });
  var leadsPrev = leads.filter(function (r) { return r.ts >= antes && r.ts < desde; });

  function unicos(l) { var s = {}; l.forEach(function (r) { if (r.sid) s[r.sid] = 1; }); return Object.keys(s).length; }
  function cuenta(l, campo, filtro) {
    var m = {};
    l.forEach(function (r) { if (filtro && !filtro(r)) return; var k = String(r[campo] || '—'); if (!k || k === '—') return; m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { k: k, v: m[k] }; }).sort(function (a, b) { return b.v - a.v; });
  }

  var vistas = dentro.filter(function (r) { return r.tipo === 'vista'; });
  var vistasPrev = previo.filter(function (r) { return r.tipo === 'vista'; });

  // serie por día
  var serie = [], mapa = {};
  vistas.forEach(function (r) { var d = Utilities.formatDate(r.ts, tz, 'yyyy-MM-dd'); mapa[d] = mapa[d] || {}; mapa[d][r.sid] = 1; });
  var leadDia = {};
  leadsIn.forEach(function (r) { var d = Utilities.formatDate(r.ts, tz, 'yyyy-MM-dd'); leadDia[d] = (leadDia[d] || 0) + 1; });
  for (var i = 0; i < dias; i++) {
    var d = new Date(desde); d.setDate(desde.getDate() + i);
    var k = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    serie.push({ d: k, et: Utilities.formatDate(d, tz, 'd MMM'), v: mapa[k] ? Object.keys(mapa[k]).length : 0, l: leadDia[k] || 0 });
  }

  // embudo
  var sesVista = {}, sesPrecios = {}, sesCta = {}, sesWa = {};
  dentro.forEach(function (r) {
    if (!r.sid) return;
    if (r.tipo === 'vista') sesVista[r.sid] = 1;
    if (r.tipo === 'hito' && String(r.extra).indexOf('ve_precios') === 0) sesPrecios[r.sid] = 1;
    if (r.tipo === 'clic' && String(r.extra).indexOf('cta_') === 0) sesCta[r.sid] = 1;
    if (r.tipo === 'clic' && String(r.extra) === 'whatsapp') sesWa[r.sid] = 1;
  });

  // tiempo y scroll
  var sal = dentro.filter(function (r) { return r.tipo === 'salida'; });
  var seg = sal.map(function (r) { return +r.valor || 0; }).filter(function (x) { return x > 0 && x < 3600; });
  var prof = sal.map(function (r) { return +String(r.extra).replace(/\D/g, '') || 0; });
  var scr = dentro.filter(function (r) { return r.tipo === 'scroll'; });
  var llegan = {};
  scr.forEach(function (r) { var v = +r.valor || 0; if (!llegan[v] || true) llegan[v] = (llegan[v] || 0) + 1; });
  function media(a) { return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length) : 0; }

  var uni = unicos(vistas), uniPrev = unicos(vistasPrev);
  return {
    ok: true, dias: dias, web: CFG.web,
    hoja: libro().getUrl(),
    kpi: {
      visitantes: uni, visitantesPrev: uniPrev,
      visitas: vistas.length, visitasPrev: vistasPrev.length,
      solicitudes: leadsIn.length, solicitudesPrev: leadsPrev.length,
      conversion: uni ? Math.round(leadsIn.length / uni * 1000) / 10 : 0,
      conversionPrev: uniPrev ? Math.round(leadsPrev.length / uniPrev * 1000) / 10 : 0,
      segMedio: media(seg), scrollMedio: media(prof.filter(function (x) { return x > 0; }))
    },
    serie: serie,
    origenes: cuenta(vistas, 'origen'),
    dispositivos: cuenta(vistas, 'dispositivo'),
    paginas: cuenta(vistas, 'pagina'),
    clics: cuenta(dentro, 'extra', function (r) { return r.tipo === 'clic'; }).slice(0, 12),
    embudo: [
      { k: 'Entran en la web', v: Object.keys(sesVista).length },
      { k: 'Llegan a precios', v: Object.keys(sesPrecios).length },
      { k: 'Pulsan un botón', v: Object.keys(sesCta).length + Object.keys(sesWa).length },
      { k: 'Dejan sus datos', v: leadsIn.length }
    ],
    scroll: [25, 50, 75, 100].map(function (m) { return { k: m + '%', v: llegan[m] || 0 }; }),
    solicitudes: leads.slice(-40).reverse().map(function (r) {
      return { f: r.fecha, n: r.nombre, c: r.contacto, b: r.negocio, s: r.interes, m: r.mensaje, src: r.origen, e: r.estado };
    })
  };
}

// acciones del panel
function marcarSolicitud(fila, estado) {
  soloPropietario();
  var h = hoja('Solicitudes'), n = h.getLastRow() - 1;
  if (n < 1) return false;
  var vals = h.getRange(2, 2, n, 1).getValues();
  for (var i = n - 1; i >= 0; i--) {
    if (String(vals[i][0]) === String(fila)) { h.getRange(i + 2, LEAD_COLS.length).setValue(estado); return true; }
  }
  return false;
}

function borrarPruebas() {
  soloPropietario();
  var h = hoja('Eventos'), n = h.getLastRow() - 1;
  if (n > 0) h.getRange(2, 1, n, EV_COLS.length).clearContent();
  return true;
}
