
// ── PLANIFICATION SAISON ───────────────────────────────────────────────────
const CLUB_CYCLE_MAP = {
  ppg:'PPG', pps1:'PPS 1', pps2:'PPS 2',
  competition:'COMPETITION', prevention:'PREVENTION',
  repos:'REPOS', reprise:'REPRISE', rehab:'REHABILITATION', decharge:'DECHARGE', vide:'AUTONOMIE'
};
const MOIS_FR = ["JANVIER","FEVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOUT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DECEMBRE"];
function buildSaisonFromClubPlanif(clubPlanif) {
  const sems = (clubPlanif && clubPlanif.semaines) || [];
  const dateDebut = clubPlanif && clubPlanif.dateDebut;
  return sems.filter(Boolean).map((w, i) => {
    let dates = w.label || ('S'+(w.num||i+1));
    let mois = "";
    if (dateDebut) {
      const start = new Date(dateDebut); start.setDate(start.getDate() + i*7);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      const moisAbbr = m => m.toLocaleDateString('fr-FR',{month:'short'}).replace('.','');
      dates = start.getMonth() === end.getMonth()
        ? `${start.getDate()}-${end.getDate()} ${moisAbbr(end)}`
        : `${start.getDate()} ${moisAbbr(start)}-${end.getDate()} ${moisAbbr(end)}`;
      mois = MOIS_FR[end.getMonth()];
    }
    return {
      sem: 'S' + (w.num || i+1),
      dates, mois,
      cycle: CLUB_CYCLE_MAP[w.cycle] || 'AUTONOMIE',
      match: w.match || null,
      aerob:0, force:0, posture:0, vitesse:0,
      charge: w.chargeTotal || 0,
      jours: w.jours || null,
      objectifs: w.objectifs || '',
    };
  });
}

function dayArrGlobal(day) {
  if (Array.isArray(day)) return day.length ? day : [{ type:'', heures:0, notes:'', heureDebut:'' }];
  if (day) return [day];
  return [{ type:'', heures:0, notes:'', heureDebut:'' }];
}

// Calcule l'heure de fin (heureDebut + durée) et formate joliment une plage horaire type "18h30 à 20h00"
function calcPlageHoraire(heureDebut, heures) {
  if (!heureDebut) return '';
  const [h, m] = heureDebut.split(':').map(Number);
  if (isNaN(h)) return '';
  const debutTxt = String(h).padStart(2,'0') + 'h' + String(m||0).padStart(2,'0');
  if (!heures || heures <= 0) return debutTxt;
  const totalMin = h*60 + (m||0) + Math.round(heures*60);
  const eh = Math.floor(totalMin/60) % 24;
  const em = totalMin % 60;
  const finTxt = String(eh).padStart(2,'0') + 'h' + String(em).padStart(2,'0');
  return debutTxt + ' à ' + finTxt;
}

// Sélecteur d'heure custom (2 menus déroulants heure/minute) — remplace <input type="time">, dont
// le picker natif du téléphone peut déborder de l'écran sur certains appareils (bouton "Définir"
// coupé, cadran illisible). Rendu 100% en page, jamais d'overlay OS incontrôlable.
const TIME_SELECT_HOURS = Array.from({length:24}, (_,i) => String(i).padStart(2,'0'));
const TIME_SELECT_MINUTES = ['00','15','30','45'];
function TimeSelect({ value, onChange, style, small }) {
  const parts = (value||'').split(':');
  const h = parts[0] || '', m = parts[1] || '';
  const selStyle = {
    background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.15)', borderRadius:6,
    color:'#fff', fontSize: small?11:12, padding: small?'4px 1px':'5px 2px', fontFamily:'Inter,sans-serif',
    textAlign:'center', WebkitAppearance:'none', MozAppearance:'none', appearance:'none'
  };
  return _h`<div style=${{ display:'flex', gap:2, alignItems:'center', ...style }}>
    <select value=${h} onChange=${e => onChange((e.target.value||'00') + ':' + (m||'00'))} style=${selStyle}>
      <option value="">--</option>
      ${TIME_SELECT_HOURS.map(hh => _h`<option key=${hh} value=${hh}>${hh}</option>`)}
    </select>
    <span style=${{ color:'rgba(255,255,255,.3)', fontSize: small?11:12 }}>:</span>
    <select value=${m} onChange=${e => onChange((h||'00') + ':' + (e.target.value||'00'))} style=${selStyle}>
      <option value="">--</option>
      ${TIME_SELECT_MINUTES.map(mm => _h`<option key=${mm} value=${mm}>${mm}</option>`)}
    </select>
  </div>`;
}

