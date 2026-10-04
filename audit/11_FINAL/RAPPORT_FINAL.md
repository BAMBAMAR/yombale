# RAPPORT FINAL DE CAMPAGNE D'AUDIT — NOPALOU

```text
SESSION-ID        : AUDIT-09-20261004-1704
AGENT             : AGENT 9 — Audit final, synthèse et clôture
DATE / HEURE      : 2026-10-04 / 17:04 UTC (session ouverte)
COMMIT AUDITÉ     : 4c0237273fde2d058d5eabca5f94b79ceb07d37e (branche main)
ÉTAT DU CODE      : HEAD + 9 fichiers suivis modifiés NON COMMITÉS (aucun push) ; dossier audit/ NON SUIVI par git
ENVIRONNEMENT     : local isolé (PostgreSQL nopalou_audit :54329, Express :4100 corrigé / :4101 HEAD pristine, Next :3001 périmé, garde réseau audit-guard.js)
DERNIÈRE SESSION  : AUDIT-08-20261004-1150 (Agent 8, dernière écriture 17:01)
CODE APPLICATIF MODIFIÉ PAR L'AGENT 9 : AUCUN
```

> **Statut global : `AUDIT NON CLÔTURABLE`**
> Six corrections ont été exécutées. Une seule (FIX-002) est validée comme correction de comportement. Deux autres (FIX-005, FIX-006) sont validées seulement comme corrections de la spécification de test : le produit n'a pas changé. Trois (FIX-001, FIX-003, FIX-004) sont partielles. Deux d'entre elles ont introduit des régressions confirmées. Deux constats P1 restent ouverts. Douze fonctionnalités cartographiées sur 22 n'ont aucun test. La campagne ne permet pas de conclure que le périmètre de Nopalou est validé.

Les niveaux de certitude utilisés sont : **FAIT DÉMONTRÉ** (test et preuve disponibles), **CONCLUSION TECHNIQUE DÉMONTRÉE**, **HYPOTHÈSE**, **INCONNU**.

---

## 1. Résumé exécutif

### 1.1 Périmètre réellement audité

Le périmètre cartographié par l'Agent 1 comprend 22 fonctionnalités, 10 parcours critiques, 12 rôles et 13 modules. Le plan de tests ne couvre qu'une partie de ce périmètre : **16 tests** (`TEST-001` à `TEST-016`).

La mention « 100 % du plan exécuté » (Agent 2) signifie 16 tests sur 16. Elle **ne signifie pas** 100 % du produit. Ratio fonctionnalités avec au moins un test réellement dédié : **10/22** (voir §3).

### 1.2 Chiffres clés

