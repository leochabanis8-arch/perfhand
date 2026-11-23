// ── EXPORT PDF DES SÉANCES D'UNE OU PLUSIEURS SEMAINES ─────────────────────────
// Pour un joueur qui veut faire ses séances à d'autres dates (organisation perso) : un PDF clair,
// jour par jour, avec le contenu complet des séances (exercices, séries, reps, charges en kg calculées
// depuis SON 1RM, repos, consignes) et une case « Fait » à cocher. Muscu + endurance.

function exportSemaineTexte(v) {
  // Polices standard du PDF : on remplace ce qu'elles ne savent pas afficher (flèches, emojis…)
  return String(v == null ? '' : v)
    .replace(/[→⇒➜]/g, '->').replace(/[←]/g, '<-').replace(/≈/g, '~').replace(/[≤]/g, '<=').replace(/[≥]/g, '>=')
    .replace(/[^\u0000-ÿ–—‘’“”•…Œœ€]/g, '')
    .replace(/\s+\n/g, '\n').trim();
}
function exportSemaineSeances(p, debut, nbSemaines) {
  const arr = v => !v ? [] : (Array.isArray(v) ? v : Object.values(v)).filter(Boolean);
  const fin = new Date(debut); fin.setDate(fin.getDate() + nbSemaines * 7 - 1);
  const D = localDateStr(debut), F = localDateStr(fin);
  const dans = s => { const d = String(s.datePrevu || '').slice(0, 10); return d >= D && d <= F; };
  return [
    ...arr(p.muscuSeances).filter(dans).map(s => ({ ...s, _type: 'muscu' })),
    ...arr(p.enduranceSeances).filter(dans).map(s => ({ ...s, _type: 'endurance' })),
  ].sort((a, b) => String(a.datePrevu).localeCompare(String(b.datePrevu)) || (a._type === 'muscu' ? -1 : 1));
}

// ── Médias des exercices : image du coach, image / vidéo de la bibliothèque ──
function idYoutube(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}
function estImageUrl(url) {
  return /^data:image\//.test(url) || /\.(png|jpe?g|gif|webp|bmp)(\?|#|$)/i.test(String(url || '')) || /googleusercontent|imgur|i\.ytimg|img\.youtube|unsplash|cloudinary|firebasestorage/i.test(String(url || ''));
}
// Pour un exercice : { image (URL à intégrer), video (lien), lien (autre lien), biblio (fiche de la bibliothèque) }
function mediasExercice(ex) {
  const res = { image: null, video: null, lien: null, biblio: null };
  let m = null;
  try { m = typeof findBiblioMatch === 'function' ? findBiblioMatch(typeof biblioNomPour === 'function' ? biblioNomPour(ex) : ex.nom) : null; } catch (e) {}
  res.biblio = m;
  const urls = [ex.imageUrl, m && m.imageUrl, m && (m.videoUrl || (m.videoId ? 'https://youtu.be/' + m.videoId : ''))].filter(Boolean);
  urls.forEach(u => {
    const yt = idYoutube(u);
    if (yt) { if (!res.video) res.video = 'https://youtu.be/' + yt; if (!res.image) res.image = 'https://i.ytimg.com/vi/' + yt + '/hqdefault.jpg'; }
    else if (estImageUrl(u)) { if (!res.image) res.image = u; }
    else if (/^https?:\/\//.test(u)) {
      if (/vimeo|instagram|tiktok|\.mp4|\.mov|drive\.google|facebook|dailymotion|youtube/i.test(u)) { if (!res.video) res.video = u; }
      else if (!res.lien) res.lien = u;
    }
  });
  // Une image explicite du coach passe avant la miniature YouTube
  if (ex.imageUrl && estImageUrl(ex.imageUrl) && !idYoutube(ex.imageUrl)) res.image = ex.imageUrl;
  return res;
}
// Charge une image (avec délai max) et la convertit en JPEG intégrable au PDF. null si impossible
// (site qui refuse le partage d'image : le lien reste dans le PDF).
function chargerImagePDF(url, delai) {
  return new Promise(resolve => {
    if (!url) return resolve(null);
    let fini = false;
    const fin = v => { if (!fini) { fini = true; resolve(v); } };
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const max = 480, r = Math.min(1, max / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const w = Math.max(1, Math.round((img.naturalWidth || 320) * r)), h = Math.max(1, Math.round((img.naturalHeight || 180) * r));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
        fin({ data: c.toDataURL('image/jpeg', 0.82), w, h });
      } catch (e) { fin(null); }
    };
    img.onerror = () => fin(null);
    setTimeout(() => fin(null), delai || 7000);
    img.src = url;
  });
}

