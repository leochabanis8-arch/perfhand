// Ouvre l'appli avec le VRAI SDK Firebase branché sur l'émulateur local.
const { chromium } = require('playwright');
const path = require('path');
const dossier = p => path.join(__dirname, 'node_modules', p) + '/';
const FB = dossier('firebase'), REACT = dossier('react'), REACT_DOM = dossier('react-dom'), HTM = dossier('htm');
async function open(file, { localStorage = {}, wait = 2500 } = {}) {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [], dialogs = [], denied = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { const t = m.text(); if (/permission_denied|PERMISSION_DENIED|permission denied/i.test(t)) denied.push(t.slice(0, 160)); });
  p.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
  if (Object.keys(localStorage).length) await p.addInitScript(ls => { for (const [k, v] of Object.entries(ls)) window.localStorage.setItem(k, v); }, localStorage);
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await p.route(/firebase-app-compat\.js/, async r => {
    const fs = require('fs');
    r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(FB + 'firebase-app-compat.js', 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'emu-hook.js'), 'utf8') });
  });
  await p.route(/firebase-database-compat\.js/, r => r.fulfill({ path: FB + 'firebase-database-compat.js', contentType: 'text/javascript' }));
  await p.route(/firebase-auth-compat\.js/, r => r.fulfill({ path: FB + 'firebase-auth-compat.js', contentType: 'text/javascript' }));
  await p.route(/react@18\.2\.0\/umd\/react\.production/, r => r.fulfill({ path: REACT + 'umd/react.production.min.js', contentType: 'text/javascript' }));
  await p.route(/react-dom@18\.2\.0\/umd\/react-dom\.production/, r => r.fulfill({ path: REACT_DOM + 'umd/react-dom.production.min.js', contentType: 'text/javascript' }));
  await p.route(/htm@3\.1\.1/, r => r.fulfill({ path: HTM + 'dist/htm.js', contentType: 'text/javascript' }));
  if (file !== '/dev/null') await p.goto('file://' + file);
  await p.waitForTimeout(wait);
  return { b, p, errs, dialogs, denied };
}
async function loginEmail(p, email, pw) {
  await p.fill('input[placeholder="votre@email.fr"]', email);
  await p.fill('input[autocomplete="current-password"]', pw);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(3500);
}
async function loginCode(p, code) {
  await p.getByText('Code joueur').first().click(); await p.waitForTimeout(200);
  await p.fill('input[placeholder="Ex: 472831"]', code);
  await p.getByText('Acceder a mon espace').click();
  await p.waitForTimeout(3500);
}
const body = async p => (await p.innerText('body')).replace(/\s+/g, ' ');
module.exports = { open, loginEmail, loginCode, body };
