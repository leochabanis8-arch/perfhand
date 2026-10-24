

// ── STAFF VIEW 2 (prépa physique externe) ─────────────────────────────────────
const ROLES_STAFF = [
  { id:'admin_club',    label:'Admin club',        icon:'👑', couleur:'#FFA420',
    permissions: ['effectif','muscu','endurance','bilan','blessures','mental','nutrition','planif','protocole','stats','charge','tactique'] },
  { id:'prepa',         label:'Prépa physique',    icon:'💪', couleur:'#FF4455',
    permissions: ['muscu','endurance','bilan','charge','planif','nutrition'] },
  { id:'kine',          label:'Kiné / Médical',    icon:'🩺', couleur:'#4CAF50',
    permissions: ['blessures','protocole','bilan','mental','charge'] },
  { id:'entraineur',    label:'Entraîneur',        icon:'🎯', couleur:'#38BDF8',
    permissions: ['effectif','mental','stats','planif','bilan','tactique'] },
  { id:'nutritionniste',label:'Nutritionniste',    icon:'🥗', couleur:'#7C6FFF',
    permissions: ['nutrition','bilan'] },
  { id:'observateur',   label:'Observateur',       icon:'👁', couleur:'rgba(255,255,255,.4)',
    permissions: ['effectif','bilan'] },
];

const ALL_PERMISSIONS = [
  { id:'effectif',   label:'Effectif & profil' },
  { id:'muscu',      label:'Musculation' },
  { id:'endurance',  label:'Endurance' },
  { id:'bilan',      label:'Bilan & charge' },
  { id:'blessures',  label:'Blessures' },
  { id:'mental',     label:'Mental' },
  { id:'nutrition',  label:'Nutrition' },
  { id:'planif',     label:'Planification' },
  { id:'protocole',  label:'Protocoles' },
  { id:'stats',      label:'Stats matchs' },
  { id:'charge',     label:'Charge équipe' },
  { id:'tactique',   label:'Tactique (créer des schémas)' },
];

function getStaffPermissions(staffInfo) {
  if (!staffInfo) return [];
  if (staffInfo.permissions) return staffInfo.permissions;
  const role = (typeof ROLES_STAFF !== 'undefined' ? ROLES_STAFF : []).find(r => r.id === staffInfo.roleId);
  return role ? role.permissions : [];
}

function hasPermission(staffInfo, permId) {
  return getStaffPermissions(staffInfo).includes(permId);
}

