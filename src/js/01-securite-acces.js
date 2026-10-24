function localDateStr(d) {
  const dt = d || new Date();
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
}

// ── CODES D'ACCÈS JOUEUR ─────────────────────────────────────────────────────
// Avant : Math.random() (prévisible) + .set() direct — si le même code sortait deux fois, le
// nouveau joueur ÉCRASAIT silencieusement le code d'un autre joueur, qui ne pouvait plus se
// connecter. Ici : tirage cryptographique + vérification que le code est libre avant écriture.
// Format inchangé (6 chiffres) pour ne rien changer côté joueurs.
function tirerCode6() {
  try {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return String(100000 + (buf[0] % 900000));
  } catch(e) {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
// autresChemins : emplacements supplémentaires où le code doit aussi être libre (ex: index global).
async function genererCodeAcces(basePath, data, autresChemins) {
  const db = window.__perfhand_db;
  if (!db) throw new Error('Base de données non disponible');
  for (let i = 0; i < 8; i++) {
    const code = tirerCode6();
    let libre = true;
    for (const chemin of [basePath, ...(autresChemins || [])]) {
      try { if ((await db.ref(chemin + code).once('value')).exists()) { libre = false; break; } }
      catch(e) {} // lecture refusée par les règles : on garde l'ancien comportement
    }
    if (!libre) continue;
    await db.ref(basePath + code).set(data);
    return code;
  }
  throw new Error('Impossible de générer un code libre, réessaie.');
}

// Fusion d'une fiche perso reçue de Firebase avec la copie locale (extrait tel quel de l'écouteur
// playersPerso, pour être réutilisé par l'écouteur de la fiche individuelle d'un joueur).
function fusionnerPersoDistant(local, remote) {
  // Normalize muscuSeances: Firebase stores arrays as objects {0:{...},1:{...}} quand il y a
  // des trous (ex: un élément supprimé au milieu) — même souci pour tous les champs de type
  // liste, pas seulement muscu/endurance. On les normalise tous ici, sinon un champ comme
  // testsEndurance peut arriver en objet et faire échouer silencieusement tout code qui
  // s'attend à un tableau (.filter/.find/.map), ce qui faisait disparaître les tests VMA.
  function toArr(v) {
    if (!v) return null;
    return Array.isArray(v) ? v : Object.values(v).filter(Boolean);
  }
  let muscuSeances = toArr(remote.muscuSeances);
  let enduranceSeances = toArr(remote.enduranceSeances);
  const testsEndurance = toArr(remote.testsEndurance) || [];
  const tests = toArr(remote.tests) || [];
  const customRM = toArr(remote.customRM) || [];
  const wellnessCheckins = (remote.wellnessCheckins && typeof remote.wellnessCheckins === 'object' && !Array.isArray(remote.wellnessCheckins))
    ? remote.wellnessCheckins : (toArr(remote.wellnessCheckins) || {});
  // Remote wins, but keep local seances if remote has none (prevents data loss on first load)
  return {
    ...local,
    ...remote,
    muscuSeances: (muscuSeances && muscuSeances.length > 0) ? muscuSeances : (local.muscuSeances || []),
    enduranceSeances: (enduranceSeances && enduranceSeances.length > 0) ? enduranceSeances : (local.enduranceSeances || []),
    testsEndurance: testsEndurance.length > 0 ? testsEndurance : (local.testsEndurance || []),
    tests: tests.length > 0 ? tests : (local.tests || []),
    customRM: customRM.length > 0 ? customRM : (local.customRM || []),
    wellnessCheckins: (wellnessCheckins && Object.keys(wellnessCheckins).length > 0) ? wellnessCheckins : (local.wellnessCheckins || {}),
  };
}

// ── INDEX D'ACCÈS (lus par les règles de sécurité Firebase) ──────────────────
// Les règles ne savent pas chercher dans une liste : pour savoir « cet email est-il un coach/staff ? »
// ou « quelle fiche appartient à cet email ? », elles lisent ces index, clés = email avec '.' → ','.
//   acces/equipe/{email}         = true                    (coachs + staff : accès complet)
//   acces/joueurs/{email}        = { type:'club'|'perso', id }
//   acces/joueursTenant/{email}  = { tenantId, playerId }
// Reconstruits par l'admin à chaque connexion, complétés par l'équipe au fil des ajouts.
const ADMIN_EMAIL = 'leo.chabanis@gmail.com';
function cleEmail(e) {
  const k = String(e || '').replace(/\s/g, '').toLowerCase().replace(/\./g, ',');
  return (k && !/[$#\[\]\/]/.test(k)) ? k : null;
}
function emailAutoJoueur(p) { // même règle que resolveRole (prénom@player.fr)
  return String(p && p.name || '').split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@player.fr';
}
function enTableau(v) { return !v ? [] : (Array.isArray(v) ? v : Object.values(v)).filter(Boolean); }
function calculerIndexAcces({ clubs, staffAccounts, playerProfiles, playersPerso, tenants }) {
  const equipe = {}, joueurs = {}, joueursTenant = {};
  enTableau(clubs).forEach(c => { const k = cleEmail(c && c.coach && c.coach.email); if (k) equipe[k] = true; });
  enTableau(staffAccounts).forEach(st => { const k = cleEmail(st.email); if (k) equipe[k] = true; });
  enTableau(playersPerso).forEach(p => { const k = cleEmail(p.email); if (k && p.id) joueurs[k] = { type: 'perso', id: p.id }; });
  enTableau(playerProfiles).forEach(p => { // club après perso : même priorité que resolveRole
    if (!p.id) return;
    const k = cleEmail(p.email) || cleEmail(emailAutoJoueur(p));
    if (k) joueurs[k] = { type: 'club', id: p.id };
  });
  Object.entries(tenants || {}).forEach(([tid, t]) => {
    enTableau(t && t.playersPerso).forEach(p => { const k = cleEmail(p.email); if (k && p.id) joueursTenant[k] = { tenantId: tid, playerId: p.id }; });
  });
  return { equipe, joueurs, joueursTenant };
}
// Admin : reconstruction complète depuis Firebase (retire aussi les accès supprimés).
async function reconstruireIndexAcces() {
  const fdb = window.__perfhand_db;
  if (!fdb) return;
  try {
    const lire = chemin => fdb.ref(chemin).once('value').then(s => s.val());
    const [clubs, staffAccounts, playerProfiles, playersPerso, tenants] = await Promise.all([
      lire('perfhand/clubs'), lire('perfhand/staffAccounts'), lire('perfhand/playerProfiles'), lire('perfhand/playersPerso'), lire('tenants')]);
    const idx = calculerIndexAcces({ clubs, staffAccounts, playerProfiles, playersPerso, tenants });
    // Garde-fou : si une lecture a échoué silencieusement et ne renvoie rien, on n'efface pas l'index existant.
    if (!Object.keys(idx.equipe).length && !Object.keys(idx.joueurs).length) { console.warn('[index accès] rien à indexer — ignoré'); return; }
    await fdb.ref('acces').set(idx);
    console.log('[index accès] reconstruit :', Object.keys(idx.equipe).length, 'équipe,', Object.keys(idx.joueurs).length, 'joueurs,', Object.keys(idx.joueursTenant).length, 'joueurs tenant');
  } catch (e) { console.warn('[index accès] échec :', e && e.message); }
}
// Coach/staff : ajoute les nouveaux membres et joueurs connus localement (n'enlève jamais rien).
function completerIndexAcces(db) {
  const fdb = window.__perfhand_db;
  if (!fdb || !db) return;
  const idx = calculerIndexAcces({ clubs: db.clubs, staffAccounts: db.staffAccounts, playerProfiles: db.playerProfiles, playersPerso: db.playersPerso });
  const maj = {};
  Object.entries(idx.equipe).forEach(([k, v]) => { maj['equipe/' + k] = v; });
  Object.entries(idx.joueurs).forEach(([k, v]) => { maj['joueurs/' + k] = v; });
  if (Object.keys(maj).length) fdb.ref('acces').update(maj).catch(e => console.warn('[index accès] complément refusé :', e && e.message));
}
// Préparateur (tenant) : indexe l'email de ses joueurs.
function indexerJoueursTenant(tenantId, playersPerso) {
  const fdb = window.__perfhand_db;
  if (!fdb || !tenantId) return;
  enTableau(playersPerso).forEach(p => {
    const k = cleEmail(p.email);
    if (k && p.id) fdb.ref('acces/joueursTenant/' + k).set({ tenantId, playerId: p.id }).catch(() => {});
  });
}

// ── SESSIONS PAR CODE ─────────────────────────────────────────────────────────
// Un joueur connecté par code est un utilisateur Firebase ANONYME. Pour que les règles sachent à
// quelle fiche il a droit, on enregistre codeSessions/{uid} = { code, playerId } — les règles
// n'acceptent cette écriture que si le code existe vraiment et désigne bien ce joueur.
async function sessionFirebaseCourante() {
  const a = window.__perfhand_auth;
  if (!a) return null;
  if (a.currentUser) return a.currentUser;
  try { await a.signInAnonymously(); } catch (e) { return null; }
  return a.currentUser;
}
async function lierCodeClub(code, playerId, clubId) {
  const u = await sessionFirebaseCourante();
  if (!u || !window.__perfhand_db) return false;
  await window.__perfhand_db.ref('perfhand/codeSessions/' + u.uid).set({ code, playerId, clubId: clubId || null, date: new Date().toISOString() });
  return true;
}
async function lierCodeTenant(code, tenantId, playerId) {
  const u = await sessionFirebaseCourante();
  if (!u || !window.__perfhand_db) return false;
  await window.__perfhand_db.ref('tenantCodeSessions/' + u.uid).set({ code, tenantId, playerId, date: new Date().toISOString() });
  return true;
}

// Rôle d'un compte email retrouvé via les index (la liste complète des joueurs n'étant plus
// lisible par tous). Renvoie null si rien trouvé.
async function chercherRoleParIndex(fbUser) {
  const fdb = window.__perfhand_db, email = fbUser && fbUser.email, k = cleEmail(email);
  if (!fdb || !k) return null;
  const lire = chemin => fdb.ref(chemin).once('value').then(s => s.val()).catch(() => null);
  const clubs = enTableau(await lire('perfhand/clubs'));
  const club = clubs.find(c => c && c.coach && (c.coach.email || '').toLowerCase() === email.toLowerCase());
  if (club) return { role: 'coach', name: club.coach.name, email, clubId: club.id, uid: fbUser.uid };
  const j = await lire('acces/joueurs/' + k);
  if (j && j.id) {
    const chemin = (j.type === 'perso' ? 'perfhand/playersPerso/' : 'perfhand/playerProfiles/') + j.id;
    const fiche = await lire(chemin);
    if (fiche) return { role: j.type === 'perso' ? 'perso' : 'player', name: fiche.name, email, playerId: j.id, uid: fbUser.uid };
  }
  return null;
}

// ── INDEX DES CODES TENANT ────────────────────────────────────────────────────
// tenantCodes/{code} = tenantId. Permet de retrouver un code joueur SANS télécharger tous les
// tenants (avant : la page de connexion lisait la base de tous les préparateurs pour trouver un code).
function indexerCodesTenant(tenantId, codes) {
  const fdb = window.__perfhand_db;
  if (!fdb || !tenantId || !codes || typeof codes !== 'object') return;
  Object.keys(codes).forEach(code => {
    const r = fdb.ref('tenantCodes/' + code);
    r.once('value').then(s => { if (!s.exists()) r.set(tenantId).catch(() => {}); }).catch(() => {});
  });
}
async function indexerTousLesCodesTenants() {
  const fdb = window.__perfhand_db;
  if (!fdb) return;
  try {
    const ts = (await fdb.ref('tenants').once('value')).val() || {};
    Object.entries(ts).forEach(([tid, t]) => { if (t && t.codes) indexerCodesTenant(tid, t.codes); });
  } catch(e) { console.warn('[index codes] impossible:', e && e.message); }
}

// ── MOTS DE PASSE : JAMAIS STOCKÉS ───────────────────────────────────────────
// La connexion passe uniquement par Firebase Auth (qui stocke les mots de passe de façon sûre).
// Une copie en clair dans la base n'était qu'un pense-bête lisible par quiconque accède aux données :
// on retire systématiquement le champ "password" de tout ce qui est gardé en mémoire, en local et
// envoyé à Firebase. Renvoie le MÊME objet si rien n'est à retirer (évite des rendus inutiles).
function sansMdp(p) {
  if (!p || typeof p !== 'object' || !('password' in p)) return p;
  const { password, ...reste } = p;
  return reste;
}
function listeSansMdp(arr) {
  if (!Array.isArray(arr)) return arr;
  let change = false;
  const out = arr.map(p => { const q = sansMdp(p); if (q !== p) change = true; return q; });
  return change ? out : arr;
}
function dbSansMdp(d) {
  if (!d || typeof d !== 'object') return d;
  let out = d;
  ['playersPerso', 'playerProfiles', 'players', 'staffAccounts', 'staff'].forEach(k => {
    const v = listeSansMdp(d[k]);
    if (v !== d[k]) { if (out === d) out = { ...d }; out[k] = v; }
  });
  if (Array.isArray(d.clubs) && d.clubs.some(c => c && c.coach && 'password' in c.coach)) {
    if (out === d) out = { ...d };
    out.clubs = d.clubs.map(c => (c && c.coach && 'password' in c.coach) ? { ...c, coach: sansMdp(c.coach) } : c);
  }
  return out;
}

// Crée le compte de connexion Firebase Auth sur une instance SECONDAIRE (sinon l'admin serait
// déconnecté et remplacé par le nouveau compte). Ne lève jamais d'erreur : renvoie un statut.
async function creerCompteConnexion(email, password) {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return { ok:false, msg:'Firebase indisponible' };
  const nom = 'CreationCompte' + Date.now();
  let app2 = null;
  try {
    app2 = firebase.initializeApp(firebase.app().options, nom);
    await app2.auth().createUserWithEmailAndPassword(email, password);
    try { await app2.auth().signOut(); } catch(e) {}
    return { ok:true };
  } catch(e) {
    if (e && e.code === 'auth/email-already-in-use') return { ok:true, existait:true };
    if (e && e.code === 'auth/weak-password') return { ok:false, msg:'mot de passe trop court (6 caractères minimum)' };
    return { ok:false, msg:(e && e.message) || 'erreur inconnue' };
  } finally {
    if (app2) { try { await app2.delete(); } catch(e) {} }
  }
}

// Remplace l'affichage du mot de passe : le joueur reçoit un lien pour choisir le sien.
function envoyerReinitialisation(email) {
  if (!email) { alert('Aucun email renseigné pour ce profil.'); return; }
  if (!window.__perfhand_auth) { alert('Service de connexion indisponible.'); return; }
  if (!confirm('Envoyer à ' + email + ' un email pour (re)définir son mot de passe ?')) return;
  window.__perfhand_auth.sendPasswordResetEmail(email)
    .then(() => alert('Email envoyé à ' + email + '.\nLe joueur clique sur le lien pour choisir son mot de passe.'))
    .catch(e => alert(e && e.code === 'auth/user-not-found'
      ? 'Aucun compte de connexion n\'existe pour ' + email + '.'
      : 'Envoi impossible : ' + ((e && e.message) || e)));
}

// Nettoyage unique (lancé à la connexion de l'admin) : efface de Firebase les mots de passe
// stockés auparavant. Écriture ciblée champ par champ (null = suppression), rien d'autre n'est touché.
async function purgerMotsDePasseStockes() {
  const fdb = window.__perfhand_db;
  if (!fdb) return;
  try { if (localStorage.getItem('perfhand_purge_mdp_v1') === 'ok') return; } catch(e) {}
  try { localStorage.removeItem('perfhand_codes'); } catch(e) {} // anciens codes locaux (contenaient les mots de passe)
  const updates = {};
  const scan = async (chemin) => {
    try {
      const snap = await fdb.ref(chemin).once('value');
      const v = snap.val();
      if (v && typeof v === 'object') Object.entries(v).forEach(([k, p]) => {
        if (p && typeof p === 'object' && 'password' in p) updates[chemin + '/' + k + '/password'] = null;
      });
    } catch(e) { console.warn('[purge mdp] lecture impossible:', chemin, e && e.message); }
  };
  await scan('perfhand/playersPerso');
  await scan('perfhand/playerProfiles');
  await scan('perfhand/staffAccounts');
  try {
    const cs = (await fdb.ref('perfhand/clubs').once('value')).val();
    if (cs && typeof cs === 'object') Object.entries(cs).forEach(([k, c]) => {
      if (c && c.coach && 'password' in c.coach) updates['perfhand/clubs/' + k + '/coach/password'] = null;
    });
  } catch(e) {}
  try {
    const ts = (await fdb.ref('tenants').once('value')).val();
    if (ts && typeof ts === 'object') Object.entries(ts).forEach(([tid, t]) => {
      const pp = t && t.playersPerso;
      if (pp && typeof pp === 'object') Object.entries(pp).forEach(([k, p]) => {
        if (p && typeof p === 'object' && 'password' in p) updates['tenants/' + tid + '/playersPerso/' + k + '/password'] = null;
      });
    });
  } catch(e) {}
  const n = Object.keys(updates).length;
  if (n === 0) { try { localStorage.setItem('perfhand_purge_mdp_v1', 'ok'); } catch(e) {} return; }
  try {
    await fdb.ref().update(updates);
    try { localStorage.setItem('perfhand_purge_mdp_v1', 'ok'); } catch(e) {}
    console.log('[purge mdp] mots de passe effacés de la base :', n);
  } catch(e) {
    // Une écriture groupée échoue en bloc si UN chemin est refusé : on retente un par un.
    let ok = 0;
    for (const chemin of Object.keys(updates)) {
      try { await fdb.ref(chemin).remove(); ok++; } catch(err) {}
    }
    console.warn('[purge mdp] écriture groupée refusée, effacés un par un :', ok, '/', n);
    if (ok === n) { try { localStorage.setItem('perfhand_purge_mdp_v1', 'ok'); } catch(e) {} }
  }
}
