# HANDOVER AGENT 3 — AUDIT DONNÉES, SOURCES, IA, VOIX ET WHATSAPP (SURGA)

> **Document Officiel de Transition et Passation Inter-Agents**  
> **Émetteur** : Agent 3 (Audit Données + Sources + Qualité + IA + Voix + WhatsApp)  
> **Destinataire** : **Agent 4 (Audit SEO + Marketing + Acquisition + Réseaux Sociaux + Monétisation + Benchmark Final)**  
> **Date** : 5 Octobre 2026  
> **Branche de travail** : `feature/surga`  
> **Livrables associés** :
> 1. `docs/surga/AUDIT_3_DONNEES_IA_VOIX_WHATSAPP.md` (Rapport exhaustif)
> 2. `docs/surga/MATRICE_DATA_QUALITY_AUDIT_3.md` (Matrice qualité des données et sources)
> 3. `docs/surga/MATRICE_E2E_IA_VOIX_WHATSAPP_AUDIT_3.md` (Tests E2E des chaînes fonctionnelles)

---

## 1. CONTEXTE DE L'INTERVENTION

L'**Agent 3** a audité de manière empirique et exhaustive :
- L'intégrité de la chaîne complète de données : **SOURCE → RÉCUPÉRATION → PARSING → VALIDATION → STOCKAGE → TRANSFORMATION → IA → AFFICHAGE → UTILISATEUR**.
- La résilience et l'autorité des sources externes (presse sénégalaise, TomTom Live, radios FM, annonces immobilières).
- Le comportement réel de l'IA (démythification : absence de LLM, présence de parseurs déterministes regex).
- Le fonctionnement de bout en bout de la voix (Web Speech API, normalisation orale, modale de confirmation, persistance).
- L'intégration bidirectionnelle WhatsApp (réception webhook, déduplication, routage, quotas, confirmation OUI/NON, persistance SQL, rupture des notes vocales).

---

## 2. AUDITS PRÉCÉDENTS UTILISÉS

- **Agent -1** (`docs/surga/HANDOVER_AGENT_MINUS_1.md`) : Capitalisation des leçons Nopalou. Prise en compte immédiate des 5 bloquants P0 identifiés (`BLOC-P0-01` à `BLOC-P0-05`).
- **Agent 0** (`docs/surga/HANDOVER_AGENT_0.md`) : Recensement des 42 tables SQL, inventaire des routes API Express et confirmation de l'anomalie de déconnexion `../../db` (`SURGA-001`).
- **Agent 1** : Fondations techniques et absence de dépendances toxiques.
- **Agent 2** (`docs/surga/HANDOVER_AGENT_2.md`) : Tests d'interfaces Playwright Chromium, validation de l'onboarding, exactitude arithmétique de la calculatrice déterministe et signalement du service vocal backend orphelin (`BUG-A2-02`).

---

## 3. SOURCES TESTÉES EN CONDITIONS RÉELLES

1. **9 flux RSS de presse sénégalaise et thématique** :
   - APS (`https://aps.sn/feed/`) : **PASS** (10 articles récents, 407 ms).
   - Le Soleil (`https://lesoleil.sn/feed/`) : **PASS** (24 articles, 1 059 ms).
   - Google News Sénégal (Éco, Tech, Institutions) : **PASS** (125 articles au total).
   - Dakaractu (`https://www.dakaractu.com/feed`) : **FAIL** (HTTP 404 permanent).
   - Seneweb (`https://www.seneweb.com/news/rss.xml`) : **FAIL** (HTTP 404 permanent).
   - Le Quotidien (`https://lequotidien.sn/feed/`) : **FAIL** (HTTP 403 Forbidden Cloudflare).
   - Sud Quotidien (`https://www.sudquotidien.sn/feed/`) : **FAIL** (DNS ENOTFOUND).
