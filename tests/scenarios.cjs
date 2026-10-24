// Scénario complet : l'appli réelle + vrai SDK + émulateur, avec un fichier de règles donné.
// Scénarios de bout en bout : la vraie appli + vrai SDK Firebase + émulateur local.
// Usage : node scenarios.cjs [fichier html] [fichier règles]
const { open, loginEmail, loginCode, body } = require('./navigateur.cjs');
const path = require('path');
const fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const rules = path.resolve(process.argv[3] || path.join(__dirname, '../database.rules.json'));
let echecs = 0;
const j = (u, o) => fetch(u, o).then(r => r.json());
const compte = async (email, password) => (await j(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) })).localId;
const get = async p => j(`${DB}/${p}.json?ns=${NS}`, { headers: { Authorization: 'Bearer owner' } });
const R = (l, ok, extra = '') => (ok || echecs++, console.log((ok ? '  ✅ ' : '  ❌ ') + l + (extra ? '  ' + extra : '')));

(async () => {
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts`, { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(rules, 'utf8') });
  await compte('leo.chabanis@gmail.com', 'adminpass'); await compte('paul@test.fr', 'secret1'); await compte('kine@test.fr', 'secret3');
  const uidProprio = await compte('proprio@prepa.fr', 'proprio1'); await compte('maxence@player.fr', 'maxpass1');
  const DATA = {
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { id: 'coach-usm', name: 'Leo', email: 'leo.chabanis@gmail.com' } }],
      playerProfiles: { 'p-rizzi': { id: 'p-rizzi', clubId: 'usm', name: 'Maxence Rizzi', email: 'maxence@player.fr', pos: 'Gardien', num: 1, age: 30, poids: 82, taille: 185, status: 'ok' } },
      playersPerso: { 'perso-1': { id: 'perso-1', name: 'Paul Perso', email: 'paul@test.fr', sport: 'Handball', age: 25, poids: 80, taille: 180, status: 'ok' } },
      staffAccounts: [{ id: 'staff1', name: 'Kiné Test', email: 'kine@test.fr', roleId: 'kine', clubId: 'usm' }],
      codes: { '123456': { playerId: 'p-rizzi', playerName: 'Maxence Rizzi', clubId: 'usm' } },
    },
    tenants: { tenant_abc: { id: 'tenant_abc', uid: uidProprio, email: 'proprio@prepa.fr', nom: 'Prépa X', actif: true,
      playersPerso: { tp1: { id: 'tp1', name: 'Tina Tenant', email: 'tina@test.fr' } }, codes: { '654321': { playerId: 'tp1', playerName: 'Tina Tenant' } } } },
    tenants_by_uid: { [uidProprio]: 'tenant_abc' },
    tenantCodes: { '654321': 'tenant_abc' },
  };
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(DATA) });

  const run = async (label, fn) => {
    const s = await open(file);
    try { await fn(s); } catch (e) { R(label + ' (exception test)', false, e.message.split('\n')[0]); }
    if (s.errs.length) console.log('     erreurs JS:', s.errs.slice(0, 2));
    if (s.denied.length) console.log('     refus Firebase:', s.denied.length, '→', s.denied[0]);
    await s.b.close();
  };
  await run('admin', async ({ p }) => {
    await loginEmail(p, 'leo.chabanis@gmail.com', 'adminpass');
    let t = await body(p); R('Admin : écran super admin + tenant listé', /SUPER ADMIN/.test(t) && /Prépa X/.test(t));
    await p.getByText('Mon espace').click(); await p.waitForTimeout(1500);
    await p.getByText('👤 Profils individuels').first().click(); await p.waitForTimeout(800);
    R('Admin : joueur perso Paul visible', /Paul Perso/.test(await body(p)));
    await p.getByText('🏐 Clubs & Effectifs').first().click(); await p.waitForTimeout(800);
    R('Admin : club USM avec 1 joueur', /1 joueurs/.test(await body(p)));
    await p.getByText('1 joueurs').first().click(); await p.waitForTimeout(800);
    await p.locator('button[title="Générer un code d\'accès pour ce joueur"]').first().click(); await p.waitForTimeout(1200);
    const codes = await get('perfhand/codes'); R('Admin : génère un code joueur', Object.keys(codes || {}).length === 2);
    await p.waitForTimeout(2000);
    const acces = await get('acces');
    R('Admin : index d\'accès construit', !!(acces && acces.equipe && acces.joueurs), JSON.stringify(acces || {}).slice(0, 160));
  });
  await run('perso', async ({ p }) => { await loginEmail(p, 'paul@test.fr', 'secret1'); R('Joueur perso Paul : son espace', /Paul Perso/.test(await body(p)) && /Muscu/.test(await body(p))); });
  await run('staff', async ({ p }) => { await loginEmail(p, 'kine@test.fr', 'secret3'); R('Staff kiné : espace staff', /Espace Staff/.test(await body(p))); });
  await run('code club', async ({ p }) => { await loginCode(p, '123456'); R('Code club 123456 : espace Maxence', /Maxence Rizzi/.test(await body(p)) && /SEANCES/.test(await body(p))); });
  await run('code tenant', async ({ p }) => { await loginCode(p, '654321'); R('Code tenant 654321 : espace Tina', /Tina/.test(await body(p)) && !/Code introuvable/.test(await body(p))); });
  await run('mauvais code', async ({ p }) => { await loginCode(p, '000000'); R('Mauvais code refusé proprement', /introuvable/i.test(await body(p))); });
  await run('tenant admin', async ({ p }) => {
    await loginEmail(p, 'proprio@prepa.fr', 'proprio1');
    R('Préparateur (tenant) : son espace', /Prépa X|Joueurs perso/.test(await body(p)));
    await p.getByText('Joueurs perso').first().click(); await p.waitForTimeout(600);
    R('Préparateur : voit Tina', /Tina Tenant/.test(await body(p)));
    await p.getByText('Tina Tenant').first().click(); await p.waitForTimeout(600);
    const before = Object.keys((await get('tenants/tenant_abc/codes')) || {}).length;
    const btn = p.getByText('📋 Code accès'); if (await btn.count()) { await btn.first().click(); await p.waitForTimeout(1500); }
    const after = Object.keys((await get('tenants/tenant_abc/codes')) || {}).length;
    const idx = Object.keys((await get('tenantCodes')) || {}).length;
    R('Préparateur : génère un code pour Tina', after === before + 1, `(index tenantCodes : ${idx} entrée(s))`);
  });
  await run('inscription', async ({ p }) => {
    await p.evaluate(() => window.__showRegister && window.__showRegister(true)); await p.waitForTimeout(500);
    const inputs = p.locator('input');
    const n = await inputs.count();
    const vals = { text: ['Nouveau Prépa', 'Ma Structure'], email: ['nouveau@prepa.fr'], password: ['motdepasse1', 'motdepasse1'] };
    const used = { text: 0, email: 0, password: 0 };
    for (let i = 0; i < n; i++) { const t = (await inputs.nth(i).getAttribute('type')) || 'text'; const v = (vals[t] || [])[used[t]++]; if (v) await inputs.nth(i).fill(v); }
    const btn = p.getByRole('button', { name: /créer|inscri/i }).last(); await btn.click(); await p.waitForTimeout(3000);
    const tenants = await get('tenants'); const t = Object.values(tenants || {}).find(x => x.email === 'nouveau@prepa.fr');
    R('Inscription d\'un nouveau préparateur', !!t, t ? '' : '→ ' + (await body(p)).slice(0, 140));
  });
  await run('joueur club email', async ({ p }) => { await loginEmail(p, 'maxence@player.fr', 'maxpass1'); const t = await body(p); R('Joueur club Maxence par email : son espace', /Maxence Rizzi/.test(t) && /SEANCES/.test(t), t.slice(0, 80)); });
  await run('code club écrit', async ({ p }) => {
    await loginCode(p, '123456');
    const ok = await p.evaluate(() => new Promise(res => window.__perfhand_db.ref('perfhand/playerProfiles/p-rizzi').update({ stress: 4 }).then(() => res(true), () => res(false))));
    R('Code club : le joueur enregistre une donnée sur SA fiche', ok && (await get('perfhand/playerProfiles/p-rizzi/stress')) === 4);
    const voisin = await p.evaluate(() => new Promise(res => window.__perfhand_db.ref('perfhand/playerProfiles').once('value').then(() => res('lu'), () => res('refusé'))));
    R('Code club : liste des autres joueurs refusée', voisin === 'refusé');
  });
  {
    const s = await open(file, { localStorage: { perfhand_tenant_session: JSON.stringify({ role: 'usm_code', playerId: 'p-rizzi', name: 'Maxence Rizzi', clubId: 'usm' }) }, wait: 6000 });
    const t = await body(s.p);
    R('Ancienne session code (sans code mémorisé) : on redemande le code', /Connexion/.test(t) && s.dialogs.some(d => /entre à nouveau ton code/.test(d)), s.dialogs.join(' | ').slice(0, 100) + ' / ' + t.slice(0, 60));
    await s.b.close();
  }
  {
    const s = await open(file, { localStorage: { perfhand_tenant_session: JSON.stringify({ role: 'usm_code', playerId: 'p-rizzi', name: 'Maxence Rizzi', clubId: 'usm', code: '123456' }) }, wait: 6000 });
    const t = await body(s.p);
    R('Session code mémorisée : réouverture directe de l\'espace', /Maxence Rizzi/.test(t) && /SEANCES/.test(t), t.slice(0, 80));
    if (s.errs.length) console.log('     erreurs JS:', s.errs.slice(0, 2));
    await s.b.close();
  }
  console.log(echecs ? echecs + ' ÉCHEC(S)' : 'TOUS LES SCÉNARIOS PASSENT');
  process.exit(echecs ? 1 : 0);
})();
