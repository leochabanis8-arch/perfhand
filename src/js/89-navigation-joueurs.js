// ── NAVIGATION RAPIDE ENTRE FICHES JOUEURS ─────────────────────────────────────
// Barre affichée en haut d'une fiche : ← joueur précédent / suivant → (dans le même groupe)
// + recherche par nom (dans tous les joueurs accessibles). L'onglet ouvert (Muscu, Planif…) est
// conservé d'une fiche à l'autre (voir ongletMemorise).
// joueurs = [{ id, nom, sous?, ouvrir() }] ; groupe = ids pour précédent/suivant (défaut : tous).

function ongletMemorise(cle, defaut) {
  const [onglet, setOnglet] = useState(() => (window.__perfhand_onglets && window.__perfhand_onglets[cle]) || defaut);
  const changer = v => {
    window.__perfhand_onglets = { ...(window.__perfhand_onglets || {}), [cle]: v };
    setOnglet(v);
  };
  return [onglet, changer];
}

function sansAccents(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function NavJoueurs({ joueurs, groupe, courantId }) {
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const liste = (joueurs || []).filter(j => j && j.id);
  const ordre = groupe ? liste.filter(j => groupe.includes(j.id)) : liste;
  const idx = ordre.findIndex(j => j.id === courantId);
  const prec = idx > 0 ? ordre[idx - 1] : null;
  const suiv = idx >= 0 && idx < ordre.length - 1 ? ordre[idx + 1] : null;
  const q = sansAccents(texte.trim());
  const resultats = q ? liste.filter(j => sansAccents(j.nom + ' ' + (j.sous || '')).includes(q)).slice(0, 12) : [];
  const aller = j => { if (!j) return; setTexte(''); setOuvert(false); j.ouvrir(); try { window.scrollTo(0, 0); } catch (e) {} };

  const btn = actif => ({ padding:'6px 10px', borderRadius:8, fontSize:11.5, fontWeight:700, whiteSpace:'nowrap', maxWidth:170,
    overflow:'hidden', textOverflow:'ellipsis', cursor: actif ? 'pointer' : 'default',
    border:'1px solid ' + (actif ? 'rgba(255,164,32,.35)' : 'rgba(255,255,255,.08)'),
    background: actif ? 'rgba(255,164,32,.08)' : 'rgba(255,255,255,.02)', color: actif ? '#FFA420' : 'rgba(255,255,255,.2)' });

  return _h`<div class="nav-joueurs" style=${{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', margin:'0 0 12px' }}>
    <button style=${btn(!!prec)} disabled=${!prec} onClick=${() => aller(prec)} title=${prec ? prec.nom : ''}>← ${prec ? prec.nom : 'Précédent'}</button>
    <span style=${{ fontSize:10.5, color:'rgba(255,255,255,.35)' }}>${idx >= 0 ? (idx + 1) + ' / ' + ordre.length : ''}</span>
    <button style=${btn(!!suiv)} disabled=${!suiv} onClick=${() => aller(suiv)} title=${suiv ? suiv.nom : ''}>${suiv ? suiv.nom : 'Suivant'} →</button>
    <div style=${{ position:'relative', flex:'1 1 180px', minWidth:150, maxWidth:320 }}>
      <input class="inp" value=${texte} placeholder="🔍 Aller à un joueur…"
        onInput=${e => { setTexte(e.target.value); setOuvert(true); }}
        onFocus=${() => setOuvert(true)}
        onBlur=${() => setTimeout(() => setOuvert(false), 200)}
        onKeyDown=${e => { if (e.key === 'Enter' && resultats.length) aller(resultats[0]); if (e.key === 'Escape') { setTexte(''); setOuvert(false); } }}
        style=${{ width:'100%', boxSizing:'border-box', padding:'6px 10px', fontSize:12 }}/>
      ${ouvert && q ? _h`<div style=${{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, marginTop:4, background:'#1A1A1A',
          border:'1px solid rgba(255,255,255,.12)', borderRadius:8, maxHeight:300, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,.5)' }}>
        ${resultats.length ? resultats.map(j => _h`<div key=${j.id} onMouseDown=${e => { e.preventDefault(); aller(j); }}
            style=${{ padding:'7px 10px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.05)', background: j.id === courantId ? 'rgba(255,164,32,.08)' : 'transparent' }}>
            <div style=${{ fontSize:12, fontWeight:700 }}>${j.nom}</div>
            ${j.sous ? _h`<div style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${j.sous}</div>` : null}
          </div>`)
          : _h`<div style=${{ padding:'8px 10px', fontSize:11, color:'rgba(255,255,255,.4)' }}>Aucun joueur trouvé</div>`}
      </div>` : null}
    </div>
  </div>`;
}
