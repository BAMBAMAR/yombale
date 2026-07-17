# Dédoublonnage des produits scrapés + tri par défaut « meilleur prix » (design)

**Date** : 17 juillet 2026
**Fichiers concernés** : `backend/services/scraper.js`, `backend/scripts/fusionner-doublons-produits.js` (nouveau), `backend/routes/produits.js`, pills de tri frontend (`frontend-next`). Aucun changement de schéma DB.

## Problème

### Doublons
La recherche (site et chatbot) affiche plusieurs fois le même produit. Diagnostic sur la base de production (17 juillet) :
- **5 218 lignes en trop sur 8 192 produits (64 %)** rien qu'en noms *strictement identiques* : 879× « Split Haier », 869× « Climatiseur Haier », 404× « iPhone X », 222× « Apple iPhone 16 », 124× « J'adore EDP 100ml »…
- Les doublons sont **encore créés chaque jour** (groupes alimentés la veille du diagnostic).
- 2 145 produits n'ont plus aucune offre mais gardent `prix_min`/`nb_offres` figés (ex: les deux « Samsung Galaxy 16 5G » à 85 000 FCFA avec 0 offre réelle).

**Causes racines** (confirmées code + données) :
1. `sauvegarderProduits()` (`scraper.js:783`) : les mots-clés du matching flou excluent `MOTS_GENERIQUES` (marques : `haier`, `iphone`, `apple`, `tcl`… ; termes : `split`, `climatiseur`…) et les tokens < 3 caractères (`x`, `16`, `a`, `52`). Pour un titre composé uniquement de ces mots (« Split Haier », « iPhone X », « Apple iPhone 16 »), `motsCles` est **vide** → le matching est **sauté** → `INSERT` d'un produit neuf à chaque run de scraping.
2. `normaliserTitre()` retire les apostrophes de la requête mais pas des noms en base : `LIKE '%jadore%'` ne matche jamais « J'adore EDP 100ml » en base → aucun match → doublon.

### Tri par défaut
`GET /api/produits` sans `tri` classe par « popularité » (`COUNT(o.id) DESC`). Demande utilisateur : l'affichage par défaut de toutes les pages produits doit montrer **les meilleurs prix d'abord** (prix croissant).

## Décisions validées