2. **TomTom Traffic Routing API** : **PASS** (Temps de parcours réels, retards et vitesses en km/h sur les 6 corridors de Dakar avec cache TTL 6 min).
3. **Bouquet Radio FM Sénégal (13 stations)** : **12 PASS, 1 FAIL** (Oxy Jeunes renvoie HTTP 403, les 12 autres stations streament parfaitement via le proxy backend).
4. **Catalogue Immobilier Nopalou (`annonces_immo`)** : 1 649 annonces réelles présentes en base mais **0% exploitées** par le service Surga déconnecté.

---

## 4. DONNÉES TESTÉES EN BASE POSTGRESQL

- `surga_briefing_items` : 0 ligne au départ, **159 articles réels insérés** lors du test de collecte de l'Agent 3. Idempotence prouvée (0 doublon à la 2e passe).
- `surga_sources` : 9 flux déclarés.
- `surga_sport_events` : 3 événements statiques insérés par défaut.
- `surga_unes_presse` : 10 Unes de journaux stockées avec images locales vérifiées dans `/public/surga/unes/`.
- `surga_concours` et `surga_places` : 0 ligne en base (tournent sur les mocks mémoire `CONCOURS_NATIONAUX_SENEGAL` et `PLACES_DAKAR_DEMO`).
- `surga_depenses`, `surga_notes`, `surga_agenda` : Validation de la persistance SQL réelle lors des commandes vocales Web et commandes WhatsApp.

---

## 5. TESTS IA RÉALISÉS

1. **Absence de LLM** : Vérifié formellement. Aucun appel à Gemini, OpenAI, Claude ou Mistral n'est présent dans le code de Surga.
2. **Risque d'hallucination** : **0% d'hallucination factuelle** (moteurs déterministes stricts).
3. **Résumés de presse** : Vérifié. C'est une extraction du texte HTML source tronquée à 180 caractères par Cheerio (`nettoyerResume`).
4. **Recherche en langage naturel** : Analyse par mots-clés procéduraux (`t.includes(...)` pour types de biens, quartiers, ambiances).

---

## 6. TESTS VOIX RÉALISÉS

1. **Calculatrice vocale** : « Calcule 100 divisé par 3 » ➔ Résultat exact `33.33` (PASS).
2. **Grand calcul vocal** : « Combien fait deux mille cinq cents fois quatre » ➔ Résultat exact `10 000` (PASS).
3. **Dépense vocale** : « Note 2500 de taxi » ➔ Détection `ADD_EXPENSE`, 2500 FCFA, Transport, affichage obligatoire de `SurgaVoiceConfirmation.tsx` (PASS).
4. **Scorie libellé** : « Note deux mille cinq cents FCFA de taxi » ➔ Note enregistrée polluée : `"deux mille cinq cents taxi"` (PARTIAL).
5. **Rappel vocal** : « Rappelle-moi demain à 8h réunion » ➔ Rappel programmé au 2026-10-06 à 08:00 (PASS, scorie 'à' dans le titre).
6. **Support du Wolof** : « Bindal ma ñetti tééméér ci taxi » ➔ Rejet en `INCONNU` (FAIL - Wolof non supporté).

---

## 7. TESTS WHATSAPP RÉALISÉS

1. **Commande textuelle user connu** : « Note 2500 de taxi » ➔ Demande OUI/NON ➔ Réponse "OUI" ➔ Dépense insérée en table `surga_depenses` (Vérifié DB - PASS).
2. **Commande textuelle user inconnu** : « Note 3500 repas » ➔ Demande OUI/NON ➔ Réponse "OUI" ➔ **0 ligne insérée en base + fausse confirmation de succès** (FAIL CRITIQUE P0 - Perte silencieuse).
3. **Quotas journaliers** : Dépassement des 20 commandes gratuites ➔ Blocage propre et message courtois (PASS).
4. **Notes vocales WhatsApp (`msg.type === 'audio'`)** : Interception par le bot e-commerce Nopalou, boutons boutiques marchandes servis, audio ignoré (FAIL CRITIQUE P1).

