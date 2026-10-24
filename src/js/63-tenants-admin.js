

// ── DONNÉES GPS VIEW ──────────────────────────────────────────────────────────
function LegacyAdminView({ onBack }) {
  const syncOn = !!window.__perfhand_db;
  return _h`<div style=${{ minHeight:'100vh', background:'#0D0D0D' }}>
    <div style=${{ background:'#111', borderBottom:'1px solid #222', padding:'10px 20px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
      <button onClick=${onBack}
        style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:11 }}>
        ← Super Admin
      </button>
      <div style=${{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.5)' }}>Mon espace — USM & Profils individuels</div>
      <div style=${{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:20,
        background: syncOn ? 'rgba(76,175,80,.1)' : 'rgba(255,164,32,.1)',
        border:'1px solid ' + (syncOn ? 'rgba(76,175,80,.3)' : 'rgba(255,164,32,.3)') }}>
        <div style=${{ width:7, height:7, borderRadius:'50%', background: syncOn ? '#4CAF50' : '#FFA420' }}></div>
        <span style=${{ fontSize:10, fontWeight:700, color: syncOn ? '#4CAF50' : '#FFA420' }}>${syncOn ? 'Sync activée' : 'Sync désactivée'}</span>
      </div>
    </div>
    <${AdminView} />
  </div>`;
}

function SuperAdminView() {
  const { session, logout, db } = useApp();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selTenant, setSelTenant] = useState(null);
  const [impersonating, setImpersonating] = useState(null);

  React.useEffect(() => {
    if (!window.__perfhand_db) return;
    window.__perfhand_db.ref('tenants').on('value', snap => {
      const raw = snap.val();
      if (raw) setTenants(Object.values(raw).filter(Boolean));
      else setTenants([]);
      setLoading(false);
    });
    return () => window.__perfhand_db.ref('tenants').off();
  }, []);

  const [showLegacy, setShowLegacy] = useState(false);

  if (showLegacy) {
    // Render legacy coach/admin view
    return React.createElement(LegacyAdminView, { onBack: () => setShowLegacy(false) });
  }

  if (impersonating) {
    return React.createElement(TenantAdminView, {
      tenant: impersonating,
      onBack: () => setImpersonating(null),
      superAdmin: true,
    });
  }

  return _h`<div style=${{ minHeight:'100vh', background:'#0D0D0D', color:'#fff', fontFamily:'Inter,sans-serif' }}>
    <!-- Header -->
    <div style=${{ background:'#111', borderBottom:'1px solid #222', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:12 }}>
        <div style=${{ fontSize:20, fontWeight:800 }}><span style=${{ color:'#FFA420' }}>PERF</span>HAND</div>
        <div style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', borderRadius:6, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#FFA420' }}>SUPER ADMIN</div>
      </div>
      <div style=${{ display:'flex', gap:8 }}>
        <button onClick=${() => setShowLegacy(true)}
          style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:11, fontWeight:600 }}>
          🏠 Mon espace
        </button>
        <button class="btn" style=${{ fontSize:11 }} onClick=${logout}>Déconnexion</button>
      </div>
    </div>

    <div style=${{ padding:'24px', maxWidth:1100, margin:'0 auto' }}>
      <!-- Stats -->
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        ${[
          ['Tenants actifs', tenants.filter(t=>t.actif).length, '#4CAF50'],
          ['Total comptes', tenants.length, '#FFA420'],
          ['Sports', [...new Set(tenants.map(t=>t.sport))].length, '#38BDF8'],
          ['Ce mois', tenants.filter(t=>t.dateCreation && t.dateCreation.startsWith(new Date().toISOString().slice(0,7))).length, '#A78BFA'],
        ].map(([label, val, col]) => _h`<div key=${label} style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:12, padding:'16px 20px' }}>
          <div style=${{ fontSize:28, fontWeight:800, color:col, fontFamily:"'Barlow Condensed',sans-serif" }}>${val}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4 }}>${label}</div>
        </div>`)}
      </div>

      <!-- Tenants list -->
      <div style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:14, overflow:'hidden' }}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid #222', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style=${{ fontSize:14, fontWeight:700 }}>Préparateurs inscrits</div>
        </div>
        ${loading ? _h`<div style=${{ padding:40, textAlign:'center', color:'rgba(255,255,255,.3)' }}>Chargement...</div>` : null}
        ${!loading && tenants.length === 0 ? _h`<div style=${{ padding:40, textAlign:'center', color:'rgba(255,255,255,.2)' }}>Aucun tenant inscrit</div>` : null}
        ${tenants.map(t => _h`<div key=${t.id} style=${{ padding:'14px 20px', borderBottom:'1px solid #1E1E1E', display:'flex', alignItems:'center', gap:12 }}>
          <div style=${{ width:36, height:36, borderRadius:50, background:'#FFA420', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#000', flexShrink:0 }}>
            ${(t.nom||'?')[0].toUpperCase()}
          </div>
          <div style=${{ flex:1 }}>
            <div style=${{ fontSize:13, fontWeight:700 }}>${t.nom}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${t.email} · ${t.sport || 'Sport non défini'} · ${t.structure || '—'}</div>
          </div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginRight:12 }}>Inscrit le ${t.dateCreation || '—'}</div>
          <div style=${{ background: t.actif ? 'rgba(76,175,80,.1)' : 'rgba(255,68,85,.1)', color: t.actif ? '#4CAF50' : '#FF4455', borderRadius:6, padding:'3px 8px', fontSize:9, fontWeight:700 }}>
            ${t.actif ? 'ACTIF' : 'INACTIF'}
          </div>
          <button onClick=${() => setImpersonating(t)}
            style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:11, fontWeight:600 }}>
            Accéder →
          </button>
        </div>`)}
      </div>
    </div>
  </div>`;
}

