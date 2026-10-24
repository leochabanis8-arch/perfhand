

// ── STATS MATCH VIEW ──────────────────────────────────────────────────────────
const STATS_ATTAQUE = ['Duels gagnés','Passes clés','Buts','Tirs','Balle perdue','Neutralisé','Duels perdus'];
const CATEGORIES_TIR_LIVE = [
  { id:'loin',    label:'Tir de loin',           icon:'🎯', color:'#38BDF8' },
  { id:'ca',      label:'Contre-attaque',        icon:'⚡', color:'#4CAF50' },
  { id:'pivot',   label:'Tir de pivot',          icon:'🔴', color:'#FF4455' },
  { id:'ailier',  label:"Tir d'ailier",          icon:'📐', color:'#FFA420' },
  { id:'arriere', label:"Tir d'arrière extérieur", icon:'💪', color:'#7C6FFF' },
  { id:'duel',    label:'Duel',                  icon:'🤼', color:'#EC4899' },
  { id:'7m',      label:'Tir de 7m',             icon:'⚪', color:'#FFD54A' },
];
const STATS_DEFENSE = ['Duels perdus','Interceptions','Neutralisation','Contre','Balle récup','Duels gagnés'];
// NB : ces libellés servent AUSSI de clé de stockage Firebase (stats.situations_att[libellé]) —
// ils ne doivent donc jamais contenir '.', '#', '$', '/', '[' ou ']' (Firebase refuse ces
// caractères dans une clé). "CROISE ARR/ARR" contenait un "/" et empêchait TOUT enregistrement
// de match manuel de fonctionner (Firebase rejetait l'écriture entière, sans autre message avant
// l'ajout du filet de sécurité) — remplacé par un tiret.
const SITUATIONS_JEU_ATT = ['YAGO','TOURNE AUTOUR','YOUGO','ROTATION EXTERIEUR','RENTREE PVT','CROISE ARR-ARR','SUPERIORITE','INFERIORITE','GLISSE','2 PIVOTS'];
const SITUATIONS_JEU_DEF = ['1-5 HH','0-6 mixte','SUPERIORITE','INFERIORITE','Espace 1-2','Tir de loin'];
const GRAND_ESPACE      = ['Contre attaque','Montée de balle','Repli'];

// ── STATS LIVE DÉFENSE — visuel de terrain, tap pour noter chaque but encaissé ──
const CRITERES_LIVE_DEF = [
  { id:'tir_loin',    label:'Tir de loin',           icon:'🎯', color:'#FFA420' },
  { id:'contre_att',  label:'Contre-attaque',        icon:'⚡', color:'#FF4455' },
  { id:'tir_pivot',   label:'Tir de pivot',          icon:'🔵', color:'#7C6FFF' },
  { id:'tir_ailier',  label:'Tir d\'ailier',         icon:'↗️', color:'#38BDF8' },
  { id:'tir_arriere', label:'Tir d\'arrière ext.',   icon:'🔻', color:'#4CAF50' },
  { id:'duel',        label:'Duel (1c1)',            icon:'⚔️', color:'#EC4899' },
  { id:'sept_m',      label:'7m',                    icon:'⚪', color:'#FFD600' },
];

// Origine des tirs / buts ENCAISSÉS (saisie après match). Les libellés servent de clé Firebase.
const ZONES_TIR_ENCAISSES = [
  { id:'Pivot',            icon:'🧱', col:'#FFA420' },
  { id:'Ailier gauche',    icon:'⬅️', col:'#38BDF8' },
  { id:'Ailier droit',     icon:'➡️', col:'#38BDF8' },
  { id:'Arrière extérieur',icon:'🎯', col:'#7C6FFF' },
  { id:'Arrière loin',     icon:'🚀', col:'#FF4455' },
  { id:'Jet de 7 m',       icon:'7️⃣', col:'#FFB800' },
  { id:'Contre-attaque',   icon:'⚡', col:'#4CAF50' },
];

