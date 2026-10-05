# 🤝 DOSSIER DE PASSATION — HANDOVER AGENT 0 (POST-IMPLÉMENTATION SURGA)

> **Document Officiel de Transition Inter-Agents**  
> **Émetteur** : Agent 0 (Audit Post-Implémentation Surga)  
> **Destinataire** : Agent 1 (Correcteur / Remédiation Technique)  
> **Date** : 5 octobre 2026  
> **Branche de travail** : `feature/surga`  
> **Statut global** : **AUDIT COMPLET ACHEVÉ — 10 ANOMALIES IDENTIFIÉES DONT 4 P0 CRITIQUES**  

---

## 1. ÉTAT DE L'AUDIT & ENVIRONNEMENT

### 1.1 Environnement Réellement Constaté
- **Plateforme** : Windows 11 x64, Node.js v20.18.0.
- **Base de données** : PostgreSQL 18.4 (`nopalou_db`) connectée et opérationnelle.
- **Serveurs actifs** :
  - Backend Express : `http://localhost:3000` (PID actif, port 3000).
  - Frontend Next.js : `http://localhost:3001` (PID actif, port 3001).
- **Intégrations tierces** : Clé TomTom Live active et vérifiée (`TOMTOM_API_KEY`).
- **Périmètre sanctuarisé Nopalou** : Vérifié sans régression (Comparateur `/`, Boutiques `/api/boutiques`, Caisse PRO `/caisse`).

### 1.2 Synthèse du Diagnostic
Surga a validé avec succès l'ensemble de ses tests unitaires de surface (**91/91 Jest**, **97/97 Vitest**, **0 erreur TypeScript**, **0 émoji dans l'UI**). Cependant, l'audit approfondi en conditions réelles a mis au jour **une déconnexion silencieuse de la base de données** dans 4 services sur 5, maintenant le produit dans un état de fonctionnement sur mocks mémoire, ainsi que **deux failles de sécurité majeures (P0)**.

---

## 2. REGISTRE DES TESTS EXÉCUTÉS PAR L'AGENT 0

