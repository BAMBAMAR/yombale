// backend/services/whatsapp-chatbot.js
const { pool } = require('../models/db');
const {
  sendWhatsAppText,
  sendWhatsAppInteractive,
  sendWhatsAppCarousel,
  sendWhatsAppProduct,
  sendWhatsAppButton,
  sendWhatsAppButtons3,
  sendWhatsAppMenuOuFin,
  sendReadReceipt,
  normalisePhone,
} = require('./whatsapp');
const { creerCommandeBoutique, notifierVendeurCommande } = require('../routes/comptabilite');
const cfg = require('../lib/settingsCache');

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
        title: 'Acheter & Explorer',
        rows: [
          { id: 'search', title: '🔍 Rechercher', description: 'Trouver un produit ou annonce' },
          { id: 'boutiques', title: '🏪 Les Boutiques', description: 'Découvrir les boutiques marchandes' },
          { id: 'immo', title: '🏠 Annonces immo', description: 'Maisons, appartements, terrains' },
          { id: 'telecom', title: '📱 Offres télécom', description: 'Mobile, internet, forfaits' },
        ],
      },
      {
        title: 'Marchands & Compte',
        rows: [
          { id: 'creer_boutique', title: '🛍️ Créer ma boutique', description: 'Vendre sur Nopalou, espace marchand' },
          { id: 'forfaits', title: '💎 Forfaits Boutiques', description: 'Tarifs des formules Pro & Business' },
          { id: 'order', title: '📦 Suivre commande', description: 'Statut de votre paiement' },
          { id: 'alert', title: '🔔 Alerte prix', description: 'Être notifié d\'une baisse' },
          { id: 'support', title: '💬 Support', description: 'Contacter l\'équipe Nopalou' },
        ],
      },
    ]
  );
}

// ── Menu d'une boutique précise (état BOUTIQUE_MENU) ───────────────────────────
async function envoyerMenuBoutique(phone, boutique) {
  const infos = [boutique.categorie, boutique.ville].filter(Boolean).join(' — ');
  let entete = `🏪 *${boutique.nom}*`;
  if (infos) entete += `\n${infos}`;
  if (boutique.description) entete += `\n${boutique.description}`;
  await sendWhatsAppText(phone, entete);

  await sendWhatsAppInteractive(
    phone,
    boutique.nom,
    'Que voulez-vous faire ?',
    [
      {
        title: 'Catalogue',
        rows: [
          { id: 'boutique_produits_tous', title: '🛍️ Voir les produits', description: 'Défiler les produits un par un' },
          { id: 'boutique_recherche', title: '🔍 Rechercher', description: 'Chercher un produit dans cette boutique' },
          { id: 'boutique_categorie', title: '📂 Par catégorie', description: 'Parcourir les catégories de produits' },
        ],
      },
      {
        title: 'Autre',
        rows: [
          { id: 'boutique_contact', title: '📞 Contacter le vendeur', description: 'Ouvrir une conversation directe' },
          { id: 'boutique_quitter', title: '⬅️ Changer de boutique', description: 'Retour au menu principal' },
        ],
      },
    ]
  );

  await setSession(phone, 'BOUTIQUE_MENU', { boutique });
}

// ── Recherche full-text ───────────────────────────────────────────────────────
// excludeIds : IDs (text) déjà montrés à l'utilisateur — exclus pour la pagination "plus".
async function searchContent(query, excludeIds = []) {
  const r = await pool.query(
    `(
      SELECT 'marketplace' AS type, id::text, nom AS titre, prix_min AS prix,
             image_url AS photo, NULL::text AS boutique_slug, NULL::text AS boutique_nom, NULL::text AS ville
      FROM produits
      WHERE to_tsvector('french', nom || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
        AND id::text <> ALL($2::text[])
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
        AND p.id::text <> ALL($2::text[])
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'annonce', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, NULL::text
      FROM annonces_classifiees
      WHERE actif=true AND supprimee=false AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
        AND id::text <> ALL($2::text[])
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'immo', id::text, titre, prix, (photos->>0), NULL::text, NULL::text, ville
      FROM annonces_immo
      WHERE actif=true AND jsonb_array_length(photos) > 0
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
        AND id::text <> ALL($2::text[])
      LIMIT 3
    )
    LIMIT 5`,
    [query, excludeIds]
  );
  return r.rows;
}

// ── Listes immo / télécom (menu + pagination "plus") ─────────────────────────
async function envoyerListeImmo(phone, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, titre, prix, (photos->>0) AS photo FROM annonces_immo
     WHERE actif=true AND jsonb_array_length(photos) > 0
       AND id::text <> ALL($1::text[])
     ORDER BY created_at DESC LIMIT 3`,
    [excludeIds]
  );
  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? '✅ Vous avez vu toutes les annonces immo disponibles. Revenez bientôt, ou tapez *menu*.'
        : 'Aucune annonce immo disponible pour le moment.'
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }
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
  await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ? Tapez *plus* pour d\'autres annonces, ou :').catch(() => {});
  await setSession(phone, 'MENU', {
    last: { type: 'immo', shownIds: excludeIds.concat(r.rows.map(a => String(a.id))) },
  });
}

async function envoyerListeTelecom(phone, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, nom, operateur, prix FROM forfaits_telecom
     WHERE actif=true AND id::text <> ALL($1::text[])
     ORDER BY created_at DESC LIMIT 5`,
    [excludeIds]
  );
  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? '✅ Vous avez vu toutes les offres télécom disponibles. Revenez bientôt, ou tapez *menu*.'
        : 'Aucune offre télécom disponible pour le moment.'
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }
  const lines = r.rows.map(o => `📱 *${o.nom || o.operateur}* — ${prixFmt(o.prix)}\n👉 ${SITE}/telecom`);
  await sendWhatsAppText(phone, lines.join('\n\n'));
  await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ? Tapez *plus* pour d\'autres offres, ou :').catch(() => {});
  await setSession(phone, 'MENU', {
    last: { type: 'telecom', shownIds: excludeIds.concat(r.rows.map(o => String(o.id))) },
  });
}

async function envoyerToutesLesBoutiques(phone, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, nom, slug, categorie, ville FROM boutiques
     WHERE actif=true AND id::text <> ALL($1::text[])
     ORDER BY created_at DESC LIMIT 10`,
    [excludeIds]
  );
  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? '✅ Vous avez vu toutes les boutiques Nopalou. Tapez *menu* pour revenir.'
        : 'Aucune boutique disponible pour le moment.'
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }

  const lines = r.rows.map((b, i) => `${i + 1}. *${b.nom}* (${b.categorie || 'commerce'}${b.ville ? ` — ${b.ville}` : ''})`);
  await sendWhatsAppText(
    phone,
    `🏪 *Boutiques Nopalou :*\n\n${lines.join('\n')}\n\n` +
    `Tapez le numéro (1, 2...), le nom d'une boutique, ou choisissez ci-dessous :`
  );

  const rows = r.rows.map(b => ({
    id: `boutique_choisie_${b.id}`,
    title: b.nom.slice(0, 24),
    description: [b.categorie, b.ville].filter(Boolean).join(' — ') || undefined,
  }));

  rows.push({
    id: 'boutique_secteur_liste',
    title: '📂 Choisir par secteur',
    description: 'Filtrer les boutiques par catégorie',
  });

  await sendWhatsAppInteractive(phone, 'Boutiques Nopalou', 'Cliquez sur une boutique ci-dessous :', [
    { title: 'Boutiques Nopalou', rows },
  ]);

  await setSession(phone, 'BOUTIQUE_LISTE', {
    boutiquesAffichees: r.rows,
    last: { type: 'boutiques_toutes', shownIds: excludeIds.concat(r.rows.map(b => String(b.id))) },
  });
}

