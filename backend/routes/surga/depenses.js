// backend/routes/surga/depenses.js
// API Dépenses & Récapitulatifs mensuels déterministes Surga (Tranche 3)
// Zéro émoji, calculs mathématiques exacts en SQL/déterministe, sécurité multi-tenant

const express = require('express');
const router = express.Router();
const { pool } = require('../../models/db');
const { tokenOptional } = require('../../middlewares/surga-auth');
const { formaterFCFA } = require('../../services/surga/calculator');

const CATEGORIES_AUTORISEES = [
  'Alimentation',
  'Transport',
  'Logement',
  'Santé',
  'Factures',
  'Loisirs',
  'Autre',
];

// GET /api/surga/depenses
// Liste des dépenses filtrées par mois (ex: ?mois=2026-10)
router.get('/depenses', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const mois = req.query.mois ? String(req.query.mois).trim() : null; // Format YYYY-MM

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        depenses: [],
        message: 'Mode invité actif : données locales uniquement',
      });
    }

    let sql = 'SELECT * FROM surga_depenses WHERE user_id = $1';
    const params = [userId];

    if (mois && /^\d{4}-\d{2}$/.test(mois)) {
      sql += " AND TO_CHAR(date_depense, 'YYYY-MM') = $2";
      params.push(mois);
    }

    sql += ' ORDER BY date_depense DESC, created_at DESC';

    const { rows } = await pool.query(sql, params);
    return res.json({
      success: true,
      depenses: rows,
    });
  } catch (err) {
    console.error('[SURGA DEPENSES GET ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des dépenses' });
  }
});

// GET /api/surga/depenses/stats
// Récapitulatif mensuel agrégé de façon déterministe
router.get('/depenses/stats', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const mois = req.query.mois ? String(req.query.mois).trim() : new Date().toISOString().slice(0, 7);

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        mois,
        total_xof: 0,
        total_formate: '0 FCFA',
        nb_depenses: 0,
        par_categorie: [],
      });
    }

    // Calcul déterministe SQL strict
    const totalQuery = await pool.query(
      `SELECT
         COALESCE(SUM(montant_xof), 0)::BIGINT AS total_xof,
         COUNT(id)::INT AS nb_depenses
       FROM surga_depenses
       WHERE user_id = $1 AND TO_CHAR(date_depense, 'YYYY-MM') = $2`,
      [userId, mois]
    );

    const categoriesQuery = await pool.query(
      `SELECT
         categorie,
         COALESCE(SUM(montant_xof), 0)::BIGINT AS total_categorie,
         COUNT(id)::INT AS nb_items
       FROM surga_depenses
       WHERE user_id = $1 AND TO_CHAR(date_depense, 'YYYY-MM') = $2
       GROUP BY categorie
       ORDER BY total_categorie DESC`,
      [userId, mois]
    );

    const totalXof = Number(totalQuery.rows[0]?.total_xof || 0);
    const nbDepenses = Number(totalQuery.rows[0]?.nb_depenses || 0);

    const parCategorie = categoriesQuery.rows.map((row) => ({
      categorie: row.categorie,
      total_xof: Number(row.total_categorie),
      total_formate: formaterFCFA(Number(row.total_categorie)),
      pourcentage: totalXof > 0 ? Math.round((Number(row.total_categorie) / totalXof) * 100) : 0,
      nb_items: Number(row.nb_items),
    }));

    return res.json({
      success: true,
      mois,
      total_xof: totalXof,
      total_formate: formaterFCFA(totalXof),
      nb_depenses: nbDepenses,
      par_categorie: parCategorie,
    });
  } catch (err) {
    console.error('[SURGA DEPENSES STATS ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors du calcul du récapitulatif des dépenses' });
  }
});

// POST /api/surga/depenses
// Ajoute ou synchronise une dépense
router.post('/depenses', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id, montant_xof, categorie, date_depense, note } = req.body;

    const montant = parseInt(montant_xof, 10);
    if (!montant || Number.isNaN(montant) || montant <= 0) {
      return res.status(400).json({ success: false, error: 'Le montant en FCFA doit être supérieur à zéro' });
    }

    const cat = CATEGORIES_AUTORISEES.includes(categorie) ? categorie : 'Autre';
    const date = date_depense && /^\d{4}-\d{2}-\d{2}$/.test(date_depense)
      ? date_depense
      : new Date().toISOString().slice(0, 10);

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        depense: {
          id: id || `local_${Date.now()}`,
          montant_xof: montant,
          categorie: cat,
          date_depense: date,
          note: note ? String(note).slice(0, 255) : '',
          created_at: new Date().toISOString(),
        },
      });
    }

    let query;
    let params;

    if (id) {
      // Upsert si généré hors ligne
      query = `
        INSERT INTO surga_depenses (id, user_id, montant_xof, categorie, date_depense, note, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          montant_xof = EXCLUDED.montant_xof,
          categorie = EXCLUDED.categorie,
          date_depense = EXCLUDED.date_depense,
          note = EXCLUDED.note,
          updated_at = NOW()
        WHERE surga_depenses.user_id = $2
        RETURNING *
      `;
      params = [id, userId, montant, cat, date, note ? String(note).slice(0, 255) : null];
    } else {
      query = `
        INSERT INTO surga_depenses (user_id, montant_xof, categorie, date_depense, note)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      params = [userId, montant, cat, date, note ? String(note).slice(0, 255) : null];
    }

    const { rows } = await pool.query(query, params);
    return res.status(201).json({
      success: true,
      depense: rows[0],
    });
  } catch (err) {
    console.error('[SURGA DEPENSES POST ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de l’enregistrement de la dépense' });
  }
});

// DELETE /api/surga/depenses/:id
// Supprime une dépense avec vérification IDOR
router.delete('/depenses/:id', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.json({ success: true, guest: true, deletedId: id });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM surga_depenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Dépense introuvable ou non autorisée' });
    }

    return res.json({ success: true, message: 'Dépense supprimée avec succès', deletedId: id });
  } catch (err) {
    console.error('[SURGA DEPENSES DELETE ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la suppression de la dépense' });
  }
});

module.exports = router;
