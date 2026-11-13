// ── SUIVI EN DIRECT — CÔTÉ JOUEUR : messages du coach pendant la séance ──────────
// Affiche en bas d'écran les messages du coach non encore lus (avec vibration à l'arrivée).
// « Bien reçu » les marque comme lus : le coach le voit dans son suivi.
function MessagesCoachDirect({ player }) {
  const app = useApp() || {};
  const actif = suiviDirectAutorise(app.user, player);
  const [messages, setMessages] = useState([]);
  React.useEffect(() => {
    if (!actif) return;
    let r = null, h = null, annule = false, vus = null;
    (window.__perfhand_auth_pret || Promise.resolve()).then(() => {
      if (annule) return;
      r = suiviDirectRef(player.id, 'messages');
      if (!r) return;
      h = r.on('value', snap => {
        const liste = Object.entries(snap.val() || {})
          .map(([id, m]) => ({ id, ...m }))
          .filter(m => m.de === 'coach' && !m.lu)
          .sort((a, b) => (a.ts || 0) - (b.ts || 0));
        if (vus && liste.some(m => !vus.has(m.id)) && navigator.vibrate) navigator.vibrate([150, 80, 150]);
        vus = new Set(liste.map(m => m.id));
        setMessages(liste);
      }, () => {});
    });
    return () => { annule = true; if (r && h) r.off('value', h); };
  }, [actif, player && player.id]);
  if (!actif || !messages.length) return null;
  const marquerLu = m => { const r = suiviDirectRef(player.id, 'messages/' + m.id); if (r) r.update({ lu: true, luA: Date.now() }).catch(() => {}); };
  return _h`<div style=${{ position:'fixed', left:12, right:12, bottom:14, zIndex:3000, display:'flex', flexDirection:'column', gap:8, maxWidth:520, margin:'0 auto' }}>
    ${messages.slice(-3).map(m => _h`<div key=${m.id} style=${{ background:'#1b1408', border:'2px solid #FFA420', borderRadius:14, padding:'12px 14px', boxShadow:'0 8px 30px rgba(0,0,0,.6)' }}>
      <div style=${{ fontSize:10, color:'#FFA420', fontWeight:800, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>💬 Message du coach</div>
      <div style=${{ fontSize:15, fontWeight:700, color:'#fff', lineHeight:1.35, marginBottom:10 }}>${m.texte}</div>
      <button class="btn btn-primary" style=${{ width:'100%' }} onClick=${() => marquerLu(m)}>👍 Bien reçu</button>
    </div>`)}
  </div>`;
}

// ── SUIVI EN DIRECT — CÔTÉ COACH ───────────────────────────────────────────────
// Joueurs en séance (dernière série validée il y a moins de 30 min) : exercice et série en cours,
// fil des séries avec le ressenti du joueur, et envoi de messages qui s'affichent sur son écran.
const SUIVI_MESSAGES_RAPIDES = ['Bien joué 💪', 'Monte la charge', 'Baisse la charge', 'Contrôle la descente', 'Prends ton temps de repos', 'Garde le dos droit', 'Tu me dis si ça tire ?'];
const SUIVI_DELAI_INACTIF = 30 * 60 * 1000;

function SuiviDirectCoach({ players }) {
  const [live, setLive] = useState({});
  const [maintenant, setMaintenant] = useState(Date.now());
  const [ouvert, setOuvert] = useState(null);
  const [brouillons, setBrouillons] = useState({});
  React.useEffect(() => {
    if (!window.__perfhand_db) return;
    let r = null, h = null, annule = false;
    (window.__perfhand_auth_pret || Promise.resolve()).then(() => {
      if (annule) return;
      r = window.__perfhand_db.ref('perfhand/seancesLive');
      h = r.on('value', snap => setLive(snap.val() || {}), () => setLive({}));
    });
    const t = setInterval(() => setMaintenant(Date.now()), 15000);
    return () => { annule = true; clearInterval(t); if (r && h) r.off('value', h); };
  }, []);

  const aujourdhui = localDateStr();
  const suivis = (players || [])
    .map(p => ({ p, l: live[p.id] }))
    .filter(x => x.l && x.l.maj && localDateStr(new Date(x.l.maj)) === aujourdhui);
  const enCours = suivis.filter(x => x.l.statut === 'en_cours' && maintenant - x.l.maj < SUIVI_DELAI_INACTIF)
    .sort((a, b) => b.l.maj - a.l.maj);
  const autres = suivis.filter(x => !enCours.includes(x)).sort((a, b) => b.l.maj - a.l.maj);

  const depuis = ts => { const s = Math.max(0, Math.round((maintenant - ts) / 1000)); return s < 60 ? 'à l\'instant' : s < 3600 ? 'il y a ' + Math.round(s / 60) + ' min' : 'il y a ' + Math.floor(s / 3600) + ' h'; };
  const heure = ts => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const ressentiDe = id => SUIVI_RESSENTIS.find(r => r.id === id);
  function envoyer(pid, texte) {
    texte = String(texte || '').trim();
    if (!texte) return;
    const r = suiviDirectRef(pid, 'messages');
    if (!r) return;
    r.push({ texte: texte.slice(0, 300), de: 'coach', ts: Date.now(), lu: false })
      .then(() => setBrouillons(b => ({ ...b, [pid]: '' })))
      .catch(e => alert('Message non envoyé : ' + ((e && e.message) || e)));
  }

  function carte(x, enDirect) {
    const { p, l } = x;
    const journal = Object.values(l.journal || {}).filter(Boolean).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const messages = Object.values(l.messages || {}).filter(m => m && m.de === 'coach').sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 3);
    const dr = ressentiDe(l.dernierRessenti);
    const nbEx = l.nbExercices || null;
    const avancement = nbEx ? Math.min(100, Math.round(((l.exIndex || 0) + (l.totalSeries ? (l.serie || 0) / l.totalSeries : 0)) / nbEx * 100)) : null;
    const estOuvert = enDirect || ouvert === p.id;
    return _h`<div key=${p.id} style=${{ border:'1px solid ' + (enDirect ? 'rgba(255,68,85,.35)' : 'rgba(255,255,255,.08)'), background: enDirect ? 'rgba(255,68,85,.05)' : 'rgba(255,255,255,.02)', borderRadius:12, padding:'10px 12px' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', cursor: enDirect ? 'default' : 'pointer' }} onClick=${() => !enDirect && setOuvert(ouvert === p.id ? null : p.id)}>
        ${enDirect ? _h`<span style=${{ width:8, height:8, borderRadius:'50%', background:'#FF4455', boxShadow:'0 0 8px #FF4455' }}></span>` : null}
        <span style=${{ fontSize:13, fontWeight:800 }}>${p.name}</span>
        <span style=${{ fontSize:11, color:'rgba(255,255,255,.45)' }}>${l.seanceNom || 'Séance'}</span>
        <span style=${{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,.35)' }}>
          ${l.statut === 'terminee' ? '✅ terminée' : enDirect ? 'démarrée ' + depuis(l.debut || l.maj) : 'arrêtée'} · dernière série ${depuis(l.maj)}
        </span>
      </div>
      ${estOuvert ? _h`<div style=${{ marginTop:8 }}>
        <div style=${{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'baseline' }}>
          <span style=${{ fontSize:15, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>
            Exercice ${(l.exIndex || 0) + 1}${nbEx ? '/' + nbEx : ''} · ${l.exNom || '—'}
          </span>
          <span style=${{ fontSize:15, fontWeight:800, color:'#FFA420', fontFamily:"'Barlow Condensed',sans-serif" }}>Série ${l.serie || 0}/${l.totalSeries || '?'}</span>
          <span style=${{ fontSize:11, color:'rgba(255,255,255,.45)' }}>Prévu : ${l.prevu || '—'}${l.charge ? ' · ' + l.charge : ''}</span>
          ${dr ? _h`<span style=${{ fontSize:11, fontWeight:700, color:dr.color, background:dr.color + '1a', borderRadius:20, padding:'1px 8px' }}>${dr.emoji} ${dr.label}</span>` : null}
        </div>
        ${avancement != null ? _h`<div style=${{ height:4, background:'rgba(255,255,255,.07)', borderRadius:2, margin:'7px 0' }}>
          <div style=${{ height:'100%', width:avancement + '%', background:'#FFA420', borderRadius:2 }}></div>
        </div>` : null}
        <div style=${{ display:'flex', gap:12, flexWrap:'wrap', marginTop:6 }}>
          <div style=${{ flex:'1 1 220px', minWidth:0 }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Séries validées</div>
            <div style=${{ display:'flex', flexDirection:'column', gap:3, maxHeight:150, overflowY:'auto' }}>
              ${journal.length ? journal.map((j, i) => { const r = ressentiDe(j.ressenti); return _h`<div key=${i} style=${{ fontSize:11, color:'rgba(255,255,255,.6)' }}>
                <span style=${{ color:'rgba(255,255,255,.35)' }}>${heure(j.ts)}</span> · ${j.exNom} · S${j.serie}/${j.totalSeries}
                ${r ? _h` · <span style=${{ color:r.color, fontWeight:700 }}>${r.emoji} ${r.label}</span>` : null}
              </div>`; }) : _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.3)' }}>—</div>`}
            </div>
          </div>
          <div style=${{ flex:'1 1 260px', minWidth:0 }}>
            <div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Message au joueur</div>
            <div style=${{ display:'flex', gap:6 }}>
              <input class="inp" style=${{ flex:1, fontSize:12 }} placeholder="Ex : garde les coudes serrés"
                value=${brouillons[p.id] || ''} onInput=${e => setBrouillons(b => ({ ...b, [p.id]: e.target.value }))}
                onKeyDown=${e => { if (e.key === 'Enter') envoyer(p.id, brouillons[p.id]); }} />
              <button class="btn btn-primary btn-sm" onClick=${() => envoyer(p.id, brouillons[p.id])}>Envoyer</button>
            </div>
            <div style=${{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5 }}>
              ${SUIVI_MESSAGES_RAPIDES.map(t => _h`<button key=${t} onClick=${() => envoyer(p.id, t)}
                style=${{ fontSize:10, padding:'3px 8px', borderRadius:20, background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.3)', color:'#FFA420', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>${t}</button>`)}
            </div>
            ${messages.length ? _h`<div style=${{ marginTop:6, display:'flex', flexDirection:'column', gap:2 }}>
              ${messages.map((m, i) => _h`<div key=${i} style=${{ fontSize:10, color:'rgba(255,255,255,.45)' }}>
                ${heure(m.ts)} · « ${m.texte} » ${m.lu ? _h`<span style=${{ color:'#4CAF50', fontWeight:700 }}>✓ lu</span>` : _h`<span style=${{ color:'rgba(255,255,255,.3)' }}>· envoyé</span>`}
              </div>`)}
            </div>` : null}
          </div>
        </div>
      </div>` : null}
    </div>`;
  }

  return _h`<div class="card" style=${{ marginBottom:16, border: enCours.length ? '1px solid rgba(255,68,85,.4)' : '1px solid rgba(255,255,255,.08)' }}>
    <div style=${{ display:'flex', alignItems:'baseline', gap:8, marginBottom: (enCours.length || autres.length) ? 10 : 2 }}>
      <div style=${{ fontSize:13, fontWeight:800 }}>🔴 Séances en direct</div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.35)' }}>${enCours.length ? enCours.length + ' joueur' + (enCours.length > 1 ? 's' : '') + ' en séance' : 'Aucun joueur en séance en ce moment'}</div>
    </div>
    ${!enCours.length && !autres.length ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Dès qu'un joueur valide une série, il apparaît ici avec l'exercice, la série et son ressenti.</div>` : null}
    <div style=${{ display:'flex', flexDirection:'column', gap:8 }}>
      ${enCours.map(x => carte(x, true))}
      ${autres.length ? _h`<div style=${{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:1, marginTop: enCours.length ? 6 : 0 }}>Plus tôt aujourd'hui</div>` : null}
      ${autres.map(x => carte(x, false))}
    </div>
  </div>`;
}