async function envoyerListeBoutiques(phone, secteur, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, nom, slug, ville FROM boutiques
     WHERE actif=true AND categorie=$1 AND id::text <> ALL($2::text[])
     ORDER BY created_at DESC LIMIT 3`,
    [secteur, excludeIds]
  );
  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? '✅ Vous avez vu toutes les boutiques de ce secteur. Tapez *menu* pour revenir.'
        : 'Aucune boutique disponible dans ce secteur pour le moment.'
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }

  const rows = r.rows.map(b => ({
    id: `boutique_choisie_${b.id}`,
    title: b.nom.slice(0, 24),
    description: b.ville || undefined,
  }));
  await sendWhatsAppInteractive(phone, 'Boutiques', `Boutiques du secteur *${secteur}* :`, [
    { title: secteur, rows },
  ]);

  await attendre(400);
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres boutiques, ou choisissez-en une ci-dessus :').catch(() => {});
  await setSession(phone, 'BOUTIQUE_LISTE', {
    secteur,
    last: { type: 'boutique_liste', shownIds: excludeIds.concat(r.rows.map(b => String(b.id))) },
  });
}

// ── Fiche produit complète (boutique) ───────────────────────────────────────
// Product Message Meta native + message texte détaillé + 3 boutons (Commander, Suivant, Rechercher).
async function envoyerFicheProduitBoutique(phone, produit, boutique) {
  await sendWhatsAppProduct(
    phone,
    `nopalou-produit-${produit.id}`,
    `${produit.nom} — ${prixFmt(produit.prix)}\n📍 ${boutique.nom}`
  ).catch(async () => {
    await sendWhatsAppText(phone, `• *${produit.nom}* — ${prixFmt(produit.prix)}\n📍 *${boutique.nom}*`);
  });

  const lignes = [];
  if (produit.description) lignes.push(produit.description);

  const variantes = Array.isArray(produit.variantes) ? produit.variantes : [];
  for (const v of variantes) {
    if (v?.nom && Array.isArray(v.valeurs) && v.valeurs.length) {
      lignes.push(`*${v.nom}* : ${v.valeurs.join(', ')}`);
    }
  }

  const carac = produit.caracteristiques && typeof produit.caracteristiques === 'object' ? produit.caracteristiques : {};
  for (const [cle, val] of Object.entries(carac)) {
    if (val) lignes.push(`*${cle}* : ${val}`);
  }

  if (produit.stock_quantite !== null && produit.stock_quantite !== undefined) {
    lignes.push(produit.stock_quantite > 0 ? `✅ ${produit.stock_quantite} en stock` : '❌ Rupture de stock');
  } else {
    lignes.push(produit.en_stock === false ? '❌ Rupture de stock' : '✅ En stock');
  }

  if (lignes.length > 0) {
    await sendWhatsAppText(phone, lignes.join('\n'));
  }

  const contactVendeur = boutique.whatsapp || boutique.telephone;
  const buttons = [
    { id: `commander_${produit.id}`, title: '🛒 Commander' },
  ];
  if (contactVendeur) {
    buttons.push({ id: `contact_vendeur_${produit.id}`, title: '💬 Contact Vendeur' });
  } else {
    buttons.push({ id: `prod_suivant_${produit.id}`, title: '⏩ Suivant' });
  }
  buttons.push({ id: 'boutique_recherche', title: '🔍 Rechercher' });

  await sendWhatsAppButtons3(phone, 'Que souhaitez-vous faire ?', buttons).catch(() => {});
}

// ── Recherche / navigation par catégorie dans une boutique précise ─────────────
async function envoyerProduitsBoutique(phone, boutique, { query, categorie, excludeIds = [] }) {
  let sql, params;
  if (query) {
    sql = `SELECT id, nom, description, prix, en_stock, stock_quantite, caracteristiques, variantes
           FROM boutique_produits
           WHERE boutique_id=$1
             AND to_tsvector('french', nom || ' ' || COALESCE(description,'')) @@ plainto_tsquery('french', $2)
             AND id::text <> ALL($3::text[])
           ORDER BY created_at DESC LIMIT 1`;
    params = [boutique.id, query, excludeIds];
  } else if (categorie) {
    sql = `SELECT id, nom, description, prix, en_stock, stock_quantite, caracteristiques, variantes
           FROM boutique_produits
           WHERE boutique_id=$1 AND categorie=$2
             AND id::text <> ALL($3::text[])
           ORDER BY created_at DESC LIMIT 1`;
    params = [boutique.id, categorie, excludeIds];
  } else {
    sql = `SELECT id, nom, description, prix, en_stock, stock_quantite, caracteristiques, variantes
           FROM boutique_produits
           WHERE boutique_id=$1
             AND id::text <> ALL($2::text[])
           ORDER BY created_at DESC LIMIT 1`;
    params = [boutique.id, excludeIds];
  }

  const r = await pool.query(sql, params);

  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? `✅ Vous avez vu tous les produits ${query ? `pour *"${query}"*` : categorie ? `de la catégorie *${categorie}*` : 'de cette boutique'}.`
        : `😕 Aucun produit trouvé ${query ? `pour *"${query}"*` : categorie ? `dans cette catégorie` : 'dans cette boutique'}.`
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'BOUTIQUE_MENU', { boutique });
    return;
  }

  const p = r.rows[0];
  await envoyerFicheProduitBoutique(phone, p, boutique);

  const updatedExcludeIds = [...excludeIds, String(p.id)];
  await setSession(phone, 'BOUTIQUE_PRODUIT', {
    boutique,
    last: {
      type: query ? 'boutique_search' : categorie ? 'boutique_categorie' : 'boutique_tous',
      query, categorie,
      shownIds: updatedExcludeIds,
    },
  });
}

// ── Contact direct WhatsApp vendeur ───────────────────────────────────────────
async function envoyerContactVendeurDirect(phone, boutique, produitId) {
  const contact = boutique.whatsapp || boutique.telephone;
  if (!contact) {
    await sendWhatsAppText(phone, 'Cette boutique n\'a pas encore renseigné de numéro WhatsApp direct.');
    return;
  }

  let produitNom = 'ce produit';
  let produitPrixStr = '';
  if (produitId) {
    try {
      const r = await pool.query('SELECT nom, prix FROM boutique_produits WHERE id=$1', [produitId]);
      if (r.rows[0]) {
        produitNom = r.rows[0].nom;
        if (r.rows[0].prix) produitPrixStr = ` (${prixFmt(r.rows[0].prix)})`;
      }
    } catch (e) {}
  }

  const msgPreRempli = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par l'article "${produitNom}"${produitPrixStr} vu sur Nopalou. Est-il disponible ?`);
  const waLink = `https://wa.me/${normalisePhone(contact)}?text=${msgPreRempli}`;

  await sendWhatsAppText(
    phone,
    `📲 *Discuter en 1-Clic avec le vendeur (${boutique.nom})*\n\n` +
    `Évitez la saisie de formulaires ! Ouvrez directement WhatsApp pour convenir du lieu de livraison et finaliser votre commande avec le vendeur.\n\n` +
    `👉 ${waLink}`
  );
  await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
  await setSession(phone, 'BOUTIQUE_MENU', { boutique });
}

