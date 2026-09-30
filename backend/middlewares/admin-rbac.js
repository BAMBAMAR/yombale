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

// ── AUD-030 : verrou anti-devinette du secret maître (mémoire du processus, par adresse IP) ──
const SECRET_MAX_FAILS = 10;
const SECRET_WINDOW_MS = 15 * 60 * 1000;
const _secretFails = new Map();
function clientIp(req) { return req.ip || (req.socket && req.socket.remoteAddress) || 'inconnue'; }
function secretGuessFail(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const e = _secretFails.get(ip);
  if (!e || now > e.reset) _secretFails.set(ip, { n: 1, reset: now + SECRET_WINDOW_MS });
  else e.n += 1;
  if (_secretFails.size > 5000) { // borne mémoire : purge des entrées expirées
    for (const [k, v] of _secretFails) if (now > v.reset) _secretFails.delete(k);
  }
}
function secretGuessLocked(req) {
  const e = _secretFails.get(clientIp(req));
  return !!e && Date.now() <= e.reset && e.n >= SECRET_MAX_FAILS;
}
function secretGuessReset(req) { _secretFails.delete(clientIp(req)); }

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
        // AUD-041 : un compte nominatif désactivé ou supprimé est révoqué immédiatement.
        // Le rôle inscrit dans le jeton ne suffit jamais : seul le compte technique break-glass
        // (identifiant nul, émis par login avec le secret maître) n'a pas de ligne en base.
        const BREAK_GLASS_ID = '00000000-0000-0000-0000-000000000000';
        if (decoded.role === 'super_admin' && decoded.adminId === BREAK_GLASS_ID && !rows[0]) {
          req.adminUser = {
            id: decoded.adminId || '00000000-0000-0000-0000-000000000000',
            nom: 'Super Administrateur',
            email: decoded.email || process.env.ADMIN_EMAIL || 'contact@nopalou.com',
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
  // AUD-030 : le secret est acceptable en en-tête sur toutes les routes admin ; sans limite dédiée il pouvait être
  // deviné à raison du quota global (1000 requêtes / 15 min / IP). Verrou par adresse IP après échecs répétés.
  if (rawSecret && secretGuessLocked(req)) {
    return res.status(429).json({
      success: false,
      error: 'Trop de tentatives d’authentification administrateur. Réessayez plus tard.',
      code: 'ADMIN_SECRET_LOCKED',
    });
  }
  if (adminSecret && adminSecret.trim().length > 0 && rawSecret && secretsMatch(rawSecret, adminSecret)) {
    secretGuessReset(req);
    console.warn(`[ADMIN BREAK-GLASS] accès par secret maître : ${req.method} ${String(req.originalUrl || '').split('?')[0]} (ip ${clientIp(req)})`);
    req.adminUser = {
      id: '00000000-0000-0000-0000-000000000000',
      nom: 'Super Admin (Break-glass)',
      email: 'root@nopalou.internal',
      role: 'super_admin',
      permissions: { all: true },
    };
    return next();
  }

  if (rawSecret) secretGuessFail(req); // secret fourni mais faux (ou non configuré) : compte comme un échec
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

/**
 * AUD-028 : garde RBAC par ressource. Lecture (GET/HEAD/OPTIONS) => `<ressource>:view`,
 * toute autre méthode => `<ressource>:edit` (ou la clé fournie dans `options.edit`).
 * `super_admin` (permissions.all) passe toujours. Mode via RBAC_MODE : `enforce` (défaut), `log` (journalise
 * sans bloquer, pour une mise en production progressive) ou `off`.
 */
function requireAdminAccess(resource, options = {}) {
  const viewKey = options.view || `${resource}:view`;
  const editKey = options.edit || `${resource}:edit`;
  return (req, res, next) => {
    if (!req.adminUser) return res.status(401).json({ error: 'Non authentifié' });
    const mode = String(process.env.RBAC_MODE || 'enforce').toLowerCase();
    const lecture = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const key = lecture ? viewKey : editKey;
    const perms = req.adminUser.permissions || {};
    if (perms.all || perms[key] || mode === 'off') return next();
    if (mode === 'log') {
      console.warn(`[RBAC LOG] ${req.adminUser.role} aurait été refusé : ${req.method} ${req.originalUrl} (permission ${key})`);
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Permission manquante : ${key}`,
      code: 'ADMIN_FORBIDDEN_PERMISSION',
    });
  };
}

/** Raccourci pour les routes à authentification par route : [authentification admin, garde RBAC de la ressource]. */
function adminAccess(resource, options) {
  return [requireAdminAuth, requireAdminAccess(resource, options)];
}

module.exports = {
  requireAdminAuth,
  requireAdminRole,
  requireAdminPermission,
  requireAdminAccess,
  adminAccess,
  ROLE_PERMISSIONS,
  secretsMatch,
};