| Indicateur | Valeur | Statut de la donnée |
| :--- | :--- | :--- |
| Tests planifiés | 16 | FAIT DÉMONTRÉ |
| Tests exécutés (campagne initiale, Agent 2) | 16/16 | FAIT DÉMONTRÉ |
| Résultat initial | strict : 10 PASS / 6 FAIL ; adapté : 13 PASS / 3 FAIL ; 0 BLOCKED | FAIT DÉMONTRÉ (preuves originales écrasées, voir §8.2) |
| Baseline de non-régression rejouée (Agent 8) | 15/16 ; TEST-012 BLOQUÉ (runner TypeScript) | FAIT DÉMONTRÉ |
| Vérifications complémentaires de retest (Agent 8, hors plan) | 79 : 67 PASS / 12 FAIL sur l'arbre corrigé | Décompte Agent 9 à partir des tables de l'Agent 8 |
| **Statut final des 16 tests** | **8 PASS FINAL, 8 PARTIEL, 0 FAIL FINAL, 0 NON EXÉCUTÉ** | Jugement Agent 9, voir `MATRICE_FINALE.md` |
| Anomalies initiales | 6 (`ANOM-001` à `ANOM-006`) | FAIT DÉMONTRÉ |
| Nouvelles constatations (Agent 8) | 12 (`VAL8-001` à `VAL8-012`), toutes OUVERTES | FAIT DÉMONTRÉ pour 001-005 et 007-009 (Agent 8 ; 001 et 002 revérifiées dans le code par l'Agent 9). Le reste est de portée plus faible. |
| Corrections planifiées / exécutées | 6 / 6 | FAIT DÉMONTRÉ (`git diff`) |
| Corrections validées comme changement de comportement | 1 (FIX-002) | Réserve : contre-expertise Agent 7 absente |
| Corrections validées de façon documentaire seulement | 2 (FIX-005, FIX-006) | Aucun changement produit |
| Corrections partielles | 3 (FIX-001, FIX-003, FIX-004) | FAIT DÉMONTRÉ |
| Régressions confirmées | 3 (V1-07, V1-05, V4N-02/03) | FAIT DÉMONTRÉ |
| Régressions possibles | 4 (V1-06, V1-08, V3-11, UI-07) | HYPOTHÈSE étayée |
| Risques résiduels | 2 CRITIQUE-conditionnel/ÉLEVÉ (voir §9), 6 MOYEN, 3 FAIBLE | voir §9 |
| **Statut global** | **AUDIT NON CLÔTURABLE** | §11 |

### 1.3 Message principal

La déclaration de l'Agent 6 « 6 FIX validés, 0 régression, 16/16 PASS » est **réfutée** par les preuves de l'Agent 8. Les preuves de l'Agent 8 sont reproductibles : l'Agent 9 en a recoupé deux dans le code source (VAL8-001 et VAL8-002, §4.2). Cette déclaration figure encore dans `CLAUDE.md` et dans `JOURNAL_MODIFICATIONS.md`. Elle ne doit pas être reprise.

---

## 2. Méthodologie

### 2.1 Chaîne attendue

```text
Agent 1 : cartographie + plan de tests              → présent (HANDOVER_AGENT_01)
Agent 2 : exécution des tests initiaux              → présent (HANDOVER_AGENT_02)
Agent 3 : analyse des causes                        → présent (HANDOVER_AGENT_03)
Agent 4 : contre-expertise des causes               → présent (HANDOVER_AGENT_04)
Agent 5 : plan de remédiation                       → présent (HANDOVER_AGENT_05)
Agent 6 : exécution des corrections                 → présent (HANDOVER_AGENT_06)
Agent 7 : contre-expertise de l'exécution           → ABSENT (aucun livrable)
Agent 8 : retest + non-régression                   → présent (HANDOVER_AGENT_08)
Agent 9 : audit final                               → ce rapport
```

### 2.2 Ruptures de la chaîne documentaire (FAITS)

| # | Rupture | Constat | Conséquence |
| :-: | :--- | :--- | :--- |
| R1 | **Agent 7 absent** | `/audit/09_CONTRE_EXPERTISE_CORRECTIONS/` n'existe pas, et `REVUE_EXECUTION.md` et `HANDOVER_AGENT_07.md` n'ont jamais été produits. Les répertoires vides `09_VALIDATION/` et `10_REGRESSION/` existent. `HANDOVER_AGENT_06` demandait à l'Agent 7 de livrer dans `/audit/09_VALIDATION/`, alors que la présente mission attend `09_CONTRE_EXPERTISE_CORRECTIONS/`. **Hypothèse** : l'écart de chemin explique l'absence. Ce n'est pas démontré. | Pour chacun des 6 FIX, l'étape « exécution contre-expertisée » est absente. Au sens strict de la règle de consolidation, aucun FIX ne peut être « VALIDÉ » sans réserve. |
| R2 | **Preuves initiales écrasées** | Les 16 fichiers de `04_RESULTATS/PREUVES/` datent de 11:29-11:37, c'est-à-dire de la session de l'Agent 6. Les runners écrivent dans ce dossier, et les preuves FAIL d'origine de l'Agent 2 ont donc été remplacées par des preuves post-correction. Il ne reste que 12 fichiers courts « AVANT/APRÈS » dans `08_EXECUTION/PREUVES/` (341 à 601 octets pour les « AVANT »). | Violation de la Règle 12. L'Agent 8 a compensé en reconstruisant un « AVANT » sur HEAD pristine (port 4101). L'état initial n'est donc plus prouvé par les artefacts d'origine mais par un rejeu. |
| R3 | **Oracles réécrits** | FIX-002, FIX-005 et FIX-006 modifient `PLAN_TESTS.md` et les runners pour aligner la spécification sur le produit. L'état d'origine de `PLAN_TESTS.md` n'est pas versionné : `audit/` n'est pas suivi par git et `DIFFS_CORRECTIONS.md` ne contient pas ce diff. | La correction d'un faux positif de spécification est légitime (cause confirmée par l'Agent 4). La preuve de l'état d'origine n'est plus recontrôlable. |
| R4 | **Déclarations Agent 6 contredites** | « 6/6 PASS, 0 régression, aucun problème non résolu » contredit l'Agent 8 (3 partiels, 3 régressions confirmées). | Résolu en faveur de l'Agent 8 (§6). |
| R5 | **Incohérence de seuil documentaire** | `PLAN_TESTS.md:311` dit `> 2 500 octets`, le runner contient `pdfSize > 1000` (`section7-immo.js:186`). | VAL8-011 confirmé par l'Agent 9 par lecture directe. Le seuil réel est 1 000. |
| R6 | **Sections de gouvernance périmées** | `REGISTRE_ANOMALIES.md` §3 affiche encore « EXECUTED / VALIDATION PASS » pour ANOM-001 à 006, et `MATRICE_TRACEABILITE.md` « PASS (Post-Fix) ». L'Agent 8 a ajouté des tableaux correctifs en dessous. Un lecteur qui s'arrête au tableau principal obtient un verdict faux. | Corrigé par ajout dans ce cycle (§ « Mises à jour de gouvernance »). Aucune ligne historique supprimée. |
| R7 | **Constats hors chaîne** | `CLAUDE.md` (« audit de base factuel ») cite des constats « démontrés » : soft-404 sur fiches inconnues (AUD-153 non corrigé), erreurs React #425/#422 sur `/boutiques` (AUD-229 incomplet), clic Espèces du panier non vérifié (BASE-003). Aucun rapport correspondant n'a été trouvé dans `/audit/`, et ces constats n'apparaissent ni dans le registre ni dans le plan. | **NON DÉMONTRÉS dans cette chaîne** et NON RETESTÉS. À reprendre (§10). |
| R8 | **Formats de SESSION-ID hétérogènes** | `NOPALOU-AUDIT-AGENT-0X-…`, `AUDIT-2026-00X-AGXX`, `AUDIT-08-YYYYMMDD-HHMM`. | Mineur. Aucune session n'est ambiguë. |

### 2.3 Ce que l'Agent 9 a fait lui-même

L'Agent 9 n'a pas rejoué la campagne. Il a effectué les contrôles suivants :

