

function _startApp() {
  try {
    var useState    = function(i) { return React.useState(i); };
    var useEffect   = function(f,d) { return React.useEffect(f,d); };
    var useContext  = function(c) { return React.useContext(c); };
    var useRef      = function(i) { return React.useRef(i); };
    var createContext = function(d) { return React.createContext(d); };
    var _h = htm.bind(React.createElement);

    // ── APP SETUP ──────────────────────────────────────────────────────────────
const ACCENT = "#FFA420";

// ── TELEGRAM NOTIFICATIONS ────────────────────────────────────────────────────
// Configuration — remplace par tes vraies valeurs après création du bot
const TELEGRAM_CONFIG = {
  token:  'TELEGRAM_BOT_TOKEN',   // ex: 7234567890:AAFxxx (depuis @BotFather)
  chatId: 'TELEGRAM_CHAT_ID',     // ex: 123456789 (ton chat ID coach)
  enabled: false,                 // passe à true une fois configuré
};

async function sendTelegramNotif(message) {
  if (!TELEGRAM_CONFIG.enabled ||
      TELEGRAM_CONFIG.token === 'TELEGRAM_BOT_TOKEN' ||
      TELEGRAM_CONFIG.chatId === 'TELEGRAM_CHAT_ID') {
    console.log('[Telegram] Notification (non configuré):', message);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CONFIG.chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch(e) {
    console.warn('[Telegram] Envoi échoué:', e);
  }
}

function notifBilanSeance(playerName, bilan) {
  const rpeStr = bilan.rpe ? `RPE ${bilan.rpe}/10` : '';
  const fatigueStr = bilan.fatigue ? `Fatigue ${bilan.fatigue}/5` : '';
  const emoji = bilan.rpe >= 9 ? '🔴' : bilan.rpe >= 7 ? '🟠' : bilan.rpe >= 5 ? '🟡' : '🟢';
  const msg = `${emoji} <b>Bilan séance — ${playerName}</b>\n`
    + `📋 Type : ${bilan.type || '—'}\n`
    + `⏱ Durée : ${bilan.duree || '—'} min\n`
    + (rpeStr ? `💪 ${rpeStr}\n` : '')
    + (fatigueStr ? `😴 ${fatigueStr}\n` : '')
    + (bilan.notes ? `💬 "${bilan.notes}"\n` : '')
    + `⏰ ${new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`;
  sendTelegramNotif(msg);
}

function notifWellness(playerName, data) {
  const score = Math.round(Object.values(data).reduce((a,b) => a+b, 0) / Object.keys(data).length * 10) / 10;
  const emoji = score >= 4 ? '🟢' : score >= 3 ? '🟡' : '🔴';
  const msg = `${emoji} <b>Wellness — ${playerName}</b>\n`
    + `📊 Score global : <b>${score}/5</b>\n`
    + `😴 Sommeil : ${data.sommeil || '—'}/5\n`
    + `⚡ Énergie : ${data.energie || '—'}/5\n`
    + `😤 Stress : ${data.stress || '—'}/5\n`
    + `😊 Humeur : ${data.humeur || '—'}/5\n`
    + (score < 3 ? `⚠️ <b>Attention : score bas — vérifier avec le joueur</b>\n` : '')
    + `⏰ ${new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`;
  sendTelegramNotif(msg);
}

function notifRessentRPE(playerName, seanceName, rpeCible, rpeReel, fatigue) {
  const delta = rpeCible && rpeReel ? rpeReel - rpeCible : null;
  const emoji = delta === null ? '📊' : Math.abs(delta) <= 1 ? '✅' : Math.abs(delta) <= 2 ? '⚠️' : '🔴';
  const msg = `${emoji} <b>Ressenti RPE — ${playerName}</b>\n`
    + `💪 Séance : ${seanceName}\n`
    + (rpeCible ? `🎯 RPE cible : ${rpeCible}/10\n` : '')
    + (rpeReel ? `📈 RPE réel : <b>${rpeReel}/10</b>\n` : '')
    + (delta !== null ? `${Math.abs(delta) <= 1 ? '✅' : '⚠️'} Écart : ${delta > 0 ? '+' : ''}${delta}\n` : '')
    + (fatigue ? `😴 Fatigue : ${fatigue}/5\n` : '')
    + `⏰ ${new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}`;
  sendTelegramNotif(msg);
}

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);
