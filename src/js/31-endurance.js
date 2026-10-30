


// ── ENDURANCE VIEW ────────────────────────────────────────────────────────────────────────────────
// ── FONCTION GLOBALE VMA ──────────────────────────────────────────────────────
function getPlayerVMA(player) {
  if (!player) return null;
  // Extraire la VMA d'un résultat de test selon son type
  function extractVMA(t) {
    // 30-15 IFT → vitesse_finale (VIFT)
    if (t.vitesse_finale && parseFloat(t.vitesse_finale) > 0) return parseFloat(t.vitesse_finale);
    // VAMEVAL → vma (saisie directe)
    if (t.vma && parseFloat(t.vma) > 0) return parseFloat(t.vma);
    // Demi-Cooper → distance / 100
    if (t.distance && parseFloat(t.distance) > 0) return Math.round(parseFloat(t.distance) / 100 * 10) / 10;
    // Luc & Léger → palier * 0.5 + 7
    if (t.palier && parseFloat(t.palier) > 0) return Math.round((parseFloat(t.palier) * 0.5 + 7.0 + (parseFloat(t.navettes)||0) * 0.05) * 10) / 10;
    // Champ générique vmaFinal (legacy)
    if (t.vmaFinal && parseFloat(t.vmaFinal) > 0) return parseFloat(t.vmaFinal);
    return null;
  }
  // Chercher dans testsEndurance (tous types)
  const endTests = (player.testsEndurance || []).map(t => ({ t, vma: extractVMA(t) })).filter(x => x.vma);
  if (endTests.length) return endTests[endTests.length-1].vma;
  // Chercher dans tests généraux (player.tests — tous types)
  const genTests = (player.tests || []).map(t => ({ t, vma: extractVMA(t) })).filter(x => x.vma);
  if (genTests.length) return genTests[genTests.length-1].vma;
  return null;
}

// Calcule les allures d'une séance endurance depuis la VMA du joueur
function calcAlluRes(vma, pctMin, pctMax) {
  if (!vma) return null;
  const vMin = Math.round(vma * pctMin / 100 * 10) / 10;
  const vMax = Math.round(vma * pctMax / 100 * 10) / 10;
  const toMinKm = v => {
    const secPerKm = Math.round(3600 / v);
    return Math.floor(secPerKm / 60) + 'min' + String(secPerKm % 60).padStart(2, '0') + '/km';
  };
  return { vMin, vMax, paceMin: toMinKm(vMax), paceMax: toMinKm(vMin) };
}

const TYPES_CARDIO = [
  // ---- COURSE A PIED ----
  {
    id: "continu_ext", label: "Continu extensif", color: "#38BDF8", icon: "🏃", modalite: "course",
    desc: "70-75% FCmax - 30-60min - Aerobie base",
    protocole: {
      objectif: "Developper la base aerobie. Seuil de confort. Recup active haute.",
      intensite: "70-75% FCmax. Conversation possible. Jamais essoufle.",
      structure: [
        { phase: "Echauffement", duree: "10 min", detail: "Marche rapide puis trot leger. FC < 65% FCmax." },
        { phase: "Corps de seance", duree: "30-50 min", detail: "Allure reguliere. FC stable entre 70-75% FCmax. Respiration nasale si possible." },
        { phase: "Retour au calme", duree: "5-10 min", detail: "Reduction progressive de la vitesse. Etirements doux." },
      ],
      allures: "Pour VMA 16 km/h : allure 11.2-12 km/h soit 5min/km a 5min20/km",
      notes: "Seance de base, 2x/semaine en PPG. Peut etre remplacee par velo si blessure membre inf.",
    },
  },
  {
    id: "continu_int", label: "Continu intensif", color: "#4CAF50", icon: "⚡", modalite: "course",
    desc: "80-85% FCmax - 20-40min - Seuil anaerobie",
    protocole: {
      objectif: "Repousser le seuil lactique. Develop capacite a maintenir haute intensite longtemps.",
      intensite: "80-85% FCmax. Conversation difficile. Essouflement maitrise.",
      structure: [
        { phase: "Echauffement", duree: "15 min", detail: "10 min trot leger puis 5 min en acceleration progressive jusqu a 80% FCmax." },
        { phase: "Corps de seance", duree: "20-35 min", detail: "Allure soutenue, reguliere. FC entre 80-85%. Pas de pic. Effort constant." },
        { phase: "Retour au calme", duree: "10 min", detail: "Deceleration progressive sur 5 min. 5 min marche active." },
      ],
      allures: "Pour VMA 16 km/h : allure 12.8-13.6 km/h soit 4min25 a 4min42/km",
      notes: "1x/semaine maximum en periode de competition. Repousser si fatigue > 6/10.",
    },
  },
  {
    id: "interval", label: "Intervalles VMA", color: "#FFA420", icon: "🔄", modalite: "course",
    desc: "Repetitions avec recuperation - 90-100% VMA - VO2max",
    protocole: {
      objectif: "Augmenter la VMA et la puissance aerobie maximale.",
      intensite: "90-100% VMA selon le format. Effort maximal sur chaque repetition.",
      structure: [
        { phase: "Echauffement", duree: "15 min", detail: "Trot leger 10 min + 3x100m progressifs + 2 min repos. Jambes prete pour les efforts." },
        { phase: "Series", duree: "Variable", detail: "Voir formats ci-dessous. Recuperation = marche ou trot tres lent." },
        { phase: "Retour au calme", duree: "10 min", detail: "Trot leger 5-7 min puis marche. Etirements membres inferieurs." },
      ],
      formats_detail: [
        { nom: "30/30", travail: "30s @ 100-105% VMA", repos: "30s trot", series: "10-15 reps", note: "Format le plus handball. 3 blocs de 5 reps avec 3 min entre blocs." },
        { nom: "1min/1min", travail: "1min @ 100% VMA", repos: "1min trot", series: "8-10 reps", note: "Intensite soutenue. Ne pas partir trop vite sur les premieres." },
        { nom: "2min/1min", travail: "2min @ 90-95% VMA", repos: "1min marche", series: "5-6 reps", note: "Travail plus long au seuil. Bonne base VMA requise." },
        { nom: "3min/3min", travail: "3min @ 95-100% VMA", repos: "3min trot", series: "4-5 reps", note: "Format puissant. Epuisant. 1x/semaine max." },
        { nom: "10-20-30", travail: "10s max, 20s moyen, 30s lent (boucle 1 min)", repos: "2 min entre blocs", series: "3-4 blocs de 5 reps", note: "Format nordique. Tres efficace. Moins ennuyeux que le 30/30 classique." },
      ],
      allures: "Pour VMA 16 km/h : 100% VMA = 16 km/h soit 3min45/km. 105% = 16.8 km/h.",
      notes: "1-2x/semaine en PPG. 1x/semaine max en PPS. Jamais 48h avant match.",
    },
  },
  {
    id: "fractionne", label: "Fractionne court (PAM)", color: "#FF7A00", icon: "💨", modalite: "course",
    desc: "10-30s effort - Puissance maximale aerobie",
    protocole: {
      objectif: "Developper la puissance aerobie et la capacite a repeter des efforts courts intenses. Cle du handball.",
      intensite: "> 100% VMA. Effort quasi-maximal. Vitesse de sprint.",
      structure: [
        { phase: "Echauffement", duree: "20 min", detail: "15 min trot + gammes (talons-fesses, montees de genoux, bonds) + 4x50m progressifs jusqu a 90%. Articulaire complet." },
        { phase: "Series", duree: "Variable", detail: "Voir formats. Recuperation longue (ratio 1:3 a 1:6). Qualite > quantite absolue." },
        { phase: "Retour au calme", duree: "10 min", detail: "Trot tres lent 7 min. Etirements quadriceps, ischio, soleo." },
      ],
      formats_detail: [
        { nom: "10/50", travail: "10s sprint max", repos: "50s marche", series: "10-15 reps", note: "Format handball direct. Court mais 100% effort." },
        { nom: "15/45", travail: "15s sprint 110% VMA", repos: "45s marche", series: "10-12 reps", note: "Format idealement pour les ailiers et pivots (accel courtes)." },
        { nom: "20/40", travail: "20s @ 110% VMA", repos: "40s trot lent", series: "8-10 reps", note: "Transition vers 30/30. Intensite elevee." },
        { nom: "30/90", travail: "30s sprint 110% VMA", repos: "90s marche", series: "6-8 reps", note: "Recuperation longue pour maintenir la qualite des sprints." },
      ],
      allures: "110% VMA pour VMA 16 km/h = 17.6 km/h. Ressenti : sprint soutenu.",
      notes: "Jamais en PPG debut sans base aerobie. Introduire progressivement. Eviter sur surface dure.",
    },
  },
  {
    id: "spl", label: "SPL (Specifique Handball)", color: "#7C6FFF", icon: "🏐", modalite: "course",
    desc: "Courses handball - Changements de direction - Specifique",
    protocole: {
      objectif: "Transfert physiologique vers le handball. Sprints, changements de direction, arrets, departs. Sollicite les memes filières qu en match.",
      intensite: "Variable : 70-100% selon la phase. FC max en sprint, basse en deplacement.",
      structure: [
        { phase: "Echauffement", duree: "15 min", detail: "Activation specifique handball : shuffles lateraux, cross-steps, gammes defensives, 3 min relance ballon." },
        { phase: "Blocs de travail", duree: "20-30 min", detail: "Voir formats. Travail avec ou sans balle. Recuperation passive ou active." },
        { phase: "Retour au calme", duree: "10 min", detail: "Trot tres leger. Etirements globaux. Peut inclure travail mental." },
      ],
      formats_detail: [
        { nom: "Navette 15m", travail: "15m aller-retour x10 @ max", repos: "45s", series: "5-6 blocs de 10 navettes", note: "Test d endurance specifique handball. Mesure repetition effort." },
        { nom: "Triangle defensif", travail: "Sprint 5m + shuffle 5m + backpedal 5m", repos: "30s", series: "12-15 reps", note: "Simule deplacement defensif en zone. Travailler le timing." },
        { nom: "Action aleatoire", travail: "30s de jeu intensif (signal coach)", repos: "30s", series: "8-10 reps", note: "Coach donne signal. Joueur reagit : sprint, arret, passe, jump." },
        { nom: "Serie attaque-defense", travail: "2min jeu intensif (7c7 ou 4c4)", repos: "2min", series: "4-6 series", note: "Reel jeu. Haute intensite obligatoire. Comptage score." },
      ],
      notes: "Remplace le travail interval classique en PPS. 1-2x/semaine. Adapter selon charge de matchs.",
    },
  },
  {
    id: "recup_active", label: "Recuperation active", color: "rgba(255,255,255,.4)", icon: "🧘", modalite: "both",
    desc: "< 65% FCmax - Regeneration - Lendemain de match",
    protocole: {
      objectif: "Eliminer les metabolites. Reduire les courbatures. Preparer la seance suivante. Ne PAS fatiguer.",
      intensite: "< 65% FCmax. Totalement confortable. Conversation facile.",
      structure: [
        { phase: "Seance entiere", duree: "20-30 min", detail: "Trot tres leger OU velo sans resistance OU natation. FC < 65% en permanence. Arreter si douleur." },
      ],
      notes: "Lendemain de match ou apres seance tres intense. Optionnel mais benefique. Velo recommande pour proteger les jambes.",
    },
  },
  {
    id: "piste_fond", label: "Endurance fondamentale (piste)", color: "#22D3EE", icon: "🏟️", modalite: "course",
    desc: "Travail en allures sur piste - 800m / 400m / 200m",
    protocole: {
      objectif: "Développer l'endurance fondamentale par séries d'allures ciblées. Apprentissage de la gestion de l'effort sur distance. Directement transférable en présaison handball.",
      intensite: "Variable selon la distance : 800m @ 75-85% VMA, 400m @ 85-95% VMA, 200m @ 95-105% VMA.",
      structure: [
        { phase: "Échauffement", duree: "15 min", detail: "2-3 tours de piste en trot + gammes + 2×80m progressifs. Cheville, hanche, épaules." },
        { phase: "Corps de séance", duree: "Variable", detail: "Voir formats ci-dessous. Récupération entre les efforts selon distance." },
        { phase: "Retour au calme", duree: "10 min", detail: "2 tours en footing très lent. Étirements quadri, ischio, mollets." },
      ],
      formats_detail: [
        { nom: "3×800m", travail: "800m @ 75-80% VMA (allure régulière)", repos: "Récup 2min30 marche active", series: "3-4 reps", note: "Séance de base préparation." },
        { nom: "5×400m", travail: "400m @ 90-95% VMA", repos: "Récup 90s marche", series: "5-8 reps", note: "Travail seuil lactique." },
        { nom: "8×200m", travail: "200m @ 100-105% VMA", repos: "Récup 1min30 marche", series: "8-12 reps", note: "Travail vitesse-endurance." },
        { nom: "Pyramide 200-400-800-400-200", travail: "Enchainement croissant puis décroissant", repos: "Récup proportionnelle à la distance", series: "2-3 pyramides", note: "Séance complète. Variété = motivation. Gestion de l'effort sur plusieurs allures." },
        { nom: "Séance mixte 800+400+200", travail: "1×800m + 2×400m + 4×200m", repos: "3min après le 800m, 90s après les 400m, 1min après les 200m", series: "1-2 fois", note: "Séance de piste complète. Adapté fin PPG / début PPS." },
      ],
      allures: "Allures calculées automatiquement selon la VMA de chaque joueur (voir 'Allures cibles' sur sa séance).",
      notes: "Séance piste 1x/semaine en PPG. Monter à 2x en PPS si bonne récupération. Surface souple recommandée.",
    },
  },
  {
    id: "anaerobie_lactique", label: "Anaérobie lactique", color: "#FF4455", icon: "🔥", modalite: "course",
    desc: "20-120s effort maximal - Tolérance lactique - Présaison handball",
    protocole: {
      objectif: "Développer la tolérance à l'acide lactique et la capacité à répéter des efforts maximaux. Filière clé pour les actions décisives en handball (contre-attaque, défense à tout prix).",
      intensite: "> 95% FCmax. Douleur musculaire normale. Sensation de jambes lourdes recherchée.",
      structure: [
        { phase: "Échauffement", duree: "20 min", detail: "Jogging 10 min + gammes athlétiques + 3×60m progressifs jusqu'à 90%. Articulaire complet. Ne pas négliger." },
        { phase: "Corps de séance", duree: "20-30 min", detail: "Efforts maximaux. Récupération longue pour tolérance (ratio 1:3 à 1:5). Qualité prioritaire." },
        { phase: "Retour au calme", duree: "10-15 min", detail: "Footing très lent 10 min. Drainage actif. Étirements doux. Hydratation++." },
      ],
      formats_detail: [
        { nom: "3×300m", travail: "300m sprint @ max", repos: "Récup 5min marche", series: "3-4 reps", note: "Séance lactique par excellence. Douleur quadri garantie. Récup complète obligatoire entre les reps." },
        { nom: "Séries 6×100m", travail: "100m sprint @ 100%", repos: "Récup 90s", series: "3-4 séries avec 5min entre séries", note: "Accumulation lactique progressive. Travailler à garder la technique malgré la fatigue." },
        { nom: "40-20 lactique", travail: "40s sprint + 20s repos × 6", repos: "5min entre blocs", series: "3-4 blocs", note: "Format court, lactique intense. Adapté terrain d'entraînement handball." },
        { nom: "Côtes 8×60m", travail: "60m en montée @ max", repos: "Récup 2min (descente marchée)", series: "8-10 reps", note: "Alternative aux pistes. Protège les ischio. Renforcement PL. À privilégier en début de présaison." },
      ],
      allures: "Pas d'allure cible — effort subjectif maximal sur chaque répétition. Se baser sur le chrono de la 1ère rep.",
      notes: "Maximum 1x/semaine. Jamais 48h avant match. Introduire progressivement. Pas avant 3 semaines de base aérobie.",
    },
  },
  {
    id: "anaerobie_alactique", label: "Anaérobie alactique (vitesse)", color: "#FFB800", icon: "⚡", modalite: "course",
    desc: "< 10s - Vitesse maximale - Filière phosphocréatine",
    protocole: {
      objectif: "Développer la vitesse maximale et la puissance explosive. Filière phosphocréatine. Actions type contre-attaque, duel 1v1, sprint sur 15-30m en handball.",
      intensite: "100% effort. Récupération COMPLÈTE obligatoire (3-5min). Qualité > quantité absolue.",
      structure: [
        { phase: "Échauffement", duree: "25 min", detail: "Jogging 10 min + gammes techniques (talons-fesses, montées de genoux, bonds, skipping) + 4×30m progressifs jusqu'à 90%. Corps chaud obligatoire avant sprints max." },
        { phase: "Corps de séance", duree: "20-25 min", detail: "Sprints < 10s. Récupération 3-5min COMPLÈTE (marche). Pas de compromis sur la récup : si pas de récup → pas de vitesse max → inutile." },
        { phase: "Retour au calme", duree: "10 min", detail: "Marche 5 min. Étirements passifs quadri, ischio, fessiers, mollets. Rouleau si disponible." },
      ],
      formats_detail: [
        { nom: "8×30m départ arrêté", travail: "30m sprint max depuis position statique", repos: "Récup 3-4min complète", series: "8-10 reps", note: "Format de base. Départ arrêté = demande explosive. Chronométrer chaque sprint." },
        { nom: "6×20m départ lancé", travail: "20m sprint @ max (arrivée dans un élan)", repos: "Récup 3min", series: "6-8 reps", note: "Travail vitesse pure. Départ lancé = on cherche la VMax. Moins fatiguant que départ arrêté." },
        { nom: "Accélérations 10-20-30", travail: "10m accélération → 20m maintien → 30m décélération", repos: "Récup 4min", series: "6-8 reps", note: "Séance complète : accél + VMax + décélération. Profil de vitesse complet." },
        { nom: "Sprints réactifs", travail: "Sprint 15m sur signal (son/visuel)", repos: "Récup 3min", series: "8-10 reps", note: "Temps de réaction + vitesse. Spécifique handball. Varier les stimuli (clap, ballon lâché, signal)." },
      ],
      allures: "Objectif : atteindre VMax (sprint max perso). Pour un handballeur N1 : ~7-8s/60m, ~3.5-4s/30m.",
      notes: "1x/semaine en PPG, intégrer en fin de séance muscu ou seul. Jamais fatigué. Jamais 48h avant match. Qualité > tout.",
    },
  },
  {
    id: "capacite_aerobie", label: "Capacité aérobie (seuil)", color: "#10B981", icon: "🌬️", modalite: "course",
    desc: "85-90% FCmax - 15-25min - Travail au seuil anaérobie",
    protocole: {
      objectif: "Repousser le seuil anaérobie. Augmenter la vitesse à laquelle on peut maintenir un effort sans s'acidifier. Clé pour la performance en handball de haut niveau.",
      intensite: "85-90% FCmax. Effort contrôlé mais difficile. 2-3 mots max entre deux souffles.",
      structure: [
        { phase: "Échauffement", duree: "15 min", detail: "10 min footing + 5 min en accélération progressive vers 80% FCmax." },
        { phase: "Corps de séance", duree: "15-25 min continu ou en blocs", detail: "Maintien de l'allure seuil. FC stable entre 85-90%. Ne pas dépasser." },
        { phase: "Retour au calme", duree: "10 min", detail: "Décélération progressive 5 min. Marche 5 min. Étirements." },
      ],
      formats_detail: [
        { nom: "20 min continu", travail: "20 min @ 85-88% FCmax", repos: "—", series: "1 effort", note: "Séance de référence. Simple à mettre en place. Chronométrer et garder FC stable." },
        { nom: "3×8 min", travail: "8 min @ 88-90% FCmax", repos: "Récup 3min trot", series: "3 blocs", note: "Version fractionnée du seuil. Plus gérable mentalement. Même bénéfice physiologique." },
        { nom: "Tempo run", travail: "5 km @ allure seuil", repos: "—", series: "1 effort", note: "Standard course à pied." },
      ],
      allures: "Allure seuil ≈ 80-85% VMA — calculée automatiquement selon la VMA de chaque joueur.",
      notes: "1x/semaine en PPG-PPS. Séance difficile mentalement — prévoir musique ou partenaire. Éviter si fatigue > 6/10.",
    },
  },
  // ---- VELO ----
  {
    id: "velo_continu_ext", label: "Velo - Continu extensif", color: "#38BDF8", icon: "🚴", modalite: "velo",
    desc: "65-70% FCmax - 45-90min - Endurance fondamentale",
    protocole: {
      objectif: "Base aerobie. Developpement capillaire. Recuperation active intense.",
      intensite: "65-70% FCmax. Cadence 85-95 RPM. Resistance legere a moderee.",
      structure: [
        { phase: "Mise en route", duree: "10 min", detail: "Cadence libre 70-80 RPM, resistance tres faible. FC < 60%." },
        { phase: "Corps de seance", duree: "35-70 min", detail: "Cadence 85-95 RPM reguliere. FC stable 65-70%. Plateau ou cote legere." },
        { phase: "Retour au calme", duree: "5-10 min", detail: "Reduire resistance progressive. Rouler en aisance." },
      ],
      notes: "Equivalent velo du footing extensif. Ideal PPG, jour de recup ou blessure MI. Peut monter a 90 min.",
    },
  },
  {
    id: "velo_continu_int", label: "Velo - Continu intensif", color: "#4CAF50", icon: "🚴", modalite: "velo",
    desc: "80-85% FCmax - 30-60min - Seuil lactique velo",
    protocole: {
      objectif: "Repousser le seuil lactique sur velo. Travail cardiovasculaire equivalent footing intensif.",
      intensite: "80-85% FCmax. Cadence 80-90 RPM. Resistance moderee a elevee.",
      structure: [
        { phase: "Echauffement", duree: "15 min", detail: "Montee progressive de la FC. Cadence 80 RPM croissant." },
        { phase: "Corps de seance", duree: "25-45 min", detail: "FC stable 80-85%. Peut inclure 2-3 montees de col ou simulation cote." },
        { phase: "Retour au calme", duree: "10 min", detail: "Deceleration douce. FC < 65% avant arret." },
      ],
      notes: "Equivalent seuil en velo. Moins traumatisant que la course. Idéal en prepa ou blessure.",
    },
  },
  {
    id: "velo_interval", label: "Velo - Intervalles", color: "#FFA420", icon: "🚴", modalite: "velo",
    desc: "Repetitions haute intensite - VO2max velo - HIIT",
    protocole: {
      objectif: "Puissance aerobie maximale sur velo. VO2max. Sans impact articulaire.",
      intensite: "Effort : 90-100% FCmax ou puissance maximale. Recuperation : 50-60% FCmax.",
      structure: [
        { phase: "Echauffement", duree: "15 min", detail: "Montee progressive sur 15 min. Terminer avec 3x20s sprint leger." },
        { phase: "Series", duree: "Variable", detail: "Voir formats. Recuperation = pedalage resistance nulle ou tres faible." },
        { phase: "Retour au calme", duree: "10 min", detail: "Pedalage tres doux. Cadence libre. FC < 65% avant arret." },
      ],
      formats_detail: [
        { nom: "30/30 velo", travail: "30s sprint max (cadence 100+ RPM)", repos: "30s recup legere", series: "10-15 reps", note: "Equivalent 30/30 course. Parfait si pas de course possible." },
        { nom: "Tabata velo", travail: "20s effort maximum", repos: "10s repos", series: "8 reps = 4 min. Faire 2-4 blocs", note: "Format Tabata classique. Tres intense. 2-3 min entre blocs." },
        { nom: "Pyramide velo", travail: "1-2-3-2-1 min @ 90-95% FCmax", repos: "= duree effort", series: "1-2 fois la pyramide", note: "Volume croissant puis decroissant. Interessant pour VMA velo." },
        { nom: "Sprint 40s/2min", travail: "40s sprint puissance max", repos: "2min pedalage doux", series: "6-8 reps", note: "Puissance anaerobie alactique. Courts mais tres intenses." },
      ],
      notes: "Ideal si le joueur ne peut pas courir (blessure MI) ou pour varier le stimulus aerobie.",
    },
  },
  {
    id: "velo_tabata", label: "Tabata velo", color: "#FF7A00", icon: "🚴", modalite: "velo",
    desc: "20s max / 10s repos - 8 series - Puissance max",
    protocole: {
      objectif: "Protocole Tabata classique (Izumi Tabata, 1996). Maximise VO2max ET capacite anaerobie. 4 minutes intenses = equivalent long effort aerobie.",
      intensite: "20s a 170% VO2max (effort maximal). 10s repos complet (pedaler sans resistance).",
      structure: [
        { phase: "Echauffement", duree: "15 min", detail: "Obligatoire. Monter FC progressivement. Finir avec 3x10s acceleration." },
        { phase: "Bloc Tabata", duree: "4 min (8x 20s/10s)", detail: "20s pedaler aussi fort que possible (cadence max + resistance). 10s repos total. 8 repetitions = 4 min. TOUT donner des la 1ere repetition." },
        { phase: "Recuperation inter-blocs", duree: "3-4 min", detail: "Pedaler tres doucement. FC peut redescendre partiellement." },
        { phase: "Nb de blocs", duree: "2-4 blocs selon niveau", detail: "Debutant : 2 blocs. Confirme : 3 blocs. Elite : 4 blocs." },
        { phase: "Retour au calme", duree: "10 min", detail: "Pedalage tres lent. Etirements assis." },
      ],
      notes: "Ne pas utiliser plus de 2x/semaine. Jamais 48h avant match. Douleur musculaire normale 24-48h apres.",
    },
  },
  {
    id: "velo_recup", label: "Velo - Recuperation", color: "rgba(255,255,255,.4)", icon: "🚴", modalite: "velo",
    desc: "< 60% FCmax - Regeneration douce - Sans impact",
    protocole: {
      objectif: "Recuperation douce sans impact. Ideal lendemain de match ou apres seance intense.",
      intensite: "< 60% FCmax. Cadence libre et confortable. Aucune resistance.",
      structure: [
        { phase: "Seance entiere", duree: "20-30 min", detail: "Velo sans resistance ou tres peu. FC < 60% en permanence. Pedaler en relachement total." },
      ],
      notes: "Option ideale post-match. Eliminates metabolites sans stress additionnel. Peut coupler avec glace et elevation jambes apres.",
    },
  },
];

