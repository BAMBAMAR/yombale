// backend/routes/chat.js — API Endpoint pour l'Assistant Conversationnel Web Nopalou
const router = require('express').Router();
const { pool } = require('../models/db');
const { limiterRecherche } = require('../middlewares/rateLimit');
const {
  corrigerRequeteFuzzy,
  searchContentIlike,
  detecterIntentionInterrogative,
} = require('../services/whatsapp-chatbot');
const { detecterIntentionImmo } = require('../services/immo-chatbot');
const {
  detecterIntentionComparateur,
  extraireSujetComparaison,
  comparerPrixProduits,
} = require('../services/whatsapp-comparator');

const WA_PHONE = '221708717942';

// ── Base de connaissances FAQ instantanée ─────────────────────────────────────
const FAQ_WEB = [
  {
    motsCles: ['livraison', 'delai', 'frais de livraison', 'livrez-vous', 'expedition'],
    titre: 'Livraison & Expéditions',
    reponse: 'Nopalou livre partout à Dakar sous 2 à 4 heures, et dans les régions du Sénégal sous 24 à 48 heures selon les boutiques partenaires. Les frais sont calculés automatiquement lors de la commande.',
    actionLabel: 'Explorer les boutiques',
    actionUrl: '/boutiques',
  },
  {
    motsCles: ['paiement', 'wave', 'orange money', 'om', 'payer', 'carte bancaire'],
    titre: 'Moyens de Paiement Sécurisés',
    reponse: 'Vous pouvez régler directement par Wave, Orange Money ou en espèces à la livraison. Les paiements sont sécurisés sans frais cachés.',
    actionLabel: 'En savoir plus',
    actionUrl: '/faq',
  },
  {
    motsCles: ['vendre', 'creer boutique', 'devenir vendeur', 'marchand', 'ouvrir magasin'],
    titre: 'Ouvrir votre Boutique Nopalou',
    reponse: 'Créer votre boutique sur Nopalou est rapide et gratuit le 1er mois : catalogue en ligne, caisse tactile et synchronisation WhatsApp automatique.',
    actionLabel: 'Créer ma boutique',
    actionUrl: '/creer-boutique',
  },
  {
    motsCles: ['immo', 'appartement', 'villa', 'location', 'agence immo', 'logement', 'studio'],
    titre: 'Immobilier & Logements',
    reponse: 'Consultez des centaines d\'annonces de location et vente vérifiées avec loyers transparents, ou contactez directement les agences partenaires.',
    actionLabel: 'Voir les biens immobiliers',
    actionUrl: '/annonces/immo',
  },
  {
    motsCles: ['commande', 'suivi', 'colis', 'ou est ma commande', 'etat commande'],
    titre: 'Suivi de Commande',
    reponse: 'Pour suivre votre commande, saisissez votre référence de commande ou votre numéro de téléphone sur la page de suivi.',
    actionLabel: 'Suivre ma commande',
    actionUrl: '/commandes/suivi',
  },
];

