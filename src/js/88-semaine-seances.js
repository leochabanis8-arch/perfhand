// ── VUE « SEMAINE » : toutes les séances programmées de la semaine, tous joueurs confondus ──
// Raccourci pour ne plus ouvrir chaque joueur un par un. Lecture seule.
// groupes = [{ titre, joueurs: [...] }] ; chargerTenants = true (super admin) ajoute les joueurs
// des espaces tenants (lus dans tenants/{id}/playersPerso).

function semaineEnTableau(v) {
  if (!v) return [];
  return (Array.isArray(v) ? v : Object.values(v)).filter(Boolean);
}
function semaineLundi(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const j = (x.getDay() + 6) % 7; // 0 = lundi
  x.setDate(x.getDate() - j);
  return x;
}
function semaineJours(lundi) {
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(lundi); d.setDate(d.getDate() + i); return d; });
}
// Séances d'un joueur sur une liste de dates « AAAA-MM-JJ » : { date: [séances] }
function seancesDuJoueurParJour(p, dates) {
  const res = {}; dates.forEach(d => { res[d] = []; });
  const ajouter = (s, type) => {
    const d = String(s.datePrevu || '').slice(0, 10);
    if (res[d]) res[d].push({ ...s, _type: type });
  };
  semaineEnTableau(p.muscuSeances).forEach(s => ajouter(s, 'muscu'));
  semaineEnTableau(p.enduranceSeances).forEach(s => ajouter(s, 'endurance'));
  return res;
}

