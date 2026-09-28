import test from 'node:test';
import assert from 'node:assert/strict';
import { validerInscription, CLOTURE_REBAIS } from '../src/lib/inscription-rebais.mjs';
import { creerHandler } from '../api/inscription-rebais.js';

const now = new Date('2026-09-27T12:00:00Z');
const valid = { nom: 'Démonstration', prenom: 'Camille', naissance: '2010-02-28', sexe: 'F', poids: '48,5', grade: 'Gant vert', club: 'Club test', licence: '0001234', email: 'camille@example.com', website: '', requestId: 'f4eb0a7a-3f3c-4c11-a18c-7b40a47c4be4' };
const env = { NODE_ENV: 'test', REBAIS_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec', REBAIS_SHARED_SECRET: 'test-secret-at-least-thirty-two-characters' };
async function invoke({ body = valid, environment = env, fetcher, method = 'POST', origin = 'http://localhost:4321', type = 'application/json', headers = {} } = {}) {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(v) { this.body = v; return this; } };
  const handler = creerHandler({ env: environment, clock: () => now, fetcher: fetcher || (() => { throw new Error('Unexpected network call'); }) });
  await handler({ method, headers: { origin, 'content-type': type, ...headers }, body, socket: { remoteAddress: '127.0.0.1' } }, res);
  return res;
}
test('validates all fields and preserves license leading zeros', () => {
  const r = validerInscription(valid, now);
  assert.equal(r.ok, true); assert.equal(r.data.poids, 48.5); assert.equal(r.data.licence, '0001234');
  assert.equal('website' in r.data, false);
});
test('rejects impossible and future birth dates, invalid email, grades and payload types', () => {
  for (const patch of [{ naissance: '2026-02-30' }, { naissance: '2027-01-01' }, { sexe: 'X' }, { email: 'x@example.com\nBcc: a@example.com' }, { grade: 'unknown' }, { poids: '0' }, { poids: '1e2' }, { poids: '50.25' }, { website: 'spam' }, { nom: ['test'] }, { requestId: 'test' }]) {
    assert.equal(validerInscription({ ...valid, ...patch }, now).ok, false, JSON.stringify(patch));
  }
});
test('deadline is Paris midnight following November 1', () => {
  assert.equal(new Date(CLOTURE_REBAIS).toISOString(), '2026-11-01T23:00:00.000Z');
});
test('missing configuration cannot produce a false confirmation', async () => {
  const r = await invoke({ environment: { NODE_ENV: 'test' } });
  assert.equal(r.statusCode, 503); assert.equal(r.body.ok, false);
});
test('rejects method, external origin, invalid JSON and oversized body before upstream', async () => {
  assert.equal((await invoke({ method: 'GET' })).statusCode, 405);
  assert.equal((await invoke({ origin: 'https://evil.example' })).statusCode, 403);
  assert.equal((await invoke({ type: 'text/plain' })).statusCode, 415);
  assert.equal((await invoke({ body: '{' })).statusCode, 400);
  assert.equal((await invoke({ body: { ...valid, nom: 'x'.repeat(9000) } })).statusCode, 413);
});
test('allows verified response only, attaches server secret and hashes IP', async () => {
  let sent;
  const r = await invoke({ body: { ...valid, secret: 'attacker', to: 'attacker@example.com' }, fetcher: async (url, args) => {
    sent = JSON.parse(args.body); assert.equal(url, env.REBAIS_APPS_SCRIPT_URL);
    return { ok: true, json: async () => ({ ok: true, reference: 'REB-12345678', emailStatus: 'pending', extra: 'private' }) };
  } });
  assert.equal(r.statusCode, 200); assert.equal(sent.secret, env.REBAIS_SHARED_SECRET);
  assert.match(sent.ipHash, /^[a-f0-9]{64}$/); assert.equal(sent.to, undefined);
  assert.deepEqual(r.body, { ok: true, reference: 'REB-12345678', emailStatus: 'pending' });
  assert.equal(r.headers['Cache-Control'], 'no-store');
});
test('malformed, failed and uncertain upstream responses never confirm', async () => {
  for (const fetcher of [async () => ({ ok: false }), async () => { throw Error('timeout'); }, async () => ({ ok: true, json: async () => ({ ok: true }) })]) {
    const r = await invoke({ fetcher }); assert.notEqual(r.statusCode, 200); assert.equal(r.body.ok, false);
  }
});
test('maps known backend failures without echoing secrets or personal data', async () => {
  for (const [code, status] of [['CLOSED', 410], ['DUPLICATE', 409], ['CONFLICT', 409], ['RATE_LIMIT', 429], ['INVALID', 400], ['BUSY', 503], ['AUTH', 503]]) {
    const r = await invoke({ fetcher: async () => ({ ok: true, json: async () => ({ ok: false, code, message: 'secret test value' }) }) });
    assert.equal(r.statusCode, status); assert.equal(JSON.stringify(r.body).includes('secret test value'), false);
  }
});
test('production rejects localhost and requires Vercel supplied IP', async () => {
  const environment = { ...env, VERCEL: '1', VERCEL_ENV: 'production', NODE_ENV: 'production' };
  assert.equal((await invoke({ environment })).statusCode, 403);
  assert.equal((await invoke({ environment, origin: 'https://www.cdsbf77.fr' })).statusCode, 503);
});
test('backend destination is restricted to Google Apps Script execution URLs', async () => {
  for (const url of ['https://example.com/exec', 'http://script.google.com/macros/s/test/exec', 'https://script.google.com/macros/s/test/dev', 'https://script.google.com/macros/s/test/exec?secret=x']) {
    assert.equal((await invoke({ environment: { ...env, REBAIS_APPS_SCRIPT_URL: url } })).statusCode, 503);
  }
});
test('production and exact preview origin can complete a verified submission', async () => {
  for (const [VERCEL_ENV, origin] of [['production', 'https://www.cdsbf77.fr'], ['preview', 'https://rebais-preview.vercel.app']]) {
    let forwarded;
    const r = await invoke({
      environment: { ...env, VERCEL: '1', VERCEL_ENV, VERCEL_URL: 'rebais-preview.vercel.app', NODE_ENV: 'production' },
      origin, headers: { 'x-vercel-forwarded-for': '192.0.2.10' },
      fetcher: async (_, args) => { forwarded = JSON.parse(args.body); return { ok: true, json: async () => ({ ok: true, reference: 'REB-ABCDEFGH', emailStatus: 'sent' }) }; },
    });
    assert.equal(r.statusCode, 200); assert.equal(r.body.emailStatus, 'sent');
    assert.match(forwarded.ipHash, /^[a-f0-9]{64}$/); assert.equal(JSON.stringify(forwarded).includes('192.0.2.10'), false);
  }
});
