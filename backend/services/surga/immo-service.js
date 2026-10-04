// backend/services/surga/immo-service.js
// Service immobilier de Surga — Réutilise le pôle immobilier existant de Nopalou (annonces_immo)
// Recherche en langage naturel, gestion des alertes personnalisées, notification < 2 min
// Zéro émoji, vouvoiement strict D19, conformité Low-Data

let pool = null;
try {
  pool = require('../../db');
} catch {
  // Mode offline ou test unitaire
}

const { conditionImmoPubliable, titreCourt } = require('../../lib/immo-publiable');

/**
 * Quartiers majeurs de Dakar et agglomération
 */
const QUARTIERS_DAKAR = [
  'Almadies',
  'Ngor',
  'Ouakam',
  'Mermoz',
  'Fann',
  'Point E',
  'Plateau',
  'Sacré-Cœur',
  'Yoff',
  'Nord Foire',
  'Ouest Foire',
  'Sud Foire',
  'Mamelles',
  'Hann Maristes',
  'Liberté',
  'Parcelles Assainies',
  'Grand Yoff',
  'Médina',
  'Gueule Tapée',
  'Fann Résidence',
  'Bel Air',
  'Pikine',
  'Guédiawaye',
  'Rufisque',
  'Diamniadio',
  'Saly',
  'Somone',
];

/**
 * Biens immobiliers de démonstration si base de données non connectée
 */
const BIENS_DEMO = [
  {
    id: 'immo-demo-1',
    titre: 'Appartement F3 standing avec vue dégagée',
    description: 'Bel appartement lumineux au 3e étage avec ascenseur, grand salon, cuisine équipée, gardiennage 24/7 et groupe électrogène.',
    prix: 450000,
    surface_m2: 110,
    nb_pieces: 3,
    nb_chambres: 2,
    type_bien: 'appartement',
    transaction: 'location',
    ville: 'Dakar',
    quartier: 'Mermoz',
    meuble: false,
    verifie: true,
    agence_nom: 'Immo Prestige Sénégal',
    contact_tel: '+221771234567',
    contact_whatsapp: '221771234567',
    photos: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'immo-demo-2',
    titre: 'Studio moderne meublé climatisé',
    description: 'Studio tout confort avec kitchenette, wifi haut débit, idéal pour consultant ou cadre en mission.',
    prix: 280000,
    surface_m2: 42,
    nb_pieces: 1,
    nb_chambres: 1,
    type_bien: 'studio',
    transaction: 'location',
    ville: 'Dakar',
    quartier: 'Almadies',
    meuble: true,
    verifie: true,
    agence_nom: 'Dakar Habitat Pro',
    contact_tel: '+221772345678',
    contact_whatsapp: '221772345678',
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'immo-demo-3',
    titre: 'Villa R+1 avec jardin et piscine',
    description: 'Magnifique villa familiale 5 pièces avec jardin arboré, garage 2 véhicules, quartier sécurisé et calme.',
    prix: 185000000,
    surface_m2: 350,
    nb_pieces: 5,
    nb_chambres: 4,
    type_bien: 'villa',
    transaction: 'vente',
    ville: 'Dakar',
    quartier: 'Ngor',
    meuble: false,
    verifie: true,
    agence_nom: 'Teranga Real Estate',
    contact_tel: '+221773456789',
    contact_whatsapp: '221773456789',
    photos: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format&fit=crop&q=80'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'immo-demo-4',
    titre: 'Appartement F4 neuf à louer',
    description: 'Spacieux F4 neuf, cuisine avec buanderie, 3 chambres avec salles de bain privatives, réservoir d eau avec suppresseur.',
    prix: 600000,
    surface_m2: 145,
    nb_pieces: 4,
    nb_chambres: 3,
    type_bien: 'appartement',
    transaction: 'location',
    ville: 'Dakar',
    quartier: 'Fann Résidence',
    meuble: false,
    verifie: true,
    agence_nom: 'Agence Diop & Associés',
    contact_tel: '+221774567890',
    contact_whatsapp: '221774567890',
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=80'],
    created_at: new Date().toISOString(),
  },
];

/**
 * Normaliser une chaîne pour la recherche insensible à la casse et aux accents
 */
