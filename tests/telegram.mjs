import { seed, anon, compte, ecrit, charge } from './lib.mjs';
// Fonction Netlify d'envoi Telegram : contrôle d'accès + envoi (Telegram simulé).
await charge();
const admin = await compte('leo.chabanis@gmail.com', 'adminpass');
await seed({ perfhand: { codes: { '123456': { playerId: 'p-rizzi' } }, playerProfiles: { 'p-rizzi': { id: 'p-rizzi' } } }, tg_notifications_sent: { x: '2026-10-23' } });

// Environnement Netlify simulé + réseau redirigé : base → émulateur, Telegram → faux serveur.
const env = { TG_BOT_TOKEN: 'FAUX_TOKEN', TG_CHAT_ID: '42' };
globalThis.Netlify = { env: { get: k => env[k] } };
const envoyes = [];
const vraiFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  url = String(url);
  if (url.startsWith('https://api.telegram.org/')) { envoyes.push({ url, body: JSON.parse(opts.body) }); return new Response('{"ok":true}'); }
  if (url.startsWith('https://perfhand-f8005-default-rtdb')) url = url.replace(/^https:\/\/[^/]+/, 'http://127.0.0.1:9000') + '&ns=demo-perfhand-default-rtdb';
  return vraiFetch(url, opts);
};
const { default: fn } = await import('../site/netlify/functions/telegram.mjs');
const appel = (token, body, method = 'POST') => fn(new Request('https://x/.netlify/functions/telegram', {
  method, headers: token ? { authorization: 'Bearer ' + token } : {}, body: method === 'POST' ? JSON.stringify(body) : undefined }));
let ko = 0;
const T = async (label, p, attendu) => { const r = await p; const ok = r.status === attendu; if (!ok) ko++; console.log(`${ok ? '✅' : '❌'} ${label} → ${r.status}${ok ? '' : ' (attendu ' + attendu + ')'}`); };

await T('GET refusé', appel(admin.token, null, 'GET'), 405);
await T('sans connexion', appel(null, { text: 'spam' }), 401);
await T('jeton bidon', appel('nimportequoi', { text: 'spam' }), 403);
const visiteur = await anon();
await T('visiteur anonyme (non membre)', appel(visiteur.token, { text: 'spam' }), 403);
const pirate = await compte('pirate@evil.com', 'pirate123');
await T('compte email quelconque', appel(pirate.token, { text: 'spam' }), 403);
const joueur = await anon();
await ecrit('perfhand/codeSessions/' + joueur.uid, joueur, { code: '123456', playerId: 'p-rizzi' });
await T('joueur connecté par code', appel(joueur.token, { text: 'Wellness Maxence' }), 200);
await T('admin', appel(admin.token, { text: 'Test OK' }), 200);
await T('message vide', appel(admin.token, { text: '  ' }), 400);
await T('message très long (tronqué)', appel(admin.token, { text: 'x'.repeat(10000) }), 200);
delete env.TG_BOT_TOKEN;
await T('token non configuré sur Netlify', appel(admin.token, { text: 'a' }), 503);
console.log('Messages réellement transmis à Telegram :', envoyes.length, '| chat_id', envoyes[0]?.body.chat_id, '| token dans l\'URL :', envoyes[0]?.url.includes('FAUX_TOKEN'), '| longueur max', Math.max(...envoyes.map(e => e.body.text.length)));
console.log(ko ? ko + ' ÉCART(S)' : 'TOUT EST CONFORME');
process.exit(ko ? 1 : 0);
