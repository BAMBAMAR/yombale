// backend/routes/affiliates.js
// Affiliate tracking API — clics, conversions, postbacks
// Endpoints : GET /api/affiliates/clicks, POST /api/affiliates/track

const express = require('express');
const { pool } = require('../models/db');
const { sendAwinPostback } = require('../services/awin-postback');
const { adminSecretOnly } = require('../middlewares/auth');

const router = express.Router();

// GET /api/affiliates/clicks — liste des clics affiliés (admin)
router.get('/clicks', adminSecretOnly, async (req, res) => {
  try {
    const range = req.query.range || '24h';
    const interval =
      range === '7d' ? '7 days' : range === '30d' ? '30 days' : '1 day';

    const result = await pool.query(`
      SELECT
        id,
        click_ref,
        apporteur_code,
        geo,
        device,
        ip_hash,
        converted,
        created_at,
        converted_at
      FROM affiliate_clicks
      WHERE created_at > NOW() - INTERVAL '${interval}'
      ORDER BY created_at DESC
      LIMIT 1000
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('[affiliates/clicks]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affiliates/track — enregistrer un clic affilié (public)
router.post('/track', async (req, res) => {
  try {
    const {
      click_ref,
      aff_id, // code apporteur
      geo,
      device,
      ip_hash,
    } = req.body;

    if (!click_ref) {
      return res.status(400).json({ error: 'click_ref manquant' });
    }

    // Récupérer l'apporteur par code
    let apporteur = null;
    if (aff_id) {
      const aRes = await pool.query(
        'SELECT id, code_apporteur FROM utilisateurs WHERE code_apporteur = $1 AND est_apporteur = true',
        [aff_id]
      );
      apporteur = aRes.rows[0] || null;
    }

    const result = await pool.query(`
      INSERT INTO affiliate_clicks (click_ref, apporteur_id, apporteur_code, geo, device, ip_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, click_ref, created_at
    `, [click_ref, apporteur?.id || null, aff_id || null, geo || 'SN', device || 'web', ip_hash]);

    res.status(201).json({ success: true, click: result.rows[0] });
  } catch (err) {
    console.error('[affiliates/track]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/affiliates/:click_ref/convert — marquer une conversion (admin/interne uniquement)
router.post('/:click_ref/convert', adminSecretOnly, async (req, res) => {
  try {
    const { click_ref } = req.params;
    const { boutique_id, abonnement_id, commission_montant } = req.body;

    // Mettre à jour le clic
    const result = await pool.query(`
      UPDATE affiliate_clicks
      SET converted = true, converted_at = NOW()
      WHERE click_ref = $1
      RETURNING *
    `, [click_ref]);

    const click = result.rows[0];
    if (!click) {
      return res.status(404).json({ error: 'Clic non trouvé' });
    }

    // Optionnel : envoyer postback Awin
    if (click.apporteur_id && abonnement_id) {
      // Récupérer abonnement
      const abRes = await pool.query(
        'SELECT * FROM abonnements WHERE id = $1',
        [abonnement_id]
      );
      const abonnement = abRes.rows[0];

      // Récupérer boutique
      const boutRes = await pool.query(
        'SELECT * FROM boutiques WHERE id = $1',
        [boutique_id]
      );
      const boutique = boutRes.rows[0];

      if (abonnement && boutique) {
        await sendAwinPostback({
          clickRef: click_ref,
          boutique,
          abonnement,
          commission: { montant: commission_montant },
        });
      }
    }

    res.json({ success: true, click });
  } catch (err) {
    console.error('[affiliates/convert]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
