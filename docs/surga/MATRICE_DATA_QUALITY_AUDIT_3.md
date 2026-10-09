# MATRICE QUALITÉ DES DONNÉES & SOURCES — SURGA (AUDIT AGENT 3)

> **Document Officiel d'Audit Technique**  
> **Auteur** : Agent 3 (Données, Sources, Qualité, IA, Voix, WhatsApp)  
> **Date** : 5 Octobre 2026  
> **Environnement audité** : Node.js v20/v24, PostgreSQL 18.4 (`nopalou_db`), Express 4, Next.js 14  
> **Méthodologie** : Vérification empirique de la chaîne complète : **SOURCE → RÉCUPÉRATION → PARSING → VALIDATION → STOCKAGE → TRANSFORMATION → IA → AFFICHAGE → UTILISATEUR**

---

## 1. MATRICE COMPLÈTE DES SOURCES DE DONNÉES

| Source | Type de Donnée | Volume Dispo | Volume Récupéré | Volume Stocké | Volume Affiché | Fraîcheur Constatée | Couverture | Doublons | Source Traçable | Résilience | Statut |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **APS (Agence de Presse Sénégalaise)** | Dépêches nationales RSS | 10 | 10 | 10 | 4 à 6 | < 2 heures (temps réel) | 100% du flux | 0 doublon (URL unique) | OUI (URL canonique `aps.sn`) | PASS (timeout 5s, catch) | **PASS** |
| **Le Soleil SN** | Presse nationale RSS | 24 | 24 | 24 | 4 à 6 | < 6 heures | 100% du flux | 0 doublon (URL unique) | OUI (URL canonique `lesoleil.sn`) | PASS | **PASS** |
| **Dakaractu** | Presse privée RSS | Inconnu | 0 | 0 | 0 | Aucune | 0% | 0 | NON | FAIL (HTTP 404 permanent) | **FAIL** |
| **Seneweb** | Portail d'actualité RSS | Inconnu | 0 | 0 | 0 | Aucune | 0% | 0 | NON | FAIL (HTTP 404 permanent) | **FAIL** |
| **Le Quotidien SN** | Presse privée RSS | Inconnu | 0 | 0 | 0 | Aucune | 0% | 0 | NON | FAIL (HTTP 403 Forbidden Cloudflare) | **FAIL** |
| **Sud Quotidien** | Presse indépendante RSS | Inconnu | 0 | 0 | 0 | Aucune | 0% | 0 | NON | FAIL (DNS ENOTFOUND) | **FAIL** |
| **Google News Sénégal Éco** | Agrégateur presse éco | 23 | 23 | 23 | 4 à 6 | < 12 heures | 100% | 0 | OUI (Lien Google News) | PASS | **PASS** |
| **Google News Sénégal Tech** | Agrégateur tech/fintech | 49 | 49 | 49 | 4 à 6 | < 8 heures | 100% | 0 | OUI (Lien Google News) | PASS | **PASS** |
| **Google News SN Institutions** | Dépêches gouvernement | 53 | 53 | 53 | 4 à 6 | < 24 heures | 100% | 0 | OUI (Lien Google News) | PASS | **PASS** |
| **Kiosque des Unes (`surga_unes_presse`)** | Couvertures de quotidiens | 10 | 10 (fichiers locaux) | 10 | 10 | **DÉVIANT** : Fichiers réels datant d'août/septembre 2026 mais stockés avec `CURRENT_DATE` | 10 quotidiens | 0 | PARTIEL (Fichiers locaux statiques) | Mocks locaux résilients | **PARTIAL** |
| **Événements Sportifs (`surga_sport_events`)** | Calendriers & Scores | 3 | 3 | 3 | 3 | **STATIQUE** : 3 matchs par défaut injectés à l'init (Élim. CAN 2025, Ligue 1) | 3 matchs | 0 | NON (Hardcodé dans `SPORT_EVENEMENTS_DEFAUT`) | Mocks locaux résilients | **PARTIAL** |
| **TomTom Traffic API (Dakar)** | Corridors & Vitesse temps réel | 6 axes GPS | 6 axes sondés | 0 (cache mémoire TTL 6m) | 6 axes | < 6 minutes (quand API key présente) | 6 corridors Dakar (A1, VDN, Corniche Ouest, RN1, Patte d'Oie) | 0 | OUI (Coordonnées GPS TomTom Routing) | PASS (bascule sur modèle d'heures de pointe si hors ligne) | **PASS** |
| **Signalements Trafic Citoyens** | Alertes communautaires | NON MESURÉ | 0 en base | 0 | 0 | N/A | Table `surga_trafic_signalements` déconnectée du service | 0 | NON | FAIL (Service pointe sur `../../db` inexistant) | **FAIL** |
| **Annonces Immo Nopalou (`annonces_immo`)** | Biens immobiliers Dakar | **1 649 en base** | **0 récupéré** | 1 649 en DB | **3 fausses annonces** | Données réelles ignorées ; mocks affichés | **0,18% (3 / 1649)** | 0 | NON (Annonces démo fictives affichées) | FAIL (Service pointe sur `../../db` inexistant) | **FAIL** |
| **Concours Nationaux (`surga_concours`)** | Calendriers examens État | 10 fiches officielles | 0 en base | 0 en base | 10 fiches démo mémoire | Données de dev (sept-nov 2026) | 10 concours majeurs (ENA, Douanes, Police, etc.) | 0 | PARTIEL (Liens institutionnels déclarés) | FAIL (Service pointe sur `../../db` inexistant) | **PARTIAL** |
| **Bonnes Adresses (`surga_places`)** | Restaurants, cafés, dibiteries | 10 adresses | 0 en base | 0 en base | 10 adresses démo mémoire | Données statiques de dev | 10 adresses dakaroises | 0 | PARTIEL (Numéros WhatsApp réels) | FAIL (Service pointe sur `../../db` inexistant) | **PARTIAL** |
| **Radios FM Sénégal (`radio-service.js`)** | Flux audio direct Icecast/Shoutcast | 13 stations | 12 actives, 1 en erreur 403 | 0 (proxy direct) | 13 stations | Direct temps réel | 6 régions du Sénégal | 0 | OUI (URLs de flux directes) | PARTIEL (Oxy Jeunes 403, 12 stations OK) | **PARTIAL** |
| **Dépenses Utilisateurs (`surga_depenses`)** | Saisies utilisateur FCFA | Selon usage | Selon usage | Variable (0 initial) | Direct | Immédiat | 100% des saisies confirmées | 0 | OUI (Lié à `utilisateurs.id`) | PASS (PostgreSQL) / FAIL si WhatsApp user inconnu | **PARTIAL** |
| **Notes Utilisateurs (`surga_notes`)** | Mémos personnels | Selon usage | Selon usage | Variable (0 initial) | Direct | Immédiat | 100% des notes confirmées | 0 | OUI (Lié à `utilisateurs.id`) | PASS (PostgreSQL) / FAIL si WhatsApp user inconnu | **PARTIAL** |
| **Agenda & Rappels (`surga_agenda`)** | Événements & alertes | Selon usage | Selon usage | Variable (0 initial) | Direct | Immédiat | 100% des rappels confirmés | 0 | OUI (Lié à `utilisateurs.id`) | PASS (PostgreSQL) / FAIL si WhatsApp user inconnu | **PARTIAL** |
| **Préférences Profil (`surga_preferences`)** | Configuration modules & quartiers | 1 par user | 1 | 1 | 1 | Immédiat | Profil complet | 0 | OUI | PASS | **PASS** |

