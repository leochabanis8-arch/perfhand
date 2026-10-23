// Envoie une notification Telegram au coach.
// Le token du bot reste ici, côté serveur (variables d'environnement Netlify TG_BOT_TOKEN et
// TG_CHAT_ID), au lieu d'être lisible par n'importe qui dans le code de la page.
// Appel : POST /.netlify/functions/telegram  { text }  avec l'en-tête
// « Authorization: Bearer <jeton Firebase de l'utilisateur connecté> ».

const DB_URL = 'https://perfhand-f8005-default-rtdb.europe-west1.firebasedatabase.app';
const LONGUEUR_MAX = 3500; // Telegram refuse au-delà de 4096 caractères

export default async (req) => {
  if (req.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });

  const token = Netlify.env.get('TG_BOT_TOKEN');
  const chatId = Netlify.env.get('TG_CHAT_ID');
  if (!token || !chatId) return new Response('Telegram non configuré', { status: 503 });

  // Contrôle d'accès : le jeton Firebase de l'appelant doit pouvoir lire un emplacement réservé
  // aux membres de l'appli. Ce sont donc les règles de sécurité de la base qui décident :
  // jeton absent, faux, expiré, ou simple visiteur → refus.
  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return new Response('Non connecté', { status: 401 });
  const verif = await fetch(`${DB_URL}/tg_notifications_sent.json?shallow=true&auth=${encodeURIComponent(idToken)}`);
  if (!verif.ok) return new Response('Accès refusé', { status: 403 });

  let text;
  try { ({ text } = await req.json()); } catch { return new Response('Requête invalide', { status: 400 }); }
  if (typeof text !== 'string' || !text.trim()) return new Response('Message vide', { status: 400 });

  const envoi = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, LONGUEUR_MAX), parse_mode: 'HTML' }),
  });
  if (!envoi.ok) {
    console.error('[telegram] refus de Telegram :', envoi.status, await envoi.text());
    return new Response('Envoi Telegram échoué', { status: 502 });
  }
  return new Response('ok');
};

// Limite anti-abus : 30 messages par minute et par adresse IP.
export const config = {
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
