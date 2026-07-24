import React, { useState, useMemo } from "react";
import "../styles/bibliotheque.css";
import { EXERCICES } from "../data/bibliotheque-exercices.js";

/* ==========================================================================
   BIBLIOTHÈQUE ÉNERGÉTIQUE ET MÉCANIQUE — SBF & BOXE ANGLAISE
   ========================================================================== */

const C = {
  papier: "#EAE6DC",
  papierClair: "#F5F2EA",
  encre: "#14181C",
  encreDouce: "#4A5158",
  trait: "#C9C2B2",
  alactique: "#C4142B",
  lactique: "#B25A00",
  aerobie: "#0E5C63",
  mecanique: "#3E3573",
};

const FILIERES = {
  alactique: {
    nom: "Anaérobie alactique",
    court: "Alactique",
    couleur: C.alactique,
    repere: "Phosphagènes. Effort maximal de 2 à 10 s, restauration lente.",
  },
  lactique: {
    nom: "Anaérobie lactique",
    court: "Lactique",
    couleur: C.lactique,
    repere: "Glycolyse. Effort intense de 15 s à 2 min, accumulation d'ions H+.",
  },
  aerobie: {
    nom: "Aérobie",
    court: "Aérobie",
    couleur: C.aerobie,
    repere: "Oxydatif. Soutien de l'effort et vitesse de récupération entre les séquences.",
  },
  mecanique: {
    nom: "Qualités mécaniques",
    court: "Mécanique",
    couleur: C.mecanique,
    repere: "Force, vitesse, puissance et raideur. Support de toutes les filières.",
  },
};

/* --------------------------------------------------------------------------
   EXERCICES
   cible : capacite | puissance | force | vitesse
   spec  : specifique | oriente | general
   -------------------------------------------------------------------------- */


/* --------------------------------------------------------------------------
   TESTS D'ÉVALUATION
   -------------------------------------------------------------------------- */

