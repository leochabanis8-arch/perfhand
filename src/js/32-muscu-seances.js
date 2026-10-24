


// ── PROGRAMME DU JOUR (vue joueur) ────────────────────────────────────────────
function ProgrammeJour({ player }) {
  const today = localDateStr();
  const todayDay = new Date().getDay(); // 0=dim, 1=lun...
  const dayNames = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const todayName = dayNames[todayDay];

  // Get today's planning from planif semaines
  const planif = player.planif || {};
  const weeks  = planif.semaines || [];
  const dateDebut = planif.dateDebut;

  // Find current week
  let currentWeek = null;
  if (dateDebut) {
    const start = new Date(dateDebut);
    const now   = new Date();
    const diffDays = Math.floor((now - start) / (1000*60*60*24));
    const weekIdx  = Math.floor(diffDays / 7);
    if (weekIdx >= 0 && weekIdx < weeks.length) {
      currentWeek = weeks[weekIdx];
    }
  }

  // Get today's seances from muscu + endurance
  const allMuscu = (player.muscuSeances || [])
    .filter(s => !s.dateFaite && s.datePrevu === today)
    .slice(0, 3);

  const allEndurance = (player.enduranceSeances || [])
    .filter(s => s.datePrevu === today || (!s.datePrevu && !s.dateFaite))
    .slice(0, 3);

  // Today's planning from week
  const todayPlanKey = 'j' + ((todayDay + 6) % 7); // convert Sun=0 to Mon=0
  const todayPlanValue = currentWeek ? currentWeek[todayPlanKey] : null;

  const hasContent = allMuscu.length > 0 || allEndurance.length > 0 || todayPlanValue || currentWeek;

  return _h`<div>
    <!-- Date header -->
    <div style=${{ marginBottom:16, background:'linear-gradient(135deg, rgba(255,164,32,.1), rgba(255,164,32,.03))', border:'1px solid rgba(255,164,32,.2)', borderRadius:14, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:2, marginBottom:3 }}>Aujourd'hui</div>
        <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>${todayName.toUpperCase()} ${today.split('-').reverse().join('/')}</div>
      </div>
      ${currentWeek ? _h`<div style=${{ textAlign:'right' }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${currentWeek.label}</div>
        <div style=${{ fontSize:12, fontWeight:700, color:'#FFA420' }}>${({'repos':'😴 Repos','ppg':'🏋️ PPG','pps1':'🔥 PPS1','pps2':'💪 PPS2','competition':'🏆 Compét','prevention':'🛡️ Prévention','rehab':'🩺 Réhab'})[currentWeek.cycle]||'—'}</div>
      </div>` : null}
    </div>

    <!-- Ce que tu dois faire aujourd'hui -->
    ${todayPlanValue ? _h`<div style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.25)', borderRadius:12, padding:'12px 16px', marginBottom:14 }}>
      <div style=${{ fontSize:11, color:'#FFA420', fontWeight:700, marginBottom:5 }}>📋 Prévu aujourd'hui</div>
      <div style=${{ fontSize:14, fontWeight:700 }}>${todayPlanValue}</div>
    </div>` : null}

    <!-- Objectifs de la semaine -->
    ${currentWeek && currentWeek.objectifs ? _h`<div style=${{ background:'rgba(56,189,248,.06)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'12px 16px', marginBottom:14 }}>
      <div style=${{ fontSize:11, color:'#38BDF8', fontWeight:700, marginBottom:6 }}>🎯 Objectifs de la semaine</div>
      <div style=${{ fontSize:13, lineHeight:1.6, color:'rgba(255,255,255,.8)' }}>${currentWeek.objectifs}</div>
    </div>` : null}

    <!-- Séances muscu du jour -->
    ${allMuscu.length > 0 ? _h`<div style=${{ marginBottom:14 }}>
      <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>🏋️ Musculation</div>
      ${allMuscu.map(s => _h`<div key=${s.id} style=${{ background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.2)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
        <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          ${s.seqNum ? _h`<div style=${{ width:22, height:22, borderRadius:5, background:'rgba(255,164,32,.2)', border:'1px solid rgba(255,164,32,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#FFA420', flexShrink:0 }}>${s.seqNum}</div>` : null}
          <div style=${{ fontSize:14, fontWeight:700 }}>${s.nom}</div>
        </div>
        ${s.objectif ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:3 }}>${s.objectif}</div>` : null}
        <div style=${{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
          ${s.rpeCible ? _h`<span style=${{ fontSize:10, background:'rgba(255,68,85,.1)', color:'#FF4455', padding:'2px 7px', borderRadius:20 }}>RPE cible: ${s.rpeCible}/10</span>` : null}
          ${s.exercices && s.exercices.length ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${s.exercices.length} exercice${s.exercices.length>1?'s':''}</span>` : null}
        </div>
      </div>`)}
    </div>` : null}

    <!-- Séances endurance du jour -->
    ${allEndurance.length > 0 ? _h`<div style=${{ marginBottom:14 }}>
      <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>🏃 Endurance</div>
      ${allEndurance.map(s => {
        const tc = ({'continu_ext':'#38BDF8','continu_int':'#4CAF50','interval':'#FFA420','fractionne':'#FF7A00','spl':'#7C6FFF','recup_active':'rgba(255,255,255,.4)'})[s.type]||'#38BDF8';
        return _h`<div key=${s.id} style=${{ background: tc+'08', border:'1px solid '+tc+'25', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
          <div style=${{ fontSize:14, fontWeight:700, marginBottom:4 }}>${s.nom||s.type}</div>
          <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
            ${s.duree ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>⏱ ${s.duree} min</span>` : null}
            ${s.intensite ? _h`<span style=${{ fontSize:11, color:tc }}>💓 ${s.intensite}</span>` : null}
            ${s.distance ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>📏 ${s.distance}</span>` : null}
          </div>
          ${s.notes ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:5 }}>💡 ${s.notes}</div>` : null}
        </div>`;
      })}
    </div>` : null}

    <!-- Semaine complète -->
    ${currentWeek ? _h`<div class="card" style=${{ marginBottom:12 }}>
      <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>📅 Planning de la semaine</div>
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 }}>
        ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((j,ji) => {
          const val = currentWeek['j'+ji]||'';
          const heure = currentWeek['h'+ji]||'';
          const heure2 = currentWeek['h'+ji+'b']||'';
          const isToday = ji === ((todayDay+6)%7);
          return _h`<div key=${j} style=${{
            background: isToday?'rgba(255,164,32,.12)':'rgba(255,255,255,.03)',
            border:'1px solid '+(isToday?'rgba(255,164,32,.4)':'rgba(255,255,255,.07)'),
            borderRadius:9, padding:'7px 6px', textAlign:'center'
          }}>
            <div style=${{ fontSize:9, color:isToday?'#FFA420':'rgba(255,255,255,.35)', fontWeight:isToday?700:400, marginBottom:3 }}>${j}</div>
            ${(heure || heure2) ? _h`<div style=${{ fontSize:9, color:'#38BDF8', fontWeight:700, marginBottom:2 }}>🕐 ${[heure, heure2].filter(Boolean).join(' / ')}</div>` : null}
            <div style=${{ fontSize:10, color:val?'#fff':'rgba(255,255,255,.2)', fontWeight:val?600:400, lineHeight:1.3 }}>${val||'—'}</div>
          </div>`;
        })}
      </div>
      ${currentWeek.notes ? _h`<div style=${{ marginTop:8, fontSize:11, color:'rgba(255,255,255,.4)', borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:8 }}>
        📝 ${currentWeek.notes}
      </div>` : null}
    </div>` : null}

    ${!hasContent ? _h`<div style=${{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
      <div style=${{ fontSize:32, marginBottom:8 }}>📋</div>
      <div>Aucune séance planifiée pour aujourd'hui.</div>
      <div style=${{ fontSize:11, marginTop:4, color:'rgba(255,255,255,.2)' }}>Ton coach n\\'a pas encore défini ton programme.</div>
    </div>` : null}
  </div>`;
}


// ── Lien automatique exercice ↔ bibliothèque (éditeur de séance coach) ─────────────────────────
// Reconnaît le nom saisi dans la bibliothèque : renseigne `biblio` (nom de la fiche) et reprend
// l'image de la fiche si l'exercice n'en a pas déjà une saisie à la main.
function applyBiblioLink(ex) {
  if (!ex) return ex;
  const nom = (ex.nom || '').trim();
  const m = nom ? findBiblioMatch(nom) : null;
  const r = { ...ex };
  if (m) {
    r.biblio = m.nom; r.biblioFor = ex.nom;
    if (m.imageUrl && (!ex.imageUrl || ex.imageAuto)) { r.imageUrl = m.imageUrl; r.imageAuto = true; }
    else if (!m.imageUrl && ex.imageAuto) { r.imageUrl = ''; delete r.imageAuto; }
    return r;
  }
  // Pas de correspondance : on garde un lien explicite posé à la création (ex. bilans de départ)
  // tant que le nom n'a pas été modifié depuis.
  if (ex.biblio && (!ex.biblioFor || ex.biblioFor === ex.nom)) { r.biblioFor = ex.nom; return r; }
  delete r.biblio; delete r.biblioFor;
  if (r.imageAuto) { r.imageUrl = ''; delete r.imageAuto; }
  return r;
}

// Champ « nom de l'exercice » avec suggestions de la bibliothèque + indicateur de lien
function ExoNomInput({ value, onChange, onPick, onBlur }) {
  const [open, setOpen] = React.useState(false);
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const q = norm(value);
  let sugg = [];
  if (open && q.length >= 2) {
    const words = q.split(' ').filter(Boolean);
    const all = [...(window.__perfhand_custom_biblio || []).filter(m => m && m.nom), ...BIBLIOTHEQUE_MOUVEMENTS.filter(m => m && m.nom && m.groupe)];
    const seen = new Set();
    all.forEach(m => {
      const n = norm(m.nom);
      if (seen.has(n)) return;
      if (words.every(w => n.includes(w))) { seen.add(n); sugg.push(m); }
    });
    sugg = sugg.sort((a, b) => (norm(a.nom).startsWith(q) ? 0 : 1) - (norm(b.nom).startsWith(q) ? 0 : 1)).slice(0, 8);
  }
  const linked = (value || '').trim() ? findBiblioMatch(value) : null;
  return _h`<div style=${{ position:'relative', flex:1, minWidth:0 }}>
    <input class="ex-inp" value=${value} placeholder="Nom de l'exercice (suggestions de la bibliothèque)"
      onInput=${e => { onChange(e.target.value); setOpen(true); }}
      onFocus=${() => setOpen(true)}
      onBlur=${() => { setTimeout(() => setOpen(false), 150); onBlur && onBlur(); }}
      style=${{ textAlign:'left', width:'100%', boxSizing:'border-box', fontSize:13 }}/>
    ${linked ? _h`<div style=${{ fontSize:10, marginTop:3, color:'#4CAF50', fontWeight:700 }}>📚 Lié à la bibliothèque : ${linked.nom}${linked.imageUrl || linked.videoUrl || linked.videoId ? '' : ' (sans image)'}</div>`
      : (value || '').trim().length > 2 ? _h`<div style=${{ fontSize:10, marginTop:3, color:'rgba(255,255,255,.3)' }}>Pas de fiche liée — choisis une suggestion ou ajoute l'exercice à la bibliothèque</div>` : null}
    ${sugg.length ? _h`<div style=${{ position:'absolute', left:0, right:0, top:'100%', zIndex:50, marginTop:2, maxHeight:260, overflowY:'auto', background:'#1b1d26', border:'1px solid rgba(255,164,32,.35)', borderRadius:10, boxShadow:'0 10px 30px rgba(0,0,0,.6)' }}>
      ${sugg.map((m, k) => _h`<div key=${k} onMouseDown=${e => { e.preventDefault(); onPick(m); setOpen(false); }} onTouchStart=${() => {}}
        style=${{ padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', justifyContent:'space-between', gap:8, alignItems:'center' }}>
        <span style=${{ fontSize:13, fontWeight:600 }}>${m.nom}</span>
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', flexShrink:0 }}>${m.groupe || ''}${m.imageUrl ? ' · 🖼' : ''}${m.videoUrl || m.videoId ? ' · ▶' : ''}</span>
      </div>`)}
    </div>` : null}
  </div>`;
}

function MuscuSeanceEditor({ seance, onSave, onClose, player }) {
  const [form, setForm] = useState(() => {
    const s = JSON.parse(JSON.stringify(seance || {}));
    if (!Array.isArray(s.exercices)) s.exercices = [];
    return s;
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Détection auto du mouvement (squat/bench/rdl/rowing) pour lier % → 1RM enregistré ──
  const normalize = (s) => (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const RM_KEYWORDS = [
    { id:'squat',  words:['squat'] },
    { id:'bench',  words:['developpe couche', 'developpe couché', 'bench press', 'dc barre'] },
    { id:'rdl',    words:['souleve de terre', 'soulevé de terre', 'deadlift', 'romanian deadlift'] },
    { id:'rowing', words:['rowing barre', 'rowing'] },
    // Mouvements au poids du corps (charge lestée en % du poids du corps)
    { id:'poids_corps', words:['traction', 'tractions', 'pull-up', 'pull up', 'chin-up', 'chin up', 'dips', 'dip', 'pompes', 'pompe', 'muscle-up', 'muscle up'] },
  ];
  // Vérifie que "needle" apparaît comme mot entier dans "haystack", pas comme simple fragment
  // d'un autre mot ou d'une autre expression (évite ex: "bench" qui matcherait "workbench").
  function wholeWordIncludes(haystack, needle) {
    if (!needle) return false;
    const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(^|[^a-z0-9])' + esc + '($|[^a-z0-9])', 'i');
    return re.test(' ' + haystack + ' ');
  }
  function detectMouvement(exName) {
    const n = normalize(exName);
    if (!n) return null;
    // Mots-clés de base : on garde le match le plus long/spécifique. Ex: si l'exercice contient
    // "developpe couche" ET que "bench press" ne matche pas, c'est fiable ; un mot isolé trop
    // générique ("press" seul, "bench" seul dans une autre expression) ne doit jamais suffire.
    let best = null;
    RM_KEYWORDS.forEach(k => {
      k.words.forEach(w => {
        const wn = normalize(w);
        if (wn && wholeWordIncludes(n, wn) && (!best || wn.length > best.len)) {
          best = { id: k.id, len: wn.length };
        }
      });
    });
    // Mouvements personnalisés du joueur (ajoutés via "+ Ajouter un mouvement" dans le calculateur
    // 1RM) — on exige que TOUS les mots significatifs (>2 lettres) du nom du mouvement soient
    // présents comme mots entiers dans l'exercice, pas juste un mot générique isolé comme "press"
    // qui confondrait par exemple "Larsen Press" avec "Bench Press".
    const custom = (player && player.customRM) || [];
    custom.forEach(c => {
      if (!c.label) return;
      const labelWords = normalize(c.label).split(/\s+/).filter(w => w.length > 2);
      if (labelWords.length === 0) return;
      const allPresent = labelWords.every(w => wholeWordIncludes(n, w));
      const len = normalize(c.label).length;
      if (allPresent && (!best || len > best.len)) best = { id: c.id, len };
    });
    return best ? best.id : null;
  }
  function getPlayerRM(mvtId) {
    if (mvtId === 'poids_corps') return poidsCorpsJoueur(player);
    if (!mvtId || !player || !player.rmHistory || !player.rmHistory[mvtId]) return null;
    const hist = player.rmHistory[mvtId];
    if (!hist.length) return null;
    return hist[hist.length - 1].rm;
  }
  // Extrait un pourcentage depuis "70%", "70 %", "70" (mais pas "70kg")
  function parsePct(chargeStr) {
    const s = (chargeStr||'').toString().trim();
    if (/kg/i.test(s)) return null;
    const m = s.match(/^(\d+(?:[.,]\d+)?)\s*%?$/);
    if (!m) return null;
    return parseFloat(m[1].replace(',','.'));
  }
  function chargeHint(ex) {
    const pcPct = parsePctPC(ex.charge);
    if (pcPct != null || (detectMouvement(ex.nom) === 'poids_corps' && parsePct(ex.charge) != null)) {
      const pct = pcPct != null ? pcPct : parsePct(ex.charge);
      const pw = poidsCorpsJoueur(player);
      if (!pw) return { ok:false, text: `Poids du corps non renseigné pour ${player ? player.name : 'ce joueur'} (onglet Poids / Composition)` };
      const kgPc = Math.round((pw * pct / 100) / 2.5) * 2.5;
      return { ok:true, text: `≈ +${kgPc} kg de lest  (${pct}% de ${pw} kg — poids du corps)` };
    }
    // Rappel pratique : mouvement au poids du corps sans charge saisie
    if (detectMouvement(ex.nom) === 'poids_corps' && !(ex.charge||'').toString().trim()) {
      return { ok:false, text: `Mouvement au poids du corps : écris par ex. « 20% PC » pour un lest en % du poids du corps${poidsCorpsJoueur(player) ? ' (' + poidsCorpsJoueur(player) + ' kg)' : ''}` };
    }
    const mvtId = detectMouvement(ex.nom);
    const pct = parsePct(ex.charge);
    if (pct == null) return null;
    const rm = getPlayerRM(mvtId);
    const mvtLabel = (MOUVEMENTS_RM.find(m => m.id === mvtId) || {}).label;
    if (!rm) {
      return mvtId
        ? { ok:false, text: `Pas de 1RM ${mvtLabel} enregistré pour ${player ? player.name : 'ce joueur'}` }
        : { ok:false, text: `Nom d'exercice non reconnu (squat / développé couché / soulevé de terre / rowing / mouvements personnalisés du joueur) — 1RM non lié` };
    }
    const kg = Math.round((rm * pct / 100) / 2.5) * 2.5;
    return { ok:true, text: `≈ ${kg} kg  (${pct}% de ${rm} kg — ${mvtLabel})` };
  }
  // Poids d'une ligne du détail par série — recalculé EN DIRECT à partir du % PROPRE À CETTE
  // SÉRIE (d.pct, qui évolue série après série : ex. 65% / 75% / 85%) et du 1RM du joueur affiché.
  // Ne jamais utiliser un seul % pour toutes les séries : chaque ligne a le sien.
  function chargeDetailHint(ex, d) {
    if (!d.pct) return d.charge || (d.pct ? d.pct+'% 1RM' : '—');
    const mvtId = detectMouvement(ex.nom);
    const rm = getPlayerRM(mvtId);
    if (!rm) return d.pct + '% 1RM';
    const kg = Math.round((rm * d.pct / 100) / 2.5) * 2.5;
    return kg + ' kg';
  }

  function updEx(i, k, v) {
    setForm(f => ({
      ...f,
      exercices: f.exercices.map((e, j) => j === i ? { ...e, [k]: v } : e)
    }));
  }
  function addEx() {
    // CORRECTIF EMOM : dans une séance dont la MÉTHODE est EMOM, un exercice ajouté à la main doit
    // démarrer marqué EMOM par défaut (au lieu d'obliger le coach à penser à cocher le bouton "EMOM"
    // à chaque fois) — sans quoi le chrono se comporte comme un repos classique au lieu d'un vrai EMOM.
    // NB : on se base UNIQUEMENT sur form.methode, pas sur "un exercice de la séance a EMOM coché" —
    // sinon, cocher EMOM à la main sur un seul exercice d'une séance normale faisait basculer TOUS
    // les exercices ajoutés ensuite en EMOM malgré eux (bug remonté par Léo).
    const isEmomSeance = /emom/i.test(form.methode || '');
    const emomDureeDefaut = (form.exercices||[]).find(e => e.emom)?.emomDuree || 10;
    setForm(f => ({
      ...f,
      exercices: [...f.exercices, isEmomSeance
        ? { nom:'', series:10, reps:'6-8', emom:true, emomDuree: emomDureeDefaut, charge:'', rir:'', repos:'', notes:'' }
        : { nom:'', series:3, reps:'8-10', charge:'', rir:'', repos:'90s', notes:'' }]
    }));
  }
  function delEx(i) {
    setForm(f => ({ ...f, exercices: f.exercices.filter((_, j) => j !== i) }));
  }
  // Change l'ordre des exercices dans la séance (déplace i vers i-1 ou i+1). On déplace le
  // bloc entier quand l'exercice fait partie d'un superset/dropset groupé, pour ne pas casser
  // le regroupement visuel.
  function moveEx(i, dir) {
    setForm(f => {
      const exs = f.exercices.map(e => ({ ...e }));
      const cur = exs[i];
      // Étendre à tout le groupe (superset/dropset) contenant i, s'il y en a un
      let start = i, end = i;
      if (cur.groupeType && cur.groupeId) {
        while (start > 0 && exs[start-1].groupeType === cur.groupeType && exs[start-1].groupeId === cur.groupeId) start--;
        while (end < exs.length-1 && exs[end+1].groupeType === cur.groupeType && exs[end+1].groupeId === cur.groupeId) end++;
      }
      if (dir === 'up') {
        if (start === 0) return f;
        // Trouver le début du bloc précédent (qui peut lui aussi être groupé)
        let prevEnd = start - 1;
        let prevStart = prevEnd;
        const prev = exs[prevEnd];
        if (prev.groupeType && prev.groupeId) {
          while (prevStart > 0 && exs[prevStart-1].groupeType === prev.groupeType && exs[prevStart-1].groupeId === prev.groupeId) prevStart--;
        }
        const block = exs.slice(start, end+1);
        const prevBlock = exs.slice(prevStart, prevEnd+1);
        const rest = [...exs.slice(0, prevStart), ...block, ...prevBlock, ...exs.slice(end+1)];
        return { ...f, exercices: rest };
      } else {
        if (end === exs.length-1) return f;
        let nextStart = end + 1;
        let nextEnd = nextStart;
        const next = exs[nextStart];
        if (next.groupeType && next.groupeId) {
          while (nextEnd < exs.length-1 && exs[nextEnd+1].groupeType === next.groupeType && exs[nextEnd+1].groupeId === next.groupeId) nextEnd++;
        }
        const block = exs.slice(start, end+1);
        const nextBlock = exs.slice(nextStart, nextEnd+1);
        const rest = [...exs.slice(0, start), ...nextBlock, ...block, ...exs.slice(nextEnd+1)];
        return { ...f, exercices: rest };
      }
    });
  }

  function groupEx(i, type) {
    // If already in a group of this type with previous, ungroup; else group with next
    setForm(f => {
      const exs = f.exercices.map((e, j) => ({ ...e }));
      const cur = exs[i];
      // Ungroup if already grouped
      if (cur.groupeType === type) {
        exs[i] = { ...cur, groupeType: null, groupeId: null };
        return { ...f, exercices: exs };
      }
      // Find next group letter not already used
      const usedIds = exs.filter(e => e.groupeType === type).map(e => e.groupeId).filter(Boolean);
      const letters = 'ABCDEFGHIJ';
      let letter = 'A';
      for (let l of letters) { if (!usedIds.includes(l)) { letter = l; break; } }
      // If previous ex already in a group of same type, use same letter
      if (i > 0 && exs[i-1].groupeType === type) {
        letter = exs[i-1].groupeId;
      }
      exs[i] = { ...cur, groupeType: type, groupeId: letter };
      // Also group next ex if it's not grouped yet
      return { ...f, exercices: exs };
    });
  }

  const RPE_LABELS = ['','Très léger','Léger','Modéré','Assez dur','Difficile','Difficile+','Très difficile','Très difficile+','Maximal','Absolu max'];
  const rpeColor = (v) => !v ? 'rgba(255,255,255,.2)' : v <= 3 ? '#4CAF50' : v <= 5 ? '#8BC34A' : v <= 7 ? '#FFB800' : v <= 8 ? '#FF7A00' : '#FF4455';

  // Rendu d'une carte exercice — réutilisée seule ou à l'intérieur d'un bloc SUPERSET/DROPSET
  function renderExCard(ex, i, opts) {
    opts = opts || {};
    const grouped = !!opts.grouped;
    const isLast = opts.isLast !== false; // par défaut true (cas non groupé)
    return _h`<div key=${i} style=${{
      marginBottom: grouped ? 0 : 8,
      background: grouped ? 'transparent' : 'rgba(255,255,255,.03)',
      borderRadius: grouped ? 0 : 10,
      padding: grouped ? '9px 12px' : '10px 12px',
      border: grouped ? 'none' : '1px solid rgba(255,255,255,.06)',
      borderBottom: grouped && !isLast ? '1px dashed rgba(255,255,255,.08)' : (grouped ? 'none' : undefined)
    }}>
      <!-- Bloc de séance (Force, Renforcement, Vitesse…) : cet exercice ouvre un nouveau bloc -->
      ${ex.blocNom != null ? (() => { const b = blocInfo(form.exercices, i); return _h`<div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 8px', borderRadius:8, background:b.col+'1A', border:'1px solid '+b.col+'55' }}>
        <span style=${{ fontSize:12, fontWeight:800, color:b.col, flexShrink:0 }}>BLOC ${b.n}</span>
        <input class="ex-inp" list="blocs-suggest" value=${ex.blocNom} onInput=${e => updEx(i,'blocNom',e.target.value)} placeholder="Nom du bloc (Force, Renforcement, Vitesse…)" style=${{ flex:1, textAlign:'left' }}/>
        <button title="Retirer le début de bloc" onClick=${() => setForm(f => ({ ...f, exercices: f.exercices.map((e, j) => { if (j !== i) return e; const { blocNom, ...rest } = e; return rest; }) }))}
          style=${{ background:'none', border:'none', color:'rgba(255,255,255,.4)', cursor:'pointer', fontSize:16, flexShrink:0 }}>×</button>
      </div>`; })() : _h`<button onClick=${() => updEx(i,'blocNom','')} style=${{ width:'100%', marginBottom:8, padding:'4px', borderRadius:8, border:'1px dashed rgba(255,255,255,.15)', background:'none', color:'rgba(255,255,255,.35)', fontSize:10, cursor:'pointer' }}>➕ Commencer un nouveau bloc ici</button>`}
      <datalist id="blocs-suggest">${['Échauffement','Force','Renforcement','Vitesse','Puissance','Prévention','Gainage','Finisher','Retour au calme'].map(x => _h`<option key=${x} value=${x}></option>`)}</datalist>
      <!-- Nom exercice + bouton suppr + groupe type -->
      <div style=${{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <${ExoNomInput} value=${ex.nom} onChange=${v => updEx(i,'nom',v)}
          onPick=${m => setForm(f => ({ ...f, exercices: f.exercices.map((e, j) => j === i ? applyBiblioLink({ ...e, nom: m.nom }) : e) }))}
          onBlur=${() => setForm(f => ({ ...f, exercices: f.exercices.map((e, j) => j === i ? applyBiblioLink(e) : e) }))} />
        <!-- Superset / Dropset buttons -->
        <button title="Superset"
          onClick=${() => groupEx(i, 'superset')}
          style=${{
            padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:9, fontWeight:800,
            border: ex.groupeType==='superset' ? '2px solid #FFA420' : '1px solid rgba(255,255,255,.1)',
            background: ex.groupeType==='superset' ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)',
            color: ex.groupeType==='superset' ? '#FFA420' : 'rgba(255,255,255,.3)'
          }}>SS</button>
        <button title="Dropset"
          onClick=${() => groupEx(i, 'dropset')}
          style=${{
            padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:9, fontWeight:800,
            border: ex.groupeType==='dropset' ? '2px solid #FF4455' : '1px solid rgba(255,255,255,.1)',
            background: ex.groupeType==='dropset' ? 'rgba(255,68,85,.15)' : 'rgba(255,255,255,.04)',
            color: ex.groupeType==='dropset' ? '#FF4455' : 'rgba(255,255,255,.3)'
          }}>DS</button>
        <button title="EMOM"
          onClick=${() => updEx(i, 'emom', !ex.emom)}
          style=${{
            padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:9, fontWeight:800,
            border: ex.emom ? '2px solid #38BDF8' : '1px solid rgba(255,255,255,.1)',
            background: ex.emom ? 'rgba(56,189,248,.15)' : 'rgba(255,255,255,.04)',
            color: ex.emom ? '#38BDF8' : 'rgba(255,255,255,.3)'
          }}>EMOM</button>
        ${ex.emom ? _h`<span style=${{ fontSize:9, padding:'2px 6px', borderRadius:20, fontWeight:800, background:'rgba(56,189,248,.12)', color:'#38BDF8' }}>⏱ EMOM</span>` : null}
        <!-- Réordonner l'exercice dans la séance -->
        <button title="Monter" disabled=${i===0} onClick=${() => moveEx(i,'up')}
          style=${{ width:22, height:22, borderRadius:6, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)',
            color: i===0 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.5)', fontSize:11, lineHeight:1,
            cursor: i===0 ? 'default' : 'pointer', flexShrink:0, padding:0 }}>▲</button>
        <button title="Descendre" disabled=${i===form.exercices.length-1} onClick=${() => moveEx(i,'down')}
          style=${{ width:22, height:22, borderRadius:6, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)',
            color: i===form.exercices.length-1 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.5)', fontSize:11, lineHeight:1,
            cursor: i===form.exercices.length-1 ? 'default' : 'pointer', flexShrink:0, padding:0 }}>▼</button>
        <button class="del-btn" onClick=${() => delEx(i)} style=${{ flexShrink:0 }}>×</button>
      </div>
      <!-- Séries / Reps / Charge / RIR / Repos + image -->
      <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 0.8fr 1fr 28px', gap:5, alignItems:'center' }}>
        <div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Séries</div>
          <input class="ex-inp" type="number" value=${ex.series} onInput=${e => updEx(i,'series',e.target.value)} style=${{ width:'100%' }}/>
        </div>
        <div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Reps</div>
          <input class="ex-inp" value=${ex.reps} onInput=${e => updEx(i,'reps',e.target.value)} placeholder="8-10" style=${{ width:'100%' }}/>
        </div>
        <div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Charge</div>
          <input class="ex-inp" value=${ex.charge} onInput=${e => updEx(i,'charge',e.target.value)} placeholder="75%" style=${{ width:'100%' }}/>
        </div>
        <div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>RIR</div>
          <input class="ex-inp" value=${ex.rir||''} onInput=${e => updEx(i,'rir',e.target.value)} placeholder="2" style=${{ width:'100%' }}/>
        </div>
        <div>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>${ex.emom ? 'EMOM (min)' : (grouped && !isLast ? 'Entre exos' : 'Repos')}</div>
          ${ex.emom
            ? _h`<input class="ex-inp" type="number" value=${ex.emomDuree||10} onInput=${e => updEx(i,'emomDuree',parseInt(e.target.value))} placeholder="10" style=${{ width:'100%' }}/>`
            : (grouped && !isLast
              ? _h`<div class="ex-inp" style=${{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.3)', fontStyle:'italic', fontSize:11, cursor:'default' }}>↳ direct</div>`
              : _h`<input class="ex-inp" value=${ex.repos} onInput=${e => updEx(i,'repos',e.target.value)} placeholder="90s" style=${{ width:'100%' }}/>`)
          }
        </div>
        <button title="Ajouter une image" onClick=${() => updEx(i,'_showImg',!ex._showImg)}
          style=${{ width:28, height:28, borderRadius:6, border:'1px solid '+(ex.imageUrl?'rgba(56,189,248,.4)':'rgba(255,255,255,.1)'),
            background:ex.imageUrl?'rgba(56,189,248,.12)':'rgba(255,255,255,.04)', cursor:'pointer',
            color:ex.imageUrl?'#38BDF8':'rgba(255,255,255,.35)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', alignSelf:'flex-end' }}>🖼</button>
      </div>
      <!-- Consigne technique spécifique à cet exercice (visible par le joueur sous l'exercice) -->
      <div style=${{ marginTop:8 }}>
        <textarea class="ex-inp" rows=${(ex.notes || '').length > 70 ? 3 : 2} value=${ex.notes || ''} onInput=${e => updEx(i,'notes',e.target.value)}
          placeholder="📝 Consigne technique (ex : descente en 3 s, coudes serrés, pause 1 s en bas…)"
          style=${{ width:'100%', boxSizing:'border-box', textAlign:'left', fontSize:12, lineHeight:1.5, padding:'8px 10px', resize:'vertical', minHeight:44, fontFamily:'Inter,sans-serif' }}></textarea>
      </div>
      <!-- Indication live : charge calculée depuis le 1RM enregistré du joueur -->
      ${(() => {
        // Si la charge évolue série par série (chargeDetails avec plusieurs % différents), le %
        // unique de ex.charge (souvent celui de la 1ère série) ne représente que celle-ci — on le
        // précise pour éviter de laisser croire que c'est la charge de toute la séance.
        const pctsDistincts = ex.chargeDetails && ex.chargeDetails.length > 0
          ? Array.from(new Set(ex.chargeDetails.map(d => d.pct).filter(Boolean))) : [];
        const evolutive = pctsDistincts.length > 1;
        const hint = chargeHint(ex);
        if (!hint) return null;
        return _h`<div style=${{ marginTop:5, fontSize:10.5, fontWeight:700, color: hint.ok ? '#38BDF8' : 'rgba(255,164,32,.6)' }}>
          ${hint.ok ? '🧮 ' : '⚠ '}${hint.text}${evolutive ? ' — 1ère série (charge évolutive, voir détail ci-dessous)' : ''}
        </div>`;
      })()}
      <!-- Détail charges par série (si calculé depuis 1RM) -->
      ${ex.chargeDetails && ex.chargeDetails.length > 0 ? _h`<div style=${{ marginTop:6 }}>
        <button onClick=${() => updEx(i,'_showCharges',!ex._showCharges)}
          style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontSize:10, color:'#FFA420', fontWeight:700, width:'100%', textAlign:'left' }}>
          📊 Charges 1RM ${ex._showCharges ? '▲' : '▼'}
        </button>
        ${ex._showCharges ? _h`<div style=${{ marginTop:4, background:'rgba(255,164,32,.05)', border:'1px solid rgba(255,164,32,.15)', borderRadius:8, padding:'8px 10px' }}>
          ${ex.chargeDetails.map((d, di) => _h`<div key=${di} style=${{ display:'flex', alignItems:'center', gap:8, padding:'3px 0', borderBottom: di < ex.chargeDetails.length-1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
            <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', minWidth:30 }}>S${d.serie}</span>
            <span style=${{ fontSize:11, fontWeight:700, color:d.amrap?'#FFA420':'rgba(255,255,255,.8)', minWidth:50 }}>${d.reps}${d.amrap?' 🔥':''}</span>
            <span style=${{ fontSize:12, fontWeight:800, color:'#38BDF8', minWidth:60 }}>${chargeDetailHint(ex, d)}</span>
            <span style=${{ fontSize:10, color:'rgba(255,255,255,.3)' }}>${d.pct ? '@ '+d.pct+'%' : ''}</span>
            ${d.note ? _h`<span style=${{ fontSize:9, color:'rgba(255,255,255,.25)', flex:1, textAlign:'right' }}>${d.note}</span>` : null}
          </div>`)}
        </div>` : null}
      </div>` : null}
      <!-- Champ URL image (collapsible) -->
      ${ex._showImg ? _h`<div style=${{ display:'flex', gap:6, alignItems:'center' }}>
        <input class="ex-inp" value=${ex.imageUrl||''} onInput=${e => updEx(i,'imageUrl',e.target.value)}
          placeholder="https://... URL de l'image GIF ou photo"
          style=${{ flex:1, fontSize:11 }}/>
        ${ex.imageUrl ? _h`<img src=${ex.imageUrl} alt="" style=${{ width:44, height:44, objectFit:'cover', borderRadius:6, border:'1px solid rgba(255,255,255,.15)', flexShrink:0 }} onError=${e => e.target.style.display='none'} />` : null}
      </div>` : null}
    </div>`;
  }

  // Construit les blocs à afficher : cartes seules, ou groupes SUPERSET/DROPSET visuellement reliés
  function buildExerciceBlocks() {
    const blocks = [];
    const visited = new Set();
    (form.exercices || []).forEach((ex, i) => {
      if (visited.has(i)) return;
      if (ex.groupeType && ex.groupeId) {
        const groupIdxs = form.exercices
          .map((e, j) => j)
          .filter(j => form.exercices[j].groupeType === ex.groupeType && form.exercices[j].groupeId === ex.groupeId);
        groupIdxs.forEach(j => visited.add(j));
        const isSuper = ex.groupeType === 'superset';
        const col = isSuper ? '#FFA420' : '#FF4455';
        const label = isSuper ? 'SUPERSET' : 'DROPSET';
        const desc = isSuper
          ? 'Enchaîner sans repos — repos uniquement après le tour complet'
          : 'Enchaîner en réduisant la charge à chaque série, sans repos';
        blocks.push(_h`<div key=${'grp-'+ex.groupeType+'-'+ex.groupeId} style=${{ border:'2px solid '+col+'50', borderRadius:12, overflow:'hidden', marginBottom:8, background:'rgba(255,255,255,.02)' }}>
          <div style=${{ background:col+'18', padding:'7px 12px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style=${{ fontSize:11, fontWeight:900, color:col, letterSpacing:1.5 }}>${label} ${ex.groupeId}</span>
            <span style=${{ fontSize:9.5, color:col, opacity:.8, fontStyle:'italic' }}>${desc}</span>
          </div>
          ${groupIdxs.map((j, gi) => renderExCard(form.exercices[j], j, { grouped:true, isLast: gi === groupIdxs.length - 1 }))}
        </div>`);
      } else {
        visited.add(i);
        blocks.push(renderExCard(ex, i, {}));
      }
    });
    return blocks;
  }

  // Éditeur en PLEINE PAGE (plus de petite fenêtre) : plus de place pour lire et organiser la séance
  return _h`<div class="edit-modal-bg" style=${{ padding:0, alignItems:'stretch' }}>
    <div class="edit-modal" style=${{ maxWidth:'none', maxHeight:'100vh', height:'100vh', borderRadius:0, border:'none' }}>
      <div style=${{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style=${{ fontSize:16, fontWeight:800 }}>Séance muscu — RPE cible${player && player.name ? ' · ' + player.name : ''}</div>
        <button onClick=${onClose} style=${{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.7)', fontSize:13, fontWeight:700, cursor:'pointer', borderRadius:8, padding:'6px 12px' }}>✕ Fermer</button>
      </div>
      <div class="edit-modal-body"><div style=${{ maxWidth:1000, margin:'0 auto', width:'100%' }}>
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Nom de la séance</div>
          <input class="inp" value=${form.nom} onInput=${e => upd('nom', e.target.value)} placeholder="Ex: Séance A — Force"/>
        </div>
        <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div><div class="lbl">Méthode</div>
            <input class="inp" value=${form.methode || ''} onInput=${e => upd('methode', e.target.value)} placeholder="Ex: 5-3-1"/>
          </div>
          <div><div class="lbl">Contexte / Semaine</div>
            <input class="inp" value=${form.contexte || ''} onInput=${e => upd('contexte', e.target.value)} placeholder="Ex: S1 — PPG"/>
          </div>
        </div>
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Objectif</div>
          <input class="inp" value=${form.objectif || ''} onInput=${e => upd('objectif', e.target.value)} placeholder="Ex: Force max — travail à 85% 1RM"/>
        </div>

        <!-- DATE PRÉCISE -->
        <div style=${{ marginBottom:14 }}>
          <div class="lbl" style=${{ marginBottom:6 }}>📅 Date de la séance</div>
          <input class="inp" type="date" value=${form.datePrevu || ''}
            onInput=${e => upd('datePrevu', e.target.value)}
            style=${{ maxWidth:200, accentColor:'#FFA420' }}/>
          ${form.datePrevu ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:5 }}>
            ${new Date(form.datePrevu + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>` : _h`<div style=${{ fontSize:11, color:'#FF4455', marginTop:5, fontWeight:600 }}>⚠ Ajoute une date pour que la séance apparaisse dans le planning semaine</div>`}
        </div>

        <!-- RPE CIBLE (coach) -->
        <div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style=${{ fontSize:13, fontWeight:700, color:'#FFA420' }}>RPE cible — Intensité voulue</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${form.rpeCible ? RPE_LABELS[form.rpeCible] : 'Non défini'}</div>
            </div>
            <div style=${{ fontSize:36, fontWeight:800, color:rpeColor(form.rpeCible), fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>
              ${form.rpeCible ? form.rpeCible + '/10' : '—'}
            </div>
          </div>
          <div style=${{ display:'flex', gap:4 }}>
            ${[1,2,3,4,5,6,7,8,9,10].map(v => _h`<button key=${v}
              onClick=${() => upd('rpeCible', form.rpeCible === v ? null : v)}
              style=${{
                flex:1, height:36, borderRadius:6, border:'none', cursor:'pointer',
                background: v === form.rpeCible ? rpeColor(v) : 'rgba(255,255,255,.06)',
                color: v === form.rpeCible ? '#fff' : 'rgba(255,255,255,.3)',
                fontWeight:800, fontSize:12, fontFamily:'Inter,sans-serif'
              }}
            >${v}</button>`)}
          </div>
          <div style=${{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Très léger</span>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Maximal</span>
          </div>
        </div>

        <!-- Tableau exercices -->
        <div class="lbl" style=${{ marginBottom:8 }}>Exercices</div>
        ${buildExerciceBlocks()}
        <button class="add-btn" onClick=${addEx}>+ Ajouter un exercice</button>

        <div style=${{ marginTop:12 }}>
          <div class="lbl">Notes coach</div>
          <textarea class="inp" value=${form.notes || ''} onInput=${e => upd('notes', e.target.value)}
            placeholder="Instructions, points d'attention..." style=${{ resize:'vertical', minHeight:55 }}></textarea>
        </div>
      </div></div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${() => { onSave({ ...form, exercices: (form.exercices || []).map(applyBiblioLink) }); onClose(); }}>Enregistrer</button>
      </div>
    </div>
  </div>`;
}

// ── RESSENTI JOUEUR (modal post-séance) ───────────────────────────────────────
function MuscuRessentModal({ seance, onSave, onClose }) {
  const [rpeReel, setRpeReel] = useState(seance.rpeReel || null);
  const [fatigue, setFatigue] = useState(seance.fatigue || 3);
  const [notes, setNotes] = useState(seance.notesJoueur || '');

  const RPE_LABELS = ['','Très léger','Léger','Modéré','Assez dur','Difficile','Difficile+','Très difficile','Très difficile+','Maximal','Absolu max'];
  const rpeColor = (v) => !v ? 'rgba(255,255,255,.2)' : v <= 3 ? '#4CAF50' : v <= 5 ? '#8BC34A' : v <= 7 ? '#FFB800' : v <= 8 ? '#FF7A00' : '#FF4455';

  const delta = seance.rpeCible && rpeReel ? rpeReel - seance.rpeCible : null;
  const deltaColor = delta === null ? 'rgba(255,255,255,.3)' : Math.abs(delta) <= 1 ? '#4CAF50' : Math.abs(delta) <= 2 ? '#FFB800' : '#FF4455';

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:440 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style=${{ fontSize:15, fontWeight:800 }}>Ressenti post-séance</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${seance.nom}</div>
        </div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">

        <!-- RPE cible rappel -->
        ${seance.rpeCible ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>RPE cible (coach)</div>
          <div style=${{ fontSize:22, fontWeight:800, color:rpeColor(seance.rpeCible), fontFamily:"'Barlow Condensed',sans-serif" }}>${seance.rpeCible}/10</div>
        </div>` : null}

        <!-- RPE réel joueur -->
        <div style=${{ marginBottom:18 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style=${{ fontSize:13, fontWeight:700 }}>Ton RPE réel</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${rpeReel ? RPE_LABELS[rpeReel] : 'Non renseigné'}</div>
            </div>
            <div style=${{ textAlign:'right' }}>
              <div style=${{ fontSize:28, fontWeight:800, color:rpeColor(rpeReel), fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${rpeReel ? rpeReel + '/10' : '—'}</div>
              ${delta !== null ? _h`<div style=${{ fontSize:11, color:deltaColor, fontWeight:700, marginTop:2 }}>
                ${delta > 0 ? '+' : ''}${delta} vs cible
              </div>` : null}
            </div>
          </div>
          <div style=${{ display:'flex', gap:4 }}>
            ${[1,2,3,4,5,6,7,8,9,10].map(v => _h`<button key=${v}
              onClick=${() => setRpeReel(rpeReel === v ? null : v)}
              style=${{
                flex:1, height:36, borderRadius:6, border:'none', cursor:'pointer',
                background: v === rpeReel ? rpeColor(v) : 'rgba(255,255,255,.06)',
                color: v === rpeReel ? '#fff' : 'rgba(255,255,255,.3)',
                fontWeight:800, fontSize:12, fontFamily:'Inter,sans-serif'
              }}
            >${v}</button>`)}
          </div>
          <div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Très léger</span>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Maximal</span>
          </div>
        </div>

        <!-- Fatigue -->
        <div style=${{ marginBottom:16 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <div style=${{ fontSize:13, fontWeight:700 }}>Fatigue ressentie</div>
            <div style=${{ fontSize:22, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:fatigue>=4?'#FF4455':fatigue>=3?'#FFB800':'#4CAF50' }}>${fatigue}/5</div>
          </div>
          <div style=${{ display:'flex', gap:5 }}>
            ${[1,2,3,4,5].map(v => _h`<button key=${v}
              onClick=${() => setFatigue(v)}
              style=${{
                flex:1, height:34, borderRadius:8, border:'none', cursor:'pointer',
                background: v <= fatigue ? (v>=4?'#FF4455':v>=3?'#FFB800':'#4CAF50') : 'rgba(255,255,255,.06)',
                color: v <= fatigue ? '#fff' : 'rgba(255,255,255,.3)',
                fontWeight:700, fontSize:13, fontFamily:'Inter,sans-serif'
              }}
            >${v}</button>`)}
          </div>
          <div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Très frais</span>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Épuisé</span>
          </div>
        </div>

        <!-- Notes joueur -->
        <div>
          <div class="lbl">Ton ressenti (facultatif)</div>
          <textarea class="inp" value=${notes} onInput=${e => setNotes(e.target.value)}
            placeholder="Ce que tu as ressenti, douleurs, points positifs..."
            style=${{ resize:'vertical', minHeight:55 }}></textarea>
        </div>
      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${() => {
          onSave({ rpeReel, fatigue, notesJoueur: notes, dateRessenti: localDateStr() });
          onClose();
        }}>Valider mon ressenti</button>
      </div>
    </div>
  </div>`;
}

// ── SUIVI RPE SEMAINE (graphe + tableau) ──────────────────────────────────────
function SuiviRpeView({ seances }) {
  if (!seances) return null;
  // Grouper par semaine ISO
  function getWeek(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    return 'S' + Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  }

  // Build weekly aggregates
  const weekMap = {};
  seances.forEach(s => {
    const week = getWeek(s.dateCreation) || 'Inconnue';
    if (!weekMap[week]) weekMap[week] = { sem: week, cibles: [], reels: [], fatigues: [], seances: [] };
    if (s.rpeCible) weekMap[week].cibles.push(s.rpeCible);
    if (s.rpeReel)  weekMap[week].reels.push(s.rpeReel);
    if (s.fatigue)  weekMap[week].fatigues.push(s.fatigue);
    weekMap[week].seances.push(s);
  });

  const weeks = Object.values(weekMap).sort((a, b) => a.sem.localeCompare(b.sem));
  const avg = arr => arr.length ? Math.round(arr.reduce((s,v) => s+v, 0) / arr.length * 10) / 10 : null;
  const rpeColor = (v) => !v ? 'rgba(255,255,255,.2)' : v <= 3 ? '#4CAF50' : v <= 5 ? '#8BC34A' : v <= 7 ? '#FFB800' : v <= 8 ? '#FF7A00' : '#FF4455';

  if (weeks.length === 0) return _h`<div style=${{ textAlign:'center', padding:'28px', color:'rgba(255,255,255,.25)', fontSize:13, background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.08)' }}>
    Aucune donnée. Ajoute des séances avec RPE cible et des ressentis joueur pour voir le suivi.
  </div>`;

  return _h`<div>
    <!-- Graphe barres côte à côte -->
    <div class="card" style=${{ marginBottom:16 }}>
      <div style=${{ fontSize:12, fontWeight:700, marginBottom:4 }}>RPE moyen par semaine</div>
      <div style=${{ display:'flex', gap:6, alignItems:'center', marginBottom:14 }}>
        <div style=${{ display:'flex', alignItems:'center', gap:5 }}><div style=${{ width:10, height:10, borderRadius:2, background:'#FFA420' }}></div><span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Cible (coach)</span></div>
        <div style=${{ display:'flex', alignItems:'center', gap:5 }}><div style=${{ width:10, height:10, borderRadius:2, background:'#38BDF8' }}></div><span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Réel (joueur)</span></div>
      </div>
      <div style=${{ display:'flex', gap:8, alignItems:'flex-end', height:120, overflowX:'auto' }}>
        ${weeks.map(w => {
          const c = avg(w.cibles);
          const r = avg(w.reels);
          const maxVal = 10;
          const cH = c ? Math.round(c / maxVal * 100) : 0;
          const rH = r ? Math.round(r / maxVal * 100) : 0;
          const delta = c && r ? Math.round((r - c) * 10) / 10 : null;
          const deltaColor = delta === null ? 'transparent' : Math.abs(delta) <= 1 ? '#4CAF50' : Math.abs(delta) <= 2 ? '#FFB800' : '#FF4455';
          return _h`<div key=${w.sem} style=${{ flex:1, minWidth:40, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style=${{ width:'100%', display:'flex', gap:3, alignItems:'flex-end', height:90 }}>
              ${c ? _h`<div style=${{ flex:1, height:cH+'%', background:'#FFA420', borderRadius:'3px 3px 0 0', minHeight:4 }} title=${'Cible: '+c}></div>` : _h`<div style=${{ flex:1 }}></div>`}
              ${r ? _h`<div style=${{ flex:1, height:rH+'%', background:'#38BDF8', borderRadius:'3px 3px 0 0', minHeight:4 }} title=${'Réel: '+r}></div>` : _h`<div style=${{ flex:1, background:'rgba(255,255,255,.06)', borderRadius:'3px 3px 0 0', height:'8%' }}></div>`}
            </div>
            ${delta !== null ? _h`<div style=${{ fontSize:9, color:deltaColor, fontWeight:700 }}>${delta > 0 ? '+' : ''}${delta}</div>` : _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.2)' }}>—</div>`}
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', textAlign:'center' }}>${w.sem}</div>
          </div>`;
        })}
      </div>
    </div>

    <!-- Tableau hebdomadaire -->
    <div class="card">
      <div style=${{ overflowX:'auto' }}>
        <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
          <thead><tr>
            ${['Semaine','Séances','RPE cible moy.','RPE réel moy.','Écart','Fatigue moy.'].map(h =>
              _h`<th key=${h} style=${{ padding:'8px 10px', textAlign:'left', fontSize:9, color:'rgba(255,255,255,.3)', letterSpacing:1.5, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.06)', fontWeight:500 }}>${h}</th>`
            )}
          </tr></thead>
          <tbody>
            ${weeks.map(w => {
              const c = avg(w.cibles);
              const r = avg(w.reels);
              const f = avg(w.fatigues);
              const delta = c && r ? Math.round((r - c) * 10) / 10 : null;
              const deltaColor = delta === null ? 'rgba(255,255,255,.25)' : Math.abs(delta) <= 1 ? '#4CAF50' : Math.abs(delta) <= 2 ? '#FFB800' : '#FF4455';
              return _h`<tr key=${w.sem}>
                <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontWeight:700 }}>${w.sem}</td>
                <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)', color:'rgba(255,255,255,.6)' }}>${w.seances.length}</td>
                <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  ${c ? _h`<span style=${{ fontSize:15, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif" }}>${c}</span><span style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>/10</span>` : _h`<span style=${{ color:'rgba(255,255,255,.25)' }}>—</span>`}
                </td>
                <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  ${r ? _h`<span style=${{ fontSize:15, fontWeight:800, color:rpeColor(r), fontFamily:"'Barlow Condensed',sans-serif" }}>${r}</span><span style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>/10</span>` : _h`<span style=${{ color:'rgba(255,255,255,.25)' }}>—</span>`}
                </td>
                <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  ${delta !== null ? _h`<span style=${{ fontSize:14, fontWeight:800, color:deltaColor, fontFamily:"'Barlow Condensed',sans-serif" }}>${delta > 0 ? '+' : ''}${delta}</span>` : _h`<span style=${{ color:'rgba(255,255,255,.25)' }}>—</span>`}
                </td>
                <td style=${{ padding:'10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  ${f ? _h`<span style=${{ fontSize:14, fontWeight:800, color:f>=4?'#FF4455':f>=3?'#FFB800':'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif" }}>${f}</span><span style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>/5</span>` : _h`<span style=${{ color:'rgba(255,255,255,.25)' }}>—</span>`}
                </td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ── Détection auto du mouvement (squat/bench/rdl/rowing/perso) pour lier % → 1RM enregistré ──
// Fonctions globales (utilisées par MuscuSeanceEditor côté coach ET ExerciceAvecChrono côté joueur)
function normalizeRM(s) { return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim(); }
const RM_KEYWORDS = [
  { id:'squat',  words:['squat'] },
  { id:'bench',  words:['developpe couche', 'developpe couché', 'bench press', 'dc barre'] },
  { id:'rdl',    words:['souleve de terre', 'soulevé de terre', 'deadlift', 'romanian deadlift'] },
  { id:'rowing', words:['rowing barre', 'rowing'] },
  // Mouvements au poids du corps (charge lestée en % du poids du corps)
  { id:'poids_corps', words:['traction', 'tractions', 'pull-up', 'pull up', 'chin-up', 'chin up', 'dips', 'dip', 'pompes', 'pompe', 'muscle-up', 'muscle up'] },
];
// Vérifie que "needle" apparaît comme mot entier dans "haystack", pas comme simple fragment
// d'un autre mot ou d'une autre expression (évite ex: "bench" qui matcherait "workbench").
function wholeWordIncludesRM(haystack, needle) {
  if (!needle) return false;
  const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(^|[^a-z0-9])' + esc + '($|[^a-z0-9])', 'i');
  return re.test(' ' + haystack + ' ');
}
function detectMouvementRM(exName, player) {
  const n = normalizeRM(exName);
  if (!n) return null;
  let best = null;
  RM_KEYWORDS.forEach(k => {
    k.words.forEach(w => {
      const wn = normalizeRM(w);
      if (wn && wholeWordIncludesRM(n, wn) && (!best || wn.length > best.len)) {
        best = { id: k.id, len: wn.length };
      }
    });
  });
  const custom = (player && player.customRM) || [];
  custom.forEach(c => {
    if (!c.label) return;
    const labelWords = normalizeRM(c.label).split(/\s+/).filter(w => w.length > 2);
    if (labelWords.length === 0) return;
    const allPresent = labelWords.every(w => wholeWordIncludesRM(n, w));
    const len = normalizeRM(c.label).length;
    if (allPresent && (!best || len > best.len)) best = { id: c.id, len };
  });
  return best ? best.id : null;
}
// ── Charge en % du POIDS DU CORPS (tractions/dips/pompes lestés…) ──────────────────────────
// Écrire « 20% PC » (ou « 20% poids du corps ») dans le champ charge de N'IMPORTE quel exercice
// (ou simplement « 20% » sur une traction / dips / pompes). Le poids de référence est celui du
// joueur, lié à ses pesées (onglet Poids / Composition corporelle).
function parsePctPC(chargeStr) {
  const s = (chargeStr||'').toString().trim();
  const m = s.match(/^\+?\s*(\d+(?:[.,]\d+)?)\s*%\s*(?:pc|pdc|bw|poids\s*(?:du\s*)?corps|pdcorps)\s*$/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}
function poidsCorpsJoueur(player) {
  if (!player) return null;
  const v = poidsFromMesures(player.masseMesures, parseFloat(player.poids) || 0);
  return v > 0 ? v : null;
}
function getPlayerRMValue(mvtId, player) {
  if (mvtId === 'poids_corps') return poidsCorpsJoueur(player);
  if (!mvtId || !player || !player.rmHistory || !player.rmHistory[mvtId]) return null;
  const hist = player.rmHistory[mvtId];
  if (!hist.length) return null;
  return hist[hist.length - 1].rm;
}
// Extrait un pourcentage depuis "70%", "70 %", "70" (mais pas "70kg")
function parsePctRM(chargeStr) {
  const s = (chargeStr||'').toString().trim();
  if (/kg/i.test(s)) return null;
  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*%?$/);
  if (!m) return null;
  return parseFloat(m[1].replace(',','.'));
}
// Récupère le % d'1RM d'un exercice de façon fiable : on tente d'abord de parser le texte de
// ex.charge ("75%"), mais si la séance a été dupliquée depuis un autre joueur, ce champ peut
// contenir un poids déjà figé pour CET AUTRE joueur (ex: "97.5 kg (75% de 129 kg)") — dans ce
// cas on retombe sur le % brut conservé dans chargeDetails[0].pct, qui lui ne dépend de personne.
function resolvePctRM(ex) {
  const pc = parsePctPC(ex.charge);
  if (pc != null) return pc;
  const direct = parsePctRM(ex.charge);
  if (direct != null) return direct;
  if (ex.chargeDetails && ex.chargeDetails.length > 0 && ex.chargeDetails[0].pct) {
    return ex.chargeDetails[0].pct;
  }
  return null;
}
function chargeHintRM(ex, player) {
  // « 20% PC » force la référence poids du corps, quel que soit le nom de l'exercice
  const mvtId = parsePctPC(ex.charge) != null ? 'poids_corps' : detectMouvementRM(ex.nom, player);
  const pct = resolvePctRM(ex);
  if (pct == null) return null;
  const rm = getPlayerRMValue(mvtId, player);
  if (mvtId === 'poids_corps') {
    if (!rm) return { ok:false, text: `Poids du corps non renseigné pour ${player ? player.name : 'ce joueur'} (onglet Poids / Composition)` };
    const kgPc = Math.round((rm * pct / 100) / 2.5) * 2.5;
    return { ok:true, text: `≈ +${kgPc} kg de lest  (${pct}% de ${rm} kg — poids du corps)`, kg: '+' + kgPc, pct, mvtLabel: 'poids du corps' };
  }
  const mvtLabel = (MOUVEMENTS_RM.find(m => m.id === mvtId) || (player && player.customRM || []).find(m => m.id === mvtId) || {}).label;
  if (!rm) {
    return mvtId
      ? { ok:false, text: `Pas de 1RM ${mvtLabel} enregistré pour ${player ? player.name : 'ce joueur'}` }
      : { ok:false, text: `Nom d'exercice non reconnu (squat / développé couché / soulevé de terre / rowing / mouvements personnalisés du joueur) — 1RM non lié` };
  }
  const kg = Math.round((rm * pct / 100) / 2.5) * 2.5;
  return { ok:true, text: `≈ ${kg} kg  (${pct}% de ${rm} kg — ${mvtLabel})`, kg, pct, mvtLabel };
}
// Recalcule EN DIRECT le poids d'une ligne du détail par série (chargeDetails), à partir du %
// et du 1RM ACTUEL du joueur affiché — ignore le texte figé d.charge qui peut dater de la
// création de la séance (ou avoir été dupliqué depuis un autre joueur).
function liveChargeDetailText(ex, d, player) {
  if (!d.pct) return d.charge || '';
  const mvtId = detectMouvementRM(ex.nom, player);
  const rm = getPlayerRMValue(mvtId, player);
  if (!rm) return d.pct + '% 1RM';
  const kg = Math.round((rm * d.pct / 100) / 2.5) * 2.5;
  return kg + ' kg';
}

// ── MUSCU VIEW (onglet dans PlayerDetail) ─────────────────────────────────────

// ── EXERCICE AVEC CHRONO DE REPOS ────────────────────────────────────────────
// ── Blocs de séance : un exercice avec `blocNom` ouvre un nouveau bloc (Force, Renforcement,
// Vitesse…) qui court jusqu'au prochain exercice portant un `blocNom`. Numérotation automatique.
const BLOC_COULEURS = ['#FFA420','#38BDF8','#4CAF50','#EC4899','#7C6FFF','#FF4455'];
function blocInfo(exercices, i) {
  if (!exercices || !exercices[i] || exercices[i].blocNom == null) return null;
  let n = 0;
  for (let j = 0; j <= i; j++) if (exercices[j] && exercices[j].blocNom != null) n++;
  let fin = exercices.length;
  for (let j = i + 1; j < exercices.length; j++) if (exercices[j] && exercices[j].blocNom != null) { fin = j; break; }
  return { n, nom: String(exercices[i].blocNom || '').trim(), nb: fin - i, col: BLOC_COULEURS[(n - 1) % BLOC_COULEURS.length] };
}
function blocHeaderEl(exercices, i, key) {
  const b = blocInfo(exercices, i);
  if (!b) return null;
  return _h`<div key=${key} style=${{ display:'flex', alignItems:'center', gap:10, margin:'16px 0 8px', padding:'10px 14px', borderRadius:12,
    background:b.col+'1A', border:'1px solid '+b.col+'55', borderLeft:'5px solid '+b.col }}>
    <span style=${{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800, color:b.col, letterSpacing:1 }}>BLOC ${b.n}</span>
    ${b.nom ? _h`<span style=${{ fontSize:15, fontWeight:800, textTransform:'uppercase', letterSpacing:.5 }}>${b.nom}</span>` : null}
    <span style=${{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,.45)' }}>${b.nb} exercice${b.nb>1?'s':''}</span>
  </div>`;
}

function GroupedExercicesRenderer({ exercices, seanceId, player }) {
  if (!exercices || exercices.length === 0) return null;

  const blocks = [];
  const visited = new Set();

  exercices.forEach((ex, i) => {
    if (visited.has(i)) return;

    if (ex.groupeType && ex.groupeId) {
      const groupExs = exercices.map((e, j) => ({ e, j }))
        .filter(({ e }) => e.groupeType === ex.groupeType && e.groupeId === ex.groupeId);
      const firstInGroup = groupExs[0].j;

      if (i === firstInGroup) {
        groupExs.forEach(({ j }) => visited.add(j));
        const isSuper = ex.groupeType === 'superset';
        const col = isSuper ? '#FFA420' : '#FF4455';
        const label = isSuper ? 'SUPERSET' : 'DROPSET';
        const desc = isSuper
          ? 'Enchaîner les exercices sans repos — repos uniquement à la fin du tour'
          : 'Enchaîner en réduisant la charge à chaque série, sans repos entre';
        { const bi = groupExs.map(g => g.j).find(j => exercices[j].blocNom != null); if (bi != null) blocks.push(blocHeaderEl(exercices, bi, 'bloc-'+bi)); }
        blocks.push(_h`<div key=${'grp-'+ex.groupeType+'-'+ex.groupeId+'-'+i} style=${{
          border:'2px solid '+col+'50', borderRadius:14, overflow:'hidden', marginBottom:10
        }}>
          <!-- Header du groupe -->
          <div style=${{ background:col+'20', padding:'8px 13px', borderBottom:'1px solid '+col+'30' }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
              <span style=${{ fontSize:11, fontWeight:900, color:col, letterSpacing:2 }}>${label}</span>
              <span style=${{ fontSize:9, color:col, opacity:.8, fontWeight:600 }}>${ex.groupeId}</span>
              <span style=${{ fontSize:9, color:'rgba(255,255,255,.4)', fontStyle:'italic' }}>${desc}</span>
            </div>
          </div>
          <!-- Exercices du groupe avec chrono -->
          ${groupExs.map(({ e, j }, gi) => _h`<div key=${j} style=${{
            borderBottom: gi < groupExs.length-1 ? '1px dashed '+col+'25' : 'none',
            background: gi % 2 === 0 ? col+'05' : 'transparent'
          }}>
            ${React.createElement(ExerciceAvecChrono, {
              key: seanceId+'-'+j,
              ex: e, exIndex: j, seanceId,
              groupColor: col,
              isGrouped: true,
              showConnector: gi < groupExs.length-1,
              player
            })}
          </div>`)}
        </div>`);
      }
    } else {
      visited.add(i);
      if (ex.blocNom != null) blocks.push(blocHeaderEl(exercices, i, 'bloc-'+i));
      blocks.push(React.createElement(ExerciceAvecChrono, {
        key: seanceId+'-'+i,
        ex, exIndex: i, seanceId,
        player
      }));
    }
  });

  return _h`<div>${blocks}</div>`;
}

// Libellé clair séries × reps : si les reps varient d'une série à l'autre (« 3 / 3 / 2-3 »),
// « 3 × 3 / 3 / 2-3 » est ambigu → on affiche « 3 séries » et, s'il n'y a pas de détail par
// série, les reps en petit dessous. Avec un détail par série (S1, S2…), il suffit de « N séries ».
function seriesRepsLabel(ex) {
  const reps = String(ex.reps == null ? '' : ex.reps).trim();
  const nbDet = (ex.chargeDetails || []).length;
  const varie = /\d\s*[\/;,]\s*\d/.test(reps);
  if (nbDet > 0 && (varie || !reps)) return { main: nbDet + ' série' + (nbDet > 1 ? 's' : ''), sub: '' };
  if (varie) return { main: (ex.series || nbDet || '') + ' série' + (Number(ex.series) > 1 ? 's' : ''), sub: 'reps : ' + reps.replace(/\/\s*$/, '').replace(/\s*\/\s*/g, ' · ') };
  return { main: (ex.series || '') + ' × ' + reps.replace(/\/\s*$/, ''), sub: '' };
}

function ExerciceAvecChrono({ ex, exIndex, seanceId, groupColor, isGrouped, showConnector, player }) {
  // EMOM : le champ "emomDuree" (rempli par le coach dans le champ "EMOM (min)" du formulaire)
  // contient le nombre de minutes total — PAS "series" qui reste le champ "Séries" classique
  // (souvent laissé à sa valeur par défaut). L'EMOM est un chrono qui tourne tout seul minute
  // par minute (60s fixes, par définition), pas une série qu'on valide manuellement comme en muscu.
  const totalSeries = ex.emom ? (parseInt(ex.emomDuree) || 10) : (parseInt(ex.series) || 3);
  const chargeCalc = React.useMemo(() => chargeHintRM(ex, player), [ex.nom, ex.charge, player && player.rmHistory, player && player.customRM]);
  const imgSrc = ex.imageUrl || (function(){ try { const m = findBiblioMatch(ex.biblio || ex.nom); return (m && m.imageUrl) || ''; } catch(e){ return ''; } })();

  function parseRepos(str) {
    if (!str) return 60;
    const s = String(str).toLowerCase().trim();
    // CORRECTIF : un format comme "1min30" ou "2min 15s" (minutes ET secondes, courant dans les
    // séances existantes) matchait d'abord la regex "minutes seules" ci-dessous, qui capturait le
    // "1" ou le "2" et IGNORAIT silencieusement les secondes après — le chrono démarrait donc avec
    // un temps de repos plus court que celui réellement saisi (ex: 1min30 → 60s au lieu de 90s).
    // On teste maintenant ce format composé en premier.
    const mmss = s.match(/^(\d+)\s*:\s*(\d+)$/); // "1:30"
    if (mmss) return parseInt(mmss[1]) * 60 + parseInt(mmss[2]);
    // CORRECTIF : notation "prime" très utilisée en prépa physique (1'30 = 1min30s, 2' = 2min,
    // 45'' ou 45" = 45s) n'était pas du tout reconnue — elle retombait sur le regex générique
    // "(\d+)" qui ne capturait QUE le premier nombre avant l'apostrophe (ex: "1'30" → 1 seconde
    // au lieu de 90), d'où l'écart entre le repos écrit et le chrono réellement lancé.
    const apos = s.match(/^(\d+)\s*['’]\s*(\d+)/); // "1'30", "2' 15"
    if (apos) return parseInt(apos[1]) * 60 + parseInt(apos[2]);
    const aposMin = s.match(/^(\d+)\s*['’]\s*$/); // "2'" seul = 2 minutes
    if (aposMin) return parseInt(aposMin[1]) * 60;
    const aposSec = s.match(/^(\d+)\s*(?:['’]{2}|")\s*$/); // "45''" ou "45\"" = 45 secondes
    if (aposSec) return parseInt(aposSec[1]);
    // CORRECTIF : "\w*" matchait aussi des CHIFFRES (\w = [A-Za-z0-9_]), donc sur "1min30" il
    // grignotait une partie des secondes ("3" avalé par \w*, ne laissant que "0" au groupe des
    // secondes) → 1min30 était lu comme 1min00 (60s) au lieu de 90s. "[a-z]*" ne matche que des
    // lettres et laisse les chiffres intacts pour le second groupe.
    const both = s.match(/(\d+)\s*min[a-z]*\s*(\d+)/); // "1min30", "2 min 15s", "1minute30"
    if (both) return parseInt(both[1]) * 60 + parseInt(both[2]);
    const m = s.match(/(\d+)\s*min/); // "1min", "2 min" (minutes seules)
    if (m) return parseInt(m[1]) * 60;
    const s2 = s.match(/(\d+)/); // "45s", "45sec", "45"
    if (s2) return parseInt(s2[1]);
    return 60;
  }
  const reposSec = parseRepos(ex.repos);

  // ── Séries validées conservées (appareil + Firebase) : survivent à la fermeture / au rechargement ──
  const progKey = (function(){ const c = x => String(x == null ? '' : x).replace(/[.#$\[\]\/]/g, '_'); return { pid: c(player && player.id || 'anon'), sid: c(String(seanceId || '').replace(/_(r|n)$/, '')), ix: c(exIndex) }; })();
  const progLocal = 'perfhand_prog_' + progKey.pid + '_' + progKey.sid + '_' + progKey.ix;
  const [seriesDone, setSeriesDoneRaw] = useState(() => { try { return Math.min(totalSeries, parseInt(localStorage.getItem(progLocal)) || 0); } catch (e) { return 0; } });
  function setSeriesDone(n) {
    setSeriesDoneRaw(n);
    try { localStorage.setItem(progLocal, String(n)); } catch (e) {}
    try { if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/muscuProgress/' + progKey.pid + '/' + progKey.sid + '/' + progKey.ix).set({ done: n, ts: Date.now() }).catch(() => {}); } catch (e) {}
  }
  React.useEffect(() => {
    let off = false;
    try { if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/muscuProgress/' + progKey.pid + '/' + progKey.sid + '/' + progKey.ix).once('value').then(sn => { const v = sn.val(); if (!off && v && v.done) setSeriesDoneRaw(cur => Math.max(cur, Math.min(totalSeries, parseInt(v.done) || 0))); }).catch(() => {}); } catch (e) {}
    return () => { off = true; };
  }, [progLocal]);
  const [chronoEndTs, setChronoEndTs] = useState(null); // timestamp de fin (Date.now() based)
  const [chronoTotal, setChronoTotal] = useState(0);
  const [chronoRestant, setChronoRestant] = useState(0);

  // ── Chrono EMOM dédié : tourne tout seul, minute par minute (60s), une fois démarré ──
  const [emomStartTs, setEmomStartTs] = useState(null);
  const [emomNow, setEmomNow] = useState(Date.now());

  React.useEffect(() => {
    if (!emomStartTs) return;
    function tick() { setEmomNow(Date.now()); }
    tick();
    const t = setInterval(tick, 250);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [emomStartTs]);

  const emomTotalSec = totalSeries * 60;
  const emomElapsed = emomStartTs ? Math.min(emomTotalSec, Math.floor((emomNow - emomStartTs) / 1000)) : 0;
  const emomMinuteIdx = Math.min(totalSeries - 1, Math.floor(emomElapsed / 60)); // 0-based
  const emomSecIntoMinute = emomElapsed - emomMinuteIdx * 60;
  const emomSecLeftInMinute = emomStartTs ? Math.max(0, 60 - emomSecIntoMinute) : 60;
  const emomFinished = emomStartTs && emomElapsed >= emomTotalSec;

  // Vibration à chaque nouvelle minute
  const lastMinuteRef = useRef(-1);
  React.useEffect(() => {
    if (!emomStartTs) { lastMinuteRef.current = -1; return; }
    if (emomMinuteIdx !== lastMinuteRef.current) {
      lastMinuteRef.current = emomMinuteIdx;
      if (navigator.vibrate) navigator.vibrate(emomFinished ? [200,100,200,100,200] : [150]);
    }
  }, [emomMinuteIdx, emomStartTs, emomFinished]);

  function startEmom() { setEmomStartTs(Date.now()); }
  function resetEmom() { setEmomStartTs(null); setEmomNow(Date.now()); }

  // Recalcul basé sur timestamp — résiste au backgrounding mobile (exercices classiques)
  React.useEffect(() => {
    if (!chronoEndTs) return;
    function tick() {
      const remaining = Math.max(0, Math.round((chronoEndTs - Date.now()) / 1000));
      setChronoRestant(remaining);
      if (remaining <= 0) {
        setChronoEndTs(null);
        // Vibration de fin si supportée
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }
    tick(); // tick immédiat au retour foreground
    const t = setInterval(tick, 500); // 500ms pour rattraper le retard
    // Rattraper si la page revient au premier plan
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [chronoEndTs]);

  const chronoActive = !!chronoEndTs && chronoRestant > 0;

  function validerSerie() {
    if (seriesDone >= totalSeries) return;
    const next = seriesDone + 1;
    setSeriesDone(next);
    if (next < totalSeries) {
      setChronoTotal(reposSec);
      setChronoRestant(reposSec);
      setChronoEndTs(Date.now() + reposSec * 1000);
    }
  }

  function stopChrono() { setChronoEndTs(null); setChronoRestant(0); }

  const pct = chronoTotal > 0 ? chronoRestant / chronoTotal : 0;
  const mins = Math.floor(chronoRestant / 60);
  const secs = chronoRestant % 60;
  const timeStr = mins > 0 ? mins + ":" + String(secs).padStart(2, "0") : secs + "s";
  const allDone = ex.emom ? emomFinished : seriesDone >= totalSeries;
  const chronoColor = pct > 0.5 ? "#4CAF50" : pct > 0.25 ? "#FFB800" : "#FF4455";
  const emomColor = emomSecLeftInMinute > 30 ? "#4CAF50" : emomSecLeftInMinute > 10 ? "#FFB800" : "#FF4455";

  return _h`<div style=${{
    padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,.04)",
    background: allDone ? "rgba(76,175,80,.04)" : (chronoActive || emomStartTs) ? "rgba(56,189,248,.04)" : "transparent",
    borderRadius:8, marginBottom:2, transition:"background .3s"
  }}>
    <div style=${{ display:"grid", gridTemplateColumns: ex.emom ? "1fr" : "1fr auto", gap:8, alignItems:"center",
      marginBottom: (chronoActive || allDone || (ex.emom && emomStartTs)) ? 10 : 0 }}>
      <div style=${{ display:"flex", gap:10, alignItems:"flex-start", flex:1 }}>
        ${imgSrc ? _h`<${ZoomableImage} src=${imgSrc} alt=${ex.nom}
          style=${{ width:54, height:54, objectFit:"cover", borderRadius:8,
            border:"1px solid rgba(255,255,255,.12)", flexShrink:0,
            opacity: allDone ? 0.4 : 1 }}
          onError=${e => e.target.style.display='none'} />` : null}
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:13, fontWeight:600,
            color: allDone ? "rgba(255,255,255,.4)" : "#fff",
            textDecoration: allDone ? "line-through" : "none", transition:"all .2s",
            display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            ${ex.nom}
            ${ex.emom ? _h`<span style=${{ fontSize:9, padding:'2px 7px', borderRadius:20, fontWeight:800, background:'rgba(56,189,248,.15)', color:'#38BDF8' }}>⏱ EMOM</span>` : null}
            ${React.createElement(BiblioLinkButton, { nomExercice: ex.biblio || ex.nom })}
          </div>
          <div style=${{ display:"flex", gap:10, marginTop:3, flexWrap:"wrap" }}>
            ${ex.emom
              ? _h`<span style=${{ fontSize:11, color:"rgba(255,255,255,.4)" }}>${totalSeries} min · ${ex.reps} reps/min</span>`
              : _h`<span style=${{ fontSize:18, lineHeight:1.1, color:'#fff', fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, padding:'2px 9px' }}>${seriesRepsLabel(ex).main}</span>${seriesRepsLabel(ex).sub ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.55)' }}>${seriesRepsLabel(ex).sub}</span>` : null}`}
            <span style=${{ fontSize:11, color:"#38BDF8", fontWeight:600 }}>${chargeCalc ? (chargeCalc.ok ? chargeCalc.kg + ' kg' : ex.charge) : ex.charge}</span>
            ${ex.rir ? _h`<span style=${{ fontSize:11, color:"#FFA420", fontWeight:600 }}>RIR ${ex.rir}</span>` : null}
            ${!ex.emom ? _h`<span style=${{ fontSize:11, color:"rgba(255,255,255,.3)" }}>⏱ ${ex.repos}</span>` : null}
          </div>
          ${chargeCalc && chargeCalc.ok ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:2 }}>${chargeCalc.pct}% de ${player && player.name ? player.name+' — ' : ''}${chargeCalc.mvtLabel}</div>` : null}
          ${ex.notes ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:6, lineHeight:1.5, background:'rgba(255,164,32,.06)', borderLeft:'3px solid rgba(255,164,32,.5)', borderRadius:6, padding:'5px 9px', whiteSpace:'pre-wrap' }}>💡 ${ex.notes}</div>` : null}
          ${ex.chargeDetails && ex.chargeDetails.length > 0 ? _h`<div style=${{ marginTop:8, background:'rgba(56,189,248,.05)', border:'1px solid rgba(56,189,248,.12)', borderRadius:8, padding:'6px 10px', overflow:'hidden' }}>
            ${ex.chargeDetails.map((d, di) => {
              // Poids recalculé EN DIRECT à partir du % et du 1RM actuel du joueur affiché — jamais
              // le texte d.charge figé (qui peut dater d'une séance dupliquée depuis un autre joueur).
              const chargeShort = liveChargeDetailText(ex, d, player);
              return _h`<div key=${di} style=${{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', padding:'3px 0', borderBottom: di < ex.chargeDetails.length-1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)', minWidth:20, flexShrink:0 }}>S${d.serie}</span>
                <span style=${{ fontSize:12, fontWeight:800, minWidth:24, flexShrink:0 }}>${d.reps}${d.amrap?' 🔥':''}</span>
                <span style=${{ fontSize:12, fontWeight:800, color: d.serie===seriesDone+1 ? '#FFA420' : '#38BDF8', flexShrink:0 }}>${chargeShort}</span>
                ${d.pct ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.25)', flexShrink:0 }}>@ ${d.pct}%</span>` : null}
                ${d.note ? _h`<span style=${{ fontSize:9, color:'rgba(255,255,255,.2)', marginLeft:'auto', textAlign:'right', maxWidth:'100%' }}>${d.note}</span>` : null}
              </div>`;
            })}
          </div>` : null}
        </div>
      </div>
      ${!ex.emom ? _h`<div style=${{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end", maxWidth:150 }}>
        ${Array.from({length: totalSeries}, (_, i) => {
          const done = i < seriesDone;
          const isCurrent = i === seriesDone;
          return _h`<button key=${i}
            onClick=${(isCurrent && !chronoActive) ? validerSerie : undefined}
            disabled=${done || (chronoActive && isCurrent) || (!isCurrent && !done)}
            style=${{
              width:26, height:26, borderRadius:"50%", flexShrink:0,
              border:"2px solid " + (done ? "#4CAF50" : isCurrent ? "#FFA420" : "rgba(255,255,255,.15)"),
              background: done ? "rgba(76,175,80,.2)" : (isCurrent && !chronoActive) ? "rgba(255,164,32,.15)" : "rgba(255,255,255,.04)",
              color: done ? "#4CAF50" : isCurrent ? "#FFA420" : "rgba(255,255,255,.25)",
              fontSize:10, fontWeight:800,
              cursor: (isCurrent && !chronoActive) ? "pointer" : "default",
              fontFamily:"Inter,sans-serif", transition:"all .2s",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
            ${done ? "✓" : i + 1}
          </button>`;
        })}
      </div>` : null}
    </div>

    ${ex.emom ? _h`<div>
      ${!emomStartTs ? _h`<button onClick=${startEmom}
          style=${{ width:'100%', padding:'12px', borderRadius:10, background:'rgba(56,189,248,.12)',
            border:'1px solid rgba(56,189,248,.35)', color:'#38BDF8', fontWeight:800, fontSize:13,
            cursor:'pointer', fontFamily:"Inter,sans-serif" }}>
          ▶ Démarrer l'EMOM (${totalSeries} min)
        </button>`
      : emomFinished ? _h`<div style=${{ fontSize:11, color:"#4CAF50", fontWeight:700, textAlign:"center", padding:"4px 0" }}>
          ✅ EMOM terminé — ${totalSeries}/${totalSeries} min
        </div>`
      : _h`<div style=${{ background:"rgba(56,189,248,.08)", border:"1px solid rgba(56,189,248,.2)", borderRadius:10, padding:"10px 14px" }}>
          <div style=${{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style=${{ fontSize:11, color:"rgba(255,255,255,.5)", fontWeight:600 }}>Minute ${emomMinuteIdx + 1} / ${totalSeries}</div>
            <button onClick=${resetEmom}
              style=${{ background:"rgba(255,68,85,.12)", border:"1px solid rgba(255,68,85,.2)", color:"#FF4455",
                borderRadius:7, padding:"3px 10px", cursor:"pointer", fontSize:11, fontFamily:"Inter,sans-serif" }}>
              Arrêter
            </button>
          </div>
          <div style=${{ height:4, background:"rgba(255,255,255,.07)", borderRadius:2, marginBottom:8, overflow:"hidden" }}>
            <div style=${{ height:"100%", borderRadius:2, background:emomColor,
              width:(emomSecLeftInMinute/60*100)+"%", transition:"width 1s linear, background .5s" }}></div>
          </div>
          <div style=${{ fontSize:32, fontWeight:800, color:emomColor,
            fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1, textAlign:"center", letterSpacing:1 }}>
            ${emomSecLeftInMinute}s
          </div>
          <div style=${{ fontSize:10, color:"rgba(255,255,255,.3)", textAlign:"center", marginTop:4 }}>
            ${ex.reps} reps, puis récupère jusqu'à la fin de la minute
          </div>
        </div>`}
    </div>` : null}

    ${!ex.emom && chronoActive && _h`<div style=${{ background:"rgba(56,189,248,.08)", border:"1px solid rgba(56,189,248,.2)", borderRadius:10, padding:"10px 14px" }}>
      <div style=${{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style=${{ fontSize:11, color:"rgba(255,255,255,.5)", fontWeight:600 }}>REPOS — Série ${seriesDone} terminée</div>
        <button onClick=${stopChrono}
          style=${{ background:"rgba(255,68,85,.12)", border:"1px solid rgba(255,68,85,.2)", color:"#FF4455",
            borderRadius:7, padding:"3px 10px", cursor:"pointer", fontSize:11, fontFamily:"Inter,sans-serif" }}>
          Passer
        </button>
      </div>
      <div style=${{ height:4, background:"rgba(255,255,255,.07)", borderRadius:2, marginBottom:8, overflow:"hidden" }}>
        <div style=${{ height:"100%", borderRadius:2, background:chronoColor,
          width:(pct*100)+"%", transition:"width 1s linear, background .5s" }}></div>
      </div>
      <div style=${{ fontSize:32, fontWeight:800, color:chronoColor,
        fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1, textAlign:"center", letterSpacing:1 }}>
        ${timeStr}
      </div>
      <div style=${{ fontSize:10, color:"rgba(255,255,255,.3)", textAlign:"center", marginTop:4 }}>
        Prochaine série dans...
      </div>
    </div>`}

    ${!ex.emom && allDone && _h`<div style=${{ fontSize:11, color:"#4CAF50", fontWeight:700, textAlign:"center", padding:"4px 0" }}>
      ✅ Exercice terminé — ${totalSeries}/${totalSeries} séries
    </div>`}
  </div>`;
}