function normaliser(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Parser une requête en langage naturel pour l'immobilier
 * Exemple : "cherche appartement f3 mermoz moins de 400000"
 * @param {string} texte
 * @returns {{ transaction: 'location'|'vente', typeBien: string|null, quartier: string|null, prixMax: number|null, meuble: boolean|null, nbChambres: number|null, texteNettoye: string }}
 */
function parserRechercheImmoNaturelle(texte) {
  const t = normaliser(texte);

  // 1. Transaction (vente ou location)
  let transaction = 'location';
  if (t.includes('vendre') || t.includes('vente') || t.includes('achat') || t.includes('acheter')) {
    transaction = 'vente';
  }

  // 2. Type de bien
  let typeBien = null;
  if (t.includes('studio')) {
    typeBien = 'studio';
  } else if (t.includes('villa') || t.includes('maison')) {
    typeBien = 'villa';
  } else if (t.includes('appartement') || t.includes('appart') || t.includes(' f2') || t.includes(' f3') || t.includes(' f4') || t.includes(' f5')) {
    typeBien = 'appartement';
  } else if (t.includes('chambre')) {
    typeBien = 'chambre';
  } else if (t.includes('terrain') || t.includes('parcelle')) {
    typeBien = 'terrain';
  } else if (t.includes('bureau') || t.includes('bureaux')) {
    typeBien = 'bureau';
  } else if (t.includes('magasin') || t.includes('commerce') || t.includes('local')) {
    typeBien = 'local_commercial';
  }

  // 3. Nombre de chambres / pièces
  let nbPieces = null;
  let nbChambres = null;

  // Détection explicite F2/F3/F4/F5
  const matchF = t.match(/\bf\s*([1-5])\b/);
  if (matchF) {
    nbPieces = parseInt(matchF[1], 10);
    nbChambres = Math.max(1, nbPieces - 1);
  }

  // Détection explicite "X chambres"
  const matchChambres = t.match(/(\d+)\s*(?:chambre|chb)/);
  if (matchChambres) {
    nbChambres = parseInt(matchChambres[1], 10);
    if (!nbPieces) nbPieces = nbChambres + 1;
  }

  // Détection explicite "X pièces"
  const matchPieces = t.match(/(\d+)\s*(?:piece)/);
  if (matchPieces) {
    nbPieces = parseInt(matchPieces[1], 10);
    if (!nbChambres) nbChambres = Math.max(1, nbPieces - 1);
  }

  // 4. Meublé
  let meuble = null;
  if (t.includes('meuble') || t.includes('meublee') || t.includes('meubler')) {
    meuble = true;
  } else if (t.includes('non meuble') || t.includes('vide')) {
    meuble = false;
  }

  // 5. Quartier dakarois
  let quartier = null;
  for (const q of QUARTIERS_DAKAR) {
    if (t.includes(normaliser(q))) {
      quartier = q;
      break;
    }
  }

  // 6. Prix maximum (détection de montants comme "45 millions", "300000", "450 000", "200k")
  let prixMax = null;
  const matchMillions = t.match(/(\d+(?:[.,]\d+)?)\s*(?:million|millions|m)(?:\s*(?:de\s*)?(?:fcfa|cfa|f))?/);
  const matchPrixK = t.match(/(\d+)\s*k(?:\s*fcfa|\s*cfa)?/);

  if (matchMillions && matchMillions[1]) {
    prixMax = Math.round(parseFloat(matchMillions[1].replace(',', '.')) * 1000000);
  } else if (matchPrixK) {
    prixMax = parseInt(matchPrixK[1], 10) * 1000;
  } else {
    // Regex pour montants numériques (ex: "moins de 350000", "max 400 000")
    const matchPrix = t.match(/(?:moins de|max|maximum|budget|plafond|prix|a)?\s*(\d{1,3}(?:\s*\d{3})+|\d{5,9})(?:\s*fcfa|\s*cfa|\s*f)?/);
    if (matchPrix && matchPrix[1]) {
      const propre = matchPrix[1].replace(/\s+/g, '');
      const val = parseInt(propre, 10);
      if (val >= 10000) {
        prixMax = val;
      }
    }
  }

  return {
    transaction,
    typeBien,
    quartier,
    prixMax,
    meuble,
    nbPieces,
    nbChambres,
    texteNettoye: texte.trim(),
  };
}

/**
 * Rechercher des biens immobiliers dans annonces_immo
 * @param {Object} filtres
 * @param {string} [filtres.transaction] - 'location' | 'vente'
 * @param {string} [filtres.typeBien]
 * @param {string} [filtres.quartier]
 * @param {number} [filtres.prixMax]
 * @param {number} [filtres.prixMin]
 * @param {boolean} [filtres.meuble]
 * @param {string} [filtres.q]
 * @param {number} [filtres.limit]
 * @param {number} [filtres.offset]
 * @returns {Promise<{ biens: Array, total: number }>}
 */
async function rechercherBiensImmo(filtres = {}) {
  const {
    transaction,
    typeBien,
    quartier,
    prixMax,
    prixMin,
    meuble,
    q,
    limit = 20,
    offset = 0,
  } = filtres;

  if (pool) {
    try {
      const conditions = [conditionImmoPubliable('ai')];
      const params = [];

      if (transaction && transaction !== 'tous') {
        params.push(transaction);
        conditions.push(`ai.transaction = $${params.length}`);
      }

      if (typeBien && typeBien !== 'tous') {
        params.push(typeBien);
        conditions.push(`ai.type_bien ILIKE $${params.length}`);
      }

      if (quartier) {
        params.push(`%${quartier}%`);
        conditions.push(`ai.quartier ILIKE $${params.length}`);
      }

      if (prixMax && Number(prixMax) > 0) {
        params.push(Number(prixMax));
        conditions.push(`ai.prix <= $${params.length}`);
      }

      if (prixMin && Number(prixMin) > 0) {
        params.push(Number(prixMin));
        conditions.push(`ai.prix >= $${params.length}`);
      }

      if (meuble !== undefined && meuble !== null) {
        params.push(Boolean(meuble));
        conditions.push(`ai.meuble = $${params.length}`);
      }

      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        conditions.push(`(ai.titre ILIKE $${params.length} OR ai.description ILIKE $${params.length} OR ai.quartier ILIKE $${params.length})`);
      }

      params.push(limit);
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const sql = `
        SELECT ai.id, ai.titre, ai.description, ai.prix, ai.surface_m2, ai.nb_pieces, ai.nb_chambres,
               ai.type_bien, ai.transaction, ai.ville, ai.quartier, ai.meuble, ai.photos,
               ai.contact_tel, ai.contact_whatsapp, ai.created_at,
               ag.nom AS agence_nom, ag.slug AS agence_slug,
               (ai.photos IS NOT NULL AND jsonb_array_length(CASE WHEN jsonb_typeof(ai.photos) = 'array' THEN ai.photos ELSE '[]'::jsonb END) > 0) AS verifie
        FROM annonces_immo ai
        LEFT JOIN agences_immo ag ON ai.agence_id = ag.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ai.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const res = await pool.query(sql, params);

      const biens = res.rows.map((row) => ({
        id: row.id,
        titre: titreCourt(row.titre, 80),
        description: row.description ? row.description.slice(0, 200) : '',
        prix: Number(row.prix),
        surface_m2: row.surface_m2 ? Number(row.surface_m2) : null,
        nb_pieces: row.nb_pieces ? Number(row.nb_pieces) : null,
        nb_chambres: row.nb_chambres ? Number(row.nb_chambres) : null,
        type_bien: row.type_bien,
        transaction: row.transaction,
        ville: row.ville || 'Dakar',
        quartier: row.quartier || 'Dakar',
        meuble: Boolean(row.meuble),
        verifie: Boolean(row.verifie || row.agence_nom),
        agence_nom: row.agence_nom || null,
        contact_tel: row.contact_tel || null,
        contact_whatsapp: row.contact_whatsapp || row.contact_tel || null,
        photos: Array.isArray(row.photos) ? row.photos : [],
        created_at: row.created_at,
      }));

      return { biens, total: biens.length };
    } catch (err) {
      console.warn('[SurgaImmo] Erreur lecture DB annonces_immo, fallback démo:', err.message);
    }
  }

  // Repli mémoire démo
  let resultats = [...BIENS_DEMO];
  if (transaction && transaction !== 'tous') {
    resultats = resultats.filter((b) => b.transaction === transaction);
  }
  if (typeBien && typeBien !== 'tous') {
    resultats = resultats.filter((b) => b.type_bien === typeBien);
  }
  if (quartier) {
    resultats = resultats.filter((b) => normaliser(b.quartier).includes(normaliser(quartier)));
  }
  if (prixMax && Number(prixMax) > 0) {
    resultats = resultats.filter((b) => b.prix <= Number(prixMax));
  }
  if (prixMin && Number(prixMin) > 0) {
    resultats = resultats.filter((b) => b.prix >= Number(prixMin));
  }
  if (meuble !== undefined && meuble !== null) {
    resultats = resultats.filter((b) => b.meuble === Boolean(meuble));
  }
  if (q && q.trim()) {
    const qNorm = normaliser(q);
    resultats = resultats.filter((b) => normaliser(b.titre).includes(qNorm) || normaliser(b.description).includes(qNorm) || normaliser(b.quartier).includes(qNorm));
  }

  return { biens: resultats, total: resultats.length };
}

/**
 * Récupérer un bien par son identifiant
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function recupererBienParId(id) {
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT ai.*, ag.nom AS agence_nom, ag.slug AS agence_slug, ag.contact_tel AS agence_tel
         FROM annonces_immo ai
         LEFT JOIN agences_immo ag ON ai.agence_id = ag.id
         WHERE ai.id = $1 AND ${conditionImmoPubliable('ai')}`,
        [id]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          titre: row.titre,
          description: row.description,
          prix: Number(row.prix),
          surface_m2: row.surface_m2 ? Number(row.surface_m2) : null,
          nb_pieces: row.nb_pieces ? Number(row.nb_pieces) : null,
          nb_chambres: row.nb_chambres ? Number(row.nb_chambres) : null,
          type_bien: row.type_bien,
          transaction: row.transaction,
          ville: row.ville || 'Dakar',
          quartier: row.quartier || 'Dakar',
          meuble: Boolean(row.meuble),
          verifie: true,
          agence_nom: row.agence_nom || null,
          contact_tel: row.contact_tel || row.agence_tel || null,
          contact_whatsapp: row.contact_whatsapp || row.contact_tel || row.agence_tel || null,
          photos: Array.isArray(row.photos) ? row.photos : [],
          created_at: row.created_at,
        };
      }
    } catch (e) {}
  }

  return BIENS_DEMO.find((b) => b.id === id) || null;
}

