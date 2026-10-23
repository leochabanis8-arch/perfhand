"""Génère database.rules.json (règles de sécurité Firebase, palier 2).
Les règles Firebase n'ont pas de fonctions : les conditions répétées sont assemblées ici.
Usage : python3 outils/generer_regles.py > database.rules.json"""
import json

ADMIN_EMAIL = 'leo.chabanis@gmail.com'
CLE = "auth.token.email.toLowerCase().replace('.', ',')"          # même clé que cleEmail() dans l'appli
A_EMAIL = "auth != null && auth.token.email != null"
ADMIN = f"({A_EMAIL} && auth.token.email === '{ADMIN_EMAIL}')"
EQUIPE = f"({A_EMAIL} && (auth.token.email === '{ADMIN_EMAIL}' || root.child('acces/equipe').child({CLE}).val() === true))"
SESSION_CODE = "root.child('perfhand/codeSessions').child(auth.uid)"
SESSION_CODE_T = "root.child('tenantCodeSessions').child(auth.uid)"

def joueur_club(pid):   # fiche joueur de club : son email (index) ou son code (session liée, code toujours valide)
    return (f"(auth != null && (({A_EMAIL} && root.child('acces/joueurs').child({CLE}).child('type').val() === 'club' "
            f"&& root.child('acces/joueurs').child({CLE}).child('id').val() === {pid}) || "
            f"({SESSION_CODE}.child('playerId').val() === {pid} && "
            f"root.child('perfhand/codes').child({SESSION_CODE}.child('code').val()).child('playerId').val() === {pid})))")

def joueur_perso(pid):
    return (f"({A_EMAIL} && root.child('acces/joueurs').child({CLE}).child('type').val() === 'perso' "
            f"&& root.child('acces/joueurs').child({CLE}).child('id').val() === {pid})")

def joueur(pid):
    return f"({joueur_club(pid)} || {joueur_perso(pid)})"

def proprio_tenant(tid):
    return (f"(auth != null && (root.child('tenants').child({tid}).child('uid').val() === auth.uid "
            f"|| root.child('tenants_by_uid').child(auth.uid).val() === {tid}))")

def joueur_tenant(tid, pid):
    return (f"(auth != null && (({SESSION_CODE_T}.child('tenantId').val() === {tid} && {SESSION_CODE_T}.child('playerId').val() === {pid} "
            f"&& root.child('tenants').child({tid}).child('codes').child({SESSION_CODE_T}.child('code').val()).child('playerId').val() === {pid}) || "
            f"({A_EMAIL} && root.child('acces/joueursTenant').child({CLE}).child('tenantId').val() === {tid} "
            f"&& root.child('acces/joueursTenant').child({CLE}).child('playerId').val() === {pid})))")

# Toute personne identifiée de l'appli (équipe, joueur, préparateur) — exclut le simple visiteur anonyme.
MEMBRE = (f"(auth != null && ({EQUIPE} || {SESSION_CODE}.exists() || {SESSION_CODE_T}.exists() || "
          f"({A_EMAIL} && (root.child('acces/joueurs').child({CLE}).exists() || root.child('acces/joueursTenant').child({CLE}).exists() "
          f"|| root.child('tenants_by_uid').child(auth.uid).exists()))))")

MA_CLE = f"{A_EMAIL} && {CLE} === $k"
TID_NOUVEAU = "newData.child('tenantId').val()"

TENANT_ECRITURE = (f"auth != null && ({ADMIN} || (!data.exists() && auth.token.email != null && newData.child('uid').val() === auth.uid "
                   f"&& newData.child('id').val() === $tenantId) || ({proprio_tenant('$tenantId')} && newData.child('uid').val() === data.child('uid').val()))")

regles = {
  "rules": {
    "acces": {
      ".read": EQUIPE, ".write": EQUIPE,
      "equipe": {"$k": {".read": MA_CLE}},
      "joueurs": {"$k": {".read": MA_CLE}},
      "joueursTenant": {"$k": {
        ".read": MA_CLE,
        ".write": (f"{A_EMAIL} && newData.exists() && {proprio_tenant(TID_NOUVEAU)} "
                   f"&& (!data.exists() || data.child('tenantId').val() === newData.child('tenantId').val())")}},
    },
    "perfhand": {
      "codes": {".read": EQUIPE, ".write": EQUIPE, "$code": {".read": "auth != null"}},
      "codeSessions": {".read": EQUIPE, "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": ("auth != null && auth.uid === $uid && (!newData.exists() || (newData.child('playerId').isString() && newData.child('code').isString() "
                   "&& root.child('perfhand/codes').child(newData.child('code').val()).child('playerId').val() === newData.child('playerId').val()))")}},
      "playerProfiles": {".read": EQUIPE, ".write": EQUIPE, "$pid": {
        ".read": joueur_club('$pid'), ".write": f"{joueur_club('$pid')} && newData.exists()"}},
      "playersPerso": {".read": EQUIPE, ".write": EQUIPE, "$pid": {
        ".read": joueur_perso('$pid'), ".write": f"{joueur_perso('$pid')} && newData.exists()"}},
      "staffAccounts": {".read": EQUIPE, ".write": EQUIPE},
      "muscuProgress": {".read": EQUIPE, ".write": EQUIPE, "$pid": {".read": joueur('$pid'), ".write": joueur('$pid')}},
      "tactiqueQuiz": {".read": MEMBRE, ".write": EQUIPE, "$play": {"$jid": {".write": joueur('$jid')}}},
      "$autre": {".read": MEMBRE, ".write": EQUIPE},
    },
    "bibliothequeCustom": {".read": MEMBRE, ".write": MEMBRE},
    "bibliothequeOverrides": {".read": MEMBRE, ".write": EQUIPE},
    "exerciceMedias": {".read": MEMBRE, ".write": EQUIPE},
    "tenants": {
      ".read": ADMIN,
      "$tenantId": {
        ".read": f"{ADMIN} || {proprio_tenant('$tenantId')}",
        ".write": TENANT_ECRITURE,
        "codes": {"$code": {".read": "auth != null"}},
        "playersPerso": {"$pid": {
          ".read": joueur_tenant('$tenantId', '$pid'),
          ".write": f"{joueur_tenant('$tenantId', '$pid')} && newData.exists()"}},
      },
    },
    "tenants_by_uid": {"$uid": {
      ".read": f"auth != null && (auth.uid === $uid || {ADMIN})",
      ".write": ("auth != null && auth.uid === $uid && newData.isString() "
                 "&& root.child('tenants').child(newData.val()).child('uid').val() === auth.uid")}},
    "tenantCodes": {"$code": {
      ".read": "auth != null",
      ".write": (f"{A_EMAIL} && ({ADMIN} || (newData.isString() && (!data.exists() || data.val() === newData.val()) && "
                 f"{proprio_tenant('newData.val()')}))")}},
    "tenantCodeSessions": {"$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": ("auth != null && auth.uid === $uid && (!newData.exists() || (newData.child('tenantId').isString() && newData.child('code').isString() "
                 "&& root.child('tenants').child(newData.child('tenantId').val()).child('codes').child(newData.child('code').val()).child('playerId').val() === newData.child('playerId').val()))")}},
    "tg_notifications_sent": {".read": MEMBRE, ".write": MEMBRE},
  }
}
print(json.dumps(regles, indent=2, ensure_ascii=False))
