# Consignes pour travailler sur PerfHand

- Langue : français (code, commentaires, messages).
- Ne jamais modifier `index.html` ni `site/public/index.html` directement : ils sont générés.
  Modifier `src/`, puis `python3 outils/assembler.py`.
- Ne jamais éditer `database.rules.json` à la main : modifier `outils/generer_regles.py` puis régénérer.
- Après toute modification : `cd tests && npm test` (règles, fonction Telegram, scénarios). Dans un
  conteneur cloud, préciser `CHROMIUM_PATH=/opt/pw-browsers/chromium`.
- Ne jamais lire ni écrire la base de production : utiliser l'émulateur (`tests/`).
- Aucun secret dans le code (token Telegram : variable Netlify `TG_BOT_TOKEN`).
- Règle d'or du propriétaire : « casse rien, tout doit rester fonctionnel » — comparer avant/après.
