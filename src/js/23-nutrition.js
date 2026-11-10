

function CompositionView({ player, setDb, isCoach }) {
  // Triées par date : « dernière mesure » = la plus récente, comme dans l'onglet Poids équipe
  const mesures = [...(player.masseMesures || [])].sort((x, y) => String(x.date || '').localeCompare(String(y.date || '')));
  const [showAddM, setShowAddM] = React.useState(false);
  const [formM, setFormM] = React.useState({ date: localDateStr(), poids:'', masseGrasse:'', masseMusc:'', tour_hanches:'', tour_epaule:'', tour_cuisse:'', notes:'' });

  function writeMasseMesuresDirect(list) {
    if (!window.__perfhand_db || !player || !player.id) return;
    const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
    let safe; try { safe = JSON.parse(JSON.stringify(list)); } catch(e) { safe = list; }
    window.__perfhand_db.ref(path + player.id + '/masseMesures').set(safe);
  }

  function writePoidsDirect(val) {
    if (!window.__perfhand_db || !player || !player.id || !(val > 0)) return;
    const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
    try { window.__perfhand_db.ref(path + player.id + '/poids').set(val); } catch(e) {}
  }
  function saveMesure() {
    const updated = [...mesures, { ...formM, id: Date.now().toString() }];
    writeMasseMesuresDirect(updated);
    const pf = poidsFromMesures(updated, parseFloat(player.poids) || 0);
    writePoidsDirect(pf);
    setDb(d => ({
      ...d,
      playersPerso:   (d.playersPerso||[]).map(p => p.id===player.id ? {...p, masseMesures:updated, poids:pf} : p),
      playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, masseMesures:updated, poids:pf} : p),
    }));
    setShowAddM(false);
    setFormM({ date: localDateStr(), poids:'', masseGrasse:'', masseMusc:'', tour_hanches:'', tour_epaule:'', tour_cuisse:'', notes:'' });
  }
  function delMesure(id) {
    const updated = mesures.filter(m => m.id !== id);
    writeMasseMesuresDirect(updated);
    const pf = poidsFromMesures(updated, parseFloat(player.poids) || 0);
    writePoidsDirect(pf);
    setDb(d => ({
      ...d,
      playersPerso:   (d.playersPerso||[]).map(p => p.id===player.id ? {...p, masseMesures:updated, poids:pf} : p),
      playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, masseMesures:updated, poids:pf} : p),
    }));
  }

  const derniere = mesures.length ? mesures[mesures.length-1] : null;
  const precedente = mesures.length > 1 ? mesures[mesures.length-2] : null;

  function imc(poids, taille) {
    if (!poids || !taille) return null;
    return Math.round(parseFloat(poids) / Math.pow(parseFloat(taille)/100, 2) * 10) / 10;
  }

  return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <div style=${{ fontSize:14, fontWeight:800 }}>Composition corporelle</div>
      ${isCoach ? _h`<button class="btn btn-primary btn-sm" onClick=${() => setShowAddM(!showAddM)}>
        ${showAddM ? '✕' : '+ Mesure'}
      </button>` : null}
    </div>

    ${showAddM ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginBottom:16 }}>
      <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        <div><div class="lbl">Date</div><input class="inp" type="date" value=${formM.date} onInput=${e=>setFormM(f=>({...f,date:e.target.value}))}/></div>
        <div><div class="lbl">Poids (kg)</div><input class="inp" type="number" step="0.1" value=${formM.poids} onInput=${e=>setFormM(f=>({...f,poids:e.target.value}))} placeholder="75.5"/></div>
        <div><div class="lbl">Masse grasse (%)</div><input class="inp" type="number" step="0.1" value=${formM.masseGrasse} onInput=${e=>setFormM(f=>({...f,masseGrasse:e.target.value}))} placeholder="15.0"/></div>
        <div><div class="lbl">Masse musculaire (kg)</div><input class="inp" type="number" step="0.1" value=${formM.masseMusc} onInput=${e=>setFormM(f=>({...f,masseMusc:e.target.value}))} placeholder="35.0"/></div>
        <div><div class="lbl">Tour de hanches (cm)</div><input class="inp" type="number" value=${formM.tour_hanches} onInput=${e=>setFormM(f=>({...f,tour_hanches:e.target.value}))} placeholder="95"/></div>
        <div><div class="lbl">Tour d'épaule (cm)</div><input class="inp" type="number" value=${formM.tour_epaule} onInput=${e=>setFormM(f=>({...f,tour_epaule:e.target.value}))} placeholder="110"/></div>
        <div><div class="lbl">Tour de cuisse (cm)</div><input class="inp" type="number" value=${formM.tour_cuisse} onInput=${e=>setFormM(f=>({...f,tour_cuisse:e.target.value}))} placeholder="55"/></div>
      </div>
      <div style=${{ marginBottom:10 }}><div class="lbl">Notes</div><input class="inp" value=${formM.notes} onInput=${e=>setFormM(f=>({...f,notes:e.target.value}))} placeholder="Contexte, méthode de mesure..."/></div>
      <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${saveMesure}>Enregistrer</button>
    </div>` : null}

    ${derniere ? _h`<div>
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:16 }}>
        ${[
          ['Poids', derniere.poids ? derniere.poids+' kg' : '—', '#FFA420', precedente?.poids ? parseFloat(derniere.poids)-parseFloat(precedente.poids) : null, false],
          ['Masse grasse', derniere.masseGrasse ? derniere.masseGrasse+'%' : '—', '#FF6B35', precedente?.masseGrasse ? parseFloat(derniere.masseGrasse)-parseFloat(precedente.masseGrasse) : null, true],
          ['Masse muscu', derniere.masseMusc ? derniere.masseMusc+' kg' : '—', '#4CAF50', precedente?.masseMusc ? parseFloat(derniere.masseMusc)-parseFloat(precedente.masseMusc) : null, false],
        ].map(([l,v,col,delta,lowerBetter]) => _h`<div key=${l} style=${{ background:col+'10', border:'1px solid '+col+'25', borderRadius:11, padding:'10px', textAlign:'center' }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>${l}</div>
          <div style=${{ fontSize:20, fontWeight:800, color:col, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
          ${delta !== null ? _h`<div style=${{ fontSize:9, color: (lowerBetter ? delta < 0 : delta > 0) ? '#4CAF50' : '#FF4455', marginTop:2 }}>
            ${delta > 0 ? '+' : ''}${Math.round(delta*10)/10}
          </div>` : null}
        </div>`)}
      </div>
      ${derniere.poids && player.taille ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
        <div style=${{ display:'flex', justifyContent:'space-between' }}>
          <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>IMC</span>
          <span style=${{ fontSize:13, fontWeight:800, color:'#FFA420' }}>${imc(derniere.poids,player.taille)} kg/m²</span>
        </div>
      </div>` : null}
      ${mesures.length > 0 ? _h`<div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Historique</div>
        ${[...mesures].reverse().map(m => _h`<div key=${m.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'10px 13px', marginBottom:6 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style=${{ fontSize:12, fontWeight:700 }}>${m.date}</div>
            <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
              <div style=${{ display:'flex', gap:10, fontSize:11 }}>
                ${m.poids ? _h`<span style=${{ color:'#FFA420' }}>${m.poids} kg</span>` : null}
                ${m.masseGrasse ? _h`<span style=${{ color:'#FF6B35' }}>${m.masseGrasse}% MG</span>` : null}
                ${m.masseMusc ? _h`<span style=${{ color:'#4CAF50' }}>${m.masseMusc} kg MM</span>` : null}
              </div>
              ${isCoach ? _h`<button class="btn btn-sm btn-danger" style=${{ padding:'2px 7px' }} onClick=${()=>delMesure(m.id)}>×</button>` : null}
            </div>
          </div>
        </div>`)}
      </div>` : null}
    </div>` : _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
      <div style=${{ fontSize:28, marginBottom:8 }}>📊</div>
      <div style=${{ fontWeight:700, marginBottom:4 }}>Aucune mesure enregistrée</div>
      ${isCoach ? _h`<div style=${{ fontSize:11 }}>Clique sur "+ Mesure" pour ajouter la première mesure.</div>` : _h`<div style=${{ fontSize:11 }}>Ton prépa physique peut enregistrer tes mesures ici.</div>`}
    </div>`}
  </div>`;
}

