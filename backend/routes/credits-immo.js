// backend/routes/credits-immo.js
// Crédits & Plans d'échelonnement immobilier : Caution 2x/3x/4x, terrains échelonnés, avances bailleurs

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// ── GET /api/credits-immo/agence/:slugOrId ──
router.get('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut, type } = req.query;

    let query = `
      SELECT cr.*,
             b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville
      FROM credits_immo cr
      LEFT JOIN biens_immo b ON cr.bien_id = b.id
      WHERE cr.agence_id = $1
    `;
    const params = [agenceId];
    let pIdx = 2;

    if (statut && statut !== 'tous') {
      query += ` AND cr.statut = $${pIdx++}`;
      params.push(statut);
    }
    if (type && type !== 'tous') {
      query += ` AND cr.type_credit = $${pIdx++}`;
      params.push(type);
    }

    query += ` ORDER BY cr.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      credits: rows
    });
  } catch (err) {
    console.error('[GET /api/credits-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des crédits/échelonnements' });
  }
});

// ── POST /api/credits-immo/agence/:slugOrId — Créer un plan de crédit/échelonnement ──
router.post('/agence/:slugOrId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      type_credit = 'caution_echelonnee',
      beneficiaire_nom,
      beneficiaire_tel,
      bien_id,
      bail_id,
      montant_total,
      apport_initial = 0,
      nb_echeances = 3,
      frequence = 'mensuel',
      date_premiere_echeance,
      notes
    } = req.body;

    if (!beneficiaire_nom || !montant_total) {
      return res.status(400).json({ success: false, error: 'Bénéficiaire et montant total obligatoires.' });
    }

    const total = parseFloat(montant_total) || 0;
    const apport = parseFloat(apport_initial) || 0;
    const solde = Math.max(0, total - apport);
    const nEch = parseInt(nb_echeances, 10) || 3;
    const montantParEcheance = solde > 0 ? Math.round(solde / nEch) : 0;

    // Générer les sous-échéances
    const echeancesList = [];
    const startDate = date_premiere_echeance ? new Date(date_premiere_echeance) : new Date();

    for (let i = 1; i <= nEch; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + (i - 1));
      echeancesList.push({
        numero: i,
        date_echeance: d.toISOString().split('T')[0],
        montant: i === nEch ? (solde - (montantParEcheance * (nEch - 1))) : montantParEcheance,
        statut: 'en_attente',
        montant_paye: 0
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO credits_immo (
        agence_id, type_credit, beneficiaire_nom, beneficiaire_tel, bien_id, bail_id,
        montant_total, apport_initial, solde_restant, nb_echeances, frequence,
        statut, echeances, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'actif', $12, $13)
      RETURNING *`,
      [
        agenceId,
        type_credit,
        beneficiaire_nom.trim(),
        beneficiaire_tel || null,
        bien_id || null,
        bail_id || null,
        total,
        apport,
        solde,
        nEch,
        frequence,
        JSON.stringify(echeancesList),
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Plan de crédit / échelonnement créé avec succès',
      credit: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/credits-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur création plan de crédit' });
  }
});

// ── GET /api/credits-immo/agence/:slugOrId/config — Configuration échelonnement agence ──
const CONFIG_DEFAUT_ECHELONNEMENT_IMMO = {
  caution_active: true,
  caution_formules: [2, 3],
  caution_apport_min_pct: 50,
  caution_frais_gestion_pct: 0,
  caution_conditions: 'Éligible pour tout bail d\'habitation validé par l\'agence.',
  tranches_actives: true,
  tranches_formules_mois: [6, 12, 24, 36],
  tranches_apport_min_pct: 30,
  tranches_frequence: 'mensuel',
  delai_grace_jours: 5,
  penalite_retard_pct: 2,
  tranches_conditions: 'Réservé aux parcelles titrées/délibérées et programmes neufs éligibles.',
};

router.get('/agence/:slugOrId/config', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agence = req.agence;
    const currentParams = agence.parametres || {};
    const config = {
      ...CONFIG_DEFAUT_ECHELONNEMENT_IMMO,
      ...(currentParams.echelonnement_config || {}),
    };
    res.json({ success: true, config });
  } catch (err) {
    console.error('[GET /api/credits-immo/agence/:slugOrId/config]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement configuration échelonnement' });
  }
});

