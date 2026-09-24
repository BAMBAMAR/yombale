// backend/routes/chat.js — API Endpoint pour l'Assistant Conversationnel Web Nopalou
const router = require('express').Router();
const { pool } = require('../models/db');
const { limiterRecherche } = require('../middlewares/rateLimit');
const {
  corrigerRequeteFuzzy,
  searchContentIlike,
} = require('../services/whatsapp-chatbot');
const { detecterIntentionImmo } = require('../services/immo-chatbot');
const {
  detecterIntentionComparateur,
  extraireSujetComparaison,
  comparerPrixProduits,
} = require('../services/whatsapp-comparator');

const WA_PHONE = '221708717942';
const { FAQ_WEB } = require('../lib/faq');

// ── Fonctions de recherche spécialisées ───────────────────────────────────────

/**
 * Recherche avancée de biens immobiliers avec extraction sémantique
 */
async function searchImmoIlike(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const t = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const isVente = /\b(vendre|vente|achat|acheter)\b/i.test(t);
  const isLocation = /\b(louer|location|bail|loyer)\b/i.test(t);
  const transaction = isVente ? 'vente' : isLocation ? 'location' : null;

  let typeBien = null;
  if (/\bvillas?\b/i.test(t)) typeBien = 'villa';
  else if (/\b(appartements?|apparts?)\b/i.test(t)) typeBien = 'appartement';
  else if (/\bstudios?\b/i.test(t)) typeBien = 'studio';
  else if (/\b(terrains?|parcelles?)\b/i.test(t)) typeBien = 'terrain';
  else if (/\bbureaux?\b/i.test(t)) typeBien = 'bureau';
  else if (/\bchambres?\b/i.test(t)) typeBien = 'chambre';
  else if (/\bimmeubles?\b/i.test(t)) typeBien = 'immeuble';

  const QUARTIERS = [
    'almadies', 'ngor', 'ouakam', 'mermoz', 'fann', 'plateau', 'point e',
    'yoff', 'nord foire', 'sud foire', 'sacre coeur', 'maristes', 'liberte',
    'vdn', 'saly', 'somone', 'ngaparou', 'thies', 'dakar', 'guediawaye', 'pikine', 'rufisque'
  ];
  let quartier = null;
  for (const q of QUARTIERS) {
    if (t.includes(q)) {
      quartier = q;
      break;
    }
  }

  let sql = `
    SELECT ai.id::text, ai.titre, ai.prix, ai.ville, ai.quartier, ai.type_bien, ai.transaction,
           ai.surface_m2, (ai.photos->>0) AS photo,
           ag.nom AS agence_nom, ag.slug AS agence_slug, ag.id::text AS agence_id
    FROM annonces_immo ai
    LEFT JOIN agences_immo ag ON ai.agence_id = ag.id
    WHERE ai.actif = true AND ai.supprimee = false
  `;
  const params = [];
  let pIdx = 1;

  if (transaction) {
    sql += ` AND ai.transaction = $${pIdx++}`;
    params.push(transaction);
  }
  if (typeBien) {
    sql += ` AND (LOWER(ai.type_bien) LIKE '%' || $${pIdx} || '%' OR ai.titre ILIKE '%' || $${pIdx} || '%')`;
    params.push(typeBien);
    pIdx++;
  }
  if (quartier) {
    sql += ` AND (ai.quartier ILIKE '%' || $${pIdx} || '%' OR ai.ville ILIKE '%' || $${pIdx} || '%' OR ai.titre ILIKE '%' || $${pIdx} || '%')`;
    params.push(quartier);
    pIdx++;
  }

  if (!transaction && !typeBien && !quartier) {
    sql += ` AND (ai.titre ILIKE '%' || $${pIdx} || '%' OR COALESCE(ai.description, '') ILIKE '%' || $${pIdx} || '%' OR COALESCE(ai.ville, '') ILIKE '%' || $${pIdx} || '%')`;
    params.push(rawText.trim());
    pIdx++;
  }

  sql += ` ORDER BY (ai.sponsorisee = true AND ai.sponsorisee_jusqu_au > NOW()) DESC, ai.created_at DESC LIMIT 4`;

  try {
    const res = await pool.query(sql, params);
    return (res.rows || []).map((row) => ({
      id: row.id,
      titre: row.titre,
      prix: row.prix,
      photo: row.photo,
      type: 'immo',
      typeBien: row.type_bien,
      transaction: row.transaction,
      ville: [row.quartier, row.ville].filter(Boolean).join(', '),
      agenceNom: row.agence_nom,
      agenceSlug: row.agence_slug,
      url: `/immo/${row.id}`,
      actions: [
        { label: "Voir l'annonce", url: `/immo/${row.id}`, variant: 'primary' },
        row.agence_slug
          ? { label: "Contacter l'agence", url: `/agences/${row.agence_slug}`, variant: 'secondary' }
          : null,
      ].filter(Boolean),
    }));
  } catch (err) {
    console.warn('[SEARCH IMMO WARN]:', err.message);
    return [];
  }
}

