// backend/routes/agence-logs.js
// Journal d'audit et historique des activités de l'agence immobilière

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// ── GET /api/agences/agence/:slugOrId/logs ──
router.get('/agence/:slugOrId/logs', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { type, q, limit = 150, offset = 0 } = req.query;

    let queryParts = ['agence_id = $1'];
    let values = [agenceId];
    let vIndex = 2;

    if (type && type !== 'tous') {
      queryParts.push(`type_action ILIKE $${vIndex++}`);
      values.push(`%${type}%`);
    }

    if (q && q.trim()) {
      queryParts.push(`(auteur_nom ILIKE $${vIndex} OR description ILIKE $${vIndex})`);
      values.push(`%${q.trim()}%`);
      vIndex++;
    }

    const limitVal = Math.min(parseInt(limit, 10) || 150, 500);
    const offsetVal = Math.max(parseInt(offset, 10) || 0, 0);

    const sql = `
      SELECT id, auteur_nom, type_action, description, metadonnees, ip_adresse, created_at
      FROM agence_logs
      WHERE ${queryParts.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT ${limitVal} OFFSET ${offsetVal}
    `;

    const { rows } = await pool.query(sql, values);

    // Compte total
    const countSql = `
      SELECT COUNT(*) AS total
      FROM agence_logs
      WHERE ${queryParts.join(' AND ')}
    `;
    const countRes = await pool.query(countSql, values.slice(0, vIndex - 1));

    res.json({
      success: true,
      logs: rows,
      total: parseInt(countRes.rows[0]?.total || '0', 10),
    });
  } catch (err) {
    // Si la table n'existe pas encore, renvoyer un tableau vide sans crasher
    if (err.code === '42P01') {
      return res.json({ success: true, logs: [], total: 0 });
    }
    console.error('[GET /api/agences/agence/:slugOrId/logs]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération du journal d\'activité' });
  }
});

// ── GET /api/agences/agence/:slugOrId/logs/export.csv ──
router.get('/agence/:slugOrId/logs/export.csv', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const agenceNom = req.agence.slug || 'agence';
    const { type, q } = req.query;

    let queryParts = ['agence_id = $1'];
    let values = [agenceId];
    let vIndex = 2;

    if (type && type !== 'tous') {
      queryParts.push(`type_action ILIKE $${vIndex++}`);
      values.push(`%${type}%`);
    }

    if (q && q.trim()) {
      queryParts.push(`(auteur_nom ILIKE $${vIndex} OR description ILIKE $${vIndex})`);
      values.push(`%${q.trim()}%`);
      vIndex++;
    }

    const sql = `
      SELECT created_at, auteur_nom, type_action, description, ip_adresse
      FROM agence_logs
      WHERE ${queryParts.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT 2000
    `;

    const { rows } = await pool.query(sql, values);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${agenceNom}_journal_activite_${new Date().toISOString().slice(0, 10)}.csv"`);

    res.write('\uFEFF');
    res.write('Date;Heure;Auteur;Type d\'action;Description;IP\n');

    const sanitizeCell = (txt) => {
      let str = String(txt || '').replace(/;/g, ',').replace(/\n/g, ' ').replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    for (const l of rows) {
      const d = new Date(l.created_at);
      const dateStr = d.toLocaleDateString('fr-FR');
      const heureStr = d.toLocaleTimeString('fr-FR');
      res.write(`${dateStr};${heureStr};${sanitizeCell(l.auteur_nom)};${sanitizeCell(l.type_action)};${sanitizeCell(l.description)};${sanitizeCell(l.ip_adresse || '')}\n`);
    }

    res.end();
  } catch (err) {
    console.error('[GET /api/agences/agence/:slugOrId/logs/export.csv]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'exportation CSV du journal' });
  }
});

module.exports = router;
