// backend/services/anomaly-detector.js
// Service de détection d'anomalies — quarantine automatique des offres suspectes
// Cron appelé quotidiennement, ex: 1h du matin UTC
// Logique : si variation > 50% vs prix_moyen_30j OU si prix = 0 OU si prix > seuil max => quarantine

const { pool } = require('../models/db');

const VARIATION_THRESHOLD = 0.5; // 50%
const PRICE_MAX_BY_CATEGORY = {
  'smartphones': 2000000,  // 2M FCFA max pour un téléphone
  'informatique': 5000000, // 5M FCFA
  'tv-electro': 10000000,  // 10M FCFA
  'auto-moto': 100000000,  // 100M FCFA
  'maison': 50000000,       // 50M FCFA
};

async function detecterAnomalies() {
  const startTime = Date.now();
  console.log('[ANOMALY] 🔍 Démarrage détection anomalies...');

  try {
    // Étape 1 : Récupérer toutes les offres + stats 30j
    const res = await pool.query(`
      SELECT
        o.id,
        o.prix,
        p.categorie_id,
        p.nom as prod_nom,
        COALESCE(
          (SELECT AVG(prix) FROM historique_prix WHERE offre_id = o.id AND date > NOW() - INTERVAL '30 days'),
          o.prix
        ) as prix_moyen_30j
      FROM offres o
      JOIN produits p ON p.id = o.produit_id
      WHERE o.stock = true
      AND NOT EXISTS (SELECT 1 FROM offres oo WHERE oo.id = o.id AND oo.quarantinee = true)
      ORDER BY o.scraped_at DESC
      LIMIT 50000
    `);

    const offres = res.rows;
    const quarantines = [];

    for (const offre of offres) {
      const {id, prix, prod_nom, prix_moyen_30j} = offre;

      // Vérifications
      let raison = null;

      // 1. Prix 0 ou négatif
      if (!prix || prix <= 0) {
        raison = 'prix_zero_ou_negatif';
      }
      // 2. Variation > 50%
      else if (prix_moyen_30j) {
        const variation = Math.abs(prix - prix_moyen_30j) / prix_moyen_30j;
        if (variation > VARIATION_THRESHOLD) {
          raison = `variation_${Math.round(variation * 100)}pct`;
        }
      }

      if (raison) {
        quarantines.push({id, produit: prod_nom, raison, prix, prix_moyen_30j});
      }
    }

    // Étape 2 : Mettre à jour colonne quarantinee
    if (quarantines.length > 0) {
      const offre_ids = quarantines.map(q => q.id);
      await pool.query(
        `UPDATE offres SET quarantinee = true WHERE id = ANY($1)`,
        [offre_ids]
      );

      // Enregistrer dans historique
      for (const q of quarantines) {
        await pool.query(
          `INSERT INTO quarantines_log (offre_id, raison, prix, prix_moyen_30j) VALUES ($1, $2, $3, $4)`,
          [q.id, q.raison, q.prix, q.prix_moyen_30j]
        );
      }

      console.log(`[ANOMALY] ⚠️  ${quarantines.length} offres quarantinées`);
    } else {
      console.log('[ANOMALY] ✅ Aucune anomalie détectée');
    }

    const elapsed = Date.now() - startTime;
    console.log(`[ANOMALY] ✅ Détection complète en ${elapsed}ms`);
  } catch (err) {
    console.error('[ANOMALY] ❌', err.message);
  }
}

module.exports = { detecterAnomalies };
