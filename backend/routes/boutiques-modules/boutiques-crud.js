// backend/routes/boutiques-modules/boutiques-crud.js
const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken, tokenOptional, adminSecretOnly, requireEmailVerifie } = require('../../middlewares/auth');
const { checkAbonnement, requireAbonnement, requireBusiness } = require('../../middlewares/checkAbonnement');
const { limiterPublication, limiterImport } = require('../../middlewares/rateLimit');
const { uploadBuffer } = require('../../services/cloudinary');
const { scrapeProductFromUrl } = require('../../services/magic-import');
const { syncProduit, deleteProduit } = require('../../services/whatsapp-catalog');
const cfg = require('../../lib/settingsCache');
const { enregistrerAuditLog } = require('../../lib/auditLogger');
const { normalizeSocialUrl } = require('../../services/social-parser');
const {
  checkBoutiqueAccess,
  checkBoutiqueQuotas,
  upload,
  uploadProduitPhotos,
  CATS,
  MAX_BOUTIQUES,
  QUOTA_PRODUITS,
  slugify,
  uniqueSlug,
} = require('./helpers');
// ── Spec 06 : GET /api/devises/taux — Taux de conversion (route statique prioritaire)
router.get(['/devises/taux', '/taux'], (req, res) => {
  res.json({
    base: 'XOF',
    taux: { XOF: 1, EUR: 0.001524, USD: 0.001667 },
    conversions_inverses: { '1_EUR_EN_XOF': 655.957, '1_USD_EN_XOF': 600.00 }
  });
});

