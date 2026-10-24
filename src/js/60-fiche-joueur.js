
function PlayerDetail({ p, db, setDb, onBack, staffPermissions }) {
  const [tab, setTab]           = useState('profil');
  const [editProfile, setEditProfile] = useState(false);
  const [editBlessure, setEditBlessure] = useState(false);
  const [editProtocol, setEditProtocol] = useState(false);

  let player = (db.playerProfiles||[]).find(pl => pl.id === p.id) || p;
  const sc = STATUS_CFG[player.status] || STATUS_CFG.ok;
  function setDbPerso(fn) {
    setDb(d => {
      const fakeDb = { ...d, players: d.playerProfiles || [] };
      const next = typeof fn === 'function' ? fn(fakeDb) : fn;
      return { ...d, playerProfiles: next.playerProfiles || (d.playerProfiles||[]) };
    });
  }
  // Ensure nested objects exist
  if (!player.stats) player = { ...player, stats: { sessions:0, absences:0, chargeWeek:0, wellness:3 } };
  if (!player.blessures) player = { ...player, blessures: [] };
  if (!player.muscuSeances) player = { ...player, muscuSeances: [] };
  if (!player.bilans) player = { ...player, bilans: [] };

  function savePlayer(updates) {
    updates = lierPoidsProfil(player, updates);
    setDb(d => {
      const updated = (d.playerProfiles||[]).map(pl => pl.id === player.id ? { ...pl, ...updates } : pl);
      // Write directly to Firebase so changes persist across reloads
      // Assaini (JSON round-trip) pour éviter qu'un champ undefined imbriqué fasse échouer
      // toute l'écriture silencieusement (Firebase refuse update() dans ce cas).
      if (window.__perfhand_db) {
        let safeUpdates;
        try { safeUpdates = JSON.parse(JSON.stringify(updates)); } catch(e) { safeUpdates = updates; }
        window.__perfhand_db.ref('perfhand/playerProfiles/' + player.id).update(safeUpdates)
          .catch(function(e){ console.error('[savePlayer] Firebase refuse:', e && e.code, e && e.message); });
      }
      return { ...d, playerProfiles: updated };
    });
  }
  function saveBlessures(blessures) {
    // Auto-tag dateGueri when statut = gueri/termine
    const today = localDateStr();
    const bWithDates = blessures.map(b => {
      if ((b.statut === 'gueri' || b.statut === 'termine') && !b.dateGueri) {
        return { ...b, dateGueri: today };
      }
      return b;
    });
    // Auto-update player status based on blessures
    const hasActive = bWithDates.some(b => b.statut === 'en cours');
    const hasSurv   = bWithDates.some(b => b.statut === 'surveillance');
    const autoStatus = hasActive ? 'blesse' : hasSurv ? 'surveille' : 'ok';
    setDb(d => {
      const updated = (d.playerProfiles||[]).map(pl =>
        pl.id === player.id ? { ...pl, blessures: bWithDates, status: autoStatus } : pl
      );
      if (window.__perfhand_db) {
        // IMPORTANT — même correctif que savePlayer() juste au-dessus : Firebase update()
        // rejette SILENCIEUSEMENT (sans .catch, ça passait totalement inaperçu) toute écriture
        // contenant un champ undefined imbriqué (ex: une ancienne blessure sans `etapes`/
        // `etapeActuelle`, ou un champ optionnel jamais renseigné). L'ajout semblait fonctionner
        // localement (l'état React se mettait à jour), mais rien n'était réellement sauvegardé
        // côté Firebase — la nouvelle blessure disparaissait ensuite au rechargement ou dès que
        // les données serveur revenaient écraser l'état local. On assainit donc (JSON round-trip)
        // avant écriture, et on logue/alerte si ça échoue quand même, au lieu de rester muet.
        let safeBlessures; try { safeBlessures = JSON.parse(JSON.stringify(bWithDates)); } catch(e) { safeBlessures = bWithDates; }
        window.__perfhand_db.ref('perfhand/playerProfiles/' + player.id).update({ blessures: safeBlessures, status: autoStatus })
          .catch(function(e) {
            console.error('[saveBlessures] Firebase refuse:', e && e.code, e && e.message);
            alert("Erreur : la blessure n'a pas pu être enregistrée. Vérifie ta connexion et réessaie.");
          });
      }
      return { ...d, playerProfiles: updated };
    });
  }
  function saveProtocol(protocol) {
    if (window.__perfhand_db && player && player.id) {
      const path = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
      let safe; try { safe = JSON.parse(JSON.stringify(protocol)); } catch(e) { safe = protocol; }
      window.__perfhand_db.ref(path + player.id + '/protocol').set(safe)
        .then(function(){ console.log('[protocol] ✅ écrit pour', player.name); })
        .catch(function(e){ console.error('[protocol] ❌ échec:', e && e.code, e && e.message); alert('Erreur : le protocole n\'a pas pu être enregistré.'); });
    }
    setDb(d => ({ ...d, playerProfiles: (d.playerProfiles||[]).map(pl => pl.id === player.id ? { ...pl, protocol } : pl) }));
  }

  // Null guard
  if (!player) return _h`<div style=${{ padding:40, textAlign:'center', color:'rgba(255,255,255,.4)' }}>
    <div style=${{ marginBottom:12 }}>Joueur introuvable</div>
    ${onBack ? _h`<button class="btn" onClick=${onBack}>← Retour</button>` : null}
  </div>`;

  return _h`<div class="page-pad" style=${{ maxWidth:"100%", overflowX:"hidden" }}>
    ${onBack ? _h`<button class="btn btn-sm" onClick=${onBack} style=${{ marginBottom:14, display:'inline-flex', alignItems:'center', gap:6 }}>← Retour</button>` : null}

    <!-- Hero -->
    <div style=${{ display:'flex', gap:14, alignItems:'center', marginBottom:16, padding:'14px 18px', background:sc.color+'07', border:'1px solid '+sc.color+'22', borderRadius:16 }}>
      <${Avatar} name=${player.name} color=${sc.color} size=${48} />
      <div style=${{ flex:1 }}>
        <div style=${{ fontSize:22, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${player.name}</div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:6 }}>#${player.num} — ${player.pos} — ${player.age} ans — ${player.poids} kg</div>
        <${Badge} status=${player.status} />
      </div>
      <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
        <button class="btn btn-sm" onClick=${() => setEditProfile(true)} style=${{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)' }}>✏️ Modifier</button>
        <button class="btn btn-sm" onClick=${() => {
          if (window.__perfhand_db) {
            genererCodeAcces('perfhand/codes/', {
              playerId: player.id, playerName: player.name, clubId: player.clubId || 'usm',
              createdAt: new Date().toISOString()
            }).then(code => {
              alert('Code d\'accès de ' + player.name + ' :\n\n      ' + code + '\n\nEnvoie ce code au joueur avec le lien perfhandballapp.netlify.app\nIl se connecte via "Code joueur" — aucun mot de passe nécessaire.');
            }).catch(e => alert('Erreur : ' + e.message));
          }
        }} style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>📋 Code accès</button>
      </div>
    </div>

    <!-- Tabs -->
    <div style=${{ display:'flex', gap:4, marginBottom:16, background:'rgba(255,255,255,.03)', borderRadius:11, padding:3, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
      ${[['profil','Profil',null],['planif','📅 Planif','planif'],['nutrition','Nutrition','nutrition'],['musculation','Musculation','muscu'],['endurance','Endurance','endurance'],['bilan','Bilan','bilan'],['blessures','Blessures','blessures'],['mental','Mental','mental'],['protocole','Protocole','protocole'],...(player.genre==='F'?[['cycle','🌸 Cycle',null]]:[])
      ].filter(([id,l,perm]) => !staffPermissions || !perm || staffPermissions.includes(perm)).map(([id,l]) =>
        _h`<button key=${id} onClick=${() => setTab(id)} style=${{
          flexShrink:0, background: tab===id ? 'rgba(255,255,255,.07)' : 'transparent',
          border: tab===id ? '1px solid rgba(255,255,255,.1)' : '1px solid transparent',
          color: tab===id ? '#fff' : 'rgba(255,255,255,.4)',
          padding:'8px 10px', borderRadius:9, fontSize:11, fontWeight: tab===id ? 600 : 400, cursor:'pointer',
          whiteSpace:'nowrap'
        }}>${l}</button>`
      )}
    </div>

    <!-- PROFIL TAB -->
    ${tab === 'profil' && _h`<div>
      <!-- Export portabilité -->
      ${_h`<div style=${{ marginBottom:14, background:'rgba(56,189,248,.04)', border:'1px solid rgba(56,189,248,.12)', borderRadius:12, padding:'12px 14px' }}>
        <div style=${{ fontSize:11, fontWeight:700, color:'#38BDF8', marginBottom:3 }}>📦 Mes données m'appartiennent</div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:8, lineHeight:1.5 }}>
          Exporte ton profil pour le transférer vers un autre club qui utilise PerfHand.
        </div>
        <button class="btn btn-sm" style=${{ width:'100%', background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', fontWeight:700 }}
          onClick=${() => {
            const data = {
              v:1, name:player.name, email:player.email||'', sport:'Handball',
              age:player.age, poids:player.poids, taille:player.taille, genre:player.genre||'M',
              pos:player.pos, bilans:player.bilans||[], bilansSem:player.bilansSem||[],
              muscuSeances:player.muscuSeances||[], enduranceSeances:player.enduranceSeances||[],
              blessures:player.blessures||[], tests:player.tests||[], rmHistory:player.rmHistory||[],
              nutrition:player.nutrition, cycles:player.cycles||[],
              exportDate: localDateStr(),
            };
            const code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
            const blob = new Blob([code], {type:'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'profil_' + (player.name||'joueur').replace(/\s+/g,'_') + '.perfhand';
            a.click(); URL.revokeObjectURL(url);
          }}>
          ⬇️ Exporter mon profil (.perfhand)
        </button>
      </div>`}
      <div class="grid-2" style=${{ marginBottom:14 }}>
        <div class="card">
          <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>Profil physique</div>
          ${[['Taille',player.taille+' cm'],['Poids',player.poids+' kg'],['Age',player.age+' ans'],['Poste',player.pos],['Numero','#'+player.num]].map(([l,v]) =>
            _h`<div key=${l} style=${{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <span style=${{ color:'rgba(255,255,255,.35)' }}>${l}</span>
              <span style=${{ fontWeight:600 }}>${v}</span>
            </div>`
          )}
        </div>
        <div class="card">
          <div style=${{ fontSize:12, fontWeight:700, marginBottom:10 }}>Stats semaine</div>
          <div class="grid-2">
            ${[['Seances',player.stats.sessions],['Absences',player.stats.absences],['Charge',player.stats.chargeWeek+'%'],['Wellness',player.stats.wellness+'/5']].map(([l,v]) =>
              _h`<div key=${l} style=${{ background:'rgba(255,255,255,.03)', borderRadius:9, padding:'8px 10px' }}>
                <div style=${{ fontSize:9, color:'rgba(255,255,255,.25)', textTransform:'uppercase' }}>${l}</div>
                <div style=${{ fontSize:18, fontWeight:700, marginTop:2 }}>${v}</div>
              </div>`
            )}
          </div>
        </div>
      </div>
      ${player.notes && _h`<div class="card-accent">
        <div style=${{ fontSize:11, color:'#FFA420', fontWeight:700, marginBottom:6 }}>MESSAGE COACH</div>
        <div style=${{ fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.8 }}>${player.notes}</div>
      </div>`}
    </div>`}

    <!-- Login info card (visible dans onglet Profil) -->
    ${tab === 'profil' && React.createElement(LoginInfoCard, { player, setDb })}

    <!-- PLANIF TAB -->
    ${tab === 'planif' && React.createElement(PersoPlanifView, { player, setDb, isCoach: true })}

    <!-- NUTRITION TAB -->
    ${tab === 'nutrition' && _h`<${NutritionView} player=${player} db=${db} setDb=${setDb} isCoach=${true} />`}

    <!-- MUSCULATION TAB -->
    ${tab === 'musculation' && React.createElement(MuscuView, { player, setDb, isCoach: true, db })}

    <!-- ENDURANCE TAB -->
    ${tab === 'endurance' && React.createElement(EnduranceView, { player: player, setDb: setDb, isCoach: true, db: db })}

    ${tab === 'bilan' && _h`<${SuiviChargeView} player=${player} setDb=${setDb} isCoach=${true} />`}

    ${tab === 'blessures' && _h`<div>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style=${{ fontSize:15, fontWeight:700 }}>Blessures & suivi</div>
        <button class="btn btn-sm" onClick=${() => setEditBlessure(true)} style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>✏️ Modifier</button>
      </div>
      ${(() => {
        const bAll = player.blessures || [];
        const bActives = bAll.filter(b => b.statut === 'en cours' || b.statut === 'surveillance');
        const bHistorique = bAll.filter(b => b.statut === 'gueri' || b.statut === 'termine');

        const renderBlessure = (b, i) => {
          const sC = b.statut === 'en cours' ? '#FF4455' : b.statut === 'surveillance' ? '#FF7A00' : b.statut === 'termine' ? '#38BDF8' : '#4CAF50';
          return _h`<div key=${i} style=${{ background:sC+'06', border:'1px solid '+sC+'20', borderRadius:13, padding:'13px 16px', marginBottom:9 }}>
            <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <div style=${{ fontSize:14, fontWeight:700 }}>${b.zone} — ${b.type}</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>
                  Debut : ${b.dateDebut}${b.dateGueri ? ' · Fin : '+b.dateGueri : ''}
                </div>
              </div>
              <div style=${{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700, background:sC+'15', color:sC }}>${b.statut.toUpperCase()}</div>
            </div>
            ${b.protocole && _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.6)', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 10px', marginBottom: b.etapes ? 10 : 0 }}>${b.protocole}</div>`}
            ${b.etapes && _h`<div style=${{ marginTop:10 }}>
              <div style=${{ display:'flex', position:'relative' }}>
                <div style=${{ position:'absolute', top:12, left:12, right:12, height:2, background:'rgba(255,255,255,.07)' }}></div>
                ${b.etapes.map((e, j) => _h`<div key=${j} style=${{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, position:'relative', zIndex:2 }}>
                  <div style=${{ width:24, height:24, borderRadius:'50%', background:j<b.etapeActuelle?sC:j===b.etapeActuelle?'#FF7A00':'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:j<=b.etapeActuelle?'#fff':'rgba(255,255,255,.25)' }}>${j < b.etapeActuelle ? '✓' : j+1}</div>
                  <div style=${{ fontSize:8, textAlign:'center', maxWidth:58, lineHeight:1.3, color:j===b.etapeActuelle?'#FF7A00':'rgba(255,255,255,.3)' }}>${e}</div>
                </div>`)}
              </div>
            </div>`}
          </div>`;
        };

        if (bAll.length === 0) return _h`<div style=${{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,.2)' }}>
          Aucune blessure enregistree
          <br/><button class="btn btn-sm" style=${{ marginTop:12 }} onClick=${() => setEditBlessure(true)}>+ Ajouter</button>
        </div>`;

        return _h`<div>
          <!-- Blessures actives -->
          ${bActives.length > 0 ? _h`<div style=${{ marginBottom:16 }}>
            <div style=${{ fontSize:10, color:'#FF4455', textTransform:'uppercase', letterSpacing:1.5, fontWeight:800, marginBottom:8 }}>En cours (${bActives.length})</div>
            ${bActives.map((b, i) => renderBlessure(b, i))}
          </div>` : _h`<div style=${{ textAlign:'center', padding:'20px', color:'rgba(76,175,80,.6)', background:'rgba(76,175,80,.04)', border:'1px solid rgba(76,175,80,.15)', borderRadius:10, marginBottom:16 }}>
            Aucune blessure active
          </div>`}

          <!-- Historique -->
          ${bHistorique.length > 0 ? _h`<div>
            <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, fontWeight:700 }}>Historique (${bHistorique.length})</div>
              <div style=${{ flex:1, height:1, background:'rgba(255,255,255,.07)' }}></div>
            </div>
            ${bHistorique.map((b, i) => _h`<div key=${i} style=${{
              background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.07)',
              borderRadius:10, padding:'10px 13px', marginBottom:6, opacity:.75
            }}>
              <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style=${{ fontSize:13, fontWeight:700 }}>${b.zone} — ${b.type}</div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:2 }}>
                    ${b.dateDebut} → ${b.dateGueri || '?'}
                    ${b.dateDebut && b.dateGueri ? _h`<span style=${{ color:'rgba(255,255,255,.2)', marginLeft:6 }}>
                      (${Math.round((new Date(b.dateGueri)-new Date(b.dateDebut))/(1000*3600*24))} j)
                    </span>` : null}
                  </div>
                </div>
                <div style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(76,175,80,.12)', color:'#4CAF50', fontWeight:700 }}>GUERI</div>
              </div>
              ${b.protocole ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:5 }}>${b.protocole}</div>` : null}
            </div>`)}
          </div>` : null}
        </div>`;
      })()}
    </div>`}

    <!-- MENTAL TAB -->
    ${tab === 'mental' && React.createElement(MentalPrepView, { player, savePlayer })}

    ${tab === 'cycle' && player.genre === 'F' && React.createElement(CycleView, { player, savePlayer })}

    <!-- PROTOCOLE TAB -->
    ${tab === 'protocole' && _h`<div>
      <!-- Protocole personnalisé joueur -->
      ${(player.protocol && (player.protocol||[]).length > 0) ? _h`<div style=${{ marginBottom:20 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style=${{ fontSize:13, fontWeight:700, color:'#FFA420' }}>📋 Protocole personnalisé</div>
          <button class="btn btn-sm" onClick=${() => setEditProtocol(true)} style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>✏️</button>
        </div>
        ${(player.protocol||[]).map((s, si) => _h`<div key=${si} class="proto-block" style=${{ marginBottom:10 }}>
          <div style=${{ fontSize:13, fontWeight:700, color:'#FFA420', marginBottom:10 }}>${s.nom||''}</div>
          ${(s.exercices||[]).map((ex, ei) => _h`<div key=${ei} style=${{ padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style=${{ fontSize:13, fontWeight:600 }}>${ex.nom}</div>
              <span style=${{ fontSize:12, color:'#FFA420', fontWeight:700 }}>${ex.series ? ex.series + '×' : ''}${ex.reps}</span>
            </div>
            <div style=${{ display:'flex', gap:10, marginTop:2 }}>
              <span style=${{ fontSize:11, color:'#38BDF8' }}>${ex.charge}</span>
              <span style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>⏱ ${ex.repos}</span>
            </div>
            ${ex.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:4, lineHeight:1.5, fontStyle:'italic' }}>${ex.notes}</div>` : null}
          </div>`)}
        </div>`)}
      </div>` : _h`<div style=${{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button class="btn btn-sm" onClick=${() => setEditProtocol(true)} style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420' }}>+ Protocole perso</button>
      </div>`}

      <!-- Bibliothèque protocoles -->
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>📚 Bibliothèque protocoles</div>
      ${typeof PROTOCOLES_DATA !== 'undefined' ? React.createElement(ProtocolesHandball, {
        player: player,
        onAssign: (bloc) => saveProtocol([...(player.protocol||[]), bloc])
      }) : _h`<div style=${{ color:'rgba(255,255,255,.3)', padding:'20px', textAlign:'center' }}>Chargement des protocoles...</div>`}
    </div>`}

    <!-- MODALS -->
    ${editProfile && _h`<${EditProfileModal}
      p=${player}
      onSave=${savePlayer}
      onClose=${() => setEditProfile(false)}
    />`}
    ${editBlessure && _h`<${EditBlessureModal}
      p=${player}
      onSave=${saveBlessures}
      onClose=${() => setEditBlessure(false)}
    />`}
    ${editProtocol && _h`<${ProtocolEditor}
      p=${player}
      onSave=${saveProtocol}
      onClose=${() => setEditProtocol(false)}
    />`}
  </div>`;
}
