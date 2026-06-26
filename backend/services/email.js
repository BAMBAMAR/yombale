// backend/services/email.js — Envoi d'emails via l'API Resend (https://resend.com)
//
// Variables d'env requises :
//   RESEND_API_KEY — clé API Resend
//   EMAIL_FROM     — adresse d'expédition (ex: "Nopalou <onboarding@resend.dev>"
//                     ou "Nopalou <noreply@votredomaine.com>" une fois le domaine vérifié)

const axios = require('axios');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM     = process.env.EMAIL_FROM || 'Nopalou <onboarding@resend.dev>';

if (process.env.NODE_ENV === 'production' && (!process.env.EMAIL_FROM || process.env.EMAIL_FROM.includes('resend.dev'))) {
  console.error('[EMAIL] ⚠️  EMAIL_FROM non configuré ou utilise le domaine sandbox Resend — les emails partiront depuis onboarding@resend.dev. Configurez EMAIL_FROM avec votre domaine vérifié.');
}

async function envoyerEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY non configurée — email non envoyé:', subject, '→', to);
    return { skipped: true };
  }
  try {
    const r = await axios.post('https://api.resend.com/emails', {
      from: EMAIL_FROM, to, subject, html,
    }, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    });
    return r.data;
  } catch (err) {
    console.error('[EMAIL] Erreur envoi:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { envoyerEmail };
