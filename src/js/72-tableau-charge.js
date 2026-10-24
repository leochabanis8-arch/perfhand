
function ChargeDashboard({ players, clubs }) {
  if (!players || !players.length) return _h`<div style=${{ padding:40, textAlign:"center", color:"rgba(255,255,255,.3)" }}>Aucun joueur à afficher.</div>`;
  const [selP, setSelP] = useState(null);
  const [wellnessHistExp, setWellnessHistExp] = useState(null);

  // Fusionne les bilans terrain manuels avec les séances muscu/endurance déjà
  // validées par le joueur (dateFaite + RPE renseigné) — couvre aussi bien les
  // validations passées que futures, sans dépendre d'une écriture au moment
  // de la validation.
  function getAllBilans(p) {
    const terrain = (p.bilans || []).filter(b => b.type === 'Terrain');
    const muscuDerived = (p.muscuSeances || [])
      .filter(s => s.dateFaite && s.rpeReel != null)
      .map(s => {
        const duree = Math.max(30, Math.min(100, (s.exercices||[]).length * 9));
        return { date: s.dateFaite, type:'Muscu', typeSeance: s.nom, rpe: s.rpeReel, fatigue: s.fatigue || 3, chargeSession: duree * s.rpeReel };
      });
    const enduranceDerived = (p.enduranceSeances || [])
      .filter(s => s.dateFaite && s.rpeReel != null)
      .map(s => {
        const duree = s.duree || 45;
        return { date: s.dateFaite, type:'Endurance', typeSeance: s.nom, rpe: s.rpeReel, fatigue: s.fatigue || 3, chargeSession: duree * s.rpeReel };
      });
    return [...terrain, ...muscuDerived, ...enduranceDerived];
  }

  // Jours écoulés depuis une date "YYYY-MM-DD", calculé en minuit local (évite le
  // décalage horaire de new Date("YYYY-MM-DD") qui parse en UTC et peut faire
  // rater/inclure à tort une séance pile à la frontière du jour).
  function daysSince(dateStr) {
    if (!dateStr) return Infinity;
    const d = new Date(String(dateStr).slice(0,10) + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.floor((today - d) / 86400000);
  }

  // Regroupement des joueurs par club/division (N1, Prénational, etc.), réutilisé
  // par les sections Wellness du matin et Validations.
  function groupLabel(p) {
    const c = (clubs || []).find(c => c.id === p.clubId);
    return c ? (c.division || c.name) : 'Sans club';
  }
  function groupByClub(list) {
    const groups = {};
    list.forEach(p => {
      const label = groupLabel(p);
      if (!groups[label]) groups[label] = [];
      groups[label].push(p);
    });
    return groups;
  }
  function renderGrouped(list, color, bg, border) {
    const groups = groupByClub(list);
    const labels = Object.keys(groups).sort();
    return labels.map(label => _h`<div key=${label} style=${{ marginBottom:8 }}>
      <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>${label} (${groups[label].length})</div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${groups[label].map(p => _h`<span key=${p.id} style=${{ fontSize:11, padding:'3px 10px', borderRadius:20, background:bg, border:'1px solid '+border, color:color }}>${p.name}</span>`)}
      </div>
    </div>`);
  }

  function weekCharge(p) {
    return getAllBilans(p).filter(b => daysSince(b.date) <= 7)
      .reduce((s, b) => s + (b.chargeSession||0), 0);
  }
  function charge21(p) {
    return getAllBilans(p).filter(b => daysSince(b.date) <= 21)
      .reduce((s, b) => s + (b.chargeSession||0), 0);
  }
  function tendance7vs21(p) {
    const c7 = weekCharge(p);
    const c21 = charge21(p);
    if (!c7 || !c21) return null;
    const avg21 = c21 / 3; // moyenne hebdo sur 21j
    return Math.round((c7 - avg21) / avg21 * 100);
  }
  function weekRpe(p) {
    const w = getAllBilans(p).filter(b => daysSince(b.date) <= 7);
    return w.length ? Math.round(w.reduce((s, b) => s + b.rpe, 0) / w.length * 10) / 10 : null;
  }
  function weekFatigue(p) {
    const w = getAllBilans(p).filter(b => daysSince(b.date) <= 7);
    return w.length ? Math.round(w.reduce((s, b) => s + b.fatigue, 0) / w.length * 10) / 10 : null;
  }
  function getAcwr(p) {
    const acute   = getAllBilans(p).filter(b => daysSince(b.date) <= 7).reduce((s,b)=>s+(b.chargeSession||0),0);
    const chronic = getAllBilans(p).filter(b => daysSince(b.date) <= 28).reduce((s,b)=>s+(b.chargeSession||0),0) / 4;
    return chronic > 0 ? Math.round(acute/chronic*100)/100 : null;
  }
  function acwrColor(v) {
    if (!v) return 'rgba(255,255,255,.2)';
    return v < 0.8 ? '#38BDF8' : v <= 1.3 ? '#4CAF50' : v <= 1.5 ? '#FFB800' : '#FF4455';
  }
  function lastWellness(p) {
    const w = (p.bilansSem || []);
    return w.length ? w[w.length-1] : null;
  }

  const alerts = players.filter(p => {
    const acwr = getAcwr(p);
    const fat = weekFatigue(p);
    return (acwr && acwr > 1.5) || (fat && fat >= 4);
  });

  return _h`<div class="page-pad" style=${{ maxWidth:"100%", overflowX:"hidden" }}>
    <div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2.5, textTransform:'uppercase', marginBottom:4 }}>${(() => {
        const clubIds = Array.from(new Set(players.map(p => p.clubId).filter(Boolean)));
        const relevantClubs = (clubs||[]).filter(c => clubIds.includes(c.id));
        if (relevantClubs.length === 1) return relevantClubs[0].name + ' ' + (relevantClubs[0].saison || '2026-2027');
        if (relevantClubs.length > 1) return relevantClubs.map(c => c.name).join(' / ') + ' ' + (relevantClubs[0].saison || '2026-2027');
        return 'Saison ' + '2026-2027';
      })()}</div>
      <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800 }}>CHARGE & FATIGUE ÉQUIPE</h1>
    </div>

    <!-- Alertes -->
    ${alerts.length > 0 && _h`<div style=${{ background:'rgba(255,68,85,.08)', border:'1px solid rgba(255,68,85,.3)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
      <div style=${{ fontSize:12, fontWeight:700, color:'#FF4455', marginBottom:8 }}>⚠️ ${alerts.length} joueur${alerts.length>1?'s':''} en zone de risque</div>
      <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
        ${alerts.map(p => _h`<div key=${p.id} style=${{ fontSize:12, padding:'4px 12px', borderRadius:20, background:'rgba(255,68,85,.15)', color:'#FF4455', fontWeight:600 }}>${p.name}</div>`)}
      </div>
    </div>`}

    <!-- Tableau(x) équipe — groupé par club si plusieurs clubs sont représentés -->
    ${(() => {
      const tableHead = _h`<thead><tr>
        ${['Joueur','Charge 7j','Charge 21j','Tendance','ACWR','RPE moy.','Fatigue moy.','Dernière séance'].map(h =>
          _h`<th key=${h} style=${{ padding:'8px 10px', textAlign:'left', fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.06)', fontWeight:500 }}>${h}</th>`
        )}
      </tr></thead>`;

      function renderRows(list) {
        return list.map(p => {
          const charge = weekCharge(p);
          const acwr   = getAcwr(p);
          const rpe    = weekRpe(p);
          const fat    = weekFatigue(p);
          const lw     = lastWellness(p);
          const lastB  = getAllBilans(p).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-1)[0];
          const sc = STATUS_CFG[p.status] || STATUS_CFG.ok;
          return _h`<tr key=${p.id}
            style=${{ cursor:'pointer', background: selP===p.id ? 'rgba(255,164,32,.04)' : 'transparent' }}
            onClick=${() => setSelP(selP===p.id?null:p.id)}
          >
            <td style=${{ padding:'10px 10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <div style=${{ display:'flex', alignItems:'center', gap:9 }}>
                <${Avatar} name=${p.name} color=${sc.color} size=${26}/>
                <div>
                  <div style=${{ fontSize:12, fontWeight:600 }}>${p.name}</div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>${p.pos}</div>
                </div>
              </div>
            </td>
            <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:14, fontWeight:700, color: charge>2000?'#FF4455':charge>1200?'#FFB800':'rgba(255,255,255,.7)', fontFamily:"'Barlow Condensed',sans-serif" }}>
              ${charge || '—'}
            </td>
            <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:13, fontWeight:600, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif" }}>
              ${charge21(p) || '—'}
            </td>
            <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              ${(() => {
                const t = tendance7vs21(p);
                if (!t) return _h`<span style=${{ color:'rgba(255,255,255,.25)' }}>—</span>`;
                const col = t > 20 ? '#FF4455' : t > 0 ? '#FFB800' : t < -20 ? '#38BDF8' : '#4CAF50';
                return _h`<span style=${{ fontSize:12, fontWeight:800, color:col }}>${t>0?'+':''}${t}%</span>`;
              })()}
            </td>
            <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <span style=${{ fontSize:13, fontWeight:800, color:acwrColor(acwr), fontFamily:"'Barlow Condensed',sans-serif" }}>${acwr||'—'}</span>
            </td>
            <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:13, fontWeight:700, color: rpe?rpe>=8?'#FF4455':rpe>=6?'#FFB800':'#4CAF50':'rgba(255,255,255,.3)', fontFamily:"'Barlow Condensed',sans-serif" }}>
              ${rpe||'—'}
            </td>
            <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:13, fontWeight:700, color: fat?fat>=4?'#FF4455':fat>=3?'#FFB800':'#4CAF50':'rgba(255,255,255,.3)', fontFamily:"'Barlow Condensed',sans-serif" }}>
              ${fat||'—'}
            </td>
            <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:11, color:'rgba(255,255,255,.4)' }}>
              ${lastB ? lastB.type + ' · RPE ' + lastB.rpe : '—'}
            </td>
          </tr>`;
        });
      }

      function renderTable(list) {
        return _h`<div class="card" style=${{ marginBottom:16 }}>
          <div style=${{ overflowX:'auto' }}>
            <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
              ${tableHead}
              <tbody>${renderRows(list)}</tbody>
            </table>
          </div>
        </div>`;
      }

      // Si 2+ clubs sont représentés parmi les joueurs affichés, on groupe par club.
      // Sinon (vue mono-club, ex: CoachView), on garde une liste unique comme avant.
      const clubList = clubs || [];
      if (clubList.length < 2) {
        return renderTable(players);
      }
      return clubList.map(c => {
        const clubPlayers = players.filter(p => playerInClub(p, c.id));
        if (!clubPlayers.length) return null;
        return _h`<div key=${c.id}>
          <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8, marginTop: c===clubList[0]?0:6 }}>
            <div style=${{ fontSize:14, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${c.name}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>${clubPlayers.length} joueur${clubPlayers.length>1?'s':''}</div>
          </div>
          ${renderTable(clubPlayers)}
        </div>`;
      });
    })()}

    <!-- ── WELLNESS DU MATIN — AUJOURD'HUI ─────────────────────────────── -->
    ${(() => {
      const today = localDateStr();
      const rows = players.map(p => {
        const c = wellnessArr(p).find(w => w.dateRessenti === today);
        if (!c) return { player: p, status: 'manquant' };
        const alerts = [];
        if ((c.douleurs||3) <= 2) alerts.push('Douleurs');
        if ((c.energie||3) <= 2) alerts.push('Énergie basse');
        if ((c.sommeil||3) <= 2) alerts.push('Sommeil');
        if ((c.humeur||3) <= 2) alerts.push('Humeur basse');
        if ((c.stress||3) <= 2) alerts.push('Stress élevé');
        if ((c.fatigue||3) >= 4) alerts.push('Fatigue élevée');
        return { player: p, status: alerts.length ? 'alerte' : 'ok', alerts, checkin: c };
      });
      const ok = rows.filter(r => r.status === 'ok');
      const alerte = rows.filter(r => r.status === 'alerte');
      const manquant = rows.filter(r => r.status === 'manquant');

      return _h`<div class="card" style=${{ marginBottom:16 }}>
        <div style=${{ fontSize:13, fontWeight:800, marginBottom:4 }}>🌅 Wellness du matin — aujourd'hui</div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:12 }}>${ok.length + alerte.length}/${players.length} ont rempli leur questionnaire</div>

        ${alerte.length > 0 ? _h`<div style=${{ marginBottom:12 }}>
          <div style=${{ fontSize:10, color:'#FF4455', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>⚠️ À surveiller (${alerte.length})</div>
          ${(() => {
            const groups = groupByClub(alerte.map(r => r.player));
            const rowByPlayerId = {}; alerte.forEach(r => { rowByPlayerId[r.player.id] = r; });
            const dims = [
              { key:'sommeil', label:'😴 Sommeil' },
              { key:'energie', label:'⚡ Énergie' },
              { key:'douleurs', label:'🩹 Douleurs' },
              { key:'humeur', label:'🙂 Humeur' },
              { key:'stress', label:'😰 Stress' },
              { key:'fatigue', label:'🔋 Fatigue', invert:true },
            ];
            return Object.keys(groups).sort().map(label => _h`<div key=${label} style=${{ marginBottom:8 }}>
              <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>${label} (${groups[label].length})</div>
              <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
                ${groups[label].map(p => {
                  const c = rowByPlayerId[p.id].checkin;
                  return _h`<div key=${p.id} style=${{ padding:'8px 10px', background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.2)', borderRadius:8 }}>
                    <div style=${{ fontSize:12, fontWeight:700, marginBottom:5 }}>${p.name}</div>
                    <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      ${dims.map(d => {
                        const v = c[d.key];
                        const bad = d.invert ? v >= 4 : v <= 2;
                        return _h`<span key=${d.key} style=${{ fontSize:10, color: bad?'#FF4455':'rgba(255,255,255,.4)', fontWeight: bad?800:400 }}>${d.label} ${v!=null?v:'—'}/5</span>`;
                      })}
                    </div>
                    ${c.notesJoueur ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:5, fontStyle:'italic' }}>"${c.notesJoueur}"</div>` : null}
                  </div>`;
                })}
              </div>
            </div>`);
          })()}
        </div>` : null}

        <div style=${{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <div style=${{ flex:1, minWidth:180 }}>
            <div style=${{ fontSize:10, color:'#4CAF50', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>✓ RAS (${ok.length})</div>
            ${ok.length > 0 ? renderGrouped(ok.map(r=>r.player), '#4CAF50', 'rgba(76,175,80,.1)', 'rgba(76,175,80,.3)')
              : _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.2)', fontStyle:'italic' }}>Personne</span>`}
          </div>
          <div style=${{ flex:1, minWidth:180 }}>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>✕ Pas rempli (${manquant.length})</div>
            ${manquant.length > 0 ? renderGrouped(manquant.map(r=>r.player), 'rgba(255,255,255,.5)', 'rgba(255,255,255,.04)', 'rgba(255,255,255,.12)')
              : _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.2)', fontStyle:'italic' }}>Tout le monde a rempli</span>`}
          </div>
        </div>
      </div>`;
    })()}

    <!-- ── HISTORIQUE WELLNESS — COMPARAISON DANS LE TEMPS ─────────────── -->
    ${(() => {
      const today = new Date();
      const dateNJours = (n) => { const d = new Date(today); d.setDate(d.getDate()-n); return localDateStr(d); };
      const dims = [
        { key:'sommeil', label:'😴 Sommeil' },
        { key:'energie', label:'⚡ Énergie' },
        { key:'douleurs', label:'🩹 Douleurs' },
        { key:'humeur', label:'🙂 Humeur' },
        { key:'stress', label:'😰 Stress' },
        { key:'fatigue', label:'🔋 Fatigue', invert:true },
      ];
      function scoreOf(c) {
        if (!c) return null;
        return Math.round(((c.douleurs||0)+(c.energie||0)+(c.sommeil||0)+(c.humeur||0)+(c.stress||0)) / 5); // wellness quotidien uniquement
      }
      function checkinAt(p, dateStr) {
        return wellnessArr(p).find(w => w.dateRessenti === dateStr) || null;
      }
      const playersAvecHistorique = players.filter(p => wellnessArr(p).length > 0).sort((a,b)=>a.name.localeCompare(b.name));
      if (playersAvecHistorique.length === 0) return null;

      return _h`<div class="card" style=${{ marginBottom:16 }}>
        <div style=${{ fontSize:13, fontWeight:800, marginBottom:4 }}>📊 Historique wellness — comparaison</div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:12 }}>Score global /5 · aujourd'hui vs hier vs avant-hier — clique un joueur pour le détail complet</div>

        <div style=${{ display:'grid', gridTemplateColumns:'1.6fr 0.7fr 0.7fr 0.7fr', gap:6, padding:'0 4px 8px', fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div>Joueur</div>
          <div style=${{ textAlign:'center' }}>Auj.</div>
          <div style=${{ textAlign:'center' }}>Hier</div>
          <div style=${{ textAlign:'center' }}>Av-hier</div>
        </div>

        <div style=${{ display:'flex', flexDirection:'column' }}>
          ${playersAvecHistorique.map(p => {
            const isExp = wellnessHistExp === p.id;
            const cJ0 = checkinAt(p, dateNJours(0));
            const cJ1 = checkinAt(p, dateNJours(1));
            const cJ2 = checkinAt(p, dateNJours(2));
            const sJ0 = scoreOf(cJ0), sJ1 = scoreOf(cJ1), sJ2 = scoreOf(cJ2);
            const colFor = s => s === null ? 'rgba(255,255,255,.15)' : (s >= 4 ? '#4CAF50' : s === 3 ? '#FFA420' : '#FF4455');
            const histoire = wellnessArr(p).sort((a,b)=>(a.dateRessenti||'').localeCompare(b.dateRessenti||'')).slice(-14).reverse();
            return _h`<div key=${p.id}>
              <div onClick=${() => setWellnessHistExp(isExp ? null : p.id)} style=${{
                display:'grid', gridTemplateColumns:'1.6fr 0.7fr 0.7fr 0.7fr', gap:6, alignItems:'center',
                padding:'8px 4px', borderBottom:'1px solid rgba(255,255,255,.05)', cursor:'pointer'
              }}>
                <div style=${{ fontSize:12, fontWeight:700 }}>${p.name}</div>
                <div style=${{ textAlign:'center', fontSize:13, fontWeight:800, color:colFor(sJ0) }}>${sJ0!==null?sJ0:'—'}</div>
                <div style=${{ textAlign:'center', fontSize:13, fontWeight:800, color:colFor(sJ1) }}>${sJ1!==null?sJ1:'—'}</div>
                <div style=${{ textAlign:'center', fontSize:13, fontWeight:800, color:colFor(sJ2) }}>${sJ2!==null?sJ2:'—'}</div>
              </div>
              ${isExp ? _h`<div style=${{ padding:'8px 10px 14px', background:'rgba(255,255,255,.02)' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Derniers jours — détail</div>
                <div style=${{ display:'flex', flexDirection:'column', gap:5 }}>
                  ${histoire.map((c, i) => _h`<div key=${i} style=${{ padding:'7px 10px', background:'rgba(255,255,255,.03)', borderRadius:8 }}>
                    <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.6)' }}>${fmtDateShort(c.dateRessenti)}</span>
                      <span style=${{ fontSize:12, fontWeight:800, color:colFor(scoreOf(c)) }}>${scoreOf(c)}/5</span>
                    </div>
                    <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      ${dims.map(d => {
                        const v = c[d.key];
                        const bad = d.invert ? v >= 4 : v <= 2;
                        return _h`<span key=${d.key} style=${{ fontSize:9, color: bad?'#FF4455':'rgba(255,255,255,.35)', fontWeight: bad?700:400 }}>${d.label} ${v!=null?v:'—'}</span>`;
                      })}
                    </div>
                    ${c.notesJoueur ? _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:4, fontStyle:'italic' }}>"${c.notesJoueur}"</div>` : null}
                  </div>`)}
                </div>
              </div>` : null}
            </div>`;
          })}
        </div>
      </div>`;
    })()}

    <!-- ── VALIDATIONS — 14 DERNIERS JOURS ─────────────────────────────── -->
    ${(() => {
      const recentEntries = [];
      players.forEach(p => {
        getAllBilans(p).forEach(b => {
          if (daysSince(b.date) <= 14) {
            recentEntries.push({ ...b, playerName: p.name, playerId: p.id });
          }
        });
      });
      recentEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

      const validatedIds = new Set(recentEntries.map(e => e.playerId));
      const ontValide = players.filter(p => validatedIds.has(p.id));
      const rienValide = players.filter(p => !validatedIds.has(p.id));

      return _h`<div class="card" style=${{ marginBottom:16 }}>
        <div style=${{ fontSize:13, fontWeight:800, marginBottom:12 }}>📋 Validations — 14 derniers jours</div>

        <div style=${{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
          <div style=${{ flex:1, minWidth:200 }}>
            <div style=${{ fontSize:10, color:'#4CAF50', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>✓ Ont validé (${ontValide.length})</div>
            ${ontValide.length > 0 ? renderGrouped(ontValide, '#4CAF50', 'rgba(76,175,80,.1)', 'rgba(76,175,80,.3)')
              : _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.2)', fontStyle:'italic' }}>Personne</span>`}
          </div>
          <div style=${{ flex:1, minWidth:200 }}>
            <div style=${{ fontSize:10, color:'#FF4455', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>✕ Rien validé (${rienValide.length})</div>
            ${rienValide.length > 0 ? renderGrouped(rienValide, '#FF4455', 'rgba(255,68,85,.08)', 'rgba(255,68,85,.25)')
              : _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.2)', fontStyle:'italic' }}>Tout le monde a validé</span>`}
          </div>
        </div>

        ${recentEntries.length > 0 ? _h`<div style=${{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:12 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>${recentEntries.length} séance${recentEntries.length>1?'s':''} validée${recentEntries.length>1?'s':''}</div>
          <div style=${{ display:'flex', flexDirection:'column', gap:5, maxHeight:340, overflowY:'auto' }}>
            ${recentEntries.map((e, i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', background:'rgba(255,255,255,.02)', borderRadius:8, flexWrap:'wrap', gap:6 }}>
              <div style=${{ display:'flex', gap:8, alignItems:'center' }}>
                <span style=${{ fontSize:11, fontWeight:700 }}>${e.playerName}</span>
                <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${e.type || ''}${e.typeSeance ? ' · ' + e.typeSeance : ''}</span>
              </div>
              <div style=${{ display:'flex', gap:10, alignItems:'center' }}>
                <span style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>${(() => { try { return new Date(e.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}); } catch(err) { return e.date; } })()}</span>
                <span style=${{ fontSize:11, fontWeight:800, color: e.rpe>=8?'#FF4455':e.rpe>=6?'#FFB800':'#4CAF50' }}>RPE ${e.rpe}</span>
              </div>
            </div>`)}
          </div>
        </div>` : _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.25)', fontStyle:'italic', borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:12 }}>Aucune séance validée sur cette période.</div>`}
      </div>`;
    })()}
    <div style=${{ display:'flex', gap:8, flexWrap:'wrap', fontSize:11, marginBottom:24 }}>
      <div style=${{ fontWeight:700, color:'rgba(255,255,255,.4)', marginRight:4 }}>ACWR :</div>
      ${[['< 0.8 Sous-charge','#38BDF8'],['0.8–1.3 Zone optimale','#4CAF50'],['1.3–1.5 Attention','#FFB800'],['> 1.5 Surcharge','#FF4455']].map(([l,c]) =>
        _h`<div key=${l} style=${{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:c+'12', border:'1px solid '+c+'30' }}>
          <div style=${{ width:6, height:6, borderRadius:'50%', background:c }}></div>
          <span style=${{ color:c }}>${l}</span>
        </div>`
      )}
    </div>

    <!-- ── COMPARAISON RPE DÉCLARÉ vs CIBLE ─────────────────────────────── -->
    ${(() => {
      // Calculer pour chaque joueur : moyenne RPE cible coach vs RPE réel déclaré
      // depuis les séances muscu et endurance
      const data = players.map(p => {
        const seancesM = (p.muscuSeances    || []).filter(s => s.dateFaite && s.rpeCible && s.rpeReel != null);
        const seancesE = (p.enduranceSeances|| []).filter(s => s.dateFaite && s.rpeCible && s.rpeReel != null);
        const all = [...seancesM, ...seancesE];
        if (!all.length) return null;
        const avgCible = Math.round(all.reduce((s, x) => s + x.rpeCible, 0) / all.length * 10) / 10;
        const avgReel  = Math.round(all.reduce((s, x) => s + x.rpeReel,  0) / all.length * 10) / 10;
        const delta    = Math.round((avgReel - avgCible) * 10) / 10;
        const sc = STATUS_CFG[p.status] || STATUS_CFG.ok;
        // Suspicion triche = declare systematiquement moins que la cible
        const nbSousDeClare = all.filter(s => s.rpeReel < s.rpeCible - 1).length;
        const pctSous = Math.round(nbSousDeClare / all.length * 100);
        return { p, avgCible, avgReel, delta, nbSeances: all.length, pctSous, sc };
      }).filter(Boolean).sort((a, b) => a.delta - b.delta);

      if (!data.length) return _h`<div style=${{ color:'rgba(255,255,255,.2)', fontSize:12, textAlign:'center', padding:'20px 0' }}>Aucune donnée RPE disponible.</div>`;

      const avgEquipeCible = Math.round(data.reduce((s,d)=>s+d.avgCible,0)/data.length*10)/10;
      const avgEquipeReel  = Math.round(data.reduce((s,d)=>s+d.avgReel, 0)/data.length*10)/10;

      return _h`<div>
        <!-- Header section -->
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
          <div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>Analyse comportementale</div>
            <div style=${{ fontSize:17, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>RPE DÉCLARÉ vs RPE CIBLE</div>
          </div>
          <div style=${{ display:'flex', gap:10, fontSize:11 }}>
            <div style=${{ textAlign:'center', background:'rgba(255,255,255,.04)', borderRadius:8, padding:'6px 12px' }}>
              <div style=${{ color:'rgba(255,255,255,.4)', marginBottom:2 }}>Cible moy.</div>
              <div style=${{ fontWeight:800, color:'#FFA420' }}>${avgEquipeCible}/10</div>
            </div>
            <div style=${{ textAlign:'center', background:'rgba(255,255,255,.04)', borderRadius:8, padding:'6px 12px' }}>
              <div style=${{ color:'rgba(255,255,255,.4)', marginBottom:2 }}>Réel moy.</div>
              <div style=${{ fontWeight:800, color:'#38BDF8' }}>${avgEquipeReel}/10</div>
            </div>
          </div>
        </div>

        <!-- Barres de comparaison par joueur -->
        <div style=${{ background:'rgba(255,255,255,.02)', borderRadius:14, padding:'14px 16px', border:'1px solid rgba(255,255,255,.06)', marginBottom:24 }}>
          ${data.map((d, i) => {
            const dCol = d.delta < -1.5 ? '#FF4455' : d.delta < -0.5 ? '#FFB800' : d.delta > 1.5 ? '#7C6FFF' : '#4CAF50';
            const dLabel = d.delta < -1.5 ? 'Sous-déclare' : d.delta < -0.5 ? 'Léger écart' : d.delta > 1.5 ? 'Sur-déclare' : 'Fiable';
            const barW = Math.min(100, Math.round(d.avgReel / 10 * 100));
            const barWCible = Math.min(100, Math.round(d.avgCible / 10 * 100));
            return _h`<div key=${d.p.id} style=${{ marginBottom: i < data.length-1 ? 14 : 0 }}>
              <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                  <${Avatar} name=${d.p.name} color=${d.sc.color} size=${24}/>
                  <div style=${{ fontSize:12, fontWeight:600 }}>${d.p.name}</div>
                  <div style=${{ fontSize:9, padding:'1px 7px', borderRadius:20, background:dCol+'18', color:dCol, fontWeight:700 }}>${dLabel}</div>
                </div>
                <div style=${{ display:'flex', gap:10, fontSize:11, flexShrink:0 }}>
                  <span style=${{ color:'#FFA420' }}>Cible ${d.avgCible}</span>
                  <span style=${{ color:'#38BDF8' }}>Réel ${d.avgReel}</span>
                  <span style=${{ color:dCol, fontWeight:700 }}>${d.delta > 0 ? '+' : ''}${d.delta}</span>
                </div>
              </div>
              <!-- Double barre -->
              <div style=${{ position:'relative', height:6, background:'rgba(255,255,255,.07)', borderRadius:3, marginBottom:3 }}>
                <div style=${{ position:'absolute', top:0, left:0, height:'100%', width:barWCible+'%', background:'rgba(255,164,32,.5)', borderRadius:3 }}></div>
                <div style=${{ position:'absolute', top:0, left:0, height:'100%', width:barW+'%', background:'#38BDF8', borderRadius:3, opacity:.8 }}></div>
              </div>
              ${d.pctSous > 50 ? _h`<div style=${{ fontSize:9, color:'#FF4455', marginTop:2 }}>
                ⚠ Sous-déclare dans ${d.pctSous}% des séances (${Math.round(d.nbSeances*d.pctSous/100)}/${d.nbSeances} séances)
              </div>` : null}
            </div>`;
          })}
        </div>

        <!-- Section détection anomalies -->
        ${(() => {
          const suspects = data.filter(d => d.pctSous > 50 || d.delta < -1.5);
          const overdecl = data.filter(d => d.delta > 1.5);
          if (!suspects.length && !overdecl.length) return _h`<div style=${{ fontSize:11, color:'rgba(76,175,80,.7)', background:'rgba(76,175,80,.06)', border:'1px solid rgba(76,175,80,.2)', borderRadius:10, padding:'10px 14px', marginBottom:16, textAlign:'center' }}>
            ✓ Aucune anomalie détectée — les déclarations semblent cohérentes avec les cibles.
          </div>`;
          return _h`<div style=${{ marginBottom:20 }}>
            ${suspects.length > 0 ? _h`<div style=${{ background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.25)', borderRadius:12, padding:'12px 16px', marginBottom:10 }}>
              <div style=${{ fontSize:12, fontWeight:800, color:'#FF4455', marginBottom:8 }}>🚨 Sous-déclaration suspecte</div>
              ${suspects.map(d => _h`<div key=${d.p.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5, fontSize:12 }}>
                <span style=${{ color:'rgba(255,255,255,.8)' }}>${d.p.name}</span>
                <span style=${{ color:'#FF4455', fontWeight:700 }}>Déclare ${Math.abs(d.delta)} pt${Math.abs(d.delta)>1?'s':''} en dessous de la cible en moyenne</span>
              </div>`)}
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:8, fontStyle:'italic' }}>
                Ces joueurs déclarent systématiquement une fatigue inférieure à l'intensité programmée. Vérifier si les séances sont bien réalisées à l'intensité prévue.
              </div>
            </div>` : null}
            ${overdecl.length > 0 ? _h`<div style=${{ background:'rgba(124,111,255,.06)', border:'1px solid rgba(124,111,255,.25)', borderRadius:12, padding:'12px 16px' }}>
              <div style=${{ fontSize:12, fontWeight:800, color:'#7C6FFF', marginBottom:8 }}>📈 Sur-déclaration</div>
              ${overdecl.map(d => _h`<div key=${d.p.id} style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5, fontSize:12 }}>
                <span style=${{ color:'rgba(255,255,255,.8)' }}>${d.p.name}</span>
                <span style=${{ color:'#7C6FFF', fontWeight:700 }}>+${d.delta} pt${d.delta>1?'s':''} au-dessus de la cible</span>
              </div>`)}
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:8, fontStyle:'italic' }}>
                Ces joueurs perçoivent les séances comme plus dures que prévu. Vérifier la récupération ou revoir la programmation.
              </div>
            </div>` : null}
          </div>`;
        })()}

        <!-- Classement fatigue équipe -->
        <div style=${{ marginBottom:4 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Classement fatigue (7 derniers jours)</div>
          <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
            ${[...data].sort((a,b) => {
              const fa = (a.p.bilans||[]).filter(b=>(new Date()-new Date(b.date))<=7*86400000);
              const fb = (b.p.bilans||[]).filter(b=>(new Date()-new Date(b.date))<=7*86400000);
              const ma = fa.length ? fa.reduce((s,x)=>s+x.fatigue,0)/fa.length : 0;
              const mb = fb.length ? fb.reduce((s,x)=>s+x.fatigue,0)/fb.length : 0;
              return mb - ma;
            }).map((d, i) => {
              const bilans7j = (d.p.bilans||[]).filter(b=>(new Date()-new Date(b.date))<=7*86400000);
              const moy = bilans7j.length ? Math.round(bilans7j.reduce((s,x)=>s+x.fatigue,0)/bilans7j.length*10)/10 : null;
              if (!moy) return null;
              const col = moy >= 4 ? '#FF4455' : moy >= 3 ? '#FFB800' : '#4CAF50';
              return _h`<div key=${d.p.id} style=${{ background:col+'10', border:'1px solid '+col+'30', borderRadius:10, padding:'8px 12px', textAlign:'center', minWidth:80 }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:3 }}>${d.p.name.split(' ')[1] || d.p.name}</div>
                <div style=${{ fontSize:18, fontWeight:800, color:col, fontFamily:"'Barlow Condensed',sans-serif" }}>${moy}</div>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>/5</div>
              </div>`;
            }).filter(Boolean)}
          </div>
        </div>
      </div>`;
    })()}
  </div>`;
}
