// backend/routes/scraper.js — Route admin pour diagnostics et déclenchement manuel
const router  = require('express').Router();
const { pool } = require('../models/db');
const { lancerScraping, lancerScrapingNouveauxSites, diagnosticScraper, diagnosticNouveauSite, corrigerPrixParPlancher, nettoyerOffresExpirees } = require('../services/scraper');
const { adminSecretOnly: adminOnly } = require('../middlewares/auth');

// ── GET /api/scraper/status ───────────────────────────────────
// Statistiques globales : produits, offres, dernière sync par marchand
router.get('/status', async (req, res) => {
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
router.get('/diagnostic/:source', adminOnly, async (req, res) => {
  try {
    const { source } = req.params;
    const { categorie } = req.query;
    console.log(`[DIAG] Test ${source}${categorie ? '/' + categorie : ''}...`);
    const resultat = await diagnosticScraper(source, categorie);
    res.json(resultat);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── POST /api/scraper/run ─────────────────────────────────────
// Déclenche un scraping manuel
// Body: { "sources": ["expat", "jumia", "coinafrique"] }  (optionnel, défaut = tout)
router.post('/run', adminOnly, async (req, res) => {
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
router.post('/run/:source', adminOnly, async (req, res) => {
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
router.get('/diagnostic-new/:siteId', adminOnly, async (req, res) => {
  try {
    const { siteId } = req.params;
    console.log(`[DIAG-NEW] Test site: ${siteId}...`);
    const resultat = await diagnosticNouveauSite(siteId);
    res.json(resultat);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── GET /api/scraper/sites ────────────────────────────────────
// Liste tous les nouveaux sites configurés
router.get('/sites', async (req, res) => {
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
router.post('/run-new', adminOnly, async (req, res) => {
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
router.post('/corriger-prix', adminOnly, async (req, res) => {
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
router.post('/nettoyer-offres-mortes', adminOnly, async (req, res) => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite) : 200;
    res.json({ message: `Vérification lancée en arrière-plan (limite ${limite})` });
    nettoyerOffresExpirees(limite).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
