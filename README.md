# Site du CDSBF77

Site statique du Comité Départemental de Savate Boxe Française de Seine-et-Marne,
construit avec [Astro](https://astro.build) et déployé sur Vercel.
Ce dépôt fusionne l'ancien repo `cdsbf77` (site principal) et le repo
`monitorat` (espace formation e-learning).

## Commandes

- `npm install` : installe les dépendances
- `npm run dev` : serveur de développement sur http://localhost:4321
- `npm run build` : build de production dans `dist/`
- `npm run preview` : prévisualise le build

## Sources de données uniques

- **`src/data/clubs.json`** — toutes les pages clubs (annuaire, fiches, page
  savate adaptée, chiffres de l'accueil) sont générées depuis ce fichier.
  Champs à compléter en priorité (marqués `aCompleter: true`) : emails,
  horaires et correspondants, à exporter depuis l'extranet fédéral.
- **`src/data/actualites.json`** — les articles d'actualité. Les 4 articles de
  l'ancien blog Wix restent à migrer.
- **`src/data/formation.json`** — les 66 leçons et 335 questions de quiz de
  l'espace formation (voir ci-dessous).
- **`src/data/savate-adaptee.json`** — les 7 modules de savate adaptée et
  compléments UC1 (voir ci-dessous).

## Espace formation (`/formations/monitorat`)

Section e-learning de préparation au monitorat : **66 leçons** (~20 min
chacune) réparties en **9 modules** suivant l'ordre du programme de l'unité
capitalisable, chacune close par un **QCM autocorrigé** (335 questions).
En accès libre, sans mot de passe.

Arborescence :

```
src/data/formation.json                        ← leçons et quiz
src/layouts/Formation.astro                    ← layout autonome de la section
src/components/Quiz.astro                      ← moteur de quiz (autocorrection + score)
src/pages/formations/monitorat/index.astro     ← sommaire (/formations/monitorat)
src/pages/formations/monitorat/[lecon].astro   ← gabarit → 66 pages /formations/monitorat/<id>
public/formations/monitorat/schemas/*.png      ← 11 schémas de physiologie
```

### Modifier le contenu

Tout vit dans `src/data/formation.json`. Une leçon :

```json
{
  "id": "m3-08-glycolyse",
  "uc": "m3", "ordre": 8, "duree": 20,
  "titre": "...", "chapo": "...",
  "objectifs": ["..."],
  "contenu": "<h3>…</h3><p>…</p>",
  "schemas": [{ "src": "/formations/monitorat/schemas/glycolyse.png", "legende": "..." }],
  "aRetenir": ["..."],
  "quiz": [{ "q": "...", "options": ["a","b","c","d"], "r": 1, "e": "explication" }],
  "aEnrichir": ""
}
```

`r` est l'**index** de la bonne réponse (0 = première option). Ajouter une
leçon = ajouter un objet au tableau `lecons` ; la page et la navigation se
génèrent seules au build.

### Suivi de progression

Le score de chaque quiz est stocké dans le `localStorage` du navigateur
(clé `cdsbf77-formation`). Seuil de réussite : **70 %**. Rien ne remonte à un
serveur — aucun traitement de données personnelles.

### Layout

`Formation.astro` est **autonome** (son propre `<html>`, ses polices, ses
variables CSS `--marine`, `--or`, etc.) : l'espace formation a sa propre
identité visuelle, sans interférence avec `comite.css`. Pour l'aligner un jour
sur `Base.astro` : importer `Base`, remplacer le bloc `<html>…</html>` par
`<Base title={title} description={description}>…</Base>`, retirer le bandeau
`fmt-top` et le pied `fmt-foot`, et conserver le `<style is:global>`.

### Reste à faire (section formation)

- Vidéos et présentations illustratives à produire puis insérer dans `contenu`.
- Leçon « Culture fédérale » (M1) : chiffres actuels FFSavate et organigramme
  du comité à compléter (encadré « à compléter » visible sur la page).
- Schémas : 11 intégrés (physiologie, M3). Anatomie, biomécanique, technique
  et histoire n'en ont pas encore — le champ `schemas` est prêt.

## Charte graphique

**`src/styles/tokens.css` est la source unique** de la palette, de la
typographie, des rayons et des ombres. Il est importé par `comite.css` (site
principal) et par `Formation.astro` (espace formation), qui utilisaient
jusqu'au 29/07/2026 deux vocabulaires séparés. Les anciens noms
(`--gold`/`--blue` et `--or`/`--marine`) subsistent en alias en bas du fichier
et pointent sur les mêmes valeurs : à résorber progressivement, ne rien y
ajouter.

### Contraste

Toutes les pages passent le niveau AA (vérifié à l'écran sur 16 pages).
Deux pièges à connaître :

- **`--or-400` (#d4af37) ne passe pas sur fond clair** : 2,1:1 sur blanc. Il est
  réservé au décor et aux fonds marine. Pour du texte sur clair, utiliser
  **`--or-texte`** (#806418, 5,6:1 sur blanc et 5,1:1 sur crème).
- **`--gris-200` est une couleur de filet**, jamais de texte. Pour un gros
  chiffre décoratif, `--gris-400` ; pour du texte secondaire, `--gris-500`.

### Polices

Auto-hébergées via `@fontsource` (`src/styles/polices.css`), sous-ensemble
latin, seules les graisses employées. Plus aucun appel à
`fonts.googleapis.com`. Utiliser `var(--police-titre)` (Bebas Neue) et
`var(--police-texte)` (Poppins) plutôt que les noms en dur.

### Icônes

`src/components/Icone.astro` inline les SVG au build, depuis **Lucide** (ISC)
pour les pictogrammes et **Simple Icons** (CC0) pour les réseaux sociaux.
Font Awesome et son CDN ont été retirés. Ajouter une icône = ajouter une
entrée au `CATALOGUE` du composant.

```astro
<Icone nom="courriel" />
<Icone nom="facebook" taille="1.2rem" titre="Facebook" />
```

Sans `titre`, l'icône est décorative et masquée aux lecteurs d'écran.

### Image de partage

`public/og-cdsbf77.png` (1200×630), générée par `node scripts/generer-og.mjs`.
À relancer si le logo ou le nombre de clubs changent. `Base.astro` accepte une
prop `image` pour surcharger l'image d'une page donnée.

## Cours d'essai (`/essai`)

Parcours de conversion : le visiteur saisit son code postal ou sa commune,
choisit un club, et remplit une demande de cours d'essai gratuit.

```
src/components/TrouverClub.astro     ← sélecteur, alimenté par clubs.json
src/pages/essai/index.astro          ← page d'entrée
src/pages/essai/[slug].astro         ← gabarit → 32 pages /essai/<slug>
```

Le sélecteur est aussi posé sur l'accueil (ancre `#trouver-club`).

### Comment le message part

**Par `mailto:` construit dans le navigateur.** Le formulaire n'envoie rien :
il ouvre le logiciel de messagerie du visiteur avec un message pré-rempli,
qu'il relit et envoie lui-même. Conséquence importante : **aucune donnée
personnelle n'est transmise au site ni à un tiers, rien n'est stocké**, donc
aucun traitement à déclarer et rien à ajouter aux mentions légales.

Limite : le visiteur doit avoir une messagerie configurée. Sur mobile c'est
généralement le cas ; sur un poste utilisant uniquement un webmail, le lien
peut ne rien ouvrir.

**Destinataires** : 24 clubs sur 32 reçoivent la demande directement
(`contact.email` dans `clubs.json`). Les 8 autres n'ont pas d'adresse
renseignée — leur demande part à `contact@cdsbf77.org` avec le nom du club en
objet, et la page le dit au visiteur. Renseigner ces adresses dans
`clubs.json` suffit à basculer automatiquement :
Villevaudé, Pontault-Combault, Neufmoutiers-en-Brie, Rebais, Saint-Soupplets,
Fontenay-Trésigny, Courtry, Cris Ladies Boxing.

### Passer à un envoi côté serveur

Si le `mailto:` s'avère trop fragile, deux voies, **qui toutes deux font du
site un responsable de traitement** (consentement, information, durée de
conservation, mise à jour des mentions légales) :

1. **Service de formulaire tiers** (Formspree, Web3Forms…) : le `<form>` poste
   vers leur API, qui envoie le courriel. Pas d'infrastructure, un compte à
   créer, un sous-traitant à mentionner.
2. **Fonction serverless Vercel + fournisseur d'e-mail** (Resend, Brevo…) :
   demande l'adaptateur `@astrojs/vercel`, une clé d'API et
   l'authentification du domaine `cdsbf77.org` (SPF/DKIM). Meilleure
   délivrabilité, le comité peut se mettre en copie.

Dans les deux cas, prévoir un piège à robots (champ caché) et le traitement
des données de mineurs, la savate accueillant des enfants dès 5 ans.

### Pages d'atterrissage par bassin

```
src/data/secteurs.json                       ← découpage géographique
src/pages/clubs/autour-de-[secteur].astro    ← gabarit → 6 pages
```

Destinées aux campagnes payantes. Le principe : l'annonce connaît déjà la zone
ciblée, on ne redemande donc pas au visiteur où il habite — la page affiche
d'emblée les clubs du secteur. Le titre reprend le nom du bassin, pour que le
message de l'annonce et la destination coïncident.

`misEnAvant` liste les clubs affichés en tête et en grand format. L'ordre du
tableau fait l'ordre à l'écran. **Aucune mention de valeur n'est affichée** —
ni « recommandé », ni classement écrit : sur une page publique du comité,
hiérarchiser explicitement ses propres clubs affiliés serait intenable en
assemblée. Seule la place dans la page hiérarchise.

Le bouton d'essai de chaque club est placé avant les informations pratiques :
vérifié visible sans défiler en 375 × 812 sur les six bassins.

### Recherche par code postal

Faute de coordonnées GPS dans `clubs.json`, le sélecteur **ne calcule pas** le
club le plus proche : il fait une correspondance exacte sur le code postal, ou
sur le nom de la commune ou du club. Un code postal en 77 sans club affiche
tout le département ; hors 77, le visiteur est renvoyé vers la fédération.
Ajouter les coordonnées permettrait un vrai tri par distance.

## Savate adaptée (`/formations/savate-adaptee`)

7 modules en accès libre : 5 sur la savate adaptée (pédagogie inclusive,
pratique partagée, manipulation des contraintes, communication et valorisation,
gestion des comportements-défis) et 2 compléments de l'UC1 (construction de
séances, progression technique et grades). 54 questions de quiz au total.

```
src/data/savate-adaptee.json                      ← contenu et quiz
src/pages/formations/savate-adaptee/index.astro   ← sommaire
src/pages/formations/savate-adaptee/[lecon].astro ← gabarit → 7 pages
```

Même layout (`Formation.astro`) et même moteur de quiz (`Quiz.astro`) que
l'espace monitorat ; la progression est stockée sous la même clé
`localStorage` (`cdsbf77-formation`).

Le contenu vient de la migration des anciennes pages
`public/formations/candidats/*.html` (29/07/2026). Le HTML est normalisé sur un
vocabulaire commun stylé dans `Formation.astro` : `.fmt-bloc`, `.fmt-cle`,
`.fmt-encart` (variantes `--attention`, `--succes`, `--astuce`, `--definition`,
`--reflexion`, `--exemple`), `.fmt-grille`, `.fmt-carte`, `.fmt-depliant`
(`<details>` natif) et `.fmt-media`.

**À enrichir :** 36 des 54 questions n'avaient aucune explication dans les pages
d'origine ; le champ `e` y contient un simple rappel de la bonne réponse
(« Réponse attendue : … »). Les 18 autres ont conservé leur explication
rédigée. Les titres d'encarts gardent les émojis des pages d'origine (💡, 🚫,
✅) : à revoir lors de l'harmonisation graphique.

## Déploiement

1. Pousser ce dossier sur un dépôt GitHub.
2. Sur vercel.com : « Add New Project » → importer le dépôt (framework détecté : Astro).
3. Valider la preview sur `*.vercel.app`.
4. Domaine `cdsbf77.org` dans Settings → Domains.
5. Redirections 301 depuis les anciennes URLs Wix : `vercel.json`.
6. Search Console : soumettre `https://www.cdsbf77.org/sitemap-index.xml`.

## À faire ensuite

- Compléter `clubs.json` (emails, horaires) et la fiche Savate pour Tous
- Migrer les articles Wix
- Coordonnées GPS des salles pour la carte interactive de `/clubs`
- Page calendrier des compétitions 2026-2027 et lien vers le site Challenge 77
- Rédiger une page sur la filière fédérale (animateur, moniteur, BPJEPS,
  DEJEPS). La carte a été retirée de `/formations` le 29/07/2026 : elle
  pointait vers un export Wix vide. Une redirection 301 renvoie
  `/formations/filiere-federale` vers `/formations`.
- Remplacer deux logos de partenaires par des fichiers de meilleure source :
  celui du **SDJES 77** n'est que le bloc Marianne, sans la mention du service,
  et celui de **« DRAJES et FDVA »** ne porte en réalité que le FDVA.
  Les logos de la Ligue Île-de-France et de la FF Savate sont en basse
  définition (140 px de large).
- Direction artistique (lot B) : héros de l'accueil, grille et hiérarchie
  typographique tenues sur toutes les pages, composants unifiés, allègement
  des effets. La vidéo Vimeo du héros est au format portrait et ne couvre pas
  la largeur de l'écran.
