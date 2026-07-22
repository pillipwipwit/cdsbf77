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
- Décider du sort de `public/formations/candidats/emonitorat.html` (ancien
  export Wix, remplacé par `/formations/monitorat`)
