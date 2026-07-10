// backend/services/whatsapp-chatbot.js
const { pool } = require('../models/db');
const {
  sendWhatsAppText,
  sendWhatsAppInteractive,
  sendWhatsAppCarousel,
  sendWhatsAppProduct,
  sendWhatsAppButton,
  sendWhatsAppMenuOuFin,
  sendReadReceipt,
  normalisePhone,
} = require('./whatsapp');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
const prixFmt = (p) => p ? new Intl.NumberFormat('fr-FR').format(p) + ' FCFA' : 'N/C';
const attendre = (ms) => new Promise(r => setTimeout(r, ms));

// ── FAQ par mots-clés — questions sur le fonctionnement du site ───────────────
// Chaque entrée : mots-clés à détecter dans le texte libre (sans accents, minuscule) + réponse.
// Testée avant la recherche produit/annonce pour éviter des requêtes SQL inutiles.
const FAQ = [
  {
    motsCles: ['gratuit', 'payant', 'coute', 'couter', 'prix nopalou'],
    reponse: '✅ *Nopalou est 100% gratuit* pour comparer les prix, chercher une annonce ou un bien immo.\n\nSeuls certains services optionnels sont payants : publier une annonce (à partir de 1 500 FCFA), booster une annonce, ou créer une boutique en ligne (abonnement Pro/Business).',
  },
  {
    motsCles: ['publier', 'deposer', 'vendre', 'poster annonce'],
    reponse: '📢 *Publier une annonce*\n\nSur le site, cliquez "+ Déposer" puis "Publier une annonce". Ajoutez photos, prix et description — votre annonce est visible après validation par notre équipe.\n👉 ' + SITE + '/deposer-annonce',
  },
  {
    motsCles: ['louer mon', 'vendre mon appartement', 'vendre ma maison', 'annonce immo', 'bien immo'],
    reponse: '🏠 *Publier un bien immobilier*\n\nSur le site, cliquez "+ Déposer" puis "Publier un bien immo". Ajoutez photos, prix, ville et description — visible après validation.\n👉 ' + SITE + '/deposer-immo',
  },
  {
    motsCles: ['boutique', 'vendre en ligne'],
    reponse: '🛍️ *Créer votre boutique*\n\nVendez directement sur Nopalou : catalogue produits, statistiques, mise en avant. Formules Pro (15 000 FCFA/mois) et Business (35 000 FCFA/mois, 2% de commission).\n👉 ' + SITE + '/boutique',
  },
  {
    motsCles: ['comparer', 'meilleur prix', 'moins cher'],
    reponse: '📊 *Comparer les prix*\n\nSur le site, tapez le nom d\'un produit dans la barre de recherche — Nopalou compare automatiquement les prix chez tous les marchands partenaires (Jumia, Expat-Dakar, CoinAfrique...) et affiche le moins cher.\n👉 ' + SITE,
  },
  {
    motsCles: ['favoris', 'sauvegarder'],
    reponse: '❤️ *Favoris*\n\nSur le site, cliquez le cœur ❤ sur un produit ou une annonce pour le sauvegarder. Retrouvez tous vos favoris dans la page Favoris, sans inscription requise.\n👉 ' + SITE + '/favoris',
  },
  {
    motsCles: ['apporteur', 'parrainage', 'commission'],
    reponse: '💼 *Programme apporteur d\'affaires*\n\nPrésentez Nopalou aux commerçants de votre réseau et touchez une commission chaque mois sur les abonnements des boutiques que vous recrutez — sans investissement.\n👉 ' + SITE + '/compte/apporteur',
  },
  {
    motsCles: ['forfait', 'internet', 'telecom', 'orange', 'free', 'expresso'],
    reponse: '📱 *Comparer les forfaits télécom*\n\nSur le site, comparez tous les forfaits mobiles Orange, Free, Expresso et Wave : data, appels, SMS, prix.\n👉 ' + SITE + '/telecom',
  },
  {
    motsCles: ['comment ça marche', 'comment ca marche', 'comment utiliser', 'aide site', 'utiliser nopalou', 'utiliser le site'],
    reponse: '📖 *Comment utiliser Nopalou*\n\n🔍 Comparez les prix produits\n🏆 Guide d\'achat personnalisé\n🏡 Trouvez un logement\n📶 Comparez les forfaits télécom\n⚖️ Comparez côte à côte\n❤️ Sauvegardez vos favoris\n🔔 Créez des alertes de prix\n📢 Publiez une annonce\n\nGuide complet : ' + SITE + '/guide-emploi',
  },
];

function normaliserTexte(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function detecterFAQ(texte) {
  const normalise = normaliserTexte(texte);
  return FAQ.find(f => f.motsCles.some(mot => normalise.includes(normaliserTexte(mot))));
}

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
          { id: 'guide',   title: 'ℹ️ Comment ça marche', description: 'Utiliser le site Nopalou' },
        ],
      },
    ]
  );
}