async function exporterSemainePDF(player, debut, nbSemaines, onEtat) {
  try {
    const J = window.jspdf && window.jspdf.jsPDF;
    if (!J) { alert("La librairie d'export PDF n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
    const T = exportSemaineTexte;
    const seances = exportSemaineSeances(player, debut, nbSemaines);
    // Médias de tous les exercices, images chargées en parallèle
    const exosDe = s => (Array.isArray(s.exercices) ? s.exercices : Object.values(s.exercices || {})).filter(Boolean);
    const medias = new Map();
    seances.forEach(s => { if (s._type === 'muscu') exosDe(s).forEach(ex => medias.set(ex, mediasExercice(ex))); });
    const urlsImages = Array.from(new Set(Array.from(medias.values()).map(m => m.image).filter(Boolean)));
    if (onEtat) onEtat('Chargement des images (' + urlsImages.length + ')…');
    const images = {};
    await Promise.all(urlsImages.map(async u => {
      let r = await chargerImagePDF(u);
      const yt = u.match(/i\.ytimg\.com\/vi\/([^/]+)\/hqdefault/);
      if (!r && yt) r = await chargerImagePDF('https://i.ytimg.com/vi/' + yt[1] + '/mqdefault.jpg');
      images[u] = r;
    }));
    if (onEtat) onEtat('Création du PDF…');
    const fin = new Date(debut); fin.setDate(fin.getDate() + nbSemaines * 7 - 1);
    const fmtJour = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const fmtCourt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const doc = new J({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    const M = 32;

    doc.setFillColor(11, 13, 16); doc.rect(0, 0, W, 70, 'F');
    doc.setTextColor(255, 164, 32); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text(T('Séances — ' + (player.name || 'Joueur')), M, 32);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(T('Du ' + fmtJour(debut) + ' au ' + fmtJour(fin) + '  ·  ' + seances.length + ' séance' + (seances.length > 1 ? 's' : '')), M, 50);
    doc.setFontSize(8); doc.setTextColor(180, 180, 180);
    doc.text(T('Les dates sont indicatives : tu peux faire les séances un autre jour, en gardant au moins 24-48 h entre deux séances intenses.'), M, 63);
    let y = 88;

    if (!seances.length) {
      doc.setTextColor(60, 60, 60); doc.setFontSize(11);
      doc.text(T('Aucune séance programmée sur cette période.'), M, y);
    }

    let jourCourant = null;
    seances.forEach((s, idx) => {
      const d = String(s.datePrevu).slice(0, 10);
      if (y > H - 120) { doc.addPage(); y = 40; }
      if (d !== jourCourant) {
        jourCourant = d;
        doc.setFillColor(255, 164, 32); doc.rect(M, y - 11, W - 2 * M, 18, 'F');
        doc.setTextColor(20, 20, 24); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
        const dt = new Date(d + 'T00:00:00');
        doc.text(T(fmtJour(dt).toUpperCase()), M + 6, y + 2);
        y += 22;
      }
      // Titre de la séance
      const faite = s.dateFaite ? '  (faite le ' + fmtCourt(new Date(String(s.dateFaite).slice(0, 10) + 'T00:00:00')) + ')' : '';
      doc.setTextColor(20, 20, 24); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text(T((s._type === 'muscu' ? 'Musculation — ' : 'Endurance — ') + (s.nom || 'Séance') + faite), M, y);
      y += 13;
      const infos = [s.methode && 'Méthode : ' + s.methode, (s.rpeCible || s.rpe) && 'RPE cible : ' + (s.rpeCible || s.rpe) + '/10',
        s.duree && 'Durée : ' + s.duree + ' min', s.objectif && 'Objectif : ' + s.objectif].filter(Boolean).join('   ·   ');
      if (infos) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90, 90, 96);
        const l = doc.splitTextToSize(T(infos), W - 2 * M); doc.text(l, M, y); y += l.length * 10 + 2;
      }

      if (s._type === 'muscu') {
        const exos = (Array.isArray(s.exercices) ? s.exercices : Object.values(s.exercices || {})).filter(Boolean);
        const body = [];
        exos.forEach((ex, i) => {
          const hint = typeof chargeHintRM === 'function' ? chargeHintRM(ex, player) : null;
          const charge = hint && hint.ok ? hint.kg + ' kg' + (ex.charge ? ' (' + ex.charge + ')' : '') : (ex.charge || '');
          const groupe = ex.groupeType && ex.groupeId ? (ex.groupeType === 'superset' ? ' [superset ' : ' [dropset ') + ex.groupeId + ']' : '';
          const det = (ex.chargeDetails || []).filter(Boolean);
          body.push([String(i + 1), T((ex.nom || '') + groupe), det.length ? String(det.length) : T(ex.emom ? (ex.emomDuree || 10) + ' min EMOM' : (ex.series || '')),
            T(det.length ? 'voir détail' : (ex.reps || '')), T(det.length ? '' : charge), T(ex.repos || ''), T(ex.notes || ''), '']);
          det.forEach((dd, k) => {
            const kg = typeof liveChargeDetailText === 'function' ? liveChargeDetailText(ex, dd, player) : (dd.charge || '');
            body.push(['', T('   Série ' + (k + 1)), '', T(String(dd.reps == null ? '' : dd.reps)), T(kg + (dd.pct && !/%/.test(kg) ? ' (' + dd.pct + '%)' : '')), '', T(dd.note || ''), '']);
          });
        });
        if (body.length) {
          doc.autoTable({
            startY: y, margin: { left: M, right: M },
            head: [['#', 'Exercice', 'Séries', 'Reps', 'Charge', 'Repos', 'Consignes', 'Fait']],
            body, theme: 'grid',
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 3.5, textColor: [30, 30, 34], lineColor: [225, 225, 228], lineWidth: 0.5, valign: 'middle' },
            headStyles: { fillColor: [40, 40, 46], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 16, halign: 'center' }, 1: { cellWidth: 120, fontStyle: 'bold' }, 2: { cellWidth: 38, halign: 'center' },
              3: { cellWidth: 62 }, 4: { cellWidth: 70 }, 5: { cellWidth: 40 }, 7: { cellWidth: 28 } },
            didParseCell: data => { if (data.section === 'body' && String(data.row.raw[1]).startsWith('   Série')) { data.cell.styles.fontStyle = 'normal'; data.cell.styles.textColor = [90, 90, 96]; } },
            didDrawCell: data => {
              if (data.section === 'body' && data.column.index === 7 && data.row.raw[0]) {
                const c = data.cell; doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.8);
                doc.rect(c.x + c.width / 2 - 5, c.y + c.height / 2 - 5, 10, 10);
              }
            },
          });
          y = doc.lastAutoTable.finalY + 10;
          // ── Fiches exercices : image / vidéo de référence, consignes, technique, muscles ──
          exos.forEach((ex, i) => {
            const md = medias.get(ex) || {};
            const im = md.image ? images[md.image] : null;
            const b = md.biblio || {};
            const lignes = [];
            const presc = ex.emom ? (ex.emomDuree || 10) + ' min EMOM · ' + (ex.reps || '') + ' reps/min'
              : [ex.series && ex.reps ? ex.series + ' × ' + ex.reps : (ex.series ? ex.series + ' séries' : ex.reps), ex.charge, ex.repos && 'repos ' + ex.repos, ex.rir && 'RIR ' + ex.rir].filter(Boolean).join('  ·  ');
            if (presc) lignes.push(['Programme', presc]);
            if (ex.notes) lignes.push(['Consigne du coach', ex.notes]);
            if (b.notes) lignes.push(['Technique', b.notes + (b.variante ? ' (' + b.variante + ')' : '')]);
            if (b.groupe || b.musclesSec) lignes.push(['Muscles', [b.groupe, b.musclesSec].filter(Boolean).join(' · ')]);
            if (b.materiel) lignes.push(['Matériel', b.materiel]);
            const imgW = im ? 110 : 0, imgH = im ? Math.min(110 * im.h / im.w, 120) : 0;
            const xTxt = M + (im ? imgW + 10 : 0), wTxt = W - M - xTxt;
            doc.setFontSize(8.3);
            const blocs = lignes.map(([k, v]) => ({ k, l: doc.splitTextToSize(T(v), wTxt - 82) }));
            const hTxt = 14 + blocs.reduce((a, bl) => a + bl.l.length * 9.6 + 2, 0) + (md.video || md.lien ? 22 : 0);
            const hBloc = Math.max(imgH, hTxt) + 8;
            if (y + hBloc > H - 34) { doc.addPage(); y = 40; }
            doc.setDrawColor(230, 230, 233); doc.setLineWidth(0.6); doc.roundedRect(M - 4, y - 4, W - 2 * M + 8, hBloc, 4, 4);
            if (im) { try { doc.addImage(im.data, 'JPEG', M, y, imgW, imgH); } catch (e) {} }
            let yy = y + 9;
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 24);
            doc.text(T((i + 1) + '. ' + (ex.nom || '')), xTxt, yy); yy += 13;
            blocs.forEach(bl => {
              doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(120, 120, 126); doc.text(T(bl.k), xTxt, yy);
              doc.setFont('helvetica', 'normal'); doc.setFontSize(8.3); doc.setTextColor(35, 35, 40); doc.text(bl.l, xTxt + 82, yy);
              yy += bl.l.length * 9.6 + 2;
            });
            if (md.video || md.lien) {
              const u = md.video || md.lien;
              doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); doc.setTextColor(25, 118, 210);
              const lib = (md.video ? '> Voir la vidéo : ' : '> Lien : ') + u;
              doc.textWithLink(T(lib.length > 95 ? lib.slice(0, 92) + '...' : lib), xTxt, yy + 4, { url: u });
            }
            y += hBloc + 6;
          });
          y += 4;
        } else {
          doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(T('(aucun exercice renseigné)'), M, y); y += 12;
        }
      } else {
        const lignes = [
          ['Type', s.type ? String(s.type).replace(/_/g, ' ') : ''], ['Durée', s.duree ? s.duree + ' min' : ''], ['Intensité', s.intensite],
          ['Distance', s.distance], ['FC cible', s.fcCible], ['Format', s.format ? String(s.format).replace(/_/g, '/') : ''],
          ['Séries', s.series && s.format ? s.series : ''], ['Récupération', s.recup], ['Modalité', s.modalite],
        ].filter(l => l[1] != null && String(l[1]).trim() !== '').map(([a, b]) => [T(a), T(b)]);
        if (lignes.length) {
          doc.autoTable({
            startY: y, margin: { left: M, right: M }, body: lignes, theme: 'plain',
            styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5, textColor: [30, 30, 34] },
            columnStyles: { 0: { cellWidth: 90, fontStyle: 'bold', textColor: [90, 90, 96] } },
          });
          y = doc.lastAutoTable.finalY + 12;
        }
      }
      if (s.notes) {
        if (y > H - 60) { doc.addPage(); y = 40; }
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 66);
        const l = doc.splitTextToSize(T('Notes du coach : ' + s.notes), W - 2 * M);
        doc.text(l, M, y); y += l.length * 10 + 4;
      }
      // Ressenti à remplir à la main
      if (!s.dateFaite) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110, 110, 116);
        doc.text(T('Faite le : ____ / ____     RPE ressenti (1-10) : ______     Remarques : ____________________________'), M, y + 4);
        y += 14;
      }
      y += idx < seances.length - 1 ? 12 : 0;
    });

    const n = doc.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(140, 140, 140);
      doc.text(T('PerfHand — ' + (player.name || '') + ' — page ' + i + '/' + n), M, H - 14);
      doc.text(T('Pense à valider tes séances dans l\'appli pour que ton coach suive ta charge.'), W - M, H - 14, { align: 'right' });
    }
    const nomFichier = ('seances_' + (player.name || 'joueur') + '_' + localDateStr(debut)).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_');
    doc.save(nomFichier + '.pdf');
    return true;
  } catch (e) {
    console.error('[export semaine]', e);
    alert('Export impossible : ' + ((e && e.message) || e));
    return false;
  }
}

