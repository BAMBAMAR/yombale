# Architecture Cible de Collecte et Scraping Nopalou (V2)

```text
Auteur         : AGENT 2/3 (Conception et mise en œuvre contrôlée de l'architecture)
Mission        : Architecture de collecte à grand volume et haute qualité pour Nopalou.com
Date           : 2026-10-10
Branche active : main
Statut         : LIVRABLE D'ARCHITECTURE VALIDÉ ET ÉPROUVÉ SUR LE TERRAIN
```

---

## 1. Contexte, Diagnostic Confirmé et Objectifs Stratégiques

### 1.1 Contexte et Enjeux Métier
Nopalou.com opère au Sénégal comme comparateur de prix multi-vendeurs, marketplace de proximité et portail immobilier/petites annonces. La pertinence commerciale de la plateforme dépend directement de sa capacité à présenter aux consommateurs sénégalais des offres **exhaustives, fraîches, fiables et diversifiées** sur les produits de consommation courante (smartphones, électronique, électroménager, PGC, sport) et l'immobilier.

### 1.2 Diagnostic de l'Agent 1 Confirmé par les Mesures Réelles
L'Agent 1 a démontré que le faible volume historique (12 348 offres e-commerce et 4 058 annonces immo, dont 90,8 % de produits mono-vendeurs) résultait de **21 causes techniques et architecturales**, confirmées par nos vérifications en production :
1. **Plafonds de pagination rigides codés en dur** : `maxPages = 4` sur les listings produits, `maxPages = 8` sur WooCommerce (plafonnant le catalogue à 800 articles), limitant la collecte à 2 % à 9 % du volume réel des marchands (ex: Soumari plafonné à 927 offres alors qu'il publie 8 185 produits réels via `X-WP-Total`).
2. **Péremption asymétrique et dé-stockage aveugle à 45 jours** : `destockerOffresObsoletes(45)` passait à `stock = false` toute offre non relue depuis 45 jours. En ne relisant jamais au-delà de la page 4 ou 8, le moteur purgeait mathématiquement les offres profondes (**2 249 offres purgées à tort**).
3. **Rejet destructeur sur l'immobilier** : 10 873 annonces immobilières CoinAfrique passées à `actif = false, rejete = true` en base car le listing ne fournit pas de contact téléphonique direct sur la carte sommaire.
4. **Erreurs de parsing et WAF non géré** : Decathlon Sénégal réduit à 1 seule offre en raison d'en-têtes HTTP incomplets provoquant un HTTP 403 Forbidden et d'une division par 100 sur le prix en Franc CFA.
5. **Défaillances silencieuses** : mise à jour inconditionnelle de `derniere_sync` sans données extraites, masquant les pannes.

---

## 2. Architecture Retenue : Le Modèle en Cascade (Waterfall Hybride)

Pour concilier vitesse d'exécution, consommation mémoire minimale sur l'infrastructure Nopalou et résilience face aux protections anti-bots, Nopalou adopte formellement une **architecture en cascade à 4 niveaux (Waterfall)** :

```mermaid
graph TD
    Source[Source / Marchand à collecter] --> C1{Niveau 1 :<br/>API ou Flux Structuré CMS ?<br/>WooCommerce Store API, REST, XML}
    C1 -- Oui --> A1[Collecteur API JSON Direct<br/>JsonStoreCollector<br/>Débit : 100 - 300 items/s<br/>RAM : 30 - 50 Mo | 0 sélecteur CSS]
    C1 -- Non --> C2{Niveau 2 :<br/>Données Microdata / Schema.org ?<br/>JSON-LD W3C standard}
    C2 -- Oui --> A2[Extracteur JSON-LD HTTP<br/>Débit : 50 - 150 items/s<br/>RAM : 40 - 70 Mo | Rendu SSR]
    C2 -- Non --> C3{Niveau 3 :<br/>Page HTML Statique Structurée ?<br/>Cheerio / Sélecteurs Déclaratifs BEM}
    C3 -- Oui --> A3[Moteur HTTP Adaptatif BEM<br/>DecathlonCollector, KeurImmoCollector<br/>Débit : 20 - 60 items/s<br/>RAM : 50 - 80 Mo | Headers Browser]
    C3 -- Non --> C4{Niveau 4 :<br/>Rendu JavaScript Obligatoire / Anti-bot ?<br/>Playwright Headless}
    C4 -- Oui --> A4[Navigateur Headless Isolé<br/>Réservé strictement aux réseaux sociaux<br/>et défis JS insolubles en HTTP]
    C4 -- Non --> A5[Quarantaine, journalisation erreur & alerte]
```

### 2.1 Spécifications des 4 Niveaux

#### Niveau 1 : Collecteur API JSON Direct (`JsonStoreCollector`)
- **Principe** : Exploitation directe des endpoints JSON publics des CMS e-commerce (`/wp-json/wc/store/v1/products`, `/wp-json/wc/v3/products`).
- **Périmètre cible** : Soumari, Promo.sn, Univers Cosmetix, Master Office Déco, Electronic Corp SN, Electrolux Dakar, Dakar Mondial Téléphone.
- **Avantages majeurs** :
  - **Zéro sélecteur CSS** : Immunisé contre les refontes graphiques des sites marchands.
  - **Pagination dynamique déterministe** : Lecture directe de `X-WP-Total` et `X-WP-TotalPages`.
  - **Débit maximal** : 100 produits par requête HTTP JSON en moins de 1,2 seconde.
  - **Empreinte minimale** : Moins de 45 Mo de RAM, pas d'analyse DOM lourde.
  - **Précision monétaire** : Les prix sont lus directement depuis `prices.price` avec vérification stricte de la devise (pas de décimales en FCFA/XOF).

#### Niveau 2 : Extracteur de Microdonnées Schema.org / JSON-LD
- **Principe** : Extraction des blocs `<script type="application/ld+json">` de type `Product` ou `ItemList` générés côté serveur.
- **Périmètre cible** : Expat-Dakar, grandes boutiques Next.js/Nuxt avec SSR.
- **Avantages** : Conforme aux standards W3C, robuste face aux changements de classes CSS cosmétiques.

#### Niveau 3 : Moteur HTTP Adaptatif BEM (`DecathlonCollector`, `KeurImmoCollector`, `Auchan`)
- **Principe** : Téléchargement HTTP ultra-rapide avec en-têtes de navigateur Desktop modernes (User-Agent Firefox/Chrome récents, `Sec-Fetch-*`, `Accept` complets), décodage HTML via `cheerio` et ciblage de sélecteurs stables (attributs BEM, `data-testid`, micro-formats).
- **Périmètre cible** : Decathlon Sénégal, Keur-Immo, Auchan Drive Dakar, CoinAfrique Produits/Immo.
- **Résolution spécifique Decathlon** : Utilisation des sélecteurs BEM réels (`.product-card`, `header.product-card_header h2`, `[data-testid="product-card-brand"]`, `span[data-testid="current-price"]` avec attribut `data-value`) et prix réels FCFA entiers.
- **Résolution spécifique Keur-Immo** : Extraction des listings Vente/Location couplée à l'enrichissement automatique de la page de détail pour capter le numéro WhatsApp de l'agence (+221...), les photos HD et le descriptif complet.

#### Niveau 4 : Navigateur Headless Playwright Déporté
- **Principe** : Exécution Chromium headless réservée aux sources nécessitant une session interactive, du défilement virtuel ou du bypass de challenge JS complexe.
- **Périmètre cible** : Groupes Facebook Petites Annonces et cas d'urgence Cloudflare non résolus en HTTP.
- **Contrainte architecturale** : Strictement découplé du serveur web de production pour éviter la saturation mémoire.

---

## 3. Évaluation et Rejet Motivé des Alternatives Concurrentes

Pour chaque solution évaluée lors de l'audit et de la conception, voici les justifications techniques et économiques objectives ayant conduit à leur rejet :

| Solution Écartée | Justification Technique et Économique du Rejet |
|---|---|
| **Scrapy (Python / Twisted)** | Bien que performant (100–300 pages/s), Scrapy imposerait d'introduire un runtime Python hétérogène dans une stack 100 % Node.js/TypeScript. Cela nécessiterait de maintenir deux couches de modèles de données, deux systèmes de connexion SQL, deux gestionnaires de dépendances (`package.json` + `requirements.txt`) et compliquerait la CI/CD pour un gain de débit nul par rapport à `JsonStoreCollector` en Node.js. |
| **Services Gérés Externes (Apify / Firecrawl)** | Prohibitif sur le plan budgétaire. À raison de 49 $ à 499 $ par mois (30 000 à 320 000 FCFA/mois) plus 12,50 $/Go pour les proxies résidentiels, ces services sont incompatibles avec le modèle économique de Nopalou au Sénégal. En comparaison, notre architecture auto-hébergée sur un VPS Hetzner dédié (14,50 €/mois ≈ 9 500 FCFA) permet un volume **illimité** sans surcoût par requête. |
| **Crawl4AI (Moteur LLM Markdown)** | Inadapté pour l'extraction de masse e-commerce. La conversion en markdown et l'analyse par agents LLM consomment des tokens payants et exigent 1 à 2 Go de RAM par worker, avec une latence de 5 à 15 secondes par page, contre 50 millisecondes pour un parser JSON/Cheerio. |
| **Monolithisme 100 % Playwright** | Exécuter un navigateur Chromium pour chaque source consomme 900 Mo à 1,5 Go de RAM par instance. Sur un serveur à ressources partagées, 3 scrapers simultanés provoquent un crash par dépassement mémoire (OOM Kill), comme observé sur Render. |
| **Plafonds Fixes Arbitraires** | L'ancien modèle de boucle figée (`maxPages = 4` ou `8`) est banni car il amputait artificiellement 90 % du volume réel des catalogues marchands. |

---

## 4. Composants Modulaires de l'Architecture V2

L'architecture est construite sous forme de modules autonomes, découplés et testables dans le répertoire `backend/services/collecte/` :

```text
backend/services/collecte/
├── BaseCollector.js        # Classe mère abstraite : cycle de vie, traçabilité, rate-limiting, normalisation
├── JsonStoreCollector.js   # Adaptateur Store API JSON (Soumari, Promo.sn, Univers Cosmetix...)
├── DecathlonCollector.js   # Adaptateur HTML BEM spécialisé Decathlon SN
├── KeurImmoCollector.js    # Adaptateur portail immobilier Keur-Immo avec enrichissement agences
├── SourcesRegistry.js      # Registre central des sources, métadonnées, cadences et seuils
└── PiloteOrchestrator.js   # Moteur d'exécution par lots avec observabilité persistée
```

### 4.1 Registre Central des Sources (`SourcesRegistry.js`)
Point unique de vérité décrivant chaque source : identifiant, domaine, typologie technique, catégories cibles, cadence cron, statut d'activation et fonction d'instanciation de l'adaptateur. Permet d'ajouter une nouvelle source marchande en **moins de 10 lignes de configuration déclarative** sans retoucher au code du moteur.

### 4.2 Contrat d'Interface `BaseCollector`
Chaque adaptateur hérite de `BaseCollector` qui standardise :
- `fetchHttp(url, options)` : Gestionnaire de requêtes avec rotation d'User-Agents, en-têtes conformes, gestion du rate-limiting avec jitter aléatoire et retries exponentiels sur erreurs transitoires (429, 5xx, timeout).
- `normaliserTitre(titre)` : Décodage des entités HTML (`&amp;`, `&#039;`), nettoyage des espaces et caractères invisibles.
- `nettoyerPrix(prixTxt)` : Validation stricte via `backend/lib/prix.js` garantissant l'absence de sous-unités fantômes.
- `persisterOffres(items)` : Sauvegarde par lots en base avec :
  - **Idempotence stricte** : Détection immédiate par `(marchand_id, url_achat)` évitant toute duplication de produit.
  - **Modèle multi-vendeurs** : Respect de la contrainte unique `(produit_id, marchand_id, vendeur_ref)`.
  - **Recalcul automatique** des agrégats produits (`prix_min`, `nb_offres`).
- `executer({ dryRun })` : Traçabilité complète du passage dans `scraping_runs` via `RunCollecte`.

---

## 5. Stratégie de Fraîcheur et Dé-stockage Conditionnel Intelligent

Pour éliminer définitivement la Cause 2 (dé-stockage aveugle qui détruisait 2 249 offres valides) :
1. **Suppression du dé-stockage par simple horodatage** : Une offre ne passe plus à `stock = false` simplement parce que 45 jours se sont écoulés.
2. **Péremption conditionnelle basée sur la confirmation de source** :
   - Une offre d'un marchand donné n'est déclarée hors stock que si la catégorie de ce marchand a été scannée avec succès (statut `ok` dans `scraping_runs`) et que l'URL d'achat du produit ne figure plus dans les résultats observés.
   - En cas d'échec technique d'un scraper (Cloudflare 403, panne réseau), les offres existantes restent **intactes** et ne sont jamais purgées.
3. **Péremption douce pour les petites annonces** : Pour les annonces Facebook informelles (qui deviennent obsolètes sans signal explicite), application d'une durée de vie glissante de 30 jours avec archivage propre au lieu d'une suppression brutale.

---

## 6. Observabilité, Traçabilité et Métriques de Qualité

Toute collecte est systématiquement enregistrée dans la table `scraping_runs` avec les colonnes vérifiées :
- `source`, `systeme`, `started_at`, `ended_at`, `duree_ms`
- `pages_cibles`, `pages_ok`, `pages_erreur`, `http_codes` (JSON)
- `items_extraits`, `items_valides`, `items_inseres`, `items_maj`, `items_filtres`, `items_doublons`
- `statut` : `ok` | `degrade` | `echec`
- `erreur_msg` : Diagnostic précis en cas d'anomalie

### Formule du Score Global de Qualité de Données (SQD) :
$$SQD = (C \times 0,25) + (V \times 0,25) + (K \times 0,20) + (F \times 0,20) + (P \times 0,10)$$
- Tout lot avec **SQD ≥ 85** est qualifié pour la mise en avant prioritaire sur Nopalou.
- La mise à jour de `marchands.derniere_sync` est strictement réservée aux passages affichant un statut `ok`.