const PERSO_CYCLE_MAP = {
  repos:'REPOS', ppg:'PPG', pps1:'PPS 1', pps2:'PPS 2',
  competition:'COMPETITION', prevention:'PREVENTION', reprise:'REPRISE', rehab:'REHABILITATION', decharge:'DECHARGE', vide:'AUTONOMIE'
};
function buildSaisonFromPlayerPlanif(planif) {
  const sems = (planif && planif.semaines) || [];
  const dateDebut = planif && planif.dateDebut;
  return sems.filter(Boolean).map((w, i) => {
    let dates = w.label || ('S'+(w.num||i+1));
    let mois = "";
    if (dateDebut) {
      const start = new Date(dateDebut); start.setDate(start.getDate() + i*7);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      const moisAbbr = m => m.toLocaleDateString('fr-FR',{month:'short'}).replace('.','');
      dates = start.getMonth() === end.getMonth()
        ? `${start.getDate()}-${end.getDate()} ${moisAbbr(end)}`
        : `${start.getDate()} ${moisAbbr(start)}-${end.getDate()} ${moisAbbr(end)}`;
      mois = MOIS_FR[end.getMonth()];
    }
    return {
      sem: 'S' + (w.num || i+1),
      dates, mois,
      cycle: PERSO_CYCLE_MAP[w.cycle] || 'AUTONOMIE',
      match: w.match || null,
      charge: w.heures || 0,
      jours: null,
      // Détail jour par jour en texte libre + horaires, saisi via la planif individuelle
      // (système différent du planning club à base de types de séance) — utilisé en repli
      // par PlanifSaison quand 'jours' (format structuré) est absent.
      joursTxt: [0,1,2,3,4,5,6].some(ji => w['j'+ji] || w['h'+ji] || w['h'+ji+'b'])
        ? [0,1,2,3,4,5,6].map(ji => ({ label: w['j'+ji] || '', heure: w['h'+ji] || '', heure2: w['h'+ji+'b'] || '' }))
        : null,
      objectifs: w.notes || '',
    };
  });
}

function computeCurrentWeekIdx(dateDebut, totalWeeks) {
  if (!dateDebut) return null;
  const start = new Date(dateDebut);
  if (isNaN(start.getTime())) return null;
  const diffDays = Math.floor((new Date() - start) / 86400000);
  const idx = Math.floor(diffDays / 7);
  if (idx < 0 || idx >= totalWeeks) return null;
  return idx;
}