- Lecture de tous les documents de gouvernance, cartographie, plan, résultats, causes, contre-expertise, plan de correction, exécution et validation.
- Revue du `git diff` de `auth.js` (FIX-001 et FIX-002) et de `comptabilite.js` (FIX-003 et FIX-004).
- Vérification dans le code : colonne `utilisateurs.telephone VARCHAR(20)` (`migrate-inline.js:145`), refus OTP « Plusieurs comptes » (`auth.js:701, 810, 927`), absence de `logSecurityViolation` dans `boutiques-integrations`, `credits`, `entrepots` et `boutiques-retours`, et présence de 2 gardes `if (!own)` dans `boutiques-club-vip.js` et 1 dans `boutiques-crud.js`.
- Lecture de la preuve brute `FIX-001_validation_after.json` (V1-06, V1-07, V1-08 : valeurs observées conformes à la synthèse de l'Agent 8).
- Contrôle croisé des preuves avant/après de `TEST-006` (`regression/{before,after}/section2-idor.log`).
- Vérification de l'état git (9 fichiers modifiés, `audit/` non suivi, aucun push).

---

## 3. Couverture

Comparaison : fonctionnalités réelles (inventaire de l'Agent 1) / tests prévus / tests exécutés / tests validés.

| Fonctionnalité | Criticité | Test(s) dédié(s) | Exécuté | Statut final | Remarque |
| :--- | :-: | :--- | :-: | :--- | :--- |
| F-001 Inscription | P0 | TEST-001 | oui | PARTIEL | téléphone persisté ; régressions P1/P2 |
| F-002 Connexion et sessions | P0 | TEST-002 | oui | PASS FINAL | `/moi` et `/profil` ; jwt_version |
| F-003 Mot de passe | P0 | TEST-003 (étanchéité des jetons seulement) | oui | PARTIEL | le parcours « mot de passe oublié » n'a jamais été joué |
| F-004 Suppression RGPD | P1 | TEST-004 | oui | PASS FINAL | période de grâce et restauration ; l'anonymisation à 30 jours n'est pas testée |
| F-005 Catalogue, recherche | P0 | aucun (la matrice de couverture renvoie par erreur à TEST-005) | **non** | NON EXÉCUTÉ | |
| F-006 Fiche produit, comparateur | — | aucun | **non** | NON EXÉCUTÉ | |
| F-007 Vitrine boutique | P0 | TEST-005 (IDOR seulement) | partiel | PARTIEL | |
| F-008 Panier, livraison | P1 | TEST-007 | analyse statique | PARTIEL | pas de rendu navigateur |
| F-009 Commande, paiement | P0 | TEST-008, 009 | oui | PARTIEL | passerelles simulées ; régression Wave |
| F-010 Sessions de caisse | P0 | TEST-010 | oui | PASS FINAL (spécification réécrite) | défauts V5-03/07 ouverts |
| F-011 Encaissement tactile / scan | P0 | aucun (renvoi à TEST-010) | **non** | NON EXÉCUTÉ | |
| F-012 Voix Wolof/Français | P1 | TEST-012 | oui | PARTIEL | parseur seul ; rejeu bloqué |
| F-013 Offline / synchronisation | P0 | TEST-011 | oui (API) | PARTIEL | IndexedDB et Service Worker non exécutés |
| F-014 Carnet de dettes | P1 | aucun (renvoi à TEST-010) | **non** | NON EXÉCUTÉ | |
| F-015 Commandes WhatsApp | P0 | TEST-013 | oui | PASS FINAL (périmètre étroit) | déduplication du webhook seulement |
| F-016 Ajout produit par photo WhatsApp | — | aucun | **non** | NON EXÉCUTÉ | |
| F-017 Portefeuille de biens, vitrine agence | — | aucun | **non** | NON EXÉCUTÉ | |
| F-018 Baux, quittances | P0 | TEST-006, 014 | oui | PASS FINAL (spécification réécrite) | **VAL8-009 (P1) ouvert** |
| F-019 Scraping | P1 | TEST-015 | oui | PARTIEL | seul le matching est testé |
| F-020 Matching | — | TEST-015 | oui | PASS FINAL | 3 offres de test |
| F-021 Prospection WhatsApp | — | aucun | **non** | NON EXÉCUTÉ | |
| F-022 Administration, RBAC | — | aucun | **non** | NON EXÉCUTÉ | statistiques et actions admin jamais comparées aux données |
| M-13 SEO, polices | P1 | TEST-016 | oui | PARTIEL | OpenGraph vérifié sur un build périmé |

**Bilan : 10 fonctionnalités sur 22 ont au moins un test dédié, 12 n'en ont aucun** (F-005, 006, 011, 014, 016, 017, 021, 022, ainsi que les parties non testées de F-003, F-007 et F-019).

Parcours critiques :
- **Testés en partie :** PARCOURS-01, 02, 03, 04, 05, 07, 08, 09.
- **Non testés :** PARCOURS-06 (annonces) et PARCOURS-10 (prospection).
- **Aucun parcours n'a été joué de bout en bout dans un navigateur.**

Rôles testés : anonyme, utilisateur simple, propriétaire de boutique, gérant (V3-03), agent d'agence et agent d'une autre agence. **Non testés : tous les rôles administrateur** (modérateur, financier, super-admin).

Appareils : **aucun** (ni mobile, ni responsive).

---

## 4. Résultats démontrés

### 4.1 FAITS DÉMONTRÉS (test, preuve et reproduction indépendante)

| Résultat | Preuve |
| :--- | :--- |
| `POST /api/auth/inscription` ne persistait pas `telephone` sur HEAD. | Agent 8 : V1-01 AVANT (FIX-001 `before/tests`) |
| `GET /api/auth/moi` renvoyait 404 sur HEAD. Après correction, `/moi` et `/profil` répondent identiquement (11/11) et l'ancien jeton est révoqué après déconnexion. | FIX-002 `before` 2/11, `after` 11/11 |
| Les jetons de type `reset` sont refusés comme session (401). | TEST-003, rejoué en baseline |
| La suppression de compte est réversible pendant la période de grâce. | TEST-004 (payload du plan écarté, voir 4.3) |
| `POST /produits` cross-boutique renvoie 403 et, après FIX-003, journalise dans `security_audit_vault`. Le propriétaire et le gérant conservent l'accès. | V3-01/02/03/04/05 |
| Wave indisponible : HEAD renvoie 502 et annule la commande. Après FIX-004 : 201, `fallback_manuel`, commande `en_attente`, stock réservé. Paiements Orange Money, espèces, double soumission et concurrence sur le dernier article inchangés ou corrects. | V4-01 à 09 |
| Création de commande : total exact, lignes persistées, pas de `ReferenceError`. | TEST-008 |
| Cycle de caisse sur les routes `/pos-sessions` : ouverture 25 000, sortie 5 000, clôture 20 000, écart 0. | TEST-010 adapté ; V5-02/04/05/06 |
| Vente POS rejouée : 201 puis 200 `duplicate`, 1 vente, stock 10 vers 9. | TEST-011 ; V5-10 |
| Webhook WhatsApp : 200 en 14 ms, doublon ignoré, 1 ligne en base. | TEST-013 |
| Bail créé par UUID et par slug, encaissement exact, PDF valide (`%PDF`, polices Helvetica, aucune URL externe), 12 échéances. | V6 (12/14) |
| Aucune occurrence de CDN de polices dans les sources frontend. | TEST-016, `section9-seo-fonts.log` |
| `tsc --noEmit` frontend : exit 0. `npm test` frontend : 97/97. | `regression/after/frontend_npm_test.txt` |

### 4.2 CONCLUSIONS TECHNIQUES DÉMONTRÉES (preuves dynamiques de l'Agent 8, confirmées par le code)

| Conclusion | Éléments |
| :--- | :--- |
| **Régression OTP (VAL8-001)** : un tiers qui s'inscrit par e-mail avec le numéro d'un titulaire OTP bloque la connexion OTP du titulaire (409). | V1-07 : `otp_login_status: 409` après l'inscription de l'attaquant. Code : `auth.js:809-810` refuse la connexion si plusieurs comptes partagent le numéro. Le diff de FIX-001 n'ajoute aucune unicité ni preuve de possession du numéro. |
| **500 sur numéro de plus de 20 chiffres (VAL8-002)** | V1-05. Code : `utilisateurs.telephone VARCHAR(20)` (`migrate-inline.js:145`). Le diff n'ajoute aucune validation de longueur. |
| **Incohérence de format (VAL8-003)** : l'inscription stocke `+221…`, `PUT /profil` stocke sans `+`. | V1-08 (`771912409` contre `+221771912409`). |
| **FIX-003 incomplet** : des rejets 403 ne sont pas journalisés. | Code : `logSecurityViolation` est absent de `boutiques-integrations`, `credits`, `entrepots` et `boutiques-retours`, que l'Agent 4 citait explicitement. Des gardes `if (!own)` existent dans `boutiques-club-vip.js` (×2) et `boutiques-crud.js` (×1). Le périmètre de la déviation DEV-001 (« étendu aux autres routes sensibles de `boutiques-modules` ») n'est donc **pas** confirmé par le diff. |
| **Repli Wave silencieux (VAL8-004)** : aucune notification marchand ni client en repli, et le cron annule la commande à 2 h. | V4N-02/03. Le diff supprime l'appel d'annulation de la route de repli mais n'ajoute aucun appel à `notifierCommande()`. |

### 4.3 Observations méthodologiques sur des résultats « PASS »

- **TEST-004 :** le « PASS (avec adaptation payload) » indique que le plan exigeait un payload différent de `confirmation: 'SUPPRIMER'`. Cet écart plan/code n'a pas été enregistré comme anomalie.
- **TEST-006 :** voir §6.2 (contradiction).
- **TEST-007 :** le PASS est une analyse statique de code (chaîne de caractères). La Règle 02 précise que la lecture du code ne vaut pas exécution.
- **TEST-011 :** le plan demandait « vente stockée dans IndexedDB et réconciliée ». Le test n'exerce que le rejeu API.
- **TEST-012 :** le runner TypeScript ne tourne plus (`ERR_MODULE_NOT_FOUND`). La phrase 1 (« Vente 2 junni ») renvoie `separateur.quantite = 1` pour un montant de 10 000. Le sens est cohérent mais la sémantique quantité/montant mérite un contrôle.

---

## 5. Anomalies — état final

Détail complet dans `MATRICE_FINALE.md`.

| Anomalie | Statut final | Certitude |
| :--- | :--- | :--- |
| ANOM-001 (téléphone non persisté) | **RÉSOLUE PARTIELLEMENT** avec **RÉGRESSION** associée (VAL8-001 P1, 002, 003) | FAIT DÉMONTRÉ |
| ANOM-002 (route `/moi`) | **RÉSOLUE ET VALIDÉE** (réserve : contre-expertise exécution absente) | FAIT DÉMONTRÉ |
| ANOM-003 (journalisation IDOR) | **RÉSOLUE PARTIELLEMENT** (4 mutations couvertes, au moins 6 sites non tracés) | FAIT DÉMONTRÉ |
| ANOM-004 (Wave 502) | **RÉSOLUE PARTIELLEMENT** avec **RÉGRESSION** (repli silencieux) ; arbitrage produit requis (§9, R3) | FAIT DÉMONTRÉ |
| ANOM-005 (routes POS) | **FAUX POSITIF CONFIRMÉ** : spécification erronée, produit inchangé. Défauts préexistants VAL8-007 ouverts. | CONCLUSION TECHNIQUE DÉMONTRÉE |
| ANOM-006 (bail, quittance) | **FAUX POSITIF CONFIRMÉ** : spécification erronée, produit inchangé. VAL8-008 et VAL8-009 (P1) ouverts. | CONCLUSION TECHNIQUE DÉMONTRÉE |
| VAL8-001 à VAL8-012 | **NON RÉSOLUES** (12 ouvertes) | voir `MATRICE_FINALE.md` |

Sur 6 anomalies initiales :
- 1 résolue et validée.
- 2 fausses alertes de spécification.
- 3 résolues partiellement, dont 2 avec régression.
- 0 non traitée.

Les 12 constats `VAL8-*` sont sans traitement. Aucune n'est passée par la chaîne cause, contre-expertise, fix. Elles relèvent d'un nouveau cycle (Agent 5 et suivants).

---

## 6. Corrections

### 6.1 État final de chaque FIX

| FIX | Cause | Exécution | Contre-exp. exécution | Retest (Agent 8) | Régression | **État final** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FIX-001 | CAUSE-001 confirmée | `auth.js`, `actions/auth.ts` | **ABSENTE** | TEST-001 FAIL vers PASS ; V1-05/06/07/08 FAIL | **CONFIRMÉE** | **RÉSOLU PARTIELLEMENT + RÉGRESSION** |
| FIX-002 | CAUSE-002 confirmée | alias `/moi` (diff relu par l'Agent 9 : 6 lignes, même handler et `verifierToken`) | **ABSENTE** | 2/11 vers 11/11 | aucune | **RÉSOLU ET VALIDÉ** (réserve de chaîne) |
| FIX-003 | CAUSE-003 partielle (périmètre élargi par l'Agent 4) | produits, `comptabilite.js`, `tenantSecurityImmo.js` | **ABSENTE** | 7/14 vers 13/14 | aucune sur accès légitimes | **RÉSOLU PARTIELLEMENT** |
| FIX-004 | CAUSE-004 partielle (cause multiple) | backend + 3 fichiers panier | **ABSENTE** | backend 9/9 ; UI jsdom 6/7 ; V4N-02/03 FAIL | **CONFIRMÉE** | **RÉSOLU PARTIELLEMENT + RÉGRESSION** |
| FIX-005 | CAUSE-005 confirmée (spécification) | `PLAN_TESTS.md` + runner | **ABSENTE** | 9/11 = 9/11 | aucune | **RÉSOLU ET VALIDÉ — documentaire uniquement** |
| FIX-006 | CAUSE-006 confirmée (spécification) | `PLAN_TESTS.md` + runner | **ABSENTE** | 12/14 = 12/14 | aucune | **RÉSOLU ET VALIDÉ — documentaire uniquement** |

> « RÉSOLU ET VALIDÉ » pour FIX-005 et FIX-006 signifie que l'oracle de test a été rendu exact. **Aucun comportement du produit n'a été corrigé.**

### 6.2 Contradictions inter-agents (et arbitrage)

| # | Contradiction | Arbitrage de l'Agent 9 |
| :-: | :--- | :--- |
| C1 | Agent 6 : « 6/6 PASS, 0 régression » ; Agent 8 : 3 partiels, 3 régressions confirmées. | **Agent 8 retenu.** Preuves brutes disponibles et recoupées dans le code pour VAL8-001/002. |
| C2 | **TEST-006** : PASS (Agent 2, 2 lignes en vault). L'Agent 8 le rejoue sur HEAD pristine : **FAIL** (course fire-and-forget). Aucune anomalie n'a été ouverte, aucune cause analysée. | **Non réconcilié.** Hypothèse de l'Agent 8 : course d'écriture, corrigée par `await` dans `tenantSecurityImmo.js`. Elle repose sur **un seul rejeu**. Statut : PASS FINAL sur l'arbre corrigé, avec rupture de traçabilité (correction sans anomalie ni cause). Intermittence NON DÉMONTRÉE. |
| C3 | Agent 4 : étendre FIX-003 à `boutiques-produits`, `integrations`, `credits`, `entrepots`, `retours`. Agent 6 / DEV-001 : « scope étendu ». Diff : seuls produits, `comptabilite` et `tenantSecurityImmo` sont touchés. | **DEV-001 non confirmée.** FIX-003 est sous-exécuté par rapport à la directive de l'Agent 4. |
| C4 | Agent 4 et Agent 6 : FIX-004 restaure « CLAUDE.md:58 ». La suppression du repli par AUD-083 avait été faite délibérément (le commentaire supprimé dit : « annulation silencieuse 2 h plus tard »). FIX-004 recrée l'annulation silencieuse à 2 h pour le paiement manuel. | **Arbitrage produit nécessaire** (AUD-083 contre la règle de repli de `CLAUDE.md`). Voir §9, R3. |
| C5 | Agent 6 : seuil PDF `> 2 500`. Code : `> 1000`. | Code retenu. Écart documentaire (VAL8-011). |
| C6 | Agent 8 : VAL8-010 « authLimiter contournable par X-Forwarded-For ». | **Portée à nuancer** : constaté sans proxy devant l'application. Avec `trust proxy=1` derrière un proxy unique qui ajoute l'IP à droite, le contournement par en-tête n'est pas attendu. **HYPOTHÈSE**, non testée en production. |

### 6.3 Corrections réellement validées

Au sens strict, **FIX-002 seul** est validé comme changement de comportement. FIX-005 et FIX-006 sont des validations de spécification.

La part vérifiée de FIX-001, FIX-003 et FIX-004 (téléphone persisté pour les saisies valides, 403 tracés sur les 4 mutations produit, 201 en repli Wave avec stock conservé) est **démontrée**. Ces trois corrections **ne doivent pas** être considérées comme livrables en l'état (voir §9).

---

## 7. Régressions

| Régression | Statut | Preuve | Gravité retenue |
| :--- | :--- | :--- | :-: |
| **V1-07** : verrouillage de la connexion OTP du titulaire (409) par inscription e-mail avec son numéro | **CONFIRMÉE** | `FIX-001/after/tests`, code `auth.js:809` | P1 |
| **V1-05** : 500 sur numéro de plus de 20 chiffres ; `'123'` stocké comme `+123` | **CONFIRMÉE** | `FIX-001/after`, `logs/backend4100_signup_500_excerpt.log` | P2 |
| **V4N-02/03** : commande Wave en repli sans notification marchand ni client, annulée à 2 h | **CONFIRMÉE** par rapport à l'attente métier | `FIX-004/after/tests/*notif*` | P2 |
| V1-06 : doublon de téléphone accepté (contourne la règle de `PUT /profil`) | POSSIBLE (cohérence avec AUD-052/055) | `FIX-001/after` | P2 |
| V1-08 : formats de téléphone divergents | POSSIBLE (cause de V1-07) | idem | P2 |
| V3-11 : écriture non bornée dans le vault en rafale ; `await` sur le chemin de rejet | POSSIBLE | `FIX-003/after` | P3 |
| UI-07 : `#ffffff` ajouté dans la modale (règle d'or n°3) | POSSIBLE (revue de diff, non détecté en jsdom) | `FIX-004/ui` | P3 |

### 7.1 Absence de régression : NON DÉMONTRÉE

`AUCUNE RÉGRESSION` ne peut pas être affirmée pour le périmètre global.

- **Raison 1.** TEST-012 est bloqué. Ce n'est pas une régression connue (le module vocal n'est pas dans le diff), mais l'absence de régression n'est pas rejouée.
- **Raison 2.** La modale panier n'a été vérifiée que par un rendu jsdom. Le build `:3001` est périmé, donc le parcours navigateur réel est **non exécuté**.
- **Raison 3.** Les flux voisins de `auth.js` n'ont pas été rejoués : `whatsapp-otp-register`, lien magique, connexion OTP hors le cas V1-07, réinitialisation de mot de passe.
- **Raison 4.** `comptabilite.js` a été modifié mais seules les routes de création de commande sont rejouées.
- **Raison 5.** 12 fonctionnalités n'ont aucun test, donc aucune baseline de non-régression.
- **Raison 6.** Les trois régressions confirmées sont toutes hors oracle runner. Elles ont été trouvées par des tests complémentaires de l'Agent 8. La baseline du plan (A à F) donnait « aucune régression » pour les mêmes cas. **L'oracle de la baseline est insuffisant.**

---

## 8. Tests bloqués, non exécutés et limites

### 8.1 Tests et scénarios bloqués ou non exécutés

| TEST / SCÉNARIO | RAISON DU BLOCAGE | IMPACT SUR LA CONFIANCE | CE QUI MANQUE | CONSÉQUENCE SUR LA CONCLUSION |
| :--- | :--- | :--- | :--- | :--- |
| TEST-012 (rejeu baseline) | Runner TS : import sans extension, `tsx` absent (`ERR_MODULE_NOT_FOUND`) | Moyen | Runner exécutable ; chaîne voix vers donnée finale | La qualité du moteur vocal ne peut pas être conclue au-delà du parseur sur 4 phrases. |
| Envoi réel OTP / WhatsApp | API externes interdites par la garde réseau | Élevé | Sandbox Meta / provider | Aucune action WhatsApp réelle n'est démontrée. Seule la déduplication entrante l'est. |
| Wave, Orange Money réels | Idem | Élevé | Sandbox ou clés de test | Le paiement n'est pas démontré de bout en bout. Le repli est testé contre une panne simulée. |
| Parcours navigateur du panier et de la modale FIX-004 | Build `:3001` périmé (antérieur à f6e22b9f), non reconstruit | Élevé | Build à jour + navigateur réel | UX, responsive, mobile et PWA ne peuvent pas être conclus. |
| Panier, recherche, catalogue, fiche produit (F-005, 006) | Aucun test écrit (mappage erroné de F-005 sur TEST-005) | Élevé | Plan et tests | Le cœur de la découverte produit n'est pas évalué. |
| Administration (F-022), rôles admin | Aucun test | Élevé | Plan, comptes, données | Les statistiques et actions admin ne sont pas comparées aux données. |
| Annonces, petites annonces (PARCOURS-06) | Aucun test | Moyen | Plan | Modération et sponsoring non évalués. |
| Prospection (F-021, PARCOURS-10) | Aucun test | Moyen | Plan | Envoi, STOP, blacklist non évalués. |
| Scraping réel (volume et qualité) | Aucun test du scraper ; le matching est testé sur 3 offres | Élevé | Fixtures HTML ou mocks de sources, mesure de volume et de qualité | La qualité du scraping ne peut pas être conclue. |
| Récupération de mot de passe | Non joué | Élevé | Parcours complet | Le parcours de compte n'est pas complet. |
| Offline réel (IndexedDB, Service Worker) | Non exécuté en navigateur | Élevé | Navigateur plus coupure réseau | La résilience hors-ligne n'est pas démontrée au-delà de l'idempotence API. |
| Performance, charge | Non testée | Moyen | Plan | Rien ne peut être dit. |
| Appareils réels / mobile | Non testés | Moyen | — | Idem. |

### 8.2 Limites de l'audit

- Base de données locale quasi vide. Données de test uniquement (`*@audit8.test`).
- Les « AVANT » de l'Agent 8 sont rejoués (HEAD pristine) et non lus dans les preuves d'origine (écrasées).
- Les tests de sécurité sont des contrôles ciblés d'accès croisé. **Ce n'est pas un test d'intrusion.**
- Un premier rejeu de `section9` a échoué faute de `DATABASE_URL`. Il est conservé et déclaré invalide par l'Agent 8.
- Les fichiers `backend/.fb-scraper-*.json` ont été modifiés à 16:16, en dehors de la fenêtre des sessions d'audit connues. **INCONNU** : lien avec l'audit non établi. À vérifier au regard de la règle d'isolation (aucun appel externe réel).

---

## 9. Risques résiduels

### 9.1 Risques à priorité haute

| ID | Classe | Description | Preuve | Fonctionnalité | Impact | Statut | Test associé |
| :-: | :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| R1 | **CRITIQUE si FIX-001 est déployé en l'état** | Un tiers peut empêcher un titulaire de se connecter par OTP en s'inscrivant avec son numéro. Aucune preuve de possession n'est exigée. Le formulaire e-mail n'a pas de champ téléphone (VAL8-012), donc l'exploitation passe par l'API publique. **Le code n'est pas déployé** (non commité), donc la production n'est pas touchée à ce jour. | V1-07 ; `auth.js:809-810` | Comptes / Authentification | Indisponibilité de compte ciblée jusqu'au support | OUVERT (VAL8-001) | V1-07 |
| R2 | **ÉLEVÉ** (présent aujourd'hui) | Un agent d'une agence peut créer un bail (201) lié au bien, au locataire et au propriétaire d'une autre agence. Aucune lecture de données de l'agence Y n'a été démontrée. **Impact exact INCONNU.** | V6-12b | Immobilier / multi-tenant | Intégrité inter-tenants ; fuite possible si les liaisons exposent des données | OUVERT (VAL8-009), préexistant | V6-12b |
| R3 | **ÉLEVÉ** | Repli Wave : commande conservée mais sans notification marchand ni client, puis annulée à 2 h. Le client peut avoir payé manuellement sans rapprochement. Le paiement manuel effectif est une **HYPOTHÈSE**. L'annulation à 2 h est un FAIT. C'est la situation qu'AUD-083 voulait supprimer. Le numéro `777202086` est codé en dur (backend et frontend). | V4N-02/03 ; cron `annulerCommandesImpayeesExpirees` | Commande / Paiement | Perte de vente ou commande payée puis annulée | OUVERT (VAL8-004). **Décision produit requise.** | V4N-02/03 |
| R4 | **ÉLEVÉ** (par l'inconnu) | 12 fonctionnalités sans test, dont recherche, administration, paiements réels, chatbot IA et annonces. | §3 | Multiples | Aucune assurance de fonctionnement | NON TESTÉ | — |

### 9.2 Risques moyens et faibles

| ID | Classe | Description | Preuve | Statut |
| :-: | :-: | :--- | :--- | :--- |
| R5 | MOYEN | Rejets 403 non journalisés sur au moins 6 sites (`partage`, `batch`, `composants`, `boutiques-crud.js:1654`, `boutiques-club-vip.js:66/83`) ; `requireBoutiqueOwnership` sans `await`. Le blocage 403 fonctionne, seule la trace manque. | V3-06 | OUVERT (VAL8-005) |
| R6 | MOYEN | Inscription : numéro invalide stocké, doublon accepté, formats divergents, 500 au-delà de 20 chiffres. | V1-05/06/08 | OUVERT (VAL8-002/003) |
| R7 | MOYEN | POS : deux sessions ouvertes simultanément ; mouvement accepté sur session clôturée. L'écart de clôture erroné n'est pas démontré. | V5-03/07 | OUVERT (VAL8-007), préexistant |
| R8 | MOYEN | Processus : le code corrigé et `audit/` ne sont pas commités. Les preuves et le diff sont à la merci d'un `git clean`. `CLAUDE.md` contient encore l'affirmation « 100 % / 0 régression ». | `git status` | OUVERT (VAL8-011) |
| R9 | MOYEN | UI FIX-004 : couleurs hors tokens (`#ffffff`), textes hors `t()`, numéro de dépôt codé en dur. | UI-07 | OUVERT (VAL8-006) |
| R10 | MOYEN | Constats « audit de base » (soft-404, erreurs React #425/#422, clic Espèces non vérifié) non rattachés à la chaîne. | `CLAUDE.md` | NON DÉMONTRÉS ici |
| R11 | FAIBLE | `GET /public/quittance/<id invalide>.pdf` renvoie 500. | V6-10 | OUVERT (VAL8-008), préexistant |
| R12 | FAIBLE | `authLimiter` contournable par `X-Forwarded-For` dans le banc de test. Exploitabilité en production : HYPOTHÈSE, non testée. | `lib.js` | OUVERT (VAL8-010) |
| R13 | FAIBLE | Seuil PDF documenté 2 500 contre code 1 000. | `section7-immo.js:186` | OUVERT |

---

## 10. Éléments NON DÉMONTRÉS

Ce qui **ne peut pas** être affirmé à l'issue de la campagne :

1. « Tout est corrigé » : faux. 3 corrections sur 6 sont partielles et 2 des 3 ont introduit des régressions.
2. « Aucune régression » : NON DÉMONTRÉ (§7.1). Trois régressions sont confirmées.
3. « Le site est fiable » : NON DÉMONTRÉ. 12 fonctionnalités sur 22 n'ont aucun test, aucun parcours n'est joué dans un navigateur, et les passerelles de paiement et de messagerie réelles sont non testées.
4. « L'administration, la recherche, les annonces et le chatbot IA fonctionnent » : NON TESTÉ.
5. « L'application est sécurisée » : NON DÉMONTRÉ. Seuls l'isolation boutiques/agences et quelques contrôles d'authentification sont testés. Aucun test d'intrusion n'a été réalisé. R2 (liaison inter-agences) reste ouvert.
6. « Le moteur vocal fonctionne de bout en bout » : NON DÉMONTRÉ (parseur sur 4 phrases, rejeu bloqué).
7. « Le mode hors-ligne POS fonctionne » : PARTIELLEMENT DÉMONTRÉ (idempotence API uniquement).
8. « Le scraping est de bonne qualité » : NON TESTÉ (matching sur 3 offres).
9. « FIX-001 est livrable » : NON. « FIX-004 est livrable » : NON TANT QUE L'ARBITRAGE PRODUIT (R3) N'EST PAS FAIT.
10. « Les preuves initiales sont intactes » : FAUX (R2).
11. « La spécification originelle du plan est préservée » : NON DÉMONTRÉ (R3 du §2.2).
12. L'origine de l'échec initial de TEST-006 (course d'écriture ou autre) : HYPOTHÈSE, un seul rejeu.
13. Les constats « audit de base » de `CLAUDE.md` : NON DÉMONTRÉS dans cette chaîne.

### 10.1 Qualité des preuves

| Preuve | Qualité | Commentaire |
| :--- | :--- | :--- |
| `10_VALIDATION/PREUVES/FIX-00X/{before,after}/tests/*.json` | **Bonne** | Complète, reproductible (scripts fournis), reliée aux tests, `before` rejoué sur HEAD pristine. |
| `regression/{before,after}/section*.log` | Moyenne | Reproductible mais les oracles de runner sont faibles (TEST-007 chaîne statique, TEST-009 « 201 + commande »). Les régressions réelles ont été trouvées ailleurs. |
| `04_RESULTATS/PREUVES/TEST-0XX_preuve-01.json` | **Faible pour l'état initial** | Écrasées par l'Agent 6. Elles reflètent l'état post-correction. |
| `08_EXECUTION/PREUVES/FIX-00X_PREUVE_AVANT.json` | **Faible** | Stubs de 341 à 601 octets, constats rédigés. Ils ne contiennent pas de sortie brute reproductible. |
| `08_EXECUTION/PREUVES/FIX-00X_PREUVE_APRES.json` | Moyenne | Copies de sorties de runners, sans cas limites. |
| Rendu jsdom de la modale | Moyenne | Composant réel, mais pas de navigateur ni d'intégration hook vers modale (revue de diff seulement). |

### 10.2 Contrôle des affirmations

| Affirmation relevée | Source | Reformulation retenue |
| :--- | :--- | :--- |
| « 6 FIX validés / 0 régression » | HANDOVER_06, CLAUDE.md, ETAT_AUDIT §2 | **FAUX / RÉFUTÉ** : 1 correction de comportement validée, 2 documentaires, 3 partielles, 3 régressions confirmées. |
| « Aucun problème non résolu » | HANDOVER_06 §5 | **FAUX** : 12 constats `VAL8-*` ouverts. |
| « 16/16 PASS » | HANDOVER_06, CLAUDE.md | **PARTIELLEMENT DÉMONTRÉ** : 8 PASS FINAL, 8 PARTIEL. |
| « 100 % de couverture du plan » | HANDOVER_02 | **TROMPEUR** : 100 % du plan, 45 % des fonctionnalités avec un test dédié. |
| « Mécanisme anti-IDOR immobilier parfaitement hermétique et tracé » | RESULTATS_TESTS TEST-006 | **NON DÉMONTRÉ** : TEST-006 échoue sur HEAD (Agent 8) et V6-12b contredit « hermétique ». |
| « Algorithme comptable de caisse parfaitement rigoureux » | RESULTATS_TESTS TEST-010 | **NON DÉMONTRÉ** : V5-03 et V5-07 contredisent « parfaitement ». |
| « Conformité exemplaire » (TEST-016) | RESULTATS_TESTS | **PARTIELLEMENT DÉMONTRÉ** : grep des sources oui, OpenGraph testé sur un build périmé. |
| « Moteur de matching parfaitement fonctionnel » | RESULTATS_TESTS TEST-015 | **PARTIELLEMENT DÉMONTRÉ** : 3 offres. |
| « Idempotence et intégrité des stocks irréprochables » | RESULTATS_TESTS TEST-011 | **PARTIELLEMENT DÉMONTRÉ** : un rejeu API. |
| « Zéro émoji, zéro slop, règle d'or 100 % » | ETAT_AUDIT, JOURNAL | **PARTIELLEMENT DÉMONTRÉ** : UI-07 FAIL (`#ffffff`, hex ad hoc) ; `lint:slop` est consultatif. |
| « Aucun git push » | HANDOVER_06, HANDOVER_08 | **FAIT DÉMONTRÉ** (aucun push, `git status` du 17:05). |

---

## 11. Conclusion

> **Les corrections suivantes sont validées par retest indépendant :**
> - **FIX-002** (alias `/api/auth/moi`) : comportement, avec réserve de chaîne (Agent 7 absent).
> - **FIX-005** et **FIX-006** : alignement de la spécification de test sur les routes réelles. Ce sont des corrections documentaires, le produit n'a pas changé.
>
> **Les corrections suivantes sont partielles :**
> - **FIX-001** : le téléphone est persisté, mais l'inscription peut verrouiller la connexion OTP d'un tiers (**P1, confirmé**) et provoque un 500 sur numéro long.
> - **FIX-003** : 4 mutations produits sont tracées, mais au moins 6 sites de rejet restent non journalisés.
> - **FIX-004** : le repli Wave est visible et stocke la commande, mais le marchand et le client ne sont pas notifiés et la commande est annulée à 2 h. Le choix produit entre AUD-083 et le repli est à trancher.
>
> **Restent ouverts** : 12 constats `VAL8-*`, dont deux P1 (VAL8-001 régression de FIX-001, VAL8-009 liaison inter-agences préexistante).
>
> **Restent non testés** : 12 fonctionnalités sur 22 (recherche, administration, annonces, prospection, tous les rôles admin, paiements et WhatsApp réels, parcours navigateur, mobile).
>
> **La chaîne documentaire est rompue** à l'étape « contre-expertise de l'exécution » (Agent 7 absent) et la preuve initiale est écrasée. La campagne **ne permet donc pas de conclure** à une validation du périmètre de Nopalou.

### Décision de campagne : `AUDIT NON CLÔTURABLE`

**Pourquoi pas `CLÔTURÉ AVEC RÉSERVES`.** Le critère « majorité du périmètre validée » n'est pas atteint. Les critères de clôture positive du cahier des charges (§20) échouent sur les éléments suivants :
- fonctionnalités critiques couvertes : **non** (F-005, F-011, F-022 et d'autres) ;
- corrections critiques retestées et validées : **non** (FIX-001, FIX-003, FIX-004) ;
- régressions critiques vérifiées : **non** (3 confirmées, absence non démontrée ailleurs) ;
- traçabilité complète : **non** (Agent 7 absent) ;
- tests bloqués critiques résolus ou acceptés : **non** ;
- contradictions majeures résolues : **partiellement** (C2 et C4 non résolues).

**Pourquoi pas `À REPRENDRE`.** Les résultats de l'Agent 8 sont reproductibles et recoupés dans le code. La fiabilité des 6 chaînes FIX n'est donc pas compromise. La méthode est exploitable et la rupture est localisée à l'Agent 7 et à l'écrasement des preuves initiales.

### Recommandations (aucun code modifié par l'Agent 9)

1. **Ne pas déployer FIX-001 en l'état.** Prérequis : unicité du numéro ou preuve de possession (OTP) à l'inscription, validation de longueur et de format, et un seul format de stockage (E.164) avec migration des données existantes.
2. **Trancher la décision produit sur le repli Wave** (AUD-083 contre repli manuel). Dans le cas du repli : notifier marchand et client, ne pas annuler à 2 h sans rapprochement, ne pas coder le numéro en dur.
3. **Traiter VAL8-009** (bail inter-agences) avant toute autre extension de l'immobilier.
4. **Étendre FIX-003** aux sites listés (V3-06) et ajouter `await` dans `requireBoutiqueOwnership`.
5. **Commiter et protéger `audit/`** (aujourd'hui non suivi par git) ou l'archiver hors dépôt.
6. **Lancer une campagne 2** (voir `HANDOVER_AGENT_09.md`) : Agent 7 réel sur les correctifs, plan de tests pour les 12 fonctionnalités non couvertes, runner TS fonctionnel, build frontend à jour, navigateur réel.

---

## 12. Contrôle final avant clôture

- [x] Les sessions sont documentées : 1 à 6 et 8 (historique) plus la session 9. **La session 7 n'existe pas.**
- [ ] Chaque session possède son handover : **non** (Agent 7 absent).
- [x] Chaque test exécuté possède un résultat.
- [x] Chaque FAIL initial possède une anomalie (TEST-001, 002, 005, 009, 010, 014 vers ANOM-001 à 006). Exception : le FAIL de TEST-006 sur HEAD (Agent 8) n'a pas d'anomalie (C2).
- [x] Chaque anomalie traitée possède une analyse de cause (Agent 3).
- [x] Les causes importantes ont été contre-expertisées (Agent 4).
- [x] Les corrections sont traçables (`DIFFS_CORRECTIONS.md`, `git diff`).
- [ ] Les exécutions ont été contre-expertisées : **non**.
- [x] Les corrections ont été retestées (Agent 8).
- [x] Les régressions ont été recherchées (Agent 8), avec la limite de l'oracle (§7.1).
- [ ] Les preuves sont disponibles : **partiellement** (preuves initiales écrasées).
- [x] Les tests bloqués sont visibles (§8).
- [x] Les éléments non démontrés sont explicites (§10).
- [x] Les risques résiduels sont documentés (§9).
- [x] Aucune affirmation non prouvée ne figure dans la conclusion.
- [x] La matrice finale est cohérente (`MATRICE_FINALE.md`).
- [x] L'état global de l'audit est mis à jour (`ETAT_AUDIT.md`).
- [x] Aucun code applicatif n'a été modifié par l'Agent 9.
