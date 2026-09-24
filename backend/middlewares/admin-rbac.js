// backend/middlewares/admin-rbac.js
// Sécurité et contrôle d'accès RBAC (Role-Based Access Control) pour l'administration Nopalou

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../models/db');

function secretsMatch(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ── Hiérarchie et matrices de permissions par défaut ──
const ROLE_PERMISSIONS = {
  super_admin: { all: true },
  admin_operationnel: {
    'users:view': true, 'users:edit': true, 'users:suspend': true,
    'boutiques:view': true, 'boutiques:edit': true,
    'produits:view': true, 'produits:edit': true, 'produits:moderate': true,
    'commandes:view': true, 'commandes:edit': true,
    'pos:view': true, 'pos:edit': true,
    'immo:view': true, 'immo:moderate': true,
    'crm:view': true, 'crm:edit': true,
    'whatsapp:view': true, 'whatsapp:edit': true,
    'settings:view': true,
    'audit:view': true,
  },
  finance: {
    'finances:view': true, 'finances:export': true,
    'paiements:view': true, 'paiements:validate': true,
    'reversements:view': true, 'reversements:execute': true,
    'abonnements:view': true, 'abonnements:edit': true,
    'plans:view': true, 'plans:edit': true,
    'credits:view': true, 'credits:edit': true,
    'commandes:view': true,
    'audit:view': true,
  },
  support_client: {
    'users:view': true,
    'boutiques:view': true,
    'commandes:view': true,
    'immo:view': true,
    'whatsapp:view': true, 'whatsapp:reply': true,
    'crm:view': true,
  },
  moderateur: {
    'produits:view': true, 'produits:moderate': true,
    'annonces:view': true, 'annonces:moderate': true,
    'immo:view': true, 'immo:moderate': true,
    'boutiques:view': true,
  },
};

/**
 * Extrait le token admin ou le secret depuis les cookies ou les headers
 */
function extractAdminCredentials(req) {
  const authHeader = req.headers['authorization'];
  let jwtToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const cookies = req.headers.cookie
    ? Object.fromEntries(
        req.headers.cookie.split(';').map((c) => {
          const parts = c.trim().split('=');
          return [parts[0], decodeURIComponent(parts.slice(1).join('='))];
        })
      )
    : {};

  if (!jwtToken) {
    jwtToken = cookies['nopalou_admin_jwt'];
  }

  const headerSecret = req.headers['x-admin-secret'];
  const cookieSecret = cookies['nopalou_admin'];

  // Si x-admin-secret commence par eyJ, c'est en fait un token JWT
  if (!jwtToken && typeof headerSecret === 'string' && headerSecret.startsWith('eyJ')) {
    jwtToken = headerSecret;
  }
  if (!jwtToken && typeof cookieSecret === 'string' && cookieSecret.startsWith('eyJ')) {
    jwtToken = cookieSecret;
  }

  // Le secret technique break-glass ne doit jamais être un JWT
  let rawSecret = headerSecret && !headerSecret.startsWith('eyJ') ? headerSecret : null;
  if (!rawSecret && cookieSecret && !cookieSecret.startsWith('eyJ')) {
    rawSecret = cookieSecret;
  }

  return { jwtToken, rawSecret };
}

/**
 * Middleware d'authentification administrative
 * Accepte :
 * 1. Un token JWT valide signé avec JWT_SECRET (compte nominatif ou super_admin)
 * 2. Un X-Admin-Secret ou cookie nopalou_admin valide (Break-glass Super Admin)
 */
async function requireAdminAuth(req, res, next) {
  const { jwtToken, rawSecret } = extractAdminCredentials(req);
  const adminSecret = process.env.ADMIN_SECRET;

  // 1. Authentification par JWT nominatif
  if (jwtToken) {
    try {
      const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
      if (decoded.scope === 'nopalou_admin') {
        const { rows } = await pool.query(
          'SELECT id, nom, email, role, permissions, actif FROM admin_utilisateurs WHERE id = $1',
          [decoded.adminId]
        );
        if (rows[0] && rows[0].actif) {
          req.adminUser = {
            id: rows[0].id,
            nom: rows[0].nom,
            email: rows[0].email,
            role: rows[0].role,
            permissions: { ...(ROLE_PERMISSIONS[rows[0].role] || {}), ...(rows[0].permissions || {}) },
          };
          return next();
        }
        // Support pour super_admin technique break-glass généré par login
        if (decoded.role === 'super_admin') {
          req.adminUser = {
            id: decoded.adminId || '00000000-0000-0000-0000-000000000000',
            nom: 'Super Administrateur',
            email: decoded.email || 'admin@nopalou.com',
            role: 'super_admin',
            permissions: { all: true },
          };
          return next();
        }
      }
    } catch (err) {
      // Si le token est expiré ou invalide, tester le fallback break-glass ci-dessous
    }
  }

  // 2. Fallback Break-glass avec ADMIN_SECRET (accès racine technique)
  if (adminSecret && adminSecret.trim().length > 0 && rawSecret && secretsMatch(rawSecret, adminSecret)) {
    req.adminUser = {
      id: '00000000-0000-0000-0000-000000000000',
      nom: 'Super Admin (Break-glass)',
      email: 'root@nopalou.internal',
      role: 'super_admin',
      permissions: { all: true },
    };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Session administrative requise ou expirée. Veuillez vous reconnecter.',
    code: 'ADMIN_UNAUTHORIZED',
  });
}

/**
 * Garde de rôle strict (ex: requireAdminRole('super_admin', 'finance'))
 */
function requireAdminRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (req.adminUser.role === 'super_admin' || allowedRoles.includes(req.adminUser.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Accès refusé. Rôle requis : [${allowedRoles.join(', ')}]. Votre rôle : ${req.adminUser.role}`,
      code: 'ADMIN_FORBIDDEN_ROLE',
    });
  };
}

/**
 * Garde de permission granulaire (ex: requireAdminPermission('users:suspend'))
 */
function requireAdminPermission(permissionKey) {
  return (req, res, next) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    const perms = req.adminUser.permissions || {};
    if (perms.all || perms[permissionKey]) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Permission manquante : ${permissionKey}`,
      code: 'ADMIN_FORBIDDEN_PERMISSION',
    });
  };
}

module.exports = {
  requireAdminAuth,
  requireAdminRole,
  requireAdminPermission,
  ROLE_PERMISSIONS,
  secretsMatch,
};
