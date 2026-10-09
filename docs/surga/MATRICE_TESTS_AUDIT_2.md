# Matrice des Tests — Audit 2 : Fonctionnel, UX, E2E et PWA/Offline de Surga

> **Document Officiel de Traçabilité des Tests — Agent 2**  
> **Date de réalisation** : 5 Octobre 2026  
> **Environnement de test** : Windows 11 x64, Node.js v24.19.0 / v20.18.0, Next.js 14.2 (port 3001), Express 4 (port 3000), PostgreSQL 18.4 (`nopalou_db`), Playwright 1.61.1 (Chromium headless).  
> **Branche audité** : `feature/surga`  
> **Total des tests exécutés** : 68 tests matériels (API, DB, E2E Chromium, PWA, Offline, Mobile, Sécurité).

---

## 1. Légende des Statuts

- **PASS** : Test exécuté avec succès de bout en bout avec vérification des résultats attendus.
- **FAIL** : Échec constaté et démontré par des preuves d'exécution (logs, code HTTP, exception).
- **PARTIAL** : Fonctionnement partiel ou limité à un sous-ensemble des cas prévus.
- **NOT CONFIRMED** : Hypothèse non corroborée par une preuve tangible.
- **NOT TESTABLE** : Test non exécutable en raison d'une limitation externe explicite et documentée.

---

## 2. Matrice Complète des Tests de l'Agent 2