| ID Test | Objectif | Méthode & Script | Résultat Réel | Preuve & Fichiers |
| :--- | :--- | :--- | :---: | :--- |
| **TEST-01** | Vérifier la présence d'émojis dans les composants React | Scan regex UTF-8 (`check_emojis.js`) | **PASS** | 0 émoji trouvé dans `frontend-next/src/app/surga/` |
| **TEST-02** | Vérifier la conformité TypeScript du projet | `npx tsc --noEmit` | **PASS** | 0 erreur de typage |
| **TEST-03** | Vérifier la suite unitaire Jest Surga | `npx jest tests/unit/surga.test.js` | **PASS** | 91/91 tests passés avec succès |
| **TEST-04** | Vérifier la connectivité et les tables de la DB PostgreSQL | Requêtes SQL réelles (`test_db.js`) | **PASS** | Tables `surga_*` présentes ; PostgreSQL 18.4 |
| **TEST-05** | Vérifier l'intégration des 1 649 annonces réelles Nopalou | Inspection `annonces_immo` (`test_nopalou_tables.js`) | **PASS (DB) / FAIL (Code)** | 1 649 biens en base, mais ignorés par `immo-service.js` |
| **TEST-06** | Détecter les divergences Admin vs Client sur les services | Comparaison DB vs Mocks (`test_api_discrepancy.js`) | **CONFIRMÉ** | `surga_places` = 0 en base, 10 en mémoire ; `concours` = 0 en base, 10 en mémoire |
| **TEST-07** | Tester l'API TomTom Traffic en direct à Dakar | Requête HTTPS avec clé réelle (`test_tomtom.js`) | **PASS** | HTTP 200, temps de trajet et vitesse réelle reçus |
| **TEST-08** | Tester l'intégrité des clés étrangères à l'insertion | Tentative d'insertion SQL réelle (`test_fk.js`) | **FAIL** | Exception `violates foreign key constraint surga_trafic_signalements_axe_id_fkey` |
| **TEST-09** | Vérifier la fraîcheur des articles du briefing quotidien | Inspection SQL et API (`inspect_surga_content.js`) | **FAIL** | 0 ligne en base ; 5 articles de secours avec fausse date générée |
| **TEST-10** | Tester l'accessibilité réseau des 9 flux RSS sénégalais | Sonde HTTP/DNS (`test_rss_feeds.js`) | **FAIL PARTIEL** | Dakaractu (404), Seneweb (404), Sud Quotidien (DNS) |
| **TEST-11** | Tester le streaming en direct des 13 stations FM | Sonde HTTP audio (`test_radios.js`) | **PASS PARTIEL** | 12 radios OK, Oxy Jeunes renvoie 403 Forbidden |
| **TEST-12** | Tester les 18 routes API REST réelles de Surga | Sonde HTTP locale port 3000 (`test_live_apis.js`) | **PASS** | Routes actives (12 à 45 ms), structure JSON conforme |
| **TEST-13** | Tester la vulnérabilité IDOR sur l'export des données | Requête sans token (`test_vulnerability.js`) | **FAIL (VULNÉRABLE)** | HTTP 200 avec dump JSON de toutes les données personnelles |
| **TEST-14** | Tester la validation des abonnements sans paiement | POST `/verifier` sans preuve de paiement | **FAIL (VULNÉRABLE)** | Activation arbitraire pour 1 an d'un statut Premium/Pro |
| **TEST-15** | Mesurer le poids réel des bundles JS et HTML | Analyse statique build (`measure_surga_bundles.js`) | **PASS / ATTENTION** | HTML 7,8 Ko (<30 Ko), JS initial 146,9 Ko (dépasse 120 Ko) |
| **TEST-16** | Vérifier l'isolation SSR du layout et du HTML | Inspection SSR cURL (`inspect_surga_html.js`) | **PASS** | Navbar et footer Nopalou absents sur `/surga` |
| **TEST-17** | Vérifier la non-régression du sanctuaire Nopalou | Sonde des endpoints boutique et caisse (`test_protected_perimeters.js`) | **PASS** | Catégories (200), Boutiques (200), Caisse (200) |

---

## 3. REGISTRE DES ANOMALIES CONFIRMÉES (À CORRIGER PAR L'AGENT 1)

| ID | Sévérité | Priorité | Titre | Fichiers Cibles | Impact |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **SURGA-001** | CRITIQUE | **P0** | Déconnexion silencieuse DB (chemin `../../db` erroné) | `backend/services/surga/{concours,places,trafic,immo}-service.js` | 4 services tournent sur mocks mémoire ; annonces immo réelles ignorées |
| **SURGA-002** | CRITIQUE | **P0** | Violation de clés étrangères sur tables non seedées | `scripts/seed-surga-data.js` | Crash à chaque écriture dès que la DB est reconnectée |
| **SURGA-003** | CRITIQUE | **P0** | Faille IDOR : Fuite & suppression de données sans auth | `backend/routes/surga/donnees.js`, `immo.js` | N'importe qui peut voler ou effacer les données d'un tiers via `?phone=` |
| **SURGA-004** | CRITIQUE | **P0** | Validation gratuite des abonnements Premium / Pro | `backend/routes/surga/abonnements.js` | Activation sans vérification de paiement Wave / OM |
| **SURGA-005** | HAUTE | **P1** | Notes vocales WhatsApp non transcrites (rejet bot) | `backend/services/whatsapp-chatbot.js` | Promesse produit vocale WhatsApp inexistante |
| **SURGA-006** | HAUTE | **P1** | Absence de cron d'ingestion & génération de faux horodatages | `backend/services/surga/briefing-service.js`, `server.js` | Briefing statique déguisé avec dates artificielles `new Date()` |
| **SURGA-007** | HAUTE | **P1** | 3 flux RSS sénégalais brisés (Dakaractu, Seneweb, Sud) | `backend/services/surga/briefing-service.js` | Perte d'articles et timeouts réseau inutiles |
| **SURGA-008** | HAUTE | **P1** | Endpoint audio Podcast MP3 renvoyant une 404 | `backend/routes/surga/podcast.js` | Lecteurs de podcast incapables de lire l'audio |
| **SURGA-009** | MOYENNE | **P2** | Composants React monolithiques (> 450 lignes) | `SurgaImmoModal.tsx` (584 l.), `SurgaPremiumModal.tsx` (465 l.) | Violation de la règle d'or 2 de modularité |
| **SURGA-010** | MOYENNE | **P2** | Incompatibilité de scope du Service Worker sur sous-domaine | `frontend-next/public/surga/sw.js` | Mode hors-ligne inactif à la racine de `surga.nopalou.com` |

