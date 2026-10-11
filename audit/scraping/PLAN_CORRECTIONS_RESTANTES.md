# PLAN DE CORRECTIONS ET MATRICE DES ANOMALIES — SCRAPING NOPALOU

**Auteur** : Agent 3/3 (Audit Final Indépendant du Scraping)  
**Date d'établissement** : 11 Octobre 2026  
**Statut Global** : 5 anomalies critiques/majeures **RÉSOLUES ET TESTÉES** / 4 anomalies résiduelles **DOCUMENTÉES AVEC FEUILLE DE ROUTE**

---

## 1. SYNTHÈSE DU PLAN D'ACTION

Le présent document structure l'ensemble des anomalies identifiées au cours de l'audit approfondi du scraping de Nopalou.com, séparées rigoureusement entre les anomalies effectivement corrigées au niveau du code et de la base de données de production, et les anomalies ouvertes nécessitant des dépendances externes ou des arbitrages d'infrastructure.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ÉTAT DES ANOMALIES SCRAPING                     │
├────────────────────────────────┬───────────────────────────────────────┤
│ ANOMALIES CORRIGÉES & TESTÉES  │ 5 fiches résolues (100% opérationnel) │
│ ANOMALIES OUVERTES RÉSIDUELLES │ 4 fiches planifiées avec feuille route│
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. FICHES DES ANOMALIES CORRIGÉES (RÉSOLUES ET TESTÉES)

### Fiche ANOM-SCRAP-01 : Écrasement des fiches Decathlon par la marque seule
1. **Identifiant unique** : `ANOM-SCRAP-01`
2. **Gravité & Priorité** : **P0 (Critique)** — Dégradation massive de l'intégrité du catalogue.
3. **Preuve reproductible** : Lors du scraping de Decathlon, la base enregistrait seulement 22 offres actives (ex: "DOMYOS", "QUECHUA") pour plus de 330 articles distincts en ligne.
4. **Cause racine démontrée** : Dans `DecathlonCollector.js`, le sélecteur Cheerio `$card.find('header a').text()` ciblait une balise `<a>` vide positionnée avant le `<h2>Nom Produit</h2>`. Le titre extrait étant vide, le script utilisait la marque en repli, provoquant l'écrasement de chaque article par le suivant ayant la même marque.
5. **Fichiers & modules concernés** : `backend/services/collecte/DecathlonCollector.js`
6. **Correction appliquée** : Extraction prioritaire du nom depuis `h2` et `.product-title`, concaténation marque + nom (`DOMYOS Corde à sauter 100, noir`), et dé-duplication si la marque est déjà présente dans le nom.
7. **Risques et dépendances** : Aucun risque identifié. Dépendance standard à Cheerio.
8. **Critères d'acceptation mesurables** : Un run Decathlon extrait des titres complets et insère au moins 20 offres distinctes par rayon sans écrasement.
9. **Tests effectués** : Test unitaire #8 et #9 dans `tests/test_scraping_v2_regression.js`, plus exécution live `scripts/audit/scraping/audit-a3-verifier-decathlon-fix.js`.
10. **Résultat après correction** : 24 offres distinctes extraites et persistées en base avec leurs libellés intégraux.
11. **Tests de régression associés** : `tests/test_scraping_v2_regression.js` (Section 3).

---

### Fiche ANOM-SCRAP-02 : Concaténation de prix dupliqués ("10001000 FCFA")
1. **Identifiant unique** : `ANOM-SCRAP-02`
2. **Gravité & Priorité** : **P1 (Majeure)** — Prix aberrants faussant le comparateur Nopalou.
3. **Preuve reproductible** : Sur les articles affichant à la fois le prix barré et le prix en solde sous le même nœud texte (`"1 000 CFA \n 1 000 CFA"`), `parsePrix` concaténait les chiffres pour produire `10001000` au lieu de `1000`.
4. **Cause racine démontrée** : Remplacement naïf des espaces dans la chaîne brute avant extraction numérique globale, fusionnant les deux montants adjacents.
5. **Fichiers & modules concernés** : `backend/services/collecte/DecathlonCollector.js` et `backend/lib/prix.js`.
6. **Correction appliquée** : Priorité absolue donnée à l'attribut numérique structuré `data-value` (ex: `data-value="1000"`). En cas de repli textuel, extraction du premier montant via regex délimitée avant passage à `parsePrix`.
7. **Risques et dépendances** : Nécessite que `data-value` soit un entier valide.
8. **Critères d'acceptation mesurables** : `parsePrix('1 000 CFA 1 000 CFA')` doit retourner strictement `1000`.
9. **Tests effectués** : Test unitaire #3 et #10 dans `tests/test_scraping_v2_regression.js`.
10. **Résultat après correction** : Prix extrait avec exactitude (ex: Corde à sauter à `1000` FCFA).
11. **Tests de régression associés** : `tests/test_scraping_v2_regression.js` (Section 1).

---

