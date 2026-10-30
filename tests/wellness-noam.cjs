// Reproduction du bug « le wellness est redemandé après validation » (joueur connecté par code).
// Usage : node wellness-noam.cjs <fichier html> <fichier règles>
const { open, loginCode, body } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000';
const file = path.resolve(process.argv[2]), rules = path.resolve(process.argv[3]);
const get = async p => (await fetch(`${DB}/${p}.json?ns=${NS}`, { headers: { Authorization: 'Bearer owner' } })).json();
const today = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const popupVisible = async p => /bien-être du matin|Envoyer au coach/i.test(await body(p));
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(rules, 'utf8') });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: { 'p-zorcer': { id: 'p-zorcer', clubId: 'usm', name: 'Noam Zorzer Pepi', email: 'noam@player.fr', pos: 'Ailier', num: 22, age: 19, poids: 70, taille: 174, status: 'ok' } },
      codes: { '777777': { playerId: 'p-zorcer', playerName: 'Noam Zorzer Pepi', clubId: 'usm' } },
    } }) });
  // 1) Première ouverture : connexion par code, le questionnaire du matin s'ouvre, Noam le valide
  const A = await open(file);
  await loginCode(A.p, '777777'); await A.p.waitForTimeout(2500);
  const ouvert1 = await popupVisible(A.p);
  if (ouvert1) { await A.p.getByText(/Envoyer mon bien-être du matin|Envoyer au coach/).first().click(); await A.p.waitForTimeout(2500); }
  const enBase = await get('perfhand/playerProfiles/p-zorcer/wellnessCheckins/' + today);
  console.log(`  1. 1re ouverture : questionnaire proposé=${ouvert1} | enregistré en base=${!!enBase}` + (A.dialogs.length ? ' | message: ' + A.dialogs.join(' / ').slice(0, 110) : ''));
  // 2) Il rouvre l'appli sur le même téléphone
  await A.p.reload(); await A.p.waitForTimeout(6000);
  console.log(`  2. Réouverture même téléphone : questionnaire redemandé=${await popupVisible(A.p)}`);
  await A.b.close();
  // 3) Il rouvre depuis un navigateur « neuf » (lien WhatsApp/Instagram, stockage effacé) et retape son code
  const B = await open(file);
  await loginCode(B.p, '777777'); await B.p.waitForTimeout(4000);
  console.log(`  3. Navigateur neuf : questionnaire redemandé=${await popupVisible(B.p)}`);
  await B.b.close(); process.exit(0);
})();