---

## 4. CE QUI N'A PAS PU ÊTRE TESTÉ (POINTS NON CONCLUSIFS)

1. **Session Interactive Playwright dans Navigateur Headless** :
   - *Pourquoi* : Échec du téléchargement du binaire Playwright 1.57.0 (erreur 404 sur le miroir CDN distant).
   - *Action requise pour l'Agent 1* : Tester manuellement ou installer Playwright localement pour observer les transitions d'écrans PWA.
2. **Transaction Réelle Wave / Orange Money avec Débit Réel** :
   - *Pourquoi* : Préservation des fonds bancaires.
   - *Action requise pour l'Agent 1* : Utiliser les environnements sandbox / mock Wave existants dans `backend/services/wave.js`.

---

## 5. FICHIERS IMPORTANTS DU SYSTÈME

### Backend (`backend/`)
- `backend/models/db.js` : Connecteur central PostgreSQL (utilise `DATABASE_URL`).
- `backend/services/surga/briefing-service.js` : Ingestion RSS et synthèse presse.
- `backend/services/surga/calculator.js` : Moteur arithmétique déterministe (91 tests).
- `backend/services/surga/trafic-service.js` : Intégration TomTom et corridors Dakar.
- `backend/services/surga/immo-service.js` : Recherche immobilière (à raccorder à `annonces_immo`).
- `backend/services/surga/concours-service.js` : Concours du Sénégal (à reconnecter à la DB).
- `backend/services/surga/places-service.js` : Bonnes adresses (à reconnecter à la DB).
- `backend/services/surga/abonnement-service.js` : Gestion des forfaits Premium / Pro.
- `backend/services/whatsapp-chatbot.js` : Routage des messages WhatsApp entrants.
- `backend/routes/surga/` : 10 fichiers de routes REST (`briefing.js`, `sync.js`, `agenda.js`, `trafic.js`, `immo.js`, `concours.js`, `places.js`, `abonnements.js`, `donnees.js`, `radios.js`, `podcast.js`).

### Frontend (`frontend-next/`)
- `frontend-next/src/app/surga/page.tsx` : Tableau de bord principal (431 lignes).
- `frontend-next/src/app/surga/layout.tsx` : Isolation SSR et balises OpenGraph.
- `frontend-next/src/styles/surga.css` : Feuille de styles maîtresse (18 Ko, zéro Tailwind).
- `frontend-next/src/app/surga/components/` : 22 composants React modulaires.
- `frontend-next/public/surga/sw.js` : Service worker PWA.

---

## 6. INSTRUCTIONS PRÉCISES POUR L'AGENT SUIVANT (AGENT 1)

### 🛑 Règles d'Or Impératives pour l'Agent 1
1. **NE RIEN TOUCHER au Comparateur de Prix ni à la Caisse PRO** (périmètres sanctuarisés).
2. **NE PAS EFFECTUER de `git push`** sans demande explicite de l'utilisateur.
3. **NE PAS INTRODUIRE de polices externes** (respect strict de la pile système native).
4. **NE PAS INTRODUIRE d'émojis** dans l'interface utilisateur.

