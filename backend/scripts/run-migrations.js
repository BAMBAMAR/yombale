// Script d'exécution des migrations SQL Railway
// Usage : node backend/scripts/run-migrations.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run(label, sql) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`▶ ${label}`);
  console.log('='.repeat(60));
  try {
    const r = await pool.query(sql);
    if (r.rows && r.rows.length > 0) {
      console.table(r.rows);
    } else {
      console.log(`✅ OK — ${r.rowCount ?? 0} ligne(s) affectée(s)`);
    }
  } catch (err) {
    console.error(`❌ ERREUR : ${err.message}`);
  }
}

async function main() {
  // ── BLOC 1 — Corriger prix ÷100 (TV 43" avec prix trop hauts) ──
  await run('BLOC 1 — Prix ÷100 TV 43" (Wow, Ibson…)', `
    UPDATE offres
    SET prix = ROUND(prix / 100.0)
    WHERE prix > 5000000
      AND ROUND(prix / 100.0) BETWEEN 50000 AND 500000
      AND (
           titre_marchand ILIKE '%wow 43%'
        OR titre_marchand ILIKE '%ibson 43%'
        OR titre_marchand ILIKE '%43sf%'
        OR titre_marchand ILIKE '%43ut%'
        OR titre_marchand ILIKE '%43gt%'
        OR titre_marchand ILIKE '%43 smart%'
        OR titre_marchand ILIKE '%televiseur%43%'
      )
  `);

  // ── BLOC 2 — Corriger prix ×100 (TV 85"+ avec prix trop bas) ──
  await run('BLOC 2 — Prix ×100 TV grandes tailles (85"+)', `
    UPDATE offres o
    SET prix = o.prix * 100
    WHERE EXISTS (
      SELECT 1 FROM produits p
      WHERE p.id = o.produit_id
        AND (p.nom ILIKE '%98%pouce%' OR p.nom ILIKE '%98"%' OR p.nom ILIKE '% 98 %'
          OR p.nom ILIKE '%85%pouce%' OR p.nom ILIKE '%85"%'
          OR p.nom ILIKE '%90%pouce%' OR p.nom ILIKE '%90"%')
    )
    AND o.prix < 50000
    AND o.prix * 100 BETWEEN 250000 AND 7500000
  `);

  // ── BLOC 3 — Séparer TV Astech 98" ──
  await run('BLOC 3 — Séparer TV Astech 98" du groupe 43"', `
    DO $$
    DECLARE
      v_produit_43_id UUID;
      v_produit_98_id UUID;
      v_offre_98_id   UUID;
      v_cat_id        UUID;
    BEGIN
      SELECT id INTO v_produit_43_id
      FROM produits
      WHERE nom ILIKE '%astech%43%' OR nom ILIKE '%astech%43"'
      ORDER BY created_at ASC LIMIT 1;

      IF v_produit_43_id IS NULL THEN
        RAISE NOTICE 'Produit Astech 43" introuvable, abandon';
      ELSE
        RAISE NOTICE 'Produit 43" trouvé : %', v_produit_43_id;
        SELECT o.id INTO v_offre_98_id
        FROM offres o JOIN marchands m ON m.id = o.marchand_id
        WHERE o.produit_id = v_produit_43_id
          AND (m.nom ILIKE '%soumari%' OR o.titre_marchand ILIKE '%98%')
        LIMIT 1;

        IF v_offre_98_id IS NULL THEN
          RAISE NOTICE 'Offre Soumari 98" introuvable, abandon';
        ELSE
          SELECT categorie_id INTO v_cat_id FROM produits WHERE id = v_produit_43_id;
          INSERT INTO produits (nom, marque, categorie_id)
          VALUES ('Televiseur Astech 98" Smart Google TV 4K', 'Astech', v_cat_id)
          RETURNING id INTO v_produit_98_id;
          RAISE NOTICE 'Nouveau produit 98" créé : %', v_produit_98_id;
          UPDATE offres SET produit_id = v_produit_98_id WHERE id = v_offre_98_id;
          RAISE NOTICE 'Offre 98" réassignée';
        END IF;
      END IF;
    END $$
  `);

  // ── BLOC 4 — Séparer TV OLED 77" ──
  await run('BLOC 4 — Séparer TV OLED 77" du groupe 43"', `
    DO $$
    DECLARE
      v_produit_43_id UUID;
      v_produit_77_id UUID;
      v_offre_77_id   UUID;
      v_cat_id        UUID;
    BEGIN
      SELECT id INTO v_produit_43_id
      FROM produits
      WHERE nom ILIKE '%astech%43%' OR nom ILIKE '%astech%43"'
      ORDER BY created_at ASC LIMIT 1;

      IF v_produit_43_id IS NULL THEN
        RAISE NOTICE 'Produit Astech 43" introuvable, abandon';
      ELSE
        SELECT o.id INTO v_offre_77_id
        FROM offres o JOIN marchands m ON m.id = o.marchand_id
        WHERE o.produit_id = v_produit_43_id
          AND (m.nom ILIKE '%electronic corp%' OR o.titre_marchand ILIKE '%77%' OR o.titre_marchand ILIKE '%oled%')
        LIMIT 1;

        IF v_offre_77_id IS NULL THEN
          RAISE NOTICE 'Offre Electronic Corp 77" introuvable, abandon';
        ELSE
          SELECT categorie_id INTO v_cat_id FROM produits WHERE id = v_produit_43_id;
          INSERT INTO produits (nom, marque, categorie_id)
          VALUES ('Téléviseur Smart OLED 77" 195cm 4K HDR Google TV', NULL, v_cat_id)
          RETURNING id INTO v_produit_77_id;
          RAISE NOTICE 'Nouveau produit 77" créé : %', v_produit_77_id;
          UPDATE offres SET produit_id = v_produit_77_id WHERE id = v_offre_77_id;
          RAISE NOTICE 'Offre 77" réassignée';
        END IF;
      END IF;
    END $$
  `);

  // ── BLOC 5 — Créer nouveaux produits pour offres encore mal groupées ──
  await run('BLOC 5 — Créer produits pour offres mal groupées restantes', `
    INSERT INTO produits (nom, categorie_id)
    SELECT DISTINCT ON (o.titre_marchand) o.titre_marchand, p.categorie_id
    FROM offres o
    JOIN produits p ON p.id = o.produit_id
    WHERE o.stock = true
      AND o.titre_marchand IS NOT NULL
      AND LENGTH(o.titre_marchand) > 10
      AND NOT EXISTS (SELECT 1 FROM produits p2 WHERE p2.nom = o.titre_marchand)
      AND (
        (
          (p.nom ILIKE '%86%' OR p.nom ILIKE '%98%' OR p.nom ILIKE '%85%' OR p.nom ILIKE '%90%')
          AND (o.titre_marchand ILIKE '%43%' OR o.titre_marchand ILIKE '%55%' OR o.titre_marchand ILIKE '%32%' OR o.titre_marchand ILIKE '%50%')
        )
        OR (
          (p.nom ILIKE '%65%' OR p.nom ILIKE '%70%' OR p.nom ILIKE '%75%')
          AND (o.titre_marchand ILIKE '%43%' OR o.titre_marchand ILIKE '%32%')
        )
        OR (p.nom ILIKE '%lg%'     AND (o.titre_marchand ILIKE '%hisense%' OR o.titre_marchand ILIKE '%wow%' OR o.titre_marchand ILIKE '%ibson%' OR o.titre_marchand ILIKE '%astech%'))
        OR (p.nom ILIKE '%astech%' AND (o.titre_marchand ILIKE '%oled%' OR o.titre_marchand ILIKE '%hisense%' OR o.titre_marchand ILIKE '%electronic%' OR o.titre_marchand ILIKE '%nanocell%'))
      )
    ORDER BY o.titre_marchand, o.id
  `);

  // ── BLOC 6 — Déplacer les offres vers leurs nouveaux produits ──
  await run('BLOC 6 — Déplacer offres vers nouveaux produits', `
    UPDATE offres o
    SET produit_id = p_new.id
    FROM produits p_new
    WHERE o.titre_marchand = p_new.nom
      AND o.produit_id != p_new.id
      AND o.stock = true
      AND NOT EXISTS (
        SELECT 1 FROM offres o2
        WHERE o2.produit_id  = p_new.id
          AND o2.marchand_id = o.marchand_id
          AND o2.id         != o.id
      )
  `);

  // ── BLOC 7 — Vérification finale ──
  await run('BLOC 7 — Vérification : TV encore suspects (ratio > 5×)', `
    SELECT
      p.nom AS produit,
      COUNT(o.id) AS nb_offres,
      MIN(o.prix) AS prix_min,
      MAX(o.prix) AS prix_max,
      ROUND(MAX(o.prix)::NUMERIC / NULLIF(MIN(o.prix),0), 1) AS ratio
    FROM produits p
    JOIN offres o ON o.produit_id = p.id AND o.stock = true
    WHERE (p.nom ILIKE '%televiseur%' OR p.nom ILIKE '%television%' OR p.nom ILIKE '% tv %')
      AND o.prix > 0
    GROUP BY p.id, p.nom
    HAVING COUNT(o.id) >= 2
       AND MAX(o.prix)::NUMERIC / NULLIF(MIN(o.prix),0) > 5
    ORDER BY ratio DESC
  `);

  await pool.end();
  console.log('\n✅ Migrations terminées.');
}

main().catch(err => { console.error(err); process.exit(1); });
