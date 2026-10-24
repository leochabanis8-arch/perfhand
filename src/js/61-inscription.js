
// ── REGISTER SCREEN — Inscription nouveau préparateur ─────────────────────────
function RegisterScreen({ onBack }) {
  const [nom, setNom] = useState('');
  const [structure, setStructure] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [sport, setSport] = useState('Handball');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function doRegister() {
    if (!nom.trim() || !email.trim() || !pw.trim()) { setErr('Remplis tous les champs obligatoires.'); return; }
    if (pw !== pw2) { setErr('Les mots de passe ne correspondent pas.'); return; }
    if (pw.length < 6) { setErr('Mot de passe minimum 6 caractères.'); return; }
    setLoading(true); setErr('');
    try {
      // Créer le compte Firebase Auth
      const cred = await window.__perfhand_auth.createUserWithEmailAndPassword(email.trim().toLowerCase(), pw.trim());
      const uid = cred.user.uid;
      const tenantId = 'tenant_' + uid.slice(0, 12);
      // Créer le tenant dans Firebase DB
      const tenant = {
        id: tenantId, uid, email: email.trim().toLowerCase(),
        nom: nom.trim(), structure: structure.trim(), sport,
        dateCreation: new Date().toISOString().split('T')[0],
        plan: 'free', actif: true,
        clubs: [], playersPerso: [],
      };
      await window.__perfhand_db.ref('tenants/' + tenantId).set(tenant);
      // Stocker tenantId dans le profil auth
      await window.__perfhand_db.ref('tenants_by_uid/' + uid).set(tenantId);
      setDone(true);
    } catch(e) {
      if (e.code === 'auth/email-already-in-use') setErr('Cet email est déjà utilisé.');
      else if (e.code === 'auth/invalid-email') setErr('Email invalide.');
      else setErr('Erreur : ' + e.message);
    }
    setLoading(false);
  }

  if (done) return _h`<div class="login-wrap">
    <div class="login-grid"></div>
    <div class="login-box">
      <div style=${{ textAlign:'center', marginBottom:32 }}>
        <div class="logo" style=${{ fontSize:42 }}><span>PERF</span>HAND</div>
      </div>
      <div class="login-card" style=${{ padding:'32px 24px', textAlign:'center' }}>
        <div style=${{ fontSize:40, marginBottom:16 }}>✅</div>
        <div style=${{ fontSize:16, fontWeight:800, color:'#fff', marginBottom:8 }}>Compte créé !</div>
        <div style=${{ fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:24 }}>Tu peux maintenant te connecter avec ton email et mot de passe.</div>
        <button class="btn btn-primary" onClick=${onBack}>Se connecter</button>
      </div>
    </div>
  </div>`;

  return _h`<div class="login-wrap">
    <div class="login-grid"></div>
    <div class="login-box">
      <div style=${{ textAlign:'center', marginBottom:32 }}>
        <div class="logo" style=${{ fontSize:42 }}><span>PERF</span>HAND</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,0.25)', letterSpacing:3, textTransform:'uppercase', marginTop:6 }}>Plateforme Performance Handball</div>
      </div>
      <div class="login-card">
        <div style=${{ padding:'24px 20px' }}>
          <div style=${{ fontSize:14, fontWeight:700, marginBottom:4, textAlign:'center' }}>Créer un compte</div>
          <div style=${{ fontSize:11, color:'rgba(255,255,255,.35)', textAlign:'center', marginBottom:20 }}>Espace préparateur physique</div>

          <div style=${{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <div class="inp-label">Nom complet *</div>
              <input class="inp" type="text" placeholder="Prénom Nom" value=${nom} onInput=${e => setNom(e.target.value)} />
            </div>
            <div>
              <div class="inp-label">Structure / Club</div>
              <input class="inp" type="text" placeholder="Ex : USM Handball, Auto-entrepreneur..." value=${structure} onInput=${e => setStructure(e.target.value)} />
            </div>
            <div>
              <div class="inp-label">Sport principal</div>
              <select class="inp" value=${sport} onChange=${e => setSport(e.target.value)}>
                ${['Handball','Football','Basketball','Rugby','Volley','Tennis','Natation','Athlétisme','Autre'].map(s => _h`<option key=${s} value=${s}>${s}</option>`)}
              </select>
            </div>
            <div>
              <div class="inp-label">Email *</div>
              <input class="inp" type="email" placeholder="ton@email.fr" value=${email} onInput=${e => setEmail(e.target.value)} />
            </div>
            <div>
              <div class="inp-label">Mot de passe * (min. 6 caractères)</div>
              <input class="inp" type="password" placeholder="••••••••" value=${pw} onInput=${e => setPw(e.target.value)} />
            </div>
            <div>
              <div class="inp-label">Confirmer le mot de passe *</div>
              <input class="inp" type="password" placeholder="••••••••" value=${pw2} onInput=${e => setPw2(e.target.value)} />
            </div>
          </div>

          ${err ? _h`<div style=${{ color:'#FF4455', fontSize:12, marginTop:12, padding:'8px 12px', background:'rgba(255,68,85,.08)', borderRadius:8 }}>${err}</div>` : null}

          <button class="btn btn-primary" style=${{ width:'100%', marginTop:20 }}
            onClick=${doRegister} disabled=${loading}>
            ${loading ? 'Création en cours...' : 'Créer mon espace'}
          </button>
          <button class="btn" style=${{ width:'100%', marginTop:8 }} onClick=${onBack}>
            ← Retour connexion
          </button>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.2)', textAlign:'center', marginTop:16, lineHeight:1.6 }}>
            En créant un compte, tu acceptes les CGU de PerfHand.
            Tes données sont hébergées sur Firebase (Google) — Europe.
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