// ── PUT /api/credits-immo/agence/:slugOrId/config — Sauvegarde configuration échelonnement agence ──
router.put('/agence/:slugOrId/config', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const body = req.body || {};

    const newConfig = {
      caution_active: Boolean(body.caution_active),
      caution_formules: Array.isArray(body.caution_formules) && body.caution_formules.length > 0
        ? body.caution_formules.map(Number).filter(n => [2, 3, 4].includes(n))
        : [2, 3],
      caution_apport_min_pct: Math.min(100, Math.max(10, Number(body.caution_apport_min_pct) || 50)),
      caution_frais_gestion_pct: Math.max(0, Number(body.caution_frais_gestion_pct) || 0),
      caution_conditions: String(body.caution_conditions || '').trim(),

      tranches_actives: Boolean(body.tranches_actives),
      tranches_formules_mois: Array.isArray(body.tranches_formules_mois) && body.tranches_formules_mois.length > 0
        ? body.tranches_formules_mois.map(Number).filter(n => n >= 2 && n <= 60)
        : [6, 12, 24, 36],
      tranches_apport_min_pct: Math.min(100, Math.max(5, Number(body.tranches_apport_min_pct) || 30)),
      tranches_frequence: ['mensuel', 'trimestriel'].includes(body.tranches_frequence) ? body.tranches_frequence : 'mensuel',
      delai_grace_jours: Math.max(0, Number(body.delai_grace_jours) || 5),
      penalite_retard_pct: Math.max(0, Number(body.penalite_retard_pct) || 0),
      tranches_conditions: String(body.tranches_conditions || '').trim(),
    };

    const { rows: aRows } = await pool.query(`SELECT parametres FROM agences_immo WHERE id = $1`, [agenceId]);
    const mergedParams = {
      ...(aRows[0]?.parametres || {}),
      echelonnement_config: newConfig,
    };

    await pool.query(
      `UPDATE agences_immo SET parametres = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(mergedParams), agenceId]
    );

    res.json({ success: true, message: 'Configuration de l\'échelonnement enregistrée avec succès', config: newConfig });
  } catch (err) {
    console.error('[PUT /api/credits-immo/agence/:slugOrId/config]', err.message);
    res.status(500).json({ success: false, error: 'Erreur enregistrement configuration échelonnement' });
  }
});

// ── POST /api/credits-immo/agence/:slugOrId/:creditId/encaisser-echeance ──
router.post(
  ['/agence/:slugOrId/:creditId/encaisser-echeance', '/:slugOrId/:creditId/encaisser-echeance'],
  verifierToken,
  requireAgenceAccess('agent'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { creditId } = req.params;
      const { numero_echeance, montant } = req.body;

      const { rows: creditRows } = await pool.query(
        `SELECT * FROM credits_immo WHERE id = $1 AND agence_id = $2`,
        [creditId, agenceId]
      );

      if (creditRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Plan introuvable' });
      }

      const credit = creditRows[0];
      const echs = Array.isArray(credit.echeances) ? [...credit.echeances] : [];
      const idx = echs.findIndex(e => e.numero === numero_echeance);

      if (idx >= 0) {
        echs[idx].statut = 'paye';
        echs[idx].montant_paye = montant || echs[idx].montant;
        echs[idx].date_paiement = new Date().toISOString().split('T')[0];
      }

      const payees = echs.filter(e => e.statut === 'paye').reduce((sum, e) => sum + (e.montant_paye || e.montant), 0);
      const newSolde = Math.max(0, (credit.montant_total - credit.apport_initial) - payees);
      const newStatut = newSolde === 0 ? 'solde' : 'actif';

      const { rows: updatedRows } = await pool.query(
        `UPDATE credits_immo SET
          echeances = $1,
          solde_restant = $2,
          statut = $3,
          updated_at = NOW()
         WHERE id = $4 AND agence_id = $5
         RETURNING *`,
        [JSON.stringify(echs), newSolde, newStatut, creditId, agenceId]
      );

      res.json({
        success: true,
        message: 'Échéance encaissée avec succès',
        credit: updatedRows[0]
      });
    } catch (err) {
      console.error('[POST /api/credits-immo/agence/:slugOrId/:creditId/encaisser-echeance]', err.message);
      res.status(500).json({ success: false, error: 'Erreur encaissement échéance' });
    }
  }
);

module.exports = router;
