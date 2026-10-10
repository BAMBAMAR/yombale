const { Client } = require('pg');

const dbName = process.env.AUDIT_DATA_DB || 'nopalou_audit_data';
const url = process.env.DATABASE_URL.replace(/\/[^/]+$/, '/' + dbName);

(async () => {
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("SET default_transaction_read_only = on");

  console.log("=== EXTRACTION COMPLETE DES MESURES NOPALOU ===");

  // 1. Offres et visibilité
  const qOffres = await client.query(`
    SELECT
      count(*) as total_offres,
      count(*) FILTER (WHERE stock = true) as en_stock,
      count(*) FILTER (WHERE stock = false) as hors_stock,
      count(*) FILTER (WHERE quarantinee = true) as quarantinees,
      count(*) FILTER (WHERE stock = true AND (quarantinee = false OR quarantinee IS NULL)) as reellement_visibles,
      count(*) FILTER (WHERE url_achat IS NULL OR url_achat = '') as sans_url,
      count(*) FILTER (WHERE prix IS NULL OR prix <= 0) as prix_invalide,
      count(*) FILTER (WHERE prix < 500) as prix_inf_500,
      count(*) FILTER (WHERE prix > 20000000) as prix_sup_20M
    FROM offres
  `);
  console.log("1. Offres globales:", qOffres.rows[0]);

  // 2. Produits et comparaison
  const qProd = await client.query(`
    SELECT
      count(*) as total_produits,
      count(o.id) as total_liens_offres,
      count(DISTINCT p.id) FILTER (WHERE o.id IS NOT NULL) as produits_avec_offres,
      count(DISTINCT p.id) FILTER (WHERE o.id IS NULL) as produits_orphelins
    FROM produits p
    LEFT JOIN offres o ON o.produit_id = p.id
  `);
  console.log("2. Produits:", qProd.rows[0]);

  // 3. Répartition mono-marchand vs multi-marchands
  const qMulti = await client.query(`
    WITH counts AS (
      SELECT produit_id, count(DISTINCT marchand_id) as nb_marchands
      FROM offres
      GROUP BY produit_id
    )
    SELECT
      nb_marchands,
      count(*) as nb_produits
    FROM counts
    GROUP BY nb_marchands
    ORDER BY nb_marchands
  `);
  console.log("3. Comparabilité (nb marchands par produit):", qMulti.rows);

  // 4. Catégories détaillées
  const qCats = await client.query(`
    SELECT
      c.nom as categorie,
      c.slug,
      count(DISTINCT p.id) as total_produits,
      count(DISTINCT p.id) FILTER (WHERE o.id IS NOT NULL) as produits_avec_offres,
      count(o.id) as total_offres,
      count(o.id) FILTER (WHERE o.stock = true AND (o.quarantinee = false OR o.quarantinee IS NULL)) as offres_visibles,
      round(avg(o.prix)) as prix_moyen
    FROM categories c
    LEFT JOIN produits p ON p.categorie_id = c.id
    LEFT JOIN offres o ON o.produit_id = p.id
    GROUP BY c.id, c.nom, c.slug
    ORDER BY count(o.id) DESC
  `);
  console.table(qCats.rows);

  // 5. Quarantaine motifs
  const qQuar = await client.query(`
    SELECT raison, count(*) as count
    FROM quarantines_log
    GROUP BY raison
    ORDER BY count DESC
  `);
  console.log("5. Motifs quarantaine:", qQuar.rows);

  // 6. Immo : publication et visibilité
  const qImmo = await client.query(`
    SELECT
      source,
      count(*) as total,
      count(*) FILTER (WHERE actif = true) as actif_true,
      count(*) FILTER (WHERE rejete = true) as rejete_true,
      count(*) FILTER (WHERE actif = true AND (rejete = false OR rejete IS NULL)) as reellement_publiables,
      count(*) FILTER (WHERE contact_tel IS NOT NULL AND contact_tel != '') as avec_tel,
      count(*) FILTER (WHERE photos IS NOT NULL AND jsonb_array_length(photos::jsonb) > 0) as avec_photos,
      count(*) FILTER (WHERE prix IS NOT NULL AND prix >= 10000) as prix_conforme
    FROM annonces_immo
    GROUP BY source
  `);
  console.table(qImmo.rows);

  // 7. Doublons détectés sur les offres (même marchand et titre)
  const qDoublonsOffres = await client.query(`
    SELECT count(*) as surplus
    FROM (
      SELECT marchand_id, lower(trim(titre_marchand)), count(*)
      FROM offres
      GROUP BY marchand_id, lower(trim(titre_marchand))
      HAVING count(*) > 1
    ) sub
  `);
  console.log("7. Groupes avec doublons titre chez même marchand:", qDoublonsOffres.rows[0]);

  // 8. Doublons fiches produits avec même nom normalisé
  const qDoublonsProduits = await client.query(`
    SELECT count(*) as surplus_groupes
    FROM (
      SELECT nom_normalise, count(*)
      FROM produits
      WHERE nom_normalise IS NOT NULL AND nom_normalise != ''
      GROUP BY nom_normalise
      HAVING count(*) > 1
    ) sub
  `);
  console.log("8. Groupes produits avec même nom normalisé:", qDoublonsProduits.rows[0]);

  await client.end();
})();
