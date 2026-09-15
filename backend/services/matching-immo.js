// backend/services/matching-immo.js
// Moteur intelligent de matching prospect <-> bien immobilier

const { pool } = require('../models/db');

/**
 * Calcule les raisons détaillées du score de matching entre un prospect et un bien
 */
function expliquerMatch(prospect, bien) {
  const raisons = [];
  
  // Opération
  if (prospect.type_operation === 'location' && bien.prix_location) {
    raisons.push('Type opération compatible (Location)');
  } else if (prospect.type_operation === 'vente' && bien.prix_vente) {
    raisons.push('Type opération compatible (Vente/Achat)');
  }

  // Budget
  const prix = prospect.type_operation === 'vente' ? Number(bien.prix_vente) : Number(bien.prix_location);
  if (prix && (!prospect.budget_max || prix <= Number(prospect.budget_max))) {
    if (!prospect.budget_min || prix >= Number(prospect.budget_min)) {
      raisons.push(`Budget parfaitement aligné (${prix.toLocaleString('fr-FR')} FCFA)`);
    } else {
      raisons.push(`Prix inférieur au budget max`);
    }
  }

  // Ville
  if (prospect.villes_souhaitees && Array.isArray(prospect.villes_souhaitees) && prospect.villes_souhaitees.length > 0) {
    if (prospect.villes_souhaitees.some(v => v && v.toLowerCase() === (bien.ville || '').toLowerCase())) {
      raisons.push(`Ville correspondante : ${bien.ville}`);
    }
  }

  // Quartier
  if (prospect.quartiers_souhaites && Array.isArray(prospect.quartiers_souhaites) && prospect.quartiers_souhaites.length > 0) {
    if (prospect.quartiers_souhaites.some(q => q && bien.quartier && bien.quartier.toLowerCase().includes(q.toLowerCase()))) {
      raisons.push(`Secteur / Quartier ciblé : ${bien.quartier}`);
    }
  }

  // Type de bien
  if (prospect.type_bien_souhaite && bien.type_bien) {
    if (prospect.type_bien_souhaite.toLowerCase() === bien.type_bien.toLowerCase()) {
      raisons.push(`Type de bien exact (${bien.type_bien})`);
    }
  }

  // Chambres
  if (prospect.nb_chambres_min && bien.nb_chambres >= prospect.nb_chambres_min) {
    raisons.push(`${bien.nb_chambres} chambres (min. ${prospect.nb_chambres_min} demandé)`);
  }

  // Meublé
  if (prospect.meuble_souhaite !== null && prospect.meuble_souhaite !== undefined) {
    if (prospect.meuble_souhaite === bien.meuble) {
      raisons.push(bien.meuble ? 'Bien meublé' : 'Non meublé');
    }
  }

  return raisons;
}

/**
 * Trouve les biens disponibles correspondants aux critères d'un prospect
 * @param {string} prospectId - UUID du prospect
 * @param {string} agenceId - UUID de l'agence
 * @param {number} limit - Nombre maximum de résultats
 */
async function trouverBiensPourProspect(prospectId, agenceId, limit = 10) {
  try {
    const { rows: prospectRows } = await pool.query(
      `SELECT * FROM contacts_immo WHERE id = $1 AND agence_id = $2`,
      [prospectId, agenceId]
    );

    if (!prospectRows[0]) return [];
    const prospect = prospectRows[0];

    const budgetMin = Number(prospect.budget_min) || 0;
    const budgetMax = Number(prospect.budget_max) || 999999999;
    const isVente = prospect.type_operation === 'vente';
    const villes = Array.isArray(prospect.villes_souhaitees) && prospect.villes_souhaitees.length > 0
      ? prospect.villes_souhaitees
      : ['Dakar'];

    const { rows: biens } = await pool.query(
      `
      SELECT b.*,
        (
          -- Score Budget (Max 35 pts)
          CASE 
            WHEN ${isVente ? 'b.prix_vente' : 'b.prix_location'} BETWEEN $3 AND $4 THEN 35
            WHEN ${isVente ? 'b.prix_vente' : 'b.prix_location'} <= $4 * 1.15 THEN 20
            ELSE 5
          END
          -- Score Type de bien (Max 25 pts)
          + CASE 
              WHEN $5::text IS NULL OR LOWER(b.type_bien) = LOWER($5::text) THEN 25
              ELSE 0
            END
          -- Score Ville (Max 20 pts)
          + CASE 
              WHEN b.ville = ANY($6::text[]) THEN 20
              ELSE 0
            END
          -- Score Chambres (Max 10 pts)
          + CASE 
              WHEN $7::int IS NULL OR b.nb_chambres >= $7::int THEN 10
              ELSE 0
            END
          -- Score Meublé (Max 10 pts)
          + CASE 
              WHEN $8::boolean IS NULL OR b.meuble = $8::boolean THEN 10
              ELSE 0
            END
        ) AS score_matching
      FROM biens_immo b
      WHERE b.agence_id = $1
        AND b.statut = 'actif'
        AND b.statut_occupation = 'disponible'
        AND (${isVente ? 'b.prix_vente IS NOT NULL' : 'b.prix_location IS NOT NULL'})
      ORDER BY score_matching DESC, b.created_at DESC
      LIMIT $2
      `,
      [
        agenceId,
        limit,
        budgetMin,
        budgetMax,
        prospect.type_bien_souhaite || null,
        villes,
        prospect.nb_chambres_min || null,
        prospect.meuble_souhaite !== null ? prospect.meuble_souhaite : null
      ]
    );

    return biens.map(b => ({
      ...b,
      score_matching: Math.min(100, Math.max(0, Number(b.score_matching) || 0)),
      raisons: expliquerMatch(prospect, b)
    }));
  } catch (err) {
    console.error('[MATCHING_IMMO_ERR] trouverBiensPourProspect:', err.message);
    return [];
  }
}

