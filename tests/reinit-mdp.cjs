// Réinitialisation du mot de passe : un joueur SANS compte de connexion (créé à l'époque où le mot de
// passe était stocké dans la base) doit quand même recevoir le lien → le compte est créé puis le lien
// envoyé. Le joueur peut aussi le demander lui-même depuis l'écran de connexion.
// Usage : node reinit-mdp.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AUE = 'http://127.0.0.1:9099', AU = AUE + '/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
const liens = async () => ((await (await fetch(`${AUE}/emulator/v1/projects/demo-perfhand/oobCodes`)).json()).oobCodes || []).filter(c => c.requestType === 'PASSWORD_RESET');
(async () => {
  await fetch(`${AUE}/emulator/v1/projects/demo-perfhand/accounts`, { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'avec@test.fr', password: 'ancien123', returnSecureToken: true }) });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: {
        'perso-sans': { id: 'perso-sans', clubId: 'usm', name: 'Sans Compte', email: ' Sans@Test.fr ', status: 'ok' },
        'perso-avec': { id: 'perso-avec', clubId: 'usm', name: 'Avec Compte', email: 'avec@test.fr', status: 'ok' } },
    } }) });
  let s = await open(file);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('👤 Profils individuels').first().click(); await s.p.waitForTimeout(1500);
  const carte = nom => s.p.locator('div', { hasText: nom }).filter({ has: s.p.getByRole('button', { name: '🔑 Mot de passe' }) }).last();
  await carte('Sans Compte').getByRole('button', { name: '🔑 Mot de passe' }).click(); await s.p.waitForTimeout(3000);
  let l = await liens();
  V('joueur sans compte : lien envoyé (email nettoyé : sans@test.fr)', l.some(c => c.email === 'sans@test.fr'), JSON.stringify(l) + ' | ' + s.dialogs.join(' / ').slice(0, 300));
  V('message : compte créé + penser aux spams', s.dialogs.some(d => /vient d'être créé/.test(d) && /SPAMS/.test(d)), s.dialogs.join(' / ').slice(0, 300));
  await carte('Avec Compte').getByRole('button', { name: '🔑 Mot de passe' }).click(); await s.p.waitForTimeout(3000);
  l = await liens();
  V('joueur avec compte : lien envoyé', l.some(c => c.email === 'avec@test.fr'));
  const ancien = await (await fetch(`${AU}/accounts:signInWithPassword?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'avec@test.fr', password: 'ancien123', returnSecureToken: true }) })).json();
  V('joueur avec compte : son ancien mot de passe marche toujours (rien écrasé)', !!ancien.idToken);
  V('admin : aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close();

  // Le lien fonctionne : le joueur choisit son mot de passe puis se connecte
  const code = (await liens()).filter(c => c.email === 'sans@test.fr').pop().oobCode;
  await fetch(`${AU}/accounts:resetPassword?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ oobCode: code, newPassword: 'nouveau123' }) });
  await fetch(`${DB}/acces/joueurs.json?ns=${NS}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({ 'sans@test,fr': { type: 'perso', id: 'perso-sans' } }) });
  s = await open(file);
  await loginEmail(s.p, 'sans@test.fr', 'nouveau123'); await s.p.waitForTimeout(2000);
  V('le joueur se connecte avec le mot de passe choisi via le lien', (await s.p.evaluate(() => document.body.innerText)).includes('Sans Compte'));
  await s.b.close();

  // « Mot de passe oublié ? » sur l'écran de connexion
  s = await open(file);
  const avant = (await liens()).length;
  await s.p.fill('input[placeholder="votre@email.fr"]', 'avec@test.fr');
  await s.p.getByText('Mot de passe oublié ?').click(); await s.p.waitForTimeout(2500);
  V('« Mot de passe oublié ? » envoie le lien', (await liens()).length === avant + 1);
  V('message de confirmation affiché', (await s.p.evaluate(() => document.body.innerText)).includes('Regarde aussi dans tes SPAMS'));
  V('écran de connexion : aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
