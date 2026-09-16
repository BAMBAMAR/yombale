// backend/routes/agence-notifications.js
// Système unifié de notifications, alertes temps réel et compteurs d'action pour l'agence

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// ── GET /api/agences/agence/:slugOrId/notifications ──
router.get('/agence/:slugOrId/notifications', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { limit = 40 } = req.query;

    // 1. Récupérer les notifications enregistrées
    const { rows: notifs } = await pool.query(
      `SELECT id, type, titre, message, lien, priorite, lu, metadonnees, created_at
       FROM notifications_immo
       WHERE agence_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [agenceId, Math.min(parseInt(limit, 10) || 40, 100)]
    );

    // 2. Agréger en temps réel les alertes opérationnelles critiques en UNE SEULE requête optimisée
    const { rows: aggRows } = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM visites_immo WHERE agence_id = $1 AND statut IN ('demande', 'en_attente')) AS nb_visites,
        (SELECT COUNT(*) FROM loyers_echeances WHERE agence_id = $1 AND statut IN ('retard', 'impaye')) AS nb_loyers,
        (SELECT COALESCE(SUM(montant_restant), 0) FROM loyers_echeances WHERE agence_id = $1 AND statut IN ('retard', 'impaye')) AS montant_loyers,
        (SELECT COUNT(*) FROM mandats_immo WHERE agence_id = $1 AND statut = 'actif' AND date_fin IS NOT NULL AND date_fin BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '15 days')) AS nb_mandats,
        (SELECT COUNT(*) FROM baux_immo WHERE agence_id = $1 AND statut = 'actif' AND date_fin IS NOT NULL AND date_fin BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')) AS nb_baux,
        (SELECT COUNT(*) FROM maintenance_immo WHERE agence_id = $1 AND priorite = 'urgente' AND statut != 'resolu') AS nb_tickets`,
      [agenceId]
    );

    const agg = aggRows[0] || {};
    const nbDemandesVisite = parseInt(agg.nb_visites || '0', 10);
    const nbLoyersRetard = parseInt(agg.nb_loyers || '0', 10);
    const montantLoyersRetard = parseFloat(agg.montant_loyers || '0');
    const nbMandatsExpirants = parseInt(agg.nb_mandats || '0', 10);
    const nbBauxExpirants = parseInt(agg.nb_baux || '0', 10);
    const nbTicketsUrgents = parseInt(agg.nb_tickets || '0', 10);

    const nonLusDb = notifs.filter(n => !n.lu).length;
    const totalAlertes = nbDemandesVisite + nbLoyersRetard + nbMandatsExpirants + nbTicketsUrgents;

    res.json({
      success: true,
      notifications: notifs,
      non_lus_db: nonLusDb,
      total_alertes: totalAlertes,
      compteurs: {
        demandes_visite: nbDemandesVisite,
        loyers_retard: nbLoyersRetard,
        montant_loyers_retard: montantLoyersRetard,
        mandats_expirants: nbMandatsExpirants,
        baux_expirants: nbBauxExpirants,
        tickets_urgents: nbTicketsUrgents,
      },
    });
  } catch (err) {
    console.error('[GET /api/agences/agence/:slugOrId/notifications]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des notifications' });
  }
});

// ── PATCH /api/agences/agence/:slugOrId/notifications/:notifId/lire ──
router.patch('/agence/:slugOrId/notifications/:notifId/lire', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { notifId } = req.params;

    const { rows } = await pool.query(
      `UPDATE notifications_immo SET lu = TRUE, updated_at = NOW() 
       WHERE id = $1 AND agence_id = $2 RETURNING *`,
      [notifId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }

    res.json({ success: true, notification: rows[0] });
  } catch (err) {
    console.error('[PATCH /notifications/:notifId/lire]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour notification' });
  }
});

// ── POST /api/agences/agence/:slugOrId/notifications/tout-lire ──
router.post('/agence/:slugOrId/notifications/tout-lire', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;

    await pool.query(
      `UPDATE notifications_immo SET lu = TRUE, updated_at = NOW() WHERE agence_id = $1 AND lu = FALSE`,
      [agenceId]
    );

    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
  } catch (err) {
    console.error('[POST /notifications/tout-lire]', err.message);
    res.status(500).json({ success: false, error: 'Erreur marquage des notifications' });
  }
});

module.exports = router;
