# Registre Officiel des Arbitrages & Corrections de Contre-Expertise

```text
Document       : Registre des Décisions d'Arbitrage et Corrections Méthodologiques
Module         : audit/seo/REGISTRE_ARBITRAGES_CONTRE_EXPERTISE.md
Autorité       : Agent 7 (Auditeur Indépendant & Arbitre de la Campagne SEO)
Date           : 2026-10-10
Branche Git    : main (Vérifiée par git branch --show-current -> main)
Système Cible  : Nopalou.com (SEO, Données, Architecture, Conversions)
Application    : Obligatoire et opposable aux Agents 8, 9 et 10
```

---

## 1. Cadre et Vocation du Registre

Ce registre consigne de manière exhaustive, contradictoire et opposable les arbitrages rendus par l'**Agent 7** à l'issue de l'audit critique des travaux des Agents 0 à 6.

Chaque fiche d'arbitrage détaille :
- L'affirmation initiale ou la recommandation des agents précédents.
- La preuve matérielle obtenue par l'Agent 7 (requête SQL, sonde HTTP, inspection de code).
- Le diagnostic du biais ou de l'erreur identifiée.
- La décision souveraine d'arbitrage et la directive exécutive pour la suite de la campagne.

---

## 2. Les 12 Fiches d'Arbitrage Officielles

### Fiche ARB-01 : Volume Réel des Groupes de Requêtes Suivis en SERP
- **Affirmation Initiale (Handover Agent 6 & Spécifications)** :
  *"150 groupes stratégiques (P0) peuvent être suivis avec une fiabilité immédiate (ceux disposant d'un relevé SERP mobile gl=sn vérifié...)"*.
- **Preuve Matérielle Mesurée** :
  - Inspection de `audit/seo/ANALYSE_SERP.md` : lignes 10 et 30 consignent formellement un échantillon représentatif de **40 groupes majeurs**.
  - `BASE_REQUETES_SEO.csv` : exactement 40 clusters possèdent une position mesurée (`> 30`, `> 50`, `Top 3`). Les 960 autres groupes sont étiquetés `Non mesurée`.
- **Diagnostic** : Extrapolation injustifiée (+275 %) dans les documents de synthèse de l'Agent 6.
- **Décision d'Arbitrage** : **RECTIFICATION FORMELLE**. Le cockpit SEO (`/admin/(protected)/seo`) et tous les rapports doivent afficher **40 / 1 000 suivis activement (4,0 %)**. Interdiction formelle de prétendre que 150 groupes sont observés en session.

---

### Fiche ARB-02 : Niveau de Confiance dans la Base des 1 000 Groupes
- **Affirmation Initiale (Agent 1 & Agent 3)** :
  La colonne `niveau_confiance` de `BASE_REQUETES_SEO.csv` porte la mention `"Élevé"` sur l'intégralité des 1 000 lignes.
- **Preuve Matérielle Mesurée** :
  - Sur les 1 000 clusters, 960 n'ont pas de relevé SERP récent (`position_observee = Non mesurée`).
  - L'accès API en direct à Google Search Console et Google Ads Keyword Planner était inaccessible localement (volumes sous forme de fourchettes macro `100-1000`).
- **Diagnostic** : Sur-confiance méthodologique incompatible avec la rigueur d'un audit de niveau senior.
- **Décision d'Arbitrage** : **RÉVISION DU BARÈME**. 
  - `Élevé` : réservé aux 40 groupes audités en SERP avec URL cible existante.
  - `Moyen` : 202 groupes P0 restants disposant d'une URL cible existante et d'un stock de catalogue vérifié.
  - `Faible / En attente` : 758 groupes P1 à P3 en attente de sonde SERP et de connexion API GSC.

---

