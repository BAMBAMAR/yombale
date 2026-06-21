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
  );