function SemaineSeancesView({ groupes, chargerTenants }) {
  const [decalage, setDecalage] = useState(0);
  const [filtre, setFiltre] = useState('tous');
  const [masquerVides, setMasquerVides] = useState(false);
  const [detail, setDetail] = useState(null);
  const [tenants, setTenants] = useState([]);

  React.useEffect(() => {
    if (!chargerTenants || !window.__perfhand_db) return;
    const ref = window.__perfhand_db.ref('tenants');
    const cb = snap => setTenants(semaineEnTableau(snap.val()));
    ref.on('value', cb, () => setTenants([]));
    return () => ref.off('value', cb);
  }, [chargerTenants]);

  const tousGroupes = [
    ...(groupes || []),
    ...tenants.map(t => ({ titre: '🏢 ' + (t.nom || t.name || t.id), joueurs: semaineEnTableau(t.playersPerso) })),
  ].map((g, i) => ({ ...g, cle: 'g' + i, joueurs: (g.joueurs || []).filter(p => p && !p.archived) }))
   .filter(g => g.joueurs.length);

  const lundi = semaineLundi(new Date()); lundi.setDate(lundi.getDate() + decalage * 7);
  const jours = semaineJours(lundi);
  const dates = jours.map(d => localDateStr(d));
  const aujourdhui = localDateStr();
  const NOMS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const fmt = d => d.getDate() + '/' + (d.getMonth() + 1);

  const visibles = tousGroupes.filter(g => filtre === 'tous' || g.cle === filtre);
  let total = 0, faites = 0, manquees = 0, sansSeance = 0;
  const lignesParGroupe = visibles.map(g => {
    const lignes = g.joueurs.map(p => {
      const parJour = seancesDuJoueurParJour(p, dates);
      const nb = dates.reduce((a, d) => a + parJour[d].length, 0);
      dates.forEach(d => parJour[d].forEach(s => {
        total++;
        if (s.dateFaite) faites++; else if (d < aujourdhui) manquees++;
      }));
      if (!nb) sansSeance++;
      return { p, parJour, nb };
    }).sort((a, b) => String(a.p.name || '').localeCompare(String(b.p.name || '')));
    return { g, lignes: masquerVides ? lignes.filter(l => l.nb) : lignes, sans: lignes.filter(l => !l.nb).map(l => l.p.name) };
  });

  const puce = (s, d) => {
    const faite = !!s.dateFaite, ratee = !faite && d < aujourdhui;
    const coul = faite ? '#4CAF50' : ratee ? '#FF4455' : (s._type === 'muscu' ? '#FFA420' : '#38BDF8');
    return _h`<button key=${(s.id || s.nom) + s._type} onClick=${() => setDetail(s)} title="Voir le détail"
      style=${{ display:'block', width:'100%', textAlign:'left', marginBottom:3, padding:'3px 6px', borderRadius:6, cursor:'pointer',
        background: coul + '18', border:'1px solid ' + coul + '55', color:'#fff', fontSize:10.5, lineHeight:1.3 }}>
      <span style=${{ color: coul, fontWeight:800 }}>${faite ? '✓ ' : ratee ? '✗ ' : ''}${s._type === 'muscu' ? '🏋️' : '🏃'}</span> ${s.nom || (s._type === 'muscu' ? 'Muscu' : 'Endurance')}
    </button>`;
  };

  const btn = actif => ({ padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700,
    border:'1px solid ' + (actif ? 'rgba(255,164,32,.5)' : 'rgba(255,255,255,.12)'),
    background: actif ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)', color: actif ? '#FFA420' : 'rgba(255,255,255,.7)' });

  return _h`<div>
    <div style=${{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:12 }}>
      <div style=${{ fontSize:18, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginRight:'auto' }}>
        📅 Séances de la semaine <span style=${{ color:'rgba(255,255,255,.45)', fontSize:14 }}>du ${fmt(jours[0])} au ${fmt(jours[6])}</span>
      </div>
      <button style=${btn(false)} onClick=${() => setDecalage(x => x - 1)}>← Préc.</button>
      <button style=${btn(decalage === 0)} onClick=${() => setDecalage(0)}>Cette semaine</button>
      <button style=${btn(false)} onClick=${() => setDecalage(x => x + 1)}>Suiv. →</button>
    </div>

    <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
      <button style=${btn(filtre === 'tous')} onClick=${() => setFiltre('tous')}>Tous</button>
      ${tousGroupes.map(g => _h`<button key=${g.cle} style=${btn(filtre === g.cle)} onClick=${() => setFiltre(g.cle)}>${g.titre} (${g.joueurs.length})</button>`)}
      <label style=${{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,.6)', marginLeft:'auto', cursor:'pointer' }}>
        <input type="checkbox" checked=${masquerVides} onChange=${e => setMasquerVides(e.target.checked)}/> Masquer les joueurs sans séance
      </label>
    </div>

    <div style=${{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:8, marginBottom:14 }}>
      ${[['Séances programmées', total, '#FFA420'], ['Faites', faites, '#4CAF50'], ['Non faites (jour passé)', manquees, '#FF4455'], ['Joueurs sans séance', sansSeance, 'rgba(255,255,255,.6)']]
        .map(([l, v, c]) => _h`<div key=${l} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'10px 12px' }}>
          <div style=${{ fontSize:22, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.45)' }}>${l}</div>
        </div>`)}
    </div>
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:12 }}>
      <span style=${{ color:'#FFA420' }}>🏋️ Muscu</span> · <span style=${{ color:'#38BDF8' }}>🏃 Endurance</span> · <span style=${{ color:'#4CAF50' }}>✓ faite</span> · <span style=${{ color:'#FF4455' }}>✗ jour passé, non faite</span> — clique sur une séance pour voir son contenu.
    </div>

    ${!visibles.length ? _h`<div style=${{ padding:40, textAlign:'center', color:'rgba(255,255,255,.3)' }}>Aucun joueur à afficher.</div>` : null}

    ${lignesParGroupe.map(({ g, lignes, sans }) => _h`<div key=${g.cle} style=${{ marginBottom:18 }}>
      <div style=${{ fontSize:12, fontWeight:800, color:'#FFA420', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>${g.titre}</div>
      ${!masquerVides && sans.length ? _h`<div style=${{ fontSize:10.5, color:'rgba(255,255,255,.45)', marginBottom:6 }}>Sans séance cette semaine : ${sans.join(', ')}</div>` : null}
      <div style=${{ overflowX:'auto', border:'1px solid rgba(255,255,255,.08)', borderRadius:10 }}>
        <table style=${{ borderCollapse:'collapse', width:'100%', minWidth:860, tableLayout:'fixed' }}>
          <thead><tr>
            <th style=${{ width:130, position:'sticky', left:0, background:'#161616', zIndex:1, padding:'6px 8px', fontSize:10, color:'rgba(255,255,255,.4)', textAlign:'left' }}>Joueur</th>
            ${jours.map((d, i) => _h`<th key=${i} style=${{ padding:'6px 4px', fontSize:10, textAlign:'center', background: dates[i] === aujourdhui ? 'rgba(255,164,32,.12)' : '#161616', color: dates[i] === aujourdhui ? '#FFA420' : 'rgba(255,255,255,.5)' }}>${NOMS[i]} ${fmt(d)}</th>`)}
          </tr></thead>
          <tbody>
            ${lignes.map(({ p, parJour, nb }) => _h`<tr key=${p.id || p.name} style=${{ borderTop:'1px solid rgba(255,255,255,.05)' }}>
              <td style=${{ position:'sticky', left:0, background:'#121212', zIndex:1, padding:'6px 8px', fontSize:11.5, fontWeight:700, verticalAlign:'top', color: nb ? '#fff' : 'rgba(255,255,255,.35)' }}>${p.name || '—'}</td>
              ${dates.map(d => _h`<td key=${d} style=${{ padding:4, verticalAlign:'top', background: d === aujourdhui ? 'rgba(255,164,32,.04)' : 'transparent' }}>
                ${parJour[d].map(s => puce(s, d))}
              </td>`)}
            </tr>`)}
          </tbody>
        </table>
      </div>
    </div>`)}

    ${detail ? _h`<div class="edit-modal-bg" onClick=${() => setDetail(null)}>
      <div class="edit-modal" style=${{ maxWidth:560 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style=${{ fontSize:15, fontWeight:800 }}>${detail._type === 'muscu' ? '🏋️' : '🏃'} ${detail.nom || ''}</div>
          <button onClick=${() => setDetail(null)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.6)', fontSize:18, cursor:'pointer' }}>×</button>
        </div>
        <div class="edit-modal-body" style=${{ fontSize:12, lineHeight:1.6 }}>
          <div style=${{ color:'rgba(255,255,255,.55)', marginBottom:8 }}>
            ${detail.datePrevu || ''}${detail.methode ? ' · ' + detail.methode : ''}${detail.rpe || detail.rpeCible ? ' · RPE cible ' + (detail.rpe || detail.rpeCible) : ''}${detail.duree ? ' · ' + detail.duree + ' min' : ''}
            ${detail.dateFaite ? _h` · <span style=${{ color:'#4CAF50', fontWeight:700 }}>✓ faite le ${detail.dateFaite}${detail.rpeReel != null ? ' (RPE ' + detail.rpeReel + ')' : ''}</span>` : null}
          </div>
          ${detail._type === 'muscu' ? semaineEnTableau(detail.exercices).map((ex, i) => _h`<div key=${i} style=${{ padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <div style=${{ fontWeight:700 }}>${ex.nom || '—'}</div>
            <div style=${{ color:'rgba(255,255,255,.55)', fontSize:11 }}>
              ${semaineEnTableau(ex.chargeDetails).length
                ? semaineEnTableau(ex.chargeDetails).map((d, k) => 'S' + (k + 1) + ' : ' + (d.reps || '') + (d.pct ? ' @ ' + d.pct + '%' : (d.charge ? ' · ' + d.charge : ''))).join(' — ')
                : [ex.series ? ex.series + ' × ' + (ex.reps || '') : ex.reps, ex.charge, ex.repos ? 'repos ' + ex.repos : ''].filter(Boolean).join(' · ')}
            </div>
            ${ex.notes ? _h`<div style=${{ fontSize:10.5, color:'rgba(255,255,255,.4)', fontStyle:'italic' }}>${ex.notes}</div>` : null}
          </div>`) : _h`<div>
            ${[detail.intensite, detail.distance, detail.fcCible, detail.format, detail.recup].filter(Boolean).map((x, i) => _h`<div key=${i}>${x}</div>`)}
          </div>`}
          ${detail.notes ? _h`<div style=${{ marginTop:10, padding:'8px 10px', background:'rgba(255,255,255,.04)', borderRadius:8, whiteSpace:'pre-wrap' }}>📝 ${detail.notes}</div>` : null}
        </div>
      </div>
    </div>` : null}
  </div>`;
}
