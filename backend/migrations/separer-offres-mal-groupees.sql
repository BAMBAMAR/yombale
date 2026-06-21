-- Migration : séparer les offres de produits différents mal regroupés
-- À exécuter sur Railway (dashboard → PostgreSQL → Query)
-- Ce script crée de nouveaux produits pour les offres mal groupées
-- et réassigne chaque offre à son produit correct.

-- ════════════════════════════════════════════════════════════════
-- CAS 1 : TV Astech 98" groupée avec TV Astech 43"
-- L'offre Soumari "Televiseur Astech 98 Smart Google Tv 4k 98gt3025d"
-- doit devenir son propre produit.
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_produit_43_id UUID;
  v_produit_98_id UUID;
  v_offre_98_id   UUID;
  v_cat_id        UUID;
BEGIN

  -- Trouver le produit 43" actuel (qui contient les offres mal groupées)
  SELECT id INTO v_produit_43_id
  FROM produits
  WHERE nom ILIKE '%astech%43%'
     OR nom ILIKE '%astech%43"'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_produit_43_id IS NULL THEN
    RAISE NOTICE 'Produit Astech 43" introuvable, abandon CAS 1';
  ELSE
    RAISE NOTICE 'Produit 43" trouvé : %', v_produit_43_id;

    -- Trouver l'offre Soumari 98" dans ce groupe
    SELECT o.id INTO v_offre_98_id
    FROM offres o
    JOIN marchands m ON m.id = o.marchand_id
    WHERE o.produit_id = v_produit_43_id
      AND (m.nom ILIKE '%soumari%' OR o.titre_marchand ILIKE '%98%')
    LIMIT 1;

    IF v_offre_98_id IS NULL THEN
      RAISE NOTICE 'Offre Soumari 98" introuvable dans ce groupe, abandon CAS 1';
    ELSE
      -- Récupérer la catégorie du produit 43"
      SELECT categorie_id INTO v_cat_id FROM produits WHERE id = v_produit_43_id;

      -- Créer un nouveau produit pour le 98"
      INSERT INTO produits (nom, marque, categorie_id)
      VALUES ('Televiseur Astech 98" Smart Google TV 4K', 'Astech', v_cat_id)
      RETURNING id INTO v_produit_98_id;

      RAISE NOTICE 'Nouveau produit 98" créé : %', v_produit_98_id;

      -- Réassigner l'offre au nouveau produit
      UPDATE offres SET produit_id = v_produit_98_id
      WHERE id = v_offre_98_id;

      RAISE NOTICE 'Offre 98" réassignée au nouveau produit';
    END IF;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- CAS 2 : TV OLED 77" (Electronic Corp) groupée avec TV 43"
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_produit_43_id UUID;
  v_produit_77_id UUID;
  v_offre_77_id   UUID;
  v_cat_id        UUID;
BEGIN

  -- Trouver le produit 43" (même groupe)
  SELECT id INTO v_produit_43_id
  FROM produits
  WHERE nom ILIKE '%astech%43%'
     OR nom ILIKE '%astech%43"'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_produit_43_id IS NULL THEN
    RAISE NOTICE 'Produit Astech 43" introuvable, abandon CAS 2';
  ELSE

    -- Trouver l'offre Electronic Corp 77"
    SELECT o.id INTO v_offre_77_id
    FROM offres o
    JOIN marchands m ON m.id = o.marchand_id
    WHERE o.produit_id = v_produit_43_id
      AND (m.nom ILIKE '%electronic corp%' OR o.titre_marchand ILIKE '%77%' OR o.titre_marchand ILIKE '%oled%')
    LIMIT 1;

    IF v_offre_77_id IS NULL THEN
      RAISE NOTICE 'Offre Electronic Corp 77" introuvable dans ce groupe, abandon CAS 2';
    ELSE
      SELECT categorie_id INTO v_cat_id FROM produits WHERE id = v_produit_43_id;

      INSERT INTO produits (nom, marque, categorie_id)
      VALUES ('Téléviseur Smart OLED 77" 195cm 4K HDR Google TV', NULL, v_cat_id)
      RETURNING id INTO v_produit_77_id;

      RAISE NOTICE 'Nouveau produit 77" créé : %', v_produit_77_id;

      UPDATE offres SET produit_id = v_produit_77_id
      WHERE id = v_offre_77_id;

      RAISE NOTICE 'Offre 77" réassignée au nouveau produit';
    END IF;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════
-- Vérification : offres restantes sur le produit 43"
-- ════════════════════════════════════════════════════════════════
SELECT o.prix, o.titre_marchand, m.nom AS marchand
FROM offres o
JOIN marchands m ON m.id = o.marchand_id
JOIN produits p  ON p.id = o.produit_id
WHERE (p.nom ILIKE '%astech%43%' OR p.nom ILIKE '%astech%43"')
ORDER BY o.prix ASC;
