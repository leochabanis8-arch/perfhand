
function SuiviChargeView({ player, setDb, isCoach }) {
  const [showBilanSeance, setShowBilanSeance] = useState(false);
  const [showBilanSem, setShowBilanSem] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showBilanTerrain, setShowBilanTerrain] = useState(false);
  const [showWellnessEditor, setShowWellnessEditor] = useState(false);
  const [showWellnessFill, setShowWellnessFill] = useState(false);
  const [showQuickHandball, setShowQuickHandball] = useState(false);
  const [quickRpe, setQuickRpe] = useState(6);
  const [sousOnglet, setSousOnglet] = useState('seances');

  const bilans    = player.bilans    || [];
  const bilansSem = player.bilansSem || [];
  const tests     = player.tests     || [];

  // Charge 7 jours (aiguë)
  const now7 = new Date();
  const weekBilans  = bilans.filter(b => (now7 - new Date(b.date)) <= 7  * 86400000);
  const bilans21    = bilans.filter(b => (now7 - new Date(b.date)) <= 21 * 86400000);
  const bilans28    = bilans.filter(b => (now7 - new Date(b.date)) <= 28 * 86400000);

  const chargeWeek  = weekBilans.reduce((s, b) => s + (b.chargeSession || 0), 0);
  const charge21    = bilans21.reduce((s, b) => s + (b.chargeSession || 0), 0);

  const rpeWeek     = weekBilans.length ? Math.round(weekBilans.reduce((s, b) => s + b.rpe, 0) / weekBilans.length * 10) / 10 : null;
  const rpe21       = bilans21.length   ? Math.round(bilans21.reduce((s, b) => s + b.rpe, 0) / bilans21.length * 10) / 10 : null;
  const fatigueWeek = weekBilans.length ? Math.round(weekBilans.reduce((s, b) => s + b.fatigue, 0) / weekBilans.length * 10) / 10 : null;
  const fatigue21   = bilans21.length   ? Math.round(bilans21.reduce((s, b) => s + b.fatigue, 0) / bilans21.length * 10) / 10 : null;

  // Delta 7j vs 21j (tendance)
  const avgWeekly21 = bilans21.length ? charge21 / 3 : null; // charge moyenne par semaine sur 21j
  const deltaCharge = (chargeWeek && avgWeekly21) ? Math.round((chargeWeek - avgWeekly21) / avgWeekly21 * 100) : null;

  // ACWR (Acute:Chronic Workload Ratio)
  const acuteLoad   = chargeWeek;
  const chronicLoad = bilans28.reduce((s, b) => s + (b.chargeSession||0), 0) / 4;
  const acwr = chronicLoad > 0 ? Math.round(acuteLoad / chronicLoad * 100) / 100 : null;
  const acwrColor = !acwr ? 'rgba(255,255,255,.3)' : acwr < 0.8 ? '#38BDF8' : acwr <= 1.3 ? '#4CAF50' : acwr <= 1.5 ? '#FFB800' : '#FF4455';
  const acwrLabel = !acwr ? '—' : acwr < 0.8 ? 'Sous-charge' : acwr <= 1.3 ? 'Zone optimale' : acwr <= 1.5 ? 'Attention' : 'Surcharge';

  function fmtDate(d) {
    try { return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }); } catch { return d; }
  }

  const bilansTerrain = bilans.filter(b => b.type === 'Terrain');
  const bilansMuscu   = bilans.filter(b => b.type !== 'Terrain');

  // Volume de séances validées (mois en cours + saison), sur 3 catégories distinctes :
  // - Musculation : muscuSeances marquées faites
  // - Endurance : enduranceSeances marquées faites (cardio/course individuel)
  // - Handball : bilans "Terrain" de type Collectif ou Match (entraînement/match d'équipe)
  const now = new Date();
  const monthStartStr = localDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const seasonStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1; // saison = 1er juillet → 30 juin (inclut la prépa estivale)
  const seasonStartStr = localDateStr(new Date(seasonStartYear, 6, 1));
  function countSince(arr, sinceStr, dateField) {
    return (arr||[]).filter(s => s[dateField] && String(s[dateField]).slice(0,10) >= sinceStr).length;
  }
  const muscuSeancesArr = player.muscuSeances || [];
  const enduranceSeancesArr = player.enduranceSeances || [];
  const handballBilans = bilans.filter(b => b.type === 'Collectif' || b.type === 'Match');
  const volMuscuMois    = countSince(muscuSeancesArr, monthStartStr, 'dateFaite');
  const volMuscuSaison  = countSince(muscuSeancesArr, seasonStartStr, 'dateFaite');
  const volEnduMois     = countSince(enduranceSeancesArr, monthStartStr, 'dateFaite');
  const volEnduSaison   = countSince(enduranceSeancesArr, seasonStartStr, 'dateFaite');
  const volHandMois     = countSince(handballBilans, monthStartStr, 'date');
  const volHandSaison   = countSince(handballBilans, seasonStartStr, 'date');

  const SOUS = [
    { id:'seances',  label:'Séances ('+bilansMuscu.length+')' },
    { id:'terrain',  label:'🏃 Terrain ('+bilansTerrain.length+')' },
    { id:'semaines', label:'Semaines ('+bilansSem.length+')' },
    { id:'tests',    label:'Tests ('+tests.length+')' },
  ];

  return _h`<div>

    <!-- Volume de séances : musculation, endurance, handball, mois + saison -->
    <div class="card" style=${{ marginBottom:14 }}>
      <div style=${{ fontSize:12, fontWeight:800, marginBottom:12 }}>📊 Volume de séances</div>
      <div class="grid-3">
        <div style=${{ background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.2)', borderRadius:12, padding:'10px 12px' }}>
          <div style=${{ fontSize:10, color:'#FF4455', fontWeight:700, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>🏋️ Musculation</div>
          <div style=${{ display:'flex', gap:12 }}>
            <div>
              <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${volMuscuMois}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:2 }}>ce mois</div>
            </div>
            <div>
              <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1, color:'rgba(255,255,255,.6)' }}>${volMuscuSaison}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:2 }}>saison</div>
            </div>
          </div>
        </div>
        <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'10px 12px' }}>
          <div style=${{ fontSize:10, color:'#38BDF8', fontWeight:700, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>🏃 Endurance</div>
          <div style=${{ display:'flex', gap:12 }}>
            <div>
              <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${volEnduMois}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:2 }}>ce mois</div>
            </div>
            <div>
              <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1, color:'rgba(255,255,255,.6)' }}>${volEnduSaison}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:2 }}>saison</div>
            </div>
          </div>
        </div>
        <div style=${{ background:'rgba(124,111,255,.06)', border:'1px solid rgba(124,111,255,.2)', borderRadius:12, padding:'10px 12px' }}>
          <div style=${{ fontSize:10, color:'#7C6FFF', fontWeight:700, textTransform:'uppercase', letterSpacing:.5, marginBottom:6 }}>🏐 Handball</div>
          <div style=${{ display:'flex', gap:12 }}>
            <div>
              <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${volHandMois}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:2 }}>ce mois</div>
            </div>
            <div>
              <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1, color:'rgba(255,255,255,.6)' }}>${volHandSaison}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:2 }}>saison</div>
            </div>
          </div>
        </div>
      </div>
      <div style=${{ fontSize:9, color:'rgba(255,255,255,.2)', marginTop:8 }}>Saison en cours : depuis le 1er juillet ${seasonStartYear} (inclut la prépa). Handball = bilans "🏃 Terrain" de type Collectif/Match saisis pour ce joueur.</div>

      <!-- Bouton rapide : séance handball faite aujourd'hui -->
      ${!showQuickHandball ? _h`<button class="btn btn-sm" style=${{ width:'100%', marginTop:10, background:'rgba(124,111,255,.1)', border:'1px solid rgba(124,111,255,.3)', color:'#7C6FFF', fontWeight:700 }}
        onClick=${() => setShowQuickHandball(true)}>⚡ Séance handball faite aujourd'hui</button>`
      : _h`<div style=${{ marginTop:10, background:'rgba(124,111,255,.06)', border:'1px solid rgba(124,111,255,.25)', borderRadius:12, padding:'12px 14px' }}>
          <div style=${{ fontSize:11, fontWeight:700, marginBottom:8 }}>Intensité ressentie (RPE)</div>
          <div style=${{ display:'flex', gap:4, marginBottom:10, flexWrap:'wrap' }}>
            ${[1,2,3,4,5,6,7,8,9,10].map(n => _h`<button key=${n} class="btn btn-sm"
              style=${{ minWidth:28, padding:'5px 0', fontWeight: quickRpe===n?800:400,
                background: quickRpe===n ? '#7C6FFF' : 'rgba(255,255,255,.05)',
                color: quickRpe===n ? '#000' : 'rgba(255,255,255,.5)', border:'none' }}
              onClick=${() => setQuickRpe(n)}>${n}</button>`)}
          </div>
          <div style=${{ display:'flex', gap:8 }}>
            <button class="btn btn-sm" style=${{ flex:1, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
              onClick=${() => { setShowQuickHandball(false); setQuickRpe(6); }}>Annuler</button>
            <button class="btn btn-sm" style=${{ flex:2, background:'#7C6FFF', color:'#000', fontWeight:800 }}
              onClick=${() => {
                const bilan = {
                  id: Date.now(), date: localDateStr(), type: 'Collectif',
                  typeSeance: 'Entraînement handball', duree: 90, rpe: quickRpe,
                  chargeSession: 90 * quickRpe, fatigue: Math.round(quickRpe/2),
                  douleurs: 1, notes: '',
                };
                saveBilansPlayer(player, setDb, 'bilans', [...(player.bilans||[]), bilan]);
                setShowQuickHandball(false); setQuickRpe(6);
              }}>✓ Valider (90min · RPE ${quickRpe})</button>
          </div>
        </div>`}
    </div>

    <!-- KPIs 7j vs 21j -->
    <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
      <!-- Charge 7j -->
      <div class="card-accent" style=${{ gridColumn:'1/2' }}>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Charge 7j</div>
        <div style=${{ fontSize:26, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${chargeWeek || '—'}</div>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>UA · ${weekBilans.length} séance${weekBilans.length>1?'s':''}</div>
      </div>
      <!-- Charge 21j -->
      <div class="card" style=${{ gridColumn:'2/3' }}>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Charge 21j</div>
        <div style=${{ fontSize:26, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${charge21 || '—'}</div>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>UA · ${bilans21.length} séances</div>
      </div>
      <!-- ACWR -->
      <div class="card" style=${{ gridColumn:'3/4', border:'1px solid '+acwrColor+'30', background:acwrColor+'08' }}>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>ACWR</div>
        <div style=${{ fontSize:26, fontWeight:800, color:acwrColor, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${acwr || '—'}</div>
        <div style=${{ fontSize:9, color:acwrColor, marginTop:2, fontWeight:700 }}>${acwrLabel}</div>
      </div>
    </div>

    <!-- Tendance 7j vs moy. hebdo 21j -->
    ${(chargeWeek && avgWeekly21) ? _h`<div style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'9px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Tendance vs moy. hebdo 21j</div>
      <div style=${{
        fontSize:13, fontWeight:800,
        color: deltaCharge > 20 ? '#FF4455' : deltaCharge > 0 ? '#FFB800' : deltaCharge < -20 ? '#38BDF8' : '#4CAF50'
      }}>
        ${deltaCharge > 0 ? '+' : ''}${deltaCharge}%
        <span style=${{ fontSize:9, fontWeight:400, color:'rgba(255,255,255,.35)', marginLeft:4 }}>
          ${deltaCharge > 20 ? '⚠️ Semaine chargée' : deltaCharge > 0 ? '↑ Au-dessus de la moyenne' : deltaCharge < -20 ? '↓ Semaine légère' : '✓ Dans la norme'}
        </span>
      </div>
    </div>` : null}

    ${(rpeWeek || fatigueWeek) ? _h`<div style=${{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:14 }}>
      <div class="card">
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>RPE moy. 7j</div>
        <div style=${{ fontSize:26, fontWeight:800, color:rpeWeek>7?'#FF4455':rpeWeek>5?'#FFB800':'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif" }}>${rpeWeek}</div>
        ${rpe21 ? _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>21j : ${rpe21}/10</div>` : null}
      </div>
      <div class="card">
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Fatigue moy. 7j</div>
        <div style=${{ fontSize:26, fontWeight:800, color:fatigueWeek>3?'#FF4455':fatigueWeek>2?'#FFB800':'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif" }}>${fatigueWeek}</div>
        ${fatigue21 ? _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>21j : ${fatigue21}/5</div>` : null}
      </div>
    </div>` : null}

    <!-- Boutons d'ajout -->
    <div style=${{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
      <button class="btn btn-primary" style=${{ flex:'1 1 100px' }} onClick=${() => setShowBilanSeance(true)}>+ Muscu/Cardio</button>
      <button class="btn" style=${{ flex:'1 1 100px', background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700 }}
        onClick=${() => setShowBilanTerrain(true)}>🏃 Terrain</button>
      <button class="btn" style=${{ flex:'1 1 80px', background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8' }}
        onClick=${() => setShowBilanSem(true)}>+ Semaine</button>
      <button class="btn" style=${{ flex:'1 1 80px', background:'rgba(124,111,255,.1)', border:'1px solid rgba(124,111,255,.3)', color:'#7C6FFF' }}
        onClick=${() => setShowTests(true)}>+ Tests</button>
    </div>
    ${isCoach ? _h`<div style=${{ marginBottom:12 }}>
      <button class="btn btn-sm" style=${{
        width:'100%',
        background: player.wellnessQuestionnaire ? 'rgba(124,111,255,.1)' : 'rgba(255,255,255,.04)',
        border:'1px solid '+(player.wellnessQuestionnaire ? 'rgba(124,111,255,.35)' : 'rgba(255,255,255,.1)'),
        color: player.wellnessQuestionnaire ? '#7C6FFF' : 'rgba(255,255,255,.4)',
        fontSize:11, fontWeight:700
      }} onClick=${() => setShowWellnessEditor(true)}>
        ${player.wellnessQuestionnaire
          ? '🧩 Questionnaire wellness (' + (player.wellnessQuestionnaire.questions||[]).length + ' questions) — Modifier'
          : '🧩 Créer un questionnaire wellness personnalisé'}
      </button>
    </div>` : null}

    <!-- Suivi bien-être quotidien (check-ins du joueur) -->
    ${wellnessArr(player).length > 0 ? _h`<div class="card" style=${{ marginBottom:14 }}>
      <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>📆 Suivi bien-être quotidien${isCoach ? ' — ' + player.name : ''}</div>
      <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
        ${wellnessArr(player).map((w, idx) => ({ w, idx })).slice(-14).reverse().map(({w, idx}) => {
          const score = Math.round(((w.douleurs||0)+(w.energie||0)+(w.sommeil||0)+(w.humeur||0)+(w.stress||0)) / 5); // wellness quotidien : ne depend plus de la fatigue post-seance
          const col = score >= 4 ? '#4CAF50' : score === 3 ? '#FFA420' : '#FF4455';
          return _h`<div key=${idx} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,.02)', borderRadius:8 }}>
            <div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:600 }}>${w.dateRessenti || ''}</div>
              ${w.notesJoueur ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:2, fontStyle:'italic' }}>${w.notesJoueur}</div>` : null}
            </div>
            <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
              <span style=${{ fontSize:15, fontWeight:800, color:col, flexShrink:0 }}>${score}/5</span>
              ${isCoach ? _h`<button title="Supprimer ce check-in"
                onClick=${() => {
                  if (!confirm('Supprimer ce check-in bien-être (' + (w.dateRessenti||'') + ') de ' + player.name + ' ?')) return;
                  if (!w.dateRessenti) { alert('Date introuvable pour cette entrée, suppression impossible.'); return; }
                  if (window.__perfhand_db && player.id) {
                    window.__perfhand_db.ref('perfhand/playerProfiles/' + player.id + '/wellnessCheckins/' + w.dateRessenti).remove();
                  }
                  setDb(d => ({
                    ...d,
                    playerProfiles: (d.playerProfiles||[]).map(pl => {
                      if (pl.id !== player.id) return pl;
                      const wc = { ...(pl.wellnessCheckins||{}) };
                      delete wc[w.dateRessenti];
                      return { ...pl, wellnessCheckins: wc };
                    })
                  }));
                }}
                style=${{ background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.3)', color:'#FF4455', borderRadius:6, padding:'3px 8px', fontSize:11, cursor:'pointer' }}>×</button>` : null}
            </div>
          </div>`;
        })}
      </div>
    </div>` : (isCoach ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.25)', marginBottom:14, fontStyle:'italic' }}>Aucun check-in bien-être quotidien de ${player.name} pour le moment.</div>` : null)}

    <!-- Accès de secours pour remplir le wellness depuis l'onglet Bilan (si la popup automatique
         de l'accueil n'a pas pu s'ouvrir, ex: problème de chargement un matin donné) -->
    ${!isCoach ? _h`<button class="btn" style=${{ width:'100%', marginBottom:14, background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', fontWeight:700 }}
      onClick=${() => setShowWellnessFill(true)}>📝 Remplir mon questionnaire bien-être</button>` : null}
    ${showWellnessFill ? React.createElement(WellnessPopup, {
      player: player,
      mode: 'wellness',
      onClose: () => setShowWellnessFill(false),
      onSubmit: (data) => {
        setShowWellnessFill(false);
        const today = data.dateRessenti || localDateStr();
        if (player && player.id) {
          sendWellnessCheckin(player, data).catch(function(e) {
            console.error('[wellness] échec écriture:', e && e.code, e && e.message);
            alert('Ton questionnaire est bien noté sur ton téléphone mais n\'a pas encore pu être envoyé au coach (' + ((e && (e.code || e.message)) || 'erreur réseau') + '). Il sera renvoyé automatiquement dès que possible — pas besoin de le refaire.');
          });
        }
        setDb(d => ({
          ...d,
          playerProfiles: (d.playerProfiles||[]).map(p => p.id === player.id
            ? { ...p, wellnessCheckins: { ...(p.wellnessCheckins||{}), [today]: data } }
            : p),
          playersPerso: (d.playersPerso||[]).map(p => p.id === player.id
            ? { ...p, wellnessCheckins: { ...(p.wellnessCheckins||{}), [today]: data } }
            : p)
        }));
      }
    }) : null}

    <!-- Sous-onglets -->
    <div style=${{ display:'flex', gap:4, marginBottom:14, background:'rgba(255,255,255,.03)', borderRadius:11, padding:3 }}>
      ${SOUS.map(s => _h`<button key=${s.id}
        onClick=${() => setSousOnglet(s.id)}
        style=${{ flex:1, background:sousOnglet===s.id?'rgba(255,255,255,.07)':'transparent',
                   border:sousOnglet===s.id?'1px solid rgba(255,255,255,.1)':'1px solid transparent',
                   color:sousOnglet===s.id?'#fff':'rgba(255,255,255,.4)',
                   padding:'8px 4px', borderRadius:9, fontSize:11,
                   fontWeight:sousOnglet===s.id?600:400, cursor:'pointer' }}
      >${s.label}</button>`)}
    </div>

    <!-- Liste séances -->
    ${sousOnglet === 'seances' && _h`<div>
      ${bilans.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.25)', fontSize:13, background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
            Aucun bilan de séance.<br/><span style=${{ fontSize:11, opacity:.7 }}>Clique "+ Bilan séance" après chaque entraînement.</span>
          </div>`
        : bilans.slice().reverse().map((b, i) => {
          const rpeC = b.rpe>=8?'#FF4455':b.rpe>=6?'#FFB800':'#4CAF50';
          const fatC = b.fatigue>=4?'#FF4455':b.fatigue>=3?'#FFB800':'#4CAF50';
          return _h`<div key=${b.id||i} style=${{
            background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)',
            borderRadius:12, padding:'12px 14px', marginBottom:7
          }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:7 }}>
              <div>
                <div style=${{ fontSize:13, fontWeight:700 }}>${b.type}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:1 }}>${fmtDate(b.date)} · ${b.duree} min</div>
              </div>
              <div style=${{ display:'flex', gap:8, alignItems:'center' }}>
                <div style=${{ textAlign:'center' }}>
                  <div style=${{ fontSize:18, fontWeight:800, color:rpeC, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${b.rpe}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>RPE</div>
                </div>
                <div style=${{ textAlign:'center' }}>
                  <div style=${{ fontSize:18, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${b.chargeSession}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>AU</div>
                </div>
                <div style=${{ textAlign:'center' }}>
                  <div style=${{ fontSize:18, fontWeight:800, color:fatC, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${b.fatigue}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>Fat.</div>
                </div>
              </div>
            </div>
            ${(b.douleurs > 1 || b.notes) && _h`<div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
              ${b.douleurs > 1 ? _h`<span style=${{ fontSize:11, padding:'3px 9px', borderRadius:20, background:'rgba(255,68,85,.12)', color:'#FF4455', fontWeight:600 }}>
                Douleurs ${b.douleurs}/5
              </span>` : null}
              ${b.notes ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.4)', fontStyle:'italic' }}>${b.notes}</span>` : null}
            </div>`}
          </div>`;
        })
      }
    </div>`}

    <!-- Liste bilans semaine -->
    ${sousOnglet === 'semaines' && _h`<div>
      ${bilansSem.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.25)', fontSize:13, background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
            Aucun bilan de semaine.
          </div>`
        : bilansSem.slice().reverse().map((b, i) => {
          const motC = b.motivationSport<=2?'#FF4455':b.motivationSport>=4?'#4CAF50':'#FFB800';
          return _h`<div key=${b.id||i} style=${{
            background:'rgba(255,255,255,.025)', border:'1px solid rgba(56,189,248,.15)',
            borderRadius:12, padding:'12px 14px', marginBottom:7
          }}>
            <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <div style=${{ fontSize:13, fontWeight:700 }}>${b.semaine} · ${fmtDate(b.date)}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:1 }}>${b.nbSeances} séances · ${b.chargeTotale} AU</div>
              </div>
              <div style=${{ display:'flex', gap:8 }}>
                ${[['Fat.',b.fatigueMoy,b.fatigueMoy>=4?'#FF4455':b.fatigueMoy>=3?'#FFB800':'#4CAF50'],
                   ['Motiv.',b.motivationSport,motC],
                   ['Sommeil',b.sommeilMoy,b.sommeilMoy<=2?'#FF4455':b.sommeilMoy>=4?'#4CAF50':'#FFB800']
                ].map(([l,v,c]) => _h`<div key=${l} style=${{ textAlign:'center' }}>
                  <div style=${{ fontSize:16, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${v}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${l}</div>
                </div>`)}
              </div>
            </div>
            ${b.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', fontStyle:'italic' }}>${b.notes}</div>` : null}
          </div>`;
        })
      }
    </div>`}

    <!-- Tests physiques -->
    ${sousOnglet === 'tests' && _h`<div>
      <!-- Bandeau saisie rapide -->
      <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
        <div style=${{ fontSize:12, fontWeight:700, color:'#38BDF8', marginBottom:6 }}>📊 Saisir un test</div>
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
          ${TESTS_ENDURANCE_DB.map(test => _h`<button key=${test.id}
            onClick=${() => setShowTests({ testId: test.id })}
            style=${{
              padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
              border:'1px solid '+test.color+'40', background:test.color+'10', color:test.color
            }}>${test.icon} ${test.nom}</button>`)}
        </div>
      </div>
      ${tests.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.25)', fontSize:13, background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
            Aucun test enregistré.
          </div>`
        : tests.slice().reverse().map((t, i, arr) =>
          React.createElement(TestCard, { key: t.id||i, t, i, prev: arr[i+1], player, setDb, isCoach, fmtDate, setShowTests })
        )
      }
    </div>`}

    <!-- Modals -->
    ${showBilanSeance && _h`<${BilanSeanceForm} player=${player} setDb=${setDb} onClose=${() => setShowBilanSeance(false)} />`}
    ${showBilanTerrain && React.createElement(ChargeTerrainForm, { player, setDb, onClose: () => setShowBilanTerrain(false) })}
    ${showWellnessEditor && React.createElement(WellnessEditor, { player, setDb, onClose: () => setShowWellnessEditor(false) })}
    ${showBilanSem   && _h`<${BilanSemaineForm} player=${player} setDb=${setDb} onClose=${() => setShowBilanSem(false)} />`}
    ${showTests      && _h`<${TestPhysiqueForm} player=${player} setDb=${setDb} editData=${typeof showTests === 'object' ? showTests : null} onClose=${() => setShowTests(false)} />`}
  </div>`;
}

// ── VUE COACH : tableau récapitulatif de charge équipe ────────────────────────

// ── GROUPES DE NIVEAU (début de saison) ─────────────────────────────────────
const POSTES_HANDBALL = ['Gardien','Ailier','Arrière','Pivot','Demi-centre'];

function GroupesNiveauView({ players, db, setDb }) {
  const [onglet, setOnglet] = React.useState('groupes'); // groupes | creer | gpx
  const [form, setForm] = React.useState({ nom:'', critere:'vma', seuilBas:'', seuilHaut:'', postes:[], couleur:'#FFA420', description:'' });
  const [importResult, setImportResult] = React.useState(null);
  const [selPlayer4GPX, setSelPlayer4GPX] = React.useState(null);

  const groupes = db.groupesNiveau || [];

  // Calculer VMA de chaque joueur depuis ses tests
  function getVMA(p) {
    const tests = p.tests || [];
    const vmaTests = tests.filter(t => t.vma && parseFloat(t.vma) > 0);
    if (!vmaTests.length) {
      const endTests = (p.testsEndurance || []).filter(t => t.vmaFinal && parseFloat(t.vmaFinal) > 0);
      if (endTests.length) return parseFloat(endTests[endTests.length-1].vmaFinal);
    }
    return vmaTests.length ? parseFloat(vmaTests[vmaTests.length-1].vma) : null;
  }

  function saveGroupe() {
    if (!form.nom.trim()) return;
    // Auto-assigner joueurs selon critère
    let joueurs = [];
    if (form.critere === 'vma') {
      joueurs = players.filter(p => {
        const vma = getVMA(p);
        if (!vma) return false;
        const bas = parseFloat(form.seuilBas) || 0;
        const haut = parseFloat(form.seuilHaut) || 999;
        return vma >= bas && vma <= haut;
      }).map(p => p.id);
    } else if (form.critere === 'poste') {
      joueurs = players.filter(p => form.postes.includes(p.pos)).map(p => p.id);
    } else {
      joueurs = []; // manuel
    }
    const newG = { ...form, id: 'grp_'+Date.now(), joueurs, dateCreation: localDateStr() };
    setDb(d => ({ ...d, groupesNiveau: [...(d.groupesNiveau||[]), newG] }));
    setForm({ nom:'', critere:'vma', seuilBas:'', seuilHaut:'', postes:[], couleur:'#FFA420', description:'' });
    setOnglet('groupes');
  }

  function deleteGroupe(id) {
    if (!confirm('Supprimer ce groupe ?')) return;
    setDb(d => ({ ...d, groupesNiveau: (d.groupesNiveau||[]).filter(g => g.id !== id) }));
  }

  function togglePosteForm(pos) {
    setForm(f => ({ ...f, postes: f.postes.includes(pos) ? f.postes.filter(p=>p!==pos) : [...f.postes, pos] }));
  }

  // ── GPX/TCX IMPORT ────────────────────────────────────────────────────────
  function parseGPX(text) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const trkpts = doc.querySelectorAll('trkpt');
      if (!trkpts.length) return null;

      const points = Array.from(trkpts).map(pt => ({
        lat: parseFloat(pt.getAttribute('lat')),
        lon: parseFloat(pt.getAttribute('lon')),
        ele: parseFloat(pt.querySelector('ele')?.textContent || 0),
        time: new Date(pt.querySelector('time')?.textContent || 0),
        hr: parseInt(pt.querySelector('extensions [type="heartrate"], hr, HeartRateBpm Value')?.textContent || 0),
      }));

      // Calculer distance totale (Haversine)
      let dist = 0;
      for (let i = 1; i < points.length; i++) {
        const R = 6371000;
        const dLat = (points[i].lat - points[i-1].lat) * Math.PI/180;
        const dLon = (points[i].lon - points[i-1].lon) * Math.PI/180;
        const a = Math.sin(dLat/2)**2 + Math.cos(points[i-1].lat*Math.PI/180)*Math.cos(points[i].lat*Math.PI/180)*Math.sin(dLon/2)**2;
        dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      }

      const duration = (points[points.length-1].time - points[0].time) / 1000; // secondes
      const avgSpeed = dist / duration * 3.6; // km/h
      const hrs = points.filter(p => p.hr > 0).map(p => p.hr);
      const avgHR = hrs.length ? Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length) : null;
      const maxHR = hrs.length ? Math.max(...hrs) : null;
      const name = doc.querySelector('name')?.textContent || 'Activité GPX';
      const date = points[0].time.toISOString().slice(0,10);

      return {
        source: 'GPX', name, date,
        distance: Math.round(dist/10)/100, // km
        duration: Math.round(duration/60), // min
        avgSpeed: Math.round(avgSpeed*10)/10,
        avgHR, maxHR,
        points: points.length,
      };
    } catch(e) { return null; }
  }

  function parseTCX(text) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const activity = doc.querySelector('Activity');
      if (!activity) return null;

      const totalDist = parseFloat(doc.querySelector('DistanceMeters')?.textContent || 0) / 1000;
      const totalTime = parseFloat(doc.querySelector('TotalTimeSeconds')?.textContent || 0);
      const tpts = doc.querySelectorAll('Trackpoint');
      const hrs = Array.from(tpts).map(tp => parseInt(tp.querySelector('HeartRateBpm Value')?.textContent||0)).filter(h=>h>0);
      const avgHR = hrs.length ? Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length) : null;
      const maxHR = hrs.length ? Math.max(...hrs) : null;
      const date = doc.querySelector('Id')?.textContent?.slice(0,10) || localDateStr();
      const avgSpeed = totalDist / (totalTime/3600);

      return {
        source: 'TCX', name: 'Activité TCX', date,
        distance: Math.round(totalDist*100)/100,
        duration: Math.round(totalTime/60),
        avgSpeed: Math.round(avgSpeed*10)/10,
        avgHR, maxHR,
        calories: parseInt(doc.querySelector('Calories')?.textContent || 0),
      };
    } catch(e) { return null; }
  }

  function handleFileImport(e, playerId) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result;
      let result = null;
      if (file.name.endsWith('.gpx')) result = parseGPX(text);
      else if (file.name.endsWith('.tcx')) result = parseTCX(text);
      if (!result) { alert('Fichier non reconnu. Formats acceptés: .gpx, .tcx'); return; }
      setImportResult({ ...result, playerId, fileName: file.name });
    };
    reader.readAsText(file);
  }

  function saveImportedActivity(playerId) {
    if (!importResult) return;
    const seance = {
      id: Date.now(),
      nom: importResult.name,
      type: 'continu_ext',
      modalite: 'course',
      source: importResult.source,
      datePrevu: importResult.date,
      dateFaite: importResult.date,
      duree: importResult.duration,
      distance: importResult.distance + ' km',
      intensite: importResult.avgSpeed + ' km/h',
      fcMoyenne: importResult.avgHR,
      fcMax: importResult.maxHR,
      calories: importResult.calories,
      notes: 'Import ' + importResult.source + ' — ' + importResult.fileName,
      rpeReel: null,
    };
    const p = players.find(p => p.id === playerId);
    if (!p) return;
    // Sync Firebase
    if (window.__perfhand_db && playerId) {
      const inProfiles = !!(p.clubId);
      const newEndSeances = [...(p.enduranceSeances||[]), seance];
      if (inProfiles) {
        window.__perfhand_db.ref('perfhand/playerProfiles/' + playerId + '/enduranceSeances').set(newEndSeances);
      } else {
        window.__perfhand_db.ref('perfhand/playersPerso/' + playerId + '/enduranceSeances').set(newEndSeances);
      }
    }
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(pl => pl.id===playerId ? {...pl, enduranceSeances:[...(pl.enduranceSeances||[]), seance]} : pl),
      playersPerso:   (d.playersPerso||[]).map(pl => pl.id===playerId   ? {...pl, enduranceSeances:[...(pl.enduranceSeances||[]), seance]} : pl),
    }));
    setImportResult(null);
    alert('Activité importée pour ' + p.name);
  }

  const COULEURS = ['#FFA420','#FF4455','#4CAF50','#38BDF8','#7C6FFF','#FF6B9D','#FFB800'];

  return _h`<div>
    <!-- Onglets -->
    <div style=${{ display:'flex', gap:4, marginBottom:16, background:'rgba(255,255,255,.03)', borderRadius:10, padding:3 }}>
      ${[['groupes','👥 Groupes'],['creer','+ Créer un groupe'],['gpx','📡 Import GPS']].map(([id,label]) => _h`<button key=${id}
        onClick=${()=>setOnglet(id)}
        style=${{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', fontSize:11,
          fontWeight:onglet===id?700:400, background:onglet===id?'rgba(255,255,255,.1)':'transparent',
          color:onglet===id?'#fff':'rgba(255,255,255,.4)' }}>${label}</button>`)}
    </div>

    <!-- GROUPES EXISTANTS -->
    ${onglet === 'groupes' && _h`<div>
      ${groupes.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
        <div style=${{ fontSize:28, marginBottom:8 }}>👥</div>
        <div style=${{ fontWeight:700, marginBottom:4 }}>Aucun groupe créé</div>
        <div style=${{ fontSize:11 }}>Crée des groupes par VMA ou par poste pour planifier tes séances par niveau.</div>
      </div>` : groupes.map(g => {
        const joueursG = players.filter(p => (g.joueurs||[]).includes(p.id));
        const vmas = joueursG.map(p => getVMA(p)).filter(Boolean);
        const avgVMA = vmas.length ? Math.round(vmas.reduce((a,b)=>a+b,0)/vmas.length*10)/10 : null;
        return _h`<div key=${g.id} style=${{ background:g.couleur+'08', border:'2px solid '+g.couleur+'40', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style=${{ fontSize:15, fontWeight:800, color:g.couleur }}>${g.nom}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>
                ${g.critere==='vma'?'VMA '+g.seuilBas+'–'+g.seuilHaut+' km/h':g.critere==='poste'?'Postes: '+(g.postes||[]).join(', '):'Manuel'}
                · Créé le ${g.dateCreation}
              </div>
            </div>
            <button class="btn btn-sm btn-danger" onClick=${()=>deleteGroupe(g.id)}>× Supprimer</button>
          </div>
          ${g.description ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:10, fontStyle:'italic' }}>${g.description}</div>` : null}
          <!-- Stats groupe -->
          <div style=${{ display:'flex', gap:8, marginBottom:10 }}>
            <div style=${{ background:g.couleur+'12', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
              <div style=${{ fontSize:18, fontWeight:800, color:g.couleur }}>${joueursG.length}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)' }}>joueurs</div>
            </div>
            ${avgVMA ? _h`<div style=${{ background:'rgba(56,189,248,.08)', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
              <div style=${{ fontSize:18, fontWeight:800, color:'#38BDF8' }}>${avgVMA}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)' }}>VMA moy. km/h</div>
            </div>` : null}
          </div>
          <!-- Joueurs du groupe -->
          <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
            ${joueursG.map(p => {
              const vma = getVMA(p);
              return _h`<div key=${p.id} style=${{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.05)', borderRadius:20, padding:'3px 10px' }}>
                <span style=${{ fontSize:11, fontWeight:600 }}>${p.name.split(' ')[1]||p.name}</span>
                ${vma ? _h`<span style=${{ fontSize:9, color:g.couleur, fontWeight:700 }}>${vma} km/h</span>` : null}
              </div>`;
            })}
            ${joueursG.length === 0 ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>Aucun joueur correspondant aux critères</span>` : null}
          </div>
        </div>`;
      })}
    </div>`}

    <!-- CRÉER UN GROUPE -->
    ${onglet === 'creer' && _h`<div>
      <div style=${{ marginBottom:12 }}><div class="lbl">Nom du groupe</div>
        <input class="inp" value=${form.nom} onInput=${e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: Groupe A — Haute VMA"/>
      </div>

      <!-- Couleur -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Couleur</div>
        <div style=${{ display:'flex', gap:6 }}>
          ${COULEURS.map(c => _h`<button key=${c} onClick=${()=>setForm(f=>({...f,couleur:c}))}
            style=${{ width:26, height:26, borderRadius:'50%', background:c, cursor:'pointer',
              border: form.couleur===c ? '3px solid #fff' : '1px solid transparent' }}></button>`)}
        </div>
      </div>

      <!-- Critère de groupement -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Critère de groupement</div>
        <div style=${{ display:'flex', gap:8 }}>
          ${[['vma','📊 Par VMA'],['poste','🏐 Par poste'],['manuel','✋ Manuel']].map(([id,label]) => _h`<button key=${id}
            onClick=${()=>setForm(f=>({...f,critere:id}))}
            style=${{ flex:1, padding:'8px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700,
              border: form.critere===id ? '2px solid #FFA420' : '1px solid rgba(255,255,255,.1)',
              background: form.critere===id ? 'rgba(255,164,32,.1)' : 'rgba(255,255,255,.03)',
              color: form.critere===id ? '#FFA420' : 'rgba(255,255,255,.4)' }}>${label}</button>`)}
        </div>
      </div>

      <!-- VMA : seuils -->
      ${form.critere === 'vma' ? _h`<div style=${{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'12px', marginBottom:12 }}>
        <div style=${{ display:'flex', gap:10 }}>
          <div style=${{ flex:1 }}><div class="lbl">VMA min (km/h)</div><input class="inp" type="number" value=${form.seuilBas} onInput=${e=>setForm(f=>({...f,seuilBas:e.target.value}))} placeholder="14"/></div>
          <div style=${{ flex:1 }}><div class="lbl">VMA max (km/h)</div><input class="inp" type="number" value=${form.seuilHaut} onInput=${e=>setForm(f=>({...f,seuilHaut:e.target.value}))} placeholder="18"/></div>
        </div>
        <!-- Aperçu joueurs éligibles -->
        <div style=${{ marginTop:10 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:6 }}>Joueurs dans cette plage :</div>
          <div style=${{ display:'flex', gap:4, flexWrap:'wrap' }}>
            ${players.filter(p => {
              const vma = getVMA(p);
              if (!vma) return false;
              const bas = parseFloat(form.seuilBas)||0, haut = parseFloat(form.seuilHaut)||999;
              return vma >= bas && vma <= haut;
            }).map(p => _h`<span key=${p.id} style=${{ fontSize:10, background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.2)', borderRadius:20, padding:'2px 8px', color:'#FFA420' }}>
              ${p.name.split(' ')[1]||p.name} (${getVMA(p)} km/h)
            </span>`)}
            ${players.filter(p => { const v=getVMA(p); return v && v>=(parseFloat(form.seuilBas)||0) && v<=(parseFloat(form.seuilHaut)||999); }).length === 0
              ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>Aucun joueur · Vérifie les seuils ou les tests VMA</span>`
              : null}
          </div>
        </div>
        <!-- Classement VMA all players -->
        <div style=${{ marginTop:10 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:6 }}>Classement VMA équipe :</div>
          ${[...players].sort((a,b)=>(getVMA(b)||0)-(getVMA(a)||0)).map((p,i) => {
            const vma = getVMA(p);
            if (!vma) return null;
            const col = vma >= 17 ? '#4CAF50' : vma >= 15 ? '#FFA420' : '#FF4455';
            return _h`<div key=${p.id} style=${{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:11 }}>
              <span>${i+1}. ${p.name}</span>
              <span style=${{ color:col, fontWeight:700 }}>${vma} km/h</span>
            </div>`;
          }).filter(Boolean)}
          ${players.every(p=>!getVMA(p)) ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>Aucun test VMA enregistré — va dans Tests pour les saisir</div>` : null}
        </div>
      </div>` : null}

      <!-- Poste -->
      ${form.critere === 'poste' ? _h`<div style=${{ marginBottom:12 }}>
        <div class="lbl">Postes inclus</div>
        <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
          ${POSTES_HANDBALL.map(pos => _h`<button key=${pos}
            onClick=${()=>togglePosteForm(pos)}
            style=${{ padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
              border: form.postes.includes(pos)?'2px solid #38BDF8':'1px solid rgba(255,255,255,.1)',
              background: form.postes.includes(pos)?'rgba(56,189,248,.1)':'rgba(255,255,255,.03)',
              color: form.postes.includes(pos)?'#38BDF8':'rgba(255,255,255,.4)' }}>${pos}</button>`)}
        </div>
        <div style=${{ marginTop:8, fontSize:10, color:'rgba(255,255,255,.4)' }}>
          ${players.filter(p=>form.postes.includes(p.pos)).length} joueur(s) correspondant(s)
        </div>
      </div>` : null}

      <div style=${{ marginBottom:12 }}><div class="lbl">Description (optionnel)</div>
        <textarea class="inp" value=${form.description} onInput=${e=>setForm(f=>({...f,description:e.target.value}))}
          style=${{ resize:'vertical', minHeight:45 }} placeholder="Objectifs du groupe, niveau attendu..."></textarea>
      </div>

      <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${saveGroupe}>
        💾 Créer le groupe
      </button>
    </div>`}

    <!-- IMPORT GPS -->
    ${onglet === 'gpx' && _h`<div>
      <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
        <div style=${{ fontSize:13, fontWeight:800, color:'#38BDF8', marginBottom:6 }}>📡 Import données GPS</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>
          Compatible <strong style=${{ color:'#FC4C02' }}>Strava</strong>, <strong style=${{ color:'#CB0A31' }}>Polar</strong>, <strong style=${{ color:'#1D8BCB' }}>Garmin</strong> et toute montre GPS.
          <br/>Exporte en <strong>.gpx</strong> ou <strong>.tcx</strong> depuis l'appli de ta montre, puis importe ici.
        </div>
        <div style=${{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
          ${[['🟠 Strava','Activité → Exporter GPX'],['🔴 Polar','Polar Flow → Exporter TCX'],['🔵 Garmin','Garmin Connect → Exporter GPX']].map(([app,desc]) => _h`<div key=${app} style=${{ fontSize:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'5px 10px' }}>
            <div style=${{ fontWeight:700 }}>${app}</div>
            <div style=${{ color:'rgba(255,255,255,.4)', marginTop:1 }}>${desc}</div>
          </div>`)}
        </div>
      </div>

      <!-- Choisir joueur -->
      <div style=${{ marginBottom:14 }}>
        <div class="lbl">Joueur concerné</div>
        <select class="inp" value=${selPlayer4GPX||''} onChange=${e=>setSelPlayer4GPX(e.target.value)}>
          <option value="">-- Choisir un joueur --</option>
          ${players.map(p => _h`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
        </select>
      </div>

      <!-- Drop zone -->
      ${selPlayer4GPX ? _h`<div>
        <label style=${{ display:'block', cursor:'pointer' }}>
          <input type="file" accept=".gpx,.tcx,.fit" style=${{ display:'none' }}
            onChange=${e=>handleFileImport(e, selPlayer4GPX)}/>
          <div style=${{ border:'2px dashed rgba(56,189,248,.4)', borderRadius:14, padding:'30px', textAlign:'center',
            background:'rgba(56,189,248,.04)', cursor:'pointer' }}>
            <div style=${{ fontSize:28, marginBottom:8 }}>📂</div>
            <div style=${{ fontSize:13, fontWeight:700, color:'#38BDF8', marginBottom:4 }}>Clique ou dépose ton fichier GPS</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>Formats acceptés : .gpx, .tcx</div>
          </div>
        </label>
      </div>` : null}

      <!-- Résultat import -->
      ${importResult ? _h`<div style=${{ background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.3)', borderRadius:14, padding:'16px', marginTop:16 }}>
        <div style=${{ fontSize:13, fontWeight:800, color:'#4CAF50', marginBottom:12 }}>✓ Activité analysée — ${importResult.name}</div>
        <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
          ${[
            ['Distance', importResult.distance ? importResult.distance+' km' : '—', '#FFA420'],
            ['Durée', importResult.duration ? importResult.duration+' min' : '—', '#38BDF8'],
            ['Vitesse moy.', importResult.avgSpeed ? importResult.avgSpeed+' km/h' : '—', '#4CAF50'],
            ['FC moy.', importResult.avgHR ? importResult.avgHR+' bpm' : '—', '#FF4455'],
            ['FC max', importResult.maxHR ? importResult.maxHR+' bpm' : '—', '#FF6B35'],
            ['Source', importResult.source, '#7C6FFF'],
          ].map(([l,v,c]) => _h`<div key=${l} style=${{ background:c+'08', border:'1px solid '+c+'20', borderRadius:9, padding:'8px', textAlign:'center' }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:3 }}>${l}</div>
            <div style=${{ fontSize:14, fontWeight:800, color:c }}>${v}</div>
          </div>`)}
        </div>
        <div style=${{ display:'flex', gap:8 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${()=>setImportResult(null)}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} onClick=${()=>saveImportedActivity(importResult.playerId)}>
            ✅ Ajouter à la fiche endurance
          </button>
        </div>
      </div>` : null}
    </div>`}
  </div>`;
}


function ChargeGroupeRouter({ allPlayers, db, setDb }) {
  const [tab, setTab] = React.useState('charge');
  return _h`<div>
    <div style=${{ display:'flex', gap:4, marginBottom:16, background:'rgba(255,255,255,.03)', borderRadius:10, padding:3 }}>
      ${[['charge','📊 Charge équipe'],['groupes','👥 Groupes & GPS']].map(([id,label]) => _h`<button key=${id}
        onClick=${()=>setTab(id)}
        style=${{ flex:1, padding:'9px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12,
          fontWeight:tab===id?700:400, background:tab===id?'rgba(255,255,255,.1)':'transparent',
          color:tab===id?'#fff':'rgba(255,255,255,.4)' }}>${label}</button>`)}
    </div>
    ${tab === 'charge' ? React.createElement(ChargeDashboard, { players: allPlayers, clubs: db.clubs || [] }) : null}
    ${tab === 'groupes' ? React.createElement(GroupesNiveauView, { players: allPlayers, db, setDb }) : null}
  </div>`;
}


// ── VUE WEEK-END COMPÉTITION — CYCLE & CHARGE ────────────────────────────────
const CHARGE_CYCLE = {
  menstruation: {
    facteur: 0.75,
    label: 'Charge réduite',
    couleur: '#FF4455',
    icon: '🔴',
    recommandations: [
      'Volume -25% si douleurs présentes',
      'Éviter force max J1-J2, maintenir technique',
      'Échauffement prolongé, mobilité douce',
      'Surveiller signes de fatigue excessive',
      'Privilégier récupération active post-match',
    ],
    matchConseil: 'Performance maintenue si pas de douleurs. Prévoir antalgiques si besoin. Hydratation renforcée.',
  },
  folliculaire: {
    facteur: 1.10,
    label: 'Charge optimale',
    couleur: '#FFA420',
    icon: '🟠',
    recommandations: [
      'Phase idéale : tolérance douleur élevée',
      'Charge compétition normale voire augmentée',
      'Récupération rapide entre les efforts',
      'Bonne adaptation à la pression de match',
    ],
    matchConseil: 'Pic de forme potentiel. Exploiter la montée d\'oestrogène. Intensité maximale possible.',
  },
  ovulation: {
    facteur: 1.05,
    label: 'Pic de performance',
    couleur: '#4CAF50',
    icon: '🟢',
    recommandations: [
      'Pic hormonal = pic de performance',
      'Attention laxité ligamentaire augmentée',
      'Renforcer l\'activation musculaire pré-match',
      'Échauffement proprioceptif renforcé',
    ],
    matchConseil: 'Performances au sommet. Vigilance risque de blessure ligamentaire. Activation neuromusculaire obligatoire.',
  },
  luteale: {
    facteur: 0.85,
    label: 'Charge modérée',
    couleur: '#7C6FFF',
    icon: '🟣',
    recommandations: [
      'Métabolisme élevé : besoin calorique +100-300 kcal',
      'Rétention d\'eau possible : ne pas paniquer sur poids',
      'Gestion émotionnelle : communication renforcée',
      'Récupération plus longue entre efforts intenses',
      'SPM possible : adapter le discours coach',
    ],
    matchConseil: 'Légère baisse d\'endurance. Bien hydrater. Gérer les sautes d\'humeur avec bienveillance.',
  },
};

function getPhaseJoueuse(player) {
  const cycles = player.cycles || [];
  if (!cycles.length) return null;
  const dernier = cycles[cycles.length - 1];
  const debut = new Date(dernier.dateDebut);
  const today = new Date();
  const jourCycle = Math.floor((today - debut) / 86400000) + 1;
  if (jourCycle < 1 || jourCycle > (dernier.duree||28) + 7) return null;

  let phase;
  if (jourCycle <= 5) phase = 'menstruation';
  else if (jourCycle <= 13) phase = 'folliculaire';
  else if (jourCycle <= 15) phase = 'ovulation';
  else if (jourCycle <= (dernier.duree||28)) phase = 'luteale';
  else return null;

  return { phase, jourCycle, duree: dernier.duree||28, dateDebut: dernier.dateDebut };
}

function getPhaseWeekend(player, joursAvant) {
  // Calculer la phase pour dans X jours (week-end)
  const cycles = player.cycles || [];
  if (!cycles.length) return null;
  const dernier = cycles[cycles.length - 1];
  const dateTarget = new Date(Date.now() + joursAvant * 86400000);
  const debut = new Date(dernier.dateDebut);
  const jourTarget = Math.floor((dateTarget - debut) / 86400000) + 1;

  let phase;
  if (jourTarget <= 0) return null;
  if (jourTarget <= 5) phase = 'menstruation';
  else if (jourTarget <= 13) phase = 'folliculaire';
  else if (jourTarget <= 15) phase = 'ovulation';
  else if (jourTarget <= (dernier.duree||28)) phase = 'luteale';
  else {
    // Recalculer avec le prochain cycle estimé
    const joursRestants = jourTarget - (dernier.duree||28);
    if (joursRestants <= 5) phase = 'menstruation';
    else if (joursRestants <= 13) phase = 'folliculaire';
    else if (joursRestants <= 15) phase = 'ovulation';
    else phase = 'luteale';
  }

  return { phase, jourCycle: jourTarget, duree: dernier.duree||28 };
}

function WeekendCompetitionView({ players }) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=dim, 6=sam
  const joursAvantSam = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7 || 7;
  const joursAvantDim = joursAvantSam + 1;

  const datesSam = new Date(today.getTime() + joursAvantSam * 86400000);
  const datesDim = new Date(today.getTime() + joursAvantDim * 86400000);

  const fmtDate = d => d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

  // Filtrer joueuses (genre F) avec cycle enregistré
  const joueuses = players.filter(p => p.genre === 'F');
  const joueusesAvecCycle = joueuses.filter(p => (p.cycles||[]).length > 0);
  const joueuseSansCycle = joueuses.filter(p => !(p.cycles||[]).length);

  // Calculer phase pour chaque joueuse au week-end
  const dataJoueuses = joueusesAvecCycle.map(p => {
    const phaseSam = getPhaseWeekend(p, joursAvantSam);
    const phaseDim = getPhaseWeekend(p, joursAvantDim);
    const phaseActuelle = getPhaseJoueuse(p);
    const infoSam = phaseSam ? CHARGE_CYCLE[phaseSam.phase] : null;
    const infoDim = phaseDim ? CHARGE_CYCLE[phaseDim.phase] : null;
    return { player: p, phaseSam, phaseDim, infoSam, infoDim, phaseActuelle };
  });

  // Grouper par phase samedi
  const groupes = {};
  dataJoueuses.forEach(d => {
    const k = d.phaseSam?.phase || 'inconnu';
    if (!groupes[k]) groupes[k] = [];
    groupes[k].push(d);
  });

  const [selJoueuse, setSelJoueuse] = useState(null);

  return _h`<div style=${{ padding:'20px' }}>
    <!-- Header -->
    <div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:2.5, marginBottom:4 }}>Analyse cycle</div>
      <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>WEEK-END COMPÉTITION</h1>
      <div style=${{ display:'flex', gap:12, fontSize:12, color:'rgba(255,255,255,.5)' }}>
        <span>🗓 ${fmtDate(datesSam)}</span>
        <span>→</span>
        <span>${fmtDate(datesDim)}</span>
      </div>
    </div>

    <!-- Résumé équipe -->
    <div style=${{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
      ${Object.entries(CHARGE_CYCLE).map(([key, info]) => {
        const nb = (groupes[key]||[]).length;
        return _h`<div key=${key} style=${{
          background: info.couleur+'08', border:'1px solid '+info.couleur+'30',
          borderRadius:12, padding:'12px 14px', textAlign:'center'
        }}>
          <div style=${{ fontSize:20, marginBottom:4 }}>${info.icon}</div>
          <div style=${{ fontSize:18, fontWeight:800, color:info.couleur, fontFamily:"'Barlow Condensed',sans-serif" }}>${nb}</div>
          <div style=${{ fontSize:10, color:info.couleur, fontWeight:700, marginBottom:2 }}>${info.label}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${PHASES_CYCLE.find(p=>p.id===key)?.label||key}</div>
        </div>`;
      })}
    </div>

    <!-- Alerte si joueuses en menstruation -->
    ${(groupes['menstruation']||[]).length > 0 ? _h`<div style=${{
      background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.25)',
      borderRadius:12, padding:'12px 16px', marginBottom:16
    }}>
      <div style=${{ fontSize:12, fontWeight:800, color:'#FF4455', marginBottom:6 }}>
        ⚠️ ${(groupes['menstruation']||[]).length} joueuse${(groupes['menstruation']||[]).length>1?'s':''} en phase menstruelle ce week-end
      </div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:8 }}>
        Adapter la communication et prévoir du soutien spécifique.
      </div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${(groupes['menstruation']||[]).map(d => _h`<span key=${d.player.id} style=${{
          fontSize:11, padding:'3px 10px', borderRadius:20,
          background:'rgba(255,68,85,.12)', border:'1px solid rgba(255,68,85,.3)', color:'#FF4455', fontWeight:600
        }}>${d.player.name.split(' ')[1]||d.player.name}</span>`)}
      </div>
    </div>` : null}

    <!-- Tableau joueuses -->
    <div class="card" style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:14 }}>
        Détail par joueuse — Samedi
      </div>
      ${dataJoueuses.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,.3)' }}>
        Aucune joueuse avec cycle enregistré dans ce groupe.
      </div>` : dataJoueuses.map(d => {
        const info = d.infoSam;
        const ph = d.phaseSam;
        const phaseDef = ph ? PHASES_CYCLE.find(p => p.id === ph.phase) : null;
        const isSelected = selJoueuse === d.player.id;

        return _h`<div key=${d.player.id} style=${{
          borderBottom:'1px solid rgba(255,255,255,.06)',
          background: isSelected ? (info?.couleur||'#FFA420')+'06' : 'transparent'
        }}>
          <!-- Ligne principale -->
          <div style=${{ display:'flex', alignItems:'center', gap:12, padding:'10px 4px', cursor:'pointer' }}
            onClick=${() => setSelJoueuse(isSelected ? null : d.player.id)}>
            <!-- Avatar -->
            <div style=${{
              width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex',
              alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12,
              background: info?.couleur ? info.couleur+'25' : 'rgba(255,255,255,.1)',
              color: info?.couleur || '#fff',
              border:'1px solid '+(info?.couleur ? info.couleur+'40' : 'rgba(255,255,255,.2)')
            }}>${d.player.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>

            <!-- Nom + poste -->
            <div style=${{ flex:1 }}>
              <div style=${{ fontSize:12, fontWeight:700 }}>${d.player.name}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${d.player.pos||'—'}</div>
            </div>

            <!-- Phase actuelle -->
            <div style=${{ textAlign:'center', minWidth:80 }}>
              ${ph ? _h`<div>
                <div style=${{ fontSize:16 }}>${info?.icon||'—'}</div>
                <div style=${{ fontSize:9, color:info?.couleur, fontWeight:700 }}>J${ph.jourCycle}/${ph.duree}</div>
                <div style=${{ fontSize:8, color:'rgba(255,255,255,.3)' }}>${phaseDef?.label||ph.phase}</div>
              </div>` : _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.25)' }}>—</div>`}
            </div>

            <!-- Badge charge -->
            <div style=${{ minWidth:100, textAlign:'right' }}>
              ${info ? _h`<div style=${{
                display:'inline-block', padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:800,
                background:info.couleur+'18', border:'1px solid '+info.couleur+'35', color:info.couleur
              }}>${info.label} (×${info.facteur})</div>` : _h`<span style=${{ color:'rgba(255,255,255,.25)', fontSize:11 }}>Non renseigné</span>`}
            </div>

            <span style=${{ color:'rgba(255,255,255,.25)', fontSize:11 }}>${isSelected?'▲':'▼'}</span>
          </div>

          <!-- Détail dépliable -->
          ${isSelected && info ? _h`<div style=${{
            padding:'12px 16px 16px', background:info.couleur+'05',
            borderTop:'1px solid '+info.couleur+'20'
          }}>
            <!-- Conseil match -->
            <div style=${{ background:info.couleur+'10', border:'1px solid '+info.couleur+'25', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
              <div style=${{ fontSize:10, color:info.couleur, fontWeight:800, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>🏆 Conseil match</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.7)', lineHeight:1.6 }}>${info.matchConseil}</div>
            </div>

            <!-- Recommandations charge -->
            <div style=${{ marginBottom:10 }}>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>⚡ Adaptation charge</div>
              ${info.recommandations.map((r,i) => _h`<div key=${i} style=${{ display:'flex', gap:8, marginBottom:5 }}>
                <span style=${{ color:info.couleur, fontSize:12, flexShrink:0 }}>→</span>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.65)', lineHeight:1.4 }}>${r}</span>
              </div>`)}
            </div>

            <!-- Dimanche si différent -->
            ${d.phaseDim && d.phaseDim.phase !== d.phaseSam?.phase ? _h`<div style=${{
              background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, padding:'8px 10px'
            }}>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:3 }}>Dimanche — Phase différente</div>
              <div style=${{ fontSize:11, color:CHARGE_CYCLE[d.phaseDim.phase]?.couleur, fontWeight:700 }}>
                ${CHARGE_CYCLE[d.phaseDim.phase]?.icon} ${PHASES_CYCLE.find(p=>p.id===d.phaseDim.phase)?.label} — J${d.phaseDim.jourCycle}
              </div>
            </div>` : null}
          </div>` : null}
        </div>`;
      })}
    </div>

    <!-- Joueuses sans données cycle -->
    ${joueuseSansCycle.length > 0 ? _h`<div style=${{
      background:'rgba(255,255,255,.02)', border:'1px dashed rgba(255,255,255,.08)',
      borderRadius:12, padding:'12px 16px'
    }}>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:6 }}>
        📋 ${joueuseSansCycle.length} joueuse${joueuseSansCycle.length>1?'s':''} sans cycle enregistré
      </div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${joueuseSansCycle.map(p => _h`<span key=${p.id} style=${{
          fontSize:10, padding:'2px 8px', borderRadius:20,
          background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.4)'
        }}>${p.name.split(' ')[1]||p.name}</span>`)}
      </div>
    </div>` : null}
  </div>`;
}