const FORMATS_INTERVAL = [
  { id: "30_30",    label: "30/30",      travail: 30,  repos: 30,  series: 10, intensite: "100-105% VMA", desc: "VO2max - Format handball cle - 3 blocs de 5 reps separés de 3 min" },
  { id: "1_1",      label: "1min/1min",  travail: 60,  repos: 60,  series: 8,  intensite: "100% VMA",     desc: "Puissance aerobie - Ne pas partir trop vite sur les premieres reps" },
  { id: "2_1",      label: "2min/1min",  travail: 120, repos: 60,  series: 5,  intensite: "90-95% VMA",   desc: "Seuil haut - Bonne endurance de base requise" },
  { id: "3_3",      label: "3min/3min",  travail: 180, repos: 180, series: 4,  intensite: "95-100% VMA",  desc: "VMA longue - Epuisant - 1x/semaine max" },
  { id: "10_20_30", label: "10-20-30",   travail: 60,  repos: 120, series: 15, intensite: "Variable",     desc: "30s lent, 20s moyen, 10s sprint - Format nordique tres efficace - 3 blocs de 5 min" },
  { id: "10_50",    label: "10/50 PAM",  travail: 10,  repos: 50,  series: 12, intensite: "110% VMA",     desc: "Puissance max aerobie - Sprint court maximal - Format direct handball" },
  { id: "15_45",    label: "15/45 PAM",  travail: 15,  repos: 45,  series: 10, intensite: "110% VMA",     desc: "Sprint 15s max, marche 45s - Accent sur qualite de sprint" },
  { id: "30_90",    label: "30/90 PAM",  travail: 30,  repos: 90,  series: 8,  intensite: "110% VMA",     desc: "Recup longue pour maintenir intensite sprint - Qualite > quantite" },
];

// ── TESTS D'ENDURANCE ─────────────────────────────────────────────────────────
// Vameval, Luc & Léger (20m navette), FTP vélo

