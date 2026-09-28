# Interclubs de Rebais — activation des inscriptions

La page est `/interclubs-rebais-2026`. Elle recueille une inscription par tireur
pour les assauts gratuits du dimanche 8 novembre 2026, au gymnase du collège de
Rebais, rue Gaspard Monge, 77510 Rebais. Les horaires restent à confirmer. Clôture le
dimanche 1er novembre à 23 h 59 (heure de Paris), sans quota de participants.

## État de livraison

Le code fonctionne avec un compte Google organisateur et le projet Vercel du
site. **Créer les fichiers du site n’active pas ces comptes.** Tant que les deux
variables Vercel ci-dessous ne sont pas renseignées, le formulaire affiche une
indisponibilité et ne prétend pas avoir enregistré une inscription.

Il faut encore connecter le compte organisateur, autoriser le script Google,
le déployer, configurer Vercel et vérifier une inscription de bout en bout.
Ne pas annoncer l’ouverture des inscriptions avant cette vérification.

## Connexion du compte organisateur

1. Ouvrir [Google Apps Script](https://script.google.com/) avec le compte Google
   qui enverra les confirmations (idéalement `sbfrebais77@gmail.com`). Créer un
   projet nommé « Interclubs Rebais — 8 novembre 2026 ».
2. Copier le fichier `Code.gs` de ce dossier dans le projet. Dans les paramètres,
   afficher le manifeste `appsscript.json`, puis reprendre le manifeste fourni.
3. Ajouter dans les propriétés du script `REBAIS_SHARED_SECRET` : une chaîne
   aléatoire d’au moins 32 caractères, conservée privée. La même valeur sera
   utilisée dans Vercel. Ne jamais la mettre dans une page, un dépôt Git ou une
   variable préfixée `PUBLIC_`.
4. Exécuter `initialiser` et autoriser l’accès au tableau et l’envoi des emails
   lorsque Google le demande. Cette autorisation doit être validée par le
   titulaire du compte. La fonction crée le tableau de suivi privé et installe
   la reprise automatique des emails. Pour utiliser un tableau dédié existant,
   renseigner au préalable sa propriété `REBAIS_SPREADSHEET_ID`.
5. Déployer une **application Web**, exécutée en tant que propriétaire, avec accès
   « Tout le monde ». Le point d’entrée est protégé par le secret et ne propose
   aucun accès en lecture aux inscrits. Le tableau lui-même reste privé. Copier
   l’adresse fournie, qui se termine par `/exec` (et non `/dev`).

Les droits accordés au script permettent de gérer les inscriptions et d’envoyer
les emails depuis le compte choisi. Aucun accès à la lecture des emails n’est
nécessaire. Une modification ultérieure du code nécessite une nouvelle version
du déploiement Google Apps Script.

## Raccordement du site

Dans les variables d’environnement du projet Vercel, ajouter :

| Nom | Valeur |
| --- | --- |
| `REBAIS_APPS_SCRIPT_URL` | URL `/exec` du déploiement Google |
| `REBAIS_SHARED_SECRET` | Même secret que dans les propriétés du script |

Appliquer les variables à l’environnement de production puis redéployer le
site. Le dossier `api/` contient une fonction Node Vercel ; Astro reste statique.
Conserver les redirections existantes du fichier `vercel.json`.

La page est liée depuis l’accueil et le calendrier des compétitions. Le serveur
autorise le domaine `www.cdsbf77.fr`, `cdsbf77.fr` et l’URL de prévisualisation
Vercel fournie par `VERCEL_URL` en environnement preview.

## Tableau et export Excel

Le classeur Google contient l’onglet **Inscriptions**, les coordonnées demandées,
une référence, la date d’enregistrement et le suivi des envois. Les licences
restent du texte pour conserver leurs zéros initiaux. Les champs saisis sont
neutralisés pour empêcher leur interprétation comme des formules.

Dans Google Sheets : **Fichier → Télécharger → Microsoft Excel (.xlsx)**.
Le fichier téléchargé est un instantané ; le tableau en ligne continue de recevoir
les inscriptions. Ne pas publier le classeur sur le Web. Si les deux organisateurs
doivent y accéder, accorder uniquement les accès nominatifs nécessaires.

Pour corriger ou annuler une inscription, les participants contactent
`sbfrebais77@gmail.com`. Le site ne propose pas de modification publique.
Prévoir avec les organisateurs la suppression des données après la période utile
à l’événement, y compris les exports et les copies dans les messageries ; aucune
suppression automatique de ces copies n’est annoncée.

## Emails et limite du compte Google

Chaque inscription enregistre les données avant tout envoi. Un email est préparé
pour le participant, et une notification pour `cedricsenez@gmail.com` et
`sbfrebais77@gmail.com`. Le nom affiché identifie l’interclubs et les réponses
reviennent à `sbfrebais77@gmail.com`.

Les comptes Gmail personnels ont actuellement une limite Apps Script de
**100 destinataires par jour**, soit environ **33 inscriptions avec les trois
destinataires** si aucun autre envoi ne consomme le quota. Le nombre d’inscriptions
reste illimité ; au-delà du quota d’email, les inscriptions restent enregistrées
et les messages attendent la disponibilité suivante. La page confirme alors
l’enregistrement et signale que l’email est en attente. Le déclencheur réessaie
toutes les cinq minutes, sans contourner la limite Google. Une forte affluence
peut donc retarder les emails d’un jour ou plus. Pour garantir un envoi immédiat
à plus grande échelle, choisir un fournisseur d’envoi adapté avant ouverture.

Le tableau indique les envois pris en charge par Google, pas la remise effective
en boîte de réception. Les organisateurs doivent surveiller les retours d’erreur
et les messages non distribués.

La reprise suit une logique d’envoi **au moins une fois** : si Google accepte un
email mais que l’enregistrement de son statut échoue, une reprise peut envoyer
ce même email une seconde fois. Ce rare doublon de message conserve la même
référence et ne crée aucune inscription supplémentaire. L’inscription reste
enregistrée même lorsque l’envoi ou son suivi rencontre une panne.

## Vérification avant ouverture

- Envoyer une inscription explicitement identifiée comme test avec l’adresse
  d’un organisateur ; vérifier la ligne du tableau, la page de confirmation et
  les trois destinataires. Cette vérification produit de vrais emails.
- Réessayer la même requête : une seule ligne doit exister. Une licence déjà
  enregistrée avec une nouvelle demande doit être signalée sans révéler ses
  coordonnées.
- Vérifier les messages en attente et le déclencheur `relancerEmails` dans
  Apps Script. Conserver l’identifiant de la ligne de test pour la retirer
  manuellement du tableau avant exploitation.
- Confirmer les horaires pour les ajouter à la page et aux
  emails. Vérifier les accès privés du tableau.

## Vérifications locales sans envoi

`npm run test:rebais` utilise des services simulés pour les scénarios d’échec,
de doublon et d’envoi partiel. Aucun de ces tests n’envoie de mail réel.

`npm run build`, puis `npm run preview:rebais`, ouvre un aperçu local sur
`http://localhost:4321/interclubs-rebais-2026`, avec la véritable validation API.
Sans variables configurées, les envois répondent avec une indisponibilité ; il
n’y a pas de faux succès. `npm run dev` seul sert les pages Astro, mais pas la
fonction Vercel située dans `api/`.

## Références techniques

- [Applications Web Apps Script](https://developers.google.com/apps-script/guides/web)
- [Quotas Google Apps Script](https://developers.google.com/apps-script/guides/services/quotas)
- [Fonctions Node Vercel dans api/](https://vercel.com/docs/functions/runtimes/node-js)

Documentation vérifiée le 27 septembre 2026 ; les quotas dépendent du compte et
peuvent évoluer.
