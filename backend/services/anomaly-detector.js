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
    const quarantines = [];

    // Étape 1 : Détecter les offres s'écartant de la médiane du produit (outliers)
    const medianOutliers = await pool.query(`
      WITH stats_produit AS (
        SELECT produit_id,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY prix) as mediane,
               COUNT(*) as nb_offres
        FROM offres
        WHERE stock = true AND quarantinee = false
        GROUP BY produit_id
        HAVING COUNT(*) >= 2
      )
      SELECT o.id, o.produit_id, p.nom as prod_nom, o.prix, sp.mediane
      FROM offres o
      JOIN stats_produit sp ON sp.produit_id = o.produit_id
      JOIN produits p ON p.id = o.produit_id
      WHERE o.stock = true AND o.quarantinee = false
        AND (o.prix < sp.mediane * 0.35 OR o.prix > sp.mediane * 3.0)
    `);

    for (const r of medianOutliers.rows) {
      quarantines.push({
        id: r.id,
        produit: r.prod_nom,
        produit_id: r.produit_id,
        raison: `ecart_mediane_produit_${Math.round(r.mediane)}`,
        prix: r.prix,
        prix_moyen_30j: r.mediane
      });
    }

    // Étape 2 : Récupérer toutes les offres + stats 30j pour variation historique et prix 0
    const res = await pool.query(`
      SELECT
        o.id,
        o.produit_id,
        o.prix,
        p.categorie_id,
        c.slug as cat_slug,
        p.nom as prod_nom,
        COALESCE(
          (SELECT AVG(prix) FROM historique_prix WHERE offre_id = o.id AND date > NOW() - INTERVAL '30 days'),
          o.prix
        ) as prix_moyen_30j
      FROM offres o
      JOIN produits p ON p.id = o.produit_id
      LEFT JOIN categories c ON c.id = p.categorie_id
      WHERE o.stock = true AND o.quarantinee = false
      ORDER BY o.scraped_at DESC
      LIMIT 50000
    `);

    const dejaQuarantines = new Set(quarantines.map(q => q.id));

    for (const offre of res.rows) {
      if (dejaQuarantines.has(offre.id)) continue;
      const {id, produit_id, prix, prod_nom, cat_slug, prix_moyen_30j} = offre;

      let raison = null;

      // 1. Prix 0 ou négatif
      if (!prix || prix <= 0) {
        raison = 'prix_zero_ou_negatif';
      }
      // 2. Dépassement plafond de catégorie
      else if (cat_slug && PRICE_MAX_BY_CATEGORY[cat_slug] && prix > PRICE_MAX_BY_CATEGORY[cat_slug]) {
        raison = `depassement_plafond_${cat_slug}`;
      }
      // 3. Variation > 50% vs historique 30j
      else if (prix_moyen_30j) {
        const variation = Math.abs(prix - prix_moyen_30j) / prix_moyen_30j;
        if (variation > VARIATION_THRESHOLD) {
          raison = `variation_${Math.round(variation * 100)}pct`;
        }
      }

      if (raison) {
        quarantines.push({id, produit_id, produit: prod_nom, raison, prix, prix_moyen_30j});
      }
    }

    // Étape 3 : Mettre à jour colonne quarantinee et recalculer prix_min des produits
    if (quarantines.length > 0) {
      const offre_ids = quarantines.map(q => q.id);
      const produit_ids = [...new Set(quarantines.map(q => q.produit_id).filter(Boolean))];

      await pool.query(
        `UPDATE offres SET quarantinee = true WHERE id = ANY($1)`,
        [offre_ids]
      );

      // Enregistrer dans historique
      for (const q of quarantines) {
        try {
          await pool.query(
            `INSERT INTO quarantines_log (offre_id, raison, prix, prix_moyen_30j) VALUES ($1, $2, $3, $4)`,
            [q.id, q.raison, q.prix, q.prix_moyen_30j]
          );
        } catch {}
      }

      // Recalculer prix_min et nb_offres sur les produits touchés
      if (produit_ids.length > 0) {
        await pool.query(`
          UPDATE produits p
          SET prix_min = sub.prix_min,
              nb_offres = sub.nb_offres
          FROM (
            SELECT p2.id,
                   MIN(CASE WHEN o.stock = true AND o.quarantinee = false THEN o.prix END) as prix_min,
                   COUNT(CASE WHEN o.stock = true AND o.quarantinee = false THEN o.id END) as nb_offres
            FROM produits p2
            LEFT JOIN offres o ON o.produit_id = p2.id
            WHERE p2.id = ANY($1::uuid[])
            GROUP BY p2.id
          ) sub
          WHERE p.id = sub.id
        `, [produit_ids]);
      }

      console.log(`[ANOMALY] ⚠️  ${quarantines.length} offres quarantinées (produits màj: ${produit_ids.length})`);
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
