# RÉGRESSION — Agent 8 (SESSION `AUDIT-08-20261004-1150`)

Référence : `audit/02_PLAN_TESTS/REGRESSION_BASELINE.md` (grappes A à F). Les mêmes runners (`scripts/audit/runners/section*.js`) ont été rejoués **contre le HEAD pristine (port 4101, « AVANT »)** et **contre l'arbre corrigé (port 4100, « APRÈS »)**, avec le préchargement `SCRIPTS/xff-preload.js` (anti rate-limit) et le pilote `SCRIPTS/run-baseline.ps1`. Les preuves historiques de l'Agent 6 ont été sauvegardées avant rejeu (`PREUVES/_snapshot_agent6/`) puis **restaurées** après (37 fichiers identiques, Règle 12).

Classes : RÉGRESSION CONFIRMÉE / RÉGRESSION POSSIBLE / AUCUNE RÉGRESSION OBSERVÉE / TEST NON EXÉCUTÉ / TEST BLOQUÉ.

## 1. Résultat par test de la baseline

| TEST | Grappe(s) | AVANT (HEAD 4101) | APRÈS (corrigé 4100) | Différence | Classe | Preuve |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TEST-001 | C | FAIL (téléphone NULL) | PASS | Amélioration (cible FIX-001) | AUCUNE RÉGRESSION OBSERVÉE sur ce test ; **régression cachée** voir §2 | `regression/{before,after}/section1-auth.log` |
| TEST-002 | C | strict FAIL / adapté PASS | strict PASS / adapté PASS | Amélioration (alias `/moi`) | AUCUNE RÉGRESSION OBSERVÉE | idem |
| TEST-003 | C | PASS | PASS | Aucune | AUCUNE RÉGRESSION OBSERVÉE | idem |
| TEST-004 | C | PASS | PASS | Aucune | AUCUNE RÉGRESSION OBSERVÉE | idem |
| TEST-005 | A, B, C | FAIL (pas de trace) | PASS | Amélioration (FIX-003) | AUCUNE RÉGRESSION OBSERVÉE | `section2-idor.log` |
| TEST-006 | E | FAIL (course fire-and-forget) | PASS | Amélioration | AUCUNE RÉGRESSION OBSERVÉE | idem |
| TEST-007 | A | PASS | PASS | Aucune (oracle = recherche de chaîne statique, faible) | AUCUNE RÉGRESSION OBSERVÉE (couverture limitée) | `section3-commerce.log` |
| TEST-008 | A, D | PASS | PASS | Aucune | AUCUNE RÉGRESSION OBSERVÉE | idem |
| TEST-009 | A | FAIL (Wave → 502) | PASS | Amélioration (FIX-004) ; oracle runner faible (201 + commande), complété par `val-fix004.js` | AUCUNE RÉGRESSION OBSERVÉE ; **effets de bord** voir §2 | idem |
| TEST-010 | B | strict FAIL / adapté PASS | strict FAIL / adapté PASS | Aucune (le « strict » vise l'ancienne route, désormais documentée comme fantôme) | AUCUNE RÉGRESSION OBSERVÉE | `section4-pos.log` |
| TEST-011 | B | PASS | PASS | Aucune | AUCUNE RÉGRESSION OBSERVÉE | idem |
| TEST-012 | B, D | PASS (Agent 2/6) | **non rejoué** : runner TS bloqué (`ERR_MODULE_NOT_FOUND`, import sans extension ; ni `tsx` ni équivalent installé) | Compensation partielle : `npm test` frontend 97/97 (parseurs vocaux inclus) ; le module `voice-assistant` n'est pas dans le diff | **TEST BLOQUÉ** (runner) / aucune régression attendue (module non modifié) | `regression/after/frontend_npm_test.txt` |
| TEST-013 | A, D | PASS | PASS | Aucune | AUCUNE RÉGRESSION OBSERVÉE (dédup webhook seulement ; notif marchand 1-clic : voir §2) | `section6-whatsapp.log` |
| TEST-014 | E | strict FAIL / adapté PASS | strict FAIL / adapté PASS | Aucune (produit inchangé) | AUCUNE RÉGRESSION OBSERVÉE | `section7-immo.log` |
| TEST-015 | — | PASS | PASS | Aucune | AUCUNE RÉGRESSION OBSERVÉE | `section8-matching.log` |
| TEST-016 | F | PASS (Agent 6, non rejoué sur HEAD) | PASS (0 violation CDN ; OG racine 200 PNG ; OG produit 200) | Aucune | AUCUNE RÉGRESSION OBSERVÉE (build `:3001` périmé : OG testé sur l'ancien build) | `regression/after/section9-seo-fonts.log`, `TEST-016_preuve-01.json` |

Incident de méthode : un premier rejeu de `section9` sans `audit-env.ps1` a donné FAIL (pas de `DATABASE_URL` → erreur pool, message vide). Il est conservé (`section9-seo-fonts_run1_sans_env_FAIL_invalide.log`) et déclaré **invalide** ; le rejeu correct est PASS.

Contrôles transverses (après) : `npx tsc --noEmit` (frontend-next) exit 0 ; `npm test` frontend 97/97 ; `git status` : aucun fichier suivi modifié par l'Agent 8.

## 2. Matrice de régression par FIX (tests supplémentaires non prévus au plan)

| FIX | TEST | FONCTIONNALITÉ | RÉSULTAT | PREUVE | STATUT |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FIX-001 | V1-07 | Connexion OTP WhatsApp d'un titulaire après inscription e-mail d'un tiers avec son numéro | 409 « Plusieurs comptes… » (AVANT 200) | `FIX-001/after/tests` | **RÉGRESSION CONFIRMÉE** |
| FIX-001 | V1-05 | Inscription avec numéro de 25 chiffres | HTTP 500 (AVANT 201) ; `'123'` → `+123` stocké | idem + `FIX-001/logs` | **RÉGRESSION CONFIRMÉE** (robustesse) |
| FIX-001 | V1-06 | Unicité du numéro (cohérence avec `PUT /profil`) | doublon accepté | idem | RÉGRESSION POSSIBLE (contournement de règle existante AUD-052/055) |
| FIX-001 | V1-08 | Cohérence de format E.164 / OTP | formats divergents | idem | RÉGRESSION POSSIBLE (cause de V1-07) |
| FIX-001 | V1-09/10 | Logout/relogin, normalisation e-mail | PASS | idem | AUCUNE RÉGRESSION OBSERVÉE |
| FIX-002 | V2 (11) | Auth `/profil`, jwt_version, tokens temporaires | 11/11 | `FIX-002/after/tests` | AUCUNE RÉGRESSION OBSERVÉE |
| FIX-003 | V3-02/03/14 | Accès légitime propriétaire / gérant / agence | conservé | `FIX-003/after/tests` | AUCUNE RÉGRESSION OBSERVÉE |
| FIX-003 | V3-11 | Rafale de rejets | 5 rejets = 5 lignes de vault (volume non limité) | idem | RÉGRESSION POSSIBLE (écriture non bornée, `await` ajoute de la latence sur le chemin de rejet) |
| FIX-004 | V4-04/05 | Paiements OM et espèces | inchangés | `FIX-004/after/tests` | AUCUNE RÉGRESSION OBSERVÉE |
| FIX-004 | V4N-02/03 | Notification marchand + client pour commande en repli Wave | **absentes** | `FIX-004/after/tests/*notif*`, `FIX-004/logs` | **RÉGRESSION CONFIRMÉE** par rapport à l'attente métier (AVANT : commande annulée, donc pas de commande à notifier ; APRÈS : commande conservée mais silencieuse + annulée à 2 h) |
| FIX-004 | UI-07 | Règle d'or n°3 (couleurs) | `#ffffff` ajouté dans le diff | `FIX-004/ui/vitest_modal_run.txt` | RÉGRESSION POSSIBLE (conformité design system) |
| FIX-005 | V5 (11) | POS | identique avant/après | `FIX-005/*/tests` | AUCUNE RÉGRESSION OBSERVÉE |
| FIX-006 | V6 (14) | Immo | identique avant/après | `FIX-006/*/tests` | AUCUNE RÉGRESSION OBSERVÉE |

## 3. Synthèse par grappe

| Grappe | Tests | Conclusion |
| :--- | :--- | :--- |
| A (panier/commande) | 007, 008, 009, 013, 005 | PASS ; **mais** effet de bord notification en repli Wave (hors oracle runner) → ne pas conclure « aucune régression » |
| B (POS) | 010, 011, 012, 005 | 010/011/005 PASS ; 012 **bloqué** (runner TS) |
| C (auth) | 001–005 | PASS ; **régression cachée** FIX-001 (OTP 409, 500) |
| D (WhatsApp) | 013, 008, 012 | 013/008 PASS ; 012 bloqué ; aucun fichier de la grappe modifié |
| E (immo) | 006, 014 | PASS (014 adapté) ; fichier `tenantSecurityImmo.js` modifié (1 ligne) couvert par V3-13/14 |
| F (SEO) | 016 | PASS ; build frontend `:3001` périmé |

Aucun rollback requis par les runners, mais les régressions confirmées du §2 invalident l'affirmation de l'Agent 6 « Régressions détectées : 0 ».
