// Analyse « Muscles » : un exercice compte pour tous ses muscles (principal = 1 série, secondaire = ½),
// en séries. Cas signalé par Léo : le soulevé de terre roumain doit compter pour les ischio-jambiers.
// Usage : node muscles.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const SC = process.env.CAPTURE || '';
const jour = n => { const d = new Date(Date.now() + n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: { 'perso-m': { id: 'perso-m', clubId: 'usm', name: 'Mounir Test', email: 'm@test.fr', status: 'ok',
        muscuSeances: [{ id: 's1', nom: 'Bas du corps', datePrevu: jour(-2), exercices: [
          { nom: 'Soulevé de terre roumain', series: 4, reps: '6' },
          { nom: 'Back Squat', series: 4, reps: '5' },
          { nom: 'Développé couché', series: 3, reps: '8' },
          { nom: 'Exercice inventé', series: 3, reps: '8' }] }] } },
    } }) });
  const s = await open(file);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('👤 Profils individuels').first().click(); await s.p.waitForTimeout(1500);
  await s.p.getByText('Mounir Test').first().click(); await s.p.waitForTimeout(1500);
  await s.p.getByText('Muscu', { exact: true }).first().click(); await s.p.waitForTimeout(1500);
  await s.p.getByText(/Muscles/).first().click(); await s.p.waitForTimeout(1000);
  const t = await s.p.evaluate(() => document.body.innerText);
  if (SC) await s.p.screenshot({ path: SC, fullPage: true });
  V('ischio-jambiers : 4 séries (soulevé de terre roumain)', /Ischio-jambiers[\s\S]{0,80}?4 séries/.test(t), t.slice(0, 400));
  V('quadriceps : 4 séries (squat)', /Quadriceps[\s\S]{0,80}?4 séries/.test(t));
  V('fessiers : 4 séries (½ RDL + ½ squat)', /Fessiers[\s\S]{0,80}?4 séries/.test(t));
  V('pectoraux : 3 séries', /Pectoraux[\s\S]{0,80}?3 séries/.test(t));
  V('exercice inconnu signalé', t.includes('Exercices non reconnus') && t.includes('Exercice inventé'));
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
