// Navigation rapide entre fiches joueurs : ← / → et recherche, en gardant l'onglet ouvert.
// Usage : node nav-joueurs.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const SC = process.env.CAPTURE || '';
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
const inscrire = async (email, pw) => (await (await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: pw, returnSecureToken: true }) })).json()).localId;
const texte = p => p.evaluate(() => document.body.innerText);
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await inscrire('leo.chabanis@gmail.com', 'adminpass');
  const uidY = await inscrire('yolene@test.fr', 'yolene123');
  const seance = nom => [{ id: nom, nom, datePrevu: '2026-11-20', exercices: [] }];
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: [{ id: 'p1', clubId: 'usm', name: 'Alice Club', status: 'ok', muscuSeances: seance('Seance Alice') },
                       { id: 'p2', clubId: 'usm', name: 'Bruno Club', status: 'ok', muscuSeances: seance('Seance Bruno') }],
      playersPerso: { 'perso-s': { id: 'perso-s', name: 'Samir Perso', email: 's@test.fr', status: 'ok', muscuSeances: seance('Seance Samir') },
                      'perso-z': { id: 'perso-z', name: 'Zoé Perso', email: 'z@test.fr', status: 'ok', muscuSeances: seance('Seance Zoe') } },
    },
    tenants: { ty: { id: 'ty', nom: 'Espace Yolène', ownerUid: uidY, playersPerso: {
      tp1: { id: 'tp1', name: 'Tina Tenant', email: 't@test.fr', muscuSeances: seance('Seance Tina') },
      tp2: { id: 'tp2', name: 'Ugo Tenant', email: 'u@test.fr', muscuSeances: seance('Seance Ugo') } } } },
    tenants_by_uid: { [uidY]: 'ty' } }) });

  let s = await open(file);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('Clubs & Effectifs').first().click(); await s.p.waitForTimeout(1200);
  if (SC) await s.p.screenshot({ path: SC + '.0.png' });
  await s.p.getByText('2 joueurs').first().click(); await s.p.waitForTimeout(1200);
  await s.p.getByText('Alice Club').first().click(); await s.p.waitForTimeout(1500);
  await s.p.getByText('Musculation', { exact: true }).first().click(); await s.p.waitForTimeout(1500);
  V('admin : fiche Alice, onglet Muscu', (await texte(s.p)).includes('Seance Alice'));
  await s.p.getByRole('button', { name: /Bruno Club →/ }).click(); await s.p.waitForTimeout(1500);
  let t = await texte(s.p);
  V('admin : « suivant » ouvre Bruno, toujours sur Muscu', t.includes('Seance Bruno') && !t.includes('Seance Alice'));
  if (SC) await s.p.screenshot({ path: SC });
  await s.p.fill('input[placeholder="🔍 Aller à un joueur…"]', 'samir'); await s.p.waitForTimeout(300);
  await s.p.keyboard.press('Enter'); await s.p.waitForTimeout(1500);
  await s.p.getByText('Muscu', { exact: true }).first().click().catch(() => {}); await s.p.waitForTimeout(1500);
  V('admin : recherche « samir » ouvre la fiche du profil individuel', (await texte(s.p)).includes('Seance Samir'));
  await s.p.getByRole('button', { name: /Zoé Perso →/ }).click(); await s.p.waitForTimeout(1500);
  t = await texte(s.p);
  V('admin : profils individuels, « suivant » garde l\'onglet', t.includes('Seance Zoe') && !t.includes('Seance Samir'));
  V('admin : aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close();

  s = await open(file);
  await loginEmail(s.p, 'yolene@test.fr', 'yolene123'); await s.p.waitForTimeout(2000);
  await s.p.getByText('Joueurs perso').first().click(); await s.p.waitForTimeout(1000);
  await s.p.getByText('Tina Tenant').first().click(); await s.p.waitForTimeout(1500);
  V('tenant : fiche Tina', (await texte(s.p)).includes('Seance Tina'));
  await s.p.getByRole('button', { name: /Ugo Tenant →/ }).click(); await s.p.waitForTimeout(1500);
  t = await texte(s.p);
  V('tenant : « suivant » ouvre Ugo', t.includes('Seance Ugo') && !t.includes('Seance Tina'));
  V('tenant : aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
