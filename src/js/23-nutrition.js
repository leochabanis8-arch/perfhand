

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
