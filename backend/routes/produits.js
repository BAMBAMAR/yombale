const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function checkUUID(req, res, next) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID invalide' });
  next();
}

// GET /api/produits
router.get('/', async (req, res) => {
  try {
    const { q, categorie, sousType, limit = 20, page = 1, tri, prixMax, prixMin } = req.query;
    const offset = (page - 1) * limit;

    const orderBy = tri === 'prix_asc'  ? 'MIN(o.prix) ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'MIN(o.prix) DESC NULLS LAST'
                  : tri === 'nom_asc'   ? 'p.nom ASC'
                  :                      'COUNT(o.id) DESC NULLS LAST';

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

    // Filtre sous-type : mots-clés précis au sein d'une catégorie (ex: 'tv' dans 'tv-electro')
    const SOUS_TYPE_MOTS = {
      'tv'      : ['television','televiseur','tv led','tv 4k','tv oled','tv qled','smart tv','android tv','led tv','ecran tv','astech tv','bruhm','skyworth','finix tv','enduro tv'],
      'froid'   : ['refriger','frigo','congelat','vitrine refrig','armoire refrig'],
      'clim'    : ['climatiseur','split ','split inv','pompe a chaleur'],
      'audio'   : ['ecouteur','casque audio','casque bluetooth','enceinte bluetooth','enceinte portable','soundbar','barre de son','haut-parleur','airpod','tws'],
      'electro' : ['micro-onde','four electrique','four elec','lave-linge','machine a laver','ventilateur','aspirateur','air fryer','friteuse','induction','plaque de cuisson','chauffe-eau','fer a repasser','cafetiere','bouilloire','grille-pain'],
      'tablette': ['tablette','ipad','galaxy tab','samsung tab','lenovo tab','matepad','xiaomi pad'],
    };

    if (categorieNorm && !CAT_FALLBACK[categorieNorm]) {
      return res.status(400).json({ error: 'Catégorie invalide' });
    }
    if (sousType && !SOUS_TYPE_MOTS[sousType]) {
      return res.status(400).json({ error: 'Sous-type invalide' });
    }

    const fallback = categorieNorm ? (CAT_FALLBACK[categorieNorm] || []) : [];
    const fallbackSQL = fallback.length > 0
      ? 'OR (' + fallback.map(m => `LOWER(p.nom) LIKE '%${m}%'`).join(' OR ') + ')'
      : '';

    const catCondition = `($2::text IS NULL
      OR p.categorie_id = (SELECT id FROM categories WHERE slug = $2 LIMIT 1)
      ${fallbackSQL})`;

    // Filtre sous-type optionnel (7e paramètre)
    const sousMots = sousType ? (SOUS_TYPE_MOTS[sousType] || []) : [];
    const sousTypeCondition = sousMots.length > 0
      ? 'AND (' + sousMots.map(m => `LOWER(p.nom) LIKE '%${m}%'`).join(' OR ') + ')'
      : '';

    const sql = `
      SELECT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min,
             MAX(o.prix) AS prix_max,
             COUNT(o.id) AS nb_offres,
             COUNT(*) OVER() AS total_count
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom ILIKE '%'||$1||'%' OR p.marque ILIKE '%'||$1||'%')
        AND ${catCondition}
        AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
        AND ($4::numeric IS NULL OR o.prix >= $4::numeric)
        ${sousTypeCondition}
      GROUP BY p.id, c.nom
      HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
      ORDER BY ${orderBy}
      LIMIT $5 OFFSET $6`;

    const params = [q||null, categorieNorm, prixMax||null, prixMin||null, limit, offset];
    const result = await pool.query(sql, params);
    const total = parseInt(result.rows[0]?.total_count || 0, 10);

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
router.get('/:id', checkUUID, async (req, res) => {
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
router.get('/:id/offres', checkUUID, async (req, res) => {
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

    // Détecter les prix outlier (écart > 10× ou < 10% de la médiane)
    if (rows.length >= 3) {
      const sorted = rows.map(r => +r.prix).sort((a, b) => a - b);
      const mediane = sorted[Math.floor(sorted.length / 2)];
      rows.forEach(r => {
        const ratio = +r.prix / mediane;
        if (ratio < 0.1 || ratio > 8) r._suspect = true;
      });
    }

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

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/produits/:id/similaires — similaires intelligents : même marque > même catégorie
router.get('/:id/similaires', checkUUID, async (req, res) => {
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
router.get('/:id/historique', checkUUID, async (req, res) => {
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
router.post('/', adminSecretOnly, async (req, res) => {
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
