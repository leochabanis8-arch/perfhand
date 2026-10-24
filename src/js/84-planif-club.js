


// ── PLANIFICATION INDIVIDUELLE ─────────────────────────────────────────────────
// Composant de planification personnalisée pour joueurs individuels
// Stocké dans player.planif = { semaines: [...], objectifSaison: '', dateDebut: '' }

const CYCLES_PERSO = [
  { id:'repos',       label:'Repos',           abbr:'Repos', color:'#38BDF8', bg:'rgba(56,189,248,.12)'   },
  { id:'ppg',         label:'PPG',             abbr:'PPG',   color:'#FF4455', bg:'rgba(255,68,85,.12)'    },
  { id:'pps1',        label:'PPS 1',           abbr:'PPS1',  color:'#FF7A00', bg:'rgba(255,122,0,.12)'    },
  { id:'pps2',        label:'PPS 2',           abbr:'PPS2',  color:'#FFA420', bg:'rgba(255,164,32,.12)'   },
  { id:'competition', label:'Compétition',     abbr:'Comp',  color:'#4CAF50', bg:'rgba(76,175,80,.12)'    },
  { id:'prevention',  label:'Prévention',      abbr:'Prév',  color:'#38BDF8', bg:'rgba(56,189,248,.12)'   },
  { id:'reprise',     label:'Reprise',         abbr:'Repr',  color:'#7C6FFF', bg:'rgba(124,111,255,.12)'  },
  { id:'rehab',       label:'Réhabilitation',  abbr:'Réhab', color:'#EC4899', bg:'rgba(236,72,153,.12)'   },
  { id:'decharge',    label:'Décharge',        abbr:'Déch',  color:'#4CAF50', bg:'rgba(76,175,80,.12)'    },
  { id:'vide',        label:'—',               abbr:'—',     color:'rgba(255,255,255,.15)', bg:'rgba(255,255,255,.03)' },
];

// Nature du travail dominant sur la semaine — indépendant du cycle (macro-phase), plusieurs
// natures possibles sur une même semaine (ex: Force + Vitesse). Stocké dans week.natureTravail
// (tableau d'ids).
const NATURE_TRAVAIL = [
  { id:'force',         label:'Force',         color:'#FF4455' },
  { id:'puissance',     label:'Puissance',     color:'#FF7A00' },
  { id:'vitesse',       label:'Vitesse',       color:'#FFA420' },
  { id:'hypertrophie',  label:'Hypertrophie',  color:'#7C6FFF' },
  { id:'endurance',     label:'Endurance',     color:'#38BDF8' },
];
function toggleNature(week, id) {
  const cur = week.natureTravail || [];
  return cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
}

const QUALITES_PERSO = [
  { id:'force',    label:'Force',    color:'#FF4455' },
  { id:'vitesse',  label:'Vitesse',  color:'#FFA420' },
  { id:'endurance',label:'Endurance',color:'#38BDF8' },
  { id:'mobilite', label:'Mobilité', color:'#7C6FFF' },
];

