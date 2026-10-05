const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../../models/db');
const { tokenOptional } = require('../../middlewares/auth');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assurerUUID(id, idMappings) {
  if (id && UUID_REGEX.test(id)) {
    return id;
  }
  const cleanUuid = crypto.randomUUID();
  if (id) {
    idMappings[id] = cleanUuid;
  }
  return cleanUuid;
}

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

    const idMappings = {};
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Sync notes
      for (const n of notes) {
        if (!n.titre || !n.id) continue;
        const validId = assurerUUID(n.id, idMappings);
        await client.query(
          `INSERT INTO surga_notes (id, user_id, titre, contenu, created_at, updated_at)
           VALUES ($1, $2, $3, $4, COALESCE($5, NOW()), NOW())
           ON CONFLICT (id) DO UPDATE SET
             titre = EXCLUDED.titre,
             contenu = EXCLUDED.contenu,
             updated_at = NOW()
           WHERE surga_notes.user_id = $2`,
          [validId, userId, n.titre.trim(), n.contenu || '', n.created_at || null]
        );
      }

      // 2. Sync dépenses
      for (const d of depenses) {
        if (!d.montant_xof || !d.id) continue;
        const montant = parseInt(d.montant_xof, 10);
        if (Number.isNaN(montant) || montant <= 0) continue;
        const validId = assurerUUID(d.id, idMappings);
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
            validId,
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
        const validId = assurerUUID(a.id, idMappings);
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
            validId,
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
        id_mappings: idMappings,
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
