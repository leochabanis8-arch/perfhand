


function EditProfileModal({ p, onSave, onClose }) {
  const SC_OPTIONS = [
    { key:'ok',        label:'Disponible',  color:'#4CAF50' },
    { key:'blesse',    label:'Blesse',      color:'#FF4455' },
    { key:'surveille', label:'Surveillance',color:'#FF7A00' },
    { key:'repos',     label:'Repos',       color:'#FFB800' },
  ];
  const [form, setForm] = useState({
    name:     p.name,
    pos:      p.pos,
    num:      String(p.num),
    age:      String(p.age),
    poids:    String(p.poids),
    taille:   String(p.taille),
    status:   p.status,
    nutrition: p.nutrition,
    notes:    p.notes || '',
    stress:   p.stress,
    motivation: p.motivation,
    focus:    p.focus,
    confiance: p.confiance,
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style=${{ fontSize:15, fontWeight:800 }}>Modifier le profil</div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">

        <!-- Statut -->
        <div class="field-group">
          <div class="lbl">Statut</div>
          <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
            ${SC_OPTIONS.map(s => _h`<button key=${s.key}
              class=${'status-btn' + (form.status === s.key ? ' active' : '')}
              onClick=${() => upd('status', s.key)}
              style=${{ borderColor: form.status === s.key ? s.color : 'rgba(255,255,255,.1)', color: form.status === s.key ? s.color : 'rgba(255,255,255,.5)', background: form.status === s.key ? s.color + '14' : 'rgba(255,255,255,.04)' }}
            >${s.label}</button>`)}
          </div>
        </div>

        <!-- Infos de base -->
        <div class="edit-row">
          <div class="field-group">
            <div class="lbl">Nom complet</div>
            <input class="inp" value=${form.name} onInput=${e => upd('name', e.target.value)} />
          </div>
        </div>
        <div class="edit-row">
          <div class="field-group">
            <div class="lbl">Poste</div>
            <select class="inp" value=${form.pos} onChange=${e => upd('pos', e.target.value)}>
              ${POSTES_HANDBALL.map(pos => _h`<option key=${pos} value=${pos}>${pos}</option>`)}
            </select>
          </div>
          <div class="field-group">
            <div class="lbl">Numero</div>
            <input class="inp" type="number" value=${form.num} onInput=${e => upd('num', e.target.value)} />
          </div>
        </div>
        <div class="edit-row">
          <div class="field-group">
            <div class="lbl">Age</div>
            <input class="inp" type="number" value=${form.age} onInput=${e => upd('age', e.target.value)} />
          </div>
          <div class="field-group">
            <div class="lbl">Poids (kg)</div>
            <input class="inp" type="number" value=${form.poids} onInput=${e => upd('poids', e.target.value)} />
          </div>
          <div class="field-group">
            <div class="lbl">Taille (cm)</div>
            <input class="inp" type="number" value=${form.taille} onInput=${e => upd('taille', e.target.value)} />
          </div>
        </div>
        <div class="edit-row">
          <div class="field-group">
            <div class="lbl">Genre</div>
            <div style=${{ display:'flex', gap:8 }}>
              ${['M','F'].map(g => _h`<button key=${g}
                onClick=${e => { e.preventDefault(); upd('genre', g); }}
                style=${{
                  flex:1, padding:'8px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:700,
                  border: (form.genre||'M')===g ? '2px solid '+(g==='F'?'#FF6B9D':'#38BDF8') : '1px solid rgba(255,255,255,.1)',
                  background: (form.genre||'M')===g ? (g==='F'?'rgba(255,107,157,.12)':'rgba(56,189,248,.1)') : 'rgba(255,255,255,.03)',
                  color: (form.genre||'M')===g ? (g==='F'?'#FF6B9D':'#38BDF8') : 'rgba(255,255,255,.4)'
                }}>${g==='M'?'♂ Homme':'♀ Femme'}</button>`)}
            </div>
          </div>
        </div>

        <!-- Phase nutrition -->
        <div class="field-group">
          <div class="lbl">Phase nutritionnelle</div>
          <select class="inp" value=${form.nutrition} onChange=${e => upd('nutrition', e.target.value)}>
            ${Object.entries(PLANS_NUT).map(([k,v]) => _h`<option key=${k} value=${k}>${v.label}</option>`)}
          </select>
        </div>

        <!-- Profil mental -->
        <div class="field-group">
          <div class="lbl">Profil mental (1-5)</div>
          <div style=${{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            ${[['stress','Stress',form.stress],['motivation','Motivation',form.motivation],['focus','Focus',form.focus],['confiance','Confiance',form.confiance]].map(([k,l,v]) =>
              _h`<div key=${k}>
                <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:4 }}>${l}</div>
                <div style=${{ display:'flex', gap:4 }}>
                  ${[[1,'😟'],[2,'😐'],[3,'😊']].map(([n,emoji]) => _h`<button key=${n}
                    onClick=${() => upd(k, n)}
                    style=${{ flex:1, height:32, borderRadius:8, border: n===v?'2px solid #FFA420':'1px solid rgba(255,255,255,.08)',
                      background: n===v?'rgba(255,164,32,.15)':'rgba(255,255,255,.04)',
                      cursor:'pointer', fontSize:16 }}
                  >${emoji}</button>`)}
                </div>
              </div>`
            )}
          </div>
        </div>

        <!-- Message coach -->
        <div class="field-group">
          <div class="lbl">Message coach</div>
          <textarea class="inp" value=${form.notes} onInput=${e => upd('notes', e.target.value)} placeholder="Message visible par le joueur..." style=${{ resize:'vertical', minHeight:60 }}></textarea>
        </div>

      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${() => {
          onSave({
            name: form.name,
            pos:  form.pos,
            num:  parseInt(form.num) || p.num,
            age:  parseInt(form.age) || p.age,
            poids: parseFloat(form.poids) || p.poids,
            taille: parseInt(form.taille) || p.taille,
            status: form.status,
            nutrition: form.nutrition,
            notes: form.notes,
            stress: form.stress,
            motivation: form.motivation,
            focus: form.focus,
            confiance: form.confiance,
          });
          onClose();
        }}>Enregistrer</button>
      </div>
    </div>
  </div>`;
}

// ── EDIT BLESSURE MODAL ───────────────────────────────────────────────────────
function EditBlessureModal({ p, onSave, onClose }) {
  const [blessures, setBlessures] = useState(
    JSON.parse(JSON.stringify(p.blessures || []))
  );

  function updB(i, k, v) {
    setBlessures(bs => bs.map((b, idx) => idx === i ? { ...b, [k]: v } : b));
  }
  function addB() {
    setBlessures(bs => [...bs, {
      zone: '', type: '', dateDebut: localDateStr(),
      statut: 'en cours', protocole: '',
      etapes: ['Repos','Reprise progressive','Retour complet'], etapeActuelle: 0
    }]);
  }
  function delB(i) { setBlessures(bs => bs.filter((_,idx) => idx !== i)); }
  function updEtape(bi, ei, v) {
    setBlessures(bs => bs.map((b, idx) => {
      if (idx !== bi) return b;
      const etapes = [...b.etapes];
      etapes[ei] = v;
      return { ...b, etapes };
    }));
  }
  function advEtape(bi) {
    setBlessures(bs => bs.map((b, idx) => {
      if (idx !== bi) return b;
      return { ...b, etapeActuelle: Math.min(b.etapeActuelle + 1, (b.etapes || []).length - 1) };
    }));
  }

  const STATUTS = ['en cours','surveillance','termine','gueri'];

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style=${{ fontSize:15, fontWeight:800 }}>Gestion des blessures — ${p.name}</div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">
        ${blessures.length === 0
          ? _h`<div style=${{ textAlign:'center', padding:'24px', color:'rgba(255,255,255,.3)', fontSize:13 }}>Aucune blessure enregistree</div>`
          : blessures.map((b, i) => {
            const sC = b.statut === 'en cours' ? '#FF4455' : b.statut === 'surveillance' ? '#FF7A00' : b.statut === 'termine' ? '#38BDF8' : '#4CAF50';
            return _h`<div key=${i} class="proto-block" style=${{ borderColor: sC + '30' }}>
              <div class="proto-block-header">
                <div style=${{ fontSize:13, fontWeight:700, color:sC }}>${b.zone || 'Blessure ' + (i+1)}</div>
                <button class="del-btn" onClick=${() => delB(i)}>Supprimer</button>
              </div>
              <div class="edit-row">
                <div class="field-group">
                  <div class="lbl">Zone</div>
                  <input class="inp" value=${b.zone} onInput=${e => updB(i,'zone',e.target.value)} placeholder="Ex: Genou gauche" />
                </div>
                <div class="field-group">
                  <div class="lbl">Type</div>
                  <input class="inp" value=${b.type} onInput=${e => updB(i,'type',e.target.value)} placeholder="Ex: Entorse" />
                </div>
              </div>
              <div class="edit-row">
                <div class="field-group">
                  <div class="lbl">Date debut</div>
                  <input class="inp" type="date" value=${b.dateDebut} onInput=${e => updB(i,'dateDebut',e.target.value)} />
                </div>
                <div class="field-group">
                  <div class="lbl">Statut</div>
                  <select class="inp" value=${b.statut} onChange=${e => updB(i,'statut',e.target.value)}>
                    ${STATUTS.map(s => _h`<option key=${s} value=${s}>${s}</option>`)}
                  </select>
                </div>
              </div>
              <div class="field-group">
                <div class="lbl">Protocole</div>
                <textarea class="inp" value=${b.protocole} onInput=${e => updB(i,'protocole',e.target.value)} style=${{ resize:'vertical', minHeight:50 }} placeholder="Description du protocole..." />
              </div>
              ${b.etapes && _h`<div class="field-group">
                <div class="lbl">Etapes de reprise — etape actuelle: ${b.etapeActuelle + 1}/${b.etapes.length}</div>
                ${b.etapes.map((e, ei) => _h`<div key=${ei} style=${{ display:'flex', gap:8, alignItems:'center', marginBottom:5 }}>
                  <div style=${{ width:22, height:22, borderRadius:'50%', background: ei < b.etapeActuelle ? '#4CAF50' : ei === b.etapeActuelle ? '#FFA420' : 'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color: ei <= b.etapeActuelle ? '#000' : 'rgba(255,255,255,.4)', flexShrink:0 }}>${ei < b.etapeActuelle ? '✓' : ei + 1}</div>
                  <input class="inp" value=${e} onInput=${ev => updEtape(i, ei, ev.target.value)} style=${{ flex:1 }} />
                </div>`)}
                <button class="add-btn" onClick=${() => advEtape(i)} disabled=${b.etapeActuelle >= b.etapes.length - 1}
                  style=${{ opacity: b.etapeActuelle >= b.etapes.length - 1 ? 0.4 : 1 }}
                >→ Passer a l'etape suivante</button>
              </div>`}
            </div>`;
          })
        }
        <button class="add-btn" onClick=${addB}>+ Ajouter une blessure</button>
      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${() => { onSave(blessures); onClose(); }}>Enregistrer</button>
      </div>
    </div>
  </div>`;
}

// ── PROTOCOL EDITOR ───────────────────────────────────────────────────────────
function ProtocolEditor({ p, onSave, onClose }) {
  // Protocol = liste de seances avec exercices, series, reps, charge
  const initProtocol = p.protocol || [
    {
      nom: 'Seance A',
      exercices: [
        { nom: 'Squat', series: 4, reps: '6-8', charge: '75%', repos: '2min', notes: '' },
        { nom: 'Fentes', series: 3, reps: '10', charge: '60%', repos: '90s', notes: '' },
      ]
    }
  ];
  const [seances, setSeances] = useState(JSON.parse(JSON.stringify(initProtocol)));

  function updSeance(si, k, v) { setSeances(ss => ss.map((s,i) => i===si ? {...s,[k]:v} : s)); }
  function addSeance() { setSeances(ss => [...ss, { nom:'Seance ' + (ss.length+1), exercices:[] }]); }
  function delSeance(si) { setSeances(ss => ss.filter((_,i) => i!==si)); }
  function updEx(si, ei, k, v) {
    setSeances(ss => ss.map((s,i) => i!==si ? s : {
      ...s, exercices: s.exercices.map((e,j) => j!==ei ? e : {...e,[k]:v})
    }));
  }
  function addEx(si) {
    setSeances(ss => ss.map((s,i) => i!==si ? s : {
      ...s, exercices: [...s.exercices, { nom:'', series:3, reps:'8-10', charge:'70%', repos:'90s', notes:'' }]
    }));
  }
  function delEx(si, ei) {
    setSeances(ss => ss.map((s,i) => i!==si ? s : {
      ...s, exercices: s.exercices.filter((_,j) => j!==ei)
    }));
  }

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:600 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style=${{ fontSize:15, fontWeight:800 }}>Protocole d'entrainement</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${p.name}</div>
        </div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">
        ${seances.map((s, si) => _h`<div key=${si} class="proto-block">
          <div class="proto-block-header">
            <input class="inp" value=${s.nom} onInput=${e => updSeance(si,'nom',e.target.value)} style=${{ fontSize:13, fontWeight:700, flex:1, marginRight:8 }} placeholder="Nom de la seance" />
            <button class="del-btn" onClick=${() => delSeance(si)}>×</button>
          </div>

          <!-- Header colonnes -->
          <div style=${{ display:'grid', gridTemplateColumns:'1fr 52px 62px 70px 60px auto', gap:6, marginBottom:6, padding:'0 2px' }}>
            ${['Exercice','Series','Reps','Charge','Repos',''].map(h => _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1 }}>${h}</div>`)}
          </div>

          ${s.exercices.map((ex, ei) => _h`<div key=${ei} class="ex-row" style=${{ display:'grid', gridTemplateColumns:'1fr 52px 62px 70px 60px auto', gap:6, alignItems:'center' }}>
            <input class="ex-inp" value=${ex.nom} onInput=${e => updEx(si,ei,'nom',e.target.value)} style=${{ textAlign:'left', width:'100%' }} placeholder="Exercice" />
            <input class="ex-inp" type="number" value=${ex.series} onInput=${e => updEx(si,ei,'series',e.target.value)} style=${{ width:'100%' }} />
            <input class="ex-inp" value=${ex.reps} onInput=${e => updEx(si,ei,'reps',e.target.value)} style=${{ width:'100%' }} placeholder="8-10" />
            <input class="ex-inp" value=${ex.charge} onInput=${e => updEx(si,ei,'charge',e.target.value)} style=${{ width:'100%' }} placeholder="75%" />
            <input class="ex-inp" value=${ex.repos} onInput=${e => updEx(si,ei,'repos',e.target.value)} style=${{ width:'100%' }} placeholder="90s" />
            <button class="del-btn" onClick=${() => delEx(si,ei)} style=${{ padding:'4px 7px' }}>×</button>
          </div>`)}

          <button class="add-btn" onClick=${() => addEx(si)}>+ Ajouter un exercice</button>
        </div>`)}

        <button class="add-btn" onClick=${addSeance} style=${{ marginTop:4 }}>+ Ajouter une seance</button>
      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${() => { onSave(seances); onClose(); }}>Enregistrer</button>
      </div>
    </div>
  </div>`;
}
