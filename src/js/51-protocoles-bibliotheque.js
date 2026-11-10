
// ── PROTOCOLES HANDBALL (bibliothèque complète) ───────────────────────────────
const PROTOCOLES_DATA = {
  epaule_prevention: {
    label: 'Épaule — Prévention',
    color: '#FF7A00',
    icon: '🦾',
    description: 'Renforcement de la coiffe des rotateurs et stabilisation scapulaire. Prévention des tendinopathies et conflits sous-acromials.',
    versions: [
      {
        titre: 'Avec matériel',
        exercices: [
          { nom:'Rotation IR/ER élastique', muscles:'Infra-épineux, sous-scapulaire, petit rond', series:'5×10/côté', repos:"45''", consigne:"Coude collé au corps, angle 90°. Élastique horizontal. Rotation interne puis externe lente et contrôlée.", progression:"Jaune → vert → rouge. Ajouter pause 2'' en fin de course dès S3." },
          { nom:'Développé militaire barre', muscles:'Deltoïde antérieur/médial, trapèze supérieur, triceps', series:'4×8', repos:"2'", consigne:"Barre devant, dos neutre, montée stricte au-dessus de la tête, descente contrôlée 3''.", progression:"Barre vide → +5kg/semaine. Excentrique 3'' dès S4." },
          { nom:'Tirage menton élastique', muscles:'Deltoïde médial, trapèze supérieur, rhomboïdes', series:'4×12', repos:"1'", consigne:"Élastique horizontal, tirer vers le menton en montant les coudes. Contrôle scapulaire actif.", progression:"Élastique léger → moyen → lourd sur 3 semaines." },
          { nom:'Pompes scapulaires', muscles:'Serratus antérieur, subscapulaire', series:'4×15', repos:"30''", consigne:"En appui sur bras tendus, descendre uniquement les omoplates sans fléchir les coudes. Isolation totale.", progression:"Genoux au sol → pieds au sol → pieds surélevés sur banc." },
          { nom:'Fer à repasser haltères', muscles:'Coiffe des rotateurs, deltoïde postérieur', series:"3×20''/côté", repos:"45''", consigne:"Penché en avant, bras tendu, mouvement de gauche à droite lent et parfaitement contrôlé.", progression:"0kg → 2kg → 4kg sur 4 semaines." },
        ]
      },
      {
        titre: 'Sans matériel',
        exercices: [
          { nom:'Rotation externe isométrique', muscles:'Infra-épineux, petit rond', series:"5×45''", repos:"30''", consigne:"Coude à 90°, avant-bras poussant contre le cadre de porte. Maintien 45''. Épaule basse et stable.", progression:"30'' → 45'' → 60''. Augmenter progressivement l'intensité." },
          { nom:'Pompes scapulaires', muscles:"Serratus antérieur, stabilisateurs de l'omoplate", series:'4×15', repos:"30''", consigne:"Bras tendus en appui sol, mouvement des omoplates uniquement. Zéro flexion du coude.", progression:"Mur → genoux au sol → pieds au sol → pieds surélevés." },
          { nom:'Antépulsion unilatérale', muscles:'Deltoïde antérieur, trapèze inférieur', series:'3×12/côté', repos:"1'", consigne:"Assis ou debout, bras tendu, montée lente à 90° puis au-dessus de la tête. Contrôle scapulaire.", progression:"Sans charge → bouteille 0.5L → 1.5L → haltère 2kg." },
          { nom:'Handstand hold progressif', muscles:'Deltoïde, trapèze, triceps, serratus, core', series:"5×20''", repos:"1'", consigne:"Appui tripode (tête + mains), puis poirier mural. Épaules actives, pousser le sol en permanence.", progression:"Tripode → appui tête+mains → poirier mural → poirier libre." },
          { nom:'YTW isométrique', muscles:'Trapèze moyen/inférieur, deltoïde postérieur, rhomboïdes', series:'3×10 (Y+T+W=1)', repos:"1'", consigne:"Penché en avant à 30°, bras formant Y puis T puis W, maintien strict 3'' à chaque position.", progression:"Sans charge → bouteilles 0.5L → haltères 2kg progressivement." },
        ]
      }
    ]
  },
  epaule_elite: {
    label: 'Épaule — Élite 12 semaines',
    color: '#FF4455',
    icon: '🏆',
    description: 'Protocole semi-pro/élite 3 blocs × 4 semaines. Objectif : ratio RE/RI ≥ 0,75, optimisation de la puissance de lancer.',
    versions: [
      {
        titre: 'Bloc 1 — Stabilisation (S1-S4)',
        exercices: [
          { nom:'ER Isométrique coude au corps', muscles:'Rotateurs externes', series:'4×15', repos:"60''", consigne:"Coude au corps, poignet neutre, départ 90°. 30-40% 1RM.", progression:"Volume avant intensité. Technique parfaite obligatoire." },
          { nom:'Side-Lying External Rotation', muscles:'Infra-épineux, petit rond', series:'3×12', repos:"60''", consigne:"Décubitus latéral, haltère léger, ROM complet, excentrique 3s.", progression:"Augmenter le poids progressivement toutes les 2 semaines." },
          { nom:'Prone Y-T-W-L', muscles:'Trapèze moyen/inférieur, rhomboïdes', series:'3×10', repos:"60''", consigne:"Rétraction scapulaire maximale à chaque position. Poids de corps.", progression:"Introduire bouteilles 0.5L dès S3." },
          { nom:'Serratus Anterior Punch (câble)', muscles:'Serratus antérieur', series:'3×15', repos:"45''", consigne:"Câble léger, protraction terminale active.", progression:"Charge légère, focus sur la qualité de contraction." },
          { nom:'Face Pull coudes hauts', muscles:'Rotateurs externes, trapèze supérieur', series:'3×15', repos:"45''", consigne:"Câble léger, RE en fin de mouvement, coudes à hauteur des yeux.", progression:"Charge légère → modérée sur 4 semaines." },
          { nom:'Sleeper Stretch', muscles:'Capsule postérieure, rotateurs internes', series:"4×30''", repos:"30''", consigne:"Correction GIRD prioritaire. Pression douce sur l'avant-bras.", progression:"Maintenir quotidiennement pour réduire le GIRD." },
        ]
      },
      {
        titre: 'Bloc 2 — Force (S5-S8)',
        exercices: [
          { nom:'ER 90/90 position lanceur', muscles:'Rotateurs externes en position armé', series:'4×10', repos:"90''", consigne:"Position armé-lancer, câble, 50-65% 1RM.", progression:"+5% charge/semaine. Critère : absence de douleur." },
          { nom:'Bent-Over Row unilatéral', muscles:'Grand dorsal, rhomboïdes', series:'4×8', repos:"90''", consigne:"Haltère 65-75% 1RM. Stabilisation scapulaire. Coude haut.", progression:"70% → 75% 1RM sur le bloc." },
          { nom:'RI excentrique 90/90', muscles:'Rotateurs internes (excentrique)', series:'4×8', repos:"90''", consigne:"Phase excentrique 4s. 50-60% 1RM. Contrôle total.", progression:"Volume stable, intensité +5% S7." },
          { nom:'Landmine Press unilatéral', muscles:'Chaîne cinétique complète', series:'4×8', repos:"90''", consigne:"Fente avant, pression diagonale. 60-70% 1RM. Activation chaîne cinétique.", progression:"Stabilité lombaire avant augmentation charge." },
          { nom:'Pull-Up neutre (lest)', muscles:'Grand dorsal, biceps, trapèze inférieur', series:'4×6', repos:"2'", consigne:"Prise neutre, dépression scapulaire contrôlée. PC + lest progressif.", progression:"+2.5kg/semaine si technique parfaite." },
          { nom:'Nordic External Rotation', muscles:'Rotateurs externes (excentrique maximal)', series:'3×6', repos:"90''", consigne:"Agenouillé, inclinaison contrôlée à 35°. Excentrique maximal. Poids de corps.", progression:"Progression très progressive — 3 sem. d'adaptation." },
        ]
      },
      {
        titre: 'Bloc 3 — Puissance (S9-S12)',
        exercices: [
          { nom:'Med Ball Rotational Throw 3kg', muscles:'Chaîne cinétique rotation complète', series:'5×6', repos:"2'", consigne:"Hanches en premier, rotation explosive, transfert chaîne cinétique. Explosif.", progression:"Focus vélocité maximale. Qualité > quantité." },
          { nom:'Pompe plyométrique', muscles:'Pectoraux, triceps, deltoïde antérieur', series:'4×6', repos:"2'", consigne:"Décollage des mains, rebond minimal. Poids de corps. Explosivité maximale.", progression:"Introduire médecine-ball sous les mains dès S11." },
          { nom:'Cable ER/IR vitesse maximale', muscles:'Rotateurs, chaîne de lancer', series:'4×10', repos:"90''", consigne:"40% 1RM, vélocité maximale sur chaque répétition. 90/90.", progression:"Maintenir 40% 1RM — la vitesse est l'objectif." },
          { nom:'Overhead Press unilatéral debout', muscles:'Deltoïde, triceps, stabilisateurs lombaires', series:'4×6', repos:"2'", consigne:"70-80% 1RM. Core actif. Alignement strict pied-hanche-épaule.", progression:"+5% S11 si test fonctionnel OK." },
          { nom:'Battle Ropes cercles 20s', muscles:'Endurance musculaire épaule complète', series:"4×20''", repos:"60''", consigne:"Cercles horizontaux larges. Épaules actives et stables pendant 20s.", progression:"Augmenter la durée à 30s dès S11." },
          { nom:'Lancer progressif balle 500g', muscles:'Geste spécifique handball — lancer complet', series:'6×10', repos:"2'", consigne:"60-90% intensité. Armé complet RE max. Suivi radar recommandé.", progression:"Cibler +3% vélocité vs baseline. Geste technique prioritaire." },
        ]
      }
    ]
  },
  genou: {
    label: 'Genou — Prévention',
    color: '#4CAF50',
    icon: '🦵',
    description: 'Renforcement quadriceps, ischio-jambiers et contrôle du valgus dynamique. Prévention LCA et tendinopathie patellaire.',
    versions: [
      {
        titre: 'Avec matériel',
        exercices: [
          { nom:'Press verticale', muscles:'Quadriceps, ischio-jambiers, fessiers', series:'5×10', repos:"1'30", consigne:"Pied à plat sur plateau, 90° de flexion, extension à 170°. Ne jamais verrouiller le genou.", progression:"60% 1RM → 70% → 80% sur 4 semaines. Excentrique 4'' à partir de S5." },
          { nom:'Spanish squat élastique', muscles:'Quadriceps distal, rotateurs externes du genou', series:'4×12', repos:"1'", consigne:"Élastique épais autour d'un poteau, tibias verticaux, descente lente, focus genou stable.", progression:"S1-2 : ×10 tempo 3-0-1. S3-4 : ×12. S5-6 : ×12 + pause 2'' en bas." },
          { nom:'Fente bulgare', muscles:'Quadriceps, fessiers, ischio-jambiers', series:'4×8/côté', repos:"1'30", consigne:"Pied arrière sur banc. Descente à 90°, genou avant aligné sur 2e orteil, remontée explosive.", progression:"PdC → haltères légers → haltères lourds → barre haute." },
          { nom:'Chaise isométrique', muscles:'Quadriceps isométrique, vastus medialis', series:"8×40''", repos:"30''", consigne:"Dos au mur, cuisse horizontale, 90° de flexion. Maintien strict. Souffle continu pendant toute la durée.", progression:"30'' → 40'' → 60''. Puis disque posé sur les genoux pour surcharge." },
          { nom:'Zercher squat', muscles:'Quadriceps, fessiers, adducteurs, core', series:'3×8', repos:"2'", consigne:"Barre dans le creux des coudes. Descente profonde, dos neutre, genoux dans l'axe.", progression:"Barre vide → +10kg/semaine. Technique avant toute augmentation de charge." },
        ]
      },
      {
        titre: 'Sans matériel',
        exercices: [
          { nom:'Sissy squat assisté', muscles:'Quadriceps distal, tendon rotulien', series:'4×8', repos:"1'30", consigne:"Main légère sur mur, genoux pointent vers l'avant, talons décollés. Descente lente 4''.", progression:"S1-2 : mains sur mur. S3-4 : doigt sur mur. S5-6 : aucun appui." },
          { nom:'Chaise isométrique', muscles:'Quadriceps, vastus medialis, ischio-jambiers', series:"8×40''", repos:"30''", consigne:"Dos au mur, cuisse parallèle au sol, 90°. Position stable. Respiration abdominale continue.", progression:"30'' → 45'' → 60''. Puis unilatéral pour doubler la charge." },
          { nom:'Nordic curl assisté', muscles:'Ischio-jambiers excentrique, gastrocnémiens', series:'4×5', repos:"2'", consigne:"Genoux au sol, cheville maintenue fixe. Descente contrôlée en 4'', mains au sol pour atterrir.", progression:"Avec aide élastique → sans aide → charge sur poitrine." },
          { nom:'Squat sauté', muscles:'Quadriceps, fessiers, mollets, stabilisateurs', series:'5×8', repos:"1'30", consigne:"Descente à 90°, montée explosive avec saut vertical. Atterrissage silencieux, genoux alignés.", progression:"Squat normal → squat sauté → squat sauté + excentrique à l'atterrissage." },
          { nom:'Bridge unilatéral', muscles:'Fessiers, ischio-jambiers, core', series:'4×12/côté', repos:"45''", consigne:"Dos au sol, 1 jambe pliée, autre tendue. Poussée du bassin vers le haut, maintien 2'' en haut.", progression:"Bilatéral → unilatéral → unilatéral avec disque posé sur le bassin." },
        ]
      }
    ]
  },
  ischio_grade1: {
    label: 'Ischio — Réathlétisation Grade 1',
    color: '#EC4899',
    icon: '🩹',
    description: "Lésion myo-aponévrotique grade 1 de l'ischio-jambier. Progression isométrique → excentrique → concentrique/poly-articulaire → retour au soulevé de terre et au geste sportif, sur 6 à 8 semaines. Assigner une phase à la fois, en avançant à la phase suivante quand les critères d'entrée de celle-ci sont remplis (voir consignes de chaque exercice).",
    versions: [
      {
        titre: 'Phase 1 — Isométrique (S1-2)',
        exercices: [
          { nom:'Isométrique ischio 0-15° (leg curl banc, position courte)', muscles:'Ischio-jambiers', series:'5×10-15\'\'', repos:"—", consigne:"Contraction maintenue en position peu allongée, angle de genou proche de l'extension complète. Sous-maximal (60-70%). 2x/jour.", progression:"Critère d'entrée : marche normale sans boiterie, douleur au repos ≤2/10. Ne pas passer à la phase 2 tant que ce n'est pas indolore à charge modérée-élevée pendant 3-4 séances." },
          { nom:'Pont fessier isométrique unipodal', muscles:'Fessiers, ischio-jambiers', series:"4×15-20''", repos:"—", consigne:"Talon au sol, genou fléchi ~90°, maintien en position haute, bassin stable. Sous-maximal. 1x/jour.", progression:"Augmenter la durée de maintien avant la charge." },
          { nom:'Isométrique nordic partiel (angle réduit)', muscles:'Ischio-jambiers', series:"3×10''", repos:"—", consigne:"Maintien statique dans les 15-20 premiers degrés seulement du nordic, aide des mains si besoin. Faible amplitude. Tous les 2 jours.", progression:"Éviter tout étirement passif en fin d'amplitude à ce stade." },
        ]
      },
      {
        titre: 'Phase 2 — Excentrique progressif (S2-4)',
        exercices: [
          { nom:'Nordic hamstring partiel', muscles:'Ischio-jambiers', series:'3×5-6', repos:"2'", consigne:"Descente contrôlée jusqu'au premier point de tension/appréhension, remontée aidée des mains. Tempo lent (3-4'' descente). 2x/semaine.", progression:"Augmenter l'amplitude semaine après semaine, pas séance après séance." },
          { nom:'Leg curl excentrique unilatéral', muscles:'Ischio-jambiers', series:'3×8', repos:"90''", consigne:"Phase concentrique bilatérale, phase excentrique unilatérale ralentie. Charge légère à modérée, tempo 3''. 2x/semaine.", progression:"+charge légère chaque semaine si indolore." },
          { nom:'Soulevé de terre roumain unipodal', muscles:'Ischio-jambiers, fessiers, chaîne postérieure', series:'3×6-8/jambe', repos:"90''", consigne:"Amplitude progressive, dos neutre, ischio en charge à la descente. Poids du corps → charge légère. 2x/semaine.", progression:"Un seul paramètre à la fois : charge OU amplitude OU volume." },
          { nom:'Glute-ham raise assisté', muscles:'Ischio-jambiers, fessiers', series:'3×6', repos:"90''", consigne:"Version facilitée (élastique ou aide manuelle), amplitude complète progressive. 1-2x/semaine.", progression:"Critère d'entrée phase 3 : nordic partiel et RDL unipodal en amplitude quasi complète, sans douleur, charge légère." },
        ]
      },
      {
        titre: 'Phase 3 — Concentrique & poly-articulaire (S4-6)',
        exercices: [
          { nom:'Soulevé de terre roumain bilatéral (barre)', muscles:'Ischio-jambiers, fessiers, lombaires', series:'4×6-8', repos:"2'", consigne:"Amplitude complète, charge progressive séance après séance. 60% → 75% du 1RM estimé pré-blessure. 2x/semaine.", progression:"+5% charge/semaine si indolore le lendemain." },
          { nom:'Hip thrust barre', muscles:'Fessiers, ischio-jambiers', series:'4×8-10', repos:"2'", consigne:"Extension de hanche complète, contrôle du bas du dos. Charge modérée à élevée. 2x/semaine.", progression:"Charge progressive parallèle au RDL." },
          { nom:'Nordic hamstring complet', muscles:'Ischio-jambiers', series:'3×6-8', repos:"2'", consigne:"Amplitude complète, sans aide des mains si possible. Poids du corps. 2x/semaine.", progression:"Objectif : nordic complet indolore avant la phase 4." },
          { nom:'Fentes marchées / step-up chargés', muscles:'Chaîne postérieure globale, stabilité du bassin', series:'3×10/jambe', repos:"90''", consigne:"Intégration chaîne postérieure globale. Charge légère à modérée. 1-2x/semaine.", progression:"Ajouter charge progressivement." },
          { nom:'Sprint progressif (75%→90% vitesse max)', muscles:'Ischio-jambiers, chaîne postérieure', series:'6-8×30-40m', repos:"2'", consigne:"Réintroduction de la vitesse en ligne droite, terrain plat. Progressif sur 2 semaines. 2x/semaine.", progression:"Critère d'entrée phase 4 : sprint à 90% toléré sans douleur, force ≥90% du membre sain si testable." },
        ]
      },
      {
        titre: 'Phase 4 — Retour SDT & geste sportif (S6-8+)',
        exercices: [
          { nom:'Soulevé de terre conventionnel/sumo (charge club)', muscles:'Ischio-jambiers, fessiers, chaîne postérieure complète', series:'4-5×3-5', repos:"3'", consigne:"Retour progressif vers les charges d'entraînement habituelles. 80%→100% du 1RM pré-blessure sur 2-3 semaines. 2x/semaine.", progression:"Reprise du protocole force normal du joueur une fois 100% atteint sans douleur." },
          { nom:'Nordic hamstring lesté', muscles:'Ischio-jambiers', series:'3×6', repos:"2'", consigne:"Charge additionnelle légère (gilet ou disque tenu). Charge progressive. 1-2x/semaine.", progression:"Maintenir en entretien même après retour complet, pour limiter le risque de récidive." },
          { nom:'Sprint maximal + changements de direction', muscles:'Ischio-jambiers, chaîne postérieure, geste spécifique', series:'Volume spécifique poste', repos:"selon séance", consigne:"Réintégration du geste spécifique handball (courses, feintes, appuis). 100% vitesse. Selon planning collectif.", progression:"Validé après 2 séances de sprint max répétées sans douleur ni appréhension." },
          { nom:'Réintégration collective progressive', muscles:'Global', series:'Selon séance', repos:"—", consigne:"Entraînement complet avec l'équipe, sans restriction. 100%. Planning normal.", progression:"Retour au jeu validé — bascule vers le protocole de prévention ischio en entretien." },
        ]
      },
    ]
  },
  cheville: {
    label: 'Cheville — Prévention',
    color: '#38BDF8',
    icon: '🦶',
    description: 'Renforcement des stabilisateurs et proprioception. Prévention des entorses lors des réceptions et changements de direction.',
    versions: [
      {
        titre: 'Avec matériel',
        exercices: [
          { nom:'Extension de mollet step', muscles:'Soléaire, gastrocnémiens', series:'4×10', repos:"1'30", consigne:"Pied sur step, talon dans le vide. Descente 3'', remontée explosive depuis le bout du pied.", progression:"S1-2 : 3×10. S3-4 : 4×10 + gilet 5kg. S5-6 : 4×12 + pause 2'' en haut." },
          { nom:'Drop jump réception 1 jambe', muscles:'Tibial antérieur, fibulaires, propriocepteurs', series:'5×6', repos:"1'30", consigne:"Saut depuis banc, atterrir 1 pied, amortir en 2'', remonter immédiatement sans pause.", progression:"Phase 1 : 2 jambes. Phase 2 : uni basse. Phase 3 : hauteur banc standard." },
          { nom:'Abduction cheville élastique', muscles:'Fibulaires, péroniers latéraux', series:'3×12/côté', repos:"45''", consigne:"Élastique autour du pied, fixé au sol. Abduction lente contre résistance, retour contrôlé 3''.", progression:"Jaune → vert → rouge sur 3 semaines. +2 reps/semaine." },
          { nom:'Proprioception plateau instable', muscles:'Propriocepteurs, muscles intrinsèques du pied', series:"4×30''", repos:"1'", consigne:"Debout sur plateau 1 jambe, maintien 30''. Perturbations progressives ajoutées.", progression:"Yeux ouverts → fermés → fermés + déstabilisation partenaire." },
          { nom:'Jeu du carré proprioceptif', muscles:"Chaîne stabilisatrice cheville complète", series:'4×3 carrés', repos:"1'", consigne:"Sur 1 pied : tracer un carré en 4 appuis directionnels. Avancer l'appui, maintenir l'équilibre.", progression:"Sol plan → tapis → yeux fermés → attraper ballon simultanément." },
        ]
      },
      {
        titre: 'Sans matériel',
        exercices: [
          { nom:'Flexion plantaire unipodal', muscles:'Gastrocnémiens, soléaire', series:'4×15', repos:"1'", consigne:"Debout 1 pied, montée sur pointe, descente contrôlée 3''. Main sur mur pour équilibre uniquement.", progression:"S1-2 : 3×12. S3-4 : excentrique 3''. S5-6 : pause 2'' en haut + amplitude maximale." },
          { nom:'Jeu du carré proprioceptif', muscles:'Chaîne stabilisatrice complète', series:'4×3 carrés', repos:"1'", consigne:"Sur 1 pied, tracer un carré en 4 appuis directionnels. Progresser vers les yeux fermés.", progression:"Sol plan → tapis → yeux fermés → perturbations partenaire." },
          { nom:'Alphabet cheville', muscles:'Muscles intrinsèques, mobilisateurs de cheville', series:'2×alphabet/côté', repos:"45''", consigne:"Assis ou debout, écrire A→Z avec le pied en suspension, cheville unique articulation mobile.", progression:"Vitesse lente → normale → rapide avec amplitude maximale." },
          { nom:'Mini-fentes équilibre', muscles:'Tibial antérieur, fibulaires, quadriceps', series:'3×10/côté', repos:"45''", consigne:"Fente avant, pied avant talon, pied arrière sur pointe. Maintien 3'' en bas, remontée contrôlée.", progression:"Statique → dynamique → fente dynamique + rotation tronc." },
          { nom:'Saut réception unilatérale', muscles:'Chaîne postérieure, cheville complète', series:'4×8', repos:"1'30", consigne:"Saut vertical, réception 2 pieds puis 1 pied. Atterrissage silencieux, plier le genou à 30°.", progression:"Réception 2 jambes → uni yeux ouverts → uni yeux fermés." },
        ]
      }
    ]
  },
  pubalgie: {
    label: 'Pubalgie — Prévention',
    color: '#EC4899',
    icon: '🦵',
    description: 'Renforcement des adducteurs et des insertions basses du bassin (pubis, symphyse). Prévention de la pubalgie liée aux changements de direction, tirs et frappes répétées en handball.',
    versions: [
      {
        titre: 'Avec matériel',
        exercices: [
          { nom:'Copenhagen plank (genou)', muscles:'Adducteurs, gracile, insertion pubienne', series:'3×20-30\'\'/côté', repos:"1'", consigne:"Jambe du dessus posée sur un banc, jambe du dessous suspendue. Aligner tête-bassin-genou, ne pas laisser tomber le bassin.", progression:"Genou fléchi → jambe tendue (Copenhagen complet) sur 4-6 semaines." },
          { nom:'Adduction hanche câble/élastique', muscles:'Adducteurs (long, court, grand adducteur)', series:'4×12/côté', repos:"45''", consigne:"Câble ou élastique fixé au sol, jambe qui traverse la ligne médiane contre résistance. Bassin stable, pas de rotation du tronc.", progression:"Résistance légère → modérée sur 3 semaines, puis vitesse d'exécution contrôlée." },
          { nom:'Squeeze ball isométrique (ballon entre genoux)', muscles:'Adducteurs, insertion pubienne', series:"5×10''", repos:"30''", consigne:"Allongé, genoux fléchis à 90°, ballon entre les genoux. Presser fort et maintenir, sans bloquer la respiration.", progression:"10'' → 20'' → 30'' de maintien sur 3 semaines. Ajouter presse en position debout ensuite." },
          { nom:'Fentes latérales (skater)', muscles:'Adducteurs excentriques, fessiers, stabilité genou', series:'4×8/côté', repos:"1'", consigne:"Grand pas latéral, hanche en arrière, genou aligné avec le pied. Retour poussé par la jambe d'appui.", progression:"Amplitude réduite → amplitude complète → ajout charge (haltères) sur 4 semaines." },
          { nom:'Gainage anti-rotation (Pallof press)', muscles:'Obliques, transverse, stabilisateurs du bassin', series:'3×10/côté', repos:"45''", consigne:"Câble ou élastique de côté, pousser devant soi sans laisser le tronc pivoter. Bassin et épaules restent face à l'avant.", progression:"Résistance légère → modérée. Ajouter un temps de maintien 2'' en fin de course." },
        ]
      },
      {
        titre: 'Sans matériel',
        exercices: [
          { nom:'Copenhagen plank sur chaise', muscles:'Adducteurs, insertion pubienne', series:'3×15-20\'\'/côté', repos:"1'", consigne:"Jambe du dessus sur une chaise ou un banc, jambe du dessous suspendue. Bassin aligné, ne pas creuser le dos.", progression:"Genou fléchi contre le sol → jambe tendue complète sur 4-6 semaines." },
          { nom:'Adduction isométrique ballon/coussin', muscles:'Adducteurs, gracile', series:"5×10''", repos:"30''", consigne:"Assis ou allongé, ballon/coussin entre les genoux, presser fort en maintenant une respiration normale.", progression:"10'' → 20'' → 30''. Passer en position debout jambes tendues ensuite." },
          { nom:'Fentes latérales poids de corps', muscles:'Adducteurs excentriques, fessiers', series:'4×8/côté', repos:"1'", consigne:"Grand pas latéral, hanche reculée, genou aligné avec le pied, retour actif poussé par la jambe d'appui.", progression:"Amplitude partielle → amplitude complète → tempo lent (3'' descente)." },
          { nom:'Pont fessier + adduction', muscles:'Fessiers, adducteurs, chaîne postérieure', series:'4×12', repos:"45''", consigne:"Pont fessier classique, ballon entre les genoux pressé en continu pendant tout le mouvement.", progression:"Pont statique → pont dynamique avec pression constante du ballon." },
          { nom:'Gainage latéral (planche côté)', muscles:'Obliques, carré des lombes, stabilité bassin', series:"4×20-30''/côté", repos:"45''", consigne:"Appui coude, corps aligné tête-bassin-pieds, bassin ni en avant ni en arrière.", progression:"Genoux au sol → jambes tendues → jambe du dessus levée." },
        ]
      }
    ]
  },
  mobilite_matinale: {
    label: 'Mobilité matinale — Réveil articulaire',
    color: '#4CAF50',
    icon: '🌅',
    description: 'Routine complète de mobilité articulaire globale à faire au réveil ou avant l\'entraînement du matin. Parcourt toutes les grandes articulations (cheville, hanche, colonne, épaule, poignet) pour démarrer la journée sans matériel.',
    versions: [
      {
        titre: 'Routine complète (10-15 min)',
        exercices: [
          { nom:'Mobilité cheville dynamique — appuis pivot handball', muscles:'Mobilité tibio-tarsienne, stabilité d\'appui unipodal', series:'8 directions/pied', repos:'—', consigne:"En appui sur une jambe (comme sur jambe d'appel ou pivot), pousser le genou vers l'avant en gardant le talon au sol, puis vers l'intérieur, puis vers l'extérieur — reproduit les amplitudes de cheville utilisées en pivot défensif et en blocage de pied avant tir.", progression:"Appui contre un mur pour le repère du genou → sans appui → en dynamique (petits sautillés) sur les 3 directions." },
          { nom:'Balancers de jambe (fessier)', muscles:'Mobilité hanche — flexion/extension', series:'10/côté', repos:'—', consigne:"Appui sur un mur ou une chaise, balancer la jambe tendue avant-arrière en laissant le bassin stable.", progression:"Amplitude progressive, ne pas forcer en fin de course les premières semaines." },
          { nom:'Balancers de jambe (latéral)', muscles:'Mobilité hanche — abduction/adduction', series:'10/côté', repos:'—', consigne:"Balancer la jambe tendue de gauche à droite devant le corps, tronc gainé et stable.", progression:"Ajouter une légère rotation externe en fin de mouvement une fois à l'aise." },
          { nom:'90/90 hip switch', muscles:'Rotation interne/externe de hanche', series:'8 passages/côté', repos:'—', consigne:"Assis au sol, jambes à 90°, pivoter d'un côté à l'autre en gardant le dos droit et les fesses au sol.", progression:"Ajouter une légère inclinaison du buste vers la jambe avant en fin de mouvement." },
          { nom:'Cat-cow (chat-vache)', muscles:'Mobilité colonne — flexion/extension', series:'10 répétitions lentes', repos:'—', consigne:"À quatre pattes, alterner dos rond (expiration) et dos creux (inspiration), mouvement fluide et respiré.", progression:"Synchroniser respiration et mouvement, ralentir pour maximiser l'amplitude." },
          { nom:'Rotation thoracique (open book)', muscles:'Mobilité colonne thoracique', series:'8/côté', repos:'—', consigne:"Allongé sur le côté, genoux fléchis à 90°, ouvrir le bras du dessus vers l'arrière en suivant la main du regard.", progression:"Chercher à poser l'épaule au sol progressivement sans décoller les genoux." },
          { nom:'Cercles d\'épaule + rotation externe', muscles:'Mobilité gléno-humérale, coiffe des rotateurs', series:'10 cercles + 10 rotations/côté', repos:'—', consigne:"Grands cercles d'épaule vers l'avant puis l'arrière, puis rotation externe bras collé au corps coude à 90°.", progression:"Amplitude maximale sans douleur, ralentir en fin de course." },
          { nom:'Mobilité poignet (flexion/extension)', muscles:'Poignets, avant-bras', series:'10 flex + 10 ext/côté', repos:'—', consigne:"Bras tendu devant soi, tirer les doigts vers soi puis vers le bas avec l'autre main, amplitude progressive.", progression:"Ajouter des cercles de poignet en fin de série une fois échauffé." },
          { nom:"Fente avant + rotation (world's greatest stretch)", muscles:'Hanche, ischio-jambiers, thoracique — global', series:'5/côté', repos:'—', consigne:"Grand pas en fente, main au sol, rotation du tronc bras vers le plafond, regard qui suit la main.", progression:"Enchaîner sur 10-15m en marchant une fois la technique acquise." },
          { nom:'Squat profond avec maintien', muscles:'Chevilles, hanches, colonne — position globale', series:"3×20''", repos:"20''", consigne:"Descendre en squat complet, talons au sol, buste droit, maintenir la position en respirant calmement.", progression:"Aide d'un support (porte, poteau) au début → sans aide → bras tendus devant." },
        ]
      }
    ]
  },
  prevention_globale: {
    label: 'Prévention globale & RTP',
    color: '#7C6FFF',
    icon: '🛡️',
    description: 'Échauffement neuromusculaire, modèle ACWR et critères de retour à la compétition (Return To Play).',
    versions: [
      {
        titre: 'Échauffement neuromusculaire (15-20 min)',
        exercices: [
          { nom:'Phase 1 — Course', muscles:'Activation cardiovasculaire', series:'3 min', repos:'—', consigne:"Course lente, variations de rythme, changements de direction.", progression:"Intensité progressive sur les 3 minutes." },
          { nom:'Phase 2 — Renforcement', muscles:'Stabilité tronc/hanche', series:'2×10', repos:'—', consigne:"Gainage, pont fessier, fentes statiques + équilibre.", progression:"Qualité d'exécution avant vitesse." },
          { nom:'Phase 3 — Pliométrie', muscles:'Réactivité neuromusculaire', series:'2×8', repos:'—', consigne:"Sauts avec réception contrôlée, hop tests.", progression:"Atterrissage silencieux — critère qualité." },
          { nom:'Phase 4 — Spécifique handball', muscles:'Activation gestuelle', series:'3-4 min', repos:'—', consigne:"Tirs techniques, dribbles vitesse, jeu positionnel.", progression:"Augmenter l'intensité des tirs progressivement." },
          { nom:'Phase 5 — Étirements dynamiques', muscles:'Amplitude fonctionnelle', series:'2 min', repos:'—', consigne:"Balancers, rotations, lunges dynamiques.", progression:"Amplitude complète sans douleur." },
        ]
      },
      {
        titre: 'Modèle ACWR — Gestion de charge',
        exercices: [
          { nom:'Zone verte ACWR 0.8–1.3', muscles:'Zone optimale', series:'Maintenir', repos:'—', consigne:"Ratio charge aiguë/chronique optimal. Progression normale autorisée.", progression:"Sweet spot : maintenir et progresser normalement." },
          { nom:'Zone vigilance ACWR 1.3–1.5', muscles:'Surveillance accrue', series:'Surveiller', repos:'—', consigne:"Surveiller les signes de fatigue / RPE élevé. Réduire si douleur.", progression:"Réduire le volume avant l'intensité." },
          { nom:'Zone rouge ACWR > 1.5', muscles:'Surcharge aiguë', series:'Réduire', repos:'—', consigne:"Réduire la charge immédiatement. Risque de blessure multiplié par 3-4.", progression:"Retour en zone verte avant reprise normale." },
        ]
      },
      {
        titre: 'Critères RTP — Retour compétition',
        exercices: [
          { nom:'Symétrie force', muscles:'Membres blessé vs sain', series:'> 90%', repos:'—', consigne:"Test isocinétique ou comparatif. Aucun écart > 10% entre les deux côtés.", progression:"Tester toutes les 2 semaines en phase finale." },
          { nom:'Douleur à l effort', muscles:'EVA pendant l effort', series:'< 2/10', repos:'—', consigne:"Critère absolu. Aucun retour si douleur ≥ 2/10 pendant les tests fonctionnels.", progression:"Bilan quotidien pendant la reprise progressive." },
          { nom:'Amplitude articulaire', muscles:'ROM complet restauré', series:'100%', repos:'—', consigne:"Amplitude identique au côté sain. Goniométrie comparative.", progression:"Étirements quotidiens en phase de rééducation." },
          { nom:'Tests fonctionnels hop test', muscles:'Chaîne cinétique complète', series:'> 85%', repos:'—', consigne:"Triple Hop Test, Single Leg Squat, Y-Balance Test. Symétrie > 85%.", progression:"Tester à J0, J45 et avant retour compétition." },
          { nom:'Score psychologique ACL-RSI', muscles:'Confiance / gestion peur', series:'> 65/100', repos:'—', consigne:"Questionnaire ACL-RSI. Facteur prédictif majeur de récidive. Ne pas négliger.", progression:"Travail mental concomitant si score < 65." },
        ]
      }
    ]
  }
};

