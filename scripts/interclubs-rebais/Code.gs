/* Interclubs Rebais, 8 novembre 2026. Aucune donnée personnelle dans les logs.
 * Déployer en application Web exécutée par le propriétaire, accès « Tous ».
 * L'URL reste côté serveur Vercel, protégée par REBAIS_SHARED_SECRET.
 * Voir ACTIVATION.md avant le déploiement. Ne pas modifier l'ordre des colonnes.
 */
var REBAIS = {
  sheet: 'Inscriptions',
  closing: Date.parse('2026-11-01T23:00:00Z'),
  grades: ['Kangourou 1', 'Kangourou 2', 'Kangourou 3', 'Gant bleu', 'Gant vert', 'Gant rouge', 'Gant blanc', 'Gant jaune', 'Gant d’argent'],
  organisers: 'cedricsenez@gmail.com,sbfrebais77@gmail.com',
  sender: 'Interclubs de Rebais • SBF Rebais 77 / CDSBF77',
  replyTo: 'sbfrebais77@gmail.com',
  headers: ['Identifiant de demande', 'Empreinte de demande', 'Référence', 'Inscription reçue le', 'Nom', 'Prénom', 'Date de naissance', 'Sexe', 'Poids (kg)', 'Grade', 'Club', 'Numéro de licence', 'Adresse email', 'Email participant', 'Email participant envoyé le', 'Tentatives participant', 'Prochaine tentative participant', 'Email organisateurs', 'Email organisateurs envoyé le', 'Tentatives organisateurs', 'Prochaine tentative organisateurs', 'Suivi technique']
};
var RC = { id: 0, hash: 1, ref: 2, received: 3, nom: 4, prenom: 5, naissance: 6, sexe: 7, poids: 8, grade: 9, club: 10, licence: 11, email: 12, pState: 13, pSent: 14, pTries: 15, pNext: 16, oState: 17, oSent: 18, oTries: 19, oNext: 20, note: 21 };

