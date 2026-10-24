"""Assemble index.html à partir des fichiers de src/ (dans l'ordre de src/ordre.txt).
  python3 outils/assembler.py            → écrit index.html et site/public/index.html
  python3 outils/assembler.py --verifier → vérifie que index.html correspond aux sources"""
import os, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, 'src')
ordre = [l.strip() for l in open(os.path.join(SRC, 'ordre.txt'), encoding='utf-8') if l.strip() and not l.startswith('#')]
contenu = ''.join(open(os.path.join(SRC, f), encoding='utf-8', newline='').read() for f in ordre)
cibles = [os.path.join(RACINE, 'index.html'), os.path.join(RACINE, 'site', 'public', 'index.html')]

if '--verifier' in sys.argv:
    ecarts = [c for c in cibles if not os.path.exists(c) or open(c, encoding='utf-8', newline='').read() != contenu]
    if ecarts:
        sys.exit('PAS À JOUR : ' + ', '.join(os.path.relpath(c, RACINE) for c in ecarts) + ' → lance python3 outils/assembler.py')
    print('index.html est à jour avec src/')
else:
    for c in cibles:
        os.makedirs(os.path.dirname(c), exist_ok=True)
        open(c, 'w', encoding='utf-8', newline='').write(contenu)
    print(f'index.html assemblé ({len(ordre)} fichiers, {len(contenu.encode())} octets)')
