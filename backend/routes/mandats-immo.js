// backend/routes/mandats-immo.js
// Gestion complète des mandats immobiliers (Vente, Location, Gestion locative)
// Standard Hektor / Apimo adapté Sénégal

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// ── Helper : générer référence mandat unique ──
function genererNumeroMandat() {
  const annee = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MDT-${annee}-${rand}`;
}

// ── GET /api/mandats-immo/agence/:slugOrId — Liste des mandats ──
router.get('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut, type_mandat, type_operation, search } = req.query;

    let query = `
      SELECT m.*,
             b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville,
             b.prix_location, b.prix_vente, b.photos AS bien_images, b.statut AS bien_statut,
             p.nom AS proprietaire_nom, p.telephone AS proprietaire_telephone, p.email AS proprietaire_email,
             u.nom AS agent_nom, u.prenom AS agent_prenom, u.email AS agent_email
      FROM mandats_immo m
      JOIN biens_immo b ON m.bien_id = b.id
      JOIN proprietaires_immo p ON m.proprietaire_id = p.id
      LEFT JOIN utilisateurs u ON m.agent_id = u.id
      WHERE m.agence_id = $1
    `;
    const params = [agenceId];
    let pIdx = 2;

    if (statut && statut !== 'tous') {
      query += ` AND m.statut = $${pIdx++}`;
      params.push(statut);
    }
    if (type_mandat && type_mandat !== 'tous') {
      query += ` AND m.type_mandat = $${pIdx++}`;
      params.push(type_mandat);
    }
    if (type_operation && type_operation !== 'tous') {
      query += ` AND m.type_operation = $${pIdx++}`;
      params.push(type_operation);
    }
    if (search && search.trim()) {
      query += ` AND (b.titre ILIKE $${pIdx} OR p.nom ILIKE $${pIdx} OR m.conditions ILIKE $${pIdx})`;
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    query += ` ORDER BY m.created_at DESC`;

    const { rows } = await pool.query(query, params);

    // Calculer les alertes d'expiration (sous 30 jours)
    const now = new Date();
    const mandatsEnrichis = rows.map(m => {
      let expireBientot = false;
      let joursRestants = null;
      if (m.date_fin && m.statut === 'actif') {
        const fin = new Date(m.date_fin);
        const diffMs = fin.getTime() - now.getTime();
        joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (joursRestants >= 0 && joursRestants <= 30) {
          expireBientot = true;
        }
      }
      return {
        ...m,
        expire_bientot: expireBientot,
        jours_restants: joursRestants,
      };
    });

    res.json({
      success: true,
      total: mandatsEnrichis.length,
      mandats: mandatsEnrichis,
    });
  } catch (err) {
    console.error('[GET /api/mandats-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des mandats' });
  }
});

// ── GET /api/mandats-immo/agence/:slugOrId/stats — KPIs mandats ──
router.get('/agence/:slugOrId/stats', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;

    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE statut = 'actif') AS total_actifs,
         COUNT(*) FILTER (WHERE statut = 'actif' AND type_mandat = 'exclusif') AS total_exclusifs,
         COUNT(*) FILTER (WHERE statut = 'actif' AND type_operation = 'vente') AS total_vente,
         COUNT(*) FILTER (WHERE statut = 'actif' AND type_operation = 'location') AS total_location,
         COUNT(*) FILTER (WHERE statut = 'actif' AND date_fin IS NOT NULL AND date_fin <= CURRENT_DATE + INTERVAL '30 days' AND date_fin >= CURRENT_DATE) AS expirant_30j,
         COUNT(*) FILTER (WHERE statut = 'expire') AS total_expires
       FROM mandats_immo
       WHERE agence_id = $1`,
      [agenceId]
    );

    res.json({
      success: true,
      stats: rows[0] || {}
    });
  } catch (err) {
    console.error('[GET /api/mandats-immo/agence/:slugOrId/stats]', err.message);
    res.status(500).json({ success: false, error: 'Erreur statistiques mandats' });
  }
});

// ── GET /api/mandats-immo/agence/:slugOrId/:mandatId — Détail d'un mandat ──
router.get('/agence/:slugOrId/:mandatId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { mandatId } = req.params;

    const { rows } = await pool.query(
      `SELECT m.*,
              b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville,
              b.prix_location, b.prix_vente, b.surface_m2, b.photos AS bien_images,
              p.nom AS proprietaire_nom, p.telephone AS proprietaire_telephone, p.email AS proprietaire_email,
              p.adresse AS proprietaire_adresse, p.ninea AS proprietaire_ninea,
              u.nom AS agent_nom, u.prenom AS agent_prenom, u.telephone AS agent_telephone
       FROM mandats_immo m
       JOIN biens_immo b ON m.bien_id = b.id
       JOIN proprietaires_immo p ON m.proprietaire_id = p.id
       LEFT JOIN utilisateurs u ON m.agent_id = u.id
       WHERE m.id = $1 AND m.agence_id = $2`,
      [mandatId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mandat introuvable' });
    }

    res.json({ success: true, mandat: rows[0] });
  } catch (err) {
    console.error('[GET /api/mandats-immo/:mandatId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement mandat' });
  }
});

