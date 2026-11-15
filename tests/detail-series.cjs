// Séance issue d'une méthode (clusters) : le coach doit pouvoir modifier le détail série par série
// (reps, % 1RM, consigne), ajouter / supprimer une série, et c'est enregistré dans la base.
// Usage : node detail-series.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const jour = n => { const d = new Date(Date.now() + n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const get = async p => (await fetch(`${DB}/${p}.json?ns=${NS}`, { headers: { Authorization: 'Bearer owner' } })).json();
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  const cd = [
    { serie: 1, reps: '4 (1+1+1+1)', pct: 80, charge: '60 kg', note: '15s de repos entre chaque rep - explosion max' },
    { serie: 2, reps: '4 (1+1+1+1)', pct: 82, charge: '62.5 kg', note: '15s de repos entre chaque rep' },
    { serie: 3, reps: '4 (1+1+1+1)', pct: 85, charge: '65 kg', note: '15s de repos entre chaque rep' }];
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: { 'perso-mounir': { id: 'perso-mounir', clubId: 'usm', name: 'Mounir Test', email: 'mounir@test.fr', sport: 'Handball', status: 'ok',
        rm: { developpe_militaire: 75 },
        muscuSeances: [{ id: 'mC', nom: 'Clusters', methode: 'Clusters', datePrevu: jour(1), rpe: 7,
          exercices: [{ nom: 'Développé militaire', series: 3, reps: '4 (1+1+1+1) / 4 (1+1+1+1) / 4 (1+1+1+1)', charge: '75% - 77% - 80%', rir: '2', repos: '2min', chargeDetails: cd }] }] } },
    } }) });
  const s = await open(file);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('👤 Profils individuels').first().click(); await s.p.waitForTimeout(1500);
  await s.p.getByText('Mounir Test').first().click(); await s.p.waitForTimeout(1500);
  await s.p.getByText('Muscu', { exact: true }).first().click(); await s.p.waitForTimeout(2000);
  await s.p.locator('button.btn-sm', { hasText: '✏️' }).last().click(); await s.p.waitForTimeout(1200);
  V("le détail par série est affiché et modifiable", await s.p.getByText(/Détail par série — modifiable/).count() > 0);
  const pct = s.p.locator('input[placeholder="%"]');
  V('3 lignes de série', await pct.count() === 3, String(await pct.count()));
  await pct.nth(0).fill('70'); await s.p.waitForTimeout(300);
  await s.p.locator('input[placeholder="8"]').nth(1).fill('3 (1+1+1)');
  await s.p.locator('input[placeholder="Consigne de la série"]').nth(2).fill('Max vitesse');
  await s.p.getByText('+ Ajouter une série').click(); await s.p.waitForTimeout(300);
  await s.p.locator('input[placeholder="%"]').nth(3).fill('88');
  await s.p.screenshot({ path: '/tmp/claude-0/-home-user-perfhand/a4276d99-69dd-5b3a-9e8f-7581e205a645/scratchpad/ds2.png' });
  V('la nouvelle série est ajoutée (4 lignes)', await s.p.locator('input[placeholder="%"]').count() === 4);
  await s.p.getByText(/Enregistrer|Sauvegarder/).last().click(); await s.p.waitForTimeout(3000);
  let m = await get('perfhand/playersPerso/perso-mounir/muscuSeances');
  m = Array.isArray(m) ? m : Object.values(m || {});
  const ex = ((m.find(x => x.id === 'mC') || {}).exercices || [])[0] || {};
  const d = ex.chargeDetails || [];
  V('S1 enregistrée à 70 %', d[0] && d[0].pct === 70, JSON.stringify(d[0]));
  V("S1 : l'ancien poids figé (60 kg) n'est plus utilisé", d[0] && !d[0].charge, JSON.stringify(d[0]));
  V('S2 : reps modifiées', d[1] && d[1].reps === '3 (1+1+1)', JSON.stringify(d[1]));
  V('S3 : consigne modifiée', d[2] && d[2].note === 'Max vitesse', JSON.stringify(d[2]));
  V('S4 ajoutée à 88 %', d[3] && d[3].pct === 88 && d[3].serie === 4, JSON.stringify(d[3]));
  V('Séries / Charge alignées sur le détail', ex.series === 4 && ex.charge === '70% - 82% - 85% - 88%', ex.series + ' | ' + ex.charge);
  const vue = await s.p.evaluate(() => document.body.innerText);
  V('la vue coach affiche bien S1 à 70 % et S4 à 88 %', /70\s?%/.test(vue) && /88\s?%/.test(vue));
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
