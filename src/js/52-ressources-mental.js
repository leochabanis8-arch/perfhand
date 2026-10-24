
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
