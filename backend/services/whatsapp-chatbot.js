// backend/services/whatsapp-chatbot.js
const { pool } = require('../models/db');
const {
  sendWhatsAppText,
  sendWhatsAppInteractive,
  sendWhatsAppCarousel,
  sendWhatsAppProduct,
  sendReadReceipt,
  normalisePhone,
} = require('./whatsapp');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
const prixFmt = (p) => p ? new Intl.NumberFormat('fr-FR').format(p) + ' FCFA' : 'N/C';

// ── Session DB ────────────────────────────────────────────────────────────────
async function getSession(phone) {
  const r = await pool.query(
    'SELECT state, context FROM whatsapp_sessions WHERE phone=$1',
    [phone]
  );
  return r.rows[0] || { state: 'IDLE', context: {} };
}

async function setSession(phone, state, context = {}) {
  await pool.query(
    `INSERT INTO whatsapp_sessions(phone, state, context, updated_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT(phone) DO UPDATE SET state=$2, context=$3, updated_at=NOW()`,
    [phone, state, JSON.stringify(context)]
  );
}

// ── Nettoyage périodique ─────────────────────────────────────────────────────
async function cleanupOldMessages() {
  await pool.query(
    `DELETE FROM whatsapp_processed_messages WHERE processed_at < NOW() - INTERVAL '7 days'`
  );
}

async function resetInactiveSessions() {
  await pool.query(
    `UPDATE whatsapp_sessions SET state='IDLE', context='{}', updated_at=NOW()
     WHERE state != 'IDLE' AND updated_at < NOW() - INTERVAL '1 hour'`
  );
}

// ── Déduplication ─────────────────────────────────────────────────────────────
async function isDuplicate(messageId) {
  const r = await pool.query(
    `INSERT INTO whatsapp_processed_messages(message_id) VALUES($1)
     ON CONFLICT DO NOTHING RETURNING message_id`,
    [messageId]
  );
  return r.rows.length === 0; // true = déjà traité
}

// ── Menu principal ────────────────────────────────────────────────────────────
async function sendMenu(phone) {
  await sendWhatsAppInteractive(
    phone,
    '🛍️ Nopalou',
    'Comment puis-je vous aider ?',
    [
      {
        title: 'Découvrir',
        rows: [
          { id: 'search',  title: '🔍 Rechercher',      description: 'Trouver un produit ou annonce' },
          { id: 'immo',    title: '🏠 Annonces immo',   description: 'Maisons, appartements, terrains' },
          { id: 'telecom', title: '📱 Offres télécom',  description: 'Mobile, internet, forfaits' },
        ],
      },
      {
        title: 'Mon compte',
        rows: [
          { id: 'alert',   title: '🔔 Alerte prix',     description: 'Être notifié d\'une baisse' },
          { id: 'order',   title: '📦 Suivre commande', description: 'Statut de votre paiement' },
          { id: 'support', title: '💬 Support',         description: 'Contacter l\'équipe Nopalou' },
        ],
      },
    ]
  );
}

// ── Recherche full-text ───────────────────────────────────────────────────────
async function searchContent(query) {
  const r = await pool.query(
    `(
      SELECT 'produit' AS type, p.id::text, p.nom AS titre, p.prix,
             p.images[1] AS photo, b.slug AS boutique_slug, NULL AS ville
      FROM boutique_produits p
      JOIN boutiques b ON b.id = p.boutique_id
      WHERE to_tsvector('french', p.nom || ' ' || COALESCE(p.description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'annonce', id::text, titre, prix, (photos->>0), NULL::text, NULL::text
      FROM annonces_classifiees
      WHERE actif=true AND supprimee=false
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'immo', id::text, titre, prix, (photos->>0), NULL::text, ville
      FROM annonces_immo
      WHERE actif=true
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    LIMIT 3`,
    [query]
  );
  return r.rows;
}