- Périmètre : **fix matching + fusion des doublons exacts** (pas de purge des orphelins sans offre, pas de fusion de quasi-doublons à noms différents).
- Mécanisme du fix : **correspondance exacte sur nom normalisé** (approche A) — pas de recherche trigram élargie (risque de fusions abusives type « Split Haier 12000 BTU » vs « 24000 BTU », aucun garde-fou BTU n'existe).
- Tri par défaut : **prix croissant** (`MIN(o.prix) ASC NULLS LAST`), sponsorisés toujours en tête ; ancien classement accessible via `tri=populaire`.

## Design

### 1. Fix scraper — étape de correspondance exacte (`backend/services/scraper.js`)

Dans `sauvegarderProduits()`, entre l'étape 1 (EAN) et l'étape 2 (matching flou), nouvelle étape 1bis :

```sql
SELECT id FROM produits
WHERE LOWER(regexp_replace(nom, '[''"()\[\]]', '', 'g')) =
      LOWER(regexp_replace($1,  '[''"()\[\]]', '', 'g'))
LIMIT 1
```
avec `$1 = normaliserTitre(item.titre)` (déjà minuscules/sans apostrophes/espaces réduits — la double normalisation côté SQL rend la comparaison symétrique quel que soit l'état du nom en base). Les espaces multiples côté base sont aussi réduits (`regexp_replace(..., '\s+', ' ', 'g')`) et le résultat `TRIM`é — la normalisation SQL exacte est figée à l'implémentation et **doit être identique dans le script de fusion** (source unique : constante SQL partagée ou dupliquée à l'identique avec commentaire croisé).

Si trouvé → `produitId` réutilisé (comme un match EAN, compté `mis_a_jour`). Sinon → matching flou existant, inchangé (seuils, garde-fous marque/pouces).

Performance : seq scan sur ~8 200 lignes (3 000 après fusion), au rythme du scraping — acceptable. Index fonctionnel optionnel si l'implémentation constate un ralentissement mesurable (décision d'implémentation, pas une exigence).

### 2. Script de fusion one-shot (`backend/scripts/fusionner-doublons-produits.js`)

Pattern existant : `backfill-specs-offres.js` (`--dry-run` supporté, logs de résumé, exécution manuelle `node backend/scripts/...`).

- **Groupes** : produits partageant le même nom normalisé (exactement la même normalisation SQL que l'étape 1bis).
- **Canonique par groupe** (dans l'ordre) : fiche avec `ean` non NULL, sinon celle avec le plus d'offres réelles (`COUNT(offres)`), sinon la plus ancienne (`created_at ASC`, puis `id` pour un ordre total déterministe).
- **Rattachement au canonique**, une **transaction par groupe** (un échec n'annule que son groupe, logué et compté) :
  1. `offres` : `UPDATE offres SET produit_id = canon WHERE produit_id = doublon` ; en cas de violation de `UNIQUE(produit_id, marchand_id)` (le canonique a déjà une offre du même marchand) : garder l'offre au `scraped_at` le plus récent, rattacher l'`historique_prix` de la perdante à la gagnante (`UPDATE historique_prix SET offre_id = gagnante WHERE offre_id = perdante`), puis supprimer la perdante.
  2. `alertes.produit_id` : `UPDATE ... SET produit_id = canon WHERE produit_id = doublon` (FK sans CASCADE — le DELETE échouerait sinon).
  3. `clics_affiliation.produit_id` : idem (préserve les stats — le `ON DELETE SET NULL` les aurait détachées).
  4. `DELETE FROM produits WHERE id = doublon`.
- **Recalcul final** `prix_min`/`nb_offres` de tous les canoniques touchés, depuis les offres réelles (`stock = true`) : corrige au passage les compteurs figés des fiches fusionnées. Un canonique sans offre → `prix_min = NULL`, `nb_offres = 0` (l'affichage « N/C » existant s'applique).
- **Dry-run** : affiche nombre de groupes, de fiches à supprimer, top 15 des groupes, et 3 exemples détaillés (canonique choisi + doublons + conflits d'offres), sans aucune écriture.

**Ordre d'exécution en prod** : déployer le fix scraper (étape 1) AVANT de lancer la fusion — sinon le run de scraping suivant recrée les doublons.

**Effet assumé** : les URLs `/produit/{id}` des ~5 218 doublons supprimés feront 404 (favoris localStorage, liens éventuellement indexés). Pas de table de redirection (YAGNI — ces pages en double se cannibalisaient de toute façon en SEO).

### 3. Tri par défaut « meilleur prix d'abord »

**Backend** (`backend/routes/produits.js`, `GET /api/produits`) :
- `tri` absent → `MIN(o.prix) ASC NULLS LAST` (au lieu de `COUNT(o.id) DESC NULLS LAST`).
- Nouvelle valeur `tri=populaire` → `COUNT(o.id) DESC NULLS LAST` (l'ancien défaut, désormais explicite).
- `prix_asc` / `prix_desc` / `nom_asc` inchangés. Le préfixe sponsorisé de l'`ORDER BY` (ligne ~145) reste en tête dans tous les cas.

**Frontend** (pages avec pills de tri consommant `/api/produits`) :
- La pill par défaut (aucun `?tri=`) devient « 💰 Prix ↑ » (active quand `tri` absent ou `tri=prix_asc` — les deux donnent le même ordre) ; une pill « ⭐ Populaires » pointe vers `?tri=populaire`.
- Pages concernées : accueil, `/categorie/[slug]` (et landing `[sousCategorie]` si elle affiche les pills). La SPA legacy hérite du nouveau défaut backend sans changement de code.
- **Non concernés** (décision explicite) : pages guides (score personnalisé), immo/annonces/boutiques/télécom (tri « récent »/commercial propre), chatbot (recherche full-text séparée).

Interaction avec la fusion : le tri prix croissant rend les `prix_min` figés très visibles en tête de liste — le recalcul des compteurs (étape 2) et `NULLS LAST` couvrent ce risque. Ordre de déploiement conseillé : tri en dernier, après la fusion.

## Hors scope

- Quasi-doublons à noms différents (« Split Haier 12000 BTU » vs « Split Haier 1.5 CV »).
- Purge des produits orphelins sans offre.
- Redirections 301 des URLs supprimées.
- Tri des autres domaines (immo, annonces, boutiques, télécom, guides).

## Tests / vérification

Pas de framework de test dans le repo — vérifications réelles en lecture d'abord :
1. **Fix matching** : script de vérification hors-ligne appelant la nouvelle requête 1bis avec des titres réels (« Split Haier », « J'adore EDP 100ml ») → doit retourner un id existant. Après déploiement, observer un run de scraping : `stats.inseres` doit s'effondrer au profit de `mis_a_jour`.
2. **Fusion** : `--dry-run` (compte attendu ≈ 35+ groupes exacts, ~5 218 suppressions), puis exécution réelle, puis re-run du diagnostic doublons (doit retomber à ~0) et `GET /api/produits?q=samsung` / `q=split haier` sans doublon visible. Vérifier qu'aucune offre/alerte n'est perdue (comptes avant/après).
3. **Tri** : `GET /api/produits` sans `tri` → prix croissants (sponsorisés en tête) ; `tri=populaire` → ancien ordre ; pills visuellement actives sur accueil/catégorie (`npx tsc --noEmit` pour le frontend, pas de build complet — lent sur cette machine).
