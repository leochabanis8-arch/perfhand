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

function exporterSemainePDF(player, debut, nbSemaines) {
  try {
    const J = window.jspdf && window.jspdf.jsPDF;
    if (!J) { alert("La librairie d'export PDF n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
    const T = exportSemaineTexte;
    const seances = exportSemaineSeances(player, debut, nbSemaines);
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
          y = doc.lastAutoTable.finalY + 14;
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
          <button class="btn btn-primary" style=${{ width: '100%', padding: 11, fontWeight: 800 }} disabled=${!seances.length}
            onClick=${() => { if (exporterSemainePDF(player, lundi, nb)) setOuvert(false); }}>⬇️ Télécharger le PDF</button>
        </div>
      </div>
    </div>` : null}
  </span>`;
}
