
// ═══════════════════════════════════════════════════════════════════════════════
// ── TACTIQUE HANDBALL — terrain, joueurs déplaçables, étapes animées, bibliothèque ──
// Coordonnées : terrain complet 400 × 200 (1 m = 10 unités), but ATTAQUÉ à DROITE (x = 400).
// Un schéma = { tokens:[{id,kind,label}], frames:[{pos:{id:{x,y,d}}, arrows:[], note}] }.
// "d" (0 → 0.8) = départ décalé du déplacement qui MÈNE à cette étape (timing).
// Persistance : Firebase 'perfhand/tactique/<id>' + db.tactique (copie locale).
// ═══════════════════════════════════════════════════════════════════════════════
const TACT_W = 400, TACT_H = 200;
const TACT_CATS = [
  { id:'attaque_placee', label:'Attaque placée',        color:'#FFA420' },
  { id:'defense',        label:'Défense',               color:'#EF4444' },
  { id:'montee',         label:'Montée de balle',       color:'#38BDF8' },
  { id:'transition',     label:'Contre-attaque / transition', color:'#4CAF50' },
  { id:'repli',          label:'Repli défensif',        color:'#A78BFA' },
  { id:'superiorite',    label:'Supériorité / Infériorité', color:'#EC4899' },
  { id:'cpa',            label:'Coups francs / 7m / Remises en jeu', color:'#14B8A6' },
  { id:'autre',          label:'Autre',                 color:'#94A3B8' },
];
const TACT_DEFENSES = {
  '6-0':   [[36,25],[60,52],[68,80],[68,120],[60,148],[36,175]],
  '5-1':   [[36,25],[62,58],[70,100],[62,142],[36,175],[112,100]],
  '3-2-1': [[50,40],[68,100],[50,160],[88,68],[88,132],[120,100]],
  '4-2':   [[38,28],[64,68],[64,132],[38,172],[96,78],[96,122]],
};
// Positions d'attaque de base (distance au but, y) — le but attaqué est à droite
const TACT_ATT_BASE = [
  ['A_AG','AG',10,12], ['A_ARG','ARG',95,42], ['A_DC','DC',102,100],
  ['A_ARD','ARD',95,158], ['A_AD','AD',10,188], ['A_P','P',64,100],
];

function tactG(dx, y) { return { x: TACT_W - dx, y: y }; }

function tactNormPlay(p) {
  if (!p) return null;
  const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === 'object' ? Object.values(v).filter(Boolean) : []);
  const frames = arr(p.frames).map(f => ({ pos: f.pos || {}, arrows: arr(f.arrows), zones: arr(f.zones), note: f.note || '', ...(f.dur ? { dur: f.dur } : {}) }));
  const quiz = arr(p.quiz).map(q => ({ ...q, options: arr(q.options) }));
  return { ...p, tokens: arr(p.tokens), quiz, frames: frames.length ? frames : [{ pos:{}, arrows:[], zones:[], note:'' }] };
}

// Crée les jetons + positions de la 1re étape. sys = '6-0' | '5-1' | '3-2-1' | '4-2' | null
function tactBuild(sys, opts) {
  opts = opts || {};
  const tokens = [], pos = {};
  TACT_ATT_BASE.forEach(([id, label, dx, y]) => { tokens.push({ id, kind:'att', label }); pos[id] = tactG(dx, y); });
  tokens.push({ id:'A_GB', kind:'gb', label:'GB' }); pos['A_GB'] = { x:14, y:100 };
  if (sys && TACT_DEFENSES[sys]) {
    TACT_DEFENSES[sys].forEach(([dx, y], i) => { const id = 'D' + (i + 1); tokens.push({ id, kind:'def', label:String(i + 1) }); pos[id] = tactG(dx, y); });
  }
  tokens.push({ id:'D_GB', kind:'gbd', label:'GB' }); pos['D_GB'] = tactG(8, 100);
  tokens.push({ id:'B', kind:'ball', label:'' });
  const dc = pos['A_DC']; pos['B'] = { x: dc.x - 10, y: dc.y + 9 };
  return { tokens, pos };
}

function tactNewPlay(sys, clubId, auteur, cat) {
  const b = tactBuild(sys);
  return {
    id: 't' + Date.now() + Math.floor(Math.random() * 1000),
    titre: sys ? ('Attaque vs ' + sys) : 'Nouveau schéma',
    categorie: cat || 'attaque_placee', description: '', clubId: clubId || '',
    visibleJoueurs: false, vue: 'demi', auteur: auteur || '', maj: Date.now(),
    tokens: b.tokens, frames: [{ pos: b.pos, arrows: [], note: '' }],
  };
}