/**
 * Trouve les prospects intéressés par un bien spécifique
 * @param {string} bienId - UUID du bien
 * @param {string} agenceId - UUID de l'agence
 * @param {number} limit - Nombre maximum de résultats
 */
async function trouverProspectsPourBien(bienId, agenceId, limit = 10) {
  try {
    const { rows: bienRows } = await pool.query(
      `SELECT * FROM biens_immo WHERE id = $1 AND agence_id = $2`,
      [bienId, agenceId]
    );

    if (!bienRows[0]) return [];
    const bien = bienRows[0];

    const prix = Number(bien.prix_location || bien.prix_vente || 0);
    const isVente = !bien.prix_location && !!bien.prix_vente;

    const { rows: prospects } = await pool.query(
      `
      SELECT c.*,
        (
          -- Score Budget (Max 35 pts)
          CASE 
            WHEN (c.budget_min IS NULL OR c.budget_min <= $3) 
             AND (c.budget_max IS NULL OR c.budget_max >= $3) THEN 35
            WHEN c.budget_max IS NOT NULL AND c.budget_max * 1.15 >= $3 THEN 20
            ELSE 5
          END
          -- Score Type de bien (Max 25 pts)
          + CASE 
              WHEN c.type_bien_souhaite IS NULL OR LOWER(c.type_bien_souhaite) = LOWER($4) THEN 25
              ELSE 0
            END
          -- Score Ville (Max 20 pts)
          + CASE 
              WHEN c.villes_souhaitees IS NULL OR $5 = ANY(ARRAY(SELECT jsonb_array_elements_text(c.villes_souhaitees))) THEN 20
              ELSE 0
            END
          -- Score Chambres (Max 10 pts)
          + CASE 
              WHEN c.nb_chambres_min IS NULL OR $6 >= c.nb_chambres_min THEN 10
              ELSE 0
            END
          -- Score Meublé (Max 10 pts)
          + CASE 
              WHEN c.meuble_souhaite IS NULL OR c.meuble_souhaite = $7 THEN 10
              ELSE 0
            END
        ) AS score_matching
      FROM contacts_immo c
      WHERE c.agence_id = $1
        AND c.type_contact = 'prospect'
        AND c.statut_crm NOT IN ('gagne', 'perdu')
        AND (c.type_operation IS NULL OR c.type_operation = $8)
      ORDER BY score_matching DESC, c.created_at DESC
      LIMIT $2
      `,
      [
        agenceId,
        limit,
        prix,
        bien.type_bien || '',
        bien.ville || 'Dakar',
        bien.nb_chambres || 1,
        !!bien.meuble,
        isVente ? 'vente' : 'location'
      ]
    );

    return prospects.map(p => ({
      ...p,
      score_matching: Math.min(100, Math.max(0, Number(p.score_matching) || 0)),
      raisons: expliquerMatch(p, bien)
    }));
  } catch (err) {
    console.error('[MATCHING_IMMO_ERR] trouverProspectsPourBien:', err.message);
    return [];
  }
}

module.exports = {
  trouverBiensPourProspect,
  trouverProspectsPourBien,
  expliquerMatch
};
