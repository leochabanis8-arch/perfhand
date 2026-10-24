import { seed, anon, compte, lit, ecrit, maj, suppr, charge } from './lib.mjs';
// Audit des règles de sécurité : chaque rôle tente d'accéder à ce qui ne le regarde pas.
await charge();
const admin = await compte('leo.chabanis@gmail.com', 'adminpass');
const kine = await compte('kine@test.fr', 'secret3');
const paul = await compte('paul@test.fr', 'secret1');
const proprio = await compte('proprio@prepa.fr', 'proprio1');
const autreProprio = await compte('autre@prepa.fr', 'autre123');
const pirate = await compte('pirate@evil.com', 'pirate123');
const DATA = {
  acces: {
    equipe: { 'kine@test,fr': true },
    joueurs: { 'paul@test,fr': { type: 'perso', id: 'perso-1' }, 'maxence@player,fr': { type: 'club', id: 'p-rizzi' } },
    joueursTenant: { 'tina@test,fr': { tenantId: 'tenant_abc', playerId: 'tp1' } },
  },
  perfhand: {
    clubs: [{ id: 'usm', name: 'USM', coach: { email: 'leo.chabanis@gmail.com' } }],
    playerProfiles: { 'p-rizzi': { id: 'p-rizzi', name: 'Maxence', blessures: [{ zone: 'genou' }] }, 'p-autre': { id: 'p-autre', name: 'Autre joueur' } },
    playersPerso: { 'perso-1': { id: 'perso-1', name: 'Paul' }, 'perso-2': { id: 'perso-2', name: 'Pierre' } },
    codes: { '123456': { playerId: 'p-rizzi' } },
    staffAccounts: [{ id: 's1', email: 'kine@test.fr' }],
    matchStats: { usm: [{ id: 'm1' }] },
  },
  tenants: {
    tenant_abc: { id: 'tenant_abc', uid: proprio.uid, nom: 'Prépa X', playersPerso: { tp1: { id: 'tp1', name: 'Tina' }, tp2: { id: 'tp2', name: 'Tom' } }, codes: { '654321': { playerId: 'tp1' } } },
    tenant_zzz: { id: 'tenant_zzz', uid: autreProprio.uid, nom: 'Autre prépa', playersPerso: { z1: { id: 'z1', name: 'Zoé' } } },
  },
  tenants_by_uid: { [proprio.uid]: 'tenant_abc', [autreProprio.uid]: 'tenant_zzz' },
  tenantCodes: { '654321': 'tenant_abc' },
  bibliothequeCustom: [{ nom: 'Squat' }],
};
await seed(DATA);
let ko = 0;
const T = (label, obtenu, attendu) => { const ok = obtenu === attendu; if (!ok) ko++; console.log(`${ok ? '✅' : '❌'} ${attendu ? 'AUTORISÉ' : 'bloqué  '} ${label}${ok ? '' : '   ← obtenu : ' + (obtenu ? 'autorisé' : 'bloqué')}`); };

console.log('\n— Visiteur anonyme (ouvre juste la page) —');
const a = await anon();
T('lire la liste des fiches joueurs', await lit('perfhand/playerProfiles', a), false);
T('lire la fiche de Maxence', await lit('perfhand/playerProfiles/p-rizzi', a), false);
T('modifier la fiche de Maxence', await maj('perfhand/playerProfiles/p-rizzi', a, { name: 'x' }), false);
T('lire joueurs perso / staff / clubs', (await lit('perfhand/playersPerso', a)) || (await lit('perfhand/staffAccounts', a)) || (await lit('perfhand/clubs', a)), false);
T('lister les codes', await lit('perfhand/codes', a), false);
T('lire UN code précis (connexion par code)', await lit('perfhand/codes/123456', a), true);
T('lire les tenants', await lit('tenants', a), false);
T('lire les index d\'accès', await lit('acces', a), false);
T('s\'ajouter dans l\'équipe', await ecrit('acces/equipe/pirate', a, true), false);
T('lier sa session à un FAUX code', await ecrit('perfhand/codeSessions/' + a.uid, a, { code: '999999', playerId: 'p-rizzi' }), false);
T('lier un vrai code à un AUTRE joueur', await ecrit('perfhand/codeSessions/' + a.uid, a, { code: '123456', playerId: 'p-autre' }), false);
T('lire la bibliothèque', await lit('bibliothequeCustom', a), false);

console.log('\n— Joueur Maxence connecté par code —');
const c = await anon();
T('lier sa session à son code', await ecrit('perfhand/codeSessions/' + c.uid, c, { code: '123456', playerId: 'p-rizzi' }), true);
T('lire SA fiche', await lit('perfhand/playerProfiles/p-rizzi', c), true);
T('modifier SA fiche (wellness)', await maj('perfhand/playerProfiles/p-rizzi', c, { stress: 3 }), true);
T('écriture groupée sur SA fiche (comme la synchro)', await maj('perfhand/playerProfiles', c, { 'p-rizzi/motivation': 4 }), true);
T('supprimer SA fiche', await suppr('perfhand/playerProfiles/p-rizzi', c), false);
T('lire la fiche d\'un coéquipier', await lit('perfhand/playerProfiles/p-autre', c), false);
T('lire la liste des fiches', await lit('perfhand/playerProfiles', c), false);
T('modifier un coéquipier', await maj('perfhand/playerProfiles/p-autre', c, { name: 'x' }), false);
T('lire clubs / stats de match / bibliothèque', (await lit('perfhand/clubs', c)) && (await lit('perfhand/matchStats', c)) && (await lit('bibliothequeCustom', c)), true);
T('lire le staff', await lit('perfhand/staffAccounts', c), false);
T('enregistrer sa progression muscu', await ecrit('perfhand/muscuProgress/p-rizzi/s1', c, { x: 1 }), true);
T('écrire la progression d\'un autre', await ecrit('perfhand/muscuProgress/p-autre/s1', c, { x: 1 }), false);
T('répondre au quiz tactique', await ecrit('perfhand/tactiqueQuiz/play1/p-rizzi', c, { score: 3 }), true);
T('modifier les stats de match', await ecrit('perfhand/matchStats/usm', c, []), false);
await suppr('perfhand/codes/123456', admin);
T('après suppression de son code par le coach : lire sa fiche', await lit('perfhand/playerProfiles/p-rizzi', c), false);
await seed(DATA);