function StaffView2() {
  const { session, logout, db, setDb } = useApp();
  const [page, setPage] = useState(() => {
    const si = (db.staffAccounts||[]).find(s => s.id === session.staffId) || {};
    return si.roleId === 'entraineur' ? 'tactique' : 'joueurs';
  });
  const [selPlayer, setSelPlayer] = useState(null);
  const [showShare, setShowShare] = useState(null); // player being shared

  // Staff sees only their own club
  const staffInfo = (db.staffAccounts||[]).find(s => s.id === session.staffId) || {};
  // clubId fiable : staffInfo OU session (fallback Firebase)
  const myClubId = staffInfo.clubId || session.clubId;
  const myClub = db.clubs.find(c => c.id === myClubId) || null;

  // Le staff voit les VRAIS joueurs du club (mêmes que le coach)
  const allProfiles = (db.playerProfiles && db.playerProfiles.length > 0) ? db.playerProfiles : (db.players || []);
  const players = myClubId
    ? allProfiles.filter(p => playerInClub(p, myClubId))
    : allProfiles;
  console.log('[StaffView2] clubId:', myClubId, 'profils totaux:', allProfiles.length, 'filtrés:', players.length);

  function saveStaffDb(updater) {
    setDb(d => {
      const cur = (d.staffClubs && d.staffClubs[session.staffId]) || { players:[], seances:[] };
      const next = updater(cur);
      return { ...d, staffClubs: { ...(d.staffClubs||{}), [session.staffId]: next } };
    });
  }

  function generateShareLink(player, mode) {
    const token = btoa(JSON.stringify({ staffId:session.staffId, playerId:player.id, mode, ts:Date.now() }));
    const url = window.location.origin + window.location.pathname + '?share=' + token;
    return url;
  }

  // Si un joueur est sélectionné, afficher sa fiche détaillée
  if (selPlayer) {
    return _h`<div style=${{ minHeight:'100vh', background:'#080A0E', color:'#fff' }}>
      <div class="topbar">
        <div class="logo"><span>PERF</span>HAND</div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>Espace Staff</div>
        <button class="btn btn-sm btn-danger" onClick=${logout}>Déco</button>
      </div>
      <div style=${{ padding:'20px', paddingBottom:80 }}>
        ${React.createElement(PlayerDetail, {
          p: selPlayer, db, setDb,
          onBack: () => setSelPlayer(null),
          staffPermissions: getStaffPermissions(staffInfo)
        })}
      </div>
    </div>`;
  }

  return _h`<div style=${{ minHeight:'100vh', background:'#080A0E', color:'#fff' }}>
    <!-- Topbar -->
    <div class="topbar">
      <div class="logo"><span>PERF</span>HAND</div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>Espace Staff</div>
      <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
        <div style=${{ width:30, height:30, borderRadius:'50%', background:'rgba(56,189,248,.2)', border:'1px solid rgba(56,189,248,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#38BDF8' }}>
          ${(session.name||'?')[0].toUpperCase()}
        </div>
        <button class="btn btn-sm btn-danger" onClick=${logout}>Déco</button>
      </div>
    </div>

    <!-- Header club -->
    <div style=${{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'14px 20px' }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>${staffInfo.roleId === 'entraineur' ? '🎯 Espace entraîneur' : 'Mon espace'}</div>
      <div style=${{ fontSize:20, fontWeight:800 }}>${session.name}</div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:2 }}>${myClub ? myClub.name + ' · ' + myClub.division : 'Club non assigné'}</div>
    </div>

    <!-- Nav -->
    <div style=${{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,.07)', overflowX:'auto' }}>
      ${[
        ['joueurs','👥 Joueurs', null],
        ['planif','📅 Planif', 'planif'],
        ['charge','📊 Charge équipe', 'charge'],
        ['volume','📈 Volume équipe', 'charge'],
        ['poids','⚖️ Poids équipe', 'charge'],
        ['vma','⚡ VMA équipe', 'charge'],
        ['stats','🏐 Stats matchs', 'stats'],
        ['tactique','🎯 Tactique', null],
        ['bibliotheque','📚 Biblio', null],
        ['ressources','📂 Docs', null],
      ].filter(([id,label,perm]) => !perm || hasPermission(staffInfo, perm))
       .sort((a, b) => staffInfo.roleId === 'entraineur' ? ((a[0] === 'tactique' ? 0 : 1) - (b[0] === 'tactique' ? 0 : 1)) : 0)
       .map(([id,label]) =>
        _h`<button key=${id} onClick=${() => setPage(id)}
          style=${{ padding:'12px 16px', background:'none', border:'none',
            borderBottom:'2px solid '+(page===id?'#FFA420':'transparent'),
            color:page===id?'#fff':'rgba(255,255,255,.4)', fontSize:12, fontWeight:page===id?700:400,
            cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif' }}>${label}</button>`
      )}
    </div>

    <!-- Content -->
    <div style=${{ padding:'20px', paddingBottom:80 }}>

      <!-- JOUEURS -->
      ${page === 'joueurs' && _h`<div>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style=${{ fontSize:16, fontWeight:800 }}>Joueurs ${myClub ? '· '+myClub.name : ''} (${players.length})</div>
        </div>
        ${players.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', border:'1px dashed rgba(255,255,255,.08)', borderRadius:12 }}>
          Aucun joueur dans ce club
        </div>` :
        players.map(p => {
          const sc = { ok:'#4CAF50', blesse:'#FF4455', surveille:'#FFB800', repos:'rgba(255,255,255,.3)' }[p.status] || '#4CAF50';
          return _h`<div key=${p.id} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid '+sc+'25', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
                <div style=${{ width:38, height:38, borderRadius:'50%', background:sc+'20', border:'2px solid '+sc+'40', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:sc }}>
                  ${p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style=${{ fontSize:14, fontWeight:700 }}>${p.name}</div>
                  <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${p.poste||'Poste non défini'}</div>
                </div>
              </div>
              <div style=${{ display:'flex', gap:6 }}>
                <button class="btn btn-sm" onClick=${() => setShowShare(p)}
                  style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8' }}>🔗 Partager</button>
                <button class="btn btn-sm" onClick=${() => setSelPlayer(p)}
                  style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>→</button>
              </div>
            </div>
          </div>`;
        })}
      </div>`}

      <!-- PLANIF (vue globale du club, même rendu que côté joueur) -->
      ${page === 'planif' && _h`<div>
        ${myClub ? _h`<div>
          ${React.createElement(PlanifSaison, { player: null, club: myClub, db: db })}
          ${hasPermission(staffInfo,'planif') ? _h`<details style=${{ marginTop:20 }}>
            <summary style=${{ fontSize:13, color:'#000', cursor:'pointer', padding:'12px 16px', fontWeight:800, background:'#FFA420', borderRadius:10, listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>✏️ Modifier le planning du club (assigner les cycles par semaine) <span>▾</span></summary>
            <div style=${{ marginTop:12 }}>
              ${React.createElement(PlanifClubView, { club: myClub, players: players, readOnly: false })}
            </div>
          </details>` : null}
        </div>` : _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)' }}>Aucun club assigné.</div>`}
      </div>`}

      <!-- CHARGE ÉQUIPE -->
      ${page === 'charge' && React.createElement(ChargeDashboard, { players: players, clubs: db.clubs || [] })}

      <!-- VOLUME ÉQUIPE -->
      ${page === 'volume' && React.createElement(VolumeEquipeView, { players: players })}
      ${page === 'poids' && React.createElement(PoidsEquipeView, { players: players, setDb: setDb })}
      ${page === 'vma' && React.createElement(VMAEquipeView, { players: players, setDb: setDb })}

      <!-- STATS MATCHS -->
      ${page === 'stats' && _h`<div>
        ${myClub ? React.createElement(StatsMatchView, { club: myClub, players: players, db, setDb })
          : _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)' }}>Aucun club assigné.</div>`}
      </div>`}

      ${page === 'tactique' && _h`<div style=${{ padding:'16px 14px' }}>${React.createElement(TactiqueView, { db, setDb, clubs: [], clubId: myClubId || '', canEdit: hasPermission(staffInfo,'tactique') || ['admin_club','entraineur'].includes(staffInfo.roleId), auteur: staffInfo.name || session.name || 'Staff' })}</div>`}
      ${page === 'bibliotheque' && React.createElement(BibliothequeView, { db, setDb: () => {}, readOnly: true })}
      ${page === 'ressources' && _h`<div>
        <div style=${{ fontSize:16, fontWeight:800, marginBottom:16 }}>📂 Ressources</div>
        ${React.createElement(RessourcesView, { db, setDb: () => {} })}
      </div>`}

    </div>

    <!-- Modal partage -->
    ${showShare && _h`<div class="edit-modal-bg" onClick=${() => setShowShare(null)}>
      <div class="edit-modal" style=${{ maxWidth:460 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>🔗 Partager — ${showShare.name}</div>
          <button onClick=${() => setShowShare(null)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style=${{ padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.6, background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px 14px' }}>
            Génère un lien de partage pour cette fiche joueur. Envoie-le à Léo ou à un autre staff pour collaboration.
          </div>
          <!-- Lien observation -->
          <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'14px' }}>
            <div style=${{ fontSize:13, fontWeight:700, color:'#38BDF8', marginBottom:4 }}>👁 Lien Observation (lecture seule)</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:10 }}>Le destinataire peut consulter la fiche sans modifier</div>
            <button class="btn btn-primary" style=${{ width:'100%', background:'rgba(56,189,248,.2)', border:'1px solid rgba(56,189,248,.4)', color:'#38BDF8' }}
              onClick=${() => {
                const url = generateShareLink(showShare, 'view');
                navigator.clipboard.writeText(url).then(() => alert('✅ Lien copié !\n\n' + url)).catch(() => alert('Lien :\n' + url));
              }}>
              📋 Copier le lien lecture
            </button>
          </div>
          <!-- Lien édition -->
          <div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)', borderRadius:12, padding:'14px' }}>
            <div style=${{ fontSize:13, fontWeight:700, color:'#FFA420', marginBottom:4 }}>✏️ Lien Édition (modification)</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:10 }}>Le destinataire peut modifier la fiche · à utiliser avec confiance</div>
            <button class="btn btn-primary" style=${{ width:'100%' }}
              onClick=${() => {
                const url = generateShareLink(showShare, 'edit');
                navigator.clipboard.writeText(url).then(() => alert('✅ Lien copié !\n\n' + url)).catch(() => alert('Lien :\n' + url));
              }}>
              📋 Copier le lien édition
            </button>
          </div>
        </div>
      </div>
    </div>`}
  </div>`;
}