// ── Dispatcher principal ──────────────────────────────────────────────────────
async function handleIncoming(msg) {
  const phone = normalisePhone(msg.from);

  // Déduplication
  if (await isDuplicate(msg.id)) return;

  // Read receipt + indicateur de frappe pendant le traitement
  await sendReadReceipt(msg.id, true).catch(() => {});

  const { state, context } = await getSession(phone);
  const text = msg.text?.body?.trim() || '';
  const interactiveId = msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || '';

  // Mots-clés globaux : "menu" ou "aide" depuis n'importe quel état
  if (['menu', 'aide', 'help', '0'].includes(text.toLowerCase())) {
    await setSession(phone, 'IDLE', {});
    await sendMenu(phone);
    return;
  }

  // ── IDLE → envoyer le menu ─────────────────────────────────────────────────
  if (state === 'IDLE') {
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // ── MENU → réponse au menu interactif ─────────────────────────────────────
  if (state === 'MENU') {
    const action = interactiveId || text.toLowerCase();

    if (action === 'search') {
      await setSession(phone, 'SEARCH_QUERY', {});
      await sendWhatsAppText(phone, '🔍 Que recherchez-vous ? (ex: télévision Samsung, canapé, forfait Tigo...)');
      return;
    }
    if (action === 'immo') {
      const r = await pool.query(
        `SELECT id, titre, prix, (photos->>0) AS photo FROM annonces_immo WHERE actif=true ORDER BY created_at DESC LIMIT 3`
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Aucune annonce immo disponible pour le moment.');
      } else {
        const cards = r.rows.map(a => ({
          imageUrl: a.photo || null,
          title: a.titre,
          detail: prixFmt(a.prix),
          pageUrl: `${SITE}/immo/${a.id}`,
        }));
        await sendWhatsAppCarousel(phone, 'nopalou_carousel_immo', cards).catch(() =>
          sendWhatsAppText(phone, cards.map(c => `• ${c.title} — ${c.detail}\n${c.pageUrl}`).join('\n\n'))
        );
      }
      await sendWhatsAppText(phone, 'Tapez *menu* pour revenir au menu.');
      await setSession(phone, 'IDLE', {});
      return;
    }
    if (action === 'telecom') {
      const r = await pool.query(
        `SELECT id, nom, operateur, prix FROM forfaits_telecom WHERE actif=true ORDER BY created_at DESC LIMIT 5`
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Aucune offre télécom disponible pour le moment.');
      } else {
        const lines = r.rows.map(o => `📱 *${o.nom || o.operateur}* — ${prixFmt(o.prix)}\n👉 ${SITE}/telecom`);
        await sendWhatsAppText(phone, lines.join('\n\n'));
      }
      await sendWhatsAppText(phone, 'Tapez *menu* pour revenir au menu.');
      await setSession(phone, 'IDLE', {});
      return;
    }
    if (action === 'alert') {
      await setSession(phone, 'ALERT_PRODUCT', { phone });
      await sendWhatsAppText(phone, '🔔 Quel produit voulez-vous surveiller ? (ex: iPhone 15, Samsung TV 55")');
      return;
    }
    if (action === 'order') {
      await setSession(phone, 'ORDER_REF', {});
      await sendWhatsAppText(phone, '📦 Entrez votre référence de commande (ex: PAY-12345) :');
      return;
    }
    if (action === 'support') {
      await sendWhatsAppText(phone, '💬 *Support Nopalou*\n\nPour nous contacter :\n📧 contact@nopalou.com\n🌐 nopalou.com\n\nNous répondons sous 24h. Merci !\n\nTapez *menu* pour revenir au menu.');
      await setSession(phone, 'IDLE', {});
      return;
    }
    // Texte libre reçu en état MENU → traiter comme recherche
    await setSession(phone, 'SEARCH_QUERY', {});
    await handleSearchQuery(phone, text);
    return;
  }

  // ── SEARCH_QUERY ──────────────────────────────────────────────────────────
  if (state === 'SEARCH_QUERY') {
    await handleSearchQuery(phone, text);
    return;
  }

  // ── ALERT_PRODUCT ─────────────────────────────────────────────────────────
  if (state === 'ALERT_PRODUCT') {
    await setSession(phone, 'ALERT_PRICE', { phone, produit_nom: text });
    await sendWhatsAppText(phone, `🎯 À quel prix voulez-vous être alerté pour *${text}* ? (en FCFA, ex: 150000)`);
    return;
  }

  // ── ALERT_PRICE ───────────────────────────────────────────────────────────
  if (state === 'ALERT_PRICE') {
    const prix = parseInt(text.replace(/[^\d]/g, ''), 10);
    if (!prix || prix < 100) {
      await sendWhatsAppText(phone, '⚠️ Montant invalide. Entrez un prix en FCFA (ex: 150000) :');
      return;
    }
    await pool.query(
      `INSERT INTO alertes (telephone, produit_nom, prix_cible, active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT DO NOTHING`,
      [phone, context.produit_nom, prix]
    );
    await sendWhatsAppText(
      phone,
      `✅ *Alerte créée !*\n\nJe vous notifierai dès que *${context.produit_nom}* passe sous *${prixFmt(prix)}*.\n\nTapez *menu* pour revenir au menu.`
    );
    await setSession(phone, 'IDLE', {});
    return;
  }

  // ── ORDER_REF ─────────────────────────────────────────────────────────────
  if (state === 'ORDER_REF') {
    const r = await pool.query(
      `SELECT reference, statut, montant, created_at FROM commandes WHERE reference ILIKE $1 LIMIT 1`,
      [text.trim()]
    );
    if (!r.rows[0]) {
      await sendWhatsAppText(phone, `❌ Commande *${text}* introuvable. Vérifiez la référence ou tapez *menu*.`);
    } else {
      const p = r.rows[0];
      const date = new Date(p.created_at).toLocaleDateString('fr-FR');
      await sendWhatsAppText(
        phone,
        `📦 *Commande ${p.reference}*\n\nStatut : *${p.statut}*\nMontant : *${prixFmt(p.montant)}*\nDate : ${date}\n\nPour toute question, contactez contact@nopalou.com\n\nTapez *menu* pour revenir au menu.`
      );
    }
    await setSession(phone, 'IDLE', {});
    return;
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  await setSession(phone, 'IDLE', {});
  await sendMenu(phone);
}

async function handleSearchQuery(phone, query) {
  if (!query || query.length < 2) {
    await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 caractères.');
    return;
  }
  const results = await searchContent(query);
  if (!results.length) {
    await sendWhatsAppText(phone, `😕 Aucun résultat pour *"${query}"*.\n\nEssayez avec d'autres mots-clés ou tapez *menu*.`);
    await setSession(phone, 'IDLE', {});
    return;
  }

  const produits = results.filter(r => r.type === 'produit');
  const autres   = results.filter(r => r.type !== 'produit');

  // Product Messages pour les produits boutique
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
  }

  // Carousel pour annonces/immo
  if (autres.length) {
    const cards = autres.map(a => ({
      imageUrl: a.photo || null,
      title:    a.titre,
      detail:   prixFmt(a.prix),
      pageUrl:  `${SITE}/${a.type === 'immo' ? 'immo' : 'annonces'}/${a.id}`,
    }));
    const template = autres[0]?.type === 'immo' ? 'nopalou_carousel_immo' : 'nopalou_carousel_annonce';
    await sendWhatsAppCarousel(phone, template, cards).catch(async () => {
      const lines = cards.map(c => `• *${c.title}* — ${c.detail}\n${c.pageUrl}`);
      await sendWhatsAppText(phone, lines.join('\n\n'));
    });
  }

  await sendWhatsAppText(phone, `\nTapez *menu* pour revenir au menu ou faites une nouvelle recherche.`);
  await setSession(phone, 'IDLE', {});
}

module.exports = { handleIncoming, cleanupOldMessages, resetInactiveSessions };
