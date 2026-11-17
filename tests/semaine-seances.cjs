// Vue « Séances semaine » : admin (clubs + profils individuels + tenants) et admin de tenant.
// Usage : node semaine-seances.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const jour = n => { const d = new Date(Date.now() + n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
const inscrire = async (email, pw) => (await (await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: pw, returnSecureToken: true }) })).json()).localId;
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await inscrire('leo.chabanis@gmail.com', 'adminpass');
  const uidY = await inscrire('yolene@test.fr', 'yolene123');
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: [{ id: 'p1', clubId: 'usm', name: 'Alice Club', status: 'ok',
        muscuSeances: [{ id: 'a1', nom: 'Force haut', datePrevu: jour(0), exercices: [{ nom: 'Squat', series: 4, reps: '5', charge: '80%' }] },
                       { id: 'a2', nom: 'Hors semaine', datePrevu: jour(30), exercices: [] }] },
        { id: 'p2', clubId: 'usm', name: 'Bruno Club', status: 'ok' }],
      playersPerso: { 'perso-s': { id: 'perso-s', clubId: 'usm', name: 'Samir Perso', email: 's@test.fr', status: 'ok',
        enduranceSeances: [{ id: 'e1', nom: 'Footing 30', datePrevu: jour(0), duree: 30, dateFaite: jour(0), rpeReel: 5 }] } },
    },
    tenants: { ty: { id: 'ty', nom: 'Espace Yolène', ownerUid: uidY, playersPerso: { tp1: { id: 'tp1', name: 'Tina Tenant', email: 't@test.fr',
      muscuSeances: [{ id: 't1', nom: 'Gainage tenant', datePrevu: jour(0), exercices: [] }] } } } },
    tenants_by_uid: { [uidY]: 'ty' } }) });

  // 1) Super admin
  let s = await open(file);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('📅 Séances semaine').first().click(); await s.p.waitForTimeout(2500);
  let t = await s.p.evaluate(() => document.body.innerText);
  V('admin : séance muscu du club visible', t.includes('Alice Club') && t.includes('Force haut'));
  V('admin : joueur sans séance signalé', /Sans séance cette semaine : .*Bruno Club/.test(t));
  V('admin : profil individuel + séance faite visibles', t.includes('Samir Perso') && t.includes('✓ 🏃'));
  V('admin : joueurs des tenants visibles', t.includes('Espace Yolène') && t.includes('Gainage tenant'));
  V('admin : séance hors semaine non affichée', !t.includes('Hors semaine'));
  await s.p.screenshot({ path: '/tmp/claude-0/-home-user-perfhand/a4276d99-69dd-5b3a-9e8f-7581e205a645/scratchpad/semaine.png' });
  await s.p.getByText('Force haut').first().click(); await s.p.waitForTimeout(500);
  t = await s.p.evaluate(() => document.body.innerText);
  V('admin : clic sur une séance → contenu (exercices)', t.includes('Squat') && t.includes('4 × 5'));
  V('admin : aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close();

  // 2) Admin de tenant (Yolène)
  s = await open(file);
  await loginEmail(s.p, 'yolene@test.fr', 'yolene123'); await s.p.waitForTimeout(2000);
  await s.p.getByText('Séances semaine').first().click(); await s.p.waitForTimeout(1500);
  t = await s.p.evaluate(() => document.body.innerText);
  V('tenant : ses joueurs et leurs séances visibles', t.includes('Tina Tenant') && t.includes('Gainage tenant'));
  V('tenant : ne voit pas les joueurs de Léo', !t.includes('Alice Club') && !t.includes('Samir Perso'));
  V('tenant : aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