const TESTS = [
  {
    id: "t-ae-01",
    nom: "Test progressif de terrain type Vameval",
    filiere: "aerobie",
    mesure: "Vitesse maximale aérobie",
    materiel: ["Piste balisée tous les 20 m", "Bande sonore", "Cardiofréquencemètre"],
    protocole: [
      "Baliser un anneau avec un plot tous les 20 m.",
      "Départ à 8 km/h, augmentation de 0,5 km/h toutes les minutes.",
      "L'athlète doit se trouver à hauteur d'un plot à chaque signal sonore.",
      "Arrêt après deux retards consécutifs supérieurs à 2 m.",
    ],
    indicateur: "Vitesse du dernier palier complété, exprimée en km/h.",
    exploitation:
      "Sert à calculer toutes les allures de la saison. Le 30-30 se court à 100-105 % de cette valeur, le travail long à 90-95 %, la capacité aérobie à 65-75 %.",
    frequence: "Début de cycle, puis toutes les huit à dix semaines.",
    precaution: "Échauffement de quinze minutes. Test non réalisable en début de semaine chargée.",
  },
  {
    id: "t-ae-02",
    nom: "Test intermittent navette 30-15",
    filiere: "aerobie",
    mesure: "Vitesse intermittente et capacité de récupération",
    materiel: ["Couloir de 40 m", "Bande sonore", "Plots"],
    protocole: [
      "Alternance de 30 s de course navette et de 15 s de marche.",
      "Départ à 8 km/h, augmentation de 0,5 km/h par palier.",
      "Arrêt lorsque l'athlète ne rejoint plus la zone de 3 m au signal, deux fois de suite.",
    ],
    indicateur: "Vitesse du dernier palier tenu, propre au format intermittent.",
    exploitation:
      "Plus pertinente que la vitesse continue pour calibrer les séances fractionnées, car elle intègre les changements de direction et la capacité de récupération.",
    frequence: "Deux à trois fois par saison.",
    precaution: "Nécessite une surface non glissante et des athlètes rodés aux demi-tours.",
  },
  {
    id: "t-ae-03",
    nom: "Test de six minutes",
    filiere: "aerobie",
    mesure: "Distance parcourue en six minutes",
    materiel: ["Piste ou parcours mesuré", "Chronomètre"],
    protocole: [
      "Courir la plus grande distance possible en six minutes, allure libre.",
      "Relever la distance totale au mètre près.",
    ],
    indicateur: "Distance en mètres. Une estimation de vitesse maximale aérobie s'obtient en divisant la distance par 100.",
    exploitation:
      "Test de repli quand le matériel manque. Utile en début de saison sur un groupe nombreux, il se réalise en une seule vague.",
    frequence: "Toutes les six à huit semaines.",
    precaution: "Très dépendant de la gestion d'allure, donc peu fiable chez le débutant.",
  },
  {
    id: "t-ae-04",
    nom: "Indice de récupération cardiaque",
    filiere: "aerobie",
    mesure: "Chute de la fréquence cardiaque en une minute",
    materiel: ["Cardiofréquencemètre"],
    protocole: [
      "Réaliser un effort intense de deux minutes amenant la fréquence cardiaque au-dessus de 90 % du maximum.",
      "Relever la fréquence à l'arrêt, puis exactement soixante secondes plus tard en position debout immobile.",
      "Calculer la différence entre les deux valeurs.",
    ],
    indicateur: "Nombre de battements perdus en une minute. Au-delà de trente, la récupération est considérée comme bonne.",
    exploitation:
      "Suivi longitudinal de l'état de forme. Une baisse répétée de l'indice à charge égale signale une fatigue accumulée.",
    frequence: "Mensuelle, dans des conditions identiques.",
    precaution: "Valeur sensible à la température, à l'hydratation et au stress. Comparer uniquement des conditions comparables.",
  },
  {
    id: "t-ae-05",
    nom: "Test spécifique cinq blocs de sac",
    filiere: "aerobie",
    mesure: "Endurance spécifique de frappe",
    materiel: ["Sac de frappe", "Compteur de touches ou vidéo", "Cardiofréquencemètre"],
    protocole: [
      "Cinq blocs de trois minutes à cadence libre maximale tenable, une minute de récupération.",
      "Compter les touches de chaque bloc et relever la fréquence cardiaque en fin de bloc.",
    ],
    indicateur: "Total de touches, écart entre le premier et le dernier bloc, fréquence cardiaque moyenne.",
    exploitation:
      "Le total renseigne sur la capacité de travail, l'écart entre blocs sur la résistance à la fatigue. Une progression du total à fréquence cardiaque égale traduit un gain d'efficience.",
    frequence: "Toutes les huit semaines.",
    precaution: "Le comptage manuel demande un observateur entraîné. La vidéo au ralenti reste plus fiable.",
  },
  {
    id: "t-la-01",
    nom: "Course de 400 m chronométrée",
    filiere: "lactique",
    mesure: "Puissance anaérobie lactique",
    materiel: ["Piste", "Chronomètre"],
    protocole: [
      "Après un échauffement complet incluant deux accélérations progressives, courir 400 m le plus vite possible.",
      "Relever le temps final et, si possible, le passage à 200 m.",
    ],
    indicateur: "Temps total et écart entre les deux moitiés de course.",
    exploitation:
      "Le temps mesure la puissance lactique, l'écart entre les deux moitiés renseigne sur la tolérance. Un écart supérieur à quatre secondes signale un déficit de capacité.",
    frequence: "Deux fois par saison, en dehors des périodes de compétition.",
    precaution: "Test très éprouvant. Prévoir 72 h sans travail intense après.",
  },
  {
    id: "t-la-02",
    nom: "Test de sprints répétés type RAST",
    filiere: "lactique",
    mesure: "Puissance et indice de fatigue",
    materiel: ["Couloir de 35 m", "Chronomètre", "Balance"],
    protocole: [
      "Six sprints de 35 m séparés de dix secondes de récupération.",
      "Chronométrer chaque sprint au dixième de seconde.",
      "Calculer la puissance de chaque sprint à partir de la masse corporelle, de la distance et du temps.",
    ],
    indicateur: "Puissance maximale, puissance moyenne et indice de fatigue exprimé en pourcentage de chute.",
    exploitation:
      "Un indice de chute élevé avec une puissance maximale correcte oriente vers un travail de capacité lactique et de soutien aérobie.",
    frequence: "Deux à trois fois par saison.",
    precaution: "La récupération de dix secondes doit être strictement respectée, sinon les valeurs deviennent incomparables.",
  },
  {
    id: "t-la-03",
    nom: "Test de frappe maximale de quarante-cinq secondes",
    filiere: "lactique",
    mesure: "Tolérance spécifique",
    materiel: ["Sac de frappe", "Vidéo", "Échelle de perception"],
    protocole: [
      "Frapper à cadence et intensité maximales pendant quarante-cinq secondes.",
      "Découper l'enregistrement en trois tranches de quinze secondes et compter les touches de chaque tranche.",
      "Relever la perception de l'effort à la fin.",
    ],
    indicateur: "Total de touches et pourcentage de chute entre la première et la dernière tranche.",
    exploitation:
      "Une chute supérieure à 25 % traduit une capacité lactique insuffisante pour tenir une fin de reprise disputée.",
    frequence: "Toutes les huit semaines.",
    precaution: "Vérifier la qualité des protections de poignet avant le test.",
  },
  {
    id: "t-la-04",
    nom: "Simulation de trois reprises avec notation",
    filiere: "lactique",
    mesure: "Endurance spécifique en opposition",
    materiel: ["Partenaire", "Protections", "Vidéo"],
    protocole: [
      "Trois reprises au format de compétition contre un partenaire de niveau comparable.",
      "Compter le nombre d'actions offensives abouties par reprise sur vidéo.",
      "Relever la fréquence cardiaque en fin de chaque reprise et la perception de l'effort.",
    ],
    indicateur: "Volume d'actions par reprise et courbe d'évolution sur les trois reprises.",
    exploitation:
      "Un effondrement du volume en troisième reprise, sans dérive cardiaque marquée, oriente vers un déficit technique ou tactique plutôt qu'énergétique.",
    frequence: "Deux fois par cycle de préparation.",
    precaution: "Encadrement identique à celui d'une opposition classique. Ce n'est pas un test à réaliser sans arbitrage.",
  },
  {
    id: "t-al-01",
    nom: "Sprint chronométré sur dix et vingt mètres",
    filiere: "alactique",
    mesure: "Accélération et vitesse",
    materiel: ["Cellules photoélectriques ou chronomètre", "Plots"],
    protocole: [
      "Trois sprints maximaux avec trois minutes de récupération.",
      "Relever le temps aux dix mètres et aux vingt mètres.",
      "Conserver le meilleur essai.",
    ],
    indicateur: "Temps sur chaque distance et différence entre les deux, qui renseigne sur la phase de lancement.",
    exploitation:
      "Un bon temps sur dix mètres avec un temps faible sur la seconde portion oriente vers un travail de vitesse maximale plutôt que d'accélération.",
    frequence: "Toutes les six à huit semaines.",
    precaution: "Le chronométrage manuel introduit une erreur importante. Utiliser le même opérateur et la même méthode à chaque fois.",
  },
  {
    id: "t-al-02",
    nom: "Détente verticale avec et sans contre-mouvement",
    filiere: "alactique",
    mesure: "Puissance des membres inférieurs et qualité élastique",
    materiel: ["Tapis de détente ou application vidéo"],
    protocole: [
      "Trois sauts sans contre-mouvement, départ maintenu trois secondes en flexion.",
      "Trois sauts avec contre-mouvement libre.",
      "Conserver la meilleure hauteur de chaque forme.",
    ],
    indicateur: "Hauteur des deux formes de saut et indice d'élasticité, soit l'écart relatif entre les deux.",
    exploitation:
      "Un écart inférieur à 10 % oriente vers un travail pliométrique. Un écart supérieur à 20 % avec des valeurs absolues faibles oriente vers un travail de force maximale.",
    frequence: "Toutes les quatre semaines, le suivi étant plus informatif que la valeur isolée.",
    precaution: "Toujours tester en début de séance, sur un athlète reposé.",
  },
  {
    id: "t-al-03",
    nom: "Saut en contrebas et indice de force réactive",
    filiere: "alactique",
    mesure: "Raideur et qualité de reprise d'appui",
    materiel: ["Caisson 30 cm", "Tapis de mesure"],
    protocole: [
      "Trois sauts depuis un caisson de 30 cm avec rebond immédiat.",
      "Relever la hauteur du rebond et le temps de contact au sol.",
      "Calculer le rapport de la hauteur sur le temps de contact.",
    ],
    indicateur: "Indice de force réactive exprimé en mètres par seconde.",
    exploitation:
      "Indicateur central pour les déplacements de boxe et pour l'appui de la jambe de soutien en savate. Il se dégrade précocement en cas de fatigue neuromusculaire.",
    frequence: "Toutes les quatre semaines, ou en suivi hebdomadaire pendant les cycles chargés.",
    precaution: "Ne pas augmenter la hauteur du caisson si le temps de contact dépasse 250 ms.",
  },
  {
    id: "t-al-04",
    nom: "Fréquence gestuelle sur dix secondes",
    filiere: "alactique",
    mesure: "Vitesse gestuelle spécifique",
    materiel: ["Sac ou cible", "Vidéo"],
    protocole: [
      "Frapper le plus grand nombre de fois possible en dix secondes sur un enchaînement imposé.",
      "Deux essais séparés de trois minutes, conserver le meilleur.",
    ],
    indicateur: "Nombre de touches valides, une touche non appuyée n'étant pas comptabilisée.",
    exploitation:
      "Complément indispensable des tests de puissance, une frappe rapide mais non appuyée n'ayant aucune valeur en opposition.",
    frequence: "Toutes les six semaines.",
    precaution: "Définir précisément le critère de validité de la touche avant le premier test, et ne plus en changer.",
  },
  {
    id: "t-al-05",
    nom: "Capacité de répétition de sprints",
    filiere: "alactique",
    mesure: "Résistance à la fatigue en effort bref répété",
    materiel: ["Couloir balisé", "Chronomètre"],
    protocole: [
      "Six sprints de six secondes séparés de vingt-quatre secondes de récupération passive.",
      "Relever la distance ou le temps de chaque répétition.",
    ],
    indicateur: "Pourcentage de chute entre la meilleure et la moyenne des répétitions.",
    exploitation:
      "Un indice de chute supérieur à 8 % chez un athlète rapide indique un soutien aérobie insuffisant, et non un déficit de vitesse.",
    frequence: "Toutes les huit semaines.",
    precaution: "Respecter la récupération passive, une récupération active modifiant sensiblement les résultats.",
  },
  {
    id: "t-me-01",
    nom: "Charge maximale estimée sur cinq répétitions",
    filiere: "mecanique",
    mesure: "Force maximale",
    materiel: ["Barre", "Rack", "Pareur"],
    protocole: [
      "Après montée en charge progressive, réaliser une série de cinq répétitions maximales sur squat puis sur tirage.",
      "Estimer la charge maximale théorique à partir de la charge soulevée et du nombre de répétitions.",
    ],
    indicateur: "Charge maximale estimée, rapportée au poids de corps.",
    exploitation:
      "Le rapport à la masse corporelle prime sur la valeur absolue dans un sport à catégories de poids. Sert à calibrer les pourcentages de charge du cycle suivant.",
    frequence: "Début et fin de cycle de force, soit toutes les huit à douze semaines.",
    precaution: "Réservé aux athlètes ayant une technique stabilisée. La série de cinq est préférée à la répétition unique.",
  },
  {
    id: "t-me-02",
    nom: "Lancer de medecine ball assis",
    filiere: "mecanique",
    mesure: "Puissance du haut du corps",
    materiel: ["Medecine ball 3 kg", "Mètre ruban", "Mur"],
    protocole: [
      "Assis dos au mur, jambes tendues, lancer la balle vers l'avant à deux mains depuis la poitrine.",
      "Trois essais séparés d'une minute, conserver la meilleure distance.",
    ],
    indicateur: "Distance en centimètres, mesurée au point de premier contact au sol.",
    exploitation:
      "Test simple et fiable pour suivre la puissance de poussée, indépendamment de la contribution des jambes que la position assise neutralise.",
    frequence: "Toutes les six semaines.",
    precaution: "Fixer une fois pour toutes la position de départ, un décollement du dos faussant la comparaison.",
  },
  {
    id: "t-me-03",
    nom: "Amplitude active de hanche en abduction",
    filiere: "mecanique",
    mesure: "Mobilité spécifique du chassé et du fouetté haut",
    materiel: ["Mur", "Goniomètre ou application de mesure d'angle"],
    protocole: [
      "En appui latéral contre un mur, élever la jambe libre en abduction sans inclinaison du tronc.",
      "Mesurer l'angle atteint activement, puis l'angle atteint avec assistance manuelle.",
      "Répéter des deux côtés.",
    ],
    indicateur: "Angle actif, angle passif et écart entre les deux, appelé déficit de contrôle.",
    exploitation:
      "Un déficit important signale que l'amplitude existe mais n'est pas contrôlée activement, situation fréquente avant une lésion des adducteurs chez le savateur.",
    frequence: "Mensuelle, et systématiquement après toute gêne inguinale.",
    precaution: "Mesure à réaliser après échauffement, jamais à froid.",
  },
];

