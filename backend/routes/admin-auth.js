// backend/routes/admin-auth.js
// Authentification nominative sécurisée et gestion de session du personnel d'administration

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');
const { requireAdminAuth, secretsMatch, ROLE_PERMISSIONS } = require('../middlewares/admin-rbac');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// POST /api/admin/auth/login — Connexion nominative ou Break-glass
router.post('/login', async (req, res) => {
  try {
    const { email, password, secret } = req.body || {};
    const adminSecret = process.env.ADMIN_SECRET;

    // Option A : Authentification Break-glass par Secret Maître
    if (secret && adminSecret && secretsMatch(secret, adminSecret)) {
      // Trouver ou créer le compte super_admin technique
      let adminRow = null;
      const { rows } = await pool.query("SELECT * FROM admin_utilisateurs WHERE role = 'super_admin' AND actif = TRUE LIMIT 1");
      if (rows[0]) {
        adminRow = rows[0];
      } else {
        adminRow = {
          id: '00000000-0000-0000-0000-000000000000',
          nom: 'Super Administrateur',
          email: process.env.ADMIN_EMAIL || 'admin@nopalou.com',
          role: 'super_admin',
        };
      }

      const token = jwt.sign(
        { adminId: adminRow.id, email: adminRow.email, role: 'super_admin', scope: 'nopalou_admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const isSecure = process.env.NODE_ENV === 'production';
      res.setHeader('Set-Cookie', [
        `nopalou_admin_jwt=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400}${isSecure ? '; Secure' : ''}`,
        `nopalou_admin=${encodeURIComponent(secret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400}${isSecure ? '; Secure' : ''}`,
      ]);

      await enregistrerAdminLog({
        adminNom: adminRow.nom,
        adminRole: 'super_admin',
        action: 'admin_login_breakglass',
        cibleType: 'auth',
        description: `Connexion d'urgence Break-glass effectuée pour ${adminRow.email}`,
        req,
      });

      return res.json({
        success: true,
        token,
        admin: {
          id: adminRow.id,
          nom: adminRow.nom,
          email: adminRow.email,
          role: 'super_admin',
          permissions: { all: true },
        },
      });
    }

    if (secret) {
      return res.status(401).json({ error: 'Secret administrateur incorrect.' });
    }

    // Option B : Authentification nominative (Email + Mot de passe)
    const motDePasse = password || req.body?.motDePasse;
    if (!email || !motDePasse) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const { rows: users } = await pool.query(
      'SELECT id, nom, email, mot_de_passe_hash, role, permissions, actif FROM admin_utilisateurs WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Identifiants administratifs incorrects.' });
    }

    if (!user.actif) {
      return res.status(403).json({ error: 'Votre compte administratif est suspendu ou désactivé.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiants administratifs incorrects.' });
    }

    // Mettre à jour la date de dernière connexion
    await pool.query('UPDATE admin_utilisateurs SET derniere_connexion_at = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { adminId: user.id, email: user.email, role: user.role, scope: 'nopalou_admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isSecure = process.env.NODE_ENV === 'production';
    const cookieHeaders = [
      `nopalou_admin_jwt=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${7 * 86400}${isSecure ? '; Secure' : ''}`,
      // SÉCURITÉ P1 : Suppression du cookie nopalou_admin contenant ADMIN_SECRET en clair.
      // L'authentification administrative repose exclusivement sur le JWT nominatif ci-dessus.
      // Le mécanisme break-glass via ADMIN_SECRET reste disponible en console serveur uniquement.
    ];
    res.setHeader('Set-Cookie', cookieHeaders);

    await enregistrerAdminLog({
      adminNom: user.nom,
      adminRole: user.role,
      action: 'admin_login',
      cibleType: 'auth',
      cibleId: user.id,
      description: `Connexion administrative réussie de ${user.nom} (${user.role})`,
      req,
    });

    res.json({
      success: true,
      token,
      admin: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        permissions: { ...(ROLE_PERMISSIONS[user.role] || {}), ...(user.permissions || {}) },
      },
    });
  } catch (err) {
    console.error('[ADMIN_AUTH_LOGIN_ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la tentative de connexion.' });
  }
});

// POST /api/admin/auth/logout — Déconnexion administrative
router.post('/logout', (req, res) => {
  const isSecure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `nopalou_admin_jwt=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isSecure ? '; Secure' : ''}`,
    `nopalou_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isSecure ? '; Secure' : ''}`,
  ]);
  res.json({ success: true, message: 'Déconnexion effectuée avec succès.' });
});

// GET /api/admin/auth/me — Profil et permissions du staff connecté
router.get('/me', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    admin: req.adminUser,
  });
});

module.exports = router;
