-- Migration : correction des prix aberrants en base
-- À exécuter UNE SEULE FOIS sur la base Railway via psql ou le dashboard

-- 1. Corriger les offres × 100 erronées pour les TV très grandes (> 85 pouces)
--    Cas identifié : TV Astech 98" à 17 325 FCFA au lieu de 1 732 500 FCFA
UPDATE offres o
SET prix = o.prix * 100
WHERE EXISTS (
  SELECT 1 FROM produits p
  WHERE p.id = o.produit_id
    AND (p.nom ILIKE '%98%pouce%' OR p.nom ILIKE '%98"%' OR p.nom ILIKE '% 98 %'
      OR p.nom ILIKE '%85%pouce%' OR p.nom ILIKE '%85"%' OR p.nom ILIKE '%90%pouce%' OR p.nom ILIKE '%90"%')
)
AND o.prix < 50000
AND o.prix * 100 BETWEEN 250000 AND 7500000;

-- 2. Vérification générale : offres < 1 000 FCFA (probablement toutes erronées)
SELECT o.prix, p.nom, m.nom AS marchand
FROM offres o
JOIN produits p ON p.id = o.produit_id
JOIN marchands m ON m.id = o.marchand_id
WHERE o.prix < 1000
ORDER BY o.prix ASC
LIMIT 30;

-- 3. Vérification des offres très bas prix par rapport à la médiane de leur produit
SELECT
  p.nom,
  o.prix AS prix_offre,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o2.prix) AS prix_median,
  o.prix / NULLIF(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o2.prix), 0) AS ratio,
  m.nom AS marchand
FROM offres o
JOIN produits p ON p.id = o.produit_id
JOIN marchands m ON m.id = o.marchand_id
JOIN offres o2 ON o2.produit_id = o.produit_id AND o2.stock = true
WHERE o.stock = true
GROUP BY p.nom, o.prix, m.nom
HAVING o.prix / NULLIF(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o2.prix), 0) < 0.1
ORDER BY ratio ASC
LIMIT 20;