### Fiche ANOM-SCRAP-03 : Échec silencieux d'écriture dans `scraping_runs`
1. **Identifiant unique** : `ANOM-SCRAP-03`
2. **Gravité & Priorité** : **P1 (Majeure)** — Cécité totale de l'historique et des métriques de collecte.
3. **Preuve reproductible** : Depuis le 02/10/2026, aucun run de collecte n'était enregistré dans la table `scraping_runs` lors des exécutions du scraper.
4. **Cause racine démontrée** : Les colonnes `http_codes`, `couverture` et `items_rejetes` introduites par les évolutions de `scrapingRun.js` manquaient physiquement dans la table PostgreSQL `scraping_runs`, déclenchant une exception SQL bloquante étouffée par le bloc `catch`.
5. **Fichiers & modules concernés** : `backend/migrate-inline.js`, table SQL `scraping_runs`.
6. **Correction appliquée** : Exécution de la migration DDL ajoutant les trois colonnes manquantes (`ALTER TABLE scraping_runs ADD COLUMN IF NOT EXISTS http_codes JSONB ...`) et pérennisation dans `backend/migrate-inline.js`.
7. **Risques et dépendances** : Migration additive sans verrou bloquant sur la table.
8. **Critères d'acceptation mesurables** : `INSERT INTO scraping_runs` s'exécute avec succès avec un payload complet.
9. **Tests effectués** : Run #79 inséré avec succès lors du test de l'Agent 3.
10. **Résultat après correction** : Historisation restored et disponible sur `/admin/scraping`.
11. **Tests de régression associés** : `scripts/audit/scraping/test-admin-routes.js`.

---

### Fiche ANOM-SCRAP-04 : Purge aveugle du catalogue lors de l'arrêt d'un scraper
1. **Identifiant unique** : `ANOM-SCRAP-04`
2. **Gravité & Priorité** : **P1 (Majeure)** — Perte d'offres en ligne pour les marchands tiers.
3. **Preuve reproductible** : Lorsqu'un scraper était suspendu ou en panne pendant 45 jours, la tâche `destockerOffresObsoletes()` désactivait automatiquement l'intégralité du catalogue du marchand.
4. **Cause racine démontrée** : La clause SQL ne vérifiait que l'âge de l'offre (`derniere_verif < NOW() - INTERVAL '45 days'`) sans corréler avec l'état de synchronisation du marchand (`marchands.derniere_sync`).
5. **Fichiers & modules concernés** : `backend/services/scraper.js` (fonction `destockerOffresObsoletes`).
6. **Correction appliquée** : Ajout de la condition d'éligibilité : le marchand doit impérativement avoir été synchronisé avec succès au cours des 7 derniers jours (`m.derniere_sync >= NOW() - INTERVAL '7 days'`).
7. **Risques et dépendances** : Les offres d'un marchand dont le scraper est définitivement arrêté resteront actives plus longtemps jusqu'à archivage manuel.
8. **Critères d'acceptation mesurables** : Un marchand en panne depuis 30 jours ne doit voir aucune de ses offres dé-stockées.
9. **Tests effectués** : Test unitaire #23 dans `tests/test_scraping_v2_regression.js`.
10. **Résultat après correction** : Protection active des catalogues contre les purges accidentelles.
11. **Tests de régression associés** : `tests/test_scraping_v2_regression.js` (Section 8).

---

### Fiche ANOM-SCRAP-05 : Absence d'interface d'administration et de supervision du scraping
1. **Identifiant unique** : `ANOM-SCRAP-05`
2. **Gravité & Priorité** : **P2 (Moyenne)** — Impossibilité opérationnelle de piloter le scraping.
3. **Preuve reproductible** : Aucune vue `/admin/scraping` n'existait dans le frontend Next.js.
4. **Cause racine démontrée** : Manque de développement UI dans le périmètre d'administration Nopalou.
5. **Fichiers & modules concernés** : `frontend-next/src/app/admin/(protected)/scraping/page.tsx`, `AdminScrapingClient.tsx`, `backend/routes/scraper.js`, `adminNavConfig.tsx`.
6. **Correction appliquée** : Création d'une console complète avec 4 KPIs, tableau du registre V2, déclenchement unitaire asynchrone, et tableau d'historique avec filtres.
7. **Risques et dépendances** : Authentification admin requise.
8. **Critères d'acceptation mesurables** : Affichage conforme sans erreur console, respect strict des tokens de design et des règles anti-slop (0 emoji).
9. **Tests effectués** : `npm run lint:slop` (0 warning), requêtes HTTP sur endpoints dédiés (200 OK).
10. **Résultat après correction** : Module en production accessible via la navigation d'administration.
11. **Tests de régression associés** : `scripts/audit/scraping/test-admin-routes.js`.

---

## 3. FICHES DES ANOMALIES OUVERTES (RÉSIDUELLES HORS PÉRIMÈTRE IMMÉDIAT)

