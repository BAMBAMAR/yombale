# HANDOVER AGENT 2 — AUDIT FONCTIONNEL, UX, E2E ET PWA/OFFLINE DE SURGA

**Date** : 5 Octobre 2026  
**Émetteur** : Agent 2 (Audit Fonctionnel, UX, E2E, PWA & Mode Déconnecté)  
**Destinataire** : **Agent 3 (Audit Données + Sources + IA + Voix + WhatsApp)**

---

## 1. CONTEXTE DE L'INTERVENTION

L'Agent 2 a audité de manière empirique et exhaustive le fonctionnement réel de Surga en conditions opérationnelles :
- Intégrité des flux de données de bout en bout (Interface React/Next.js 14 → API Express → PostgreSQL Render).
- Validation de l'expérience utilisateur mobile (viewports réels 375px et 412px, conformité tactile, zéro émoji UI).
- Tests E2E automatisés via navigateur réel Chromium (Playwright 1.61.1).
- Audit des capacités PWA (manifeste web, Service Worker, cycle de vie) et résilience en mode déconnecté (offline / mode avion).

---

## 2. AUDITS PRÉCÉDENTS EXPLOITÉS

- **Agent -1** : `docs/surga/HANDOVER_AGENT_MINUS_1.md` et `docs/surga/CAPITALISATION_NOPALOU.md`. Règles de sanctuarisation Nopalou, interdiction des émojis UI, calculs déterministes.
- **Agent 0** : `docs/surga/HANDOVER_AGENT_0.md` et `docs/surga/AUDIT_POST_IMPLEMENTATION_AGENT_0.md`. Inventaire des 42 tables SQL, analyse des routes Express.
- **Agent 1** : Données de conformité architecturale et d'absence de dépendance toxique consolidées dans le bilan technique.

---

## 3. TESTS EFFECTUÉS

72 tests réels ont été exécutés et documentés dans `docs/surga/MATRICE_TESTS_AUDIT_2.md` :
1. **Tests API & Base PostgreSQL (45 tests)** :
   - Endpoints `/api/surga/profile`, `/api/surga/notes`, `/api/surga/depenses`, `/api/surga/agenda`, `/api/surga/kiosk`, `/api/surga/radios`, `/api/surga/sync`.
   - Contrôle du typage UUID, des contraintes d'intégrité référentielle et des calculs financiers d'agrégation.
2. **Tests d'Interface E2E Playwright Chromium (23 tests)** :
   - Onboarding utilisateur en 3 étapes avec persistance locale.
   - Saisie et persistance réelle de notes et de dépenses (12 500 FCFA).
   - Calculatrice exacte déterministe (`2500 × 4 = 10 000 FCFA`, grands nombres, division par zéro).
   - Navigation mobile sur formats iPhone SE (375px) et Android (412px) sans débordement horizontal.
   - Scan Unicode du DOM : Zéro émoji UI dans les 5 onglets.
3. **Tests PWA & Offline (4 tests)** :
   - Analyse du manifest JSON et du script Service Worker.
   - Simulation de coupure réseau complète (`setOffline(true)`) avec création locale d'entités.

---

## 4. RÉSULTATS GLOBAUX

| Statut | Quantité | Pourcentage |
| :--- | :---: | :---: |
| **PASS (Confirmé)** | 68 | 94,4 % |
| **FAIL (Échec)** | 2 | 2,8 % |
| **PARTIAL (Partiel)** | 2 | 2,8 % |
| **NOT CONFIRMED** | 0 | 0,0 % |
| **NOT TESTABLE** | 0 | 0,0 % |
| **TOTAL** | **72** | **100 %** |

---

## 5. PROBLÈMES CONFIRMÉS

1. **BUG-A2-01 (P0 / CRITIQUE)** : Échec de la synchronisation offline à la reconnexion avec crash PostgreSQL 500 (`invalid input syntax for type uuid`).
2. **BUG-A2-02 (P1 / MAJEURE)** : Route backend de reconnaissance vocale manquante / fichier `backend/services/surga/voice-interpreter.js` (204 lignes) orphelin non exposé.
3. **BUG-A2-03 (P2 / MOYENNE)** : Scope du Service Worker (`sw.js`) ignorant la racine `/` sur le domaine autonome `surga.nopalou.com`.
4. **BUG-A2-04 (P2 / MINEURE)** : Modale calculatrice sans capture active du focus clavier ni attributs ARIA complets.

---

## 6. CAUSES DÉMONTRÉES

- **Cause BUG-A2-01** : Dans `surga-offline-sync.ts`, la fonction `genererId()` utilise en secours la chaîne `'srg_' + Date.now() + '_' + rand`. Dans PostgreSQL, les tables `surga_notes`, `surga_depenses` ont pour clé primaire une colonne `UUID`. L'insertion SQL directe sans typage UUID lève une exception non gérée provoquant un `ROLLBACK` total.
- **Cause BUG-A2-02** : Le frontend utilise son propre interpréteur vocal (`surga-voice.ts`) sans avoir relié le backend Express `voice-interpreter.js`, laissant le service serveur inactif.
- **Cause BUG-A2-03** : Le Service Worker filtre sur `url.pathname.startsWith('/surga')`, ce qui exclut `https://surga.nopalou.com/` dont le `pathname` est `/`.

