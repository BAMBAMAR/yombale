// backend/routes/offres-immo.js
// Gestion des offres d'achat et de location, contre-propositions et négociations
// Standard Hektor / Apimo

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// ── GET /api/offres-immo/agence/:slugOrId — Liste des offres ──
router.get('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut, bien_id, contact_id, type_offre } = req.query;

    let query = `
      SELECT o.*,
             b.titre AS bien_titre, b.prix_location, b.prix_vente, b.quartier AS bien_quartier,
             b.ville AS bien_ville, b.images AS bien_images,
             c.nom AS contact_nom, c.telephone AS contact_telephone, c.email AS contact_email,
             c.type_contact,
             u.nom AS agent_nom, u.prenom AS agent_prenom
      FROM offres_immo o
      JOIN biens_immo b ON o.bien_id = b.id
      JOIN contacts_immo c ON o.contact_id = c.id
      LEFT JOIN utilisateurs u ON o.agent_id = u.id
      WHERE o.agence_id = $1
    `;
    const params = [agenceId];
    let pIdx = 2;

    if (statut && statut !== 'tous') {
      query += ` AND o.statut = $${pIdx++}`;
      params.push(statut);
    }
    if (bien_id) {
      query += ` AND o.bien_id = $${pIdx++}`;
      params.push(bien_id);
    }
    if (contact_id) {
      query += ` AND o.contact_id = $${pIdx++}`;
      params.push(contact_id);
    }
    if (type_offre && type_offre !== 'tous') {
      query += ` AND o.type_offre = $${pIdx++}`;
      params.push(type_offre);
    }

    query += ` ORDER BY o.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      total: rows.length,
      offres: rows,
    });
  } catch (err) {
    console.error('[GET /api/offres-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des offres' });
  }
});

// ── GET /api/offres-immo/agence/:slugOrId/:offreId — Détail d'une offre ──
router.get('/agence/:slugOrId/:offreId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { offreId } = req.params;

    const { rows } = await pool.query(
      `SELECT o.*,
              b.titre AS bien_titre, b.prix_location, b.prix_vente, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.images AS bien_images, b.statut AS bien_statut,
              c.nom AS contact_nom, c.telephone AS contact_telephone, c.email AS contact_email,
              u.nom AS agent_nom, u.prenom AS agent_prenom
       FROM offres_immo o
       JOIN biens_immo b ON o.bien_id = b.id
       JOIN contacts_immo c ON o.contact_id = c.id
       LEFT JOIN utilisateurs u ON o.agent_id = u.id
       WHERE o.id = $1 AND o.agence_id = $2`,
      [offreId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Offre introuvable' });
    }

    res.json({ success: true, offre: rows[0] });
  } catch (err) {
    console.error('[GET /api/offres-immo/:offreId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement offre' });
  }
});

// ── POST /api/offres-immo/agence/:slugOrId — Déposer une offre ──
router.post('/agence/:slugOrId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      bien_id,
      contact_id,
      visite_id,
      agent_id,
      type_offre = 'vente',
      montant,
      conditions,
      date_validite,
      notes,
    } = req.body;

    if (!bien_id || !contact_id || !montant) {
      return res.status(400).json({ success: false, error: 'Bien, Contact et Montant obligatoires' });
    }

    const assignedAgent = agent_id || req.user.userId;

    const { rows } = await pool.query(
      `INSERT INTO offres_immo (
        agence_id, bien_id, contact_id, agent_id, visite_id,
        type_offre, montant, conditions, date_validite, statut, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'en_cours', $10)
      RETURNING *`,
      [
        agenceId,
        bien_id,
        contact_id,
        assignedAgent,
        visite_id || null,
        type_offre,
        montant,
        conditions || null,
        date_validite || null,
        notes || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Offre enregistrée avec succès',
      offre: rows[0],
    });
  } catch (err) {
    console.error('[POST /api/offres-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur enregistrement de l\'offre' });
  }
});

// ── PUT /api/offres-immo/agence/:slugOrId/:offreId/statut — Mettre à jour statut (Accepter, Refuser, Contre-offre) ──
router.put('/agence/:slugOrId/:offreId/statut', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { offreId } = req.params;
    const { statut, contre_proposition, notes } = req.body;

    const allowed = ['en_cours', 'acceptee', 'refusee', 'contre_offre', 'expiree'];
    if (!allowed.includes(statut)) {
      return res.status(400).json({ success: false, error: `Statut invalide. Autorisés: ${allowed.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE offres_immo SET
        statut = $1,
        contre_proposition = COALESCE($2, contre_proposition),
        notes = COALESCE($3, notes),
        updated_at = NOW()
       WHERE id = $4 AND agence_id = $5
       RETURNING *`,
      [statut, contre_proposition || null, notes || null, offreId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Offre introuvable' });
    }

    res.json({
      success: true,
      message: `Statut de l'offre mis à jour : ${statut}`,
      offre: rows[0],
    });
  } catch (err) {
    console.error('[PUT /api/offres-immo/:offreId/statut]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour statut offre' });
  }
});

// ── DELETE /api/offres-immo/agence/:slugOrId/:offreId — Supprimer une offre ──
router.delete('/agence/:slugOrId/:offreId', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { offreId } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM offres_immo WHERE id = $1 AND agence_id = $2`,
      [offreId, agenceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Offre introuvable' });
    }

    res.json({ success: true, message: 'Offre supprimée avec succès' });
  } catch (err) {
    console.error('[DELETE /api/offres-immo/:offreId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression offre' });
  }
});

module.exports = router;