/** Exécuter une fois, puis seulement pour réparer la mise en forme ou le déclencheur. */
function initialiser() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('Initialisation occupée. Réessayez.');
  try {
    var properties = PropertiesService.getScriptProperties();
    var secret = properties.getProperty('REBAIS_SHARED_SECRET');
    if (!secret || secret.length < 32) throw new Error('Configurer REBAIS_SHARED_SECRET avec au moins 32 caractères aléatoires.');
    var id = properties.getProperty('REBAIS_SPREADSHEET_ID');
    var book = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create('Interclubs de Rebais — inscriptions — 8 novembre 2026');
    if (!id) properties.setProperty('REBAIS_SPREADSHEET_ID', book.getId());
    book.setSpreadsheetTimeZone('Europe/Paris').setSpreadsheetLocale('fr_FR');
    var sheet = book.getSheetByName(REBAIS.sheet) || book.insertSheet(REBAIS.sheet);
    if (sheet.getLastRow() > 0 && !headersMatch_(sheet)) throw new Error('Les colonnes existantes ne correspondent pas. Conserver les données et vérifier le guide.');
    sheet.getRange(1, 1, 1, REBAIS.headers.length).setValues([REBAIS.headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, REBAIS.headers.length).setBackground('#11244a').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
    sheet.setRowHeight(1, 42);
    sheet.setColumnWidths(1, REBAIS.headers.length, 165);
    sheet.setColumnWidth(RC.email + 1, 260);
    sheet.setColumnWidth(RC.club + 1, 240);
    var rows = Math.max(sheet.getMaxRows() - 1, 1);
    formatRows_(sheet, 2, rows);
    if (!sheet.getFilter()) sheet.getRange(1, 1, sheet.getMaxRows(), REBAIS.headers.length).createFilter();
    if (!sheet.getBandings().length) sheet.getRange(1, 1, sheet.getMaxRows(), REBAIS.headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    sheet.hideColumns(1, 2);
    SpreadsheetApp.flush();
    var exists = ScriptApp.getProjectTriggers().some(function (trigger) { return trigger.getHandlerFunction() === 'relancerEmails'; });
    if (!exists) ScriptApp.newTrigger('relancerEmails').timeBased().everyMinutes(5).create();
    // No sharing API is used: a newly created spreadsheet remains private.
    return { spreadsheetId: book.getId(), url: book.getUrl(), configured: true };
  } finally { lock.releaseLock(); }
}

function doGet() { return json_({ ok: false, code: 'INVALID', message: 'Requête non disponible.' }); }

function doPost(event) {
  var lock;
  try {
    var raw = event && event.postData && event.postData.contents;
    if (typeof raw !== 'string' || raw.length > 16000 || Number(event.contentLength || 0) > 16000) return error_('INVALID');
    var input;
    try { input = JSON.parse(raw); } catch (ignored) { return error_('INVALID'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return error_('INVALID');
    var properties = PropertiesService.getScriptProperties();
    var secret = properties.getProperty('REBAIS_SHARED_SECRET');
    var bookId = properties.getProperty('REBAIS_SPREADSHEET_ID');
    if (!secret || secret.length < 32 || !bookId) return error_('UNAVAILABLE');
    if (!equalSecret_(input.secret, secret)) return error_('INVALID');
    var data = validate_(input);
    if (!data) return error_('INVALID');
    var hash = digest_(JSON.stringify(data));
    lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) return error_('BUSY');
    var sheet = SpreadsheetApp.openById(bookId).getSheetByName(REBAIS.sheet);
    if (!sheet || !headersMatch_(sheet)) return error_('UNAVAILABLE');
    var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, REBAIS.headers.length).getValues() : [];
    var replay = rows.findIndex(function (row) { return row[RC.id] === input.requestId; });
    if (replay >= 0) {
      if (rows[replay][RC.hash] !== hash) return error_('CONFLICT');
      // A retry can recover its receipt after the deadline. It sends no new email.
      return success_(rows[replay]);
    }
    var duplicate = rows.findIndex(function (row) { return cellText_(row[RC.licence]) === data.licence; });
    if (duplicate >= 0) {
      if (rows[duplicate][RC.hash] === hash) return success_(rows[duplicate]);
      return error_('DUPLICATE');
    }
    if (Date.now() >= REBAIS.closing) return error_('CLOSED');
    if (!allowIp_(input.ipHash)) return error_('RATE_LIMIT');
    var row = Array(REBAIS.headers.length).fill('');
    row[RC.id] = input.requestId;
    row[RC.hash] = hash;
    row[RC.ref] = 'REB-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
    row[RC.received] = new Date();
    row[RC.nom] = safeCell_(data.nom);
    row[RC.prenom] = safeCell_(data.prenom);
    row[RC.naissance] = new Date(data.naissance + 'T12:00:00Z');
    row[RC.sexe] = data.sexe;
    row[RC.poids] = data.poids;
    row[RC.grade] = data.grade;
    row[RC.club] = safeCell_(data.club);
    row[RC.licence] = safeCell_(data.licence);
    row[RC.email] = safeCell_(data.email);
    row[RC.pState] = 'pending'; row[RC.pTries] = 0;
    row[RC.oState] = 'pending'; row[RC.oTries] = 0;
    var rowNumber = sheet.getLastRow() + 1;
    if (rowNumber > sheet.getMaxRows()) {
      var previousMax = sheet.getMaxRows();
      sheet.insertRowsAfter(previousMax, 100);
      formatRows_(sheet, previousMax + 1, 100);
      // Extend display tools without replacing or deleting any records.
      if (sheet.getFilter()) sheet.getFilter().remove();
      sheet.getRange(1, 1, sheet.getMaxRows(), REBAIS.headers.length).createFilter();
      sheet.getBandings().forEach(function (banding) { banding.setRange(sheet.getRange(1, 1, sheet.getMaxRows(), REBAIS.headers.length)); });
    }
    sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
    // This flush must succeed before any mail or success response is attempted.
    SpreadsheetApp.flush();
    try {
      sendOne_(sheet, rowNumber, row, 'participant');
      sendOne_(sheet, rowNumber, row, 'organisers');
    } catch (ignored) {
      // Registration is durable; mail failures never turn it into a failure.
      return json_({ ok: true, reference: row[RC.ref], emailStatus: 'pending' });
    }
    return success_(row);
  } catch (ignored) {
    return error_('UNAVAILABLE');
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}

/** Reprend les messages en attente. Toutes les confirmations passent en premier. */
function relancerEmails() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var id = PropertiesService.getScriptProperties().getProperty('REBAIS_SPREADSHEET_ID');
    if (!id) return;
    var sheet = SpreadsheetApp.openById(id).getSheetByName(REBAIS.sheet);
    if (!sheet || !headersMatch_(sheet) || sheet.getLastRow() < 2) return;
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, REBAIS.headers.length).getValues();
    var deadline = Date.now() + 20000;
    ['participant', 'organisers'].forEach(function (kind) {
      for (var i = 0; i < rows.length && Date.now() < deadline; i++) {
        if (MailApp.getRemainingDailyQuota() < (kind === 'participant' ? 1 : 2)) break;
        sendOne_(sheet, i + 2, rows[i], kind);
      }
    });
  } catch (ignored) {
    // No exception details: Google errors may contain addresses or cell values.
  } finally { lock.releaseLock(); }
}

