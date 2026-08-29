// backend/routes/admin-migration.js
// Centre d'Onboarding & Migration Marchand / Catalogue 360° (Nopalou)

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { scrapeProductFromUrl } = require('../services/magic-import');
const { enregistrerAdminLog } = require('../lib/adminAuditLogger');

// Helper d'arrondi commercial psychologique (ex: 4 820 -> 5 000 FCFA)
function arrondirPrixCommercial(prix, arrondi = 500) {
  const p = Math.max(0, parseFloat(prix) || 0);
  if (!arrondi || arrondi <= 1) return Math.round(p);
  return Math.ceil(p / arrondi) * arrondi;
}

let migrationTablesEnsured = false;
async function ensureMigrationTables() {
  if (migrationTablesEnsured) return;
  const sqls = [
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS logo_url TEXT`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS plan_actif VARCHAR(50) DEFAULT 'pro'`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS categorie VARCHAR(50)`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS en_stock BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS prix_barre NUMERIC(12,2)`,
  ];
  for (const sql of sqls) {
    try { await pool.query(sql); } catch (e) {}
  }
  migrationTablesEnsured = true;
}

// ── GET /api/admin/migration/stats — Résumé des données pour l'interface de migration
router.get('/stats', adminSecretOnly, async (req, res) => {
  try {
    await ensureMigrationTables();

    // 1. Boutiques
    let boutiques = [];
    try {
      const bRes = await pool.query(`
        SELECT b.*,
               COALESCE((SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id), 0) AS nb_produits
        FROM boutiques b
        ORDER BY b.created_at DESC
        LIMIT 300
      `);
      boutiques = bRes.rows.map(b => ({
        id: b.id,
        nom: b.nom || 'Boutique sans nom',
        slug: b.slug || b.id,
        telephone: b.telephone || '',
        logo: b.logo_url || b.logo || null,
        plan: b.plan_actif || b.plan || 'pro',
        nb_produits: parseInt(b.nb_produits || 0, 10),
      }));
    } catch (e) {
      console.warn('[MIGRATION_STATS_BOUTIQUES_ERR]', e.message);
      const bRes = await pool.query(`SELECT * FROM boutiques LIMIT 300`).catch(() => ({ rows: [] }));
      boutiques = bRes.rows.map(b => ({
        id: b.id,
        nom: b.nom || 'Boutique',
        slug: b.slug || b.id,
        telephone: b.telephone || '',
        logo: b.logo_url || null,
        plan: 'pro',
        nb_produits: 0,
      }));
    }

    // 2. Catégories
    let categories = [];
    try {
      const cRes = await pool.query(`
        SELECT id, nom, slug, icone FROM categories ORDER BY COALESCE(ordre, 0) ASC, nom ASC
      `);
      categories = cRes.rows;
    } catch (e) {
      categories = [];
    }

    // 3. Total migrés
    let totalMigres = 0;
    try {
      const tRes = await pool.query(`
        SELECT COUNT(*)::int AS total FROM boutique_produits WHERE notes ILIKE '%[Migration]%' OR notes ILIKE '%[Import]%'
      `);
      totalMigres = parseInt(tRes.rows[0]?.total || 0, 10);
    } catch (e) {
      totalMigres = 0;
    }

    res.json({
      boutiques,
      categories,
      totalMigres,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/migration/shopify-mirror — Aspiration intégrale d'une boutique Shopify
router.post('/shopify-mirror', adminSecretOnly, async (req, res) => {
  try {
    await ensureMigrationTables();
    const { storeUrl, boutiqueId, margePct = 0, arrondi = 500, categorieId = null } = req.body;

    if (!storeUrl || !boutiqueId) {
      return res.status(400).json({ error: 'L\'URL du site Shopify et la boutique cible sont obligatoires.' });
    }

    // Normaliser l'URL de base
    let base = storeUrl.trim();
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = 'https://' + base;
    }
    base = base.replace(/\/+$/, '');

    // Récupérer le flux standard public JSON de Shopify
    const endpoint = `${base}/products.json?limit=250`;
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Impossible de récupérer le catalogue public (${response.status} ${response.statusText}). Assurez-vous qu'il s'agit d'un site Shopify accessible.`
      });
    }

    const shopifyData = await response.json();
    const rawProducts = shopifyData.products || [];

    if (!rawProducts.length) {
      return res.status(400).json({ error: 'Aucun produit public trouvé sur ce site Shopify.' });
    }

    let ajoutes = 0;
    const produitsIgnores = [];
    const marge = parseFloat(margePct) || 0;
    const margeFacteur = 1 + (marge / 100);

    for (const p of rawProducts) {
      try {
        const nom = (p.title || '').trim();
        if (!nom) continue;

        // Prix de la première variante
        const variant = p.variants?.[0] || {};
        let rawPrice = parseFloat(variant.price) || 0;
        
        let prixVente = rawPrice;
        if (rawPrice > 0 && rawPrice < 500) {
          prixVente = rawPrice * 650;
        }

        // Appliquer la marge et l'arrondi commercial
        prixVente = prixVente * margeFacteur;
        if (arrondi > 0) {
          prixVente = arrondirPrixCommercial(prixVente, arrondi);
        }

        // Photos
        const images = (p.images || []).map(img => img.src).filter(Boolean);

        // Description HTML propre
        const description = (p.body_html || '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();

        // Insertion dans boutique_produits
        await pool.query(`
          INSERT INTO boutique_produits (
            boutique_id, categorie, nom, description, prix, prix_barre, en_stock, images, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [
          boutiqueId,
          categorieId || null,
          nom,
          description || null,
          prixVente,
          variant.compare_at_price ? arrondirPrixCommercial(parseFloat(variant.compare_at_price) * (rawPrice < 500 ? 650 : 1) * margeFacteur, arrondi) : null,
          true,
          images,
          `[Migration Shopify] Source: ${base}/products/${p.handle}`,
        ]);

        ajoutes++;
      } catch (errProd) {
        produitsIgnores.push({ nom: p.title, erreur: errProd.message });
      }
    }

    // Journal d'audit
    enregistrerAdminLog({
      adminNom: req.admin?.nom || 'Admin',
      action: 'MIGRATION_SHOPIFY',
      cibleType: 'boutique',
      cibleId: String(boutiqueId),
      description: `Aspiration Shopify réussie : ${ajoutes} produits importés depuis ${base}`,
      req,
    });

    res.json({
      success: true,
      ajoutes,
      totalDetectes: rawProducts.length,
      ignores: produitsIgnores,
      source: base,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/migration/csv-batch — Import groupé CSV / Excel Universel
router.post('/csv-batch', adminSecretOnly, async (req, res) => {
  try {
    await ensureMigrationTables();
    const { boutiqueId, categorieId, items, margePct = 0, arrondi = 500 } = req.body;

    if (!boutiqueId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Boutique cible et liste d\'articles valides requises.' });
    }

    const marge = parseFloat(margePct) || 0;
    const margeFacteur = 1 + (marge / 100);

    let ajoutes = 0;
    const erreurs = [];

    for (const item of items) {
      try {
        const nom = (item.nom || item.title || item.name || '').trim();
        if (!nom) continue;

        let prixVente = parseFloat(item.prix || item.price || item.prix_vente || 0);
        if (prixVente > 0 && prixVente < 500) {
          prixVente = prixVente * 650;
        }
        prixVente = prixVente * margeFacteur;
        if (arrondi > 0) {
          prixVente = arrondirPrixCommercial(prixVente, arrondi);
        }

        const description = (item.description || item.body || '').trim() || null;
        
        let photos = [];
        if (Array.isArray(item.photos)) {
          photos = item.photos;
        } else if (item.image || item.photo || item.images) {
          const rawImgs = String(item.image || item.photo || item.images);
          photos = rawImgs.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
        }

        await pool.query(`
          INSERT INTO boutique_produits (
            boutique_id, categorie, nom, description, prix, en_stock, images, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          boutiqueId,
          item.categorie || categorieId || null,
          nom,
          description,
          prixVente,
          true,
          photos,
          `[Import CSV] ${new Date().toLocaleDateString('fr-FR')}`,
        ]);

        ajoutes++;
      } catch (e) {
        erreurs.push({ nom: item.nom || 'Sans nom', erreur: e.message });
      }
    }

    enregistrerAdminLog({
      adminNom: req.admin?.nom || 'Admin',
      action: 'MIGRATION_CSV',
      cibleType: 'boutique',
      cibleId: String(boutiqueId),
      description: `Import CSV/Excel : ${ajoutes} produits injectés`,
      req,
    });

    res.json({
      success: true,
      ajoutes,
      totalSoumis: items.length,
      erreurs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/migration/url-magic — Import unitaire ou multiple par Baguette Magique
router.post('/url-magic', adminSecretOnly, async (req, res) => {
  try {
    await ensureMigrationTables();
    const { url, boutiqueId, categorieId, margePct = 0, arrondi = 500 } = req.body;

    if (!url || !boutiqueId) {
      return res.status(400).json({ error: 'L\'URL du produit et la boutique cible sont requises.' });
    }

    const scraped = await scrapeProductFromUrl(url.trim());
    if (!scraped || !scraped.titre) {
      return res.status(400).json({ error: 'Impossible d\'extraire les données depuis ce lien.' });
    }

    const marge = parseFloat(margePct) || 0;
    let prixFinal = (scraped.prix || 0) * (1 + marge / 100);
    if (arrondi > 0) {
      prixFinal = arrondirPrixCommercial(prixFinal, arrondi);
    }

    const imagesList = scraped.images || (scraped.image ? [scraped.image] : []);

    const { rows } = await pool.query(`
      INSERT INTO boutique_produits (
        boutique_id, categorie, nom, description, prix, en_stock, images, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      boutiqueId,
      categorieId || null,
      scraped.titre,
      scraped.description || null,
      prixFinal,
      true,
      imagesList,
      `[Baguette Magique URL] Source: ${url.trim().substring(0, 200)}`,
    ]);

    enregistrerAdminLog({
      adminNom: req.admin?.nom || 'Admin',
      action: 'MIGRATION_URL_MAGIC',
      cibleType: 'boutique',
      cibleId: String(boutiqueId),
      description: `Produit importé par URL : ${scraped.titre} (${prixFinal} FCFA)`,
      req,
    });

    res.json({
      success: true,
      produit: rows[0],
      scraped,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/migration/clients-batch — Import carnet de dettes & clients fidèles
router.post('/clients-batch', adminSecretOnly, async (req, res) => {
  try {
    const { boutiqueId, clients } = req.body;

    if (!boutiqueId || !Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ error: 'Boutique cible et liste de clients requises.' });
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS boutique_clients (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        boutique_id    UUID REFERENCES boutiques(id) ON DELETE CASCADE,
        nom            VARCHAR(150) NOT NULL,
        telephone      VARCHAR(50),
        adresse        TEXT,
        solde_dette    NUMERIC(12,2) DEFAULT 0,
        plafond_credit NUMERIC(12,2) DEFAULT 50000,
        notes          TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_boutique_clients_btq ON boutique_clients(boutique_id);
    `);

    let ajoutes = 0;
    for (const c of clients) {
      const nom = (c.nom || c.name || '').trim();
      if (!nom) continue;

      const tel = (c.telephone || c.phone || '').trim() || null;
      const soldeDette = parseFloat(c.solde_dette || c.dette || c.solde || 0);
      const plafond = parseFloat(c.plafond_credit || c.plafond || 50000);

      await pool.query(`
        INSERT INTO boutique_clients (
          boutique_id, nom, telephone, adresse, solde_dette, plafond_credit, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        boutiqueId,
        nom,
        tel,
        c.adresse?.trim() || null,
        soldeDette,
        plafond,
        c.notes?.trim() || '[Migration Carnet Dettes]',
      ]);

      ajoutes++;
    }

    enregistrerAdminLog({
      adminNom: req.admin?.nom || 'Admin',
      action: 'MIGRATION_CLIENTS_DETTES',
      cibleType: 'boutique',
      cibleId: String(boutiqueId),
      description: `Migration carnet de dettes : ${ajoutes} clients enregistrés`,
      req,
    });

    res.json({ success: true, ajoutes, total: clients.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/migration/welcome-kit — Générateur de kit d'accueil & message WhatsApp
router.post('/welcome-kit', adminSecretOnly, async (req, res) => {
  try {
    const { boutiqueId } = req.body;

    const { rows } = await pool.query(`
      SELECT b.id, b.nom, COALESCE(b.slug, b.id::text) AS slug, b.telephone, COALESCE(b.plan_actif, 'pro') AS plan, b.logo_url AS logo, u.email, u.prenom, u.nom AS user_nom
      FROM boutiques b
      LEFT JOIN utilisateurs u ON u.id = b.utilisateur_id
      WHERE b.id = $1
    `, [boutiqueId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    const b = rows[0];
    const storeUrl = `https://nopalou.com/boutique/${b.slug}`;
    const posUrl = `https://nopalou.com/boutique/${b.slug}/caisse`;
    const prenom = b.prenom || b.user_nom || 'Cher Partenaire';

    const messageWhatsApp = `🎉 Félicitations ${prenom} ! Votre boutique en ligne *${b.nom}* a été créée avec succès sur Nopalou !

🛍️ *Votre Vitrine en Ligne Prête à Vendre :*
👉 ${storeUrl}

⚡ *Votre Caisse Enregistreuse POS (Tactile Magasin) :*
👉 ${posUrl}

✨ *Ce qui est configuré pour vous :*
✅ Vos produits et photos sont déjà en ligne
✅ Encaissements Wave & Orange Money prêts
✅ 30 Jours d'Essai 100% OFFERTS sur le forfait ${b.plan || 'Pro'}

📲 Partagez votre lien de boutique à tous vos clients sur WhatsApp pour commencer à recevoir des commandes !
Une question ? Notre équipe support reste à votre entière disposition. 🤝`;

    res.json({
      success: true,
      boutique: b,
      storeUrl,
      posUrl,
      messageWhatsApp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