// ── Démarrage du flux de commande ────────────────────────────────────────────
async function demarrerCommande(phone, boutique, produitId) {
  const r = await pool.query(
    'SELECT id, nom, prix, stock_quantite FROM boutique_produits WHERE id=$1 AND boutique_id=$2',
    [produitId, boutique.id]
  );
  const produit = r.rows[0];
  if (!produit) {
    await sendWhatsAppText(phone, '😕 Ce produit n\'est plus disponible.');
    await setSession(phone, 'BOUTIQUE_MENU', { boutique });
    return;
  }

  const expressLink = `${SITE}/checkout-express?produit=${produit.id}&boutique=${boutique.id}&phone=${phone}`;
  const contact = boutique.whatsapp || boutique.telephone;
  let waDirectBlock = '';
  if (contact) {
    const msgPreRempli = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par l'article "${produit.nom}" (${prixFmt(produit.prix)}) vu sur Nopalou. Est-il disponible ?`);
    const waLink = `https://wa.me/${normalisePhone(contact)}?text=${msgPreRempli}`;
    waDirectBlock = `💬 *Option 1 (Discuter en 1-Clic avec le Vendeur)* :\n` +
      `Ouvrez directement WhatsApp pour convenir du lieu de livraison et finaliser avec le vendeur :\n👉 ${waLink}\n\n`;
  }

  await sendWhatsAppText(
    phone,
    `🛒 *Acheter cet article — ${produit.nom}*\nPrix : *${prixFmt(produit.prix)}*\n\n` +
    waDirectBlock +
    `⚡ *Option 2 (Formulaire Web 1-Page Express)* :\n👉 ${expressLink}\n\n` +
    `📋 *Option 3 (Commande Rapide par Chat)* :\n` +
    `Entrez votre *Nom et Adresse de livraison* (ex: Amar, Sacré-Cœur 3, Dakar) ci-dessous :`
  );

  await setSession(phone, 'COMMANDE_NOM', {
    boutique,
    commande: {
      items: [{ produit_id: produit.id, nom_produit: produit.nom, prix: Number(produit.prix) || 0, quantite: 1, stock_quantite: produit.stock_quantite }],
      client_telephone: phone,
    },
  });
}

async function envoyerRecapCommande(phone, boutique, commande) {
  await sendWhatsAppInteractive(
    phone,
    'Paiement',
    'Quel mode de paiement souhaitez-vous utiliser ?',
    [{
      title: 'Paiement',
      rows: [
        { id: 'pay_wave', title: '🌊 Wave (Recommandé)' },
        { id: 'pay_cash', title: '💵 Cash à la livraison' },
        { id: 'pay_om', title: '🟠 Orange Money (Bientôt)' },
        { id: 'pay_virement', title: '🏦 Virement' },
      ],
    }]
  );
  await setSession(phone, 'COMMANDE_PAIEMENT', { boutique, commande });
}

async function envoyerRecapFinal(phone, boutique, commande) {
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces à la livraison', virement: 'Virement' };
  const sousTotal = commande.items.reduce((s, it) => s + (it.prix * it.quantite), 0);
  const total = sousTotal + (commande.frais_livraison || 0);
  const lignes = [`📋 *Récapitulatif de votre commande*`, ``];
  for (const it of commande.items) {
    lignes.push(`🛍️ ${it.nom_produit} × ${it.quantite} — ${prixFmt(it.prix * it.quantite)}`);
  }
  if (commande.frais_livraison) lignes.push(`🚚 Livraison (${commande.zone_nom}) : ${prixFmt(commande.frais_livraison)}`);
  lignes.push(`*Total : ${prixFmt(total)}*`, ``);
  lignes.push(`👤 ${commande.client_nom}`, `📞 ${commande.client_telephone}`, `📍 ${commande.client_adresse}`);
  lignes.push(`💳 Paiement : ${methodeLabel[commande.methode_paiement] || commande.methode_paiement}`);

  await sendWhatsAppText(phone, lignes.join('\n'));
  await sendWhatsAppInteractive(
    phone,
    'Confirmation',
    'Confirmez-vous cette commande ?',
    [{ title: 'Action', rows: [
      { id: 'cmd_confirmer', title: '✅ Confirmer' },
      { id: 'cmd_annuler', title: '✏️ Annuler' },
    ] }]
  );
  await setSession(phone, 'COMMANDE_CONFIRMATION', { boutique, commande });
}

