# Site du CDSBF77

Site statique du Comité Départemental de Savate Boxe Française de Seine-et-Marne,
construit avec [Astro](https://astro.build) et déployé sur Vercel.

## Commandes

- `npm install` : installe les dépendances
- `npm run dev` : serveur de développement sur http://localhost:4321
- `npm run build` : build de production dans `dist/`
- `npm run preview` : prévisualise le build

## Source de données unique

Toutes les pages clubs (annuaire, fiches, page savate adaptée, chiffres de
l'accueil) sont générées depuis **`src/data/clubs.json`**. Pour ajouter,
corriger ou retirer un club, modifiez ce fichier puis redéployez : le menu,
l'annuaire et les fiches se mettent à jour partout.

Champs à compléter en priorité (marqués `aCompleter: true`) : emails,
horaires et correspondants, à exporter depuis l'extranet fédéral.

## Actualités

Les articles vivent dans `src/data/actualites.json`. Les 4 articles de
l'ancien blog Wix sont à migrer (copier le texte depuis Wix avant résiliation).

## Déploiement

1. Pousser ce dossier sur un dépôt GitHub.
2. Sur vercel.com : « Add New Project » → importer le dépôt (framework détecté : Astro).
3. Valider la preview sur `*.vercel.app` avec le bureau.
4. Ajouter le domaine `cdsbf77.org` dans Settings → Domains et suivre les
   instructions DNS chez le registrar du domaine.
5. Les redirections 301 depuis les anciennes URLs Wix sont dans `vercel.json` :
   compléter la liste si d'autres URLs Wix existent (vérifier dans Google
   Search Console les URLs indexées).
6. Après bascule : déclarer le site dans Search Console et soumettre
   `https://www.cdsbf77.org/sitemap-index.xml`.

## À faire ensuite

- Compléter `clubs.json` (emails, horaires) et la fiche Savate pour Tous
- Migrer les articles Wix
- Ajouter les coordonnées GPS des salles pour la carte interactive de `/clubs`
- Page calendrier des compétitions 2026-2027 et lien vers le site Challenge 77
