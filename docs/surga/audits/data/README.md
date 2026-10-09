# AUDIT DATA SURGA — FIABILITÉ, EXACTITUDE ET ANTI-RÉGRESSION

## Contexte & Mandat

Cet audit technique approfondi a été mandaté pour évaluer de manière exhaustive et sur preuves concrètes la chaîne de fiabilité des données présentées par **SURGA** (Assistant personnel de poche sénégalais).

### Problème Fondamental Traité
> **« Une donnée peut être présentée dans Surga sous une forme très propre, crédible et soignée tout en étant fausse, incomplète, périmée, mal interprétée ou insuffisamment sourcée. »**

L'objectif est d'auditer l'intégralité du pipeline :
$$\text{SOURCE} \longrightarrow \text{COLLECTE} \longrightarrow \text{EXTRACTION} \longrightarrow \text{INTERPRÉTATION} \longrightarrow \text{NORMALISATION} \longrightarrow \text{STOCKAGE (DB)} \longrightarrow \text{API} \longrightarrow \text{FRONTEND}$$

---

## 1. Périmètre de l'Audit

L'audit couvre les **13 modules de données externes ou dynamiques** de Surga :

| N° | Module | Fichiers Backend Clés | Sources Prétendues / Réelles |
|:---|:---|:---|:---|
| 1 | **Concours & Examens Nationaux** | `backend/services/surga/concours-service.js`, `backend/routes/surga/concours.js` | Arrêtés ministériels, sites d'écoles (`cesti.ucad.sn`, `ena.sn`...) |
| 2 | **Démarches Administratives** | `backend/services/surga/demarches-service.js`, `backend/routes/surga/demarches.js` | Portail officiel `e-senegal.sn` |
| 3 | **Météo, Marées & Qualité de l'Air** | `backend/services/surga/meteo-service.js`, `backend/services/surga/sources-externes.js` | MET Norway, Open-Meteo Marine, Open-Meteo CAMS |
| 4 | **Sport & Ligue 1 du Sénégal** | `backend/services/surga/sport-service.js`, `backend/services/surga/sources-externes.js` | ESPN API, TheSportsDB |
| 5 | **Presse & Flux d'Actualité** | `backend/services/surga/rss-collector.js`, `backend/routes/surga/presse.js` | 12 flux RSS presse sénégalaise (APS, Seneweb, Le Soleil...) |
| 6 | **Kiosque des Unes de Presse** | `backend/services/surga/kiosque-service.js`, `backend/routes/surga/kiosque.js` | ProjetBI (`projetbi.org/press.json`, `LE-PROJET`) |
| 7 | **Trafic Routier Dakar** | `backend/services/surga/trafic-service.js`, `backend/services/surga/trafic-mesures.js` | Google Routes API (6 axes), signalements usagers |
| 8 | **Radios FM Locales** | `backend/services/surga/radio-service.js`, `backend/routes/surga/radio.js` | Flux de streaming direct (RFM, Zik FM, Walf...) |
| 9 | **Immobilier Dakar** | `backend/services/surga/immo-service.js`, `backend/routes/surga/immo.js` | Table `annonces_immo` Nopalou |
| 10 | **Bons Plans & Adresses (Places)** | `backend/services/surga/places-service.js`, `backend/routes/surga/places.js` | Catalogue `data/surga-places-catalogue.json` |
| 11 | **Shopping & Boutiques Nopalou** | `backend/services/surga/shopping-service.js`, `backend/routes/surga/shopping.js` | Tables `boutiques`, `boutique_produits` Nopalou |
| 12 | **Emploi (Profil, CV, Lettres)** | `backend/services/surga/emploi-service.js`, `backend/routes/surga/emploi.js` | Données saisies utilisateur + modèles déterministes |
| 13 | **Assistant LLM / Vocal / WhatsApp** | `backend/services/surga/assistant-llm.js`, `voice-interpreter.js`, `whatsapp-handler.js` | Gemini Flash API + Fast-Path déterministe |

---

## 2. Structure des Livrables de l'Audit

Le présent dossier `docs/surga/audits/data/` comprend 8 documents interconnectés :

1. **`README.md`** (ce document) : Cadre, périmètre, méthodologie et sommaire.
2. **`AUDIT_DATA.md`** : Rapport d'audit exhaustif, cartographie détaillée de la chaîne de données par module, analyse des causes racines, évaluation des niveaux de confiance.
3. **`EVIDENCES.md`** : Preuves factuelles et vérifiables (code source, requêtes SQL réelles en DB de prod, réponses API, comparaisons directes avec les pages web officielles comme le CESTI).
4. **`ANOMALIES.md`** : Registre d'anomalies numérotées (`DAT-ANO-01` à `DAT-ANO-XX`) avec sévérité, localisation sur la chaîne, impact utilisateur et reproductibilité.
5. **`CORRECTIONS.md`** : Plan de remédiation technique sans raccourci ni hardcoding, priorisé (CRITIQUE, HAUTE, MOYENNE, BASSE), avec composants cibles et validations requises.
6. **`ANTI_REGRESSION.md`** : Stratégie et batterie de tests de non-régression automatisables.
7. **`REGRESSION_DATASET.md`** : Dataset de référence avec valeurs sources certifiées, conditions, dates et règles de validation.
8. **`HANDOVER.md`** : Document de passation et de reprise de session conforme aux règles d'ingénierie du projet.

---

## 3. Règles d'Or Appliquées

* **Aucune supposition** : Seules les données prouvées par le code, la base de données, les logs et les sources primaires sont retenues.
* **Aucune correction hâtive pendant l'audit** : L'audit établit d'abord un constat objectif et complet avant toute intervention sur le code.
* **Traçabilité stricte** : Une donnée inconnue ou indisponible doit être affichée comme telle (`indisponible` ou `inconnu`) plutôt que simulée, extrapolée ou hardcodée.
* **Zéro complaisance** : Un affichage « propre » ou « esthétique » ne compense jamais une donnée fausse ou périmée.