function PlanifClubView({ club, players, readOnly, clubPlanifOverride, onSaveOverride }) {
  const { db, setDb } = useApp();
  if (!club) return _h`<div style=${{ padding:40, textAlign:"center", color:"rgba(255,255,255,.3)" }}>Aucun club configuré.</div>`;

  // Club planning stored in db.clubPlanif[clubId] = { semaines: [{...} x 44] }
  // — sauf si clubPlanifOverride est fourni (ex: tenant isolé), auquel cas on l'utilise à la place
  const clubPlanif = clubPlanifOverride !== undefined
    ? (clubPlanifOverride || { semaines: [], objectif:'', saison:'2026-2027', dateDebut:'' })
    : ((db.clubPlanif || {})[club.id] || { semaines: [], objectif:'', saison:'2026-2027', dateDebut:'' });

  function getWeeks() {
    const sems = clubPlanif.semaines || [];
    return Array.from({ length: 44 }, (_, i) => sems[i] || {
      num: i+1, label:'S'+(i+1), cycle:'vide',
      jours: Array(7).fill(null).map(() => [{ type:'', heures:0, notes:'', heureDebut:'' }]),
      match:'', chargeTotal:0, notes:'', objectifs:'',
    });
  }

  const [weeks, setWeeks]     = useState(getWeeks);
  const [selWeek, setSelWeek] = useState(null);
  const [objectif, setObjectif] = useState(clubPlanif.objectif||'');
  const [dateDebut, setDateDebut] = useState(clubPlanif.dateDebut||'');
  const [view, setView]       = useState('macro');
  const [modePrepa, setModePrepa] = useState(false);
  const [showDupWeek, setShowDupWeek] = useState(false);
  const [dupTargets, setDupTargets] = useState([]);
  const [dupIncludeObjectifs, setDupIncludeObjectifs] = useState(false);

  function save(newWeeks) {
    const w = newWeeks || weeks;
    const data = { semaines: w, objectif, saison:'2026-2027', dateDebut };
    if (onSaveOverride) {
      onSaveOverride(data);
      return;
    }
    if (window.__perfhand_db) {
      window.__perfhand_db.ref('perfhand/clubPlanif/' + club.id).set(data);
    }
    setDb(d => ({
      ...d,
      clubPlanif: { ...(d.clubPlanif||{}), [club.id]: data }
    }));
  }

  // Si la saison n'a jamais été entièrement sauvegardée (ex: seules les premières
  // semaines éditées ont été écrites), on complète et sauvegarde tout de suite la
  // structure des 44 semaines — sinon la vue globale (côté joueurs/staff) s'arrête
  // artificiellement à la dernière semaine réellement enregistrée dans Firebase.
  useEffect(() => {
    const savedCount = (clubPlanif.semaines || []).filter(Boolean).length;
    if (savedCount < 44) {
      save(weeks);
    }
  }, []);

  // Normalise un jour vers un tableau de séances (compatible avec l'ancien format objet unique)
  function dayArr(day) {
    if (Array.isArray(day)) return day.length ? day : [{ type:'', heures:0, notes:'', heureDebut:'' }];
    if (day) return [day];
    return [{ type:'', heures:0, notes:'', heureDebut:'' }];
  }
  function weekChargeFromJours(jours) {
    return (jours||[]).reduce((s, day) => s + dayArr(day).reduce((s2,j)=>s2+(parseFloat(j.heures)||0),0), 0);
  }

  function updJourSession(weekIdx, jourIdx, sessionIdx, field, val) {
    const nw = weeks.map((w, wi) => {
      if (wi !== weekIdx) return w;
      const newJours = w.jours.map((day, ji) => {
        if (ji !== jourIdx) return day;
        const sessions = dayArr(day).map((j, si) => si === sessionIdx ? { ...j, [field]: val } : j);
        return sessions;
      });
      const chargeTotal = weekChargeFromJours(newJours);
      return { ...w, jours: newJours, chargeTotal };
    });
    setWeeks(nw);
    save(nw);
  }

  function addJourSession(weekIdx, jourIdx) {
    const nw = weeks.map((w, wi) => {
      if (wi !== weekIdx) return w;
      const newJours = w.jours.map((day, ji) => ji === jourIdx ? [...dayArr(day), { type:'', heures:0, notes:'', heureDebut:'' }] : day);
      return { ...w, jours: newJours };
    });
    setWeeks(nw);
    save(nw);
  }

  function removeJourSession(weekIdx, jourIdx, sessionIdx) {
    const nw = weeks.map((w, wi) => {
      if (wi !== weekIdx) return w;
      const newJours = w.jours.map((day, ji) => {
        if (ji !== jourIdx) return day;
        const sessions = dayArr(day).filter((_, si) => si !== sessionIdx);
        return sessions.length ? sessions : [{ type:'', heures:0, notes:'', heureDebut:'' }];
      });
      const chargeTotal = weekChargeFromJours(newJours);
      return { ...w, jours: newJours, chargeTotal };
    });
    setWeeks(nw);
    save(nw);
  }

  function updWeek(weekIdx, field, val) {
    const nw = weeks.map((w, wi) => wi === weekIdx ? { ...w, [field]: val } : w);
    setWeeks(nw);
    save(nw);
  }

  function weekDate(i) {
    if (!dateDebut) return 'S'+(i+1);
    const d = new Date(dateDebut);
    d.setDate(d.getDate() + i*7);
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
  }

  const CYCLES_COLORS = {
    ppg:'#FF4455', pps1:'#FF7A00', pps2:'#FFA420',
    competition:'#4CAF50', prevention:'#7C6FFF', repos:'#38BDF8', vide:'rgba(255,255,255,.15)'
  };

  const selW = selWeek !== null ? weeks[selWeek] : null;
  const totalHeures = selW ? weekChargeFromJours(selW.jours) : 0;

  return _h`<div>

    <!-- Config -->
    <div class="card" style=${{ marginBottom:14 }}>
      <div class="edit-row">
        <div>
          <div class="lbl">Objectif de saison</div>
          <input class="inp" value=${objectif}
            onInput=${e => { setObjectif(e.target.value); save(); }}
            placeholder="Ex: Maintien N1, montée Pro D2..."/>
        </div>
        <div>
          <div class="lbl">Date de début (S1)</div>
          <input class="inp" type="date" value=${dateDebut}
            onInput=${e => { setDateDebut(e.target.value); save(); }}/>
        </div>
      </div>
      ${!readOnly && players.some(p => p.planif && p.planif.semaines && p.planif.semaines.length > 0) ? _h`<div style=${{ marginTop:12, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:12 }}>
        <div class="lbl" style=${{ marginBottom:6 }}>📋 Dupliquer la planif individuelle d'un joueur vers tout le club</div>
        <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
          ${players.filter(p => p.planif && p.planif.semaines && p.planif.semaines.length > 0).map(p => _h`<button key=${p.id}
            onClick=${() => {
              const source = p;
              const targets = players.filter(pl => pl.id !== source.id);
              if (!targets.length) { alert('Aucun autre joueur dans ce club.'); return; }
              if (!confirm('Dupliquer la planification de ' + source.name + ' vers ' + targets.length + ' autres joueurs ?\n\nCeci écrasera leurs planifications existantes.')) return;
              const planifData = source.planif;
              targets.forEach(pl => {
                if (window.__perfhand_db) {
                  window.__perfhand_db.ref('perfhand/playerProfiles/' + pl.id + '/planif').set(planifData);
                }
              });
              setDb(d => ({
                ...d,
                playerProfiles: (d.playerProfiles||[]).map(pl =>
                  pl.id !== source.id && (pl.clubId === club.id || !pl.clubId) ? { ...pl, planif: planifData } : pl
                )
              }));
              alert('✅ Planification de ' + source.name + ' dupliquée vers ' + targets.length + ' joueurs !');
            }}
            style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            📋 ${p.name.split(' ')[0]}
          </button>`)}
        </div>
      </div>` : null}

      ${!readOnly && players.some(p => p.planif && p.planif.semaines && p.planif.semaines.length > 0) ? _h`<div style=${{ marginTop:12, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:12 }}>
        <div class="lbl" style=${{ marginBottom:6 }}>🌍 Dupliquer la planif individuelle d'un joueur vers le planning général (vue globale)</div>
        <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
          ${players.filter(p => p.planif && p.planif.semaines && p.planif.semaines.length > 0).map(p => _h`<button key=${p.id}
            onClick=${() => {
              if (!confirm('Copier la planification de ' + p.name + ' vers le planning général du club ?\n\nCeci écrasera le planning général actuel (mais pas les planifs individuelles des joueurs).')) return;
              const srcWeeks = p.planif.semaines || [];
              const validCycles = ['ppg','pps1','pps2','competition','prevention','repos','vide'];
              const nw = weeks.map((w, i) => {
                const src = srcWeeks[i];
                if (!src) return w;
                const cycle = validCycles.includes(src.cycle) ? src.cycle : (src.cycle === 'rehab' ? 'prevention' : 'vide');
                // chargeTotal recalculé depuis les jours REELS de la semaine cible (inchangés par cette
                // duplication) plutôt que copié depuis src.heures — ce champ individuel vaut souvent 0
                // (jamais rempli côté planif joueur), ce qui écrasait le vrai total à tort.
                const recalcCharge = weekChargeFromJours(w.jours);
                return { ...w, cycle, match: src.match || '', chargeTotal: recalcCharge, objectifs: src.notes || '' };
              });
              const newDateDebut = dateDebut || p.planif.dateDebut || '';
              const newObjectif = objectif || p.planif.objectifSaison || '';
              setWeeks(nw);
              setDateDebut(newDateDebut);
              setObjectif(newObjectif);
              const data = { semaines: nw, objectif: newObjectif, saison:'2026-2027', dateDebut: newDateDebut };
              if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/clubPlanif/' + club.id).set(data);
              setDb(d => ({ ...d, clubPlanif: { ...(d.clubPlanif||{}), [club.id]: data } }));
              alert('✅ Planning général mis à jour depuis la planif de ' + p.name + ' !');
            }}
            style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            🌍 ${p.name.split(' ')[0]}
          </button>`)}
        </div>
      </div>` : null}
    </div>

    <!-- Vue toggle -->
    <div style=${{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
      ${!readOnly && ['macro','detail'].map(v => _h`<button key=${v}
        onClick=${() => { setView(v); setModePrepa(false); }}
        style=${{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:view===v&&!modePrepa?700:400,
          background:view===v&&!modePrepa?'rgba(255,255,255,.1)':'rgba(255,255,255,.04)',
          color:view===v&&!modePrepa?'#fff':'rgba(255,255,255,.4)' }}>
        ${v==='macro'?'Vue saison':'Vue détaillée'}
      </button>`)}
      <button
        onClick=${() => { setModePrepa(!modePrepa); }}
        style=${{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:modePrepa?700:400,
          background:modePrepa?'#FFA420':'rgba(255,164,32,.08)',
          color:modePrepa?'#000':'#FFA420' }}>
        ☀️ Prépa Estivale
      </button>
    </div>
    ${modePrepa && React.createElement(PrepaEstivaleView, { club, readOnly, db, setDb })}

    <!-- MACRO: heatmap 44 semaines -->
    ${view === 'macro' && _h`<div>
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:4, marginBottom:16 }}>
        ${weeks.map((w,i) => {
          const isSelected = selWeek === i;
          const h = w.chargeTotal || 0;
          const intensity = h === 0 ? 0 : h <= 5 ? 1 : h <= 10 ? 2 : h <= 15 ? 3 : 4;
          const colors = ['rgba(255,255,255,.04)','#38BDF820','#4CAF5025','#FF7A0025','#FF445525'];
          const borders = ['rgba(255,255,255,.06)','#38BDF840','#4CAF5050','#FF7A0050','#FF445550'];
          return _h`<div key=${i}
            onClick=${() => setSelWeek(isSelected ? null : i)}
            style=${{ background: isSelected?'rgba(255,164,32,.2)':colors[intensity],
              border:'1px solid '+(isSelected?'#FFA420':borders[intensity]),
              borderRadius:8, padding:'6px 4px', cursor:'pointer', textAlign:'center' }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)' }}>${w.label}</div>
            <div style=${{ fontSize:11, fontWeight:700, color: h>0?'#FFA420':'rgba(255,255,255,.2)' }}>
              ${h>0 ? h+'h' : '—'}
            </div>
            ${w.match ? _h`<div style=${{ width:5, height:5, borderRadius:'50%', background:'#FFA420', margin:'2px auto 0' }}></div>` : null}
          </div>`;
        })}
      </div>

      <!-- Stats globales -->
      <div class="grid-4" style=${{ marginBottom:16 }}>
        ${[
          ['Semaines planifiées', weeks.filter(w=>w.chargeTotal>0).length+'/44', '#FFA420'],
          ['Heures totales',      Math.round(weeks.reduce((s,w)=>s+(w.chargeTotal||0),0))+'h', '#38BDF8'],
          ['Moy. hebdo',          Math.round(weeks.filter(w=>w.chargeTotal>0).reduce((s,w)=>s+(w.chargeTotal||0),0) / Math.max(1,weeks.filter(w=>w.chargeTotal>0).length)*10)/10+'h', '#4CAF50'],
          ['Matches prévus', (() => {
            let total = 0;
            weeks.forEach(w => {
              if (!w.match) return;
              const txt = w.match.trim().toLowerCase();
              // Chercher un chiffre explicite (ex: "2 matchs", "3 rencontres")
              const numMatch = txt.match(/^(\d+)\s*(match|rencontre|partie)/);
              if (numMatch) { total += parseInt(numMatch[1]); return; }
              // Compter les séparateurs : virgule, "+", " et "
              const parts = txt.split(/,|\+| et | & /);
              total += parts.filter(p => p.trim().length > 0).length;
            });
            return total;
          })(), '#FF4455'],
        ].map(([l,v,col]) => _h`<div key=${l} class="card">
          <div style=${{ fontSize:24, fontWeight:800, color:col, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginTop:3 }}>${l}</div>
        </div>`)}
      </div>

      <!-- Panneau semaine -->
      ${selWeek !== null && _h`<div class="card" style=${{ border:'1px solid rgba(255,164,32,.25)' }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <div style=${{ fontSize:14, fontWeight:800, color:'#FFA420' }}>${weeks[selWeek].label} — ${weekDate(selWeek)}</div>
            <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>Total: <b style=${{ color:'#FFA420' }}>${totalHeures}h</b> · ${(CYCLES_PERSO.find(c => c.id === weeks[selWeek].cycle) || CYCLES_PERSO[CYCLES_PERSO.length-1]).label}</div>
          </div>
          <div style=${{ display:'flex', gap:6 }}>
            ${selWeek>0 ? _h`<button class="btn btn-sm" onClick=${()=>{ setSelWeek(selWeek-1); setShowDupWeek(false); }}>←</button>` : null}
            ${selWeek<43 ? _h`<button class="btn btn-sm" onClick=${()=>{ setSelWeek(selWeek+1); setShowDupWeek(false); }}>→</button>` : null}
            <button onClick=${()=>{ setSelWeek(null); setShowDupWeek(false); }} style=${{ background:'none',border:'none',color:'rgba(255,255,255,.3)',fontSize:18,cursor:'pointer' }}>×</button>
          </div>
        </div>

        <!-- Cycle -->
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Cycle</div>
          <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
            ${CYCLES_PERSO.map(cy => _h`<button key=${cy.id}
              onClick=${() => updWeek(selWeek, 'cycle', cy.id)}
              style=${{ padding:'5px 11px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
                border:'1px solid '+(weeks[selWeek].cycle===cy.id?cy.color:'rgba(255,255,255,.1)'),
                background:weeks[selWeek].cycle===cy.id?cy.bg:'rgba(255,255,255,.03)',
                color:weeks[selWeek].cycle===cy.id?cy.color:'rgba(255,255,255,.4)',
                fontWeight:weeks[selWeek].cycle===cy.id?700:400 }}>${cy.label}</button>`)}
          </div>
        </div>

        <!-- Nature du travail -->
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Nature du travail</div>
          <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
            ${NATURE_TRAVAIL.map(nt => {
              const active = (weeks[selWeek].natureTravail||[]).includes(nt.id);
              return _h`<button key=${nt.id}
                onClick=${() => updWeek(selWeek, 'natureTravail', toggleNature(weeks[selWeek], nt.id))}
                style=${{ padding:'5px 11px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
                  border:'1px solid '+(active?nt.color:'rgba(255,255,255,.1)'),
                  background:active?nt.color+'20':'rgba(255,255,255,.03)',
                  color:active?nt.color:'rgba(255,255,255,.4)',
                  fontWeight:active?700:400 }}>${nt.label}</button>`;
            })}
          </div>
        </div>

        <!-- Match -->
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Match / événement</div>
          <input class="inp" value=${weeks[selWeek].match||''} onInput=${e=>updWeek(selWeek,'match',e.target.value)} placeholder="Ex: Match J12, Tournoi..."/>
        </div>

        <!-- Dupliquer cette semaine vers d'autres semaines -->
        <div style=${{ marginBottom:12 }}>
          ${!showDupWeek ? _h`<button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700 }}
            onClick=${() => { setShowDupWeek(true); setDupTargets([]); }}>📋 Utiliser comme semaine type — dupliquer vers d'autres semaines</button>`
          : _h`<div style=${{ background:'rgba(76,175,80,.06)', border:'1px solid rgba(76,175,80,.25)', borderRadius:10, padding:'10px 12px' }}>
              <div style=${{ fontSize:11, fontWeight:700, color:'#4CAF50', marginBottom:8 }}>Dupliquer le planning jour/jour + cycle de ${weeks[selWeek].label} vers :</div>
              <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                <button class="btn btn-sm" onClick=${() => setDupTargets(Array.from({length:44-selWeek-1},(_, i)=>selWeek+1+i))}
                  style=${{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:11 }}>Toutes les semaines suivantes</button>
                <button class="btn btn-sm" onClick=${() => setDupTargets(Array.from({length:Math.min(4,44-selWeek-1)},(_, i)=>selWeek+1+i))}
                  style=${{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:11 }}>+4 prochaines</button>
                <button class="btn btn-sm" onClick=${() => setDupTargets([])}
                  style=${{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:11 }}>Aucune</button>
              </div>
              <div style=${{ display:'flex', flexWrap:'wrap', gap:5, maxHeight:140, overflowY:'auto', marginBottom:10, padding:'8px', background:'rgba(0,0,0,.15)', borderRadius:8 }}>
                ${weeks.map((w,i) => i===selWeek ? null : _h`<button key=${i}
                  onClick=${() => setDupTargets(t => t.includes(i) ? t.filter(x=>x!==i) : [...t,i])}
                  style=${{ fontSize:10, padding:'3px 8px', borderRadius:12, border:'1px solid '+(dupTargets.includes(i)?'rgba(76,175,80,.5)':'rgba(255,255,255,.1)'),
                    background: dupTargets.includes(i)?'rgba(76,175,80,.2)':'rgba(255,255,255,.03)',
                    color: dupTargets.includes(i)?'#4CAF50':'rgba(255,255,255,.4)', fontWeight: dupTargets.includes(i)?700:400 }}>${w.label}</button>`)}
              </div>
              <label style=${{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:10, cursor:'pointer' }}>
                <input type="checkbox" checked=${dupIncludeObjectifs} onChange=${e=>setDupIncludeObjectifs(e.target.checked)}/>
                Copier aussi les objectifs/notes de la semaine (le match ne sera jamais copié)
              </label>
              <div style=${{ display:'flex', gap:8 }}>
                <button class="btn btn-sm" style=${{ flex:1, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
                  onClick=${() => setShowDupWeek(false)}>Annuler</button>
                <button class="btn btn-sm" style=${{ flex:2, background:'#4CAF50', color:'#000', fontWeight:800 }}
                  disabled=${dupTargets.length===0}
                  onClick=${() => {
                    if (dupTargets.length===0) return;
                    if (!confirm('Dupliquer ' + weeks[selWeek].label + ' vers ' + dupTargets.length + ' semaine(s) ? Ça écrasera leur contenu actuel (hors match).')) return;
                    const source = weeks[selWeek];
                    const nw = weeks.map((w, i) => {
                      if (!dupTargets.includes(i)) return w;
                      return {
                        ...w,
                        cycle: source.cycle,
                        jours: (source.jours||[]).map(day => dayArr(day).map(j => ({...j}))),
                        chargeTotal: source.chargeTotal,
                        objectifs: dupIncludeObjectifs ? source.objectifs : w.objectifs,
                      };
                    });
                    setWeeks(nw);
                    save(nw);
                    setShowDupWeek(false);
                    setDupTargets([]);
                    alert('✅ ' + weeks[selWeek].label + ' dupliquée vers ' + dupTargets.length + ' semaine(s) !');
                  }}>✓ Dupliquer vers ${dupTargets.length} semaine${dupTargets.length>1?'s':''}</button>
              </div>
            </div>`}
        </div>

        <!-- Grille 7 jours - responsive, plusieurs séances possibles par jour -->
        <div style=${{ marginBottom:12 }}>
          <div class="lbl" style=${{ marginBottom:8 }}>Planning jour par jour</div>
          <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
            ${JOURS.map((jour,ji) => {
              const sessions = dayArr(weeks[selWeek].jours[ji]);
              return _h`<div key=${jour} style=${{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'8px 10px' }}>
                <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
                  ${sessions.map((j, si) => {
                    const typeInfo = TYPES_SEANCE.find(t=>t.id===j.type);
                    return _h`<div key=${si} style=${{
                      background: typeInfo?typeInfo.color+'10':'rgba(255,255,255,.03)',
                      border:'1px solid '+(typeInfo?typeInfo.color+'30':'rgba(255,255,255,.07)'),
                      borderRadius:8, padding:'8px 10px'
                    }}>
                      <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <!-- Jour (affiché seulement sur la 1ère séance du jour) -->
                        <div style=${{ fontSize:13, fontWeight:800, color:typeInfo?typeInfo.color:'rgba(255,255,255,.5)', minWidth:36 }}>${si===0?jour:''}</div>
                        <!-- Type séance -->
                        <select style=${{ flex:1, minWidth:0, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, color:'#fff', fontSize:12, padding:'6px 8px', fontFamily:'Inter,sans-serif' }}
                          value=${j.type} onChange=${e=>updJourSession(selWeek,ji,si,'type',e.target.value)}>
                          <option value="">— Repos</option>
                          ${TYPES_SEANCE.map(t => _h`<option key=${t.id} value=${t.id}>${t.icon} ${t.label}</option>`)}
                        </select>
                        <!-- Retirer cette séance (si plus d'une) -->
                        ${sessions.length > 1 ? _h`<button onClick=${()=>removeJourSession(selWeek,ji,si)}
                          style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', fontSize:16, cursor:'pointer', padding:0, flexShrink:0 }}>×</button>` : null}
                      </div>
                      <div style=${{ display:'flex', alignItems:'center', gap:8, marginLeft:44 }}>
                        <!-- Horaire de début -->
                        <div style=${{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>🕐</span>
                          ${React.createElement(TimeSelect, { value: j.heureDebut||'',
                            onChange: v => updJourSession(selWeek,ji,si,'heureDebut',v) })}
                        </div>
                        <!-- Heures (durée) -->
                        <div style=${{ display:'flex', alignItems:'center', gap:4 }}>
                          <input type="number" min="0" max="6" step="0.5"
                            value=${j.heures||''}
                            onInput=${e=>updJourSession(selWeek,ji,si,'heures',parseFloat(e.target.value)||0)}
                            placeholder="0"
                            style=${{ width:52, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, padding:'5px 6px', textAlign:'center', fontFamily:'Inter,sans-serif' }}/>
                          <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)', flexShrink:0 }}>h durée</span>
                        </div>
                      </div>
                    </div>`;
                  })}
                  <button onClick=${()=>addJourSession(selWeek,ji)}
                    style=${{ alignSelf:'flex-start', background:'none', border:'1px dashed rgba(255,255,255,.15)', color:'rgba(255,255,255,.35)', fontSize:10, borderRadius:6, padding:'3px 8px', cursor:'pointer', marginLeft:44 }}>
                    + Ajouter une séance ce jour
                  </button>
                </div>
              </div>`;
            })}
          </div>
        </div>

        <!-- Objectifs semaine -->
        <div>
          <div class="lbl">Objectifs / notes de la semaine</div>
          <textarea class="inp" value=${weeks[selWeek].objectifs||''}
            onInput=${e=>updWeek(selWeek,'objectifs',e.target.value)}
            placeholder="Objectifs travaillés, focus tactique, points physiques..."
            style=${{ resize:'vertical', minHeight:50, marginTop:4 }}></textarea>
        </div>
      </div>`}
    </div>`}

    <!-- DETAIL: tableau récapitulatif -->
    ${view === 'detail' && _h`<div style=${{ overflowX:'auto' }}>
      <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
        <thead><tr>
          ${['Sem.','Date','Lun','Mar','Mer','Jeu','Ven','Sam','Dim','Total h','Match','Objectifs'].map(h =>
            _h`<th key=${h} style=${{ padding:'6px 8px', textAlign:'left', fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.06)', fontWeight:500 }}>${h}</th>`
          )}
        </tr></thead>
        <tbody>
          ${weeks.map((w,i) => _h`<tr key=${i} style=${{ cursor:'pointer', background:selWeek===i?'rgba(255,164,32,.05)':'transparent' }}
            onClick=${()=>{ setView('macro'); setSelWeek(i); }}>
            <td style=${{ padding:'7px 8px', borderBottom:'1px solid rgba(255,255,255,.04)', fontWeight:700, color:'#FFA420', fontSize:12 }}>${w.label}</td>
            <td style=${{ padding:'7px 8px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:10, color:'rgba(255,255,255,.35)' }}>${weekDate(i)}</td>
            ${(w.jours||[]).map((day,ji) => {
              const sessions = dayArr(day);
              return _h`<td key=${ji} style=${{ padding:'4px 6px', borderBottom:'1px solid rgba(255,255,255,.04)', textAlign:'center' }}>
                <div style=${{ display:'flex', flexDirection:'column', gap:2, alignItems:'center' }}>
                  ${sessions.map((j,si) => {
                    const t = TYPES_SEANCE.find(ts=>ts.id===j.type);
                    return t ? _h`<div key=${si} style=${{ fontSize:9, background:t.color+'15', color:t.color, borderRadius:4, padding:'2px 4px', whiteSpace:'nowrap' }}>
                      ${t.icon} ${j.heures?j.heures+'h':''}
                    </div>` : (si===0 ? _h`<div key=${si} style=${{ color:'rgba(255,255,255,.15)', fontSize:10 }}>—</div>` : null);
                  })}
                </div>
              </td>`;
            })}
            <td style=${{ padding:'7px 8px', borderBottom:'1px solid rgba(255,255,255,.04)', fontWeight:700, color:w.chargeTotal>0?'#FFA420':'rgba(255,255,255,.2)' }}>${w.chargeTotal>0?w.chargeTotal+'h':'—'}</td>
            <td style=${{ padding:'7px 8px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:10, color:'#FFA420' }}>${w.match||''}</td>
            <td style=${{ padding:'7px 8px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:10, color:'rgba(255,255,255,.4)', maxWidth:150 }}>
              <div style=${{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>${w.objectifs||''}</div>
            </td>
          </tr>`)}
        </tbody>
      </table>
    </div>`}
  </div>`;
}



