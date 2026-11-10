// Fausse alerte « séance non validée » quand l'appli du coach reste ouverte : la séance du jour est
// validée dans la soirée, la vérification horaire d'après minuit ne doit PAS alerter.
// Usage : node alertes-appli-ouverte.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const jour = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const debut = new Date(); debut.setHours(10, 0, 0, 0);
const aujourdhui = jour(debut);
const ecrire = (p, v) => fetch(`${DB}/${p}.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  await ecrire('', {
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: { 'perso-1': { id: 'perso-1', name: 'Paul Perso', email: 'paul@test.fr', muscuSeances: [{ id: 's3', nom: 'Squat du soir', datePrevu: aujourdhui }] } },
    },
    tg_notifications_sent: { init: aujourdhui },
  });
  const s = await open(file, { wait: 0 });
  await s.p.clock.install({ time: debut });
  await s.p.addInitScript(() => {
    window.__alertes = [];
    const f = window.fetch;
    window.fetch = (u, o) => String(u).includes('/.netlify/functions/telegram')
      ? (window.__alertes.push(JSON.parse(o.body).text), Promise.resolve(new Response('ok')))
      : f(u, o);
  });
  await s.p.reload(); await s.p.waitForTimeout(2500);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.waitForTimeout(6000);
  const avant = (await s.p.evaluate(() => window.__alertes)).length;
  // Le soir, Paul valide sa séance sur son téléphone
  await ecrire('perfhand/playersPerso/perso-1/muscuSeances', [{ id: 's3', nom: 'Squat du soir', datePrevu: aujourdhui, dateFaite: aujourdhui }]);
  await s.p.waitForTimeout(3000);
  // La nuit passe, l'appli du coach est toujours ouverte : la vérification horaire tourne après minuit
  await s.p.clock.fastForward('16:00:00');
  await s.p.waitForTimeout(6000);
  const alertes = await s.p.evaluate(() => window.__alertes);
  const fausse = alertes.some(a => /Squat du soir/.test(a));
  console.log(`  alertes à l'ouverture : ${avant}`);
  console.log(`  ${fausse ? '❌ fausse alerte envoyée pour une séance VALIDÉE' : '✅ aucune alerte pour la séance validée'}`);
  await s.b.close(); process.exit(fausse ? 1 : 0);
})();