### Fiche ANOM-SCRAP-06 : Blocage Cloudflare WAF sur Jumia Sénégal
1. **Identifiant unique** : `ANOM-SCRAP-06`
2. **Gravité & Priorité** : **P1 (Bloquant pour la source Jumia)**
3. **Preuve reproductible** : Toute requête HTTP (Axios, Fetch, Puppeteer sans furtivité) vers `https://www.jumia.sn` renvoie une réponse HTTP 403 avec challenge Cloudflare Turnstile / Managed Challenge.
4. **Cause racine démontrée** : Protection WAF anti-bot Cloudflare niveau Entreprise bloquant les plages IP de datacenters.
5. **Fichiers & modules concernés** : `backend/services/collecte/JumiaCollector.js` (prévu).
6. **Correction proposée** : Intégration d'un service de proxy rotatif résidentiel (ex: BrightData, ScrapingBee) ou négociation d'une API de flux catalogue affilié officielle avec Jumia Sénégal.
7. **Risques et dépendances** : Coût mensuel d'infrastructure (estimé 25-50 $/mois) ou dépendance contractuelle.
8. **Critères d'acceptation** : Récupération d'un statut HTTP 200 et du JSON catalogue sans déclenchement de captcha.
9. **Prochaines étapes** : Évaluer la rentabilité commerciale de l'intégration Jumia avant d'engager des coûts de proxy.

---

### Fiche ANOM-SCRAP-07 : Expiration des URLs CDN temporaires de photos Facebook Marketplace
1. **Identifiant unique** : `ANOM-SCRAP-07`
2. **Gravité & Priorité** : **P2 (Moyenne)**
3. **Preuve reproductible** : Les URLs d'images Facebook (`fbcdn.net`) contiennent des signatures d'expiration (`oe=...`, `oh=...`). Après 7 à 14 jours, les images renvoient HTTP 403/410 et apparaissent cassées sur Nopalou.
4. **Cause racine démontrée** : Politique de sécurité de Meta invalidant les liens CDN directs.
5. **Fichiers & modules concernés** : Module de traitement des annonces sociales.
6. **Correction proposée** : Pipeline de téléchargement et d'hébergement sur stockage objet S3/Wasabi/Cloudflare R2 lors de la première ingestion de l'annonce.
7. **Risques et dépendances** : Coût de stockage disque et de bande passante.
8. **Critères d'acceptation** : Aucune URL `*.fbcdn.net` stockée directement en base ; toutes les images servies depuis le stockage Nopalou.
9. **Prochaines étapes** : Déployer le worker de ré-hébergement d'images dans le sprint médias.

---

### Fiche ANOM-SCRAP-08 : 10 873 annonces CoinAfrique historiques sans contact ni prix valide
1. **Identifiant unique** : `ANOM-SCRAP-08`
2. **Gravité & Priorité** : **P2 (Moyenne - Dette de données)**
3. **Preuve reproductible** : Requête SQL : `SELECT COUNT(*) FROM annonces_immo WHERE source = 'coinafrique' AND contact_tel IS NULL` retourne 10 873 lignes.
4. **Cause racine démontrée** : Ingestion historique par le scraper V1 sans validation stricte des champs obligatoires (contact téléphonique et prix non nul).
5. **Fichiers & modules concernés** : Table `annonces_immo`.
6. **Correction proposée** : Script de migration archivant ou purgeant ces lignes obsolètes antérieures à 2026 :
   `UPDATE annonces_immo SET actif = false WHERE source = 'coinafrique' AND (contact_tel IS NULL OR prix = 0);`
7. **Risques et dépendances** : Réduction du volume total brut affiché (de 14 310 à 3 437 annonces), mais qualité et taux de conversion acheteur considérablement accrus.
8. **Critères d'acceptation** : 0 annonce sans contact ni prix visible dans la section `/immo`.
9. **Prochaines étapes** : Valider la purge avec le responsable produit Nopalou.

---

### Fiche ANOM-SCRAP-09 : Optimisation des index Full-Text PostgreSQL pour le Matching
1. **Identifiant unique** : `ANOM-SCRAP-09`
2. **Gravité & Priorité** : **P3 (Faible / Optimisation d'échelle)**
3. **Preuve reproductible** : Lors du passage de 30 000 à plus de 100 000 offres, le matching de réconciliation par trigramme sur les titres peut ralentir le batch nocturne.
4. **Cause racine démontrée** : Absence d'index GIN trigramme dédié sur la colonne `titre` des tables `offres` et `produits`.
5. **Fichiers & modules concernés** : Base de données `nopalou_db`.
6. **Correction proposée** : Activer l'extension `pg_trgm` et créer les index :
   `CREATE INDEX IF NOT EXISTS idx_offres_titre_trgm ON offres USING gin (titre gin_trgm_ops);`
7. **Risques et dépendances** : Léger surcoût d'espace disque (+15 Mo).
8. **Critères d'acceptation** : Requête de similarité textuelle exécutée en moins de 15 ms sur 100 000 enregistrements.
9. **Prochaines étapes** : À exécuter lors du prochain passage d'échelle du catalogue (> 50 000 offres).