---

## 2. SYNTHÈSE STATISTIQUE DE LA MATRICE

```text
+-------------------------------------------------------------------------------+
| TOTAL DES SOURCES / SERVICES AUDITÉS                     : 21                 |
| - PASS (Opérationnel, traçable, données réelles)        : 7 (33,3 %)         |
| - PARTIAL (Fonctionnel mais dégradé, statique ou mocké)  : 8 (38,1 %)         |
| - FAIL (Rupture totale, erreur HTTP, déconnexion DB)     : 6 (28,6 %)         |
+-------------------------------------------------------------------------------+
```

---

## 3. ANALYSE CRITIQUE PAR BLOC DE DONNÉES

### 3.1 Actualités & Presse (Flux RSS)
- **Disponible** : 9 flux déclarés dans `SOURCES_DEFAUT`.
- **Récupérés avec succès** : 5 flux (APS, Le Soleil, Google News Éco, Google News Tech, Google News Institutions).
- **En échec réseau / DNS** : 4 flux (Dakaractu HTTP 404, Seneweb HTTP 404, Le Quotidien HTTP 403, Sud Quotidien DNS ENOTFOUND).
- **Volume d'articles réels injectés lors du test** : **159 articles distincts** insérés dans `surga_briefing_items`.
- **Idempotence** : 100% respectée (`ON CONFLICT (url) DO NOTHING`). La deuxième exécution immédiate a retourné `totalNouveaux: 0`.
- **Traçabilité** : Excellente pour les flux actifs (titre, date réelle, URL canonique, nom de source).
- **Problème de fond (P1)** : En l'absence d'un job cron d'ingestion planifié dans le backend Express (`backend/app.js`), la table `surga_briefing_items` reste à 0 article, ce qui active le fallback dégradé `ITEMS_SECOURS`.

