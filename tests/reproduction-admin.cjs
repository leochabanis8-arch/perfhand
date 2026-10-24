// Reproduction : l'admin se connecte sur un réseau lent (latence réelle) — ses données arrivent-elles ?
const { open, loginEmail, body } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const latence = Number(process.argv[3] || 300);
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  const r = await (await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) })).json();
  const p2 = await (await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'proprio@prepa.fr', password: 'proprio1', returnSecureToken: true }) })).json();
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'Union Sud Mayenne', division: 'Nationale 1', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } },
              { id: 'club2', name: 'Club Deux Prénational', division: 'Prénationale', coach: { email: 'coach2@club.fr', name: 'Coach 2' } }],
      playersPerso: { 'perso-1': { id: 'perso-1', name: 'Plante Cuc', email: 'plante@test.fr' } },
    },
    tenants: { tenant_abc: { id: 'tenant_abc', uid: p2.localId, nom: 'Prépa Externe', playersPerso: {} } },
  }) });
  const s = await open(file, { wait: 0 });
  const cdp = await s.p.context().newCDPSession(s.p);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: latence, downloadThroughput: -1, uploadThroughput: -1 });
  await s.p.waitForTimeout(3000);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.waitForTimeout(4000);
  const t1 = await body(s.p);
  console.log(`Latence ${latence} ms — super admin : tenant « Prépa Externe » visible :`, /Prépa Externe/.test(t1));
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('🏐 Clubs & Effectifs').first().click(); await s.p.waitForTimeout(1500);
  const t2 = await body(s.p);
  console.log('  clubs : Club Deux visible :', /Club Deux/.test(t2));
  await s.p.getByText('👤 Profils individuels').first().click(); await s.p.waitForTimeout(1500);
  console.log('  profils perso : Plante Cuc visible :', /Plante Cuc/.test(await body(s.p)));
  // Rechargement avec session déjà ouverte (cas réel après publication des règles)
  await s.p.reload(); await s.p.waitForTimeout(5000);
  console.log('  après rechargement — tenant visible :', /Prépa Externe/.test(await body(s.p)));
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('🏐 Clubs & Effectifs').first().click(); await s.p.waitForTimeout(1500);
  console.log('  après rechargement — Club Deux visible :', /Club Deux/.test(await body(s.p)));
  await s.p.getByText('👤 Profils individuels').first().click(); await s.p.waitForTimeout(1500);
  console.log('  après rechargement — Plante Cuc visible :', /Plante Cuc/.test(await body(s.p)));
  console.log('  refus Firebase :', s.denied.length, s.denied.slice(-3).map(d => d.slice(26, 110)));
  await s.b.close(); process.exit(0);
})();
