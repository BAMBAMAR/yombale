-- Migration : correction de la classification type_bien
-- À exécuter UNE SEULE FOIS sur la base Railway via psql ou le dashboard
-- Les scrapers futurs produiront les bons types ; cette migration corrige les données existantes.

-- 1. Studios mal classifiés comme "appartement"
--    (titre contient "studio" mais pas "appartement")
UPDATE annonces_immo
SET type_bien = 'studio', updated_at = NOW()
WHERE type_bien IN ('appartement', 'appartement_meuble')
  AND LOWER(titre) LIKE '%studio%'
  AND LOWER(titre) NOT LIKE '%appartement%';

-- 2. Chambres meublées mal classifiées comme "appartement"
--    (titre contient "chambre" + "meub" mais pas "appartement")
UPDATE annonces_immo
SET type_bien = 'chambre_meuble', updated_at = NOW()
WHERE type_bien IN ('appartement', 'appartement_meuble')
  AND LOWER(titre) LIKE '%chambre%'
  AND LOWER(titre) LIKE '%meub%'
  AND LOWER(titre) NOT LIKE '%appartement%';

-- 3. Chambres mal classifiées comme "appartement"
--    (titre contient "chambre" mais pas "appartement", pas déjà couverte)
UPDATE annonces_immo
SET type_bien = 'chambre', updated_at = NOW()
WHERE type_bien IN ('appartement', 'appartement_meuble')
  AND LOWER(titre) LIKE '%chambre%'
  AND LOWER(titre) NOT LIKE '%meub%'
  AND LOWER(titre) NOT LIKE '%appartement%';

-- 4. Normaliser la casse (tout en minuscules)
UPDATE annonces_immo
SET type_bien = LOWER(TRIM(type_bien)), updated_at = NOW()
WHERE type_bien != LOWER(TRIM(type_bien));

-- Vérification après migration :
SELECT type_bien, COUNT(*) as nb
FROM annonces_immo
WHERE supprimee = false
GROUP BY type_bien
ORDER BY nb DESC;
