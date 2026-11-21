// Stats de match : un joueur archivé (ou sorti de l'effectif) qui a des stats dans un match doit
// rester visible dans le détail du match et dans les exports (modification de Léo v1789812000).
// Usage : node stats-match-archives.cjs [fichier html]
const { open, loginEmail } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: { p1: { id: 'p1', clubId: 'usm', name: 'Alice Actuelle', pos: 'Ailier', status: 'ok' },
                        p2: { id: 'p2', clubId: 'usm', name: 'Bruno Archive', pos: 'Pivot', status: 'ok', archived: true } },
      matchStats: { usm: [{ id: 'm1', adversaire: 'Laval', lieu: 'domicile', date: '2026-11-15', scoreNous: 30, scoreEux: 28,
        stats: { attaque: { p1: { Buts: 5, Tirs: 7 }, p2: { Buts: 4, Tirs: 6 } }, defense: {}, gardien: {} } }] },
    } }) });
  const s = await open(file);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('Clubs & Effectifs').first().click(); await s.p.waitForTimeout(1200);
  await s.p.getByText(/1 joueur/).first().click(); await s.p.waitForTimeout(1200);
  await s.p.getByText('📊 Stats matchs').first().click(); await s.p.waitForTimeout(1200);
  await s.p.getByText('Laval').first().click(); await s.p.waitForTimeout(1500);
  const t = await s.p.evaluate(() => document.body.innerText);
  V('détail du match : le joueur actuel est affiché', t.includes('Alice Actuelle'));
  V('détail du match : le joueur archivé (4 buts) est toujours affiché', t.includes('Bruno Archive'), t.slice(0, 300));
  V('aucune erreur JavaScript', !s.errs.length, JSON.stringify(s.errs).slice(0, 200));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
