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

let _blacklistCache = new Set();
let _lastBlacklistCheck = 0;

async function estDesinscrit(phone) {
  if (!phone) return false;
  const norm = normalisePhone(phone);
  const now = Date.now();
  if (now - _lastBlacklistCheck > 20000) {
    try {
      const { pool } = require('../models/db');
      const r = await pool.query('SELECT phone FROM whatsapp_blacklist');
      _blacklistCache = new Set(r.rows.map(row => normalisePhone(row.phone)));
      _lastBlacklistCheck = now;
    } catch {}
  }
  return _blacklistCache.has(norm);
}

async function ajouterBlacklist(phone, reason = 'optout') {
  const norm = normalisePhone(phone);
  _blacklistCache.add(norm);
  try {
    const { pool } = require('../models/db');
    await pool.query(
      `INSERT INTO whatsapp_blacklist (phone, reason, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (phone) DO UPDATE SET reason = $2, created_at = NOW()`,
      [norm, reason]
    );
  } catch (err) {
    console.error('[WHATSAPP BLACKLIST INSERT ERR]:', err.message);
  }
}

async function retirerBlacklist(phone) {
  const norm = normalisePhone(phone);
  _blacklistCache.delete(norm);
  try {
    const { pool } = require('../models/db');
    await pool.query('DELETE FROM whatsapp_blacklist WHERE phone = $1', [norm]);
  } catch (err) {
    console.error('[WHATSAPP BLACKLIST DELETE ERR]:', err.message);
  }
}

async function post(payload) {
  if (!guard()) return;
  if (payload?.to && await estDesinscrit(payload.to)) {
    console.log(`[WHATSAPP BLACKLISTED] Message ignoré pour le numéro désinscrit ${payload.to}`);
    return { success: false, reason: 'blacklisted' };
  }
  try {
    const { data } = await axios.post(apiUrl(), payload, { headers: headers() });
    return data;
  } catch (err) {
    console.error('[WHATSAPP] Erreur:', err.response?.data?.error?.message || err.message);
    throw err;
  }
}

// ── Texte libre (existant) ────────────────────────────────────────────────────
async function sendWhatsAppText(phone, message) {
  try {
    return await post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalisePhone(phone),
      type: 'text',
      text: { body: message, preview_url: false },
    });
  } catch (err) {
    const metaError = err.response?.data?.error;
    if (metaError?.code === 131047 || metaError?.message?.includes('24 hours')) {
      console.warn(`[WHATSAPP 24H WINDOW RESTRICTION] ⚠️ Impossible d'envoyer le message texte libre à ${phone} (Fenêtre 24h Meta fermée). Tentative d'envoi par template...`);
      try {
        return await sendWhatsAppTemplate(phone, 'hello_world');
      } catch (tErr) {
        console.error(`[WHATSAPP TEMPLATE FALLBACK ERR]:`, tErr.response?.data?.error?.message || tErr.message);
      }
    }
    throw err;
  }
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

// ── "Carousel" (en réalité : templates à 1 carte, envoyés en série) ──────────
// Malgré leur nom, nopalou_carousel_immo/annonce ne sont PAS de vrais templates
// Carousel Meta (l'option n'existe pas dans l'interface actuelle) — ce sont de
// simples templates BODY à 3 paramètres (titre, prix, lien complet) + un bouton
// URL à 1 paramètre (l'id, l'URL de base étant fixée côté template Meta).
// nopalou_carousel_immo a été approuvé par Meta en langue "en" (pas "fr").
// cards = [{ title, detail, pageUrl }] (imageUrl ignoré — pas de header dans ce template)
const CAROUSEL_LANG = { nopalou_carousel_immo: 'en' };