/* --------------------------------------------------------------------------
   REPÈRES DE PROGRAMMATION
   -------------------------------------------------------------------------- */

const PROFIL = [
  {
    titre: "Savate boxe française",
    lignes: [
      "Assaut ou combat de trois à cinq reprises de deux minutes, une minute de récupération.",
      "Séquences d'action de deux à huit secondes, entrecoupées de phases d'observation.",
      "Sollicitation supplémentaire des fléchisseurs de hanche et de la jambe d'appui.",
    ],
  },
  {
    titre: "Boxe anglaise amateur",
    lignes: [
      "Trois reprises de trois minutes, une minute de récupération.",
      "Densité d'échange plus élevée, avec des séquences plus longues et moins de rupture.",
      "Contrainte majeure sur la ceinture scapulaire et le maintien de la garde.",
    ],
  },
  {
    titre: "Conséquence pour l'entraînement",
    lignes: [
      "L'aérobie n'est pas la filière dominante de l'action, mais elle conditionne la récupération entre les séquences et entre les reprises.",
      "L'alactique produit les actions décisives, le lactique détermine la capacité à les répéter en fin de reprise.",
      "Aucune de ces filières ne se travaille utilement sans un socle de force et de raideur suffisant.",
    ],
  },
];

const ORDRE_SEANCE = [
  { rang: "1", intitule: "Vitesse et alactique", detail: "Sur athlète frais, juste après l'échauffement. Volume faible, récupérations complètes." },
  { rang: "2", intitule: "Puissance et pliométrie", detail: "Avant toute fatigue métabolique. La qualité du geste est le seul juge." },
  { rang: "3", intitule: "Force maximale", detail: "Après le travail explosif, avant le travail énergétique long." },
  { rang: "4", intitule: "Puissance aérobie ou lactique", detail: "En seconde partie de séance, jamais avant un travail de vitesse." },
  { rang: "5", intitule: "Capacité aérobie", detail: "En fin de séance ou en séance séparée, éventuellement le lendemain matin." },
];

