import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';

const source = readFileSync(new URL('../scripts/interclubs-rebais/Code.gs', import.meta.url), 'utf8');
const secret = 'test-only-secret-which-is-at-least-32-characters';
const nativeDate = Date;

function fixture(options = {}) {
  const state = {
    now: Date.parse('2026-09-27T12:00:00Z'), rows: [], durable: [], events: [],
    properties: { REBAIS_SHARED_SECRET: secret, REBAIS_SPREADSHEET_ID: 'private-test-sheet' },
    quota: 100, failMail: null, flushes: 0, failFlushAt: 0, locked: false,
    maxRows: 1000, triggers: [], created: 0, formats: [], filter: null, bandings: [],
    ...options,
  };
  const cloneRows = (rows) => rows.map((row) => row.slice());
  class TestDate extends nativeDate {
    constructor(...args) { super(...(args.length ? args : [state.now])); }
    static now() { return state.now; }
  }
  const builder = () => {
    const instance = {};
    for (const method of ['requireDate', 'setAllowInvalid', 'requireNumberBetween', 'requireValueInList']) instance[method] = () => instance;
    instance.build = () => ({});
    return instance;
  };
  function range(firstRow, firstColumn, rowCount, columnCount) {
    const instance = {
      getValues: () => Array.from({ length: rowCount }, (_, i) => Array.from({ length: columnCount }, (_, j) => state.rows[firstRow + i - 1]?.[firstColumn + j - 1] ?? '')),
      setValues: (values) => {
        state.events.push({ type: 'write', firstRow, firstColumn });
        for (let i = 0; i < rowCount; i++) {
          state.rows[firstRow + i - 1] ??= [];
          for (let j = 0; j < columnCount; j++) state.rows[firstRow + i - 1][firstColumn + j - 1] = values[i][j];
        }
        return instance;
      },
      setNumberFormat: (format) => { state.formats.push({ firstRow, firstColumn, rowCount, format }); return instance; },
      createFilter: () => { state.filter = { remove: () => { state.filter = null; } }; return state.filter; },
      applyRowBanding: () => { const banding = { setRange: () => banding }; state.bandings.push(banding); return banding; },
    };
    for (const method of ['setDataValidation', 'setBackground', 'setFontColor', 'setFontWeight', 'setWrap']) instance[method] = () => instance;
    return instance;
  }
  const sheet = {
    getLastRow: () => state.rows.length, getMaxRows: () => state.maxRows, getRange: range,
    getFilter: () => state.filter, getBandings: () => state.bandings,
    insertRowsAfter: (_, count) => { state.maxRows += count; },
    setFrozenRows: (value) => { state.frozen = value; },
    setRowHeight() {}, setColumnWidths() {}, setColumnWidth() {}, hideColumns() {},
  };
  const book = {
    getId: () => 'private-test-sheet', getUrl: () => 'https://docs.google.com/spreadsheets/d/private-test-sheet/edit',
    getSheetByName: () => sheet, insertSheet: () => sheet,
    setSpreadsheetTimeZone: () => book, setSpreadsheetLocale: () => book,
  };
  const context = vm.createContext({
    Date: TestDate,
    SpreadsheetApp: {
      openById: () => { state.events.push({ type: 'open' }); return book; },
      create: () => { state.created++; return book; },
      newDataValidation: builder,
      BandingTheme: { LIGHT_GREY: 'grey' },
      flush: () => {
        state.flushes++; state.events.push({ type: 'flush' });
        if (state.flushes === state.failFlushAt) throw new Error('Simulated storage failure with sensitive details');
        state.durable = cloneRows(state.rows);
      },
    },
    LockService: { getScriptLock: () => ({
      tryLock: () => { if (state.locked) return false; state.locked = true; return true; },
      hasLock: () => state.locked,
      releaseLock: () => { state.locked = false; },
    }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => state.properties[key],
      setProperty: (key, value) => { state.properties[key] = value; },
    }) },
    CacheService: { getScriptCache: () => ({
      get: (key) => state.cache?.[key] ?? null,
      put: (key, value) => { (state.cache ??= {})[key] = value; },
    }) },
    ScriptApp: {
      getProjectTriggers: () => state.triggers,
      newTrigger: (name) => {
        const trigger = { timeBased: () => trigger, everyMinutes: (interval) => { state.interval = interval; return trigger; }, create: () => { state.triggers.push({ getHandlerFunction: () => name }); } };
        return trigger;
      },
    },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (text) => ({ setMimeType: () => ({ text }) }) },
    Utilities: {
      getUuid: randomUUID,
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (_, value) => [...createHash('sha256').update(value).digest()],
      formatDate: (date, zone, format) => {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        return format === 'dd/MM/yyyy' ? `${values.day}/${values.month}/${values.year}` : `${values.year}-${values.month}-${values.day}`;
      },
    },
    MailApp: {
      getRemainingDailyQuota: () => state.quota,
      sendEmail: (message) => {
        state.events.push({ type: 'mail', message, durableRows: state.durable.length });
        if (state.failMail?.(message)) throw new Error('Simulated delivery error with sensitive address');
        state.quota -= message.to.split(',').length;
        (state.sent ??= []).push(message);
      },
    },
  });
  vm.runInContext(source, context, { filename: 'Code.gs' });
  if (!options.empty) {
    state.rows = [Array.from(context.REBAIS.headers)];
    state.durable = cloneRows(state.rows);
  }
  const valid = (overrides = {}) => ({
    secret, requestId: randomUUID(), ipHash: 'a'.repeat(64),
    nom: 'Martin', prenom: 'Camille', naissance: '2010-02-15', sexe: 'F',
    poids: 48.5, grade: 'Gant bleu', club: 'SBF Rebais 77', licence: '0001234', email: 'parent@example.test',
    ...overrides,
  });
  const post = (input) => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(input) } }).text);
  return { state, context, post, valid, columns: context.RC };
}

