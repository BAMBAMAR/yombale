# DOSSIER DE PASSATION — HANDOVER VERS AGENT 6 (EXÉCUTEUR DES REMÉDIATIONS)

```text
DOCUMENT : HANDOVER AGENT-05 → AGENT-06
SESSION-ID : AUDIT-2026-005-AG05
DATE : 2026-10-04
AGENT ÉMETTEUR : AGENT-05 (Planificateur de Remédiation)
AGENT DESTINATAIRE : AGENT-06 (Ingénieur de Remédiation & Développeur Correcteur)
STATUT : FEU VERT POUR EXÉCUTION DU PLAN DE CORRECTION
```

---

## 1. SESSION

* **SESSION-ID** : `AUDIT-2026-005-AG05`
* **AGENT** : `AGENT-05` (Planificateur de Remédiation)
* **DATE** : 2026-10-04
* **VERSION DU PROJET** : `4c0237273fde2d058d5eabca5f94b79ceb07d37e`
* **PHASE EN COURS** : `PHASE 5 — CONCEPTION DU PLAN DE CORRECTION & SPÉCIFICATION DES REMÉDIATIONS (ACHEVÉE)`
* **PROCHAINE PHASE** : `PHASE 6 — EXÉCUTION DES CORRECTIONS TECHNIQUES` (Agent 6)

---

## 2. DOCUMENTS À LIRE AVANT TOUTE INTERVENTION

L'Agent 6 doit impérativement ouvrir et assimiler les documents suivants dans cet ordre :
1. `/audit/07_PLAN_CORRECTION/PLAN_REMEDIATION.md` : Le plan détaillé des 6 correctifs avec les 5 étapes d'implémentation par FIX.
2. `/audit/07_PLAN_CORRECTION/MATRICE_FIX_TEST.md` : La grille de correspondance FIX ↔ TEST et scénarios de retest associés.
3. `/audit/02_PLAN_TESTS/REGRESSION_BASELINE.md` : Les 6 grappes d'impact (A à F) à rejouer lors de chaque modification.
4. `AGENTS.md` & `.agents/AGENTS.md` : Les 5 Règles d'Or Nopalou (Anti-Slop, Modularisation < 450 lignes, Tokens CSS purs, Sécurité Multi-Tenant, Zéro push sans accord explicite).
5. `CLAUDE.md` : Directives de résilience (notamment ligne 58 sur le mode de repli manuel).

---

## 3. TRAVAIL EFFECTUÉ PAR L'AGENT 5

Au cours de la Phase 5, l'Agent 5 a :
1. Revalidé l'ensemble de la chaîne causale pour les 6 anomalies homologuées par la contre-expertise de l'Agent 4.
2. Élaboré une spécification technique chirurgicale pour chaque correctif (`FIX-001` à `FIX-006`), comprenant :
   - Les fichiers et lignes de code précis à modifier.
   - Les cas limites identifiés.
   - Les modifications frontend et backend requises.
   - Les critères d'acceptation univoques.
3. Résolu formellement le piège historique `AUD-083` en concevant un correctif double indissociable (Backend HTTP 201 + Frontend Modale Panier) pour `FIX-004`.
4. Établi la matrice de traçabilité bidirectionnelle `MATRICE_FIX_TEST.md`.
5. Défini l'ordonnancement optimal par lots et les conditions bloquantes pour prévenir toute régression.
6. **Préservé la neutralité absolue de la phase en ne modifiant aucune ligne de code source du projet.**

---

## 4. LISTE DES FIX À EXÉCUTER PAR L'AGENT 6

| FIX ID | ANOMALIE | PRIORITÉ | LOCALISATION TECHNIQUE | MODIFICATION ATTENDUE | TEST DE VALIDATION | BASELINE RÉGRESSION |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **`FIX-001`** | `ANOM-001` | **P1** | `backend/routes/auth.js:54, 61-64` & `frontend-next/src/app/actions/auth.ts:43, 55` | Extraire, normaliser via `normalisePhone` et insérer `telephone` dans `utilisateurs` à l'inscription. | `TEST-001-R` | **GRAPPE C** (`TEST-002`, `TEST-003`, `TEST-004`) |
| **`FIX-002`** | `ANOM-002` | **P3** | `backend/routes/auth.js:525-534` & `audit/02_PLAN_TESTS/PLAN_TESTS.md:40` | Mettre à jour l'URL d'audit `/profil` et ajouter un alias direct `GET /api/auth/moi` réutilisant le handler profil. | `TEST-002-R` | **GRAPPE C** (`TEST-001`, `TEST-003`, `TEST-004`) |
| **`FIX-003`** | `ANOM-003` | **P1** | `backend/routes/boutiques-modules/boutiques-produits.js:127-130, 260, 389, 413` | Appeler `logSecurityViolation()` lors du rejet 403 sur tentative IDOR d'accès marchand non autorisé. | `TEST-005-R` | **GRAPPE C & B** (`TEST-001`, `TEST-008`, `TEST-010`) |
| **`FIX-004`** | `ANOM-004` | **P1** | Backend : `comptabilite.js:985-989`<br>Frontend : `DrawerCartSuccessModal.tsx` & `useDrawerCartCheckout.ts` | **Double correctif** : Backend HTTP 201 + `fallback_manuel: true` (sans annuler commande) ET Modale panier affichant le numéro de dépôt Wave `777202086` sans émoji (icônes Lucide). | `TEST-009-R` | **GRAPPE A** (`TEST-007`, `TEST-008`, `TEST-013`) |
| **`FIX-005`** | `ANOM-005` | **P3** | `audit/02_PLAN_TESTS/PLAN_TESTS.md:212-214` | Aligner les étapes de test d'audit sur les routes réelles unifiées `/api/boutiques/:id/pos-sessions/...`. | `TEST-010-R` | **GRAPPE B** (`TEST-011`, `TEST-012`) |
| **`FIX-006`** | `ANOM-006` | **P3** | `audit/02_PLAN_TESTS/PLAN_TESTS.md:308, 311` | Intégrer `:slugOrId` de l'agence dans la route du bail et ajuster le seuil minimal de quittance PDF à `> 2 500 octets` (zéro police externe). | `TEST-014-R` | **GRAPPE E & F** (`TEST-006`, `TEST-016`) |