async function sendWhatsAppCarousel(phone, templateName, cards) {
  const lang = CAROUSEL_LANG[templateName] || 'fr';
  let dernier;
  for (const c of cards) {
    dernier = await post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalisePhone(phone),
      type: 'template',
      template: {
        name: templateName,
        language: { code: lang },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: c.title },
              { type: 'text', text: c.detail },
              { type: 'text', text: c.pageUrl },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: c.pageUrl.split('/').pop() }],
          },
        ],
      },
    });
  }
  return dernier;
}

// ── Interactive List Message (menu chatbot) ───────────────────────────────────
// sections = [{ title, rows: [{ id, title, description }] }]
async function sendWhatsAppInteractive(phone, headerText, bodyText, sections) {
  const sanitizedSections = (sections || []).map(s => ({
    title: (s.title || '').slice(0, 24),
    rows: (s.rows || []).map(r => ({
      id: r.id,
      title: (r.title || '').slice(0, 24),
      ...(r.description ? { description: r.description.slice(0, 72) } : {}),
    })),
  }));

  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: (headerText || '').slice(0, 60) },
      body: { text: bodyText },
      footer: { text: 'Nopalou — Comparez les prix au Sénégal' },
      action: {
        button: 'Sélectionner ▾',
        sections: sanitizedSections,
      },
    },
  });
}

// ── 3 Boutons de réponse rapide ───────────────────────────────────────────────
async function sendWhatsAppButtons3(phone, bodyText, buttons) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.slice(0, 3).map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

// ── Bouton de réponse rapide (ex: retour au menu) ─────────────────────────────
async function sendWhatsAppButton(phone, bodyText, buttonId, buttonTitle) {
  return sendWhatsAppButtons3(phone, bodyText, [{ id: buttonId, title: buttonTitle }]);
}

// ── Bouton "Menu" + "Non merci" (fin d'action, cf. sendWhatsAppButton) ────────
async function sendWhatsAppMenuOuFin(phone, bodyText) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'menu', title: 'Menu' } },
          { type: 'reply', reply: { id: 'fin', title: 'Non merci 😊' } },
        ],
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

// ── Read receipt (+ indicateur de frappe) ─────────────────────────────────────
// Le typing indicator se pose via le read receipt, pas via un message séparé.
async function sendReadReceipt(messageId, withTyping = false) {
  return post({
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
    ...(withTyping ? { typing_indicator: { type: 'text' } } : {}),
  });
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
    // Nota : le bouton du template nopalou_fiche_texte pointe vers une URL fixe
    // https://nopalou.com/immo/{{1}} côté Meta — le lien sera donc incorrect pour
    // une annonce classifiée tant qu'un template dédié n'est pas soumis à Meta.
    return sendWhatsAppTemplate(phone, 'nopalou_fiche_texte', [
      { type: 'body', parameters: [{ type: 'text', text: a.titre }, { type: 'text', text: prixFmt(a.prix) }, { type: 'text', text: `${SITE}/annonces/${a.id}` }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: a.id }] },
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
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: a.id }] },
    ]);
  }

  if (type === 'produit') {
    const r = await pool.query(
      'SELECT p.*, b.slug AS boutique_slug, b.nom AS boutique_nom FROM boutique_produits p JOIN boutiques b ON b.id=p.boutique_id WHERE p.id=$1',
      [id]
    );
    const p = r.rows[0];
    if (!p) throw new Error('Produit introuvable');
    return sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.nom} — ${prixFmt(p.prix)}\n📍 *${p.boutique_nom}*\n\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`
    );
  }

  if (type === 'telecom') {
    const r = await pool.query('SELECT * FROM forfaits_telecom WHERE id=$1', [id]);
    const o = r.rows[0];
    if (!o) throw new Error('Offre télécom introuvable');
    return sendWhatsAppTemplate(phone, 'nopalou_carousel_telecoms', [
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
  sendWhatsAppButton,
  sendWhatsAppButtons3,
  sendWhatsAppMenuOuFin,
  sendWhatsAppProduct,
  sendReadReceipt,
  sendFiche,
  normalisePhone,
  estDesinscrit,
  ajouterBlacklist,
  retirerBlacklist,
};
