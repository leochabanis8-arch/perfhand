
function ChargeDashboard({ players, clubs }) {
  if (!players || !players.length) return _h`<div style=${{ padding:40, textAlign:"center", color:"rgba(255,255,255,.3)" }}>Aucun joueur à afficher.</div>`;
  const [selP, setSelP] = useState(null);
  const [rapportP, setRapportP] = useState(null);
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
        // Durée réelle si renseignée, sinon estimée d'après le nombre d'exercices
        const duree = Number(s.duree) > 0 ? Number(s.duree) : Math.max(30, Math.min(100, (s.exercices||[]).length * 9));
        return { date: s.dateFaite, type:'Muscu', typeSeance: s.nom, rpe: s.rpeReel, fatigue: typeof s.fatigue === 'number' ? s.fatigue : null, chargeSession: duree * s.rpeReel };
      });
    const enduranceDerived = (p.enduranceSeances || [])
      .filter(s => s.dateFaite && s.rpeReel != null)
      .map(s => {
        const duree = s.duree || 45;
        return { date: s.dateFaite, type:'Endurance', typeSeance: s.nom, rpe: s.rpeReel, fatigue: typeof s.fatigue === 'number' ? s.fatigue : null, chargeSession: duree * s.rpeReel };
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

  // ── ANALYSE PAR JOUEUR ──────────────────────────────────────────────────
  // Charge d'une séance = durée (min) × RPE déclaré, en unités arbitraires (UA). « 7 j » = aujourd'hui
  // et les 6 jours précédents. Le ratio d'évolution (ACWR = charge 7 j ÷ moyenne hebdo sur 28 j) n'a de
  // sens qu'avec un historique suffisant : avec 1 ou 2 séances, un joueur qui reprenait doucement
  // affichait « 2.0 » et passait en zone de risque sans être chargé. Il n'est donc calculé qu'avec
  // ≥ 4 séances étalées sur ≥ 14 jours, et un pic ne compte comme risque que si la charge de la
  // semaine est réellement élevée par rapport au reste de l'équipe (≥ médiane).
  const today = localDateStr();
  function signauxWellness(c) {
    const s = [];
    if ((c.douleurs||3) <= 2) s.push('douleurs');
    if ((c.energie||3) <= 2) s.push('énergie basse');
    if ((c.sommeil||3) <= 2) s.push('sommeil');
    if ((c.humeur||3) <= 2) s.push('humeur basse');
    if ((c.stress||3) <= 2) s.push('stress élevé');
    if ((c.fatigue||3) >= 4) s.push('fatigue élevée');
    return s;
  }
  function scoreWellness(c) {
    if (!c) return null;
    const v = ['douleurs','energie','sommeil','humeur','stress'].map(k => c[k]).filter(x => typeof x === 'number');
    return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length * 10) / 10 : null;
  }
  function analyser(p) {
    const bilans = getAllBilans(p).filter(b => b && b.date && daysSince(b.date) >= 0);
    const sur = n => bilans.filter(b => daysSince(b.date) <= n - 1);
    const b7 = sur(7), b28 = sur(28);
    const somme = l => Math.round(l.reduce((s, b) => s + (b.chargeSession || 0), 0));
    const moy = (l, k) => { const v = l.map(b => b[k]).filter(x => typeof x === 'number'); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length * 10) / 10 : null; };
    const charge7 = somme(b7), charge28 = somme(b28);
    const anciennete = b28.length ? Math.max(...b28.map(b => daysSince(b.date))) : 0;
    const historiqueOk = b28.length >= 4 && anciennete >= 14;
    const acwr = historiqueOk && charge28 > 0 ? Math.round(charge7 / (charge28 / 4) * 100) / 100 : null;
    const derniere = bilans.slice().sort((x, y) => String(x.date).localeCompare(String(y.date))).slice(-1)[0] || null;
    const checkin = wellnessArr(p).find(w => w.dateRessenti === today) || null;
    return { p, charge7, nb7: b7.length, nb28: b28.length, acwr, historiqueOk, rpe7: moy(b7, 'rpe'), fatigue7: moy(b7, 'fatigue'),
             derniere, checkin, scoreJour: scoreWellness(checkin), signaux: checkin ? signauxWellness(checkin) : [] };
  }
  const analyses = players.map(analyser);
  const chargesEquipe = analyses.map(a => a.charge7).filter(c => c > 0).sort((x, y) => x - y);
  const medianeCharge = chargesEquipe.length ? chargesEquipe[Math.floor(chargesEquipe.length / 2)] : 0;
  const chargeMax = chargesEquipe.length ? chargesEquipe[chargesEquipe.length - 1] : 0;
  analyses.forEach(a => {
    const r = [];
    if (a.signaux.length) r.push({ niveau: (a.signaux.length >= 2 || (a.checkin.douleurs||3) <= 1) ? 'rouge' : 'orange', texte: 'Wellness du jour : ' + a.signaux.join(', ') });
    const chargeHaute = a.charge7 > 0 && a.charge7 >= medianeCharge;
    if (a.acwr != null && a.acwr > 1.5 && chargeHaute) r.push({ niveau: 'rouge', texte: 'Pic de charge : ×' + a.acwr + ' par rapport à son habitude' });
    else if (a.acwr != null && a.acwr > 1.3 && chargeHaute) r.push({ niveau: 'orange', texte: 'Charge en hausse : ×' + a.acwr + ' par rapport à son habitude' });
    if (a.fatigue7 != null && a.fatigue7 >= 4) r.push({ niveau: 'orange', texte: 'Fatigue déclarée élevée sur 7 j (' + a.fatigue7 + '/5)' });
    if (a.rpe7 != null && a.rpe7 >= 8.5) r.push({ niveau: 'orange', texte: 'Séances perçues très dures (RPE moyen ' + a.rpe7 + ')' });
    a.raisons = r;
    a.niveau = r.some(x => x.niveau === 'rouge') ? 'rouge' : r.length ? 'orange' : (a.nb28 || a.checkin ? 'ok' : 'vide');
  });
  const analyseDe = {}; analyses.forEach(a => { analyseDe[a.p.id] = a; });
  const ORDRE_NIVEAU = { rouge: 0, orange: 1, ok: 2, vide: 3 };
  const trier = l => l.slice().sort((x, y) => ORDRE_NIVEAU[x.niveau] - ORDRE_NIVEAU[y.niveau] || y.charge7 - x.charge7 || x.p.name.localeCompare(y.p.name));
  const aSurveiller = trier(analyses.filter(a => a.niveau === 'rouge' || a.niveau === 'orange'));
  const NIVEAU_CFG = {
    rouge:  { label: 'À risque',      color: '#FF4455' },
    orange: { label: 'À surveiller',  color: '#FFB800' },
    ok:     { label: 'OK',            color: '#4CAF50' },
    vide:   { label: 'Pas de données', color: 'rgba(255,255,255,.3)' },
  };
  function evolutionInfo(a) {
    if (a.acwr == null) return { texte: a.nb28 ? 'Historique court' : '—', color: 'rgba(255,255,255,.25)', detail: a.nb28 ? a.nb28 + ' séance(s) sur 28 j : pas assez pour comparer' : '' };
    const v = a.acwr;
    if (v < 0.8) return { texte: '×' + v, color: '#38BDF8', detail: 'Sous sa charge habituelle' };
    if (v <= 1.3) return { texte: '×' + v, color: '#4CAF50', detail: 'Stable' };
    if (v <= 1.5) return { texte: '×' + v, color: '#FFB800', detail: 'En hausse' };
    return { texte: '×' + v, color: '#FF4455', detail: 'Forte hausse' };
  }
  const coul = (v, bon, moyen, inverse) => v == null ? 'rgba(255,255,255,.3)' : (inverse ? (v >= bon ? '#FF4455' : v >= moyen ? '#FFB800' : '#4CAF50') : (v >= bon ? '#4CAF50' : v >= moyen ? '#FFB800' : '#FF4455'));
  const ilYa = d => { const n = daysSince(d); return n === 0 ? "aujourd'hui" : n === 1 ? 'hier' : 'il y a ' + n + ' j'; };

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
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10, alignItems:'center' }}>
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1 }}>📗 Export Excel équipe :</span>
        ${rpPeriodes({}).filter(pp => pp.id !== 'tout').map(pp => _h`<button key=${pp.id} class="btn btn-sm" style=${{ background:'rgba(76,175,80,.12)', border:'1px solid rgba(76,175,80,.4)', color:'#4CAF50', fontWeight:700 }}
          onClick=${() => exporterRapportEquipeExcel(players, pp.from, pp.to, ((clubs && clubs[0] && clubs[0].name) || 'equipe'), clubs)}>${pp.label}</button>`)}
      </div>
    </div>

    <!-- ── RÉSUMÉ DU JOUR ─────────────────────────────────────────────── -->
    ${(() => {
      const remplis = analyses.filter(a => a.checkin).length;
      const nbRouge = analyses.filter(a => a.niveau === 'rouge').length, nbOrange = analyses.filter(a => a.niveau === 'orange').length;
      const seances7 = analyses.reduce((s, a) => s + a.nb7, 0);
      const actifs = chargesEquipe.length;
      const tuiles = [
        { label: 'Wellness remplis', val: remplis + '/' + players.length, color: remplis === players.length ? '#4CAF50' : '#FFB800' },
        { label: 'À risque', val: nbRouge, color: nbRouge ? '#FF4455' : '#4CAF50' },
        { label: 'À surveiller', val: nbOrange, color: nbOrange ? '#FFB800' : '#4CAF50' },
        { label: 'Séances validées (7 j)', val: seances7, color: '#38BDF8' },
        { label: 'Charge médiane (7 j)', val: actifs ? medianeCharge + ' UA' : '—', color: 'rgba(255,255,255,.8)' },
      ];
      return _h`<div style=${{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:8, marginBottom:16 }}>
        ${tuiles.map(t => _h`<div key=${t.label} class="card" style=${{ padding:'10px 12px', marginBottom:0 }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>${t.label}</div>
          <div style=${{ fontSize:22, fontWeight:800, color:t.color, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${t.val}</div>
        </div>`)}
      </div>`;
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
          <div style=${{ fontSize:10, color:'#FF4455', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>⚠️ Signaux wellness (${alerte.length})</div>
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

    <!-- ── À SURVEILLER — AVEC LA RAISON ──────────────────────────────── -->
    <div class="card" style=${{ marginBottom:16, border: aSurveiller.length ? '1px solid rgba(255,68,85,.3)' : '1px solid rgba(76,175,80,.25)' }}>
      <div style=${{ fontSize:13, fontWeight:800, marginBottom:4 }}>🎯 À surveiller aujourd'hui</div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:10 }}>Wellness du jour, pic de charge réel, fatigue ou RPE élevés — la raison est indiquée pour chaque joueur</div>
      ${aSurveiller.length === 0 ? _h`<div style=${{ fontSize:12, color:'#4CAF50' }}>✓ Aucun signal particulier aujourd'hui.</div>`
        : _h`<div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
          ${aSurveiller.map(a => {
            const cfg = NIVEAU_CFG[a.niveau];
            return _h`<div key=${a.p.id} style=${{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 10px', borderRadius:8, background:cfg.color+'0d', border:'1px solid '+cfg.color+'33' }}>
              <span style=${{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:20, background:cfg.color+'22', color:cfg.color, whiteSpace:'nowrap', marginTop:1 }}>${cfg.label}</span>
              <div style=${{ flex:1 }}>
                <div style=${{ fontSize:12, fontWeight:700 }}>${a.p.name} <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:400 }}>${groupLabel(a.p)}</span></div>
                ${a.raisons.map((r, i) => _h`<div key=${i} style=${{ fontSize:11, color: r.niveau === 'rouge' ? '#FF4455' : '#FFB800', marginTop:2 }}>• ${r.texte}</div>`)}
              </div>
            </div>`;
          })}
        </div>`}
    </div>

    <!-- Tableau(x) équipe — groupé par club si plusieurs clubs sont représentés -->
    ${(() => {
      const tableHead = _h`<thead><tr>
        ${['Joueur','Statut','Wellness du jour','Charge 7 j','Évolution','RPE moy. 7 j','Fatigue moy. 7 j','Dernière séance','Rapport'].map(h =>
          _h`<th key=${h} style=${{ padding:'8px 10px', textAlign:'left', fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:1.2, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.06)', fontWeight:500, whiteSpace:'nowrap' }}>${h}</th>`
        )}
      </tr></thead>`;

      function renderRows(list) {
        const td = { padding:'9px 10px', borderBottom:'1px solid rgba(255,255,255,.04)', verticalAlign:'middle' };
        return trier(list.map(p => analyseDe[p.id])).map(a => {
          const p = a.p;
          const cfg = NIVEAU_CFG[a.niveau];
          const sc = STATUS_CFG[p.status] || STATUS_CFG.ok;
          const evo = evolutionInfo(a);
          const largeur = chargeMax ? Math.round(a.charge7 / chargeMax * 100) : 0;
          return _h`<tr key=${p.id}
            style=${{ cursor:'pointer', background: selP===p.id ? 'rgba(255,164,32,.04)' : 'transparent' }}
            onClick=${() => setSelP(selP===p.id?null:p.id)}
          >
            <td style=${td}>
              <div style=${{ display:'flex', alignItems:'center', gap:9 }}>
                <${Avatar} name=${p.name} color=${sc.color} size=${26}/>
                <div>
                  <div style=${{ fontSize:12, fontWeight:600 }}>${p.name}</div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>${p.pos || ''}</div>
                </div>
              </div>
            </td>
            <td style=${td} title=${a.raisons.map(r => r.texte).join('\n')}>
              <span style=${{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background: a.niveau === 'vide' ? 'rgba(255,255,255,.05)' : cfg.color+'1f', color:cfg.color, whiteSpace:'nowrap' }}>${cfg.label}</span>
            </td>
            <td style=${td}>
              ${a.checkin
                ? _h`<span style=${{ fontSize:14, fontWeight:800, color: coul(a.scoreJour, 4, 3), fontFamily:"'Barlow Condensed',sans-serif" }}>${a.scoreJour}/5</span>`
                : _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.25)' }}>non rempli</span>`}
            </td>
            <td style=${{ ...td, minWidth:110 }}>
              ${a.charge7 ? _h`<div>
                <div style=${{ fontSize:14, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif" }}>${a.charge7} <span style=${{ fontSize:9, color:'rgba(255,255,255,.3)', fontWeight:400 }}>UA · ${a.nb7} séance${a.nb7>1?'s':''}</span></div>
                <div style=${{ height:4, background:'rgba(255,255,255,.06)', borderRadius:2, marginTop:3 }}>
                  <div style=${{ height:'100%', width:largeur+'%', background: a.charge7 >= medianeCharge ? '#FFA420' : '#38BDF8', borderRadius:2 }}></div>
                </div>
              </div>` : _h`<span style=${{ color:'rgba(255,255,255,.25)' }}>—</span>`}
            </td>
            <td style=${td} title=${evo.detail}>
              <div style=${{ fontSize:13, fontWeight:800, color:evo.color, fontFamily:"'Barlow Condensed',sans-serif" }}>${evo.texte}</div>
              ${evo.detail ? _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${evo.detail}</div>` : null}
            </td>
            <td style=${{ ...td, fontSize:13, fontWeight:700, color: coul(a.rpe7, 8.5, 7, true), fontFamily:"'Barlow Condensed',sans-serif" }}>${a.rpe7 != null ? a.rpe7 : '—'}</td>
            <td style=${{ ...td, fontSize:13, fontWeight:700, color: coul(a.fatigue7, 4, 3, true), fontFamily:"'Barlow Condensed',sans-serif" }}>${a.fatigue7 != null ? a.fatigue7 : '—'}</td>
            <td style=${{ ...td, fontSize:11, color:'rgba(255,255,255,.45)' }}>
              ${a.derniere ? _h`<div>${a.derniere.type} · RPE ${a.derniere.rpe}</div><div style=${{ fontSize:9, color:'rgba(255,255,255,.3)' }}>${ilYa(a.derniere.date)}</div>` : '—'}
            </td>
            <td style=${td}>
              <button class="btn btn-sm" title="Rapport PDF / Excel de ${p.name}" onClick=${e => { e.stopPropagation(); setRapportP(p); }}
                style=${{ background:'rgba(76,175,80,.12)', border:'1px solid rgba(76,175,80,.4)', color:'#4CAF50', fontWeight:700, whiteSpace:'nowrap', padding:'4px 9px', fontSize:11 }}>📄 PDF / Excel</button>
            </td>
          </tr>`;
        });
      }

      function renderTable(list) {
        return _h`<div class="card" style=${{ marginBottom:16 }}>
          <div style=${{ overflowX:'auto' }}>
            <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:820 }}>
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
      const sansClub = players.filter(p => !clubList.some(c => playerInClub(p, c.id)));
      const blocIndiv = sansClub.length ? _h`<div key="_indiv">
          <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8, marginTop:6 }}>
            <div style=${{ fontSize:14, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Profils individuels</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>${sansClub.length} joueur${sansClub.length>1?'s':''}</div>
          </div>
          ${renderTable(sansClub)}
        </div>` : null;
      return [...clubList.map(c => {
        const clubPlayers = players.filter(p => playerInClub(p, c.id));
        if (!clubPlayers.length) return null;
        return _h`<div key=${c.id}>
          <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8, marginTop: c===clubList[0]?0:6 }}>
            <div style=${{ fontSize:14, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${c.name}</div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>${clubPlayers.length} joueur${clubPlayers.length>1?'s':''}</div>
          </div>
          ${renderTable(clubPlayers)}
        </div>`;
      }), blocIndiv];
    })()}
    ${rapportP ? _h`<${RapportJoueurModal} player=${rapportP} onClose=${() => setRapportP(null)} />` : null}

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
    <!-- ── COMMENT LIRE CETTE PAGE ──────────────────────────────────────── -->
    <div class="card" style=${{ marginBottom:24, fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.7 }}>
      <div style=${{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.85)', marginBottom:6 }}>ℹ️ Comment lire cette page</div>
      <div><b>Charge 7 j</b> : somme des séances validées sur les 7 derniers jours, chacune = durée (min) × RPE déclaré, en unités arbitraires (UA). La barre situe le joueur par rapport au plus chargé de l'équipe (orange = au-dessus de la médiane).</div>
      <div><b>Évolution</b> : charge des 7 derniers jours comparée à sa moyenne hebdomadaire sur 28 jours (×1 = comme d'habitude). Calculée seulement à partir de 4 séances étalées sur au moins 14 jours ; sinon « Historique court ».</div>
      <div style=${{ display:'flex', gap:8, flexWrap:'wrap', margin:'4px 0' }}>
        ${[['< ×0.8 Sous sa charge habituelle','#38BDF8'],['×0.8–1.3 Stable','#4CAF50'],['×1.3–1.5 En hausse','#FFB800'],['> ×1.5 Forte hausse','#FF4455']].map(([l,c]) =>
          _h`<div key=${l} style=${{ display:'flex', alignItems:'center', gap:5, padding:'2px 9px', borderRadius:20, background:c+'12', border:'1px solid '+c+'30' }}>
            <div style=${{ width:6, height:6, borderRadius:'50%', background:c }}></div><span style=${{ color:c }}>${l}</span>
          </div>`)}
      </div>
      <div><b>Statut</b> : <span style=${{ color:'#FF4455' }}>À risque</span> = pic de charge réel (forte hausse ET charge de la semaine au-dessus de la médiane de l'équipe) ou wellness du jour avec plusieurs signaux ; <span style=${{ color:'#FFB800' }}>À surveiller</span> = un signal (wellness, hausse de charge, fatigue ≥ 4/5, RPE ≥ 8.5). Une forte hausse sur une petite charge (reprise) n'est pas un risque.</div>
      <div><b>RPE / fatigue moy.</b> : moyennes de ce que le joueur a déclaré sur 7 jours (une fatigue non déclarée n'est pas comptée).</div>
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
