
function LoginScreen() {
  const { login, setDb } = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loginMode, setLoginMode] = useState("email");
  const [accessCode, setAccessCode] = useState("");

  async function doLogin() {
    if (!email.trim() || !pw.trim()) return;
    setLoading(true);
    setErr("");
    const r = await login(email.trim().toLowerCase(), pw.trim());
    if (!r.ok) {
      setErr(r.msg || "Identifiants incorrects.");
      setLoading(false);
      return;
    }
    // Si r.ok : onAuthStateChanged va declencher setSession automatiquement, ce qui demonte
    // cet ecran. Mais si la resolution du role qui suit est lente/bloquee, l'utilisateur restait
    // coince indefiniment sur "Connexion..." sans aucun message — filet de securite ci-dessous.
    setTimeout(() => {
      setLoading(current => {
        if (current) {
          setErr("La connexion prend plus de temps que prévu. Vérifie ta connexion internet et réessaie — si le problème persiste, recharge la page.");
        }
        return false;
      });
    }, 12000);
  }

  function doLoginCode() {
    const code = accessCode.trim().replace(/\s/g, '');
    if (!code) return;
    setLoading(true);
    setErr("");

    // 1. Chercher d'abord dans localStorage (anciens codes joueurs perso)
    try {
      const codes = JSON.parse(localStorage.getItem('perfhand_codes') || '{}');
      const profil = codes[code];
      if (profil && profil.email && profil.password) {
        try {
          const raw = localStorage.getItem('perfhand_db_v2');
          const dbLocal = raw ? JSON.parse(raw) : {};
          const perso = dbLocal.playersPerso || [];
          if (!perso.find(p => p.id === profil.id)) { perso.push(profil); }
          else { const idx = perso.findIndex(p => p.id === profil.id); perso[idx] = { ...perso[idx], ...profil }; }
          dbLocal.playersPerso = perso;
          localStorage.setItem('perfhand_db_v2', JSON.stringify(dbLocal));
          setDb(d => ({ ...d, playersPerso: perso }));
        } catch(e) {}
        login(profil.email, profil.password).then(r => {
          if (!r.ok) setErr("Erreur de connexion. Regénère le code depuis l'admin.");
          setLoading(false);
        });
        return;
      }
    } catch(e) {}

    if (!window.__perfhand_db) { setErr("Code introuvable."); setLoading(false); return; }

    // 2. Chercher dans Firebase perfhand/codes/{code} (joueurs USM / club collectif)
    window.__perfhand_db.ref('perfhand/codes/' + code).once('value').then(usmSnap => {
      const usmCode = usmSnap.val();
      if (usmCode && usmCode.playerId) {
        // Lier la session anonyme à ce code : c'est ce qui autorise l'accès à SA fiche (règles Firebase).
        return lierCodeClub(code, usmCode.playerId, usmCode.clubId || 'usm').catch(e => console.warn('[code] liaison refusée:', e && e.message)).then(() => {
        const session = { role: 'usm_code', playerId: usmCode.playerId, name: usmCode.playerName, clubId: usmCode.clubId || 'usm', code };
        try { localStorage.setItem('perfhand_tenant_session', JSON.stringify(session)); } catch(e) {}
        if (window.__perfhand_set_session) {
          window.__perfhand_set_session(session);
          setLoading(false);
        } else {
          window.location.reload();
        }
        });
      }
      // 3. Sinon, chercher dans les tenants
      checkTenantCodes();
    }).catch(() => checkTenantCodes());

    async function ouvrirSessionTenant(tenantId, playerId, playerName) {
      try { await lierCodeTenant(code, tenantId, playerId); } catch(e) { console.warn('[code tenant] liaison refusée:', e && e.message); }
      const session = { role: 'tenant_perso', tenantId, playerId, name: playerName, code };
      try { localStorage.setItem('perfhand_tenant_session', JSON.stringify(session)); } catch(e) {}
      if (window.__perfhand_set_session) { window.__perfhand_set_session(session); setLoading(false); }
      else window.location.reload();
    }
    // 3. Index tenantCodes/{code} -> tenantId (sans télécharger les autres tenants)
    function checkTenantCodes() {
      window.__perfhand_db.ref('tenantCodes/' + code).once('value').then(idx => {
        const tid = idx.val();
        if (!tid) return scanTenants();
        return window.__perfhand_db.ref('tenants/' + tid + '/codes/' + code).once('value').then(cs => {
          const c = cs.val();
          if (c && c.playerId) ouvrirSessionTenant(tid, c.playerId, c.playerName);
          else scanTenants();
        });
      }).catch(() => scanTenants());
    }
    // 4. Secours : anciens codes pas encore indexés (indexés à la prochaine visite du préparateur ou de l'admin)
    function scanTenants() {
    window.__perfhand_db.ref('tenants').once('value').then(snap => {
      const allTenants = snap.val();
      if (!allTenants) { setErr("Code introuvable."); setLoading(false); return; }
      for (const [tenantId, tenant] of Object.entries(allTenants)) {
        const codes = tenant.codes || {};
        if (codes[code]) {
          const { playerId, playerName } = codes[code];
          ouvrirSessionTenant(tenantId, playerId, playerName);
          return;
        }
      }
      setErr("Code introuvable. Demande un nouveau code à ton coach.");
      setLoading(false);
    }).catch(() => { setErr("Code introuvable. Demande un nouveau code à ton coach."); setLoading(false); });
    } // fin scanTenants
  }

  function onKey(e) {
    if (e.key === "Enter") doLogin();
  }

  return _h`<div class="login-wrap">
    <div class="login-grid"></div>
    <div class="login-box">
      <div style=${{ textAlign:"center", marginBottom:32 }}>
        <div class="logo" style=${{ fontSize:42 }}><span>PERF</span>HAND</div>
        <div style=${{ fontSize:11, color:"rgba(255,255,255,0.25)", letterSpacing:3, textTransform:"uppercase", marginTop:6 }}>Plateforme Performance Handball</div>
      </div>
      <div class="login-card">
        <div style=${{ padding:"24px 20px" }}>
          <div style=${{ fontSize:14, fontWeight:700, marginBottom:16, textAlign:"center" }}>Connexion</div>
          <!-- Toggle email/code -->
          <div style=${{ display:"flex", gap:6, marginBottom:16, background:"rgba(255,255,255,.04)", borderRadius:9, padding:3 }}>
            <button onClick=${() => setLoginMode("email")} style=${{ flex:1, padding:"7px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:loginMode==="email"?700:400, background:loginMode==="email"?"rgba(255,255,255,.1)":"transparent", color:loginMode==="email"?"#fff":"rgba(255,255,255,.4)" }}>Email / Mot de passe</button>
            <button onClick=${() => setLoginMode("code")} style=${{ flex:1, padding:"7px", borderRadius:7, border:"none", cursor:"pointer", fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:loginMode==="code"?700:400, background:loginMode==="code"?"rgba(255,255,255,.1)":"transparent", color:loginMode==="code"?"#fff":"rgba(255,255,255,.4)" }}>Code joueur</button>
          </div>

          <!-- Mode code joueur -->
          ${loginMode === "code" && _h`<div>
            <div style=${{ fontSize:11, color:"rgba(255,255,255,.5)", background:"rgba(255,164,32,.06)", border:"1px solid rgba(255,164,32,.2)", borderRadius:9, padding:"10px 14px", marginBottom:14, lineHeight:1.6 }}>
              Entre ton code pour te connecter. Pour recevoir les mises a jour, redemande un nouveau code a ton coach.
              Entre le code 6 chiffres recu de ton preparateur physique.
            </div>
            <div style=${{ marginBottom:14 }}>
              <div style=${{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Code d'acces</div>
              <input
                class="inp"
                type="text"
                inputmode="numeric"
                maxlength="6"
                value=${accessCode}
                onInput=${e => setAccessCode(e.target.value)}
                placeholder="Ex: 472831"
                style=${{ fontSize:24, fontWeight:800, textAlign:"center", letterSpacing:8, fontFamily:"monospace", maxWidth:200 }}
              ></textarea>
            </div>
            ${err && _h`<div style=${{ color:"#FF4455", fontSize:12, marginBottom:10, textAlign:"center" }}>${err}</div>`}
            <button
              class="btn btn-primary"
              style=${{ width:"100%", padding:"14px", fontSize:14, fontWeight:700 }}
              onClick=${doLoginCode}
              disabled=${loading || !accessCode.trim()}
            >${loading ? "..." : "Acceder a mon espace"}</button>
          </div>`}

          <!-- Email -->
          <div style=${{ marginBottom:14 }}>
            <div style=${{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Email</div>
            <input
              class="inp"
              type="email"
              value=${email}
              onInput=${e => { setEmail(e.target.value); setErr(""); }}
              onKeyDown=${onKey}
              placeholder="votre@email.fr"
              autocomplete="username"
            />
          </div>

          <!-- Mot de passe -->
          <div style=${{ marginBottom:20 }}>
            <div style=${{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Mot de passe</div>
            <div style=${{ position:"relative" }}>
              <input
                class="inp"
                type=${showPw ? "text" : "password"}
                value=${pw}
                onInput=${e => { setPw(e.target.value); setErr(""); }}
                onKeyDown=${onKey}
                placeholder="••••••••"
                autocomplete="current-password"
                style=${{ paddingRight:40 }}
              />
              <button
                onClick=${() => setShowPw(v => !v)}
                style=${{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:14, padding:4 }}
              >${showPw ? "🙈" : "👁"}</button>
            </div>
          </div>

          <!-- Erreur -->
          ${err && _h`<div style=${{ fontSize:12, color:"#FF4455", background:"rgba(255,68,85,0.08)", borderRadius:8, padding:"10px 14px", marginBottom:16, textAlign:"center" }}>${err}</div>`}

          <!-- Bouton -->
          <button
            class="btn btn-primary"
            style=${{ width:"100%", padding:"13px", fontSize:14, fontWeight:700 }}
            onClick=${doLogin}
            disabled=${loading || !email.trim() || !pw.trim()}
          >${loading ? "Connexion..." : "Se connecter"}</button>
        </div>
      </div>

      <div style=${{ textAlign:"center", marginTop:16 }}>
        <button onClick=${() => window.__showRegister && window.__showRegister(true)}
          style=${{ background:"none", border:"none", color:"rgba(255,164,32,.5)", fontSize:11, cursor:"pointer", textDecoration:"underline" }}>
          Créer un compte préparateur
        </button>
      </div>
      <div style=${{ textAlign:"center", marginTop:8, fontSize:11, color:"rgba(255,255,255,0.15)" }}>
        Developed by <span style=${{ color:"rgba(255,164,32,0.7)", fontWeight:700 }}>@leo.perfhandball</span>
      </div>
    </div>
  </div>`;
}
