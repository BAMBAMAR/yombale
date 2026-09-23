// backend/routes/admin-support.js
// Centre de gestion Helpdesk, Support Client et Résolution des Litiges

const router = require('express').Router();
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

router.use(requireAdminAuth);
router.use(requireAdminRole('super_admin', 'support_client', 'admin_operationnel'));

// ── GET /api/admin/support/tickets — Liste des tickets paginée avec filtres
router.get('/tickets', async (req, res) => {
  try {
    const { statut, categorie, priorite, q, page = 1, limit: qLimit = 30 } = req.query;
    const limit = Math.min(100, Math.max(1, parseInt(qLimit) || 30));
    const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

    const conds = [];
    const vals = [];
    let i = 1;

    if (statut) { conds.push(`st.statut = $${i}`); vals.push(statut); i++; }
    if (categorie) { conds.push(`st.categorie = $${i}`); vals.push(categorie); i++; }
    if (priorite) { conds.push(`st.priorite = $${i}`); vals.push(priorite); i++; }
    if (q && q.trim()) {
      conds.push(`(st.sujet ILIKE $${i} OR st.numero_ticket ILIKE $${i} OR u.nom ILIKE $${i} OR u.email ILIKE $${i})`);
      vals.push(`%${q.trim()}%`);
      i++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM support_tickets st
       LEFT JOIN utilisateurs u ON u.id = st.utilisateur_id
       ${where}`,
      vals
    );

    const { rows } = await pool.query(
      `SELECT st.id, st.numero_ticket, st.sujet, st.categorie, st.priorite, st.statut, st.created_at, st.updated_at,
              u.id AS utilisateur_id, u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone AS utilisateur_tel,
              b.id AS boutique_id, b.nom AS boutique_nom,
              cmd.reference AS commande_ref,
              adm.nom AS assigne_nom
       FROM support_tickets st
       LEFT JOIN utilisateurs u ON u.id = st.utilisateur_id
       LEFT JOIN boutiques b ON b.id = st.boutique_id
       LEFT JOIN commandes_boutique cmd ON cmd.id = st.commande_id
       LEFT JOIN admin_utilisateurs adm ON adm.id = st.assigne_a
       ${where}
       ORDER BY 
         CASE st.statut 
           WHEN 'ouvert' THEN 1 
           WHEN 'en_cours' THEN 2 
           WHEN 'en_attente_client' THEN 3 
           ELSE 4 
         END,
         st.updated_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    );

    res.json({
      tickets: rows,
      total: countRes.rows[0]?.total || 0,
      page: parseInt(page) || 1,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/support/tickets/:id — Détail d'un ticket et fil de discussion
router.get('/tickets/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT st.*,
              u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone AS utilisateur_tel,
              b.nom AS boutique_nom, b.slug AS boutique_slug,
              cmd.reference AS commande_ref, cmd.montant_total AS commande_montant,
              adm.nom AS assigne_nom
       FROM support_tickets st
       LEFT JOIN utilisateurs u ON u.id = st.utilisateur_id
       LEFT JOIN boutiques b ON b.id = st.boutique_id
       LEFT JOIN commandes_boutique cmd ON cmd.id = st.commande_id
       LEFT JOIN admin_utilisateurs adm ON adm.id = st.assigne_a
       WHERE st.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Ticket introuvable' });
    res.json({ ticket: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/support/tickets/:id/message — Répondre à un ticket
router.post('/tickets/:id/message', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Le message ne peut pas être vide' });
    }

    const { rows: [ticket] } = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [req.params.id]);
    if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' });

    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const nouveauMsg = {
      auteur: req.adminUser?.nom || 'Support Nopalou',
      role: 'admin',
      email: req.adminUser?.email,
      texte: message.trim(),
      date: new Date().toISOString(),
    };

    messages.push(nouveauMsg);

    const { rows: [updated] } = await pool.query(
      `UPDATE support_tickets
       SET messages = $1::jsonb,
           statut = CASE WHEN statut = 'ouvert' THEN 'en_cours' ELSE statut END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(messages), req.params.id]
    );

    await enregistrerAdminLog({
      action: 'support_message_envoye',
      cibleType: 'support_ticket',
      cibleId: req.params.id,
      description: `Réponse ajoutée au ticket ${ticket.numero_ticket}`,
      req,
    });

    res.json({ success: true, ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/support/tickets/:id/statut — Changer statut ou assignation
router.put('/tickets/:id/statut', async (req, res) => {
  try {
    const { statut, priorite, assigne_a } = req.body;
    const sets = ['updated_at = NOW()'];
    const vals = [];

    if (statut) {
      if (!['ouvert', 'en_cours', 'en_attente_client', 'resolu', 'ferme'].includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      vals.push(statut);
      sets.push(`statut = $${vals.length}`);
    }

    if (priorite) {
      if (!['basse', 'normale', 'haute', 'urgente'].includes(priorite)) {
        return res.status(400).json({ error: 'Priorité invalide' });
      }
      vals.push(priorite);
      sets.push(`priorite = $${vals.length}`);
    }

    if (assigne_a !== undefined) {
      vals.push(assigne_a || null);
      sets.push(`assigne_a = $${vals.length}`);
    }

    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE support_tickets SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );

    if (!rows[0]) return res.status(404).json({ error: 'Ticket introuvable' });

    await enregistrerAdminLog({
      action: 'support_statut_modifie',
      cibleType: 'support_ticket',
      cibleId: req.params.id,
      description: `Mise à jour statut/priorité du ticket ${rows[0].numero_ticket}`,
      req,
    });

    res.json({ success: true, ticket: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
