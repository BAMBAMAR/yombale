// backend/routes/surga/sync.js
// Endpoint de synchronisation hors ligne bidirectionnelle pour Surga (Tranche 3)

const express = require('express');
const router = express.Router();
const { pool } = require('../../models/db');
const { tokenOptional } = require('../../middlewares/auth');

// POST /api/surga/sync
// Réconcilie les créations/mises à jour accumulées en mode avion
router.post('/sync', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { notes = [], depenses = [], agenda = [] } = req.body;

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        synced_at: new Date().toISOString(),
        message: 'Synchronisation locale (mode invité)',
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Sync notes
      for (const n of notes) {
        if (!n.titre || !n.id) continue;
        await client.query(
          `INSERT INTO surga_notes (id, user_id, titre, contenu, created_at, updated_at)
           VALUES ($1, $2, $3, $4, COALESCE($5, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre,
             contenu = EXCLUDED.contenu,
             updated_at = NOW()
           WHERE surga_notes.user_id = $2`,
          [n.id, userId, n.titre.trim(), n.contenu || '', n.created_at || null]
        );
      }

      // 2. Sync dépenses
      for (const d of depenses) {
        if (!d.montant_xof || !d.id) continue;
        const montant = parseInt(d.montant_xof, 10);
        if (Number.isNaN(montant) || montant <= 0) continue;
        await client.query(
          `INSERT INTO surga_depenses (id, user_id, montant_xof, categorie, date_depense, note, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET
             montant_xof = EXCLUDED.montant_xof,
             categorie = EXCLUDED.categorie,
             date_depense = EXCLUDED.date_depense,
             note = EXCLUDED.note,
             updated_at = NOW()
           WHERE surga_depenses.user_id = $2`,
          [
            d.id,
            userId,
            montant,
            d.categorie || 'Autre',
            d.date_depense || new Date().toISOString().slice(0, 10),
            d.note || null,
            d.created_at || null,
          ]
        );
      }

      // 3. Sync agenda & rappels
      for (const a of agenda) {
        if (!a.titre || !a.id) continue;
        await client.query(
          `INSERT INTO surga_agenda (id, user_id, titre, description, date_evenement, heure_evenement, est_rappel, repetition, termine, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre,
             description = EXCLUDED.description,
             date_evenement = EXCLUDED.date_evenement,
             heure_evenement = EXCLUDED.heure_evenement,
             est_rappel = EXCLUDED.est_rappel,
             repetition = EXCLUDED.repetition,
             termine = EXCLUDED.termine,
             updated_at = NOW()
           WHERE surga_agenda.user_id = $2`,
          [
            a.id,
            userId,
            a.titre.trim(),
            a.description || null,
            a.date_evenement || new Date().toISOString().slice(0, 10),
            a.heure_evenement || null,
            Boolean(a.est_rappel ?? true),
            a.repetition || 'AUCUNE',
            Boolean(a.termine),
            a.created_at || null,
          ]
        );
      }

      await client.query('COMMIT');

      // Récupération de l'état consolidé
      const freshNotes = await pool.query(
        'SELECT * FROM surga_notes WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
      );

      const freshDepenses = await pool.query(
        'SELECT * FROM surga_depenses WHERE user_id = $1 ORDER BY date_depense DESC, created_at DESC',
        [userId]
      );

      const freshAgenda = await pool.query(
        'SELECT * FROM surga_agenda WHERE user_id = $1 ORDER BY date_evenement ASC, heure_evenement ASC NULLS LAST',
        [userId]
      );

      return res.json({
        success: true,
        synced_at: new Date().toISOString(),
        notes: freshNotes.rows,
        depenses: freshDepenses.rows,
        agenda: freshAgenda.rows,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[SURGA SYNC ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Échec de la synchronisation' });
  }
});

module.exports = router;
