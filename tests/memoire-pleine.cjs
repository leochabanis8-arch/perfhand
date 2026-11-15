// Mémoire locale du navigateur pleine (cas réel du 15/11) : Firebase ne pouvait plus se connecter et
// l'appli affichait une vieille copie (séance validée vue « NON FAITE »). Elle doit rester connectée.
// Usage : node memoire-pleine.cjs [fichier html]
const { open, loginEmail, body } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const jour = n => { const d = new Date(Date.now() - n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
let ko = 0; const V = (l, ok, x = '') => { if (!ok) ko++; console.log(`  ${ok ? '✅' : '❌'} ${l}${ok ? '' : '  ' + x}`); };
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  const seance = { id: 'm3nov', nom: 'HB Puissance — Contraste', datePrevu: jour(12), exercices: [] };
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: { clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playersPerso: { 'perso-s': { id: 'perso-s', name: 'Samir Test', email: 'samir@test.fr', status: 'ok', muscuSeances: [{ ...seance, dateFaite: jour(12), rpeReel: 4 }] } } } }) });
  const s = await open(file, { wait: 0 });
  await s.p.addInitScript(([seance]) => {
    if (sessionStorage.getItem('rempli')) return;
    sessionStorage.setItem('rempli', '1');
    // Vieille copie de la base (Samir pas validé) + anciennes copies jusqu'à saturer la mémoire
    const vieille = { playersPerso: [{ id: 'perso-s', name: 'Samir Test', email: 'samir@test.fr', status: 'ok', muscuSeances: [seance] }], bourrage: 'x'.repeat(3200000) };
    try { localStorage.setItem('perfhand_db_v3', JSON.stringify(vieille)); } catch (e) {}
    const bloc = 'y'.repeat(250000); let i = 0;
    try { for (;;) { localStorage.setItem('perfhand_db_v2', (localStorage.getItem('perfhand_db_v2') || '') + bloc); if (++i > 200) break; } } catch (e) {}
    try { for (;;) { localStorage.setItem('perfhand_db_v1', (localStorage.getItem('perfhand_db_v1') || '') + 'z'.repeat(20000)); if (++i > 600) break; } } catch (e) {}
  }, [seance]);
  await s.p.reload(); await s.p.waitForTimeout(3000);
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2500);
  await s.p.getByText('👤 Profils individuels').first().click(); await s.p.waitForTimeout(1500);
  const samir = s.p.getByText('Samir Test').first();
  if (await samir.count()) { await samir.click(); await s.p.waitForTimeout(1500); await s.p.getByText('Muscu', { exact: true }).first().click(); await s.p.waitForTimeout(2500); }
  const memoire = await s.p.evaluate(() => {
    let libre = true; try { localStorage.setItem('__essai', 'w'.repeat(500000)); localStorage.removeItem('__essai'); } catch (e) { libre = false; }
    return { v1: localStorage.getItem('perfhand_db_v1') !== null, v2: localStorage.getItem('perfhand_db_v2') !== null, v3: (localStorage.getItem('perfhand_db_v3') || '').length, libre };
  });
  V('les anciennes copies (v1, v2) ont été supprimées', !memoire.v1 && !memoire.v2, JSON.stringify(memoire));
  V('la mémoire locale a de la place pour Firebase (≥ 500 000 caractères libres)', memoire.libre, JSON.stringify(memoire));
  V('la copie locale reste sous 3 millions de caractères', memoire.v3 <= 3000000, JSON.stringify(memoire));
  const t = await body(s.p);
  const quota = s.errs.filter(e => /quota/i.test(e)).length;
  V('pas d\'erreur « quota exceeded » bloquant Firebase', quota === 0, quota + ' erreur(s) quota');
  V('la séance validée de Samir s\'affiche « FAITE » (données du serveur)', /✓ FAITE/.test(t) && !/NON FAITE/.test(t), (t.match(/NON FAITE|✓ FAITE/g) || ['(rien)']).join(','));
  V('pas de bandeau « Pas de connexion à la base »', !/Pas de connexion à la base/.test(t));
  await s.b.close(); process.exit(ko ? 1 : 0);
})();
