// Fusion des séances (enregistrerSeancesFusion) : une copie en retard ne doit jamais effacer une validation.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/js/01-securite-acces.js'), 'utf8');
const extrait = (debut, fin) => { const a = src.indexOf(debut); return src.slice(a, fin ? src.indexOf(fin, a) : src.indexOf('\n', a) + 1); };
eval(extrait('function enTableau') + extrait('function idSeance', 'function enregistrerSeancesFusion') + ';global.F=fusionnerSeances;');
let ko=0; const T=(l,ok)=>{ if(!ok) ko++; console.log((ok?'  ✅ ':'  ❌ ')+l); };
const A={id:'a',nom:'A',datePrevu:'2026-11-10'}, Av={...A,dateFaite:'2026-11-10',rpeReel:7}, B={id:'b',nom:'B',datePrevu:'2026-11-12'}, Bv={...B,dateFaite:'2026-11-12',rpeReel:6};
// Copie locale en retard (A pas validée) ; serveur : A validée. Le joueur valide B.
let r=F([Av,B],[A,B],[A,Bv]);
T('copie en retard : la validation de A (faite ailleurs) est conservée', r.find(s=>s.id==='a').dateFaite==='2026-11-10');
T('… et la validation de B est enregistrée', r.find(s=>s.id==='b').dateFaite==='2026-11-12' && r.find(s=>s.id==='b').rpeReel===6);
// Le coach ajoute une séance C pendant que le joueur valide B sur une copie sans C
r=F([A,B,{id:'c',nom:'C'}],[A,B],[A,Bv]);
T('séance ajoutée par le coach entre-temps : conservée', !!r.find(s=>s.id==='c'));
// Suppression locale d'une séance
r=F([Av,B],[A,B],[A]);
T('séance supprimée volontairement : supprimée', !r.find(s=>s.id==='b') && r.find(s=>s.id==='a').dateFaite);
// Ajout d'une séance
r=F([A],[A],[A,{id:'d',nom:'D'}]);
T('nouvelle séance : ajoutée', r.length===2);
// Dévalidation explicite par le coach (dateFaite: null)
r=F([Av],[Av],[{...Av,dateFaite:null,rpeReel:null}]);
T('dévalidation volontaire (dateFaite vidé) : appliquée', r[0].dateFaite===null);
// Serveur stocké en objet {0:..,1:..} (tableau à trous)
r=F({0:Av,2:B},[A,B],[A,Bv]);
T('liste serveur au format objet : gérée', r.length===2 && r.find(s=>s.id==='a').dateFaite && r.find(s=>s.id==='b').dateFaite);
process.exit(ko?1:0);
