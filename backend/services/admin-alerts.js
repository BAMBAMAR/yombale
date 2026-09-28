// backend/services/admin-alerts.js — Système centralisé d'alerte multi-canale (Email + Telegram + WhatsApp)
const axios = require('axios');
const { envoyerEmail } = require('./email');
const settingsCache = require('../lib/settingsCache');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nopalou.com';
const DEFAULT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const _cooldownCache = new Map();

/**
 * Récupère les identifiants Telegram (DB ou variable d'environnement)
 */
async function getTelegramConfig() {
  try {
    const isActifSetting = await settingsCache.get('telegram_notifications_actives');
    if (isActifSetting === 'false' || isActifSetting === false) {
      return { token: null, chatId: null, actif: false };
    }
    const dbToken = await settingsCache.get('telegram_bot_token');
    const dbChatId = await settingsCache.get('telegram_chat_id');
    const token = (dbToken && String(dbToken).trim()) || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = (dbChatId && String(dbChatId).trim()) || process.env.TELEGRAM_CHAT_ID;
    return { token, chatId, actif: !!token && !!chatId };
  } catch {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    return { token, chatId, actif: !!token && !!chatId };
  }
}

/**
 * Envoie une notification via Telegram si configuré
 * @param {string} htmlMessage - Message formaté en HTML
 * @param {Object} [options]
 * @param {Array<{texte: string, url: string}>} [options.boutons] - Boutons inline cliquables
 */
async function envoyerTelegram(htmlMessage, { boutons = [] } = {}) {
  const { token, chatId, actif } = await getTelegramConfig();
  if (!actif || !token || !chatId) return false;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: htmlMessage,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    };

    if (Array.isArray(boutons) && boutons.length > 0) {
      // Construction de la grille de boutons inline (1 ou 2 par ligne)
      payload.reply_markup = {
        inline_keyboard: boutons
          .filter(b => b && b.texte && b.url)
          .map(b => [{ text: b.texte, url: b.url }]),
      };
    }

    await axios.post(url, payload, { timeout: 8000 });
    return true;
  } catch (err) {
    console.error('[ADMIN ALERTS] Échec envoi Telegram:', err.response?.data || err.message);
    return false;
  }
}

/**
 * Envoie une notification administrative directe sur WhatsApp
 */
async function envoyerWhatsAppAdmin({ titre, message, details, lienAction, texteAction, priorite = 'ATTENTION' }) {
  try {
    const isActif = await settingsCache.get('admin_whatsapp_alerts_actives');
    if (isActif === 'false' || isActif === false) return false;

    const adminPhone = await settingsCache.get('admin_notification_phone') || process.env.ADMIN_WHATSAPP_PHONE || '221777202086';
    if (!adminPhone) return false;

    const { sendWhatsAppNotification } = require('./whatsapp');
    const icone = priorite === 'CRITIQUE' ? '🚨' : priorite === 'ATTENTION' ? '⚠️' : 'ℹ️';

    let waText = `${icone} *[${priorite}] ALERTE ADMIN NOPALOU*\n\n`;
    waText += `*${titre}*\n\n`;
    waText += `${message}\n\n`;

    if (details) {
      const cleanDetails = details.length > 350 ? details.slice(0, 350) + '...' : details;
      waText += `📋 _Détails :_\n${cleanDetails}\n\n`;
    }

    if (lienAction) {
      waText += `👉 ${texteAction || 'Traiter immédiatement'} :\n${lienAction}\n`;
    }

    return await sendWhatsAppNotification(adminPhone, {
      title: `${icone} ${titre}`.slice(0, 60),
      textMessage: waText,
      detail: (message || titre).slice(0, 900),
      url: lienAction || 'https://nopalou.com/admin',
      type: 'service',
      fallbackSMS: priorite === 'CRITIQUE',
    });
  } catch (err) {
    console.warn('[ADMIN ALERTS] Échec envoi WhatsApp Admin:', err.message);
    return false;
  }
}

/**
 * Fonction de masquage des données sensibles (PII, secrets, tokens)
 */
