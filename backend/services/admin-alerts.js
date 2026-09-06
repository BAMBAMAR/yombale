// backend/services/admin-alerts.js — Système centralisé d'alerte critique admin (Email + Telegram)
const axios = require('axios');
const { envoyerEmail } = require('./email');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nopalou.com';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Cache de cooldown pour éviter le flood (30 minutes par défaut)
const _cooldownCache = new Map();
const DEFAULT_COOLDOWN_MS = 30 * 60 * 1000;

/**
 * Envoie une notification via Telegram si configuré
 */
async function envoyerTelegram(htmlMessage) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: htmlMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }, { timeout: 8000 });
    return true;
  } catch (err) {
    console.error('[ADMIN ALERTS] Échec envoi Telegram:', err.response?.data || err.message);
    return false;
  }
}

/**
 * Alerter l'administrateur par Email et/ou Telegram
 * @param {Object} options
 * @param {string} options.type - Identifiant unique de l'alerte (ex: 'whatsapp_payment_unsettled')
 * @param {string} options.titre - Titre de l'alerte
 * @param {string} options.message - Explication courte et claire du problème
 * @param {string} [options.details] - Données techniques ou message d'erreur brut
 * @param {string} [options.lienAction] - URL pour corriger immédiatement le problème
 * @param {string} [options.texteAction] - Libellé du bouton / lien d'action
 * @param {'CRITIQUE'|'ATTENTION'|'INFO'} [options.priorite='ATTENTION']
 * @param {number} [options.cooldownMs] - Durée de mise en sourdine en ms
 * @param {boolean} [options.force=false] - Forcer l'envoi même si cooldown actif
 */
async function alerterAdmin({
  type = 'general',
  titre,
  message,
  details,
  lienAction,
  texteAction = 'Résoudre maintenant',
  priorite = 'ATTENTION',
  cooldownMs = DEFAULT_COOLDOWN_MS,
  force = false,
}) {
  const now = Date.now();
  const lastTime = _cooldownCache.get(type) || 0;

  if (!force && (now - lastTime < cooldownMs)) {
    const resteMinutes = Math.round((cooldownMs - (now - lastTime)) / 60000);
    console.log(`[ADMIN ALERTS] Alerte '${type}' ignorée (cooldown actif, reste ${resteMinutes} min)`);
    return { skipped: true, cooldown: true };
  }

  _cooldownCache.set(type, now);

  const icone = priorite === 'CRITIQUE' ? '🚨' : priorite === 'ATTENTION' ? '⚠️' : 'ℹ️';
  const couleurBadge = priorite === 'CRITIQUE' ? '#dc2626' : priorite === 'ATTENTION' ? '#d97706' : '#2563eb';

  console.warn(`[ADMIN ALERTS] ${icone} [${priorite}] ${titre} : ${message}`);

  // 1. Envoi par Email
  const htmlEmail = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${couleurBadge}; color: #ffffff; padding: 18px 24px; font-weight: bold; font-size: 17px; display: flex; align-items: center; gap: 10px;">
        <span>${icone} [${priorite}] Alerte Système Nopalou</span>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin-top: 0; color: #0f172a; font-size: 19px;">${titre}</h2>
        <p style="font-size: 15px; margin-bottom: 16px;">${message}</p>

        ${details ? `
          <div style="background: #f8fafc; border-left: 4px solid ${couleurBadge}; padding: 12px 16px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #334155; margin-bottom: 20px; white-space: pre-wrap; word-break: break-word;">
            ${details}
          </div>
        ` : ''}

        ${lienAction ? `
          <div style="margin: 24px 0;">
            <a href="${lienAction}" style="background: ${couleurBadge}; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
              👉 ${texteAction}
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Si le bouton ne fonctionne pas, copiez ce lien :<br><a href="${lienAction}" style="color: #2563eb;">${lienAction}</a></p>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          Cette alerte automatique a été déclenchée par le backend Nopalou à ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })} (Heure de Dakar).
        </p>
      </div>
    </div>
  `;

  const emailPromise = envoyerEmail({
    to: ADMIN_EMAIL,
    subject: `${icone} [${priorite}] Nopalou : ${titre}`,
    html: htmlEmail,
  }).catch(err => {
    console.error('[ADMIN ALERTS] Échec envoi email admin:', err.message);
  });

  // 2. Envoi par Telegram
  let tgText = `${icone} <b>[${priorite}] ALERTE NOPALOU</b>\n\n`;
  tgText += `<b>${titre}</b>\n\n`;
  tgText += `${message}\n\n`;
  if (details) {
    tgText += `<code>${details.length > 500 ? details.slice(0, 500) + '...' : details}</code>\n\n`;
  }
  if (lienAction) {
    tgText += `👉 <a href="${lienAction}">${texteAction}</a>\n`;
  }

  const tgPromise = envoyerTelegram(tgText);

  await Promise.allSettled([emailPromise, tgPromise]);
  return { success: true };
}

/**
 * Déclencheur spécifique pour les pannes WhatsApp Business
 */
async function alerterWhatsAppPanne({ motif, details, lienAction, codeErreur }) {
  const actionUrl = lienAction || 'https://business.facebook.com/billing_hub';
  const actionTitre = 'Payer / Débloquer sur Meta';

  return alerterAdmin({
    type: `whatsapp_panne_${codeErreur || 'generique'}`,
    priorite: 'CRITIQUE',
    titre: 'Service WhatsApp Bloqué (Échec d\'envoi des codes)',
    message: `Les utilisateurs ne reçoivent plus leurs codes de connexion ni leurs notifications WhatsApp.\n\n<b>Motif :</b> ${motif}`,
    details: details || `Code d'erreur Meta: ${codeErreur || 'Inconnu'}`,
    lienAction: actionUrl,
    texteAction: actionTitre,
    cooldownMs: 30 * 60 * 1000, // 1 alerte toutes les 30 min max
  });
}

module.exports = {
  alerterAdmin,
  alerterWhatsAppPanne,
};