const TESTS_ENDURANCE_DB = [
  {
    id: 'vameval',
    nom: 'VAMEVAL',
    icon: '🏃',
    color: '#FF4455',
    desc: 'Test progressif continu. Paliers de 1min, vitesse augmente de 0.5 km/h. Balises tous les 20m, signal sonore.',
    protocole: [
      'Matériel: plot tous les 20m sur 400m (ou piste), cône de départ, bip sonore VAMEVAL',
      'Départ à 8 km/h, augmentation de 0.5 km/h toutes les minutes',
      'Le coureur doit atteindre chaque plot avant le signal sonore',
      'Test terminé quand 2 plots consécutifs non atteints',
    ],
    resultats: [
      { key:'vma', label:'VMA atteinte (km/h)', type:'number', unit:'km/h', placeholder:'Ex: 16.5' },
      { key:'dernierPalier', label:'Dernier palier complété', type:'number', unit:'palier', placeholder:'Ex: 17' },
      { key:'duree', label:'Durée totale (min)', type:'number', unit:'min', placeholder:'Ex: 17' },
    ],
    calculs: [
      { label:'VO2max estimé', formula: (r) => r.vma ? Math.round((r.vma * 3.5) * 10)/10 + ' ml/kg/min' : '—' },
      { label:'Allure 70% VMA', formula: (r) => r.vma ? Math.round(60/(r.vma*0.70)*60) + 's/km → '+Math.round(r.vma*0.70*10)/10+' km/h' : '—' },
      { label:'Allure 80% VMA', formula: (r) => r.vma ? Math.round(60/(r.vma*0.80)*60) + 's/km → '+Math.round(r.vma*0.80*10)/10+' km/h' : '—' },
      { label:'Allure 90% VMA', formula: (r) => r.vma ? Math.round(60/(r.vma*0.90)*60) + 's/km → '+Math.round(r.vma*0.90*10)/10+' km/h' : '—' },
      { label:'Allure 100% VMA', formula: (r) => r.vma ? Math.round(60/(r.vma)*60) + 's/km → '+r.vma+' km/h' : '—' },
    ],
    niveaux: [
      { label:'Insuffisant', min:0,  max:12,   color:'#FF4455' },
      { label:'Faible',      min:12, max:14,   color:'#FF7A00' },
      { label:'Moyen',       min:14, max:16,   color:'#FFB800' },
      { label:'Bon',         min:16, max:18,   color:'#4CAF50' },
      { label:'Excellent',   min:18, max:22,   color:'#38BDF8' },
    ],
  },
  {
    id: 'lucleger',
    nom: 'Luc & Léger (20m navette)',
    icon: '🔄',
    color: '#7C6FFF',
    desc: 'Test navette 20m progressif. Paliers de 1min, signal sonore. Standard international handball.',
    protocole: [
      'Matériel: 2 lignes parallèles à 20m, CD/MP3 Luc & Léger officiel',
      'Départ au signal, allers-retours entre les deux lignes',
      'Vitesse augmente chaque palier (numérotés 1 à 21)',
      'Test terminé quand 2 fois de suite impossible d\'atteindre la ligne avant le bip',
    ],
    resultats: [
      { key:'palier', label:'Palier atteint', type:'number', unit:'', placeholder:'Ex: 12' },
      { key:'navettes', label:'Nombre de navettes (dernier palier)', type:'number', unit:'', placeholder:'Ex: 6' },
    ],
    calculs: [
      { label:'VMA estimée', formula: (r) => {
          if (!r.palier) return '—';
          const vma = Math.round((r.palier * 0.5 + 7.0 + (r.navettes||0) * 0.05) * 10)/10;
          return vma + ' km/h';
        }
      },
      { label:'VO2max estimé', formula: (r) => {
          if (!r.palier) return '—';
          const vma = r.palier * 0.5 + 7.0 + (r.navettes||0) * 0.05;
          return Math.round(vma * 3.5 * 10)/10 + ' ml/kg/min';
        }
      },
      { label:'Distance totale', formula: (r) => {
          if (!r.palier) return '—';
          let dist = 0;
          for (let p = 1; p < r.palier; p++) dist += (p + 5) * 40;
          dist += (r.navettes||0) * 40;
          return (dist/1000).toFixed(2) + ' km';
        }
      },
    ],
    niveaux: [
      { label:'Insuffisant', min:0,  max:6,   color:'#FF4455' },
      { label:'Faible',      min:6,  max:9,   color:'#FF7A00' },
      { label:'Moyen',       min:9,  max:12,  color:'#FFB800' },
      { label:'Bon',         min:12, max:14,  color:'#4CAF50' },
      { label:'Excellent',   min:14, max:21,  color:'#38BDF8' },
      // niveaux en paliers
    ],
  },
  {
    id: 'ftp',
    nom: 'FTP Vélo (Functional Threshold Power)',
    icon: '🚴',
    color: '#FFA420',
    desc: 'Puissance maximale maintenue 1h. Protocole test 20min × 0.95 pour estimer FTP. Idéal pour récupération active et réhab.',
    protocole: [
      'Matériel: vélo stationnaire avec capteur de puissance (watts)',
      'Échauffement 10min progressif',
      'Effort maximal soutenu pendant 20 minutes',
      'FTP estimé = Puissance moyenne 20min × 0.95',
      'Alternative: Test rampe 1min/1min jusqu\'à épuisement → FTP = 75% de la puissance max',
    ],
    resultats: [
      { key:'poids', label:'Poids du joueur (kg)', type:'number', unit:'kg', placeholder:'Ex: 82' },
      { key:'puissance20min', label:'Puissance moyenne 20min (watts)', type:'number', unit:'W', placeholder:'Ex: 280' },
      { key:'fcMax', label:'FC max atteinte (bpm)', type:'number', unit:'bpm', placeholder:'Ex: 185' },
      { key:'fcMoyenne', label:'FC moyenne 20min (bpm)', type:'number', unit:'bpm', placeholder:'Ex: 172' },
    ],
    calculs: [
      { label:'FTP estimé', formula: (r) => r.puissance20min ? Math.round(r.puissance20min * 0.95) + ' W' : '—' },
      { label:'W/kg (rapport puissance/poids)', formula: (r) => r.puissance20min && r.poids ? Math.round(r.puissance20min * 0.95 / r.poids * 100)/100 + ' W/kg' : '—' },
      { label:'Zone 1 — Récupération (<55%)', formula: (r) => r.puissance20min ? '< ' + Math.round(r.puissance20min*0.95*0.55) + ' W' : '—' },
      { label:'Zone 2 — Endurance (56-75%)', formula: (r) => r.puissance20min ? Math.round(r.puissance20min*0.95*0.56)+'-'+Math.round(r.puissance20min*0.95*0.75) + ' W' : '—' },
      { label:'Zone 3 — Tempo (76-90%)', formula: (r) => r.puissance20min ? Math.round(r.puissance20min*0.95*0.76)+'-'+Math.round(r.puissance20min*0.95*0.90) + ' W' : '—' },
      { label:'Zone 4 — Seuil (91-105%)', formula: (r) => r.puissance20min ? Math.round(r.puissance20min*0.95*0.91)+'-'+Math.round(r.puissance20min*0.95*1.05) + ' W' : '—' },
      { label:'Zone 5 — VO2max (>106%)', formula: (r) => r.puissance20min ? '> ' + Math.round(r.puissance20min*0.95*1.06) + ' W' : '—' },
    ],
    niveaux: [
      { label:'Débutant',      min:0,   max:2.5, color:'#FF4455' },
      { label:'Intermédiaire', min:2.5, max:3.5, color:'#FF7A00' },
      { label:'Bon',           min:3.5, max:4.5, color:'#4CAF50' },
      { label:'Excellent',     min:4.5, max:10,  color:'#38BDF8' },
    ],
  },
  {
    id: 'velo_3min',
    nom: 'Test Vélo 3 minutes — Effort maximal',
    icon: '🚴',
    color: '#FF7A00',
    desc: 'Test court intensité maximale. Estime la puissance critique et le VO2max. Protocole : 3min all-out après échauffement.',
    protocole: [
      'Échauffement 10min : 5min facile + 3x10s sprints + 5min facile',
      'Récupération 5min en pédalage léger (<100W)',
      'Signal départ : effort MAXIMAL pendant exactement 3 minutes',
      'Objectif : maintenir la puissance la plus élevée possible sur toute la durée',
      'Les 30 dernières secondes représentent la Puissance Critique (PC)',
    ],
    resultats: [
      { key:'poids',       label:'Poids du joueur (kg)', type:'number', unit:'kg',   placeholder:'Ex: 82' },
      { key:'puissanceMoy',label:'Puissance moyenne 3min (W)', type:'number', unit:'W',    placeholder:'Ex: 320' },
      { key:'puissance30s',label:'Puissance moyenne dernières 30s (W)', type:'number', unit:'W',    placeholder:'Ex: 255' },
      { key:'fcMax',       label:'FC max atteinte (bpm)',  type:'number', unit:'bpm',  placeholder:'Ex: 192' },
    ],
    calculs: [
      { label:'Puissance Critique (PC)',   formula: (r) => r.puissance30s ? r.puissance30s + ' W' : '—' },
      { label:'W/kg (Puissance Critique)', formula: (r) => r.puissance30s && r.poids ? Math.round(r.puissance30s/r.poids*100)/100 + ' W/kg' : '—' },
      { label:'VO2max estimé (Hawley)',    formula: (r) => r.puissanceMoy && r.poids ? Math.round((r.puissanceMoy*10.8/r.poids + 7)*10)/10 + ' ml/kg/min' : '—' },
      { label:'FTP estimé (PC × 1.0)',    formula: (r) => r.puissance30s ? Math.round(r.puissance30s) + ' W (~FTP)' : '—' },
      { label:'Zone 1 Récup (<55% PC)',   formula: (r) => r.puissance30s ? '< ' + Math.round(r.puissance30s*0.55) + ' W' : '—' },
      { label:'Zone 2 Endurance (56-75%)',formula: (r) => r.puissance30s ? Math.round(r.puissance30s*0.56)+'-'+Math.round(r.puissance30s*0.75)+' W' : '—' },
      { label:'Zone 3 Tempo (76-90%)',    formula: (r) => r.puissance30s ? Math.round(r.puissance30s*0.76)+'-'+Math.round(r.puissance30s*0.90)+' W' : '—' },
      { label:'Zone 4 Seuil (91-105%)',   formula: (r) => r.puissance30s ? Math.round(r.puissance30s*0.91)+'-'+Math.round(r.puissance30s*1.05)+' W' : '—' },
    ],
    niveaux: [
      { label:'Débutant',      min:0,   max:2.5, color:'#FF4455' },
      { label:'Intermédiaire', min:2.5, max:3.5, color:'#FF7A00' },
      { label:'Bon',           min:3.5, max:4.5, color:'#4CAF50' },
      { label:'Excellent',     min:4.5, max:10,  color:'#38BDF8' },
    ],
  },
  {
    id: 'velo_12min',
    nom: 'Test Vélo 12 minutes — Cooper adapté',
    icon: '🚴',
    color: '#4CAF50',
    desc: 'Adaptation vélo du test Cooper (12min). Effort constant maximal soutenu. Bonne corrélation avec le VO2max terrain.',
    protocole: [
      'Échauffement 10-15min progressif en pédalage aisé',
      'Régler la résistance de manière à pouvoir maintenir un effort élevé mais constant',
      'Effort maximal CONTINU pendant 12 minutes exactement',
      'Maintenir la puissance la plus haute possible sans s\'effondrer',
      'Noter la puissance moyenne sur les 12min et la distance si vélo connecté',
    ],
    resultats: [
      { key:'poids',       label:'Poids du joueur (kg)',      type:'number', unit:'kg',  placeholder:'Ex: 82' },
      { key:'puissance12', label:'Puissance moyenne 12min (W)', type:'number', unit:'W',   placeholder:'Ex: 290' },
      { key:'distance12',  label:'Distance parcourue (km)',   type:'number', unit:'km',  placeholder:'Ex: 5.8' },
      { key:'fcMoy',       label:'FC moyenne (bpm)',          type:'number', unit:'bpm', placeholder:'Ex: 175' },
      { key:'fcMax',       label:'FC max (bpm)',               type:'number', unit:'bpm', placeholder:'Ex: 186' },
    ],
    calculs: [
      { label:'FTP estimé (×0.95)',       formula: (r) => r.puissance12 ? Math.round(r.puissance12*0.95) + ' W' : '—' },
      { label:'W/kg',                     formula: (r) => r.puissance12 && r.poids ? Math.round(r.puissance12/r.poids*100)/100 + ' W/kg' : '—' },
      { label:'VO2max estimé (Hawley)',   formula: (r) => r.puissance12 && r.poids ? Math.round((r.puissance12*10.8/r.poids+7)*10)/10 + ' ml/kg/min' : '—' },
      { label:'VO2max par distance',      formula: (r) => r.distance12 ? Math.round(((r.distance12*1000-2100)/37.7 + 30)*10)/10 + ' ml/kg/min' : '—' },
      { label:'Zone 1 Récup (<55%)',      formula: (r) => r.puissance12 ? '< ' + Math.round(r.puissance12*0.95*0.55) + ' W' : '—' },
      { label:'Zone 2 Endurance (56-75%)',formula: (r) => r.puissance12 ? Math.round(r.puissance12*0.95*0.56)+'-'+Math.round(r.puissance12*0.95*0.75)+' W' : '—' },
      { label:'Zone 3 Tempo (76-90%)',    formula: (r) => r.puissance12 ? Math.round(r.puissance12*0.95*0.76)+'-'+Math.round(r.puissance12*0.95*0.90)+' W' : '—' },
      { label:'Zone 4 Seuil (91-105%)',  formula: (r) => r.puissance12 ? Math.round(r.puissance12*0.95*0.91)+'-'+Math.round(r.puissance12*0.95*1.05)+' W' : '—' },
    ],
    niveaux: [
      { label:'Débutant',      min:0,   max:2.5, color:'#FF4455' },
      { label:'Intermédiaire', min:2.5, max:3.5, color:'#FF7A00' },
      { label:'Bon',           min:3.5, max:4.5, color:'#4CAF50' },
      { label:'Excellent',     min:4.5, max:10,  color:'#38BDF8' },
    ],
  },
  {
    id: '30_15_ift',
    nom: '30-15 IFT',
    icon: '⚡',
    color: '#FF4455',
    desc: 'Test intermittent de Buchheit. Alternance 30s course / 15s marche, paliers progressifs. Référence handball pour évaluer la VAMEVAL en contexte intermittent. Très spécifique aux sports collectifs.',
    protocole: [
      'Matériel: terrain 40m, plots à chaque extrémité, bande sonore 30-15 IFT officielle',
      'Départ à 8 km/h — vitesse augmente de 0.5 km/h tous les 45s (30s course + 15s marche)',
      'Le joueur doit atteindre la ligne à chaque bip sonore',
      'Test terminé quand le joueur ne peut plus suivre le rythme 2 fois de suite',
      'Résultat : vitesse finale atteinte (VIFT) → utilisée pour calculer les zones de travail',
      'Norme handball Nationale 1 : VIFT > 19 km/h pour les joueurs de champ',
    ],
    resultats: [
      { key:'vitesse_finale', label:'Vitesse finale atteinte (VIFT en km/h)', type:'number', unit:'km/h', placeholder:'Ex: 19.5' },
      { key:'fcMax',          label:'FC max atteinte (bpm)', type:'number', unit:'bpm', placeholder:'Ex: 195' },
      { key:'fcRec',          label:'FC à 1min de récupération (bpm)', type:'number', unit:'bpm', placeholder:'Ex: 155' },
      { key:'notes',          label:'Observations', type:'text', placeholder:'Conditions, météo, état du joueur...' },
    ],
    calculs: [
      { label:'VMA intermittente (VIFT)',   formula: (r) => r.vitesse_finale ? r.vitesse_finale + ' km/h' : '—' },
      { label:'Zone 1 — Récupération (60%)',formula: (r) => r.vitesse_finale ? Math.round(r.vitesse_finale*0.60*10)/10 + ' km/h' : '—' },
      { label:'Zone 2 — Foncier (70%)',     formula: (r) => r.vitesse_finale ? Math.round(r.vitesse_finale*0.70*10)/10 + ' km/h' : '—' },
      { label:'Zone 3 — Développement (80%)',formula: (r) => r.vitesse_finale ? Math.round(r.vitesse_finale*0.80*10)/10 + ' km/h' : '—' },
      { label:'Zone 4 — Intensif (90%)',    formula: (r) => r.vitesse_finale ? Math.round(r.vitesse_finale*0.90*10)/10 + ' km/h' : '—' },
      { label:'Zone 5 — Supramaximal (100-105%)', formula: (r) => r.vitesse_finale ? Math.round(r.vitesse_finale*1.00*10)/10 + '–' + Math.round(r.vitesse_finale*1.05*10)/10 + ' km/h' : '—' },
      { label:'Indice récupération FC',     formula: (r) => r.fcMax && r.fcRec ? (r.fcMax - r.fcRec) + ' bpm (>30 = bon)' : '—' },
    ],
    niveaux: [
      { label:'Insuffisant',   min:0,   max:16,  color:'#FF4455' },
      { label:'Acceptable',    min:16,  max:18,  color:'#FF7A00' },
      { label:'Bon (N2/N1)',   min:18,  max:20,  color:'#4CAF50' },
      { label:'Excellent (Pro)',min:20, max:30,  color:'#38BDF8' },
    ],
  },
  {
    id: 'demi_cooper',
    nom: 'Demi-Cooper (6 min)',
    icon: '⏱️',
    color: '#4CAF50',
    desc: 'Test de course continue de 6 minutes. Le coureur parcourt la distance maximale possible. Simple à mettre en place, permet d\'estimer la VMA et la VO2max. Idéal pour un suivi régulier en début de saison.',
    protocole: [
      'Matériel: piste ou parcours mesuré avec repères tous les 20-50m, chronomètre',
      'Échauffement de 10-15 min avant le test',
      'Courir la plus grande distance possible en 6 minutes à allure régulière',
      'Noter la distance totale parcourue au mètre près',
      'Allure constante recommandée : ne pas partir trop vite',
    ],
    resultats: [
      { key:'distance', label:'Distance parcourue (mètres)', type:'number', unit:'m', placeholder:'Ex: 1600' },
      { key:'fcMax',    label:'FC max atteinte (bpm)', type:'number', unit:'bpm', placeholder:'Ex: 192' },
      { key:'notes',    label:'Observations', type:'text', placeholder:'Conditions, météo, ressenti...' },
    ],
    calculs: [
      { label:'VMA estimée',          formula: (r) => r.distance ? Math.round((r.distance / 100) * 10)/10 + ' km/h' : '—' },
      { label:'VO2max estimé',        formula: (r) => r.distance ? Math.round(((r.distance/100) * 3.5) * 10)/10 + ' ml/kg/min' : '—' },
      { label:'Vitesse moyenne',      formula: (r) => r.distance ? Math.round((r.distance / 6 / 1000 * 60) * 10)/10 + ' km/h' : '—' },
      { label:'Allure 70% VMA',       formula: (r) => r.distance ? (() => { const v=r.distance/100; return Math.round(60/(v*0.70)*60) + 's/km → '+Math.round(v*0.70*10)/10+' km/h'; })() : '—' },
      { label:'Allure 80% VMA',       formula: (r) => r.distance ? (() => { const v=r.distance/100; return Math.round(60/(v*0.80)*60) + 's/km → '+Math.round(v*0.80*10)/10+' km/h'; })() : '—' },
      { label:'Allure 90% VMA',       formula: (r) => r.distance ? (() => { const v=r.distance/100; return Math.round(60/(v*0.90)*60) + 's/km → '+Math.round(v*0.90*10)/10+' km/h'; })() : '—' },
      { label:'Allure 100% VMA',      formula: (r) => r.distance ? (() => { const v=r.distance/100; return Math.round(60/v*60) + 's/km → '+Math.round(v*10)/10+' km/h'; })() : '—' },
    ],
    niveaux: [
      { label:'Insuffisant', min:0,    max:1200, color:'#FF4455' },
      { label:'Faible',      min:1200, max:1400, color:'#FF7A00' },
      { label:'Moyen',       min:1400, max:1600, color:'#FFB800' },
      { label:'Bon',         min:1600, max:1800, color:'#4CAF50' },
      { label:'Excellent',   min:1800, max:2400, color:'#38BDF8' },
    ],
  }
];

