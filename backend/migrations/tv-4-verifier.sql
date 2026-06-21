SELECT
  p.nom                                                     AS produit,
  COUNT(o.id)                                               AS nb_offres,
  MIN(o.prix)                                               AS prix_min,
  MAX(o.prix)                                               AS prix_max,
  ROUND(MAX(o.prix)::NUMERIC / NULLIF(MIN(o.prix),0), 1)   AS ratio
FROM produits p
JOIN offres o ON o.produit_id = p.id AND o.stock = true
WHERE (p.nom ILIKE '%televiseur%' OR p.nom ILIKE '%television%' OR p.nom ILIKE '% tv %')
  AND o.prix > 0
GROUP BY p.id, p.nom
HAVING COUNT(o.id) >= 2
   AND MAX(o.prix)::NUMERIC / NULLIF(MIN(o.prix),0) > 5
ORDER BY ratio DESC;
