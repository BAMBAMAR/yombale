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
  sportSourceMuette,
  ligue1SenegalIndisponible,
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
      // D53 : une catégorie sans source, ou dont la source se tait, est dite « indisponible », pas « aucun match ».
      indisponible: matchs.length === 0 && (categorie === 'ligue1_sn' ? ligue1SenegalIndisponible() : sportSourceMuette()),
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
    const recues = req.body?.equipes;
    if (!Array.isArray(recues)) {
      return res.status(400).json({ success: false, error: 'Format invalide (liste attendue)' });
    }
    // Des noms d'équipes, rien d'autre : textes courts, sans doublon, trente au plus.
    const equipes = [...new Set(recues.filter((e) => typeof e === 'string').map((e) => e.trim().slice(0, 80)).filter(Boolean))].slice(0, 30);

    // SRG-A1-015 : la liste était passée telle quelle à une colonne JSONB ; le pilote en faisait un tableau
    // PostgreSQL, refusé par la base (500 pour tout compte connecté). Elle part désormais en JSON, et la ligne des
    // préférences est créée si le compte n'en a pas encore.
    const enregistre = Boolean(req.user?.userId);
    if (enregistre) {
      await pool.query(
        `INSERT INTO surga_preferences (user_id, equipes_suivies)
         VALUES ($2, $1::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET equipes_suivies = EXCLUDED.equipes_suivies, updated_at = NOW()`,
        [JSON.stringify(equipes), req.user.userId]
      );
    }

    res.json({
      success: true,
      // Un invité garde ses équipes sur son appareil : rien n'est écrit pour lui sur le serveur.
      enregistre,
      message: 'Équipes favorites mises à jour avec succès',
      equipes_suivies: equipes,
    });
  } catch (err) {
    console.error('[SURGA SPORT SAVE ERR]:', err.message);
    res.status(500).json({ success: false, error: 'Impossible de sauvegarder les équipes' });
  }
});

module.exports = router;