function TestsEnduranceView({ player, setDb, isCoach }) {
  const tests = player.testsEndurance || [];
  const [selTest, setSelTest]   = useState(null); // test being filled
  const [form, setForm]         = useState({});
  const [showHistory, setShowHistory] = useState(null);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function saveTest() {
    const t = {
      ...form,
      testId: selTest.id,
      testNom: selTest.nom,
      id: Date.now(),
      date: form.date || localDateStr(),
    };
    // Lire les tests FRAIS depuis db (pas depuis player prop figé)
    setDb(d => {
      const freshPlayer = (d.playerProfiles||[]).find(p => p.id === player.id)
        || (d.playersPerso||[]).find(p => p.id === player.id)
        || player;
      const freshTests = freshPlayer.testsEndurance || [];
      const newTests = [...freshTests, t];
      // Sync Firebase avec la liste complète fraîche
      if (window.__perfhand_db && player && player.id) {
        const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
        window.__perfhand_db.ref(path + player.id + '/testsEndurance').set(newTests);
      }
      const isPerso = (d.playersPerso||[]).find(p => p.id === player.id);
      if (isPerso) return { ...d, playersPerso: (d.playersPerso||[]).map(p => p.id===player.id ? {...p, testsEndurance: newTests} : p) };
      return { ...d, playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, testsEndurance: newTests} : p) };
    });
    setSelTest(null);
    setForm({});
  }

  function deleteTest(id) {
    if (confirm('Supprimer ce test ?')) {
      setDb(d => {
        const freshPlayer = (d.playerProfiles||[]).find(p => p.id === player.id)
          || (d.playersPerso||[]).find(p => p.id === player.id)
          || player;
        const newTests = (freshPlayer.testsEndurance || []).filter(t => t.id !== id);
        if (window.__perfhand_db && player && player.id) {
          const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
          window.__perfhand_db.ref(path + player.id + '/testsEndurance').set(newTests);
        }
        const isPerso = (d.playersPerso||[]).find(p => p.id === player.id);
        if (isPerso) return { ...d, playersPerso: (d.playersPerso||[]).map(p => p.id===player.id ? {...p, testsEndurance: newTests} : p) };
        return { ...d, playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, testsEndurance: newTests} : p) };
      });
    }
  }

  // Last result per test type
  function lastResult(testId) {
    return tests.filter(t => t.testId === testId).sort((a,b) => b.id - a.id)[0] || null;
  }

  return _h`<div>

    <!-- Header tests terrain -->
    <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
      <div style=${{ fontSize:12, fontWeight:700, color:'#38BDF8', marginBottom:4 }}>📊 Tests terrain</div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:10 }}>
        Clique sur "+ Saisir" sur un test pour enregistrer un résultat. Les calculs (VMA, zones FC...) sont automatiques.
      </div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${TESTS_ENDURANCE_DB.map(test => _h`<button key=${test.id}
          onClick=${() => { setSelTest(test); setForm({ date: localDateStr() }); }}
          style=${{
            padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
            border:'1px solid '+test.color+'40', background:test.color+'10', color:test.color
          }}>${test.icon} ${test.nom}</button>`)}
      </div>
    </div>

    <!-- Tests cards -->
    <div style=${{ display:'grid', gap:12, marginBottom:20 }}>
      ${TESTS_ENDURANCE_DB.map(test => {
        const last = lastResult(test.id);
        const history = tests.filter(t => t.testId === test.id);
        return _h`<div key=${test.id} style=${{
          background:'rgba(255,255,255,.025)', border:'2px solid '+test.color+'30',
          borderRadius:16, overflow:'hidden'
        }}>
          <!-- Header -->
          <div style=${{ padding:'14px 16px', background:test.color+'08', borderBottom:'1px solid '+test.color+'20' }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style=${{ fontSize:22 }}>${test.icon}</span>
                  <span style=${{ fontSize:15, fontWeight:800 }}>${test.nom}</span>
                </div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:3 }}>${test.desc}</div>
              </div>
              <div style=${{ display:'flex', gap:6, flexShrink:0, marginLeft:10 }}>
                ${history.length > 0 ? _h`<button class="btn btn-sm"
                  onClick=${() => setShowHistory(showHistory===test.id ? null : test.id)}>
                  📊 ${history.length}
                </button>` : null}
                ${isCoach ? _h`<button class="btn btn-sm btn-primary" style=${{ background:test.color+'20', border:'1px solid '+test.color+'50', color:test.color }}
                  onClick=${() => { setSelTest(test); setForm({ date: localDateStr() }); }}>
                  + Tester
                </button>` : null}
              </div>
            </div>
          </div>

          <!-- Last result + calculs -->
          ${last ? _h`<div style=${{ padding:'12px 16px' }}>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Dernier test — ${last.date}</div>
            <!-- Raw results -->
            <div style=${{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
              ${test.resultats.map(r => last[r.key] ? _h`<div key=${r.key} style=${{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'6px 10px', textAlign:'center' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)' }}>${r.label}</div>
                <div style=${{ fontSize:16, fontWeight:800, color:test.color, fontFamily:"'Barlow Condensed',sans-serif" }}>${last[r.key]} <span style=${{ fontSize:10 }}>${r.unit}</span></div>
              </div>` : null)}
            </div>
            <!-- Calculs automatiques -->
            <div style=${{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px 12px' }}>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:6, fontWeight:700 }}>Calculs automatiques</div>
              <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                ${test.calculs.map((calc, ci) => _h`<div key=${ci} style=${{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${calc.label}</span>
                  <span style=${{ fontSize:10, fontWeight:700, color:test.color }}>${calc.formula(last)}</span>
                </div>`)}
              </div>
            </div>
            ${last.notes ? _h`<div style=${{ marginTop:8, fontSize:11, color:'rgba(255,255,255,.4)' }}>💡 ${last.notes}</div>` : null}
          </div>` : _h`<div style=${{ padding:'14px 16px', textAlign:'center', color:'rgba(255,255,255,.25)', fontSize:12 }}>
            Aucun test enregistré
          </div>`}

          <!-- Historique -->
          ${showHistory === test.id && history.length > 0 && _h`<div style=${{ padding:'0 16px 14px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', margin:'10px 0 8px', textTransform:'uppercase', letterSpacing:1 }}>Historique des tests</div>
            ${history.sort((a,b)=>b.id-a.id).map(t => _h`<div key=${t.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.6)', fontWeight:600 }}>${t.date}</div>
                <div style=${{ fontSize:10, color:test.color }}>
                  ${test.calculs[0] ? test.calculs[0].formula(t) : ''}
                </div>
              </div>
              <div style=${{ display:'flex', gap:8, alignItems:'center' }}>
                ${test.resultats.map(r => t[r.key] ? _h`<span key=${r.key} style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${t[r.key]} ${r.unit}</span>` : null)}
                ${isCoach ? _h`<button class="btn btn-sm btn-danger" onClick=${()=>deleteTest(t.id)} style=${{ fontSize:9, padding:'2px 6px' }}>×</button>` : null}
              </div>
            </div>`)}
          </div>`}

          <!-- Protocole -->
          <details style=${{ borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <summary style=${{ padding:'10px 16px', cursor:'pointer', fontSize:11, color:'rgba(255,255,255,.4)', listStyle:'none' }}>▸ Voir le protocole</summary>
            <div style=${{ padding:'0 16px 14px' }}>
              ${test.protocole.map((step, si) => _h`<div key=${si} style=${{ display:'flex', gap:8, marginBottom:5 }}>
                <div style=${{ width:18, height:18, borderRadius:'50%', background:test.color+'20', color:test.color, fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>${si+1}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.6)', lineHeight:1.5 }}>${step}</div>
              </div>`)}
            </div>
          </details>
        </div>`;
      })}
    </div>

    <!-- Modal saisie résultats -->
    ${selTest && _h`<div class="edit-modal-bg" onClick=${()=>{setSelTest(null);setForm({});}}>
      <div class="edit-modal" style=${{ maxWidth:540 }} onClick=${e=>e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style=${{ fontSize:15, fontWeight:800 }}>${selTest.icon} ${selTest.nom}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>Saisie des résultats</div>
          </div>
          <button onClick=${()=>{setSelTest(null);setForm({});}} style=${{ background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:20,cursor:'pointer' }}>x</button>
        </div>
        <div class="edit-modal-body">
          <!-- Date -->
          <div style=${{ marginBottom:14 }}>
            <div class="lbl">Date du test</div>
            <input class="inp" type="date" value=${form.date||''} onInput=${e=>upd('date',e.target.value)}/>
          </div>

          <!-- Champs de résultats -->
          <div style=${{ marginBottom:14 }}>
            <div class="lbl" style=${{ marginBottom:8 }}>Résultats</div>
            ${selTest.resultats.map(r => _h`<div key=${r.key} style=${{ marginBottom:10 }}>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:4 }}>${r.label} <span style=${{ color:'rgba(255,255,255,.3)' }}>${r.unit ? '('+r.unit+')' : ''}</span></div>
              <input class="inp" type=${r.type} value=${form[r.key]||''} onInput=${e=>upd(r.key, e.target.value)} placeholder=${r.placeholder}/>
            </div>`)}
          </div>

          <!-- Preview calculs en temps réel -->
          ${selTest.calculs.some(calc => calc.formula(form) !== '—') ? _h`<div style=${{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:700, marginBottom:8 }}>Calculs en temps réel</div>
            ${selTest.calculs.map((calc, ci) => _h`<div key=${ci} style=${{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${calc.label}</span>
              <span style=${{ fontSize:11, fontWeight:700, color:selTest.color }}>${calc.formula(form)}</span>
            </div>`)}
          </div>` : null}

          <div>
            <div class="lbl">Notes / conditions du test</div>
            <textarea class="inp" value=${form.notes||''} onInput=${e=>upd('notes',e.target.value)} style=${{ resize:'vertical', minHeight:50 }} placeholder="Conditions météo, terrain, état du joueur..."></textarea>
          </div>
        </div>
        <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${()=>{setSelTest(null);setForm({});}}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} onClick=${saveTest}>Enregistrer le test</button>
        </div>
      </div>
    </div>`}
  </div>`;
}



// Calcule les temps cibles d'une séance endurance selon VMA et type
// ── Séances de piste mixtes (800 / 400 / 200…) : une ligne claire PAR distance, avec allure propre à chaque distance
const PISTE_PCT = { 200:[95,105], 300:[92,100], 400:[85,95], 600:[80,90], 800:[75,85], 1000:[75,85], 1200:[75,82], 1600:[75,82] };
const PISTE_RECUP_DEF = { 200:'1 min', 400:'1 min 30', 800:'3 min' };
function pistePctPour(d) { return PISTE_PCT[d] || (d <= 200 ? [95,105] : d <= 400 ? [85,95] : [75,85]); }
function parseBlocsPiste(s) {
  const txt = (s && s.distance) || '';
  const blocs = []; let m;
  const re = /(\d+)\s*[x×]\s*(\d{3,4})\s*m?(?:\s*@\s*(\d+)(?:\s*-\s*(\d+))?\s*%)?/gi;
  while ((m = re.exec(txt))) blocs.push({ reps: +m[1], dist: +m[2], pct: m[3] ? [+m[3], +(m[4] || m[3])] : null });
  if (blocs.length >= 2) return blocs;
  const pm = (((s && s.nom) || '') + ' ' + txt).match(/\d{3,4}(?:\s*-\s*\d{3,4}){2,}/);
  if (pm) return pm[0].split(/\s*-\s*/).map(d => ({ reps: 1, dist: +d, pct: null }));
  return [];
}
function recupPisteDist(s, d) {
  const r = (s && s.recup) || '';
  const parts = r.split(/[,;\/]/).map(x => x.trim()).filter(Boolean);
  const mine = parts.find(x => new RegExp('(^|\\D)' + d + '\\s*m').test(x));
  if (mine) { const t = mine.match(/\d+(?:[.,]\d+)?\s*(?:min|mn|sec|s)\w*/i); if (t) return t[0]; }
  if (parts.length && !parts.some(x => /\d{3,4}\s*m/.test(x))) return r;
  return PISTE_RECUP_DEF[d] || '';
}
function fmtTpsPiste(sec) { sec = Math.round(sec); return sec >= 60 ? Math.floor(sec/60) + ':' + String(sec%60).padStart(2,'0') : sec + ' s'; }
function allureBlocPiste(vma, b) {
  const p = b.pct || pistePctPour(b.dist);
  const vMin = Math.round(vma * p[0] / 100 * 10) / 10, vMax = Math.round(vma * p[1] / 100 * 10) / 10;
  const kmPace = v => { const sk = Math.round(3600 / v); return Math.floor(sk/60) + ':' + String(sk%60).padStart(2,'0'); };
  return { p, vMin, vMax, tFast: fmtTpsPiste(b.dist / vMax * 3.6), tSlow: fmtTpsPiste(b.dist / vMin * 3.6), paceFast: kmPace(vMax), paceSlow: kmPace(vMin) };
}
const TYPE_PCT_ENDU = {
  continu_ext:[70,75], continu_int:[80,85], interval:[95,105], fractionne:[105,115], spl:[75,100], recup_active:[55,65],
  piste_fond:[75,95], anaerobie_lactique:[95,110], anaerobie_alactique:[105,120], capacite_aerobie:[82,88]
};
// Découpe n'importe quelle séance d'endurance en blocs lisibles : {reps, repsMax, dist (m) | sec, pct, recup}
function blocsEndu(s) {
  if (!s) return [];
  const multi = parseBlocsPiste(s);
  if (multi.length) return multi.map(b => ({ reps: b.reps, repsMax: b.reps, dist: b.dist, pct: b.pct || pistePctPour(b.dist), recup: recupPisteDist(s, b.dist) }));
  const txt = ((s.distance || '') + ' ' + (s.nom || '')).replace(/,/g, '.');
  const notes = s.notes || '';
  let reps = 1, repsMax = 1, dist = null, sec = null;
  const mx = txt.match(/(\d+)(?:\s*-\s*(\d+))?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(km|min|mn|sec|m|s)\b/i);
  const mq = (s.distance || '').replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(km|min|mn|sec|m|s)\b/i);
  const mu = (u, q) => { u = u.toLowerCase(); q = parseFloat(q); if (u === 'km') dist = q * 1000; else if (u === 'm') dist = q; else if (u === 's' || u === 'sec') sec = q; else sec = q * 60; };
  if (mx) { reps = +mx[1]; repsMax = mx[2] ? +mx[2] : reps; mu(mx[4], mx[3]); const r2 = notes.match(/(\d+)\s*-\s*(\d+)\s*reps?\b/i); if (r2 && +r2[1] === reps) repsMax = +r2[2]; }
  else if (mq) {
    mu(mq[2], mq[1]);
    const rn = notes.match(/(\d+)(?:\s*-\s*(\d+))?\s*reps?\b/i) || (s.nom || '').match(/(\d+)(?:\s*-\s*(\d+))?\s*[x×]/);
    if (rn) { reps = +rn[1]; repsMax = rn[2] ? +rn[2] : reps; }
  } else if (s.duree > 0) sec = s.duree * 60;
  else return [];
  const src = (s.distance || '') + ' ' + notes;
  const pm = src.match(/(\d+)\s*-\s*(\d+)\s*%/) || src.match(/(\d+)\s*%\s*(?:de\s*)?VMA/i);
  let pct = pm ? (pm[2] ? [+pm[1], +pm[2]] : [+pm[1], +pm[1]]) : null;
  if (!pct) pct = dist && PISTE_PCT[dist] ? PISTE_PCT[dist] : (TYPE_PCT_ENDU[s.type] || [70, 80]);
  return [{ reps, repsMax, dist, sec, pct, recup: s.recup || '' }];
}
function fmtDistEndu(m) { return m >= 1000 ? (Math.round(m / 100) / 10).toString().replace('.', ',') + ' km' : Math.round(m / 10) * 10 + ' m'; }
function PisteBlocsEl(s, vma, blocs, extra) {
  const rep = ((s.notes || '').match(/^\s*(\d+(?:-\d+)?)\s*(fois|pyramides?|s[ée]ries?|circuits?|tours?)/i));
  const multi = blocs.length > 1;
  const kmPace = v => { const sk = Math.round(3600 / v); return Math.floor(sk/60) + ':' + String(sk%60).padStart(2,'0'); };
  let totDist = 0, totDistMax = 0, totSec = 0, totSecMax = 0;
  const rows = blocs.map((b, i) => {
    const rMax = b.repsMax || b.reps;
    const repsTxt = rMax !== b.reps ? b.reps + '-' + rMax : String(b.reps);
    const vMin = vma ? Math.round(vma * b.pct[0] / 100 * 10) / 10 : null;
    const vMax = vma ? Math.round(vma * b.pct[1] / 100 * 10) / 10 : null;
    let cible = null, action = null;
    if (b.dist) {
      totDist += b.reps * b.dist; totDistMax += rMax * b.dist;
      if (vma) { cible = fmtTpsPiste(b.dist / vMax * 3.6) + ' – ' + fmtTpsPiste(b.dist / vMin * 3.6); totSec += b.reps * b.dist / vMax * 3.6; totSecMax += rMax * b.dist / vMin * 3.6; }
    } else if (b.sec) {
      totSec += b.reps * b.sec; totSecMax += rMax * b.sec;
      if (vma) { const d1 = vMin * 1000 / 3600 * b.sec, d2 = vMax * 1000 / 3600 * b.sec; cible = fmtDistEndu(d1) + ' – ' + fmtDistEndu(d2); totDist += b.reps * d1; totDistMax += rMax * d2; }
    }
    const effort = b.dist ? fmtDistEndu(b.dist) : (b.sec >= 60 ? (b.sec % 60 ? Math.floor(b.sec/60) + ' min ' + (b.sec%60) + ' s' : (b.sec/60) + ' min') : b.sec + ' s');
    if (vma && cible) {
      action = 'Cours ' + effort + (b.dist ? ' en ' + cible : ' à ' + vMin + '–' + vMax + ' km/h (≈ ' + cible + ')') + (b.recup ? ', récup ' + b.recup : '') + (rMax > 1 ? ', ×' + repsTxt : '');
    }
    return _h`<div key=${i} style=${{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'9px 11px', marginBottom:6 }}>
      <div style=${{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
        ${multi ? _h`<span style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.35)' }}>${i+1}.</span>` : null}
        ${rMax > 1 || b.reps > 1 ? _h`<span style=${{ fontSize:20, fontWeight:900, color:'#7C6FFF' }}>${repsTxt}×</span>` : null}
        <span style=${{ fontSize:17, fontWeight:800, color:'#fff' }}>${effort}</span>
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.45)' }}>${b.pct[0] === b.pct[1] ? b.pct[0] : b.pct[0] + '–' + b.pct[1]}% VMA</span>
        ${b.recup ? _h`<span style=${{ marginLeft:'auto', fontSize:11, color:'#FFA420', fontWeight:700 }}>⏸ récup ${b.recup}</span>` : null}
      </div>
      ${vma && cible ? _h`<div style=${{ marginTop:6, display:'flex', flexDirection:'column', gap:3 }}>
        <div style=${{ fontSize:15, fontWeight:800, color:'#38BDF8' }}>${b.dist ? '⏱ Temps cible : ' : '📏 Distance cible : '}${cible}${(rMax > 1 || b.reps > 1) ? ' / rép.' : ''}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)' }}>Vitesse ${vMin}–${vMax} km/h · allure ${kmPace(vMax)}–${kmPace(vMin)} /km</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.7)', fontWeight:600 }}>👉 ${action}</div>
      </div>` : null}
    </div>`;
  });
  const hasRange = blocs.some(b => (b.repsMax || b.reps) !== b.reps);
  const totTxt = totDist > 0 ? (hasRange ? fmtDistEndu(totDist) + ' à ' + fmtDistEndu(totDistMax) : fmtDistEndu(totDist)) : '';
  const noteTxt = (s.notes || '').replace(/^\s*\d+(?:-\d+)?\s*(fois|pyramides?|s[ée]ries?|circuits?|tours?)\s*(—|-)?\s*/i, '').trim();
  return _h`<div style=${{ background:'rgba(34,211,238,.05)', border:'1px solid rgba(34,211,238,.22)', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:8 }}>
      <div style=${{ fontSize:10, fontWeight:800, color:'#22D3EE', letterSpacing:1, textTransform:'uppercase' }}>🏃 Ce que tu dois faire${rep ? ' — ' + rep[1] + ' ' + (/pyramide/i.test(rep[2]) ? (parseInt(rep[1]) > 1 ? 'pyramides' : 'pyramide') : 'fois') : ''}</div>
      ${extra || null}
    </div>
    ${rows}
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:2, display:'flex', gap:10, flexWrap:'wrap' }}>
      ${totTxt ? _h`<span>📊 Volume ${hasRange ? '' : 'total '}: <b style=${{ color:'#fff' }}>${totTxt}</b></span>` : null}
      ${vma ? _h`<span style=${{ color:'rgba(255,255,255,.35)' }}>VMA ${vma} km/h</span>` : _h`<span>💡 Fais un test VMA pour voir tes temps cibles</span>`}
    </div>
    ${noteTxt ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:5, lineHeight:1.4 }}>💡 ${noteTxt}</div>` : null}
  </div>`;
}

function calcTempsSeance(seance, vma) {
  if (!vma || !seance.distance) return null;
  if (blocsEndu(seance).length) return null; // l'affichage calcule les temps en direct : notes intactes
  const pcts = {
    continu_ext:[70,75], continu_int:[80,85], interval:[95,105],
    fractionne:[105,115], spl:[75,100], recup_active:[55,65],
    piste_fond:[75,95], anaerobie_lactique:[95,110], anaerobie_alactique:[105,120],
    capacite_aerobie:[82,88]
  };
  const p = pcts[seance.type] || [80,90];
  const pctMin = p[0], pctMax = p[1];
  const vMin = Math.round(vma * pctMin / 100 * 10) / 10;
  const vMax = Math.round(vma * pctMax / 100 * 10) / 10;
  const toTime = (dist, v) => {
    const sec = Math.round(dist / v * 3.6);
    return sec >= 60 ? Math.floor(sec/60)+'min'+String(sec%60).padStart(2,'0') : sec+'s';
  };
  const val = seance.distance;
  const multiMatch = val.match(/(\d+)\s*[x×]\s*(\d+)\s*m/i);
  const singleMMatch = val.match(/^(\d+)\s*m$/i);
  const singleKMatch = val.match(/^([\d.]+)\s*km$/i);
  if (multiMatch) {
    const reps = parseInt(multiMatch[1]);
    const dist = parseInt(multiMatch[2]);
    return reps+'×'+dist+'m : '+toTime(dist, vMax)+'–'+toTime(dist, vMin)+'/rep ('+pctMin+'–'+pctMax+'% VMA '+vma+' km/h)';
  } else if (singleMMatch) {
    const dist = parseInt(singleMMatch[1]);
    return dist+'m : '+toTime(dist, vMax)+'–'+toTime(dist, vMin)+' ('+pctMin+'–'+pctMax+'% VMA)';
  } else if (singleKMatch) {
    const dist = parseFloat(singleKMatch[1]) * 1000;
    return singleKMatch[1]+'km : '+toTime(dist, vMax)+'–'+toTime(dist, vMin)+' ('+pctMin+'–'+pctMax+'% VMA)';
  }
  return null;
}

function EnduranceView({ player, setDb, isCoach, onSeanceDone, db: dbProp }) {
  // Toujours lire les séances depuis le store live pour éviter les props périmées
  // (même correctif que MuscuView — sans ça, une validation peut sembler ne pas s'enregistrer)
  const { db: liveDbEndu } = typeof useApp === 'function' ? useApp() : { db: null };
  const livePlayerEndu = liveDbEndu
    ? ((liveDbEndu.playersPerso||[]).find(p => p.id === player.id) ||
       (liveDbEndu.playerProfiles||[]).find(p => p.id === player.id) ||
       player)
    : player;
  const seances = livePlayerEndu.enduranceSeances || [];
  const [wellnessSeance, setWellnessSeance] = useState(null); // popup wellness endurance
  const [showDupePicker, setShowDupePicker] = useState(false); // sélecteur de joueurs pour dupliquer
  const [dupeSelected, setDupeSelected] = useState([]); // ids sélectionnés

  function saveSeances(newSeances) {
    // Sync Firebase
    if (window.__perfhand_db && player && player.id) {
      let safeSeances; try { safeSeances = JSON.parse(JSON.stringify(newSeances)); } catch(e) { safeSeances = newSeances; }
      const inProfiles = !!(livePlayerEndu.clubId);
      const path = inProfiles ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
      window.__perfhand_db.ref(path + player.id + '/enduranceSeances').set(safeSeances)
        .then(() => console.log('[enduranceSeances] ✅ écrit pour', player.name))
        .catch(e => { console.error('[enduranceSeances] ❌ échec:', e && e.code, e && e.message); alert('Erreur : la séance n\'a pas pu être enregistrée. Vérifie ta connexion et réessaie.'); });
    }
    setDb(d => ({
      ...d,
      playersPerso:   (d.playersPerso||[]).map(p => p.id===player.id ? {...p, enduranceSeances: newSeances} : p),
      playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, enduranceSeances: newSeances} : p),
    }));
  }

  const [showAdd, setShowAdd]     = useState(false);
  const [closedEndu, setClosedEndu] = useState(null);
  const [editS, setEditS]         = useState(null);
  const [showTests, setShowTests] = useState(false);
  const [sousOnglet, setSousOnglet] = useState('seances');
  const [modalite, setModalite]   = useState('course'); // 'course' | 'velo'
  const [showHistorique, setShowHistorique] = useState(false);
  const [expandedType, setExpandedType] = useState(null);
  const [filteredSemE, setFilteredSemE] = useState(null);
  const [form, setForm]           = useState({ nom:'', type:'continu_ext', duree:30, intensite:'70-75% FCmax', distance:'', fcCible:'', format:'30_30', series:8, notes:'', rpeCible:6, datePrevu:'', modalite:'course', recup:'' });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const typesFiltres = TYPES_CARDIO.filter(t => t.modalite === modalite || t.modalite === 'both');

  function saveSeance() {
    const s = { ...form, modalite, id: editS?.id || Date.now(), seqNum: editS ? editS.seqNum : seances.length+1, dateCreation: localDateStr() };
    saveSeances(editS ? seances.map(x=>x.id===editS.id?s:x) : [...seances, s]);
    setShowAdd(false); setEditS(null);
    setForm({ nom:'', type:'continu_ext', duree:30, intensite:'70-75% FCmax', distance:'', fcCible:'', format:'30_30', series:8, notes:'', rpeCible:6, datePrevu:'', modalite:'course', recup:'' });
  }

  function deleteSeance(id) { if(confirm('Supprimer ?')) saveSeances(seances.filter(s=>s.id!==id)); }

  function markSeanceFaite(id) {
    saveSeances(seances.map(s => s.id===id ? {...s, dateFaite: localDateStr()} : s));
    if (onSeanceDone) setTimeout(() => onSeanceDone(), 100);
  }
  function startEdit(s) {
    const m = s.modalite || (s.type && s.type.startsWith('velo_') ? 'velo' : 'course');
    setModalite(m);
    setForm({...s, modalite: m});
    setEditS(s);
    setShowAdd(true);
  }

  const SOUS_TABS = isCoach
    ? [{ id:'seances', label:'Séances ('+seances.length+')' }, { id:'prog', label:'Programmer' }, { id:'echauff', label:'🔥 Échauff.' }, { id:'tests', label:'Tests terrain' }]
    : [{ id:'seances', label:'Mes séances ('+seances.length+')' }, { id:'echauff', label:'🔥 Échauff.' }, { id:'tests', label:'Tests' }];

  const tc = TYPES_CARDIO.find(t=>t.id===form.type) || TYPES_CARDIO[0];

  return _h`<div>
    <!-- Sous-onglets -->
    <div style=${{ display:'flex', gap:4, marginBottom:16, background:'rgba(255,255,255,.04)', borderRadius:10, padding:3 }}>
      ${SOUS_TABS.map(t => _h`<button key=${t.id}
        onClick=${()=>setSousOnglet(t.id)}
        style=${{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
          fontWeight:sousOnglet===t.id?700:400, background:sousOnglet===t.id?'rgba(255,255,255,.1)':'transparent',
          color:sousOnglet===t.id?'#fff':'rgba(255,255,255,.4)' }}>
        ${t.label}
      </button>`)}
    </div>

    <!-- SÉANCES -->
    ${sousOnglet === 'seances' && _h`<div>
      ${(() => {
        const today = localDateStr();
        const sorted = [...seances].sort((a,b) => (a.datePrevu||'9999') < (b.datePrevu||'9999') ? -1 : 1);

        if (isCoach) {
          const freshPlayer = dbProp
            ? ((dbProp.playerProfiles||[]).find(p => p.id === player.id) ||
               (dbProp.playersPerso||[]).find(p => p.id === player.id) || player)
            : player;
          return _h`<div>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
              <button class="btn btn-sm" onClick=${() => {
                const clubId = player.clubId || 'usm';
                const allProfiles = window.__perfhand_current_profiles || [];
                const targets = allProfiles.filter(p => (p.clubId || 'usm') === clubId && p.id !== player.id);
                if (!targets.length) { alert('Aucun autre joueur dans ce club.'); return; }
                setDupeSelected(targets.map(p => p.id)); // tous cochés par défaut
                setShowDupePicker(true);
              }}
              style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700 }}>
                📋 Dupliquer vers...
              </button>
              ${showDupePicker && (() => {
                const clubId = player.clubId || 'usm';
                const allProfiles = window.__perfhand_current_profiles || [];
                const targets = allProfiles.filter(p => (p.clubId || 'usm') === clubId && p.id !== player.id);
                return _h`<div style=${{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
                  onClick=${() => setShowDupePicker(false)}>
                  <div style=${{ background:'#161616', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:420, maxHeight:'80vh', display:'flex', flexDirection:'column' }}
                    onClick=${e => e.stopPropagation()}>
                    <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      <div style=${{ fontSize:13, fontWeight:700, marginBottom:2 }}>Dupliquer vers quels joueurs ?</div>
                      <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${seances.length} séances endurance de ${player.name}</div>
                    </div>
                    <div style=${{ padding:'8px 18px', display:'flex', gap:8 }}>
                      <button class="btn btn-sm" onClick=${() => setDupeSelected(targets.map(p=>p.id))}>Tout cocher</button>
                      <button class="btn btn-sm" onClick=${() => setDupeSelected([])}>Tout décocher</button>
                    </div>
                    <div style=${{ overflowY:'auto', padding:'4px 18px', flex:1 }}>
                      ${targets.map(p => _h`<label key=${p.id} style=${{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <input type="checkbox" checked=${dupeSelected.includes(p.id)}
                          onChange=${() => setDupeSelected(sel => sel.includes(p.id) ? sel.filter(id=>id!==p.id) : [...sel, p.id])}/>
                        <span style=${{ fontSize:12 }}>${p.name}</span>
                      </label>`)}
                    </div>
                    <div style=${{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:8 }}>
                      <button class="btn btn-sm" style=${{ flex:1 }} onClick=${() => setShowDupePicker(false)}>Annuler</button>
                      <button class="btn btn-sm btn-primary" style=${{ flex:1 }}
                        disabled=${dupeSelected.length===0}
                        onClick=${() => {
                          const selTargets = targets.filter(p => dupeSelected.includes(p.id));
                          if (!confirm('Dupliquer les ' + seances.length + ' séances endurance de ' + player.name + ' vers ' + selTargets.length + ' joueur(s) ?\n\nCeci écrasera leurs séances endurance existantes.')) return;
                          const now = Date.now();
                          const newSeances = seances.map((s, i) => ({ ...s, id: now + i }));
                          selTargets.forEach(p => {
                            if (window.__perfhand_db) {
                              window.__perfhand_db.ref('perfhand/playerProfiles/' + p.id + '/enduranceSeances').set(newSeances);
                            }
                          });
                          setDb(d => ({
                            ...d,
                            playerProfiles: (d.playerProfiles||[]).map(p =>
                              dupeSelected.includes(p.id) ? { ...p, enduranceSeances: newSeances } : p
                            )
                          }));
                          setShowDupePicker(false);
                          alert('✅ ' + seances.length + ' séances endurance dupliquées vers ' + selTargets.length + ' joueur(s) !');
                        }}>
                        Dupliquer vers ${dupeSelected.length} joueur(s)
                      </button>
                    </div>
                  </div>
                </div>`;
              })()}
              <div style=${{ display:'flex', gap:6 }}>
                ${(() => {
                  const vma = getPlayerVMA(freshPlayer);
                  const hasData = seances.some(s => s.distance || s.duree > 0);
                  if (!vma || !hasData) return null;
                  return _h`<button class="btn btn-sm" onClick=${() => {
                    const pcts = {
                      continu_ext:[70,75], continu_int:[80,85], interval:[95,105],
                      fractionne:[105,115], spl:[75,100], recup_active:[55,65],
                      piste_fond:[75,95], anaerobie_lactique:[95,110], anaerobie_alactique:[105,120],
                      capacite_aerobie:[82,88]
                    };
                    const toTime = (dist, v) => {
                      const sec = Math.round(dist / v * 3.6);
                      return sec >= 60 ? Math.floor(sec/60)+'min'+String(sec%60).padStart(2,'0') : sec+'s';
                    };
                    const updated = seances.map(s => {
                      const p = pcts[s.type] || [80,90];
                      const vMoy = Math.round(vma * (p[0]+p[1])/2 / 100 * 10) / 10;
                      const vMin = Math.round(vma * p[0] / 100 * 10) / 10;
                      const vMax = Math.round(vma * p[1] / 100 * 10) / 10;
                      let newNotes = s.notes;
                      let newDist = s.distance;
                      // 1. Si distance → calculer les temps
                      const temps = calcTempsSeance(s, vma);
                      if (temps) newNotes = temps;
                      // 2. Si durée mais pas distance → calculer la distance
                      if (!s.distance && s.duree && s.duree > 0) {
                        const distM = Math.round(vMoy * s.duree / 60 * 1000 / 100) * 100;
                        newDist = distM >= 1000
                          ? (Math.round(distM/100)/10) + ' km'
                          : distM + ' m';
                        newNotes = newDist + ' en ' + s.duree + 'min à ' + vMoy + ' km/h (' + p[0] + '-' + p[1] + '% VMA ' + vma + ' km/h)';
                      }
                      // 3. Si durée ET distance → recalculer les deux
                      if (s.distance && s.duree && s.duree > 0 && !temps) {
                        newNotes = s.duree + 'min à ' + vMoy + ' km/h (' + p[0] + '-' + p[1] + '% VMA) → ' + vMoy*s.duree/60 + ' km';
                      }
                      return { ...s, distance: newDist, notes: newNotes };
                    });
                    const updatedCount = updated.filter((s,i) =>
                      s.notes !== seances[i].notes || s.distance !== seances[i].distance
                    ).length;
                    if (!updatedCount) { alert('Aucune séance à recalculer (vérifier les durées et distances)'); return; }
                    saveSeances(updated);
                    alert('✅ ' + updatedCount + ' séances recalculées (VMA ' + vma + ' km/h)');
                  }}
                  style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', fontWeight:700 }}>
                    ⚡ Recalculer allures (VMA ${vma} km/h)
                  </button>`;
                })()}
                <button class="btn btn-primary btn-sm" onClick=${()=>setShowAdd(true)}>+ Séance endurance</button>
              </div>
            </div>
            ${seances.length === 0
              ? _h`<div style=${{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>Aucune séance planifiée.</div>`
              : (() => {
                // Grouper par semaine
                function getMonE(ds) {
                  const d = new Date(ds + 'T12:00:00');
                  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
                  const m = new Date(d); m.setDate(d.getDate() + diff);
                  return m.toISOString().slice(0,10);
                }
                const sansDateE = sorted.filter(s => !s.datePrevu);
                const avecDateE = sorted.filter(s => s.datePrevu);
                const bySemE = {};
                avecDateE.forEach(s => {
                  const m = getMonE(s.datePrevu);
                  if (!bySemE[m]) bySemE[m] = [];
                  bySemE[m].push(s);
                });
                const semKeysE = Object.keys(bySemE).sort();
                const firstMonE = semKeysE[0] || null;
                function semNumE(mon) {
                  if (!firstMonE) return 1;
                  return Math.round((new Date(mon) - new Date(firstMonE)) / (7*24*3600*1000)) + 1;
                }
                const displayedKeysE = filteredSemE ? semKeysE.filter(m => m === filteredSemE) : semKeysE;
                const displayedSansDatesE = filteredSemE ? [] : sansDateE;

                const renderCardE = s => {
                  const tc2 = TYPES_CARDIO.find(t=>t.id===s.type)||TYPES_CARDIO[0];
                  const isT = s.datePrevu === today;
                  const isP = s.datePrevu && s.datePrevu < today;
                  const isF = !!s.dateFaite;
                  const border = isF ? 'rgba(76,175,80,.25)' : isT ? 'rgba(255,164,32,.4)' : isP ? 'rgba(255,68,85,.2)' : tc2.color+'25';
                  // Allures calculées depuis la VMA du joueur (toujours fraîche depuis db)
                  const freshPlayer = dbProp
                    ? ((dbProp.playerProfiles||[]).find(p => p.id === player.id) ||
                       (dbProp.playersPerso||[]).find(p => p.id === player.id) || player)
                    : player;
                  const vma = getPlayerVMA(freshPlayer);
                  const allures = vma ? (() => {
                    const pcts = {
                      continu_ext: [70,75], continu_int: [80,85], interval: [95,105],
                      fractionne: [105,115], spl: [75,100], recup_active: [55,65],
                      piste_fond: [75,95], anaerobie_lactique: [95,110], anaerobie_alactique: [105,120],
                      capacite_aerobie: [82,88]
                    };
                    let p = pcts[s.type] || [70,80];
                    // Le pourcentage exact de la variante choisie (ex: "400m @ 90-95% VMA") est stocké
                    // dans s.distance sous forme de texte — on le parse en priorité, car il est plus
                    // précis que la fourchette générique par type (qui mélange 800m/400m/200m par ex.)
                    const txt = (s.distance || '') + ' ' + (s.notes || '');
                    const rangeMatch = txt.match(/(\d+)\s*-\s*(\d+)\s*%/);
                    const singleMatch = !rangeMatch && txt.match(/(\d+)\s*%/);
                    if (rangeMatch) {
                      p = [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
                    } else if (singleMatch) {
                      const v = parseInt(singleMatch[1]);
                      p = [v, v];
                    }
                    return calcAlluRes(vma, p[0], p[1]);
                  })() : null;
                  // Nombre de répétitions extrait des notes (ex: "8-10 reps", "5-8 reps") — c'est
                  // l'info la plus essentielle à l'exécution d'un fractionné, on la met en avant
                  // au lieu de la laisser perdue dans le texte de la consigne.
                  const repsMatch = (s.notes||'').match(/(\d+(?:-\d+)?)\s*reps?\b/i);
                  const repsCount = repsMatch ? repsMatch[1] : null;
                  const isInterval = !!repsCount || (s.distance && /@/.test(s.distance));
                  const blocsP = blocsEndu(s);
                  return _h`<div key=${s.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+border, borderRadius:12, padding:'12px 14px', marginBottom:8, marginLeft:8, opacity:isF?.65:1 }}>
                    <!-- Ligne 1 : titre + date, toujours en haut -->
                    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                      <div style=${{ fontSize:13, fontWeight:800, flex:1, minWidth:0 }}>${s.nom || tc2.label}</div>
                      <div style=${{ display:'flex', gap:5, flexShrink:0, alignItems:'center' }}>
                        ${s.datePrevu ? _h`<span style=${{ fontSize:10, padding:'2px 9px', borderRadius:20, fontWeight:700, whiteSpace:'nowrap',
                          background: isF ? 'rgba(76,175,80,.12)' : isT ? 'rgba(255,164,32,.15)' : isP ? 'rgba(255,68,85,.1)' : 'rgba(56,189,248,.1)',
                          color: isF ? '#4CAF50' : isT ? '#FFA420' : isP ? '#FF6B6B' : '#38BDF8' }}>
                          ${isF ? '✓ Faite' : isT ? '⚡ Auj.' : isP ? '⚠ Passée' : '📅'} ${s.datePrevu}
                        </span>` : null}
                        <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', padding:'3px 8px' }} onClick=${()=>startEdit(s)}>✏️</button>
                        <button class="btn btn-sm btn-danger" style=${{ padding:'3px 8px' }} onClick=${()=>deleteSeance(s.id)}>×</button>
                      </div>
                    </div>

                    ${blocsP.length ? PisteBlocsEl(s, vma, blocsP, s.rpeCible ? _h`<span style=${{ fontSize:11, padding:'2px 9px', borderRadius:20, background:'rgba(255,164,32,.12)', color:'#FFA420', fontWeight:700 }}>RPE ${s.rpeCible}/10</span>` : null) : _h`<div>
                    <!-- Ligne 2 : structure de la séance — l'info essentielle, en gros, tout de suite visible -->
                    <div style=${{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:9, marginBottom: (allures || s.notes) ? 8 : 0 }}>
                      <span style=${{ fontSize:16 }}>${s.modalite==='velo'?'🚴':'🏃'}</span>
                      ${isInterval ? _h`<div style=${{ display:'flex', alignItems:'baseline', gap:6, flexWrap:'wrap' }}>
                        ${repsCount ? _h`<span style=${{ fontSize:18, fontWeight:800, color:'#7C6FFF' }}>${repsCount}×</span>` : null}
                        <span style=${{ fontSize:14, fontWeight:700, color:'#fff' }}>${s.distance || (s.duree+'min')}</span>
                        ${s.recup ? _h`<span style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>/ ${s.recup}</span>` : null}
                      </div>` : _h`<div style=${{ display:'flex', alignItems:'baseline', gap:8, flexWrap:'wrap' }}>
                        ${s.duree ? _h`<span style=${{ fontSize:18, fontWeight:800, color:'#fff' }}>${s.duree} min</span>` : null}
                        ${s.distance ? _h`<span style=${{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,.5)' }}>· ${s.distance}</span>` : null}
                      </div>`}
                      ${s.rpeCible ? _h`<span style=${{ fontSize:11, padding:'2px 9px', borderRadius:20, background:'rgba(255,164,32,.12)', color:'#FFA420', fontWeight:700, marginLeft:'auto' }}>RPE ${s.rpeCible}/10</span>` : null}
                    </div>

                    <!-- Ligne 3 : allure cible personnalisée -->
                    ${allures ? _h`<div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.15)', borderRadius:8, padding:'6px 10px', marginBottom: s.notes ? 8 : 0 }}>
                      <div style=${{ fontSize:9, color:'#38BDF8', fontWeight:800, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>
                        🎯 Allure cible (VMA ${vma} km/h)
                      </div>
                      <div style=${{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        <span style=${{ fontSize:13, color:'#fff', fontWeight:800 }}>${allures.vMin}–${allures.vMax} km/h</span>
                        <span style=${{ fontSize:12, color:'rgba(255,255,255,.55)', fontWeight:600 }}>${allures.paceMax}–${allures.paceMin} /km</span>
                      </div>
                    </div>` : vma ? null : _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', marginBottom: s.notes?8:0, fontStyle:'italic' }}>💡 Fais un test VMA pour voir tes allures personnalisées</div>`}
                    </div>`}

                    <!-- Ligne 4 : métadonnées secondaires (type de séance) + consigne -->
                    <div style=${{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style=${{ fontSize:9, color:tc2.color, fontWeight:700 }}>${tc2.icon} ${tc2.label}</span>
                    </div>
                    ${(s.notes && !blocsP.length) ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:4, lineHeight:1.4 }}>💡 ${s.notes}</div>` : null}
                  </div>`;
                };

                return _h`<div>
                  <!-- Filtre semaines endurance -->
                  ${semKeysE.length > 1 ? _h`<div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                    <button onClick=${() => setFilteredSemE(null)}
                      style=${{
                        padding:'5px 12px', borderRadius:20,
                        border: filteredSemE===null ? '2px solid #FFA420' : '1px solid rgba(255,255,255,.12)',
                        background: filteredSemE===null ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)',
                        color: filteredSemE===null ? '#FFA420' : 'rgba(255,255,255,.4)',
                        fontWeight: filteredSemE===null ? 800 : 500, fontSize:11, cursor:'pointer', fontFamily:'Inter,sans-serif'
                      }}>Toutes (${semKeysE.length})</button>
                    ${semKeysE.map(mon => {
                      const sNum = semNumE(mon);
                      const venDt = new Date(mon+'T12:00:00'); venDt.setDate(venDt.getDate()+6);
                      const isCurr = today >= mon && today <= venDt.toISOString().slice(0,10);
                      const ok = bySemE[mon].filter(s => s.dateFaite).length;
                      const tot = bySemE[mon].length;
                      const isSel = filteredSemE === mon;
                      return _h`<button key=${mon} onClick=${() => setFilteredSemE(isSel ? null : mon)}
                        style=${{
                          padding:'5px 12px', borderRadius:20,
                          border: isSel ? '2px solid '+(isCurr?'#FFA420':'#38BDF8') : '1px solid rgba(255,255,255,.1)',
                          background: isSel ? (isCurr?'rgba(255,164,32,.15)':'rgba(56,189,248,.1)') : 'rgba(255,255,255,.03)',
                          color: isSel ? (isCurr?'#FFA420':'#38BDF8') : 'rgba(255,255,255,.4)',
                          fontWeight: isSel ? 800 : 500, fontSize:11, cursor:'pointer', fontFamily:'Inter,sans-serif',
                          display:'flex', alignItems:'center', gap:5
                        }}>
                        S${sNum}${isCurr?' ⚡':''}
                        <span style=${{ fontSize:9, opacity:.7 }}>${ok}/${tot}</span>
                      </button>`;
                    })}
                  </div>` : null}

                  ${displayedSansDatesE.length > 0 ? _h`<div style=${{ marginBottom:14 }}>
                    <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style=${{ fontSize:10, fontWeight:800, color:'rgba(255,68,85,.7)', textTransform:'uppercase', letterSpacing:1.5 }}>⚠ Sans date</div>
                      <div style=${{ flex:1, height:1, background:'rgba(255,68,85,.15)' }}></div>
                    </div>
                    ${displayedSansDatesE.map(s => renderCardE(s))}
                  </div>` : null}
                  ${displayedKeysE.map(mon => {
                    const ss  = bySemE[mon];
                    const ok  = ss.filter(s => s.dateFaite).length;
                    const tot = ss.length;
                    const pct = Math.round(ok / tot * 100);
                    const venDt  = new Date(mon+'T12:00:00'); venDt.setDate(venDt.getDate() + 6);
                    const venStr = venDt.toISOString().slice(0,10);
                    const isCurr = today >= mon && today <= venStr;
                    const isPastW = venStr < today;
                    const hCol   = isCurr ? '#FFA420' : isPastW ? 'rgba(255,255,255,.3)' : '#38BDF8';
                    const lunLbl = new Date(mon+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
                    const venLbl = venDt.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
                    return _h`<div key=${mon} style=${{ marginBottom:14 }}>
                      <div style=${{ background: isCurr?'rgba(255,164,32,.05)':'rgba(255,255,255,.02)',
                        border:'1px solid '+(isCurr?'rgba(255,164,32,.25)':isPastW?'rgba(255,255,255,.07)':'rgba(56,189,248,.15)'),
                        borderRadius:12, padding:'10px 14px', marginBottom:8 }}>
                        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                          <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style=${{ fontSize:14, fontWeight:800, color:hCol, fontFamily:"'Barlow Condensed',sans-serif" }}>S${semNumE(mon)} ${isCurr?'⚡':''}</span>
                            <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${lunLbl} → ${venLbl}</span>
                          </div>
                          <span style=${{ fontSize:11, fontWeight:700, color: ok===tot?'#4CAF50':hCol }}>
                            ${ok}/${tot}${ok===tot?' ✓':''}
                          </span>
                        </div>
                        <div style=${{ height:3, background:'rgba(255,255,255,.07)', borderRadius:3, overflow:'hidden' }}>
                          <div style=${{ height:'100%', width:pct+'%', background: ok===tot?'#4CAF50':hCol, borderRadius:3 }}></div>
                        </div>
                      </div>
                      ${ss.map(s => renderCardE(s))}
                    </div>`;
                  })}
                </div>`;
              })()}
          </div>`;
        }

        // ── VUE JOUEUR ──
        const seancesToday      = sorted.filter(s => !s.dateFaite && s.datePrevu === today);
        const seancesARattraper = sorted.filter(s => !s.dateFaite && s.datePrevu && s.datePrevu < today).sort((a,b)=>a.datePrevu>b.datePrevu?-1:1);
        const seancesNext       = sorted.filter(s => !s.dateFaite && s.datePrevu > today);
        const seancesArch       = sorted.filter(s => s.dateFaite).reverse();

        return _h`<div>
          ${seancesToday.length === 0
            ? _h`<div style=${{ textAlign:'center', padding:'28px 16px', color:'rgba(255,255,255,.3)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)', marginBottom:16 }}>
                <div style=${{ fontSize:28, marginBottom:8 }}>🏃</div>
                <div style=${{ fontWeight:700, marginBottom:4 }}>Pas de séance aujourd'hui</div>
                ${seancesNext.length > 0 ? _h`<div style=${{ fontSize:12, color:'#FFA420', marginTop:6 }}>
                  Prochaine : ${new Date(seancesNext[0].datePrevu+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                </div>` : null}
              </div>`
            : seancesToday.map(s => {
                const tc2 = TYPES_CARDIO.find(t=>t.id===s.type)||TYPES_CARDIO[0];
                const blocsT = blocsEndu(s);
                const vmaT = getPlayerVMA(livePlayerEndu);
                return _h`<div key=${s.id} style=${{ background:tc2.color+'08', border:'2px solid '+tc2.color+'50', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
                  <div style=${{ fontSize:10, fontWeight:800, color:tc2.color, letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>⚡ Séance du jour</div>
                  <div style=${{ fontSize:16, fontWeight:800, marginBottom:6 }}>${s.nom||tc2.label}</div>
                  <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                    <span style=${{ fontSize:11, background:tc2.color+'15', color:tc2.color, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>${tc2.icon} ${tc2.label}</span>
                    <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>${s.modalite==='velo'?'🚴 Vélo':'🏃 Course'}</span>
                    ${s.duree ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>⏱ ${s.duree} min</span>` : null}
                    ${(s.distance && !blocsT.length) ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>📏 ${s.distance}</span>` : null}
                    ${(s.intensite && !blocsT.length) ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>💓 ${s.intensite}</span>` : null}
                    ${(s.recup && !blocsT.length) ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>⏱ Récup: ${s.recup}</span>` : null}
                  </div>
                  ${blocsT.length ? PisteBlocsEl(s, vmaT, blocsT, null) : null}
                  ${(s.notes && !blocsT.length) ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.6)', background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px', marginBottom:10 }}>💡 ${s.notes}</div>` : null}
                  <button class="btn btn-primary" style=${{ width:'100%' }}
                    onClick=${()=>{ setWellnessSeance(s); }}>
                    ✅ Séance terminée
                  </button>
                </div>`;
              })}

          ${seancesARattraper.length > 0 ? _h`<div style=${{ marginTop:16 }}>
            <div style=${{ fontSize:11, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10, color:'#FF6B35' }}>⚠ À rattraper (${seancesARattraper.length})</div>
            ${seancesARattraper.map(s => {
              const tc2 = TYPES_CARDIO.find(t=>t.id===s.type)||TYPES_CARDIO[0];
              const open = closedEndu !== s.id;
              const setOpen = (v) => setClosedEndu(open ? s.id : null);
              const blocsN = blocsEndu(s);
              const vmaN = getPlayerVMA(livePlayerEndu);
              return _h`<div key=${s.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,107,53,.3)', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
                <div style=${{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick=${()=>setOpen(o=>!o)}>
                  <div>
                    <div style=${{ fontSize:13, fontWeight:700 }}>${s.nom||tc2.label}</div>
                    <div style=${{ fontSize:11, color:'#FF6B35', marginTop:2 }}>
                      ${new Date(s.datePrevu+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                    </div>
                  </div>
                  <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style=${{ fontSize:12, color:tc2.color }}>${tc2.icon} ${s.duree?s.duree+' min':''}</span>
                    <span style=${{ color:'rgba(255,255,255,.3)', fontSize:11 }}>${open?'▲':'▼'}</span>
                  </div>
                </div>
                ${open ? _h`<div style=${{ padding:'0 14px 12px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
                  ${(tc2.protocole && tc2.protocole.objectif) ? _h`<div style=${{ fontSize:11, color:'#38BDF8', marginTop:10, fontWeight:600 }}>🎯 Objectif</div><div style=${{ fontSize:12, color:'rgba(255,255,255,.65)', marginTop:3, lineHeight:1.6 }}>${tc2.protocole.objectif}</div>` : null}
                  ${(tc2.protocole && tc2.protocole.structure && tc2.protocole.structure.length) ? _h`<div style=${{ marginTop:12 }}>
                    <div style=${{ fontSize:11, color:'#FFA420', fontWeight:700, marginBottom:8, textTransform:'uppercase' }}>📋 Déroulé de la séance</div>
                    ${tc2.protocole.structure.map((ph, pi) => _h`<div key=${pi} style=${{ background:'rgba(255,255,255,.03)', borderRadius:8, padding:'10px 12px', marginBottom:6, borderLeft:'3px solid #38BDF8' }}>
                      <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style=${{ fontSize:12, fontWeight:700, color:'#fff' }}>${ph.phase||''}</span>
                        <span style=${{ fontSize:11, color:'#38BDF8', fontWeight:600 }}>${ph.duree||''}</span>
                      </div>
                      <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.5 }}>${ph.detail||''}</div>
                    </div>`)}
                  </div>` : null}
                  ${(tc2.protocole && tc2.protocole.allures) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:8, padding:'8px 10px', background:'rgba(56,189,248,.06)', borderRadius:8 }}>⏱️ Allures : ${tc2.protocole.allures}</div>` : null}
                  ${(tc2.protocole && tc2.protocole.notes) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:8, fontStyle:'italic', padding:'8px 10px', background:'rgba(255,255,255,.02)', borderRadius:8 }}>💡 ${tc2.protocole.notes}</div>` : null}
                  ${blocsN.length ? _h`<div style=${{ marginTop:10 }}>${PisteBlocsEl(s, vmaN, blocsN, null)}</div>` : null}
                  ${(s.intensite && !blocsN.length) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:8 }}>Intensité : <span style=${{ color:tc2.color, fontWeight:700 }}>${s.intensite}</span></div>` : null}
                  ${s.description ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:6, lineHeight:1.5 }}>${s.description}</div>` : null}
                  ${s.rpeCible ? _h`<div style=${{ fontSize:11, color:'#FFA420', marginTop:6 }}>RPE cible : ${s.rpeCible}/10</div>` : null}
                  ${s.fcCible ? _h`<div style=${{ fontSize:11, color:'#FF4455', marginTop:4 }}>FC cible : ${s.fcCible} bpm</div>` : null}
                  ${(s.notes && !blocsN.length) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:6, fontStyle:'italic' }}>${s.notes}</div>` : null}
                  <button class="btn btn-primary btn-sm" style=${{ marginTop:10, width:'100%' }}
                    onClick=${()=>{ setWellnessSeance(s); }}>✅ Faite aujourd'hui</button>
                </div>` : null}
              </div>`;
            })}
          </div>` : null}

          ${seancesNext.length > 0 ? _h`<div style=${{ marginTop:16 }}>
            <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Prochaines séances</div>
            ${seancesNext.slice(0,5).map(s => {
              const tc2 = TYPES_CARDIO.find(t=>t.id===s.type)||TYPES_CARDIO[0];
              const open = closedEndu !== s.id;
              const setOpen = (v) => setClosedEndu(open ? s.id : null);
              const blocsN = blocsEndu(s);
              const vmaN = getPlayerVMA(livePlayerEndu);
              return _h`<div key=${s.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
                <div style=${{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }} onClick=${()=>setOpen(o=>!o)}>
                  <div>
                    <div style=${{ fontSize:13, fontWeight:700 }}>${s.nom||tc2.label}</div>
                    <div style=${{ fontSize:11, color:'#38BDF8', marginTop:2 }}>
                      ${new Date(s.datePrevu+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                    </div>
                  </div>
                  <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style=${{ fontSize:12, color:tc2.color }}>${tc2.icon} ${s.duree?s.duree+' min':''}</span>
                    <span style=${{ color:'rgba(255,255,255,.3)', fontSize:11 }}>${open?'▲':'▼'}</span>
                  </div>
                </div>
                ${open ? _h`<div style=${{ padding:'0 14px 12px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
                  ${(tc2.protocole && tc2.protocole.objectif) ? _h`<div style=${{ fontSize:11, color:'#38BDF8', marginTop:10, fontWeight:600 }}>🎯 Objectif</div><div style=${{ fontSize:12, color:'rgba(255,255,255,.65)', marginTop:3, lineHeight:1.6 }}>${tc2.protocole.objectif}</div>` : null}
                  ${(tc2.protocole && tc2.protocole.structure && tc2.protocole.structure.length) ? _h`<div style=${{ marginTop:12 }}>
                    <div style=${{ fontSize:11, color:'#FFA420', fontWeight:700, marginBottom:8, textTransform:'uppercase' }}>📋 Déroulé de la séance</div>
                    ${tc2.protocole.structure.map((ph, pi) => _h`<div key=${pi} style=${{ background:'rgba(255,255,255,.03)', borderRadius:8, padding:'10px 12px', marginBottom:6, borderLeft:'3px solid #38BDF8' }}>
                      <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style=${{ fontSize:12, fontWeight:700, color:'#fff' }}>${ph.phase||''}</span>
                        <span style=${{ fontSize:11, color:'#38BDF8', fontWeight:600 }}>${ph.duree||''}</span>
                      </div>
                      <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.5 }}>${ph.detail||''}</div>
                    </div>`)}
                  </div>` : null}
                  ${(tc2.protocole && tc2.protocole.allures) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:8, padding:'8px 10px', background:'rgba(56,189,248,.06)', borderRadius:8 }}>⏱️ Allures : ${tc2.protocole.allures}</div>` : null}
                  ${(tc2.protocole && tc2.protocole.notes) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:8, fontStyle:'italic', padding:'8px 10px', background:'rgba(255,255,255,.02)', borderRadius:8 }}>💡 ${tc2.protocole.notes}</div>` : null}
                  ${blocsN.length ? _h`<div style=${{ marginTop:10 }}>${PisteBlocsEl(s, vmaN, blocsN, null)}</div>` : null}
                  ${(s.intensite && !blocsN.length) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:8 }}>Intensité : <span style=${{ color:tc2.color, fontWeight:700 }}>${s.intensite}</span></div>` : null}
                  ${s.description ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:6, lineHeight:1.5 }}>${s.description}</div>` : null}
                  ${s.rpeCible ? _h`<div style=${{ fontSize:11, color:'#FFA420', marginTop:6 }}>RPE cible : ${s.rpeCible}/10</div>` : null}
                  ${s.fcCible ? _h`<div style=${{ fontSize:11, color:'#FF4455', marginTop:4 }}>FC cible : ${s.fcCible} bpm</div>` : null}
                  ${(s.notes && !blocsN.length) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:6, fontStyle:'italic' }}>${s.notes}</div>` : null}
                  <button class="btn btn-primary btn-sm" style=${{ marginTop:10, width:'100%' }}
                    onClick=${()=>{ setWellnessSeance(s); }}>✅ Faite aujourd'hui</button>
                </div>` : null}
              </div>`;
            })}
          </div>` : null}

          ${seancesArch.length > 0 ? _h`<div style=${{ marginTop:16 }}>
            <button onClick=${()=>setShowHistorique(h=>!h)}
              style=${{ width:'100%', padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,.08)',
                background:'rgba(255,255,255,.03)', color:'rgba(255,255,255,.4)', cursor:'pointer',
                fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600 }}>
              ${showHistorique?'▲':'▼'} Historique (${seancesArch.length} séance${seancesArch.length>1?'s':''} faite${seancesArch.length>1?'s':''})
            </button>
            ${showHistorique ? seancesArch.map(s => {
              const tc2 = TYPES_CARDIO.find(t=>t.id===s.type)||TYPES_CARDIO[0];
              return _h`<div key=${s.id} style=${{ background:'rgba(76,175,80,.03)', border:'1px solid rgba(76,175,80,.12)', borderRadius:12, padding:'12px 14px', marginTop:8 }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <div style=${{ fontSize:13, fontWeight:700 }}>${s.nom||tc2.label}</div>
                    <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${s.datePrevu||''} · ${tc2.icon} ${tc2.label}</div>
                  </div>
                  <span style=${{ fontSize:10, padding:'2px 9px', borderRadius:20, background:'rgba(76,175,80,.15)', color:'#4CAF50', fontWeight:700, flexShrink:0 }}>✓ ${s.dateFaite}</span>
                </div>
                ${(s.rpeReel || s.fatigue || s.notesJoueur) ? _h`<div style=${{ background:'rgba(56,189,248,.05)', border:'1px solid rgba(56,189,248,.12)', borderRadius:8, padding:'8px 10px', marginTop:6 }}>
                  <div style=${{ fontSize:10, fontWeight:800, color:'#38BDF8', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>📊 Bilan du joueur</div>
                  <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    ${s.rpeReel ? _h`<span style=${{ fontSize:11, background:'rgba(255,164,32,.12)', color:'#FFA420', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>RPE ${s.rpeReel}/10</span>` : null}
                    ${s.fatigue ? _h`<span style=${{ fontSize:11, background:'rgba(255,122,0,.1)', color:'#FF7A00', borderRadius:6, padding:'2px 8px' }}>Fatigue ${s.fatigue}/5</span>` : null}
                    ${s.energie ? _h`<span style=${{ fontSize:11, background:'rgba(76,175,80,.1)', color:'#4CAF50', borderRadius:6, padding:'2px 8px' }}>Énergie ${s.energie}/5</span>` : null}
                    ${s.sommeil ? _h`<span style=${{ fontSize:11, background:'rgba(100,150,255,.1)', color:'#6496FF', borderRadius:6, padding:'2px 8px' }}>Sommeil ${s.sommeil}/5</span>` : null}
                    ${s.douleurs ? _h`<span style=${{ fontSize:11, background:'rgba(255,68,85,.1)', color:'#FF4455', borderRadius:6, padding:'2px 8px' }}>Douleurs ${s.douleurs}/5</span>` : null}
                  </div>
                  ${s.notesJoueur ? _h`<div style=${{ fontSize:12, color:'#38BDF8', marginTop:6, fontStyle:'italic' }}>💬 « ${s.notesJoueur} »</div>` : _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', marginTop:4, fontStyle:'italic' }}>Aucune note du joueur</div>`}
                </div>` : _h`<div style=${{ fontSize:10, color:'rgba(255,68,85,.4)', marginTop:4, fontStyle:'italic' }}>⚠️ Bilan wellness non renseigné</div>`}
              </div>`;
            }) : null}
          </div>` : null}
        </div>`;
      })()}
    </div>`}
    <!-- Popup wellness endurance (obligatoire) -->
    ${wellnessSeance ? React.createElement(WellnessPopup, {
      seance: wellnessSeance,
      obligatoire: true,
      mode: 'bilan',
      onClose: () => setWellnessSeance(null),
      onSubmit: (data) => {
        saveSeances(seances.map(s => s.id === wellnessSeance.id
          ? { ...s, dateFaite: localDateStr(), wellness: data, ...data }
          : s
        ));
        // Alimente automatiquement le Bilan de charge équipe (plus besoin du formulaire Terrain à part)
        if (data.rpeReel) {
          const dureeEstim = wellnessSeance.duree || 45;
          const bilan = {
            id: Date.now(), date: localDateStr(), type: 'Endurance',
            typeSeance: wellnessSeance.nom || 'Endurance',
            duree: dureeEstim, rpe: data.rpeReel,
            chargeSession: dureeEstim * data.rpeReel,
            fatigue: data.fatigue || 3, zonesActives: [],
            impactArticulaire: { epaule:0, genou:0, cheville:0, lombaires:0 },
            notes: data.notesJoueur || '',
          };
          setDb(d => ({
            ...d,
            playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, bilans:[...(p.bilans||[]), bilan]} : p),
            playersPerso: (d.playersPerso||[]).map(p => p.id===player.id ? {...p, bilans:[...(p.bilans||[]), bilan]} : p),
          }));
        }
        setWellnessSeance(null);
        if (onSeanceDone) setTimeout(() => onSeanceDone(), 150);
      }
    }) : null}

    <!-- PROGRAMMER -->
    ${sousOnglet === 'prog' && isCoach && _h`<div>
      <!-- Séances déjà programmées -->
      ${seances.filter(s => !s.dateFaite).length > 0 ? _h`<div style=${{ marginBottom:20 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>
          Séances programmées (${seances.filter(s=>!s.dateFaite).length})
        </div>
        ${[...seances.filter(s=>!s.dateFaite)].sort((a,b)=>a.datePrevu>b.datePrevu?1:-1).map(s => {
          const tc2 = TYPES_CARDIO.find(t=>t.id===s.type)||TYPES_CARDIO[0];
          return _h`<div key=${s.id} style=${{ background:tc2.color+'08', border:'1px solid '+tc2.color+'30', borderRadius:12, padding:'11px 14px', marginBottom:7, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style=${{ flex:1 }}>
              <div style=${{ fontSize:13, fontWeight:700 }}>${s.nom||tc2.label}</div>
              <div style=${{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                <span style=${{ fontSize:10, color:tc2.color, fontWeight:700 }}>${tc2.icon} ${tc2.label}</span>
                ${s.datePrevu ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>
                  ${new Date(s.datePrevu+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                </span>` : null}
                ${s.duree ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>⏱ ${s.duree}min</span>` : null}
                ${s.rpeCible ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>RPE ${s.rpeCible}</span>` : null}
              </div>
            </div>
            <div style=${{ display:'flex', gap:5, flexShrink:0 }}>
              <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', padding:'3px 8px' }}
                onClick=${()=>startEdit(s)}>✏️</button>
              <button class="btn btn-sm btn-danger" style=${{ padding:'3px 8px' }}
                onClick=${()=>deleteSeance(s.id)}>×</button>
            </div>
          </div>`;
        })}
      </div>` : null}

      <!-- Toggle course / vélo -->
      <div style=${{ display:'flex', gap:8, marginBottom:16 }}>
        <button onClick=${()=>setModalite('course')}
          style=${{ flex:1, padding:'9px', borderRadius:10, border:'2px solid '+(modalite==='course'?'#FFA420':'rgba(255,255,255,.1)'),
            background:modalite==='course'?'rgba(255,164,32,.1)':'rgba(255,255,255,.03)',
            color:modalite==='course'?'#FFA420':'rgba(255,255,255,.4)', fontWeight:modalite==='course'?800:500,
            cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12 }}>
          🏃 Course à pied
        </button>
        <button onClick=${()=>setModalite('velo')}
          style=${{ flex:1, padding:'9px', borderRadius:10, border:'2px solid '+(modalite==='velo'?'#38BDF8':'rgba(255,255,255,.1)'),
            background:modalite==='velo'?'rgba(56,189,248,.1)':'rgba(255,255,255,.03)',
            color:modalite==='velo'?'#38BDF8':'rgba(255,255,255,.4)', fontWeight:modalite==='velo'?800:500,
            cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12 }}>
          🚴 Vélo
        </button>
      </div>
      ${typesFiltres.map(t => {
        const expanded = expandedType === t.id;
        return _h`<div key=${t.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+t.color+'25', borderRadius:12, padding:'12px 16px', marginBottom:8 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style=${{ flex:1, cursor:'pointer' }} onClick=${()=>setExpandedType(expanded ? null : t.id)}>
              <div style=${{ fontSize:13, fontWeight:700 }}>${t.icon} ${t.label}</div>
              <div style=${{ fontSize:11, color:t.color, marginTop:2 }}>${t.desc}</div>
            </div>
            <div style=${{ display:'flex', gap:6, alignItems:'center', flexShrink:0, marginLeft:8 }}>
              <button style=${{ background:'none', border:'1px solid rgba(255,255,255,.1)', borderRadius:6, color:'rgba(255,255,255,.4)', fontSize:11, padding:'3px 8px', cursor:'pointer' }}
                onClick=${()=>setExpandedType(expanded ? null : t.id)}>${expanded ? '▲' : '▼'}</button>
              ${!t.protocole?.formats_detail ? _h`<button class="btn btn-sm btn-primary"
                onClick=${()=>{
                  upd('type',t.id); upd('nom',t.label); upd('intensite',t.protocole?.intensite||t.desc);
                  upd('modalite',modalite); upd('distance',''); upd('recup','');
                  setShowAdd(true);
                }}>
                + Créer
              </button>` : _h`<span style=${{ fontSize:9, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>Choisir un format ↓</span>`}
            </div>
          </div>
          ${expanded && t.protocole ? _h`<div style=${{ marginTop:12, borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:12 }}>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:8, lineHeight:1.6 }}>
              <span style=${{ color:t.color, fontWeight:700 }}>Objectif : </span>${t.protocole.objectif}
            </div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:10, lineHeight:1.6 }}>
              <span style=${{ color:'rgba(255,255,255,.6)', fontWeight:700 }}>Intensite : </span>${t.protocole.intensite}
            </div>
            ${t.protocole.structure ? _h`<div style=${{ marginBottom:10 }}>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Structure</div>
              ${t.protocole.structure.map((ph, pi) => _h`<div key=${pi} style=${{ display:'grid', gridTemplateColumns:'80px 60px 1fr', gap:6, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:11 }}>
                <div style=${{ color:t.color, fontWeight:700 }}>${ph.phase}</div>
                <div style=${{ color:'rgba(255,255,255,.5)' }}>${ph.duree}</div>
                <div style=${{ color:'rgba(255,255,255,.5)', lineHeight:1.5 }}>${ph.detail}</div>
              </div>`)}
            </div>` : null}
            ${t.protocole.formats_detail ? _h`<div style=${{ marginBottom:10 }}>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Formats disponibles — choisis celui à créer</div>
              ${t.protocole.formats_detail.map((f, fi) => _h`<div key=${fi} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid '+t.color+'20', borderRadius:8, padding:'7px 10px', marginBottom:5 }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3, gap:8 }}>
                  <span style=${{ fontSize:12, fontWeight:800, color:t.color }}>${f.nom}</span>
                  <div style=${{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    <span style=${{ fontSize:10, color:'rgba(255,255,255,.5)' }}>${f.series}</span>
                    <button class="btn btn-sm btn-primary" style=${{ padding:'3px 10px', fontSize:10 }}
                      onClick=${()=>{
                        const repsMatch = (f.series||'').match(/(\d+)/);
                        upd('type', t.id);
                        upd('nom', t.label + ' — ' + f.nom);
                        upd('intensite', t.protocole.intensite);
                        upd('modalite', modalite);
                        upd('distance', f.travail);
                        upd('recup', f.repos);
                        upd('series', repsMatch ? parseInt(repsMatch[1]) : 8);
                        upd('notes', f.series + ' — ' + f.note);
                        upd('duree', 0);
                        setShowAdd(true);
                      }}>
                      + Créer
                    </button>
                  </div>
                </div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${f.travail} / repos ${f.repos}</div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:3, lineHeight:1.5 }}>💡 ${f.note}</div>
              </div>`)}
            </div>` : null}
            ${t.protocole.allures ? _h`<div style=${{ fontSize:10, background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:7, padding:'6px 10px', marginBottom:6, color:'#FFA420' }}>
              📏 ${t.protocole.allures}
            </div>` : null}
            ${(() => {
              const freshPlayer2 = dbProp
                ? ((dbProp.playerProfiles||[]).find(p => p.id === player.id) ||
                   (dbProp.playersPerso||[]).find(p => p.id === player.id) || player)
                : player;
              const vma = getPlayerVMA(freshPlayer2);
              if (!vma) return _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.2)', fontStyle:'italic', marginBottom:6 }}>
                💡 Effectue un test VMA (demi-Cooper ou 30-15 IFT) pour voir tes allures personnalisées
              </div>`;
              const pcts = {
                continu_ext:[70,75], continu_int:[80,85], interval:[95,105],
                fractionne:[105,115], spl:[75,100], recup_active:[55,65],
                piste_fond:[75,95], anaerobie_lactique:[95,110], anaerobie_alactique:[105,120],
                capacite_aerobie:[82,88]
              };
              const p = pcts[t.id] || [70,80];
              const a = calcAlluRes(vma, p[0], p[1]);
              if (!a) return null;
              // Calculer aussi les temps sur distances clés
              const distTargets = [200, 400, 800, 1000, 1600];
              const toTime = (dist, v) => {
                const sec = Math.round(dist / v * 3.6);
                return sec >= 60 ? Math.floor(sec/60)+'min'+String(sec%60).padStart(2,'0') : sec+'s';
              };
              return _h`<div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
                <div style=${{ fontSize:10, fontWeight:800, color:'#38BDF8', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>
                  🎯 Tes allures personnalisées (VMA ${vma} km/h)
                </div>
                <div style=${{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                  <div style=${{ background:'rgba(56,189,248,.1)', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
                    <div style=${{ fontSize:14, fontWeight:800, color:'#38BDF8' }}>${a.vMin}–${a.vMax}</div>
                    <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)' }}>km/h</div>
                  </div>
                  <div style=${{ background:'rgba(56,189,248,.1)', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
                    <div style=${{ fontSize:14, fontWeight:800, color:'#38BDF8' }}>${a.paceMax}–${a.paceMin}</div>
                    <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)' }}>allure</div>
                  </div>
                </div>
                <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  ${distTargets.map(d => _h`<div key=${d} style=${{ background:'rgba(255,255,255,.04)', borderRadius:6, padding:'4px 8px', textAlign:'center', minWidth:52 }}>
                    <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.8)' }}>${toTime(d, a.vMin)}–${toTime(d, a.vMax)}</div>
                    <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${d>=1000?d/1000+'km':d+'m'}</div>
                  </div>`)}
                </div>
              </div>`;
            })()}
            ${t.protocole.notes ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', lineHeight:1.6 }}>💡 ${t.protocole.notes}</div>` : null}
          </div>` : null}
        </div>`;
      })}
    </div>`}

    ${sousOnglet === 'echauff' && React.createElement(EchauffEnduranceView)}

    <!-- TESTS TERRAIN -->
    ${sousOnglet === 'tests' && _h`<div>
      <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
        <div style=${{ fontSize:12, fontWeight:700, color:'#38BDF8', marginBottom:6 }}>📊 Saisir un test terrain</div>
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
          ${TESTS_ENDURANCE_DB.map(test => _h`<button key=${test.id}
            onClick=${() => setShowTests({ testId: test.id })}
            style=${{
              padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
              border:'1px solid '+test.color+'40', background:test.color+'10', color:test.color
            }}>${test.icon} ${test.nom}</button>`)}
        </div>
      </div>

      ${(() => {
        const allTests = [...(player.testsEndurance||[]), ...(player.tests||[])];
        const fmtDate = d => { try { return new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}); } catch(e) { return d; } };
        if (!allTests.length) return _h`<div style=${{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
          Aucun test enregistré.
        </div>`;
        return _h`<div>
          ${[...allTests].reverse().map((t, i, arr) =>
            React.createElement(TestCard, { key: t.id||i, t, i, prev: arr[i+1], player, setDb, isCoach: false, fmtDate, setShowTests })
          )}
        </div>`;
      })()}
    </div>`}

    <!-- MODAL TESTS -->
    ${showTests && React.createElement(TestPhysiqueForm, { player, setDb, editData: typeof showTests==='object' ? showTests : null, onClose: () => setShowTests(false) })}

    <!-- MODAL AJOUT/EDIT -->
    ${showAdd && (() => {
      const freshPlayer = dbProp
        ? ((dbProp.playerProfiles||[]).find(p => p.id === player.id) ||
           (dbProp.playersPerso||[]).find(p => p.id === player.id) || player)
        : player;
      return _h`<div class="edit-modal-bg" onClick=${()=>{setShowAdd(false);setEditS(null);}}>
      <div class="edit-modal" style=${{ maxWidth:520 }} onClick=${e=>e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>${editS?'Modifier la séance':'Nouvelle séance endurance'}</div>
          <button onClick=${()=>{setShowAdd(false);setEditS(null);}} style=${{ background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:20,cursor:'pointer' }}>x</button>
        </div>
        <div class="edit-modal-body">
          <!-- Sélecteur modalité -->
          <div style=${{ marginBottom:16 }}>
            <div class="lbl" style=${{ marginBottom:8 }}>Modalité</div>
            <div style=${{ display:'flex', gap:8 }}>
              <button onClick=${()=>{ setModalite('course'); upd('type','continu_ext'); upd('modalite','course'); }}
                style=${{ flex:1, padding:'10px', borderRadius:10, border:'2px solid '+(modalite==='course'?'#FFA420':'rgba(255,255,255,.1)'),
                  background:modalite==='course'?'rgba(255,164,32,.1)':'rgba(255,255,255,.03)',
                  color:modalite==='course'?'#FFA420':'rgba(255,255,255,.4)', fontWeight:modalite==='course'?800:500,
                  cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:13, transition:'all .15s' }}>
                🏃 Course à pied
              </button>
              <button onClick=${()=>{ setModalite('velo'); upd('type','velo_continu_ext'); upd('modalite','velo'); }}
                style=${{ flex:1, padding:'10px', borderRadius:10, border:'2px solid '+(modalite==='velo'?'#38BDF8':'rgba(255,255,255,.1)'),
                  background:modalite==='velo'?'rgba(56,189,248,.1)':'rgba(255,255,255,.03)',
                  color:modalite==='velo'?'#38BDF8':'rgba(255,255,255,.4)', fontWeight:modalite==='velo'?800:500,
                  cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:13, transition:'all .15s' }}>
                🚴 Vélo
              </button>
            </div>
          </div>
          <div style=${{ marginBottom:12 }}>
            <div class="lbl">Nom de la séance</div>
            <input class="inp" value=${form.nom} onInput=${e=>upd('nom',e.target.value)} placeholder=${modalite==='velo'?'Ex: Sortie vélo 1h, Tabata vélo...':'Ex: Fartlek 30min, VMA 30/30...'}/>
          </div>
          <div style=${{ marginBottom:12 }}>
            <div class="lbl">Type de séance</div>
            <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
              ${typesFiltres.map(t => _h`<button key=${t.id}
                onClick=${()=>{
                  const DEFAULTS_TYPE = {
                    continu_ext:         { duree:45, intensite:'70-75% FCmax', nom:'Endurance fondamentale', rpeCible:5 },
                    continu_int:         { duree:30, intensite:'80-85% FCmax', nom:'Continu intensif seuil', rpeCible:7 },
                    interval:            { duree:40, intensite:'95-100% VMA', nom:'Intervalles VMA 30/30', rpeCible:8 },
                    fractionne:          { duree:35, intensite:'> 100% VMA', nom:'Fractionné court PAM', rpeCible:9 },
                    spl:                 { duree:30, intensite:'70-100% selon phase', nom:'SPL Spécifique Handball', rpeCible:7 },
                    recup_active:        { duree:25, intensite:'< 65% FCmax', nom:'Récupération active', rpeCible:3 },
                    piste_fond:          { duree:45, intensite:'75-95% VMA', nom:'Séance piste 800-400-200', rpeCible:7 },
                    anaerobie_lactique:  { duree:40, intensite:'> 95% FCmax', nom:'Anaérobie lactique', rpeCible:9 },
                    anaerobie_alactique: { duree:30, intensite:'100% - Vitesse max', nom:'Vitesse alactique', rpeCible:8 },
                    capacite_aerobie:    { duree:35, intensite:'85-90% FCmax', nom:'Capacité aérobie seuil', rpeCible:7 },
                    velo_continu_ext:    { duree:60, intensite:'65-70% FCmax', nom:'Vélo endurance fondamentale', rpeCible:4 },
                    velo_interval:       { duree:45, intensite:'90-100% VMA', nom:'Vélo intervalles', rpeCible:8 },
                    velo_recup:          { duree:30, intensite:'< 60% FCmax', nom:'Vélo récupération active', rpeCible:3 },
                  };
                  const d = DEFAULTS_TYPE[t.id];
                  if (d) setForm(f => ({
                    ...f, type: t.id,
                    nom: d.nom,
                    duree: d.duree,
                    intensite: d.intensite,
                    rpeCible: d.rpeCible,
                  }));
                  else upd('type', t.id);
                }}
                style=${{ padding:'5px 10px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
                  border:'1px solid '+(form.type===t.id?t.color:'rgba(255,255,255,.1)'),
                  background:form.type===t.id?t.color+'15':'rgba(255,255,255,.04)',
                  color:form.type===t.id?t.color:'rgba(255,255,255,.4)', fontWeight:form.type===t.id?700:400 }}>${t.icon} ${t.label}</button>`)}
            </div>
          </div>
          ${(() => {
            const currentType = TYPES_CARDIO.find(tt => tt.id === form.type);
            const fd = currentType?.protocole?.formats_detail;
            if (!fd) return null;
            return _h`<div style=${{ marginBottom:12 }}>
              <div class="lbl">Format — choisis celui utilisé pour cette séance</div>
              <div style=${{ display:'flex', flexDirection:'column', gap:5, marginTop:6 }}>
                ${fd.map((f, fi) => _h`<button key=${fi}
                  onClick=${()=>{
                    const repsMatch = (f.series||'').match(/(\d+)/);
                    upd('distance', f.travail);
                    upd('recup', f.repos);
                    upd('series', repsMatch ? parseInt(repsMatch[1]) : 8);
                    upd('notes', f.series + ' — ' + f.note);
                    upd('duree', 0);
                  }}
                  style=${{ textAlign:'left', padding:'7px 10px', borderRadius:8, cursor:'pointer', fontFamily:'Inter,sans-serif',
                    border:'1px solid '+(form.distance===f.travail ? currentType.color : 'rgba(255,255,255,.1)'),
                    background: form.distance===f.travail ? currentType.color+'12' : 'rgba(255,255,255,.03)' }}>
                  <div style=${{ display:'flex', justifyContent:'space-between' }}>
                    <span style=${{ fontSize:12, fontWeight:800, color: form.distance===f.travail ? currentType.color : '#fff' }}>${f.nom}</span>
                    <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${f.series}</span>
                  </div>
                  <div style=${{ fontSize:10.5, color:'rgba(255,255,255,.4)', marginTop:2 }}>${f.travail} / repos ${f.repos}</div>
                </button>`)}
              </div>
            </div>`;
          })()}
          <div class="edit-row">
            <div>
              <div class="lbl">Durée (min)</div>
              <input class="inp" type="number" value=${form.duree} onInput=${e => {
                const duree = parseInt(e.target.value) || 0;
                upd('duree', duree);
                // Calculer la distance selon la durée + VMA + type
                const vma = getPlayerVMA(freshPlayer);
                if (!vma || !duree) return;
                const pcts = {
                  continu_ext:[70,75], continu_int:[80,85], interval:[95,105],
                  fractionne:[105,115], spl:[75,100], recup_active:[55,65],
                  piste_fond:[75,95], anaerobie_lactique:[95,110], anaerobie_alactique:[105,120],
                  capacite_aerobie:[82,88]
                };
                const p = pcts[form.type] || [80,90];
                const vMoy = Math.round(vma * (p[0]+p[1])/2 / 100 * 10) / 10;
                const distM = Math.round(vMoy * duree / 60 * 1000 / 100) * 100; // arrondi 100m
                const distKm = Math.round(distM / 100) / 10;
                const distStr = distM >= 1000 ? distKm + ' km' : distM + ' m';
                upd('_distCalculee', distStr + ' (à ' + vMoy + ' km/h, ' + p[0] + '-' + p[1] + '% VMA)');
              }}/>
              ${form._distCalculee ? _h`<div style=${{ marginTop:4, fontSize:10, color:'#4CAF50', background:'rgba(76,175,80,.06)', border:'1px solid rgba(76,175,80,.2)', borderRadius:6, padding:'4px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 }}>
                <span>📏 ${form._distCalculee}</span>
                <button onClick=${() => {
                  const match = form._distCalculee.match(/^([\d.]+ (?:km|m))/);
                  if (match) upd('distance', match[1]);
                }} style=${{ background:'rgba(76,175,80,.2)', border:'none', color:'#4CAF50', borderRadius:4, padding:'2px 6px', cursor:'pointer', fontSize:10, fontWeight:700 }}>→ Utiliser</button>
              </div>` : null}
            </div>
            <div style=${{ position:'relative' }}>
              <div class="lbl">Distance</div>
              <input class="inp" value=${form.distance} onInput=${e => {
                const val = e.target.value;
                upd('distance', val);
                // Parser le format NxDm et calculer les temps cibles
                const vma = getPlayerVMA(freshPlayer);
                if (!vma || !val) { upd('_tempsCalcules', null); return; }
                // Détecter le % VMA selon le type de séance
                const pcts = {
                  continu_ext:[70,75], continu_int:[80,85], interval:[95,105],
                  fractionne:[105,115], spl:[75,100], recup_active:[55,65],
                  piste_fond:[75,95], anaerobie_lactique:[95,110], anaerobie_alactique:[105,120],
                  capacite_aerobie:[82,88]
                };
                const p = pcts[form.type] || [80,90];
                const pctMin = p[0], pctMax = p[1];
                const vMin = Math.round(vma * pctMin / 100 * 10) / 10;
                const vMax = Math.round(vma * pctMax / 100 * 10) / 10;
                // Parser les distances
                const toTime = (dist, v) => {
                  const sec = Math.round(dist / v * 3.6);
                  return sec >= 60 ? Math.floor(sec/60)+'min'+String(sec%60).padStart(2,'0') : sec+'s';
                };
                // Formats: 3x1000m, 5×400m, 7×200m, 1000m, 5km
                const multiMatch = val.match(/(\d+)\s*[x×]\s*(\d+)\s*m/i);
                const singleMMatch = val.match(/^(\d+)\s*m$/i);
                const singleKMatch = val.match(/^([\d.]+)\s*km$/i);
                let calcText = null;
                if (multiMatch) {
                  const reps = parseInt(multiMatch[1]);
                  const dist = parseInt(multiMatch[2]);
                  const tMin = toTime(dist, vMax);
                  const tMax = toTime(dist, vMin);
                  calcText = reps+'×'+dist+'m : '+tMin+'–'+tMax+'/rep ('+pctMin+'–'+pctMax+'% VMA '+vma+' km/h)';
                } else if (singleMMatch) {
                  const dist = parseInt(singleMMatch[1]);
                  calcText = dist+'m : '+toTime(dist, vMax)+'–'+toTime(dist, vMin)+' ('+pctMin+'–'+pctMax+'% VMA)';
                } else if (singleKMatch) {
                  const dist = parseFloat(singleKMatch[1]) * 1000;
                  calcText = singleKMatch[1]+'km : '+toTime(dist, vMax)+'–'+toTime(dist, vMin)+' ('+pctMin+'–'+pctMax+'% VMA)';
                }
                upd('_tempsCalcules', calcText);
                if (calcText) upd('notes', calcText);
              }} placeholder="Ex: 5km, 3×1000m, 7×200m..."/>
              ${form._tempsCalcules ? _h`<div style=${{ marginTop:4, fontSize:10, color:'#38BDF8', background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.15)', borderRadius:6, padding:'4px 8px' }}>
                🎯 ${form._tempsCalcules}
              </div>` : null}
            </div>
          </div>
          <div class="edit-row">
            <div><div class="lbl">Intensité / FC cible</div><input class="inp" value=${form.intensite} onInput=${e=>upd('intensite',e.target.value)} placeholder="Ex: 75-80% FCmax"/></div>
            <div><div class="lbl">Date prévue</div><input class="inp" type="date" value=${form.datePrevu} onInput=${e=>upd('datePrevu',e.target.value)}/></div>
          </div>
          <div style=${{ marginBottom:12 }}>
            <div class="lbl">Récupération (entre les répétitions)</div>
            <input class="inp" value=${form.recup||''} onInput=${e=>upd('recup',e.target.value)}
              placeholder="Ex: 2min, 90s, récup active 400m..." style=${{ fontSize:13 }}/>
          </div>
          <div style=${{ marginBottom:12 }}>
            <div class="lbl">RPE cible (1-10)</div>
            <input type="range" min="1" max="10" value=${form.rpeCible} onInput=${e=>upd('rpeCible',parseInt(e.target.value))}
              style=${{ width:'100%', accentColor:'#38BDF8' }}/>
            <div style=${{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,.3)' }}>
              <span>1 - Très facile</span><span style=${{ color:'#38BDF8', fontWeight:700 }}>RPE ${form.rpeCible}</span><span>10 - Max</span>
            </div>
          </div>
          <div><div class="lbl">Notes / consignes</div><textarea class="inp" value=${form.notes} onInput=${e=>upd('notes',e.target.value)} style=${{ resize:'vertical', minHeight:50 }} placeholder="Consignes, terrain, matériel..."></textarea></div>
        </div>
        <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${()=>{setShowAdd(false);setEditS(null);}}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2, background:'rgba(56,189,248,.15)', border:'1px solid rgba(56,189,248,.4)', color:'#38BDF8' }} onClick=${saveSeance}>
            ${editS?'Enregistrer':'Créer la séance'}
          </button>
        </div>
      </div>
    </div>`;
    })()}
  </div>`;
}
