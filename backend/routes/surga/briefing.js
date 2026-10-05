// backend/routes/surga/briefing.js
// API de génération du Briefing Quotidien personnalisé Surga (Tranche 2)

const express = require('express');
const router = express.Router();
const { pool } = require('../../models/db');
const { tokenOptional, verifierToken } = require('../../middlewares/auth');
const {
  collecterTousLesFlux,
  getBriefingItems,
} = require('../../services/surga/rss-collector');
const { getMeteo, VILLES_SENEGAL } = require('../../services/surga/meteo-service');
const { filtrerMatchsSport } = require('../../services/surga/sport-service');

// GET /api/surga/briefing
// Génère et retourne le briefing structuré selon les préférences du profil
router.get('/briefing', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId;
    let modulesActifs = ['actualites', 'sport', 'trafic'];
    let heureBriefing = '07:30';
    let quartierPrincipal = 'Dakar Plateau';
    let equipesSuivies = [];

    if (userId) {
      try {
        const { rows } = await pool.query(
          'SELECT modules_actifs, heure_briefing, quartiers, equipes_suivies FROM surga_preferences WHERE user_id = $1',
          [userId]
        );
        if (rows.length > 0) {
          const pref = rows[0];
          if (Array.isArray(pref.modules_actifs)) modulesActifs = pref.modules_actifs;
          if (pref.heure_briefing) heureBriefing = pref.heure_briefing;
          if (Array.isArray(pref.quartiers) && pref.quartiers[0]) quartierPrincipal = pref.quartiers[0];
          if (Array.isArray(pref.equipes_suivies)) equipesSuivies = pref.equipes_suivies;
        }
      } catch (err) {
        console.warn('[SURGA BRIEFING PREFS WARN]:', err.message);
      }
    }

    // Catégories à charger selon les modules actifs
    const categories = [];
    if (modulesActifs.includes('actualites')) categories.push('actualites');
    if (modulesActifs.includes('trafic')) categories.push('trafic');
    if (categories.length === 0) categories.push('actualites');

    const [items, sports, meteoData] = await Promise.all([
      getBriefingItems({ categories, limit: 6 }),
      modulesActifs.includes('sport')
        ? filtrerMatchsSport({ equipesSuivies, limit: 6 })
        : Promise.resolve([]),
      modulesActifs.includes('meteo') || true ? getMeteo(quartierPrincipal) : Promise.resolve(null),
    ]);

    // Agenda du jour de l'utilisateur
    let agendaDuJour = [];
    if (userId) {
      try {
        const agendaRes = await pool.query(
          `SELECT * FROM surga_agenda
           WHERE user_id = $1 AND date_evenement = CURRENT_DATE AND termine = FALSE
           ORDER BY heure_evenement ASC NULLS LAST`,
          [userId]
        );
        agendaDuJour = agendaRes.rows;
      } catch (err) {
        console.warn('[SURGA BRIEFING AGENDA WARN]:', err.message);
      }
    }

    // Formatage de la date en français
    const today = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    const dateFormatted = today.charAt(0).toUpperCase() + today.slice(1);

    // Synthèse personnalisée au vouvoiement (Règle d'or D19)
    const nbBreves = items.length;
    const nbSports = sports.length;
    const nbAgenda = agendaDuJour.length;

    let messageSynthese = `Bonjour. Voici votre briefing de ce ${dateFormatted} pour ${quartierPrincipal} : ${nbBreves} brève${nbBreves > 1 ? 's' : ''} d’actualité sourcée${nbBreves > 1 ? 's' : ''}${nbSports > 0 ? ` et ${nbSports} actualité${nbSports > 1 ? 's' : ''} sportive${nbSports > 1 ? 's' : ''}` : ''}.`;
    if (nbAgenda > 0) {
      messageSynthese += ` Vous avez ${nbAgenda} rendez-vous ou rappel${nbAgenda > 1 ? 's' : ''} programmé${nbAgenda > 1 ? 's' : ''} aujourd’hui.`;
    }

    res.json({
      success: true,
      date: dateFormatted,
      heure_briefing: heureBriefing,
      quartier: quartierPrincipal,
      message_synthese: messageSynthese,
      modules_actifs: modulesActifs,
      items,
      sports,
      meteo: meteoData,
      localites: Object.entries(VILLES_SENEGAL).map(([id, l]) => ({
        id,
        nom: l.nom,
        maritime: l.maritime,
        zone: l.zone || 'Sénégal',
      })),
      agenda_du_jour: agendaDuJour,
    });
  } catch (err) {
    console.error('[SURGA BRIEFING GET ERR]:', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération du briefing' });
  }
});

// POST /api/surga/briefing/refresh
// Force l'actualisation des flux RSS
router.post('/briefing/refresh', tokenOptional, async (req, res) => {
  try {
    const resultat = await collecterTousLesFlux();
    res.json({
      success: true,
      message: 'Actualisation des flux d’actualité terminée',
      details: resultat,
    });
  } catch (err) {
    console.error('[SURGA BRIEFING REFRESH ERR]:', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de l’actualisation des flux' });
  }
});

module.exports = router;
