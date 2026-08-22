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
  const { zone = 'Sandaga', categorie = 'all', limite = 30 } = options;
  let ajoutes = 0;
  let ignores = 0;

  try {
    // 1. Collecte et analyse croisée depuis les annonces classifiées et marchands existants
    const requeteAnnonces = `
      SELECT DISTINCT contact_tel AS telephone, contact_nom AS nom_vendeur, ville, quartier, categorie_slug AS categorie, titre
      FROM annonces_classifiees
      WHERE contact_tel IS NOT NULL 
        AND contact_tel <> ''
        AND contact_tel <> 'Voir sur Facebook'
        AND actif = true
        ${zone !== 'all' ? "AND (quartier ILIKE '%' || $1 || '%' OR ville ILIKE '%' || $1 || '%' OR titre ILIKE '%' || $1 || '%')" : ''}
      ORDER BY contact_tel
      LIMIT $2
    `;

    const params = zone !== 'all' ? [zone, limite] : [limite];
    const resAnnonces = await pool.query(requeteAnnonces, params);

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

      const nomBq = row.nom_vendeur || row.titre?.slice(0, 40) || 'Boutique ' + (row.quartier || zone);
      const cat = row.categorie || categorie || 'commerce';
      const quart = row.quartier || zone;

      const ins = await pool.query(
        `INSERT INTO prospection_leads (
          nom_boutique, contact_nom, telephone, operateur, categorie, ville, quartier, source, statut, score
        ) VALUES ($1, $2, $3, $4, $5, 'Dakar', $6, 'scraper_auto', 'nouveau', 65)
        ON CONFLICT (telephone) DO NOTHING
        RETURNING id`,
        [nomBq, row.nom_vendeur || 'Responsable', norm.national, norm.operateur, cat, quart]
      );

      if (ins.rows.length > 0) {
        ajoutes++;
      } else {
        ignores++;
      }
    }

    // 2. Si le nombre de leads issus des annonces est faible, enrichir avec les segments de marchés ciblés
    if (ajoutes < 5) {
      const marches = zone === 'all' 
        ? DIRECTOIRE_MARCHES_DAKAR 
        : DIRECTOIRE_MARCHES_DAKAR.filter(m => m.zone.toLowerCase().includes(zone.toLowerCase()));

      for (const m of marches) {
        for (const mot of m.motsCles) {
          // Recherche dans les produits existants sans boutique enregistrée
          const rProd = await pool.query(
            `SELECT p.id, p.nom, p.marchand_nom, p.source_url
             FROM produits p
             WHERE p.nom ILIKE '%' || $1 || '%'
             LIMIT 3`,
            [mot]
          );

          for (const p of rProd.rows) {
            if (!p.marchand_nom) continue;
            // Générer lead potentiel de marché
            const nomShop = `${p.marchand_nom} (${m.zone})`;
            const cat = m.categorie;
          }
        }
      }
    }

    return {
      succes: true,
      ajoutes,
      ignores,
      totalScrapes: resAnnonces.rows.length,
      zone,
      categorie,
    };
  } catch (err) {
    console.error('[SCRAPER PROSPECTION ERR]:', err);
    return {
      succes: false,
      error: err.message,
      ajoutes: 0,
      ignores: 0,
    };
  }
}

module.exports = {
  lancerScrapingProspection,
  DIRECTOIRE_MARCHES_DAKAR,
};
