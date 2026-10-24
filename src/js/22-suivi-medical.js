
// ── SUIVI MEDICAL ──────────────────────────────────────────────────────────
// ── SUIVI MEDICAL (100% dynamique depuis db.players) ──────────────────────
function SuiviMedical({ players, onSelectPlayer, db, setDb }) {
  const [vue, setVue] = useState('actif');
  const [selId, setSelId] = useState(null);

  // Lire les blessures DIRECTEMENT depuis db.players (mis a jour en temps reel)
  const dbPlayers = db ? (db.playerProfiles || db.players || []) : players;

  const avecBlessures = dbPlayers.filter(p => p.blessures && p.blessures.length > 0);
  const actifs   = dbPlayers.filter(p => p.status === 'blesse');
  const surveill = dbPlayers.filter(p => p.status === 'surveille');
  const gueris   = avecBlessures.filter(p =>
    p.status === 'ok' && p.blessures.some(b => b.statut === 'gueri' || b.statut === 'termine')
  );
  const antecedents = avecBlessures.filter(p =>
    p.blessures.some(b => b.statut === 'gueri' || b.statut === 'termine')
  );

  const VUES = [
    { id:'actif',    label:'Blesses',     count: actifs.length,   color:'#FF4455' },
    { id:'surv',     label:'Surveillance',count: surveill.length, color:'#FF7A00' },
    { id:'timeline', label:'Chronologie', count: avecBlessures.length, color:'#FFA420' },
    { id:'ant',      label:'Antecedents', count: antecedents.length,   color:'#38BDF8' },
  ];

  // Construire la timeline globale de tous les evenements de blessure
  function buildTimeline() {
    const events = [];
    dbPlayers.forEach(p => {
      (p.blessures || []).forEach(b => {
        // Evenement debut
        if (b.dateDebut) {
          events.push({
            date: b.dateDebut,
            player: p,
            blessure: b,
            type: 'debut',
            label: `Blessure declaree — ${b.zone} (${b.type})`,
            color: '#FF4455',
          });
        }
        // Evenement statut actuel
        if (b.statut === 'gueri' || b.statut === 'termine') {
          const dateGueri = b.dateGueri || b.dateDebut;
          events.push({
            date: dateGueri,
            player: p,
            blessure: b,
            type: 'gueri',
            label: `Retour disponible — ${b.zone} (${b.type})`,
            color: '#4CAF50',
          });
        }
        if (b.statut === 'surveillance') {
          events.push({
            date: b.dateDebut,
            player: p,
            blessure: b,
            type: 'surv',
            label: `Mise sous surveillance — ${b.zone} (${b.type})`,
            color: '#FF7A00',
          });
        }
        // Avancement etapes
        if (b.etapes && b.etapeActuelle > 0) {
          for (let i = 1; i <= b.etapeActuelle && i < b.etapes.length; i++) {
            events.push({
              date: b.dateDebut,
              player: p,
              blessure: b,
              type: 'etape',
              label: `Etape ${i+1} validee — ${b.etapes[i]}`,
              color: '#7C6FFF',
            });
          }
        }
      });
    });
    // Trier par date decroissante (plus recent en premier)
    return events.sort((a, b) => {
      const da = a.date || '0000-00-00';
      const db = b.date || '0000-00-00';
      return db.localeCompare(da);
    });
  }

  function statColor(s) {
    return s === 'en cours' ? '#FF4455' : s === 'surveillance' ? '#FF7A00' : s === 'termine' || s === 'gueri' ? '#4CAF50' : '#38BDF8';
  }

  function fmtDate(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
    } catch { return d; }
  }

  // Nombre de jours depuis la date de debut
  function joursDepuis(d) {
    if (!d) return null;
    const diff = Math.round((Date.now() - new Date(d).getTime()) / 86400000);
    return diff;
  }

  const ONGLETS = [
    { id:'actif',    label:'Blesses ('    + actifs.length   + ')',   color:'#FF4455' },
    { id:'surv',     label:'Surveillance (' + surveill.length + ')', color:'#FF7A00' },
    { id:'timeline', label:'Chronologie',                            color:'#FFA420' },
    { id:'ant',      label:'Antecedents (' + antecedents.length + ')', color:'#38BDF8' },
  ];

  function PlayerCard({ p, showBlessures }) {
    const isSel = selId === p.id;
    const sc = p.status === 'blesse' ? '#FF4455' : p.status === 'surveille' ? '#FF7A00' : '#4CAF50';
    const bActives = (p.blessures || []).filter(b => b.statut === 'en cours' || b.statut === 'surveillance');
    return _h`<div
      onClick=${() => setSelId(isSel ? null : p.id)}
      style=${{
        background: isSel ? sc+'0A' : 'rgba(255,255,255,.02)',
        border: '1px solid ' + (isSel ? sc+'50' : sc+'25'),
        borderRadius:14, padding:'14px 18px', marginBottom:8, cursor:'pointer',
        transition:'all .15s'
      }}
    >
      <div style=${{ display:'flex', alignItems:'center', gap:12 }}>
        <${Avatar} name=${p.name} color=${sc} size=${38} />
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:14, fontWeight:700 }}>${p.name}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:1 }}>${p.pos} · #${p.num}</div>
        </div>
        <div style=${{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
          <${Badge} status=${p.status} />
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>${bActives.length} blessure${bActives.length > 1 ? 's' : ''} active${bActives.length > 1 ? 's' : ''}</div>
        </div>
        <div style=${{ fontSize:14, color:'rgba(255,255,255,.25)', marginLeft:4 }}>${isSel ? '▲' : '▼'}</div>
      </div>

      ${isSel && _h`<div style=${{ marginTop:14, borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:14 }}>
        ${(p.blessures || []).map((b, bi) => {
          const sC = statColor(b.statut);
          const jours = joursDepuis(b.dateDebut);
          return _h`<div key=${bi} style=${{
            background: sC+'06', border:'1px solid '+sC+'20',
            borderRadius:11, padding:'12px 14px', marginBottom:8
          }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style=${{ fontSize:13, fontWeight:700 }}>${b.zone} — ${b.type}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>
                  Depuis le ${fmtDate(b.dateDebut)}
                  ${jours !== null && b.statut === 'en cours' ? _h` · <span style=${{ color:'#FF7A00', fontWeight:700 }}>${jours}j</span>` : null}
                </div>
              </div>
              <span style=${{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:700, background:sC+'15', color:sC, whiteSpace:'nowrap' }}>${b.statut.toUpperCase()}</span>
            </div>
            ${b.protocole && _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.6)', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 10px', marginBottom: b.etapes ? 10 : 0 }}>${b.protocole}</div>`}
            ${b.etapes && _h`<div style=${{ marginTop:10 }}>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:7 }}>Reprise progressive — etape ${b.etapeActuelle+1}/${b.etapes.length}</div>
              <div style=${{ display:'flex', position:'relative' }}>
                <div style=${{ position:'absolute', top:12, left:12, right:12, height:2, background:'rgba(255,255,255,.07)' }}></div>
                ${b.etapes.map((e, j) => _h`<div key=${j} style=${{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, position:'relative', zIndex:2 }}>
                  <div style=${{
                    width:24, height:24, borderRadius:'50%',
                    background: j < b.etapeActuelle ? sC : j === b.etapeActuelle ? '#FF7A00' : 'rgba(255,255,255,.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:800,
                    color: j <= b.etapeActuelle ? '#fff' : 'rgba(255,255,255,.25)'
                  }}>${j < b.etapeActuelle ? '✓' : j+1}</div>
                  <div style=${{ fontSize:8, textAlign:'center', maxWidth:58, lineHeight:1.3, color:j===b.etapeActuelle?'#FF7A00':'rgba(255,255,255,.3)' }}>${e}</div>
                </div>`)}
              </div>
            </div>`}
          </div>`;
        })}
        <button class="btn btn-sm" onClick=${e => { e.stopPropagation(); onSelectPlayer(p); }}
          style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', marginTop:4 }}
        >Ouvrir la fiche →</button>
      </div>`}
    </div>`;
  }

  const timeline = buildTimeline();

  return _h`<div class="page-pad" style=${{ maxWidth:"100%", overflowX:"hidden" }}>
    <div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:2.5, textTransform:'uppercase', marginBottom:4 }}>${(() => {
        const clubIds = Array.from(new Set(players.map(p => p.clubId).filter(Boolean)));
        const relevantClubs = (db.clubs||[]).filter(c => clubIds.includes(c.id));
        if (relevantClubs.length === 1) return relevantClubs[0].name + ' ' + (relevantClubs[0].saison || '2026-2027');
        if (relevantClubs.length > 1) return relevantClubs.map(c => c.name).join(' / ') + ' ' + (relevantClubs[0].saison || '2026-2027');
        return 'Saison 2026-2027';
      })()}</div>
      <h1 style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:800 }}>SUIVI MEDICAL</h1>
    </div>

    <!-- KPIs dynamiques -->
    <div class="grid-4" style=${{ marginBottom:20 }}>
      ${[
        ['Blesses',    actifs.length,              '#FF4455'],
        ['Surveillance', surveill.length,           '#FF7A00'],
        ['Gueris',     gueris.length,               '#4CAF50'],
        ['Avec ATCD',  antecedents.length,          '#38BDF8'],
      ].map(([l,v,c]) => _h`<div key=${l} class="card">
        <div style=${{ fontSize:26, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginTop:2 }}>${l}</div>
      </div>`)}
    </div>

    <!-- Onglets -->
    <div style=${{ display:'flex', gap:4, marginBottom:20, background:'rgba(255,255,255,.03)', borderRadius:11, padding:3 }}>
      ${ONGLETS.map(o => _h`<button key=${o.id}
        onClick=${() => { setVue(o.id); setSelId(null); }}
        style=${{
          flex:1, background: vue===o.id ? o.color+'15' : 'transparent',
          border: vue===o.id ? '1px solid '+o.color+'40' : '1px solid transparent',
          color: vue===o.id ? o.color : 'rgba(255,255,255,.4)',
          padding:'8px 4px', borderRadius:9, fontSize:11,
          fontWeight: vue===o.id ? 700 : 400, cursor:'pointer'
        }}
      >${o.label}</button>`)}
    </div>

    <!-- Vue Blesses -->
    ${vue === 'actif' && _h`<div>
      ${actifs.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.3)' }}>Aucun joueur blesse en ce moment</div>`
        : actifs.map(p => _h`<${PlayerCard} key=${p.id} p=${p} />`)}
    </div>`}

    <!-- Vue Surveillance -->
    ${vue === 'surv' && _h`<div>
      ${surveill.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.3)' }}>Aucun joueur en surveillance</div>`
        : surveill.map(p => _h`<${PlayerCard} key=${p.id} p=${p} />`)}
    </div>`}

    <!-- Vue Chronologie -->
    ${vue === 'timeline' && _h`<div>
      ${timeline.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.3)' }}>Aucun evenement enregistre</div>`
        : _h`<div style=${{ position:'relative', paddingLeft:28 }}>
            <!-- Ligne verticale -->
            <div style=${{ position:'absolute', left:10, top:0, bottom:0, width:2, background:'rgba(255,255,255,.06)', borderRadius:2 }}></div>
            ${timeline.map((ev, i) => _h`<div key=${i} style=${{ position:'relative', marginBottom:16 }}>
              <!-- Point sur la ligne -->
              <div style=${{
                position:'absolute', left:-22, top:3,
                width:14, height:14, borderRadius:'50%',
                background: ev.color+'22', border:'2px solid '+ev.color,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}></div>
              <div style=${{
                background:'rgba(255,255,255,.025)',
                border:'1px solid rgba(255,255,255,.07)',
                borderRadius:12, padding:'11px 14px'
              }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style=${{ fontSize:12, fontWeight:700, color:ev.color }}>${ev.label}</div>
                  <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', whiteSpace:'nowrap', marginLeft:10 }}>${fmtDate(ev.date)}</div>
                </div>
                <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                  <${Avatar} name=${ev.player.name} color=${ev.color} size=${22} />
                  <span style=${{ fontSize:12, fontWeight:600 }}>${ev.player.name}</span>
                  <span style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>${ev.player.pos}</span>
                </div>
              </div>
            </div>`)}
          </div>`
      }
    </div>`}

    <!-- Vue Antecedents -->
    ${vue === 'ant' && _h`<div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
        Facteurs de risque a prendre en compte dans la programmation
      </div>
      ${antecedents.length === 0
        ? _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.3)' }}>Aucun antecedent enregistre</div>`
        : antecedents.map(p => {
          const bTerminees = (p.blessures || []).filter(b => b.statut === 'gueri' || b.statut === 'termine');
          return _h`<div key=${p.id} style=${{
            background:'rgba(255,255,255,.02)', border:'1px solid rgba(56,189,248,.2)',
            borderRadius:14, padding:'14px 18px', marginBottom:9
          }}>
            <div style=${{ display:'flex', gap:12, alignItems:'center', marginBottom:10 }}>
              <${Avatar} name=${p.name} color="#38BDF8" size=${38} />
              <div style=${{ flex:1 }}>
                <div style=${{ fontSize:14, fontWeight:700 }}>${p.name}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>${p.pos} · statut actuel : <span style=${{ color:(STATUS_CFG[p.status]||STATUS_CFG.ok).color, fontWeight:700 }}>${(STATUS_CFG[p.status]||STATUS_CFG.ok).label}</span></div>
              </div>
            </div>
            ${bTerminees.map((b, bi) => _h`<div key=${bi} style=${{
              background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.15)',
              borderRadius:9, padding:'9px 12px', marginBottom:5
            }}>
              <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style=${{ fontSize:12, fontWeight:700 }}>${b.zone} — ${b.type}</span>
                <span style=${{ fontSize:10, color:'#4CAF50', fontWeight:700 }}>GUERI / TERMINE</span>
              </div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)' }}>Debut : ${fmtDate(b.dateDebut)}${b.dateGueri ? ' · Fin : ' + fmtDate(b.dateGueri) : ''}</div>
              ${b.protocole && _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4 }}>${b.protocole}</div>`}
            </div>`)}
            <button class="btn btn-sm" style=${{ marginTop:6 }} onClick=${() => onSelectPlayer(p)}>Voir fiche →</button>
          </div>`;
        })
      }
    </div>`}
  </div>`;
}
