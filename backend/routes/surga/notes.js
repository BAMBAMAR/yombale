// backend/routes/surga/notes.js
// API CRUD pour le carnet de notes Surga (Tranche 3)
// Zéro émoji, sécurité multi-tenant, résilience hors ligne

const express = require('express');
const router = express.Router();
const { pool } = require('../../models/db');
const { tokenOptional } = require('../../middlewares/auth');

// GET /api/surga/notes
// Liste les notes avec filtre de recherche optionnel
router.get('/notes', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const query = req.query.q ? String(req.query.q).trim() : '';

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        notes: [],
        message: 'Mode invité actif : données locales uniquement',
      });
    }

    let sql = 'SELECT * FROM surga_notes WHERE user_id = $1';
    const params = [userId];

    if (query) {
      sql += ' AND (titre ILIKE $2 OR contenu ILIKE $2)';
      params.push(`%${query}%`);
    }

    sql += ' ORDER BY updated_at DESC';

    const { rows } = await pool.query(sql, params);
    return res.json({
      success: true,
      notes: rows,
    });
  } catch (err) {
    console.error('[SURGA NOTES GET ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des notes' });
  }
});

// POST /api/surga/notes
// Crée une note ou upsert si un UUID client est fourni
router.post('/notes', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id, titre, contenu } = req.body;

    if (!titre || typeof titre !== 'string' || !titre.trim()) {
      return res.status(400).json({ success: false, error: 'Le titre de la note est obligatoire' });
    }

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        note: {
          id: id || `local_${Date.now()}`,
          titre: titre.trim(),
          contenu: contenu || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    let query;
    let params;

    if (id) {
      // Upsert si un ID UUID a été généré hors ligne
      query = `
        INSERT INTO surga_notes (id, user_id, titre, contenu, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (id) DO UPDATE SET
          titre = EXCLUDED.titre,
          contenu = EXCLUDED.contenu,
          updated_at = NOW()
        WHERE surga_notes.user_id = $2
        RETURNING *
      `;
      params = [id, userId, titre.trim(), contenu || ''];
    } else {
      query = `
        INSERT INTO surga_notes (user_id, titre, contenu)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      params = [userId, titre.trim(), contenu || ''];
    }

    const { rows } = await pool.query(query, params);
    return res.status(201).json({
      success: true,
      note: rows[0],
    });
  } catch (err) {
    console.error('[SURGA NOTES POST ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de l’enregistrement de la note' });
  }
});

// PUT /api/surga/notes/:id
// Met à jour une note existante avec contrôle IDOR
router.put('/notes/:id', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;
    const { titre, contenu } = req.body;

    if (!titre || typeof titre !== 'string' || !titre.trim()) {
      return res.status(400).json({ success: false, error: 'Le titre de la note est obligatoire' });
    }

    if (!userId) {
      return res.json({
        success: true,
        guest: true,
        note: { id, titre: titre.trim(), contenu: contenu || '', updated_at: new Date().toISOString() },
      });
    }

    const { rows } = await pool.query(
      `UPDATE surga_notes
       SET titre = $1, contenu = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [titre.trim(), contenu || '', id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Note introuvable ou non autorisée' });
    }

    return res.json({
      success: true,
      note: rows[0],
    });
  } catch (err) {
    console.error('[SURGA NOTES PUT ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour de la note' });
  }
});

// DELETE /api/surga/notes/:id
// Supprime une note avec contrôle IDOR
router.delete('/notes/:id', tokenOptional, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.json({ success: true, guest: true, deletedId: id });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM surga_notes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Note introuvable ou déjà supprimée' });
    }

    return res.json({ success: true, message: 'Note supprimée avec succès', deletedId: id });
  } catch (err) {
    console.error('[SURGA NOTES DELETE ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Erreur lors de la suppression de la note' });
  }
});

module.exports = router;
