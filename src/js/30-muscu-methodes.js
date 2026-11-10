
const METHODES_MUSCU = [
  {
    id: "wendler531", nom: "5/3/1 Wendler", categorie: "Force", couleur: "#FF4455", equipement: "salle", tmFactor: 0.9,
    description: "Progression lineaire sur 4 semaines basee sur 90% du 1RM (Training Max). 3 series par seance avec AMRAP sur la derniere. Augmenter TM de +2.5kg haut du corps / +5kg bas apres chaque cycle.",
    cycles: [
      { sem: "S1", label: "Semaine des 5",
        details: [
          { serie: 1, reps: "5",  pct: 70 },
          { serie: 2, reps: "5",  pct: 80 },
          { serie: 3, reps: "5+", pct: 88, amrap: true, note: "AMRAP - faire le maximum de reps" },
        ],
        note: "Base = 90% du 1RM reel (Training Max). Ex: 1RM 100kg = TM 90kg. S3 = 88% x 90kg = 79.2kg. On part deja haut pour que l'intensite soit sentie des la 1ere semaine.",
      },
      { sem: "S2", label: "Semaine des 3",
        details: [
          { serie: 1, reps: "3",  pct: 75 },
          { serie: 2, reps: "3",  pct: 87 },
          { serie: 3, reps: "3+", pct: 93, amrap: true, note: "AMRAP - aller au maximum" },
        ],
        note: "AMRAP a 93% TM est le test de progression. Objectif : > 4 reps = bon signe.",
      },
      { sem: "S3", label: "Semaine des 5/3/1",
        details: [
          { serie: 1, reps: "5",  pct: 80 },
          { serie: 2, reps: "3",  pct: 90 },
          { serie: 3, reps: "1+", pct: 100, amrap: true, note: "AMRAP - tout donner sur cette serie" },
        ],
        note: "Semaine la plus intense. AMRAP a 100% du TM (= 90% du 1RM reel) = vrai test de force du cycle. Les % de cette methode sont des % du TM : ils sont convertis automatiquement en % du 1RM a la creation de la seance.",
      },
      { sem: "S4", label: "Deload obligatoire",
        details: [
          { serie: 1, reps: "5", pct: 40 },
          { serie: 2, reps: "5", pct: 50 },
          { serie: 3, reps: "5", pct: 60 },
        ],
        note: "Recuperation SNC obligatoire. Ne pas chercher a progresser. Travail technique uniquement.",
      },
    ],
    exercices_type: ["Back Squat", "Developpe couche", "Souleve de terre", "Developpe militaire", "Rowing barre"],
    assistance: "Apres series principales : 50-100 reps assistance (Pulling, Core, Single-leg). Option BBB : 5x10 @ 50-60% TM sur le mouvement principal.",
  },
  {
    id: "force_hyp", nom: "Force-Hypertrophie (Pyramide ascendante)", categorie: "Force/Volume", couleur: "#FF7A00", equipement: "salle",
    description: "Structure pyramidale ascendante : montee progressive vers les charges maximales sur 5 series. Developpe force ET masse simultanement. Tres utilise en PPG handballeur.",
    cycles: [
      { sem: "S1-S2", label: "Accumulation volume",
        details: [
          { serie: 1, reps: "12", pct: 60, note: "Echauffement musculaire - technique parfaite" },
          { serie: 2, reps: "10", pct: 65 },
          { serie: 3, reps: "8",  pct: 70 },
          { serie: 4, reps: "6",  pct: 75 },
          { serie: 5, reps: "4",  pct: 80 },
        ],
        note: "Repos 2 min entre series. Bonne technique obligatoire sur toutes les series.",
      },
      { sem: "S3-S4", label: "Intensification",
        details: [
          { serie: 1, reps: "10", pct: 65, note: "Echauffement" },
          { serie: 2, reps: "6",  pct: 75 },
          { serie: 3, reps: "4",  pct: 82 },
          { serie: 4, reps: "2",  pct: 88 },
          { serie: 5, reps: "1",  pct: 93 },
        ],
        note: "Repos 3 min sur les series lourdes. Spotter obligatoire a partir de S4.",
      },
      { sem: "S5", label: "Test 1RM",
        details: [
          { serie: 1, reps: "5", pct: 60, note: "Echauffement general" },
          { serie: 2, reps: "3", pct: 75 },
          { serie: 3, reps: "1", pct: 87 },
          { serie: 4, reps: "1", pct: 95 },
          { serie: 5, reps: "1", pct: 100, note: "Tentative 1RM - uniquement si forme parfaite" },
        ],
        note: "Ne pas tenter le 1RM si fatigue. Reporter si besoin.",
      },
    ],
    exercices_type: ["Back Squat", "Developpe couche", "Souleve de terre", "Rowing barre"],
    assistance: "2-3 exercices accessoires en 3x8-12 apres les series principales.",
  },
  {
    id: "cinq_par_cinq", nom: "5x5 (Force de base)", categorie: "Force", couleur: "#38BDF8", equipement: "salle",
    description: "Methode lineaire classique en 6 semaines : on demarre en 5x5 a charge moderee, et chaque semaine la charge monte pendant que le nombre de series/repetitions diminue progressivement vers du 3x3 lourd. Simple, robuste, ideale pour construire une base de force sur les mouvements principaux avant d'introduire des methodes plus complexes.",
    cycles: [
      { sem: "S1", label: "5x5 - Installation",
        details: [
          { serie: 1, reps: "5", pct: 80, note: "Echauffement progressif avant la 1ere serie a charge de travail" },
          { serie: 2, reps: "5", pct: 80 },
          { serie: 3, reps: "5", pct: 80 },
          { serie: 4, reps: "5", pct: 80 },
          { serie: 5, reps: "5", pct: 80 },
        ],
        note: "Meme charge sur les 5 series. Repos 2-3 min. Objectif : technique irreprochable avant d'augmenter.",
      },
      { sem: "S2", label: "5x5 - Charge",
        details: [
          { serie: 1, reps: "5", pct: 85 },
          { serie: 2, reps: "5", pct: 85 },
          { serie: 3, reps: "5", pct: 85 },
          { serie: 4, reps: "5", pct: 85 },
          { serie: 5, reps: "5", pct: 85 },
        ],
        note: "+5% vs S1 si les 5x5 de la semaine precedente sont passes sans echec technique.",
      },
      { sem: "S3", label: "4x5 - Transition",
        details: [
          { serie: 1, reps: "5", pct: 85, note: "Echauffement" },
          { serie: 2, reps: "5", pct: 85 },
          { serie: 3, reps: "5", pct: 88 },
          { serie: 4, reps: "5", pct: 88 },
        ],
        note: "Une serie de moins, charge en hausse. Repos 2-3 min.",
      },
      { sem: "S4", label: "4x4 - Intensification",
        details: [
          { serie: 1, reps: "4", pct: 85, note: "Echauffement" },
          { serie: 2, reps: "4", pct: 88 },
          { serie: 3, reps: "4", pct: 90 },
          { serie: 4, reps: "4", pct: 90 },
        ],
        note: "Repos 2-3 min. Technique surveillee de pres a cette charge.",
      },
      { sem: "S5", label: "3x3 - Charge lourde",
        details: [
          { serie: 1, reps: "3", pct: 88, note: "Echauffement" },
          { serie: 2, reps: "3", pct: 92 },
          { serie: 3, reps: "3", pct: 95 },
        ],
        note: "Repos 3 min. Derniere serie proche de l'echec technique mais jamais atteint. Spotter recommande.",
      },
      { sem: "S6", label: "3x3 - Pic / Test",
        details: [
          { serie: 1, reps: "3", pct: 90, note: "Echauffement" },
          { serie: 2, reps: "3", pct: 95 },
          { serie: 3, reps: "2-3", pct: 98, note: "Aller chercher la charge la plus lourde possible en gardant 1-2 reps en reserve, tres proche du 100%" },
        ],
        note: "Fin de cycle : reevaluer le 1RM avant de relancer un nouveau bloc de 6 semaines a charges actualisees.",
      },
    ],
    exercices_type: ["Back Squat", "Developpe couche", "Souleve de terre", "Rowing barre"],
    assistance: "1-2 exercices accessoires en 3x10-12 apres les series principales. Rester simple, l'accent est sur les mouvements principaux.",
  },
  {
    id: "conjuguee", nom: "Methode Conjuguee (Max Effort / Effort Dynamique)", categorie: "Force/Puissance", couleur: "#FF4455", equipement: "salle",
    description: "Deux types de seances distinctes sur la semaine : Max Effort (charges tres lourdes, faible volume) et Effort Dynamique (charges moderees, vitesse maximale de barre). Developpe la force maximale ET la capacite a l'exprimer vite - tres pertinent pour le handball.",
    cycles: [
      { sem: "Jour A", label: "Max Effort",
        details: [
          { serie: 1, reps: "3", pct: 75, note: "Echauffement" },
          { serie: 2, reps: "2", pct: 85 },
          { serie: 3, reps: "1", pct: 92 },
          { serie: 4, reps: "1", pct: 97, note: "Charge maximale du jour - viser une charge record sur 1-3 reps" },
        ],
        note: "Alterner le mouvement principal (squat, SDT variante, developpe) chaque semaine pour eviter la stagnation. Repos 3-4 min.",
      },
      { sem: "Jour B", label: "Effort Dynamique",
        details: [
          { serie: 1, reps: "3", pct: 60, note: "Vitesse de barre maximale sur chaque repetition" },
          { serie: 2, reps: "3", pct: 60 },
          { serie: 3, reps: "3", pct: 60 },
          { serie: 4, reps: "3", pct: 60 },
          { serie: 5, reps: "3", pct: 60 },
          { serie: 6, reps: "3", pct: 60 },
        ],
        note: "6 series de 3 reps a 60% du 1RM, chaque repetition executee a vitesse maximale. Repos court 45-60s. L'objectif n'est pas la charge mais l'explosivite.",
      },
    ],
    exercices_type: ["Back Squat", "Developpe couche", "Souleve de terre", "Rowing barre"],
    assistance: "Jour Max Effort : 2-3 accessoires en 3x8. Jour Effort Dynamique : travail de core et gainage explosif.",
  },
  {
    id: "volume_allemand", nom: "Volume Allemand (10x10)", categorie: "Volume/Force", couleur: "#7C6FFF", equipement: "salle",
    description: "10 series de 10 repetitions sur un meme mouvement a charge fixe et moderee. Methode tres exigeante en volume, utilisee en bloc court (2-3 semaines) pour un choc metabolique et un gain de force-volume combine.",
    cycles: [
      { sem: "S1", label: "Introduction",
        details: [
          { serie: 1, reps: "10", pct: 55, note: "Repos fixe 90s entre chaque serie, sur les 10 series" },
          { serie: 2, reps: "10", pct: 55 },
          { serie: 3, reps: "10", pct: 55 },
          { serie: 4, reps: "10", pct: 55 },
          { serie: 5, reps: "10", pct: 55 },
        ],
        note: "Meme charge sur toutes les series (representees ici x5, repeter le motif jusqu'a 10 series). Si les dernieres series tombent sous 10 reps completes, la charge est trop lourde.",
      },
      { sem: "S2-S3", label: "Charge",
        details: [
          { serie: 1, reps: "10", pct: 60 },
          { serie: 2, reps: "10", pct: 60 },
          { serie: 3, reps: "10", pct: 60 },
          { serie: 4, reps: "10", pct: 60 },
          { serie: 5, reps: "10", pct: 60 },
        ],
        note: "+5% seulement quand les 10 series de 10 sont toutes completees a la seance precedente. Bloc court : 2-3 semaines maximum, methode tres fatigante.",
      },
    ],
    exercices_type: ["Back Squat", "Developpe couche", "Rowing barre"],
    assistance: "Aucun accessoire lourd le meme jour - le mouvement principal en 10x10 suffit largement en volume. Core leger uniquement.",
  },
  {
    id: "pyramide_descendante", nom: "Pyramide Descendante", categorie: "Force", couleur: "#FFA420", equipement: "salle",
    description: "Inverse de la pyramide montante : on demarre lourd (apres echauffement complet) et la charge diminue pendant que les repetitions augmentent. Permet d'exprimer une charge proche du max en debut de seance, sur systeme nerveux frais.",
    cycles: [
      { sem: "Bloc unique", label: "Descente charge",
        details: [
          { serie: 1, reps: "2",  pct: 88, note: "Apres echauffement complet, systeme nerveux frais" },
          { serie: 2, reps: "4",  pct: 80 },
          { serie: 3, reps: "6",  pct: 72 },
          { serie: 4, reps: "8",  pct: 65 },
          { serie: 5, reps: "10", pct: 58, note: "Derniere serie, volume et fatigue metabolique" },
        ],
        note: "Repos 2-3 min sur les 2 premieres series, 90s ensuite. La charge lourde en premier permet une meilleure qualite technique qu'en fin de seance.",
      },
    ],
    exercices_type: ["Back Squat", "Developpe couche", "Souleve de terre"],
    assistance: "1-2 exercices accessoires en 3x10-12 apres la pyramide.",
  },
  {
    id: "clusters", nom: "Clusters (rest-pause intra-serie)", categorie: "Puissance", couleur: "#FFA420", equipement: "salle",
    description: "Un cluster = N reps separees par 10-15s de repos intra-serie. Ex : cluster de 4 @ 85% = 1 rep, pause 12s, 1 rep, pause 12s, 1 rep, pause 12s, 1 rep. Maintien de la velocite maximale a tres haute charge.",
    cycles: [
      { sem: "S1", label: "Introduction clusters",
        details: [
          { serie: 1, reps: "4 (1+1+1+1)", pct: 80, note: "15s de repos entre chaque rep - explosion max" },
          { serie: 2, reps: "4 (1+1+1+1)", pct: 82, note: "15s de repos entre chaque rep" },
          { serie: 3, reps: "4 (1+1+1+1)", pct: 85, note: "15s de repos entre chaque rep" },
        ],
        note: "Repos 3 min entre series. Priorite : explosion maximale sur chaque rep. Velocite > charge.",
      },
      { sem: "S2", label: "Developpement",
        details: [
          { serie: 1, reps: "4 (1+1+1+1)", pct: 83, note: "12s de repos intra-serie" },
          { serie: 2, reps: "4 (1+1+1+1)", pct: 87, note: "12s de repos intra-serie" },
          { serie: 3, reps: "3 (1+1+1)",   pct: 90, note: "12s intra - charge maximale" },
          { serie: 4, reps: "3 (1+1+1)",   pct: 90, note: "12s intra-serie" },
        ],
        note: "Reduire le repos intra a 12s. Augmenter la charge sur les 2 dernieres series.",
      },
      { sem: "S3", label: "Peak puissance",
        details: [
          { serie: 1, reps: "3 (1+1+1)", pct: 87, note: "10s de repos intra-serie" },
          { serie: 2, reps: "3 (1+1+1)", pct: 90, note: "10s de repos intra-serie" },
          { serie: 3, reps: "2 (1+1)",   pct: 93, note: "10s de repos intra-serie" },
          { serie: 4, reps: "2 (1+1)",   pct: 95, note: "10s intra - explosivite maximale" },
        ],
        note: "Repos 4 min entre series. Qualite > quantite. Arreter si la velocite chute.",
      },
    ],
    exercices_type: ["Squat saute (barre legere)", "Developpe couche explosif", "Epaule de force", "Deadlift explosif", "Arrache de force"],
    assistance: "Pas d'assistance lourde. Core et mobilite uniquement apres clusters.",
  },
  {
    id: "pliometrie", nom: "Pliometrie & Explosivite", categorie: "Puissance", couleur: "#38BDF8", equipement: "poids_corps",
    description: "Exploitation du cycle etirement-raccourcissement (CER). Priorite : temps de contact minimal au sol. Progresser de la stabilite vers la vitesse sur 4 semaines. Cle du handball haute performance.",
    cycles: [
      { sem: "S1", label: "Stabilisation & apprentissage",
        details: [
          { serie: 1, reps: "3x8 CMJ",             pct: 0, note: "Atterrissage silencieux 2 pieds, genou 90 degres, rester stable 2s avant de sauter" },
          { serie: 2, reps: "3x8 Drop jump 30cm",  pct: 0, note: "Chute, contact, repartir. Focus reception correcte" },
          { serie: 3, reps: "3x10 Bonds lat./cote",pct: 0, note: "Bond lateral : atterrissage stable AVANT de repartir" },
        ],
        note: "Repos 2 min. Volume total : max 80 contacts/seance. Pas de sprint. Focus technique.",
      },
      { sem: "S2", label: "Amplitude & hauteur",
        details: [
          { serie: 1, reps: "4x6 CMJ hauteur max",  pct: 0, note: "Bras libres, maximiser la hauteur. Balancer les bras." },
          { serie: 2, reps: "4x6 Box jump 50cm",    pct: 0, note: "Montee explosive, descente controlee en pas de course" },
          { serie: 3, reps: "4x6 Bounding",          pct: 0, note: "Foulees bondissantes, amplitude maximale, 20-30m" },
          { serie: 4, reps: "4x8 Lat. bound/cote",  pct: 0, note: "Repousser fort, atterrir equilibre avant repartir" },
        ],
        note: "Qualite > quantite. Repos 2-3 min. Volume : max 100 contacts/seance.",
      },
      { sem: "S3", label: "Vitesse & reactivite",
        details: [
          { serie: 1, reps: "4x5 Drop jump 40cm",    pct: 0, note: "Objectif : temps de contact < 200ms. Reactivite max." },
          { serie: 2, reps: "4x5x5m Skip frequence", pct: 0, note: "Cadence maximale, faible amplitude. Rapide." },
          { serie: 3, reps: "4x5 Lat. rapide/cote",  pct: 0, note: "Enchainer les bonds lateraux sans pause. Vitesse." },
          { serie: 4, reps: "4x(CMJ x3 enchaines)",  pct: 0, note: "Rebond immediat apres chaque reception. Pas de pause." },
        ],
        note: "Repos 3 min. Temps de contact minimal = objectif principal. Volume : max 80 contacts.",
      },
      { sem: "S4", label: "Transfert sportif + charge",
        details: [
          { serie: 1, reps: "4x5 CMJ leste 5-10%PC",  pct: 0, note: "Gilet leste ou barre legere sur epaules" },
          { serie: 2, reps: "4x5 Squat jump 30% 1RM",  pct: 0, note: "Decoller la barre des epaules a la reception" },
          { serie: 3, reps: "4x4 Bond + passe MB/cote", pct: 0, note: "Bond lateral + passe balle de handball en suspension" },
          { serie: 4, reps: "4x4 Drop jump + sprint 5m",pct: 0, note: "Reactivite vers acceleration immediate. Geste handball." },
        ],
        note: "Integration sportive. Repos 3-4 min. A placer 2-3 semaines avant debut PPS.",
      },
    ],
    exercices_type: ["CMJ", "Drop Jump", "Box Jump", "Bounding", "Lateral Bound", "Squat Jump charge"],
    assistance: "Core anti-rotation en fin de seance (Pallof press, Planche laterale). Pas de force lourde le meme jour.",
  },
  {
    id: "hypertrophie", nom: "Hypertrophie - PPG", categorie: "Volume", couleur: "#7C6FFF", equipement: "salle",
    description: "Bloc hypertrophie classique PPG. Volume eleve, charges moderees 60-80% 1RM, tempos controles. Objectif : augmenter la section transversale musculaire avant le bloc force.",
    cycles: [
      { sem: "S1-S2", label: "Adaptation metabolique",
        details: [
          { serie: 1, reps: "15", pct: 60, note: "Tempo : 3s descente, 1s pause bas, 1s montee. Sensation de brulure = bon signe." },
          { serie: 2, reps: "12", pct: 65, note: "Meme tempo controle" },
          { serie: 3, reps: "12", pct: 65, note: "Dernier set : RIR 2 (2 reps avant echec)" },
        ],
        note: "Repos 60-90s entre series. 6-8 exercices/seance. Volume total : 3x12-15.",
      },
      { sem: "S3-S4", label: "Volume maximal",
        details: [
          { serie: 1, reps: "12", pct: 65 },
          { serie: 2, reps: "10", pct: 70 },
          { serie: 3, reps: "10", pct: 72 },
          { serie: 4, reps: "10", pct: 75, note: "Dernier set : RIR 1 - 1 rep avant echec" },
        ],
        note: "Repos 90s. 4 series de travail. Augmenter la charge si RIR > 3.",
      },
      { sem: "S5-S6", label: "Intensification hypertrophie",
        details: [
          { serie: 1, reps: "10", pct: 70 },
          { serie: 2, reps: "8",  pct: 75 },
          { serie: 3, reps: "8",  pct: 78 },
          { serie: 4, reps: "6",  pct: 80, note: "RIR 1-2 - transition vers le bloc force" },
        ],
        note: "Repos 2 min. Reduire le nb exercices, augmenter les charges. Passerelle vers le bloc force.",
      },
    ],
    exercices_type: ["Presse a cuisses", "Developpe militaire", "Tractions lestees", "Rowing", "Fentes bulgares", "Hip Thrust"],
    assistance: "Super-sets agoniste/antagoniste recommandes (Biceps/Triceps, Chest/Back). Gainage 10 min en fin de seance.",
  },
  {
    id: "prevention", nom: "Renforcement Preventif Handball", categorie: "Prevention", couleur: "#4CAF50", equipement: "mixte",
    description: "Circuit preventif specifique handball. Priorite : ischio-jambiers (Nordic), epaule rotateurs, gainage, proprioception cheville. A integrer 2x/semaine toute la saison.",
    cycles: [
      { sem: "Continu", label: "Circuit hebdomadaire",
        details: [
          { serie: 1, reps: "3x6-8 (excentrique)",       pct: 0, note: "Nordic Hamstring Curl : freiner la descente 3-4s. Protege LCA." },
          { serie: 2, reps: "4x15-20",                   pct: 0, note: "Rotation externe elastique coude 90 degres : 3s excentrique. RE/RI >= 0.75." },
          { serie: 3, reps: "3x30s/cote",                pct: 0, note: "Proprioception plateau instable : yeux ouverts puis fermes." },
          { serie: 4, reps: "3x12/jambe",                pct: 0, note: "Hip Thrust unilateral : activer grand fessier = protection LCA." },
          { serie: 5, reps: "3x45s/cote",                pct: 0, note: "Planche laterale : gainage anti-valgus." },
          { serie: 6, reps: "3x10-15 (3s excentrique)",  pct: 0, note: "Elevation talon unilaterale excentrique : prevention tendinopathie Achille." },
        ],
        note: "2x/semaine toute la saison. Seance : 25-35 min. Ne jamais supprimer en periode competitive.",
      },
    ],
    exercices_type: ["Nordic Hamstring Curl", "Rotation externe elastique", "Hip Thrust", "Gainage lateral", "Proprioception plateau", "Elevation talon excentrique"],
    assistance: "Peut se faire en echauffement ou en fin de seance muscu.",
  },
  {
    id: "testing_charges", nom: "Testing - Charges par poids de corps", categorie: "Testing", couleur: "#EC4899", equipement: "salle",
    description: "Protocole de testing sur 4 mouvements fondamentaux. Calcul automatique des charges cibles selon le poids de corps du joueur. Reference : standards de force pour handballeur Nationale 1.",
    cycles: [
      { sem: "J1", label: "Squat + Bench",    series: 3, reps: "5-3-1", pct: [70, 85, 100] },
      { sem: "J2", label: "RDL + Rowing",     series: 3, reps: "5-3-1", pct: [70, 85, 100] },
      { sem: "J3", label: "Re-test + ajust.", series: 2, reps: "3",     pct: [90, 100]      },
    ],
    exercices_type: ["Back Squat", "Developpe couche", "Romanian Deadlift", "Rowing barre"],
    isTesting: true,
    niveaux: {
      squat:  { debutant:1.0, intermediaire:1.3, avance:1.6, elite:1.8 },
      bench:  { debutant:0.7, intermediaire:0.9, avance:1.1, elite:1.3 },
      rdl:    { debutant:1.1, intermediaire:1.4, avance:1.7, elite:2.0 },
      rowing: { debutant:0.7, intermediaire:0.9, avance:1.1, elite:1.3 },
    },
  },

  // ── BILANS DE DÉPART (séances test pour débutants en musculation) ───────────
  // Séances d'évaluation à placer en début de bloc / de prise en charge : elles mesurent la
  // mobilité, la coordination et la force sous-maximale (aucune recherche de max) pour décider
  // de la suite. Création de séance : tous les exercices sont pré-remplis et modifiables ensuite.
  {
    id: "bilan_bas_corps", nom: "Bilan de départ — Bas du corps", categorie: "Bilan de départ", couleur: "#14B8A6", equipement: "mixte",
    description: "Séance test bas du corps pour joueur débutant en musculation : mobilité (cheville, hanche), coordination et équilibre, patterns de base non chargés puis force sous-maximale. Sert de point de départ pour construire le premier bloc.",
    protocole: "Durée visée : 1h30 environ. Ordre : mobilité → équilibre → saut (frais) → force (Zercher, RDL, fente) → gainage anti-rotation. Force en peu de répétitions (3-5) : montée progressive en 2 séries d'approche, puis séries de travail à RPE 7-8 maximum (2 répétitions en réserve), jamais d'échec ni de recherche de max. Filmer de face et de profil. Noter pour chaque test : qualité (bonne / à corriger / douleur), asymétrie G-D, charge et répétitions. Arrêter au moindre signal de douleur.",
    isBilanDepart: true, cycles: [],
    exercicesRef: [
      { nom: "Knee-to-wall test (mobilité cheville)", biblio: "Knee-to-wall test", series: 2, reps: "3 essais / cheville", charge: "Poids de corps", repos: "15s",
        notes: "Pied face au mur, talon au sol, le genou doit toucher le mur. Reculer le pied par paliers et mesurer la distance orteil-mur. Repère : ≥ 10 cm. Écart G/D > 2 cm = asymétrie à travailler." },
      { nom: "Squat overhead (bâton, non chargé)", biblio: "Squat overhead", series: 2, reps: "5", charge: "Bâton / manche à balai", repos: "45s",
        notes: "Bâton bras tendus au-dessus de la tête, prise large, descendre le plus bas possible talons au sol. Observer : bras qui tombent vers l'avant (épaules / thoracique), talons qui décollent (cheville), genoux qui rentrent (valgus), dos qui s'arrondit (hanches). Filmer de face et de profil." },
      { nom: "Équilibre unipodal (yeux ouverts puis fermés)", biblio: "Équilibre unipodal", series: 2, reps: "30 s / jambe", charge: "Poids de corps", repos: "30s",
        notes: "Une jambe, bassin à plat, bras le long du corps. Yeux ouverts puis fermés. Repère débutant : 30 s yeux ouverts, 10 s yeux fermés. Noter la jambe la moins stable." },
      { nom: "Broad Jump", biblio: "Broad Jump", series: 3, reps: "3", charge: "Poids de corps", repos: "75s",
        notes: "Fait frais, avant la force : coordination, puissance et qualité de réception (amortie, genoux alignés, tenir 2 s). Mesurer la distance (cm) du meilleur essai. Arrêter si les réceptions se dégradent." },
      { nom: "Zercher Squat", biblio: "Zercher Squat", series: 4, reps: "4", charge: "Montée progressive : 2 séries d'approche puis RPE 7-8", repos: "2'30",
        notes: "Barre dans le creux des coudes (mettre une mousse / un pad), buste haut, descente en 3 s, remontée contrôlée. Séries d'approche : barre vide ×5 puis ~50 % de la charge de travail ×4. Séries de travail : 4 répétitions à RPE 7-8 (2 en réserve). Noter la charge de référence et la profondeur atteinte : sert de base pour prescrire le squat du premier bloc. Si l'inconfort aux coudes gêne : goblet squat lourd en remplacement." },
      { nom: "Romanian Deadlift (RDL)", biblio: "Romanian Deadlift (RDL)", series: 3, reps: "5", charge: "Barre, RPE 7", repos: "2'",
        notes: "Test de charnière de hanche : dos neutre, hanches vers l'arrière, barre proche des jambes, descente en 3 s. Remonter dès que les ischios sont en tension. Si le dos s'arrondit : réduire l'amplitude et rester au bâton / barre vide." },
      { nom: "Fente arrière", biblio: "Fente arrière", series: 3, reps: "5 / jambe", charge: "Haltères modérés (RPE 7)", repos: "90s",
        notes: "Contrôle du genou (pas de valgus), tronc droit, descente en 2-3 s. Comparer G/D : stabilité, amplitude, charge tolérée, tremblements. Commencer au poids de corps si le pattern est instable." },
      { nom: "Glute Bridge unilatéral", biblio: "Glute Bridge", series: 2, reps: "8 / jambe", charge: "Poids de corps", repos: "45s",
        notes: "Évalue l'activation des fessiers et l'asymétrie. Bassin stable, sans rotation. Une jambe qui fatigue ou crampe aux ischios = fessier sous-actif. Tenir 2 s en haut." },
      { nom: "Pallof Press (gainage anti-rotation)", biblio: "Pallof Press", series: 3, reps: "8 / côté", charge: "Élastique ou poulie, moyen", repos: "45s",
        notes: "Debout de profil à l'ancrage, pousser les mains devant la poitrine et tenir 2 s, bassin et épaules face à l'avant sans se laisser tourner. Évaluer : capacité à résister à la rotation, asymétrie G/D. Variante plus dure : demi-genou ou en fente." },
    ],
  },
  {
    id: "bilan_haut_corps", nom: "Bilan de départ — Haut du corps", categorie: "Bilan de départ", couleur: "#14B8A6", equipement: "mixte",
    description: "Séance test haut du corps pour joueur débutant en musculation : mobilité scapulaire et thoracique, stabilité et coordination, puis force de poussée / tirage et puissance (lancer) en sous-maximal. Point de départ pour le premier bloc.",
    protocole: "Ordre : mobilité scapulaire/thoracique → stabilité/coordination → force sous-maximale → puissance. Charges légères (RPE ≤ 7), aucune recherche de max. Noter pour chaque test : qualité (bonne / à corriger / douleur), asymétrie G-D, charge et répétitions. Arrêter au moindre signal de douleur à l'épaule.",
    isBilanDepart: true, cycles: [],
    exercicesRef: [
      { nom: "Wall Angel (mobilité épaules / thoracique)", biblio: "Wall Angel", series: 2, reps: "8", charge: "Poids de corps", repos: "30s",
        notes: "Dos, bassin et tête contre le mur, bras en « W » puis monter en « Y » sans décoller lombaires, coudes ni poignets. Noter le côté qui décolle en premier." },
      { nom: "Rotation thoracique (Open Book)", biblio: "Open Book", series: 2, reps: "8 / côté", charge: "Poids de corps", repos: "30s",
        notes: "Allongé sur le côté, genoux fléchis à 90°, ouvrir le bras en suivant la main du regard. L'épaule touche-t-elle le sol ? Comparer G/D." },
      { nom: "Apley test (mobilité épaule)", biblio: "Apley test", series: 1, reps: "1 essai / côté", charge: "Poids de corps", repos: "20s",
        notes: "Une main par-dessus l'épaule, l'autre derrière le bas du dos : mesurer l'écart entre les doigts (cm). Écart important ou forte asymétrie = priorité mobilité." },
      { nom: "Planche + touche d'épaule", biblio: "Planche + touche d'épaule", series: 2, reps: "10 / côté", charge: "Poids de corps", repos: "45s",
        notes: "Pieds écartés pour faciliter, bassin immobile (pas de balancement). Évalue la stabilité scapulaire, l'anti-rotation et la coordination." },
      { nom: "Pompes", biblio: "Pompes", series: 2, reps: "max propres", charge: "Poids de corps (sur genoux ou mains surélevées si besoin)", repos: "90s",
        notes: "Test de force de poussée : corps gainé, poitrine proche du sol, coudes ~45°. Compter les répétitions propres, arrêter à la première dégradation. Noter la variante utilisée pour comparer au re-test. Repère débutant : 8-10." },
      { nom: "Rowing haltère unilatéral", biblio: "Rowing haltère unilatéral", series: 3, reps: "8 / bras", charge: "Léger (RPE 6-7)", repos: "75s",
        notes: "Force de tirage + symétrie : dos plat, tirer le coude vers la hanche, sans rotation du tronc. Noter la charge de référence G/D." },
      { nom: "Traction australienne (rowing inversé)", biblio: "Traction australienne", series: 2, reps: "max propres (cible 8)", charge: "Poids de corps (barre basse / TRX)", repos: "90s",
        notes: "Corps gainé, poitrine vers la barre, omoplates serrées en haut. Noter la hauteur de barre ou l'inclinaison utilisée pour comparer au re-test." },
      { nom: "Développé couché", biblio: "Développé couché", series: 3, reps: "8", charge: "Barre vide ou haltères légers", repos: "90s",
        notes: "Pattern + estimation de charge : montée progressive jusqu'à RPE 7. Pieds ancrés, omoplates serrées, trajectoire régulière. La charge de 8 répétitions propres sert de base au bloc." },
      { nom: "Développé militaire", biblio: "Développé militaire", series: 2, reps: "8", charge: "Haltères légers (assis) ou barre vide", repos: "90s",
        notes: "Teste la mobilité overhead sous charge : bras à la verticale, sans cambrure excessive. Si les lombaires se cambrent : travailler d'abord la mobilité (Wall Angel, thoracique)." },
      { nom: "Med Ball Throw", biblio: "Med Ball Throw", series: 3, reps: "3", charge: "Médecine ball 3 kg", repos: "60s",
        notes: "Lancer poitrine à deux mains, intention maximale. Mesurer la distance (m) du meilleur lancer = puissance haut du corps (pertinent handball). Arrêter si la technique chute." },
    ],
  },
  {
    id: "bilan_mobilite_coordination", nom: "Bilan de départ — Mobilité & coordination", categorie: "Bilan de départ", couleur: "#14B8A6", equipement: "poids_corps",
    description: "Screening complet sans charge : mobilité (cheville, hanche, thoracique, épaule), équilibre et coordination. À faire seul ou avant les bilans de force, pour repérer les points à corriger en priorité.",
    protocole: "Aucune charge. Noter pour chaque test : réussi / limité / douleur, et l'asymétrie G-D. Filmer le squat overhead de face et de profil. Les limitations repérées ici déterminent les exercices de mobilité à intégrer aux échauffements du bloc.",
    isBilanDepart: true, cycles: [],
    exercicesRef: [
      { nom: "Squat overhead (bâton, non chargé)", biblio: "Squat overhead", series: 2, reps: "5", charge: "Bâton / manche à balai", repos: "45s",
        notes: "Test global : bras qui tombent (épaules / thoracique), talons qui décollent (cheville), genoux qui rentrent, dos qui s'arrondit (hanches). Filmer de face et de profil." },
      { nom: "Knee-to-wall test (mobilité cheville)", biblio: "Knee-to-wall test", series: 2, reps: "3 essais / cheville", charge: "Poids de corps", repos: "15s",
        notes: "Talon au sol, genou au mur : mesurer la distance orteil-mur. Repère : ≥ 10 cm. Écart G/D > 2 cm = asymétrie." },
      { nom: "Hip 90/90 (rotation de hanche)", biblio: "Hip 90/90", series: 2, reps: "5 transitions / côté", charge: "Poids de corps", repos: "30s",
        notes: "Assis au sol, jambes à 90°, buste droit. Passer d'un côté à l'autre sans les mains. Noter le côté limité et la compensation (buste qui se penche, mains qui poussent)." },
      { nom: "Fente + rotation thoracique", biblio: "Fente + rotation thoracique", series: 2, reps: "5 / côté", charge: "Poids de corps", repos: "30s",
        notes: "Grande fente, main au sol, ouvrir le bras vers le plafond en suivant du regard. Évalue fléchisseurs de hanche, rotation thoracique et stabilité du genou." },
      { nom: "Wall Angel (mobilité épaules / thoracique)", biblio: "Wall Angel", series: 2, reps: "8", charge: "Poids de corps", repos: "30s",
        notes: "Dos, bassin et tête contre le mur, bras en « W » puis « Y » sans décoller lombaires ni coudes. Noter le côté qui décolle en premier." },
      { nom: "Équilibre unipodal (yeux ouverts puis fermés)", biblio: "Équilibre unipodal", series: 2, reps: "30 s / jambe", charge: "Poids de corps", repos: "30s",
        notes: "Yeux ouverts puis fermés. Repère débutant : 30 s / 10 s. Noter la jambe la moins stable." },
      { nom: "Dead Bug", biblio: "Dead Bug", series: 2, reps: "8 / côté", charge: "Poids de corps", repos: "45s",
        notes: "Coordination controlatérale + gainage : lombaires collées au sol, mouvements lents et alternés. Noter si le bas du dos se cambre." },
      { nom: "Lancer-rattrapé alterné (balle de tennis)", biblio: "Lancer-rattrapé alterné", series: 3, reps: "30 s", charge: "Balle de tennis", repos: "30s",
        notes: "Mur à 2-3 m, lancer main droite / rattrapé main gauche en alternance, rythme régulier. Compter les balles tombées. Évalue la coordination oculo-manuelle et la latéralité (utile pour la passe)." },
    ],
  },

  // ── ÉPAULE ────────────────────────────────────────────────────────────────
  {
    id: "rehab_epaule",
    nom: "Rehab / Reathe - Epaule",
    categorie: "Rehabilitation",
    couleur: "#38BDF8",
    isRehab: true,
    articulation: "epaule",
    description: "Protocole progressif epaule 12 semaines : stabilisation scapulaire (S1-S3) > renforcement rotateurs (S4-S7) > force fonctionnelle (S8-S12). Progressivite semaine par semaine.",
    phases: [
      {
        id: "phase1", label: "Phase 1 - Controle neuro-musculaire", duree: "S1-S3",
        objectif: "Reduire douleur et inflammation. Activer stabilisateurs profonds. Pas de charge.",
        semaines: [
          {
            sem: "S1", titre: "Activation & anti-douleur",
            exercices: [
              { nom: "Pendule de Codman", series: 3, reps: "2x30s", charge: "Bras relache - gravite seule", repos: "60s", notes: "Cercles 20cm de diametre. Avant-arriere et cote-cote. Pas de contraction active." },
              { nom: "Isometrie RE mur (coude 90)", series: 3, reps: "8x5s", charge: "0 resistance", repos: "60s", notes: "Poing contre mur. Pousser sans bouger. 50% de la force max." },
              { nom: "Isometrie RI mur (coude 90)", series: 3, reps: "8x5s", charge: "0 resistance", repos: "60s", notes: "Face au mur, coude 90. 50% force max." },
              { nom: "Retraction scapulaire", series: 3, reps: "12", charge: "Corps", repos: "45s", notes: "Omoplates vers la colonne. Tenir 2s. Pas de tension cervicale." },
            ]
          },
          {
            sem: "S2", titre: "Consolidation isometrie",
            exercices: [
              { nom: "Pendule de Codman", series: 3, reps: "2x45s", charge: "Bras relache", repos: "60s", notes: "Augmenter le diametre des cercles. Rajouter mouvement en 8." },
              { nom: "Isometrie RE mur", series: 4, reps: "10x5s", charge: "0 resistance", repos: "60s", notes: "Augmenter a 70% force max. 4 series." },
              { nom: "Isometrie RI mur", series: 4, reps: "10x5s", charge: "0 resistance", repos: "60s", notes: "70% force max. Tenir 5s proprement." },
              { nom: "Retraction scapulaire", series: 3, reps: "15", charge: "Corps", repos: "45s", notes: "Tenir 3s en position fin. Depresser aussi les omoplates." },
              { nom: "Elevation laterale scapulaire", series: 3, reps: "15", charge: "Corps", repos: "45s", notes: "Hausser les epaules haut puis relacher lentement. Pas de coude flechis." },
            ]
          },
          {
            sem: "S3", titre: "Transition vers charge legere",
            exercices: [
              { nom: "Pendule Codman + poids leger", series: 3, reps: "2x45s", charge: "0.5 kg max", repos: "60s", notes: "Introduire 0.5 kg si douleur < 3/10." },
              { nom: "Isometrie RE + RI mur", series: 4, reps: "10x6s", charge: "0 resistance", repos: "60s", notes: "Maintenir 80% force max. Preparer la transition elastique." },
              { nom: "Retraction scapulaire", series: 3, reps: "15", charge: "Corps", repos: "45s", notes: "Tenir 4s. Ajouter legere depression scapulaire." },
              { nom: "Elevation laterale scapulaire", series: 3, reps: "20", charge: "Corps", repos: "45s", notes: "Volume augmente. Ralentir la phase descendante (2s)." },
              { nom: "Prone Y (allonge ventre)", series: 3, reps: "10", charge: "Corps", repos: "60s", notes: "Bras en Y au-dessus de la tete. Lever les bras en serrant les omoplates." },
            ]
          },
        ],
        exercices: [
          { nom: "Pendule de Codman", series: 3, reps: "2x30-45s", charge: "Corps/0.5kg", repos: "60s", notes: "S1 cercles simples - S2 amplitude max - S3 + 0.5kg si douleur<3/10" },
          { nom: "Isometrie RE/RI mur", series: "3-4", reps: "8-10x5-6s", charge: "0 resistance", repos: "60s", notes: "S1 50% force - S2 70% - S3 80%. 4 series en S3." },
          { nom: "Retraction scapulaire", series: 3, reps: "12-20", charge: "Corps", repos: "45s", notes: "S1 tenir 2s - S2 3s - S3 4s + depression scapulaire." },
          { nom: "Elevation laterale scapulaire", series: 3, reps: "15-20", charge: "Corps", repos: "45s", notes: "Introduire S2. S3 : 2s excentrique en descente." },
          { nom: "Prone Y", series: 3, reps: "10", charge: "Corps", repos: "60s", notes: "Introduire S3 uniquement. Trapeze inferieur." },
        ]
      },
      {
        id: "phase2", label: "Phase 2 - Renforcement rotateurs", duree: "S4-S7",
        objectif: "Renforcer la coiffe des rotateurs. Ratio RE/RI >= 0.75. Progresser en charge et en amplitude.",
        semaines: [
          {
            sem: "S4", titre: "Introduction elastique leger",
            exercices: [
              { nom: "RE elastique leger (coude 90)", series: 3, reps: "15", charge: "Elastique jaune/leger", repos: "75s", notes: "3s excentrique en retour. Coude contre le corps. Ne JAMAIS forcer la douleur." },
              { nom: "RI elastique leger", series: 3, reps: "15", charge: "Elastique jaune/leger", repos: "75s", notes: "Meme poids que RE. Controle strict du mouvement." },
              { nom: "Face pull elastique", series: 3, reps: "12", charge: "Elastique leger", repos: "60s", notes: "Tirer vers le visage, coudes hauts. Finir en RE maximale." },
              { nom: "Prone Y-T", series: 3, reps: "10 chaque", charge: "Corps", repos: "75s", notes: "Bras en Y puis en T. Tenir 2s en haut." },
            ]
          },
          {
            sem: "S5", titre: "Progression charge + amplitude",
            exercices: [
              { nom: "RE elastique moyen (coude 90)", series: 4, reps: "15", charge: "Elastique rouge/moyen", repos: "75s", notes: "Passer au rouge si 15 reps faciles. Meme 3s excentrique." },
              { nom: "RI elastique moyen", series: 4, reps: "15", charge: "Elastique rouge/moyen", repos: "75s", notes: "Verifier le ratio RE/RI : doivent etre equilibres." },
              { nom: "Face pull elastique", series: 3, reps: "15", charge: "Elastique moyen", repos: "60s", notes: "Volume augmente. Focus sur la fin de mouvement (RE maximale)." },
              { nom: "RE allonge haltere", series: 3, reps: "12", charge: "2 kg", repos: "75s", notes: "Introduire l'haltere. Allonge sur le cote. Amplitude 0-90 deg max." },
              { nom: "Prone Y-T-W", series: 3, reps: "10 chaque", charge: "Corps / 0.5 kg", repos: "75s", notes: "Ajouter le W (coudes flechis, RE). 3 positions enchainees." },
            ]
          },
          {
            sem: "S6", titre: "Consolidation force + serratus",
            exercices: [
              { nom: "RE elastique fort (coude 90)", series: 4, reps: "12", charge: "Elastique vert/fort", repos: "90s", notes: "Reduire les reps, augmenter la charge. 4s excentrique." },
              { nom: "RI elastique fort", series: 4, reps: "12", charge: "Elastique vert/fort", repos: "90s", notes: "Meme charge que RE. Controle strict." },
              { nom: "RE allonge haltere", series: 3, reps: "12", charge: "3-4 kg", repos: "75s", notes: "Progresser sur la charge si douleur < 2/10." },
              { nom: "Face pull elastique fort", series: 4, reps: "12", charge: "Elastique fort", repos: "75s", notes: "4 series maintenant. Tempo 2s aller, 3s retour." },
              { nom: "Push-up scapulaire (serratus)", series: 3, reps: "12", charge: "Corps", repos: "60s", notes: "Bras tendus au sol. Sortir et rentrer les omoplates. Serratus anterieur." },
            ]
          },
          {
            sem: "S7", titre: "Peak phase 2 + test ratio",
            exercices: [
              { nom: "RE elastique fort", series: 4, reps: "15", charge: "Elastique vert/fort", repos: "90s", notes: "Volume max phase 2. Verifier ratio RE/RI sur dynamometre si possible." },
              { nom: "RI elastique fort", series: 4, reps: "15", charge: "Elastique vert/fort", repos: "90s", notes: "CRITERE : ratio RE/RI >= 0.75 pour passer en phase 3." },
              { nom: "RE allonge haltere", series: 4, reps: "12", charge: "4 kg", repos: "75s", notes: "4 series. Preparer la transition vers les charges libres." },
              { nom: "Prone Y-T-W + haltere", series: 3, reps: "10 chaque", charge: "1-2 kg", repos: "75s", notes: "Charger legerement. Maintenir la qualite de mouvement." },
              { nom: "Push-up scapulaire", series: 3, reps: "15", charge: "Corps", repos: "60s", notes: "15 reps fluides. Tester si eligible phase 3." },
            ]
          },
        ],
        exercices: [
          { nom: "RE elastique (coude 90)", series: "3-4", reps: "12-15", charge: "Elastique leger (S4) > moyen (S5) > fort (S6-S7)", repos: "75-90s", notes: "3-4s excentrique. Ratio RE/RI >=0.75 obligatoire pour passer phase 3." },
          { nom: "RI elastique", series: "3-4", reps: "12-15", charge: "Meme elastique que RE", repos: "75-90s", notes: "Toujours equilibrer avec la RE." },
          { nom: "Face pull elastique", series: "3-4", reps: "12-15", charge: "Leger (S4-S5) > fort (S6-S7)", repos: "60-75s", notes: "Coudes hauts. Finir en RE maximale." },
          { nom: "RE allonge haltere", series: 3, reps: "12", charge: "2kg (S5) > 3-4kg (S6-S7)", repos: "75s", notes: "Introduire S5. Amplitude 0-90 deg." },
          { nom: "Prone Y-T-W", series: 3, reps: "10 chaque", charge: "Corps > 0.5-2kg", repos: "75s", notes: "S4-S5 corps seul - S6-S7 ajouter haltere leger." },
        ]
      },
      {
        id: "phase3", label: "Phase 3 - Force fonctionnelle", duree: "S8-S12",
        objectif: "Retour aux charges sportives. Integration chaine cinetique. Geste de lancer.",
        semaines: [
          {
            sem: "S8-S9", titre: "Introduction charges libres",
            exercices: [
              { nom: "Developpe militaire halteres", series: 3, reps: "12", charge: "50-60% 1RM", repos: "90s", notes: "Amplitude complete. Stop si douleur > 3/10. Preference halteres sur barre." },
              { nom: "Rowing haltere unilateral", series: 3, reps: "12", charge: "50-60% 1RM", repos: "90s", notes: "Stabiliser scapula en fin de mouvement. Coude vers l'arriere." },
              { nom: "Elevation laterale controlee", series: 3, reps: "12", charge: "4-6 kg", repos: "75s", notes: "Pouce vers le bas en fin d'amplitude (RI). Pas au-dessus de la ligne d'epaule." },
              { nom: "Lancer MB mur (lent)", series: 3, reps: "8", charge: "2 kg", repos: "90s", notes: "Reconstruire le geste. Lentement. Priorite technique avant velocite." },
            ]
          },
          {
            sem: "S10-S11", titre: "Progression fonctionnelle",
            exercices: [
              { nom: "Developpe militaire halteres", series: 4, reps: "10", charge: "60-70% 1RM", repos: "90s", notes: "Passage a 4 series. Augmenter charge si douleur < 2/10." },
              { nom: "Rowing haltere unilateral", series: 4, reps: "10", charge: "60-70% 1RM", repos: "90s", notes: "Introduire une pause de 1s en position contractee." },
              { nom: "Elevation laterale controlee", series: 3, reps: "12", charge: "6-8 kg", repos: "75s", notes: "Augmenter charge progressivement. Controle strict de la descente (3s)." },
              { nom: "Lancer MB mur (velocite croissante)", series: 4, reps: "10", charge: "2-3 kg", repos: "90s", notes: "Augmenter la velocite du geste. Reconstruire la chaine cinetique complete." },
              { nom: "Tractions supination", series: 3, reps: "max-2", charge: "Corps", repos: "120s", notes: "Introduire si ratio RE/RI confirme OK. Amplitude complete. Arret si douleur." },
            ]
          },
          {
            sem: "S12", titre: "Validation retour sport",
            exercices: [
              { nom: "Developpe militaire halteres", series: 4, reps: "8", charge: "70-80% 1RM", repos: "90s", notes: "Test de charge. Critere retour sport : 80% sans douleur." },
              { nom: "Rowing haltere unilateral", series: 4, reps: "8", charge: "70-75% 1RM", repos: "90s", notes: "Intensite proche sport. Evaluer la qualite du mouvement." },
              { nom: "Lancer MB mur (puissance max)", series: 4, reps: "8", charge: "3-4 kg", repos: "90s", notes: "Puissance maximale. Geste de match. Evaluer douleur post-seance." },
              { nom: "Tractions supination", series: 3, reps: "max-1", charge: "Corps", repos: "120s", notes: "Volume proche d'un niveau de competition. Critere de validation." },
              { nom: "RE elastique maintenance", series: 3, reps: "20", charge: "Elastique moyen", repos: "60s", notes: "A maintenir toute la saison comme prevention. Ne JAMAIS supprimer." },
            ]
          },
        ],
        exercices: [
          { nom: "Developpe militaire halteres", series: "3-4", reps: "8-12", charge: "50% (S8-9) > 60% (S10-11) > 70-80% (S12)", repos: "90s", notes: "Progression hebdomadaire. Stop si douleur > 3/10." },
          { nom: "Rowing haltere unilateral", series: "3-4", reps: "8-12", charge: "50% > 70%", repos: "90s", notes: "Stabilisation scapulaire en fin de mouvement." },
          { nom: "Lancer MB mur", series: "3-4", reps: "8-10", charge: "2kg (S8) > 4kg (S12)", repos: "90s", notes: "Velocite croissante. Reconstructeur du geste de lancer." },
          { nom: "Tractions (supination)", series: 3, reps: "max-2", charge: "Corps", repos: "120s", notes: "Introduire S10 si ratio RE/RI OK." },
        ]
      },
    ],
    exercices_type: ["Pendule Codman", "RE elastique", "Face pull", "Developpe militaire", "Lancer MB"],
    cycles: [
      { sem: "S1-S3", label: "Phase 1 - Controle", series: 3, reps: "10-20", pct: [] },
      { sem: "S4-S7", label: "Phase 2 - Rotateurs", series: 4, reps: "12-15", pct: [] },
      { sem: "S8-S12", label: "Phase 3 - Force fct.", series: 4, reps: "8-12", pct: [50, 80] },
    ],
  },

  {
    id: "rehab_genou",
    nom: "Rehab / Reathe - Genou",
    categorie: "Rehabilitation",
    couleur: "#4CAF50",
    isRehab: true,
    articulation: "genou",
    description: "Protocole genou 14 semaines : anti-douleur (S1-S3) > renforcement analytique (S4-S8) > reathetisation sportive (S9-S14). Progressivite semaine par semaine.",
    phases: [
      {
        id: "phase1", label: "Phase 1 - Anti-douleur & controle", duree: "S1-S3",
        objectif: "Reduire l'epanchement. Reactiver le quadriceps. Eviter l'atrophie.",
        semaines: [
          {
            sem: "S1", titre: "Isometrie & anti-atrophie",
            exercices: [
              { nom: "Quad set (isometrie)", series: 5, reps: "10x10s", charge: "Corps", repos: "30s", notes: "Allonge, contracter le quadriceps en appuyant le genou sur le sol. Base incontournable." },
              { nom: "Elevation jambe tendue", series: 3, reps: "10", charge: "Corps", repos: "45s", notes: "0 a 30 degres max. Lentement. Stabiliser le bassin." },
              { nom: "Cryotherapie 15min", series: 1, reps: "Apres seance", charge: "Glace", repos: "-", notes: "Appliquer glace 15 min apres chaque seance. Reduire inflammation." },
            ]
          },
          {
            sem: "S2", titre: "Activation quad + ischio",
            exercices: [
              { nom: "Quad set (isometrie)", series: 5, reps: "10x10s", charge: "Corps", repos: "30s", notes: "Maintenir la base. Augmenter l'intensite de contraction (90% max)." },
              { nom: "Elevation jambe tendue", series: 3, reps: "15", charge: "Corps", repos: "45s", notes: "Jusqu'a 45 degres si douleur < 3/10." },
              { nom: "Curl ischio allonge", series: 3, reps: "12", charge: "Corps / elastique tres leger", repos: "60s", notes: "Amplitude limitee si douleur. 0 a 60 degres flexion genoux." },
              { nom: "Presse amplitude reduite", series: 3, reps: "12", charge: "30-40% masse corporelle", repos: "75s", notes: "0 a 60 degres max. Pied plat. Pas de douleur." },
            ]
          },
          {
            sem: "S3", titre: "Charge progressive + mise en appui",
            exercices: [
              { nom: "Quad set (isometrie)", series: 4, reps: "10x10s", charge: "Corps", repos: "30s", notes: "Reduire a 4 series. Passer progressivement a des exercices dynamiques." },
              { nom: "Elevation jambe tendue", series: 3, reps: "20", charge: "Corps", repos: "45s", notes: "Volume max de cet exercice. Preparer la transition." },
              { nom: "Curl ischio allonge", series: 3, reps: "15", charge: "Elastique leger", repos: "60s", notes: "Augmenter l'amplitude progressivement. 0 a 90 degres si possible." },
              { nom: "Presse amplitude reduite", series: 3, reps: "15", charge: "40-50% MC", repos: "75s", notes: "Amplitude jusqu'a 75 degres si douleur < 3/10." },
              { nom: "Step-up bas 10cm", series: 3, reps: "10 / jambe", charge: "Corps", repos: "60s", notes: "Premiere mise en appui unilateral. Controle valgus obligatoire. Tres lent." },
            ]
          },
        ],
        exercices: [
          { nom: "Quad set isometrie", series: "4-5", reps: "10x10s", charge: "Corps", repos: "30s", notes: "S1-S2 5 series - S3 reduire a 4. Base absolue." },
          { nom: "Elevation jambe tendue", series: 3, reps: "10-20", charge: "Corps", repos: "45s", notes: "S1 0-30deg - S2 0-45deg - S3 volume max." },
          { nom: "Curl ischio allonge", series: 3, reps: "12-15", charge: "Corps puis elastique leger", repos: "60s", notes: "Introduire S2. Amplitude progressive." },
          { nom: "Presse amplitude reduite", series: 3, reps: "12-15", charge: "30-50% MC", repos: "75s", notes: "0-60deg (S2) > 0-75deg (S3)." },
          { nom: "Step-up bas 10cm", series: 3, reps: "10/jambe", charge: "Corps", repos: "60s", notes: "Introduire S3 uniquement." },
        ]
      },
      {
        id: "phase2", label: "Phase 2 - Renforcement analytique", duree: "S4-S8",
        objectif: "Deficit de force < 20% vs cote sain. Proprioception. Excentrique.",
        semaines: [
          {
            sem: "S4-S5", titre: "Introduction excentrique + proprioception",
            exercices: [
              { nom: "Leg extension excentrique", series: 3, reps: "10-12", charge: "40% 1RM", repos: "75s", notes: "S4 : concentrique avec 2 jambes, excentrique 1 jambe. 3s de descente." },
              { nom: "Nordic Hamstring Curl", series: 3, reps: "4-6", charge: "Corps", repos: "120s", notes: "Introduire avec assistance (bande elastique derriere les chevilles). Freiner max." },
              { nom: "Bulgarian Split Squat", series: 3, reps: "8/jambe", charge: "Corps", repos: "90s", notes: "Poids de corps d'abord. Genou dans l'axe. Tres lent (4s descente)." },
              { nom: "Proprioception sol yeux ouverts", series: 3, reps: "30s/jambe", charge: "Corps", repos: "30s", notes: "Unipodal sur sol dur. Yeux ouverts. Focus stabilisation." },
              { nom: "Pont fessier bilateral > unilateral", series: 3, reps: "15", charge: "Corps", repos: "60s", notes: "S4 bilateral - S5 unilateral. Activer le grand fessier." },
            ]
          },
          {
            sem: "S6-S7", titre: "Progression charge + instabilite",
            exercices: [
              { nom: "Leg extension excentrique", series: 4, reps: "10", charge: "50-55% 1RM", repos: "75s", notes: "Augmenter la charge. 4 series. 4s de descente toujours." },
              { nom: "Nordic Hamstring Curl", series: 4, reps: "6-8", charge: "Corps", repos: "120s", notes: "Reduire ou supprimer l'assistance. Objectif : freiner jusqu'au sol." },
              { nom: "Bulgarian Split Squat", series: 3, reps: "10/jambe", charge: "5-10 kg halteres", repos: "90s", notes: "Introduire la charge externe. Meme rigueur sur le valgus." },
              { nom: "Proprioception plateau instable", series: 3, reps: "30-45s/jambe", charge: "Corps", repos: "30s", notes: "Passer du sol dur au plateau instable. Yeux ouverts puis fermes." },
              { nom: "Pont fessier unilateral barre", series: 4, reps: "12/jambe", charge: "Barre vide > 20kg", repos: "60s", notes: "S6 barre vide - S7 ajouter 10-20kg. Amplitude complete." },
            ]
          },
          {
            sem: "S8", titre: "Peak phase 2 - test deficit",
            exercices: [
              { nom: "Leg extension excentrique", series: 4, reps: "10", charge: "60% 1RM", repos: "75s", notes: "Charge max phase 2. Evaluer deficit bilatateral. Critere : < 20% d'ecart." },
              { nom: "Nordic Hamstring Curl", series: 4, reps: "8", charge: "Corps sans assistance", repos: "120s", notes: "8 reps propres = critere passage phase 3." },
              { nom: "Bulgarian Split Squat", series: 4, reps: "10/jambe", charge: "10-20 kg", repos: "90s", notes: "4 series. Preparer le squat complet en phase 3." },
              { nom: "Proprioception + perturbation", series: 3, reps: "30s/jambe", charge: "Corps", repos: "30s", notes: "Le coach pousse legereement en different points. Reaction en temps reel." },
              { nom: "Fentes avant controlees", series: 3, reps: "10/jambe", charge: "Corps > 5-10kg", repos: "75s", notes: "Grand pas. Genou au-dessus du pied avant. Tempo 3s descente." },
            ]
          },
        ],
        exercices: [
          { nom: "Leg extension excentrique", series: "3-4", reps: "10-12", charge: "40% (S4-5) > 50% (S6-7) > 60% (S8)", repos: "75s", notes: "3-4s de descente. Cle tendinopathie patellaire." },
          { nom: "Nordic Hamstring Curl", series: "3-4", reps: "4-8", charge: "Corps (avec ou sans assistance)", repos: "120s", notes: "Assistance S4-5 - sans assistance S6-8. 8 reps = critere phase 3." },
          { nom: "Bulgarian Split Squat", series: "3-4", reps: "8-10/jambe", charge: "Corps > 20kg", repos: "90s", notes: "Corps seul (S4-5) > halteres (S6-7) > 4 series (S8)." },
          { nom: "Proprioception", series: 3, reps: "30-45s/jambe", charge: "Corps", repos: "30s", notes: "Sol dur yeux ouverts (S4) > plateau (S6) > perturbation (S8)." },
          { nom: "Pont fessier unilateral", series: "3-4", reps: "12-15/jambe", charge: "Corps > 20kg barre", repos: "60s", notes: "S4-5 corps - S6-7 barre vide - S8 charge." },
        ]
      },
      {
        id: "phase3", label: "Phase 3 - Reathetisation sportive", duree: "S9-S14",
        objectif: "Retour course. Hop tests > 90% cote sain. Landing mechanics. Retour jeu S13-S14.",
        semaines: [
          {
            sem: "S9-S10", titre: "Introduction plyometrie basse intensite",
            exercices: [
              { nom: "Squat gobelet profond", series: 4, reps: "10", charge: "16-20 kg", repos: "90s", notes: "Profondeur complete. Talons au sol. Genoux dans l'axe. Bonne position avant de charger." },
              { nom: "RDL unilateral", series: 3, reps: "10/jambe", charge: "Halteres 10-15kg", repos: "90s", notes: "Charniere hanche. Ischio-jambiers en tension. Gainage lombaire." },
              { nom: "Box jump reception controlee 30cm", series: 3, reps: "5", charge: "Corps", repos: "120s", notes: "Atterrissage silencieux sur 2 pieds. Rester stable 3s avant de descendre." },
              { nom: "Lateral bound bilateral", series: 3, reps: "6/cote", charge: "Corps", repos: "120s", notes: "Bond lateral bilateral d'abord. Atterrissage controle avant de repartir." },
              { nom: "Course lente 5 min", series: 1, reps: "5 min", charge: "Corps", repos: "-", notes: "Premiere course S9. Trot tres lent (60% VMA). Stop si douleur > 2/10." },
            ]
          },
          {
            sem: "S11-S12", titre: "Progression course + pliometrie",
            exercices: [
              { nom: "Squat gobelet profond", series: 4, reps: "12", charge: "24-28 kg", repos: "90s", notes: "Augmenter la charge. Tempo 3s descente. Critere : meme profondeur que cote sain." },
              { nom: "Box jump reception controlee 40cm", series: 4, reps: "5", charge: "Corps", repos: "120s", notes: "Augmenter la hauteur. Reception toujours silencieuse et controlee." },
              { nom: "Lateral bound unilateral", series: 4, reps: "6/cote", charge: "Corps", repos: "120s", notes: "Bond lateral unilateral. Atterrissage stable avant repartir. Mimetisme handball." },
              { nom: "Change de direction lent 45", series: 3, reps: "8/cote", charge: "Corps", repos: "90s", notes: "COD a vitesse basse. Genou dans l'axe lors du pivot." },
              { nom: "Course 15 min allure moderee", series: 1, reps: "15 min", charge: "Corps", repos: "-", notes: "Allure confortable. Surveiller douleur et gonflement post-seance." },
            ]
          },
          {
            sem: "S13-S14", titre: "Retour jeu - validation",
            exercices: [
              { nom: "Back Squat", series: 4, reps: "8", charge: "60-70% 1RM", repos: "2 min", notes: "Retour au back squat si hop tests > 90%. Meme charge que cote sain." },
              { nom: "Sprint progressif 50-70-90-100%", series: 4, reps: "20m", charge: "Corps", repos: "120s", notes: "S13 max 90%. S14 autoriser 100% si no pain. Critere retour jeu." },
              { nom: "Nordic Hamstring Curl maintenance", series: 3, reps: "6", charge: "Corps", repos: "120s", notes: "Maintenir toute la saison en prevention. Ne jamais supprimer." },
              { nom: "Hop test unilateral", series: 1, reps: "3 essais/jambe", charge: "Corps", repos: "-", notes: "Critere retour : > 90% de la jambe saine. Mesurer et noter." },
              { nom: "Jeu reduit (3c3 ou 4c4)", series: 3, reps: "5 min", charge: "Corps", repos: "3 min", notes: "S13 jeu reduit basse intensite. S14 jeu normal. Monitorer charge." },
            ]
          },
        ],
        exercices: [
          { nom: "Squat gobelet/barre", series: 4, reps: "8-12", charge: "16kg (S9) > 70% 1RM (S13)", repos: "90s-2min", notes: "Profondeur progressive. Retour barre S13 si hop test > 90%." },
          { nom: "Box jump", series: "3-4", reps: "5", charge: "Corps - hauteur croissante", repos: "120s", notes: "30cm (S9-10) > 40cm (S11-12). Reception controlee prioritaire." },
          { nom: "Lateral bound", series: "3-4", reps: "6/cote", charge: "Corps", repos: "120s", notes: "Bilateral (S9) > unilateral (S11)." },
          { nom: "Course/Sprint", series: "Variable", reps: "5-20 min ou 20m", charge: "Corps", repos: "Variable", notes: "5min lent (S9) > 15min (S11) > sprint 100% (S14)." },
          { nom: "Nordic Hamstring Curl maintenance", series: 3, reps: "6", charge: "Corps", repos: "120s", notes: "Toute la saison. Prevention LCA." },
        ]
      },
    ],
    exercices_type: ["Quad set", "Nordic Curl", "Bulgarian Split Squat", "Box Jump", "Lateral bound"],
    cycles: [
      { sem: "S1-S3", label: "Phase 1 - Anti-douleur", series: 3, reps: "10-15", pct: [] },
      { sem: "S4-S8", label: "Phase 2 - Renforcement", series: 4, reps: "10-15", pct: [40, 60] },
      { sem: "S9-S14", label: "Phase 3 - Reathe sport.", series: 4, reps: "5-12", pct: [] },
    ],
  },

  {
    id: "rehab_cheville",
    nom: "Rehab / Reathe - Cheville",
    categorie: "Rehabilitation",
    couleur: "#7C6FFF",
    isRehab: true,
    articulation: "cheville",
    description: "Protocole cheville 10 semaines : mobilite (S1-S2) > proprioception/renforcement (S3-S6) > retour sport (S7-S10). Progressivite semaine par semaine.",
    phases: [
      {
        id: "phase1", label: "Phase 1 - Mobilite & decharge", duree: "S1-S2",
        objectif: "Recuperer l'amplitude articulaire. Reduire l'oedeme. Protection ligamentaire.",
        semaines: [
          {
            sem: "S1", titre: "Anti-oedeme & mobilite passive",
            exercices: [
              { nom: "Dorsiflexion active (assis)", series: 3, reps: "20", charge: "Corps", repos: "30s", notes: "Tirer orteils vers soi. Amplitude max sans douleur. A faire 3x/jour." },
              { nom: "Alphabet cheville (assis)", series: 2, reps: "Alphabet complet", charge: "Corps", repos: "30s", notes: "Tracer toutes les lettres. Mobilise toutes les directions." },
              { nom: "Mise en charge bipodal progression", series: 3, reps: "30s", charge: "Corps", repos: "30s", notes: "Debout sur les 2 pieds. Transfert progressif du poids sur la cheville blessee." },
              { nom: "Elevation talons bilateral assis", series: 3, reps: "15", charge: "Corps", repos: "45s", notes: "Genou flechis (solaaire). Doux. Sans douleur." },
              { nom: "Cryotherapie", series: 1, reps: "15-20 min apres seance", charge: "Glace", repos: "-", notes: "Glace apres chaque seance + elevation de la jambe 20 min." },
            ]
          },
          {
            sem: "S2", titre: "Amplitude + premiere mise en appui",
            exercices: [
              { nom: "Dorsiflexion active + SNAG elastique", series: 3, reps: "10", charge: "Elastique derriere malleoles", repos: "30s", notes: "Elastique en tension derriere malleoles, avancer le genou vers avant. Recupere la dorsiflexion." },
              { nom: "Alphabet cheville (debout)", series: 2, reps: "Alphabet complet", charge: "Corps", repos: "30s", notes: "Debout si possible. Progresser de assis a debout." },
              { nom: "Mise en charge unipodal sol dur", series: 3, reps: "20s/pied", charge: "Corps", repos: "30s", notes: "Debut de mise en charge unilaterale. Stop si douleur > 3/10." },
              { nom: "Elevation talons bilateral debout", series: 3, reps: "15", charge: "Corps", repos: "45s", notes: "Passer de assis a debout. Montee complete des talons. Descente lente 2s." },
              { nom: "Marche controlee sans boiterie", series: 3, reps: "50m", charge: "Corps", repos: "30s", notes: "Objectif : marcher normalement avant fin S2. Tape si necessaire." },
            ]
          },
        ],
        exercices: [
          { nom: "Dorsiflexion active / SNAG", series: 3, reps: "10-20", charge: "Corps puis elastique", repos: "30s", notes: "S1 assis sans charge - S2 ajouter SNAG elastique." },
          { nom: "Alphabet cheville", series: 2, reps: "Complet", charge: "Corps", repos: "30s", notes: "S1 assis - S2 debout si possible." },
          { nom: "Elevation talons bilaterale", series: 3, reps: "15", charge: "Corps", repos: "45s", notes: "S1 assis (solaaire) - S2 debout (gastrocneme)." },
          { nom: "Mise en charge progressive", series: 3, reps: "20-30s", charge: "Corps", repos: "30s", notes: "S1 bipodal - S2 unipodal debut." },
        ]
      },
      {
        id: "phase2", label: "Phase 2 - Proprioception & renforcement", duree: "S3-S6",
        objectif: "Recuperer la proprioception. Renforcement everseurs/inverseurs. Appui monopodal stable.",
        semaines: [
          {
            sem: "S3-S4", titre: "Proprioception + renforcement debutant",
            exercices: [
              { nom: "Unipodal sol dur yeux ouverts", series: 3, reps: "30s/jambe", charge: "Corps", repos: "30s", notes: "S3 : yeux ouverts sol dur. Travail focus et stabilisation." },
              { nom: "Plateau instable bipodal", series: 3, reps: "45s", charge: "Corps", repos: "45s", notes: "S3 bipodal - S4 progresser vers unipodal sur plateau." },
              { nom: "Elevation talon unilateral concentrique", series: 3, reps: "15/jambe", charge: "Corps", repos: "75s", notes: "S3 : montee et descente concentrique sur 1 pied. Progresser en amplitude." },
              { nom: "Isometrie eversion elastique", series: 3, reps: "10x5s", charge: "Elastique", repos: "60s", notes: "Resister a la traction en eversion. Renforce les peroniers." },
              { nom: "Step-down 20cm controle", series: 3, reps: "10/jambe", charge: "Corps", repos: "60s", notes: "Descendre lentement sur 1 jambe. Controle cheville + genou." },
            ]
          },
          {
            sem: "S5-S6", titre: "Excentrique + instabilite avancee",
            exercices: [
              { nom: "Elevation talon unilateral excentrique", series: 4, reps: "12/jambe", charge: "Corps (S5) > +10kg (S6)", repos: "90s", notes: "S5 : montee 2 pieds - descente 1 pied en 3s (CLE Achille). S6 : ajouter sac 10kg." },
              { nom: "Unipodal plateau yeux fermes", series: 3, reps: "30s/jambe", charge: "Corps", repos: "30s", notes: "S5 yeux fermes sur plateau. S6 ajouter perturbation legere." },
              { nom: "Inversion/eversion elastique dynamique", series: 3, reps: "15/sens", charge: "Elastique moyen", repos: "60s", notes: "Mouvement complet (pas isometrique). Controle toute l'amplitude." },
              { nom: "Marche talon-pointe avec instabilite", series: 3, reps: "20m", charge: "Corps", repos: "45s", notes: "Marcher sur mousse ou surface instable. Alternance talon/pointe." },
              { nom: "Step-down 30cm excentrique", series: 4, reps: "10/jambe", charge: "Corps", repos: "60s", notes: "Hauteur augmentee. Descente 4s. Controle strict." },
            ]
          },
        ],
        exercices: [
          { nom: "Proprioception unipodal", series: 3, reps: "30s/jambe", charge: "Corps", repos: "30s", notes: "Sol dur (S3) > plateau (S4) > yeux fermes (S5) > perturbation (S6)." },
          { nom: "Elevation talon unilateral", series: "3-4", reps: "12-15/jambe", charge: "Corps puis +10kg", repos: "75-90s", notes: "Concentrique (S3) > excentrique 3s (S5) > charge externe (S6)." },
          { nom: "Isometrie/dynamique everseurs", series: 3, reps: "10x5s ou 15 reps", charge: "Elastique", repos: "60s", notes: "Isometrie (S3-4) > dynamique (S5-6)." },
          { nom: "Step-down controle", series: "3-4", reps: "10/jambe", charge: "Corps", repos: "60s", notes: "20cm (S3-4) > 30cm excentrique (S5-6)." },
        ]
      },
      {
        id: "phase3", label: "Phase 3 - Retour sport & prevention", duree: "S7-S10",
        objectif: "Retour saut et pivot. Stabilite dynamique sous charge. Prevention recidive.",
        semaines: [
          {
            sem: "S7-S8", titre: "Introduction sauts et impacts",
            exercices: [
              { nom: "Sauts unipodaux en place", series: 3, reps: "8", charge: "Corps", repos: "90s", notes: "S7 : sauts bas, atterrissage controle, rester stable 2s. S8 : augmenter la hauteur." },
              { nom: "Lateral hop bilateral 30cm", series: 3, reps: "8/cote", charge: "Corps", repos: "90s", notes: "S7 bilateral d'abord. Atterrissage stable avant de repartir." },
              { nom: "Drop landing 20cm", series: 3, reps: "6", charge: "Corps", repos: "90s", notes: "Chute controlee depuis 20cm. Absorption cheville > genou > hanche." },
              { nom: "Elevation talon maintenance", series: 3, reps: "15/jambe", charge: "+15kg", repos: "90s", notes: "Maintenir le renforcement. 3s excentrique toujours." },
              { nom: "Course lente 10 min", series: 1, reps: "10 min", charge: "Corps", repos: "-", notes: "Premiere course si autorisation medicale. Trot leger. Surveiller oedeme apres." },
            ]
          },
          {
            sem: "S9-S10", titre: "Retour jeu & pivots",
            exercices: [
              { nom: "Lateral hop unilateral", series: 4, reps: "8/cote", charge: "Corps", repos: "90s", notes: "S9 unilateral. Atterrissage stable. Mimetisme handball." },
              { nom: "Drop landing 30-40cm", series: 4, reps: "6", charge: "Corps", repos: "90s", notes: "Augmenter la hauteur. Cheville doit absorber sans compensation." },
              { nom: "Pivot vitesse progressive", series: 3, reps: "6/sens", charge: "Corps", repos: "90s", notes: "S9 pivot lent. S10 vitesse match si douleur < 2/10." },
              { nom: "S-drill (courbes)", series: 3, reps: "4 repetitions", charge: "Corps", repos: "120s", notes: "Courbes contraignant la cheville. Cronometrer pour objectiver le progres." },
              { nom: "Tape + jeu reduit", series: 1, reps: "Seance de jeu", charge: "Corps", repos: "-", notes: "Retour jeu avec tape obligatoire. Monitorer gonflement 24h apres. Tape jusqu'a S12 minimum." },
            ]
          },
        ],
        exercices: [
          { nom: "Sauts unipodaux", series: "3-4", reps: "8-10", charge: "Corps", repos: "90s", notes: "S7-8 bilateraux d'abord > S9-10 unilateraux." },
          { nom: "Lateral hop", series: "3-4", reps: "8/cote", charge: "Corps", repos: "90s", notes: "Bilateral (S7) > unilateral (S9). Atterrissage stable prioritaire." },
          { nom: "Drop landing", series: "3-4", reps: "6", charge: "Corps", repos: "90s", notes: "20cm (S7-8) > 30-40cm (S9-10)." },
          { nom: "Pivot / S-drill", series: 3, reps: "6/sens ou 4 reps", charge: "Corps", repos: "90-120s", notes: "S9 lent - S10 vitesse match." },
          { nom: "Elevation talon maintenance", series: 3, reps: "15/jambe", charge: "+15-20kg", repos: "90s", notes: "Maintenir toute la saison. Prevention tendinopathie Achille." },
        ]
      },
    ],
    exercices_type: ["Alphabet cheville", "Proprioception plateau", "Elevation talon excentrique", "Lateral hop", "Drop landing"],
    cycles: [
      { sem: "S1-S2", label: "Phase 1 - Mobilite", series: 3, reps: "15-20", pct: [] },
      { sem: "S3-S6", label: "Phase 2 - Proprioception", series: 4, reps: "10-15", pct: [] },
      { sem: "S7-S10", label: "Phase 3 - Retour sport", series: 4, reps: "6-10", pct: [] },
    ],
  },
  {
    id: "emom", nom: "EMOM", categorie: "Puissance", couleur: "#38BDF8", equipement: "mixte",
    description: "Every Minute On the Minute. Chaque minute, realise le nombre de reps prescrit. Le temps restant dans la minute est ta recuperation. Developpe la puissance, la densite d'entrainement et la capacite a maintenir la qualite sous fatigue.",
    cycles: [
      { sem: "EMOM 10min", label: "EMOM standard",
        details: [
          { serie: 1, reps: "5-8", pct: 0, note: "Minute 1 : exercice A — effort maximal" },
          { serie: 2, reps: "5-8", pct: 0, note: "Minute 2 : exercice B (ou repos si mono-exercice)" },
          { serie: 3, reps: "5-8", pct: 0, note: "Répéter sur toute la durée (10 à 20min)" },
        ],
        note: "Choix du poids : 60-70% 1RM pour maintenir la qualité. Si tu dépasses 50s de travail sur la minute = trop lourd.",
      },
      { sem: "EMOM Alt.", label: "EMOM alterné (2 exercices)",
        details: [
          { serie: 1, reps: "6", pct: 0, note: "Minute impaire : exercice A" },
          { serie: 2, reps: "6", pct: 0, note: "Minute paire : exercice B" },
        ],
        note: "Format handball : ex. Kettlebell swing + Box jump — puissance + réactivité.",
      },
    ],
  },

  {
    id: "circuit_haut_hb", nom: "Circuit Haut du Corps - Handball", categorie: "Puissance", couleur: "#FF6B9D", equipement: "mixte", format: "circuit",
    description: "Circuit specifique handball cible epaule, puissance de tir et gainage du tronc. Alterne force, explosivite et prevention rotateurs. 7 stations en circuit, repos court entre stations.",
    cycles: [
      { sem: "Continu", label: "Circuit hebdomadaire",
        details: [
          { serie: 1, reps: "3x15-20 (lent, controle)", pct: 0, note: "Rotation externe elastique, coude a 90 degres : prevention coiffe des rotateurs. Toujours en premier, epaule pas encore fatiguee." },
          { serie: 2, reps: "4x6 (max effort)", pct: 0, note: "Lancer rotationnel medecine-ball (geste de tir handball) contre mur ou partenaire : transfert de puissance hanche vers epaule." },
          { serie: 3, reps: "3x8-10", pct: 0, note: "Pompes claquees (plyo push-up) ou developpe couche explosif leger : puissance de poussee, vitesse d'execution du tir." },
          { serie: 4, reps: "3x10-12", pct: 0, note: "Tirage horizontal (rowing) prise neutre : equilibre agoniste/antagoniste, sante epaule sur la duree de la saison." },
          { serie: 5, reps: "3x30-40s", pct: 0, note: "Pallof press (anti-rotation) : stabilite du tronc, transfert de force jambes vers bras lors du tir en suspension." },
          { serie: 6, reps: "4x5 (max effort)", pct: 0, note: "Jete de medecine-ball au-dessus de la tete (overhead slam) : puissance globale chaine posterieure-epaule." },
          { serie: 7, reps: "3x15/cote", pct: 0, note: "Elevation arriere epaule (face pull ou haltere leger) : coiffe posterieure, prevention a haut volume de tirs." },
        ],
        note: "2x/semaine. Repos 30-45s entre stations, 2 min entre tours (2-3 tours). Prioriser la qualite d'execution a la charge. A placer apres l'echauffement, avant le travail de force lourd.",
      },
    ],
    exercices_type: ["Rotation externe elastique", "Lancer rotationnel medecine-ball", "Pompes claquees", "Tirage horizontal", "Pallof press", "Jete medecine-ball overhead", "Elevation arriere epaule"],
    assistance: "Peut remplacer une seance d'epaule classique en periode de forte charge de tirs (matchs rapproches). A combiner avec le protocole Renforcement Preventif Handball pour les joueurs a risque epaule.",
  },
  {
    id: "circuit_bas_hb", nom: "Circuit Bas du Corps - Handball", categorie: "Puissance", couleur: "#00D2D3", equipement: "mixte", format: "circuit",
    description: "Circuit specifique handball cible changement de direction, detente et vitesse de deplacement. Combine pliometrie, sprints courts et travail unilateral. 7 stations, cle de la performance sur petit terrain.",
    cycles: [
      { sem: "Continu", label: "Circuit hebdomadaire",
        details: [
          { serie: 1, reps: "4x4 (max effort)", pct: 0, note: "Squat jump ou box jump : detente verticale explosive, transfert direct au saut en tir ou au contre." },
          { serie: 2, reps: "6x(2x10m aller-retour)", pct: 0, note: "Navette courte avec changement de direction a 180 degres : vitesse + freinage-reacceleration, coeur du jeu handball." },
          { serie: 3, reps: "4x3/cote", pct: 0, note: "Fentes laterales sautees (lateral bound) : puissance et stabilite laterale, prevention entorse cheville/genou." },
          { serie: 4, reps: "5x10m", pct: 0, note: "Sprint depart arrete : acceleration pure, 1er pas explosif pour les courses de replacement defensif." },
          { serie: 5, reps: "3x8/jambe", pct: 0, note: "Squat bulgare ou fente avant chargee : force unilaterale, base de tout changement de direction efficace." },
          { serie: 6, reps: "3x6/cote", pct: 0, note: "Skater bondissant (bounding lateral) : puissance excentrique laterale, specifique aux blocages et pivots." },
          { serie: 7, reps: "3x20-30s", pct: 0, note: "Gainage dynamique (mountain climber rapide ou similaire) : transfert vitesse-stabilite du tronc en course." },
        ],
        note: "2x/semaine, ideal en debut de seance (fraicheur nerveuse necessaire a la qualite pliometrique). Repos complet 60-90s entre stations. Reduire le volume en periode competitive rapprochee.",
      },
    ],
    exercices_type: ["Squat jump", "Navette changement direction", "Fentes laterales sautees", "Sprint depart arrete", "Squat bulgare", "Skater bondissant", "Gainage dynamique"],
    assistance: "A associer avec le protocole Renforcement Preventif Handball (Nordic, proprioception cheville) pour securiser les articulations sollicitees par le changement de direction et la pliometrie.",
  },
  {
    id: "pyramide_hb", nom: "Pyramide Montante-Descendante", categorie: "Puissance", couleur: "#9C27B0", equipement: "mixte",
    description: "Format pyramidal 1-2-3-4-5-4-3-2-1 : le nombre de repetitions grimpe puis redescend. Developpe la capacite a repeter des efforts de qualite malgre la fatigue croissante — exactement le profil d'effort du handball en fin de match.",
    cycles: [
      { sem: "Pyramide simple", label: "1 exercice",
        details: [
          { serie: 1, reps: "1-2-3-4-5-4-3-2-1", pct: 0, note: "Un seul exercice (ex: burpees, squat jump, tractions) : monte puis redescend, repos minimal entre paliers (10-15s)." },
        ],
        note: "Chrono le temps total : objectif = ameliorer ce temps a chaque seance sans perdre en technique. 45 repetitions au total.",
      },
      { sem: "Pyramide duo", label: "2 exercices alternes",
        details: [
          { serie: 1, reps: "1-2-3-4-5-4-3-2-1", pct: 0, note: "Exercice A (ex: kettlebell swing) a chaque palier montant." },
          { serie: 2, reps: "1-2-3-4-5-4-3-2-1", pct: 0, note: "Exercice B (ex: box jump) a chaque palier descendant — alterner A et B a chaque changement de palier." },
        ],
        note: "Format plus ludique en groupe : chacun annonce son palier a voix haute, cree une emulation collective.",
      },
    ],
    exercices_type: ["Burpees", "Squat jump", "Kettlebell swing", "Box jump", "Tractions", "Mountain climber"],
    assistance: "Ideal en fin de seance ou en seance courte (20 min). Varier les exercices chaque semaine pour maintenir la motivation.",
  },
  {
    id: "defi_chrono_hb", nom: "Defis Chronometres - Handball", categorie: "Puissance", couleur: "#FFC107", equipement: "mixte",
    description: "Format ludique et competitif : chaque joueur (ou binome) cherche a battre son record ou celui d'un partenaire sur un enchainement d'exercices. Maintient la motivation et l'engagement, particulierement utile avec les jeunes (U15-U18).",
    cycles: [
      { sem: "Defi individuel", label: "Chrono perso",
        details: [
          { serie: 1, reps: "Max reps en 30s", pct: 0, note: "Station 1 (ex: squat jump) : compter les reps, noter le score, viser +1 la semaine suivante." },
          { serie: 2, reps: "Max reps en 30s", pct: 0, note: "Station 2 (ex: mountain climber) : meme principe, transition rapide entre stations (10s)." },
          { serie: 3, reps: "Max reps en 30s", pct: 0, note: "Station 3 (ex: fentes sautees) : cumuler le score total des 3 stations = score de la seance." },
        ],
        note: "Affiche les scores sur un tableau (papier ou app) : cree une progression visible et motivante sur la saison.",
      },
      { sem: "Defi duel", label: "1 contre 1",
        details: [
          { serie: 1, reps: "Course/duel direct", pct: 0, note: "Sprint navette face a face : le perdant fait 5 pompes, le vainqueur enchaine sur le duel suivant (tournoi)." },
          { serie: 2, reps: "Concours de saut", pct: 0, note: "Saut en longueur sans elan (broad jump) : le plus loin gagne, mesure au sol avec un repere." },
          { serie: 3, reps: "Relais equipe", pct: 0, note: "Relais navette par equipes de 3-4 : combine vitesse, changement de direction et esprit collectif." },
        ],
        note: "Parfait pour un retour de vacances ou une seance de reprise : remet de l'intensite sans que ca paraisse 'dur'.",
      },
    ],
    exercices_type: ["Squat jump", "Mountain climber", "Fentes sautees", "Sprint navette", "Saut en longueur sans elan", "Relais equipe"],
    assistance: "A utiliser avec parcimonie (1x toutes les 2-3 semaines) pour garder l'effet de nouveaute. Tres efficace pour la cohesion de groupe en debut ou fin de saison.",
  },

];

