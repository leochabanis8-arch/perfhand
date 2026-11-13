"""Découpage initial (à usage unique) de index.html en fichiers sources dans src/.
Chaque coupure tombe juste avant un élément de premier niveau, en remontant les commentaires
qui le précèdent. La concaténation des morceaux redonne index.html à l'octet près."""
import re, os, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
texte = open(os.path.join(RACINE, 'index.html'), encoding='utf-8').read()
lignes = texte.splitlines(keepends=True)

def ligne_de(motif, apres=0):
    for i in range(apres, len(lignes)):
        if re.match(motif, lignes[i]): return i
    sys.exit('introuvable : ' + motif)

def symbole(nom, apres):
    i = ligne_de(r'^(?:async )?(?:function|const|let|var|class) ' + re.escape(nom) + r'\b', apres)
    while i > apres and (lignes[i-1].lstrip().startswith('//') or not lignes[i-1].strip()):
        i -= 1  # les commentaires (et lignes vides) au-dessus d'un élément restent avec lui
    return i

DEBUT_STYLE = ligne_de(r'^  <style>') + 1
FIN_STYLE = ligne_de(r'^  </style>')
DEBUT_JS = [i for i, l in enumerate(lignes) if l.rstrip('\n') == '<script>'][-1] + 1
FIN_JS = max(i for i, l in enumerate(lignes) if l.rstrip('\n') == '</script>')

DECOUPE = [  # (fichier, premier élément)
  ('js/00-demarrage.js', None),
  ('js/01-securite-acces.js', 'localDateStr'),
  ('js/02-wellness-exports.js', 'wellnessArr'),
  ('js/03-config-contexte.js', '_startApp'),
  ('js/10-donnees-base.js', 'CYCLE_COLORS'),
  ('js/11-donnees-nutrition.js', 'PLANS_NUT'),
  ('js/20-composants-communs.js', 'SharedChat'),
  ('js/21-planification-saison.js', 'CLUB_CYCLE_MAP'),
  ('js/22-suivi-medical.js', 'SuiviMedical'),
  ('js/23-nutrition.js', 'CompositionView'),
  ('js/30-muscu-methodes.js', 'METHODES_MUSCU'),
  ('js/31-endurance.js', 'getPlayerVMA'),
  ('js/32-muscu-seances.js', 'ProgrammeJour'),
  ('js/33-mobilite-echauffement.js', 'PROTOCOLES_MOBILITE'),
  ('js/40-stats-match.js', 'STATS_ATTAQUE'),
  ('js/41-cycle-gainage-mobilite.js', 'CycleView'),
  ('js/42-muscu-vue.js', 'MuscuView'),
  ('js/43-profil-modales.js', 'EditProfileModal'),
  ('js/50-donnees-bibliotheque-mouvements.js', 'BIBLIOTHEQUE_MOUVEMENTS'),
  ('js/51-protocoles-bibliotheque.js', 'PROTOCOLES_DATA'),
  ('js/52-ressources-mental.js', 'RessourcesView'),
  ('js/60-fiche-joueur.js', 'PlayerDetail'),
  ('js/61-inscription.js', 'RegisterScreen'),
  ('js/62-admin.js', 'AdminView'),
  ('js/63-tenants-admin.js', 'LegacyAdminView'),
  ('js/64-tenant-joueur.js', 'TenantPlayerView'),
  ('js/65-connexion.js', 'LoginScreen'),
  ('js/70-coach-saisies.js', 'CoachView'),
  ('js/71-suivi-charge.js', 'SuiviChargeView'),
  ('js/72-tableau-charge.js', 'ChargeDashboard'),
  ('js/80-espace-joueur.js', 'PlayerView'),
  ('js/81-espace-joueur-perso.js', 'PersoPlayerView'),
  ('js/82-staff.js', 'ROLES_STAFF'),
  ('js/83-profils-perso.js', 'getDeletedProfileIds'),
  ('js/84-planif-club.js', 'CYCLES_PERSO'),
  ('js/85-rm-staff.js', 'RMCalculator'),
  ('js/86-tactique.js', 'TACT_W'),
  ('js/87-suivi-direct.js', 'MessagesCoachDirect'),
  ('js/90-application.js', 'PerfHandApp'),
]

morceaux = [('page/1-entete.html', 0, DEBUT_STYLE), ('page/styles.css', DEBUT_STYLE, FIN_STYLE),
            ('page/2-corps.html', FIN_STYLE, DEBUT_JS)]
debuts = []
for _, s in DECOUPE:  # chaque élément est cherché après le précédent (RessourcesView existe 2 fois)
    debuts.append(DEBUT_JS if s is None else symbole(s, debuts[-1] + 1))
assert debuts == sorted(debuts), 'ordre de découpe incohérent'
for k, (f, _) in enumerate(DECOUPE):
    morceaux.append((f, debuts[k], debuts[k+1] if k+1 < len(debuts) else FIN_JS))
morceaux.append(('page/3-fin.html', FIN_JS, len(lignes)))

os.makedirs(os.path.join(RACINE, 'src/js'), exist_ok=True)
os.makedirs(os.path.join(RACINE, 'src/page'), exist_ok=True)
for f, a, b in morceaux:
    open(os.path.join(RACINE, 'src', f), 'w', encoding='utf-8', newline='').write(''.join(lignes[a:b]))
open(os.path.join(RACINE, 'src/ordre.txt'), 'w', encoding='utf-8').write(
  '# Ordre d\'assemblage de index.html (un fichier par ligne, relatif à src/)\n' + '\n'.join(f for f, _, _ in morceaux) + '\n')
for f, a, b in morceaux: print(f'{b-a:6d} lignes  {f}')