### Fiche ARB-03 : Correction du Taux d'Annonces Immobilières sans Prix (`TIT-ANO-05`)
- **Affirmation Initiale (Agent 5 - Handover & AUDIT_QUALITE_CONTENUS.md)** :
  *"TIT-ANO-05 : Absence de prix chiffré sur 67,8 % des annonces immo et 65,7 % des annonces classées."*
- **Preuve Matérielle Mesurée (PostgreSQL)** :
  ```sql
  SELECT 
    count(*) as total,
    count(*) FILTER (WHERE actif = true) as actives,
    count(*) FILTER (WHERE actif = true AND (prix IS NULL OR prix = 0)) as actives_sans_prix,
    count(*) FILTER (WHERE prix IS NULL OR prix = 0) as total_sans_prix
  FROM annonces_immo;
  ```
  Résultat : `total = 14246`, `actives = 2576`, `actives_sans_prix = 141`, `total_sans_prix = 1749`.
- **Diagnostic** : Erreur de dénominateur flagrante. L'Agent 5 a divisé `1 749` (total défectueux sur 14 246) par `2 576` (actives uniquement) : $1\,749 / 2\,576 = 67{,}89\%$.
- **Décision d'Arbitrage** : **CORRECTION STATISTIQUE IMMEDIATE**.
  - Le taux de défaut réel sur les annonces immobilières actives est de **5,47 % (141 / 2 576)**.
  - Le taux de défaut global (archives incluses) est de **12,28 % (1 749 / 14 246)**.
  - Le taux de défaut sur les annonces classées C2C est quant à lui validé à **65,66 % (4 514 / 6 875)**.

---

### Fiche ARB-04 : Requalification du Baromètre Immobilier (Prix au m²)
- **Affirmation Initiale (Agent 5 - STRATEGIE_CONTENUS.md)** :
  Proposition d'un guide pilier d'autorité : *"Baromètre Immobilier des Loyers & Prix au m² à Dakar par Quartier (2026)"*.
- **Preuve Matérielle Mesurée (PostgreSQL)** :
  ```sql
  SELECT 
    count(*) as total_actives,
    count(*) FILTER (WHERE surface_m2 IS NOT NULL AND surface_m2 > 0) as avec_surface
  FROM annonces_immo WHERE actif = true;
  ```
  Résultat : sur 2 576 annonces actives, seules **168 annonces (6,52 %)** ont un champ `surface_m2` renseigné !
- **Diagnostic** : Données de surface insuffisantes pour établir un prix au mètre carré représentatif sans risquer de diffuser des données aberrantes.
- **Décision d'Arbitrage** : **REDIRECTION ÉDITORIALE**.
  - Le guide pilier est reformulé en : *"Baromètre Officiel des Loyers Mensuels à Dakar par Quartier (2026)"*.
  - L'analyse doit reposer sur les médianes de loyers par typologie (studio, F2, F3, villa, meublé) où le taux de complétude du prix est de **94,53 %**.

---

### Fiche ARB-05 : Conditionnement Strict des Nouvelles Pages Quartiers Immo
- **Affirmation Initiale (Agent 3 - MAPPING_REQUETES_PAGES.csv)** :
  Recommandation de création de 44 sous-hubs de quartier (ex: `/immo/location-studio-dakar/diamniadio`, `/immo/location-chambre-dakar/mermoz`).
- **Preuve Matérielle Mesurée (PostgreSQL)** :
  L'analyse du stock montre que **62,4 % (356 sur 570)** des combinaisons actives `transaction + type_bien + quartier` ont **moins de 3 annonces**. Les studios et chambres hors Almadies et Mermoz tombent fréquemment à 0 ou 1 annonce active.