// ── Recherche full-text ───────────────────────────────────────────────────────
async function searchContent(query) {
  const r = await pool.query(
    `(
      SELECT 'marketplace' AS type, id::text, nom AS titre, prix_min AS prix,
             image_url AS photo, NULL::text AS boutique_slug, NULL::text AS boutique_nom, NULL::text AS ville
      FROM produits
      WHERE to_tsvector('french', nom || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'produit', p.id::text, p.nom AS titre, p.prix,
             p.images[1] AS photo, b.slug AS boutique_slug, b.nom AS boutique_nom, NULL AS ville
      FROM boutique_produits p
      JOIN boutiques b ON b.id = p.boutique_id
      WHERE to_tsvector('french', p.nom || ' ' || COALESCE(p.description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'annonce', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, NULL::text
      FROM annonces_classifiees
      WHERE actif=true AND supprimee=false AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'immo', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, ville
      FROM annonces_immo
      WHERE actif=true AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    LIMIT 5`,
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

  const SALUTATIONS = ['menu', 'aide', 'help', '0', 'bonjour', 'bonsoir', 'salut', 'slt', 'hello', 'coucou'];
  const CLOTURE = ['merci', 'merci beaucoup', 'ok merci', 'c\'est bon', 'cest bon', 'au revoir', 'bye', 'a bientot', 'à bientôt', 'non merci', 'ça ira', 'ca ira', 'c\'est tout', 'cest tout'];

  // ── IDLE → présentation puis menu (nouvelle session ou session expirée) ────
  if (state === 'IDLE') {
    await sendWhatsAppText(
      phone,
      '👋 Bienvenue sur *Nopalou* !\n\nJe suis votre assistant — je peux comparer des prix, vous montrer des annonces immo ou des offres télécom, créer une alerte de prix, suivre une commande ou répondre à vos questions sur le site. 100% gratuit, disponible 24h/24.'
    );
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // Mots-clés globaux : "menu", "aide" ou une salutation depuis n'importe quel état actif
  if (SALUTATIONS.includes(text.toLowerCase()) || interactiveId === 'menu') {
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // ── Fin de conversation : clôture polie + sondage satisfaction ─────────────
  // Déclenchée soit par le bouton "Non merci", soit par une formule de clôture tapée en texte libre.
  if (interactiveId === 'fin' || CLOTURE.includes(normaliserTexte(text))) {
    await sendWhatsAppText(phone, 'Merci de nous avoir écrit ! 🙏 Nopalou vous souhaite une excellente journée.');
    await sendWhatsAppButton(phone, 'Êtes-vous satisfait(e) de cet échange ?', 'sat_oui', '🙂 Oui, c\'est bien').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }
  if (interactiveId === 'sat_oui' || interactiveId === 'sat_non') {
    await sendWhatsAppText(phone, 'Merci beaucoup pour votre retour ! 😊 À très vite sur Nopalou.');
    await setSession(phone, 'MENU', {});
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
        `SELECT id, titre, prix, (photos->>0) AS photo FROM annonces_immo
         WHERE actif=true AND jsonb_array_length(photos) > 0
         ORDER BY created_at DESC LIMIT 3`
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
        await attendre(1200); // laisse le temps aux messages du carousel de s'afficher avant le bouton
      }
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
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
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
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
      await sendWhatsAppText(phone, '💬 *Support Nopalou*\n\nPour nous contacter :\n📧 contact@nopalou.com\n🌐 nopalou.com\n\nNous répondons sous 24h. Merci !');
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    if (action === 'guide') {
      await sendWhatsAppText(phone, FAQ[FAQ.length - 1].reponse);
      await sendWhatsAppMenuOuFin(phone, 'Une autre question ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    // Texte libre reçu en état MENU → question FAQ, sinon traiter comme recherche
    const faq = detecterFAQ(text);
    if (faq) {
      await sendWhatsAppText(phone, faq.reponse);
      await sendWhatsAppMenuOuFin(phone, 'Une autre question ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    await setSession(phone, 'SEARCH_QUERY', {});
    await handleSearchQuery(phone, text);
    return;
  }

  // ── SEARCH_QUERY ──────────────────────────────────────────────────────────
  if (state === 'SEARCH_QUERY') {
    const faq = detecterFAQ(text);
    if (faq) {
      await sendWhatsAppText(phone, faq.reponse);
      await sendWhatsAppMenuOuFin(phone, 'Une autre question ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
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
      `✅ *Alerte créée !*\n\nJe vous notifierai dès que *${context.produit_nom}* passe sous *${prixFmt(prix)}*.`
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
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
        `📦 *Commande ${p.reference}*\n\nStatut : *${p.statut}*\nMontant : *${prixFmt(p.montant)}*\nDate : ${date}\n\nPour toute question, contactez contact@nopalou.com`
      );
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    }
    await setSession(phone, 'MENU', {});
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
    await setSession(phone, 'SEARCH_QUERY', {});
    return;
  }

  const produits     = results.filter(r => r.type === 'produit');
  const marketplace  = results.filter(r => r.type === 'marketplace');
  const autres       = results.filter(r => r.type !== 'produit' && r.type !== 'marketplace');

  // Product Messages pour les produits boutique (catalogue Meta)
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}\n📍 ${p.boutique_nom}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n📍 *${p.boutique_nom}*\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
  }

  // Texte pour les produits du comparateur (pas dans le catalogue Meta)
  if (marketplace.length) {
    const lines = marketplace.map(m => `• *${m.titre}* — à partir de ${prixFmt(m.prix)}\n👉 ${SITE}/produit/${m.id}`);
    await sendWhatsAppText(phone, lines.join('\n\n'));
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

  if (produits.length + autres.length > 1) {
    await attendre(1200); // laisse le temps aux messages précédents de s'afficher avant le bouton
  }
  await sendWhatsAppMenuOuFin(phone, 'Faites une nouvelle recherche, ou :').catch(() => {});
  await setSession(phone, 'MENU', {});
}

module.exports = { handleIncoming, cleanupOldMessages, resetInactiveSessions, handleSearchQuery };