// Petit générateur de courbe SVG réutilisable (path + points)
function buildLineChart(points, { width=600, height=140, padding=24 } = {}) {
  if (!points || points.length === 0) return null;
  const ys = points.map(p => p.y);
  let yMin = Math.min(...ys), yMax = Math.max(...ys);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const yRange = yMax - yMin;
  const xStep = points.length > 1 ? (width - 2*padding) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = padding + i * xStep;
    const y = height - padding - ((p.y - yMin) / yRange) * (height - 2*padding);
    return { x, y, ...p };
  });
  const path = coords.map((c, i) => (i === 0 ? 'M' : 'L') + c.x.toFixed(1) + ',' + c.y.toFixed(1)).join(' ');
  return { path, coords, yMin, yMax, width, height };
}

function PoidsEquipeView({ players, setDb }) {
  const [selPlayerId, setSelPlayerId] = useState(null);
  const [showSaisieRapide, setShowSaisieRapide] = useState(false);
  const [saisieDate, setSaisieDate] = useState(localDateStr());
  const [saisieValeurs, setSaisieValeurs] = useState({});
  const playersWithData = players.filter(p => (p.masseMesures||[]).length > 0).sort((a,b)=>a.name.localeCompare(b.name));
  const playersNoData = players.filter(p => !(p.masseMesures||[]).length).sort((a,b)=>a.name.localeCompare(b.name));

  // Vue collective : moyenne d'équipe, un point par date de mesure existante (toutes dates confondues),
  // en reprenant pour chaque joueur sa dernière valeur connue à cette date (report de la dernière mesure).
  // CORRECTIF : un point était créé pour CHAQUE date où ne serait-ce qu'UN SEUL joueur avait été
  // pesé, même si tous les autres n'avaient pas encore de nouvelle mesure ce jour-là (report de
  // leur dernière valeur connue). Résultat : une pesée isolée d'un seul joueur en milieu de saison
  // créait un point quasi identique au précédent (puisque 19/20 valeurs n'avaient pas bougé), ce
  // qui donnait une courbe globale qui semblait rester plate malgré un vrai écart entre les deux
  // vraies campagnes de pesée. On ne garde maintenant que les dates où une part significative de
  // l'équipe a réellement été pesée (pas juste reportée), pour que chaque point du graphique
  // reflète une vraie photo d'équipe.
  const dateCoverage = {};
  playersWithData.forEach(p => {
    (p.masseMesures||[]).forEach(m => { if (parseFloat(m.poids)) dateCoverage[m.date] = (dateCoverage[m.date]||0) + 1; });
  });
  const minCoverage = Math.max(2, Math.ceil(playersWithData.length * 0.2));
  const allDates = Object.keys(dateCoverage).filter(d => dateCoverage[d] >= minCoverage).sort();
  const collectifPoints = allDates.map(date => {
    let sum = 0, count = 0;
    playersWithData.forEach(p => {
      const known = p.masseMesures.filter(m => m.date <= date && parseFloat(m.poids));
      if (known.length) { sum += parseFloat(known[known.length-1].poids); count++; }
    });
    return { x: date, y: count ? sum / count : null };
  }).filter(p => p.y !== null);
  const collectifChart = buildLineChart(collectifPoints.map(p => ({ y: p.y, label: p.x })), { width: 680, height: 130 });

  const selPlayer = selPlayerId ? players.find(p => p.id === selPlayerId) : null;

  const playersSorted = [...players].sort((a,b)=>a.name.localeCompare(b.name));

  function saveSaisieRapide() {
    const entries = Object.entries(saisieValeurs).filter(([id, v]) => v && parseFloat(v) > 0);
    if (entries.length === 0) { alert('Aucun poids saisi.'); return; }
    console.log('[Poids] Début saisie rapide,', entries.length, 'joueur(s) :', entries);
    setDb(d => {
      const buildNext = (list, basePath) => list.map(p => {
        const v = saisieValeurs[p.id];
        if (!v || !parseFloat(v)) return p;
        const nouvelleMesure = { id: Date.now().toString() + '_' + p.id, date: saisieDate, poids: v, masseGrasse:'', masseMusc:'', tour_hanches:'', tour_epaule:'', tour_cuisse:'', notes:'' };
        const newMesures = [...(p.masseMesures||[]), nouvelleMesure];
        if (window.__perfhand_db) {
          const fullPath = basePath + p.id + '/masseMesures';
          window.__perfhand_db.ref(fullPath).set(newMesures)
            .then(() => console.log('[Poids] ✅ OK pour', p.name, '(' + fullPath + ')'))
            .catch(e => { console.error('[Poids] ❌ ÉCHEC pour', p.name, e && e.code, e && e.message); alert('Erreur d\'enregistrement pour ' + p.name + ' : ' + (e && e.message || 'inconnue')); });
        } else {
          console.error('[Poids] window.__perfhand_db introuvable — Firebase non connecté !');
        }
        // Lien avec la fiche joueur : le poids du profil suit la dernière pesée (par date)
        const pf = poidsFromMesures(newMesures, parseFloat(p.poids) || 0);
        if (window.__perfhand_db && pf > 0) { try { window.__perfhand_db.ref(basePath + p.id + '/poids').set(pf); } catch(e) {} }
        return { ...p, masseMesures: newMesures, poids: pf };
      });
      return { ...d, playerProfiles: buildNext(d.playerProfiles||[], 'perfhand/playerProfiles/'), playersPerso: buildNext(d.playersPerso||[], 'perfhand/playersPerso/') };
    });
    alert('✅ ' + entries.length + ' poids enregistré' + (entries.length>1?'s':'') + ' pour le ' + fmtDateShort(saisieDate) + ' !');
    setSaisieValeurs({});
    setShowSaisieRapide(false);
  }

  return _h`<div class="page-pad" style=${{ padding:0, maxWidth:'100%', overflowX:'hidden' }}>
    <div style=${{ fontSize:13, fontWeight:800, marginBottom:4 }}>⚖️ Poids équipe — suivi saison</div>
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:16 }}>${players.filter(p=>(p.masseMesures||[]).length>0).length}/${players.length} joueurs avec au moins une mesure</div>

    <!-- Saisie rapide en masse -->
    <div style=${{ marginBottom:16 }}>
      ${!showSaisieRapide ? _h`<button class="btn" style=${{ width:'100%', background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', fontWeight:700 }}
        onClick=${() => setShowSaisieRapide(true)}>✏️ Saisie rapide — entrer les poids de toute l'équipe</button>`
      : _h`<div class="card" style=${{ border:'1px solid rgba(255,164,32,.3)' }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style=${{ fontSize:13, fontWeight:700 }}>✏️ Saisie rapide des poids</div>
            <div style=${{ display:'flex', alignItems:'center', gap:6 }}>
              <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>Date :</span>
              <input type="date" class="inp" style=${{ width:150, fontSize:11, padding:'5px 8px', colorScheme:'dark' }} value=${saisieDate} onInput=${e=>setSaisieDate(e.target.value)}/>
            </div>
          </div>
          <div style=${{ maxHeight:400, overflowY:'auto', marginBottom:12 }}>
            ${playersSorted.map(p => {
              const mesures = (p.masseMesures||[]).filter(m=>parseFloat(m.poids)).sort((a,b)=>a.date.localeCompare(b.date));
              const dernierPoids = mesures.length ? mesures[mesures.length-1].poids : (p.poids || '—');
              return _h`<div key=${p.id} style=${{ display:'flex', alignItems:'center', gap:10, padding:'7px 4px', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                <div style=${{ flex:1, fontSize:12, fontWeight:600 }}>${p.name}</div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', minWidth:70, textAlign:'right' }}>actuel : ${dernierPoids}${dernierPoids!=='—'?' kg':''}</div>
                <input type="number" step="0.1" placeholder="kg"
                  value=${saisieValeurs[p.id]||''}
                  onInput=${e => setSaisieValeurs(v => ({ ...v, [p.id]: e.target.value }))}
                  style=${{ width:70, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, padding:'6px 8px', textAlign:'center', fontFamily:'Inter,sans-serif' }}/>
              </div>`;
            })}
          </div>
          <div style=${{ display:'flex', gap:8 }}>
            <button class="btn" style=${{ flex:1, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
              onClick=${() => { setShowSaisieRapide(false); setSaisieValeurs({}); }}>Annuler</button>
            <button class="btn btn-primary" style=${{ flex:2 }} onClick=${saveSaisieRapide}>✓ Enregistrer les poids saisis</button>
          </div>
        </div>`}
    </div>

    <!-- Graphique collectif -->
    <div class="card" style=${{ marginBottom:16 }}>
      <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>📈 Poids moyen de l'équipe</div>
      ${collectifChart ? _h`<div style=${{ overflowX:'auto' }}>
        <svg viewBox=${"0 0 " + collectifChart.width + " " + collectifChart.height} style=${{ width:'100%', minWidth:400, height:130 }}>
          <path d=${collectifChart.path} fill="none" stroke="#FFA420" stroke-width="2.5"/>
          ${collectifChart.coords.map((c,i) => _h`<circle key=${i} cx=${c.x} cy=${c.y} r="3.5" fill="#FFA420"/>`)}
          <!-- Repères min/max en kg — la courbe est déjà zoomée au maximum sur l'écart réel (du plus
          bas au plus haut point), donc une petite variation en valeur absolue (quelques kg) reste
          visuellement discrète sur un graphique large et bas : ces repères rendent l'écart lisible
          même quand la pente elle-même paraît légère. -->
          <text x=${collectifChart.width-4} y="12" text-anchor="end" font-size="10" fill="rgba(255,255,255,.35)">${collectifChart.yMax.toFixed(1)} kg</text>
          <text x=${collectifChart.width-4} y=${collectifChart.height-4} text-anchor="end" font-size="10" fill="rgba(255,255,255,.35)">${collectifChart.yMin.toFixed(1)} kg</text>
        </svg>
        <div style=${{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>
          <span>${collectifPoints[0] && fmtDateShort(collectifPoints[0].x)}</span>
          <span>${collectifPoints[collectifPoints.length-1] && fmtDateShort(collectifPoints[collectifPoints.length-1].x)}</span>
        </div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:6 }}>
          Actuel : <b style=${{ color:'#FFA420' }}>${collectifPoints[collectifPoints.length-1].y.toFixed(1)} kg</b>
          ${collectifPoints.length>1 ? _h`<span> · Début saison : ${collectifPoints[0].y.toFixed(1)} kg (${(collectifPoints[collectifPoints.length-1].y-collectifPoints[0].y)>=0?'+':''}${(collectifPoints[collectifPoints.length-1].y-collectifPoints[0].y).toFixed(1)} kg)</span>` : null}
        </div>
      </div>` : null}
    </div>

    <!-- Table individuelle -->
    <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>👤 Suivi individuel</div>
    <div style=${{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
      ${playersWithData.map(p => {
        const mesures = [...p.masseMesures].filter(m=>parseFloat(m.poids)).sort((a,b)=>a.date.localeCompare(b.date));
        if (!mesures.length) return null;
        const first = parseFloat(mesures[0].poids), last = parseFloat(mesures[mesures.length-1].poids);
        const delta = last - first;
        const isExp = selPlayerId === p.id;
        const chart = isExp ? buildLineChart(mesures.map(m => ({ y: parseFloat(m.poids), label: m.date })), { width: 600, height: 110 }) : null;
        return _h`<div key=${p.id} style=${{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, overflow:'hidden' }}>
          <div style=${{ padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick=${() => setSelPlayerId(isExp ? null : p.id)}>
            <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
              <${Avatar} name=${p.name} color='#4CAF50' size=${26}/>
              <div>
                <div style=${{ fontSize:12, fontWeight:700 }}>${p.name}</div>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${mesures.length} mesure${mesures.length>1?'s':''} · dernière le ${fmtDateShort(mesures[mesures.length-1].date)}</div>
              </div>
            </div>
            <div style=${{ textAlign:'right' }}>
              <div style=${{ fontSize:14, fontWeight:800 }}>${last} kg</div>
              <div style=${{ fontSize:10, fontWeight:700, color: delta>0.3?'#FF4455':delta<-0.3?'#38BDF8':'rgba(255,255,255,.35)' }}>${delta>=0?'+':''}${delta.toFixed(1)} kg</div>
            </div>
          </div>
          ${isExp && chart ? _h`<div style=${{ padding:'0 14px 14px' }}>
            <div style=${{ overflowX:'auto' }}>
              <svg viewBox=${"0 0 " + chart.width + " " + chart.height} style=${{ width:'100%', minWidth:350, height:110 }}>
                <path d=${chart.path} fill="none" stroke="#4CAF50" stroke-width="2.5"/>
                ${chart.coords.map((c,i) => _h`<circle key=${i} cx=${c.x} cy=${c.y} r="3.5" fill="#4CAF50"/>`)}
              </svg>
            </div>
            <div style=${{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)' }}>
              <span>${fmtDateShort(mesures[0].date)} — ${mesures[0].poids} kg</span>
              <span>${fmtDateShort(mesures[mesures.length-1].date)} — ${mesures[mesures.length-1].poids} kg</span>
            </div>
          </div>` : null}
        </div>`;
      })}
    </div>

    ${playersNoData.length > 0 ? _h`<details>
      <summary style=${{ fontSize:11, color:'rgba(255,255,255,.3)', cursor:'pointer' }}>${playersNoData.length} joueur${playersNoData.length>1?'s':''} sans aucune mesure</summary>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
        ${playersNoData.map(p => _h`<span key=${p.id} style=${{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.4)' }}>${p.name}</span>`)}
      </div>
    </details>` : null}
  </div>`;
}
function fmtDateShort(d) {
  if (!d) return '';
  try { const dt = new Date(d); return dt.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }); } catch(e) { return d; }
}

function VMAEquipeView({ players, setDb }) {
  const [selPlayerId, setSelPlayerId] = useState(null);
  const [showSaisieRapide, setShowSaisieRapide] = useState(false);
  const [saisieDate, setSaisieDate] = useState(localDateStr());
  const [saisieValeurs, setSaisieValeurs] = useState({});
  const playersSorted = [...players].sort((a,b)=>a.name.localeCompare(b.name));

  function getViftTests(p) {
    const source1 = (p.testsEndurance||[]).map(t => ({...t, __source:'testsEndurance'})).filter(t => (t.testId === '30_15_ift' || t.testType === '30_15_ift') && parseFloat(t.vitesse_finale) > 0);
    const source2 = (p.tests||[]).map(t => ({...t, __source:'tests'})).filter(t => (t.testId === '30_15_ift' || t.testType === '30_15_ift') && parseFloat(t.vitesse_finale) > 0);
    return [...source1, ...source2].sort((a,b) => (a.date||'').localeCompare(b.date||''));
  }

  function deleteViftTest(p, testToDelete) {
    if (!confirm('Supprimer ce test 30-15 IFT (' + testToDelete.vitesse_finale + ' km/h, ' + fmtDateShort(testToDelete.date) + ') de ' + p.name + ' ?')) return;
    const field = testToDelete.__source; // 'testsEndurance' ou 'tests'
    const newList = (p[field]||[]).filter(t => t.id !== testToDelete.id);
    if (window.__perfhand_db && p.id) {
      const path = p.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
      let safe; try { safe = JSON.parse(JSON.stringify(newList)); } catch(e) { safe = newList; }
      window.__perfhand_db.ref(path + p.id + '/' + field).set(safe);
    }
    setDb(d => {
      function upd(pl) { return pl.id === p.id ? { ...pl, [field]: newList } : pl; }
      return { ...d, playerProfiles: (d.playerProfiles||[]).map(upd), playersPerso: (d.playersPerso||[]).map(upd) };
    });
  }

  function saveSaisieRapide() {
    const entries = Object.entries(saisieValeurs).filter(([id, v]) => v && parseFloat(v) > 0);
    if (entries.length === 0) { alert('Aucune VIFT saisie.'); return; }
    console.log('[VMA] Début saisie rapide,', entries.length, 'joueur(s) :', entries);
    setDb(d => {
      const buildNext = (list, basePath) => list.map(p => {
        const v = saisieValeurs[p.id];
        if (!v || !parseFloat(v)) return p;
        const nouveauTest = { id: Date.now() + '_' + p.id, testId:'30_15_ift', testNom:'30-15 IFT', date: saisieDate, vitesse_finale: v };
        const newTests = [...(p.testsEndurance||[]), nouveauTest];
        if (window.__perfhand_db) {
          const fullPath = basePath + p.id + '/testsEndurance';
          console.log('[VMA] Écriture →', fullPath, newTests);
          window.__perfhand_db.ref(fullPath).set(newTests)
            .then(() => console.log('[VMA] ✅ OK pour', p.name, '(' + fullPath + ')'))
            .catch(e => { console.error('[VMA] ❌ ÉCHEC pour', p.name, e && e.code, e && e.message); alert('Erreur d\'enregistrement pour ' + p.name + ' : ' + (e && e.message || 'inconnue')); });
        } else {
          console.error('[VMA] window.__perfhand_db introuvable — Firebase non connecté !');
        }
        return { ...p, testsEndurance: newTests };
      });
      return { ...d, playerProfiles: buildNext(d.playerProfiles||[], 'perfhand/playerProfiles/'), playersPerso: buildNext(d.playersPerso||[], 'perfhand/playersPerso/') };
    });
    alert('✅ ' + entries.length + ' VIFT enregistrée' + (entries.length>1?'s':'') + ' pour le ' + fmtDateShort(saisieDate) + ' ! (vérifie la console pour la confirmation d\'écriture)');
    setSaisieValeurs({});
    setShowSaisieRapide(false);
  }

  const playersWithData = playersSorted.filter(p => getViftTests(p).length > 0);
  const playersNoData = playersSorted.filter(p => getViftTests(p).length === 0);

  // Même correctif que pour le poids équipe : ne garder que les dates où une part significative
  // de l'équipe a réellement passé le test ce jour-là, pour éviter qu'un test isolé d'un seul
  // joueur ne crée un point quasi plat qui écrase visuellement l'évolution réelle du groupe.
  const viftCoverage = {};
  playersWithData.forEach(p => {
    getViftTests(p).forEach(t => { viftCoverage[t.date] = (viftCoverage[t.date]||0) + 1; });
  });
  const minViftCoverage = Math.max(2, Math.ceil(playersWithData.length * 0.2));
  const allDates = Object.keys(viftCoverage).filter(d => viftCoverage[d] >= minViftCoverage).sort();
  const collectifPoints = allDates.map(date => {
    let sum = 0, count = 0;
    playersWithData.forEach(p => {
      const known = getViftTests(p).filter(t => t.date <= date);
      if (known.length) { sum += parseFloat(known[known.length-1].vitesse_finale); count++; }
    });
    return { x: date, y: count ? sum / count : null };
  }).filter(p => p.y !== null);
  const collectifChart = collectifPoints.length ? buildLineChart(collectifPoints.map(p => ({ y: p.y, label: p.x })), { width: 680, height: 130 }) : null;

  return _h`<div class="page-pad" style=${{ padding:0, maxWidth:'100%', overflowX:'hidden' }}>
    <div style=${{ fontSize:13, fontWeight:800, marginBottom:4 }}>⚡ VMA équipe — Test 30-15 IFT (VIFT)</div>
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:16 }}>${playersWithData.length}/${players.length} joueurs avec au moins un test</div>

    <!-- Saisie rapide en masse -->
    <div style=${{ marginBottom:16 }}>
      ${!showSaisieRapide ? _h`<button class="btn" style=${{ width:'100%', background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.3)', color:'#FF4455', fontWeight:700 }}
        onClick=${() => setShowSaisieRapide(true)}>✏️ Saisie rapide — entrer la VIFT de toute l'équipe</button>`
      : _h`<div class="card" style=${{ border:'1px solid rgba(255,68,85,.3)' }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style=${{ fontSize:13, fontWeight:700 }}>✏️ Saisie rapide — 30-15 IFT (VIFT)</div>
            <div style=${{ display:'flex', alignItems:'center', gap:6 }}>
              <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>Date :</span>
              <input type="date" class="inp" style=${{ width:150, fontSize:11, padding:'5px 8px', colorScheme:'dark' }} value=${saisieDate} onInput=${e=>setSaisieDate(e.target.value)}/>
            </div>
          </div>
          <div style=${{ maxHeight:400, overflowY:'auto', marginBottom:12 }}>
            ${playersSorted.map(p => {
              const tests = getViftTests(p);
              const derniereVift = tests.length ? tests[tests.length-1].vitesse_finale : '—';
              return _h`<div key=${p.id} style=${{ display:'flex', alignItems:'center', gap:10, padding:'7px 4px', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                <div style=${{ flex:1, fontSize:12, fontWeight:600 }}>${p.name}</div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', minWidth:80, textAlign:'right' }}>actuel : ${derniereVift}${derniereVift!=='—'?' km/h':''}</div>
                <input type="number" step="0.1" placeholder="km/h"
                  value=${saisieValeurs[p.id]||''}
                  onInput=${e => setSaisieValeurs(v => ({ ...v, [p.id]: e.target.value }))}
                  style=${{ width:80, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, padding:'6px 8px', textAlign:'center', fontFamily:'Inter,sans-serif' }}/>
              </div>`;
            })}
          </div>
          <div style=${{ display:'flex', gap:8 }}>
            <button class="btn" style=${{ flex:1, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
              onClick=${() => { setShowSaisieRapide(false); setSaisieValeurs({}); }}>Annuler</button>
            <button class="btn btn-primary" style=${{ flex:2 }} onClick=${saveSaisieRapide}>✓ Enregistrer les VIFT saisies</button>
          </div>
        </div>`}
    </div>

    <!-- Graphique collectif -->
    ${collectifChart ? _h`<div class="card" style=${{ marginBottom:16 }}>
      <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>📈 VIFT moyenne de l'équipe</div>
      <div style=${{ overflowX:'auto' }}>
        <svg viewBox=${"0 0 " + collectifChart.width + " " + collectifChart.height} style=${{ width:'100%', minWidth:400, height:130 }}>
          <path d=${collectifChart.path} fill="none" stroke="#FF4455" stroke-width="2.5"/>
          ${collectifChart.coords.map((c,i) => _h`<circle key=${i} cx=${c.x} cy=${c.y} r="3.5" fill="#FF4455"/>`)}
          <text x=${collectifChart.width-4} y="12" text-anchor="end" font-size="10" fill="rgba(255,255,255,.35)">${collectifChart.yMax.toFixed(1)} km/h</text>
          <text x=${collectifChart.width-4} y=${collectifChart.height-4} text-anchor="end" font-size="10" fill="rgba(255,255,255,.35)">${collectifChart.yMin.toFixed(1)} km/h</text>
        </svg>
        <div style=${{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2 }}>
          <span>${fmtDateShort(collectifPoints[0].x)}</span>
          <span>${fmtDateShort(collectifPoints[collectifPoints.length-1].x)}</span>
        </div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:6 }}>
          Actuel : <b style=${{ color:'#FF4455' }}>${collectifPoints[collectifPoints.length-1].y.toFixed(1)} km/h</b>
          ${collectifPoints.length>1 ? _h`<span> · Début saison : ${collectifPoints[0].y.toFixed(1)} km/h (${(collectifPoints[collectifPoints.length-1].y-collectifPoints[0].y)>=0?'+':''}${(collectifPoints[collectifPoints.length-1].y-collectifPoints[0].y).toFixed(1)} km/h)</span>` : null}
        </div>
      </div>
    </div>` : null}

    <!-- Table individuelle -->
    <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>👤 Suivi individuel</div>
    <div style=${{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
      ${playersWithData.map(p => {
        const tests = getViftTests(p);
        const first = parseFloat(tests[0].vitesse_finale), last = parseFloat(tests[tests.length-1].vitesse_finale);
        const delta = last - first;
        const isExp = selPlayerId === p.id;
        const chart = isExp ? buildLineChart(tests.map(t => ({ y: parseFloat(t.vitesse_finale), label: t.date })), { width: 600, height: 110 }) : null;
        return _h`<div key=${p.id} style=${{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, overflow:'hidden' }}>
          <div style=${{ padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onClick=${() => setSelPlayerId(isExp ? null : p.id)}>
            <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
              <${Avatar} name=${p.name} color='#FF4455' size=${26}/>
              <div>
                <div style=${{ fontSize:12, fontWeight:700 }}>${p.name}</div>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${tests.length} test${tests.length>1?'s':''} · dernier le ${fmtDateShort(tests[tests.length-1].date)}</div>
              </div>
            </div>
            <div style=${{ textAlign:'right' }}>
              <div style=${{ fontSize:14, fontWeight:800 }}>${last} km/h</div>
              <div style=${{ fontSize:10, fontWeight:700, color: delta>0.2?'#4CAF50':delta<-0.2?'#FF4455':'rgba(255,255,255,.35)' }}>${delta>=0?'+':''}${delta.toFixed(1)} km/h</div>
            </div>
          </div>
          ${isExp && chart ? _h`<div style=${{ padding:'0 14px 14px' }}>
            <div style=${{ overflowX:'auto' }}>
              <svg viewBox=${"0 0 " + chart.width + " " + chart.height} style=${{ width:'100%', minWidth:350, height:110 }}>
                <path d=${chart.path} fill="none" stroke="#4CAF50" stroke-width="2.5"/>
                ${chart.coords.map((c,i) => _h`<circle key=${i} cx=${c.x} cy=${c.y} r="3.5" fill="#4CAF50"/>`)}
              </svg>
            </div>
            <div style=${{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)', marginBottom:10 }}>
              <span>${fmtDateShort(tests[0].date)} — ${tests[0].vitesse_finale} km/h</span>
              <span>${fmtDateShort(tests[tests.length-1].date)} — ${tests[tests.length-1].vitesse_finale} km/h</span>
            </div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Historique — modifier/supprimer</div>
            <div style=${{ display:'flex', flexDirection:'column', gap:4 }}>
              ${[...tests].reverse().map((t, i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(255,255,255,.03)', borderRadius:8 }}>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>${fmtDateShort(t.date)}</span>
                <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style=${{ fontSize:12, fontWeight:700 }}>${t.vitesse_finale} km/h</span>
                  <button title="Supprimer ce test" onClick=${(e) => { e.stopPropagation(); deleteViftTest(p, t); }}
                    style=${{ background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.3)', color:'#FF4455', borderRadius:6, padding:'2px 7px', fontSize:11, cursor:'pointer' }}>×</button>
                </div>
              </div>`)}
            </div>
          </div>` : null}
        </div>`;
      })}
    </div>

    ${playersNoData.length > 0 ? _h`<details>
      <summary style=${{ fontSize:11, color:'rgba(255,255,255,.3)', cursor:'pointer' }}>${playersNoData.length} joueur${playersNoData.length>1?'s':''} sans aucun test</summary>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
        ${playersNoData.map(p => _h`<span key=${p.id} style=${{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.4)' }}>${p.name}</span>`)}
      </div>
    </details>` : null}
  </div>`;
}

function VolumeEquipeView({ players }) {
  if (!players || !players.length) return _h`<div style=${{ padding:40, textAlign:"center", color:"rgba(255,255,255,.3)" }}>Aucun joueur à afficher.</div>`;

  const [cat, setCat] = useState('muscu');

  const now = new Date();
  const seasonStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1; // 1er juillet → 30 juin (inclut la prépa)

  // Liste des mois de la saison, de juillet jusqu'au mois en cours
  const months = [];
  { let y = seasonStartYear, m = 6;
    while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) {
      months.push({ y, m, label: (MOIS_FR[m]||'').slice(0,3).charAt(0) + (MOIS_FR[m]||'').slice(1,3).toLowerCase() });
      m++; if (m > 11) { m = 0; y++; }
    }
  }

  function countForMonth(arr, dateField, y, m) {
    return (arr||[]).filter(s => {
      const d = s && s[dateField];
      if (!d) return false;
      const ds = String(d).slice(0,10);
      const dy = parseInt(ds.slice(0,4)), dm = parseInt(ds.slice(5,7)) - 1;
      return dy === y && dm === m;
    }).length;
  }

  function dataFor(p) {
    const muscuArr = p.muscuSeances || [];
    const enduArr = p.enduranceSeances || [];
    const handballBilans = (p.bilans||[]).filter(b => b.type === 'Collectif' || b.type === 'Match');
    const src = cat === 'muscu' ? [muscuArr,'dateFaite'] : cat === 'endu' ? [enduArr,'dateFaite'] : [handballBilans,'date'];
    const perMonth = months.map(mo => countForMonth(src[0], src[1], mo.y, mo.m));
    const total = perMonth.reduce((a,b)=>a+b,0);
    return { perMonth, total };
  }

  const rows = players.map(p => ({ player: p, d: dataFor(p) }))
    .sort((a,b) => a.player.name.localeCompare(b.player.name));

  const totauxParMois = months.map((mo, i) => rows.reduce((s, r) => s + r.d.perMonth[i], 0));
  const totalGeneral = totauxParMois.reduce((a,b)=>a+b,0);

  const CATS = [
    { id:'muscu', label:'🏋️ Musculation', color:'#FF4455' },
    { id:'endu',  label:'🏃 Endurance',    color:'#38BDF8' },
    { id:'hand',  label:'🏐 Handball',     color:'#7C6FFF' },
  ];
  const curColor = CATS.find(c=>c.id===cat).color;
  const gridCols = '1.6fr ' + months.map(()=>'0.6fr').join(' ') + ' 0.7fr';

  return _h`<div class="page-pad" style=${{ padding:0, maxWidth:'100%', overflowX:'hidden' }}>
    <div style=${{ fontSize:13, fontWeight:800, marginBottom:4 }}>📈 Volume de séances — comparatif équipe</div>
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:12 }}>Détail mois par mois depuis le 1er juillet ${seasonStartYear} (prépa incluse) — Handball = bilans "🏃 Terrain" Collectif/Match</div>

    <div style=${{ display:'flex', gap:6, marginBottom:14 }}>
      ${CATS.map(c => _h`<button key=${c.id} class="btn btn-sm" onClick=${() => setCat(c.id)}
        style=${{ background: cat===c.id ? c.color+'20' : 'rgba(255,255,255,.04)', border:'1px solid '+(cat===c.id?c.color+'50':'rgba(255,255,255,.1)'), color: cat===c.id?c.color:'rgba(255,255,255,.4)', fontWeight: cat===c.id?800:400 }}
      >${c.label}</button>`)}
    </div>

    <div style=${{ overflowX:'auto' }}>
      <div style=${{ minWidth: 260 + months.length*60 }}>
        <!-- Header -->
        <div style=${{ display:'grid', gridTemplateColumns:gridCols, gap:4, padding:'0 4px 8px', fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div>Joueur</div>
          ${months.map(mo => _h`<div key=${mo.label} style=${{ textAlign:'center' }}>${mo.label}</div>`)}
          <div style=${{ textAlign:'center', fontWeight:800, color:curColor }}>Total</div>
        </div>

        <!-- Total équipe -->
        <div style=${{ display:'grid', gridTemplateColumns:gridCols, gap:4, alignItems:'center', padding:'8px 4px', background:'rgba(255,255,255,.03)', borderRadius:8, margin:'6px 0' }}>
          <div style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.6)' }}>TOTAL ÉQUIPE</div>
          ${totauxParMois.map((v,i) => _h`<div key=${i} style=${{ textAlign:'center', fontSize:13, fontWeight:800, color: v>0?curColor:'rgba(255,255,255,.15)' }}>${v}</div>`)}
          <div style=${{ textAlign:'center', fontSize:14, fontWeight:800, color:curColor }}>${totalGeneral}</div>
        </div>

        <!-- Lignes joueurs -->
        ${rows.map(({player:p, d}) => _h`<div key=${p.id} style=${{
          display:'grid', gridTemplateColumns:gridCols, gap:4, alignItems:'center',
          padding:'9px 4px', borderBottom:'1px solid rgba(255,255,255,.05)'
        }}>
          <div style=${{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
            <${Avatar} name=${p.name} color='#4CAF50' size=${24}/>
            <div style=${{ minWidth:0 }}>
              <div style=${{ fontSize:12, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>${p.name}</div>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${p.pos||''}</div>
            </div>
          </div>
          ${d.perMonth.map((v,i) => _h`<div key=${i} style=${{ textAlign:'center', fontSize:12, fontWeight: v>0?700:400, color: v>0?'#fff':'rgba(255,255,255,.15)' }}>${v}</div>`)}
          <div style=${{ textAlign:'center', fontSize:13, fontWeight:800, color: d.total>0?curColor:'rgba(255,255,255,.15)' }}>${d.total}</div>
        </div>`)}
      </div>
    </div>
  </div>`;
}
