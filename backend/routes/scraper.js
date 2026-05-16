// backend/routes/scraper.js — Route admin pour diagnostics et déclenchement manuel
const router  = require('express').Router();
const { pool } = require('../models/db');
const { lancerScraping, lancerScrapingNouveauxSites, diagnosticScraper, diagnosticNouveauSite } = require('../services/scraper');

// Middleware simple : protège par ADMIN_SECRET (variable d'env Railway)
function adminOnly(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (process.env.ADMIN_SECRET && secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Secret admin requis. Envoyez le header X-Admin-Secret.' });
  }
  next();
}

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

// ── GET /api/scraper/nettoyer-prix ───────────────────────────
// Route TEMPORAIRE — exécuter UNE FOIS pour corriger les prix aberrants
// Appeler : GET /api/scraper/nettoyer-prix?secret=TON_SECRET
// Supprimer ensuite cette route
router.get('/nettoyer-prix', adminOnly, async (req, res) => {
  const { pool } = require('../models/db');
  const rapport = { corriges_x100: 0, supprimes: 0, erreur: null };
  try {
    // 1. Récupérer la médiane par produit (sur les prix > 500)
    const { rows: produits } = await pool.query(`
      SELECT p.id,
             PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.prix) AS mediane
      FROM produits p
      JOIN offres o ON o.produit_id = p.id
      WHERE o.prix > 500
      GROUP BY p.id
      HAVING COUNT(o.id) >= 2
    `);

    // 2. Pour chaque produit, corriger les offres divisées par 100
    for (const { id, mediane } of produits) {
      if (!mediane || mediane < 1000) continue;
      const { rowCount } = await pool.query(`
        UPDATE offres
        SET prix = prix * 100
        WHERE produit_id = $1
          AND prix > 0
          AND prix * 50 < $2
          AND prix * 100 BETWEEN $2 * 0.1 AND $2 * 10
      `, [id, mediane]);
      rapport.corriges_x100 += rowCount;
    }

    // 3. Supprimer les prix < 500 FCFA (irréparables)
    const { rowCount: suppr } = await pool.query(
      'DELETE FROM offres WHERE prix < 500 AND prix > 0'
    );
    rapport.supprimes = suppr;

    console.log('[NETTOYAGE PRIX]', rapport);
    res.json({ success: true, ...rapport, message: 'Supprimez cette route après utilisation !' });
  } catch (err) {
    rapport.erreur = err.message;
    res.status(500).json({ success: false, ...rapport });
  }
});

module.exports = router;
