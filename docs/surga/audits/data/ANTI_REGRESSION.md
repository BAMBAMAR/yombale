# STRATÉGIE ET PROTOCOLE ANTI-RÉGRESSION — DONNÉES SURGA

Ce document formalise la batterie de tests et les garde-fous techniques pour garantir qu'aucune régression fonctionnelle ou altération de données n'est introduite lors des phases de correction et de déploiement de Surga.

---

## 1. Périmètre des Tests Anti-Régression

La campagne anti-régression vérifie quatre dimensions fondamentales :

```
       ┌─────────────────────────────────────────────────────┐
       │              CAMPAGNE ANTI-RÉGRESSION               │
       └──────────────────────────┬──────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  1. DONNÉES      │    │  2. FLUX & APIS  │    │  3. ÉTANCHÉITÉ   │
│  - Exactitude    │    │  - Latence       │    │  - Zéro impact   │
│  - Non-invention │    │  - Résilience    │    │    Nopalou POS   │
│  - Fraîcheur     │    │  - Statuts HTTP  │    │  - Zéro impact   │
│  - Conditions    │    │  - Format JSON   │    │    Marketplace   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 2. Matrice des Cas de Test Automatisables

| Réf Test | Module | Description du Test | Critère de Succès Strict |
|:---|:---|:---|:---|
| **TST-DAT-01** | Concours | Vérification du statut du CESTI 2026 | `statut !== 'ouvert'`, `joursRestants <= 0`, aucune lettre de motivation dans la liste des pièces. |
| **TST-DAT-02** | Concours | Vérification des 22 concours du catalogue | Aucun concours ne doit avoir une date d'épreuves antérieure à sa date de clôture. Les dates doivent être cohérentes ou nulles. |
| **TST-DAT-03** | Concours | Idempotence de la base de données | Un redémarrage du service ne doit pas écraser une valeur administrée en DB. |
| **TST-DAT-04** | Démarches | Consultation publique des démarches | `GET /api/surga/demarches` doit retourner au moins 20 démarches valides au statut `PUBLIE`. |
| **TST-DAT-05** | Démarches | Zéro hallucination sur recherche inconnue | Une recherche pour un terme absurde (ex: "permis spatial") renvoie `fiches: []`, `non_couvert: true` et le lien vers `e-senegal.sn`. |
| **TST-DAT-06** | Trafic | Lecture des signalements citoyens | L'interrogation de `getEtatTraficComplet()` ne doit lever aucune exception SQL et doit tolérer les tables sans signalements récents. |
| **TST-DAT-07** | Météo | Météo sans clé payante | Si la clé Open-Meteo manque, `maree: null` et `qualite_air: null` sans invention ni blocage de la température MET Norway. |
| **TST-DAT-08** | Sport | Matchs en direct | Le service renvoie les vrais matchs ESPN sans générer de faux scores statiques pour la Ligue 1 locale. |
| **TST-DAT-09** | Kiosque | Titres des Unes | 100% des Unes retournées doivent posséder un nom de publication réel (aucun libellé "Journal N°X"). |
| **TST-DAT-10** | Étanchéité | Cloisonnement Nopalou | Aucune modification apportée au backend ou à la DB de Surga ne doit modifier les tables `boutiques`, `commandes_boutique`, `produits` ni la caisse POS. |

---

## 3. Script d'Exécution Automatisé (`scripts/audit/data/test-anti-regression.js`)

Un script d'assertion Jest / Node.js standardisé sera exécuté avant et après chaque livraison.
Ce script valide :
1. La connectivité de la chaîne complète (DB, API, services).
2. L'absence de régressions sur les cas de référence de `REGRESSION_DATASET.md`.
3. La non-régression des temps de réponse (< 100ms pour les concours en mémoire / cache).

---

## 4. Critères de Sortie et d'Acceptation Définitive

Pour déclarer la campagne de correction terminée :
- [ ] 100% des tests de `TST-DAT-01` à `TST-DAT-10` doivent être validés en statut `PASS`.
- [ ] Les 11 anomalies de `ANOMALIES.md` doivent être vérifiées et clôturées avec preuve avant / après.
- [ ] Le score de confiance global de l'audit doit passer de **4.3 / 10** à au moins **8.5 / 10**.
- [ ] Aucun push Git n'est exécuté sans accord explicite de l'utilisateur (Règle d'or du projet).
