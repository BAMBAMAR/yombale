// backend/routes/admin-search.js
// Moteur de recherche globale (Omnisearch) pour la console d'administration

const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');

router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({
        query: q,
        totalResults: 0,
        results: {
          utilisateurs: [],
          boutiques: [],
          commandes: [],
          annonces: [],
          produits: [],
        },
      });
    }

    const term = `%${q}%`;

    const [usersRes, boutiquesRes, commandesRes, annoncesRes, produitsRes] = await Promise.all([
      // 1. Utilisateurs
      pool.query(`
        SELECT id, nom, email, telephone, ville, email_verifie, suspendu, est_apporteur, created_at
        FROM utilisateurs
        WHERE nom ILIKE $1 OR email ILIKE $1 OR telephone ILIKE $1
        ORDER BY created_at DESC
        LIMIT 6
      `, [term]),

      // 2. Boutiques
      pool.query(`
        SELECT id, nom, slug, telephone, ville, actif, sponsorise, created_at
        FROM boutiques
        WHERE nom ILIKE $1 OR slug ILIKE $1 OR telephone ILIKE $1 OR adresse ILIKE $1
        ORDER BY created_at DESC
        LIMIT 6
      `, [term]),

      // 3. Commandes boutique
      pool.query(`
        SELECT id, reference, nom_produit, montant_total, client_nom, client_telephone, statut, created_at
        FROM commandes_boutique
        WHERE reference ILIKE $1 OR nom_produit ILIKE $1 OR client_nom ILIKE $1 OR client_telephone ILIKE $1
        ORDER BY created_at DESC
        LIMIT 6
      `, [term]),

      // 4. Annonces classifiées & Immo
      pool.query(`
        SELECT id, titre, prix, ville, contact_nom, contact_tel, categorie_slug, actif, 'classifiee' AS type_annonce, created_at
        FROM annonces_classifiees
        WHERE titre ILIKE $1 OR contact_nom ILIKE $1 OR contact_tel ILIKE $1
        UNION ALL
        SELECT id, titre, prix, ville, contact_nom, contact_tel, type_bien AS categorie_slug, actif, 'immo' AS type_annonce, created_at
        FROM annonces_immo
        WHERE titre ILIKE $1 OR contact_nom ILIKE $1 OR contact_tel ILIKE $1
        ORDER BY created_at DESC
        LIMIT 6
      `, [term]),

      // 5. Produits comparateur
      pool.query(`
        SELECT id, nom, marque, prix_min, image_url
        FROM produits
        WHERE nom ILIKE $1 OR marque ILIKE $1
        LIMIT 6
      `, [term]),
    ]);

    const totalResults =
      usersRes.rows.length +
      boutiquesRes.rows.length +
      commandesRes.rows.length +
      annoncesRes.rows.length +
      produitsRes.rows.length;

    res.json({
      query: q,
      totalResults,
      results: {
        utilisateurs: usersRes.rows,
        boutiques: boutiquesRes.rows,
        commandes: commandesRes.rows,
        annonces: annoncesRes.rows,
        produits: produitsRes.rows,
      },
    });
  } catch (err) {
    console.error('[ADMIN_OMNISEARCH_ERR]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
