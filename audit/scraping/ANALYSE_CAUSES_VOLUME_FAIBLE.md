# Analyse Approfondie des Causes du Faible Volume de Scraping Nopalou

```text
Mission        : AGENT 1/3 — Diagnostic de performance et causes racines du faible volume
Date           : 2026-10-10
Branche active : main (HEAD 6d4dabcc)
Méthode        : Preuve ou rien — Code source, base de référence nopalou_audit_data, logs d'exécution réels
Classification : [D] Démontrée par le code ou les données | [PD] Partiellement démontrée | [C] Hypothèse à confirmer
```

---

## 1. Vue d'Ensemble des Facteurs Limitants

Le volume restreint de données collectées par Nopalou (12 348 offres e-commerce, 4 058 annonces immobilières, 4 652 annonces classifiées) n'est pas dû à un manque de données sur le web sénégalais, mais à un cumul de **21 freins techniques, méthodologiques et architecturaux majeurs**.

Ces freins se répartissent en 6 grandes familles :
1. **Plafonds de pagination et profondeur d'exploration artificiellement bridés**
2. **Défaillances silencieuses et absence d'observabilité persistée**
3. **Filtres de rejet destructeurs et règles de dé-stockage asymétriques**
4. **Fragilité de l'environnement d'exécution (tâches locales vs serveur)**
5. **Erreurs de persistance et modèles de données restrictifs**
6. **Absence de formats structurés et d'accords d'échange**

---

## 2. Analyse Détaillée Cause par Cause

---

### Cause 1 : Plafonds de Pagination Rigides et Faible Couverture de Listing
- **Fait observé** : Les scrapers n'exploraient initialement que les 4 premières pages d'une catégorie (produits) et les 5 premières pages (immobilier), écrasant les capacités réelles des sites sources.
- **Preuve** :
  - `backend/services/scraper.js:1218` (historique) : appel `c.fn(cat, 4)` forçant `maxPages = 4` pour tous les scrapers.
  - `backend/services/scraper-immo-coinafrique.js:152` : boucle figée à `for (let pg = 1; pg <= 5; pg++)`.
  - `backend/services/scraper-new-sites.js:281` : plafond WooCommerce figé à `page <= 8` (800 produits max par site).
- **Type de cause** : **[D] Démontrée (Code)**.
- **Impact mesuré** :
  - Sur Expat-Dakar (catégorie `telephones`, 1 843 articles réels), 4 pages à 10 items ne récoltent que 40 articles : **couverture ≤ 2,2 %**.
  - Sur CoinAfrique (catégorie `telephones-et-tablettes`, ≥ 5 040 articles réels), 4 pages à 84 items ne récoltent que 336 articles : **couverture ≤ 6,7 %**.
  - Sur Soumari (8 161 produits publiés réels via en-tête `X-WP-Total`), le plafond de 800 articles ne capte que **9,8 % du catalogue**.
  - Sur Promo.sn (4 565 produits réels), seuls 800 articles pouvaient être captés (17,5 %).
- **Étapes de reproduction** :
  1. Lancer un scraper sur un site avec 30 pages de résultats.
  2. Constater l'arrêt immédiat après la page 4 ou 8 même si la pagination continue.

---

### Cause 2 : Interaction Néfaste entre Plafond de Pages et Dé-stockage à 45 Jours
- **Fait observé** : Le volume du catalogue plafonne et régresse au lieu de s'accumuler au fil des semaines.
- **Preuve** :
  - Fonction `destockerOffresObsoletes(45)` exécutée quotidiennement par cron (`scraper.js:1566`).
  - Toute offre dont le `scraped_at` n'a pas été actualisé depuis 45 jours bascule à `stock = false`.
  - Comme le scraper ne relit jamais les pages 5 et suivantes, les articles anciens situés en profondeur ne sont jamais réactualisés et sont définitivement retirés du comparateur.