const REGLES_SEMAINE = [
  "Deux séances de puissance aérobie par semaine suffisent à maintenir le niveau en période de compétition.",
  "Une seule séance lactique lourde par semaine, deux au maximum en pleine préparation, jamais deux jours consécutifs.",
  "Le travail de vitesse et d'alactique se place à distance de toute séance lactique de la veille.",
  "Quarante-huit heures séparent une séance lactique d'une compétition ou d'un sparring intense.",
  "En semaine de compétition, le volume chute mais l'intensité se maintient sur des formats très courts.",
];

/* ==========================================================================
   INTERFACE
   ========================================================================== */

const CIBLES = {
  capacite: "Capacité",
  puissance: "Puissance",
  force: "Force",
  vitesse: "Vitesse",
};

const QUALITES = {
  force: "Force",
  vitesse: "Vitesse",
  puissance: "Puissance",
  endurance: "Endurance",
};

const SPECS = {
  specifique: "Spécifique",
  oriente: "Orienté",
  general: "Général",
};

function Frise({ effort, couleur }) {
  const total = effort.travail + effort.recup;
  const n = Math.min(effort.series, 10);
  const segments = [];
  for (let i = 0; i < n; i++) {
    segments.push(
      <div key={"t" + i} className="h-full" style={{ flexGrow: effort.travail / total, background: couleur }} />
    );
    if (effort.recup > 0) {
      segments.push(
        <div
          key={"r" + i}
          className="h-full"
          style={{ flexGrow: effort.recup / total, background: couleur, opacity: 0.16 }}
        />
      );
    }
  }
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
        {segments}
      </div>
      <div
        className="mt-1 flex justify-between"
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.encreDouce }}
      >
        <span>
          {effort.travail < 1
            ? Math.round(effort.travail * 60) + " s"
            : effort.travail + " min"}{" "}
          de travail
        </span>
        <span>
          {effort.recup === 0
            ? "continu"
            : (effort.recup < 1 ? Math.round(effort.recup * 60) + " s" : effort.recup + " min") + " de récupération"}
        </span>
      </div>
    </div>
  );
}

