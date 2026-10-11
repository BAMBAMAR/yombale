# SUPERVISION DU SCRAPING ET CONTRÔLE DES FLUX — NOPALOU V2

**Auteur** : Agent 3/3 (Audit Final Indépendant du Scraping)  
**Date de mise en service** : 11 Octobre 2026  
**Module d'administration** : `/admin/scraping`  
**API Backend** : `/api/scraper/runs`, `/api/scraper/v2/sources`, `/api/scraper/v2/run/:sourceId`

---

## 1. CONTEXTE ET NÉCESSITÉ

Avant l'intervention de l'Agent 3, la supervision du scraping sur Nopalou souffrait de plusieurs lacunes majeures :
1. **Échec silencieux d'enregistrement** : La table `scraping_runs` rejetait toutes les écritures depuis le 02/10/2026 en raison de colonnes manquantes dans le schéma de base de données.
2. **Absence d'interface unifiée** : Les administrateurs ne disposaient d'aucune interface dédiée pour visualiser l'état de santé des sources, le volume d'offres générées ou relancer un connecteur en cas de panne.
3. **Absence de distinction entre sources en panne et sources fonctionnelles** : Les métriques confondaient parfois les annonces inactives et les offres commerciales fraîches.

L'Agent 3 a conçu et déployé une suite de supervision complète, intégrée nativement dans le panneau d'administration existant sans créer de dépendance externe superflue ni ajouter de services payants.

---

