import { createHmac } from 'node:crypto';
import { validerInscription } from '../src/lib/inscription-rebais.mjs';

const MAX_BODY = 8192;
const INDISPONIBLE = 'Les inscriptions en ligne sont momentanément indisponibles. Réessayez plus tard ou contactez sbfrebais77@gmail.com.';
const ATTENTE = 'La réponse tarde à arriver. Réessayez avec le même formulaire : une inscription déjà enregistrée ne sera pas créée deux fois.';

function originePermise(origin, env) {
  const origins = new Set(['https://www.cdsbf77.fr', 'https://cdsbf77.fr']);
  if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL) origins.add('https://' + env.VERCEL_URL);
  if (!env.VERCEL && env.NODE_ENV !== 'production') {
    origins.add('http://localhost:4321');
    origins.add('http://127.0.0.1:4321');
  }
  return origins.has(origin);
}

// Dependencies are injectable so checks never need a real account or send real emails.
export function creerHandler({ env = process.env, fetcher = fetch, clock = () => new Date() } = {}) {
  return async function inscription(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const answer = (status, body) => res.status(status).json(body);
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return answer(405, { ok: false, message: 'Utilisez le formulaire d’inscription.' });
    }
    if (!originePermise(req.headers.origin, env)) return answer(403, { ok: false, message: 'Envoyez le formulaire depuis le site du comité.' });
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
      return answer(415, { ok: false, message: 'Le format du formulaire est invalide.' });
    }
    let input;
    try {
      const raw = req.body;
      if (Number(req.headers['content-length']) > MAX_BODY || Buffer.byteLength(typeof raw === 'string' ? raw : JSON.stringify(raw ?? null)) > MAX_BODY) {
        return answer(413, { ok: false, message: 'Le formulaire est trop volumineux.' });
      }
      input = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return answer(400, { ok: false, message: 'Le formulaire est invalide.' });
    }
    const validated = validerInscription(input, clock());
    if (!validated.ok) return answer(400, { ok: false, message: 'Vérifiez les champs indiqués.', errors: validated.errors });
    // The authoritative deadline is in Apps Script, after replay lookup: a retry
    // after midnight can still recover the receipt of an earlier saved submission.
    const url = env.REBAIS_APPS_SCRIPT_URL;
    const secret = env.REBAIS_SHARED_SECRET;
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || '') || !secret || secret.length < 32) {
      return answer(503, { ok: false, message: INDISPONIBLE });
    }
    const ip = env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
    if (env.VERCEL && (typeof ip !== 'string' || !ip)) return answer(503, { ok: false, message: INDISPONIBLE });
    const ipHash = createHmac('sha256', secret).update(String(ip || 'local')).digest('hex');
    try {
      const upstream = await fetcher(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validated.data, secret, ipHash }),
        signal: AbortSignal.timeout(25000), redirect: 'follow',
      });
      if (!upstream.ok) return answer(502, { ok: false, message: ATTENTE });
      const result = await upstream.json();
      if (result.ok === true && /^REB-[A-Z0-9-]{4,60}$/i.test(result.reference || '') && ['sent', 'pending'].includes(result.emailStatus)) {
        return answer(200, { ok: true, reference: result.reference, emailStatus: result.emailStatus });
      }
      const errors = {
        CLOSED: [410, 'Les inscriptions sont closes depuis le 1er novembre 2026 à 23 h 59.'],
        DUPLICATE: [409, 'Cette demande ne peut pas être traitée. Pour une vérification ou une modification, contactez sbfrebais77@gmail.com.'],
        CONFLICT: [409, 'Cette demande ne peut pas être réutilisée avec des informations différentes. Contactez sbfrebais77@gmail.com.'],
        RATE_LIMIT: [429, 'Trop de tentatives rapprochées. Patientez avant de réessayer.'],
        INVALID: [400, 'Vérifiez les informations du formulaire.'],
        BUSY: [503, ATTENTE],
      };
      const [status, message] = errors[result.code] || [503, INDISPONIBLE];
      if (status === 429) res.setHeader('Retry-After', '3600');
      return answer(status, { ok: false, message });
    } catch {
      // Never log the request body, secret, participant details or upstream response.
      return answer(502, { ok: false, message: ATTENTE });
    }
  };
}

export default creerHandler();