function Puce({ children, actif, onClick, couleur }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 text-xs tracking-wide transition-colors"
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        border: "1px solid " + (actif ? couleur || C.encre : C.trait),
        background: actif ? couleur || C.encre : "transparent",
        color: actif ? C.papierClair : C.encreDouce,
      }}
    >
      {children}
    </button>
  );
}

function Etiquette({ children, couleur }) {
  return (
    <span
      className="px-2 py-0.5 text-xs"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.06em",
        border: "1px solid " + (couleur || C.trait),
        color: couleur || C.encreDouce,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function CarteExercice({ ex, onOpen }) {
  const f = FILIERES[ex.filiere];
  return (
    <button
      onClick={() => onOpen(ex)}
      className="w-full p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2"
      style={{ background: C.papierClair, borderLeft: "3px solid " + f.couleur }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.1em",
            color: f.couleur,
            textTransform: "uppercase",
          }}
        >
          {f.court} · {CIBLES[ex.cible]}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.encreDouce }}>
          {SPECS[ex.spec]}
        </span>
      </div>
      <h3
        className="mb-2 leading-tight"
        style={{ fontFamily: "'Oswald', sans-serif", fontSize: 19, fontWeight: 500, color: C.encre }}
      >
        {ex.nom}
      </h3>
      <p className="mb-3 text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}>
        {ex.format}
      </p>
      <Frise effort={ex.effort} couleur={f.couleur} />
      <div className="mt-3 flex flex-wrap gap-1">
        {ex.qualites.map((q) => (
          <Etiquette key={q}>{QUALITES[q]}</Etiquette>
        ))}
        {ex.discipline !== "Les deux" && <Etiquette couleur={C.encre}>{ex.discipline}</Etiquette>}
      </div>
    </button>
  );
}

