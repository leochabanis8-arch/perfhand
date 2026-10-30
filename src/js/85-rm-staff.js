


function RMCalculator({ player, setDb, allPlayers }) {
  const { db } = useApp();
  const poids = (player && player.poids) || 80;
  const customMouvements = (player && player.customRM) || [];
  const mouvements = [...MOUVEMENTS_RM, ...customMouvements];
  const [showAddMvt, setShowAddMvt] = useState(false);
  const [newMvtName, setNewMvtName] = useState('');
  const [newMvtMuscles, setNewMvtMuscles] = useState('');
  const [showDupRM, setShowDupRM] = useState(false);
  const [dupTargetsRM, setDupTargetsRM] = useState([]);
  const otherPlayers = (allPlayers || []).filter(p => p && p.id && p.id !== (player && player.id));

  function writeCustomRMDirect(targetId, list, basePath) {
    // Écriture isolée sur le chemin customRM uniquement (pas tout le profil) — évite toute
    // collision avec une autre synchronisation du profil qui pourrait écraser l'ajout,
    // même risque que celui rencontré avec le wellness.
    // IMPORTANT — même correctif que VMA/poids : le chemin (club ou perso) est maintenant
    // passé explicitement par l'appelant, qui SAIT structurellement dans quelle liste il se
    // trouve, plutôt que déduit d'une variable globale (window.__perfhand_current_profiles)
    // qui pouvait être absente ou périmée au moment de l'appel.
    if (!window.__perfhand_db || !targetId || !basePath) return;
    let safeList; try { safeList = JSON.parse(JSON.stringify(list)); } catch(e) { safeList = list; }
    window.__perfhand_db.ref(basePath + targetId + '/customRM').set(safeList)
      .then(() => console.log('[customRM] ✅ écrit pour', targetId, '(' + basePath + ')'))
      .catch(function(e){ console.error('[customRM] ❌ écriture refusée:', e && e.code, e && e.message); });
  }

  function saveCustomList(list) {
    const isPersoNow = !!(db.playersPerso && db.playersPerso.find(p => p.id === player.id));
    writeCustomRMDirect(player.id, list, isPersoNow ? 'perfhand/playersPerso/' : 'perfhand/playerProfiles/');
    setDb(d => {
      const isPerso = d.playersPerso && d.playersPerso.find(p => p.id === player.id);
      if (isPerso) {
        return { ...d, playersPerso: d.playersPerso.map(p => p.id === player.id ? { ...p, customRM: list } : p) };
      }
      return { ...d, playerProfiles: (d.playerProfiles||[]).map(p => p.id === player.id ? { ...p, customRM: list } : p) };
    });
  }

  function dupliquerMouvementsVers(targetIds) {
    setDb(d => {
      const nextProfiles = (d.playerProfiles||[]).map(p => {
        if (!targetIds.includes(p.id)) return p;
        const merged = [...(p.customRM||[]), ...customMouvements.filter(cm => !(p.customRM||[]).some(ex => ex.label === cm.label))];
        writeCustomRMDirect(p.id, merged, 'perfhand/playerProfiles/');
        return { ...p, customRM: merged };
      });
      const nextPerso = (d.playersPerso||[]).map(p => {
        if (!targetIds.includes(p.id)) return p;
        const merged = [...(p.customRM||[]), ...customMouvements.filter(cm => !(p.customRM||[]).some(ex => ex.label === cm.label))];
        writeCustomRMDirect(p.id, merged, 'perfhand/playersPerso/');
        return { ...p, customRM: merged };
      });
      return { ...d, playerProfiles: nextProfiles, playersPerso: nextPerso };
    });
  }

  function addMouvement() {
    if (!newMvtName.trim()) return;
    const palette = ['#7C6FFF','#4CAF50','#EC4899','#FFB800','#22D3EE'];
    const newMvt = {
      id: 'custom_' + Date.now(),
      label: newMvtName.trim(),
      emoji: '🎯',
      color: palette[customMouvements.length % palette.length],
      muscles: newMvtMuscles.trim() || 'Personnalisé',
      note: '',
      custom: true,
    };
    saveCustomList([...customMouvements, newMvt]);
    setMesures(m => ({ ...m, [newMvt.id]: { poidsTest:'', repsTest:'', rm1Calc:0, rm1Manuel:'' } }));
    setNewMvtName(''); setNewMvtMuscles(''); setShowAddMvt(false);
  }

  function renameMouvement(id) {
    const cur = customMouvements.find(m => m.id === id);
    if (!cur) return;
    const nom = window.prompt('Nouveau nom du mouvement :', cur.label || '');
    if (nom == null) return;
    const n = nom.trim();
    if (!n || n === cur.label) return;
    const mus = window.prompt('Muscles travaillés (laisser tel quel ou modifier) :', cur.muscles || '');
    saveCustomList(customMouvements.map(m => m.id === id ? { ...m, label: n, muscles: (mus == null ? m.muscles : (mus.trim() || m.muscles || 'Personnalisé')) } : m));
  }

  function removeMouvement(id) {
    if (!confirm('Retirer ce mouvement du calculateur ? (son historique 1RM est conservé, juste plus affiché ici)')) return;
    saveCustomList(customMouvements.filter(m => m.id !== id));
  }

  // State: mesures (poids soulevé + reps) par mouvement
  const initMesures = {};
  mouvements.forEach(m => {
    const hist = (player && player.rmHistory && player.rmHistory[m.id]) || [];
    const last  = hist.length > 0 ? hist[hist.length-1] : null;
    initMesures[m.id] = { poidsTest:'', repsTest:'', rm1Calc:0, rm1Manuel: last ? String(last.rm) : '' };
  });
  const [mesures, setMesures] = useState(initMesures);
  const [increment, setIncrement] = useState(2.5);
  const [cycle, setCycle] = useState('force');
  const [expanded, setExpanded] = useState(null);
  const [savedMsg, setSavedMsg] = useState({});

  function updMesure(id, field, val) {
    setMesures(m => {
      const base = m[id] || { poidsTest:'', repsTest:'', rm1Calc:0, rm1Manuel:'' };
      const nm = { ...m, [id]: { ...base, [field]: val } };
      const p = parseFloat(nm[id].poidsTest) || 0;
      const r = parseFloat(nm[id].repsTest)  || 0;
      if (p > 0 && r > 0) {
        nm[id].rm1Calc = Math.round(p * (1 + r/40) * 10) / 10;
      }
      return nm;
    });
  }

  function saveRM(id) {
    const rm = get1RM(id);
    if (!rm || !setDb) return;
    const entry = { date: localDateStr(), rm };
    setDb(d => {
      const isPerso = d.playersPerso && d.playersPerso.find(p => p.id === player.id);
      const hist = [...((player.rmHistory && player.rmHistory[id]) || []), entry];
      const newRmHistory = { ...(player.rmHistory||{}), [id]: hist };
      if (window.__perfhand_db && player.id) {
        const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
        let safe; try { safe = JSON.parse(JSON.stringify(newRmHistory)); } catch(e) { safe = newRmHistory; }
        window.__perfhand_db.ref(path + player.id + '/rmHistory').set(safe);
      }
      if (isPerso) {
        return { ...d, playersPerso: d.playersPerso.map(p => p.id === player.id ? { ...p, rmHistory: newRmHistory } : p) };
      }
      return { ...d, playerProfiles: (d.playerProfiles||[]).map(p => p.id === player.id ? { ...p, rmHistory: newRmHistory } : p) };
    });
    setSavedMsg(m => ({ ...m, [id]: rm }));
    setTimeout(() => setSavedMsg(m => { const n={...m}; delete n[id]; return n; }), 2500);
  }

  function get1RM(id) {
    const m = mesures[id] || { rm1Manuel:'', rm1Calc:0 };
    if (m.rm1Manuel) return parseFloat(m.rm1Manuel) || 0;
    return m.rm1Calc || 0;
  }

  function roundToIncrement(val, inc) {
    return Math.round(val / inc) * inc;
  }

  function getCharges(id) {
    const rm = get1RM(id);
    if (!rm) return null;
    const cyc = CYCLES_CHARGES.find(c=>c.id===cycle);
    const mainWeight = roundToIncrement(rm * cyc.pct / 100, increment);
    // Generate progression: current - 2 incréments, current - 1, current, + progression
    return {
      echauffement: [
        roundToIncrement(rm * 0.40, increment),
        roundToIncrement(rm * 0.55, increment),
        roundToIncrement(rm * 0.70, increment),
      ],
      principal: mainWeight,
      serie1: roundToIncrement(mainWeight * 0.90, increment),
      serie2: roundToIncrement(mainWeight * 0.95, increment),
      serie3: mainWeight,
      nextSession: roundToIncrement(mainWeight + increment, increment),
      nextNextSession: roundToIncrement(mainWeight + increment * 2, increment),
      ratio: rm / poids,
    };
  }

  const cyc = CYCLES_CHARGES.find(c=>c.id===cycle);

  return _h`<div>
    <!-- Header config -->
    <div class="card" style=${{ marginBottom:16 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style=${{ fontSize:13, fontWeight:700, marginBottom:4 }}>🧮 Calculateur 1RM — Formule O'Connor</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>1RM = Poids soulevé × (1 + Reps / 40) · Joueur: ${poids} kg</div>
        </div>
        <!-- Incrément -->
        <div>
          <div class="lbl" style=${{ marginBottom:6 }}>Incrément barres</div>
          <div style=${{ display:'flex', gap:6 }}>
            ${[2.5, 5].map(inc => _h`<button key=${inc}
              onClick=${()=>setIncrement(inc)}
              style=${{ padding:'6px 14px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:increment===inc?700:400,
                border:'1px solid '+(increment===inc?'#FFA420':'rgba(255,255,255,.1)'),
                background:increment===inc?'rgba(255,164,32,.15)':'rgba(255,255,255,.04)',
                color:increment===inc?'#FFA420':'rgba(255,255,255,.4)' }}>
              +${inc} kg
            </button>`)}
          </div>
        </div>
      </div>

      <!-- Cycle -->
      <div style=${{ marginTop:14 }}>
        <div class="lbl" style=${{ marginBottom:8 }}>Cycle d'entraînement</div>
        <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
          ${CYCLES_CHARGES.map(cy => _h`<button key=${cy.id}
            onClick=${()=>setCycle(cy.id)}
            style=${{ padding:'7px 14px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:cycle===cy.id?700:400,
              border:'1px solid '+(cycle===cy.id?'rgba(255,164,32,.5)':'rgba(255,255,255,.1)'),
              background:cycle===cy.id?'rgba(255,164,32,.12)':'rgba(255,255,255,.04)',
              color:cycle===cy.id?'#FFA420':'rgba(255,255,255,.4)' }}>
            ${cy.label} — ${cy.pct}%
          </button>`)}
        </div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:6 }}>${cyc.desc} · ${cyc.reps} reps · Repos ${cyc.repos}</div>
      </div>
    </div>

    <!-- Mouvements -->
    ${mouvements.map(m => {
      const mes   = mesures[m.id] || { poidsTest:'', repsTest:'', rm1Calc:0, rm1Manuel:'' };
      const rm    = get1RM(m.id);
      const chg   = getCharges(m.id);
      const ratio = rm > 0 ? Math.round(rm/poids*100)/100 : null;
      const isExp = expanded === m.id;

      return _h`<div key=${m.id} style=${{
        background: isExp?m.color+'08':'rgba(255,255,255,.025)',
        border:'2px solid '+(isExp?m.color+'50':'rgba(255,255,255,.07)'),
        borderRadius:14, marginBottom:10, overflow:'hidden'
      }}>
        <!-- Header cliquable -->
        <div style=${{ padding:'14px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
          onClick=${()=>setExpanded(isExp?null:m.id)}>
          <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
            ${m.custom ? _h`<button title="Retirer ce mouvement" onClick=${(e)=>{e.stopPropagation(); removeMouvement(m.id);}}
              style=${{ background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.3)', color:'#FF4455', borderRadius:6, padding:'2px 7px', fontSize:11, cursor:'pointer', marginRight:2 }}>×</button>` : null}
            ${m.custom ? _h`<button title="Renommer ce mouvement" onClick=${(e)=>{e.stopPropagation(); renameMouvement(m.id);}}
              style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', borderRadius:6, padding:'2px 7px', fontSize:11, cursor:'pointer', marginRight:2 }}>✏️</button>` : null}
            <span style=${{ fontSize:20 }}>${m.emoji}</span>
            <div>
              <div style=${{ fontSize:14, fontWeight:700 }}>${m.label}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:1 }}>${m.muscles}</div>
            </div>
          </div>
          <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
            ${rm>0 ? _h`<div style=${{ textAlign:'right' }}>
              <div style=${{ fontSize:24, fontWeight:800, color:m.color, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${rm} kg</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${ratio}× PC</div>
            </div>` : _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Non mesuré</div>`}
            <div style=${{ color:'rgba(255,255,255,.3)' }}>${isExp?'▲':'▼'}</div>
          </div>
        </div>

        ${isExp && _h`<div style=${{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,.07)' }}>

          <!-- Saisie test O'Connor -->
          <div style=${{ marginBottom:16, marginTop:14, background:'rgba(255,255,255,.04)', borderRadius:11, padding:'12px 14px' }}>
            <div style=${{ fontSize:11, fontWeight:700, color:m.color, marginBottom:10 }}>Calcul O'Connor — Saisir une série sous-maximale</div>
            <div style=${{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
              <div style=${{ flex:1, minWidth:100 }}>
                <div class="lbl">Poids soulevé (kg)</div>
                <input class="inp" type="number" value=${mes.poidsTest}
                  onInput=${e=>updMesure(m.id,'poidsTest',e.target.value)}
                  placeholder="Ex: 80"/>
              </div>
              <div style=${{ flex:1, minWidth:100 }}>
                <div class="lbl">Répétitions réalisées</div>
                <input class="inp" type="number" value=${mes.repsTest}
                  onInput=${e=>updMesure(m.id,'repsTest',e.target.value)}
                  placeholder="Ex: 8"/>
              </div>
              ${mes.rm1Calc>0 ? _h`<div style=${{ background:m.color+'15', border:'1px solid '+m.color+'40', borderRadius:10, padding:'10px 14px', textAlign:'center', flexShrink:0 }}>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.5)', marginBottom:2 }}>1RM calculé</div>
                <div style=${{ fontSize:22, fontWeight:800, color:m.color, fontFamily:"'Barlow Condensed',sans-serif" }}>${mes.rm1Calc} kg</div>
              </div>` : null}
            </div>
            <div style=${{ marginTop:10 }}>
              <div class="lbl">Ou saisir le 1RM réel testé</div>
              <div style=${{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <input class="inp" type="number" value=${mes.rm1Manuel}
                  onInput=${e=>updMesure(m.id,'rm1Manuel',e.target.value)}
                  placeholder="1RM direct (prioritaire si renseigné)"
                  style=${{ maxWidth:160 }}/>
                ${get1RM(m.id) > 0 ? _h`<button
                  onClick=${()=>saveRM(m.id)}
                  style=${{ padding:'9px 16px', borderRadius:9, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700,
                    border:'1px solid '+(savedMsg[m.id]?'rgba(76,175,80,.5)':'rgba(255,164,32,.4)'),
                    background:savedMsg[m.id]?'rgba(76,175,80,.15)':'rgba(255,164,32,.15)',
                    color:savedMsg[m.id]?'#4CAF50':'#FFA420', whiteSpace:'nowrap', transition:'all .2s' }}>
                  ${savedMsg[m.id] ? '✓ Enregistré — '+savedMsg[m.id]+' kg' : '💾 Enregistrer le 1RM'}
                </button>` : null}
              </div>
            </div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:6 }}>
              Formule O'Connor: 1RM = ${mes.poidsTest||'P'} × (1 + ${mes.repsTest||'R'}/40)
            </div>
          </div>

          <!-- Historique 1RM -->
          ${(() => {
            const hist = (player.rmHistory && player.rmHistory[m.id]) || [];
            if (hist.length === 0) return null;
            const maxRM = Math.max(...hist.map(h=>h.rm));
            return _h`<div style=${{ marginBottom:16, background:'rgba(255,255,255,.03)', borderRadius:11, padding:'12px 14px' }}>
              <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>
                📈 Historique 1RM — ${hist.length} mesure${hist.length>1?'s':''}
              </div>
              <div style=${{ display:'flex', gap:6, alignItems:'flex-end', marginBottom:8, overflowX:'auto' }}>
                ${hist.slice(-8).map((h,i,arr) => {
                  const realIdx = hist.length - Math.min(hist.length,8) + i;
                  const pct = maxRM > 0 ? h.rm/maxRM : 0;
                  const isLast = i === Math.min(hist.length,8)-1;
                  return _h`<div key=${i} style=${{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:'0 0 auto', position:'relative' }}>
                    <div style=${{ fontSize:10, fontWeight:700, color:isLast?m.color:'rgba(255,255,255,.5)' }}>${h.rm}</div>
                    <div style=${{ width:32, height:Math.max(20, Math.round(pct*60))+'px', borderRadius:'4px 4px 2px 2px',
                      background:isLast?m.color:'rgba(255,255,255,.15)', transition:'height .3s', position:'relative' }}>
                      <button onClick=${() => {
                        if (!confirm('Supprimer cette mesure (' + h.rm + 'kg) ?')) return;
                        const newHist = [...((player.rmHistory && player.rmHistory[m.id]) || [])];
                        newHist.splice(realIdx, 1);
                        const newRmHistory = { ...(player.rmHistory||{}), [m.id]: newHist };
                        if (window.__perfhand_db && player.id) {
                          const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
                          let safe; try { safe = JSON.parse(JSON.stringify(newRmHistory)); } catch(e) { safe = newRmHistory; }
                          window.__perfhand_db.ref(path + player.id + '/rmHistory').set(safe);
                        }
                        setDb(d => {
                          function updateEntry(p) { return p.id === player.id ? { ...p, rmHistory: newRmHistory } : p; }
                          return { ...d,
                            playersPerso: (d.playersPerso||[]).map(updateEntry),
                            playerProfiles: (d.playerProfiles||[]).map(updateEntry)
                          };
                        });
                      }} style=${{
                        position:'absolute', top:-8, right:-6, width:16, height:16,
                        borderRadius:'50%', background:'#FF4455', border:'none',
                        color:'#fff', fontSize:9, cursor:'pointer', display:'flex',
                        alignItems:'center', justifyContent:'center', lineHeight:1, padding:0
                      }}>×</button>
                    </div>
                    <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', whiteSpace:'nowrap' }}>${h.date.slice(5)}</div>
                  </div>`;
                })}
              </div>
              ${hist.length >= 2 ? _h`<div style=${{ fontSize:11, color: hist[hist.length-1].rm >= hist[hist.length-2].rm ? '#4CAF50' : '#FF7A00' }}>
                ${hist[hist.length-1].rm >= hist[hist.length-2].rm
                  ? '↑ +' + Math.round((hist[hist.length-1].rm - hist[hist.length-2].rm)*10)/10 + ' kg vs mesure précédente'
                  : '↓ ' + Math.round((hist[hist.length-1].rm - hist[hist.length-2].rm)*10)/10 + ' kg vs mesure précédente'}
              </div>` : null}
            </div>`;
          })()}

          <!-- Recommandations charges -->
          ${chg ? _h`<div>
            <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>
              Charges recommandées — ${cyc.label} (${cyc.pct}%) · Incrément +${increment}kg
            </div>

            <!-- Échauffement -->
            <div style=${{ marginBottom:12 }}>
              <div class="lbl" style=${{ marginBottom:6 }}>Échauffement progressif</div>
              <div style=${{ display:'flex', gap:6 }}>
                ${chg.echauffement.map((kg,i) => _h`<div key=${i} style=${{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:9, padding:'8px', textAlign:'center' }}>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>S${i+1} · ${[40,55,70][i]}%</div>
                  <div style=${{ fontSize:16, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${kg} kg</div>
                  <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>5-8 reps</div>
                </div>`)}
              </div>
            </div>

            <!-- Séries de travail -->
            <div style=${{ marginBottom:14 }}>
              <div class="lbl" style=${{ marginBottom:6 }}>Séries de travail — ${cyc.reps} reps · Repos ${cyc.repos}</div>
              <div style=${{ display:'flex', gap:6 }}>
                ${[
                  { label:'Série 1', kg:chg.serie1, pct:Math.round(cyc.pct*0.90) },
                  { label:'Série 2', kg:chg.serie2, pct:Math.round(cyc.pct*0.95) },
                  { label:'Série 3', kg:chg.serie3, pct:cyc.pct },
                ].map((s,i) => _h`<div key=${i} style=${{
                  flex:1, background:i===2?m.color+'15':'rgba(255,255,255,.04)',
                  border:'1px solid '+(i===2?m.color+'40':'rgba(255,255,255,.08)'),
                  borderRadius:9, padding:'10px', textAlign:'center'
                }}>
                  <div style=${{ fontSize:10, color:i===2?m.color:'rgba(255,255,255,.35)' }}>${s.label} · ${s.pct}%</div>
                  <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:i===2?m.color:'#fff' }}>${s.kg} kg</div>
                </div>`)}
              </div>
            </div>

            <!-- Progression future -->
            <div style=${{ background:'rgba(76,175,80,.06)', border:'1px solid rgba(76,175,80,.2)', borderRadius:10, padding:'10px 14px' }}>
              <div style=${{ fontSize:11, fontWeight:700, color:'#4CAF50', marginBottom:6 }}>📈 Progression recommandée</div>
              <div style=${{ display:'flex', gap:16 }}>
                <div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Prochaine séance</div>
                  <div style=${{ fontSize:16, fontWeight:800, color:'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif" }}>+${increment}kg → ${chg.nextSession} kg</div>
                </div>
                <div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Dans 2 séances</div>
                  <div style=${{ fontSize:16, fontWeight:800, color:'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif" }}>+${increment*2}kg → ${chg.nextNextSession} kg</div>
                </div>
              </div>
            </div>
          </div>` : _h`<div style=${{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,.3)', fontSize:12 }}>
            Saisir un poids et des reps pour obtenir les recommandations.
          </div>`}
        </div>`}
      </div>`;
    })}

    <!-- Ajouter un mouvement -->
    ${!showAddMvt ? _h`<button class="btn" style=${{ width:'100%', background:'rgba(124,111,255,.1)', border:'1px solid rgba(124,111,255,.3)', color:'#7C6FFF', fontWeight:700 }}
      onClick=${()=>setShowAddMvt(true)}>+ Ajouter un mouvement</button>`
    : _h`<div class="card" style=${{ border:'1px solid rgba(124,111,255,.3)' }}>
        <div style=${{ fontSize:13, fontWeight:700, marginBottom:10 }}>Nouveau mouvement</div>
        <div style=${{ marginBottom:10 }}>
          <div class="lbl" style=${{ marginBottom:4 }}>Nom du mouvement *</div>
          <input class="inp" value=${newMvtName} onInput=${e=>setNewMvtName(e.target.value)} placeholder="Ex: Développé militaire, Traction lestée..."/>
        </div>
        <div style=${{ marginBottom:12 }}>
          <div class="lbl" style=${{ marginBottom:4 }}>Muscles ciblés (optionnel)</div>
          <input class="inp" value=${newMvtMuscles} onInput=${e=>setNewMvtMuscles(e.target.value)} placeholder="Ex: Épaules, Triceps"/>
        </div>
        <div style=${{ display:'flex', gap:8 }}>
          <button class="btn" style=${{ flex:1, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
            onClick=${()=>{ setShowAddMvt(false); setNewMvtName(''); setNewMvtMuscles(''); }}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} disabled=${!newMvtName.trim()} onClick=${addMouvement}>✓ Ajouter</button>
        </div>
      </div>`}

    <!-- Dupliquer les mouvements perso vers d'autres joueurs -->
    ${customMouvements.length > 0 && otherPlayers.length > 0 ? _h`<div style=${{ marginTop:10 }}>
      ${!showDupRM ? _h`<button class="btn" style=${{ width:'100%', background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700 }}
        onClick=${()=>{ setShowDupRM(true); setDupTargetsRM([]); }}>📋 Dupliquer ${customMouvements.length>1?'ces mouvements':'ce mouvement'} vers d'autres joueurs</button>`
      : _h`<div class="card" style=${{ border:'1px solid rgba(76,175,80,.3)' }}>
          <div style=${{ fontSize:12, fontWeight:700, color:'#4CAF50', marginBottom:8 }}>Dupliquer : ${customMouvements.map(m=>m.label).join(', ')}</div>
          <div style=${{ display:'flex', flexWrap:'wrap', gap:5, maxHeight:180, overflowY:'auto', marginBottom:10, padding:'8px', background:'rgba(0,0,0,.15)', borderRadius:8 }}>
            ${otherPlayers.map(p => _h`<button key=${p.id}
              onClick=${() => setDupTargetsRM(t => t.includes(p.id) ? t.filter(x=>x!==p.id) : [...t,p.id])}
              style=${{ fontSize:11, padding:'4px 10px', borderRadius:14, border:'1px solid '+(dupTargetsRM.includes(p.id)?'rgba(76,175,80,.5)':'rgba(255,255,255,.1)'),
                background: dupTargetsRM.includes(p.id)?'rgba(76,175,80,.2)':'rgba(255,255,255,.03)',
                color: dupTargetsRM.includes(p.id)?'#4CAF50':'rgba(255,255,255,.5)', fontWeight: dupTargetsRM.includes(p.id)?700:400 }}>${p.name}</button>`)}
          </div>
          <div style=${{ display:'flex', gap:8 }}>
            <button class="btn btn-sm" style=${{ flex:1, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
              onClick=${()=>setShowDupRM(false)}>Annuler</button>
            <button class="btn btn-sm" style=${{ flex:2, background:'#4CAF50', color:'#000', fontWeight:800 }}
              disabled=${dupTargetsRM.length===0}
              onClick=${() => {
                dupliquerMouvementsVers(dupTargetsRM);
                setShowDupRM(false);
                alert('✅ Mouvement(s) dupliqué(s) vers ' + dupTargetsRM.length + ' joueur(s) ! (charges/RM à saisir pour chacun)');
                setDupTargetsRM([]);
              }}>✓ Dupliquer vers ${dupTargetsRM.length} joueur${dupTargetsRM.length>1?'s':''}</button>
          </div>
        </div>`}
    </div>` : null}
  </div>`;
}


function StaffView() {
  const { db, setDb } = useApp();
  const staff = db.staff || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'coach', poste:'', club:'usm', phone:'', notes:'' });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));

  const ROLES = [
    { id:'coach',  label:'Entraîneur principal', icon:'🎯', color:'#7C6FFF' },
    { id:'pp',     label:'Prépa physique',        icon:'💪', color:'#FF4455' },
    { id:'kine',   label:'Kinésithérapeute',      icon:'🩺', color:'#4CAF50' },
    { id:'adjoint',label:'Entraîneur adjoint',    icon:'🤝', color:'#38BDF8' },
  ];

  function saveStaff() {
    if (!form.name || !form.email) return;
    const member = {
      ...sansMdp(form),
      id: editStaff?.id || 'staff-'+Date.now(),
      email: form.email.replace(/\s/g,'').toLowerCase(),
      createdAt: editStaff?.createdAt || localDateStr(),
    };
    setDb(d => ({
      ...d,
      staff: editStaff
        ? (d.staff||[]).map(s => s.id===editStaff.id ? member : s)
        : [...(d.staff||[]), member]
    }));
    setForm({ name:'', email:'', password:'', role:'coach', poste:'', club:'usm', phone:'', notes:'' });
    setShowAdd(false);
    setEditStaff(null);
  }

  function deleteStaff(id) {
    if (confirm('Supprimer ce membre du staff ?'))
      setDb(d => ({ ...d, staff: (d.staff||[]).filter(s=>s.id!==id) }));
  }

  function startEdit(s) {
    setForm({ name:s.name, email:s.email, password:'', role:s.role, poste:s.poste||'', club:s.club||'usm', phone:s.phone||'', notes:s.notes||'' });
    setEditStaff(s);
    setShowAdd(true);
  }

  return _h`<div class="page-pad">
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
      <div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2.5, textTransform:'uppercase', marginBottom:4 }}>Administration</div>
        <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800 }}>STAFF & ENCADREMENT</h1>
      </div>
      <button class="btn btn-primary" onClick=${()=>{ setShowAdd(true); setEditStaff(null); setForm({name:'',email:'',password:'',role:'coach',poste:'',club:'usm',phone:'',notes:''}); }}>+ Ajouter</button>
    </div>

    <!-- Rôles stats -->
    <div class="grid-4" style=${{ marginBottom:18 }}>
      ${ROLES.map(r => _h`<div key=${r.id} class="card">
        <div style=${{ fontSize:22 }}>${r.icon}</div>
        <div style=${{ fontSize:20, fontWeight:800, color:r.color, fontFamily:"'Barlow Condensed',sans-serif" }}>
          ${staff.filter(s=>s.role===r.id).length}
        </div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1 }}>${r.label}</div>
      </div>`)}
    </div>

    <!-- Liste staff -->
    ${staff.length === 0
      ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
          Aucun membre du staff. Ajouter un coach ou préparateur physique.
        </div>`
      : _h`<div>
          ${staff.map(s => {
            const r = ROLES.find(x=>x.id===s.role)||ROLES[0];
            return _h`<div key=${s.id} style=${{
              background:'rgba(255,255,255,.025)', border:'1px solid '+r.color+'25',
              borderRadius:14, padding:'14px 18px', marginBottom:10,
              display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <div style=${{ display:'flex', alignItems:'center', gap:12 }}>
                <div style=${{ width:44, height:44, borderRadius:'50%', background:r.color+'20', border:'2px solid '+r.color+'50',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>${r.icon}</div>
                <div>
                  <div style=${{ fontSize:14, fontWeight:700 }}>${s.name}</div>
                  <div style=${{ fontSize:11, color:r.color, marginTop:1 }}>${r.label}${s.poste?' — '+s.poste:''}</div>
                  <div style=${{ display:'flex', gap:8, marginTop:4 }}>
                    <span style=${{ fontSize:11, background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.2)', borderRadius:6, padding:'2px 8px', color:'#FFA420', fontFamily:'monospace' }}>${s.email}</span>
                  </div>
                </div>
              </div>
              <div style=${{ display:'flex', gap:6 }}>
                <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}
                  onClick=${()=>startEdit(s)}>✏️</button>
                <button class="btn btn-sm btn-danger" onClick=${()=>deleteStaff(s.id)}>×</button>
              </div>
            </div>`;
          })}
        </div>`
    }

    <!-- Modal ajout/édition -->
    ${showAdd && _h`<div class="edit-modal-bg" onClick=${()=>{ setShowAdd(false); setEditStaff(null); }}>
      <div class="edit-modal" style=${{ maxWidth:500 }} onClick=${e=>e.stopPropagation()}>
        <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>${editStaff?'Modifier — '+editStaff.name:'Nouveau membre du staff'}</div>
          <button onClick=${()=>{ setShowAdd(false); setEditStaff(null); }} style=${{ background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:20,cursor:'pointer' }}>×</button>
        </div>
        <div class="edit-modal-body">
          <!-- Rôle -->
          <div style=${{ marginBottom:14 }}>
            <div class="lbl">Rôle</div>
            <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
              ${ROLES.map(r => _h`<button key=${r.id} onClick=${()=>upd('role',r.id)}
                style=${{ padding:'6px 12px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
                  border:'1px solid '+(form.role===r.id?r.color+'50':'rgba(255,255,255,.1)'),
                  background:form.role===r.id?r.color+'15':'rgba(255,255,255,.04)',
                  color:form.role===r.id?r.color:'rgba(255,255,255,.4)', fontWeight:form.role===r.id?700:400 }}>
                ${r.icon} ${r.label}
              </button>`)}
            </div>
          </div>
          <div class="edit-row">
            <div><div class="lbl">Nom complet *</div><input class="inp" value=${form.name} onInput=${e=>upd('name',e.target.value)} placeholder="Prénom Nom"/></div>
            <div><div class="lbl">Poste / spécialité</div><input class="inp" value=${form.poste} onInput=${e=>upd('poste',e.target.value)} placeholder="Ex: Défense, Force-vitesse..."/></div>
          </div>
          <div class="edit-row">
            <div><div class="lbl">Email (connexion) *</div><input class="inp" type="email" value=${form.email} onInput=${e=>upd('email',e.target.value)}/></div>
          </div>
          <div style=${{ marginBottom:10 }}><div class="lbl">Téléphone</div><input class="inp" value=${form.phone} onInput=${e=>upd('phone',e.target.value)} placeholder="+33 6 ..."/></div>
          <div><div class="lbl">Notes</div><textarea class="inp" value=${form.notes} onInput=${e=>upd('notes',e.target.value)} style=${{ resize:'vertical', minHeight:50 }} placeholder="Observations..."></textarea></div>
        </div>
        <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
          <button class="btn" style=${{ flex:1 }} onClick=${()=>{ setShowAdd(false); setEditStaff(null); }}>Annuler</button>
          <button class="btn btn-primary" style=${{ flex:2 }} onClick=${saveStaff} disabled=${!form.name||!form.email}>
            ${editStaff ? 'Enregistrer' : 'Créer le profil'}
          </button>
        </div>
      </div>
    </div>`}
  </div>`;
}



// ── CALCULATEUR 1RM — Formule O'Connor ────────────────────────────────────────
// O'Connor: 1RM = poids × (1 + reps/40)
// Recommandation charges avec incrément 2.5 ou 5kg

const MOUVEMENTS_RM = [
  { id:'squat',  label:'Back Squat',       emoji:'🏋️', color:'#FF4455',
    muscles:'Quadriceps, Fessiers, Ischio-jambiers', note:'Hauteur parallèle minimum' },
  { id:'bench',  label:'Bench Press',        emoji:'💪', color:'#FF7A00',
    muscles:'Pectoraux, Triceps, Deltoïdes antérieurs', note:'Barre en contact avec le sternum' },
  { id:'rdl',    label:'Romanian Deadlift',  emoji:'🔥', color:'#FFA420',
    muscles:'Ischio-jambiers, Fessiers, Érecteurs', note:'Genoux légèrement fléchis, dos droit' },
  { id:'rowing', label:'Rowing barre',       emoji:'⚡', color:'#38BDF8',
    muscles:'Dorsaux, Rhomboïdes, Biceps', note:'Dos parallèle au sol, coudes vers arrière' },
];

const CYCLES_CHARGES = [
  { id:'force',       label:'Force',        pct:85,  reps:'3-5',  repos:'3-4min', desc:'Charges lourdes, faible volume' },
  { id:'hyp',         label:'Hypertrophie', pct:70,  reps:'8-12', repos:'90s',    desc:'Charges modérées, volume élevé' },
  { id:'endurance',   label:'Endurance-F',  pct:55,  reps:'15-20',repos:'60s',    desc:'Charges légères, répétitions élevées' },
  { id:'puissance',   label:'Puissance',    pct:75,  reps:'4-6',  repos:'3min',   desc:'Vitesse d\'exécution maximale' },
  { id:'testing',     label:'Test 1RM',     pct:95,  reps:'1-3',  repos:'4-5min', desc:'Montée progressive vers le max' },
];
