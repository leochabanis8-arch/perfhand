// En-tête de l'espace joueur : séances / charge / bien-être / non faites calculés à partir des vraies
// données (avant : anciens compteurs manuels à 0 — « 0 séance, 0 % de charge »).
// Usage : node stats-joueur.cjs [fichier html]
const { open, loginCode } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const jour = n => { const d = new Date(Date.now() + n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'basile@test.fr', password: 'basile123', returnSecureToken: true }) });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'Union Sud Mayenne', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: { 'p-basile': { id: 'p-basile', clubId: 'usm', name: 'Basile Test', email: 'basile@test.fr', pos: 'Ailier', num: 5, status: 'ok',
        stats: { sessions: 0, absences: 0, chargeWeek: 0, wellness: 3 },
        wellnessCheckins: { [jour(0)]: { dateRessenti: jour(0), douleurs: 4, energie: 4, sommeil: 4, humeur: 4, stress: 4 } },
        muscuSeances: [{ id: 'm1', nom: 'Muscu faite', datePrevu: jour(0), dateFaite: jour(0), rpeReel: 7, duree: 60, exercices: [] },
                       { id: 'm2', nom: 'Muscu ratée', datePrevu: jour(-1), exercices: [] }],
        enduranceSeances: [{ id: 'e1', nom: 'Footing', datePrevu: jour(-2), dateFaite: jour(-2), rpeReel: 4, duree: 30 }] } },
      codes: { '123456': { playerId: 'p-basile', playerName: 'Basile Test', clubId: 'usm' } },
    },
    acces: { joueurs: { 'basile@test,fr': { type: 'club', id: 'p-basile' } } } }) });
  const s = await open(file);
  await s.p.setViewportSize({ width: 430, height: 900 });
  await loginCode(s.p, '123456'); await s.p.waitForTimeout(8000);
  await s.p.waitForTimeout(3000);
  const t = await s.p.evaluate(() => document.body.innerText);
  if (process.env.DUMP) console.log(t.slice(0, 1500));
  V('charge 7 j = 60×7 + 30×4 = 540 UA', /540 UA/.test(t), t.slice(0, 500));
  V('bien-être = 4/5 (dernier wellness)', /4\/5/.test(t));
  V('1 séance non faite sur 7 jours', /1\s*\n?\s*NON FAITES/i.test(t));
  V('plus de « 0 % » de charge', !/0%\s*\n?\s*CHARGE/i.test(t));
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
