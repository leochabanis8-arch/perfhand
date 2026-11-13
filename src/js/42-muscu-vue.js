

function MuscuView({ player, setDb, isCoach, db, onSeanceDone }) {
  if (!player) return _h`<div style=${{ padding:40, textAlign:"center", color:"rgba(255,255,255,.3)" }}>Chargement...</div>`;
  const [sousOnglet, setSousOnglet] = useState('seances');
  const [showAddSeance, setShowAddSeance] = useState(false);
  const [editSeance, setEditSeance] = useState(null);
  const [ressentModal, setRessentModal] = useState(null);
  const [showMethode, setShowMethode] = useState(null);
  const [selCycleSem, setSelCycleSem] = useState({}); // { [methodeId]: cycleIndex }
  const [filteredSem, setFilteredSem] = useState(null); // null = toutes les semaines
  const [showTesting, setShowTesting] = useState(null); // methode testing ouverte
  const [newSeanceBase, setNewSeanceBase] = useState(null);
  const [showWellnessAfter, setShowWellnessAfter] = useState(false);
  const [seanceForWellness, setSeanceForWellness] = useState(null);
  const [showHistorique, setShowHistorique] = useState(false);
  const [expandedNext, setExpandedNext] = useState(null);
  const [closedNext, setClosedNext] = useState(null);
  const [showDupePicker, setShowDupePicker] = useState(false); // sélecteur de joueurs pour dupliquer
  const [dupeSelected, setDupeSelected] = useState([]); // ids sélectionnés
  const [dupeSingleSeance, setDupeSingleSeance] = useState(null); // séance individuelle à dupliquer (ajoute, n'écrase pas)

  // Toujours lire les séances depuis le store live pour éviter les props périmées
  const { db: liveDb } = typeof useApp === 'function' ? useApp() : { db: null };
  const livePlayer = liveDb
    ? ((liveDb.playersPerso||[]).find(p => p.id === player.id) ||
       (liveDb.playerProfiles||[]).find(p => p.id === player.id) ||
       player)
    : player;
  const seances = livePlayer.muscuSeances || [];

  function saveSeances(newSeances) {
    if (window.__perfhand_db && player && player.id) {
      let safeSeances; try { safeSeances = JSON.parse(JSON.stringify(newSeances)); } catch(e) { safeSeances = newSeances; }
      // Joueur USM collectif → playerProfiles
      const inProfiles = (db.playerProfiles||[]).some(pl => pl.id === player.id);
      const path = inProfiles ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
      window.__perfhand_db.ref(path + player.id + '/muscuSeances').set(safeSeances)
        .then(() => console.log('[muscuSeances] ✅ écrit pour', player.name))
        .catch(e => { console.error('[muscuSeances] ❌ échec:', e && e.code, e && e.message); alert('Erreur : la séance n\'a pas pu être enregistrée. Vérifie ta connexion et réessaie.'); });
    }
    setDb(d => {
      const inPerso = (d.playersPerso||[]).some(pl => pl.id === player.id);
      return {
        ...d,
        playerProfiles: (d.playerProfiles||[]).map(pl =>
          pl.id === player.id ? { ...pl, muscuSeances: newSeances } : pl
        ),
        playersPerso: inPerso
          ? (d.playersPerso||[]).map(pl => pl.id === player.id ? { ...pl, muscuSeances: newSeances } : pl)
          : d.playersPerso||[]
      };
    });
  }

  function addSeance(s) { saveSeances([...seances, { ...s, id: Date.now(), seqNum: seances.length + 1, dateCreation: localDateStr() }]); }
  function updateSeance(id, upd) {
    const newSeances = seances.map(s => s.id === id ? { ...s, ...upd } : s);
    saveSeances(newSeances); // saveSeances gère déjà Firebase correctement
  }
  function deleteSeance(id) { if (confirm('Supprimer cette séance ?')) saveSeances(seances.filter(s => s.id !== id)); }

  function saveRessenti(id, ressenti) {
    saveSeances(seances.map(s => s.id === id ? { ...s, ...ressenti } : s));
  }

  // Map exercise name → rmHistory key
  const RM_MAP = {
    'Squat barre': 'squat', 'Back Squat': 'squat', 'Back squat': 'squat', 'Squat': 'squat', 'Squat sauté (barre légère)': 'squat',
    'Squat Jump chargé': 'squat', 'Squat jump 30% 1RM': 'squat',
    'Développé couché': 'bench', 'Developpe couche': 'bench', 'Bench Press': 'bench',
    'Développé couché explosif': 'bench', 'Développé militaire': null,
    'Soulevé de terre': 'rdl', 'Souleve de terre': 'rdl', 'Romanian Deadlift': 'rdl',
    'Deadlift explosif': 'rdl', 'Deadlift': 'rdl',
    'Rowing barre': 'rowing', 'Rowing': 'rowing', 'Rowing barre': 'rowing',
  };

  function getRM(exName) {
    const key = RM_MAP[exName];
    if (!key || !player.rmHistory || !player.rmHistory[key]) return null;
    const hist = player.rmHistory[key];
    if (!hist.length) return null;
    return hist[hist.length - 1].rm;
  }

  function calcCharge(exName, pct) {
    if (!pct) return '';
    const rm = getRM(exName);
    if (!rm) return pct + '% 1RM';
    const kg = Math.round((rm * pct / 100) / 2.5) * 2.5;
    return kg + ' kg (' + pct + '% de ' + rm + ' kg)';
  }

  // Recalcule la charge d'un exercice EN DIRECT a partir du 1RM actuel du joueur
  // (au lieu d'utiliser la valeur figee au moment de la creation de la seance)
  function liveCharge(ex) {
    if (!ex) return ex;
    var cd = ex.chargeDetails;
    if (cd && cd.length > 0) {
      var newCd = cd.map(function(d) {
        return d.pct ? Object.assign({}, d, { charge: calcCharge(ex.nom, d.pct) }) : d;
      });
      var firstPct = cd[0] && cd[0].pct;
      var newCharge = firstPct ? calcCharge(ex.nom, firstPct) : ex.charge;
      return Object.assign({}, ex, { charge: newCharge, chargeDetails: newCd });
    }
    return ex;
  }

  function createFromMethode(methode, cycleIdx) {
    // Méthode personnalisée : structure différente (exercicesRef flat, pas de cycles %1RM)
    if (methode.isCustom || methode.isBilanDepart || methode.isTemplate) {
      const exercices = (methode.exercicesRef || []).map(ex => ({
        nom: ex.nom, series: parseInt(ex.series) || 3, reps: ex.reps || '8-10',
        charge: ex.charge || '', repos: ex.repos || '90s', notes: ex.notes || '',
        rir: ex.rir || '',
        // Exercices de la bibliothèque (bilans de départ) : lien + image/vidéo repris automatiquement
        ...(ex.biblio ? (() => {
          const b = findBiblioMatch(ex.biblio);
          return { biblio: ex.biblio, biblioExplicit: true, ...(b && b.imageUrl ? { imageUrl: b.imageUrl } : {}) };
        })() : {}),
        // CORRECTIF EMOM : cette liste blanche de champs ne reprenait pas emom/emomDuree — un
        // exercice EMOM sauvegardé dans une méthode personnalisée perdait donc son chrono EMOM
        // (repassait en repos classique) à chaque fois que la méthode était réutilisée.
        ...(ex.emom ? { emom: true, emomDuree: ex.emomDuree || 10 } : {}),
        ...(ex.blocNom != null ? { blocNom: ex.blocNom } : {}),
      }));
      const base = {
        nom: (methode.isBilanDepart || methode.isTemplate) ? methode.nom : 'Séance — ' + methode.nom,
        datePrevu: localDateStr(),
        methode: methode.nom,
        contexte: '', objectif: methode.description, rpeCible: methode.isTemplate ? (methode.rpeCible || null) : (methode.isBilanDepart ? 5 : null),
        notes: (methode.isBilanDepart || methode.isTemplate) ? (methode.protocole || '') : '', cycle: '', exercices,
      };
      setNewSeanceBase(base);
      setShowAddSeance(true);
      setShowMethode(null);
      return;
    }
    // CORRECTIF EMOM : le modèle "EMOM" n'avait pas d'exercices_type (donc 0 exercice créé) et,
    // même en ajoutant les exercices à la main ensuite, rien ne les marquait automatiquement comme
    // EMOM — le coach devait penser à cocher "EMOM" sur CHAQUE exercice, sans quoi le chrono
    // démarrait en mode "repos classique" au lieu du vrai chrono EMOM minute par minute. On
    // construit maintenant directement les exercices avec emom:true et la durée pré-remplie.
    if (methode.id === 'emom') {
      const cyc = (methode.cycles || [])[cycleIdx || 0];
      const mins = parseInt(((cyc && cyc.sem) || '').match(/(\d+)/)?.[1]) || 10;
      const det = cyc && cyc.details || [];
      const isAlt = /alt/i.test((cyc && cyc.sem) || '');
      const exercices = (isAlt && det.length > 1)
        ? det.map(d => ({ nom:'', series: mins, reps: d.reps || '6-8', emom:true, emomDuree: mins, charge:'', rir:'', repos:'', notes: d.note || '' }))
        : [{ nom:'', series: mins, reps: (det[0] && det[0].reps) || '5-8', emom:true, emomDuree: mins, charge:'', rir:'', repos:'', notes: (det[0] && det[0].note) || '' }];
      const base = {
        nom: 'Séance — ' + methode.nom + (cyc ? ' (' + cyc.sem + ')' : ''),
        datePrevu: localDateStr(),
        methode: methode.nom,
        contexte: '', objectif: methode.description, rpeCible: null,
        notes: (cyc && cyc.note) || '', cycle: (cyc && cyc.label) || '', exercices,
      };
      setNewSeanceBase(base);
      setShowAddSeance(true);
      setShowMethode(null);
      return;
    }
    // Use selected cycle (or first)
    const firstCycle = (methode.cycles || [])[cycleIdx || 0];
    const details = firstCycle?.details;

    // Build exercises — on stocke le % brut (pas un poids figé en kg) : la conversion en kg se
    // fait EN DIRECT à l'affichage à partir du 1RM du joueur qui exécute la séance, ce qui reste
    // correct même si la séance est ensuite dupliquée vers un autre joueur avec un RM différent.
    const isCircuit = methode.format === 'circuit';
    const exercices = (methode.exercices_type || []).map((ex, i) => {
      if (isCircuit && details && details[i]) {
        // Circuit : chaque exercice = SA PROPRE station (mapping 1:1), pas toutes les stations dupliquées
        const d = details[i];
        const repsStr = d.reps || '';
        const seriesMatch = repsStr.match(/^(\d+)\s*[x×]/i);
        const seriesCount = seriesMatch ? parseInt(seriesMatch[1]) : 1;
        return {
          nom: ex,
          series: seriesCount,
          reps: repsStr.replace(/^(\d+)\s*[x×]\s*/i, ''),
          charge: d.pct ? d.pct + '%' : '',
          repos: '30-45s',
          notes: d.note || '',
        };
      }
      if (details && details.length > 0) {
        // One exercise entry per serie detail
        // Méthodes basées sur un Training Max (ex. 5/3/1 : TM = 90 % du 1RM) : les % de la méthode
        // sont des % du TM, convertis ici en % du 1RM (100 % du TM = 90 % du 1RM).
        const tm = methode.tmFactor || 1;
        const cv = v => (v && tm !== 1) ? Math.round(v * tm * 10) / 10 : v;
        const firstDetail = details[0];
        const pct = cv(firstDetail.pct || 0);
        return {
          nom: ex,
          series: details.length,
          reps: details.map(d => d.reps).join(' / '),
          charge: pct ? pct + '%' : '',
          chargeDetails: details.map(d => ({
            serie: d.serie,
            reps: d.reps,
            pct: cv(d.pct),
            amrap: d.amrap || false,
            note: ((d.pct && tm !== 1) ? d.pct + ' % du TM (= ' + cv(d.pct) + ' % du 1RM)' + (d.note ? ' — ' : '') : '') + (d.note || ''),
          })),
          repos: '2min',
          notes: firstCycle.note || '',
        };
      }
      return {
        nom: ex, series: firstCycle?.series || 3,
        reps: firstCycle?.reps || '8-10',
        charge: firstCycle?.pct?.[0] ? firstCycle.pct[0] + '%' : '',
        repos: '2min', notes: '',
      };
    });

    const base = {
      nom: 'Séance — ' + methode.nom + (firstCycle ? ' (' + firstCycle.sem + ')' : ''),
      datePrevu: localDateStr(),
      methode: methode.nom,
      contexte: '',
      objectif: methode.description,
      rpeCible: null,
      notes: methode.assistance ? 'Assistance : ' + methode.assistance : '',
      cycle: firstCycle?.label || '',
      exercices,
    };
    setNewSeanceBase(base);
    setShowAddSeance(true);
    setShowMethode(null);
  }

  const rpeColor = (v) => !v ? 'rgba(255,255,255,.2)' : v <= 3 ? '#4CAF50' : v <= 5 ? '#8BC34A' : v <= 7 ? '#FFB800' : v <= 8 ? '#FF7A00' : '#FF4455';

  // Utiliser la date locale (pas UTC) pour éviter le décalage horaire
  const todayStr = (() => {
    const d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  })();
  const seancesToday      = seances.filter(s => !s.dateFaite && s.datePrevu === todayStr);
  const seancesARattraper = seances.filter(s => !s.dateFaite && s.datePrevu && s.datePrevu < todayStr).sort((a,b)=>a.datePrevu>b.datePrevu?-1:1);
  const seancesNext       = seances.filter(s => !s.dateFaite && s.datePrevu > todayStr).sort((a,b)=>a.datePrevu>b.datePrevu?1:-1);
  const seancesArch       = seances.filter(s => s.dateFaite).sort((a,b)=>a.dateFaite>b.dateFaite?-1:1);

  const SOUS = isCoach
    ? [{ id:'seances', label:'Séances ('+seances.length+')' }, { id:'suivi', label:'Suivi RPE' }, { id:'methodes', label:'Méthodes' }, { id:'echauff', label:'🔥 Échauff.' }, { id:'gainage', label:'🔩 Gainage' }, { id:'mobilite', label:'🧘 Mobilité' }, { id:'rm1', label:'🧮 1RM' }, { id:'muscles', label:'💪 Muscles' }]
    : [{ id:'seances', label:'Planning' }, { id:'suivi', label:'Suivi RPE' }, { id:'gainage', label:'🔩 Gainage' }, { id:'echauff', label:'🔥 Échauff.' }, { id:'mobilite', label:'🧘 Mobilité' }, { id:'rm1', label:'🧮 1RM' }];

  const CAT_COLORS = { 'Force':'#FF4455', 'Force/Volume':'#FF7A00', 'Puissance':'#FFA420', 'Prévention':'#4CAF50', 'Volume':'#7C6FFF' };

  const allMethodes = [...METHODES_HB_TEMPLATES, ...METHODES_MUSCU, ...(db.customMethodes || [])]
  const _tabMethodes = React.createElement(MuscuMethodesTab, { methodes: allMethodes, showMethode, setShowMethode, createFromMethode, addSeance, setShowTesting, selCycleSem, setSelCycleSem, isCoach, db, setDb });

  return _h`<div>
    <!-- Sous-onglets -->
    <div style=${{ overflowX:'auto', marginBottom:16, WebkitOverflowScrolling:'touch',
                   scrollbarWidth:'none', msOverflowStyle:'none' }}>
      <div style=${{ display:'flex', gap:4, background:'rgba(255,255,255,.03)', borderRadius:11, padding:3, minWidth:'max-content' }}>
        ${SOUS.map(s => _h`<button key=${s.id}
          onClick=${() => setSousOnglet(s.id)}
          style=${{ flexShrink:0, background:sousOnglet===s.id?'rgba(255,255,255,.07)':'transparent',
                     border:sousOnglet===s.id?'1px solid rgba(255,255,255,.1)':'1px solid transparent',
                     color:sousOnglet===s.id?'#fff':'rgba(255,255,255,.4)',
                     padding:'8px 10px', borderRadius:9, fontSize:11,
                     fontWeight:sousOnglet===s.id?600:400, cursor:'pointer',
                     whiteSpace:'nowrap' }}
        >${s.label}</button>`)}
      </div>
    </div>

    <!-- ── SÉANCES ── -->
    ${sousOnglet === 'seances' && _h`<div>

      ${!isCoach ? _h`<div>
        <!-- SÉANCE DU JOUR -->
        ${seancesToday.length === 0
          ? _h`<div style=${{ textAlign:'center', padding:'28px 16px', color:'rgba(255,255,255,.3)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)', marginBottom:16 }}>
              <div style=${{ fontSize:28, marginBottom:8 }}>🏃</div>
              <div style=${{ fontWeight:700, marginBottom:4 }}>Pas de séance aujourd'hui</div>
              ${seancesNext.length > 0 ? _h`<div style=${{ fontSize:12, color:'#FFA420', marginTop:6 }}>
                Prochaine séance : ${new Date(seancesNext[0].datePrevu + 'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
              </div>` : null}
            </div>`
          : seancesToday.map(s => {
              const hasRessenti = s.rpeReel != null;
              return _h`<div key=${s.id} style=${{ background:'rgba(255,164,32,.06)', border:'2px solid rgba(255,164,32,.3)', borderRadius:14, padding:'14px 16px', marginBottom:12 }}>
                <div style=${{ fontSize:10, fontWeight:800, color:'#FFA420', letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>⚡ Séance du jour</div>
                <div style=${{ fontSize:16, fontWeight:800, marginBottom:4 }}>${s.nom}</div>
                ${s.objectif ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:10, fontStyle:'italic' }}>${s.objectif}</div>` : null}
                ${s.exercices && s.exercices.length > 0 && _h`<div style=${{ borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:10, marginBottom:10 }}>
                  ${React.createElement(GroupedExercicesRenderer, { exercices: s.exercices, seanceId: s.id, player, seanceNom: s.nom })}
                </div>`}
                <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  ${!s.dateFaite ? _h`<button class="btn btn-primary" style=${{ flex:1, minWidth:140 }}
                    onClick=${() => {
                      // Ouvrir le bilan AVANT de valider — la séance n'est faite qu'après le wellness
                      setSeanceForWellness(s); setShowWellnessAfter(true);
                    }}>
                    ✅ Séance terminée
                  </button>` : _h`<span style=${{ fontSize:12, padding:'8px 14px', borderRadius:9, background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700 }}>
                    ✓ Faite le ${s.dateFaite}
                  </span>`}
                  <button class="btn btn-sm" onClick=${() => setRessentModal(s)}
                    style=${{ background: hasRessenti?'rgba(76,175,80,.1)':'rgba(56,189,248,.1)',
                      border:'1px solid '+(hasRessenti?'rgba(76,175,80,.3)':'rgba(56,189,248,.3)'),
                      color: hasRessenti?'#4CAF50':'#38BDF8', fontWeight:700 }}>
                    ${hasRessenti ? '✓ Ressenti' : '+ Ressenti'}
                  </button>
                </div>
              </div>`;
            })}

        <!-- À RATTRAPER -->
        ${seancesARattraper.length > 0 ? _h`<div style=${{ marginTop:12, marginBottom:16 }}>
          <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style=${{ fontSize:11, fontWeight:800, color:'#FF6B35', letterSpacing:1.5, textTransform:'uppercase' }}>⚠ À rattraper (${seancesARattraper.length})</div>
            <div style=${{ flex:1, height:1, background:'rgba(255,107,53,.2)' }}></div>
          </div>
          ${seancesARattraper.map(s => {
            const isOpen = expandedNext === s.id + '_rattraper';
            const joursRetard = Math.floor((new Date(todayStr) - new Date(s.datePrevu)) / (1000*3600*24));
            return _h`<div key=${s.id} style=${{ background:'rgba(255,107,53,.04)', border:'1px solid rgba(255,107,53,.25)', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
              <div style=${{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
                onClick=${() => setExpandedNext(isOpen ? null : s.id + '_rattraper')}>
                <div style=${{ flex:1, minWidth:0 }}>
                  <div style=${{ fontSize:13, fontWeight:700 }}>${s.nom}</div>
                  <div style=${{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                    <span style=${{ fontSize:10, color:'rgba(255,107,53,.8)' }}>Prévue le ${new Date(s.datePrevu+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                    <span style=${{ fontSize:10, color:'rgba(255,107,53,.6)', fontWeight:700 }}>+${joursRetard} jour${joursRetard>1?'s':''}</span>
                  </div>
                </div>
                <span style=${{ color:'rgba(255,255,255,.3)', fontSize:12, flexShrink:0 }}>${isOpen ? '▲' : '▼'}</span>
              </div>
              ${isOpen ? _h`<div style=${{ borderTop:'1px solid rgba(255,107,53,.15)', padding:'10px 14px' }}>
                ${s.objectif ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:8, fontStyle:'italic' }}>${s.objectif}</div>` : null}
                ${s.rpeCible ? _h`<div style=${{ fontSize:11, color:'#FFA420', marginBottom:8 }}>RPE cible coach : ${s.rpeCible}/10</div>` : null}
                ${React.createElement(GroupedExercicesRenderer, { exercices: s.exercices, seanceId: s.id + '_r', player, seanceNom: s.nom })}
                <div style=${{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
                  <button class="btn btn-primary" style=${{ flex:1, minWidth:140 }}
                    onClick=${() => {
                      setSeanceForWellness(s); setShowWellnessAfter(true);
                    }}>
                    ✅ Faite aujourd'hui
                  </button>
                  <button class="btn btn-sm" onClick=${() => setRessentModal(s)}
                    style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', fontWeight:700 }}>
                    + Ressenti
                  </button>
                </div>
                ${s.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:8, fontStyle:'italic' }}>📝 ${s.notes}</div>` : null}
              </div>` : null}
            </div>`;
          })}
        </div>` : null}

        <!-- PROCHAINES SÉANCES -->
        ${seancesNext.length > 0 ? _h`<div style=${{ marginTop:16 }}>
          <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Prochaines séances</div>
          ${seancesNext.slice(0,5).map(s => {
            const isOpen = closedNext !== s.id;
            return _h`<div key=${s.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
              <!-- Header cliquable -->
              <div style=${{ padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
                onClick=${() => setClosedNext(isOpen ? s.id : null)}>
                <div>
                  <div style=${{ fontSize:13, fontWeight:700 }}>${s.nom}</div>
                  <div style=${{ fontSize:11, color:'#38BDF8', marginTop:2 }}>
                    ${new Date(s.datePrevu + 'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                  </div>
                </div>
                <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style=${{ fontSize:11, color:'rgba(255,255,255,.3)' }}>${(s.exercices||[]).length} ex.</span>
                  <span style=${{ color:'rgba(255,255,255,.3)', fontSize:12 }}>${isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
              <!-- Détail dépliable -->
              ${isOpen ? _h`<div style=${{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'10px 14px' }}>
                ${s.objectif ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:8, fontStyle:'italic' }}>${s.objectif}</div>` : null}
                ${s.rpeCible ? _h`<div style=${{ fontSize:11, color:'#FFA420', marginBottom:8 }}>RPE cible coach : ${s.rpeCible}/10</div>` : null}
                ${React.createElement(GroupedExercicesRenderer, { exercices: s.exercices, seanceId: s.id + '_n', player, seanceNom: s.nom })}
                ${s.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:8, fontStyle:'italic' }}>📝 ${s.notes}</div>` : null}
              </div>` : null}
            </div>`;
          })}
        </div>` : null}

        <!-- HISTORIQUE -->
        ${seancesArch.length > 0 ? _h`<div style=${{ marginTop:16 }}>
          <button onClick=${() => setShowHistorique(h => !h)}
            style=${{ width:'100%', padding:'10px', borderRadius:10, border:'1px solid rgba(255,255,255,.08)',
              background:'rgba(255,255,255,.03)', color:'rgba(255,255,255,.4)', cursor:'pointer',
              fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600 }}>
            ${showHistorique ? '▲' : '▼'} Historique (${seancesArch.length} séance${seancesArch.length>1?'s':''} faite${seancesArch.length>1?'s':''})
          </button>
          ${showHistorique ? seancesArch.map(s => _h`<div key=${s.id} style=${{ background:'rgba(76,175,80,.03)', border:'1px solid rgba(76,175,80,.12)', borderRadius:12, padding:'10px 14px', marginTop:8, opacity:0.7 }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style=${{ fontSize:13, fontWeight:600 }}>${s.nom}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${s.datePrevu || ''}</div>
              </div>
              <span style=${{ fontSize:10, padding:'2px 9px', borderRadius:20, background:'rgba(76,175,80,.15)', color:'#4CAF50', fontWeight:700 }}>✓ Faite le ${s.dateFaite}</span>
            </div>
          </div>`) : null}
        </div>` : null}
      </div>` : null}

      ${isCoach ? _h`<div>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style=${{ fontSize:15, fontWeight:700 }}>Séances de musculation</div>
        <button class="btn btn-primary btn-sm" onClick=${() => { setNewSeanceBase({ nom:'', methode:'', contexte:'', objectif:'', rpeCible:null, notes:'', exercices:[], datePrevu: localDateStr() }); setShowAddSeance(true); }}>+ Nouvelle séance</button>
              <button class="btn btn-sm" onClick=${() => {
                const clubId = player.clubId || 'usm';
                const allProfiles = window.__perfhand_current_profiles || [];
                const targets = allProfiles.filter(p => (p.clubId || 'usm') === clubId && p.id !== player.id);
                if (!targets.length) { alert('Aucun autre joueur dans ce club.'); return; }
                setDupeSelected(targets.map(p => p.id));
                setShowDupePicker(true);
              }}
              style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700 }}>
                📋 Dupliquer vers...
              </button>
              ${showDupePicker && (() => {
                const clubId = player.clubId || 'usm';
                const allProfiles = window.__perfhand_current_profiles || [];
                const targets = allProfiles.filter(p => (p.clubId || 'usm') === clubId && p.id !== player.id);
                return _h`<div style=${{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
                  onClick=${() => setShowDupePicker(false)}>
                  <div style=${{ background:'#161616', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:420, maxHeight:'80vh', display:'flex', flexDirection:'column' }}
                    onClick=${e => e.stopPropagation()}>
                    <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                      <div style=${{ fontSize:13, fontWeight:700, marginBottom:2 }}>Dupliquer vers quels joueurs ?</div>
                      <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${seances.length} séances musculation de ${player.name}</div>
                    </div>
                    <div style=${{ padding:'8px 18px', display:'flex', gap:8 }}>
                      <button class="btn btn-sm" onClick=${() => setDupeSelected(targets.map(p=>p.id))}>Tout cocher</button>
                      <button class="btn btn-sm" onClick=${() => setDupeSelected([])}>Tout décocher</button>
                    </div>
                    <div style=${{ overflowY:'auto', padding:'4px 18px', flex:1 }}>
                      ${targets.map(p => _h`<label key=${p.id} style=${{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <input type="checkbox" checked=${dupeSelected.includes(p.id)}
                          onChange=${() => setDupeSelected(sel => sel.includes(p.id) ? sel.filter(id=>id!==p.id) : [...sel, p.id])}/>
                        <span style=${{ fontSize:12 }}>${p.name}</span>
                      </label>`)}
                    </div>
                    <div style=${{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:8 }}>
                      <button class="btn btn-sm" style=${{ flex:1 }} onClick=${() => setShowDupePicker(false)}>Annuler</button>
                      <button class="btn btn-sm btn-primary" style=${{ flex:1 }}
                        disabled=${dupeSelected.length===0}
                        onClick=${() => {
                          const selTargets = targets.filter(p => dupeSelected.includes(p.id));
                          if (!confirm('Dupliquer les ' + seances.length + ' séances musculation de ' + player.name + ' vers ' + selTargets.length + ' joueur(s) ?\n\nCeci écrasera leurs séances musculation existantes.')) return;
                          const now = Date.now();
                          const newSeances = seances.map((s, i) => ({ ...s, id: now + i }));
                          selTargets.forEach(p => {
                            if (window.__perfhand_db) {
                              window.__perfhand_db.ref('perfhand/playerProfiles/' + p.id + '/muscuSeances').set(newSeances);
                            }
                          });
                          setDb(d => ({
                            ...d,
                            playerProfiles: (d.playerProfiles||[]).map(p =>
                              dupeSelected.includes(p.id) ? { ...p, muscuSeances: newSeances } : p
                            )
                          }));
                          setShowDupePicker(false);
                          alert('✅ ' + seances.length + ' séances musculation dupliquées vers ' + selTargets.length + ' joueur(s) !');
                        }}>
                        Dupliquer vers ${dupeSelected.length} joueur(s)
                      </button>
                    </div>
                  </div>
                </div>`;
              })()}
      </div>

      ${dupeSingleSeance && (() => {
        const clubId = player.clubId || 'usm';
        const allProfiles = window.__perfhand_current_profiles || [];
        const others = allProfiles.filter(p => (p.clubId || 'usm') === clubId && p.id !== player.id);
        // Le joueur lui-même est proposé en premier — pour recopier la séance (ex: sur une autre
        // date) et juste retoucher quelques détails, plutôt que de la refaire de zéro.
        const targets = [player, ...others];
        return _h`<div style=${{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick=${() => setDupeSingleSeance(null)}>
          <div style=${{ background:'#161616', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:420, maxHeight:'80vh', display:'flex', flexDirection:'column' }}
            onClick=${e => e.stopPropagation()}>
            <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
              <div style=${{ fontSize:13, fontWeight:700, marginBottom:2 }}>📋 Dupliquer "${dupeSingleSeance.nom}"</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>S'ajoute aux séances existantes (rien n'est écrasé) — pour ${player.name} lui-même comme pour un autre joueur. Les charges en % s'adaptent automatiquement au 1RM de chacun.</div>
            </div>
            <div style=${{ padding:'8px 18px', display:'flex', gap:8 }}>
              <button class="btn btn-sm" onClick=${() => setDupeSelected(targets.map(p=>p.id))}>Tout cocher</button>
              <button class="btn btn-sm" onClick=${() => setDupeSelected([])}>Tout décocher</button>
            </div>
            <div style=${{ overflowY:'auto', padding:'4px 18px', flex:1 }}>
              ${others.length === 0 ? _h`<div style=${{ padding:'8px 0 4px', textAlign:'center', color:'rgba(255,255,255,.3)', fontSize:11 }}>Aucun autre joueur dans ce club — tu peux quand même recopier la séance ci-dessous.</div>` : null}
              ${targets.map(p => _h`<label key=${p.id} style=${{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                <input type="checkbox" checked=${dupeSelected.includes(p.id)}
                  onChange=${() => setDupeSelected(sel => sel.includes(p.id) ? sel.filter(id=>id!==p.id) : [...sel, p.id])}/>
                <span style=${{ fontSize:12 }}>${p.name}${p.id === player.id ? ' (lui-même — nouvelle copie)' : ''}</span>
              </label>`)}
            </div>
            <div style=${{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:8 }}>
              <button class="btn btn-sm" style=${{ flex:1 }} onClick=${() => setDupeSingleSeance(null)}>Annuler</button>
              <button class="btn btn-sm btn-primary" style=${{ flex:1 }}
                disabled=${dupeSelected.length===0}
                onClick=${() => {
                  const selTargets = targets.filter(p => dupeSelected.includes(p.id));
                  const now = Date.now();
                  let safeSeance; try { safeSeance = JSON.parse(JSON.stringify(dupeSingleSeance)); } catch(e) { safeSeance = dupeSingleSeance; }
                  delete safeSeance.dateFaite; delete safeSeance.rpeReel; delete safeSeance.fatigue;
                  setDb(d => {
                    const nextProfiles = (d.playerProfiles||[]).map(p => {
                      if (!dupeSelected.includes(p.id)) return p;
                      const newSeance = { ...safeSeance, id: now + '_' + p.id };
                      const newList = [...(p.muscuSeances||[]), newSeance];
                      if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/playerProfiles/' + p.id + '/muscuSeances').set(newList);
                      return { ...p, muscuSeances: newList };
                    });
                    return { ...d, playerProfiles: nextProfiles };
                  });
                  setDupeSingleSeance(null);
                  alert('✅ Séance "' + safeSeance.nom + '" dupliquée vers ' + selTargets.length + ' joueur(s) — charges adaptées à leur propre RM.');
                }}>
                Dupliquer vers ${dupeSelected.length} joueur(s)
              </button>
            </div>
          </div>
        </div>`;
      })()}

      ${seances.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
            Aucune séance planifiée.
            <br/><button class="btn btn-sm" style=${{ marginTop:12 }} onClick=${() => setSousOnglet('methodes')}>Choisir une méthode →</button>
          </div>`
        : (() => {
          const today = localDateStr();
          const sorted = [...seances].sort((a,b) => {
            const da = a.datePrevu || '9999';
            const db = b.datePrevu || '9999';
            return da < db ? -1 : da > db ? 1 : 0;
          });

          // ── GROUPER PAR SEMAINE ──────────────────────────────────────────
          function getMonday(ds) {
            const d = new Date(ds + 'T12:00:00');
            const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
            const m = new Date(d); m.setDate(d.getDate() + diff);
            return m.toISOString().slice(0,10);
          }
          const sansDates = sorted.filter(s => !s.datePrevu);
          const avecDates = sorted.filter(s => s.datePrevu);
          const bySem = {};
          avecDates.forEach(s => {
            const m = getMonday(s.datePrevu);
            if (!bySem[m]) bySem[m] = [];
            bySem[m].push(s);
          });
          const semKeys = Object.keys(bySem).sort();
          const firstMon = semKeys[0] || null;

          function semNum(mon) {
            if (!firstMon) return 1;
            return Math.round((new Date(mon) - new Date(firstMon)) / (7*24*3600*1000)) + 1;
          }

          // Filtre semaine actif
          const displayedKeys = filteredSem ? semKeys.filter(m => m === filteredSem) : semKeys;
          const displayedSansDates = filteredSem ? [] : sansDates;

          const renderSeance = s => {
          const hasRessenti = s.rpeReel != null;
          const delta = s.rpeCible && s.rpeReel ? s.rpeReel - s.rpeCible : null;
          const deltaColor = delta === null ? 'rgba(255,255,255,.3)' : Math.abs(delta) <= 1 ? '#4CAF50' : Math.abs(delta) <= 2 ? '#FFB800' : '#FF4455';
          const isToday = s.datePrevu === today;
          const isPast  = s.datePrevu && s.datePrevu < today;
          const isFaite = !!s.dateFaite;
          const cardBorder = isFaite ? 'rgba(76,175,80,.25)' : isToday ? 'rgba(255,164,32,.4)' : isPast ? 'rgba(255,68,85,.2)' : 'rgba(255,255,255,.07)';
          const cardBg = isFaite ? 'rgba(76,175,80,.03)' : isToday ? 'rgba(255,164,32,.04)' : 'rgba(255,255,255,.02)';
          // Bandeau « JOUR » : lisible au premier coup d'œil (jour de la semaine + date + statut)
          const jourBandeau = (() => {
            if (!s.datePrevu) return _h`<div style=${{ margin:'-14px -16px 12px', padding:'8px 16px', background:'rgba(255,68,85,.1)', borderBottom:'1px solid rgba(255,68,85,.25)', borderRadius:'14px 14px 0 0', fontSize:12, fontWeight:800, color:'#FF6B6B', letterSpacing:1 }}>📅 SANS DATE — à planifier</div>`;
            const d = new Date(s.datePrevu + 'T12:00:00');
            const jour = d.toLocaleDateString('fr-FR', { weekday:'long' }).toUpperCase();
            const dateTxt = d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' }).toUpperCase().replace('.', '');
            const diff = Math.round((d - new Date(today + 'T12:00:00')) / 86400000);
            const rel = isFaite ? '✓ FAITE' : isToday ? "⚡ AUJOURD'HUI" : diff === 1 ? 'DEMAIN' : diff > 1 ? 'DANS ' + diff + ' J' : diff === -1 ? '⚠ HIER — NON FAITE' : '⚠ NON FAITE (il y a ' + (-diff) + ' j)';
            const col = isFaite ? '#4CAF50' : isToday ? '#FFA420' : isPast ? '#FF6B6B' : '#38BDF8';
            const bg = isFaite ? 'rgba(76,175,80,.12)' : isToday ? 'rgba(255,164,32,.16)' : isPast ? 'rgba(255,68,85,.12)' : 'rgba(56,189,248,.10)';
            return _h`<div style=${{ margin:'-14px -16px 12px', padding:'9px 16px', background:bg, borderBottom:'2px solid '+col, borderRadius:'14px 14px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <div style=${{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span style=${{ fontSize:18, fontWeight:900, color:col, letterSpacing:1.5 }}>${jour}</span>
                <span style=${{ fontSize:14, fontWeight:800, color:'#fff' }}>${dateTxt}</span>
              </div>
              <span style=${{ fontSize:11, fontWeight:800, color:col, letterSpacing:.8 }}>${rel}</span>
            </div>`;
          })();
          return _h`<div key=${s.id} style=${{
            background:cardBg, border:'1px solid '+cardBorder,
            borderRadius:14, padding:'14px 16px', marginBottom:10,
            opacity: isFaite ? 0.6 : 1, overflow:'hidden'
          }}>
            ${jourBandeau}
            <!-- Header séance -->
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div>
                <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                  ${s.seqNum ? _h`<div style=${{ width:24, height:24, borderRadius:6, background:'rgba(255,164,32,.2)', border:'1px solid rgba(255,164,32,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#FFA420', flexShrink:0 }}>${s.seqNum}</div>` : null}
                  <div style=${{ fontSize:14, fontWeight:700 }}>${s.nom}</div>
                </div>
                <div style=${{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                  ${s.methode ? _h`<span style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(255,164,32,.15)', color:'#FFA420', fontWeight:700 }}>${s.methode}</span>` : null}
                  ${s.contexte ? _h`<span style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.5)' }}>${s.contexte}</span>` : null}
                </div>
              </div>
              <div style=${{ display:'flex', gap:6 }}>
                ${isCoach ? _h`<div style=${{ display:'flex', gap:6, alignItems:'center' }}>
                  ${s.dateFaite ? _h`<span style=${{ fontSize:10, padding:'3px 9px', borderRadius:20, background:'rgba(76,175,80,.12)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700, whiteSpace:'nowrap' }}>✓ ${s.dateFaite}</span>` : null}
                  ${s.dateFaite ? _h`<button class="btn btn-sm" title="Annuler la validation — le joueur pourra refaire cette séance"
                    onClick=${() => {
                      if (!confirm('Annuler la validation de cette séance ? Elle redeviendra "à faire" pour ' + player.name + ' et son bilan/ressenti sera effacé.')) return;
                      // Remise à zéro complète de tout ce qui est lié à la validation, pour que la séance
                      // redevienne exactement comme avant que le joueur ne la valide par erreur.
                      updateSeance(s.id, {
                        dateFaite: null, rpeReel: null, fatigue: null, notesJoueur: null,
                        energie: null, sommeil: null, douleurs: null, humeur: null, stress: null, wellness: null
                      });
                    }}
                    style=${{ background:'#FFA420', border:'1px solid #FFA420', color:'#000', fontWeight:800, fontSize:11, padding:'4px 8px', whiteSpace:'nowrap' }}>↺ Annuler</button>` : null}
                  <button class="btn btn-sm" title="Dupliquer cette séance vers d'autres joueurs (charges adaptées à leur RM)"
                    onClick=${() => { setDupeSingleSeance(s); setDupeSelected([]); }}
                    style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50' }}>📋</button>
                  <button class="btn btn-sm" onClick=${() => setEditSeance(s)} style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>✏️</button>
                </div>` : null}

                ${isCoach ? _h`<button class="btn btn-sm btn-danger" onClick=${() => deleteSeance(s.id)}>×</button>` : null}
              </div>
            </div>

            ${s.objectif ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:10, fontStyle:'italic' }}>${s.objectif}</div>` : null}

            <!-- RPE cible + réel côte à côte -->
            <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:10, padding:'10px 12px' }}>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>RPE cible (coach)</div>
                <div style=${{ fontSize:24, fontWeight:800, color:rpeColor(s.rpeCible), fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>
                  ${s.rpeCible ? s.rpeCible + '/10' : '—'}
                </div>
              </div>
              <div style=${{ background: hasRessenti ? 'rgba(56,189,248,.06)' : 'rgba(255,255,255,.03)', border:'1px solid '+(hasRessenti?'rgba(56,189,248,.2)':'rgba(255,255,255,.07)'), borderRadius:10, padding:'10px 12px' }}>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>RPE réel (joueur)</div>
                <div style=${{ display:'flex', alignItems:'baseline', gap:8 }}>
                  <div style=${{ fontSize:24, fontWeight:800, color:rpeColor(s.rpeReel), fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>
                    ${s.rpeReel ? s.rpeReel + '/10' : '—'}
                  </div>
                  ${delta !== null ? _h`<div style=${{ fontSize:13, fontWeight:700, color:deltaColor }}>
                    ${delta > 0 ? '+' : ''}${delta}
                  </div>` : null}
                </div>
              </div>
            </div>

            <!-- Fatigue joueur -->
            ${s.fatigue ? _h`<div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>Fatigue joueur :</div>
              <div style=${{ display:'flex', gap:3 }}>
                ${[1,2,3,4,5].map(v => _h`<div key=${v} style=${{ width:14, height:14, borderRadius:3, background:v<=s.fatigue?(s.fatigue>=4?'#FF4455':s.fatigue>=3?'#FFB800':'#4CAF50'):'rgba(255,255,255,.08)' }}></div>`)}
              </div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>${s.fatigue}/5</div>
            </div>` : null}

            <!-- Exercices avec chrono -->
            ${s.exercices && s.exercices.length > 0 && _h`<div style=${{ borderTop:'1px solid rgba(255,255,255,.05)', paddingTop:10 }}>
              ${isCoach
                ? _h`<div>
                  ${(() => {
                    let nbS = 0, ton = 0;
                    s.exercices.forEach(e => { try { const r0 = rpExoSets(e, player, rpD(s.datePrevu) || localDateStr()); nbS += r0.sets.length; ton += r0.sets.reduce((a, x) => (x.kg != null && x.reps != null) ? a + x.kg * x.reps : a, 0); } catch (er) {} });
                    const nbBlocs = s.exercices.filter(e => e.blocNom != null).length;
                    const chip2 = (t) => _h`<span style=${{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.85)' }}>${t}</span>`;
                    return _h`<div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:10, padding:'9px 12px', marginBottom:6 }}>
                      <div style=${{ fontSize:10, fontWeight:800, color:'#38BDF8', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>📋 En un coup d'œil</div>
                      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        ${chip2(s.exercices.length + ' exercice' + (s.exercices.length > 1 ? 's' : ''))}
                        ${nbBlocs ? chip2(nbBlocs + ' bloc' + (nbBlocs > 1 ? 's' : '')) : null}
                        ${chip2(nbS + ' séries au total')}
                        ${ton > 0 ? chip2('≈ ' + Math.round(ton).toLocaleString('fr-FR') + ' kg soulevés') : null}
                        ${s.rpeCible ? chip2('effort visé : ' + s.rpeCible + '/10') : null}
                      </div>
                      <div style=${{ fontSize:10.5, color:'rgba(255,255,255,.4)', marginTop:6, lineHeight:1.45 }}>Les kg sont calculés automatiquement : % × 1RM actuel du joueur (1RM = charge maximale qu'il peut soulever 1 fois). Chaque exercice détaille ci-dessous le poids de chaque série.</div>
                    </div>`;
                  })()}
                  ${s.exercices.map((ex0, i) => { const ex = liveCharge(ex0); const chargeHint = chargeHintRM(ex0, player); return [blocHeaderEl(s.exercices, i, 'bh'+i), _h`<div key=${i} style=${{ padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
                    <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
                      ${imageExoPour(ex) ? _h`<${ZoomableImage} src=${imageExoPour(ex)} alt=${ex.nom}
                        style=${{ width:44, height:44, objectFit:'cover', borderRadius:7,
                          border:'1px solid rgba(255,255,255,.1)', flexShrink:0 }}
                        onError=${e => e.target.style.display='none'} />` : null}
                      <div style=${{ flex:1 }}>
                        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                          <div style=${{ fontSize:13, fontWeight:700 }}>${ex.nom}</div>
                          <span style=${{ fontSize:20, lineHeight:1.1, color:'#FFA420', fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", flexShrink:0, whiteSpace:'nowrap', background:'rgba(255,164,32,.12)', border:'1px solid rgba(255,164,32,.3)', borderRadius:8, padding:'3px 10px', letterSpacing:.3 }}>${seriesRepsLabel(ex).main}</span>
                        </div>
                        ${(() => {
                          const rows = detailSeriesCoach(ex, player);
                          const uniforme = rows.length > 0 && rows.every(r => r.charge === rows[0].charge && r.reps === rows[0].reps && !r.amrap);
                          return _h`<div>
                            <div style=${{ fontSize:12.5, color:'#fff', fontWeight:600, marginTop:4, lineHeight:1.4 }}>${enClairExo(ex, rows)}</div>
                            ${chargeHint && chargeHint.ok ? _h`<div style=${{ fontSize:10.5, color:'rgba(255,255,255,.4)', marginTop:1 }}>${chargeHint.pct} % de son 1RM ${chargeHint.mvtLabel} (${String(getPlayerRMValue(detectMouvementRM(ex.nom, player) || (parsePctPC(ex.charge) != null ? 'poids_corps' : null), player) || '').replace('.', ',')} kg)</div>` : null}
                            ${rows.length > 0 && rows.some(r => r.charge) ? _h`<div style=${{ marginTop:6, borderRadius:8, overflow:'hidden', border:'1px solid rgba(56,189,248,.18)' }}>
                              <div style=${{ display:'grid', gridTemplateColumns:'42px 1fr 1.3fr 58px', gap:6, padding:'4px 8px', background:'rgba(56,189,248,.10)', fontSize:9, fontWeight:800, letterSpacing:.8, color:'rgba(255,255,255,.5)', textTransform:'uppercase' }}>
                                <span>Série</span><span>Reps</span><span>Poids</span><span style=${{ textAlign:'right' }}>% 1RM</span>
                              </div>
                              ${rows.map((r, ri) => _h`<div key=${ri} style=${{ display:'grid', gridTemplateColumns:'42px 1fr 1.3fr 58px', gap:6, padding:'5px 8px', alignItems:'baseline', borderTop:'1px solid rgba(255,255,255,.05)', background: r.amrap ? 'rgba(255,164,32,.08)' : (ri % 2 ? 'rgba(255,255,255,.02)' : 'transparent') }}>
                                <span style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.55)' }}>S${r.n}</span>
                                <span style=${{ fontSize:14, fontWeight:800 }}>${r.reps}${r.amrap ? ' 🔥' : ''}</span>
                                <span style=${{ fontSize:15, fontWeight:800, color:'#38BDF8' }}>${r.charge || '—'}</span>
                                <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)', textAlign:'right' }}>${r.pct ? r.pct + ' %' : ''}</span>
                                ${r.note ? _h`<span style=${{ gridColumn:'1 / -1', fontSize:10.5, color:'rgba(255,255,255,.45)', fontStyle:'italic' }}>${r.amrap ? 'AMRAP = autant de répétitions que possible. ' : ''}${r.note}</span>` : (r.amrap ? _h`<span style=${{ gridColumn:'1 / -1', fontSize:10.5, color:'rgba(255,164,32,.8)', fontStyle:'italic' }}>AMRAP = autant de répétitions propres que possible</span>` : null)}
                              </div>`)}
                            </div>` : null}
                          </div>`;
                        })()}
                        ${ex.notes ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:5, lineHeight:1.5, background:'rgba(255,164,32,.06)', borderLeft:'3px solid rgba(255,164,32,.5)', borderRadius:6, padding:'5px 9px', whiteSpace:'pre-wrap' }}>💡 ${ex.notes}</div>` : null}
                      </div>
                    </div>
                  </div>`]; })}
                </div>`
                : _h`<div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:8, letterSpacing:1, textTransform:'uppercase' }}>
                    Clique sur chaque numéro pour valider la série → le chrono de repos démarre
                  </div>
                  ${React.createElement(GroupedExercicesRenderer, { exercices: s.exercices, seanceId: s.id, player, seanceNom: s.nom })}
                </div>`
              }
            </div>`}

            <!-- Bilan wellness du joueur (visible côté coach) -->
            ${(s.dateFaite && (s.rpeReel || s.fatigue || s.notesJoueur)) ? _h`<div style=${{ marginTop:10, background:'rgba(56,189,248,.05)', border:'1px solid rgba(56,189,248,.15)', borderRadius:10, padding:'10px 12px' }}>
              <div style=${{ fontSize:10, fontWeight:800, color:'#38BDF8', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>📊 Bilan du joueur</div>
              <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
                ${s.rpeReel ? _h`<span style=${{ fontSize:11, background:'rgba(255,164,32,.12)', color:'#FFA420', borderRadius:6, padding:'3px 8px', fontWeight:700 }}>RPE réel ${s.rpeReel}/10</span>` : null}
                ${s.fatigue ? _h`<span style=${{ fontSize:11, background:'rgba(255,122,0,.1)', color:'#FF7A00', borderRadius:6, padding:'3px 8px' }}>Fatigue ${s.fatigue}/5</span>` : null}
                ${s.energie ? _h`<span style=${{ fontSize:11, background:'rgba(76,175,80,.1)', color:'#4CAF50', borderRadius:6, padding:'3px 8px' }}>Énergie ${s.energie}/5</span>` : null}
                ${s.sommeil ? _h`<span style=${{ fontSize:11, background:'rgba(100,150,255,.1)', color:'#6496FF', borderRadius:6, padding:'3px 8px' }}>Sommeil ${s.sommeil}/5</span>` : null}
                ${s.douleurs ? _h`<span style=${{ fontSize:11, background:'rgba(255,68,85,.1)', color:'#FF4455', borderRadius:6, padding:'3px 8px' }}>Douleurs ${s.douleurs}/5</span>` : null}
                ${s.humeur ? _h`<span style=${{ fontSize:11, background:'rgba(124,111,255,.1)', color:'#7C6FFF', borderRadius:6, padding:'3px 8px' }}>Humeur ${s.humeur}/5</span>` : null}
                ${s.stress ? _h`<span style=${{ fontSize:11, background:'rgba(255,184,0,.1)', color:'#FFB800', borderRadius:6, padding:'3px 8px' }}>Stress ${s.stress}/5</span>` : null}
              </div>
              ${s.notesJoueur ? _h`<div style=${{ fontSize:12, color:'#38BDF8', marginTop:8, fontStyle:'italic', lineHeight:1.4 }}>💬 « ${s.notesJoueur} »</div>` : null}
            </div>` : null}
            ${s.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4, fontStyle:'italic' }}>📝 ${s.notes}</div>` : null}
          </div>`;
          };

          return _h`<div>
            <!-- Filtre semaines -->
            ${semKeys.length > 1 ? _h`<div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
              <button
                onClick=${() => setFilteredSem(null)}
                style=${{
                  padding:'5px 12px', borderRadius:20, border: filteredSem===null ? '2px solid #FFA420' : '1px solid rgba(255,255,255,.12)',
                  background: filteredSem===null ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)',
                  color: filteredSem===null ? '#FFA420' : 'rgba(255,255,255,.4)',
                  fontWeight: filteredSem===null ? 800 : 500, fontSize:11, cursor:'pointer', fontFamily:'Inter,sans-serif'
                }}>
                Toutes (${semKeys.length})
              </button>
              ${semKeys.map(mon => {
                const sNum = semNum(mon);
                const venDt = new Date(mon+'T12:00:00'); venDt.setDate(venDt.getDate()+6);
                const isCurr = today >= mon && today <= venDt.toISOString().slice(0,10);
                const ok = bySem[mon].filter(s => s.dateFaite).length;
                const tot = bySem[mon].length;
                const isSel = filteredSem === mon;
                return _h`<button key=${mon}
                  onClick=${() => setFilteredSem(isSel ? null : mon)}
                  style=${{
                    padding:'5px 12px', borderRadius:20,
                    border: isSel ? '2px solid '+(isCurr?'#FFA420':'#38BDF8') : '1px solid rgba(255,255,255,.1)',
                    background: isSel ? (isCurr?'rgba(255,164,32,.15)':'rgba(56,189,248,.1)') : 'rgba(255,255,255,.03)',
                    color: isSel ? (isCurr?'#FFA420':'#38BDF8') : 'rgba(255,255,255,.4)',
                    fontWeight: isSel ? 800 : 500, fontSize:11, cursor:'pointer', fontFamily:'Inter,sans-serif',
                    display:'flex', alignItems:'center', gap:5
                  }}>
                  S${sNum}${isCurr ? ' ⚡' : ''}
                  <span style=${{ fontSize:9, opacity:.7 }}>${ok}/${tot}</span>
                </button>`;
              })}
            </div>` : null}

            <!-- Sans date -->
            ${displayedSansDates.length > 0 ? _h`<div style=${{ marginBottom:16 }}>
              <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style=${{ fontSize:10, fontWeight:800, color:'rgba(255,68,85,.7)', textTransform:'uppercase', letterSpacing:1.5 }}>📋 Non planifiées (${displayedSansDates.length})</div>
                <div style=${{ flex:1, height:1, background:'rgba(255,68,85,.15)' }}></div>
                <button class="btn btn-sm" style=${{ fontSize:9, padding:'2px 8px', background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.2)', color:'rgba(255,68,85,.7)' }}
                  onClick=${() => {}}>Ajouter des dates →</button>
              </div>
              ${displayedSansDates.map(s => renderSeance(s))}
            </div>` : null}

            <!-- Par semaine -->
            ${displayedKeys.map(mon => {
              const ss  = bySem[mon];
              const ok  = ss.filter(s => s.dateFaite).length;
              const tot = ss.length;
              const pct = Math.round(ok / tot * 100);
              const venDt  = new Date(mon + 'T12:00:00'); venDt.setDate(venDt.getDate() + 6);
              const venStr = venDt.toISOString().slice(0,10);
              const isCurr = today >= mon && today <= venStr;
              const isPast = venStr < today;
              const hCol   = isCurr ? '#FFA420' : isPast ? 'rgba(255,255,255,.3)' : '#38BDF8';
              const bgCol  = isCurr ? 'rgba(255,164,32,.05)' : 'rgba(255,255,255,.02)';
              const bCol   = isCurr ? 'rgba(255,164,32,.25)' : isPast ? 'rgba(255,255,255,.07)' : 'rgba(56,189,248,.15)';
              const lunLbl = new Date(mon+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
              const venLbl = venDt.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
              return _h`<div key=${mon} style=${{ marginBottom:16 }}>
                <!-- Header semaine -->
                <div style=${{ background:bgCol, border:'1px solid '+bCol, borderRadius:12, padding:'10px 14px', marginBottom:8 }}>
                  <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style=${{ fontSize:14, fontWeight:800, color:hCol, fontFamily:"'Barlow Condensed',sans-serif" }}>S${semNum(mon)} ${isCurr ? '⚡' : ''}</span>
                      <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${lunLbl} → ${venLbl}</span>
                    </div>
                    <span style=${{ fontSize:11, fontWeight:700, color: ok===tot ? '#4CAF50' : hCol }}>
                      ${ok}/${tot}${ok===tot ? ' ✓' : ''}
                    </span>
                  </div>
                  <div style=${{ height:3, background:'rgba(255,255,255,.07)', borderRadius:3, overflow:'hidden' }}>
                    <div style=${{ height:'100%', width:pct+'%', background: ok===tot ? '#4CAF50' : hCol, borderRadius:3 }}></div>
                  </div>
                </div>
                <!-- Séances -->
                ${ss.map(s => renderSeance(s))}
              </div>`;
            })}
          </div>`;
        })()
      }
      </div>` : null}
    </div>`}

    <!-- ── SUIVI RPE ── -->
    ${sousOnglet === 'suivi' && _h`<div>
      <div style=${{ fontSize:15, fontWeight:700, marginBottom:14 }}>Suivi RPE — Intensité voulue vs réelle</div>
      <${SuiviRpeView} seances=${seances} />
    </div>`}

    <!-- ── MÉTHODES (coach seulement) ── -->
    ${sousOnglet === 'methodes' && _tabMethodes}
    ${sousOnglet === 'echauff' && React.createElement(EchauffMusculationView, { player, isCoach })}
    ${sousOnglet === 'gainage' && React.createElement(GainageView, { player, isCoach, db, setDb })}
    ${sousOnglet === 'mobilite' && React.createElement(MobiliteView, { player, isCoach, db, setDb })}
      ${sousOnglet === 'rm1' && React.createElement(RMCalculator, { player: player, setDb: setDb, allPlayers: [...(db.playerProfiles||[]), ...(db.playersPerso||[])] })}
    ${showAddSeance && _h`<${MuscuSeanceEditor}
      seance=${newSeanceBase || { nom:'', methode:'', contexte:'', objectif:'', rpeCible:null, notes:'', exercices:[] }}
      player=${livePlayer}
      onSave=${addSeance}
      onClose=${() => { setShowAddSeance(false); setNewSeanceBase(null); }}
    />`}
    ${editSeance && _h`<${MuscuSeanceEditor}
      seance=${editSeance}
      player=${livePlayer}
      onSave=${(upd) => updateSeance(editSeance.id, upd)}
      onClose=${() => setEditSeance(null)}
    />`}
    ${ressentModal && _h`<${MuscuRessentModal}
      seance=${ressentModal}
      onSave=${(ressenti) => {
          saveRessenti(ressentModal.id, ressenti);
          notifRessentRPE(player.name, ressentModal.nom, ressentModal.rpeCible, ressenti.rpeReel, ressenti.fatigue);
        }}
      onClose=${() => setRessentModal(null)}
    />`}
    ${showTesting && _h`<${TestingCalculator}
      player=${player}
      methode=${showTesting}
      onCreateSeance=${addSeance}
      onClose=${() => setShowTesting(null)}
    />`}
    <!-- ── MUSCLES ── -->
    ${sousOnglet === 'muscles' && _h`<div>
      ${(() => {
        // Mapping exercice -> groupes musculaires
        const GROUPES_MAP = {
          // Quadriceps
          'squat': 'Quadriceps', 'fente': 'Quadriceps', 'leg press': 'Quadriceps', 'press': 'Quadriceps',
          'gobelet': 'Quadriceps', 'bulgare': 'Quadriceps', 'sissy': 'Quadriceps', 'chaise': 'Quadriceps',
          'nordic curl': 'Ischio-jambiers', 'ischio': 'Ischio-jambiers', 'deadlift': 'Ischio-jambiers',
          'romanian': 'Ischio-jambiers', 'leg curl': 'Ischio-jambiers', 'bridge': 'Fessiers',
          'hip thrust': 'Fessiers', 'fessier': 'Fessiers', 'glute': 'Fessiers',
          'mollet': 'Mollets', 'gastro': 'Mollets', 'calf': 'Mollets', 'plantaire': 'Mollets',
          'tirage': 'Dos', 'rowing': 'Dos', 'row': 'Dos', 'pull': 'Dos', 'traction': 'Dos',
          'grand dorsal': 'Dos', 'rhombo': 'Dos',
          'développé': 'Pectoraux', 'bench': 'Pectoraux', 'pec': 'Pectoraux', 'pecto': 'Pectoraux',
          'pompe': 'Pectoraux', 'push up': 'Pectoraux', 'dips': 'Pectoraux',
          'overhead': 'Épaules', 'militaire': 'Épaules', 'élévation': 'Épaules', 'deltoïde': 'Épaules',
          'face pull': 'Épaules', 'rotation': 'Épaules', 'coiffe': 'Épaules', 'épaule': 'Épaules',
          'serratus': 'Épaules', 'scapul': 'Épaules', 'trapèze': 'Épaules',
          'curl': 'Biceps', 'bicep': 'Biceps',
          'tricep': 'Triceps', 'extension': 'Triceps', 'dips tricep': 'Triceps',
          'gainage': 'Core', 'planche': 'Core', 'abdos': 'Core', 'core': 'Core',
          'rotation tronc': 'Core', 'landmine': 'Core', 'med ball': 'Core',
          'cheville': 'Cheville', 'propriocep': 'Cheville', 'alphabet': 'Cheville',
          'pendule': 'Épaules', 'isométrie': 'Épaules', 'prone': 'Épaules', 'ytw': 'Épaules',
        };

        const GROUPE_COLORS = {
          'Quadriceps': '#FF4455', 'Ischio-jambiers': '#FF7A00', 'Fessiers': '#FFB800',
          'Mollets': '#4CAF50', 'Dos': '#38BDF8', 'Pectoraux': '#7C6FFF',
          'Épaules': '#FFA420', 'Biceps': '#4CAF50', 'Triceps': '#8BC34A',
          'Core': '#FF6B9D', 'Cheville': '#00BCD4',
        };

        function detectGroupe(nomExo) {
          const nom = nomExo.toLowerCase();
          for (const [key, groupe] of Object.entries(GROUPES_MAP)) {
            if (nom.includes(key)) return groupe;
          }
          return null;
        }

        // Compter fréquence par groupe musculaire (nb de fois l'exo apparaît dans les séances)
        const compteur = {};
        const parSeance = {};

        seances.forEach(s => {
          const groupesSeance = new Set();
          (s.exercices || []).forEach(ex => {
            const g = detectGroupe(ex.nom || '');
            if (g) {
              compteur[g] = (compteur[g] || 0) + 1;
              groupesSeance.add(g);
            }
          });
          groupesSeance.forEach(g => {
            parSeance[g] = (parSeance[g] || 0) + 1;
          });
        });

        const sorted = Object.entries(compteur).sort((a,b) => b[1]-a[1]);
        const maxVal = sorted.length > 0 ? sorted[0][1] : 1;
        const totalExos = Object.values(compteur).reduce((a,b)=>a+b, 0);

        if (sorted.length === 0) {
          return _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
            Aucune donnée — crée des séances avec des exercices nommés pour voir l'analyse.
          </div>`;
        }

        return _h`<div>
          <!-- Header -->
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
            <div style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', borderRadius:12, padding:'14px', textAlign:'center' }}>
              <div style=${{ fontSize:26, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${sorted.length}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Groupes musculaires</div>
            </div>
            <div style=${{ background:'rgba(56,189,248,.08)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'14px', textAlign:'center' }}>
              <div style=${{ fontSize:26, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${totalExos}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Exercices total</div>
            </div>
          </div>

          <!-- Titre -->
          <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:14 }}>
            Fréquence par groupe musculaire — ${seances.length} séance${seances.length>1?'s':''}
          </div>

          <!-- Barres -->
          ${sorted.map(([groupe, count], idx) => {
            const color = GROUPE_COLORS[groupe] || '#FFA420';
            const pct = count / maxVal;
            const seanceCount = parSeance[groupe] || 0;
            return _h`<div key=${idx} style=${{ marginBottom:12 }}>
              <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style=${{ width:10, height:10, borderRadius:3, background:color, flexShrink:0 }}></div>
                  <div style=${{ fontSize:13, fontWeight:700 }}>${groupe}</div>
                </div>
                <div style=${{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${seanceCount} séance${seanceCount>1?'s':''}</span>
                  <span style=${{ fontSize:16, fontWeight:800, color:color, fontFamily:"'Barlow Condensed',sans-serif", minWidth:30, textAlign:'right' }}>${count}×</span>
                </div>
              </div>
              <div style=${{ height:10, background:'rgba(255,255,255,.06)', borderRadius:5, overflow:'hidden' }}>
                <div style=${{ height:'100%', width:(pct*100)+'%', background:color, borderRadius:5,
                  opacity: 0.85, transition:'width .4s ease' }}></div>
              </div>
            </div>`;
          })}

          <!-- Légende -->
          <div style=${{ marginTop:20, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', fontSize:11, color:'rgba(255,255,255,.4)', lineHeight:1.6 }}>
            💡 Basé sur les noms d'exercices. Le nombre indique combien de fois un groupe est sollicité sur l'ensemble des séances programmées.
            ${sorted[0] ? _h`<br/>🏆 Groupe le plus travaillé : <b style=${{ color:GROUPE_COLORS[sorted[0][0]]||'#FFA420' }}>${sorted[0][0]}</b> (${sorted[0][1]}×)` : null}
          </div>
        </div>`;
      })()}
    </div>`}

    ${showWellnessAfter && _h`<${WellnessPopup}
      seance=${seanceForWellness}
      obligatoire=${true}
      mode=${'bilan'}
      onClose=${() => {
        // Annuler — la séance n'est PAS validée (bilan obligatoire)
        setShowWellnessAfter(false); setSeanceForWellness(null);
      }}
      onSubmit=${(data) => {
        // Marquer la séance faite + sauvegarder le wellness ensemble
        if (seanceForWellness) {
          updateSeance(seanceForWellness.id, { dateFaite: localDateStr(), wellness: data, ...data });
          try { notifWellness(player.name, data); } catch(e) {}
          // Alimente automatiquement le Bilan de charge équipe (plus besoin du formulaire Terrain à part)
          if (data.rpeReel) {
            const dureeEstim = Math.max(30, Math.min(100, (seanceForWellness.exercices||[]).length * 9));
            const bilan = {
              id: Date.now(), date: localDateStr(), type: 'Muscu',
              typeSeance: seanceForWellness.nom || 'Musculation',
              duree: dureeEstim, rpe: data.rpeReel,
              chargeSession: dureeEstim * data.rpeReel,
              fatigue: data.fatigue || 3, zonesActives: [],
              impactArticulaire: { epaule:0, genou:0, cheville:0, lombaires:0 },
              notes: data.notesJoueur || '',
            };
            setDb(d => ({
              ...d,
              playerProfiles: (d.playerProfiles||[]).map(p => p.id===player.id ? {...p, bilans:[...(p.bilans||[]), bilan]} : p),
              playersPerso: (d.playersPerso||[]).map(p => p.id===player.id ? {...p, bilans:[...(p.bilans||[]), bilan]} : p),
            }));
          }
        }
        setShowWellnessAfter(false); setSeanceForWellness(null);
        if (onSeanceDone) setTimeout(() => onSeanceDone(), 150);
      }}
    />`}
  </div>`;
}