// Exemples prêts à l'emploi (modifiables ensuite)
function tactExamples(clubId, auteur) {
  const mk = (titre, cat, vue, desc, sys, framesFn) => {
    const base = tactNewPlay(sys, clubId, auteur, cat);
    base.titre = titre; base.vue = vue; base.description = desc;
    base.frames = framesFn(base.frames[0].pos);
    return base;
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  const out = [];
  // 1. Montée de balle
  out.push(mk('Montée de balle — GB, DC, ailiers', 'montee', 'complet',
    "Relance du gardien vers le demi-centre, puis alimentation des ailiers qui étirent le terrain pendant que la défense se replace. Insister sur la vitesse de course des ailiers et la lecture du premier relai.", '6-0', (p0) => {
    const f0 = clone(p0);
    const set = (f, id, x, y, d) => { f[id] = { x, y, ...(d ? { d } : {}) }; };
    set(f0,'A_GB',14,100); set(f0,'A_DC',70,100); set(f0,'A_ARG',115,55); set(f0,'A_ARD',115,145);
    set(f0,'A_AG',140,14); set(f0,'A_AD',140,186); set(f0,'A_P',215,100); set(f0,'B',24,108);
    ['D1','D2','D3','D4','D5','D6'].forEach((id, i) => set(f0, id, 290, 20 + i * 32));
    set(f0,'D_GB',392,100);
    const f1 = clone(f0);
    set(f1,'B',80,108); set(f1,'A_AG',250,12,0); set(f1,'A_AD',250,188,0.2); set(f1,'A_ARG',190,60); set(f1,'A_ARD',190,140); set(f1,'A_P',290,100,0.3); set(f1,'A_DC',95,100);
    ['D1','D2','D3','D4','D5','D6'].forEach((id, i) => set(f1, id, 318, 22 + i * 31));
    const f2 = clone(f1);
    set(f2,'B',198,66); set(f2,'A_ARG',200,56); set(f2,'A_DC',190,100); set(f2,'A_ARD',200,146); set(f2,'A_AG',326,12); set(f2,'A_AD',326,188,0.15); set(f2,'A_P',312,100);
    return [
      { pos:f0, arrows:[{ id:'a1', type:'pass', x1:24, y1:108, x2:80, y2:108 }, { id:'a2', type:'run', x1:140, y1:14, x2:245, y2:12 }, { id:'a3', type:'run', x1:140, y1:186, x2:245, y2:188 }], note:"1 — Le GB lance vers le DC. Les ailiers partent dès que le GB prend le ballon." },
      { pos:f1, arrows:[{ id:'a4', type:'pass', x1:80, y1:108, x2:198, y2:66 }, { id:'a5', type:'run', x1:250, y1:12, x2:324, y2:12 }], note:"2 — Le DC cherche le premier relai : l'arrière gauche. Timing : l'aile droite part un peu après l'aile gauche." },
      { pos:f2, arrows:[], note:"3 — Le bloc offensif est en place : ailiers écartés, pivot entre les lignes. Début de l'attaque placée." },
    ];
  }));
  // 2. Croisé arrière / ailier
  out.push(mk('Croisé arrière-ailier + pivot (vs 6-0)', 'attaque_placee', 'demi',
    "Circulation DC → arrière droit, croisé avec l'ailier droit pendant que le pivot fixe entre D5 et D6. Repère : l'ailier coupe à l'intérieur au moment où l'arrière transmet.", '6-0', (p0) => {
    const f0 = clone(p0);
    const set = (f, id, x, y, d) => { f[id] = { x, y, ...(d ? { d } : {}) }; };
    set(f0,'B',tactG(100,100).x - 6, 110);
    const f1 = clone(f0);
    set(f1,'B',tactG(95,158).x - 6, 166); set(f1,'A_P',tactG(66,128).x, 128,0.1);
    set(f1,'D4',tactG(70,128).x,118); set(f1,'D5',tactG(60,150).x,142); set(f1,'D6',tactG(36,172).x,170);
    set(f1,'A_DC',tactG(100,112).x,112);
    const f2 = clone(f1);
    set(f2,'A_AD',tactG(52,166).x,166,0.3); set(f2,'A_ARD',tactG(12,190).x,190); set(f2,'B',tactG(52,166).x - 6, 172);
    set(f2,'D6',tactG(46,170).x,172); set(f2,'D5',tactG(66,148).x,144);
    const f3 = clone(f2);
    set(f3,'B',tactG(3,100).x, 104);
    return [
      { pos:f0, arrows:[{ id:'b1', type:'pass', x1:p0['A_DC'].x - 4, y1:109, x2:tactG(95,158).x, y2:158 }], note:"1 — Départ : le DC a le ballon, la défense est en 6-0." },
      { pos:f1, arrows:[{ id:'b2', type:'run', x1:tactG(10,188).x, y1:188, x2:tactG(52,166).x, y2:166 }, { id:'b3', type:'run', x1:tactG(95,158).x, y1:158, x2:tactG(12,190).x, y2:190 }, { id:'b4', type:'screen', x1:tactG(66,128).x - 2, y1:128, x2:tactG(66,128).x - 2, y2:146 }], note:"2 — L'arrière reçoit. Le pivot fixe D5 / D6 (écran). L'ailier prépare sa coupe." },
      { pos:f2, arrows:[{ id:'b5', type:'shot', x1:tactG(52,166).x, y1:166, x2:tactG(2,104).x, y2:104 }], note:"3 — Croisé : l'arrière donne à l'ailier qui coupe à l'intérieur, l'arrière sort sur l'aile. Timing : l'ailier part seulement quand l'arrière a la balle." },
      { pos:f3, arrows:[], note:"4 — Tir de l'ailier dans l'intervalle libéré par le pivot." },
    ];
  }));
  // 3. Défense 6-0 : glissement
  out.push(mk('Défense 6-0 — glissement latéral', 'defense', 'demi',
    "Le ballon circule de gauche à droite : toute la ligne glisse ensemble, chaque défenseur gardant ses repères ballon / joueur. Le défenseur opposé au ballon se resserre vers l'axe.", '6-0', (p0) => {
    const f0 = clone(p0);
    const set = (f, id, x, y, d) => { f[id] = { x, y, ...(d ? { d } : {}) }; };
    set(f0,'B',tactG(95,42).x - 6, 50);
    const f1 = clone(f0);
    set(f1,'B',tactG(102,100).x - 6, 108);
    ['D1','D2','D3','D4','D5','D6'].forEach((id, i) => { const q = tactG(TACT_DEFENSES['6-0'][i][0], TACT_DEFENSES['6-0'][i][1] + 3 * (i - 2)); set(f1, id, q.x - 3, q.y, i * 0.05); });
    const f2 = clone(f1);
    set(f2,'B',tactG(95,158).x - 6, 166);
    ['D1','D2','D3','D4','D5','D6'].forEach((id, i) => { const q = tactG(TACT_DEFENSES['6-0'][i][0], TACT_DEFENSES['6-0'][i][1] + 7 * (i - 2) + 6); set(f2, id, q.x - 4, q.y, (5 - i) * 0.05); });
    return [
      { pos:f0, arrows:[{ id:'c1', type:'pass', x1:tactG(95,42).x - 6, y1:50, x2:tactG(102,100).x - 6, y2:108 }], note:"1 — Ballon côté arrière gauche : la ligne est calée sur lui." },
      { pos:f1, arrows:[{ id:'c2', type:'pass', x1:tactG(102,100).x - 6, y1:108, x2:tactG(95,158).x - 6, y2:166 }], note:"2 — Renversement vers le centre : la ligne glisse, les épaules restent face au ballon." },
      { pos:f2, arrows:[], note:"3 — Ballon côté arrière droit : le défenseur de l'aile gauche se resserre dans l'axe pour fermer le centre." },
    ];
  }));
  return out;
}

function tactEase(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function tactPosAt(play, i, t) {
  const A = play.frames[i] || play.frames[0];
  const B = play.frames[Math.min(i + 1, play.frames.length - 1)] || A;
  const out = {};
  (play.tokens || []).forEach(tk => {
    const a = (A.pos && A.pos[tk.id]) || { x:0, y:0 };
    const b = (B.pos && B.pos[tk.id]) || a;
    const d = Math.min(0.8, Math.max(0, b.d || 0));
    let u = (t - d) / (1 - d); u = Math.max(0, Math.min(1, u)); u = tactEase(u);
    out[tk.id] = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  });
  return out;
}

function tactSavePlay(setDb, play) {
  const clean = JSON.parse(JSON.stringify({ ...play, maj: Date.now() }));
  setDb(d => ({ ...d, tactique: { ...(d.tactique || {}), [clean.id]: clean } }));
  try { if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/tactique/' + clean.id).set(clean).catch(e => console.error('[tactique] écriture refusée', e && e.code)); } catch (e) {}
  return clean;
}
function tactDeletePlay(setDb, id) {
  setDb(d => { const t = { ...(d.tactique || {}) }; delete t[id]; return { ...d, tactique: t }; });
  try { if (window.__perfhand_db) window.__perfhand_db.ref('perfhand/tactique/' + id).remove(); } catch (e) {}
}

// ── Terrain + jetons + animation ──────────────────────────────────────────────
function TactiqueBoard({ play, onChange, readOnly, jump }) {
  const [fi, setFi] = React.useState(0);
  const [tool, setTool] = React.useState('move');
  const [sel, setSel] = React.useState(null);
  const [anim, setAnim] = React.useState(null);
  const [speed, setSpeed] = React.useState(1);
  const [draft, setDraft] = React.useState(null);
  const svgRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const speedRef = React.useRef(1);
  speedRef.current = speed;

  const nFrames = play.frames.length;
  const idx = Math.max(0, Math.min(fi, nFrames - 1));
  const frame = play.frames[idx];
  React.useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  // Saut vers une étape demandée depuis le quiz
  React.useEffect(() => {
    if (!jump || jump.i === undefined) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null; setAnim(null); setSel(null);
    setFi(Math.max(0, Math.min(jump.i, nFrames - 1)));
  }, [jump && jump.k]);

  const playing = !!anim;
  const posNow = anim ? tactPosAt(play, anim.i, anim.t) : (frame.pos || {});
  const arrowsNow = anim ? (play.frames[anim.i].arrows || []).map(a => ({ ...a, _op: Math.max(0, 1 - anim.t * 1.4) })) : (frame.arrows || []);
  const noteNow = anim ? (play.frames[anim.i].note || '') : (frame.note || '');
  const zonesNow = (anim ? play.frames[anim.i] : frame).zones || [];
  const vb = play.vue === 'complet' ? '-14 -10 428 220' : '188 -10 226 220';

  function edit(fn) { if (readOnly) return; const c = JSON.parse(JSON.stringify(play)); fn(c); onChange(c); }
  function toPt(e) {
    const svg = svgRef.current; if (!svg) return { x:0, y:0 };
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM(); if (!m) return { x:0, y:0 };
    const r = pt.matrixTransform(m.inverse());
    return { x: Math.max(-8, Math.min(TACT_W + 8, r.x)), y: Math.max(-8, Math.min(TACT_H + 8, r.y)) };
  }
  function stopAnim() { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; setAnim(null); }
  function startPlay() {
    if (nFrames < 2) return;
    if (playing) { stopAnim(); return; }
    setSel(null);
    const run = { i: 0, t0: performance.now(), phase: 'move' };
    setFi(0); setAnim({ i: 0, t: 0 });
    const tick = (now) => {
      const dur = (((play.frames[run.i] && play.frames[run.i].dur) || 1.9) * 1000) / speedRef.current, pause = 800 / speedRef.current;
      if (run.phase === 'move') {
        const t = (now - run.t0) / dur;
        if (t >= 1) { setAnim({ i: run.i, t: 1 }); run.phase = 'pause'; run.t0 = now; }
        else setAnim({ i: run.i, t: t });
      } else if (now - run.t0 >= pause) {
        run.i++; setFi(run.i);
        if (run.i >= nFrames - 1) { setAnim(null); rafRef.current = null; return; }
        run.phase = 'move'; run.t0 = now; setAnim({ i: run.i, t: 0 });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function onTokenDown(e, tk) {
    if (playing) return;
    e.stopPropagation();
    setSel({ k:'token', id: tk.id });
    if (readOnly || tool !== 'move') return;
    dragRef.current = { id: tk.id };
    try { svgRef.current.setPointerCapture(e.pointerId); } catch (er) {}
  }
  function onSvgDown(e) {
    if (playing) return;
    if (tool === 'move' || readOnly) { setSel(null); return; }
    const p = toPt(e);
    setDraft({ type: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    try { svgRef.current.setPointerCapture(e.pointerId); } catch (er) {}
  }
  function onSvgMove(e) {
    if (dragRef.current) {
      const p = toPt(e), id = dragRef.current.id;
      edit(c => { const f = c.frames[idx]; f.pos[id] = { ...(f.pos[id] || {}), x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }; });
    } else if (draft) {
      const p = toPt(e); setDraft({ ...draft, x2: p.x, y2: p.y });
    }
  }
  function onSvgUp() {
    if (dragRef.current) { dragRef.current = null; return; }
    if (draft) {
      const len = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
      if (draft.type === 'zone') {
        if (Math.abs(draft.x2 - draft.x1) > 8 && Math.abs(draft.y2 - draft.y1) > 8) edit(c => {
          c.frames[idx].zones = c.frames[idx].zones || [];
          c.frames[idx].zones.push({ id:'zn' + Date.now(), x: Math.round(Math.min(draft.x1, draft.x2)), y: Math.round(Math.min(draft.y1, draft.y2)), w: Math.round(Math.abs(draft.x2 - draft.x1)), h: Math.round(Math.abs(draft.y2 - draft.y1)) });
        });
      } else if (len > 10) edit(c => { c.frames[idx].arrows = c.frames[idx].arrows || []; c.frames[idx].arrows.push({ id:'ar' + Date.now(), type: draft.type, x1: Math.round(draft.x1), y1: Math.round(draft.y1), x2: Math.round(draft.x2), y2: Math.round(draft.y2) }); });
      setDraft(null);
    }
  }

  function addFrame() {
    edit(c => {
      const f = JSON.parse(JSON.stringify(c.frames[idx]));
      f.arrows = []; f.zones = []; f.note = ''; delete f.dur;
      Object.keys(f.pos).forEach(k => { if (f.pos[k]) delete f.pos[k].d; });
      c.frames.splice(idx + 1, 0, f);
    });
    setFi(idx + 1); setSel(null);
  }
  function delFrame() {
    if (nFrames < 2) return;
    edit(c => { c.frames.splice(idx, 1); });
    setFi(Math.max(0, idx - 1)); setSel(null);
  }
  function autoArrows() {
    if (idx >= nFrames - 1) return;
    edit(c => {
      const A = c.frames[idx], B = c.frames[idx + 1];
      c.tokens.forEach(tk => {
        const a = A.pos[tk.id], b = B.pos[tk.id]; if (!a || !b) return;
        if (Math.hypot(b.x - a.x, b.y - a.y) < 10) return;
        A.arrows = A.arrows || [];
        A.arrows.push({ id:'ar' + Date.now() + tk.id, type: tk.kind === 'ball' ? 'pass' : 'run', x1: Math.round(a.x), y1: Math.round(a.y), x2: Math.round(b.x), y2: Math.round(b.y) });
      });
    });
  }
  function addToken(kind) {
    edit(c => {
      const n = c.tokens.filter(t => t.kind === kind).length + 1;
      const id = 'X' + Date.now();
      const label = kind === 'att' ? '' : kind === 'def' ? String(n) : '';
      c.tokens.push({ id, kind, label });
      const cx = c.vue === 'complet' ? 200 : 300;
      c.frames.forEach(f => { f.pos[id] = { x: cx, y: 100 }; });
    });
  }
  function applyDefense(sys) {
    edit(c => {
      const defs = c.tokens.filter(t => t.kind === 'def');
      const need = TACT_DEFENSES[sys];
      while (defs.length < 6) { const id = 'D' + (defs.length + 1) + '_' + Date.now(); const tk = { id, kind:'def', label:String(defs.length + 1) }; c.tokens.push(tk); defs.push(tk); c.frames.forEach(f => { f.pos[id] = { x: 300, y: 100 }; }); }
      defs.slice(0, 6).forEach((tk, i) => { const q = tactG(need[i][0], need[i][1]); c.frames[idx].pos[tk.id] = { x: q.x, y: q.y }; });
    });
  }

  function exportPng() {
    const svg = svgRef.current; if (!svg) return;
    try {
      const clone = svg.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const W = 1600, H = Math.round(1600 * (play.vue === 'complet' ? 220 / 428 : 220 / 226));
      clone.setAttribute('width', W); clone.setAttribute('height', H);
      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H + 90;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#0d1b2a'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 34px Inter, Arial, sans-serif';
        ctx.fillText((play.titre || 'Schéma') + ' — étape ' + (idx + 1) + '/' + nFrames, 24, H + 40);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '26px Inter, Arial, sans-serif';
        const note = (frame.note || '').slice(0, 110); if (note) ctx.fillText(note, 24, H + 76);
        cv.toBlob(b => {
          if (!b) return;
          const a = document.createElement('a'); a.href = URL.createObjectURL(b);
          a.download = ((play.titre || 'schema').replace(/[^\w\-]+/g, '_')) + '_etape' + (idx + 1) + '.png';
          document.body.appendChild(a); a.click(); a.remove();
        }, 'image/png');
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    } catch (e) { alert('Export image impossible sur cet appareil.'); }
  }

  const selTok = sel && sel.k === 'token' ? play.tokens.find(t => t.id === sel.id) : null;
  const COL = { att:'#38BDF8', def:'#EF4444', gb:'#14B8A6', gbd:'#F59E0B' };
  const ARCOL = { run:'#FFFFFF', pass:'#FFD54A', screen:'#FFA420', shot:'#FF5A5A' };
  const btn = (on, color) => ({ padding:'6px 10px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, border:'1px solid ' + (on ? (color || '#FFA420') : 'rgba(255,255,255,.12)'), background: on ? (color || '#FFA420') + '22' : 'rgba(255,255,255,.04)', color: on ? (color || '#FFA420') : 'rgba(255,255,255,.65)', fontFamily:'Inter,sans-serif' });

  const arrowEl = (a, preview) => {
    const col = ARCOL[a.type] || '#fff';
    const op = a._op === undefined ? 1 : a._op;
    const isSel = sel && sel.k === 'arrow' && sel.id === a.id;
    const dx = a.x2 - a.x1, dy = a.y2 - a.y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L * 6, ny = dx / L * 6;
    return _h`<g key=${a.id || 'draft'} opacity=${op} style=${{ pointerEvents: preview ? 'none' : 'auto' }}
        onPointerDown=${e => { if (readOnly || playing || preview) return; e.stopPropagation(); setSel({ k:'arrow', id:a.id }); }}>
      <line x1=${a.x1} y1=${a.y1} x2=${a.x2} y2=${a.y2} stroke="transparent" strokeWidth="12" />
      <line x1=${a.x1} y1=${a.y1} x2=${a.x2} y2=${a.y2} stroke=${isSel ? '#fff' : col} strokeWidth=${a.type === 'shot' ? 3 : 2}
        strokeDasharray=${a.type === 'pass' ? '5 4' : undefined}
        markerEnd=${a.type === 'screen' ? undefined : 'url(#tact-ah-' + a.type + ')'} />
      ${a.type === 'screen' ? _h`<line x1=${a.x2 - nx} y1=${a.y2 - ny} x2=${a.x2 + nx} y2=${a.y2 + ny} stroke=${isSel ? '#fff' : col} strokeWidth="3" />` : null}
    </g>`;
  };

  const tokenEl = (tk) => {
    const p = posNow[tk.id]; if (!p) return null;
    const isSel = selTok && selTok.id === tk.id;
    if (tk.kind === 'ball') {
      return _h`<g key=${tk.id} onPointerDown=${e => onTokenDown(e, tk)} style=${{ cursor: readOnly ? 'default' : 'grab' }}>
        <circle cx=${p.x} cy=${p.y} r="14" fill="transparent" />
        <circle cx=${p.x} cy=${p.y} r="5" fill="#FFD54A" stroke=${isSel ? '#fff' : '#7a5b00'} strokeWidth=${isSel ? 2 : 1.2} />
      </g>`;
    }
    if (tk.kind === 'cone') {
      return _h`<g key=${tk.id} onPointerDown=${e => onTokenDown(e, tk)} style=${{ cursor: readOnly ? 'default' : 'grab' }}>
        <circle cx=${p.x} cy=${p.y} r="13" fill="transparent" />
        <polygon points=${(p.x) + ',' + (p.y - 5) + ' ' + (p.x - 5) + ',' + (p.y + 4) + ' ' + (p.x + 5) + ',' + (p.y + 4)} fill="#FB923C" stroke=${isSel ? '#fff' : '#9a3412'} strokeWidth="1.2" />
      </g>`;
    }
    const col = COL[tk.kind] || '#999';
    const lab = tk.label || '';
    return _h`<g key=${tk.id} onPointerDown=${e => onTokenDown(e, tk)} style=${{ cursor: readOnly ? 'default' : 'grab' }}>
      <circle cx=${p.x} cy=${p.y} r="15" fill="transparent" />
      <circle cx=${p.x} cy=${p.y} r="9" fill=${col} stroke=${isSel ? '#fff' : 'rgba(0,0,0,.55)'} strokeWidth=${isSel ? 2.4 : 1.2} />
      <text x=${p.x} y=${p.y + 2.4} textAnchor="middle" fontSize=${lab.length > 2 ? 5.6 : lab.length > 1 ? 6.6 : 8} fontWeight="800" fill="#0b0f14" style=${{ pointerEvents:'none', fontFamily:'Inter,sans-serif' }}>${lab}</text>
    </g>`;
  };

  return _h`<div>
    <div style=${{ position:'relative', borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,.1)', background:'#0d1b2a' }}>
      <svg ref=${svgRef} viewBox=${vb} style=${{ width:'100%', display:'block', touchAction:'none', userSelect:'none' }}
        onPointerDown=${onSvgDown} onPointerMove=${onSvgMove} onPointerUp=${onSvgUp} onPointerCancel=${onSvgUp}>
        <defs>
          <clipPath id="tact-clip"><rect x="-20" y="0" width="440" height="200" /></clipPath>
          <marker id="tact-ah-run" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 z" fill="#FFFFFF" /></marker>
          <marker id="tact-ah-pass" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 z" fill="#FFD54A" /></marker>
          <marker id="tact-ah-shot" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0 L4 2 L0 4 z" fill="#FF5A5A" /></marker>
        </defs>
        <rect x="-14" y="-10" width="428" height="220" fill="#0d1b2a" />
        <rect x="0" y="0" width="400" height="200" fill="#1c4a6e" />
        <g stroke="#ffffff" strokeWidth="1.5" fill="none" clipPath="url(#tact-clip)">
          <g>
            <path d="M0 25 A60 60 0 0 1 60 85 L60 115 A60 60 0 0 1 0 175 Z" fill="rgba(255,164,32,.30)" />
            <path d="M0 -5 A90 90 0 0 1 90 85 L90 115 A90 90 0 0 1 0 205" strokeDasharray="6 5" />
            <line x1="70" y1="95" x2="70" y2="105" /><line x1="40" y1="97" x2="40" y2="103" />
            <rect x="-9" y="85" width="9" height="30" fill="#0b0f14" />
          </g>
          <g transform="translate(400,0) scale(-1,1)">
            <path d="M0 25 A60 60 0 0 1 60 85 L60 115 A60 60 0 0 1 0 175 Z" fill="rgba(255,164,32,.30)" />
            <path d="M0 -5 A90 90 0 0 1 90 85 L90 115 A90 90 0 0 1 0 205" strokeDasharray="6 5" />
            <line x1="70" y1="95" x2="70" y2="105" /><line x1="40" y1="97" x2="40" y2="103" />
            <rect x="-9" y="85" width="9" height="30" fill="#0b0f14" />
          </g>
          <line x1="200" y1="0" x2="200" y2="200" />
          <circle cx="200" cy="100" r="3" fill="#fff" stroke="none" />
        </g>
        <rect x="0" y="0" width="400" height="200" fill="none" stroke="#fff" strokeWidth="2" />
        ${zonesNow.map(z => _h`<rect key=${z.id} x=${z.x} y=${z.y} width=${z.w} height=${z.h} rx="4"
          fill=${'rgba(255,164,32,' + (sel && sel.k === 'zone' && sel.id === z.id ? '.38' : '.2') + ')'} stroke=${sel && sel.k === 'zone' && sel.id === z.id ? '#fff' : '#FFA420'} strokeWidth="1.5" strokeDasharray="5 3"
          onPointerDown=${e => { if (readOnly || playing) return; e.stopPropagation(); setSel({ k:'zone', id:z.id }); }} />`)}
        ${draft && draft.type === 'zone' ? _h`<rect x=${Math.min(draft.x1, draft.x2)} y=${Math.min(draft.y1, draft.y2)} width=${Math.abs(draft.x2 - draft.x1)} height=${Math.abs(draft.y2 - draft.y1)} rx="4" fill="rgba(255,164,32,.2)" stroke="#FFA420" strokeWidth="1.5" strokeDasharray="5 3" style=${{ pointerEvents:'none' }} />` : null}
        ${play.tokens.filter(t => t.kind === 'cone').map(tokenEl)}
        ${arrowsNow.map(a => arrowEl(a, false))}
        ${draft && draft.type !== 'zone' ? arrowEl({ ...draft, id:'draft' }, true) : null}
        ${play.tokens.filter(t => t.kind !== 'ball' && t.kind !== 'cone').map(tokenEl)}
        ${play.tokens.filter(t => t.kind === 'ball').map(tokenEl)}
      </svg>
      <div style=${{ position:'absolute', top:8, left:10, fontSize:11, fontWeight:800, color:'rgba(255,255,255,.85)', background:'rgba(0,0,0,.45)', padding:'3px 9px', borderRadius:20 }}>
        Étape ${idx + 1} / ${nFrames}
      </div>
    </div>

    ${noteNow && readOnly ? _h`<div style=${{ marginTop:10, fontSize:13, lineHeight:1.6, background:'rgba(255,164,32,.08)', border:'1px solid rgba(255,164,32,.25)', borderRadius:10, padding:'10px 12px' }}>${noteNow}</div>` : null}

    <!-- Lecture / étapes -->
    <div style=${{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginTop:10 }}>
      <button onClick=${() => { stopAnim(); setFi(Math.max(0, idx - 1)); setSel(null); }} style=${btn(false)}>◀</button>
      <button onClick=${startPlay} style=${{ ...btn(playing, '#4CAF50'), minWidth:84 }}>${playing ? '⏸ Stop' : '▶ Lecture'}</button>
      <button onClick=${() => { stopAnim(); setFi(Math.min(nFrames - 1, idx + 1)); setSel(null); }} style=${btn(false)}>▶</button>
      <div style=${{ display:'flex', gap:4, flexWrap:'wrap' }}>
        ${play.frames.map((f, i) => _h`<button key=${i} onClick=${() => { stopAnim(); setFi(i); setSel(null); }}
          style=${{ width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:800, fontFamily:'Inter,sans-serif',
            border:'1px solid ' + (i === idx ? '#FFA420' : 'rgba(255,255,255,.12)'), background: i === idx ? 'rgba(255,164,32,.2)' : 'rgba(255,255,255,.04)', color: i === idx ? '#FFA420' : 'rgba(255,255,255,.6)' }}>${i + 1}</button>`)}
      </div>
      <div style=${{ display:'flex', gap:4, marginLeft:'auto', alignItems:'center' }}>
        ${[0.5, 1, 2].map(s => _h`<button key=${s} onClick=${() => setSpeed(s)} style=${btn(speed === s, '#38BDF8')}>${s}×</button>`)}
        <button onClick=${exportPng} style=${btn(false, '#A78BFA')} title="Télécharger l'étape en image">📷 Image</button>
      </div>
    </div>

    ${readOnly ? null : _h`<div style=${{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <button onClick=${() => setTool('move')} style=${btn(tool === 'move')}>✋ Déplacer</button>
        <button onClick=${() => setTool('run')} style=${btn(tool === 'run', '#FFFFFF')}>➜ Course</button>
        <button onClick=${() => setTool('pass')} style=${btn(tool === 'pass', '#FFD54A')}>⇢ Passe</button>
        <button onClick=${() => setTool('screen')} style=${btn(tool === 'screen')}>⊣ Écran</button>
        <button onClick=${() => setTool('shot')} style=${btn(tool === 'shot', '#FF5A5A')}>⦿ Tir</button>
        <button onClick=${() => setTool('zone')} style=${btn(tool === 'zone', '#FFA420')} title="Surligner une zone (zone de tir, espace à attaquer…)">▭ Zone</button>
      </div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <button onClick=${addFrame} style=${btn(false, '#4CAF50')}>＋ Étape suivante</button>
        <button onClick=${autoArrows} style=${btn(false, '#38BDF8')} title="Trace les flèches entre cette étape et la suivante">↗ Flèches auto</button>
        <button onClick=${delFrame} style=${btn(false, '#EF4444')}>🗑 Supprimer l'étape</button>
        <button onClick=${() => edit(c => { c.frames[idx].arrows = []; c.frames[idx].zones = []; })} style=${btn(false)}>Effacer flèches & zones</button>
      </div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1.2 }}>Défense</span>
        ${Object.keys(TACT_DEFENSES).map(s => _h`<button key=${s} onClick=${() => applyDefense(s)} style=${btn(false, '#EF4444')}>${s}</button>`)}
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1.2, marginLeft:8 }}>Ajouter</span>
        <button onClick=${() => addToken('att')} style=${btn(false, '#38BDF8')}>＋ Att.</button>
        <button onClick=${() => addToken('def')} style=${btn(false, '#EF4444')}>＋ Déf.</button>
        <button onClick=${() => addToken('cone')} style=${btn(false, '#FB923C')}>＋ Plot</button>
        ${play.tokens.some(t => t.kind === 'ball') ? null : _h`<button onClick=${() => addToken('ball')} style=${btn(false, '#FFD54A')}>＋ Ballon</button>`}
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1.2, marginLeft:8 }}>Vue</span>
        <button onClick=${() => edit(c => { c.vue = 'demi'; })} style=${btn(play.vue !== 'complet')}>Demi-terrain</button>
        <button onClick=${() => edit(c => { c.vue = 'complet'; })} style=${btn(play.vue === 'complet')}>Terrain complet</button>
      </div>

      ${selTok ? _h`<div style=${{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'10px 12px' }}>
        <div style=${{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <span style=${{ fontSize:11, fontWeight:800, color:'#FFA420' }}>Joueur sélectionné</span>
          ${selTok.kind === 'ball' || selTok.kind === 'cone' ? null : _h`<input value=${selTok.label} maxLength="4" placeholder="Nom" onInput=${e => edit(c => { c.tokens.find(t => t.id === selTok.id).label = e.target.value; })}
            style=${{ width:70, padding:'5px 8px', borderRadius:8, border:'1px solid rgba(255,255,255,.15)', background:'rgba(0,0,0,.3)', color:'#fff', fontSize:12 }} />`}
          ${selTok.kind === 'ball' || selTok.kind === 'cone' ? null : ['AG','ARG','DC','ARD','AD','P','GB'].map(po => _h`<button key=${po} onClick=${() => edit(c => { c.tokens.find(t => t.id === selTok.id).label = po; })} style=${{ ...btn(selTok.label === po, '#38BDF8'), padding:'4px 7px', fontSize:10 }}>${po}</button>`)}
          <button onClick=${() => { edit(c => { c.tokens = c.tokens.filter(t => t.id !== selTok.id); c.frames.forEach(f => { delete f.pos[selTok.id]; }); }); setSel(null); }} style=${btn(false, '#EF4444')}>Retirer</button>
        </div>
        ${idx > 0 && selTok.kind !== 'cone' ? _h`<div style=${{ marginTop:10 }}>
          <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1.2, marginBottom:6 }}>Timing — départ vers l'étape ${idx + 1}</div>
          <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
            ${[[0, 'Tout de suite'], [0.25, 'Un peu après'], [0.5, 'À mi-temps'], [0.7, 'En dernier']].map(o => {
              const cur = Math.round(((frame.pos[selTok.id] || {}).d || 0) * 100) / 100;
              return _h`<button key=${o[0]} onClick=${() => edit(c => { const q = c.frames[idx].pos[selTok.id] || {}; q.d = o[0]; c.frames[idx].pos[selTok.id] = q; })} style=${btn(cur === o[0], '#38BDF8')}>${o[1]}</button>`;
            })}
          </div>
        </div>` : null}
      </div>` : null}
      ${sel && sel.k === 'zone' ? _h`<div><button onClick=${() => { edit(c => { c.frames[idx].zones = (c.frames[idx].zones || []).filter(z => z.id !== sel.id); }); setSel(null); }} style=${btn(false, '#EF4444')}>🗑 Supprimer la zone</button></div>` : null}
      ${idx < nFrames - 1 ? _h`<div style=${{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
        <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1.2 }}>Durée du déplacement vers l'étape ${idx + 2}</span>
        ${[1, 1.9, 3, 4].map(d => _h`<button key=${d} onClick=${() => edit(c => { c.frames[idx].dur = d; })} style=${btn(((frame.dur || 1.9) === d), '#38BDF8')}>${d === 1.9 ? 'Normal' : d + ' s'}</button>`)}
      </div>` : null}
      ${sel && sel.k === 'arrow' ? _h`<div><button onClick=${() => { edit(c => { c.frames[idx].arrows = (c.frames[idx].arrows || []).filter(a => a.id !== sel.id); }); setSel(null); }} style=${btn(false, '#EF4444')}>🗑 Supprimer la flèche</button></div>` : null}

      <div>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1.2, marginBottom:6 }}>Consigne de l'étape ${idx + 1}</div>
        <textarea value=${frame.note || ''} rows="2" placeholder="Ex : L'ailier part quand l'arrière reçoit — timing du croisé…"
          onInput=${e => edit(c => { c.frames[idx].note = e.target.value; })}
          style=${{ width:'100%', boxSizing:'border-box', padding:'8px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.3)', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', resize:'vertical' }}></textarea>
      </div>
    </div>`}
  </div>`;
}

// ── Quiz tactique : questions liées aux étapes d'un schéma ───────────────────
function TactiqueQuiz({ play, canEdit, onChange, onJump, joueur }) {
  const questions = play.quiz || [];
  const jid = joueur && (joueur.id || joueur.name) ? String(joueur.id || joueur.name).replace(/[.#$\[\]\/]/g, '_') : '';
  const lsKey = 'perfhand_tq_' + play.id + '_' + jid;
  const [answers, setAnswers] = React.useState({});
  const [results, setResults] = React.useState(null);
  const [prev, setPrev] = React.useState(null);
  const sav = React.useRef(false);

  React.useEffect(() => {
    setAnswers({}); sav.current = false;
    if (!canEdit) { try { const v = JSON.parse(localStorage.getItem(lsKey) || 'null'); setPrev(v); } catch (e) { setPrev(null); } }
  }, [play.id]);
  React.useEffect(() => {
    if (!canEdit || !window.__perfhand_db || !play.id) return;
    let off = false;
    try { window.__perfhand_db.ref('perfhand/tactiqueQuiz/' + play.id).once('value').then(sn => { if (!off) setResults(sn.val() || {}); }).catch(() => {}); } catch (e) {}
    return () => { off = true; };
  }, [play.id, canEdit]);

  const inp = { padding:'7px 9px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.3)', color:'#fff', fontSize:12, fontFamily:'Inter,sans-serif', boxSizing:'border-box' };
  const bt = (col) => ({ padding:'6px 10px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, border:'1px solid ' + col + '66', background: col + '18', color: col, fontFamily:'Inter,sans-serif' });

  if (canEdit) {
    const upd = (fn) => { const c = JSON.parse(JSON.stringify(play)); c.quiz = c.quiz || []; fn(c.quiz); onChange(c); };
    return _h`<div style=${{ marginTop:18, background:'rgba(167,139,250,.06)', border:'1px solid rgba(167,139,250,.25)', borderRadius:14, padding:'12px 14px' }}>
      <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
        <div style=${{ fontSize:11, fontWeight:800, color:'#A78BFA', textTransform:'uppercase', letterSpacing:1.2 }}>🧠 Quiz joueurs (${questions.length})</div>
        <button onClick=${() => upd(q => q.push({ id:'q' + Date.now(), frame:0, q:'', options:['', '', ''], correct:0, why:'' }))} style=${bt('#A78BFA')}>＋ Question</button>
      </div>
      ${questions.length === 0 ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.4)' }}>Pose des questions sur une étape (« où doit se placer l'ailier ? », « quand part le pivot ? ») : le joueur répond et voit la correction.</div>` : null}
      ${questions.map((qu, qi) => _h`<div key=${qu.id} style=${{ background:'rgba(255,255,255,.04)', borderRadius:10, padding:'10px', marginTop:8 }}>
        <div style=${{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
          <select value=${qu.frame || 0} onChange=${e => upd(q => { q[qi].frame = parseInt(e.target.value); })} style=${inp}>
            ${play.frames.map((f, i) => _h`<option key=${i} value=${i}>Étape ${i + 1}</option>`)}
          </select>
          <button onClick=${() => onJump(qu.frame || 0)} style=${bt('#38BDF8')}>📍 Voir</button>
          <button onClick=${() => upd(q => { q.splice(qi, 1); })} style=${{ ...bt('#EF4444'), marginLeft:'auto' }}>🗑</button>
        </div>
        <input value=${qu.q} placeholder="Question" onInput=${e => upd(q => { q[qi].q = e.target.value; })} style=${{ ...inp, width:'100%', marginBottom:6 }} />
        ${(qu.options || []).map((o, oi) => _h`<div key=${oi} style=${{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
          <input type="radio" name=${'qc' + qu.id} checked=${qu.correct === oi} onChange=${() => upd(q => { q[qi].correct = oi; })} title="Bonne réponse" />
          <input value=${o} placeholder=${'Réponse ' + (oi + 1)} onInput=${e => upd(q => { q[qi].options[oi] = e.target.value; })} style=${{ ...inp, flex:1 }} />
        </div>`)}
        <div style=${{ display:'flex', gap:6, marginBottom:6 }}>
          ${(qu.options || []).length < 4 ? _h`<button onClick=${() => upd(q => { q[qi].options.push(''); })} style=${bt('#94A3B8')}>＋ Réponse</button>` : null}
          ${(qu.options || []).length > 2 ? _h`<button onClick=${() => upd(q => { q[qi].options.pop(); if (q[qi].correct >= q[qi].options.length) q[qi].correct = 0; })} style=${bt('#94A3B8')}>− Réponse</button>` : null}
        </div>
        <input value=${qu.why || ''} placeholder="Explication affichée après la réponse" onInput=${e => upd(q => { q[qi].why = e.target.value; })} style=${{ ...inp, width:'100%' }} />
      </div>`)}
      ${results ? _h`<div style=${{ marginTop:12 }}>
        <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1.2, marginBottom:4 }}>Résultats des joueurs</div>
        ${Object.values(results).length === 0 ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.35)' }}>Aucune réponse pour l'instant.</div>` : Object.values(results).sort((a, b) => (b.date || 0) - (a.date || 0)).map((r, i) => _h`<div key=${i} style=${{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
          <span>${r.nom || 'Joueur'}</span><span style=${{ fontWeight:800, color: r.score === r.total ? '#4CAF50' : '#FFA420' }}>${r.score}/${r.total}</span></div>`)}
      </div>` : null}
    </div>`;
  }

  const valid = questions.filter(q => q.q && (q.options || []).filter(Boolean).length >= 2);
  if (!valid.length) return null;
  const done = valid.every(q => answers[q.id] !== undefined);
  const score = valid.filter(q => answers[q.id] === q.correct).length;
  if (done && !sav.current) {
    sav.current = true;
    const rec = { nom: (joueur && joueur.name) || '', score, total: valid.length, date: Date.now() };
    try { localStorage.setItem(lsKey, JSON.stringify(rec)); } catch (e) {}
    if (jid && window.__perfhand_db) { try { window.__perfhand_db.ref('perfhand/tactiqueQuiz/' + play.id + '/' + jid).set(rec).catch(() => {}); } catch (e) {} }
  }
  return _h`<div style=${{ marginTop:18, background:'rgba(167,139,250,.06)', border:'1px solid rgba(167,139,250,.25)', borderRadius:14, padding:'12px 14px' }}>
    <div style=${{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'#A78BFA', textTransform:'uppercase', letterSpacing:1.2 }}>🧠 Quiz — teste ta lecture du jeu</div>
      ${prev && !done ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Dernier score : ${prev.score}/${prev.total}</span>` : null}
    </div>
    ${valid.map((qu, qi) => {
      const a = answers[qu.id];
      return _h`<div key=${qu.id} style=${{ background:'rgba(255,255,255,.04)', borderRadius:10, padding:'10px', marginTop:8 }}>
        <div style=${{ display:'flex', gap:8, alignItems:'flex-start', justifyContent:'space-between' }}>
          <div style=${{ fontSize:13, fontWeight:700, lineHeight:1.5 }}>${qi + 1}. ${qu.q}</div>
          <button onClick=${() => onJump(qu.frame || 0)} style=${{ ...bt('#38BDF8'), flexShrink:0 }}>📍 Étape ${(qu.frame || 0) + 1}</button>
        </div>
        <div style=${{ display:'flex', flexDirection:'column', gap:5, marginTop:8 }}>
          ${(qu.options || []).map((o, oi) => {
            if (!o) return null;
            const isAns = a === oi, isOk = qu.correct === oi;
            const col = a === undefined ? 'rgba(255,255,255,.12)' : isOk ? '#4CAF50' : isAns ? '#EF4444' : 'rgba(255,255,255,.08)';
            return _h`<button key=${oi} disabled=${a !== undefined} onClick=${() => setAnswers(x => ({ ...x, [qu.id]: oi }))}
              style=${{ textAlign:'left', padding:'8px 10px', borderRadius:8, cursor: a === undefined ? 'pointer' : 'default', fontSize:12, color:'#fff', fontFamily:'Inter,sans-serif',
                border:'1px solid ' + col, background: a === undefined ? 'rgba(255,255,255,.04)' : isOk ? 'rgba(76,175,80,.15)' : isAns ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.03)' }}>${o}</button>`;
          })}
        </div>
        ${a !== undefined && qu.why ? _h`<div style=${{ marginTop:8, fontSize:12, color:'rgba(255,255,255,.7)', lineHeight:1.5 }}>💡 ${qu.why}</div>` : null}
      </div>`;
    })}
    ${done ? _h`<div style=${{ marginTop:12, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
      <div style=${{ fontSize:16, fontWeight:800, color: score === valid.length ? '#4CAF50' : '#FFA420' }}>Score : ${score}/${valid.length}</div>
      <button onClick=${() => { setAnswers({}); sav.current = false; }} style=${bt('#A78BFA')}>↺ Recommencer</button>
    </div>` : null}
  </div>`;
}

// ── Vue principale : bibliothèque de schémas + éditeur ───────────────────────
function TactiqueView({ db, setDb, clubs, clubId, canEdit, auteur, joueur, soloGeneral }) {
  const [selClubId, setSelClubId] = React.useState(clubId || '');
  const [cat, setCat] = React.useState('');
  const [q, setQ] = React.useState('');
  const [cur, setCur] = React.useState(null);      // schéma ouvert
  const [isNew, setIsNew] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState('');
  const [jump, setJump] = React.useState(null);
  const [ctx, setCtx] = React.useState('');
  const scopeClub = clubId || selClubId;
  const clubList = clubs || [];

  const all = Object.values(db.tactique || {}).map(tactNormPlay).filter(Boolean);
  const plays = all.filter(p => {
    if (!canEdit && !p.visibleJoueurs) return false;
    if (soloGeneral && p.clubId) return false;
    if (scopeClub && p.clubId && p.clubId !== scopeClub) return false;
    if (cat && p.categorie !== cat) return false;
    if (ctx && (p.contexte || '') !== ctx) return false;
    if (q && !(p.titre || '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (b.maj || 0) - (a.maj || 0));

  function open(p, nw) { setCur(JSON.parse(JSON.stringify(p))); setIsNew(!!nw); setDirty(!!nw); setSavedMsg(''); }
  function create(sys) { open(tactNewPlay(sys, scopeClub, auteur), true); }
  function save() { const s = tactSavePlay(setDb, cur); setCur(s); setIsNew(false); setDirty(false); setSavedMsg('Enregistré ✓'); setTimeout(() => setSavedMsg(''), 2500); }
  const inp = { padding:'8px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.3)', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif' };

  // ── Éditeur / visionneuse ──
  if (cur) {
    const catInfo = TACT_CATS.find(c => c.id === cur.categorie) || TACT_CATS[TACT_CATS.length - 1];
    return _h`<div style=${{ maxWidth:860, margin:'0 auto' }}>
      <div style=${{ display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
        <button onClick=${() => { if (dirty && !confirm('Quitter sans enregistrer les modifications ?')) return; setCur(null); }}
          style=${{ ...inp, cursor:'pointer', fontWeight:700 }}>← Bibliothèque</button>
        ${canEdit ? _h`<button onClick=${save} style=${{ padding:'8px 16px', borderRadius:10, border:'none', background:'#FFA420', color:'#000', fontWeight:800, fontSize:13, cursor:'pointer' }}>💾 Enregistrer${dirty ? ' •' : ''}</button>` : null}
        ${savedMsg ? _h`<span style=${{ fontSize:12, color:'#4CAF50', fontWeight:700 }}>${savedMsg}</span>` : null}
      </div>
      ${canEdit ? _h`<div style=${{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
        <input value=${cur.titre} onInput=${e => { setCur({ ...cur, titre: e.target.value }); setDirty(true); }} placeholder="Titre du schéma" style=${{ ...inp, fontSize:16, fontWeight:800 }} />
        <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value=${cur.categorie} onChange=${e => { setCur({ ...cur, categorie: e.target.value }); setDirty(true); }} style=${{ ...inp, flex:1, minWidth:160 }}>
            ${TACT_CATS.map(c => _h`<option key=${c.id} value=${c.id}>${c.label}</option>`)}
          </select>
          ${!clubId && clubList.length ? _h`<select value=${cur.clubId || ''} onChange=${e => { setCur({ ...cur, clubId: e.target.value }); setDirty(true); }} style=${{ ...inp, flex:1, minWidth:140 }}>
            <option value="">Tous les clubs</option>
            ${clubList.map(c => _h`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
          </select>` : null}
          <select value=${cur.contexte || ''} onChange=${e => { setCur({ ...cur, contexte: e.target.value }); setDirty(true); }} style=${{ ...inp, flex:1, minWidth:150 }}>
            <option value="">Contexte : général</option>
            <option value="entrainement">🏃 Séance d'entraînement</option>
            <option value="match">🏐 Préparation de match</option>
          </select>
          ${cur.contexte ? _h`<input type="date" value=${cur.date || ''} onInput=${e => { setCur({ ...cur, date: e.target.value }); setDirty(true); }} style=${{ ...inp }} />` : null}
          ${cur.contexte === 'match' ? _h`<input value=${cur.adversaire || ''} placeholder="Adversaire" onInput=${e => { setCur({ ...cur, adversaire: e.target.value }); setDirty(true); }} style=${{ ...inp, flex:1, minWidth:120 }} />` : null}
          <label style=${{ ...inp, display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <input type="checkbox" checked=${!!cur.visibleJoueurs} onChange=${e => { setCur({ ...cur, visibleJoueurs: e.target.checked }); setDirty(true); }} />
            Visible par les joueurs
          </label>
        </div>
        <textarea value=${cur.description || ''} rows="2" placeholder="Principes, objectifs, repères du schéma…" onInput=${e => { setCur({ ...cur, description: e.target.value }); setDirty(true); }}
          style=${{ ...inp, resize:'vertical' }}></textarea>
      </div>` : _h`<div style=${{ marginBottom:12 }}>
        <div style=${{ fontSize:20, fontWeight:800 }}>${cur.titre}</div>
        <span style=${{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background:catInfo.color + '22', color:catInfo.color }}>${catInfo.label}</span>
        ${cur.contexte ? _h`<span style=${{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, marginLeft:6, background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.7)' }}>${cur.contexte === 'match' ? '🏐 Match' + (cur.adversaire ? ' vs ' + cur.adversaire : '') : '🏃 Entraînement'}${cur.date ? ' · ' + cur.date.split('-').reverse().join('/') : ''}</span>` : null}
        ${cur.description ? _h`<div style=${{ marginTop:10, fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>${cur.description}</div>` : null}
      </div>`}
      <${TactiqueBoard} key=${cur.id} play=${cur} readOnly=${!canEdit} jump=${jump} onChange=${p => { setCur(p); setDirty(true); }} />
      <${TactiqueQuiz} key=${'qz' + cur.id} play=${cur} canEdit=${canEdit} joueur=${joueur} onChange=${p => { setCur(p); setDirty(true); }} onJump=${i => setJump({ i, k: Date.now() })} />
    </div>`;
  }

  // ── Bibliothèque ──
  return _h`<div style=${{ maxWidth:900, margin:'0 auto' }}>
    <div style=${{ marginBottom:14 }}>
      <div style=${{ fontSize:18, fontWeight:800 }}>🎯 Tactique & technique handball</div>
      <div style=${{ fontSize:12, color:'rgba(255,255,255,.45)', marginTop:3 }}>Schémas de jeu sur terrain : placements, déplacements, timing — ${canEdit ? 'à construire pour l\'équipe et partager aux joueurs.' : 'les schémas partagés par ton staff.'}</div>
    </div>
    <div style=${{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
      ${!clubId && clubList.length ? _h`<select value=${selClubId} onChange=${e => setSelClubId(e.target.value)} style=${{ ...inp }}>
        <option value="">Tous les clubs</option>
        ${clubList.map(c => _h`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
      </select>` : null}
      <input value=${q} onInput=${e => setQ(e.target.value)} placeholder="🔍 Rechercher un schéma" style=${{ ...inp, flex:1, minWidth:150 }} />
    </div>
    <div style=${{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, marginBottom:12 }}>
      <button onClick=${() => setCat('')} style=${{ flexShrink:0, padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700, border:'1px solid ' + (!cat ? '#FFA420' : 'rgba(255,255,255,.1)'), background: !cat ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)', color: !cat ? '#FFA420' : 'rgba(255,255,255,.5)' }}>Tous</button>
      ${TACT_CATS.map(c => _h`<button key=${c.id} onClick=${() => setCat(cat === c.id ? '' : c.id)} style=${{ flexShrink:0, padding:'6px 12px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700, whiteSpace:'nowrap', border:'1px solid ' + (cat === c.id ? c.color : 'rgba(255,255,255,.1)'), background: cat === c.id ? c.color + '22' : 'rgba(255,255,255,.04)', color: cat === c.id ? c.color : 'rgba(255,255,255,.5)' }}>${c.label}</button>`)}
    </div>

    <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
      ${[['', 'Tous contextes'], ['entrainement', '🏃 Entraînements'], ['match', '🏐 Préparation de match']].map(o => _h`<button key=${o[0]} onClick=${() => setCtx(o[0])}
        style=${{ padding:'5px 11px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700, border:'1px solid ' + (ctx === o[0] ? '#FFA420' : 'rgba(255,255,255,.1)'), background: ctx === o[0] ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)', color: ctx === o[0] ? '#FFA420' : 'rgba(255,255,255,.5)' }}>${o[1]}</button>`)}
    </div>
    ${(() => {
      const today = new Date().toISOString().slice(0, 10);
      const up = plays.filter(p => p.contexte && p.date && p.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
      if (!up.length) return null;
      return _h`<div style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:11, fontWeight:800, color:'#4CAF50', textTransform:'uppercase', letterSpacing:1.2, marginBottom:6 }}>📅 À venir</div>
        <div style=${{ display:'flex', gap:8, flexWrap:'wrap' }}>
          ${up.map(p => _h`<button key=${p.id} onClick=${() => open(p, false)} style=${{ padding:'8px 12px', borderRadius:10, cursor:'pointer', textAlign:'left', border:'1px solid rgba(76,175,80,.35)', background:'rgba(76,175,80,.08)', color:'#fff', fontFamily:'Inter,sans-serif' }}>
            <div style=${{ fontSize:12, fontWeight:800 }}>${p.titre}</div>
            <div style=${{ fontSize:10, color:'rgba(255,255,255,.55)', marginTop:2 }}>${p.contexte === 'match' ? '🏐 ' + (p.adversaire ? 'vs ' + p.adversaire + ' · ' : '') : '🏃 '}${p.date.split('-').reverse().join('/')}</div>
          </button>`)}
        </div>
      </div>`;
    })()}

    ${canEdit ? _h`<div style=${{ background:'rgba(255,164,32,.06)', border:'1px solid rgba(255,164,32,.2)', borderRadius:14, padding:'12px 14px', marginBottom:16 }}>
      <div style=${{ fontSize:11, fontWeight:800, color:'#FFA420', marginBottom:8, textTransform:'uppercase', letterSpacing:1.2 }}>Nouveau schéma</div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        <button onClick=${() => create(null)} style=${{ ...inp, cursor:'pointer', fontWeight:700 }}>＋ Terrain vide</button>
        ${Object.keys(TACT_DEFENSES).map(s => _h`<button key=${s} onClick=${() => create(s)} style=${{ ...inp, cursor:'pointer', fontWeight:700 }}>Attaque vs ${s}</button>`)}
      </div>
      <div style=${{ fontSize:10, color:'rgba(255,255,255,.4)', marginBottom:6 }}>Exemples prêts à modifier :</div>
      <div style=${{ display:'flex', gap:6, flexWrap:'wrap' }}>
        ${tactExamples(scopeClub, auteur).map((ex, i) => _h`<button key=${i} onClick=${() => open(ex, true)} style=${{ ...inp, cursor:'pointer', fontSize:12 }}>${ex.titre}</button>`)}
      </div>
    </div>` : null}

    ${plays.length === 0 ? _h`<div style=${{ textAlign:'center', padding:'40px 10px', color:'rgba(255,255,255,.3)', fontSize:13 }}>
      ${canEdit ? 'Aucun schéma pour l\'instant — crée le premier ci-dessus.' : 'Aucun schéma partagé pour le moment.'}
    </div>` : _h`<div style=${{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:10 }}>
      ${plays.map(p => {
        const ci = TACT_CATS.find(c => c.id === p.categorie) || TACT_CATS[TACT_CATS.length - 1];
        return _h`<div key=${p.id} onClick=${() => open(p, false)} style=${{ cursor:'pointer', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderLeft:'3px solid ' + ci.color, borderRadius:12, padding:'12px 14px' }}>
          <div style=${{ fontSize:14, fontWeight:800, marginBottom:4 }}>${p.titre}</div>
          <div style=${{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <span style=${{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:ci.color + '22', color:ci.color }}>${ci.label}</span>
            <span style=${{ fontSize:10, color:'rgba(255,255,255,.4)' }}>${p.frames.length} étape${p.frames.length > 1 ? 's' : ''}</span>
            ${p.contexte ? _h`<span style=${{ fontSize:10, color:'rgba(255,255,255,.55)' }}>${p.contexte === 'match' ? '🏐' : '🏃'}${p.date ? ' ' + p.date.split('-').reverse().slice(0, 2).join('/') : ''}</span>` : null}
            ${(p.quiz || []).length ? _h`<span style=${{ fontSize:10, color:'#A78BFA' }}>🧠 Quiz</span>` : null}
            ${canEdit ? _h`<span style=${{ fontSize:10, color: p.visibleJoueurs ? '#4CAF50' : 'rgba(255,255,255,.3)' }}>${p.visibleJoueurs ? '👁 Partagé' : '🔒 Privé'}</span>` : null}
          </div>
          ${p.description ? _h`<div style=${{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:6, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>${p.description}</div>` : null}
          ${canEdit ? _h`<div style=${{ display:'flex', gap:6, marginTop:10 }} onClick=${e => e.stopPropagation()}>
            <button onClick=${() => tactSavePlay(setDb, { ...p, visibleJoueurs: !p.visibleJoueurs })} style=${{ ...inp, padding:'4px 9px', fontSize:11, cursor:'pointer' }}>${p.visibleJoueurs ? 'Rendre privé' : 'Partager'}</button>
            <button onClick=${() => open({ ...p, id:'t' + Date.now() + Math.floor(Math.random() * 1000), titre: p.titre + ' (copie)' }, true)} style=${{ ...inp, padding:'4px 9px', fontSize:11, cursor:'pointer' }}>Dupliquer</button>
            <button onClick=${() => { if (confirm('Supprimer ce schéma ?')) tactDeletePlay(setDb, p.id); }} style=${{ ...inp, padding:'4px 9px', fontSize:11, cursor:'pointer', color:'#EF4444' }}>🗑</button>
          </div>` : null}
        </div>`;
      })}
    </div>`}
  </div>`;
}

function ProjetDeJeuView({ db, setDb, isCoach }) {
  const INITIAL_PROJET = {
    analyse: {
      titre: "Analyse de l'équipe",
      profils: "Groupe Prénationale — Mixte: tous les profils\n\nAilier: finisseur, relanceur\nArrière: tireurs, dueliste\nPivot: finisseur, prise de position, glissement, dueliste\nDemi-centre: organisateur, tireur (à travers / en appui / à l'amble / de loin)\n\nCapable d'être mobile et rapide, enchainer des tâches > H à H\nPoste 3 assez grand",
      forces: "• Possibilité d'étager pour gêner les équipes avec grands gabarits\n• Possibilité de s'aligner pour gêner les équipes plutôt dueliste\n• Agresser pour proposer une défense qui permet de harceler, dissuader et intercepter",
    },
    defensif: {
      titre: "Phase défensive",
      defense_placee: {
        systeme1: { nom: "1-5 HH", principes: "• Fermer le triangle central\n• Occuper un maximum d'espace dans la latéralité\n• Prendre en charge son joueur (vis à vis)\n• Interdire tout ballon dans le dos du joueur avancé", reperes: "• Le N°3 haut se déplace jusqu'à max le poste 2 dans la largeur, doit s'aligner avec N°3 bas\n• Compenser les 2 lignes par déplacement latéral, rester en face de son vis à vis, N°1 en face de l'ailier\n• Avoir les pieds orientés sans cesse vers son vis à vis, regard sur le ballon\n• Le joueur avancé (N°3 H) conserve un repère visuel sur la balle — jamais derrière la ligne d'épaule", inferiorite: "1-5 HH devient 1-4 zone", superiorite: "1-5 devient 2+4: les deux joueurs avancés très libres mais ne doivent pas avoir de ballon dans le dos" },
        systeme2: { nom: "0-6 mixte HH (avec notion d'entraide)", principes: "• Occuper toute la largeur du terrain\n• Garder ses repères ballon et joueur\n• Mettre de la profondeur face à la balle — désalignement des N°2\n• Utiliser la notion de surnombre du côté de la balle", reperes: "• Avoir chaque joueur en face de son vis à vis ou dans l'alignement avec le ballon pour agir sur la trajectoire\n• Être capable de connaître la position de son vis à vis et d'intervenir sur la trajectoire du ballon\n• Signal pour mettre de la profondeur: lorsque la balle part du porteur vers son vis à vis → gêner et intercepter\n• Conserver un surnombre du côté de la balle. Les 2 N°3 en HH, les autres joueurs en zone", inferiorite: "0-6 mixte devient 0-5 zone", superiorite: "0-6 mixte reste mixte avec des N°2 qui mettent plus de profondeur pour récupérer la balle plus vite" },
      }
    },
    offensif: {
      titre: "Phase offensive",
      attaque_placee: {
        vs_etagee: { principes: "• Amener le ballon entre les deux lignes de défense\n• Contourner la pointe\n• Isoler les poste 2", reperes: "• Battre le N°3 haut (duel, croisé, bloc pivot, entrée 2 pivots)\n• Amener le ballon dans l'espace 1-2 externe pour jouer un 2v1" },
        vs_alignee: { principes: "• Vitesse de circulation de balle\n• Renversement de la balle\n• Attaque dans l'espace\n• Utilisation du pivot (isoler, contourner)", reperes: "• Enchainer les tâches pour que la balle aille vite (motricité, précision)\n• Changer de sens pour surprendre, notamment après un point de fixation\n• Repérer son espace (voir le but en entier entre deux joueurs)\n• Le pivot doit créer une rupture, un soutien ou un appui" },
        combinaisons: "Combinaison 1: Rotation - renverse - glisse - bloc\nDemi passe arrière, course opposé, croisé sans ballon\n\nCombinaison 2: Yago + Yago double\nCroisé entre demi centre et pivot (entre 2 et 3). Pivot va entre 1 et 2 à l'opposé, DC prend la place du pivot\n\nCombinaison 3: Ailier tourne autour du pivot\nPivot entre 1 et 2. À la réception: 3 choix: 3c2 dans la continuité / prise de bloc pivot / tournée autour pour jouer avec ailier gauche\n\nCombinaison 4: Rotation externe - glisse - bloc\nArrière passe à l'aile, croisé sans ballon arrière/demi. Ailier rend à l'arrière et temps fort de l'arrière\n\nCombinaison 5: Danemark\n(à compléter)",
        temps_forts: "Temps de jeu 1: Temps fort avec ballon (base arrière)\nTemps de jeu 2: Relance de l'ailier — Envoyer la balle à l'opposé vers un joueur n'ayant pas participé au 1er temps de jeu\nTemps de jeu 3: Coup franc protégé — Sur jeu passif: 2 passes / 3 passes / 4 passes"
      },
      inferiorite: "• Vs défense alignée: jouer à 4 autour et 1 pivot. Pivot entre 2 et 3, glisse au moment de la course pour isoler. Croisé arrière/ailier finit entre 2 et 3\n• Vs défense étagée: jouer à 4 autour et 1 pivot. Pivot entre 3 et 3. La balle part d'un arrière qui attire le 3 haut, libère à l'arrière opposé. Pendant la passe le pivot bloc le 3 haut",
      superiorite: "• Vs alignée: Espagnol + rentrée en 2 pivots\n• Vs étagée: Rotation externe: l'arrière donne au DC et prend la place de l'ailier sans ballon",
      passif: "• Vs alignée: Sortie poste pivot et jeu autour ou dans la continuité\n• Vs étagée: Sortie poste associé à une rentrée à l'opposée"
    },
    montee: {
      titre: "Montée de balle",
      principes: "• Étagement: DC proche GB, arrières ligne médiane, ailiers 2ème moitié de terrain, pivot à l'intérieur (centre) entre 6 et 9 adverse\n• Écartement: créer un cheminement pour que la balle soit la plus extérieure possible afin de contourner le repli défensif\n• Vitesse: moins de 4 passes pour accéder au but",
      reperes: "• Le gardien balaie du regard loin puis près pour observer quelle relance est possible. DC = premier relai si relance longue impossible\n• Les arrières sont collés à la touche pour apporter une solution externe au DC qui attire des joueurs repliant au centre\n• Les ailiers apportent une solution en profondeur ou attirent des joueurs repliant pour offrir de l'espace secteur central\n• Le pivot sert de relai ou de finition à l'intérieur\n• Être à la fois très écarté mais aussi proche du porteur pour offrir une solution de passe rapide\n• Faire des choix rapides: moins de 3 secondes, moins de 4 passes pour trouver une solution de tir",
      transition_desordonne: "Finition secteur central avec un point d'appui externe\nArrière: course dans le 1-2 / Ailier: croise pour chercher secteur central en grande course",
      transition_place: "Engager un croisé arrière-ailier avec le pivot opposé pour finir dans le secteur du pivot. Croisé entre 1 et 2, fin de course de l'ailier entre 2 et 3 pour sortir la balle sur le DC qui court entre 3 et 3 (plutôt externe) et joue dans la continuité pour l'arrière gauche qui peut jouer avec le pivot ou l'ailier le 3c2"
    },
    repli: {
      titre: "Repli défensif",
      principes: "• Conserver la balle devant chaque défenseur qui replie\n• Prendre en charge un joueur chacun dès la perte de balle\n• Ralentir, stopper voire récupérer le ballon",
      reperes: "• Aucun défenseur ne replie dos à la balle, toujours un repère visuel. Les joueurs loin de la perte de balle prennent en charge les attaquants allant dans notre moitié. Les joueurs proches prennent en charge les attaquants servant de premier relai\n• Être réactif et analyser son secteur proche, compter les joueurs pour être sûr qu'aucun ne soit seul",
      transition_desordonne: "Homme à homme tout terrain",
      transition_place: "3-3 HH pour forcer les attaquants à trouver une solution secteur externe et récupérer la balle",
      inferiorite: "Replier le plus vite possible dans sa moitié de terrain et interdire le centre du terrain",
      superiorite: "S'organiser pour être deux sur la trajectoire de balle afin que celle-ci ne dépasse pas la ligne médiane et soit récupérée sur une interception"
    }
  };

  const stored = db.projetDeJeu || INITIAL_PROJET;
  const [section, setSection] = React.useState('analyse');
  const [editField, setEditField] = React.useState(null);
  const [editVal, setEditVal] = React.useState('');

  function saveProjet(path, value) {
    const keys = path.split('.');
    const newProjet = JSON.parse(JSON.stringify(stored));
    let obj = newProjet;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length-1]] = value;
    setDb(d => ({ ...d, projetDeJeu: newProjet }));
    if (window.__perfhand_db) {
      window.__perfhand_db.ref('perfhand/projetDeJeu').set(newProjet);
    }
    setEditField(null);
  }

  function EditableBlock({ path, value, label, color }) {
    color = color || ACCENT;
    const isEditing = editField === path;
    return _h`<div style=${{ marginBottom:16 }}>
      <div style=${{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style=${{ fontSize:11, fontWeight:700, color:color, textTransform:'uppercase', letterSpacing:0.8 }}>${label}</div>
        ${isCoach ? _h`<button onClick=${() => { if(isEditing){saveProjet(path,editVal);}else{setEditField(path);setEditVal(value||'');} }} class="btn btn-sm" style=${{ fontSize:10, padding:'2px 8px', background:isEditing?'rgba(76,175,80,.2)':'rgba(255,255,255,.06)', color:isEditing?'#4CAF50':ACCENT }}>
          ${isEditing ? '✅ Sauver' : '✏️ Modifier'}
        </button>` : null}
      </div>
      ${isEditing
        ? _h`<div>
          <textarea class="inp" style=${{ width:'100%', minHeight:120, resize:'vertical', fontSize:13, lineHeight:1.7, fontFamily:'inherit' }} onInput=${e => setEditVal(e.target.value)}>${editVal}</textarea>
          <div style=${{ display:'flex', gap:8, marginTop:6 }}>
            <button class="btn btn-sm" style=${{ background:'rgba(76,175,80,.15)', color:'#4CAF50', border:'1px solid rgba(76,175,80,.3)' }} onClick=${() => saveProjet(path, editVal)}>✅ Sauvegarder</button>
            <button class="btn btn-sm" style=${{ background:'rgba(255,68,85,.1)', color:'#FF4455' }} onClick=${() => setEditField(null)}>✖ Annuler</button>
          </div>
        </div>`
        : _h`<div style=${{ background:'rgba(255,255,255,.03)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'rgba(255,255,255,.8)', lineHeight:1.8, whiteSpace:'pre-wrap', borderLeft:'3px solid ' + color + '40', cursor:isCoach?'pointer':'default' }} onClick=${() => isCoach && (setEditField(path), setEditVal(value||''))}>
          ${value || _h`<span style=${{ color:'rgba(255,255,255,.25)', fontStyle:'italic' }}>Cliquer pour ajouter...</span>`}
        </div>`
      }
    </div>`;
  }

  const SECTIONS = [
    { id:'analyse', label:'Analyse équipe', icon:'🔍' },
    { id:'defensif', label:'Défensif', icon:'🛡️' },
    { id:'offensif', label:'Offensif', icon:'⚔️' },
    { id:'montee', label:'Montée de balle', icon:'🚀' },
    { id:'repli', label:'Repli défensif', icon:'🔄' },
  ];

  const s = stored;

  return _h`<div>
    <!-- Sous-navigation -->
    <div style=${{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
      ${SECTIONS.map(sec => _h`<button key=${sec.id}
        onClick=${() => setSection(sec.id)}
        class="btn"
        style=${{ background:section===sec.id?ACCENT:'rgba(255,255,255,.06)', color:section===sec.id?'#000':'rgba(255,255,255,.7)', fontWeight:section===sec.id?700:500, fontSize:12, padding:'7px 14px' }}>
        ${sec.icon} ${sec.label}
      </button>`)}
    </div>

    <!-- ANALYSE -->
    ${section === 'analyse' ? _h`<div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:ACCENT, marginBottom:16 }}>🔍 Analyse de l'équipe</div>
        <${EditableBlock} path="analyse.profils" value=${s.analyse.profils} label="Profils de joueurs" />
        <${EditableBlock} path="analyse.forces" value=${s.analyse.forces} label="Forces & caractéristiques" color="#4CAF50" />
      </div>
    </div>` : null}

    <!-- DÉFENSIF -->
    ${section === 'defensif' ? _h`<div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:'#38BDF8', marginBottom:16 }}>🛡️ Défense placée — ${s.defensif.defense_placee.systeme1.nom}</div>
        <div class="grid-2" style=${{ gap:12, marginBottom:16 }}>
          <div>
            <${EditableBlock} path="defensif.defense_placee.systeme1.principes" value=${s.defensif.defense_placee.systeme1.principes} label="Principes fondamentaux" color="#38BDF8" />
          </div>
          <div>
            <${EditableBlock} path="defensif.defense_placee.systeme1.reperes" value=${s.defensif.defense_placee.systeme1.reperes} label="Repères techniques" color="#38BDF8" />
          </div>
        </div>
        <div class="grid-2" style=${{ gap:12 }}>
          <${EditableBlock} path="defensif.defense_placee.systeme1.inferiorite" value=${s.defensif.defense_placee.systeme1.inferiorite} label="⚠️ Cas infériorité numérique" color="#FF7A00" />
          <${EditableBlock} path="defensif.defense_placee.systeme1.superiorite" value=${s.defensif.defense_placee.systeme1.superiorite} label="✅ Cas supériorité numérique" color="#4CAF50" />
        </div>
      </div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:'#7C6FFF', marginBottom:16 }}>🛡️ Défense placée — ${s.defensif.defense_placee.systeme2.nom}</div>
        <div class="grid-2" style=${{ gap:12, marginBottom:16 }}>
          <div>
            <${EditableBlock} path="defensif.defense_placee.systeme2.principes" value=${s.defensif.defense_placee.systeme2.principes} label="Principes fondamentaux" color="#7C6FFF" />
          </div>
          <div>
            <${EditableBlock} path="defensif.defense_placee.systeme2.reperes" value=${s.defensif.defense_placee.systeme2.reperes} label="Repères techniques" color="#7C6FFF" />
          </div>
        </div>
        <div class="grid-2" style=${{ gap:12 }}>
          <${EditableBlock} path="defensif.defense_placee.systeme2.inferiorite" value=${s.defensif.defense_placee.systeme2.inferiorite} label="⚠️ Cas infériorité numérique" color="#FF7A00" />
          <${EditableBlock} path="defensif.defense_placee.systeme2.superiorite" value=${s.defensif.defense_placee.systeme2.superiorite} label="✅ Cas supériorité numérique" color="#4CAF50" />
        </div>
      </div>
    </div>` : null}

    <!-- OFFENSIF -->
    ${section === 'offensif' ? _h`<div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:ACCENT, marginBottom:16 }}>⚔️ Attaque placée</div>
        <div class="grid-2" style=${{ gap:12, marginBottom:16 }}>
          <div>
            <div style=${{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.6)', marginBottom:10, textTransform:'uppercase' }}>vs Défense étagée</div>
            <${EditableBlock} path="offensif.attaque_placee.vs_etagee.principes" value=${s.offensif.attaque_placee.vs_etagee.principes} label="Principes" color="#FFA420" />
            <${EditableBlock} path="offensif.attaque_placee.vs_etagee.reperes" value=${s.offensif.attaque_placee.vs_etagee.reperes} label="Repères techniques" color="#FFA420" />
          </div>
          <div>
            <div style=${{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.6)', marginBottom:10, textTransform:'uppercase' }}>vs Défense alignée</div>
            <${EditableBlock} path="offensif.attaque_placee.vs_alignee.principes" value=${s.offensif.attaque_placee.vs_alignee.principes} label="Principes" color="#38BDF8" />
            <${EditableBlock} path="offensif.attaque_placee.vs_alignee.reperes" value=${s.offensif.attaque_placee.vs_alignee.reperes} label="Repères techniques" color="#38BDF8" />
          </div>
        </div>
      </div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:ACCENT, marginBottom:12 }}>📋 Combinaisons</div>
        <${EditableBlock} path="offensif.attaque_placee.combinaisons" value=${s.offensif.attaque_placee.combinaisons} label="Schémas tactiques" color="#FFA420" />
      </div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:ACCENT, marginBottom:12 }}>⏱ Temps forts</div>
        <${EditableBlock} path="offensif.attaque_placee.temps_forts" value=${s.offensif.attaque_placee.temps_forts} label="Organisation temporelle" color="#4CAF50" />
      </div>
      <div class="grid-2" style=${{ gap:12 }}>
        <div class="card">
          <${EditableBlock} path="offensif.inferiorite" value=${s.offensif.inferiorite} label="⚠️ Infériorité numérique" color="#FF7A00" />
        </div>
        <div class="card">
          <${EditableBlock} path="offensif.superiorite" value=${s.offensif.superiorite} label="✅ Supériorité numérique" color="#4CAF50" />
        </div>
      </div>
      <div class="card" style=${{ marginTop:12 }}>
        <${EditableBlock} path="offensif.passif" value=${s.offensif.passif} label="⏰ Jeu passif" color="#7C6FFF" />
      </div>
    </div>` : null}

    <!-- MONTÉE DE BALLE -->
    ${section === 'montee' ? _h`<div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:'#4CAF50', marginBottom:16 }}>🚀 Montée de balle</div>
        <div class="grid-2" style=${{ gap:12, marginBottom:12 }}>
          <${EditableBlock} path="montee.principes" value=${s.montee.principes} label="Principes fondamentaux" color="#4CAF50" />
          <${EditableBlock} path="montee.reperes" value=${s.montee.reperes} label="Repères techniques" color="#38BDF8" />
        </div>
      </div>
      <div class="card">
        <div style=${{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.6)', marginBottom:14 }}>JEU DE TRANSITION</div>
        <div class="grid-2" style=${{ gap:12 }}>
          <${EditableBlock} path="montee.transition_desordonne" value=${s.montee.transition_desordonne} label="Repli désordonné" color="#FF7A00" />
          <${EditableBlock} path="montee.transition_place" value=${s.montee.transition_place} label="Repli placé" color="#38BDF8" />
        </div>
      </div>
    </div>` : null}

    <!-- REPLI DÉFENSIF -->
    ${section === 'repli' ? _h`<div>
      <div class="card" style=${{ marginBottom:14 }}>
        <div style=${{ fontSize:14, fontWeight:700, color:'#FF4455', marginBottom:16 }}>🔄 Repli défensif</div>
        <div class="grid-2" style=${{ gap:12, marginBottom:12 }}>
          <${EditableBlock} path="repli.principes" value=${s.repli.principes} label="Principes fondamentaux" color="#FF4455" />
          <${EditableBlock} path="repli.reperes" value=${s.repli.reperes} label="Repères techniques" color="#38BDF8" />
        </div>
      </div>
      <div class="card" style=${{ marginBottom:12 }}>
        <div style=${{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.6)', marginBottom:14 }}>JEU DE TRANSITION</div>
        <div class="grid-2" style=${{ gap:12 }}>
          <${EditableBlock} path="repli.transition_desordonne" value=${s.repli.transition_desordonne} label="Repli désordonné" color="#FF7A00" />
          <${EditableBlock} path="repli.transition_place" value=${s.repli.transition_place} label="Repli placé" color="#38BDF8" />
        </div>
      </div>
      <div class="grid-2" style=${{ gap:12 }}>
        <div class="card">
          <${EditableBlock} path="repli.inferiorite" value=${s.repli.inferiorite} label="⚠️ Infériorité numérique" color="#FF7A00" />
        </div>
        <div class="card">
          <${EditableBlock} path="repli.superiorite" value=${s.repli.superiorite} label="✅ Supériorité numérique" color="#4CAF50" />
        </div>
      </div>
    </div>` : null}
  </div>`;
}
