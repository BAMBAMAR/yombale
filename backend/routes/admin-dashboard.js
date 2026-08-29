// backend/routes/admin-dashboard.js
// Métriques consolidées, KPIs financiers, d'activité et alertes opérationnelles

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

router.get('/stats', adminSecretOnly, async (req, res) => {
  try {
    const period = req.query.period || '30d'; // 'today', '7d', '30d', 'all'

    let dateFilterSql = "created_at >= NOW() - INTERVAL '30 days'";
    let dateFilterProcessedAt = "processed_at >= NOW() - INTERVAL '30 days'";

    if (period === 'today') {
      dateFilterSql = "created_at::date = CURRENT_DATE";
      dateFilterProcessedAt = "processed_at::date = CURRENT_DATE";
    } else if (period === '7d') {
      dateFilterSql = "created_at >= NOW() - INTERVAL '7 days'";
      dateFilterProcessedAt = "processed_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'all') {
      dateFilterSql = "1=1";
      dateFilterProcessedAt = "1=1";
    }

    // 1. Business & Finances
    const [comptaRes, abmtRes, paiementsManuelsRes] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(montant_total), 0) AS ca_total_ventes,
          COUNT(*) AS nb_ventes_total
        FROM ventes
        WHERE archivee IS NOT TRUE AND ${dateFilterSql}
      `).catch(() => ({ rows: [{ ca_total_ventes: 0, nb_ventes_total: 0 }] })),
      pool.query(`
        SELECT
          COALESCE(SUM(prix_mensuel) FILTER (WHERE statut = 'actif' AND fin > NOW()), 0) AS mrr,
          COUNT(*) FILTER (WHERE statut = 'actif' AND fin > NOW()) AS abonnements_actifs,
          COUNT(*) FILTER (WHERE ${dateFilterSql}) AS nouveaux_abonnements_periode,
          COUNT(*) FILTER (WHERE plan = 'business' AND statut = 'actif' AND fin > NOW()) AS abonnements_business,
          COUNT(*) FILTER (WHERE plan = 'pro' AND statut = 'actif' AND fin > NOW()) AS abonnements_pro,
          COUNT(*) FILTER (WHERE plan = 'decouverte' AND statut = 'actif' AND fin > NOW()) AS abonnements_decouverte
        FROM abonnements
      `).catch(() => ({ rows: [{ mrr: 0, abonnements_actifs: 0, nouveaux_abonnements_periode: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE statut = 'en_attente') AS en_attente,
          COUNT(*) FILTER (WHERE statut = 'valide' AND ${dateFilterSql}) AS valides_periode,
          COALESCE(SUM(montant) FILTER (WHERE statut = 'valide' AND ${dateFilterSql}), 0) AS montant_valide_periode
        FROM paiements_manuels
      `).catch(() => ({ rows: [{ en_attente: 0, valides_periode: 0, montant_valide_periode: 0 }] })),
    ]);

    // 2. Utilisateurs & Marchands
    const [usersRes, boutiquesRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_utilisateurs,
          COUNT(*) FILTER (WHERE ${dateFilterSql}) AS nouveaux_utilisateurs_periode,
          COUNT(*) FILTER (WHERE email_verifie = TRUE) AS utilisateurs_verifies,
          COUNT(*) FILTER (WHERE suspendu = TRUE) AS utilisateurs_suspendus,
          COUNT(*) FILTER (WHERE est_apporteur = TRUE) AS apporteurs_total
        FROM utilisateurs
      `).catch(() => ({ rows: [{ total_utilisateurs: 0, nouveaux_utilisateurs_periode: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) AS total_boutiques,
          COUNT(*) FILTER (WHERE actif = TRUE) AS boutiques_actives,
          COUNT(*) FILTER (WHERE ${dateFilterSql}) AS nouvelles_boutiques_periode,
          COUNT(*) FILTER (WHERE sponsorise = TRUE AND (sponsor_jusqu_au IS NULL OR sponsor_jusqu_au > NOW())) AS boutiques_sponsorisees,
          COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM boutique_produits WHERE boutique_id = boutiques.id) = 0) AS boutiques_zero_produit
        FROM boutiques
      `).catch(() => ({ rows: [{ total_boutiques: 0, boutiques_actives: 0, nouvelles_boutiques_periode: 0 }] })),
    ]);

    // 3. Activité Commandes & Catalogue
    const [commandesRes, produitsRes, annoncesRes, immoRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total_commandes,
          COALESCE(SUM(montant_total), 0) AS volume_commandes,
          COUNT(*) FILTER (WHERE statut = 'en_attente') AS commandes_en_attente,
          COUNT(*) FILTER (WHERE statut = 'livree') AS commandes_livrees
        FROM commandes_boutique
        WHERE ${dateFilterSql}
      `).catch(() => ({ rows: [{ total_commandes: 0, volume_commandes: 0, commandes_en_attente: 0, commandes_livrees: 0 }] })),
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM produits) AS produits_scrapes,
          (SELECT COUNT(*)::int FROM boutique_produits) AS produits_marchands,
          (SELECT COUNT(*)::int FROM boutique_produits WHERE en_stock = TRUE) AS produits_en_stock
      `).catch(() => ({ rows: [{ produits_scrapes: 0, produits_marchands: 0, produits_en_stock: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) AS total_annonces,
          COUNT(*) FILTER (WHERE actif = TRUE AND supprimee = FALSE) AS annonces_actives,
          COUNT(*) FILTER (WHERE actif = FALSE AND rejete = FALSE AND supprimee = FALSE) AS annonces_en_attente,
          COUNT(*) FILTER (WHERE rejete = TRUE) AS annonces_rejetees
        FROM annonces_classifiees
      `).catch(() => ({ rows: [{ total_annonces: 0, annonces_actives: 0, annonces_en_attente: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) AS total_immo,
          COUNT(*) FILTER (WHERE actif = TRUE AND supprimee = FALSE) AS immo_actives,
          COUNT(*) FILTER (WHERE actif = FALSE AND supprimee = FALSE AND COALESCE(rejete, FALSE) = FALSE) AS immo_en_attente,
          COUNT(*) FILTER (WHERE COALESCE(demande_sponsorisation, FALSE) = TRUE) AS immo_demandes_sponsoring
        FROM annonces_immo
      `).catch(() => ({ rows: [{ total_immo: 0, immo_actives: 0, immo_en_attente: 0 }] })),
    ]);

    // 4. Outreach, WhatsApp & Support
    const [whatsappRes, prospectionRes, supportRes, partenairesRes] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM whatsapp_sessions) AS sessions_chatbot_actives,
          (SELECT COUNT(*)::int FROM whatsapp_processed_messages WHERE ${dateFilterProcessedAt}) AS messages_traites_periode,
          (SELECT COUNT(*)::int FROM whatsapp_blacklist) AS optouts_whatsapp
      `).catch(() => ({ rows: [{ sessions_chatbot_actives: 0, messages_traites_periode: 0, optouts_whatsapp: 0 }] })),
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM prospection_leads) AS total_leads,
          (SELECT COUNT(*)::int FROM prospection_leads WHERE statut = 'converti') AS leads_convertis,
          (SELECT COUNT(*)::int FROM prospection_messages_log WHERE ${dateFilterSql}) AS messages_prospection_periode
      `).catch(() => ({ rows: [{ total_leads: 0, leads_convertis: 0, messages_prospection_periode: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE statut = 'en_attente') AS demandes_support_en_attente
        FROM support_demandes
      `).catch(() => ({ rows: [{ demandes_support_en_attente: 0 }] })),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE statut = 'en_attente') AS demandes_partenaires_en_attente
        FROM demandes_partenaires
      `).catch(() => ({ rows: [{ demandes_partenaires_en_attente: 0 }] })),
    ]);

    // 5. Synthèse des Alertes & Actions Immédiates (Action Center)
    const alertes = {
      annonces_en_attente: parseInt(annoncesRes.rows[0]?.annonces_en_attente || 0),
      immo_en_attente: parseInt(immoRes.rows[0]?.immo_en_attente || 0),
      immo_demandes_sponsoring: parseInt(immoRes.rows[0]?.immo_demandes_sponsoring || 0),
      paiements_manuels_en_attente: parseInt(paiementsManuelsRes.rows[0]?.en_attente || 0),
      partenaires_en_attente: parseInt(partenairesRes.rows[0]?.demandes_partenaires_en_attente || 0),
      support_en_attente: parseInt(supportRes.rows[0]?.demandes_support_en_attente || 0),
      boutiques_zero_produit: parseInt(boutiquesRes.rows[0]?.boutiques_zero_produit || 0),
    };

    const totalActionsRequises = Object.values(alertes).reduce((acc, v) => acc + v, 0);

    res.json({
      period,
      generatedAt: new Date().toISOString(),
      finances: {
        ca_total_ventes: Number(comptaRes.rows[0]?.ca_total_ventes || 0),
        nb_ventes_total: parseInt(comptaRes.rows[0]?.nb_ventes_total || 0),
        mrr: Number(abmtRes.rows[0]?.mrr || 0),
        abonnements_actifs: parseInt(abmtRes.rows[0]?.abonnements_actifs || 0),
        nouveaux_abonnements_periode: parseInt(abmtRes.rows[0]?.nouveaux_abonnements_periode || 0),
        abonnements_business: parseInt(abmtRes.rows[0]?.abonnements_business || 0),
        abonnements_pro: parseInt(abmtRes.rows[0]?.abonnements_pro || 0),
        abonnements_decouverte: parseInt(abmtRes.rows[0]?.abonnements_decouverte || 0),
        paiements_valides_periode: Number(paiementsManuelsRes.rows[0]?.montant_valide_periode || 0),
      },
      utilisateurs: {
        total: parseInt(usersRes.rows[0]?.total_utilisateurs || 0),
        nouveaux_periode: parseInt(usersRes.rows[0]?.nouveaux_utilisateurs_periode || 0),
        verifies: parseInt(usersRes.rows[0]?.utilisateurs_verifies || 0),
        suspendus: parseInt(usersRes.rows[0]?.utilisateurs_suspendus || 0),
        apporteurs: parseInt(usersRes.rows[0]?.apporteurs_total || 0),
      },
      boutiques: {
        total: parseInt(boutiquesRes.rows[0]?.total_boutiques || 0),
        actives: parseInt(boutiquesRes.rows[0]?.boutiques_actives || 0),
        nouvelles_periode: parseInt(boutiquesRes.rows[0]?.nouvelles_boutiques_periode || 0),
        sponsorisees: parseInt(boutiquesRes.rows[0]?.boutiques_sponsorisees || 0),
        zero_produit: parseInt(boutiquesRes.rows[0]?.boutiques_zero_produit || 0),
      },
      commandes: {
        total: parseInt(commandesRes.rows[0]?.total_commandes || 0),
        volume: Number(commandesRes.rows[0]?.volume_commandes || 0),
        en_attente: parseInt(commandesRes.rows[0]?.commandes_en_attente || 0),
        livrees: parseInt(commandesRes.rows[0]?.commandes_livrees || 0),
      },
      catalogue: {
        produits_scrapes: parseInt(produitsRes.rows[0]?.produits_scrapes || 0),
        produits_marchands: parseInt(produitsRes.rows[0]?.produits_marchands || 0),
        produits_en_stock: parseInt(produitsRes.rows[0]?.produits_en_stock || 0),
        annonces_total: parseInt(annoncesRes.rows[0]?.total_annonces || 0),
        annonces_actives: parseInt(annoncesRes.rows[0]?.annonces_actives || 0),
        immo_total: parseInt(immoRes.rows[0]?.total_immo || 0),
        immo_actives: parseInt(immoRes.rows[0]?.immo_actives || 0),
      },
      whatsapp: {
        sessions_chatbot_actives: parseInt(whatsappRes.rows[0]?.sessions_chatbot_actives || 0),
        messages_traites_periode: parseInt(whatsappRes.rows[0]?.messages_traites_periode || 0),
        optouts: parseInt(whatsappRes.rows[0]?.optouts_whatsapp || 0),
        leads_total: parseInt(prospectionRes.rows[0]?.total_leads || 0),
        leads_convertis: parseInt(prospectionRes.rows[0]?.leads_convertis || 0),
        messages_prospection_periode: parseInt(prospectionRes.rows[0]?.messages_prospection_periode || 0),
      },
      actionCenter: {
        totalActionsRequises,
        alertes,
      },
    });
  } catch (err) {
    console.error('[ADMIN_DASHBOARD_STATS_ERR]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
