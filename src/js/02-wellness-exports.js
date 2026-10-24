
// wellnessCheckins est stocké côté Firebase comme un objet {date: checkin} (écriture par clé
// dédiée, pour que deux joueurs/appareils n'écrasent jamais le check-in d'un autre jour), mais
// plusieurs écrans du coach l'utilisaient comme un tableau (.map/.find/.filter/.length) — ce qui
// le faisait apparaître vide partout. Ce helper normalise toujours vers un tableau pour l'affichage.
function wellnessArr(p) {
  const w = p && p.wellnessCheckins;
  if (!w) return [];
  return Array.isArray(w) ? w : Object.values(w).filter(Boolean);
}

// ── FIABILISATION DU WELLNESS DU JOUR ─────────────────────────────────────────
// Problème rapporté : des joueurs remplissent le questionnaire, mais il leur est redemandé
// ensuite. Causes possibles couvertes ici :
//  1. La décision "pas encore rempli" se basait uniquement sur la copie locale du joueur, qui peut
//     être en retard sur Firebase au moment de l'ouverture de l'app (popup non fermable ouverte
//     à tort). => on mémorise localement "envoyé aujourd'hui" (indépendant de Firebase) et on
//     vérifie directement sur le serveur avant d'ouvrir la popup.
//  2. L'écriture Firebase peut échouer ou ne pas être confirmée (réseau coupé juste après
//     l'envoi, app fermée trop vite, règle refusée). => l'envoi est gardé en attente localement
//     et renvoyé automatiquement (au prochain chargement, au retour du réseau, ou périodiquement)
//     jusqu'à confirmation du serveur.
function wellnessDoneKey(id)    { return 'perfhand_wellnessDone_' + id; }
function wellnessPendingKey(id) { return 'perfhand_wellnessPending_' + id; }
function markWellnessDoneLocally(id, day) { try { localStorage.setItem(wellnessDoneKey(id), day); } catch(e) {} }
function isWellnessDoneLocally(id, day)   { try { return localStorage.getItem(wellnessDoneKey(id)) === day; } catch(e) { return false; } }
function flushPendingWellness(id) {
  // Renvoie un check-in resté en attente (jamais confirmé par le serveur). Sans effet s'il n'y en a pas.
  try {
    if (!window.__perfhand_db) return;
    const raw = localStorage.getItem(wellnessPendingKey(id));
    if (!raw) return;
    const pending = JSON.parse(raw);
    if (!pending || !pending.path || !pending.data) { localStorage.removeItem(wellnessPendingKey(id)); return; }
    window.__perfhand_db.ref(pending.path).set(pending.data)
      .then(function() { try { localStorage.removeItem(wellnessPendingKey(id)); } catch(e) {} console.log('[wellness] envoi en attente confirmé'); })
      .catch(function(e) { console.warn('[wellness] renvoi en attente impossible pour l\'instant:', e && e.code, e && e.message); });
  } catch(e) { console.warn('[wellness] flush pending', e); }
}
function sendWellnessCheckin(player, data) {
  // Envoie le wellness du jour : marque "fait" en local tout de suite, garde l'envoi en attente
  // tant que le serveur ne l'a pas confirmé, et renvoie une promesse (rejetée si l'écriture échoue).
  const today = data.dateRessenti || localDateStr();
  const basePath = player.clubId ? 'perfhand/playerProfiles/' : 'perfhand/playersPerso/';
  const path = basePath + player.id + '/wellnessCheckins/' + today;
  let safeData; try { safeData = JSON.parse(JSON.stringify(data)); } catch(e) { safeData = data; }
  markWellnessDoneLocally(player.id, today);
  try { localStorage.setItem(wellnessPendingKey(player.id), JSON.stringify({ path: path, data: safeData })); } catch(e) {}
  if (!window.__perfhand_db) return Promise.reject(new Error('Connexion au serveur indisponible'));
  return window.__perfhand_db.ref(path).set(safeData).then(function() {
    try { localStorage.removeItem(wellnessPendingKey(player.id)); } catch(e) {}
    console.log('[wellness] écrit avec succès pour', today);
  });
}