// Carte d'un créneau de repas avec plusieurs propositions au choix (prise de masse, sèche, etc.)
function RepasSlotCard({ slot, addEntry }) {
  const [sel, setSel] = useState(0);
  const options = slot.options || [];
  const r = options[sel] || options[0] || {};
  return _h`<div style=${{
    background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)',
    borderRadius:12, padding:'12px 14px', marginBottom:9
  }}>
    <div style=${{ display:'flex', gap:12, alignItems:'center' }}>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.3)', minWidth:46, fontWeight:700 }}>${slot.h}</div>
      <div style=${{ flex:1, minWidth:0 }}>
        <div style=${{ fontSize:12, fontWeight:700 }}>${r.m || slot.cat}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:2, lineHeight:1.4 }}>${r.a}</div>
      </div>
      <div style=${{ flexShrink:0, textAlign:'right' }}>
        <div style=${{ fontSize:13, color:'#FFB800', fontWeight:700 }}>${r.kcal} kcal</div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:2 }}>P${r.p}·G${r.g}·L${r.l}</div>
      </div>
    </div>
    ${options.length > 1 ? _h`<div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginTop:9 }}>
      ${options.map((o,oi) => _h`<button key=${oi}
        onClick=${() => setSel(oi)}
        style=${{
          padding:'3px 10px', borderRadius:20, fontSize:10, cursor:'pointer', fontFamily:'Inter,sans-serif',
          border: sel===oi ? '1px solid rgba(255,164,32,.5)' : '1px solid rgba(255,255,255,.1)',
          background: sel===oi ? 'rgba(255,164,32,.14)' : 'rgba(255,255,255,.03)',
          color: sel===oi ? '#FFA420' : 'rgba(255,255,255,.4)',
          fontWeight: sel===oi ? 700 : 400,
        }}
      >Option ${oi+1}</button>`)}
    </div>` : null}
    ${r.info ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', borderTop:'1px solid rgba(255,255,255,.05)', marginTop:8, paddingTop:8, lineHeight:1.6 }}>ℹ️ ${r.info}</div>` : null}
    <!-- Bouton ajouter ce repas au journal -->
    <button
      onClick=${() => {
        addEntry({ nom:r.m+' (plan)', kcal:r.kcal, p:r.p, g:r.g, l:r.l, u:'portion', qte:1 });
      }}
      style=${{ marginTop:8, background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', color:'#FFA420', borderRadius:8, padding:'4px 12px', fontSize:11, cursor:'pointer', fontFamily:'Inter,sans-serif' }}
    >+ Ajouter au journal</button>
  </div>`;
}

function NutritionView({ player, db, setDb, isCoach }) {
  if (!player) return _h`<div style=${{ padding:40, textAlign:"center", color:"rgba(255,255,255,.3)" }}>Chargement...</div>`;
  const plan = PLANS_NUT[player.nutrition] || PLANS_NUT.competition;

  // Journal du jour — persisté dans le profil joueur, navigable par date
  const todayStr = localDateStr();
  const [viewDate, setViewDate] = useState(todayStr);
  const today = viewDate; // clé utilisée pour lire/écrire le journal et l'hydratation du jour affiché
  const isToday = viewDate === todayStr;
  function shiftDate(days) {
    const d = new Date(viewDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setViewDate(localDateStr(d));
  }
  // Jours ayant des données (pour un accès rapide à l'historique)
  const journalDates = Array.from(new Set([
    ...Object.keys(player.journal || {}),
    ...Object.keys(player.hydratation || {}),
  ])).sort().reverse();
  const journal = (player.journal || {})[today] || [];

  function saveJournal(newLog) {
    const newJournal = { ...(player.journal || {}), [today]: newLog };
    if (window.__perfhand_db && player.id) {
      const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
      let safe; try { safe = JSON.parse(JSON.stringify(newJournal)); } catch(e) { safe = newJournal; }
      window.__perfhand_db.ref(path + player.id + '/journal').set(safe);
    }
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(pl =>
        pl.id === player.id ? { ...pl, journal: newJournal } : pl
      ),
      playersPerso: (d.playersPerso||[]).map(pl =>
        pl.id === player.id ? { ...pl, journal: newJournal } : pl
      )
    }));
  }

  function addEntry(entry) {
    saveJournal([...journal, { ...entry, id: Date.now(), heure: new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) }]);
  }
  function removeEntry(id) {
    saveJournal(journal.filter(e => e.id !== id));
  }
  function updateEntry(id, field, val) {
    saveJournal(journal.map(e => e.id === id ? { ...e, [field]: field === 'qte' ? parseFloat(val) || 1 : val } : e));
  }

  // Hydratation du jour — persistée dans le profil joueur
  const hydratation = (player.hydratation || {})[today] || 0;
  const HYDRATATION_TARGET = Math.round((player.poids ? player.poids * 35 : 2500) / 50) * 50;
  const pctEau = Math.min(100, Math.round(hydratation / HYDRATATION_TARGET * 100));

  function saveHydratation(ml) {
    const newHydratation = { ...(player.hydratation || {}), [today]: Math.max(0, ml) };
    if (window.__perfhand_db && player.id) {
      const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
      window.__perfhand_db.ref(path + player.id + '/hydratation').set(newHydratation);
    }
    setDb(d => ({
      ...d,
      playerProfiles: (d.playerProfiles||[]).map(pl =>
        pl.id === player.id ? { ...pl, hydratation: newHydratation } : pl
      ),
      playersPerso: (d.playersPerso||[]).map(pl =>
        pl.id === player.id ? { ...pl, hydratation: newHydratation } : pl
      )
    }));
  }
  function addWater(ml) {
    saveHydratation(hydratation + ml);
  }

  // Totaux du journal
  const totK = journal.reduce((s, e) => s + Math.round((e.kcal || 0) * (e.qte || 1)), 0);
  const totP = journal.reduce((s, e) => s + Math.round((e.p || 0) * (e.qte || 1)), 0);
  const totG = journal.reduce((s, e) => s + Math.round((e.g || 0) * (e.qte || 1)), 0);
  const totL = journal.reduce((s, e) => s + Math.round((e.l || 0) * (e.qte || 1)), 0);
  const pctK = Math.min(100, Math.round(totK / plan.kcal * 100));
  const pctP = Math.min(100, Math.round(totP / plan.proteines * 100));
  const pctG = Math.min(100, Math.round(totG / plan.glucides * 100));
  const pctL = Math.min(100, Math.round(totL / plan.lipides * 100));

  // UI state
  const [onglet, setOnglet] = useState('plan');
  const [showDrop, setShowDrop] = useState(false);
  const [selCat, setSelCat] = useState(Object.keys(ALIMENTS_DB)[0]);
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const [customP, setCustomP] = useState('');
  const [customG, setCustomG] = useState('');
  const [customL, setCustomL] = useState('');
  const [searchAlim, setSearchAlim] = useState('');
  const dropRef = useRef(null);

  // Fermer le dropdown si clic dehors
  useEffect(() => {
    function handle(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Filtrage recherche — insensible aux accents (ex: "pates" doit trouver "Pâtes")
  const allAliments = Object.entries(ALIMENTS_DB).flatMap(([cat, items]) => items.map(a => ({ ...a, cat })));
  const normFr = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const filteredAliments = searchAlim.length > 1
    ? allAliments.filter(a => normFr(a.n).includes(normFr(searchAlim)))
    : ALIMENTS_DB[selCat] || [];

  function addFromList(a) {
    addEntry({ nom: a.n, kcal: a.kcal, p: a.p, g: a.g, l: a.l, u: a.u, qte: 1 });
    setShowDrop(false);
    setSearchAlim('');
  }

  function addCustom() {
    if (!customName.trim()) return;
    addEntry({
      nom: customName.trim(),
      kcal: parseFloat(customKcal) || 0,
      p: parseFloat(customP) || 0,
      g: parseFloat(customG) || 0,
      l: parseFloat(customL) || 0,
      u: 'portion', qte: 1,
    });
    setCustomName(''); setCustomKcal(''); setCustomP(''); setCustomG(''); setCustomL('');
  }

  const MACROS = [
    { key:'p', label:'Protéines', tot:totP, obj:plan.proteines, pct:pctP, color:'#FF7A00', unit:'g' },
    { key:'g', label:'Glucides',  tot:totG, obj:plan.glucides,  pct:pctG, color:'#FFB800', unit:'g' },
    { key:'l', label:'Lipides',   tot:totL, obj:plan.lipides,   pct:pctL, color:'#38BDF8', unit:'g' },
  ];

  const ONGLETS = [
    { id:'plan',      label:'Plan alimentaire' },
    { id:'journal',   label:'Journal du jour'  },
    { id:'masse',     label:'📊 Composition' },
    ...(player.genre === 'F' ? [{ id:'cycle_nut', label:'🌸 Cycle & Nutrition' }] : []),
  ];

  return _h`<div>
    ${isCoach && _h`<div style=${{ marginBottom:16 }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>Phase nutritionnelle du joueur</div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${Object.entries(PLANS_NUT).map(([k,v]) => _h`<button key=${k}
          class="btn btn-sm"
          onClick=${() => setDb(d => ({
            ...d,
            playerProfiles: (d.playerProfiles||[]).map(pl => pl.id === player.id ? { ...pl, nutrition:k } : pl),
            playersPerso: (d.playersPerso||[]).map(pl => pl.id === player.id ? { ...pl, nutrition:k } : pl),
          }))}
          style=${{ background: player.nutrition===k ? v.couleur+'18' : 'rgba(255,255,255,.04)',
                    border: '1px solid ' + (player.nutrition===k ? v.couleur+'50' : 'rgba(255,255,255,.08)'),
                    color: player.nutrition===k ? v.couleur : 'rgba(255,255,255,.45)',
                    fontWeight: player.nutrition===k ? 700 : 400 }}
        >${v.label}</button>`)}
      </div>
    </div>`}

    <!-- Bilan calories du jour -->
    <div style=${{ background: plan.couleur+'0A', border:'1px solid '+plan.couleur+'25', borderRadius:16, padding:'16px 20px', marginBottom:16 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style=${{ fontSize:12, color:plan.couleur, fontWeight:700, marginBottom:2 }}>Plan — ${plan.label}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', maxWidth:260, lineHeight:1.5 }}>${plan.description}</div>
        </div>
        <div style=${{ textAlign:'right' }}>
          <div style=${{ fontSize:32, fontWeight:800, color: pctK >= 95 ? '#4CAF50' : pctK >= 70 ? '#FFB800' : 'rgba(255,255,255,.5)', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${totK}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>/ ${plan.kcal} kcal</div>
        </div>
      </div>

      <!-- Barre calories -->
      <div style=${{ marginBottom:14 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Calories</span>
          <span style=${{ fontSize:11, fontWeight:700, color: pctK >= 95 ? '#4CAF50' : ACCENT }}>${pctK}%</span>
        </div>
        <div style=${{ height:10, background:'rgba(255,255,255,.07)', borderRadius:6, overflow:'hidden' }}>
          <div style=${{ height:'100%', width:pctK+'%', background: pctK>=100?'#4CAF50':ACCENT, borderRadius:6, transition:'width .3s' }}></div>
        </div>
      </div>

      <!-- Barres macros -->
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        ${MACROS.map(m => _h`<div key=${m.key}>
          <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:0.5 }}>${m.label}</span>
            <span style=${{ fontSize:11, fontWeight:700, color:m.color }}>${m.tot}g</span>
          </div>
          <div style=${{ height:6, background:'rgba(255,255,255,.07)', borderRadius:4, overflow:'hidden' }}>
            <div style=${{ height:'100%', width:m.pct+'%', background:m.color, borderRadius:4, transition:'width .3s' }}></div>
          </div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.25)', marginTop:3 }}>obj. ${m.obj}g</div>
        </div>`)}
      </div>
    </div>

    <!-- Onglets Plan / Journal -->
    <div style=${{ overflowX:'auto', marginBottom:16, WebkitOverflowScrolling:'touch', scrollbarWidth:'none' }}>
      <div style=${{ display:'flex', gap:4, background:'rgba(255,255,255,.03)', borderRadius:11, padding:3, minWidth:'max-content' }}>
        ${ONGLETS.map(o => _h`<button key=${o.id}
          onClick=${() => setOnglet(o.id)}
          style=${{ flexShrink:0, background:onglet===o.id?'rgba(255,255,255,.07)':'transparent',
                    border:onglet===o.id?'1px solid rgba(255,255,255,.1)':'1px solid transparent',
                    color:onglet===o.id?'#fff':'rgba(255,255,255,.4)',
                    padding:'9px 10px', borderRadius:9, fontSize:12,
                    fontWeight:onglet===o.id?600:400, cursor:'pointer', whiteSpace:'nowrap' }}
        >${o.label}</button>`)}
      </div>
    </div>

    <!-- ── PLAN ALIMENTAIRE ── -->
    ${onglet === 'plan' && _h`<div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>Repas recommandés — ${plan.kcal} kcal/jour</div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.3)', marginBottom:14, lineHeight:1.5 }}>Plusieurs idées de repas par créneau — ${isCoach ? "choisis celle qui convient et ajuste-la au joueur, ou laisse-le piocher lui-même." : "parle-en avec ton coach si besoin, puis ajoute le repas choisi à ton journal."}</div>
      ${plan.repas.map((slot,i) => _h`<${RepasSlotCard} key=${i} slot=${slot} addEntry=${addEntry} />`)}
    </div>`}

    <!-- ── JOURNAL DU JOUR ── -->
    <!-- ── COMPOSITION CORPORELLE ── -->
    ${onglet === 'masse' && React.createElement(CompositionView, { player, setDb, isCoach })}
    ${false && _h`<div>
      ${(() => {
        const mesures = player.masseMesures || [];
        const [showAddM, setShowAddM] = React.useState(false);
        const [formM, setFormM] = React.useState({ date: localDateStr(), poids:'', masseGrasse:'', masseMusc:'', tour_hanches:'', tour_epaule:'', tour_cuisse:'', notes:'' });

        function saveMesure() {
          const updated = [...mesures, { ...formM, id: Date.now().toString() }];
          setDb(d => ({
            ...d,
            playersPerso: (d.playersPerso||[]).map(p => p.id===player.id ? {...p, masseMesures:updated} : p),
            playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, masseMesures:updated} : p)
          }));
          setShowAddM(false);
          setFormM({ date: localDateStr(), poids:'', masseGrasse:'', masseMusc:'', tour_hanches:'', tour_epaule:'', tour_cuisse:'', notes:'' });
        }
        function delMesure(id) {
          const updated = mesures.filter(m => m.id !== id);
          setDb(d => ({
            ...d,
            playersPerso: (d.playersPerso||[]).map(p => p.id===player.id ? {...p, masseMesures:updated} : p),
            playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, masseMesures:updated} : p)
          }));
        }

        const derniere = mesures.length ? mesures[mesures.length-1] : null;
        const precedente = mesures.length > 1 ? mesures[mesures.length-2] : null;

        function imc(poids, taille) {
          if (!poids || !taille) return null;
          return Math.round(parseFloat(poids) / Math.pow(parseFloat(taille)/100, 2) * 10) / 10;
        }

        return _h`<div>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style=${{ fontSize:14, fontWeight:800 }}>Composition corporelle</div>
            ${isCoach ? _h`<button class="btn btn-primary btn-sm" onClick=${() => setShowAddM(!showAddM)}>
              ${showAddM ? '✕' : '+ Mesure'}
            </button>` : null}
          </div>

          ${showAddM ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginBottom:16 }}>
            <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div><div class="lbl">Date</div><input class="inp" type="date" value=${formM.date} onInput=${e=>setFormM(f=>({...f,date:e.target.value}))}/></div>
              <div><div class="lbl">Poids (kg)</div><input class="inp" type="number" step="0.1" value=${formM.poids} onInput=${e=>setFormM(f=>({...f,poids:e.target.value}))} placeholder="75.5"/></div>
              <div><div class="lbl">Masse grasse (%)</div><input class="inp" type="number" step="0.1" value=${formM.masseGrasse} onInput=${e=>setFormM(f=>({...f,masseGrasse:e.target.value}))} placeholder="15.0"/></div>
              <div><div class="lbl">Masse musculaire (kg)</div><input class="inp" type="number" step="0.1" value=${formM.masseMusc} onInput=${e=>setFormM(f=>({...f,masseMusc:e.target.value}))} placeholder="35.0"/></div>
              <div><div class="lbl">Tour de hanches (cm)</div><input class="inp" type="number" value=${formM.tour_hanches} onInput=${e=>setFormM(f=>({...f,tour_hanches:e.target.value}))} placeholder="95"/></div>
              <div><div class="lbl">Tour d'épaule (cm)</div><input class="inp" type="number" value=${formM.tour_epaule} onInput=${e=>setFormM(f=>({...f,tour_epaule:e.target.value}))} placeholder="110"/></div>
              <div><div class="lbl">Tour de cuisse (cm)</div><input class="inp" type="number" value=${formM.tour_cuisse} onInput=${e=>setFormM(f=>({...f,tour_cuisse:e.target.value}))} placeholder="55"/></div>
            </div>
            <div style=${{ marginBottom:10 }}><div class="lbl">Notes</div><input class="inp" value=${formM.notes} onInput=${e=>setFormM(f=>({...f,notes:e.target.value}))} placeholder="Contexte, méthode de mesure..."/></div>
            <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${saveMesure}>Enregistrer</button>
          </div>` : null}

          ${derniere ? _h`<div>
            <!-- Stats actuelles -->
            <div style=${{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:16 }}>
              ${[
                ['Poids', derniere.poids ? derniere.poids+' kg' : '—', '#FFA420', precedente?.poids ? parseFloat(derniere.poids)-parseFloat(precedente.poids) : null],
                ['Masse grasse', derniere.masseGrasse ? derniere.masseGrasse+'%' : '—', '#FF6B35', precedente?.masseGrasse ? parseFloat(derniere.masseGrasse)-parseFloat(precedente.masseGrasse) : null],
                ['Masse muscu', derniere.masseMusc ? derniere.masseMusc+' kg' : '—', '#4CAF50', precedente?.masseMusc ? parseFloat(derniere.masseMusc)-parseFloat(precedente.masseMusc) : null],
              ].map(([l,v,col,delta]) => _h`<div key=${l} style=${{ background:col+'10', border:'1px solid '+col+'25', borderRadius:11, padding:'10px', textAlign:'center' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>${l}</div>
                <div style=${{ fontSize:20, fontWeight:800, color:col, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
                ${delta !== null ? _h`<div style=${{ fontSize:9, color: delta > 0 ? (col==='#4CAF50'?'#4CAF50':'#FF4455') : (col==='#4CAF50'?'#FF4455':'#4CAF50'), marginTop:2 }}>
                  ${delta > 0 ? '+' : ''}${Math.round(delta*10)/10}
                </div>` : null}
              </div>`)}
            </div>
            ${derniere.poids && player.taille ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
              <div style=${{ display:'flex', justifyContent:'space-between' }}>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>IMC</span>
                <span style=${{ fontSize:13, fontWeight:800, color: (() => { const v=imc(derniere.poids,player.taille); return !v?'#FFA420':v<18.5?'#38BDF8':v<25?'#4CAF50':v<30?'#FFB800':'#FF4455'; })() }}>
                  ${imc(derniere.poids,player.taille)||'—'}
                  <span style=${{ fontSize:9, color:'rgba(255,255,255,.3)', fontWeight:400 }}> kg/m²</span>
                </span>
              </div>
              ${derniere.tour_epaule && derniere.tour_hanches ? _h`<div style=${{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Ratio épaule/hanches</span>
                <span style=${{ fontSize:13, fontWeight:800, color:'#FFA420' }}>${Math.round(parseFloat(derniere.tour_epaule)/parseFloat(derniere.tour_hanches)*100)/100}</span>
              </div>` : null}
            </div>` : null}

            <!-- Historique mesures -->
            ${mesures.length > 0 ? _h`<div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Historique (${mesures.length} mesures)</div>
              ${[...mesures].reverse().map(m => _h`<div key=${m.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'10px 13px', marginBottom:6 }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style=${{ fontSize:12, fontWeight:700 }}>${m.date}</div>
                  <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style=${{ display:'flex', gap:12, fontSize:11 }}>
                      ${m.poids ? _h`<span style=${{ color:'#FFA420' }}>${m.poids} kg</span>` : null}
                      ${m.masseGrasse ? _h`<span style=${{ color:'#FF6B35' }}>${m.masseGrasse}% MG</span>` : null}
                      ${m.masseMusc ? _h`<span style=${{ color:'#4CAF50' }}>${m.masseMusc} kg MM</span>` : null}
                    </div>
                    ${isCoach ? _h`<button class="btn btn-sm btn-danger" style=${{ padding:'2px 7px' }} onClick=${() => delMesure(m.id)}>×</button>` : null}
                  </div>
                </div>
                ${m.notes ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:4, fontStyle:'italic' }}>${m.notes}</div>` : null}
              </div>`)}
            </div>` : null}
          </div>` : _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
            <div style=${{ fontSize:28, marginBottom:8 }}>📊</div>
            <div style=${{ fontWeight:700, marginBottom:4 }}>Aucune mesure enregistrée</div>
            ${isCoach ? _h`<div style=${{ fontSize:11 }}>Clique sur "+ Mesure" pour ajouter la première mesure.</div>` : _h`<div style=${{ fontSize:11 }}>Ton prépa physique peut enregistrer tes mesures ici.</div>`}
          </div>`}
        </div>`;
      })()}
    </div>`}

    <!-- ── NUTRITION & CYCLE MENSTRUEL ── -->
    ${onglet === 'cycle_nut' && player.genre === 'F' && _h`<div>
      ${(() => {
        const cycles = player.cycles || [];
        const today2 = localDateStr();
        const dernierCycle = cycles.length ? cycles[cycles.length-1] : null;
        const jourCycle = dernierCycle ? Math.floor((new Date(today2) - new Date(dernierCycle.dateDebut)) / (1000*3600*24)) + 1 : null;

        function getPhaseNut(jour, duree=28) {
          if (!jour || jour < 1) return null;
          if (jour <= 5)  return 'menstruation';
          if (jour <= 13) return 'folliculaire';
          if (jour <= 15) return 'ovulation';
          if (jour <= duree) return 'luteale';
          return null;
        }

        const phase = jourCycle ? getPhaseNut(jourCycle, dernierCycle?.duree||28) : null;

        const CONSEILS_NUT_CYCLE = {
          menstruation: {
            label: 'Menstruation', couleur: '#FF4455', icon: '🔴', jour: 'J1-J5',
            kcal: '+100 à +200 kcal', objectif: 'Reduire inflammation, compenser les pertes',
            macros: { proteines: 'Maintenir élevées (1.8-2g/kg)', glucides: 'Modérés, privilégier complexes', lipides: 'Oméga-3 anti-inflammatoires ++' },
            aliments: ['Viande rouge maigre (fer)', 'Épinards, lentilles (fer végétal)', 'Poissons gras (Oméga-3)', 'Gingembre, curcuma (anti-inflammation)', 'Chocolat noir 70%+ (magnésium)', 'Noix, graines (magnésium)'],
            eviter: ['Cafeine excessive', 'Alcool (pertes en fer)', 'Sel en exces', 'Sucres raffines'],
            hydratation: 'Augmenter legerement (+200-300ml) pour compenser les pertes',
          },
          folliculaire: {
            label: 'Phase folliculaire', couleur: '#FFA420', icon: '🟠', jour: 'J6-J13',
            kcal: 'Besoins normaux', objectif: 'Soutenir montee oestrogenes, optimiser synthese musculaire',
            macros: { proteines: 'Elevees (2g/kg) - fenetre anabolique optimale', glucides: 'Élevés pour soutenir les entraînements intenses', lipides: 'Normaux' },
            aliments: ['Poulet, œufs, légumineuses (protéines)', 'Riz, patate douce, avoine (glucides)', 'Légumes crucifères (brocoli, chou-fleur)', 'Fruits rouges (antioxydants)', 'Graines de lin (oestrogènes naturels)'],
            eviter: ['Alcool (perturbe oestrogenes)', 'Aliments ultra-transformes'],
            hydratation: 'Normale — 2-2.5L/jour',
          },
          ovulation: {
            label: 'Ovulation', couleur: '#4CAF50', icon: '🟢', jour: 'J14-J15',
            kcal: 'Besoins normaux à +100 kcal', objectif: 'Maintenir performances au pic - fenetre competition ideale',
            macros: { proteines: 'Maintenir élevées', glucides: 'Élevés si compétition ou test physique', lipides: 'Normaux' },
            aliments: ['Toutes protéines de qualité', 'Glucides complexes pré-effort', 'Zinc (huîtres, graines de courge)', 'Antioxydants (fruits colorés)'],
            eviter: ['Repas lourds avant effort (risque blessure accru)'],
            hydratation: 'Optimale — pic de performance',
          },
          luteale: {
            label: 'Phase lutéale', couleur: '#7C6FFF', icon: '🟣', jour: 'J16-J28',
            kcal: '+100 à +300 kcal (métabolisme de base augmenté)', objectif: 'Gerer SPM, reduire retention eau, maintenir energie',
            macros: { proteines: 'Maintenir elevees', glucides: 'Modérés, éviter pics glycémiques', lipides: 'Augmenter légèrement les bons lipides' },
            aliments: ['Magnésium (noix, légumes verts, cacao)', 'Vitamine B6 (banane, poulet, pomme de terre)', 'Calcium (produits laitiers, sardines)', 'Fibres (légumineuses, légumes)', 'Tisanes (camomille, menthe — contre SPM)'],
            eviter: ['Sel (retention eau)', 'Cafeine (irritabilite)', 'Sucres raffines', 'Alcool'],
            hydratation: '+200-400ml pour compenser retention, drainer',
          }
        };

        const conseil = phase ? CONSEILS_NUT_CYCLE[phase] : null;

        return _h`<div>
          <div style=${{ fontSize:14, fontWeight:800, marginBottom:4 }}>🌸 Nutrition & Cycle menstruel</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:14 }}>Adapte ton alimentation à chaque phase du cycle pour optimiser tes performances et ton bien-être.</div>

          ${!dernierCycle ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'20px', textAlign:'center', marginBottom:16 }}>
            <div style=${{ fontSize:28, marginBottom:8 }}>🌸</div>
            <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>Enregistre ton cycle dans l'onglet 🌸 Cycle pour des recommandations personnalisées.</div>
          </div>` : _h`<div style=${{ background:conseil?.couleur+'12', border:'1px solid '+conseil?.couleur+'30', borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
              <span style=${{ fontSize:20 }}>${conseil?.icon}</span>
              <div>
                <div style=${{ fontSize:13, fontWeight:800, color:conseil?.couleur }}>${conseil?.label} — J${jourCycle}</div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${conseil?.jour}</div>
              </div>
            </div>
          </div>`}

          <!-- Onglets phases -->
          <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
            ${Object.entries(CONSEILS_NUT_CYCLE).map(([key, ph]) => _h`<button key=${key}
              onClick=${() => {}}
              style=${{
                padding:'5px 11px', borderRadius:20, fontSize:10, cursor:'pointer', fontWeight:700,
                border: phase===key ? '2px solid '+ph.couleur : '1px solid rgba(255,255,255,.1)',
                background: phase===key ? ph.couleur+'18' : 'rgba(255,255,255,.03)',
                color: phase===key ? ph.couleur : 'rgba(255,255,255,.4)'
              }}>${ph.icon} ${ph.label}</button>`)}
          </div>

          <!-- Afficher toutes les phases -->
          ${Object.entries(CONSEILS_NUT_CYCLE).map(([key, ph]) => _h`<div key=${key} style=${{
            background: phase===key ? ph.couleur+'08' : 'rgba(255,255,255,.02)',
            border:'1px solid '+(phase===key ? ph.couleur+'35' : 'rgba(255,255,255,.06)'),
            borderRadius:14, padding:'14px 16px', marginBottom:12,
            opacity: phase && phase!==key ? 0.65 : 1
          }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style=${{ fontSize:18 }}>${ph.icon}</span>
              <div>
                <div style=${{ fontSize:13, fontWeight:800, color:ph.couleur }}>${ph.label} <span style=${{ fontSize:10, fontWeight:400 }}>${ph.jour}</span></div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:1 }}>${ph.kcal} · ${ph.objectif}</div>
              </div>
              ${phase===key ? _h`<div style=${{ marginLeft:'auto', fontSize:10, padding:'3px 10px', borderRadius:20, background:ph.couleur+'25', color:ph.couleur, fontWeight:800 }}>Phase actuelle</div>` : null}
            </div>

            <!-- Macros -->
            <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
              ${[['🥩 Protéines', ph.macros.proteines, '#4CAF50'],['🍚 Glucides', ph.macros.glucides, '#FFA420'],['🥑 Lipides', ph.macros.lipides, '#38BDF8']].map(([l,v,c]) => _h`<div key=${l} style=${{ background:c+'08', border:'1px solid '+c+'20', borderRadius:8, padding:'7px 8px' }}>
                <div style=${{ fontSize:9, color:c, fontWeight:700, marginBottom:3 }}>${l}</div>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.6)', lineHeight:1.4 }}>${v}</div>
              </div>`)}
            </div>

            <!-- Aliments conseillés -->
            <div style=${{ marginBottom:8 }}>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:5 }}>✅ Aliments conseillés</div>
              <div style=${{ display:'flex', gap:4, flexWrap:'wrap' }}>
                ${ph.aliments.map((a,i) => _h`<span key=${i} style=${{ fontSize:9, background:ph.couleur+'10', border:'1px solid '+ph.couleur+'25', borderRadius:6, padding:'2px 7px', color:'rgba(255,255,255,.7)' }}>${a}</span>`)}
              </div>
            </div>

            <!-- À éviter -->
            <div style=${{ marginBottom:8 }}>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:5 }}>❌ À limiter</div>
              <div style=${{ display:'flex', gap:4, flexWrap:'wrap' }}>
                ${ph.eviter.map((a,i) => _h`<span key=${i} style=${{ fontSize:9, background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.2)', borderRadius:6, padding:'2px 7px', color:'rgba(255,100,85,.8)' }}>${a}</span>`)}
              </div>
            </div>

            <!-- Hydratation -->
            <div style=${{ fontSize:10, color:'#38BDF8', background:'rgba(56,189,248,.06)', borderRadius:7, padding:'6px 9px' }}>
              💧 ${ph.hydratation}
            </div>
          </div>`)}
        </div>`;
      })()}
    </div>`}

    ${onglet === 'journal' && _h`<div>

      <!-- Navigation par date -->
      <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <button onClick=${() => shiftDate(-1)}
          style=${{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.6)', cursor:'pointer', fontSize:15, flexShrink:0 }}
        >‹</button>
        <div style=${{ flex:1, textAlign:'center', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:9, padding:'7px 10px' }}>
          <div style=${{ fontSize:12, fontWeight:700, textTransform:'capitalize' }}>
            ${isToday ? "Aujourd'hui" : new Date(viewDate+'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
          </div>
          ${!isToday && _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:1 }}>${viewDate}</div>`}
        </div>
        <button onClick=${() => shiftDate(1)} disabled=${isToday}
          style=${{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color: isToday ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.6)', cursor: isToday ? 'default' : 'pointer', fontSize:15, flexShrink:0 }}
        >›</button>
        ${!isToday && _h`<button class="btn btn-sm"
          onClick=${() => setViewDate(todayStr)}
          style=${{ flexShrink:0, background:ACCENT+'15', border:'1px solid '+ACCENT+'40', color:ACCENT }}
        >Aujourd'hui</button>`}
      </div>

      <!-- Accès rapide aux jours avec historique -->
      ${journalDates.length > 0 && _h`<div style=${{ display:'flex', gap:6, overflowX:'auto', marginBottom:14, paddingBottom:2 }}>
        ${journalDates.slice(0, 14).map(d => _h`<button key=${d}
          onClick=${() => setViewDate(d)}
          style=${{ flexShrink:0, background: d===viewDate ? ACCENT+'20' : 'rgba(255,255,255,.04)',
                     border:'1px solid '+(d===viewDate ? ACCENT+'50' : 'rgba(255,255,255,.08)'),
                     color: d===viewDate ? ACCENT : 'rgba(255,255,255,.4)',
                     borderRadius:20, padding:'4px 12px', fontSize:10, fontWeight: d===viewDate ? 700 : 400,
                     cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif' }}
        >${d === todayStr ? "Aujourd'hui" : new Date(d+'T12:00:00').toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })}</button>`)}
      </div>`}

      <!-- Saisie aliment -->
      <div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'16px', marginBottom:14 }}>
        <div style=${{ fontSize:12, fontWeight:700, marginBottom:14 }}>Ajouter un aliment</div>

        <!-- Recherche + menu déroulant -->
        <div style=${{ position:'relative', marginBottom:10 }} ref=${dropRef}>
          <div style=${{ display:'flex', gap:8 }}>
            <input
              class="inp"
              value=${searchAlim}
              onInput=${e => { setSearchAlim(e.target.value); setShowDrop(true); }}
              onFocus=${() => setShowDrop(true)}
              placeholder="🔍 Rechercher un aliment..."
              style=${{ flex:1 }}
            />
            <button class="btn btn-sm"
              onClick=${() => { setSearchAlim(''); setShowDrop(o => !o); }}
              style=${{ flexShrink:0, background: showDrop ? ACCENT+'15' : 'rgba(255,255,255,.05)', border:'1px solid '+(showDrop ? ACCENT+'40' : 'rgba(255,255,255,.1)'), color: showDrop ? ACCENT : 'rgba(255,255,255,.5)' }}
            >${showDrop ? '▲' : '▼'} Liste</button>
          </div>

          ${showDrop && _h`<div style=${{
            position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:200,
            background:'#1A1D26', border:'1px solid rgba(255,255,255,.12)',
            borderRadius:14, overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,.8)',
            maxHeight:340, display:'flex', flexDirection:'column'
          }}>
            <!-- Catégories -->
            ${!searchAlim && _h`<div style=${{ display:'flex', gap:4, padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,.06)', overflowX:'auto', flexShrink:0 }}>
              ${Object.keys(ALIMENTS_DB).map(cat => _h`<button key=${cat}
                onClick=${() => setSelCat(cat)}
                style=${{ background: selCat===cat ? ACCENT+'20' : 'rgba(255,255,255,.04)',
                           border:'1px solid '+(selCat===cat ? ACCENT+'50' : 'rgba(255,255,255,.08)'),
                           color: selCat===cat ? ACCENT : 'rgba(255,255,255,.4)',
                           borderRadius:20, padding:'4px 12px', fontSize:10, fontWeight: selCat===cat ? 700 : 400,
                           cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif' }}
              >${cat}</button>`)}
            </div>`}

            <!-- Liste aliments -->
            <div style=${{ overflowY:'auto', flex:1 }}>
              ${filteredAliments.length === 0
                ? _h`<div style=${{ padding:'20px', textAlign:'center', color:'rgba(255,255,255,.3)', fontSize:12 }}>Aucun résultat</div>`
                : filteredAliments.map((a, i) => _h`<button key=${i}
                  onClick=${() => addFromList(a)}
                  style=${{ width:'100%', background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,.04)',
                             padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center',
                             cursor:'pointer', fontFamily:'Inter,sans-serif' }}
                  onMouseOver=${e => e.currentTarget.style.background='rgba(255,255,255,.05)'}
                  onMouseOut=${e => e.currentTarget.style.background='none'}
                >
                  <div style=${{ textAlign:'left' }}>
                    <div style=${{ fontSize:13, color:'#fff', fontWeight:500 }}>${a.n}</div>
                    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:1 }}>${a.u}</div>
                  </div>
                  <div style=${{ display:'flex', gap:12, fontSize:11, flexShrink:0 }}>
                    <span style=${{ color:'#FFB800', fontWeight:700 }}>${a.kcal} kcal</span>
                    <span style=${{ color:'#FF7A00' }}>P${a.p}</span>
                    <span style=${{ color:'#FFB800' }}>G${a.g}</span>
                    <span style=${{ color:'#38BDF8' }}>L${a.l}</span>
                  </div>
                </button>`)
              }
            </div>
          </div>`}
        </div>

        <!-- Saisie manuelle -->
        <div style=${{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:12 }}>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:8 }}>Ou saisir manuellement</div>
          <input class="inp" value=${customName} onInput=${e => setCustomName(e.target.value)} placeholder="Nom de l'aliment" style=${{ marginBottom:8 }} />
          <div style=${{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:8 }}>
            ${[
              [customKcal, setCustomKcal, 'kcal', '#FFB800'],
              [customP,    setCustomP,    'Prot.g','#FF7A00'],
              [customG,    setCustomG,    'Gluc.g','#FFB800'],
              [customL,    setCustomL,    'Lip.g', '#38BDF8'],
            ].map(([val, setter, ph, col]) => _h`<input key=${ph}
              class="inp"
              type="number"
              value=${val}
              onInput=${e => setter(e.target.value)}
              placeholder=${ph}
              style=${{ textAlign:'center', borderColor: val ? col+'50' : 'rgba(255,255,255,.1)' }}
            />`)}
          </div>
          <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${addCustom} disabled=${!customName.trim()}>
            + Ajouter au journal
          </button>
        </div>
      </div>

      <!-- Hydratation -->
      <div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:14, padding:'16px', marginBottom:14 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style=${{ fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>💧 Hydratation</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>Objectif ${(HYDRATATION_TARGET/1000).toFixed(1).replace('.', ',')}L</div>
        </div>

        <div style=${{ display:'flex', alignItems:'baseline', gap:6, marginBottom:10 }}>
          <div style=${{ fontSize:28, fontWeight:800, color: pctEau>=100?'#4CAF50':'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${(hydratation/1000).toFixed(2).replace('.', ',')}L</div>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.3)' }}>/ ${(HYDRATATION_TARGET/1000).toFixed(1).replace('.', ',')}L · ${pctEau}%</div>
        </div>

        <!-- Barre progression -->
        <div style=${{ height:8, background:'rgba(255,255,255,.06)', borderRadius:10, overflow:'hidden', marginBottom:12 }}>
          <div style=${{ height:'100%', width:pctEau+'%', background: pctEau>=100?'#4CAF50':'#38BDF8', borderRadius:10, transition:'width .3s' }}></div>
        </div>

        <div style=${{ display:'flex', gap:8, alignItems:'center' }}>
          ${[[100,'+100ml'],[250,'+250ml'],[500,'+500ml']].map(([ml,lbl]) => _h`<button key=${ml}
            class="btn btn-sm"
            onClick=${() => addWater(ml)}
            style=${{ flex:'1 1 auto', background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', fontWeight:700 }}
          >${lbl}</button>`)}
          ${hydratation > 0 && _h`<button
            onClick=${() => saveHydratation(Math.max(0, hydratation - 250))}
            style=${{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:15, flexShrink:0 }}
          >−</button>`}
        </div>
      </div>

      <!-- Journal list -->
      ${journal.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'28px 20px', color:'rgba(255,255,255,.25)', fontSize:13, background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
            Aucun aliment enregistré ${isToday ? "aujourd'hui" : 'ce jour-là'}.<br/>
            <span style=${{ fontSize:11, opacity:.7 }}>Utilise la recherche ou le plan ci-dessus.</span>
          </div>`
        : _h`<div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
            ${journal.length} entrée${journal.length > 1 ? 's' : ''} · ${new Date(viewDate+'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
          </div>
          ${journal.map((e, i) => _h`<div key=${e.id || i} style=${{
            background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)',
            borderRadius:11, padding:'10px 13px', marginBottom:6
          }}>
            <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
              <!-- Quantité -->
              <div style=${{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <button onClick=${() => updateEntry(e.id, 'qte', Math.max(0.5, (e.qte||1) - 0.5))}
                  style=${{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,.06)', border:'none', color:'#fff', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                <span style=${{ fontSize:13, fontWeight:700, minWidth:30, textAlign:'center', color:ACCENT }}>${e.qte || 1}</span>
                <button onClick=${() => updateEntry(e.id, 'qte', (e.qte||1) + 0.5)}
                  style=${{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,.06)', border:'none', color:'#fff', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
              </div>
              <!-- Nom -->
              <div style=${{ flex:1, minWidth:0 }}>
                <div style=${{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>${e.nom}</div>
                ${e.u ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:1 }}>${e.u} × ${e.qte || 1}</div>` : null}
              </div>
              <!-- Macros -->
              <div style=${{ display:'flex', gap:8, fontSize:11, flexShrink:0, alignItems:'center' }}>
                <span style=${{ color:'#FFB800', fontWeight:700 }}>${Math.round((e.kcal||0)*(e.qte||1))} kcal</span>
                ${e.p > 0 ? _h`<span style=${{ color:'#FF7A00' }}>P${Math.round((e.p||0)*(e.qte||1))}</span>` : null}
                ${e.g > 0 ? _h`<span style=${{ color:'#FFB800', opacity:.7 }}>G${Math.round((e.g||0)*(e.qte||1))}</span>` : null}
                ${e.l > 0 ? _h`<span style=${{ color:'#38BDF8' }}>L${Math.round((e.l||0)*(e.qte||1))}</span>` : null}
                <button onClick=${() => removeEntry(e.id)}
                  style=${{ background:'none', border:'none', color:'rgba(255,68,85,.5)', fontSize:16, cursor:'pointer', padding:'0 4px', lineHeight:1 }}>×</button>
              </div>
            </div>
          </div>`)}

          <!-- Récap journée -->
          <div style=${{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'14px 16px', marginTop:12 }}>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:10 }}>Récapitulatif de la journée</div>
            <div style=${{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, textAlign:'center' }}>
              ${[[totK, plan.kcal, 'kcal', pctK, '#FFB800'],
                 [totP, plan.proteines, 'Prot.', pctP, '#FF7A00'],
                 [totG, plan.glucides, 'Gluc.', pctG, '#FFB800'],
                 [totL, plan.lipides, 'Lip.', pctL, '#38BDF8']].map(([tot, obj, lbl, pct, col]) =>
                _h`<div key=${lbl} style=${{ background: pct >= 95 ? col+'15' : 'rgba(255,255,255,.03)', borderRadius:9, padding:'8px 6px', border:'1px solid '+(pct>=95 ? col+'30' : 'rgba(255,255,255,.06)') }}>
                  <div style=${{ fontSize:16, fontWeight:800, color:pct>=100?'#4CAF50':pct>=70?col:'rgba(255,255,255,.5)', fontFamily:"'Barlow Condensed',sans-serif" }}>${tot}</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:1 }}>${lbl}</div>
                  <div style=${{ fontSize:9, color:pct>=95?'#4CAF50':'rgba(255,255,255,.2)', marginTop:2, fontWeight:700 }}>${pct}%</div>
                </div>`
              )}
            </div>
          </div>
        </div>`
      }
    </div>`}
  </div>`;
}



// ── METHODES MUSCULATION DATA ─────────────────────────────────────────────────────
// ── TEMPLATES HANDBALL : puissance, vitesse, plyo (séances types réutilisables pour chaque joueur) ──
const METHODES_HB_TEMPLATES = [
  {
    "id": "hb_plyo_bas",
    "nom": "HB Plyo — Bas du corps (réactivité)",
    "categorie": "Handball — Plyo",
    "couleur": "#38BDF8",
    "equipement": "poids_corps",
    "description": "Pliométrie pour appuis, impulsions et sauts de match. Qualité avant quantité : toujours frais, réceptions amorties.",
    "protocole": "Durée ~40 min. À faire frais (pas après une séance lourde de jambes). Arrêter une série dès que la hauteur ou la réception se dégrade. 1 à 2 fois par semaine, jamais la veille d'un match.",
    "isTemplate": true,
    "rpeCible": 6,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Corde à sauter",
        "series": 3,
        "reps": "30 s",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Rebonds courts sur l'avant-pied. Échauffement des chevilles et des tendons.",
        "biblio": "Jump Rope",
        "blocNom": "Activation chevilles"
      },
      {
        "nom": "Box Jump",
        "series": 4,
        "reps": "4",
        "charge": "Caisse 40-60 cm",
        "repos": "90s",
        "notes": "Saut max, réception souple sur la caisse (genoux alignés), descente en marchant.",
        "biblio": "Box Jump",
        "blocNom": "Plyo vertical"
      },
      {
        "nom": "Depth Jump",
        "series": 3,
        "reps": "4",
        "charge": "Chute de 30 cm",
        "repos": "2'",
        "notes": "Chute de la caisse puis rebond immédiat, contact au sol le plus court possible. Réservé aux joueurs qui maîtrisent le Box Jump.",
        "biblio": "Depth Jump"
      },
      {
        "nom": "Broad Jump",
        "series": 3,
        "reps": "3",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Saut en longueur départ arrêté, réception tenue 2 s. Mesurer le meilleur essai.",
        "biblio": "Broad Jump",
        "blocNom": "Plyo horizontal / latéral"
      },
      {
        "nom": "Lateral Bound",
        "series": 3,
        "reps": "5 / côté",
        "charge": "Poids de corps",
        "repos": "75s",
        "notes": "Bond latéral d'une jambe sur l'autre, réception tenue 1 s, genou dans l'axe. Transfert vers les appuis défensifs.",
        "biblio": "Lateral Bound"
      },
      {
        "nom": "Pogo jumps (rebonds chevilles)",
        "series": 3,
        "reps": "10 contacts",
        "charge": "Poids de corps",
        "repos": "60s",
        "notes": "Rebonds très courts, jambes quasi tendues. Réactivité du tendon d'Achille."
      }
    ]
  },
  {
    "id": "hb_plyo_unilat",
    "nom": "HB Plyo — Unilatéral & réception",
    "categorie": "Handball — Plyo",
    "couleur": "#38BDF8",
    "equipement": "poids_corps",
    "description": "Pliométrie sur une jambe : tir en suspension et appuis de handball se font surtout en unipodal.",
    "protocole": "Durée ~35 min. Faire d'abord le côté faible. Réception tenue 2 s obligatoire.",
    "isTemplate": true,
    "rpeCible": 6,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Corde à sauter",
        "series": 2,
        "reps": "20 s / jambe",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Rebonds sur une jambe, gainage actif.",
        "biblio": "Jump Rope",
        "blocNom": "Activation"
      },
      {
        "nom": "Saut réception unilatérale",
        "series": 4,
        "reps": "4 / jambe",
        "charge": "Poids de corps",
        "repos": "75s",
        "notes": "Saut sur place sur une jambe, réception tenue 2 s sans valgus.",
        "blocNom": "Plyo unilatéral"
      },
      {
        "nom": "Lateral Bound",
        "series": 4,
        "reps": "5 / côté",
        "charge": "Poids de corps",
        "repos": "75s",
        "notes": "Bonds latéraux amples, réception tenue.",
        "biblio": "Lateral Bound"
      },
      {
        "nom": "Step-up",
        "series": 3,
        "reps": "5 / jambe",
        "charge": "Caisse 40-50 cm, saut en haut",
        "repos": "75s",
        "notes": "Montée explosive, saut à la fin du mouvement, réception en douceur.",
        "biblio": "Step-up"
      },
      {
        "nom": "Squat bulgare",
        "series": 3,
        "reps": "6 / jambe",
        "charge": "Haltères modérés (RPE 7)",
        "repos": "90s",
        "notes": "Descente contrôlée, poussée rapide à la montée.",
        "biblio": "Squat bulgare",
        "blocNom": "Force unilatérale"
      }
    ]
  },
  {
    "id": "hb_puiss_bas",
    "nom": "HB Puissance — Bas du corps (force-vitesse)",
    "categorie": "Handball — Puissance",
    "couleur": "#FFA420",
    "equipement": "salle",
    "description": "Puissance des jambes pour l'impulsion, les relances et les duels. Explosif d'abord (frais), force lourde ensuite.",
    "protocole": "Durée ~60 min. Sur les mouvements explosifs, l'objectif est la VITESSE de la barre (intention max), pas la fatigue. 1 fois par semaine, 48 h avant un match minimum.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Power Clean",
        "series": 4,
        "reps": "3",
        "charge": "40-60 % 1RM, vitesse max",
        "repos": "2'",
        "notes": "Tirage explosif, réception rapide. Arrêter si la technique se dégrade.",
        "biblio": "Power Clean",
        "blocNom": "Puissance (frais)"
      },
      {
        "nom": "Jump Squat",
        "series": 4,
        "reps": "4",
        "charge": "Barre légère (20-30 % 1RM) ou poids de corps",
        "repos": "2'",
        "notes": "Impulsion maximale, réception amortie.",
        "biblio": "Jump Squat"
      },
      {
        "nom": "Kettlebell Swing",
        "series": 3,
        "reps": "8",
        "charge": "Kettlebell lourd",
        "repos": "90s",
        "notes": "Extension de hanche explosive, bras relâchés.",
        "biblio": "Kettlebell Swing"
      },
      {
        "nom": "Back Squat",
        "series": 4,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "3'",
        "notes": "Force lourde en peu de répétitions : descente contrôlée, remontée explosive. 2 reps en réserve.",
        "biblio": "Back Squat",
        "blocNom": "Force"
      },
      {
        "nom": "Hip Thrust unilatéral",
        "series": 3,
        "reps": "6 / jambe",
        "charge": "Charge modérée (RPE 7)",
        "repos": "90s",
        "notes": "Poussée explosive, tenir 1 s en haut. Comparer G/D.",
        "biblio": "Hip Thrust unilatéral"
      },
      {
        "nom": "Nordic Curl",
        "series": 3,
        "reps": "4",
        "charge": "Poids de corps (assisté si besoin)",
        "repos": "90s",
        "notes": "Prévention ischios : descente la plus lente possible.",
        "biblio": "Nordic Curl",
        "blocNom": "Prévention"
      }
    ]
  },
  {
    "id": "hb_contraste_bas",
    "nom": "HB Puissance — Contraste lourd/léger (jambes)",
    "categorie": "Handball — Puissance",
    "couleur": "#FFA420",
    "equipement": "salle",
    "description": "Méthode du contraste : une série lourde suivie d'un saut explosif. Efficace et rapide pour un joueur déjà initié à la force.",
    "protocole": "Durée ~50 min. Binôme = série lourde puis saut après 30 à 60 s, puis récupération longue (3'). Réservé aux joueurs avec une base de force solide. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Back Squat",
        "series": 4,
        "reps": "3",
        "charge": "85-90 % 1RM (RPE 8)",
        "repos": "30-60 s puis saut",
        "notes": "Série lourde : 3 reps, 1-2 en réserve. Enchaîner avec le Box Jump.",
        "biblio": "Back Squat",
        "blocNom": "Binôme 1 — jambes"
      },
      {
        "nom": "Box Jump",
        "series": 4,
        "reps": "3",
        "charge": "Caisse 50 cm",
        "repos": "3'",
        "notes": "Saut explosif juste après le Back Squat. Repos long après le binôme.",
        "biblio": "Box Jump"
      },
      {
        "nom": "Hip Thrust unilatéral",
        "series": 3,
        "reps": "5 / jambe",
        "charge": "Lourd (RPE 8)",
        "repos": "30-60 s puis saut",
        "notes": "Série lourde unilatérale. Enchaîner avec les Lateral Bound.",
        "biblio": "Hip Thrust unilatéral",
        "blocNom": "Binôme 2 — fessiers"
      },
      {
        "nom": "Lateral Bound",
        "series": 3,
        "reps": "4 / côté",
        "charge": "Poids de corps",
        "repos": "2'30",
        "notes": "Bonds explosifs après le Hip Thrust.",
        "biblio": "Lateral Bound"
      },
      {
        "nom": "Pallof Press",
        "series": 3,
        "reps": "8 / côté",
        "charge": "Élastique moyen",
        "repos": "45s",
        "notes": "Gainage anti-rotation, transfert jambes → tronc.",
        "biblio": "Pallof Press",
        "blocNom": "Gainage"
      }
    ]
  },
  {
    "id": "hb_puiss_haut",
    "nom": "HB Puissance — Haut du corps & tir",
    "categorie": "Handball — Puissance",
    "couleur": "#FF6B9D",
    "equipement": "mixte",
    "description": "Puissance de tir et de passe : transfert hanche → tronc → épaule, avec prévention de l'épaule de lancer.",
    "protocole": "Durée ~45 min. Lancers à intention maximale, repos complets. Prévention épaule en fin de séance. 1 à 2 fois par semaine, à distance des gros volumes de tirs.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Rotation externe (bande)",
        "series": 2,
        "reps": "15",
        "charge": "Bande légère",
        "repos": "30s",
        "notes": "Activation de la coiffe en premier, épaule pas fatiguée.",
        "biblio": "Rotation externe (bande)",
        "blocNom": "Activation épaule"
      },
      {
        "nom": "Med Ball Throw",
        "series": 4,
        "reps": "5 / côté",
        "charge": "Médecine-ball 3 kg",
        "repos": "90s",
        "notes": "Lancer rotationnel contre un mur : puissance qui part des hanches, comme le geste de tir.",
        "biblio": "Med Ball Throw",
        "blocNom": "Puissance"
      },
      {
        "nom": "Medicine Ball Slam",
        "series": 3,
        "reps": "6",
        "charge": "Médecine-ball 4-6 kg",
        "repos": "90s",
        "notes": "Lancer au sol à intention maximale.",
        "biblio": "Medicine Ball Slam"
      },
      {
        "nom": "Plyometric Push-up",
        "series": 3,
        "reps": "5",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Pompe claquée explosive, réception souple des coudes.",
        "biblio": "Plyometric Push-up"
      },
      {
        "nom": "Développé couché",
        "series": 4,
        "reps": "3",
        "charge": "50-60 % 1RM, vitesse max",
        "repos": "2'",
        "notes": "Poussée explosive : intention de vitesse maximale.",
        "biblio": "Développé couché",
        "blocNom": "Force-vitesse"
      },
      {
        "nom": "Pull-up / Traction",
        "series": 3,
        "reps": "5",
        "charge": "Poids de corps ou lest léger",
        "repos": "2'",
        "notes": "Équilibre poussée/tirage, santé de l'épaule.",
        "biblio": "Pull-up / Traction"
      },
      {
        "nom": "Face Pull",
        "series": 3,
        "reps": "15",
        "charge": "Poulie, charge légère",
        "repos": "45s",
        "notes": "Coiffe postérieure : prévention à haut volume de tirs.",
        "biblio": "Face Pull",
        "blocNom": "Prévention"
      }
    ]
  },
  {
    "id": "hb_vitesse_ligne",
    "nom": "HB Vitesse — Accélération & vitesse max",
    "categorie": "Handball — Vitesse",
    "couleur": "#00D2D3",
    "equipement": "poids_corps",
    "description": "Sprints en ligne droite : départs arrêtés (relances, contre-attaques) puis vitesse lancée. Récupération COMPLÈTE entre sprints.",
    "protocole": "Durée ~45 min. Toujours frais, après un bon échauffement. Intention max à chaque sprint : si la vitesse chute, on arrête. 1 à 2 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Corde à sauter",
        "series": 2,
        "reps": "30 s",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Activation des chevilles avant les sprints.",
        "biblio": "Jump Rope",
        "blocNom": "Préparation"
      },
      {
        "nom": "Éducatifs de course",
        "series": 3,
        "reps": "20 m",
        "charge": "Poids de corps",
        "repos": "45s",
        "notes": "Montées de genoux, talons-fesses, foulées bondissantes."
      },
      {
        "nom": "Sprint départ arrêté 10 m",
        "series": 6,
        "reps": "1 × 10 m",
        "charge": "Maximum",
        "repos": "1'30",
        "notes": "Départ debout ou en fente, 3-4 premiers appuis puissants. Chronométrer si possible.",
        "blocNom": "Accélération"
      },
      {
        "nom": "Sprint départ arrêté 20 m",
        "series": 4,
        "reps": "1 × 20 m",
        "charge": "Maximum",
        "repos": "2'",
        "notes": "Buste incliné sur les 10 premiers mètres."
      },
      {
        "nom": "Sprint lancé 30 m (20 m d'élan)",
        "series": 3,
        "reps": "1 × 30 m",
        "charge": "Maximum",
        "repos": "3'",
        "notes": "Montée progressive sur 20 m puis vitesse max sur 30 m. Épaules relâchées.",
        "blocNom": "Vitesse max"
      },
      {
        "nom": "Gainage planche entre sprints",
        "series": 3,
        "reps": "30 s",
        "charge": "Poids de corps",
        "repos": "60s",
        "notes": "Garder la ceinture abdominale active.",
        "biblio": "Planche frontale"
      }
    ]
  },
  {
    "id": "hb_vitesse_appuis",
    "nom": "HB Vitesse — Appuis & changements de direction",
    "categorie": "Handball — Vitesse",
    "couleur": "#00D2D3",
    "equipement": "poids_corps",
    "description": "Agilité spécifique handball : défense, replis, démarquages. Départs réactifs, freinages et relances sur courtes distances.",
    "protocole": "Durée ~40 min. Courtes distances, repos complets. Terminer par un travail de réaction (signal visuel ou sonore).",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Corde à sauter",
        "series": 2,
        "reps": "30 s",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Rebonds rapides.",
        "biblio": "Jump Rope",
        "blocNom": "Préparation"
      },
      {
        "nom": "Lateral Bound",
        "series": 3,
        "reps": "4 / côté",
        "charge": "Poids de corps",
        "repos": "60s",
        "notes": "Appuis latéraux explosifs, réception tenue.",
        "biblio": "Lateral Bound"
      },
      {
        "nom": "Pas chassés vitesse max 5 m",
        "series": 4,
        "reps": "4 allers-retours",
        "charge": "Maximum",
        "repos": "1'30",
        "notes": "Déplacements défensifs : appuis bas, sans croiser les jambes.",
        "blocNom": "Appuis"
      },
      {
        "nom": "Test 5-10-5 (pro agility)",
        "series": 5,
        "reps": "1",
        "charge": "Maximum",
        "repos": "2'",
        "notes": "Départ au centre, toucher les lignes à 5 m de chaque côté. Chronométrer et comparer."
      },
      {
        "nom": "Course-freinage-relance",
        "series": 4,
        "reps": "2 × 10 m",
        "charge": "Maximum",
        "repos": "1'30",
        "notes": "Sprint 10 m, freinage en 3 appuis, relance immédiate dans l'autre sens."
      },
      {
        "nom": "Départs sur signal",
        "series": 6,
        "reps": "1 × 10 m",
        "charge": "Maximum",
        "repos": "1'30",
        "notes": "Signal du coach (voix, main, ballon) puis sprint dans la direction indiquée.",
        "blocNom": "Réaction"
      }
    ]
  },
  {
    "id": "hb_mix_vitesse_force",
    "nom": "HB Mixte — Vitesse + Plyo + Force (séance complète)",
    "categorie": "Handball — Puissance",
    "couleur": "#FF7A00",
    "equipement": "salle",
    "description": "Enchaîne les trois qualités : vitesse (frais), plyo, puis force. Idéale quand le planning ne permet qu'une séance par semaine.",
    "protocole": "Durée ~75 min. Le plus rapide d'abord, le plus lourd ensuite. Si match < 48 h : retirer le bloc Force.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Sprint départ arrêté 10 m",
        "series": 5,
        "reps": "1 × 10 m",
        "charge": "Maximum",
        "repos": "1'30",
        "notes": "Intention maximale, frais.",
        "blocNom": "Vitesse (frais)"
      },
      {
        "nom": "Box Jump",
        "series": 4,
        "reps": "4",
        "charge": "Caisse 40-60 cm",
        "repos": "90s",
        "notes": "Saut explosif, réception souple.",
        "biblio": "Box Jump",
        "blocNom": "Plyo"
      },
      {
        "nom": "Med Ball Throw",
        "series": 3,
        "reps": "5 / côté",
        "charge": "Médecine-ball 3 kg",
        "repos": "90s",
        "notes": "Lancer rotationnel à intention maximale.",
        "biblio": "Med Ball Throw"
      },
      {
        "nom": "Back Squat",
        "series": 4,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "3'",
        "notes": "Force lourde, 2 reps en réserve.",
        "biblio": "Back Squat",
        "blocNom": "Force"
      },
      {
        "nom": "Développé couché",
        "series": 3,
        "reps": "4",
        "charge": "80 % 1RM (RPE 8)",
        "repos": "2'30",
        "notes": "Force haut du corps, 2 reps en réserve.",
        "biblio": "Développé couché"
      },
      {
        "nom": "Pull-up / Traction",
        "series": 3,
        "reps": "5",
        "charge": "Poids de corps ou lest",
        "repos": "2'",
        "notes": "Tirage vertical.",
        "biblio": "Pull-up / Traction"
      },
      {
        "nom": "Pallof Press",
        "series": 3,
        "reps": "8 / côté",
        "charge": "Élastique moyen",
        "repos": "45s",
        "notes": "Gainage anti-rotation en fin de séance.",
        "biblio": "Pallof Press",
        "blocNom": "Gainage"
      }
    ]
  },
  {
    "id": "hb_match_court",
    "nom": "HB Entretien — Semaine de match (30 min)",
    "categorie": "Handball — Puissance",
    "couleur": "#4CAF50",
    "equipement": "mixte",
    "description": "Séance courte de maintien de la vitesse et de la puissance en période de compétition : peu de volume, zéro fatigue résiduelle.",
    "protocole": "Durée ~30 min. À placer à J-2 ou J-3 du match. Volume volontairement bas (RPE 5).",
    "isTemplate": true,
    "rpeCible": 5,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Corde à sauter",
        "series": 2,
        "reps": "30 s",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Activation légère.",
        "biblio": "Jump Rope",
        "blocNom": "Activation"
      },
      {
        "nom": "Sprint départ arrêté 10 m",
        "series": 3,
        "reps": "1 × 10 m",
        "charge": "85-90 % de la vitesse max",
        "repos": "1'30",
        "notes": "Accélération fluide, sans forcer.",
        "blocNom": "Vitesse"
      },
      {
        "nom": "Jump Squat",
        "series": 3,
        "reps": "3",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Sauts verticaux explosifs, réception amortie.",
        "biblio": "Jump Squat",
        "blocNom": "Puissance"
      },
      {
        "nom": "Med Ball Throw",
        "series": 3,
        "reps": "4 / côté",
        "charge": "Médecine-ball 2-3 kg",
        "repos": "75s",
        "notes": "Lancers rapides, geste fluide.",
        "biblio": "Med Ball Throw"
      },
      {
        "nom": "Nordic Curl",
        "series": 2,
        "reps": "4",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Entretien ischios.",
        "biblio": "Nordic Curl",
        "blocNom": "Prévention"
      }
    ]
  },
  {
    "id": "hb_reprise_maladie",
    "nom": "Reprise après maladie — Hybride corps entier",
    "categorie": "Reprise / Santé",
    "couleur": "#4CAF50",
    "equipement": "salle",
    "description": "Séance de reprise douce après une maladie ou une baisse de forme (système immunitaire fragile) : sollicite tout le corps en circuit léger, sans aller chercher la fatigue. Plus complète qu'un simple footing.",
    "protocole": "Durée ~40 min. À démarrer seulement après 24-48 h sans fièvre ni symptômes généraux, et avec l'accord du médecin si la maladie était sérieuse (fièvre, symptômes respiratoires ou cardiaques : avis médical avant toute reprise). Intensité volontairement basse : RPE 4 maximum, on doit pouvoir parler tout du long. Si fatigue anormale, palpitations, essoufflement ou symptômes qui reviennent : on arrête et on lève le pied. 2e tour du circuit uniquement si la forme est bonne. Reprendre ensuite sur 1 à 2 semaines : 1) cette séance, 2) même séance en 3 tours, 3) retour à la séance normale à 70 % du volume.",
    "isTemplate": true,
    "rpeCible": 4,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Rameur ou vélo facile",
        "series": 1,
        "reps": "8 min",
        "charge": "Allure facile (RPE 3)",
        "repos": "—",
        "notes": "Montée en température progressive, respiration nasale possible. On doit pouvoir parler.",
        "blocNom": "Échauffement doux"
      },
      {
        "nom": "Wall Angel",
        "series": 2,
        "reps": "8",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Mobilité des épaules et du haut du dos, mouvement lent.",
        "biblio": "Wall Angel"
      },
      {
        "nom": "Goblet Squat",
        "series": 2,
        "reps": "10",
        "charge": "Léger (RPE 4, 5-8 kg)",
        "repos": "45s",
        "notes": "Descente contrôlée, remontée tranquille. Charge très légère.",
        "biblio": "Goblet Squat",
        "blocNom": "Circuit corps entier (2 tours)"
      },
      {
        "nom": "Pompes",
        "series": 2,
        "reps": "8",
        "charge": "Poids de corps (sur les genoux ou mains surélevées si besoin)",
        "repos": "45s",
        "notes": "Amplitude complète, rythme calme. Arrêter à 3 reps en réserve.",
        "biblio": "Pompes"
      },
      {
        "nom": "Rowing haltère unilatéral",
        "series": 2,
        "reps": "10 / côté",
        "charge": "Léger (RPE 4)",
        "repos": "45s",
        "notes": "Tirage fluide, dos plat, pas de recherche de charge.",
        "biblio": "Rowing haltère unilatéral"
      },
      {
        "nom": "Romanian Deadlift (RDL)",
        "series": 2,
        "reps": "10",
        "charge": "Léger (RPE 4)",
        "repos": "45s",
        "notes": "Charnière de hanche, dos neutre. Chaîne postérieure en douceur.",
        "biblio": "Romanian Deadlift (RDL)"
      },
      {
        "nom": "Fente arrière",
        "series": 2,
        "reps": "8 / jambe",
        "charge": "Poids de corps",
        "repos": "45s",
        "notes": "Pas contrôlé, équilibre stable.",
        "biblio": "Fente arrière"
      },
      {
        "nom": "Dead Bug",
        "series": 2,
        "reps": "8 / côté",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Gainage en douceur, respiration continue.",
        "biblio": "Dead Bug"
      },
      {
        "nom": "Farmer's Walk",
        "series": 2,
        "reps": "30 m",
        "charge": "Léger (RPE 4)",
        "repos": "45s",
        "notes": "Marche tranquille avec haltères, épaules basses. Reprise de la tonicité globale.",
        "biblio": "Farmer's Walk"
      },
      {
        "nom": "Rameur ou vélo très facile + respiration",
        "series": 1,
        "reps": "5 min",
        "charge": "Très facile (RPE 2)",
        "repos": "—",
        "notes": "Retour au calme : fréquence cardiaque qui redescend, 5 respirations lentes pour finir.",
        "blocNom": "Retour au calme"
      }
    ]
  },
  {
    "id": "hb_epaule_stabilite",
    "nom": "HB Épaule — Stabilité & contrôle scapulaire",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Stabilité de l'épaule de lancer : coiffe des rotateurs, serratus et contrôle de l'omoplate. À faire régulièrement pour tenir la saison de tirs.",
    "protocole": "Durée ~35 min. Charges légères, qualité du geste avant tout : on s'arrête avant que l'épaule compense. 2 à 3 fois par semaine, idéalement après la séance principale ou un jour sans tirs intensifs.",
    "isTemplate": true,
    "rpeCible": 5,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Wall Angel",
        "series": 2,
        "reps": "8",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Dos, bassin et poignets au mur, glisser les bras lentement. Mobilité thoracique et épaules.",
        "biblio": "Wall Angel",
        "blocNom": "Activation"
      },
      {
        "nom": "Rotation externe (bande)",
        "series": 3,
        "reps": "12 / côté",
        "charge": "Bande légère, coude collé",
        "repos": "30s",
        "notes": "Rotation lente, 2 s au retour. Coiffe postérieure (infra-épineux).",
        "biblio": "Rotation externe (bande)",
        "blocNom": "Coiffe des rotateurs"
      },
      {
        "nom": "Cuban Press",
        "series": 3,
        "reps": "8",
        "charge": "Haltères très légers (1-3 kg)",
        "repos": "45s",
        "notes": "Tirage coudes hauts, rotation externe, puis poussée au-dessus de la tête. Contrôle total.",
        "biblio": "Cuban Press"
      },
      {
        "nom": "Planche + touche d'épaule",
        "series": 3,
        "reps": "10 / côté",
        "charge": "Poids de corps",
        "repos": "45s",
        "notes": "Bassin immobile pendant la touche d'épaule. Stabilité scapulaire en appui.",
        "biblio": "Planche + touche d'épaule",
        "blocNom": "Stabilité scapulaire"
      },
      {
        "nom": "Face Pull",
        "series": 3,
        "reps": "15",
        "charge": "Poulie, charge légère",
        "repos": "45s",
        "notes": "Tirage vers le visage, coudes hauts, rotation externe en fin de mouvement.",
        "biblio": "Face Pull"
      },
      {
        "nom": "Oiseau (Rear Delt Fly)",
        "series": 3,
        "reps": "12",
        "charge": "Haltères légers",
        "repos": "45s",
        "notes": "Buste penché, serrer les omoplates sans hausser les épaules.",
        "biblio": "Oiseau (Rear Delt Fly)"
      }
    ]
  },
  {
    "id": "hb_epaule_isometrie",
    "nom": "HB Épaule — Isométrie bras armé (angles de tir)",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "mixte",
    "description": "Isométries debout, bras loin du corps, dans les angles réellement utilisés au tir : bras armé (abduction + rotation externe), flexion / extension d'épaule et sonnette latérale de la scapula. Crée de la force là où le joueur en a besoin.",
    "protocole": "Durée ~30 min. Tout se fait DEBOUT avec bande élastique ou poulie, bras loin du corps. Montée de tension progressive sur 2 s, maintien sans compenser (épaule basse, cage thoracique stable, pas de cambrure), puis relâchement lent. Intensité 6-7/10, jamais maximale. Travailler les 2 bras. Si douleur vive dans l'épaule, arrêter l'exercice. Idéal en semaine de match et en retour de gêne légère (avec l'accord du kiné).",
    "isTemplate": true,
    "rpeCible": 5,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Isométrie rotation externe bras armé (90/90)",
        "series": 3,
        "reps": "20-30 s / bras",
        "charge": "Bande ancrée à hauteur d'épaule",
        "repos": "45s",
        "notes": "Debout, bras en abduction 90° et coude à 90° (position armée). Tenir l'avant-bras vertical contre la traction de la bande, sans laisser le coude descendre.",
        "blocNom": "Bras armé"
      },
      {
        "nom": "Isométrie rotation interne bras armé (90/90)",
        "series": 3,
        "reps": "20-30 s / bras",
        "charge": "Bande ancrée à hauteur d'épaule",
        "repos": "45s",
        "notes": "Même position armée, face à l'ancrage inversé : pousser contre la bande comme dans l'accélération du tir. Coude haut, tronc immobile."
      },
      {
        "nom": "Isométrie bras armé en 3 angles (rotation externe)",
        "series": 2,
        "reps": "3 × 10 s / bras",
        "charge": "Bande ancrée, angles 60° / 90° / 120° d'abduction",
        "repos": "45s",
        "notes": "Même exercice en changeant l'élévation du coude (bas, épaule, haut) : tenir 10 s à chaque angle. Renforce toute la plage utilisée au tir."
      },
      {
        "nom": "Isométrie flexion d'épaule bras tendu (bande / poulie)",
        "series": 3,
        "reps": "20 s / bras",
        "charge": "Poulie basse ou bande ancrée derrière",
        "repos": "45s",
        "notes": "Debout, bras tendu devant à 90° (puis 120° à la 3e série) : résister à la traction qui ramène le bras vers l'arrière. Épaule basse, gainage actif.",
        "blocNom": "Flexion / extension"
      },
      {
        "nom": "Isométrie extension d'épaule bras tendu (bande / poulie)",
        "series": 3,
        "reps": "20 s / bras",
        "charge": "Poulie haute ou bande ancrée devant",
        "repos": "45s",
        "notes": "Bras tendu à 90° ou plus haut, tirer contre la résistance comme pour ramener le bras en arrière. Dos plat, omoplate basse."
      },
      {
        "nom": "Sonnette latérale de scapula debout (bande)",
        "series": 3,
        "reps": "15 s tenu + 6 reps lentes / bras",
        "charge": "Bande légère sous le pied ou ancrée bas",
        "repos": "45s",
        "notes": "Bras en élévation latérale dans le plan de l'omoplate (~120-150°) : monter lentement, tenir en haut 15 s en gardant l'omoplate qui tourne vers le haut sans hausser l'épaule.",
        "blocNom": "Scapula"
      },
      {
        "nom": "Maintien ballon au mur bras armé (stabilité dynamique)",
        "series": 3,
        "reps": "20 s / bras",
        "charge": "Médecine-ball léger (1-2 kg) ou ballon de handball",
        "repos": "45s",
        "notes": "Debout face au mur, bras en position armée, ballon plaqué au mur à hauteur d'épaule : maintenir la pression et faire de petits cercles lents. Stabilité de l'épaule loin du corps."
      }
    ]
  },
  {
    "id": "hb_rhomboides_trapezes",
    "nom": "HB Haut du dos — Rhomboïdes & trapèzes",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Renforce tout l'arrière de l'épaule : rhomboïdes, trapèzes moyen et inférieur, deltoïde postérieur. Équilibre le travail de poussée et de tir.",
    "protocole": "Durée ~40 min. Marquer une pause de 1 s en serrant les omoplates sur chaque rep. Ne pas hausser les épaules (sauf sur les Shrugs). 2 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 6,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Face Pull trapèze",
        "series": 4,
        "reps": "12",
        "charge": "Poulie, charge modérée",
        "repos": "60s",
        "notes": "Tirage haut vers le visage, serrer les omoplates 1 s.",
        "biblio": "Face Pull trapèze",
        "blocNom": "Trapèzes & deltoïde postérieur"
      },
      {
        "nom": "Rowing câble assis",
        "series": 4,
        "reps": "10",
        "charge": "Charge modérée (RPE 6-7)",
        "repos": "75s",
        "notes": "Pause 1 s coudes en arrière, omoplates serrées. Buste fixe.",
        "biblio": "Rowing câble assis",
        "blocNom": "Rhomboïdes"
      },
      {
        "nom": "Rowing inversé (traction australienne)",
        "series": 3,
        "reps": "8",
        "charge": "Poids de corps",
        "repos": "75s",
        "notes": "Corps gainé, poitrine vers la barre, omoplates qui se rapprochent.",
        "biblio": "Rowing inversé (traction australienne)"
      },
      {
        "nom": "Oiseau (Rear Delt Fly)",
        "series": 3,
        "reps": "12",
        "charge": "Haltères légers",
        "repos": "45s",
        "notes": "Mouvement lent, ne pas balancer le buste.",
        "biblio": "Oiseau (Rear Delt Fly)"
      },
      {
        "nom": "Shrugs",
        "series": 3,
        "reps": "10",
        "charge": "Haltères ou barre, charge modérée",
        "repos": "60s",
        "notes": "Hausser sans rotation, tenir 2 s en haut. Trapèze supérieur.",
        "biblio": "Shrugs"
      },
      {
        "nom": "Y-T-W allongé (haltères très légers)",
        "series": 2,
        "reps": "8 par lettre",
        "charge": "1-2 kg ou poids de corps",
        "repos": "30s",
        "notes": "Allongé sur le ventre : Y (trapèze inférieur), T (rhomboïdes), W (coiffe).",
        "blocNom": "Trapèzes inférieurs"
      }
    ]
  },
  {
    "id": "hb_epaule_activation",
    "nom": "HB Épaule — Activation avant séance ou match (15 min)",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "mixte",
    "description": "Routine courte pour réveiller l'épaule avant l'échauffement ballon ou une séance de haut du corps. Gain de temps pour tout le groupe.",
    "protocole": "Durée ~15 min. À faire avant l'échauffement avec ballon. 1 tour, mouvements fluides, jamais jusqu'à la fatigue.",
    "isTemplate": true,
    "rpeCible": 3,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Wall Angel",
        "series": 1,
        "reps": "8",
        "charge": "Poids de corps",
        "repos": "—",
        "notes": "Réveil de la mobilité thoracique et des épaules.",
        "biblio": "Wall Angel",
        "blocNom": "Activation"
      },
      {
        "nom": "Rotation externe (bande)",
        "series": 2,
        "reps": "12 / côté",
        "charge": "Bande légère",
        "repos": "20s",
        "notes": "Réveil de la coiffe, coude collé.",
        "biblio": "Rotation externe (bande)"
      },
      {
        "nom": "Cuban Press",
        "series": 2,
        "reps": "6",
        "charge": "Haltères très légers (1-2 kg)",
        "repos": "20s",
        "notes": "Mouvement lent et contrôlé.",
        "biblio": "Cuban Press"
      },
      {
        "nom": "Planche + touche d'épaule",
        "series": 1,
        "reps": "8 / côté",
        "charge": "Poids de corps",
        "repos": "—",
        "notes": "Stabilité scapulaire en appui.",
        "biblio": "Planche + touche d'épaule"
      },
      {
        "nom": "Face Pull",
        "series": 2,
        "reps": "12",
        "charge": "Bande ou poulie légère",
        "repos": "20s",
        "notes": "Serrer les omoplates en fin de mouvement.",
        "biblio": "Face Pull"
      }
    ]
  },
  {
    "id": "hb_haut_force",
    "nom": "HB Haut du corps — Force (poussée + tirage)",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Force maximale du haut du corps en peu de répétitions : poussée, tirage vertical et horizontal. La base pour les duels, les tirs et la protection de l'épaule.",
    "protocole": "Durée ~60 min. Charges lourdes, repos longs (2'30 à 3'). Toujours autant de tirage que de poussée. À placer à 48 h au moins d'un match. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Développé couché",
        "series": 5,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "3'",
        "notes": "Pieds ancrés, omoplates serrées, descente contrôlée. 2 reps en réserve.",
        "biblio": "Développé couché",
        "blocNom": "Poussée lourde"
      },
      {
        "nom": "Pull-up / Traction",
        "series": 5,
        "reps": "3",
        "charge": "Lesté si possible (RPE 8)",
        "repos": "3'",
        "notes": "Menton au-dessus de la barre, omoplates basses. Même volume que la poussée.",
        "biblio": "Pull-up / Traction",
        "blocNom": "Tirage lourd"
      },
      {
        "nom": "Développé militaire",
        "series": 4,
        "reps": "4",
        "charge": "80 % 1RM (RPE 8)",
        "repos": "2'30",
        "notes": "Gainage serré, barre dans l'axe.",
        "biblio": "Développé militaire"
      },
      {
        "nom": "Rowing barre",
        "series": 4,
        "reps": "5",
        "charge": "Lourd (RPE 8)",
        "repos": "2'30",
        "notes": "Buste à 45°, tirage vers le bas du sternum.",
        "biblio": "Rowing barre"
      },
      {
        "nom": "Face Pull",
        "series": 3,
        "reps": "15",
        "charge": "Poulie légère",
        "repos": "45s",
        "notes": "Prévention : coiffe postérieure en fin de séance.",
        "biblio": "Face Pull",
        "blocNom": "Prévention"
      },
      {
        "nom": "Rotation externe (bande)",
        "series": 3,
        "reps": "12 / côté",
        "charge": "Bande légère",
        "repos": "30s",
        "notes": "Santé de l'épaule de lancer.",
        "biblio": "Rotation externe (bande)"
      }
    ]
  },
  {
    "id": "hb_tirage_force_dos",
    "nom": "HB Tirage lourd — Dos & traction",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Séance centrée sur le tirage : dos, traction et prise de force, pour protéger l'épaule et équilibrer les nombreuses poussées et tirs du handball.",
    "protocole": "Durée ~50 min. Priorité au tirage lourd en peu de reps, repos complets. 1 fois par semaine, en complément d'une séance de poussée.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Pull-up / Traction",
        "series": 5,
        "reps": "3",
        "charge": "Lesté (RPE 8)",
        "repos": "3'",
        "notes": "Traction stricte, amplitude complète.",
        "biblio": "Pull-up / Traction",
        "blocNom": "Tirage vertical"
      },
      {
        "nom": "Rowing barre",
        "series": 5,
        "reps": "4",
        "charge": "Lourd (RPE 8)",
        "repos": "2'30",
        "notes": "Buste fixe, tirer vers le bas du sternum.",
        "biblio": "Rowing barre",
        "blocNom": "Tirage horizontal"
      },
      {
        "nom": "Chin-up (supination)",
        "series": 3,
        "reps": "5",
        "charge": "Poids de corps ou lest",
        "repos": "2'",
        "notes": "Prise supination, biceps et dos sollicités.",
        "biblio": "Chin-up (supination)"
      },
      {
        "nom": "Rowing haltère unilatéral",
        "series": 3,
        "reps": "6 / côté",
        "charge": "Lourd (RPE 8)",
        "repos": "90s",
        "notes": "Dos plat, pas de rotation du buste.",
        "biblio": "Rowing haltère unilatéral"
      },
      {
        "nom": "Farmer's Walk",
        "series": 3,
        "reps": "30 m",
        "charge": "Très lourd",
        "repos": "90s",
        "notes": "Marche lourde : prise, trapèzes, gainage global.",
        "biblio": "Farmer's Walk",
        "blocNom": "Prise & stabilité"
      },
      {
        "nom": "Face Pull trapèze",
        "series": 3,
        "reps": "15",
        "charge": "Poulie légère",
        "repos": "45s",
        "notes": "Prévention : trapèzes et deltoïde postérieur.",
        "biblio": "Face Pull trapèze",
        "blocNom": "Prévention"
      }
    ]
  },
  {
    "id": "hb_haut_volume",
    "nom": "HB Haut du corps — Volume & tonus musculaire",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Travail en séries moyennes (8-12 reps) pour construire de la masse musculaire utile (épaules, pectoraux, dos, bras) hors période de forte charge.",
    "protocole": "Durée ~55 min. Contrôle du mouvement, 1-2 reps en réserve. Idéal en début de saison ou en période d'accumulation. 1 à 2 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Développé incliné",
        "series": 4,
        "reps": "8",
        "charge": "Charge modérée (RPE 7)",
        "repos": "90s",
        "notes": "Contrôle de la descente, poussée régulière.",
        "biblio": "Développé incliné",
        "blocNom": "Poussée"
      },
      {
        "nom": "Lat Pulldown",
        "series": 4,
        "reps": "10",
        "charge": "Charge modérée (RPE 7)",
        "repos": "75s",
        "notes": "Tirage vertical, poitrine vers la barre.",
        "biblio": "Lat Pulldown",
        "blocNom": "Tirage"
      },
      {
        "nom": "Arnold Press",
        "series": 3,
        "reps": "10",
        "charge": "Haltères modérés",
        "repos": "75s",
        "notes": "Rotation fluide, épaules basses au départ.",
        "biblio": "Arnold Press"
      },
      {
        "nom": "Rowing câble assis",
        "series": 3,
        "reps": "12",
        "charge": "Charge modérée",
        "repos": "60s",
        "notes": "Serrer les omoplates, ne pas se balancer.",
        "biblio": "Rowing câble assis"
      },
      {
        "nom": "Élévations latérales",
        "series": 3,
        "reps": "15",
        "charge": "Haltères légers",
        "repos": "45s",
        "notes": "Coudes légèrement fléchis, pas de balancement.",
        "biblio": "Élévations latérales"
      },
      {
        "nom": "Curl haltères",
        "series": 2,
        "reps": "12",
        "charge": "Modéré",
        "repos": "45s",
        "notes": "Biceps, montée contrôlée.",
        "biblio": "Curl haltères",
        "blocNom": "Bras"
      },
      {
        "nom": "Triceps poulie haute",
        "series": 2,
        "reps": "12",
        "charge": "Modéré",
        "repos": "45s",
        "notes": "Triceps, extension complète.",
        "biblio": "Triceps poulie haute"
      }
    ]
  },
  {
    "id": "hb_push_puissance",
    "nom": "HB Poussée — Puissance (développé explosif + triceps)",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Puissance de poussée pour les duels, les tirs en appui et la finition : mouvements explosifs d'abord (frais), triceps ensuite.",
    "protocole": "Durée ~50 min. Sur les mouvements explosifs, l'intention est la VITESSE de la barre, pas la fatigue : on arrête la série dès que la vitesse chute. Repos complets. 1 fois par semaine, 48 h avant un match minimum.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Développé couché",
        "series": 5,
        "reps": "3",
        "charge": "50-60 % 1RM, vitesse max",
        "repos": "2'",
        "notes": "Descente contrôlée, poussée la plus rapide possible, barre qui ne ralentit pas.",
        "biblio": "Développé couché",
        "blocNom": "Puissance (frais)"
      },
      {
        "nom": "Plyometric Push-up",
        "series": 4,
        "reps": "5",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Pompe claquée explosive, réception souple des coudes. Mains qui décollent du sol.",
        "biblio": "Plyometric Push-up"
      },
      {
        "nom": "Med Ball Throw",
        "series": 4,
        "reps": "5",
        "charge": "Médecine-ball 3-4 kg, passe poitrine contre un mur",
        "repos": "90s",
        "notes": "Lancer de la poitrine avec extension complète des bras, rattraper et relancer.",
        "biblio": "Med Ball Throw"
      },
      {
        "nom": "Développé militaire",
        "series": 4,
        "reps": "3",
        "charge": "60 % 1RM, explosif",
        "repos": "2'",
        "notes": "Poussée rapide au-dessus de la tête, gainage serré, verrouillage complet des bras.",
        "biblio": "Développé militaire",
        "blocNom": "Épaules"
      },
      {
        "nom": "Dips triceps",
        "series": 3,
        "reps": "8",
        "charge": "Poids de corps ou lest léger",
        "repos": "90s",
        "notes": "Descente contrôlée, poussée rapide, coudes proches du corps.",
        "biblio": "Dips triceps",
        "blocNom": "Triceps"
      },
      {
        "nom": "Triceps poulie haute",
        "series": 3,
        "reps": "10",
        "charge": "Charge modérée, extension rapide",
        "repos": "60s",
        "notes": "Extension explosive, retour lent sur 2 s.",
        "biblio": "Triceps poulie haute"
      }
    ]
  },
  {
    "id": "hb_push_plyo",
    "nom": "HB Poussée — Plyométrie haut du corps",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Pliométrie du haut du corps : réactivité des bras, des épaules et des triceps pour les tirs, passes rapides et duels.",
    "protocole": "Durée ~35 min. Toujours frais, réceptions amorties, qualité avant quantité. Arrêter si les coudes ou les poignets se dégradent. 1 à 2 fois par semaine, jamais après un gros volume de tirs.",
    "isTemplate": true,
    "rpeCible": 6,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Plyometric Push-up",
        "series": 4,
        "reps": "5",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Pompe claquée, réception souple, coudes sous contrôle.",
        "biblio": "Plyometric Push-up",
        "blocNom": "Plyo pompes"
      },
      {
        "nom": "Pompes explosives mains décalées",
        "series": 3,
        "reps": "4 / côté",
        "charge": "Poids de corps, une main sur une balle ou une plateforme",
        "repos": "90s",
        "notes": "Pompe explosive en changeant de côté : réactivité et stabilité d'épaule."
      },
      {
        "nom": "Medicine Ball Slam",
        "series": 4,
        "reps": "6",
        "charge": "Médecine-ball 4-6 kg",
        "repos": "75s",
        "notes": "Lancer au sol à intention maximale, extension complète des bras.",
        "biblio": "Medicine Ball Slam",
        "blocNom": "Lancers"
      },
      {
        "nom": "Med Ball Throw",
        "series": 4,
        "reps": "5",
        "charge": "Médecine-ball 2-3 kg, passe poitrine contre un mur",
        "repos": "75s",
        "notes": "Rattraper et relancer immédiatement : réactivité des bras.",
        "biblio": "Med Ball Throw"
      },
      {
        "nom": "Lancer-rattrapé alterné",
        "series": 3,
        "reps": "8 / bras",
        "charge": "Balle ou médecine-ball léger",
        "repos": "60s",
        "notes": "Lancer vertical et rattrapé rapide, épaule stable, contrôle du bras.",
        "biblio": "Lancer-rattrapé alterné"
      },
      {
        "nom": "Pompes diamant explosives",
        "series": 3,
        "reps": "6",
        "charge": "Poids de corps",
        "repos": "75s",
        "notes": "Mains rapprochées, poussée explosive. Triceps.",
        "blocNom": "Triceps"
      }
    ]
  },
  {
    "id": "hb_push_vitesse",
    "nom": "HB Poussée — Vitesse du bras (tir & lancer)",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Vitesse d'exécution du haut du corps : lancers, poussées rapides et triceps explosifs, pour accélérer le bras de tir.",
    "protocole": "Durée ~40 min. Charges légères, intention de vitesse maximale, repos complets. Idéal en phase de compétition pour garder de la vitesse sans fatigue. 1 à 2 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Lancers de balle au mur, bras armé",
        "series": 4,
        "reps": "6 / bras",
        "charge": "Balle de handball ou balle lestée 300-500 g",
        "repos": "75s",
        "notes": "Geste de tir complet contre un mur, bras armé, vitesse maximale. Récupérer entre les séries.",
        "blocNom": "Vitesse du bras"
      },
      {
        "nom": "Med Ball Throw",
        "series": 4,
        "reps": "5 / côté",
        "charge": "Médecine-ball 2-3 kg",
        "repos": "75s",
        "notes": "Lancer rotationnel rapide contre un mur, puissance de hanche vers le bras.",
        "biblio": "Med Ball Throw"
      },
      {
        "nom": "Développé couché",
        "series": 8,
        "reps": "2",
        "charge": "30-40 % 1RM, vitesse max",
        "repos": "60s",
        "notes": "Séries courtes à vitesse maximale. Si la vitesse baisse, on arrête.",
        "biblio": "Développé couché",
        "blocNom": "Poussée rapide"
      },
      {
        "nom": "Pompes rapides sur 10 s",
        "series": 4,
        "reps": "10 s max",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Un maximum de pompes propres en 10 s. Compter les reps et chercher à battre le score."
      },
      {
        "nom": "Triceps poulie haute explosif",
        "series": 3,
        "reps": "8",
        "charge": "Charge légère-modérée",
        "repos": "60s",
        "notes": "Extension la plus rapide possible, retour contrôlé.",
        "biblio": "Triceps poulie haute",
        "blocNom": "Triceps"
      },
      {
        "nom": "Élévations latérales rapides",
        "series": 3,
        "reps": "12",
        "charge": "Haltères légers",
        "repos": "45s",
        "notes": "Montée vive, descente contrôlée. Deltoïde moyen.",
        "biblio": "Élévations latérales"
      }
    ]
  },
  {
    "id": "hb_push_contraste",
    "nom": "HB Poussée — Contraste lourd/léger (haut du corps)",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Méthode du contraste appliquée au haut du corps : une série lourde suivie d'un mouvement explosif léger, pour gagner en puissance de poussée.",
    "protocole": "Durée ~50 min. Binôme = série lourde, 30 à 60 s de repos, mouvement explosif, puis récupération longue (3'). Pour les joueurs ayant une bonne base de force. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Développé couché",
        "series": 4,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "30-60 s puis pompes claquées",
        "notes": "Série lourde, 1-2 reps en réserve. Enchaîner avec la pompe claquée.",
        "biblio": "Développé couché",
        "blocNom": "Binôme 1 — poussée"
      },
      {
        "nom": "Plyometric Push-up",
        "series": 4,
        "reps": "4",
        "charge": "Poids de corps",
        "repos": "3'",
        "notes": "Pompe claquée explosive juste après le développé.",
        "biblio": "Plyometric Push-up"
      },
      {
        "nom": "Développé militaire",
        "series": 3,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "30-60 s puis lancer",
        "notes": "Série lourde au-dessus de la tête. Enchaîner avec le lancer.",
        "biblio": "Développé militaire",
        "blocNom": "Binôme 2 — épaules"
      },
      {
        "nom": "Medicine Ball Slam",
        "series": 3,
        "reps": "5",
        "charge": "Médecine-ball 4-6 kg",
        "repos": "3'",
        "notes": "Lancer explosif juste après le développé militaire.",
        "biblio": "Medicine Ball Slam"
      },
      {
        "nom": "Dips triceps",
        "series": 3,
        "reps": "6",
        "charge": "Lesté (RPE 8)",
        "repos": "2'",
        "notes": "Triceps lourd, descente contrôlée.",
        "biblio": "Dips triceps",
        "blocNom": "Triceps"
      }
    ]
  },
  {
    "id": "hb_triceps_epaules_force",
    "nom": "HB Triceps & épaules — Force (poussée lourde)",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Force maximale de poussée en peu de répétitions : épaules et triceps, pour les tirs en appui, les duels et la protection de l'articulation.",
    "protocole": "Durée ~55 min. Charges lourdes, repos longs (2'30 à 3'), jamais jusqu'à l'échec. Associer à une séance de tirage dans la semaine. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Développé militaire",
        "series": 5,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "3'",
        "notes": "Gainage serré, barre dans l'axe, verrouillage complet.",
        "biblio": "Développé militaire",
        "blocNom": "Poussée lourde"
      },
      {
        "nom": "Dips",
        "series": 4,
        "reps": "5",
        "charge": "Lesté (RPE 8)",
        "repos": "2'30",
        "notes": "Descente contrôlée, poussée puissante. Épaules et triceps.",
        "biblio": "Dips"
      },
      {
        "nom": "Développé couché prise serrée",
        "series": 4,
        "reps": "4",
        "charge": "80 % 1RM (RPE 8)",
        "repos": "2'30",
        "notes": "Mains à largeur d'épaules, coudes proches du corps. Triceps."
      },
      {
        "nom": "Skull Crusher",
        "series": 3,
        "reps": "6",
        "charge": "Charge lourde (RPE 8)",
        "repos": "2'",
        "notes": "Descente lente et contrôlée vers le front, coudes fixes.",
        "biblio": "Skull Crusher",
        "blocNom": "Triceps"
      },
      {
        "nom": "Triceps overhead",
        "series": 3,
        "reps": "8",
        "charge": "Charge modérée (RPE 7)",
        "repos": "90s",
        "notes": "Étirement complet du triceps à la descente.",
        "biblio": "Triceps overhead"
      },
      {
        "nom": "Élévations latérales",
        "series": 3,
        "reps": "12",
        "charge": "Haltères légers",
        "repos": "45s",
        "notes": "Contrôle, pas de balancement. Deltoïde moyen.",
        "biblio": "Élévations latérales",
        "blocNom": "Épaules"
      }
    ]
  },
  {
    "id": "hb_triceps_epaules_volume",
    "nom": "HB Triceps & épaules — Volume & tonus",
    "categorie": "Handball — Haut du corps",
    "couleur": "#FF6B9D",
    "equipement": "salle",
    "description": "Travail en séries moyennes pour construire de la masse utile dans les épaules et les triceps, hors période de forte charge de tirs.",
    "protocole": "Durée ~45 min. Contrôle du mouvement, 1-2 reps en réserve. 1 à 2 fois par semaine en période d'accumulation.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Arnold Press",
        "series": 4,
        "reps": "10",
        "charge": "Haltères modérés",
        "repos": "75s",
        "notes": "Rotation fluide, épaules basses au départ.",
        "biblio": "Arnold Press",
        "blocNom": "Épaules"
      },
      {
        "nom": "Dips triceps",
        "series": 3,
        "reps": "10",
        "charge": "Poids de corps ou lest léger",
        "repos": "75s",
        "notes": "Coudes proches du corps, amplitude complète.",
        "biblio": "Dips triceps",
        "blocNom": "Triceps"
      },
      {
        "nom": "Skull Crusher",
        "series": 3,
        "reps": "10",
        "charge": "Charge modérée",
        "repos": "60s",
        "notes": "Descente lente, coudes fixes.",
        "biblio": "Skull Crusher"
      },
      {
        "nom": "Triceps overhead",
        "series": 3,
        "reps": "12",
        "charge": "Charge modérée",
        "repos": "60s",
        "notes": "Étirement complet à la descente.",
        "biblio": "Triceps overhead"
      },
      {
        "nom": "Triceps poulie haute",
        "series": 3,
        "reps": "12",
        "charge": "Charge modérée",
        "repos": "45s",
        "notes": "Extension complète, retour contrôlé.",
        "biblio": "Triceps poulie haute"
      },
      {
        "nom": "Élévations latérales",
        "series": 3,
        "reps": "15",
        "charge": "Haltères légers",
        "repos": "45s",
        "notes": "Coudes légèrement fléchis, montée contrôlée.",
        "biblio": "Élévations latérales"
      },
      {
        "nom": "Pompes",
        "series": 2,
        "reps": "max - 2",
        "charge": "Poids de corps",
        "repos": "60s",
        "notes": "Finisseur, 2 reps en réserve.",
        "biblio": "Pompes"
      }
    ]
  },
  {
    "id": "hb_hanche_extension_force",
    "nom": "HB Hanche — Extension & fessiers (force)",
    "categorie": "Handball — Hanche",
    "couleur": "#E5484D",
    "equipement": "salle",
    "description": "Extension de hanche lourde : fessiers et ischios en peu de répétitions. La base des sauts, des appuis, des démarrages et de la protection du dos et des genoux.",
    "protocole": "Durée ~55 min. Charges lourdes, repos longs (2'30 à 3'), pause 1 s en contraction en haut sur chaque rep de Hip Thrust. Bassin neutre, pas de cambrure lombaire. 1 à 2 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Hip Thrust",
        "series": 5,
        "reps": "5",
        "charge": "85 % de ton max (RPE 8)",
        "repos": "3'",
        "notes": "Menton rentré, extension complète en haut avec pause 1 s, fessiers serrés. Pas de cambrure lombaire.",
        "biblio": "Hip Thrust",
        "blocNom": "Extension de hanche lourde"
      },
      {
        "nom": "Romanian Deadlift (RDL)",
        "series": 4,
        "reps": "5",
        "charge": "Lourd (RPE 8)",
        "repos": "2'30",
        "notes": "Charnière de hanche, dos neutre, barre proche des jambes. Étirement des ischios, remontée par les fessiers.",
        "biblio": "Romanian Deadlift (RDL)"
      },
      {
        "nom": "Hip Thrust unilatéral",
        "series": 3,
        "reps": "6 / jambe",
        "charge": "Charge modérée-lourde (RPE 8)",
        "repos": "90s",
        "notes": "Bassin horizontal, pas de rotation. Corriger l'écart G/D.",
        "biblio": "Hip Thrust unilatéral",
        "blocNom": "Unilatéral"
      },
      {
        "nom": "Hyperextension / Back Extension",
        "series": 3,
        "reps": "8",
        "charge": "Lesté (RPE 7), fessiers dominants",
        "repos": "90s",
        "notes": "Pivoter autour des hanches, pas des lombaires. Fessiers serrés en haut.",
        "biblio": "Hyperextension / Back Extension"
      },
      {
        "nom": "Cable Kickback",
        "series": 3,
        "reps": "10 / jambe",
        "charge": "Poulie, charge modérée",
        "repos": "60s",
        "notes": "Extension de hanche jambe tendue, sans cambrer. Contraction 1 s.",
        "biblio": "Cable Kickback",
        "blocNom": "Isolation fessiers"
      },
      {
        "nom": "Nordic Curl",
        "series": 3,
        "reps": "4",
        "charge": "Poids de corps (assisté si besoin)",
        "repos": "90s",
        "notes": "Prévention ischios : descente la plus lente possible.",
        "biblio": "Nordic Curl",
        "blocNom": "Prévention"
      }
    ]
  },
  {
    "id": "hb_hanche_flexion",
    "nom": "HB Hanche — Flexion & fléchisseurs (relance, sprint)",
    "categorie": "Handball — Hanche",
    "couleur": "#E5484D",
    "equipement": "mixte",
    "description": "Renforce les fléchisseurs de hanche (psoas, droit fémoral) pour la montée du genou à la course, la relance et l'impulsion du tir en suspension. Souvent oubliés, pourtant décisifs en vitesse.",
    "protocole": "Durée ~40 min. Qualité d'abord : bassin neutre, tronc stable, pas de balancement. Les maintiens isométriques sont tenus à 90° de flexion. Travailler les deux jambes. À faire frais, idéalement 2 fois par semaine en phase de vitesse.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Hip 90/90",
        "series": 2,
        "reps": "6 / côté",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Mobilité de hanche en rotation interne/externe : prépare le travail de flexion.",
        "biblio": "Hip 90/90",
        "blocNom": "Mobilité"
      },
      {
        "nom": "Montée de genou à la poulie basse",
        "series": 4,
        "reps": "8 / jambe",
        "charge": "Poulie basse, sangle de cheville, charge modérée",
        "repos": "60s",
        "notes": "Debout, tronc droit, monter le genou à 90° et au-delà sans basculer le bassin. Descente contrôlée sur 2 s.",
        "blocNom": "Flexion de hanche"
      },
      {
        "nom": "Maintien isométrique genou à 90° (bande)",
        "series": 3,
        "reps": "20 s / jambe",
        "charge": "Bande autour du pied, genou à 90° de flexion",
        "repos": "45s",
        "notes": "Debout sur une jambe, genou levé à 90° : tenir 20 s contre la traction de la bande. Bassin stable, tronc fixe."
      },
      {
        "nom": "Marche genou haut résistée (bande)",
        "series": 3,
        "reps": "10 pas / jambe",
        "charge": "Mini-band autour des pieds",
        "repos": "60s",
        "notes": "Marche lente en levant le genou à 90°, tronc droit, appui stable sur la jambe d'appui."
      },
      {
        "nom": "Dead Bug",
        "series": 3,
        "reps": "8 / côté",
        "charge": "Poids de corps",
        "repos": "45s",
        "notes": "Lombaires collées au sol, genou ramené à 90° : gainage + flexion de hanche.",
        "biblio": "Dead Bug",
        "blocNom": "Gainage"
      },
      {
        "nom": "Squat bulgare",
        "series": 3,
        "reps": "6 / jambe",
        "charge": "Charge modérée (RPE 7)",
        "repos": "90s",
        "notes": "Étirement du fléchisseur de la jambe arrière, poussée par la jambe avant.",
        "biblio": "Squat bulgare",
        "blocNom": "Force unilatérale"
      },
      {
        "nom": "Éducatifs skipping explosifs",
        "series": 3,
        "reps": "15 m",
        "charge": "Poids de corps",
        "repos": "45s",
        "notes": "Skipping rapide, genou haut, contact court. Transfert direct vers la course.",
        "blocNom": "Transfert vitesse"
      }
    ]
  },
  {
    "id": "hb_hanche_puissance",
    "nom": "HB Hanche — Puissance d'extension (explosif)",
    "categorie": "Handball — Hanche",
    "couleur": "#E5484D",
    "equipement": "salle",
    "description": "Extension de hanche explosive : la source de puissance des sauts, des relances et des tirs. Mouvements balistiques d'abord, force ensuite.",
    "protocole": "Durée ~50 min. À faire frais. Sur chaque mouvement explosif, l'intention est la vitesse maximale : on s'arrête dès que la vitesse baisse. Repos complets. 1 fois par semaine, 48 h avant un match minimum.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Kettlebell Swing",
        "series": 5,
        "reps": "8",
        "charge": "Kettlebell lourd",
        "repos": "90s",
        "notes": "Extension de hanche explosive, bras relâchés, fessiers serrés en haut.",
        "biblio": "Kettlebell Swing",
        "blocNom": "Balistique"
      },
      {
        "nom": "Hip Thrust",
        "series": 4,
        "reps": "4",
        "charge": "50-60 % de ton max, vitesse max",
        "repos": "2'",
        "notes": "Montée la plus rapide possible, pause 1 s en haut, descente contrôlée.",
        "biblio": "Hip Thrust"
      },
      {
        "nom": "Jump Squat",
        "series": 4,
        "reps": "4",
        "charge": "Barre légère (20-30 %) ou poids de corps",
        "repos": "2'",
        "notes": "Impulsion maximale par l'extension de hanche, réception amortie.",
        "biblio": "Jump Squat"
      },
      {
        "nom": "Broad Jump",
        "series": 4,
        "reps": "3",
        "charge": "Poids de corps",
        "repos": "90s",
        "notes": "Saut en longueur départ arrêté, réception tenue 2 s. Mesurer.",
        "biblio": "Broad Jump",
        "blocNom": "Plyo horizontal"
      },
      {
        "nom": "Box Jump",
        "series": 3,
        "reps": "4",
        "charge": "Caisse 50 cm",
        "repos": "90s",
        "notes": "Extension explosive de hanche, réception souple sur la caisse.",
        "biblio": "Box Jump"
      },
      {
        "nom": "Lateral Bound",
        "series": 3,
        "reps": "4 / côté",
        "charge": "Poids de corps",
        "repos": "75s",
        "notes": "Poussée latérale par la hanche, réception tenue.",
        "biblio": "Lateral Bound"
      }
    ]
  },
  {
    "id": "hb_hanche_complete",
    "nom": "HB Hanche — Protocole complet (extension, flexion, stabilité)",
    "categorie": "Handball — Hanche",
    "couleur": "#E5484D",
    "equipement": "salle",
    "description": "Séance qui travaille toute la hanche dans tous les plans : extension (fessiers), flexion (fléchisseurs), abduction (fessier moyen) et stabilité. Idéale en une seule séance par semaine.",
    "protocole": "Durée ~60 min. Du plus lourd au plus fin. Bassin stable et sans compensation lombaire. Adapter les charges au niveau de chaque joueur. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Hip 90/90",
        "series": 2,
        "reps": "6 / côté",
        "charge": "Poids de corps",
        "repos": "30s",
        "notes": "Mobilité de hanche en rotation, activation de départ.",
        "biblio": "Hip 90/90",
        "blocNom": "Mobilité"
      },
      {
        "nom": "Hip Thrust",
        "series": 4,
        "reps": "6",
        "charge": "Lourd (RPE 8)",
        "repos": "2'30",
        "notes": "Extension de hanche : pause 1 s en haut, fessiers serrés.",
        "biblio": "Hip Thrust",
        "blocNom": "Extension"
      },
      {
        "nom": "Montée de genou à la poulie basse",
        "series": 3,
        "reps": "8 / jambe",
        "charge": "Poulie basse, charge modérée",
        "repos": "60s",
        "notes": "Flexion de hanche contrôlée, tronc stable.",
        "blocNom": "Flexion"
      },
      {
        "nom": "Squat bulgare",
        "series": 3,
        "reps": "6 / jambe",
        "charge": "Charge modérée-lourde (RPE 8)",
        "repos": "90s",
        "notes": "Hanche et genou, descente contrôlée.",
        "biblio": "Squat bulgare",
        "blocNom": "Unilatéral"
      },
      {
        "nom": "Fente latérale",
        "series": 3,
        "reps": "6 / côté",
        "charge": "Charge modérée",
        "repos": "75s",
        "notes": "Hanche dans le plan frontal, fessier moyen et adducteurs. Appuis comme en défense.",
        "biblio": "Fente latérale",
        "blocNom": "Plan frontal"
      },
      {
        "nom": "Marche latérale bande",
        "series": 3,
        "reps": "10 pas / côté",
        "charge": "Mini-band au-dessus des genoux",
        "repos": "45s",
        "notes": "Appuis fléchis, abduction contrôlée. Fessier moyen.",
        "blocNom": "Stabilité"
      },
      {
        "nom": "RDL unilatéral",
        "series": 3,
        "reps": "6 / jambe",
        "charge": "Charge modérée (RPE 7)",
        "repos": "90s",
        "notes": "Équilibre et chaîne postérieure, hanche qui recule, bassin horizontal.",
        "biblio": "RDL unilatéral"
      }
    ]
  },
  {
    "id": "hb_hanche_stabilite",
    "nom": "HB Hanche — Stabilité & fessier moyen (appuis, duels)",
    "categorie": "Handball — Hanche",
    "couleur": "#E5484D",
    "equipement": "salle",
    "description": "Contrôle de la hanche sur un appui et dans le plan frontal : fessier moyen, rotateurs et adducteurs. Protège le genou et la cheville lors des changements de direction et des duels.",
    "protocole": "Durée ~35 min. Contrôle avant charge : genou aligné sur le pied, bassin horizontal. Faire d'abord le côté faible. 2 fois par semaine en prévention.",
    "isTemplate": true,
    "rpeCible": 6,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Clamshell",
        "series": 3,
        "reps": "15 / côté",
        "charge": "Mini-band",
        "repos": "30s",
        "notes": "Rotation externe de hanche, bassin immobile. Activation du fessier moyen.",
        "biblio": "Clamshell",
        "blocNom": "Activation"
      },
      {
        "nom": "Marche latérale bande",
        "series": 3,
        "reps": "12 pas / côté",
        "charge": "Mini-band au-dessus des genoux",
        "repos": "45s",
        "notes": "Pas chassés en position fléchie, bande tendue en permanence."
      },
      {
        "nom": "Step-up latéral",
        "series": 3,
        "reps": "8 / jambe",
        "charge": "Caisse 30-40 cm, charge légère",
        "repos": "60s",
        "notes": "Montée latérale contrôlée, genou aligné, hanche stable.",
        "biblio": "Step-up latéral",
        "blocNom": "Appuis latéraux"
      },
      {
        "nom": "Hip Thrust unilatéral",
        "series": 3,
        "reps": "8 / jambe",
        "charge": "Charge modérée",
        "repos": "75s",
        "notes": "Bassin horizontal, pas de rotation. Corriger l'écart G/D.",
        "biblio": "Hip Thrust unilatéral"
      },
      {
        "nom": "Fente latérale",
        "series": 3,
        "reps": "6 / côté",
        "charge": "Charge légère-modérée",
        "repos": "60s",
        "notes": "Hanche dans le plan frontal, appuis comme en défense.",
        "biblio": "Fente latérale"
      },
      {
        "nom": "Équilibre unipodal",
        "series": 3,
        "reps": "30 s / jambe",
        "charge": "Poids de corps, yeux ouverts puis fermés",
        "repos": "30s",
        "notes": "Stabilité de hanche et de cheville, bassin horizontal.",
        "biblio": "Équilibre unipodal",
        "blocNom": "Équilibre"
      }
    ]
  },
  {
    "id": "hb_fessiers_volume",
    "nom": "HB Fessiers — Volume maximum (hypertrophie)",
    "categorie": "Handball — Hanche",
    "couleur": "#E5484D",
    "equipement": "salle",
    "description": "Séance de construction du fessier : volume élevé, séries moyennes et contractions longues, pour développer la masse utile à la puissance et à la prévention.",
    "protocole": "Durée ~55 min. Contraction maximale à chaque rep, tempo contrôlé, 1-2 reps en réserve. Idéal en période d'accumulation (hors forte charge de match). 1 à 2 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Hip Thrust",
        "series": 4,
        "reps": "10",
        "charge": "Charge modérée-lourde (RPE 7-8)",
        "repos": "90s",
        "notes": "Pause 1 s en haut, descente sur 2 s. Fessiers serrés.",
        "biblio": "Hip Thrust",
        "blocNom": "Volume principal"
      },
      {
        "nom": "Romanian Deadlift (RDL)",
        "series": 3,
        "reps": "10",
        "charge": "Charge modérée (RPE 7)",
        "repos": "90s",
        "notes": "Étirement maximal des fessiers et ischios.",
        "biblio": "Romanian Deadlift (RDL)"
      },
      {
        "nom": "Squat bulgare",
        "series": 3,
        "reps": "10 / jambe",
        "charge": "Charge modérée (RPE 7)",
        "repos": "90s",
        "notes": "Buste légèrement penché, accent sur le fessier de la jambe avant.",
        "biblio": "Squat bulgare"
      },
      {
        "nom": "Cable Kickback",
        "series": 3,
        "reps": "12 / jambe",
        "charge": "Poulie, charge modérée",
        "repos": "45s",
        "notes": "Extension jambe tendue, contraction 1 s, sans cambrer.",
        "biblio": "Cable Kickback"
      },
      {
        "nom": "Hyperextension / Back Extension",
        "series": 3,
        "reps": "12",
        "charge": "Lesté (RPE 7), fessiers dominants",
        "repos": "60s",
        "notes": "Pivoter autour des hanches, fessiers serrés en haut.",
        "biblio": "Hyperextension / Back Extension"
      },
      {
        "nom": "Glute Bridge",
        "series": 3,
        "reps": "15",
        "charge": "Poids de corps ou léger, pause 2 s",
        "repos": "45s",
        "notes": "Finisseur : brûlure fessière, bassin en rétroversion en haut.",
        "biblio": "Glute Bridge",
        "blocNom": "Finisseur"
      }
    ]
  },
  {
    "id": "hb_halte_initiation",
    "nom": "Haltéro — Initiation & éducatifs techniques",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Apprendre les bases de l'haltérophilie en sécurité : position de départ, tirage, réception. Que de l'éducatif, charges légères, aucune recherche de performance.",
    "protocole": "Durée ~45 min. Pour les joueurs qui débutent ou reprennent. Barre à vide ou 40-50 %, UNE consigne technique par exercice, à encadrer par le coach. 2 fois par semaine pendant 4 à 6 semaines avant de monter les charges.",
    "isTemplate": true,
    "rpeCible": 4,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Position de départ & tirage depuis les genoux (Clean Pull léger)",
        "series": 4,
        "reps": "4",
        "charge": "Barre à vide ou 40 %",
        "repos": "60s",
        "notes": "Dos plat, barre sous les genoux, extension complète hanche-genou-cheville, bras tendus. Apprendre la position de départ.",
        "blocNom": "Éducatifs de tirage"
      },
      {
        "nom": "Haussement d'épaules explosif (Jump Shrug)",
        "series": 3,
        "reps": "4",
        "charge": "Barre à vide ou 40 %",
        "repos": "60s",
        "notes": "Extension explosive jusqu'à la pointe des pieds puis haussement. Bras tendus."
      },
      {
        "nom": "Hang Power Clean léger",
        "series": 4,
        "reps": "3",
        "charge": "40-50 % du max estimé",
        "repos": "90s",
        "notes": "Départ barre à mi-cuisse, extension, réception en quart de squat, coudes hauts. Technique avant tout.",
        "biblio": "Power Clean",
        "blocNom": "Éducatif épaulé"
      },
      {
        "nom": "Front Squat léger (réception)",
        "series": 3,
        "reps": "5",
        "charge": "Charge légère (RPE 5)",
        "repos": "90s",
        "notes": "Coudes hauts, tronc vertical : prépare la réception de l'épaulé.",
        "biblio": "Front Squat"
      },
      {
        "nom": "Squat overhead (barre à vide)",
        "series": 3,
        "reps": "5",
        "charge": "Barre à vide ou bâton",
        "repos": "60s",
        "notes": "Bras tendus au-dessus de la tête, mobilité d'épaule et de hanche. Prépare l'arraché.",
        "biblio": "Squat overhead",
        "blocNom": "Éducatif arraché"
      },
      {
        "nom": "Tirage arraché depuis les genoux (Snatch Pull léger)",
        "series": 3,
        "reps": "4",
        "charge": "Barre à vide ou 40 %",
        "repos": "60s",
        "notes": "Prise large, extension explosive, la barre monte jusqu'au nombril."
      }
    ]
  },
  {
    "id": "hb_halte_force",
    "nom": "Haltéro — Force (tirages lourds & squat)",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Pure FORCE : tirages lourds et squats en peu de répétitions. On construit la force de base sans chercher la vitesse ni la réception.",
    "protocole": "Durée ~60 min. Charges lourdes, repos longs (2'30 à 3'), jamais jusqu'à l'échec. Tirages à 100-110 % du max d'épaulé / d'arraché, pas de réception. 1 fois par semaine, en début de cycle ou loin du match.",
    "isTemplate": true,
    "rpeCible": 8,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Tirage épaulé depuis le sol (Clean Pull)",
        "series": 5,
        "reps": "3",
        "charge": "100-110 % du max d'épaulé",
        "repos": "2'30",
        "notes": "Extension triple lourde, bras tendus, pas de réception. Vitesse non recherchée.",
        "blocNom": "Tirages lourds"
      },
      {
        "nom": "Tirage arraché depuis le sol (Snatch Pull)",
        "series": 4,
        "reps": "3",
        "charge": "100-105 % du max d'arraché",
        "repos": "2'",
        "notes": "Extension complète en prise large."
      },
      {
        "nom": "Front Squat",
        "series": 5,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "3'",
        "notes": "Coudes hauts, tronc vertical, force de jambes.",
        "biblio": "Front Squat",
        "blocNom": "Squats lourds"
      },
      {
        "nom": "Back Squat",
        "series": 4,
        "reps": "3",
        "charge": "85-90 % 1RM (RPE 8)",
        "repos": "3'",
        "notes": "Force de jambes, 1-2 reps en réserve.",
        "biblio": "Back Squat"
      },
      {
        "nom": "Deadlift conventionnel",
        "series": 3,
        "reps": "3",
        "charge": "85 % 1RM (RPE 8)",
        "repos": "3'",
        "notes": "Force de tirage depuis le sol, dos plat.",
        "biblio": "Deadlift conventionnel"
      }
    ]
  },
  {
    "id": "hb_halte_vitesse",
    "nom": "Haltéro — Vitesse de barre (charges légères, intention max)",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Pure VITESSE / puissance : mouvements olympiques à charge légère et vitesse de barre maximale. Aucune recherche de charge ni de force.",
    "protocole": "Durée ~40 min. À faire frais (début de séance), séries courtes, repos complets : on arrête dès que la technique ou la vitesse de barre se dégrade. Charge 55-70 % du max, la barre ne doit jamais ralentir. Aucun squat lourd, aucun travail de force. 1 à 2 fois par semaine en phase de vitesse.",
    "isTemplate": true,
    "rpeCible": 6,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Power Clean",
        "series": 8,
        "reps": "2",
        "charge": "55-70 % du max d'épaulé",
        "repos": "90s",
        "notes": "Vitesse de barre maximale, réception en quart de squat. On arrête dès que la barre ralentit.",
        "biblio": "Power Clean",
        "blocNom": "Vitesse de barre"
      },
      {
        "nom": "Power Snatch",
        "series": 6,
        "reps": "2",
        "charge": "55-65 % du max d'arraché",
        "repos": "90s",
        "notes": "Extension explosive, barre bras tendus au-dessus de la tête. Vitesse avant tout."
      },
      {
        "nom": "Jump Shrug",
        "series": 4,
        "reps": "3",
        "charge": "50-60 % du max d'épaulé",
        "repos": "90s",
        "notes": "Extension triple explosive, sans réception, pointes de pieds."
      },
      {
        "nom": "Push Press léger",
        "series": 4,
        "reps": "3",
        "charge": "55-65 % du max de développé militaire",
        "repos": "90s",
        "notes": "Impulsion de jambes rapide, barre qui part vite."
      }
    ]
  },
  {
    "id": "hb_halte_hang_match",
    "nom": "Haltéro — Veille de match : suspension haute uniquement (hang)",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Séance courte à placer avant un match : uniquement des mouvements depuis la suspension haute (hang), volume bas et charges modérées. Garde la puissance sans fatigue.",
    "protocole": "Durée ~25 min. À placer à J-1 ou J-2 du match. UNIQUEMENT des départs en suspension haute (barre à mi-cuisse), pas de départ du sol, aucun squat. 70 % du max, 2 reps, vitesse maximale, 3 reps en réserve. On sort plus frais qu'en entrant.",
    "isTemplate": true,
    "rpeCible": 4,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Hang Power Clean (suspension haute)",
        "series": 5,
        "reps": "2",
        "charge": "70 % du max d'épaulé",
        "repos": "90s",
        "notes": "Barre à mi-cuisse, extension explosive, réception en quart de squat. Vitesse maximale, aucune fatigue.",
        "biblio": "Power Clean",
        "blocNom": "Hang — veille de match"
      },
      {
        "nom": "Hang Power Snatch (suspension haute)",
        "series": 4,
        "reps": "2",
        "charge": "65-70 % du max d'arraché",
        "repos": "90s",
        "notes": "Départ mi-cuisse, extension explosive, barre bras tendus au-dessus de la tête."
      },
      {
        "nom": "Jump Shrug en suspension haute",
        "series": 3,
        "reps": "3",
        "charge": "60 % du max d'épaulé",
        "repos": "75s",
        "notes": "Extension explosive sans réception. Active le système nerveux sans fatiguer."
      }
    ]
  },
  {
    "id": "hb_halte_complexes",
    "nom": "Haltéro — Complexes (enchaînements sans reposer la barre)",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Complexes olympiques : plusieurs mouvements enchaînés sans reposer la barre, présentés exercice par exercice. Travaille la coordination, la puissance et l'endurance de puissance.",
    "protocole": "Durée ~40 min. Chaque complexe = les exercices listés dans l'ordre, enchaînés SANS reposer la barre (1 rep de chaque), puis repos complet de 2'30 après le dernier mouvement. Une « série » = un passage complet du complexe. Charge calée sur le mouvement le plus faible (souvent 60-65 % du max d'épaulé). Technique irréprochable, on arrête dès que la barre ralentit. 1 fois par semaine, à distance du match.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Hang Power Clean",
        "series": 5,
        "reps": "1",
        "charge": "60-65 % du max d'épaulé",
        "repos": "5s",
        "notes": "Départ mi-cuisse, extension explosive, réception en quart de squat. Enchaîner directement avec le Front Squat, sans reposer la barre.",
        "biblio": "Power Clean",
        "blocNom": "Complexe A — Épaulé + Front Squat + Jeté"
      },
      {
        "nom": "Front Squat",
        "series": 5,
        "reps": "1",
        "charge": "Même barre",
        "repos": "5s",
        "notes": "Directement après l'épaulé : descendre en front squat, coudes hauts, puis remonter. Enchaîner avec le Push Jerk.",
        "biblio": "Front Squat"
      },
      {
        "nom": "Push Jerk",
        "series": 5,
        "reps": "1",
        "charge": "Même barre",
        "repos": "2'30",
        "notes": "Dip rapide, extension, réception genoux fléchis, bras verrouillés. Fin du complexe : reposer la barre, repos complet 2'30 avant le tour suivant."
      },
      {
        "nom": "Hang Power Snatch",
        "series": 4,
        "reps": "1",
        "charge": "50-60 % du max d'arraché",
        "repos": "5s",
        "notes": "Départ mi-cuisse, extension explosive, barre bras tendus au-dessus de la tête. Enchaîner directement avec le squat overhead.",
        "blocNom": "Complexe B — Arraché + Squat overhead"
      },
      {
        "nom": "Squat overhead",
        "series": 4,
        "reps": "1",
        "charge": "Même barre",
        "repos": "2'30",
        "notes": "Descendre en squat bras tendus au-dessus de la tête, tronc vertical, puis remonter. Fin du complexe : reposer la barre, repos complet 2'30.",
        "biblio": "Squat overhead"
      },
      {
        "nom": "Clean Pull (tirage épaulé)",
        "series": 4,
        "reps": "1",
        "charge": "55-60 % du max d'épaulé",
        "repos": "5s",
        "notes": "Tirage depuis le sol, extension complète, bras tendus. Enchaîner directement avec le Hang Power Clean.",
        "blocNom": "Complexe C — Tirage + Épaulé + Push Press"
      },
      {
        "nom": "Hang Power Clean",
        "series": 4,
        "reps": "1",
        "charge": "Même barre",
        "repos": "5s",
        "notes": "Départ mi-cuisse, extension explosive, réception en quart de squat. Enchaîner avec le Push Press.",
        "biblio": "Power Clean"
      },
      {
        "nom": "Push Press",
        "series": 4,
        "reps": "1",
        "charge": "Même barre",
        "repos": "2'30",
        "notes": "Poussée explosive portée par les jambes. Fin du complexe : reposer la barre, repos complet 2'30."
      }
    ]
  },
  {
    "id": "hb_halte_epaule",
    "nom": "Haltéro — Épaulé (famille clean)",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Spécialisation sur l'épaulé : Power Clean du sol et de la suspension, tirage et front squat de réception. Un seul mouvement olympique travaillé.",
    "protocole": "Durée ~50 min. À faire frais (début de séance), séries courtes, repos complets : on arrête dès que la technique ou la vitesse de barre se dégrade. Charge 75-85 % du max d'épaulé. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Power Clean (du sol)",
        "series": 6,
        "reps": "2",
        "charge": "75-85 % du max d'épaulé",
        "repos": "2'30",
        "notes": "Départ du sol, extension triple explosive, réception en quart de squat, coudes hauts.",
        "biblio": "Power Clean",
        "blocNom": "Épaulé"
      },
      {
        "nom": "Hang Power Clean",
        "series": 4,
        "reps": "2",
        "charge": "70-75 % du max d'épaulé",
        "repos": "2'",
        "notes": "Départ mi-cuisse, extension rapide.",
        "biblio": "Power Clean"
      },
      {
        "nom": "Tirage épaulé depuis le sol (Clean Pull)",
        "series": 3,
        "reps": "3",
        "charge": "100-105 % du max d'épaulé",
        "repos": "2'",
        "notes": "Tirage lourd, extension complète."
      },
      {
        "nom": "Front Squat",
        "series": 3,
        "reps": "3",
        "charge": "80 % 1RM (RPE 7)",
        "repos": "2'30",
        "notes": "Réception et force de jambes en position d'épaulé.",
        "biblio": "Front Squat"
      }
    ]
  },
  {
    "id": "hb_halte_arrache",
    "nom": "Haltéro — Arraché (famille snatch)",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Spécialisation sur l'arraché : Power Snatch, hang snatch, tirage et squat overhead. Vitesse de bras, mobilité d'épaule et coordination.",
    "protocole": "Durée ~50 min. À faire frais (début de séance), séries courtes, repos complets : on arrête dès que la technique ou la vitesse de barre se dégrade. Mobilité d'épaule et de hanche indispensable : si le joueur ne tient pas la barre bras tendus au-dessus de la tête, travailler le squat overhead avant de monter les charges. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Power Snatch (du sol)",
        "series": 6,
        "reps": "2",
        "charge": "70-80 % du max d'arraché",
        "repos": "2'30",
        "notes": "Prise large, extension explosive, barre bras tendus au-dessus de la tête.",
        "blocNom": "Arraché"
      },
      {
        "nom": "Hang Power Snatch",
        "series": 4,
        "reps": "2",
        "charge": "65-70 % du max d'arraché",
        "repos": "2'",
        "notes": "Départ mi-cuisse, extension rapide."
      },
      {
        "nom": "Tirage arraché depuis le sol (Snatch Pull)",
        "series": 3,
        "reps": "3",
        "charge": "100-105 % du max d'arraché",
        "repos": "2'",
        "notes": "Tirage lourd en prise arraché, extension complète."
      },
      {
        "nom": "Squat overhead",
        "series": 3,
        "reps": "3",
        "charge": "Charge modérée (RPE 7)",
        "repos": "2'",
        "notes": "Barre au-dessus de la tête, bras tendus, tronc vertical.",
        "biblio": "Squat overhead"
      }
    ]
  },
  {
    "id": "hb_halte_jete",
    "nom": "Haltéro — Jeté & Push Press (famille jerk)",
    "categorie": "Handball — Haltérophilie",
    "couleur": "#F5C518",
    "equipement": "salle",
    "description": "Spécialisation sur la poussée olympique : Push Press, Push Jerk et Split Jerk, portés par l'impulsion des jambes.",
    "protocole": "Durée ~45 min. À faire frais (début de séance), séries courtes, repos complets : on arrête dès que la technique ou la vitesse de barre se dégrade. Gainage serré, verrouillage complet des bras. Charge 75-85 % du max de jeté. 1 fois par semaine.",
    "isTemplate": true,
    "rpeCible": 7,
    "cycles": [],
    "exercicesRef": [
      {
        "nom": "Push Press",
        "series": 5,
        "reps": "3",
        "charge": "80 % du max de développé militaire",
        "repos": "2'30",
        "notes": "Flexion rapide des jambes, extension explosive, verrouillage complet.",
        "blocNom": "Jeté"
      },
      {
        "nom": "Push Jerk",
        "series": 5,
        "reps": "2",
        "charge": "75-85 % du max de jeté",
        "repos": "2'30",
        "notes": "Dip rapide, extension, réception genoux fléchis, bras verrouillés."
      },
      {
        "nom": "Split Jerk",
        "series": 4,
        "reps": "2",
        "charge": "70-75 % du max de jeté",
        "repos": "2'30",
        "notes": "Réception en fente, bras verrouillés, pieds stables."
      }
    ]
  }
];