// ── Panier natif WhatsApp/Meta Commerce ─────────────────────────────────────
// order.product_items = [{ product_retailer_id, quantity, item_price, currency }]
// Le prix envoyé par Meta n'est jamais utilisé — toujours relu depuis boutique_produits
// pour rester fiable (le panier peut dater de plusieurs minutes/heures).
async function traiterPanierMeta(phone, order) {
  const items = Array.isArray(order.product_items) ? order.product_items : [];
  const produitIds = items
    .map(it => {
      const m = String(it.product_retailer_id || '').match(/^nopalou-produit-(.+)$/);
      return m ? { id: m[1], quantite: parseInt(it.quantity, 10) || 1 } : null;
    })
    .filter(Boolean);

  if (!produitIds.length) {
    await sendWhatsAppText(phone, '😕 Ce panier ne contient aucun produit reconnu.');
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  const r = await pool.query(
    `SELECT id, nom, prix, stock_quantite, boutique_id FROM boutique_produits WHERE id = ANY($1::uuid[])`,
    [produitIds.map(p => p.id)]
  );
  const produitsById = new Map(r.rows.map(p => [p.id, p]));

  const itemsValides = [];
  for (const { id, quantite } of produitIds) {
    const p = produitsById.get(id);
    if (p) itemsValides.push({ produit_id: p.id, nom_produit: p.nom, prix: Number(p.prix) || 0, quantite, stock_quantite: p.stock_quantite, boutique_id: p.boutique_id });
  }

  if (!itemsValides.length) {
    await sendWhatsAppText(phone, '😕 Ces produits ne sont plus disponibles.');
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // Tous les articles valides d'un même panier appartiennent à la même boutique
  // (le catalogue Meta d'un client vient d'une seule Product Message à la fois).
  const boutiqueId = itemsValides[0].boutique_id;
  const { rows: [boutique] } = await pool.query(
    'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE id=$1 AND actif=true',
    [boutiqueId]
  );
  if (!boutique) {
    await sendWhatsAppText(phone, '😕 Cette boutique n\'est plus disponible.');
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  const itemsBoutique = itemsValides.filter(it => it.boutique_id === boutiqueId);
  const premierProduit = itemsBoutique[0];
  const expressLink = `${SITE}/checkout-express?produit=${premierProduit.produit_id}&boutique=${boutique.id}&phone=${phone}`;
  const totalPanier = itemsBoutique.reduce((s, it) => s + (it.prix * it.quantite), 0);

  const detailArticles = itemsBoutique.map(it => `• *${it.nom_produit}* × ${it.quantite} — ${prixFmt(it.prix * it.quantite)}`).join('\n');
  await sendWhatsAppText(
    phone,
    `🛒 *Panier reçu (${itemsBoutique.length} article${itemsBoutique.length > 1 ? 's' : ''})*\n\n${detailArticles}\n💰 *Total : ${prixFmt(totalPanier)}*\n\n` +
    `⚡ *Option 1 (Formulaire Web 1-Page Express)* :\n👉 ${expressLink}\n\n` +
    `💬 *Option 2 (Commande WhatsApp Direct)* : Tapez votre Nom et Adresse (ex: Amar, Sacré-Cœur 3) ci-dessous :`
  );

  await setSession(phone, 'COMMANDE_NOM', {
    boutique,
    commande: {
      items: itemsBoutique.map(({ boutique_id, ...it }) => it),
      client_telephone: phone,
    },
  });
}

// Notification vendeur pour un panier groupé (plusieurs commandes liées par groupeCommande).
async function notifierVendeurPanierGroupe(boutique, commandesCreees, groupeCommande) {
  const vendeurTel = boutique.whatsapp || boutique.telephone;
  if (!vendeurTel) return;
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement' };
  const premiere = commandesCreees[0];
  const totalArticles = commandesCreees.reduce((s, c) => s + Number(c.montant_total) - Number(c.frais_livraison || 0), 0);
  const fraisLivraison = Number(premiere.frais_livraison) || 0;
  const total = totalArticles + fraisLivraison;
  const lignesArticles = commandesCreees.map(c => `• ${c.nom_produit} × ${c.quantite} — ${prixFmt(Number(c.prix_unitaire) * c.quantite)}`).join('\n');
  const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
  const lienCommandes = `${SITE}/boutique?tab=commandes`;
  const msg = `🛒 *Nouvelle commande groupée — ${boutique.nom}*\n\nRéf groupe : *${groupeCommande}*\n${lignesArticles}${fraisLivraison > 0 ? `\n🚚 Livraison : ${prixFmt(fraisLivraison)}` : ''}\n💰 *Total : ${prixFmt(total)}*\n💳 Paiement souhaité : ${methodeLabel[premiere.methode_paiement] || premiere.methode_paiement}\n\n👤 Client : ${premiere.client_nom}\n📞 ${premiere.client_telephone}${premiere.client_adresse ? `\n📍 ${premiere.client_adresse}` : ''}\n\n👉 *Consultez vos commandes ici :*\n${lienCommandes}\n\n⚡ Répondez vite pour confirmer !`;
  sendWhatsAppText(vendeurTel, msg).catch(() => {});

  // Envoi garanti par Template Meta (passant outre la restriction des 24h)
  const titleTpl = `🛒 Nouvelle commande groupée — ${boutique.nom}`;
  const detailTpl = `Réf ${groupeCommande} — Total: ${prixFmt(total)} (${commandesCreees.length} articles)`;
  sendWhatsAppTemplate(vendeurTel, 'nopalou_fiche_texte', [
    { type: 'body', parameters: [{ type: 'text', text: titleTpl }, { type: 'text', text: detailTpl }, { type: 'text', text: lienCommandes }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: 'boutique?tab=commandes' }] },
  ]).catch(() => {});
}

// ── Dispatcher principal ──────────────────────────────────────────────────────
async function handleIncoming(msg) {
  const phone = normalisePhone(msg.from);

  // Déduplication
  if (await isDuplicate(msg.id)) return;

  // ── Panier natif WhatsApp/Meta Commerce (msg.type === 'order') ──────────────
  // Envoyé quand un client utilise le bouton panier natif de WhatsApp depuis une
  // Product Message. Traité en priorité absolue, quel que soit l'état de session
  // en cours — interrompt toute conversation active, comme les mots-clés globaux.
  if (msg.type === 'order' && msg.order) {
    await traiterPanierMeta(phone, msg.order);
    return;
  }

  // Read receipt + indicateur de frappe pendant le traitement
  await sendReadReceipt(msg.id, true).catch(() => {});

  const { state, context } = await getSession(phone);
  const text = msg.text?.body?.trim() || '';
  const interactiveId = msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || '';

  // ── Lien direct partagé par un marchand : "boutique_{slug}" (texte ou bouton) ─
  // Traité comme un mot-clé global (au même titre que "menu"/"aide") : actif depuis
  // n'importe quel état, y compris pendant une recherche ou une navigation catégorie
  // déjà en cours dans une AUTRE boutique — un client qui reçoit/retape ce lien veut
  // changer de boutique, pas continuer son action précédente. Seule exception : les ids
  // internes du chatbot qui commencent aussi par "boutique_" (menu boutique :
  // boutique_recherche/categorie/contact/quitter ; sélection dans une liste :
  // boutique_choisie_{id}) — sinon ces boutons sont interceptés à tort par ce regex
  // générique et renvoient "boutique introuvable". Cette exclusion s'applique aussi
  // bien au texte libre (un client ne tape normalement pas ces ids internes à la main,
  // mais on reste défensif) qu'aux clics bouton.
  const estIdInterne = /^boutique_(recherche|categorie|contact|quitter|choisie_|produits_tous|next|secteur_liste)/.test(text) ||
    /^boutique_(recherche|categorie|contact|quitter|choisie_|produits_tous|next|secteur_liste)/.test(interactiveId);
  const matchBoutique = !estIdInterne &&
    (text.match(/^boutique_(.+)$/i) || interactiveId.match(/^boutique_(.+)$/i));
  if (matchBoutique) {
    const slug = matchBoutique[1].trim();
    const r = await pool.query(
      'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE slug=$1 AND actif=true',
      [slug]
    );
    if (!r.rows[0]) {
      await sendWhatsAppText(phone, '😕 Cette boutique est introuvable ou n\'est plus active.');
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    await envoyerMenuBoutique(phone, r.rows[0]);
    return;
  }

  const SALUTATIONS = ['menu', 'aide', 'help', '0', 'bonjour', 'bonsoir', 'salut', 'slt', 'hello', 'coucou'];
  const CLOTURE = ['merci', 'merci beaucoup', 'ok merci', 'c\'est bon', 'cest bon', 'au revoir', 'bye', 'a bientot', 'à bientôt', 'non merci', 'ça ira', 'ca ira', 'c\'est tout', 'cest tout'];
  // Mots de pagination : montrer la suite des derniers résultats (spec 2026-07-13).
  // "ok"/"oui" = réponse naturelle à "Envie de continuer ?". "ok merci" reste une clôture (CLOTURE testée avant).
  const MOTS_PLUS = ['plus', 'encore', 'd\'autres', 'dautres', 'autres', 'autre', 'voir plus', 'la suite', 'suivant', 'ok', 'oui'];

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

  // Bouton "Menu" explicite : si le client est encore dans une boutique (context.boutique
  // présent), y retourner plutôt que de sortir vers le menu général — évite de perdre le
  // contexte boutique sur une simple relance de "Envie de continuer ?". Sortir de la
  // boutique reste possible via "⬅️ Changer de boutique" (bouton dédié du menu boutique).
  if (interactiveId === 'menu' && context?.boutique) {
    await envoyerMenuBoutique(phone, context.boutique);
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
      await envoyerListeImmo(phone);
      return;
    }
    if (action === 'telecom') {
      await envoyerListeTelecom(phone);
      return;
    }
    if (action === 'alert' || interactiveId.startsWith('alert_prod_')) {
      await setSession(phone, 'ALERT_PRODUCT', { phone });
      await sendWhatsAppText(phone, '🔔 Quel produit voulez-vous surveiller ? (ex: iPhone 15, Samsung TV 55")');
      return;
    }
    if (action === 'order') {
      const telClean = phone.replace(/\D/g, '').slice(-9);
      try {
        const r = await pool.query(
          `SELECT reference, nom_produit, montant_total AS montant, statut, created_at
           FROM commandes_boutique
           WHERE client_telephone LIKE '%' || $1
           ORDER BY created_at DESC LIMIT 3`,
          [telClean]
        );
        if (r.rows.length > 0) {
          const lines = r.rows.map(p => {
            const date = new Date(p.created_at).toLocaleDateString('fr-FR');
            return `📦 *Réf ${p.reference}* (${p.nom_produit})\nStatut : *${p.statut || 'En cours'}* — Montant : ${prixFmt(p.montant)}\nDate : ${date}`;
          });
          await sendWhatsAppText(phone, `📋 *Vos commandes récentes :*\n\n${lines.join('\n\n')}`);
          await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
          await setSession(phone, 'MENU', {});
          return;
        }
      } catch (err) {
        console.error('[SUIVI COMMANDE AUTO]', err.message);
      }

      await setSession(phone, 'ORDER_REF', {});
      await sendWhatsAppText(phone, '📦 Entrez votre référence de commande (ex: CMD-12345) :');
      return;
    }
    if (action === 'creer_boutique') {
      const msgText = `🛍️ *Créer votre boutique sur Nopalou*\n\n` +
        `Développez votre activité et vendez vos produits directement en ligne au Sénégal !\n\n` +
        `✨ *Vos avantages marchands :*\n` +
        `• 🏪 Catalogue produits complet & gestion de stock\n` +
        `• 🌊 Encaissement direct Wave & Orange Money\n` +
        `• 📊 Statistiques de vente en temps réel\n` +
        `• 💬 Bot WhatsApp automatisé pour vos clients\n` +
        `• ⚡ Reversements des ventes Wave 1-Clic\n\n` +
        `👉 *Créez votre boutique gratuitement en 2 min :*\n${SITE}/creer-boutique`;
      await sendWhatsAppText(phone, msgText);
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    if (action === 'forfaits' || action === 'forfaits_abonnements') {
      const pxDecouverte = (await cfg.getNum('plan_decouverte_prix')) || 2500;
      const pxPro = (await cfg.getNum('plan_pro_prix')) || 5000;
      const pxBusiness = (await cfg.getNum('plan_business_prix')) || 10000;
      const commBiz = (await cfg.getNum('commission_business')) || 2.0;

      const msgText = `💎 *Forfaits & Abonnements Boutiques Nopalou*\n\n` +
        `Choisissez la formule adaptée à vos besoins :\n\n` +
        `🌱 *Boutique Taf Taf (${prixFmt(pxDecouverte)}/mois)*\n` +
        `• 🎁 1er mois 100% OFFERT\n` +
        `• Catalogue produits illimité\n` +
        `• Encaissement Wave & Orange Money\n` +
        `• 0% de commission sur vos ventes\n\n` +
        `🚀 *Boutique Pro (${prixFmt(pxPro)}/mois)*\n` +
        `• Tout le plan Taf Taf +\n` +
        `• Badge Vendeur Pro Certifié ⭐\n` +
        `• Référencement prioritaire sur le comparateur\n` +
        `• Support client prioritaire 7j/7\n\n` +
        `👑 *Boutique Business (${prixFmt(pxBusiness)}/mois)*\n` +
        `• Tout le plan Pro +\n` +
        `• Commission réduite (${commBiz}%)\n` +
        `• Sponsoring & Bannière Page d'Accueil\n` +
        `• Multi-Magasins & Caisse Caissiers POS\n\n` +
        `👉 *Découvrir les détails et s'abonner :*\n${SITE}/tarifs-boutique`;
      await sendWhatsAppText(phone, msgText);
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    if (action === 'boutiques') {
      await envoyerToutesLesBoutiques(phone);
      return;
    }
    if (action === 'support') {
      await sendWhatsAppInteractive(
        phone,
        'Support Nopalou',
        '💬 *Besoin d\'aide ?*\nComment souhaitez-vous contacter l\'équipe Nopalou ?',
        [{
          title: 'Options',
          rows: [
            { id: 'supp_rappel', title: '📞 Demander un rappel', description: 'Notre équipe vous rappelle' },
            { id: 'supp_email', title: '📧 Contact Email', description: 'contact@nopalou.com' },
            { id: 'guide', title: 'ℹ️ Comment ça marche', description: 'Consulter le guide' },
          ],
        }]
      ).catch(async () => {
        await sendWhatsAppText(phone, '💬 *Support Nopalou*\n\nPour nous contacter :\n📧 contact@nopalou.com\n🌐 nopalou.com\n\nNous répondons sous 24h. Merci !');
      });
      await setSession(phone, 'MENU', {});
      return;
    }
    if (action === 'guide') {
      await sendWhatsAppText(phone, FAQ[FAQ.length - 1].reponse);
      await sendWhatsAppMenuOuFin(phone, 'Une autre question ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    // "plus" / "encore" / "d'autres" / "oui"... → paginer les derniers résultats affichés
    if (MOTS_PLUS.includes(normaliserTexte(text))) {
      const last = context?.last;
      if (!last || !last.type) {
        await setSession(phone, 'SEARCH_QUERY', {});
        await sendWhatsAppText(phone, '🔍 Plus de quoi ? Dites-moi ce que vous cherchez (ex: télévision Samsung, canapé, forfait Tigo...)');
        return;
      }
      const shownIds = Array.isArray(last.shownIds) ? last.shownIds : [];
      if (last.type === 'immo')    { await envoyerListeImmo(phone, shownIds); return; }
      if (last.type === 'telecom') { await envoyerListeTelecom(phone, shownIds); return; }
      await handleSearchQuery(phone, last.query, shownIds);
      return;
    }
    // Bouton d'un contexte boutique/commande expiré (session déjà repassée en MENU
    // général entre-temps, ex: après un clic sur "Menu") — l'utilisateur clique un
    // bouton resté affiché sur son téléphone (🔍 Rechercher, 🛒 Commander, etc.) qui
    // n'a plus de sens ici. Sans cette garde, ces ids tombent dans le fallback
    // "recherche globale" ci-dessous avec un texte vide, ce qui casse la recherche.
    if (/^(boutique_|bcat_|zone_|commander_|pay_|cmd_)/.test(interactiveId)) {
      await sendWhatsAppText(phone, '⏱️ Cette action a expiré. Tapez *menu* pour recommencer.');
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

  // ── BOUTIQUE_SECTEUR → choix du secteur ─────────────────────────────────────
  if (state === 'BOUTIQUE_SECTEUR') {
    const secteurMatch = interactiveId.match(/^secteur_(.+)$/);
    if (!secteurMatch) {
      await sendWhatsAppText(phone, 'Choisissez un secteur dans la liste ci-dessus, ou tapez *menu*.');
      return;
    }
    await envoyerListeBoutiques(phone, secteurMatch[1]);
    return;
  }

  // ── BOUTIQUE_LISTE → choix d'une boutique ou pagination ─────────────────────
  if (state === 'BOUTIQUE_LISTE') {
    if (interactiveId === 'boutique_secteur_liste') {
      const r = await pool.query(
        `SELECT DISTINCT categorie FROM boutiques WHERE actif=true AND categorie IS NOT NULL ORDER BY categorie LIMIT 10`
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Aucun secteur défini pour le moment.');
        await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
        await setSession(phone, 'MENU', {});
        return;
      }
      const rows = r.rows.map(row => ({ id: `secteur_${row.categorie}`, title: row.categorie.slice(0, 24) }));
      await sendWhatsAppInteractive(phone, '🏪 Secteurs', 'Choisissez un secteur :', [
        { title: 'Secteurs', rows },
      ]);
      await setSession(phone, 'BOUTIQUE_SECTEUR', {});
      return;
    }

    if (MOTS_PLUS.includes(normaliserTexte(text))) {
      const shownIds = Array.isArray(context?.last?.shownIds) ? context.last.shownIds : [];
      if (context?.last?.type === 'boutiques_toutes') {
        await envoyerToutesLesBoutiques(phone, shownIds);
      } else {
        await envoyerListeBoutiques(phone, context.secteur, shownIds);
      }
      return;
    }

    let targetBoutiqueId = null;
    const choixMatch = interactiveId.match(/^boutique_choisie_(.+)$/);
    if (choixMatch) {
      targetBoutiqueId = choixMatch[1];
    } else if (text) {
      const num = parseInt(text.trim(), 10);
      const boutiques = Array.isArray(context?.boutiquesAffichees) ? context.boutiquesAffichees : [];
      if (!isNaN(num) && num >= 1 && num <= boutiques.length) {
        targetBoutiqueId = boutiques[num - 1].id;
      } else {
        const rName = await pool.query(
          'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE nom ILIKE $1 AND actif=true LIMIT 1',
          [`%${text.trim()}%`]
        );
        if (rName.rows[0]) targetBoutiqueId = rName.rows[0].id;
      }
    }

    if (!targetBoutiqueId) {
      await sendWhatsAppText(phone, 'Choisissez une boutique dans la liste ci-dessus, tapez son numéro (1, 2...), ou tapez *menu*.');
      return;
    }

    const r = await pool.query(
      'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE id=$1 AND actif=true',
      [targetBoutiqueId]
    );
    if (!r.rows[0]) {
      await sendWhatsAppText(phone, '😕 Cette boutique n\'est plus disponible.');
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    await envoyerMenuBoutique(phone, r.rows[0]);
    return;
  }

  // ── BOUTIQUE_MENU → actions du menu boutique ────────────────────────────────
  if (state === 'BOUTIQUE_MENU') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }

    if (interactiveId === 'boutique_produits_tous') {
      await envoyerProduitsBoutique(phone, boutique, {});
      return;
    }
    if (interactiveId === 'boutique_recherche') {
      await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
      await sendWhatsAppText(phone, `🔍 Que recherchez-vous chez *${boutique.nom}* ?`);
      return;
    }
    if (interactiveId === 'boutique_categorie') {
      const r = await pool.query(
        `SELECT DISTINCT categorie FROM boutique_produits WHERE boutique_id=$1 AND categorie IS NOT NULL ORDER BY categorie LIMIT 10`,
        [boutique.id]
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Cette boutique n\'a pas encore de catégories définies.');
        await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
        await setSession(phone, 'BOUTIQUE_MENU', { boutique });
        return;
      }
      const rows = r.rows.map(row => ({ id: `bcat_${row.categorie}`, title: row.categorie.slice(0, 24) }));
      await sendWhatsAppInteractive(phone, boutique.nom, 'Choisissez une catégorie :', [{ title: 'Catégories', rows }]);
      await setSession(phone, 'BOUTIQUE_CATEGORIE', { boutique });
      return;
    }
    if (interactiveId === 'boutique_contact') {
      const contact = boutique.whatsapp || boutique.telephone;
      if (!contact) {
        await sendWhatsAppText(phone, 'Cette boutique n\'a pas encore renseigné de contact direct.');
      } else {
        await sendWhatsAppText(phone, `📞 Contactez directement *${boutique.nom}* :\nhttps://wa.me/${normalisePhone(contact)}`);
      }
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'BOUTIQUE_MENU', { boutique });
      return;
    }
    if (interactiveId === 'boutique_quitter') {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    const contactMatch = interactiveId.match(/^contact_vendeur_(.+)$/);
    if (contactMatch) {
      await envoyerContactVendeurDirect(phone, boutique, contactMatch[1]);
      return;
    }
    const commanderMatch = interactiveId.match(/^commander_(.+)$/);
    if (commanderMatch) {
      await demarrerCommande(phone, boutique, commanderMatch[1]);
      return;
    }
    if (interactiveId === 'boutique_next' || interactiveId.startsWith('prod_suivant_') || MOTS_PLUS.includes(normaliserTexte(text))) {
      const last = context?.last || {};
      const shownIds = Array.isArray(last.shownIds) ? last.shownIds : [];
      await envoyerProduitsBoutique(phone, boutique, { query: last.query, categorie: last.categorie, excludeIds: shownIds });
      return;
    }
    // Texte libre en BOUTIQUE_MENU = recherche directe dans cette boutique
    await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
    await envoyerProduitsBoutique(phone, boutique, { query: text });
    return;
  }

  // ── BOUTIQUE_PRODUIT → défilement 1 à 1 des fiches produit ─────────────────
  if (state === 'BOUTIQUE_PRODUIT') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    const contactMatch = interactiveId.match(/^contact_vendeur_(.+)$/);
    if (contactMatch) {
      await envoyerContactVendeurDirect(phone, boutique, contactMatch[1]);
      return;
    }
    const commanderMatch = interactiveId.match(/^commander_(.+)$/);
    if (commanderMatch) {
      await demarrerCommande(phone, boutique, commanderMatch[1]);
      return;
    }
    if (interactiveId === 'boutique_recherche') {
      await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
      await sendWhatsAppText(phone, `🔍 Que recherchez-vous chez *${boutique.nom}* ?`);
      return;
    }
    if (interactiveId === 'boutique_next' || interactiveId.startsWith('prod_suivant_') || MOTS_PLUS.includes(normaliserTexte(text))) {
      const last = context?.last || {};
      const shownIds = Array.isArray(last.shownIds) ? last.shownIds : [];
      await envoyerProduitsBoutique(phone, boutique, { query: last.query, categorie: last.categorie, excludeIds: shownIds });
      return;
    }
    if (interactiveId === 'boutique_quitter') {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    // Texte libre pendant BOUTIQUE_PRODUIT = recherche de produit dans la boutique
    await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
    await envoyerProduitsBoutique(phone, boutique, { query: text });
    return;
  }

  // ── BOUTIQUE_SEARCH_QUERY → recherche dans la boutique ──────────────────────
  if (state === 'BOUTIQUE_SEARCH_QUERY') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    if (!text || text.length < 2) {
      await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 caractères.');
      return;
    }
    await envoyerProduitsBoutique(phone, boutique, { query: text });
    return;
  }

  // ── BOUTIQUE_CATEGORIE → choix d'une catégorie ───────────────────────────────
  if (state === 'BOUTIQUE_CATEGORIE') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    const catMatch = interactiveId.match(/^bcat_(.+)$/);
    if (!catMatch) {
      await sendWhatsAppText(phone, 'Choisissez une catégorie dans la liste ci-dessus, ou tapez *menu*.');
      return;
    }
    await envoyerProduitsBoutique(phone, boutique, { categorie: catMatch[1] });
    return;
  }

  // ── COMMANDE_* : séquence de collecte des infos de commande ────────────────
  const ANNULER = ['annuler', 'annule', 'stop', 'abandonner'];

  if (state === 'COMMANDE_QUANTITE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    let quantite = 1;
    const qtyMatch = interactiveId.match(/^qty_(\d+)_/);
    if (qtyMatch) {
      quantite = parseInt(qtyMatch[1], 10);
    } else {
      quantite = parseInt(text.replace(/[^\d]/g, ''), 10) || 1;
    }
    const item = context.commande?.items?.[0];
    const stock = item?.stock_quantite;
    if (stock !== null && stock !== undefined && stock < quantite) {
      await sendWhatsAppText(phone, `⚠️ Il ne reste que ${stock} en stock. Entrez une quantité inférieure ou égale.`);
      return;
    }
    await sendWhatsAppText(phone, 'Votre nom complet ?');
    const items = [{ ...item, quantite }];
    await setSession(phone, 'COMMANDE_NOM', { boutique, commande: { ...context.commande, items, client_telephone: phone } });
    return;
  }

  if (state === 'COMMANDE_NOM') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    if (!text || text.trim().length < 2) {
      await sendWhatsAppText(phone, '⚠️ Entrez votre Nom et Adresse de livraison (ex: Amar, Sacré-Cœur 3).');
      return;
    }
    const parts = text.split(',');
    const clientNom = parts[0].trim();
    const clientAdresse = parts.length > 1 ? parts.slice(1).join(',').trim() : text.trim();
    const commandeComplete = {
      ...context.commande,
      client_nom: clientNom,
      client_adresse: clientAdresse,
      client_telephone: context.commande?.client_telephone || phone,
    };

    const zones = await pool.query('SELECT id, nom, prix FROM zones_livraison WHERE boutique_id=$1 ORDER BY prix ASC LIMIT 5', [boutique.id]);
    let rows = [];
    if (zones.rows.length > 0) {
      for (const z of zones.rows) {
        rows.push({ id: `f_z_${z.id}_wave`, title: `🌊 ${z.nom.slice(0, 18)} (Wave)`, description: `${prixFmt(Number(z.prix))} — Payez par Wave` });
        rows.push({ id: `f_z_${z.id}_cash`, title: `💵 ${z.nom.slice(0, 18)} (Cash)`, description: `${prixFmt(Number(z.prix))} — Cash à la livraison` });
      }
    } else {
      rows = [
        { id: 'f_dakar_wave', title: '🌊 Dakar + Wave (1500F)', description: 'Livraison Dakar & Wave' },
        { id: 'f_dakar_cash', title: '💵 Dakar + Cash (1500F)', description: 'Livraison Dakar & Espèces' },
        { id: 'f_banlieue_wave', title: '🌊 Banlieue + Wave (2500F)', description: 'Banlieue (Pikine...) & Wave' },
        { id: 'f_banlieue_cash', title: '🚚 Banlieue + Cash (2500F)', description: 'Banlieue & Espèces à la livraison' },
        { id: 'f_retrait_cash', title: '🏬 Retrait sur place', description: 'Retrait en boutique (0 FCFA)' },
      ];
    }
    await sendWhatsAppInteractive(
      phone,
      'Livraison & Paiement',
      'Choisissez votre formule tout-en-un :',
      [{ title: 'Formules Tout-en-un', rows }]
    );
    await setSession(phone, 'COMMANDE_ZONE', { boutique, commande: commandeComplete });
    return;
  }

  if (state === 'COMMANDE_TELEPHONE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    const chiffres = text.replace(/[^\d]/g, '') || phone;
    await sendWhatsAppText(phone, 'Votre adresse de livraison ? (quartier, ville...)');
    await setSession(phone, 'COMMANDE_ADRESSE', { boutique, commande: { ...context.commande, client_telephone: chiffres } });
    return;
  }

  if (state === 'COMMANDE_ADRESSE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    if (!text || text.trim().length < 3) {
      await sendWhatsAppText(phone, '⚠️ Entrez une adresse de livraison.');
      return;
    }
    const commandeAvecAdresse = { ...context.commande, client_adresse: text.trim() };

    const zones = await pool.query('SELECT id, nom, prix FROM zones_livraison WHERE boutique_id=$1 ORDER BY prix ASC LIMIT 10', [boutique.id]);
    let rows = [];
    if (zones.rows.length > 0) {
      rows = zones.rows.map(z => ({ id: `zone_${z.id}`, title: z.nom.slice(0, 24), description: prixFmt(Number(z.prix)) }));
    } else {
      rows = [
        { id: 'zone_def_dakar', title: '📍 Dakar (Intra-Muros)', description: '1 500 FCFA' },
        { id: 'zone_def_retrait', title: '🏬 Retrait en boutique', description: 'Gratuit (0 FCFA)' },
        { id: 'zone_def_banlieue', title: '🚚 Banlieue (Pikine...)', description: '2 500 FCFA' },
      ];
    }
    await sendWhatsAppInteractive(phone, 'Livraison', 'Choisissez votre mode/zone de livraison :', [{ title: 'Options Livraison', rows }]);
    await setSession(phone, 'COMMANDE_ZONE', { boutique, commande: commandeAvecAdresse });
    return;
  }

  if (state === 'COMMANDE_ZONE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    let zoneNom = 'Dakar (Intra-Muros)';
    let fraisLivraison = 1500;
    let zoneId = null;
    let methodePaiement = 'wave';

    if (interactiveId === 'f_dakar_wave' || interactiveId === 'zone_def_dakar') {
      zoneNom = 'Dakar (Intra-Muros)';
      fraisLivraison = 1500;
      methodePaiement = 'wave';
    } else if (interactiveId === 'f_dakar_cash') {
      zoneNom = 'Dakar (Intra-Muros)';
      fraisLivraison = 1500;
      methodePaiement = 'cash';
    } else if (interactiveId === 'f_banlieue_wave') {
      zoneNom = 'Banlieue';
      fraisLivraison = 2500;
      methodePaiement = 'wave';
    } else if (interactiveId === 'f_banlieue_cash' || interactiveId === 'zone_def_banlieue') {
      zoneNom = 'Banlieue';
      fraisLivraison = 2500;
      methodePaiement = 'cash';
    } else if (interactiveId === 'f_retrait_cash' || interactiveId === 'zone_def_retrait') {
      zoneNom = 'Retrait en boutique (gratuit)';
      fraisLivraison = 0;
      methodePaiement = 'cash';
    } else {
      const customMatch = interactiveId.match(/^f_z_(.+)_(wave|cash)$/);
      if (customMatch) {
        const [_, zId, mType] = customMatch;
        const { rows: [zone] } = await pool.query('SELECT id, nom, prix FROM zones_livraison WHERE id=$1 AND boutique_id=$2', [zId, boutique.id]);
        if (zone) {
          zoneId = zone.id;
          zoneNom = zone.nom;
          fraisLivraison = Number(zone.prix);
          methodePaiement = mType;
        }
      } else {
        const zoneMatch = interactiveId.match(/^zone_(.+)$/);
        if (zoneMatch) {
          const { rows: [zone] } = await pool.query('SELECT id, nom, prix FROM zones_livraison WHERE id=$1 AND boutique_id=$2', [zoneMatch[1], boutique.id]);
          if (zone) {
            zoneId = zone.id;
            zoneNom = zone.nom;
            fraisLivraison = Number(zone.prix);
          }
        }
      }
    }

    await envoyerRecapFinal(phone, boutique, {
      ...context.commande,
      zone_livraison_id: zoneId,
      zone_nom: zoneNom,
      frais_livraison: fraisLivraison,
      methode_paiement: methodePaiement,
    });
    return;
  }

  if (state === 'COMMANDE_PAIEMENT') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    const PAIEMENTS = { pay_wave: 'wave', pay_om: 'orange_money', pay_cash: 'cash', pay_virement: 'virement' };
    const methode = PAIEMENTS[interactiveId];
    if (!methode) {
      await sendWhatsAppText(phone, 'Choisissez un mode de paiement dans les boutons ci-dessus.');
      return;
    }
    await envoyerRecapFinal(phone, boutique, { ...context.commande, methode_paiement: methode });
    return;
  }

  if (state === 'COMMANDE_CONFIRMATION') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (interactiveId === 'cmd_annuler' || ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    if (interactiveId !== 'cmd_confirmer') {
      await sendWhatsAppText(phone, 'Cliquez sur ✅ Confirmer ou ✏️ Annuler ci-dessus.');
      return;
    }
    const c = context.commande;
    const groupeCommande = c.items.length > 1 ? require('crypto').randomUUID() : null;
    const creees = [];
    const echecs = [];
    let boutiqueChargee = boutique;
    for (const item of c.items) {
      try {
        const { commande, boutique: b } = await creerCommandeBoutique({
          boutiqueId: boutique.id,
          produitId: item.produit_id,
          quantite: item.quantite,
          clientNom: c.client_nom,
          clientTelephone: c.client_telephone,
          clientAdresse: c.client_adresse,
          source: 'whatsapp',
          methodePaiement: c.methode_paiement,
          zoneLivraisonId: c.zone_livraison_id || null,
          groupeCommande,
        });
        creees.push(commande);
        boutiqueChargee = b;
      } catch (err) {
        echecs.push({ nom: item.nom_produit, erreur: err.message });
      }
    }

    if (creees.length > 0) {
      if (creees.length === 1) {
        await notifierVendeurCommande(boutiqueChargee, {
          reference: creees[0].reference,
          nomProduit: creees[0].nom_produit,
          quantite: creees[0].quantite,
          montantTotal: Number(creees[0].montant_total),
          fraisLivraison: Number(creees[0].frais_livraison),
          methodePaiement: creees[0].methode_paiement,
          clientNom: creees[0].client_nom,
          clientTelephone: creees[0].client_telephone,
          clientAdresse: creees[0].client_adresse,
          note: creees[0].note,
        });
      } else {
        await notifierVendeurPanierGroupe(boutiqueChargee, creees, groupeCommande);
      }
      const refs = creees.map(c => c.reference).join(', ');
      let msgFinal = `✅ *Commande ${refs} envoyée !*\n\nLe vendeur *${boutique.nom}* va vous contacter pour finaliser le paiement et la livraison.`;
      if (creees[0]?.methode_paiement === 'wave' || creees[0]?.methode_paiement === 'pay_wave') {
        let wavePayUrl = `${SITE}/checkout-express?produit=${creees[0]?.produit_id || ''}&boutique=${boutique.id}&phone=${phone}&pay=wave&auto=1`;
        try {
          const wave = require('./wave');
          const totalMontant = creees.reduce((sum, c) => sum + Number(c.montant_total || 0), 0);
          if (totalMontant > 0 && process.env.WAVE_API_KEY && !process.env.WAVE_API_KEY.includes('xxxxxxxx')) {
            const waveSession = await wave.createCheckoutSession({
              amount: Math.round(totalMontant),
              currency: 'XOF',
              success_url: `${SITE}/paiement/succes?ref=${refs}&type=commande-boutique`,
              error_url: `${SITE}/paiement/erreur`,
              client_reference: refs,
            });
            if (waveSession?.wave_url) {
              wavePayUrl = waveSession.wave_url;
            }
          }
        } catch (wErr) {
          console.error('[WHATSAPP CHATBOT WAVE SESSION ERR]:', wErr.message);
        }
        msgFinal += `\n\n🌊 *Réglez directement votre commande par Wave en 1 Clic :*\n👉 ${wavePayUrl}`;
      }
      if (echecs.length > 0) {
        msgFinal += `\n\n⚠️ ${echecs.map(e => e.nom).join(', ')} n'${echecs.length > 1 ? 'ont' : 'a'} pas pu être commandé(s) : ${echecs[0].erreur}.`;
      }
      await sendWhatsAppText(phone, msgFinal);
    } else {
      await sendWhatsAppText(phone, `😕 Impossible de créer la commande : ${echecs[0]?.erreur || 'erreur inconnue'}. Réessayez ou tapez *menu*.`);
    }
    await envoyerMenuBoutique(phone, boutique);
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

async function handleSearchQuery(phone, query, excludeIds = []) {
  if (!query || query.length < 2) {
    await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 caractères.');
    return;
  }
  const results = await searchContent(query, excludeIds);
  if (!results.length) {
    if (excludeIds.length) {
      // Pagination épuisée — tout a déjà été montré.
      await sendWhatsAppText(phone, `✅ Vous avez vu tout ce que j'ai pour *"${query}"*.\n\nEssayez avec d'autres mots-clés ou tapez *menu*.`);
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
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
    if (p.boutique_slug) {
      await sendWhatsAppButton(phone, `Envie de voir tout le catalogue de ${p.boutique_nom} ?`, `boutique_${p.boutique_slug}`, '🏪 Voir la boutique').catch(() => {});
    }
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
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres résultats, faites une nouvelle recherche, ou :').catch(() => {});
  await setSession(phone, 'MENU', {
    last: { type: 'search', query, shownIds: excludeIds.concat(results.map(r => String(r.id))) },
  });
}

module.exports = { handleIncoming, cleanupOldMessages, resetInactiveSessions, handleSearchQuery };
