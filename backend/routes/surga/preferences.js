// backend/routes/surga/preferences.js
// API de gestion du profil de personnalisation Surga (Tranche 1)
// Zéro émoji, validation stricte, sécurité JWT anti-IDOR

const express = require('express');
const router = express.Router();
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional } = require('../../middlewares/surga-auth');

const DEFAUTS_PREFERENCES = {
  modules_actifs: ['briefing', 'meteo', 'actualites', 'trafic', 'notes', 'depenses', 'calculatrice', 'agenda'],
  heure_briefing: '07:30',
  langue: 'fr',
  quartiers: ['Dakar Plateau', 'Almadies'],
  equipes_suivies: ['Équipe Nationale du Sénégal'],
  sources_presse: ['APS', 'Le Soleil', 'Seneweb'],
  audio_actif: false,
  onboarding_termine: false,
  consentement_voix: false,
  sidebar_services: ['trafic', 'presse', 'immo', 'shopping', 'places'],
  rail_widgets: ['agenda', 'depenses', 'trafic', 'meteo', 'notes', 'radios'],
};

// GET /api/surga/preferences
// Récupère les préférences de l'utilisateur connecté ou renvoie les valeurs par défaut
router.get('/preferences', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        preferences: DEFAUTS_PREFERENCES,
      });
    }

    let { rows } = await pool.query(
      'SELECT * FROM surga_preferences WHERE user_id = $1',
      [userId]
    );

    if (rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO surga_preferences (
          user_id, modules_actifs, heure_briefing, langue, quartiers, equipes_suivies, sources_presse, audio_actif, onboarding_termine, consentement_voix
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING *`,
        [
          userId,
          JSON.stringify(DEFAUTS_PREFERENCES.modules_actifs),
          DEFAUTS_PREFERENCES.heure_briefing,
          DEFAUTS_PREFERENCES.langue,
          JSON.stringify(DEFAUTS_PREFERENCES.quartiers),
          JSON.stringify(DEFAUTS_PREFERENCES.equipes_suivies),
          JSON.stringify(DEFAUTS_PREFERENCES.sources_presse),
          DEFAUTS_PREFERENCES.audio_actif,
          DEFAUTS_PREFERENCES.onboarding_termine,
          DEFAUTS_PREFERENCES.consentement_voix,
        ]
      );
      rows = insertResult.rows;
      if (rows.length === 0) {
        const refetch = await pool.query('SELECT * FROM surga_preferences WHERE user_id = $1', [userId]);
        rows = refetch.rows;
      }
    }

    res.json({
      success: true,
      guest: false,
      preferences: rows[0] || DEFAUTS_PREFERENCES,
    });
  } catch (err) {
    console.error('[SURGA PREFERENCES GET ERROR]:', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des préférences Surga' });
  }
});

// Handler commun pour la mise à jour des préférences (PUT ou POST)
const handleSauvegarderPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      modules_actifs,
      heure_briefing,
      langue,
      quartiers,
      equipes_suivies,
      sources_presse,
      audio_actif,
      consentement_voix,
      sidebar_services,
      rail_widgets,
    } = req.body;

    const { rows: currentRows } = await pool.query(
      'SELECT * FROM surga_preferences WHERE user_id = $1',
      [userId]
    );
    const existing = currentRows[0] || DEFAUTS_PREFERENCES;

    const nextModules = Array.isArray(modules_actifs) ? modules_actifs : existing.modules_actifs;
    const nextHeure = typeof heure_briefing === 'string' && /^\d{2}:\d{2}$/.test(heure_briefing)
      ? heure_briefing
      : (existing.heure_briefing || '07:30');
    const nextLangue = typeof langue === 'string' && ['fr', 'wo'].includes(langue)
      ? langue
      : (existing.langue || 'fr');
    const nextQuartiers = Array.isArray(quartiers) ? quartiers : existing.quartiers;
    const nextEquipes = Array.isArray(equipes_suivies) ? equipes_suivies : existing.equipes_suivies;
    const nextSources = Array.isArray(sources_presse) ? sources_presse : existing.sources_presse;
    const nextAudio = typeof audio_actif === 'boolean' ? audio_actif : Boolean(existing.audio_actif);
    const nextConsentVoix = typeof consentement_voix === 'boolean' ? consentement_voix : Boolean(existing.consentement_voix);
    const nextSidebar = Array.isArray(sidebar_services) ? sidebar_services : (existing.sidebar_services || DEFAUTS_PREFERENCES.sidebar_services);
    const nextRail = Array.isArray(rail_widgets) ? rail_widgets : (existing.rail_widgets || DEFAUTS_PREFERENCES.rail_widgets);

    const { rows } = await pool.query(
      `INSERT INTO surga_preferences (
        user_id, modules_actifs, heure_briefing, langue, quartiers, equipes_suivies, sources_presse, audio_actif, consentement_voix, sidebar_services, rail_widgets, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        modules_actifs = EXCLUDED.modules_actifs,
        heure_briefing = EXCLUDED.heure_briefing,
        langue = EXCLUDED.langue,
        quartiers = EXCLUDED.quartiers,
        equipes_suivies = EXCLUDED.equipes_suivies,
        sources_presse = EXCLUDED.sources_presse,
        audio_actif = EXCLUDED.audio_actif,
        consentement_voix = EXCLUDED.consentement_voix,
        sidebar_services = EXCLUDED.sidebar_services,
        rail_widgets = EXCLUDED.rail_widgets,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        JSON.stringify(nextModules),
        nextHeure,
        nextLangue,
        JSON.stringify(nextQuartiers),
        JSON.stringify(nextEquipes),
        JSON.stringify(nextSources),
        nextAudio,
        nextConsentVoix,
        JSON.stringify(nextSidebar),
        JSON.stringify(nextRail),
      ]
    );

    res.json({
      success: true,
      message: 'Préférences Surga mises à jour avec succès',
      preferences: rows[0],
    });
  } catch (err) {
    console.error('[SURGA PREFERENCES UPDATE ERROR]:', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour des préférences Surga' });
  }
};