---

## 8. RÉSULTATS GLOBAUX DE L'AUDIT 3

```text
+-------------------------------------------------------------------------------+
| TOTAL DES PARCOURS & ÉLÉMENTS DE DONNÉES AUDITÉS         : 51                 |
| - PASS (Conforme, opérationnel, prouvé sans faille)      : 24 (47,1 %)        |
| - PARTIAL (Fonctionnel avec dégradation ou données mocks): 14 (27,5 %)        |
| - FAIL (Rupture complète, fausse persistance ou 404/403) : 13 (25,5 %)        |
+-------------------------------------------------------------------------------+
```

---

## 9. PROBLÈMES CONFIRMÉS & CAUSES DÉMONTRÉES

| ID Anomalie | Sévérité / Prio | Titre & Description | Cause Démontrée | Fichiers Cibles |
| :---: | :---: | :--- | :--- | :--- |
| **ANOM-A3-01** | **CRITIQUE (P0)** | Perte silencieuse des écritures WhatsApp sur utilisateurs non inscrits | `if (userId)` sans `else` ni provisionnement dans `whatsapp-handler.js` ; message de succès envoyé aveuglément | `backend/services/surga/whatsapp-handler.js` |
| **ANOM-A3-02** | **CRITIQUE (P0)** | Déconnexion silencieuse DB sur 4 services majeurs (1 649 biens immo masqués) | `require('../../db')` inexistant masqué par des `catch {}` vides | `backend/services/surga/{immo,concours,places,trafic}-service.js` |
| **ANOM-A3-03** | **MAJEURE (P1)** | Abandon des vocaux WhatsApp et boutons marketplace e-commerce | Interception prioritaire par `whatsapp-chatbot.js` (l. 2268) avant le routeur Surga ; aucun moteur STT | `backend/services/whatsapp-chatbot.js` |
| **ANOM-A3-04** | **MAJEURE (P1)** | Absence de cron d'ingestion RSS & horodatages falsifiés `new Date()` | Pas de cron dans `backend/app.js` ; `ITEMS_SECOURS` et `kiosque-service` utilisent `new Date()` / `CURRENT_DATE` | `backend/app.js`, `rss-collector.js`, `kiosque-service.js` |
| **ANOM-A3-05** | **MOYENNE (P1)** | Service vocal backend orphelin (`voice-interpreter.js`) | Absence d'exposition de la route `POST /api/surga/audio/interpret` | `backend/routes/surga/audio.js` |
| **ANOM-A3-06** | **MOYENNE (P2)** | Pollution du libellé des dépenses avec nombres oraux écrits en lettres | Remplacement regex ciblant le montant numérique dans la chaîne brute non normalisée | `frontend-next/src/lib/surga-voice.ts` |
| **ANOM-A3-07** | **MOYENNE (P2)** | 4 flux RSS sur 6 en échec permanent (404, 403, DNS) | URLs obsolètes ou bloquées par protections anti-bot | `backend/services/surga/rss-collector.js` |

---

## 10. CORRECTIONS NÉCESSAIRES (RECOMMANDATIONS POUR L'ÉQUIPE DEV)

