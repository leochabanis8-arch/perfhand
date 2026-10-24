
// ── Profils supprimés : liste noire (appareil + Firebase) pour qu'ils ne reviennent jamais ──
// Avant : supprimer un profil individuel ne l'effaçait pas de Firebase, et les profils d'exemple
// étaient réinjectés au chargement → le profil réapparaissait à chaque ouverture.
function getDeletedProfileIds() {
  try { const v = JSON.parse(localStorage.getItem('perfhand_deleted_profiles') || '[]'); return Array.isArray(v) ? v : []; } catch(e) { return []; }
}
function addDeletedProfileIds(ids) {
  try {
    const cur = new Set(getDeletedProfileIds());
    (ids || []).forEach(i => { if (i) cur.add(String(i)); });
    localStorage.setItem('perfhand_deleted_profiles', JSON.stringify([...cur]));
  } catch(e) {}
}
function markProfileDeleted(id) {
  if (!id) return;
  addDeletedProfileIds([id]);
  if (window.__perfhand_db) {
    try { window.__perfhand_db.ref('perfhand/deletedProfiles/' + id).set(Date.now()).catch(() => {}); } catch(e) {}
    try { window.__perfhand_db.ref('perfhand/playersPerso/' + id).remove().catch(() => {}); } catch(e) {}
    try { window.__perfhand_db.ref('perfhand/playerProfiles/' + id).remove().catch(() => {}); } catch(e) {}
  }
}
function sansProfilsSupprimes(list) {
  const del = new Set(getDeletedProfileIds());
  return (list || []).filter(p => p && !del.has(String(p.id)));
}

// ── Lien poids de la fiche joueur ↔ pesées (onglet Poids équipe / Composition corporelle) ──
// Le poids affiché partout (fiche, hydratation, W/kg…) = dernière pesée par DATE ; et modifier
// le poids de la fiche crée/met à jour la pesée du jour : une seule source de vérité.
function poidsFromMesures(list, fallback) {
  const arr = Array.isArray(list) ? list : (list && typeof list === 'object' ? Object.values(list) : []);
  const v = arr.filter(m => m && parseFloat(m.poids) > 0).sort((x, y) => String(x.date || '').localeCompare(String(y.date || '')));
  return v.length ? parseFloat(v[v.length - 1].poids) : fallback;
}
function mesuresAvecPoids(p, nouveauPoids) {
  const base = Array.isArray(p.masseMesures) ? p.masseMesures : (p.masseMesures && typeof p.masseMesures === 'object' ? Object.values(p.masseMesures) : []);
  const today = localDateStr();
  const val = String(nouveauPoids);
  if (base.some(m => m && m.date === today)) return base.map(m => (m && m.date === today) ? { ...m, poids: val } : m);
  return [...base, { id: Date.now().toString() + '_profil', date: today, poids: val, masseGrasse:'', masseMusc:'', tour_hanches:'', tour_epaule:'', tour_cuisse:'', notes:'' }];
}
// Renvoie les mises à jour à appliquer si le poids de la fiche a réellement changé (sinon updates inchangé)
function lierPoidsProfil(player, updates) {
  if (!updates || updates.poids === undefined || !(parseFloat(updates.poids) > 0)) return updates;
  const courant = poidsFromMesures(player.masseMesures, parseFloat(player.poids) || 0);
  if (Math.abs(parseFloat(updates.poids) - courant) < 0.05) return updates;
  return { ...updates, masseMesures: mesuresAvecPoids(player, updates.poids) };
}

function sanitizeProfile(p) {
  if (!p||typeof p!=='object') return null;
  var n=function(v){return typeof v==='number'?v:(parseFloat(v)||0);};
  var s=function(v){return (!v||typeof v==='object')?'':''+v;};
  var a=function(v){return Array.isArray(v)?v:(v&&typeof v==='object'?Object.values(v):[]);};
  var st=(p.stats&&typeof p.stats==='object')?p.stats:{};
  return {id:s(p.id),clubId:s(p.clubId),clubIdsExtra:a(p.clubIdsExtra).map(s),name:s(p.name),pos:s(p.pos),num:n(p.num),poids:poidsFromMesures(a(p.masseMesures),n(p.poids)),taille:n(p.taille),age:n(p.age),status:s(p.status)||'ok',notes:s(p.notes),nutrition:s(p.nutrition)||'competition',objectif:s(p.objectif),sport:s(p.sport),poste:s(p.poste),email:s(p.email),genre:s(p.genre),exportDate:s(p.exportDate),notesMental:s(p.notesMental),dateNaissance:s(p.dateNaissance),stress:n(p.stress),motivation:n(p.motivation),focus:n(p.focus),confiance:n(p.confiance),stats:{sessions:n(st.sessions),absences:n(st.absences),chargeWeek:n(st.chargeWeek),wellness:n(st.wellness)},blessures:a(p.blessures),tests:a(p.tests),muscuSeances:a(p.muscuSeances),enduranceSeances:a(p.enduranceSeances),bilans:a(p.bilans),bilansSem:a(p.bilansSem),rmHistory:(p.rmHistory&&typeof p.rmHistory==='object'&&!Array.isArray(p.rmHistory))?p.rmHistory:{},masseMesures:a(p.masseMesures),cycles:a(p.cycles),gpsActivites:a(p.gpsActivites),ressourcesAssignees:a(p.ressourcesAssignees),planif:(p.planif&&typeof p.planif==='object')?p.planif:null,wellnessQuestionnaire:(p.wellnessQuestionnaire&&typeof p.wellnessQuestionnaire==='object')?p.wellnessQuestionnaire:null,wellnessCheckins:a(p.wellnessCheckins),protocol:a(p.protocol),archived:!!p.archived,archivedDate:s(p.archivedDate),customRM:a(p.customRM),testsEndurance:a(p.testsEndurance),journal:(p.journal&&typeof p.journal==='object'&&!Array.isArray(p.journal))?p.journal:{},hydratation:(p.hydratation&&typeof p.hydratation==='object'&&!Array.isArray(p.hydratation))?p.hydratation:{}};
}

function BlessuresPersoTab({ player, savePlayer }) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [editIdx, setEditIdx] = React.useState(null);
  const [form, setForm] = React.useState({ zone:'Épaule', type:'Douleur', statut:'en cours', dateDebut: localDateStr(), protocole:'', notes:'' });

  const blessures = player.blessures || [];
  const actives   = blessures.filter(b => b.statut === 'en cours' || b.statut === 'surveillance');
  const historique = blessures.filter(b => b.statut !== 'en cours' && b.statut !== 'surveillance');

  function openAdd() { setForm({ zone:'Épaule', type:'Douleur', statut:'en cours', dateDebut: localDateStr(), protocole:'', notes:'' }); setEditIdx(null); setShowAdd(true); }
  function openEdit(i) { setForm({ ...blessures[i] }); setEditIdx(i); setShowAdd(true); }
  function save() {
    const updated = editIdx !== null
      ? blessures.map((b, i) => i === editIdx ? { ...form } : b)
      : [...blessures, { ...form, id: Date.now().toString() }];
    savePlayer({ blessures: updated });
    setShowAdd(false);
  }
  function del(i) {
    if (!confirm('Supprimer cette blessure ?')) return;
    savePlayer({ blessures: blessures.filter((_, j) => j !== i) });
  }

  const sColor = s => ({ 'en cours':'#FF4455', 'surveillance':'#FFB800', 'terminé':'#4CAF50', 'chronique':'#FF7A00', 'gueri':'#4CAF50' }[s] || '#FFA420');

  const renderCard = (b, i) => {
    const col = sColor(b.statut);
    return _h`<div key=${i} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid '+col+'25', borderRadius:12, padding:'13px 16px', marginBottom:8 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style=${{ flex:1 }}>
          <div style=${{ fontSize:13, fontWeight:700 }}>${b.zone} — ${b.type}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>
            Début : ${b.dateDebut||'?'}${b.dateGueri ? ' · Fin : '+b.dateGueri : ''}
          </div>
        </div>
        <div style=${{ display:'flex', gap:6, alignItems:'center' }}>
          <div style=${{ fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:700, background:col+'15', color:col }}>${b.statut.toUpperCase()}</div>
          <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.1)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', padding:'3px 8px' }} onClick=${() => openEdit(i)}>✏️</button>
          <button class="btn btn-sm btn-danger" style=${{ padding:'3px 8px' }} onClick=${() => del(i)}>×</button>
        </div>
      </div>
      ${b.protocole ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', background:'rgba(255,255,255,.03)', borderRadius:8, padding:'7px 10px', marginTop:8 }}>${b.protocole}</div>` : null}
      ${b.notes ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:6, fontStyle:'italic' }}>📝 ${b.notes}</div>` : null}
    </div>`;
  };

  return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <div style=${{ fontSize:14, fontWeight:700 }}>Blessures & Suivi médical</div>
      <button class="btn btn-primary btn-sm" onClick=${openAdd}>+ Ajouter</button>
    </div>

    ${showAdd ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginBottom:16 }}>
      <div style=${{ fontSize:13, fontWeight:700, marginBottom:12 }}>${editIdx !== null ? 'Modifier la blessure' : 'Nouvelle blessure'}</div>
      <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        <div><div class="lbl">Zone</div>
          <select class="inp" value=${form.zone} onChange=${e=>setForm(f=>({...f,zone:e.target.value}))}>
            ${['Épaule','Genou','Cheville','Coude','Poignet','Hanche','Dos','Cuisse','Mollet','Autre'].map(z=>_h`<option key=${z}>${z}</option>`)}
          </select></div>
        <div><div class="lbl">Type</div>
          <select class="inp" value=${form.type} onChange=${e=>setForm(f=>({...f,type:e.target.value}))}>
            ${['Douleur','Tendinopathie','Entorse','Déchirure','Fracture','Contusion','Post-chirurgie','Autre'].map(t=>_h`<option key=${t}>${t}</option>`)}
          </select></div>
        <div><div class="lbl">Statut</div>
          <select class="inp" value=${form.statut} onChange=${e=>setForm(f=>({...f,statut:e.target.value}))}>
            ${['en cours','surveillance','gueri','chronique'].map(s=>_h`<option key=${s} value=${s}>${s}</option>`)}
          </select></div>
        <div><div class="lbl">Date début</div><input class="inp" type="date" value=${form.dateDebut||''} onInput=${e=>setForm(f=>({...f,dateDebut:e.target.value}))}/></div>
      </div>
      <div style=${{ marginBottom:8 }}><div class="lbl">Protocole / traitement</div><input class="inp" value=${form.protocole||''} onInput=${e=>setForm(f=>({...f,protocole:e.target.value}))} placeholder="Ex: Protocole réhab épaule S1-S4"/></div>
      <div style=${{ marginBottom:12 }}><div class="lbl">Notes</div><textarea class="inp" value=${form.notes||''} onInput=${e=>setForm(f=>({...f,notes:e.target.value}))} style=${{ resize:'vertical', minHeight:45 }} placeholder="Observations..."></textarea></div>
      <div style=${{ display:'flex', gap:8 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${() => setShowAdd(false)}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${save}>${editIdx !== null ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </div>` : null}

    ${actives.length > 0 ? _h`<div style=${{ marginBottom:16 }}>
      <div style=${{ fontSize:10, color:'#FF4455', textTransform:'uppercase', letterSpacing:1.5, fontWeight:800, marginBottom:8 }}>En cours (${actives.length})</div>
      ${actives.map((b, i) => renderCard(b, blessures.indexOf(b)))}
    </div>` : _h`<div style=${{ textAlign:'center', padding:'20px', color:'rgba(76,175,80,.6)', background:'rgba(76,175,80,.04)', border:'1px solid rgba(76,175,80,.15)', borderRadius:10, marginBottom:14 }}>
      ✓ Aucune blessure active
    </div>`}

    ${historique.length > 0 ? _h`<div>
      <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1.5 }}>Historique (${historique.length})</div>
        <div style=${{ flex:1, height:1, background:'rgba(255,255,255,.07)' }}></div>
      </div>
      ${historique.map((b, i) => renderCard(b, blessures.indexOf(b)))}
    </div>` : null}
  </div>`;
}

