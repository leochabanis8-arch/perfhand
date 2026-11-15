// Profil individuel (rattaché à un club) : validation de séances muscu + endurance depuis l'écran.
// Les validations doivent être enregistrées, et une validation déjà présente ne doit pas disparaître.
// Usage : node validation-perso.cjs [fichier html]
const { open, loginEmail, body } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const jour = n => { const d = new Date(Date.now() - n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const get = async p => (await fetch(`${DB}/${p}.json?ns=${NS}`, { headers: { Authorization: 'Bearer owner' } })).json();
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
        muscuSeances: [
          { id: 'mA', nom: 'Muscu lundi', datePrevu: jour(2), dateFaite: jour(2), rpeReel: 7, exercices: [] },
          { id: 'mB', nom: 'Muscu du jour', datePrevu: jour(0), exercices: [] }],
        enduranceSeances: [{ id: 'eA', nom: 'Footing du jour', datePrevu: jour(0), duree: 30, type: 'continu_ext' }] } },
    },
    acces: { joueurs: { 'samir@test,fr': { type: 'perso', id: 'perso-samir' } } } }) });
  const s = await open(file);
  await s.p.setViewportSize({ width: 430, height: 900 });
  await loginEmail(s.p, 'samir@test.fr', 'samir123');
  const valider = async () => {
    await s.p.getByText('✅ Séance terminée').first().click(); await s.p.waitForTimeout(800);
    await s.p.locator('button', { hasText: /^7$/ }).last().click(); await s.p.waitForTimeout(300);
    await s.p.getByText('✅ Valider la séance').first().click(); await s.p.waitForTimeout(3000);
    // Profil individuel : un second bilan s'ouvre après la séance — on le remplit aussi
    for (let i = 0; i < 2 && await s.p.getByText(/Valider la séance|Envoyer au coach/).count(); i++) {
      await s.p.locator('button', { hasText: /^7$/ }).last().click().catch(() => {}); await s.p.waitForTimeout(300);
      await s.p.getByText(/Valider la séance|Envoyer au coach/).first().click(); await s.p.waitForTimeout(3000);
    }
  };
  // Muscu
  await s.p.getByText('Muscu', { exact: true }).first().click(); await s.p.waitForTimeout(1500);
  await valider();
  let m = await get('perfhand/playersPerso/perso-samir/muscuSeances');
  m = Array.isArray(m) ? m : Object.values(m || {});
  V('muscu : la séance du jour est validée dans la base', !!(m.find(x => x.id === 'mB') || {}).dateFaite);
  V('muscu : la séance de lundi est toujours validée', (m.find(x => x.id === 'mA') || {}).dateFaite === jour(2));
  // Endurance
  await s.p.getByText('Endurance', { exact: true }).first().click(); await s.p.waitForTimeout(1500);
  await valider();
  let e = await get('perfhand/playersPerso/perso-samir/enduranceSeances');
  e = Array.isArray(e) ? e : Object.values(e || {});
  V('endurance : la séance du jour est validée dans la base (profil individuel rattaché à un club)', !!(e.find(x => x.id === 'eA') || {}).dateFaite, s.dialogs.join(' | ').slice(0, 120));
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