function ProtocolesHandball({ player, onAssign }) {
  const [zone, setZone]       = useState('epaule_prevention');
  const [version, setVersion] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [assigned, setAssigned] = useState(false);

  const proto = PROTOCOLES_DATA[zone];

  function assignerCeProtocole() {
    const v = proto.versions[version];
    if (!v || !onAssign) return;
    const bloc = {
      nom: proto.icon + ' ' + proto.label + ' — ' + v.titre,
      exercices: (v.exercices || []).map(ex => ({
        nom: ex.nom, series: '', reps: ex.series, charge: ex.muscles || '', repos: ex.repos, notes: ex.consigne || '', progression: ex.progression || ''
      }))
    };
    onAssign(bloc);
    setAssigned(true);
    setTimeout(() => setAssigned(false), 2000);
  }

  return _h`<div>
    <!-- Sélecteur de zone -->
    <div style=${{ marginBottom:16 }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Zone / Thème</div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${Object.entries(PROTOCOLES_DATA).map(([key, p]) => _h`<button key=${key}
          onClick=${() => { setZone(key); setVersion(0); setExpanded(null); }}
          style=${{
            padding:'7px 12px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif',
            fontSize:11, fontWeight: zone===key ? 800 : 500,
            border:'1px solid ' + (zone===key ? p.color : 'rgba(255,255,255,.1)'),
            background: zone===key ? p.color+'18' : 'rgba(255,255,255,.04)',
            color: zone===key ? p.color : 'rgba(255,255,255,.4)', transition:'all .15s'
          }}>${p.icon} ${p.label}</button>`)}
      </div>
    </div>

    <!-- Info zone -->
    <div style=${{ background:proto.color+'08', border:'1px solid '+proto.color+'25', borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
        <div>
          <div style=${{ fontSize:13, fontWeight:700, color:proto.color, marginBottom:4 }}>${proto.icon} ${proto.label}</div>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>${proto.description}</div>
        </div>
        ${(player && onAssign) ? _h`<button class="btn btn-sm" onClick=${assignerCeProtocole}
          style=${{ flexShrink:0, background: assigned ? 'rgba(76,175,80,.15)' : proto.color+'18', border:'1px solid '+(assigned?'rgba(76,175,80,.5)':proto.color+'50'), color: assigned ? '#4CAF50' : proto.color, fontWeight:700, whiteSpace:'nowrap' }}>
          ${assigned ? '✓ Assigné' : '☑ Assigner à ' + player.name}
        </button>` : null}
      </div>
    </div>

    <!-- Sélecteur version -->
    ${(proto.versions||[]).length > 0 ? _h`<div style=${{ display:'flex', gap:6, marginBottom:16, background:'rgba(255,255,255,.03)', borderRadius:10, padding:3 }}>
      ${proto.versions.map((v, i) => _h`<button key=${i}
        onClick=${() => { setVersion(i); setExpanded(null); }}
        style=${{
          flex:1, padding:'8px 6px', borderRadius:8, border:'none', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:11, fontWeight: version===i ? 700 : 400,
          background: version===i ? proto.color+'20' : 'transparent',
          color: version===i ? proto.color : 'rgba(255,255,255,.4)'
        }}>${v.titre}</button>`)}
    </div>` : null}

    <!-- Liste exercices -->
    <div>
      ${(proto.versions[version] ? proto.versions[version].exercices || [] : []).map((ex, i) => {
        const isOpen = expanded === i;
        return _h`<div key=${i} style=${{
          background: isOpen ? proto.color+'08' : 'rgba(255,255,255,.025)',
          border:'1px solid ' + (isOpen ? proto.color+'40' : 'rgba(255,255,255,.07)'),
          borderRadius:12, marginBottom:8, overflow:'hidden', transition:'all .15s'
        }}>
          <!-- Header cliquable -->
          <div style=${{ padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
            onClick=${() => setExpanded(isOpen ? null : i)}>
            <div style=${{ flex:1 }}>
              <div style=${{ fontSize:13, fontWeight:700 }}>${ex.nom}</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${ex.muscles}</div>
            </div>
            <div style=${{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <span style=${{ fontSize:12, color:proto.color, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${ex.series}</span>
              <span style=${{ fontSize:12, color:'rgba(255,255,255,.3)' }}>${isOpen ? '▲' : '▼'}</span>
            </div>
          </div>
          <!-- Détail -->
          ${isOpen ? _h`<div style=${{ padding:'0 14px 14px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10, marginTop:10 }}>
              <div style=${{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Séries/Reps</div>
                <div style=${{ fontSize:13, fontWeight:700, color:proto.color }}>${ex.series}</div>
              </div>
              <div style=${{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Repos</div>
                <div style=${{ fontSize:13, fontWeight:700 }}>${ex.repos}</div>
              </div>
            </div>
            <div style=${{ marginBottom:8 }}>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Consigne</div>
              <div style=${{ fontSize:12, color:'rgba(255,255,255,.7)', lineHeight:1.6, background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 10px' }}>${ex.consigne}</div>
            </div>
            <div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Progression</div>
              <div style=${{ fontSize:12, color:proto.color, lineHeight:1.6, background:proto.color+'08', borderRadius:8, padding:'8px 10px', fontStyle:'italic' }}>📈 ${ex.progression}</div>
            </div>
          </div>` : null}
        </div>`;
      })}
    </div>

    <!-- Source -->
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.2)', textAlign:'center', marginTop:16, fontStyle:'italic' }}>
      Sources : Langevoort et al. (2007), Forthomme et al. (2011), Olsen et al. (2005), Hulin et al. (2016) · @leo.perfhandball
    </div>
  </div>`;
}


// ── BIBLIOTHÈQUE DE MOUVEMENTS ────────────────────────────────────────────────
// ── BIBLIO LINK HELPER ───────────────────────────────────────────────────────
function findBiblioMatch(nomExercice) {
  if (!nomExercice) return null;
  // Normalisation : minuscules, sans accents, sans ponctuation
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const STOP = new Set(['aux', 'avec', 'de', 'du', 'des', 'la', 'le', 'les', 'a', 'au', 'en', 'et', 'sur', 'un', 'une', 'd', 'l']);
  // Mots significatifs (pluriel retiré : haltères = haltère)
  const toks = (t) => new Set(norm(t).split(' ').filter(w => w && !STOP.has(w)).map(w => w.length > 3 ? w.replace(/[sx]$/, '') : w));
  const nom = norm(nomExercice);
  const tNom = toks(nomExercice);
  function appliquerOverride(m) {
    const ov = (window.__perfhand_biblio_overrides || {})[m.nom.trim().toLowerCase()];
    return ov ? { ...m, videoUrl: ov.videoUrl, videoId: ov.videoId, imageUrl: ov.imageUrl } : m;
  }
  const customMvts = (window.__perfhand_custom_biblio || []).filter(m => m && m.nom);
  // Entrées hard-codées valides (celles sans groupe sont des en-têtes parasites)
  const validMvts = BIBLIOTHEQUE_MOUVEMENTS.filter(m => m && m.nom && m.groupe && m.groupe.length > 0);
  // 1. Nom identique (custom d'abord, puis bibliothèque de base)
  let match = customMvts.find(m => norm(m.nom) === nom);
  if (match) return match;
  match = validMvts.find(m => norm(m.nom) === nom);
  if (match) return appliquerOverride(match);
  // Correspondance STRICTE : uniquement le même nom (casse, accents, ponctuation et pluriel ignorés).
  // « Curl avant-bras à la barre » ne tombe donc plus sur « Curl barre » : pas de fiche vaut mieux
  // qu'une fiche d'un autre exercice. Les liens voulus (ex. bilans) passent par le champ `biblio`.
  return null;
}

function BiblioLinkButton({ nomExercice }) {
  const [showModal, setShowModal] = React.useState(false);
  const rawMatch = findBiblioMatch(nomExercice);
  if (!rawMatch) return null;
  // Normaliser : custom exos ont 'cues' et 'videoUrl', hard-codés ont 'notes' et 'videoId'
  let vid = rawMatch.videoId;
  if (!vid && rawMatch.videoUrl) {
    const m = rawMatch.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    if (m) vid = m[1];
  }
  const match = { ...rawMatch, videoId: vid, notes: rawMatch.notes || rawMatch.cues };

  return _h`<span>
    <button
      onClick=${e => { e.stopPropagation(); setShowModal(true); }}
      style=${{
        fontSize:9, padding:'2px 7px', borderRadius:20, cursor:'pointer',
        background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.25)',
        color:'#38BDF8', fontWeight:700, marginLeft:6
      }}>📚 Fiche</button>

    ${showModal ? _h`<div class="modal-overlay" onClick=${e => { e.stopPropagation(); setShowModal(false); }}>
      <div class="modal-box" style=${{ maxWidth:420 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style=${{ fontSize:16, fontWeight:800 }}>${match.nom}</div>
            ${match.variante ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${match.variante}</div>` : null}
          </div>
          <button onClick=${() => setShowModal(false)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer', padding:'0 4px' }}>×</button>
        </div>

        <!-- Muscles -->
        <div style=${{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          <span style=${{ fontSize:10, background:'rgba(255,164,32,.12)', color:'#FFA420', padding:'2px 9px', borderRadius:20, fontWeight:700 }}>${match.groupe}</span>
          ${match.niveau ? _h`<span style=${{ fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:700,
            background: match.niveau==='Débutant'?'rgba(76,175,80,.12)':match.niveau==='Avancé'?'rgba(255,68,85,.12)':'rgba(255,164,32,.12)',
            color: match.niveau==='Débutant'?'#4CAF50':match.niveau==='Avancé'?'#FF4455':'#FFA420'
          }}>${match.niveau}</span>` : null}
          ${match.materiel ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', padding:'2px 9px', borderRadius:20, background:'rgba(255,255,255,.06)' }}>🏋 ${match.materiel}</span>` : null}
        </div>

        ${match.musclesSec ? _h`<div style=${{ marginBottom:10 }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>Muscles secondaires</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)' }}>${match.musclesSec}</div>
        </div>` : null}

        ${match.objectif ? _h`<div style=${{ marginBottom:10 }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>Objectif</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)' }}>${match.objectif}</div>
        </div>` : null}

        ${match.notes ? _h`<div style=${{ background:'rgba(255,255,255,.03)', borderRadius:9, padding:'10px 12px', marginBottom:12 }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Points techniques</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.7)', lineHeight:1.7 }}>${match.notes}</div>
        </div>` : null}

        ${match.videoId ? _h`<div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Démonstration vidéo</div>
          <div style=${{ position:'relative', paddingBottom:'56.25%', height:0, borderRadius:10, overflow:'hidden' }}>
            <iframe
              src=${'https://www.youtube.com/embed/'+match.videoId}
              style=${{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
              allowfullscreen
            ></iframe>
          </div>
        </div>` : match.imageUrl ? _h`<div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Image</div>
          <${ZoomableImage} src=${match.imageUrl} alt=${match.nom} style=${{ width:'100%', height:200, objectFit:'cover', borderRadius:10 }} />
        </div>` : null}
      </div>
    </div>` : null}
  </span>`;
}

function BibliothequeView({ db, setDb, readOnly }) {
  const GROUPES_UNIQUES = [...new Set(BIBLIOTHEQUE_MOUVEMENTS.map(m => {
    const g = m.groupe.split('(')[0].split('/')[0].trim();
    if (g.includes('Quadriceps')) return 'Quadriceps';
    if (g.includes('Ischios') || g.includes('Ischio')) return 'Ischio-jambiers';
    if (g.includes('Fessier')) return 'Fessiers';
    if (g.includes('Mollet') || g.includes('Cheville')) return 'Mollets / Cheville';
    if (g.includes('Dos') || g.includes('Lombaire')) return 'Dos / Lombaires';
    if (g.includes('paule')) return 'Épaules';
    if (g.includes('Pectoral')) return 'Pectoraux';
    if (g.includes('Tricep')) return 'Triceps';
    if (g.includes('Bicep') || g.includes('Brachi')) return 'Biceps';
    if (g.includes('Trap')) return 'Trapèzes';
    if (g.includes('Core') || g.includes('Oblique') || g.includes('Transverse')) return 'Core';
    if (g.includes('Corps') || g.includes('Cha')) return 'Corps entier';
    if (g.includes('Rotateur') || g.includes('Coiffe')) return 'Coiffe rotateurs';
    return g || 'Autre';
  }))].sort();

  const NIVEAU_COLORS = { 'Débutant': '#4CAF50', 'Intermédiaire': '#FFA420', 'Avancé': '#FF4455' };

  const [filtre, setFiltre] = useState('');
  const [filtreGroupe, setFiltreGroupe] = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('');
  const [filtreMedia, setFiltreMedia] = useState(''); // '' | 'video' | 'image' | 'aucun'
  const [expanded, setExpanded] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMvt, setNewMvt] = useState({ nom:'', groupe:'', variante:'', musclesSec:'', materiel:'', niveau:'Débutant', charge:'', objectif:'', notes:'', imageUrl:'', videoUrl:'', cues:'' });
  const [editingLien, setEditingLien] = useState(null); // nom du mouvement dont on corrige le lien
  const [lienForm, setLienForm] = useState({ videoUrl:'', imageUrl:'' });

  // Custom mouvements stored in db
  const customMvts = db.bibliothequeCustom || [];
  // Corrections de lien vidéo/image (ex: vidéo YouTube supprimée) — applicables à N'IMPORTE QUEL
  // mouvement, y compris ceux de la bibliothèque de base qui ne sont pas modifiables directement.
  const overrides = db.bibliothequeOverrides || {};
  function appliquerOverride(m) {
    const ov = overrides[m.nom.trim().toLowerCase()];
    if (!ov) return m;
    return { ...m, videoUrl: ov.videoUrl, videoId: ov.videoId, imageUrl: ov.imageUrl };
  }
  const allMvts = [...BIBLIOTHEQUE_MOUVEMENTS, ...customMvts].map(appliquerOverride);
  // Anti-doublon : cherche si un mouvement équivalent est déjà dans la bibliothèque (nom identique
  // sans accents/casse/ponctuation/pluriel, ou nom quasi identique via la même logique que les fiches).
  const normNom = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').map(w => w.length > 3 ? w.replace(/[sx]$/, '') : w).join(' ');
  function mouvementExistant(nom) {
    const n = normNom(nom);
    if (!n) return null;
    const exact = allMvts.find(m => m && m.nom && normNom(m.nom) === n);
    if (exact) return exact;
    try { return findBiblioMatch(nom) || null; } catch (e) { return null; }
  }

  function ouvrirEditionLien(m) {
    setEditingLien(m.nom);
    setLienForm({ videoUrl: m.videoUrl || '', imageUrl: m.imageUrl || '' });
  }
  function enregistrerLien(m) {
    const vidMatch = lienForm.videoUrl && lienForm.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    const ov = { videoUrl: lienForm.videoUrl || '', videoId: vidMatch ? vidMatch[1] : '', imageUrl: lienForm.imageUrl || '' };
    if (m.custom) {
      // Mouvement perso : on met directement à jour l'entrée elle-même
      setDb(d => ({ ...d, bibliothequeCustom: (d.bibliothequeCustom||[]).map(c => c.id === m.id ? { ...c, videoUrl: ov.videoUrl, videoId: ov.videoId, imageUrl: ov.imageUrl } : c) }));
    } else {
      // Mouvement de base (non modifiable directement) : on stocke une correction à part
      setDb(d => ({ ...d, bibliothequeOverrides: { ...(d.bibliothequeOverrides||{}), [m.nom.trim().toLowerCase()]: ov } }));
    }
    setEditingLien(null);
  }

  // Extraction des images ajoutées "à la volée" sur des exercices dans les séances des joueurs
  // (club + persos), pour repérer celles qui ne sont pas encore dans la bibliothèque partagée.
  const [showExtract, setShowExtract] = useState(false);
  const imagesExtraites = React.useMemo(() => {
    const tousJoueurs = [...(db.playerProfiles||[]), ...(db.playersPerso||[])];
    const vus = new Map(); // nom normalisé -> { nom, imageUrl, nbUtilisations }
    tousJoueurs.forEach(p => {
      (p.muscuSeances||[]).forEach(s => {
        (s.exercices||[]).forEach(ex => {
          if (!ex.imageUrl || !ex.nom || ex.imageAuto) return;
          const key = ex.nom.trim().toLowerCase();
          if (!key) return;
          if (vus.has(key)) { vus.get(key).nbUtilisations++; return; }
          vus.set(key, { nom: ex.nom.trim(), imageUrl: ex.imageUrl, nbUtilisations: 1 });
        });
      });
    });
    // On exclut celles déjà présentes dans la bibliothèque (mouvement de base ou déjà ajoutée)
    const dejaDansBiblio = new Set(allMvts.map(m => m.nom.trim().toLowerCase()));
    return Array.from(vus.values()).filter(v => !dejaDansBiblio.has(v.nom.toLowerCase()) && !mouvementExistant(v.nom)).sort((a,b) => b.nbUtilisations - a.nbUtilisations);
  }, [db.playerProfiles, db.playersPerso, allMvts.length]);

  function ajouterImageExtraite(img) {
    saveCustom({ nom: img.nom, groupe:'', variante:'', musclesSec:'', materiel:'', niveau:'Intermédiaire', charge:'', objectif:'', notes:'Ajouté depuis une image déjà utilisée dans une séance', imageUrl: img.imageUrl, videoUrl:'', cues:'' });
  }
  function ajouterToutesLesImages() {
    if (imagesExtraites.length === 0) return;
    // Anti-doublon : on ne garde que les noms réellement absents (et un seul par nom normalisé)
    const dejaVus = new Set();
    const aAjouter = imagesExtraites.filter(img => { const k = normNom(img.nom); if (!k || dejaVus.has(k) || mouvementExistant(img.nom)) return false; dejaVus.add(k); return true; });
    if (aAjouter.length === 0) { alert('Tout existe déjà dans la bibliothèque — rien à ajouter.'); return; }
    if (!confirm(`Ajouter les ${aAjouter.length} mouvement(s) trouvé(s) à la bibliothèque ?`)) return;
    const entries = aAjouter.map(img => ({
      nom: img.nom, groupe:'', variante:'', musclesSec:'', materiel:'', niveau:'Intermédiaire', charge:'', objectif:'',
      notes:'Ajouté depuis une image déjà utilisée dans une séance', imageUrl: img.imageUrl, videoUrl:'', cues:'',
      id: Date.now() + Math.random(), custom: true,
    }));
    setDb(d => ({ ...d, bibliothequeCustom: [...(d.bibliothequeCustom||[]), ...entries] }));
  }

  const filtered = allMvts.filter(m => {
    const g = m.groupe.split('(')[0].split('/')[0].trim();
    const gNorm = GROUPES_UNIQUES.find(gu => g.includes(gu.split('/')[0].trim().slice(0,5))) || g;
    const matchSearch = !filtre || m.nom.toLowerCase().includes(filtre.toLowerCase()) || m.groupe.toLowerCase().includes(filtre.toLowerCase()) || m.objectif.toLowerCase().includes(filtre.toLowerCase());
    const matchGroupe = !filtreGroupe || m.groupe.toLowerCase().includes(filtreGroupe.toLowerCase().split('/')[0].trim().slice(0,5).toLowerCase());
    const matchNiveau = !filtreNiveau || m.niveau === filtreNiveau;
    const matchMedia = !filtreMedia
      || (filtreMedia === 'video' && !!m.videoId)
      || (filtreMedia === 'image' && !m.videoId && !!m.imageUrl)
      || (filtreMedia === 'aucun' && !m.videoId && !m.imageUrl);
    return matchSearch && matchGroupe && matchNiveau && matchMedia;
  });

  // Repère les mouvements sans aucun média — utile pour retrouver d'un coup d'œil ceux qu'il
  // reste à illustrer/filmer (le filtre "⚠️ Sans média" ci-dessous s'appuie sur ce même calcul).
  const nbSansMedia = allMvts.filter(m => !m.videoId && !m.imageUrl).length;

  function saveCustom(mvt) {
    const doublon = mouvementExistant(mvt.nom);
    if (doublon) { alert('⛔ Déjà dans la bibliothèque : « ' + doublon.nom + ' ».\nImpossible d\'ajouter un doublon — utilise l\'existant (✏️ Corriger le lien pour changer sa vidéo/image).'); return; }
    const entry = { ...mvt, id: Date.now(), custom: true };
    setDb(d => ({ ...d, bibliothequeCustom: [...(d.bibliothequeCustom||[]), entry] }));
    setShowAddForm(false);
    setNewMvt({ nom:'', groupe:'', variante:'', musclesSec:'', materiel:'', niveau:'Débutant', charge:'', objectif:'', notes:'', imageUrl:'', videoUrl:'', cues:'' });
  }

  function deleteCustom(id) {
    if (confirm('Supprimer ce mouvement ?'))
      setDb(d => ({ ...d, bibliothequeCustom: (d.bibliothequeCustom||[]).filter(m => m.id !== id) }));
  }

  return _h`<div style=${{ padding:'16px 0' }}>
    <!-- Header -->
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <div>
        <div style=${{ fontSize:18, fontWeight:800 }}>📚 Bibliothèque</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${allMvts.length} mouvements · ${customMvts.length} personnalisés</div>
      </div>
      ${readOnly ? null : _h`<button class="btn btn-primary btn-sm" onClick=${() => setShowAddForm(true)}>+ Ajouter</button>`}
    </div>

    <!-- Images déjà mises sur des exercices dans les séances, mais pas encore dans la bibliothèque -->
    ${!readOnly && imagesExtraites.length > 0 ? _h`<div class="card" style=${{ marginBottom:14, border:'1px solid rgba(56,189,248,.25)' }}>
      <div onClick=${() => setShowExtract(v => !v)} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}>
        <div style=${{ fontSize:12, fontWeight:800, color:'#38BDF8' }}>🖼️ ${imagesExtraites.length} image${imagesExtraites.length>1?'s':''} trouvée${imagesExtraites.length>1?'s':''} dans tes séances</div>
        <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${showExtract ? '▲ Masquer' : '▼ Voir'}</span>
      </div>
      ${!showExtract ? _h`<div style=${{ fontSize:10.5, color:'rgba(255,255,255,.35)', marginTop:4 }}>Des exercices auxquels tu as mis une image directement dans une séance, mais qui ne sont pas encore dans la bibliothèque.</div>` : null}
      ${showExtract ? _h`<div style=${{ marginTop:12 }}>
        <div style=${{ fontSize:10.5, color:'rgba(255,255,255,.4)', marginBottom:10 }}>Trouvées dans les séances de tes joueurs (club + persos) — classées par nombre d'utilisations. Ajoute celles qui valent le coup à la bibliothèque partagée.</div>
        <button class="btn btn-primary btn-sm" style=${{ width:'100%', marginBottom:10 }} onClick=${ajouterToutesLesImages}>+ Tout ajouter (${imagesExtraites.length})</button>
        <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
          ${imagesExtraites.map(img => _h`<div key=${img.nom} style=${{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'8px 10px' }}>
            <img src=${img.imageUrl} alt=${img.nom} style=${{ width:44, height:44, objectFit:'cover', borderRadius:7, border:'1px solid rgba(255,255,255,.1)', flexShrink:0 }} onError=${e => e.target.style.opacity='0.15'} />
            <div style=${{ flex:1, minWidth:0 }}>
              <div style=${{ fontSize:12.5, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>${img.nom}</div>
              <div style=${{ fontSize:9.5, color:'rgba(255,255,255,.35)' }}>Utilisée dans ${img.nbUtilisations} séance${img.nbUtilisations>1?'s':''}</div>
            </div>
            <button class="btn btn-sm" style=${{ flexShrink:0, background:'rgba(56,189,248,.12)', border:'1px solid rgba(56,189,248,.4)', color:'#38BDF8', fontWeight:700 }}
              onClick=${() => ajouterImageExtraite(img)}>+ Ajouter</button>
          </div>`)}
        </div>
      </div>` : null}
    </div>` : null}

    <!-- Filtres -->
    <div style=${{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
      <input class="inp" value=${filtre} onInput=${e => setFiltre(e.target.value)}
        placeholder="🔍 Rechercher un mouvement..." style=${{ fontSize:13 }}/>
      <div style=${{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
        <button onClick=${() => setFiltreGroupe('')}
          style=${{ flexShrink:0, padding:'5px 12px', borderRadius:20, border:'1px solid '+(filtreGroupe===''?'#FFA420':'rgba(255,255,255,.1)'),
            background:filtreGroupe===''?'rgba(255,164,32,.15)':'rgba(255,255,255,.04)', color:filtreGroupe===''?'#FFA420':'rgba(255,255,255,.4)',
            cursor:'pointer', fontSize:11, fontWeight:filtreGroupe===''?800:400, whiteSpace:'nowrap' }}>Tous</button>
        ${GROUPES_UNIQUES.map(g => _h`<button key=${g} onClick=${() => setFiltreGroupe(filtreGroupe===g?'':g)}
          style=${{ flexShrink:0, padding:'5px 12px', borderRadius:20, border:'1px solid '+(filtreGroupe===g?'#FFA420':'rgba(255,255,255,.1)'),
            background:filtreGroupe===g?'rgba(255,164,32,.15)':'rgba(255,255,255,.04)', color:filtreGroupe===g?'#FFA420':'rgba(255,255,255,.4)',
            cursor:'pointer', fontSize:11, fontWeight:filtreGroupe===g?800:400, whiteSpace:'nowrap' }}>${g}</button>`)}
      </div>
      <div style=${{ display:'flex', gap:6 }}>
        ${['','Débutant','Intermédiaire','Avancé'].map(n => _h`<button key=${n} onClick=${() => setFiltreNiveau(n)}
          style=${{ flex:1, padding:'5px', borderRadius:8, border:'1px solid '+(filtreNiveau===n?(NIVEAU_COLORS[n]||'#FFA420'):'rgba(255,255,255,.08)'),
            background:filtreNiveau===n?(NIVEAU_COLORS[n]||'#FFA420')+'15':'rgba(255,255,255,.03)',
            color:filtreNiveau===n?(NIVEAU_COLORS[n]||'#FFA420'):'rgba(255,255,255,.4)',
            cursor:'pointer', fontSize:11, fontWeight:filtreNiveau===n?700:400 }}>${n||'Tous niveaux'}</button>`)}
      </div>
      <!-- Filtre média : vidéo / image / sans média — pour retrouver vite ce qui manque d'illustration -->
      <div style=${{ display:'flex', gap:6 }}>
        ${[
          { key:'', label:'Tous', col:'#FFA420' },
          { key:'video', label:'🎥 Avec vidéo', col:'#FF4455' },
          { key:'image', label:'🖼️ Avec image', col:'#38BDF8' },
          { key:'aucun', label:'⚠️ Sans média'+(nbSansMedia?' ('+nbSansMedia+')':''), col:'#FFB800' },
        ].map(opt => _h`<button key=${opt.key} onClick=${() => setFiltreMedia(filtreMedia===opt.key?'':opt.key)}
          style=${{ flex:1, padding:'5px 4px', borderRadius:8, border:'1px solid '+(filtreMedia===opt.key?opt.col:'rgba(255,255,255,.08)'),
            background:filtreMedia===opt.key?opt.col+'15':'rgba(255,255,255,.03)',
            color:filtreMedia===opt.key?opt.col:'rgba(255,255,255,.4)',
            cursor:'pointer', fontSize:10.5, fontWeight:filtreMedia===opt.key?700:400, whiteSpace:'nowrap' }}>${opt.label}</button>`)}
      </div>
    </div>

    <!-- Résultats -->
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:8 }}>${filtered.length} résultat${filtered.length>1?'s':''}</div>

    <!-- Liste mouvements -->
    <div>
      ${filtered.map((m, i) => {
        const isOpen = expanded === i;
        const nc = NIVEAU_COLORS[m.niveau] || '#FFA420';
        return _h`<div key=${i} style=${{ background:isOpen?'rgba(255,164,32,.04)':'rgba(255,255,255,.025)',
          border:'1px solid '+(isOpen?'rgba(255,164,32,.25)':'rgba(255,255,255,.07)'),
          borderRadius:12, marginBottom:7, overflow:'hidden', transition:'all .15s' }}>
          <!-- Header -->
          <div style=${{ padding:'11px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
            onClick=${() => setExpanded(isOpen ? null : i)}>
            <div style=${{ display:'flex', gap:10, alignItems:'center', flex:1, minWidth:0 }}>
              ${m.videoId ? _h`<div style=${{ width:36, height:36, borderRadius:6, background:'#FF0000', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>▶</div>`
              : m.imageUrl ? _h`<img src=${m.imageUrl} style=${{ width:36, height:36, objectFit:'cover', borderRadius:6, flexShrink:0, border:'1px solid rgba(255,255,255,.1)' }} onError=${e => e.target.style.display='none'} />` : null}
              <div style=${{ minWidth:0 }}>
                <div style=${{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  ${m.nom}
                  ${m.custom ? _h`<span style=${{ fontSize:9, padding:'1px 5px', borderRadius:10, background:'rgba(56,189,248,.15)', color:'#38BDF8' }}>perso</span>` : null}
                </div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>${m.groupe}</div>
              </div>
            </div>
            <div style=${{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
              ${!m.videoId && !m.imageUrl ? _h`<span title="Aucun média" style=${{ fontSize:10, padding:'2px 7px', borderRadius:20, background:'rgba(255,184,0,.12)', color:'#FFB800', fontWeight:700 }}>⚠️</span>` : null}
              <span style=${{ fontSize:10, padding:'2px 7px', borderRadius:20, background:nc+'15', color:nc, fontWeight:700 }}>${m.niveau}</span>
              <span style=${{ color:'rgba(255,255,255,.3)', fontSize:12 }}>${isOpen?'▲':'▼'}</span>
            </div>
          </div>
          <!-- Détail -->
          ${isOpen ? _h`<div style=${{ padding:'0 14px 14px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            ${m.videoId ? _h`<div style=${{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:10, marginTop:10, marginBottom:10, background:'#000' }}>
              <iframe
                src=${'https://www.youtube.com/embed/'+m.videoId+'?rel=0&modestbranding=1'}
                style=${{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen=${true}
              ></iframe>
            </div>` : m.imageUrl ? _h`<${ZoomableImage} src=${m.imageUrl} alt=${m.nom} style=${{ width:'100%', height:200, objectFit:'contain', borderRadius:8, marginBottom:10, marginTop:10, background:'rgba(255,255,255,.04)' }} />` : null}
            <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
              ${m.variante ? _h`<div style=${{ gridColumn:'1/-1', background:'rgba(255,255,255,.04)', borderRadius:8, padding:'7px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Variante</div>
                <div style=${{ fontSize:12 }}>${m.variante}</div>
              </div>` : null}
              <div style=${{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'7px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Muscles sec.</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.6)' }}>${m.musclesSec||'—'}</div>
              </div>
              <div style=${{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'7px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Matériel</div>
                <div style=${{ fontSize:11 }}>${m.materiel||'—'}</div>
              </div>
              <div style=${{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'7px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Type charge</div>
                <div style=${{ fontSize:11 }}>${m.charge||'—'}</div>
              </div>
              <div style=${{ background:'rgba(255,164,32,.08)', borderRadius:8, padding:'7px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Objectif</div>
                <div style=${{ fontSize:11, color:'#FFA420', fontWeight:600 }}>${m.objectif||'—'}</div>
              </div>
            </div>
            ${m.notes ? _h`<div style=${{ marginTop:8, background:'rgba(56,189,248,.06)', borderRadius:8, padding:'7px 10px', fontSize:11, color:'rgba(255,255,255,.6)', lineHeight:1.6 }}>
              💡 ${m.notes}
            </div>` : null}
            ${!readOnly && editingLien === m.nom ? _h`<div style=${{ marginTop:10, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,164,32,.25)', borderRadius:10, padding:10 }}>
              <div class="lbl">Lien vidéo YouTube</div>
              <input class="inp" value=${lienForm.videoUrl} onInput=${e => setLienForm(f=>({...f, videoUrl:e.target.value}))} placeholder="https://youtu.be/..." style=${{ marginBottom:8 }}/>
              <div class="lbl">Ou lien image</div>
              <input class="inp" value=${lienForm.imageUrl} onInput=${e => setLienForm(f=>({...f, imageUrl:e.target.value}))} placeholder="https://..."/>
              <div style=${{ display:'flex', gap:8, marginTop:10 }}>
                <button class="btn btn-primary btn-sm" onClick=${() => enregistrerLien(m)}>Enregistrer</button>
                <button class="btn btn-sm" onClick=${() => setEditingLien(null)}>Annuler</button>
              </div>
            </div>` : null}
            ${readOnly ? null : _h`<div style=${{ display:'flex', gap:8, marginTop:10 }}>
              ${editingLien !== m.nom ? _h`<button class="btn btn-sm" onClick=${() => ouvrirEditionLien(m)}>✏️ Corriger le lien</button>` : null}
              ${m.custom ? _h`<button class="btn btn-sm btn-danger" onClick=${() => deleteCustom(m.id)}>🗑 Supprimer</button>` : null}
            </div>`}
          </div>` : null}
        </div>`;
      })}
    </div>

    <!-- Modal ajout -->
    ${!readOnly && showAddForm && _h`<div class="edit-modal-bg" onClick=${() => setShowAddForm(false)}>
      <div class="edit-modal" style=${{ maxWidth:480 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>+ Nouveau mouvement</div>
          <button onClick=${() => setShowAddForm(false)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style=${{ padding:'16px 20px', overflowY:'auto', maxHeight:'65vh', display:'flex', flexDirection:'column', gap:12 }}>
          <div><div class="lbl">Nom du mouvement *</div>
            <input class="inp" value=${newMvt.nom} onInput=${e => setNewMvt(m=>({...m,nom:e.target.value}))} placeholder="Ex: Bulgarian Split Squat"/>
            ${(() => { const d = newMvt.nom && newMvt.nom.trim().length > 2 ? mouvementExistant(newMvt.nom) : null; return d ? _h`<div style=${{ marginTop:6, fontSize:11, color:'#FF4455', fontWeight:700 }}>⛔ Existe déjà : « ${d.nom} » — ajout impossible</div>` : null; })()}
          </div>
          <div><div class="lbl">Groupe musculaire *</div>
            <input class="inp" value=${newMvt.groupe} onInput=${e => setNewMvt(m=>({...m,groupe:e.target.value}))} placeholder="Ex: Quadriceps"/>
          </div>
          <div><div class="lbl">Variante / Description</div>
            <input class="inp" value=${newMvt.variante} onInput=${e => setNewMvt(m=>({...m,variante:e.target.value}))} placeholder="Ex: Avec haltères"/>
          </div>
          <div><div class="lbl">Muscles secondaires</div>
            <input class="inp" value=${newMvt.musclesSec} onInput=${e => setNewMvt(m=>({...m,musclesSec:e.target.value}))} placeholder="Ex: Fessiers, Core"/>
          </div>
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><div class="lbl">Matériel</div>
              <input class="inp" value=${newMvt.materiel} onInput=${e => setNewMvt(m=>({...m,materiel:e.target.value}))} placeholder="Ex: Haltères"/>
            </div>
            <div><div class="lbl">Niveau</div>
              <select class="inp" value=${newMvt.niveau} onChange=${e => setNewMvt(m=>({...m,niveau:e.target.value}))}>
                <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
              </select>
            </div>
          </div>
          <div><div class="lbl">Type de charge</div>
            <input class="inp" value=${newMvt.charge} onInput=${e => setNewMvt(m=>({...m,charge:e.target.value}))} placeholder="Ex: Barre, Haltères, Élastique"/>
          </div>
          <div><div class="lbl">Objectif</div>
            <input class="inp" value=${newMvt.objectif} onInput=${e => setNewMvt(m=>({...m,objectif:e.target.value}))} placeholder="Ex: Force / Volume"/>
          </div>
          <div><div class="lbl">Notes / Points clés</div>
            <textarea class="inp" value=${newMvt.notes} onInput=${e => setNewMvt(m=>({...m,notes:e.target.value}))} placeholder="Consignes techniques..." style=${{ minHeight:60, resize:'vertical' }}></textarea>
          </div>
          <div><div class="lbl">🎬 Lien vidéo YouTube (optionnel)</div>
            <input class="inp" value=${newMvt.videoUrl||''} onInput=${e => {
              const url = e.target.value;
              const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
              setNewMvt(m=>({...m, videoUrl:url, videoId: match ? match[1] : ''}));
            }} placeholder="https://youtu.be/... ou https://youtube.com/watch?v=..."/>
            ${newMvt.videoId ? _h`<div style=${{ marginTop:6, borderRadius:8, overflow:'hidden', background:'#000' }}>
              <img src=${'https://img.youtube.com/vi/'+newMvt.videoId+'/hqdefault.jpg'} style=${{ width:'100%', maxHeight:120, objectFit:'cover' }} />
            </div>` : null}
          </div>
          <div><div class="lbl">📋 Points clés techniques (cues)</div>
            <textarea class="inp" value=${newMvt.cues||''} onInput=${e => setNewMvt(m=>({...m,cues:e.target.value}))} placeholder="Ex: • Genoux dans l'axe des orteils&#10;• Gainage actif&#10;• Regard devant" style=${{ minHeight:80, resize:'vertical' }}></textarea>
          </div>
          <div><div class="lbl">🖼 Image URL (optionnel)</div>
            <input class="inp" value=${newMvt.imageUrl} onInput=${e => setNewMvt(m=>({...m,imageUrl:e.target.value}))} placeholder="https://... GIF ou photo"/>
            ${newMvt.imageUrl ? _h`<img src=${newMvt.imageUrl} style=${{ width:'100%', maxHeight:120, objectFit:'contain', borderRadius:8, marginTop:6, background:'rgba(255,255,255,.03)' }} onError=${e => e.target.style.display='none'} />` : null}
          </div>
        </div>
        <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${() => setShowAddForm(false)}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} disabled=${!!(newMvt.nom && mouvementExistant(newMvt.nom))} onClick=${() => newMvt.nom && saveCustom(newMvt)}>Enregistrer</button>
        </div>
      </div>
    </div>`}
  </div>`;
}
