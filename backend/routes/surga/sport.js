// backend/routes/surga/sport.js
// API de consultation et de personnalisation des scores et programmes sportifs pour Surga

const express = require('express');
const router = express.Router();
const { tokenOptional, verifierToken } = require('../../middlewares/surga-auth');
const { pool } = require('../../models/db');
const {
  LISTE_EQUIPES_DISPONIBLES,
  genererProgrammeSportActuel,
  filtrerMatchsSport,
} = require('../../services/surga/sport-service');

// GET /api/surga/sport/equipes
// Retourne la liste des équipes sénégalaises et internationales configurables
router.get('/sport/equipes', tokenOptional, (req, res) => {
  res.json({
    success: true,
    equipes: LISTE_EQUIPES_DISPONIBLES,
    categories: [
      { id: 'tous', label: 'Toutes les compétitions' },
      { id: 'ucl', label: 'Ligue des Champions' },
      { id: 'premier_league', label: 'Premier League' },
      { id: 'laliga', label: 'LaLiga' },
      { id: 'ligue1_fr', label: 'Ligue 1 France' },
      { id: 'serie_a', label: 'Serie A' },
      { id: 'saudi_pro', label: 'Saudi Pro League' },
      { id: 'nationale', label: 'Lions du Sénégal' },
      { id: 'ligue1_sn', label: 'Ligue 1 Sénégal' },
    ],
  });
});

// GET /api/surga/sport
// Retourne les matchs filtrés par équipes suivies ou par catégorie
router.get('/sport', tokenOptional, async (req, res) => {
  try {
    const categorie = req.query.categorie || 'tous';
    let equipes = [];

    if (req.query.equipes) {
      equipes = String(req.query.equipes).split(',').map((e) => e.trim()).filter(Boolean);
    } else if (req.user?.userId) {
      // Récupérer les équipes favorites sauvegardées dans surga_preferences
      try {
        const { rows } = await pool.query(
          'SELECT equipes_suivies FROM surga_preferences WHERE user_id = $1',
          [req.user.userId]
        );
        if (rows.length > 0 && Array.isArray(rows[0].equipes_suivies)) {
          equipes = rows[0].equipes_suivies;
        }
      } catch (err) {
        console.warn('[SURGA SPORT PREFS WARN]:', err.message);
      }
    }

    const matchs = await filtrerMatchsSport({
      equipesSuivies: equipes,
      categorie,
      limit: parseInt(req.query.limit, 10) || 20,
      force: req.query.refresh === 'true',
    });

    res.json({
      success: true,
      categorie,
      equipes_filtre: equipes,
      total: matchs.length,
      matchs,
      // D53 : aucune source pour la Ligue 1 sénégalaise. L'écran le dit au lieu d'afficher une liste vide.
      indisponible: categorie === 'ligue1_sn',
    });
  } catch (err) {
    console.error('[SURGA SPORT GET ERR]:', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des scores sportifs' });
  }
});

// POST /api/surga/sport/mes-equipes
// Sauvegarde les équipes favorites de l'utilisateur
router.post('/sport/mes-equipes', tokenOptional, async (req, res) => {
  try {
    const { equipes } = req.body;
    if (!Array.isArray(equipes)) {
      return res.status(400).json({ success: false, error: 'Format invalide (liste attendue)' });
    }

    if (req.user?.userId) {
      await pool.query(
        `UPDATE surga_preferences
         SET equipes_suivies = $1, updated_at = NOW()
         WHERE user_id = $2`,
        [equipes, req.user.userId]
      );
    }

    res.json({
      success: true,
      message: 'Équipes favorites mises à jour avec succès',
      equipes_suivies: equipes,
    });
  } catch (err) {
    console.error('[SURGA SPORT SAVE ERR]:', err.message);
    res.status(500).json({ success: false, error: 'Impossible de sauvegarder les équipes' });
  }
});

module.exports = router;
