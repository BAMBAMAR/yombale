const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { limiterGeneral } = require('../middlewares/rateLimit');

// POST /api/analytics/event — enregistrer un événement (vue, clic tel)
router.post('/event', limiterGeneral, async (req, res) => {
  const { type, boutique_id, annonce_id } = req.body;
  if (!type || !boutique_id) return res.status(400).json({ error: 'type et boutique_id requis' });

  const TYPES_AUTORISES = [
    'vue_boutique',
    'clic_telephone',
    'vue_annonce',
    'vue_produit',
    'ajout_panier',
    'checkout_initie',
    'commande_confirmee',
  ];
  if (!TYPES_AUTORISES.includes(type)) return res.status(400).json({ error: 'Type invalide' });

  try {
    let actualBoutiqueId = boutique_id;
    if (!/^[0-9a-f-]{36}$/i.test(actualBoutiqueId)) {
      const b = await pool.query('SELECT id FROM boutiques WHERE LOWER(slug) = LOWER($1)', [boutique_id]);
      if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
      actualBoutiqueId = b.rows[0].id;
    }

    await pool.query(
      `INSERT INTO analytics_events (type, boutique_id, annonce_id) VALUES ($1,$2,$3)`,
      [type, actualBoutiqueId, annonce_id ?? null]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/boutique/:id — stats d'une boutique (propriétaire uniquement)
router.get('/boutique/:id', verifierToken, async (req, res) => {
  try {
    // Vérifier que la boutique appartient à l'utilisateur
    const check = await pool.query(
      'SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!check.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE type='vue_boutique')                                          AS vues_total,
        COUNT(*) FILTER (WHERE type='vue_boutique' AND created_at >= DATE_TRUNC('month', NOW())) AS vues_ce_mois,
        COUNT(*) FILTER (WHERE type='vue_boutique' AND created_at >= NOW() - INTERVAL '7 days')  AS vues_7j,
        COUNT(*) FILTER (WHERE type='clic_telephone')                                        AS clics_tel_total,
        COUNT(*) FILTER (WHERE type='clic_telephone' AND created_at >= DATE_TRUNC('month', NOW())) AS clics_tel_mois,
        COUNT(*) FILTER (WHERE type='commande_web')                                          AS commandes_web_total,
        COUNT(*) FILTER (WHERE type='vue_annonce')                                           AS vues_annonces_total,
        COUNT(*) FILTER (WHERE type='vue_annonce' AND created_at >= DATE_TRUNC('month', NOW()))   AS vues_annonces_mois
      FROM analytics_events
      WHERE boutique_id=$1
    `, [req.params.id]);

    // Commandes web validées (hors annulées)
    const { rows: cmdRows } = await pool.query(`
      SELECT
        COALESCE(SUM(montant_total), 0) AS total_ventes_web,
        COALESCE(AVG(montant_total), 0) AS panier_moyen_web,
        COUNT(*) AS nb_commandes_web
      FROM commandes_boutique
      WHERE boutique_id=$1 AND statut != 'annulee'
    `, [req.params.id]);

    // Paramètres optionnels de filtrage ad-hoc (date début / date fin / produit)
    const { date_debut, date_fin, produit_id } = req.query;
    const isIsoDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

    const hasCustomDates = isIsoDate(date_debut) && isIsoDate(date_fin);
    const dateDebutSql = hasCustomDates ? `${date_debut} 00:00:00Z` : null;
    const dateFinSql = hasCustomDates ? `${date_fin} 23:59:59.999Z` : null;

    // Chiffre d'affaires global réel (Comptabilité - Ventes directes POS, livrées, express)
    let comptaSql = `
      SELECT
        COALESCE(SUM(montant_total), 0) AS ca_global_total,
        COALESCE(AVG(montant_total), 0) AS panier_moyen_global,
        COUNT(*) AS nb_ventes_global
      FROM ventes
      WHERE boutique_id=$1 AND archivee IS NOT TRUE
    `;
    const comptaParams = [req.params.id];
    if (hasCustomDates) {
      comptaParams.push(dateDebutSql, dateFinSql);
      comptaSql += ` AND created_at >= $${comptaParams.length - 1} AND created_at <= $${comptaParams.length}`;
    }
    if (produit_id && typeof produit_id === 'string' && produit_id.length === 36) {
      comptaParams.push(produit_id);
      comptaSql += ` AND produit_id = $${comptaParams.length}`;
    }

    const { rows: comptaRows } = await pool.query(comptaSql, comptaParams);

    // Promotions & coupons
    const { rows: promoRows } = await pool.query(`
      SELECT
        COUNT(*) AS nb_promotions,
        COALESCE(SUM(fois_utilise), 0) AS utilisations_promo
      FROM boutique_promotions
      WHERE boutique_id=$1
    `, [req.params.id]);

    // Pixels & mode
    const { rows: bqRows } = await pool.query(`
      SELECT mode_fonctionnement, meta_pixel_id, tiktok_pixel_id, ga4_id
      FROM boutiques
      WHERE id=$1
    `, [req.params.id]);

    // Évolution temporelle (30 jours par défaut ou période libre personnalisée)
    let histoSql = `
      SELECT DATE(created_at) AS jour,
             COUNT(*) FILTER (WHERE type='vue_boutique')   AS vues,
             COUNT(*) FILTER (WHERE type='clic_telephone')  AS clics_tel
      FROM analytics_events
      WHERE boutique_id=$1
    `;
    const histoParams = [req.params.id];
    if (hasCustomDates) {
      histoParams.push(dateDebutSql, dateFinSql);
      histoSql += ` AND created_at >= $2 AND created_at <= $3`;
    } else {
      histoSql += ` AND created_at >= NOW() - INTERVAL '30 days'`;
    }
    histoSql += ` GROUP BY jour ORDER BY jour ASC`;
    const { rows: historique } = await pool.query(histoSql, histoParams);

    // Top 10 des produits vendus sur la période
    let topSql = `
      SELECT
        produit_id,
        nom_produit,
        COALESCE(SUM(quantite), 0) AS quantite_vendue,
        COALESCE(SUM(montant_total), 0) AS ca_total
      FROM ventes
      WHERE boutique_id=$1 AND archivee IS NOT TRUE
    `;
    const topParams = [req.params.id];
    if (hasCustomDates) {
      topParams.push(dateDebutSql, dateFinSql);
      topSql += ` AND created_at >= $2 AND created_at <= $3`;
    }
    topSql += `
      GROUP BY produit_id, nom_produit
      ORDER BY ca_total DESC
      LIMIT 10
    `;
    const { rows: topProduits } = await pool.query(topSql, topParams);

    // Attribution Social Commerce — Répartition des ventes par canal UTM
    const { rows: attributionRows } = await pool.query(`
      SELECT
        COALESCE(utm_source, 'direct') AS canal,
        COUNT(*) AS nb_commandes,
        COALESCE(SUM(montant_total), 0) AS montant_total
      FROM commandes_boutique
      WHERE boutique_id=$1 AND statut != 'annulee'
        AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY COALESCE(utm_source, 'direct')
      ORDER BY nb_commandes DESC
      LIMIT 10
    `, [req.params.id]);

    res.json({
      stats: {
        ...rows[0],
        total_ventes: Number(comptaRows[0]?.ca_global_total || cmdRows[0]?.total_ventes_web || 0),
        total_ventes_web: Number(cmdRows[0]?.total_ventes_web || 0),
        panier_moyen: Math.round(Number(comptaRows[0]?.panier_moyen_global || cmdRows[0]?.panier_moyen_web || 0)),
        nb_commandes: Number(cmdRows[0]?.nb_commandes_web || 0),
        nb_ventes_global: Number(comptaRows[0]?.nb_ventes_global || 0),
        nb_promotions: promoRows[0]?.nb_promotions || 0,
        utilisations_promo: promoRows[0]?.utilisations_promo || 0,
        mode_fonctionnement: bqRows[0]?.mode_fonctionnement || 'hybride_pos',
        meta_pixel_active: !!bqRows[0]?.meta_pixel_id,
        tiktok_pixel_active: !!bqRows[0]?.tiktok_pixel_id,
        ga4_active: !!bqRows[0]?.ga4_id,
      },
      filtres: {
        date_debut: hasCustomDates ? date_debut : null,
        date_fin: hasCustomDates ? date_fin : null,
        produit_id: produit_id || null,
      },
      top_produits: topProduits.map(tp => ({
        produit_id: tp.produit_id,
        nom_produit: tp.nom_produit,
        quantite_vendue: Number(tp.quantite_vendue),
        ca_total: Number(tp.ca_total),
      })),
      historique,
      attribution_sociale: attributionRows.map(r => ({
        canal: r.canal,
        nb_commandes: Number(r.nb_commandes),
        montant_total: Number(r.montant_total),
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/boutique/:id/funnel — entonnoir de conversion complet
router.get('/boutique/:id/funnel', verifierToken, async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!check.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const periode = req.query.periode || '30j';
    const intervalSql = periode === '7j' ? "INTERVAL '7 days'" : periode === '90j' ? "INTERVAL '90 days'" : "INTERVAL '30 days'";

    const { rows: eventRows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE type='vue_boutique')      AS vues_boutique,
        COUNT(*) FILTER (WHERE type='vue_produit')       AS vues_produit,
        COUNT(*) FILTER (WHERE type='ajout_panier')       AS ajouts_panier,
        COUNT(*) FILTER (WHERE type='checkout_initie')   AS checkouts_inities
      FROM analytics_events
      WHERE boutique_id=$1 AND created_at >= NOW() - ${intervalSql}
    `, [req.params.id]);

    const { rows: cmdRows } = await pool.query(`
      SELECT COUNT(*) AS commandes_payees, COALESCE(SUM(montant_total), 0) AS ca_total
      FROM commandes_boutique
      WHERE boutique_id=$1 AND statut != 'annulee' AND created_at >= NOW() - ${intervalSql}
    `, [req.params.id]);

    const vuesBoutique = parseInt(eventRows[0]?.vues_boutique || 0, 10);
    const vuesProduit = parseInt(eventRows[0]?.vues_produit || 0, 10);
    const ajoutsPanier = parseInt(eventRows[0]?.ajouts_panier || 0, 10);
    const checkoutsInities = parseInt(eventRows[0]?.checkouts_inities || 0, 10);
    const commandesPayees = parseInt(cmdRows[0]?.commandes_payees || 0, 10);
    const caTotal = parseFloat(cmdRows[0]?.ca_total || 0);

    const tauxVisiteProduit = vuesBoutique > 0 ? parseFloat(((vuesProduit / vuesBoutique) * 100).toFixed(1)) : 0;
    const tauxProduitPanier = vuesProduit > 0 ? parseFloat(((ajoutsPanier / vuesProduit) * 100).toFixed(1)) : 0;
    const tauxPanierCheckout = ajoutsPanier > 0 ? parseFloat(((checkoutsInities / ajoutsPanier) * 100).toFixed(1)) : 0;
    const tauxCheckoutCommande = checkoutsInities > 0 ? parseFloat(((commandesPayees / checkoutsInities) * 100).toFixed(1)) : 0;
    const tauxConversionGlobal = vuesBoutique > 0 ? parseFloat(((commandesPayees / vuesBoutique) * 100).toFixed(2)) : 0;
    const tauxAbandonPanier = ajoutsPanier > 0 ? parseFloat((((ajoutsPanier - commandesPayees) / ajoutsPanier) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      periode,
      etapes: [
        { etape: 'visites_boutique', label: 'Visites Boutique', count: vuesBoutique, taux_suivant: tauxVisiteProduit },
        { etape: 'vues_produit', label: 'Vues de Produits', count: vuesProduit, taux_suivant: tauxProduitPanier },
        { etape: 'ajouts_panier', label: 'Ajouts au Panier', count: ajoutsPanier, taux_suivant: tauxPanierCheckout },
        { etape: 'checkouts_inities', label: 'Commandes Initiées', count: checkoutsInities, taux_suivant: tauxCheckoutCommande },
        { etape: 'commandes_payees', label: 'Commandes Finalisées', count: commandesPayees, taux_suivant: 100 },
      ],
      kpis: {
        taux_conversion_global: tauxConversionGlobal,
        taux_abandon_panier: Math.max(0, tauxAbandonPanier),
        ca_total: caTotal,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
