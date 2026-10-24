

// ── PROTOCOLES MOBILITE ─────────────────────────────────────────────────────
const PROTOCOLES_MOBILITE = [
  {
    id: "mob_epaule",
    nom: "Mobilite epaule",
    couleur: "#38BDF8",
    icon: "💪",
    description: "Protocole mobilite epaule : amplitude de rotation, flexion/extension, elevation. 3 semaines de progression. Ideal avant PPG, en echauffement ou en recuperation.",
    duree_totale: "20-30 min / seance",
    frequence: "3-4x / semaine",
    semaines: [
      {
        sem: "S1", titre: "Amplitude de base - Decouverte",
        objectif: "Identifier les restrictions. Travailler en amplitude confortable. Pas de douleur.",
        seances: [
          {
            exercice: "Cercles d'epaule actifs",
            series: 3, reps: "10 / sens", repos: "30s",
            charge: "Corps",
            execution: "Bras le long du corps. Faire des grands cercles vers l'avant puis vers l'arriere. Amplitude maximale confortable.",
            cible: "Capsule articulaire, deltoide"
          },
          {
            exercice: "Rotation interne / externe debout",
            series: 3, reps: "15 / sens", repos: "30s",
            charge: "Corps - coude a 90",
            execution: "Coude au corps a 90 deg. Faire tourner l'avant-bras vers l'interieur puis l'exterieur. Amplitude maximale sans douleur. S1 : amplitude libre.",
            cible: "Coiffe des rotateurs"
          },
          {
            exercice: "Pendule actif (Codman ameliore)",
            series: 3, reps: "30s / direction", repos: "30s",
            charge: "Corps ou 1 kg",
            execution: "Penche en avant, bras pendant. Balancer d'avant en arriere, puis cote-cote, puis en cercles. Relaxer completement l'epaule.",
            cible: "Capsule inferieure, reduction tension"
          },
          {
            exercice: "Etirement pectoral au mur",
            series: 3, reps: "30s / cote", repos: "20s",
            charge: "Corps",
            execution: "Main au mur a hauteur d'epaule, bras tendu. Faire pivoter le corps vers l'oppose. Sentir l'etirement pectoral. S1 : angle 90 deg.",
            cible: "Grand pectoral, deltoide anterieur"
          },
          {
            exercice: "Retraction scapulaire + depression",
            series: 3, reps: "12", repos: "30s",
            charge: "Corps",
            execution: "Ramener les omoplates vers la colonne ET vers le bas simultanement. Tenir 3s. Ne pas contracter les trapeces superieurs.",
            cible: "Rhomboides, trapeze inferieur"
          },
        ]
      },
      {
        sem: "S2", titre: "Amplitude profonde - Progression",
        objectif: "Augmenter l'amplitude de rotation et de flexion. Introduire la resistance legere.",
        seances: [
          {
            exercice: "Rotation externe progressive (elastique)",
            series: 4, reps: "15 / cote", repos: "30s",
            charge: "Elastique leger",
            execution: "S2 : ajouter un elastique tres leger. Aller en RE maximale PUIS relacher lentement (3s). Chercher les derniers degres d'amplitude.",
            cible: "Coiffe des rotateurs, capsule posterieure"
          },
          {
            exercice: "Flexion epaule contre mur (glisse)",
            series: 3, reps: "12", repos: "30s",
            charge: "Corps",
            execution: "Dos au mur, coudes a 90 deg. Glisser les bras vers le haut le long du mur (bras en W puis Y). Garder le dos plaque au mur. Amplitude maximale.",
            cible: "Flexion epaule, serratus anterieur"
          },
          {
            exercice: "Cross-body stretch (etirement capsule post.)",
            series: 3, reps: "30s / cote", repos: "20s",
            charge: "Corps",
            execution: "Amener le bras devant la poitrine, l'autre main tire le coude vers l'epaule opposee. Ne pas tourner le buste. Sentir l'arriere de l'epaule.",
            cible: "Capsule posterieure, deltoide posterieur"
          },
          {
            exercice: "Sleeper stretch",
            series: 3, reps: "30s / cote", repos: "20s",
            charge: "Corps",
            execution: "Allonge sur le cote (cote blesse en bas). Coude a 90 deg. Avec l'autre main, pousser doucement le poignet vers le sol. Etirement progressif.",
            cible: "Capsule posterieure (gold standard)"
          },
          {
            exercice: "CARS epaule (Controlled Articular Rotations)",
            series: 3, reps: "5 / sens / cote", repos: "30s",
            charge: "Corps",
            execution: "Bras le long du corps. Faire le tour de la TOUTE l'amplitude articulaire en contraction active (FLX > ABD > EXT > ADD). Lentement : 8-10s par cercle.",
            cible: "Amplitude articulaire globale, controle neuro-musculaire"
          },
        ]
      },
      {
        sem: "S3", titre: "Amplitude maximale + controle actif",
        objectif: "Atteindre l'amplitude maximale avec controle. Preparer le retour au sport.",
        seances: [
          {
            exercice: "CARS epaule leste",
            series: 4, reps: "5 / sens / cote", repos: "30s",
            charge: "1-2 kg",
            execution: "S3 : ajouter 1-2 kg. Le poids amplifie le travail de controle actif en amplitude. Meme lenteur (8-10s par cercle).",
            cible: "Force en amplitude, controle articulaire"
          },
          {
            exercice: "Rotation externe 90/90 allonge",
            series: 4, reps: "15 / cote", repos: "30s",
            charge: "Haltere 2-4 kg",
            execution: "Allonge sur le ventre, epaule et coude a 90 deg. Lever l'avant-bras vers le plafond. Lent (2s haut, 3s retour).",
            cible: "Coiffe des rotateurs en position de lancer"
          },
          {
            exercice: "Etirement pectoral angle progressif",
            series: 4, reps: "30s / cote", repos: "20s",
            charge: "Corps",
            execution: "S3 : tester 3 angles : bras a 90 deg, 110 deg, 130 deg. Chaque position etire une portion differente du pectoral.",
            cible: "Pectoral (portions sternale, claviculaire)"
          },
          {
            exercice: "End-range hold flexion",
            series: 3, reps: "5 x 5s", repos: "30s",
            charge: "Corps ou 1 kg",
            execution: "Monter le bras a la hauteur maximale atteignable. Tenir 5s en contraction active. Redescendre lentement. Chercher a aller 1 degre plus loin a chaque rep.",
            cible: "Flexion terminale, force en amplitude"
          },
          {
            exercice: "Banded dislocates",
            series: 3, reps: "10", repos: "30s",
            charge: "Elastique tres leger",
            execution: "Tenir l'elastique large devant soi. Passer le bras au-dessus de la tete et dans le dos dans un seul mouvement (prise large). Revenir. Reduire l'ecart progressivement.",
            cible: "Amplitude globale epaule, retraction scapulaire"
          },
        ]
      },
    ]
  },

  {
    id: "mob_hanche",
    nom: "Mobilite hanche",
    couleur: "#FFA420",
    icon: "🦴",
    description: "Protocole mobilite hanche : flexion, extension, rotation interne/externe, abduction. 3 semaines de progression. Crucial pour le handball (changements de direction, sauts, sprints).",
    duree_totale: "20-30 min / seance",
    frequence: "3-4x / semaine",
    semaines: [
      {
        sem: "S1", titre: "Ouverture de base - Decouverte",
        objectif: "Identifier les restrictions. Travailler en amplitude confortable. Pas de compensation lombaire.",
        seances: [
          {
            exercice: "90/90 Hip Stretch (position du tailleur avance)",
            series: 3, reps: "60s / cote", repos: "20s",
            charge: "Corps",
            execution: "Assis au sol, jambe avant a 90 deg (RE), jambe arriere a 90 deg (RI). Maintenir le buste droit. S1 : position passive, laisser les hanches s'ouvrir. Pas de bascule du bassin.",
            cible: "Rotation interne + externe hanche simultanement"
          },
          {
            exercice: "Lunge hip flexor stretch (fente basse)",
            series: 3, reps: "45s / cote", repos: "20s",
            charge: "Corps",
            execution: "Genoux au sol, pied avant devant. Avancer le bassin vers l'avant jusqu'a sentir l'etirement du hip flexor (avant cuisse arriere). Buste droit, pas de lordose.",
            cible: "Psoas-iliaque, droit anterieur"
          },
          {
            exercice: "Pigeon pose (debut)",
            series: 3, reps: "45s / cote", repos: "20s",
            charge: "Corps",
            execution: "Au sol, jambe avant pliee devant, jambe arriere tendue derriere. S1 : position sureleve sur les mains ou les coudes. Ne pas forcer.",
            cible: "Rotateurs externes hanche, piriforme"
          },
          {
            exercice: "Cercles de hanche debout",
            series: 3, reps: "10 / sens / cote", repos: "20s",
            charge: "Corps",
            execution: "Debout sur 1 pied. Faire de grands cercles avec le genou de la jambe libre : lever, ouvrir, fermer, baisser. Amplitude maximale sans perdre l'equilibre.",
            cible: "Amplitude articulaire globale hanche"
          },
          {
            exercice: "Squat profond maintenu (Ass to Grass)",
            series: 3, reps: "60s", repos: "30s",
            charge: "Corps",
            execution: "Pieds largeur d'epaules, orteils legerement ouverts. Descendre au maximum. S1 : se tenir a un support si necessaire. Talons au sol obligatoire.",
            cible: "Flexion profonde, dorsiflexion cheville, RI hanche"
          },
        ]
      },
      {
        sem: "S2", titre: "Rotation active - Progression",
        objectif: "Developper le controle actif des rotations. Augmenter l'amplitude avec effort musculaire.",
        seances: [
          {
            exercice: "90/90 avec transition active",
            series: 4, reps: "5 transitions / cote", repos: "30s",
            charge: "Corps",
            execution: "S2 : depuis la position 90/90, lever les fessiers du sol et switcher les jambes de l'autre cote en un mouvement fluide. Controle total sans aide des mains.",
            cible: "Controle actif RI/RE hanche"
          },
          {
            exercice: "CARS hanche (Controlled Articular Rotations)",
            series: 3, reps: "5 / sens / cote", repos: "30s",
            charge: "Corps",
            execution: "Debout sur 1 pied (tenir mur). Faire le tour complet de l'amplitude de la hanche libre en contraction active : FLX > ABD > EXT > ADD. 8-10s par cercle.",
            cible: "Amplitude articulaire globale, controle neuro-musculaire"
          },
          {
            exercice: "Cossack squat (squat lateral)",
            series: 3, reps: "8 / cote", repos: "30s",
            charge: "Corps",
            execution: "Jambes tres ecartees. S'accroupir sur une jambe (genoux dans l'axe) pendant que l'autre reste tendue. Pied de la jambe tendue pointe vers le plafond ou au sol. Alterner.",
            cible: "Abduction, adduction, flexion laterale"
          },
          {
            exercice: "Hip IR/ER isometrique au sol",
            series: 3, reps: "10 x 5s / sens", repos: "30s",
            charge: "Corps",
            execution: "Assis par terre, jambes a 90 deg. Pousser le genou vers l'interieur (RI) contre la main qui resiste. Puis vers l'exterieur (RE). Contraction 5s. Isometrie.",
            cible: "Rotateurs internes et externes actifs"
          },
          {
            exercice: "Pigeon dynamique (rocking)",
            series: 3, reps: "15 / cote", repos: "20s",
            charge: "Corps",
            execution: "Position pigeon au sol. Aller et venir en avant (vers la cuisse) et en arriere. Mouvement pendulaire. S2 : plus de profondeur et de controle qu'en S1.",
            cible: "Rotateurs externes profonds, capsule posterieure hanche"
          },
        ]
      },
      {
        sem: "S3", titre: "Force en amplitude - Transfert sport",
        objectif: "Renforcer les hanches dans les amplitudes gagnees. Transfert vers les gestes handball.",
        seances: [
          {
            exercice: "CARS hanche leste",
            series: 4, reps: "5 / sens / cote", repos: "30s",
            charge: "Cheville 1-2 kg",
            execution: "S3 : ajouter une chevillere lestee. Meme mouvement de CARS. Le poids augmente la demande de controle en amplitude extreme.",
            cible: "Force en amplitude articulaire, controle neuro-musculaire"
          },
          {
            exercice: "Copenhagen plank (adducteurs)",
            series: 3, reps: "20-30s / cote", repos: "45s",
            charge: "Corps",
            execution: "Allonge sur le cote, pied superieur sur un banc ou step. Lever les hanches en planche. Option : lever la jambe inferieure aussi (difficile).",
            cible: "Adducteurs en isometrie, tres specifique handball"
          },
          {
            exercice: "Hip 90/90 avec end-range isometrie",
            series: 4, reps: "5 x 5s / cote", repos: "30s",
            charge: "Corps",
            execution: "En position 90/90, aller a l'amplitude maximale de la rotation PUIS pousser contre le sol isometriquement 5s. Relaxer. Repeter. Gagner de l'amplitude a chaque serie.",
            cible: "PAILs/RAILs (progressivite amplitude)"
          },
          {
            exercice: "Cossack squat avec pause",
            series: 4, reps: "6 / cote", repos: "30s",
            charge: "Corps ou 4-8 kg",
            execution: "S3 : tenir 3s en position basse du cossack. Option : tenir un kettlebell ou une plaque. Controle maximum avant de repartir.",
            cible: "Force en amplitude laterale"
          },
          {
            exercice: "Broad jump landing -> squat profond",
            series: 4, reps: "5", repos: "60s",
            charge: "Corps",
            execution: "Saut en longueur. Atterrir en squat profond controle, tenir 2s. Simuler l'atterrissage apres un saut handball. Hanche doit absorber le choc avec amplitude.",
            cible: "Transfert mobilite hanche vers geste handball"
          },
        ]
      },
    ]
  },

  {
    id: "mob_cheville",
    nom: "Mobilite cheville",
    couleur: "#7C6FFF",
    icon: "🦶",
    description: "Protocole mobilite cheville : dorsiflexion (LA cle du handball), eversion/inversion, rotation globale. 3 semaines. La dorsiflexion limite directement la profondeur du squat et les changements de direction.",
    duree_totale: "15-20 min / seance",
    frequence: "Quotidien si possible",
    semaines: [
      {
        sem: "S1", titre: "Dorsiflexion de base - Evaluation",
        objectif: "Mesurer et travailler la dorsiflexion. Objectif : > 10 cm au mur (knee-to-wall test). Mobilite globale.",
        seances: [
          {
            exercice: "Knee-to-wall test + travail",
            series: 3, reps: "15 / cote", repos: "20s",
            charge: "Corps",
            execution: "Au mur, pied a 5cm. Amener le genou toucher le mur sans lever le talon. Mesurer la distance max. S1 : travailler a la distance actuelle, 15 reps lentes chaque pied.",
            cible: "Dorsiflexion cheville (test de reference)"
          },
          {
            exercice: "Alphabet actif cheville",
            series: 2, reps: "Alphabet complet / pied", repos: "20s",
            charge: "Corps",
            execution: "Assis ou debout sur 1 pied. Tracer toutes les lettres de l'alphabet avec le pied dans l'air. Amplitude maximale dans toutes les directions.",
            cible: "Mobilite globale, toutes directions"
          },
          {
            exercice: "Veau (calf stretch) au mur",
            series: 3, reps: "45s / cote", repos: "15s",
            charge: "Corps",
            execution: "Pied plat au mur, talon au sol, genou tendu. Lean vers le mur. S1 : genou tendu (gastrocneme). Puis flechir le genou (solaaire). 2 etirements distincts.",
            cible: "Gastrocneme (genou tendu) + solaaire (genou flechis)"
          },
          {
            exercice: "Rotation cheville assise",
            series: 3, reps: "10 / sens / pied", repos: "15s",
            charge: "Corps",
            execution: "Assis, faire de grands cercles avec le pied. Dans les deux sens. Amplitude maximale. Mouvement lent et controle.",
            cible: "Amplitude articulaire globale cheville"
          },
          {
            exercice: "Elevation talons bilaterale lente",
            series: 3, reps: "15", repos: "30s",
            charge: "Corps",
            execution: "Debout, monter sur la pointe des pieds. Tenir 2s en haut. Descendre LENTEMENT (4s). Aller en dessous du niveau du sol si possible (marche ou step).",
            cible: "Amplitude plantaire, solaaire, gastrocneme"
          },
        ]
      },
      {
        sem: "S2", titre: "Dorsiflexion profonde - SNAG",
        objectif: "Gagner en dorsiflexion avec technique SNAG et banded. Approfondir les rotations.",
        seances: [
          {
            exercice: "SNAG dorsiflexion (elastique + mouvement)",
            series: 4, reps: "15 / pied", repos: "20s",
            charge: "Elastique moyen",
            execution: "Elastique autour des malleoles, l'autre bout fixe derriere. Genoux en fente avant. Avancer le genou vers l'avant le plus loin possible. L'elastique tire l'astragale en arriere (recre l'espace articulaire).",
            cible: "Dorsiflexion profonde (technique kinesin)"
          },
          {
            exercice: "Knee-to-wall progressif (distance augmente)",
            series: 4, reps: "12 / cote", repos: "20s",
            charge: "Corps",
            execution: "S2 : reculer le pied de 1cm par rapport a S1. Objectif : atteindre 10 cm minimum. Mesurer le progres.",
            cible: "Dorsiflexion mesurable"
          },
          {
            exercice: "3D calf stretch",
            series: 3, reps: "10 / direction / pied", repos: "20s",
            charge: "Corps",
            execution: "Pied sur marche ou step, talon dehors. 1) Avancer genou droit. 2) Avancer genou vers l'interieur. 3) Avancer genou vers l'exterieur. 3 directions = 3 portions musculaires.",
            cible: "Gastrocneme/solaaire dans les 3 plans"
          },
          {
            exercice: "Ankle CARs (Controlled Articular Rotations)",
            series: 3, reps: "5 / sens / pied", repos: "20s",
            charge: "Corps",
            execution: "Assis ou debout sur 1 pied. Faire le tour COMPLET de l'amplitude de la cheville en contraction active. Plantar FLX > Eversion > Dorsi FLX > Inversion. Lentement 8s.",
            cible: "Controle articulaire global cheville"
          },
          {
            exercice: "Banded eversion isometrique",
            series: 3, reps: "10 x 5s / pied", repos: "30s",
            charge: "Elastique",
            execution: "Elastique en tension voulant inverser la cheville. Resister en eversion 5s. Renforce les peroniers (cle prevention entorse laterale).",
            cible: "Everseurs (peroniers), prevention recidive"
          },
        ]
      },
      {
        sem: "S3", titre: "Force en amplitude + transfert handball",
        objectif: "Consolider les gains. Renforcer la cheville en amplitude extreme. Gestes specifiques.",
        seances: [
          {
            exercice: "Elevation talon unilaterale + amplitude maximale",
            series: 4, reps: "12 / pied", repos: "30s",
            charge: "Corps + 10-20 kg",
            execution: "Sur un step, pied entier dessus. Monter sur la pointe en maximum. Descendre sous le niveau du step (amplitude negative). S3 : ajouter 10-20kg (sac, haltere).",
            cible: "Force en amplitude plantaire, prevention Achille"
          },
          {
            exercice: "SNAG dorsiflexion + squat",
            series: 4, reps: "10", repos: "20s",
            charge: "Elastique + corps",
            execution: "SNAG elastique en place. Faire des squats profonds avec l'elastique. L'elastique permet une dorsiflexion plus profonde. Constater la difference.",
            cible: "Transfert dorsiflexion vers squat"
          },
          {
            exercice: "Single leg balance progressif",
            series: 3, reps: "30s / scenarios", repos: "20s",
            charge: "Corps",
            execution: "Unipodal : 1) yeux ouverts sol dur, 2) yeux fermes sol dur, 3) plateau instable, 4) plateau + attraper ballon, 5) plateau + perturbation. 30s chaque scenario.",
            cible: "Proprioception fonctionnelle, transfert match"
          },
          {
            exercice: "Skipping talon-pointe lent",
            series: 3, reps: "20m", repos: "30s",
            charge: "Corps",
            execution: "Marche/course lente en exagerant le deroulement du pied : talon > milieu > pointe. Forcer la dorsiflexion a chaque appui. Transfert direct vers la course.",
            cible: "Transfert mobilite cheville vers course"
          },
          {
            exercice: "Ankle CARs leste",
            series: 3, reps: "5 / sens / pied", repos: "20s",
            charge: "Chevillere 1 kg",
            execution: "S3 : meme CARS qu'en S2 avec chevillere lestee. Demande de controle maximale en amplitude extreme.",
            cible: "Force en amplitude articulaire cheville"
          },
        ]
      },
    ]
  },
,

  // ── ECHAUFFEMENTS ──────────────────────────────────────────────────────────
  {
    id: "echauff_course",
    nom: "Echauffement course a pied",
    couleur: "#FFA420",
    icon: "🏃",
    type: "echauffement",
    description: "Preparation athletique complete avant seance de course. Gammes + travail de pied. Duree : 15-20 min. A realiser systematiquement avant tout intervalle ou fractionne.",
    duree_totale: "15-20 min",
    frequence: "Avant chaque seance course",
    blocs: [
      {
        id: "bloc1",
        titre: "Bloc 1 — Activation generale",
        duree: "4-5 min",
        couleur: "#38BDF8",
        description: "Monter la temperature corporelle et la frequence cardiaque progressivement.",
        exercices: [
          { exercice: "Marche active", duree: "1 min", detail: "Pas normal, bras actifs. Demarrage en douceur.", note: "" },
          { exercice: "Trot tres leger", duree: "2 min", detail: "Allure tres lente (60-65% VMA). Respiration nasale. Ne pas accelerer.", note: "FC cible : < 65% FCmax" },
          { exercice: "Accelerations progressives x3", duree: "1 min", detail: "3 accelerations de 30m : 70% > 80% > 90% de la vitesse. Revenir en marchant entre chaque.", note: "" },
        ]
      },
      {
        id: "bloc2",
        titre: "Bloc 2 — Gammes athletiques",
        duree: "6-8 min",
        couleur: "#FFA420",
        description: "Activation neuro-musculaire. Preparer les chaines musculaires specifiques a la course. Realiser sur 20-30m aller-retour.",
        exercices: [
          { exercice: "Montees de genoux (skip A)", duree: "2x20m", detail: "Genoux a hauteur de hanche. Bras actifs en opposition. Rester sur la pointe des pieds. Cadence elevee.", note: "Focus : pompe des bras + appui avant-pied" },
          { exercice: "Talons-fesses (skip B)", duree: "2x20m", detail: "Amener les talons aux fessiers rapidement. Buste droit, pas penche en avant. Frequence max.", note: "Focus : souplesse flechisseurs genou" },
          { exercice: "Montees de genoux laterales", duree: "2x20m", detail: "Deplacement lateral shuffle, lever le genou exterieur haut a chaque pas. 2 sens.", note: "Focus : abducteurs, stabilite unipodal" },
          { exercice: "Fentes marchees", duree: "2x10 pas", detail: "Grand pas, descendre le genou arriere pres du sol. Buste droit. Alterner jambes. Lent et controle.", note: "Focus : hip flexor, fessier, quad" },
          { exercice: "Carioca (croise lateral)", duree: "2x20m", detail: "Deplacement lateral avec croisement avant/arriere. Hanches qui pivotent. Vitesse progressive.", note: "Focus : rotation hanche, coordination" },
          { exercice: "Bonds avant (bounding)", duree: "2x20m", detail: "Foulees bondissantes. Pousser fort sur chaque appui. Temps de vol max. Atterrissage sur avant-pied.", note: "Focus : puissance propulsive" },
        ]
      },
      {
        id: "bloc3",
        titre: "Bloc 3 — Travail de pied",
        duree: "4-5 min",
        couleur: "#4CAF50",
        description: "Activation specifique du pied et de la cheville. Prepare les tendons et la neuro-musculaire pour les impacts de course.",
        exercices: [
          { exercice: "Saut sur place bipodale haute frequence", duree: "3x20s / 20s repos", detail: "Pieds ensemble, sauts tres petits et tres rapides. Chevilles raides comme des ressorts. Minimiser le temps de contact.", note: "Focus : raideur tendineuse, reflexe myotatique" },
          { exercice: "Saut unipodal alternatif", duree: "2x20s / 20s repos", detail: "Sauter d'un pied sur l'autre rapidement. Atterrissage sur avant-pied. Garder les genoux legerement flechis.", note: "Focus : coordination, proprioception" },
          { exercice: "Ankling (cheville deroule)", duree: "2x20m", detail: "Marche en deroulant exagerement le pied : talon > voute > avant-pied > pointe. Tres lent. Sentir chaque phase.", note: "Focus : deRoulement du pied, fascia plantaire" },
          { exercice: "Skip haute frequence (A-skip rapide)", duree: "3x15m", detail: "Skip A mais tres rapide. Cadence maximale. Genoux pas forcement tres hauts, priorite a la frequence.", note: "Focus : frequence de foulée, systeme nerveux" },
          { exercice: "Strides x3", duree: "3x60m / marche retour", detail: "Acceleration douce sur 20m > allure course max sur 20m > deceleration douce sur 20m. Foulée relachee. Derniere preparation avant la seance.", note: "80-90% vitesse max. Pas de sprint total." },
        ]
      },
      {
        id: "bloc4",
        titre: "Bloc 4 — Mobilite dynamique rapide",
        duree: "2 min",
        couleur: "#7C6FFF",
        description: "Dernier passage rapide sur les articulations cles. Ne pas faire de statique avant la course.",
        exercices: [
          { exercice: "Leg swing frontal x10/cote", duree: "30s", detail: "Debout, balancer la jambe d'avant en arriere (flexion/extension hanche). Amplitude maximale. Tenir un mur si besoin.", note: "" },
          { exercice: "Leg swing lateral x10/cote", duree: "30s", detail: "Balancer la jambe de cote (abduction/adduction). Amplitude maximale. Hanche qui s'ouvre.", note: "" },
          { exercice: "Cercles cheville debout x10/sens/pied", duree: "30s", detail: "Lever le pied, faire des grands cercles de cheville dans les 2 sens. Activation finale.", note: "" },
          { exercice: "Dernier trot 30s", duree: "30s", detail: "Trot libre a 75-80% VMA. Verifier que tout est ok. Go pour la seance.", note: "FC cible : 75-80% FCmax avant depart" },
        ]
      },
    ]
  },

  {
    id: "echauff_velo",
    nom: "Echauffement velo",
    couleur: "#38BDF8",
    icon: "🚴",
    type: "echauffement",
    description: "Protocole d'echauffement avant sortie velo ou seance home trainer. Preparation articulaire hors selle + montee en charge progressive sur le velo. Duree : 15-20 min.",
    duree_totale: "15-20 min",
    frequence: "Avant chaque seance velo",
    blocs: [
      {
        id: "bloc1",
        titre: "Bloc 1 — Preparation hors selle",
        duree: "5-6 min",
        couleur: "#7C6FFF",
        description: "Activer les articulations et muscles avant de monter sur le velo. Specifique aux zones sollicitees en cyclisme.",
        exercices: [
          { exercice: "Cercles de hanche debout x10/sens/cote", duree: "1 min", detail: "Debout sur 1 pied, faire de grands cercles avec le genou libre. 10 cercles vers l'avant, 10 vers l'arriere. Activer la hanche avant la flexion repetee sur le velo.", note: "Zone cle cyclisme : hip flexor" },
          { exercice: "Squat profond maintenu", duree: "3x30s", detail: "Pieds largeur d'epaules. Descendre au maximum. Talons au sol. Mains contre les genoux pour aider l'ouverture. Activer la dorsiflexion et la hanche.", note: "Focus : cheville + hanche + dos bas" },
          { exercice: "Cat-cow lombaire (a 4 pattes)", duree: "2x15 reps", detail: "A 4 pattes. Arrondir le dos (chat) en expirant. Creuser le dos (vache) en inspirant. Lent. Mobiliser toute la colonne. Indispensable avant la position aerodynamique velo.", note: "Focus : mobilite lombaire et thoracique" },
          { exercice: "Rotation thoracique en fente (open book)", duree: "2x10/cote", detail: "En fente basse, main derriere la tete. Ouvrir le coude vers le plafond en faisant pivoter le buste. Rotation thoracique maximale. L'autre main au sol stabilise.", note: "Focus : rotation thoracique (souvent bloquee en velo)" },
          { exercice: "Etirement hip flexor en fente", duree: "2x30s/cote", detail: "Fente basse, genou arriere au sol. Avancer le bassin vers l'avant. Sentir l'avant de la cuisse arriere. Monter le bras du meme cote vers le plafond.", note: "Focus : psoas-iliaque (raccourci en position velo)" },
          { exercice: "Elevation talons + cercles cheville", duree: "1 min", detail: "20 elevations de talons bilaterales (activation solaaire/gastrocneme). Puis 10 cercles de cheville dans chaque sens. Preparer l'articulation pour le pedalage.", note: "" },
        ]
      },
      {
        id: "bloc2",
        titre: "Bloc 2 — Activation cardio progressive (sur le velo)",
        duree: "10-12 min",
        couleur: "#38BDF8",
        description: "Montee en charge progressive sur le velo. Ne jamais partir fort d'emblee. La chaine, les muscles et le coeur doivent chauffer ensemble.",
        exercices: [
          { exercice: "Pedalage tres leger — cadence libre", duree: "3 min", detail: "Resistance minimale ou quasi-nulle. Cadence libre (60-75 RPM). Tester les appuis, la selle, les cale-pieds. FC < 55% FCmax.", note: "Objectif : sentir la mecanique. Pas d'effort." },
          { exercice: "Cadence croissante — resistance constante", duree: "3 min", detail: "Garder la meme resistance legere. Augmenter la cadence a 80-90 RPM. Pedalage rond et fluide. FC monte doucement vers 65% FCmax.", note: "Focus : fluidite du pedalage, pas de force" },
          { exercice: "3x30s efforts moderes — 30s recup", duree: "3 min", detail: "30s a 75-80% FCmax (augmenter la resistance ou la cadence). 30s retour tres leger. 3 repetitions. Reveiller le systeme cardiovasculaire.", note: "Chaque effort un peu plus intense que le precedent" },
          { exercice: "1 min a allure seance — retour calme 2 min", duree: "3 min", detail: "1 min a l'intensite ciblee de la seance principale (ex : 85% FCmax si continu intensif). Puis 2 min retour tres leger pour recuperer avant le depart.", note: "Verifier que les sensations sont bonnes. Ajuster si besoin." },
        ]
      },
      {
        id: "bloc3",
        titre: "Bloc 3 — Activation neuro-musculaire velo",
        duree: "2-3 min",
        couleur: "#4CAF50",
        description: "Sprint courts pour activer les fibres rapides et preparer le systeme nerveux. Meme si la seance est aerobique, cette activation ameliore la puissance et les sensations.",
        exercices: [
          { exercice: "Spin-up (acceleration cadence)", duree: "3x20s / 40s repos", detail: "Garder une resistance moderee. Accelerer la cadence le plus vite possible sur 20s (objectif > 110 RPM). Revenir a cadence normale 40s. 3 repetitions.", note: "Active les fibres rapides. Ameliore l'economie de pedalage." },
          { exercice: "Verification position", duree: "30s", detail: "Arreter 30s. Verifier : hauteur selle, reach guidon, position du dos. Ajuster si gene. Mieux vaut corriger maintenant qu'au milieu de la seance.", note: "" },
        ]
      },
    ]
  },
,


  // ══════════════════════════════════════════════════════════════════════════
  // FORCE EN AMPLITUDE (PAILs / RAILs / End-range strength)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "famp_epaule",
    nom: "Force en amplitude - Epaule",
    couleur: "#FF4455",
    icon: "💪",
    type: "force_amplitude",
    description: "Renforcement de la coiffe et des rotateurs dans les amplitudes extremes. PAILs/RAILs sur la capsule posterieure + force en flexion terminale. 3 semaines progressives. Cle prevention et performance lanceur handball.",
    duree_totale: "25-30 min",
    frequence: "3x / semaine",
    semaines: [
      {
        sem: "S1", titre: "Isometrie en amplitude - Decouverte",
        objectif: "Apprendre a contracter activement en fin d'amplitude. Pas de douleur. Reprendre conscience des zones peu actives.",
        seances: [
          { exercice: "Sleeper stretch passif 60s", series: 3, reps: "60s / cote", charge: "Corps", repos: "30s", cible: "Capsule posterieure", execution: "Allonge sur le cote. Pousser doucement le poignet vers le sol pour etirer la capsule posterieure. 60s sans bouger. Base obligatoire avant le PAILs." },
          { exercice: "PAILs capsule posterieure (sleeper)", series: 3, reps: "3x20s contraction", charge: "Corps", repos: "60s", cible: "Rotateurs externes profonds", execution: "Depuis le sleeper stretch. Pousser l'avant-bras vers le plafond avec 30-40% de la force max pendant 20s. Retour passif 10s. Repeter 3 fois. Gagner 1-2 deg d'amplitude a chaque rep." },
          { exercice: "RAILs capsule posterieure", series: 3, reps: "3x20s contraction", charge: "Corps", repos: "60s", cible: "Flechisseurs epaule", execution: "Depuis le sleeper stretch au nouveau range. Tirer le poignet vers le plafond (contraction active dans la nouvelle amplitude) 20s. Consolide le gain du PAILs." },
          { exercice: "End-range hold flexion (bras tendu devant)", series: 3, reps: "5x5s", charge: "Corps ou 1 kg", repos: "30s", cible: "Flexion epaule terminale", execution: "Lever le bras aussi haut que possible. A l'amplitude max, contracter et tenir 5s. Redescendre 3s. Tenter d'aller 1 degre plus haut a chaque rep. Cle performance lancer." },
          { exercice: "Isometrie RE 90/90 (haltere)", series: 3, reps: "5x8s", charge: "2-3 kg", repos: "45s", cible: "Rotateur externe en position de lancer", execution: "Allonge ventre, epaule et coude a 90 deg. Haltere dans la main. Tenir en RE maximale 8s. Ne pas laisser tomber. Position specifique du geste de lancer handball." },
        ]
      },
      {
        sem: "S2", titre: "PAILs/RAILs progressifs - Charge",
        objectif: "Augmenter l'intensite de contraction (50-60% force max). Introduire la charge sur end-range holds.",
        seances: [
          { exercice: "PAILs capsule posterieure", series: 4, reps: "3x25s contraction", charge: "Corps", repos: "60s", cible: "Capsule posterieure", execution: "S2 : augmenter a 50% force max. 4 series. Mesurer le gain d'amplitude vs S1 : objectif +5 a 10 deg de RI en 2 semaines." },
          { exercice: "RAILs flexion terminale", series: 4, reps: "3x25s contraction", charge: "Corps", repos: "60s", cible: "Flexion epaule", execution: "Depuis la position la plus haute atteignable. Contracter vers le haut 25s a 50% force. Consolider le range gagne." },
          { exercice: "End-range hold flexion leste", series: 4, reps: "5x6s", charge: "2-3 kg", repos: "45s", cible: "Flexion terminale sous charge", execution: "Meme exercice que S1 mais avec haltere 2-3kg. La charge amplifie le travail de controle en amplitude extreme." },
          { exercice: "RE 90/90 excentrique + isometrie", series: 3, reps: "10 reps + 5s hold", charge: "3-4 kg", repos: "60s", cible: "Coiffe des rotateurs en position de lancer", execution: "Lever l'haltere en RE 2s. Tenir 5s en haut. Descendre en 4s (excentrique lent). 10 reps enchainees." },
          { exercice: "CARS epaule lest + pause end-range", series: 3, reps: "3 reps / sens / cote", charge: "1-2 kg", repos: "45s", cible: "Controle global amplitude", execution: "CARS epaule avec haltere 1-2kg. Ajouter une pause de 3s dans les positions les plus difficiles (flexion max, RE max, extension max)." },
        ]
      },
      {
        sem: "S3", titre: "Consolidation + transfert sport",
        objectif: "Atteindre 60-70% force max en PAILs. Transfert vers le geste de lancer.",
        seances: [
          { exercice: "PAILs/RAILs capsule - intensite max", series: 4, reps: "3x30s contraction", charge: "Corps", repos: "60s", cible: "Capsule posterieure", execution: "S3 : 60-70% force max. C'est l'intensite maximale recommandee. Ne pas depasser : risque de spasme. Mesurer l'amplitude finale vs debut de protocole." },
          { exercice: "End-range hold flexion - charge max", series: 4, reps: "5x8s", charge: "3-5 kg", repos: "60s", cible: "Flexion terminale", execution: "Charge maximale tolerable en amplitude extreme. Si la technique se degrade, reduire la charge. Priorite : amplitude > charge." },
          { exercice: "RE 90/90 bande lourde + isometrie", series: 4, reps: "8 reps + 8s hold final", charge: "Elastique fort", repos: "75s", cible: "Rotateurs en position lancer", execution: "Avec bande forte. 8 reps excentriques puis tenir 8s en RE max a la fin de la serie. Simule la demande du lancer handball." },
          { exercice: "Band pull-apart end-range hold", series: 3, reps: "10 + 10s hold", charge: "Elastique moyen", repos: "60s", cible: "Retracteurs scapulaires en amplitude", execution: "Pull-apart classique. En fin d'amplitude (bras completement ouverts) : tenir 10s en contraction maximale. Retracter les omoplates au max." },
          { exercice: "Lancer MB mur - puissance + controle", series: 4, reps: "8", charge: "3-4 kg", repos: "90s", cible: "Transfert sportif", execution: "Lancer avec intention de puissance maximale. L'amplitude gagnee doit maintenant se transferer dans le geste. Evaluer la qualite du geste vs debut de protocole." },
        ]
      },
    ]
  },

  {
    id: "famp_hanche",
    nom: "Force en amplitude - Hanche",
    couleur: "#FFA420",
    icon: "🦴",
    type: "force_amplitude",
    description: "Renforcement des rotateurs de hanche, flechisseurs et abducteurs dans les amplitudes extremes. PAILs/RAILs 90/90 + Copenhagen progressif + CARS charge. Cle performance handball : changements de direction, squats profonds, sprints.",
    duree_totale: "25-30 min",
    frequence: "3x / semaine",
    semaines: [
      {
        sem: "S1", titre: "PAILs/RAILs 90/90 - Initiation",
        objectif: "Introduire la contraction active en amplitude extreme de la hanche. Position 90/90 maitrisee avant d'augmenter l'intensite.",
        seances: [
          { exercice: "90/90 passif 90s / cote", series: 3, reps: "90s / cote", charge: "Corps", repos: "20s", cible: "Capsule hanche RI + RE", execution: "Assis au sol. Jambe avant 90 deg RE, jambe arriere 90 deg RI. Buste droit. 90s de relaxation passive. Preparer le tissu avant la contraction." },
          { exercice: "PAILs RI (jambe arriere)", series: 3, reps: "3x20s contraction", charge: "Corps", repos: "60s", cible: "Rotateur interne hanche", execution: "Depuis 90/90. Pousser le genou arriere vers le sol (RI) contre le sol pendant 20s a 30-40% force max. Revenir passif 10s. Repeter 3 fois. Gagner de la RI." },
          { exercice: "PAILs RE (jambe avant)", series: 3, reps: "3x20s contraction", charge: "Corps", repos: "60s", cible: "Rotateur externe hanche", execution: "Depuis 90/90. Pousser le genou avant vers le sol (RE) pendant 20s. Meme principe. Gagner de la RE." },
          { exercice: "RAILs RI + RE", series: 3, reps: "3x20s / sens", charge: "Corps", repos: "60s", cible: "Rotateurs actifs en amplitude", execution: "Apres chaque PAILs : contracter activement dans la nouvelle amplitude (lever le genou depuis le sol) 20s. Consolide le gain." },
          { exercice: "Hip CARS avec pause end-range", series: 3, reps: "5 / sens / cote", charge: "Corps", repos: "30s", cible: "Controle global hanche", execution: "CARS hanche complet. Ajouter une pause de 3s dans les 3 positions les plus difficiles. Lenteur = 10s par cercle complet." },
        ]
      },
      {
        sem: "S2", titre: "Charge et Copenhagen - Progression",
        objectif: "Augmenter intensite PAILs a 50-60%. Introduire le Copenhagen plank progressif pour la force en adduction.",
        seances: [
          { exercice: "PAILs/RAILs 90/90 progressifs", series: 4, reps: "3x25s contraction", charge: "Corps", repos: "60s", cible: "RI et RE hanche", execution: "S2 : 50-60% force max. 4 series. Alterner PAILs RI jambe arriere et PAILs RE jambe avant. Objectif : +5 a 10 deg vs S1." },
          { exercice: "Copenhagen plank isometrique", series: 4, reps: "3x20s / cote", charge: "Corps", repos: "60s", cible: "Adducteurs en isometrie", execution: "Allonge sur le cote. Pied superieur sur un banc ou step haut. Lever les hanches. Tenir 20s. Cle performance handball et protection LCA. S2 : version courte (bas de la jambe sur le support)." },
          { exercice: "Hip 90/90 end-range isometrie", series: 4, reps: "5x8s / cote", charge: "Corps", repos: "45s", cible: "Force en amplitude RI ou RE", execution: "Depuis 90/90, aller a l'amplitude maximale de RI ou RE. Pousser contre le sol 8s a 60% force. Relacher. Repeter. Gagne et consolide l'amplitude simultanement." },
          { exercice: "Cossack squat isometrie en bas", series: 3, reps: "5x6s / cote", charge: "Corps ou 4 kg", repos: "45s", cible: "Force en amplitude laterale", execution: "Cossack squat classique. En position basse, tenir 6s avec contraction active (pousser le sol). Remonter lentement. Le poids de corps ou kettlebell augmente la demande." },
          { exercice: "Hip CARS leste + pause end-range", series: 3, reps: "5 / sens / cote", charge: "Chevillere 1-2 kg", repos: "30s", cible: "Controle sous charge en amplitude", execution: "Meme CARS mais avec chevillere lestee. Pause 3s dans les positions difficiles. Travail de controle neuro-musculaire en amplitude extreme." },
        ]
      },
      {
        sem: "S3", titre: "Intensite max + transfert sportif",
        objectif: "PAILs a 70% force max. Copenhagen plank avance. Transfert vers les gestes handball.",
        seances: [
          { exercice: "PAILs/RAILs 90/90 - intensite max", series: 4, reps: "3x30s contraction", charge: "Corps", repos: "60s", cible: "RI et RE hanche", execution: "S3 : 70% force max. Ne pas depasser. Mesurer l'amplitude finale vs S1. Objectif : +15 a 20 deg sur l'axe le plus restrictif." },
          { exercice: "Copenhagen plank complet", series: 4, reps: "3x25s / cote", charge: "Corps", repos: "75s", cible: "Adducteurs force isometrique", execution: "S3 : version complete (cheville sur le support). Option : lever la jambe inferieure 5s pendant la planche. Tres difficile. Critere retour sport apres blessure adducteurs." },
          { exercice: "Cossack squat charge + pause", series: 4, reps: "5x8s / cote", charge: "8-12 kg kettlebell", repos: "60s", cible: "Force laterale sous charge", execution: "Cossack squat avec KB gobelet. Tenir 8s en position basse. Remonter explosif. La charge + pause = developpement force en amplitude laterale maximale." },
          { exercice: "Side-lying hip rotation leste", series: 4, reps: "12 + 8s hold final", charge: "Chevillere 2-3 kg", repos: "60s", cible: "Rotateurs actifs sous charge", execution: "Allonge sur le cote, jambes a 90 deg. Lever le genou en RE (clam shell) avec chevillere. 12 reps + tenir 8s a l'amplitude max a la fin de la serie." },
          { exercice: "Single leg squat profond + hold", series: 4, reps: "6 + 5s hold en bas", charge: "Corps ou barre 10-20 kg", repos: "90s", cible: "Transfert - force en flexion profonde unilaterale", execution: "Descendre sur une jambe jusqu'a l'amplitude maximale. Tenir 5s en bas avec contraction active. Remonter contr le. Critere : meme profondeur que les 2 jambes." },
        ]
      },
    ]
  },

  {
    id: "famp_poignet",
    nom: "Force en amplitude - Poignets",
    couleur: "#7C6FFF",
    icon: "🤝",
    type: "force_amplitude",
    description: "Renforcement des flech./extens. poignet + pronation/supination en amplitude extreme. Cle gardiens de but, joueurs avec tirs flechis, prevention tendinopathie. 3 semaines progressives.",
    duree_totale: "15-20 min",
    frequence: "Quotidien ou 4x / semaine",
    semaines: [
      {
        sem: "S1", titre: "Mobilite + isometrie - Base",
        objectif: "Evaluer les restrictions. Travailler l'amplitude passive puis activer isometriquement. Aucune douleur.",
        seances: [
          { exercice: "Wrist CARS actifs x10 / sens", series: 3, reps: "10 / sens / poignet", charge: "Corps", repos: "20s", cible: "Amplitude globale poignet", execution: "Assis, avant-bras pose sur la cuisse. Faire le tour complet de l'amplitude du poignet en contraction active. Lentement (6s par cercle). Flexion > ulnaire > extension > radiale." },
          { exercice: "Flexion poignet end-range hold", series: 3, reps: "5x8s", charge: "Corps ou 2 kg", repos: "30s", cible: "Flechisseurs en amplitude extreme", execution: "Avant-bras pose, main dans le vide. Flechir le poignet au max. Tenir 8s avec contraction active. Tenter d'aller plus loin a chaque rep. Ajouter 2 kg si facile." },
          { exercice: "Extension poignet end-range hold", series: 3, reps: "5x8s", charge: "Corps ou 2 kg", repos: "30s", cible: "Extenseurs en amplitude extreme", execution: "Meme exercice mais en extension. Main pendue vers le bas, etendre au max. Tenir 8s. Les extenseurs sont souvent la zone la plus restrictive chez les handballeurs." },
          { exercice: "Supination / Pronation isometrique", series: 3, reps: "5x8s / sens", charge: "Marteau ou haltere 2 kg", repos: "30s", cible: "Pronateurs / supinateurs", execution: "Tenir un marteau ou haltere. Tourner en supination max (paume vers le plafond). Tenir 8s. Puis pronation max (paume vers le sol). Tenir 8s. Amplitude + force simultanement." },
          { exercice: "Finger extension + wrist extension", series: 3, reps: "10s hold", charge: "Corps", repos: "20s", cible: "Extenseurs chaine main-poignet", execution: "Etendre tous les doigts + poignet en extension max en meme temps. Tenir 10s. Relacher lentement. Ouvre toute la chaine anterieure (souvent surchargee en handball)." },
        ]
      },
      {
        sem: "S2", titre: "Charge progressive + excentrique",
        objectif: "Introduire la charge sur tous les mouvements. Ajouter le travail excentrique cle pour la prevention tendinite.",
        seances: [
          { exercice: "Wrist curl excentrique (flexion)", series: 4, reps: "12", charge: "3-5 kg", repos: "60s", cible: "Flechisseurs - prevention tendinopathie", execution: "Avant-bras sur un banc. Soulever en concentrique avec les 2 mains. Descendre en excentrique avec 1 seule main en 4s. 12 reps par bras. Protocole Alfredson adapte au poignet." },
          { exercice: "Wrist extension excentrique", series: 4, reps: "12", charge: "2-4 kg", repos: "60s", cible: "Extenseurs - prevention epicondylite", execution: "Meme protocole en extension. Paume vers le bas. Soulever les 2 mains, descendre 1 seule main en 4s. Cle prevention epicondylite laterale (frequente en handball)." },
          { exercice: "Lever marteau supination/pronation", series: 3, reps: "15 / sens", charge: "Marteau ou haltere 2-4 kg", repos: "45s", cible: "Pronateurs/supinateurs sous charge", execution: "Avant-bras vertical, coude a 90 deg. Lever le marteau en supination puis en pronation. Le centre de gravite cree un moment de force variable. Amplitude complete obligatoire." },
          { exercice: "PAILs extension poignet (mur)", series: 3, reps: "3x20s contraction", charge: "Corps", repos: "60s", cible: "Extenseurs en amplitude extreme", execution: "Main a plat sur le mur, doigts vers le bas (extension max du poignet). Pousser la main contre le mur 20s. Relacher 10s. Repeter 3 fois. Gagne de l'extension." },
          { exercice: "Rice bucket (riz en seau)", series: 3, reps: "30s / mouvement", charge: "Seau de riz", repos: "30s", cible: "Force fonctionnelle intrinseques main", execution: "Plonger la main dans un seau de riz. Faire des mouvements de prehension, rotation, ecartement des doigts contre la resistance du riz. 3x30s par mouvement. Renforce les intrinseques." },
        ]
      },
      {
        sem: "S3", titre: "Force maximale en amplitude",
        objectif: "Charge maximale. Transfert vers le geste de tir et de prehension en handball.",
        seances: [
          { exercice: "Wrist curl excentrique lourd", series: 4, reps: "10", charge: "5-8 kg", repos: "75s", cible: "Flechisseurs - force maximale", execution: "S3 : augmenter la charge. 10 reps excentriques unilaterales. Amplitude complete obligatoire. La charge doit permettre 10 reps propres avant de faiblir." },
          { exercice: "Wrist extension excentrique lourd", series: 4, reps: "10", charge: "4-6 kg", repos: "75s", cible: "Extenseurs - force maximale", execution: "Meme protocole extension. S3 : charge max tolerable sur amplitude complete. Critere : 10 reps propres sans douleur." },
          { exercice: "Lever marteau lourd", series: 4, reps: "12 / sens", charge: "Marteau 4-6 kg ou haltere lourd cote", repos: "60s", cible: "Pronateurs/supinateurs - force max", execution: "Utiliser un marteau lourd ou tenir un haltere par un seul bout. Lever completement en supination, descendre lentement en pronation. Amplitude et controle prioritaires." },
          { exercice: "Wrist roller (enrouleur)", series: 3, reps: "3 montees / descentes", charge: "2-5 kg", repos: "90s", cible: "Force endurance flechisseurs + extenseurs", execution: "Tenir un baton avec une corde lestee. Enrouler la corde en montant (flechisseurs) puis en descendant (extenseurs). 3 allers-retours par serie. Force endurance specifique handball." },
          { exercice: "Grip + wrist en serie de tir", series: 4, reps: "8 gestes", charge: "Balle de handball lestee ou MB 1 kg", repos: "90s", cible: "Transfert sportif poignet-main", execution: "Simuler le geste de tir (surtout le claquement du poignet en fin de geste). Avec balle lestee ou balle de medecine 1 kg. Puissance + amplitude du claquement final." },
        ]
      },
    ]
  },

  {
    id: "famp_genou",
    nom: "Force en amplitude - Genou",
    couleur: "#4CAF50",
    icon: "🦵",
    type: "force_amplitude",
    description: "Renforcement ischio-jambiers (Nordic progressif), quadriceps en amplitude complete et poplite. Approche basee sur les preuves : reduce le risque LCA de 50%. 3 semaines progressives.",
    duree_totale: "25-30 min",
    frequence: "3x / semaine",
    semaines: [
      {
        sem: "S1", titre: "Nordic excentrique assiste + quad terminal",
        objectif: "Introduire le Nordic Hamstring avec assistance. Renforcer le quad en amplitude complete (leg extension). Bases de la prevention LCA.",
        seances: [
          { exercice: "Nordic Hamstring Curl assiste (elastique)", series: 4, reps: "6", charge: "Elastique fort en soutien", repos: "120s", cible: "Ischio-jambiers excentriques", execution: "A genoux, talons tenus. Elastique fort accroche derriere vous pour aider la remontee. Descendre le buste vers le sol en 3-4s en freinant avec les ischio. L'elastique aide a revenir. 6 reps propres. Repos long obligatoire." },
          { exercice: "Leg curl excentrique (machine ou sol)", series: 4, reps: "10", charge: "40-50% 1RM", repos: "90s", cible: "Ischio en amplitude courte-moyenne", execution: "Concentrique 2s, excentrique 4s. Amplitude complete. Ne pas laisser tomber en fin de course. Complementaire du Nordic." },
          { exercice: "Leg extension terminale (0-30 deg)", series: 4, reps: "15", charge: "30-40% 1RM", repos: "60s", cible: "Quad en amplitude courte (angle genoux 0-30 deg)", execution: "Sur la machine. Ne travailler QUE les 30 derniers degres d'extension (jambe presque tendue). Cette zone est la plus vulnerable et la moins renforcee. Controle absolu." },
          { exercice: "Wall sit isometrique profond", series: 4, reps: "3x30s", charge: "Corps", repos: "60s", cible: "Quad en amplitude profonde sous charge", execution: "Dos au mur. Genoux a 90 deg minimum (voire plus bas si possible). Tenir 30s. L'angle profond est la position la moins entrainee et la plus utile pour le handball." },
          { exercice: "Terminal knee extension elastique", series: 3, reps: "20", charge: "Elastique moyen", repos: "45s", cible: "VMO (vaste medial) - protection rotule", execution: "Elastique autour du genou en semi-flexion. Etendre completement le genou contre l'elastique. Tenir 1s. Activer le VMO cible les derniers degres d'extension. Cle syndrome rotulien." },
        ]
      },
      {
        sem: "S2", titre: "Nordic progressif + charge amplitude complete",
        objectif: "Progresser vers Nordic sans assistance. Travailler le quad sur amplitude complete 0-90 deg. Isometrie profonde.",
        seances: [
          { exercice: "Nordic Hamstring Curl - elastique leger", series: 4, reps: "6-8", charge: "Elastique leger (vs fort en S1)", repos: "120s", cible: "Ischio-jambiers excentriques progressifs", execution: "S2 : reduire l'assistance. Elastique leger uniquement. Si possible : descendre sans elastique, remonter avec les mains. Objectif final : 6 reps sans assistance." },
          { exercice: "Leg curl excentrique charge augmentee", series: 4, reps: "10", charge: "50-60% 1RM", repos: "90s", cible: "Ischio sous charge plus lourde", execution: "Augmenter la charge vs S1. Meme excentrique 4s. L'objectif est d'avoir des ischio forts sur toute l'amplitude, pas seulement en position courte." },
          { exercice: "Bulgarian split squat lent + pause", series: 4, reps: "8 / jambe", charge: "Corps ou 2x5-10 kg", repos: "90s", cible: "Quad + fessier en amplitude profonde unilaterale", execution: "Descente sur 4s. Pause 2s en bas. Remontee 2s. L'excentrique lent + pause force le quad a travailler en amplitude extreme sous charge. Critere : meme profondeur bilaterale." },
          { exercice: "Wall sit 90 deg + poids", series: 4, reps: "3x30s", charge: "+10-20 kg (plaque sur les cuisses)", repos: "75s", cible: "Quad profond sous charge externe", execution: "S2 : ajouter une plaque sur les cuisses. La charge externe augmente la demande en isometrie profonde sans changer l'amplitude." },
          { exercice: "Reverse nordic (extension genoux depuis le sol)", series: 3, reps: "8-10", charge: "Corps", repos: "90s", cible: "Quad excentrique - complement Nordic", execution: "A genoux, pieds tenus. Se laisser tomber en arriere lentement (quad eccentric) en gardant le buste droit. 4s de descente. Remonter avec les mains. Complement parfait du Nordic." },
        ]
      },
      {
        sem: "S3", titre: "Nordic sans assistance + pic de force",
        objectif: "Nordic Hamstring complet sans assistance. Ischio-jambiers forts sur amplitude complete. Criteres retour sport.",
        seances: [
          { exercice: "Nordic Hamstring Curl - sans assistance", series: 4, reps: "6-8", charge: "Corps (aucune aide)", repos: "120s", cible: "Ischio-jambiers - force maximale excentrique", execution: "S3 : objectif 6 reps propres sans elastique ni aide. Si impossible : 4 reps avec les mains qui touchent le sol en douceur. Ne jamais sacrifier la vitesse de descente. Lent = efficace." },
          { exercice: "Nordic avec gilet leste (avance)", series: 3, reps: "4-5", charge: "Gilet 5-10 kg", repos: "120s", cible: "Surcharge progressive - ischio", execution: "Pour les joueurs ayant deja fait S1-S2. Gilet leste pour augmenter la demande. Reduire les reps. Qualite > quantite absolue." },
          { exercice: "Single leg press amplitude complete", series: 4, reps: "10 / jambe", charge: "60-70% MC", repos: "90s", cible: "Quad + fessier sur amplitude complete unilaterale", execution: "Presse a une jambe. Amplitude complete (fesse qui touche presque le siege). Excentrique 3s. Concentrique explosif. Transfert direct vers le saut handball." },
          { exercice: "Reverse nordic leste", series: 3, reps: "8", charge: "Gilet 5 kg ou plaque sur poitrine", repos: "90s", cible: "Quad excentrique charge", execution: "S3 : ajouter une plaque 5-10 kg ou gilet leste. Meme mouvement. La charge augmente la demande excentrique sur les quadriceps." },
          { exercice: "Hop test + atterrissage controle", series: 4, reps: "5 / jambe", charge: "Corps", repos: "90s", cible: "Transfert sportif - force en reception", execution: "Sauter sur 1 jambe, atterrir sur la meme jambe. Tenir 3s en position d'absorption (genoux 60-70 deg, buste penche en avant). Evaluer le deficit bilateral. Critere retour : >90% cote sain." },
        ]
      },
    ]
  },

  {
    id: "famp_cheville",
    nom: "Force en amplitude - Cheville",
    couleur: "#38BDF8",
    icon: "🦶",
    type: "force_amplitude",
    description: "Renforcement excentrique solaaire + gastrocneme, everseurs (peroniers) et dorsiflexeurs en amplitude extreme. Protocole Alfredson adapte + PAILs. Prevention tendinopathie Achille et entorse recidivante. 3 semaines.",
    duree_totale: "20-25 min",
    frequence: "3-4x / semaine",
    semaines: [
      {
        sem: "S1", titre: "Excentrique debutant + PAILs dorsiflexion",
        objectif: "Introduire l'excentrique sur le solaaire et le gastrocneme. PAILs pour gagner de la dorsiflexion.",
        seances: [
          { exercice: "Elevation talon bilateral excentrique (step)", series: 4, reps: "12", charge: "Corps", repos: "75s", cible: "Gastrocneme + solaaire excentriques", execution: "Sur une marche ou step. Monter sur les 2 pieds. Descendre sur 1 pied en 3-4s en dessous du niveau de la marche (amplitude negative). Remonter avec les 2. 12 reps par jambe. Protocole Alfredson." },
          { exercice: "Elevation talon genou flechis excentrique", series: 4, reps: "12", charge: "Corps", repos: "75s", cible: "Solaaire isole excentrique", execution: "Meme exercice mais genou flechis a 30-40 deg (isole le solaaire). Descendre en 4s. Capital pour la prevention tendinopathie Achille (le solaaire est souvent le maillon faible)." },
          { exercice: "PAILs dorsiflexion (SNAG + contraction)", series: 3, reps: "3x20s contraction", charge: "Corps + elastique", repos: "60s", cible: "Flechisseurs dorsaux - gain amplitude", execution: "En position SNAG (elastique autour des malleoles, pied avance). Aller en dorsiflexion maximale. Pousser le genou contre l'elastique 20s (30% force). Relacher. Gagner 1-2 deg. Repeter 3 fois." },
          { exercice: "RAILs dorsiflexion", series: 3, reps: "3x20s contraction", charge: "Corps", repos: "60s", cible: "Tibial anterieur actif en amplitude", execution: "Depuis la nouvelle amplitude gagnee en PAILs. Tirer activement le pied vers le tibia (dorsiflexion active) 20s. Consolide le gain. Tibial anterieur cle." },
          { exercice: "Banded eversion isometrique end-range", series: 3, reps: "5x10s / pied", charge: "Elastique fort", repos: "45s", cible: "Peroniers en amplitude maximale", execution: "Elastique qui veut inverser la cheville. Resister en eversion maximale 10s. Travailler a l'amplitude maximale de l'eversion, pas juste au milieu. Cle prevention entorse laterale." },
        ]
      },
      {
        sem: "S2", titre: "Charge progressive + amplitude negative maximale",
        objectif: "Augmenter la charge sur les excentriques. Approfondir l'amplitude negative. Ajouter le tibialis anterior.",
        seances: [
          { exercice: "Elevation talon excentrique leste (gastrocneme)", series: 4, reps: "10", charge: "+10-20 kg (sac dos ou gilet)", repos: "90s", cible: "Gastrocneme - force maximale excentrique", execution: "S2 : ajouter du poids. Gilet leste ou tenir une plaque. Descendre en 4s sous le niveau du step. 10 reps. La charge + amplitude negative = stimulus maximal pour le tendon Achille." },
          { exercice: "Elevation talon excentrique leste (solaaire)", series: 4, reps: "10", charge: "+10-20 kg + genou flechis", repos: "90s", cible: "Solaaire - force maximale excentrique", execution: "Meme chose mais genou flechis a 30-40 deg. Charger plus lourd que le gastrocneme car le solaaire peut tolerer plus. Ne pas negliger : c'est lui qui absorbe les impacts en handball." },
          { exercice: "Tibialis anterior raise (mur)", series: 4, reps: "15-20", charge: "Corps", repos: "45s", cible: "Tibial anterieur - force en dorsiflexion", execution: "Dos au mur, talons a 20cm du mur. Lever les pointes des pieds le plus haut possible. Tenir 1s. Redescendre lentement. Muscle souvent negligee mais cle pour le controle de la cheville." },
          { exercice: "PAILs/RAILs dorsiflexion intensite +", series: 4, reps: "3x25s contraction", charge: "Corps + elastique", repos: "60s", cible: "Gain dorsiflexion progressif", execution: "S2 : 50% force max. 4 series. Mesurer le gain au knee-to-wall test vs S1. Objectif : +1-2 cm sur la distance pied-mur." },
          { exercice: "Single leg heel raise + pause amplitude neg.", series: 4, reps: "10 / pied + 5s pause en bas", charge: "Corps", repos: "75s", cible: "Force excentrique + isometrie en amplitude negative", execution: "Monter bilateral, descendre unilateral en 3s, atteindre le max de l'amplitude negative, tenir 5s en isometrie. Repeter. Combiner excentrique + end-range hold." },
        ]
      },
      {
        sem: "S3", titre: "Charge maximale + transfert sport",
        objectif: "Charge maximale sur les excentriques. Peroniers charges. Transfert vers les sauts et appuis handball.",
        seances: [
          { exercice: "Elevation talon excentrique max (gastrocneme)", series: 4, reps: "10", charge: "+20-30 kg", repos: "90s", cible: "Gastrocneme - pic de force excentrique", execution: "S3 : charge maximale tolerable. 10 reps propres avec excentrique 4s et amplitude negative complete. Si la technique se degrade, reduire la charge." },
          { exercice: "Elevation talon excentrique max (solaaire)", series: 4, reps: "10", charge: "+20-30 kg + genou flechis", repos: "90s", cible: "Solaaire - pic de force excentrique", execution: "Charge max. Genou flechis obligatoire pour isoler le solaaire. La force du solaaire determine en grande partie la resilience du tendon Achille." },
          { exercice: "Banded peroneal exercise (dynamique + end-range)", series: 4, reps: "15 / sens", charge: "Elastique fort", repos: "60s", cible: "Peroniers - force dynamique en amplitude", execution: "Mouvement complet d'inversion/eversion contre elastique fort. Travailler toute l'amplitude. En fin d'amplitude d'eversion : tenir 2s. Cle prevention recidive entorse laterale." },
          { exercice: "Tibialis raise leste", series: 4, reps: "15", charge: "Bande lestee autour du pied 2-4 kg", repos: "60s", cible: "Tibial anterieur - force sous charge", execution: "Meme exercice au mur mais avec poids autour du pied ou elastique en resistance. Augmente la demande en dorsiflexion sous charge." },
          { exercice: "Drop landing + stabilisation active", series: 4, reps: "6-8", charge: "Corps depuis 40-50cm", repos: "90s", cible: "Transfert sportif - absorption impact", execution: "Sauter d'un step 40-50cm. Atterrir sur avant-pied (absorption cheville). Rester stable 3s. Pas de vacillement. Evaluer la qualite de l'absorption. Critere : atterrissage silencieux et stable." },
        ]
      },
    ]
  },
];