// Export CSV générique — construit un fichier CSV (séparateur ";" pour un bon rendu direct dans
// Excel FR) à partir d'un tableau de lignes (chaque ligne = tableau de valeurs) et déclenche son
// téléchargement côté navigateur, sans dépendance externe.
function downloadCSV(filename, rows) {
  const esc = (v) => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = '﻿' + rows.map(r => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Construit les lignes du tableau récap de stats de saison (utilisé par les 3 exports
// CSV / Excel / PDF) à partir de la liste des matchs et des joueurs du club — une seule
// source de vérité pour ne pas désynchroniser les colonnes entre les formats.
function buildStatsExportRows(matchs, players) {
  const header = ['Date','Adversaire','Lieu','Score nous','Score eux','Résultat','Possessions','Buts','Tirs','% Réussite','Interceptions','Pertes provoquées','Contres','Neutralisations','Relances +','Relances -'];
  const rows = matchs.slice().sort((a,b) => (a.date||'').localeCompare(b.date||'')).map(m => {
    const totalButs = players.reduce((s,p) => s + (Number(m.stats?.attaque?.[p.id]?.['Buts'])||0), 0);
    const totalTirs = players.reduce((s,p) => s + (Number(m.stats?.attaque?.[p.id]?.['Tirs'])||0), 0);
    const pct = totalTirs > 0 ? Math.round(totalButs/totalTirs*100) : '';
    const interceptionsManuel = players.reduce((s,p) => s + (Number(m.stats?.defense?.[p.id]?.['Interceptions'])||0), 0);
    const interceptions = (m.interceptions && m.interceptions.length) ? m.interceptions.length : interceptionsManuel;
    const res = m.scoreNous > m.scoreEux ? 'Victoire' : m.scoreNous < m.scoreEux ? 'Défaite' : (m.scoreNous!=='' && m.scoreNous!=null ? 'Nul' : '');
    const relancesPos = (m.relancesGardien||[]).filter(e => e.sens !== 'neg').length;
    const relancesNeg = (m.relancesGardien||[]).filter(e => e.sens === 'neg').length;
    return [m.date||'', m.adversaire||'', m.lieu==='domicile'?'Domicile':'Extérieur', m.scoreNous ?? '', m.scoreEux ?? '', res, m.possessions ?? '', totalButs, totalTirs, pct, interceptions, (m.pertesProvoquees||[]).length, (m.contres||[]).length, (m.neutralisations||[]).length, relancesPos, relancesNeg];
  });
  return { header, rows };
}

// Export Excel (.xlsx) stylé des stats de saison — via ExcelJS (chargé en CDN dans le
// <head>), avec en-tête colorée, largeurs de colonnes adaptées et ligne colorée selon le
// résultat (vert victoire / rouge défaite / gris nul).
async function exporterStatsExcel(matchs, players, club) {
  try {
    if (typeof ExcelJS === 'undefined') { alert("La librairie d'export Excel n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
    const { header, rows } = buildStatsExportRows(matchs, players);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PerfHand';
    wb.created = new Date();
    const ws = wb.addWorksheet('Stats matchs', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = header.map((h) => ({ header: h, key: h, width: Math.max(12, h.length + 4) }));
    ws.columns[1].width = 22; // Adversaire

    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF141418' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA420' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF141418' } } };
    });
    headerRow.height = 22;

    rows.forEach((r) => {
      const row = ws.addRow(r);
      const res = r[5];
      let fillColor = null;
      if (res === 'Victoire') fillColor = 'FFE7F6E8';
      else if (res === 'Défaite') fillColor = 'FFFCE8E9';
      else if (res === 'Nul') fillColor = 'FFF1F1F1';
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: colNumber <= 2 ? 'left' : 'center' };
        if (fillColor) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        if (colNumber === 6) {
          cell.font = { bold: true, color: { argb: res === 'Victoire' ? 'FF2E7D32' : res === 'Défaite' ? 'FFC62828' : 'FF616161' } };
        }
      });
    });

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: header.length } };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'stats_matchs_' + (club.name||'club').replace(/\s+/g,'_') + '_' + localDateStr() + '.xlsx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error('[PerfHand] Export Excel:', e);
    alert("Erreur lors de l'export Excel : " + (e && e.message || e));
  }
}

