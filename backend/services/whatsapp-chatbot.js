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
  ajouterBlacklist,
  retirerBlacklist,
  estDesinscrit,
} = require('./whatsapp');
const { creerCommandeBoutique, notifierVendeurCommande } = require('../routes/comptabilite');
const cfg = require('../lib/settingsCache');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
const prixFmt = (p) => p ? new Intl.NumberFormat('fr-FR').format(p) + ' FCFA' : 'N/C';
const attendre = (ms) => new Promise(r => setTimeout(r, ms));

// ── Téléchargement des médias WhatsApp (Photos produits) vers Cloudinary ──────
async function telechargerMediaWhatsApp(mediaId) {
  try {
    const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_TOKEN;
    if (!token || !mediaId) {
      console.warn('[TELECHARGER MEDIA WA]: Token ou mediaId manquant', { hasToken: !!token, mediaId });
      return null;
    }

    console.log('[TELECHARGER MEDIA WA]: Récupération URL temporaire pour mediaId', mediaId);
    const resMeta = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'curl/7.64.1',
      },
    });

    if (!resMeta.ok) {
      const errTxt = await resMeta.text().catch(() => '');
      console.error('[TELECHARGER MEDIA WA META ERR]:', resMeta.status, errTxt);
      return null;
    }

    const dataMeta = await resMeta.json();
    if (!dataMeta.url) {
      console.error('[TELECHARGER MEDIA WA]: URL manquante dans la réponse Meta', dataMeta);
      return null;
    }

    console.log('[TELECHARGER MEDIA WA]: Téléchargement binaire...');
    const resImg = await fetch(dataMeta.url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'curl/7.64.1',
      },
    });

    if (!resImg.ok) {
      const errTxt = await resImg.text().catch(() => '');
      console.error('[TELECHARGER MEDIA WA IMG ERR]:', resImg.status, errTxt);
      return null;
    }

    const arrayBuffer = await resImg.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('[TELECHARGER MEDIA WA]: Téléchargé avec succès, taille =', buffer.length, 'octets');

    const { uploadBuffer } = require('./cloudinary');
    const url = await uploadBuffer(buffer, 'boutique_produits');
    console.log('[TELECHARGER MEDIA WA]: Image Cloudinary uploadée =', url);
    return url;
  } catch (err) {
    console.error('[TELECHARGER MEDIA WHATSAPP ERR]:', err.message);
    return null;
  }
}

// ── FAQ par mots-clés — questions sur le fonctionnement du site ───────────────
// Chaque entrée : mots-clés à détecter dans le texte libre (sans accents, minuscule) + réponse.
// Testée avant la recherche produit/annonce pour éviter des requêtes SQL inutiles.
const FAQ = [
  {
    motsCles: ['gratuit', 'payant', 'coute', 'couter', 'prix nopalou', 'naata la'],
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
    motsCles: ['boutique', 'vendre en ligne', 'creer shop', 'ouvrir shop'],
    reponse: '🛍️ *Créer votre boutique*\n\nVendez directement sur Nopalou : catalogue produits, statistiques, encaissements Wave & Orange Money 1-Clic. 1er mois 100% OFFERT sur tous nos forfaits !\n👉 ' + SITE + '/creer-boutique',
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
    motsCles: ['livraison', 'livrer', 'frais livraison', 'zone livraison', 'livraison dakar', 'livrez vous'],
    reponse: '🚚 *Livraison sur Nopalou*\n\n• Pour les produits en boutique : chaque commerçant assure la livraison rapide (Dakar Intra-Muros, Banlieue, Régions).\n• Le tarif et le mode de livraison (Wave ou Cash) sont précisés lors de la commande.\n• Vous pouvez aussi convenir directement de la livraison avec le vendeur par WhatsApp.',
  },
  {
    motsCles: ['payer', 'paiement', 'moyen de paiement', 'wave', 'orange money'],
    reponse: '💳 *Moyens de paiement acceptés*\n\n🌊 Wave (Paiement 1-Clic sécurisé)\n🟠 Orange Money\n💵 Espèces / Cash à la livraison\n🏦 Virement bancaire\n\nVos paiements sont 100% sécurisés.',
  },
  {
    motsCles: ['support', 'contact', 'contacter', 'parler', 'humain', 'conseiller', 'service client', 'telephone nopalou', 'appeler nopalou', 'joindre', 'reclamation'],
    reponse: '💬 *Service Client & Support Nopalou*\n\n📞 Téléphone / WhatsApp : +221 70 871 79 42\n📧 Email : contact@nopalou.com\n🌐 Site : nopalou.com\n\n👉 Vous pouvez aussi taper *rappel* pour demander qu\'un conseiller vous rappelle directement !',
  },
  {
    motsCles: ['comment ça marche', 'comment ca marche', 'comment utiliser', 'aide site', 'utiliser nopalou', 'utiliser le site'],
    reponse: '📖 *Comment utiliser Nopalou*\n\n🔍 Comparez les prix produits\n🏆 Guide d\'achat personnalisé\n🏡 Trouvez un logement\n📶 Comparez les forfaits télécom\n⚖️ Comparez côte à côte\n❤️ Sauvegardez vos favoris\n🔔 Créez des alertes de prix\n📢 Publiez une annonce\n\nGuide complet : ' + SITE + '/guide-utilisation',
  },
  {
    motsCles: ['supprimer', 'retirer', 'effacer', 'desinscrire', 'stop', 'droit a l oubli', 'supprimer numero', 'retirer annonce'],
    reponse: '🗑️ *Suppression d\'annonce ou désinscription*\n\n• Pour supprimer immédiatement vos annonces et votre numéro : tapez *supprimer*\n• Pour ne plus recevoir AUCUN message WhatsApp : tapez *STOP*\n• Vous pouvez aussi écrire à ✉️ contact@nopalou.com',
  },
];