// ── ECHAUFFEMENTS MUSCU ──────────────────────────────────────────────────────
const ECHAUFF_MUSCU = [
  {
    id: "echauff_haut",
    nom: "Echauffement haut du corps",
    couleur: "#FFA420",
    icon: "💪",
    duree_totale: "12-15 min",
    description: "A realiser avant toute seance muscu haut du corps (bench, rowing, developpe militaire, tractions). Monte progressivement la temperature, active les rotateurs de l'epaule et prepare le SNC.",
    blocs: [
      {
        id: "b1", titre: "Bloc 1 — Activation cardiovasculaire", duree: "3 min", couleur: "#38BDF8",
        description: "Monter la FC et la temperature corporelle. Apport sanguin vers les muscles du haut.",
        exercices: [
          { exercice: "Jumping jacks", duree: "1 min", detail: "Pieds joints, ecarter les bras et les jambes simultanement. Rythme modere. Pas d'effort, juste activer.", note: "" },
          { exercice: "Bras croises devant / ouverts en croix", duree: "30s", detail: "Alterner : amener les bras croises devant la poitrine puis les ouvrir en croix a vitesse moderee. Mobiliser les pectoraux et les dorsaux.", note: "" },
          { exercice: "Corde a sauter ou shadow boxing", duree: "90s", detail: "Simuler la corde ou enchainner des jabs legers. Rester sur la pointe des pieds. FC < 70% FCmax.", note: "Alternative : 90s de step-touch si pas de place" },
        ]
      },
      {
        id: "b2", titre: "Bloc 2 — Mobilite epaule et thoracique", duree: "4 min", couleur: "#FFA420",
        description: "Ouvrir les articulations de l'epaule et la mobilite thoracique avant les charges. Indispensable pour la securite.",
        exercices: [
          { exercice: "Cercles d'epaule actifs (grands)", duree: "2x30s/sens", detail: "Bras le long du corps. Grands cercles vers l'avant 30s puis vers l'arriere 30s. Amplitude maximale. Sentir la rotation dans l'articulation.", note: "" },
          { exercice: "Rotation thoracique debout (open book)", duree: "10 reps/cote", detail: "Main derriere la tete. Ouvrir le coude vers le plafond en pivotant le buste. L'autre bras fixe. Amplitude maximale. Mobilise la cage thoracique.", note: "Cle securite pour le bench et le developpe militaire" },
          { exercice: "Banded pull-apart (elastique)", duree: "3x15", detail: "Tenir un elastique leger a hauteur d'epaule, bras tendus. Ecarter les bras en arriere jusqu'a ce que l'elastique touche la poitrine. Tenir 1s. Revenir. Activer les retracteurs scapulaires.", note: "Focus : omoplates rapprochees en fin de mouvement" },
          { exercice: "Dislocates elastique (large prise)", duree: "2x10", detail: "Tenir l'elastique tres large devant. Passer par-dessus la tete et derriere le dos en gardant les bras tendus. Reduire progressivement l'ecart. Amplitude complete.", note: "Si douleur : elargir la prise" },
        ]
      },
      {
        id: "b3", titre: "Bloc 3 — Activation specifique rotateurs", duree: "3 min", couleur: "#4CAF50",
        description: "Preparer la coiffe des rotateurs avant les charges. Reduit le risque de blessure epaule. Ne jamais sauter ce bloc.",
        exercices: [
          { exercice: "RE elastique leger (coude 90) x15/cote", duree: "2 series", detail: "Elastique leger. Rotation externe lente (2s aller, 2s retour). Coude contre le corps. Pas de compensation du buste. Activation pre-charge obligatoire.", note: "Si pas d'elastique : faire en isometrie contre le mur" },
          { exercice: "Face pull elastique x15", duree: "2 series", detail: "Elastique a hauteur yeux. Tirer vers le visage, coudes hauts et en arriere. Finir en RE maximale. Tenir 1s. Retour controle.", note: "Active trapeze inferieur + deltoides posterieurs" },
          { exercice: "Prone Y-T-W (sol ou sur banc incline)", duree: "1x10 chaque lettre", detail: "Allonge sur le ventre. Bras en Y (au-dessus tete), puis T (a 90 deg), puis W (coudes flechis RE). Lever et baisser a chaque position. Tres leger ou corps seul.", note: "3 exercices en 1 — le meilleur pre-activation retracteurs" },
        ]
      },
      {
        id: "b4", titre: "Bloc 4 — Montee en charge specifique", duree: "3-4 min", couleur: "#FF4455",
        description: "Serie d'echauffement directement sur le mouvement principal de la seance. Obligatoire avant toute charge de travail.",
        exercices: [
          { exercice: "Barre vide x15 (mouvement principal)", duree: "1 serie", detail: "Ex : Bench Press barre vide x15 reps. Focus technique : position des mains, trajectoire, activation des muscles cibles. Pas d'effort, juste la barre.", note: "" },
          { exercice: "50% de la charge de travail x8", duree: "1 serie", detail: "Ex : si seance a 80kg, faire 40kg x8. Sentir le mouvement, ajuster la position. 2 min de repos.", note: "" },
          { exercice: "70% de la charge de travail x5", duree: "1 serie", detail: "Ex : 56kg x5. Proche de la charge de travail. Derniere preparation avant les vraies series.", note: "Apres cette serie : debut des series de travail" },
        ]
      },
    ]
  },
  {
    id: "echauff_bas",
    nom: "Echauffement bas du corps",
    couleur: "#38BDF8",
    icon: "🦵",
    duree_totale: "15-18 min",
    description: "A realiser avant squat, deadlift, leg press, fentes, nordic curl. Active les fessiers, quadriceps et ischio. Mobilise la hanche et la cheville — les 2 restrictions les plus frequentes qui causent les blessures.",
    blocs: [
      {
        id: "b1", titre: "Bloc 1 — Activation cardiovasculaire", duree: "3 min", couleur: "#38BDF8",
        description: "Monter la temperature et l'apport sanguin vers les membres inferieurs.",
        exercices: [
          { exercice: "Velo stationnaire ou rameur", duree: "3 min", detail: "Resistance faible. Cadence libre. FC progressivement jusqu'a 65-70% FCmax. Alternatif : 3 min de marche rapide sur tapis.", note: "Idéal avant une seance jambes lourde — moins traumatisant que jumping jacks" },
        ]
      },
      {
        id: "b2", titre: "Bloc 2 — Mobilite hanche et cheville", duree: "4-5 min", couleur: "#FFA420",
        description: "Les deux articulatons les plus restrictives pour le squat et le deadlift. A traiter avant tout.",
        exercices: [
          { exercice: "Squat profond maintenu x3x30s", duree: "90s", detail: "Pieds largeur epaules, orteils ouverts. Descendre au max, talons au sol. Mains contre les genoux pour aider. Si les talons se levent : mettre une plaque 5kg dessous.", note: "Cle mobilite squat — test de reference" },
          { exercice: "90/90 hip stretch x45s/cote", duree: "90s", detail: "Assis au sol, jambe avant a 90 deg en RE, jambe arriere a 90 deg en RI. Buste droit. Ouvrir les deux hanches simultanement. Progresser vers l'avant doucement.", note: "Cle mobilite deadlift et fentes" },
          { exercice: "Knee-to-wall x15/pied", duree: "45s", detail: "Pied a 5-7cm du mur. Amener le genou toucher le mur sans lever le talon. Augmente la dorsiflexion avant le squat.", note: "Critere : > 10cm = bonne dorsiflexion" },
          { exercice: "Leg swing frontal + lateral x10/cote", duree: "45s", detail: "Debout, tenir mur. Balancer la jambe d'avant en arriere (10 fois) puis de cote (10 fois). Amplitude maximale. Les deux jambes.", note: "" },
        ]
      },
      {
        id: "b3", titre: "Bloc 3 — Activation fessiers et ischio", duree: "4 min", couleur: "#4CAF50",
        description: "Activer les fessiers et les ischio AVANT les charges. Un grand fessier qui dort = mauvaise mecanique de squat + risque lombaire.",
        exercices: [
          { exercice: "Clamshell elastique x20/cote", duree: "2 series", detail: "Allonge sur le cote, genoux plies a 90 deg, elastique au-dessus des genoux. Ouvrir le genou superieur vers le plafond comme une palourde. Tenir 1s. Revenir lentement. Fessier moyen.", note: "Le meilleur activateur de fessier moyen avant squat" },
          { exercice: "Pont fessier x20", duree: "2 series", detail: "Allonge sur le dos, pieds au sol. Pousser les hanches vers le plafond en serrant les fessiers. Tenir 2s en haut. Descendre lentement. Si trop facile : unilateral.", note: "Activer le grand fessier = proteger le LCA et le bas du dos" },
          { exercice: "Nordic Hamstring Curl partiel x6", duree: "1 serie", detail: "A genoux, partenaire ou machine qui tient les talons. Descendre le buste vers l'avant en controlant avec les ischio. Ne pas aller au sol — arreter a 30-45 deg. Revenir avec les bras.", note: "Activation ischio avant deadlift/nordic = protection LCA" },
          { exercice: "Monster walk elastique x2x15m", duree: "45s", detail: "Elastique autour des genoux ou des chevilles. Marcher lateralement en maintenant les genoux ouverts contre l'elastique. Buste droit, semi-squat. Active les abducteurs.", note: "" },
        ]
      },
      {
        id: "b4", titre: "Bloc 4 — Montee en charge specifique", duree: "4-5 min", couleur: "#FF4455",
        description: "Serie d'echauffement sur le mouvement principal. Montee progressive obligatoire avant toute charge lourde.",
        exercices: [
          { exercice: "Gobelet squat x15 (16-20kg)", duree: "1 serie", detail: "Squat gobelet profond avec kettlebell ou haltere. Profondeur maximale. Activer la chaine posterieure. Verifier la position.", note: "Meme si la seance est squat barre — commence toujours par gobelet" },
          { exercice: "50% charge de travail x8 (mouvement principal)", duree: "1 serie", detail: "Ex : seance squat a 100kg → 50kg x8. Sentir le mouvement. Ajuster la stance. 2 min repos.", note: "" },
          { exercice: "70% charge de travail x5", duree: "1 serie", detail: "Ex : 70kg x5. Proche de la charge de travail. Technique parfaite. 2-3 min repos avant les vraies series.", note: "Apres cette serie : go pour les series de travail" },
        ]
      },
    ]
  },
];

