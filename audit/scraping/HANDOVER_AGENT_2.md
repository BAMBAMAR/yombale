# Handover Agent 1 → Agent 2 — Diagnostic de Performance et Architecture de Collecte Nopalou

```text
Émetteur       : AGENT 1/3 (Audit du scraping Nopalou : volume, couverture et diagnostic de performance)
Destinataire   : AGENT 2/3 (Conception de la nouvelle architecture de collecte / scraping)
Date           : 2026-10-10
Branche active : main (HEAD 6d4dabcc)
Verdict        : DIAGNOSTIC ÉTABLI (100 % des constats démontrés, 7 livrables créés)
Code modifié   : AUCUN (Session strictement diagnostique, 0 modification de code de production)
```

---

## 1. Contexte et Mandat Réalisé

L'Agent 1 avait pour mission d'examiner le système existant de collecte et d'ingestion de Nopalou, d'établir l'état de référence des volumes réels, d'identifier les causes racines du volume restreint et de préparer le benchmark pour permettre à l'Agent 2 de concevoir la refonte architecturale sans refaire le diagnostic.

### Cartographie Documentaire des Livrables de l'Agent 1
L'intégralité des livrables requis est logée dans le dossier `audit/scraping/` :
1. [`audit/scraping/ETAT_INITIAL_SCRAPING.md`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/scraping/ETAT_INITIAL_SCRAPING.md) : Description complète de l'architecture, volumes mesurés, ventilation par catégorie et historique de 35 jours de logs.
2. [`audit/scraping/INVENTAIRE_SOURCES_SCRAPING.csv`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/scraping/INVENTAIRE_SOURCES_SCRAPING.csv) : Inventaire tabulaire des 28 sources existantes et candidates (statut, volumétrie, coûts, preuves, décisions).
3. [`audit/scraping/ANALYSE_CAUSES_VOLUME_FAIBLE.md`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/scraping/ANALYSE_CAUSES_VOLUME_FAIBLE.md) : Analyse exhaustive démontrée des 21 causes techniques et organisationnelles du faible volume.
4. [`audit/scraping/PLAN_EXTENSION_SOURCES.md`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/scraping/PLAN_EXTENSION_SOURCES.md) : Plan d'extension en 3 vagues, sources candidates sénégalaises (PGC, Immo pro, Open Data ANSD).
5. [`audit/scraping/BENCHMARK_TECHNIQUES_SCRAPING.md`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/scraping/BENCHMARK_TECHNIQUES_SCRAPING.md) : Benchmark comparatif des 10 approches, tarifs vérifiés d'octobre 2026 et architecture hybride à 4 niveaux.
6. [`audit/scraping/PLAN_MESURE_QUALITE_VOLUME.md`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/scraping/PLAN_MESURE_QUALITE_VOLUME.md) : Cadre des 16 indicateurs, Score Global de Qualité (SQD), schéma SQL `scraping_runs` et alertes.
7. [`audit/scraping/HANDOVER_AGENT_2.md`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/yombale/audit/scraping/HANDOVER_AGENT_2.md) : Ce document de transmission.

---

## 2. Synthèse des Constats Clés Confirmés par les Preuves

1. **Volume réel mesuré en base de production (`nopalou_audit_data`)** :
   - **12 348 offres e-commerce** réparties sur 17 marchands actifs (dont 11 625 réellement visibles et 723 en quarantaine).
   - **10 882 produits comparables**, mais **90,8 % (9 878) sont des produits mono-vendeurs** sans aucune concurrence de prix. Seuls 9,2 % des produits ont 2 marchands ou plus.
   - **4 058 annonces immobilières**, dominées à 62 % par CoinAfrique dont 99,9 % n'ont pas de numéro de téléphone direct sur le listing.
   - **4 652 annonces classifiées**, dont 4 590 issues de groupes Facebook.
   - **1 649 prospects CRM qualifiés**.
2. **Sources configurées vs sources réellement exploitées** :
   - Sur 21 sources déclarées, **4 rapportent 0 offre** : `Nova Sénégal`, `Dakar Market`, `Dakar-Deal`, `SenMarket`.
   - **Decathlon ne rapporte qu'1 seule offre** (PrestaShop mal configuré et division par 100).
   - **Jumia, Expat-Dakar et Jiji** sont restés silencieux pendant plusieurs jours en production sans qu'aucune alerte ne soit déclenchée car le statut "OK" était assigné inconditionnellement.
3. **Journaux d'exécution réels (35 jours de logs, 05/09 au 10/10/2026)** :
   - Sur 165 runs Facebook : **38,8 % d'échec total (64 runs à 0 post)** pour cause de session Playwright expirée sur le poste local.
   - Omnisource : **48 runs à zéro sur 49** (2 annonces créées en 35 jours, rendement nul).
4. **Causes majeures du volume faible** :
   - Plafonds de pagination rigides (4 pages produits, 5 pages immo, 8 pages WooCommerce) limitant la lecture à **2 % – 8 % du contenu disponible**.
   - Dé-stockage automatique à 45 jours qui élimine les produits profonds jamais relus (**2 249 offres purgées**).
   - Rejet systématique des annonces CoinAfrique immo sans contact direct.
   - Contrainte SQL d'une seule offre par couple `(produit, marchand)` qui écrase les vendeurs sur les marketplaces.

