// backend/routes/immo.js — Annonces immobilières (location / vente)
// Verticale distincte : une annonce = un bien unique chez un propriétaire/agence,
// pas un produit multi-marchands.
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../models/db');
const { adminSecretOnly, verifierToken, tokenOptional, requireEmailVerifie } = require('../middlewares/auth');
const { limiterPublication, limiterImmo, limiterBulk, blockScraperUA } = require('../middlewares/rateLimit');
const { notifierModerationImmo } = require('../services/notifications');

const validationAnnonce = [
  body('titre').trim().notEmpty(),
  body('contact_tel').trim().notEmpty(),
  body('type_bien').optional({ checkFalsy: true }).isString(),
  body('transaction').optional({ checkFalsy: true }).isIn(['location', 'vente']),
  body('prix').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
  body('surface_m2').optional({ checkFalsy: true }).isFloat({ gt: 0 }),
  body('nb_pieces').optional({ checkFalsy: true }).isInt({ gt: 0 }),
  body('nb_chambres').optional({ checkFalsy: true }).isInt({ gt: 0 }),
  body('meuble').optional().isBoolean(),
];

const ORDER_MAP = {
  prix_asc:     'prix ASC NULLS LAST',
  prix_desc:    'prix DESC NULLS LAST',
  recent:       'created_at DESC',
  surface_desc: 'surface_m2 DESC NULLS LAST',
};

