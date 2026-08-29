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

// ── GET /api/admin/migration/stats — Résumé des données pour l'interface de migration
router.get('/stats', adminSecretOnly, async (req, res) => {
  try {
    const [boutiquesRes, categoriesRes, totalImportsRes] = await Promise.all([
      pool.query(`
        SELECT b.id, b.nom, b.slug, b.telephone, b.logo, b.plan,
               (SELECT COUNT(*)::int FROM boutique_produits WHERE boutique_id = b.id) AS nb_produits
        FROM boutiques b
        ORDER BY b.created_at DESC
        LIMIT 200
      `),
      pool.query(`
        SELECT id, nom, slug, icone FROM categories ORDER BY COALESCE(ordre, 0) ASC, nom ASC
      `),
      pool.query(`
        SELECT COUNT(*)::int AS total FROM boutique_produits WHERE notes ILIKE '%[Migration]%' OR notes ILIKE '%[Import]%'
      `).catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    res.json({
      boutiques: boutiquesRes.rows,
      categories: categoriesRes.rows,
      totalMigres: totalImportsRes.rows[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/migration/shopify-mirror — Aspiration intégrale d'une boutique Shopify
router.post('/shopify-mirror', adminSecretOnly, async (req, res) => {
  try {
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
        
        // Si le prix est en USD/EUR (< 1000), convertir par défaut (taux moyen ~650)
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
            boutique_id, categorie_id, nom, description, prix, prix_promo, stock, photos, notes, actif, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW(), NOW())
        `, [
          boutiqueId,
          categorieId || null,
          nom,
          description || null,
          prixVente,
          variant.compare_at_price ? arrondirPrixCommercial(parseFloat(variant.compare_at_price) * (rawPrice < 500 ? 650 : 1) * margeFacteur, arrondi) : null,
          parseInt(variant.inventory_quantity) || 10,
          JSON.stringify(images),
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

        const stock = parseInt(item.stock || item.quantite || item.qty || 10, 10);
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
            boutique_id, categorie_id, nom, description, prix, stock, photos, notes, actif, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW(), NOW())
        `, [
          boutiqueId,
          item.categorie_id || categorieId || null,
          nom,
          description,
          prixVente,
          stock,
          JSON.stringify(photos),
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

    const { rows } = await pool.query(`
      INSERT INTO boutique_produits (
        boutique_id, categorie_id, nom, description, prix, photos, notes, actif, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(), NOW())
      RETURNING *
    `, [
      boutiqueId,
      categorieId || null,
      scraped.titre,
      scraped.description || null,
      prixFinal,
      JSON.stringify(scraped.images || (scraped.image ? [scraped.image] : [])),
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
      SELECT b.id, b.nom, b.slug, b.telephone, b.plan, b.logo, u.email, u.prenom, u.nom AS user_nom
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