// Bouton + petite fenêtre : choix de la semaine (et du nombre de semaines), aperçu du nombre de séances.
function BoutonExportSemaine({ player, compact, libelle }) {
  const [ouvert, setOuvert] = useState(false);
  const [decalage, setDecalage] = useState(0);
  const [nb, setNb] = useState(1);
  const [etat, setEtat] = useState('');
  if (!player) return null;
  const lundi = new Date(); lundi.setHours(0, 0, 0, 0);
  lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7) + decalage * 7);
  const fin = new Date(lundi); fin.setDate(fin.getDate() + nb * 7 - 1);
  const seances = exportSemaineSeances(player, lundi, nb);
  const court = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const btn = a => ({ padding: '6px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
    border: '1px solid ' + (a ? 'rgba(255,164,32,.5)' : 'rgba(255,255,255,.12)'), background: a ? 'rgba(255,164,32,.15)' : 'rgba(255,255,255,.04)', color: a ? '#FFA420' : 'rgba(255,255,255,.7)' });
  return _h`<span>
    <button class="btn btn-sm" onClick=${() => setOuvert(true)} title="Télécharger les séances en PDF pour les faire à d'autres dates"
      style=${{ background: 'rgba(56,189,248,.1)', border: '1px solid rgba(56,189,248,.35)', color: '#38BDF8', fontWeight: 700, flexShrink: 0 }}>
      📄 ${libelle || (compact ? 'PDF' : 'Exporter mes séances')}
    </button>
    ${ouvert ? _h`<div class="edit-modal-bg" onClick=${() => setOuvert(false)}>
      <div class="edit-modal" style=${{ maxWidth: 440 }} onClick=${e => e.stopPropagation()}>
        <div style=${{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style=${{ fontSize: 15, fontWeight: 800 }}>📄 Exporter les séances</div>
          <button onClick=${() => setOuvert(false)} style=${{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div class="edit-modal-body" style=${{ fontSize: 12.5 }}>
          <div style=${{ color: 'rgba(255,255,255,.55)', marginBottom: 12, lineHeight: 1.5 }}>
            Un PDF avec tout le contenu des séances (exercices, séries, charges, repos, consignes) pour les faire quand ça t'arrange.
          </div>
          <div style=${{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button style=${btn(false)} onClick=${() => setDecalage(x => x - 1)}>←</button>
            <div style=${{ flex: 1, textAlign: 'center', fontWeight: 700 }}>
              ${decalage === 0 ? 'Cette semaine' : decalage === 1 ? 'Semaine prochaine' : decalage === -1 ? 'Semaine dernière' : 'Semaine'}
              <div style=${{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 400 }}>du ${court(lundi)} au ${court(fin)}</div>
            </div>
            <button style=${btn(false)} onClick=${() => setDecalage(x => x + 1)}>→</button>
          </div>
          <div style=${{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            ${[1, 2, 4].map(n => _h`<button key=${n} style=${btn(nb === n)} onClick=${() => setNb(n)}>${n} semaine${n > 1 ? 's' : ''}</button>`)}
          </div>
          <div style=${{ marginBottom: 14, color: seances.length ? 'rgba(255,255,255,.75)' : '#FF4455' }}>
            ${seances.length ? seances.length + ' séance' + (seances.length > 1 ? 's' : '') + ' : ' + seances.map(s => s.nom || (s._type === 'muscu' ? 'Muscu' : 'Endurance')).join(', ') : 'Aucune séance programmée sur cette période.'}
          </div>
          <button class="btn btn-primary" style=${{ width: '100%', padding: 11, fontWeight: 800 }} disabled=${!seances.length || !!etat}
            onClick=${async () => { setEtat('Préparation…'); const ok = await exporterSemainePDF(player, lundi, nb, setEtat); setEtat(''); if (ok) setOuvert(false); }}>${etat ? '⏳ ' + etat : '⬇️ Télécharger le PDF'}</button>
          <div style=${{ fontSize: 10.5, color: 'rgba(255,255,255,.35)', marginTop: 8, lineHeight: 1.5 }}>Le PDF contient une fiche par exercice avec l'image ou la vidéo de référence (lien cliquable), les consignes et la technique.</div>
        </div>
      </div>
    </div>` : null}
  </span>`;
}