console.log('\n— Joueur perso Paul (email) —');
T('lire SA fiche', await lit('perfhand/playersPerso/perso-1', paul), true);
T('modifier SA fiche', await maj('perfhand/playersPerso/perso-1', paul, { poids: 81 }), true);
T('lire la fiche d\'un autre joueur perso', await lit('perfhand/playersPerso/perso-2', paul), false);
T('lire la liste des joueurs perso', await lit('perfhand/playersPerso', paul), false);
T('lire sa propre entrée d\'index', await lit('acces/joueurs/paul@test,fr', paul), true);
T('lire l\'index des autres', await lit('acces/joueurs', paul), false);

console.log('\n— Pirate avec un compte email quelconque —');
T('lire n\'importe quelle fiche', (await lit('perfhand/playerProfiles/p-rizzi', pirate)) || (await lit('perfhand/playersPerso/perso-1', pirate)), false);
T('lire clubs', await lit('perfhand/clubs', pirate), false);
T('se créer une entrée d\'index joueur', await ecrit('acces/joueurs/pirate@evil,com', pirate, { type: 'club', id: 'p-rizzi' }), false);

console.log('\n— Staff (kiné, dans l\'équipe) —');
T('lire toutes les fiches', await lit('perfhand/playerProfiles', kine), true);
T('lire tous les joueurs perso', await lit('perfhand/playersPerso', kine), true);
T('modifier une fiche joueur', await maj('perfhand/playerProfiles/p-autre', kine, { notes: 'ok' }), true);
T('générer un code', await ecrit('perfhand/codes/111111', kine, { playerId: 'p-autre' }), true);
T('lire les tenants', await lit('tenants', kine), false);

console.log('\n— Admin —');
T('lire tout perfhand', (await lit('perfhand/playerProfiles', admin)) && (await lit('perfhand/staffAccounts', admin)), true);
T('lire tous les tenants', await lit('tenants', admin), true);
T('reconstruire l\'index d\'accès', await ecrit('acces', admin, DATA.acces), true);

console.log('\n— Préparateur (tenant) —');
T('lire SON tenant', await lit('tenants/tenant_abc', proprio), true);
T('lire le tenant d\'un autre', await lit('tenants/tenant_zzz', proprio), false);
T('lire la liste des tenants', await lit('tenants', proprio), false);
T('modifier son tenant', await maj('tenants/tenant_abc', proprio, { nom: 'Prépa X2' }), true);
T('modifier le tenant d\'un autre', await maj('tenants/tenant_zzz', proprio, { nom: 'x' }), false);
T('indexer l\'email de son joueur', await ecrit('acces/joueursTenant/tom@test,fr', proprio, { tenantId: 'tenant_abc', playerId: 'tp2' }), true);
T('détourner l\'index d\'un joueur d\'un autre tenant', await ecrit('acces/joueursTenant/tina@test,fr', autreProprio, { tenantId: 'tenant_zzz', playerId: 'z1' }), false);
T('lire les fiches du club', await lit('perfhand/playerProfiles/p-rizzi', proprio), false);
T('lire la bibliothèque', await lit('bibliothequeCustom', proprio), true);

console.log('\n— Joueuse Tina (tenant) connectée par code —');
const t = await anon();
T('lier sa session à son code', await ecrit('tenantCodeSessions/' + t.uid, t, { code: '654321', tenantId: 'tenant_abc', playerId: 'tp1' }), true);
T('lire SA fiche', await lit('tenants/tenant_abc/playersPerso/tp1', t), true);
T('enregistrer sa séance', await ecrit('tenants/tenant_abc/playersPerso/tp1/muscuSeances', t, [{ id: 1 }]), true);
T('lire la fiche de Tom (même préparateur)', await lit('tenants/tenant_abc/playersPerso/tp2', t), false);
T('lire la liste des joueurs du tenant', await lit('tenants/tenant_abc/playersPerso', t), false);
T('lire la bibliothèque', await lit('bibliothequeCustom', t), true);

console.log('\n— Inscription d\'un nouveau préparateur —');
const neuf = await compte('neuf@prepa.fr', 'neuf1234');
const tid = 'tenant_' + neuf.uid.slice(0, 12);
T('créer son tenant', await ecrit('tenants/' + tid, neuf, { id: tid, uid: neuf.uid, nom: 'Neuf' }), true);
T('enregistrer tenants_by_uid', await ecrit('tenants_by_uid/' + neuf.uid, neuf, tid), true);
T('créer un tenant au nom d\'un autre uid', await ecrit('tenants/tenant_vol', neuf, { id: 'tenant_vol', uid: proprio.uid }), false);
console.log(`\n${ko === 0 ? 'TOUT EST CONFORME' : ko + ' ÉCART(S)'}`);
process.exit(ko ? 1 : 0);
