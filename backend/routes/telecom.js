// backend/routes/telecom.js — Forfaits opérateurs télécom (Orange, Free, Expresso…)
// Verticale distincte du modèle produits/offres : un forfait n'est pas un
// "produit comparable entre marchands" mais une offre unique d'un opérateur,
// avec plusieurs dimensions (data, appels, SMS, validité) plutôt qu'un simple prix.
const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

// GET /api/telecom — liste / filtre
router.get('/', async (req, res) => {
  try {
    const { operateur, type, prixMax, prixMin, dataMin, tri, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const orderBy = tri === 'prix_asc'  ? 'prix ASC'
                  : tri === 'prix_desc' ? 'prix DESC'
                  : tri === 'data_desc' ? 'data_mo DESC NULLS LAST'
                  :                       'operateur ASC, prix ASC';

    const sql = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM forfaits_telecom
      WHERE actif = true
        AND ($1::text IS NULL OR operateur ILIKE $1)
        AND ($2::text IS NULL OR type = $2)
        AND ($3::numeric IS NULL OR prix <= $3::numeric)
        AND ($4::numeric IS NULL OR prix >= $4::numeric)
        AND ($5::int IS NULL OR data_mo >= $5::int)
      ORDER BY ${orderBy}
      LIMIT $6 OFFSET $7`;

    const params = [operateur || null, type || null, prixMax || null, prixMin || null, dataMin || null, limit, offset];
    const result = await pool.query(sql, params);
    const total = parseInt(result.rows[0]?.total_count || 0, 10);

    res.json({
      success: true,
      forfaits: result.rows,
      page: +page, limit: +limit,
      total, pages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    console.error('[GET /api/telecom]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/telecom/operateurs — liste des opérateurs distincts (pour les filtres)
router.get('/operateurs', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT operateur FROM forfaits_telecom WHERE actif = true ORDER BY operateur`
    );
    res.json(rows.map(r => r.operateur));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/telecom/:id/similaires — alternatives tous opérateurs, même type, budget proche
router.get('/:id/similaires', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const { rows: src } = await pool.query(
      'SELECT type, prix FROM forfaits_telecom WHERE id = $1', [req.params.id]
    );
    if (!src.length) return res.status(404).json({ error: 'Forfait introuvable' });

    const { type, prix } = src[0];
    const prixMin = prix * 0.5;
    const prixMax = prix * 2;

    const { rows } = await pool.query(
      `SELECT id, operateur, nom, type, data_mo, minutes, sms, validite_jours, prix,
              (COALESCE(data_mo,0)::numeric / NULLIF(prix,0) * 600
               + (CASE WHEN minutes = -1 THEN 2000 ELSE COALESCE(minutes,0) END)::numeric / NULLIF(prix,0) * 70
              ) AS score
       FROM forfaits_telecom
       WHERE actif = true AND id != $1 AND type = $2
         AND prix >= $3 AND prix <= $4
       ORDER BY score DESC NULLS LAST, prix ASC
       LIMIT $5`,
      [req.params.id, type, prixMin, prixMax, +limit]
    );

    res.json({ forfaits: rows, source: src[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/telecom/:id — détail
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM forfaits_telecom WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Forfait introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/telecom — créer (admin)
router.post('/', adminSecretOnly, async (req, res) => {
  try {
    const { operateur, nom, type, data_mo, minutes, sms, validite_jours, prix, description, image_url, source } = req.body;
    if (!operateur || !nom || !type || prix == null) {
      return res.status(400).json({ error: 'Champs requis : operateur, nom, type, prix' });
    }
    const { rows } = await pool.query(
      `INSERT INTO forfaits_telecom
         (operateur, nom, type, data_mo, minutes, sms, validite_jours, prix, description, image_url, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11,'manuel'))
       RETURNING *`,
      [operateur, nom, type, data_mo || null, minutes || null, sms || null, validite_jours || null, prix, description || null, image_url || null, source || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/telecom/:id — modifier (admin)
router.put('/:id', adminSecretOnly, async (req, res) => {
  try {
    const { operateur, nom, type, data_mo, minutes, sms, validite_jours, prix, description, image_url, actif } = req.body;
    const { rows } = await pool.query(
      `UPDATE forfaits_telecom SET
         operateur = COALESCE($1, operateur),
         nom = COALESCE($2, nom),
         type = COALESCE($3, type),
         data_mo = $4,
         minutes = $5,
         sms = $6,
         validite_jours = $7,
         prix = COALESCE($8, prix),
         description = $9,
         image_url = $10,
         actif = COALESCE($11, actif),
         updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [operateur || null, nom || null, type || null, data_mo ?? null, minutes ?? null, sms ?? null,
       validite_jours ?? null, prix ?? null, description ?? null, image_url ?? null, actif ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Forfait introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/telecom/sync-artp — scraper ARTP en arrière-plan (admin)
// ?dry=1 pour prévisualiser sans écrire en base
router.post('/sync-artp', adminSecretOnly, async (req, res) => {
  const dryRun = req.query.dry === '1';
  res.json({
    message: dryRun ? 'Scraping ARTP en dry-run (pas d\'écriture)…' : 'Scraping ARTP lancé en arrière-plan…',
    conseil: 'Résultats dans les logs serveur. Consultez /api/telecom dans quelques instants.',
    dryRun,
  });
  const { scraperARTP } = require('../services/scraper-artp');
  scraperARTP({ dryRun }).catch(console.error);
});

// DELETE /api/telecom/:id — désactiver (admin) — pas de suppression physique
router.delete('/:id', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE forfaits_telecom SET actif = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Forfait introuvable' });
    res.json({ success: true, id: rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
