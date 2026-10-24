
function CycleView({ player, savePlayer }) {
  const cycles = player.cycles || [];
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({ dateDebut: localDateStr(), duree: 28, notes: "" });
  const [selCycle, setSelCycle] = React.useState(null);

  const dernierCycle = cycles.length ? cycles[cycles.length - 1] : null;
  const today = localDateStr();

  // Calculer le jour du cycle actuel
  function getJourCycle(dateDebut) {
    const diff = Math.floor((new Date(today) - new Date(dateDebut)) / (1000*3600*24));
    return diff + 1;
  }

  // Determiner la phase selon le jour
  function getPhase(jour, duree = 28) {
    if (jour <= 5)  return PHASES_CYCLE[0];
    if (jour <= 13) return PHASES_CYCLE[1];
    if (jour <= 15) return PHASES_CYCLE[2];
    if (jour <= duree) return PHASES_CYCLE[3];
    return null; // Cycle termine
  }

  function saveCycle() {
    const updated = [...cycles, { ...form, id: Date.now().toString(), duree: parseInt(form.duree) || 28 }];
    savePlayer({ cycles: updated });
    setShowAdd(false);
    setForm({ dateDebut: localDateStr(), duree: 28, notes: "" });
  }

  function deleteCycle(id) {
    savePlayer({ cycles: cycles.filter(c => c.id !== id) });
  }

  const jourActuel = dernierCycle ? getJourCycle(dernierCycle.dateDebut) : null;
  const phaseActuelle = jourActuel && jourActuel > 0 && jourActuel <= (dernierCycle.duree||28)
    ? getPhase(jourActuel, dernierCycle.duree||28)
    : null;
  const prochainsRegles = dernierCycle
    ? (() => {
        const debut = new Date(dernierCycle.dateDebut);
        debut.setDate(debut.getDate() + (dernierCycle.duree||28));
        return debut.toISOString().slice(0,10);
      })()
    : null;

  return _h`<div>

    <!-- Phase actuelle -->
    ${phaseActuelle ? _h`<div style=${{ background:phaseActuelle.couleur+'12', border:'2px solid '+phaseActuelle.couleur+'40', borderRadius:14, padding:'16px', marginBottom:16 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:4 }}>Phase actuelle</div>
          <div style=${{ fontSize:18, fontWeight:800, color:phaseActuelle.couleur }}>${phaseActuelle.label}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${phaseActuelle.jours} · Jour ${jourActuel} du cycle</div>
        </div>
        <div style=${{ textAlign:'center', background:phaseActuelle.couleur+'18', borderRadius:10, padding:'8px 14px' }}>
          <div style=${{ fontSize:28, fontWeight:800, color:phaseActuelle.couleur, fontFamily:"'Barlow Condensed',sans-serif" }}>J${jourActuel}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)' }}>sur ${dernierCycle.duree||28}</div>
        </div>
      </div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.6, marginBottom:10 }}>${phaseActuelle.description}</div>

      <!-- Barre de progression du cycle -->
      <div style=${{ marginBottom:12 }}>
        <div style=${{ display:'flex', gap:2, height:8, borderRadius:4, overflow:'hidden' }}>
          ${PHASES_CYCLE.map((ph, pi) => {
            const durees = [5, 8, 2, 13];
            const w = Math.round(durees[pi] / (dernierCycle.duree||28) * 100);
            const isActive = ph.id === phaseActuelle.id;
            return _h`<div key=${pi} style=${{
              width: w+'%', background: isActive ? ph.couleur : ph.couleur+'40',
              transition: 'all .3s'
            }}></div>`;
          })}
        </div>
        <div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
          ${PHASES_CYCLE.map((ph, pi) => _h`<div key=${pi} style=${{ fontSize:8, color: ph.id===phaseActuelle.id ? ph.couleur : 'rgba(255,255,255,.25)', textAlign:'center', flex:1 }}>${ph.label.split(' ')[0]}</div>`)}
        </div>
      </div>

      ${prochainsRegles ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>
        📅 Prochaines règles estimées : <span style=${{ color:PHASES_CYCLE[0].couleur, fontWeight:700 }}>
          ${new Date(prochainsRegles+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
        </span>
      </div>` : null}
    </div>` : _h`<div style=${{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.3)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)', marginBottom:16 }}>
      <div style=${{ fontSize:28, marginBottom:8 }}>🌸</div>
      <div style=${{ fontWeight:700, marginBottom:4 }}>Aucun cycle enregistré</div>
      <div style=${{ fontSize:12 }}>Enregistre la date de début du dernier cycle pour accéder au suivi.</div>
    </div>`}

    <!-- Conseils de la phase -->
    ${phaseActuelle ? _h`<div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
      <div style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px' }}>
        <div style=${{ fontSize:11, fontWeight:800, color:phaseActuelle.couleur, marginBottom:8 }}>🏋 Entraînement</div>
        ${phaseActuelle.conseils_entrainement.map((c, i) => _h`<div key=${i} style=${{ fontSize:10, color:'rgba(255,255,255,.55)', marginBottom:5, lineHeight:1.5 }}>
          <span style=${{ color:phaseActuelle.couleur }}>• </span>${c}
        </div>`)}
      </div>
      <div style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px' }}>
        <div style=${{ fontSize:11, fontWeight:800, color:phaseActuelle.couleur, marginBottom:8 }}>🥗 Nutrition</div>
        ${phaseActuelle.conseils_nutrition.map((c, i) => _h`<div key=${i} style=${{ fontSize:10, color:'rgba(255,255,255,.55)', marginBottom:5, lineHeight:1.5 }}>
          <span style=${{ color:phaseActuelle.couleur }}>• </span>${c}
        </div>`)}
      </div>
    </div>` : null}

    ${phaseActuelle ? _h`<div style=${{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:4 }}>📈 Performance attendue</div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>${phaseActuelle.performance}</div>
    </div>` : null}

    <!-- Bouton ajouter cycle -->
    <button class="btn btn-primary" style=${{ width:'100%', marginBottom:16 }} onClick=${() => setShowAdd(!showAdd)}>
      ${showAdd ? '✕ Annuler' : '+ Enregistrer un cycle'}
    </button>

    ${showAdd ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginBottom:16 }}>
      <div style=${{ fontSize:13, fontWeight:700, marginBottom:12 }}>Nouveau cycle</div>
      <div style=${{ marginBottom:10 }}>
        <div class="lbl">Date de début des règles</div>
        <input class="inp" type="date" value=${form.dateDebut} onInput=${e => setForm(f => ({...f, dateDebut: e.target.value}))}/>
      </div>
      <div style=${{ marginBottom:10 }}>
        <div class="lbl">Durée du cycle (jours)</div>
        <input class="inp" type="number" value=${form.duree} min="21" max="35" onInput=${e => setForm(f => ({...f, duree: e.target.value}))} placeholder="28"/>
      </div>
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Notes (symptômes, douleurs...)</div>
        <textarea class="inp" value=${form.notes} onInput=${e => setForm(f => ({...f, notes: e.target.value}))} style=${{ resize:'vertical', minHeight:50 }} placeholder="Crampes J1, fatigue intense..."></textarea>
      </div>
      <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${saveCycle}>Enregistrer</button>
    </div>` : null}

    <!-- Historique des cycles -->
    ${cycles.length > 0 ? _h`<div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Historique</div>
      ${[...cycles].reverse().slice(0,6).map(c => {
        const ph = getPhase(getJourCycle(c.dateDebut), c.duree||28);
        const fin = new Date(c.dateDebut); fin.setDate(fin.getDate() + (c.duree||28) - 1);
        return _h`<div key=${c.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'10px 13px', marginBottom:6 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style=${{ fontSize:12, fontWeight:700 }}>Cycle du ${new Date(c.dateDebut+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>${c.duree||28} jours · fin ${fin.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
            </div>
            <button class="btn btn-sm btn-danger" onClick=${() => deleteCycle(c.id)}>×</button>
          </div>
          ${c.notes ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:6, fontStyle:'italic' }}>${c.notes}</div>` : null}
        </div>`;
      })}
    </div>` : null}
  </div>`;
}

function EchauffMusculationView() {
  const [sel, setSel] = React.useState(null);
  const [selBloc, setSelBloc] = React.useState(null);

  if (sel) {
    const p = ECHAUFF_MUSCU.find(x => x.id === sel);
    return _h`<div>
      <button class="btn btn-sm" style=${{ marginBottom:16 }} onClick=${() => { setSel(null); setSelBloc(null); }}>← Retour</button>
      <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span style=${{ fontSize:24 }}>${p.icon}</span>
        <div>
          <div style=${{ fontSize:16, fontWeight:800 }}>${p.nom}</div>
          <div style=${{ fontSize:11, color:p.couleur }}>⏱ ${p.duree_totale}</div>
        </div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:14, lineHeight:1.6 }}>${p.description}</div>
      <div style=${{ display:'flex', gap:4, marginBottom:16, overflowX:'auto' }}>
        ${(p.blocs||[]).map((b,bi) => _h`<div key=${bi} style=${{
          background:b.couleur+'12', border:'1px solid '+b.couleur+'30',
          borderRadius:8, padding:'6px 10px', flexShrink:0, textAlign:'center', minWidth:72
        }}>
          <div style=${{ fontSize:9, color:b.couleur, fontWeight:700 }}>Bloc ${bi+1}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.45)', marginTop:1 }}>${b.duree}</div>
        </div>`)}
      </div>
      ${(p.blocs||[]).map((b,bi) => _h`<div key=${bi} style=${{ marginBottom:16 }}>
        <div style=${{ background:b.couleur+'12', border:'1px solid '+b.couleur+'30', borderRadius:12, padding:'10px 14px', marginBottom:8 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style=${{ fontSize:13, fontWeight:800, color:b.couleur }}>${b.titre}</div>
            <div style=${{ fontSize:10, color:b.couleur, fontWeight:700, background:b.couleur+'15', padding:'2px 8px', borderRadius:20 }}>⏱ ${b.duree}</div>
          </div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', lineHeight:1.5 }}>${b.description}</div>
        </div>
        ${b.exercices.map((ex,ei) => _h`<div key=${ei} style=${{
          background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)',
          borderRadius:10, padding:'10px 13px', marginBottom:6, borderLeft:'3px solid '+b.couleur
        }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
            <div style=${{ fontSize:12, fontWeight:700, flex:1 }}>${ex.exercice}</div>
            <div style=${{ fontSize:11, fontWeight:800, color:b.couleur, flexShrink:0, marginLeft:8 }}>${ex.duree}</div>
          </div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.6, marginBottom: ex.note ? 6 : 0 }}>${ex.detail}</div>
          ${ex.note ? _h`<div style=${{ fontSize:10, color:b.couleur, background:b.couleur+'08', borderRadius:6, padding:'3px 8px' }}>💡 ${ex.note}</div>` : null}
        </div>`)}
      </div>`)}
    </div>`;
  }

  return _h`<div>
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>Echauffements musculation</div>
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:10, padding:'10px 14px', marginBottom:16, lineHeight:1.6 }}>
      Derouler completement avant chaque seance. La montee en charge progressive (Bloc 4) est obligatoire sur le mouvement principal.
    </div>
    ${ECHAUFF_MUSCU.map(p => _h`<div key=${p.id}
      onClick=${() => setSel(p.id)}
      style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+p.couleur+'30', borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
        <span style=${{ fontSize:24 }}>${p.icon}</span>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:14, fontWeight:800 }}>${p.nom}</div>
          <div style=${{ fontSize:11, color:p.couleur, marginTop:2 }}>⏱ ${p.duree_totale} · ${(p.blocs||[]).length} blocs</div>
        </div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.3)', flexShrink:0 }}>→</div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.5, marginBottom:10 }}>${p.description}</div>
      <div style=${{ display:'flex', gap:5 }}>
        ${(p.blocs||[]).map((b,bi) => _h`<div key=${bi} style=${{
          flex:1, background:b.couleur+'10', border:'1px solid '+b.couleur+'20',
          borderRadius:7, padding:'5px 6px', textAlign:'center'
        }}>
          <div style=${{ fontSize:9, color:b.couleur, fontWeight:700 }}>B${bi+1}</div>
          <div style=${{ fontSize:8, color:'rgba(255,255,255,.4)', marginTop:1 }}>${b.duree}</div>
        </div>`)}
      </div>
    </div>`)}
  </div>`;
}

function EchauffEnduranceView() {
  const [sel, setSel] = React.useState(null);

  if (sel) {
    const p = ECHAUFF_ENDURANCE.find(x => x.id === sel);
    return _h`<div>
      <button class="btn btn-sm" style=${{ marginBottom:16 }} onClick=${() => setSel(null)}>← Retour</button>
      <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <span style=${{ fontSize:24 }}>${p.icon}</span>
        <div>
          <div style=${{ fontSize:16, fontWeight:800 }}>${p.nom}</div>
          <div style=${{ fontSize:11, color:p.couleur }}>⏱ ${p.duree_totale} · ${p.frequence}</div>
        </div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:14, lineHeight:1.6 }}>${p.description}</div>
      <div style=${{ display:'flex', gap:4, marginBottom:16, overflowX:'auto' }}>
        ${(p.blocs||[]).map((b,bi) => _h`<div key=${bi} style=${{
          background:b.couleur+'12', border:'1px solid '+b.couleur+'30',
          borderRadius:8, padding:'6px 10px', flexShrink:0, textAlign:'center', minWidth:72
        }}>
          <div style=${{ fontSize:9, color:b.couleur, fontWeight:700 }}>Bloc ${bi+1}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.45)', marginTop:1 }}>${b.duree}</div>
        </div>`)}
      </div>
      ${(p.blocs||[]).map((b,bi) => _h`<div key=${bi} style=${{ marginBottom:16 }}>
        <div style=${{ background:b.couleur+'12', border:'1px solid '+b.couleur+'30', borderRadius:12, padding:'10px 14px', marginBottom:8 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style=${{ fontSize:13, fontWeight:800, color:b.couleur }}>${b.titre}</div>
            <div style=${{ fontSize:10, color:b.couleur, fontWeight:700, background:b.couleur+'15', padding:'2px 8px', borderRadius:20 }}>⏱ ${b.duree}</div>
          </div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', lineHeight:1.5 }}>${b.description}</div>
        </div>
        ${b.exercices.map((ex,ei) => _h`<div key=${ei} style=${{
          background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)',
          borderRadius:10, padding:'10px 13px', marginBottom:6, borderLeft:'3px solid '+b.couleur
        }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
            <div style=${{ fontSize:12, fontWeight:700, flex:1 }}>${ex.exercice}</div>
            <div style=${{ fontSize:11, fontWeight:800, color:b.couleur, flexShrink:0, marginLeft:8 }}>${ex.duree}</div>
          </div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.6, marginBottom: ex.note ? 6 : 0 }}>${ex.detail}</div>
          ${ex.note ? _h`<div style=${{ fontSize:10, color:b.couleur, background:b.couleur+'08', borderRadius:6, padding:'3px 8px' }}>💡 ${ex.note}</div>` : null}
        </div>`)}
      </div>`)}
    </div>`;
  }

  return _h`<div>
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>Echauffements endurance</div>
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.15)', borderRadius:10, padding:'10px 14px', marginBottom:16, lineHeight:1.6 }}>
      Protocole complet a derouler avant chaque seance. Ne jamais demarrer une seance intense sans echauffement.
    </div>
    ${ECHAUFF_ENDURANCE.map(p => _h`<div key=${p.id}
      onClick=${() => setSel(p.id)}
      style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+p.couleur+'30', borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
        <span style=${{ fontSize:24 }}>${p.icon}</span>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:14, fontWeight:800 }}>${p.nom}</div>
          <div style=${{ fontSize:11, color:p.couleur, marginTop:2 }}>⏱ ${p.duree_totale} · ${(p.blocs||[]).length} blocs</div>
        </div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.3)', flexShrink:0 }}>→</div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.5, marginBottom:10 }}>${p.description}</div>
      <div style=${{ display:'flex', gap:5 }}>
        ${(p.blocs||[]).map((b,bi) => _h`<div key=${bi} style=${{
          flex:1, background:b.couleur+'10', border:'1px solid '+b.couleur+'20',
          borderRadius:7, padding:'5px 6px', textAlign:'center'
        }}>
          <div style=${{ fontSize:9, color:b.couleur, fontWeight:700 }}>B${bi+1}</div>
          <div style=${{ fontSize:8, color:'rgba(255,255,255,.4)', marginTop:1 }}>${b.duree}</div>
        </div>`)}
      </div>
    </div>`)}
  </div>`;
}


// ── SEANCES DE GAINAGE REFERENCE ─────────────────────────────────────────────
const SEANCES_GAINAGE = [
  {
    id: "g1",
    nom: "Anti-rotation elastique - Debutant",
    niveau: "Debutant",
    couleur: "#38BDF8",
    duree: "20-25 min",
    focus: "Anti-rotation",
    description: "Introduction au gainage anti-rotatoire avec elastique. Base de tout le travail de tronc specifique handball. Seance complete avec echauffement tronc inclus.",
    objectif: "Apprendre a resister a la rotation sans compensation lombaire. Maintenir le bassin neutre sur tous les exercices.",
    materiel: ["Elastique medium", "Tapis"],
    exercices: [
      { nom: "Pallof Press debout", series: 3, reps: "12 / cote", repos: "45s", charge: "Elastique leger-medium", execution: "Ancrer l'elastique a hauteur de nombril sur un poteau ou porte. Se placer de cote a 1m. Tenir l'elastique a 2 mains devant le sternum. Pousser les bras devant soi (extension complete) - tenir 2s - revenir. Le tronc NE DOIT PAS tourner. Engagement total des obliques.", progressions: "S1 : prise proche. S2 : etirer davantage l'elastique. S3 : pallof press en squat." },
      { nom: "Pallof Press en biais (haut-bas)", series: 3, reps: "10 / cote", repos: "45s", charge: "Elastique medium", execution: "Meme position mais pousser en diagonale vers le haut (45 deg) puis vers le bas. Varie le plan de resistance. Sollicite plus les obliques dans les plans diagonaux specifiques du handball.", progressions: "Ralentir le retour (3s excentrique)." },
      { nom: "Half-kneeling Pallof Press", series: 3, reps: "10 / cote", repos: "45s", charge: "Elastique medium", execution: "Un genou au sol (position chevalier servant). Genoux avant a 90 deg. Meme mouvement de pallof press. La position demi-agenouillee isole totalement le tronc et elimine la compensation des jambes. Tres revelateur.", progressions: "Allonger la duree de tenue (3s en extension)." },
      { nom: "Dead Bug avec elastique", series: 3, reps: "8 / cote", repos: "45s", charge: "Elastique leger", execution: "Allonge sur le dos. Elastique accroche haut, tenu a 2 mains bras tendus vers le plafond. Descendre le bras droit ET la jambe gauche simultanement en les gardant tendus. Revenir. Alterner. Le bas du dos NE doit PAS se decoller du sol - c'est le critere.", progressions: "Ralentir la descente a 4s." },
      { nom: "Planche laterale + rotation (thread the needle)", series: 3, reps: "10 / cote", repos: "45s", charge: "Corps", execution: "En planche laterale. Le bras superieur part derriere la tete. Passer sous le corps en tournant le buste vers le sol (rotation maximale), puis revenir en ouvrant vers le plafond. Amplitude et controle. Ne pas laisser les hanches tomber.", progressions: "Ajouter un elastique autour du poignet superieur." },
    ]
  },
  {
    id: "g2",
    nom: "Anti-flexion / Anti-extension - Intermediaire",
    niveau: "Intermediaire",
    couleur: "#FFA420",
    duree: "25-30 min",
    focus: "Anti-flexion & Anti-extension",
    description: "Travail de resistance a la flexion et a l'extension du rachis. Protege les lombaires et developpe la stabilite du tronc sous charge. Specifique pour les gardiens et pivots.",
    objectif: "Maintenir la colonne neutre sous tension anterieure et posterieure. Gainage profond transverse + erecteurs.",
    materiel: ["Elastique fort", "Barre de gym ou TRX", "Tapis"],
    exercices: [
      { nom: "Pallof Press isometrique (tenu 30s)", series: 4, reps: "30s / cote", repos: "30s", charge: "Elastique fort", execution: "Position pallof classique. Pousser les bras en extension complete et TENIR 30 secondes sans bouger. Le tronc doit rester parfaitement immobile malgre la traction de l'elastique. Respirer normalement pendant la tenue - ne pas bloquer.", progressions: "Augmenter l'ecartement du poteau ou prendre elastique plus fort." },
      { nom: "Rollout sur barre (anti-extension)", series: 4, reps: "8-10", repos: "60s", charge: "Corps", execution: "A genoux, tenir une barre ou roue d'ab-wheel. Faire rouler la barre vers l'avant en allongeant les bras au maximum sans laisser les lombaires se creuser. Revenir en contractant le ventre. Amplitude progressive : commencer petit et augmenter chaque semaine.", progressions: "S1 : amplitude 30%. S2 : 60%. S3 : amplitude complete (bras au sol)." },
      { nom: "Stir the pot (gainage instable)", series: 3, reps: "8 cercles / sens", repos: "60s", charge: "Corps + swiss ball", execution: "En planche avant bras sur swiss ball. Faire de petits cercles avec les avant-bras sans bouger le reste du corps. Le swiss ball cree une instabilite qui force un engagement maximal de tout le tronc profond (transverse, multifides). Cercles lents et controles.", progressions: "Augmenter le diametre des cercles." },
      { nom: "Farmer carry mono-bracial (anti-flexion laterale)", series: 4, reps: "20m / cote", repos: "45s", charge: "Kettlebell ou haltere lourd", execution: "Tenir un poids lourd d'un seul cote. Marcher 20m en maintenant le tronc parfaitement droit - ne pas pencher du cote du poids ni du cote libre. Le carre des lombes du cote libre doit travailler intensement pour maintenir la neutralite.", progressions: "Augmenter la charge ou la distance." },
      { nom: "Planche avant avec tirage elastique", series: 3, reps: "10 / cote", repos: "60s", charge: "Elastique medium", execution: "En planche avant bras au sol. Elastique accroche en avant de vous a hauteur du sol. Tirer l'elastique vers la hanche avec un bras en gardant la planche parfaitement immobile (ne pas tourner). L'autre bras reste au sol.", progressions: "Alterner bras gauche-droit en continu." },
    ]
  },
  {
    id: "g3",
    nom: "Gainage dynamique rotatoire - Avance",
    niveau: "Avance",
    couleur: "#FF4455",
    duree: "30-35 min",
    focus: "Gainage dynamique + rotation puissante",
    description: "Transfert de la stabilite vers la puissance rotatoire. Specifique handball : lancer, pivot, changement de direction. Combine gainage et production de force rotatoire.",
    objectif: "Generer de la puissance rotatoire depuis les hanches en maintenant la stabilite lombaire. Chaine cinetique complete.",
    materiel: ["Elastique fort + tres fort", "Tapis", "Medicine ball 3-5 kg"],
    exercices: [
      { nom: "Chop elastique (haut vers bas)", series: 4, reps: "12 / cote", repos: "45s", charge: "Elastique fort", execution: "Elastique ancre en haut. Se placer de cote. Tirer l'elastique de haut vers le bas en diagonale (comme un coup de hache) en faisant pivoter les hanches et le buste. Le mouvement PART des hanches - les bras suivent. Terminer avec les mains vers la hanche opposee. Retour controle.", progressions: "Augmenter la charge ou la vitesse du mouvement." },
      { nom: "Lift elastique (bas vers haut)", series: 4, reps: "12 / cote", repos: "45s", charge: "Elastique fort", execution: "Inverse du chop. Elastique ancre en bas. Tirer du bas vers le haut en diagonale. Depart genoux flechis, terminer bras tendus vers le haut cote oppose. Rotation des hanches complete. Specifique mouvement de passe longue et tir en suspension handball.", progressions: "Variante avec rotation complete (pivot sur pied avant)." },
      { nom: "Lancer MB contre mur (rotation puissante)", series: 4, reps: "10 / cote", repos: "60s", charge: "MB 3-5 kg", execution: "Se placer de profil a 1m d'un mur. Partir en rotation (hanches d'abord), lancer le MB contre le mur avec les 2 mains et attraper le rebond. Vitesse maximale. Toute la puissance vient de la rotation des hanches - les bras ne font que transferer. Critiquer : ne pas lancer qu'avec les bras.", progressions: "Augmenter la masse du MB ou se rapprocher du mur (rebond plus rapide)." },
      { nom: "Copenhagen plank dynamique", series: 4, reps: "8 / cote", repos: "60s", charge: "Corps", execution: "En Copenhagen plank (pied sur banc, corps en planche laterale). Depuis cette position : amener le genou inferieur vers la poitrine (hip flexion) puis le repousser. Gainage lateral + travail dynamique de la hanche dans le plan frontal. Tres difficile.", progressions: "Ajouter une chevillere lestee a la jambe inferieure." },
      { nom: "Suitcase deadlift (anti-flexion laterale lourde)", series: 4, reps: "8 / cote", repos: "90s", charge: "Kettlebell ou haltere lourd", execution: "Tenir un poids lourd sur le cote exterieur du pied (comme une valise). Se baisser comme un deadlift SANS pencher vers le poids. Le carre des lombes du cote libre doit maintenir la neutralite sous charge maximale. Charge progressive chaque semaine.", progressions: "Transition vers le deadlift avec barre off-center (encore plus difficile)." },
    ]
  },
  {
    id: "g4",
    nom: "Circuit gainage complet - 7 exercices",
    niveau: "Tous niveaux",
    couleur: "#4CAF50",
    duree: "35-40 min",
    focus: "Circuit complet",
    description: "Seance reference complete couvrant tous les plans de gainage. A faire 2x/semaine en PPG ou 1x/semaine en PPS. Le joueur peut la faire seul en autonomie.",
    objectif: "Couvrir les 3 plans de gainage (anti-rotation, anti-extension, anti-flexion) en une seule seance. Seance autonome complete.",
    materiel: ["Elastique medium et fort", "Tapis", "Medicine ball 3-4 kg"],
    exercices: [
      { nom: "1. Planche avant progressions (3 variantes)", series: "3x", reps: "30-45-60s", repos: "30s", charge: "Corps", execution: "Serie A : planche avant 30s. Serie B : planche avant + lever 1 bras 45s. Serie C : planche avant + lever bras oppose a jambe 60s. Progresser de A vers C au fil des semaines. Dos plat, fessiers contractes, ventre rentree.", progressions: "Ajouter gilet leste 5-10 kg quand 60s est facile." },
      { nom: "2. Planche laterale + abduction", series: 3, reps: "10 + 30s / cote", repos: "30s", charge: "Elastique leger (optionnel)", execution: "En planche laterale. Effectuer 10 abductions de la jambe superieure (lever la jambe). Puis tenir 30s en statique. L'abduction recrute le moyen fessier et intensifie le gainage lateral. Dos et hanches alignes en permanence.", progressions: "Elastique autour des chevilles pour les abductions." },
      { nom: "3. Pallof Press (base)", series: 3, reps: "12 / cote", repos: "45s", charge: "Elastique medium", execution: "Pallof press classique debout. 12 reps lentes par cote. Pousser bras en extension 2s - tenir 1s - revenir 2s. Tempo controle. Voir description complete dans la seance Debutant.", progressions: "Varier les positions : debout, demi-agenouillee, assise au sol." },
      { nom: "4. Dead Bug (activation profonde)", series: 3, reps: "6 / cote", repos: "45s", charge: "Corps", execution: "Allonge sur le dos. Bras vers le plafond, jambes a 90 deg. Descendre bras D + jambe G simultanement en les gardant tendus, sans decoller le bas du dos. Revenir. Alterner. 6 reps = 1 serie. Expirer pendant la descente.", progressions: "Ajouter poids leger dans les mains ou elastique en resistance." },
      { nom: "5. Chop elastique haut-bas", series: 3, reps: "10 / cote", repos: "45s", charge: "Elastique medium", execution: "Mouvement diagonal elastique du haut vers le bas. Rotation des hanches complete. Voir description complete dans la seance Avance. Vitesse moderee - priorite a la technique.", progressions: "Augmenter la vitesse d'execution progressivement." },
      { nom: "6. Farmer carry bilateral (loaded carry)", series: 3, reps: "30m", repos: "60s", charge: "2 kettlebells ou halteres lourds", execution: "Porter des charges lourdes dans les 2 mains. Marcher 30m en maintenant les epaules basses, le tronc bien droit et le regard vers l'avant. Respiration normale. Simple mais extremement efficace pour le gainage global fonctionnel.", progressions: "Augmenter la charge chaque semaine. Variante mono-braciale pour l'anti-flexion laterale." },
      { nom: "7. Lancer MB au sol + recup (finisher)", series: 3, reps: "8 / cote", repos: "60s", charge: "MB 3-4 kg", execution: "De profil, lancer le MB au sol devant soi avec rotation complete des hanches (comme un chop mais vers le sol). Attraper le rebond. Mouvement explosif en rotation. Finisher de la seance. Intensite maximale sur chaque rep.", progressions: "Augmenter la vitesse ou la masse du MB." },
    ]
  },
  {
    id: "g5",
    nom: "Gainage specifique gardien de but",
    niveau: "Specifique",
    couleur: "#7C6FFF",
    duree: "25-30 min",
    focus: "Reaction + stabilite laterale + extension rapide",
    description: "Gainage specifique aux exigences du gardien de but handball : vitesse de reaction, extension laterale explosive, stabilite en position de garde. Combine stabilite et deplacement.",
    objectif: "Developper la capacite a maintenir la stabilite du tronc lors des extensions rapides et des reactions defensives.",
    materiel: ["Elastique fort", "Tapis", "Cones (optionnel)"],
    exercices: [
      { nom: "Extension laterale explosive + stabilisation", series: 4, reps: "6 / cote", repos: "60s", charge: "Corps", execution: "Position de garde GDB (semi-squat, bras devant). S'etendre lateralement au maximum (comme pour stopper un tir en angle). Atterrir et TENIR la position finale 2s sans vaciller. L'atterrissage et la stabilisation finale = la phase cle. Explosif a l'aller, controle a l'arrivee.", progressions: "Partir d'une position de squat plus basse." },
      { nom: "Planche avant + rotation tete (proprioception cervicale)", series: 3, reps: "20 rotations", repos: "45s", charge: "Corps", execution: "En planche avant. Tourner lentement la tete de gauche a droite (10 fois chaque sens) sans bouger le reste du corps. Le gardien doit maintenir la stabilite du tronc meme quand les yeux bougent (suivi du ballon). Tres specifique.", progressions: "Fermer les yeux pendant les rotations." },
      { nom: "Pallof Press + pas lateral (reaction)", series: 3, reps: "8 / cote", repos: "45s", charge: "Elastique medium", execution: "En pallof press isometrique (bras tendus). Effectuer 2 pas lateraux dans un sens puis revenir tout en maintenant les bras en extension et le tronc stable. La marche laterale simule le deplacement de garde du GDB.", progressions: "Augmenter la vitesse des pas." },
      { nom: "Gainage en pont (hip bridge) + extension bras", series: 4, reps: "10 / bras", repos: "45s", charge: "Elastique leger", execution: "En position de pont (allonge, hanches levees, isometrique). Tenir le pont et etendre un bras vers le plafond avec un elastique en resistance. Hanches qui ne bougent pas malgre l'asymetrie du mouvement de bras. Specifique aux positions au sol du GDB.", progressions: "Ajouter un elastique autour des genoux en resistance d'abduction." },
      { nom: "Lizard crawl (reptation) 10m", series: 4, reps: "10m aller-retour", repos: "60s", charge: "Corps", execution: "Se deplacer en reptation (ventre vers le sol, propulsion sur bras et jambes alternatifs). Garder le ventre pres du sol sans le poser. Gainage total, mobilite de hanche et coordination. Tres efficace et souvent surprenant pour les athletes.", progressions: "Augmenter la vitesse ou ajouter un gilet leste." },
    ]
  },
];

function GainageView({ player, isCoach, db, setDb }) {
  const [selSeance, setSelSeance] = React.useState(null);
  const [selNiveau, setSelNiveau] = React.useState("Tous");
  const [showCreate, setShowCreate] = React.useState(false);
  const [formG, setFormG] = React.useState({ nom:'', niveau:'Intermediaire', duree:'20 min', focus:'', description:'', objectif:'', exercices:[] });
  const [newExG, setNewExG] = React.useState({ nom:'', series:'3', reps:'30s', repos:'10s', execution:'', progression:'' });

  const customGainage = (db?.customGainage || []);
  const allGainage = [...SEANCES_GAINAGE, ...customGainage];
  const niveaux = ["Tous", "Debutant", "Intermediaire", "Avance", "Specifique"];
  const filtered = selNiveau === "Tous" ? allGainage : allGainage.filter(s => s.niveau === selNiveau || s.niveau === "Tous niveaux");

  function addExG() {
    if (!newExG.nom.trim()) return;
    setFormG(f => ({ ...f, exercices: [...f.exercices, { ...newExG, id: Date.now().toString() }] }));
    setNewExG({ nom:'', series:'3', reps:'30s', repos:'10s', execution:'', progression:'' });
  }
  function saveGainage() {
    if (!formG.nom.trim()) return;
    const newP = { ...formG, id:'gainage_custom_'+Date.now(), couleur:'#FFA420', isCustom:true };
    setDb(d => ({ ...d, customGainage: [...(d.customGainage||[]), newP] }));
    setFormG({ nom:'', niveau:'Intermediaire', duree:'20 min', focus:'', description:'', objectif:'', exercices:[] });
    setShowCreate(false);
  }
  function deleteCustomGainage(id) {
    if (!confirm('Supprimer ce protocole ?')) return;
    setDb(d => ({ ...d, customGainage: (d.customGainage||[]).filter(p => p.id !== id) }));
  }

  if (selSeance) {
    const s = allGainage.find(x => x.id === selSeance);
    return _h`<div>
      <button class="btn btn-sm" style=${{ marginBottom:16 }} onClick=${() => setSelSeance(null)}>← Retour</button>
      <!-- Header -->
      <div style=${{ background:s.couleur+'10', border:'1px solid '+s.couleur+'30', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div>
            <div style=${{ fontSize:16, fontWeight:800 }}>${s.nom}</div>
            <div style=${{ fontSize:11, color:s.couleur, marginTop:3 }}>⏱ ${s.duree} · ${s.focus}</div>
          </div>
          <div style=${{ fontSize:10, padding:'3px 10px', borderRadius:20, background:s.couleur+'18', color:s.couleur, fontWeight:700, flexShrink:0 }}>${s.niveau}</div>
        </div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.6, marginBottom:8 }}>${s.description}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.7)', background:'rgba(255,255,255,.04)', borderRadius:8, padding:'7px 10px', marginBottom:8 }}>
          🎯 ${s.objectif}
        </div>
        <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
          ${s.materiel.map((m,i) => _h`<span key=${i} style=${{ fontSize:10, background:s.couleur+'12', border:'1px solid '+s.couleur+'25', borderRadius:6, padding:'2px 8px', color:s.couleur }}>📦 ${m}</span>`)}
        </div>
      </div>

      <!-- Exercices -->
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Exercices (${s.exercices.length})</div>
      ${s.exercices.map((ex, ei) => _h`<div key=${ei} style=${{
        background:'rgba(255,255,255,.025)', border:'1px solid '+s.couleur+'20',
        borderRadius:12, padding:'13px 15px', marginBottom:10,
        borderLeft:'4px solid '+s.couleur
      }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style=${{ flex:1 }}>
            <div style=${{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style=${{ fontSize:13, fontWeight:800 }}>${ex.nom}</span>
              ${React.createElement(BiblioLinkButton, { nomExercice: ex.biblio || ex.nom })}
            </div>
          </div>
          <div style=${{ flexShrink:0, marginLeft:10, textAlign:'right' }}>
            <div style=${{ fontSize:11, fontWeight:800, color:s.couleur }}>${ex.series} x ${ex.reps}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>⏱ ${ex.repos}</div>
          </div>
        </div>
        <div style=${{ fontSize:10, color:s.couleur, marginBottom:6, fontWeight:600 }}>🏋 ${ex.charge}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.6)', lineHeight:1.7, marginBottom:8, background:'rgba(255,255,255,.03)', borderRadius:8, padding:'8px 10px' }}>${ex.execution}</div>
        <div style=${{ fontSize:10, color:'rgba(255,164,32,.7)', lineHeight:1.5 }}>
          📈 Progression : ${ex.progressions}
        </div>
      </div>`)}
    </div>`;
  }

  return _h`<div>
    ${isCoach ? _h`<div style=${{ marginBottom:14 }}>
      <button class="btn btn-primary btn-sm" style=${{ width:'100%' }} onClick=${()=>setShowCreate(!showCreate)}>
        ${showCreate ? '✕ Annuler' : '+ Créer un protocole de gainage'}
      </button>
      ${showCreate ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginTop:10 }}>
        <div style=${{ fontSize:13, fontWeight:800, marginBottom:12 }}>Nouveau protocole de gainage</div>
        <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <div style=${{ gridColumn:'1/-1' }}><div class="lbl">Nom</div><input class="inp" value=${formG.nom} onInput=${e=>setFormG(f=>({...f,nom:e.target.value}))} placeholder="Ex: Gainage spécifique gardien"/></div>
          <div><div class="lbl">Niveau</div>
            <select class="inp" value=${formG.niveau} onChange=${e=>setFormG(f=>({...f,niveau:e.target.value}))}>
              ${['Debutant','Intermediaire','Avance','Specifique'].map(n=>_h`<option key=${n}>${n}</option>`)}
            </select></div>
          <div><div class="lbl">Durée</div><input class="inp" value=${formG.duree} onInput=${e=>setFormG(f=>({...f,duree:e.target.value}))} placeholder="20 min"/></div>
          <div><div class="lbl">Focus</div><input class="inp" value=${formG.focus} onInput=${e=>setFormG(f=>({...f,focus:e.target.value}))} placeholder="Gainage latéral..."/></div>
          <div><div class="lbl">Objectif</div><input class="inp" value=${formG.objectif} onInput=${e=>setFormG(f=>({...f,objectif:e.target.value}))} placeholder="Stabilité lombaire..."/></div>
        </div>
        <div style=${{ marginBottom:10 }}><div class="lbl">Description</div>
          <textarea class="inp" value=${formG.description} onInput=${e=>setFormG(f=>({...f,description:e.target.value}))} style=${{ minHeight:45, resize:'vertical' }}></textarea></div>
        <div style=${{ fontSize:11, fontWeight:700, marginBottom:6 }}>Exercices (${formG.exercices.length})</div>
        ${formG.exercices.map((ex,i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', padding:'5px 8px', background:'rgba(255,255,255,.04)', borderRadius:7, marginBottom:4 }}>
          <span style=${{ fontSize:11 }}>${ex.nom} · ${ex.series}×${ex.reps}</span>
          <button onClick=${()=>setFormG(f=>({...f,exercices:f.exercices.filter((_,j)=>j!==i)}))}
            style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', cursor:'pointer' }}>×</button>
        </div>`)}
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap', background:'rgba(255,255,255,.02)', borderRadius:8, padding:'8px', marginBottom:10 }}>
          <input class="inp" value=${newExG.nom} onInput=${e=>setNewExG(f=>({...f,nom:e.target.value}))} placeholder="Exercice" style=${{ flex:'1 1 120px' }} onKeyDown=${e=>e.key==='Enter'&&addExG()}/>
          <input class="inp" value=${newExG.series} onInput=${e=>setNewExG(f=>({...f,series:e.target.value}))} placeholder="Séries" style=${{ width:55 }}/>
          <input class="inp" value=${newExG.reps} onInput=${e=>setNewExG(f=>({...f,reps:e.target.value}))} placeholder="Reps" style=${{ width:60 }}/>
          <input class="inp" value=${newExG.repos} onInput=${e=>setNewExG(f=>({...f,repos:e.target.value}))} placeholder="Repos" style=${{ width:60 }}/>
          <button class="btn btn-sm btn-primary" onClick=${addExG}>+</button>
        </div>
        <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${saveGainage}>💾 Enregistrer</button>
      </div>` : null}
    </div>` : null}

    <div style=${{ marginBottom:14 }}>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>Seances de gainage de reference</div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px 14px', lineHeight:1.6 }}>
        Seances cles en autonomie. Gainage dynamique avec elastiques : anti-rotation (Pallof), anti-extension, anti-flexion et puissance rotatoire.
      </div>
    </div>

    <!-- Filtre niveau -->
    <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:16 }}>
      ${niveaux.map(n => _h`<button key=${n}
        onClick=${() => setSelNiveau(n)}
        style=${{
          padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:11,
          border: selNiveau===n ? '2px solid #FFA420' : '1px solid rgba(255,255,255,.1)',
          background: selNiveau===n ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.03)',
          color: selNiveau===n ? '#FFA420' : 'rgba(255,255,255,.4)',
          fontWeight: selNiveau===n ? 800 : 500, fontFamily:'Inter,sans-serif'
        }}>${n}</button>`)}
    </div>

    <!-- Cartes seances -->
    ${filtered.map(s => _h`<div key=${s.id}
      onClick=${() => setSelSeance(s.id)}
      style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+s.couleur+'25', borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer' }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:14, fontWeight:800, marginBottom:3 }}>${s.nom}</div>
          <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style=${{ fontSize:10, color:s.couleur, fontWeight:700 }}>⏱ ${s.duree}</span>
            <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>🎯 ${s.focus}</span>
            <span style=${{ fontSize:10, padding:'1px 7px', borderRadius:20, background:s.couleur+'15', color:s.couleur, fontWeight:700 }}>${s.niveau}</span>
          </div>
        </div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.3)', flexShrink:0, marginLeft:8 }}>→</div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.5, marginBottom:10 }}>${s.description}</div>
      <!-- Apercu exercices -->
      <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
        ${s.exercices.slice(0,4).map((ex,ei) => _h`<div key=${ei} style=${{
          fontSize:9, background:s.couleur+'08', border:'1px solid '+s.couleur+'20',
          borderRadius:6, padding:'2px 7px', color:'rgba(255,255,255,.5)'
        }}>${ex.nom.replace(/^[0-9]+\. /,'').split(' ').slice(0,3).join(' ')}</div>`)}
        ${s.exercices.length > 4 ? _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', padding:'2px 7px' }}>+${s.exercices.length - 4} autres</div>` : null}
      </div>
    </div>`)}
  </div>`;
}