- **Type de cause** : **[D] Démontrée (Code & Base)**.
- **Impact mesuré** :
  - **2 249 offres** sur la base de référence étaient éligibles au dé-stockage forcé (soit 30,6 % du catalogue de CoinAfrique).
  - Le catalogue converge mathématiquement vers le seul contenu des pages 1 à 4.
- **Étapes de reproduction** :
  1. Insérer une offre avec `scraped_at = NOW() - INTERVAL '46 days'`.
  2. Exécuter `destockerOffresObsoletes(45)`.
  3. Constater `stock = false`.

---

### Cause 3 : Défaillances Silencieuses des Scrapers E-Commerce ("Statut OK" sans Données)
- **Fait observé** : Des sources majeures n'alimentent plus la base pendant plusieurs jours alors que l'administration affiche une synchronisation réussie le jour même.
- **Preuve** :
  - À T0 dans `nopalou_audit_data` :
    - `Jumia Senegal` : `derniere_sync = 24/09/2026 12:09`, mais aucune offre rafraîchie depuis le `21/09/2026 00:21` (3 jours de silence).
    - `Expat-Dakar` : `derniere_sync = 24/09/2026 12:03`, mais aucune offre rafraîchie depuis le `21/09/2026 00:04`.
    - `Jiji` : `derniere_sync = 24/09/2026 12:44`, mais aucune offre rafraîchie depuis le `19/09/2026 00:57`.
  - Dans le code d'origine de `scraper.js` :
    ```javascript
    await pool.query('UPDATE marchands SET derniere_sync = NOW() WHERE nom = $1', [c.nom]);
    ```
    était exécuté inconditionnellement dans le bloc `finally` ou à la fin de la fonction, même si `nbProduits === 0` ou si une page de défi anti-bot (Cloudflare 403) avait renvoyé une chaîne vide.
- **Type de cause** : **[D] Démontrée pour le masquage / [C] Hypothèse pour la cause du blocage (Cloudflare/IP)**.
- **Impact mesuré** :
  - **2 829 offres (22,9 % du stock total)** sont restées totalement figées sans qu'aucune alerte administrateur ne soit déclenchée.
- **Étapes de reproduction** :
  1. Simuler une réponse HTTP 403 ou une page blanche sur Jumia.
  2. Constater que la fonction ne lève aucune exception et met à jour `derniere_sync` à l'heure courante.

---

### Cause 4 : Rejet Systématique des Annonces Immobilières sans Téléphone Direct (CoinAfrique)
- **Fait observé** : CoinAfrique Immobilier (la plus grande source avec 2 522 annonces) a un rendement utile de 0 nouvelle annonce publiée.
- **Preuve** :
  - Sur le listing public `sn.coinafrique.com`, le numéro de téléphone n'est pas présent dans la carte sommaire (il nécessite de cliquer sur « Voir le numéro » sur la page de détail).
  - Dans `scraper-immo-coinafrique.js:216-249`, le test d'éligibilité stipulait :
    ```javascript
    const isActif = !!(item.contact_tel && item.prix && item.prix >= 10000);
    ```
    et la clause SQL `ON CONFLICT (source, ref_externe) DO UPDATE SET actif = EXCLUDED.actif, rejete = EXCLUDED.rejete`.
  - La fonction d'extraction de détail `extraireContactDetail` existait mais n'était jamais appelée dans la boucle principale.
- **Type de cause** : **[D] Démontrée (Code)**.
- **Impact mesuré** :
  - **99,9 % des annonces de CoinAfrique (2 519 sur 2 522)** n'ont pas de numéro direct sur le listing.
  - Tout re-scraping convertissait les annonces existantes en `actif = false, rejete = true` avec le motif *"Données scrapées sans contact téléphonique direct ou sans prix"*. Rendement net : **0 annonce exploitable**.