// ── GESTION STAFF (côté admin) ─────────────────────────────────────────────────
function StaffManagerView() {
  const { db, setDb } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState(null); // staff en cours d'édition
  const [form, setForm] = useState({ name:'', email:'', password:'', clubId:'', role:'staff', roleId:'entraineur', notes:'', permissions:null });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const staffList = db.staffAccounts || [];

  async function addStaff() {
    if (!form.name || !form.email || !form.password) return;
    if (form.password.trim().length < 6) { setCreateErr('Le mot de passe doit faire au moins 6 caractères.'); return; }
    setCreating(true);
    setCreateErr('');
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const roleDefault = ROLES_STAFF.find(r => r.id === form.roleId);
    const entry = { ...form, email, permissions: form.permissions || (roleDefault ? roleDefault.permissions : []), id:'staff'+Date.now(), createdAt:localDateStr() };
    try {
      // IMPORTANT : le compte Firebase Auth doit exister, sinon le staff ne pourra
      // jamais se connecter (sign-in échoue silencieusement / bloque sur "Connexion...").
      // On crée le compte sur une instance Firebase secondaire pour ne pas déconnecter
      // le coach actuellement connecté.
      const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAB0dqrmBjZuZeLbBO2jVWRsECkzvFpVvg",
        authDomain: "perfhand-f8005.firebaseapp.com",
        databaseURL: "https://perfhand-f8005-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "perfhand-f8005",
        storageBucket: "perfhand-f8005.firebasestorage.app",
        messagingSenderId: "942276447358",
        appId: "1:942276447358:web:f47eb85391a07119ff5c2f",
      };
      const secondaryApp = firebase.apps.find(a => a.name === 'StaffCreation')
        || firebase.initializeApp(FIREBASE_CONFIG, 'StaffCreation');
      const secondaryAuth = secondaryApp.auth();
      await secondaryAuth.createUserWithEmailAndPassword(email, password);
      try { await secondaryAuth.signOut(); } catch(e) {}
      try { await secondaryApp.delete(); } catch(e) {}
      setDb(d => ({ ...d, staffAccounts:[...(d.staffAccounts||[]), entry] }));
      setCreating(false);
      setShowAdd(false);
      setForm({ name:'', email:'', password:'', clubId:'', role:'staff', roleId:'entraineur', notes:'', permissions:null });
    } catch(e) {
      setCreating(false);
      if (e.code === 'auth/email-already-in-use') {
        // Le compte Firebase existe déjà (ex: recréation) — on ajoute quand même l'accès staff.
        setDb(d => ({ ...d, staffAccounts:[...(d.staffAccounts||[]), entry] }));
        setShowAdd(false);
        setForm({ name:'', email:'', password:'', clubId:'', role:'staff', roleId:'entraineur', notes:'', permissions:null });
      } else {
        setCreateErr(e.message || "Impossible de créer le compte de connexion.");
      }
    }
  }

  function openEdit(s) {
    setForm({
      name: s.name||'', email: s.email||'',
      clubId: s.clubId||'', role: s.role||'staff', roleId: s.roleId||'entraineur',
      notes: s.notes||'', permissions: s.permissions || null
    });
    setEditStaff(s);
  }

  function saveEdit() {
    if (!form.name || !form.email) return;
    setDb(d => ({ ...d, staffAccounts:(d.staffAccounts||[]).map(s =>
      s.id === editStaff.id ? { ...s, ...form } : s
    )}));
    setEditStaff(null);
    setForm({ name:'', email:'', password:'', clubId:'', role:'staff', roleId:'entraineur', notes:'', permissions:null });
  }

  function togglePerm(permId) {
    setForm(f => {
      const current = f.permissions || (ROLES_STAFF.find(r => r.id === f.roleId)?.permissions || []);
      const next = current.includes(permId) ? current.filter(p => p !== permId) : [...current, permId];
      return { ...f, permissions: next };
    });
  }

  function deleteStaff(id) {
    if (confirm('Supprimer ce compte staff ?'))
      setDb(d => ({ ...d, staffAccounts:(d.staffAccounts||[]).filter(s => s.id !== id) }));
  }

  return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      <div>
        <div style=${{ fontSize:18, fontWeight:800 }}>👥 Comptes Staff</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${staffList.length} prépa${staffList.length>1?'s':''} actif${staffList.length>1?'s':''}</div>
      </div>
      <button class="btn btn-primary btn-sm" onClick=${() => setShowAdd(true)}>+ Nouveau staff</button>
    </div>

    ${staffList.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', border:'1px dashed rgba(255,255,255,.08)', borderRadius:12 }}>
      Aucun compte staff · Crée le premier accès pour un prépa externe
    </div>` : staffList.map(s => {
      const club = db.clubs.find(c => c.id === s.clubId);
      const staffDb = db.staffClubs && db.staffClubs[s.id];
      // Compter les vrais joueurs du club assigné
      const allProf = (db.playerProfiles && db.playerProfiles.length > 0) ? db.playerProfiles : (db.players || []);
      const nbJoueurs = s.clubId ? allProf.filter(p => p.clubId === s.clubId).length : 0;
      return _h`<div key=${s.id} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(56,189,248,.15)', borderRadius:14, padding:'16px', marginBottom:10 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div style=${{ display:'flex', alignItems:'center', gap:12 }}>
            <div style=${{ width:42, height:42, borderRadius:'50%', background:'rgba(56,189,248,.15)', border:'2px solid rgba(56,189,248,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#38BDF8' }}>
              ${(s.name||'?')[0].toUpperCase()}
            </div>
            <div>
              <div style=${{ fontSize:14, fontWeight:800 }}>${s.name}</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:1 }}>${s.email}</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${club ? '🏐 '+club.name : 'Aucun club assigné'} · ${nbJoueurs} joueur${nbJoueurs>1?'s':''}</div>
            </div>
          </div>
          <div style=${{ display:'flex', gap:6, flexDirection:'column', alignItems:'flex-end' }}>
            ${(() => {
              const role = ROLES_STAFF.find(r => r.id === s.roleId);
              return _h`<span style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:(role?role.couleur:'#38BDF8')+'22', color:role?role.couleur:'#38BDF8', fontWeight:700 }}>${role ? role.icon+' '+role.label : 'STAFF'}</span>`;
            })()}
            <div style=${{ display:'flex', gap:5 }}>
              <button class="btn btn-sm" onClick=${() => openEdit(s)}
                style=${{ background:'rgba(255,164,32,.12)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>✏️</button>
              <button class="btn btn-sm btn-danger" onClick=${() => deleteStaff(s.id)}>×</button>
            </div>
          </div>
        </div>
        <div style=${{ marginTop:10, padding:'8px 10px', background:'rgba(255,255,255,.03)', borderRadius:8, display:'flex', gap:16 }}>
          <div style=${{ fontSize:11 }}>
            <span style=${{ color:'rgba(255,255,255,.35)' }}>Email : </span>
            <span style=${{ color:'#FFA420', fontFamily:'monospace' }}>${s.email}</span>
          </div>
          <button onClick=${() => envoyerReinitialisation(s.email)} style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>🔑 Envoyer email mot de passe</button>
        </div>
        ${s.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:8, fontStyle:'italic' }}>${s.notes}</div>` : null}
      </div>`;
    })}

    <!-- Modal création -->
    ${showAdd && _h`<div class="edit-modal-bg" onClick=${() => setShowAdd(false)}>
      <div class="edit-modal" style=${{ maxWidth:440 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between' }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>+ Nouveau compte staff</div>
          <button onClick=${() => setShowAdd(false)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style=${{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          <div><div class="lbl">Nom complet *</div>
            <input class="inp" value=${form.name} onInput=${e=>upd('name',e.target.value)} placeholder="Ex: Marc Dupont"/>
          </div>
          <div><div class="lbl">Email *</div>
            <input class="inp" type="email" value=${form.email} onInput=${e=>upd('email',e.target.value)} placeholder="marc@club.fr"/>
          </div>
          <div><div class="lbl">Mot de passe *</div>
            <input class="inp" value=${form.password} onInput=${e=>upd('password',e.target.value)} placeholder="Minimum 6 caractères"/>
          </div>
          <div><div class="lbl">Club assigné (optionnel)</div>
            <select class="inp" value=${form.clubId} onChange=${e=>upd('clubId',e.target.value)}>
              <option value="">— Aucun club —</option>
              ${(db.clubs||[]).map(c => _h`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
            </select>
          </div>
          <div><div class="lbl">Rôle</div>
            <select class="inp" value=${form.roleId} onChange=${e=>{ const r=ROLES_STAFF.find(x=>x.id===e.target.value); upd('roleId',e.target.value); upd('permissions', r?r.permissions:null); }}>
              ${ROLES_STAFF.map(r => _h`<option key=${r.id} value=${r.id}>${r.icon} ${r.label}</option>`)}
            </select>
          </div>
          <div><div class="lbl">Accès autorisés</div>
            <div style=${{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
              ${ALL_PERMISSIONS.map(p => {
                const active = (form.permissions || ROLES_STAFF.find(r=>r.id===form.roleId)?.permissions || []).includes(p.id);
                return _h`<button key=${p.id} onClick=${() => togglePerm(p.id)}
                  style=${{ fontSize:10, padding:'4px 10px', borderRadius:20, cursor:'pointer',
                    background: active ? 'rgba(76,175,80,.15)' : 'rgba(255,255,255,.04)',
                    border: '1px solid '+(active ? 'rgba(76,175,80,.4)' : 'rgba(255,255,255,.1)'),
                    color: active ? '#4CAF50' : 'rgba(255,255,255,.4)', fontWeight: active?700:400 }}>
                  ${active?'✓ ':''}${p.label}
                </button>`;
              })}
            </div>
          </div>
          <div><div class="lbl">Notes internes</div>
            <textarea class="inp" value=${form.notes} onInput=${e=>upd('notes',e.target.value)} placeholder="Contexte, mission..." style=${{ minHeight:50, resize:'vertical' }}></textarea>
          </div>
          ${createErr ? _h`<div style=${{ fontSize:11, color:'#FF4455', background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.2)', borderRadius:8, padding:'8px 10px' }}>${createErr}</div>` : null}
        </div>
        <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${() => setShowAdd(false)} disabled=${creating}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} onClick=${addStaff} disabled=${creating}>${creating ? 'Création...' : 'Créer le compte'}</button>
        </div>
      </div>
    </div>`}

    <!-- Modal édition -->
    ${editStaff && _h`<div class="edit-modal-bg" onClick=${() => setEditStaff(null)}>
      <div class="edit-modal" style=${{ maxWidth:440 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between' }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>✏️ Modifier ${editStaff.name}</div>
          <button onClick=${() => setEditStaff(null)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style=${{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12, maxHeight:'70vh', overflowY:'auto' }}>
          <div><div class="lbl">Nom complet *</div>
            <input class="inp" value=${form.name} onInput=${e=>upd('name',e.target.value)} placeholder="Ex: Laurent Sorin"/>
          </div>
          <div><div class="lbl">Email *</div>
            <input class="inp" type="email" value=${form.email} onInput=${e=>upd('email',e.target.value)} placeholder="laurent@club.fr"/>
          </div>
          <div><div class="lbl">Club assigné</div>
            <select class="inp" value=${form.clubId} onChange=${e=>upd('clubId',e.target.value)}>
              <option value="">— Aucun club —</option>
              ${(db.clubs||[]).map(c => _h`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
            </select>
          </div>
          <div><div class="lbl">Rôle</div>
            <select class="inp" value=${form.roleId} onChange=${e=>{ const r=ROLES_STAFF.find(x=>x.id===e.target.value); upd('roleId',e.target.value); upd('permissions', r?r.permissions:null); }}>
              ${ROLES_STAFF.map(r => _h`<option key=${r.id} value=${r.id}>${r.icon} ${r.label}</option>`)}
            </select>
          </div>
          <div><div class="lbl">Accès autorisés</div>
            <div style=${{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
              ${ALL_PERMISSIONS.map(p => {
                const active = (form.permissions || ROLES_STAFF.find(r=>r.id===form.roleId)?.permissions || []).includes(p.id);
                return _h`<button key=${p.id} onClick=${() => togglePerm(p.id)}
                  style=${{ fontSize:10, padding:'4px 10px', borderRadius:20, cursor:'pointer',
                    background: active ? 'rgba(76,175,80,.15)' : 'rgba(255,255,255,.04)',
                    border: '1px solid '+(active ? 'rgba(76,175,80,.4)' : 'rgba(255,255,255,.1)'),
                    color: active ? '#4CAF50' : 'rgba(255,255,255,.4)', fontWeight: active?700:400 }}>
                  ${active?'✓ ':''}${p.label}
                </button>`;
              })}
            </div>
          </div>
          <div><div class="lbl">Notes internes</div>
            <textarea class="inp" value=${form.notes} onInput=${e=>upd('notes',e.target.value)} style=${{ minHeight:50, resize:'vertical' }}></textarea>
          </div>
        </div>
        <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${() => setEditStaff(null)}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} onClick=${saveEdit}>💾 Enregistrer</button>
        </div>
      </div>
    </div>`}
  </div>`;
}


// ── VUE PARTAGÉE (lien de partage) ────────────────────────────────────────────
function SharedPlayerView() {
  const { db } = useApp();
  const ctx = window._shareContext || {};
  const { staffId, playerId, mode } = ctx;

  const staffDb = db.staffClubs && db.staffClubs[staffId];
  const player = staffDb ? (staffDb.players||[]).find(p => p.id === playerId) : null;
  const staffInfo = (db.staffAccounts||[]).find(s => s.id === staffId);

  if (!player) return _h`<div style=${{ minHeight:'100vh', background:'#080A0E', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
    <div style=${{ fontSize:40 }}>🔗</div>
    <div style=${{ fontSize:16, fontWeight:700 }}>Lien de partage</div>
    <div style=${{ fontSize:13, color:'rgba(255,255,255,.4)' }}>Chargement de la fiche...</div>
  </div>`;

  const isEdit = mode === 'edit';

  return _h`<div style=${{ minHeight:'100vh', background:'#080A0E', color:'#fff' }}>
    <div style=${{ background:'rgba(255,255,255,.04)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'12px 20px', display:'flex', alignItems:'center', gap:12 }}>
      <div class="logo"><span>PERF</span>HAND</div>
      <div style=${{ flex:1, fontSize:11, color:'rgba(255,255,255,.4)' }}>
        Fiche partagée par ${staffInfo ? staffInfo.name : 'Staff'} · ${isEdit ? '✏️ Mode édition' : '👁 Mode observation'}
      </div>
      <span style=${{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:700,
        background:isEdit?'rgba(255,164,32,.15)':'rgba(56,189,248,.1)',
        color:isEdit?'#FFA420':'#38BDF8', border:'1px solid '+(isEdit?'rgba(255,164,32,.3)':'rgba(56,189,248,.3)') }}>
        ${isEdit ? '✏️ ÉDITION' : '👁 LECTURE'}
      </span>
    </div>
    <div style=${{ padding:'20px' }}>
      <!-- Identité joueur -->
      <div style=${{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'16px', background:'rgba(255,255,255,.03)', borderRadius:14, border:'1px solid rgba(255,255,255,.08)' }}>
        <div style=${{ width:48, height:48, borderRadius:'50%', background:'rgba(255,164,32,.15)', border:'2px solid rgba(255,164,32,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#FFA420' }}>
          ${player.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style=${{ fontSize:18, fontWeight:800 }}>${player.name}</div>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:2 }}>${player.poste||''} · Partagé par ${staffInfo?staffInfo.name:'Staff'}</div>
        </div>
      </div>
      <!-- Séances muscu -->
      ${(player.muscuSeances||[]).length > 0 ? _h`<div style=${{ marginBottom:20 }}>
        <div style=${{ fontSize:13, fontWeight:700, color:'#FFA420', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>💪 Séances Muscu (${(player.muscuSeances||[]).length})</div>
        ${(player.muscuSeances||[]).map(s => _h`<div key=${s.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
          <div style=${{ fontSize:13, fontWeight:700 }}>${s.nom}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:3 }}>${s.objectif||''} ${s.datePrevu?'· '+s.datePrevu:''}</div>
          ${(s.exercices||[]).length > 0 ? _h`<div style=${{ marginTop:8 }}>
            ${s.exercices.map((ex,i) => _h`<div key=${i} style=${{ fontSize:11, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.04)', display:'flex', justifyContent:'space-between' }}>
              <span>${ex.nom}</span>
              <span style=${{ color:'#FFA420', fontWeight:700 }}>${ex.series}×${ex.reps} · ${ex.charge}</span>
            </div>`)}
          </div>` : null}
        </div>`)}
      </div>` : null}
      ${!isEdit ? _h`<div style=${{ textAlign:'center', padding:'20px', fontSize:12, color:'rgba(255,255,255,.3)', background:'rgba(255,255,255,.02)', borderRadius:10, border:'1px dashed rgba(255,255,255,.07)' }}>
        Vue lecture seule · Contacte le prépa pour proposer des modifications
      </div>` : _h`<div style=${{ textAlign:'center', padding:'16px', fontSize:12, color:'#FFA420', background:'rgba(255,164,32,.06)', borderRadius:10, border:'1px solid rgba(255,164,32,.2)' }}>
        ✏️ Mode édition actif · Tes modifications seront synchronisées
      </div>`}
    </div>
  </div>`;
}