function MobiliteView({ player, isCoach, db, setDb }) {
  const [selProtocole, setSelProtocole] = React.useState(null);
  const [selSemaine, setSelSemaine] = React.useState(0);
  const [showCreate, setShowCreate] = React.useState(false);
  const [formM, setFormM] = React.useState({ nom:'', type:'mobilite', icon:'🤸', description:'', exercices:[] });
  const [newExM, setNewExM] = React.useState({ nom:'', duree:'30s', repos:'10s', notes:'' });
  const [videoEx, setVideoEx] = React.useState(null); // { key, label } pour la popup média
  const [editingMedia, setEditingMedia] = React.useState(false);
  const [mediaUrlInput, setMediaUrlInput] = React.useState('');

  function closeVideoPopup() { setVideoEx(null); setEditingMedia(false); setMediaUrlInput(''); }

  function renderMediaPreview(url) {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (yt) return _h`<div style=${{ position:'relative', paddingTop:'56.25%', background:'#000', borderRadius:8, overflow:'hidden' }}>
      <iframe src=${'https://www.youtube.com/embed/'+yt[1]} style=${{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>`;
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return _h`<div style=${{ position:'relative', paddingTop:'56.25%', background:'#000', borderRadius:8, overflow:'hidden' }}>
      <iframe src=${'https://player.vimeo.com/video/'+vimeo[1]} style=${{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>`;
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return _h`<video controls src=${url} style=${{ width:'100%', borderRadius:8, background:'#000', display:'block' }}></video>`;
    if (/\.(jpe?g|png|gif|webp)(\?|$)/i.test(url)) return _h`<img src=${url} style=${{ width:'100%', borderRadius:8, display:'block' }} onError=${e=>e.target.style.display='none'}/>`;
    return _h`<a href=${url} target="_blank" rel="noopener noreferrer" style=${{ color:'#38BDF8', fontSize:12, wordBreak:'break-all' }}>${url}</a>`;
  }

  // Popup média — image ou vidéo attachée à un exercice (YouTube/Vimeo/fichier direct/image)
  const VideoPopup = () => {
    if (!videoEx) return null;
    const media = (db?.exerciceMedias || {})[videoEx.key];
    const inEdit = editingMedia || !media;
    function saveMedia() {
      const url = mediaUrlInput.trim();
      if (!url) return;
      setDb(d => ({ ...d, exerciceMedias: { ...(d.exerciceMedias||{}), [videoEx.key]: { url, updatedAt: localDateStr() } } }));
      setEditingMedia(false); setMediaUrlInput('');
    }
    function removeMedia() {
      setDb(d => { const next = { ...(d.exerciceMedias||{}) }; delete next[videoEx.key]; return { ...d, exerciceMedias: next }; });
      setEditingMedia(false); setMediaUrlInput('');
    }
    return _h`<div style=${{
        position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'center', padding:16
      }} onClick=${closeVideoPopup}>
      <div style=${{ background:'#161616', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:460, overflow:'hidden' }} onClick=${e => e.stopPropagation()}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div style=${{ fontSize:13, fontWeight:700 }}>🎥 ${videoEx.label}</div>
          <button class="btn btn-sm" onClick=${closeVideoPopup}>✕</button>
        </div>
        <div style=${{ padding:'18px 20px' }}>
          ${!inEdit ? _h`<div>
            ${renderMediaPreview(media.url)}
            ${isCoach ? _h`<div style=${{ display:'flex', gap:8, marginTop:12 }}>
              <button class="btn btn-sm" onClick=${() => { setEditingMedia(true); setMediaUrlInput(media.url); }}>✏️ Modifier le lien</button>
              <button class="btn btn-sm btn-danger" onClick=${removeMedia}>🗑 Retirer</button>
            </div>` : null}
          </div>` : _h`<div>
            ${isCoach ? _h`<div style=${{ marginBottom:14 }}>
              <div class="lbl">Lien image ou vidéo (YouTube, Vimeo, ou fichier direct)</div>
              <input class="inp" value=${mediaUrlInput} onInput=${e=>setMediaUrlInput(e.target.value)} placeholder="https://..." style=${{ marginBottom:10 }}/>
              <div style=${{ display:'flex', gap:8 }}>
                <button class="btn btn-primary btn-sm" onClick=${saveMedia}>Enregistrer</button>
                ${media ? _h`<button class="btn btn-sm" onClick=${()=>{ setEditingMedia(false); setMediaUrlInput(''); }}>Annuler</button>` : null}
              </div>
            </div>` : _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', textAlign:'center', padding:'10px 0' }}>Aucune vidéo n'est associée à cet exercice pour l'instant.</div>`}
            <div style=${{ paddingTop:14, borderTop:'1px solid rgba(255,255,255,.07)', textAlign:'center' }}>
              <a href=${'https://www.youtube.com/results?search_query=' + encodeURIComponent(videoEx.label + ' exercice technique')}
                target="_blank" rel="noopener noreferrer" style=${{ fontSize:11, color:'#FFA420' }}>
                🔍 Chercher "${videoEx.label}" sur YouTube ↗
              </a>
            </div>
          </div>`}
        </div>
      </div>
    </div>`;
  };

  const customMobilite = db?.customMobilite || [];
  const allMobilite = PROTOCOLES_MOBILITE.filter(p => p && p.id).concat(customMobilite);

  function addExM() {
    if (!newExM.nom.trim()) return;
    setFormM(f => ({ ...f, exercices: [...f.exercices, { ...newExM, id: Date.now().toString() }] }));
    setNewExM({ nom:'', duree:'30s', repos:'10s', notes:'' });
  }
  function saveMobilite() {
    if (!formM.nom.trim()) return;
    const newP = { ...formM, id:'mob_custom_'+Date.now(), isCustom:true, groupe:'Personnalisé', versions:[{ titre:'Version 1', exercices: formM.exercices }] };
    setDb(d => ({ ...d, customMobilite: [...(d.customMobilite||[]), newP] }));
    setFormM({ nom:'', type:'mobilite', icon:'🤸', description:'', exercices:[] });
    setShowCreate(false);
  }
  function deleteCustomMobilite(id) {
    if (!confirm('Supprimer ce protocole ?')) return;
    setDb(d => ({ ...d, customMobilite: (d.customMobilite||[]).filter(p => p.id !== id) }));
  }

  if (selProtocole) {
    const p = allMobilite.find(x => x && x.id === selProtocole);

    // Guard: protocole introuvable
    if (!p) return _h`<div>
      <button class="btn btn-sm" style=${{ marginBottom:16 }} onClick=${() => setSelProtocole(null)}>← Retour</button>
      <div style=${{ color:'rgba(255,255,255,.4)', padding:'40px', textAlign:'center' }}>Protocole introuvable.</div>
    </div>`;

    // ── RENDU ECHAUFFEMENT (blocs sequentiels) ──────────────────────────────
    if (p.type === 'echauffement') {
      return _h`<div>
        <button class="btn btn-sm" style=${{ marginBottom:16 }} onClick=${() => setSelProtocole(null)}>← Retour</button>
        <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <span style=${{ fontSize:24 }}>${p.icon}</span>
          <div>
            <div style=${{ fontSize:16, fontWeight:800 }}>${p.nom}</div>
            <div style=${{ fontSize:11, color:p.couleur }}>⏱ ${p.duree_totale} · ${p.frequence}</div>
          </div>
        </div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:16, lineHeight:1.6 }}>${p.description}</div>

        <!-- Timeline blocs -->
        <div style=${{ display:'flex', gap:4, marginBottom:18, overflowX:'auto', paddingBottom:4 }}>
          ${p.blocs.map((b, bi) => _h`<div key=${bi} style=${{
            background:b.couleur+'12', border:'1px solid '+b.couleur+'30',
            borderRadius:8, padding:'6px 10px', flexShrink:0, textAlign:'center', minWidth:70
          }}>
            <div style=${{ fontSize:9, color:b.couleur, fontWeight:700 }}>Bloc ${bi+1}</div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.5)', marginTop:1 }}>${b.duree}</div>
          </div>`)}
        </div>

        <!-- Blocs detail -->
        ${p.blocs.map((b, bi) => _h`<div key=${bi} style=${{ marginBottom:18 }}>
          <!-- Header bloc -->
          <div style=${{ background:b.couleur+'12', border:'1px solid '+b.couleur+'30', borderRadius:12, padding:'10px 14px', marginBottom:10 }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style=${{ fontSize:13, fontWeight:800, color:b.couleur }}>${b.titre}</div>
              <div style=${{ fontSize:10, color:b.couleur, fontWeight:700, background:b.couleur+'15', padding:'2px 8px', borderRadius:20 }}>⏱ ${b.duree}</div>
            </div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.5 }}>${b.description}</div>
          </div>

          <!-- Exercices du bloc -->
          ${b.exercices.map((ex, ei) => _h`<div key=${ei} style=${{
            background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)',
            borderRadius:10, padding:'10px 13px', marginBottom:6,
            borderLeft:'3px solid '+b.couleur
          }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
              <div style=${{ fontSize:12, fontWeight:700, flex:1 }}>${ex.exercice}</div>
              <button title="Voir/ajouter une vidéo" onClick=${() => setVideoEx({ key: p.id+'::'+ex.exercice, label: ex.exercice })}
                style=${{ background: (db?.exerciceMedias||{})[p.id+'::'+ex.exercice] ? 'rgba(56,189,248,.12)' : 'rgba(255,255,255,.05)', border:'1px solid '+((db?.exerciceMedias||{})[p.id+'::'+ex.exercice] ? 'rgba(56,189,248,.4)' : 'rgba(255,255,255,.1)'), borderRadius:6, width:24, height:24, cursor:'pointer', color: (db?.exerciceMedias||{})[p.id+'::'+ex.exercice] ? '#38BDF8' : 'rgba(255,255,255,.5)', fontSize:11, flexShrink:0, marginLeft:6 }}>🎥</button>
              <div style=${{ fontSize:11, fontWeight:800, color:b.couleur, flexShrink:0, marginLeft:8 }}>${ex.duree}</div>
            </div>
            <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.6, marginBottom: ex.note ? 6 : 0 }}>${ex.detail}</div>
            ${ex.note ? _h`<div style=${{ fontSize:10, color:b.couleur, background:b.couleur+'08', borderRadius:6, padding:'3px 8px' }}>💡 ${ex.note}</div>` : null}
          </div>`)}
        </div>`)}
        <${VideoPopup} />
      </div>`;
    }

    // ── RENDU MOBILITE (semaines progressives) ───────────────────────────────
    const sem = p.semaines[selSemaine];
    return _h`<div>
      <button class="btn btn-sm" style=${{ marginBottom:16 }} onClick=${() => setSelProtocole(null)}>← Retour</button>
      <div style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <span style=${{ fontSize:24 }}>${p.icon}</span>
        <div>
          <div style=${{ fontSize:16, fontWeight:800 }}>${p.nom}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${p.duree_totale} · ${p.frequence}</div>
        </div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:14, lineHeight:1.6 }}>${p.description}</div>

      <!-- Selector semaines -->
      <div style=${{ display:'flex', gap:6, marginBottom:16 }}>
        ${p.semaines.map((s, si) => _h`<button key=${si}
          onClick=${() => setSelSemaine(si)}
          style=${{ flex:1, padding:'8px 4px', borderRadius:10, border:'2px solid '+(selSemaine===si ? p.couleur : 'rgba(255,255,255,.1)'),
            background: selSemaine===si ? p.couleur+'18' : 'rgba(255,255,255,.03)',
            color: selSemaine===si ? p.couleur : 'rgba(255,255,255,.4)',
            fontWeight: selSemaine===si ? 800 : 500, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11 }}>
          ${s.sem}
        </button>`)}
      </div>

      <!-- Semaine selectionnee -->
      <div style=${{ background:p.couleur+'08', border:'1px solid '+p.couleur+'25', borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
        <div style=${{ fontSize:13, fontWeight:800, color:p.couleur, marginBottom:4 }}>${sem.titre}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}>🎯 ${sem.objectif}</div>
      </div>

      <!-- Exercices -->
      ${sem.seances.map((ex, ei) => _h`<div key=${ei} style=${{
        background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)',
        borderRadius:12, padding:'12px 14px', marginBottom:8,
        borderLeft:'3px solid '+p.couleur
      }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
          <div style=${{ fontSize:13, fontWeight:700, flex:1 }}>${ex.exercice}</div>
          <button title="Voir/ajouter une vidéo" onClick=${() => setVideoEx({ key: p.id+'::'+ex.exercice, label: ex.exercice })}
            style=${{ background: (db?.exerciceMedias||{})[p.id+'::'+ex.exercice] ? 'rgba(56,189,248,.12)' : 'rgba(255,255,255,.05)', border:'1px solid '+((db?.exerciceMedias||{})[p.id+'::'+ex.exercice] ? 'rgba(56,189,248,.4)' : 'rgba(255,255,255,.1)'), borderRadius:6, width:26, height:26, cursor:'pointer', color: (db?.exerciceMedias||{})[p.id+'::'+ex.exercice] ? '#38BDF8' : 'rgba(255,255,255,.5)', fontSize:12, flexShrink:0, marginLeft:6 }}>🎥</button>
          <div style=${{ flexShrink:0, marginLeft:8, textAlign:'right' }}>
            <div style=${{ fontSize:11, fontWeight:800, color:p.couleur }}>${ex.series} x ${ex.reps}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>⏱ ${ex.repos}</div>
          </div>
        </div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:6 }}>🏋 ${ex.charge} · 🎯 ${ex.cible}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'7px 10px', lineHeight:1.6 }}>
          ${ex.execution}
        </div>
      </div>`)}
      <${VideoPopup} />
    </div>`;
  }

  // ── LISTE PRINCIPALE ────────────────────────────────────────────────────────
  const mobilites      = allMobilite.filter(p => p && (!p.type || p.type === 'mobilite'));
  const forceAmplitude = allMobilite.filter(p => p && p.type === 'force_amplitude');
  const echauffements  = allMobilite.filter(p => p && p.type === 'echauffement');

  return _h`<div>
    ${isCoach ? _h`<div style=${{ marginBottom:16 }}>
      <button class="btn btn-primary btn-sm" style=${{ width:'100%' }} onClick=${()=>setShowCreate(!showCreate)}>
        ${showCreate ? '✕ Annuler' : '+ Créer un protocole de mobilité'}
      </button>
      ${showCreate ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginTop:10 }}>
        <div style=${{ fontSize:13, fontWeight:800, marginBottom:12 }}>Nouveau protocole de mobilité</div>
        <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
          <div style=${{ gridColumn:'1/-1' }}><div class="lbl">Nom</div><input class="inp" value=${formM.nom} onInput=${e=>setFormM(f=>({...f,nom:e.target.value}))} placeholder="Ex: Mobilité épaule handball"/></div>
          <div><div class="lbl">Icône</div><input class="inp" value=${formM.icon} onInput=${e=>setFormM(f=>({...f,icon:e.target.value}))} placeholder="🤸" style=${{ width:80 }}/></div>
          <div><div class="lbl">Type</div>
            <select class="inp" value=${formM.type} onChange=${e=>setFormM(f=>({...f,type:e.target.value}))}>
              <option value="mobilite">Mobilité</option>
              <option value="force_amplitude">Force en amplitude</option>
              <option value="echauffement">Échauffement</option>
            </select></div>
        </div>
        <div style=${{ marginBottom:10 }}><div class="lbl">Description</div>
          <textarea class="inp" value=${formM.description} onInput=${e=>setFormM(f=>({...f,description:e.target.value}))} style=${{ minHeight:45, resize:'vertical' }} placeholder="Objectif, contexte..."></textarea></div>
        <!-- Exercices -->
        <div style=${{ fontSize:11, fontWeight:700, marginBottom:6 }}>Exercices (${formM.exercices.length})</div>
        ${formM.exercices.map((ex,i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', padding:'5px 8px', background:'rgba(255,255,255,.04)', borderRadius:7, marginBottom:4 }}>
          <span style=${{ fontSize:11 }}>${ex.nom} · ${ex.duree}</span>
          <button onClick=${()=>setFormM(f=>({...f,exercices:f.exercices.filter((_,j)=>j!==i)}))} style=${{ background:'none', border:'none', color:'rgba(255,68,85,.6)', cursor:'pointer' }}>×</button>
        </div>`)}
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap', background:'rgba(255,255,255,.02)', borderRadius:8, padding:'8px', marginBottom:10 }}>
          <input class="inp" value=${newExM.nom} onInput=${e=>setNewExM(f=>({...f,nom:e.target.value}))} placeholder="Exercice" style=${{ flex:'1 1 120px' }} onKeyDown=${e=>e.key==='Enter'&&addExM()}/>
          <input class="inp" value=${newExM.duree} onInput=${e=>setNewExM(f=>({...f,duree:e.target.value}))} placeholder="Durée" style=${{ width:65 }}/>
          <input class="inp" value=${newExM.repos} onInput=${e=>setNewExM(f=>({...f,repos:e.target.value}))} placeholder="Repos" style=${{ width:65 }}/>
          <button class="btn btn-sm btn-primary" onClick=${addExM}>+</button>
        </div>
        <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${saveMobilite}>💾 Enregistrer</button>
      </div>` : null}
    </div>` : null}
    <!-- Force en amplitude -->
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:10, marginTop:20 }}>Force en amplitude</div>
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.15)', borderRadius:10, padding:'10px 14px', marginBottom:14, lineHeight:1.6 }}>
      PAILs / RAILs / End-range strength. Renforcement dans les amplitudes extremes. 3 semaines progressives.
    </div>
    ${forceAmplitude.map(p => _h`<div key=${p.id}
      onClick=${() => { setSelProtocole(p.id); setSelSemaine(0); }}
      style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+p.couleur+'25', borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
        <span style=${{ fontSize:24 }}>${p.icon}</span>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:14, fontWeight:800 }}>${p.nom}</div>
          <div style=${{ fontSize:11, color:p.couleur, marginTop:2 }}>${p.frequence} · ${p.duree_totale}</div>
        </div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.3)' }}>→</div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.6, marginBottom:10 }}>${p.description}</div>
      <div style=${{ display:'flex', gap:6 }}>
        ${p.semaines.map(s => _h`<div key=${s.sem} style=${{
          flex:1, background:p.couleur+'10', border:'1px solid '+p.couleur+'25',
          borderRadius:8, padding:'5px 8px', textAlign:'center'
        }}>
          <div style=${{ fontSize:9, color:p.couleur, fontWeight:700 }}>${s.sem}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.5)', marginTop:1 }}>${s.titre.split(' - ')[0]}</div>
        </div>`)}
      </div>
    </div>`)}

    <!-- Mobilite -->
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:2, marginBottom:10, marginTop:20 }}>Protocoles de mobilite</div>
    <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', background:'rgba(124,111,255,.06)', border:'1px solid rgba(124,111,255,.15)', borderRadius:10, padding:'10px 14px', marginBottom:14, lineHeight:1.6 }}>
      3 semaines de progression par articulation.
    </div>
    ${mobilites.map(p => _h`<div key=${p.id}
      onClick=${() => { setSelProtocole(p.id); setSelSemaine(0); }}
      style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+p.couleur+'25', borderRadius:14, padding:'14px 16px', marginBottom:10, cursor:'pointer' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
        <span style=${{ fontSize:24 }}>${p.icon}</span>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:14, fontWeight:800 }}>${p.nom}</div>
          <div style=${{ fontSize:11, color:p.couleur, marginTop:2 }}>${p.frequence} · ${p.duree_totale}</div>
        </div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.3)' }}>→</div>
      </div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.6, marginBottom:10 }}>${p.description}</div>
      <div style=${{ display:'flex', gap:6 }}>
        ${p.semaines.map(s => _h`<div key=${s.sem} style=${{
          flex:1, background:p.couleur+'10', border:'1px solid '+p.couleur+'25',
          borderRadius:8, padding:'5px 8px', textAlign:'center'
        }}>
          <div style=${{ fontSize:9, color:p.couleur, fontWeight:700 }}>${s.sem}</div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.5)', marginTop:1 }}>${s.titre.split(' - ')[0]}</div>
        </div>`)}
      </div>
    </div>`)}
  </div>`;
}