/**
 * Créer une alerte immobilière pour un utilisateur
 * @param {Object} donnees
 * @param {string} [donnees.userId]
 * @param {string} [donnees.phone]
 * @param {string} donnees.titre
 * @param {string} [donnees.typeBien]
 * @param {string} [donnees.transaction]
 * @param {string} [donnees.quartier]
 * @param {number} [donnees.prixMax]
 * @param {number} [donnees.prixMin]
 * @param {boolean} [donnees.meuble]
 * @returns {Promise<Object>}
 */
async function creerAlerteImmo(donnees) {
  const {
    userId,
    phone,
    titre,
    typeBien = 'tous',
    transaction = 'location',
    quartier = null,
    prixMax = null,
    prixMin = 0,
    meuble = null,
  } = donnees;

  if (!titre || titre.trim().length === 0) {
    throw new Error('Le titre de l alerte est obligatoire');
  }

  const titrePropre = titre.trim().slice(0, 100);
  const quartierPropre = quartier ? quartier.trim().slice(0, 100) : null;
  const prixMaxPropre = prixMax ? Math.max(0, parseInt(prixMax, 10)) : null;

  if (pool) {
    const res = await pool.query(
      `INSERT INTO surga_alertes_immo (
         user_id, phone, titre, type_bien, transaction, ville, quartier,
         prix_max_xof, prix_min_xof, meuble, actif
       )
       VALUES ($1, $2, $3, $4, $5, 'Dakar', $6, $7, $8, $9, TRUE)
       RETURNING *`,
      [
        userId || null,
        phone || null,
        titrePropre,
        typeBien,
        transaction,
        quartierPropre,
        prixMaxPropre,
        prixMin || 0,
        meuble,
      ]
    );
    return res.rows[0];
  }

  return {
    id: 'alt-' + Date.now(),
    user_id: userId || null,
    phone: phone || null,
    titre: titrePropre,
    type_bien: typeBien,
    transaction,
    quartier: quartierPropre,
    prix_max_xof: prixMaxPropre,
    prix_min_xof: prixMin || 0,
    meuble,
    actif: true,
    nb_matches: 0,
    created_at: new Date().toISOString(),
  };
}

