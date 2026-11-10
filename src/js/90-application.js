

function PerfHandApp() {
  const STORAGE_KEY = "perfhand_db_v3";

  // Handle share link on load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (shareToken) {
      try {
        const data = JSON.parse(atob(shareToken));
        // Store share context - will be used after db loads
        window._shareContext = data;
      } catch(e) {}
    }
  }, []);

  function loadDb() {
    try {
      // Try current key first
      let saved = localStorage.getItem(STORAGE_KEY);
      // Fallback: migrate from old key v1
      if (!saved) saved = localStorage.getItem("perfhand_db_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Backward compat: migrate players -> playerProfiles
        if (parsed.players && parsed.players.length > 0 && (!parsed.playerProfiles || parsed.playerProfiles.length === 0)) {
          parsed.playerProfiles = parsed.players;
        }
        const savedIds = new Set((parsed.playerProfiles||parsed.players||[]).map(p => p.id));
        const _delIds = new Set(getDeletedProfileIds());
        const newPlayers = (INITIAL_DB.playerProfiles||INITIAL_DB.players||[]).filter(p => !savedIds.has(p.id) && !_delIds.has(String(p.id)));
        // Merge fields from INITIAL_DB into saved players (adds email, password updates, etc.)
        const mergedPlayers=(parsed.playerProfiles||[]).map(savedP=>{const freshP=(INITIAL_DB.playerProfiles||INITIAL_DB.players||[]).find(p=>p.id===savedP.id);const merged=freshP?{...savedP,email:freshP.email||savedP.email,password:freshP.password||savedP.password,name:savedP.name||freshP.name,status:savedP.status||freshP.status}:savedP;return sanitizeProfile(merged)||savedP;});
        // Normalize emails/passwords on load so old malformed entries still work
        const normalizedPerso = sansProfilsSupprimes(parsed.playersPerso || []).map(p => ({
          ...p,
          email:    p.email    ? p.email.replace(/\s/g,'').toLowerCase()    : p.email,
          password: p.password ? p.password.replace(/\s/g,'')               : p.password,
        }));
        // If playersPerso is empty but we have a session backup, restore it
        let finalPerso = normalizedPerso;
        if (finalPerso.length === 0) {
          try {
            const backup = sessionStorage.getItem('perfhand_perso_backup');
            if (backup) finalPerso = sansProfilsSupprimes(JSON.parse(backup));
          } catch(e) {}
        }
        return {
          ...INITIAL_DB,
          ...parsed,
          playerProfiles: sansProfilsSupprimes([...mergedPlayers, ...newPlayers]),
          playersPerso: finalPerso,
        };
      }
    } catch(e) { console.warn("localStorage load error:", e); }
    return { ...INITIAL_DB, playersPerso: [] };
  }

  const [session, setSession] = useState(() => {
    try {
      // Vérifier d'abord la session tenant (code joueur Firebase)
      const ts = localStorage.getItem('perfhand_tenant_session');
      if (ts) { const parsed = JSON.parse(ts); if (parsed && (parsed.role === 'tenant_perso' || parsed.role === 'usm_code')) return parsed; }
      const s = localStorage.getItem("perfhand_session_v2"); return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  // Identité Firebase courante + rôle applicatif : quand l'un change, les écouteurs sont rebranchés.
  const [authUid, setAuthUid] = useState(null);
  React.useEffect(() => {
    if (!window.__perfhand_auth) return;
    return window.__perfhand_auth.onAuthStateChanged(u => setAuthUid(u ? u.uid : null));
  }, []);
  const cleConnexion = (authUid || '-') + '|' + (session ? session.role + ':' + (session.playerId || session.email || '') : 'aucune');

  // Exposer setSession globalement pour doLoginCode
  React.useEffect(() => {
    window.__perfhand_set_session = (s) => {
      setSession(s);
      try { localStorage.setItem('perfhand_tenant_session', JSON.stringify(s)); } catch(e) {}
    };
    return () => { delete window.__perfhand_set_session; };
  }, []);
  // Tout l'état passe par dbSansMdp : aucun mot de passe ne reste en mémoire, en local ni n'est envoyé.
  const [db, _setDbBrut] = useState(() => dbSansMdp(loadDb()));
  const setDbRaw = React.useCallback(u => _setDbBrut(prev => dbSansMdp(typeof u === 'function' ? u(prev) : u)), []);

  function setDb(updater) {
    setDbRaw(prev => {
      const next = dbSansMdp(typeof updater === "function" ? updater(prev) : updater);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
      // Exposer la bibliothèque custom globalement pour findBiblioMatch
      window.__perfhand_custom_biblio = next.bibliothequeCustom || [];
      // Exposer les corrections de lien vidéo/image globalement pour findBiblioMatch
      window.__perfhand_biblio_overrides = next.bibliothequeOverrides || {};
      // Exposer les profils joueurs pour la duplication de planif
      window.__perfhand_current_profiles = next.playerProfiles || [];
      // Sync bibliothequeCustom vers Firebase (partagé entre coach et joueurs)
      if (window.__perfhand_db) {
        const prevBiblio = JSON.stringify(prev.bibliothequeCustom || []);
        const nextBiblio = JSON.stringify(next.bibliothequeCustom || []);
        if (prevBiblio !== nextBiblio) {
          try { window.__perfhand_db.ref('bibliothequeCustom').set(next.bibliothequeCustom || []); } catch(e) {}
        }
      }
      // Sync bibliothequeOverrides vers Firebase (corrections de liens cassés, partagé)
      if (window.__perfhand_db) {
        const prevOv = JSON.stringify(prev.bibliothequeOverrides || {});
        const nextOv = JSON.stringify(next.bibliothequeOverrides || {});
        if (prevOv !== nextOv) {
          try { window.__perfhand_db.ref('bibliothequeOverrides').set(next.bibliothequeOverrides || {}); } catch(e) {}
        }
      }
      // Sync exerciceMedias vers Firebase (liens image/vidéo attachés aux exercices mobilité/force amplitude)
      if (window.__perfhand_db) {
        const prevMedias = JSON.stringify(prev.exerciceMedias || {});
        const nextMedias = JSON.stringify(next.exerciceMedias || {});
        if (prevMedias !== nextMedias) {
          try { window.__perfhand_db.ref('exerciceMedias').set(next.exerciceMedias || {}); } catch(e) {}
        }
      }
      // Sync staffAccounts vers Firebase (pour que le staff puisse se connecter depuis n'importe quel appareil)
      if (window.__perfhand_db) {
        const prevStaff = JSON.stringify(prev.staffAccounts || []);
        const nextStaff = JSON.stringify(next.staffAccounts || []);
        if (prevStaff !== nextStaff) {
          try { window.__perfhand_db.ref('perfhand/staffAccounts').set(next.staffAccounts || []); } catch(e) {}
        }
      }
      // Sync playersPerso to Firebase if available
      if (window.__perfhand_db) {
        const prevPerso = JSON.stringify(prev.playersPerso || []);
        const nextPerso = JSON.stringify(next.playersPerso || []);
        if (prevPerso !== nextPerso) {
          try {
            // Use update() per-player instead of set() to avoid overwriting other players' data
            const prevMap = {};
            (prev.playersPerso || []).forEach(p => { if(p && p.id) prevMap[p.id] = JSON.stringify(p); });
            const persoObj = {};
            (next.playersPerso || []).forEach((p, i) => { if(p && p.id) persoObj[p.id] = p; });
            // Only write players that actually changed
            // IMPORTANT — même correctif critique que pour playerProfiles : on aplatit en chemins
            // champ par champ plutôt que d'écrire {[id]: objetComplet}, qui remplacerait tout le
            // nœud du joueur et effacerait les champs à écriture dédiée (wellness, tests, etc.)
            const FIELDS_ECRITURE_DEDIEE_PERSO = ['wellnessCheckins', 'customRM', 'protocol', 'testsEndurance', 'masseMesures', 'rmHistory', 'muscuSeances', 'enduranceSeances', 'blessures', 'bilans', 'tests', 'journal', 'planif', 'gpsActivites'];
            const updates = {};
            Object.entries(persoObj).forEach(([id, p]) => {
              if (JSON.stringify(p) !== prevMap[id]) {
                let safeCopy; try { safeCopy = JSON.parse(JSON.stringify(p)); } catch(e) { safeCopy = { ...p }; }
                Object.keys(safeCopy).forEach(field => {
                  if (FIELDS_ECRITURE_DEDIEE_PERSO.includes(field)) return;
                  updates[id + '/' + field] = safeCopy[field];
                });
              }
            });
            if (Object.keys(updates).length > 0) {
              window.__perfhand_db.ref('perfhand/playersPerso').update(updates);
            }
            console.log('[PerfHand] Firebase write:', Object.keys(persoObj).length, 'profils perso');
          } catch(e) {}
        }
      }
      // Sync playerProfiles (joueurs de club, ex USM) vers Firebase — indépendant de playersPerso
      // IMPORTANT: update() diffé par joueur, jamais de set() global qui écraserait les autres joueurs
      // (ex ajoutés par un autre coach/appareil ou pas encore rechargés dans le state local)
      // IMPORTANT 2: on assainit chaque objet joueur (JSON round-trip) avant écriture — Firebase
      // rejette silencieusement toute update() contenant un champ undefined imbriqué, ce qui faisait
      // disparaître des données (ex: protocoles assignés) au rechargement sans aucune erreur visible.
      // IMPORTANT 3: certains champs (wellnessCheckins, customRM, protocol) ont désormais leur PROPRE
      // écriture isolée et dédiée (transaction Firebase directe sur leur sous-chemin). On les EXCLUT
      // ici volontairement pour qu'il n'y ait jamais deux écritures concurrentes sur le même champ —
      // c'était la cause du wellness qui disparaissait après coup (course entre cette synchro générale,
      // parfois basée sur un instantané local pas encore à jour, et l'écriture dédiée plus récente).
      const FIELDS_ECRITURE_DEDIEE = ['wellnessCheckins', 'customRM', 'protocol', 'testsEndurance', 'masseMesures', 'rmHistory', 'muscuSeances', 'enduranceSeances', 'blessures', 'bilans', 'tests', 'journal', 'planif', 'gpsActivites'];
      if (window.__perfhand_db) {
        const prevProfiles = prev.playerProfiles || [];
        const nextProfiles = next.playerProfiles || [];
        const prevProfMap = {};
        prevProfiles.forEach(p => { if(p && p.id) prevProfMap[p.id] = JSON.stringify(p); });
        const profUpdates = {};
        nextProfiles.forEach(p => {
          if (p && p.id && JSON.stringify(p) !== prevProfMap[p.id]) {
            let safeCopy;
            try { safeCopy = JSON.parse(JSON.stringify(p)); } catch(e) { safeCopy = { ...p }; }
            // IMPORTANT — CORRECTIF CRITIQUE : on n'écrit JAMAIS {[playerId]: objetComplet} car
            // Firebase REMPLACE alors tout le nœud du joueur (comme un .set()), effaçant au passage
            // tout champ absent de cette copie — y compris les champs "protégés" qu'on veut justement
            // préserver ! La bonne syntaxe Firebase pour une vraie mise à jour partielle multi-champs
            // est d'aplatir chaque champ en un chemin séparé : {"joueurId/champ": valeur, ...}.
            Object.keys(safeCopy).forEach(field => {
              if (FIELDS_ECRITURE_DEDIEE.includes(field)) return; // jamais touché par cette synchro
              profUpdates[p.id + '/' + field] = safeCopy[field];
            });
          }
        });
        if (Object.keys(profUpdates).length > 0) {
          try {
            window.__perfhand_db.ref('perfhand/playerProfiles').update(profUpdates);
            console.log('[PerfHand] Firebase write playerProfiles (champs):', Object.keys(profUpdates).length);
          } catch(e) { console.error('[PerfHand] Échec écriture playerProfiles:', e); }
        }
      }
      return next;
    });
  }

  // Sync from Firebase — rebranché à chaque changement de connexion (cleConnexion) : un écouteur
  // refusé par les règles (ex: visiteur pas encore connecté) est annulé définitivement par Firebase,
  // il faut donc le reposer une fois l'utilisateur identifié.
  React.useEffect(() => {
    const abonnements = [];
    const ecoute = chemin => {
      const r = window.__perfhand_db.ref(chemin);
      const on0 = r.on.bind(r);
      r.on = (ev, cb, annul) => {
        const h = on0(ev, cb, annul || (e => console.warn('[écoute refusée]', chemin, e && e.code)));
        abonnements.push([r, ev, h]);
        return h;
      };
      return r;
    };
    const connectFirebase = () => {
      if (!window.__perfhand_db) {
        console.log('[PerfHand] Firebase pas encore pret, retry...');
        return;
      }
    // Charger les clubs depuis Firebase (avant, uniquement stockés en local — jamais synchronisés entre appareils)
    const refClubs = ecoute('perfhand/clubs');
    refClubs.on('value', snap => {
      const raw = snap.val();
      if (raw) {
        const clubs = Array.isArray(raw) ? raw.filter(Boolean) : Object.values(raw);
        setDb(d => ({ ...d, clubs }));
      }
      // IMPORTANT : si raw est null/vide, on NE WRITE JAMAIS automatiquement.
      // Un null peut venir d'une simple latence réseau ou d'une déconnexion
      // momentanée — écrire à ce moment-là écraserait les données réelles
      // de Firebase avec l'état local par défaut (INITIAL_DB). C'est exactement
      // ce qui a détruit le groupe Prénational le 18/07/2026.
      // Si une migration manuelle est un jour nécessaire, la déclencher via un
      // bouton admin explicite, jamais automatiquement au chargement.
    });

    // Also load playerProfiles from Firebase
    // IMPORTANT: on utilise setDbRaw (pas setDb) ici — Firebase est la SOURCE DE VÉRITÉ pour
    // cette lecture, elle ne doit JAMAIS déclencher une réécriture retour vers Firebase.
    // Utiliser setDb aurait pu, si l'état local était momentanément désynchronisé (ex: juste après
    // une écriture isolée comme le wellness ou customRM), faire croire à un "changement local à
    // synchroniser" et écraser le serveur avec une version plus ancienne. C'est ce qui faisait
    // disparaître le wellness et les mouvements personnalisés après coup.
    // Profils supprimés depuis un autre appareil : on les retire ici aussi
    try {
      ecoute('perfhand/deletedProfiles').on('value', snap => {
        const raw = snap.val(); if (!raw) return;
        const ids = Object.keys(raw);
        addDeletedProfileIds(ids);
        setDbRaw(d => {
          const np = sansProfilsSupprimes(d.playersPerso), nc = sansProfilsSupprimes(d.playerProfiles);
          if (np.length === (d.playersPerso||[]).length && nc.length === (d.playerProfiles||[]).length) return d;
          const next = { ...d, playersPerso: np, playerProfiles: nc };
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
          return next;
        });
      }, () => {});
    } catch(e) {}
    const refProfiles = ecoute('perfhand/playerProfiles');
    refProfiles.on('value', snap => {
      const raw = snap.val();
      if (!raw) return;
      const rawArr=Array.isArray(raw)?raw:Object.entries(raw).map(([k,v])=>v&&typeof v==='object'?{...v,id:v.id||k}:null).filter(Boolean);
      const profiles=sansProfilsSupprimes(rawArr.map(p=>sanitizeProfile(p)).filter(Boolean));
      setDbRaw(d => {
        const next = { ...d, playerProfiles: profiles };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
        return next;
      });
    });

    // Charger la bibliothèque custom partagée depuis Firebase
    const refBiblio = ecoute('bibliothequeCustom');
    refBiblio.on('value', snap => {
      const raw = snap.val();
      if (!raw) return;
      const biblio = Array.isArray(raw) ? raw : Object.values(raw);
      window.__perfhand_custom_biblio = biblio;
      setDb(d => ({ ...d, bibliothequeCustom: biblio }));
    });

    // Charger les corrections de lien vidéo/image (mouvements de base cassés) depuis Firebase
    const refOverrides = ecoute('bibliothequeOverrides');
    refOverrides.on('value', snap => {
      const raw = snap.val() || {};
      window.__perfhand_biblio_overrides = raw;
      setDb(d => ({ ...d, bibliothequeOverrides: raw }));
    });

    // Charger les médias custom (image/vidéo) attachés aux exercices mobilité/force amplitude
    const refMedias = ecoute('exerciceMedias');
    refMedias.on('value', snap => {
      const raw = snap.val();
      setDb(d => ({ ...d, exerciceMedias: raw || {} }));
    });

    // Charger les comptes staff depuis Firebase (pour resolveRole)
    const refStaff = ecoute('perfhand/staffAccounts');
    refStaff.on('value', snap => {
      const raw = snap.val();
      if (!raw) return;
      const staff = Array.isArray(raw) ? raw.filter(Boolean) : Object.values(raw);
      setDb(d => ({ ...d, staffAccounts: staff }));
    });

    // Charger la prépa estivale depuis Firebase
    const refPrepa = ecoute('perfhand/prepaEstivale');
    refPrepa.on('value', snap => {
      const raw = snap.val();
      if (!raw) return;
      setDb(d => ({ ...d, prepaEstivale: { ...(d.prepaEstivale||{}), ...raw } }));
    });

    // Charger la planif club depuis Firebase
    const refClubPlanif = ecoute('perfhand/clubPlanif');
    refClubPlanif.on('value', snap => {
      const raw = snap.val();
      if (!raw) return;
      setDb(d => ({ ...d, clubPlanif: { ...(d.clubPlanif||{}), ...raw } }));
    });

    // Charger les schémas tactiques depuis Firebase
    const refTactique = ecoute('perfhand/tactique');
    refTactique.on('value', snap => {
      const raw = snap.val();
      if (raw && typeof raw === 'object') setDb(d => ({ ...d, tactique: raw }));
    });

    // Charger le projet de jeu depuis Firebase
    const refProjet = ecoute('perfhand/projetDeJeu');
    refProjet.on('value', snap => {
      const val = snap.val();
      if (val && typeof val === 'object') {
        setDb(d => ({ ...d, projetDeJeu: val }));
      }
    });

    // Charger les stats de match (dont la saisie Live défense/attaque) depuis Firebase.
    // IMPORTANT — CORRECTIF : saveMatchsDirect() (mode Live) écrivait bien vers
    // 'perfhand/matchStats/<clubId>' mais AUCUN listener ne relisait ce chemin — chaque
    // appareil ne voyait donc que ses propres stats, stockées uniquement en local. Un staff
    // (ex: Eric) qui saisissait des stats en live pendant un match ne les rendait jamais
    // visibles au coach/admin sur un autre appareil. On écoute maintenant ce chemin en
    // continu, comme pour clubPlanif/prepaEstivale, pour que ce soit bien partagé entre tous.
    const refMatchStats = ecoute('perfhand/matchStats');
    refMatchStats.on('value', snap => {
      const raw = snap.val();
      if (!raw) return;
      const normalized = {};
      Object.entries(raw).forEach(([clubId, matchsRaw]) => {
        if (!matchsRaw) { normalized[clubId] = []; return; }
        normalized[clubId] = Array.isArray(matchsRaw) ? matchsRaw.filter(Boolean) : Object.values(matchsRaw).filter(Boolean);
      });
      // CORRECTIF CRITIQUE (perte de 1h30 de saisie de stats) : ce listener remplaçait
      // intégralement la liste de matchs locale par celle reçue de Firebase à chaque
      // déclenchement. Or 'value' se déclenche aussi sur un snapshot périmé/en cache (reconnexion,
      // latence) — un match qu'on vient tout juste d'enregistrer localement pouvait donc être
      // écrasé et disparaître si ce snapshot arrivait avant que l'écriture n'ait fini de se
      // propager. On fusionne désormais par id : on ne perd JAMAIS un match déjà connu en local,
      // on ne fait que compléter/mettre à jour avec ce que dit le serveur.
      setDb(d => {
        const merged = { ...(d.matchStats || {}) };
        Object.entries(normalized).forEach(([clubId, remoteList]) => {
          const localList = merged[clubId] || [];
          const byId = {};
          localList.forEach(m => { if (m && m.id) byId[m.id] = m; });
          remoteList.forEach(m => {
            if (!m || !m.id) return;
            const loc = byId[m.id] || {};
            const merged2 = { ...loc, ...m };
            // CORRECTIF temps de jeu : le match distant remplaçait en bloc `tempsJeu` local. Un
            // snapshot serveur un peu en retard (clics rapprochés sur plusieurs joueurs) annulait
            // alors le dernier clic local → « l'autre joueur ne se clique pas / ça enlève le premier ».
            // On fusionne maintenant joueur par joueur, en gardant le plus récent (champ ts).
            if (loc.tempsJeu || m.tempsJeu) {
              const tj = { ...(m.tempsJeu || {}) };
              Object.entries(loc.tempsJeu || {}).forEach(([pid, lv]) => {
                const rv = tj[pid];
                if (!rv || (lv && (lv.ts || 0) > (rv.ts || 0))) tj[pid] = lv;
              });
              merged2.tempsJeu = tj;
              if ((loc.chronoTs || 0) > (m.chronoTs || 0)) { merged2.chronoMatchActif = loc.chronoMatchActif; merged2.chronoTs = loc.chronoTs; }
            }
            byId[m.id] = merged2;
          });
          merged[clubId] = Object.values(byId);
        });
        return { ...d, matchStats: merged };
      });
    });

    const ref = ecoute('perfhand/playersPerso');
    ref.on('value', snapshot => {
      const raw = snapshot.val();
      console.log('[PerfHand] Firebase read:', raw);
      if (!raw) return;
      // Firebase stores as object {id: profile} - convert to array
      const data = sansProfilsSupprimes(Array.isArray(raw)
        ? raw.filter(Boolean)
        : Object.values(raw).filter(Boolean));
      if (!data.length) return;
      console.log('[PerfHand] Profils recus:', data.length);
      setDbRaw(prev => {
        const localMap = {};
        (prev.playersPerso || []).forEach(p => { if(p && p.id) localMap[p.id] = p; });
        // Remote always wins — source of truth is Firebase
        data.forEach(remote => {
          if (remote && remote.id) {
            localMap[remote.id] = fusionnerPersoDistant(localMap[remote.id] || {}, remote);
          }
        });
        const newPerso = sansProfilsSupprimes(Object.values(localMap));
        if (JSON.stringify(newPerso) === JSON.stringify(prev.playersPerso || [])) return prev;
        const next = { ...prev, playersPerso: newPerso };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
        console.log('[PerfHand] DB mise a jour avec', newPerso.length, 'profils');
        return next;
      });
    });
      return () => ref.off();
    };
    // On attend qu'une session Firebase existe avant de brancher les écouteurs (voir
    // __perfhand_auth_pret). Avant : branchement immédiat + second branchement 1 s plus tard,
    // ce qui doublait chaque écouteur (chaque mise à jour était traitée deux fois).
    let annule = false;
    (window.__perfhand_auth_pret || Promise.resolve()).then(() => {
      if (annule) return;
      if (window.__perfhand_db) connectFirebase();
      else setTimeout(() => { if (!annule) connectFirebase(); }, 1000);
    });
    return () => {
      annule = true;
      abonnements.forEach(([r, ev, h]) => { try { r.off(ev, h); } catch(e) {} });
    };
  }, [cleConnexion]);

  // ── TELEGRAM NOTIFICATIONS ─────────────────────────────────────────────────
  // L'envoi passe par la fonction Netlify /.netlify/functions/telegram : le token du bot est
  // stocké côté serveur (variables TG_BOT_TOKEN / TG_CHAT_ID) et n'apparaît plus dans la page.
  // Deduplication stockee dans Firebase (partagee entre tous les appareils)
  const [tgSentLog, setTgSentLog] = React.useState({});

  // Charger le log depuis Firebase au demarrage
  const [tgSentLogLoaded, setTgSentLogLoaded] = React.useState(false);
  React.useEffect(() => {
    if (!window.__perfhand_db) return;
    let annule = false, cb = null;
    const ref = window.__perfhand_db.ref("tg_notifications_sent");
    (window.__perfhand_auth_pret || Promise.resolve()).then(() => {
      if (annule) return;
      cb = ref.on("value", snap => {
        setTgSentLog(snap.val() || {});
        setTgSentLogLoaded(true);
      });
    });
    return () => { annule = true; if (cb) ref.off("value", cb); };
  }, [cleConnexion]);

  function markSent(key) {
    const today = localDateStr();
    if (window.__perfhand_db) {
      window.__perfhand_db.ref("tg_notifications_sent/" + key).set(today);
    }
  }
  const tgSentLogRef = React.useRef({});
  React.useEffect(() => { tgSentLogRef.current = tgSentLog; }, [tgSentLog]);

  function alreadySent(key) {
    // Utiliser le ref pour eviter les closures perimees
    return !!tgSentLogRef.current[key];
  }

  async function sendTelegram(text) {
    try {
      const u = window.__perfhand_auth && window.__perfhand_auth.currentUser;
      if (!u) return false;
      const idToken = await u.getIdToken();
      const r = await fetch('/.netlify/functions/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + idToken },
        body: JSON.stringify({ text })
      });
      if (!r.ok) console.warn('[Telegram] envoi refusé :', r.status, await r.text());
      return r.ok;
    } catch(e) { console.warn("[Telegram] Erreur envoi:", e); return false; }
  }

  // Verrou local en mémoire pour éviter double-envoi même si Firebase est lent
  const tgLocalLock = React.useRef({});

  function alreadySentStrict(key) {
    // Vérifier d'abord le verrou local (immédiat), puis Firebase
    return !!tgLocalLock.current[key] || !!tgSentLogRef.current[key];
  }

  function markSentStrict(key) {
    const today = localDateStr();
    // Marquer immédiatement en mémoire
    tgLocalLock.current[key] = today;
    tgSentLogRef.current[key] = today;
    // Puis écrire Firebase en arrière-plan
    if (window.__perfhand_db) {
      window.__perfhand_db.ref("tg_notifications_sent/" + key).set(today);
    }
  }

  // Données toujours à jour pour la vérification : le minuteur horaire ci-dessous garde sinon la
  // copie de `db` prise à l'ouverture de l'appli, et signalait comme « non validées » des séances
  // validées depuis (fausses alertes Telegram).
  const dbPourAlertesRef = React.useRef(db);
  dbPourAlertesRef.current = db;

  // Relit la séance directement dans la base juste avant d'alerter : la copie locale peut être en
  // retard (données pas encore arrivées au démarrage, séance validée sur un autre appareil).
  // En cas de doute (lecture impossible), on n'alerte pas.
  async function seanceToujoursNonValidee(playerId, champ, seanceId) {
    if (!window.__perfhand_db) return false;
    try {
      const snap = await window.__perfhand_db.ref('perfhand/playersPerso/' + playerId + '/' + champ).once('value');
      const s = enTableau(snap.val()).find(x => String(x.id) === String(seanceId));
      return !!(s && s.datePrevu && s.datePrevu < localDateStr() && !s.dateFaite);
    } catch(e) { return false; }
  }

  function checkSeancesNonValidees() {
    const today = localDateStr();
    // Ne checker que les profils perso (pas les joueurs clubs sans séances réelles)
    const allPlayers = [...(dbPourAlertesRef.current.playersPerso || [])];

    const alerter = (player, champ, s, key, lines) => {
      if (alreadySentStrict(key)) return;
      tgLocalLock.current[key] = today; // verrou local pendant la vérification serveur
      seanceToujoursNonValidee(player.id, champ, s.id).then(nonValidee => {
        if (!nonValidee) { delete tgLocalLock.current[key]; return; }
        markSentStrict(key); // Marquer AVANT d'envoyer
        sendTelegram(lines);
      });
    };

    allPlayers.forEach(player => {
      const nom = player.name || "Joueur inconnu";

      // Seances muscu non validées (passées de plus de 1 jour)
      (player.muscuSeances || []).forEach(s => {
        if (s.datePrevu && s.datePrevu < today && !s.dateFaite) {
          alerter(player, 'muscuSeances', s, "muscu_" + (player.id||"") + "_" + s.id, [
            "⚠️ [MUSCU] Séance non validée",
            "Joueur : " + nom,
            "Prévue le : " + s.datePrevu,
            "Séance : " + (s.nom || "Sans nom"),
            s.methode ? "Méthode : " + s.methode : null,
          ].filter(Boolean).join("\n"));
        }
      });

      // Seances endurance non validées
      (player.enduranceSeances || []).forEach(s => {
        if (s.datePrevu && s.datePrevu < today && !s.dateFaite) {
          alerter(player, 'enduranceSeances', s, "end_" + (player.id||"") + "_" + s.id, [
            "⚠️ [ENDURANCE] Séance non validée",
            "Joueur : " + nom,
            "Prévue le : " + s.datePrevu,
            "Séance : " + (s.nom || "Sans nom"),
            s.duree ? "Durée : " + s.duree + " min" : null,
          ].filter(Boolean).join("\n"));
        }
      });
    });
  }

    // Vérifier une seule fois par session, après chargement Firebase complet
  const tgCheckedRef = React.useRef(false);
  React.useEffect(() => {
    if (!tgSentLogLoaded) return; // attendre Firebase
    if (tgCheckedRef.current) return; // ne faire qu'une fois par session
    tgCheckedRef.current = true;
    // Délai de 2s pour s'assurer que tout est chargé
    const t1 = setTimeout(() => checkSeancesNonValidees(), 2000);
    // Recheck toutes les heures (sans reload complet)
    const interval = setInterval(() => checkSeancesNonValidees(), 60 * 60 * 1000);
    return () => { clearTimeout(t1); clearInterval(interval); };
  }, [tgSentLogLoaded]);

  // Bouton de test manuel dans l'UI
  async function testTelegramNow() {
    const ok = await sendTelegram("PerfHand - Test OK\nLa connexion Telegram fonctionne correctement.");
    alert(ok ? 'Message de test envoyé sur Telegram ✅'
             : 'Échec de l\'envoi Telegram. Vérifie les variables TG_BOT_TOKEN et TG_CHAT_ID dans Netlify (et que le site a été redéployé après).');
    checkSeancesNonValidees();
  }
  // Exposé pour le bouton « Test Telegram » de l'admin (composant séparé : avant, l'appel direct
  // à testTelegramNow y provoquait une erreur et le bouton ne faisait rien).
  window.__perfhand_test_telegram = testTelegramNow;

  // ── FIREBASE AUTH ────────────────────────────────────────────────────────────
  // Determine role from email after Firebase Auth succeeds

// ── SYSTÈME DE PERMISSIONS STAFF ─────────────────────────────────────────────
// ── GESTION STAFF DANS UN CLUB ────────────────────────────────────────────────
function ClubStaffManager({ club, db, setDb }) {
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState({ nom:'', email:'', roleId:'prepa', permissions:[] });
  const [editStaff, setEditStaff] = useState(null);

  const staffClub = (db.staffAccounts||[]).filter(s => s.clubId === club.id);

  function selectRole(roleId) {
    const role = ROLES_STAFF.find(r => r.id === roleId);
    setForm(f => ({ ...f, roleId, permissions: role ? [...role.permissions] : [] }));
  }

  function togglePerm(permId) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(permId)
        ? f.permissions.filter(p => p !== permId)
        : [...f.permissions, permId]
    }));
  }

  function generatePass() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({length:8}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  }

  async function createStaff() {
    if (!form.nom.trim() || !form.email.trim()) return;
    setCreating(true);
    const email = form.email.toLowerCase().trim();
    const tempPass = generatePass();
    try {
      // IMPORTANT: instance Firebase secondaire pour ne pas déconnecter le coach
      // (createUserWithEmailAndPassword connecte automatiquement l'app au nouveau compte)
      const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAB0dqrmBjZuZeLbBO2jVWRsECkzvFpVvg",
        authDomain: "perfhand-f8005.firebaseapp.com",
        databaseURL: "https://perfhand-f8005-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "perfhand-f8005",
        storageBucket: "perfhand-f8005.firebasestorage.app",
        messagingSenderId: "942276447358",
        appId: "1:942276447358:web:f47eb85391a07119ff5c2f",
      };
      const secondaryApp = firebase.apps.find(a => a.name === 'PlayerCreation')
        || firebase.initializeApp(FIREBASE_CONFIG, 'PlayerCreation');
      const secondaryAuth = secondaryApp.auth();
      // Créer compte Firebase Auth (sur l'instance secondaire — le coach reste connecté)
      await secondaryAuth.createUserWithEmailAndPassword(email, tempPass);
      // Envoyer email reset
      await secondaryAuth.sendPasswordResetEmail(email);
      // Nettoyage
      try { await secondaryAuth.signOut(); } catch(e) {}
      try { await secondaryApp.delete(); } catch(e) {}
      // Sauvegarder dans db
      const newStaff = {
        id: 'staff_' + Date.now(),
        clubId: club.id,
        name: form.nom.trim(),
        email,
        roleId: form.roleId,
        permissions: form.permissions,
        createdAt: localDateStr(),
      };
      setDb(d => ({ ...d, staffAccounts: [...(d.staffAccounts||[]), newStaff] }));
      setCreated({ ...newStaff, tempPass });
      setCreating(false);
      setShowAdd(false);
      setForm({ nom:'', email:'', roleId:'prepa', permissions:[] });
    } catch(e) {
      setCreating(false);
      if (e.code === 'auth/email-already-in-use') {
        // Compte existe déjà — juste ajouter les permissions
        const newStaff = {
          id: 'staff_' + Date.now(), clubId: club.id,
          name: form.nom.trim(), email, roleId: form.roleId,
          permissions: form.permissions,
          createdAt: localDateStr(),
        };
        setDb(d => ({ ...d, staffAccounts: [...(d.staffAccounts||[]), newStaff] }));
        setCreated({ ...newStaff, tempPass: '(compte existant)' });
        setShowAdd(false);
      } else {
        alert('Erreur : ' + e.message);
      }
    }
  }

  function removeStaff(staffId) {
    if (!confirm('Supprimer cet accès staff ?')) return;
    setDb(d => ({ ...d, staffAccounts: (d.staffAccounts||[]).filter(s => s.id !== staffId) }));
  }

  function saveEditPerms() {
    setDb(d => ({ ...d, staffAccounts: (d.staffAccounts||[]).map(s =>
      s.id === editStaff.id ? { ...s, permissions: editStaff.permissions, roleId: editStaff.roleId } : s
    )}));
    setEditStaff(null);
  }

  return _h`<div>
    <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
      <div style=${{ fontSize:13, fontWeight:800 }}>👥 Staff & Permissions</div>
      <button class="btn btn-primary btn-sm" onClick=${()=>setShowAdd(!showAdd)}>
        ${showAdd ? '✕' : '+ Ajouter staff'}
      </button>
    </div>

    <!-- Créé avec succès -->
    ${created ? _h`<div style=${{ background:'rgba(76,175,80,.08)', border:'1px solid rgba(76,175,80,.3)', borderRadius:12, padding:'14px', marginBottom:14 }}>
      <div style=${{ fontSize:13, fontWeight:800, color:'#4CAF50', marginBottom:8 }}>✅ Compte staff créé — ${created.name}</div>
      <div style=${{ background:'rgba(255,255,255,.05)', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginBottom:2 }}>Email :</div>
        <div style=${{ fontSize:13, fontWeight:700 }}>${created.email}</div>
        <div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:8, marginBottom:2 }}>Mot de passe temporaire :</div>
        <div style=${{ fontSize:18, fontWeight:800, color:'#FFA420', letterSpacing:2 }}>${created.tempPass}</div>
      </div>
      <div style=${{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:8 }}>Un email de réinitialisation a été envoyé. Transmets ce mot de passe au membre du staff.</div>
      <button class="btn btn-sm" style=${{ width:'100%' }} onClick=${()=>setCreated(null)}>Fermer</button>
    </div>` : null}

    <!-- Formulaire ajout -->
    ${showAdd ? _h`<div style=${{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px', marginBottom:16 }}>
      <div style=${{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        <div><div class="lbl">Nom complet</div><input class="inp" value=${form.nom} onInput=${e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Prénom Nom"/></div>
        <div><div class="lbl">Email</div><input class="inp" value=${form.email} onInput=${e=>setForm(f=>({...f,email:e.target.value}))} placeholder="staff@email.fr"/></div>
      </div>
      <!-- Rôle -->
      <div style=${{ marginBottom:10 }}>
        <div class="lbl">Rôle (prédéfini)</div>
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
          ${ROLES_STAFF.map(r => _h`<button key=${r.id}
            onClick=${()=>selectRole(r.id)}
            style=${{
              padding:'5px 10px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700,
              border: form.roleId===r.id ? '2px solid '+r.couleur : '1px solid rgba(255,255,255,.1)',
              background: form.roleId===r.id ? r.couleur+'18' : 'rgba(255,255,255,.03)',
              color: form.roleId===r.id ? r.couleur : 'rgba(255,255,255,.4)'
            }}>${r.icon} ${r.label}</button>`)}
        </div>
      </div>
      <!-- Permissions fine -->
      <div style=${{ marginBottom:12 }}>
        <div class="lbl">Permissions (personnalisables)</div>
        <div style=${{ display:'flex', gap:5, flexWrap:'wrap' }}>
          ${ALL_PERMISSIONS.map(p => _h`<button key=${p.id}
            onClick=${()=>togglePerm(p.id)}
            style=${{
              padding:'4px 9px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:600,
              border: form.permissions.includes(p.id) ? '2px solid #FFA420' : '1px solid rgba(255,255,255,.08)',
              background: form.permissions.includes(p.id) ? 'rgba(255,164,32,.12)' : 'rgba(255,255,255,.02)',
              color: form.permissions.includes(p.id) ? '#FFA420' : 'rgba(255,255,255,.35)'
            }}>${p.label}</button>`)}
        </div>
      </div>
      <div style=${{ display:'flex', gap:8 }}>
        <button class="btn" style=${{ flex:1 }} onClick=${()=>setShowAdd(false)}>Annuler</button>
        <button class="btn btn-primary" style=${{ flex:2 }} onClick=${createStaff} disabled=${creating||!form.nom||!form.email}>
          ${creating ? 'Création...' : '+ Créer le compte staff'}
        </button>
      </div>
    </div>` : null}

    <!-- Liste staff existant -->
    ${staffClub.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,.25)', background:'rgba(255,255,255,.02)', borderRadius:12, border:'1px dashed rgba(255,255,255,.07)' }}>
      Aucun membre du staff ajouté.
    </div>` : staffClub.map(s => {
      const roleDef = ROLES_STAFF.find(r => r.id === s.roleId);
      const isEditing = editStaff?.id === s.id;
      return _h`<div key=${s.id} style=${{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
        <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: isEditing?10:0 }}>
          <div style=${{ display:'flex', alignItems:'center', gap:10 }}>
            <div style=${{ fontSize:22 }}>${roleDef?.icon||'👤'}</div>
            <div>
              <div style=${{ fontSize:13, fontWeight:700 }}>${s.name}</div>
              <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${s.email} · ${roleDef?.label||s.roleId}</div>
            </div>
          </div>
          <div style=${{ display:'flex', gap:6 }}>
            <button class="btn btn-sm" style=${{ background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', color:'#FFA420' }}
              onClick=${()=>setEditStaff(isEditing ? null : {...s})}>
              ${isEditing ? '✕' : '✏️ Perms'}
            </button>
            <button class="btn btn-sm btn-danger" onClick=${()=>removeStaff(s.id)}>×</button>
          </div>
        </div>

        ${isEditing ? _h`<div>
          <!-- Rôle -->
          <div style=${{ marginBottom:8 }}>
            <div class="lbl">Rôle</div>
            <div style=${{ display:'flex', gap:4, flexWrap:'wrap' }}>
              ${ROLES_STAFF.map(r => _h`<button key=${r.id}
                onClick=${()=>setEditStaff(es => { const role=ROLES_STAFF.find(x=>x.id===r.id); return {...es, roleId:r.id, permissions:role?[...role.permissions]:es.permissions}; })}
                style=${{
                  padding:'4px 9px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700,
                  border: editStaff.roleId===r.id?'2px solid '+r.couleur:'1px solid rgba(255,255,255,.08)',
                  background: editStaff.roleId===r.id?r.couleur+'18':'rgba(255,255,255,.02)',
                  color: editStaff.roleId===r.id?r.couleur:'rgba(255,255,255,.4)'
                }}>${r.icon} ${r.label}</button>`)}
            </div>
          </div>
          <!-- Permissions -->
          <div style=${{ marginBottom:10 }}>
            <div class="lbl">Permissions</div>
            <div style=${{ display:'flex', gap:4, flexWrap:'wrap' }}>
              ${ALL_PERMISSIONS.map(p => _h`<button key=${p.id}
                onClick=${()=>setEditStaff(es => ({...es, permissions: es.permissions.includes(p.id) ? es.permissions.filter(x=>x!==p.id) : [...es.permissions, p.id]}))}
                style=${{
                  padding:'3px 8px', borderRadius:20, cursor:'pointer', fontSize:10,
                  border: editStaff.permissions.includes(p.id)?'2px solid #FFA420':'1px solid rgba(255,255,255,.08)',
                  background: editStaff.permissions.includes(p.id)?'rgba(255,164,32,.12)':'rgba(255,255,255,.02)',
                  color: editStaff.permissions.includes(p.id)?'#FFA420':'rgba(255,255,255,.35)'
                }}>${p.label}</button>`)}
            </div>
          </div>
          <button class="btn btn-primary btn-sm" style=${{ width:'100%' }} onClick=${saveEditPerms}>💾 Enregistrer</button>
        </div>` : _h`<div style=${{ display:'flex', gap:4, flexWrap:'wrap', marginTop:6 }}>
          ${getStaffPermissions(s).map(permId => {
            const pDef = ALL_PERMISSIONS.find(p=>p.id===permId);
            return pDef ? _h`<span key=${permId} style=${{ fontSize:9, padding:'2px 7px', borderRadius:20, background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.2)', color:'rgba(255,164,32,.8)' }}>${pDef.label}</span>` : null;
          })}
        </div>`}
      </div>`;
    })}
  </div>`;
}

  function resolveRole(email, fbUser) {
    console.log('[resolveRole] email:', email, 'db.clubs:', db.clubs?.length, 'INITIAL_DB.clubs:', INITIAL_DB.clubs?.length);
    if (!email) {
      // Session sans email (ex: anonyme) — aucun rôle applicatif à résoudre, on ne plante pas.
      console.warn('[resolveRole] email vide/null — session ignorée (probablement anonyme).');
      return null;
    }
    // Super-admin — accès total
    // Une seule adresse admin : toute adresse listée ici sans compte Firebase déjà créé pourrait
    // être enregistrée par n'importe qui (Firebase ne vérifie pas la propriété de l'email).
    if (email === "leo.chabanis@gmail.com") {
      return { role:"admin", name:"Leo", email, uid: fbUser.uid, tenantId: 'legacy' };
    }
    // Coach club — chercher dans db.clubs ET INITIAL_DB.clubs (fallback si db pas encore chargé)
    const allClubs = (db.clubs && db.clubs.length > 0) ? db.clubs : (INITIAL_DB.clubs || []);
    console.log('[resolveRole] allClubs emails:', allClubs.map(c => c.coach?.email));
    const club = allClubs.find(c => (c.coach.email||'').toLowerCase() === email.toLowerCase());
    console.log('[resolveRole] club found:', club?.name);
    if (club) return { role:"coach", name:club.coach.name, email, clubId:club.id, uid: fbUser.uid };
    // Joueur collectif
    const allProfiles = db.playerProfiles || db.players || [];
    const player = allProfiles.find(p => {
      const autoEmail = p.name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"") + "@player.fr";
      return (p.email||'').toLowerCase() === email || autoEmail === email;
    });
    if (player) return { role:"player", name:player.name, email, playerId:player.id, uid: fbUser.uid };
    // Joueur perso (coaching individuel)
    const allPerso = db.playersPerso || [];
    const perso = allPerso.find(p => (p.email||'').replace(/\s/g,'').toLowerCase() === email.replace(/\s/g,'').toLowerCase());
    if (perso) return { role:"perso", name:perso.name, email, playerId:perso.id, uid: fbUser.uid };
    // Staff
    const allStaff = [...(db.staffAccounts||[])];
    const staffMember = allStaff.find(s => (s.email||'').toLowerCase() === email.toLowerCase());
    if (staffMember) return {
      role:'staff', name:staffMember.name, email,
      staffId:staffMember.id, clubId:staffMember.clubId,
      permissions: getStaffPermissions(staffMember),
      roleId: staffMember.roleId,
      uid: fbUser.uid
    };
    // Compte Firebase Auth sans role defini = acces refuse
    return null;
  }

  // Ecouter les changements d'etat Firebase Auth
  React.useEffect(() => {
    if (!window.__perfhand_auth) return;
    let __lastResolvedEmail = null; // anti-boucle
    const unsub = window.__perfhand_auth.onAuthStateChanged(fbUser => {
      if (fbUser) {
        // Éviter la boucle : si déjà résolu pour cet email, ne pas re-résoudre
        if (__lastResolvedEmail === fbUser.email) return;
        // Retry resolveRole jusqu'à 5 fois avec délai croissant
        function tryResolve(attempt) {
          const role = resolveRole(fbUser.email, fbUser);
          if (role) {
            __lastResolvedEmail = fbUser.email;
            setSession(role);
            try { localStorage.setItem("perfhand_session_v2", JSON.stringify(role)); } catch {}
          } else if (attempt < 2) {
            setTimeout(() => tryResolve(attempt + 1), 500);
          } else if (attempt >= 2 && window.__perfhand_db) {
            // Fallback: chercher tenant EN PREMIER (auth encore actif)
            if (fbUser.email === 'leo.chabanis@gmail.com') {
              const fallback = { role:'coach', name:'Leo', email: fbUser.email, clubId:'usm', uid: fbUser.uid, tenantId: 'legacy' };
              setSession(fallback);
              try { localStorage.setItem("perfhand_session_v2", JSON.stringify(fallback)); } catch {}
            } else {
              // La liste complète des joueurs n'étant plus lisible par tous, on cherche d'abord
              // coach / joueur club / joueur perso via les index d'accès, puis staff, puis tenant.
              chercherRoleParIndex(fbUser).then(roleIdx => {
                if (roleIdx) {
                  setSession(roleIdx);
                  try { localStorage.setItem('perfhand_session_v2', JSON.stringify(roleIdx)); } catch {}
                  console.log('[Auth] Rôle trouvé via index:', roleIdx.role);
                  return;
                }
                fallbackStaff();
              }).catch(() => fallbackStaff());

              function fallbackStaff() {
              // Fallback STAFF : lire staffAccounts depuis Firebase
              window.__perfhand_db.ref('perfhand/staffAccounts').once('value').then(staffSnap => {
                const rawStaff = staffSnap.val();
                const staffList = rawStaff ? (Array.isArray(rawStaff) ? rawStaff.filter(Boolean) : Object.values(rawStaff)) : [];
                if (!fbUser.email) { console.warn('[Auth] fbUser.email manquant — session ignorée (probablement anonyme).'); return; }
                const staffMember = staffList.find(s => (s.email||'').toLowerCase() === fbUser.email.toLowerCase());
                if (staffMember) {
                  const role = {
                    role:'staff', name:staffMember.name, email:fbUser.email,
                    staffId:staffMember.id, clubId:staffMember.clubId,
                    permissions: getStaffPermissions(staffMember),
                    roleId: staffMember.roleId, uid:fbUser.uid
                  };
                  setSession(role);
                  try { localStorage.setItem('perfhand_session_v2', JSON.stringify(role)); } catch {}
                  console.log('[Auth] Staff trouvé:', staffMember.name);
                  return;
                }
                // Sinon, continuer vers la résolution tenant
                resolveTenantFallback();
              }).catch(() => resolveTenantFallback());
              } // fin fallbackStaff

              function resolveTenantFallback() {
              window.__perfhand_db.ref('tenants_by_uid/' + fbUser.uid).once('value').then(snap => {
                  const tenantId = snap.val();
                  if (tenantId) {
                    window.__perfhand_db.ref('tenants/' + tenantId).once('value').then(ts => {
                      const tenant = ts.val();
                      if (tenant) {
                        const role = { role:'tenant_admin', name:tenant.nom, email:fbUser.email, tenantId, uid:fbUser.uid };
                        setSession(role);
                        try { localStorage.setItem('perfhand_session_v2', JSON.stringify(role)); } catch {}
                        console.log('[Auth] Tenant admin trouvé:', tenantId);
                        return;
                      }
                      console.warn('[Auth] tenantId trouvé mais tenant vide');
                    });
                  } else {
                    // Joueur d'un tenant : d'abord l'index acces/joueursTenant, sinon parcours de tous les tenants
                    const kT = cleEmail(fbUser.email);
                    (kT ? window.__perfhand_db.ref('acces/joueursTenant/' + kT).once('value').then(s => s.val()).catch(() => null) : Promise.resolve(null)).then(jt => {
                      if (jt && jt.tenantId && jt.playerId) {
                        return window.__perfhand_db.ref('tenants/' + jt.tenantId + '/playersPerso/' + jt.playerId).once('value').then(ps => {
                          const pl = ps.val();
                          if (!pl) return scanTousTenants();
                          const role = { role:'tenant_perso', name:pl.name, email:fbUser.email, playerId:jt.playerId, tenantId:jt.tenantId, uid:fbUser.uid };
                          setSession(role);
                          try { localStorage.setItem('perfhand_session_v2', JSON.stringify(role)); } catch {}
                        }).catch(() => scanTousTenants());
                      }
                      scanTousTenants();
                    });
                    function scanTousTenants() {
                    window.__perfhand_db.ref('tenants').once('value').then(allSnap => {
                      const allTenants = allSnap.val();
                      if (!allTenants) { console.warn('[Auth] Pas de tenants'); return; }
                      if (!fbUser.email) { console.warn('[Auth] fbUser.email manquant — session ignorée (probablement anonyme).'); return; }
                      for (const [tid, tenant] of Object.entries(allTenants)) {
                        const players = tenant.playersPerso
                          ? (Array.isArray(tenant.playersPerso) ? tenant.playersPerso : Object.values(tenant.playersPerso)).filter(Boolean)
                          : [];
                        const player = players.find(p => (p.email||'').toLowerCase() === fbUser.email.toLowerCase());
                        if (player) {
                          const role = { role:'tenant_perso', name:player.name, email:fbUser.email, playerId:player.id, tenantId:tid, uid:fbUser.uid };
                          setSession(role);
                          try { localStorage.setItem('perfhand_session_v2', JSON.stringify(role)); } catch {}
                          console.log('[Auth] Tenant player trouvé:', player.id, 'tenant:', tid);
                          return;
                        }
                      }
                      console.warn('[Auth] Role introuvable pour', fbUser.email);
                      console.warn('[Auth] Tenant non trouvé pour', fbUser.uid);
                    }).catch(e => console.warn('[Auth] Role introuvable pour', fbUser.email, '(lecture tenants refusée)'));
                    } // fin scanTousTenants
                  }
                });
              } // fin resolveTenantFallback
            }
          } else if (attempt > 2) {
            // déjà géré
          }
        }
        tryResolve(1);
      } else {
        // Ne pas écraser une session par code d'accès (tenant_perso OU usm_code)
        try {
          const ts = localStorage.getItem('perfhand_tenant_session');
          if (ts) {
            const parsed = JSON.parse(ts);
            if (parsed && (parsed.role === 'tenant_perso' || parsed.role === 'usm_code')) {
              setSession(parsed);
              return;
            }
          }
        } catch(e) {}
        setSession(null);
        try { localStorage.removeItem("perfhand_session_v2"); } catch {}
      }
    });
    return () => unsub();
  }, [db.clubs, db.players, db.playersPerso, db.staffAccounts]);

  async function login(email, password) {
    if (!window.__perfhand_auth) {
      return { ok:false, msg:"Service d'authentification non disponible" };
    }
    window.__perfhand_real_login_pending = true;
    try {
      await window.__perfhand_auth.signInWithEmailAndPassword(email.trim(), password);
      return { ok:true };
    } catch(e) {
      window.__perfhand_real_login_pending = false;
      const msgs = {
        'auth/user-not-found':   'Aucun compte avec cet email.',
        'auth/wrong-password':   'Mot de passe incorrect.',
        'auth/invalid-email':    'Email invalide.',
        'auth/too-many-requests':'Trop de tentatives. Réessaie dans quelques minutes.',
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
      };
      return { ok:false, msg: msgs[e.code] || 'Connexion impossible. Verifie tes identifiants.' };
    }
  }

  function logout() {
    if (window.__perfhand_auth) window.__perfhand_auth.signOut();
    window.__perfhand_real_user_active = false;
    window.__perfhand_real_login_pending = false;
    __lastResolvedEmail = null;
    setSession(null);
    try { localStorage.removeItem("perfhand_session_v2"); } catch {}
    try { localStorage.removeItem('perfhand_tenant_session'); } catch {}
  }

  function resetDb() {
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("perfhand_session_v2"); } catch {}
    setDbRaw(INITIAL_DB);
    setSession(null);
  }

  // Nettoyage unique des anciens mots de passe stockés en base, fait avec les droits de l'admin.
  React.useEffect(() => {
    if (session && session.role === 'admin') {
      purgerMotsDePasseStockes();
      indexerTousLesCodesTenants();
      setTimeout(reconstruireIndexAcces, 2500); // index d'accès lus par les règles de sécurité
    }
  }, [session && session.role]);

  // Coach / staff / admin : complète les index d'accès quand un joueur ou un membre est ajouté.
  const cleIndexLocale = (session && ['admin', 'coach', 'staff'].includes(session.role))
    ? JSON.stringify(calculerIndexAcces({ clubs: db.clubs, staffAccounts: db.staffAccounts, playerProfiles: db.playerProfiles, playersPerso: db.playersPerso }))
    : '';
  React.useEffect(() => {
    if (!cleIndexLocale) return;
    const t = setTimeout(() => completerIndexAcces(db), 2000);
    return () => clearTimeout(t);
  }, [cleIndexLocale]);

  // Joueur connecté (email ou code) : écoute de SA fiche uniquement. Les règles ne lui donnent plus
  // accès à la liste complète des joueurs ; sans ça son espace resterait vide.
  React.useEffect(() => {
    if (!session || !session.playerId || !window.__perfhand_db) return;
    const role = session.role;
    const perso = role === 'perso';
    if (!perso && role !== 'player' && role !== 'usm_code') return;
    const chemin = (perso ? 'perfhand/playersPerso/' : 'perfhand/playerProfiles/') + session.playerId;
    const cle = perso ? 'playersPerso' : 'playerProfiles';
    let annule = false, r = null, h = null;
    (window.__perfhand_auth_pret || Promise.resolve()).then(() => {
      if (annule) return;
      r = window.__perfhand_db.ref(chemin);
      h = r.on('value', snap => {
        const v = snap.val();
        if (!v || typeof v !== 'object') return;
        const remote = { ...v, id: v.id || session.playerId };
        setDbRaw(prev => {
          const liste = prev[cle] || [];
          const local = liste.find(p => p && p.id === remote.id);
          const fusion = perso ? fusionnerPersoDistant(local || {}, remote) : sanitizeProfile(remote);
          if (!fusion || (local && JSON.stringify(local) === JSON.stringify(fusion))) return prev;
          const next = { ...prev, [cle]: local ? liste.map(p => (p && p.id === remote.id) ? fusion : p) : [...liste, fusion] };
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch(e) {}
          return next;
        });
      }, e => console.warn('[fiche joueur] lecture refusée', chemin, e && e.code));
    });
    return () => { annule = true; if (r && h) r.off('value', h); };
  }, [cleConnexion]);

  // Session par code : vérifie que la session Firebase est bien liée au code (règles de sécurité).
  // Session ouverte avant cette mise à jour (code non mémorisé) et fiche devenue illisible :
  // on demande de ressaisir le code, au lieu d'afficher un espace vide.
  React.useEffect(() => {
    if (!session || session.email || !authUid || !window.__perfhand_db) return;
    const estClub = session.role === 'usm_code', estTenant = session.role === 'tenant_perso';
    if (!estClub && !estTenant) return;
    const fdb = window.__perfhand_db;
    let annule = false;
    (async () => {
      let lien = null;
      try { lien = (await fdb.ref((estClub ? 'perfhand/codeSessions/' : 'tenantCodeSessions/') + authUid).once('value')).val(); }
      catch(e) { return; } // anciennes règles : rien à vérifier
      if (annule || (lien && lien.playerId === session.playerId)) return;
      if (session.code) {
        try {
          if (estClub) await lierCodeClub(session.code, session.playerId, session.clubId);
          else await lierCodeTenant(session.code, session.tenantId, session.playerId);
          return;
        } catch(e) {} // code supprimé entre-temps : on tombe dans la vérification ci-dessous
      }
      try {
        await fdb.ref(estClub ? 'perfhand/playerProfiles/' + session.playerId : 'tenants/' + session.tenantId + '/playersPerso/' + session.playerId).once('value');
      } catch(e) {
        if (annule) return;
        alert('Pour sécuriser ton compte, entre à nouveau ton code d\'accès.');
        logout();
      }
    })();
    return () => { annule = true; };
  }, [cleConnexion]);

  const ctx = { session, login, logout, db, setDb, resetDb, user:session };

  // Register screen state
  const [showRegister, setShowRegister] = useState(false);
  React.useEffect(() => { window.__showRegister = setShowRegister; }, []);

  if (showRegister) {
    return React.createElement(RegisterScreen, { onBack: () => setShowRegister(false) });
  }

  return _h`<${AppCtx.Provider} value=${ctx}>
    ${!session && !window._shareContext && _h`<${LoginScreen} />`}
    ${session && session.role === "admin"  && _h`<${SuperAdminView} />`}
    ${session && session.role === "coach"  && _h`<${CoachView} />`}
    ${session && session.role === "player" && _h`<${PlayerView} />`}
    ${session && session.role === "usm_code" && _h`<${PlayerView} />`}
    ${session && session.role === "perso"  && _h`<${PersoPlayerView} />`}
    ${session && session.role === "staff"  && _h`<${StaffView2} />`}
    ${session && session.role === "tenant_admin" && React.createElement(TenantAdminView, { tenant: session, onBack: logout })}
    ${session && session.role === "tenant_perso" && React.createElement(TenantPlayerView, { session })}
    ${!session && window._shareContext && _h`<${SharedPlayerView} />`}
  </${AppCtx.Provider}>`;
}

    // Filet de sécurité global : sans ça, la moindre erreur de rendu QUELQUE PART dans l'appli —
    // même après le chargement initial, par ex. juste après avoir enregistré un match — fait
    // disparaître TOUTE l'interface sans aucun message (écran noir), impossible à diagnostiquer.
    // Cette classe intercepte ces erreurs et affiche le détail au lieu de planter en silence.
    class PerfHandErrorBoundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null, info: null }; }
      static getDerivedStateFromError(error) { return { error }; }
      componentDidCatch(error, info) {
        console.error('[PerfHand] Erreur non interceptée:', error, info && info.componentStack);
        this.setState({ info: info && info.componentStack });
      }
      render() {
        if (this.state.error) {
          const msg = (this.state.error && this.state.error.message) || String(this.state.error);
          return React.createElement('div', { style: { padding: '24px 18px', fontFamily: 'Inter, sans-serif', color: '#fff', background: '#0b0d10', minHeight: '100vh' } },
            React.createElement('div', { style: { fontSize: 20, fontWeight: 800, marginBottom: 10, color: '#FF4455' } }, '⚠️ Une erreur est survenue'),
            React.createElement('div', { style: { fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 16, lineHeight: 1.6 } },
              'Rien n\'est perdu — tes données déjà enregistrées sont en sécurité. Recharge la page pour continuer. Si ça se reproduit, envoie ce message tel quel à Léo :'),
            React.createElement('pre', { style: { fontSize: 11, background: 'rgba(255,255,255,.05)', padding: 12, borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap', color: '#FFA420', maxHeight: 260 } },
              msg + (this.state.info ? '\n' + this.state.info : '')),
            React.createElement('button', {
              onClick: () => window.location.reload(true),
              style: { marginTop: 16, padding: '10px 20px', borderRadius: 9, border: '2px solid #FFA420', background: 'rgba(255,164,32,.15)', color: '#FFA420', fontWeight: 800, cursor: 'pointer', fontSize: 13 }
            }, '↻ Recharger la page')
          );
        }
        return this.props.children;
      }
    }

    ReactDOM.createRoot(document.getElementById('root')).render(
      React.createElement(PerfHandErrorBoundary, null, React.createElement(PerfHandApp))
    );
  } catch(e) {
    console.error('App error:', e);
    document.getElementById('ls').textContent = 'Erreur: ' + e.message;
  }
}