// ── ECHAUFFEMENTS ENDURANCE ───────────────────────────────────────────────────
const ECHAUFF_ENDURANCE = PROTOCOLES_MOBILITE.filter(p => p.type === 'echauffement');


// ── CYCLE MENSTRUEL ──────────────────────────────────────────────────────────
const PHASES_CYCLE = [
  { id:"menstruation", label:"Menstruation",  jours:"J1-J5",   couleur:"#FF4455",
    description:"Periode de regles. Fatigue souvent elevee. Hormones (oestrogene, progesterone) au plus bas.",
    conseils_entrainement:[
      "Reduire l'intensite si douleurs importantes",
      "Privilegier mobilite, etirements doux, yoga",
      "Eviter les seances de force maximale J1-J2",
      "Hydratation majoree : pertes sanguines",
    ],
    conseils_nutrition:[
      "Augmenter les apports en fer : viande rouge, legumineuses, epinards",
      "Vitamine C pour absorber le fer",
      "Limiter caféine et alcool (amplifient les crampes)",
      "Magnésium pour reduire les crampes",
    ],
    performance: "Capacite aerobique maintenue. Force reduite de 5-10% J1-J2. Performance globalement bonne si pas de douleurs.",
  },
  { id:"folliculaire", label:"Phase folliculaire", jours:"J6-J13", couleur:"#FFA420",
    description:"Montée de l'oestrogène. Récupération, énergie croissante. Meilleure tolérance à la douleur.",
    conseils_entrainement:[
      "Periode ideale pour les charges lourdes et les HIIT",
      "Introduire de nouveaux exercices (apprentissage moteur facilite)",
      "Augmenter progressivement le volume",
      "Bonne recuperation : profiter pour enchaîner les seances",
    ],
    conseils_nutrition:[
      "Protéines élevées pour soutenir la synthèse musculaire",
      "Glucides moderes a eleves selon la charge",
      "Bonne fenêtre anabolique : nutrition peri-entraînement optimale",
    ],
    performance: "Phase de performance montante. Meilleure force, meilleure endurance. Période idéale pour les tests de 1RM.",
  },
  { id:"ovulation", label:"Ovulation", jours:"J14-J15", couleur:"#4CAF50",
    description:"Pic d'oestrogène et de testostérone. Energie maximale. Attention : risque LCA augmente.",
    conseils_entrainement:[
      "Point de forme maximal - exploiter pour les objectifs de performance",
      "ATTENTION : laxité ligamentaire augmentée → risque LCA +",
      "Renforcer les exercices de proprioception et de stabilité",
      "Eviter les changements de direction brusques sans échauffement complet",
    ],
    conseils_nutrition:[
      "Maintenir apports protéiques élevés",
      "Hydratation optimale",
      "Antioxydants (fruits, légumes colorés) pour la récupération",
    ],
    performance: "Performance au maximum. Force et endurance au pic. Fenêtre idéale pour les compétitions importantes.",
  },
  { id:"luteale", label:"Phase lutéale", jours:"J16-J28", couleur:"#7C6FFF",
    description:"Montée puis chute de la progesterone. Rétention d'eau, fatigue progressive, syndrome prémenstruel (SPM).",
    conseils_entrainement:[
      "Réduire progressivement le volume vers J24-J28",
      "Privilégier intensités modérées et récupération",
      "Exercices de mobilité et gainage doux",
      "Écouter les signaux de fatigue : ne pas forcer",
    ],
    conseils_nutrition:[
      "Réduire sodium : limite la rétention d'eau",
      "Magnésium et B6 : réduisent le SPM",
      "Eviter sucres raffinés : amplifient les sautes d'humeur",
      "Augmenter légèrement les calories : métabolisme de base +100-300 kcal",
    ],
    performance: "Performance en baisse progressive J21-J28. Température corporelle +0.5°C. Récupération plus lente. Adapter les attentes.",
  },
];
