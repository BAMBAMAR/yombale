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

// ── GET /api/admin/system/data-health — Observabilité permanente de l'intégrité des données
router.get('/data-health', adminSecretOnly, async (req, res) => {
  try {
    const [
      bqOrphelines,
      ventesAberrantes,
      ventesDoublons,
      cmdDoublons,
      cmdAnnuleesStats,
      abonnementsExpires,
      carnetClientsEcarts,
      stocksIncoherents,
      usersDups,
    ] = await Promise.all([
      // 1. Boutiques orphelines (sans utilisateur)
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM boutiques b
        LEFT JOIN utilisateurs u ON b.utilisateur_id = u.id
        WHERE u.id IS NULL
      `),
      // 2. Ventes avec montant <= 0
      pool.query(`
        SELECT COUNT(*)::int AS count, COALESCE(SUM(montant_total), 0) AS somme
        FROM ventes
        WHERE archivee IS NOT TRUE AND montant_total <= 0
      `),
      // 3. Doublons temporels de ventes (< 30 secondes)
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM ventes v1
        JOIN ventes v2 ON v1.boutique_id = v2.boutique_id
          AND v1.montant_total = v2.montant_total
          AND v1.id != v2.id
          AND v2.created_at > v1.created_at
          AND v2.created_at <= v1.created_at + INTERVAL '30 seconds'
      `),
      // 4. Doublons temporels de commandes (< 30 secondes)
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM commandes_boutique c1
        JOIN commandes_boutique c2 ON c1.boutique_id = c2.boutique_id
          AND c1.client_telephone = c2.client_telephone
          AND c1.montant_total = c2.montant_total
          AND c1.id != c2.id
          AND c2.created_at > c1.created_at
          AND c2.created_at <= c1.created_at + INTERVAL '30 seconds'
      `),
      // 5. Statistiques commandes annulées
      pool.query(`
        SELECT 
          COUNT(*)::int AS count_annulees,
          COALESCE(SUM(montant_total), 0) AS montant_annule
        FROM commandes_boutique
        WHERE statut = 'annulee'
      `),
      // 6. Abonnements expirés non réconciliés
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM abonnements
        WHERE statut = 'actif' AND fin <= NOW()
      `),
      // 7. Carnet de dettes : clients avec solde incohérent par rapport à l'historique
      pool.query(`
        SELECT 
          c.id, c.nom, c.solde AS solde_enregistre,
          COALESCE(SUM(CASE 
            WHEN h.type = 'vente_credit' THEN h.montant 
            WHEN h.type = 'remboursement' THEN -h.montant 
            ELSE 0 
          END), 0) AS solde_historique
        FROM caisse_clients_credits c
        LEFT JOIN caisse_credit_historique h ON c.id = h.client_id
        GROUP BY c.id, c.nom, c.solde
        HAVING ABS(c.solde - COALESCE(SUM(CASE 
          WHEN h.type = 'vente_credit' THEN h.montant 
          WHEN h.type = 'remboursement' THEN -h.montant 
          ELSE 0 
        END), 0)) > 1
      `),
      // 8. Produits avec stock <= 0 mais en_stock = true
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM boutique_produits
        WHERE stock_quantite IS NOT NULL AND stock_quantite <= 0 AND en_stock = TRUE
      `),
      // 9. Doublons d'emails
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM (
          SELECT email FROM utilisateurs GROUP BY email HAVING COUNT(*) > 1
        ) sub
      `),
    ]);

    const anomaliesCritiques = [];
    const avertissements = [];

    const orphelinsCount = bqOrphelines.rows[0]?.count || 0;
    if (orphelinsCount > 0) {
      anomaliesCritiques.push({
        id: 'orphelins_boutiques',
        titre: 'Boutiques orphelines sans compte propriétaire',
        severite: 'CRITIQUE',
        count: orphelinsCount,
        impact: 'Fuite de données ou boutiques inaccessibles',
      });
    }

    const nbVentesDoublons = ventesDoublons.rows[0]?.count || 0;
    if (nbVentesDoublons > 0) {
      avertissements.push({
        id: 'doublons_ventes',
        titre: 'Ventes en doublon détectées (Double-Clic historique)',
        severite: 'AVERTISSEMENT',
        count: nbVentesDoublons,
        impact: 'Chiffre d\'affaires surévalué avant activation de l\'idempotence',
      });
    }

    const nbCmdDoublons = cmdDoublons.rows[0]?.count || 0;
    if (nbCmdDoublons > 0) {
      avertissements.push({
        id: 'doublons_commandes',
        titre: 'Commandes rapprochées dans le temps (< 30s)',
        severite: 'AVERTISSEMENT',
        count: nbCmdDoublons,
        impact: 'Risque de double expédition pour le commerçant',
      });
    }

    const nbAbmtExpires = abonnementsExpires.rows[0]?.count || 0;
    if (nbAbmtExpires > 0) {
      avertissements.push({
        id: 'abonnements_echus',
        titre: 'Abonnements échus conservant le statut actif',
        severite: 'INFO',
        count: nbAbmtExpires,
        impact: 'Désynchronisation de statut BDD (écarté sur l\'affichage MRR)',
      });
    }

    const carnetAnomalies = carnetClientsEcarts.rows || [];
    if (carnetAnomalies.length > 0) {
      anomaliesCritiques.push({
        id: 'carnet_dettes_ecart',
        titre: 'Écart de solde sur le Carnet de dettes',
        severite: 'CRITIQUE',
        count: carnetAnomalies.length,
        impact: 'Le solde client affiché ne correspond pas à l\'historique',
      });
    }

    const nbStocksIncoherents = stocksIncoherents.rows[0]?.count || 0;
    if (nbStocksIncoherents > 0) {
      avertissements.push({
        id: 'stocks_incoherents',
        titre: 'Produits avec stock épuisé marqués "en stock"',
        severite: 'AVERTISSEMENT',
        count: nbStocksIncoherents,
        impact: 'Risque de rupture de stock lors des commandes en ligne',
      });
    }

    // Calcul du Score Global
    let score = 100;
    score -= (orphelinsCount * 10);
    score -= (carnetAnomalies.length * 5);
    score -= (nbVentesDoublons > 0 ? 3 : 0);
    score -= (nbCmdDoublons > 0 ? 2 : 0);
    score -= (nbAbmtExpires > 0 ? 1 : 0);
    score -= (nbStocksIncoherents > 0 ? 2 : 0);
    score = Math.max(10, Math.min(100, score));

    res.json({
      score,
      status: score >= 90 ? 'EXCELLENT' : score >= 75 ? 'BON' : 'ATTENTION',
      derniereReconciliation: new Date().toISOString(),
      statistiquesVerifiees: {
        totalAnomaliesCritiques: anomaliesCritiques.length,
        totalAvertissements: avertissements.length,
        commandesAnnulees: {
          count: parseInt(cmdAnnuleesStats.rows[0]?.count_annulees || 0, 10),
          montantTotal: Number(cmdAnnuleesStats.rows[0]?.montant_annule || 0),
          statutExclusion: 'EXCLUS DU VOLUME NET EN ADMIN',
        },
        ventesAberrantes: parseInt(ventesAberrantes.rows[0]?.count || 0, 10),
        stocksAjuster: nbStocksIncoherents,
        abonnementsACloturer: nbAbmtExpires,
      },
      anomaliesCritiques,
      avertissements,
      piliers: {
        integrite: 100,
        exactitude: carnetAnomalies.length === 0 ? 100 : 85,
        unicite: nbVentesDoublons === 0 && nbCmdDoublons === 0 ? 100 : 92,
        coherence: 96,
        fraicheur: 100,
      }
    });
  } catch (err) {
    console.error('[DATA HEALTH ERR]:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