// ── MUSCU SEANCE EDITOR ────────────────────────────────────────────────────────

// ── MUSCU SEANCE EDITOR (coach — RPE cible + notes) ───────────────────────────

// ── TESTING CALCULATOR COMPONENT ─────────────────────────────────────────────

// ── REHAB METHOD CARD — rendu spécial pour protocoles de réhabilitation ────────

function MuscuMethodesTab({ methodes, showMethode, setShowMethode, createFromMethode, addSeance, setShowTesting, selCycleSem, setSelCycleSem, isCoach, db, setDb }) {
  const standard = methodes.filter(m => !m.isRehab && !m.isCustom);
  const rehab    = methodes.filter(m =>  m.isRehab);
  const custom   = methodes.filter(m =>  m.isCustom);
  const [showCreate, setShowCreate] = React.useState(false);
  const [formM, setFormM] = React.useState({ nom:'', categorie:'Force', couleur:'#FFA420', equipement:'salle', description:'', exercices:[] });
  const [newEx, setNewEx] = React.useState({ nom:'', series:'3', reps:'8', repos:'90s', charge:'', notes:'' });
  const [filtreQualite, setFiltreQualite] = React.useState('toutes');
  const [filtreEquip, setFiltreEquip] = React.useState('tous'); // filtre affiché : tous | salle | poids_corps | mixte

  function saveCustomMethode() {
    if (!formM.nom.trim()) return;
    const id = 'custom_' + Date.now();
    const methode = {
      id, nom: formM.nom.trim(), categorie: formM.categorie,
      couleur: formM.couleur, equipement: formM.equipement, description: formM.description,
      isCustom: true, cycles: [],
      exercicesRef: formM.exercices,
    };
    setDb(d => ({ ...d, customMethodes: [...(d.customMethodes||[]), methode] }));
    setFormM({ nom:'', categorie:'Force', couleur:'#FFA420', equipement:'salle', description:'', exercices:[] });
    setShowCreate(false);
  }

  function deleteCustomMethode(id) {
    if (!confirm('Supprimer cette methode ?')) return;
    setDb(d => ({ ...d, customMethodes: (d.customMethodes||[]).filter(m => m.id !== id) }));
  }

  function addEx() {
    if (!newEx.nom.trim()) return;
    setFormM(f => ({ ...f, exercices: [...f.exercices, { ...newEx, id: Date.now().toString() }] }));
    setNewEx({ nom:'', series:'3', reps:'8', repos:'90s', charge:'', notes:'' });
  }

  const CATEGORIES = ['Force', 'Hypertrophie', 'Endurance musculaire', 'Puissance', 'Réhabilitation', 'Autre'];
  const COULEURS = ['#FF4455','#FFA420','#4CAF50','#38BDF8','#7C6FFF','#FF6B9D','#FFB800'];
  const EQUIP_TAGS = {
    salle:       { label: 'Salle de muscu',  emoji: '🏋️', color: '#38BDF8' },
    poids_corps: { label: 'Poids de corps',  emoji: '🤸', color: '#4CAF50' },
    mixte:       { label: 'Mixte',           emoji: '🔀', color: '#FFA420' },
  };
  const equipOf = (m) => EQUIP_TAGS[m.equipement] || null;
  // Qualités physiques travaillées : une méthode peut en avoir plusieurs
  const QUALITES = {
    force:        { label: 'Force',           emoji: '💪', color: '#FF4455' },
    puissance:    { label: 'Puissance',       emoji: '⚡', color: '#FFA420' },
    vitesse:      { label: 'Vitesse',         emoji: '🏃', color: '#00D2D3' },
    plyo:         { label: 'Plyométrie',      emoji: '🦘', color: '#38BDF8' },
    hypertrophie: { label: 'Hypertrophie',    emoji: '📈', color: '#7C6FFF' },
    endurance:    { label: 'Endurance musculaire', emoji: '🔁', color: '#FFB800' },
    prevention:   { label: 'Prévention',      emoji: '🛡️', color: '#4CAF50' },
    poussee:      { label: 'Poussée & triceps', emoji: '💥', color: '#FF6B9D' },
    halte:        { label: 'Haltérophilie', emoji: '🏋️', color: '#F5C518' },
    hanche:       { label: 'Hanche & fessiers', emoji: '🦵', color: '#E5484D' },
    epaule:       { label: 'Épaule & haut du dos', emoji: '🦾', color: '#FF6B9D' },
    reprise:      { label: 'Reprise / Santé', emoji: '🌱', color: '#4CAF50' },
    bilan:        { label: 'Tests & bilans',  emoji: '📋', color: '#FF6B9D' },
  };
  const QUALITES_PAR_ID = {
    wendler531:['force'], force_hyp:['force','hypertrophie'], cinq_par_cinq:['force'], conjuguee:['force','puissance'],
    volume_allemand:['hypertrophie','force'], pyramide_descendante:['force'], clusters:['puissance','force'],
    pliometrie:['plyo','puissance'], hypertrophie:['hypertrophie'], prevention:['prevention'],
    testing_charges:['bilan'], bilan_bas_corps:['bilan'], bilan_haut_corps:['bilan'], bilan_mobilite_coordination:['bilan'],
    emom:['endurance','puissance'], circuit_haut_hb:['endurance','puissance'], circuit_bas_hb:['endurance','puissance'],
    pyramide_hb:['puissance','endurance'], defi_chrono_hb:['vitesse','endurance'],
    hb_plyo_bas:['plyo','puissance'], hb_plyo_unilat:['plyo'], hb_puiss_bas:['puissance','force'],
    hb_contraste_bas:['puissance','force'], hb_puiss_haut:['puissance'], hb_vitesse_ligne:['vitesse'],
    hb_vitesse_appuis:['vitesse'], hb_mix_vitesse_force:['puissance','vitesse','plyo','force'],
    hb_match_court:['puissance','vitesse'], hb_reprise_maladie:['reprise'],
    hb_epaule_stabilite:['epaule','prevention'], hb_epaule_isometrie:['epaule','prevention'], hb_rhomboides_trapezes:['epaule','hypertrophie'],
    hb_epaule_activation:['epaule','prevention'], hb_haut_force:['force','poussee'], hb_halte_initiation:['halte'], hb_halte_force:['halte','force'], hb_halte_vitesse:['halte','vitesse','puissance'], hb_halte_hang_match:['halte','puissance'], hb_halte_complexes:['halte','puissance'], hb_halte_epaule:['halte','puissance'], hb_halte_arrache:['halte','puissance'], hb_halte_jete:['halte','poussee','puissance'], hb_hanche_extension_force:['hanche','force'], hb_hanche_flexion:['hanche','vitesse'], hb_hanche_puissance:['hanche','puissance','plyo'], hb_hanche_complete:['hanche','force','prevention'], hb_hanche_stabilite:['hanche','prevention'], hb_fessiers_volume:['hanche','hypertrophie'], hb_push_puissance:['poussee','puissance'], hb_push_plyo:['poussee','plyo','puissance'], hb_push_vitesse:['poussee','vitesse','puissance'], hb_push_contraste:['poussee','puissance','force'], hb_triceps_epaules_force:['poussee','force'], hb_triceps_epaules_volume:['poussee','hypertrophie'], hb_tirage_force_dos:['force','epaule'], hb_haut_volume:['hypertrophie'],
  };
  const qualitesOf = (m) => {
    if (Array.isArray(m.qualites) && m.qualites.length) return m.qualites;
    if (QUALITES_PAR_ID[m.id]) return QUALITES_PAR_ID[m.id];
    const c = String(m.categorie || '').toLowerCase();
    const q = [];
    if (/force/.test(c)) q.push('force');
    if (/puissance|explos/.test(c)) q.push('puissance');
    if (/vitesse/.test(c)) q.push('vitesse');
    if (/plyo/.test(c)) q.push('plyo');
    if (/hypertro|volume/.test(c)) q.push('hypertrophie');
    if (/endurance/.test(c)) q.push('endurance');
    if (/pr[ée]vention|r[ée]hab/.test(c)) q.push('prevention');
    if (/reprise|sant[ée]/.test(c)) q.push('reprise');
    if (/test|bilan/.test(c)) q.push('bilan');
    return q;
  };
  const passesFiltreQualite = (m) => filtreQualite === 'toutes' || qualitesOf(m).includes(filtreQualite);
  const passesFiltres = (m) => passesFiltreEquip(m) && passesFiltreQualite(m);
  const nbParQualite = (k) => [...standard, ...custom].filter(m => passesFiltreEquip(m) && qualitesOf(m).includes(k)).length;
  const passesFiltreEquip = (m) => filtreEquip === 'tous' || m.equipement === filtreEquip;

  return _h`<div>
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
      Sélectionne une méthode pour créer automatiquement une séance pré-remplie.
    </div>

    <!-- Filtre par qualité physique -->
    <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Qualité physique</div>
    <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
      ${[['toutes','Toutes','#fff'], ...Object.entries(QUALITES).map(([k,t])=>[k, t.emoji+' '+t.label, t.color])].map(([key,label,color]) => {
        const n = key === 'toutes' ? null : nbParQualite(key);
        if (n === 0 && filtreQualite !== key) return null;
        return _h`<button key=${key}
        onClick=${() => setFiltreQualite(key)}
        style=${{ padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
          border:'1px solid '+(filtreQualite===key ? color : 'rgba(255,255,255,.1)'),
          background: filtreQualite===key ? color+'18' : 'rgba(255,255,255,.03)',
          color: filtreQualite===key ? color : 'rgba(255,255,255,.4)' }}>${label}${n != null ? ' ('+n+')' : ''}</button>`;
      })}
    </div>
    <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Équipement</div>
    <!-- Filtre par équipement -->
    <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
      ${[['tous','Toutes','#fff'], ...Object.entries(EQUIP_TAGS).map(([k,t])=>[k, t.emoji+' '+t.label, t.color])].map(([key,label,color]) => _h`<button key=${key}
        onClick=${() => setFiltreEquip(key)}
        style=${{ padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
          border:'1px solid '+(filtreEquip===key ? color : 'rgba(255,255,255,.1)'),
          background: filtreEquip===key ? color+'18' : 'rgba(255,255,255,.03)',
          color: filtreEquip===key ? color : 'rgba(255,255,255,.4)' }}>${label}</button>`)}
    </div>

    ${isCoach ? _h`<div style=${{ marginBottom:16 }}>
      <button class="btn btn-primary btn-sm" style=${{ width:'100%' }} onClick=${() => setShowCreate(!showCreate)}>
        ${showCreate ? '✕ Annuler' : '+ Créer une méthode personnalisée'}
      </button>

      ${showCreate ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'16px', marginTop:10 }}>
        <div style=${{ fontSize:13, fontWeight:800, marginBottom:14 }}>Nouvelle méthode</div>

        <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <div style=${{ gridColumn:'1/-1' }}>
            <div class="lbl">Nom de la méthode</div>
            <input class="inp" value=${formM.nom} onInput=${e=>setFormM(f=>({...f,nom:e.target.value}))} placeholder="Ex: Pyramide inverse"/>
          </div>
          <div>
            <div class="lbl">Catégorie</div>
            <select class="inp" value=${formM.categorie} onChange=${e=>setFormM(f=>({...f,categorie:e.target.value}))}>
              ${CATEGORIES.map(c=>_h`<option key=${c} value=${c}>${c}</option>`)}
            </select>
          </div>
          <div style=${{ gridColumn:'1/-1' }}>
            <div class="lbl">Équipement nécessaire</div>
            <div style=${{ display:'flex', gap:6, marginTop:4 }}>
              ${Object.entries(EQUIP_TAGS).map(([key, t]) => _h`<button key=${key} type="button"
                onClick=${() => setFormM(f=>({...f,equipement:key}))}
                style=${{ flex:1, padding:'8px 6px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700,
                  border:'1px solid '+(formM.equipement===key ? t.color : 'rgba(255,255,255,.1)'),
                  background: formM.equipement===key ? t.color+'18' : 'rgba(255,255,255,.03)',
                  color: formM.equipement===key ? t.color : 'rgba(255,255,255,.4)' }}>
                ${t.emoji} ${t.label}
              </button>`)}
            </div>
          </div>
          <div>
            <div class="lbl">Couleur</div>
            <div style=${{ display:'flex', gap:5, marginTop:4 }}>
              ${COULEURS.map(c=>_h`<button key=${c} onClick=${()=>setFormM(f=>({...f,couleur:c}))}
                style=${{ width:22, height:22, borderRadius:'50%', background:c, border: formM.couleur===c?'2px solid #fff':'1px solid transparent', cursor:'pointer' }}></button>`)}
            </div>
          </div>
        </div>

        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Description</div>
          <textarea class="inp" value=${formM.description} onInput=${e=>setFormM(f=>({...f,description:e.target.value}))}
            style=${{ resize:'vertical', minHeight:55 }} placeholder="Principe, objectif, protocole..."></textarea>
        </div>

        <!-- Exercices de référence -->
        <div style=${{ marginBottom:12 }}>
          <div style=${{ fontSize:11, fontWeight:700, marginBottom:8, color:'rgba(255,255,255,.7)' }}>
            Exercices de référence (${formM.exercices.length})
          </div>
          ${formM.exercices.map((ex,i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(255,255,255,.04)', borderRadius:8, marginBottom:5 }}>
            <div>
              <span style=${{ fontSize:12, fontWeight:600 }}>${ex.nom}</span>
              <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginLeft:8 }}>${ex.series}×${ex.reps} · ${ex.repos}</span>
            </div>
            <button onClick=${()=>setFormM(f=>({...f, exercices:f.exercices.filter((_,j)=>j!==i)}))}
              style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', cursor:'pointer', fontSize:14 }}>×</button>
          </div>`)}

          <!-- Ajouter exercice -->
          <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8, background:'rgba(255,255,255,.02)', borderRadius:10, padding:'10px' }}>
            <input class="inp" value=${newEx.nom} onInput=${e=>setNewEx(f=>({...f,nom:e.target.value}))}
              placeholder="Nom exercice" style=${{ flex:'1 1 140px', minWidth:0 }}
              onKeyDown=${e=>e.key==='Enter'&&addEx()}/>
            <input class="inp" value=${newEx.series} onInput=${e=>setNewEx(f=>({...f,series:e.target.value}))}
              placeholder="Séries" style=${{ width:60, textAlign:'center' }}/>
            <input class="inp" value=${newEx.reps} onInput=${e=>setNewEx(f=>({...f,reps:e.target.value}))}
              placeholder="Reps" style=${{ width:60, textAlign:'center' }}/>
            <input class="inp" value=${newEx.repos} onInput=${e=>setNewEx(f=>({...f,repos:e.target.value}))}
              placeholder="Repos" style=${{ width:70, textAlign:'center' }}/>
            <button class="btn btn-sm btn-primary" onClick=${addEx}>+ Ajouter</button>
          </div>
        </div>

        <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${saveCustomMethode}>
          💾 Enregistrer la méthode
        </button>
      </div>` : null}
    </div>` : null}

    <!-- Méthodes custom -->
    ${custom.length > 0 ? _h`<div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Mes méthodes personnalisées</div>
      ${custom.filter(passesFiltres).map(m => _h`<div key=${m.id} style=${{
        background: showMethode===m.id ? m.couleur+'0A' : 'rgba(255,255,255,.025)',
        border:'1px solid '+(showMethode===m.id ? m.couleur+'40' : 'rgba(255,255,255,.1)'),
        borderRadius:14, padding:'14px 18px', marginBottom:8
      }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style=${{ flex:1, cursor:'pointer' }} onClick=${()=>setShowMethode(showMethode===m.id?null:m.id)}>
            <div style=${{ marginBottom:4, display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <span style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:m.couleur+'18', color:m.couleur, fontWeight:700 }}>${m.categorie}</span>
              ${equipOf(m) ? _h`<span style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:equipOf(m).color+'18', color:equipOf(m).color, fontWeight:700 }}>${equipOf(m).emoji} ${equipOf(m).label}</span>` : null}
              <span style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>Personnalisée</span>
            </div>
            <div style=${{ fontSize:15, fontWeight:700, marginBottom:3 }}>${m.nom}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', lineHeight:1.5 }}>${m.description}</div>
          </div>
          <div style=${{ display:'flex', gap:6, marginLeft:10, flexShrink:0 }}>
            <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', padding:'4px 10px', fontSize:11 }}
              onClick=${()=>createFromMethode&&createFromMethode(m)}>Créer séance</button>
            ${isCoach ? _h`<button class="btn btn-sm btn-danger" style=${{ padding:'4px 8px' }} onClick=${()=>deleteCustomMethode(m.id)}>×</button>` : null}
          </div>
        </div>
        ${showMethode === m.id && (m.exercicesRef||[]).length > 0 ? _h`<div style=${{ marginTop:12, borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:12 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Exercices</div>
          ${(m.exercicesRef||[]).map((ex,i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
            <span style=${{ fontSize:12 }}>${ex.nom}</span>
            <span style=${{ fontSize:11, color:m.couleur, fontWeight:700 }}>${ex.series}×${ex.reps} · ${ex.repos}</span>
          </div>`)}
        </div>` : null}
      </div>`)}
    </div>` : null}

    <!-- Méthodes standard -->
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>Méthodes d'entraînement</div>
    ${standard.filter(passesFiltres).map(m => _h`<div key=${m.id} style=${{
      background: showMethode===m.id ? m.couleur+'0A' : 'rgba(255,255,255,.025)',
      border:'1px solid '+(showMethode===m.id ? m.couleur+'40' : 'rgba(255,255,255,.07)'),
      borderRadius:14, padding:'14px 18px', marginBottom:8, cursor:'pointer'
    }} onClick=${() => setShowMethode(showMethode===m.id ? null : m.id)}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style=${{ flex:1 }}>
          <div style=${{ marginBottom:5, display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style=${{ fontSize:10, padding:'3px 10px', borderRadius:20, background:m.couleur+'18', color:m.couleur, fontWeight:700 }}>${m.categorie}</span>
            ${equipOf(m) ? _h`<span style=${{ fontSize:10, padding:'3px 10px', borderRadius:20, background:equipOf(m).color+'18', color:equipOf(m).color, fontWeight:700 }}>${equipOf(m).emoji} ${equipOf(m).label}</span>` : null}
          </div>
          <div style=${{ fontSize:15, fontWeight:700, marginBottom:4 }}>${m.nom}</div>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>${m.description}</div>
        </div>
        <div style=${{ fontSize:14, color:'rgba(255,255,255,.3)', marginLeft:12 }}>${showMethode===m.id?'▲':'▼'}</div>
      </div>
      ${showMethode === m.id && _h`<div style=${{ marginTop:14, borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:14 }}>
        ${m.cycles.length > 0 ? _h`<div style=${{ marginBottom:12 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Structure des cycles</div>
          ${m.cycles.map((cyc, ci) => _h`<div key=${ci} style=${{ background:'rgba(255,255,255,.04)', border:'1px solid '+(m.couleur+'30'), borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
            <!-- Header semaine -->
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <span style=${{ fontSize:10, fontWeight:800, color:m.couleur, marginRight:8 }}>${cyc.sem}</span>
                <span style=${{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.8)' }}>${cyc.label}</span>
              </div>
            </div>
            <!-- Détail série par série si disponible -->
            ${cyc.details ? _h`<div>
              ${cyc.details.map((d, di) => _h`<div key=${di} style=${{
                display:'grid', gridTemplateColumns:'28px 60px 1fr auto', gap:6,
                alignItems:'center', padding:'5px 0',
                borderBottom: di < cyc.details.length-1 ? '1px solid rgba(255,255,255,.04)' : 'none'
              }}>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:700 }}>S${d.serie}</div>
                <div style=${{ fontSize:12, fontWeight:800, color:d.amrap ? m.couleur : 'rgba(255,255,255,.9)' }}>
                  ${d.reps}${d.amrap ? ' 🔥' : ''}
                </div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${d.note || ''}</div>
                <div style=${{ fontSize:11, fontWeight:700, color:m.couleur, minWidth:40, textAlign:'right' }}>
                  ${d.pct ? d.pct+'%' : ''}
                </div>
              </div>`)}
              ${cyc.note ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,.06)', lineHeight:1.5 }}>
                💡 ${cyc.note}
              </div>` : null}
            </div>` : _h`<div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <div style=${{ fontSize:12, color:'rgba(255,255,255,.6)' }}>${cyc.series} séries × ${cyc.reps}</div>
              ${cyc.pct && cyc.pct.length ? _h`<div style=${{ fontSize:11, color:m.couleur }}>@ ${cyc.pct.join('–')}%</div>` : null}
            </div>`}
          </div>`)}
          ${m.assistance ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 12px', marginTop:4, lineHeight:1.6 }}>
            <span style=${{ color:m.couleur, fontWeight:700 }}>Assistance : </span>${m.assistance}
          </div>` : null}
        </div>` : null}
        <div style=${{ marginBottom:14 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Exercices recommandés</div>
          <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
            ${(m.exercices_type || (m.exercicesRef||[]).map(ex=>ex.nom) || []).map(ex => _h`<span key=${ex} style=${{ fontSize:12, padding:'4px 12px', borderRadius:20, background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.7)' }}>${ex}</span>`)}
          </div>
        </div>
        ${m.isTesting
          ? _h`<div style=${{ display:'flex', gap:8 }}>
              <button class="btn" style=${{ flex:1 }} onClick=${e => { e.stopPropagation(); createFromMethode(m, 0); }}>Séance vide</button>
              <button class="btn btn-primary" style=${{ flex:2, background:'rgba(236,72,153,.15)', border:'1px solid rgba(236,72,153,.4)', color:'#EC4899' }}
                onClick=${e => { e.stopPropagation(); setShowTesting(m); setShowMethode(null); }}>🧪 Calculateur de charges</button>
            </div>`
          : _h`<div>
            <!-- Sélecteur de semaine du cycle -->
            ${m.cycles && m.cycles.length > 1 ? _h`<div style=${{ marginBottom:8 }}>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Choisir la semaine du cycle</div>
              <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
                ${m.cycles.map((cyc, ci) => {
                  const isSelected = (selCycleSem[m.id] === ci) || (selCycleSem[m.id] === undefined && ci === 0);
                  return _h`<button key=${ci}
                    onClick=${e => { e.stopPropagation(); setSelCycleSem(prev => ({...prev, [m.id]: ci})); }}
                    style=${{
                      padding:'5px 10px', borderRadius:8, cursor:'pointer',
                      border: isSelected ? '2px solid '+m.couleur : '1px solid rgba(255,255,255,.12)',
                      background: isSelected ? m.couleur+'18' : 'rgba(255,255,255,.04)',
                      color: isSelected ? m.couleur : 'rgba(255,255,255,.5)',
                      fontWeight: isSelected ? 800 : 500,
                      fontSize: 11, fontFamily:'Inter,sans-serif'
                    }}>
                    ${cyc.sem}
                    <div style=${{ fontSize:9, color: isSelected ? m.couleur : 'rgba(255,255,255,.3)', marginTop:1 }}>${cyc.label.split(' ')[0]}</div>
                  </button>`;
                })}
              </div>
            </div>` : null}
            ${(m.isBilanDepart || m.isTemplate) ? _h`<div style=${{ marginBottom:12 }}>
              ${m.protocole ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 12px', marginBottom:8, lineHeight:1.6 }}>
                <span style=${{ color:m.couleur, fontWeight:700 }}>Protocole : </span>${m.protocole}
              </div>` : null}
              ${(m.exercicesRef||[]).map((ex, ei) => _h`<div key=${ei} style=${{ padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', marginBottom:5 }}>
                <div style=${{ display:'flex', justifyContent:'space-between', gap:8, fontSize:12, fontWeight:700, color:'#fff' }}>
                  <span>${ei+1}. ${ex.nom}</span>
                  <span style=${{ color:m.couleur, whiteSpace:'nowrap' }}>${ex.series} × ${ex.reps}</span>
                </div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>${ex.charge||''} · repos ${ex.repos||'—'}</div>
                ${ex.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:4, lineHeight:1.5 }}>${ex.notes}</div>` : null}
              </div>`)}
            </div>` : null}
            <button class="btn btn-primary" style=${{ width:'100%' }}
              onClick=${e => { e.stopPropagation(); createFromMethode(m, selCycleSem[m.id] || 0); }}>
              ${m.isTemplate ? 'Créer cette séance (modifiable)' : m.isBilanDepart ? 'Créer la séance de test (modifiable)' : '\u2192 Créer séance — ' + (m.cycles[(selCycleSem[m.id] || 0)]?.sem || 'S1')}
            </button>
          </div>`
        }
      </div>`}
    </div>`)}

    <!-- Séparateur Réhabilitation -->
    <div style=${{ display:'flex', alignItems:'center', gap:10, margin:'20px 0 12px' }}>
      <div style=${{ height:1, flex:1, background:'rgba(255,255,255,.07)' }}></div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', whiteSpace:'nowrap' }}>Réhabilitation & Réathétisation</div>
      <div style=${{ height:1, flex:1, background:'rgba(255,255,255,.07)' }}></div>
    </div>
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.15)', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
      Protocoles progressifs par articulation — 3 phases. Chaque phase crée une séance indépendante.
    </div>
    ${rehab.map(m => _h`<${RehabMethodCard}
      key=${m.id}
      m=${m}
      isOpen=${showMethode===m.id}
      onOpen=${() => setShowMethode(showMethode===m.id ? null : m.id)}
      onCreateFromPhase=${(phase, method) => {
        const nom = method.articulation.charAt(0).toUpperCase()+method.articulation.slice(1);
        addSeance({
          nom: nom + ' — ' + phase.label.split('\u2014')[0].trim() + ' (' + phase.duree + ')',
          methode: method.nom,
          contexte: phase.duree,
          objectif: phase.objectif,
          rpeCible: phase.id === 'phase1' ? 4 : phase.id === 'phase2' ? 6 : 7,
          notes: 'Protocole ' + method.nom,
          exercices: phase.exercices.map(ex => ({
            nom: ex.nom, series: ex.series, reps: ex.reps,
            charge: ex.charge, repos: ex.repos, notes: ex.notes || ''
          }))
        });
        setShowMethode(null);
      }}
    />`)}
  </div>`;
}

function RehabMethodCard({ m, onCreateFromPhase, onOpen, isOpen }) {

  const ARTIC_EMOJIS = { epaule:'💪', genou:'🦵', cheville:'🦶' };
  const emoji = ARTIC_EMOJIS[m.articulation] || '🏥';

  return _h`<div style=${{
    background: isOpen ? m.couleur+'0A' : 'rgba(255,255,255,.025)',
    border:'1px solid '+(isOpen ? m.couleur+'40' : 'rgba(255,255,255,.07)'),
    borderRadius:14, marginBottom:10, overflow:'hidden'
  }}>
    <!-- Header cliquable -->
    <div style=${{ padding:'14px 18px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}
      onClick=${onOpen}>
      <div style=${{ flex:1 }}>
        <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
          <span style=${{ fontSize:18 }}>${emoji}</span>
          <span style=${{ fontSize:10, padding:'3px 10px', borderRadius:20, background:m.couleur+'18', color:m.couleur, fontWeight:700 }}>
            ${m.categorie}
          </span>
        </div>
        <div style=${{ fontSize:15, fontWeight:700, marginBottom:4 }}>${m.nom}</div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>${m.description}</div>
      </div>
      <div style=${{ fontSize:14, color:'rgba(255,255,255,.3)', marginLeft:12, flexShrink:0 }}>${isOpen?'▲':'▼'}</div>
    </div>

    ${isOpen && _h`<div style=${{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'0 18px 18px' }}>

      <!-- Timeline phases -->
      <div style=${{ display:'flex', gap:6, marginBottom:18, paddingTop:14 }}>
        ${m.phases.map((p,i) => _h`<div key=${p.id} style=${{
          flex:1, background:'rgba(255,255,255,.04)', borderRadius:9, padding:'8px 10px',
          border:'1px solid rgba(255,255,255,.08)'
        }}>
          <div style=${{ fontSize:9, color:m.couleur, fontWeight:700, marginBottom:2 }}>${p.duree}</div>
          <div style=${{ fontSize:10, fontWeight:700, lineHeight:1.3 }}>${p.label.split('—')[1]?.trim() || p.label}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:3 }}>${p.objectif.slice(0,50)}...</div>
        </div>`)}
      </div>

      <!-- Phases détail -->
      ${m.phases.map((phase, pi) => _h`<div key=${phase.id} style=${{ marginBottom:16 }}>
        <!-- Phase header -->
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, background:m.couleur+'12', border:'1px solid '+m.couleur+'25', borderRadius:10, padding:'10px 14px' }}>
          <div>
            <div style=${{ fontSize:13, fontWeight:800, color:m.couleur }}>${phase.label}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2 }}>${phase.objectif}</div>
          </div>
          <div style=${{ fontSize:10, color:m.couleur, fontWeight:700, flexShrink:0, marginLeft:8 }}>${phase.duree}</div>
        </div>

        <!-- Semaines détaillées (si dispo) -->
        ${phase.semaines ? _h`<div style=${{ marginBottom:8 }}>
          ${phase.semaines.map((sem, si) => _h`<div key=${si} style=${{ marginBottom:10 }}>
            <!-- Header semaine -->
            <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style=${{ fontSize:10, fontWeight:800, color:m.couleur, background:m.couleur+'15', border:'1px solid '+m.couleur+'30', borderRadius:6, padding:'2px 8px', flexShrink:0 }}>${sem.sem}</div>
              <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.8)' }}>${sem.titre}</div>
            </div>
            <!-- Exercices de la semaine -->
            ${sem.exercices.map((ex, ei) => _h`<div key=${ei} style=${{
              background:'rgba(255,255,255,.02)', borderRadius:9, padding:'8px 12px', marginBottom:5,
              borderLeft:'3px solid '+m.couleur+'35'
            }}>
              <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style=${{ flex:1, minWidth:0 }}>
                  <div style=${{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                    <span style=${{ fontSize:12, fontWeight:700 }}>${ex.nom}</span>
                    ${React.createElement(BiblioLinkButton, { nomExercice: ex.biblio || ex.nom })}
                  </div>
                  <div style=${{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                    <span style=${{ fontSize:10, color:m.couleur, fontWeight:700 }}>${ex.series} × ${ex.reps}</span>
                    <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>🏋 ${ex.charge}</span>
                    <span style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>⏱ ${ex.repos}</span>
                  </div>
                </div>
              </div>
              ${ex.notes ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:5, lineHeight:1.5 }}>
                💡 ${ex.notes}
              </div>` : null}
            </div>`)}
          </div>`)}
        </div>` : _h`<div>
          ${phase.exercices.map((ex, ei) => _h`<div key=${ei} style=${{
            background:'rgba(255,255,255,.025)', borderRadius:10, padding:'10px 13px', marginBottom:6,
            borderLeft:'3px solid '+m.couleur+'40'
          }}>
            <div style=${{ fontSize:13, fontWeight:700 }}>${ex.nom}</div>
            <div style=${{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap' }}>
              <span style=${{ fontSize:10, color:'rgba(255,255,255,.5)' }}>📊 ${ex.series} séries</span>
              <span style=${{ fontSize:10, color:m.couleur, fontWeight:700 }}>× ${ex.reps}</span>
              <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>🏋 ${ex.charge}</span>
              <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>⏱ ${ex.repos}</span>
            </div>
            ${ex.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:6, lineHeight:1.5 }}>💡 ${ex.notes}</div>` : null}
          </div>`)}
        </div>`}

        <!-- Bouton créer séance pour cette phase -->
        <button
          class="btn btn-sm"
          style=${{ width:'100%', marginTop:6, background:m.couleur+'12', border:'1px solid '+m.couleur+'30', color:m.couleur, fontWeight:700 }}
          onClick=${() => onCreateFromPhase(phase, m)}
        >
          → Créer la séance "${phase.label.split('—')[0].trim()}" (${phase.duree})
        </button>
      </div>`)}

    </div>`}
  </div>`;
}


function TestingCalculator({ player, methode, onCreateSeance, onClose }) {
  const poids = player.poids || 80;

  const NIVEAUX = methode.niveaux || {
    squat:  { debutant:1.0, intermediaire:1.3, avance:1.6, elite:1.8 },
    bench:  { debutant:0.7, intermediaire:0.9, avance:1.1, elite:1.3 },
    rdl:    { debutant:1.1, intermediaire:1.4, avance:1.7, elite:2.0 },
    rowing: { debutant:0.7, intermediaire:0.9, avance:1.1, elite:1.3 },
  };

  const MOUVEMENTS = [
    { key:'squat',  nom:'Back Squat',       emoji:'🏋️', color:'#FF4455', group:'lower',
      info:'Force fondamentale. Standard elite N1: 1.8× PC' },
    { key:'rdl',    nom:'Romanian Deadlift',  emoji:'🔥', color:'#FFA420', group:'lower',
      info:'Ischio-jambiers & fessiers. Clé prévention & explosivité.' },
    { key:'bench',  nom:'Bench Press',        emoji:'💪', color:'#FF7A00', group:'upper',
      info:'Force haut du corps. Transfert direct aux lancers.' },
    { key:'rowing', nom:'Rowing barre',       emoji:'⚡', color:'#38BDF8', group:'upper',
      info:'Force tirée. Équilibre agoniste/antagoniste épaule.' },
  ];

  const PATTERNS = [
    { id:'full',   label:'Full body',    icon:'💪', keys:['squat','bench','rdl','rowing'] },
    { id:'lower',  label:'Lower body',   icon:'🦵', keys:['squat','rdl'] },
    { id:'upper',  label:'Upper body',   icon:'🤾', keys:['bench','rowing'] },
    { id:'push',   label:'Push',         icon:'⬆️', keys:['squat','bench'] },
    { id:'pull',   label:'Pull',         icon:'⬇️', keys:['rdl','rowing'] },
    { id:'custom', label:'Personnalisé', icon:'✏️', keys:[] },
  ];

  const PROTOCOLES = {
    '531':     { label:'5-3-1 Wendler',  sets:[
      { label:'S1 (5 reps)', pcts:[65,75,85] },
      { label:'S2 (3 reps)', pcts:[70,80,90] },
      { label:'S3 (peak)',   pcts:[75,85,95] },
    ]},
    'testing': { label:'Testing direct', sets:[
      { label:'Échauffement', pcts:[50,60,70] },
      { label:'Montée',       pcts:[80,90,97] },
      { label:'Test 1RM',     pcts:[100]       },
    ]},
    'hyp':     { label:'Hypertrophie',   sets:[
      { label:'S1 (12-15r)', pcts:[60,65,70] },
      { label:'S2 (10-12r)', pcts:[65,70,75] },
      { label:'S3 (8-10r)',  pcts:[70,75,80] },
    ]},
  };

  const NIVEAU_LABELS = ['Débutant','Intermédiaire','Avancé','Elite'];
  const NIVEAU_KEYS   = ['debutant','intermediaire','avance','elite'];
  const NIVEAU_COLORS = ['#38BDF8','#4CAF50','#FFB800','#FF4455'];

  const initRM = {};
  MOUVEMENTS.forEach(m => {
    initRM[m.key] = { rm1:'', niveauAuto: Math.round(NIVEAUX[m.key].intermediaire * poids) };
  });

  const [rms,       setRms]       = useState(initRM);
  const [usePC,     setUsePC]     = useState(true);
  const [protocole, setProtocole] = useState('531');
  const [pattern,   setPattern]   = useState('full');
  const [selected,  setSelected]  = useState(new Set(['squat','bench','rdl','rowing']));
  const [nomSeance, setNomSeance] = useState('');

  function applyPattern(pat) {
    setPattern(pat.id);
    if (pat.id !== 'custom') setSelected(new Set(pat.keys));
  }

  function toggleExo(key) {
    setPattern('custom');
    setSelected(s => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  function updRM(key, val) {
    setRms(r => ({ ...r, [key]: { ...r[key], rm1: val } }));
  }

  function get1RM(key) {
    if (!usePC && rms[key].rm1) return parseFloat(rms[key].rm1) || 0;
    return rms[key].niveauAuto;
  }

  function round5(n) { return Math.round(n / 2.5) * 2.5; }

  function getNiveau(key) {
    const ratio = get1RM(key) / poids;
    const niv = NIVEAUX[key];
    if (ratio >= niv.elite)         return 3;
    if (ratio >= niv.avance)        return 2;
    if (ratio >= niv.intermediaire) return 1;
    return 0;
  }

  function buildSeance() {
    const prot = PROTOCOLES[protocole];
    const activeMouvements = MOUVEMENTS.filter(m => selected.has(m.key));
    const patLabel = PATTERNS.find(p => p.id === pattern)?.label || 'Personnalisé';
    const nom = nomSeance.trim() || 'Testing ' + patLabel + ' — ' + prot.label;
    const exercices = activeMouvements.map(m => {
      const rm = get1RM(m.key);
      const mainSet  = prot.sets[prot.sets.length - 1];
      const mainPct  = mainSet.pcts[mainSet.pcts.length - 1];
      return {
        nom:    m.nom,
        series: prot.sets.length,
        reps:   protocole === '531' ? '5/3/1' : protocole === 'testing' ? '1-3' : '10-12',
        charge: round5(rm * mainPct / 100) + 'kg (' + mainPct + '% de ' + rm + 'kg)',
        repos:  protocole === 'hyp' ? '90s' : '3-4min',
        notes:  prot.sets.map(s => s.label + ': ' + s.pcts.map(p => round5(rm*p/100)+'kg').join(' / ')).join(' | '),
      };
    });
    return {
      nom, methode: methode.nom,
      contexte: 'PC: ' + poids + 'kg | ' + patLabel,
      objectif: 'Testing charges — ' + activeMouvements.map(m => m.nom).join(', '),
      rpeCible: protocole === 'testing' ? 10 : protocole === '531' ? 8 : 7,
      notes: 'Protocole: ' + prot.label + ' | Pattern: ' + patLabel,
      exercices,
    };
  }

  const proto = PROTOCOLES[protocole];
  const activeMovs = MOUVEMENTS.filter(m => selected.has(m.key));

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:640 }} onClick=${e => e.stopPropagation()}>

      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style=${{ fontSize:15, fontWeight:800 }}>🧪 Testing — Calcul des charges</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${player.name} · ${poids} kg</div>
        </div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:22, cursor:'pointer' }}>×</button>
      </div>

      <div class="edit-modal-body">

        <!-- ── PATTERNS ── -->
        <div style=${{ marginBottom:16 }}>
          <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Pattern de séance</div>
          <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
            ${PATTERNS.map(pat => _h`<button key=${pat.id}
              onClick=${() => applyPattern(pat)}
              style=${{ padding:'7px 14px', borderRadius:9, border:'1px solid '+(pattern===pat.id?'#FFA42060':'rgba(255,255,255,.1)'),
                         background:pattern===pat.id?'rgba(255,164,32,.15)':'rgba(255,255,255,.04)',
                         color:pattern===pat.id?'#FFA420':'rgba(255,255,255,.5)',
                         fontWeight:pattern===pat.id?700:400, fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif',
                         display:'flex', alignItems:'center', gap:5 }}
            >${pat.icon} ${pat.label}</button>`)}
          </div>
        </div>

        <!-- ── SÉLECTION EXERCICES ── -->
        <div style=${{ marginBottom:16 }}>
          <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>
            Exercices — ${selected.size} sélectionné${selected.size>1?'s':''}
          </div>
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            ${MOUVEMENTS.map(m => {
              const rm      = get1RM(m.key);
              const niv     = getNiveau(m.key);
              const isSelected = selected.has(m.key);
              return _h`<div key=${m.key}
                onClick=${() => toggleExo(m.key)}
                style=${{
                  background: isSelected ? m.color+'12' : 'rgba(255,255,255,.025)',
                  border: '2px solid '+(isSelected ? m.color+'60' : 'rgba(255,255,255,.06)'),
                  borderRadius:12, padding:'12px 14px', cursor:'pointer',
                  opacity: isSelected ? 1 : 0.45, transition:'all .15s'
                }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style=${{ fontSize:13, fontWeight:700 }}>${m.emoji} ${m.nom}</div>
                    <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>${m.info}</div>
                  </div>
                  <div style=${{ width:20, height:20, borderRadius:5, border:'2px solid '+(isSelected?m.color:'rgba(255,255,255,.2)'),
                    background:isSelected?m.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, color:'#fff', flexShrink:0 }}>${isSelected?'✓':''}</div>
                </div>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style=${{ fontSize:20, fontWeight:800, color:isSelected?m.color:'rgba(255,255,255,.3)', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${rm} kg</div>
                  <div style=${{ fontSize:9, padding:'2px 7px', borderRadius:20, background:NIVEAU_COLORS[niv]+'20', color:NIVEAU_COLORS[niv], fontWeight:700 }}>${NIVEAU_LABELS[niv]}</div>
                </div>
                ${!usePC ? _h`<div style=${{ marginTop:8 }}>
                  <input class="inp" type="number" value=${rms[m.key].rm1}
                    onInput=${e => { e.stopPropagation(); updRM(m.key, e.target.value); }}
                    onClick=${e => e.stopPropagation()}
                    placeholder=${'Auto: '+rms[m.key].niveauAuto+' kg'}
                    style=${{ fontSize:12, padding:'5px 8px' }}/>
                </div>` : null}
              </div>`;
            })}
          </div>
        </div>

        <!-- ── TOGGLE PC/1RM ── -->
        <div style=${{ display:'flex', gap:6, marginBottom:14, background:'rgba(255,255,255,.03)', borderRadius:10, padding:3 }}>
          <button onClick=${() => setUsePC(true)}
            style=${{ flex:1, padding:'7px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
                       fontWeight:usePC?700:400, background:usePC?'rgba(255,255,255,.1)':'transparent', color:usePC?'#fff':'rgba(255,255,255,.4)' }}>
            ⚖️ Calcul par PC (${poids} kg)
          </button>
          <button onClick=${() => setUsePC(false)}
            style=${{ flex:1, padding:'7px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
                       fontWeight:!usePC?700:400, background:!usePC?'rgba(255,255,255,.1)':'transparent', color:!usePC?'#fff':'rgba(255,255,255,.4)' }}>
            🎯 Saisir 1RM connus
          </button>
        </div>

        <!-- ── PROTOCOLE ── -->
        <div style=${{ marginBottom:14 }}>
          <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Protocole</div>
          <div style=${{ display:'flex', gap:6 }}>
            ${Object.entries(PROTOCOLES).map(([k,v]) => _h`<button key=${k}
              onClick=${() => setProtocole(k)}
              style=${{ padding:'7px 14px', borderRadius:9, border:'1px solid '+(protocole===k?'rgba(255,20,147,.4)':'rgba(255,255,255,.1)'),
                         background:protocole===k?'rgba(255,20,147,.1)':'rgba(255,255,255,.04)',
                         color:protocole===k?'#EC4899':'rgba(255,255,255,.5)',
                         fontWeight:protocole===k?700:400, fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}
            >${v.label}</button>`)}
          </div>
        </div>

        <!-- ── APERÇU CHARGES ── -->
        ${activeMovs.length > 0 && _h`<div style=${{ background:'rgba(255,255,255,.03)', borderRadius:11, padding:'12px 14px', marginBottom:14 }}>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', fontWeight:700, marginBottom:10 }}>${proto.label} — Charges des ${activeMovs.length} exercice${activeMovs.length>1?'s':''} sélectionnés</div>
          <div style=${{ display:'grid', gridTemplateColumns:'repeat('+Math.min(activeMovs.length,4)+',1fr)', gap:10 }}>
            ${activeMovs.map(m => {
              const rm = get1RM(m.key);
              return _h`<div key=${m.key} style=${{ textAlign:'center' }}>
                <div style=${{ fontSize:11, color:m.color, fontWeight:700, marginBottom:6 }}>${m.emoji} ${m.nom.split(' ')[0]}</div>
                ${proto.sets.map((s,i) => _h`<div key=${i} style=${{ marginBottom:3 }}>
                  <div style=${{ fontSize:8, color:'rgba(255,255,255,.3)' }}>${s.label}</div>
                  <div style=${{ fontSize:12, fontWeight:700 }}>${s.pcts.map(p => round5(rm*p/100)).join('/')} kg</div>
                </div>`)}
              </div>`;
            })}
          </div>
        </div>`}

        <!-- ── NOM SÉANCE ── -->
        <div>
          <div class="lbl">Nom de la séance (optionnel)</div>
          <input class="inp" value=${nomSeance} onInput=${e => setNomSeance(e.target.value)}
            placeholder=${'Testing ' + (PATTERNS.find(p=>p.id===pattern)?.label||'') + ' — ' + proto.label}/>
        </div>

      </div>

      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Fermer</button>
        <button class="btn btn-primary" style=${{ flex:2, background:'rgba(236,72,153,.15)', border:'1px solid rgba(236,72,153,.4)', color:'#EC4899' }}
          disabled=${selected.size === 0}
          onClick=${() => { onCreateSeance(buildSeance()); onClose(); }}>
          → Créer la séance (${selected.size} exercice${selected.size>1?'s':''})
        </button>
      </div>
    </div>
  </div>`;
}
