// backend/routes/admin-equipe.js
// Gestion des comptes du personnel d'administration Nopalou et attribution des rôles RBAC

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../models/db');
const { requireAdminAuth, requireAdminRole } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// Toutes les routes de gestion de l'équipe exigent le rôle Super Admin
router.use(requireAdminAuth);
router.use(requireAdminRole('super_admin'));

// ── GET /api/admin/equipe — Liste des administrateurs
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nom, email, role, permissions, actif, derniere_connexion_at, created_at, updated_at
      FROM admin_utilisateurs
      ORDER BY created_at ASC
    `);
    res.json({ success: true, membres: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/equipe — Créer un nouveau membre staff
router.post('/', async (req, res) => {
  try {
    const { nom, email, password, role = 'admin_operationnel', permissions = {} } = req.body;
    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'Nom, email et mot de passe requis.' });
    }

    const validRoles = ['super_admin', 'admin_operationnel', 'support_client', 'moderateur', 'finance'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rôle invalide. Rôles autorisés : ${validRoles.join(', ')}` });
    }

    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO admin_utilisateurs (nom, email, mot_de_passe_hash, role, permissions, actif)
       VALUES ($1, LOWER($2), $3, $4, $5, TRUE)
       RETURNING id, nom, email, role, permissions, actif, created_at`,
      [nom.trim(), email.trim(), hash, role, JSON.stringify(permissions)]
    );

    await enregistrerAdminLog({
      action: 'admin_member_created',
      cibleType: 'admin_utilisateur',
      cibleId: rows[0].id,
      description: `Création du compte administrateur ${nom} (${email}) avec le rôle ${role}`,
      nouvelleValeur: { id: rows[0].id, nom, email, role },
      req,
    });

    res.json({ success: true, membre: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Un compte administrateur avec cette adresse email existe déjà.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/equipe/:id — Modifier rôle, statut ou permissions
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, role, permissions, actif, password } = req.body;

    const cur = await pool.query('SELECT * FROM admin_utilisateurs WHERE id = $1', [id]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Membre introuvable' });

    // Empêcher l'auto-désactivation du dernier super_admin
    if (cur.rows[0].role === 'super_admin' && actif === false) {
      const { rows: superCount } = await pool.query(
        "SELECT COUNT(*)::int AS count FROM admin_utilisateurs WHERE role = 'super_admin' AND actif = TRUE AND id != $1",
        [id]
      );
      if (superCount[0]?.count === 0) {
        return res.status(400).json({ error: 'Impossible de désactiver le seul Super Administrateur actif de la plateforme.' });
      }
    }

    const updates = [];
    const values = [];
    let i = 1;

    if (nom) { updates.push(`nom = $${i++}`); values.push(nom.trim()); }
    if (role) { updates.push(`role = $${i++}`); values.push(role); }
    if (permissions !== undefined) { updates.push(`permissions = $${i++}`); values.push(JSON.stringify(permissions)); }
    if (actif !== undefined) { updates.push(`actif = $${i++}`); values.push(Boolean(actif)); }
    if (password && password.trim().length >= 6) {
      const hash = await bcrypt.hash(password.trim(), 10);
      updates.push(`mot_de_passe_hash = $${i++}`);
      values.push(hash);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE admin_utilisateurs SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, nom, email, role, permissions, actif, updated_at`,
      values
    );

    await enregistrerAdminLog({
      action: 'admin_member_updated',
      cibleType: 'admin_utilisateur',
      cibleId: id,
      description: `Mise à jour du compte administrateur ${rows[0].nom} (${rows[0].email})`,
      ancienneValeur: { nom: cur.rows[0].nom, role: cur.rows[0].role, actif: cur.rows[0].actif },
      nouvelleValeur: { nom: rows[0].nom, role: rows[0].role, actif: rows[0].actif },
      req,
    });

    res.json({ success: true, membre: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/equipe/:id — Supprimer un compte staff
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.adminUser.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' });
    }

    const cur = await pool.query('SELECT nom, email, role FROM admin_utilisateurs WHERE id = $1', [id]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Membre introuvable' });

    await pool.query('DELETE FROM admin_utilisateurs WHERE id = $1', [id]);

    await enregistrerAdminLog({
      action: 'admin_member_deleted',
      cibleType: 'admin_utilisateur',
      cibleId: id,
      description: `Suppression du compte administrateur ${cur.rows[0].nom} (${cur.rows[0].email})`,
      req,
    });

    res.json({ success: true, message: 'Compte administrateur supprimé.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
