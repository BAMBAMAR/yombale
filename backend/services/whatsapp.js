// backend/services/whatsapp.js — Envoi de messages WhatsApp via Meta Cloud API
const axios = require('axios');

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN    = process.env.WHATSAPP_API_TOKEN;
const BASE_URL = () => `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;

function normalisePhone(phone) {
  return String(phone).replace(/[^\d]/g, '');
}

async function sendWhatsAppText(phone, message) {
  if (!PHONE_ID || !TOKEN) {
    console.log('[WHATSAPP] Credentials manquants — message ignoré');
    return;
  }
  try {
    const { data } = await axios.post(
      BASE_URL(),
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalisePhone(phone),
        type: 'text',
        text: { body: message, preview_url: false },
      },
      { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } }
    );
    console.log(`[WHATSAPP] Envoyé à ${normalisePhone(phone)} — id: ${data.messages?.[0]?.id}`);
    return data;
  } catch (err) {
    console.error('[WHATSAPP] Erreur envoi:', err.response?.data?.error?.message || err.message);
  }
}

module.exports = { sendWhatsAppText };