// Export PDF coloré des stats de saison — via jsPDF + jspdf-autotable (chargés en CDN
// dans le <head>). Bandeau d'en-tête orange, tableau paysage zébré, colonne Résultat
// colorée cellule par cellule.
function exporterStatsPDF(matchs, players, club) {
  try {
    const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDFCtor) { alert("La librairie d'export PDF n'a pas pu charger. Vérifie ta connexion et réessaie."); return; }
    const { header, rows } = buildStatsExportRows(matchs, players);
    const doc = new jsPDFCtor({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Bandeau d'en-tête
    doc.setFillColor(11, 13, 16);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 164, 32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text((club.name || 'Club') + ' — Stats matchs', 24, 32);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Exporté le ' + new Date().toLocaleDateString('fr-FR'), 24, 48);

    const resColIndex = header.indexOf('Résultat');
    doc.autoTable({
      head: [header],
      body: rows,
      startY: 76,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: [30,30,34], lineColor: [225,225,228], lineWidth: 0.5 },
      headStyles: { fillColor: [255,164,32], textColor: [20,20,24], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [247,247,248] },
      columnStyles: { 0:{halign:'left'}, 1:{halign:'left'} },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === resColIndex) {
          const v = data.cell.raw;
          data.cell.styles.fontStyle = 'bold';
          if (v === 'Victoire') { data.cell.styles.fillColor = [231,246,232]; data.cell.styles.textColor = [46,125,50]; }
          else if (v === 'Défaite') { data.cell.styles.fillColor = [252,232,233]; data.cell.styles.textColor = [198,40,40]; }
          else if (v === 'Nul') { data.cell.styles.fillColor = [241,241,241]; data.cell.styles.textColor = [97,97,97]; }
        }
      },
      didDrawPage: () => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(140,140,140);
        doc.text('PerfHand — page ' + doc.internal.getCurrentPageInfo().pageNumber + '/' + pageCount, pageWidth - 100, doc.internal.pageSize.getHeight() - 14);
      },
    });

    // Cumul saison : d'où on prend les tirs et les buts (pivot, ailiers, arrières…)
    try {
      const ZN = ['Pivot','Ailier gauche','Ailier droit','Arrière extérieur','Arrière loin','Jet de 7 m','Contre-attaque'];
      const zrows = ZN.map(z => {
        let t = 0, b = 0;
        matchs.forEach(mm => { const d = mm.stats && mm.stats.zones_def && mm.stats.zones_def[z]; if (d) { t += Number(d.tirs)||0; b += Number(d.buts)||0; } });
        return { z, t, b };
      }).filter(r => r.t + r.b > 0);
      if (zrows.length) {
        const totT = zrows.reduce((a, r) => a + r.t, 0), totB = zrows.reduce((a, r) => a + r.b, 0);
        let y0 = doc.lastAutoTable.finalY + 28;
        if (y0 > doc.internal.pageSize.getHeight() - 200) { doc.addPage(); y0 = 40; }
        doc.setTextColor(30,30,34); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text("Saison — d'où on prend les tirs et les buts", 24, y0);
        doc.autoTable({
          head: [['Poste','Tirs subis','% des tirs','Buts encaissés','% des buts','Réussite adverse']],
          body: zrows.sort((a, c) => c.b - a.b || c.t - a.t).map(r => [r.z, r.t, totT ? Math.round(r.t/totT*100)+'%' : '-', r.b, totB ? Math.round(r.b/totB*100)+'%' : '-', r.t ? Math.round(r.b/r.t*100)+'%' : '-']),
          startY: y0 + 8, theme: 'grid',
          styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [30,30,34], lineColor: [225,225,228], lineWidth: 0.5 },
          headStyles: { fillColor: [255,68,85], textColor: [255,255,255], fontStyle: 'bold', halign: 'center' },
          alternateRowStyles: { fillColor: [247,247,248] },
          columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
        });
      }
    } catch (e2) { console.warn('[PerfHand] Cumul zones PDF:', e2); }

    doc.save('stats_matchs_' + (club.name||'club').replace(/\s+/g,'_') + '_' + localDateStr() + '.pdf');
  } catch (e) {
    console.error('[PerfHand] Export PDF:', e);
    alert("Erreur lors de l'export PDF : " + (e && e.message || e));
  }
}

// Un joueur peut appartenir à un club principal (clubId) ET à des clubs secondaires
// (clubIdsExtra) — ex: joueur convoqué à la fois en N1 et en Prénational.
function playerInClub(p, clubId) {
  if (!p || !clubId) return false;
  if (p.clubId === clubId) return true;
  return Array.isArray(p.clubIdsExtra) && p.clubIdsExtra.includes(clubId);
}
