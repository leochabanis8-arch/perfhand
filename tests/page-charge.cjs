// Page « Charge & fatigue équipe » : hiérarchie et statuts sur des données réalistes + capture d'écran.
// Usage : node page-charge.cjs [fichier html] [dossier capture]
const { open, loginEmail, body } = require('./navigateur.cjs');
const path = require('path'), fs = require('fs');
const NS = 'demo-perfhand-default-rtdb', DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const file = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const sortie = process.argv[3] || __dirname;
const jour = n => { const d = new Date(Date.now() - n * 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const seance = (id, n, rpe, duree, fatigue) => ({ id, nom: 'Séance ' + id, datePrevu: jour(n), dateFaite: jour(n), rpeReel: rpe, duree, ...(fatigue != null ? { fatigue } : {}), exercices: [] });
const joueur = (id, name, pos, extra) => ({ id, clubId: 'usm', name, pos, num: 1, age: 22, poids: 75, taille: 180, status: 'ok', ...extra });
(async () => {
  await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-perfhand/accounts', { method: 'DELETE' });
  await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8') });
  await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leo.chabanis@gmail.com', password: 'adminpass', returnSecureToken: true }) });
  const historique = (pic) => [26, 23, 19, 16, 12, 9].map((n, i) => seance('h' + i, n, 6, 60)).concat(pic ? [seance('p1', 5, 8, 90), seance('p2', 3, 8, 90), seance('p3', 1, 8, 90)] : [seance('n1', 4, 6, 60), seance('n2', 1, 6, 60)]);
  const wellness = (vals) => ({ [jour(0)]: { dateRessenti: jour(0), ...vals } });
  await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify({
    perfhand: {
      clubs: [{ id: 'usm', name: 'Union Sud Mayenne (équipe réserve)', division: 'Réserve', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
      playerProfiles: {
        noa: joueur('noa', 'Noa Rousseau', 'Ailier gauche', { muscuSeances: [seance('r1', 9, 7, 45), seance('r2', 2, 7, 45)], wellnessCheckins: wellness({ douleurs: 4, energie: 4, sommeil: 4, humeur: 4, stress: 4 }) }),
        ylann: joueur('ylann', 'Ylann Bamba', 'Gardien', { muscuSeances: historique(true), wellnessCheckins: wellness({ douleurs: 4, energie: 3, sommeil: 4, humeur: 4, stress: 4 }) }),
        thim: joueur('thim', 'Thimoté Dénécé', 'Arrière', { muscuSeances: historique(false), wellnessCheckins: wellness({ douleurs: 2, energie: 2, sommeil: 2, humeur: 3, stress: 3, notesJoueur: 'Mal au genou' }) }),
        damien: joueur('damien', 'Damien Delamotte', 'Arrière', { muscuSeances: historique(false) }),
        gabin: joueur('gabin', 'Gabin Lambert', 'Arrière', {}),
      },
    } }) });
  const s = await open(file, { wait: 2500 });
  await s.p.setViewportSize({ width: 1400, height: 900 });
  await loginEmail(s.p, 'leo.chabanis@gmail.com', 'adminpass');
  await s.p.getByText('Mon espace').click(); await s.p.waitForTimeout(2000);
  await s.p.getByText('📊 Charge équipe').first().click(); await s.p.waitForTimeout(2500);
  const t = await body(s.p);
  const bloc = t.slice(t.indexOf('À surveiller aujourd'), t.indexOf('À surveiller aujourd') + 400);
  const verif = (l, ok) => console.log(`  ${ok ? '✅' : '❌'} ${l}`);
  verif('Ylann Bamba (vrai pic de charge) est signalé', /Ylann Bamba[^•]*• Pic de charge/.test(bloc));
  verif('Thimoté Dénécé (wellness mauvais) est signalé', /Thimoté Dénécé[^•]*• Wellness du jour/.test(bloc));
  verif('Noa Rousseau (reprise, petite charge) n\'est PAS signalé', !/Noa Rousseau/.test(bloc));
  verif('Damien Delamotte (charge stable) n\'est PAS signalé', !/Damien Delamotte/.test(bloc));
  verif('Le wellness du jour apparaît avant le tableau', t.indexOf('Wellness du matin') > -1 && t.indexOf('Wellness du matin') < t.indexOf('Charge 7 j'));
  verif('Noa : « Historique court » au lieu d\'un faux ratio', /Noa Rousseau[\s\S]{0,200}Historique court/.test(t));
  verif('Aucune erreur JavaScript', s.errs.length === 0);
  if (s.errs.length) console.log(s.errs);
  await s.p.screenshot({ path: path.join(sortie, 'page-charge.png'), fullPage: true });
  await s.b.close(); process.exit(0);
})();