function normaliserTexte(s) {
  if (!s || typeof s !== 'string') return '';
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function detecterFAQ(texte) {
  const normalise = normaliserTexte(texte);
  return FAQ.find(f => f.motsCles.some(mot => normalise.includes(normaliserTexte(mot))));
}

// Détection intelligente si un message ressemble à une question (pour éviter de le prendre comme un nom ou une adresse)
function detecterIntentionInterrogative(texte) {
  if (!texte || typeof texte !== 'string') return false;
  const raw = texte.trim();
  if (raw.includes('?') || raw.includes('؟')) return true;
  const norm = normaliserTexte(raw);
  const MOTS_QUESTIONS = [
    'combien', 'c est combien', 'cest combien', 'est ce que', 'est-ce que', 'estce que',
    'pourquoi', 'comment', 'ou se trouve', 'ou est', 'c est ou', 'cest ou',
    'livrez vous', 'vous livrez', 'livraison possible', 'disponible', 'dispo',
    'en stock', 'naata la', 'amna', 'jaay ma', 'taille', 'couleur', 'prix'
  ];
  return MOTS_QUESTIONS.some(m => norm.includes(m));
}

// ── Enregistrement d'une demande de rappel / support (Handover humain) ─────────
async function enregistrerDemandeSupport(phone, { nom = null, message = 'Demande de rappel client', contexte = {} } = {}) {
  const normPh = normalisePhone(phone);
  try {
    const res = await pool.query(
      `INSERT INTO support_demandes (telephone, nom, message, contexte_session, statut)
       VALUES ($1, $2, $3, $4, 'en_attente')
       RETURNING id, created_at`,
      [normPh, nom, message, JSON.stringify(contexte)]
    );

    // Tentative de notification WhatsApp de l'administrateur si configuré
    try {
      const adminTel = await cfg.get('admin_notification_phone');
      if (adminTel) {
        const msgAdmin =
          `🔔 *Nouvelle demande de rappel client Nopalou*\n\n` +
          `📞 Téléphone : *+${normPh}*\n` +
          `👤 Nom : *${nom || 'Non renseigné'}*\n` +
          `💬 Objet : ${message}\n` +
          `📅 Date : ${new Date().toLocaleString('fr-FR')}\n\n` +
          `👉 Rappeler le client : https://wa.me/${normPh}`;
        sendWhatsAppText(normalisePhone(adminTel), msgAdmin).catch(() => {});
      }
    } catch (_) {}

    return res.rows[0] || { id: null };
  } catch (err) {
    console.error('[ENREGISTRER DEMANDE SUPPORT ERR]:', err.message);
    return null;
  }
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

// Vérification si un numéro WhatsApp est propriétaire d'une boutique
async function estProprietaireBoutique(phone, boutique) {
  if (!phone || !boutique) return false;
  const normPh = normalisePhone(phone);
  const shortPh = phone.replace(/\D/g, '').slice(-9);

  if (
    (boutique.telephone && normalisePhone(boutique.telephone) === normPh) ||
    (boutique.whatsapp && normalisePhone(boutique.whatsapp) === normPh) ||
    (boutique.telephone && boutique.telephone.includes(shortPh)) ||
    (boutique.whatsapp && boutique.whatsapp.includes(shortPh))
  ) {
    return true;
  }

  try {
    const res = await pool.query(
      `SELECT b.id FROM boutiques b
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       WHERE b.id = $1
         AND (
           REGEXP_REPLACE(COALESCE(b.telephone, ''), '\\D', '', 'g') LIKE '%' || $2
           OR REGEXP_REPLACE(COALESCE(b.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $2
           OR REGEXP_REPLACE(COALESCE(u.telephone, ''), '\\D', '', 'g') LIKE '%' || $2
         )
       LIMIT 1`,
      [boutique.id, shortPh]
    );
    return res.rows.length > 0;
  } catch {
    return false;
  }
}

// File d'attente séquentielle par numéro de téléphone (FIFO Queue / Mutex) pour éliminer les race conditions
const _userQueues = new Map();
// Tampon en mémoire pour l'association automatique des photos multiples (batch d'images WhatsApp) - 5 minutes
const _recentsProduitsCrees = new Map();
const DUREE_TAMPON_PHOTOS_MS = 5 * 60 * 1000;
// Cache des codes OTP pour la réinitialisation de Code PIN marchand (valable 10 min)
const _otpCodesMarchand = new Map();

// ── Extraction et détection de texte produit (Nom, Prix, Stock) ────────────────
function extraireInfosProduitTexte(texte) {
  if (!texte || typeof texte !== 'string') return null;
  const raw = texte.trim();
  if (raw.length < 2) return null;

  let clean = raw;
  let stock = null;

  // 1. Détection du stock explicite avec mots-clés (ex: "stock 10", "qte: 5", "quantite 20", "qté 12", "x 10", "* 10")
  const explicitStockMatch = clean.match(/(?:stock|qte|quantite|qté|quantité)\s*[:=]?\s*(\d{1,5})/i) ||
                             clean.match(/(?:^|\s)[x*]\s*(\d{1,5})(?:\s|$)/i);
  if (explicitStockMatch) {
    stock = parseInt(explicitStockMatch[1], 10);
    clean = clean.replace(explicitStockMatch[0], ' ').trim();
  }

  // 2. Détection du format direct "[Nom] [Prix] [Stock]" à la fin du texte (ex: "Sac cuir 5000 10" ou "Robe 15000 FCFA 5")
  if (stock === null) {
    const directEndMatch = clean.match(/(\d{3,9})\s*(?:fcfa|cfa|f)?\s+(\d{1,5})\s*$/i);
    if (directEndMatch) {
      const prix = parseInt(directEndMatch[1], 10);
      stock = parseInt(directEndMatch[2], 10);
      const nom = clean.slice(0, clean.lastIndexOf(directEndMatch[0])).replace(/[-:–—]/g, ' ').replace(/\s+/g, ' ').trim();
      if (nom.length >= 2 && prix > 0 && stock >= 0) {
        return { nom, prix, stock };
      }
    }
  }

  // 3. Détection du stock entre parenthèses à la fin (ex: "Sac cuir 5000 (10)" ou "Sac cuir (10) 5000")
  if (stock === null) {
    const parenMatch = clean.match(/\((\d{1,5})\)/);
    if (parenMatch) {
      stock = parseInt(parenMatch[1], 10);
      clean = clean.replace(parenMatch[0], ' ').trim();
    }
  }

  // 4. Détection du prix standard (ex: "5000 FCFA", "5000f", "5000")
  const prixMatch = clean.match(/(\d{3,9})\s*(?:fcfa|cfa|f)?\s*$/i) ||
                    clean.match(/(?:^|\s)(\d{3,9})\s*(?:fcfa|cfa|f)?(?:\s|$)/i);
  if (!prixMatch) return null;

  const prix = parseInt(prixMatch[1], 10);
  if (isNaN(prix) || prix <= 0) return null;

  // Retirer le prix pour extraire le nom
  let nom = clean.replace(prixMatch[0], ' ')
                 .replace(/[-:–—]/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();

  if (nom.length < 2) return null;

  return { nom, prix, stock };
}

// ── Extraction et détection de numéro de téléphone sénégalais ─────────────────
function extraireNumeroTelephone(texte) {
  if (!texte) return null;
  const clean = String(texte).replace(/[\s\.\-\(\)\+]/g, '');
  const match = clean.match(/(?:(?:00)?221)?(7[05678]\d{7}|33\d{7}|\d{9})/);
  if (match) {
    const raw9 = match[1].slice(-9);
    return {
      national: raw9,
      international: `221${raw9}`,
    };
  }
  return null;
}

// Recherche d'une boutique active par son numéro de contact (ou numéro du gérant)
async function trouverBoutiqueParTelephone(phoneStr) {
  const telInfo = extraireNumeroTelephone(phoneStr);
  const rawDigits = phoneStr ? String(phoneStr).replace(/\D/g, '') : '';
  const short9 = telInfo ? telInfo.national : (rawDigits.length >= 9 ? rawDigits.slice(-9) : (rawDigits.length >= 7 ? rawDigits : null));
  if (!short9) return null;

  const { rows } = await pool.query(
    `SELECT b.id, b.nom, b.slug, b.categorie, b.ville, b.description, b.telephone, b.whatsapp, b.code_pin,
            b.couleur_theme, b.logo_url, u.nom AS proprietaire_nom
     FROM boutiques b
     LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
     WHERE (b.actif IS NULL OR b.actif = true)
       AND (
         REGEXP_REPLACE(COALESCE(b.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
         OR REGEXP_REPLACE(COALESCE(b.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $1
         OR REGEXP_REPLACE(COALESCE(u.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
       )
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [short9]
  );
  return rows[0] || null;
}

// Recherche de la boutique dont ce numéro est propriétaire/marchand
async function trouverBoutiqueMarchand(phone) {
  const rawDigits = String(phone).replace(/\D/g, '');
  const short9 = rawDigits.slice(-9);
  if (!short9) return null;

  const { rows } = await pool.query(
    `SELECT b.id, b.nom, b.slug, b.categorie, b.ville, b.description, b.telephone, b.whatsapp, b.code_pin,
            b.couleur_theme, b.logo_url, u.nom AS proprietaire_nom
     FROM boutiques b
     LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
     WHERE (b.actif IS NULL OR b.actif = true)
       AND (
         REGEXP_REPLACE(COALESCE(b.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $1
         OR REGEXP_REPLACE(COALESCE(b.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
         OR REGEXP_REPLACE(COALESCE(u.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
       )
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [short9]
  );
  return rows[0] || null;
}

// Vérification du Code PIN marchand (PIN de la boutique ou code d'un caissier actif)
async function verifierCodePin(boutique, pinSaisi) {
  if (!boutique || !pinSaisi) return false;
  const pinNettoye = String(pinSaisi).trim();
  const pinAttendu = String(boutique.code_pin || '1234').trim();
  if (pinNettoye === pinAttendu) return true;

  try {
    const { rows } = await pool.query(
      `SELECT id FROM boutique_caissiers WHERE boutique_id = $1 AND code_pin = $2 AND actif = TRUE LIMIT 1`,
      [boutique.id, pinNettoye]
    );
    if (rows.length > 0) return true;
  } catch (_) {}

  return false;
}

// ── Envoi du Menu Marchand Dédié & Authentifié ─────────────────────────────────
async function envoyerMenuMarchand(phone, boutique) {
  const header =
    `🏪 *Espace Marchand — ${boutique.nom}*\n` +
    `✅ Accès sécurisé déverrouillé\n\n` +
    `Bienvenue dans votre tableau de bord WhatsApp ! Choisissez une option ci-dessous :`;

  await sendWhatsAppText(phone, header);

  await sendWhatsAppInteractive(
    phone,
    boutique.nom,
    'Que souhaitez-vous faire ?',
    [
      {
        title: '📦 Produits & Commandes',
        rows: [
          { id: 'marchand_commandes', title: '📋 Mes Commandes', description: 'Suivi et statut des commandes clients' },
          { id: 'marchand_ajout_produit', title: '➕ Ajouter un produit', description: 'Envoi express ou guidé' },
          { id: 'marchand_stock', title: '📦 Mes Produits & Stock', description: 'Consulter et gérer vos articles' },
          { id: 'marchand_caisse', title: '💰 Bilan Caisse du jour', description: 'Ventes du jour Wave, OM, Cash' },
        ],
      },
      {
        title: '📒 Gestion & Vitrine',
        rows: [
          { id: 'marchand_dettes', title: '📒 Carnet de Dettes ("Bor")', description: 'Clients débiteurs & relances' },
          { id: 'marchand_vitrine', title: '🔗 Statut WhatsApp & Lien', description: 'Message à partager pour vendre' },
          { id: 'marchand_changer_pin', title: '⚙️ Changer mon Code PIN', description: 'Modifier votre code secret' },
          { id: 'menu', title: '⬅️ Menu Général', description: 'Retourner au menu Nopalou' },
        ],
      },
    ]
  );
  await setSession(phone, 'MARCHAND_MENU', { boutique, isMarchandAuth: true });
}

// ── Consultation et suivi des commandes par le marchand (avec pagination) ─────
async function envoyerCommandesMarchand(phone, boutique, offset = 0) {
  const safeOffset = Math.max(0, parseInt(offset || 0, 10));
  const { rows: commandes } = await pool.query(
    `SELECT 
       id, reference, nom_produit, quantite, prix_unitaire, montant_total,
       client_nom, client_telephone, client_adresse, methode_paiement, statut, created_at
     FROM commandes_boutique
     WHERE boutique_id = $1
     ORDER BY created_at DESC
     LIMIT 5 OFFSET $2`,
    [boutique.id, safeOffset]
  );

  const { rows: totalRows } = await pool.query(
    `SELECT COUNT(*) AS total FROM commandes_boutique WHERE boutique_id = $1`,
    [boutique.id]
  );
  const totalCommandes = parseInt(totalRows[0]?.total || 0, 10);

  if (!commandes.length) {
    if (safeOffset > 0) {
      await sendWhatsAppText(phone, 'Vous avez atteint la fin de la liste des commandes.');
      await envoyerCommandesMarchand(phone, boutique, Math.max(0, safeOffset - 5));
      return;
    }
    await sendWhatsAppText(
      phone,
      `📋 *Commandes — ${boutique.nom}*\n\n` +
      `Vous n'avez pas encore reçu de commande en ligne.\n\n` +
      `👉 Partagez votre vitrine sur vos Statuts WhatsApp pour recevoir vos premières commandes : ${SITE}/boutiques/${boutique.slug}`
    );
    await setSession(phone, 'MARCHAND_MENU', { boutique, isMarchandAuth: true });
    return;
  }

  const STATUT_LABELS = {
    'en_attente': '🟡 En attente',
    'payee': '🟢 Payée',
    'confirmee': '🔵 Confirmée',
    'en_livraison': '🚚 En cours de livraison',
    'livree': '🎉 Livrée',
    'annulee': '❌ Annulée',
  };

  const METHODES = {
    'wave': '🌊 Wave',
    'orange_money': '🟠 Orange Money',
    'cash': '💵 Espèces à la livraison',
    'especes': '💵 Espèces',
  };

  const fiches = commandes.map((c, i) => {
    const numIdx = safeOffset + i + 1;
    const dateFmt = new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const statutTxt = STATUT_LABELS[c.statut] || `🔹 ${c.statut}`;
    const methodeTxt = METHODES[c.methode_paiement] || c.methode_paiement;
    const telClientNorm = normalisePhone(c.client_telephone);
    const waClientLink = `https://wa.me/${telClientNorm}?text=${encodeURIComponent(`Bonjour ${c.client_nom}, c'est ${boutique.nom} concernant votre commande ${c.reference} (${c.nom_produit}).`)}`;

    return (
      `*${numIdx}. Réf : ${c.reference}* (${statutTxt})\n` +
      `🛍️ *${c.nom_produit}* × ${c.quantite} — *${prixFmt(c.montant_total)}*\n` +
      `👤 Client : *${c.client_nom}* (📞 +${telClientNorm})\n` +
      `📍 Lieu : ${c.client_adresse || 'Non précisé'}\n` +
      `💳 Paiement : ${methodeTxt}\n` +
      `📅 Date : ${dateFmt}\n` +
      `💬 Contact Client : ${waClientLink}`
    );
  });

  const pageInfo = totalCommandes > 5 ? ` (${safeOffset + 1}-${Math.min(safeOffset + commandes.length, totalCommandes)} sur ${totalCommandes})` : '';

  await sendWhatsAppText(
    phone,
    `📋 *Commandes — ${boutique.nom}${pageInfo} :*\n\n` +
    `${fiches.join('\n\n─────────────────────\n\n')}\n\n` +
    `👉 *Pour changer le statut d'une commande :*\n` +
    `Tapez son numéro (*1*, *2*, *3*...) ou sélectionnez-la dans la liste ci-dessous :`
  );

  // Menu interactif pour sélectionner quelle commande gérer
  const rows = commandes.map((c, i) => {
    const numIdx = safeOffset + i + 1;
    const statutTxt = STATUT_LABELS[c.statut] || c.statut;
    return {
      id: `cmd_sel_${c.id}`,
      title: `${numIdx}. ${c.reference}`.slice(0, 24),
      description: `${c.client_nom} — ${statutTxt}`.slice(0, 72),
    };
  });

  if (safeOffset + 5 < totalCommandes) {
    rows.push({
      id: `cmd_page_${safeOffset + 5}`,
      title: '⏩ Suivantes (+5)',
      description: 'Voir les 5 commandes plus anciennes',
    });
  }
  if (safeOffset > 0) {
    rows.push({
      id: `cmd_page_${Math.max(0, safeOffset - 5)}`,
      title: '⏪ Précédentes (-5)',
      description: 'Revenir aux commandes plus récentes',
    });
  }

  await sendWhatsAppInteractive(
    phone,
    'Gérer une commande',
    'Sélectionnez la commande à mettre à jour :',
    [
      {
        title: 'Commandes',
        rows: rows.slice(0, 10),
      },
    ]
  ).catch(() => {});

  await setSession(phone, 'MARCHAND_COMMANDES_LISTE', {
    boutique,
    isMarchandAuth: true,
    commandes,
    offset: safeOffset,
  });
}

// ── Fiche d'action pour une commande précise (Changement de statut en 1 clic) ─
async function envoyerFicheActionCommande(phone, boutique, commande) {
  if (!commande) return;

  const STATUT_LABELS = {
    'en_attente': '🟡 En attente',
    'payee': '🟢 Payée',
    'confirmee': '🔵 Confirmée',
    'en_livraison': '🚚 En cours de livraison',
    'livree': '🎉 Livrée',
    'annulee': '❌ Annulée',
  };

  const METHODES = {
    'wave': '🌊 Wave',
    'orange_money': '🟠 Orange Money',
    'cash': '💵 Espèces à la livraison',
    'especes': '💵 Espèces',
  };

  const statutTxt = STATUT_LABELS[commande.statut] || `🔹 ${commande.statut}`;
  const methodeTxt = METHODES[commande.methode_paiement] || commande.methode_paiement;
  const telClientNorm = normalisePhone(commande.client_telephone);
  const waClientLink = `https://wa.me/${telClientNorm}?text=${encodeURIComponent(`Bonjour ${commande.client_nom}, c'est ${boutique.nom} concernant votre commande ${commande.reference} (${commande.nom_produit}).`)}`;
  const dateFmt = new Date(commande.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const msgFiche =
    `📦 *Commande ${commande.reference}* (${statutTxt})\n\n` +
    `🛍️ Article : *${commande.nom_produit}* (× ${commande.quantite})\n` +
    `💰 Montant : *${prixFmt(commande.montant_total)}*\n` +
    `👤 Client : *${commande.client_nom}* (📞 +${telClientNorm})\n` +
    `📍 Adresse : ${commande.client_adresse || 'Non précisée'}\n` +
    `💳 Mode Paiement : ${methodeTxt}\n` +
    `📅 Date : ${dateFmt}\n\n` +
    `💬 *Discuter sur WhatsApp avec le client :*\n${waClientLink}`;

  await sendWhatsAppText(phone, msgFiche);

  // Proposer les boutons d'action adaptés au statut actuel
  const buttons = [];
  if (commande.statut === 'en_attente' || commande.statut === 'payee') {
    buttons.push({ id: `cmd_statut_${commande.id}_confirmee`, title: '✅ Confirmer' });
    buttons.push({ id: `cmd_statut_${commande.id}_en_livraison`, title: '🚚 En livraison' });
    buttons.push({ id: `cmd_statut_${commande.id}_livree`, title: '🎉 Livrée' });
  } else if (commande.statut === 'confirmee') {
    buttons.push({ id: `cmd_statut_${commande.id}_en_livraison`, title: '🚚 En livraison' });
    buttons.push({ id: `cmd_statut_${commande.id}_livree`, title: '🎉 Livrée' });
    buttons.push({ id: `cmd_statut_${commande.id}_annulee`, title: '❌ Annuler' });
  } else if (commande.statut === 'en_livraison') {
    buttons.push({ id: `cmd_statut_${commande.id}_livree`, title: '🎉 Marquer Livrée' });
    buttons.push({ id: `cmd_statut_${commande.id}_confirmee`, title: '🔵 Remettre Confirmée' });
    buttons.push({ id: `cmd_statut_${commande.id}_annulee`, title: '❌ Annuler' });
  } else {
    buttons.push({ id: `cmd_statut_${commande.id}_confirmee`, title: '🔄 Rouvrir commande' });
    buttons.push({ id: 'marchand_commandes', title: '📋 Liste commandes' });
    buttons.push({ id: 'menu_marchand', title: '🏪 Menu Marchand' });
  }

  await sendWhatsAppButtons3(
    phone,
    `Changer le statut de *${commande.reference}* (${commande.client_nom}) :`,
    buttons.slice(0, 3)
  ).catch(() => {});

  await sendWhatsAppText(
    phone,
    `💡 *Astuce :* Tapez un autre numéro (*1*, *2*, *3*...) pour gérer une autre commande, ou tapez *commandes* pour réafficher toute la liste.`
  );
}

// ── Consultation des produits & état de stock par le marchand ─────────────────
async function envoyerStockMarchand(phone, boutique) {
  const { rows: produits } = await pool.query(
    `SELECT id, nom, prix, en_stock, stock_quantite, array_length(images, 1) AS nb_photos
     FROM boutique_produits
     WHERE boutique_id = $1
     ORDER BY created_at DESC
     LIMIT 6`,
    [boutique.id]
  );

  if (!produits.length) {
    await sendWhatsAppText(
      phone,
      `📦 *Catalogue — ${boutique.nom}*\n\n` +
      `Votre catalogue est actuellement vide.\n\n` +
      `👉 Pour publier votre premier article, envoyez simplement une photo avec le nom et le prix en légende (ex: *Sac cuir 5000*) ou tapez *+produit* !`
    );
  } else {
    const lines = produits.map((p, i) => {
      const stockStr = (p.stock_quantite !== null && p.stock_quantite !== undefined)
        ? (p.stock_quantite > 0 ? `✅ ${p.stock_quantite} en stock` : '❌ Rupture')
        : (p.en_stock !== false ? '✅ En stock' : '❌ Rupture');
      return `${i + 1}. *${p.nom}* — ${prixFmt(p.prix)} (${stockStr})`;
    });

    await sendWhatsAppText(
      phone,
      `📦 *Vos derniers produits — ${boutique.nom} :*\n\n` +
      `${lines.join('\n\n')}\n\n` +
      `🔗 Vitrine : ${SITE}/boutiques/${boutique.slug}`
    );
  }

  await sendWhatsAppButton(
    phone,
    'Souhaitez-vous ajouter un nouvel article ?',
    'marchand_ajout_produit',
    '➕ Ajouter un produit'
  ).catch(() => {});
  await setSession(phone, 'MARCHAND_MENU', { boutique, isMarchandAuth: true });
}

// ── Bilan de caisse & ventes du jour en direct ─────────────────────────────────
async function envoyerBilanCaisseMarchand(phone, boutique) {
  const { rows: [stats] } = await pool.query(
    `SELECT 
       COUNT(*) AS nb_ventes,
       COALESCE(SUM(montant_total), 0) AS total_ca,
       COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement ILIKE '%wave%'), 0) AS ca_wave,
       COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement ILIKE '%orange%' OR methode_paiement ILIKE '%om%'), 0) AS ca_om,
       COALESCE(SUM(montant_total) FILTER (WHERE methode_paiement ILIKE '%cash%' OR methode_paiement ILIKE '%espece%'), 0) AS ca_cash
     FROM commandes_boutique
     WHERE boutique_id = $1
       AND created_at >= CURRENT_DATE
       AND (statut IS NULL OR statut != 'annulee')`,
    [boutique.id]
  );

  const nbVentes = parseInt(stats.nb_ventes || 0, 10);
  const totalCa = Number(stats.total_ca || 0);
  const caWave = Number(stats.ca_wave || 0);
  const caOm = Number(stats.ca_om || 0);
  const caCash = Number(stats.ca_cash || 0);

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const msg =
    `💰 *Bilan Caisse du Jour — ${boutique.nom}*\n` +
    `📅 *${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}*\n\n` +
    `💵 *Chiffre d'Affaires : ${prixFmt(totalCa)}*\n` +
    `📦 *Ventes / Commandes : ${nbVentes}*\n\n` +
    `📊 *Répartition par mode d'encaissement :*\n` +
    `• 🌊 Wave : *${prixFmt(caWave)}*\n` +
    `• 🟠 Orange Money : *${prixFmt(caOm)}*\n` +
    `• 💵 Espèces (Cash) : *${prixFmt(caCash)}*\n\n` +
    `👉 *Accéder à votre Caisse Tactile POS en direct :*\n` +
    `${SITE}/boutique/caisse`;

  await sendWhatsAppText(phone, msg);
  await setSession(phone, 'MARCHAND_MENU', { boutique, isMarchandAuth: true });
}

// ── Carnet de Dettes ("Bor") & Relances WhatsApp en 1 clic ─────────────────────
async function envoyerCarnetDettesMarchand(phone, boutique) {
  let clientsDettes = [];
  try {
    const r = await pool.query(
      `SELECT nom, telephone, COALESCE(solde, 0) AS solde_dette
       FROM caisse_clients_credits
       WHERE boutique_id = $1 AND COALESCE(solde, 0) > 0
       ORDER BY solde DESC
       LIMIT 5`,
      [boutique.id]
    );
    clientsDettes = r.rows;
  } catch (e) {}

  if (!clientsDettes.length) {
    await sendWhatsAppText(
      phone,
      `📒 *Carnet de Dettes ("Bor") — ${boutique.nom}*\n\n` +
      `✅ *Excellente nouvelle !* Aucun client n'a de dette impayée enregistrée pour le moment.`
    );
  } else {
    const totalDettes = clientsDettes.reduce((sum, c) => sum + Number(c.solde_dette || 0), 0);
    const lines = clientsDettes.map((c, i) => {
      let line = `${i + 1}. *${c.nom}* : *${prixFmt(c.solde_dette)}*`;
      if (c.telephone) {
        const telNorm = normalisePhone(c.telephone);
        const waRelanceMsg = encodeURIComponent(
          `Bonjour ${c.nom}, ceci est un rappel amical de votre solde de ${prixFmt(c.solde_dette)} chez ${boutique.nom}. Merci de nous contacter pour convenir du règlement. Cordialement.`
        );
        line += `\n   👉 Relancer sur WhatsApp : https://wa.me/${telNorm}?text=${waRelanceMsg}`;
      }
      return line;
    });

    await sendWhatsAppText(
      phone,
      `📒 *Carnet de Dettes ("Bor") — ${boutique.nom}*\n\n` +
      `💰 *Total des dettes dehors : ${prixFmt(totalDettes)}*\n\n` +
      `📋 *Clients Débiteurs :*\n` +
      `${lines.join('\n\n')}\n\n` +
      `💡 _Cliquez sur un lien ci-dessus pour envoyer instantanément un rappel poli WhatsApp au client !_`
    );
  }
  await setSession(phone, 'MARCHAND_MENU', { boutique, isMarchandAuth: true });
}

// ── Message prêt pour le Statut WhatsApp du commerçant ────────────────────────
async function envoyerVitrineStatutMarchand(phone, boutique) {
  const msgStatut =
    `✨ *${boutique.nom}* vous souhaite la bienvenue ! 🛍️\n\n` +
    `Découvrez nos nouveaux articles disponibles et commandez en ligne en 1 clic avec livraison rapide :\n` +
    `👉 ${SITE}/boutiques/${boutique.slug}\n\n` +
    `🚚 Livraison rapide & Paiement direct Wave / Orange Money / Espèces.`;

  await sendWhatsAppText(
    phone,
    `📲 *Message prêt pour votre Statut WhatsApp :*\n\n` +
    `Copiez ou transférez le message ci-dessous dans votre *Statut WhatsApp* pour attirer vos clients !\n` +
    `─────────────────────\n` +
    `${msgStatut}\n` +
    `─────────────────────`
  );
  await setSession(phone, 'MARCHAND_MENU', { boutique, isMarchandAuth: true });
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
          { id: 'creer_boutique', title: '🛍️ Créer ma boutique', description: 'Vendre sur Nopalou (30j offerts)' },
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
  const isOwner = await estProprietaireBoutique(phone, boutique);

  const infos = [boutique.categorie, boutique.ville].filter(Boolean).join(' — ');
  let entete = `🏪 *${boutique.nom}*`;
  if (infos) entete += `\n${infos}`;
  if (boutique.description) entete += `\n${boutique.description}`;
  await sendWhatsAppText(phone, entete);

  const sections = [
    {
      title: 'Catalogue',
      rows: [
        { id: 'boutique_produits_tous', title: '🛍️ Voir les produits', description: 'Défiler les produits un par un' },
        { id: 'boutique_recherche', title: '🔍 Rechercher', description: 'Chercher un produit dans cette boutique' },
        { id: 'boutique_categorie', title: '📂 Par catégorie', description: 'Parcourir les catégories de produits' },
      ],
    },
  ];

  // ⚠️ Option "➕ Ajouter un produit" UNIQUEMENT si le numéro correspond au propriétaire de CETTE boutique
  if (isOwner) {
    sections.push({
      title: 'Gestion Marchand (Votre Boutique)',
      rows: [
        { id: `boutique_ajout_prod_${boutique.id}`, title: '➕ Ajouter un produit', description: 'Ajouter un article à votre boutique' },
      ],
    });
  }

  sections.push({
    title: 'Autre',
    rows: [
      { id: 'boutique_contact', title: '📞 Contacter le vendeur', description: 'Ouvrir une conversation directe' },
      { id: 'boutique_quitter', title: '⬅️ Changer de boutique', description: 'Retour au menu principal' },
    ],
  });

  await sendWhatsAppInteractive(
    phone,
    boutique.nom,
    'Que voulez-vous faire ?',
    sections
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
    templateName: 'nopalou_carousel_immo',
    imageUrl: a.photo || null,
    title: a.titre,
    detail: prixFmt(a.prix),
    pageUrl: `${SITE}/immo/${a.id}`,
  }));
  await sendWhatsAppCarousel(phone, 'nopalou_carousel_immo', cards).catch(() =>
    sendWhatsAppText(phone, cards.map(c => `• ${c.title} — ${c.detail}\n${c.pageUrl}`).join('\n\n'))
  );
  await attendre(2200); // laisse le temps aux messages du carousel de s'afficher avant le bouton
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
     ORDER BY created_at DESC LIMIT 7`,
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

  // Enregistrer immédiatement l'état de session avec la liste ordonnée des boutiques
  await setSession(phone, 'BOUTIQUE_LISTE', {
    boutiquesAffichees: r.rows,
    last: { type: 'boutiques_toutes', shownIds: excludeIds.concat(r.rows.map(b => String(b.id))) },
  });

  const lines = r.rows.map((b, i) => `${i + 1}. *${b.nom}* (${b.categorie || 'commerce'}${b.ville ? ` — ${b.ville}` : ''})`);
  await sendWhatsAppText(
    phone,
    `🏪 *Boutiques Nopalou :*\n\n${lines.join('\n')}\n\n` +
    `Tapez le numéro (1, 2...), le nom d'une boutique, ou choisissez ci-dessous :`
  );

  const rows = [
    {
      id: 'boutique_recherche_nom',
      title: '🔍 Chercher par nom',
      description: 'Rechercher une boutique par son nom',
    },
    {
      id: 'boutique_secteur_liste',
      title: '📂 Choisir par secteur',
      description: 'Filtrer les boutiques par catégorie',
    },
    ...r.rows.map((b, i) => ({
      id: `boutique_choisie_${b.id}`,
      title: `${i + 1}. ${b.nom}`.slice(0, 24),
      description: [b.categorie, b.ville].filter(Boolean).join(' — ') || undefined,
    })),
  ];

  await sendWhatsAppInteractive(phone, 'Boutiques Nopalou', 'Cliquez sur une option ci-dessous :', [
    { title: 'Boutiques Nopalou', rows },
  ]).catch(() => {});

  await attendre(400);
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres boutiques, ou cherchez par nom :').catch(() => {});
}

async function envoyerListeBoutiques(phone, secteur, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, nom, slug, categorie, ville FROM boutiques
     WHERE actif=true AND (categorie ILIKE $1 OR categorie ILIKE '%' || $1 || '%') AND id::text <> ALL($2::text[])
     ORDER BY created_at DESC LIMIT 7`,
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

  // Enregistrer immédiatement l'état de session avec la liste ordonnée des boutiques
  await setSession(phone, 'BOUTIQUE_LISTE', {
    secteur,
    boutiquesAffichees: r.rows,
    last: { type: 'boutique_liste', shownIds: excludeIds.concat(r.rows.map(b => String(b.id))) },
  });

  const lines = r.rows.map((b, i) => `${i + 1}. *${b.nom}* (${b.categorie || 'commerce'}${b.ville ? ` — ${b.ville}` : ''})`);
  await sendWhatsAppText(
    phone,
    `🏪 *Boutiques — ${secteur} :*\n\n${lines.join('\n')}\n\n` +
    `Tapez le numéro (1, 2...), le nom d'une boutique, ou choisissez ci-dessous :`
  );

  const rows = [
    {
      id: 'boutique_recherche_nom',
      title: '🔍 Chercher par nom',
      description: 'Rechercher une boutique par nom',
    },
    ...r.rows.map((b, i) => ({
      id: `boutique_choisie_${b.id}`,
      title: `${i + 1}. ${b.nom}`.slice(0, 24),
      description: b.ville || undefined,
    })),
  ];

  await sendWhatsAppInteractive(phone, 'Boutiques', `Boutiques du secteur *${secteur}* :`, [
    { title: String(secteur).slice(0, 24), rows },
  ]).catch(() => {});

  await attendre(400);
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres boutiques, ou choisissez-en une ci-dessus :').catch(() => {});
}

// ── Recherche de boutiques par nom (mot-clé ou téléphone) ────────────────────
async function rechercherBoutiquesParNom(phone, query, excludeIds = []) {
  const cleanQ = (query || '').trim();
  if (!cleanQ || cleanQ.length < 2) {
    await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 lettres pour rechercher une boutique (ou tapez *menu*).');
    await setSession(phone, 'BOUTIQUE_SEARCH_SHOP', {});
    return;
  }

  // 1. Si la recherche correspond directement à un numéro de téléphone
  const bqTel = await trouverBoutiqueParTelephone(cleanQ);
  if (bqTel && excludeIds.length === 0) {
    await sendWhatsAppText(phone, `🏪 J'ai trouvé la boutique *${bqTel.nom}* (${bqTel.categorie || 'Commerce'}${bqTel.ville ? ` — ${bqTel.ville}` : ''}) !`);
    await envoyerMenuBoutique(phone, bqTel);
    return;
  }

  const rawDigits = cleanQ.replace(/\D/g, '');
  const phonePattern = rawDigits.length >= 6 ? rawDigits.slice(-9) : '___AUCUN___';

  const r = await pool.query(
    `SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp
     FROM boutiques
     WHERE (actif IS NULL OR actif = true)
       AND (
         nom ILIKE $1
         OR slug ILIKE $1
         OR COALESCE(description, '') ILIKE $1
         OR COALESCE(categorie, '') ILIKE $1
         OR REGEXP_REPLACE(COALESCE(telephone, ''), '\\D', '', 'g') LIKE '%' || $2
         OR REGEXP_REPLACE(COALESCE(whatsapp, ''), '\\D', '', 'g') LIKE '%' || $2
       )
       AND id::text <> ALL($3::text[])
     ORDER BY created_at DESC LIMIT 7`,
    [`%${cleanQ}%`, phonePattern, excludeIds]
  );

  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? `✅ Vous avez vu toutes les boutiques correspondant à *"${cleanQ}"*. Tapez *menu* pour revenir.`
        : `😕 Aucune boutique trouvée pour *"${cleanQ}"*.\n\nVous pouvez entrer un autre nom, un numéro de téléphone, ou taper *menu*.`
    );
    await sendWhatsAppMenuOuFin(phone, 'Tapez un autre nom de boutique ou :').catch(() => {});
    await setSession(phone, 'BOUTIQUE_SEARCH_SHOP', {});
    return;
  }

  if (r.rows.length === 1 && excludeIds.length === 0) {
    const b = r.rows[0];
    await sendWhatsAppText(phone, `🏪 J'ai trouvé la boutique *${b.nom}* (${b.categorie || 'commerce'}${b.ville ? ` — ${b.ville}` : ''}) !`);
    await envoyerMenuBoutique(phone, b);
    return;
  }

  await setSession(phone, 'BOUTIQUE_LISTE', {
    boutiquesAffichees: r.rows,
    last: { type: 'boutique_search_shop', query: cleanQ, shownIds: excludeIds.concat(r.rows.map(b => String(b.id))) },
  });

  const lines = r.rows.map((b, i) => `${i + 1}. *${b.nom}* (${b.categorie || 'commerce'}${b.ville ? ` — ${b.ville}` : ''})`);
  await sendWhatsAppText(
    phone,
    `🔍 *Boutiques correspondant à "${cleanQ}" :*\n\n${lines.join('\n')}\n\n` +
    `Tapez le numéro (1, 2...), le nom d'une boutique, ou choisissez ci-dessous :`
  );

  const rows = [
    {
      id: 'boutique_recherche_nom',
      title: '🔍 Autre recherche nom',
      description: 'Chercher un autre nom de boutique',
    },
    {
      id: 'boutique_secteur_liste',
      title: '📂 Choisir par secteur',
      description: 'Filtrer les boutiques par catégorie',
    },
    ...r.rows.map((b, i) => ({
      id: `boutique_choisie_${b.id}`,
      title: `${i + 1}. ${b.nom}`.slice(0, 24),
      description: [b.categorie, b.ville].filter(Boolean).join(' — ') || undefined,
    })),
  ];

  await sendWhatsAppInteractive(phone, 'Boutiques', `Résultats pour "${cleanQ}" :`, [
    { title: 'Boutiques trouvées', rows },
  ]).catch(() => {});

  await attendre(400);
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres résultats, ou tapez un autre nom :').catch(() => {});
}

// ── Fiche produit complète (boutique) ───────────────────────────────────────
// Product Message Meta native + message texte détaillé + 3 boutons (Commander, Suivant, Vendeur/Rechercher).
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
    { id: `prod_suivant_${produit.id}`, title: '⏩ Suivant' },
  ];
  if (contactVendeur) {
    buttons.push({ id: `contact_vendeur_${produit.id}`, title: '💬 Vendeur' });
  } else {
    buttons.push({ id: 'boutique_recherche', title: '🔍 Rechercher' });
  }

  await sendWhatsAppButtons3(phone, 'Que souhaitez-vous faire ? (ou tapez *suivant*)', buttons).catch(() => {});
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
        { id: 'pay_credit', title: '💳 Demande Achat Crédit' },
        { id: 'pay_om', title: '🟠 Orange Money' },
        { id: 'pay_virement', title: '🏦 Virement' },
      ],
    }]
  );
  await setSession(phone, 'COMMANDE_PAIEMENT', { boutique, commande });
}

