// backend/routes/scraper.js — Route admin pour diagnostics et déclenchement manuel
const router  = require('express').Router();
const fs      = require('fs');
const path    = require('path');
const { pool } = require('../models/db');
const { 
  lancerScraping, 
  lancerScrapingNouveauxSites, 
  lancerScrapingImmo,
  diagnosticScraper, 
  diagnosticNouveauSite, 
  corrigerPrixParPlancher, 
  nettoyerOffresExpirees,
  nettoyerAnnoncesImmoExpirees
} = require('../services/scraper');
const { adminSecretOnly: adminOnly } = require('../middlewares/auth');

const { adminAccess } = require('../middlewares/admin-rbac');
// ── GET /api/scraper/facebook/progress ────────────────────────
// Retourne l'état et la progression en direct du scraper Facebook
router.get('/facebook/progress', ...adminAccess('settings'), (req, res) => { // AUD-014 : état interne réservé à l'admin
  const progressFile = path.join(__dirname, '../.fb-scraper-progress.json');
  if (!fs.existsSync(progressFile)) {
    return res.json({ status: 'idle', message: 'Aucun scraping Facebook récent' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Fichier de progression corrompu' });
  }
});

// ── GET /api/scraper/status ───────────────────────────────────
// Statistiques globales : produits, offres, dernière sync par marchand
router.get('/status', ...adminAccess('settings'), async (req, res) => { // AUD-014
  try {
    const [produits, offres, marchands, historique] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM produits'),
      pool.query('SELECT COUNT(*) FROM offres WHERE stock = true'),
      pool.query(`
        SELECT nom, site_url, methode, actif,
               derniere_sync,
               (SELECT COUNT(*) FROM offres o WHERE o.marchand_id = m.id) AS nb_offres
        FROM marchands m ORDER BY nb_offres DESC
      `),
      pool.query(`
        SELECT DATE_TRUNC('day', date) AS jour, COUNT(*) AS entrees
        FROM historique_prix
        WHERE date >= NOW() - INTERVAL '7 days'
        GROUP BY jour ORDER BY jour DESC
      `),
    ]);
    res.json({
      produits:       parseInt(produits.rows[0].count),
      offres_actives: parseInt(offres.rows[0].count),
      marchands:      marchands.rows,
      historique_7j:  historique.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/scraper/diagnostic/:source ──────────────────────
// Teste un scraper sans sauvegarder — retourne les 5 premiers résultats
// Exemples :
//   GET /api/scraper/diagnostic/expat
//   GET /api/scraper/diagnostic/jumia?categorie=telephones-tablettes
//   GET /api/scraper/diagnostic/coinafrique
router.get('/diagnostic/:source', ...adminAccess('settings'), async (req, res) => {
  try {
    const { source } = req.params;
    const { categorie } = req.query;
    console.log(`[DIAG] Test ${source}${categorie ? '/' + categorie : ''}...`);
    const resultat = await diagnosticScraper(source, categorie);
    res.json(resultat);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── POST /api/scraper/sync-annonces ─────────────────────────
// Reçoit les annonces scrapées localement (Facebook, Expat, etc.) et les insère en BDD
router.post('/sync-annonces', ...adminAccess('settings'), async (req, res) => {
  try {
    const { annonces } = req.body || {};
    if (!Array.isArray(annonces) || annonces.length === 0) {
      return res.status(400).json({ error: 'annonces[] requis' });
    }

    let inseres = 0;
    let doublons = 0;

    for (const a of annonces) {
      try {
        const cleanTel = (a.contact_tel && !/facebook|voir/i.test(a.contact_tel)) ? a.contact_tel.trim() : null;
        const cleanTitre = (a.titre || 'Annonce').trim();
        const isTitrePollue = !cleanTitre || /participant\(e\)\s*anonyme|suivre\s+\d/i.test(cleanTitre) || cleanTitre.length < 4;
        const hasPrix = a.prix && Number(a.prix) > 0;
        const isActif = Boolean(!isTitrePollue && hasPrix && cleanTel);

        const query = `
          INSERT INTO annonces_classifiees (
            categorie_slug, titre, description, prix, ville, quartier, photos,
            contact_nom, contact_tel, source, ref_externe, url_source,
            caracteristiques, actif, payee, rejete
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7::jsonb,
            $8, $9, $10, $11, $12,
            $13::jsonb, $14, true, $15
          )
          ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
          DO UPDATE SET
            prix = COALESCE(EXCLUDED.prix, annonces_classifiees.prix),
            actif = EXCLUDED.actif,
            contact_tel = COALESCE(EXCLUDED.contact_tel, annonces_classifiees.contact_tel),
            updated_at = NOW()
          RETURNING id
        `;
        const values = [
          a.categorie_slug || 'divers',
          cleanTitre,
          a.description || '',
          hasPrix ? a.prix : null,
          a.ville || 'Dakar',
          a.quartier || null,
          JSON.stringify(a.photos || []),
          a.contact_nom || null,
          cleanTel,
          a.source || 'facebook',
          a.ref_externe || null,
          a.url_source || null,
          JSON.stringify(a.caracteristiques || {}),
          isActif,
          !isActif,
        ];

        const resDb = await pool.query(query, values);
        if (resDb.rows.length > 0) inseres++;
        else doublons++;
      } catch (errDb) {
        console.error('[SYNC-ANNONCES] Erreur insertion:', errDb.message);
      }
    }

    res.json({ success: true, total: annonces.length, inseres, doublons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── POST /api/scraper/run ─────────────────────────────────────
// Déclenche un scraping manuel
// Body: { "sources": ["expat", "jumia", "coinafrique"] }  (optionnel, défaut = tout)
router.post('/run', ...adminAccess('settings'), async (req, res) => {
  try {
    const sources = req.body?.sources || ['expat', 'jumia', 'coinafrique'];
    console.log(`[SCRAPER] Déclenchement manuel — sources: ${sources.join(', ')}`);
    // Répondre immédiatement, scraping en arrière-plan
    res.json({
      message:  `Scraping lancé en arrière-plan pour: ${sources.join(', ')}`,
      sources,
      conseil:  'Consultez /api/scraper/status dans quelques minutes pour voir les résultats.',
    });
    lancerScraping(sources).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/scraper/run/:source ────────────────────────────
// Déclencher une seule source
router.post('/run/:source', ...adminAccess('settings'), async (req, res) => {
  try {
    const { source } = req.params;
    res.json({ message: `Scraping ${source} lancé en arrière-plan` });
    lancerScraping([source]).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/scraper/diagnostic-new/:siteId ──────────────────
// Teste un nouveau site sans sauvegarder
// Exemples: GET /api/scraper/diagnostic-new/nova
//           GET /api/scraper/diagnostic-new/jiji
router.get('/diagnostic-new/:siteId', ...adminAccess('settings'), async (req, res) => {
  try {
    const { siteId } = req.params;
    console.log(`[DIAG-NEW] Test site: ${siteId}...`);
    const resultat = await diagnosticNouveauSite(siteId);
    res.json(resultat);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── GET /api/scraper/sites ────────────────────────────────────
// Liste tous les nouveaux sites configurés
router.get('/sites', ...adminAccess('settings'), async (req, res) => { // AUD-014
  const { SITES_CONFIG } = require('../services/scraper-new-sites');
  res.json({
    sites: SITES_CONFIG.map(s => ({
      id: s.id,
      nom: s.nom,
      url: s.baseUrl,
      strategies: s.strategies,
      nb_categories: (s.categorieUrls || []).length,
    })),
    total: SITES_CONFIG.length,
  });
});

// ── POST /api/scraper/run-new ─────────────────────────────────
// Déclenche le scraping des nouveaux sites
// Body optionnel: { "sites": ["nova", "kanje"] }
router.post('/run-new', ...adminAccess('settings'), async (req, res) => {
  try {
    const siteIds = req.body?.sites || null;
    const msg = siteIds ? `Sites: ${siteIds.join(', ')}` : 'Tous les 14 nouveaux sites';
    console.log(`[SCRAPER] Déclenchement manuel nouveaux sites — ${msg}`);
    res.json({
      message: `Scraping nouveaux sites lancé en arrière-plan (${msg})`,
      conseil: 'Consultez /api/scraper/status dans quelques minutes.',
    });
    lancerScrapingNouveauxSites(siteIds).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/scraper/corriger-prix ───────────────────────────
// Répare en base les prix d'offres stockés avec des zéros manquants
// (×100/×1000), via l'unique heuristique de plancher (corrigerPrixParPlancher).
// Query: ?dry=1 pour prévisualiser sans modifier la base
router.post('/corriger-prix', ...adminAccess('settings'), async (req, res) => {
  try {
    const dryRun = req.query.dry === '1';
    const { rows } = await pool.query(`
      SELECT o.id, o.prix, p.nom AS produit_nom
      FROM offres o
      JOIN produits p ON p.id = o.produit_id
      WHERE o.prix > 0
    `);

    const corrections = [];
    for (const r of rows) {
      const prixActuel  = parseFloat(r.prix);
      const prixCorrige = corrigerPrixParPlancher(prixActuel, r.produit_nom);
      if (prixCorrige !== prixActuel) {
        corrections.push({ id: r.id, produit: r.produit_nom, avant: prixActuel, apres: prixCorrige });
        if (!dryRun) await pool.query('UPDATE offres SET prix = $1 WHERE id = $2', [prixCorrige, r.id]);
      }
    }

    res.json({ dryRun, analysees: rows.length, corrigees: corrections.length, corrections });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/scraper/nettoyer-offres-mortes ──────────────────
// Vérifie les offres non revues depuis 20h+ et retire (stock=false)
// celles dont l'URL marchand renvoie 404/410 (annonce expirée côté marchand).
// Query: ?limite=200 (nombre max d'offres vérifiées par appel)
router.post('/nettoyer-offres-mortes', ...adminAccess('settings'), async (req, res) => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite) : 200;
    res.json({ message: `Vérification lancée en arrière-plan (limite ${limite})` });
    nettoyerOffresExpirees(limite).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/scraper/nettoyer-immo-mortes ────────────────────
// Vérifie les annonces immobilières scrapées et désactive (actif=false, supprimee=true)
// celles dont l'URL source renvoie 404/410 ou est expirée.
router.post('/nettoyer-immo-mortes', ...adminAccess('settings'), async (req, res) => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite) : 200;
    res.json({ message: `Vérification des annonces immobilières lancée en arrière-plan (limite ${limite})` });
    nettoyerAnnoncesImmoExpirees(limite).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/scraper/lancer-immo ─────────────────────────────
// Déclenche le scraping immobilier complet (Expat-Dakar + CoinAfrique)
router.post('/lancer-immo', ...adminAccess('settings'), async (req, res) => {
  try {
    res.json({ message: 'Scraping immobilier lancé en arrière-plan' });
    lancerScrapingImmo().catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/scraper/runs ─────────────────────────────────────
// Historique, métriques et diagnostic des passages de collecte
router.get('/runs', ...adminAccess('settings'), async (req, res) => {
  try {
    const { source, statut, systeme, limite = 50, page = 1 } = req.query;
    const limitNum = Math.min(parseInt(limite, 10) || 50, 200);
    const offsetNum = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limitNum;

    const whereClauses = [];
    const values = [];
    let idx = 1;

    if (source) {
      whereClauses.push(`(source ILIKE $${idx} OR source ILIKE $${idx + 1})`);
      values.push(`%${source}%`, `${source}`);
      idx += 2;
    }
    if (statut && statut !== 'all') {
      whereClauses.push(`statut = $${idx}`);
      values.push(statut);
      idx++;
    }
    if (systeme && systeme !== 'all') {
      whereClauses.push(`systeme = $${idx}`);
      values.push(systeme);
      idx++;
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [runsRes, totalRes, kpisRes, sourcesRes] = await Promise.all([
      pool.query(`
        SELECT id, source, systeme, started_at, ended_at, statut,
               pages_cibles, pages_ok, pages_erreur, http_codes,
               items_extraits, items_inseres, items_maj, items_filtres,
               items_doublons, items_rejetes, couverture, duree_ms, erreur_msg
        FROM scraping_runs
        ${whereSql}
        ORDER BY started_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, limitNum, offsetNum]),
      pool.query(`SELECT COUNT(*) FROM scraping_runs ${whereSql}`, values),
      pool.query(`
        SELECT 
          COUNT(*) as total_runs,
          COUNT(*) FILTER (WHERE statut = 'ok') as runs_ok,
          COUNT(*) FILTER (WHERE statut = 'degrade') as runs_degrade,
          COUNT(*) FILTER (WHERE statut = 'echec') as runs_echec,
          COALESCE(SUM(items_extraits), 0) as total_extraits,
          COALESCE(SUM(items_inseres), 0) as total_inseres,
          COALESCE(SUM(items_maj), 0) as total_maj,
          COALESCE(AVG(duree_ms), 0) as duree_moyenne_ms
        FROM scraping_runs
        WHERE started_at >= NOW() - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT 
          source,
          systeme,
          COUNT(*) as nb_runs,
          MAX(started_at) as dernier_run_at,
          (ARRAY_AGG(statut ORDER BY started_at DESC))[1] as dernier_statut,
          (ARRAY_AGG(items_extraits ORDER BY started_at DESC))[1] as derniers_extraits,
          (ARRAY_AGG(erreur_msg ORDER BY started_at DESC))[1] as derniere_erreur,
          COUNT(*) FILTER (WHERE statut = 'echec') as total_echecs
        FROM scraping_runs
        GROUP BY source, systeme
        ORDER BY dernier_run_at DESC NULLS LAST
      `),
    ]);

    res.json({
      success: true,
      total: parseInt(totalRes.rows[0].count, 10),
      page: parseInt(page, 10) || 1,
      limite: limitNum,
      runs: runsRes.rows,
      kpis: kpisRes.rows[0] || {},
      sources_synthese: sourcesRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/scraper/v2/sources ──────────────────────────────
// Registre unifié des sources V2 et état de synchronisation
router.get('/v2/sources', ...adminAccess('settings'), async (req, res) => {
  try {
    const { REGISTRE_SOURCES } = require('../services/collecte/SourcesRegistry');
    const { rows: marchands } = await pool.query(`
      SELECT m.id, m.nom, m.actif, m.derniere_sync,
             COUNT(o.id) as nb_offres,
             COUNT(o.id) FILTER (WHERE o.stock = true) as nb_stock
      FROM marchands m
      LEFT JOIN offres o ON o.marchand_id = m.id
      GROUP BY m.id, m.nom, m.actif, m.derniere_sync
    `);

    const marchandsMap = new Map();
    for (const m of marchands) {
      marchandsMap.set(m.nom.toLowerCase(), m);
    }

    const { rows: lastRuns } = await pool.query(`
      SELECT DISTINCT ON (source) source, statut, started_at, items_extraits, items_inseres, erreur_msg
      FROM scraping_runs
      ORDER BY source, started_at DESC
    `);
    const lastRunsMap = new Map();
    for (const r of lastRuns) {
      lastRunsMap.set(r.source.toLowerCase(), r);
    }

    const sources = REGISTRE_SOURCES.map(s => {
      const dbMarchand = marchandsMap.get(s.nom.toLowerCase()) || {};
      const dbLastRun = lastRunsMap.get(s.nom.toLowerCase()) || lastRunsMap.get(s.id.toLowerCase()) || null;
      return {
        id: s.id,
        nom: s.nom,
        domaine: s.domaine,
        baseUrl: s.baseUrl,
        systeme: s.systeme,
        type_methode: s.type_methode,
        categories: s.categories,
        cadence: s.cadence,
        actif: s.actif,
        marchand_id: dbMarchand.id || null,
        nb_offres: parseInt(dbMarchand.nb_offres || 0, 10),
        nb_stock: parseInt(dbMarchand.nb_stock || 0, 10),
        derniere_sync: dbMarchand.derniere_sync || null,
        dernier_run: dbLastRun ? {
          statut: dbLastRun.statut,
          started_at: dbLastRun.started_at,
          items_extraits: dbLastRun.items_extraits,
          items_inseres: dbLastRun.items_inseres,
          erreur: dbLastRun.erreur_msg,
        } : null,
      };
    });

    res.json({ success: true, total: sources.length, sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/scraper/v2/run/:sourceId ───────────────────────
// Déclenche une collecte contrôlée V2 avec traçabilité dans scraping_runs
router.post('/v2/run/:sourceId', ...adminAccess('settings'), async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { obtenirSource } = require('../services/collecte/SourcesRegistry');
    const sourceConfig = obtenirSource(sourceId);

    if (!sourceConfig) {
      return res.status(404).json({ error: `Source inconnue : ${sourceId}` });
    }

    const collector = sourceConfig.creerCollecteur();
    res.json({
      success: true,
      message: `Collecte V2 lancée en arrière-plan pour ${sourceConfig.nom} (${sourceConfig.type_methode})`,
      source: sourceConfig.id,
    });

    // Exécution asynchrone sécurisée
    collector.executer({ categoriesCibles: sourceConfig.categories?.length || 1 })
      .then(resRun => console.log(`[SCRAPER V2] Fin de collecte ${sourceConfig.nom}:`, resRun.statut))
      .catch(errRun => console.error(`[SCRAPER V2 ERR] ${sourceConfig.nom}:`, errRun.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