---

## 3. Synthèse des Recommandations Techniques pour l'Agent 2

L'Agent 2 est invité à concevoir la nouvelle architecture de collecte selon les 5 piliers suivants :

### Pilier 1 : Architecture Hybride en Cascade (Waterfall)
- **Niveau 1 : Connecteurs JSON direct (Store API WooCommerce / REST)** pour tous les sites sous WordPress/WooCommerce (débit maximal, 0 sélecteur CSS, < 50 Mo RAM).
- **Niveau 2 : Extracteur de microdonnées Schema.org / JSON-LD** pour les sites e-commerce modernes avec rendu côté serveur.
- **Niveau 3 : Moteur HTTP Cheerio / Crawlee** avec sélecteurs déclaratifs par domaine pour les listings HTML classiques (CoinAfrique, Auchan, Decathlon, Keur-Immo).
- **Niveau 4 : Navigateur Headless Playwright réservé strictement** aux réseaux sociaux (Facebook) et aux pages nécessitant une session connectée.

### Pilier 2 : Découplage et Ordonnancement Fiable
- Bannir l'exécution de tâches de production sur un poste de travail Windows local.
- Déporter les collecteurs légers (HTTP/JSON) sur le serveur backend ou un worker cloud dédié (VPS Hetzner à 14,50 €/mois).
- Remplacer les boucles séquentielles figées par une file d'attente avec reprise après panne et rotation par ancienneté (traiter en priorité les sources les plus en retard).

### Pilier 3 : Pagination Guidée et Fin de Liste Dynamique
- Supprimer les plafonds fixes codés en dur.
- Détecter la dernière page réelle via l'en-tête HTTP (`X-WP-TotalPages`), la balise `<link rel="last">` ou l'absence de nouveaux éléments.
- Remplacer le dé-stockage aveugle à 45 jours par une péremption conditionnelle : une offre n'est marquée hors stock que si sa catégorie a été relue avec succès sans que le produit n'y figure.

### Pilier 4 : Normalisation et Modèle Multi-Vendeurs
- Faire évoluer la contrainte d'unicité des offres vers `(produit_id, marchand_id, vendeur_ref)` pour conserver les différentes offres de vendeurs tiers sur CoinAfrique, Expat et Jiji.
- Standardiser le parseur de prix sur `lib/prix.js` (déjà validé sur 17 formats de devises sénégalaises).
- Harmoniser le matching avec la colonne unique `nom_normalise` pour éliminer les fiches produits doublonnes.

### Pilier 5 : Observabilité et Alerting Temps Réel
- Enregistrer chaque passage dans `scraping_runs` avec les codes HTTP détaillés, le ratio de couverture et la durée.
- Définir 3 statuts stricts : `ok` (données reçues conformes), `degrade` (données partielles ou couverture faible), `echec` (0 donnée ou erreurs HTTP > 10 %).
- Conditionner la mise à jour de `marchands.derniere_sync` au statut `ok`.
- Alerter l'équipe d'exploitation après 2 échecs consécutifs d'une source majeure.

---

## 4. Incertitudes et Points d'Arbitrage Ouverts pour l'Agent 2

1. **Cloudflare sur Jumia Sénégal** :
   - *Incertitude* : Jumia bloque actuellement les requêtes HTTP directes depuis les centres de données (HTTP 403).
   - *Options d'arbitrage* : Soit passer par un pool de proxies résidentiels rotatifs légers, soit explorer un flux d'affiliation officiel (Jumia Affiliate API / Awin), soit utiliser Playwright avec profil stealth.
2. **Collecte Facebook vs Risque Termes d'Usage (TOS)** :
   - *Incertitude* : L'extraction par session connectée Playwright viole les conditions d'utilisation de Meta et subit 38,8 % d'invalidation de session.
   - *Options d'arbitrage* : Soit pérenniser le serveur d'automatisation avec régénération sécurisée de cookies, soit orienter progressivement l'acquisition de petites annonces vers le bot WhatsApp entrant Nopalou (dépôt direct consenti par les vendeurs).
3. **Hébergement des Images** :
   - Les photos Facebook hébergées sur `fbcdn` expirent. La nouvelle architecture doit intégrer un pipeline asynchrone de ré-hébergement vers Cloudinary ou un bucket S3 compatible.

---

## 5. Prochaines Actions Recommandées pour l'Agent 2

1. **Concevoir le schéma directeur de la nouvelle architecture de collecte** (`ARCHITECTURE_COLLECTE_V2.md`).
2. **Définir les contrats d'interface des extracteurs** (classe de base abstraite `BaseCollector`, gestionnaire de pagination, pipeline de normalisation).
3. **Spécifier le gestionnaire de tâches et de files d'attente** (Worker indépendant, gestion des priorités et reprise après crash).
4. **Établir le plan de migration des connecteurs existants** vers la nouvelle architecture sans rupture de service pour le comparateur en ligne.