---

## 7. CORRECTIONS NÉCESSAIRES (AVANT / PENDANT AGENT 3)

| Priorité | ID | Action Corrective Recommandée |
| :---: | :---: | :--- |
| **P0** | `BUG-A2-01` | Adapter `backend/routes/surga/sync.js` pour tolérer et mapper les IDs temporaires clients non-UUID vers des UUID réels PostgreSQL, et sécuriser `surga-offline-sync.ts` avec un polyfill UUID v4 pur. |
| **P1** | `BUG-A2-02` | Exposer `POST /api/surga/audio/interpret` dans Express reliant `voice-interpreter.js` (point capital pour l'Agent 3). |
| **P2** | `BUG-A2-03` | Étendre la condition dans `sw.js` pour prendre en compte le hostname `surga.nopalou.com`. |
| **P2** | `BUG-A2-04` | Ajouter `role="dialog"` et gestion de la touche Echap sur la modale calculatrice. |

---

## 8. FICHIERS ET MODULES CONCERNÉS

- `frontend-next/src/lib/surga-offline-sync.ts`
- `backend/routes/surga/sync.js`
- `backend/routes/surga/audio.js`
- `backend/services/surga/voice-interpreter.js`
- `frontend-next/public/surga/sw.js`
- `frontend-next/src/app/surga/components/`

---

## 9. POINTS NON TESTÉS ET JUSTIFICATION

- **Aucun point n'a été classé NOT TESTABLE** : L'environnement complet (PostgreSQL + Express + Next.js + Playwright) a permis de tester 100% des parcours fonctionnels requis.

---

## 10. POINTS À REPRENDRE PAR L'AGENT 3

L'Agent 3 est en charge de : **Données + Sources + IA + Voix + WhatsApp**.  
Points d'attention immédiats transmis par l'Agent 2 :
1. **Service Vocal Backend** : Résoudre ou intégrer `voice-interpreter.js` (BUG-A2-02) pour valider l'interprétation IA des commandes vocales en backend.
2. **Sources & Kiosque** : Vérifier la fraîcheur des données de `surga_press_kiosk` et le scraping/agrégation des sources d'information sénégalaises.
3. **Connecteur WhatsApp** : Tester les webhooks WhatsApp entrant pour la création automatisée de notes et de dépenses (liaison directe avec le moteur testé par l'Agent 2).
4. **Calculs IA vs Déterministes** : Vérifier que l'IA ne génère jamais de montants financiers d'elle-même, mais délègue au moteur déterministe validé dans l'Audit 2.

---

## 11. TESTS À NE PAS REFAIRE INUTILEMENT

L'Agent 3 peut s'appuyer avec certitude sur les validations suivantes :
- Le bon fonctionnement du parcours d'Onboarding en 3 étapes.
- La persistance des notes et dépenses en base PostgreSQL via l'API standard.
- L'exactitude mathématique de la calculatrice déterministe XOF.
- L'intégrité du layout mobile (zéro débordement sur 375px et 412px).
- L'absence d'émojis Unicode dans les composants d'interface.

---

## 12. TESTS À REFAIRE APRÈS CORRECTION

- Re-tester la synchronisation déconnectée (`/api/surga/sync`) une fois le patch UUID appliqué (`TEST-A2-35`).
- Tester l'endpoint vocal backend une fois branché (`TEST-A2-43`).

---

## 13. RISQUES RÉSIDUELS

- Si un utilisateur accumule des données hors-ligne sur un terminal n'ayant pas `crypto.randomUUID()`, la synchronisation restera bloquée tant que le patch P0 n'est pas appliqué.
- Risque d'incohérence entre les grammaires de commande vocale du client et du futur bot WhatsApp si `voice-interpreter.js` n'est pas unifié.

---

## 14. LEÇONS NOPALOU CONCERNÉES

- **Leçon L-NPL-04 (Cohérence Typage DB vs Client)** : Tout identifiant généré côté client doit être validé ou mappé explicitement avant transaction SQL.
- **Leçon L-NPL-07 (Isolation Absolue)** : Le sanctuaire Nopalou a été totalement préservé durant l'audit ; aucune régression n'a touché la Caisse POS ni le comparateur.

---

## 15. PRIORITÉS RECOMMANDÉES POUR L'AGENT 3

1. **Priorité 1** : Auditer le pipeline de transcription audio et d'interprétation d'intentions IA (Whisper / OpenAI / Claude / regex locales).
2. **Priorité 2** : Auditer les connecteurs de sources d'informations externes (kiosque de presse, météo, cours des denrées).
3. **Priorité 3** : Auditer l'intégration bidirectionnelle WhatsApp (réception de message vocal / texte → action Surga → réponse formatée).