function sendOne_(sheet, rowNumber, row, kind) {
  var participant = kind === 'participant';
  var state = participant ? RC.pState : RC.oState;
  var sent = participant ? RC.pSent : RC.oSent;
  var tries = participant ? RC.pTries : RC.oTries;
  var next = participant ? RC.pNext : RC.oNext;
  if (row[state] === 'sent' || (row[next] && new Date(row[next]).getTime() > Date.now())) return;
  var quota = MailApp.getRemainingDailyQuota();
  if (quota < (participant ? 1 : 2)) return;
  row[tries] = Number(row[tries] || 0) + 1;
  try {
    MailApp.sendEmail(message_(row, participant));
  } catch (ignored) {
    row[next] = new Date(Date.now() + Math.min(6 * 60 * 60 * 1000, 5 * 60 * 1000 * Math.pow(2, Math.min(row[tries] - 1, 7))));
    row[RC.note] = 'Envoi différé ; reprise automatique.';
    persistMail_(sheet, rowNumber, row);
    return;
  }
  row[state] = 'sent';
  row[sent] = new Date();
  row[next] = '';
  row[RC.note] = row[RC.pState] === 'sent' && row[RC.oState] === 'sent' ? '' : 'Un message reste en attente.';
  // Persist each successful delivery separately before proceeding to the other.
  persistMail_(sheet, rowNumber, row);
}

function persistMail_(sheet, rowNumber, row) {
  sheet.getRange(rowNumber, RC.pState + 1, 1, REBAIS.headers.length - RC.pState).setValues([row.slice(RC.pState)]);
  SpreadsheetApp.flush();
}