// PUT /api/surga/preferences
router.put('/preferences', verifierToken, handleSauvegarderPreferences);

// POST /api/surga/preferences (alias)
router.post('/preferences', verifierToken, handleSauvegarderPreferences);

// POST /api/surga/onboarding
// Finalise l'onboarding en marquant onboarding_termine = true
router.post('/onboarding', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      modules_actifs,
      heure_briefing,
      langue,
      quartiers,
      equipes_suivies,
    } = req.body;

    const modules = Array.isArray(modules_actifs) && modules_actifs.length > 0
      ? modules_actifs
      : DEFAUTS_PREFERENCES.modules_actifs;
    const heure = typeof heure_briefing === 'string' && /^\d{2}:\d{2}$/.test(heure_briefing)
      ? heure_briefing
      : '07:30';
    const lang = typeof langue === 'string' && ['fr', 'wo'].includes(langue)
      ? langue
      : 'fr';
    const quartiersList = Array.isArray(quartiers) ? quartiers : [];
    const equipesList = Array.isArray(equipes_suivies) ? equipes_suivies : [];

    const { rows } = await pool.query(
      `INSERT INTO surga_preferences (
        user_id, modules_actifs, heure_briefing, langue, quartiers, equipes_suivies, onboarding_termine, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        modules_actifs = EXCLUDED.modules_actifs,
        heure_briefing = EXCLUDED.heure_briefing,
        langue = EXCLUDED.langue,
        quartiers = EXCLUDED.quartiers,
        equipes_suivies = EXCLUDED.equipes_suivies,
        onboarding_termine = TRUE,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        JSON.stringify(modules),
        heure,
        lang,
        JSON.stringify(quartiersList),
        JSON.stringify(equipesList),
      ]
    );

    res.json({
      success: true,
      message: 'Onboarding Surga validé avec succès',
      preferences: rows[0],
    });
  } catch (err) {
    console.error('[SURGA ONBOARDING ERROR]:', err.message);
    res.status(500).json({ success: false, error: "Erreur lors de la finalisation de l'onboarding Surga" });
  }
});

module.exports = router;