---

## 5. FIX BLOQUÉS & DIRECTIVES D'EXCLUSION

* **AUCUN FIX N'EST BLOQUÉ POUR DÉFAUT D'INFORMATION** (les 6 causes sont 100% élucidées).
* **CONDITIONS BLOQUANTES POUR L'AGENT 6** :
  1. **Interdiction formelle de livrer un patch backend isolé sur `FIX-004`** : L'Agent 6 ne doit pas clore `FIX-004` tant que `DrawerCartSuccessModal.tsx` n'affiche pas les consignes de transfert manuel avec le numéro `777202086`.
  2. **Interdiction formelle d'ajouter une police CDN sur `FIX-006`** : Aucune modification ne doit être apportée à `backend/routes/locatif-immo.js` pour importer une police Google Fonts ou CDN. Seul le plan de tests doit être mis à jour.

---

## 6. PRINCIPAUX RISQUES DE RÉGRESSION

1. **Régression Commande Fantôme Wave (`ANOM-004`)** : Si le frontend ne prévient pas le client de payer manuellement, la commande restera impayée et sera purgée. Le couplage Backend + UI est obligatoire.
2. **Anti-Slop & Émojis (`DrawerCartSuccessModal.tsx`)** : Règle d'or Nopalou absolue : **zéro émoji** (`💳`, `📱`, `⚠️`). Utiliser uniquement `AlertCircle`, `Phone`, `Info` de `lucide-react`.
3. **Droits Collaborateurs (`ANOM-003`)** : Ne pas casser l'accès légitime des employés déclarés dans `boutique_utilisateurs`.

---

## 7. ORDRE D'EXÉCUTION CONSEILLÉ POUR L'AGENT 6

1. **Lot 1 (Tests & Calibrage)** : Appliquer `FIX-005` et `FIX-006` dans `audit/02_PLAN_TESTS/PLAN_TESTS.md`.
2. **Lot 2 (Auth & Profils)** : Appliquer `FIX-001` et `FIX-002` dans `backend/routes/auth.js` et `frontend-next/src/app/actions/auth.ts`.
3. **Lot 3 (Sécurité IDOR)** : Appliquer `FIX-003` dans `backend/routes/boutiques-modules/boutiques-produits.js`.
4. **Lot 4 (Tunnel Commande & Panier Wave)** : Appliquer `FIX-004` dans `comptabilite.js`, `types.ts`, `useDrawerCartCheckout.ts` et `DrawerCartSuccessModal.tsx`.

---

## 8. INTERDICTIONS FORMELLES POUR L'AGENT 6

1. **Interdiction de Git Push sans demande explicite de l'utilisateur** : Tester et valider localement, ne jamais pousser sur `origin main`.
2. **Interdiction de modifier un fichier hors périmètre planifié sans le consigner**.
3. **Interdiction de considérer une modification de fichier comme une preuve de correction** : Chaque FIX doit être rejoué avec son test de validation dédié (`TEST-001-R` à `TEST-014-R`).
4. **Interdiction d'effacer les historiques ou les preuves existantes**.

---

## 9. LIVRABLES ATTENDUS DE L'AGENT 6

À l'issue de sa session d'exécution, l'Agent 6 devra déposer sous `/audit/08_EXECUTION/` :
- `JOURNAL_CORRECTIONS.md` : Journal chronologique des commits et modifications apportées par fichier et par ligne.
- `DIFFS_CORRECTIONS.md` : Les diffs précis de chaque fichier modifié.
- `HANDOVER_AGENT_06.md` : Dossier de passation vers l'Agent 7 (Revue Indépendante des Correctifs).
- Mise à jour de `/audit/00_GOUVERNANCE/HISTORIQUE_SESSIONS.md` et `/audit/00_GOUVERNANCE/ETAT_AUDIT.md`.
