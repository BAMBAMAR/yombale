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
// Route TEMPORAIRE v2 — médiane par CATÉGORIE pour corriger même les produits 1 offre
router.get('/nettoyer-prix', adminOnly, async (req, res) => {
  const { pool } = require('../models/db');
  const rapport = { corriges_x100: 0, corriges_x1000: 0, supprimes: 0, categories: [] };
  try {

    // 1. Calculer la médiane réelle par catégorie (en excluant les prix suspects < 1000)
    const { rows: cats } = await pool.query(`
      SELECT p.categorie_id,
             c.nom AS cat_nom,
             PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.prix) AS mediane,
             COUNT(o.id) AS nb_offres
      FROM offres o
      JOIN produits p ON p.id = o.produit_id
      JOIN categories c ON c.id = p.categorie_id
      WHERE o.prix >= 1000
      GROUP BY p.categorie_id, c.nom
      HAVING COUNT(o.id) >= 10
    `);

    for (const cat of cats) {
      if (!cat.mediane || cat.mediane < 1000) continue;
      const mediane = parseFloat(cat.mediane);

      // Corriger les offres ÷100 (prix * 100 ≈ médiane)
      const { rowCount: r100 } = await pool.query(`
        UPDATE offres o
        SET prix = o.prix * 100
        FROM produits p
        WHERE o.produit_id = p.id
          AND p.categorie_id = $1
          AND o.prix > 0
          AND o.prix < $2 / 30
          AND o.prix * 100 BETWEEN $2 * 0.05 AND $2 * 20
      `, [cat.categorie_id, mediane]);

      // Corriger les offres ÷1000 (prix * 1000 ≈ médiane)
      const { rowCount: r1000 } = await pool.query(`
        UPDATE offres o
        SET prix = o.prix * 1000
        FROM produits p
        WHERE o.produit_id = p.id
          AND p.categorie_id = $1
          AND o.prix > 0
          AND o.prix < $2 / 300
          AND o.prix * 1000 BETWEEN $2 * 0.05 AND $2 * 20
      `, [cat.categorie_id, mediane]);

      if (r100 > 0 || r1000 > 0) {
        rapport.corriges_x100  += r100;
        rapport.corriges_x1000 += r1000;
        rapport.categories.push({ nom: cat.cat_nom, mediane: Math.round(mediane), corriges: r100 + r1000 });
      }
    }

    // 3. Supprimer les prix encore < 500 FCFA (irréparables)
    const { rowCount: suppr } = await pool.query(
      'DELETE FROM offres WHERE prix > 0 AND prix < 500'
    );
    rapport.supprimes = suppr;

    // 4. Désactiver stock pour les produits dont toutes les offres sont supprimées
    await pool.query(`
      UPDATE offres SET stock = false
      WHERE stock = true
        AND scraped_at < NOW() - INTERVAL '7 days'
        AND prix < 500
    `);

    console.log('[NETTOYAGE v2]', rapport);
    res.json({ success: true, ...rapport });
  } catch (err) {
    res.status(500).json({ success: false, erreur: err.message });
  }
});

module.exports = router;