test('initialisation idempotente : table privée, format texte licences, filtre et reprise toutes les 5 minutes', () => {
  const f = fixture({ empty: true, properties: { REBAIS_SHARED_SECRET: secret } });
  const result = f.context.initialiser();
  f.context.initialiser();
  assert.equal(result.configured, true);
  assert.equal(f.state.created, 1);
  assert.equal(f.state.triggers.length, 1);
  assert.equal(f.state.interval, 5);
  assert.equal(f.state.frozen, 1);
  assert.equal(f.state.bandings.length, 1);
  assert.ok(f.state.filter);
  assert.ok(f.state.formats.some((entry) => entry.firstColumn === f.columns.licence + 1 && entry.format === '@'));
  assert.equal(f.state.sent, undefined);
});

test('initialisation refuse un secret absent sans créer de table', () => {
  const f = fixture({ empty: true, properties: {} });
  assert.throws(() => f.context.initialiser(), /REBAIS_SHARED_SECRET/);
  assert.equal(f.state.created, 0);
  assert.equal(f.state.locked, false);
});

test('enregistrement durable avant toute confirmation et deux messages indépendants', () => {
  const f = fixture();
  const response = f.post(f.valid());
  assert.equal(response.ok, true);
  assert.match(response.reference, /^REB-[A-F0-9]{12}$/);
  assert.equal(response.emailStatus, 'sent');
  assert.equal(f.state.rows.length, 2);
  assert.equal(f.state.sent.length, 2);
  assert.ok(f.state.events.filter((event) => event.type === 'mail').every((event) => event.durableRows === 2));
  assert.equal(f.state.sent[0].to, 'parent@example.test');
  assert.equal(f.state.sent[1].to, 'cedricsenez@gmail.com,sbfrebais77@gmail.com');
  assert.equal(f.state.sent[0].replyTo, 'sbfrebais77@gmail.com');
  assert.equal(f.state.rows[1][f.columns.licence], '0001234');
  assert.equal(typeof f.state.rows[1][f.columns.poids], 'number');
  assert.ok(f.state.rows[1][f.columns.naissance] instanceof nativeDate);
  assert.equal(f.state.formats.length, 0, 'No repeated per-cell formatting on normal submission');
});

test('échec du flush initial : aucun succès ni email, erreur sans données personnelles', () => {
  const f = fixture({ failFlushAt: 1 });
  const response = f.post(f.valid());
  assert.equal(response.ok, false);
  assert.equal(response.code, 'UNAVAILABLE');
  assert.equal(f.state.sent, undefined);
  assert.equal(f.state.durable.length, 1);
  assert.doesNotMatch(JSON.stringify(response), /Martin|sensitive|example/);
  assert.equal(f.state.locked, false);
});

