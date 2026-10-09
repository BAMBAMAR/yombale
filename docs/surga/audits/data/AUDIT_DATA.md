# RAPPORT TECHNIQUE D'AUDIT — FIABILITÉ ET EXACTITUDE DES DONNÉES SURGA

Date : 2026-10-09  
Version : 1.0  
Branche : `feature/surga`  
Auteur : Antigravity — Pair Programming & Senior Data Engineer  

---

## 1. Résumé Exécutif

L'audit technique de Surga a été conduit selon une méthodologie strictement empirique et contradictoire, sans aucune supposition préalable. L'analyse des 13 modules de données dynamiques et externes révèle une situation à deux visages :

1. **Modules Exemplaires (Conformes aux Directives D43/D53/D57/D65/D74)** :
   - **Météo & Qualité de l'air** (`sources-externes.js`, `meteo-service.js`) : Données temps réel sourcées auprès de **MET Norway** (CC BY 4.0), horodatées à la minute, avec indicateur `non_actualise` si la source tarde. En l'absence de clé pour Open-Meteo, les champs de marée et d'air retournent honnêtement `null` plutôt que des valeurs simulées.
   - **Sport** (`sport-service.js`) : Scoreboards live alimentés directement par l'API **ESPN**. La Ligue 1 sénégalaise est désactivée proprement en l'absence de clé TheSportsDB, sans générer de faux scores.
   - **Trafic routier** (`trafic-service.js`) : Philosophie intègre interdisant la simulation de temps de trajet si les flux Google Maps ne répondent pas (retourne `indisponible` au lieu d'une fausse fluidité).

2. **Modules en Défaut Critique de Fiabilité (Données Hardcodées, Inventées ou Périmées)** :
   - **Concours & Examens Nationaux** (`concours-service.js`) : **Anomalie systémique majeure**. Le catalogue de 22 concours repose sur un tableau codé en dur sans aucun scraper ni flux officiel. Les dates sont pour la plupart arbitraires ou périmées (cas CESTI clos en septembre 2026 mais affiché ouvert jusqu'en novembre), 100% des statuts sont bloqués à `'ouvert'`, des pièces justificatives ont été purement et simplement hallucineés (ex: fausse lettre de motivation manuscrite pour le CESTI) et les conditions d'éligibilité ont été écrasées par un entier unique (`age_max: 27`).
   - **Démarches Administratives** (`demarches-service.js`) : **Blocage fonctionnel total**. Les 20 démarches sont verrouillées au statut `'BROUILLON'` en base, rendant l'API publique totalement vide (`total: 0`). De plus, la date de vérification affichée est l'horodatage d'exécution du seed SQL.
   - **Trafic — Signalements Usagers** : Inopérant en production suite à une colonne SQL manquante (`statut`) dans la table `surga_trafic_signalements`.
   - **Kiosque des Unes** : 18 Unes sur 50 sont affublées du titre générique "Journal N°33" à "Journal N°50" par manque de correspondance dans la table locale.

---

## 2. Cartographie de la Chaîne de Données par Module

```
[SOURCE PRIMAIRE]
       │
       ▼
[COLLECTE (Scraping / RSS / API / Import)]
       │
       ▼
[EXTRACTION & PARSING]
       │
       ▼
[NORMALISATION & NETTOYAGE]
       │
       ▼
[STOCKAGE POSTGRESQL]
       │
       ▼
[SERVICE & LOGIQUE MÉTIER]
       │
       ▼
[ROUTE API REST]
       │
       ▼
[FRONTEND NEXT.JS / PWA]
```

### Module 1 : Concours & Examens Nationaux
- **Source** : Aucune source connectée. Aucune requête HTTP n'est exécutée vers `cesti.ucad.sn`, `ena.sn`, `officedubac.sn` ou le Journal Officiel.
- **Collecte** : Nulle. Données écrites à la main dans le fichier code `backend/services/surga/concours-service.js`.
- **Extraction** : Nulle.
- **Normalisation** : Aplatissement destructeur des conditions (âge unique, date unique).
- **Stockage** : Table `surga_concours`. Écrasée à chaque initialisation par `assurerConcoursInitiaux()` via `ON CONFLICT (id) DO UPDATE`.
- **API** : `/api/surga/concours`. Calcule un faux compte à rebours de clôture via `calculerEcheances()`.
- **Frontend** : `SurgaConcoursCard.tsx` et `SurgaConcoursDetailModal.tsx`. Affiche "Calendrier officiel des étapes" et "X jours avant la clôture".
- **Verdict** : **Défaillance complète de fiabilité**.

### Module 2 : Démarches Administratives
- **Source** : Portail `e-senegal.sn`.
- **Collecte** : Données rédigées manuellement dans `DEMARCHES_INITIALES`.
- **Stockage** : Table `surga_demarches` avec statut forcé `'BROUILLON'`.
- **API** : `/api/surga/demarches` filtre sur `statut = 'PUBLIE'`.
- **Frontend** : Reçoit un tableau vide `[]`.
- **Verdict** : **Non fonctionnel en production**.

### Module 3 : Météo, Marées & Qualité de l'Air
- **Source** : API MET Norway (`api.met.no/weatherapi/locationforecast/2.0`), API Open-Meteo.
- **Collecte** : Axios avec User-Agent identifié et timeout strict de 6s.
- **Extraction** : Fonctions pures `interpreterMetNo()`, `interpreterMaree()`, `interpreterQualiteAir()`.
- **Normalisation** : Codes de symboles météo standardisés (`soleil`, `nuageux`, `pluie`...), conversion UTC vers heure de Dakar.
- **Stockage** : Cache mémoire avec TTL de 20 minutes (`cacheMeteo`).
- **API** : `/api/surga/meteo`.
- **Frontend** : `SurgaMeteoHero.tsx`.
- **Verdict** : **Excellent et intègre**. Respecte la règle d'or : si pas de source, renvoie `null` sans simuler.

### Module 4 : Sport
- **Source** : API ESPN Live Scoreboards (`site.api.espn.com`).
- **Collecte** : Axios vers flux ESPN pour Ligue des Champions, Premier League, LaLiga, etc.
- **Extraction** : `normaliserEvenementESPN()` extrait scores, logos, minutes et diffuseurs.
- **API** : `/api/surga/sport`.
- **Verdict** : **Conforme et fiable**.

### Module 5 : Presse & Flux d'Actualité
- **Source** : 12 flux RSS (APS, Seneweb, Le Soleil, PressAfrik, SeneNews, Leral, Google News).
- **Collecte** : `rss-collector.js`, requêtes HTTP périodiques.
- **Extraction** : XML parser Cheerio.
- **Normalisation** : `nettoyerResume()` tronque proprement à 180 caractères sans balises HTML. `classerRubriquePresse()` catégorise par mots-clés.
- **Stockage** : Table `surga_briefing_items` et mémoire.
- **Verdict** : **Robuste et traçable**. Chaque article conserve son URL source d'origine.

### Module 6 : Kiosque des Unes
- **Source** : ProjetBI (`projetbi.org/press.json` et local `LE-PROJET`).
- **Collecte** : Téléchargement du JSON et copie locale des fichiers WebP.
- **Extraction** : Titres et dates.
- **Stockage** : Table `surga_unes_presse`.
- **Défaut constaté** : Au-delà du 32e journal, substitution par des libellés artificiels "Journal N°X" et fallback sur date du jour si date absente.
- **Verdict** : **Partiellement fiable**.

### Module 7 : Trafic Routier Dakar
- **Source** : Google Routes API (mesures réelles) + signalements citoyens.
- **Collecte** : `trafic-mesures.js` interroge Google Routes API.
- **Stockage** : `surga_trafic_signalements`.
- **Défaut constaté** : Erreur SQL `column "statut" does not exist` qui neutralise les signalements citoyens.
- **Verdict** : **Dégradé par un défaut de schéma SQL**.

---

## 3. Analyse Détaillée des Données Inventées ou Déduites

### 3.1. Le Phénomène des Dates Inventées
Dans `concours-service.js`, l'auteur initial du code a voulu remplir à tout prix les champs obligatoires du schéma SQL (`date_cloture`, `date_epreuves`, `date_resultats`). Ne disposant pas des arrêtés ministériels récents pour chacun des 22 concours, il a **inventé un calendrier linéaire fictif** pour chaque concours :
- Inscription ouverte le 01/09 ou 01/10
- Clôture fin octobre ou novembre
- Épreuves fin novembre ou décembre
- Résultats en janvier

Cette pratique viole le principe fondamental : **Une valeur inconnue doit être signalée comme "Non communiquée par l'organisme officiel", et jamais inventée.**

### 3.2. L'Hallucination de Pièces Administratives
Pour le concours du CESTI, Surga liste la pièce suivante :
> *« Lettre de motivation manuscrite détaillant le projet journalistique »*

Après consultation du règlement officiel d'admission du CESTI/UCAD, il s'avère qu'aucune lettre de motivation n'est requise pour le concours d'entrée en Licence 1 (presse écrite, radio, TV). Cette invention provient vraisemblablement d'une analogie erronée avec des écoles de journalisme françaises (ex: ESJ Lille, CFJ Paris) réinjectée sans contrôle dans les données sénégalaises.

### 3.3. L'Écrasement des Conditions Différenciées
La structure relationnelle actuelle de `surga_concours` utilise des colonnes scalaires simples :
- `age_max: INTEGER`
- `niveau_requis: VARCHAR`

Or, dans les concours de la Fonction Publique et des Grandes Écoles du Sénégal :
- Les conditions d'âge dépendent du corps, du grade ou du statut (candidat direct vs candidat professionnel).
- Le CESTI fixe la limite d'âge à 24 ans pour les bacheliers et aucune limite pour les professionnels.
- L'ENA fixe la limite à 33 ans pour le cycle direct, mais à 40 ou 45 ans pour le cycle professionnel.
- Les Douanes fixent des âges différents selon qu'il s'agit du corps des Préposés (26 ans) ou des Contrôleurs (28 ans).

En contraignant ces données complexes dans une colonne scalaire unique, Surga commet une **distorsion juridique et administrative grave**.

---

## 4. Évaluation des Niveaux de Confiance par Critère

| Critère d'Évaluation | Score | Justification |
|:---|:---:|:---|
| **Exactitude des données factuelles** | **4 / 10** | Météo et Sport excellents ; Concours et Kiosque affectés par des données fausses ou fictives. |
| **Fraîcheur des informations** | **3 / 10** | Les concours affichent des sessions terminées comme ouvertes ; démarches avec fausses dates de vérification. |
| **Complétude des conditions** | **3 / 10** | Conditions complexes écrasées en scalaires uniques sans gestion des régimes dérogatoires. |
| **Traçabilité de la chaîne** | **5 / 10** | Liens officiels présents dans les concours mais les données affichées ne proviennent pas de ces liens. Presse très bien tracée. |
| **Robustesse technique** | **6 / 10** | Crash SQL sur le trafic par colonne manquante ; API démarches renvoyant 0 résultat par statut mal synchronisé. |
| **Cohérence DB → API → Frontend** | **5 / 10** | Divergences entre camelCase / snake_case ; labels frontend exagérant le niveau de certitude ("officiel"). |
| **SCORE GLOBAL DE FIABILITÉ** | **4.3 / 10** | **INSUFFISANT POUR LA PRODUCTION** |

---

## 5. Hiérarchie de Confiance des Sources à Instaurer

Pour éliminer définitivement ces anomalies, Surga doit respecter une **hiérarchie stricte d'autorité des sources** :

$$\text{Source Officielle Primaire (Arrêté ministériel, JORS, Page officielle de l'école)} > \text{Organisme Institutionnel (UCAD, DEXCO, APIX)} > \text{Média Public Officiel (APS, Le Soleil)} > \text{Agrégateur Tiers} > \text{Modèle / IA}$$

### Règle Impérative de Traitement des Données Inconnues
Si une source officielle ne communique pas la date des épreuves ou l'âge limite :
- **INTERDICTION STRICTE** de supposer ou d'inventer une valeur.
- Le champ doit valoir `null` ou être marqué `NON_COMMUNIQUE`.
- L'interface doit afficher explicitement : *« Date non encore communiquée par l'organisme officiel »*.
