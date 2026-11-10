
// ── SUPER ADMIN VIEW — Vue de tous les tenants (leo.chabanis@gmail.com) ───────────────
// ── LEGACY ADMIN VIEW — Espace coach Leo (USM + profils individuels) ──────────
function AdminView() {
  const { db, setDb, logout, resetDb } = useApp();
  const [page, setPage] = useState('overview');
  const [selClub, setSelClub] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [clubTab, setClubTab] = useState('effectif');
  const [showAddClub, setShowAddClub] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newClubForm, setNewClubForm] = useState({ name:'', division:'Nationale 1', coachName:'', coachEmail:'' });
  const [renameClubId, setRenameClubId] = useState(null);
  const [renameClubVal, setRenameClubVal] = useState('');
  const [newPlayerForm, setNewPlayerForm] = useState({ name:'', num:'', pos:'Arrière', age:'', poids:'', taille:'', email:'', genre:'M' });
  const [showAddPerso, setShowAddPerso] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [importText, setImportText] = useState('');
  const [editPerso, setEditPerso] = useState(null);
  const [selPerso, setSelPerso] = useState(null);
  const [rapportPerso, setRapportPerso] = useState(null);

  const playersPerso = (db.playersPerso || []).filter(p => !p.archived);
  const playersPersoArchives = (db.playersPerso || []).filter(p => p.archived);
  const [showImportPerso, setShowImportPerso] = React.useState(false);
  const [importCode, setImportCode] = React.useState('');
  const [importError, setImportError] = React.useState('');

  function importProfil() {
    try {
      const json = decodeURIComponent(escape(atob(importCode.trim())));
      const data = JSON.parse(json);
      if (!data.v || !data.name) { setImportError('Code invalide.'); return; }
      const already = (db.playersPerso||[]).find(p => p.email && p.email === data.email);
      if (already) { setImportError('Un profil avec cet email existe deja (' + data.name + ').'); return; }
      const newId = 'perso_import_' + Date.now();
      const newPlayer = {
        id: newId, name: data.name, email: data.email || '',
        sport: data.sport || 'Handball',
        age: data.age || '', poids: data.poids || '', taille: data.taille || '',
        genre: data.genre || 'M', bilans: data.bilans || [],
        bilansSem: data.bilansSem || [], muscuSeances: data.muscuSeances || [],
        enduranceSeances: data.enduranceSeances || [], blessures: data.blessures || [],
        tests: data.tests || [], rmHistory: data.rmHistory || [],
        nutrition: data.nutrition || 'competition', cycles: data.cycles || [],
        importedFrom: data.exportDate || '?',
        stats: { sessions:0, absences:0, chargeWeek:0, wellness:3 },
      };
      setDb(d => ({ ...d, playersPerso: [...(d.playersPerso||[]), newPlayer] }));
      setImportCode(''); setShowImportPerso(false);
      alert('Profil de ' + data.name + ' importe ! ' + (data.bilans||[]).length + ' bilans, ' + (data.muscuSeances||[]).length + ' seances recuprees.');
    } catch(e) {
      setImportError('Erreur de lecture. Copie le code complet.');
    }
  }
  // ── GESTION CLUBS / JOUEURS / SAISONS ────────────────────────────────────
  function addClub() {
    if (!newClubForm.name.trim()) return;
    const id = 'club_' + Date.now();
    const newClub = {
      id,
      name: newClubForm.name.trim(),
      division: newClubForm.division,
      saison: '2024-2025',
      coach: { id:'coach_'+id, name: newClubForm.coachName, email: newClubForm.coachEmail, password:'' },
      saisonsArchivees: []
    };
    setDb(d => ({ ...d, clubs: [...(d.clubs||[]), newClub] }));
    if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/clubs/' + id).set(newClub);
    setNewClubForm({ name:'', division:'Nationale 1', coachName:'', coachEmail:'' });
    setShowAddClub(false);
  }

  function renameClub(clubId, newName) {
    const name = (newName || '').trim();
    if (!name) return;
    setDb(d => ({ ...d, clubs: (d.clubs||[]).map(c => c.id===clubId ? {...c, name} : c) }));
    if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/clubs/' + clubId + '/name').set(name);
    // selClub est une copie figée au moment du clic dans la liste (pas dérivée en direct de
    // db.clubs) — on la met à jour explicitement pour que le titre reflète immédiatement le
    // nouveau nom, sans attendre un aller-retour Firebase.
    setSelClub(sc => sc && sc.id === clubId ? { ...sc, name } : sc);
    setRenameClubId(null);
  }

  function removeClub(clubId) {
    if (!confirm('Supprimer ce club et tous ses joueurs ?')) return;
    setDb(d => ({
      ...d,
      clubs: (d.clubs||[]).filter(c => c.id !== clubId),
      playerProfiles: (d.playerProfiles||[]).filter(p => p.clubId !== clubId)
    }));
    if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/clubs/' + clubId).remove();
    setSelClub(null);
  }

  function addPlayer(clubId) {
    if (!newPlayerForm.name.trim()) return;
    const id = 'p_' + Date.now();
    const autoEmail = newPlayerForm.name.split(' ')[0].toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'') + '@player.fr';
    const newP = {
      id, clubId,
      name: newPlayerForm.name.trim(),
      num: parseInt(newPlayerForm.num)||0,
      pos: newPlayerForm.pos,
      age: parseInt(newPlayerForm.age)||0,
      poids: parseInt(newPlayerForm.poids)||0,
      taille: parseInt(newPlayerForm.taille)||0,
      email: newPlayerForm.email || autoEmail,
      genre: newPlayerForm.genre || 'M',
      status: 'ok', stress:2, motivation:4, focus:3, confiance:3,
      stats:{ sessions:0, absences:0, chargeWeek:0, wellness:3 },
      blessures:[], muscuSeances:[], bilans:[], nutrition:'competition', notes:''
    };
    setDb(d => {
      const updated = [...(d.playerProfiles||[]), newP];
      if (window.__perfhand_db) {
        // Ecriture ciblée sur ce seul joueur (évite d'écraser les autres si le state local n'est pas encore à jour)
        window.__perfhand_db.ref('perfhand/playerProfiles/' + newP.id).set(newP);
      }
      return { ...d, playerProfiles: updated };
    });
    setNewPlayerForm({ name:'', num:'', pos:'Arrière', age:'', poids:'', taille:'', email:'', genre:'M' });
    setShowAddPlayer(false);
  }

  function archivePlayer(playerId) {
    if (!confirm('Archiver ce joueur ? Il ne sera plus affiché dans l\'effectif actif, mais son historique (séances, bilans, protocoles) est conservé. Tu pourras le réactiver à tout moment.')) return;
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(p => p.id === playerId
        ? { ...p, archived: true, archivedDate: localDateStr() }
        : p)
    }));
  }

  function unarchivePlayer(playerId) {
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(p => p.id === playerId
        ? { ...p, archived: false, archivedDate: null }
        : p)
    }));
  }

  function removePlayer(playerId, clubId) {
    const pl = (db.playerProfiles||[]).find(p => p.id === playerId);
    const isSecondary = pl && clubId && pl.clubId !== clubId && Array.isArray(pl.clubIdsExtra) && pl.clubIdsExtra.includes(clubId);
    if (isSecondary) {
      // Le joueur est présent ici via un rattachement secondaire : on retire juste ce lien,
      // il reste dans son club principal.
      if (!confirm('Retirer ce joueur de ce groupe ? (il restera dans son club principal)')) return;
      const nextExtra = (pl.clubIdsExtra||[]).filter(id => id !== clubId);
      setDb(d => ({ ...d, playerProfiles: (d.playerProfiles||[]).map(p => p.id === playerId ? { ...p, clubIdsExtra: nextExtra } : p) }));
      if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/playerProfiles/' + playerId + '/clubIdsExtra').set(nextExtra);
      return;
    }
    if (!confirm('Retirer ce joueur de l effectif ? Cette action supprime définitivement son profil.')) return;
    markProfileDeleted(playerId);
    setDb(d => ({ ...d, playerProfiles: (d.playerProfiles||[]).filter(p => p.id !== playerId) }));
  }

  function archiverSaison(clubId) {
    if (!confirm('Archiver la saison actuelle et commencer une nouvelle ?')) return;
    let updatedClub = null;
    setDb(d => ({
      ...d,
      clubs: (d.clubs||[]).map(c => {
        if (c.id !== clubId) return c;
        const saisonActuelle = c.saison || '2024-2025';
        const [debut, fin] = saisonActuelle.split('-');
        const nouvelleSaison = (parseInt(debut)+1) + '-' + (parseInt(fin)+1);
        const archivees = c.saisonsArchivees || [];
        // Snapshot des stats joueurs pour l'archive
        const snapshot = (d.playerProfiles||[]).filter(p=>p.clubId===clubId).map(p=>({
          id:p.id, name:p.name, pos:p.pos, num:p.num,
          stats:p.stats, bilans:(p.bilans||[]).slice(-20)
        }));
        updatedClub = {
          ...c,
          saison: nouvelleSaison,
          saisonsArchivees: [...archivees, { saison: saisonActuelle, date: localDateStr(), joueurs: snapshot }]
        };
        return updatedClub;
      }),
      // Réinitialiser les séances de la saison pour les joueurs du club
      playerProfiles: (d.playerProfiles||[]).map(p => p.clubId !== clubId ? p : {
        ...p,
        muscuSeances: [],
        enduranceSeances: [],
        bilans: [],
        stats: { sessions:0, absences:0, chargeWeek:0, wellness:3 }
      })
    }));
    if (window.__perfhand_db && updatedClub) window.__perfhand_db.ref('perfhand/clubs/' + clubId).set(updatedClub);
  }

  const EMPTY_PERSO = {
    name:'', email:'', password:'', sport:'Handball', poste:'',
    age:'', poids:'', taille:'', objectif:'', notes:'', genre:'M'
  };
  const [formP, setFormP] = useState(EMPTY_PERSO);
  const savingPersoRef = useRef(false); // évite un double profil sur double-clic pendant la création du compte
  const updP = (k, v) => setFormP(f => ({ ...f, [k]: v }));

  async function savePerso() {
    if (!formP.name || !formP.email || !formP.password) return;
    if (savingPersoRef.current) return;
    savingPersoRef.current = true;
    // Normalize email before saving
    const email = formP.email.replace(/\s/g,'').toLowerCase();
    const password = formP.password.replace(/\s/g,'');
    // Le compte de connexion est créé ici (avant : à créer à la main dans la console Firebase).
    // Le mot de passe est affiché une seule fois puis oublié : il n'est jamais enregistré.
    let r;
    try { r = await creerCompteConnexion(email, password); } finally { savingPersoRef.current = false; }
    const normalizedForm = { ...sansMdp(formP), email };
    const player = {
      id: 'perso-' + Date.now(),
      ...normalizedForm,
      age: parseInt(normalizedForm.age) || 0,
      poids: parseInt(normalizedForm.poids) || 0,
      taille: parseInt(normalizedForm.taille) || 0,
      status: 'ok',
      nutrition: 'competition',
      blessures: [], bilans: [], bilansSem: [], tests: [],
      muscuSeances: [], stress: 2, motivation: 4, focus: 3, confiance: 3,
      stats: { sessions:0, absences:0, chargeWeek:0, wellness:3 },
    };
    setDb(d => {
      const next = { ...d, playersPerso: [...(d.playersPerso||[]), player] };
      try { sessionStorage.setItem('perfhand_perso_backup', JSON.stringify(next.playersPerso)); } catch(e) {}
      return next;
    });
    setFormP(EMPTY_PERSO);
    setShowAddPerso(false);
    alert(r.ok
      ? (r.existait ? 'Profil créé. Un compte de connexion existait déjà pour ' + email + ' (mot de passe inchangé).'
                    : 'Profil créé.\n\nEmail : ' + email + '\nMot de passe : ' + password + '\n\nNote-le et transmets-le au joueur : il ne sera plus affiché.')
      : 'Profil créé, mais le compte de connexion n\'a pas pu être créé (' + r.msg + ').\nUtilise le bouton 🔑 ou crée-le dans la console Firebase.');
  }

  function updatePerso(id, updates) {
    const cur = (db.playersPerso || []).find(x => x.id === id);
    if (cur) {
      updates = lierPoidsProfil(cur, updates);
      if (updates.masseMesures && window.__perfhand_db) {
        try { window.__perfhand_db.ref('perfhand/playersPerso/' + id + '/masseMesures').set(JSON.parse(JSON.stringify(updates.masseMesures))); } catch(e) {}
      }
    }
    setDb(d => ({ ...d, playersPerso: (d.playersPerso||[]).map(p => p.id===id ? {...p,...updates} : p) }));
    setEditPerso(null);
  }

  function archivePerso(id) {
    if (!confirm('Archiver ce profil ? Il ne sera plus affiché dans les profils actifs, mais son historique est conservé. Tu pourras le réactiver à tout moment.')) return;
    setDb(d => ({ ...d, playersPerso: (d.playersPerso||[]).map(p => p.id===id ? {...p, archived:true, archivedDate: localDateStr()} : p) }));
  }

  function unarchivePerso(id) {
    setDb(d => ({ ...d, playersPerso: (d.playersPerso||[]).map(p => p.id===id ? {...p, archived:false, archivedDate:null} : p) }));
  }

  function deletePerso(id) {
    if (!confirm('Supprimer ce profil ?')) return;
    markProfileDeleted(id);
    setDb(d => {
      const rest = (d.playersPerso||[]).filter(p => p.id!==id);
      try { sessionStorage.setItem('perfhand_perso_backup', JSON.stringify(rest)); } catch(e) {}
      return { ...d, playersPerso: rest };
    });
  }

  // setDb adapter for club players
  function setDbForPlayer(player) {
    return (fn) => {
      setDb(d => {
        const fakeDb = { ...d, players: d.playerProfiles || [] };
        const next = typeof fn === 'function' ? fn(fakeDb) : fn;
        return { ...d, playerProfiles: next.playerProfiles || (d.playerProfiles||[]) };
      });
    };
  }

  const NAV = [
    { id:'overview',     icon:'⊞',  label:'Vue globale' },
    { id:'clubs',        icon:'🏐', label:'Clubs & Effectifs' },
    { id:'charge',       icon:'📊', label:'Charge équipe' },
    { id:'perso',        icon:'👤', label:'Profils individuels' },
    { id:'tactique',     icon:'🎯', label:'Tactique' },
    { id:'bibliotheque', icon:'📚', label:'Bibliothèque' },
    { id:'ressources',   icon:'📂', label:'Ressources' },
    { id:'staff-manager',icon:'👥', label:'Staff' },
  ];

  const allPlayers   = (db.playerProfiles || []).filter(p => !p.archived);
  const archivedPlayers = (db.playerProfiles || []).filter(p => p.archived);
  const blesses      = [...allPlayers, ...playersPerso].filter(p => p.status === 'blesse').length;
  const totalCharge  = allPlayers.reduce((s, p) => s + (p.stats?.chargeWeek||0), 0);

  // Club players for selected club
  const clubPlayers  = selClub ? allPlayers.filter(p => playerInClub(p, selClub.id)) : [];
  const clubPlayersArchives = selClub ? archivedPlayers.filter(p => playerInClub(p, selClub.id)) : [];

  return _h`<div class="app">
    <!-- Sidebar -->
    <nav class="sidebar">
      <div style=${{ padding:'0 22px 22px' }}>
        <div class="logo"><span>PERF</span>HAND</div>
        <div style=${{ marginTop:8, background:'#FFA42018', border:'1px solid #FFA42030', borderRadius:8, padding:'6px 12px' }}>
          <div style=${{ fontSize:11, fontWeight:700, color:'#FFA420' }}>Leo — Admin</div>
          <div style=${{ fontSize:9, color:'rgba(255,164,32,.5)', marginTop:1 }}>Accès total</div>
        </div>
      </div>

      ${NAV.map(item => _h`<button key=${item.id}
        class=${'nav-btn' + (page===item.id?' active':'')}
        onClick=${() => { setPage(item.id); setSelClub(null); setSelPlayer(null); }}
      >${item.icon} ${item.label}</button>`)}

      <!-- Firebase sync status -->
      <div style=${{ margin:'8px 14px', padding:'8px 12px', borderRadius:9,
        background: window.__perfhand_db ? 'rgba(76,175,80,.08)' : 'rgba(255,164,32,.08)',
        border: '1px solid ' + (window.__perfhand_db ? 'rgba(76,175,80,.25)' : 'rgba(255,164,32,.25)') }}>
        <div style=${{ fontSize:10, fontWeight:700, color: window.__perfhand_db ? '#4CAF50' : '#FFA420' }}>
          ${window.__perfhand_db ? '🟢 Sync activée' : '🟡 Sync désactivée'}
        </div>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:2, lineHeight:1.4 }}>
          ${window.__perfhand_db ? 'Données partagées en temps réel' : 'Configure Firebase pour partager les données'}
        </div>
      </div>
      <div style=${{ marginTop:'auto', padding:'0 14px 14px' }}>
        <!-- Telegram test -->
        <button class="btn btn-sm" style=${{ width:'100%', marginBottom:6, background:'rgba(56,189,248,.08)', border:'1px solid rgba(56,189,248,.25)', color:'#38BDF8', fontSize:10 }}
          onClick=${() => window.__perfhand_test_telegram && window.__perfhand_test_telegram()}>📨 Test Telegram</button>
        <button class="btn btn-danger" style=${{ width:'100%', marginBottom:8 }} onClick=${logout}>Déconnexion</button>
        <button class="btn btn-sm" style=${{ width:'100%', background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.15)', color:'rgba(255,68,85,.5)', fontSize:10 }}
          onClick=${() => { if(prompt('Tapez RESET pour confirmer la suppression de toutes les données:') === 'RESET') resetDb(); }}>Reset données</button>
      </div>
    </nav>

    <!-- Main -->
    <div class="main">

      <!-- ── VUE GLOBALE ─────────────────────────────────────────── -->
      ${page === 'overview' ? _h`<div class="page-pad">
        <div style=${{ marginBottom:18 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2.5, textTransform:'uppercase', marginBottom:4 }}>Tableau de bord admin</div>
          <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:800 }}>VUE GLOBALE</h1>
        </div>

        <!-- KPIs -->
        <div class="grid-4" style=${{ marginBottom:20 }}>
          ${[
            ['Clubs',       db.clubs.length,    '#FFA420'],
            ['Collectifs',  allPlayers.length,  '#7C6FFF'],
            ['Individuels', playersPerso.length,'#38BDF8'],
            ['Blessés',     blesses,            '#FF4455'],
          ].map(([l,v,col]) => _h`<div key=${l} class="card">
            <div style=${{ fontSize:34, fontWeight:800, color:col, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${v}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>${l}</div>
          </div>`)}
        </div>

        <!-- ── EFFECTIF COLLECTIF ── -->
        ${db.clubs.map(club => {
          const cp    = allPlayers.filter(p => playerInClub(p, club.id));
          const blesses = cp.filter(p => p.status === 'blesse').length;
          const surveil = cp.filter(p => p.status === 'surveille').length;
          const dispos  = cp.filter(p => p.status === 'ok').length;
          const postes  = [...new Set(cp.map(p => p.pos).filter(Boolean))];
          return _h`<div key=${club.id} style=${{ marginBottom:14 }}>
            <div style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'14px 16px' }}>
              <!-- Header club -->
              <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style=${{ fontSize:22 }}>🏐</div>
                  <div>
                    <div style=${{ fontSize:15, fontWeight:800 }}>${club.name}</div>
                    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${club.division} · ${cp.length} joueurs</div>
                  </div>
                </div>
                <button class="btn btn-sm btn-primary" onClick=${() => { setSelClub(club); setClubTab('effectif'); setPage('clubs'); }}>
                  Gérer →
                </button>
              </div>
              <!-- Stats rapides -->
              <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                <div style=${{ background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.2)', borderRadius:9, padding:'8px 10px', textAlign:'center' }}>
                  <div style=${{ fontSize:20, fontWeight:800, color:'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif" }}>${dispos}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1 }}>Dispos</div>
                </div>
                <div style=${{ background: blesses>0?'rgba(255,68,85,.08)':'rgba(255,255,255,.03)', border:'1px solid '+(blesses>0?'rgba(255,68,85,.2)':'rgba(255,255,255,.07)'), borderRadius:9, padding:'8px 10px', textAlign:'center' }}>
                  <div style=${{ fontSize:20, fontWeight:800, color: blesses>0?'#FF4455':'rgba(255,255,255,.3)', fontFamily:"'Barlow Condensed',sans-serif" }}>${blesses}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1 }}>Blessés</div>
                </div>
                <div style=${{ background: surveil>0?'rgba(255,184,0,.08)':'rgba(255,255,255,.03)', border:'1px solid '+(surveil>0?'rgba(255,184,0,.2)':'rgba(255,255,255,.07)'), borderRadius:9, padding:'8px 10px', textAlign:'center' }}>
                  <div style=${{ fontSize:20, fontWeight:800, color: surveil>0?'#FFB800':'rgba(255,255,255,.3)', fontFamily:"'Barlow Condensed',sans-serif" }}>${surveil}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1 }}>Surveil.</div>
                </div>
              </div>
              <!-- Alertes blessés/surveillance -->
              ${(blesses > 0 || surveil > 0) ? _h`<div style=${{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:10 }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Joueurs à surveiller</div>
                <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  ${cp.filter(p => p.status === 'blesse' || p.status === 'surveille').map(p => {
                    const sc = STATUS_CFG[p.status] || STATUS_CFG.ok;
                    return _h`<div key=${p.id}
                      onClick=${() => { setSelClub(club); setSelPlayer(p); setPage('clubs'); }}
                      style=${{ display:'flex', alignItems:'center', gap:6, background:sc.color+'10', border:'1px solid '+sc.color+'30', borderRadius:8, padding:'4px 10px', cursor:'pointer' }}>
                      <div style=${{ width:6, height:6, borderRadius:'50%', background:sc.color, flexShrink:0 }}></div>
                      <span style=${{ fontSize:11, fontWeight:600 }}>${p.name.split(' ')[1] || p.name}</span>
                      <span style=${{ fontSize:9, color:sc.color }}>·</span>
                      <span style=${{ fontSize:9, color:sc.color, fontWeight:700 }}>${sc.label}</span>
                    </div>`;
                  })}
                </div>
              </div>` : null}
            </div>
          </div>`;
        })}

        <!-- ── PROFILS INDIVIDUELS ── -->
        ${playersPerso.length > 0 && _h`<div style=${{ marginBottom:20 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>Coaching individuel</div>
              <div style=${{ fontSize:16, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Profils individuels</div>
            </div>
            <button class="btn btn-sm" style=${{ fontSize:11, background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8' }}
              onClick=${() => setPage('perso')}>
              Gérer →
            </button>
          </div>
          <div>
            ${playersPerso.map(p => {
              const sc = { ok:'#4CAF50', blesse:'#FF4455', surveille:'#FFB800', repos:'#7C6FFF' }[p.status] || '#4CAF50';
              const statusLabel = { ok:'Disponible', blesse:'Blessé', surveille:'Surveillance', repos:'Repos' }[p.status] || 'Disponible';
              return _h`<div key=${p.id} style=${{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', marginBottom:6,
                background:'rgba(255,255,255,.025)', border:'1px solid '+sc+'20',
                borderRadius:10, cursor:'pointer'
              }} onClick=${() => { setSelPerso(p); setPage('perso'); }}>
                <div style=${{ width:32, height:32, borderRadius:'50%', background:sc+'22', border:'2px solid '+sc+'55',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:sc,
                  fontFamily:"'Barlow Condensed',sans-serif", flexShrink:0 }}>
                  ${p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div style=${{ flex:1, minWidth:0 }}>
                  <div style=${{ fontSize:13, fontWeight:700 }}>${p.name}</div>
                  <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>${p.sport||'Handball'}${p.poste?' · '+p.poste:''}</div>
                </div>
                <div style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:sc+'18', color:sc, fontWeight:700, flexShrink:0 }}>${statusLabel}</div>
                <div style=${{ color:'rgba(255,255,255,.25)', fontSize:12 }}>→</div>
              </div>`;
            })}
          </div>
        </div>`}
      </div>` : null}

      <!-- ── CLUBS & EFFECTIFS ────────────────────────────────────── -->
      ${page === 'clubs' ? _h`<div class="page-pad">
        <div style=${{ display:'flex', alignItems:'center', gap:12, marginBottom:22, flexWrap:'wrap' }}>
          ${selClub ? _h`<button class="btn btn-sm" onClick=${() => { setSelClub(null); setSelPlayer(null); setRenameClubId(null); }}>← Clubs</button>` : null}
          ${selClub && renameClubId === selClub.id ? _h`<div style=${{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:220 }}>
            <input class="inp" autoFocus value=${renameClubVal} onInput=${e => setRenameClubVal(e.target.value)}
              onKeyDown=${e => { if (e.key === 'Enter') renameClub(selClub.id, renameClubVal); if (e.key === 'Escape') setRenameClubId(null); }}
              style=${{ fontSize:20, fontWeight:800, flex:1, maxWidth:420 }} placeholder="Nom du club" />
            <button class="btn btn-sm btn-primary" onClick=${() => renameClub(selClub.id, renameClubVal)}>Enregistrer</button>
            <button class="btn btn-sm" onClick=${() => setRenameClubId(null)}>Annuler</button>
          </div>` : _h`<div style=${{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800, margin:0 }}>
              ${selClub ? selClub.name.toUpperCase() : 'CLUBS & EFFECTIFS'}
            </h1>
            ${selClub ? _h`<button class="btn btn-sm" title="Renommer le club"
              onClick=${() => { setRenameClubVal(selClub.name); setRenameClubId(selClub.id); }}
              style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>✏️ Renommer</button>` : null}
          </div>`}
        </div>

        ${!selClub && _h`<div>
          <div style=${{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button class="btn btn-primary btn-sm" onClick=${() => setShowAddClub(!showAddClub)}>
              ${showAddClub ? '✕ Annuler' : '+ Nouveau club'}
            </button>
          </div>

          <!-- Formulaire ajout club -->
          ${showAddClub ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'16px', marginBottom:14 }}>
            <div style=${{ fontSize:13, fontWeight:700, marginBottom:12 }}>Nouveau club</div>
            <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <div style=${{ flex:'1 1 200px' }}><div class="lbl">Nom du club</div><input class="inp" value=${newClubForm.name} onInput=${e=>setNewClubForm(f=>({...f,name:e.target.value}))} placeholder="Ex: SCO Angers"/></div>
              <div style=${{ flex:'1 1 150px' }}>
                <div class="lbl">Division</div>
                <select class="inp" value=${newClubForm.division} onChange=${e=>setNewClubForm(f=>({...f,division:e.target.value}))}>
                  ${['Nationale 1','Nationale 2','Nationale 3','Prénationale','Régionale 1'].map(d=>_h`<option key=${d} value=${d}>${d}</option>`)}
                </select>
              </div>
              <div style=${{ flex:'1 1 180px' }}><div class="lbl">Nom du coach</div><input class="inp" value=${newClubForm.coachName} onInput=${e=>setNewClubForm(f=>({...f,coachName:e.target.value}))} placeholder="Prénom NOM"/></div>
              <div style=${{ flex:'1 1 200px' }}><div class="lbl">Email du coach</div><input class="inp" type="email" value=${newClubForm.coachEmail} onInput=${e=>setNewClubForm(f=>({...f,coachEmail:e.target.value}))} placeholder="coach@club.fr"/></div>
            </div>
            <button class="btn btn-primary" style=${{ marginTop:12, width:'100%' }} onClick=${addClub}>Créer le club</button>
          </div>` : null}

          ${db.clubs.map(club => {
            const nbJ = allPlayers.filter(p=>playerInClub(p, club.id)).length;
            const nbArch = (club.saisonsArchivees||[]).length;
            return _h`<div key=${club.id} class="card" style=${{ marginBottom:10, cursor:'pointer' }}
              onClick=${() => setSelClub(club)}>
              <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style=${{ flex:1 }}>
                  <div style=${{ fontSize:15, fontWeight:700 }}>${club.name}</div>
                  <div style=${{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap', alignItems:'center' }}>
                    <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${club.division}</span>
                    <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>· Coach: ${club.coach.name}</span>
                    <span style=${{ fontSize:11, color:'#FFA420', fontWeight:700 }}>Saison</span>
                    <select
                      value=${club.saison||'2026-2027'}
                      onClick=${e => e.stopPropagation()}
                      onChange=${e => {
                        e.stopPropagation();
                        const val = e.target.value;
                        setDb(d => ({ ...d, clubs: (d.clubs||[]).map(c => c.id===club.id ? {...c, saison:val} : c) }));
                        if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/clubs/' + club.id + '/saison').set(val);
                      }}
                      style=${{
                        fontSize:11, fontWeight:700, color:'#FFA420',
                        background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.25)',
                        borderRadius:6, padding:'2px 6px', cursor:'pointer'
                      }}>
                      ${['2022-2023','2023-2024','2024-2025','2025-2026','2026-2027'].map(s =>
                        _h`<option key=${s} value=${s}>${s}</option>`
                      )}
                    </select>
                    ${nbArch > 0 ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>(${nbArch} archivée${nbArch>1?'s':''})</span>` : null}
                  </div>
                </div>
                <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style=${{ fontSize:13, color:'#7C6FFF', fontWeight:700 }}>${nbJ} joueurs</div>
                  <div style=${{ color:'rgba(255,255,255,.3)' }}>→</div>
                </div>
              </div>
            </div>`;
          })}
        </div>`}

        ${selClub && !selPlayer && _h`<div>
          <!-- Onglets club -->
          <div style=${{ display:'flex', gap:5, marginBottom:16, overflowX:'auto', scrollbarWidth:'none' }}>
            <div style=${{ display:'flex', gap:4, background:'rgba(255,255,255,.03)', borderRadius:11, padding:3, minWidth:'max-content' }}>
              ${[['effectif','👥 Effectif'],['planif','📅 Planification'],['projet','🏐 Projet de jeu'],['stats','📊 Stats matchs'],['volume','📈 Volume équipe'],['poids','⚖️ Poids équipe'],['vma','⚡ VMA équipe']].map(([id,label]) => _h`<button key=${id}
                onClick=${() => { setClubTab(id); setSelPlayer(null); }}
                style=${{
                  padding:'7px 14px', borderRadius:9, border: clubTab===id?'1px solid rgba(255,255,255,.1)':'1px solid transparent',
                  background: clubTab===id?'rgba(255,255,255,.07)':'transparent',
                  color: clubTab===id?'#fff':'rgba(255,255,255,.4)',
                  fontWeight:clubTab===id?600:400, fontSize:12, cursor:'pointer', whiteSpace:'nowrap'
                }}>${label}</button>`)}
            </div>
          </div>

          ${clubTab === 'stats' ? React.createElement(StatsMatchView, { club: selClub, players: clubPlayers, db, setDb }) : null}
          ${clubTab === 'staff' ? React.createElement(ClubStaffManager, { club: selClub, db, setDb }) : null}
          ${clubTab === 'planif' ? _h`<div>
            ${React.createElement(PlanifSaison, { player: null, club: selClub, db: db })}
            <details style=${{ marginTop:20 }}>
              <summary style=${{ fontSize:13, color:'#000', cursor:'pointer', padding:'12px 16px', fontWeight:800, background:'#FFA420', borderRadius:10, listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>✏️ Modifier le planning du club (assigner les cycles par semaine) <span>▾</span></summary>
              <div style=${{ marginTop:12 }}>
                ${React.createElement(PlanifClubView, { club: selClub, players: clubPlayers, readOnly: false })}
              </div>
            </details>
          </div>` : null}
          ${clubTab === 'projet' ? React.createElement(ProjetDeJeuView, { db: db, setDb: setDb, isCoach: true }) : null}
          ${clubTab === 'volume' ? React.createElement(VolumeEquipeView, { players: clubPlayers }) : null}
          ${clubTab === 'poids' ? React.createElement(PoidsEquipeView, { players: clubPlayers, setDb: setDb }) : null}
          ${clubTab === 'vma' ? React.createElement(VMAEquipeView, { players: clubPlayers, setDb: setDb }) : null}

          ${(clubTab !== 'stats' && clubTab !== 'projet' && clubTab !== 'volume') ? _h`<div>
          <!-- Effectif du club -->
          <div style=${{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
            ${[
              ['Disponibles', clubPlayers.filter(p=>p.status==='ok').length, '#4CAF50'],
              ['Blessés',     clubPlayers.filter(p=>p.status==='blesse').length, '#FF4455'],
              ['Surveillance',clubPlayers.filter(p=>p.status==='surveille').length, '#FFB800'],
            ].map(([l,v,col]) => _h`<div key=${l} style=${{ background:col+'12', border:'1px solid '+col+'30', borderRadius:9, padding:'8px 16px' }}>
              <div style=${{ fontSize:20, fontWeight:800, color:col, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${l}</div>
            </div>`)}
          </div>

          <!-- Barre d'actions effectif -->
          <div style=${{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14, justifyContent:'space-between', alignItems:'center' }}>
            <div style=${{ display:'flex', gap:6 }}>
              <button class="btn btn-primary btn-sm" onClick=${() => setShowAddPlayer(!showAddPlayer)}>
                ${showAddPlayer ? '✕' : '+ Joueur'}
              </button>
              <button class="btn btn-sm" style=${{ background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.2)', color:'rgba(255,68,85,.7)', fontSize:11 }}
                onClick=${() => removeClub(selClub.id)}>🗑 Club</button>
            </div>
            <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.25)', color:'#FFA420', fontSize:11 }}
              onClick=${() => archiverSaison(selClub.id)}>📦 Archiver saison ${selClub.saison||'2024-2025'}</button>
          </div>

          <!-- Formulaire ajout joueur -->
          ${showAddPlayer ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginBottom:14 }}>
            <div style=${{ fontSize:12, fontWeight:700, marginBottom:6 }}>Ajouter un joueur</div>

            <!-- Option: rattacher un profil existant par email -->
            ${(() => {
              const emailInput = newPlayerForm.emailSearch || '';
              const existingProfile = emailInput.length > 3
                ? (db.playerProfiles||[]).find(p => (p.email||'').toLowerCase().includes(emailInput.toLowerCase()) || (p.name||'').toLowerCase().includes(emailInput.toLowerCase()))
                : null;
              return _h`<div style=${{ marginBottom:12, background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:10, padding:'10px 12px' }}>
                <div style=${{ fontSize:10, color:'#38BDF8', fontWeight:700, marginBottom:6 }}>🔍 Rattacher un profil existant</div>
                <div style=${{ display:'flex', gap:8 }}>
                  <input class="inp" value=${newPlayerForm.emailSearch||''} onInput=${e=>setNewPlayerForm(f=>({...f,emailSearch:e.target.value}))}
                    placeholder="Chercher par email ou nom..." style=${{ flex:1, fontSize:11 }}/>
                </div>
                ${existingProfile ? _h`<div style=${{ marginTop:8, background:'rgba(56,189,248,.08)', borderRadius:8, padding:'8px 10px' }}>
                  <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                    <div>
                      <div style=${{ fontSize:12, fontWeight:700, color:'#38BDF8' }}>${existingProfile.name}</div>
                      <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${existingProfile.email} · ${(existingProfile.bilans||[]).length} bilans · ${(existingProfile.muscuSeances||[]).length} séances</div>
                      ${existingProfile.clubId && existingProfile.clubId !== selClub.id ? _h`<div style=${{ fontSize:9, color:'rgba(255,164,32,.7)', marginTop:2 }}>Déjà dans : ${(db.clubs||[]).find(c=>c.id===existingProfile.clubId)?.name || existingProfile.clubId}</div>` : null}
                    </div>
                    <div style=${{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                      <button class="btn btn-sm btn-primary"
                        title="Ajoute ce joueur ici EN PLUS, sans le retirer de son club actuel"
                        onClick=${() => {
                          setDb(d => ({ ...d, playerProfiles: (d.playerProfiles||[]).map(p =>
                            p.id === existingProfile.id
                              ? {...p, clubIdsExtra: [...new Set([...(p.clubIdsExtra||[]), selClub.id])]}
                              : p
                          )}));
                          if (window.__perfhand_db) {
                            const nextExtra = [...new Set([...(existingProfile.clubIdsExtra||[]), selClub.id])];
                            window.__perfhand_db.ref('perfhand/playerProfiles/' + existingProfile.id + '/clubIdsExtra').set(nextExtra);
                          }
                          setNewPlayerForm({ name:'', num:'', pos:'Arrière', age:'', poids:'', taille:'', email:'', genre:'M', emailSearch:'' });
                          setShowAddPlayer(false);
                          alert('✅ ' + existingProfile.name + ' est maintenant visible dans les deux groupes.');
                        }}>➕ Ajouter en plus (recommandé)</button>
                      <button class="btn btn-sm" style=${{ background:'transparent', border:'1px solid rgba(255,255,255,.15)', color:'rgba(255,255,255,.5)' }}
                        title="⚠️ Retire le joueur de son club actuel et le déplace ici"
                        onClick=${() => {
                          if (!confirm(existingProfile.name + ' sera RETIRÉ de son club actuel (' + ((db.clubs||[]).find(c=>c.id===existingProfile.clubId)?.name || existingProfile.clubId) + ') et déplacé ici. Continuer ?')) return;
                          setDb(d => ({ ...d, playerProfiles: (d.playerProfiles||[]).map(p =>
                            p.id === existingProfile.id ? {...p, clubId: selClub.id, pos: newPlayerForm.pos||p.pos, num: parseInt(newPlayerForm.num)||p.num} : p
                          )}));
                          setNewPlayerForm({ name:'', num:'', pos:'Arrière', age:'', poids:'', taille:'', email:'', genre:'M', emailSearch:'' });
                          setShowAddPlayer(false);
                        }}>⚠️ Déplacer ici (retire de l'ancien)</button>
                    </div>
                  </div>
                  <div style=${{ fontSize:9, color:'rgba(56,189,248,.6)', marginTop:4 }}>✓ Ce joueur conservera tout son historique</div>
                </div>` : emailInput.length > 3 ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:6, fontStyle:'italic' }}>Aucun profil trouvé — crée un nouveau joueur ci-dessous</div>` : null}
              </div>`;
            })()}

            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:8 }}>— ou créer un nouveau profil —</div>
            <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>Nouveau joueur</div>
            <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <div style=${{ flex:'1 1 180px' }}><div class="lbl">Nom complet</div><input class="inp" value=${newPlayerForm.name} onInput=${e=>setNewPlayerForm(f=>({...f,name:e.target.value}))} placeholder="Prénom NOM"/></div>
              <div style=${{ flex:'0 0 70px' }}><div class="lbl">N°</div><input class="inp" type="number" value=${newPlayerForm.num} onInput=${e=>setNewPlayerForm(f=>({...f,num:e.target.value}))}/></div>
              <div style=${{ flex:'1 1 130px' }}>
                <div class="lbl">Poste</div>
                <select class="inp" value=${newPlayerForm.pos} onChange=${e=>setNewPlayerForm(f=>({...f,pos:e.target.value}))}>
                  ${['Gardien','Ailier','Arrière','Pivot','Demi-centre'].map(p=>_h`<option key=${p} value=${p}>${p}</option>`)}
                </select>
              </div>
              <div style=${{ flex:'0 0 70px' }}><div class="lbl">Âge</div><input class="inp" type="number" value=${newPlayerForm.age} onInput=${e=>setNewPlayerForm(f=>({...f,age:e.target.value}))}/></div>
              <div style=${{ flex:'0 0 80px' }}><div class="lbl">Poids kg</div><input class="inp" type="number" value=${newPlayerForm.poids} onInput=${e=>setNewPlayerForm(f=>({...f,poids:e.target.value}))}/></div>
              <div style=${{ flex:'1 1 180px' }}><div class="lbl">Email (optionnel)</div><input class="inp" type="email" value=${newPlayerForm.email} onInput=${e=>setNewPlayerForm(f=>({...f,email:e.target.value}))} placeholder="auto-généré si vide"/></div>
              <div style=${{ flex:'0 0 140px' }}>
                <div class="lbl">Genre</div>
                <div style=${{ display:'flex', gap:6 }}>
                  ${['M','F'].map(g => _h`<button key=${g}
                    onClick=${() => setNewPlayerForm(f=>({...f,genre:g}))}
                    style=${{
                      flex:1, padding:'7px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700,
                      border: newPlayerForm.genre===g ? '2px solid '+(g==='F'?'#FF6B9D':'#38BDF8') : '1px solid rgba(255,255,255,.1)',
                      background: newPlayerForm.genre===g ? (g==='F'?'rgba(255,107,157,.12)':'rgba(56,189,248,.1)') : 'rgba(255,255,255,.03)',
                      color: newPlayerForm.genre===g ? (g==='F'?'#FF6B9D':'#38BDF8') : 'rgba(255,255,255,.4)'
                    }}>${g==='M'?'♂':'♀'}</button>`)}
                </div>
              </div>
            </div>
            <button class="btn btn-primary" style=${{ marginTop:10, width:'100%' }} onClick=${() => addPlayer(selClub.id)}>Ajouter le joueur</button>
          </div>` : null}

          <!-- Saisons archivées -->
          ${(selClub.saisonsArchivees||[]).length > 0 ? _h`<details style=${{ marginBottom:14 }}>
            <summary style=${{ fontSize:11, color:'rgba(255,255,255,.4)', cursor:'pointer', padding:'6px 0' }}>
              📦 ${selClub.saisonsArchivees.length} saison${selClub.saisonsArchivees.length>1?'s':''} archivée${selClub.saisonsArchivees.length>1?'s':''}
            </summary>
            <div style=${{ marginTop:8 }}>
              ${[...(selClub.saisonsArchivees||[])].reverse().map(sa => _h`<div key=${sa.saison} style=${{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:9, padding:'10px 13px', marginBottom:6 }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style=${{ fontSize:12, fontWeight:700, color:'rgba(255,164,32,.7)' }}>Saison ${sa.saison}</div>
                  <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>Archivée le ${sa.date} · ${(sa.joueurs||[]).length} joueurs</div>
                    <button onClick=${(e) => { e.stopPropagation(); if(confirm('Supprimer la saison ' + sa.saison + ' ?')) { const newClubs = (db.clubs||[]).map(c => c.id===selClub.id ? {...c, saisonsArchivees: (c.saisonsArchivees||[]).filter(s=>s.saison!==sa.saison)} : c); setDb(d=>({...d,clubs:newClubs})); }}}
                      style=${{ background:'rgba(255,68,85,.1)', border:'none', color:'#FF4455', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:10 }}>✕</button>
                  </div>
                </div>
              </div>`)}
            </div>
          </details>` : null}

          <!-- Liste joueurs -->
          ${clubPlayers.map(p => {
            const sc = STATUS_CFG[p.status] || STATUS_CFG.ok;
            return _h`<div key=${p.id} style=${{
              background:'rgba(255,255,255,.025)', border:'1px solid '+sc.color+'25',
              borderRadius:12, padding:'12px 16px', marginBottom:8,
              display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <div style=${{ display:'flex', alignItems:'center', gap:10, flex:1, cursor:'pointer' }} onClick=${() => setSelPlayer(p)}>
                <${Avatar} name=${p.name} color=${sc.color} size=${32}/>
                <div>
                  <div style=${{ fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                    ${p.name}
                    ${p.clubId !== selClub.id ? _h`<span title="Rattaché ici en plus de son club principal" style=${{ fontSize:9, padding:'1px 7px', borderRadius:20, background:'rgba(56,189,248,.15)', color:'#38BDF8', fontWeight:700 }}>🔗 secondaire</span>` : null}
                  </div>
                  <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>#${p.num} · ${p.pos} · ${p.age} ans · ${p.poids}kg</div>
                </div>
              </div>
              <div style=${{ display:'flex', gap:8, alignItems:'center' }}>
                <div style=${{ fontSize:11, padding:'3px 9px', borderRadius:20, background:sc.color+'18', color:sc.color, fontWeight:700 }}>${sc.label}</div>
                <button class="btn btn-sm" title="Générer un code d'accès pour ce joueur"
                  style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', padding:'3px 8px', fontSize:12 }}
                  onClick=${e => {
                    e.stopPropagation();
                    if (window.__perfhand_db) {
                      genererCodeAcces('perfhand/codes/', {
                        playerId: p.id, playerName: p.name, clubId: p.clubId || selClub.id,
                        createdAt: new Date().toISOString()
                      }).then(code => {
                        alert('Code d\'accès de ' + p.name + ' :\n\n      ' + code + '\n\nEnvoie ce code au joueur avec le lien perfhandballapp.netlify.app\nIl se connecte via "Code joueur" — aucun mot de passe nécessaire.');
                      }).catch(err => alert('Erreur : ' + err.message));
                    }
                  }}>📋</button>
                <button class="btn btn-sm" title="Archiver ce joueur (contrat terminé) — historique conservé"
                  style=${{ background:'rgba(124,111,255,.1)', border:'1px solid rgba(124,111,255,.3)', color:'#7C6FFF', padding:'3px 8px', fontSize:12 }}
                  onClick=${e => { e.stopPropagation(); archivePlayer(p.id); }}>🗄</button>
                <button class="btn btn-sm btn-danger" style=${{ padding:'3px 8px', fontSize:12 }} onClick=${e => { e.stopPropagation(); removePlayer(p.id, selClub.id); }}>×</button>
                <div style=${{ color:'rgba(255,255,255,.3)', fontSize:12, cursor:'pointer' }} onClick=${() => setSelPlayer(p)}>→</div>
              </div>
            </div>`;
          })}
          </div>` : null}

          <!-- Joueurs archivés -->
          ${clubPlayersArchives.length > 0 ? _h`<details style=${{ marginTop:14 }}>
            <summary style=${{ fontSize:11, color:'rgba(255,255,255,.4)', cursor:'pointer', padding:'6px 0' }}>
              🗄 ${clubPlayersArchives.length} joueur${clubPlayersArchives.length>1?'s':''} archivé${clubPlayersArchives.length>1?'s':''}
            </summary>
            <div style=${{ marginTop:8 }}>
              ${clubPlayersArchives.map(p => _h`<div key=${p.id} style=${{
                background:'rgba(255,255,255,.015)', border:'1px solid rgba(255,255,255,.06)',
                borderRadius:12, padding:'10px 16px', marginBottom:6,
                display:'flex', justifyContent:'space-between', alignItems:'center', opacity:0.6
              }}>
                <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
                  <${Avatar} name=${p.name} color='rgba(255,255,255,.3)' size=${28}/>
                  <div>
                    <div style=${{ fontSize:12, fontWeight:700 }}>${p.name}</div>
                    <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${p.pos} · Archivé le ${p.archivedDate||'?'}</div>
                  </div>
                </div>
                <div style=${{ display:'flex', gap:8 }}>
                  <button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', padding:'3px 10px', fontSize:11 }}
                    onClick=${() => unarchivePlayer(p.id)}>↩ Réactiver</button>
                  <button class="btn btn-sm btn-danger" style=${{ padding:'3px 8px', fontSize:12 }} title="Supprimer définitivement"
                    onClick=${() => removePlayer(p.id, selClub.id)}>×</button>
                </div>
              </div>`)}
            </div>
          </details>` : null}
        </div>`}

        <!-- Fiche joueur club (admin peut tout voir/modifier) -->
        ${selClub && selPlayer && _h`<div>
          <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <button class="btn btn-sm" onClick=${() => setSelPlayer(null)}>← Effectif</button>
            <div style=${{ fontSize:16, fontWeight:800 }}>${selPlayer.name}</div>
          </div>
          <${PlayerDetail}
            p=${{ ...{stats:{sessions:0,absences:0,chargeWeek:0,wellness:3},blessures:[],muscuSeances:[],bilans:[]}, ...((db.playerProfiles||[]).find(pl => pl.id === selPlayer.id) || selPlayer) }}
            db=${db}
            setDb=${setDb}
            onBack=${() => setSelPlayer(null)}
          />
        </div>`}
      </div>` : null}

      <!-- ── CHARGE ÉQUIPE ────────────────────────────────────────── -->
      ${page === 'charge' && React.createElement(ChargeGroupeRouter, { allPlayers, db, setDb })}

      <!-- ── PROFILS INDIVIDUELS ──────────────────────────────────── -->
      ${page === 'tactique' ? _h`<div class="page-pad">${React.createElement(TactiqueView, { db, setDb, clubs: db.clubs || [], clubId: '', canEdit: true, auteur: 'Léo' })}</div>` : null}
      ${page === 'bibliotheque' ? _h`<div class="page-pad">${React.createElement(BibliothequeView, { db, setDb })}</div>` : null}
      ${page === 'ressources' ? _h`<div class="page-pad">${React.createElement(RessourcesView, { db, setDb })}</div>` : null}

      <!-- Fiche joueur perso pleine page -->
      ${page === 'perso' && selPerso ? _h`<div style=${{ minHeight:'100vh', background:'#080A0E' }}>
        <div style=${{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'12px 20px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:10 }}>
          <button onClick=${() => setSelPerso(null)}
            style=${{ background:'none', border:'1px solid rgba(255,255,255,.15)', color:'rgba(255,255,255,.7)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontFamily:'Inter,sans-serif' }}>
            ← Retour
          </button>
          <div style=${{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
            <div style=${{ width:36, height:36, borderRadius:'50%', background:'rgba(255,164,32,.15)', border:'2px solid rgba(255,164,32,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif", flexShrink:0 }}>
              ${(selPerso.name||'').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div style=${{ minWidth:0 }}>
              <div style=${{ fontSize:15, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>${selPerso.name}</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${selPerso.email}</div>
            </div>
          </div>
          <button class="btn btn-sm" onClick=${() => setRapportPerso((db.playersPerso||[]).find(p=>p.id===selPerso.id)||selPerso)}
            style=${{ background:'rgba(76,175,80,.12)', border:'1px solid rgba(76,175,80,.4)', color:'#4CAF50', fontWeight:700, flexShrink:0 }}>📊 Bilan PDF / Excel</button>
          <button class="btn btn-sm" onClick=${() => setEditPerso(selPerso)}
            style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', flexShrink:0 }}>✏️</button>
        </div>
        <div style=${{ padding:'0 0 80px' }}>
          ${React.createElement(PersoAdminDetail, { player: (db.playersPerso||[]).find(p=>p.id===selPerso.id)||selPerso, setDb })}
        </div>
      </div>` : null}
      ${rapportPerso ? _h`<${RapportJoueurModal} player=${rapportPerso} onClose=${() => setRapportPerso(null)} />` : null}
      ${page === 'staff-manager' ? _h`<div class="page-pad">${React.createElement(StaffManagerView)}</div>` : null}
      ${page === 'staff' && React.createElement(StaffView)}

      ${page === 'perso' && !selPerso ? _h`<div class="page-pad" style=${{ maxWidth:'100%', overflowX:'hidden' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
          <div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2.5, textTransform:'uppercase', marginBottom:4 }}>Coaching individuel</div>
            <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800 }}>PROFILS INDIVIDUELS</h1>
          </div>
          <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <button class="btn btn-sm" style=${{ background:'rgba(56,189,248,.08)', border:'1px solid rgba(56,189,248,.25)', color:'#38BDF8', fontWeight:700 }}
              onClick=${() => setShowImportPerso(!showImportPerso)}>
              ${showImportPerso ? '✕' : '📥 Importer'}
            </button>
            <button class="btn btn-primary" onClick=${() => setShowAddPerso(true)}>+ Nouveau profil</button>
            <button class="btn" style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8' }}
              onClick=${() => setShowSync(true)}>⇄ Sync</button>
          </div>
        </div>

        ${showImportPerso ? _h`<div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'16px', marginBottom:14 }}>
          <div style=${{ fontSize:13, fontWeight:700, color:'#38BDF8', marginBottom:4 }}>📥 Importer un profil joueur</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:12 }}>
            Colle le code d'export fourni par le joueur ou charge le fichier .perfhand
          </div>
          <textarea class="inp" value=${importCode} onInput=${e => { setImportCode(e.target.value); setImportError(''); }}
            placeholder="Colle ici le code d'export du joueur..."
            style=${{ resize:'vertical', minHeight:80, fontSize:10, fontFamily:'monospace' }}></textarea>
          ${importError ? _h`<div style=${{ color:'#FF4455', fontSize:11, marginTop:4 }}>${importError}</div>` : null}
          <div style=${{ display:'flex', gap:8, marginTop:10 }}>
            <button class="btn btn-primary" style=${{ flex:2 }} onClick=${importProfil}>Importer le profil</button>
            <label style=${{ flex:1, cursor:'pointer' }}>
              <input type="file" accept=".perfhand,.txt" style=${{ display:'none' }}
                onChange=${e => {
                  const f = e.target.files[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = ev => setImportCode(ev.target.result);
                  r.readAsText(f);
                }}/>
              <div class="btn btn-sm" style=${{ width:'100%', textAlign:'center', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.6)' }}>
                📂 Fichier
              </div>
            </label>
          </div>
        </div>` : null}

        <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:11, padding:'11px 16px', marginBottom:18 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:'#38BDF8', marginBottom:4 }}>Suivi personnalisé hors club</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.7 }}>
            Chaque profil a son espace complet : nutrition, musculation, bilans, wellness, tests.
            Le joueur se connecte avec son email et mot de passe définis ici.
          </div>
        </div>

        ${playersPerso.length === 0
          ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
              Aucun profil individuel.<br/>
              <button class="btn btn-sm" style=${{ marginTop:12 }} onClick=${() => setShowAddPerso(true)}>+ Créer le premier</button>
            </div>`
          : _h`<div>
            ${playersPerso.map(p => {
              const sc = { ok:'#4CAF50', blesse:'#FF4455', surveille:'#FF7A00', repos:'#FFB800' }[p.status] || '#4CAF50';
              return _h`<div key=${p.id} style=${{
                background:'rgba(255,255,255,.025)', border:'1px solid '+sc+'25',
                borderRadius:14, padding:'12px 14px', marginBottom:10, cursor:'pointer'
              }} onClick=${() => setSelPerso(p)}>
                <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style=${{ width:38, height:38, borderRadius:'50%', background:sc+'22', border:'2px solid '+sc+'55',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:sc,
                    fontFamily:"'Barlow Condensed',sans-serif", flexShrink:0 }}>
                    ${p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style=${{ flex:1, minWidth:0 }}>
                    <div style=${{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <div style=${{ fontSize:14, fontWeight:700 }}>${p.name}</div>
                      <div style=${{ fontSize:9, padding:'2px 7px', borderRadius:20, fontWeight:700, background:sc+'18', color:sc, flexShrink:0 }}>
                        ${{ ok:'Disponible', blesse:'Blessé', surveille:'Surveillance', repos:'Repos' }[p.status]||'Disponible'}
                      </div>
                    </div>
                    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>
                      ${p.sport||'Handball'}${p.poste?' · '+p.poste:''}
                    </div>
                    <div style=${{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                      <span style=${{ fontSize:10, background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.25)', borderRadius:5, padding:'2px 7px', color:'#FFA420', fontFamily:'monospace' }}>${p.email||'—'}</span>
                    </div>
                  </div>
                </div>
                <div style=${{ display:'flex', gap:6, alignItems:'center', justifyContent:'flex-end' }} onClick=${e => e.stopPropagation()}>
                                    <button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontSize:10 }}
                    title="Envoyer au joueur un email pour choisir son mot de passe"
                    onClick=${e => {
                      e.stopPropagation();
                      // Ancien « Code accès » : code dérivé du mot de passe, stocké seulement sur CET
                      // appareil (inutilisable depuis le téléphone du joueur) et qui affichait le mot
                      // de passe en clair. Remplacé par l'email de (ré)initialisation Firebase.
                      envoyerReinitialisation(p.email);
                    }}>🔑 Mot de passe</button>
                  <button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.12)', border:'1px solid rgba(76,175,80,.4)', color:'#4CAF50', fontWeight:700, fontSize:10 }}
                    onClick=${e => { e.stopPropagation(); setRapportPerso(p); }}>📊 Bilan</button>
                  <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}
                    onClick=${e => { e.stopPropagation(); setEditPerso(p); }}>✏️</button>
                  <button class="btn btn-sm" title="Archiver ce profil (contrat terminé) — historique conservé"
                    style=${{ background:'rgba(124,111,255,.1)', border:'1px solid rgba(124,111,255,.3)', color:'#7C6FFF' }}
                    onClick=${e => { e.stopPropagation(); archivePerso(p.id); }}>🗄</button>
                  <button class="btn btn-sm btn-danger"
                    onClick=${e => { e.stopPropagation(); deletePerso(p.id); }}>×</button>
                </div>
              </div>`;
            })}

          <!-- Profils archivés -->
          ${playersPersoArchives.length > 0 ? _h`<details style=${{ marginTop:14 }}>
            <summary style=${{ fontSize:11, color:'rgba(255,255,255,.4)', cursor:'pointer', padding:'6px 0' }}>
              🗄 ${playersPersoArchives.length} profil${playersPersoArchives.length>1?'s':''} archivé${playersPersoArchives.length>1?'s':''}
            </summary>
            <div style=${{ marginTop:8 }}>
              ${playersPersoArchives.map(p => _h`<div key=${p.id} style=${{
                background:'rgba(255,255,255,.015)', border:'1px solid rgba(255,255,255,.06)',
                borderRadius:12, padding:'10px 16px', marginBottom:6,
                display:'flex', justifyContent:'space-between', alignItems:'center', opacity:0.6
              }}>
                <div>
                  <div style=${{ fontSize:12, fontWeight:700 }}>${p.name}</div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${p.sport||'Handball'} · Archivé le ${p.archivedDate||'?'}</div>
                </div>
                <div style=${{ display:'flex', gap:8 }}>
                  <button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', padding:'3px 10px', fontSize:11 }}
                    onClick=${() => setRapportPerso(p)}>📊 Bilan</button>
                  <button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', padding:'3px 10px', fontSize:11 }}
                    onClick=${() => unarchivePerso(p.id)}>↩ Réactiver</button>
                  <button class="btn btn-sm btn-danger" style=${{ padding:'3px 8px', fontSize:12 }} title="Supprimer définitivement"
                    onClick=${() => deletePerso(p.id)}>×</button>
                </div>
              </div>`)}
            </div>
          </details>` : null}
          </div>`
        }

        <!-- Modal Sync export/import -->
        ${showSync && _h`<div class="edit-modal-bg" onClick=${()=>setShowSync(false)}>
          <div class="edit-modal" style=${{ maxWidth:500 }} onClick=${e=>e.stopPropagation()}>
            <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div style=${{ fontSize:15, fontWeight:800 }}>Synchroniser les profils</div>
              <button onClick=${()=>setShowSync(false)} style=${{ background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:20,cursor:'pointer' }}>x</button>
            </div>
            <div class="edit-modal-body">
              <div style=${{ marginBottom:16 }}>
                <div style=${{ fontSize:13, fontWeight:700, marginBottom:8, color:'#38BDF8' }}>Exporter vers un autre appareil</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:10 }}>
                  Copie ce code et colle-le sur ton autre appareil pour importer tous les profils.
                </div>
                <div style=${{ display:'flex', gap:8 }}>
                  <textarea
                    readOnly
                    value=${btoa(JSON.stringify(playersPerso))}
                    style=${{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, color:'rgba(255,255,255,.6)', fontSize:10, padding:'8px', fontFamily:'monospace', resize:'none', height:60 }}
                  ></textarea>
                  <button class="btn btn-primary" style=${{ flexShrink:0 }}
                    onClick=${()=>{ navigator.clipboard.writeText(btoa(JSON.stringify(playersPerso))); alert('Code copie !'); }}>
                    Copier
                  </button>
                </div>
              </div>
              <div style=${{ borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:16 }}>
                <div style=${{ fontSize:13, fontWeight:700, marginBottom:8, color:'#FFA420' }}>Importer depuis un autre appareil</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:10 }}>
                  Colle ici le code copie depuis ton autre appareil.
                </div>
                <textarea
                  value=${importText}
                  onInput=${e=>setImportText(e.target.value)}
                  placeholder="Colle le code ici..."
                  style=${{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, color:'#fff', fontSize:10, padding:'8px', fontFamily:'monospace', resize:'none', height:60, boxSizing:'border-box' }}
                ></textarea>
                <button class="btn btn-primary" style=${{ width:'100%', marginTop:8 }}
                  onClick=${()=>{
                    try {
                      const imported = JSON.parse(atob(importText.trim()));
                      if (Array.isArray(imported)) {
                        setDb(d => {
                          const existing = new Set((d.playersPerso||[]).map(p=>p.id));
                          const newOnes = imported.filter(p=>!existing.has(p.id));
                          return { ...d, playersPerso: [...(d.playersPerso||[]), ...newOnes] };
                        });
                        setImportText('');
                        setShowSync(false);
                        alert(imported.length + ' profil(s) importe(s) avec succes.');
                      }
                    } catch(e) { alert('Code invalide.'); }
                  }}>
                  Importer les profils
                </button>
              </div>
            </div>
          </div>
        </div>`}

        <!-- Formulaire ajout -->
        ${showAddPerso && _h`<div class="edit-modal-bg" onClick=${() => setShowAddPerso(false)}>
          <div class="edit-modal" style=${{ maxWidth:500 }} onClick=${e => e.stopPropagation()}>
            <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div style=${{ fontSize:15, fontWeight:800 }}>Nouveau profil individuel</div>
              <button onClick=${() => setShowAddPerso(false)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            <div class="edit-modal-body">
              <div class="edit-row">
                <div><div class="lbl">Nom complet *</div><input class="inp" value=${formP.name} onInput=${e => updP('name',e.target.value)} placeholder="Prénom Nom"/></div>
                <div><div class="lbl">Poste</div><input class="inp" value=${formP.poste} onInput=${e => updP('poste',e.target.value)} placeholder="Pivot..."/></div>
              </div>
              <div class="edit-row">
                <div><div class="lbl">Email * (connexion)</div><input class="inp" type="email" value=${formP.email} onInput=${e => updP('email',e.target.value)} placeholder="joueur@email.fr"/></div>
                <div><div class="lbl">Mot de passe *</div><input class="inp" value=${formP.password} onInput=${e => updP('password',e.target.value)} placeholder="motdepasse123"/></div>
              </div>
              <div class="edit-row">
                <div><div class="lbl">Âge</div><input class="inp" type="number" value=${formP.age} onInput=${e => updP('age',e.target.value)}/></div>
                <div><div class="lbl">Poids kg</div><input class="inp" type="number" value=${formP.poids} onInput=${e => updP('poids',e.target.value)}/></div>
                <div><div class="lbl">Taille cm</div><input class="inp" type="number" value=${formP.taille} onInput=${e => updP('taille',e.target.value)}/></div>
              </div>
              <div style=${{ marginBottom:10 }}>
                <div class="lbl">Genre</div>
                <div style=${{ display:'flex', gap:8 }}>
                  ${['M','F'].map(g => _h`<button key=${g}
                    onClick=${e => { e.preventDefault(); updP('genre', g); }}
                    style=${{
                      flex:1, padding:'8px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:700,
                      border: (formP.genre||'M')===g ? '2px solid '+(g==='F'?'#FF6B9D':'#38BDF8') : '1px solid rgba(255,255,255,.1)',
                      background: (formP.genre||'M')===g ? (g==='F'?'rgba(255,107,157,.12)':'rgba(56,189,248,.1)') : 'rgba(255,255,255,.03)',
                      color: (formP.genre||'M')===g ? (g==='F'?'#FF6B9D':'#38BDF8') : 'rgba(255,255,255,.4)'
                    }}>${g==='M'?'♂ Homme':'♀ Femme'}</button>`)}
                </div>
              </div>
              <div style=${{ marginBottom:10 }}><div class="lbl">Sport</div><input class="inp" value=${formP.sport} onInput=${e => updP('sport',e.target.value)}/></div>
              <div style=${{ marginBottom:10 }}><div class="lbl">Objectif</div><input class="inp" value=${formP.objectif} onInput=${e => updP('objectif',e.target.value)} placeholder="Objectif principal..."/></div>
              <div><div class="lbl">Notes</div><textarea class="inp" value=${formP.notes} onInput=${e => updP('notes',e.target.value)} style=${{ resize:'vertical', minHeight:50 }}></textarea></div>
            </div>
            <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
              <button class="btn" style=${{ flex:1 }} onClick=${() => setShowAddPerso(false)}>Annuler</button>
              <button class="btn btn-primary" style=${{ flex:2 }} onClick=${savePerso} disabled=${!formP.name||!formP.email||!formP.password}>Créer le profil</button>
            </div>
          </div>
        </div>`}



      </div>` : null}

    </div>



    <!-- Mobile bottom nav -->
    <nav class="mobile-nav" style=${{ display:'none' }}>
      ${NAV.map(item => _h`<button key=${item.id}
        class=${'mobile-nav-btn'+(page===item.id?' active':'')}
        onClick=${() => { setPage(item.id); setSelClub(null); setSelPlayer(null); }}>
        <span>${item.icon}</span>
        <span style=${{ fontSize:9 }}>${item.label}</span>
      </button>`)}
      <button class="mobile-nav-btn" onClick=${logout} style=${{ color:'#FF4455' }}>
        <span>⏏</span>
        <span style=${{ fontSize:9 }}>Quitter</span>
      </button>
    </nav>

    <!-- Global modals — rendered at top level to avoid nesting issues -->
    ${editPerso ? _h`<${EditPersoModal}
      p=${editPerso}
      onSave=${(upd) => updatePerso(editPerso.id, upd)}
      onClose=${() => setEditPerso(null)}
    />` : null}
  </div>`;
}