test('mail envoyé puis statut non persisté : inscription conservée, reprise avec doublon email possible', () => {
  const f = fixture({ failFlushAt: 2 });
  const input = f.valid();
  const response = f.post(input);
  assert.equal(response.ok, true);
  assert.equal(response.emailStatus, 'pending');
  assert.equal(f.state.sent.length, 1, 'The participant email was accepted before status persistence failed');
  assert.equal(f.state.durable.length, 2, 'The registration was already saved');
  assert.equal(f.state.durable[1][f.columns.pState], 'pending');

  // Simulate the next execution seeing only committed spreadsheet data.
  f.state.rows = f.state.durable.map((row) => row.slice());
  f.state.failFlushAt = 0;
  f.context.relancerEmails();

  assert.equal(f.state.durable.length, 2, 'Recovery must neither lose nor duplicate the registration');
  assert.equal(f.state.durable[1][f.columns.id], input.requestId);
  assert.equal(f.state.durable[1][f.columns.ref], response.reference);
  assert.equal(f.state.durable[1][f.columns.pState], 'sent');
  assert.equal(f.state.durable[1][f.columns.oState], 'sent');
  assert.equal(f.state.sent.filter((message) => message.to === 'parent@example.test').length, 2,
    'At-least-once delivery can resend an email whose successful send could not be recorded');
  assert.equal(f.state.sent.filter((message) => message.to.includes(',')).length, 1);
  assert.equal(f.post(input).reference, response.reference);
  assert.equal(f.state.sent.length, 3, 'A subsequent replay must not send again');
});

test('replay identique et même licence/contenu : un seul enregistrement, pas de renvoi', () => {
  const f = fixture();
  const input = f.valid();
  const first = f.post(input);
  assert.deepEqual(f.post(input), first);
  assert.deepEqual(f.post({ ...input, requestId: randomUUID() }), first);
  assert.equal(f.state.rows.length, 2);
  assert.equal(f.state.sent.length, 2);
});

test('UUID réutilisé avec données changées et licence prise : rejet générique sans reçu', () => {
  const f = fixture();
  const input = f.valid();
  f.post(input);
  const conflict = f.post({ ...input, poids: 50 });
  const duplicate = f.post({ ...input, requestId: randomUUID(), email: 'someone@example.test' });
  assert.equal(conflict.code, 'CONFLICT');
  assert.equal(duplicate.code, 'DUPLICATE');
  assert.equal(conflict.message, duplicate.message);
  assert.equal(duplicate.reference, undefined);
  assert.equal(f.state.rows.length, 2);
  assert.equal(f.state.sent.length, 2);
});

test('clôture à minuit Paris le 2 novembre ; replay antérieur récupérable ensuite', () => {
  const f = fixture({ now: Date.parse('2026-11-01T22:59:59.999Z') });
  const input = f.valid();
  const first = f.post(input);
  assert.equal(first.ok, true);
  f.state.now++;
  assert.equal(f.post(f.valid({ licence: '99999' })).code, 'CLOSED');
  assert.deepEqual(f.post(input), first);
  assert.equal(f.state.rows.length, 2);
});

test('panne notification organisateurs : inscription vraie, participant envoyé, reprise sans doublon', () => {
  const f = fixture({ failMail: (message) => message.to.includes(',') });
  const response = f.post(f.valid());
  assert.equal(response.ok, true);
  assert.equal(response.emailStatus, 'sent', 'The public status describes only the participant confirmation');
  assert.equal(f.state.durable[1][f.columns.pState], 'sent');
  assert.equal(f.state.durable[1][f.columns.oState], 'pending');
  f.context.relancerEmails();
  assert.equal(f.state.sent.length, 1, 'Backoff prevents immediate retries');
  f.state.now += 300001;
  f.state.failMail = null;
  f.context.relancerEmails();
  assert.equal(f.state.sent.length, 2);
  assert.equal(f.state.sent.filter((message) => message.to === 'parent@example.test').length, 1);
  assert.equal(f.state.durable[1][f.columns.oState], 'sent');
});

test('panne participant : notification indépendante, reprise uniquement participant', () => {
  const f = fixture({ failMail: (message) => !message.to.includes(',') });
  const response = f.post(f.valid());
  assert.equal(response.ok, true);
  assert.equal(response.emailStatus, 'pending');
  assert.equal(f.state.sent[0].to, 'cedricsenez@gmail.com,sbfrebais77@gmail.com');
  f.state.now += 300001;
  f.state.failMail = null;
  f.context.relancerEmails();
  assert.equal(f.state.sent.length, 2);
  assert.equal(f.state.sent.filter((message) => message.to.includes(',')).length, 1);
  assert.equal(f.state.durable[1][f.columns.pState], 'sent');
});

test('quota limité : priorité au participant, notifications en attente durable', () => {
  const f = fixture({ quota: 1 });
  const response = f.post(f.valid());
  assert.equal(response.ok, true);
  assert.equal(response.emailStatus, 'sent');
  assert.equal(f.state.sent.length, 1);
  assert.equal(f.state.durable[1][f.columns.oState], 'pending');
  f.state.quota = 2;
  f.context.relancerEmails();
  assert.equal(f.state.sent.length, 2);
  assert.equal(f.state.quota, 0);
});