function StatsLiveDefense({ club, matchs, saveMatchsDirect, players, initialMatchId, onBack }) {
  const [selMatchId, setSelMatchId] = React.useState(initialMatchId || null);
  const [showNewMatch, setShowNewMatch] = React.useState(false);
  const [newMatchForm, setNewMatchForm] = React.useState({ adversaire:'', lieu:'domicile', date: localDateStr() });
  const [activeCrit, setActiveCrit] = React.useState(CRITERES_LIVE_DEF[0].id);
  const [activeResultat, setActiveResultat] = React.useState('but'); // 'but' | 'arret'
  const gardiens = (players||[]).filter(p => p.pos === 'Gardien');
  const [activeGardien, setActiveGardien] = React.useState(() => (gardiens[0] && gardiens[0].id) || null);
  const [showList, setShowList] = React.useState(false);
  const [showInterList, setShowInterList] = React.useState(false);
  const [pendingEvent, setPendingEvent] = React.useState(null); // événement posé sur le terrain, en attente de la zone de cage
  const [activeInterPlayer, setActiveInterPlayer] = React.useState(() => (players && players[0] && players[0].id) || null);
  const [showPertesList, setShowPertesList] = React.useState(false);
  const [activePertesPlayer, setActivePertesPlayer] = React.useState(() => (players && players[0] && players[0].id) || null);
  const [showContresList, setShowContresList] = React.useState(false);
  const [activeContresPlayer, setActiveContresPlayer] = React.useState(() => (players && players[0] && players[0].id) || null);
  const [showNeutraList, setShowNeutraList] = React.useState(false);
  const [activeNeutraPlayer, setActiveNeutraPlayer] = React.useState(() => (players && players[0] && players[0].id) || null);
  const [showRelanceList, setShowRelanceList] = React.useState(false);
  const [activeRelanceGardien, setActiveRelanceGardien] = React.useState(() => (gardiens[0] && gardiens[0].id) || null);
  const [tjTick, setTjTick] = React.useState(0);

  const match = matchs.find(m => m.id === selMatchId);
  const events = (match && match.liveDefense) || [];
  const interceptions = (match && match.interceptions) || [];
  const pertesProvoquees = (match && match.pertesProvoquees) || [];
  const contres = (match && match.contres) || [];
  const neutralisations = (match && match.neutralisations) || [];
  const relancesGardien = (match && match.relancesGardien) || [];
  const tempsJeu = (match && match.tempsJeu) || {};
  const chronoMatchEnCours = !match || match.chronoMatchActif !== false; // par défaut, en cours

  // Temps de jeu : chaque joueur a une liste de segments {in, out} (out === null tant que le
  // segment est en cours) + un flag persistant "onField" (est-il sur le terrain, indépendamment
  // du chrono). Un segment n'accumule du temps que si le joueur est sur le terrain ET que le
  // chrono du match tourne — quand on arrête le chrono du match, tous les segments ouverts se
  // ferment d'un coup ; quand on le relance, ceux marqués "onField" en rouvrent un.
  React.useEffect(() => {
    if (!match) return;
    const enCours = (players||[]).some(p => {
      const segs = (tempsJeu[p.id] && tempsJeu[p.id].segments) || [];
      const last = segs[segs.length - 1];
      return last && last.out == null;
    });
    if (!enCours) return;
    const iv = setInterval(() => setTjTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [match && match.id, JSON.stringify(tempsJeu)]);

  // Détermine si un joueur est "sur le terrain". On se fie au flag onField MAIS AUSSI à la
  // présence d'un segment encore ouvert (OU des deux, jamais l'un au détriment de l'autre) :
  // une version intermédiaire de cette fonctionnalité posait déjà ce flag mais ne refermait
  // parfois qu'un seul des segments ouverts d'un joueur, laissant un segment orphelin actif
  // alors que le flag disait déjà "false" — le bouton passait bien gris, mais son temps
  // continuait de tourner en fond puisque plus rien ne se basait sur ce segment oublié. En
  // acceptant ici le OU des deux signaux, un joueur avec un segment orphelin est toujours
  // détecté comme "actif" quoi que dise le flag, et le prochain clic le referme pour de bon.
  function estOnField(data) {
    if (!data) return false;
    const segs = data.segments || [];
    const last = segs[segs.length - 1];
    const segmentOuvert = !!(last && last.out == null);
    return !!data.onField || segmentOuvert;
  }
  // Ferme TOUS les segments encore ouverts (pas seulement le dernier) — auto-répare les cas où
  // plusieurs segments s'étaient empilés ouverts par le bug ci-dessus.
  function fermerSegmentsOuverts(segs, ts) {
    return (segs || []).map(seg => seg.out == null ? { ...seg, out: ts } : seg);
  }
  function isSurLeTerrain(playerId) {
    return estOnField(tempsJeu[playerId]);
  }
  function tempsJoueurMs(playerId) {
    const segs = (tempsJeu[playerId] && tempsJeu[playerId].segments) || [];
    return segs.reduce((s, seg) => s + ((seg.out || Date.now()) - seg.in), 0);
  }
  // Toutes les fonctions ci-dessous passent une FONCTION à saveMatchsDirect plutôt qu'un tableau
  // déjà calculé : c'est résolu contre l'état le plus frais au moment de l'écriture, jamais contre
  // une copie de `matchs`/`match` capturée au rendu précédent. Sans ça, plusieurs joueurs sortis
  // du terrain coup sur coup (avant qu'un nouveau rendu n'ait eu lieu) pouvaient s'annuler entre
  // eux — un des joueurs restait "sur le terrain" avec son chrono qui continuait de tourner alors
  // qu'il venait pourtant d'être sorti.
  function toggleTerrain(playerId) {
    if (!selMatchId) return;
    saveMatchsDirect(prevMatchs => prevMatchs.map(m => {
      if (m.id !== selMatchId) return m;
      const tj = m.tempsJeu || {};
      const data = tj[playerId] || { segments: [], onField: false };
      const wasOnField = estOnField(data);
      const running = m.chronoMatchActif !== false;
      const now = Date.now();
      // On ferme SYSTÉMATIQUEMENT tout segment encore ouvert à CHAQUE clic, quel que soit le sens
      // du basculement — jamais conditionné à ce que dit le flag onField. C'est ce qui garantit
      // qu'un segment orphelin (peu importe son origine) ne survit jamais à un clic sur ce joueur.
      let newSegs = fermerSegmentsOuverts(data.segments, now);
      if (!wasOnField && running) {
        // il entre sur le terrain et le chrono du match tourne : on ouvre un nouveau segment
        newSegs = newSegs.concat([{ in: now, out: null }]);
      }
      return { ...m, tempsJeu: { ...tj, [playerId]: { segments: newSegs, onField: !wasOnField } } };
    }));
  }
  function resetTempsJoueur(playerId) {
    if (!selMatchId) return;
    if (!confirm('Réinitialiser le temps de jeu de ce joueur pour ce match ?')) return;
    saveMatchsDirect(prevMatchs => prevMatchs.map(m => m.id === selMatchId
      ? { ...m, tempsJeu: { ...(m.tempsJeu||{}), [playerId]: { segments: [], onField: false } } }
      : m));
  }
  function toggleChronoMatch() {
    if (!selMatchId) return;
    saveMatchsDirect(prevMatchs => prevMatchs.map(m => {
      if (m.id !== selMatchId) return m;
      const now = Date.now();
      const running = m.chronoMatchActif !== false;
      const nowRunning = !running; // on passe à l'état inverse
      const newTempsJeu = { ...(m.tempsJeu||{}) };
      (players||[]).forEach(p => {
        const data = newTempsJeu[p.id];
        if (!estOnField(data)) return;
        const segs = (data && data.segments) || [];
        if (!nowRunning) {
          // on arrête le chrono du match : on ferme tous les segments ouverts (répare aussi les
          // segments orphelins)
          newTempsJeu[p.id] = { ...data, segments: fermerSegmentsOuverts(segs, now), onField: true };
        } else {
          const last = segs[segs.length - 1];
          if (!last || last.out != null) {
            newTempsJeu[p.id] = { ...data, segments: segs.concat([{ in: now, out: null }]), onField: true };
          }
        }
      });
      return { ...m, chronoMatchActif: nowRunning, tempsJeu: newTempsJeu };
    }));
  }
  function fmtChrono(ms) {
    const totalSec = Math.floor(ms / 1000);
    const mn = Math.floor(totalSec / 60);
    const sc = totalSec % 60;
    return String(mn).padStart(2,'0') + ':' + String(sc).padStart(2,'0');
  }

  // Bonnes défenses : ballon récupéré par interception, sans que le tir aille jusqu'au bout —
  // pas de zone de cage à préciser, juste qui a fait l'action (et combien).
  function ajouterInterception() {
    if (!match) return;
    const ev = { id: Date.now() + '_' + Math.random().toString(36).slice(2,7), playerId: activeInterPlayer || null, t: Date.now() };
    const updated = matchs.map(m => m.id === match.id ? { ...m, interceptions: [...(m.interceptions||[]), ev] } : m);
    saveMatchsDirect(updated);
  }
  function supprimerInterception(evId) {
    if (!match) return;
    const updated = matchs.map(m => m.id === match.id ? { ...m, interceptions: (m.interceptions||[]).filter(e => e.id !== evId) } : m);
    saveMatchsDirect(updated);
  }

  // Pertes de balle provoquées : contrainte défensive qui force l'adversaire à la faute (pas de
  // maîtrise du ballon comme sur une interception) — marquoir séparé des interceptions, même
  // logique de saisie (joueur + compteur).
  function ajouterPerteProvoquee() {
    if (!match) return;
    const ev = { id: Date.now() + '_' + Math.random().toString(36).slice(2,7), playerId: activePertesPlayer || null, t: Date.now() };
    const updated = matchs.map(m => m.id === match.id ? { ...m, pertesProvoquees: [...(m.pertesProvoquees||[]), ev] } : m);
    saveMatchsDirect(updated);
  }
  function supprimerPerteProvoquee(evId) {
    if (!match) return;
    const updated = matchs.map(m => m.id === match.id ? { ...m, pertesProvoquees: (m.pertesProvoquees||[]).filter(e => e.id !== evId) } : m);
    saveMatchsDirect(updated);
  }

  // Contres : ballon bloqué par le défenseur avant même que le tir ne parte — même logique de
  // saisie que les interceptions et pertes provoquées (joueur + compteur).
  function ajouterContre() {
    if (!match) return;
    const ev = { id: Date.now() + '_' + Math.random().toString(36).slice(2,7), playerId: activeContresPlayer || null, t: Date.now() };
    const updated = matchs.map(m => m.id === match.id ? { ...m, contres: [...(m.contres||[]), ev] } : m);
    saveMatchsDirect(updated);
  }
  function supprimerContre(evId) {
    if (!match) return;
    const updated = matchs.map(m => m.id === match.id ? { ...m, contres: (m.contres||[]).filter(e => e.id !== evId) } : m);
    saveMatchsDirect(updated);
  }

  // Neutralisations : le défenseur empêche son adversaire direct de recevoir la balle ou de
  // tirer dans de bonnes conditions, sans contact ni interception à proprement parler.
  function ajouterNeutralisation() {
    if (!match) return;
    const ev = { id: Date.now() + '_' + Math.random().toString(36).slice(2,7), playerId: activeNeutraPlayer || null, t: Date.now() };
    const updated = matchs.map(m => m.id === match.id ? { ...m, neutralisations: [...(m.neutralisations||[]), ev] } : m);
    saveMatchsDirect(updated);
  }
  function supprimerNeutralisation(evId) {
    if (!match) return;
    const updated = matchs.map(m => m.id === match.id ? { ...m, neutralisations: (m.neutralisations||[]).filter(e => e.id !== evId) } : m);
    saveMatchsDirect(updated);
  }

  // Relances gardien : sortie de balle du gardien après un arrêt/une récupération, en positif
  // (relance qui amène un avantage, contre-attaque propre) ou en négatif (relance perdue,
  // mauvais choix, ballon repris par l'adversaire) — un joueur gardien + un sens.
  function ajouterRelance(sens) {
    if (!match) return;
    const ev = { id: Date.now() + '_' + Math.random().toString(36).slice(2,7), gardienId: activeRelanceGardien || null, sens, t: Date.now() };
    const updated = matchs.map(m => m.id === match.id ? { ...m, relancesGardien: [...(m.relancesGardien||[]), ev] } : m);
    saveMatchsDirect(updated);
  }
  function supprimerRelance(evId) {
    if (!match) return;
    const updated = matchs.map(m => m.id === match.id ? { ...m, relancesGardien: (m.relancesGardien||[]).filter(e => e.id !== evId) } : m);
    saveMatchsDirect(updated);
  }

  function creerMatchLive() {
    if (!newMatchForm.adversaire.trim()) { alert('Indique au moins le nom de l\'adversaire.'); return; }
    const newMatch = {
      id: Date.now().toString(), clubId: club.id,
      adversaire: newMatchForm.adversaire.trim(), lieu: newMatchForm.lieu, date: newMatchForm.date,
      scoreNous:'', scoreEux:'', stats:null, liveDefense: [],
    };
    saveMatchsDirect([...matchs, newMatch]);
    setSelMatchId(newMatch.id);
    setShowNewMatch(false);
  }

  function ajouterEvent(xPct, yPct) {
    if (!match) return;
    const ev = { id: Date.now() + '_' + Math.random().toString(36).slice(2,7), x: xPct, y: yPct, type: activeCrit, resultat: activeResultat, gardienId: activeGardien || null, t: Date.now() };
    if (activeResultat === 'hors_cadre') {
      // Un tir hors cadre ne touche jamais la cage — pas d'étape de zone à préciser
      const updated = matchs.map(m => m.id === match.id ? { ...m, liveDefense: [...(m.liveDefense||[]), ev] } : m);
      saveMatchsDirect(updated);
    } else {
      // Étape 1 : tap sur le terrain = origine du tir, mis en attente le temps de préciser la zone de cage
      setPendingEvent(ev);
    }
  }
  function finaliserEvent(goalZone, gx, gy) {
    if (!match || !pendingEvent) return;
    const ev = { ...pendingEvent, goalZone: goalZone || null, goalX: gx, goalY: gy };
    const updated = matchs.map(m => m.id === match.id ? { ...m, liveDefense: [...(m.liveDefense||[]), ev] } : m);
    saveMatchsDirect(updated);
    setPendingEvent(null);
  }
  function supprimerEvent(evId) {
    if (!match) return;
    const updated = matchs.map(m => m.id === match.id ? { ...m, liveDefense: (m.liveDefense||[]).filter(e => e.id !== evId) } : m);
    saveMatchsDirect(updated);
  }

  function handleCourtClick(e) {
    if (pendingEvent) return; // un point est déjà en attente de finalisation dans la cage
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    ajouterEvent(Math.round(xPct*10)/10, Math.round(yPct*10)/10);
  }

  // Détermine la zone de cage (pour compatibilité avec d'éventuelles stats par zone) à partir
  // de la position précise cliquée — 3 colonnes x 2 lignes, mêmes proportions que la grille visuelle.
  function zoneFromXY(xPct, yPct) {
    const col = xPct < 33.33 ? 'g' : xPct < 66.66 ? 'c' : 'd';
    const row = yPct < 50 ? 'h' : 'b';
    return row + col;
  }

  function handleCageClick(e) {
    if (!pendingEvent) return; // rien à finaliser tant qu'aucun tir n'est en attente
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    finaliserEvent(zoneFromXY(xPct, yPct), Math.round(xPct*10)/10, Math.round(yPct*10)/10);
  }

  const counts = {};
  CRITERES_LIVE_DEF.forEach(c => { counts[c.id] = events.filter(e => e.type === c.id).length; });

  return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <div style=${{ fontSize:17, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:'#FF4455' }}>🔴 STATS LIVE — DÉFENSE</div>
      <button class="btn btn-sm" onClick=${onBack}>← Retour</button>
    </div>

    <!-- Sélection du match en cours -->
    ${!match ? _h`<div class="card" style=${{ marginBottom:16 }}>
      <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>Quel match ?</div>
      <div style=${{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
        ${matchs.slice().reverse().map(m => _h`<button key=${m.id} class="btn btn-sm" style=${{ textAlign:'left', justifyContent:'flex-start' }}
          onClick=${() => setSelMatchId(m.id)}>vs ${m.adversaire} — ${new Date(m.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}${m.liveDefense && m.liveDefense.length ? ' · '+m.liveDefense.length+' notés' : ''}</button>`)}
      </div>
      ${!showNewMatch ? _h`<button class="btn btn-primary btn-sm" onClick=${() => setShowNewMatch(true)}>+ Nouveau match</button>`
        : _h`<div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
          <input class="inp" placeholder="Adversaire" value=${newMatchForm.adversaire} onInput=${e=>setNewMatchForm(f=>({...f, adversaire:e.target.value}))}/>
          <div style=${{ display:'flex', gap:8 }}>
            <input class="inp" type="date" value=${newMatchForm.date} onInput=${e=>setNewMatchForm(f=>({...f, date:e.target.value}))} style=${{ flex:1 }}/>
            <select class="inp" value=${newMatchForm.lieu} onChange=${e=>setNewMatchForm(f=>({...f, lieu:e.target.value}))} style=${{ flex:1 }}>
              <option value="domicile">🏠 Domicile</option>
              <option value="exterieur">✈️ Extérieur</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" onClick=${creerMatchLive}>✓ Créer et démarrer</button>
        </div>`}
    </div>` : _h`<div>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style=${{ fontSize:13, fontWeight:700 }}>vs ${match.adversaire} — ${new Date(match.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
        <button class="btn btn-sm" onClick=${() => setSelMatchId(null)}>Changer de match</button>
      </div>

      <!-- Temps de jeu -->
      <div class="card" style=${{ marginBottom:16, border:'1px solid rgba(255,255,255,.12)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style=${{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.7)' }}>⏱️ Temps de jeu</div>
          <button onClick=${toggleChronoMatch}
            style=${{ padding:'6px 14px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:800,
              border:'2px solid '+(chronoMatchEnCours ? '#4CAF50' : '#FF4455'),
              background: chronoMatchEnCours ? 'rgba(76,175,80,.15)' : 'rgba(255,68,85,.15)',
              color: chronoMatchEnCours ? '#4CAF50' : '#FF4455' }}>
            ${chronoMatchEnCours ? '⏸️ Chrono du match : en cours' : "▶️ Chrono du match : à l'arrêt"}
          </button>
        </div>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginBottom:10 }}>Touche un joueur pour le faire entrer/sortir · le chrono du match arrête le temps de tout le monde</div>
        <div style=${{ display:'flex', flexDirection:'column', gap:5, maxHeight:280, overflowY:'auto' }}>
          ${(players||[]).slice().sort((a,b) => a.name.localeCompare(b.name)).map(p => {
            const on = isSurLeTerrain(p.id);
            const accumule = on && chronoMatchEnCours;
            const ms = tempsJoueurMs(p.id);
            const col = accumule ? '#4CAF50' : on ? '#FFA420' : 'rgba(255,255,255,.5)';
            return _h`<div key=${p.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', borderRadius:9,
              background: on ? col+'1A' : 'rgba(255,255,255,.02)', border: on ? '1px solid '+col+'59' : '1px solid rgba(255,255,255,.05)' }}>
              <button onClick=${() => toggleTerrain(p.id)}
                style=${{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', flex:1, textAlign:'left', padding:0 }}>
                <span style=${{ fontSize:13 }}>${accumule ? '🟢' : on ? '⏸️' : '⚪'}</span>
                <span style=${{ fontSize:12, fontWeight:700, color: on ? col : 'rgba(255,255,255,.7)' }}>${p.name}</span>
              </button>
              <span style=${{ display:'flex', alignItems:'center', gap:6 }}>
                <span style=${{ fontSize:13, fontWeight:800, color: on ? col : 'rgba(255,255,255,.5)', fontFamily:"'Barlow Condensed',sans-serif" }}>${fmtChrono(ms)}</span>
                ${ms > 0 ? _h`<button onClick=${() => resetTempsJoueur(p.id)} title="Réinitialiser"
                  style=${{ background:'none', border:'none', color:'rgba(255,255,255,.25)', fontSize:12, cursor:'pointer' }}>↺</button>` : null}
              </span>
            </div>`;
          })}
        </div>
      </div>

      <!-- Sélecteur de critère (actif = ce qui sera posé au prochain tap) -->
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
        ${CRITERES_LIVE_DEF.map(c => _h`<button key=${c.id} onClick=${() => setActiveCrit(c.id)}
          style=${{ padding:'8px 12px', borderRadius:10, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700,
            border:'2px solid '+(activeCrit===c.id?c.color:'rgba(255,255,255,.1)'),
            background:activeCrit===c.id?c.color+'22':'rgba(255,255,255,.03)',
            color:activeCrit===c.id?c.color:'rgba(255,255,255,.5)' }}>
          ${c.icon} ${c.label} ${counts[c.id]>0 ? _h`<span style=${{ opacity:.6 }}>(${counts[c.id]})</span>` : ''}
        </button>`)}
      </div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:8, textAlign:'center' }}>
        Touche le terrain à l'endroit du tir pour noter un but encaissé en <b style=${{ color: (CRITERES_LIVE_DEF.find(c=>c.id===activeCrit)||{}).color }}>${(CRITERES_LIVE_DEF.find(c=>c.id===activeCrit)||{}).label}</b>
      </div>

      <!-- Résultat : but ou arrêt du gardien -->
      <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:10, justifyContent:'center' }}>
        <div style=${{ display:'flex', gap:4, background:'rgba(255,255,255,.03)', borderRadius:10, padding:3, flexWrap:'wrap' }}>
          <button onClick=${() => setActiveResultat('but')}
            style=${{ padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800, border:'none',
              background: activeResultat==='but' ? '#FF4455' : 'transparent', color: activeResultat==='but' ? '#fff' : 'rgba(255,255,255,.4)' }}>
            🥅 But
          </button>
          <button onClick=${() => setActiveResultat('arret')}
            style=${{ padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800, border:'none',
              background: activeResultat==='arret' ? '#4CAF50' : 'transparent', color: activeResultat==='arret' ? '#fff' : 'rgba(255,255,255,.4)' }}>
            🧤 Arrêt
          </button>
          <button onClick=${() => setActiveResultat('hors_cadre')}
            style=${{ padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800, border:'none',
              background: activeResultat==='hors_cadre' ? '#7A7A7A' : 'transparent', color: activeResultat==='hors_cadre' ? '#fff' : 'rgba(255,255,255,.4)' }}>
            ↗️ Hors cadre
          </button>
          <button onClick=${() => setActiveResultat('but_vide')}
            style=${{ padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800, border:'none',
              background: activeResultat==='but_vide' ? '#FFD600' : 'transparent', color: activeResultat==='but_vide' ? '#000' : 'rgba(255,255,255,.4)' }}>
            🕳️ But vide
          </button>
        </div>
        ${gardiens.length > 0 ? _h`<select class="inp" style=${{ fontSize:12, padding:'6px 10px', width:'auto' }}
          value=${activeGardien || ''} onChange=${e => setActiveGardien(e.target.value || null)}>
          <option value="">Gardien ?</option>
          ${gardiens.map(g => _h`<option key=${g.id} value=${g.id}>${g.name}</option>`)}
        </select>` : null}
      </div>

      <!-- Terrain + Cage, côte à côte, avec plus d'espace pour la lisibilité -->
      <div style=${{ display:'flex', gap:'5%', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', maxWidth:1100, margin:'0 auto' }}>

        <!-- Terrain (moitié défensive, but en haut) — à gauche, agrandi -->
        <div onClick=${handleCourtClick}
          style=${{ position:'relative', width:'50%', minWidth:280, maxWidth:420, aspectRatio:'3/4',
            background:'linear-gradient(180deg, rgba(56,189,248,.05), rgba(56,189,248,.01))',
            border:'2px solid rgba(255,255,255,.15)', borderRadius:8, cursor:'crosshair', overflow:'hidden', flexShrink:0 }}>
          <svg viewBox="0 0 300 400" style=${{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
            <!-- Ligne de but -->
            <line x1="90" y1="20" x2="210" y2="20" stroke="rgba(255,255,255,.4)" stroke-width="2"/>
            <!-- Cage -->
            <rect x="120" y="8" width="60" height="12" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
            <!-- Ligne des 6m (arc) -->
            <path d="M 20 20 A 130 130 0 0 0 280 20" fill="none" stroke="rgba(255,68,85,.4)" stroke-width="2"/>
            <!-- Ligne des 9m (arc pointillé) -->
            <path d="M -30 20 A 190 190 0 0 0 330 20" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5" stroke-dasharray="6,6"/>
            <!-- Lignes de côté -->
            <line x1="10" y1="20" x2="10" y2="400" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>
            <line x1="290" y1="20" x2="290" y2="400" stroke="rgba(255,255,255,.15)" stroke-width="1.5"/>
            <!-- Repères de zone -->
            <text x="30" y="45" fill="rgba(255,255,255,.25)" font-size="11" font-family="Inter">Ail. G</text>
            <text x="230" y="45" fill="rgba(255,255,255,.25)" font-size="11" font-family="Inter">Ail. D</text>
            <text x="80" y="110" fill="rgba(255,255,255,.25)" font-size="11" font-family="Inter">Arr. G</text>
            <text x="200" y="110" fill="rgba(255,255,255,.25)" font-size="11" font-family="Inter">Arr. D</text>
            <text x="135" y="130" fill="rgba(255,255,255,.25)" font-size="11" font-family="Inter">DC</text>
            <text x="140" y="55" fill="rgba(255,255,255,.3)" font-size="11" font-family="Inter">Pivot</text>
          </svg>
          ${events.map(ev => {
            const c = CRITERES_LIVE_DEF.find(cc => cc.id === ev.type) || CRITERES_LIVE_DEF[0];
            const isArret = ev.resultat === 'arret';
            const isHorsCadre = ev.resultat === 'hors_cadre';
            if (isHorsCadre) {
              return _h`<div key=${ev.id}
                onClick=${(e) => { e.stopPropagation(); if (confirm('Supprimer ce point (' + c.label + ' — Hors cadre) ?')) supprimerEvent(ev.id); }}
                title=${c.label + ' — Hors cadre — clique pour supprimer'}
                style=${{ position:'absolute', left:ev.x+'%', top:ev.y+'%', transform:'translate(-50%,-50%)',
                  width:16, height:16, cursor:'pointer', zIndex:2, display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#7A7A7A', fontSize:14, fontWeight:900, textShadow:'0 0 4px rgba(0,0,0,.8)' }}>✕</div>`;
            }
            return _h`<div key=${ev.id}
              onClick=${(e) => { e.stopPropagation(); if (confirm('Supprimer ce point (' + c.label + (isArret?' — Arrêt':' — But') + ') ?')) supprimerEvent(ev.id); }}
              title=${c.label + (isArret?' — Arrêt':' — But') + ' — clique pour supprimer'}
              style=${isArret ? {
                position:'absolute', left:ev.x+'%', top:ev.y+'%', transform:'translate(-50%,-50%)',
                width:16, height:16, borderRadius:'50%', background:'transparent', border:'3px solid '+c.color,
                cursor:'pointer', boxShadow:'0 0 6px '+c.color, zIndex:2
              } : {
                position:'absolute', left:ev.x+'%', top:ev.y+'%', transform:'translate(-50%,-50%)',
                width:16, height:16, borderRadius:'50%', background:c.color, border:'2px solid rgba(0,0,0,.5)',
                cursor:'pointer', boxShadow:'0 0 6px '+c.color, zIndex:2
              }}></div>`;
          })}
          ${pendingEvent ? _h`<div style=${{ position:'absolute', left:pendingEvent.x+'%', top:pendingEvent.y+'%', transform:'translate(-50%,-50%)',
            width:20, height:20, borderRadius:'50%', background:'#FFA420', border:'2px solid #fff',
            boxShadow:'0 0 0 6px rgba(255,164,32,.3)', zIndex:3, animation:'pulse 1s infinite' }}></div>` : null}
        </div>

        <!-- Cage — toujours visible, pour noter/consulter l'endroit précis des impacts — à droite, agrandie -->
        <div style=${{ width:'42%', minWidth:340, maxWidth:560, flexShrink:0 }}>
          <div style=${{ fontSize:12, fontWeight:700, color: pendingEvent ? '#FFA420' : 'rgba(255,255,255,.4)', marginBottom:10, textAlign:'center' }}>
            ${pendingEvent ? '🎯 Touche la zone précise' : '🥅 Impacts dans la cage'}
          </div>
          <div onClick=${handleCageClick}
            style=${{ position:'relative', width:'100%', aspectRatio:'3/2', cursor: pendingEvent ? 'crosshair' : 'default',
            background:'rgba(255,255,255,.03)', border:'2px solid '+(pendingEvent?'rgba(255,164,32,.4)':'rgba(255,255,255,.15)'), borderRadius:6, overflow:'hidden' }}>
            <svg viewBox="0 0 300 200" style=${{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              <!-- Poteaux + barre transversale -->
              <rect x="8" y="8" width="284" height="184" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="6"/>
              <!-- Filet (grille) -->
              ${Array.from({length:9}, (_,i) => _h`<line key=${'v'+i} x1=${8+i*(284/9)} y1="8" x2=${8+i*(284/9)} y2="192" stroke="rgba(255,255,255,.08)" stroke-width="1"/>`)}
              ${Array.from({length:6}, (_,i) => _h`<line key=${'h'+i} x1="8" y1=${8+i*(184/6)} x2="292" y2=${8+i*(184/6)} stroke="rgba(255,255,255,.08)" stroke-width="1"/>`)}
            </svg>
            <!-- Historique des impacts déjà notés (position réelle cliquée ; repli sur le centre de zone pour les anciens points enregistrés avant ce correctif) -->
            ${events.filter(ev => ev.goalZone || (ev.goalX != null && ev.goalY != null)).map(ev => {
              const c = CRITERES_LIVE_DEF.find(cc => cc.id === ev.type) || CRITERES_LIVE_DEF[0];
              let bx, by;
              if (ev.goalX != null && ev.goalY != null) {
                // Position précise réellement cliquée (nouveaux points) — jamais de décalage.
                bx = ev.goalX; by = ev.goalY;
              } else {
                // Anciens points enregistrés avant ce correctif : seule une zone (6 zones) était
                // connue, pas de position exacte. On réapplique un petit décalage stable (basé sur
                // l'id) pour que plusieurs anciens tirs dans la même zone restent visibles au lieu
                // de se superposer exactement au même pixel.
                const zonesXY = { hg:[19,27], hc:[50,27], hd:[81,27], bg:[19,77], bc:[50,77], bd:[81,77] };
                const [zx,zy] = zonesXY[ev.goalZone] || [50,50];
                const seed = ev.id.split('').reduce((s,ch)=>s+ch.charCodeAt(0),0);
                const jx = ((seed % 17) - 8) * 0.8, jy = ((seed % 13) - 6) * 0.8;
                bx = zx + jx; by = zy + jy;
              }
              const isArret = ev.resultat === 'arret';
              return _h`<div key=${ev.id} title=${c.label + (isArret?' — Arrêt':' — But')}
                style=${{ position:'absolute', left:bx+'%', top:by+'%', transform:'translate(-50%,-50%)',
                  width:10, height:10, borderRadius:'50%', zIndex:2, pointerEvents:'none',
                  background: isArret ? 'transparent' : c.color, border:(isArret?'2px solid ':'1px solid ')+c.color }}></div>`;
            })}
            ${pendingEvent ? _h`<div style=${{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style=${{ fontSize:10, color:'rgba(255,164,32,.5)', fontWeight:700 }}>Touche l'endroit exact de l'impact</span>
            </div>` : null}
          </div>
          ${pendingEvent ? _h`<div style=${{ display:'flex', gap:8, marginTop:10, justifyContent:'center' }}>
            <button class="btn btn-sm" onClick=${() => finaliserEvent(null)}>Passer</button>
            <button class="btn btn-sm btn-danger" onClick=${() => setPendingEvent(null)}>Annuler</button>
          </div>` : null}
        </div>
      </div>

      <div style=${{ display:'flex', justifyContent:'center', gap:16, marginTop:12, flexWrap:'wrap' }}>
        <div style=${{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,.4)' }}>
          <span style=${{ width:12, height:12, borderRadius:'50%', background:'rgba(255,255,255,.5)', display:'inline-block' }}></span> But
        </div>
        <div style=${{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,.4)' }}>
          <span style=${{ width:12, height:12, borderRadius:'50%', border:'2px solid rgba(255,255,255,.5)', display:'inline-block' }}></span> Arrêt
        </div>
        <div style=${{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,.4)' }}>
          <span style=${{ color:'#7A7A7A', fontWeight:900, fontSize:13 }}>✕</span> Hors cadre
        </div>
        <div style=${{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'rgba(255,255,255,.4)' }}>
          <span style=${{ width:12, height:12, borderRadius:'50%', background:'#FFD600', display:'inline-block' }}></span> But vide
        </div>
      </div>

      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>${events.filter(e => e.resultat === 'but' || e.resultat === 'but_vide').length} but${events.filter(e => e.resultat === 'but' || e.resultat === 'but_vide').length>1?'s':''} encaissé${events.filter(e => e.resultat === 'but' || e.resultat === 'but_vide').length>1?'s':''} · ${events.length} tir${events.length>1?'s':''} noté${events.length>1?'s':''}</div>
        <button class="btn btn-sm" onClick=${() => setShowList(v => !v)}>${showList ? 'Masquer' : 'Voir'} la liste</button>
      </div>

      ${showList ? _h`<div style=${{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
        ${events.length === 0 ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.25)', textAlign:'center', padding:10 }}>Aucun tir noté pour l'instant.</div>` : null}
        ${events.slice().reverse().map(ev => {
          const c = CRITERES_LIVE_DEF.find(cc => cc.id === ev.type) || CRITERES_LIVE_DEF[0];
          const g = gardiens.find(gg => gg.id === ev.gardienId);
          const resTxt = ev.resultat==='arret' ? '🧤 Arrêt' : ev.resultat==='hors_cadre' ? '✕ Hors cadre' : ev.resultat==='but_vide' ? '🕳️ But vide' : '🥅 But';
          return _h`<div key=${ev.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(255,255,255,.03)', borderRadius:8 }}>
            <span style=${{ fontSize:12, color:c.color, fontWeight:700 }}>${c.icon} ${c.label} · ${resTxt}${g ? ' · '+g.name : ''}</span>
            <button onClick=${() => supprimerEvent(ev.id)} style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', fontSize:14, cursor:'pointer' }}>×</button>
          </div>`;
        })}
      </div>` : null}

      <!-- Bonnes défenses : interceptions -->
      <div class="card" style=${{ marginTop:14, border:'1px solid rgba(76,175,80,.25)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#4CAF50' }}>🛡️ Bonnes défenses</div>
          <span style=${{ fontSize:12, color:'#4CAF50', fontWeight:800 }}>${interceptions.length} interception${interceptions.length>1?'s':''}</span>
        </div>
        <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select class="inp" style=${{ fontSize:12, padding:'6px 10px', flex:1, minWidth:140 }}
            value=${activeInterPlayer || ''} onChange=${e => setActiveInterPlayer(e.target.value || null)}>
            <option value="">Joueur ?</option>
            ${(players||[]).map(p => _h`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
          </select>
          <button onClick=${ajouterInterception}
            style=${{ padding:'8px 16px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800,
              border:'2px solid #4CAF50', background:'rgba(76,175,80,.15)', color:'#4CAF50' }}>
            + Interception
          </button>
        </div>
        ${interceptions.length > 0 ? _h`<div style=${{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          ${(() => {
            const parJoueur = {};
            interceptions.forEach(ev => { if (ev.playerId) parJoueur[ev.playerId] = (parJoueur[ev.playerId]||0) + 1; });
            const sansJoueur = interceptions.filter(ev => !ev.playerId).length;
            return _h`<div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${Object.entries(parJoueur).sort((a,b) => b[1]-a[1]).map(([pid, n]) => {
                const p = (players||[]).find(pp => pp.id === pid);
                if (!p) return null;
                return _h`<div key=${pid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <span>${p.name}</span>
                  <span style=${{ color:'#4CAF50', fontWeight:700 }}>${n}</span>
                </div>`;
              })}
              ${sansJoueur > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)' }}>
                <span>Non attribuées</span>
                <span>${sansJoueur}</span>
              </div>` : null}
            </div>`;
          })()}
          <button class="btn btn-sm" style=${{ marginTop:10, width:'100%' }} onClick=${() => setShowInterList(v => !v)}>${showInterList ? 'Masquer' : 'Voir'} le détail</button>
          ${showInterList ? _h`<div style=${{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
            ${interceptions.slice().reverse().map(ev => {
              const p = (players||[]).find(pp => pp.id === ev.playerId);
              return _h`<div key=${ev.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(76,175,80,.05)', borderRadius:8 }}>
                <span style=${{ fontSize:12, color:'#4CAF50', fontWeight:700 }}>🛡️ ${p ? p.name : 'Non attribuée'}</span>
                <button onClick=${() => supprimerInterception(ev.id)} style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', fontSize:14, cursor:'pointer' }}>×</button>
              </div>`;
            })}
          </div>` : null}
        </div>` : null}
      </div>

      <!-- Pertes de balle provoquées -->
      <div class="card" style=${{ marginTop:14, border:'1px solid rgba(255,164,32,.25)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#FFA420' }}>🧱 Pertes de balle provoquées</div>
          <span style=${{ fontSize:12, color:'#FFA420', fontWeight:800 }}>${pertesProvoquees.length} provoquée${pertesProvoquees.length>1?'s':''}</span>
        </div>
        <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select class="inp" style=${{ fontSize:12, padding:'6px 10px', flex:1, minWidth:140 }}
            value=${activePertesPlayer || ''} onChange=${e => setActivePertesPlayer(e.target.value || null)}>
            <option value="">Joueur ?</option>
            ${(players||[]).map(p => _h`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
          </select>
          <button onClick=${ajouterPerteProvoquee}
            style=${{ padding:'8px 16px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800,
              border:'2px solid #FFA420', background:'rgba(255,164,32,.15)', color:'#FFA420' }}>
            + Perte provoquée
          </button>
        </div>
        ${pertesProvoquees.length > 0 ? _h`<div style=${{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          ${(() => {
            const parJoueur = {};
            pertesProvoquees.forEach(ev => { if (ev.playerId) parJoueur[ev.playerId] = (parJoueur[ev.playerId]||0) + 1; });
            const sansJoueur = pertesProvoquees.filter(ev => !ev.playerId).length;
            return _h`<div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${Object.entries(parJoueur).sort((a,b) => b[1]-a[1]).map(([pid, n]) => {
                const p = (players||[]).find(pp => pp.id === pid);
                if (!p) return null;
                return _h`<div key=${pid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <span>${p.name}</span>
                  <span style=${{ color:'#FFA420', fontWeight:700 }}>${n}</span>
                </div>`;
              })}
              ${sansJoueur > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)' }}>
                <span>Non attribuées</span>
                <span>${sansJoueur}</span>
              </div>` : null}
            </div>`;
          })()}
          <button class="btn btn-sm" style=${{ marginTop:10, width:'100%' }} onClick=${() => setShowPertesList(v => !v)}>${showPertesList ? 'Masquer' : 'Voir'} le détail</button>
          ${showPertesList ? _h`<div style=${{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
            ${pertesProvoquees.slice().reverse().map(ev => {
              const p = (players||[]).find(pp => pp.id === ev.playerId);
              return _h`<div key=${ev.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(255,164,32,.05)', borderRadius:8 }}>
                <span style=${{ fontSize:12, color:'#FFA420', fontWeight:700 }}>🧱 ${p ? p.name : 'Non attribuée'}</span>
                <button onClick=${() => supprimerPerteProvoquee(ev.id)} style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', fontSize:14, cursor:'pointer' }}>×</button>
              </div>`;
            })}
          </div>` : null}
        </div>` : null}
      </div>

      <!-- Contres -->
      <div class="card" style=${{ marginTop:14, border:'1px solid rgba(124,111,255,.25)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#7C6FFF' }}>✋ Contres</div>
          <span style=${{ fontSize:12, color:'#7C6FFF', fontWeight:800 }}>${contres.length} contre${contres.length>1?'s':''}</span>
        </div>
        <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select class="inp" style=${{ fontSize:12, padding:'6px 10px', flex:1, minWidth:140 }}
            value=${activeContresPlayer || ''} onChange=${e => setActiveContresPlayer(e.target.value || null)}>
            <option value="">Joueur ?</option>
            ${(players||[]).map(p => _h`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
          </select>
          <button onClick=${ajouterContre}
            style=${{ padding:'8px 16px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800,
              border:'2px solid #7C6FFF', background:'rgba(124,111,255,.15)', color:'#7C6FFF' }}>
            + Contre
          </button>
        </div>
        ${contres.length > 0 ? _h`<div style=${{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          ${(() => {
            const parJoueur = {};
            contres.forEach(ev => { if (ev.playerId) parJoueur[ev.playerId] = (parJoueur[ev.playerId]||0) + 1; });
            const sansJoueur = contres.filter(ev => !ev.playerId).length;
            return _h`<div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${Object.entries(parJoueur).sort((a,b) => b[1]-a[1]).map(([pid, n]) => {
                const p = (players||[]).find(pp => pp.id === pid);
                if (!p) return null;
                return _h`<div key=${pid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <span>${p.name}</span>
                  <span style=${{ color:'#7C6FFF', fontWeight:700 }}>${n}</span>
                </div>`;
              })}
              ${sansJoueur > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)' }}>
                <span>Non attribués</span>
                <span>${sansJoueur}</span>
              </div>` : null}
            </div>`;
          })()}
          <button class="btn btn-sm" style=${{ marginTop:10, width:'100%' }} onClick=${() => setShowContresList(v => !v)}>${showContresList ? 'Masquer' : 'Voir'} le détail</button>
          ${showContresList ? _h`<div style=${{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
            ${contres.slice().reverse().map(ev => {
              const p = (players||[]).find(pp => pp.id === ev.playerId);
              return _h`<div key=${ev.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(124,111,255,.05)', borderRadius:8 }}>
                <span style=${{ fontSize:12, color:'#7C6FFF', fontWeight:700 }}>✋ ${p ? p.name : 'Non attribué'}</span>
                <button onClick=${() => supprimerContre(ev.id)} style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', fontSize:14, cursor:'pointer' }}>×</button>
              </div>`;
            })}
          </div>` : null}
        </div>` : null}
      </div>

      <!-- Neutralisations -->
      <div class="card" style=${{ marginTop:14, border:'1px solid rgba(56,189,248,.25)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#38BDF8' }}>🚫 Neutralisations</div>
          <span style=${{ fontSize:12, color:'#38BDF8', fontWeight:800 }}>${neutralisations.length} neutralisation${neutralisations.length>1?'s':''}</span>
        </div>
        <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select class="inp" style=${{ fontSize:12, padding:'6px 10px', flex:1, minWidth:140 }}
            value=${activeNeutraPlayer || ''} onChange=${e => setActiveNeutraPlayer(e.target.value || null)}>
            <option value="">Joueur ?</option>
            ${(players||[]).map(p => _h`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
          </select>
          <button onClick=${ajouterNeutralisation}
            style=${{ padding:'8px 16px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800,
              border:'2px solid #38BDF8', background:'rgba(56,189,248,.15)', color:'#38BDF8' }}>
            + Neutralisation
          </button>
        </div>
        ${neutralisations.length > 0 ? _h`<div style=${{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          ${(() => {
            const parJoueur = {};
            neutralisations.forEach(ev => { if (ev.playerId) parJoueur[ev.playerId] = (parJoueur[ev.playerId]||0) + 1; });
            const sansJoueur = neutralisations.filter(ev => !ev.playerId).length;
            return _h`<div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${Object.entries(parJoueur).sort((a,b) => b[1]-a[1]).map(([pid, n]) => {
                const p = (players||[]).find(pp => pp.id === pid);
                if (!p) return null;
                return _h`<div key=${pid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <span>${p.name}</span>
                  <span style=${{ color:'#38BDF8', fontWeight:700 }}>${n}</span>
                </div>`;
              })}
              ${sansJoueur > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)' }}>
                <span>Non attribuées</span>
                <span>${sansJoueur}</span>
              </div>` : null}
            </div>`;
          })()}
          <button class="btn btn-sm" style=${{ marginTop:10, width:'100%' }} onClick=${() => setShowNeutraList(v => !v)}>${showNeutraList ? 'Masquer' : 'Voir'} le détail</button>
          ${showNeutraList ? _h`<div style=${{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
            ${neutralisations.slice().reverse().map(ev => {
              const p = (players||[]).find(pp => pp.id === ev.playerId);
              return _h`<div key=${ev.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(56,189,248,.05)', borderRadius:8 }}>
                <span style=${{ fontSize:12, color:'#38BDF8', fontWeight:700 }}>🚫 ${p ? p.name : 'Non attribuée'}</span>
                <button onClick=${() => supprimerNeutralisation(ev.id)} style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', fontSize:14, cursor:'pointer' }}>×</button>
              </div>`;
            })}
          </div>` : null}
        </div>` : null}
      </div>

      <!-- Relances gardien -->
      <div class="card" style=${{ marginTop:14, border:'1px solid rgba(255,255,255,.12)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'rgba(255,255,255,.6)' }}>🥅 Relances gardien</div>
          <span style=${{ fontSize:12, color:'rgba(255,255,255,.6)', fontWeight:800 }}>${relancesGardien.length} relance${relancesGardien.length>1?'s':''}</span>
        </div>
        ${gardiens.length === 0 ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.25)', textAlign:'center', padding:'6px 0' }}>Aucun gardien dans l'effectif.</div>` : _h`
        <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <select class="inp" style=${{ fontSize:12, padding:'6px 10px', flex:1, minWidth:140 }}
            value=${activeRelanceGardien || ''} onChange=${e => setActiveRelanceGardien(e.target.value || null)}>
            <option value="">Gardien ?</option>
            ${gardiens.map(g => _h`<option key=${g.id} value=${g.id}>${g.name}</option>`)}
          </select>
          <button onClick=${() => ajouterRelance('pos')}
            style=${{ padding:'8px 16px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800,
              border:'2px solid #4CAF50', background:'rgba(76,175,80,.15)', color:'#4CAF50' }}>
            + Relance +
          </button>
          <button onClick=${() => ajouterRelance('neg')}
            style=${{ padding:'8px 16px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:800,
              border:'2px solid #FF4455', background:'rgba(255,68,85,.15)', color:'#FF4455' }}>
            + Relance −
          </button>
        </div>`}
        ${relancesGardien.length > 0 ? _h`<div style=${{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          ${(() => {
            const parGardien = {};
            relancesGardien.forEach(ev => {
              if (!ev.gardienId) return;
              if (!parGardien[ev.gardienId]) parGardien[ev.gardienId] = { pos:0, neg:0 };
              parGardien[ev.gardienId][ev.sens === 'neg' ? 'neg' : 'pos']++;
            });
            const sansGardien = relancesGardien.filter(ev => !ev.gardienId).length;
            return _h`<div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${Object.entries(parGardien).map(([gid, c]) => {
                const g = gardiens.find(gg => gg.id === gid);
                if (!g) return null;
                return _h`<div key=${gid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <span>🧤 ${g.name}</span>
                  <span><span style=${{ color:'#4CAF50', fontWeight:700 }}>+${c.pos}</span> <span style=${{ color:'rgba(255,255,255,.3)' }}>/</span> <span style=${{ color:'#FF4455', fontWeight:700 }}>−${c.neg}</span></span>
                </div>`;
              })}
              ${sansGardien > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)' }}>
                <span>Non attribuées</span>
                <span>${sansGardien}</span>
              </div>` : null}
            </div>`;
          })()}
          <button class="btn btn-sm" style=${{ marginTop:10, width:'100%' }} onClick=${() => setShowRelanceList(v => !v)}>${showRelanceList ? 'Masquer' : 'Voir'} le détail</button>
          ${showRelanceList ? _h`<div style=${{ marginTop:8, display:'flex', flexDirection:'column', gap:5 }}>
            ${relancesGardien.slice().reverse().map(ev => {
              const g = gardiens.find(gg => gg.id === ev.gardienId);
              const isPos = ev.sens !== 'neg';
              return _h`<div key=${ev.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background: isPos ? 'rgba(76,175,80,.05)' : 'rgba(255,68,85,.05)', borderRadius:8 }}>
                <span style=${{ fontSize:12, color: isPos ? '#4CAF50' : '#FF4455', fontWeight:700 }}>${isPos ? '+' : '−'} ${g ? g.name : 'Non attribuée'}</span>
                <button onClick=${() => supprimerRelance(ev.id)} style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', fontSize:14, cursor:'pointer' }}>×</button>
              </div>`;
            })}
          </div>` : null}
        </div>` : null}
      </div>

      <!-- Récap par gardien -->
      <div class="card" style=${{ marginTop:14 }}>
        <div style=${{ fontSize:11, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1, color:'rgba(255,255,255,.4)' }}>Par gardien</div>
        ${(() => {
          const tirsCadres = events.filter(e => e.resultat === 'but' || e.resultat === 'arret');
          const arretsTotal = events.filter(e => e.resultat === 'arret').length;
          const pctTotal = tirsCadres.length ? Math.round(arretsTotal / tirsCadres.length * 100) : 0;
          return _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <span style=${{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.6)' }}>Toute l'équipe</span>
            <span style=${{ fontSize:12, color:'#4CAF50', fontWeight:800 }}>${arretsTotal}/${tirsCadres.length} arrêts <span style=${{ color:'rgba(255,255,255,.4)', fontWeight:400 }}>(${pctTotal}%)</span></span>
          </div>`;
        })()}
        ${gardiens.length === 0 ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.25)', textAlign:'center', padding:'6px 0' }}>Aucun gardien dans l'effectif.</div>`
        : !events.some(e => e.gardienId) ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.25)', textAlign:'center', padding:'6px 0' }}>💡 Sélectionne un gardien avant de taper le terrain pour voir le détail par gardien.</div>`
        : _h`<div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
          ${gardiens.map(g => {
            const evG = events.filter(e => e.gardienId === g.id && (e.resultat === 'but' || e.resultat === 'arret'));
            if (evG.length === 0) return null;
            const arrets = evG.filter(e => e.resultat === 'arret').length;
            const pctArret = Math.round(arrets / evG.length * 100);
            return _h`<div key=${g.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style=${{ fontSize:12, fontWeight:700 }}>🧤 ${g.name}</span>
              <span style=${{ fontSize:12, color:'#4CAF50', fontWeight:800 }}>${arrets}/${evG.length} arrêts <span style=${{ color:'rgba(255,255,255,.4)', fontWeight:400 }}>(${pctArret}%)</span></span>
            </div>`;
          })}
        </div>`}
      </div>

      <!-- Récap par critère -->
      <div class="card" style=${{ marginTop:14 }}>
        <div style=${{ fontSize:11, fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1, color:'rgba(255,255,255,.4)' }}>Récap par type de tir</div>
        <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
          ${CRITERES_LIVE_DEF.map(c => {
            const evC = events.filter(e => e.type === c.id);
            const n = evC.length;
            const buts = evC.filter(e => e.resultat !== 'arret' && e.resultat !== 'hors_cadre').length;
            const arrets = evC.filter(e => e.resultat === 'arret').length;
            const horsCadre = evC.filter(e => e.resultat === 'hors_cadre').length;
            const butVide = evC.filter(e => e.resultat === 'but_vide').length;
            const pct = events.length ? Math.round(n/events.length*100) : 0;
            return _h`<div key=${c.id}>
              <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                <span style=${{ fontSize:11, width:130, color:c.color, fontWeight:600, flexShrink:0 }}>${c.icon} ${c.label}</span>
                <div style=${{ flex:1, height:8, background:'rgba(255,255,255,.05)', borderRadius:4, overflow:'hidden' }}>
                  <div style=${{ width:pct+'%', height:'100%', background:c.color }}></div>
                </div>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)', width:88, textAlign:'right', flexShrink:0 }}>${n} (${pct}%)</span>
              </div>
              ${n > 0 ? _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginLeft:138, marginTop:2 }}>${buts} but${buts>1?'s':''} · ${arrets} arrêt${arrets>1?'s':''}${horsCadre>0?' · '+horsCadre+' hors cadre':''}${butVide>0?' · dont '+butVide+' en but vide':''}</div>` : null}
            </div>`;
          })}
        </div>
      </div>
    </div>`}
  </div>`;
}

function StatsMatchView({ club, players, db, setDb }) {
  const matchs = (db.matchStats || {})[club.id] || [];
  const [view, setView]       = React.useState('liste'); // liste | new | detail | live
  const [selMatch, setSelMatch] = React.useState(null);
  const [liveMatchId, setLiveMatchId] = React.useState(null);
  const [editScore, setEditScore] = React.useState(false);
  const [scoreForm, setScoreForm] = React.useState({ scoreNous:'', scoreEux:'' });
  const [step, setStep]         = React.useState(0); // 0=info, 1=attaque, 2=defense, 3=gardien, 4=situations
  const [editingMatchId, setEditingMatchId] = React.useState(null); // id du match en cours de modification (null = nouveau match)
  const gardiens = players.filter(p => p.pos === 'Gardien');

  const emptyStats = () => ({
    attaque: Object.fromEntries(players.map(p => [p.id, Object.fromEntries(STATS_ATTAQUE.map(s => [s, '']))])),
    defense: Object.fromEntries(players.map(p => [p.id, Object.fromEntries(STATS_DEFENSE.map(s => [s, '']))])),
    situations_att: Object.fromEntries(SITUATIONS_JEU_ATT.map(s => [s, {pos:0, neg:0}])),
    situations_def: Object.fromEntries(SITUATIONS_JEU_DEF.map(s => [s, {pos:0, neg:0}])),
    grand_espace:   Object.fromEntries(GRAND_ESPACE.map(s => [s, {pos:0, neg:0}])),
    zones_def:      Object.fromEntries(ZONES_TIR_ENCAISSES.map(z => [z.id, {tirs:0, buts:0}])),
    secteurs_tir:   Object.fromEntries(CATEGORIES_TIR_LIVE.map(c => [c.id, {reussis:0, tentes:0}])),
    gardien: Object.fromEntries(gardiens.map(g => [g.id, { parade:0, relancePlus:0, relanceMoins:0, sixmC:0, neufmC:0, septm:0, sixmNC:0, neufmNC:0 }])),
  });

  const [form, setForm] = React.useState({
    adversaire: '', lieu: 'domicile', date: localDateStr(), possessions: '',
    scoreNous: '', scoreEux: '', stats: emptyStats()
  });

  // ── FILET DE SÉCURITÉ ANTI-PERTE DE SAISIE ────────────────────────────────
  // Avant ce correctif, la saisie en cours du formulaire "Nouveau match" (multi-étapes,
  // pouvant prendre plus d'une heure) n'était persistée nulle part tant qu'on n'avait pas
  // cliqué sur "Enregistrer le match" à la toute fin. La moindre erreur d'enregistrement,
  // fermeture accidentelle, ou rechargement de page faisait alors tout perdre d'un coup, sans
  // aucun moyen de récupérer quoi que ce soit. On sauvegarde désormais un brouillon en continu
  // dans localStorage, restauré automatiquement (avec confirmation) à la réouverture.
  const draftKey = 'perfhand_matchDraft_' + club.id;
  const [draftChecked, setDraftChecked] = React.useState(false);

  React.useEffect(() => {
    if (draftChecked) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        const draftForm = draft && draft.form;
        if (draftForm && draftForm.adversaire && draftForm.adversaire.trim()) {
          if (confirm('Une saisie de match non enregistrée a été retrouvée (vs ' + draftForm.adversaire + '). Reprendre là où tu t\'étais arrêté ?')) {
            setForm(draftForm);
            setStep(draft.step || 0);
            setView('new');
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      }
    } catch(e) { console.error('[matchDraft] restauration impossible:', e); }
    setDraftChecked(true);
  }, []);

  React.useEffect(() => {
    if (!draftChecked) return;
    try {
      if (form.adversaire && form.adversaire.trim()) {
        localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      }
    } catch(e) { /* quota localStorage dépassé ou navigation privée : on ignore, la saisie continue */ }
  }, [form, step, draftChecked]);

  function clearDraft() {
    try { localStorage.removeItem(draftKey); } catch(e) {}
  }

  // Empêche le rechargement automatique de version (voir plus haut dans le script) de couper la
  // saisie en cours tant que le formulaire "Nouveau match" est ouvert — c'est ce qui a provoqué
  // la perte de saisie signalée : la page se rechargeait toute seule en plein milieu.
  React.useEffect(() => {
    window.__perfhandBusy = (view === 'new');
  }, [view]);
  React.useEffect(() => () => { window.__perfhandBusy = false; }, []);

  // Sauvegarde directe et dédiée d'un match (utilisée par le mode Live pour écrire à chaque tap,
  // sans attendre une validation finale — important en direct pendant un match — mais aussi par
  // la saisie manuelle et la suppression, pour que ce soit TOUJOURS partagé coach/staff/admin,
  // sur tous les appareils, via Firebase (perfhand/matchStats/<clubId>).
  function saveMatchsDirect(newMatchsOrFn, alertOnError) {
    // newMatchsOrFn peut être soit un tableau déjà calculé, soit une fonction (prevMatchs) => newMatchs.
    //
    // CORRECTIF (Sulyvan/Antonin — temps de jeu qui "revenait" malgré la sortie) : le vrai problème
    // n'était pas seulement une copie locale périmée (déjà corrigé), mais que DEUX appareils peuvent
    // saisir en même temps sur le MÊME match en direct (coach + staff) — chacun écrivant sa propre
    // copie complète du match via .set(), le second écrase alors intégralement le premier, y compris
    // les joueurs qu'il n'avait pas touchés. Un simple retry local ne peut pas voir ça : c'est un
    // conflit entre deux appareils différents. Pour la forme "fonction", on utilise donc désormais
    // une TRANSACTION Firebase : le serveur relit sa toute dernière valeur à chaque tentative et
    // réapplique la fonction dessus, en réessayant automatiquement s'il y a eu une écriture
    // concurrente entre-temps — impossible pour un appareil d'écraser la modification d'un autre.
    if (typeof newMatchsOrFn === 'function' && window.__perfhand_db) {
      window.__perfhand_db.ref('perfhand/matchStats/' + club.id).transaction(currentRaw => {
        const currentList = !currentRaw ? [] : Array.isArray(currentRaw) ? currentRaw.filter(Boolean) : Object.values(currentRaw).filter(Boolean);
        const next = newMatchsOrFn(currentList);
        try { return JSON.parse(JSON.stringify(next)); } catch(e) { return next; }
      }).catch(e => {
        console.error('[matchStats live] échec transaction:', e && e.code, e && e.message);
        if (alertOnError) alert("Le match a été enregistré localement mais pas synchronisé (connexion ?) — il ne sera pas visible sur les autres appareils tant que la connexion ne sera pas rétablie.");
      });
      // Mise à jour locale optimiste immédiate, pour un retour visuel instantané sur cet appareil —
      // la transaction ci-dessus fera de toute façon foi côté serveur et reviendra via le listener.
      setDb(d => {
        const prevMatchs = (d.matchStats || {})[club.id] || [];
        const newMatchs = newMatchsOrFn(prevMatchs);
        return { ...d, matchStats: { ...d.matchStats, [club.id]: newMatchs } };
      });
      return;
    }
    setDb(d => {
      const prevMatchs = (d.matchStats || {})[club.id] || [];
      const newMatchs = typeof newMatchsOrFn === 'function' ? newMatchsOrFn(prevMatchs) : newMatchsOrFn;
      if (window.__perfhand_db) {
        let safe; try { safe = JSON.parse(JSON.stringify(newMatchs)); } catch(e) { safe = newMatchs; }
        window.__perfhand_db.ref('perfhand/matchStats/' + club.id).set(safe)
          .catch(e => {
            console.error('[matchStats live] échec:', e && e.code, e && e.message);
            // Silencieux pendant la saisie Live (un tap qui échoue ne doit pas interrompre le match
            // par une alerte), mais signalé explicitement pour une sauvegarde "finale" (nouveau match /
            // suppression) — avant ça échouait sans que rien ne le montre à l'écran.
            if (alertOnError) alert("Le match a été enregistré localement mais pas synchronisé (connexion ?) — il ne sera pas visible sur les autres appareils tant que la connexion ne sera pas rétablie.");
          });
      } else if (alertOnError) {
        alert("Le match est enregistré uniquement sur cet appareil pour le moment (pas de connexion au serveur) — il ne sera pas visible ailleurs tant que la connexion ne sera pas rétablie.");
      }
      return { ...d, matchStats: { ...d.matchStats, [club.id]: newMatchs } };
    });
  }

  function saveMatch() {
    try {
      if (!club || !club.id) { alert("Erreur : aucun club sélectionné, impossible d'enregistrer ce match."); return; }
      if (!form.adversaire || !form.adversaire.trim()) {
        alert("Le nom de l'adversaire est manquant — retourne à l'étape \"Infos match\" pour le renseigner avant d'enregistrer.");
        setStep(0);
        return;
      }
      // Si on modifie un match déjà enregistré (voir editMatch ci-dessous), on remplace l'entrée
      // existante au lieu d'en créer une nouvelle — c'est ce qui permet de reprendre la saisie
      // d'un match plus tard si elle n'était pas terminée.
      if (editingMatchId) {
        const updatedMatch = { ...form, id: editingMatchId, clubId: club.id };
        saveMatchsDirect(prevMatchs => prevMatchs.map(mm => mm.id === editingMatchId ? updatedMatch : mm), true);
        clearDraft();
        setEditingMatchId(null);
        setSelMatch(updatedMatch);
        setView('detail');
        setStep(0);
        setForm({ adversaire:'', lieu:'domicile', date: localDateStr(), possessions:'', scoreNous:'', scoreEux:'', stats: emptyStats() });
        return;
      }
      const newMatch = { ...form, id: Date.now().toString(), clubId: club.id };
      saveMatchsDirect([...matchs, newMatch], true);
      clearDraft();
      setView('liste');
      setStep(0);
      setForm({ adversaire:'', lieu:'domicile', date: localDateStr(), possessions:'', scoreNous:'', scoreEux:'', stats: emptyStats() });
    } catch(e) {
      // Filet de sécurité : avant ce correctif, une erreur ici échouait silencieusement — le clic
      // sur "Enregistrer le match" ne faisait alors rien du tout, sans aucun message, ce qui
      // donnait exactement l'impression que "ça n'enregistre pas". On alerte désormais toujours.
      console.error('[saveMatch] erreur:', e);
      alert("Erreur lors de l'enregistrement du match : " + (e && e.message ? e.message : 'erreur inconnue') + ". Réessaie, et si ça persiste, recharge la page.");
    }
  }

  // Réouvre le formulaire multi-étapes pré-rempli avec les données d'un match déjà enregistré,
  // pour pouvoir compléter ou corriger une saisie laissée inachevée.
  function editMatch(m) {
    const base = emptyStats();
    const mergedForm = {
      ...m,
      stats: {
        attaque:        { ...base.attaque,        ...(m.stats && m.stats.attaque)        },
        defense:        { ...base.defense,        ...(m.stats && m.stats.defense)        },
        situations_att: { ...base.situations_att, ...(m.stats && m.stats.situations_att) },
        situations_def: { ...base.situations_def, ...(m.stats && m.stats.situations_def) },
        grand_espace:   { ...base.grand_espace,   ...(m.stats && m.stats.grand_espace)   },
        zones_def:      { ...base.zones_def,      ...(m.stats && m.stats.zones_def)      },
        secteurs_tir:   { ...base.secteurs_tir,   ...(m.stats && m.stats.secteurs_tir)   },
        gardien:        { ...base.gardien,        ...(m.stats && m.stats.gardien)        },
      },
    };
    setForm(mergedForm);
    setEditingMatchId(m.id);
    setStep(0);
    setView('new');
  }

  function updStat(cat, playerId, stat, val) {
    setForm(f => ({ ...f, stats: { ...f.stats, [cat]: { ...f.stats[cat], [playerId]: { ...f.stats[cat][playerId], [stat]: val } } } }));
  }
  function updSit(cat, sit, side, val) {
    setForm(f => ({ ...f, stats: { ...f.stats, [cat]: { ...f.stats[cat], [sit]: { ...f.stats[cat][sit], [side]: Number(val)||0 } } } }));
  }
  function updZoneDef(zone, field, val) {
    setForm(f => ({ ...f, stats: { ...f.stats, zones_def: { ...(f.stats.zones_def||{}), [zone]: { ...((f.stats.zones_def||{})[zone]||{tirs:0,buts:0}), [field]: Math.max(0, Number(val)||0) } } } }));
  }
  function updSecteurTir(sectId, field, val) {
    setForm(f => ({ ...f, stats: { ...f.stats, secteurs_tir: { ...f.stats.secteurs_tir, [sectId]: { ...f.stats.secteurs_tir[sectId], [field]: Number(val)||0 } } } }));
  }
  function updGard(gId, field, val) {
    setForm(f => ({ ...f, stats: { ...f.stats, gardien: { ...f.stats.gardien, [gId]: { ...f.stats.gardien[gId], [field]: Number(val)||0 } } } }));
  }

  // ── MODE LIVE : saisie en direct pendant le match des buts encaissés sur le terrain ──
  if (view === 'live') return React.createElement(StatsLiveDefense, {
    club, matchs, saveMatchsDirect, players,
    initialMatchId: liveMatchId,
    onBack: () => {
      if (liveMatchId) {
        const fresh = matchs.find(mm => mm.id === liveMatchId);
        if (fresh) setSelMatch(fresh);
        setView('detail');
      } else {
        setView('liste');
      }
      setLiveMatchId(null);
    },
  });

  // ── LISTE DES MATCHS ────────────────────────────────────────────────────
  if (view === 'liste') return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
      <div style=${{ fontSize:17, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>STATS MATCHS</div>
      <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
        ${matchs.length > 0 ? _h`<button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.35)', color:'#4CAF50', fontWeight:700 }}
          onClick=${() => {
            const { header, rows } = buildStatsExportRows(matchs, players);
            downloadCSV('stats_matchs_' + (club.name||'club').replace(/\s+/g,'_') + '_' + localDateStr() + '.csv', [header, ...rows]);
          }}>⬇️ CSV</button>` : null}
        ${matchs.length > 0 ? _h`<button class="btn btn-sm" style=${{ background:'rgba(33,150,243,.1)', border:'1px solid rgba(33,150,243,.35)', color:'#2196F3', fontWeight:700 }}
          onClick=${() => exporterStatsExcel(matchs, players, club)}>📊 Excel</button>` : null}
        ${matchs.length > 0 ? _h`<button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.35)', color:'#FFA420', fontWeight:700 }}
          onClick=${() => exporterStatsPDF(matchs, players, club)}>📄 PDF</button>` : null}
        <button class="btn btn-sm" style=${{ background:'rgba(255,68,85,.12)', border:'1px solid rgba(255,68,85,.4)', color:'#FF4455', fontWeight:700 }} onClick=${() => setView('live')}>🔴 Stats Live</button>
        <button class="btn btn-primary btn-sm" onClick=${() => { setView('new'); setStep(0); }}>+ Nouveau match</button>
      </div>
    </div>

    ${(() => {
      const cum = ZONES_TIR_ENCAISSES.map(z => {
        let t = 0, b = 0, n = 0;
        matchs.forEach(mm => { const d = mm.stats && mm.stats.zones_def && mm.stats.zones_def[z.id]; if (d && ((Number(d.tirs)||0) + (Number(d.buts)||0)) > 0) { t += Number(d.tirs)||0; b += Number(d.buts)||0; n++; } });
        return { z, t, b };
      });
      const totT = cum.reduce((a, c) => a + c.t, 0), totB = cum.reduce((a, c) => a + c.b, 0);
      const nbMatchs = matchs.filter(mm => mm.stats && mm.stats.zones_def && ZONES_TIR_ENCAISSES.some(z => ((Number(mm.stats.zones_def[z.id]?.tirs)||0) + (Number(mm.stats.zones_def[z.id]?.buts)||0)) > 0)).length;
      if (!totT && !totB) return null;
      return _h`<div class="card" style=${{ marginBottom:16, border:'1px solid rgba(255,68,85,.2)' }}>
        <div style=${{ fontSize:12, fontWeight:800, color:'#FF4455', marginBottom:4 }}>🛡️ Saison — d'où on prend les tirs et les buts</div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginBottom:10 }}>${nbMatchs} match${nbMatchs>1?'s':''} renseigné${nbMatchs>1?'s':''} · ${totB} but${totB>1?'s':''} encaissé${totB>1?'s':''} sur ${totT} tir${totT>1?'s':''} subi${totT>1?'s':''}</div>
        ${cum.filter(c => c.t + c.b > 0).sort((a, b2) => b2.b - a.b || b2.t - a.t).map(({ z, t, b }) => {
          const pB = totB ? Math.round(b / totB * 100) : 0, pT = totT ? Math.round(t / totT * 100) : 0, eff = t ? Math.round(b / t * 100) : 0;
          return _h`<div key=${z.id} style=${{ marginBottom:8 }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
              <span style=${{ fontSize:11, width:130, color:z.col, fontWeight:600, flexShrink:0 }}>${z.icon} ${z.id}</span>
              <div style=${{ flex:1, height:8, background:'rgba(255,255,255,.05)', borderRadius:4, overflow:'hidden' }}><div style=${{ width:pB+'%', height:'100%', background:z.col }}></div></div>
              <span style=${{ fontSize:12, fontWeight:800, width:42, textAlign:'right', flexShrink:0 }}>${pB}%</span>
            </div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginLeft:138, marginTop:2 }}>${b} but${b>1?'s':''} · ${t} tir${t>1?'s':''} (${pT}% des tirs) · réussite adverse ${eff}%</div>
          </div>`;
        })}
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.25)', marginTop:4 }}>La barre = part de nos buts encaissés venant de ce poste.</div>
      </div>`;
    })()}

    ${matchs.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
      <div style=${{ fontSize:28, marginBottom:8 }}>📊</div>
      <div style=${{ fontWeight:700, marginBottom:4 }}>Aucun match enregistré</div>
      <div style=${{ fontSize:12 }}>Enregistre les stats de vos matchs pour suivre la progression.</div>
    </div>` : matchs.slice().reverse().map(m => {
      const res = m.scoreNous > m.scoreEux ? '#4CAF50' : m.scoreNous < m.scoreEux ? '#FF4455' : '#FFB800';
      const label = m.scoreNous > m.scoreEux ? 'V' : m.scoreNous < m.scoreEux ? 'D' : 'N';
      const totalButs = Object.values(m.stats?.attaque || {}).reduce((s, p) => s + (Number(p['Buts'])||0), 0);
      return _h`<div key=${m.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, padding:'12px 16px', marginBottom:8, cursor:'pointer' }}
        onClick=${() => { setSelMatch(m); setView('detail'); }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style=${{ flex:1 }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <div style=${{ fontSize:13, fontWeight:800 }}>vs ${m.adversaire}</div>
              <span style=${{ fontSize:10, padding:'1px 8px', borderRadius:20, background:res+'18', color:res, fontWeight:800 }}>${label}</span>
              <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${m.lieu === 'domicile' ? '🏠' : '✈️'}</span>
            </div>
            <div style=${{ display:'flex', gap:12, fontSize:11, color:'rgba(255,255,255,.4)' }}>
              <span>${new Date(m.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</span>
              <span style=${{ color: res, fontWeight:700 }}>${m.scoreNous} - ${m.scoreEux}</span>
              ${m.possessions ? _h`<span style=${{ color:'#EC4899' }}>${m.possessions} poss.</span>` : null}
            </div>
          </div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.3)' }}>→</div>
        </div>
      </div>`;
    })}
  </div>`;

  // ── SAISIE NOUVEAU MATCH ─────────────────────────────────────────────
  if (view === 'new') {
    const steps = ['Infos match','Attaque','Défense','Gardien','Secteurs de tir','Situations'];
    return _h`<div>
      <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button class="btn btn-sm" onClick=${() => {
          if (step > 0) { setStep(step-1); return; }
          if (editingMatchId) { setEditingMatchId(null); setView('detail'); } else { setView('liste'); }
        }}>←</button>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:13, fontWeight:800 }}>${editingMatchId ? 'Modification — ' : ''}${steps[step]} (${step+1}/${steps.length})</div>
          <div style=${{ height:3, background:'rgba(255,255,255,.07)', borderRadius:3, marginTop:4 }}>
            <div style=${{ height:'100%', width:((step+1)/steps.length*100)+'%', background:'#FFA420', borderRadius:3 }}></div>
          </div>
        </div>
      </div>

      <!-- STEP 0: Infos -->
      ${step === 0 ? _h`<div>
        <div style=${{ marginBottom:12 }}><div class="lbl">Adversaire</div><input class="inp" value=${form.adversaire} onInput=${e => setForm(f=>({...f,adversaire:e.target.value}))} placeholder="Nom du club adverse"/></div>
        <div style=${{ marginBottom:12 }}><div class="lbl">Date</div><input class="inp" type="date" value=${form.date} onInput=${e => setForm(f=>({...f,date:e.target.value}))}/></div>
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Lieu</div>
          <div style=${{ display:'flex', gap:8 }}>
            ${['domicile','exterieur'].map(l => _h`<button key=${l} onClick=${() => setForm(f=>({...f,lieu:l}))}
              style=${{ flex:1, padding:'9px', borderRadius:9, cursor:'pointer', fontSize:12,
                border: form.lieu===l?'2px solid #FFA420':'1px solid rgba(255,255,255,.1)',
                background: form.lieu===l?'rgba(255,164,32,.1)':'rgba(255,255,255,.03)',
                color: form.lieu===l?'#FFA420':'rgba(255,255,255,.4)', fontWeight: form.lieu===l?700:400
              }}>${l==='domicile'?'🏠 Domicile':'✈️ Extérieur'}</button>`)}
          </div>
        </div>
        <div style=${{ display:'flex', gap:10, marginBottom:16 }}>
          <div style=${{ flex:1 }}><div class="lbl">${club.name} (nous)</div><input class="inp" type="number" value=${form.scoreNous} onInput=${e => setForm(f=>({...f,scoreNous:e.target.value}))} placeholder="0"/></div>
          <div style=${{ flex:1 }}><div class="lbl">${form.adversaire||'Adversaire'}</div><input class="inp" type="number" value=${form.scoreEux} onInput=${e => setForm(f=>({...f,scoreEux:e.target.value}))} placeholder="0"/></div>
        </div>
        <div style=${{ marginBottom:16 }}>
          <div class="lbl">Nombre de possessions (ballons joués)</div>
          <input class="inp" type="number" min="0" value=${form.possessions} onInput=${e => setForm(f=>({...f,possessions:e.target.value}))} placeholder="Ex: 55"/>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:4 }}>Nombre total d'attaques (les deux équipes ont normalement un nombre de possessions proche).</div>
        </div>
        <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${() => form.adversaire && form.adversaire.trim() ? setStep(1) : alert('Renseigne le nom de l\'adversaire pour continuer.')}>Suivant →</button>
      </div>` : null}

      <!-- STEP 1: Attaque -->
      ${step === 1 ? _h`<div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Stats attaque par joueur</div>
        <div style=${{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
            <thead><tr>
              <th style=${{ padding:'6px 8px', textAlign:'left', fontSize:10, color:'rgba(255,255,255,.3)', borderBottom:'1px solid rgba(255,255,255,.06)', position:'sticky', left:0, background:'#111' }}>Joueur</th>
              ${STATS_ATTAQUE.map(s => _h`<th key=${s} style=${{ padding:'6px 8px', fontSize:9, color:'rgba(255,255,255,.3)', borderBottom:'1px solid rgba(255,255,255,.06)', whiteSpace:'nowrap', textAlign:'center' }}>${s}</th>`)}
            </tr></thead>
            <tbody>
              ${players.map(p => _h`<tr key=${p.id}>
                <td style=${{ padding:'6px 8px', fontSize:11, fontWeight:600, position:'sticky', left:0, background:'#111', whiteSpace:'nowrap', borderBottom:'1px solid rgba(255,255,255,.04)' }}>${p.name.split(' ')[1]||p.name}</td>
                ${STATS_ATTAQUE.map(s => _h`<td key=${s} style=${{ padding:'3px 4px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <input type="number" min="0" value=${form.stats.attaque[p.id]?.[s]||''} onInput=${e => updStat('attaque',p.id,s,e.target.value)}
                    style=${{ width:44, textAlign:'center', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:5, color:'#fff', fontSize:11, padding:'3px' }}/>
                </td>`)}
              </tr>`)}
            </tbody>
          </table>
        </div>
        <button class="btn btn-primary" style=${{ width:'100%', marginTop:14 }} onClick=${() => setStep(2)}>Suivant →</button>
      </div>` : null}

      <!-- STEP 2: Défense -->
      ${step === 2 ? _h`<div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Stats défense par joueur</div>
        <div style=${{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
            <thead><tr>
              <th style=${{ padding:'6px 8px', textAlign:'left', fontSize:10, color:'rgba(255,255,255,.3)', borderBottom:'1px solid rgba(255,255,255,.06)', position:'sticky', left:0, background:'#111' }}>Joueur</th>
              ${STATS_DEFENSE.map(s => _h`<th key=${s} style=${{ padding:'6px 8px', fontSize:9, color:'rgba(255,255,255,.3)', borderBottom:'1px solid rgba(255,255,255,.06)', whiteSpace:'nowrap', textAlign:'center' }}>${s}</th>`)}
            </tr></thead>
            <tbody>
              ${players.map(p => _h`<tr key=${p.id}>
                <td style=${{ padding:'6px 8px', fontSize:11, fontWeight:600, position:'sticky', left:0, background:'#111', whiteSpace:'nowrap', borderBottom:'1px solid rgba(255,255,255,.04)' }}>${p.name.split(' ')[1]||p.name}</td>
                ${STATS_DEFENSE.map(s => _h`<td key=${s} style=${{ padding:'3px 4px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <input type="number" min="0" value=${form.stats.defense[p.id]?.[s]||''} onInput=${e => updStat('defense',p.id,s,e.target.value)}
                    style=${{ width:44, textAlign:'center', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:5, color:'#fff', fontSize:11, padding:'3px' }}/>
                </td>`)}
              </tr>`)}
            </tbody>
          </table>
        </div>
        <button class="btn btn-primary" style=${{ width:'100%', marginTop:14 }} onClick=${() => setStep(3)}>Suivant →</button>
      </div>` : null}

      <!-- STEP 3: Gardien -->
      ${step === 3 ? _h`<div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Stats gardien(s)</div>
        ${gardiens.length === 0 ? _h`<div style=${{ color:'rgba(255,255,255,.3)', padding:'20px', textAlign:'center' }}>Aucun joueur avec le poste "Gardien" dans l'effectif.</div>` : gardiens.map(g => _h`<div key=${g.id} style=${{ background:'rgba(255,255,255,.025)', borderRadius:12, padding:'14px', marginBottom:12 }}>
          <div style=${{ fontSize:13, fontWeight:800, marginBottom:12 }}>${g.name}</div>
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            ${[['parade','Parades'],['relancePlus','Relance +'],['relanceMoins','Relance -']].map(([f,l]) => _h`<div key=${f}>
              <div style=${{ fontSize:9, color:'#4CAF50', textTransform:'uppercase', marginBottom:4 }}>${l}</div>
              <input type="number" min="0" value=${form.stats.gardien[g.id]?.[f]||0} onInput=${e => updGard(g.id,f,e.target.value)}
                class="inp" style=${{ textAlign:'center' }}/>
            </div>`)}
          </div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:8 }}>Tirs reçus (contraints)</div>
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            ${[['sixmC','6m'],['neufmC','9m'],['septm','7m']].map(([f,l]) => _h`<div key=${f}>
              <div style=${{ fontSize:9, color:'#FF4455', textTransform:'uppercase', marginBottom:4 }}>${l}</div>
              <input type="number" min="0" value=${form.stats.gardien[g.id]?.[f]||0} onInput=${e => updGard(g.id,f,e.target.value)}
                class="inp" style=${{ textAlign:'center' }}/>
            </div>`)}
          </div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:8 }}>Tirs reçus (non contraints)</div>
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            ${[['sixmNC','6m NC'],['neufmNC','9m NC']].map(([f,l]) => _h`<div key=${f}>
              <div style=${{ fontSize:9, color:'#FFB800', textTransform:'uppercase', marginBottom:4 }}>${l}</div>
              <input type="number" min="0" value=${form.stats.gardien[g.id]?.[f]||0} onInput=${e => updGard(g.id,f,e.target.value)}
                class="inp" style=${{ textAlign:'center' }}/>
            </div>`)}
          </div>
        </div>`)}
        <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${() => setStep(4)}>Suivant →</button>
      </div>` : null}

      <!-- STEP 4: Secteurs de tir -->
      ${step === 4 ? _h`<div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>Pourcentage de réussite par secteur de jeu</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:12 }}>Pour chaque secteur, indique le nombre de tirs réussis et le nombre de tirs tentés (toute l'équipe).</div>
        ${CATEGORIES_TIR_LIVE.map(c => {
          const d = form.stats.secteurs_tir[c.id] || {reussis:0, tentes:0};
          const pct = d.tentes > 0 ? Math.round(d.reussis/d.tentes*100) : 0;
          return _h`<div key=${c.id} style=${{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <div style=${{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style=${{ fontSize:12, fontWeight:700, color:c.color }}>${c.icon} ${c.label}</div>
              ${d.tentes > 0 ? _h`<span style=${{ fontSize:12, fontWeight:800, color:c.color }}>${pct}%</span>` : null}
            </div>
            <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
              <div style=${{ flex:1 }}>
                <div style=${{ fontSize:8, color:'#4CAF50', textAlign:'center', marginBottom:2 }}>Réussis</div>
                <input type="number" min="0" value=${d.reussis||0} onInput=${e => updSecteurTir(c.id,'reussis',e.target.value)}
                  style=${{ width:'100%', textAlign:'center', background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.2)', borderRadius:5, color:'#4CAF50', fontSize:12, padding:'5px' }}/>
              </div>
              <div style=${{ flex:1 }}>
                <div style=${{ fontSize:8, color:'rgba(255,255,255,.4)', textAlign:'center', marginBottom:2 }}>Tentés</div>
                <input type="number" min="0" value=${d.tentes||0} onInput=${e => updSecteurTir(c.id,'tentes',e.target.value)}
                  style=${{ width:'100%', textAlign:'center', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:5, color:'#fff', fontSize:12, padding:'5px' }}/>
              </div>
            </div>
          </div>`;
        })}
        <button class="btn btn-primary" style=${{ width:'100%', marginTop:16 }} onClick=${() => setStep(5)}>Suivant →</button>
      </div>` : null}

      <!-- STEP 5: Situations -->
      ${step === 5 ? _h`<div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Situations de jeu</div>

        <div style=${{ fontSize:11, fontWeight:700, color:'#FFA420', marginBottom:8 }}>ATTAQUE</div>
        ${SITUATIONS_JEU_ATT.map(sit => _h`<div key=${sit} style=${{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <div style=${{ fontSize:12, flex:1 }}>${sit}</div>
          <div style=${{ display:'flex', gap:8, alignItems:'center' }}>
            <div>
              <div style=${{ fontSize:8, color:'#4CAF50', textAlign:'center' }}>+</div>
              <input type="number" min="0" value=${form.stats.situations_att[sit]?.pos||0} onInput=${e => updSit('situations_att',sit,'pos',e.target.value)}
                style=${{ width:44, textAlign:'center', background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.2)', borderRadius:5, color:'#4CAF50', fontSize:11, padding:'3px' }}/>
            </div>
            <div>
              <div style=${{ fontSize:8, color:'#FF4455', textAlign:'center' }}>-</div>
              <input type="number" min="0" value=${form.stats.situations_att[sit]?.neg||0} onInput=${e => updSit('situations_att',sit,'neg',e.target.value)}
                style=${{ width:44, textAlign:'center', background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.2)', borderRadius:5, color:'#FF4455', fontSize:11, padding:'3px' }}/>
            </div>
          </div>
        </div>`)}

        <div style=${{ fontSize:11, fontWeight:700, color:'#38BDF8', marginTop:14, marginBottom:8 }}>DÉFENSE</div>
        ${SITUATIONS_JEU_DEF.map(sit => _h`<div key=${sit} style=${{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <div style=${{ fontSize:12, flex:1 }}>${sit}</div>
          <div style=${{ display:'flex', gap:8 }}>
            <div>
              <div style=${{ fontSize:8, color:'#4CAF50', textAlign:'center' }}>+</div>
              <input type="number" min="0" value=${form.stats.situations_def[sit]?.pos||0} onInput=${e => updSit('situations_def',sit,'pos',e.target.value)}
                style=${{ width:44, textAlign:'center', background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.2)', borderRadius:5, color:'#4CAF50', fontSize:11, padding:'3px' }}/>
            </div>
            <div>
              <div style=${{ fontSize:8, color:'#FF4455', textAlign:'center' }}>-</div>
              <input type="number" min="0" value=${form.stats.situations_def[sit]?.neg||0} onInput=${e => updSit('situations_def',sit,'neg',e.target.value)}
                style=${{ width:44, textAlign:'center', background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.2)', borderRadius:5, color:'#FF4455', fontSize:11, padding:'3px' }}/>
            </div>
          </div>
        </div>`)}

        <div style=${{ fontSize:11, fontWeight:700, color:'#FF4455', marginTop:14, marginBottom:4 }}>D'OÙ ON PREND LES TIRS ET LES BUTS</div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginBottom:8 }}>Tirs subis = tous les tirs adverses depuis ce poste (buts compris). Buts = ceux qu'on a encaissés.</div>
        ${ZONES_TIR_ENCAISSES.map(z => { const d = (form.stats.zones_def||{})[z.id] || {tirs:0,buts:0}; return _h`<div key=${z.id} style=${{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <div style=${{ fontSize:12, flex:1, color:z.col, fontWeight:600 }}>${z.icon} ${z.id}</div>
          <div style=${{ display:'flex', gap:8 }}>
            <div>
              <div style=${{ fontSize:8, color:'rgba(255,255,255,.5)', textAlign:'center' }}>Tirs</div>
              <input type="number" min="0" value=${d.tirs||0} onInput=${e => updZoneDef(z.id,'tirs',e.target.value)}
                style=${{ width:48, textAlign:'center', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.15)', borderRadius:5, color:'#fff', fontSize:12, padding:'4px' }}/>
            </div>
            <div>
              <div style=${{ fontSize:8, color:'#FF4455', textAlign:'center' }}>Buts</div>
              <input type="number" min="0" value=${d.buts||0} onInput=${e => updZoneDef(z.id,'buts',e.target.value)}
                style=${{ width:48, textAlign:'center', background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.25)', borderRadius:5, color:'#FF4455', fontSize:12, padding:'4px' }}/>
            </div>
          </div>
        </div>`; })}

        <div style=${{ fontSize:11, fontWeight:700, color:'#7C6FFF', marginTop:14, marginBottom:8 }}>GRAND ESPACE</div>
        ${GRAND_ESPACE.map(sit => _h`<div key=${sit} style=${{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <div style=${{ fontSize:12, flex:1 }}>${sit}</div>
          <div style=${{ display:'flex', gap:8 }}>
            <div>
              <div style=${{ fontSize:8, color:'#4CAF50', textAlign:'center' }}>+</div>
              <input type="number" min="0" value=${form.stats.grand_espace[sit]?.pos||0} onInput=${e => updSit('grand_espace',sit,'pos',e.target.value)}
                style=${{ width:44, textAlign:'center', background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.2)', borderRadius:5, color:'#4CAF50', fontSize:11, padding:'3px' }}/>
            </div>
            <div>
              <div style=${{ fontSize:8, color:'#FF4455', textAlign:'center' }}>-</div>
              <input type="number" min="0" value=${form.stats.grand_espace[sit]?.neg||0} onInput=${e => updSit('grand_espace',sit,'neg',e.target.value)}
                style=${{ width:44, textAlign:'center', background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.2)', borderRadius:5, color:'#FF4455', fontSize:11, padding:'3px' }}/>
            </div>
          </div>
        </div>`)}

        <button class="btn btn-primary" style=${{ width:'100%', marginTop:16 }} onClick=${saveMatch}>✅ ${editingMatchId ? 'Enregistrer les modifications' : 'Enregistrer le match'}</button>
      </div>` : null}
    </div>`;
  }

  // ── DETAIL D'UN MATCH ────────────────────────────────────────────────
  if (view === 'detail' && selMatch) {
    const m = selMatch;
    const res = m.scoreNous > m.scoreEux ? '#4CAF50' : m.scoreNous < m.scoreEux ? '#FF4455' : '#FFB800';
    const label = m.scoreNous > m.scoreEux ? 'Victoire' : m.scoreNous < m.scoreEux ? 'Défaite' : 'Nul';
    const totalButs  = players.reduce((s,p) => s + (Number(m.stats?.attaque?.[p.id]?.['Buts'])||0), 0);
    const totalTirs  = players.reduce((s,p) => s + (Number(m.stats?.attaque?.[p.id]?.['Tirs'])||0), 0);
    const totalPasses = players.reduce((s,p) => s + (Number(m.stats?.attaque?.[p.id]?.['Passes clés'])||0), 0);
    const pctReussite = totalTirs > 0 ? Math.round(totalButs/totalTirs*100) : 0;
    // Interceptions : priorité aux points notés en direct (Stats Live), sinon on retombe sur la
    // saisie manuelle par joueur (onglet Défense).
    const totalInterceptionsManuel = players.reduce((s,p) => s + (Number(m.stats?.defense?.[p.id]?.['Interceptions'])||0), 0);
    const totalInterceptions = (m.interceptions && m.interceptions.length) ? m.interceptions.length : totalInterceptionsManuel;

    // Top scoreurs
    const scoreurs = players.map(p => ({ name:p.name, buts: Number(m.stats?.attaque?.[p.id]?.['Buts'])||0 }))
      .filter(p => p.buts > 0).sort((a,b) => b.buts - a.buts);

    function exportMatchCSV() {
      const rows = [['vs ' + (m.adversaire||''), m.date||'', (m.lieu==='domicile'?'Domicile':'Extérieur'), (m.scoreNous??'')+' - '+(m.scoreEux??'')]];
      rows.push([]);
      rows.push(['Attaque']);
      rows.push(['Joueur', ...STATS_ATTAQUE]);
      players.forEach(p => {
        const st = m.stats?.attaque?.[p.id] || {};
        const hasAny = STATS_ATTAQUE.some(s => st[s] !== '' && st[s] != null);
        if (hasAny) rows.push([p.name, ...STATS_ATTAQUE.map(s => st[s] ?? '')]);
      });
      rows.push([]);
      rows.push(['Défense']);
      rows.push(['Joueur', ...STATS_DEFENSE]);
      players.forEach(p => {
        const st = m.stats?.defense?.[p.id] || {};
        const hasAny = STATS_DEFENSE.some(s => st[s] !== '' && st[s] != null);
        if (hasAny) rows.push([p.name, ...STATS_DEFENSE.map(s => st[s] ?? '')]);
      });
      if (m.stats?.gardien) {
        const gLines = Object.entries(m.stats.gardien).filter(([gId, g]) => g && Object.values(g).some(v => Number(v) > 0));
        if (gLines.length) {
          rows.push([]);
          rows.push(['Gardien']);
          rows.push(['Joueur','Parades','Relances +','Relances -','6m contrés','9m contrés','7m arrêtés','6m non contrés','9m non contrés']);
          gLines.forEach(([gId, g]) => {
            const gName = (players.find(p => p.id === gId) || {}).name || gId;
            rows.push([gName, g.parade||0, g.relancePlus||0, g.relanceMoins||0, g.sixmC||0, g.neufmC||0, g.septm||0, g.sixmNC||0, g.neufmNC||0]);
          });
        }
      }
      downloadCSV('match_' + (m.adversaire||'').replace(/\s+/g,'_') + '_' + (m.date||localDateStr()) + '.csv', rows);
    }

    function exportMatchPDF() {
      try {
        const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
        if (!jsPDFCtor) { alert("La librairie d'export PDF n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
        const doc = new jsPDFCtor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        // Bandeau d'en-tête
        doc.setFillColor(11, 13, 16);
        doc.rect(0, 0, pageWidth, 64, 'F');
        doc.setTextColor(255, 164, 32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.text('vs ' + (m.adversaire || ''), 24, 28);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const dateLabel = m.date ? new Date(m.date + 'T12:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '';
        doc.text((m.lieu==='domicile'?'Domicile':'Extérieur') + (dateLabel ? ' · ' + dateLabel : '') + (m.possessions ? ' · ' + m.possessions + ' possessions' : ''), 24, 44);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const scoreTxt = (m.scoreNous!==''&&m.scoreNous!=null ? m.scoreNous : '—') + ' - ' + (m.scoreEux!==''&&m.scoreEux!=null ? m.scoreEux : '—') + '  (' + label + ')';
        doc.text(scoreTxt, pageWidth - 24, 36, { align: 'right' });

        let y = 84;
        const bottomMargin = 50;
        const ensureSpace = (needed) => {
          if (y + needed > doc.internal.pageSize.getHeight() - bottomMargin) { doc.addPage(); y = 40; }
        };
        const sectionTitle = (txt, col) => {
          ensureSpace(30);
          doc.setFillColor(col[0], col[1], col[2]);
          doc.rect(24, y, 4, 14, 'F');
          doc.setTextColor(30,30,34);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text(txt, 34, y + 11);
          y += 20;
        };
        const drawTable = (head, body, opts) => {
          opts = opts || {};
          doc.autoTable({
            head: [head], body, startY: y, margin: { left: 24, right: 24 },
            theme: 'grid',
            styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 4, textColor: [30,30,34], lineColor: [225,225,228], lineWidth: 0.5 },
            headStyles: { fillColor: [255,164,32], textColor: [20,20,24], fontStyle: 'bold', halign: 'center' },
            alternateRowStyles: { fillColor: [247,247,248] },
            columnStyles: Object.assign({ 0: { halign: 'left', fontStyle: 'bold' } }, opts.colStyles || {}),
            didParseCell: (data) => {
              if (data.section === 'body' && opts.cellColor) {
                const col = opts.cellColor(data.row.index, data.column.index, data.cell.raw);
                if (col) { data.cell.styles.textColor = col; data.cell.styles.fontStyle = 'bold'; }
              }
            },
            didDrawPage: () => {},
          });
          y = doc.lastAutoTable.finalY + 22;
        };

        // Code couleur des stats individuelles (vert = bon, orange = moyen, rouge = à travailler) :
        // pour chaque colonne "bonne" (ex. interceptions) ou "mauvaise" (ex. balles perdues), on
        // compare chaque joueur au meilleur total de ce match sur cette colonne — une échelle
        // relative aux autres joueurs du même match, plus parlante qu'un seuil absolu arbitraire.
        const COLOR_GOOD = [46,125,50], COLOR_MID = [204,120,20], COLOR_BAD = [198,40,40];
        function bandColor(value, max, direction) {
          if (direction === 'bad') {
            if (value === 0) return COLOR_GOOD;
            if (max === 0) return null;
            const ratio = value / max;
            return ratio >= 0.66 ? COLOR_BAD : ratio >= 0.33 ? COLOR_MID : COLOR_GOOD;
          }
          if (max === 0) return null;
          const ratio = value / max;
          return ratio >= 0.66 ? COLOR_GOOD : ratio >= 0.33 ? COLOR_MID : COLOR_BAD;
        }
        // Buts/Tirs sont colorés ensemble selon le % de réussite (ex. 3/3 = vert), pas selon un
        // classement entre joueurs — c'est l'efficacité au tir qui compte, pas le volume.
        function efficiencyColor(buts, tirs) {
          if (!tirs) return null;
          const pct = buts / tirs;
          return pct >= 0.7 ? COLOR_GOOD : pct >= 0.4 ? COLOR_MID : COLOR_BAD;
        }
        // Construit la fonction cellColor pour une table "Joueur + liste de stats", à partir
        // d'une map { nomStat: 'good'|'bad' } (les stats absentes de la map restent neutres).
        function makeStatColorer(rows, statNames, directions) {
          const colMax = statNames.map((s, i) => Math.max(0, ...rows.map(r => Number(r[i+1])||0)));
          return (rowIdx, colIdx) => {
            if (colIdx === 0) return null;
            const statName = statNames[colIdx-1];
            const dir = directions[statName];
            if (!dir) return null;
            const val = Number(rows[rowIdx][colIdx]) || 0;
            return bandColor(val, colMax[colIdx-1], dir);
          };
        }

        // Attaque (individuel)
        const attRows = players.map(p => {
          const st = m.stats?.attaque?.[p.id] || {};
          const hasAny = STATS_ATTAQUE.some(s => st[s] !== '' && st[s] != null);
          return hasAny ? [p.name, ...STATS_ATTAQUE.map(s => st[s] ?? 0)] : null;
        }).filter(Boolean);
        if (attRows.length) {
          sectionTitle('Attaque — statistiques individuelles', [255,164,32]);
          const attDir = { 'Duels gagnés':'good', 'Passes clés':'good', 'Balle perdue':'bad', 'Neutralisé':'bad', 'Duels perdus':'bad' };
          const butsIdx = STATS_ATTAQUE.indexOf('Buts') + 1, tirsIdx = STATS_ATTAQUE.indexOf('Tirs') + 1;
          const attColorer = makeStatColorer(attRows, STATS_ATTAQUE, attDir);
          drawTable(['Joueur', ...STATS_ATTAQUE], attRows, {
            cellColor: (rowIdx, colIdx) => {
              if (colIdx === butsIdx || colIdx === tirsIdx) return efficiencyColor(Number(attRows[rowIdx][butsIdx])||0, Number(attRows[rowIdx][tirsIdx])||0);
              return attColorer(rowIdx, colIdx);
            },
          });
        }

        // Secteurs de tir (équipe) — % de réussite par zone/type de tir, saisis à la main à
        // l'étape "Secteurs de tir" de la création du match (pas Stats Live).
        const hexToRgb = (hex) => { const h = hex.replace('#',''); return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)]; };
        const secteursTir = m.stats?.secteurs_tir || {};
        const secteursRows = CATEGORIES_TIR_LIVE.filter(c => (secteursTir[c.id] && secteursTir[c.id].tentes || 0) > 0);
        if (secteursRows.length) {
          ensureSpace(30 + secteursRows.length * 34);
          sectionTitle('Réussite par secteur de tir', [56,189,248]);
          // Libellé + résultat sur leur propre ligne, barre pleine largeur en dessous — évite
          // toute troncature de texte (ex. "Tir d'arrière extérieur") quel que soit le libellé.
          const barW = pageWidth - 48, barH = 11;
          let by = y + 4;
          secteursRows.forEach(c => {
            const d = secteursTir[c.id];
            const pct = d.tentes > 0 ? d.reussis / d.tentes : 0;
            const pctRound = Math.round(pct * 100);
            const rgb = hexToRgb(c.color);
            const resCol = pctRound >= 70 ? COLOR_GOOD : pctRound >= 40 ? COLOR_MID : COLOR_BAD;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30,30,34);
            doc.text(c.label, 24, by + 9);
            doc.setTextColor(resCol[0], resCol[1], resCol[2]);
            doc.text(d.reussis + '/' + d.tentes + ' (' + pctRound + '%)', pageWidth - 24, by + 9, { align: 'right' });
            const barY = by + 14;
            doc.setFillColor(240,240,241);
            doc.rect(24, barY, barW, barH, 'F');
            doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            doc.rect(24, barY, Math.max(barW * pct, 3), barH, 'F');
            by += 34;
          });
          y = by + 8;
        }

        // Défense (individuel)
        const defRows = players.map(p => {
          const st = m.stats?.defense?.[p.id] || {};
          const hasAny = STATS_DEFENSE.some(s => st[s] !== '' && st[s] != null);
          return hasAny ? [p.name, ...STATS_DEFENSE.map(s => st[s] ?? 0)] : null;
        }).filter(Boolean);
        if (defRows.length) {
          sectionTitle('Défense — statistiques individuelles', [56,189,248]);
          const defDir = { 'Duels perdus':'bad', 'Interceptions':'good', 'Neutralisation':'good', 'Contre':'good', 'Balle récup':'good', 'Duels gagnés':'good' };
          drawTable(['Joueur', ...STATS_DEFENSE], defRows, { cellColor: makeStatColorer(defRows, STATS_DEFENSE, defDir) });
        }

        // Gardien(s)
        if (m.stats?.gardien) {
          const gLines = Object.entries(m.stats.gardien).filter(([gId, g]) => g && Object.values(g).some(v => Number(v) > 0));
          if (gLines.length) {
            const gCols = ['Parades','Relances +','Relances -','6m contrés','9m contrés','7m arrêtés','6m non contrés','9m non contrés'];
            const gRows = gLines.map(([gId, g]) => {
              const gName = (players.find(p => p.id === gId) || {}).name || gId;
              return [gName, g.parade||0, g.relancePlus||0, g.relanceMoins||0, g.sixmC||0, g.neufmC||0, g.septm||0, g.sixmNC||0, g.neufmNC||0];
            });
            sectionTitle('Gardien', [124,111,255]);
            const gDir = { 'Parades':'good', 'Relances +':'good', 'Relances -':'bad', '6m contrés':'good', '9m contrés':'good', '7m arrêtés':'good', '6m non contrés':'bad', '9m non contrés':'bad' };
            drawTable(['Joueur', ...gCols], gRows, { cellColor: makeStatColorer(gRows, gCols, gDir) });
          }
        }

        // Secteurs des buts encaissés — heatmap de la cage à partir des positions notées en
        // direct (Stats Live). goalZone (ou à défaut goalX/goalY) donne la zone touchée.
        // Cette section est TOUJOURS affichée (avec un message explicatif si vide) pour qu'on
        // sache tout de suite si c'est "aucune donnée" ou un vrai bug d'affichage.
        {
          const liveEvents = m.liveDefense || [];
          const butsEvents = liveEvents.filter(e => e.resultat === 'but' || e.resultat === 'but_vide');
          const zoneCounts = { hg:0, hc:0, hd:0, bg:0, bc:0, bd:0 };
          let sansZone = 0;
          butsEvents.forEach(e => {
            let z = e.goalZone;
            if (!z && e.goalX != null && e.goalY != null) {
              const col = e.goalX < 33.33 ? 'g' : e.goalX < 66.66 ? 'c' : 'd';
              const row = e.goalY < 50 ? 'h' : 'b';
              z = row + col;
            }
            if (z && zoneCounts[z] != null) zoneCounts[z]++; else sansZone++;
          });
          const totalZoned = butsEvents.length - sansZone;

          // Repli sur les stats gardien saisies en mode classique (hors Stats Live) : les tirs
          // "non contrés" à 6m et 9m sont, par définition, des buts encaissés — on peut donc en
          // tirer une répartition par zone même sans avoir utilisé le suivi en direct. Le 7m n'y
          // est pas ventilé (seuls les arrêts y sont comptés, pas les buts).
          const gardienStats = m.stats?.gardien || {};
          let butsSixNC = 0, butsNeufNC = 0;
          Object.values(gardienStats).forEach(g => { if (!g) return; butsSixNC += Number(g.sixmNC)||0; butsNeufNC += Number(g.neufmNC)||0; });
          const totalClassique = butsSixNC + butsNeufNC;

          ensureSpace(230);
          sectionTitle('Secteurs des buts encaissés', [255,68,85]);

          if (totalZoned === 0 && totalClassique > 0) {
            // Petit diagramme en barres 6m / 9m, coloré selon le volume de buts encaissés.
            const rows = [ { label:'6 mètres', n: butsSixNC }, { label:'9 mètres', n: butsNeufNC } ];
            const maxN = Math.max(1, butsSixNC, butsNeufNC);
            const labelW = 90, barX = 24 + labelW, barMaxW = pageWidth - 48 - labelW - 70;
            let by = y + 4;
            rows.forEach(r => {
              const ratio = r.n / maxN;
              doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30,30,34);
              doc.text(r.label, 24, by + 13);
              doc.setFillColor(240,240,241);
              doc.rect(barX, by, barMaxW, 20, 'F');
              if (r.n > 0) {
                doc.setFillColor(255, Math.round(230 - ratio*170), Math.round(210 - ratio*185));
                doc.rect(barX, by, Math.max(barMaxW*ratio, 4), 20, 'F');
              }
              doc.setDrawColor(225,225,228); doc.setLineWidth(0.5); doc.rect(barX, by, barMaxW, 20);
              doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30,30,34);
              const pctTxt = totalClassique ? ' (' + Math.round(r.n/totalClassique*100) + '%)' : '';
              doc.text(r.n + ' but' + (r.n>1?'s':'') + pctTxt, barX + barMaxW + 8, by + 13);
              by += 28;
            });
            y = by + 4;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(130,130,134);
            const lines = doc.splitTextToSize("D'après les stats gardien saisies en mode classique (tirs \"non contrés\" par zone). Le 7m n'est pas représenté ici : seuls les arrêts y sont comptabilisés, pas les buts encaissés.", pageWidth - 48);
            doc.text(lines, 24, y);
            y += 12 * lines.length + 16;
          } else if (totalZoned === 0) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(130,130,134);
            const msg = butsEvents.length === 0
              ? "Aucun but encaissé n'a été noté (ni via Stats Live, ni via les tirs \"non contrés\" des stats gardien) pour ce match."
              : "Les buts encaissés de ce match n'ont pas de position enregistrée dans la cage (données saisies avant l'ajout de cette fonctionnalité).";
            const lines = doc.splitTextToSize(msg, pageWidth - 48);
            doc.text(lines, 24, y + 4);
            y += 14 * lines.length + 16;
          } else {
            const maxCount = Math.max(1, ...Object.values(zoneCounts));

            const gridW = 320, gridH = 190;
            const gridX = 24 + (pageWidth - 48 - gridW) / 2;
            const gridY = y;
            const cellW = gridW / 3, cellH = gridH / 2;
            const zonesOrder = [['hg','hc','hd'], ['bg','bc','bd']];

            doc.setFillColor(250, 250, 251);
            doc.rect(gridX, gridY, gridW, gridH, 'F');
            zonesOrder.forEach((rowArr, ri) => {
              rowArr.forEach((zid, ci) => {
                const cx = gridX + ci*cellW, cy = gridY + ri*cellH;
                const n = zoneCounts[zid];
                const ratio = n / maxCount;
                if (n > 0) {
                  doc.setFillColor(255, Math.round(230 - ratio*170), Math.round(210 - ratio*185));
                } else {
                  doc.setFillColor(246, 246, 247);
                }
                doc.rect(cx, cy, cellW, cellH, 'F');
                doc.setDrawColor(255,255,255);
                doc.setLineWidth(1.5);
                doc.rect(cx, cy, cellW, cellH);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor(n > 0 ? 255 : 190, n > 0 ? 255 : 190, n > 0 ? 255 : 195);
                doc.text(String(n), cx + cellW/2, cy + cellH/2 - 2, { align: 'center' });
                if (n > 0) {
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(8);
                  doc.text(Math.round(n/totalZoned*100) + '%', cx + cellW/2, cy + cellH/2 + 14, { align: 'center' });
                }
              });
            });
            doc.setDrawColor(30,30,34);
            doc.setLineWidth(2.5);
            doc.rect(gridX, gridY, gridW, gridH);
            // Ligne de séparation centrale gardien, pour repère visuel de la cage
            doc.setDrawColor(30,30,34);
            doc.setLineWidth(1);
            doc.line(gridX, gridY + gridH/2, gridX + gridW, gridY + gridH/2);
            doc.line(gridX + gridW/3, gridY, gridX + gridW/3, gridY + gridH);
            doc.line(gridX + 2*gridW/3, gridY, gridX + 2*gridW/3, gridY + gridH);

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(120,120,124);
            doc.text('Vue depuis la position du tireur, face à notre cage', gridX + gridW/2, gridY + gridH + 14, { align: 'center' });
            let noteY = gridY + gridH + 14;
            if (sansZone > 0) { noteY += 12; doc.text(sansZone + ' but' + (sansZone>1?'s':'') + ' sans zone précisée non représenté' + (sansZone>1?'s':''), gridX + gridW/2, noteY, { align: 'center' }); }
            y = noteY + 24;
          }
        }

        // Origine des tirs et buts encaissés (saisie après match : pivot, ailiers, arrières…)
        {
          const zd = m.stats?.zones_def || {};
          const zRows = ZONES_TIR_ENCAISSES.map(z => ({ z, t: Number(zd[z.id]?.tirs)||0, b: Number(zd[z.id]?.buts)||0 })).filter(r => r.t + r.b > 0);
          if (zRows.length) {
            const totT = zRows.reduce((a, r) => a + r.t, 0), totB = zRows.reduce((a, r) => a + r.b, 0);
            sectionTitle("Origine des tirs et buts encaissés", [255,68,85]);
            const barW = pageWidth - 48, barH = 11;
            ensureSpace(zRows.length * 34 + 10);
            let by = y + 4;
            zRows.forEach(({ z, t, b }) => {
              const pct = totT ? t / totT : 0;
              const eff = t ? Math.round(b / t * 100) : 0;
              const rgb = hexToRgb(z.col);
              doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30,30,34);
              doc.text(z.id, 24, by + 9);
              const effCol = eff >= 60 ? COLOR_BAD : eff >= 35 ? COLOR_MID : COLOR_GOOD;
              doc.setTextColor(effCol[0], effCol[1], effCol[2]);
              doc.text(b + ' but' + (b>1?'s':'') + ' / ' + t + ' tir' + (t>1?'s':'') + ' (' + eff + '% réussite adverse)', pageWidth - 24, by + 9, { align: 'right' });
              const barY = by + 14;
              doc.setFillColor(240,240,241); doc.rect(24, barY, barW, barH, 'F');
              doc.setFillColor(rgb[0], rgb[1], rgb[2]); doc.rect(24, barY, Math.max(barW * pct, 3), barH, 'F');
              by += 34;
            });
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(130,130,134);
            doc.text('Total : ' + totB + ' but' + (totB>1?'s':'') + ' encaissé' + (totB>1?'s':'') + ' sur ' + totT + ' tir' + (totT>1?'s':'') + ' subi' + (totT>1?'s':'') + ' — la barre = part des tirs subis depuis ce poste.', 24, by + 4);
            y = by + 24;
          }
        }

        // Stats Live défense : tirs subis par type de situation (buts / arrêts / hors cadre) + gardiens
        {
          const live = m.liveDefense || [];
          if (live.length) {
            const rowsL = CRITERES_LIVE_DEF.map(c => {
              const ev = live.filter(e => e.type === c.id);
              if (!ev.length) return null;
              const buts = ev.filter(e => e.resultat === 'but' || e.resultat === 'but_vide').length;
              const arrets = ev.filter(e => e.resultat === 'arret').length;
              const hc = ev.filter(e => e.resultat === 'hors_cadre').length;
              return [c.label, ev.length, buts, arrets, hc];
            }).filter(Boolean);
            const totButsL = live.filter(e => e.resultat === 'but' || e.resultat === 'but_vide').length;
            const cadres = live.filter(e => e.resultat === 'but' || e.resultat === 'arret');
            const arrTot = live.filter(e => e.resultat === 'arret').length;
            sectionTitle('Tirs subis notés en direct — par situation', [255,68,85]);
            rowsL.push(['TOTAL', live.length, totButsL, arrTot, live.filter(e => e.resultat === 'hors_cadre').length]);
            drawTable(['Situation','Tirs subis','Buts','Arrêts','Hors cadre'], rowsL, {
              cellColor: (ri, ci) => ci === 2 ? COLOR_BAD : ci === 3 ? COLOR_GOOD : null,
            });
            const gRowsL = gardiens.map(g => {
              const evG = live.filter(e => e.gardienId === g.id && (e.resultat === 'but' || e.resultat === 'arret'));
              if (!evG.length) return null;
              const ar = evG.filter(e => e.resultat === 'arret').length;
              return [g.name, evG.length, ar, Math.round(ar / evG.length * 100) + '%'];
            }).filter(Boolean);
            if (gRowsL.length) {
              sectionTitle('Gardiens — arrêts sur tirs cadrés (direct)', [124,111,255]);
              drawTable(['Gardien','Tirs cadrés','Arrêts','% d\'arrêts'], gRowsL, {});
            } else if (cadres.length) {
              doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(130,130,134);
              doc.text('Équipe : ' + arrTot + '/' + cadres.length + ' arrêts (' + Math.round(arrTot / cadres.length * 100) + '%)', 24, y - 10);
            }
          }
        }

        // Situations de jeu (attaque, défense, grand espace) : + / -
        {
          const sit = (cat, list) => list.map(n => { const d = m.stats?.[cat]?.[n]; return d && ((d.pos||0) + (d.neg||0)) > 0 ? [n, d.pos||0, d.neg||0] : null; }).filter(Boolean);
          const blocs = [
            ['Situations de jeu — attaque', sit('situations_att', SITUATIONS_JEU_ATT), [255,164,32]],
            ['Situations de jeu — défense', sit('situations_def', SITUATIONS_JEU_DEF), [56,189,248]],
            ['Grand espace', sit('grand_espace', GRAND_ESPACE), [124,111,255]],
          ];
          blocs.forEach(([titre, rowsS, col]) => {
            if (!rowsS.length) return;
            sectionTitle(titre, col);
            drawTable(['Situation','+','-'], rowsS, { cellColor: (ri, ci) => ci === 1 ? COLOR_GOOD : ci === 2 ? COLOR_BAD : null });
          });
        }

        // Récap notés en direct (Stats Live) : interceptions, pertes provoquées, contres, neutralisations, relances gardien
        const directs = [
          { list: m.interceptions||[], label: 'Interceptions' },
          { list: m.pertesProvoquees||[], label: 'Pertes provoquées' },
          { list: m.contres||[], label: 'Contres' },
          { list: m.neutralisations||[], label: 'Neutralisations' },
        ];
        if (directs.some(d => d.list.length > 0)) {
          const parJoueur = {};
          directs.forEach(({list, label}) => {
            list.forEach(ev => {
              if (!ev.playerId) return;
              parJoueur[ev.playerId] = parJoueur[ev.playerId] || {};
              parJoueur[ev.playerId][label] = (parJoueur[ev.playerId][label] || 0) + 1;
            });
          });
          const labels = directs.map(d => d.label);
          const rows = Object.entries(parJoueur).map(([pid, counts]) => {
            const p = players.find(pp => pp.id === pid);
            return [p ? p.name : pid, ...labels.map(l => counts[l] || 0)];
          }).filter(r => labels.some((l,i) => r[i+1] > 0));
          if (rows.length) {
            sectionTitle('Notés en direct — par joueur', [76,175,80]);
            const directDir = Object.fromEntries(labels.map(l => [l, 'good']));
            drawTable(['Joueur', ...labels], rows, { cellColor: makeStatColorer(rows, labels, directDir) });
          }
        }
        if ((m.relancesGardien||[]).length) {
          const parGardien = {};
          m.relancesGardien.forEach(ev => {
            if (!ev.playerId) return;
            parGardien[ev.playerId] = parGardien[ev.playerId] || { pos: 0, neg: 0 };
            if (ev.sens === 'neg') parGardien[ev.playerId].neg++; else parGardien[ev.playerId].pos++;
          });
          const rows = Object.entries(parGardien).map(([pid, c]) => {
            const p = players.find(pp => pp.id === pid);
            return [p ? p.name : pid, c.pos, c.neg];
          });
          if (rows.length) {
            sectionTitle('Relances gardien', [124,111,255]);
            drawTable(['Joueur','Relances +','Relances -'], rows, { cellColor: makeStatColorer(rows, ['Relances +','Relances -'], { 'Relances +':'good', 'Relances -':'bad' }) });
          }
        }

        doc.setFontSize(8);
        doc.setTextColor(140,140,140);
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text('PerfHand — page ' + i + '/' + pageCount, pageWidth - 100, doc.internal.pageSize.getHeight() - 14);
        }

        doc.save('match_' + (m.adversaire||'').replace(/\s+/g,'_') + '_' + (m.date||localDateStr()) + '.pdf');
      } catch (e) {
        console.error('[PerfHand] Export PDF match:', e);
        alert("Erreur lors de l'export PDF : " + (e && e.message || e));
      }
    }

    return _h`<div>
      <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <button class="btn btn-sm" onClick=${() => { setView('liste'); setSelMatch(null); }}>← Matchs</button>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>vs ${m.adversaire}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${new Date(m.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <button class="btn btn-sm" style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.35)', color:'#38BDF8', fontWeight:700 }}
          onClick=${() => editMatch(m)}>✏️ Modifier les statistiques</button>
        <button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.35)', color:'#4CAF50', fontWeight:700 }}
          onClick=${exportMatchCSV}>⬇️ CSV</button>
        <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.35)', color:'#FFA420', fontWeight:700 }}
          onClick=${exportMatchPDF}>📄 PDF détaillé</button>
      </div>

      <!-- Score -->
      <div style=${{ background:res+'10', border:'2px solid '+res+'40', borderRadius:14, padding:'16px', marginBottom:16, textAlign:'center' }}>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:4 }}>${m.lieu==='domicile'?'🏠 Domicile':'✈️ Extérieur'}</div>
        ${!editScore ? _h`<div>
          <div style=${{ fontSize:42, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:res }}>${m.scoreNous!==''&&m.scoreNous!=null ? m.scoreNous : '—'} - ${m.scoreEux!==''&&m.scoreEux!=null ? m.scoreEux : '—'}</div>
          <div style=${{ fontSize:13, fontWeight:700, color:res, marginBottom:8 }}>${label}</div>
          <button class="btn btn-sm" onClick=${() => { setScoreForm({ scoreNous: m.scoreNous||'', scoreEux: m.scoreEux||'' }); setEditScore(true); }}>✏️ Modifier le score</button>
        </div>` : _h`<div>
          <div style=${{ display:'flex', gap:10, alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <input class="inp" type="number" placeholder="Nous" value=${scoreForm.scoreNous} onInput=${e=>setScoreForm(f=>({...f, scoreNous:e.target.value}))}
              style=${{ width:70, textAlign:'center', fontSize:20, fontWeight:800 }}/>
            <span style=${{ fontSize:20, color:'rgba(255,255,255,.4)' }}>-</span>
            <input class="inp" type="number" placeholder="Eux" value=${scoreForm.scoreEux} onInput=${e=>setScoreForm(f=>({...f, scoreEux:e.target.value}))}
              style=${{ width:70, textAlign:'center', fontSize:20, fontWeight:800 }}/>
          </div>
          <div style=${{ display:'flex', gap:8, justifyContent:'center' }}>
            <button class="btn btn-sm" onClick=${() => setEditScore(false)}>Annuler</button>
            <button class="btn btn-sm btn-primary" onClick=${() => {
              const updatedMatch = { ...m, scoreNous: scoreForm.scoreNous, scoreEux: scoreForm.scoreEux };
              const updated = matchs.map(mm => mm.id === m.id ? updatedMatch : mm);
              saveMatchsDirect(updated);
              setSelMatch(updatedMatch);
              setEditScore(false);
            }}>✓ Enregistrer</button>
          </div>
        </div>`}
      </div>

      <!-- Récap Stats Live (buts encaissés notés en direct) -->
      ${(() => {
        const events = m.liveDefense || [];
        // Un événement noté en direct peut être un but, un arrêt, un tir hors cadre ou un but
        // dans une cage vide — seuls "but" et "but_vide" sont réellement des buts encaissés.
        const butsEncaisses = events.filter(e => e.resultat === 'but' || e.resultat === 'but_vide').length;
        return _h`<div class="card" style=${{ marginBottom:16, border:'1px solid rgba(255,68,85,.2)' }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style=${{ fontSize:12, fontWeight:800, color:'#FF4455' }}>🔴 Stats Live — Défense</div>
            <button class="btn btn-sm" style=${{ background:'rgba(255,68,85,.12)', border:'1px solid rgba(255,68,85,.4)', color:'#FF4455', fontWeight:700 }}
              onClick=${() => { setLiveMatchId(m.id); setView('live'); }}>${events.length>0?'✏️ Modifier':'🔴 Démarrer'} en direct</button>
          </div>
          ${events.length === 0 ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.3)', textAlign:'center', padding:'10px 0' }}>Aucun point noté en direct pour ce match pour le moment.</div>`
          : _h`<div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:10 }}>${butsEncaisses} but${butsEncaisses>1?'s':''} encaissé${butsEncaisses>1?'s':''} · ${events.length} tir${events.length>1?'s':''} noté${events.length>1?'s':''} au total (arrêts et hors cadre compris)</div>
            <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${CRITERES_LIVE_DEF.map(c => {
                const evC = events.filter(e => e.type === c.id);
                const n = evC.length;
                if (n === 0) return null;
                const buts = evC.filter(e => e.resultat !== 'arret' && e.resultat !== 'hors_cadre').length;
                const arrets = evC.filter(e => e.resultat === 'arret').length;
                const horsCadre = evC.filter(e => e.resultat === 'hors_cadre').length;
                const butVide = evC.filter(e => e.resultat === 'but_vide').length;
                const pct = Math.round(n/events.length*100);
                return _h`<div key=${c.id}>
                  <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style=${{ fontSize:11, width:130, color:c.color, fontWeight:600, flexShrink:0 }}>${c.icon} ${c.label}</span>
                    <div style=${{ flex:1, height:7, background:'rgba(255,255,255,.05)', borderRadius:4, overflow:'hidden' }}>
                      <div style=${{ width:pct+'%', height:'100%', background:c.color }}></div>
                    </div>
                    <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)', width:34, textAlign:'right', flexShrink:0 }}>${n}</span>
                  </div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginLeft:138, marginTop:2 }}>${buts} but${buts>1?'s':''} · ${arrets} arrêt${arrets>1?'s':''}${horsCadre>0?' · '+horsCadre+' hors cadre':''}${butVide>0?' · dont '+butVide+' en but vide':''}</div>
                </div>`;
              })}
            </div>
            <div style=${{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.06)' }}>
              ${(() => {
                const tirsCadres = events.filter(e => e.resultat === 'but' || e.resultat === 'arret');
                const arretsTotal = events.filter(e => e.resultat === 'arret').length;
                const pctTotal = tirsCadres.length ? Math.round(arretsTotal / tirsCadres.length * 100) : 0;
                return _h`<div style=${{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  <span style=${{ fontWeight:700, color:'rgba(255,255,255,.6)' }}>Toute l'équipe</span>
                  <span style=${{ color:'#4CAF50', fontWeight:700 }}>${arretsTotal}/${tirsCadres.length} arrêts (${pctTotal}%)</span>
                </div>`;
              })()}
              ${gardiens.length === 0 ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.25)' }}>Aucun gardien dans l'effectif.</div>`
              : !events.some(e => e.gardienId) ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.25)' }}>💡 Aucun gardien renseigné sur ces points — sélectionne-le lors de la saisie en direct.</div>`
              : gardiens.map(g => {
                const evG = events.filter(e => e.gardienId === g.id && (e.resultat === 'but' || e.resultat === 'arret'));
                if (evG.length === 0) return null;
                const arrets = evG.filter(e => e.resultat === 'arret').length;
                const pctArret = Math.round(arrets / evG.length * 100);
                return _h`<div key=${g.id} style=${{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                  <span style=${{ fontWeight:700 }}>🧤 ${g.name}</span>
                  <span style=${{ color:'#4CAF50', fontWeight:700 }}>${arrets}/${evG.length} arrêts (${pctArret}%)</span>
                </div>`;
              })}
            </div>
          </div>`}
        </div>`;
      })()}

      <!-- Bonnes défenses : interceptions notées en direct -->
      ${(m.interceptions||[]).length > 0 ? _h`<div class="card" style=${{ marginBottom:16, border:'1px solid rgba(76,175,80,.25)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:12, fontWeight:800, color:'#4CAF50' }}>🛡️ Bonnes défenses</div>
          <span style=${{ fontSize:12, color:'#4CAF50', fontWeight:800 }}>${m.interceptions.length} interception${m.interceptions.length>1?'s':''}</span>
        </div>
        <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
          ${(() => {
            const parJoueur = {};
            m.interceptions.forEach(ev => { if (ev.playerId) parJoueur[ev.playerId] = (parJoueur[ev.playerId]||0) + 1; });
            const sansJoueur = m.interceptions.filter(ev => !ev.playerId).length;
            return _h`<div>
              ${Object.entries(parJoueur).sort((a,b) => b[1]-a[1]).map(([pid, n]) => {
                const p = players.find(pp => pp.id === pid);
                if (!p) return null;
                return _h`<div key=${pid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'3px 0' }}>
                  <span>${p.name}</span>
                  <span style=${{ color:'#4CAF50', fontWeight:700 }}>${n}</span>
                </div>`;
              })}
              ${sansJoueur > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)', padding:'3px 0' }}>
                <span>Non attribuées</span>
                <span>${sansJoueur}</span>
              </div>` : null}
            </div>`;
          })()}
        </div>
      </div>` : null}

      <!-- Pertes de balle provoquées, Contres, Neutralisations : même récap que les interceptions -->
      ${[
        { list: m.pertesProvoquees||[], titre:'🧱 Pertes de balle provoquées', unite:'provoquée', col:'#FFA420' },
        { list: m.contres||[], titre:'✋ Contres', unite:'contre', col:'#7C6FFF' },
        { list: m.neutralisations||[], titre:'🚫 Neutralisations', unite:'neutralisation', col:'#38BDF8' },
      ].map(({list, titre, unite, col}) => list.length === 0 ? null : _h`<div key=${titre} class="card" style=${{ marginBottom:16, border:'1px solid '+col+'25' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:12, fontWeight:800, color:col }}>${titre}</div>
          <span style=${{ fontSize:12, color:col, fontWeight:800 }}>${list.length} ${unite}${list.length>1?'s':''}</span>
        </div>
        <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
          ${(() => {
            const parJoueur = {};
            list.forEach(ev => { if (ev.playerId) parJoueur[ev.playerId] = (parJoueur[ev.playerId]||0) + 1; });
            const sansJoueur = list.filter(ev => !ev.playerId).length;
            return _h`<div>
              ${Object.entries(parJoueur).sort((a,b) => b[1]-a[1]).map(([pid, n]) => {
                const p = players.find(pp => pp.id === pid);
                if (!p) return null;
                return _h`<div key=${pid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'3px 0' }}>
                  <span>${p.name}</span>
                  <span style=${{ color:col, fontWeight:700 }}>${n}</span>
                </div>`;
              })}
              ${sansJoueur > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)', padding:'3px 0' }}>
                <span>Non attribués</span>
                <span>${sansJoueur}</span>
              </div>` : null}
            </div>`;
          })()}
        </div>
      </div>`)}

      <!-- Relances gardien : récap positif/négatif par gardien -->
      ${(m.relancesGardien||[]).length > 0 ? _h`<div class="card" style=${{ marginBottom:16, border:'1px solid rgba(255,255,255,.12)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style=${{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.7)' }}>🥅 Relances gardien</div>
          <span style=${{ fontSize:12, color:'rgba(255,255,255,.7)', fontWeight:800 }}>${m.relancesGardien.length} relance${m.relancesGardien.length>1?'s':''}</span>
        </div>
        <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
          ${(() => {
            const parGardien = {};
            m.relancesGardien.forEach(ev => {
              if (!ev.gardienId) return;
              if (!parGardien[ev.gardienId]) parGardien[ev.gardienId] = { pos:0, neg:0 };
              parGardien[ev.gardienId][ev.sens === 'neg' ? 'neg' : 'pos']++;
            });
            const sansGardien = m.relancesGardien.filter(ev => !ev.gardienId).length;
            return _h`<div>
              ${Object.entries(parGardien).map(([gid, c]) => {
                const g = players.find(pp => pp.id === gid);
                if (!g) return null;
                return _h`<div key=${gid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'3px 0' }}>
                  <span>🧤 ${g.name}</span>
                  <span><span style=${{ color:'#4CAF50', fontWeight:700 }}>+${c.pos}</span> <span style=${{ color:'rgba(255,255,255,.3)' }}>/</span> <span style=${{ color:'#FF4455', fontWeight:700 }}>−${c.neg}</span></span>
                </div>`;
              })}
              ${sansGardien > 0 ? _h`<div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'rgba(255,255,255,.35)', padding:'3px 0' }}>
                <span>Non attribuées</span>
                <span>${sansGardien}</span>
              </div>` : null}
            </div>`;
          })()}
        </div>
      </div>` : null}

      <!-- Temps de jeu : récap par joueur -->
      ${Object.values(m.tempsJeu||{}).some(d => (d.segments||[]).length > 0) ? _h`<div class="card" style=${{ marginBottom:16, border:'1px solid rgba(255,255,255,.12)' }}>
        <div style=${{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.7)', marginBottom:10 }}>⏱️ Temps de jeu</div>
        <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
          ${(() => {
            const rows = Object.entries(m.tempsJeu||{}).map(([pid, d]) => {
              const p = players.find(pp => pp.id === pid);
              const segs = (d && d.segments) || [];
              if (!p || !segs.length) return null;
              const ms = segs.reduce((s, seg) => s + ((seg.out || Date.now()) - seg.in), 0);
              return { pid, name: p.name, ms };
            }).filter(Boolean).sort((a,b) => b.ms - a.ms);
            return rows.map(r => {
              const totalSec = Math.floor(r.ms/1000);
              const mn = Math.floor(totalSec/60), sc = totalSec%60;
              return _h`<div key=${r.pid} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, padding:'3px 0' }}>
                <span>${r.name}</span>
                <span style=${{ fontWeight:700 }}>${String(mn).padStart(2,'0')}:${String(sc).padStart(2,'0')}</span>
              </div>`;
            });
          })()}
        </div>
      </div>` : null}

      <!-- Stats équipe -->
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(90px, 1fr))', gap:8, marginBottom:16 }}>
        ${[[totalButs,'Buts','#FFA420'],[totalTirs,'Tirs','#38BDF8'],[pctReussite+'%','Réussite','#4CAF50'],[totalPasses,'Passes clés','#7C6FFF'],[m.possessions || '—','Possessions','#EC4899'],[(m.liveDefense||[]).length ? (m.liveDefense||[]).filter(e => e.resultat === 'but' || e.resultat === 'but_vide').length : '—','Buts pris','#FF4455'],[totalInterceptions || '—','Interceptions','#4CAF50'],[(m.pertesProvoquees||[]).length || '—','Pertes prov.','#FFA420'],[(m.contres||[]).length || '—','Contres','#7C6FFF'],[(m.neutralisations||[]).length || '—','Neutra.','#38BDF8'],[(m.relancesGardien||[]).length ? ((m.relancesGardien.filter(e=>e.sens!=='neg').length)+'/'+((m.relancesGardien||[]).length)) : '—','Relances +','#4CAF50']].map(([v,l,c]) => _h`<div key=${l} style=${{ background:c+'10', border:'1px solid '+c+'25', borderRadius:10, padding:'10px', textAlign:'center' }}>
          <div style=${{ fontSize:22, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)' }}>${l}</div>
        </div>`)}
      </div>
      ${m.possessions ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textAlign:'center', marginTop:-10, marginBottom:16 }}>
        Efficacité : ${(totalButs / Number(m.possessions)).toFixed(2)} but${totalButs>1?'s':''} par possession (${totalButs}/${m.possessions})
      </div>` : null}

      <!-- Secteurs de tir : % de réussite -->
      ${Object.keys(m.stats?.secteurs_tir||{}).some(k => (m.stats.secteurs_tir[k].tentes||0) > 0) ? _h`<div style=${{ marginBottom:16 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Réussite par secteur de jeu</div>
        <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
          ${CATEGORIES_TIR_LIVE.filter(c => (m.stats?.secteurs_tir?.[c.id]?.tentes||0) > 0).map(c => {
            const d = m.stats.secteurs_tir[c.id];
            const pct = d.tentes > 0 ? Math.round(d.reussis/d.tentes*100) : 0;
            return _h`<div key=${c.id}>
              <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                <span style=${{ fontSize:11, width:150, color:c.color, fontWeight:600, flexShrink:0 }}>${c.icon} ${c.label}</span>
                <div style=${{ flex:1, height:7, background:'rgba(255,255,255,.05)', borderRadius:4, overflow:'hidden' }}>
                  <div style=${{ width:pct+'%', height:'100%', background:c.color }}></div>
                </div>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)', width:60, textAlign:'right', flexShrink:0 }}>${d.reussis}/${d.tentes} (${pct}%)</span>
              </div>
            </div>`;
          })}
        </div>
      </div>` : null}

      <!-- Top scoreurs -->
      ${scoreurs.length > 0 ? _h`<div style=${{ marginBottom:16 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Top scoreurs</div>
        ${scoreurs.slice(0,5).map((s, i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <div style=${{ fontSize:12 }}>${i+1}. ${s.name}</div>
          <div style=${{ fontSize:16, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif" }}>${s.buts} but${s.buts>1?'s':''}</div>
        </div>`)}
      </div>` : null}

      <!-- Stats par joueur -->
      <div style=${{ marginBottom:16 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Stats individuelles — Attaque</div>
        <div style=${{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
            <thead><tr>
              <th style=${{ padding:'6px 8px', textAlign:'left', fontSize:9, color:'rgba(255,255,255,.3)', borderBottom:'1px solid rgba(255,255,255,.06)', position:'sticky', left:0, background:'#111' }}>Joueur</th>
              ${STATS_ATTAQUE.map(s => _h`<th key=${s} style=${{ padding:'6px 5px', fontSize:8, color:'rgba(255,255,255,.3)', borderBottom:'1px solid rgba(255,255,255,.06)', textAlign:'center', whiteSpace:'nowrap' }}>${s}</th>`)}
            </tr></thead>
            <tbody>
              ${players.filter(p => Object.values(m.stats?.attaque?.[p.id]||{}).some(v=>Number(v)>0)).map(p => _h`<tr key=${p.id}>
                <td style=${{ padding:'6px 8px', fontSize:11, fontWeight:600, position:'sticky', left:0, background:'#111', whiteSpace:'nowrap', borderBottom:'1px solid rgba(255,255,255,.04)' }}>${p.name.split(' ')[1]||p.name}</td>
                ${STATS_ATTAQUE.map(s => _h`<td key=${s} style=${{ padding:'6px 5px', textAlign:'center', fontSize:12, borderBottom:'1px solid rgba(255,255,255,.04)',
                  color: Number(m.stats?.attaque?.[p.id]?.[s])>0 ? (s==='Buts'?'#FFA420':s==='Balle perdue'||s==='Duels perdus'?'#FF4455':'rgba(255,255,255,.7)') : 'rgba(255,255,255,.2)',
                  fontWeight: Number(m.stats?.attaque?.[p.id]?.[s])>0 ? 700 : 400
                }}>${m.stats?.attaque?.[p.id]?.[s]||'—'}</td>`)}
              </tr>`)}
              <tr style=${{ background:'rgba(255,164,32,.05)' }}>
                <td style=${{ padding:'6px 8px', fontSize:10, fontWeight:800, color:'#FFA420', position:'sticky', left:0, background:'rgba(30,20,0,.9)' }}>TOTAL</td>
                ${STATS_ATTAQUE.map(s => _h`<td key=${s} style=${{ padding:'6px 5px', textAlign:'center', fontSize:12, fontWeight:800, color:'#FFA420' }}>
                  ${players.reduce((acc,p) => acc + (Number(m.stats?.attaque?.[p.id]?.[s])||0), 0)||'—'}
                </td>`)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Origine des tirs / buts encaissés -->
      ${ZONES_TIR_ENCAISSES.some(z => ((m.stats?.zones_def?.[z.id]?.tirs)||0) + ((m.stats?.zones_def?.[z.id]?.buts)||0) > 0) ? (() => {
        const tot = ZONES_TIR_ENCAISSES.reduce((a, z) => ({ tirs: a.tirs + (Number(m.stats.zones_def[z.id]?.tirs)||0), buts: a.buts + (Number(m.stats.zones_def[z.id]?.buts)||0) }), { tirs:0, buts:0 });
        return _h`<div style=${{ marginBottom:12 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Origine des tirs & buts encaissés · ${tot.buts} but${tot.buts>1?'s':''} / ${tot.tirs} tir${tot.tirs>1?'s':''}</div>
          <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
            ${ZONES_TIR_ENCAISSES.map(z => {
              const d = m.stats.zones_def[z.id] || {}; const t = Number(d.tirs)||0, b = Number(d.buts)||0;
              if (t + b === 0) return null;
              const pct = tot.tirs ? Math.round(Math.max(t,b) / tot.tirs * 100) : 0;
              const eff = t ? Math.round(b / t * 100) : 0;
              return _h`<div key=${z.id} style=${{ display:'flex', alignItems:'center', gap:8 }}>
                <span style=${{ fontSize:11, width:130, color:z.col, fontWeight:600, flexShrink:0 }}>${z.icon} ${z.id}</span>
                <div style=${{ flex:1, height:7, background:'rgba(255,255,255,.05)', borderRadius:4, overflow:'hidden' }}><div style=${{ width:pct+'%', height:'100%', background:z.col }}></div></div>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.6)', width:92, textAlign:'right', flexShrink:0 }}>${b} but${b>1?'s':''} / ${t} tir${t>1?'s':''}${t ? ' ('+eff+'%)' : ''}</span>
              </div>`;
            })}
          </div>
        </div>`;
      })() : null}

      <!-- Situations de jeu -->
      ${Object.keys(m.stats?.situations_att||{}).some(k => m.stats.situations_att[k].pos > 0 || m.stats.situations_att[k].neg > 0) ? _h`<div style=${{ marginBottom:12 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Situations de jeu</div>
        <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
          ${[...SITUATIONS_JEU_ATT.filter(s => (m.stats?.situations_att?.[s]?.pos||0)+(m.stats?.situations_att?.[s]?.neg||0)>0).map(s => ({s, cat:'att', col:'#FFA420', d:m.stats.situations_att[s]})),
             ...SITUATIONS_JEU_DEF.filter(s => (m.stats?.situations_def?.[s]?.pos||0)+(m.stats?.situations_def?.[s]?.neg||0)>0).map(s => ({s, cat:'def', col:'#38BDF8', d:m.stats.situations_def[s]})),
             ...GRAND_ESPACE.filter(s => (m.stats?.grand_espace?.[s]?.pos||0)+(m.stats?.grand_espace?.[s]?.neg||0)>0).map(s => ({s, cat:'ge', col:'#7C6FFF', d:m.stats.grand_espace[s]}))
          ].map(({s, col, d}) => _h`<div key=${s} style=${{ background:col+'08', border:'1px solid '+col+'25', borderRadius:9, padding:'7px 10px', textAlign:'center' }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:3 }}>${s}</div>
            <div style=${{ display:'flex', gap:8 }}>
              <span style=${{ color:'#4CAF50', fontWeight:700, fontSize:13 }}>+${d.pos||0}</span>
              <span style=${{ color:'#FF4455', fontWeight:700, fontSize:13 }}>-${d.neg||0}</span>
            </div>
          </div>`)}
        </div>
      </div>` : null}

      <button class="btn btn-sm btn-danger" style=${{ marginTop:8 }}
        onClick=${() => {
          saveMatchsDirect(matchs.filter(x=>x.id!==m.id));
          setView('liste'); setSelMatch(null);
        }}>Supprimer ce match</button>
    </div>`;
  }

  return null;
}
