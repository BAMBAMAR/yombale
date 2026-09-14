// backend/routes/boutiques-modules/boutiques-abtest.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');

async function assurerTablesAbTest() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_ab_tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        boutique_id UUID NOT NULL,
        titre VARCHAR(255) NOT NULL,
        actif BOOLEAN DEFAULT true,
        repartition INTEGER DEFAULT 50,
        variante_a JSONB NOT NULL,
        variante_b JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS boutique_ab_test_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        boutique_id UUID NOT NULL,
        variante VARCHAR(10) NOT NULL,
        type_evenement VARCHAR(50) NOT NULL,
        session_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (_) {}
}

router.get('/:id/ab-test', param('id').isUUID(), async (req, res) => {
  try {
    const { id } = req.params;
    await assurerTablesAbTest();
    const { rows } = await pool.query(
      `SELECT * FROM boutique_ab_tests WHERE boutique_id = $1 AND actif = true ORDER BY created_at DESC LIMIT 1`,
      [id]
    );

    if (!rows || !rows[0]) {
      return res.json({ success: true, actif: false, test: null });
    }

    res.json({ success: true, actif: true, test: rows[0] });
  } catch (err) {
    console.error('[AB TEST GET ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du test A/B' });
  }
});

// POST /api/boutiques/:id/ab-test — Créer ou modifier le test A/B (Authentifié Propriétaire)
router.post(
  '/:id/ab-test',
  verifierToken,
  param('id').isUUID(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const bAccess = await checkBoutiqueAccess(id, req.user.userId);
      if (!bAccess && !req.user?.is_admin) {
        return res.status(403).json({ success: false, error: 'Accès refusé' });
      }

      await assurerTablesAbTest();
      const { titre, actif = true, repartition = 50, variante_a, variante_b } = req.body;

      if (!titre || !variante_a || !variante_b) {
        return res.status(400).json({ success: false, error: 'Titre, variante A et variante B obligatoires.' });
      }

      // Désactiver les anciens tests
      await pool.query(`UPDATE boutique_ab_tests SET actif = false WHERE boutique_id = $1`, [id]);

      const { rows } = await pool.query(
        `INSERT INTO boutique_ab_tests (boutique_id, titre, actif, repartition, variante_a, variante_b)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, titre, actif, repartition, JSON.stringify(variante_a), JSON.stringify(variante_b)]
      );

      res.status(201).json({ success: true, test: rows[0] });
    } catch (err) {
      console.error('[AB TEST POST ERR]', err);
      res.status(500).json({ success: false, error: 'Erreur lors de la configuration du test A/B' });
    }
  }
);

// POST /api/boutiques/:id/ab-test/event — Logger une impression ou conversion (Public)
router.post(
  '/:id/ab-test/event',
  param('id').isUUID(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { variante, type_evenement, session_id } = req.body;

      if (!['A', 'B'].includes(variante) || !type_evenement) {
        return res.status(400).json({ success: false, error: 'Variante (A/B) et type d\'événement obligatoires.' });
      }

      await assurerTablesAbTest();
      await pool.query(
        `INSERT INTO boutique_ab_test_events (boutique_id, variante, type_evenement, session_id)
         VALUES ($1, $2, $3, $4)`,
        [id, variante, type_evenement, session_id || null]
      );

      res.json({ success: true, enregistre: true });
    } catch (err) {
      console.error('[AB TEST EVENT ERR]', err);
      res.status(500).json({ success: false, error: 'Erreur lors du suivi de l\'événement A/B' });
    }
  }
);

// GET /api/boutiques/:id/ab-test/results — Synthèse statistique des conversions (Authentifié Propriétaire)
router.get(
  '/:id/ab-test/results',
  verifierToken,
  param('id').isUUID(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const bAccess = await checkBoutiqueAccess(id, req.user.userId);
      if (!bAccess && !req.user?.is_admin) {
        return res.status(403).json({ success: false, error: 'Accès refusé' });
      }

      await assurerTablesAbTest();
      const { rows } = await pool.query(
        `SELECT variante, type_evenement, COUNT(*) as total
         FROM boutique_ab_test_events
         WHERE boutique_id = $1
         GROUP BY variante, type_evenement`,
        [id]
      );

      let visitesA = 0, conversionsA = 0;
      let visitesB = 0, conversionsB = 0;

      (rows || []).forEach(r => {
        const c = parseInt(r.total || 0, 10);
        if (r.variante === 'A') {
          if (r.type_evenement === 'visite') visitesA += c;
          else conversionsA += c;
        } else if (r.variante === 'B') {
          if (r.type_evenement === 'visite') visitesB += c;
          else conversionsB += c;
        }
      });

      const tauxA = visitesA > 0 ? Number(((conversionsA / visitesA) * 100).toFixed(2)) : 0;
      const tauxB = visitesB > 0 ? Number(((conversionsB / visitesB) * 100).toFixed(2)) : 0;

      let gagnant = 'en_cours';
      if (visitesA >= 30 && visitesB >= 30) {
        if (tauxB > tauxA + 2) gagnant = 'B';
        else if (tauxA > tauxB + 2) gagnant = 'A';
      }

      res.json({
        success: true,
        resultats: {
          variante_a: { visites: visitesA, conversions: conversionsA, taux_conversion: tauxA },
          variante_b: { visites: visitesB, conversions: conversionsB, taux_conversion: tauxB },
          gagnant,
          statistiquement_significatif: visitesA >= 30 && visitesB >= 30
        }
      });
    } catch (err) {
      console.error('[AB TEST RESULTS ERR]', err);
      res.status(500).json({ success: false, error: 'Erreur lors du calcul des résultats A/B' });
    }
  }
);

module.exports = router;




module.exports = router;
