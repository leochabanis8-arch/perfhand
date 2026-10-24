
function CoachView() {
  const { user, db, setDb, logout } = useApp();
  const club = db.clubs.find(c => c.id === user.clubId);
  const players = (db.playerProfiles||[]).filter(p => playerInClub(p, user.clubId));
  const [page, setPage] = useState("dashboard");
  const [selPlayer, setSelPlayer] = useState(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newP, setNewP] = useState({ name:"", pos:"Pivot", num:"", age:"", poids:"", taille:"" });
  const [newPwConf, setNewPwConf] = useState("");

  const blesses = players.filter(p => p.status === "blesse").length;
  const surveilles = players.filter(p => p.status === "surveille").length;

  const NAV = [
    { id:"dashboard",  icon:"⊞",  label:"Dashboard" },
    { id:"effectif",   icon:"▤",  label:"Effectif" },
    { id:"charge",     icon:"📊", label:"Charge" },
    { id:"seances",    icon:"◫",  label:"Planning" },
    { id:"tactique",   icon:"🎯", label:"Tactique" },
    { id:"bibliotheque", icon:"📚", label:"Bibliothèque" },
    { id:"blessures",  icon:"✚",  label:"Blessures", badge: blesses + surveilles },
    { id:"ressources", icon:"◉",  label:"Ressources" },
    { id:"planifclub", icon:"📅", label:"Planif Club" },
    { id:"rm",         icon:"🧮", label:"Calcul 1RM" },
  ];
  const [showCoachChat, setShowCoachChat] = useState(false);

  const [inviteStatus, setInviteStatus] = React.useState(null);
  const [createdCredentials, setCreatedCredentials] = React.useState(null);

  function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  async function invitePlayer() {
    if (!newP.name || !newP.email) return;
    setInviteStatus('creating');
    const email = newP.email.toLowerCase().trim();
    const tempPassword = generateTempPassword();
    try {
      // IMPORTANT: on utilise une instance Firebase SECONDAIRE pour créer le compte joueur.
      // createUserWithEmailAndPassword() connecte automatiquement l'app à ce nouveau compte —
      // sur l'instance par défaut, ça déconnectait le coach et le remplaçait silencieusement
      // par le compte du joueur (session jamais restaurée -> "les joueurs disparaissent après
      // rechargement/déploiement" alors qu'en fait c'est le coach qui n'était plus lui-même).
      const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAB0dqrmBjZuZeLbBO2jVWRsECkzvFpVvg",
        authDomain: "perfhand-f8005.firebaseapp.com",
        databaseURL: "https://perfhand-f8005-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "perfhand-f8005",
        storageBucket: "perfhand-f8005.firebasestorage.app",
        messagingSenderId: "942276447358",
        appId: "1:942276447358:web:f47eb85391a07119ff5c2f",
      };
      const secondaryApp = firebase.apps.find(a => a.name === 'PlayerCreation')
        || firebase.initializeApp(FIREBASE_CONFIG, 'PlayerCreation');
      const secondaryAuth = secondaryApp.auth();

      // 1. Créer le compte Firebase Auth SUR L'INSTANCE SECONDAIRE (le coach reste connecté)
      const cred = await secondaryAuth.createUserWithEmailAndPassword(email, tempPassword);

      // 2. Créer le profil dans la DB (écriture ciblée, coach toujours authentifié normalement)
      const playerId = 'p' + Date.now();
      const p = {
        id: playerId, clubId: user.clubId, name: newP.name, pos: newP.pos,
        email: email, genre: newP.genre || 'M',
        num: parseInt(newP.num) || 99, age: parseInt(newP.age) || 20,
        poids: parseInt(newP.poids) || 80, taille: parseInt(newP.taille) || 180,
        status:'ok', stress:2, motivation:2, focus:2, confiance:2,
        stats:{ sessions:0, absences:0, chargeWeek:0, wellness:3 },
        blessures:[], muscuSeances:[], enduranceSeances:[], bilans:[],
        nutrition:'competition', notes:'', mustChangePassword: true,
        createdAt: localDateStr()
      };
      setDb(d => ({ ...d, playerProfiles:[...(d.playerProfiles||[]), p] }));
      // Persister le profil dans Firebase
      if (window.__perfhand_db) {
        await window.__perfhand_db.ref('perfhand/playerProfiles/' + playerId).set(p);
      }

      // 3. Envoyer email de réinitialisation de mot de passe (sur l'instance secondaire)
      await secondaryAuth.sendPasswordResetEmail(email);

      // 4. Nettoyage : déconnecter et fermer l'instance secondaire (le coach n'a jamais bougé)
      try { await secondaryAuth.signOut(); } catch(e) {}
      try { await secondaryApp.delete(); } catch(e) {}

      setCreatedCredentials({ email, tempPassword, name: newP.name });
      setInviteStatus('created');
    } catch(e) {
      console.error('[CreatePlayer]', e);
      if (e.code === 'auth/email-already-in-use') {
        setInviteStatus('already-exists');
      } else {
        setInviteStatus('error');
      }
    }
  }

  // Note: reconnectCoach() a été retiré — il n'était jamais appelé et n'était de toute façon
  // qu'un pansement (déconnexion forcée + re-login manuel). Le vrai problème est corrigé à la
  // source : invitePlayer() utilise maintenant une instance Firebase secondaire, donc la session
  // du coach n'est plus jamais perturbée par la création d'un compte joueur.

  if (selPlayer) {
    const pDataRaw = (db.playerProfiles||[]).find(p => p.id === selPlayer.id) || selPlayer;
      const pData = { stats:{sessions:0,absences:0,chargeWeek:0,wellness:3}, blessures:[], muscuSeances:[], bilans:[], ...pDataRaw };
    return _h`<div class="app">
      <nav class="sidebar">
        <div style=${{ padding:"0 22px 22px" }}>
          <div class="logo"><span>PERF</span>HAND</div>
          ${club && _h`<div style=${{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
            <div style=${{ fontSize:13, fontWeight:700 }}>${club.name}</div>
          </div>`}
        </div>
        ${NAV.map(item => _h`<button key=${item.id} class="nav-btn" onClick=${() => { setPage(item.id); setSelPlayer(null); }}>
          <span>${item.label}</span>
        </button>`)}
        <div style=${{ marginTop:"auto", padding:"0 14px" }}>
          <button class="btn btn-danger" style=${{ width:"100%", marginBottom:0 }} onClick=${logout}>Deconnexion</button>
        </div>
      </nav>
      <div class="main">
        <${PlayerDetail} p=${pData} db=${db} setDb=${setDb} onBack=${() => setSelPlayer(null)} />
      </div>
      <!-- Mobile nav quand on est sur fiche joueur -->
      <nav class="mobile-nav">
        ${NAV.map(item => _h`<button key=${item.id}
          class="mobile-nav-btn"
          onClick=${() => { setPage(item.id); setSelPlayer(null); }}
        >
          <span>${item.icon}</span>
          <span>${item.label}</span>
        </button>`)}
      </nav>
    </div>`;
  }

  return _h`<div class="app">
    <!-- Sidebar -->
    <nav class="sidebar">
      <div style=${{ padding:"0 22px 22px" }}>
        <div class="logo"><span>PERF</span>HAND</div>
        ${club && _h`<div style=${{ marginTop:10 }}>
          <div style=${{ fontSize:12, fontWeight:700 }}>${club.name}</div>
          <div style=${{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>${club.division}</div>
        </div>`}
      </div>
      ${NAV.map(item => _h`<button key=${item.id}
        class=${"nav-btn" + (page === item.id ? " active" : "")}
        onClick=${() => setPage(item.id)}
      >
        <span>${item.label}</span>
        ${item.badge > 0 ? _h`<span class="nav-badge">${item.badge}</span>` : null}
      </button>`)}
      <div style=${{ marginTop:"auto", padding:"0 14px" }}>
        <div style=${{ background:ACCENT + "08", border:"1px solid " + ACCENT + "18", borderRadius:12, padding:"10px 14px", marginBottom:10 }}>
          <div style=${{ fontSize:9, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:2 }}>Saison ${club && club.saison || '2026-2027'}</div>
          <div style=${{ fontSize:12, fontWeight:700, marginTop:3 }}>Semaine 18 / 44</div>
        </div>
        <button class="btn btn-danger" style=${{ width:"100%" }} onClick=${logout}>Deconnexion</button>
      </div>
    </nav>

    <!-- Main -->
    <div class="main">
      ${page === "dashboard" && _h`<div class="page-pad">
        <${SectionTitle} sub=${club ? club.name : ""} title="DASHBOARD COACH" />
        <div style=${{ background: TELEGRAM_CONFIG.enabled ? 'rgba(76,175,80,.08)' : 'rgba(255,255,255,.03)', border:'1px solid '+(TELEGRAM_CONFIG.enabled?'rgba(76,175,80,.25)':'rgba(255,255,255,.07)'), borderRadius:11, padding:'10px 16px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
            <div style=${{ fontSize:18 }}>✈️</div>
            <div>
              <div style=${{ fontSize:12, fontWeight:700 }}>Notifications Telegram</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:1 }}>${TELEGRAM_CONFIG.enabled ? 'Actif — les joueurs déclenchent des notifications' : 'Non configuré — voir le guide ci-dessous'}</div>
            </div>
          </div>
          <span style=${{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:700, background:TELEGRAM_CONFIG.enabled?'rgba(76,175,80,.2)':'rgba(255,255,255,.06)', color:TELEGRAM_CONFIG.enabled?'#4CAF50':'rgba(255,255,255,.4)' }}>${TELEGRAM_CONFIG.enabled?'ACTIF':'INACTIF'}</span>
        </div>
        <div class="grid-4" style=${{ marginBottom:22 }}>
          ${[["Disponibles", players.filter(p => p.status === "ok").length + "/" + players.length,"#4CAF50"],
             ["Blesses",blesses,"#FF4455"],
             ["Surveillance",surveilles,"#FF7A00"],
             ["Effectif",players.length,ACCENT]].map(([l,v,c]) =>
            _h`<div key=${l} class="card">
              <div style=${{ fontSize:28, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1.5, marginTop:3 }}>${l}</div>
            </div>`
          )}
        </div>
        <div class="card">
          <div class="scroll-x">
            <table>
              <thead><tr>
                ${["Joueur","Statut","Charge semaine","Bien-etre","Action"].map(h => _h`<th key=${h}>${h}</th>`)}
              </tr></thead>
              <tbody>
                ${players.map(p => _h`<tr key=${p.id}>
                  <td>
                    <div style=${{ display:"flex", alignItems:"center", gap:10 }}>
                      <${Avatar} name=${p.name} color=${(STATUS_CFG[p.status] || STATUS_CFG.ok).color} size=${30} />
                      <div>
                        <div style=${{ fontSize:13, fontWeight:600 }}>${p.name}</div>
                        <div style=${{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>#${p.num} - ${p.pos}</div>
                      </div>
                    </div>
                  </td>
                  <td><${Badge} status=${p.status} /></td>
                  <td style=${{ minWidth:120 }}><${LoadBar} v=${p.stats.chargeWeek} /></td>
                  <td>
                    <div style=${{ display:"flex", gap:3 }}>
                      ${[1,2,3,4,5].map(i => _h`<div key=${i} style=${{ width:7, height:7, borderRadius:"50%", background: i <= p.stats.wellness ? ACCENT : "rgba(255,255,255,0.1)" }}></div>`)}
                    </div>
                  </td>
                  <td><button class="btn btn-sm" onClick=${() => setSelPlayer(p)}>Voir</button></td>
                </tr>`)}
              </tbody>
            </table>
          </div>
        </div>
      </div>`}

      ${page === "effectif" && _h`<div class="page-pad">
        <div style=${{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22 }}>
          <${SectionTitle} title=${"EFFECTIF - " + players.length + " joueurs"} />
          <${Btn} primary onClick=${() => setShowAddPlayer(o => !o)}>+ Ajouter</${Btn}>
        </div>

        ${showAddPlayer && _h`<div class="card" style=${{ marginBottom:20 }}>
          <div style=${{ fontSize:13, fontWeight:700, marginBottom:4 }}>Ajouter un joueur</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:14, lineHeight:1.5 }}>
            Un compte sera créé automatiquement. Le joueur recevra un email pour définir son mot de passe.
          </div>

          ${inviteStatus === 'created' ? _h`<div style=${{ background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.3)', borderRadius:12, padding:'16px' }}>
            <div style=${{ fontSize:20, textAlign:'center', marginBottom:8 }}>✅</div>
            <div style=${{ fontSize:13, fontWeight:700, color:'#4CAF50', textAlign:'center', marginBottom:8 }}>Compte créé !</div>
            <div style=${{ background:'rgba(255,255,255,.05)', borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:4 }}>Email du joueur :</div>
              <div style=${{ fontSize:13, fontWeight:700 }}>${createdCredentials?.email}</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:8, marginBottom:4 }}>Mot de passe temporaire :</div>
              <div style=${{ fontSize:16, fontWeight:800, color:'#FFA420', letterSpacing:2 }}>${createdCredentials?.tempPassword}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:4 }}>Un email de réinitialisation a aussi été envoyé au joueur.</div>
            </div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:12 }}>
              ⚠️ Transmets ce mot de passe temporaire au joueur. Il pourra le changer via "Mot de passe oublié".
            </div>
            <${Btn} primary onClick=${() => {
              setShowAddPlayer(false);
              setInviteStatus(null);
              setCreatedCredentials(null);
              setNewP({ name:'', pos:'Pivot', num:'', age:'', poids:'', taille:'', email:'', genre:'M' });
            }}>Fermer</${Btn}>
          </div>` : _h`<div>
            <${Inp} label="Nom complet" value=${newP.name} onChange=${v => setNewP(p => ({ ...p, name:v }))} placeholder="Prénom Nom" />
            <${Inp} label="Email du joueur" value=${newP.email||''} onChange=${v => setNewP(p => ({ ...p, email:v }))} placeholder="joueur@email.com" />
            <div class="grid-2">
              <div>
                <div class="lbl">Poste</div>
                <select class="inp" value=${newP.pos} onChange=${e => setNewP(p => ({ ...p, pos:e.target.value }))} style=${{ marginBottom:14 }}>
                  ${["Gardien","Ailier","Arrière","Pivot","Demi-centre"].map(pos => _h`<option key=${pos} value=${pos}>${pos}</option>`)}
                </select>
              </div>
              <${Inp} label="Numéro" value=${newP.num} onChange=${v => setNewP(p => ({ ...p, num:v }))} placeholder="7" />
            </div>
            <div class="grid-2">
              <div>
                <div class="lbl">Genre</div>
                <select class="inp" value=${newP.genre||'M'} onChange=${e => setNewP(p => ({ ...p, genre:e.target.value }))} style=${{ marginBottom:14 }}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <${Inp} label="Âge" value=${newP.age} onChange=${v => setNewP(p => ({ ...p, age:v }))} placeholder="22" />
            </div>
            ${inviteStatus === 'already-exists' ? _h`<div style=${{ fontSize:12, color:'#FFB800', background:'rgba(255,184,0,.08)', borderRadius:8, padding:'8px 12px', marginBottom:12 }}>
              Cet email a déjà un compte. Le joueur peut se connecter directement.
            </div>` : null}
            ${inviteStatus === 'error' ? _h`<div style=${{ fontSize:12, color:'#FF4455', background:'rgba(255,68,85,.08)', borderRadius:8, padding:'8px 12px', marginBottom:12 }}>
              Erreur. Vérifie le format de l'email.
            </div>` : null}
            <div style=${{ display:"flex", gap:10 }}>
              <${Btn} onClick=${() => { setShowAddPlayer(false); setInviteStatus(null); }}>Annuler</${Btn}>
              <${Btn} primary onClick=${invitePlayer} disabled=${!newP.name || !newP.email || inviteStatus==='creating'}>
                ${inviteStatus === 'creating' ? 'Création...' : '+ Créer le compte'}
              </${Btn}>
            </div>
          </div>`}
        </div>`}

        <div class="effectif-grid">
          ${players.map(p => {
            const s = STATUS_CFG[p.status] || STATUS_CFG.ok;
            return _h`<div key=${p.id}
              class="player-card"
              onClick=${() => setSelPlayer(p)}
            >
              <div class="player-card-inner">
                <${Avatar} name=${p.name} color=${s.color} size=${38} />
                <div class="player-card-info">
                  <div class="player-name">${p.name}</div>
                  <div class="player-sub">#${p.num} · ${p.pos}</div>
                </div>
                <div class="player-card-right">
                  <${Badge} status=${p.status} />
                  <div class="player-charge">
                    <div class="charge-bar">
                      <div class="charge-fill" style=${{ width: p.stats.chargeWeek + "%", background: p.stats.chargeWeek > 85 ? "#FF4455" : p.stats.chargeWeek > 70 ? "#FFB800" : "#FFA420" }}></div>
                    </div>
                    <span class="charge-val">${p.stats.chargeWeek}%</span>
                  </div>
                </div>
              </div>
            </div>`;
          })}
        </div>
      </div>`}

      ${page === "charge"  && _h`<${ChargeDashboard} players=${players} />`}
      ${page === "seances" && _h`<${PlanifSaison} club=${club} db=${db} />`}
      ${page === "blessures" && _h`<${SuiviMedical} players=${players} db=${db} setDb=${setDb} onSelectPlayer=${p => setSelPlayer(p)} />`}
      ${page === "tactique" && _h`<div class="page-pad">${React.createElement(TactiqueView, { db, setDb, clubs: db.clubs || [], clubId: user.clubId || '', canEdit: true, auteur: user.name || 'Coach' })}</div>`}
      ${page === "bibliotheque" && _h`<div class="page-pad">${React.createElement(BibliothequeView, { db, setDb })}</div>`}
      ${page === "ressources" && _h`<${RessourcesView} role="coach" db=${db} setDb=${setDb} />`}
    ${page === "planifclub" && _h`<div class="page-pad">
      <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800, marginBottom:20 }}>PLANIFICATION CLUB</h1>
      ${React.createElement(PlanifClubView, { club: (db.clubs||[])[0]||{id:'usm',name:'USM'}, players: db.playerProfiles || db.players||[] })}
    </div>`}
    ${page === "rm" && _h`<div class="page-pad">
      <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800, marginBottom:20 }}>CALCULATEUR 1RM</h1>
      ${React.createElement(RMCalculator, { player: selPlayer || { poids: 80, name: 'Joueur', id:'tmp' }, setDb: setDb, allPlayers: players })}
    </div>`}
    </div>
  </div>

  <!-- Mobile bottom nav -->
  <nav class="mobile-nav">
    ${NAV.map(item => _h`<button key=${item.id}
      class=${"mobile-nav-btn" + (page === item.id ? " active" : "")}
      onClick=${() => { setPage(item.id); setSelPlayer(null); }}
    >
      <span>${item.icon}</span>
      <span>${item.label}</span>
    </button>`)}
  </nav>

  <${SharedChat} role="coach" playerName=${user.name} />
  `;
}