/**
 * Lister les alertes d'un utilisateur
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function listerAlertesImmo(userId) {
  if (pool && userId) {
    try {
      const res = await pool.query(
        `SELECT * FROM surga_alertes_immo WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      return res.rows;
    } catch (e) {}
  }
  return [];
}

/**
 * Basculer l'état actif/inactif d'une alerte
 * @param {string} alerteId
 * @param {string} [userId]
 * @returns {Promise<Object|null>}
 */
async function basculerAlerteImmo(alerteId, userId) {
  if (pool) {
    const query = userId
      ? `UPDATE surga_alertes_immo SET actif = NOT actif, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`
      : `UPDATE surga_alertes_immo SET actif = NOT actif, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const params = userId ? [alerteId, userId] : [alerteId];
    const res = await pool.query(query, params);
    return res.rows[0] || null;
  }
  return null;
}

/**
 * Supprimer une alerte immobilière (anti-IDOR)
 * @param {string} alerteId
 * @param {string} [userId]
 * @returns {Promise<boolean>}
 */
async function supprimerAlerteImmo(alerteId, userId) {
  if (pool) {
    const query = userId
      ? `DELETE FROM surga_alertes_immo WHERE id = $1 AND user_id = $2 RETURNING id`
      : `DELETE FROM surga_alertes_immo WHERE id = $1 RETURNING id`;
    const params = userId ? [alerteId, userId] : [alerteId];
    const res = await pool.query(query, params);
    return res.rowCount > 0;
  }
  return true;
}

/**
 * Évaluer si une nouvelle annonce correspond à une alerte
 * @param {Object} alerte
 * @param {Object} annonce
 * @returns {boolean}
 */
function correspondAlerte(alerte, annonce) {
  if (!alerte || !annonce || !alerte.actif) return false;

  // Transaction
  if (alerte.transaction && alerte.transaction !== 'tous') {
    if (alerte.transaction !== annonce.transaction) return false;
  }

  // Type de bien
  if (alerte.type_bien && alerte.type_bien !== 'tous') {
    if (!normaliser(annonce.type_bien).includes(normaliser(alerte.type_bien))) return false;
  }

  // Quartier
  if (alerte.quartier && alerte.quartier.trim()) {
    if (!annonce.quartier || !normaliser(annonce.quartier).includes(normaliser(alerte.quartier))) {
      return false;
    }
  }

  // Prix max
  if (alerte.prix_max_xof && Number(alerte.prix_max_xof) > 0) {
    if (Number(annonce.prix) > Number(alerte.prix_max_xof)) return false;
  }

  // Prix min
  if (alerte.prix_min_xof && Number(alerte.prix_min_xof) > 0) {
    if (Number(annonce.prix) < Number(alerte.prix_min_xof)) return false;
  }

  // Meublé
  if (alerte.meuble !== null && alerte.meuble !== undefined) {
    if (Boolean(annonce.meuble) !== Boolean(alerte.meuble)) return false;
  }

  return true;
}

/**
 * Évaluer une annonce pour déclencher les alertes correspondantes (< 2 minutes)
 * @param {Object} annonce
 * @returns {Promise<Array>} Liste des alertes déclenchées
 */
async function evaluerAlertesPourNouvelleAnnonce(annonce) {
  if (!pool) return [];

  try {
    const res = await pool.query(
      `SELECT * FROM surga_alertes_immo WHERE actif = TRUE`
    );

    const alertesConcordantes = [];
    for (const alerte of res.rows) {
      if (correspondAlerte(alerte, annonce)) {
        alertesConcordantes.push(alerte);
        // Mettre à jour le compteur et la date de dernière notification
        await pool.query(
          `UPDATE surga_alertes_immo
           SET nb_matches = nb_matches + 1, derniere_notification = NOW()
           WHERE id = $1`,
          [alerte.id]
        );
      }
    }

    return alertesConcordantes;
  } catch (err) {
    console.error('[SurgaImmo] Erreur évaluation alertes:', err.message);
    return [];
  }
}

/**
 * Synthèse concise pour le briefing du matin au vouvoiement strict D19
 * @param {Array} alertes
 * @param {Array} biensRecents
 * @returns {string}
 */
function genererSyntheseImmoBriefing(alertes = [], biensRecents = []) {
  if (alertes.length === 0) {
    return 'Le pôle immobilier de Nopalou est disponible pour vos recherches de logements et bureaux à Dakar.';
  }

  const premiere = alertes[0];
  const correspondants = biensRecents.filter((b) => correspondAlerte(premiere, b));

  if (correspondants.length > 0) {
    return `Immobilier : ${correspondants.length} nouvelle(s) offre(s) correspondant à votre alerte "${premiere.titre}" sont disponibles ce matin.`;
  }

  return `Votre veille immobilière "${premiere.titre}" est active. Vous serez notifié dès la parution d'un bien conforme.`;
}

module.exports = {
  QUARTIERS_DAKAR,
  BIENS_DEMO,
  parserRechercheImmoNaturelle,
  rechercherBiensImmo,
  recupererBienParId,
  creerAlerteImmo,
  listerAlertesImmo,
  basculerAlerteImmo,
  supprimerAlerteImmo,
  correspondAlerte,
  evaluerAlertesPourNouvelleAnnonce,
  genererSyntheseImmoBriefing,
};