async function envoyerRecapFinal(phone, boutique, commande) {
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces à la livraison', virement: 'Virement', credit: '💳 Demande d\'Achat à Crédit (Carnet client)' };
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
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement', credit: '💳 Demande d\'Achat à Crédit (Carnet client)' };
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

// ── Dispatcher principal avec file d'attente séquentielle par numéro ────────────
async function handleIncoming(msg) {
  if (!msg || !msg.from) return;
  const phone = normalisePhone(msg.from);

  const prevPromise = _userQueues.get(phone) || Promise.resolve();
  const currentPromise = (async () => {
    try {
      await prevPromise;
    } catch (_) {}
    return handleIncomingInternal(msg);
  })();

  _userQueues.set(phone, currentPromise);

  try {
    return await currentPromise;
  } finally {
    if (_userQueues.get(phone) === currentPromise) {
      _userQueues.delete(phone);
    }
  }
}

async function handleIncomingInternal(msg) {
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
  const text = (msg.text?.body || msg.image?.caption || '').trim();
  const interactiveId = msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || '';
  const mediaId = msg.type === 'image' ? msg.image?.id : null;

  const normText = normaliserTexte(text);
  const normInteractive = normaliserTexte(interactiveId);

  // ── 1. Désinscription définitive / STOP (Opt-out) ──────────────────────────
  const MOTS_STOP = ['stop', 'desinscrire', 'desabonner', 'ne plus recevoir', 'bloquer', 'interdire', 'ne plus me contacter'];
  const estMotStop = MOTS_STOP.some(m => normText === m || normText.includes(m)) || normInteractive === 'stop';

  if (estMotStop) {
    await ajouterBlacklist(phone, 'user_stop');
    const telClean = phone.replace(/\D/g, '').slice(-9);
    try {
      await pool.query(
        `UPDATE annonces_classifiees SET actif = false, supprimee = true, updated_at = NOW() WHERE contact_tel LIKE '%' || $1 OR contact_tel LIKE '%' || $2`,
        [telClean, phone]
      );
      await pool.query(
        `UPDATE annonces_immo SET actif = false, supprimee = true, updated_at = NOW() WHERE contact_tel LIKE '%' || $1 OR contact_tel LIKE '%' || $2`,
        [telClean, phone]
      );
      await pool.query(`UPDATE alertes SET active = false WHERE telephone LIKE '%' || $1 OR telephone = $2`, [telClean, phone]);
    } catch {}

    await sendWhatsAppText(
      phone,
      `❌ *Désinscription effectuée — Nopalou*\n\nVous êtes maintenant désinscrit(e) des messages WhatsApp Nopalou. Vos annonces et alertes associées ont été désactivées.\n\nVous ne recevrez plus aucun message de notre part sur ce numéro (+${phone}).\n\n*(Pour vous réinscrire un jour : envoyez simplement START)*`
    );
    await setSession(phone, 'IDLE', {});
    return;
  }

  // ── 2. Réinscription / START ────────────────────────────────────────────────
  const MOTS_START = ['start', 'reinscrire', 'debloquer', 'reprendre'];
  if (MOTS_START.includes(normText)) {
    await retirerBlacklist(phone);
    await sendWhatsAppText(
      phone,
      `✅ *Réinscription effectuée — Nopalou*\n\nVotre numéro (+${phone}) a bien été réinscrit. Vous pouvez de nouveau échanger avec l'assistant Nopalou.\n\nTapez *menu* pour commencer !`
    );
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // Si le numéro est désinscrit (blacklisté) et n'a pas tapé START, ignorer
  if (await estDesinscrit(phone)) {
    return;
  }

  // ── 3. Suppression d'annonce ou de numéro ──────────────────────────────────
  const MOTS_SUPPRIMER = ['supprimer', 'effacer', 'retirer', 'retirer mon annonce', 'supprimer mon annonce', 'supprimer mon numero', 'retirer mon numero', 'supprimer mes annonces'];
  const estMotSupprimer = MOTS_SUPPRIMER.some(m => normText.includes(m)) || normInteractive === 'supprimer_donnees';

  if (estMotSupprimer) {
    const telClean = phone.replace(/\D/g, '').slice(-9);
    let totalDesactives = 0;
    try {
      const r1 = await pool.query(
        `UPDATE annonces_classifiees SET actif = false, supprimee = true, updated_at = NOW() WHERE (contact_tel LIKE '%' || $1 OR contact_tel LIKE '%' || $2) AND supprimee = false RETURNING id`,
        [telClean, phone]
      );
      totalDesactives += r1.rows.length;

      const r2 = await pool.query(
        `UPDATE annonces_immo SET actif = false, supprimee = true, updated_at = NOW() WHERE (contact_tel LIKE '%' || $1 OR contact_tel LIKE '%' || $2) AND supprimee = false RETURNING id`,
        [telClean, phone]
      );
      totalDesactives += r2.rows.length;

      await pool.query(`UPDATE alertes SET active = false WHERE telephone LIKE '%' || $1 OR telephone = $2`, [telClean, phone]);
    } catch (e) {
      console.error('[SUPPRESSION NUMERO ERR]:', e.message);
    }

    let msg = `🗑️ *Demande de retrait / suppression Nopalou*\n\n`;
    if (totalDesactives > 0) {
      msg += `✅ *${totalDesactives} annonce(s)* et vos coordonnées rattachées au +${phone} ont été **désactivées et retirées** de Nopalou.com.\n\n`;
    } else {
      msg += `Vos coordonnées (+${phone}) ont été enregistrées pour suppression. Aucune annonce publique active n'a été trouvée pour ce numéro.\n\n`;
    }
    msg += `Si vous ne souhaitez plus recevoir AUCUN message WhatsApp de Nopalou, envoyez simplement *STOP*.\n\nPour toute demande complémentaire d'effacement de données, écrivez à ✉️ contact@nopalou.com.`;

    await sendWhatsAppText(phone, msg);
    await setSession(phone, 'MENU', {});
    return;
  }

  // ── 1. MOT-CLÉ PRIORITAIRE DE DÉSINSCRIPTION / OPTOUT (STOP / ARRET / REFUS) ──
  const MOTS_OPTOUT = ['stop', 'arret', 'desinscrire', 'desinscription', 'annuler', 'bloquer', 'supprimer', 'ne plus recevoir', 'refus'];
  if (MOTS_OPTOUT.includes(normaliserTexte(text).trim())) {
    const normPh = normalisePhone(phone);
    await ajouterBlacklist(normPh, 'demande_utilisateur_stop');
    try {
      await pool.query(
        "UPDATE prospection_leads SET statut = 'desinscrit', updated_at = NOW() WHERE telephone = $1",
        [normPh]
      );
    } catch (_) {}

    await sendWhatsAppText(
      phone,
      '✅ *Désinscription confirmée*\n\nC\'est bien noté ! Votre numéro a été retiré avec succès de nos listes. Vous ne recevrez plus aucun message de prospection ou de notification de notre part.\n\nSi vous souhaitez revenir plus tard, il vous suffira de taper *menu*.'
    );
    await setSession(phone, 'IDLE', {});
    return;
  }

  // ── 2. DÉCLENCHEURS MARCHANDS WHATSAPP : CRÉATION DE BOUTIQUE & AJOUT PRODUIT ─
  const normTxtLower = normaliserTexte(text).trim();

  // ── GESTION MULTI-PHOTOS WHATSAPP (Photos additionnelles sans légende) ──────
  if (msg.type === 'image') {
    const normPh = normalisePhone(phone);
    const recentProd = _recentsProduitsCrees.get(normPh);
    const caption = (msg.image?.caption || '').trim();

    // Si c'est une image additionnelle sans légende envoyée dans les 5 min après la création d'un article
    if (recentProd && !caption && (Date.now() - recentProd.timestamp < DUREE_TAMPON_PHOTOS_MS) && state !== 'AJOUT_PRODUIT_PHOTO') {
      if (msg.image?.id) {
        const imageUrl = await telechargerMediaWhatsApp(msg.image.id);
        if (imageUrl) {
          await pool.query(
            `UPDATE boutique_produits SET images = array_append(images, $1) WHERE id = $2`,
            [imageUrl, recentProd.produitId]
          );
          recentProd.totalPhotos = (recentProd.totalPhotos || 1) + 1;
          recentProd.timestamp = Date.now();
          await sendWhatsAppText(
            phone,
            `📸 *Photo supplémentaire (${recentProd.totalPhotos}) ajoutée* à votre article *${recentProd.nom}* !`
          );
          return;
        }
      }
    }
  }

  // ── DÉTECTION D'UN NUMÉRO DE TÉLÉPHONE DANS LE MESSAGE (Accès Direct Boutique) ─
  const etatsExclusNum = [
    'COMMANDE_NOM', 'COMMANDE_TELEPHONE', 'COMMANDE_ADRESSE', 'COMMANDE_ZONE', 'COMMANDE_QUANTITE',
    'AJOUT_PRODUIT_NOM', 'AJOUT_PRODUIT_PRIX', 'AJOUT_PRODUIT_STOCK', 'AJOUT_PRODUIT_PHOTO', 'CREER_BOUTIQUE_NOM', 'CREER_BOUTIQUE_QUARTIER',
    'MARCHAND_CHANGE_PIN_ACTUEL', 'MARCHAND_CHANGE_PIN_NOUVEAU', 'MARCHAND_RESET_OTP', 'MARCHAND_RESET_NOUVEAU_PIN',
    'MARCHAND_PIN'
  ];
  if (!etatsExclusNum.includes(state)) {
    const numDetecte = extraireNumeroTelephone(text);
    if (numDetecte) {
      const bqTrouvee = await trouverBoutiqueParTelephone(text);
      if (bqTrouvee) {
        const isOwner = await estProprietaireBoutique(phone, bqTrouvee);
        if (isOwner) {
          if (context?.isMarchandAuth) {
            await envoyerMenuMarchand(phone, bqTrouvee);
            return;
          } else {
            await setSession(phone, 'MARCHAND_PIN', { boutique: bqTrouvee });
            await sendWhatsAppText(
              phone,
              `👋 Bonjour *${bqTrouvee.proprietaire_nom || bqTrouvee.nom}* !\n\n` +
              `🔐 *Espace Marchand — ${bqTrouvee.nom}*\n` +
              `Veuillez saisir votre **Code PIN** (par défaut : 1234) pour accéder à vos outils de gestion :`
            );
            return;
          }
        } else {
          // Client / Visiteur qui envoie ou recherche le numéro d'une boutique
          await sendWhatsAppText(
            phone,
            `🏪 *${bqTrouvee.nom}*\n` +
            `📍 ${bqTrouvee.categorie || 'Commerce'}${bqTrouvee.ville ? ` — ${bqTrouvee.ville}` : ''}\n` +
            `${bqTrouvee.description ? `${bqTrouvee.description}\n` : ''}\n` +
            `👉 *Vitrine en ligne :* ${SITE}/boutiques/${bqTrouvee.slug}`
          );
          await envoyerMenuBoutique(phone, bqTrouvee);
          return;
        }
      } else if (/^(?:\+?221)?(?:7[05678]\d{7}|33\d{7}|\d{9})$/.test(text.replace(/[\s\.\-\(\)]/g, ''))) {
        // Numéro de téléphone tapé explicitement mais aucune boutique encore rattachée
        await sendWhatsAppText(
          phone,
          `🏪 *Aucune boutique Nopalou n'est actuellement associée au numéro +221 ${numDetecte.national}*.\n\n` +
          `👉 *Vous êtes le gérant de ce commerce ?*\n` +
          `Créez votre vitrine en 30 secondes chrono (avec *30 jours offerts*) en tapant *créer boutique* !`
        );
        await sendWhatsAppButton(
          phone,
          'Souhaitez-vous créer votre boutique en ligne maintenant ?',
          'creer_boutique',
          '🛍️ Créer ma boutique'
        ).catch(() => {});
        return;
      }
    }
  }

  // ── MISE À JOUR DE STATUT DE COMMANDE PAR LE MARCHAND (1-Clic) ─────────────
  const matchStatutCmd = interactiveId.match(/^cmd_statut_([a-f0-9\-]+)_(confirmee|en_livraison|livree|annulee)$/i);
  if (matchStatutCmd) {
    const [_, cmdId, targetStatut] = matchStatutCmd;
    const bqMarchand = context?.boutique || (await trouverBoutiqueMarchand(phone));
    if (bqMarchand) {
      try {
        const { rows } = await pool.query(
          `UPDATE commandes_boutique 
           SET statut = $1, updated_at = NOW() 
           WHERE id = $2 AND boutique_id = $3 
           RETURNING *`,
          [targetStatut, cmdId, bqMarchand.id]
        );
        if (rows.length > 0) {
          const cmd = rows[0];
          const STATUT_LABELS = {
            'confirmee': 'Confirmée',
            'en_livraison': 'En cours de livraison',
            'livree': 'Livrée avec succès',
            'annulee': 'Annulée',
          };
          const label = STATUT_LABELS[targetStatut] || targetStatut;
          await sendWhatsAppText(
            phone,
            `✅ Commande *${cmd.reference}* (${cmd.client_nom}) mise à jour : *${label}* !`
          );

          // Notification WhatsApp automatique au client si numéro disponible
          if (cmd.client_telephone) {
            const telClientNorm = normalisePhone(cmd.client_telephone);
            const msgClient =
              `🔔 *Mise à jour de votre commande chez ${bqMarchand.nom}*\n\n` +
              `Votre commande *${cmd.reference}* (${cmd.nom_produit}) est passée au statut : *${label}* !\n\n` +
              `Merci de votre confiance. Pour toute question, répondez directement à ce message.`;
            sendWhatsAppText(telClientNorm, msgClient).catch(() => {});
          }

          // Ré-afficher la fiche de cette commande avec les nouvelles options d'action
          await envoyerFicheActionCommande(phone, bqMarchand, cmd);
          await setSession(phone, 'MARCHAND_COMMANDE_DETAIL', {
            boutique: bqMarchand,
            isMarchandAuth: true,
            commande: cmd,
            commandes: context?.commandes,
            offset: context?.offset || 0,
          });
          return;
        }
      } catch (errUpCmd) {
        console.error('[UPDATE STATUT COMMANDE WA ERR]:', errUpCmd);
      }
    }
  }

  // ── SÉLECTION D'UNE COMMANDE PRÉCISE (Fiche détaillée + Actions 1-clic) ─────
  const matchSelCmd = interactiveId.match(/^cmd_sel_([a-f0-9\-]+)$/i);
  if (matchSelCmd) {
    const cmdId = matchSelCmd[1];
    const bqMarchand = context?.boutique || (await trouverBoutiqueMarchand(phone));
    if (bqMarchand) {
      try {
        const { rows } = await pool.query(
          `SELECT * FROM commandes_boutique WHERE id = $1 AND boutique_id = $2`,
          [cmdId, bqMarchand.id]
        );
        if (rows.length > 0) {
          await envoyerFicheActionCommande(phone, bqMarchand, rows[0]);
          await setSession(phone, 'MARCHAND_COMMANDE_DETAIL', {
            boutique: bqMarchand,
            isMarchandAuth: true,
            commande: rows[0],
            commandes: context?.commandes,
            offset: context?.offset || 0,
          });
          return;
        }
      } catch (errSelCmd) {
        console.error('[SELECT COMMANDE WA ERR]:', errSelCmd);
      }
    }
  }

  // ── PAGINATION DES COMMANDES (Suivantes / Précédentes) ──────────────────────
  const matchPageCmd = interactiveId.match(/^cmd_page_(\d+)$/i);
  if (matchPageCmd) {
    const targetOffset = parseInt(matchPageCmd[1], 10);
    const bqMarchand = context?.boutique || (await trouverBoutiqueMarchand(phone));
    if (bqMarchand) {
      await envoyerCommandesMarchand(phone, bqMarchand, targetOffset);
      return;
    }
  }

  // ── DÉCLENCHEURS COMMERÇANT & ESPACE MARCHAND SÉCURISÉ ───────────────────────
  const MOTS_MARCHAND = [
    'marchand', 'gestion', 'espace marchand', 'mon espace', 'gerer', 'gerer boutique',
    'ma boutique', 'caisse', 'ventes', 'bor', 'dette', 'dettes', 'mon stock', 'mes produits',
    'changer pin', 'code pin', 'pin', 'menu marchand', 'commandes', 'mes commandes', 'suivi commandes'
  ];
  const estDeclencheurMarchand =
    MOTS_MARCHAND.includes(normTxtLower) ||
    interactiveId === 'menu_marchand' ||
    interactiveId.startsWith('marchand_') ||
    state === 'MARCHAND_PIN' ||
    state === 'MARCHAND_MENU';

  if (estDeclencheurMarchand) {
    const bqMarchand = context?.boutique || (await trouverBoutiqueMarchand(phone));
    if (bqMarchand) {
      // Si l'utilisateur envoie son PIN pour déverrouiller
      if (state === 'MARCHAND_PIN' || /^\d{4,6}$/.test(text.trim())) {
        const pinValide = await verifierCodePin(bqMarchand, text.trim());
        if (pinValide) {
          await envoyerMenuMarchand(phone, bqMarchand);
          return;
        } else if (state === 'MARCHAND_PIN') {
          // Si demande de réinitialisation OTP
          if (normTxtLower === 'pin oublie' || normTxtLower === 'pin oublié' || normTxtLower === 'reinitialiser pin') {
            const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
            _otpCodesMarchand.set(phone, { code: otpCode, boutiqueId: bqMarchand.id, expiresAt: Date.now() + 10 * 60 * 1000 });
            await setSession(phone, 'MARCHAND_RESET_OTP', { boutique: bqMarchand, otpCode });
            await sendWhatsAppText(
              phone,
              `🔒 *Code de Sécurité Nopalou — Réinitialisation PIN*\n\n` +
              `Votre code de vérification temporaire est : *${otpCode}*\n\n` +
              `👉 Renvoyez simplement ce code *${otpCode}* pour autoriser la création de votre nouveau Code PIN.`
            );
            return;
          }
          await sendWhatsAppText(
            phone,
            `❌ *Code PIN incorrect*.\n\nVeuillez réessayer votre Code PIN (par défaut : 1234) ou tapez *pin oublié* pour le réinitialiser :`
          );
          return;
        }
      }

      // Si pas encore authentifié sur cette session
      if (!context?.isMarchandAuth && state !== 'MARCHAND_PIN') {
        await setSession(phone, 'MARCHAND_PIN', { boutique: bqMarchand });
        await sendWhatsAppText(
          phone,
          `👋 Bonjour *${bqMarchand.proprietaire_nom || bqMarchand.nom}* !\n\n` +
          `🔐 *Espace Marchand — ${bqMarchand.nom}*\n` +
          `Veuillez saisir votre **Code PIN** (par défaut : 1234) pour accéder à votre espace de gestion :`
        );
        return;
      }
    }
  }

  // Déclencheur Création de Boutique Taf-Taf
  if (
    interactiveId === 'creer_boutique' ||
    normTxtLower === 'creer boutique' ||
    normTxtLower === 'creer ma boutique' ||
    normTxtLower === 'ouvrir boutique' ||
    normTxtLower === 'vendre sur nopalou' ||
    normTxtLower === 'boutique taf taf'
  ) {
    await setSession(phone, 'CREER_BOUTIQUE_NOM', {});
    await sendWhatsAppText(
      phone,
      '🏪 *Création de votre Boutique en Ligne Nopalou*\n\n' +
      'Lancez votre commerce en 30 secondes chrono !\n' +
      '🎁 *30 jours offerts* & 0% de commission sur vos ventes.\n\n' +
      '👉 Quel est le *nom de votre boutique* ? (ex: Dakar Fashion, Touba Tech, Keur Fatou...)'
    );
    return;
  }

  // Déclencheur Ajout de Produit Sécurisé (+produit ou clic sur bouton interactif)
  if (
    normTxtLower === '+produit' ||
    normTxtLower === 'ajouter produit' ||
    normTxtLower === 'nouveau produit' ||
    normTxtLower === 'ajout produit' ||
    normTxtLower === 'creer produit' ||
    interactiveId === 'marchand_ajout_produit' ||
    interactiveId === 'ajouter_produit' ||
    interactiveId?.startsWith('boutique_ajout_prod_')
  ) {
    const normPh = normalisePhone(phone);
    const targetBqId = interactiveId?.startsWith('boutique_ajout_prod_')
      ? interactiveId.replace('boutique_ajout_prod_', '')
      : null;

    let rBq;
    const short9 = phone.replace(/\D/g, '').slice(-9);

    if (targetBqId) {
      rBq = await pool.query(
        `SELECT b.id, b.nom, b.slug
         FROM boutiques b
         LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
         WHERE b.id = $1
           AND (
             REGEXP_REPLACE(COALESCE(b.telephone, ''), '\\D', '', 'g') LIKE '%' || $2
             OR REGEXP_REPLACE(COALESCE(b.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $2
             OR REGEXP_REPLACE(COALESCE(u.telephone, ''), '\\D', '', 'g') LIKE '%' || $2
           )
           AND (b.actif IS NULL OR b.actif = true)
         LIMIT 1`,
        [targetBqId, short9]
      );
    }

    if (!rBq || !rBq.rows.length) {
      rBq = await pool.query(
        `SELECT b.id, b.nom, b.slug
         FROM boutiques b
         LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
         WHERE (
           REGEXP_REPLACE(COALESCE(b.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
           OR REGEXP_REPLACE(COALESCE(b.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $1
           OR REGEXP_REPLACE(COALESCE(u.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
         )
           AND (b.actif IS NULL OR b.actif = true)
         ORDER BY b.created_at DESC LIMIT 1`,
        [short9]
      );
    }

    if (!rBq.rows.length) {
      await sendWhatsAppText(
        phone,
        '⚠️ *Accès Refusé / Boutique introuvable*\n\n' +
        `Aucune boutique active n'est associée à votre numéro (${phone}).\n\n` +
        '👉 Pour créer votre boutique gratuitement dès maintenant, tapez *créer boutique* !'
      );
      return;
    }

    const maBoutique = rBq.rows[0];
    await setSession(phone, 'AJOUT_PRODUIT_NOM', { boutique: maBoutique });
    await sendWhatsAppText(
      phone,
      `🛍️ *Ajout de Produit — ${maBoutique.nom}*\n\n` +
      'Quel est le *nom ou titre du produit* que vous souhaitez ajouter ? (ex: Robe Soirée Soie, iPhone 14 Pro 128Go, Sandales Cuir...)'
    );
    return;
  }

  // ── DÉCLENCHEUR AJOUT EXPRESS (Photo avec nom, prix et stock dans la légende) ─
  if (msg.type === 'image' && msg.image?.caption && state !== 'AJOUT_PRODUIT_PHOTO') {
    const caption = msg.image.caption.trim();
    const infosProd = extraireInfosProduitTexte(caption);

    if (infosProd) {
      const { nom: prodNom, prix: prixNum, stock: stockNum } = infosProd;
      const normPh = normalisePhone(phone);
      const short9 = phone.replace(/\D/g, '').slice(-9);
      const rBq = await pool.query(
        `SELECT b.id, b.nom, b.slug
         FROM boutiques b
         LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
         WHERE (
           REGEXP_REPLACE(COALESCE(b.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
           OR REGEXP_REPLACE(COALESCE(b.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $1
           OR REGEXP_REPLACE(COALESCE(u.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
         )
           AND (b.actif IS NULL OR b.actif = true)
         ORDER BY b.created_at DESC LIMIT 1`,
        [short9]
      );

      if (rBq.rows.length > 0) {
        const maBoutique = rBq.rows[0];
        let imageUrl = null;
        if (msg.image?.id) {
          imageUrl = await telechargerMediaWhatsApp(msg.image.id);
        }
        const imagesArray = imageUrl ? [imageUrl] : [];

        const resProd = await pool.query(
          `INSERT INTO boutique_produits (boutique_id, nom, prix, stock_quantite, images, en_stock)
           VALUES ($1, $2, $3, $4, $5, true)
           RETURNING id, nom, prix, stock_quantite`,
          [maBoutique.id, prodNom, prixNum, stockNum, imagesArray]
        );

        const prodCree = resProd.rows[0];

        // Enregistrer dans le tampon pour recevoir d'éventuelles photos supplémentaires du lot
        _recentsProduitsCrees.set(normPh, {
          produitId: prodCree.id,
          boutiqueId: maBoutique.id,
          nom: prodCree.nom,
          totalPhotos: imageUrl ? 1 : 0,
          timestamp: Date.now(),
        });

        // Synchronisation asynchrone avec le catalogue Meta / WhatsApp si configuré
        try {
          const { syncProduit } = require('./whatsapp-catalog');
          syncProduit(prodCree.id).catch(() => {});
        } catch (_) {}

        const stockLabel = (prodCree.stock_quantite !== null && prodCree.stock_quantite !== undefined)
          ? `*${prodCree.stock_quantite} unité(s)*`
          : '*Illimité*';

        await sendWhatsAppText(
          phone,
          `⚡ *Ajout Express Réussi en 1 Clic !* ⚡\n\n` +
          `🛍️ Article : *${prodCree.nom}*\n` +
          `💰 Prix : *${prixFmt(prodCree.prix)}*\n` +
          `📦 Stock : ${stockLabel}\n` +
          `📸 Photo : *${imageUrl ? 'Photo enregistrée avec succès' : 'Sans photo'}*\n` +
          `🏪 Boutique : *${maBoutique.nom}*\n\n` +
          `🔗 *Fiche produit en ligne :*\n${SITE}/boutiques/${maBoutique.slug}\n\n` +
          `👉 *Astuce multi-photos :* Vous pouvez envoyer d'autres photos directement pour cet article !`
        );
        await setSession(phone, 'IDLE', {});
        return;
      }
    }
  }

  // ── PHOTO SEULE SANS LÉGENDE REÇUE PAR UN MARCHAND (Assistance création rapide) ─
  if (msg.type === 'image' && !msg.image?.caption && (state === 'IDLE' || state === 'MARCHAND_MENU')) {
    const short9 = phone.replace(/\D/g, '').slice(-9);
    const rBq = await pool.query(
      `SELECT b.id, b.nom, b.slug
       FROM boutiques b
       LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
       WHERE (
         REGEXP_REPLACE(COALESCE(b.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
         OR REGEXP_REPLACE(COALESCE(b.whatsapp, ''), '\\D', '', 'g') LIKE '%' || $1
         OR REGEXP_REPLACE(COALESCE(u.telephone, ''), '\\D', '', 'g') LIKE '%' || $1
       )
         AND (b.actif IS NULL OR b.actif = true)
       ORDER BY b.created_at DESC LIMIT 1`,
      [short9]
    );

    if (rBq.rows.length > 0) {
      const maBoutique = rBq.rows[0];
      let imageUrl = null;
      if (msg.image?.id) {
        imageUrl = await telechargerMediaWhatsApp(msg.image.id);
      }
      const initialPhotos = imageUrl ? [imageUrl] : [];
      await setSession(phone, 'AJOUT_PRODUIT_NOM', { boutique: maBoutique, photos: initialPhotos });
      await sendWhatsAppText(
        phone,
        `📸 *Photo bien reçue pour « ${maBoutique.nom} » !*\n\n` +
        `Quel est le *nom, prix et stock* de cet article ?\n` +
        `👉 *(ex: Sac cuir 5000 10 ou Robe Soirée 15000)*`
      );
      return;
    }
  }

  // ── 3. LIEN DIRECT BOUTIQUE : "boutique_{slug}" (texte ou bouton) ─────────────
  const estIdInterne = /^boutique_(recherche|categorie|contact|quitter|choisie_|produits_tous|next|secteur_liste|recherche_nom|ajout_prod|ajouter_produit|creer_boutique|partager)/.test(text) ||
    /^boutique_(recherche|categorie|contact|quitter|choisie_|produits_tous|next|secteur_liste|recherche_nom|ajout_prod|ajouter_produit|creer_boutique|partager)/.test(interactiveId);
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

  const SALUTATIONS = [
    'menu', 'aide', 'help', '0', 'bonjour', 'bonsoir', 'salut', 'slt', 'hello', 'coucou',
    'nanga def', 'nanga def?', 'naka mou mel', 'salaam', 'salam', 'jaam rek', 'kassoumey', 'nannga def'
  ];
  const CLOTURE = [
    'merci', 'merci beaucoup', 'ok merci', 'c\'est bon', 'cest bon', 'au revoir', 'bye',
    'a bientot', 'à bientôt', 'non merci', 'ça ira', 'ca ira', 'c\'est tout', 'cest tout',
    'jerejef', 'dieuredieuf', 'jërëjëf', 'sant yallah'
  ];
  const MOTS_PLUS = [
    'plus', 'encore', 'd\'autres', 'dautres', 'autres', 'autre', 'voir plus', 'la suite',
    'suivant', 'suivante', 'next', 'suite', 'ok', 'oui', 'waaw', 'waw', 'yeneen', 'yenen'
  ];

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

  // ── Actions directes de sélection de menu (Menu Marchand / Menu Boutique / Menu Général) ─
  if (interactiveId === 'menu_marchand' || normTxtLower === 'menu marchand') {
    const bq = context?.boutique || (await trouverBoutiqueMarchand(phone));
    if (bq) {
      await envoyerMenuMarchand(phone, bq);
      return;
    }
  }

  if (interactiveId === 'menu_boutique_retour' || normTxtLower === 'menu boutique') {
    if (context?.boutique) {
      await envoyerMenuBoutique(phone, context.boutique);
      return;
    }
  }

  if (interactiveId === 'menu_general' || normTxtLower === 'menu general' || normTxtLower === 'menu général' || normTxtLower === 'menu principal') {
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // ── Demande de "Menu" quand l'utilisateur est déjà dans une boutique ────────
  const isMenuReq = interactiveId === 'menu' || text.toLowerCase() === 'menu' || text.trim() === '0';
  if (isMenuReq && context?.boutique) {
    const bq = context.boutique;
    const isMarchand = context?.isMarchandAuth;

    if (isMarchand) {
      // Pour le commerçant authentifié : choix entre son Espace Marchand et le Menu Général
      const buttons = [
        { id: 'menu_marchand', title: '🏪 Menu Marchand' },
        { id: 'menu_general', title: '🌐 Menu Principal' },
      ];
      await sendWhatsAppButtons3(
        phone,
        `📍 Vous êtes actuellement dans l'espace de gestion de votre boutique *${bq.nom}*.\n\nQuel menu souhaitez-vous afficher ?`,
        buttons
      ).catch(() => {});
      return;
    } else {
      // Pour le client/acheteur : choix entre le Menu de cette boutique et le Menu Général
      const buttons = [
        { id: 'menu_boutique_retour', title: `🏪 ${bq.nom.slice(0, 16)}` },
        { id: 'menu_general', title: '🌐 Menu Principal' },
      ];
      await sendWhatsAppButtons3(
        phone,
        `📍 Vous êtes actuellement dans la boutique *${bq.nom}*.\n\nQuel menu souhaitez-vous afficher ?`,
        buttons
      ).catch(() => {});
      return;
    }
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
      const labelDecouverte = (await cfg.get('plan_decouverte_label')) || 'Boutique Taf Taf';
      const labelPro = (await cfg.get('plan_pro_label')) || 'Boutique Pro';
      const labelBusiness = (await cfg.get('plan_business_label')) || 'Boutique Business';
      const essaiJours = (await cfg.getNum('abonnement_essai_jours')) || 30;

      const msgText = `💎 *Forfaits & Abonnements Boutiques Nopalou*\n\n` +
        `🎁 *Offre Spéciale : ${essaiJours} jours (${Math.round(essaiJours / 30)} mois) 100% OFFERTS sur TOUS nos forfaits !*\n\n` +
        `🌱 *${labelDecouverte} (${prixFmt(pxDecouverte)}/mois)*\n` +
        `• Catalogue produits illimité\n` +
        `• Encaissement direct Wave & Orange Money\n` +
        `• 0% de commission sur vos ventes\n\n` +
        `🚀 *${labelPro} (${prixFmt(pxPro)}/mois)*\n` +
        `• Tout le contenu du plan ${labelDecouverte} +\n` +
        `• Badge Vendeur Pro Certifié ⭐\n` +
        `• Référencement prioritaire sur le comparateur\n` +
        `• Support client prioritaire 7j/7\n\n` +
        `👑 *${labelBusiness} (${prixFmt(pxBusiness)}/mois)*\n` +
        `• Tout le contenu du plan ${labelPro} +\n` +
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
    if (action === 'supp_rappel' || normTxtLower === 'demander un rappel' || normTxtLower === 'rappel' || normTxtLower === 'rappelez moi') {
      await enregistrerDemandeSupport(phone, {
        nom: context?.nom || null,
        message: 'Demande de rappel téléphonique depuis le chatbot WhatsApp',
        contexte: { dernier_etat: state, context_prec: context }
      });
      await sendWhatsAppText(
        phone,
        `✅ *Demande de rappel enregistrée avec succès !* 🎉\n\nUn conseiller Nopalou a bien reçu votre demande et vous recontactera très prochainement au **+${phone}**.\n\nPour toute question urgente, vous pouvez également nous écrire directement à ✉️ contact@nopalou.com.`
      );
      await sendWhatsAppMenuOuFin(phone, 'Puis-je vous aider pour autre chose ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    if (action === 'supp_email' || normTxtLower === 'contact email') {
      await sendWhatsAppText(
        phone,
        `📧 *Contact Email Nopalou*\n\nVous pouvez écrire à notre équipe à l'adresse suivante :\n👉 *contact@nopalou.com*\n\nNous traitons l'ensemble des demandes sous 24h ouvrées.`
      );
      await sendWhatsAppMenuOuFin(phone, 'Puis-je vous aider pour autre chose ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    if (action === 'guide') {
      const faqGuide = detecterFAQ('comment ca marche') || detecterFAQ('comment utiliser');
      await sendWhatsAppText(phone, faqGuide ? faqGuide.reponse : `📖 *Comment utiliser Nopalou*\n\n🔍 Comparez les prix produits\n🏠 Trouvez un logement\n📶 Comparez les forfaits télécom\n❤️ Sauvegardez vos favoris\n🔔 Créez des alertes de prix\n📢 Publiez une annonce\n\nGuide complet : ${SITE}/guide-utilisation`);
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
    // 1. Si l'utilisateur envoie un numéro (ex: "1", "01", "2") alors qu'une liste de boutiques était en cours
    if (text && /^\s*(?:boutique\s+|n°\s*|#\s*|0*)?\d+\.?\s*$/i.test(text)) {
      const cleanNumStr = text.trim().replace(/^(?:boutique\s+|n°\s*|#\s*|0+)/i, '').replace(/\.$/, '').trim() || text.trim();
      const num = parseInt(cleanNumStr, 10);
      let boutiques = Array.isArray(context?.boutiquesAffichees) ? context.boutiquesAffichees : [];
      if (boutiques.length === 0 && !isNaN(num) && num >= 1 && num <= 10 && context?.last?.type === 'boutiques_toutes') {
        const rRecent = await pool.query(
          'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE actif=true ORDER BY created_at DESC LIMIT 10'
        );
        boutiques = rRecent.rows;
      }
      if (!isNaN(num) && num >= 1 && num <= boutiques.length) {
        const b = boutiques[num - 1];
        const r = await pool.query(
          'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE id=$1 AND actif=true',
          [b.id]
        );
        if (r.rows[0]) {
          await envoyerMenuBoutique(phone, r.rows[0]);
          return;
        }
      }
    }

    // 2. Raccourcis numériques 1 à 9 pour le menu principal
    const cleanMenuNum = parseInt(text.trim().replace(/^0+/, ''), 10);
    if (!isNaN(cleanMenuNum) && cleanMenuNum >= 1 && cleanMenuNum <= 9 && !context?.boutiquesAffichees?.length) {
      if (cleanMenuNum === 1) {
        await setSession(phone, 'SEARCH_QUERY', {});
        await sendWhatsAppText(phone, '🔍 Que recherchez-vous ? (ex: télévision Samsung, canapé, forfait Tigo...)');
        return;
      }
      if (cleanMenuNum === 2) {
        await envoyerToutesLesBoutiques(phone);
        return;
      }
      if (cleanMenuNum === 3) {
        await envoyerListeImmo(phone);
        return;
      }
      if (cleanMenuNum === 4) {
        await envoyerListeTelecom(phone);
        return;
      }
      if (cleanMenuNum === 5) {
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
      if (cleanMenuNum === 6) {
        const pxDecouverte = (await cfg.getNum('plan_decouverte_prix')) || 2500;
        const pxPro = (await cfg.getNum('plan_pro_prix')) || 5000;
        const pxBusiness = (await cfg.getNum('plan_business_prix')) || 10000;
        const labelDecouverte = (await cfg.get('plan_decouverte_label')) || 'Boutique Taf Taf';
        const labelPro = (await cfg.get('plan_pro_label')) || 'Boutique Pro';
        const labelBusiness = (await cfg.get('plan_business_label')) || 'Boutique Business';
        const essaiJours = (await cfg.getNum('abonnement_essai_jours')) || 30;

        const msgText = `💎 *Forfaits & Abonnements Boutiques Nopalou*\n\n` +
          `🎁 *Offre Spéciale : ${essaiJours} jours (${Math.round(essaiJours / 30)} mois) 100% OFFERTS sur TOUS nos forfaits !*\n\n` +
          `🌱 *${labelDecouverte} (${prixFmt(pxDecouverte)}/mois)*\n` +
          `• Catalogue produits illimité\n` +
          `• Encaissement direct Wave & Orange Money\n` +
          `• 0% de commission sur vos ventes\n\n` +
          `🚀 *${labelPro} (${prixFmt(pxPro)}/mois)*\n` +
          `• Tout le contenu du plan ${labelDecouverte} +\n` +
          `• Badge Vendeur Pro Certifié ⭐\n` +
          `• Référencement prioritaire sur le comparateur\n` +
          `• Support client prioritaire 7j/7\n\n` +
          `👑 *${labelBusiness} (${prixFmt(pxBusiness)}/mois)*\n` +
          `• Tout le contenu du plan ${labelPro} +\n` +
          `• Sponsoring & Bannière Page d'Accueil\n` +
          `• Multi-Magasins & Caisse Caissiers POS\n\n` +
          `👉 *Découvrir les détails et s'abonner :*\n${SITE}/tarifs-boutique`;
        await sendWhatsAppText(phone, msgText);
        await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
        await setSession(phone, 'MENU', {});
        return;
      }
      if (cleanMenuNum === 7) {
        await setSession(phone, 'ORDER_REF', {});
        await sendWhatsAppText(phone, '📦 Entrez votre référence de commande (ex: CMD-12345) :');
        return;
      }
      if (cleanMenuNum === 8) {
        await setSession(phone, 'ALERT_PRODUCT', { phone });
        await sendWhatsAppText(phone, '🔔 Quel produit voulez-vous surveiller ? (ex: iPhone 15, Samsung TV 55")');
        return;
      }
      if (cleanMenuNum === 9) {
        await sendWhatsAppText(phone, '💬 *Support Nopalou*\n\nPour nous contacter :\n📧 contact@nopalou.com\n🌐 nopalou.com\n\nNous répondons sous 24h. Merci !');
        await sendWhatsAppMenuOuFin(phone, 'Une autre question ?').catch(() => {});
        await setSession(phone, 'MENU', {});
        return;
      }
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

  // ── BOUTIQUE_LISTE → choix d'une boutique, recherche par nom, secteur ou pagination ─
  if (state === 'BOUTIQUE_LISTE') {
    if (interactiveId === 'boutique_recherche_nom' || normText === 'chercher par nom' || normText === 'recherche' || normText === 'rechercher' || normText === 'chercher' || normText === 'chercher boutique' || normText === 'rechercher boutique') {
      await setSession(phone, 'BOUTIQUE_SEARCH_SHOP', {});
      await sendWhatsAppText(phone, '🔍 *Recherche de boutique*\n\nQuel est le nom ou mot-clé de la boutique que vous cherchez ? (ex: Dakar Mode, Touba Phone, Épicerie...)');
      return;
    }

    if (interactiveId === 'boutique_secteur_liste' || normText === 'secteur' || normText === 'secteurs' || normText === 'categorie' || normText === 'categories') {
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
      ]).catch(() => {});
      await setSession(phone, 'BOUTIQUE_SECTEUR', {});
      return;
    }

    if (MOTS_PLUS.includes(normaliserTexte(text))) {
      const shownIds = Array.isArray(context?.last?.shownIds) ? context.last.shownIds : [];
      if (context?.last?.type === 'boutiques_toutes') {
        await envoyerToutesLesBoutiques(phone, shownIds);
      } else if (context?.last?.type === 'boutique_search_shop') {
        await rechercherBoutiquesParNom(phone, context?.last?.query, shownIds);
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
      const cleanNumStr = text.trim().replace(/^(?:boutique\s+|n°\s*|#\s*|0+)/i, '').replace(/\.$/, '').trim() || text.trim();
      const num = parseInt(cleanNumStr, 10);
      let boutiques = Array.isArray(context?.boutiquesAffichees) ? context.boutiquesAffichees : [];
      if (boutiques.length === 0 && !isNaN(num) && num >= 1 && num <= 10) {
        const rRecent = await pool.query(
          'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE actif=true ORDER BY created_at DESC LIMIT 10'
        );
        boutiques = rRecent.rows;
      }

      if (!isNaN(num) && num >= 1 && num <= boutiques.length) {
        targetBoutiqueId = boutiques[num - 1].id;
      } else {
        const bqTel = await trouverBoutiqueParTelephone(text.trim());
        if (bqTel) {
          await sendWhatsAppText(phone, `🏪 J'ai trouvé la boutique *${bqTel.nom}* (${bqTel.categorie || 'Commerce'}${bqTel.ville ? ` — ${bqTel.ville}` : ''}) !`);
          await envoyerMenuBoutique(phone, bqTel);
          return;
        }
        // Recherche automatique par nom tapé
        await rechercherBoutiquesParNom(phone, text.trim());
        return;
      }
    }

    if (!targetBoutiqueId) {
      await sendWhatsAppText(phone, 'Choisissez une boutique dans la liste ci-dessus, tapez son numéro (1, 2...), son nom, ou tapez *menu*.');
      return;
    }

    const r = await pool.query(
      'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE id=$1 AND (actif IS NULL OR actif=true)',
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

  // ── BOUTIQUE_SEARCH_SHOP → recherche textuelle de boutique par nom ou téléphone ─
  if (state === 'BOUTIQUE_SEARCH_SHOP') {
    if (!text || text.trim().length < 2) {
      await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 lettres ou le numéro de téléphone de la boutique (ou tapez *menu*).');
      return;
    }
    const bqTel = await trouverBoutiqueParTelephone(text.trim());
    if (bqTel) {
      await sendWhatsAppText(phone, `🏪 J'ai trouvé la boutique *${bqTel.nom}* (${bqTel.categorie || 'Commerce'}${bqTel.ville ? ` — ${bqTel.ville}` : ''}) !`);
      await envoyerMenuBoutique(phone, bqTel);
      return;
    }
    await rechercherBoutiquesParNom(phone, text.trim());
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

    const cleanMenuNum = parseInt(text.trim().replace(/^0+/, ''), 10);

    if (interactiveId === 'boutique_produits_tous' || cleanMenuNum === 1 || normText === 'voir les produits' || normText === 'produits' || normText === 'catalogue') {
      await envoyerProduitsBoutique(phone, boutique, {});
      return;
    }
    if (interactiveId === 'boutique_recherche' || cleanMenuNum === 2 || normText === 'rechercher' || normText === 'chercher') {
      await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
      await sendWhatsAppText(phone, `🔍 Que recherchez-vous chez *${boutique.nom}* ?`);
      return;
    }
    if (interactiveId === 'boutique_categorie' || cleanMenuNum === 3 || normText === 'categories' || normText === 'categorie') {
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
      await sendWhatsAppInteractive(phone, boutique.nom, 'Choisissez une catégorie :', [{ title: 'Catégories', rows }]).catch(() => {});
      await setSession(phone, 'BOUTIQUE_CATEGORIE', { boutique });
      return;
    }
    if (interactiveId === 'boutique_contact' || cleanMenuNum === 4 || normText === 'contact' || normText === 'vendeur' || normText === 'appeler' || normText === 'whatsapp') {
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
    if (interactiveId === 'boutique_quitter' || cleanMenuNum === 5 || normText === 'quitter' || normText === 'changer de boutique') {
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
    if (text && text.trim().length >= 2) {
      await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
      await envoyerProduitsBoutique(phone, boutique, { query: text.trim() });
      return;
    }
    await sendWhatsAppText(phone, `Tapez un numéro (1-5) ou le nom d'un produit que vous cherchez chez *${boutique.nom}*.`);
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

    // Protection anti-rupture : Si l'utilisateur pose une question ou demande le vendeur au lieu de donner son nom
    if (detecterIntentionInterrogative(text)) {
      const itm = context?.commande?.items?.[0];
      const nomP = itm?.nom_produit || 'cet article';
      const contactV = boutique.whatsapp || boutique.telephone;
      await sendWhatsAppText(
        phone,
        `💡 *Vous êtes en train de passer une commande pour : ${nomP}*\n\n` +
        `Pour finaliser votre achat par chat, merci d'indiquer votre **Nom et Adresse** (ex: *Amar, Sacré-Cœur 3*).\n\n` +
        `👉 Pour poser directement votre question au vendeur ou annuler :`
      );
      const btns = [{ id: 'cmd_annuler', title: '✏️ Annuler commande' }];
      if (contactV) {
        btns.unshift({ id: `contact_vendeur_${itm?.produit_id || ''}`, title: '💬 Vendeur' });
      }
      btns.push({ id: 'menu', title: '🌐 Menu' });
      await sendWhatsAppButtons3(phone, 'Que souhaitez-vous faire ?', btns.slice(0, 3)).catch(() => {});
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

    if (detecterIntentionInterrogative(text)) {
      await sendWhatsAppText(
        phone,
        `💡 Merci d'indiquer votre **quartier ou adresse de livraison** (ex: *Maristes, Dakar*).\n\n` +
        `Tapez *annuler* si vous souhaitez revenir au menu.`
      );
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
    const PAIEMENTS = { pay_wave: 'wave', pay_om: 'orange_money', pay_cash: 'cash', pay_virement: 'virement', pay_credit: 'credit' };
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
      let msgFinal = creees[0]?.methode_paiement === 'credit'
        ? `✅ *Demande d'Achat à Crédit ${refs} transmise !*\n\nVotre demande d'achat à crédit a été envoyée à la boutique *${boutique.nom}*. Le commerçant la validera dans son Carnet client !`
        : `✅ *Commande ${refs} envoyée !*\n\nLe vendeur *${boutique.nom}* va vous contacter pour finaliser le paiement et la livraison.`;
      if (creees[0]?.methode_paiement === 'wave' || creees[0]?.methode_paiement === 'pay_wave') {
        let wavePayUrl = `${SITE}/checkout-express?produit=${creees[0]?.produit_id || ''}&boutique=${boutique.id}&phone=${phone}&pay=wave&auto=1`;
        let hasWaveSession = false;
        try {
          const wave = require('./wave');
          const totalMontant = creees.reduce((sum, c) => sum + Number(c.montant_total || 0), 0);
          if (totalMontant > 0 && process.env.WAVE_API_KEY && !process.env.WAVE_API_KEY.includes('xxxxxxxx')) {
            const waveSession = await wave.createCheckoutSession({
              amount: Math.round(totalMontant),
              currency: 'XOF',
              success_url: `${SITE}/paiement/succes?ref=${refs}&type=commande-boutique`,
              error_url: `${SITE}/paiement/erreur?ref=${refs}&type=commande-express`,
              client_reference: refs,
            });
            if (waveSession?.wave_url) {
              wavePayUrl = waveSession.wave_url;
              hasWaveSession = true;
            }
          }
        } catch (wErr) {
          console.error('[WHATSAPP CHATBOT WAVE SESSION ERR]:', wErr.message);
        }
        if (hasWaveSession) {
          msgFinal += `\n\n🌊 *Réglez directement votre commande par Wave en 1 Clic :*\n👉 ${wavePayUrl}`;
        } else {
          const numWaveManuel = (await cfg.get('paiement_manuel_numero_wave')) || '77 720 20 86';
          const numOmManuel = (await cfg.get('paiement_manuel_numero_om')) || numWaveManuel;
          const totalMontantFmt = new Intl.NumberFormat('fr-FR').format(creees.reduce((sum, c) => sum + Number(c.montant_total || 0), 0));
          const numAffichage = numWaveManuel === numOmManuel ? numWaveManuel : `${numWaveManuel} (Wave) / ${numOmManuel} (Orange Money)`;
          msgFinal += `\n\n💡 *Paiement par Dépôt Manuel :*\nVous pouvez effectuer votre transfert de *${totalMontantFmt} FCFA* au *${numAffichage}* puis nous envoyer la capture de votre reçu.`;
        }
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

    // Si c'est un numéro et qu'on a des boutiques dans le contexte
    if (text && /^\s*(?:boutique\s+|n°\s*|#\s*|0*)?\d+\.?\s*$/i.test(text) && context?.boutiquesAffichees?.length) {
      const cleanNumStr = text.trim().replace(/^(?:boutique\s+|n°\s*|#\s*|0+)/i, '').replace(/\.$/, '').trim() || text.trim();
      const num = parseInt(cleanNumStr, 10);
      if (!isNaN(num) && num >= 1 && num <= context.boutiquesAffichees.length) {
        const b = context.boutiquesAffichees[num - 1];
        const r = await pool.query(
          'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE id=$1 AND actif=true',
          [b.id]
        );
        if (r.rows[0]) {
          await envoyerMenuBoutique(phone, r.rows[0]);
          return;
        }
      }
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

  // ── CREER_BOUTIQUE_NOM → Nom de la boutique ────────────────────────────────
  if (state === 'CREER_BOUTIQUE_NOM') {
    if (!text || text.trim().length < 2) {
      await sendWhatsAppText(phone, '⚠️ Veuillez entrer un nom valide pour votre boutique (au moins 2 caractères).');
      return;
    }
    const nomBoutique = text.trim();
    await setSession(phone, 'CREER_BOUTIQUE_QUARTIER', { nom_boutique: nomBoutique });
    await sendWhatsAppText(
      phone,
      `📍 Parfait pour *${nomBoutique}* !\n\nDans quel *quartier ou ville* se trouve votre commerce ? (ex: Sandaga, HLM, Maristes, Plateau, Thiès, Mbour, Touba...)`
    );
    return;
  }

  // ── CREER_BOUTIQUE_QUARTIER → Quartier / Ville ──────────────────────────────
  if (state === 'CREER_BOUTIQUE_QUARTIER') {
    const quartier = (text || 'Dakar').trim();
    const nomBoutique = context?.nom_boutique || 'Ma Boutique';
    await setSession(phone, 'CREER_BOUTIQUE_CATEGORIE', { nom_boutique: nomBoutique, quartier });

    await sendWhatsAppInteractive(
      phone,
      nomBoutique,
      '🏷️ Choisissez votre catégorie principale (1 clic) :',
      [
        {
          title: 'Catégories Populaires',
          rows: [
            { id: 'cat_mode', title: '1️⃣ Mode & Vêtements', description: 'Prêt-à-porter, tissus, chaussures, sacs' },
            { id: 'cat_telephonie', title: '2️⃣ Téléphonie & Tech', description: 'Smartphones, TV, ordinateurs' },
            { id: 'cat_alimentation', title: '3️⃣ Alimentation & Supérette', description: 'Épicerie, boissons, bio' },
            { id: 'cat_quincaillerie', title: '4️⃣ Quincaillerie & Matériaux', description: 'Outillage, bâtiment, peinture' },
            { id: 'cat_beaute', title: '5️⃣ Cosmétique & Beauté', description: 'Parfums, mèches, soins, maquillage' },
            { id: 'cat_mixte', title: '6️⃣ Généraliste / Arrivages', description: 'Import-export, bazar, divers' },
          ],
        },
      ]
    );
    return;
  }

  // ── CREER_BOUTIQUE_CATEGORIE → Finalisation Création Boutique ────────────────
  if (state === 'CREER_BOUTIQUE_CATEGORIE') {
    const CATS_ID = {
      'cat_mode': 'mode',
      'cat_telephonie': 'telephonie',
      'cat_alimentation': 'alimentation',
      'cat_quincaillerie': 'quincaillerie',
      'cat_beaute': 'beaute-sante',
      'cat_mixte': 'mixte',
    };
    const num = parseInt(text.trim(), 10);
    const CATS_NUM = {
      1: 'mode',
      2: 'telephonie',
      3: 'alimentation',
      4: 'quincaillerie',
      5: 'beaute-sante',
      6: 'mixte',
    };
    const categorieSlug = CATS_ID[interactiveId] || CATS_NUM[num] || normaliserTexte(text).trim().slice(0, 50) || 'mode';
    const nomBoutique = context?.nom_boutique || 'Ma Boutique';
    const quartier = context?.quartier || 'Dakar';
    const normPh = normalisePhone(phone);

    try {
      // 1. Trouver ou créer l'utilisateur marchand
      let userId;
      const userRes = await pool.query(
        'SELECT id FROM utilisateurs WHERE telephone = $1 OR telephone = $2 LIMIT 1',
        [normPh, phone.replace(/\D/g, '').slice(-9)]
      );

      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        const emailTemp = `marchand_${normPh.replace(/\D/g, '')}_${Date.now().toString(36)}@nopalou.com`;
        const newUser = await pool.query(
          `INSERT INTO utilisateurs (nom, email, telephone, email_verifie, mot_de_passe_hash)
           VALUES ($1, $2, $3, true, 'wa_autocreated')
           RETURNING id`,
          [nomBoutique, emailTemp, normPh]
        );
        userId = newUser.rows[0].id;
      }

      // 2. Générer le slug unique
      let baseSlug = normaliserTexte(nomBoutique).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'boutique';
      let slug = baseSlug;
      let suffix = 1;
      while (true) {
        const existSlug = await pool.query('SELECT id FROM boutiques WHERE slug = $1', [slug]);
        if (!existSlug.rows.length) break;
        slug = `${baseSlug}-${suffix++}`;
      }

      // 3. Créer la boutique
      const resBq = await pool.query(
        `INSERT INTO boutiques (
          utilisateur_id, nom, slug, telephone, whatsapp, categorie, adresse, ville, couleur_theme, actif
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Dakar', '#16A34A', true)
        RETURNING id, nom, slug`,
        [userId, nomBoutique, slug, normPh, normPh, categorieSlug, quartier]
      );

      const bqCreee = resBq.rows[0];

      // Lier dans boutique_utilisateurs
      try {
        await pool.query(
          `INSERT INTO boutique_utilisateurs (boutique_id, utilisateur_id, role)
           VALUES ($1, $2, 'admin')
           ON CONFLICT (boutique_id, utilisateur_id) DO NOTHING`,
          [bqCreee.id, userId]
        );
      } catch (eBu) {
        console.warn('[BOUTIQUE UTILISATEURS WA WARN]:', eBu.message);
      }

      // 4. Créer l'abonnement d'essai de 30 jours offerts
      const finEssai = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      try {
        await pool.query(
          `UPDATE abonnements SET statut='annule' WHERE utilisateur_id=$1 AND statut='actif'`,
          [userId]
        );
        await pool.query(
          `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
           VALUES ($1, 'decouverte', 'actif', 2500, $2, $3)`,
          [userId, finEssai, `wa_trial_${normPh}_${Date.now().toString(36)}`]
        );
      } catch (eAbon) {
        console.warn('[ABONNEMENT ESSAI WA WARN]:', eAbon.message);
      }

      // 5. Message de confirmation enthousiaste & Boutons 1-Clic
      const msgSucces =
        `🎉 *FÉLICITATIONS ! VOTRE BOUTIQUE EST CRÉÉE !* 🎉\n\n` +
        `🏪 *${bqCreee.nom}*\n` +
        `📍 ${quartier} — 0% de commission\n` +
        `🎁 *1er mois (30 jours) 100% OFFERT*\n\n` +
        `🌐 *Lien de votre vitrine web :*\n${SITE}/boutiques/${bqCreee.slug}\n\n` +
        `📜 *Charte Vendeur & CGU :*\n${SITE}/cgu`;

      await sendWhatsAppText(phone, msgSucces);

      await sendWhatsAppInteractive(
        phone,
        bqCreee.nom,
        '🚀 Que souhaitez-vous faire ?',
        [
          {
            title: 'Action Immédiate',
            rows: [
              { id: `boutique_ajout_prod_${bqCreee.id}`, title: '➕ Ajouter un produit', description: 'Publier votre premier article (1-clic)' },
              { id: 'boutique_produits_tous', title: '🛍️ Voir le catalogue', description: 'Consulter votre vitrine' },
            ],
          },
        ]
      );

      await setSession(phone, 'IDLE', {});
      return;
    } catch (errCreate) {
      console.error('[CREER BOUTIQUE WA ERR]:', errCreate);
      await sendWhatsAppText(phone, '😕 Une erreur est survenue lors de la création. Réessayez en tapant *créer boutique* ou contactez le support.');
      await setSession(phone, 'IDLE', {});
      return;
    }
  }

  // ── MARCHAND_COMMANDES_LISTE & DETAIL → Navigation & Gestion des Commandes ───
  if (state === 'MARCHAND_COMMANDES_LISTE' || state === 'MARCHAND_COMMANDE_DETAIL') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'IDLE', {});
      await sendMenu(phone);
      return;
    }

    const txtClean = (text || '').trim();
    const numSaisi = parseInt(txtClean, 10);
    const offset = context?.offset || 0;
    const commandesAffichees = Array.isArray(context?.commandes) ? context.commandes : [];

    // 1. Si l'utilisateur tape un numéro (ex: 1, 2, 3, 4, 5...)
    if (!isNaN(numSaisi) && numSaisi >= 1) {
      // Déterminer la commande choisie selon l'index relatif ou absolu
      const relativeIdx = numSaisi - offset - 1;
      const cmdChoisie = (relativeIdx >= 0 && relativeIdx < commandesAffichees.length)
        ? commandesAffichees[relativeIdx]
        : (numSaisi <= commandesAffichees.length ? commandesAffichees[numSaisi - 1] : null);

      if (cmdChoisie) {
        await envoyerFicheActionCommande(phone, boutique, cmdChoisie);
        await setSession(phone, 'MARCHAND_COMMANDE_DETAIL', {
          boutique,
          isMarchandAuth: true,
          commande: cmdChoisie,
          commandes: commandesAffichees,
          offset,
        });
        return;
      }
    }

    // 2. Si l'utilisateur tape une référence ou le nom du client (ex: C-MSRYSRE3, CMD-2026-5417)
    if (txtClean.length >= 3 && !['menu', 'plus', 'retour', 'commandes', 'liste'].includes(txtClean.toLowerCase())) {
      const { rows } = await pool.query(
        `SELECT * FROM commandes_boutique 
         WHERE boutique_id = $1 
           AND (reference ILIKE $2 OR client_nom ILIKE $2)
         ORDER BY created_at DESC LIMIT 1`,
        [boutique.id, `%${txtClean}%`]
      );
      if (rows.length > 0) {
        await envoyerFicheActionCommande(phone, boutique, rows[0]);
        await setSession(phone, 'MARCHAND_COMMANDE_DETAIL', {
          boutique,
          isMarchandAuth: true,
          commande: rows[0],
          commandes: commandesAffichees,
          offset,
        });
        return;
      }
    }

    if (txtClean.toLowerCase() === 'plus' || txtClean.toLowerCase() === 'suivant' || txtClean.toLowerCase() === 'suite') {
      await envoyerCommandesMarchand(phone, boutique, offset + 5);
      return;
    }

    if (txtClean.toLowerCase() === 'commandes' || txtClean.toLowerCase() === 'liste' || txtClean.toLowerCase() === 'retour') {
      await envoyerCommandesMarchand(phone, boutique, offset);
      return;
    }

    if (txtClean.toLowerCase() === 'menu' || txtClean.toLowerCase() === 'marchand') {
      await envoyerMenuMarchand(phone, boutique);
      return;
    }
  }

  // ── MARCHAND_MENU → Actions du Menu Marchand ─────────────────────────────────
  if (state === 'MARCHAND_MENU') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'IDLE', {});
      await sendMenu(phone);
      return;
    }

    const action = interactiveId || normTxtLower;

    if (action === 'marchand_commandes' || action === 'commandes' || action === 'commande' || action === 'mes commandes' || action === 'suivi commandes') {
      await envoyerCommandesMarchand(phone, boutique);
      return;
    }

    if (action === 'marchand_ajout_produit' || action === '1' || action === '+produit' || action === 'ajouter produit') {
      await setSession(phone, 'AJOUT_PRODUIT_NOM', { boutique });
      await sendWhatsAppText(
        phone,
        `🛍️ *Ajout de Produit — ${boutique.nom}*\n\n` +
        `⚡ *Option 1 (Express)* : Envoyez directement une photo de l'article avec le *Nom et le Prix* en légende (ex: *Robe Bazin 15000*) !\n\n` +
        `💬 *Option 2 (Guidé)* : Quel est le *nom ou titre du produit* ? (ex: Sandales Cuir, Sac à main...)`
      );
      return;
    }

    if (action === 'marchand_stock' || action === '2' || action === 'stock' || action === 'mes produits') {
      await envoyerStockMarchand(phone, boutique);
      return;
    }

    if (action === 'marchand_caisse' || action === '3' || action === 'caisse' || action === 'ventes') {
      await envoyerBilanCaisseMarchand(phone, boutique);
      return;
    }

    if (action === 'marchand_dettes' || action === '4' || action === 'bor' || action === 'dette' || action === 'dettes') {
      await envoyerCarnetDettesMarchand(phone, boutique);
      return;
    }

    if (action === 'marchand_vitrine' || action === '5' || action === 'vitrine' || action === 'statut') {
      await envoyerVitrineStatutMarchand(phone, boutique);
      return;
    }

    if (action === 'marchand_changer_pin' || action === '6' || action === 'changer pin' || action === 'code pin' || action === 'pin') {
      await setSession(phone, 'MARCHAND_CHANGE_PIN_ACTUEL', { boutique, isMarchandAuth: true });
      await sendWhatsAppText(
        phone,
        `🔐 *Modification du Code PIN — ${boutique.nom}*\n\n` +
        `Veuillez saisir votre *Code PIN ACTUEL* (par défaut : 1234) :\n\n` +
        `*(Si vous l'avez oublié, tapez simplement : pin oublié)*`
      );
      return;
    }

    if (action === 'menu') {
      const buttons = [
        { id: 'menu_marchand', title: '🏪 Menu Marchand' },
        { id: 'menu_general', title: '🌐 Menu Principal' },
      ];
      await sendWhatsAppButtons3(
        phone,
        `📍 Vous êtes dans votre espace de gestion *${boutique.nom}*.\n\nQuel menu souhaitez-vous ouvrir ?`,
        buttons
      ).catch(() => {});
      return;
    }

    if (action === 'boutique_quitter' || action === 'quitter') {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }

    // Ré-afficher le menu marchand
    await envoyerMenuMarchand(phone, boutique);
    return;
  }

  // ── MARCHAND_CHANGE_PIN_ACTUEL → Saisie du PIN actuel ─────────────────────────
  if (state === 'MARCHAND_CHANGE_PIN_ACTUEL') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'IDLE', {});
      await sendMenu(phone);
      return;
    }

    // Demande de réinitialisation si PIN oublié
    if (normTxtLower === 'pin oublie' || normTxtLower === 'pin oublié' || normTxtLower === 'reinitialiser pin') {
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      _otpCodesMarchand.set(phone, { code: otpCode, boutiqueId: boutique.id, expiresAt: Date.now() + 10 * 60 * 1000 });
      await setSession(phone, 'MARCHAND_RESET_OTP', { boutique, otpCode });
      await sendWhatsAppText(
        phone,
        `🔒 *Code de Sécurité Nopalou — Réinitialisation PIN*\n\n` +
        `Votre code de vérification temporaire est : *${otpCode}*\n\n` +
        `👉 Renvoyez simplement ce code *${otpCode}* pour autoriser la création de votre nouveau Code PIN.`
      );
      return;
    }

    const pinValide = await verifierCodePin(boutique, text.trim());
    if (pinValide) {
      await setSession(phone, 'MARCHAND_CHANGE_PIN_NOUVEAU', { boutique, isMarchandAuth: true });
      await sendWhatsAppText(
        phone,
        `✨ *Code PIN actuel validé !*\n\nVeuillez entrer votre *NOUVEAU Code PIN* (4 à 6 chiffres, ex: 5678) :`
      );
      return;
    } else {
      await sendWhatsAppText(
        phone,
        `❌ *Code PIN actuel incorrect*.\n\nVeuillez réessayer ou tapez *pin oublié* pour le réinitialiser par code de sécurité.`
      );
      return;
    }
  }

  // ── MARCHAND_CHANGE_PIN_NOUVEAU → Enregistrement du nouveau PIN ───────────────
  if (state === 'MARCHAND_CHANGE_PIN_NOUVEAU') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'IDLE', {});
      await sendMenu(phone);
      return;
    }

    const nouveauPin = text.trim().replace(/\D/g, '');
    if (nouveauPin.length < 4 || nouveauPin.length > 6) {
      await sendWhatsAppText(
        phone,
        `⚠️ Le Code PIN doit contenir entre 4 et 6 chiffres (ex: 5678). Veuillez réessayer :`
      );
      return;
    }

    try {
      await pool.query('UPDATE boutiques SET code_pin = $1, updated_at = NOW() WHERE id = $2', [nouveauPin, boutique.id]);
      boutique.code_pin = nouveauPin;

      await sendWhatsAppText(
        phone,
        `✅ *Code PIN modifié avec succès !* 🎉\n\nVotre nouveau code secret (*${nouveauPin}*) est bien enregistré et sécurise l'accès à votre boutique *${boutique.nom}*.`
      );
      await envoyerMenuMarchand(phone, boutique);
      return;
    } catch (errPin) {
      console.error('[CHANGER PIN ERR]:', errPin);
      await sendWhatsAppText(phone, '😕 Erreur lors de la mise à jour du PIN. Veuillez réessayer.');
      await envoyerMenuMarchand(phone, boutique);
      return;
    }
  }

  // ── MARCHAND_RESET_OTP → Validation du code de sécurité ───────────────────────
  if (state === 'MARCHAND_RESET_OTP') {
    const boutique = context?.boutique;
    const expectedOtp = context?.otpCode;
    const otpData = _otpCodesMarchand.get(phone);

    if (!boutique) {
      await setSession(phone, 'IDLE', {});
      await sendMenu(phone);
      return;
    }

    const inputCode = text.trim().replace(/\D/g, '');
    if ((expectedOtp && inputCode === expectedOtp) || (otpData && otpData.code === inputCode && Date.now() < otpData.expiresAt)) {
      await setSession(phone, 'MARCHAND_RESET_NOUVEAU_PIN', { boutique, isMarchandAuth: true });
      await sendWhatsAppText(
        phone,
        `✅ *Identité vérifiée avec succès !*\n\nVeuillez maintenant saisir votre *NOUVEAU Code PIN* (4 à 6 chiffres, ex: 5678) :`
      );
      return;
    } else {
      await sendWhatsAppText(
        phone,
        `❌ *Code de vérification incorrect ou expiré*.\n\nRenvoyez le code de 4 chiffres reçu ou tapez *menu*.`
      );
      return;
    }
  }

  // ── MARCHAND_RESET_NOUVEAU_PIN → Enregistrement du nouveau PIN après OTP ──────
  if (state === 'MARCHAND_RESET_NOUVEAU_PIN') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'IDLE', {});
      await sendMenu(phone);
      return;
    }

    const nouveauPin = text.trim().replace(/\D/g, '');
    if (nouveauPin.length < 4 || nouveauPin.length > 6) {
      await sendWhatsAppText(
        phone,
        `⚠️ Le Code PIN doit contenir entre 4 et 6 chiffres (ex: 5678). Veuillez réessayer :`
      );
      return;
    }

    try {
      await pool.query('UPDATE boutiques SET code_pin = $1, updated_at = NOW() WHERE id = $2', [nouveauPin, boutique.id]);
      boutique.code_pin = nouveauPin;
      _otpCodesMarchand.delete(phone);

      await sendWhatsAppText(
        phone,
        `✅ *Nouveau Code PIN enregistré avec succès !* 🎉\n\nVotre code secret a été réinitialisé avec succès (*${nouveauPin}*).`
      );
      await envoyerMenuMarchand(phone, boutique);
      return;
    } catch (errPinReset) {
      console.error('[RESET PIN ERR]:', errPinReset);
      await sendWhatsAppText(phone, '😕 Erreur lors de l\'enregistrement. Veuillez réessayer.');
      await envoyerMenuMarchand(phone, boutique);
      return;
    }
  }

  // ── AJOUT_PRODUIT_NOM → Nom du produit (avec support image & détection automatique nom/prix/stock) ─
  if (state === 'AJOUT_PRODUIT_NOM') {
    const boutique = context?.boutique;
    let initialPhotos = Array.isArray(context?.photos) ? [...context.photos] : [];

    // Si l'utilisateur envoie une image directement dans cet état
    if (mediaId) {
      const imageUrl = await telechargerMediaWhatsApp(mediaId);
      if (imageUrl) initialPhotos.push(imageUrl);
    }

    const rawText = (text || '').trim();

    // Vérifier si le texte contient à la fois le nom, le prix et éventuellement le stock
    const infosProd = extraireInfosProduitTexte(rawText);
    if (infosProd) {
      const { nom: prodNom, prix: prixNum, stock: stockNum } = infosProd;

      if (initialPhotos.length > 0) {
        // L'utilisateur a envoyé à la fois la photo, le nom et le prix ! On publie immédiatement
        try {
          const resProd = await pool.query(
            `INSERT INTO boutique_produits (boutique_id, nom, prix, stock_quantite, images, en_stock)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id, nom, prix, stock_quantite`,
            [boutique.id, prodNom, prixNum, stockNum, initialPhotos]
          );
          const prodCree = resProd.rows[0];
          const normPh = normalisePhone(phone);
          _recentsProduitsCrees.set(normPh, {
            produitId: prodCree.id,
            boutiqueId: boutique.id,
            nom: prodCree.nom,
            totalPhotos: initialPhotos.length,
            timestamp: Date.now(),
          });

          // Sync catalog background
          try {
            const { syncProduit } = require('./whatsapp-catalog');
            syncProduit(prodCree.id).catch(() => {});
          } catch (_) {}

          const stockLabel = (prodCree.stock_quantite !== null && prodCree.stock_quantite !== undefined)
            ? `*${prodCree.stock_quantite} unité(s)*`
            : '*Illimité*';

          await sendWhatsAppText(
            phone,
            `✅ *Article publié avec succès !* 🎉\n\n` +
            `🛍️ Article : *${prodCree.nom}*\n` +
            `💰 Prix : *${prixFmt(prodCree.prix)}*\n` +
            `📦 Stock : ${stockLabel}\n` +
            `📸 Photos : *${initialPhotos.length} photo(s)*\n` +
            `🏪 Boutique : *${boutique.nom}*\n\n` +
            `👉 *Astuce multi-photos :* Vous pouvez envoyer d'autres photos pour cet article, elles seront automatiquement ajoutées !`
          );
          await envoyerMenuMarchand(phone, boutique);
          return;
        } catch (eQuick) {
          console.error('[QUICK ADD PROD ERR]:', eQuick);
        }
      }

      // Si le stock a déjà été saisi dans le texte (ex: "Sac cuir 5000 10" ou "Sac 5000 stock 10")
      if (stockNum !== null) {
        await setSession(phone, 'AJOUT_PRODUIT_PHOTO', { boutique, produit_nom: prodNom, prix: prixNum, stock: stockNum, photos: initialPhotos });
        await sendWhatsAppText(
          phone,
          `✅ Article : *${prodNom}* — Prix : *${prixFmt(prixNum)}* — Stock : *${stockNum} unité(s)*\n\n` +
          `📸 Envoyez maintenant la ou les photos de votre article *${prodNom}*.\n` +
          `Tapez *OK* quand vous avez fini ou *passer* pour publier sans photo.`
        );
        return;
      }

      // Si le prix est renseigné mais pas le stock : demander le stock
      await setSession(phone, 'AJOUT_PRODUIT_STOCK', { boutique, produit_nom: prodNom, prix: prixNum, photos: initialPhotos });
      await sendWhatsAppText(
        phone,
        `✅ Article : *${prodNom}* — Prix : *${prixFmt(prixNum)}*\n\n` +
        `📦 Quelle est la *quantité disponible en stock* ? (ex: *10*, *25*, *5*...)\n` +
        `👉 Tapez un chiffre ou tapez *passer* pour un stock illimité.`
      );
      return;
    }

    // Si l'utilisateur a envoyé une image sans texte
    if (mediaId && initialPhotos.length > 0 && (!rawText || rawText.length < 2)) {
      await setSession(phone, 'AJOUT_PRODUIT_NOM', { boutique, photos: initialPhotos });
      await sendWhatsAppText(
        phone,
        `📸 *Photo bien reçue !*\n\nQuel est le *nom ou titre de ce produit* ? (ex: Chaussure Sport, Robe Soirée...)`
      );
      return;
    }

    if (!rawText || rawText.length < 2) {
      await sendWhatsAppText(phone, '⚠️ Veuillez entrer un nom de produit valide (au moins 2 caractères).');
      return;
    }

    const prodNom = rawText;
    await setSession(phone, 'AJOUT_PRODUIT_PRIX', { boutique, produit_nom: prodNom, photos: initialPhotos });
    await sendWhatsAppText(
      phone,
      `💰 Quel est le *prix de vente en FCFA* pour *${prodNom}* ? (ex: 15000, 25000, 5000...)`
    );
    return;
  }

  // ── AJOUT_PRODUIT_PRIX → Prix du produit (avec support éventuel du stock en 1 fois) ─
  if (state === 'AJOUT_PRODUIT_PRIX') {
    let photos = Array.isArray(context?.photos) ? [...context.photos] : [];
    if (mediaId) {
      const imageUrl = await telechargerMediaWhatsApp(mediaId);
      if (imageUrl) photos.push(imageUrl);
    }

    const boutique = context?.boutique;
    const prodNom = context?.produit_nom;
    const rawPrixTxt = (text || '').trim();

    // Vérifier si le prix + stock ont été saisis ensemble (ex: "15000 stock 10" ou "15000 10")
    const infosP = extraireInfosProduitTexte(`Article ${rawPrixTxt}`);
    let prixNum = null;
    let stockNum = null;

    if (infosP) {
      prixNum = infosP.prix;
      stockNum = infosP.stock;
    } else {
      const rawPrix = rawPrixTxt.replace(/[^\d]/g, '');
      prixNum = parseInt(rawPrix, 10);
    }

    if (isNaN(prixNum) || prixNum <= 0) {
      await sendWhatsAppText(phone, '⚠️ Veuillez entrer un montant numérique valide en FCFA (ex: 15000).');
      return;
    }

    if (stockNum !== null) {
      await setSession(phone, 'AJOUT_PRODUIT_PHOTO', { boutique, produit_nom: prodNom, prix: prixNum, stock: stockNum, photos });
      await sendWhatsAppText(
        phone,
        `✅ Prix : *${prixFmt(prixNum)}* — Stock : *${stockNum} unité(s)*\n\n` +
        `📸 Envoyez la ou les photos de votre article *${prodNom}*.\n` +
        `Tapez *OK* quand vous avez fini ou *passer* pour publier sans photo.`
      );
      return;
    }

    await setSession(phone, 'AJOUT_PRODUIT_STOCK', { boutique, produit_nom: prodNom, prix: prixNum, photos });
    await sendWhatsAppText(
      phone,
      `💰 Prix enregistré : *${prixFmt(prixNum)}*\n\n` +
      `📦 Quelle est la *quantité disponible en stock* pour *${prodNom}* ? (ex: *10*, *25*, *5*...)\n` +
      `👉 Tapez un chiffre ou tapez *passer* pour un stock illimité.`
    );
    return;
  }

  // ── AJOUT_PRODUIT_STOCK → Quantité en stock ─────────────────────────────────
  if (state === 'AJOUT_PRODUIT_STOCK') {
    let photos = Array.isArray(context?.photos) ? [...context.photos] : [];
    if (mediaId) {
      const imageUrl = await telechargerMediaWhatsApp(mediaId);
      if (imageUrl) photos.push(imageUrl);
    }

    const boutique = context?.boutique;
    const prodNom = context?.produit_nom;
    const prix = context?.prix || 0;
    const rawStock = (text || '').toLowerCase().trim();

    let stockNum = null;
    if (rawStock !== 'passer' && rawStock !== 'skip' && rawStock !== 'illimite' && rawStock !== 'aucun' && rawStock !== '-') {
      const parsedStock = parseInt(rawStock.replace(/[^\d]/g, ''), 10);
      if (!isNaN(parsedStock) && parsedStock >= 0) {
        stockNum = parsedStock;
      }
    }

    await setSession(phone, 'AJOUT_PRODUIT_PHOTO', { boutique, produit_nom: prodNom, prix, stock: stockNum, photos });

    const stockLabel = stockNum !== null ? `*${stockNum} unité(s)*` : '*Illimité*';

    if (photos.length > 0) {
      await sendWhatsAppText(
        phone,
        `📦 Stock enregistré : ${stockLabel}\n\n` +
        `📸 *Photos du produit (${photos.length} reçue(s)) :*\n` +
        `Vous pouvez envoyer d'autres photos pour *${prodNom}*, ou taper *OK* pour publier l'article !`
      );
    } else {
      await sendWhatsAppText(
        phone,
        `📦 Stock enregistré : ${stockLabel}\n\n` +
        `📸 *Photos du produit :*\n` +
        `Envoyez 1 ou plusieurs photos de votre article *${prodNom}*.\n` +
        `Tapez *OK* quand vous avez fini ou *passer* pour publier sans photo.`
      );
    }
    return;
  }

  // ── AJOUT_PRODUIT_PHOTO → Collecte Multi-Photos & Finalisation ──────────────
  if (state === 'AJOUT_PRODUIT_PHOTO') {
    const boutique = context?.boutique;
    const prodNom = context?.produit_nom;
    const prix = context?.prix || 0;
    const stock = (context?.stock !== undefined && context?.stock !== null) ? context.stock : null;
    let photos = Array.isArray(context?.photos) ? [...context.photos] : [];

    if (!boutique || !prodNom) {
      await setSession(phone, 'IDLE', {});
      await sendMenu(phone);
      return;
    }

    // 1. Si une image arrive
    if (mediaId) {
      const imageUrl = await telechargerMediaWhatsApp(mediaId);
      if (imageUrl) {
        photos.push(imageUrl);
        await setSession(phone, 'AJOUT_PRODUIT_PHOTO', { boutique, produit_nom: prodNom, prix, stock, photos });
        await sendWhatsAppText(
          phone,
          `📸 *Photo ${photos.length} enregistrée !*\n\n` +
          `Vous pouvez envoyer une autre photo pour cet article, ou taper *OK* (ou *terminer*) pour publier le produit !`
        );
        return;
      }
    }

    // 2. Si validation par texte (OK, valider, terminer, passer, URL)
    const txtLow = (text || '').toLowerCase().trim();
    if (txtLow === 'ok' || txtLow === 'terminer' || txtLow === 'valider' || txtLow === 'passer' || txtLow === 'fin' || txtLow.startsWith('http')) {
      if (txtLow.startsWith('http')) {
        photos.push(text.trim());
      }

      try {
        const resProd = await pool.query(
          `INSERT INTO boutique_produits (boutique_id, nom, prix, stock_quantite, images, en_stock)
           VALUES ($1, $2, $3, $4, $5, true)
           RETURNING id, nom, prix, stock_quantite`,
          [boutique.id, prodNom, prix, stock, photos]
        );

        const prodCree = resProd.rows[0];

        // Enregistrer dans le tampon multi-photos
        const normPh = normalisePhone(phone);
        _recentsProduitsCrees.set(normPh, {
          produitId: prodCree.id,
          boutiqueId: boutique.id,
          nom: prodCree.nom,
          totalPhotos: photos.length,
          timestamp: Date.now(),
        });

        // Sync catalog background
        try {
          const { syncProduit } = require('./whatsapp-catalog');
          syncProduit(prodCree.id).catch(() => {});
        } catch (_) {}

        const stockLabel = (prodCree.stock_quantite !== null && prodCree.stock_quantite !== undefined)
          ? `*${prodCree.stock_quantite} unité(s)*`
          : '*Illimité*';

        const msgProdSucces =
          `✅ *Article publié avec succès sur votre boutique !* 🎉\n\n` +
          `🛍️ Article : *${prodCree.nom}*\n` +
          `💰 Prix : *${prixFmt(prodCree.prix)}*\n` +
          `📦 Stock : ${stockLabel}\n` +
          `📸 Photos : *${photos.length} photo(s) enregistrée(s)*\n` +
          `🏪 Boutique : *${boutique.nom}*\n\n` +
          `🔗 *Fiche produit en ligne :*\n${SITE}/boutiques/${boutique.slug}\n\n` +
          `👉 *Pour ajouter le prochain article :*\nEnvoyez simplement la photo avec le nom, prix et stock en légende (ex: *Sac cuir 5000 10*) !`;

        await sendWhatsAppText(phone, msgProdSucces);
        await envoyerMenuMarchand(phone, boutique);
        return;
      } catch (errAddProd) {
        console.error('[AJOUT PRODUIT WA ERR]:', errAddProd);
        await sendWhatsAppText(phone, '😕 Impossible d\'enregistrer le produit pour le moment. Réessayez avec *+produit*.');
        await envoyerMenuMarchand(phone, boutique);
        return;
      }
    }

    await sendWhatsAppText(
      phone,
      `📸 Envoyez une photo pour *${prodNom}*, ou tapez *OK* pour valider (${photos.length} photo(s) reçue(s)), ou *passer* pour publier sans photo.`
    );
    return;
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  await setSession(phone, 'IDLE', {});
  await sendMenu(phone);
}

async function handleSearchQuery(phone, query, excludeIds = []) {
  if (!query || query.trim().length < 2) {
    await sendWhatsAppText(phone, '⚠️ Veuillez entrer un mot-clé de recherche (ex: iPhone, Robe, Télévision...), ou tapez *menu*.');
    return;
  }

  const cleanQ = query.trim();

  // Si la recherche commence sans pagination et correspond au nom exact ou partiel d'une boutique
  if (excludeIds.length === 0 && cleanQ.length >= 3) {
    const rBoutique = await pool.query(
      `SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp
       FROM boutiques
       WHERE actif=true AND (nom ILIKE $1 OR slug ILIKE $2)
       LIMIT 1`,
      [`%${cleanQ}%`, `%${cleanQ}%`]
    );
    if (rBoutique.rows.length > 0) {
      const b = rBoutique.rows[0];
      if (b && b.nom && b.nom.toLowerCase().includes(cleanQ.toLowerCase())) {
        await sendWhatsAppText(phone, `🏪 J'ai trouvé la boutique *${b.nom}* (${b.categorie || 'commerce'}${b.ville ? ` — ${b.ville}` : ''}) !`);
        await envoyerMenuBoutique(phone, b);
        return;
      }
    }
  }

  const results = await searchContent(cleanQ, excludeIds);
  if (!results.length) {
    if (excludeIds.length) {
      // Pagination épuisée — tout a déjà été montré.
      await sendWhatsAppText(phone, `✅ Vous avez vu tout ce que j'ai pour *"${cleanQ}"*.\n\nEssayez avec d'autres mots-clés ou tapez *menu*.`);
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'MENU', {});
      return;
    }
    await sendWhatsAppText(phone, `😕 Aucun résultat pour *"${cleanQ}"*.\n\nEssayez avec d'autres mots-clés ou tapez *menu*.`);
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
      templateName: a.type === 'immo' ? 'nopalou_carousel_immo' : 'nopalou_carousel_annonce',
      imageUrl: a.photo || null,
      title:    a.titre,
      detail:   prixFmt(a.prix),
      pageUrl:  `${SITE}/${a.type === 'immo' ? 'immo' : 'annonces'}/${a.id}`,
    }));
    await sendWhatsAppCarousel(phone, 'nopalou_carousel_annonce', cards).catch(async () => {
      const lines = cards.map(c => `• *${c.title}* — ${c.detail}\n${c.pageUrl}`);
      await sendWhatsAppText(phone, lines.join('\n\n'));
    });
  }

  const delaiAttente = (produits.length > 0 || autres.length > 0) ? 2200 : 800;
  await attendre(delaiAttente); // laisse le temps aux messages précédents de s'afficher avant le bouton
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres résultats, faites une nouvelle recherche, ou :').catch(() => {});
  await setSession(phone, 'MENU', {
    last: { type: 'search', query: cleanQ, shownIds: excludeIds.concat(results.map(r => String(r.id))) },
  });
}

module.exports = {
  handleIncoming,
  extraireInfosProduitTexte,
  cleanupOldMessages,
  resetInactiveSessions,
  handleSearchQuery,
  rechercherBoutiquesParNom,
  envoyerFicheProduitBoutique,
  envoyerProduitsBoutique,
  envoyerToutesLesBoutiques,
  extraireNumeroTelephone,
  trouverBoutiqueParTelephone,
  trouverBoutiqueMarchand,
  verifierCodePin,
  envoyerMenuMarchand,
  envoyerCommandesMarchand,
  envoyerFicheActionCommande,
  envoyerStockMarchand,
  envoyerBilanCaisseMarchand,
  envoyerCarnetDettesMarchand,
  envoyerVitrineStatutMarchand,
  detecterIntentionInterrogative,
  enregistrerDemandeSupport,
};

