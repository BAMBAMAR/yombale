# RAPPORT DE TESTS DE NON-RÉGRESSION ET DE ROBUSTESSE — SCRAPING NOPALOU V2

**Auteur** : Agent 3/3 (Audit Final Indépendant du Scraping)  
**Date d'exécution** : 11 Octobre 2026  
**Environnement** : Node.js v24.19.0 / PostgreSQL `nopalou_db` / Windows PowerShell  
**Fichiers de test audités** :
- `tests/test_scraping_v2_regression.js` (Suite de tests de régression V2)
- `tests/unit/matching.test.js` (Suite Jest d'algorithme de réconciliation)
- `scripts/audit/scraping/test-admin-routes.js` (Suite d'intégration des endpoints de supervision)

---

## 1. OBJECTIF & CADRE DE VALIDATION

Le présent rapport consigne les résultats des tests d'assurance qualité et de non-régression exécutés indépendamment pour valider la robustesse de l'architecture Scraping V2 de Nopalou.com.

Ces tests couvrent l'intégralité du cycle de vie des données :
1. **Extraction & parsing HTML / API** : validation des sélecteurs, détection des devises, élimination des artefacts textuels.
2. **Normalisation & assainissement** : parseur de prix FCFA, dé-duplication textuelle, décodage d'entités HTML.
3. **Adaptateurs marchands spécialisés** : Decathlon (Cheerio), JsonStore (WooCommerce Store API), Keur-Immo (Immobilier).
4. **Évaluation statistique des collectes** : calcul déterministe des statuts (`ok`, `degrade`, `echec`) selon les seuils SLA.
5. **Intégrité du registre de sources** : vérification de la cohérence du typage et de l'instanciation des adaptateurs.
6. **Cycle de vie & persistance** : protection contre le dé-stockage intempestif des marchands en panne (correctif AUD-188).
7. **Supervision d'administration** : contrôle des routes API `/api/scraper/runs` et `/api/scraper/v2/sources`.

---

## 2. SYNTHÈSE DES RÉSULTATS D'EXÉCUTION

| Périmètre de Test | Commande Exécutée | Tests Totaux | Réussis | Échoués | Statut |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Non-Régression V2** | `node tests/test_scraping_v2_regression.js` | 23 | 23 | 0 | **SUCCÈS** |
| **Réconciliation Matching** | `npx jest tests/unit/matching.test.js` | 8 | 8 | 0 | **SUCCÈS** |
| **API Supervision Admin** | `node scripts/audit/scraping/test-admin-routes.js` | 2 | 2 | 0 | **SUCCÈS** |
| **Live Extraction Fix Decathlon** | `node scripts/audit/scraping/audit-a3-verifier-decathlon-fix.js` | 1 | 1 | 0 | **SUCCÈS** |
| **Total Cumulé** | — | **34** | **34** | **0** | **100% SUCCÈS** |

---

## 3. DÉTAIL DES 23 TESTS DE NON-RÉGRESSION V2 (`test_scraping_v2_regression.js`)

### Section 1 : Normalisation des Prix & Devises FCFA
*Commande* : `node tests/test_scraping_v2_regression.js`

1. **`parsePrix : montant standard FCFA`**  
   - *Entrées* : `'25 000 FCFA'`, `'1 500 CFA'`, `'85.000 F'`  
   - *Attendu* : `25000`, `1500`, `85000` (entiers stricts)  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Évite la conversion en flottant ou l'échec sur les séparateurs de milliers régionaux.

2. **`parsePrix : prix avec espaces insécables ou caractères invisibles`**  
   - *Entrées* : `'10\u202F000\u00A0CFA'`, `'9\u00A0500 F CFA'`  
   - *Attendu* : `10000`, `9500`  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Tolérance aux espaces Unicode insécables (`\u202F`, `\u00A0`) fréquents sur les CMS e-commerce.

3. **`parsePrix : prix répété sur une même chaîne (anti-bug Decathlon)`**  
   - *Entrée* : `'Current price 1 000 CFA \n 1 000 CFA'`  
   - *Attendu* : `1000` (et strictement différent de `10001000`)  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Empêche la concaténation catastrophique de montants sur les pages affichant le prix avant/après promotion.

4. **`parsePrix : rejet des prix sous plancher minimum (500 F)`**  
   - *Entrées* : `'150 FCFA'`, `'0 CFA'`, `'Gratuit'` avec option `{ min: 500 }`  
   - *Attendu* : `null`  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Élimine les fausses offres de contact (« 0 F ») ou les consommables de test.

5. **`parsePrix : rejet des montants aberrants (> 50 000 000 F)`**  
   - *Entrée* : `'999 999 999 FCFA'` avec option `{ max: 50000000 }`  
   - *Attendu* : `null`  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Protection contre les numéros de téléphone saisis par erreur dans le champ prix.

---

### Section 2 : Normalisation des Titres & Entités HTML

6. **`Décodage d’entités HTML dans les titres marchands`**  
   - *Entrée* : `'Bureau &amp; Chaise d&#8217;Étude DH&#8209;7513 &quot;Design&quot;'`  
   - *Attendu* : `'Bureau & Chaise d\'Étude DH‑7513 "Design"'` (zéro entité brute restante)  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Titres propres et indexables sans bruit HTML.

7. **`Suppression des espaces multiples et caractères de contrôle`**  
   - *Entrée* : `'   Samsung   Galaxy    S24  Ultra \u200B\uFEFF  '`  
   - *Attendu* : `'Samsung Galaxy S24 Ultra'`  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Élimination des séparateurs invisibles qui faussent le hachage et la recherche plein-texte.

---

### Section 3 : Adaptateur DecathlonCollector (Cheerio)

8. **`DecathlonCollector : extraction du titre complet (Marque + Nom)`**  
   - *Fixture HTML* : `<span data-testid="product-card-brand">DOMYOS</span><header><a href="..."></a><h2>Corde à sauter 100, noir</h2></header>`  
   - *Attendu* : `'DOMYOS Corde à sauter 100, noir'` (et strictement différent de `'DOMYOS'`)  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Corrige le bug majeur où 330 articles étaient réduits à 22 marques seules en base de données.

9. **`DecathlonCollector : titre quand la marque est déjà présente dans le nom`**  
   - *Fixture HTML* : Marque `DECATHLON`, titre `<h2>DECATHLON SAC DE SPORT 75L</h2>`  
   - *Attendu* : `'DECATHLON SAC DE SPORT 75L'` (pas de doublon `'DECATHLON DECATHLON'`)  
   - *Résultat* : **SUCCÈS (✓)**  
   - *Garantie* : Concaténation intelligente sans répétition pléonastique.

10. **`DecathlonCollector : extraction de prix prioritaire sur data-value`**  
    - *Fixture HTML* : `<span data-testid="current-price" data-value="25000">Current price 25 000 CFA 25 000 CFA</span>`  
    - *Attendu* : `25000`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Priorité absolue à l'attribut structuré du DOM sur le texte bruitée.

---

### Section 4 : Adaptateur JsonStoreCollector (WooCommerce Store API)

11. **`JsonStoreCollector : traitement correct des devises XOF et centimes`**  
    - *Entrée 1* : Article XOF (`currency_minor_unit: 0`, `price: '185000'`) → Attendu : `185000`  
    - *Entrée 2* : Article EUR (`currency_minor_unit: 2`, `price: '15000'`) → Attendu : `150`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Support universel des devises multi-boutiques sans division par 100 erronée en FCFA.

12. **`JsonStoreCollector : arrêt dynamique sur tableau vide ou fin de pages`**  
    - *En-têtes HTTP* : `x-wp-totalpages: 15`, requête page 15  
    - *Attendu* : Arrêt de la pagination (`finAtteinte === true`)  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Aucune boucle infinie sur les catalogues paginés.

---

### Section 5 : Adaptateur KeurImmoCollector (Immobilier)

13. **`KeurImmoCollector : détection automatique des types de biens`**  
    - *Échantillons* :  
      * `'Belle villa avec piscine aux Almadies'` → `'villa'`  
      * `'Appartement F4 vue mer Plateau'` → `'appartement'`  
      * `'Studio meublé cosy à Yoff Apecsy'` → `'appartement_meuble'`  
      * `'Terrain titre foncier 500m2 Somone'` → `'terrain'`  
      * `'Bureaux open space 200m2 Point E'` → `'bureau'`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Typage automatique des annonces non typées par l'origine.

14. **`KeurImmoCollector : détection de ville et quartier`**  
    - *Échantillons* :  
      * `'ALMADIES : Appartement standing 3 chambres'` → `{ ville: 'Dakar', quartier: 'ALMADIES' }`  
      * `'SALY : Magnifique villa pieds dans l eau'` → `{ ville: 'Saly', quartier: 'SALY' }`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Géolocalisation textuelle conforme aux filtres immobiliers Nopalou.

15. **`KeurImmoCollector : rejet systématique des annonces à prix 0`**  
    - *Échantillon* : Annonce avec `prix: 0`, `contact_tel: '+221784755756'`  
    - *Attendu* : `estActif === false` (non publiable)  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Éradication des 10 873 annonces fantômes sans prix ni contact observées dans le scraper V1 historique.

---

### Section 6 : Évaluation des Statuts de Collecte (`evaluerStatut`)

16. **`evaluerStatut : 0 article extrait -> statut echec`**  
    - *Simulation* : Collecte terminée sans aucun article extrait  
    - *Attendu* : `statut: 'echec'`, motif `aucun_article`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Alerte immédiate si le sélecteur du site source change.

17. **`evaluerStatut : couverture faible (< 90%) -> statut degrade`**  
    - *Simulation* : 7 catégories couvertes sur 10 (70% < 90%)  
    - *Attendu* : `statut: 'degrade'`, motif `couverture_70%`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Détection des catégories tombées en 404 ou bloquées.

18. **`evaluerStatut : erreurs HTTP > 10% -> statut degrade`**  
    - *Simulation* : 4 erreurs HTTP sur 20 requêtes (20% > 10%)  
    - *Attendu* : `statut: 'degrade'`, motif `erreurs_http_20%`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Détection précoce du rate-limiting ou des pannes partielles.

19. **`evaluerStatut : volume < 50% de la médiane -> statut degrade`**  
    - *Simulation* : 40 articles extraits contre une médiane historique de 100  
    - *Attendu* : `statut: 'degrade'`, motif `volume_40_vs_mediane_100`  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Détection des pannes d'affichage partiel ou de fin prématurée de pagination.

20. **`evaluerStatut : run conforme -> statut ok`**  
    - *Simulation* : 5 catégories sur 5, 0 erreur HTTP, volume conforme  
    - *Attendu* : `statut: 'ok'`, zéro motif d'alerte  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Validation saine des exécutions conformes aux SLAs.

---

### Section 7 : Registre Unifié des Sources (`SourcesRegistry`)

21. **`SourcesRegistry : intégrité des 9 sources V2 déclarées`**  
    - *Attendu* : Exactement 9 sources configurées avec `id`, `baseUrl`, `systeme`, `type_methode` et fonction de fabrique  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Aucun connecteur orphelin ou mal paramétré.

22. **`SourcesRegistry : instanciation correcte de chaque collecteur`**  
    - *Test* : Instanciation de `soumari`, `decathlon`, `keur_immo`  
    - *Attendu* : Types de système et identifiants assignés fidèlement  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Fabrique logicielle opérationnelle en exécution cron et unitaire.

---

### Section 8 : Cycle de Vie & Dé-stockage Sélectif (Règle Anti-Régression AUD-188)

23. **`Règle de dé-stockage conditionnel (AUD-188)`**  
    - *Simulation* :  
      * Marchand A : synchronisé il y a 2 jours (< 7 jours)  
      * Marchand B : synchronisé il y a 30 jours (> 7 jours, en panne)  
    - *Attendu* : Marchand A éligible au dé-stockage des articles disparus (`true`) ; Marchand B **strictement protégé** contre la purge (`false`)  
    - *Résultat* : **SUCCÈS (✓)**  
    - *Garantie* : Si un scraper tombe en panne, le catalogue du marchand reste visible sur Nopalou au lieu d'être vidé aveuglément après 45 jours.

---

## 4. TESTS DES ENDPOINTS DE SUPERVISION ADMIN (`test-admin-routes.js`)

*Commande* : `node scripts/audit/scraping/test-admin-routes.js`  
*Résultats* :
```text
✓ GET /api/scraper/runs : HTTP 200 (Total runs: 3, Total offres: 31993, Total runs récents: 2)
✓ GET /api/scraper/v2/sources : HTTP 200 (Total sources V2: 9, Dont actives: 9)
```

**Détail des assertions vérifiées** :
1. `GET /api/scraper/runs` :
   - Payload JSON structuré retournant `{ success: true, pagination, filtres, kpis, runs }`.
   - Les KPIs retournés correspondent rigoureusement aux agrégats de la table `scraping_runs` et `offres`.
   - Filtre par `source` et `statut` fonctionnel au niveau SQL.
2. `GET /api/scraper/v2/sources` :
   - Retourne les 9 sources V2 déclarées dans `SourcesRegistry`.
   - Enrichissement dynamique avec les métriques réelles de la table `marchands` et `offres` (`nb_offres`, `derniere_sync`, `statut_sync`).
   - Disponibilité du flag `derniersRuns` pour chaque source.

---

## 5. DÉFAUTS DÉTECTÉS ET RÉSOLUS LORS DE LA PHASE DE TEST

Durant la conception et l'exécution des tests de l'Agent 3, trois défauts critiques régressifs ont été identifiés et immédiatement résolus dans le code de production :

### Défaut 1 : Écrasement des fiches Decathlon par la marque seule
- **Cause racine** : La structure HTML de Decathlon Sénégal contient une balise `<a>` vide avant le titre `<h2>` :
  `<header class="product-card_header"><a class="js-product-card-link" href="..."></a><h2>Nom Produit</h2></header>`
  Le sélecteur Cheerio `$card.find('header a').text()` renvoyait une chaîne vide, forçant le fallback sur la marque seule (`DOMYOS`). Résultat : 330 articles s'écrasaient successivement en BDD sur 22 fiches marques génériques.
- **Correctif** : Ciblage prioritaire de `h2` et `.product-title`, concaténation marque + nom si distincts, et test de non-régression dédié (Test #8).
- **Vérification** : Collecte live Decathlon réussie avec 24 articles complets persistés (ex: *DOMYOS T-shirt fitness respirant 100 noir*).

### Défaut 2 : Échec silencieux d'enregistrement dans `scraping_runs`
- **Cause racine** : Depuis le 02/10/2026, toutes les insertions dans la table `scraping_runs` échouaient silencieusement (`error: column "http_codes" does not exist`), empêchant l'historisation des collectes.
- **Correctif** : Migration SQL exécutée et intégrée dans `backend/migrate-inline.js` ajoutant les colonnes `http_codes JSONB`, `couverture NUMERIC`, `items_rejetes INTEGER`.
- **Vérification** : Insertion vérifiée du Run #79 (Decathlon) avec métriques complètes.

### Défaut 3 : Purge aveugle du catalogue lors de l'arrêt d'un scraper
- **Cause racine** : La fonction `destockerOffresObsoletes()` désactivait toutes les offres non rafraîchies depuis 45 jours sans vérifier si le scraper était fonctionnel ou à l'arrêt.
- **Correctif** : Condition SQL ajoutée vérifiant que le marchand a été synchronisé avec succès au cours des 7 derniers jours (`m.derniere_sync >= NOW() - INTERVAL '7 days'`).
- **Vérification** : Test unitaire #23 et test SQL d'isolation.

---

## 6. CONCLUSION DU RAPPORT DE TESTS

La suite de 34 tests automatisés (23 tests unitaires et de régression V2, 8 tests Jest d'algorithme, 2 tests d'intégration API, 1 test live d'adaptateur) s'exécute avec **100% de succès et 0 échec**. 

Le moteur de scraping Nopalou V2 est techniquement robuste, protégé contre les dégradations silencieuses et prêt pour une exploitation pérenne sous supervision administrative.
