// Export PDF des séances d'une semaine (profil individuel) : le joueur télécharge un PDF avec le
// contenu complet de ses séances (muscu + endurance) pour les faire à d'autres dates.
// Usage : node export-semaine.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const SORTIE = process.env.PDF_SORTIE || path.join(require('os').tmpdir(), 'export-semaine-test.pdf');
const lundi = n => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'samir@test.fr', password: 'samir123', returnSecureToken: true }) });
  const auj = lundi(((new Date().getDay() + 6) % 7));
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: { 'perso-samir': { id: 'perso-samir', clubId: 'usm', name: 'Samir Test', email: 'samir@test.fr', sport: 'Handball', status: 'ok',
        wellnessCheckins: { [auj]: { dateRessenti: auj, douleurs: 4, energie: 4, sommeil: 4, humeur: 4, stress: 4 } },
        muscuSeances: [
          { id: 'm1', nom: 'Force bas du corps', datePrevu: lundi(1), rpeCible: 8, notes: 'Bien s’échauffer → montée progressive', exercices: [
            { nom: 'Squat bulgare', series: 3, reps: '6 / jambe', charge: 'Haltères 2×16 kg', repos: '2min', notes: 'Descente 3 s', imageUrl: 'https://exemple.test/bulgare.png' },
            { nom: 'Hip Thrust', series: 2, reps: '', charge: '', repos: '90s', chargeDetails: [{ serie: 1, reps: '8', pct: 70 }, { serie: 2, reps: '6', pct: 80 }] }] },
          { id: 'm2', nom: 'Hors semaine', datePrevu: lundi(10), exercices: [] }],
        enduranceSeances: [{ id: 'e1', nom: 'Intermittent 30/30', datePrevu: lundi(3), duree: 25, intensite: '100% VMA', type: 'intermittent' }] } },
    },
    acces: { joueurs: { 'samir@test,fr': { type: 'perso', id: 'perso-samir' } } } }) });
  const s = await open(file);
  await s.p.setViewportSize({ width: 430, height: 900 });
  // Images : servies localement (pas d'accès réseau dans les tests), avec l'en-tête CORS des vrais sites
  const png = fs.readFileSync(path.join(__dirname, 'page-charge.png'));
  await s.p.route(/exemple\.test|i\.ytimg\.com/, r => r.fulfill({ body: png, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' } }));
  await loginEmail(s.p, 'samir@test.fr', 'samir123'); await s.p.waitForTimeout(2000);
  await s.p.getByRole('button', { name: /Exporter mes séances/ }).click(); await s.p.waitForTimeout(500);
  const t = await s.p.evaluate(() => document.body.innerText);
  V('la fenêtre annonce les 2 séances de la semaine', /2 séances : Force bas du corps, Intermittent 30\/30/.test(t), t.slice(0, 300));
  const [dl] = await Promise.all([s.p.waitForEvent('download', { timeout: 15000 }), s.p.getByRole('button', { name: /Télécharger le PDF/ }).click()]);
  await dl.saveAs(SORTIE);
  V('un PDF est téléchargé', fs.existsSync(SORTIE) && fs.statSync(SORTIE).size > 2000, dl.suggestedFilename());
  V('nom du fichier lisible', /^seances_Samir_Test_\d{4}-\d{2}-\d{2}\.pdf$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  const txt = execFileSync('pdftotext', ['-layout', SORTIE, '-']).toString();
  if (process.env.DUMP) console.log(txt);
  V('PDF : nom du joueur et séance muscu', /Samir Test/.test(txt) && /Force bas du corps/.test(txt));
  V('PDF : exercices, séries, repos, consignes', /Squat bulgare/.test(txt) && /6 \/ jambe/.test(txt) && /2min/.test(txt) && /Descente 3 s/.test(txt));
  V('PDF : détail par série (S1 8 reps à 70 %, S2 6 reps à 80 %)', /Série 1/.test(txt) && /70%/.test(txt) && /80%/.test(txt));
  V('PDF : séance d\'endurance', /Intermittent 30\/30/.test(txt) && /100% VMA/.test(txt) && /25 min/.test(txt));
  V('PDF : notes du coach (flèche convertie)', /Bien s’échauffer -> montée progressive/.test(txt));
  V('PDF : fiche exercice avec consigne du coach', /Consigne du coach/.test(txt));
  V('PDF : technique et muscles de la bibliothèque (Hip Thrust)', /Technique/.test(txt) && /Squeeze en haut/.test(txt) && /Muscles/.test(txt) && /Fessiers/.test(txt));
  V('PDF : lien vidéo de référence', /Voir la vidéo : https:\/\/youtu\.be\/SEdqd1n0cvg/.test(txt));
  const nbImages = execFileSync('pdfimages', ['-list', SORTIE]).toString().trim().split('\n').length - 2;
  V('PDF : images intégrées (image du coach + miniature vidéo)', nbImages >= 2, String(nbImages));
  const brut = fs.readFileSync(SORTIE, 'latin1');
  V('PDF : le lien vidéo est cliquable', /\/URI\s*\(https:\/\/youtu\.be\/SEdqd1n0cvg\)/.test(brut));
  V('PDF : séance hors semaine absente', !/Hors semaine/.test(txt));
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
