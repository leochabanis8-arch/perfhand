// Cas réel « Samir » : profil individuel dont l'email figure aussi sur une fiche club. Ses validations
// étaient refusées par la base et restaient sur son téléphone. La nouvelle version doit les récupérer.
// Usage : node recuperation-validation.cjs [html] [règles] [ancien-index]
const { open, loginEmail, body } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const rules = path.resolve(process.argv[3] || path.join(__dirname, '../database.rules.json'));
const ancienIndex = process.argv[4] === 'ancien-index';
const jour = n => { const d = new Date(Date.now() - n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const get = async p => (await fetch(`${DB}/${p}.json?ns=${NS}`, { headers: { Authorization: 'Bearer owner' } })).json();
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(rules, 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'samir@test.fr', password: 'samir123', returnSecureToken: true }) });
  const seance3nov = { id: 'm13', nom: 'HB Puissance — Contraste lourd/léger (jambes)', datePrevu: jour(12), rpeCible: 8, exercices: [] };
  const acces = { joueurs: { 'samir@test,fr': { type: 'club', id: 'p-samir' } } }; // l'email est aussi sur une fiche club
  if (!ancienIndex) acces.joueursPerso = { 'samir@test,fr': 'perso-samir' };       // index reconstruit par la nouvelle version
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: { 'p-samir': { id: 'p-samir', clubId: 'usm', name: 'Samir (club)', email: 'samir@test.fr', status: 'ok' } },
      playersPerso: { 'perso-samir': { id: 'perso-samir', name: 'Samir Test', email: 'samir@test.fr', status: 'ok',
        wellnessCheckins: { [jour(0)]: { dateRessenti: jour(0), douleurs: 4, energie: 4, sommeil: 4, humeur: 4, stress: 4 } },
        muscuSeances: [seance3nov, { id: 'm14', nom: 'Séance du jour', datePrevu: jour(0), exercices: [] }] } },
    }, acces }) });
  // Téléphone de Samir : sa copie locale montre la séance du 3 novembre comme faite (RPE 8)
  const copie = { playersPerso: [{ id: 'perso-samir', name: 'Samir Test', email: 'samir@test.fr', status: 'ok',
    muscuSeances: [{ ...seance3nov, dateFaite: jour(12), rpeReel: 8, fatigue: 4 }, { id: 'm14', nom: 'Séance du jour', datePrevu: jour(0), exercices: [] }] }] };
  const s = await open(file, { localStorage: { perfhand_db_v3: JSON.stringify(copie) } });
  await s.p.setViewportSize({ width: 430, height: 900 });
  await loginEmail(s.p, 'samir@test.fr', 'samir123');
  await s.p.waitForTimeout(5000);
  let m = await get('perfhand/playersPerso/perso-samir/muscuSeances'); m = Array.isArray(m) ? m : Object.values(m || {});
  const s13 = m.find(x => x.id === 'm13') || {};
  V('la validation du 3 novembre restée sur le téléphone est maintenant dans la base', s13.dateFaite === jour(12) && s13.rpeReel === 8, JSON.stringify(s13).slice(0, 120));
  // Il valide sa séance du jour : elle doit arriver dans la base
  await s.p.getByText('Muscu', { exact: true }).first().click(); await s.p.waitForTimeout(1500);
  await s.p.getByText('✅ Séance terminée').first().click(); await s.p.waitForTimeout(800);
  await s.p.locator('button', { hasText: /^7$/ }).last().click(); await s.p.waitForTimeout(300);
  await s.p.getByText('✅ Valider la séance').first().click(); await s.p.waitForTimeout(3000);
  m = await get('perfhand/playersPerso/perso-samir/muscuSeances'); m = Array.isArray(m) ? m : Object.values(m || {});
  V('la séance validée aujourd\'hui arrive dans la base', !!(m.find(x => x.id === 'm14') || {}).dateFaite, s.dialogs.join(' | ').slice(0, 140));
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