function message_(row, participant) {
  var ref = String(row[RC.ref]);
  var name = cellText_(row[RC.prenom]) + ' ' + cellText_(row[RC.nom]);
  var fields = [
    ['Référence', ref], ['Nom', cellText_(row[RC.nom])], ['Prénom', cellText_(row[RC.prenom])],
    ['Date de naissance', Utilities.formatDate(new Date(row[RC.naissance]), 'Europe/Paris', 'dd/MM/yyyy')],
    ['Sexe', row[RC.sexe] === 'F' ? 'Féminin' : 'Masculin'], ['Poids', String(row[RC.poids]).replace('.', ',') + ' kg'],
    ['Grade', row[RC.grade]], ['Club', cellText_(row[RC.club])], ['Numéro de licence', cellText_(row[RC.licence])], ['Email', cellText_(row[RC.email])]
  ];
  var intro = participant ? 'L’inscription de ' + name + ' à l’interclubs de Rebais est confirmée.' : 'Une nouvelle inscription à l’interclubs de Rebais a été enregistrée.';
  var practical = 'Dimanche 8 novembre 2026 · Gymnase du collège de Rebais\nRue Gaspard Monge · 77510 Rebais\nAssauts uniquement · Enfants, adultes et vétérans · Participation gratuite\nHoraires à venir.';
  var closing = 'Pour corriger ou annuler cette inscription, répondez à ce message en indiquant votre référence. Ne refaites pas de formulaire.';
  var body = intro + '\n\n' + practical + '\n\n' + fields.map(function (field) { return field[0] + ' : ' + field[1]; }).join('\n') + '\n\n' + closing + '\n\nSBF Rebais 77 • Comité départemental de Seine-et-Marne';
  var htmlRows = fields.map(function (field) { return '<tr><td style="padding:8px 12px;color:#59657a;border-bottom:1px solid #e8edf3">' + escapeHtml_(field[0]) + '</td><td style="padding:8px 12px;border-bottom:1px solid #e8edf3;font-weight:600">' + escapeHtml_(field[1]) + '</td></tr>'; }).join('');
  var html = '<!doctype html><html lang="fr"><body style="margin:0;background:#f1f4f8;color:#152440;font-family:Arial,sans-serif"><div style="max-width:600px;margin:24px auto;background:white;border-radius:16px;overflow:hidden"><div style="padding:32px;background:#11244a;color:white"><p style="margin:0 0 12px;color:#efc567;font-size:12px;letter-spacing:2px">SAVATE BOXE FRANÇAISE</p><h1 style="margin:0;font-size:28px">' + (participant ? 'Inscription confirmée' : 'Nouvelle inscription') + '</h1><p style="margin-bottom:0">Interclubs de Rebais · 8 novembre 2026</p></div><div style="padding:28px"><p>' + escapeHtml_(intro) + '</p><p style="line-height:1.7">' + escapeHtml_(practical).replace(/\n/g, '<br>') + '</p><table style="width:100%;border-collapse:collapse;font-size:14px">' + htmlRows + '</table><p style="line-height:1.6;font-size:14px">' + escapeHtml_(closing) + '</p><p style="font-size:12px;color:#59657a">SBF Rebais 77 • Comité départemental de Seine-et-Marne</p></div></div></body></html>';
  return { to: participant ? cellText_(row[RC.email]) : REBAIS.organisers, subject: (participant ? 'Inscription confirmée' : 'Nouvelle inscription') + ' — Interclubs de Rebais — ' + ref, body: body, htmlBody: html, name: REBAIS.sender, replyTo: REBAIS.replyTo };
}

