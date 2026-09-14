// backend/routes/boutiques-modules/boutiques-abonnements.js
const router = require('express').Router();
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('./helpers');

function calculerProchaineDate(frequence, fromDate = new Date()) {
  const d = new Date(fromDate);
  if (frequence === 'hebdomadaire') {
    d.setDate(d.getDate() + 7);
  } else if (frequence === 'bimensuel') {
    d.setDate(d.getDate() + 14);
  } else if (frequence === 'mensuel') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + 7);
  }
  return d;
}

// ── GET /api/boutiques/:id/abonnements (Marchand Authentifié)
router.get('/:id/abonnements', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { statut, search } = req.query;
    let query = `SELECT * FROM boutique_abonnements WHERE boutique_id = $1`;
    const params = [bq.id];

    if (statut) {
      params.push(statut);
      query += ` AND statut = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (client_nom ILIKE $${params.length} OR client_telephone ILIKE $${params.length})`;
    }

    query += ` ORDER BY prochain_renouvellement ASC, created_at DESC`;

    const r = await pool.query(query, params);

    res.json({
      success: true,
      abonnements: r.rows
    });
  } catch (err) {
    console.error('[GET ABONNEMENTS ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des abonnements' });
  }
});

// ── POST /api/boutiques/:id/abonnements (Marchand Authentifié)
router.post('/:id/abonnements', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const {
      client_nom,
      client_telephone,
      client_adresse,
      frequence = 'hebdomadaire',
      montant_total = 0,
      items_json = [],
      notes,
      date_premiere_livraison
    } = req.body;

    if (!client_nom || !client_telephone) {
      return res.status(400).json({ error: 'Le nom et le téléphone du client sont obligatoires' });
    }

    const prochainRenouv = date_premiere_livraison ? new Date(date_premiere_livraison) : calculerProchaineDate(frequence);

    const r = await pool.query(
      `INSERT INTO boutique_abonnements (
         boutique_id, client_nom, client_telephone, client_adresse,
         frequence, statut, montant_total, items_json, prochain_renouvellement, notes
       ) VALUES ($1, $2, $3, $4, $5, 'actif', $6, $7, $8, $9)
       RETURNING *`,
      [
        bq.id,
        client_nom.trim(),
        client_telephone.trim(),
        client_adresse || null,
        frequence,
        parseFloat(montant_total) || 0,
        JSON.stringify(Array.isArray(items_json) ? items_json : []),
        prochainRenouv,
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      abonnement: r.rows[0]
    });
  } catch (err) {
    console.error('[POST ABONNEMENT ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement' });
  }
});

// ── PATCH /api/boutiques/:id/abonnements/:aboId/statut (Marchand Authentifié)
router.patch('/:id/abonnements/:aboId/statut', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { statut, prochain_renouvellement } = req.body;
    if (statut && !['actif', 'pause', 'annule'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const r = await pool.query(
      `UPDATE boutique_abonnements
       SET statut = COALESCE($1, statut),
           prochain_renouvellement = COALESCE($2, prochain_renouvellement),
           updated_at = NOW()
       WHERE id = $3 AND boutique_id = $4
       RETURNING *`,
      [statut || null, prochain_renouvellement ? new Date(prochain_renouvellement) : null, req.params.aboId, bq.id]
    );

    if (!r.rows[0]) return res.status(404).json({ error: 'Abonnement introuvable' });

    res.json({
      success: true,
      abonnement: r.rows[0]
    });
  } catch (err) {
    console.error('[PATCH ABONNEMENT ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'abonnement' });
  }
});

// ── POST /api/boutiques/:id/abonnements/:aboId/generer-commande (Marchand Authentifié)
router.post('/:id/abonnements/:aboId/generer-commande', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const aboRes = await pool.query(
      `SELECT * FROM boutique_abonnements WHERE id = $1 AND boutique_id = $2`,
      [req.params.aboId, bq.id]
    );
    if (!aboRes.rows[0]) return res.status(404).json({ error: 'Abonnement introuvable' });
    const abo = aboRes.rows[0];

    const refCmd = `ABO-${Date.now().toString().slice(-6)}`;
    const items = Array.isArray(abo.items_json) ? abo.items_json : [];

    // Créer la commande
    const cmdRes = await pool.query(
      `INSERT INTO boutique_commandes (
         boutique_id, reference, client_nom, client_telephone, client_adresse,
         montant_total, mode_paiement, statut, source
       ) VALUES ($1, $2, $3, $4, $5, $6, 'a_la_livraison', 'en_attente', 'abonnement')
       RETURNING *`,
      [
        bq.id,
        refCmd,
        abo.client_nom,
        abo.client_telephone,
        abo.client_adresse,
        parseFloat(abo.montant_total) || 0
      ]
    );

    // Mettre à jour la date de prochain renouvellement
    const nextDate = calculerProchaineDate(abo.frequence, abo.prochain_renouvellement);
    await pool.query(
      `UPDATE boutique_abonnements SET prochain_renouvellement = $1, updated_at = NOW() WHERE id = $2`,
      [nextDate, abo.id]
    );

    res.status(201).json({
      success: true,
      commande: cmdRes.rows[0],
      prochain_renouvellement: nextDate
    });
  } catch (err) {
    console.error('[GENERER COMMANDE ABO ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la génération de la commande d\'abonnement' });
  }
});

module.exports = router;
