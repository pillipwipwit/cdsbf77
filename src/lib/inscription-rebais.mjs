export const CLOTURE_REBAIS = Date.parse('2026-11-01T23:00:00Z');
export const GRADES_REBAIS = Object.freeze([
  'Kangourou 1', 'Kangourou 2', 'Kangourou 3', 'Gant bleu', 'Gant vert',
  'Gant rouge', 'Gant blanc', 'Gant jaune', 'Gant d’argent',
]);

// Explicit allow-list: no recipient, destination URL or secret comes from the browser.
export function validerInscription(input, now = new Date()) {
  const errors = {};
  const data = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { formulaire: 'Le formulaire est invalide.' } };
  }
  const text = (key, max, label) => {
    const value = typeof input[key] === 'string' ? input[key].trim().normalize('NFC') : '';
    if (!value || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) {
      errors[key] = `Renseignez ${label} (maximum ${max} caractères).`;
    }
    data[key] = value;
    return value;
  };
  text('nom', 80, 'le nom');
  text('prenom', 80, 'le prénom');
  text('club', 150, 'le club');
  const licence = text('licence', 40, 'le numéro de licence');
  if (licence && !/^[\p{L}\p{N} -]+$/u.test(licence)) errors.licence = 'Vérifiez le numéro de licence.';
  const email = text('email', 254, 'une adresse email');
  if (!/^[^\s@<>(),;:\[\]"\\]+@[^\s@<>(),;:\[\]"\\]+\.[^\s@<>(),;:\[\]"\\]+$/u.test(email)) {
    errors.email = 'Renseignez une adresse email valide.';
  }
  data.email = email.toLowerCase();
  data.sexe = input.sexe;
  if (!['F', 'M'].includes(data.sexe)) errors.sexe = 'Sélectionnez le sexe du tireur.';
  data.grade = input.grade;
  if (!GRADES_REBAIS.includes(data.grade)) errors.grade = 'Sélectionnez un grade dans la liste.';
  data.naissance = typeof input.naissance === 'string' ? input.naissance : '';
  const birth = new Date(data.naissance + 'T12:00:00Z');
  const today = now.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.naissance) || !Number.isFinite(birth.getTime()) ||
      birth.toISOString().slice(0, 10) !== data.naissance || data.naissance < '1900-01-01' ||
      data.naissance > today || data.naissance > '2026-11-08') {
    errors.naissance = 'Renseignez une date de naissance valide, qui ne soit pas dans le futur.';
  }
  const weight = typeof input.poids === 'number' ? String(input.poids) : typeof input.poids === 'string' ? input.poids.trim().replace(',', '.') : '';
  data.poids = Number(weight);
  if (!/^\d{1,3}(\.\d)?$/.test(weight) || data.poids < 1 || data.poids > 300) {
    errors.poids = 'Indiquez le poids en kg, avec au maximum une décimale.';
  }
  data.requestId = typeof input.requestId === 'string' ? input.requestId : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.requestId)) {
    errors.formulaire = 'Rechargez la page avant de réessayer.';
  }
  if (input.website !== undefined && input.website !== '') errors.formulaire = 'Le formulaire est invalide.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