// ── POST /api/mandats-immo/agence/:slugOrId — Créer un mandat ──
router.post('/agence/:slugOrId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      bien_id,
      proprietaire_id,
      agent_id,
      type_mandat = 'simple',
      type_operation = 'location',
      date_debut = new Date().toISOString().split('T')[0],
      duree_mois = 12,
      taux_commission,
      montant_commission_fixe,
      conditions,
      document_url,
    } = req.body;

    if (!bien_id || !proprietaire_id) {
      return res.status(400).json({ success: false, error: 'Bien et Propriétaire obligatoires' });
    }

    // Vérifier l'appartenance du bien et du propriétaire à cette agence
    const [bCheck, pCheck] = await Promise.all([
      pool.query(`SELECT id, titre FROM biens_immo WHERE id = $1 AND agence_id = $2`, [bien_id, agenceId]),
      pool.query(`SELECT id, nom FROM proprietaires_immo WHERE id = $1 AND agence_id = $2`, [proprietaire_id, agenceId]),
    ]);

    if (bCheck.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Le bien sélectionné n\'appartient pas à cette agence' });
    }
    if (pCheck.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Le propriétaire sélectionné n\'appartient pas à cette agence' });
    }

    // Calcul date de fin si durée_mois fournie
    let dateFinCalc = null;
    if (date_debut && duree_mois) {
      const d = new Date(date_debut);
      d.setMonth(d.getMonth() + parseInt(duree_mois, 10));
      dateFinCalc = d.toISOString().split('T')[0];
    }

    const assignedAgent = agent_id || req.user.userId;

    const { rows } = await pool.query(
      `INSERT INTO mandats_immo (
        agence_id, bien_id, proprietaire_id, agent_id,
        type_mandat, type_operation, date_debut, date_fin, duree_mois,
        taux_commission, montant_commission_fixe, conditions, document_url, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'actif')
      RETURNING *`,
      [
        agenceId,
        bien_id,
        proprietaire_id,
        assignedAgent,
        type_mandat,
        type_operation,
        date_debut,
        dateFinCalc,
        duree_mois,
        taux_commission || null,
        montant_commission_fixe || null,
        conditions || null,
        document_url || null,
      ]
    );

    // Mettre à jour le statut du bien si exclusif
    if (type_mandat === 'exclusif') {
      await pool.query(
        `UPDATE biens_immo SET updated_at = NOW() WHERE id = $1`,
        [bien_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Mandat créé avec succès',
      mandat: rows[0],
    });
  } catch (err) {
    console.error('[POST /api/mandats-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur création du mandat' });
  }
});

// ── PUT /api/mandats-immo/agence/:slugOrId/:mandatId — Modifier un mandat ──
router.put('/agence/:slugOrId/:mandatId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { mandatId } = req.params;
    const {
      type_mandat,
      type_operation,
      date_debut,
      date_fin,
      duree_mois,
      taux_commission,
      montant_commission_fixe,
      conditions,
      statut,
      document_url,
      agent_id,
    } = req.body;

    const { rows: exist } = await pool.query(
      `SELECT id FROM mandats_immo WHERE id = $1 AND agence_id = $2`,
      [mandatId, agenceId]
    );
    if (exist.length === 0) {
      return res.status(404).json({ success: false, error: 'Mandat introuvable' });
    }

    const { rows } = await pool.query(
      `UPDATE mandats_immo SET
        type_mandat = COALESCE($1, type_mandat),
        type_operation = COALESCE($2, type_operation),
        date_debut = COALESCE($3, date_debut),
        date_fin = COALESCE($4, date_fin),
        duree_mois = COALESCE($5, duree_mois),
        taux_commission = COALESCE($6, taux_commission),
        montant_commission_fixe = COALESCE($7, montant_commission_fixe),
        conditions = COALESCE($8, conditions),
        statut = COALESCE($9, statut),
        document_url = COALESCE($10, document_url),
        agent_id = COALESCE($11, agent_id),
        updated_at = NOW()
       WHERE id = $12 AND agence_id = $13
       RETURNING *`,
      [
        type_mandat,
        type_operation,
        date_debut,
        date_fin,
        duree_mois,
        taux_commission,
        montant_commission_fixe,
        conditions,
        statut,
        document_url,
        agent_id,
        mandatId,
        agenceId,
      ]
    );

    res.json({
      success: true,
      message: 'Mandat mis à jour avec succès',
      mandat: rows[0],
    });
  } catch (err) {
    console.error('[PUT /api/mandats-immo/:mandatId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour mandat' });
  }
});

// ── DELETE /api/mandats-immo/agence/:slugOrId/:mandatId — Supprimer un mandat ──
router.delete('/agence/:slugOrId/:mandatId', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { mandatId } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM mandats_immo WHERE id = $1 AND agence_id = $2`,
      [mandatId, agenceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Mandat introuvable' });
    }

    res.json({ success: true, message: 'Mandat supprimé avec succès' });
  } catch (err) {
    console.error('[DELETE /api/mandats-immo/:mandatId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression mandat' });
  }
});

// ── POST /api/mandats-immo/agence/:slugOrId/batch — Actions groupées sur mandats ──
router.post(
  ['/agence/:slugOrId/batch', '/:slugOrId/batch'],
  verifierToken,
  requireAgenceAccess('directeur'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { ids, action } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun mandat sélectionné.' });
      }

      if (action === 'resilier') {
        await pool.query(
          `UPDATE mandats_immo SET statut = 'resilie', updated_at = NOW()
           WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
          [ids, agenceId]
        );
        return res.json({ success: true, message: `${ids.length} mandat(s) résilié(s).` });
      }

      if (action === 'archiver') {
        await pool.query(
          `UPDATE mandats_immo SET statut = 'archive', updated_at = NOW()
           WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
          [ids, agenceId]
        );
        return res.json({ success: true, message: `${ids.length} mandat(s) archivé(s).` });
      }

      if (action === 'supprimer') {
        await pool.query(
          `DELETE FROM mandats_immo WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
          [ids, agenceId]
        );
        return res.json({ success: true, message: `${ids.length} mandat(s) supprimé(s).` });
      }

      return res.status(400).json({ success: false, error: 'Action non reconnue' });
    } catch (err) {
      console.error('[BATCH_MANDATS_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur lors de l’action groupée' });
    }
  }
);

module.exports = router;