### 3.2 Intégrité Temporelle des Fallbacks (`ITEMS_SECOURS` & Kiosque)
- **Fait constaté** : Lorsque la base est vide ou inaccessible, les 5 articles de secours déclarés dans `backend/services/surga/rss-collector.js` génèrent dynamiquement leur date de publication :
  ```javascript
  published_at: new Date().toISOString(),
  published_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  published_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  ```
- **Violation** : Réplique exacte du bug Nopalou `AUD-096` et violation directe de la Décision d'architecture `D21` (*« Tout contenu affiché dans le briefing quotidien Surga doit obligatoirement être rattaché à son URL source canonique et conserver son horodatage d'origine immuable »*). Un article rédigé il y a plusieurs mois est affiché à l'utilisateur comme datant de "il y a 2 heures".
- Même dérive constatée sur `kiosque-service.js` : Les Unes de presse d'août/septembre 2026 sont enregistrées avec `CURRENT_DATE`.

### 3.3 Pôle Immobilier (`immo-service.js`) : La rupture 0,18%
- **Données réelles en base** : 1 649 annonces réelles dans la table `annonces_immo`, rattachées à 8 agences certifiées.
- **Données affichées par Surga** : 3 biens fictifs hardcodés dans `BIENS_DEMO` (`immo-demo-1`, `immo-demo-2`, `immo-demo-3`).
- **Cause démontrée** : Ligne 8 de `backend/services/surga/immo-service.js` :
  ```javascript
  let pool = null;
  try { pool = require('../../db'); } catch { /* catch silencieux */ }
  ```
  Le chemin `../../db` n'existe pas (le connecteur est `../../models/db`). `pool` reste à `null` à vie. La requête SQL sur `annonces_immo` n'est jamais exécutée.

### 3.4 Concours & Bonnes Adresses (`concours-service.js`, `places-service.js`)
- Même anomalie que l'immobilier : les tables `surga_concours` et `surga_places` existent en base (créées par les migrations), mais restent à **0 ligne** parce que les services tournent sur leurs mocks mémoire `CONCOURS_NATIONAUX_SENEGAL` et `PLACES_DAKAR_DEMO` à cause du mauvais chemin `require('../../db')`.
- Conséquence : Si un administrateur ajoute ou modifie un concours ou une adresse dans la console `/admin/surga`, ces modifications ne sont jamais visibles par les utilisateurs de l'application.

### 3.5 Trafic Dakar (`trafic-service.js`)
- **API TomTom Live** : La clé est configurée et fonctionnelle. L'interrogation des corridors GPS (A1, VDN, Corniche) renvoie des temps de trajet réels et vitesses constatées en km/h.
- **Cache mémoire** : TTL de 6 minutes respecté pour ne pas exploser le quota gratuit TomTom (2 500 requêtes/jour).
- **Modèle déterministe de secours** : Heuristique par heures de pointe dakarroises bien calibrée (heures GMT/UTC, distinction entrant/sortant, dimanches fluides, TER/BRT sur voies réservées).
- **Point de rupture** : La table `surga_trafic_signalements` est déconnectée (toujours à cause du `pool = require('../../db')`). Les signalements citoyens d'accidents ou ralentissements ne sont pas persistés.