function Detail({ ex, onClose }) {
  React.useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!ex) return null;
  const f = FILIERES[ex.filiere];

  const Bloc = ({ titre, children }) => (
    <div className="mb-5">
      <h4
        className="mb-2"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: f.couleur,
        }}
      >
        {titre}
      </h4>
      <div className="text-sm leading-relaxed" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encre }}>
        {children}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(20,24,28,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl"
        style={{ background: C.papierClair, borderTop: "4px solid " + f.couleur }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-3">
          <div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                color: f.couleur,
                textTransform: "uppercase",
              }}
            >
              {f.nom} · {CIBLES[ex.cible]}
            </span>
            <h2
              className="mt-1 leading-tight"
              style={{ fontFamily: "'Oswald', sans-serif", fontSize: 27, fontWeight: 500, color: C.encre }}
            >
              {ex.nom}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 px-3 py-1"
            style={{ border: "1px solid " + C.trait, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
          >
            Fermer
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-5 flex flex-wrap gap-1">
            <Etiquette couleur={f.couleur}>{SPECS[ex.spec]}</Etiquette>
            <Etiquette>{ex.discipline}</Etiquette>
            <Etiquette>{ex.niveau}</Etiquette>
            {ex.materiel.map((m) => (
              <Etiquette key={m}>{m}</Etiquette>
            ))}
          </div>

          <Bloc titre="Format">
            <p className="mb-3">{ex.format}</p>
            <Frise effort={ex.effort} couleur={f.couleur} />
          </Bloc>
          <Bloc titre="Consigne">{ex.consigne}</Bloc>
          <Bloc titre="Critères de réussite">
            <ul className="list-disc pl-5">
              {ex.criteres.map((c, i) => (
                <li key={i} className="mb-1">
                  {c}
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc titre="Erreurs fréquentes">
            <ul className="list-disc pl-5">
              {ex.erreurs.map((c, i) => (
                <li key={i} className="mb-1">
                  {c}
                </li>
              ))}
            </ul>
          </Bloc>
          <Bloc titre="Variantes">{ex.variantes}</Bloc>
          <Bloc titre="Progression">{ex.progression}</Bloc>
        </div>
      </div>
    </div>
  );
}

function CarteTest({ t }) {
  const f = FILIERES[t.filiere];
  return (
    <div className="p-5" style={{ background: C.papierClair, borderLeft: "3px solid " + f.couleur }}>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.1em",
          color: f.couleur,
          textTransform: "uppercase",
        }}
      >
        {f.court}
      </span>
      <h3
        className="mb-1 mt-1 leading-tight"
        style={{ fontFamily: "'Oswald', sans-serif", fontSize: 21, fontWeight: 500, color: C.encre }}
      >
        {t.nom}
      </h3>
      <p className="mb-4 text-sm italic" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}>
        {t.mesure}
      </p>

      <ol className="mb-4">
        {t.protocole.map((p, i) => (
          <li key={i} className="mb-2 flex gap-3 text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: f.couleur, paddingTop: 2 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ color: C.encre }}>{p}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-3 text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p style={{ color: C.encre }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: C.encreDouce }}>
            INDICATEUR{" "}
          </span>
          {t.indicateur}
        </p>
        <p style={{ color: C.encre }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: C.encreDouce }}>
            EXPLOITATION{" "}
          </span>
          {t.exploitation}
        </p>
        <p style={{ color: C.encreDouce }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em" }}>PRÉCAUTION </span>
          {t.precaution}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        <Etiquette couleur={f.couleur}>{t.frequence}</Etiquette>
        {t.materiel.map((m) => (
          <Etiquette key={m}>{m}</Etiquette>
        ))}
      </div>
    </div>
  );
}

function Champ({ label, valeur, onChange, suffixe }) {
  return (
    <label className="block">
      <span
        className="mb-1 block"
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: C.encreDouce, textTransform: "uppercase" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 focus:outline-none"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 15,
            border: "1px solid " + C.trait,
            background: "transparent",
            color: C.encre,
          }}
        />
        <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: C.encreDouce }}>{suffixe}</span>
      </div>
    </label>
  );
}

function Resultat({ label, valeur }) {
  return (
    <div className="flex items-baseline justify-between border-b py-1" style={{ borderColor: C.trait }}>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: C.encreDouce }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: C.encre }}>{valeur}</span>
    </div>
  );
}

