// backend/services/whatsapp.js — Meta Cloud API v18.0
const axios = require('axios');

const PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN      = process.env.WHATSAPP_API_TOKEN;
const CATALOG_ID = process.env.WHATSAPP_CATALOG_ID;
const SITE       = process.env.FRONTEND_URL || 'https://nopalou.com';

function normalisePhone(phone) {
  let num = String(phone).replace(/[^\d]/g, '');
  if (num.startsWith('00221')) num = num.slice(2);
  if (num.length === 9) num = '221' + num;
  return num;
}

function apiUrl() {
  return `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
}

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

function guard() {
  if (!PHONE_ID || !TOKEN) {
    console.log('[WHATSAPP] Credentials manquants — ignoré');
    return false;
  }
  return true;
}

async function post(payload) {
  if (!guard()) return;
  try {
    const { data } = await axios.post(apiUrl(), payload, { headers: headers() });
    return data;
  } catch (err) {
    console.error('[WHATSAPP] Erreur:', err.response?.data?.error?.message || err.message);
  }
}

// ── Texte libre (existant) ────────────────────────────────────────────────────
async function sendWhatsAppText(phone, message) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'text',
    text: { body: message, preview_url: false },
  });
}

// ── Template simple (image ou texte) ─────────────────────────────────────────
async function sendWhatsAppTemplate(phone, templateName, components = []) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'fr' },
      components,
    },
  });
}

// ── Carousel Template (plusieurs cartes) ─────────────────────────────────────
// cards = [{ imageUrl, title, detail, pageUrl }] (max 10)
async function sendWhatsAppCarousel(phone, templateName, cards) {
  const carouselCards = cards.map((c, i) => ({
    card_index: i,
    components: [
      {
        type: 'header',
        parameters: c.imageUrl
          ? [{ type: 'image', image: { link: c.imageUrl } }]
          : [],
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: c.title },
          { type: 'text', text: c.detail },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: c.pageUrl }],
      },
    ],
  }));

  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'fr' },
      components: [{ type: 'carousel', cards: carouselCards }],
    },
  });
}

// ── Interactive List Message (menu chatbot) ───────────────────────────────────
// sections = [{ title, rows: [{ id, title, description }] }]
async function sendWhatsAppInteractive(phone, headerText, bodyText, sections) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: headerText },
      body: { text: bodyText },
      footer: { text: 'Nopalou — Comparez les prix au Sénégal' },
      action: {
        button: 'Sélectionner ▾',
        sections,
      },
    },
  });
}

// ── Product Message (catalogue Meta Commerce) ─────────────────────────────────
async function sendWhatsAppProduct(phone, retailerProductId, bodyText) {
  if (!CATALOG_ID) {
    console.log('[WHATSAPP] CATALOG_ID manquant — fallback texte');
    return sendWhatsAppText(phone, bodyText);
  }
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'interactive',
    interactive: {
      type: 'product',
      body: { text: bodyText },
      action: {
        catalog_id: CATALOG_ID,
        product_retailer_id: retailerProductId,
      },
    },
  });
}

// ── Read receipt ──────────────────────────────────────────────────────────────
async function sendReadReceipt(messageId) {
  return post({
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  });
}

// ── Typing indicator ──────────────────────────────────────────────────────────
// Nota : supporté sur certains comptes Cloud API uniquement
async function sendTyping(phone) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'action',
    action: { name: 'typing_on' },
  }).catch(() => {}); // silencieux si non supporté
}

// ── Dispatcher /send ──────────────────────────────────────────────────────────
async function sendFiche(type, id, phone) {
  const { pool } = require('../models/db');
  const prixFmt = (p) => p ? new Intl.NumberFormat('fr-FR').format(p) + ' FCFA' : 'Prix non précisé';

  if (type === 'annonce') {
    const r = await pool.query('SELECT * FROM annonces_classifiees WHERE id=$1', [id]);
    const a = r.rows[0];
    if (!a) throw new Error('Annonce introuvable');
    const cards = [{
      imageUrl: a.photos?.[0] || null,
      title: a.titre,
      detail: prixFmt(a.prix),
      pageUrl: `${SITE}/annonces/${a.id}`,
    }];
    if (a.photos?.[0]) {
      return sendWhatsAppCarousel(phone, 'nopalou_carousel_annonce', cards);
    }
    return sendWhatsAppTemplate(phone, 'nopalou_fiche_texte', [
      { type: 'body', parameters: [{ type: 'text', text: a.titre }, { type: 'text', text: prixFmt(a.prix) }, { type: 'text', text: `${SITE}/annonces/${a.id}` }] },
    ]);
  }

  if (type === 'immo') {
    const r = await pool.query('SELECT * FROM annonces_immo WHERE id=$1', [id]);
    const a = r.rows[0];
    if (!a) throw new Error('Annonce immo introuvable');
    const detail = [a.type_bien, a.ville, prixFmt(a.prix)].filter(Boolean).join(' — ');
    const cards = [{
      imageUrl: a.photos?.[0] || null,
      title: a.titre,
      detail,
      pageUrl: `${SITE}/immo/${a.id}`,
    }];
    if (a.photos?.[0]) {
      return sendWhatsAppCarousel(phone, 'nopalou_carousel_immo', cards);
    }
    return sendWhatsAppTemplate(phone, 'nopalou_fiche_texte', [
      { type: 'body', parameters: [{ type: 'text', text: a.titre }, { type: 'text', text: detail }, { type: 'text', text: `${SITE}/immo/${a.id}` }] },
    ]);
  }

  if (type === 'produit') {
    const r = await pool.query(
      'SELECT p.*, b.slug AS boutique_slug FROM boutique_produits p JOIN boutiques b ON b.id=p.boutique_id WHERE p.id=$1',
      [id]
    );
    const p = r.rows[0];
    if (!p) throw new Error('Produit introuvable');
    return sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.nom} — ${prixFmt(p.prix)}\n\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`
    );
  }

  if (type === 'telecom') {
    const r = await pool.query('SELECT * FROM forfaits_telecom WHERE id=$1', [id]);
    const o = r.rows[0];
    if (!o) throw new Error('Offre télécom introuvable');
    return sendWhatsAppTemplate(phone, 'nopalou_carousel_telecom', [
      { type: 'body', parameters: [{ type: 'text', text: o.nom || o.operateur }, { type: 'text', text: prixFmt(o.prix) }, { type: 'text', text: `${SITE}/telecom` }] },
    ]);
  }

  throw new Error(`Type inconnu : ${type}`);
}

module.exports = {
  sendWhatsAppText,
  sendWhatsAppTemplate,
  sendWhatsAppCarousel,
  sendWhatsAppInteractive,
  sendWhatsAppProduct,
  sendReadReceipt,
  sendTyping,
  sendFiche,
  normalisePhone,
};
