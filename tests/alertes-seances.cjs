// Alertes Telegram « séance non validée » : aucune alerte pour une séance validée, même si la copie
// locale de l'appareil est en retard. Usage : node alertes-seances.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const jour = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hier = jour(new Date(Date.now() - 86400000));
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  const seancesServeur = [{ id: 's1', nom: 'Squat', datePrevu: hier, dateFaite: hier }];
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: { 'perso-1': { id: 'perso-1', name: 'Paul Perso', email: 'paul@test.fr',
        muscuSeances: seancesServeur, enduranceSeances: [{ id: 'e1', nom: 'Footing', datePrevu: hier }] } },
    },
    tg_notifications_sent: { init: hier },
  }) });
  // Copie locale ancienne sur l'appareil du coach : « Squat » pas encore validée
  const copieLocale = { playersPerso: [{ id: 'perso-1', name: 'Paul Perso', email: 'paul@test.fr',
    muscuSeances: [{ id: 's1', nom: 'Squat', datePrevu: hier }], enduranceSeances: [{ id: 'e1', nom: 'Footing', datePrevu: hier }] }] };
  const s = await open(file, { localStorage: { perfhand_db_v3: JSON.stringify(copieLocale) }, wait: 0 });
  await s.p.addInitScript(() => {
    window.__alertes = [];
    const f = window.fetch;
    window.fetch = (u, o) => String(u).includes('/.netlify/functions/telegram')
      ? (window.__alertes.push(JSON.parse(o.body).text), Promise.resolve(new Response('ok')))
      : f(u, o);
  });
  await s.p.reload(); await s.p.waitForTimeout(2500);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.waitForTimeout(8000);
  const alertes = await s.p.evaluate(() => window.__alertes);
  const squat = alertes.some(a => /Squat/.test(a)), footing = alertes.some(a => /Footing/.test(a));
  console.log(`  ${squat ? '❌' : '✅'} séance VALIDÉE (Squat) : ${squat ? 'alerte envoyée à tort' : 'pas d\'alerte'}`);
  console.log(`  ${footing ? '✅' : '❌'} séance NON faite (Footing) : ${footing ? 'alerte envoyée' : 'aucune alerte (anormal)'}`);
  await s.b.close(); process.exit(squat || !footing ? 1 : 0);
})();
