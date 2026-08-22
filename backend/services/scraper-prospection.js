// backend/services/scraper-prospection.js — Moteur de scraping et sourcing continu pour Dakar & Sénégal
const { pool } = require('../models/db');
const { normaliserTelephoneSenegal } = require('./prospection');
let estDesinscrit;
try {
  const ws = require('./whatsapp');
  estDesinscrit = ws.estDesinscrit;
} catch (e) {
  estDesinscrit = async () => false;
}

// Données d'annuaires et marchands cibles par quartiers de Dakar
const DIRECTOIRE_MARCHES_DAKAR = [
  { zone: 'Sandaga', categorie: 'telephonie', motsCles: ['Phone', 'Tech', 'GSM', 'Mobile', 'Accessoires'] },
  { zone: 'HLM', categorie: 'mode', motsCles: ['Tissus', 'Bazin', 'Couture', 'Prêt-à-Porter', 'Voile', 'Robes'] },
  { zone: 'Colobane', categorie: 'tech', motsCles: ['Électronique', 'PC', 'Télévision', 'Occasion', 'Réparation'] },
  { zone: 'Maristes', categorie: 'alimentation', motsCles: ['Supérette', 'Épicerie', 'Bio', 'Traiteur', 'Boulangerie'] },
  { zone: 'Plateau', categorie: 'mode', motsCles: ['Boutique Chic', 'Chaussures', 'Costumes', 'Parfumerie', 'Maroquinerie'] },
  { zone: 'Centenaire', categorie: 'grossiste', motsCles: ['Arrivages Chine', 'Import Export', 'Bazar', 'Grossiste Shein'] },
  { zone: 'Tilène', categorie: 'cosmetique', motsCles: ['Beauté', 'Cosmétique', 'Mèches', 'Perruques', 'Soins'] },
  { zone: 'Thiès', categorie: 'mixte', motsCles: ['Commerce Général', 'Mode Thiès', 'Tech Thiès'] },
  { zone: 'Touba', categorie: 'mixte', motsCles: ['Boutique Touba', 'Quincaillerie', 'Alimentation'] },
];

/**
 * Lance une session de prospection / scraping par zone et catégorie
 */
async function lancerScrapingProspection(options = {}) {
  const { zone = 'all', categorie = 'all', limite = 50 } = options;
  let ajoutes = 0;
  let ignores = 0;
  let totalTraites = 0;

  try {
    const isAll = !zone || zone === 'all' || zone === 'Tout Dakar & Régions';
    const limitNum = Math.max(1, Math.min(500, parseInt(limite, 10) || 50));

    // ── 1. Sourcing depuis les annonces classifiées ─────────────────────────────
    let qAnnonces = `
      SELECT DISTINCT contact_tel AS telephone, contact_nom AS nom_vendeur, ville, quartier, categorie_slug AS categorie, titre
      FROM annonces_classifiees
      WHERE contact_tel IS NOT NULL 
        AND contact_tel <> ''
        AND contact_tel <> 'Voir sur Facebook'
        AND (supprimee IS NULL OR supprimee = false)
    `;
    const paramsAnnonces = [];

    if (!isAll) {
      paramsAnnonces.push(zone);
      qAnnonces += ` AND (quartier ILIKE '%' || $${paramsAnnonces.length} || '%' OR ville ILIKE '%' || $${paramsAnnonces.length} || '%' OR titre ILIKE '%' || $${paramsAnnonces.length} || '%')`;
    }

    paramsAnnonces.push(limitNum);
    qAnnonces += ` ORDER BY contact_tel LIMIT $${paramsAnnonces.length}`;

    const resAnnonces = await pool.query(qAnnonces, paramsAnnonces);
    totalTraites += resAnnonces.rows.length;

    for (const row of resAnnonces.rows) {
      const norm = normaliserTelephoneSenegal(row.telephone);
      if (!norm.valide) {
        ignores++;
        continue;
      }

      if (estDesinscrit && (await estDesinscrit(norm.national))) {
        ignores++;
        continue;
      }

      const nomBq = row.nom_vendeur || row.titre?.slice(0, 40) || `Vendeur ${row.quartier || 'Dakar'}`;
      const cat = row.categorie || categorie || 'commerce';
      const quart = row.quartier || row.ville || 'Dakar';

      const ins = await pool.query(
        `INSERT INTO prospection_leads (
          nom_boutique, contact_nom, telephone, telephone_brut, operateur, categorie, ville, quartier, source, statut, score
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Dakar', $7, 'scraper_auto', 'nouveau', 65)
        ON CONFLICT (telephone) DO NOTHING
        RETURNING id`,
        [nomBq, row.nom_vendeur || 'Responsable', norm.national, norm.brut, norm.operateur, cat, quart]
      );

      if (ins.rows.length > 0) {
        ajoutes++;
      } else {
        ignores++;
      }
    }

    // ── 2. Sourcing complémentaire depuis les annonces immobilières ────────────
    if (ajoutes < limitNum) {
      let qImmo = `
        SELECT DISTINCT contact_tel AS telephone, contact_nom AS nom_vendeur, ville, quartier, 'immo' AS categorie, titre
        FROM annonces_immo
        WHERE contact_tel IS NOT NULL 
          AND contact_tel <> ''
          AND contact_tel <> 'Voir sur Facebook'
          AND (supprimee IS NULL OR supprimee = false)
      `;
      const paramsImmo = [];

      if (!isAll) {
        paramsImmo.push(zone);
        qImmo += ` AND (quartier ILIKE '%' || $${paramsImmo.length} || '%' OR ville ILIKE '%' || $${paramsImmo.length} || '%' OR titre ILIKE '%' || $${paramsImmo.length} || '%')`;
      }

      const restant = limitNum - ajoutes;
      paramsImmo.push(restant);
      qImmo += ` ORDER BY contact_tel LIMIT $${paramsImmo.length}`;

      const resImmo = await pool.query(qImmo, paramsImmo);
      totalTraites += resImmo.rows.length;

      for (const row of resImmo.rows) {
        const norm = normaliserTelephoneSenegal(row.telephone);
        if (!norm.valide) {
          ignores++;
          continue;
        }

        if (estDesinscrit && (await estDesinscrit(norm.national))) {
          ignores++;
          continue;
        }

        const nomBq = row.nom_vendeur || `Agence Immo ${row.quartier || 'Dakar'}`;
        const quart = row.quartier || row.ville || 'Dakar';

        const ins = await pool.query(
          `INSERT INTO prospection_leads (
            nom_boutique, contact_nom, telephone, telephone_brut, operateur, categorie, ville, quartier, source, statut, score
          ) VALUES ($1, $2, $3, $4, $5, 'immo', 'Dakar', $6, 'scraper_immo', 'nouveau', 70)
          ON CONFLICT (telephone) DO NOTHING
          RETURNING id`,
          [nomBq, row.nom_vendeur || 'Responsable', norm.national, norm.brut, norm.operateur, quart]
        );

        if (ins.rows.length > 0) {
          ajoutes++;
        } else {
          ignores++;
        }
      }
    }

    return {
      succes: true,
      ajoutes,
      ignores,
      totalScrapes: totalTraites,
      zone: isAll ? 'Tout Dakar & Régions' : zone,
      categorie,
    };
  } catch (err) {
    console.error('[SCRAPER PROSPECTION ERR]:', err.message);
    return {
      succes: false,
      error: err.message,
      ajoutes: 0,
      ignores: 0,
      totalScrapes: 0,
      zone: zone || 'Dakar',
    };
  }
}

module.exports = {
  lancerScrapingProspection,
  DIRECTOIRE_MARCHES_DAKAR,
};
