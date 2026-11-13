
function PersoPlayerView() {
  const { user, db, setDb, logout } = useApp();
  const [fbPlayer, setFbPlayer] = React.useState(null);

  // Load player directly from Firebase if not in React state yet
  React.useEffect(() => {
    if (!user || !user.playerId) return;
    if ((db.playersPerso || []).find(p => p.id === user.playerId)) return;
    if (!window.__perfhand_db) return;
    window.__perfhand_db.ref('perfhand/playersPerso/' + user.playerId).once('value').then(snap => {
      const data = snap.val();
      if (data) {
        setFbPlayer(data);
        setDb(d => ({
          ...d,
          playersPerso: [...(d.playersPerso||[]).filter(p => p.id !== data.id), data]
        }));
      }
    });
  }, [(user||{}).playerId]);

  // Try React state first, then Firebase direct, then localStorage
  let player = (db.playersPerso || []).find(p => p.id === user.playerId) || fbPlayer;
  if (!player) {
    try {
      const raw = localStorage.getItem('perfhand_db_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        player = (parsed.playersPerso || []).find(p => p.id === user.playerId);
      }
    } catch(e) {}
  }
  const [tab, setTab] = useState('accueil');
  const [showTerms, setShowTerms] = useState(false);
  const [showWellness, setShowWellness] = useState(false);
  const [wellnessDone, setWellnessDone] = useState(false);
  const showWellnessRef = React.useRef(false);
  function triggerWellness() {
    showWellnessRef.current = true;
    setShowWellness(true);
  }

  // Vérifier au chargement si une séance récente n'a pas de wellness
  React.useEffect(() => {
    if (!player) return;
    const today = localDateStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);

    // Chercher séance muscu validée aujourd'hui ou hier sans wellness
    const muscuSansWellness = (player.muscuSeances||[]).find(s =>
      s.dateFaite && (s.dateFaite === today || s.dateFaite === yesterday) && !s.wellness
    );
    // Chercher séance endurance validée aujourd'hui ou hier sans wellness
    const endurSansWellness = (player.enduranceSeances||[]).find(s =>
      s.dateFaite && (s.dateFaite === today || s.dateFaite === yesterday) && !s.wellness
    );

    if (muscuSansWellness || endurSansWellness) {
      // Délai pour laisser l'app se charger
      const t = setTimeout(() => triggerWellness(), 1500);
      return () => clearTimeout(t);
    }
  }, [player?.id]);

  if (!player) return _h`<div style=${{ padding:40, color:'#fff', textAlign:'center' }}>
    <div style=${{ fontSize:16, marginBottom:8 }}>Profil introuvable</div>
    <button class="btn" onClick=${logout}>Retour</button>
  </div>`;

  const sc = { ok:'#4CAF50', blesse:'#FF4455', surveille:'#FF7A00', repos:'#FFB800' }[player.status] || '#4CAF50';

  function savePlayer(updates) {
    setDb(d => ({ ...d, playersPerso: (d.playersPerso||[]).map(p =>
      p.id === player.id ? { ...p, ...updates } : p
    )}));
  }

  function setDbPerso(fn) {
    setDb(d => {
      const fakeDb = { ...d, players: d.playersPerso || [] };
      const next = typeof fn === 'function' ? fn(fakeDb) : fn;
      return { ...d, playersPerso: next.players || [] };
    });
  }

  const TABS = [
    { id:'accueil',      label:'Accueil',    icon:'🏠' },
    { id:'planif',       label:'Planif',     icon:'📅' },
    { id:'nutrition',    label:'Nutrition',  icon:'🥗' },
    { id:'musculation',  label:'Muscu',      icon:'🏋' },
    { id:'protocole',    label:'Protocole',  icon:'📋' },
    { id:'endurance',    label:'Endurance',  icon:'🏃' },
    { id:'bilan',        label:'Bilan',      icon:'📊' },
    { id:'blessures',    label:'Blessures',  icon:'🩺' },
    { id:'mental',       label:'Mental',     icon:'🧠' },
    { id:'tactique',     label:'Tactique',   icon:'🎯' },
    { id:'bibliotheque', label:'Biblio',     icon:'📚' },
    { id:'ressources',   label:'Docs',       icon:'📂' },
    { id:'gps',          label:'GPS',         icon:'📍' },
  ];

  return _h`<div style=${{ minHeight:'100vh', background:'#080A0E', color:'#fff' }}>
    <!-- Topbar -->
    <div class="topbar">
      <div class="logo" style=${{ fontSize:17 }}><span>PERF</span>HAND</div>
      <div style=${{ flex:1, textAlign:'center', fontSize:11, color:'rgba(255,255,255,.35)' }}>Suivi individuel</div>
      <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
        <div style=${{ width:28, height:28, borderRadius:'50%', background:sc+'22', border:'2px solid '+sc+'55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:sc }}>
          ${player.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <button onClick=${() => setShowTerms(true)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.2)', fontSize:11, cursor:'pointer' }}>CGU</button>
        <button class="btn btn-sm btn-danger" onClick=${logout}>Deco</button>
      </div>
    </div>

    <!-- Header joueur -->
    <div style=${{ background:'linear-gradient(135deg, rgba(56,189,248,.08), transparent)', borderBottom:'1px solid rgba(255,255,255,.05)', padding:'18px 18px 14px' }}>
      <div style=${{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
        <div style=${{ width:50, height:50, borderRadius:'50%', background:sc+'22', border:'2px solid '+sc+'55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:sc, fontFamily:"'Barlow Condensed',sans-serif", flexShrink:0 }}>
          ${player.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style=${{ fontSize:22, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${player.name}</div>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:5 }}>${player.sport||'Handball'}${player.poste?' · '+player.poste:''}</div>
          <span style=${{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:700, background:sc+'18', color:sc }}>
            ${{ ok:'Disponible', blesse:'Blessé', surveille:'Surveillance', repos:'Repos' }[player.status]||'Disponible'}
          </span>
        </div>
      </div>
      ${player.objectif ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.15)', borderRadius:9, padding:'8px 12px', fontStyle:'italic' }}>🎯 ${player.objectif}</div>` : null}
    </div>

    <!-- Tab bar -->
    <div class="tab-bar" style=${{ overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch', display:'flex', gap:0 }}>
      ${TABS.map(t => _h`<button key=${t.id}
        class=${'tab-btn'+(tab===t.id?' active':'')}
        onClick=${() => setTab(t.id)}
        style=${{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 10px', fontSize:9, minWidth:52 }}>
        <span style=${{ fontSize:18, lineHeight:1 }}>${t.icon}</span>
        <span>${t.label}</span>
      </button>`)}
    </div>

    <!-- Content -->
    <div style=${{ padding:'16px 16px 100px', maxWidth:680, margin:'0 auto' }}>

      ${tab === 'accueil' && _h`<div>
        <!-- Séance(s) du jour — accès direct sans avoir à aller chercher dans Muscu/Endurance -->
        ${(() => {
          const today = new Date().toISOString().split('T')[0];
          const muscuToday = (player.muscuSeances || []).find(s => s.datePrevu === today && !s.dateFaite);
          const enduToday = (player.enduranceSeances || []).find(s => s.datePrevu === today && !s.dateFaite);
          if (!muscuToday && !enduToday) return null;
          return _h`<div class="card" style=${{ marginBottom:14, background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)' }}>
            <div style=${{ fontSize:11, fontWeight:800, color:'#FFA420', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>⚡ Séance(s) du jour</div>
            <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
              ${muscuToday ? _h`<div onClick=${() => setTab('musculation')} style=${{ cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:10 }}>
                <div>
                  <div style=${{ fontSize:13, fontWeight:700 }}>🏋️ ${muscuToday.nom || 'Musculation'}</div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${(muscuToday.exercices||[]).length} exercices</div>
                </div>
                <span style=${{ fontSize:11, color:'#FFA420', fontWeight:700 }}>Voir →</span>
              </div>` : null}
              ${enduToday ? _h`<div onClick=${() => setTab('endurance')} style=${{ cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:10 }}>
                <div>
                  <div style=${{ fontSize:13, fontWeight:700 }}>🏃 ${enduToday.nom || 'Endurance'}</div>
                  ${(() => {
                    const repsM = (enduToday.notes||'').match(/(\d+(?:-\d+)?)\s*reps?\b/i);
                    if (repsM && enduToday.distance) return _h`<div style=${{ fontSize:10, color:'#7C6FFF', fontWeight:700 }}>${repsM[1]}× ${enduToday.distance}${enduToday.recup ? ' / '+enduToday.recup : ''}</div>`;
                    if (enduToday.distance && /@/.test(enduToday.distance)) return _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${enduToday.distance}${enduToday.recup ? ' / '+enduToday.recup : ''}</div>`;
                    return enduToday.duree ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${enduToday.duree} min${enduToday.distance ? ' · '+enduToday.distance : ''}</div>` : null;
                  })()}
                </div>
                <span style=${{ fontSize:11, color:'#FFA420', fontWeight:700 }}>Voir →</span>
              </div>` : null}
            </div>
          </div>`;
        })()}

        <!-- Alerte séances en retard non validées -->
        ${(() => {
          const today = new Date().toISOString().split('T')[0];
          const muscuRetard = (player.muscuSeances || []).filter(s => s.datePrevu && s.datePrevu < today && !s.dateFaite);
          const enduRetard = (player.enduranceSeances || []).filter(s => s.datePrevu && s.datePrevu < today && !s.dateFaite);
          const total = muscuRetard.length + enduRetard.length;
          if (total === 0) return null;
          return _h`<div class="card" style=${{ marginBottom:14, background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.3)' }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style=${{ fontSize:16 }}>⚠️</span>
              <div style=${{ fontSize:12, fontWeight:800, color:'#FF4455' }}>${total} séance${total>1?'s':''} en retard, pas encore validée${total>1?'s':''}</div>
            </div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:10, lineHeight:1.5 }}>Si tu les as faites, pense à les valider — ça permet à ton coach de suivre ta charge d'entraînement correctement.</div>
            <div style=${{ display:'flex', gap:8 }}>
              ${muscuRetard.length > 0 ? _h`<button class="btn btn-sm" style=${{ flex:1, background:'rgba(255,68,85,.15)', border:'1px solid rgba(255,68,85,.4)', color:'#FF4455', fontWeight:700 }}
                onClick=${() => setTab('musculation')}>🏋️ ${muscuRetard.length} muscu</button>` : null}
              ${enduRetard.length > 0 ? _h`<button class="btn btn-sm" style=${{ flex:1, background:'rgba(255,68,85,.15)', border:'1px solid rgba(255,68,85,.4)', color:'#FF4455', fontWeight:700 }}
                onClick=${() => setTab('endurance')}>🏃 ${enduRetard.length} endurance</button>` : null}
            </div>
          </div>`;
        })()}

        ${React.createElement(ProgrammeJour, { player: player })}
        <div class="card" style=${{ marginTop:14 }}>
          <div style=${{ fontSize:11, fontWeight:700, color:'#38BDF8', marginBottom:8 }}>Mon profil</div>
          <div class="grid-2">
            ${[['Sport',player.sport||'Handball'],['Poste',player.poste||'—'],['Age',player.age?player.age+' ans':'—'],['Poids',player.poids?player.poids+' kg':'—']].map(([l,v]) => _h`<div key=${l} style=${{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${l}</span>
              <span style=${{ fontSize:11, fontWeight:600 }}>${v}</span>
            </div>`)}
          </div>
        </div>
      </div>`}

      ${tab === 'planif' && React.createElement(PersoPlanifView, { player: player, setDb: setDbPerso, isCoach: false })}
      ${tab === 'nutrition' && _h`<${NutritionView} player=${player} db=${{ players: [player] }} setDb=${setDbPerso} isCoach=${false} />`}
      ${tab === 'musculation' && React.createElement(MuscuView, {
        player,
        setDb: (fn) => {
          setDb(d => {
            const next = typeof fn === 'function' ? fn(d) : fn;
            const merged = { ...d };
            // Sync muscuSeances back to playersPerso
            if (next.playersPerso) merged.playersPerso = next.playersPerso;
            if (next.playerProfiles) {
              // Extract the updated player and sync to playersPerso too
              const updatedProfile = next.playerProfiles.find(p => p.id === player.id);
              if (updatedProfile && updatedProfile.muscuSeances) {
                merged.playersPerso = (d.playersPerso||[]).map(p =>
                  p.id === player.id ? { ...p, muscuSeances: updatedProfile.muscuSeances } : p
                );
              }
              merged.playerProfiles = next.playerProfiles;
            }
            return merged;
          });
        },
        isCoach: false,
        db,
        onSeanceDone: () => { setTimeout(() => triggerWellness(), 100); }
      })}
      ${tab === 'protocole' && _h`<div>
        ${(player.protocol && player.protocol.length > 0) ? player.protocol.map((bloc, bi) => _h`<div key=${bi} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'16px 18px', marginBottom:12 }}>
          <div style=${{ fontSize:14, fontWeight:700, marginBottom:10 }}>${bloc.nom}</div>
          ${(bloc.exercices||[]).map((ex,ei) => _h`<div key=${ei} style=${{ padding:'10px 0', borderTop: ei>0?'1px solid rgba(255,255,255,.06)':'none' }}>
            <div style=${{ fontSize:13, fontWeight:600 }}>${ex.nom}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:3 }}>${[ex.reps, ex.charge, ex.repos].filter(Boolean).join(' · ')}</div>
            ${ex.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:5, lineHeight:1.5 }}>💡 ${ex.notes}</div>` : null}
            ${ex.progression ? _h`<div style=${{ fontSize:11, color:'#FFA420', marginTop:4, lineHeight:1.5 }}>📈 ${ex.progression}</div>` : null}
          </div>`)}
        </div>`) : _h`<div style=${{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,.3)' }}>
          <div style=${{ fontSize:32, marginBottom:10 }}>📋</div>
          Aucun protocole assigné pour le moment.
        </div>`}
      </div>`}
      ${tab === 'bilan'       && _h`<${SuiviChargeView} player=${player} setDb=${setDbPerso} isCoach=${false} />`}
      ${tab === 'endurance' && React.createElement(EnduranceView, {
        player,
        setDb: (fn) => {
          setDb(d => {
            const next = typeof fn === 'function' ? fn(d) : fn;
            const merged = { ...d };
            if (next.playersPerso) merged.playersPerso = next.playersPerso;
            if (next.playerProfiles) {
              const updatedProfile = next.playerProfiles.find(p => p.id === player.id);
              if (updatedProfile && updatedProfile.enduranceSeances) {
                merged.playersPerso = (d.playersPerso||[]).map(p =>
                  p.id === player.id ? { ...p, enduranceSeances: updatedProfile.enduranceSeances } : p
                );
              }
              merged.playerProfiles = next.playerProfiles;
            }
            return merged;
          });
        },
        isCoach: false,
        onSeanceDone: () => { setTimeout(() => triggerWellness(), 100); }
      })}
      ${
      tab === 'blessures'   && _h`<div>
        ${(!player.blessures || player.blessures.length === 0)
          ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.2)' }}>Aucune blessure enregistrée</div>`
          : player.blessures.map((b, i) => {
            const sC = b.statut==='en cours'?'#FF4455':b.statut==='surveillance'?'#FF7A00':'#4CAF50';
            return _h`<div key=${i} style=${{ background:sC+'06', border:'1px solid '+sC+'20', borderRadius:13, padding:'13px 16px', marginBottom:9 }}>
              <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div><div style=${{ fontSize:14, fontWeight:700 }}>${b.zone}</div><div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>${b.type}</div></div>
                <div style=${{ fontSize:11, padding:'3px 9px', borderRadius:20, fontWeight:700, background:sC+'15', color:sC }}>${b.statut.toUpperCase()}</div>
              </div>
              ${b.protocole ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.6)', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 10px' }}>${b.protocole}</div>` : null}
            </div>`;
          })
        }
      </div>`}
      ${tab === 'mental' && _h`<div class="grid-2">
        ${[['Stress',player.stress||2,player.stress>=4?'#FF4455':player.stress>=3?'#FFB800':'#FFA420'],
           ['Motivation',player.motivation||4,player.motivation<=2?'#FF4455':'#FFA420'],
           ['Focus',player.focus||3,player.focus<=2?'#FF4455':'#FFA420'],
           ['Confiance',player.confiance||3,player.confiance<=2?'#FF4455':'#FFA420']].map(([l,v,c]) =>
          _h`<div key=${l} class="card">
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:4 }}>${l}</div>
            <div style=${{ fontSize:30, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}<span style=${{ fontSize:12, opacity:.4 }}>/5</span></div>
            <div class="progress-bar"><div class="pf" style=${{ width:(v/5*100)+'%', background:c }}></div></div>
          </div>`
        )}
      </div>`}

      <!-- Bibliothèque (lecture seule) -->
      ${tab === 'tactique' && _h`<div>
        ${React.createElement(TactiqueView, { db, setDb, clubs: [], clubId: '', canEdit: false, auteur: '', joueur: player, soloGeneral: true })}
      </div>`}
      ${tab === 'bibliotheque' && _h`<div>
        ${React.createElement(BibliothequeView, { db, setDb: () => {}, readOnly: true })}
      </div>`}

      <!-- Ressources assignées par le coach -->
      ${tab === 'gps' && React.createElement(DonneesGPSView, { player, setDb: setDbPerso })}
      ${tab === 'ressources' && _h`<div style=${{ padding:'4px 0' }}>
        <div style=${{ fontSize:18, fontWeight:800, marginBottom:4 }}>📂 Mes ressources</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:16 }}>Documents assignés par ton coach</div>
        ${(() => {
          const ALL_RESSOURCES = [
            { id:'r1', titre:'Guide Complet — Prévention & Blessures Handball', description:'Analyse biomécanique, épidémiologie et protocoles de prévention.', url:'https://drive.google.com/file/d/1eSAX84tDahnPkw3dW24Jw_JBMKSexC8h/preview', categorie:'Guide', icon:'📖', color:'#FF7A00' },
            { id:'r2', titre:'Protocoles Prévention Blessures', description:'Cheville, genou, épaule — 5 exercices × 2 versions.', url:'https://drive.google.com/file/d/1O-Pz1A3ywTfsCs-tJjLlaQrFZTGasz2m/preview', categorie:'Protocole', icon:'📋', color:'#4CAF50' },
            { id:'r3', titre:'Protocole Épaule — Handball Élite', description:'12 semaines semi-pro/élite. 3 blocs : stabilisation, force, puissance.', url:'https://drive.google.com/file/d/1ACK2PDO1cDREAte7mLgl93Pk0786xjYB/preview', categorie:'Protocole', icon:'🦾', color:'#FF4455' },
            { id:'r4', titre:'Guide Mobilité Active au Handball', description:'Amplitude de force, prévention blessures & performance spécifique. 3 zones critiques + protocoles validés.', url:'https://drive.google.com/file/d/181OIWKQk1kSAysPur8_hEt_JurquDIVG/preview', categorie:'Guide', icon:'🤸', color:'#38BDF8' },
            { id:'r4', titre:'Guide Mobilité Active au Handball', description:'Amplitude de force, prévention des blessures & performance spécifique. Épaule, hanche, cheville + programme hebdomadaire.', url:'https://drive.google.com/file/d/181OIWKQk1kSAysPur8_hEt_JurquDIVG/preview', categorie:'Guide', icon:'🤸', color:'#7C6FFF' },
            { id:'r4', titre:'Guide Mobilité Active au Handball', description:'Amplitude de force, prévention des blessures & performance spécifique. Épaule, hanche, cheville/genou.', url:'https://drive.google.com/file/d/181OIWKQk1kSAysPur8_hEt_JurquDIVG/preview', categorie:'Guide', icon:'🤸', color:'#7C6FFF' },
            ...(db.ressourcesCustom || []),
          ];
          const assignees = player.ressourcesAssignees || [];
          const docs = assignees.length > 0
            ? ALL_RESSOURCES.filter(r => assignees.includes(r.id))
            : [];

          if (docs.length === 0) return _h`<div style=${{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
            <div style=${{ fontSize:28, marginBottom:8 }}>📂</div>
            <div>Aucune ressource assignée pour le moment.</div>
          </div>`;

          return _h`<div style=${{ display:'flex', flexDirection:'column', gap:10 }}>
            ${docs.map(r => _h`<div key=${r.id} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'14px 16px' }}>
              <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style=${{ fontSize:20 }}>${r.icon||'📄'}</span>
                <span style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:(r.color||'#FFA420')+'15', color:r.color||'#FFA420', fontWeight:700 }}>${r.categorie}</span>
              </div>
              <div style=${{ fontSize:13, fontWeight:800, marginBottom:5, lineHeight:1.4 }}>${r.titre}</div>
              <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.6, marginBottom:10 }}>${r.description}</div>
              ${r.url ? _h`<div>
                <div style=${{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                  <button onClick=${() => { const el = document.getElementById('pdf-p-'+r.id); el.style.display = el.style.display === 'none' ? 'block' : 'none'; }}
                    style=${{ padding:'8px 14px', borderRadius:9, border:'1px solid rgba(255,164,32,.3)', background:'rgba(255,164,32,.12)', color:'#FFA420', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                    📄 Voir le PDF
                  </button>
                  <a href=${r.url} target="_blank"
                    style=${{ padding:'8px 14px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:12, fontWeight:600, textDecoration:'none', display:'inline-block' }}>
                    ↗ Ouvrir
                  </a>
                </div>
                <div id=${'pdf-p-'+r.id} style=${{ display:'none', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,.1)' }}>
                  <iframe src=${r.url} style=${{ width:'100%', height:480, border:'none' }} allow="autoplay"></iframe>
                </div>
              </div>` : _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.2)', fontStyle:'italic' }}>Lien PDF à venir</div>`}
            </div>`)}
          </div>`;
        })()}
      </div>`}
    </div>

    <!-- Wellness -->
    ${player ? React.createElement(MessagesCoachDirect, { player }) : null}
    ${(showWellness || showWellnessRef.current) && _h`<${WellnessPopup}
      mode=${'bilan'}
      onClose=${() => { showWellnessRef.current = false; setShowWellness(false); }}
      onSubmit=${(data) => {
        setWellnessDone(true);
        notifWellness(player.name, data);
        showWellnessRef.current = false;
        setShowWellness(false);
        // Marquer la dernière séance non-wellness avec les données
        const today = localDateStr();
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
        const updMuscu = (player.muscuSeances||[]).map(s =>
          s.dateFaite && (s.dateFaite === today || s.dateFaite === yesterday) && !s.wellness
            ? { ...s, wellness: data } : s
        );
        const updEndur = (player.enduranceSeances||[]).map(s =>
          s.dateFaite && (s.dateFaite === today || s.dateFaite === yesterday) && !s.wellness
            ? { ...s, wellness: data } : s
        );
        setDb(d => ({
          ...d,
          playersPerso: (d.playersPerso||[]).map(p => p.id === player.id
            ? { ...p, muscuSeances: updMuscu, enduranceSeances: updEndur } : p)
        }));
        // muscuSeances/enduranceSeances sont des champs à "écriture dédiée" (voir FIELDS_ECRITURE_DEDIEE_PERSO
        // dans setDb) : le sync générique les ignore volontairement pour ne pas écraser les écritures
        // dédiées faites ailleurs. Sans cette écriture explicite ici, le wellness attaché à la séance ne
        // partait donc JAMAIS vers Firebase — au rechargement suivant, la séance réapparaissait sans
        // wellness et le questionnaire se redéclenchait, alors que le joueur l'avait déjà rempli.
        if (window.__perfhand_db && player.id) {
          try {
            let safeMuscu, safeEndur;
            try { safeMuscu = JSON.parse(JSON.stringify(updMuscu)); } catch(e) { safeMuscu = updMuscu; }
            try { safeEndur = JSON.parse(JSON.stringify(updEndur)); } catch(e) { safeEndur = updEndur; }
            window.__perfhand_db.ref('perfhand/playersPerso/' + player.id + '/muscuSeances').set(safeMuscu);
            window.__perfhand_db.ref('perfhand/playersPerso/' + player.id + '/enduranceSeances').set(safeEndur);
          } catch(e) { console.warn('[wellness bilan] sync error', e); }
        }
      }}
    />`}

    <!-- CGU -->
    ${showTerms && _h`<div class="modal-bg" onClick=${() => setShowTerms(false)}>
      <div class="modal" onClick=${e => e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between' }}>
          <div style=${{ fontSize:14, fontWeight:800 }}>Conditions d'utilisation</div>
          <button onClick=${() => setShowTerms(false)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:18, cursor:'pointer' }}>×</button>
        </div>
        <div style=${{ overflowY:'auto', padding:'16px 20px', fontSize:12, color:'rgba(255,255,255,.55)', lineHeight:1.9 }}>
          <p><b style=${{ color:'#FFA420' }}>Éditeur :</b> Activum — Léo Chabanis · SIRET 852 639 392</p>
          <p style=${{ marginTop:8 }}>Données traitées exclusivement à des fins de suivi sportif. Conformément au RGPD, droit d'accès et suppression sur demande à leo@perfhand.fr.</p>
        </div>
        <div style=${{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,.07)' }}>
          <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${() => setShowTerms(false)}>J'accepte</button>
        </div>
      </div>
    </div>`}

    <!-- Chat IA -->
    ${React.createElement(SharedChat, { role:'perso', player: player, playerName: player.name, playerPos: player.poste||'', playerAge: player.age||'', playerStatus: player.status||'ok' })}

    <!-- Mobile bottom nav -->
    <nav class="mobile-nav" style=${{ display:'none' }}>
      ${TABS.map(t => _h`<button key=${t.id}
        class=${'mobile-nav-btn'+(tab===t.id?' active':'')}
        onClick=${() => setTab(t.id)}>
        <span>${({'accueil':'🏠','planif':'📅','nutrition':'🥗','musculation':'🏋','bilan':'📊','blessures':'🩺','mental':'🧠'})[t.id]||'•'}</span>
        <span style=${{ fontSize:9 }}>${t.label}</span>
      </button>`)}
      <button class="mobile-nav-btn" onClick=${logout} style=${{ color:'#FF4455' }}>
        <span>⏏</span>
        <span style=${{ fontSize:9 }}>Quitter</span>
      </button>
    </nav>
  </div>`;
}
