const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken, tokenOptional, adminSecretOnly } = require('../middlewares/auth');
const { blockScraperUA, limiterRecherche, limiterBulk } = require('../middlewares/rateLimit');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function checkUUID(req, res, next) {
  if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID invalide' });
  next();
}

// GET /api/produits/instantanee — Auto-complétion instantanée visuelle (Typeahead)
router.get('/instantanee', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    if (!q || q.length < 2) {
      return res.json({ success: true, produits: [], boutiques: [] });
    }

    const term = `%${q}%`;

    // 1. Produits marchands
    const prodsRes = await pool.query(
      `SELECT p.id, p.nom, p.prix, p.images, p.categorie, p.boutique_id, b.nom as boutique_nom, b.slug as boutique_slug
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       WHERE (p.nom ILIKE $1 OR p.categorie ILIKE $1) AND b.actif = true
       ORDER BY p.created_at DESC LIMIT 5`,
      [term]
    );

    // 2. Boutiques marchandes
    const bqRes = await pool.query(
      `SELECT id, nom, logo_url, ville, slug, categorie
       FROM boutiques
       WHERE (nom ILIKE $1 OR description ILIKE $1 OR ville ILIKE $1) AND actif = true
       LIMIT 3`,
      [term]
    );

    res.json({ success: true, produits: prodsRes.rows, boutiques: bqRes.rows });
  } catch (err) {
    console.error('[PRODUITS INSTANTANEE ERR]', err);
    res.status(500).json({ error: 'Erreur recherche instantanée' });
  }
});

