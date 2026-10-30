

function PlayerView() {
  const { user, db, setDb, logout } = useApp();
  const player = (db.playerProfiles||[]).find(p => p.id === user.playerId);
  const club = db.clubs.find(c => c.id === (player && player.clubId));

  function savePlayer(updates) {
    if (!player) return;
    const updated = { ...player, ...updates };
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(p => p.id === player.id ? updated : p)
    }));
    // Sync Firebase (le joueur est authentifie anonymement)
    // IMPORTANT: on assainit (JSON round-trip) avant d'écrire — Firebase refuse silencieusement
    // toute update() contenant un champ undefined imbriqué n'importe où dans l'objet, ce qui
    // faisait disparaître des données (ex: check-in wellness du matin) sans aucune erreur visible
    // côté joueur (le popup se fermait normalement car le state local, lui, était bien mis à jour).
    try {
      if (window.__perfhand_db && player.id) {
        let safeUpdates;
        try { safeUpdates = JSON.parse(JSON.stringify(updates)); } catch(e) { safeUpdates = updates; }
        window.__perfhand_db.ref('perfhand/playerProfiles/' + player.id).update(safeUpdates)
          .then(function(){ console.log('[savePlayer] OK', Object.keys(safeUpdates).join(',')); })
          .catch(function(e){ console.error('[savePlayer] Firebase refuse:', e.code, e.message); });
      }
    } catch(e) { console.warn('savePlayer sync error', e); }
  }
  const [tab, setTab] = useState("profil");
  const [showChat, setShowChat] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([{ role:"ai", text:"Bonjour ! Je suis ton assistant PerfHand. Pose-moi tes questions sur la nutrition, la recuperation ou la performance." }]);
  const [chatLoading, setChatLoading] = useState(false);
  const [wellnessDone, setWellnessDone] = useState(false);
  const [wellnessData, setWellnessData] = useState({ sommeil:3, douleurs:2, energie:3, humeur:3, stress:2 });
  const [bilanOpen, setBilanOpen] = useState(false);
  const [bilanData, setBilanData] = useState({ type:"Entrainement", duree:"", rpe:5, notes:[], notesText:"" });
  const [bilanHistory, setBilanHistory] = useState([]);
  const [showWellnessPopup, setShowWellnessPopup] = useState(false);
  const [wellnessAutoOpened, setWellnessAutoOpened] = useState(false);
  const [wellnessHistory, setWellnessHistory] = useState([]);

  // Ref toujours à jour vers le joueur courant — évite que checkMorningWellness (appelé de façon
  // asynchrone par les écouteurs visibilitychange/focus) ne lise une copie périmée du joueur prise
  // au moment où l'effet a été créé, ce qui faisait réapparaître la popup même après validation.
  const playerRef = useRef(player);
  useEffect(() => { playerRef.current = player; });

  // Ouvre automatiquement le questionnaire bien-être dès l'ouverture de l'app, toute la
  // journée, tant qu'il n'a pas été rempli aujourd'hui (une seule fois par jour une fois
  // rempli). CORRECTIF : la coupure "avant 18h" empêchait le popup de s'afficher pour tout
  // joueur ouvrant l'app après 18h sans l'avoir encore rempli — ce n'était pas voulu, le
  // questionnaire doit rester proposé tant qu'il n'est pas fait, quelle que soit l'heure.
  // Non-fermable dans ce cas (morningRequired) pour éviter qu'il soit zappé.
  // IMPORTANT: sur mobile, rouvrir "l'app" ne recharge souvent pas la page (le navigateur
  // reprend juste l'onglet déjà en mémoire) — on revérifie donc aussi à chaque retour au
  // premier plan (visibilitychange), pas seulement au tout premier chargement.
  useEffect(() => {
    if (!player) return;
    let cancelled = false;
    const pid = player.id;
    function checkMorningWellness() {
      if (document.hidden) return;
      const currentPlayer = playerRef.current || player;
      const today = localDateStr();
      // 1) Déjà envoyé aujourd'hui depuis cet appareil (mémorisé localement) ou déjà présent dans les données
      if (isWellnessDoneLocally(pid, today)) return;
      if (wellnessArr(currentPlayer).some(w => w.dateRessenti === today)) { markWellnessDoneLocally(pid, today); return; }
      // 2) La copie locale peut être en retard sur Firebase (ou rempli depuis un autre appareil) :
      //    on vérifie directement sur le serveur AVANT d'ouvrir une popup non fermable.
      const openPopup = () => {
        if (cancelled || isWellnessDoneLocally(pid, today)) return;
        setShowWellnessPopup(true);
        setWellnessAutoOpened(true);
      };
      if (window.__perfhand_db) {
        // Une lecture refusée ou impossible à l'ouverture vient souvent d'une connexion (ou d'une
        // liaison du code joueur) pas encore prête : on attend la session puis on réessaie avant
        // d'imposer un questionnaire peut-être déjà rempli. Après 3 échecs, on le propose.
        const verifierServeur = function(essai) {
          window.__perfhand_db.ref('perfhand/playerProfiles/' + pid + '/wellnessCheckins/' + today).once('value')
            .then(function(snap) {
              if (snap.exists()) markWellnessDoneLocally(pid, today);
              else openPopup();
            })
            .catch(function() {
              if (cancelled) return;
              if (essai < 3) setTimeout(function() { verifierServeur(essai + 1); }, 3000);
              else openPopup();
            });
        };
        (window.__perfhand_auth_pret || Promise.resolve()).then(function() { if (!cancelled) verifierServeur(1); });
      } else {
        openPopup();
      }
    }
    // Renvoie d'abord un éventuel envoi resté en attente (jamais confirmé par le serveur)
    flushPendingWellness(pid);
    checkMorningWellness();
    const onOnline = () => { flushPendingWellness(pid); };
    const retryTimer = setInterval(() => { flushPendingWellness(pid); }, 60000);
    document.addEventListener('visibilitychange', checkMorningWellness);
    window.addEventListener('focus', checkMorningWellness);
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      clearInterval(retryTimer);
      document.removeEventListener('visibilitychange', checkMorningWellness);
      window.removeEventListener('focus', checkMorningWellness);
      window.removeEventListener('online', onOnline);
    };
  }, [player && player.id]);

  // Si la popup automatique est ouverte alors que le wellness du jour existe en réalité déjà
  // (les données serveur arrivent après l'ouverture de l'app), on la referme toute seule au lieu
  // de forcer le joueur à re-remplir.
  useEffect(() => {
    if (!player || !showWellnessPopup || !wellnessAutoOpened) return;
    const today = localDateStr();
    if (isWellnessDoneLocally(player.id, today) || wellnessArr(player).some(w => w.dateRessenti === today)) {
      markWellnessDoneLocally(player.id, today);
      setShowWellnessPopup(false);
      setWellnessAutoOpened(false);
    }
  }, [player, showWellnessPopup, wellnessAutoOpened]);


  const sc = player ? (STATUS_CFG[player.status] || STATUS_CFG.ok) : STATUS_CFG.ok;

  async function sendChat() {
    if (!chatMsg.trim() || chatLoading) return;
    const msg = chatMsg.trim();
    setChatHistory(h => [...h, { role:"user", text:msg }]);
    setChatMsg("");
    setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:400,
          system:"Tu es un assistant performance handball. Reponds en francais, concis (3-4 phrases max). Conseils nutrition, recuperation, blessures, performance. Joueur: " + player.name + ", " + player.pos + ", " + player.age + " ans, statut: " + player.status,
          messages:[{ role:"user", content:msg }]
        })
      });
      const data = await res.json();
      const reply = (data.content && data.content[0] && data.content[0].text) || "Je n'ai pas pu repondre. Reessaie !";
      setChatHistory(h => [...h, { role:"ai", text:reply }]);
    } catch(e) {
      setChatHistory(h => [...h, { role:"ai", text:"Connexion impossible. Reessaie." }]);
    }
    setChatLoading(false);
  }

  const TABS = [
    { id:"profil",     label:"Profil" },
    { id:"accueil",    label:"Suivi" },
    { id:"planif",     label:"Planif" },
    { id:"muscu",      label:"Muscu" },
    { id:"protocole",  label:"Protocole" },
    { id:"endurance",  label:"Endurance" },
    { id:"nutrition",  label:"Nutrition" },
    { id:"blessures",  label:"Blessures" },
    { id:"mental",     label:"Mental" },
    { id:"bilan",      label:"Bilan" },
    { id:"tactique",   label:"Tactique" },
    { id:"bibliotheque", label:"Bibliothèque" },
    { id:"ressources", label:"Ressources" },
  ];

  if (!player) {
    console.log('[PlayerView] player=null, user.playerId=', user&&user.playerId, 'profiles count=', (db.playerProfiles||[]).length);
    return _h`<div style=${{ padding:40,color:'#fff',textAlign:'center',paddingTop:80 }}>Chargement...</div>`;
  }


  console.log("[PlayerView] rendering", player && player.name, "status=", player && player.status, "stats=", JSON.stringify(player && player.stats));
  return _h`<div style=${{ minHeight:"100vh", background:"#080A0E", color:"#fff", fontFamily:"'Inter',sans-serif" }}>
    <div class="topbar">
      <div class="logo" style=${{ fontSize:18 }}><span>PERF</span>HAND</div>
      <div style=${{ flex:1, textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.35)" }}>${club ? String(club.name||"") : ""}</div>
      <div style=${{ display:"flex", alignItems:"center", gap:10 }}>
        <${Avatar} name=${String(player.name||"?")} color=${sc.color} size=${30} />
        <button onClick=${() => setShowTerms(true)} style=${{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:11, cursor:"pointer" }}>CGU</button>
        <button class="btn btn-sm" onClick=${logout}>Deco</button>
      </div>
    </div>

    <div style=${{ background:"linear-gradient(135deg,rgba(255,164,32,0.08),transparent)", padding:"24px 20px 0" }}>
      <div style=${{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
        <${Avatar} name=${String(player.name||"?")} color=${sc.color} size=${56} />
        <div>
          <div style=${{ fontSize:24, fontWeight:800, marginBottom:3, fontFamily:"'Barlow Condensed',sans-serif" }}>${String(player.name||"")}</div>
          <div style=${{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:8 }}>#${String(player.num||0)} - ${String(player.pos||"")} - ${String(player.poids||0)} kg</div>
          <${Badge} status=${String(player.status||"ok")} />
        </div>
      </div>
      <div class="grid-4" style=${{ gap:10, paddingBottom:20 }}>
        ${(function(){
          var st = player.stats || {};
          var n = function(v){ return typeof v==="number" ? v : 0; };
          return [["Seances",n(st.sessions),"#fff"],["Charge",n(st.chargeWeek)+"%",ACCENT],["Bien-etre",n(st.wellness)+"/5",ACCENT],["Absences",n(st.absences),"rgba(255,255,255,0.6)"]].map(function(row){
            return _h`<div key=${row[0]} class="card" style=${{ textAlign:"center", padding:"12px 8px" }}>
              <div style=${{ fontSize:22, fontWeight:800, color:row[2] }}>${String(row[1])}</div>
              <div style=${{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1, marginTop:2 }}>${row[0]}</div>
            </div>`;
          });
        })()}
      </div>
    </div>

    <div class="tabbar" style=${{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 20px", overflowX:"auto" }}>
      ${TABS.map(function(t){
        return _h`<button key=${t.id} onClick=${() => setTab(t.id)} style=${{ background:"none", border:"none", borderBottom:tab===t.id?"2px solid "+ACCENT:"2px solid transparent", color:tab===t.id?ACCENT:"rgba(255,255,255,0.4)", padding:"14px 18px", fontSize:13, fontWeight:tab===t.id?700:500, cursor:"pointer", whiteSpace:"nowrap" }}>${String(t.label||"")}</button>`;
      })}
    </div>

    <div style=${{ padding:"20px 20px 100px", maxWidth:1100, margin:"0 auto" }}>
      ${tab === "accueil" ? _h`<div>
        <!-- Planning de la semaine — hyper visible, tout en haut -->
        ${(() => {
          const jourIdxAujourdhui = (new Date().getDay() + 6) % 7; // Lundi=0
          const clubId = player.clubId;
          const clubPlanif = clubId && db ? (db.clubPlanif || {})[clubId] : null;
          const persoPlanif = player.planif;

          function joursDepuisClub() {
            if (!clubPlanif || !clubPlanif.dateDebut || !Array.isArray(clubPlanif.semaines)) return null;
            const idx = computeCurrentWeekIdx(clubPlanif.dateDebut, clubPlanif.semaines.length);
            if (idx === null) return null;
            const week = clubPlanif.semaines[idx];
            if (!week || !week.jours) return null;
            return week.jours.map(day => dayArrGlobal(day).filter(s => s.type).map(s => {
              const t = TYPES_SEANCE.find(ts => ts.id === s.type);
              return { icon: t ? t.icon : '🏃', label: t ? t.label : s.type, heure: s.heureDebut || '', heures: s.heures || 0 };
            }));
          }
          function joursDepuisPerso() {
            if (!persoPlanif || !persoPlanif.dateDebut || !Array.isArray(persoPlanif.semaines)) return null;
            const idx = computeCurrentWeekIdx(persoPlanif.dateDebut, persoPlanif.semaines.length);
            if (idx === null) return null;
            const week = persoPlanif.semaines[idx];
            if (!week) return null;
            return [0,1,2,3,4,5,6].map(ji => {
              const items = [];
              if (week['j'+ji]) items.push({ icon:'🏃', label: week['j'+ji], heure: week['h'+ji]||'' });
              if (week['h'+ji+'b']) items.push({ icon:'🏋️', label:'', heure: week['h'+ji+'b'] });
              return items;
            });
          }

          const semaineClub = joursDepuisClub();
          const semainePerso = joursDepuisPerso();
          if (!semaineClub && !semainePerso) return null;
          const semaine = [0,1,2,3,4,5,6].map(ji => {
            const p = semainePerso ? semainePerso[ji] : [];
            if (p && p.length) return p;
            return semaineClub ? semaineClub[ji] : [];
          });

          // Repli : si aucune activité jour-par-jour n'a été saisie (onglet Planif > Détail)
          // mais qu'un cycle a été peint sur la semaine en cours (onglet Planif > Macro),
          // on l'affiche quand même pour éviter un faux "Repos" sur toute la semaine.
          const totalItems = semaine.reduce((s, d) => s + (d ? d.length : 0), 0);
          let macroFallback = null;
          if (totalItems === 0 && persoPlanif && persoPlanif.dateDebut && Array.isArray(persoPlanif.semaines)) {
            const idxMacro = computeCurrentWeekIdx(persoPlanif.dateDebut, persoPlanif.semaines.length);
            const weekMacro = idxMacro !== null ? persoPlanif.semaines[idxMacro] : null;
            if (weekMacro && weekMacro.cycle && weekMacro.cycle !== 'vide') {
              const cyc = CYCLES_PERSO.find(c => c.id === weekMacro.cycle) || CYCLES_PERSO[CYCLES_PERSO.length-1];
              macroFallback = { cyc, heures: weekMacro.heures || 0, notes: weekMacro.notes || '' };
            }
          }

          return _h`<div class="card" style=${{ marginBottom:14, border:'1px solid rgba(255,164,32,.3)' }}>
            <div style=${{ fontSize:13, fontWeight:800, color:ACCENT, marginBottom:12 }}>📅 Cette semaine</div>
            ${macroFallback ? _h`<div style=${{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:10, borderRadius:10, background:macroFallback.cyc.bg, border:'1px solid '+macroFallback.cyc.color+'40' }}>
              <span style=${{ fontSize:11, fontWeight:800, color:macroFallback.cyc.color }}>Cycle ${macroFallback.cyc.label}</span>
              ${macroFallback.heures ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>· ${macroFallback.heures}h prévues</span>` : null}
            </div>` : null}
            <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${JOURS.map((jourLabel, ji) => {
                const items = semaine[ji] || [];
                const isToday = ji === jourIdxAujourdhui;
                return _h`<div key=${jourLabel} style=${{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10,
                  background: isToday ? 'rgba(255,164,32,.12)' : 'rgba(255,255,255,.03)',
                  border: '1px solid ' + (isToday ? 'rgba(255,164,32,.4)' : 'rgba(255,255,255,.06)')
                }}>
                  <div style=${{ fontSize:11, fontWeight:800, color: isToday ? ACCENT : 'rgba(255,255,255,.4)', minWidth:34 }}>${jourLabel}</div>
                  <div style=${{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
                    ${items.length > 0 ? items.map((it, si) => _h`<div key=${si} style=${{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style=${{ fontSize:15 }}>${it.icon}</span>
                      ${it.label ? _h`<span style=${{ fontSize:12, fontWeight:600 }}>${it.label}</span>` : null}
                      ${it.heure ? _h`<span style=${{ fontSize:12, fontWeight:800, color:'#38BDF8', marginLeft:'auto', whiteSpace:'nowrap' }}>🕐 ${calcPlageHoraire(it.heure, it.heures)}</span>` : null}
                    </div>`) : _h`<span style=${{ fontSize:12, color:'rgba(255,255,255,.2)' }}>Repos</span>`}
                  </div>
                </div>`;
              })}
            </div>
          </div>`;
        })()}

        <div class="card" style=${{ marginBottom:14 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:ACCENT, marginBottom:12 }}>Mon statut</div>
          <div class="grid-2" style=${{ gap:10 }}>
            ${[["Phase",String((PLANS_NUT[player.nutrition]||PLANS_NUT.competition||{}).label||"")],["Statut",String((STATUS_CFG[player.status]||STATUS_CFG.ok||{}).label||"")],["Poste",String(player.pos||"")],["Numero","#"+String(player.num||0)]].map(function(row){
              return _h`<div key=${row[0]} style=${{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 12px" }}>
                <div style=${{ fontSize:9, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>${row[0]}</div>
                <div style=${{ fontSize:13, fontWeight:600 }}>${row[1]}</div>
              </div>`;
            })}
          </div>
          ${player.notes ? _h`<div style=${{ marginTop:14, padding:"12px", background:ACCENT+"08", border:"1px solid "+ACCENT+"20", borderRadius:10 }}>
            <div style=${{ fontSize:10, color:ACCENT, fontWeight:700, marginBottom:6 }}>MESSAGE COACH</div>
            <div style=${{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.8 }}>${String(player.notes||"")}</div>
          </div>` : null}
        </div>

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

        <!-- Séance(s) du jour — même logique que côté clients individuels -->
        ${(() => {
          const today = new Date().toISOString().split('T')[0];
          const muscuToday = (player.muscuSeances || []).find(s => s.datePrevu === today && !s.dateFaite);
          const enduToday = (player.enduranceSeances || []).find(s => s.datePrevu === today && !s.dateFaite);
          if (!muscuToday && !enduToday) return null;

          // Récupère l'horaire prévu aujourd'hui depuis le planning (club en priorité — structuré
          // par type de séance ; sinon planif individuelle en texte libre, on prend le 1er horaire).
          function findTodayHoraire(kind) {
            const jourIdx = (new Date().getDay() + 6) % 7; // Lundi=0
            const clubId = player.clubId;
            const clubPlanif = clubId && db ? (db.clubPlanif||{})[clubId] : null;
            if (clubPlanif && clubPlanif.dateDebut && Array.isArray(clubPlanif.semaines)) {
              const idx = computeCurrentWeekIdx(clubPlanif.dateDebut, clubPlanif.semaines.length);
              if (idx !== null) {
                const week = clubPlanif.semaines[idx];
                const day = week && week.jours && week.jours[jourIdx];
                const sessions = day ? dayArrGlobal(day) : [];
                const match = sessions.find(s => kind==='muscu' ? s.type==='muscu' : ['collectif','match','cardio'].includes(s.type));
                if (match && match.heureDebut) return match.heureDebut;
              }
            }
            const persoPlanif = player.planif;
            if (persoPlanif && persoPlanif.dateDebut && Array.isArray(persoPlanif.semaines)) {
              const idx = computeCurrentWeekIdx(persoPlanif.dateDebut, persoPlanif.semaines.length);
              if (idx !== null) {
                const week = persoPlanif.semaines[idx];
                if (week) {
                  const h = week['h'+jourIdx], h2 = week['h'+jourIdx+'b'];
                  return kind==='muscu' ? (h || null) : (h2 || h || null);
                }
              }
            }
            return null;
          }
          const heureMuscu = muscuToday ? findTodayHoraire('muscu') : null;
          const heureEndu = enduToday ? findTodayHoraire('endu') : null;

          return _h`<div class="card" style=${{ marginBottom:14, background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)' }}>
            <div style=${{ fontSize:11, fontWeight:800, color:ACCENT, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>⚡ Séance(s) du jour</div>
            <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
              ${muscuToday ? _h`<div onClick=${() => setTab('muscu')} style=${{ cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:'rgba(255,255,255,.03)', borderRadius:10 }}>
                <div>
                  <div style=${{ fontSize:13, fontWeight:700 }}>🏋️ ${muscuToday.nom || 'Musculation'}</div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${(muscuToday.exercices||[]).length} exercices</div>
                </div>
                <div style=${{ textAlign:'right' }}>
                  ${heureMuscu ? _h`<div style=${{ fontSize:14, fontWeight:800, color:'#38BDF8' }}>🕐 ${heureMuscu}</div>` : _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Horaire non défini</div>`}
                  <span style=${{ fontSize:10, color:ACCENT, fontWeight:700 }}>Voir →</span>
                </div>
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
                <div style=${{ textAlign:'right' }}>
                  ${heureEndu ? _h`<div style=${{ fontSize:14, fontWeight:800, color:'#38BDF8' }}>🕐 ${heureEndu}</div>` : _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Horaire non défini</div>`}
                  <span style=${{ fontSize:10, color:ACCENT, fontWeight:700 }}>Voir →</span>
                </div>
              </div>` : null}
            </div>
          </div>`;
        })()}
        <button class="btn" style=${{ width:"100%" }} onClick=${() => setShowWellnessPopup(true)}>Remplir mon questionnaire bien-etre</button>

        ${wellnessArr(player).length > 0 ? _h`<div class="card" style=${{ marginTop:14 }}>
          <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>Suivi bien-être — derniers jours</div>
          <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
            ${wellnessArr(player).slice(-7).reverse().map((w, i) => {
              const score = Math.round(((w.douleurs||0)+(w.energie||0)+(w.sommeil||0)+(w.humeur||0)+(w.stress||0)) / 5); // wellness quotidien : ne depend plus de la fatigue post-seance
              const col = score >= 4 ? '#4CAF50' : score === 3 ? '#FFA420' : '#FF4455';
              return _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.02)', borderRadius:8 }}>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${w.dateRessenti || ''}</span>
                <span style=${{ fontSize:13, fontWeight:800, color:col }}>${score}/5</span>
              </div>`;
            })}
          </div>
        </div>` : null}
      </div>` : null}

      ${tab === "nutrition" ? React.createElement(NutritionView, { player: player, db: db, setDb: setDb, isCoach: false }) : null}

      ${tab === "planif" ? React.createElement(PlanifSaison, { player: player, club: club, db: db }) : null}

      ${tab === "muscu" ? React.createElement(MuscuView, { player: player, setDb: setDb, isCoach: false, db: db }) : null}
      ${tab === "protocole" ? _h`<div>
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
      </div>` : null}

      ${tab === "endurance" ? React.createElement(EnduranceView, { player: player, setDb: setDb, isCoach: false, db: db }) : null}

      ${tab === "blessures" ? _h`<div>
        ${(!player.blessures || player.blessures.length === 0)
          ? _h`<div style=${{ textAlign:"center", padding:"60px", color:"rgba(255,255,255,0.2)" }}>Aucune blessure - continue comme ca !</div>`
          : player.blessures.map(function(b, idx){
            var sC = b.statut === "en cours" ? "#FF4455" : b.statut === "surveillance" ? "#FF7A00" : "#4CAF50";
            return _h`<div key=${idx} class="card" style=${{ marginBottom:10, borderLeft:"3px solid "+sC }}>
              <div style=${{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style=${{ fontWeight:700, fontSize:14 }}>${String(b.zone||b.type||"Blessure")}</div>
                <div style=${{ fontSize:11, color:sC }}>${String(b.statut||"")}</div>
              </div>
              ${b.description ? _h`<div style=${{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>${String(b.description||"")}</div>` : null}
              ${b.date ? _h`<div style=${{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:6 }}>${String(b.date||"")}</div>` : null}
            </div>`;
          })}
      </div>` : null}

      ${tab === "mental" ? _h`<div>
        <div class="card" style=${{ marginBottom:14 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:ACCENT, marginBottom:14 }}>Mon etat mental</div>
          <div class="grid-2" style=${{ gap:12 }}>
            ${(function(){
              var n = function(v){ return typeof v==="number" ? v : 0; };
              var s=n(player.stress), m=n(player.motivation), f=n(player.focus), c=n(player.confiance);
              return [["Stress",s,s>=4?"#FF4455":s>=3?"#FFB800":ACCENT],["Motivation",m,m<=2?"#FF4455":ACCENT],["Focus",f,f<=2?"#FF4455":ACCENT],["Confiance",c,c<=2?"#FF4455":ACCENT]].map(function(row){
                return _h`<div key=${row[0]} style=${{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"14px" }}>
                  <div style=${{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:8 }}>${row[0]}</div>
                  <div style=${{ fontSize:28, fontWeight:800, color:row[2] }}>${String(row[1])}<span style=${{ fontSize:14, color:"rgba(255,255,255,0.2)" }}>/5</span></div>
                </div>`;
              });
            })()}
          </div>
        </div>
      </div>` : null}

      ${tab === "bilan" ? React.createElement(SuiviChargeView, { player: player, setDb: setDb }) : null}

      ${tab === "tactique" ? React.createElement(TactiqueView, { db, setDb, clubs: [], clubId: (player && player.clubId) || '', canEdit: false, auteur: '', joueur: player }) : null}

      ${tab === "bibliotheque" ? React.createElement(BibliothequeView, { db, setDb: () => {}, readOnly: true }) : null}

      ${tab === "ressources" ? React.createElement(RessourcesView, { player: player, db: db }) : null}

      ${tab === "profil" ? _h`<div>
        <div class="card" style=${{ marginBottom:14 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:ACCENT, marginBottom:14 }}>Mes informations</div>
          <div class="grid-2" style=${{ gap:12 }}>
            ${[["Nom",String(player.name||"")],["Poste",String(player.pos||"")],["Numero","#"+String(player.num||0)],["Age",String(player.age||0)+" ans"],["Poids",String(player.poids||0)+" kg"],["Taille",String(player.taille||0)+" cm"]].map(function(row){
              return _h`<div key=${row[0]} style=${{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px 14px" }}>
                <div style=${{ fontSize:9, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>${row[0]}</div>
                <div style=${{ fontSize:15, fontWeight:700 }}>${row[1]}</div>
              </div>`;
            })}
          </div>
        </div>

        <div class="card" style=${{ marginBottom:14 }}>
          <div style=${{ fontSize:12, fontWeight:700, color:ACCENT, marginBottom:14 }}>Modifier mes informations</div>
          <div class="grid-2" style=${{ gap:12 }}>
            <div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Poids (kg)</div>
              <input class="inp" type="number" step="0.1" value=${player.poids||""} onInput=${function(e){ savePlayer({ poids: parseFloat(e.target.value)||0 }); }} style=${{ width:"100%" }} />
            </div>
            <div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Taille (cm)</div>
              <input class="inp" type="number" value=${player.taille||""} onInput=${function(e){ savePlayer({ taille: parseFloat(e.target.value)||0 }); }} style=${{ width:"100%" }} />
            </div>
            <div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Date de naissance</div>
              <input class="inp" type="date" value=${player.dateNaissance||""} onInput=${function(e){ var dn=e.target.value; var age=0; if(dn){var d=new Date(dn); age=Math.floor((Date.now()-d.getTime())/(365.25*24*3600*1000));} savePlayer({ dateNaissance: dn, age: age }); }} style=${{ width:"100%" }} />
            </div>
            <div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Age (calcule)</div>
              <input class="inp" type="number" value=${player.age||""} disabled style=${{ width:"100%", opacity:0.6 }} />
            </div>
            <div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Poste</div>
              <select class="inp" value=${player.pos||""} onChange=${function(e){ savePlayer({ pos: e.target.value }); }} style=${{ width:"100%" }}>
                ${["Gardien","Ailier gauche","Ailier droit","Arrière gauche","Arrière droit","Demi-centre","Pivot","Arrière"].map(function(p){ return _h`<option key=${p} value=${p} selected=${player.pos===p}>${p}</option>`; })}
              </select>
            </div>
            <div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>Numero</div>
              <input class="inp" type="number" value=${player.num||""} onInput=${function(e){ savePlayer({ num: parseInt(e.target.value)||0 }); }} style=${{ width:"100%" }} />
            </div>
          </div>
          <div style=${{ fontSize:11, color:"rgba(76,175,80,0.8)", marginTop:12, textAlign:"center" }}>Les modifications sont enregistrees automatiquement</div>
        </div>

        <div class="card">
          <div style=${{ fontSize:12, fontWeight:700, color:ACCENT, marginBottom:14 }}>Mon compte</div>
          <div style=${{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>Club : <b style=${{ color:"#fff" }}>${club ? String(club.name||"") : "USM"}</b></div>
          ${player.email ? _h`<div style=${{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:14 }}>Email : <b style=${{ color:"#fff" }}>${String(player.email||"")}</b></div>` : null}
          <button class="btn" style=${{ width:"100%", background:"rgba(255,68,85,0.15)", color:"#FF4455", border:"1px solid rgba(255,68,85,0.3)" }} onClick=${logout}>Se deconnecter</button>
        </div>
      </div>` : null}

    </div>

    ${showWellnessPopup ? React.createElement(WellnessPopup, {
      player: player,
      mode: 'wellness',
      morningRequired: wellnessAutoOpened,
      onClose: () => { setShowWellnessPopup(false); setWellnessAutoOpened(false); },
      onSubmit: (data) => {
        setShowWellnessPopup(false);
        setWellnessAutoOpened(false);
        const today = data.dateRessenti || localDateStr();
        // Écriture directe sur une clé dédiée à CE jour précis (wellnessCheckins/{date}), pas dans un
        // tableau : chaque jour a sa propre case, un nouvel envoi le même jour remplace juste cette
        // case (pas de doublons possibles), et ça ne touche jamais les autres jours.
        // sendWellnessCheckin marque aussi "fait aujourd'hui" en local (donc plus jamais redemandé
        // sur cet appareil) et garde l'envoi en attente jusqu'à confirmation du serveur (renvoi
        // automatique si le réseau a coupé ou si l'app a été fermée trop vite).
        if (player && player.id) {
          sendWellnessCheckin(player, data).catch(function(e) {
            console.error('[wellness] échec écriture:', e && e.code, e && e.message);
            alert('Ton questionnaire est bien noté sur ton téléphone mais n\'a pas encore pu être envoyé au coach (' + ((e && (e.code || e.message)) || 'erreur réseau') + '). Il sera renvoyé automatiquement dès que possible — pas besoin de le refaire.');
          });
        }
        // Reflète aussi en local pour un affichage immédiat (sans attendre le round-trip Firebase)
        setDb(d => ({
          ...d,
          playerProfiles: (d.playerProfiles||[]).map(p => p.id === player.id
            ? { ...p, wellnessCheckins: { ...(p.wellnessCheckins||{}), [today]: data } }
            : p)
        }));
      }
    }) : null}

    ${showTerms ? _h`<div class="modal-bg" onClick=${() => setShowTerms(false)} style=${{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
      <div class="card" onClick=${(e) => e.stopPropagation()} style=${{ maxWidth:500, maxHeight:"80vh", overflow:"auto" }}>
        <div style=${{ fontSize:16, fontWeight:700, marginBottom:12 }}>Conditions d'utilisation</div>
        <div style=${{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.8 }}>Tes donnees sont utilisees uniquement pour ton suivi de performance par ton preparateur physique. Elles ne sont jamais partagees avec des tiers.</div>
        <button class="btn" style=${{ marginTop:16, width:"100%" }} onClick=${() => setShowTerms(false)}>Fermer</button>
      </div>
    </div>` : null}
  </div>`;
}
