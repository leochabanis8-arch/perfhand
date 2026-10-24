// Client REST minimal pour l'émulateur (aucun accès à la vraie base).
export const NS = 'demo-perfhand-default-rtdb';
const DB = 'http://127.0.0.1:9000', AU = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
export async function seed(data) {
  const r = await fetch(`${DB}/.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error('seed ' + r.status + await r.text());
}
export async function anon() { const r = await (await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } })).json(); return { token: r.idToken, uid: r.localId }; }
export async function compte(email, password) {
  let r = await (await fetch(`${AU}/accounts:signUp?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) })).json();
  if (r.error) r = await (await fetch(`${AU}/accounts:signInWithPassword?key=x`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) })).json();
  return { token: r.idToken, uid: r.localId, email };
}
async function req(method, path, who, body, extra = '') {
  const a = who && who.token ? `&auth=${who.token}` : '';
  const r = await fetch(`${DB}/${path}.json?ns=${NS}${a}${extra}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.ok;
}
export const lit = (p, w, extra) => req('GET', p, w, undefined, extra);
export const ecrit = (p, w, v) => req('PUT', p, w, v);
export const maj = (p, w, v) => req('PATCH', p, w, v);
export const suppr = (p, w) => req('DELETE', p, w);
export async function charge(rulesFile = new URL('../database.rules.json', import.meta.url)) {
  const fs = await import('fs');
  const r = await fetch(`${DB}/.settings/rules.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: fs.readFileSync(rulesFile, 'utf8') });
  if (!r.ok) throw new Error('rules ' + r.status + ' ' + await r.text());
}
export const DATA = {
  perfhand: {
    clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com', name: 'Leo' } }],
    playerProfiles: { 'p-rizzi': { id: 'p-rizzi', name: 'Maxence Rizzi', blessures: [{ zone: 'genou' }] } },
    playersPerso: { 'perso-1': { id: 'perso-1', name: 'Paul', email: 'paul@test.fr' } },
    codes: { '123456': { playerId: 'p-rizzi' } },
    staffAccounts: [{ id: 's1', email: 'kine@test.fr' }],
  },
  tenants: { tenant_abc: { id: 'tenant_abc', uid: 'UID_PROPRIO', nom: 'Prépa X', playersPerso: { tp1: { id: 'tp1', name: 'Tina' } }, codes: { '654321': { playerId: 'tp1' } } } },
  tenants_by_uid: { UID_PROPRIO: 'tenant_abc' },
  bibliothequeOverrides: { a: 1 },
};