function Calculateurs() {
  const [vma, setVma] = useState(16);
  const [fcRepos, setFcRepos] = useState(55);
  const [fcMax, setFcMax] = useState(195);
  const [charge, setCharge] = useState(80);
  const [reps, setReps] = useState(5);

  const v = parseFloat(vma) || 0;
  const ms = v / 3.6;
  const rm = (parseFloat(charge) || 0) * (1 + (parseFloat(reps) || 0) / 30);
  const zone = (p) => Math.round((parseFloat(fcRepos) || 0) + p * ((parseFloat(fcMax) || 0) - (parseFloat(fcRepos) || 0)));

  const Bloc = ({ titre, children }) => (
    <div className="p-5" style={{ background: C.papierClair }}>
      <h3
        className="mb-4"
        style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 500, color: C.encre }}
      >
        {titre}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Bloc titre="Allures depuis la VMA">
        <div className="mb-4">
          <Champ label="VMA" valeur={vma} onChange={setVma} suffixe="km/h" />
        </div>
        <Resultat label="30 s à 100 %" valeur={Math.round(ms * 30) + " m"} />
        <Resultat label="30 s à 105 %" valeur={Math.round(ms * 30 * 1.05) + " m"} />
        <Resultat label="15 s à 105 %" valeur={Math.round(ms * 15 * 1.05) + " m"} />
        <Resultat label="Bloc de 3 min à 92 %" valeur={Math.round(ms * 180 * 0.92) + " m"} />
        <Resultat label="Capacité aérobie" valeur={(v * 0.65).toFixed(1) + " à " + (v * 0.75).toFixed(1) + " km/h"} />
      </Bloc>

      <Bloc titre="Zones cardiaques">
        <div className="mb-4 flex gap-4">
          <Champ label="FC repos" valeur={fcRepos} onChange={setFcRepos} suffixe="bpm" />
          <Champ label="FC max" valeur={fcMax} onChange={setFcMax} suffixe="bpm" />
        </div>
        <Resultat label="Capacité aérobie" valeur={zone(0.6) + " à " + zone(0.7) + " bpm"} />
        <Resultat label="Seuil" valeur={zone(0.75) + " à " + zone(0.85) + " bpm"} />
        <Resultat label="Puissance aérobie" valeur={"au-delà de " + zone(0.9) + " bpm"} />
        <p className="mt-3 text-xs" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}>
          Méthode de la fréquence de réserve. La FC max se relève sur un test de terrain, elle ne s'estime pas par l'âge.
        </p>
      </Bloc>

      <Bloc titre="Charges de musculation">
        <div className="mb-4 flex gap-4">
          <Champ label="Charge" valeur={charge} onChange={setCharge} suffixe="kg" />
          <Champ label="Répétitions" valeur={reps} onChange={setReps} suffixe="reps" />
        </div>
        <Resultat label="Maximum estimé" valeur={rm.toFixed(1) + " kg"} />
        <Resultat label="Force maximale, 85 à 90 %" valeur={(rm * 0.85).toFixed(1) + " à " + (rm * 0.9).toFixed(1) + " kg"} />
        <Resultat label="Puissance, 30 à 40 %" valeur={(rm * 0.3).toFixed(1) + " à " + (rm * 0.4).toFixed(1) + " kg"} />
        <p className="mt-3 text-xs" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}>
          Estimation fiable jusqu'à six répétitions environ. Au-delà, elle surestime la charge maximale réelle.
        </p>
      </Bloc>
    </div>
  );
}