/**
 * Recherche de boutiques partenaires
 */
async function searchBoutiquesIlike(query) {
  if (!query || typeof query !== 'string') return [];
  const qClean = `%${query.trim()}%`;
  try {
    const res = await pool.query(
      `SELECT b.id::text, b.nom AS titre, b.slug, b.description, b.logo_url AS photo,
              b.ville, b.categorie
       FROM boutiques b
       WHERE b.actif = true
         AND (b.nom ILIKE $1 OR COALESCE(b.description, '') ILIKE $1 OR COALESCE(b.categorie, '') ILIKE $1 OR COALESCE(b.ville, '') ILIKE $1)
       ORDER BY b.created_at DESC
       LIMIT 3`,
      [qClean]
    );
    return (res.rows || []).map((row) => {
      const bRef = row.slug || row.id;
      return {
        id: row.id,
        titre: row.titre,
        photo: row.photo,
        type: 'boutique',
        ville: row.ville,
        categorie: row.categorie,
        url: `/boutiques/${bRef}`,
        actions: [
          { label: 'Visiter la boutique', url: `/boutiques/${bRef}`, variant: 'primary' },
        ],
      };
    });
  } catch (err) {
    console.warn('[SEARCH BOUTIQUES WARN]:', err.message);
    return [];
  }
}

/**
 * Recherche d'agences immobilières partenaires
 */
async function searchAgencesIlike(query) {
  if (!query || typeof query !== 'string') return [];
  const qClean = `%${query.trim()}%`;
  try {
    const res = await pool.query(
      `SELECT a.id::text, a.nom AS titre, a.slug, a.description, a.logo_url AS photo,
              a.ville, a.quartier
       FROM agences_immo a
       WHERE a.statut = 'actif'
         AND (a.nom ILIKE $1 OR COALESCE(a.description, '') ILIKE $1 OR COALESCE(a.ville, '') ILIKE $1 OR COALESCE(a.quartier, '') ILIKE $1)
       ORDER BY a.created_at DESC
       LIMIT 3`,
      [qClean]
    );
    return (res.rows || []).map((row) => {
      const aRef = row.slug || row.id;
      return {
        id: row.id,
        titre: row.titre,
        photo: row.photo,
        type: 'agence',
        ville: [row.quartier, row.ville].filter(Boolean).join(', '),
        url: `/agences/${aRef}`,
        actions: [
          { label: 'Voir la vitrine', url: `/agences/${aRef}`, variant: 'primary' },
        ],
      };
    });
  } catch (err) {
    console.warn('[SEARCH AGENCES WARN]:', err.message);
    return [];
  }
}