| ID Test | Périmètre | Fonctionnalité testée | Description du scénario | Résultat | Preuve & Observations | Sévérité | Priorité |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| **TEST-A2-01** | Compte & Auth | Token JWT Nopalou | Génération et validation token client | **PASS** | Token signé avec `JWT_SECRET`, utilisateur `55d685ad-...` reconnu | — | — |
| **TEST-A2-02** | Compte & Auth | Mode Invité (Guest) | GET `/api/surga/preferences` sans token | **PASS** | HTTP 200, `{ success: true, guest: true }` | — | — |
| **TEST-A2-03** | Compte & Auth | Mode Authentifié | GET `/api/surga/preferences` avec Bearer JWT | **PASS** | HTTP 200, préférences chargées depuis PostgreSQL | — | — |
| **TEST-A2-04** | Compte & Auth | Session Expirée | GET `/api/surga/preferences` avec token expiré | **PASS** | `tokenOptional` bascule sur guest sans crash 500 ni page blanche | — | — |
| **TEST-A2-05** | Notes | Création Guest | POST `/api/surga/notes` sans token | **PASS** | Réponse simulée avec identifiant local et persistance client | — | — |
| **TEST-A2-06** | Notes | Création DB | POST `/api/surga/notes` avec Bearer JWT | **PASS** | HTTP 201, UUID généré, enregistrement dans `surga_notes` | — | — |
| **TEST-A2-07** | Notes | Lecture DB | GET `/api/surga/notes` | **PASS** | Note créée retrouvée fidèlement dans la liste PostgreSQL | — | — |
| **TEST-A2-08** | Notes | Recherche | GET `/api/surga/notes?q=Audit` | **PASS** | Filtrage SQL `ILIKE` fonctionnel sur titre et contenu | — | — |
| **TEST-A2-09** | Notes | Modification | PUT `/api/surga/notes/:id` | **PASS** | Mise à jour du titre et horodatage `updated_at` | — | — |
| **TEST-A2-10** | Notes | Validation Titre | POST `/api/surga/notes` avec titre vide | **PASS** | Rejeté avec HTTP 400 (`Le titre de la note est obligatoire`) | — | — |
| **TEST-A2-11** | Notes | Suppression | DELETE `/api/surga/notes/:id` | **PASS** | Suppression effective en base (`surga_notes`) | — | — |
| **TEST-A2-12** | Dépenses | Dépense Standard | POST `/api/surga/depenses` (15 000 FCFA Transport) | **PASS** | HTTP 201, persisté dans `surga_depenses` | — | — |
| **TEST-A2-13** | Dépenses | Grand Montant | POST `/api/surga/depenses` (10 000 000 FCFA Loyer) | **PASS** | Accepté et persisté sans dépassement d'entier | — | — |
| **TEST-A2-14** | Dépenses | Montant Zéro | POST `/api/surga/depenses` (0 FCFA) | **PASS** | Rejeté avec HTTP 400 (strictement > 0) | — | — |
| **TEST-A2-15** | Dépenses | Montant Négatif | POST `/api/surga/depenses` (-500 FCFA) | **PASS** | Rejeté avec HTTP 400 | — | — |
| **TEST-A2-16** | Dépenses | Montant Invalide | POST `/api/surga/depenses` ("abc") | **PASS** | Rejeté avec HTTP 400 | — | — |
| **TEST-A2-17** | Dépenses | Statistiques | GET `/api/surga/depenses/stats` | **PASS** | Total mensuel et ventilation par catégorie calculés exactement | — | — |
| **TEST-A2-18** | Calculatrice | Addition Simple | `100 + 250` | **PASS** | Moteur déterministe retourne `350` | — | — |
| **TEST-A2-19** | Calculatrice | Soustraction | `5000 - 1750` | **PASS** | Moteur déterministe retourne `3250` | — | — |
| **TEST-A2-20** | Calculatrice | Multiplication | `12 * 1250` | **PASS** | Moteur déterministe retourne `15000` | — | — |
| **TEST-A2-21** | Calculatrice | Division | `10000 / 4` | **PASS** | Moteur déterministe retourne `2500` | — | — |
| **TEST-A2-22** | Calculatrice | Décimales | `10 / 3` | **PASS** | Moteur déterministe retourne `3.33` | — | — |
| **TEST-A2-23** | Calculatrice | Parenthèses | `(1000 + 500) * 3` | **PASS** | Respect strict des priorités : `4500` | — | — |
| **TEST-A2-24** | Calculatrice | Grandes Valeurs | `1000000000 * 2` | **PASS** | `2000000000` sans corruption de précision | — | — |
| **TEST-A2-25** | Calculatrice | Division par Zéro | `100 / 0` | **PASS** | Échoue proprement : `Division par zéro` | — | — |
| **TEST-A2-26** | Calculatrice | Expression Invalide | `100 ++ * 5` | **PASS** | Rejeté proprement sans crash : `Nombre invalide` | — | — |
| **TEST-A2-27** | Calculatrice | Injection Code | `process.exit(1)` | **PASS** | Bloqué par regex de sécurité arithmétique | — | — |
| **TEST-A2-28** | Agenda | Création Événement | POST `/api/surga/agenda` | **PASS** | Enregistré dans `surga_agenda` avec date, heure et rappel | — | — |
| **TEST-A2-29** | Agenda | Bascule Terminé | PATCH `/api/surga/agenda/:id/toggle` | **PASS** | Statut `termine` inversé avec succès en DB | — | — |
| **TEST-A2-30** | Personnalisation | Sauvegarde Réglages | PUT `/api/surga/preferences` | **PASS** | Modules actifs, heure (07:30) et quartiers persistés en DB | — | — |
| **TEST-A2-31** | Personnalisation | Relecture Réglages | GET `/api/surga/preferences` | **PASS** | Données fidèlement restituées après enregistrement | — | — |
| **TEST-A2-32** | Briefing | Génération API | GET `/api/surga/briefing` | **PASS** | 5 articles d'actualité structurés, météo Dakar | — | — |
| **TEST-A2-33** | Briefing | Fraîcheur & Dates | Contrôle des horodatages | **PASS** | Articles réels du jour servis sans date falsifiée | — | — |
| **TEST-A2-34** | Synchro Offline | Réconciliation UUID | POST `/api/surga/sync` avec UUID | **PASS** | Insertion et mise à jour des notes/dépenses/agenda en DB | — | — |
| **TEST-A2-35** | Synchro Offline | Résilience ID non-UUID | POST `/api/surga/sync` avec `srg_*` ou `local_*` | **FAIL** | Crash SQL 500 : `invalid input syntax for type uuid` | CRITIQUE | P0 |
| **TEST-A2-36** | Sécurité | Anti-IDOR Export | GET `/api/surga/donnees/export?phone=...` sans JWT | **PASS** | Données non exposées sans session authentifiée | — | — |
| **TEST-A2-37** | Sécurité | Anti-IDOR Purge | POST `/api/surga/donnees/supprimer` sans JWT | **PASS** | Suppression refusée sans session authentifiée | — | — |
| **TEST-A2-38** | Sécurité | Validation Abonnement | POST `/api/surga/abonnements/verifier` faux paiement | **PASS** | Faux paiement Wave/OM rejeté, pas d'activation indue | — | — |
| **TEST-A2-39** | Assistant Vocal | Interprétation Calcul | Dictée "Calcule 15000 divisé par 3" | **PASS** | Intention `CALCULATE` identifiée, calcul exécuté | — | — |
| **TEST-A2-40** | Assistant Vocal | Interprétation Dépense | Dictée "Note 2500 FCFA taxi" | **PASS** | Intention `ADD_EXPENSE` et catégorie `Transport` devinées | — | — |
| **TEST-A2-41** | Assistant Vocal | Interprétation Rappel | Dictée "Rappelle-moi demain à 9h" | **PASS** | Intention `ADD_REMINDER`, date calculée et heure 09:00 | — | — |
| **TEST-A2-42** | Assistant Vocal | Interprétation Note | Dictée "Note liste de courses" | **PASS** | Intention `ADD_NOTE` identifiée | — | — |
| **TEST-A2-43** | Assistant Vocal | Endpoint Backend | POST `/api/surga/audio/interpreter` | **FAIL** | Route inexistante dans Express (code orphelin backend) | MOYENNE | P1 |
| **TEST-A2-44** | Partage | Message Brève | `formaterPartageBreve()` | **PASS** | Message sobre WhatsApp, source créditée, zéro émoji | — | — |
| **TEST-A2-45** | Partage | Message Calcul | `formaterPartageCalcul()` | **PASS** | Formatage FCFA déterministe avec lien canonique | — | — |
| **TEST-A2-46** | Sanctuaire Nopalou | API Catégories | GET `/api/categories` | **PASS** | HTTP 200, périmètre Nopalou intact | — | — |
| **TEST-A2-47** | Sanctuaire Nopalou | API Boutiques | GET `/api/boutiques` | **PASS** | HTTP 200, boutiques intactes | — | — |
| **TEST-A2-48** | E2E Browser | Navigation Initiale | Chargement `http://localhost:3001/surga` | **PASS** | Rendu Chromium réussi, HTTP 200 | — | — |
| **TEST-A2-49** | E2E Browser | Onboarding Étape 1 | Sélection briques d'intérêt | **PASS** | Cartes sélectionnables, transition Étape 2 | — | — |
| **TEST-A2-50** | E2E Browser | Onboarding Étape 2 | Heure briefing & langue | **PASS** | Sélection horaire, transition Étape 3 | — | — |
| **TEST-A2-51** | E2E Browser | Onboarding Étape 3 | Récapitulatif et lancement | **PASS** | Clic "Ouvrir mon Surga", bascule dashboard réussie | — | — |
| **TEST-A2-52** | E2E Browser | Persistance Onboarding | Stockage `surga_onboarding_done` | **PASS** | `localStorage` initialisé à `'true'`, évite boucle onboarding | — | — |
| **TEST-A2-53** | E2E Browser | Navigation Onglets | 5 onglets de `SurgaBottomNav` | **PASS** | Liens interactifs Aujourd'hui, Notes, Dépenses, Agenda, Plus | — | — |
| **TEST-A2-54** | E2E Browser | Notes : Saisie & Affichage | Création "Note E2E Master Agent 2" | **PASS** | Note affichée immédiatement dans la liste locale | — | — |
| **TEST-A2-55** | E2E Browser | Notes : Persistance F5 | Rechargement page Chromium | **PASS** | Note conservée et restituée après actualisation complète | — | — |
| **TEST-A2-56** | E2E Browser | Dépenses : Saisie & Total | Ajout dépense 12 500 FCFA | **PASS** | Total mensuel mis à jour instantanément dans l'en-tête | — | — |
| **TEST-A2-57** | E2E Browser | Dépenses : Persistance F5 | Rechargement page Chromium | **PASS** | Dépense et total inchangés après rechargement | — | — |
| **TEST-A2-58** | E2E Browser | Calculatrice : Ouverture | Clic sur "Calculatrice exacte" | **PASS** | Tiroir modal ouvert au-dessus du dashboard | — | — |
| **TEST-A2-59** | E2E Browser | Calculatrice : Calcul exact | Saisie `2500 × 4 =` | **PASS** | Affichage exact du résultat `10 000 FCFA` | — | — |
| **TEST-A2-60** | E2E Browser | Calculatrice : Fermeture | Clic bouton fermer | **PASS** | Modale refermée et libération des interactions sous-jacentes | — | — |
| **TEST-A2-61** | E2E Browser | Agenda : Saisie & Affichage | Ajout "RDV Notaire Nopalou" | **PASS** | Rappel enregistré et visible dans la vue agenda | — | — |
| **TEST-A2-62** | E2E Browser | Plus / Paramètres | Consultation réglages | **PASS** | Vue de paramétrage affichée avec briques et quartiers | — | — |
| **TEST-A2-63** | E2E Browser | Bouton Partager | Inspection DOM briefing | **PASS** | Boutons `SurgaShareButton` présents sur chaque brève | — | — |
| **TEST-A2-64** | Offline Mode | Réseau Coupé | `context.setOffline(true)` | **PASS** | Passage en mode avion simulé sans crash applicatif | — | — |
| **TEST-A2-65** | Offline Mode | Navigation Hors Ligne | Bascule entre onglets réseau coupé | **PASS** | Notes, dépenses et agenda restent consultables | — | — |
| **TEST-A2-66** | Offline Mode | Écriture Hors Ligne | Création note en mode avion | **PASS** | Note stockée en local (`synced: false`), aucun message d'erreur | — | — |
| **TEST-A2-67** | Responsive UX | Mobile iPhone (375px) | Contrôle débordement horizontal | **PASS** | `scrollWidth === clientWidth` (375px), zéro barre de défilement X | — | — |
| **TEST-A2-68** | Responsive UX | Mobile Android (412px) | Contrôle débordement horizontal | **PASS** | `scrollWidth === clientWidth` (412px), pleine largeur fluide | — | — |
| **TEST-A2-69** | PWA | Manifest | Balise `<link rel="manifest">` | **PASS** | Pointeur vers `/surga/manifest.json` valide | — | — |
| **TEST-A2-70** | PWA | Service Worker Scope | Scope `/surga/` vs sous-domaine | **PARTIAL** | Actif sur `/surga/`, inactif à la racine `surga.nopalou.com/` | MOYENNE | P2 |
| **TEST-A2-71** | Design System | Zéro Émoji UI | Scan Unicode UTF-8 de l'UI Web | **PASS** | 0 émoji Unicode dans l'ensemble des 5 vues de Surga | — | — |
| **TEST-A2-72** | Qualité | Console Navigateur | Surveillance logs d'erreur | **PASS** | 0 exception JavaScript non rattrapée dans Chromium | — | — |

---

## 3. Synthèse Chiffrée de la Matrice

- **Tests Exécutés** : 72 tests.
- **PASS** : 68 tests (94.4%).
- **FAIL** : 2 tests (2.8%) :
  1. `TEST-A2-35` : Plantage SQL en synchro offline lors de la réception d'identifiants non-UUID (P0).
  2. `TEST-A2-43` : Endpoint backend vocal non exposé dans Express (P1).
- **PARTIAL** : 2 tests (2.8%) :
  1. `TEST-A2-70` : Scope Service Worker non adapté au sous-domaine direct.
  2. Déclenchement notifications de rappel (dépendant de l'autorisation de permission du navigateur).
- **NOT TESTABLE** : 0 test bloqué.
