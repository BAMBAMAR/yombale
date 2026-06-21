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
  );