// ── GESTION STAFF (coachs / prépa physique) ───────────────────────────────────
function PrepaEstivaleView({ club, readOnly, db, setDb }) {
  const clubId = club && club.id || 'usm';
  const stored = ((db.prepaEstivale || {})[clubId]) || { semaines: [] };

  const SEMAINES_DEFAUT = [
    { num:1, dates:'30 juin - 6 juil', theme:'Reprise / Evaluation', cycle:'ppg', objectif:'Bilan physique, reprise progressive. Tests de condition physique.', seances:[] },
    { num:2, dates:'7 - 13 juil', theme:'PPG Fondamentale', cycle:'ppg', objectif:'Développer les qualités physiques de base. Travail aérobie et force générale.', seances:[] },
    { num:3, dates:'14 - 20 juil', theme:'PPG Intensive', cycle:'ppg', objectif:'Augmentation des charges. Introduction travail explosif.', seances:[] },
    { num:4, dates:'21 - 27 juil', theme:'PPG / PPS', cycle:'pps1', objectif:'Transition PPG/PPS. Travail spécifique handball intégré.', seances:[] },
    { num:5, dates:'28 juil - 3 août', theme:'PPS 1', cycle:'pps1', objectif:'Travail technique-tactique avec charge physique élevée.', seances:[] },
    { num:6, dates:'4 - 10 août', theme:'PPS 2', cycle:'pps2', objectif:'Affûtage. Réduction volume, maintien intensité. Matchs amicaux.', seances:[] },
    { num:7, dates:'11 - 17 août', theme:'Pré-compétition', cycle:'pps2', objectif:'Préparation reprise championnat. Travail tactique prioritaire.', seances:[] },
    { num:8, dates:'18 - 24 août', theme:'Reprise compétition', cycle:'competition', objectif:'1ère journée championnat. Gestion charge optimale.', seances:[] },
  ];

  const semaines = stored.semaines && stored.semaines.length > 0
    ? SEMAINES_DEFAUT.map((s, i) => ({ ...s, ...(stored.semaines[i] || {}) }))
    : SEMAINES_DEFAUT;

  const [selSem, setSelSem] = useState(null);
  const [editSem, setEditSem] = useState(null);

  function save(newSems) {
    setDb(d => ({
      ...d,
      prepaEstivale: { ...(d.prepaEstivale||{}), [clubId]: { semaines: newSems } }
    }));
    if (window.__perfhand_db) {
      window.__perfhand_db.ref('perfhand/prepaEstivale/' + clubId).set({ semaines: newSems });
    }
  }

  function updSemaine(idx, field, val) {
    const ns = semaines.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    save(ns);
    if (editSem && editSem.num === semaines[idx].num) setEditSem({ ...editSem, [field]: val });
  }

  function addSeance(semIdx) {
    const ns = semaines.map((s, i) => i === semIdx ? {
      ...s, seances: [...(s.seances||[]), { id: Date.now(), titre:'', type:'Muscu', duree:90, intensite:'Modérée', contenu:'', objectif:'' }]
    } : s);
    save(ns);
  }

  function updSeance(semIdx, seanceId, field, val) {
    const ns = semaines.map((s, i) => i !== semIdx ? s : {
      ...s, seances: (s.seances||[]).map(sc => sc.id === seanceId ? { ...sc, [field]: val } : sc)
    });
    save(ns);
  }

  function delSeance(semIdx, seanceId) {
    const ns = semaines.map((s, i) => i !== semIdx ? s : {
      ...s, seances: (s.seances||[]).filter(sc => sc.id !== seanceId)
    });
    save(ns);
  }

  const CYCLES_COLORS = { ppg:'#FF4455', pps1:'#FF7A00', pps2:'#FFA420', competition:'#4CAF50', repos:'#38BDF8' };
  const TYPES_SEANCE = ['Muscu', 'Endurance', 'Technique', 'Collectif', 'Match amical', 'Récupération', 'Test'];

  const selSemData = selSem !== null ? semaines[selSem] : null;

  return _h`<div style=${{ marginTop:8 }}>
    <div style=${{ fontSize:13, fontWeight:800, color:'#FFA420', marginBottom:12, letterSpacing:1, textTransform:'uppercase' }}>
      ☀️ Préparation Estivale — Juillet / Août 2026
    </div>

    <!-- Grille 8 semaines - responsive -->
    <div style=${{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:8, marginBottom:16 }}>
      ${semaines.map((s, i) => _h`<div key=${i}
        onClick=${() => setSelSem(selSem === i ? null : i)}
        style=${{ background: selSem === i ? 'rgba(255,164,32,.12)' : 'rgba(255,255,255,.03)',
          border: '1px solid ' + (selSem === i ? '#FFA420' : (CYCLES_COLORS[s.cycle]||'rgba(255,255,255,.08)') + '44'),
          borderRadius:10, padding:'10px 10px', cursor:'pointer', transition:'all .15s' }}>
        <div style=${{ fontSize:9, color:CYCLES_COLORS[s.cycle]||'#FFA420', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>S${s.num}</div>
        <div style=${{ fontSize:11, fontWeight:700, color:'#fff', marginBottom:2, lineHeight:1.3 }}>${s.theme}</div>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${s.dates}</div>
        ${(s.seances||[]).length > 0 ? _h`<div style=${{ marginTop:5, fontSize:9, color:'#FFA420' }}>${(s.seances||[]).length} séance(s)</div>` : null}
      </div>`)}
    </div>

    <!-- Détail semaine sélectionnée -->
    ${selSemData ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,164,32,.2)', borderRadius:14, padding:'16px' }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style=${{ fontSize:16, fontWeight:800, color:'#FFA420' }}>S${selSemData.num} — ${selSemData.theme}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${selSemData.dates}</div>
        </div>
        ${!readOnly ? _h`<button onClick=${() => addSeance(selSem)}
          style=${{ background:'#FFA420', color:'#000', border:'none', borderRadius:8, padding:'7px 12px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
          + Séance
        </button>` : null}
      </div>

      <!-- Objectif semaine -->
      <div style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Objectif de la semaine</div>
        ${!readOnly ? _h`<textarea class="inp" style=${{ resize:'none', height:60, fontSize:12 }}
          value=${selSemData.objectif}
          onInput=${e => updSemaine(selSem, 'objectif', e.target.value)}
          placeholder="Objectifs physiques, techniques, tactiques..."></textarea>` :
          _h`<div style=${{ background:'rgba(255,255,255,.03)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'rgba(255,255,255,.7)', lineHeight:1.5 }}>${selSemData.objectif || '—'}</div>`}
      </div>

      <!-- Séances -->
      ${(selSemData.seances||[]).length === 0 && !readOnly ? _h`<div style=${{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,.2)', fontSize:12 }}>
        Aucune séance — clique "+ Séance" pour commencer
      </div>` : null}

      ${(selSemData.seances||[]).map(sc => _h`<div key=${sc.id} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
        <div style=${{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
          ${!readOnly ? _h`<input class="inp" style=${{ flex:2, minWidth:120, fontSize:13, fontWeight:700 }}
            value=${sc.titre} placeholder="Titre de la séance"
            onInput=${e => updSeance(selSem, sc.id, 'titre', e.target.value)} />` :
            _h`<div style=${{ flex:2, fontSize:13, fontWeight:700 }}>${sc.titre || 'Séance sans titre'}</div>`}
          ${!readOnly ? _h`<select class="inp" style=${{ flex:1, minWidth:100, fontSize:11 }}
            value=${sc.type} onChange=${e => updSeance(selSem, sc.id, 'type', e.target.value)}>
            ${TYPES_SEANCE.map(t => _h`<option key=${t} value=${t}>${t}</option>`)}
          </select>` :
            _h`<div style=${{ fontSize:11, color:'#FFA420', fontWeight:600, background:'rgba(255,164,32,.1)', borderRadius:6, padding:'3px 8px' }}>${sc.type}</div>`}
          ${!readOnly ? _h`<input class="inp" style=${{ width:70, fontSize:11 }} type="number"
            value=${sc.duree} onInput=${e => updSeance(selSem, sc.id, 'duree', e.target.value)}
            placeholder="Durée(min)" />` :
            _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${sc.duree} min</div>`}
          ${!readOnly ? _h`<button onClick=${() => delSeance(selSem, sc.id)}
            style=${{ background:'rgba(255,68,85,.1)', border:'none', color:'#FF4455', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:10 }}>✕</button>` : null}
        </div>
        ${!readOnly ? _h`<textarea class="inp" style=${{ resize:'none', height:70, fontSize:11, marginBottom:0 }}
          value=${sc.contenu} placeholder="Contenu détaillé : exercices, séries, charges, consignes..."
          onInput=${e => updSeance(selSem, sc.id, 'contenu', e.target.value)}></textarea>` :
          sc.contenu ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.6)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>${sc.contenu}</div>` : null}
      </div>`)}
    </div>` : _h`<div style=${{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,.3)', fontSize:12 }}>
      Clique sur une semaine pour voir le détail
    </div>`}
  </div>`;
}