// ── POST /api/chat/message ────────────────────────────────────────────────────
router.post('/message', limiterRecherche, async (req, res) => {
  const rawText = (req.body?.message || '').trim();
  if (!rawText) {
    return res.status(400).json({ error: 'Message requis' });
  }

  const textLower = rawText.toLowerCase();
  const whatsappUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(rawText)}`;

  // 0. Détection Comparateur de Prix Multi-Marchands (Audit M5)
  if (detecterIntentionComparateur(rawText)) {
    const sujet = extraireSujetComparaison(rawText) || rawText;
    const resComp = await comparerPrixProduits(sujet);
    if (resComp.offres && resComp.offres.length > 0) {
      let reply = `⚖️ Comparatif des prix relevés pour "${sujet}", classé par ordre croissant :\n`;
      if (resComp.economieMax > 0) {
        reply += `💡 Jusqu'à ${resComp.economieMax.toLocaleString('fr-FR')} FCFA d'écart constaté entre nos marchands partenaires !`;
      }
      return res.json({
        success: true,
        reply,
        items: resComp.offres.map((it) => ({
          id: it.id,
          titre: it.nom,
          prix: it.prix,
          photo: Array.isArray(it.photos) ? it.photos[0] : it.photos,
          type: it.source === 'boutique' ? 'produit' : 'marketplace',
          boutiqueNom: it.boutique_nom,
          url: it.source === 'boutique'
            ? `/boutiques/${it.boutique_slug || 'boutique'}/produits/${it.id}`
            : `/produit/${it.id}`,
        })),
        chips: [
          { label: 'Comparer sur le site', url: `/recherche?q=${encodeURIComponent(sujet)}` },
          { label: 'Commander sur WhatsApp', url: whatsappUrl },
        ],
        whatsappUrl,
      });
    }
  }

  // 1. Détection FAQ Web
  const faqTrouvee = FAQ_WEB.find((f) =>
    f.motsCles.some((mot) => textLower.includes(mot))
  );

  // 2. Détection Intention Immobilière
  const isImmo = detecterIntentionImmo(rawText);

  // 3. Correction orthographique automatique (Fuzzy matching)
  const suggestionFuzzy = corrigerRequeteFuzzy(rawText);
  const requeteRecherche = suggestionFuzzy || rawText;

  // 4. Recherche de produits & boutiques correspondants
  let items = [];
  try {
    items = await searchContentIlike(requeteRecherche);
  } catch (errSearch) {
    console.warn('[CHAT API SEARCH WARN]:', errSearch.message);
  }

  // Construction de la réponse intelligente
  let reply = '';
  let chips = [];

  if (faqTrouvee) {
    reply = faqTrouvee.reponse;
    if (faqTrouvee.actionLabel && faqTrouvee.actionUrl) {
      chips.push({ label: faqTrouvee.actionLabel, url: faqTrouvee.actionUrl });
    }
  } else if (isImmo) {
    reply = `Voici les offres immobilières correspondant à votre recherche sur Nopalou :`;
    chips.push(
      { label: 'Toutes les locations', url: '/annonces/immo' },
      { label: 'Espace Agences', url: '/agence' }
    );
  } else if (items.length > 0) {
    if (suggestionFuzzy && suggestionFuzzy.toLowerCase() !== rawText.toLowerCase()) {
      reply = `Je n'ai pas trouvé de correspondance exacte pour "${rawText}", mais voici les résultats pour "${suggestionFuzzy}" :`;
    } else {
      reply = `Voici les meilleures offres trouvées pour votre recherche :`;
    }
    chips.push(
      { label: 'Voir tout le comparateur', url: `/recherche?q=${encodeURIComponent(requeteRecherche)}` },
      { label: 'Boutiques partenaires', url: '/boutiques' }
    );
  } else {
    reply = `Je n'ai pas trouvé de produit correspondant exactement à "${rawText}". Vous pouvez reformuler ou continuer directement avec un conseiller sur WhatsApp.`;
    chips.push(
      { label: 'Explorer les boutiques', url: '/boutiques' },
      { label: 'Offres du moment', url: '/' }
    );
  }

  return res.json({
    success: true,
    reply,
    correction: suggestionFuzzy && suggestionFuzzy.toLowerCase() !== rawText.toLowerCase() ? suggestionFuzzy : null,
    items: items.map((it) => ({
      id: it.id,
      titre: it.titre,
      prix: it.prix,
      photo: it.photo,
      type: it.type,
      boutiqueNom: it.boutique_nom,
      url: it.type === 'produit'
        ? `/boutiques/${it.boutique_slug || 'boutique'}/produits/${it.id}`
        : it.type === 'immo'
        ? `/annonces/immo/${it.id}`
        : `/produit/${it.id}`,
    })),
    chips,
    whatsappUrl,
  });
});

module.exports = router;