// ── PLAYER VIEW ────────────────────────────────────────────────────────────

// ── TESTING & CHARGE MODULE ──────────────────────────────────────────────────
// Données : questionnaire post-séance + bilan semaine + tests physiques

// Sauvegarde dans le profil joueur :
//   player.bilans       = [ { ...données séance } ]
//   player.bilansSem    = [ { ...données semaine } ]
//   player.tests        = [ { ...résultats tests } ]

function saveBilansPlayer(player, setDb, field, newData) {
  // Sync Firebase
  if (window.__perfhand_db && player && player.id) {
    const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
    window.__perfhand_db.ref(path + player.id + '/' + field).set(newData);
  }
  setDb(d => ({
    ...d,
    playerProfiles: (d.playerProfiles||[]).map(pl =>
      pl.id === player.id ? { ...pl, [field]: newData } : pl
    ),
    playersPerso: (d.playersPerso||[]).map(pl =>
      pl.id === player.id ? { ...pl, [field]: newData } : pl
    )
  }));
}

// ── QUESTIONNAIRE POST-SÉANCE ─────────────────────────────────────────────────

// ── WELLNESS QUESTIONNAIRE EDITOR ────────────────────────────────────────────
function WellnessEditor({ player, setDb, onClose }) {
  const questionnaire = player.wellnessQuestionnaire || null;
  const defaultQ = {
    titre: 'Bilan wellness',
    intro: 'Comment tu te sens ?',
    questions: [
      { id:'q1', label:'Fatigue générale', type:'slider', min:1, max:5, minLabel:'Frais', maxLabel:'Épuisé' },
      { id:'q2', label:'Qualité du sommeil', type:'slider', min:1, max:5, minLabel:'Mauvais', maxLabel:'Excellent' },
      { id:'q3', label:'Humeur', type:'slider', min:1, max:5, minLabel:'Basse', maxLabel:'Excellente' },
      { id:'q4', label:'Douleurs musculaires', type:'slider', min:1, max:5, minLabel:'Aucune', maxLabel:'Intenses' },
      { id:'q5', label:'Motivation', type:'slider', min:1, max:5, minLabel:'Faible', maxLabel:'Maximale' },
    ],
    hasNote: true,
    notePlaceholder: 'Remarques, ressentis particuliers...',
  };

  const [form, setForm] = React.useState(questionnaire ? JSON.parse(JSON.stringify(questionnaire)) : JSON.parse(JSON.stringify(defaultQ)));
  const [newQLabel, setNewQLabel] = React.useState('');

  function updQ(idx, k, v) {
    setForm(f => ({ ...f, questions: f.questions.map((q, i) => i===idx ? {...q, [k]:v} : q) }));
  }
  function addQuestion() {
    if (!newQLabel.trim()) return;
    const id = 'q' + Date.now();
    setForm(f => ({ ...f, questions: [...f.questions, { id, label:newQLabel.trim(), type:'slider', min:1, max:5, minLabel:'Faible', maxLabel:'Élevé' }] }));
    setNewQLabel('');
  }
  function removeQuestion(idx) {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  }
  function moveQuestion(idx, dir) {
    setForm(f => {
      const qs = [...f.questions];
      const swap = idx + dir;
      if (swap < 0 || swap >= qs.length) return f;
      [qs[idx], qs[swap]] = [qs[swap], qs[idx]];
      return { ...f, questions: qs };
    });
  }
  function save() {
    setDb(d => ({ ...d, playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, wellnessQuestionnaire:form} : p),
      playersPerso: (d.playersPerso||[]).map(p => p.id===player.id ? {...p, wellnessQuestionnaire:form} : p)
    }));
    if (onClose) onClose();
  }

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:540 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style=${{ fontSize:14, fontWeight:800 }}>🧩 Questionnaire wellness personnalisé</div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">

        <!-- Titre + intro -->
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Titre du questionnaire</div>
          <input class="inp" value=${form.titre} onInput=${e=>setForm(f=>({...f,titre:e.target.value}))} placeholder="Ex: Bilan bien-être"/>
        </div>
        <div style=${{ marginBottom:16 }}>
          <div class="lbl">Intro / consigne pour le joueur</div>
          <input class="inp" value=${form.intro} onInput=${e=>setForm(f=>({...f,intro:e.target.value}))} placeholder="Ex: Comment tu te sens aujourd'hui ?"/>
        </div>

        <!-- Questions existantes -->
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>
          Questions (${form.questions.length})
        </div>
        ${form.questions.map((q, qi) => _h`<div key=${q.id} style=${{
          background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
          borderRadius:10, padding:'10px 12px', marginBottom:8
        }}>
          <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style=${{ display:'flex', flexDirection:'column', gap:2 }}>
              <button onClick=${() => moveQuestion(qi, -1)} disabled=${qi===0}
                style=${{ background:'none', border:'none', color:qi===0?'rgba(255,255,255,.15)':'rgba(255,255,255,.4)', cursor:qi===0?'default':'pointer', fontSize:10, padding:'1px 4px' }}>▲</button>
              <button onClick=${() => moveQuestion(qi, 1)} disabled=${qi===form.questions.length-1}
                style=${{ background:'none', border:'none', color:qi===form.questions.length-1?'rgba(255,255,255,.15)':'rgba(255,255,255,.4)', cursor:qi===form.questions.length-1?'default':'pointer', fontSize:10, padding:'1px 4px' }}>▼</button>
            </div>
            <input class="inp" value=${q.label} onInput=${e=>updQ(qi,'label',e.target.value)}
              style=${{ flex:1, fontWeight:600 }} placeholder="Label de la question"/>
            <button onClick=${() => removeQuestion(qi)}
              style=${{ background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.2)', color:'#FF4455', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12, flexShrink:0 }}>×</button>
          </div>
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div class="lbl" style=${{ fontSize:8 }}>Label min</div>
              <input class="inp" value=${q.minLabel||''} onInput=${e=>updQ(qi,'minLabel',e.target.value)} placeholder="Ex: Faible" style=${{ fontSize:11 }}/>
            </div>
            <div>
              <div class="lbl" style=${{ fontSize:8 }}>Label max</div>
              <input class="inp" value=${q.maxLabel||''} onInput=${e=>updQ(qi,'maxLabel',e.target.value)} placeholder="Ex: Élevé" style=${{ fontSize:11 }}/>
            </div>
          </div>
        </div>`)}

        <!-- Ajouter question -->
        <div style=${{ display:'flex', gap:8, marginBottom:16 }}>
          <input class="inp" value=${newQLabel} onInput=${e=>setNewQLabel(e.target.value)}
            placeholder="Nouvelle question... Ex: Stress mental"
            style=${{ flex:1 }}
            onKeyDown=${e => e.key==='Enter' && addQuestion()}/>
          <button class="btn btn-primary btn-sm" onClick=${addQuestion}>+ Ajouter</button>
        </div>

        <!-- Note texte libre -->
        <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:16, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px' }}>
          <div style=${{ flex:1 }}>
            <div style=${{ fontSize:12, fontWeight:700, marginBottom:4 }}>Note texte libre</div>
            <input class="inp" value=${form.notePlaceholder||''} onInput=${e=>setForm(f=>({...f,notePlaceholder:e.target.value}))}
              placeholder="Placeholder de la zone de texte" style=${{ fontSize:11 }}/>
          </div>
          <div style=${{ display:'flex', alignItems:'center', gap:6 }}>
            <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>Activée</span>
            <button onClick=${() => setForm(f=>({...f,hasNote:!f.hasNote}))}
              style=${{
                width:42, height:24, borderRadius:12, cursor:'pointer', border:'none',
                background: form.hasNote ? '#FFA420' : 'rgba(255,255,255,.12)',
                position:'relative', transition:'background .2s'
              }}>
              <div style=${{ position:'absolute', top:3, left: form.hasNote?20:4, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }}></div>
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div style=${{ background:'rgba(255,164,32,.04)', border:'1px solid rgba(255,164,32,.15)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
          <div style=${{ fontSize:10, color:'#FFA420', textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Aperçu joueur</div>
          <div style=${{ fontSize:13, fontWeight:700, marginBottom:4 }}>${form.titre}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:8, fontStyle:'italic' }}>${form.intro}</div>
          ${form.questions.map((q, qi) => _h`<div key=${qi} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <span style=${{ fontSize:11, color:'rgba(255,255,255,.6)' }}>${q.label}</span>
            <div style=${{ display:'flex', gap:4 }}>
              ${[1,2,3,4,5].map(v => _h`<div key=${v} style=${{ width:20, height:6, borderRadius:3, background: v<=3 ? '#FFA420' : 'rgba(255,255,255,.1)' }}></div>`)}
            </div>
          </div>`)}
          ${form.hasNote ? _h`<div style=${{ marginTop:8, fontSize:10, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>${form.notePlaceholder}</div>` : null}
        </div>

        <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${save}>💾 Enregistrer le questionnaire</button>
      </div>
    </div>
  </div>`;
}


// ── CHARGE TERRAIN HANDBALL ──────────────────────────────────────────────────

// Contraintes articulaires et musculaires par poste
const CONTRAINTES_POSTE = {
  'Gardien': {
    articulaires: [
      { zone:'Épaule', niveau:5, detail:'RE/RI répétitifs en réception — rotation externe forcée à chaque parade' },
      { zone:'Genou', niveau:4, detail:'Réceptions unilatérales, fentes latérales — contrainte en valgus' },
      { zone:'Cheville', niveau:3, detail:'Appuis rapides, sorties basses — risque entorse' },
      { zone:'Rachis cervical', niveau:3, detail:'Sollicitation en extension/rotation lors des plongeons' },
      { zone:'Adducteurs', niveau:4, detail:'Écarts latéraux extrêmes, fentes répétées' },
    ],
    musculaires: ['Rotateurs coiffe épaule (RE/RI)', 'Quadriceps / ischio-jambiers', 'Adducteurs', 'Gainage lombaire'],
    conseils: ['Renforcement RE épaule systématique', 'Protocole proprioception genou', 'Gainage latéral quotidien'],
  },
  'Ailier': {
    articulaires: [
      { zone:'Cheville', niveau:5, detail:'Changements de direction extrêmes, réceptions 1 pied en bout de ligne' },
      { zone:'Épaule dominante', niveau:5, detail:'Armé en grand angle, contrainte en abduction/RE' },
      { zone:'Genou', niveau:3, detail:'Réceptions obliques, appuis en valgus' },
      { zone:'Hanche', niveau:3, detail:'Ouverture du bassin lors des tirs en extension' },
    ],
    musculaires: ['Coiffe des rotateurs (dominante)', 'Stabilisateurs cheville (péroniers)', 'Moyen fessier', 'Psoas-iliaque'],
    conseils: ['Travail proprioceptif cheville +++', 'RE épaule pré-séance', 'Renforcement péroniers'],
  },
  'Arrière': {
    articulaires: [
      { zone:'Épaule dominante', niveau:5, detail:'Armé répétitif haute intensité — le poste le plus sollicité en lancer' },
      { zone:'Lombaires', niveau:4, detail:'Rotation du tronc en puissance, charge compressive lors des armés' },
      { zone:'Genou', niveau:4, detail:'Réceptions après saut, torsion en pivot avant tir' },
      { zone:'Coude', niveau:3, detail:'Extension forcée en fin de geste de lancer' },
    ],
    musculaires: ['Coiffe des rotateurs +++', 'Érecteurs spinaux / multifides', 'Gainage obliques', 'Triceps brachial'],
    conseils: ['Ratio RE/RI ≥ 0.75 obligatoire', 'Renforcement lombaire/gainage rotation', 'Volume de lancer à monitorer'],
  },
  'Pivot': {
    articulaires: [
      { zone:'Genoux', niveau:5, detail:'Contacts répétés, flexions profondes sous charge, torsions en réception' },
      { zone:'Épaules', niveau:4, detail:'Contacts défensifs, blocages — sollicitation passive en abduction' },
      { zone:'Lombaires', niveau:4, detail:'Charge compressive en position fléchie sous pression adverse' },
      { zone:'Hanches', niveau:3, detail:'Rotations internes répétées, positions en crochet' },
    ],
    musculaires: ['Quadriceps (stabilisation active)', 'Ischio-jambiers', 'Fessiers', 'Gainage profond'],
    conseils: ['Renforcement excentrique ischio-jambiers', 'Travail valgus dynamique genou', 'Mobilité hanches quotidienne'],
  },
  'Demi-centre': {
    articulaires: [
      { zone:'Cheville', niveau:4, detail:'Appuis omnidirectionnels, changements de rythme rapides' },
      { zone:'Genou', niveau:4, detail:'Arrêts-départs, pivots latéraux — contrainte méniscale' },
      { zone:'Épaule', niveau:4, detail:'Passes répétées, armés à courte distance mais volume élevé' },
      { zone:'Cervicales', niveau:3, detail:'Vision périphérique — rotations cervicales répétées' },
    ],
    musculaires: ['Stabilisateurs genou (VMO)', 'Peroniers / tibial ant.', 'Coiffe des rotateurs', 'Trapèzes / rhomboïdes'],
    conseils: ['Proprioception genou/cheville combinée', 'Renforcement scapulaire', 'Mobilité thoracique'],
  },
};

// Zones de travail handball → impact articulaire
const ZONES_TRAVAIL = {
  'Technique individuelle':  { label:'Technique indiv.',  couleur:'#38BDF8', charges: { epaule:3, genou:2, cheville:2, lombaires:1 } },
  'Jeu collectif':           { label:'Jeu collectif',     couleur:'#4CAF50', charges: { epaule:3, genou:3, cheville:3, lombaires:2 } },
  'Condition physique':      { label:'Condition physique',couleur:'#FFA420', charges: { epaule:2, genou:4, cheville:4, lombaires:3 } },
  'Tirs / armés':            { label:'Tirs / armés',      couleur:'#FF4455', charges: { epaule:5, genou:2, cheville:1, lombaires:3 } },
  'Duels / contacts':        { label:'Duels / contacts',  couleur:'#7C6FFF', charges: { epaule:4, genou:4, cheville:3, lombaires:4 } },
  'Match / simulation':      { label:'Match',             couleur:'#FF6B9D', charges: { epaule:4, genou:5, cheville:5, lombaires:3 } },
  'Travail gardien':         { label:'Travail GB',        couleur:'#FFB800', charges: { epaule:5, genou:4, cheville:3, lombaires:2 } },
};

function ChargeTerrainForm({ player, setDb, onClose }) {
  const today = localDateStr();
  const [form, setForm] = React.useState({
    date: today,
    duree: '90',
    intensite: 6,
    zonesActives: [],
    typeSeance: 'Entraînement',
    notes: '',
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function toggleZone(z) {
    setForm(f => ({
      ...f,
      zonesActives: f.zonesActives.includes(z)
        ? f.zonesActives.filter(x => x !== z)
        : [...f.zonesActives, z]
    }));
  }

  function save() {
    const charge = (parseInt(form.duree)||90) * form.intensite;
    // Calculer impact articulaire cumulé
    const impactArt = { epaule:0, genou:0, cheville:0, lombaires:0 };
    form.zonesActives.forEach(z => {
      const zone = ZONES_TRAVAIL[z];
      if (zone) Object.keys(impactArt).forEach(k => { impactArt[k] += zone.charges[k]||0; });
    });
    const bilan = {
      id: Date.now(),
      date: form.date,
      type: 'Terrain',
      typeSeance: form.typeSeance,
      duree: parseInt(form.duree)||90,
      rpe: form.intensite,
      chargeSession: charge,
      fatigue: Math.round(form.intensite / 2),
      zonesActives: form.zonesActives,
      impactArticulaire: impactArt,
      notes: form.notes,
    };
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, bilans:[...(p.bilans||[]), bilan]} : p),
      playersPerso:   (d.playersPerso||[]).map(p => p.id===player.id   ? {...p, bilans:[...(p.bilans||[]), bilan]} : p),
    }));
    onClose();
  }

  const chargeCalc = (parseInt(form.duree)||90) * form.intensite;
  const rpeLabels = ['','Très léger','Léger','Modéré','Assez dur','Dur','Dur+','Très dur','Très dur+','Maximal-','Maximal'];

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:480 }} onClick=${e=>e.stopPropagation()}>
      <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style=${{ fontSize:15, fontWeight:800 }}>🏃 Bilan séance terrain</div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">

      <!-- Type séance -->
      <div style=${{ display:'flex', gap:6, marginBottom:14 }}>
        ${['Entraînement','Match','Test','Réathlétisation'].map(t => _h`<button key=${t}
          onClick=${()=>upd('typeSeance',t)}
          style=${{
            padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
            border: form.typeSeance===t ? '2px solid #FFA420' : '1px solid rgba(255,255,255,.1)',
            background: form.typeSeance===t ? 'rgba(255,164,32,.12)' : 'rgba(255,255,255,.03)',
            color: form.typeSeance===t ? '#FFA420' : 'rgba(255,255,255,.4)'
          }}>${t}</button>`)}
      </div>

      <!-- Date + Durée -->
      <div style=${{ display:'flex', gap:10, marginBottom:14 }}>
        <div style=${{ flex:1 }}><div class="lbl">Date</div><input class="inp" type="date" value=${form.date} onInput=${e=>upd('date',e.target.value)}/></div>
        <div style=${{ flex:1 }}><div class="lbl">Durée (min)</div><input class="inp" type="number" value=${form.duree} onInput=${e=>upd('duree',e.target.value)}/></div>
      </div>

      <!-- RPE -->
      <div style=${{ marginBottom:16 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <div style=${{ fontSize:12, fontWeight:600 }}>Intensité perçue (RPE)</div>
          <div style=${{ fontSize:16, fontWeight:800, color:'#FFA420' }}>${form.intensite}/10
            <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:400, marginLeft:6 }}>${rpeLabels[form.intensite]||''}</span>
          </div>
        </div>
        <input type="range" min="1" max="10" value=${form.intensite} onInput=${e=>upd('intensite',parseInt(e.target.value))}
          style=${{ width:'100%', accentColor:'#FFA420' }}/>
        <div style=${{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>
          <span>Très léger</span><span>Maximal</span>
        </div>
      </div>

      <!-- Zones de travail -->
      <div style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:12, fontWeight:600, marginBottom:8 }}>Zones de travail <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:400 }}>(multi-choix)</span></div>
        <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
          ${Object.entries(ZONES_TRAVAIL).map(([key, z]) => _h`<button key=${key}
            onClick=${()=>toggleZone(key)}
            style=${{
              padding:'5px 10px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700,
              border: form.zonesActives.includes(key) ? '2px solid '+z.couleur : '1px solid rgba(255,255,255,.08)',
              background: form.zonesActives.includes(key) ? z.couleur+'18' : 'rgba(255,255,255,.02)',
              color: form.zonesActives.includes(key) ? z.couleur : 'rgba(255,255,255,.4)'
            }}>${z.label}</button>`)}
        </div>
      </div>

      <!-- Charge calculée -->
      <div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.6)' }}>Charge session calculée</div>
        <div style=${{ fontSize:22, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif" }}>${chargeCalc} <span style=${{ fontSize:11, fontWeight:400 }}>UA</span></div>
      </div>

      <!-- Notes -->
      <div style=${{ marginBottom:16 }}>
        <div class="lbl">Notes</div>
        <textarea class="inp" value=${form.notes} onInput=${e=>upd('notes',e.target.value)}
          style=${{ resize:'vertical', minHeight:50 }} placeholder="Ressentis, points à retenir..."></textarea>
      </div>

      <div style=${{ display:'flex', gap:8 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${save}>✅ Valider le bilan terrain</button>
      </div>
      </div>
    </div>
  </div>`;
}

function ChargeTerrainView({ player, isCoach }) {
  const bilans = (player.bilans || []).filter(b => b.type === 'Terrain');
  const pos = player.pos || 'Arrière';
  const contraintes = CONTRAINTES_POSTE[pos] || CONTRAINTES_POSTE['Arrière'];

  // Charge terrain 28 derniers jours
  const now = new Date();
  const bilans28 = bilans.filter(b => (now - new Date(b.date)) <= 28*86400000);
  const bilans7  = bilans.filter(b => (now - new Date(b.date)) <= 7*86400000);

  // Impact articulaire cumulé sur 7 jours
  const impactCumul = { epaule:0, genou:0, cheville:0, lombaires:0 };
  bilans7.forEach(b => {
    if (b.impactArticulaire) {
      Object.keys(impactCumul).forEach(k => { impactCumul[k] += b.impactArticulaire[k]||0; });
    } else if (b.zonesActives) {
      b.zonesActives.forEach(z => {
        const zone = ZONES_TRAVAIL[z];
        if (zone) Object.keys(impactCumul).forEach(k => { impactCumul[k] += zone.charges[k]||0; });
      });
    }
  });

  const chargeTotal7 = bilans7.reduce((s,b) => s+(b.chargeSession||0), 0);
  const chargeTotal28 = bilans28.reduce((s,b) => s+(b.chargeSession||0), 0);

  function niveauCouleur(n, max=15) {
    const pct = n/max;
    if (pct < 0.4) return '#4CAF50';
    if (pct < 0.7) return '#FFB800';
    return '#FF4455';
  }
  function niveauLabel(n, max=15) {
    const pct = n/max;
    if (pct < 0.4) return 'Faible';
    if (pct < 0.7) return 'Modéré';
    return 'Élevé';
  }

  return _h`<div>
    <!-- Header poste -->
    <div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:2 }}>Poste</div>
          <div style=${{ fontSize:20, fontWeight:800, color:'#FFA420' }}>${pos}</div>
        </div>
        <div style=${{ display:'flex', gap:10 }}>
          <div style=${{ textAlign:'center', background:'rgba(255,255,255,.05)', borderRadius:10, padding:'8px 14px' }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:2 }}>Charge 7j</div>
            <div style=${{ fontSize:18, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif" }}>${chargeTotal7}</div>
            <div style=${{ fontSize:8, color:'rgba(255,255,255,.3)' }}>UA terrain</div>
          </div>
          <div style=${{ textAlign:'center', background:'rgba(255,255,255,.05)', borderRadius:10, padding:'8px 14px' }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:2 }}>Séances 28j</div>
            <div style=${{ fontSize:18, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif" }}>${bilans28.length}</div>
            <div style=${{ fontSize:8, color:'rgba(255,255,255,.3)' }}>handball</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contraintes articulaires du poste -->
    <div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>
        Contraintes articulaires — ${pos}
      </div>
      ${contraintes.articulaires.map(c => {
        const nivCouleur = ['','#4CAF50','#4CAF50','#FFB800','#FF7A00','#FF4455'][c.niveau] || '#FFA420';
        return _h`<div key=${c.zone} style=${{ marginBottom:10 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
            <div style=${{ fontSize:12, fontWeight:700 }}>${c.zone}</div>
            <div style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:700,
              background:nivCouleur+'18', color:nivCouleur }}>
              ${'●'.repeat(c.niveau)}${'○'.repeat(5-c.niveau)} Risque ${['','Très faible','Faible','Modéré','Élevé','Critique'][c.niveau]}
            </div>
          </div>
          <!-- Barre de niveau structurel -->
          <div style=${{ height:6, background:'rgba(255,255,255,.07)', borderRadius:3, marginBottom:4 }}>
            <div style=${{ height:'100%', width:(c.niveau/5*100)+'%', background:nivCouleur, borderRadius:3 }}></div>
          </div>
          <!-- Impact cumulé 7j -->
          ${bilans7.length > 0 ? _h`<div style=${{ display:'flex', alignItems:'center', gap:8 }}>
            <div style=${{ height:4, background:'rgba(255,255,255,.05)', borderRadius:2, flex:1 }}>
              ${(() => {
                const artKey = c.zone.toLowerCase().includes('pule') ? 'epaule'
                  : c.zone.toLowerCase().includes('genou') ? 'genou'
                  : c.zone.toLowerCase().includes('cheville') ? 'cheville'
                  : c.zone.toLowerCase().includes('lomba') ? 'lombaires' : null;
                const val = artKey ? impactCumul[artKey] : 0;
                const max = 20;
                const pct = Math.min(100, Math.round(val/max*100));
                const col = niveauCouleur(val, max);
                return _h`<div style=${{ height:'100%', width:pct+'%', background:col, borderRadius:2 }}></div>`;
              })()}
            </div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', whiteSpace:'nowrap' }}>Charge cumulée 7j</div>
          </div>` : null}
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:3, lineHeight:1.5 }}>${c.detail}</div>
        </div>`;
      })}
    </div>

    <!-- Charge cumulée par zone articulaire (7 derniers jours) -->
    ${bilans7.length > 0 ? _h`<div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>
        Impact articulaire cumulé — 7 derniers jours
      </div>
      <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        ${Object.entries({ 'Épaule':impactCumul.epaule, 'Genou':impactCumul.genou, 'Cheville':impactCumul.cheville, 'Lombaires':impactCumul.lombaires }).map(([k,v]) => {
          const MAX = 20;
          const col = niveauCouleur(v, MAX);
          const pct = Math.min(100, Math.round(v/MAX*100));
          return _h`<div key=${k} style=${{ background:col+'08', border:'1px solid '+col+'25', borderRadius:12, padding:'12px' }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style=${{ fontSize:11, fontWeight:700 }}>${k}</div>
              <div style=${{ fontSize:10, padding:'1px 7px', borderRadius:20, background:col+'20', color:col, fontWeight:700 }}>${niveauLabel(v, MAX)}</div>
            </div>
            <div style=${{ height:8, background:'rgba(255,255,255,.07)', borderRadius:4, marginBottom:4 }}>
              <div style=${{ height:'100%', width:pct+'%', background:col, borderRadius:4, transition:'width .3s' }}></div>
            </div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>Score : ${v} / ${MAX}</div>
          </div>`;
        })}
      </div>
    </div>` : null}

    <!-- Muscles dominants du poste -->
    <div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>
        Groupes musculaires prioritaires — ${pos}
      </div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${contraintes.musculaires.map((m,i) => _h`<span key=${i} style=${{
          fontSize:10, padding:'4px 10px', borderRadius:20,
          background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', color:'#FFA420'
        }}>${m}</span>`)}
      </div>
    </div>

    <!-- Conseils préventifs -->
    <div style=${{ background:'rgba(56,189,248,.04)', border:'1px solid rgba(56,189,248,.15)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'#38BDF8', marginBottom:8 }}>💡 Prévention prioritaire — ${pos}</div>
      ${contraintes.conseils.map((c,i) => _h`<div key=${i} style=${{ display:'flex', gap:8, marginBottom:6 }}>
        <span style=${{ color:'#38BDF8', fontSize:12 }}>→</span>
        <span style=${{ fontSize:11, color:'rgba(255,255,255,.65)', lineHeight:1.5 }}>${c}</span>
      </div>`)}
    </div>

    <!-- Historique séances terrain -->
    ${bilans.length > 0 ? _h`<div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Historique (${bilans.length} séances terrain)</div>
      ${[...bilans].reverse().slice(0,10).map(b => _h`<div key=${b.id} style=${{
        background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'10px 13px', marginBottom:6
      }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style=${{ fontSize:12, fontWeight:700 }}>${b.typeSeance||'Entraînement'} · ${b.duree}min</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>
              ${b.date} · RPE ${b.rpe}/10 · ${b.chargeSession} UA
            </div>
          </div>
          <div style=${{ fontSize:11, color:'#FFA420', fontWeight:700 }}>${b.chargeSession} UA</div>
        </div>
        ${b.zonesActives && b.zonesActives.length > 0 ? _h`<div style=${{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
          ${b.zonesActives.map(z => {
            const zone = ZONES_TRAVAIL[z];
            return zone ? _h`<span key=${z} style=${{
              fontSize:9, padding:'1px 7px', borderRadius:20,
              background:zone.couleur+'12', border:'1px solid '+zone.couleur+'25', color:zone.couleur
            }}>${zone.label}</span>` : null;
          })}
        </div>` : null}
      </div>`)}
    </div>` : _h`<div style=${{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
      <div style=${{ fontSize:24, marginBottom:8 }}>🏃</div>
      <div style=${{ fontWeight:700, marginBottom:4 }}>Aucune séance terrain enregistrée</div>
      <div style=${{ fontSize:11 }}>Utilise "+ Terrain" pour enregistrer une séance handball.</div>
    </div>`}
  </div>`;
}

function BilanSeanceForm({ player, setDb, onClose }) {
  const today = localDateStr();
  const [form, setForm] = useState({
    date: today,
    type: 'Collectif',
    duree: '',
    rpe: 6,
    charge: '',         // duree × RPE auto
    fatigue: 3,
    douleurs: 1,        // 1=aucune 5=intense
    douleursMenstruelles: 1, // uniquement si genre F
    qualiteSommeil: 3,
    humeur: 3,
    notes: '',
  });

  // Charge = duree × RPE (session load)
  const chargeCalc = (parseInt(form.duree) || 0) * form.rpe;

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const TYPES = ['Collectif','Muscu','Cardio','Technique','Match','Réathlétisation','Autonome'];
  const RPE_COLORS = ['','#4CAF50','#4CAF50','#8BC34A','#FFB800','#FF9800','#FF7A00','#FF7A00','#FF4455','#FF4455','#C62828'];
  const RPE_LABELS = ['','Très léger','Léger','Modéré','Assez difficile','Difficile','Difficile+','Très difficile','Très difficile+','Maximal','Maximal absolu'];

  function save() {
    const entry = {
      id: Date.now(),
      ...form,
      duree: parseInt(form.duree) || 0,
      chargeSession: chargeCalc,
    };
    const newBilans = [...(player.bilans || []), entry];
    saveBilansPlayer(player, setDb, 'bilans', newBilans);
    notifBilanSeance(player.name, entry);
    onClose();
  }

  function Slider({ label, val, min, max, onChange, colors, labels, color }) {
    const c = colors ? colors[val] : (color || '#FFA420');
    return _h`<div style=${{ marginBottom:20 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style=${{ fontSize:13, fontWeight:600 }}>${label}</div>
        <div style=${{ fontSize:22, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>
          ${val}${max===10?'/10':'/5'}
        </div>
      </div>
      <input type="range" min=${min} max=${max} value=${val}
        onInput=${e => onChange(parseInt(e.target.value))}
        style=${{ width:'100%', accentColor: c }}
      />
      <div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>${labels ? labels[min] : min}</span>
        ${labels ? _h`<span style=${{ fontSize:10, color:c, fontWeight:700 }}>${labels[val]}</span>` : null}
        <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>${labels ? labels[max] : max}</span>
      </div>
    </div>`;
  }

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:480 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style=${{ fontSize:15, fontWeight:800 }}>Bilan de séance</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${player.name} · ${new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}</div>
        </div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">

        <!-- Type séance -->
        <div style=${{ marginBottom:16 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Type de séance</div>
          <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
            ${TYPES.map(t => _h`<button key=${t}
              onClick=${() => upd('type', t)}
              style=${{ padding:'6px 13px', borderRadius:9, border:'1px solid '+(form.type===t?'#FFA42050':'rgba(255,255,255,.08)'),
                         background: form.type===t?'rgba(255,164,32,.15)':'rgba(255,255,255,.04)',
                         color: form.type===t?'#FFA420':'rgba(255,255,255,.45)',
                         fontSize:12, fontWeight: form.type===t?700:400, cursor:'pointer', fontFamily:'Inter,sans-serif' }}
            >${t}</button>`)}
          </div>
        </div>

        <!-- Durée -->
        <div style=${{ marginBottom:16 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Durée (minutes)</div>
          <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
            <input class="inp" type="number" value=${form.duree}
              onInput=${e => upd('duree', e.target.value)}
              placeholder="90"
              style=${{ maxWidth:100 }}
            />
            ${chargeCalc > 0 ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>
              Charge session : <span style=${{ color:'#FFA420', fontWeight:700 }}>${chargeCalc} AU</span>
              <span style=${{ fontSize:10, opacity:.6 }}> (${form.duree}min × RPE${form.rpe})</span>
            </div>` : null}
          </div>
        </div>

        <!-- RPE -->
        <${Slider} label="RPE — Perception globale de l'effort"
          val=${form.rpe} min=${1} max=${10}
          onChange=${v => upd('rpe', v)}
          colors=${RPE_COLORS}
          labels=${RPE_LABELS}
        />

        <!-- Fatigue post-séance -->
        <${Slider} label="Fatigue ressentie après séance"
          val=${form.fatigue} min=${1} max=${5}
          onChange=${v => upd('fatigue', v)}
          color=${'#FF7A00'}
          labels=${['','Frais','Légère','Modérée','Élevée','Épuisé']}
        />

        <!-- Douleurs -->
        <${Slider} label="Douleurs / gênes musculaires ou articulaires"
          val=${form.douleurs} min=${1} max=${5}
          onChange=${v => upd('douleurs', v)}
          colors=${['','#4CAF50','#8BC34A','#FFB800','#FF7A00','#FF4455']}
          labels=${['','Aucune','Légère','Modérée','Forte','Intense']}
        />

        <!-- Douleurs menstruelles (femmes uniquement) -->
        ${player.genre === 'F' ? _h`<div style=${{ background:'rgba(255,107,157,.04)', border:'1px solid rgba(255,107,157,.15)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style=${{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.8)' }}>🌸 Douleurs menstruelles</div>
            <div style=${{ fontSize:14, fontWeight:800, color:['','#4CAF50','#8BC34A','#FFB800','#FF7A00','#FF4455'][form.douleursMenstruelles] }}>
              ${form.douleursMenstruelles}/5
            </div>
          </div>
          <input type="range" min="1" max="5" value=${form.douleursMenstruelles}
            onInput=${e => upd('douleursMenstruelles', parseInt(e.target.value))}
            style=${{ width:'100%', accentColor:'#FF6B9D' }}/>
          <div style=${{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)', marginTop:4 }}>
            <span>Aucune</span><span>Légères</span><span>Modérées</span><span>Fortes</span><span>Intenses</span>
          </div>
          <div style=${{ fontSize:10, color:'rgba(255,107,157,.6)', marginTop:6, fontStyle:'italic' }}>
            ${['','Aucune douleur','Legere gene pas impact','Gene moderee adaptable','Douleurs fortes entrainement difficile','Douleurs intenses repos recommande'][form.douleursMenstruelles]}
          </div>
        </div>` : null}

        <!-- Questionnaire wellness personnalisé -->
        ${(() => {
          const wq = player.wellnessQuestionnaire;
          if (!wq || !wq.questions || !wq.questions.length) return null;
          return _h`<div style=${{ background:'rgba(124,111,255,.04)', border:'1px solid rgba(124,111,255,.2)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <div style=${{ fontSize:13, fontWeight:800, color:'#7C6FFF', marginBottom:4 }}>${wq.titre || 'Wellness personnalisé'}</div>
            ${wq.intro ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', fontStyle:'italic', marginBottom:12 }}>${wq.intro}</div>` : null}
            ${wq.questions.map((q, qi) => {
              const val = (form.wellnessCustom || {})[q.id] || 3;
              const col = val <= 2 ? '#4CAF50' : val === 3 ? '#FFA420' : '#FF4455';
              return _h`<div key=${q.id} style=${{ marginBottom:14 }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style=${{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.8)' }}>${q.label}</div>
                  <div style=${{ fontSize:14, fontWeight:800, color:col }}>${val}/${q.max||5}</div>
                </div>
                <input type="range" min=${q.min||1} max=${q.max||5} value=${val} step="1"
                  onInput=${e => setForm(f => ({
                    ...f, wellnessCustom: { ...(f.wellnessCustom||{}), [q.id]: parseInt(e.target.value) }
                  }))}
                  style=${{ width:'100%', accentColor:'#7C6FFF' }}/>
                <div style=${{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>
                  <span>${q.minLabel||'Faible'}</span><span>${q.maxLabel||'Élevé'}</span>
                </div>
              </div>`;
            })}
            ${wq.hasNote ? _h`<div style=${{ marginTop:8 }}>
              <textarea class="inp" value=${(form.wellnessCustom||{}).note||''}
                onInput=${e => setForm(f => ({ ...f, wellnessCustom: {...(f.wellnessCustom||{}), note:e.target.value} }))}
                placeholder=${wq.notePlaceholder||'Remarques...'} style=${{ resize:'vertical', minHeight:55, fontSize:11 }}></textarea>
            </div>` : null}
          </div>`;
        })()}

        <!-- Qualité sommeil nuit précédente -->
        <${Slider} label="Qualité du sommeil (nuit précédente)"
          val=${form.qualiteSommeil} min=${1} max=${5}
          onChange=${v => upd('qualiteSommeil', v)}
          colors=${['','#FF4455','#FF7A00','#FFB800','#8BC34A','#4CAF50']}
          labels=${['','Très mauvais','Mauvais','Moyen','Bon','Excellent']}
        />

        <!-- Humeur -->
        <${Slider} label="Humeur générale"
          val=${form.humeur} min=${1} max=${5}
          onChange=${v => upd('humeur', v)}
          colors=${['','#FF4455','#FF7A00','#FFB800','#8BC34A','#4CAF50']}
          labels=${['','Très basse','Basse','Neutre','Bonne','Excellente']}
        />

        <!-- Notes libres -->
        <div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Notes (facultatif)</div>
          <textarea class="inp"
            value=${form.notes}
            onInput=${e => upd('notes', e.target.value)}
            placeholder="Ressentis, points à signaler au coach..."
            style=${{ resize:'vertical', minHeight:60 }}
          ></textarea>
        </div>
      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${save} disabled=${!form.duree}>Valider le bilan</button>
      </div>
    </div>
  </div>`;
}

// ── BILAN SEMAINE ─────────────────────────────────────────────────────────────
function BilanSemaineForm({ player, setDb, onClose }) {
  const weekNum = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604800000);
  const [form, setForm] = useState({
    semaine: 'S' + weekNum,
    date: localDateStr(),
    nbSeances: '',
    chargeTotale: '',
    fatigueMoy: 3,
    humeurMoy: 3,
    sommeilMoy: 3,
    motivationSport: 4,
    stressExtra: 2,   // stress en dehors du sport
    douleursChrono: 1,
    notes: '',
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    const entry = { id: Date.now(), ...form, nbSeances: parseInt(form.nbSeances) || 0, chargeTotale: parseInt(form.chargeTotale) || 0 };
    const newBilansSem = [...(player.bilansSem || []), entry];
    saveBilansPlayer(player, setDb, 'bilansSem', newBilansSem);
    onClose();
  }

  function Score({ label, k, colors, labels }) {
    const val = form[k];
    const c = colors[val];
    return _h`<div style=${{ marginBottom:18 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
        <span style=${{ fontSize:13, fontWeight:600 }}>${label}</span>
        <span style=${{ fontSize:20, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${val}/5</span>
      </div>
      <div style=${{ display:'flex', gap:5 }}>
        ${[1,2,3,4,5].map(n => _h`<button key=${n}
          onClick=${() => upd(k, n)}
          style=${{ flex:1, height:36, borderRadius:9, border:'none',
                     background: n<=val ? c : 'rgba(255,255,255,.06)',
                     color: n<=val ? '#fff' : 'rgba(255,255,255,.2)',
                     cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'Inter,sans-serif' }}
        >${n}</button>`)}
      </div>
      ${labels ? _h`<div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>${labels[0]}</span>
        <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>${labels[1]}</span>
      </div>` : null}
    </div>`;
  }

  const SCALE_NEG = ['','#4CAF50','#8BC34A','#FFB800','#FF7A00','#FF4455']; // 1=bien 5=mal
  const SCALE_POS = ['','#FF4455','#FF7A00','#FFB800','#8BC34A','#4CAF50']; // 1=mal 5=bien

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:480 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style=${{ fontSize:15, fontWeight:800 }}>Bilan de semaine</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${player.name} · ${form.semaine}</div>
        </div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">

        <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
          <div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Semaine</div>
            <input class="inp" value=${form.semaine} onInput=${e => upd('semaine', e.target.value)} placeholder="S18" />
          </div>
          <div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Nb séances</div>
            <input class="inp" type="number" value=${form.nbSeances} onInput=${e => upd('nbSeances', e.target.value)} placeholder="5" />
          </div>
        </div>

        <div style=${{ marginBottom:18 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Charge totale estimée (AU)</div>
          <input class="inp" type="number" value=${form.chargeTotale} onInput=${e => upd('chargeTotale', e.target.value)} placeholder="Ex: 2400 (4 séances × RPE6 × 100min)" />
        </div>

        <${Score} label="Fatigue moyenne de la semaine" k="fatigueMoy"
          colors=${SCALE_NEG} labels=${['Très frais','Épuisé']} />
        <${Score} label="Humeur générale" k="humeurMoy"
          colors=${SCALE_POS} labels=${['Très basse','Excellente']} />
        <${Score} label="Qualité du sommeil (moyenne)" k="sommeilMoy"
          colors=${SCALE_POS} labels=${['Très mauvais','Excellent']} />
        <${Score} label="Motivation pour le sport" k="motivationSport"
          colors=${SCALE_POS} labels=${['Démotivé','Très motivé']} />
        <${Score} label="Stress hors sport (vie perso/études)" k="stressExtra"
          colors=${SCALE_NEG} labels=${['Aucun','Très élevé']} />
        <${Score} label="Douleurs chroniques / gênes persistantes" k="douleursChrono"
          colors=${SCALE_NEG} labels=${['Aucune','Intense']} />

        <div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Notes</div>
          <textarea class="inp" value=${form.notes} onInput=${e => upd('notes', e.target.value)}
            placeholder="Ressenti général de la semaine..." style=${{ resize:'vertical', minHeight:55 }}></textarea>
        </div>
      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${save}>Valider</button>
      </div>
    </div>
  </div>`;
}

// ── TESTS PHYSIQUES ───────────────────────────────────────────────────────────
function TestPhysiqueForm({ player, setDb, onClose, editData }) {
  const preselectedTestId = editData?.testId || editData?.edit?.testId || editData?.edit?.type || null;
  const preselectedTest = preselectedTestId ? TESTS_ENDURANCE_DB.find(t => t.id === preselectedTestId) : null;

  const editObj = editData?.edit || null;
  const initForm = preselectedTest ? {
    date: editObj?.date || localDateStr(),
    contexte: editObj?.contexte || 'Test isolé',
    testType: preselectedTestId,
    ...Object.fromEntries((preselectedTest.resultats||[]).map(r => [r.key, editObj?.[r.key] || ''])),
    notes: editObj?.notes || '',
  } : null;

  const [form, setForm] = useState(initForm || {
    date: localDateStr(),
    contexte: 'Debut saison',
    // Tests terrain
    sprint10: '', sprint20: '', sprint30: '',
    detente: '',   // CMJ en cm
    yoyo: '',      // niveau Yo-Yo IRT1
    vma: '',       // km/h
    // Tests salle (1RM ou estimation)
    squat1RM: '', bench1RM: '', souleveTerre: '', rowing: '',
    // Tests spécifiques handball
    lancerMedecine: '',  // en mètres
    agilite505: '',      // 5-0-5 en secondes
    notes: '',
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    const entry = {
      id: Date.now(),
      ...form,
      testId: preselectedTestId || form.testId || null,
      contexte: form.contexte || (preselectedTest ? preselectedTest.nom : 'Test isolé'),
    };
    // If editing existing test, update it; otherwise add new
    const existingId = editObj?.id;
    // Lire les tests FRAIS depuis db (pas depuis player prop figé)
    setDb(d => {
      const freshPl = (d.playerProfiles||[]).find(p => p.id === player.id)
        || (d.playersPerso||[]).find(p => p.id === player.id)
        || player;
      const currentTests = freshPl.tests || [];
      const newTests = existingId
        ? currentTests.map(t => t.id === existingId ? entry : t)
        : [...currentTests, entry];
      // Sync Firebase
      if (window.__perfhand_db && player && player.id) {
        const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
        window.__perfhand_db.ref(path + player.id + '/tests').set(newTests);
      }
      return {
        ...d,
        playerProfiles: (d.playerProfiles||[]).map(pl =>
          pl.id === player.id ? { ...pl, tests: newTests } : pl
        ),
        playersPerso: (d.playersPerso||[]).map(pl =>
          pl.id === player.id ? { ...pl, tests: newTests } : pl
        )
      };
    });
    onClose();
  }

  function Field({ label, k, unit, placeholder, type }) {
    return _h`<div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:4, lineHeight:1.3 }}>${label}</div>
      <div style=${{ display:'flex', gap:5, alignItems:'center' }}>
        <input class="inp" type=${type||'number'} value=${form[k]}
          onInput=${e => upd(k, e.target.value)}
          placeholder=${placeholder||'—'}
          style=${{ flex:1, textAlign:'center' }}
        />
        ${unit ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.35)', minWidth:30 }}>${unit}</span>` : null}
      </div>
    </div>`;
  }

  const CONTEXTES = ['Début saison','Mi-saison','Fin saison','Post-trêve','Test isolé'];

  // Early return for specific test mode
  if (preselectedTest) return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:500 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
          <span style=${{ fontSize:18 }}>${preselectedTest.icon}</span>
          <div>
            <div style=${{ fontSize:14, fontWeight:800 }}>${preselectedTest.nom}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:1 }}>${player.name}</div>
          </div>
        </div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">
        <div style=${{ background:preselectedTest.color+'08', border:'1px solid '+preselectedTest.color+'20', borderRadius:10, padding:'8px 12px', marginBottom:14, fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.5 }}>${preselectedTest.desc}</div>
        <div style=${{ marginBottom:12 }}><div class="lbl">Date du test</div>
          <input class="inp" type="date" value=${form.date} onInput=${e=>upd('date',e.target.value)}/></div>
        ${preselectedTest.resultats.map(r => _h`<div key=${r.key} style=${{ marginBottom:10 }}>
          <div class="lbl">${r.label}</div>
          <div style=${{ display:'flex', gap:6, alignItems:'center' }}>
            <input class="inp" type=${r.type||'number'} value=${form[r.key]||''} onInput=${e=>upd(r.key,e.target.value)}
              placeholder=${r.placeholder||'—'} style=${{ flex:1, textAlign:'center' }}/>
            ${r.unit ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.35)', minWidth:30 }}>${r.unit}</span>` : null}
          </div>
        </div>`)}
        ${form[preselectedTest.resultats[0]?.key] ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Résultats calculés</div>
          ${(preselectedTest.calculs||[]).map((c,i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
            <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>${c.label}</span>
            <span style=${{ fontSize:11, fontWeight:700, color:preselectedTest.color }}>${c.formula(form)}</span>
          </div>`)}
        </div>` : null}
        <div style=${{ marginBottom:14 }}><div class="lbl">Notes</div>
          <textarea class="inp" value=${form.notes||''} onInput=${e=>upd('notes',e.target.value)}
            placeholder="Conditions, état du joueur..." style=${{ minHeight:50, resize:'vertical' }}></textarea></div>
        <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${save}>💾 Enregistrer le test</button>
      </div>
    </div>
  </div>`;

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:540 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style=${{ fontSize:15, fontWeight:800 }}>Tests physiques</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${player.name}</div>
        </div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">

        <!-- Date + contexte -->
        <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Date</div>
            <input class="inp" type="date" value=${form.date} onInput=${e => upd('date', e.target.value)} />
          </div>
          <div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Contexte</div>
            <select class="inp" value=${form.contexte} onChange=${e => upd('contexte', e.target.value)}>
              ${CONTEXTES.map(c => _h`<option key=${c} value=${c}>${c}</option>`)}
            </select>
          </div>
        </div>

        <!-- Tests vitesse terrain -->
        <div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:12, padding:'14px', marginBottom:12 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:'#FFA420', marginBottom:12 }}>⚡ Vitesse & Sprint</div>
          <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            <${Field} label="Sprint 10m" k="sprint10" unit="s" placeholder="1.85" />
            <${Field} label="Sprint 20m" k="sprint20" unit="s" placeholder="2.90" />
            <${Field} label="Sprint 30m" k="sprint30" unit="s" placeholder="4.10" />
          </div>
        </div>

        <!-- Tests puissance / endurance -->
        <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.15)', borderRadius:12, padding:'14px', marginBottom:12 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:'#38BDF8', marginBottom:12 }}>🫀 Puissance & Endurance</div>
          <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            <${Field} label="Détente CMJ" k="detente" unit="cm" placeholder="42" />
            <${Field} label="VMA" k="vma" unit="km/h" placeholder="16.5" />
            <${Field} label="Yo-Yo IRT1" k="yoyo" unit="niv." placeholder="17.2" />
          </div>
        </div>

        <!-- Tests musculation -->
        <div style=${{ background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.15)', borderRadius:12, padding:'14px', marginBottom:12 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:'#FF4455', marginBottom:12 }}>🏋️ Force maximale (1RM ou estimé)</div>
          <div style=${{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            <${Field} label="Squat" k="squat1RM" unit="kg" placeholder="120" />
            <${Field} label="Bench Press" k="bench1RM" unit="kg" placeholder="90" />
            <${Field} label="Soulevé de terre" k="souleveTerre" unit="kg" placeholder="140" />
            <${Field} label="Rowing barre" k="rowing" unit="kg" placeholder="80" />
          </div>
        </div>

        <!-- Tests handball spécifiques -->
        <div style=${{ background:'rgba(124,111,255,.06)', border:'1px solid rgba(124,111,255,.15)', borderRadius:12, padding:'14px', marginBottom:12 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:'#7C6FFF', marginBottom:12 }}>🤾 Spécifique Handball</div>
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <${Field} label="Lancer médecine-ball 3kg" k="lancerMedecine" unit="m" placeholder="11.5" />
            <${Field} label="Test 5-0-5 (agilité)" k="agilite505" unit="s" placeholder="2.35" />
          </div>
        </div>

        <div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Notes</div>
          <textarea class="inp" value=${form.notes} onInput=${e => upd('notes', e.target.value)}
            placeholder="Conditions, remarques..." style=${{ resize:'vertical', minHeight:45 }}></textarea>
        </div>
      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${save}>Enregistrer les tests</button>
      </div>
    </div>
  </div>`;
}

// ── VUE SUIVI JOUEUR (onglet Bilan dans PlayerView) ───────────────────────────

function TestCard({ t, i, prev, player, setDb, isCoach, fmtDate, setShowTests }) {
  const [editing, setEditing] = React.useState(false);
  const [ef, setEf] = React.useState({ ...t });

  function delta(cur, prevVal, lower) {
    if (!cur || !prevVal || isNaN(cur) || isNaN(prevVal)) return null;
    const d = parseFloat(cur) - parseFloat(prevVal);
    if (d === 0) return null;
    return { val: d.toFixed(2), better: lower ? d < 0 : d > 0 };
  }

  function saveEdit() {
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, tests:(p.tests||[]).map(x=>x.id===t.id?{...ef}:x)} : p),
      playersPerso:   (d.playersPerso||[]).map(p => p.id===player.id   ? {...p, tests:(p.tests||[]).map(x=>x.id===t.id?{...ef}:x)} : p),
    }));
    setEditing(false);
  }

  function delTest() {
    if (!confirm('Supprimer ce test ?')) return;
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, tests:(p.tests||[]).filter(x=>x.id!==t.id)} : p),
      playersPerso:   (d.playersPerso||[]).map(p => p.id===player.id   ? {...p, tests:(p.tests||[]).filter(x=>x.id!==t.id)} : p),
    }));
  }

  if (editing) return _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(124,111,255,.3)', borderRadius:13, padding:'14px 16px', marginBottom:10 }}>
    <div style=${{ fontSize:13, fontWeight:700, marginBottom:10 }}>Modifier — ${t.contexte} (${fmtDate(t.date)})</div>
    <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
      ${[['sprint10','Sprint 10m (s)'],['sprint20','Sprint 20m (s)'],['sprint30','Sprint 30m (s)'],
         ['detente','Détente CMJ (cm)'],['vma','VMA (km/h)'],['yoyo','Yo-Yo (niv.)'],
         ['squat1RM','Squat 1RM (kg)'],['bench1RM','Bench 1RM (kg)'],['souleveTerre','Soulevé T. (kg)'],
         ['lancerMedecine','Lancer MB (m)'],['agilite505','5-0-5 (s)']].map(([k,l]) => _h`<div key=${k}>
        <div class="lbl" style=${{ fontSize:8 }}>${l}</div>
        <input class="inp" value=${ef[k]||''} onInput=${e=>setEf(f=>({...f,[k]:e.target.value}))} style=${{ textAlign:'center' }}/>
      </div>`)}
    </div>
    <div style=${{ marginBottom:10 }}><div class="lbl">Notes</div>
      <input class="inp" value=${ef.notes||''} onInput=${e=>setEf(f=>({...f,notes:e.target.value}))}/>
    </div>
    <div style=${{ display:'flex', gap:8 }}>
      <button class="btn" style=${{ flex:1 }} onClick=${()=>setEditing(false)}>Annuler</button>
      <button class="btn btn-primary" style=${{ flex:2 }} onClick=${saveEdit}>Enregistrer</button>
    </div>
  </div>`;

  // Check if this is an endurance protocol test
  const testDef = t.testId ? TESTS_ENDURANCE_DB.find(x => x.id === t.testId) : null;
  const testColor = testDef?.color || '#7C6FFF';

  if (testDef) {
    // Render endurance-specific test card
    return _h`<div style=${{ background:testColor+'08', border:'1px solid '+testColor+'25', borderRadius:13, padding:'14px 16px', marginBottom:10 }}>
      <!-- Header -->
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
          <span style=${{ fontSize:24 }}>${testDef.icon}</span>
          <div>
            <div style=${{ fontSize:13, fontWeight:800, color:testColor }}>${testDef.nom}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>${fmtDate(t.date)} · ${t.contexte||'Test isolé'}</div>
          </div>
        </div>
        <div style=${{ display:'flex', gap:5 }}>
          <button class="btn btn-sm" style=${{ background:testColor+'10', border:'1px solid '+testColor+'30', color:testColor, fontSize:10 }}
            onClick=${()=>{ if(typeof setShowTests==='function') setShowTests({ edit: t, testId: t.testId }); }}>✏️</button>
          <button class="btn btn-sm btn-danger" style=${{ fontSize:10 }} onClick=${delTest}>×</button>
        </div>
      </div>

      <!-- Résultats saisis -->
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6, marginBottom:12 }}>
        ${testDef.resultats.filter(r => t[r.key]).map(r => _h`<div key=${r.key} style=${{
          background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'8px 10px'
        }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>${r.label.replace(/ \(.*\)/,'')}</div>
          <div style=${{ fontSize:18, fontWeight:800, color:testColor, fontFamily:"'Barlow Condensed',sans-serif" }}>
            ${t[r.key]} <span style=${{ fontSize:11, opacity:.5 }}>${r.unit||''}</span>
          </div>
        </div>`)}
      </div>

      <!-- Calculs résultats -->
      ${testDef.calculs && testDef.calculs.some(c => c.formula(t) !== '—') ? _h`<div style=${{
        background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'10px 12px', marginBottom:10
      }}>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>📊 Résultats calculés</div>
        <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          ${testDef.calculs.filter(c => c.formula(t) !== '—').map((c,i) => _h`<div key=${i} style=${{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.04)'
          }}>
            <span style=${{ fontSize:10, color:'rgba(255,255,255,.45)' }}>${c.label}</span>
            <span style=${{ fontSize:11, fontWeight:800, color:testColor }}>${c.formula(t)}</span>
          </div>`)}
        </div>
      </div>` : null}

      <!-- Niveau -->
      ${(() => {
        const wkg = t.puissance30s && t.poids ? t.puissance30s/t.poids :
                    t.puissance12 && t.poids ? t.puissance12/t.poids :
                    t.vitesse_finale ? t.vitesse_finale : null;
        if (!wkg || !testDef.niveaux) return null;
        const niv = testDef.niveaux.find(n => wkg >= n.min && wkg < n.max);
        if (!niv) return null;
        return _h`<div style=${{ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:800, background:niv.color+'18', border:'1px solid '+niv.color+'40', color:niv.color }}>
          ${niv.label}
        </div>`;
      })()}

      ${t.notes ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:8, fontStyle:'italic' }}>${t.notes}</div>` : null}
    </div>`;
  }

  return _h`<div style=${{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(124,111,255,.2)', borderRadius:13, padding:'14px 16px', marginBottom:10 }}>
    <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
      <div>
        <div style=${{ fontSize:14, fontWeight:700 }}>${t.contexte}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:1 }}>${fmtDate(t.date)}</div>
      </div>
      ${isCoach ? _h`<div style=${{ display:'flex', gap:5 }}>
        <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.25)', color:'#FFA420', fontSize:10 }}
          onClick=${()=>setEditing(true)}>✏️</button>
        <button class="btn btn-sm btn-danger" style=${{ fontSize:10 }} onClick=${delTest}>×</button>
      </div>` : null}
    </div>
    <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
      ${[['Sprint 10m', t.sprint10, 's', true],['Sprint 20m', t.sprint20, 's', true],['Sprint 30m', t.sprint30, 's', true],
         ['Détente CMJ', t.detente, 'cm', false],['VMA', t.vma, 'km/h', false],['Yo-Yo IRT1', t.yoyo, 'niv.', false],
         ['Squat 1RM', t.squat1RM, 'kg', false],['Bench 1RM', t.bench1RM, 'kg', false],['Soulevé T.', t.souleveTerre, 'kg', false],
         ['Lancer MB', t.lancerMedecine, 'm', false],['5-0-5', t.agilite505, 's', true],
      ].filter(([,v]) => v).map(([l,v,u,lower]) => {
        const dv = prev ? delta(v, prev[Object.keys(prev).find(k=>String(prev[k])===String(v)&&k!=='id'&&k!=='date')], lower) : null;
        return _h`<div key=${l} style=${{ background:'rgba(255,255,255,.04)', borderRadius:9, padding:'8px 10px' }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', marginBottom:3 }}>${l}</div>
          <div style=${{ fontSize:16, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${v} <span style=${{ fontSize:10, opacity:.5 }}>${u}</span></div>
        </div>`;
      })}
    </div>
    ${t.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:8, fontStyle:'italic' }}>${t.notes}</div>` : null}
    ${isCoach ? _h`<div style=${{ marginTop:8 }}>
      <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.25)', color:'#FFA420', fontSize:11 }}
        onClick=${() => setShowTests({ edit: t, testId: t.testId || t.type || null })}>✏️ Modifier</button>
    </div>` : null}
  </div>`;
}
