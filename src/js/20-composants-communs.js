
// ── SHARED CHAT COMPONENT ───────────────────────────────────────────────────
function SharedChat({ role, playerName, playerPos, playerAge, playerStatus, player }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([{ role:"ai", text:"Bonjour ! Je suis l'assistant PerfHand. Nutrition, recuperation, methodes d'entrainement, blessures... pose-moi tes questions !" }]);
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [history, loading]);

  async function send() {
    if (!msg.trim() || loading) return;
    const text = msg.trim();
    setHistory(h => [...h, { role:"user", text }]);
    setMsg("");
    setLoading(true);
    const playerCtx = player ? [
      'Nom: ' + player.name,
      player.sport ? 'Sport: ' + player.sport : '',
      player.poste ? 'Poste: ' + player.poste : '',
      player.age ? 'Age: ' + player.age + ' ans' : '',
      player.poids ? 'Poids: ' + player.poids + ' kg' : '',
      player.taille ? 'Taille: ' + player.taille + ' cm' : '',
      player.objectif ? 'Objectif: ' + player.objectif : '',
      player.status ? 'Statut: ' + player.status : '',
      (player.blessures && player.blessures.length > 0) ? 'Blessures actives: ' + player.blessures.filter(b => b.statut === 'en cours').map(b => b.zone).join(', ') : '',
      (player.muscuSeances && player.muscuSeances.length > 0) ? player.muscuSeances.length + ' seances muscu programmees' : '',
    ].filter(Boolean).join('. ') : (playerName + ', ' + playerPos + ', ' + playerAge + ' ans, ' + playerStatus);

    const sysPrompt = role === "coach"
      ? "Tu es un assistant expert en preparation physique handball de haut niveau cree par Leo Chabanis (@leo.perfhandball), preparateur physique de l'Union Sud Mayenne (Nationale 1). Reponds en francais, concis (4-5 phrases max). Donne des conseils pratiques sur l'entrainement, la periodisation, les methodes de force, la nutrition sportive, la gestion des blessures."
      : "Tu es un assistant performance handball personnel cree par Leo (@leo.perfhandball). Reponds en francais, concis et encourageant (3-5 phrases max). Tu connais ce joueur : " + playerCtx + ". Donne des conseils pratiques et personnalises sur la nutrition, la recuperation, la comprehension des entrainements, la preparation mentale et la gestion des blessures. Adapte chaque reponse au profil du joueur.";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 450,
          system: sysPrompt,
          messages: history.filter(m => m.role !== "ai" || history.indexOf(m) > 0)
            .concat([{ role:"user", content: text }])
            .slice(-10)
            .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }))
        })
      });
      const data = await res.json();
      const reply = (data.content && data.content[0] && data.content[0].text) || "Desolee, reessaie.";
      setHistory(h => [...h, { role:"ai", text: reply }]);
    } catch(e) {
      setHistory(h => [...h, { role:"ai", text:"Connexion impossible. Verifie ta connexion." }]);
    }
    setLoading(false);
  }

  return _h`<div>
    ${open && _h`<div class="chat-shared-bubble">
      <div style=${{ background:"linear-gradient(135deg,rgba(255,164,32,.12),rgba(255,164,32,.06))", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"14px 18px" }}>
        <div style=${{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <div style=${{ display:"flex", alignItems:"center", gap:8 }}>
            <div style=${{ width:32, height:32, borderRadius:"50%", background:"rgba(255,164,32,.2)", border:"2px solid rgba(255,164,32,.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
            <div>
              <div style=${{ fontSize:13, fontWeight:800 }}>Assistant PerfHand</div>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>by @leo.perfhandball · Répond en français</div>
            </div>
          </div>
          <button onClick=${() => setOpen(false)} style=${{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:20, lineHeight:1, cursor:"pointer" }}>×</button>
        </div>
        <div style=${{ display:"flex", gap:5, flexWrap:"wrap" }}>
          ${["💪 Musculation","🥗 Nutrition","😴 Récupération","🩺 Blessure","🧠 Mental"].map(s => _h`<button key=${s}
            onClick=${() => { setMsg(s.split(' ').slice(1).join(' ') + ' : '); }}
            style=${{ padding:"3px 8px", borderRadius:20, border:"1px solid rgba(255,164,32,.25)", background:"rgba(255,164,32,.08)", color:"rgba(255,164,32,.8)", fontSize:10, cursor:"pointer", fontFamily:"Inter,sans-serif" }}>${s}</button>`)}
        </div>
      </div>
      <div ref=${msgsRef} class="chat-msgs" style=${{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:10, maxHeight:"45vh" }}>
        ${history.map((m, i) => _h`<div key=${i} class=${m.role === "user" ? "msg-user" : "msg-ai"}>${m.text}</div>`)}
        ${loading && _h`<div class="msg-ai"><div class="dot-pulse"><span></span><span></span><span></span></div></div>`}
      </div>
      <div style=${{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"10px 14px", display:"flex", gap:8 }}>
        <input class="inp" value=${msg} style=${{ flex:1, fontSize:12 }}
          onInput=${e => setMsg(e.target.value)}
          onKeyDown=${e => e.key === "Enter" && send()}
          placeholder="Ta question..." />
        <button class="btn btn-primary btn-sm" onClick=${send} disabled=${!msg.trim() || loading}
          style=${{ flexShrink:0 }}>-></button>
      </div>
    </div>`}
    <button class="chat-shared-fab" onClick=${() => setOpen(o => !o)}
      style=${{ fontSize:open?18:22, fontWeight:800 }}>
      ${open ? "×" : "🤖"}
    </button>
  </div>`;
}

// ── IMAGE ZOOMABLE (clic pour agrandir en plein écran) ──────────────────────
function ZoomableImage({ src, alt, style, onError }) {
  const [zoom, setZoom] = useState(false);
  if (!src) return null;
  return _h`<span style=${{ display:'contents' }}>
    <img src=${src} alt=${alt || ''} onError=${onError}
      onClick=${e => { e.stopPropagation(); setZoom(true); }}
      style=${{ ...style, cursor:'zoom-in' }} />
    ${zoom && _h`<div style=${{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:99999,
        display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick=${() => setZoom(false)}>
      <img src=${src} alt=${alt || ''}
        style=${{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:12 }} />
      <button onClick=${() => setZoom(false)}
        style=${{ position:'fixed', top:16, right:16, background:'rgba(255,255,255,.12)', border:'none',
          color:'#fff', borderRadius:20, width:38, height:38, fontSize:20, cursor:'pointer' }}>×</button>
    </div>`}
  </span>`;
}

// ── WELLNESS POPUP (fusionné bilan + wellness) ──────────────────────────────
function ExerciceFichePopup({ exercice, onClose }) {
  if (!exercice) return null;
  const videoId = exercice.videoId || (exercice.videoUrl && exercice.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)?.[1]);
  const cues = exercice.cues || exercice.notes || '';
  const cuesList = cues ? cues.split('\n').filter(Boolean) : [];

  return _h`<div style=${{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 0 0' }}
    onClick=${onClose}>
    <div style=${{ background:'#141414', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', padding:'20px 20px 32px' }}
      onClick=${e => e.stopPropagation()}>

      <!-- Header -->
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style=${{ fontSize:18, fontWeight:800 }}>${exercice.nom}</div>
          ${exercice.variante ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:2 }}>${exercice.variante}</div>` : null}
        </div>
        <button onClick=${onClose} style=${{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:20, width:32, height:32, cursor:'pointer', fontSize:16, flexShrink:0 }}>×</button>
      </div>

      <!-- Tags -->
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        ${exercice.groupe ? _h`<span style=${{ fontSize:10, background:'rgba(255,164,32,.15)', color:'#FFA420', borderRadius:20, padding:'3px 10px', fontWeight:700 }}>${exercice.groupe}</span>` : null}
        ${exercice.musclesSec ? _h`<span style=${{ fontSize:10, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.5)', borderRadius:20, padding:'3px 10px' }}>+ ${exercice.musclesSec}</span>` : null}
        ${exercice.materiel ? _h`<span style=${{ fontSize:10, background:'rgba(56,189,248,.1)', color:'#38BDF8', borderRadius:20, padding:'3px 10px' }}>🔧 ${exercice.materiel}</span>` : null}
        ${exercice.niveau ? _h`<span style=${{ fontSize:10, background:'rgba(76,175,80,.1)', color:'#4CAF50', borderRadius:20, padding:'3px 10px' }}>${exercice.niveau}</span>` : null}
      </div>

      <!-- Vidéo YouTube -->
      ${videoId ? _h`<div style=${{ borderRadius:12, overflow:'hidden', marginBottom:16, background:'#000', aspectRatio:'16/9' }}>
        <iframe src=${'https://www.youtube.com/embed/'+videoId+'?rel=0&modestbranding=1'}
          style=${{ width:'100%', height:'100%', border:'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullscreen />
      </div>` : exercice.imageUrl ? _h`<${ZoomableImage} src=${exercice.imageUrl} style=${{ width:'100%', borderRadius:12, marginBottom:16, objectFit:'cover', maxHeight:200 }} />` : null}

      <!-- Points clés techniques -->
      ${cuesList.length > 0 ? _h`<div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.15)', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
        <div style=${{ fontSize:11, fontWeight:800, color:'#FFA420', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>📋 Points clés techniques</div>
        ${cuesList.map((c, i) => _h`<div key=${i} style=${{ display:'flex', gap:8, marginBottom:6, fontSize:13 }}>
          <span style=${{ color:'#FFA420', flexShrink:0 }}>•</span>
          <span style=${{ color:'rgba(255,255,255,.8)' }}>${c.replace(/^[•\-]\s*/, '')}</span>
        </div>`)}
      </div>` : null}

      <!-- Objectif -->
      ${exercice.objectif ? _h`<div style=${{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:8 }}>🎯 Objectif : <span style=${{ color:'rgba(255,255,255,.7)' }}>${exercice.objectif}</span></div>` : null}

    </div>
  </div>`;
}

function LoginInfoCard({ player, setDb }) {
  const [editing, setEditing] = React.useState(false);
  const [email, setEmail] = React.useState(player.email || '');

  function save() {
    setDb(db => {
      const update = (arr) => arr.map(p => p.id === player.id ? { ...p, email } : p);
      // Sync Firebase selon le type de joueur
      if (window.__perfhand_db && player.id) {
        const inProfiles = (db.playerProfiles||[]).some(p => p.id === player.id);
        if (inProfiles) {
          window.__perfhand_db.ref('perfhand/playerProfiles/' + player.id).update({ email });
        } else {
          window.__perfhand_db.ref('perfhand/playersPerso/' + player.id).update({ email });
        }
      }
      return {
        ...db,
        players: update(db.players||[]),
        playersPerso: update(db.playersPerso||[]),
        playerProfiles: update(db.playerProfiles||[])
      };
    });
    setEditing(false);
  }

  return _h`<div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)', borderRadius:12, padding:'14px 16px', marginTop:12 }}>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
      <div style=${{ fontSize:11, fontWeight:700, color:'#FFA420' }}>🔑 Identifiants de connexion du joueur</div>
      ${!editing ? _h`<button onClick=${() => { setEmail(player.email||''); setEditing(true); }}
        style=${{ background:'rgba(255,255,255,.06)', border:'1px solid #333', color:'#fff', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:10 }}>
        ✏️ Modifier
      </button>` : null}
    </div>
    ${editing ? _h`<div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
      <div>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Email</div>
        <input class="inp" type="email" value=${email} onInput=${e => setEmail(e.target.value)} placeholder="email@joueur.fr" style=${{ fontSize:13 }} />
      </div>
      <div style=${{ display:'flex', gap:8, marginTop:4 }}>
        <button class="btn btn-primary" onClick=${save} style=${{ fontSize:11 }}>✓ Enregistrer</button>
        <button class="btn" onClick=${() => setEditing(false)} style=${{ fontSize:11 }}>Annuler</button>
      </div>
    </div>` : _h`<div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div style=${{ background:'rgba(255,255,255,.04)', borderRadius:9, padding:'10px 12px' }}>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Email</div>
        <div style=${{ fontSize:13, fontWeight:700, color:'#FFA420', wordBreak:'break-all' }}>${player.email || '—'}</div>
      </div>
      <div style=${{ background:'rgba(255,255,255,.04)', borderRadius:9, padding:'10px 12px' }}>
        <div style=${{ fontSize:9, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Mot de passe</div>
        <button onClick=${() => envoyerReinitialisation(player.email)} style=${{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.3)', color:'#38BDF8', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>🔑 Envoyer email mot de passe</button>
      </div>
    </div>`}
    <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:8 }}>Le mot de passe n'est jamais stocké : le joueur le choisit via le lien reçu par email.</div>
  </div>`;
}

// Deux usages bien distincts, volontairement séparés dans le formulaire affiché :
// - mode "bilan" : le BILAN DE SÉANCE, juste après avoir validé une séance faite (RPE réel +
//   fatigue ressentie sur CETTE séance + note). N'a aucun sens de type "sommeil/humeur" ici.
// - mode "wellness" (par défaut) : le WELLNESS QUOTIDIEN, rempli une fois par jour, à tout moment
//   entre le réveil et 18h (avant le début des séances) — douleurs/énergie/sommeil/humeur/stress.
//   N'a pas de RPE/fatigue puisqu'aucune séance n'est forcément faite au moment de le remplir.
function WellnessPopup({ onClose, onSubmit, seance, obligatoire, morningRequired, mode }) {
  const isBilan = mode === 'bilan' || (!mode && obligatoire);
  const [rpeReel, setRpeReel] = useState((seance && seance.rpeReel) || null);
  const [fatigue, setFatigue] = useState((seance && seance.fatigue) || 3);
  const [douleurs, setDouleurs] = useState(3);
  const [energie, setEnergie] = useState(3);
  const [sommeil, setSommeil] = useState(3);
  const [humeur, setHumeur] = useState(3);
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState((seance && seance.notesJoueur) || '');

  const RPE_LABELS = ['','Très léger','Léger','Modéré','Assez dur','Difficile','Difficile+','Très difficile','Très difficile+','Maximal','Absolu max'];
  const rpeColor = (v) => !v ? 'rgba(255,255,255,.2)' : v <= 3 ? '#4CAF50' : v <= 5 ? '#8BC34A' : v <= 7 ? '#FFB800' : v <= 8 ? '#FF7A00' : '#FF4455';
  const scaleColor = (v) => v <= 2 ? '#FF4455' : v === 3 ? '#FFA420' : '#4CAF50';
  const fatigueColor = (v) => v <= 2 ? '#4CAF50' : v === 3 ? '#FFA420' : '#FF4455'; // inverse: frais=vert, épuisé=rouge

  const SCALES = [
    { id:'douleurs', label:'Douleurs / courbatures', val:douleurs, set:setDouleurs, low:"Très douloureux", high:"Aucune douleur" },
    { id:'energie',  label:"Niveau d'énergie",       val:energie,  set:setEnergie,  low:"Épuisé",         high:"Plein d'énergie" },
    { id:'sommeil',  label:'Qualité du sommeil',     val:sommeil,  set:setSommeil,  low:"Très mauvais",   high:'Excellent' },
    { id:'humeur',   label:'Humeur générale',        val:humeur,   set:setHumeur,   low:"Très basse",     high:'Excellente' },
    { id:'stress',   label:'Stress perçu',           val:stress,   set:setStress,   low:"Très stressé",   high:"Très serein" },
  ];

  // Score global : calculé uniquement à partir des champs réellement affichés dans ce mode.
  const bilanScore = rpeReel ? Math.round(((11 - rpeReel) / 2 + (6 - fatigue)) / 2) : null;
  const wellnessScore = Math.round([douleurs, energie, sommeil, humeur, stress].reduce((a,b)=>a+b,0) / 5);
  const score = isBilan ? bilanScore : wellnessScore;
  const scoreColor = score === null ? 'rgba(255,255,255,.3)' : score >= 4 ? '#4CAF50' : score === 3 ? '#FFA420' : '#FF4455';
  const locked = obligatoire || morningRequired;

  return _h`<div class="wellness-modal" onClick=${locked ? null : onClose}>
    <div class="wellness-card" onClick=${e => e.stopPropagation()}>
      <div style=${{ padding:"20px 22px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style=${{ fontSize:16, fontWeight:800 }}>${isBilan ? 'Bilan de séance' : 'Wellness du jour'}</div>
          <div style=${{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:3 }}>${isBilan ? (seance ? seance.nom : 'Comment s\'est passée la séance ?') : 'Comment tu te sens aujourd\'hui ?'}</div>
          ${obligatoire ? _h`<div style=${{ fontSize:10, color:'#FFA420', marginTop:4, fontWeight:600 }}>⚠️ Renseigne ton RPE pour valider la séance</div>` : null}
          ${morningRequired ? _h`<div style=${{ fontSize:10, color:'#FFA420', marginTop:4, fontWeight:600 }}>⚠️ À remplir chaque jour pour que ton coach puisse bien te suivre</div>` : null}
        </div>
        ${!locked ? _h`<button onClick=${onClose} style=${{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:20, cursor:'pointer' }}>×</button>` : null}
      </div>

      <div style=${{ padding:"20px 22px" }}>

        ${isBilan ? _h`<!-- ── BILAN DE SÉANCE : RPE réel + fatigue de CETTE séance ── -->
        <div style=${{ marginBottom:18 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style=${{ fontSize:13, fontWeight:700 }}>RPE — Perception de l'effort</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>${rpeReel ? RPE_LABELS[rpeReel] : 'Non renseigné'}</div>
            </div>
            <div style=${{ fontSize:24, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:rpeColor(rpeReel) }}>${rpeReel ? rpeReel+'/10' : '—'}</div>
          </div>
          <div style=${{ display:'flex', gap:4 }}>
            ${[1,2,3,4,5,6,7,8,9,10].map(v => _h`<button key=${v}
              onClick=${() => setRpeReel(rpeReel===v?null:v)}
              style=${{ flex:1, height:34, borderRadius:6, border:'none', cursor:'pointer',
                background: v===rpeReel ? rpeColor(v) : 'rgba(255,255,255,.06)',
                color: v===rpeReel ? '#fff' : 'rgba(255,255,255,.3)',
                fontWeight:800, fontSize:11, fontFamily:'Inter,sans-serif'
              }}>${v}</button>`)}
          </div>
          <div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Très léger</span>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Maximal</span>
          </div>
        </div>

        <div style=${{ marginBottom:18 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <div style=${{ fontSize:13, fontWeight:700 }}>Fatigue ressentie après séance</div>
            <div style=${{ fontSize:22, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:fatigueColor(fatigue) }}>${fatigue}/5</div>
          </div>
          <div style=${{ display:'flex', gap:5 }}>
            ${[1,2,3,4,5].map(v => _h`<button key=${v}
              onClick=${() => setFatigue(v)}
              style=${{ flex:1, height:34, borderRadius:8, border:'none', cursor:'pointer',
                background: v<=fatigue ? fatigueColor(v) : 'rgba(255,255,255,.06)',
                color: v<=fatigue ? '#fff' : 'rgba(255,255,255,.3)',
                fontWeight:700, fontSize:13, fontFamily:'Inter,sans-serif'
              }}>${v}</button>`)}
          </div>
          <div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Très frais</span>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.25)' }}>Épuisé</span>
          </div>
        </div>` : _h`<!-- ── WELLNESS QUOTIDIEN : ressenti général du jour, hors séance ── -->
        ${SCALES.map(q => _h`<div key=${q.id} style=${{ marginBottom:18 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style=${{ fontSize:13, fontWeight:600 }}>${q.label}</div>
            <div style=${{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:scaleColor(q.val) }}>${q.val}/5</div>
          </div>
          <div style=${{ display:'flex', gap:4 }}>
            ${[1,2,3,4,5].map(v => _h`<button key=${v} class="wellness-btn"
              onClick=${() => q.set(v)}
              style=${{ background: v<=q.val ? scaleColor(v) : 'rgba(255,255,255,.06)', color: v<=q.val ? '#fff' : 'rgba(255,255,255,.2)', border:'none' }}
            >${v}</button>`)}
          </div>
          <div style=${{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.2)' }}>${q.low}</span>
            <span style=${{ fontSize:9, color:'rgba(255,255,255,.2)' }}>${q.high}</span>
          </div>
        </div>`)}`}

        <!-- Score global -->
        ${score !== null ? _h`<div style=${{ background: scoreColor+'12', border:'1px solid '+scoreColor+'30', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
          <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:4 }}>${isBilan ? 'Score séance' : 'Score wellness global'}</div>
              <div style=${{ fontSize:11, color:'rgba(255,255,255,.55)', lineHeight:1.6 }}>
                ${score <= 2 ? (isBilan ? 'Séance très exigeante. Pense à bien récupérer.' : 'Attention : niveau de forme bas. Privilégie la récupération.') :
                  score === 3 ? 'Niveau correct. Reste attentif aux signaux de ton corps.' :
                  (isBilan ? 'Séance bien gérée.' : 'Excellent niveau de forme. Continue sur cette lancée !')}
              </div>
            </div>
            <div style=${{ fontSize:38, fontWeight:800, color:scoreColor, fontFamily:"'Barlow Condensed',sans-serif", marginLeft:16 }}>${score}/5</div>
          </div>
        </div>` : null}

        <!-- Notes -->
        <div style=${{ marginBottom:18 }}>
          <div style=${{ fontSize:13, fontWeight:700, marginBottom:8 }}>Note (facultatif)</div>
          <textarea class="inp" value=${notes} onInput=${e => setNotes(e.target.value)}
            placeholder=${isBilan ? "Ce que tu as ressenti pendant la séance, douleurs, points positifs..." : "Comment tu te sens aujourd'hui..."}
            style=${{ resize:'vertical', minHeight:60 }}></textarea>
        </div>

        <div style=${{ display:'flex', gap:10 }}>
          ${!locked ? _h`<button class="btn" style=${{ flex:1 }} onClick=${onClose}>Plus tard</button>`
            : (obligatoire ? _h`<button class="btn" style=${{ flex:1 }} onClick=${onClose}>Annuler</button>` : null)}
          <button class="btn btn-primary" style=${{ flex:2, opacity: (obligatoire && !rpeReel) ? 0.5 : 1 }} onClick=${() => {
            if (obligatoire && !rpeReel) { alert('Renseigne ton RPE (perception de l\'effort) pour valider la séance.'); return; }
            const payload = isBilan
              ? { rpeReel, fatigue, notesJoueur: notes, dateRessenti: localDateStr() }
              : { douleurs, energie, sommeil, humeur, stress, notesJoueur: notes, dateRessenti: localDateStr() };
            onSubmit(payload);
          }}>${obligatoire ? '✅ Valider la séance' : (morningRequired ? '✅ Envoyer mon bien-être du matin' : 'Envoyer au coach')}</button>
        </div>
      </div>
    </div>
  </div>`;
}


// ── RESSOURCES VIEW ─────────────────────────────────────────────────────────
function RessourcesView({ role, db, setDb }) {
  if (!db) db = {}; if (!setDb) setDb = () => {};
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState("");
  const [onglet, setOnglet] = useState("methodes");

  const filteredRes = RESSOURCES.filter(r =>
    !search || r.titre.toLowerCase().includes(search.toLowerCase()) ||
    r.tag.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGloss = GLOSSAIRE.filter(g =>
    !search || g.terme.toLowerCase().includes(search.toLowerCase()) ||
    g.def.toLowerCase().includes(search.toLowerCase())
  );

  return _h`<div class="page-pad" style=${{ maxWidth:"100%", overflowX:"hidden" }}>
    <${SectionTitle} sub="Apprentissage" title="RESSOURCES" />

    <!-- Search -->
    <div style=${{ position:"relative", marginBottom:20 }}>
      <input class="inp" value=${search} onInput=${e => setSearch(e.target.value)}
        placeholder="Rechercher une methode, un terme..." style=${{ paddingLeft:36 }} />
      <span style=${{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)", fontSize:14 }}>?</span>
    </div>

    <!-- Onglets -->
    <div style=${{ display:"flex", gap:4, marginBottom:22, background:"rgba(255,255,255,0.03)", borderRadius:12, padding:4 }}>
      ${[["methodes","Methodes d'entrainement"],["glossaire","Glossaire"]].map(([id,l]) =>
        _h`<button key=${id} onClick=${() => setOnglet(id)} style=${{
          flex:1, background: onglet===id ? "rgba(255,255,255,0.07)" : "transparent",
          border: onglet===id ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
          color: onglet===id ? "#fff" : "rgba(255,255,255,0.4)",
          padding:"9px 6px", borderRadius:10, fontSize:12, fontWeight: onglet===id ? 600 : 400
        }}>${l}</button>`
      )}
    </div>

    ${onglet === "methodes" && _h`<div>
      ${filteredRes.length === 0 && _h`<div style=${{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,0.3)" }}>Aucun resultat</div>`}
      ${filteredRes.map(r => _h`<div key=${r.id}>
        <div class=${"resource-card" + (openId === r.id ? " open" : "")} style=${{ marginBottom:8 }}
          onClick=${() => setOpenId(openId === r.id ? null : r.id)}>
          <div style=${{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style=${{ flex:1 }}>
              <div style=${{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span class="resource-tag" style=${{ background: r.tagColor + "18", color: r.tagColor }}>${r.tag}</span>
              </div>
              <div style=${{ fontSize:15, fontWeight:700, marginBottom:4 }}>${r.titre}</div>
              <div style=${{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.6 }}>${r.resume}</div>
            </div>
            <div style=${{ fontSize:18, color:"rgba(255,255,255,0.3)", marginLeft:14, flexShrink:0, transition:"transform 0.2s", transform: openId===r.id ? "rotate(180deg)" : "rotate(0deg)" }}>v</div>
          </div>
        </div>

        ${openId === r.id && _h`<div style=${{ background:"rgba(255,164,32,0.04)", border:"1px solid rgba(255,164,32,0.15)", borderRadius:14, padding:"18px 20px", marginBottom:8, marginTop:-4 }}>
          ${r.contenu.map((c, i) => _h`<div key=${i} style=${{ marginBottom: i < r.contenu.length-1 ? 18 : 0 }}>
            <div style=${{ fontSize:12, fontWeight:700, color:"#FFA420", marginBottom:6 }}>${c.titre}</div>
            <div style=${{ fontSize:13, color:"rgba(255,255,255,0.65)", lineHeight:1.8 }}>${c.texte}</div>
          </div>`)}
        </div>`}
      </div>`)}
    </div>`}

    ${onglet === "glossaire" && _h`<div>
      ${filteredGloss.length === 0 && _h`<div style=${{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,0.3)" }}>Aucun resultat</div>`}
      ${filteredGloss.map(g => _h`<div key=${g.terme} style=${{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 18px", marginBottom:8 }}>
        <div style=${{ display:"flex", gap:12, alignItems:"flex-start" }}>
          <div style=${{ fontSize:12, fontWeight:800, color:"#FFA420", minWidth:140, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:0.5 }}>${g.terme}</div>
          <div style=${{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.7, flex:1 }}>${g.def}</div>
        </div>
      </div>`)}
    </div>`}
  </div>`;
}

// ── ATOMS ──────────────────────────────────────────────────────────────────

function Avatar({ name, color, size }) {
  color = color || ACCENT; size = size || 36;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  return _h`<div class="avatar" style=${{
    width:size, height:size,
    background: color + "22",
    border: "2px solid " + color + "55",
    fontSize: size * 0.32,
    color: color,
    fontFamily: "'Barlow Condensed', sans-serif"
  }}>${initials}</div>`;
}

function Badge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.ok;
  return _h`<span class="badge" style=${{ background: s.color + "18", color: s.color }}>${s.label}</span>`;
}

function LoadBar({ v }) {
  const c = v > 85 ? "#FF4455" : v > 70 ? "#FFB800" : ACCENT;
  return _h`<div style=${{ display:"flex", alignItems:"center", gap:8 }}>
    <div class="progress-bar" style=${{ flex:1 }}>
      <div class="progress-fill" style=${{ width: v + "%", background: c }}></div>
    </div>
    <span style=${{ fontSize:11, color:"rgba(255,255,255,0.4)", minWidth:30, textAlign:"right" }}>${v}%</span>
  </div>`;
}

function Card({ children, accent, style }) {
  return _h`<div class=${accent ? "card-accent" : "card"} style=${style || {}}>${children}</div>`;
}

function Btn({ children, onClick, primary, danger, small, full, disabled }) {
  let cls = "btn";
  if (primary) cls += " btn-primary";
  if (danger) cls += " btn-danger";
  if (small) cls += " btn-sm";
  return _h`<button
    class=${cls}
    onClick=${onClick}
    disabled=${disabled}
    style=${{ width: full ? "100%" : "auto", opacity: disabled ? 0.4 : 1 }}
  >${children}</button>`;
}

function Inp({ label, value, onChange, type, placeholder }) {
  return _h`<div style=${{ marginBottom:14 }}>
    ${label && _h`<div class="lbl">${label}</div>`}
    <input
      class="inp"
      type=${type || "text"}
      value=${value}
      onInput=${e => onChange(e.target.value)}
      placeholder=${placeholder || ""}
    />
  </div>`;
}

function SectionTitle({ title, sub }) {
  return _h`<div style=${{ marginBottom:22 }}>
    ${sub && _h`<div class="page-sub">${sub}</div>`}
    <h1 class="page-title">${title}</h1>
  </div>`;
}