// GET /api/produits/categories-actives
router.get('/categories-actives', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT c.slug
      FROM categories c 
      JOIN produits p ON p.categorie_id = c.id 
      JOIN offres o ON o.produit_id = p.id 
      WHERE o.stock = true AND o.quarantinee = false
      UNION
      SELECT DISTINCT categorie as slug FROM boutique_produits WHERE en_stock = true
    `);
    const activeSlugs = rows.map(r => r.slug).filter(Boolean);
    
    // Add other verticals if they have at least one active item
    const [immo, annonces, telecom] = await Promise.all([
      pool.query('SELECT 1 FROM annonces_immo WHERE active = true LIMIT 1').catch(() => ({ rows: [] })),
      pool.query('SELECT 1 FROM annonces_classifiees WHERE active = true LIMIT 1').catch(() => ({ rows: [] })),
      pool.query('SELECT 1 FROM forfaits_telecom LIMIT 1').catch(() => ({ rows: [] }))
    ]);
    
    if (immo.rows.length > 0) activeSlugs.push('immo');
    if (annonces.rows.length > 0) activeSlugs.push('annonces');
    if (telecom.rows.length > 0) activeSlugs.push('telecom');
    
    res.json(activeSlugs);
  } catch (err) {
    console.error('[GET /api/produits/categories-actives]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/produits
router.get('/', blockScraperUA, tokenOptional, limiterBulk, async (req, res) => {
  try {
    const { q, categorie, sousType, limit = 20, page = 1, tri, prixMax, prixMin, etat } = req.query;
    const offset = (page - 1) * limit;

    // Défaut = meilleur prix d'abord (demande produit, 17/07/2026). L'ancien défaut
    // "popularité" (nb d'offres) reste accessible via tri=populaire.
    // Défaut homepage (aucun tri ni catégorie choisis, 19/07/2026) : mixage round-robin
    // par catégorie dans un ordre fixe (un Téléphone, un Informatique, un TV&Electro...
    // puis on reboucle), prix croissant à l'intérieur de chaque catégorie. Exclut aussi
    // les accessoires < 20 000 FCFA (sauf si l'utilisateur choisit un prixMin explicite).
    const defautMixe = !tri && !categorie;
    // En mode mixé, l'ORDER BY final s'applique sur la sous-requête "ranked" — les
    // colonnes y sont déjà aliasées (categorie_nom, prix_min), pas c.nom/MIN(o.prix).
    const CATEGORIE_ORDRE_RANKED = `CASE ranked.categorie_nom
      WHEN 'Telephones'   THEN 1
      WHEN 'Informatique' THEN 2
      WHEN 'TV & Electro' THEN 3
      WHEN 'Mode'         THEN 4
      WHEN 'Maison'       THEN 5
      WHEN 'Auto & Moto'  THEN 6
      WHEN 'Jeux'         THEN 7
      ELSE 8
    END`;
    const orderBy = tri === 'prix_asc'  ? 't.agg_prix_min ASC NULLS LAST'
                  : tri === 'prix_desc' ? 't.agg_prix_min DESC NULLS LAST'
                  : tri === 'nom_asc'   ? 't.nom ASC'
                  : tri === 'populaire' ? 't.agg_nb_offres DESC NULLS LAST'
                  : defautMixe          ? `ranked.rang_categorie ASC, ${CATEGORIE_ORDRE_RANKED} ASC, ranked.agg_prix_min ASC NULLS LAST`
                  :                       't.agg_prix_min ASC NULLS LAST';

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
      'iphone'      : ['iphone'],
      'samsung'     : ['samsung', 'galaxy'],
      'xiaomi'      : ['xiaomi', 'redmi', 'poco'],
      'tecno'       : ['tecno', 'spark', 'camon'],
      'ordinateurs' : ['laptop', 'ordinateur', 'macbook', 'notebook', 'pc portable', 'lenovo', 'dell', 'asus', 'acer', 'chromebook'],
      'smartphones' : ['iphone','galaxy','tecno ','infinix','itel ','vivo ','oppo ','realme','redmi','xiaomi','huawei','nokia ','oneplus','pixel','motorola','smartphone','telephone portable'],
      'maison'      : ['canape','chaise','matelas','lit ','armoire','meuble','fontaine','table basse','commode'],
      'mode'        : ['robe ','chaussure','sac a main','chemise','pantalon','sneaker','basket','parfum','eau de toilette','t-shirt','jean '],
      'auto-moto'   : ['voiture','moto ','scooter','trottinette','piece auto','batterie voiture'],
      'jeux'        : ['playstation','ps4','ps5','xbox','nintendo','manette','jeu video','gaming','casque gamer'],
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

    const sousMots = sousType ? (SOUS_TYPE_MOTS[sousType] || []) : [];
    const sousTypeCondition = sousMots.length > 0
      ? 'AND (' + sousMots.map(m => `LOWER(p.nom) LIKE '%${m}%'`).join(' OR ') + ')'
      : '';

    // Tokeniser q pour la recherche mot par mot
    const ALIASES = {
      'techno': 'tecno', 'técno': 'tecno', 'teknos': 'tecno',
      'samsumg': 'samsung', 'samung': 'samsung', 'samsunh': 'samsung',
      'iphonne': 'iphone', 'iphones': 'iphone',
      'xiaomie': 'xiaomi', 'xiomi': 'xiaomi',
      'realmee': 'realme', 'realmi': 'realme',
      'huawai': 'huawei', 'huawey': 'huawei',
      'infenix': 'infinix', 'infinex': 'infinix',
      'playstation': 'playstation', 'plastation': 'playstation',
      'coque': 'coque', 'colle': 'coque',
    };
    const qTrim = (q || '').trim().toLowerCase()
      .replace(/[éèêë]/g,'e').replace(/[àâä]/g,'a').replace(/[ùûü]/g,'u')
      .replace(/[îï]/g,'i').replace(/[ôö]/g,'o').replace(/[ç]/g,'c');
    const rawTokens = qTrim
      ? qTrim.split(/\s+/).map(t => t.replace(/[^a-z0-9\-]/g, '')).filter(t => t.length >= 2)
      : [];
    // Appliquer les alias et diviser les tokens lettre-chiffre (ex: "iphone14" → "iphone","14")
    const expandedSet = new Set();
    for (const t of rawTokens) {
      const aliased = ALIASES[t] || t;
      expandedSet.add(aliased);
      // Scinder aux frontières lettre↔chiffre : "iphone14" → ["iphone","14"]
      const parts = aliased.split(/(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/).filter(p => p.length >= 2);
      if (parts.length > 1) parts.forEach(p => expandedSet.add(p));
    }
    const tokens = [...expandedSet];
    // Les token params viennent après les 7 params de base ($8, $9, ...)
    const tokenParams = tokens.map(t => '%' + t + '%');
    const baseParams  = [q||null, categorieNorm, prixMax||null, prixMin||null, limit, offset, etat || null];

    // Construire la condition texte selon le nombre de tokens
    function buildQCond(operator) {
      if (tokens.length <= 1) {
        // Cas simple : ILIKE sur la query complète (comportement original)
        return "($1::text IS NULL OR p.nom ILIKE '%'||$1||'%' OR p.marque ILIKE '%'||$1||'%')";
      }
      // Cas multi-tokens : chaque mot doit apparaître (AND) ou n'importe lequel (OR fallback)
      // $1::text IS NULL est toujours référencé pour que PostgreSQL puisse typer $1
      const clauses = tokens.map((_, i) => {
        const pidx = 8 + i;
        return `(p.nom ILIKE $${pidx} OR p.marque ILIKE $${pidx})`;
      });
      return `($1::text IS NULL OR (${clauses.join(' ' + operator + ' ')}))`;
    }

    // Prix plancher par défaut (hors accessoires) — seulement quand l'utilisateur n'a
    // fourni ni tri ni catégorie ni prixMin explicite.
    const prixMinDefautMixe = defautMixe && !prixMin ? 20000 : null;

    function buildSQL(qCond) {
      // La table produits a elle-même des colonnes prix_min/nb_offres (stales, non
      // utilisées — toujours recalculées ici). p.* les inclut donc en double avec les
      // agrégats ci-dessous ⇒ agrégats calculés sous des noms distincts en interne,
      // ré-exposés comme prix_min/nb_offres (contrat JSON existant) seulement dans le
      // SELECT final, pour éviter toute ambiguïté de colonne dans les sous-requêtes.
      const base = `
        SELECT p.*, c.nom AS categorie_nom,
               MIN(o.prix) AS agg_prix_min,
               MAX(o.prix) AS agg_prix_max,
               COUNT(o.id) AS agg_nb_offres,
               COALESCE(jsonb_agg(DISTINCT o.specs->>'etat') FILTER (WHERE o.specs->>'etat' IS NOT NULL), '[]'::jsonb) AS etats
        FROM produits p
        LEFT JOIN categories c ON c.id = p.categorie_id
        LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true AND o.quarantinee = false
        WHERE ${qCond}
          AND ${catCondition}
          AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
          AND ($4::numeric IS NULL OR o.prix >= $4::numeric)
          AND ($7::text IS NULL OR EXISTS (
                SELECT 1 FROM offres o2
                WHERE o2.produit_id = p.id AND o2.stock = true AND o2.quarantinee = false AND o2.specs->>'etat' = $7
              ))
          ${sousTypeCondition}
        GROUP BY p.id, c.nom
        HAVING (COUNT(o.id) = 0 OR MIN(o.prix) >= 500)
          ${prixMinDefautMixe ? `AND MIN(o.prix) >= ${prixMinDefautMixe}` : ''}`;

      // p.* apporte déjà id/nom/description/image_url/marque/ean/categorie_id/
      // created_at/sponsorise/sponsor_jusqu_au/prix_min/nb_offres (stales) — on les
      // reprend explicitement pour ne renvoyer que les colonnes utiles au frontend,
      // avec prix_min/nb_offres pointant vers les agrégats recalculés (agg_*).
      const colonnesFinales = `
        t.id, t.nom, t.description, t.image_url, t.marque, t.ean, t.categorie_id,
        t.created_at, t.sponsorise, t.sponsor_jusqu_au, t.categorie_nom,
        t.agg_prix_min AS prix_min, t.agg_prix_max AS prix_max, t.agg_nb_offres AS nb_offres, t.etats`;

      if (!defautMixe) {
        return `
          SELECT ${colonnesFinales}, COUNT(*) OVER() AS total_count
          FROM (${base}) t
          ORDER BY (t.sponsorise = true AND (t.sponsor_jusqu_au IS NULL OR t.sponsor_jusqu_au > NOW())) DESC, ${orderBy}
          LIMIT $5 OFFSET $6`;
      }

      // Mode mixé : rang du produit au sein de sa catégorie (prix croissant), puis
      // round-robin global — un produit de chaque catégorie à tour de rôle.
      return `
        SELECT ${colonnesFinales.replace(/\bt\./g, 'ranked.')}, ranked.rang_categorie, COUNT(*) OVER() AS total_count
        FROM (
          SELECT t.*,
                 ROW_NUMBER() OVER (PARTITION BY t.categorie_nom ORDER BY t.agg_prix_min ASC NULLS LAST) AS rang_categorie
          FROM (${base}) t
        ) ranked
        ORDER BY (ranked.sponsorise = true AND (ranked.sponsor_jusqu_au IS NULL OR ranked.sponsor_jusqu_au > NOW())) DESC, ${orderBy}
        LIMIT $5 OFFSET $6`;
    }

    // Pour ≤1 token, buildQCond utilise $1–$6 seulement → ne pas ajouter tokenParams
    const allParams = tokens.length > 1 ? [...baseParams, ...tokenParams] : baseParams;

    // Requête principale : tous les mots doivent apparaître (AND)
    let result = await pool.query(buildSQL(buildQCond('AND')), allParams);

    // Fallback OR : si AND retourne rien et plusieurs tokens, chercher avec n'importe quel mot
    if (result.rows.length === 0 && tokens.length > 1) {
      result = await pool.query(buildSQL(buildQCond('OR')), allParams);
    }

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

// GET /api/produits/admin/sponsorises — tous les produits avec statut sponsoring (admin)
router.get('/admin/sponsorises', adminSecretOnly, async (req, res) => {
  try {
    const { q, actifs_seulement } = req.query;
    const whereExtra = actifs_seulement === '1'
      ? "AND p.sponsorise = true AND (p.sponsor_jusqu_au IS NULL OR p.sponsor_jusqu_au > NOW())"
      : '';
    const { rows } = await pool.query(`
      SELECT p.id, p.nom, p.marque, p.image_url, p.sponsorise, p.sponsor_jusqu_au,
             c.nom AS categorie_nom, COUNT(o.id) AS nb_offres, MIN(o.prix) AS prix_min
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom ILIKE '%'||$1||'%' OR p.marque ILIKE '%'||$1||'%')
        ${whereExtra}
      GROUP BY p.id, c.nom
      ORDER BY (p.sponsorise = true AND (p.sponsor_jusqu_au IS NULL OR p.sponsor_jusqu_au > NOW())) DESC, p.nom ASC
      LIMIT 100
    `, [q || null]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/produits/admin/:id/sponsoring — activer/désactiver/configurer sponsoring (admin)
router.put('/admin/:id/sponsoring', adminSecretOnly, async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'ID invalide' });
    const { sponsorise, sponsor_jusqu_au } = req.body;
    const { rows } = await pool.query(
      `UPDATE produits SET sponsorise=$1, sponsor_jusqu_au=$2::timestamptz
       WHERE id=$3 RETURNING id, nom, marque, sponsorise, sponsor_jusqu_au`,
      [Boolean(sponsorise), sponsor_jusqu_au || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
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
      WHERE o.produit_id = $1 AND o.stock = true AND o.quarantinee = false
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
      r.specs = r.specs || {};
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

// Mots indiquant un accessoire plutôt qu'un appareil principal — un téléphone et sa
// coque ne sont jamais "similaires" même s'ils partagent marque/catégorie/mots-clés.
const ACCESSOIRE_PATTERN = '(chargeur|cable|câble|adaptateur|support|housse|etui|étui|coque|sacoche|protection ecran|film de protection|verre trempe|batterie externe|power ?bank|powerbank)';

// Variantes de gamme : "Pro"/"Max"/"Ultra" etc. changent fondamentalement le prix et
// le positionnement d'un produit — ne jamais rapprocher un modèle de base de sa variante.
const VARIANTE_MOTS = ['pro','max','ultra','plus','mini','lite','se','fe'];

function extraireVariantes(nom) {
  const tokens = nom.toLowerCase().split(/[\s,\-\/]+/);
  return VARIANTE_MOTS.filter(v => tokens.includes(v));
}

// Exclut les produits dont la gamme (Pro/Max/Ultra/…) diffère de celle de la source —
// évite de comparer un "iPhone 13" à un "iPhone 13 Pro Max" comme s'ils étaient le même produit.
function filtrerVariantesIncompatibles(rows, srcVariantes) {
  return rows.filter(r => {
    const rVariantes = extraireVariantes(r.nom);
    if (srcVariantes.length === 0 && rVariantes.length === 0) return true;
    return srcVariantes.length === rVariantes.length
      && srcVariantes.every(v => rVariantes.includes(v));
  });
}

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
    const srcEstAccessoire = new RegExp(ACCESSOIRE_PATTERN, 'i').test(nom);
    const srcVariantes = extraireVariantes(nom);

    // Priorité 1 : même marque + au moins 1 mot-clé commun (si la source en a) +
    // même statut accessoire/appareil principal
    const scoreClauses1 = mots.map((_, i) => `CASE WHEN p.nom ILIKE $${8 + i} THEN 1 ELSE 0 END`);
    const scoreExpr1 = scoreClauses1.length ? `(${scoreClauses1.join('+')})` : '0';
    const requireScore1 = mots.length > 0;

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
        AND (p.nom ~* $7) = ${srcEstAccessoire}
        ${requireScore1 ? `AND ${scoreExpr1} > 0` : ''}
      GROUP BY p.id, c.nom
      HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
      ORDER BY ${scoreExpr1} DESC, MIN(o.prix) ASC NULLS LAST
      LIMIT $${8 + mots.length}`;

    const params1 = [req.params.id, marque || '%', categorie_id,
      marchand || null, prixMax || null, prixMin || null,
      ACCESSOIRE_PATTERN, ...mots.map(m => '%' + m + '%'), Math.ceil(+limit)];

    const { rows: r1raw } = await pool.query(q1, params1);
    const r1 = filtrerVariantesIncompatibles(r1raw, srcVariantes);

    // Priorité 2 : même catégorie + au moins 1 mot-clé commun (si pas assez de résultats)
    let rows = r1;
    if (r1.length < Math.ceil(+limit / 2)) {
      const excludeIds = [req.params.id, ...r1.map(r => r.id)];
      const scoreClauses2 = motsClesRecherche.map((_, i) => `CASE WHEN p.nom ILIKE $${7 + i} THEN 1 ELSE 0 END`);
      const scoreExpr2 = scoreClauses2.length ? `(${scoreClauses2.join('+')})` : '0';
      const requireScore2 = motsClesRecherche.length > 0;

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
          AND (p.nom ~* $6) = ${srcEstAccessoire}
          ${requireScore2 ? `AND ${scoreExpr2} > 0` : ''}
        GROUP BY p.id, c.nom
        HAVING COUNT(o.id) = 0 OR MIN(o.prix) >= 500
        ORDER BY ${scoreExpr2} DESC, MIN(o.prix) ASC NULLS LAST
        LIMIT $${7 + motsClesRecherche.length}`;

      const params2 = [excludeIds, categorie_id,
        marchand || null, prixMax || null, prixMin || null,
        ACCESSOIRE_PATTERN, ...motsClesRecherche.map(m => '%' + m + '%'), +limit - r1.length];

      const { rows: r2raw } = await pool.query(q2, params2);
      const r2 = filtrerVariantesIncompatibles(r2raw, srcVariantes);
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

// GET /api/produits/instantanee — Auto-complétion instantanée visuelle (Typeahead)
router.get('/instantanee', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    if (!q || q.length < 2) {
      return res.json({ produits: [], boutiques: [] });
    }

    const term = `%${q}%`;

    // 1. Produits marchands
    const prodsRes = await pool.query(
      `SELECT p.id, p.nom, p.prix, p.images, p.categorie, p.boutique_id, b.nom as boutique_nom, b.slug as boutique_slug
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       WHERE (p.nom ILIKE $1 OR p.categorie ILIKE $1) AND b.actif = true
       ORDER BY p.created_at DESC LIMIT 5`,
      [term]
    );

    // 2. Boutiques marchandes
    const bqRes = await pool.query(
      `SELECT id, nom, logo_url, ville, slug, categorie
       FROM boutiques
       WHERE (nom ILIKE $1 OR description ILIKE $1 OR ville ILIKE $1) AND actif = true
       LIMIT 3`,
      [term]
    );

    res.json({
      success: true,
      produits: prodsRes.rows,
      boutiques: bqRes.rows,
    });
  } catch (err) {
    console.error('[INSTANTANEE SEARCH ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

