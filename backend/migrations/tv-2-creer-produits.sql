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
ORDER BY o.titre_marchand, o.id;
