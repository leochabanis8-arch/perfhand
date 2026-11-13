// Suivi en direct d'une séance : le joueur valide une série + ressenti, le coach le voit en direct,
// lui envoie un message, le joueur le reçoit et le marque lu. Usage : node suivi-direct.cjs [html] [dossier captures]
const { open, loginEmail, loginCode, body } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const sortie = process.argv[3] || null;
const d = new Date(), today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: { 'p-rizzi': { id: 'p-rizzi', clubId: 'usm', name: 'Maxence Rizzi', pos: 'Gardien', num: 1, age: 30, poids: 82, taille: 185, status: 'ok',
        wellnessCheckins: { [today]: { dateRessenti: today, douleurs: 4, energie: 4, sommeil: 4, humeur: 4, stress: 4 } },
        muscuSeances: [{ id: 's1', nom: 'Force bas du corps', datePrevu: today, exercices: [
          { nom: 'Squat', series: 4, reps: 8, charge: '60 kg', repos: '1min' },
          { nom: 'Fentes', series: 3, reps: 10, charge: '', repos: '45s' }] }] } },
      codes: { '123456': { playerId: 'p-rizzi', playerName: 'Maxence Rizzi', clubId: 'usm' } },
    } }) });

  // Joueur : séance du jour, valide la série 1 du squat, puis indique « Dur »
  const J = await open(file);
  await J.p.setViewportSize({ width: 430, height: 900 });
  await loginCode(J.p, '123456');
  await J.p.getByText('Muscu', { exact: true }).first().click(); await J.p.waitForTimeout(1500);
  await J.p.locator('button:not([disabled])', { hasText: /^1$/ }).first().click(); await J.p.waitForTimeout(2500);
  V('le joueur voit « Comment s\'est passée cette série ? »', /Comment s'est passée cette série/.test(await body(J.p)));
  await J.p.getByText('😤 Dur').first().click(); await J.p.waitForTimeout(1500);

  // Coach : page Charge équipe
  const C = await open(file);
  await C.p.setViewportSize({ width: 1300, height: 900 });
  await loginEmail(C.p, 'leo.chabanis@gmail.com', 'adminpass');
  await C.p.getByText('Mon espace').click(); await C.p.waitForTimeout(2000);
  await C.p.getByText('📊 Charge équipe').first().click(); await C.p.waitForTimeout(3000);
  let t = await body(C.p);
  V('le coach voit Maxence en séance', /1 joueur en séance/.test(t) && /Maxence Rizzi Force bas du corps/.test(t), t.slice(t.indexOf('Séances en direct'), t.indexOf('Séances en direct') + 200));
  V('… à l\'exercice 1/2 Squat, série 1/4, prévu 4 × 8 · 60 kg', /Exercice 1\/2 · Squat/.test(t) && /Série 1\/4/.test(t) && /60 kg/.test(t));
  V('… avec son ressenti « Dur »', /😤 Dur/.test(t));

  // Le joueur valide la série 2 : le coach le voit sans recharger
  const passer = J.p.getByText('Passer'); if (await passer.count()) await passer.first().click();
  await J.p.locator('button:not([disabled])', { hasText: /^2$/ }).first().click(); await J.p.waitForTimeout(2500);
  t = await body(C.p);
  V('mise à jour en direct chez le coach : série 2/4', /Série 2\/4/.test(t));

  // Message du coach
  await C.p.getByText('Contrôle la descente', { exact: true }).first().click(); await C.p.waitForTimeout(2500);
  t = await body(J.p);
  V('le joueur reçoit le message à l\'écran', /Message du coach/i.test(t) && /Contrôle la descente/.test(t));
  if (sortie) await J.p.screenshot({ path: path.join(sortie, 'suivi-joueur.png') });
  await J.p.getByText('👍 Bien reçu').first().click(); await J.p.waitForTimeout(2500);
  V('le message disparaît chez le joueur après « Bien reçu »', !/Message du coach/i.test(await body(J.p)));
  t = await body(C.p);
  V('le coach voit que le message est lu', /Contrôle la descente » ✓ lu/.test(t));
  if (sortie) { const el = C.p.getByText('🔴 Séances en direct').first(); await el.scrollIntoViewIfNeeded(); await C.p.screenshot({ path: path.join(sortie, 'suivi-coach.png') }); }
  V('aucune erreur JavaScript', !J.errs.length && !C.errs.length, JSON.stringify([...J.errs, ...C.errs]).slice(0, 200));
  await J.b.close(); await C.b.close(); process.exit(ko ? 1 : 0);
})();