## 2. ARCHITECTURE DE LA SUPERVISION

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PANNEAU D'ADMINISTRATION                        │
│                Route Next.js : /admin/scraping                         │
│  - 4 Cartes KPIs (Total Offres, Fraîcheur 24h, Runs 7j, Taux Succès)  │
│  - Tableau Registre V2 (9 Sources, Méthode, Statut BDD, Action Run)    │
│  - Tableau Historique des Runs (Filtres Source & Statut, Badges)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Requêtes HTTP (JWT Admin)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API REST BACKEND EXPRESS                        │
│               Fichier : backend/routes/scraper.js                      │
│  - GET  /api/scraper/runs          -> Historique, filtres, KPIs agrégés │
│  - GET  /api/scraper/v2/sources    -> Registre unifié + métriques BDD  │
│  - POST /api/scraper/v2/run/:id    -> Déclenchement manuel asynchrone  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────┐ ┌─────────────────────────────────┐
│     BASE DE DONNÉES POSTGRESQL     │ │       REGISTRE LOGICIEL V2      │
│     Table : scraping_runs          │ │ SourcesRegistry.js              │
│     Table : offres                 │ │ BaseCollector / Adaptateurs     │
│     Table : marchands              │ │ Détection pannes (evaluerStatut)│
└────────────────────────────────────┘ └─────────────────────────────────┘
```

---

## 3. DÉFINITION STABLE DES MÉTRIQUES ET DÉNOMINATEURS

Pour éviter toute ambiguïté statistique, chaque métrique affichée respecte une définition stricte et un dénominateur vérifiable :

| Métrique | Dénominateur / Formule | Provenance | Interprétation |
| :--- | :--- | :--- | :--- |
| **Total Offres Catalogue** | `COUNT(*) FROM offres WHERE statut = 'actif'` | Table `offres` | Offres commerciales actuellement indexées et interrogeables par les acheteurs. |
| **Offres Fraîches (< 24h)** | `COUNT(*) FROM offres WHERE statut = 'actif' AND derniere_verif >= NOW() - INTERVAL '24 hours'` | Table `offres` | Mesure de fraîcheur absolue : offres confirmées en stock au cours du dernier cycle journalier. |
| **Runs Exécutés (7j)** | `COUNT(*) FROM scraping_runs WHERE date_debut >= NOW() - INTERVAL '7 days'` | Table `scraping_runs` | Activité globale du moteur de collecte sur la semaine écoulée. |
| **Taux de Succès Runs** | `(COUNT(statut = 'ok') / COUNT(*)) * 100` sur 7 jours | Table `scraping_runs` | Indicateur de stabilité technique des connecteurs actifs. |
| **Taux de Couverture Catégories** | `(categories_avec_articles / categories_cibles) * 100` | Run JSONB | Pourcentage de rayons marchands ayant produit au moins un article lors du run. |
| **Taux d'Erreurs HTTP** | `(requetes_erreurs / requetes_totales) * 100` | Run JSONB | Détecteur précoce de blocage IP, rate-limiting ou liens morts 404. |
| **Décroissance de Volume** | `items_extraits / mediane_historique_source` | Run JSONB | Alerte si le volume collecté chute de plus de 50% par rapport à l'historique de la source. |

---

## 4. CONTRATS DES ROUTES D'API DE SUPERVISION

### 4.1. `GET /api/scraper/runs`
- **Authentification** : Administrateur (`requireAuth`, `requireAdmin`)
- **Paramètres de requête (Query params)** :
  * `limit` (optionnel, défaut : 50) : Nombre de runs à retourner.
  * `offset` (optionnel, défaut : 0) : Pagination.
  * `source` (optionnel) : Filtrer par identifiant de source (ex: `decathlon`, `soumari`).
  * `statut` (optionnel) : Filtrer par statut (`ok`, `degrade`, `echec`).
- **Exemple de Réponse JSON** :
```json
{
  "success": true,
  "pagination": { "total": 3, "limit": 50, "offset": 0 },
  "filtres": { "source": null, "statut": null },
  "kpis": {
    "total_offres": 31993,
    "offres_fraiches_24h": 24,
    "runs_7j": 2,
    "taux_succes_7j": 100
  },
  "runs": [
    {
      "id": 79,
      "source": "decathlon",
      "date_debut": "2026-10-10T23:55:00.000Z",
      "date_fin": "2026-10-10T23:55:18.000Z",
      "statut": "ok",
      "items_extraits": 24,
      "items_inseres": 24,
      "items_rejetes": 0,
      "erreurs_nb": 0,
      "duree_sec": 18,
      "couverture": 100
    }
  ]
}
```

### 4.2. `GET /api/scraper/v2/sources`
- **Authentification** : Administrateur (`requireAuth`, `requireAdmin`)
- **Rôle** : Retourne la liste unifiée des 9 connecteurs V2 déclarés dans `SourcesRegistry` avec leur statut live en base de données (nombre d'offres en stock, date de dernière synchronisation, statut du marchand).
- **Exemple d'Élément** :
```json
{
  "id": "decathlon",
  "nom": "Decathlon Sénégal",
  "systeme": "produits",
  "type_methode": "html_cheerio",
  "baseUrl": "https://www.decathlon.sn",
  "nb_offres": 330,
  "derniere_sync": "2026-10-10T23:55:18.000Z",
  "statut_sync": "actif",
  "est_active": true
}
```

### 4.3. `POST /api/scraper/v2/run/:sourceId`
- **Authentification** : Administrateur (`requireAuth`, `requireAdmin`)
- **Rôle** : Déclenche l'exécution asynchrone immédiate d'une source spécifique (ex: `soumari`, `decathlon`, `keur_immo`).
- **Comportement** : Lance la tâche en arrière-plan sans bloquer la requête HTTP et renvoie un accusé de réception immédiat avec le nom de la tâche.
- **Réponse HTTP** : `202 Accepted` : `{ "success": true, "message": "Collecte lancée en arrière-plan", "sourceId": "decathlon" }`.

---

## 5. RÈGLES D'ALERTES ET DÉTECTION PRÉCOCE DES PANNES

Le moteur V2 applique un modèle déterministe d'évaluation de la qualité (`evaluerStatut` dans `backend/lib/scrapingRun.js`) exécuté à la fin de chaque run :

### Matrice des Seuils et Statuts Automatiques

| Événement Détecté | Seuil Déclenchant | Statut Résultant | Action Système |
| :--- | :--- | :---: | :--- |
| **Extraction Zéro Article** | `itemsExtraits === 0` | **`echec`** | Notification d'erreur critique, blocage de la mise à jour `derniere_sync`. |
| **Taux d'Échec HTTP Élevé** | `(erreurs / total_requetes) > 0.10` (> 10%) | **`degrade`** | Journalisation du code HTTP (403, 429, 503), consignation dans les motifs d'alerte. |
| **Couverture Catégories Incomplète** | `(categories_ok / categories_total) < 0.90` (< 90%) | **`degrade`** | Consignation de la catégorie défaillante sans interrompre les autres. |
| **Chute de Volume Anormale** | `itemsExtraits < 0.50 * mediane_historique` (< 50%) | **`degrade`** | Alerte de régression sélecteur ou fin prématurée de pagination. |
| **Collecte Conforme** | 0 erreur bloquante, couverture ≥ 90%, volume normal | **`ok`** | Validation du run, mise à jour de `marchands.derniere_sync`. |

### Protection contre les Fausses Alertes et Purges Abusives
- **Règle Anti-Destockage AUD-188** : La tâche de purge nocturne (`destockerOffresObsoletes`) vérifie systématiquement que le marchand a été synchronisé avec succès au cours des 7 derniers jours (`m.derniere_sync >= NOW() - INTERVAL '7 days'`). Si un collecteur échoue ou est désactivé temporairement, son stock existant reste intact sur Nopalou au lieu d'être supprimé.

---

## 6. GUIDE D'EXPLOITATION ADMINISTRATEUR

L'accès à l'interface se fait via le panneau d'administration Nopalou :
**URL** : `https://nopalou.com/admin/scraping` (ou en local : `http://localhost:3000/admin/scraping`).

### Procédure lors d'un Échec de Collecte (`statut = 'echec'`)
1. Se connecter à l'espace administration `/admin/scraping`.
2. Consulter le tableau **Historique des Collectes** et repérer la ligne marquée du badge rouge `echec`.
3. Noter la source concernée et le motif consigné dans la colonne Détails.
4. Si le problème provient d'un réseau temporaire ou d'un redémarrage serveur, cliquer sur le bouton **Relancer** dans le tableau Registre V2.
5. Si l'échec persiste, inspecter les sélecteurs du site source dans le connecteur dédié (`backend/services/collecte/<Source>Collector.js`).

### Procédure de Vérification Hebdomadaire
1. Vérifier que le **Taux de Succès Runs** reste supérieur à **95%**.
2. Vérifier que la métrique **Offres Fraîches (< 24h)** progresse de manière cohérente après les cycles nocturnes.
3. Vérifier qu'aucune source active ne présente de `derniere_sync` supérieure à 48 heures.