- **Diagnostic** : Risque sévère de génération de "Doorway Pages" (pages satellites creuses pénalisées par l'algorithme Google Panda / Helpful Content).
- **Décision d'Arbitrage** : **VERROU D'INVENTAIRE MINIMAL**.
  - Règle absolue : Aucune page de quartier ne peut être publiée ou déclarée indexable si elle ne rassemble pas au moins **5 annonces actives réelles avec photos et prix vérifiés**.
  - En dessous de ce seuil, l'URL doit renvoyer canoniquement ou par redirection vers le hub parent départemental (`/immo/location-appartement-dakar`).

---

### Fiche ARB-06 : Résolution de l'Anomalie Critique Soft-404 (`CORR-01`)
- **Affirmation Initiale (Agent 0 & Agent 4)** :
  Les fiches produits, immo, annonces et boutiques inexistantes renvoient un statut HTTP 200 avec `<title>Page introuvable</title>` (Soft-404).
- **Preuve Matérielle Mesurée** :
  Test HTTP en direct : `https://nopalou.com/produit/00000000-...-inexistant` renvoie **HTTP 200 OK** avec balise `noindex` et 110 Ko de HTML.
- **Diagnostic** : Bien que `notFound()` soit présent dans le composant, l'ordonnancement de `generateMetadata` et le streaming serveur flush les en-têtes HTTP avant que l'erreur 404 ne soit posée.
- **Décision d'Arbitrage** : **CONFIRMATION P0**. Traitement prioritaire obligatoire avant toute campagne de maillage ou d'indexation massive.

---

### Fiche ARB-07 : Résolution de la Cannibalisation B2B `/creer-boutique`
- **Affirmation Initiale (Agent 0 & Agent 4)** :
  Cannibalisation active entre `/creer-boutique` (wizard) et `/creer-boutique-en-ligne` (landing pilier).
- **Preuve Matérielle Mesurée** :
  - Les deux URLs sont en ligne, renvoient HTTP 200, possèdent une balise canonical auto-référente (`self-canonical`) et ciblent la même requête `créer boutique en ligne sénégal`.
- **Diagnostic** : Dilution du PageRank et division de la pertinence sémantique sur la requête la plus monétisable du site.
- **Décision d'Arbitrage** : **SANCTUARISATION CANONIQUE**.
  - `/creer-boutique-en-ligne` est confirmée comme l'unique URL d'atterrissage SEO canonique indexable.
  - `/creer-boutique` doit recevoir une balise `<meta name="robots" content="noindex, follow">` dès son layout ou pointer son canonical vers `/creer-boutique-en-ligne`.

---

### Fiche ARB-08 : Épuration Immédiate de `/surga` dans le Sitemap XML Nopalou
- **Affirmation Initiale (Agent 4 - `CORR-08`)** :
  Le sitemap XML de Nopalou (`sitemap.ts`) contient `/surga` alors que l'URL redirige vers `surga.nopalou.com`.
- **Preuve Matérielle Mesurée** :
  - `frontend-next/src/app/sitemap.ts` ligne 22 : `{ url: '${BASE}/surga', changeFrequency: 'daily', priority: 0.95 }`.
  - Sonde HTTP : `https://nopalou.com/surga` renvoie un code **HTTP 307 Temporary Redirect** vers `https://surga.nopalou.com/surga`.
- **Diagnostic** : Double faute : infraction aux consignes Google Search Central (jamais d'URL redirigée dans un sitemap) et rupture de la règle fondamentale AGENTS.md de démarcation NOPALOU vs SURGA.
- **Décision d'Arbitrage** : **RETRAIT OBLIGATOIRE IMMÉDIAT**. La ligne 22 de `sitemap.ts` doit être supprimée lors de la phase de correction.

---

### Fiche ARB-09 : Rectification des Redirections Courtes `/b/[slug]`
- **Affirmation Initiale (Agent 4 - `CORR-07`)** :
  Les URLs courtes marchandes `/b/[slug]` renvoient un code HTTP 307 au lieu de 301.
- **Preuve Matérielle Mesurée** :
  Sonde HTTP en direct : `https://nopalou.com/b/samaskin` renvoie **HTTP 307**.
- **Diagnostic** : Le code HTTP 307 indique une redirection temporaire, empêchant Googlebot de transmettre le jus de lien (PageRank) vers la vitrine canonique `/boutiques/samaskin`.
- **Décision d'Arbitrage** : **PASSAGE EN HTTP 301 PERMANENT**. Modifier `frontend-next/src/app/b/[slug]/route.ts` pour émettre un statut HTTP 301.

---

### Fiche ARB-10 : Biais Événementiel `purchase` GA4 dans `useCommander.ts`
- **Affirmation Initiale (Agent 6 - `MES-ANO-02`)** :
  L'événement e-commerce GA4 `purchase` est déclenché prématurément lors de commandes à la livraison.
- **Preuve Matérielle Mesurée** :
  `frontend-next/src/app/boutiques/[id]/commander/useCommander.ts` lignes 327-333 : dès la validation du formulaire POST `/commandes/express`, `window.gtag('event', 'purchase', { value: total, currency: 'XOF' })` est exécuté même si `paiement === 'livraison'` ou `paiement === 'credit'`.
- **Diagnostic** : Chiffre d'affaires GA4 fortement surestimé en cas de refus de colis ou d'annulation à la livraison.
- **Décision d'Arbitrage** : **SCISSION DES ÉVÉNEMENTS**.
  - Pour les paiements à la livraison : déclencher `gtag('event', 'generate_lead')` ou `order_placed_cod`.
  - Réserver `gtag('event', 'purchase')` aux paiements confirmés en ligne (Wave direct, Orange Money ou Stripe).

---

### Fiche ARB-11 : Rupture d'Attribution Commerciale dans PostgreSQL
- **Affirmation Initiale (Agent 6 - `MES-ANO-03`)** :
  La table `abonnements` ne stocke aucun canal d'acquisition ou paramètre UTM.
- **Preuve Matérielle Mesurée** :
  - Schema relationnel de la table `abonnements` vérifié en session : colonnes `id`, `utilisateur_id`, `plan`, `statut`, `prix_mensuel`, `debut`, `fin`, `commande_ref`, `created_at`, `is_trial`.
  - Jointure testée : zéro correspondance entre `abonnements.commande_ref` et `funnel_events.ref`.
- **Diagnostic** : Impossibilité technique actuelle de calculer le retour sur investissement (ROI) ou le coût d'acquisition client (CAC) du trafic SEO organique.
- **Décision d'Arbitrage** : **ÉVOLUTION DU SCHÉMA SQL**. Prévoir l'ajout des colonnes `utm_source`, `utm_campaign`, `referer` et `funnel_session_id` dans la table `abonnements`.

---

### Fiche ARB-12 : Séparation Stricte Essais Gratuits (101) vs Abonnés Payants (7)
- **Affirmation Initiale (Consignes & Handover Agent 6)** :
  Mention de 108 abonnements actifs en base.
- **Preuve Matérielle Mesurée (PostgreSQL)** :
  ```sql
  SELECT plan, is_trial, statut, count(*), sum(prix_mensuel) as mrr
  FROM abonnements GROUP BY plan, is_trial, statut;
  ```
  Résultat :
  - `is_trial = true` (Essais 30 jours actifs) : **101 comptes** (74 découverte, 14 pro, 13 business).
  - `is_trial = false` (Abonnements payants réels actifs) : **7 comptes** (7 business payants, MRR = 80 000 FCFA).
- **Diagnostic** : Risque critique de confusion entre un prospect en période d'essai et un client récurrent payant.
- **Décision d'Arbitrage** : **DÉFINITION NORMATIVE STRICTE**.
  - Ne **JAMAIS** qualifier un compte en essai (`is_trial = true`) de "client payant" ou de "souscription payante".
  - Tout indicateur de conversion commerciale SEO doit distinguer :
    1. *Démarrage d'essai gratuit* (Micro-conversion d'acquisition).
    2. *Conversion en abonnement payant Wave/OM au 31e jour* (Macro-conversion de monétisation).