// ── GET /api/boutiques/catalogues-standards — Modèles de produits prédéfinis
router.get('/catalogues-standards', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const rawData = fs.readFileSync(path.join(__dirname, '../data/catalogues-standards.json'));
    const catalogues = JSON.parse(rawData);
    res.json({ success: true, catalogues });
  } catch (err) {
    console.error('Erreur lecture catalogue:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/modeles-couvertures — Bibliothèque de modèles de couvertures HD par catégorie
router.get('/modeles-couvertures', (req, res) => {
  const modeles = {
    mode: [
      { id: 'mode-1', titre: 'Boutique Chic & Élégance', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', style: 'Élégant' },
      { id: 'mode-2', titre: 'Atelier Coutures & Bazin', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', style: 'Traditionnel' },
      { id: 'mode-3', titre: 'Mode Pastel & Tendance', url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80', style: 'Moderne' },
      { id: 'mode-4', titre: 'Maroquinerie & Chaussures', url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1200&q=80', style: 'Luxe' },
    ],
    smartphones: [
      { id: 'tel-1', titre: 'Showroom Mobiles Récent', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80', style: 'Tech' },
      { id: 'tel-2', titre: 'Accessoires & Réparation Pro', url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80', style: 'Atelier' },
      { id: 'tel-3', titre: 'Mobiles Haute Définition', url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=80', style: 'Futuriste' },
    ],
    informatique: [
      { id: 'it-1', titre: 'Setup Tech & Laptops', url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80', style: 'Pro' },
      { id: 'it-2', titre: 'Bureautique & Écrans', url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80', style: 'Business' },
      { id: 'it-3', titre: 'Gaming & Performance', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80', style: 'Gaming' },
    ],
    alimentation: [
      { id: 'alim-1', titre: 'Épicerie Fine & Fruits Frais', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80', style: 'Naturel' },
      { id: 'alim-2', titre: 'Rayons Propres & Épicerie', url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80', style: 'Moderne' },
      { id: 'alim-3', titre: 'Marché Frais & Saveurs', url: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1200&q=80', style: 'Traditionnel' },
    ],
    beaute: [
      { id: 'beaute-1', titre: 'Cosmétiques & Soins', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80', style: 'Douceur' },
      { id: 'beaute-2', titre: 'Parfumerie & Luxe Doré', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80', style: 'Luxe' },
      { id: 'beaute-3', titre: 'Institut & Esthétique', url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1200&q=80', style: 'Élégant' },
    ],
    'auto-moto': [
      { id: 'auto-1', titre: 'Garage & Pièces Détachées', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80', style: 'Mécanique' },
      { id: 'auto-2', titre: 'Véhicules & Showroom Auto', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80', style: 'Prestige' },
      { id: 'auto-3', titre: 'Entretien & Lubrifiants', url: 'https://images.unsplash.com/photo-1635784065399-c020521e6490?auto=format&fit=crop&w=1200&q=80', style: 'Pro' },
    ],
    quincaillerie: [
      { id: 'quin-1', titre: 'Outillage & BTP Professionnel', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', style: 'Pro' },
      { id: 'quin-2', titre: 'Matériaux & Équipements', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80', style: 'Bricolage' },
    ],
    maison: [
      { id: 'maison-1', titre: 'Décoration Intérieure Design', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', style: 'Design' },
      { id: 'maison-2', titre: 'Mobilier & Salon Chaleureux', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80', style: 'Confort' },
    ],
    default: [
      { id: 'def-1', titre: 'Concept Store Moderne', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', style: 'Moderne' },
      { id: 'def-2', titre: 'Galerie Marchande Lumineuse', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80', style: 'Commercial' },
      { id: 'def-3', titre: 'Vitrine Épurée & Chic', url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80', style: 'Élégant' },
    ],
  };
  res.json({ success: true, modeles });
});

// ── GET /api/boutiques/admin/toutes — toutes les boutiques (admin)
router.post('/taf-taf', async (req, res) => {
  try {
    let { nom, email, mot_de_passe, telephone, couleur, couleur_theme, categorie, code_apporteur } = req.body;
    if (!nom || !telephone) return res.status(400).json({ error: 'Nom et téléphone requis' });
    
    // Normaliser téléphone
    telephone = telephone.replace(/[^0-9+]/g, '');
    if (!telephone.startsWith('+221') && telephone.length === 9) {
      telephone = '+221' + telephone;
    }
    
    // 1. Gérer l'utilisateur
    let { rows } = await pool.query('SELECT id, nom, email, code_apporteur FROM utilisateurs WHERE telephone=$1 OR email=$2', [telephone, email || '']);
    let user;
    if (rows.length) {
      user = rows[0];
    } else {
      const userEmail = email || `${telephone}@whatsapp.nopalou.com`;
      const plainPassword = mot_de_passe || require('crypto').randomBytes(16).toString('hex');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(plainPassword, 12);
      const { genererCodeUnique } = require('../../lib/codeApporteur');
      const codeApp = await genererCodeUnique();
      
      const insertRes = await pool.query(
        'INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie, est_apporteur, code_apporteur) VALUES ($1, $2, $3, $4, true, true, $5) RETURNING id, nom, email, code_apporteur',
        [nom, userEmail, hash, telephone, codeApp]
      );
      user = insertRes.rows[0];
    }

    // 1.5 Vérification stricte des quotas Admin
    const quotaCheck = await checkBoutiqueQuotas(user.id, telephone, email || user.email);
    if (!quotaCheck.allowed) {
      return res.status(400).json({ error: quotaCheck.error });
    }

    // Résoudre le code apporteur (optionnel) en apporteur_id
    let apporteurId = null;
    const codeApporteurFinal = (code_apporteur || req.body.apporteur || req.body.ref_code)?.toString().trim().toUpperCase();
    if (codeApporteurFinal) {
      const apporteurRow = await pool.query(
        'SELECT id FROM utilisateurs WHERE code_apporteur=$1 AND est_apporteur=true',
        [codeApporteurFinal]
      );
      if (apporteurRow.rows[0]) apporteurId = apporteurRow.rows[0].id;
    }

    // 2. Créer la boutique
    const insertBoutique = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, telephone, ville, categorie, couleur_theme, apporteur_id, actif)
       VALUES ($1, $2, $3, 'Dakar', $4, $5, $6, true) RETURNING id`,
      [user.id, nom, telephone, categorie || 'Divers', couleur_theme || couleur || '#25D366', apporteurId]
    );
    const boutiqueId = insertBoutique.rows[0].id;

    // Hook automatique de conversion CRM prospection
    if (telephone) {
      const normTel = String(telephone).replace(/\D/g, '').slice(-9);
      if (normTel.length === 9) {
        pool.query(
          `UPDATE prospection_leads SET statut = 'converti', derniere_action_at = NOW(), updated_at = NOW()
           WHERE telephone LIKE '%' || $1`,
          [normTel]
        ).catch(e => console.warn('[CRM CONVERSION HOOK ERR]:', e.message));
      }
    }

    try {
      const slugBase = slugify(nom);
      const slug = await uniqueSlug(slugBase, boutiqueId);
      await pool.query('UPDATE boutiques SET slug=$1 WHERE id=$2', [slug, boutiqueId]);
    } catch (_) {}

    const { plan } = req.body;
    const planChoisi = ['pro', 'business', 'decouverte'].includes(plan) ? plan : 'decouverte';
    const prixDecouverte = await cfg.getNum('plan_decouverte_prix') || 2500;
    const prixPro = await cfg.getNum('plan_pro_prix') || 5000;
    const prixBusiness = await cfg.getNum('plan_business_prix') || 10000;
    const prix = planChoisi === 'business' ? prixBusiness : planChoisi === 'pro' ? prixPro : prixDecouverte;

    // 3. Activer le plan choisi (Taf Taf Découverte 1 mois offert par défaut)
    const essaiJours = await cfg.getNum('abonnement_essai_jours') || 30;
    
    await pool.query(
      `UPDATE abonnements SET statut='annule' WHERE utilisateur_id=$1 AND statut='actif'`,
      [user.id]
    );

    await pool.query(
      `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, is_trial)
       VALUES ($1, $2, 'actif', $3, NOW() + INTERVAL '1 day' * $4, TRUE)`,
      [user.id, planChoisi, prix, essaiJours]
    );

    // 4. Générer le token de session
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, boutiqueId, token });
  } catch (err) {
    console.error('[TAF TAF]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boutiques/magic-import - Scraper un produit depuis URL (Dropshipping / Sourcing)
router.post('/magic-import', limiterImport, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'URL du produit requise' });
    }

    const data = await scrapeProductFromUrl(url);
    res.json(data);
  } catch (err) {
    console.error('[MAGIC IMPORT ERROR]', err.message);
    res.status(400).json({ error: err.message || 'Impossible d\'importer ce produit depuis le lien fourni' });
  }
});

// GET /api/boutiques - Liste publique (recherche, tri, filtres)
router.get('/', async (req, res) => {
  try {
    const { ville, q, cat, categorie, tri, limit = 20, page = 1 } = req.query;
    const catQuery = (categorie || cat || '').trim().toLowerCase();
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
    const lim = Math.min(50, parseInt(limit));
    const conds = ['actif=true'];
    const vals = [];

    if (ville) { vals.push(ville); conds.push(`ville ILIKE $${vals.length}`); }
    if (q) { vals.push(`%${q}%`); conds.push(`(nom ILIKE $${vals.length} OR description ILIKE $${vals.length})`); }
    if (catQuery) {
      if (catQuery === 'mode') {
        vals.push('%mode%', '%beaute%', '%vetement%');
        const i1 = vals.length - 2, i2 = vals.length - 1, i3 = vals.length;
        conds.push(`(categorie ILIKE $${i1} OR categorie ILIKE $${i2} OR categorie ILIKE $${i3})`);
      } else if (catQuery === 'smartphones') {
        vals.push('%smartphone%', '%phone%', '%tech%', '%telephone%');
        const i1 = vals.length - 3, i2 = vals.length - 2, i3 = vals.length - 1, i4 = vals.length;
        conds.push(`(categorie ILIKE $${i1} OR categorie ILIKE $${i2} OR categorie ILIKE $${i3} OR categorie ILIKE $${i4})`);
      } else {
        vals.push(`%${catQuery}%`);
        conds.push(`categorie ILIKE $${vals.length}`);
      }
    }

    const orderBy = tri === 'recent'  ? 'b.created_at DESC'
                  : tri === 'nom_asc' ? 'b.nom ASC'
                  : `CASE a.plan WHEN 'business' THEN 0 WHEN 'pro' THEN 1 ELSE 2 END ASC,
                     (b.sponsorise = true AND (b.sponsor_jusqu_au IS NULL OR b.sponsor_jusqu_au > NOW())) DESC,
                     b.created_at DESC`;

    const where = 'WHERE ' + conds.join(' AND ');
    const [rows, cnt, villesRes, catsRes] = await Promise.all([
      pool.query(
        `SELECT b.id, b.slug, b.nom, b.description, b.categorie, b.telephone, b.whatsapp, b.adresse, b.ville,
                b.logo_url, b.cover_url, b.horaires, b.sponsorise, b.sponsor_jusqu_au, b.created_at,
                a.plan AS plan_actif,
                COALESCE(ROUND(av.note_avg::numeric, 1), 5.0) AS note_moyenne,
                COALESCE(av.total_cnt, 0) AS total_avis
         FROM boutiques b
         LEFT JOIN LATERAL (
           SELECT plan FROM abonnements
           WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
           ORDER BY fin DESC LIMIT 1
         ) a ON true
         LEFT JOIN LATERAL (
           SELECT AVG(note) as note_avg, COUNT(*) as total_cnt FROM boutique_avis WHERE boutique_id = b.id
         ) av ON true
         ${where}
         ORDER BY ${orderBy}
         LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
        [...vals, lim, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM boutiques ${where}`, vals),
      pool.query(`SELECT DISTINCT ville FROM boutiques WHERE actif=true AND ville IS NOT NULL AND ville != '' ORDER BY ville ASC`),
      pool.query(`SELECT DISTINCT categorie FROM boutiques WHERE actif=true AND categorie IS NOT NULL AND categorie != '' ORDER BY categorie ASC`),
    ]);

    const villes = villesRes.rows.map(r => r.ville).filter(Boolean);
    const categories = catsRes.rows.map(r => r.categorie).filter(Boolean);

    res.json({
      boutiques: rows.rows,
      total: parseInt(cnt.rows[0].count),
      page: parseInt(page),
      villes,
      categories,
    });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── GET /api/boutiques/mine — mes boutiques (auth) — DOIT être avant /:id
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.whatsapp, b.adresse, b.ville,
              b.logo_url, b.cover_url, b.site_web, b.facebook, b.instagram, b.tiktok, b.youtube, b.slug, b.couleur_theme,
              b.slogan, COALESCE(b.theme_style, 'moderne') AS theme_style, COALESCE(b.couleur_secondaire, '#F8F5F0') AS couleur_secondaire,
              COALESCE(b.forme_boutons, 'squircle') AS forme_boutons, b.bandeau_promo, COALESCE(b.bandeau_promo_actif, false) AS bandeau_promo_actif,
              b.message_accueil, COALESCE(b.disposition_catalogue, 'grille') AS disposition_catalogue,
              COALESCE(b.actif, true) AS actif, b.sponsorise, b.sponsor_jusqu_au, b.whatsapp_catalog_id, b.created_at,
              COALESCE(b.mode_fonctionnement, 'hybride_pos') AS mode_fonctionnement,
              COALESCE(b.devise_defaut, 'XOF') AS devise_defaut,
              b.meta_pixel_id, b.tiktok_pixel_id, b.ga4_id,
              b.regime_fiscal, b.prix_tva_incluse, b.timbre_fiscal_applicable, b.tva_taux_defaut,
              b.rccm, b.ninea, b.forme_juridique, b.capital_social, b.compte_bancaire, b.conditions_vente, b.pied_de_page_document,
              b.message_bas_ticket,
              COALESCE(b.pos_remise_max_caissier, 10.00) AS pos_remise_max_caissier,
              COALESCE(b.pos_remise_seuil_auto_montant, 0) AS pos_remise_seuil_auto_montant,
              COALESCE(b.pos_remise_seuil_auto_pct, 0) AS pos_remise_seuil_auto_pct,
              COALESCE(b.pos_remise_motifs, '[{"id":"anti_gaspi","nom":"🍌 Date courte / Anti-gaspi","pct":30},{"id":"defaut","nom":"📦 Défaut emballage","pct":15},{"id":"personnel","nom":"👥 Personnel / Employé","pct":10},{"id":"geste","nom":"👑 Geste commercial","pct":5}]'::jsonb) AS pos_remise_motifs,
              COALESCE(b.fidelite_actif, true) AS fidelite_actif,
              COALESCE(b.fidelite_type, 'cagnotte') AS fidelite_type,
              COALESCE(b.fidelite_taux_cashback, 3.00) AS fidelite_taux_cashback,
              COALESCE(b.fidelite_tampons_max, 10) AS fidelite_tampons_max,
              COALESCE(b.fidelite_seuil_tampon, 2000) AS fidelite_seuil_tampon,
              COALESCE(b.caisse_token, b.id::text) AS caisse_token,
              (b.utilisateur_id = $1) AS is_owner,
              (
                SELECT CASE 
                  WHEN a.is_trial = true THEN 'business' 
                  ELSE a.plan 
                END
                FROM abonnements a
                WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
                ORDER BY a.fin DESC LIMIT 1
              ) AS plan_actif,
              (
                SELECT a.plan
                FROM abonnements a
                WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
                ORDER BY a.fin DESC LIMIT 1
              ) AS plan_souscrit,
              (
                SELECT COALESCE(a.is_trial, false)
                FROM abonnements a
                WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
                ORDER BY a.fin DESC LIMIT 1
              ) AS is_trial,
              (
                SELECT GREATEST(0, CEIL(EXTRACT(EPOCH FROM (a.fin - NOW())) / 86400))::int
                FROM abonnements a
                WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
                ORDER BY a.fin DESC LIMIT 1
              ) AS jours_restants_essai
       FROM boutiques b
       LEFT JOIN boutique_utilisateurs bu ON b.id = bu.boutique_id
       WHERE b.utilisateur_id = $1 OR bu.utilisateur_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );
    res.json({ boutiques: rows.rows });
  } catch (err) {
    console.error('[GET_BOUTIQUES_MINE_ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Spec 04/07 : GET /api/boutiques/:id/catalog.xml — Flux XML Meta Commerce Manager & TikTok Catalog
router.get(['/:id/catalog.xml', '/:id/catalog.feed'], async (req, res) => {
  try {
    const { id } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let bqRes = isUUID
      ? await pool.query('SELECT id, nom, slug, site_web FROM boutiques WHERE id = $1', [id])
      : await pool.query('SELECT id, nom, slug, site_web FROM boutiques WHERE slug = $1', [id]);

    if (!bqRes.rows[0]) return res.status(404).send('<error>Boutique introuvable</error>');
    const bq = bqRes.rows[0];

    const prods = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, categorie, en_stock
       FROM boutique_produits WHERE boutique_id = $1 AND en_stock = true ORDER BY created_at DESC`,
      [bq.id]
    );

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const boutiqueUrl = `${baseUrl}/boutiques/${bq.slug || bq.id}`;

    function escapeXml(unsafe) {
      return (unsafe || '').replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    }

    let itemsXml = '';
    for (const p of prods.rows) {
      const pUrl = `${boutiqueUrl}?produit=${p.id}`;
      const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : `${baseUrl}/placeholder.png`;
      const priceFormatted = `${Number(p.prix).toFixed(2)} XOF`;

      itemsXml += `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.nom)}</g:title>
      <g:description>${escapeXml(p.description || p.nom)}</g:description>
      <g:link>${escapeXml(pUrl)}</g:link>
      <g:image_link>${escapeXml(imgUrl)}</g:image_link>
      <g:brand>${escapeXml(bq.nom)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${p.en_stock ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceFormatted}</g:price>
    </item>`;
    }

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(bq.nom)} — Catalogue Nopalou</title>
    <link>${escapeXml(boutiqueUrl)}</link>
    <description>Flux de produits synchronisé pour Meta Commerce Manager &amp; TikTok Catalog</description>${itemsXml}
  </channel>
</rss>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xmlFeed);
  } catch (err) {
    console.error('[CATALOG XML ERR]', err);
    res.status(500).send('<error>Erreur génération flux catalogue</error>');
  }
});

// ── Spec 04/07 : GET /api/boutiques/:id/catalog.json — Flux JSON de catalogue
router.get('/:id/catalog.json', async (req, res) => {
  try {
    const { id } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let bqRes = isUUID
      ? await pool.query('SELECT id, nom, slug FROM boutiques WHERE id = $1', [id])
      : await pool.query('SELECT id, nom, slug FROM boutiques WHERE slug = $1', [id]);

    if (!bqRes.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });
    const bq = bqRes.rows[0];

    const prods = await pool.query(
      `SELECT id, nom, description, prix, prix_barre, images, categorie, en_stock
       FROM boutique_produits WHERE boutique_id = $1 AND en_stock = true ORDER BY created_at DESC`,
      [bq.id]
    );

    res.json({
      boutique_id: bq.id,
      boutique_nom: bq.nom,
      slug: bq.slug,
      total_produits: prods.rows.length,
      produits: prods.rows
    });
  } catch (err) {
    console.error('[CATALOG JSON ERR]', err);
    res.status(500).json({ error: 'Erreur génération catalogue JSON' });
  }
});

// ── GET /api/boutiques/:idOrSlug — fiche publique (UUID ou slug)
router.get('/:id', async (req, res) => {
  try {
    const param = req.params.id;
    // Recherche universelle par UUID ou par slug (toujours accessible via lien direct ou QR Code)
    const r = await pool.query(
      `SELECT b.id, b.nom, b.description, b.categorie, b.telephone, b.adresse, b.ville,
              b.logo_url, b.cover_url, b.whatsapp, b.site_web, b.facebook, b.instagram, b.tiktok, b.youtube,
              b.horaires, b.slug, b.utilisateur_id, b.created_at, b.actif, b.couleur_theme,
              b.slogan, COALESCE(b.theme_style, 'moderne') AS theme_style, COALESCE(b.couleur_secondaire, '#F8F5F0') AS couleur_secondaire,
              COALESCE(b.forme_boutons, 'squircle') AS forme_boutons, b.bandeau_promo, COALESCE(b.bandeau_promo_actif, false) AS bandeau_promo_actif,
              b.message_accueil, COALESCE(b.disposition_catalogue, 'grille') AS disposition_catalogue,
              COALESCE(b.mode_fonctionnement, 'hybride_pos') AS mode_fonctionnement,
              COALESCE(b.devise_defaut, 'XOF') AS devise_defaut,
              b.meta_pixel_id, b.tiktok_pixel_id, b.ga4_id,
              b.regime_fiscal, b.prix_tva_incluse, b.timbre_fiscal_applicable, b.tva_taux_defaut,
              b.rccm, b.ninea, b.forme_juridique, b.capital_social, b.compte_bancaire, b.conditions_vente, b.pied_de_page_document,
              b.message_bas_ticket,
              COALESCE(b.pos_remise_max_caissier, 10.00) AS pos_remise_max_caissier,
              COALESCE(b.pos_remise_seuil_auto_montant, 0) AS pos_remise_seuil_auto_montant,
              COALESCE(b.pos_remise_seuil_auto_pct, 0) AS pos_remise_seuil_auto_pct,
              COALESCE(b.pos_remise_motifs, '[{"id":"anti_gaspi","nom":"🍌 Date courte / Anti-gaspi","pct":30},{"id":"defaut","nom":"📦 Défaut emballage","pct":15},{"id":"personnel","nom":"👥 Personnel / Employé","pct":10},{"id":"geste","nom":"👑 Geste commercial","pct":5}]'::jsonb) AS pos_remise_motifs,
              COALESCE(b.fidelite_actif, true) AS fidelite_actif,
              COALESCE(b.fidelite_type, 'cagnotte') AS fidelite_type,
              COALESCE(b.fidelite_taux_cashback, 3.00) AS fidelite_taux_cashback,
              COALESCE(b.fidelite_tampons_max, 10) AS fidelite_tampons_max,
              COALESCE(b.fidelite_seuil_tampon, 2000) AS fidelite_seuil_tampon,
              COALESCE(b.caisse_token, b.id::text) AS caisse_token,
              a.plan AS plan_actif
       FROM boutiques b
       LEFT JOIN LATERAL (
         SELECT plan FROM abonnements
         WHERE utilisateur_id = b.utilisateur_id AND statut='actif' AND fin > NOW()
         ORDER BY fin DESC LIMIT 1
       ) a ON true
       WHERE (b.id::text = $1 OR LOWER(b.slug) = LOWER($1))`,
      [param]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    pool.query(
      `INSERT INTO analytics_events (type, boutique_id) VALUES ('vue_boutique',$1)`,
      [r.rows[0].id]
    ).catch(() => {});

    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── Gestion des Administrateurs Web ───────────────────────────────────────────
router.get('/:id/avis', async (req, res) => {
  try {
    const param = req.params.id;
    const isUUID = /^[0-9a-f-]{36}$/i.test(param);
    const condition = isUUID ? 'a.boutique_id=$1' : 'b.slug=$1';
    
    const { rows } = await pool.query(
      `SELECT a.id, a.nom_client, a.note, a.commentaire, a.verifie, a.created_at, p.nom as produit_nom
       FROM boutique_avis a
       JOIN boutiques b ON b.id = a.boutique_id
       LEFT JOIN boutique_produits p ON p.id = a.produit_id
       WHERE ${condition}
       ORDER BY a.created_at DESC`,
      [param]
    );

    const stats = await pool.query(
      `SELECT COALESCE(AVG(a.note), 5.0) as note_moyenne, COUNT(a.id) as total_avis
       FROM boutique_avis a
       JOIN boutiques b ON b.id = a.boutique_id
       WHERE ${condition}`,
      [param]
    );

    res.json({
      success: true,
      note_moyenne: parseFloat(stats.rows[0]?.note_moyenne || 5.0).toFixed(1),
      total_avis: parseInt(stats.rows[0]?.total_avis || 0),
      avis: rows,
    });
  } catch (err) {
    console.error('[BOUTIQUE AVIS GET]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/avis — Soumettre un avis client
router.post('/:id/avis', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_client, note, commentaire, produit_id } = req.body;
    if (!nom_client?.trim() || !note || note < 1 || note > 5) {
      return res.status(400).json({ error: 'Nom et note entre 1 et 5 requis' });
    }

    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCond = isUUID ? 'id=$1' : 'slug=$1';
    const b = await pool.query(`SELECT id FROM boutiques WHERE ${bqCond}`, [id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    const r = await pool.query(
      `INSERT INTO boutique_avis (boutique_id, produit_id, nom_client, note, commentaire, verifie)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [b.rows[0].id, produit_id || null, nom_client.trim(), Math.min(5, Math.max(1, Number(note))), commentaire || null]
    );

    res.status(201).json({ success: true, avis: r.rows[0] });
  } catch (err) {
    console.error('[BOUTIQUE AVIS POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/:id/produits/:prodId/recommandations — Recommandations "Souvent achetés ensemble"
router.get('/:id/produits/:prodId/recommandations', async (req, res) => {
  try {
    const { id, prodId } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const bqCondition = isUUID ? 'b.id=$1' : 'b.slug=$1';

    const isProdUUID = /^[0-9a-f-]{36}$/i.test(prodId);
    let cat = '';
    if (isProdUUID) {
      const target = await pool.query('SELECT categorie FROM boutique_produits WHERE id=$1', [prodId]);
      cat = target.rows[0]?.categorie || '';
    }

    const params = isProdUUID ? [id, prodId, cat] : [id, cat];
    const condProd = isProdUUID ? 'AND p.id != $2' : '';
    const catParam = isProdUUID ? '$3' : '$2';

    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.prix, p.prix_barre, p.images, p.categorie
       FROM boutique_produits p
       JOIN boutiques b ON b.id = p.boutique_id
       WHERE ${bqCondition} ${condProd} AND p.en_stock = true
       ORDER BY (p.categorie = ${catParam}) DESC, p.created_at DESC LIMIT 3`,
      params
    );

    res.json({ success: true, recommandations: rows });
  } catch (err) {
    console.error('[CROSS-SELLING ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/boutiques/:id/paniers-abandonnes — Enregistrer un panier non finalisé
router.post('/', limiterPublication, verifierToken, requireEmailVerifie, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), [
  body('nom').trim().notEmpty().withMessage('Nom de boutique requis').isLength({ max: 200 }),
  body('telephone').optional({ checkFalsy: true }).isString(),
  body('ville').optional({ checkFalsy: true }).isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userId = req.user.userId;

    const { nom, description, categorie, telephone, adresse, ville, whatsapp, site_web, facebook, instagram, slug: slugInput } = req.body;

    // Quotas configurables (Admin)
    const userRes = await pool.query('SELECT email, telephone FROM utilisateurs WHERE id=$1', [userId]);
    const currentUser = userRes.rows[0] || {};
    const inputTelRaw = telephone?.trim() || currentUser.telephone?.trim() || '';
    const userEmailRaw = (currentUser.email || '').trim().toLowerCase();

    const quotaCheck = await checkBoutiqueQuotas(userId, inputTelRaw, userEmailRaw);
    if (!quotaCheck.allowed) {
      return res.status(400).json({ error: quotaCheck.error });
    }

    let logo_url = null;
    if (req.files?.logo?.[0]) {
      try { logo_url = await uploadBuffer(req.files.logo[0].buffer, 'boutiques'); } catch {}
    }
    let cover_url = null;
    if (req.files?.cover?.[0]) {
      try { cover_url = await uploadBuffer(req.files.cover[0].buffer, 'boutiques_cover'); } catch {}
    }

    // Générer le slug
    const slugBase = slugInput?.trim() ? slugify(slugInput.trim()) : slugify(nom.trim());
    const slug = await uniqueSlug(slugBase);

    // Résoudre le code apporteur (optionnel) en apporteur_id
    let apporteurId = null;
    const codeApporteur = req.body.code_apporteur?.trim().toUpperCase();
    if (codeApporteur) {
      const apporteurRow = await pool.query(
        'SELECT id FROM utilisateurs WHERE code_apporteur=$1 AND est_apporteur=true',
        [codeApporteur]
      );
      if (apporteurRow.rows[0]) apporteurId = apporteurRow.rows[0].id;
    }

    // INSERT avec colonnes de base (toujours présentes)
    const r = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, description, categorie, telephone, adresse, ville, logo_url, apporteur_id, actif)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, true) RETURNING id`,
      [userId, nom.trim(), description||null, categorie||null, telephone||null,
       adresse||null, ville||'Dakar', logo_url, apporteurId]
    );
    const newId = r.rows[0].id;

    // Hook automatique de conversion CRM prospection
    if (telephone) {
      const normTel = String(telephone).replace(/\D/g, '').slice(-9);
      if (normTel.length === 9) {
        pool.query(
          `UPDATE prospection_leads SET statut = 'converti', derniere_action_at = NOW(), updated_at = NOW()
           WHERE telephone LIKE '%' || $1`,
          [normTel]
        ).catch(e => console.warn('[CRM CONVERSION HOOK ERR]:', e.message));
      }
    }

    // UPDATE des colonnes avancées (ajoutées par migration — best-effort)
    try {
      const mode = ['hybride_pos', 'pure_player'].includes(req.body.mode_fonctionnement) ? req.body.mode_fonctionnement : 'hybride_pos';
      await pool.query(
        `UPDATE boutiques SET cover_url=$1, whatsapp=$2, site_web=$3, facebook=$4, instagram=$5, slug=$6, mode_fonctionnement=$7
         WHERE id=$8`,
        [cover_url||null, whatsapp||null, site_web||null, facebook||null, instagram||null, slug, mode, newId]
      );
    } catch (_) { /* colonnes pas encore migrées — ignoré */ }

    // Activer le plan découverte (1 mois gratuit avec accès total VIP) par défaut
    try {
      const essaiJours = await cfg.getNum('abonnement_essai_jours') || 30;
      await pool.query(
        `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, is_trial)
         VALUES ($1, 'decouverte', 'actif', 2500, NOW() + INTERVAL '1 day' * $2, TRUE)`,
        [userId, essaiJours]
      );
    } catch (errAbo) {
      console.error('[BOUTIQUES POST] Erreur création abonnement:', errAbo.message);
    }

    res.status(201).json({ success: true, id: newId, boutique: { id: newId, slug } });
  } catch (err) {
    console.error('[BOUTIQUES POST]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id — modifier la sienne
function multerBoutiqueFields(req, res, next) {
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.error('[BOUTIQUES PUT MULTER]', err.code, err.message);
      return res.status(400).json({ error: err.message || 'Erreur upload' });
    }
    next();
  });
}

router.put('/:id', verifierToken, param('id').isUUID(), multerBoutiqueFields, async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  console.log('[BOUTIQUES PUT] body keys:', Object.keys(req.body || {}), '| files:', Object.keys(req.files || {}));
  try {
    const boutique = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable ou accès refusé' });
    const existingRows = [boutique];
    const existing = { rows: existingRows };

    const {
      nom, description, categorie, telephone, adresse, ville, whatsapp, site_web,
      facebook, instagram, tiktok, youtube, horaires, couleur_theme, slug: slugInput,
      slogan, theme_style, couleur_secondaire, forme_boutons, bandeau_promo,
      bandeau_promo_actif, message_accueil, disposition_catalogue, cover_url: coverUrlBody,
      theme_id
    } = req.body;

    let logo_url = existing.rows[0].logo_url;
    if (req.files?.logo?.[0]) {
      try { logo_url = await uploadBuffer(req.files.logo[0].buffer, 'boutiques'); } catch {}
    }
    let cover_url = coverUrlBody !== undefined ? coverUrlBody : existing.rows[0].cover_url;
    if (req.files?.cover?.[0]) {
      try { cover_url = await uploadBuffer(req.files.cover[0].buffer, 'boutiques_cover'); } catch {}
    }

    let horairesJson = existing.rows[0].horaires;
    if (horaires) {
      try { horairesJson = typeof horaires === 'string' ? JSON.parse(horaires) : horaires; } catch {}
    }

    let dispositionSectionsJson = null;
    if (req.body.disposition_sections) {
      try {
        dispositionSectionsJson = typeof req.body.disposition_sections === 'string'
          ? JSON.parse(req.body.disposition_sections)
          : req.body.disposition_sections;
      } catch {}
    }

    // UPDATE colonnes de base & personnalisation
    await pool.query(
      `UPDATE boutiques SET nom=$1, description=$2, categorie=$3, telephone=$4, adresse=$5,
       ville=$6, logo_url=$7, couleur_theme=COALESCE($8, couleur_theme),
       slogan=COALESCE($9, slogan),
       theme_style=COALESCE($10, theme_style),
       couleur_secondaire=COALESCE($11, couleur_secondaire),
       forme_boutons=COALESCE($12, forme_boutons),
       bandeau_promo=$13,
       bandeau_promo_actif=CASE WHEN $14::boolean IS NOT NULL THEN $14::boolean ELSE bandeau_promo_actif END,
       message_accueil=$15,
       disposition_catalogue=COALESCE($16, disposition_catalogue),
       disposition_sections=COALESCE($17, disposition_sections),
       theme_id=COALESCE($18, theme_id),
       updated_at=NOW()
       WHERE id=$19 AND utilisateur_id=$20`,
      [
        nom || existing.rows[0].nom, description !== undefined ? description : existing.rows[0].description,
        categorie || existing.rows[0].categorie, telephone || null, adresse || null, ville || 'Dakar',
        logo_url, couleur_theme || null,
        slogan !== undefined ? slogan : null, theme_style || null,
        couleur_secondaire || null, forme_boutons || null,
        bandeau_promo !== undefined ? bandeau_promo : null,
        bandeau_promo_actif !== undefined ? (bandeau_promo_actif === 'true' || bandeau_promo_actif === true || bandeau_promo_actif === '1') : null,
        message_accueil !== undefined ? message_accueil : null, disposition_catalogue || null,
        dispositionSectionsJson ? JSON.stringify(dispositionSectionsJson) : null,
        theme_id || null,
        req.params.id, req.user.userId
      ]
    );
    // Slug : garder l'existant si aucun input, sinon re-générer
    let newSlug = existing.rows[0].slug;
    if (slugInput?.trim()) {
      const slugBase = slugify(slugInput.trim());
      newSlug = await uniqueSlug(slugBase, req.params.id);
    }

    // Normalisation des URLs sociales : nettoyage des doubles préfixes, params tracking, format canonique
    const fbUrl  = normalizeSocialUrl(facebook,  'facebook');
    const igUrl  = normalizeSocialUrl(instagram, 'instagram');
    const ttUrl  = normalizeSocialUrl(tiktok,    'tiktok');
    const ytUrl  = normalizeSocialUrl(youtube,   'youtube');

    // UPDATE colonnes avancées & fiscales & remises POS
    try {
      const { regime_fiscal, prix_tva_incluse, timbre_fiscal_applicable, tva_taux_defaut,
              rccm, ninea, forme_juridique, capital_social, compte_bancaire, conditions_vente, pied_de_page_document,
              message_bas_ticket, pos_remise_max_caissier, pos_remise_seuil_auto_montant, pos_remise_seuil_auto_pct, pos_remise_motifs,
              fidelite_actif, fidelite_type, fidelite_taux_cashback, fidelite_tampons_max, fidelite_seuil_tampon,
              mode_fonctionnement, meta_pixel_id, tiktok_pixel_id, ga4_id, actif } = req.body;

      const parseBoolVal = (v) => {
        if (v === undefined || v === null || v === '') return null;
        return v === 'true' || v === true || v === 'on' || v === '1' || v === 1;
      };

      let rawMode = mode_fonctionnement;
      if (Array.isArray(rawMode)) rawMode = rawMode[0];
      const validMode = ['hybride_pos', 'pure_player'].includes(rawMode) ? rawMode : null;
      console.log('[BOUTIQUES PUT MODE]', req.params.id, 'rawMode:', rawMode, 'validMode:', validMode);

      await pool.query(
        `UPDATE boutiques SET cover_url=$1, whatsapp=$2, site_web=$3, facebook=$4,
         instagram=$5, tiktok=$6, youtube=$7, horaires=$8, slug=$9,
         regime_fiscal=COALESCE($10, regime_fiscal),
         prix_tva_incluse=CASE WHEN $11::boolean IS NOT NULL THEN $11::boolean ELSE prix_tva_incluse END,
         timbre_fiscal_applicable=CASE WHEN $12::boolean IS NOT NULL THEN $12::boolean ELSE timbre_fiscal_applicable END,
         tva_taux_defaut=COALESCE($13, tva_taux_defaut),
         rccm=COALESCE($14, rccm),
         ninea=COALESCE($15, ninea),
         forme_juridique=COALESCE($16, forme_juridique),
         capital_social=COALESCE($17, capital_social),
         compte_bancaire=COALESCE($18, compte_bancaire),
         conditions_vente=COALESCE($19, conditions_vente),
         pied_de_page_document=COALESCE($20, pied_de_page_document),
         mode_fonctionnement=CASE WHEN $21::text IS NOT NULL THEN $21::text ELSE mode_fonctionnement END,
         meta_pixel_id=COALESCE($22, meta_pixel_id),
         tiktok_pixel_id=COALESCE($23, tiktok_pixel_id),
         ga4_id=COALESCE($24, ga4_id),
         actif=CASE WHEN $25::boolean IS NOT NULL THEN $25::boolean ELSE actif END,
         message_bas_ticket=COALESCE($26, message_bas_ticket),
         pos_remise_max_caissier=COALESCE($27, pos_remise_max_caissier),
         pos_remise_seuil_auto_montant=COALESCE($28, pos_remise_seuil_auto_montant),
         pos_remise_seuil_auto_pct=COALESCE($29, pos_remise_seuil_auto_pct),
         pos_remise_motifs=COALESCE($30, pos_remise_motifs),
         fidelite_actif=CASE WHEN $31::boolean IS NOT NULL THEN $31::boolean ELSE fidelite_actif END,
         fidelite_type=COALESCE($32, fidelite_type),
         fidelite_taux_cashback=COALESCE($33, fidelite_taux_cashback),
         fidelite_tampons_max=COALESCE($34, fidelite_tampons_max),
         fidelite_seuil_tampon=COALESCE($35, fidelite_seuil_tampon)
         WHERE id=$36`,
        [
          cover_url||null, whatsapp||null, site_web||null, fbUrl,
          igUrl, ttUrl, ytUrl, horairesJson, newSlug,
          regime_fiscal || null,
          parseBoolVal(prix_tva_incluse),
          parseBoolVal(timbre_fiscal_applicable),
          tva_taux_defaut !== undefined && tva_taux_defaut !== '' ? Number(tva_taux_defaut) : null,
          rccm || null, ninea || null, forme_juridique || null, capital_social || null,
          compte_bancaire || null, conditions_vente || null, pied_de_page_document || null,
          validMode,
          meta_pixel_id?.trim() || null,
          tiktok_pixel_id?.trim() || null,
          ga4_id?.trim() || null,
          parseBoolVal(actif),
          message_bas_ticket || null,
          pos_remise_max_caissier !== undefined && pos_remise_max_caissier !== '' ? Number(pos_remise_max_caissier) : null,
          pos_remise_seuil_auto_montant !== undefined && pos_remise_seuil_auto_montant !== '' ? Number(pos_remise_seuil_auto_montant) : null,
          pos_remise_seuil_auto_pct !== undefined && pos_remise_seuil_auto_pct !== '' ? Number(pos_remise_seuil_auto_pct) : null,
          pos_remise_motifs ? (typeof pos_remise_motifs === 'string' ? pos_remise_motifs : JSON.stringify(pos_remise_motifs)) : null,
          parseBoolVal(fidelite_actif),
          fidelite_type || null,
          fidelite_taux_cashback !== undefined && fidelite_taux_cashback !== '' ? Number(fidelite_taux_cashback) : null,
          fidelite_tampons_max !== undefined && fidelite_tampons_max !== '' ? Number(fidelite_tampons_max) : null,
          fidelite_seuil_tampon !== undefined && fidelite_seuil_tampon !== '' ? Number(fidelite_seuil_tampon) : null,
          req.params.id
        ]
      );
    } catch (e) {
      console.error('[BOUTIQUES PUT ADVANCED ERR]', e.message);
    }
    res.json({ success: true, slug: newSlug });
  } catch (err) {
    console.error('[BOUTIQUES PUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/boutiques/:id/statut — Activer ou désactiver la visibilité d'une boutique par le commerçant
router.put('/:id/statut', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const boutique = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable ou accès refusé' });
    
    const { actif } = req.body;
    const isActif = actif === true || actif === 'true' || actif === 1 || actif === '1';
    
    await pool.query('UPDATE boutiques SET actif = $1, updated_at = NOW() WHERE id = $2', [isActif, req.params.id]);
    res.json({ success: true, actif: isActif });
  } catch (err) {
    console.error('[BOUTIQUE_STATUT_ERR]', err);
    res.status(500).json({ error: 'Erreur lors du changement de visibilité de la boutique' });
  }
});

// ── PUT /api/boutiques/:id/mode — Modifier le mode d'exploitation (hybride_pos vs pure_player)
router.put('/:id/mode', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  const { mode_fonctionnement } = req.body;
  if (!mode_fonctionnement || !['hybride_pos', 'pure_player'].includes(mode_fonctionnement)) {
    return res.status(400).json({ error: "Mode d'exploitation invalide. Doit être 'hybride_pos' ou 'pure_player'." });
  }
  try {
    const boutique = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!boutique) return res.status(404).json({ error: 'Boutique introuvable ou accès refusé' });

    await pool.query(
      `UPDATE boutiques SET mode_fonctionnement=$1, updated_at=NOW() WHERE id=$2`,
      [mode_fonctionnement, req.params.id]
    );

    res.json({
      succes: true,
      message: "Mode d'exploitation mis à jour avec succès.",
      mode_fonctionnement
    });
  } catch (err) {
    console.error('[BOUTIQUES MODE PUT ERR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/boutiques/:id — supprimer la sienne
router.delete('/:id', verifierToken, param('id').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const r = await pool.query(
      'DELETE FROM boutiques WHERE id=$1 AND utilisateur_id=$2 RETURNING id',
      [req.params.id, req.user.userId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Boutique introuvable ou non autorisée' });
    res.json({ success: true, message: 'Boutique supprimée' });
  } catch (err) {
    console.error('[BOUTIQUE DELETE]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/boutiques/catalogues-standards — Modèles de produits prédéfinis


// ── POST /api/boutiques/:id/produits/batch — Créer plusieurs produits en 1 seul appel (Quick Intake)
router.get('/devises/taux', (req, res) => {
  res.json({
    base: 'XOF',
    taux: { XOF: 1, EUR: 0.001524, USD: 0.001667 },
    conversions_inverses: { '1_EUR_EN_XOF': 655.957, '1_USD_EN_XOF': 600.00 }
  });
});
router.get('/taux', (req, res) => {
  res.json({
    base: 'XOF',
    taux: { XOF: 1, EUR: 0.001524, USD: 0.001667 },
    conversions_inverses: { '1_EUR_EN_XOF': 655.957, '1_USD_EN_XOF': 600.00 }
  });
});

// ── Spec 06 : PUT /api/boutiques/:id/devise — Devise par défaut de la boutique (Marchand)
router.put('/:id/devise', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { devise_defaut } = req.body;
    if (!devise_defaut || !['XOF', 'EUR', 'USD'].includes(devise_defaut.toUpperCase())) {
      return res.status(400).json({ error: 'Devise invalide. Choix: XOF, EUR, USD.' });
    }

    const cleanDevise = devise_defaut.toUpperCase();

    await pool.query(
      `UPDATE boutiques SET devise_defaut = $1, updated_at = NOW() WHERE id = $2`,
      [cleanDevise, bq.id]
    );

    res.json({
      success: true,
      devise_defaut: cleanDevise,
      message: `Devise par défaut de la boutique mise à jour vers ${cleanDevise}.`
    });
  } catch (err) {
    console.error('[PUT DEVISE ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la devise' });
  }
});

// ── Spec 06 : POST /api/paiements/stripe/simuler — Simulation Carte Bancaire Stripe
router.post(['/paiements/stripe/simuler', '/stripe/simuler', '/:id/paiements/stripe/simuler'], async (req, res) => {
  try {
    const boutique_id = req.params.id || req.body.boutique_id;
    const { montant, devise, card_number, exp_month, exp_year, cvc } = req.body;

    if (!montant || isNaN(Number(montant)) || Number(montant) <= 0) {
      return res.status(400).json({ success: false, error: 'Montant invalide.' });
    }
    if (!card_number || !card_number.replace(/\s+/g, '').match(/^\d{13,19}$/)) {
      return res.status(400).json({ success: false, error: 'Numéro de carte bancaire invalide.' });
    }

    const cleanCard = card_number.replace(/\s+/g, '');

    // Simuler le rejet Stripe pour cartes de test d'échec (ex: 4000000000000002)
    if (cleanCard.endsWith('0002') || cleanCard.endsWith('9999')) {
      return res.status(400).json({
        success: false,
        error: 'Votre carte a été déclinée par l\'émetteur (Carte de test d\'échec Stripe).'
      });
    }

    const crypto = require('crypto');
    const txnId = `txn_stripe_sim_${crypto.randomBytes(12).toString('hex')}`;
    const cleanDevise = (devise || 'XOF').toUpperCase();

    let montantXof = Number(montant);
    if (cleanDevise === 'EUR') montantXof = Math.round(Number(montant) * 655.957);
    else if (cleanDevise === 'USD') montantXof = Math.round(Number(montant) * 600.00);

    res.json({
      success: true,
      transaction_id: txnId,
      statut: 'succeeded',
      montant_paye: Number(montant),
      devise: cleanDevise,
      montant_xof: montantXof,
      mode: 'stripe_simulation',
      message: 'Paiement par carte bancaire approuvé avec succès (Mode Simulation Stripe).'
    });
  } catch (err) {
    console.error('[STRIPE SIMULATION ERR]', err);
    res.status(500).json({ success: false, error: 'Erreur lors du traitement de la carte bancaire' });
  }
});

// ── Spec Acheteur 02 : GET /api/boutiques/:id/produits/:prodId/avis — Avis publics & moyenne
router.post('/scan-ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 requise' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    let rawText = '';
    try {
      const worker = await getOcrWorker();
      if (worker) {
        const result = await worker.recognize(imageBuffer);
        rawText = result?.data?.text || '';
      } else {
        const Tesseract = require('tesseract.js');
        const result = await Tesseract.recognize(imageBuffer, 'fra+eng');
        rawText = result?.data?.text || '';
      }
    } catch (e) {
      console.warn('[OCR] Erreur reconnaissance:', e.message);
      const Tesseract = require('tesseract.js');
      const result = await Tesseract.recognize(imageBuffer, 'fra+eng');
      rawText = result?.data?.text || '';
    }

    // Liste de motifs parasites à ignorer (mentions légales, nutrition, dates, poids, sites web...)
    const noisePatterns = [
      /\b(exp|bb|dluo|dlc|lot|batch|fab|mfg|best before|use by)\b/i,
      /\b(fabriqu[eé]|made in|conserver|ingr[eé]dients?|nutrition|calories|service client|service conso)\b/i,
      /\b(distribu[eé]|import[eé]|poids net|net wt|net weight|alc\.|vol\.|tel\b|phone\b|www\.|http|email)\b/i,
      /\b(copyright|all rights reserved|barcode|code-barres|recyclable|keep refrigerated)\b/i,
      /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/,
      /^\d+(\.\d+)?\s*(g|kg|ml|cl|l|oz|lb|pcs|pc|tab|gel|sachet)$/i,
      /^\d{6,}$/
    ];

    // Nettoyage individuel des lignes
    const cleanedLines = rawText
      .split('\n')
      .map(l => {
        return l
          .replace(/[_\*~|•©®™«»\<\>\[\]\{\}\\\/]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      })
      .filter(l => {
        if (l.length < 2) return false;
        if (/^[0-9\W]+$/.test(l)) return false;
        if (noisePatterns.some(p => p.test(l))) return false;
        return true;
      });

    if (cleanedLines.length === 0) {
      const fallback = rawText
        .split('\n')
        .map(l => l.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, '').trim())
        .filter(l => l.length >= 3);
      if (fallback.length === 0) {
        return res.json({ ok: false, error: 'Aucun nom ou texte lisible détecté sur l’emballage.' });
      }
      return res.json({
        ok: true,
        nom: fallback[0],
        detections: fallback.slice(0, 5)
      });
    }

    // Calcul de score de pertinence pour chaque ligne (pour favoriser le vrai nom du produit)
    const scoredLines = cleanedLines.map((line, index) => {
      let score = 0;
      const len = line.length;

      // Longueur idéale pour un nom de produit (entre 4 et 35 caractères)
      if (len >= 4 && len <= 35) score += 20;
      else if (len > 35 && len <= 60) score += 10;

      // Présence de majuscules (Marques, Noms de produits)
      if (/^[A-Z0-9À-Ÿ\s'-]+$/.test(line) && len >= 3) score += 25;
      else if (/[A-Z]/.test(line)) score += 15;

      // Ratio alphabétique vs chiffres/symboles
      const alphaCount = (line.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
      if (alphaCount / len > 0.8) score += 15;

      // Position dans l'image (les premières lignes du haut/centre sont souvent le titre)
      score += Math.max(0, 10 - index * 2);

      return { line, score };
    });

    scoredLines.sort((a, b) => b.score - a.score);

    const uniqueDetections = [];
    for (const item of scoredLines) {
      if (!uniqueDetections.some(d => d.toLowerCase() === item.line.toLowerCase())) {
        uniqueDetections.push(item.line);
      }
    }

    const meilleurNom = uniqueDetections[0] || cleanedLines[0];

    return res.json({
      ok: true,
      nom: meilleurNom,
      detections: uniqueDetections.slice(0, 6)
    });
  } catch (err) {
    console.error('[OCR SCAN NOM ERR]', err);
    return res.status(500).json({ error: 'Erreur lors de la lecture OCR du produit' });
  }
});

// ── GET /api/boutiques/:id/pos-regles-remises — Lecture des règles de remises POS (Auchan Standard)
router.get('/:id/export-complet', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const { id } = req.params;
    const b = await pool.query('SELECT * FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!b.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const boutique = b.rows[0];

    // Données consolidées
    const [rProduits, rClients, rVentes, rCommandes] = await Promise.all([
      pool.query('SELECT * FROM boutique_produits WHERE boutique_id=$1 ORDER BY created_at ASC', [id]),
      pool.query('SELECT * FROM caisse_clients_credits WHERE boutique_id=$1 ORDER BY created_at ASC', [id]),
      pool.query('SELECT * FROM boutique_ventes WHERE boutique_id=$1 ORDER BY created_at ASC', [id]),
      pool.query('SELECT * FROM boutique_commandes WHERE boutique_id=$1 ORDER BY created_at ASC', [id]),
    ]);

    const exportPayload = {
      export_meta: {
        plateforme: 'Nopalou',
        version: '2.0',
        date_export: new Date().toISOString(),
      },
      boutique: {
        id: boutique.id,
        nom: boutique.nom,
        slug: boutique.slug,
        description: boutique.description,
        categorie: boutique.categorie,
        telephone: boutique.telephone,
        whatsapp: boutique.whatsapp,
        ville: boutique.ville,
        adresse: boutique.adresse,
        mode_fonctionnement: boutique.mode_fonctionnement,
        actif: boutique.actif,
      },
      statistiques: {
        total_produits: rProduits.rows.length,
        total_clients_carnet: rClients.rows.length,
        total_ventes: rVentes.rows.length,
        total_commandes: rCommandes.rows.length,
      },
      produits: rProduits.rows,
      clients_carnet: rClients.rows,
      ventes: rVentes.rows,
      commandes: rCommandes.rows,
    };

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `nopalou_export_${boutique.slug || id}_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportPayload);
  } catch (err) {
    console.error('[BOUTIQUE EXPORT COMPLET ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l’exportation complète de la boutique' });
  }
});

// ── SOUS-MODULE DÉDIÉ : Multi-entrepôts & gestion des stocks déportés
module.exports = router;