// GET /api/immo — liste / filtre paginé
router.get('/', blockScraperUA, tokenOptional, limiterBulk, async (req, res) => {
  try {
    const {
      ville, quartier, type_bien, transaction = 'location',
      prixMin, prixMax, surfaceMin, nbPieces, nbChambres, meuble, source,
      tri = 'recent', limit = 24, page = 1,
    } = req.query;

    const offset  = (page - 1) * limit;
    const orderBy = ORDER_MAP[tri] || ORDER_MAP.recent;

    const sql = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM annonces_immo
      WHERE actif = true
        AND (prix IS NULL OR prix >= 10000)
        AND ($1::text IS NULL OR transaction = $1)
        AND ($2::text IS NULL OR ville ILIKE $2)
        AND ($3::text IS NULL OR quartier ILIKE '%' || $3 || '%')
        AND ($4::text IS NULL OR (
              LOWER(type_bien) = LOWER($4)
              OR LOWER(type_bien) = LOWER($4) || '_meuble'
            ))
        AND ($5::numeric IS NULL OR prix >= $5::numeric)
        AND ($6::numeric IS NULL OR prix <= $6::numeric)
        AND ($7::int IS NULL OR surface_m2 >= $7::int)
        AND ($8::int IS NULL OR nb_pieces >= $8::int)
        AND ($9::int IS NULL OR nb_chambres >= $9::int)
        AND ($10::boolean IS NULL OR (
              ($10::boolean = true  AND (meuble = true  OR type_bien ILIKE '%meuble%'))
              OR ($10::boolean = false AND meuble = false AND type_bien NOT ILIKE '%meuble%')
            ))
        AND ($11::text IS NULL OR source = $11)
        AND supprimee = false
      ORDER BY (sponsorisee = true AND sponsorisee_jusqu_au > NOW()) DESC, ${orderBy}
      LIMIT $12 OFFSET $13`;

    const params = [
      transaction || null, ville || null, quartier || null,
      type_bien || null, prixMin || null, prixMax || null,
      surfaceMin || null, nbPieces || null, nbChambres || null,
      meuble === 'true' ? true : meuble === 'false' ? false : null,
      source || null, limit, offset,
    ];

    const result = await pool.query(sql, params);
    const total  = parseInt(result.rows[0]?.total_count || 0, 10);

    res.json({
      success: true,
      annonces: result.rows,
      page: +page, limit: +limit,
      total, pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('[GET /api/immo]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/immo/diagnostic — vérifier DB + réseau (admin)
router.get('/diagnostic', adminSecretOnly, async (req, res) => {
  const axios = require('axios');
  const diag  = { db: {}, reseau: {} };

  try {
    const r = await pool.query(`
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE actif) AS actives,
             MAX(created_at) AS derniere
      FROM annonces_immo`);
    diag.db = { ok: true, ...r.rows[0] };
  } catch (err) {
    diag.db = { ok: false, erreur: err.message };
  }

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122';
  try {
    const t0 = Date.now();
    const r  = await axios.get('https://www.expat-dakar.com/appartements-a-louer', {
      headers: { 'User-Agent': UA }, timeout: 12000,
    });
    const cheerio = require('cheerio');
    const $       = cheerio.load(r.data);
    diag.reseau   = { ok: true, http: r.status, cartes: $('.listing-card').length, ms: Date.now() - t0 };
  } catch (err) {
    diag.reseau = { ok: false, http: err.response?.status, erreur: err.message };
  }

  res.json(diag);
});

// GET /api/immo/villes — villes distinctes (pour filtres)
router.get('/villes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ville, COUNT(*) AS nb
       FROM annonces_immo WHERE actif = true AND ville IS NOT NULL
       GROUP BY ville ORDER BY nb DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/immo/stats — stats rapides pour le dashboard
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                               AS total,
        COUNT(*) FILTER (WHERE transaction='location')        AS locations,
        COUNT(*) FILTER (WHERE transaction='vente')           AS ventes,
        COUNT(DISTINCT source)                                AS sources,
        MIN(prix) FILTER (WHERE transaction='location')       AS prix_min_loc,
        MAX(prix) FILTER (WHERE transaction='location')       AS prix_max_loc
      FROM annonces_immo WHERE actif = true
    `);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/immo/mine — mes annonces publiées (utilisateur connecté)
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM annonces_immo WHERE utilisateur_id = $1 AND supprimee = false ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/immo/mine/:id — modifier sa propre annonce
router.put('/mine/:id', verifierToken, validationAnnonce, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      titre, type_bien, transaction, prix, surface_m2, nb_pieces, nb_chambres,
      ville, quartier, description, contact_nom, contact_tel,
    } = req.body;

    const { rows } = await pool.query(`
      UPDATE annonces_immo SET
        titre=$1, type_bien=$2, transaction=$3, prix=$4, surface_m2=$5, nb_pieces=$6,
        nb_chambres=$7, ville=$8, quartier=$9, description=$10, contact_nom=$11, contact_tel=$12,
        updated_at=NOW()
      WHERE id=$13 AND utilisateur_id=$14 AND supprimee=false
      RETURNING id`,
      [titre, type_bien || 'appartement', transaction || 'location', prix || null,
       surface_m2 || null, nb_pieces || null, nb_chambres || null, ville || 'Dakar',
       quartier || null, description || null, contact_nom || null, contact_tel,
       req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json({ success: true, message: 'Annonce mise à jour.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/immo/mine/:id — supprimer sa propre annonce
router.delete('/mine/:id', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE annonces_immo SET supprimee=true, actif=false, updated_at=NOW()
       WHERE id=$1 AND utilisateur_id=$2 RETURNING id`,
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/immo/:id/demande-sponsorisation — demander la mise en avant (utilisateur, propriétaire)
router.post('/:id/demande-sponsorisation', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE annonces_immo SET demande_sponsorisation = true, updated_at = NOW()
       WHERE id = $1 AND utilisateur_id = $2 RETURNING id, titre, contact_tel`,
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Annonce introuvable' });

    const { envoyerEmail } = require('../services/email');
    envoyerEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `⭐ Demande de mise en avant — ${rows[0].titre}`,
      html: `<p>Un utilisateur souhaite mettre en avant son annonce « ${rows[0].titre} ».</p>
             <p>Contact : ${rows[0].contact_tel || '—'}</p>
             <p>Validez/activez la mise en avant depuis l'admin Immobilier.</p>`,
    }).catch(() => {});

    res.json({ success: true, message: 'Demande envoyée. Nous vous contacterons pour le paiement et l\'activation.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/immo/admin/en-attente — annonces utilisateurs à valider (admin)
router.get('/admin/en-attente', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM annonces_immo WHERE actif = false AND source = 'utilisateur' ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/immo/admin/demandes-sponsorisation — demandes de mise en avant (admin)
router.get('/admin/demandes-sponsorisation', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM annonces_immo WHERE demande_sponsorisation = true ORDER BY updated_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/immo/:id/similaires — biens comparables : même secteur + type + transaction, prix proche
router.get('/:id/similaires', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const { rows: src } = await pool.query(
      'SELECT ville, quartier, type_bien, transaction, prix FROM annonces_immo WHERE id = $1', [req.params.id]
    );
    if (!src.length) return res.status(404).json({ error: 'Annonce introuvable' });

    const { ville, quartier, type_bien, transaction, prix } = src[0];
    const prixMin = prix ? prix * 0.6 : null;
    const prixMax = prix ? prix * 1.6 : null;

    let rows = [];
    if (quartier) {
      const { rows: r1 } = await pool.query(
        `SELECT id, titre, prix, ville, quartier, type_bien, transaction, surface_m2, nb_pieces, nb_chambres, photos
         FROM annonces_immo
         WHERE actif = true AND supprimee = false AND id != $1
           AND quartier ILIKE $2 AND type_bien = $3 AND transaction = $4
           AND ($5::numeric IS NULL OR prix IS NULL OR (prix >= $5 AND prix <= $6))
         ORDER BY ABS(COALESCE(prix, $7) - $7) ASC
         LIMIT $8`,
        [req.params.id, quartier, type_bien, transaction, prixMin, prixMax, prix || 0, +limit]
      );
      rows = r1;
    }

    if (rows.length < Math.ceil(+limit / 2)) {
      const excludeIds = [req.params.id, ...rows.map(r => r.id)];
      const { rows: r2 } = await pool.query(
        `SELECT id, titre, prix, ville, quartier, type_bien, transaction, surface_m2, nb_pieces, nb_chambres, photos
         FROM annonces_immo
         WHERE actif = true AND supprimee = false AND id != ALL($1::uuid[])
           AND ville ILIKE $2 AND type_bien = $3 AND transaction = $4
           AND ($5::numeric IS NULL OR prix IS NULL OR (prix >= $5 AND prix <= $6))
         ORDER BY ABS(COALESCE(prix, $7) - $7) ASC
         LIMIT $8`,
        [excludeIds, ville, type_bien, transaction, prixMin, prixMax, prix || 0, +limit - rows.length]
      );
      rows = [...rows, ...r2];
    }

    res.json({ annonces: rows, source: src[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/immo/:id — détail
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM annonces_immo WHERE id = $1', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/immo/public — annonce gratuite déposée par un utilisateur
// (en attente de validation par un admin : actif = false)
router.post('/public', limiterPublication, verifierToken, requireEmailVerifie, validationAnnonce, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      titre, type_bien = 'appartement', transaction = 'location',
      prix, surface_m2, nb_pieces, nb_chambres, meuble,
      ville = 'Dakar', quartier, description,
      contact_nom, contact_tel,
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO annonces_immo
        (titre, type_bien, transaction, prix, surface_m2, nb_pieces, nb_chambres, meuble,
         ville, quartier, description, source, actif, contact_nom, contact_tel, utilisateur_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'utilisateur',false,$12,$13,$14)
      RETURNING id`,
      [titre, type_bien, transaction, prix || null, surface_m2 || null,
       nb_pieces || null, nb_chambres || null, meuble === true || meuble === 'true' ? true : false,
       ville, quartier || null, description || null, contact_nom || null, contact_tel, req.user.userId]
    );
    res.status(201).json({
      success: true,
      id: rows[0].id,
      message: 'Annonce envoyée — elle sera visible après validation.',
    });
  } catch (err) {
    console.error('[POST /api/immo/public]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/immo — créer (admin ou scraper)
router.post('/', adminSecretOnly, async (req, res) => {
  try {
    const {
      titre, type_bien = 'appartement', transaction = 'location',
      prix, surface_m2, nb_pieces, nb_chambres, meuble,
      ville = 'Dakar', quartier, description, photos = [],
      url_source, source = 'manuel', ref_externe,
    } = req.body;

    if (!titre) return res.status(400).json({ error: 'titre requis' });

    const { rows } = await pool.query(`
      INSERT INTO annonces_immo
        (titre, type_bien, transaction, prix, surface_m2, nb_pieces, nb_chambres, meuble,
         ville, quartier, description, photos, url_source, source, ref_externe)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (source, ref_externe) WHERE ref_externe IS NOT NULL
      DO UPDATE SET
        titre       = EXCLUDED.titre,
        prix        = EXCLUDED.prix,
        description = EXCLUDED.description,
        photos      = EXCLUDED.photos,
        actif       = true,
        updated_at  = NOW()
      RETURNING *`,
      [titre, type_bien, transaction, prix || null, surface_m2 || null,
       nb_pieces || null, nb_chambres || null, meuble === true || meuble === 'true' ? true : false,
       ville, quartier || null, description || null, JSON.stringify(photos), url_source || null,
       source, ref_externe || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/immo/:id — modifier (admin)
router.put('/:id', adminSecretOnly, async (req, res) => {
  try {
    const {
      titre, type_bien, transaction, prix, surface_m2, nb_pieces, nb_chambres,
      ville, quartier, description, photos, url_source, actif,
      sponsorisee, sponsorisee_jusqu_au, demande_sponsorisation,
      rejete, motif_rejet,
    } = req.body;
    const { rows } = await pool.query(`
      UPDATE annonces_immo SET
        titre       = COALESCE($1, titre),
        type_bien   = COALESCE($2, type_bien),
        transaction = COALESCE($3, transaction),
        prix        = COALESCE($4, prix),
        surface_m2  = COALESCE($5, surface_m2),
        nb_pieces   = COALESCE($6, nb_pieces),
        nb_chambres = COALESCE($7, nb_chambres),
        ville       = COALESCE($8, ville),
        quartier    = COALESCE($9, quartier),
        description = COALESCE($10, description),
        photos      = COALESCE($11::jsonb, photos),
        url_source  = COALESCE($12, url_source),
        actif       = COALESCE($13, actif),
        sponsorisee            = COALESCE($15, sponsorisee),
        sponsorisee_jusqu_au   = COALESCE($16::timestamptz, sponsorisee_jusqu_au),
        demande_sponsorisation = COALESCE($17, demande_sponsorisation),
        rejete      = COALESCE($18, rejete),
        motif_rejet = COALESCE($19, motif_rejet),
        updated_at  = NOW()
      WHERE id = $14 RETURNING *`,
      [titre || null, type_bien || null, transaction || null,
       prix ?? null, surface_m2 ?? null, nb_pieces ?? null, nb_chambres ?? null,
       ville || null, quartier ?? null, description ?? null,
       photos ? JSON.stringify(photos) : null, url_source ?? null,
       actif ?? null, req.params.id,
       sponsorisee ?? null, sponsorisee_jusqu_au ?? null, demande_sponsorisation ?? null,
       rejete ?? null, motif_rejet ?? null]
    );
    if (!rows.length) return res.status(404).json({ error: 'Annonce introuvable' });
    if (actif === true || rejete === true) {
      notifierModerationImmo(rows[0]).catch(() => {});
    }
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/immo/:id — désactiver (pas de suppression physique)
router.delete('/:id', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE annonces_immo SET actif = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Annonce introuvable' });
    res.json({ success: true, id: rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/immo/sync/:source — déclencher scraping en arrière-plan (admin)
// sources : expat-dakar | coinafrique | facebook
router.post('/sync/:source', adminSecretOnly, async (req, res) => {
  const src = req.params.source;
  const dryRun = req.query.dry === '1';
  const SCRAPERS = {
    'expat-dakar':  '../services/scraper-immo-expat',
    'coinafrique':  '../services/scraper-immo-coinafrique',
    'facebook':     '../services/scraper-immo-facebook',
  };
  if (!SCRAPERS[src]) {
    return res.status(400).json({ error: `Source inconnue : ${src}. Valeurs : ${Object.keys(SCRAPERS).join(', ')}` });
  }
  res.json({
    message: `Scraping immo "${src}" lancé en arrière-plan${dryRun ? ' (dry-run)' : ''}…`,
    conseil: 'Résultats dans les logs Railway. Consultez /api/immo/diagnostic pour vérifier la DB.',
    dryRun,
  });
  const { scraperImmo } = require(SCRAPERS[src]);
  scraperImmo({ dryRun }).catch(err => console.error('[SYNC IMMO ERROR]', err.message));
});

module.exports = router;