function validate_(input) {
  if (typeof input.requestId !== 'string' || typeof input.ipHash !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId) || !/^[0-9a-f]{64}$/i.test(input.ipHash)) return null;
  var nom = textField_(input.nom, 80), prenom = textField_(input.prenom, 80), club = textField_(input.club, 150);
  if (!nom || !prenom || !club || typeof input.naissance !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.naissance)) return null;
  var birth = new Date(input.naissance + 'T12:00:00Z');
  var today = Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd');
  if (!isFinite(birth.getTime()) || birth.toISOString().slice(0, 10) !== input.naissance || input.naissance < '1900-01-01' || input.naissance > today) return null;
  if (input.sexe !== 'F' && input.sexe !== 'M') return null;
  if (typeof input.poids !== 'number' && typeof input.poids !== 'string') return null;
  var weightText = String(input.poids).replace(',', '.');
  if (!/^\d{1,3}(\.\d)?$/.test(weightText)) return null;
  var weight = Number(weightText);
  if (weight < 1 || weight > 300 || REBAIS.grades.indexOf(input.grade) < 0) return null;
  var licence = textField_(input.licence, 40);
  if (!licence || !/^[\p{L}\p{N} -]+$/u.test(licence)) return null;
  licence = licence.toUpperCase();
  var email = textField_(input.email, 254);
  if (!email || !/^[^\s@<>(),;:\[\]"\\]+@[^\s@<>(),;:\[\]"\\]+\.[^\s@<>(),;:\[\]"\\]+$/.test(email)) return null;
  return { nom: nom, prenom: prenom, naissance: input.naissance, sexe: input.sexe, poids: weight, grade: input.grade, club: club, licence: licence, email: email.toLowerCase() };
}

function textField_(value, maximum) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return null;
  var text = value.trim().normalize('NFC');
  return text && text.length <= maximum ? text : null;
}
function safeCell_(value) { return /^[=+\-@\t\r]/.test(value) ? "'" + value : value; }
function cellText_(value) { return String(value).replace(/^'(?=[=+\-@\t\r])/, ''); }
function escapeHtml_(value) { return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function digest_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8).map(function (byte) { return ((byte + 256) % 256).toString(16).padStart(2, '0'); }).join(''); }
function equalSecret_(a, b) {
  if (typeof a !== 'string' || a.length > 512) return false;
  var difference = a.length ^ b.length;
  for (var i = 0; i < b.length; i++) difference |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  return difference === 0;
}
function allowIp_(hash) {
  var cache = CacheService.getScriptCache();
  var key = 'rebais:' + hash + ':' + Math.floor(Date.now() / 3600000);
  var count = Number(cache.get(key) || 0);
  if (count >= 20) return false;
  cache.put(key, String(count + 1), 3600);
  return true;
}
function headersMatch_(sheet) {
  return JSON.stringify(sheet.getRange(1, 1, 1, REBAIS.headers.length).getValues()[0]) === JSON.stringify(REBAIS.headers);
}
function formatRows_(sheet, firstRow, count) {
  [RC.id, RC.hash, RC.ref, RC.nom, RC.prenom, RC.sexe, RC.grade, RC.club, RC.licence, RC.email].forEach(function (column) { sheet.getRange(firstRow, column + 1, count, 1).setNumberFormat('@'); });
  [RC.received, RC.pSent, RC.pNext, RC.oSent, RC.oNext].forEach(function (column) { sheet.getRange(firstRow, column + 1, count, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss'); });
  sheet.getRange(firstRow, RC.naissance + 1, count, 1).setNumberFormat('dd/MM/yyyy').setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
  sheet.getRange(firstRow, RC.poids + 1, count, 1).setNumberFormat('0.0').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(1, 300).setAllowInvalid(false).build());
  sheet.getRange(firstRow, RC.sexe + 1, count, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['F', 'M'], true).setAllowInvalid(false).build());
  sheet.getRange(firstRow, RC.grade + 1, count, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(REBAIS.grades, true).setAllowInvalid(false).build());
}
function success_(row) { return json_({ ok: true, reference: row[RC.ref], emailStatus: row[RC.pState] === 'sent' ? 'sent' : 'pending' }); }
function error_(code) {
  var messages = { INVALID: 'Le formulaire ne peut pas être traité. Vérifiez les informations saisies.', CONFLICT: 'Cette demande ne peut pas être traitée. Contactez les organisateurs.', DUPLICATE: 'Cette demande ne peut pas être traitée. Contactez les organisateurs.', CLOSED: 'Les inscriptions sont closes.', RATE_LIMIT: 'Trop de demandes rapprochées. Réessayez plus tard.', BUSY: 'Le service est occupé. Réessayez dans un instant.', UNAVAILABLE: 'Le service est momentanément indisponible. Réessayez.' };
  return json_({ ok: false, code: code, message: messages[code] || messages.UNAVAILABLE });
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