// ── TENANT ADMIN VIEW — Espace du préparateur externe ──────────────────────────
function TenantAdminView({ tenant, onBack, superAdmin }) {
  const { logout } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [tenantDb, setTenantDb] = useState({ playersPerso:[], clubs:[] });
  const [loading, setLoading] = useState(true);
  const [selPlayer, setSelPlayer] = useState(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddClub, setShowAddClub] = useState(false);
  const [selTenantClub, setSelTenantClub] = useState(null);
  const [playerTab, setPlayerTab] = useState('muscu');
  const [editSettings, setEditSettings] = useState(null);

  const tenantId = tenant.tenantId || tenant.id;

  React.useEffect(() => {
    if (!window.__perfhand_db || !tenantId) return;
    const ref = window.__perfhand_db.ref('tenants/' + tenantId);
    ref.on('value', snap => {
      const data = snap.val() || {};
      const playersPerso = data.playersPerso
        ? listeSansMdp((Array.isArray(data.playersPerso) ? data.playersPerso : Object.values(data.playersPerso)).filter(Boolean))
        : [];
      const clubs = data.clubs
        ? (Array.isArray(data.clubs) ? data.clubs : Object.values(data.clubs)).filter(Boolean)
        : [];
      setTenantDb({ ...data, playersPerso, clubs });
      setLoading(false);
      if (data.codes) indexerCodesTenant(tenantId, data.codes); // codes créés avant l'index
      indexerJoueursTenant(tenantId, playersPerso); // connexion par email de ses joueurs
    });
    return () => window.__perfhand_db.ref('tenants/' + tenantId).off();
  }, [tenantId]);

  function savePlayer(player) {
    player = sansMdp(player);
    const list = listeSansMdp([...(tenantDb.playersPerso || [])]);
    const idx = list.findIndex(p => p.id === player.id);
    if (idx >= 0) list[idx] = player; else list.push(player);
    const obj = {};
    list.forEach(p => { obj[p.id] = p; });
    let safeObj; try { safeObj = JSON.parse(JSON.stringify(obj)); } catch(e) { safeObj = obj; }
    window.__perfhand_db.ref('tenants/' + tenantId + '/playersPerso').set(safeObj);
    setTenantDb(d => ({ ...d, playersPerso: list }));
  }

  function deletePlayer(id) {
    if (!confirm('Supprimer ce joueur ?')) return;
    const list = (tenantDb.playersPerso || []).filter(p => p.id !== id);
    const obj = {};
    list.forEach(p => { obj[p.id] = p; });
    window.__perfhand_db.ref('tenants/' + tenantId + '/playersPerso').set(obj);
    setTenantDb(d => ({ ...d, playersPerso: list }));
    if (selPlayer && selPlayer.id === id) setSelPlayer(null);
  }

  function saveClub(club) {
    const list = [...(tenantDb.clubs || [])];
    const idx = list.findIndex(c => c.id === club.id);
    if (idx >= 0) list[idx] = club; else list.push(club);
    const obj = {};
    list.forEach(c => { obj[c.id] = c; });
    window.__perfhand_db.ref('tenants/' + tenantId + '/clubs').set(obj);
    setTenantDb(d => ({ ...d, clubs: list }));
  }

  function addSeanceMuscu(playerId, seance) {
    const player = (tenantDb.playersPerso || []).find(p => p.id === playerId);
    if (!player) return;
    const seances = [...(player.muscuSeances || []), { ...seance, id: Date.now(), dateCreation: new Date().toISOString().split('T')[0] }];
    savePlayer({ ...player, muscuSeances: seances });
  }

  function deleteSeance(playerId, seanceId) {
    const player = (tenantDb.playersPerso || []).find(p => p.id === playerId);
    if (!player) return;
    savePlayer({ ...player, muscuSeances: (player.muscuSeances || []).filter(s => s.id !== seanceId) });
  }

  const TABS = [
    { id:'dashboard', label:'Dashboard', icon:'🏠' },
    { id:'joueurs', label:'Joueurs perso', icon:'👤' },
    { id:'clubs', label:'Clubs', icon:'🏟️' },
    { id:'settings', label:'Paramètres', icon:'⚙️' },
  ];

  const players = tenantDb.playersPerso || [];
  const clubs = tenantDb.clubs || [];
  const livePlayer = selPlayer ? players.find(p => p.id === selPlayer.id) || selPlayer : null;

  return _h`<div style=${{ minHeight:'100vh', background:'#0D0D0D', color:'#fff', fontFamily:'Inter,sans-serif' }}>
    <!-- Header -->
    <div style=${{ background:'#111', borderBottom:'1px solid #222', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:12 }}>
        <div style=${{ fontSize:18, fontWeight:800 }}><span style=${{ color:'#FFA420' }}>PERF</span>HAND</div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>${tenant.nom || tenant.name}</div>
        ${superAdmin ? _h`<button onClick=${onBack} style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:10 }}>← Super Admin</button>` : null}
      </div>
      <button class="btn" style=${{ fontSize:11 }} onClick=${logout}>Déconnexion</button>
    </div>

    <!-- Tabs -->
    <div style=${{ display:'flex', gap:4, padding:'10px 24px', borderBottom:'1px solid #1A1A1A', overflowX:'auto' }}>
      ${TABS.map(t => _h`<button key=${t.id} onClick=${() => { setTab(t.id); setSelPlayer(null); }}
        style=${{ padding:'7px 14px', borderRadius:8, border:'none', cursor:'pointer', whiteSpace:'nowrap',
          background: tab===t.id ? 'rgba(255,255,255,.1)' : 'transparent',
          color: tab===t.id ? '#fff' : 'rgba(255,255,255,.4)',
          fontWeight: tab===t.id ? 700 : 400, fontSize:11 }}>
        ${t.icon} ${t.label}
      </button>`)}
    </div>

    <div style=${{ padding:'20px 24px', maxWidth:1100, margin:'0 auto' }}>
      ${loading ? _h`<div style=${{ textAlign:'center', padding:60, color:'rgba(255,255,255,.3)' }}>Chargement...</div>` : null}

      <!-- DASHBOARD -->
      ${!loading && tab === 'dashboard' ? _h`<div>
        <div style=${{ fontSize:18, fontWeight:800, marginBottom:16 }}>Bienvenue, ${tenant.nom || tenant.name} 👋</div>
        <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
          ${[
            ['Joueurs', players.length, '#FFA420'],
            ['Clubs', clubs.length, '#38BDF8'],
            ['Séances créées', players.reduce((a,p)=>a+(p.muscuSeances||[]).length,0), '#4CAF50'],
          ].map(([l,v,c]) => _h`<div key=${l} style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:12, padding:'16px 20px' }}>
            <div style=${{ fontSize:28, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4 }}>${l}</div>
          </div>`)}
        </div>
        ${players.length === 0 ? _h`<div style=${{ background:'rgba(255,164,32,.05)', border:'1px solid rgba(255,164,32,.15)', borderRadius:12, padding:'20px' }}>
          <div style=${{ fontSize:13, fontWeight:700, color:'#FFA420', marginBottom:10 }}>🚀 Pour commencer</div>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.9 }}>
            1. Va dans "Joueurs perso" → "+ Nouveau joueur" pour créer ton premier athlète<br/>
            2. Crée-lui un compte dans Firebase Authentication (email + mot de passe)<br/>
            3. Partage l'URL perfhandballapp.netlify.app et ses identifiants
          </div>
        </div>` : _h`<div>
          <div style=${{ fontSize:13, fontWeight:700, marginBottom:10 }}>Activité récente</div>
          ${players.slice(0,5).map(p => _h`<div key=${p.id} style=${{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #1A1A1A' }}>
            <div style=${{ width:32, height:32, borderRadius:50, background:'#FFA420', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color:'#000' }}>${(p.name||'?')[0].toUpperCase()}</div>
            <div style=${{ flex:1 }}>
              <div style=${{ fontSize:12, fontWeight:600 }}>${p.name}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${(p.muscuSeances||[]).length} séances · ${p.sport||'Sport'}</div>
            </div>
            <button onClick=${() => { setSelPlayer(p); setTab('joueurs'); }}
              style=${{ background:'rgba(255,255,255,.06)', border:'none', color:'rgba(255,255,255,.5)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:10 }}>Voir →</button>
          </div>`)}
        </div>`}
      </div>` : null}

      <!-- JOUEURS PERSO -->
      ${!loading && tab === 'joueurs' && !selPlayer ? _h`<div>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style=${{ fontSize:16, fontWeight:800 }}>👤 Joueurs individuels</div>
          <button class="btn btn-primary" style=${{ fontSize:11 }} onClick=${() => setShowAddPlayer(true)}>+ Nouveau joueur</button>
        </div>

        ${showAddPlayer ? _h`<${AddPlayerForm}
          onSave=${(p) => { savePlayer(p); setShowAddPlayer(false); }}
          onCancel=${() => setShowAddPlayer(false)} />` : null}

        ${players.length === 0 && !showAddPlayer ? _h`<div style=${{ textAlign:'center', padding:60, color:'rgba(255,255,255,.2)' }}>
          <div style=${{ fontSize:40, marginBottom:12 }}>👤</div>
          <div>Aucun joueur — clique "+ Nouveau joueur" pour commencer</div>
        </div>` : null}

        <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
          ${players.map(p => _h`<div key=${p.id}
            style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
            onClick=${() => setSelPlayer(p)}>
            <div style=${{ width:40, height:40, borderRadius:50, background:'#FFA420', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'#000', flexShrink:0 }}>
              ${(p.name||'?')[0].toUpperCase()}
            </div>
            <div style=${{ flex:1 }}>
              <div style=${{ fontSize:13, fontWeight:700 }}>${p.name}</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${p.email} · ${p.sport||''} ${p.poste||''}</div>
            </div>
            <div style=${{ fontSize:11, color:'#FFA420' }}>${(p.muscuSeances||[]).length} séance(s)</div>
            <div style=${{ fontSize:13, color:'rgba(255,255,255,.3)' }}>→</div>
          </div>`)}
        </div>
      </div>` : null}

      <!-- FICHE JOUEUR -->
      ${!loading && tab === 'joueurs' && selPlayer && livePlayer ? _h`<div>
        <button onClick=${() => setSelPlayer(null)}
          style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', cursor:'pointer', fontSize:12, marginBottom:16, padding:0 }}>← Retour</button>

        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div style=${{ display:'flex', gap:14, alignItems:'center' }}>
            <div style=${{ width:52, height:52, borderRadius:50, background:'#FFA420', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20, color:'#000' }}>
              ${(livePlayer.name||'?')[0].toUpperCase()}
            </div>
            <div>
              <div style=${{ fontSize:18, fontWeight:800 }}>${livePlayer.name}</div>
              <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>${livePlayer.email} · ${livePlayer.sport||''} · ${livePlayer.poste||''}</div>
            </div>
          </div>
          <div style=${{ display:'flex', gap:8 }}>
            <button onClick=${() => {
              // Générer code 6 chiffres unique
              // Sauvegarder dans Firebase tenants/{tenantId}/codes/{code}
              genererCodeAcces('tenants/' + tenantId + '/codes/', {
                playerId: livePlayer.id,
                playerName: livePlayer.name,
                createdAt: new Date().toISOString()
              }, ['tenantCodes/']).then(async code => {
                try { await window.__perfhand_db.ref('tenantCodes/' + code).set(tenantId); } catch(e) {}
                alert('Code d\'accès de ' + livePlayer.name + ' : ' + code + '\n\nEnvoie ce code à ton athlète. Il peut se connecter via "Code joueur" sur perfhandballapp.netlify.app');
              }).catch(e => alert('Erreur : ' + e.message));
            }}
              style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:11 }}>
              📋 Code accès
            </button>
            <button onClick=${() => deletePlayer(livePlayer.id)}
              style=${{ background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.2)', color:'#FF4455', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:11 }}>
              Supprimer
            </button>
          </div>
        </div>

        <!-- Player sub-tabs -->
        <div style=${{ display:'flex', gap:4, marginBottom:16 }}>
          ${['muscu','endurance','planif','info'].map(t => _h`<button key=${t} onClick=${() => setPlayerTab(t)}
            style=${{ padding:'6px 14px', borderRadius:7, border:'none', cursor:'pointer', fontSize:11,
              background: playerTab===t ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)',
              color: playerTab===t ? '#fff' : 'rgba(255,255,255,.4)',
              fontWeight: playerTab===t ? 700 : 400 }}>
            ${{ muscu:'🏋️ Muscu', endurance:'🏃 Endurance', planif:'📅 Planif', info:'📋 Infos' }[t]}
          </button>`)}
        </div>

        ${playerTab === 'planif' ? React.createElement(PersoPlanifView, {
          player: livePlayer,
          setDb: (fn) => {
            const updated = fn({ playersPerso: tenantDb.playersPerso || [] });
            const list = updated.playersPerso || [];
            const obj = {};
            list.forEach(p => { obj[p.id] = p; });
            window.__perfhand_db.ref('tenants/' + tenantId + '/playersPerso').set(obj);
            setTenantDb(d => ({ ...d, playersPerso: list }));
          },
          isCoach: true,
          firebasePath: (id) => 'tenants/' + tenantId + '/playersPerso/' + id + '/planif'
        }) : null}

        ${playerTab === 'muscu' ? React.createElement(MuscuView, {
          player: livePlayer,
          setDb: (fn) => {
            const updated = fn({ playersPerso: tenantDb.playersPerso || [] });
            const list = updated.playersPerso || [];
            const obj = {};
            list.forEach(p => { obj[p.id] = p; });
            window.__perfhand_db.ref('tenants/' + tenantId + '/playersPerso').set(obj);
            setTenantDb(d => ({ ...d, playersPerso: list }));
          },
          isCoach: true,
          db: { playerProfiles: [], playersPerso: tenantDb.playersPerso || [] }
        }) : null}

        ${playerTab === 'endurance' ? React.createElement(EnduranceView, {
          player: livePlayer,
          setDb: (fn) => {
            const updated = fn({ playersPerso: tenantDb.playersPerso || [] });
            const list = updated.playersPerso || [];
            const obj = {};
            list.forEach(p => { obj[p.id] = p; });
            window.__perfhand_db.ref('tenants/' + tenantId + '/playersPerso').set(obj);
            setTenantDb(d => ({ ...d, playersPerso: list }));
          },
          isCoach: true
        }) : null}

        ${playerTab === 'info' ? _h`<${PlayerInfoTab} player=${livePlayer} onSave=${savePlayer} />` : null}
      </div>` : null}

      <!-- CLUBS -->
      ${!loading && tab === 'clubs' && !selTenantClub ? _h`<div>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style=${{ fontSize:16, fontWeight:800 }}>🏟️ Clubs</div>
          <button class="btn btn-primary" style=${{ fontSize:11 }} onClick=${() => setShowAddClub(true)}>+ Nouveau club</button>
        </div>

        ${showAddClub ? _h`<${AddClubForm}
          onSave=${(c) => { saveClub(c); setShowAddClub(false); }}
          onCancel=${() => setShowAddClub(false)} />` : null}

        ${clubs.length === 0 && !showAddClub ? _h`<div style=${{ textAlign:'center', padding:60, color:'rgba(255,255,255,.2)' }}>
          <div style=${{ fontSize:40, marginBottom:12 }}>🏟️</div>
          <div>Aucun club — clique "+ Nouveau club" pour commencer</div>
        </div>` : null}

        ${clubs.map(c => _h`<div key=${c.id} onClick=${() => setSelTenantClub(c)}
          style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:12, padding:'16px', marginBottom:8, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style=${{ fontSize:14, fontWeight:700 }}>${c.name}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4 }}>${c.niveau||''} · ${(tenantDb.playersPerso||[]).filter(p=>p.clubId===c.id).length} joueurs</div>
          </div>
          <span style=${{ color:'rgba(255,255,255,.3)' }}>→</span>
        </div>`)}
      </div>` : null}

      <!-- DETAIL CLUB (effectif + planification) -->
      ${!loading && tab === 'clubs' && selTenantClub ? (() => {
        const clubPlayers = (tenantDb.playersPerso||[]).filter(p => p.clubId === selTenantClub.id);
        const unassigned = (tenantDb.playersPerso||[]).filter(p => p.clubId !== selTenantClub.id);
        return _h`<div>
          <button onClick=${() => setSelTenantClub(null)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:12, cursor:'pointer', marginBottom:12 }}>← Retour aux clubs</button>
          <div style=${{ fontSize:20, fontWeight:800, marginBottom:2 }}>${selTenantClub.name}</div>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:20 }}>${selTenantClub.niveau||''} · ${clubPlayers.length} joueurs</div>

          <!-- Effectif -->
          <div style=${{ fontSize:14, fontWeight:700, marginBottom:10 }}>👥 Effectif</div>
          ${clubPlayers.length === 0 ? _h`<div style=${{ color:'rgba(255,255,255,.25)', fontSize:12, marginBottom:14 }}>Aucun joueur assigné à ce club.</div>`
            : _h`<div style=${{ marginBottom:14 }}>
              ${clubPlayers.map(p => _h`<div key=${p.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 12px', marginBottom:6 }}>
                <span style=${{ fontSize:12 }}>${p.name}</span>
                <button onClick=${() => savePlayer({...p, clubId: null})}
                  style=${{ background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.25)', color:'#FF4455', borderRadius:6, padding:'3px 8px', fontSize:10, cursor:'pointer' }}>Retirer</button>
              </div>`)}
            </div>`}
          ${unassigned.length > 0 ? _h`<div style=${{ marginBottom:20 }}>
            <select class="inp" style=${{ maxWidth:280 }} value="" onChange=${e => { if(e.target.value) savePlayer({...(unassigned.find(p=>p.id===e.target.value)), clubId: selTenantClub.id}); }}>
              <option value="">+ Ajouter un joueur au club...</option>
              ${unassigned.map(p => _h`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
            </select>
          </div>` : null}

          <!-- Charge d'entraînement -->
          <div style=${{ fontSize:14, fontWeight:700, marginBottom:10, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:18 }}>📊 Charge d'entraînement</div>
          <div style=${{ marginBottom:6 }}>
            ${React.createElement(ChargeDashboard, { players: clubPlayers, clubs: [selTenantClub] })}
          </div>

          <!-- Planification générique -->
          <div style=${{ fontSize:14, fontWeight:700, marginBottom:10, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:18 }}>📅 Planification du club</div>
          ${React.createElement(PlanifSaison, { player: null, club: selTenantClub, db: { clubPlanif: tenantDb.clubPlanif || {} } })}
          <details style=${{ marginTop:16 }}>
            <summary style=${{ fontSize:13, color:'#000', cursor:'pointer', padding:'12px 16px', fontWeight:800, background:'#FFA420', borderRadius:10, listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>✏️ Modifier le planning du club (assigner les cycles par semaine) <span>▾</span></summary>
            <div style=${{ marginTop:12 }}>
              ${React.createElement(PlanifClubView, {
                club: selTenantClub, players: clubPlayers, readOnly: false,
                clubPlanifOverride: (tenantDb.clubPlanif && tenantDb.clubPlanif[selTenantClub.id]) || null,
                onSaveOverride: (data) => {
                  window.__perfhand_db.ref('tenants/' + tenantId + '/clubPlanif/' + selTenantClub.id).set(data);
                  setTenantDb(d => ({ ...d, clubPlanif: { ...(d.clubPlanif||{}), [selTenantClub.id]: data } }));
                }
              })}
            </div>
          </details>
        </div>`;
      })() : null}

      <!-- SETTINGS -->
      ${!loading && tab === 'settings' ? _h`<div>
        <div style=${{ fontSize:16, fontWeight:800, marginBottom:16 }}>⚙️ Paramètres</div>
        <div style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:12, padding:'20px' }}>
          ${!editSettings ? _h`<div>
            <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.8, marginBottom:14 }}>
              <div><span style=${{ color:'rgba(255,255,255,.4)' }}>Email : </span>${tenantDb.email || tenant.email}</div>
              <div><span style=${{ color:'rgba(255,255,255,.4)' }}>Structure : </span>${tenantDb.structure || tenant.structure || '—'}</div>
              <div><span style=${{ color:'rgba(255,255,255,.4)' }}>Sport : </span>${tenantDb.sport || tenant.sport || '—'}</div>
              <div><span style=${{ color:'rgba(255,255,255,.4)' }}>Inscrit le : </span>${tenantDb.dateCreation || tenant.dateCreation || '—'}</div>
              <div><span style=${{ color:'rgba(255,255,255,.4)' }}>ID tenant : </span><code style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>${tenantId}</code></div>
            </div>
            <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}
              onClick=${() => setEditSettings({
                structure: tenantDb.structure || tenant.structure || '',
                sport: tenantDb.sport || tenant.sport || ''
              })}>✏️ Modifier</button>
          </div>` : _h`<div>
            <div style=${{ marginBottom:12 }}>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:4 }}>Structure</div>
              <input class="inp" value=${editSettings.structure} onInput=${e=>setEditSettings(s=>({...s, structure:e.target.value}))} placeholder="Ex: Coaching indépendant, Club XYZ..."/>
            </div>
            <div style=${{ marginBottom:16 }}>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:4 }}>Sport</div>
              <input class="inp" value=${editSettings.sport} onInput=${e=>setEditSettings(s=>({...s, sport:e.target.value}))} placeholder="Ex: Handball, Football..."/>
            </div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', marginBottom:16 }}>L'email et l'ID tenant ne sont pas modifiables ici (liés à la connexion).</div>
            <div style=${{ display:'flex', gap:8 }}>
              <button class="btn btn-sm" style=${{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
                onClick=${() => setEditSettings(null)}>Annuler</button>
              <button class="btn btn-sm btn-primary"
                onClick=${() => {
                  const updates = { structure: editSettings.structure, sport: editSettings.sport };
                  window.__perfhand_db.ref('tenants/' + tenantId).update(updates);
                  setTenantDb(d => ({ ...d, ...updates }));
                  setEditSettings(null);
                }}>✓ Enregistrer</button>
            </div>
          </div>`}
        </div>
      </div>` : null}
    </div>
  </div>`;
}

// ── SOUS-COMPOSANTS TENANT ─────────────────────────────────────────────────────
function AddPlayerForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', email:'', sport:'Handball', poste:'', objectif:'', password:'' });
  const [err, setErr] = useState('');
  function upd(k, v) { setForm(f => ({...f, [k]:v})); }
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setErr('Nom et email obligatoires'); return; }
    const email = form.email.trim().toLowerCase();
    const password = (form.password || '').trim();
    // Le compte de connexion est créé ici ; le mot de passe n'est affiché qu'une fois, jamais enregistré.
    let info = '';
    if (password) {
      setBusy(true);
      const r = await creerCompteConnexion(email, password);
      setBusy(false);
      info = r.ok
        ? (r.existait ? 'Un compte de connexion existait déjà pour ' + email + ' (mot de passe inchangé).'
                      : 'Compte de connexion créé.\n\nEmail : ' + email + '\nMot de passe : ' + password + '\n\nNote-le et transmets-le au joueur : il ne sera plus affiché.')
        : 'Profil créé, mais le compte de connexion n\'a pas pu être créé (' + r.msg + ').\nUtilise « Envoyer email mot de passe » ou crée-le dans la console Firebase.';
    }
    onSave({ ...sansMdp(form), email, id:'perso_'+Date.now(), dateCreation: new Date().toISOString().split('T')[0], muscuSeances:[], enduranceSeances:[], status:'ok' });
    if (info) alert(info);
  }
  return _h`<div style=${{ background:'#1A1A1A', border:'1px solid #333', borderRadius:12, padding:'20px', marginBottom:16 }}>
    <div style=${{ fontSize:13, fontWeight:700, marginBottom:14, color:'#FFA420' }}>Nouveau joueur</div>
    <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
      <div><div class="inp-label">Nom complet *</div><input class="inp" value=${form.name} onInput=${e=>upd('name',e.target.value)} placeholder="Prénom Nom" /></div>
      <div><div class="inp-label">Email *</div><input class="inp" type="email" value=${form.email} onInput=${e=>upd('email',e.target.value)} placeholder="joueur@email.fr" /></div>
      <div><div class="inp-label">Sport</div>
        <select class="inp" value=${form.sport} onChange=${e=>upd('sport',e.target.value)}>
          ${['Handball','Football','Basketball','Rugby','Tennis','Natation','Athlétisme','Autre'].map(s=>_h`<option key=${s}>${s}</option>`)}
        </select>
      </div>
      <div><div class="inp-label">Poste</div><input class="inp" value=${form.poste} onInput=${e=>upd('poste',e.target.value)} placeholder="Ex : Ailier, Pivot..." /></div>
      <div style=${{ gridColumn:'1/-1' }}><div class="inp-label">Objectif principal</div><input class="inp" value=${form.objectif} onInput=${e=>upd('objectif',e.target.value)} placeholder="Ex : Reprendre la compétition après blessure" /></div>
      <div><div class="inp-label">Mot de passe joueur</div><input class="inp" type="text" value=${form.password} onInput=${e=>upd('password',e.target.value)} placeholder="Pour Firebase Auth" /></div>
    </div>
    ${err ? _h`<div style=${{ color:'#FF4455', fontSize:11, marginBottom:8 }}>${err}</div>` : null}
    <div style=${{ display:'flex', gap:8 }}>
      <button class="btn btn-primary" onClick=${submit} disabled=${busy}>${busy ? 'Création…' : 'Créer le joueur'}</button>
      <button class="btn" onClick=${onCancel}>Annuler</button>
    </div>
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', marginTop:12 }}>
      Si tu renseignes un mot de passe, le compte de connexion est créé automatiquement (6 caractères minimum). Il n'est affiché qu'une fois et jamais enregistré.
    </div>
  </div>`;
}

function AddClubForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', niveau:'', sport:'Handball' });
  function upd(k,v) { setForm(f=>({...f,[k]:v})); }
  function submit() {
    if (!form.name.trim()) return;
    onSave({ ...form, id:'club_'+Date.now(), players:[], dateCreation: new Date().toISOString().split('T')[0] });
  }
  return _h`<div style=${{ background:'#1A1A1A', border:'1px solid #333', borderRadius:12, padding:'20px', marginBottom:16 }}>
    <div style=${{ fontSize:13, fontWeight:700, marginBottom:14, color:'#FFA420' }}>Nouveau club</div>
    <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
      <div><div class="inp-label">Nom du club *</div><input class="inp" value=${form.name} onInput=${e=>upd('name',e.target.value)} placeholder="Ex : USM Handball" /></div>
      <div><div class="inp-label">Niveau</div><input class="inp" value=${form.niveau} onInput=${e=>upd('niveau',e.target.value)} placeholder="Ex : Nationale 1, Pro D2..." /></div>
      <div><div class="inp-label">Sport</div>
        <select class="inp" value=${form.sport} onChange=${e=>upd('sport',e.target.value)}>
          ${['Handball','Football','Basketball','Rugby','Tennis','Autre'].map(s=>_h`<option key=${s}>${s}</option>`)}
        </select>
      </div>
    </div>
    <div style=${{ display:'flex', gap:8 }}>
      <button class="btn btn-primary" onClick=${submit}>Créer le club</button>
      <button class="btn" onClick=${onCancel}>Annuler</button>
    </div>
  </div>`;
}

function PlayerInfoTab({ player, onSave }) {
  const [form, setForm] = useState({ name:player.name||'', email:player.email||'', sport:player.sport||'', poste:player.poste||'', objectif:player.objectif||'', poids:player.poids||'', taille:player.taille||'', age:player.age||'' });
  function upd(k,v) { setForm(f=>({...f,[k]:v})); }
  return _h`<div style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:12, padding:'20px' }}>
    <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
      <div><div class="inp-label">Nom</div><input class="inp" value=${form.name} onInput=${e=>upd('name',e.target.value)} /></div>
      <div><div class="inp-label">Email</div><input class="inp" value=${form.email} onInput=${e=>upd('email',e.target.value)} /></div>
      <div><div class="inp-label">Sport</div><input class="inp" value=${form.sport} onInput=${e=>upd('sport',e.target.value)} /></div>
      <div><div class="inp-label">Poste</div><input class="inp" value=${form.poste} onInput=${e=>upd('poste',e.target.value)} /></div>
      <div><div class="inp-label">Âge</div><input class="inp" type="number" value=${form.age} onInput=${e=>upd('age',e.target.value)} /></div>
      <div><div class="inp-label">Poids (kg)</div><input class="inp" type="number" value=${form.poids} onInput=${e=>upd('poids',e.target.value)} /></div>
      <div><div class="inp-label">Taille (cm)</div><input class="inp" type="number" value=${form.taille} onInput=${e=>upd('taille',e.target.value)} /></div>
      <div style=${{ gridColumn:'1/-1' }}><div class="inp-label">Objectif</div><input class="inp" value=${form.objectif} onInput=${e=>upd('objectif',e.target.value)} /></div>
    </div>
    <button class="btn btn-primary" onClick=${() => onSave({...player,...form})}>Enregistrer</button>
  </div>`;
}

function PlayerMuscuTab({ player, onAddSeance, onDeleteSeance, onUpdateSeance }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom:'', datePrevu:'', rpeCible:'', contexte:'', notes:'' });
  const seances = player.muscuSeances || [];
  const today = new Date().toISOString().split('T')[0];
  const faites = seances.filter(s => s.dateFaite);
  const aFaire = seances.filter(s => !s.dateFaite && s.datePrevu >= today).sort((a,b)=>a.datePrevu>b.datePrevu?1:-1);
  const aRattraper = seances.filter(s => !s.dateFaite && s.datePrevu < today).sort((a,b)=>a.datePrevu>b.datePrevu?-1:1);

  function upd(k,v) { setForm(f=>({...f,[k]:v})); }
  function submit() {
    if (!form.nom.trim()) return;
    onAddSeance({ nom:form.nom, datePrevu:form.datePrevu, rpeCible:form.rpeCible ? Number(form.rpeCible) : null, contexte:form.contexte, notes:form.notes, exercices:[] });
    setForm({ nom:'', datePrevu:'', rpeCible:'', contexte:'', notes:'' });
    setShowForm(false);
  }

  return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>${seances.length} séances · ${faites.length} faites</div>
      <button class="btn btn-primary" style=${{ fontSize:11 }} onClick=${() => setShowForm(!showForm)}>
        ${showForm ? 'Annuler' : '+ Nouvelle séance'}
      </button>
    </div>

    ${showForm ? _h`<div style=${{ background:'#1A1A1A', border:'1px solid #333', borderRadius:12, padding:'16px', marginBottom:14 }}>
      <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
        <div style=${{ gridColumn:'1/-1' }}><div class="inp-label">Nom de la séance *</div><input class="inp" value=${form.nom} onInput=${e=>upd('nom',e.target.value)} placeholder="Ex : Séance 5/3/1 Wendler (S4)" /></div>
        <div><div class="inp-label">Date prévue</div><input class="inp" type="date" value=${form.datePrevu} onInput=${e=>upd('datePrevu',e.target.value)} /></div>
        <div><div class="inp-label">RPE cible (1-10)</div><input class="inp" type="number" min="1" max="10" value=${form.rpeCible} onInput=${e=>upd('rpeCible',e.target.value)} /></div>
        <div><div class="inp-label">Contexte / méthode</div><input class="inp" value=${form.contexte} onInput=${e=>upd('contexte',e.target.value)} placeholder="Ex : 5/3/1 Wendler" /></div>
        <div><div class="inp-label">Notes coach</div><input class="inp" value=${form.notes} onInput=${e=>upd('notes',e.target.value)} placeholder="Consignes..." /></div>
      </div>
      <button class="btn btn-primary" onClick=${submit}>Créer la séance</button>
    </div>` : null}

    ${aRattraper.length > 0 ? _h`<div style=${{ marginBottom:12 }}>
      <div style=${{ fontSize:10, fontWeight:800, color:'#FF7A00', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>⚠ À rattraper (${aRattraper.length})</div>
      ${aRattraper.map(s => _h`<div key=${s.id} style=${{ background:'rgba(255,122,0,.05)', border:'1px solid rgba(255,122,0,.15)', borderRadius:10, padding:'10px 14px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style=${{ fontSize:12, fontWeight:600 }}>${s.nom}</div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Prévue le ${s.datePrevu} · RPE cible : ${s.rpeCible||'—'}/10</div>
        </div>
        <div style=${{ display:'flex', gap:4 }}>
          <input type="date" value=${s.datePrevu||''} onChange=${e => onUpdateSeance(s.id, { datePrevu: e.target.value })}
            style=${{ background:'#222', border:'1px solid #444', borderRadius:6, color:'#fff', fontSize:10, padding:'3px 6px', cursor:'pointer' }} />
          <button onClick=${() => { if(confirm('Supprimer ?')) onDeleteSeance(s.id); }}
            style=${{ background:'rgba(255,68,85,.1)', border:'none', color:'#FF4455', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:10 }}>✕</button>
        </div>
      </div>`)}
    </div>` : null}

    ${aFaire.length > 0 ? _h`<div style=${{ marginBottom:12 }}>
      <div style=${{ fontSize:10, fontWeight:800, color:'#FFA420', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>À venir (${aFaire.length})</div>
      ${aFaire.map(s => _h`<div key=${s.id} style=${{ background:'rgba(255,164,32,.04)', border:'1px solid rgba(255,164,32,.12)', borderRadius:10, padding:'10px 14px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style=${{ fontSize:12, fontWeight:600 }}>${s.nom}</div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${s.datePrevu} · RPE cible : ${s.rpeCible||'—'}/10</div>
        </div>
        <div style=${{ display:'flex', gap:4 }}>
          <input type="date" value=${s.datePrevu||''} onChange=${e => onUpdateSeance(s.id, { datePrevu: e.target.value })}
            style=${{ background:'#222', border:'1px solid #444', borderRadius:6, color:'#fff', fontSize:10, padding:'3px 6px', cursor:'pointer' }} />
          <button onClick=${() => { if(confirm('Supprimer ?')) onDeleteSeance(s.id); }}
            style=${{ background:'rgba(255,68,85,.1)', border:'none', color:'#FF4455', borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:10 }}>✕</button>
        </div>
      </div>`)}
    </div>` : null}

    ${faites.length > 0 ? _h`<div>
      <div style=${{ fontSize:10, fontWeight:800, color:'#4CAF50', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>✓ Historique (${faites.length})</div>
      ${faites.slice().reverse().map(s => _h`<div key=${s.id} style=${{ background:'rgba(76,175,80,.03)', border:'1px solid rgba(76,175,80,.12)', borderRadius:10, padding:'10px 14px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style=${{ fontSize:12, fontWeight:600 }}>${s.nom}</div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Faite le ${s.dateFaite} · RPE réel : ${s.rpeReel||'—'}/10</div>
        </div>
        <div style=${{ fontSize:10, color:'#4CAF50' }}>✓</div>
      </div>`)}
    </div>` : null}

    ${seances.length === 0 && !showForm ? _h`<div style=${{ textAlign:'center', padding:40, color:'rgba(255,255,255,.2)', fontSize:12 }}>
      Aucune séance — clique "+ Nouvelle séance" pour commencer
    </div>` : null}
  </div>`;
}