function DonneesGPSView({ player, setDb }) {
  const [activites, setActivites] = useState((player.gpsActivites || []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function saveActivites(newActivites) {
    setActivites(newActivites);
    setDb(d => ({
      ...d,
      playersPerso: (d.playersPerso||[]).map(p =>
        p.id === player.id ? { ...p, gpsActivites: newActivites } : p
      )
    }));
    if (window.__perfhand_db && player.id) {
      window.__perfhand_db.ref('perfhand/playersPerso/' + player.id + '/gpsActivites').set(newActivites);
    }
  }

  function parseGPX(text) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    const name = xml.querySelector('name') ? xml.querySelector('name').textContent : 'Activité';
    const trkpts = Array.from(xml.querySelectorAll('trkpt'));
    if (!trkpts.length) throw new Error('Fichier GPX invalide ou vide');

    // Distance totale
    let distance = 0;
    let elevGain = 0;
    let elevLoss = 0;
    let hrSum = 0, hrCount = 0;
    const points = trkpts.map(pt => ({
      lat: parseFloat(pt.getAttribute('lat')),
      lon: parseFloat(pt.getAttribute('lon')),
      ele: parseFloat(pt.querySelector('ele') ? pt.querySelector('ele').textContent : 0),
      time: pt.querySelector('time') ? new Date(pt.querySelector('time').textContent) : null,
      hr: pt.querySelector('hr') ? parseInt(pt.querySelector('hr').textContent) : null,
    }));

    for (let i = 1; i < points.length; i++) {
      const a = points[i-1], b = points[i];
      const R = 6371000;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLon = (b.lon - a.lon) * Math.PI / 180;
      const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
      distance += R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
      const dEle = b.ele - a.ele;
      if (dEle > 0) elevGain += dEle; else elevLoss += Math.abs(dEle);
      if (b.hr) { hrSum += b.hr; hrCount++; }
    }

    const firstTime = points[0].time;
    const lastTime = points[points.length-1].time;
    const dureeS = firstTime && lastTime ? (lastTime - firstTime) / 1000 : 0;
    const dureeMin = Math.round(dureeS / 60);
    const distKm = distance / 1000;
    const vitMoy = dureeMin > 0 ? distKm / (dureeMin / 60) : 0;
    const alloxMin = distKm > 0 && dureeMin > 0 ? dureeMin / distKm : 0;

    return {
      id: Date.now(),
      nom: name,
      date: firstTime ? firstTime.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      distance: Math.round(distKm * 100) / 100,
      duree: dureeMin,
      vitesseMoy: Math.round(vitMoy * 10) / 10,
      allure: alloxMin > 0 ? Math.floor(alloxMin) + "'" + String(Math.round((alloxMin % 1) * 60)).padStart(2,'0') + '"' : '—',
      elevGain: Math.round(elevGain),
      elevLoss: Math.round(elevLoss),
      fcMoy: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
      points: points.slice(0, 500).map(p => ({ lat: p.lat, lon: p.lon })),
    };
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const activite = parseGPX(ev.target.result);
        const newList = [activite, ...activites];
        saveActivites(newList);
      } catch(err) {
        setError('Erreur : ' + err.message);
      }
      setLoading(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function deleteActivite(id) {
    if (confirm('Supprimer cette activité ?')) saveActivites(activites.filter(a => a.id !== id));
  }

  function formatDuree(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? h + 'h' + String(m).padStart(2,'0') : m + 'min';
  }

  return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      <div>
        <div style=${{ fontSize:16, fontWeight:800 }}>📍 Données GPS</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>Import de fichiers GPX (Strava, Garmin, etc.)</div>
      </div>
      <div style=${{ position:'relative' }}>
        <input type="file" accept=".gpx" id="gps-file-input" onChange=${handleFile} style=${{ position:'absolute', opacity:0, width:'100%', height:'100%', top:0, left:0, cursor:'pointer', zIndex:2 }} />
        <button style=${{ background:'#FFA420', color:'#000', border:'none', borderRadius:10, padding:'9px 14px', fontSize:12, fontWeight:700, cursor:'pointer', position:'relative', zIndex:1 }}>
          ${loading ? '⏳ Chargement...' : '+ Import GPX'}
        </button>
      </div>
    </div>

    ${error && _h`<div style=${{ background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.3)', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#FF4455' }}>${error}</div>`}

    ${activites.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'60px 20px', color:'rgba(255,255,255,.2)' }}>
      <div style=${{ fontSize:40, marginBottom:12 }}>📍</div>
      <div style=${{ fontSize:14, fontWeight:600, marginBottom:6 }}>Aucune activité importée</div>
      <div style=${{ fontSize:12 }}>Exporte ton activité depuis Strava au format GPX et importe-la ici</div>
    </div>` : null}

    ${activites.map(a => _h`<div key=${a.id} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'14px 16px', marginBottom:10 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style=${{ fontSize:14, fontWeight:700 }}>${a.nom}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>${a.date}</div>
        </div>
        <button onClick=${() => deleteActivite(a.id)} style=${{ background:'rgba(255,68,85,.1)', border:'none', color:'#FF4455', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:11 }}>✕</button>
      </div>
      <div style=${{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom: a.fcMoy ? 8 : 0 }}>
        ${[
          ['Distance', a.distance + ' km', '#38BDF8'],
          ['Durée', formatDuree(a.duree), '#FFA420'],
          ['Vitesse moy.', a.vitesseMoy + ' km/h', '#4CAF50'],
          ['Allure', a.allure + '/km', '#A78BFA'],
          ['D+ ', a.elevGain + ' m', '#FB923C'],
          ['D-', a.elevLoss + ' m', '#60A5FA'],
        ].map(([l, v, c]) => _h`<div key=${l} style=${{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'10px', textAlign:'center' }}>
          <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>${l}</div>
          <div style=${{ fontSize:15, fontWeight:800, color:c, fontFamily:"'Barlow Condensed',sans-serif" }}>${v}</div>
        </div>`)}
      </div>
      ${a.fcMoy ? _h`<div style=${{ background:'rgba(255,68,85,.06)', border:'1px solid rgba(255,68,85,.15)', borderRadius:10, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>❤️ FC moyenne</span>
        <span style=${{ fontSize:16, fontWeight:800, color:'#FF4455', fontFamily:"'Barlow Condensed',sans-serif" }}>${a.fcMoy} bpm</span>
      </div>` : null}
    </div>`)}
  </div>`;
}

function EditPersoModal({ p, onSave, onClose }) {
  const SC_OPTIONS = [
    { key:'ok',        label:'Disponible',   color:'#4CAF50' },
    { key:'blesse',    label:'Blessé',       color:'#FF4455' },
    { key:'surveille', label:'Surveillance', color:'#FF7A00' },
    { key:'repos',     label:'Repos',        color:'#FFB800' },
  ];
  const [form, setForm] = useState({
    name:      p.name     || '',
    email:     p.email    || '',
    sport:     p.sport    || 'Handball',
    poste:     p.poste    || '',
    age:       String(p.age    || ''),
    poids:     String(p.poids  || ''),
    taille:    String(p.taille || ''),
    objectif:  p.objectif || '',
    notes:     p.notes    || '',
    status:    p.status   || 'ok',
    nutrition: p.nutrition|| 'competition',
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return _h`<div class="edit-modal-bg" onClick=${onClose}>
    <div class="edit-modal" style=${{ maxWidth:520 }} onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style=${{ fontSize:15, fontWeight:800 }}>Modifier — ${p.name}</div>
        <button onClick=${onClose} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:20, cursor:'pointer' }}>×</button>
      </div>
      <div class="edit-modal-body">
        <!-- Statut -->
        <div style=${{ marginBottom:14 }}>
          <div class="lbl">Statut</div>
          <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
            ${SC_OPTIONS.map(s => _h`<button key=${s.key}
              onClick=${() => upd('status', s.key)}
              style=${{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
                border:'1px solid '+(form.status===s.key?s.color+'50':'rgba(255,255,255,.1)'),
                background:form.status===s.key?s.color+'15':'rgba(255,255,255,.04)',
                color:form.status===s.key?s.color:'rgba(255,255,255,.45)' }}
            >${s.label}</button>`)}
          </div>
        </div>
        <div class="edit-row">
          <div style=${{ marginBottom:12 }}><div class="lbl">Nom</div><input class="inp" value=${form.name} onInput=${e => upd('name',e.target.value)}/></div>
          <div style=${{ marginBottom:12 }}><div class="lbl">Poste</div><input class="inp" value=${form.poste} onInput=${e => upd('poste',e.target.value)} placeholder="Pivot..."/></div>
        </div>
        <div class="edit-row">
          <div style=${{ marginBottom:12 }}><div class="lbl">Email</div><input class="inp" type="email" value=${form.email} onInput=${e => upd('email',e.target.value)}/></div>
        </div>
        <div class="edit-row">
          <div style=${{ marginBottom:12 }}><div class="lbl">Âge</div><input class="inp" type="number" value=${form.age} onInput=${e => upd('age',e.target.value)}/></div>
          <div style=${{ marginBottom:12 }}><div class="lbl">Poids (kg)</div><input class="inp" type="number" value=${form.poids} onInput=${e => upd('poids',e.target.value)}/></div>
          <div style=${{ marginBottom:12 }}><div class="lbl">Taille (cm)</div><input class="inp" type="number" value=${form.taille} onInput=${e => upd('taille',e.target.value)}/></div>
          <div style=${{ marginBottom:12 }}>
            <div class="lbl">Genre</div>
            <div style=${{ display:'flex', gap:8 }}>
              ${['M','F'].map(g => _h`<button key=${g}
                onClick=${e => { e.preventDefault(); upd('genre', g); }}
                style=${{
                  flex:1, padding:'8px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:700,
                  border: form.genre === g ? '2px solid '+(g==='F'?'#FF6B9D':'#38BDF8') : '1px solid rgba(255,255,255,.1)',
                  background: form.genre === g ? (g==='F'?'rgba(255,107,157,.12)':'rgba(56,189,248,.1)') : 'rgba(255,255,255,.03)',
                  color: form.genre === g ? (g==='F'?'#FF6B9D':'#38BDF8') : 'rgba(255,255,255,.4)'
                }}>
                ${g === 'M' ? '♂ Homme' : '♀ Femme'}
              </button>`)}
            </div>
          </div>
        </div>
        <div style=${{ marginBottom:12 }}>
          <div class="lbl">Phase nutritionnelle</div>
          <select class="inp" value=${form.nutrition} onChange=${e => upd('nutrition', e.target.value)}>
            ${Object.entries(PLANS_NUT).map(([k,v]) => _h`<option key=${k} value=${k}>${v.label}</option>`)}
          </select>
        </div>
        <div style=${{ marginBottom:12 }}><div class="lbl">Objectif</div><input class="inp" value=${form.objectif} onInput=${e => upd('objectif',e.target.value)} placeholder="Objectif principal..."/></div>
        <div><div class="lbl">Notes</div><textarea class="inp" value=${form.notes} onInput=${e => upd('notes',e.target.value)} style=${{ resize:'vertical', minHeight:50 }}></textarea></div>
      </div>
      <div style=${{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:10, flexShrink:0 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${() => {
          onSave({ ...form, age:parseInt(form.age)||0, poids:parseInt(form.poids)||0, taille:parseInt(form.taille)||0,
                   email: form.email.trim().toLowerCase() });
        }}>Enregistrer</button>
      </div>
    </div>
  </div>`;
}

function PersoAdminDetail({ player: playerProp, setDb }) {
  const { db } = useApp();
  const [tab, setTab] = useState('profil');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  // Always resolve live player from db to avoid stale data
  const player = (db.playersPerso||[]).find(p => p.id === playerProp?.id) || playerProp;
  // Guard against missing player
  if (!player || !player.id) return _h`<div style=${{ padding:40, textAlign:'center', color:'rgba(255,255,255,.4)' }}>
    <div>Profil introuvable.</div>
  </div>`;

  function savePlayer(updates) {
    setDb(d => ({ ...d, playersPerso: (d.playersPerso||[]).map(p =>
      p.id === player.id ? { ...p, ...updates } : p
    )}));
  }

  function saveProtocolPerso(protocol) {
    if (window.__perfhand_db && player && player.id) {
      let safe; try { safe = JSON.parse(JSON.stringify(protocol)); } catch(e) { safe = protocol; }
      window.__perfhand_db.ref('perfhand/playersPerso/' + player.id + '/protocol').set(safe)
        .then(function(){ console.log('[protocol] ✅ écrit pour', player.name); })
        .catch(function(e){ console.error('[protocol] ❌ échec:', e && e.code, e && e.message); alert('Erreur : le protocole n\'a pas pu être enregistré.'); });
    }
    setDb(d => ({ ...d, playersPerso: (d.playersPerso||[]).map(p => p.id === player.id ? { ...p, protocol } : p) }));
  }

  // ── EXPORT / IMPORT PROFIL ───────────────────────────────────────────────
  const [showExport, setShowExport] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [importCode, setImportCode] = React.useState('');
  const [importError, setImportError] = React.useState('');

  function exportProfil() {
    // Sérialiser les données importantes du joueur
    const data = {
      v: 1,
      name: player.name,
      email: player.email,
      sport: player.sport,
      age: player.age,
      poids: player.poids,
      taille: player.taille,
      genre: player.genre,
      bilans: player.bilans || [],
      bilansSem: player.bilansSem || [],
      muscuSeances: player.muscuSeances || [],
      enduranceSeances: player.enduranceSeances || [],
      blessures: player.blessures || [],
      tests: player.tests || [],
      rmHistory: player.rmHistory || [],
      nutrition: player.nutrition,
      cycles: player.cycles || [],
      exportDate: localDateStr(),
    };
    // Encoder en base64
    const json = JSON.stringify(data);
    const code = btoa(unescape(encodeURIComponent(json)));
    return code;
  }

  function copyExportCode() {
    const code = exportProfil();
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copié dans le presse-papier ! Donne-le à ton nouveau préparateur physique.');
    }).catch(() => {
      setShowExport(true);
    });
  }

  function downloadExport() {
    const code = exportProfil();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profil_' + (player.name||'joueur').replace(/\s+/g,'_') + '_' + localDateStr() + '.perfhand';
    a.click();
    URL.revokeObjectURL(url);
  }

  // setDb wrapper: routes any sub-component save (MuscuView, SuiviChargeView, NutritionView)
  // to playersPerso instead of players
  function setDbPerso(fn) {
    setDb(d => {
      const fakeDb = { ...d, players: d.playersPerso || [] };
      const next = typeof fn === 'function' ? fn(fakeDb) : fn;
      // Handle both 'players' key (legacy) and direct playersPerso/playerProfiles keys
      const result = { ...d };
      if (next.players !== undefined) result.playersPerso = next.players;
      if (next.playersPerso !== undefined) result.playersPerso = next.playersPerso;
      if (next.playerProfiles !== undefined) result.playerProfiles = next.playerProfiles;
      // Propagate muscuSeances/enduranceSeances updates back to playersPerso
      return result;
    });
  }

  // Live player from db for reactivity
  const TABS = [
    { id:'profil',      label:'Profil' },
    { id:'planif',      label:'Planif' },
    { id:'nutrition',   label:'Nutrition' },
    { id:'musculation', label:'Muscu' },
    { id:'protocole',   label:'Protocoles' },
    { id:'endurance',   label:'Endurance' },
    { id:'bilan',       label:'Bilan' },
    { id:'blessures',   label:'Blessures' },
    ...(player.genre === 'F' ? [{ id:'cycle', label:'🌸 Cycle' }] : []),
    { id:'mental',      label:'Mental' },
    { id:'ressources',  label:'📂 Docs' },
  ];

  const sc = { ok:'#4CAF50', blesse:'#FF4455', surveille:'#FF7A00', repos:'#FFB800' }[player.status] || '#4CAF50';

  // Pre-compute profil tab to avoid nested {} in template literal
  const _tabProfil = React.createElement(PersoProfilTab, { player, editMode, editForm, setEditMode, setEditForm, savePlayer });

  return _h`<div>
    <!-- Onglets scrollables pleine page -->
    <div style=${{ display:'flex', gap:0, borderBottom:'1px solid rgba(255,255,255,.07)', overflowX:'auto', WebkitOverflowScrolling:'touch', background:'#0D0F16', position:'sticky', top:58, zIndex:9 }}>
      ${TABS.map(t => _h`<button key=${t.id}
        onClick=${() => setTab(t.id)}
        style=${{
          padding:'12px 18px', background:'none',
          border:'none', borderBottom:'2px solid '+(tab===t.id?'#FFA420':'transparent'),
          color:tab===t.id?'#fff':'rgba(255,255,255,.4)',
          fontSize:12, fontWeight:tab===t.id?700:400,
          cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif',
          transition:'all .15s'
        }}>${t.label}</button>`)}
    </div>

    <!-- Tab content pleine page -->
    <div style=${{ padding:'20px 20px' }}>

      ${tab === 'profil' && _h`<div>
        <!-- Planning de la semaine — même bloc que côté joueur, pour vérification directe par le coach -->
        ${(() => {
          const jourIdxAujourdhui = (new Date().getDay() + 6) % 7;
          const clubId = player.clubId;
          const clubPlanif = clubId && db ? (db.clubPlanif || {})[clubId] : null;
          const persoPlanif = player.planif;

          function joursDepuisClub() {
            if (!clubPlanif || !clubPlanif.dateDebut || !Array.isArray(clubPlanif.semaines)) return null;
            const idx = computeCurrentWeekIdx(clubPlanif.dateDebut, clubPlanif.semaines.length);
            if (idx === null) return null;
            const week = clubPlanif.semaines[idx];
            if (!week || !week.jours) return null;
            return week.jours.map(day => dayArrGlobal(day).filter(s => s.type).map(s => {
              const t = TYPES_SEANCE.find(ts => ts.id === s.type);
              return { icon: t ? t.icon : '🏃', label: t ? t.label : s.type, heure: s.heureDebut || '', heures: s.heures || 0 };
            }));
          }
          function joursDepuisPerso() {
            if (!persoPlanif || !persoPlanif.dateDebut || !Array.isArray(persoPlanif.semaines)) return null;
            const idx = computeCurrentWeekIdx(persoPlanif.dateDebut, persoPlanif.semaines.length);
            if (idx === null) return null;
            const week = persoPlanif.semaines[idx];
            if (!week) return null;
            return [0,1,2,3,4,5,6].map(ji => {
              const items = [];
              if (week['j'+ji]) items.push({ icon:'🏃', label: week['j'+ji], heure: week['h'+ji]||'' });
              if (week['h'+ji+'b']) items.push({ icon:'🏋️', label:'', heure: week['h'+ji+'b'] });
              return items;
            });
          }

          const semaineClub = joursDepuisClub();
          const semainePerso = joursDepuisPerso();
          if (!semaineClub && !semainePerso) return null;
          const semaine = [0,1,2,3,4,5,6].map(ji => {
            const p = semainePerso ? semainePerso[ji] : [];
            if (p && p.length) return p;
            return semaineClub ? semaineClub[ji] : [];
          });

          // Repli : si aucune activité jour-par-jour n'a été saisie (onglet Planif > Détail)
          // mais qu'un cycle a été peint sur la semaine en cours (onglet Planif > Macro),
          // on l'affiche quand même pour éviter un faux "Repos" sur toute la semaine.
          const totalItems = semaine.reduce((s, d) => s + (d ? d.length : 0), 0);
          let macroFallback = null;
          if (totalItems === 0 && persoPlanif && persoPlanif.dateDebut && Array.isArray(persoPlanif.semaines)) {
            const idxMacro = computeCurrentWeekIdx(persoPlanif.dateDebut, persoPlanif.semaines.length);
            const weekMacro = idxMacro !== null ? persoPlanif.semaines[idxMacro] : null;
            if (weekMacro && weekMacro.cycle && weekMacro.cycle !== 'vide') {
              const cyc = CYCLES_PERSO.find(c => c.id === weekMacro.cycle) || CYCLES_PERSO[CYCLES_PERSO.length-1];
              macroFallback = { cyc, heures: weekMacro.heures || 0, notes: weekMacro.notes || '' };
            }
          }

          return _h`<div class="card" style=${{ marginBottom:14, border:'1px solid rgba(255,164,32,.3)' }}>
            <div style=${{ fontSize:13, fontWeight:800, color:'#FFA420', marginBottom:12 }}>📅 Cette semaine — ${player.name}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:10 }}>C'est ce que ${player.name} voit en haut de son propre accueil.</div>
            ${macroFallback ? _h`<div style=${{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:10, borderRadius:10, background:macroFallback.cyc.bg, border:'1px solid '+macroFallback.cyc.color+'40' }}>
              <span style=${{ fontSize:11, fontWeight:800, color:macroFallback.cyc.color }}>Cycle ${macroFallback.cyc.label}</span>
              ${macroFallback.heures ? _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.5)' }}>· ${macroFallback.heures}h prévues</span>` : null}
              <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginLeft:'auto' }}>Vue macro uniquement — pas de détail jour par jour renseigné</span>
            </div>` : null}
            <div style=${{ display:'flex', flexDirection:'column', gap:6 }}>
              ${JOURS.map((jourLabel, ji) => {
                const items = semaine[ji] || [];
                const isToday = ji === jourIdxAujourdhui;
                return _h`<div key=${jourLabel} style=${{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10,
                  background: isToday ? 'rgba(255,164,32,.12)' : 'rgba(255,255,255,.03)',
                  border: '1px solid ' + (isToday ? 'rgba(255,164,32,.4)' : 'rgba(255,255,255,.06)')
                }}>
                  <div style=${{ fontSize:11, fontWeight:800, color: isToday ? '#FFA420' : 'rgba(255,255,255,.4)', minWidth:34 }}>${jourLabel}</div>
                  <div style=${{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
                    ${items.length > 0 ? items.map((it, si) => _h`<div key=${si} style=${{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style=${{ fontSize:15 }}>${it.icon}</span>
                      ${it.label ? _h`<span style=${{ fontSize:12, fontWeight:600 }}>${it.label}</span>` : null}
                      ${it.heure ? _h`<span style=${{ fontSize:12, fontWeight:800, color:'#38BDF8', marginLeft:'auto', whiteSpace:'nowrap' }}>🕐 ${calcPlageHoraire(it.heure, it.heures)}</span>` : null}
                    </div>`) : _h`<span style=${{ fontSize:12, color:'rgba(255,255,255,.2)' }}>Repos</span>`}
                  </div>
                </div>`;
              })}
            </div>
          </div>`;
        })()}

        ${_tabProfil}

        <!-- Export / Import profil -->
        <div style=${{ marginTop:20, padding:'14px 16px', background:'rgba(56,189,248,.04)', border:'1px solid rgba(56,189,248,.15)', borderRadius:14 }}>
          <div style=${{ fontSize:13, fontWeight:800, color:'#38BDF8', marginBottom:4 }}>📦 Portabilité du profil</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:12, lineHeight:1.6 }}>
            Exporte toutes tes données (bilans, séances, blessures, 1RM...) pour les transférer vers un nouveau club ou un nouveau prépa.
          </div>
          <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button class="btn btn-sm" style=${{ flex:1, background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', fontWeight:700 }}
              onClick=${copyExportCode}>
              📋 Copier le code d'export
            </button>
            <button class="btn btn-sm" style=${{ flex:1, background:'rgba(56,189,248,.08)', border:'1px solid rgba(56,189,248,.2)', color:'#38BDF8' }}
              onClick=${downloadExport}>
              ⬇️ Télécharger (.perfhand)
            </button>
          </div>
          <div style=${{ marginTop:8, fontSize:10, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>
            Dernière export : ${player.exportDate || 'jamais'} · ${(player.bilans||[]).length} bilans · ${(player.muscuSeances||[]).length} séances muscu
          </div>
        </div>
      </div>`}
      ${tab === 'planif' && React.createElement(PersoPlanifView, { player: player, setDb: setDb, isCoach: true })}
      ${tab === 'nutrition' && _h`<${NutritionView} player=${player} db=${{ players: [player] }} setDb=${setDbPerso} isCoach=${true} />`}

      ${tab === 'musculation' && React.createElement(MuscuView, { player, setDb: setDbPerso, isCoach: true, db })}

      ${tab === 'bilan' && _h`<${SuiviChargeView} player=${player} setDb=${setDbPerso} isCoach=${true} />`}

      ${tab === 'endurance' && React.createElement(EnduranceView, { player: player, setDb: setDb, isCoach: true, db: db })}
      ${tab === 'blessures' && React.createElement(BlessuresPersoTab, { player, savePlayer })}
      ${tab === 'protocole' && _h`<div>
        ${(player.protocol && player.protocol.length > 0) ? _h`<div style=${{ marginBottom:16 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>📋 Protocole${player.protocol.length>1?'s':''} assigné${player.protocol.length>1?'s':''}</div>
          ${player.protocol.map((bloc, bi) => _h`<div key=${bi} style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px 16px', marginBottom:10 }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style=${{ fontSize:13, fontWeight:700 }}>${bloc.nom}</div>
              <button title="Retirer ce protocole" onClick=${() => {
                if (!confirm('Retirer ce protocole de ' + player.name + ' ?')) return;
                saveProtocolPerso(player.protocol.filter((_, i) => i !== bi));
              }} style=${{ background:'rgba(255,68,85,.1)', border:'1px solid rgba(255,68,85,.3)', color:'#FF4455', borderRadius:6, padding:'3px 8px', fontSize:11, cursor:'pointer' }}>×</button>
            </div>
            ${(bloc.exercices||[]).map((ex,ei) => _h`<div key=${ei} style=${{ padding:'8px 0', borderTop: ei>0?'1px solid rgba(255,255,255,.05)':'none' }}>
              <div style=${{ fontSize:12, fontWeight:600 }}>${ex.nom}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>${[ex.reps, ex.charge, ex.repos].filter(Boolean).join(' · ')}</div>
              ${ex.notes ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:3, fontStyle:'italic' }}>${ex.notes}</div>` : null}
            </div>`)}
          </div>`)}
        </div>` : null}
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>📚 Bibliothèque protocoles</div>
        ${typeof PROTOCOLES_DATA !== 'undefined' ? React.createElement(ProtocolesHandball, {
          player: player,
          onAssign: (bloc) => saveProtocolPerso([...(player.protocol||[]), bloc])
        }) : _h`<div style=${{ color:'rgba(255,255,255,.3)', padding:'20px', textAlign:'center' }}>Chargement des protocoles...</div>`}
      </div>`}

      ${tab === 'cycle' && player.genre === 'F' && React.createElement(CycleView, { player, savePlayer })}

      ${tab === 'mental' && React.createElement(MentalPrepView, { player, savePlayer })}

      <!-- Assignation ressources -->
      ${tab === 'ressources' && _h`<div>
        <div style=${{ fontSize:14, fontWeight:700, marginBottom:4 }}>📂 Ressources assignées à ${player.name}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:16, lineHeight:1.6 }}>
          Coche les documents que tu veux rendre accessibles à ce joueur dans son espace.
        </div>
        ${(() => {
          const ALL_RESSOURCES = [
            { id:'r1', titre:'Guide Complet — Prévention & Blessures Handball', categorie:'Guide', icon:'📖' },
            { id:'r2', titre:'Protocoles Prévention Blessures', categorie:'Protocole', icon:'📋' },
            { id:'r3', titre:'Protocole Épaule — Handball Élite', categorie:'Protocole', icon:'🦾' },
            { id:'r4', titre:'Guide Mobilité Active au Handball', categorie:'Guide', icon:'🤸' },
            { id:'r4', titre:'Guide Mobilité Active au Handball', categorie:'Guide', icon:'🤸' },
            { id:'r4', titre:'Guide Mobilité Active au Handball', categorie:'Guide', icon:'🤸' },
            ...(db.ressourcesCustom || []).map(r => ({ id:r.id, titre:r.titre, categorie:r.categorie, icon:r.icon||'📄' })),
          ];
          const assignees = player.ressourcesAssignees || [];

          return _h`<div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
            ${ALL_RESSOURCES.map(r => {
              const isOn = assignees.includes(r.id);
              return _h`<div key=${r.id}
                onClick=${() => {
                  const next = isOn ? assignees.filter(x=>x!==r.id) : [...assignees, r.id];
                  savePlayer({ ressourcesAssignees: next });
                }}
                style=${{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12,
                  background: isOn ? 'rgba(255,164,32,.08)' : 'rgba(255,255,255,.03)',
                  border:'1px solid ' + (isOn ? 'rgba(255,164,32,.35)' : 'rgba(255,255,255,.08)'),
                  cursor:'pointer', transition:'all .15s' }}>
                <div style=${{ width:22, height:22, borderRadius:6, border:'2px solid '+(isOn?'#FFA420':'rgba(255,255,255,.2)'),
                  background:isOn?'#FFA420':'transparent', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, flexShrink:0 }}>${isOn ? '✓' : ''}</div>
                <span style=${{ fontSize:16, flexShrink:0 }}>${r.icon}</span>
                <div style=${{ flex:1 }}>
                  <div style=${{ fontSize:12, fontWeight:700 }}>${r.titre}</div>
                  <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:1 }}>${r.categorie}</div>
                </div>
              </div>`;
            })}
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textAlign:'center', marginTop:8 }}>
              ${assignees.length} ressource${assignees.length>1?'s':''} assignée${assignees.length>1?'s':''}
            </div>
          </div>`;
        })()}
      </div>`}

    </div>
  </div>`;
}




// ── PLANIFICATION CLUB ────────────────────────────────────────────────────────
// Planification hebdomadaire club : heures par séance, par catégorie, par semaine

const TYPES_SEANCE = [
  { id:'collectif',  label:'Collectif',        color:'#7C6FFF', icon:'🏐' },
  { id:'muscu',      label:'Muscu / PPG',       color:'#FF4455', icon:'🏋️' },
  { id:'cardio',     label:'Cardio / Athlé',    color:'#38BDF8', icon:'🏃' },
  { id:'prevention', label:'Prévention',        color:'#4CAF50', icon:'🦺' },
  { id:'match',      label:'Match',             color:'#FFA420', icon:'⚽' },
  { id:'repos',      label:'Repos / Récup',     color:'rgba(255,255,255,.3)', icon:'😴' },
];

const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

// ── PRÉPA ESTIVALE VIEW ────────────────────────────────────────────────────────
function PersoPlanifView({ player, setDb, isCoach, firebasePath }) {
  // Guard: if no player, render nothing useful
  if (!player || !player.id) return _h`<div style=${{ padding:40, textAlign:'center', color:'rgba(255,255,255,.4)' }}>Profil introuvable.</div>`;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [showDupWeekPerso, setShowDupWeekPerso] = useState(false);
  const [dupTargetsPerso, setDupTargetsPerso] = useState([]);

  // planif stored on the player
  const planif = player.planif || { objectifSaison:'', dateDebut:'', semaines:[] };

  // Ensure at least 45 weeks
  function getWeeks() {
    const sems = planif.semaines || [];
    const result = [];
    for (let i = 0; i < 45; i++) {
      result.push(sems[i] || {
        num: i + 1,
        label: 'S' + (i + 1),
        cycle: 'vide',
        match: '',
        charge: 2,
        notes: '',
        force: 0, vitesse: 0, endurance: 0, mobilite: 0, heures: 0,
      });
    }
    return result;
  }

  const [weeks, setWeeks]       = useState(getWeeks);
  const [selWeek, setSelWeek]   = useState(null);
  const [view, setView]         = useState('macro'); // macro | detail
  const [objectif, setObjectif] = useState(planif.objectifSaison || '');
  const [dateDebut, setDateDebut] = useState(planif.dateDebut || '');
  const [editW, setEditW]       = useState(null); // week being edited
  const [selCycle, setSelCycle] = useState(null); // for bulk painting
  const [showDupePicker, setShowDupePicker] = useState(false); // sélecteur de joueurs pour dupliquer
  const [dupeSelected, setDupeSelected] = useState([]); // ids sélectionnés
  const currentWeekRef = useRef(null); // pour scroller jusqu'à la semaine actuelle UNE SEULE FOIS au montage

  function save(newWeeks, newObjectif, newDateDebut) {
    const w = newWeeks !== undefined ? newWeeks : weeks;
    const o = newObjectif !== undefined ? newObjectif : objectif;
    const d = newDateDebut !== undefined ? newDateDebut : dateDebut;
    const planifData = { objectifSaison: o, dateDebut: d, semaines: w };
    // Sync Firebase selon le type de joueur
    if (window.__perfhand_db && player && player.id) {
      if (firebasePath) {
        window.__perfhand_db.ref(firebasePath(player.id)).set(planifData);
      } else {
        const inProfiles = !!(window.__perfhand_db && player.clubId); // joueur USM collectif
        if (inProfiles) {
          window.__perfhand_db.ref('perfhand/playerProfiles/' + player.id + '/planif').set(planifData);
        } else {
          window.__perfhand_db.ref('perfhand/playersPerso/' + player.id + '/planif').set(planifData);
        }
      }
    }
    setDb(dd => ({
      ...dd,
      playersPerso: (dd.playersPerso||[]).map(p =>
        p.id === player.id ? { ...p, planif: planifData } : p
      ),
      playerProfiles: (dd.playerProfiles||[]).map(p =>
        p.id === player.id ? { ...p, planif: planifData } : p
      )
    }));
  }

  function updWeek(idx, field, val) {
    const nw = weeks.map((w, i) => i === idx ? { ...w, [field]: val } : w);
    setWeeks(nw);
    save(nw);
  }

  function paintCycle(idx, cycleId) {
    const nw = weeks.map((w, i) => i === idx ? { ...w, cycle: cycleId } : w);
    setWeeks(nw);
    save(nw);
  }

  // Compute week date from dateDebut
  function weekDate(idx) {
    if (!dateDebut) return 'S' + (idx + 1);
    const d = new Date(dateDebut);
    d.setDate(d.getDate() + idx * 7);
    return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
  }

  // Semaine actuelle (repère "AUJOURD'HUI" sur la grille) — calculée depuis la date de début S1
  function getCurrentWeekIdx() {
    if (!dateDebut) return null;
    const start = new Date(dateDebut);
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = Math.floor((today - start) / (1000*60*60*24));
    if (diffDays < 0) return null; // saison pas encore commencée
    const idx = Math.floor(diffDays / 7);
    return (idx >= 0 && idx < 45) ? idx : null;
  }
  const currentWeekIdx = getCurrentWeekIdx();

  // Scroller jusqu'à la semaine actuelle UNE SEULE FOIS au montage (pas à chaque re-render,
  // sinon ça remonte la page à chaque frappe dans les champs — bug corrigé ici)
  useEffect(() => {
    if (currentWeekRef.current && currentWeekRef.current.scrollIntoView) {
      currentWeekRef.current.scrollIntoView({ behavior:'smooth', block:'center' });
    }
  }, []); // eslint-disable-line

  const CHARGE_COLORS = ['','#38BDF8','#4CAF50','#FFB800','#FF7A00','#FF4455'];
  const getCycle = (id) => CYCLES_PERSO.find(c => c.id === id) || CYCLES_PERSO[CYCLES_PERSO.length-1];

  // Stats par cycle
  const cycleStats = {};
  CYCLES_PERSO.forEach(c => { cycleStats[c.id] = weeks.filter(w => w.cycle === c.id).length; });

  // Pre-compute macro heatmap to avoid nested {} in template literal
  const _weekCells = weeks.map(function(w, i) {
    const cy = getCycle(w.cycle);
    const isSelected = selWeek === i;
    const isCurrent = currentWeekIdx === i;
    return React.createElement('div', {
      key: i,
      ref: isCurrent ? currentWeekRef : undefined,
      onClick: function() {
        if (!isCoach) return;
        if (selCycle) { paintCycle(i, selCycle); return; }
        setSelWeek(isSelected ? null : i);
      },
      style: {
        background: isSelected ? cy.color+'40' : cy.bg,
        border: isCurrent ? '2px solid #38BDF8' : ('1px solid '+(isSelected ? cy.color : cy.color+'30')),
        boxShadow: isCurrent ? '0 0 0 3px rgba(56,189,248,.2), 0 0 14px rgba(56,189,248,.45)' : 'none',
        borderRadius: 8, padding: '6px 4px', cursor: 'pointer',
        textAlign: 'center', transition: 'all .15s', position: 'relative'
      }
    },
      isCurrent ? React.createElement('div', { style:{
        position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)',
        background:'#38BDF8', color:'#0D0D0D', fontSize:7, fontWeight:800,
        padding:'1.5px 6px', borderRadius:20, whiteSpace:'nowrap', letterSpacing:.4,
        boxShadow:'0 1px 4px rgba(0,0,0,.4)'
      }}, "📍 AUJOURD'HUI") : null,
      React.createElement('div', { style:{ fontSize:9, color:'rgba(255,255,255,.4)', marginBottom:2 } }, w.label),
      React.createElement('div', { style:{ fontSize:8, color:cy.color, fontWeight:700, marginBottom:3 } }, cy.abbr || cy.label),
      w.match ? React.createElement('div', { style:{ width:6, height:6, borderRadius:'50%', background:'#FFA420', margin:'0 auto' } }) : null,
      React.createElement('div', { style:{ height:3, background:'rgba(255,255,255,.07)', borderRadius:2, marginTop:3, overflow:'hidden' } },
        React.createElement('div', { style:{ height:'100%', width:((w.charge||0)/5*100)+'%', background:CHARGE_COLORS[w.charge||0]||'transparent', borderRadius:2 } })
      )
    );
  });
  const _macroView = React.createElement('div', null,
    React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:4 } }, ..._weekCells)
  );

  return _h`<div>

    <!-- Header + config -->
    <div class="card" style=${{ marginBottom:16 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700 }}>📅 Planification individuelle</div>
        <div style=${{ display:'flex', gap:6 }}>
          <button onClick=${() => setView('macro')}
            style=${{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
                       background:view==='macro'?'rgba(255,255,255,.1)':'rgba(255,255,255,.04)',
                       color:view==='macro'?'#fff':'rgba(255,255,255,.4)', fontWeight:view==='macro'?700:400 }}>Heatmap</button>
          <button onClick=${() => setView('detail')}
            style=${{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
                       background:view==='detail'?'rgba(255,255,255,.1)':'rgba(255,255,255,.04)',
                       color:view==='detail'?'#fff':'rgba(255,255,255,.4)', fontWeight:view==='detail'?700:400 }}>Détail</button>
          <button onClick=${() => setView('volume')}
            style=${{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
                       background:view==='volume'?'rgba(56,189,248,.15)':'rgba(255,255,255,.04)',
                       color:view==='volume'?'#38BDF8':'rgba(255,255,255,.4)', fontWeight:view==='volume'?700:400,
                       border:view==='volume'?'1px solid rgba(56,189,248,.3)':'1px solid transparent' }}>⏱ Volume</button>
        </div>
      </div>

      ${isCoach ? _h`<div>
        <div class="edit-row" style=${{ marginBottom:8 }}>
          <div>
            <div class="lbl">Objectif de saison</div>
            <input class="inp" value=${objectif}
              onInput=${e => { setObjectif(e.target.value); save(undefined, e.target.value); }}
              placeholder="Ex: Retour compétition N1, prise de masse..."/>
          </div>
          <div>
            <div class="lbl">Date de début (S1)</div>
            <input class="inp" type="date" value=${dateDebut}
              onInput=${e => { setDateDebut(e.target.value); save(undefined, undefined, e.target.value); }}/>
          </div>
        </div>
        <!-- Bouton dupliquer vers l'équipe (avec sélection des joueurs) -->
        <button
          onClick=${() => {
            const clubId = player.clubId || 'usm';
            const targets = (window.__perfhand_current_profiles || [])
              .filter(p => (p.clubId || 'usm') === clubId && p.id !== player.id);
            if (!targets.length) { alert('Aucun autre joueur dans ce club.'); return; }
            setDupeSelected(targets.map(p => p.id));
            setShowDupePicker(true);
          }}
          style=${{ width:'100%', marginBottom:8, background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', borderRadius:10, padding:'9px 14px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          📋 Dupliquer cette planification vers...
        </button>
        ${showDupePicker && (() => {
          const clubId = player.clubId || 'usm';
          const targets = (window.__perfhand_current_profiles || [])
            .filter(p => (p.clubId || 'usm') === clubId && p.id !== player.id);
          return _h`<div style=${{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
            onClick=${() => setShowDupePicker(false)}>
            <div style=${{ background:'#161616', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:420, maxHeight:'80vh', display:'flex', flexDirection:'column' }}
              onClick=${e => e.stopPropagation()}>
              <div style=${{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                <div style=${{ fontSize:13, fontWeight:700, marginBottom:2 }}>Dupliquer vers quels joueurs ?</div>
                <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>Planification de ${player.name}</div>
              </div>
              <div style=${{ padding:'8px 18px', display:'flex', gap:8 }}>
                <button class="btn btn-sm" onClick=${() => setDupeSelected(targets.map(p=>p.id))}>Tout cocher</button>
                <button class="btn btn-sm" onClick=${() => setDupeSelected([])}>Tout décocher</button>
              </div>
              <div style=${{ overflowY:'auto', padding:'4px 18px', flex:1 }}>
                ${targets.map(p => _h`<label key=${p.id} style=${{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <input type="checkbox" checked=${dupeSelected.includes(p.id)}
                    onChange=${() => setDupeSelected(sel => sel.includes(p.id) ? sel.filter(id=>id!==p.id) : [...sel, p.id])}/>
                  <span style=${{ fontSize:12 }}>${p.name}</span>
                </label>`)}
              </div>
              <div style=${{ padding:'14px 18px', borderTop:'1px solid rgba(255,255,255,.07)', display:'flex', gap:8 }}>
                <button class="btn btn-sm" style=${{ flex:1 }} onClick=${() => setShowDupePicker(false)}>Annuler</button>
                <button class="btn btn-sm btn-primary" style=${{ flex:1 }}
                  disabled=${dupeSelected.length===0}
                  onClick=${() => {
                    const selTargets = targets.filter(p => dupeSelected.includes(p.id));
                    if (!confirm('Dupliquer la planification de ' + player.name + ' vers ' + selTargets.length + ' joueur(s) ?\n\nCeci écrasera leurs planifications existantes.')) return;
                    const planifData = { objectifSaison: objectif, dateDebut, semaines: weeks };
                    selTargets.forEach(p => {
                      if (window.__perfhand_db) {
                        window.__perfhand_db.ref('perfhand/playerProfiles/' + p.id + '/planif').set(planifData);
                      }
                    });
                    setDb(d => ({
                      ...d,
                      playerProfiles: (d.playerProfiles||[]).map(p =>
                        dupeSelected.includes(p.id) ? { ...p, planif: planifData } : p
                      )
                    }));
                    setShowDupePicker(false);
                    alert('✅ Planification dupliquée vers ' + selTargets.length + ' joueur(s) !');
                  }}>
                  Dupliquer vers ${dupeSelected.length} joueur(s)
                </button>
              </div>
            </div>
          </div>`;
        })()}
      </div>` : _h`<div style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.5)' }}>🎯 ${objectif || 'Aucun objectif défini'}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:4 }}>${dateDebut ? 'Début: '+dateDebut : ''}</div>
      </div>`}
    </div>

    <!-- Légende cycles -->
    <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
      ${CYCLES_PERSO.filter(c => c.id !== 'vide').map(cy => _h`<div key=${cy.id}
        onClick=${() => isCoach && setSelCycle(selCycle===cy.id ? null : cy.id)}
        style=${{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:20, cursor:'pointer',
                   background: selCycle===cy.id ? cy.color+'30' : cy.bg,
                   border:'1px solid '+(selCycle===cy.id ? cy.color : cy.color+'30'),
                   fontWeight: selCycle===cy.id ? 700 : 400 }}>
        <div style=${{ width:10, height:10, borderRadius:2, background:cy.color }}></div>
        <span style=${{ fontSize:11, color:cy.color }}>${cy.label}</span>
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${cycleStats[cy.id]||0}s</span>
      </div>`)}
    </div>
    ${isCoach && selCycle ? _h`<div style=${{ fontSize:11, color:'rgba(255,164,32,.8)', marginBottom:10, padding:'6px 12px', background:'rgba(255,164,32,.08)', borderRadius:8 }}>
      🖌 Mode peinture activé : <b>${getCycle(selCycle).label}</b> — clique sur une semaine pour l'appliquer
    </div>` : null}

    <!-- ── VUE HEATMAP ── -->
    ${view === 'macro' && _macroView}
    ${view === 'detail' && _h`<div>
      <!-- KPIs rapides -->
      ${(() => {
        const totalH = weeks.reduce((a,w) => a+(w.heures||0), 0);
        const weeksWithH = weeks.filter(w=>(w.heures||0)>0).length;
        const avgH = weeksWithH > 0 ? Math.round(totalH/weeksWithH*10)/10 : 0;
        return _h`<div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
          <div style=${{ background:'rgba(56,189,248,.08)', border:'1px solid rgba(56,189,248,.2)', borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style=${{ fontSize:26, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${totalH}h</div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:3 }}>Total saison</div>
          </div>
          <div style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style=${{ fontSize:26, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${avgH}h</div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:3 }}>Moy./semaine</div>
          </div>
          <div style=${{ background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.2)', borderRadius:10, padding:'12px', textAlign:'center' }}>
            <div style=${{ fontSize:26, fontWeight:800, color:'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${Math.round(totalH/11*10)/10}h</div>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:3 }}>Moy./mois</div>
          </div>
        </div>`;
      })()}

      <!-- Tableau détail avec sous-totaux -->
      <div style=${{ overflowX:'auto' }}>
        <table style=${{ width:'100%', borderCollapse:'collapse', minWidth:520 }}>
          <thead><tr style=${{ background:'rgba(255,255,255,.03)' }}>
            ${['Sem.','Dates','Cycle','Charge','⏱ Heures','Force','Vit.','End.','Mob.'].map(h =>
              _h`<th key=${h} style=${{ padding:'7px 10px', textAlign:'left', fontSize:9, color:'rgba(255,255,255,.3)',
                letterSpacing:1.5, textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,.08)', fontWeight:500,
                whiteSpace:'nowrap' }}>${h}</th>`
            )}
          </tr></thead>
          <tbody>
            ${(() => {
              const rows = [];
              const MOIS_SIZE = 4;
              for (let m = 0; m < 11; m++) {
                const start = m * MOIS_SIZE;
                const end = Math.min(start + MOIS_SIZE, 44);
                const moisWeeks = weeks.slice(start, end);
                const moisH = moisWeeks.reduce((a,w) => a+(w.heures||0), 0);
                const moisLabel = dateDebut
                  ? new Date(new Date(dateDebut).getTime() + start*7*24*3600*1000).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})
                  : 'Mois '+(m+1);

                // Lignes semaines
                moisWeeks.forEach((w, wi) => {
                  const i = start + wi;
                  const cy = getCycle(w.cycle);
                  const h = w.heures || 0;
                  rows.push(_h`<tr key=${'w'+i} style=${{ cursor:'pointer', background: selWeek===i?'rgba(255,164,32,.06)':'transparent', transition:'background .1s' }}
                    onClick=${() => { setView('macro'); setSelWeek(i); }}>
                    <td style=${{ padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontWeight:700, color:cy.color, fontSize:12 }}>${w.label}</td>
                    <td style=${{ padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:10, color:'rgba(255,255,255,.35)', whiteSpace:'nowrap' }}>${weekDate(i)}</td>
                    <td style=${{ padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <span style=${{ fontSize:10, padding:'2px 7px', borderRadius:20, background:cy.bg, color:cy.color, fontWeight:700, whiteSpace:'nowrap' }}>${cy.label}</span>
                    </td>
                    <td style=${{ padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <div style=${{ display:'flex', gap:2 }}>
                        ${[1,2,3,4,5].map(v => _h`<div key=${v} style=${{ width:7, height:7, borderRadius:2,
                          background: v<=(w.charge||0) ? (CHARGE_COLORS[w.charge||0]||'#FFA420') : 'rgba(255,255,255,.08)' }}></div>`)}
                      </div>
                    </td>
                    <td style=${{ padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,.04)', textAlign:'center' }}>
                      ${h > 0
                        ? _h`<span style=${{ fontSize:13, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif" }}>${h}h</span>`
                        : _h`<span style=${{ fontSize:11, color:'rgba(255,255,255,.15)' }}>—</span>`}
                    </td>
                    ${['force','vitesse','endurance','mobilite'].map(q => _h`<td key=${q} style=${{ padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,.04)', fontSize:11, fontWeight:700,
                      color: w[q]>0 ? QUALITES_PERSO.find(x=>x.id===q).color : 'rgba(255,255,255,.1)' }}>${w[q]>0?w[q]+'/3':'—'}</td>`)}
                  </tr>`);
                });

                // Ligne sous-total mois
                rows.push(_h`<tr key=${'m'+m} style=${{ background:'rgba(56,189,248,.06)', borderTop:'2px solid rgba(56,189,248,.2)' }}>
                  <td colspan="2" style=${{ padding:'7px 10px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)', textTransform:'capitalize' }}>${moisLabel}</td>
                  <td style=${{ padding:'7px 10px', fontSize:10, color:'rgba(255,255,255,.4)' }}>${moisWeeks.filter(w=>w.cycle&&w.cycle!=='vide').length} sem. act.</td>
                  <td style=${{ padding:'7px 10px' }}></td>
                  <td style=${{ padding:'7px 10px', textAlign:'center' }}>
                    <span style=${{ fontSize:14, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif" }}>${moisH}h</span>
                  </td>
                  <td colspan="4" style=${{ padding:'7px 10px', fontSize:10, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>
                    ${moisWeeks.filter(w=>(w.heures||0)>0).length > 0 ? Math.round(moisH/moisWeeks.filter(w=>(w.heures||0)>0).length*10)/10+'h moy./sem.' : ''}
                  </td>
                </tr>`);
              }

              // Ligne total saison
              const totalH = weeks.reduce((a,w) => a+(w.heures||0), 0);
              rows.push(_h`<tr key="total" style=${{ background:'rgba(255,164,32,.08)', borderTop:'2px solid rgba(255,164,32,.3)' }}>
                <td colspan="2" style=${{ padding:'10px 10px', fontSize:13, fontWeight:800, color:'#FFA420' }}>TOTAL SAISON</td>
                <td style=${{ padding:'10px 10px', fontSize:11, color:'rgba(255,255,255,.5)' }}>${weeks.filter(w=>w.cycle&&w.cycle!=='vide').length} sem.</td>
                <td style=${{ padding:'10px 10px' }}></td>
                <td style=${{ padding:'10px 10px', textAlign:'center' }}>
                  <span style=${{ fontSize:18, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif" }}>${totalH}h</span>
                </td>
                <td colspan="4" style=${{ padding:'10px 10px', fontSize:11, color:'rgba(255,164,32,.6)', fontWeight:600 }}>
                  ≈ ${Math.round(totalH/11*10)/10}h/mois · ${weeks.filter(w=>(w.heures||0)>0).length > 0 ? Math.round(totalH/weeks.filter(w=>(w.heures||0)>0).length*10)/10 : 0}h/sem. moy.
                </td>
              </tr>`);

              return rows;
            })()}
          </tbody>
        </table>
      </div>

      ${isCoach ? _h`<div style=${{ marginTop:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', fontSize:11, color:'rgba(255,255,255,.4)' }}>
        💡 Pour saisir les heures : vue <b style=${{ color:'#fff' }}>Heatmap</b> → clique sur une semaine → champ "Heures d'entraînement"
      </div>` : null}
    </div>`}

    <!-- ── VUE VOLUME ── -->
    ${view === 'volume' && _h`<div>
      ${(() => {
        // Calcul par mois (4 semaines = 1 mois approx)
        const totalH = weeks.reduce((a,w) => a + (w.heures||0), 0);
        const weeksWithH = weeks.filter(w => (w.heures||0) > 0).length;
        const avgH = weeksWithH > 0 ? Math.round(totalH/weeksWithH*10)/10 : 0;

        // Grouper par mois (groupes de 4 semaines = approx)
        const mois = [];
        for (let m = 0; m < 11; m++) {
          const start = m * 4;
          const end = Math.min(start + 4, 44);
          const sems = weeks.slice(start, end);
          const hTotal = sems.reduce((a,w) => a + (w.heures||0), 0);
          const label = dateDebut
            ? new Date(new Date(dateDebut).getTime() + start*7*24*3600*1000).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
            : 'Mois ' + (m+1);
          mois.push({ label, sems, hTotal, start });
        }

        // Par cycle
        const hParCycle = {};
        CYCLES_PERSO.filter(c => c.id !== 'vide').forEach(c => {
          hParCycle[c.id] = { label:c.label, color:c.color, h: weeks.filter(w=>w.cycle===c.id).reduce((a,w)=>a+(w.heures||0),0) };
        });

        return _h`<div>
          <!-- KPIs saison -->
          <div style=${{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
            <div style=${{ background:'rgba(56,189,248,.08)', border:'1px solid rgba(56,189,248,.2)', borderRadius:12, padding:'14px', textAlign:'center' }}>
              <div style=${{ fontSize:28, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${totalH}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Heures saison</div>
            </div>
            <div style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', borderRadius:12, padding:'14px', textAlign:'center' }}>
              <div style=${{ fontSize:28, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${avgH}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Heures/semaine moy.</div>
            </div>
            <div style=${{ background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.2)', borderRadius:12, padding:'14px', textAlign:'center' }}>
              <div style=${{ fontSize:28, fontWeight:800, color:'#4CAF50', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>${Math.round(totalH/11*10)/10}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>Heures/mois moy.</div>
            </div>
          </div>

          <!-- Volume par mois -->
          <div style=${{ marginBottom:20 }}>
            <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Volume par mois</div>
            ${mois.map((m, mi) => {
              const maxH = Math.max(...mois.map(x => x.hTotal), 1);
              const pct = m.hTotal / maxH;
              return _h`<div key=${mi} style=${{ marginBottom:10 }}>
                <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <div style=${{ fontSize:12, fontWeight:600, textTransform:'capitalize' }}>${m.label}</div>
                  <div style=${{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>${m.sems.filter(s=>s.heures>0).length} sem. actives</span>
                    <span style=${{ fontSize:14, fontWeight:800, color:'#38BDF8', fontFamily:"'Barlow Condensed',sans-serif" }}>${m.hTotal}h</span>
                  </div>
                </div>
                <div style=${{ height:8, background:'rgba(255,255,255,.06)', borderRadius:4, overflow:'hidden' }}>
                  <div style=${{ height:'100%', width:(pct*100)+'%', background:'linear-gradient(90deg,#38BDF8,#7C6FFF)', borderRadius:4, transition:'width .3s' }}></div>
                </div>
                <!-- Détail semaines du mois -->
                <div style=${{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
                  ${m.sems.map((s,si) => {
                    const cy = getCycle(s.cycle);
                    return _h`<div key=${si} style=${{ background:cy.bg, border:'1px solid '+cy.color+'30', borderRadius:6, padding:'3px 7px', fontSize:10 }}>
                      <span style=${{ color:cy.color, fontWeight:700 }}>S${m.start+si+1}</span>
                      <span style=${{ color:'rgba(255,255,255,.5)', marginLeft:4 }}>${s.heures||0}h</span>
                    </div>`;
                  })}
                </div>
              </div>`;
            })}
          </div>

          <!-- Volume par cycle -->
          <div style=${{ marginBottom:16 }}>
            <div style=${{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Volume par cycle d'entraînement</div>
            ${Object.values(hParCycle).filter(c => c.h > 0).sort((a,b) => b.h-a.h).map((c,ci) => _h`<div key=${ci} style=${{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style=${{ width:10, height:10, borderRadius:2, background:c.color, flexShrink:0 }}></div>
              <div style=${{ fontSize:12, fontWeight:600, flex:1 }}>${c.label}</div>
              <div style=${{ height:6, flex:2, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                <div style=${{ height:'100%', width:(c.h/Math.max(...Object.values(hParCycle).map(x=>x.h),1)*100)+'%', background:c.color, borderRadius:3 }}></div>
              </div>
              <div style=${{ fontSize:14, fontWeight:800, color:c.color, fontFamily:"'Barlow Condensed',sans-serif", minWidth:35, textAlign:'right' }}>${c.h}h</div>
            </div>`)}
          </div>

          ${isCoach ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'10px 14px', fontSize:11, color:'rgba(255,255,255,.4)' }}>
            💡 Pour renseigner les heures : vue <b style=${{ color:'#fff' }}>Heatmap</b> → clique sur une semaine → champ "Heures d'entraînement"
          </div>` : null}
        </div>`;
      })()}
    </div>`}

    <!-- Panneau édition semaine -->
    ${selWeek !== null && _h`<div class="card" style=${{ marginTop:16, border:'1px solid rgba(255,164,32,.25)' }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style=${{ fontSize:14, fontWeight:800, color:'#FFA420' }}>${weeks[selWeek].label} — ${weekDate(selWeek)}</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${getCycle(weeks[selWeek].cycle).label}</div>
        </div>
        <div style=${{ display:'flex', gap:6 }}>
          ${selWeek > 0 ? _h`<button class="btn btn-sm" onClick=${() => setSelWeek(selWeek-1)}>← Préc.</button>` : null}
          ${selWeek < 43 ? _h`<button class="btn btn-sm" onClick=${() => setSelWeek(selWeek+1)}>Suiv. →</button>` : null}
          <button onClick=${() => setSelWeek(null)} style=${{ background:'none', border:'none', color:'rgba(255,255,255,.35)', fontSize:18, cursor:'pointer' }}>×</button>
        </div>
      </div>

      <!-- Cycle -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Cycle</div>
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
          ${CYCLES_PERSO.map(cy => _h`<button key=${cy.id}
            onClick=${() => updWeek(selWeek, 'cycle', cy.id)}
            style=${{ padding:'5px 11px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
              border:'1px solid '+(weeks[selWeek].cycle===cy.id?cy.color:'rgba(255,255,255,.1)'),
              background:weeks[selWeek].cycle===cy.id?cy.bg:'rgba(255,255,255,.03)',
              color:weeks[selWeek].cycle===cy.id?cy.color:'rgba(255,255,255,.4)',
              fontWeight:weeks[selWeek].cycle===cy.id?700:400 }}>${cy.label}</button>`)}
        </div>
      </div>

      <!-- Nature du travail -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Nature du travail</div>
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
          ${NATURE_TRAVAIL.map(nt => {
            const active = (weeks[selWeek].natureTravail||[]).includes(nt.id);
            return _h`<button key=${nt.id}
              onClick=${() => updWeek(selWeek, 'natureTravail', toggleNature(weeks[selWeek], nt.id))}
              style=${{ padding:'5px 11px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:11,
                border:'1px solid '+(active?nt.color:'rgba(255,255,255,.1)'),
                background:active?nt.color+'20':'rgba(255,255,255,.03)',
                color:active?nt.color:'rgba(255,255,255,.4)',
                fontWeight:active?700:400 }}>${nt.label}</button>`;
          })}
        </div>
      </div>

      <!-- Match -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Match / compétition</div>
        <input class="inp" value=${weeks[selWeek].match||''} onInput=${e => updWeek(selWeek,'match',e.target.value)} placeholder="Ex: Match J12, Tournoi..."/>
      </div>

      <!-- Charge -->
      <div style=${{ marginBottom:12 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <div class="lbl">Charge prévue</div>
          <div style=${{ fontSize:15, fontWeight:800, color:CHARGE_COLORS[weeks[selWeek].charge||0]||'rgba(255,255,255,.3)', fontFamily:"'Barlow Condensed',sans-serif" }}>
            ${['Non définie','Très légère','Légère','Modérée','Élevée','Maximale'][weeks[selWeek].charge||0]}
          </div>
        </div>
        <input type="range" min="0" max="5" value=${weeks[selWeek].charge||0}
          onInput=${e => updWeek(selWeek,'charge',parseInt(e.target.value))}
          style=${{ width:'100%', accentColor:CHARGE_COLORS[weeks[selWeek].charge||0]||'#FFA420' }}/>
        <div style=${{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
          <span style=${{ fontSize:9, color:'rgba(255,255,255,.2)' }}>0 — Repos</span>
          <span style=${{ fontSize:9, color:'rgba(255,255,255,.2)' }}>5 — Maximale</span>
        </div>
      </div>

      <!-- Qualités -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl" style=${{ marginBottom:8 }}>Qualités physiques ciblées</div>
        <div class="grid-2">
          ${QUALITES_PERSO.map(q => _h`<div key=${q.id} style=${{
            background:(weeks[selWeek][q.id]||0)>0?q.color+'10':'rgba(255,255,255,.03)',
            border:'1px solid '+((weeks[selWeek][q.id]||0)>0?q.color+'30':'rgba(255,255,255,.07)'),
            borderRadius:10, padding:'9px 11px'
          }}>
            <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <span style=${{ fontSize:12, fontWeight:700, color:q.color }}>${q.label}</span>
              <span style=${{ fontSize:9, color:'rgba(255,255,255,.35)' }}>${['—','Entretien','Développement','Priorité'][weeks[selWeek][q.id]||0]}</span>
            </div>
            <div style=${{ display:'flex', gap:3 }}>
              ${[0,1,2,3].map(v => _h`<button key=${v}
                onClick=${() => updWeek(selWeek,q.id,v)}
                style=${{ flex:1, height:26, borderRadius:6, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif',
                  background:v<=(weeks[selWeek][q.id]||0)&&v>0?q.color:'rgba(255,255,255,.06)',
                  color:v<=(weeks[selWeek][q.id]||0)&&v>0?'#fff':'rgba(255,255,255,.3)',
                  fontWeight:700, fontSize:11 }}>${v===0?'✕':v}</button>`)}
            </div>
          </div>`)}
        </div>
      </div>

      <!-- Planning 7 jours -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl" style=${{ marginBottom:8 }}>Planning jour par jour</div>
        ${isMobile ? _h`<div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
          ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((jour,ji) => _h`<div key=${jour} style=${{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'8px 10px' }}>
            <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style=${{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,.5)', minWidth:32 }}>${jour}</div>
              <input class="inp" style=${{ flex:1 }}
                value=${weeks[selWeek]['j'+ji]||''}
                onInput=${e => updWeek(selWeek,'j'+ji,e.target.value)}
                placeholder="Repos"/>
            </div>
            <div style=${{ display:'flex', gap:8, marginLeft:40 }}>
              <div style=${{ display:'flex', alignItems:'center', gap:4 }}>
                <span style=${{ fontSize:9, color:'rgba(255,255,255,.35)' }}>🕐 1</span>
                ${React.createElement(TimeSelect, { value: weeks[selWeek]['h'+ji]||'', small: true,
                  onChange: v => updWeek(selWeek,'h'+ji,v) })}
              </div>
              <div style=${{ display:'flex', alignItems:'center', gap:4 }}>
                <span style=${{ fontSize:9, color:'rgba(255,255,255,.35)' }}>🕐 2</span>
                ${React.createElement(TimeSelect, { value: weeks[selWeek]['h'+ji+'b']||'', small: true,
                  onChange: v => updWeek(selWeek,'h'+ji+'b',v) })}
              </div>
            </div>
          </div>`)}
        </div>` : _h`<div style=${{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6 }}>
          ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((jour,ji) => _h`<div key=${jour}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginBottom:3, textAlign:'center' }}>${jour}</div>
            <div style=${{ display:'flex', flexDirection:'column', gap:2, marginBottom:3, alignItems:'center' }}>
              ${React.createElement(TimeSelect, { value: weeks[selWeek]['h'+ji]||'', small: true,
                onChange: v => updWeek(selWeek,'h'+ji,v) })}
              ${React.createElement(TimeSelect, { value: weeks[selWeek]['h'+ji+'b']||'', small: true,
                onChange: v => updWeek(selWeek,'h'+ji+'b',v) })}
            </div>
            <input class="inp"
              value=${weeks[selWeek]['j'+ji]||''}
              onInput=${e => updWeek(selWeek,'j'+ji,e.target.value)}
              placeholder="Repos"
              style=${{ fontSize:10, padding:'5px 6px', textAlign:'center',
                borderColor:(weeks[selWeek]['j'+ji]||'')?'rgba(255,164,32,.35)':'rgba(255,255,255,.1)' }}/>
          </div>`)}
        </div>`}
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.25)', marginTop:4 }}>Ex: Muscu S1, Cardio 30min, Collectif, Match, Repos... — 2 horaires optionnels (ex: 18:00 muscu, 20:00 handball)</div>

        <!-- Dupliquer cette semaine (jours + horaires) vers d'autres semaines -->
        <div style=${{ marginTop:10 }}>
          ${!showDupWeekPerso ? _h`<button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.1)', border:'1px solid rgba(76,175,80,.3)', color:'#4CAF50', fontWeight:700 }}
            onClick=${() => { setShowDupWeekPerso(true); setDupTargetsPerso([]); }}>📋 Utiliser comme semaine type — dupliquer vers d'autres semaines</button>`
          : _h`<div style=${{ background:'rgba(76,175,80,.06)', border:'1px solid rgba(76,175,80,.25)', borderRadius:10, padding:'10px 12px' }}>
              <div style=${{ fontSize:11, fontWeight:700, color:'#4CAF50', marginBottom:8 }}>Dupliquer le planning jour/jour + horaires de ${weeks[selWeek].label||('S'+(weeks[selWeek].num||''))} vers :</div>
              <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                <button class="btn btn-sm" onClick=${() => setDupTargetsPerso(Array.from({length:weeks.length-selWeek-1},(_, i)=>selWeek+1+i))}
                  style=${{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:11 }}>Toutes les semaines suivantes</button>
                <button class="btn btn-sm" onClick=${() => setDupTargetsPerso(Array.from({length:Math.min(4,weeks.length-selWeek-1)},(_, i)=>selWeek+1+i))}
                  style=${{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:11 }}>+4 prochaines</button>
                <button class="btn btn-sm" onClick=${() => setDupTargetsPerso([])}
                  style=${{ background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.6)', fontSize:11 }}>Aucune</button>
              </div>
              <div style=${{ display:'flex', flexWrap:'wrap', gap:5, maxHeight:140, overflowY:'auto', marginBottom:10, padding:'8px', background:'rgba(0,0,0,.15)', borderRadius:8 }}>
                ${weeks.map((w,i) => i===selWeek ? null : _h`<button key=${i}
                  onClick=${() => setDupTargetsPerso(t => t.includes(i) ? t.filter(x=>x!==i) : [...t,i])}
                  style=${{ fontSize:10, padding:'3px 8px', borderRadius:12, border:'1px solid '+(dupTargetsPerso.includes(i)?'rgba(76,175,80,.5)':'rgba(255,255,255,.1)'),
                    background: dupTargetsPerso.includes(i)?'rgba(76,175,80,.2)':'rgba(255,255,255,.03)',
                    color: dupTargetsPerso.includes(i)?'#4CAF50':'rgba(255,255,255,.4)', fontWeight: dupTargetsPerso.includes(i)?700:400 }}>${w.label||('S'+(w.num||i+1))}</button>`)}
              </div>
              <div style=${{ display:'flex', gap:8 }}>
                <button class="btn btn-sm" style=${{ flex:1, background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.5)' }}
                  onClick=${() => setShowDupWeekPerso(false)}>Annuler</button>
                <button class="btn btn-sm" style=${{ flex:2, background:'#4CAF50', color:'#000', fontWeight:800 }}
                  disabled=${dupTargetsPerso.length===0}
                  onClick=${() => {
                    if (dupTargetsPerso.length===0) return;
                    if (!confirm('Dupliquer le planning jour/jour + horaires de cette semaine vers ' + dupTargetsPerso.length + ' semaine(s) ? Le match ne sera pas copié.')) return;
                    const source = weeks[selWeek];
                    const nw = weeks.map((w, i) => {
                      if (!dupTargetsPerso.includes(i)) return w;
                      const copy = { ...w };
                      [0,1,2,3,4,5,6].forEach(ji => {
                        copy['j'+ji] = source['j'+ji] || '';
                        copy['h'+ji] = source['h'+ji] || '';
                        copy['h'+ji+'b'] = source['h'+ji+'b'] || '';
                      });
                      return copy;
                    });
                    setWeeks(nw);
                    save(nw);
                    setShowDupWeekPerso(false);
                    setDupTargetsPerso([]);
                    alert('✅ Planning dupliqué vers ' + dupTargetsPerso.length + ' semaine(s) !');
                  }}>✓ Dupliquer vers ${dupTargetsPerso.length} semaine${dupTargetsPerso.length>1?'s':''}</button>
              </div>
            </div>`}
        </div>
      </div>

      <!-- Objectifs -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Objectifs précis de la semaine</div>
        <textarea class="inp" value=${weeks[selWeek].objectifs||''}
          onInput=${e => updWeek(selWeek,'objectifs',e.target.value)}
          placeholder="Ex: Atteindre 120kg squat. 3x cardio 30min. Travailler CMJ."
          style=${{ resize:'vertical', minHeight:60, marginTop:4 }}></textarea>
      </div>

      <!-- Notes -->
      <div>
        <div class="lbl">Notes / Points d'attention</div>
        <textarea class="inp" value=${weeks[selWeek].notes||''}
          onInput=${e => updWeek(selWeek,'notes',e.target.value)}
          placeholder="Contexte, fatigue, blessure à surveiller..."
          style=${{ resize:'vertical', minHeight:44, marginTop:4 }}></textarea>
      </div>
    </div>`}
  </div>`;
}


function PersoProfilTab({ player, editMode, editForm, setEditMode, setEditForm, savePlayer }) {

  const STATUS_BTNS = [
    { val:'ok',        lbl:'Disponible',  col:'#4CAF50' },
    { val:'blesse',    lbl:'Blessé',      col:'#FF4455' },
    { val:'surveille', lbl:'Surveillance',col:'#FF7A00' },
    { val:'repos',     lbl:'Repos',       col:'#FFB800' },
  ];

  if (!editMode) {
    return _h`<div>
      <div style=${{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button class="btn btn-primary btn-sm" onClick=${() => {
          setEditForm({
            name: player.name||'', email: player.email||'',
            sport: player.sport||'Handball', poste: player.poste||'',
            age: String(player.age||''), poids: String(player.poids||''), taille: String(player.taille||''),
            objectif: player.objectif||'', notes: player.notes||'',
            status: player.status||'ok', nutrition: player.nutrition||'competition',
          });
          setEditMode(true);
        }}>✏️ Modifier le profil</button>
      </div>

      <div style=${{ marginBottom:14 }}>
        <div class="lbl">Statut</div>
        <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
          ${STATUS_BTNS.map(s => _h`<button key=${s.val}
            onClick=${() => {
              // Si on repasse en ok/repos, archiver les blessures actives avec dateFin
              if (s.val === 'ok' || s.val === 'repos') {
                const today = localDateStr();
                const updBlessures = (player.blessures || []).map(b => {
                  if (b.statut === 'en cours' || b.statut === 'surveillance') {
                    return { ...b, statut: 'gueri', dateGueri: today };
                  }
                  return b;
                });
                // Update in both playersPerso and playerProfiles
                setDb(d => ({
                  ...d,
                  playersPerso: (d.playersPerso||[]).map(pl =>
                    pl.id === player.id ? { ...pl, status: s.val, blessures: updBlessures } : pl
                  ),
                  playerProfiles: (d.playerProfiles||[]).map(pl =>
                    pl.id === player.id ? { ...pl, status: s.val, blessures: updBlessures } : pl
                  )
                }));
              } else {
                savePlayer({ status: s.val });
              }
            }}
            style=${{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
                       border:'1px solid '+(player.status===s.val ? s.col+'50' : 'rgba(255,255,255,.1)'),
                       background: player.status===s.val ? s.col+'15' : 'rgba(255,255,255,.03)',
                       color: player.status===s.val ? s.col : 'rgba(255,255,255,.45)' }}
          >${s.lbl}</button>`)}
        </div>
      </div>

      <div class="grid-2" style=${{ marginBottom:10 }}>
        <div class="card">
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Infos physiques</div>
          ${[
            ['Âge',    (player.age||'—')+' ans'],
            ['Poids',  (player.poids||'—')+' kg'],
            ['Taille', (player.taille||'—')+' cm'],
            ['Poste',  player.poste||'—'],
            ['Sport',  player.sport||'Handball'],
          ].map(([l,v]) => _h`<div key=${l} style=${{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
            <span style=${{ fontSize:12, color:'rgba(255,255,255,.4)' }}>${l}</span>
            <span style=${{ fontSize:12, fontWeight:600 }}>${v}</span>
          </div>`)}
        </div>
        <div class="card">
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Connexion joueur</div>
          <div style=${{ background:'rgba(255,164,32,.06)', borderRadius:8, padding:'8px 10px', marginBottom:8 }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginBottom:2 }}>EMAIL</div>
            <div style=${{ fontSize:12, fontWeight:700, color:'#FFA420' }}>${player.email}</div>
          </div>
          <div style=${{ background:'rgba(56,189,248,.06)', borderRadius:8, padding:'8px 10px' }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', marginBottom:4 }}>MOT DE PASSE</div>
            <button onClick=${() => envoyerReinitialisation(player.email)} style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>🔑 Envoyer email mot de passe</button>
          </div>
        </div>
      </div>

      ${player.objectif ? _h`<div class="card">
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Objectif</div>
        <div style=${{ fontSize:13, lineHeight:1.6 }}>${player.objectif}</div>
      </div>` : null}
      ${player.notes ? _h`<div class="card" style=${{ marginTop:10 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Notes coach</div>
        <div style=${{ fontSize:12, color:'rgba(255,255,255,.6)', lineHeight:1.6 }}>${player.notes}</div>
      </div>` : null}
    </div>`;
  }

  // Edit mode
  const ef = editForm || {};
  return _h`<div>
    <div style=${{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div style=${{ fontSize:13, fontWeight:700 }}>Modifier le profil</div>
      <button class="btn btn-sm" onClick=${() => { setEditMode(false); setEditForm(null); }}>Annuler</button>
    </div>

    <div style=${{ marginBottom:10 }}>
      <div class="lbl">Statut</div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${STATUS_BTNS.map(s => _h`<button key=${s.val}
          onClick=${() => setEditForm(f => ({ ...f, status: s.val }))}
          style=${{ padding:'6px 14px', borderRadius:20, cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:12,
                     border:'1px solid '+(ef.status===s.val ? s.col+'50' : 'rgba(255,255,255,.1)'),
                     background: ef.status===s.val ? s.col+'15' : 'rgba(255,255,255,.03)',
                     color: ef.status===s.val ? s.col : 'rgba(255,255,255,.45)' }}
        >${s.lbl}</button>`)}
      </div>
    </div>

    <div class="edit-row" style=${{ marginBottom:10 }}>
      <div><div class="lbl">Nom</div><input class="inp" value=${ef.name||''} onInput=${e => setEditForm(f=>({...f, name:e.target.value}))}/></div>
      <div><div class="lbl">Poste</div><input class="inp" value=${ef.poste||''} onInput=${e => setEditForm(f=>({...f, poste:e.target.value}))} placeholder="Pivot..."/></div>
    </div>
    <div class="edit-row" style=${{ marginBottom:10 }}>
      <div><div class="lbl">Email</div><input class="inp" type="email" value=${ef.email||''} onInput=${e => setEditForm(f=>({...f, email:e.target.value}))}/></div>
    </div>
    <div class="edit-row" style=${{ marginBottom:10 }}>
      <div><div class="lbl">Âge</div><input class="inp" type="number" value=${ef.age||''} onInput=${e => setEditForm(f=>({...f, age:e.target.value}))}/></div>
      <div><div class="lbl">Poids kg</div><input class="inp" type="number" value=${ef.poids||''} onInput=${e => setEditForm(f=>({...f, poids:e.target.value}))}/></div>
      <div><div class="lbl">Taille cm</div><input class="inp" type="number" value=${ef.taille||''} onInput=${e => setEditForm(f=>({...f, taille:e.target.value}))}/></div>
    </div>
    <div style=${{ marginBottom:10 }}><div class="lbl">Sport</div><input class="inp" value=${ef.sport||'Handball'} onInput=${e => setEditForm(f=>({...f, sport:e.target.value}))}/></div>
    <div style=${{ marginBottom:10 }}>
      <div class="lbl">Phase nutritionnelle</div>
      <select class="inp" value=${ef.nutrition||'competition'} onChange=${e => setEditForm(f=>({...f, nutrition:e.target.value}))}>
        ${Object.entries(PLANS_NUT).map(([k,v]) => _h`<option key=${k} value=${k}>${v.label}</option>`)}
      </select>
    </div>
    <div style=${{ marginBottom:10 }}><div class="lbl">Objectif</div><input class="inp" value=${ef.objectif||''} onInput=${e => setEditForm(f=>({...f, objectif:e.target.value}))} placeholder="Objectif principal"/></div>
    <div style=${{ marginBottom:14 }}><div class="lbl">Notes coach</div><textarea class="inp" value=${ef.notes||''} onInput=${e => setEditForm(f=>({...f, notes:e.target.value}))} style=${{ resize:'vertical', minHeight:55 }} placeholder="Observations..."></textarea></div>
    <div style=${{ display:'flex', gap:10 }}>
      <button class="btn" style=${{ flex:1 }} onClick=${() => { setEditMode(false); setEditForm(null); }}>Annuler</button>
      <button class="btn btn-primary" style=${{ flex:2 }} onClick=${() => {
        savePlayer({ ...ef, age:parseInt(ef.age)||0, poids:parseInt(ef.poids)||0, taille:parseInt(ef.taille)||0 });
        setEditMode(false);
        setEditForm(null);
      }}>💾 Enregistrer</button>
    </div>
  </div>`;
}