test('quota épuisé : inscription enregistrée, confirmations en attente puis priorité sur toute la file', () => {
  const f = fixture({ quota: 0 });
  assert.equal(f.post(f.valid()).emailStatus, 'pending');
  assert.equal(f.post(f.valid({ licence: '0099999', email: 'second@example.test' })).emailStatus, 'pending');
  assert.equal(f.state.sent, undefined);
  f.state.quota = 2;
  f.context.relancerEmails();
  assert.equal(f.state.sent.length, 2);
  assert.ok(f.state.sent.every((message) => !message.to.includes(',')));
});

test('champs neutralisés pour tableur ; HTML échappé ; le message garde les valeurs lisibles', () => {
  const f = fixture();
  const response = f.post(f.valid({ nom: '=HYPERLINK("evil")', prenom: '<script>alert(1)</script>', club: '@club', licence: '-001', email: '+alias@example.test' }));
  assert.equal(response.ok, true);
  assert.equal(f.state.rows[1][f.columns.nom], '\'=HYPERLINK("evil")');
  assert.equal(f.state.rows[1][f.columns.club], "'@club");
  assert.equal(f.state.rows[1][f.columns.licence], "'-001");
  assert.equal(f.state.rows[1][f.columns.email], "'+alias@example.test");
  assert.equal(f.state.sent[0].to, '+alias@example.test');
  assert.doesNotMatch(f.state.sent[0].htmlBody, /<script>/);
  assert.match(f.state.sent[0].htmlBody, /&lt;script&gt;/);
  assert.match(f.state.sent[0].body, /Numéro de licence : -001/);
  assert.equal(f.post(f.valid({ licence: '-001' })).code, 'DUPLICATE');
  assert.equal(f.context.safeCell_('\tformula'), "'\tformula");
  assert.equal(f.context.safeCell_('\rformula'), "'\rformula");
});

test('validation défensive, secret et lecture publique ne produisent aucun effet', () => {
  const f = fixture();
  const invalids = [
    { secret: 'bad' }, { nom: 'x\nInjected' }, { email: 'x@example.test,attacker@example.test' },
    { naissance: '2026-02-30' }, { naissance: '2027-01-01' }, { poids: 0 }, { poids: 300.1 }, { poids: true },
    { poids: 55.55 }, { grade: 'Noir' }, { sexe: 'X' }, { licence: '=123' }, { licence: 123 },
    { requestId: 'bad-id' }, { ipHash: 'bad-ip' }, { club: 'x'.repeat(151) },
  ];
  for (const overrides of invalids) assert.equal(f.post(f.valid(overrides)).code, 'INVALID', JSON.stringify(overrides));
  assert.equal(JSON.parse(f.context.doGet().text).ok, false);
  assert.equal(JSON.parse(f.context.doPost({ postData: { contents: '{broken' } }).text).code, 'INVALID');
  assert.equal(JSON.parse(f.context.doPost({ postData: { contents: 'x'.repeat(16001) } }).text).code, 'INVALID');
  assert.equal(f.state.rows.length, 1);
  assert.equal(f.state.sent, undefined);
  assert.equal(f.state.events.filter((event) => event.type === 'open').length, 0);
});

test('verrou occupé : demande retentable sans enregistrement', () => {
  const f = fixture({ locked: true });
  assert.equal(f.post(f.valid()).code, 'BUSY');
  assert.equal(f.state.rows.length, 1);
});

test('limite par IP sans limite totale ; email commun autorisé pour plusieurs tireurs', () => {
  const f = fixture({ quota: 0 });
  for (let i = 0; i < 20; i++) assert.equal(f.post(f.valid({ licence: `000${i}` })).ok, true);
  assert.equal(f.post(f.valid({ licence: 'overflow' })).code, 'RATE_LIMIT');
  assert.equal(f.post(f.valid({ licence: 'different-ip', ipHash: 'b'.repeat(64) })).ok, true);
  f.state.now += 3600000;
  assert.equal(f.post(f.valid({ licence: 'next-hour' })).ok, true);
  assert.equal(f.state.rows.length, 23);
});

test('capacité tableur extensible et format des licences conservé', () => {
  const f = fixture({ maxRows: 1, quota: 0 });
  assert.equal(f.post(f.valid()).ok, true);
  assert.equal(f.state.maxRows, 101);
  assert.ok(f.state.formats.some((entry) => entry.firstColumn === f.columns.licence + 1 && entry.firstRow === 2 && entry.rowCount === 100 && entry.format === '@'));
});