/**
 * Nettoie une requête en langage naturel pour extraire le mot-clé de recherche produit.
 * Exemple: "Je cherche un iphone 13" -> "iphone 13"
 *          "Avez-vous du lait bonnet rouge ?" -> "lait bonnet rouge"
 *          "Trouve-moi des chaussures" -> "chaussures"
 */
function extraireMotCleRecherche(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let clean = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?.,!;:"'’()]/g, ' ')
    .trim();

  // Supprimer les locutions introductives
  clean = clean.replace(
    /^(est[- ]ce que vous avez|avez[- ]vous|vous avez|je cherche|cherche|chercher|trouve[- ]moi|trouve|trouver|donne[- ]moi|donne|je voudrais|je veux|je souhaite|combien coute|combien coutent|quel est le prix de|prix de|prix d'un|prix d'une|recherche|acheter|achat)\s+/i,
    ''
  );

  // Supprimer les déterminants initiaux (un, une, des, du, de la, le, la, les)
  clean = clean.replace(/^(un|une|des|du|de la|le|la|les)\s+/i, '');

  clean = clean.replace(/\s+/g, ' ').trim();
  return clean || rawText.trim();
}

// ── POST /api/chat/message ────────────────────────────────────────────────────
router.post('/message', limiterRecherche, async (req, res) => {
  const startMs = Date.now();
  const rawText = (req.body?.message || '').trim();
  if (!rawText) {
    return res.status(400).json({ error: 'Message requis' });
  }

  const textLower = rawText.toLowerCase();
  const whatsappUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(rawText)}`;

  // 0. Détection Menu / Aide globale
  const isMenuQuery = /^(menu|aide|options|accueil|help|\?)$/i.test(rawText.trim());
  if (isMenuQuery) {
    return res.json({
      success: true,
      reply: "Voici les principaux univers et outils disponibles sur Nopalou. Choisissez une rubrique ou tapez directement votre recherche :",
      items: [],
      chips: [
        { label: 'Agences immobilières', url: '/agences' },
        { label: 'Boutiques partenaires', url: '/boutiques' },
        { label: 'Locations Almadies', url: 'Location appartement Almadies' },
        { label: 'Caisse POS commerçant', url: '/boutique/caisse' },
        { label: 'Espace Agence Pro', url: '/agence' },
        { label: 'Créer ma boutique', url: '/creer-boutique' },
        { label: 'Suivre ma commande', url: '/suivi-commande' },
      ],
      whatsappUrl,
    });
  }

  // 0.1 Détection Comparateur de Prix Multi-Marchands
  if (detecterIntentionComparateur(rawText)) {
    try {
      const sujet = extraireSujetComparaison(rawText) || rawText;
      const resComp = await comparerPrixProduits(sujet);
      if (resComp && resComp.offres && resComp.offres.length > 0) {
        let reply = `⚖️ Comparatif des prix relevés pour "${sujet}", classé par ordre croissant :\n`;
        if (resComp.economieMax > 0) {
          reply += `💡 Jusqu'à ${resComp.economieMax.toLocaleString('fr-FR')} FCFA d'écart constaté entre nos marchands partenaires !`;
        }
        return res.json({
          success: true,
          reply,
          items: resComp.offres.map((it) => {
            const bRef = it.boutique_slug || it.boutique_id;
            const url = it.source === 'boutique' && bRef
              ? `/boutiques/${bRef}/produits/${it.id}`
              : `/produit/${it.id}`;
            return {
              id: it.id,
              titre: it.nom,
              prix: it.prix,
              photo: Array.isArray(it.photos) ? it.photos[0] : it.photos,
              type: it.source === 'boutique' ? 'produit' : 'marketplace',
              boutiqueNom: it.boutique_nom,
              url,
              actions: [
                { label: 'Voir le produit', url, variant: 'primary' },
                it.source === 'boutique' && bRef
                  ? { label: 'Voir la boutique', url: `/boutiques/${bRef}`, variant: 'secondary' }
                  : null,
              ].filter(Boolean),
            };
          }),
          chips: [
            { label: 'Comparer sur le site', url: `/recherche?q=${encodeURIComponent(sujet)}` },
            { label: 'Commander sur WhatsApp', url: whatsappUrl },
          ],
          whatsappUrl,
        });
      }
    } catch (errComp) {
      console.warn('[CHAT API COMPARATOR WARN]:', errComp.message);
    }
  }

  // 1. Détection FAQ Web
  const faqTrouvee = FAQ_WEB.find((f) =>
    f.motsCles.some((mot) => {
      if (mot === 'om') {
        return /\bom\b/i.test(rawText);
      }
      return textLower.includes(mot);
    })
  );

  // 2. Détection Intentions Spécifiques
  const hasSpecificProperty = /\b(appartements?|apparts?|villas?|studios?|terrains?|parcelles?|bureaux?|chambres?|immeubles?|louer|location|bail|loyer|a\s+louer|a\s+vendre)\b/i.test(textLower);
  const isAgenceQuery = /\b(agences?|courtiers?|cabinets?\s+immo)\b/i.test(textLower) && !hasSpecificProperty;
  const isBoutiqueQuery = /\b(boutiques?|magasins?|shops?|supermarches?|quincailleries?)\b/i.test(textLower);
  const isImmo = detecterIntentionImmo(rawText) && !isAgenceQuery;

  // 4. Exécution de la recherche selon l'intention
  let items = [];
  let reply = '';
  let chips = [];
  let suggestionFuzzy = null;

  if (faqTrouvee) {
    reply = faqTrouvee.reponse;
    if (faqTrouvee.actionLabel && faqTrouvee.actionUrl) {
      chips.push({ label: faqTrouvee.actionLabel, url: faqTrouvee.actionUrl });
    }
    if (faqTrouvee.actionUrl === '/agences' || isAgenceQuery) {
      items = await searchAgencesIlike(rawText.replace(/\b(agences?|courtiers?|cabinets?\s+immo)\b/gi, '').trim());
      chips.push({ label: 'Biens immobiliers', url: '/immo' });
    } else if (faqTrouvee.actionUrl === '/boutiques' || isBoutiqueQuery) {
      items = await searchBoutiquesIlike('');
      chips.push({ label: 'Offres du moment', url: '/' });
    } else {
      chips.push({ label: 'Toutes les boutiques', url: '/boutiques' });
    }
  } else if (isAgenceQuery) {
    const searchParam = rawText.replace(/\b(agences?|courtiers?|cabinets?\s+immo)\b/gi, '').trim() || rawText;
    items = await searchAgencesIlike(searchParam);
    if (items.length > 0) {
      reply = `Voici les agences immobilières partenaires sur Nopalou :`;
    } else {
      reply = `Découvrez toutes nos agences partenaires répertoriées sur Nopalou :`;
    }
    chips.push(
      { label: 'Annuaire des agences', url: '/agences' },
      { label: 'Biens immobiliers', url: '/immo' }
    );
  } else if (isImmo) {
    items = await searchImmoIlike(rawText);
    if (items.length > 0) {
      reply = `Voici les offres immobilières correspondant à votre recherche sur Nopalou :`;
    } else {
      reply = `Je n'ai pas trouvé d'annonce correspondant exactement à "${rawText}". Vous pouvez explorer toutes nos offres ou contacter nos agences partenaires :`;
    }
    chips.push(
      { label: 'Toutes les annonces', url: '/immo' },
      { label: 'Annuaire Agences Pro', url: '/agences' },
      { label: 'Espace Pro Agence (Connexion)', url: '/agence' }
    );
  } else if (isBoutiqueQuery) {
    const searchParam = rawText.replace(/\b(boutiques?|magasins?|shops?|supermarches?)\b/gi, '').trim() || rawText;
    items = await searchBoutiquesIlike(searchParam);
    if (items.length > 0) {
      reply = `Voici les boutiques partenaires correspondant à votre recherche :`;
    } else {
      reply = `Explorez toutes les boutiques certifiées sur Nopalou :`;
    }
    chips.push(
      { label: 'Toutes les boutiques', url: '/boutiques' },
      { label: 'Offres du moment', url: '/' }
    );
  } else {
    // Recherche générale catalogue (Extraction de mot-clé naturel + Fuzzy + searchContentIlike)
    const motCle = extraireMotCleRecherche(rawText);
    suggestionFuzzy = corrigerRequeteFuzzy(motCle || rawText);
    const requeteRecherche = suggestionFuzzy || motCle || rawText;

    try {
      let rawResults = await searchContentIlike(requeteRecherche);
      if ((!rawResults || rawResults.length === 0) && requeteRecherche !== rawText) {
        rawResults = await searchContentIlike(rawText);
      }
      items = (rawResults || []).map((it) => {
        const bRef = it.boutique_slug || it.boutique_id;
        let url = `/produit/${it.id}`;
        let actions = [{ label: 'Voir le produit', url, variant: 'primary' }];

        if (it.type === 'produit') {
          url = bRef ? `/boutiques/${bRef}/produits/${it.id}` : `/produit/${it.id}`;
          actions = [
            { label: 'Voir le produit', url, variant: 'primary' },
            bRef ? { label: 'Voir la boutique', url: `/boutiques/${bRef}`, variant: 'secondary' } : null,
          ].filter(Boolean);
        } else if (it.type === 'immo') {
          url = `/immo/${it.id}`;
          actions = [{ label: "Voir l'annonce", url, variant: 'primary' }];
        }

        return {
          id: it.id,
          titre: it.titre,
          prix: it.prix,
          photo: it.photo,
          type: it.type,
          boutiqueNom: it.boutique_nom,
          boutiqueSlug: it.boutique_slug,
          boutiqueId: it.boutique_id,
          url,
          actions,
        };
      });
    } catch (errSearch) {
      console.warn('[CHAT API SEARCH WARN]:', errSearch.message);
    }

    if (items.length > 0) {
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
      // ── Hybridation IA Gemini 1.5 Flash RAG ──
      const { generateLlmChatReply } = require('../services/llm-chat');
      const aiResponse = await generateLlmChatReply({
        userMessage: rawText,
        contextItems: [],
        searchQuery: requeteRecherche,
      });

      if (aiResponse.success && aiResponse.reply) {
        reply = aiResponse.reply;
      } else {
        reply = `Je n'ai pas trouvé de produit correspondant exactement à "${rawText}". Vous pouvez reformuler votre recherche ou échanger directement avec un conseiller sur WhatsApp :`;
      }

      chips.push(
        { label: 'Explorer les boutiques', url: '/boutiques' },
        { label: 'Offres du moment', url: '/' },
        { label: 'Biens immobiliers', url: '/immo' }
      );
    }
  }

  const dureeMs = Date.now() - startMs;
  // Observabilité : journaliser la conversation web dans chat_web_logs de manière asynchrone non-bloquante
  setImmediate(async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_web_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_client TEXT NOT NULL,
          intention VARCHAR(50),
          nb_resultats INT DEFAULT 0,
          temps_ms INT,
          ip VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(
        `INSERT INTO chat_web_logs (message_client, intention, nb_resultats, temps_ms, ip) VALUES ($1, $2, $3, $4, $5)`,
        [rawText.slice(0, 500), isImmo ? 'immo' : isAgenceQuery ? 'agence' : isBoutiqueQuery ? 'boutique' : isMenuQuery ? 'menu' : 'produit', items.length, dureeMs, req.ip || null]
      );
    } catch (_) {}
  });

  return res.json({
    success: true,
    reply,
    correction: suggestionFuzzy && suggestionFuzzy.toLowerCase() !== rawText.toLowerCase() ? suggestionFuzzy : null,
    items,
    chips,
    whatsappUrl,
  });
});

module.exports = router;
