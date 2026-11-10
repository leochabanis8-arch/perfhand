
// ── RESSOURCES GLOBALES ───────────────────────────────────────────────────────
function RessourcesView({ db, setDb }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newRessource, setNewRessource] = useState({ titre:'', description:'', url:'', categorie:'Guide' });

  const RESSOURCES_BASE = [
    { id:'r1', titre:'Guide Complet — Prévention & Blessures Handball', description:'Analyse biomécanique, épidémiologie et protocoles de prévention. Épaule, genou, poignet, doigt.', url:'https://drive.google.com/file/d/1eSAX84tDahnPkw3dW24Jw_JBMKSexC8h/preview', categorie:'Guide', icon:'📖', color:'#FF7A00' },
    { id:'r2', titre:'Protocoles Prévention Blessures', description:'Cheville, genou, épaule — 5 exercices × 2 versions (avec/sans matériel). 6 semaines de progression.', url:'https://drive.google.com/file/d/1O-Pz1A3ywTfsCs-tJjLlaQrFZTGasz2m/preview', categorie:'Protocole', icon:'📋', color:'#4CAF50' },
    { id:'r3', titre:'Protocole Épaule — Handball Élite', description:'12 semaines semi-pro/élite. 3 blocs : stabilisation, force, puissance. Ratio RE/RI ≥ 0,75.', url:'https://drive.google.com/file/d/1ACK2PDO1cDREAte7mLgl93Pk0786xjYB/preview', categorie:'Protocole', icon:'🦾', color:'#FF4455' },
    { id:'r4', titre:'Guide Mobilité Active au Handball', description:'Amplitude de force, prévention blessures & performance spécifique. 3 zones critiques : épaule, hanche, cheville/genou. Protocoles validés (Asker 2018, Tak 2017, Dill 2014) + programme hebdomadaire + tests.', url:'https://drive.google.com/file/d/181OIWKQk1kSAysPur8_hEt_JurquDIVG/preview', categorie:'Guide', icon:'🤸', color:'#38BDF8' },
  ];

  const customRessources = db.ressourcesCustom || [];
  const allRessources = [...RESSOURCES_BASE, ...customRessources];

  const CATEGORIES = ['Tous', 'Guide', 'Protocole', 'Article', 'Vidéo', 'Autre'];
  const CAT_COLORS = { 'Guide':'#FFA420', 'Protocole':'#4CAF50', 'Article':'#38BDF8', 'Vidéo':'#7C6FFF', 'Autre':'rgba(255,255,255,.4)' };
  const [filtrecat, setFiltrecat] = useState('Tous');

  const filtered = allRessources.filter(r => filtrecat === 'Tous' || r.categorie === filtrecat);

  function saveRessource() {
    if (!newRessource.titre) return;
    setDb(d => ({ ...d, ressourcesCustom: [...(d.ressourcesCustom||[]), { ...newRessource, id:'rc'+Date.now() }] }));
    setShowAdd(false);
    setNewRessource({ titre:'', description:'', url:'', categorie:'Guide' });
  }

  function deleteRessource(id) {
    if (confirm('Supprimer ?'))
      setDb(d => ({ ...d, ressourcesCustom: (d.ressourcesCustom||[]).filter(r => r.id !== id) }));
  }

  return _h`<div style=${{ padding:'16px 0' }}>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <div>
        <div style=${{ fontSize:18, fontWeight:800 }}>📂 Ressources</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${allRessources.length} ressources disponibles</div>
      </div>
      <button class="btn btn-primary btn-sm" onClick=${() => setShowAdd(true)}>+ Ajouter</button>
    </div>

    <!-- Filtre catégorie -->
    <div style=${{ display:'flex', gap:6, marginBottom:14, overflowX:'auto', paddingBottom:4 }}>
      ${CATEGORIES.map(c => _h`<button key=${c} onClick=${() => setFiltrecat(c)}
        style=${{ flexShrink:0, padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:filtrecat===c?800:400,
          border:'1px solid '+(filtrecat===c?(CAT_COLORS[c]||'#FFA420'):'rgba(255,255,255,.1)'),
          background:filtrecat===c?(CAT_COLORS[c]||'#FFA420')+'15':'rgba(255,255,255,.04)',
          color:filtrecat===c?(CAT_COLORS[c]||'#FFA420'):'rgba(255,255,255,.4)', whiteSpace:'nowrap' }}>${c}</button>`)}
    </div>

    <!-- Liste ressources -->
    <div style=${{ display:'flex', flexDirection:'column', gap:10 }}>
      ${filtered.map(r => _h`<div key=${r.id} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'14px 16px' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
          <div style=${{ flex:1 }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
              <span style=${{ fontSize:20 }}>${r.icon||'📄'}</span>
              <span style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:(CAT_COLORS[r.categorie]||'#FFA420')+'15',
                color:CAT_COLORS[r.categorie]||'#FFA420', fontWeight:700 }}>${r.categorie}</span>
            </div>
            <div style=${{ fontSize:13, fontWeight:800, marginBottom:5, lineHeight:1.4 }}>${r.titre}</div>
            <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>${r.description}</div>
            ${r.url ? _h`<div style=${{ marginTop:10 }}>
              <div style=${{ display:'flex', gap:8, marginBottom:8 }}>
                <button onClick=${() => { const el = document.getElementById('pdf-'+r.id); el.style.display = el.style.display === 'none' ? 'block' : 'none'; }}
                  style=${{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,164,32,.3)', background:'rgba(255,164,32,.12)', color:'#FFA420', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                  📄 Voir le PDF
                </button>
                <a href=${r.url} target="_blank"
                  style=${{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:12, textDecoration:'none', display:'inline-block' }}>
                  ↗ Ouvrir
                </a>
              </div>
              <div id=${'pdf-'+r.id} style=${{ display:'none', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,.1)' }}>
                <iframe src=${r.url} style=${{ width:'100%', height:500, border:'none' }} allow="autoplay"></iframe>
              </div>
            </div>` : _h`<div style=${{ marginTop:8, fontSize:11, color:'rgba(255,255,255,.25)', fontStyle:'italic' }}>URL non configurée — ajoute le lien PDF</div>`}
          </div>
          ${r.id && r.id.startsWith('rc') ? _h`<button class="btn btn-sm btn-danger" style=${{ flexShrink:0 }} onClick=${() => deleteRessource(r.id)}>×</button>` : null}
        </div>
      </div>`)}
    </div>

    <!-- Modal ajout -->
    ${showAdd && _h`<div class="edit-modal-bg" onClick=${() => setShowAdd(false)}>
      <div class="edit-modal" style=${{ maxWidth:440 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between' }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>+ Nouvelle ressource</div>
          <button onClick=${() => setShowAdd(false)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style=${{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          <div><div class="lbl">Titre *</div>
            <input class="inp" value=${newRessource.titre} onInput=${e => setNewRessource(r=>({...r,titre:e.target.value}))} placeholder="Ex: Guide échauffement handball"/>
          </div>
          <div><div class="lbl">Description</div>
            <textarea class="inp" value=${newRessource.description} onInput=${e => setNewRessource(r=>({...r,description:e.target.value}))} style=${{ minHeight:60, resize:'vertical' }} placeholder="Contenu, objectif du document..."></textarea>
          </div>
          <div><div class="lbl">Catégorie</div>
            <select class="inp" value=${newRessource.categorie} onChange=${e => setNewRessource(r=>({...r,categorie:e.target.value}))}>
              ${['Guide','Protocole','Article','Vidéo','Autre'].map(c => _h`<option key=${c}>${c}</option>`)}
            </select>
          </div>
          <div><div class="lbl">URL du document (PDF, lien, vidéo...)</div>
            <input class="inp" value=${newRessource.url} onInput=${e => setNewRessource(r=>({...r,url:e.target.value}))} placeholder="https://..."/>
          </div>
        </div>
        <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${() => setShowAdd(false)}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} onClick=${saveRessource}>Enregistrer</button>
        </div>
      </div>
    </div>`}
  </div>`;
}

// ── PRÉPARATION MENTALE ──────────────────────────────────────────────────────
// Boîte à outils mentale : quelques techniques simples et concrètes, classées par
// grand principe de la préparation mentale (gestion du stress, de l'échec, confiance
// en soi), utilisable par le staff comme support d'échange avec le joueur.
const MENTAL_TOOLBOX = [
  { id:'stress', titre:'Gestion du stress', icon:'🧘', color:'#38BDF8',
    intro:'Objectif : arriver à un niveau d\'activation optimal — ni trop relâché, ni sous tension — avant un effort ou un moment clé.',
    outils: [
      { nom:'Respiration 4-6', desc:'Inspirer sur 4 temps, expirer sur 6 temps, 5 cycles. L\'expiration longue active le système parasympathique et calme rapidement.' },
      { nom:'Routine pré-match fixe', desc:'Toujours le même enchaînement de gestes avant de jouer (échauffement, musique, ordre des actions). La répétition rassure et réduit l\'incertitude.' },
      { nom:'Ancrage', desc:'Associer un geste simple (serrer le poing, toucher un bracelet) à un état de calme entraîné à l\'entraînement, pour le réactiver en match.' },
    ] },
  { id:'echec', titre:'Gestion de l\'échec', icon:'🔄', color:'#FF7A00',
    intro:'Objectif : encaisser une erreur ou une contre-performance sans qu\'elle s\'installe et pollue la suite du match.',
    outils: [
      { nom:'Règle des 10 secondes', desc:'S\'autoriser 10 secondes pour ressentir la frustration, puis un geste de reset (respiration, tape dans les mains) et retour immédiat au jeu.' },
      { nom:'Reformulation', desc:'Remplacer "j\'ai raté" par "je corrige au prochain essai" — le discours interne oriente l\'état mental qui suit.' },
      { nom:'Debrief factuel', desc:'Après coup, noter ce qui s\'est passé sans jugement, ce qu\'on en retient, ce qu\'on ajuste. Décrire plutôt que ruminer.' },
    ] },
  { id:'confiance', titre:'Confiance en soi', icon:'💪', color:'#4CAF50',
    intro:'Objectif : construire une confiance qui ne dépend pas uniquement du dernier résultat.',
    outils: [
      { nom:'Banque de réussites', desc:'Lister 3 actions réussies récemment (un tir, une défense, un effort tenu) et les relire avant un match ou un moment difficile.' },
      { nom:'Visualisation', desc:'Quelques minutes, yeux fermés, à s\'imaginer réussir une action clé à venir — le cerveau prépare le geste comme s\'il était réel.' },
      { nom:'Auto-discours positif', desc:'Remplacer les phrases négatives ("je vais rater") par des phrases d\'action ("je place mon tir").' },
    ] },
];

function MentalToolbox() {
  const [open, setOpen] = useState(null);
  return _h`<div style=${{ marginBottom:16 }}>
    <div style=${{ fontSize:12, fontWeight:700, marginBottom:4, color:'rgba(255,255,255,.7)' }}>🧠 Boîte à outils mentale</div>
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:10, lineHeight:1.6 }}>Quelques principes simples de préparation mentale, à travailler avec le joueur au fil de la saison — pas besoin de tout traiter d'un coup.</div>
    <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
      ${MENTAL_TOOLBOX.map(cat => {
        const isOpen = open === cat.id;
        return _h`<div key=${cat.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+cat.color+'30', borderRadius:12, overflow:'hidden' }}>
          <div onClick=${() => setOpen(isOpen ? null : cat.id)} style=${{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', cursor:'pointer' }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
              <span style=${{ fontSize:16 }}>${cat.icon}</span>
              <span style=${{ fontSize:13, fontWeight:700, color:cat.color }}>${cat.titre}</span>
            </div>
            <span style=${{ fontSize:11, color:'rgba(255,255,255,.3)' }}>${isOpen ? '▲' : '▼'}</span>
          </div>
          ${isOpen ? _h`<div style=${{ padding:'0 14px 14px' }}>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:10, lineHeight:1.6, fontStyle:'italic' }}>${cat.intro}</div>
            <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
              ${cat.outils.map(o => _h`<div key=${o.nom} style=${{ background:'rgba(255,255,255,.03)', borderRadius:9, padding:'9px 11px' }}>
                <div style=${{ fontSize:12, fontWeight:700, marginBottom:3 }}>${o.nom}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>${o.desc}</div>
              </div>`)}
            </div>
          </div>` : null}
        </div>`;
      })}
    </div>
  </div>`;
}

// Onglet Mental partagé : ressenti du joueur (4 émotions, éditable) + boîte à outils +
// notes. Utilisé par les différentes vues joueur (effectif club, suivi perso) pour éviter
// de dupliquer le contenu pédagogique à plusieurs endroits.
function MentalPrepView({ player, savePlayer }) {
  return _h`<div>
    <div class="grid-2" style=${{ marginBottom:16 }}>
      ${[['Stress','stress',player.stress||2,player.stress>=3?'#FF4455':player.stress>=2?'#FFA420':'#4CAF50'],
         ['Motivation','motivation',player.motivation||2,player.motivation<=1?'#FF4455':player.motivation>=3?'#4CAF50':'#FFA420'],
         ['Focus','focus',player.focus||2,player.focus<=1?'#FF4455':player.focus>=3?'#4CAF50':'#FFA420'],
         ['Confiance','confiance',player.confiance||2,player.confiance<=1?'#FF4455':player.confiance>=3?'#4CAF50':'#FFA420']].map(([l,k,v,c]) =>
        _h`<div key=${l} class="card">
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginBottom:4 }}>${l}</div>
          <div style=${{ fontSize:28, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}<span style=${{ fontSize:11, opacity:.4 }}>/3</span></div>
          <div class="progress-bar" style=${{ marginTop:6 }}><div class="pf" style=${{ width:(v/3*100)+'%', background:c }}></div></div>
          <div style=${{ display:'flex', gap:6, marginTop:8 }}>
            ${[[1,'😟'],[2,'😐'],[3,'😊']].map(([n,emoji]) => _h`<button key=${n}
              onClick=${() => savePlayer({ [k]: n })}
              style=${{ flex:1, height:32, borderRadius:8, border: n===v?'2px solid '+c:'1px solid rgba(255,255,255,.08)', cursor:'pointer',
                background: n===v ? c+'22' : 'rgba(255,255,255,.04)',
                color: n===v ? c : 'rgba(255,255,255,.4)', fontSize:16 }}
            >${emoji}</button>`)}
          </div>
        </div>`
      )}
    </div>

    <${MentalToolbox} />

    <!-- Notes mentales -->
    <div style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'14px 16px' }}>
      <div style=${{ fontSize:12, fontWeight:700, marginBottom:8, color:'rgba(255,255,255,.7)' }}>📝 Notes & observations</div>
      <textarea
        value=${player.notesMental || ''}
        onInput=${e => savePlayer({ notesMental: e.target.value })}
        placeholder="Observations mentales, contexte, points de travail, objectifs psychologiques..."
        style=${{ width:'100%', minHeight:100, resize:'vertical', background:'rgba(255,255,255,.04)',
          border:'1px solid rgba(255,255,255,.08)', borderRadius:9, padding:'10px 12px',
          color:'#fff', fontSize:12, lineHeight:1.6, fontFamily:'Inter,sans-serif',
          outline:'none', boxSizing:'border-box' }}
      ></textarea>
      <div style=${{ fontSize:9, color:'rgba(255,255,255,.25)', marginTop:6, textAlign:'right' }}>
        Sauvegarde automatique à chaque modification
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// RAPPORT D'ENTRAÎNEMENT (PDF + Excel) — synthèse complète d'un joueur sur une période :
// musculation (séances, tonnage, progression par exercice, 1RM), endurance, charge (UA, ACWR),
// tests, composition corporelle, bien-être, blessures. Tout est calculé à partir des données
// déjà saisies dans l'app (aucune saisie supplémentaire).
// ═══════════════════════════════════════════════════════════════════════════════════════════
function rpArr(x) { return Array.isArray(x) ? x : (x && typeof x === 'object' ? Object.values(x) : []); }
function rpNum(v) { if (v == null || v === '') return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; }
function rpD(d) { return String(d || '').slice(0, 10); }
function rpFr(d) { d = rpD(d); return d.length === 10 ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(2, 4) : ''; }
function rpAddDays(dStr, n) { const d = new Date(dStr + 'T12:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function rpMonday(dStr) { const d = new Date(rpD(dStr) + 'T12:00:00'); return rpAddDays(rpD(dStr), -((d.getDay() + 6) % 7)); }
function rpDiffDays(a, b) { return Math.round((new Date(rpD(b) + 'T12:00:00') - new Date(rpD(a) + 'T12:00:00')) / 86400000); }
function rpAvg(a) { a = a.filter(v => v != null && !isNaN(v)); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; }
function rpR(v, n) { if (v == null) return null; const f = Math.pow(10, n == null ? 1 : n); return Math.round(v * f) / f; }
function rpRepsNum(r) {
  const t = String(r == null ? '' : r).toLowerCase();
  if (!t || /\d\s*(s|sec|secondes?|min)\b|amrap|max|[ée]chec/.test(t)) return null;
  const m = t.match(/(\d+)(?:\s*[-–/]\s*(\d+))?/);
  if (!m) return null;
  return m[2] ? (parseInt(m[1]) + parseInt(m[2])) / 2 : parseInt(m[1]);
}
// 1RM (ou poids de corps) du joueur À UNE DATE DONNÉE (dernière valeur connue avant, sinon la première)
function rpRefAt(player, mvtId, date) {
  if (mvtId === 'poids_corps') {
    const ms = rpArr(player.masseMesures).filter(m => rpNum(m.poids) > 0).sort((a, b) => rpD(a.date).localeCompare(rpD(b.date)));
    if (!ms.length) return rpNum(player.poids);
    const before = ms.filter(m => rpD(m.date) <= date);
    return rpNum((before.length ? before[before.length - 1] : ms[0]).poids);
  }
  const h = rpArr(player.rmHistory && player.rmHistory[mvtId]).filter(e => rpNum(e.rm) > 0).sort((a, b) => rpD(a.date).localeCompare(rpD(b.date)));
  if (!h.length) return null;
  const before = h.filter(e => rpD(e.date) <= date);
  return rpNum((before.length ? before[before.length - 1] : h[0]).rm);
}
function rpMvtLabel(player, id) {
  if (id === 'poids_corps') return 'Poids du corps';
  const m = (typeof MOUVEMENTS_RM !== 'undefined' ? MOUVEMENTS_RM : []).find(x => x.id === id) || rpArr(player.customRM).find(x => x.id === id);
  return m && m.label ? m.label : null;
}
// Charges PRESCRITES d'un exercice à la date de la séance (kg calculés avec le 1RM de l'époque)
function rpExoSets(ex, player, date) {
  const pc = parsePctPC(ex.charge);
  const mvt = pc != null ? 'poids_corps' : detectMouvementRM(ex.nom, player);
  const kgOf = (pct, txt) => {
    let p = pct;
    if (p == null) { const mm = String(txt || '').match(/\((\d+(?:[.,]\d+)?)\s*%/); if (mm) p = parseFloat(mm[1].replace(',', '.')); }
    if (p != null && mvt) { const r = rpRefAt(player, mvt, date); if (r) return Math.round(r * p / 100 / 2.5) * 2.5; }
    const k = String(txt || '').match(/(\d+(?:[.,]\d+)?)\s*kg/i);
    return k ? parseFloat(k[1].replace(',', '.')) : null;
  };
  const details = rpArr(ex.chargeDetails);
  const pctGlobal = pc != null ? pc : resolvePctRM(ex);
  const sets = [];
  if (details.length) {
    details.forEach(d => sets.push({ pct: pc != null ? pc : (d.pct != null ? d.pct : null), kg: kgOf(pc != null ? pc : d.pct, d.charge || ex.charge), reps: rpRepsNum(d.reps != null && d.reps !== '' ? d.reps : ex.reps) }));
  } else {
    const n = Math.max(1, parseInt(ex.series) || 1);
    const kg = kgOf(pctGlobal, ex.charge);
    for (let i = 0; i < n; i++) sets.push({ pct: pctGlobal, kg, reps: rpRepsNum(ex.reps) });
  }
  return { mvt, sets };
}
function rpNormNom(n) { return String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }

function buildRapportJoueur(player, from, to) {
  const today = localDateStr();
  const inP = d => { d = rpD(d); return d && d >= from && d <= to; };
  const refDate = s => rpD(s.dateFaite || s.datePrevu);
  const r = { player, from, to, generated: today };

  // ── Musculation ──────────────────────────────────────────────────────────────────────
  const muscuAll = rpArr(player.muscuSeances);
  const muscu = muscuAll.filter(s => inP(refDate(s))).sort((a, b) => refDate(a).localeCompare(refDate(b)));
  const exoMap = {};        // nom normalisé → { nom, lignes:[{date,kg,series,reps,tonnage,pct}] }
  r.muscuRows = muscu.map(s => {
    const exs = rpArr(s.exercices);
    const date = refDate(s);
    const fait = !!s.dateFaite;
    let series = 0, tonnage = 0;
    exs.forEach(ex => {
      const { sets } = rpExoSets(ex, player, date);
      const kgs = sets.map(x => x.kg).filter(v => v != null);
      const ton = sets.reduce((a, x) => a + ((x.kg != null && x.reps != null) ? x.kg * x.reps : 0), 0);
      series += sets.length; tonnage += ton;
      if (fait && ex.nom && sets.length) {
        const k = rpNormNom(ex.nom);
        (exoMap[k] = exoMap[k] || { nom: ex.nom, lignes: [] }).lignes.push({
          date, seance: s.nom || '', series: sets.length, reps: ex.reps != null ? String(ex.reps) : '',
          kgMax: kgs.length ? Math.max.apply(null, kgs) : null, kgMoy: rpR(rpAvg(kgs), 1),
          pct: (sets.find(x => x.pct != null) || {}).pct != null ? sets.find(x => x.pct != null).pct : null,
          tonnage: ton, repsTot: sets.reduce((a, x) => a + (x.reps || 0), 0),
        });
      }
    });
    const duree = Math.max(30, Math.min(100, exs.length * 9));
    return {
      datePrevu: rpD(s.datePrevu), dateFaite: rpD(s.dateFaite), nom: s.nom || '', methode: s.methode || '', contexte: s.contexte || '',
      nbExos: exs.length, series, tonnage: Math.round(tonnage), fait,
      statut: fait ? 'Faite' : (rpD(s.datePrevu) && rpD(s.datePrevu) < today ? 'Non faite' : 'À venir'),
      rpeCible: rpNum(s.rpeCible), rpeReel: rpNum(s.rpeReel), fatigue: rpNum(s.fatigue), energie: rpNum(s.energie), sommeil: rpNum(s.sommeil),
      douleurs: rpNum(s.douleurs), duree, charge: (fait && rpNum(s.rpeReel) != null) ? Math.round(duree * rpNum(s.rpeReel)) : null,
      notesJoueur: s.notesJoueur || '',
    };
  });
  r.exos = Object.values(exoMap).map(e => {
    const l = e.lignes.sort((a, b) => a.date.localeCompare(b.date));
    const withKg = l.filter(x => x.kgMax != null);
    const first = withKg[0], last = withKg[withKg.length - 1];
    return {
      nom: e.nom, apparitions: l.length, lignes: l,
      kgDebut: first ? first.kgMax : null, kgFin: last ? last.kgMax : null,
      deltaKg: first && last ? rpR(last.kgMax - first.kgMax, 1) : null,
      deltaPct: first && last && first.kgMax ? rpR((last.kgMax - first.kgMax) / first.kgMax * 100, 1) : null,
      kgPic: withKg.length ? Math.max.apply(null, withKg.map(x => x.kgMax)) : null,
      tonnage: Math.round(l.reduce((a, x) => a + x.tonnage, 0)), seriesTot: l.reduce((a, x) => a + x.series, 0), repsTot: l.reduce((a, x) => a + x.repsTot, 0),
    };
  }).sort((a, b) => b.apparitions - a.apparitions || (b.tonnage - a.tonnage));

  // ── 1RM ──────────────────────────────────────────────────────────────────────────────
  const rmKeys = Object.keys(player.rmHistory || {});
  const pcNow = rpRefAt(player, 'poids_corps', to);
  r.rm = rmKeys.map(id => {
    const h = rpArr(player.rmHistory[id]).filter(e => rpNum(e.rm) > 0).sort((a, b) => rpD(a.date).localeCompare(rpD(b.date)));
    if (!h.length) return null;
    const dansP = h.filter(e => inP(e.date));
    const avant = h.filter(e => rpD(e.date) < from);
    const debut = avant.length ? avant[avant.length - 1] : (dansP[0] || h[0]);
    const fin = dansP.length ? dansP[dansP.length - 1] : (avant.length ? avant[avant.length - 1] : h[h.length - 1]);
    const d = rpR(rpNum(fin.rm) - rpNum(debut.rm), 1);
    return {
      id, label: rpMvtLabel(player, id) || 'Mouvement personnalisé (supprimé)', orphelin: rpMvtLabel(player, id) == null, historique: h.map(e => ({ date: rpD(e.date), rm: rpNum(e.rm) })),
      debut: rpNum(debut.rm), debutDate: rpD(debut.date), fin: rpNum(fin.rm), finDate: rpD(fin.date),
      delta: d, deltaPct: rpNum(debut.rm) ? rpR(d / rpNum(debut.rm) * 100, 1) : null,
      ratioPC: pcNow ? rpR(rpNum(fin.rm) / pcNow, 2) : null, record: Math.max.apply(null, h.map(e => rpNum(e.rm))),
    };
  }).filter(Boolean);

  // ── Endurance ────────────────────────────────────────────────────────────────────────
  const endu = rpArr(player.enduranceSeances).filter(s => inP(refDate(s))).sort((a, b) => refDate(a).localeCompare(refDate(b)));
  const vmaPlayer = typeof getPlayerVMA === 'function' ? getPlayerVMA(player) : null;
  r.vma = vmaPlayer;
  r.enduRows = endu.map(s => {
    const tc = (typeof TYPES_CARDIO !== 'undefined' ? TYPES_CARDIO : []).find(t => t.id === s.type);
    const fait = !!s.dateFaite;
    const bl = typeof blocsEndu === 'function' ? blocsEndu(s) : [];
    let volM = null;
    if (bl.length) {
      volM = bl.reduce((a, b) => a + (b.dist ? b.reps * b.dist : ((b.sec && vmaPlayer) ? b.reps * (vmaPlayer * ((b.pct[0] + b.pct[1]) / 2) / 100) * 1000 / 3600 * b.sec : 0)), 0);
    }
    const duree = rpNum(s.duree) || 45;
    return {
      datePrevu: rpD(s.datePrevu), dateFaite: rpD(s.dateFaite), nom: s.nom || (tc ? tc.label : ''), type: tc ? tc.label : '',
      structure: s.distance || (s.duree ? s.duree + ' min' : ''), recup: s.recup || '', intensite: s.intensite || '',
      volumeM: volM ? Math.round(volM) : null, duree, fait,
      statut: fait ? 'Faite' : (rpD(s.datePrevu) && rpD(s.datePrevu) < today ? 'Non faite' : 'À venir'),
      rpeCible: rpNum(s.rpeCible), rpeReel: rpNum(s.rpeReel), fatigue: rpNum(s.fatigue),
      charge: (fait && rpNum(s.rpeReel) != null) ? Math.round(duree * rpNum(s.rpeReel)) : null,
    };
  });

  // ── Charge (UA = durée × RPE) — même convention que « Charge équipe » ───────────────────
  const terrain = rpArr(player.bilans).filter(b => b.type === 'Terrain' && inP(b.date));
  const events = [];
  r.muscuRows.filter(x => x.fait && x.charge != null).forEach(x => events.push({ date: x.dateFaite, type: 'Muscu', ua: x.charge, rpe: x.rpeReel }));
  r.enduRows.filter(x => x.fait && x.charge != null).forEach(x => events.push({ date: x.dateFaite, type: 'Endurance', ua: x.charge, rpe: x.rpeReel }));
  terrain.forEach(b => events.push({ date: rpD(b.date), type: 'Terrain', ua: rpNum(b.chargeSession) || 0, rpe: rpNum(b.rpe) }));
  r.terrainRows = terrain.map(b => ({ date: rpD(b.date), type: b.typeSeance || 'Terrain', duree: rpNum(b.duree), rpe: rpNum(b.rpe), charge: rpNum(b.chargeSession), fatigue: rpNum(b.fatigue), notes: b.notes || '' }));
  const wkStart = rpMonday(from), wkEnd = rpMonday(to);
  r.semaines = [];
  for (let w = wkStart; w <= wkEnd; w = rpAddDays(w, 7)) {
    const we = rpAddDays(w, 6);
    const evs = events.filter(e => e.date >= w && e.date <= we);
    const mp = muscu.filter(s => rpD(s.datePrevu) >= w && rpD(s.datePrevu) <= we);
    const ep = endu.filter(s => rpD(s.datePrevu) >= w && rpD(s.datePrevu) <= we);
    const mDone = r.muscuRows.filter(x => x.fait && x.dateFaite >= w && x.dateFaite <= we);
    const eDone = r.enduRows.filter(x => x.fait && x.dateFaite >= w && x.dateFaite <= we);
    r.semaines.push({
      debut: w, fin: we, label: rpFr(w).slice(0, 5),
      muscuPrevues: mp.length, muscuFaites: mDone.length, enduPrevues: ep.length, enduFaites: eDone.length,
      uaMuscu: evs.filter(e => e.type === 'Muscu').reduce((a, e) => a + e.ua, 0),
      uaEndu: evs.filter(e => e.type === 'Endurance').reduce((a, e) => a + e.ua, 0),
      uaTerrain: evs.filter(e => e.type === 'Terrain').reduce((a, e) => a + e.ua, 0),
      ua: evs.reduce((a, e) => a + e.ua, 0), rpe: rpR(rpAvg(evs.map(e => e.rpe)), 1),
      tonnage: mDone.reduce((a, x) => a + x.tonnage, 0), volumeM: eDone.reduce((a, x) => a + (x.volumeM || 0), 0),
    });
  }
  // ACWR glissant (charge de la semaine / moyenne des 4 semaines précédentes)
  r.semaines.forEach((s, i) => {
    const prev = r.semaines.slice(Math.max(0, i - 4), i).map(x => x.ua);
    s.acwr = prev.length >= 3 && rpAvg(prev) > 0 ? rpR(s.ua / rpAvg(prev), 2) : null;
  });
  // ACWR « actuel » : 7 derniers jours / (28 jours / 4), comme dans Charge équipe
  const toEff = to < today ? to : today;
  const acute = events.filter(e => rpDiffDays(e.date, toEff) >= 0 && rpDiffDays(e.date, toEff) < 7).reduce((a, e) => a + e.ua, 0);
  const chronic = events.filter(e => rpDiffDays(e.date, toEff) >= 0 && rpDiffDays(e.date, toEff) < 28).reduce((a, e) => a + e.ua, 0) / 4;
  r.acwr = (chronic > 0 && acute > 0) ? rpR(acute / chronic, 2) : null;
  r.chargeAigue = acute; r.chargeChronique = Math.round(chronic);

  // ── Tests ────────────────────────────────────────────────────────────────────────────
  const TEST_DEFS = [['sprint10', 'Sprint 10 m (s)', true], ['sprint20', 'Sprint 20 m (s)', true], ['sprint30', 'Sprint 30 m (s)', true], ['detente', 'Détente CMJ (cm)', false],
    ['vma', 'VMA (km/h)', false], ['yoyo', 'Yo-Yo (niv.)', false], ['squat1RM', 'Squat 1RM (kg)', false], ['bench1RM', 'Bench 1RM (kg)', false],
    ['souleveTerre', 'Soulevé de terre (kg)', false], ['lancerMedecine', 'Lancer médecine-ball (m)', false], ['agilite505', 'Agilité 5-0-5 (s)', true]];
  const tests = rpArr(player.tests).filter(t => inP(t.date) || true).sort((a, b) => rpD(a.date).localeCompare(rpD(b.date)));
  r.testsRows = tests.map(t => { const o = { date: rpD(t.date), contexte: t.contexte || '', notes: t.notes || '' }; TEST_DEFS.forEach(([k]) => { o[k] = rpNum(t[k]); }); return o; })
    .filter(o => TEST_DEFS.some(([k]) => o[k] != null));
  r.testsDefs = TEST_DEFS.filter(([k]) => r.testsRows.some(o => o[k] != null));
  r.testsEvol = r.testsDefs.map(([k, label, lower]) => {
    const pts = r.testsRows.filter(o => o[k] != null);
    const f = pts[0], l = pts[pts.length - 1];
    const d = rpR(l[k] - f[k], 2);
    return { k, label, lower, premier: f[k], premierDate: f.date, dernier: l[k], dernierDate: l.date, delta: d, mieux: pts.length > 1 ? (lower ? d < 0 : d > 0) : null, n: pts.length };
  });

  // ── Composition corporelle ───────────────────────────────────────────────────────────
  r.mesures = rpArr(player.masseMesures).filter(m => m && m.date).sort((a, b) => rpD(a.date).localeCompare(rpD(b.date)))
    .map(m => ({ date: rpD(m.date), poids: rpNum(m.poids), masseGrasse: rpNum(m.masseGrasse), masseMusc: rpNum(m.masseMusc), hanches: rpNum(m.tour_hanches), epaule: rpNum(m.tour_epaule), cuisse: rpNum(m.tour_cuisse) }));

  // ── Bien-être (check-ins quotidiens) ─────────────────────────────────────────────────
  const wcObj = player.wellnessCheckins && !Array.isArray(player.wellnessCheckins) ? player.wellnessCheckins : null;
  const wcList = wcObj ? Object.keys(wcObj).map(d => ({ date: d, ...wcObj[d] })) : rpArr(player.wellnessCheckins);
  r.wellness = wcList.filter(w => w && inP(w.date)).sort((a, b) => rpD(a.date).localeCompare(rpD(b.date)))
    .map(w => ({ date: rpD(w.date), energie: rpNum(w.energie), sommeil: rpNum(w.sommeil), humeur: rpNum(w.humeur), stress: rpNum(w.stress), douleurs: rpNum(w.douleurs) }));
  r.wellnessSem = r.semaines.map(s => {
    const ws = r.wellness.filter(w => w.date >= s.debut && w.date <= s.fin);
    return { label: s.label, debut: s.debut, n: ws.length, energie: rpR(rpAvg(ws.map(w => w.energie)), 1), sommeil: rpR(rpAvg(ws.map(w => w.sommeil)), 1), humeur: rpR(rpAvg(ws.map(w => w.humeur)), 1), stress: rpR(rpAvg(ws.map(w => w.stress)), 1), douleurs: rpR(rpAvg(ws.map(w => w.douleurs)), 1) };
  });

  // ── Blessures ────────────────────────────────────────────────────────────────────────
  r.blessures = rpArr(player.blessures).map(b => ({ zone: b.zone || '', type: b.type || '', debut: rpD(b.dateDebut), statut: b.statut || '', protocole: b.protocole || '' }));

  // ── Cycles / méthodes ────────────────────────────────────────────────────────────────
  const cyc = {};
  r.muscuRows.forEach(x => {
    const k = x.methode || x.contexte || 'Sans méthode';
    const c = cyc[k] = cyc[k] || { nom: k, prevues: 0, faites: 0, debut: x.datePrevu || x.dateFaite, fin: x.datePrevu || x.dateFaite, rpe: [], cible: [], tonnage: 0 };
    c.prevues++; if (x.fait) { c.faites++; c.tonnage += x.tonnage; if (x.rpeReel != null) c.rpe.push(x.rpeReel); }
    if (x.rpeCible != null) c.cible.push(x.rpeCible);
    const d = x.datePrevu || x.dateFaite; if (d && d < c.debut) c.debut = d; if (d && d > c.fin) c.fin = d;
  });
  r.cycles = Object.values(cyc).map(c => ({ nom: c.nom, debut: c.debut, fin: c.fin, prevues: c.prevues, faites: c.faites, taux: c.prevues ? Math.round(c.faites / c.prevues * 100) : null, rpeReel: rpR(rpAvg(c.rpe), 1), rpeCible: rpR(rpAvg(c.cible), 1), tonnage: c.tonnage })).sort((a, b) => String(a.debut).localeCompare(String(b.debut)));

  // ── Synthèse chiffrée ────────────────────────────────────────────────────────────────
  const mDue = r.muscuRows.filter(x => x.statut !== 'À venir'), eDue = r.enduRows.filter(x => x.statut !== 'À venir');
  const kpi = r.kpi = {
    muscuPrevues: mDue.length, muscuFaites: mDue.filter(x => x.fait).length, enduPrevues: eDue.length, enduFaites: eDue.filter(x => x.fait).length,
    rpeMoy: rpR(rpAvg(events.map(e => e.rpe)), 1), rpeCibleMoy: rpR(rpAvg(r.muscuRows.map(x => x.rpeCible)), 1),
    uaTotal: events.reduce((a, e) => a + e.ua, 0), tonnage: r.muscuRows.filter(x => x.fait).reduce((a, x) => a + x.tonnage, 0),
    seriesTot: r.muscuRows.filter(x => x.fait).reduce((a, x) => a + x.series, 0), volumeEnduM: r.enduRows.filter(x => x.fait).reduce((a, x) => a + (x.volumeM || 0), 0),
  };
  const due = kpi.muscuPrevues + kpi.enduPrevues, did = kpi.muscuFaites + kpi.enduFaites;
  kpi.taux = due ? Math.round(did / due * 100) : null;
  kpi.tauxMuscu = kpi.muscuPrevues ? Math.round(kpi.muscuFaites / kpi.muscuPrevues * 100) : null;
  kpi.tauxEndu = kpi.enduPrevues ? Math.round(kpi.enduFaites / kpi.enduPrevues * 100) : null;
  kpi.sommeilMoy = rpR(rpAvg(r.wellness.map(w => w.sommeil)), 1); kpi.energieMoy = rpR(rpAvg(r.wellness.map(w => w.energie)), 1); kpi.douleursMoy = rpR(rpAvg(r.wellness.map(w => w.douleurs)), 1);

  // ── Lecture rapide (constats automatiques) ───────────────────────────────────────────
  const ins = r.insights = [];
  if (kpi.taux != null) ins.push((kpi.taux >= 85 ? '[+] ' : kpi.taux >= 65 ? '[=] ' : '[!] ') + 'Assiduité : ' + did + ' séance(s) faite(s) sur ' + due + ' prévue(s) (' + kpi.taux + '%)' + (kpi.tauxMuscu != null ? ' — muscu ' + kpi.tauxMuscu + '%' : '') + (kpi.tauxEndu != null ? ', endurance ' + kpi.tauxEndu + '%' : '') + '.');
  r.rm.filter(m => !m.orphelin && m.delta != null && (m.delta !== 0 || m.historique.length > 1)).forEach(m => {
    ins.push((m.delta > 0 ? '[+] ' : m.delta < 0 ? '[!] ' : '[=] ') + m.label + ' : 1RM ' + m.debut + ' > ' + m.fin + ' kg (' + (m.delta > 0 ? '+' : '') + m.delta + ' kg' + (m.deltaPct != null ? ', ' + (m.deltaPct > 0 ? '+' : '') + m.deltaPct + '%' : '') + ')' + (m.ratioPC ? ' — ' + m.ratioPC + ' × poids de corps' : '') + '.');
  });
  const prog = r.exos.filter(e => e.deltaPct != null && e.apparitions >= 2).sort((a, b) => b.deltaPct - a.deltaPct);
  if (prog.length && prog[0].deltaPct > 0) ins.push('[+] Plus forte progression de charge prescrite : ' + prog[0].nom + ' (' + prog[0].kgDebut + ' > ' + prog[0].kgFin + ' kg, +' + prog[0].deltaPct + '%).');
  const stag = r.exos.filter(e => e.apparitions >= 3 && e.deltaKg === 0);
  if (stag.length) ins.push('[=] Charge inchangée sur ' + stag.slice(0, 4).map(e => e.nom).join(', ') + ' (3 séances ou plus) : progression à relancer si l\'objectif est la force.');
  if (kpi.rpeMoy != null) {
    const ecart = kpi.rpeCibleMoy != null ? rpR(kpi.rpeMoy - kpi.rpeCibleMoy, 1) : null;
    ins.push((ecart != null && Math.abs(ecart) > 1.5 ? '[!] ' : '[=] ') + 'RPE moyen ressenti : ' + kpi.rpeMoy + '/10' + (kpi.rpeCibleMoy != null ? ' (cible muscu ' + kpi.rpeCibleMoy + ', écart ' + (ecart > 0 ? '+' : '') + ecart + ')' : '') + '.');
  }
  if (r.acwr == null && r.chargeChronique > 0) ins.push('[=] Aucune charge enregistrée sur les 7 derniers jours (charge chronique : ' + r.chargeChronique + ' UA/semaine).');
  if (r.acwr != null) ins.push((r.acwr > 1.5 ? '[!] ' : r.acwr > 1.3 || r.acwr < 0.8 ? '[=] ' : '[+] ') + 'Charge aiguë/chronique (ACWR) : ' + r.acwr + ' — ' + (r.acwr > 1.5 ? 'zone de risque (montée de charge trop rapide)' : r.acwr > 1.3 ? 'zone de vigilance' : r.acwr < 0.8 ? 'sous-charge relative' : 'zone optimale (0,8 à 1,3)') + '.');
  if (kpi.sommeilMoy != null && kpi.sommeilMoy < 3) ins.push('[!] Sommeil moyen bas (' + kpi.sommeilMoy + '/5) sur la période.');
  if (kpi.douleursMoy != null && kpi.douleursMoy < 3) ins.push('[!] Douleurs / courbatures élevées en moyenne (' + kpi.douleursMoy + '/5, 5 = aucune douleur).');
  const act = r.blessures.filter(b => /cours|surveill/i.test(b.statut));
  if (act.length) ins.push('[!] Blessure(s) / surveillance : ' + act.map(b => b.zone + (b.type ? ' (' + b.type + ')' : '')).join(', ') + '.');
  const te = r.testsEvol.filter(t => t.n > 1 && t.mieux != null);
  te.slice(0, 4).forEach(t => ins.push((t.mieux ? '[+] ' : '[!] ') + 'Test ' + t.label + ' : ' + t.premier + ' > ' + t.dernier + ' (' + (t.delta > 0 ? '+' : '') + t.delta + ').'));
  if (!ins.length) ins.push('[=] Peu de données sur la période : renseigne les séances, RPE et 1RM pour enrichir la synthèse.');
  return r;
}

// ── Périodes prédéfinies ───────────────────────────────────────────────────────────────
function rpPeriodes(player) {
  const today = localDateStr();
  const all = [];
  rpArr(player.muscuSeances).forEach(s => all.push(rpD(s.dateFaite || s.datePrevu)));
  rpArr(player.enduranceSeances).forEach(s => all.push(rpD(s.dateFaite || s.datePrevu)));
  Object.keys(player.rmHistory || {}).forEach(k => rpArr(player.rmHistory[k]).forEach(e => all.push(rpD(e.date))));
  const first = all.filter(Boolean).sort()[0] || rpAddDays(today, -90);
  const last = all.filter(Boolean).sort().slice(-1)[0] || today;
  const to = last > today ? last : today;
  const yr = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  return [
    { id: '4s', label: '4 dernières semaines', from: rpAddDays(today, -27), to: today },
    { id: '8s', label: '8 dernières semaines', from: rpAddDays(today, -55), to: today },
    { id: '12s', label: '12 dernières semaines', from: rpAddDays(today, -83), to: today },
    { id: 'saison', label: 'Saison ' + yr + '-' + (yr + 1), from: yr + '-08-01', to: (to < (yr + 1) + '-07-31' ? to : (yr + 1) + '-07-31') },
    { id: 'tout', label: 'Depuis le début', from: first, to },
  ];
}

// ── PDF ────────────────────────────────────────────────────────────────────────────────
function rpP(s) {
  return String(s == null ? '' : s).replace(/[\u202f\u00a0]/g, ' ').replace(/→/g, '>').replace(/≈/g, '~').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[^\u0000-ÿ–—•…€]/g, '');
}
function rpFmtKg(v) { return v == null ? '-' : String(v).replace('.', ','); }
function exporterRapportJoueurPDF(r) {
  try {
    const J = window.jspdf && window.jspdf.jsPDF;
    if (!J) { alert("La librairie d'export PDF n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
    const doc = new J({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 34;
    const C = { orange: [255, 164, 32], dark: [22, 24, 30], grey: [110, 110, 118], light: [247, 247, 249], line: [226, 226, 230],
      green: [34, 160, 80], amber: [232, 130, 10], red: [214, 48, 64], blue: [14, 150, 220], violet: [118, 100, 245], indigo: [72, 70, 210], teal: [16, 160, 130], pink: [225, 70, 150] };
    const T = (s, x, y, o) => doc.text(rpP(s), x, y, o);
    const fill = c => doc.setFillColor(c[0], c[1], c[2]);
    const txt = c => doc.setTextColor(c[0], c[1], c[2]);
    const draw = c => doc.setDrawColor(c[0], c[1], c[2]);
    const tint = (c, a) => [Math.round(255 - (255 - c[0]) * a), Math.round(255 - (255 - c[1]) * a), Math.round(255 - (255 - c[2]) * a)];
    const fr = v => String(v).replace('.', ',');
    const sg = v => (v > 0 ? '+' : '') + fr(v);
    let y = 0;
    const need = h => { if (y + h > H - 42) { doc.addPage(); y = 40; return true; } return false; };
    const pl = r.player, k = r.kpi;

    // ── Bandeau de section coloré (pour le détail) ────────────────────────────────────
    const banner = (titre, sous, col) => {
      need(96);
      fill(col); doc.roundedRect(M, y, W - 2 * M, 30, 5, 5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(255, 255, 255); T(titre, M + 12, y + 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(255, 255, 255); T(sous || '', M + 12, y + 25);
      y += 48;
    };
    const sub = (titre, col) => { need(60); fill(col); doc.rect(M, y - 9, 3, 12, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); txt(C.dark); T(titre, M + 9, y); y += 12; };
    const note = (t) => { doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); txt(C.grey); const l = doc.splitTextToSize(rpP(t), W - 2 * M); doc.text(l, M, y); y += l.length * 9.5 + 6; };
    const tbl2 = (head, body, col, opts) => {
      need(50);
      const o = opts || {};
      doc.autoTable({
        head: [head], body, startY: y, margin: { left: M, right: M }, theme: 'grid',
        styles: Object.assign({ font: 'helvetica', fontSize: 8, cellPadding: 3.5, halign: 'center', textColor: C.dark, lineColor: C.line, lineWidth: 0.4, overflow: 'linebreak' }, o.styles || {}),
        headStyles: { fillColor: col, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: C.light }, rowPageBreak: 'avoid', columnStyles: o.columnStyles || {},
        didParseCell: d => { d.cell.text = d.cell.text.map(rpP); if (o.cell) o.cell(d); },
      });
      y = doc.lastAutoTable.finalY + 12;
    };
    const colorSigned = (idx) => d => { if (d.section === 'body' && idx.includes(d.column.index)) { const v = String(d.cell.raw); d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = /^\+(?!0([ ,%]|$))/.test(v) ? C.green : /^-/.test(v) ? C.red : C.grey; } };
    const colorStatut = (idx) => d => { if (d.section === 'body' && d.column.index === idx) { const v = d.cell.raw; d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = v === 'Faite' ? C.green : v === 'Non faite' ? C.red : C.grey; } };

    // ── Sparkline (mini courbe) ───────────────────────────────────────────────────────
    const tOf = d => new Date(d + 'T12:00:00').getTime();
    const spark = (x, yy, w, h, pts, col) => {
      if (!pts.length) return;
      const ts = pts.map(p => p.t), vs = pts.map(p => p.v);
      let t0 = Math.min.apply(null, ts), t1 = Math.max.apply(null, ts); if (t1 === t0) { t0 -= 86400000; t1 += 86400000; }
      let v0 = Math.min.apply(null, vs), v1 = Math.max.apply(null, vs); const pad = (v1 - v0) * 0.2 || v1 * 0.05 || 1; v0 -= pad; v1 += pad;
      const P = pts.map(p => [x + (p.t - t0) / (t1 - t0) * w, yy + h - (p.v - v0) / (v1 - v0) * h]);
      draw(col); doc.setLineWidth(1.6);
      for (let i = 1; i < P.length; i++) doc.line(P[i - 1][0], P[i - 1][1], P[i][0], P[i][1]);
      fill(col); P.forEach((p, i) => doc.circle(p[0], p[1], i === P.length - 1 ? 3 : 1.8, 'F'));
      doc.setLineWidth(0.4);
    };

    // ═════════════════════ PAGE 1 : FICHE RÉSUMÉE ═══════════════════════════════════════
    fill([11, 13, 16]); doc.rect(0, 0, W, 86, 'F'); fill(C.orange); doc.rect(0, 86, W, 3, 'F');
    txt(C.orange); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); T('PERFHAND  -  RAPPORT D\'ENTRAINEMENT', M, 24);
    doc.setTextColor(255, 255, 255); doc.setFontSize(24); T(pl.name || 'Joueur', M, 52);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const poidsNow = rpRefAt(pl, 'poids_corps', r.to);
    T([pl.pos || pl.poste, pl.age ? pl.age + ' ans' : null, pl.taille ? pl.taille + ' cm' : null, poidsNow ? poidsNow + ' kg' : null].filter(Boolean).join('  |  '), M, 70);
    doc.setTextColor(200, 200, 205); doc.setFontSize(9); T('Période : ' + rpFr(r.from) + ' au ' + rpFr(r.to), W - M, 40, { align: 'right' }); T('Généré le ' + rpFr(r.generated), W - M, 54, { align: 'right' });
    y = 112;
    fill(C.orange); doc.rect(M, y - 11, 4, 17, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); txt(C.dark); T('Fiche résumée', M + 11, y + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); txt(C.grey); T('L\'essentiel en une minute — le détail complet est dans les pages suivantes.', W - M, y + 2, { align: 'right' });
    y += 20;

    // Statuts en langage simple
    const rmOk = r.rm.filter(m => !m.orphelin && m.delta != null);
    const ups = rmOk.filter(m => m.delta > 0), downs = rmOk.filter(m => m.delta < 0);
    const bestUp = ups.slice().sort((a, b) => b.delta - a.delta)[0];
    const wAll = [k.energieMoy, k.sommeilMoy, k.douleursMoy].filter(v => v != null);
    const wAvg = wAll.length ? wAll.reduce((a, b) => a + b, 0) / wAll.length : null;
    const ecartRpe = (k.rpeMoy != null && k.rpeCibleMoy != null) ? k.rpeMoy - k.rpeCibleMoy : null;
    const cards = [
      (() => { const t = k.taux; const c = t == null ? C.grey : t >= 85 ? C.green : t >= 65 ? C.amber : C.red;
        return { label: 'ASSIDUITÉ', value: t != null ? t + ' %' : '-', verdict: t == null ? 'Aucune séance prévue' : t >= 85 ? 'Très régulier' : t >= 65 ? 'Plutôt régulier' : 'Séances souvent manquées', sub: (k.muscuFaites + k.enduFaites) + ' séances faites sur ' + (k.muscuPrevues + k.enduPrevues) + ' prévues', c }; })(),
      (() => { const c = !rmOk.length ? C.grey : downs.length ? C.red : ups.length ? C.green : C.amber;
        return { label: 'FORCE MAXIMALE', value: bestUp ? '+' + fr(bestUp.delta) + ' kg' : (rmOk.length ? (downs.length ? sg(downs[0].delta) + ' kg' : '0 kg') : '-'), verdict: !rmOk.length ? 'Pas de test 1RM' : downs.length ? 'En baisse' : ups.length ? 'En progression' : 'Stable',
          sub: bestUp ? bestUp.label + ' : ' + fr(bestUp.debut) + ' > ' + fr(bestUp.fin) + ' kg' : (rmOk.length ? rmOk[0].label + ' : ' + fr(rmOk[0].fin) + ' kg' : 'Renseigne les 1RM dans l\'onglet Muscu'), c }; })(),
      (() => { const a = r.acwr; const c = a == null ? C.grey : a > 1.5 ? C.red : a > 1.3 ? C.amber : a < 0.8 ? C.amber : C.green;
        return { label: 'CHARGE DE TRAVAIL', value: a != null ? fr(a) : '-', verdict: a == null ? 'Pas de charge récente' : a > 1.5 ? 'Hausse trop rapide' : a > 1.3 ? 'En forte hausse' : a < 0.8 ? 'En baisse / faible' : 'Bien dosée',
          sub: 'Semaine récente : ' + (r.chargeAigue || 0) + ' UA  |  habituel : ' + (r.chargeChronique || 0) + ' UA', c }; })(),
      (() => { const c = wAvg == null ? C.grey : wAvg >= 3.8 ? C.green : wAvg >= 3 ? C.amber : C.red;
        return { label: 'FORME DU JOUEUR', value: wAvg != null ? fr(Math.round(wAvg * 10) / 10) + ' / 5' : '-', verdict: wAvg == null ? 'Pas de questionnaire' : wAvg >= 3.8 ? 'Bonne forme' : wAvg >= 3 ? 'Forme moyenne' : 'Forme dégradée',
          sub: wAvg == null ? 'Aucun check-in bien-être sur la période' : 'Sommeil ' + fr(k.sommeilMoy) + '  |  Énergie ' + fr(k.energieMoy) + '  |  Douleurs ' + fr(k.douleursMoy), c }; })(),
      (() => { const c = ecartRpe == null ? (k.rpeMoy != null ? C.blue : C.grey) : Math.abs(ecartRpe) <= 1 ? C.green : C.amber;
        return { label: 'EFFORT RESSENTI (RPE)', value: k.rpeMoy != null ? fr(k.rpeMoy) + ' / 10' : '-', verdict: ecartRpe == null ? (k.rpeMoy != null ? 'Effort moyen déclaré' : 'Pas de retour joueur') : Math.abs(ecartRpe) <= 1 ? 'Conforme au plan' : ecartRpe > 0 ? 'Plus dur que prévu' : 'Plus facile que prévu',
          sub: k.rpeCibleMoy != null ? 'Cible du plan (muscu) : ' + fr(k.rpeCibleMoy) + ' / 10' : '10 = effort maximal', c }; })(),
      (() => { return { label: 'VOLUME RÉALISÉ', value: k.tonnage >= 1000 ? fr(Math.round(k.tonnage / 100) / 10) + ' t' : Math.round(k.tonnage) + ' kg', verdict: k.seriesTot + ' séries de musculation',
          sub: k.volumeEnduM ? fr(Math.round(k.volumeEnduM / 100) / 10) + ' km en endurance' : 'Tonnage = kg soulevés (estimé)', c: C.blue }; })(),
    ];
    const cw = (W - 2 * M - 20) / 3, ch = 74;
    cards.forEach((c, i) => {
      const x = M + (i % 3) * (cw + 10), yy = y + Math.floor(i / 3) * (ch + 10);
      fill(tint(c.c, 0.10)); draw(tint(c.c, 0.45)); doc.setLineWidth(0.6); doc.roundedRect(x, yy, cw, ch, 6, 6, 'FD');
      fill(c.c); doc.roundedRect(x, yy, 6, ch, 3, 3, 'F'); doc.rect(x + 3, yy, 3, ch, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); txt(C.grey); T(c.label, x + 14, yy + 13);
      doc.setFontSize(19); txt(c.c); T(c.value, x + 14, yy + 35);
      doc.setFontSize(9); txt(C.dark); T(c.verdict, x + 14, yy + 49);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.3); txt(C.grey);
      const l = doc.splitTextToSize(rpP(c.sub), cw - 22); doc.text(l.slice(0, 2), x + 14, yy + 60);
    });
    doc.setLineWidth(0.4);
    y += 2 * (ch + 10) + 8;

    // Points positifs / points d'attention (phrases simples)
    const pos = [], att = [];
    if (k.taux != null && k.taux >= 85) pos.push('Très régulier : ' + (k.muscuFaites + k.enduFaites) + ' séances faites sur ' + (k.muscuPrevues + k.enduPrevues) + ' prévues.');
    ups.sort((a, b) => b.delta - a.delta).slice(0, 3).forEach(m => pos.push(m.label + ' : force maximale en hausse de ' + fr(m.delta) + ' kg (' + fr(m.debut) + ' > ' + fr(m.fin) + ' kg).'));
    r.testsEvol.filter(t => t.n > 1 && t.mieux === true).slice(0, 3).forEach(t => pos.push('Test ' + t.label.replace(/\s*\(.*\)/, '') + ' amélioré : ' + fr(t.premier) + ' > ' + fr(t.dernier) + '.'));
    const bestEx = r.exos.filter(e => e.deltaPct != null && e.deltaPct >= 5 && e.apparitions >= 2).sort((a, b) => b.deltaPct - a.deltaPct)[0];
    if (bestEx) pos.push('Charges de travail en hausse sur ' + bestEx.nom + ' (+' + fr(bestEx.deltaPct) + ' %).');
    if (r.acwr != null && r.acwr >= 0.8 && r.acwr <= 1.3) pos.push('Charge d\'entraînement bien dosée (ni trop, ni trop peu).');
    if (wAvg != null && wAvg >= 3.8) pos.push('Bonne forme générale déclarée (sommeil, énergie, douleurs).');
    const nonFaites = r.muscuRows.concat(r.enduRows).filter(x => x.statut === 'Non faite');
    if (nonFaites.length) att.push(nonFaites.length + ' séance(s) non faite(s) : ' + nonFaites.slice(0, 3).map(x => x.nom.replace(/^Séance\s*[—-]\s*/, '') + ' (' + rpFr(x.datePrevu).slice(0, 5) + ')').join(', ') + (nonFaites.length > 3 ? '…' : '') + '.');
    if (k.taux != null && k.taux < 65) att.push('Assiduité faible (' + k.taux + ' %) : voir avec le joueur ce qui bloque.');
    if (r.acwr != null && r.acwr > 1.3) att.push('La charge a augmenté trop vite récemment : risque de fatigue ou de blessure. Prévoir de lever le pied.');
    if (r.acwr == null && r.chargeChronique > 0) att.push('Aucune séance enregistrée ces 7 derniers jours.');
    downs.forEach(m => att.push(m.label + ' : force maximale en baisse de ' + fr(Math.abs(m.delta)) + ' kg.'));
    if (k.sommeilMoy != null && k.sommeilMoy < 3) att.push('Sommeil insuffisant en moyenne (' + fr(k.sommeilMoy) + ' / 5).');
    if (k.douleursMoy != null && k.douleursMoy < 3) att.push('Douleurs / courbatures fréquentes (' + fr(k.douleursMoy) + ' / 5).');
    if (k.energieMoy != null && k.energieMoy < 3) att.push('Niveau d\'énergie bas (' + fr(k.energieMoy) + ' / 5).');
    r.blessures.filter(b => /cours|surveill/i.test(b.statut)).forEach(b => att.push('Blessure : ' + b.zone + (b.type ? ' (' + b.type + ')' : '') + ' — ' + b.statut + '.'));
    if (ecartRpe != null && ecartRpe > 1.5) att.push('Les séances sont ressenties beaucoup plus dures que prévu (RPE ' + fr(k.rpeMoy) + ' pour ' + fr(k.rpeCibleMoy) + ' visé).');
    r.testsEvol.filter(t => t.n > 1 && t.mieux === false && t.delta !== 0).slice(0, 2).forEach(t => att.push('Test ' + t.label.replace(/\s*\(.*\)/, '') + ' en recul : ' + fr(t.premier) + ' > ' + fr(t.dernier) + '.'));
    const stag = r.exos.filter(e => e.apparitions >= 3 && e.deltaKg === 0 && e.kgFin != null && e.kgFin > 20);
    if (stag.length) att.push('Charge inchangée sur ' + stag.slice(0, 3).map(e => e.nom).join(', ') + ' : à faire évoluer si l\'objectif est la force.');
    if (!pos.length) pos.push('Pas encore assez de données pour dégager des progrès : pense à saisir les RPE et les 1RM.');
    if (!att.length) att.push('Rien de particulier à signaler sur la période.');

    const bw = (W - 2 * M - 12) / 2;
    const bulletsH = (arr) => arr.slice(0, 6).reduce((a, t) => a + doc.splitTextToSize(rpP(t), bw - 28).length * 10.5 + 4, 0);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const bh = Math.max(bulletsH(pos), bulletsH(att)) + 34;
    [['POINTS POSITIFS', pos, C.green, M, '+'], ['POINTS D\'ATTENTION', att, C.amber, M + bw + 12, '!']].forEach(([titre, arr, col, x0, sym]) => {
      fill(tint(col, 0.08)); draw(tint(col, 0.5)); doc.setLineWidth(0.6); doc.roundedRect(x0, y, bw, bh, 6, 6, 'FD');
      fill(col); doc.roundedRect(x0, y, bw, 20, 6, 6, 'F'); doc.rect(x0, y + 10, bw, 10, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255); T(titre, x0 + 10, y + 14);
      let yy = y + 34;
      arr.slice(0, 6).forEach(t => {
        const l = doc.splitTextToSize(rpP(t), bw - 28);
        fill(col); doc.circle(x0 + 13, yy - 2.5, 5, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.text(sym, x0 + 13, yy, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); txt(C.dark); doc.text(l, x0 + 24, yy);
        yy += l.length * 10.5 + 4;
      });
    });
    doc.setLineWidth(0.4);
    y += bh + 14;

    // Mini-cartes de force (remplacent le graphique 1RM)
    const cardsRm = r.rm.filter(m => !m.orphelin).slice(0, 8);
    if (cardsRm.length) {
      fill(C.red); doc.rect(M, y - 9, 3, 12, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); txt(C.dark); T('Force maximale (1RM) : où en est le joueur ?', M + 9, y); y += 10;
      const n = Math.min(4, cardsRm.length), rw = (W - 2 * M - (n - 1) * 8) / n, rh = 92;
      cardsRm.forEach((m, i) => {
        const x = M + (i % n) * (rw + 8), yy = y + Math.floor(i / n) * (rh + 8);
        const col = m.delta > 0 ? C.green : m.delta < 0 ? C.red : C.grey;
        fill([255, 255, 255]); draw(C.line); doc.roundedRect(x, yy, rw, rh, 6, 6, 'FD');
        fill(col); doc.rect(x + 8, yy, rw - 16, 3, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); txt(C.grey); T(doc.splitTextToSize(rpP(m.label.toUpperCase()), rw - 12)[0], x + 8, yy + 16);
        doc.setFontSize(18); txt(C.dark); T(fr(m.fin) + ' kg', x + 8, yy + 38);
        doc.setFontSize(8.5); txt(col); T(m.delta === 0 ? 'stable' : sg(m.delta) + ' kg' + (m.deltaPct != null ? ' (' + sg(m.deltaPct) + ' %)' : ''), x + 8, yy + 50);
        spark(x + 10, yy + 58, rw - 20, 22, m.historique.map(e => ({ t: tOf(e.date), v: e.rm })), col);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); txt(C.grey); T(m.ratioPC ? fr(m.ratioPC) + ' × poids de corps' : '', x + 8, yy + rh - 4);
      });
      y += Math.ceil(cardsRm.length / n) * (rh + 8) + 4;
    }

    // Mini-glossaire
    need(54);
    fill(C.light); draw(C.line); doc.roundedRect(M, y, W - 2 * M, 48, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); txt(C.grey); T('MINI-GLOSSAIRE', M + 8, y + 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); txt(C.dark);
    const gl = doc.splitTextToSize(rpP('RPE : effort ressenti par le joueur, de 1 (très facile) à 10 (maximal).  UA : unité de charge = durée de la séance × RPE.  1RM : charge maximale soulevable sur 1 répétition.  Charge de travail : charge de la semaine récente comparée à l\'habitude du joueur (entre 0,8 et 1,3 = bien dosée ; au-delà de 1,5 = risque).  Tonnage : total des kilos soulevés (estimé).'), W - 2 * M - 16);
    doc.text(gl, M + 8, y + 22);

    // ═════════════════════ DÉTAILS ═══════════════════════════════════════════════════════
    doc.addPage(); y = 44;
    fill(C.dark); doc.roundedRect(M, y - 4, W - 2 * M, 24, 5, 5, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(255, 255, 255); T('DÉTAIL COMPLET', M + 12, y + 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(190, 190, 195); T('Toutes les données de la période, par thème', W - M - 10, y + 12, { align: 'right' }); y += 38;

    // 1) CHARGE
    banner('Charge d\'entraînement', 'Combien le joueur a travaillé semaine après semaine (UA = durée × effort ressenti).', C.violet);
    if (r.semaines.length) {
      const x0 = M + 30, w = W - 2 * M - 34, h = 110, y0 = y + 6;
      const maxV = Math.max(10, Math.max.apply(null, r.semaines.map(s => s.ua)));
      const step = maxV > 400 ? 200 : maxV > 150 ? 100 : 50, top = Math.ceil(maxV * 1.05 / step) * step;
      draw(C.line); doc.setLineWidth(0.4);
      for (let v = 0; v <= top; v += step) { const yy = y0 + h - h * v / top; doc.line(x0, yy, x0 + w, yy); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); txt(C.grey); T(String(v), x0 - 4, yy + 2.5, { align: 'right' }); }
      const n = r.semaines.length, bw2 = Math.min(26, w / n * 0.7);
      r.semaines.forEach((s, i) => {
        const cx = x0 + w * (i + 0.5) / n; let yy = y0 + h;
        [[s.uaMuscu, C.orange], [s.uaEndu, C.blue], [s.uaTerrain, C.green]].forEach(([v, c]) => { if (v > 0) { const bh2 = v / top * h; fill(c); doc.rect(cx - bw2 / 2, yy - bh2, bw2, bh2, 'F'); yy -= bh2; } });
        if (n <= 22) { doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); txt(C.grey); T(s.label, cx, y0 + h + 9, { align: 'center' }); }
        if (s.ua > 0 && n <= 16) { doc.setFontSize(6.5); txt(C.dark); T(String(s.ua), cx, yy - 2, { align: 'center' }); }
      });
      y = y0 + h + 22;
      [['Musculation', C.orange], ['Endurance', C.blue], ['Terrain / match', C.green]].forEach((l, i) => { fill(l[1]); doc.rect(M + 30 + i * 100, y - 6, 8, 8, 'F'); doc.setFontSize(8); txt(C.dark); T(l[0], M + 42 + i * 100, y + 1); });
      y += 16;
    }
    tbl2(['Semaine', 'Muscu\nfaites/prév.', 'Endu.\nfaites/prév.', 'UA\nmuscu', 'UA\nendu.', 'UA\nterrain', 'UA\ntotal', 'RPE\nmoy.', 'Charge vs\nhabitude', 'Tonnage\n(kg)'],
      r.semaines.map(s => [rpFr(s.debut) + ' > ' + rpFr(s.fin).slice(0, 5), s.muscuFaites + '/' + s.muscuPrevues, s.enduFaites + '/' + s.enduPrevues, s.uaMuscu || '', s.uaEndu || '', s.uaTerrain || '', s.ua || '', s.rpe != null ? fr(s.rpe) : '', s.acwr != null ? fr(s.acwr) : '', s.tonnage ? Math.round(s.tonnage).toLocaleString('fr-FR') : '']), C.violet,
      { columnStyles: { 0: { halign: 'left' } }, cell: d => { if (d.section === 'body' && d.column.index === 8) { const v = parseFloat(String(d.cell.raw).replace(',', '.')); if (!isNaN(v)) { d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = v > 1.5 ? C.red : v > 1.3 ? C.amber : v < 0.8 ? C.grey : C.green; } } } });
    note('« Charge vs habitude » = charge de la semaine ÷ moyenne des 4 semaines précédentes : entre 0,8 et 1,3 = bien dosée, au-delà de 1,5 = hausse trop rapide. Durée muscu estimée à 9 min par exercice (30 à 100 min), comme dans « Charge équipe ».');

    // 2) FORCE
    banner('Force et progression par exercice', 'Charge maximale (1RM) et charges de travail prescrites, séance après séance.', C.red);
    if (r.rm.length) {
      sub('1RM — charge maximale sur 1 répétition', C.red);
      tbl2(['Mouvement', 'Début', 'Date', 'Actuel', 'Date', 'Évolution', '%', '× poids de corps', 'Record'],
        r.rm.map(m => [m.label, fr(m.debut), rpFr(m.debutDate), fr(m.fin), rpFr(m.finDate), sg(m.delta) + ' kg', m.deltaPct != null ? sg(m.deltaPct) + ' %' : '', m.ratioPC != null ? fr(m.ratioPC) : '', fr(m.record)]), C.red,
        { columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }, styles: { fontSize: 8.5, cellPadding: 4 }, cell: colorSigned([5, 6]) });
    }
    if (r.exos.length) {
      sub('Charges de travail par exercice (séances validées)', C.red);
      tbl2(['Exercice', 'Séances', 'Charge début', 'Charge fin', 'Évol. (kg)', 'Évol. %', 'Pic (kg)', 'Séries', 'Tonnage (kg)'],
        r.exos.map(e => [e.nom, e.apparitions, e.kgDebut != null ? fr(e.kgDebut) : '-', e.kgFin != null ? fr(e.kgFin) : '-', e.deltaKg != null ? sg(e.deltaKg) : '', e.deltaPct != null ? sg(e.deltaPct) + ' %' : '', e.kgPic != null ? fr(e.kgPic) : '-', e.seriesTot, e.tonnage ? Math.round(e.tonnage).toLocaleString('fr-FR') : '']), C.red,
        { columnStyles: { 0: { halign: 'left' } }, cell: colorSigned([4, 5]) });
      const dates = Array.from(new Set([].concat.apply([], r.exos.map(e => e.lignes.map(l => l.date))))).sort().slice(-8);
      const exM = r.exos.filter(e => e.lignes.some(l => l.kgMax != null)).slice(0, 14);
      if (dates.length > 1 && exM.length) {
        sub('Charge prescrite et séries × reps, séance par séance', C.red);
        tbl2(['Exercice'].concat(dates.map(d => rpFr(d).slice(0, 5))), exM.map(e => [e.nom].concat(dates.map(d => { const l = e.lignes.filter(x => x.date === d); if (!l.length) return ''; const m = l[l.length - 1]; return (m.kgMax != null ? fr(m.kgMax) + ' kg' : '') + '\n' + m.series + '×' + m.reps; }))), C.red,
          { columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 100 } }, styles: { fontSize: 7.5, cellPadding: 3 } });
      }
      note('Charges = kg PRESCRITS (% du 1RM du joueur à la date de la séance). Tonnage = estimation (séries × répétitions × charge prescrite), hors exercices au poids de corps non lestés.');
    }

    // 3) MUSCULATION
    if (r.muscuRows.length) {
      banner('Séances de musculation', 'Ce qui était prévu, ce qui a été fait, et comment le joueur l\'a vécu.', C.orange);
      if (r.cycles.length) {
        sub('Par cycle / méthode', C.orange);
        tbl2(['Cycle / méthode', 'Début', 'Fin', 'Séances\nfaites/prév.', 'Réalisation', 'RPE cible', 'RPE réel', 'Tonnage (kg)'],
          r.cycles.map(c => [c.nom, rpFr(c.debut), rpFr(c.fin), c.faites + '/' + c.prevues, c.taux != null ? c.taux + ' %' : '', c.rpeCible != null ? fr(c.rpeCible) : '', c.rpeReel != null ? fr(c.rpeReel) : '', c.tonnage ? Math.round(c.tonnage).toLocaleString('fr-FR') : '']), C.orange, { columnStyles: { 0: { halign: 'left' } } });
      }
      sub('Séance par séance', C.orange);
      tbl2(['Prévue', 'Faite', 'Séance', 'Méthode', 'Exos', 'Séries', 'Tonnage', 'RPE\ncible', 'RPE\nréel', 'Fatigue', 'Statut'],
        r.muscuRows.map(x => [rpFr(x.datePrevu), rpFr(x.dateFaite), x.nom, x.methode, x.nbExos, x.series, x.tonnage ? x.tonnage.toLocaleString('fr-FR') : '', x.rpeCible != null ? fr(x.rpeCible) : '', x.rpeReel != null ? fr(x.rpeReel) : '', x.fatigue != null ? x.fatigue + '/5' : '', x.statut]), C.orange,
        { columnStyles: { 2: { halign: 'left' }, 3: { halign: 'left' } }, styles: { fontSize: 7.5, cellPadding: 3 }, cell: colorStatut(10) });
    }

    // 4) ENDURANCE
    if (r.enduRows.length) {
      banner('Endurance et préparation physique', 'Séances de course / vélo : structure, volume et ressenti.', C.blue);
      tbl2(['Prévue', 'Faite', 'Séance', 'Structure', 'Récup', 'Volume', 'RPE\ncible', 'RPE\nréel', 'UA', 'Statut'],
        r.enduRows.map(x => [rpFr(x.datePrevu), rpFr(x.dateFaite), x.nom, x.structure, x.recup, x.volumeM ? (x.volumeM >= 1000 ? fr((x.volumeM / 1000).toFixed(1)) + ' km' : x.volumeM + ' m') : '', x.rpeCible != null ? fr(x.rpeCible) : '', x.rpeReel != null ? fr(x.rpeReel) : '', x.charge != null ? x.charge : '', x.statut]), C.blue,
        { columnStyles: { 2: { halign: 'left' }, 3: { halign: 'left' }, 4: { halign: 'left' } }, styles: { fontSize: 7.5, cellPadding: 3 }, cell: colorStatut(9) });
      if (r.vma) note('VMA de référence : ' + fr(r.vma) + ' km/h. Volume = distance cumulée de la séance (estimée sur la VMA quand l\'effort est défini en durée).');
    }

    // 5) TESTS
    if (r.testsRows.length) {
      banner('Tests physiques', 'Vitesse, détente, endurance… et leur évolution.', C.indigo);
      const ev = r.testsEvol.filter(t => t.n > 1);
      if (ev.length) tbl2(['Test', 'Premier', 'Dernier', 'Évolution', 'Verdict'], ev.map(t => [t.label, fr(t.premier), fr(t.dernier), sg(t.delta), t.mieux ? 'Amélioration' : t.delta === 0 ? 'Stable' : 'Recul']), C.indigo,
        { columnStyles: { 0: { halign: 'left' } }, styles: { fontSize: 8.5, cellPadding: 4 }, cell: d => { if (d.section === 'body' && d.column.index === 4) { const v = d.cell.raw; d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = v === 'Amélioration' ? C.green : v === 'Recul' ? C.red : C.grey; } } });
      const defs = r.testsDefs;
      sub('Tous les résultats', C.indigo);
      tbl2(['Date', 'Contexte'].concat(defs.map(d => d[1])), r.testsRows.map(t => [rpFr(t.date), t.contexte].concat(defs.map(d => t[d[0]] != null ? fr(t[d[0]]) : ''))), C.indigo, { columnStyles: { 1: { halign: 'left' } }, styles: { fontSize: 7.5, cellPadding: 3 } });
      note('Pour les sprints et l\'agilité, un chiffre plus petit = meilleur résultat.');
    }

    // 6) CORPS & SANTÉ
    const aSante = r.mesures.length || r.wellnessSem.some(w => w.n) || r.blessures.length;
    if (aSante) {
      banner('Corps et santé', 'Composition corporelle, forme au quotidien et blessures.', C.teal);
      if (r.wellnessSem.some(w => w.n)) {
        sub('Forme déclarée par le joueur (moyenne par semaine, sur 5)', C.teal);
        tbl2(['Semaine', 'Énergie', 'Sommeil', 'Humeur', 'Sérénité\n(stress)', 'Absence de\ndouleur', 'Check-ins'], r.wellnessSem.filter(w => w.n).map(w => [rpFr(w.debut).slice(0, 5), w.energie != null ? fr(w.energie) : '', w.sommeil != null ? fr(w.sommeil) : '', w.humeur != null ? fr(w.humeur) : '', w.stress != null ? fr(w.stress) : '', w.douleurs != null ? fr(w.douleurs) : '', w.n]), C.teal,
          { cell: d => { if (d.section === 'body' && d.column.index >= 1 && d.column.index <= 5) { const v = parseFloat(String(d.cell.raw).replace(',', '.')); if (!isNaN(v)) { const c = v >= 3.8 ? C.green : v >= 3 ? C.amber : C.red; d.cell.styles.fillColor = tint(c, 0.18); d.cell.styles.textColor = c; d.cell.styles.fontStyle = 'bold'; } } } });
        note('5 = excellent / aucune douleur, 1 = très mauvais. Vert ≥ 3,8 · orange 3 à 3,8 · rouge < 3.');
      }
      if (r.mesures.length) {
        sub('Composition corporelle', C.teal);
        tbl2(['Date', 'Poids (kg)', 'Masse grasse (%)', 'Masse musc. (kg)', 'T. hanches', 'T. épaule', 'T. cuisse'], r.mesures.map(m => [rpFr(m.date), m.poids != null ? fr(m.poids) : '', m.masseGrasse != null ? fr(m.masseGrasse) : '', m.masseMusc != null ? fr(m.masseMusc) : '', m.hanches != null ? fr(m.hanches) : '', m.epaule != null ? fr(m.epaule) : '', m.cuisse != null ? fr(m.cuisse) : '']), C.teal);
      }
      if (r.blessures.length) {
        sub('Blessures et suivi médical', C.red);
        tbl2(['Zone', 'Type', 'Début', 'Statut', 'Protocole'], r.blessures.map(b => [b.zone, b.type, rpFr(b.debut), b.statut, b.protocole]), C.red, { columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' }, 4: { halign: 'left' } } });
      }
    }

    // Pieds de page
    const n = doc.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 155); doc.text(rpP('PerfHand — ' + (pl.name || '') + ' — rapport du ' + rpFr(r.from) + ' au ' + rpFr(r.to)), M, H - 16); doc.text('Page ' + i + '/' + n, W - M, H - 16, { align: 'right' }); }
    doc.save('rapport_' + String(pl.name || 'joueur').replace(/\s+/g, '_') + '_' + r.generated + '.pdf');
  } catch (e) {
    console.error('[PerfHand] Rapport PDF:', e);
    alert('Erreur lors de la création du PDF : ' + (e && e.message || e));
  }
}

// ── EXCEL ──────────────────────────────────────────────────────────────────────────────
async function exporterRapportJoueurExcel(r) {
  try {
    if (typeof ExcelJS === 'undefined') { alert("La librairie d'export Excel n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
    const wb = new ExcelJS.Workbook(); wb.creator = 'PerfHand'; wb.created = new Date();
    const pl = r.player;
    const style = (ws, hdrColor) => {
      const hr = ws.getRow(1);
      hr.eachCell(c => { c.font = { bold: true, color: { argb: 'FF141418' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hdrColor || 'FFFFA420' } }; c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; });
      hr.height = 26;
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      ws.eachRow((row, i) => { if (i > 1) row.eachCell(c => { c.alignment = { vertical: 'middle', horizontal: typeof c.value === 'number' ? 'center' : 'left', wrapText: true }; }); });
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
    };
    const sheet = (name, cols, rows, widths, hdr) => {
      const ws = wb.addWorksheet(name);
      ws.addRow(cols); rows.forEach(x => ws.addRow(x));
      ws.columns.forEach((c, i) => { c.width = (widths && widths[i]) || Math.max(11, String(cols[i]).length + 3); });
      style(ws, hdr); return ws;
    };
    const colorStatut = (ws, idx) => ws.eachRow((row, i) => { if (i > 1) { const c = row.getCell(idx); const v = c.value; c.font = { bold: true, color: { argb: v === 'Faite' ? 'FF2E7D32' : v === 'Non faite' ? 'FFC62828' : 'FF757575' } }; } });
    const colorDelta = (ws, idx) => ws.eachRow((row, i) => { if (i > 1) { const c = row.getCell(idx); if (typeof c.value === 'number') c.font = { bold: true, color: { argb: c.value > 0 ? 'FF2E7D32' : c.value < 0 ? 'FFC62828' : 'FF757575' } }; } });
    const n = v => v == null || v === '' ? null : v;
    const k = r.kpi;

    // Synthèse
    const ws0 = wb.addWorksheet('Synthèse');
    ws0.columns = [{ width: 34 }, { width: 22 }, { width: 70 }];
    const t = ws0.addRow(['RAPPORT D\'ENTRAÎNEMENT — ' + (pl.name || '')]); t.font = { bold: true, size: 16 }; ws0.mergeCells('A1:C1');
    ws0.addRow(['Période', rpFr(r.from) + ' au ' + rpFr(r.to)]); ws0.addRow(['Généré le', rpFr(r.generated)]);
    ws0.addRow(['Poste', pl.pos || pl.poste || '']); ws0.addRow(['Âge / taille / poids', [pl.age ? pl.age + ' ans' : '', pl.taille ? pl.taille + ' cm' : '', rpRefAt(pl, 'poids_corps', r.to) ? rpRefAt(pl, 'poids_corps', r.to) + ' kg' : ''].filter(Boolean).join(' / ')]);
    ws0.addRow([]);
    const hh = ws0.addRow(['Indicateur', 'Valeur', 'Détail']); hh.eachCell(c => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA420' } }; });
    [['Séances faites / prévues', (k.muscuFaites + k.enduFaites) + ' / ' + (k.muscuPrevues + k.enduPrevues), k.taux != null ? k.taux + '% d\'assiduité' : ''],
     ['Musculation faites / prévues', k.muscuFaites + ' / ' + k.muscuPrevues, k.tauxMuscu != null ? k.tauxMuscu + '%' : ''],
     ['Endurance faites / prévues', k.enduFaites + ' / ' + k.enduPrevues, k.tauxEndu != null ? k.tauxEndu + '%' : ''],
     ['RPE moyen ressenti', k.rpeMoy, k.rpeCibleMoy != null ? 'RPE cible muscu moyen : ' + k.rpeCibleMoy : ''],
     ['Charge totale (UA)', k.uaTotal, 'UA = durée × RPE'], ['ACWR (7 j / 28 j)', r.acwr, 'optimal 0,8 à 1,3'],
     ['Tonnage musculation estimé (kg)', Math.round(k.tonnage), 'séries × reps × charge prescrite'], ['Séries de musculation', k.seriesTot, ''],
     ['Volume d\'endurance (m)', Math.round(k.volumeEnduM), r.vma ? 'VMA ' + r.vma + ' km/h' : ''],
     ['Sommeil moyen (/5)', k.sommeilMoy, ''], ['Énergie moyenne (/5)', k.energieMoy, ''], ['Douleurs moyennes (/5, 5 = aucune)', k.douleursMoy, '']].forEach(a => ws0.addRow(a.map(n)));
    ws0.addRow([]); const lh = ws0.addRow(['Lecture rapide']); lh.font = { bold: true, size: 12 };
    r.insights.forEach(s => { const row = ws0.addRow([s.slice(4)]); ws0.mergeCells('A' + row.number + ':C' + row.number); row.getCell(1).alignment = { wrapText: true, vertical: 'top' }; row.height = 30; const tag = s.slice(0, 3); row.getCell(1).font = { color: { argb: tag === '[+]' ? 'FF2E7D32' : tag === '[!]' ? 'FFC62828' : 'FF555555' } }; });

    // Semaines
    const wsS = sheet('Semaines (charge)', ['Début', 'Fin', 'Muscu prévues', 'Muscu faites', 'Endu prévues', 'Endu faites', 'UA muscu', 'UA endurance', 'UA terrain', 'UA total', 'RPE moyen', 'ACWR', 'Tonnage (kg)', 'Volume endurance (m)'],
      r.semaines.map(s => [rpFr(s.debut), rpFr(s.fin), s.muscuPrevues, s.muscuFaites, s.enduPrevues, s.enduFaites, s.uaMuscu, s.uaEndu, s.uaTerrain, s.ua, n(s.rpe), n(s.acwr), Math.round(s.tonnage), Math.round(s.volumeM)]));
    wsS.eachRow((row, i) => { if (i > 1) { const c = row.getCell(12); const v = c.value; if (typeof v === 'number') c.font = { bold: true, color: { argb: v > 1.5 ? 'FFC62828' : v > 1.3 ? 'FFE67800' : v < 0.8 ? 'FF757575' : 'FF2E7D32' } }; } });

    // Séances muscu
    const wsM = sheet('Séances musculation', ['Date prévue', 'Date faite', 'Séance', 'Méthode', 'Contexte', 'Nb exercices', 'Séries', 'Tonnage estimé (kg)', 'RPE cible', 'RPE réel', 'Fatigue /5', 'Énergie /5', 'Sommeil /5', 'Douleurs /5', 'Durée estimée (min)', 'Charge (UA)', 'Statut', 'Commentaire joueur'],
      r.muscuRows.map(x => [rpFr(x.datePrevu), rpFr(x.dateFaite), x.nom, x.methode, x.contexte, x.nbExos, x.series, x.tonnage, n(x.rpeCible), n(x.rpeReel), n(x.fatigue), n(x.energie), n(x.sommeil), n(x.douleurs), x.duree, n(x.charge), x.statut, x.notesJoueur]),
      [12, 12, 34, 22, 18, 10, 9, 14, 9, 9, 9, 9, 9, 9, 12, 11, 11, 40]); colorStatut(wsM, 17);

    // Détail exercices (une ligne par exercice et par séance)
    const rowsEx = [];
    r.exos.forEach(e => e.lignes.forEach(l => rowsEx.push([e.nom, rpFr(l.date), l.seance, l.series, l.reps, n(l.pct), n(l.kgMax), n(l.kgMoy), l.repsTot || null, Math.round(l.tonnage)])));
    rowsEx.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    sheet('Détail exercices', ['Exercice', 'Date', 'Séance', 'Séries', 'Reps prescrites', '% 1RM / PC', 'Charge max (kg)', 'Charge moy. (kg)', 'Reps totales', 'Tonnage (kg)'], rowsEx, [34, 11, 32, 9, 14, 11, 14, 14, 11, 12]);
    const wsP = sheet('Progression exercices', ['Exercice', 'Séances', 'Charge début (kg)', 'Charge fin (kg)', 'Évolution (kg)', 'Évolution (%)', 'Pic (kg)', 'Séries', 'Reps', 'Tonnage (kg)'],
      r.exos.map(e => [e.nom, e.apparitions, n(e.kgDebut), n(e.kgFin), n(e.deltaKg), n(e.deltaPct), n(e.kgPic), e.seriesTot, e.repsTot, e.tonnage]), [36, 9, 14, 14, 13, 13, 10, 9, 9, 13]); colorDelta(wsP, 5); colorDelta(wsP, 6);

    // 1RM : synthèse + historique
    const wsR = sheet('1RM', ['Mouvement', '1RM début (kg)', 'Date début', '1RM actuel (kg)', 'Date', 'Évolution (kg)', 'Évolution (%)', '× poids de corps', 'Record (kg)'],
      r.rm.map(m => [m.label, m.debut, rpFr(m.debutDate), m.fin, rpFr(m.finDate), m.delta, n(m.deltaPct), n(m.ratioPC), m.record]), [26, 14, 12, 14, 12, 13, 13, 14, 12]); colorDelta(wsR, 6);
    const rowsH = []; r.rm.forEach(m => m.historique.forEach(e => rowsH.push([m.label, rpFr(e.date), e.rm])));
    sheet('1RM historique', ['Mouvement', 'Date', '1RM (kg)'], rowsH, [26, 12, 12]);

    // Endurance
    const wsE = sheet('Endurance', ['Date prévue', 'Date faite', 'Séance', 'Type', 'Structure', 'Récupération', 'Intensité', 'Volume estimé (m)', 'Durée (min)', 'RPE cible', 'RPE réel', 'Fatigue /5', 'Charge (UA)', 'Statut'],
      r.enduRows.map(x => [rpFr(x.datePrevu), rpFr(x.dateFaite), x.nom, x.type, x.structure, x.recup, x.intensite, n(x.volumeM), x.duree, n(x.rpeCible), n(x.rpeReel), n(x.fatigue), n(x.charge), x.statut]), [12, 12, 36, 24, 26, 22, 18, 14, 10, 9, 9, 9, 11, 11], 'FF38BDF8'); colorStatut(wsE, 14);
    if (r.terrainRows.length) sheet('Terrain-match', ['Date', 'Séance', 'Durée (min)', 'RPE', 'Charge (UA)', 'Fatigue', 'Notes'], r.terrainRows.map(x => [rpFr(x.date), x.type, n(x.duree), n(x.rpe), n(x.charge), n(x.fatigue), x.notes]), [12, 28, 11, 8, 12, 9, 40], 'FF4CAF50');

    // Tests
    if (r.testsRows.length) {
      sheet('Tests', ['Date', 'Contexte'].concat(r.testsDefs.map(d => d[1])).concat(['Notes']), r.testsRows.map(x => [rpFr(x.date), x.contexte].concat(r.testsDefs.map(d => n(x[d[0]]))).concat([x.notes])), null, 'FF7C6FFF');
      sheet('Tests évolution', ['Test', 'Premier', 'Date', 'Dernier', 'Date', 'Évolution', 'Verdict'], r.testsEvol.map(t2 => [t2.label, t2.premier, rpFr(t2.premierDate), t2.dernier, rpFr(t2.dernierDate), t2.delta, t2.n < 2 ? '1 seule mesure' : t2.mieux ? 'Amélioration' : t2.delta === 0 ? 'Stable' : 'Régression']), [30, 10, 12, 10, 12, 11, 16], 'FF7C6FFF');
    }
    if (r.mesures.length) sheet('Composition corporelle', ['Date', 'Poids (kg)', 'Masse grasse (%)', 'Masse musculaire (kg)', 'Tour de hanches', 'Tour d\'épaule', 'Tour de cuisse'], r.mesures.map(m => [rpFr(m.date), n(m.poids), n(m.masseGrasse), n(m.masseMusc), n(m.hanches), n(m.epaule), n(m.cuisse)]), [12, 12, 16, 18, 15, 15, 15], 'FFEC4899');
    if (r.wellness.length) sheet('Bien-être', ['Date', 'Énergie /5', 'Sommeil /5', 'Humeur /5', 'Stress /5 (5 = serein)', 'Douleurs /5 (5 = aucune)'], r.wellness.map(w => [rpFr(w.date), n(w.energie), n(w.sommeil), n(w.humeur), n(w.stress), n(w.douleurs)]), [12, 12, 12, 12, 20, 22], 'FF4CAF50');
    if (r.blessures.length) sheet('Blessures', ['Zone', 'Type', 'Début', 'Statut', 'Protocole'], r.blessures.map(b => [b.zone, b.type, rpFr(b.debut), b.statut, b.protocole]), [20, 26, 12, 14, 60], 'FFFF4455');

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'rapport_' + String(pl.name || 'joueur').replace(/\s+/g, '_') + '_' + r.generated + '.xlsx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error('[PerfHand] Rapport Excel:', e);
    alert('Erreur lors de la création du fichier Excel : ' + (e && e.message || e));
  }
}

// ── Export Excel ÉQUIPE : une ligne par joueur + matrice de charge par semaine ───────────────
async function exporterRapportEquipeExcel(players, from, to, titre, clubs) {
  try {
    if (typeof ExcelJS === 'undefined') { alert("La librairie d'export Excel n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
    const reps = (players || []).filter(p => p && !p.archived).map(p => { try { return buildRapportJoueur(p, from, to); } catch (e) { console.warn(e); return null; } }).filter(Boolean);
    if (!reps.length) { alert('Aucun joueur à exporter.'); return; }
    const wb = new ExcelJS.Workbook(); wb.creator = 'PerfHand'; wb.created = new Date();
    const hdr = ws => { const hr = ws.getRow(1); hr.eachCell(c => { c.font = { bold: true, color: { argb: 'FF141418' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA420' } }; c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; }); hr.height = 30; ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }]; ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }; };
    const n = v => v == null || v === '' ? null : v;
    const rmOf = (r, id) => r.rm.find(m => m.id === id);
    // Une série de 3 feuilles PAR ÉQUIPE (club / groupe), pour ne pas mélanger N1, Prénationale, U18…
    const groupes = [];
    reps.forEach(r => { const cid = r.player.clubId || '_autres'; let g = groupes.find(x => x.cid === cid);
      if (!g) { const c = (clubs || []).find(c => c.id === cid); g = { cid, label: c ? c.name : (cid === '_autres' ? 'Profils individuels' : String(cid)), reps: [] }; groupes.push(g); }
      g.reps.push(r); });
    groupes.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    const nomsPris = new Set();
    groupes.forEach((g, gi) => {
    const reps = g.reps.slice().sort((a, b) => String(a.player.name || '').localeCompare(String(b.player.name || ''), 'fr'));
    let court = g.label.replace(/Union Sud Mayenne/gi, 'USM').replace(/[\\\/*?:\[\]()]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16) || ('Equipe ' + (gi + 1));
    while (nomsPris.has(court.toLowerCase())) court += gi;
    nomsPris.add(court.toLowerCase());
    const nomFeuille = suf => groupes.length > 1 ? court + ' · ' + suf : suf;
    const ws = wb.addWorksheet(nomFeuille('Synthèse'));
    ws.addRow(['Joueur', 'Poste', 'Muscu faites', 'Muscu prévues', 'Réalisation muscu %', 'Endu faites', 'Endu prévues', 'Réalisation endu %', 'Assiduité %', 'RPE moyen', 'Charge totale (UA)', 'ACWR', 'Tonnage muscu (kg)',
      'Squat 1RM', 'Squat Δ', 'Bench 1RM', 'Bench Δ', 'RDL 1RM', 'RDL Δ', 'Rowing 1RM', 'Rowing Δ', 'Sommeil /5', 'Énergie /5', 'Douleurs /5', 'Blessure / surveillance']);
    reps.forEach(r => {
      const k = r.kpi, sq = rmOf(r, 'squat'), be = rmOf(r, 'bench'), rd = rmOf(r, 'rdl'), ro = rmOf(r, 'rowing');
      ws.addRow([r.player.name, r.player.pos || r.player.poste || '', k.muscuFaites, k.muscuPrevues, n(k.tauxMuscu), k.enduFaites, k.enduPrevues, n(k.tauxEndu), n(k.taux), n(k.rpeMoy), k.uaTotal, n(r.acwr), Math.round(k.tonnage),
        sq ? sq.fin : null, sq ? sq.delta : null, be ? be.fin : null, be ? be.delta : null, rd ? rd.fin : null, rd ? rd.delta : null, ro ? ro.fin : null, ro ? ro.delta : null,
        n(k.sommeilMoy), n(k.energieMoy), n(k.douleursMoy), r.blessures.filter(b => /cours|surveill/i.test(b.statut)).map(b => b.zone).join(', ')]);
    });
    ws.columns.forEach((c, i) => { c.width = i === 0 ? 24 : i === 24 ? 28 : 12; });
    hdr(ws);
    ws.eachRow((row, i) => { if (i > 1) row.eachCell((c, j) => { c.alignment = { vertical: 'middle', horizontal: j <= 2 || j === 25 ? 'left' : 'center' };
      if ([15, 17, 19, 21].includes(j) && typeof c.value === 'number') c.font = { bold: true, color: { argb: c.value > 0 ? 'FF2E7D32' : c.value < 0 ? 'FFC62828' : 'FF757575' } };
      if (j === 12 && typeof c.value === 'number') c.font = { bold: true, color: { argb: c.value > 1.5 ? 'FFC62828' : c.value > 1.3 ? 'FFE67800' : c.value < 0.8 ? 'FF757575' : 'FF2E7D32' } };
      if (j === 9 && typeof c.value === 'number') c.font = { bold: true, color: { argb: c.value >= 85 ? 'FF2E7D32' : c.value >= 65 ? 'FFE67800' : 'FFC62828' } }; }); });
    // Matrice charge hebdomadaire (UA)
    const weeks = reps[0].semaines.map(s => s.debut);
    const w2 = wb.addWorksheet(nomFeuille('Charge UA'));
    w2.addRow(['Joueur'].concat(weeks.map(d => rpFr(d).slice(0, 5))).concat(['Total']));
    reps.forEach(r => w2.addRow([r.player.name].concat(r.semaines.map(s => s.ua || null)).concat([r.kpi.uaTotal])));
    w2.columns.forEach((c, i) => { c.width = i === 0 ? 24 : 9; });
    hdr(w2);
    // Matrice assiduité hebdo (séances faites / prévues)
    const w3 = wb.addWorksheet(nomFeuille('Assiduité'));
    w3.addRow(['Joueur'].concat(weeks.map(d => rpFr(d).slice(0, 5))));
    reps.forEach(r => w3.addRow([r.player.name].concat(r.semaines.map(s => (s.muscuPrevues + s.enduPrevues) ? (s.muscuFaites + s.enduFaites) + '/' + (s.muscuPrevues + s.enduPrevues) : ''))));
    w3.columns.forEach((c, i) => { c.width = i === 0 ? 24 : 9; });
    hdr(w3);
    w3.eachRow((row, i) => { if (i > 1) row.eachCell((c, j) => { if (j > 1) { c.alignment = { horizontal: 'center' }; const m = String(c.value || '').match(/^(\d+)\/(\d+)$/); if (m) c.font = { bold: true, color: { argb: m[1] === m[2] ? 'FF2E7D32' : +m[1] === 0 ? 'FFC62828' : 'FFE67800' } }; } }); });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'synthese_equipe_' + String(titre || 'club').replace(/\s+/g, '_') + '_' + localDateStr() + '.xlsx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error('[PerfHand] Export équipe:', e);
    alert("Erreur lors de l'export Excel équipe : " + (e && e.message || e));
  }
}

// ── Fenêtre « Rapport » (choix de la période + PDF / Excel) ──────────────────────────────
function RapportJoueurModal({ player, onClose }) {
  const periodes = React.useMemo(() => rpPeriodes(player), [player && player.id]);
  const [pid, setPid] = React.useState('8s');
  const [from, setFrom] = React.useState(() => (periodes.find(p => p.id === '8s') || periodes[0]).from);
  const [to, setTo] = React.useState(() => (periodes.find(p => p.id === '8s') || periodes[0]).to);
  const [busy, setBusy] = React.useState(false);
  const rapport = React.useMemo(() => { try { return buildRapportJoueur(player, from, to); } catch (e) { console.error(e); return null; } }, [player, from, to]);
  const choisir = p => { setPid(p.id); setFrom(p.from); setTo(p.to); };
  const k = rapport && rapport.kpi;
  const chip = (txt, val, col) => _h`<div style=${{ flex:'1 1 90px', background:'rgba(255,255,255,.04)', borderRadius:10, padding:'8px 10px' }}>
    <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1 }}>${txt}</div>
    <div style=${{ fontSize:17, fontWeight:800, color:col || '#fff' }}>${val}</div></div>`;
  return _h`<div style=${{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.72)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick=${onClose}>
    <div style=${{ background:'#14161b', border:'1px solid rgba(255,164,32,.35)', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', padding:'18px 18px 16px' }} onClick=${e => e.stopPropagation()}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <div style=${{ fontSize:17, fontWeight:800 }}>📊 Rapport d'entraînement</div>
        <button class="btn btn-sm" onClick=${onClose}>✕</button>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:14 }}>${player.name} — synthèse complète : séances, charge, 1RM, progression par exercice, tests, bien-être.</div>
      <div class="lbl">Période</div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        ${periodes.map(p => _h`<button key=${p.id} onClick=${() => choisir(p)} style=${{ padding:'6px 12px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:pid === p.id ? 800 : 500,
          border:'1px solid ' + (pid === p.id ? '#FFA420' : 'rgba(255,255,255,.12)'), background:pid === p.id ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)', color:pid === p.id ? '#FFA420' : 'rgba(255,255,255,.6)' }}>${p.label}</button>`)}
      </div>
      <div style=${{ display:'flex', gap:8, marginBottom:14 }}>
        <div style=${{ flex:1 }}><div class="lbl">Du</div><input class="inp" type="date" value=${from} onInput=${e => { setPid('perso'); setFrom(e.target.value); }}/></div>
        <div style=${{ flex:1 }}><div class="lbl">Au</div><input class="inp" type="date" value=${to} onInput=${e => { setPid('perso'); setTo(e.target.value); }}/></div>
      </div>
      ${k ? _h`<div style=${{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        ${chip('Assiduité', k.taux != null ? k.taux + '%' : '-', k.taux >= 85 ? '#4CAF50' : k.taux >= 65 ? '#FFA420' : '#FF4455')}
        ${chip('Séances faites', (k.muscuFaites + k.enduFaites) + '/' + (k.muscuPrevues + k.enduPrevues))}
        ${chip('RPE moyen', k.rpeMoy != null ? k.rpeMoy : '-')}
        ${chip('Charge', k.uaTotal ? k.uaTotal + ' UA' : '-')}
      </div>
      <div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'8px 12px', marginBottom:14 }}>
        <div style=${{ fontSize:10, fontWeight:800, color:'#FFA420', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Lecture rapide</div>
        ${rapport.insights.slice(0, 6).map((t, i) => _h`<div key=${i} style=${{ fontSize:11.5, lineHeight:1.5, color:'rgba(255,255,255,.75)', padding:'2px 0' }}>${t.slice(0, 3) === '[+]' ? '🟢' : t.slice(0, 3) === '[!]' ? '🔴' : '⚪'} ${t.slice(4).replace(/(\d)\.(\d)/g, '$1,$2')}</div>`)}
      </div>` : null}
      <div style=${{ display:'flex', gap:8 }}>
        <button class="btn btn-primary" disabled=${busy || !rapport} style=${{ flex:1, padding:'11px 8px', fontWeight:800 }} onClick=${() => { setBusy(true); setTimeout(() => { try { exporterRapportJoueurPDF(buildRapportJoueur(player, from, to)); } finally { setBusy(false); } }, 30); }}>📄 Télécharger le PDF</button>
        <button class="btn" disabled=${busy || !rapport} style=${{ flex:1, padding:'11px 8px', fontWeight:800, background:'rgba(76,175,80,.12)', border:'1px solid rgba(76,175,80,.4)', color:'#4CAF50' }} onClick=${async () => { setBusy(true); try { await exporterRapportJoueurExcel(buildRapportJoueur(player, from, to)); } finally { setBusy(false); } }}>📗 Télécharger l'Excel</button>
      </div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:10, lineHeight:1.5 }}>Le PDF se lit d'un coup d'œil (graphiques + tableaux). L'Excel contient toutes les données brutes en onglets pour tes propres analyses.</div>
    </div>
  </div>`;
}
