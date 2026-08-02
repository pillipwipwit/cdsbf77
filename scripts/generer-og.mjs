// Génère public/og-cdsbf77.png (1200x630), l'image affichée lors des partages
// sur Facebook, Instagram, LinkedIn, WhatsApp.
//
//   node scripts/generer-og.mjs
//
// À relancer si le logo, le nom du comité ou le nombre de clubs changent.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const PROJET = join(dirname(fileURLToPath(import.meta.url)), '..');
const L = 1200;
const H = 630;

// Le nombre de clubs est lu dans les données, pour qu'il ne diverge pas du site
const nbClubs = JSON.parse(readFileSync(join(PROJET, 'src/data/clubs.json'), 'utf8')).clubs.length;

// Logo détouré en rond, sur pastille blanche
const TAILLE_LOGO = 300;
const logo = await sharp(readFileSync(join(PROJET, 'public/logos/cdsbf77.png')))
  .resize(TAILLE_LOGO - 24, TAILLE_LOGO - 24, { fit: 'contain', background: '#ffffff' })
  .toBuffer();

const masque = Buffer.from(
  `<svg width="${TAILLE_LOGO}" height="${TAILLE_LOGO}">
     <circle cx="${TAILLE_LOGO / 2}" cy="${TAILLE_LOGO / 2}" r="${TAILLE_LOGO / 2}" fill="#fff"/>
   </svg>`
);

const pastille = await sharp({
  create: { width: TAILLE_LOGO, height: TAILLE_LOGO, channels: 4, background: '#ffffff' },
})
  .composite([
    { input: logo, gravity: 'center' },
    { input: masque, blend: 'dest-in' },
  ])
  .png()
  .toBuffer();

// Poppins n'est pas installée au niveau du système : on s'appuie sur une pile
// de grotesques courantes. Le rendu est à vérifier à l'œil après génération.
const POLICE = 'Segoe UI, Tahoma, DejaVu Sans, Arial, sans-serif';

const fond = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#0f3460"/>
      <stop offset="60%" stop-color="#123f74"/>
      <stop offset="100%" stop-color="#0b2748"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.78" cy="0.18" r="0.6">
      <stop offset="0%"   stop-color="#d4af37" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${L}" height="${H}" fill="url(#g)"/>
  <rect width="${L}" height="${H}" fill="url(#halo)"/>
  <rect x="0" y="${H - 14}" width="${L}" height="14" fill="#d4af37"/>

  <text x="470" y="250" font-family="${POLICE}" font-size="96" font-weight="700"
        fill="#d4af37" letter-spacing="4">CDSBF 77</text>

  <text x="472" y="320" font-family="${POLICE}" font-size="35" font-weight="600" fill="#ffffff">
    Savate boxe française
  </text>
  <text x="472" y="372" font-family="${POLICE}" font-size="35" font-weight="400" fill="#c3cedb">
    en Seine-et-Marne
  </text>

  <rect x="472" y="410" width="90" height="4" fill="#d4af37"/>

  <text x="472" y="472" font-family="${POLICE}" font-size="26" font-weight="400" fill="#9fb0c4">
    Comité départemental · ${nbClubs} clubs affiliés
  </text>
</svg>
`);

const image = await sharp(fond)
  .composite([{ input: pastille, left: 120, top: Math.round((H - TAILLE_LOGO) / 2) - 10 }])
  .png({ palette: true, quality: 92, effort: 10 })
  .toBuffer();

writeFileSync(join(PROJET, 'public/og-cdsbf77.png'), image);
console.log('public/og-cdsbf77.png écrit —', Math.round(image.length / 1024), 'Ko,', nbClubs, 'clubs');
