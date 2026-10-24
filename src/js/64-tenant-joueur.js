


// ── TENANT PLAYER VIEW — Espace joueur d'un tenant externe ────────────────────
function TenantPlayerView({ session }) {
  const { logout } = useApp();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWellness, setShowWellness] = useState(false);
  const [ficheExo, setFicheExo] = useState(null);
  const ficheDirecte = useRef(false); // fiche rangée sous son id : écriture directe, sans relire la liste

  React.useEffect(() => {
    if (!window.__perfhand_db || !session.tenantId || !session.playerId) return;
    // Sa fiche uniquement (les règles n'autorisent plus un joueur à lire celles des autres).
    // Secours : ancienne lecture de la liste si la fiche n'est pas rangée sous son id.
    const refFiche = window.__perfhand_db.ref('tenants/' + session.tenantId + '/playersPerso/' + session.playerId);
    const refListe = window.__perfhand_db.ref('tenants/' + session.tenantId + '/playersPerso');
    let ecouteListe = null;
    const hFiche = refFiche.on('value', snap => {
      const v = snap.val();
      if (v && v.id === session.playerId) { ficheDirecte.current = true; setPlayer(v); setLoading(false); return; }
      if (ecouteListe) return;
      ecouteListe = refListe.on('value', s2 => {
        const raw = s2.val();
        if (raw) {
          const p = (Array.isArray(raw) ? raw : Object.values(raw)).filter(Boolean).find(x => x.id === session.playerId);
          if (p) setPlayer(p);
        }
        setLoading(false);
      }, () => setLoading(false));
    }, () => setLoading(false));
    // Charger la bibliothèque custom partagée (pour les fiches exercices)
    window.__perfhand_db.ref('bibliothequeCustom').on('value', snap => {
      const raw = snap.val();
      if (raw) { window.__perfhand_custom_biblio = Array.isArray(raw) ? raw : Object.values(raw); }
    });
    // Charger les corrections de lien vidéo/image (mouvements de base cassés)
    window.__perfhand_db.ref('bibliothequeOverrides').on('value', snap => {
      window.__perfhand_biblio_overrides = snap.val() || {};
    });
    return () => {
      refFiche.off('value', hFiche);
      if (ecouteListe) refListe.off('value', ecouteListe);
      window.__perfhand_db.ref('bibliothequeCustom').off();
      window.__perfhand_db.ref('bibliothequeOverrides').off();
    };
  }, [session.tenantId, session.playerId]);

  function saveSeances(newSeances) {
    if (!player || !window.__perfhand_db) return;
    let safeSeances; try { safeSeances = JSON.parse(JSON.stringify(newSeances)); } catch(e) { safeSeances = newSeances; }
    if (ficheDirecte.current) {
      window.__perfhand_db.ref('tenants/' + session.tenantId + '/playersPerso/' + session.playerId + '/muscuSeances').set(safeSeances)
        .catch(e => console.error('[muscuSeances] échec:', e && e.code, e && e.message));
      return;
    }
    // playersPerso est un objet keyed par id dans Firebase
    const ref = window.__perfhand_db.ref('tenants/' + session.tenantId + '/playersPerso');
    ref.once('value').then(snap => {
      const raw = snap.val();
      if (!raw) return;
      // Trouver la clé Firebase correspondant au playerId
      const entries = Object.entries(raw);
      const entry = entries.find(([k, v]) => v && v.id === session.playerId);
      if (entry) {
        const [fbKey] = entry;
        window.__perfhand_db.ref('tenants/' + session.tenantId + '/playersPerso/' + fbKey + '/muscuSeances').set(safeSeances)
          .catch(e => console.error('[muscuSeances] échec:', e && e.code, e && e.message));
      } else {
        // Fallback: utiliser directement l'id comme clé
        window.__perfhand_db.ref('tenants/' + session.tenantId + '/playersPerso/' + session.playerId + '/muscuSeances').set(safeSeances)
          .catch(e => console.error('[muscuSeances] échec:', e && e.code, e && e.message));
      }
    });
  }

  if (loading) return _h`<div style=${{ minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.3)' }}>Chargement...</div>`;
  if (!player) return _h`<div style=${{ minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.3)' }}>Profil introuvable</div>`;

  const today = new Date().toISOString().split('T')[0];
  const seances = player.muscuSeances || [];
  const todaySeance = seances.find(s => s.datePrevu === today && !s.dateFaite);
  const aRattraper = seances.filter(s => !s.dateFaite && s.datePrevu < today);
  const prochaine = seances.filter(s => !s.dateFaite && s.datePrevu > today).sort((a,b)=>a.datePrevu>b.datePrevu?1:-1)[0];
  const faites = seances.filter(s => s.dateFaite);

  return _h`<div style=${{ minHeight:'100vh', background:'#0D0D0D', color:'#fff', fontFamily:'Inter,sans-serif' }}>
    <div style=${{ background:'#111', borderBottom:'1px solid #222', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style=${{ fontSize:16, fontWeight:800 }}><span style=${{ color:'#FFA420' }}>PERF</span>HAND</div>
      <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
        <div style=${{ width:30, height:30, borderRadius:50, background:'#FFA420', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, color:'#000' }}>
          ${(player.name||'?')[0].toUpperCase()}
        </div>
        <button class="btn" style=${{ fontSize:10 }} onClick=${logout}>Déco</button>
      </div>
    </div>

    <div style=${{ padding:'20px', maxWidth:600, margin:'0 auto' }}>
      <!-- Profil -->
      <div style=${{ marginBottom:20 }}>
        <div style=${{ fontSize:18, fontWeight:800 }}>${player.name}</div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>${player.sport||''} · ${player.poste||''}</div>
        ${player.objectif ? _h`<div style=${{ marginTop:10, background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'rgba(255,255,255,.6)' }}>🎯 ${player.objectif}</div>` : null}
      </div>

      <!-- Séance du jour -->
      ${todaySeance ? _h`<div style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', borderRadius:14, padding:'16px', marginBottom:16 }}>
        <div style=${{ fontSize:11, color:'#FFA420', fontWeight:800, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>🏋️ Séance du jour</div>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style=${{ fontSize:15, fontWeight:700 }}>${todaySeance.nom}</div>
          ${todaySeance.rpeCible ? _h`<span style=${{ fontSize:11, background:'rgba(255,164,32,.2)', color:'#FFA420', borderRadius:20, padding:'2px 8px', fontWeight:700, flexShrink:0 }}>RPE ${todaySeance.rpeCible}/10</span>` : null}
        </div>
        ${todaySeance.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4 }}>${todaySeance.notes}</div>` : null}

        <!-- Liste exercices détaillée avec bouton fiche -->
        ${(todaySeance.exercices||[]).length > 0 ? _h`<div style=${{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
          ${(todaySeance.exercices||[]).map((ex, i) => {
            const ficheMatch = BIBLIOTHEQUE_MOUVEMENTS.find(m => m.nom.toLowerCase() === (ex.nom||'').toLowerCase());
            const hasFiche = ficheMatch && (ficheMatch.videoId || ficheMatch.notes || ficheMatch.cues);
            const repsArr = ex.reps ? ex.reps.toString().split('/').map(r=>r.trim()) : [];
            const isPyramide = repsArr.length > 1;
            return _h`<div key=${i} style=${{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px' }}>
              <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div style=${{ flex:1 }}>
                  <div style=${{ fontSize:14, fontWeight:700 }}>${ex.nom}</div>
                  <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2, display:'flex', gap:8, flexWrap:'wrap' }}>
                    ${ex.charge ? _h`<span style=${{ color:'#38BDF8' }}>${ex.charge}</span>` : null}
                    ${ex.repos ? _h`<span>⏱ ${ex.repos}</span>` : null}
                  </div>
                </div>
                <div style=${{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                  <span style=${{ fontSize:12, fontWeight:800, color:'#FFA420' }}>${ex.series||''}×${ex.reps||''}</span>
                  ${hasFiche ? _h`<button onClick=${() => setFicheExo(ficheMatch)}
                    style=${{ background:'rgba(255,164,32,.15)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', borderRadius:8, padding:'4px 9px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                    ℹ
                  </button>` : null}
                </div>
              </div>
              ${isPyramide ? _h`<div style=${{ background:'rgba(0,0,0,.3)', borderRadius:8, padding:'8px 10px' }}>
                ${repsArr.map((r, si) => _h`<div key=${si} style=${{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'3px 0', borderBottom: si < repsArr.length-1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <span style=${{ color:'rgba(255,255,255,.4)' }}>S${si+1}</span>
                  <span style=${{ fontWeight:700 }}>${r}</span>
                  ${ex.charge && ex.charge.includes('1RM') ? _h`<span style=${{ color:'#38BDF8', fontSize:11 }}>${ex.charge}</span>` : null}
                </div>`)}
              </div>` : null}
              ${ex.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:6, fontStyle:'italic' }}>${ex.notes}</div>` : null}
            </div>`;
          })}
        </div>` : null}

        <button class="btn btn-primary" style=${{ marginTop:12, fontSize:12, width:'100%' }}
          onClick=${() => {
            const ns = seances.map(s => s.id===todaySeance.id ? {...s, dateFaite:today} : s);
            saveSeances(ns);
            setTimeout(() => setShowWellness(true), 300);
          }}>
          ✅ Séance terminée
        </button>
      </div>` : _h`<div style=${{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:14, padding:'16px', marginBottom:16, textAlign:'center', color:'rgba(255,255,255,.3)' }}>
        <div style=${{ fontSize:24, marginBottom:6 }}>🏃</div>
        <div style=${{ fontSize:12 }}>Pas de séance aujourd'hui</div>
        ${prochaine ? _h`<div style=${{ fontSize:11, marginTop:6, color:'rgba(255,164,32,.6)' }}>Prochaine : ${prochaine.nom} le ${prochaine.datePrevu}</div>` : null}
      </div>`}

      <!-- À rattraper -->
      ${aRattraper.length > 0 ? _h`<div style=${{ marginBottom:16 }}>
        <div style=${{ fontSize:10, fontWeight:800, color:'#FF7A00', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>⚠ À rattraper (${aRattraper.length})</div>
        ${aRattraper.map(s => _h`<div key=${s.id} style=${{ background:'rgba(255,122,0,.05)', border:'1px solid rgba(255,122,0,.15)', borderRadius:10, padding:'12px 14px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style=${{ fontSize:12, fontWeight:600 }}>${s.nom}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>Prévue le ${s.datePrevu}</div>
          </div>
          <button class="btn btn-primary" style=${{ fontSize:10, padding:'5px 10px' }}
            onClick=${() => {
              const ns = seances.map(x => x.id===s.id ? {...x, dateFaite:today} : x);
              saveSeances(ns);
              setTimeout(() => setShowWellness(true), 300);
            }}>Faite ✓</button>
        </div>`)}
      </div>` : null}

      <!-- Fiche exercice popup -->
      ${ficheExo ? React.createElement(ExerciceFichePopup, { exercice: ficheExo, onClose: () => setFicheExo(null) }) : null}

      <!-- Wellness popup -->
      ${showWellness ? _h`<${WellnessPopup}
        mode=${'bilan'}
        onClose=${() => setShowWellness(false)}
        onSubmit=${(data) => {
          setShowWellness(false);
          const lastDone = seances.slice().reverse().find(s => s.dateFaite === today && !s.wellness);
          if (lastDone) {
            const ns = seances.map(s => s.id === lastDone.id ? {...s, wellness: data} : s);
            saveSeances(ns);
          }
        }}
      />` : null}

      <!-- Historique -->
      ${faites.length > 0 ? _h`<div>
        <div style=${{ fontSize:10, fontWeight:800, color:'#4CAF50', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>✓ Historique (${faites.length})</div>
        ${faites.slice().reverse().slice(0,5).map(s => _h`<div key=${s.id} style=${{ background:'rgba(76,175,80,.03)', border:'1px solid rgba(76,175,80,.1)', borderRadius:10, padding:'10px 14px', marginBottom:6 }}>
          <div style=${{ fontSize:12, fontWeight:600 }}>${s.nom}</div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>Faite le ${s.dateFaite}</div>
          ${s.wellness ? _h`<div style=${{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
            ${s.wellness.rpe ? _h`<span style=${{ fontSize:10, background:'rgba(255,164,32,.1)', color:'#FFA420', borderRadius:4, padding:'2px 6px' }}>RPE ${s.wellness.rpe}/10</span>` : null}
            ${s.wellness.fatigue ? _h`<span style=${{ fontSize:10, background:'rgba(255,122,0,.1)', color:'#FF7A00', borderRadius:4, padding:'2px 6px' }}>Fatigue ${s.wellness.fatigue}/5</span>` : null}
            ${s.wellness.sommeil ? _h`<span style=${{ fontSize:10, background:'rgba(100,150,255,.1)', color:'#6496FF', borderRadius:4, padding:'2px 6px' }}>Sommeil ${s.wellness.sommeil}/5</span>` : null}
            ${s.wellness.energie ? _h`<span style=${{ fontSize:10, background:'rgba(76,175,80,.1)', color:'#4CAF50', borderRadius:4, padding:'2px 6px' }}>Énergie ${s.wellness.energie}/5</span>` : null}
            ${s.wellness.douleurs ? _h`<span style=${{ fontSize:10, background:'rgba(255,68,85,.1)', color:'#FF4455', borderRadius:4, padding:'2px 6px' }}>Douleurs ${s.wellness.douleurs}/5</span>` : null}
          </div>` : _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.2)', marginTop:4, fontStyle:'italic' }}>Pas de wellness renseigné</div>`}
        </div>`)}
      </div>` : null}
    </div>
  </div>`;
}