function masquerDonneesSensibles(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    // Masquer téléphones sénégalais (+221 77... -> +221 77***42)
    .replace(/\b(221)?([76][0-9]{1})([0-9]{3})([0-9]{2})([0-9]{2})\b/g, '$1$2***$5')
    // Masquer adresses emails (ex: user@domain.com -> u***@domain.com)
    .replace(/\b([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]+@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g, '$1***@$2')
    // Masquer mots de passe, tokens et clés secrètes
    .replace(/(password|mot_de_passe|secret|token|api_key|authorization)[\"'\s:=]+([^\"'\s,&]+)/gi, '$1="***"');
}

/**
 * Fonction d'échappement HTML pour Telegram
 */
function escapeTelegramHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Alerter l'administrateur par Email, Telegram et/ou WhatsApp
 * Accepte un objet d'options complet ou une chaîne directe
 */
async function alerterAdmin(optionsOrText) {
  let opts = {};
  if (typeof optionsOrText === 'string') {
    opts = {
      type: 'general',
      titre: 'Alerte Système Nopalou',
      message: optionsOrText,
      priorite: 'ATTENTION',
    };
  } else if (optionsOrText && typeof optionsOrText === 'object') {
    opts = optionsOrText;
  } else {
    return { skipped: true };
  }

  const {
    type = 'general',
    titre = 'Alerte Système',
    message = '',
    details,
    lienAction,
    texteAction = 'Résoudre maintenant',
    priorite = 'ATTENTION',
    cooldownMs = DEFAULT_COOLDOWN_MS,
    force = false,
    boutons = [],
    envoyerSurWhatsApp = true,
    envoyerSurTelegram = true,
    envoyerSurEmail = true,
  } = opts;

  const now = Date.now();
  const lastTime = _cooldownCache.get(type) || 0;

  if (!force && cooldownMs > 0 && (now - lastTime < cooldownMs)) {
    const resteMinutes = Math.round((cooldownMs - (now - lastTime)) / 60000);
    console.log(`[ADMIN ALERTS] Alerte '${type}' ignorée (cooldown actif, reste ${resteMinutes} min)`);
    return { skipped: true, cooldown: true };
  }

  _cooldownCache.set(type, now);

  const icone = priorite === 'CRITIQUE' ? '🚨' : priorite === 'ATTENTION' ? '⚠️' : 'ℹ️';
  const couleurBadge = priorite === 'CRITIQUE' ? '#dc2626' : priorite === 'ATTENTION' ? '#d97706' : '#2563eb';

  console.warn(`[ADMIN ALERTS] ${icone} [${priorite}] ${titre} : ${message}`);

  const safeDetails = details ? masquerDonneesSensibles(details) : null;
  const safeMessage = message ? masquerDonneesSensibles(message) : '';

  // 1. Envoi par Email
  let emailPromise = Promise.resolve();
  if (envoyerSurEmail) {
    const htmlEmail = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: ${couleurBadge}; color: #ffffff; padding: 18px 24px; font-weight: bold; font-size: 17px; display: flex; align-items: center; gap: 10px;">
          <span>${icone} [${priorite}] Alerte Système Nopalou</span>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <h2 style="margin-top: 0; color: #0f172a; font-size: 19px;">${titre}</h2>
          <p style="font-size: 15px; margin-bottom: 16px;">${safeMessage}</p>

          ${safeDetails ? `
            <div style="background: #f8fafc; border-left: 4px solid ${couleurBadge}; padding: 12px 16px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #334155; margin-bottom: 20px; white-space: pre-wrap; word-break: break-word;">
              ${safeDetails}
            </div>
          ` : ''}

          ${lienAction ? `
            <div style="margin: 24px 0;">
              <a href="${lienAction}" style="background: ${couleurBadge}; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                👉 ${texteAction}
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b;">Lien direct : <a href="${lienAction}" style="color: #2563eb;">${lienAction}</a></p>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            Alerte automatique Nopalou à ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })} (Dakar).
          </p>
        </div>
      </div>
    `;

    emailPromise = envoyerEmail({
      to: ADMIN_EMAIL,
      subject: `${icone} [${priorite}] Nopalou : ${titre}`,
      html: htmlEmail,
    }).catch(err => {
      console.error('[ADMIN ALERTS] Échec envoi email admin:', err.message);
    });
  }

  // 2. Envoi par Telegram
  let tgPromise = Promise.resolve();
  if (envoyerSurTelegram) {
    let tgText = `${icone} <b>[${priorite}] ALERTE NOPALOU</b>\n\n`;
    tgText += `<b>${escapeTelegramHtml(titre)}</b>\n\n`;
    tgText += `${escapeTelegramHtml(safeMessage)}\n\n`;
    if (safeDetails) {
      const rawDetails = safeDetails.length > 500 ? safeDetails.slice(0, 500) + '...' : safeDetails;
      tgText += `<code>${escapeTelegramHtml(rawDetails)}</code>\n\n`;
    }
    if (lienAction && (!boutons || boutons.length === 0)) {
      tgText += `👉 <a href="${lienAction}">${escapeTelegramHtml(texteAction)}</a>\n`;
    }

    const effectiveBoutons = [...(boutons || [])];
    if (lienAction && !effectiveBoutons.some(b => b.url === lienAction)) {
      effectiveBoutons.unshift({ texte: texteAction, url: lienAction });
    }

    tgPromise = envoyerTelegram(tgText, { boutons: effectiveBoutons });
  }

  // 3. Envoi par WhatsApp (sur le 777202086 / admin_notification_phone)
  let waPromise = Promise.resolve();
  if (envoyerSurWhatsApp) {
    waPromise = envoyerWhatsAppAdmin({
      titre,
      message: safeMessage,
      details: safeDetails,
      lienAction,
      texteAction,
      priorite,
    });
  }

  await Promise.allSettled([emailPromise, tgPromise, waPromise]);
  return { success: true };
}

/**
 * 💰 1. Alerte Déclaration de Paiement Manuel (Wave / Orange Money)
 */
async function alerterPaiementManuel({
  id,
  reference,
  montant,
  methode = 'Wave/OM',
  telephone_expediteur,
  clientNom,
  preuveUrl,
}) {
  const montantFormatte = Number(montant || 0).toLocaleString('fr-FR');
  const opNom = String(methode).toUpperCase();
  const adminUrl = `https://nopalou.com/admin/paiements?q=${encodeURIComponent(reference || '')}`;

  const boutons = [{ texte: '✅ Valider le Paiement', url: adminUrl }];
  if (preuveUrl) {
    boutons.push({ texte: '📄 Voir le Reçu', url: preuveUrl });
  }

  return alerterAdmin({
    type: `paiement_manuel_${id || reference || Date.now()}`,
    priorite: 'CRITIQUE',
    titre: `Nouveau Paiement Manuel (${opNom})`,
    message: `Dépôt de ${montantFormatte} FCFA déclaré par ${clientNom ? clientNom + ' (' + telephone_expediteur + ')' : telephone_expediteur}.\nRéférence : ${reference}.`,
    details: `Opérateur : ${opNom}\nTéléphone : ${telephone_expediteur}\nRéférence : ${reference}\nPreuve : ${preuveUrl ? 'Reçu téléversé disponible' : 'ID transaction client'}`,
    lienAction: adminUrl,
    texteAction: 'Valider dans le Panel Admin',
    boutons,
    cooldownMs: 0,
    force: true,
  });
}

/**
 * 👑 2. Alerte Abonnement Boutique Activé ou Renouvelé
 */
async function alerterAbonnement({
  boutiqueNom,
  plan = 'Pro',
  montant = 0,
  utilisateurNom,
  utilisateurTel,
  fin,
}) {
  const montantFormatte = Number(montant || 0).toLocaleString('fr-FR');
  const adminUrl = 'https://nopalou.com/admin/marchands';
  const planNom = String(plan).toUpperCase();

  return alerterAdmin({
    type: `abonnement_nouveau_${boutiqueNom}_${Date.now()}`,
    priorite: 'ATTENTION',
    titre: `Nouvel Abonnement Marchand (${planNom})`,
    message: `La boutique "${boutiqueNom}" a activé la formule ${planNom} (${montantFormatte} FCFA).\nGérant : ${utilisateurNom || 'Commerçant'} (${utilisateurTel || 'N/A'}).`,
    details: `Boutique : ${boutiqueNom}\nFormule : ${planNom}\nMontant : ${montantFormatte} FCFA\nÉchéance : ${fin ? new Date(fin).toLocaleDateString('fr-FR') : 'N/A'}`,
    lienAction: adminUrl,
    texteAction: 'Gérer les Marchands',
    boutons: [{ texte: '🏪 Gérer les Marchands', url: adminUrl }],
    cooldownMs: 0,
    force: true,
  });
}

/**
 * 🚨 3. Alerte Signalement d'Abus ou Fraude
 */
async function alerterSignalement({
  id,
  type_cible = 'produit',
  cible_id,
  motif = 'Non précisé',
  description,
  auteurTel,
  auteurEmail,
}) {
  const estGrave = /arnaque|fraude|faux|escroquerie|usurpation|contrefacon/i.test(motif || '');
  const priorite = estGrave ? 'CRITIQUE' : 'ATTENTION';
  const adminUrl = 'https://nopalou.com/admin/signalements';

  return alerterAdmin({
    type: `signalement_${id || Date.now()}`,
    priorite,
    titre: `Signalement d'Abus : ${motif}`,
    message: `Un signalement a été déposé sur ${type_cible} #${cible_id}.\nMotif : "${motif}".\n${description ? 'Détail : ' + description : ''}`,
    details: `Cible : ${type_cible} #${cible_id}\nSignaleur : ${auteurTel || auteurEmail || 'Anonyme'}\nDescription : ${description || 'Aucun détail'}`,
    lienAction: adminUrl,
    texteAction: 'Traiter le Signalement',
    boutons: [{ texte: '⚖️ Ouvrir la Modération', url: adminUrl }],
    cooldownMs: 0,
    force: true,
  });
}

/**
 * ⭐ 4. Alerte Avis Client Négatif (Note <= 2 étoiles)
 */
async function alerterAvisNegatif({
  boutiqueNom = 'Boutique',
  note = 1,
  commentaire,
  clientNom,
  produitNom,
  avisId,
}) {
  const adminUrl = 'https://nopalou.com/admin/avis';

  return alerterAdmin({
    type: `avis_negatif_${avisId || Date.now()}`,
    priorite: 'ATTENTION',
    titre: `Avis Négatif Déposé (${note}/5 ⭐)`,
    message: `Un client (${clientNom || 'Anonyme'}) a laissé une note de ${note}/5 sur "${boutiqueNom}".\nCommentaire : "${commentaire || 'Aucun commentaire textuel'}"`,
    details: `Boutique : ${boutiqueNom}\nProduit : ${produitNom || 'Global'}\nClient : ${clientNom || 'Anonyme'}\nNote : ${note}/5`,
    lienAction: adminUrl,
    texteAction: 'Inspecter l\'Avis',
    boutons: [{ texte: '🔎 Modérer l\'Avis', url: adminUrl }],
    cooldownMs: 0,
    force: true,
  });
}

/**
 * 🎫 5. Alerte Ticket Helpdesk & Support Client
 */
async function alerterSupportTicket({
  numeroTicket,
  sujet,
  priorite = 'normale',
  contactNom,
  contactTel,
  message,
  cmdRef,
}) {
  const estUrgent = priorite === 'urgente' || /remboursement|vol|arnaque|bloqu/i.test(sujet || '');
  const adminUrl = 'https://nopalou.com/admin/support';
  const boutons = [{ texte: '🎫 Ouvrir le Ticket', url: adminUrl }];

  if (contactTel) {
    const cleanTel = String(contactTel).replace(/\D/g, '');
    boutons.push({
      texte: '💬 WhatsApp Client',
      url: `https://wa.me/${cleanTel.startsWith('221') ? cleanTel : '221' + cleanTel}`,
    });
  }

  return alerterAdmin({
    type: `ticket_support_${numeroTicket}`,
    priorite: estUrgent ? 'CRITIQUE' : 'ATTENTION',
    titre: `Nouveau Ticket Support (${numeroTicket})`,
    message: `Demande de ${contactNom || 'Client'} (${contactTel || 'N/A'}) :\nSujet : "${sujet}"\nPriorité : ${priorite.toUpperCase()}${cmdRef ? '\nCommande : ' + cmdRef : ''}`,
    details: message ? (message.length > 300 ? message.slice(0, 300) + '...' : message) : 'N/A',
    lienAction: adminUrl,
    texteAction: 'Accéder au Helpdesk',
    boutons,
    cooldownMs: 0,
    force: estUrgent,
  });
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
    cooldownMs: 30 * 60 * 1000,
    envoyerSurWhatsApp: false, // Inutile d'envoyer sur WhatsApp si WhatsApp est en panne !
  });
}

module.exports = {
  alerterAdmin,
  alerterWhatsAppPanne,
  alerterPaiementManuel,
  alerterAbonnement,
  alerterSignalement,
  alerterAvisNegatif,
  alerterSupportTicket,
  envoyerTelegram,
  envoyerWhatsAppAdmin,
};
