// Exercice en secondes : bouton « Lancer le chrono », compte à rebours, série validée automatiquement,
// puis chrono de repos. Un exercice en répétitions n'a pas ce bouton.
// Usage : node chrono-effort.cjs [fichier html]
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
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'samir@test.fr', password: 'samir123', returnSecureToken: true }) });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: { 'perso-samir': { id: 'perso-samir', clubId: 'usm', name: 'Samir Test', email: 'samir@test.fr', sport: 'Handball', status: 'ok',
        wellnessCheckins: { [jour(0)]: { dateRessenti: jour(0), douleurs: 4, energie: 4, sommeil: 4, humeur: 4, stress: 4 } },
        muscuSeances: [{ id: 'mG', nom: 'Gainage du jour', datePrevu: jour(0), exercices: [
          { nom: 'Planche frontale', series: 2, reps: '3 s', charge: 'Poids de corps', repos: '20s' },
          { nom: 'Squat', series: 3, reps: '8', charge: '60 kg', repos: '90s' },
          { nom: 'Overhead iso lourd (3sec)', series: 2, reps: '2', charge: 'Lourd', repos: '20s' }] }] } },
    },
    acces: { joueurs: { 'samir@test,fr': { type: 'perso', id: 'perso-samir' } } } }) });
  const s = await open(file);
  await s.p.setViewportSize({ width: 430, height: 900 });
  await loginEmail(s.p, 'samir@test.fr', 'samir123');
  await s.p.getByText('Muscu', { exact: true }).first().click(); await s.p.waitForTimeout(1500);
  const lancer = s.p.getByRole('button', { name: /Lancer le chrono/ });
  V('bouton « Lancer le chrono » sur les 2 exercices en secondes (pas sur le squat)', await lancer.count() === 2, String(await lancer.count()));
  V('durée lue dans le nom « (3sec) » avec 2 reps : « 2 × 3s »', /série 1 : 2 × 3s/.test(await lancer.nth(1).innerText().catch(() => '')), await lancer.nth(1).innerText().catch(() => ''));
  V('le bouton indique la durée (3s)', /série 1 : 3s/.test(await lancer.first().innerText().catch(() => '')));
  await lancer.first().click(); await s.p.waitForTimeout(1200);
  let t = await s.p.evaluate(() => document.body.innerText);
  V('phase « Prêt… » affichée', t.includes('Prêt…'));
  await s.p.waitForTimeout(2500);
  t = await s.p.evaluate(() => document.body.innerText);
  if (SC) await s.p.screenshot({ path: SC });
  V('phase « EFFORT » avec compte à rebours', /EFFORT · série 1\/2/.test(t), t.slice(0, 300));
  await s.p.waitForTimeout(3500);
  t = await s.p.evaluate(() => document.body.innerText);
  V('à la fin : série 1 validée et repos lancé', /REPOS — Série 1 terminée/.test(t));
  // Répétitions chronométrées : rep 1/2 → relâche → rep 2/2 → série validée
  await s.p.getByRole('button', { name: /2 × 3s/ }).click(); await s.p.waitForTimeout(4000);
  t = await s.p.evaluate(() => document.body.innerText);
  V('rep 1/2 chronométrée', /EFFORT — rep 1\/2/.test(t));
  await s.p.waitForTimeout(3500);
  t = await s.p.evaluate(() => document.body.innerText);
  V('relâche entre les reps', /Relâche/.test(t), t.slice(0, 200));
  await s.p.waitForTimeout(3000);
  t = await s.p.evaluate(() => document.body.innerText);
  V('rep 2/2 chronométrée', /EFFORT — rep 2\/2/.test(t));
  await s.p.waitForTimeout(3500);
  t = await s.p.evaluate(() => document.body.innerText);
  V('après la dernière rep : série validée, repos lancé', (t.match(/REPOS — Série 1 terminée/g) || []).length >= 1);
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