### 📋 Séquence de Travail Recommandée

#### Étape 1 : Réparer les 4 Anomalies P0 (Sécurité & DB)
1. Dans `backend/services/surga/concours-service.js`, `places-service.js`, `trafic-service.js` et `immo-service.js` :
   - Remplacer `require('../../db')` par `require('../../models/db')`.
   - Dans `immo-service.js`, remplacer la lecture du tableau local par une requête SQL sur `annonces_immo` (en filtrant sur `actif = true` et les colonnes correspondantes).
2. Créer un script de seed `scripts/seed-surga-data.js` qui peuple :
   - `surga_trafic_axes` (les 8 corridors : VDN, Autoroute de l'Avenir, Route de la Corniche Ouest, etc.).
   - `surga_concours` (les 10 concours nationaux de référence).
   - `surga_places` (les 10 adresses de base avec leurs coordonnées et avis résumés).
   - Exécuter ce script pour garantir que les clés étrangères existent.
3. Sécuriser les routes dans `backend/routes/surga/donnees.js` et `immo.js` :
   - Remplacer `tokenOptional` par `authenticateToken` sur `/export` et `/supprimer`.
   - Supprimer le paramètre libre `req.query.phone` ; utiliser exclusivement `req.user.telephone` et `req.user.id`.
4. Sécuriser `backend/routes/surga/abonnements.js` :
   - Exiger une authentification stricte.
   - Valider la référence auprès du service de paiement avant d'activer l'abonnement.

#### Étape 2 : Traiter les Anomalies P1 (Intégrité des Données & Audio)
1. Dans `briefing-service.js` :
   - Remplacer les URLs de flux RSS de Dakaractu et Seneweb par leurs endpoints valides actuels ou des alternatives fiables.
   - Supprimer l'attribution artificielle de la date `new Date()` sur les données de secours.
2. Dans `backend/server.js` :
   - Programmer une tâche cron périodique (ex. toutes les heures) appelant `collecterTousLesFlux()`.
3. Dans `backend/routes/surga/podcast.js` :
   - Implémenter la route `stream.mp3` ou adapter le flux RSS pour servir un format audio valide.
4. Dans `backend/services/whatsapp-chatbot.js` :
   - Router les messages `audio` vers le moteur de transcription si disponible.

#### Étape 3 : Traiter les Anomalies P2 (Qualité Code & PWA)
1. Découper `SurgaImmoModal.tsx` (584 l.) en extrayant le formulaire d'alerte dans un sous-composant `SurgaImmoAlerteForm.tsx`.
2. Découper `SurgaPremiumModal.tsx` (465 l.) en extrayant la grille de formules dans `SurgaPremiumPricingGrid.tsx`.
3. Ajuster le scope du Service Worker dans `sw.js` et `layout.tsx` pour couvrir la racine sur le sous-domaine `surga.nopalou.com`.

#### Étape 4 : Re-validation Complète
1. Exécuter `npx jest tests/unit/surga.test.js` (doit rester 91/91 PASS).
2. Exécuter `cd frontend-next; npm test` (doit rester 97/97 PASS).
3. Exécuter `npx tsc --noEmit` (doit rester 0 erreur).
4. Rejouer les sondes de test créées par l'Agent 0 :
   - `node scratch/test_vulnerability.js` (doit maintenant renvoyer HTTP 401).
   - `node scratch/test_fk.js` (doit maintenant réussir l'insertion).
   - `node scratch/test_api_discrepancy.js` (ne doit plus détecter de divergence DB/Mocks).
5. Mettre à jour `CLAUDE.md` et `docs/JOURNAL-LIVRAISONS.md` à l'issue des corrections.

---
*Fin du Dossier de Passation — Agent 0*