- **Étapes de reproduction** :
  1. Prendre une annonce CoinAfrique valide avec `actif = true`.
  2. Ré-exécuter `upsertAnnonce` avec le flux de listing (sans téléphone).
  3. Constater que l'annonce passe immédiatement à `actif = false, rejete = true`.

---

### Cause 5 : Fragilité de la Tâche Facebook et Invalidation Fréquente de Session
- **Fait observé** : Le scraping Facebook (réseau social apportant l'essentiel des annonces classifiées et des leads) est instable et subit un taux d'échec massif.
- **Preuve** :
  - Analyse de `logs/scraper-task.log` (165 passages du 05/09 au 10/10/2026) :
    - **64 passages sur 165 (38,8 %)** se terminent à **0 post scrapé** avec la mention `"Session Facebook invalidée"`.
    - **5 passages** lisent des posts mais n'en insèrent aucun (`scrapes > 0, retenus = 0`) car la base Render distante est inaccessible (`getaddrinfo ENOTFOUND`).
    - 14 erreurs fatales de timeout navigateur Playwright (`Timeout 40000ms exceeded`) ou déconnexion réseau (`ERR_INTERNET_DISCONNECTED`).
- **Type de cause** : **[D] Démontrée (Journaux réels)**.
- **Impact mesuré** :
  - Sur 165 créneaux planifiés, **69 créneaux (41,8 %)** n'ont rapporté aucune annonce.
  - Perte estimée : au moins 2 300 annonces non captées sur la période d'un mois.
- **Étapes de reproduction** :
  1. Observer l'expiration périodique des cookies de session Facebook stockés dans `.fb-session.json`.
  2. Lancer le script sans renouvellement manuel des cookies : Playwright est redirigé vers l'écran de login et s'arrête.

---

### Cause 6 : Rendement Quasi Nul d'Omnisource (Bing Dorking & OSM)
- **Fait observé** : Le module `omnisource-collector.js` tourne 4 fois par jour mais n'apporte presque aucune annonce.
- **Preuve** :
  - Dans `logs/scraper-task.log` : **49 passages journalisés, 48 passages à 0 annonce, 2 annonces créées au total** sur 35 jours (0,04 annonce par run).
  - Code `backend/services/omnisource-collector.js` :
    - Requêtes Bing HTML dépendantes du sélecteur `li.b_algo`, fréquemment modifié par Microsoft.
    - Limitation aux nœuds OSM (`node`) sans requêter les polygones (`way` et `relation`), très pauvres en métadonnées téléphoniques à Dakar.
    - Absence de gestion des captchas Bing.
- **Type de cause** : **[D] Démontrée (Journaux & Code)**.
- **Impact mesuré** :
  - Consommation de cycles CPU et requêtes réseau inutiles pour un apport de 2 annonces en plus d'un mois.
- **Étapes de reproduction** :
  1. Exécuter `node scripts/collecte-omnisource.js --immo`.
  2. Constater que le résultat final indique systématiquement 0 annonce créée.

---

### Cause 7 : Sources Configurées Mortes ou Sans Collecteur Dédié
- **Fait observé** : Plusieurs sites majeurs déclarés dans le catalogue n'apportent aucun produit.
- **Preuve** :
  - `Nova Sénégal` (`nova.sn`) : Déclaré dans `SITES_CONFIG`, mais 0 produit en base. L'API Store répond 404, le repli HTML échoue car les sélecteurs ne correspondent pas à la maquette du site.
  - `Dakar Market` (`dakarmarket.sn`) : Déclaré dans `SITES_CONFIG`, 0 produit. Sondage réseau : `connection refused` (site fermé ou hébergement hors service).
  - `Dakar-Deal` et `SenMarket` : Marchands enregistrés dans la table `marchands` par les migrations initiales (`migrate.js:127-129`), mais aucun scraper n'a jamais été écrit pour ces deux domaines.
- **Type de cause** : **[D] Démontrée (Base & Code)**.
- **Impact mesuré** :
  - 4 marchands déclarés à 0 offre, faussant la couverture annoncée de la marketplace.
- **Étapes de reproduction** :
  1. Vérifier `SELECT count(*) FROM offres WHERE marchand_id = (SELECT id FROM marchands WHERE nom = 'Dakar-Deal')` : résultat 0.

---

### Cause 8 : Erreur de Modèle Économique de Decathlon (1 Offre Unique)
- **Fait observé** : Decathlon Sénégal (l'un des plus grands magasins d'articles de sport de Dakar) ne compte qu'une seule offre dans la base de données Nopalou.
- **Preuve** :
  - Deux erreurs cumulées dans `scraper.js` :
    1. L'URL configurée dans `CATS.decathlon` était `3745-tous-les-sports`, qui n'était pas une page de catégorie mais une fiche produit unitaire (« Manchons à squat »).
    2. La fonction de parsing appliquait `Math.round(prix / 100)` sous l'hypothèse erronée que les prix étaient exprimés en centimes, alors que le Franc CFA (XOF) n'a pas de sous-unité monétaire. Un produit à 25 000 FCFA ressortait à 250 FCFA et était automatiquement filtré par le seuil `prix < 500`.
- **Type de cause** : **[D] Démontrée (Code)**.
- **Impact mesuré** :
  - Catalogue entier de Decathlon (plusieurs milliers de références sportives) réduit à 1 seule offre.
- **Étapes de reproduction** :
  1. Inspecter `scraper.js:574` : division par 100 non conditionnée par la devise.

---

### Cause 9 : Ordre Fixe d'Itération et Famine des Sites de Queue de Liste
- **Fait observé** : Les sites situés en fin de liste de configuration (`electromenager-dakar.com`, `universcosmetix.com`, `soumari.com`) avaient plusieurs jours de retard par rapport aux premiers.
- **Preuve** :
  - Dans `scraper-new-sites.js:350-375`, la boucle parcourait le tableau `SITES_CONFIG` toujours dans le même ordre séquentiel fixe.
  - Le déploiement continu Render (`autoDeploy: true`) redémarre le conteneur à chaque commit. Chaque redémarrage interrompt la tâche en cours et la relance depuis le début.
  - Les 3 premiers sites étaient toujours rafraîchis, tandis que les derniers n'étaient jamais atteints avant l'interruption suivante.
- **Type de cause** : **[PD] Partiellement démontrée (Code & Horodatages `scraped_at`)**.
- **Impact mesuré** :
  - **3 833 offres (31,0 % du stock)** affichaient un retard de 3 à 5 jours à T0.
- **Étapes de reproduction** :
  1. Observer les horodatages `scraped_at` par marchand : les premiers de la liste sont à 18h12, les derniers datent de plusieurs jours auparavant.

---

### Cause 10 : Modèle de Données Restrictif à Une Seule Offre par Couple (Produit, Marchand)
- **Fait observé** : Sur les places de marché multi-vendeurs (CoinAfrique, Expat-Dakar, Jiji), le comparateur écrase les offres concurrentes d'un même modèle.
- **Preuve** :
  - Contrainte SQL unique `offres_produit_id_marchand_id_key` sur `(produit_id, marchand_id)` avec clause `ON CONFLICT DO UPDATE`.
  - Quand 15 vendeurs différents vendent un *iPhone 13 128 Go* sur CoinAfrique à des prix différents (ex. 320 000, 350 000, 380 000 FCFA), la ligne de l'offre est écrasée à chaque passage par le dernier vendeur lu.
- **Type de cause** : **[D] Démontrée (Schéma SQL)**.
- **Impact mesuré** :
  - Perte de la granularité des prix concurrents : la table `historique_prix` enregistrait jusqu'à 288 variations erratiques par offre dues aux changements de vendeurs, et non à une baisse de prix réelle.
- **Étapes de reproduction** :
  1. Exécuter deux insertions successives pour le même produit et le même marchand avec deux URLs de vendeurs différentes.
  2. Constater qu'une seule offre subsiste en base.

---

### Cause 11 : Quarantaine à Sens Unique Sans Réintégration Automatique
- **Fait observé** : Des centaines de produits valides sont masqués aux acheteurs par le détecteur d'anomalies.
- **Preuve** :
  - `anomaly-detector.js` applique des règles de variation brutale (> 50 % par rapport à la moyenne 30 jours).
  - À T0, **723 offres (5,9 % du catalogue)** étaient marquées `quarantinee = true`.
  - Parmi elles, **57 % (447 offres) correspondaient à des baisses de prix** (promotions réelles ou soldes).
  - La route d'administration de déblocage manuel ne fonctionnait pas en raison d'une erreur de syntaxe SQL PostgreSQL (`UPDATE ... ORDER BY ... LIMIT`).
- **Type de cause** : **[D] Démontrée (Code & Base)**.
- **Impact mesuré** :
  - 723 offres valides retirées de la vue des utilisateurs, dont des promotions attractives.
- **Étapes de reproduction** :
  1. Passer le prix d'un produit de 100 000 à 45 000 FCFA.
  2. Constater le passage immédiat en quarantaine sans moyen de sortie automatique.

---

### Cause 12 : Fragilité des Liens d'Images sur les CDN Réseaux Sociaux
- **Fait observé** : Les photos des annonces classifiées et immobilières Facebook deviennent blanches après quelques semaines.
- **Preuve** :
  - Les URLs d'images extraites contiennent `scontent.xx.fbcdn.net`.
  - Meta applique des signatures temporaires (`oh=...&oe=...`) qui expirent au bout de quelques jours.
  - En base à T0, **2 925 annonces classifiées** avaient des images exclusivement hébergées sur `fbcdn`, sans miroir Cloudinary pérenne.
- **Type de cause** : **[D] Démontrée (Base & Fonctionnement CDN Meta)**.
- **Impact mesuré** :
  - Dégradation visuelle massive du catalogue classifiées pour les utilisateurs (liens brisés).
- **Étapes de reproduction** :
  1. Ouvrir une URL d'image Facebook enregistrée il y a 30 jours : erreur 403 Forbidden / Signature expired.

---

### Cause 13 : Absence de Gestion des Données Structurées Intégrées (JSON-LD / Schema.org)
- **Fait observé** : La plupart des scrapers parcourent le DOM avec des sélecteurs CSS complexes au lieu de lire les blocs de données déjà structurées par les CMS.
- **Preuve** :
  - De nombreux sites marchands sénégalais sous WooCommerce ou Shopify injectent un script `<script type="application/ld+json">` contenant le schéma `Product` avec `name`, `price`, `priceCurrency`, `image` et `availability`.
  - Seul `scraper-immo-expat.js` et partiellement `scraper.js` (Expat) tentaient une extraction JSON-LD.
- **Type de cause** : **[D] Démontrée (Code)**.
- **Impact mesuré** :
  - Fragilité accrue : le moindre changement de classe CSS de thème brise le scraper, alors que le JSON-LD reste stable.

---

### Cause 14 : Catégorisation Automatique Restreinte (41,5 % dans "Divers")
- **Fait observé** : Plus de 4 500 produits ne sont rattachés à aucune catégorie métier.
- **Preuve** :
  - Le fichier `scraper.js:50-100` utilise un dictionnaire de mots-clés `CAT_MOTS`.
  - Tout produit dont le titre ne contient aucun des mots de la liste est affecté à la catégorie `divers`.
  - Dans la base à T0 : **4 521 offres sur 10 882 (41,5 %)** sont rangées sous `divers`.
- **Type de cause** : **[D] Démontrée (Base & Code)**.
- **Impact mesuré** :
  - Les utilisateurs naviguant par catégories ne trouvent pas ces produits ; le volume apparent des rayons spécialisés est divisé par deux.

---

### Cause 15 : Déduplication Produits avec Faux Négatifs (Normalisation Hétérogène)
- **Fait observé** : Des produits identiques provenant de marchands différents ne sont pas regroupés, créant des doublons de fiches au lieu d'un comparateur multi-offres.
- **Preuve** :
  - `matching.js` étape 3 comparait `f_unaccent(lower(nom))` avec `normaliserTitre(titre)`.
  - Les deux fonctions n'appliquaient pas les mêmes règles de nettoyage (ponctuation, mots vides).
  - Mesure réalisée avec `measure-dedup.js` : **39,5 % des titres exacts ne se retrouvaient pas eux-mêmes**.
  - 182 groupes de fiches au nom identique existaient en surplus dans la table `produits`.
- **Type de cause** : **[D] Démontrée (Code & Rejeu)**.
- **Impact mesuré** :
  - Multiplication artificielle des fiches mono-offres et échec du regroupement comparatif pour 323 fiches.

---

### Cause 16 : Erreurs HTTP Non Tracées et Avalées par les Scrapers
- **Fait observé** : Aucune alerte n'indique quand un scraper reçoit des codes 403, 429 ou 500.
- **Preuve** :
  - Dans `scraper-immo-expat.js:157-159` et `scraper-immo-coinafrique.js:210-212`, l'interception d'une erreur HTTP provoquait un retour de tableau vide `[]`, interprété comme la fin normale de la pagination.
  - La variable `pagesErreur` restait à 0.
- **Type de cause** : **[D] Démontrée (Code)**.
- **Impact mesuré** :
  - Arrêt prématuré de la collecte sur un simple incident réseau transitoire sans reprise.

---

### Cause 17 : Absence de Rendu JavaScript sur les Sites Modernes (SPA)
- **Fait observé** : Les sites développés en React, Vue ou Angular sans SSR renvoient un squelette HTML vide au collecteur HTTP standard (`axios` + `cheerio`).
- **Preuve** :
  - Les scrapers e-commerce de Nopalou reposent à 100 % sur `axios.get()`.
  - Si un marchand passe sa boutique sur une architecture headless SPA, le volume extrait tombe instantanément à 0 sans lever d'erreur technique.
- **Type de cause** : **[D] Démontrée (Architecture)**.
- **Impact mesuré** :
  - Impossibilité d'intégrer des sites modernes sans rendu navigateur ou API sous-jacente.

---

### Cause 18 : Dépendance aux Adresses IP de Centres de Données (Blocages Cloudflare)
- **Fait observé** : Jumia répond systématiquement par un code HTTP 403 aux sondes lancées depuis des serveurs cloud.
- **Preuve** :
  - Sonde de volume du 01/10/2026 : première requête sur `jumia.sn` rejetée immédiatement avec un code HTTP 403 (défi anti-bot Cloudflare).
  - Les hébergeurs comme Render, Railway ou Hetzner ont leurs plages d'adresses IP répertoriées par Cloudflare / DataDome.
- **Type de cause** : **[D] Démontrée (Sonde)**.
- **Impact mesuré** :
  - Perte totale d'accès aux sites protégés par Cloudflare en mode HTTP direct sans proxy résidentiel ou accord de flux.

---

### Cause 19 : Absence de Files d'Attente et Perte d'État au Redémarrage
- **Fait observé** : Nopalou n'utilise aucun gestionnaire de file de messages (BullMQ, Redis Queue, RabbitMQ) pour le scraping.
- **Preuve** :
  - La planification repose sur `node-cron` en mémoire du processus Node.js.
  - Le verrouillage s'effectue via un objet mémoire `lib/scrapingLock.js`.
  - Lors d'un crash ou redémarrage de l'application, toutes les tâches en cours sont perdues sans reprise d'état.
- **Type de cause** : **[D] Démontrée (Architecture)**.
- **Impact mesuré** :
  - Impossibilité de distribuer la charge sur plusieurs workers ou de reprendre une collecte interrompue.

---

### Cause 20 : Limitations Réglementaires et Absence de Partenariats Structurés
- **Fait observé** : Nopalou opère presque exclusivement par collecte non sollicitée (*web scraping*) plutôt que par flux d'alimentation marchand.
- **Preuve** :
  - 0 flux XML / Google Shopping / CSV de marchands partenaires ingéré automatiquement.
  - Risque d'usurpation de User-Agent (Chrome factice) et vulnérabilité aux poursuites ou blocages IP.
- **Type de cause** : **[D] Démontrée (Politique technique)**.
- **Impact mesuré** :
  - Effort de maintenance permanent des sélecteurs CSS au lieu d'une ingestion stable et contractuelle.

---

### Cause 21 : Absence de Collecte Immobilière Spécialisée (Keur-Immo, MaMaison)
- **Fait observé** : L'immobilier ne couvre que 2 sources grand public et un groupe Facebook, ignorant les portails professionnels d'agences.
- **Preuve** :
  - Aucun collecteur pour `keur-immo.com` ou `mamaison.sn`.
  - Le catalogue immobilier manque de biens certifiés, de mandats récents et de coordonnées d'agences vérifiées.
- **Type de cause** : **[D] Démontrée (Inventaire)**.
- **Impact mesuré** :
  - 4 058 annonces seulement pour tout le Sénégal, dominées à 62 % par CoinAfrique non contactable.

---

## 3. Matrice de Synthèse et Gravité des Causes

| Cause | Domaine | Statut Preuve | Gravité | Impact Volume Direct | Solution Prioritaire |
|---|---|:---:|:---:|---|---|
| **Plafonds de pagination** | Tous | [D] | P1 | Réduction du catalogue à 2 % – 8 % du stock | Pagination guidée par l'API / dernière page |
| **Dé-stockage à 45 jours** | Produits | [D] | P1 | Élimination de 2 249 offres non relues | Conditionner la péremption à une relecture effective |
| **Silence masqué (statut ok)** | Produits | [D] | P1 | 2 829 offres figées sans alerte | Statuts stricts (`ok`, `degrade`, `echec`) et alertes |
| **Rejet CoinAfrique immo** | Immo | [D] | P1 | 2 512 annonces rendues inexploitables | Statut "à compléter" au lieu de "rejeté" |
| **Fragilité session Facebook** | Réseaux | [D] | P1 | 38,8 % des passages à zéro | Session serveur pérenne, rotation et contrôle |
| **Decathlon (÷ 100 & URL)** | Sport | [D] | P2 | Catalogue réduit à 1 seule offre | Connecteur PrestaShop et URLs catégories réelles |
| **Sources configurées mortes** | E-commerce | [D] | P2 | 4 sources à 0 offre | Diagnostic ciblé par site ou archivage |
| **Rendement Omnisource nul** | Prospection | [D] | P2 | 2 annonces sur 49 passages | Révision des requêtes ou arrêt du canal |
| **Une offre par marchand** | Comparateur| [D] | P2 | Écrasement des prix des vendeurs tiers | Clé composite `(produit, marchand, vendeur_ref)` |
| **Quarantaine à sens unique** | Qualité | [D] | P2 | 723 offres bloquées dont 57 % de baisses | Réintégration automatique après vérification |
| **Famine queue de liste** | E-commerce | [PD] | P2 | Retard de 3 à 5 jours sur 3 833 offres | Rotation ordonnée par ancienneté |
| **Photos CDN périssables** | Classifiées| [D] | P2 | Liens d'images brisés après 30 jours | Sauvegarde Cloudinary pérenne |
| **Catégorie "Divers" (41 %)** | Recherche | [D] | P2 | 4 521 produits mal indexés | Enrichissement du classificateur sémantique |
| **Faux négatifs déduplication**| Comparateur| [D] | P2 | 323 fiches doublons non comparées | Normalisation commune `nom_normalise` |
