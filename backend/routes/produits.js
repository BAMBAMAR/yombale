const router = require('express').Router();
const { pool, queryWithCache } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');

// GET /api/produits
router.get('/', async (req, res) => {
  try {
    const { q, categorie, limit = 20, page = 1, tri, prixMax, prixMin } = req.query;
    const offset = (page - 1) * limit;

    const orderBy = tri === 'prix_asc'  ? 'MIN(o.prix) ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'MIN(o.prix) DESC NULLS LAST'
                  : tri === 'nom_asc'   ? 'p.nom ASC'
                  :                      'COUNT(o.id) DESC NULLS LAST';

    // Filtre catégorie : slug direct sur categorie_id OU fallback mots-clés nom
    // Normaliser : '' → null pour éviter la condition $2::text IS NULL fausse
    const categorieNorm = categorie || null;

    const CAT_FALLBACK = {
      'smartphones':  ['samsung','iphone','xiaomi','tecno','infinix','oppo','huawei','nokia','realme','itel','tablette','smartphone','portable','redmi','galaxy'],
      'informatique': ['laptop','ordinateur','macbook','lenovo','dell','imprimante','clavier','souris','disque dur','ssd','moniteur','routeur',' pc ','asus','acer'],
      'tv-electro':   ['television','refriger','climatiseur','lave-linge','machine a laver','frigo','congelateur','ventilateur','fer a repasser','split ','chauffe-eau','micro-onde','four elec','induction','plaque de cuisson','air fryer','friteuse','enduro','finix','astech'],
      'maison':       ['canape','chaise','matelas','armoire','meuble','fontaine','rayonnage','batterie de cuisine'],
      'mode':         ['robe','chaussure','sac a main','chemise','pantalon','sneaker','basket','parfum','eau de toilette','eau de parfum','musc','jean homme','t-shirt'],
      'auto-moto':    ['voiture','moto ','scooter','trottinette','piece auto','batterie voiture'],
      'jeux':         ['playstation','ps4','ps5','xbox','nintendo','manette','jeu video','gaming'],
    };
    const fallback = categorieNorm ? (CAT_FALLBACK[categorieNorm] || []) : [];
    // Le fallback SQL est conditionnel : s'applique uniquement si $2 correspond à cette catégorie
    const fallbackSQL = fallback.length > 0
      ? 'OR (' + fallback.map(m => `LOWER(p.nom) LIKE '%${m}%'`).join(' OR ') + ')'
      : '';

    // $2 DOIT toujours être référencé pour que PostgreSQL connaisse son type
    const catCondition = `($2::text IS NULL
      OR p.categorie_id = (SELECT id FROM categories WHERE slug = $2 LIMIT 1)
      ${fallbackSQL ? fallbackSQL : ''})`;

    const sql = `
      SELECT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min,
             MAX(o.prix) AS prix_max,
             COUNT(o.id) AS nb_offres
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom ILIKE '%'||$1||'%' OR p.marque ILIKE '%'||$1||'%')
        AND ${catCondition}
        AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
        AND ($4::numeric IS NULL OR o.prix >= $4::numeric)
      GROUP BY p.id, c.nom
      HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
      ORDER BY ${orderBy}
      LIMIT $5 OFFSET $6`;

    const params = [q||null, categorieNorm, prixMax||null, prixMin||null, limit, offset];
    const result = await pool.query(sql, params);

    const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom ILIKE '%'||$1||'%' OR p.marque ILIKE '%'||$1||'%')
        AND ${catCondition}
        AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
        AND ($4::numeric IS NULL OR o.prix >= $4::numeric)`;

    const countResult = await pool.query(countSql, [q||null, categorieNorm, prixMax||null, prixMin||null]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Correction des prix_min aberrants sur les cartes produits
    // Utilise le prix_max comme référence : si prix_min << prix_max, corriger
    result.rows.forEach(p => {
      const pMin = parseFloat(p.prix_min);
      const pMax = parseFloat(p.prix_max);
      if (pMin > 0 && pMax > 0) {
        const ratio = pMax / pMin;
        if (ratio >= 50 && ratio < 500)       p.prix_min = pMin * 100;
        else if (ratio >= 500 && ratio < 5000) p.prix_min = pMin * 1000;
      }
    });

    res.json({
      success: true,
      produits: result.rows,
      page: +page, limit: +limit,
      total, pages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    console.error('[GET /api/produits]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/produits/:id — détail d'un produit
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min,
             COUNT(o.id) AS nb_offres
      FROM produits p
      LEFT JOIN categories c ON c.id        = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE p.id = $1
      GROUP BY p.id, c.nom`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/produits/:id/offres — triées par prix croissant
router.get('/:id/offres', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*,
             m.nom AS marchand_nom, m.site_url,
             p.nom AS produit_nom, p.marque AS produit_marque,
             o.titre_marchand
      FROM offres o
      JOIN marchands m ON m.id = o.marchand_id
      JOIN produits p  ON p.id = o.produit_id
      WHERE o.produit_id = $1 AND o.stock = true
      ORDER BY o.prix ASC`,
      [req.params.id]
    );

    // Enrichir chaque offre avec titre_affiche extrait depuis l'URL
    rows.forEach(r => {
      if (r.titre_marchand) {
        r.titre_affiche = r.titre_marchand;
      } else if (r.url_achat && r.url_achat !== '#') {
        try {
          // Extraire le slug du dernier segment non-vide de l'URL
          const segs = r.url_achat.replace(/\/+$/, '').split('/').filter(Boolean);
          const slug = segs[segs.length - 1].split('?')[0];
          if (slug && slug.length > 3 && !slug.startsWith('http')) {
            r.titre_affiche = slug.replace(/-/g, ' ');
          } else {
            r.titre_affiche = r.produit_nom;
          }
        } catch { r.titre_affiche = r.produit_nom; }
      } else {
        r.titre_affiche = r.produit_nom;
      }
    });

    // ── Correction des prix aberrants ──────────────────────────────
    // Pour des produits identiques, un prix 10x inférieur à la médiane
    // indique une division par 100 ou 1000 lors du scraping (bug XOF).
    // On corrige à la volée sans toucher la base.
    if (rows.length >= 2) {
      const prices = rows.map(r => r.prix).filter(p => p > 0).sort((a, b) => a - b);
      // Médiane robuste
      const mid = Math.floor(prices.length / 2);
      const mediane = prices.length % 2 !== 0
        ? prices[mid]
        : (prices[mid - 1] + prices[mid]) / 2;

      rows.forEach(r => {
        if (r.prix <= 0) return;
        const ratio = mediane / r.prix;
        // Si prix est ~100x trop petit → multiplier par 100
        if (ratio >= 50 && ratio < 500) {
          r.prix = r.prix * 100;
          r._corrige = true;
        }
        // Si prix est ~1000x trop petit → multiplier par 1000
        else if (ratio >= 500) {
          r.prix = r.prix * 1000;
          r._corrige = true;
        }
      });

      // Retrier après correction
      rows.sort((a, b) => a.prix - b.prix);
    }

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/produits/:id/similaires — similaires intelligents : même marque > même catégorie
router.get('/:id/similaires', async (req, res) => {
  try {
    const { marchand, prixMax, prixMin, limit = 8 } = req.query;

    const { rows: src } = await pool.query(
      'SELECT nom, marque, categorie_id FROM produits WHERE id=$1', [req.params.id]
    );
    if (!src.length) return res.status(404).json({ error: 'Produit introuvable' });

    const { nom, marque, categorie_id } = src[0];
    // Extraire mots-clés + specs techniques (litres, BTU, watts, pouces, Go)
    const stopWords = new Set(['avec','pour','plus','sans','noir','blanc','gris','bleu','rouge','vert','rose','gold','silver','neuf','neuve','original','offerte','pose']);

    // Extraire les specs numériques du nom (50L, 9000BTU, 4K, 128Go, etc.)
    const specsRegex = /(\d+)\s*(litres?|l|btu|watts?|w|pouces?|"|go|gb|tb|cv|mah|mp|kg|hz)/gi;
    const specs = [];
    let m;
    const nomCopy = nom;
    const reSpec = new RegExp(specsRegex.source, 'gi');
    while ((m = reSpec.exec(nomCopy)) !== null) {
      specs.push(m[0].replace(/\s/g,'').toLowerCase());
    }

    const mots = nom.split(/[\s,\-\/]+/)
      .filter(m => m.length > 3 && !stopWords.has(m.toLowerCase()) && !/^\d+$/.test(m))
      .slice(0, 3);

    // Combiner mots-clés + specs pour la recherche
    const motsClesRecherche = [...new Set([...mots, ...specs])].slice(0, 5);

    // Priorité 1 : même marque + mots-clés
    const q1 = `
      SELECT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min, COUNT(DISTINCT o.id) AS nb_offres,
             'meme_marque' AS similarite
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      LEFT JOIN marchands m  ON m.id = o.marchand_id
      WHERE p.id != $1
        AND p.marque ILIKE $2
        AND p.categorie_id = $3
        AND ($4::text IS NULL OR m.nom ILIKE '%'||$4||'%')
        AND ($5::numeric IS NULL OR o.prix <= $5)
        AND ($6::numeric IS NULL OR o.prix >= $6)
      GROUP BY p.id, c.nom
      HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
      ORDER BY
        -- Score de similarité : compter les mots-clés communs dans le nom
        (${mots.map((m,i) => `CASE WHEN p.nom ILIKE '%'||$${7+i}||'%' THEN 1 ELSE 0 END`).join('+')}) DESC,
        MIN(o.prix) ASC NULLS LAST
      LIMIT $${7+motsClesRecherche.length}`;

    const params1 = [req.params.id, marque || '%', categorie_id,
      marchand || null, prixMax || null, prixMin || null,
      ...motsClesRecherche, Math.ceil(+limit)];

    const { rows: r1 } = await pool.query(q1, params1);

    // Priorité 2 : même catégorie + mots-clés (si pas assez de résultats)
    let rows = r1;
    if (r1.length < Math.ceil(+limit / 2)) {
      const excludeIds = [req.params.id, ...r1.map(r => r.id)];
      const q2 = `
        SELECT p.*, c.nom AS categorie_nom,
               MIN(o.prix) AS prix_min, COUNT(DISTINCT o.id) AS nb_offres,
               'meme_categorie' AS similarite
        FROM produits p
        LEFT JOIN categories c ON c.id = p.categorie_id
        LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
        LEFT JOIN marchands m  ON m.id = o.marchand_id
        WHERE p.id != ALL($1::uuid[])
          AND p.categorie_id = $2
          AND ($3::text IS NULL OR m.nom ILIKE '%'||$3||'%')
          AND ($4::numeric IS NULL OR o.prix <= $4)
          AND ($5::numeric IS NULL OR o.prix >= $5)
        GROUP BY p.id, c.nom
        HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
        ORDER BY
          (${motsClesRecherche.map((m,i) => `CASE WHEN p.nom ILIKE '%'||$${6+i}||'%' THEN 1 ELSE 0 END`).join('+')}) DESC,
          MIN(o.prix) ASC NULLS LAST
        LIMIT $${6+motsClesRecherche.length}`;

      const params2 = [excludeIds, categorie_id,
        marchand || null, prixMax || null, prixMin || null,
        ...motsClesRecherche, +limit - r1.length];

      const { rows: r2 } = await pool.query(q2, params2);
      rows = [...r1, ...r2];
    }

    res.json({ produits: rows, source: src[0], mots_cles: motsClesRecherche, specs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/produits/:id/historique — 90 derniers jours
router.get('/:id/historique', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DATE_TRUNC('day', h.date) AS jour,
             MIN(h.prix) AS prix_min, MAX(h.prix) AS prix_max
      FROM historique_prix h
      JOIN offres o ON o.id = h.offre_id
      WHERE o.produit_id = $1
        AND h.date >= NOW() - INTERVAL '90 days'
      GROUP BY jour ORDER BY jour ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/produits — créer (admin)
router.post('/', verifierToken, async (req, res) => {
  try {
    const { nom, marque, categorie_id, ean, image_url } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO produits (nom,marque,categorie_id,ean,image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [nom, marque, categorie_id, ean, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
