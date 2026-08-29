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

    // 1. Décompte résilient des tables clés
    const safeCount = async (sql) => {
      try {
        const r = await pool.query(sql);
        return parseInt(r.rows[0]?.c ?? r.rows[0]?.count ?? 0, 10);
      } catch (e) {
        return 0;
      }
    };

    const [
      nbUtilisateurs,
      nbBoutiques,
      nbProduitsMarchands,
      nbProduitsScrapes,
      nbCommandes,
      nbVentesPos,
      nbAbonnementsActifs,
      nbAuditLogs,
    ] = await Promise.all([
      safeCount('SELECT COUNT(*)::int AS c FROM utilisateurs'),
      safeCount('SELECT COUNT(*)::int AS c FROM boutiques'),
      safeCount('SELECT COUNT(*)::int AS c FROM boutique_produits'),
      safeCount('SELECT COUNT(*)::int AS c FROM produits'),
      safeCount('SELECT COUNT(*)::int AS c FROM commandes_boutique'),
      safeCount('SELECT COUNT(*)::int AS c FROM ventes'),
      safeCount("SELECT COUNT(*)::int AS c FROM abonnements WHERE statut='actif' AND fin > NOW()"),
      safeCount('SELECT COUNT(*)::int AS c FROM admin_audit_logs'),
    ]);

    const counts = {
      utilisateurs: nbUtilisateurs,
      boutiques: nbBoutiques,
      produits_marchands: nbProduitsMarchands,
      produits_scrapes: nbProduitsScrapes,
      commandes: nbCommandes,
      ventes_pos: nbVentesPos,
      abonnements_actifs: nbAbonnementsActifs,
      audit_logs: nbAuditLogs,
    };

    // 2. Vérification des configurations de services externes
    const services = {
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        poolTotal: pool.totalCount ?? 0,
        poolIdle: pool.idleCount ?? 0,
        poolWaiting: pool.waitingCount ?? 0,
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
      cfg.getBool('maintenance_mode').catch(() => false),
      cfg.get('maintenance_message').catch(() => 'Plateforme en maintenance programmée.'),
      cfg.getBool('system_banner_active').catch(() => false),
      cfg.get('system_banner_text').catch(() => ''),
      cfg.get('system_banner_level').catch(() => 'info'),
    ]);

    res.json({
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      server: serverInfo,
      services,
      counts,
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
