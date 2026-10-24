# PerfHand

Plateforme de préparation physique handball (coach, staff, joueurs, préparateurs externes).
Application web d'une seule page (React + htm, sans étape de compilation), données dans
Firebase Realtime Database, hébergée sur Netlify (`perfhandballapp`).

## Organisation

| Dossier / fichier | Rôle |
|---|---|
| `src/` | **Le code source, à modifier ici.** `src/js/` contient l'appli découpée par thème, `src/page/` l'en-tête HTML et le CSS. `src/ordre.txt` donne l'ordre d'assemblage. |
| `outils/assembler.py` | Recolle `src/` en `index.html` (et `site/public/index.html`). |
| `index.html` | Fichier généré — ne pas modifier à la main. |
| `database.rules.json` | Règles de sécurité Firebase, générées par `outils/generer_regles.py`. |
| `site/` | Dossier à déployer sur Netlify : `public/` (le site) + `netlify/functions/` (code serveur). |
| `tests/` | Tests de sécurité et de non-régression, sur un émulateur Firebase local. |

## Modifier l'appli

1. Modifier le(s) fichier(s) concerné(s) dans `src/js/` (ex. la muscu : `30-muscu-methodes.js`, `32-muscu-seances.js`, `42-muscu-vue.js`).
2. `python3 outils/assembler.py` → régénère `index.html` et `site/public/index.html`.
3. `cd tests && npm test` → tout doit être ✅.
4. Déployer le dossier `site/` sur Netlify (glisser-déposer en étant connecté).

`python3 outils/assembler.py --verifier` indique si `index.html` est en retard sur `src/`.

## Règles de sécurité Firebase

Ne pas éditer `database.rules.json` à la main : modifier `outils/generer_regles.py`, puis
`python3 outils/generer_regles.py > database.rules.json`, lancer `cd tests && npm run test:regles`,
et coller le fichier dans la console Firebase (Realtime Database → Règles → Publier).

Qui accède à quoi :
- **Équipe** (admin, coachs, staff — listés dans `acces/equipe`) : tout l'espace club.
- **Joueur** (par email via `acces/joueurs`, ou par code via `perfhand/codeSessions`) : sa fiche uniquement + données partagées du club.
- **Préparateur (tenant)** : son tenant. **Joueur de tenant** : sa fiche dans ce tenant.
- **Visiteur non identifié** : rien (sauf vérifier un code saisi).

Les index `acces/*` sont reconstruits automatiquement à chaque connexion de l'admin.

## Tests

Prérequis : Node.js 20+, Java 11+ (émulateur Firebase).

```bash
cd tests
npm install
npx playwright install chromium   # une seule fois
npm test                          # règles + fonction Telegram + scénarios de l'appli
```

Les tests n'utilisent **jamais** la vraie base : tout tourne dans l'émulateur local.

## Variables Netlify (fonction Telegram)

`TG_BOT_TOKEN` (secret, token du bot fourni par @BotFather) et `TG_CHAT_ID`.
Le token ne doit jamais apparaître dans le code.