export default function Bibliotheque() {
  const [onglet, setOnglet] = useState("exercices");
  const [q, setQ] = useState("");
  const [fFiliere, setFFiliere] = useState([]);
  const [fCible, setFCible] = useState([]);
  const [fQualite, setFQualite] = useState([]);
  const [fSpec, setFSpec] = useState([]);
  const [selection, setSelection] = useState(null);
  const [fTest, setFTest] = useState([]);

  const bascule = (liste, set, val) =>
    set(liste.includes(val) ? liste.filter((x) => x !== val) : [...liste, val]);

  const exercices = useMemo(() => {
    const texte = q.trim().toLowerCase();
    return EXERCICES.filter((e) => {
      if (fFiliere.length && !fFiliere.includes(e.filiere)) return false;
      if (fCible.length && !fCible.includes(e.cible)) return false;
      if (fQualite.length && !e.qualites.some((x) => fQualite.includes(x))) return false;
      if (fSpec.length && !fSpec.includes(e.spec)) return false;
      if (texte && !(e.nom + " " + e.consigne + " " + e.format).toLowerCase().includes(texte)) return false;
      return true;
    });
  }, [q, fFiliere, fCible, fQualite, fSpec]);

  const tests = useMemo(
    () => (fTest.length ? TESTS.filter((t) => fTest.includes(t.filiere)) : TESTS),
    [fTest]
  );

  const filtresActifs = fFiliere.length + fCible.length + fQualite.length + fSpec.length + (q ? 1 : 0);

  const Onglet = ({ id, children }) => (
    <button
      onClick={() => setOnglet(id)}
      className="px-4 py-2"
      style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: 14,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: onglet === id ? C.papierClair : C.encre,
        background: onglet === id ? C.encre : "transparent",
        border: "1px solid " + C.encre,
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ background: C.papier, color: C.encre, border: "1px solid " + C.trait }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }`}</style>

      <header className="border-b px-4 py-6 sm:px-8" style={{ borderColor: C.trait }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-1 flex flex-wrap gap-1">
            {Object.entries(FILIERES).map(([k, f]) => (
              <span key={k} className="h-1 w-10" style={{ background: f.couleur }} />
            ))}
          </div>
          <h1
            className="leading-none"
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em" }}
          >
            FILIÈRES ET FRAPPES
          </h1>
          <p
            className="mt-2 max-w-2xl text-sm"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}
          >
            Bibliothèque d'exercices et de tests pour le développement énergétique et mécanique en savate boxe
            française et en boxe anglaise.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Onglet id="exercices">Exercices · {EXERCICES.length}</Onglet>
            <Onglet id="tests">Tests · {TESTS.length}</Onglet>
            <Onglet id="reperes">Repères</Onglet>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        {onglet === "exercices" && (
          <>
            <div className="mb-6 space-y-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Chercher un exercice, un format, une consigne"
                className="w-full px-3 py-2 focus:outline-none"
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 14,
                  border: "1px solid " + C.trait,
                  background: C.papierClair,
                  color: C.encre,
                }}
              />
              <div className="flex flex-wrap gap-1">
                {Object.entries(FILIERES).map(([k, f]) => (
                  <Puce
                    key={k}
                    couleur={f.couleur}
                    actif={fFiliere.includes(k)}
                    onClick={() => bascule(fFiliere, setFFiliere, k)}
                  >
                    {f.court}
                  </Puce>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(CIBLES).map(([k, l]) => (
                  <Puce key={k} actif={fCible.includes(k)} onClick={() => bascule(fCible, setFCible, k)}>
                    {l}
                  </Puce>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(QUALITES).map(([k, l]) => (
                  <Puce key={k} actif={fQualite.includes(k)} onClick={() => bascule(fQualite, setFQualite, k)}>
                    {l}
                  </Puce>
                ))}
                {Object.entries(SPECS).map(([k, l]) => (
                  <Puce key={k} actif={fSpec.includes(k)} onClick={() => bascule(fSpec, setFSpec, k)}>
                    {l}
                  </Puce>
                ))}
                {filtresActifs > 0 && (
                  <button
                    onClick={() => {
                      setQ("");
                      setFFiliere([]);
                      setFCible([]);
                      setFQualite([]);
                      setFSpec([]);
                    }}
                    className="px-3 py-1 text-xs underline"
                    style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}
                  >
                    Tout afficher
                  </button>
                )}
              </div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.encreDouce }}>
                {exercices.length} exercice{exercices.length > 1 ? "s" : ""}
              </p>
            </div>

            {exercices.length === 0 ? (
              <div className="p-8 text-center" style={{ background: C.papierClair }}>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}>
                  Aucun exercice ne correspond à cette combinaison. Retirez un filtre pour élargir la sélection.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {exercices.map((e) => (
                  <CarteExercice key={e.id} ex={e} onOpen={setSelection} />
                ))}
              </div>
            )}
          </>
        )}

        {onglet === "tests" && (
          <>
            <div className="mb-6 flex flex-wrap gap-1">
              {Object.entries(FILIERES).map(([k, f]) => (
                <Puce key={k} couleur={f.couleur} actif={fTest.includes(k)} onClick={() => bascule(fTest, setFTest, k)}>
                  {f.court}
                </Puce>
              ))}
              {fTest.length > 0 && (
                <button
                  onClick={() => setFTest([])}
                  className="px-3 py-1 text-xs underline"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}
                >
                  Tout afficher
                </button>
              )}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {tests.map((t) => (
                <CarteTest key={t.id} t={t} />
              ))}
            </div>
          </>
        )}

        {onglet === "reperes" && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 500 }}>
                Profil de l'activité
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                {PROFIL.map((p) => (
                  <div key={p.titre} className="p-5" style={{ background: C.papierClair }}>
                    <h3 className="mb-3" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 17, fontWeight: 500 }}>
                      {p.titre}
                    </h3>
                    <ul className="space-y-2 text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encre }}>
                      {p.lignes.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 500 }}>
                Les quatre registres
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(FILIERES).map(([k, f]) => (
                  <div key={k} className="p-4" style={{ background: C.papierClair, borderTop: "3px solid " + f.couleur }}>
                    <h3 className="mb-2" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, color: f.couleur }}>
                      {f.nom}
                    </h3>
                    <p className="text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encre }}>
                      {f.repere}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 500 }}>
                Ordre des qualités dans la séance
              </h2>
              <div style={{ background: C.papierClair }}>
                {ORDRE_SEANCE.map((o) => (
                  <div key={o.rang} className="flex gap-4 border-b p-4" style={{ borderColor: C.trait }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: C.encreDouce }}>
                      {o.rang}
                    </span>
                    <div>
                      <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 500 }}>{o.intitule}</h3>
                      <p className="text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encreDouce }}>
                        {o.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 500 }}>
                Règles de répartition hebdomadaire
              </h2>
              <ul className="space-y-2 p-5" style={{ background: C.papierClair }}>
                {REGLES_SEMAINE.map((r, i) => (
                  <li key={i} className="text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: C.encre }}>
                    {r}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-4" style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 500 }}>
                Calculateurs
              </h2>
              <Calculateurs />
            </section>
          </div>
        )}
      </main>

      <Detail ex={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