1. **Corriger immédiatement les 4 imports DB (P0)** : Remplacer `require('../../db')` par `const { pool } = require('../../models/db')` dans `immo-service.js`, `concours-service.js`, `places-service.js`, `trafic-service.js`.
2. **Sécuriser la persistance WhatsApp (P0)** : Dans `whatsapp-handler.js`, si `userId` est null, créer automatiquement un compte dans `utilisateurs` via son numéro de téléphone normalisé (comme le fait l'authentification WhatsApp Nopalou), ou refuser l'écriture avec un message clair.
3. **Planifier le cron d'actualisation de presse (P1)** : Dans `backend/app.js`, programmer `cron.schedule('*/30 * * * *', collecterTousLesFlux)` pour garder la table `surga_briefing_items` à jour en continu.
4. **Isoler et router les vocaux WhatsApp (P1)** : Remplacer les boutons de boutiques marchandes par un message dédié Surga ou brancher Whisper API / Gemini Speech.
5. **Nettoyer les fausses dates dynamiques (P1)** : Figer des dates immuables d'archives dans `ITEMS_SECOURS` et afficher « Mode archive locale » dans l'interface lorsque la base est vide.
6. **Exposer l'endpoint vocal backend (P1)** : Brancher `POST /api/surga/audio/interpret` sur `voice-interpreter.js`.

---

## 11. POINTS NON TESTABLES & LIMITES CONSTATÉES

1. **Appel réel à l'API Meta WhatsApp Business en émission réelle** :
   - *Raison* : Absence de clés de production WhatsApp Cloud API actives sur l'environnement de dev local (`WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID`).
   - *Méthode palliative exécutée* : Mock de `sendWhatsAppText` et injection directe dans le gestionnaire interne `traiterMessageWhatsAppSurga` avec écriture et contrôle direct dans la base PostgreSQL réelle.
2. **Reconnaissance vocale en environnement sans navigateur graphique (Headless)** :
   - *Raison* : La Web Speech API est une API propriétaire du navigateur (requiert Chromium avec micro actif).
   - *Méthode palliative exécutée* : Validation du flux logique via `SurgaVoiceModal.tsx` et tests unitaires / fonctionnels du moteur `surga-voice.ts` et `voice-interpreter.js`.

---

## 12. LEÇONS NOPALOU RÉUTILISÉES DANS CET AUDIT

- **`LEC-01` / `AUD-132` (Validation de l'identité et sessions orphelines)** : Détection de la perte silencieuse des données sur WhatsApp en l'absence de vérification préalable d'existence du compte.
- **`LEC-03` / `AUD-017` (Déconnexion silencieuse de la DB)** : Détection de l'import erroné `../../db` masqué par des blocs `catch {}` vides.
- **`LEC-06` / `AUD-201` (Vocaux WhatsApp abandonnés & fausse promesse)** : Détection de l'interception des vocaux par le bot de commerce Nopalou servant des boutons marchands.
- **`LEC-08` / `AUD-096` (Falsification des horodatages sur données de secours)** : Détection de l'utilisation de `new Date()` sur les articles de repli et Unes de presse.

---

## 13. POINTS PRIORITAIRES POUR L'AGENT 4

L'**Agent 4** est en charge de : **SEO + MARKETING + ACQUISITION + RÉSEAUX SOCIAUX + MONÉTISATION + BENCHMARK FINAL**.

Voici les alertes stratégiques transmises par l'Agent 3 :
1. **Monétisation & Abonnements** :
   - Vérifier la chaîne de paiement Wave et Orange Money pour Surga Premium (1 500 FCFA/mois ou 15 000 FCFA/an) et les forfaits B2B (Adresses, Immo, Concours).
   - Auditer la route `POST /api/surga/abonnements/verifier` pour s'assurer qu'un abonnement ne peut pas être activé gratuitement sans preuve cryptographique (`BLOC-P0-02` / `LEC-02`).
2. **SEO & Métadonnées OpenGraph** :
   - Vérifier la génération des balises `<meta>` et balises Twitter Card / OpenGraph sur `/surga` et sous-domaine `surga.nopalou.com` pour le partage sur WhatsApp, Facebook et Twitter/X.
3. **Acquisition & Canaux Sociaux** :
   - Auditer le module de partage universel (`SurgaPartageModal.tsx` et `share-formatter.js`) pour vérifier si les liens partagés amènent un trafic qualifié sans parasitage de la marketplace.
4. **Benchmark Final** :
   - Comparer le positionnement réel de Surga face aux alternatives locales (bots WhatsApp généralistes, apps d'actualités, agrégateurs immobiliers) sur la base des données réellement disponibles et non des déclarations marketing.
