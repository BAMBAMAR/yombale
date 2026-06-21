-- ════════════════════════════════════════════════════════════════
-- NETTOYAGE TV — Exécuter chaque bloc SÉPARÉMENT dans Railway
-- Copier UN seul bloc → Run → copier le suivant → Run
-- ════════════════════════════════════════════════════════════════


-- ══════════════════
-- BLOC 1 — Fixer les prix ÷100 (Wow 43" 12M→120K, Ibson 43" 9.5M→95K)
-- ══════════════════

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


-- ══════════════════
-- BLOC 2 — Créer les nouveaux produits pour offres mal groupées
-- (43" ou 55" dans groupe 65"+ | mauvaise marque)
-- ══════════════════

INSERT INTO produits (nom, categorie_id)
SELECT o.titre_marchand, MIN(p.categorie_id)
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
GROUP BY o.titre_marchand


-- ══════════════════
-- BLOC 3 — Déplacer les offres vers leurs nouveaux produits
-- ══════════════════

UPDATE offres
SET produit_id = p_new.id
FROM produits p_new
WHERE offres.titre_marchand = p_new.nom
  AND offres.produit_id != p_new.id
  AND offres.stock = true


-- ══════════════════
-- BLOC 4 — Vérification : produits TV encore suspects (ratio > 5x)
-- ══════════════════

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
ORDER BY ratio DESC
