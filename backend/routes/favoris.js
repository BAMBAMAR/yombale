// backend/routes/favoris.js
// Synchronisation cloud des favoris multi-appareils (IMM-002)

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');

const VALID_TYPES = new Set(['produit', 'immo', 'telecom', 'annonce', 'boutique_produit']);

// ── GET /api/favoris — Liste des favoris de l'utilisateur connecté ──
router.get('/', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { rows } = await pool.query(
      `SELECT type_entite, entite_id, boutique_id, created_at 
       FROM utilisateurs_favoris 
       WHERE utilisateur_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const favoris = rows.map(r => ({
      id: r.entite_id,
      type: r.type_entite,
      boutiqueId: r.boutique_id || undefined,
      createdAt: r.created_at,
    }));

    res.json({ success: true, favoris });
  } catch (err) {
    console.error('[GET /api/favoris]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des favoris' });
  }
});

// ── POST /api/favoris — Ajouter un favori ──
router.post('/', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id, type = 'produit', boutiqueId } = req.body;

    if (!id || !VALID_TYPES.has(type)) {
      return res.status(400).json({ success: false, error: 'Identifiant ou type d\'entité invalide' });
    }

    const { rows } = await pool.query(
      `INSERT INTO utilisateurs_favoris (utilisateur_id, type_entite, entite_id, boutique_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (utilisateur_id, type_entite, entite_id) 
       DO UPDATE SET boutique_id = EXCLUDED.boutique_id, created_at = NOW()
       RETURNING id, type_entite, entite_id, boutique_id, created_at`,
      [userId, type, String(id), boutiqueId || null]
    );

    res.json({
      success: true,
      favori: {
        id: rows[0].entite_id,
        type: rows[0].type_entite,
        boutiqueId: rows[0].boutique_id || undefined,
        createdAt: rows[0].created_at,
      }
    });
  } catch (err) {
    console.error('[POST /api/favoris]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement du favori' });
  }
});

// ── DELETE /api/favoris/:type/:id — Retirer un favori ──
router.delete('/:type/:id', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { type, id } = req.params;

    await pool.query(
      `DELETE FROM utilisateurs_favoris 
       WHERE utilisateur_id = $1 AND type_entite = $2 AND entite_id = $3`,
      [userId, type, String(id)]
    );

    res.json({ success: true, message: 'Favori retiré' });
  } catch (err) {
    console.error('[DELETE /api/favoris/:type/:id]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du favori' });
  }
});

// ── POST /api/favoris/bulk-sync — Synchronisation bidirectionnelle (login / merge localStorage) ──
router.post('/bulk-sync', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { favoris = [] } = req.body;

    if (Array.isArray(favoris) && favoris.length > 0) {
      for (const f of favoris) {
        if (!f || !f.id) continue;
        const favType = VALID_TYPES.has(f.type) ? f.type : 'produit';
        await pool.query(
          `INSERT INTO utilisateurs_favoris (utilisateur_id, type_entite, entite_id, boutique_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (utilisateur_id, type_entite, entite_id) DO NOTHING`,
          [userId, favType, String(f.id), f.boutiqueId || null]
        );
      }
    }

    // Renvoyer l'ensemble consolidé
    const { rows } = await pool.query(
      `SELECT type_entite, entite_id, boutique_id, created_at 
       FROM utilisateurs_favoris 
       WHERE utilisateur_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const fullList = rows.map(r => ({
      id: r.entite_id,
      type: r.type_entite,
      boutiqueId: r.boutique_id || undefined,
      createdAt: r.created_at,
    }));

    res.json({ success: true, favoris: fullList });
  } catch (err) {
    console.error('[POST /api/favoris/bulk-sync]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la synchronisation des favoris' });
  }
});

module.exports = router;