function PlanifSaison({ player, club, db }) {
  const [view, setView] = useState("macro");
  const [selSem, setSelSem] = useState(null);
  const [filterMois, setFilterMois] = useState("TOUS");
  const [matchsOnly, setMatchsOnly] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const clubId = (player && player.clubId) || (club && club.id);
  const clubPlanif = clubId && db ? (db.clubPlanif || {})[clubId] : null;

  // Deux sources possibles : planification individuelle du joueur (player.planif,
  // saisie via sa fiche perso) OU planification collective du club (clubPlanif).
  // La planification individuelle est prioritaire si elle contient reellement du contenu.
  const persoPlanif = player && player.planif;
  const hasPersoPlanif = !!(persoPlanif && Array.isArray(persoPlanif.semaines) &&
    persoPlanif.semaines.some(w => w && ((w.cycle && w.cycle !== 'vide') || w.match || (w.heures||0) > 0)));

  const source = hasPersoPlanif ? 'perso' : (clubPlanif ? 'club' : null);
  const SAISON_ACTIVE = source === 'perso' ? buildSaisonFromPlayerPlanif(persoPlanif)
                       : source === 'club' ? buildSaisonFromClubPlanif(clubPlanif)
                       : SAISON;

  // Filet de sécurité : si la planif individuelle est utilisée mais qu'une semaine
  // n'a pas de détail jour par jour / horaires renseigné, on reprend celui du planning
  // général du club pour cette semaine précise (même si le club a un calage de dates
  // différent, on aligne sur le numéro de semaine S1, S2... qui reste comparable).
  if (source === 'perso' && clubPlanif && Array.isArray(clubPlanif.semaines)) {
    const clubWeeks = buildSaisonFromClubPlanif(clubPlanif);
    SAISON_ACTIVE.forEach((w, i) => {
      if (!w.jours && !w.joursTxt && clubWeeks[i] && clubWeeks[i].jours) {
        w.jours = clubWeeks[i].jours;
      }
    });
  }

  const dateDebut = source === 'perso' ? persoPlanif.dateDebut : (clubPlanif && clubPlanif.dateDebut);
  const objectifTxt = source === 'perso' ? persoPlanif.objectifSaison : (clubPlanif && clubPlanif.objectif);
  const curIdx = computeCurrentWeekIdx(dateDebut, SAISON_ACTIVE.length);
  const SEM_ACT = curIdx !== null ? SAISON_ACTIVE[curIdx].sem : null;

  const matches = SAISON_ACTIVE.map((s,i) => ({ ...s, idx:i })).filter(s => s.match);
  const nextMatch = curIdx !== null ? matches.find(m => m.idx >= curIdx) : matches[0];
  const maxCharge = Math.max(1, ...SAISON_ACTIVE.map(s => s.charge || 0));

  const moisList = ["TOUS", ...Array.from(new Set(SAISON_ACTIVE.map(s => s.mois).filter(Boolean)))];
  const filteredBase = filterMois === "TOUS" ? SAISON_ACTIVE : SAISON_ACTIVE.filter(s => s.mois === filterMois);
  const filtered = matchsOnly ? filteredBase.filter(s => s.match) : filteredBase;

  if (!source) {
    return _h`<div class="page-pad" style=${{ textAlign:"center", padding:60, color:"rgba(255,255,255,0.3)" }}>
      Aucune planification enregistrée pour ${club ? club.name + (club.division ? ' - ' + club.division : '') : 'ton groupe'} pour le moment.
    </div>`;
  }

  return _h`<div class="page-pad" style=${{ maxWidth:"100%", overflowX:"hidden" }}>
    <div style=${{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:10 }}>
      <${SectionTitle} sub=${(club ? club.name + (club.division ? ' - ' + club.division : '') : '') + (source === 'perso' ? ' · planif individuelle' : '')} title=${"PLANIFICATION SAISON"} />
      <div style=${{ display:"flex", gap:8 }}>
        ${[["macro","Vue globale"],["detail","Vue détaillée"]].map(([id,label]) =>
          _h`<button key=${id} class="btn" onClick=${() => setView(id)}
            style=${{ background: view===id ? ACCENT : "rgba(255,255,255,0.04)", color: view===id ? "#000" : "rgba(255,255,255,0.5)", border: view===id ? "none" : "1px solid rgba(255,255,255,0.1)", fontWeight: view===id ? 800 : 400 }}
          >${label}</button>`
        )}
      </div>
    </div>

    ${objectifTxt ? _h`<div style=${{ fontSize:12, color:"rgba(255,255,255,0.45)", marginBottom:16 }}>
      <span style=${{ color:ACCENT, fontWeight:700 }}>Objectif de saison —</span> ${objectifTxt}
    </div>` : null}

    <!-- Bandeau statut -->
    <div class="grid-3" style=${{ marginBottom:18 }}>
      <div style=${{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"12px 14px" }}>
        <div style=${{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Semaine actuelle</div>
        <div style=${{ fontSize:17, fontWeight:800, color: SEM_ACT ? ACCENT : "rgba(255,255,255,0.3)" }}>${SEM_ACT ? SEM_ACT + " / " + SAISON_ACTIVE.length : "Hors saison"}</div>
      </div>
      <div style=${{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"12px 14px" }}>
        <div style=${{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Matchs saison</div>
        <div style=${{ fontSize:17, fontWeight:800 }}>${matches.length}</div>
      </div>
      <div style=${{ background: nextMatch ? "rgba(255,164,32,0.08)" : "rgba(255,255,255,0.03)", border: nextMatch ? "1px solid rgba(255,164,32,0.3)" : "none", borderRadius:12, padding:"12px 14px" }}>
        <div style=${{ fontSize:9, color: nextMatch ? ACCENT : "rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Prochain match</div>
        <div style=${{ fontSize:13, fontWeight:800, color: nextMatch ? "#fff" : "rgba(255,255,255,0.3)" }}>${nextMatch ? nextMatch.sem + " · " + nextMatch.dates : "—"}</div>
        ${nextMatch ? _h`<div style=${{ fontSize:11, color:ACCENT, marginTop:2, fontWeight:700 }}>${nextMatch.match}</div>` : null}
      </div>
    </div>

    <!-- Legende cycles -->
    <div style=${{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:18 }}>
      ${Object.entries(CYCLE_COLORS).filter(([k]) => k !== "AUTONOMIE").map(([k,v]) =>
        _h`<div key=${k} style=${{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:v.bg, border:"1px solid " + v.color + "30" }}>
          <div style=${{ width:7, height:7, borderRadius:"50%", background:v.color }}></div>
          <span style=${{ fontSize:10, color:v.color, fontWeight:700 }}>${k}</span>
        </div>`
      )}
    </div>

    ${view === "macro" && _h`<div>

      <!-- Temps forts : matchs de la saison -->
      ${matches.length > 0 ? _h`<div class="card" style=${{ marginBottom:20 }}>
        <div style=${{ fontSize:12, fontWeight:700, marginBottom:12 }}>🏆 Temps forts de la saison</div>
        <div style=${{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
          ${matches.map(m => {
            const isPast = curIdx !== null ? m.idx < curIdx : false;
            const isNext = nextMatch && nextMatch.sem === m.sem;
            return _h`<div key=${m.sem}
              onClick=${() => { setView("detail"); setFilterMois(m.mois); setMatchsOnly(false); }}
              style=${{
                minWidth:118, flexShrink:0, cursor:"pointer",
                background: isNext ? "rgba(255,164,32,0.12)" : "rgba(255,255,255,0.03)",
                border: "1px solid " + (isNext ? "rgba(255,164,32,0.5)" : "rgba(255,255,255,0.07)"),
                borderRadius:12, padding:"10px 12px", opacity: isPast ? 0.4 : 1
              }}>
              <div style=${{ fontSize:9, color:"rgba(255,255,255,0.35)", fontWeight:700 }}>${m.sem} · ${m.dates}</div>
              <div style=${{ fontSize:12, fontWeight:800, color: isNext ? ACCENT : "#fff", marginTop:4 }}>${m.match}</div>
              ${isNext ? _h`<div style=${{ fontSize:9, color:ACCENT, marginTop:4, fontWeight:800 }}>À VENIR</div>` : (isPast ? _h`<div style=${{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:4 }}>Joué</div>` : null)}
            </div>`;
          })}
        </div>
      </div>` : null}

      <!-- Barre timeline (charge reelle par semaine) -->
      <div class="card" style=${{ marginBottom:20 }}>
        <div style=${{ fontSize:12, fontWeight:700, marginBottom:12 }}>Progression saison — ${SAISON_ACTIVE.length} semaines${SEM_ACT ? " · en cours : " + SEM_ACT : ""}</div>
        <div style=${{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling:"touch", paddingBottom: isMobile ? 4 : 0 }}>
          <div style=${{ display:"flex", gap: isMobile ? 5 : 2, height:54, alignItems:"flex-end", minWidth: isMobile ? (SAISON_ACTIVE.length * 21) + "px" : "auto" }}>
            ${SAISON_ACTIVE.map((s,i) => {
              const cc = CYCLE_COLORS[s.cycle] || CYCLE_COLORS["AUTONOMIE"];
              const isCur = i === curIdx;
              const h = s.charge > 0 ? Math.max(14, Math.round((s.charge / maxCharge) * 50)) : 5;
              return _h`<div key=${s.sem}
                onClick=${() => setSelSem(selSem && selSem.sem === s.sem ? null : { ...s, idx:i })}
                title=${s.sem + " - " + s.dates + " - " + s.cycle + (s.match ? " - " + s.match : "")}
                style=${{
                  flex: isMobile ? "0 0 16px" : 1, width: isMobile ? 16 : "auto",
                  display:"flex", flexDirection:"column", justifyContent:"flex-end", cursor:"pointer", position:"relative",
                  padding: isMobile ? "10px 0" : 0, minHeight: isMobile ? 74 : "auto"
                }}
              >
                ${s.match ? _h`<div style=${{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", fontSize:9 }}>🏆</div>` : null}
                <div style=${{ height:h+"px", background:cc.color, opacity: isCur ? 1 : 0.55, borderRadius:"2px 2px 0 0", outline: isCur ? "2px solid #fff" : "none" }}></div>
              </div>`;
            })}
          </div>
        </div>
        ${isMobile ? _h`<div style=${{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:6, textAlign:"center" }}>← Fais défiler pour voir toute la saison →</div>` : null}
        <div style=${{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          ${Array.from(new Set(SAISON_ACTIVE.map(s => s.mois).filter(Boolean))).map(m =>
            _h`<div key=${m} style=${{ fontSize:8, color:"rgba(255,255,255,0.25)" }}>${(m||"").slice(0,4)}</div>`
          )}
        </div>
        <div style=${{ fontSize:9, color:"rgba(255,255,255,0.2)", marginTop:8 }}>🏆 = match · hauteur = charge horaire de la semaine · contour blanc = semaine actuelle</div>
      </div>

      <!-- Popup semaine -->
      ${selSem && (() => {
        const cc = CYCLE_COLORS[selSem.cycle] || CYCLE_COLORS["AUTONOMIE"];
        return _h`<div style=${{ background:cc.bg, border:"1px solid " + cc.color + "40", borderRadius:16, padding:"18px 22px", marginBottom:18 }}>
          <div style=${{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style=${{ fontSize:20, fontWeight:800, color:cc.color, fontFamily:"'Barlow Condensed',sans-serif" }}>${selSem.sem} - ${selSem.dates}</div>
              <div style=${{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>${selSem.mois} - Cycle ${selSem.cycle}</div>
            </div>
            <button onClick=${() => setSelSem(null)} style=${{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:18, cursor:"pointer" }}>x</button>
          </div>
          ${selSem.match ? _h`<div style=${{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)", borderRadius:20, padding:"4px 14px", marginBottom:14, fontSize:12, fontWeight:700 }}>🏆 Match : ${selSem.match}</div>` : null}
          ${selSem.jours ? (isMobile ? _h`<div style=${{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
            ${JOURS.map((jourLabel, ji) => {
              const sessions = dayArrGlobal(selSem.jours[ji]);
              const hasContent = sessions.some(j => j.type);
              return _h`<div key=${jourLabel} style=${{
                display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <div style=${{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,0.5)", minWidth:36 }}>${jourLabel}</div>
                <div style=${{ display:"flex", flexDirection:"column", gap:4, flex:1 }}>
                  ${hasContent ? sessions.filter(j=>j.type).map((j,si) => {
                    const t = TYPES_SEANCE.find(ts => ts.id === j.type);
                    const plage = calcPlageHoraire(j.heureDebut, j.heures);
                    return _h`<div key=${si} style=${{ display:"flex", flexDirection:"column", gap:1 }}>
                      <div style=${{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style=${{ fontSize:18 }}>${t ? t.icon : "—"}</span>
                        <span style=${{ fontSize:13, fontWeight:600, color: t ? t.color : "#fff" }}>${t ? t.label : ""}</span>
                        ${(!plage && j.heures) ? _h`<span style=${{ fontSize:12, color:"rgba(255,255,255,0.4)", marginLeft:"auto" }}>${j.heures}h</span>` : null}
                      </div>
                      ${plage ? _h`<div style=${{ fontSize:11, color:"#38BDF8", fontWeight:700, marginLeft:26 }}>🕐 De ${plage}${j.heures ? ' (' + j.heures + 'h)' : ''}</div>` : null}
                    </div>`;
                  }) : _h`<span style=${{ fontSize:13, color:"rgba(255,255,255,0.2)" }}>Repos</span>`}
                </div>
              </div>`;
            })}
          </div>` : _h`<div style=${{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
            ${JOURS.map((jourLabel, ji) => {
              const sessions = dayArrGlobal(selSem.jours[ji]);
              return _h`<div key=${jourLabel} style=${{
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                minWidth:64, padding:"6px 4px", borderRadius:8,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                <span style=${{ fontSize:8, color:"rgba(255,255,255,0.3)", fontWeight:700 }}>${jourLabel}</span>
                ${sessions.map((j,si) => {
                  const t = TYPES_SEANCE.find(ts => ts.id === j.type);
                  const plage = calcPlageHoraire(j.heureDebut, j.heures);
                  return _h`<div key=${si} style=${{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                    <span style=${{ fontSize:14 }}>${t ? t.icon : (si===0 ? "—" : "")}</span>
                    ${plage ? _h`<span style=${{ fontSize:7.5, color:"#38BDF8", fontWeight:700, whiteSpace:"nowrap" }}>${plage}</span>` : null}
                    ${(!plage && j.heures) ? _h`<span style=${{ fontSize:8, color: t ? t.color : "rgba(255,255,255,0.15)" }}>${j.heures}h</span>` : null}
                  </div>`;
                })}
              </div>`;
            })}
          </div>`) : null}
          ${(!selSem.jours && selSem.joursTxt) ? _h`<div style=${{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
            ${JOURS.map((jourLabel, ji) => {
              const d = selSem.joursTxt[ji] || {};
              if (!d.label && !d.heure && !d.heure2) return null;
              return _h`<div key=${jourLabel} style=${{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style=${{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,0.5)", minWidth:32 }}>${jourLabel}</div>
                <div style=${{ flex:1, fontSize:13, fontWeight:600, color: d.label ? "#fff" : "rgba(255,255,255,0.2)" }}>${d.label || "Repos"}</div>
                ${(d.heure || d.heure2) ? _h`<div style=${{ fontSize:11, color:"#38BDF8", fontWeight:700 }}>${[d.heure, d.heure2].filter(Boolean).map(h=>"🕐 "+h).join("  ")}</div>` : null}
              </div>`;
            })}
          </div>` : null}
          ${selSem.objectifs ? _h`<div style=${{ fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.5, background:"rgba(255,255,255,0.02)", borderRadius:8, padding:"8px 10px", marginBottom:12 }}>${selSem.objectifs}</div>` : null}
          <div style=${{ display:"flex", alignItems:"center", gap:10 }}>
            <div style=${{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Charge totale</div>
            <div class="progress-bar" style=${{ flex:1 }}>
              <div class="progress-fill" style=${{ width: Math.min(100, Math.round((selSem.charge/maxCharge)*100)) + "%", background: ACCENT }}></div>
            </div>
            <div style=${{ fontSize:18, fontWeight:800, color:ACCENT }}>${selSem.charge}h</div>
          </div>
        </div>`;
      })()}
    </div>`}

    ${view === "detail" && _h`<div>
      <div style=${{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
        ${moisList.map(m => _h`<button key=${m} class="btn btn-sm"
          onClick=${() => setFilterMois(m)}
          style=${{ background: filterMois===m ? ACCENT : "rgba(255,255,255,0.04)", color: filterMois===m ? "#000" : "rgba(255,255,255,0.5)", border: filterMois===m ? "none" : "1px solid rgba(255,255,255,0.08)", fontWeight: filterMois===m ? 800 : 400 }}
        >${m}</button>`)}
        <button class="btn btn-sm" onClick=${() => setMatchsOnly(!matchsOnly)}
          style=${{ marginLeft:"auto", background: matchsOnly ? "rgba(255,164,32,0.15)" : "rgba(255,255,255,0.04)", color: matchsOnly ? ACCENT : "rgba(255,255,255,0.5)", border: "1px solid " + (matchsOnly ? "rgba(255,164,32,0.4)" : "rgba(255,255,255,0.08)"), fontWeight: matchsOnly ? 800 : 400 }}
        >🏆 Matchs uniquement</button>
      </div>
      ${filtered.length === 0 ? _h`<div style=${{ textAlign:"center", padding:40, color:"rgba(255,255,255,0.25)", fontSize:12 }}>Aucune semaine ne correspond a ce filtre.</div>` : null}
      <div style=${{ display:"flex", flexDirection:"column", gap:8 }}>
        ${filtered.map(s => {
          const cc = CYCLE_COLORS[s.cycle] || CYCLE_COLORS["AUTONOMIE"];
          const isCur = s.sem === SEM_ACT;
          const hasMatch = !!s.match;
          return _h`<div key=${s.sem} style=${{
            background: hasMatch ? "rgba(255,164,32,0.06)" : (isCur ? ACCENT + "08" : "rgba(255,255,255,0.02)"),
            border: "1px solid " + (hasMatch ? "rgba(255,164,32,0.35)" : (isCur ? ACCENT + "35" : "rgba(255,255,255,0.06)")),
            borderRadius:12, padding:"12px 16px"
          }}>
            <div style=${{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom: (s.jours || s.objectifs) ? 10 : 0 }}>
              ${isCur ? _h`<span style=${{ fontSize:9, background:ACCENT, color:"#000", fontWeight:800, borderRadius:20, padding:"2px 8px" }}>ACTUELLE</span>` : null}
              <div style=${{ fontSize:15, fontWeight:800, color: isCur ? ACCENT : "rgba(255,255,255,0.5)", fontFamily:"'Barlow Condensed',sans-serif", minWidth:32 }}>${s.sem}</div>
              <div style=${{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>${s.dates}</div>
              <div style=${{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:20, background:cc.bg, border:"1px solid " + cc.color + "30" }}>
                <div style=${{ width:5, height:5, borderRadius:"50%", background:cc.color }}></div>
                <span style=${{ fontSize:9, color:cc.color, fontWeight:700 }}>${s.cycle}</span>
              </div>
              ${hasMatch ? _h`<div style=${{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:"rgba(255,164,32,0.15)", border:"1px solid rgba(255,164,32,0.5)" }}>
                <span style=${{ fontSize:11 }}>🏆</span>
                <span style=${{ fontSize:11, color:ACCENT, fontWeight:800 }}>${s.match}</span>
              </div>` : null}
              <div style=${{ marginLeft:"auto", fontSize:12, fontWeight:700, color: s.charge>=10 ? "#FF4455" : s.charge>=6 ? ACCENT : "rgba(255,255,255,0.3)" }}>${s.charge > 0 ? s.charge + "h" : ""}</div>
            </div>
            ${s.jours ? (isMobile ? _h`<div style=${{ display:"flex", flexDirection:"column", gap:4, marginBottom: s.objectifs ? 8 : 0 }}>
              ${JOURS.map((jourLabel, ji) => {
                const sessions = dayArrGlobal(s.jours[ji]);
                const hasContent = sessions.some(j => j.type);
                if (!hasContent) return null;
                return _h`<div key=${jourLabel} style=${{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:8, background:"rgba(255,255,255,0.03)" }}>
                  <span style=${{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.4)", minWidth:28 }}>${jourLabel}</span>
                  <div style=${{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
                    ${sessions.filter(j=>j.type).map((j,si) => {
                      const t = TYPES_SEANCE.find(ts => ts.id === j.type);
                      const plage = calcPlageHoraire(j.heureDebut, j.heures);
                      return _h`<div key=${si} style=${{ display:"flex", flexDirection:"column", gap:1 }}>
                        <div style=${{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style=${{ fontSize:15 }}>${t ? t.icon : "—"}</span>
                          <span style=${{ fontSize:12, fontWeight:600, color: t ? t.color : "#fff" }}>${t ? t.label : ""}</span>
                          ${(!plage && j.heures) ? _h`<span style=${{ fontSize:11, color:"rgba(255,255,255,0.35)", marginLeft:"auto" }}>${j.heures}h</span>` : null}
                        </div>
                        ${plage ? _h`<div style=${{ fontSize:10, color:"#38BDF8", fontWeight:700, marginLeft:21 }}>🕐 De ${plage}${j.heures ? ' (' + j.heures + 'h)' : ''}</div>` : null}
                      </div>`;
                    })}
                  </div>
                </div>`;
              })}
            </div>` : _h`<div style=${{ display:"flex", gap:5, flexWrap:"wrap", marginBottom: s.objectifs ? 8 : 0 }}>
              ${JOURS.map((jourLabel, ji) => {
                const sessions = dayArrGlobal(s.jours[ji]);
                return _h`<div key=${jourLabel} style=${{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                  minWidth:62, padding:"5px 4px", borderRadius:8,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  <span style=${{ fontSize:8, color:"rgba(255,255,255,0.3)", fontWeight:700 }}>${jourLabel}</span>
                  ${sessions.map((j,si) => {
                    const t = TYPES_SEANCE.find(ts => ts.id === j.type);
                    const plage = calcPlageHoraire(j.heureDebut, j.heures);
                    return _h`<div key=${si} style=${{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                      <span style=${{ fontSize:13 }}>${t ? t.icon : (si===0 ? "—" : "")}</span>
                      ${plage ? _h`<span style=${{ fontSize:7.5, color:"#38BDF8", fontWeight:700, whiteSpace:"nowrap" }}>${plage}</span>` : null}
                      ${(!plage && j.heures) ? _h`<span style=${{ fontSize:8, color: t ? t.color : "rgba(255,255,255,0.15)" }}>${j.heures}h</span>` : null}
                    </div>`;
                  })}
                </div>`;
              })}
            </div>`) : null}
            ${(!s.jours && s.joursTxt) ? _h`<div style=${{ display:"flex", flexDirection:"column", gap:4, marginBottom: s.objectifs ? 8 : 0 }}>
              ${JOURS.map((jourLabel, ji) => {
                const d = s.joursTxt[ji] || {};
                if (!d.label && !d.heure && !d.heure2) return null;
                return _h`<div key=${jourLabel} style=${{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderRadius:8, background:"rgba(255,255,255,0.03)" }}>
                  <span style=${{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.4)", minWidth:28 }}>${jourLabel}</span>
                  <span style=${{ flex:1, fontSize:12, fontWeight:600, color: d.label ? "#fff" : "rgba(255,255,255,0.2)" }}>${d.label || "Repos"}</span>
                  ${(d.heure || d.heure2) ? _h`<span style=${{ fontSize:10, color:"#38BDF8", fontWeight:700 }}>${[d.heure, d.heure2].filter(Boolean).map(h=>"🕐 "+h).join("  ")}</span>` : null}
                </div>`;
              })}
            </div>` : null}
            ${s.objectifs ? _h`<div style=${{ fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.5, background:"rgba(255,255,255,0.02)", borderRadius:8, padding:"8px 10px" }}>${s.objectifs}</div>` : null}
          </div>`;
        })}
      </div>
    </div>`}
  </div>`;
}
