// backend/routes/admin-system.js
// Diagnostic approfondi, santé système, mode maintenance & bannières d'alerte

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const cfg = require('../lib/settingsCache');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// ── GET /api/admin/system/health — Diagnostic profond de la plateforme
router.get('/health', adminSecretOnly, async (req, res) => {
  try {
    const startDb = Date.now();
    let dbStatus = 'ok';
    let dbLatency = 0;

    try {
      await pool.query('SELECT 1');
      dbLatency = Date.now() - startDb;
    } catch (err) {
      dbStatus = 'error: ' + err.message;
    }

    // 1. Décompte des tables clés
    const [countsRes] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM utilisateurs) AS utilisateurs,
          (SELECT COUNT(*)::int FROM boutiques) AS boutiques,
          (SELECT COUNT(*)::int FROM boutique_produits) AS produits_marchands,
          (SELECT COUNT(*)::int FROM produits) AS produits_scrapes,
          (SELECT COUNT(*)::int FROM commandes_boutique) AS commandes,
          (SELECT COUNT(*)::int FROM ventes) AS ventes_pos,
          (SELECT COUNT(*)::int FROM abonnements WHERE statut='actif' AND fin > NOW()) AS abonnements_actifs,
          (SELECT COUNT(*)::int FROM admin_audit_logs) AS audit_logs
      `),
    ]);

    // 2. Vérification des configurations de services externes
    const services = {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        poolTotal: pool.totalCount,
        poolIdle: pool.idleCount,
        poolWaiting: pool.waitingCount,
      },
      wave: {
        configured: Boolean(process.env.WAVE_API_KEY),
        mode: process.env.WAVE_API_KEY?.startsWith('wave_sn_prod_') ? 'production' : 'test/sandbox',
      },
      cloudinary: {
        configured: Boolean(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)),
      },
      sentry: {
        configured: Boolean(process.env.SENTRY_DSN),
      },
      whatsapp: {
        configured: Boolean(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_PHONE_NUMBER_ID),
      },
      email: {
        configured: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
      },
    };

    // 3. Mémoire et Uptime
    const mem = process.memoryUsage();
    const serverInfo = {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'development',
      memoryMB: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
      },
    };

    // 4. Paramètres de maintenance et bannière
    const [maintActive, maintMsg, bannerActive, bannerMsg, bannerLevel] = await Promise.all([
      cfg.getBool('maintenance_mode'),
      cfg.get('maintenance_message'),
      cfg.getBool('system_banner_active'),
      cfg.get('system_banner_text'),
      cfg.get('system_banner_level'),
    ]);

    res.json({
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      server: serverInfo,
      services,
      counts: countsRes.rows[0],
      maintenance: {
        active: Boolean(maintActive),
        message: maintMsg || 'La plateforme est momentanément en maintenance pour amélioration.',
      },
      banner: {
        active: Boolean(bannerActive),
        text: bannerMsg || '',
        level: bannerLevel || 'info',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/system/maintenance — Activer/désactiver le mode maintenance
router.put('/maintenance', adminSecretOnly, async (req, res) => {
  try {
    const { active, message } = req.body;
    await cfg.set('maintenance_mode', active ? 'true' : 'false');
    if (message !== undefined) {
      await cfg.set('maintenance_message', message);
    }

    await enregistrerAdminLog({
      action: 'system_maintenance_toggle',
      cibleType: 'system',
      description: `Mode maintenance ${active ? 'ACTIVÉ' : 'DÉSACTIVÉ'}: ${message || ''}`,
      nouvelleValeur: { active, message },
      req,
    });

    res.json({ success: true, active: Boolean(active), message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/system/banner — Publier une bannière d'annonce globale
router.put('/banner', adminSecretOnly, async (req, res) => {
  try {
    const { active, text, level = 'info' } = req.body;
    await cfg.set('system_banner_active', active ? 'true' : 'false');
    if (text !== undefined) await cfg.set('system_banner_text', text);
    if (level !== undefined) await cfg.set('system_banner_level', level);

    await enregistrerAdminLog({
      action: 'system_banner_update',
      cibleType: 'system',
      description: `Bannière système ${active ? 'PUBLIÉE' : 'MASQUÉE'}: "${text || ''}" (Niveau: ${level})`,
      nouvelleValeur: { active, text, level },
      req,
    });

    res.json({ success: true, active: Boolean(active), text, level });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
