# DOSSIER DE PASSATION — HANDOVER VERS AGENT 5 (PLAN DE CORRECTION)

```text
DOCUMENT : HANDOVER AGENT-04 → AGENT-05
DATE : 2026-10-04
STATUT : TRANSMISSION OFFICIELLE DU DOSSIER DE CONTRE-EXPERTISE HOMOLOGUÉ
```

---

## SESSION

* **SESSION-ID** : `AUDIT-2026-004-AG04`
* **AGENT** : `AGENT-04` (Contre-Expert / Reviewer Indépendant)
* **DATE** : 2026-10-04
* **VERSION DU PROJET** : `4c0237273fde2d058d5eabca5f94b79ceb07d37e`
* **SESSION PRÉCÉDENTE** : `NOPALOU-AUDIT-AGENT-03-20261004-0155`
* **PROCHAINE SESSION ATTENDUE** : `AGENT-05` (Architecte du Plan de Correction / Remédiation)

---

## DOCUMENTS À LIRE

L'Agent 5 doit impérativement consulter les documents suivants dans cet ordre strict avant d'élaborer son plan de remédiation :
1. `/audit/06_CONTRE_EXPERTISE/REVUE_CAUSES.md` : Rapport complet de contre-expertise contradictoire (analyse détaillée des 6 anomalies, causes alternatives, faits et déductions).
2. `/audit/06_CONTRE_EXPERTISE/HANDOVER_AGENT_04.md` : Le présent document de cadrage et directives.
3. `/audit/05_ANALYSE_CAUSES/ANALYSE_CAUSES.md` & `/audit/05_ANALYSE_CAUSES/INCERTITUDES.md` : Travaux préliminaires de l'Agent 3.
4. `/audit/02_PLAN_TESTS/MATRICE_TRACEABILITE.md` : Chaîne de traçabilité `TEST` → `RÉSULTAT` → `ANOMALIE` → `CAUSE` → `CONTRE-EXPERTISE`.
5. `/audit/02_PLAN_TESTS/REGRESSION_BASELINE.md` : Les 6 grappes d'impact à respecter lors de la définition des tests de non-régression.
6. `AGENTS.md` & `.agents/AGENTS.md` : Les 5 Règles d'Or Nopalou (anti-IA-slop, sécurité multi-tenant, bannissement absolu des polices externes, zéro push sans ordre, modularisation < 450 lignes).
7. `CLAUDE.md` : Directives d'architecture pérennes et historique des correctifs.

---

## RÉSULTAT DE LA CONTRE-EXPERTISE

### ANOMALIE-001
* **ANOMALIE-ID** : `ANOM-001`
* **TEST-ID** : `TEST-001`
* **CAUSE-ID** : `CAUSE-001`
* **STATUT** : `CAUSE CONFIRMÉE`
* **PREUVE** : `audit/04_RESULTATS/PREUVES/TEST-001_preuve-01.json` + `backend/routes/auth.js:54, 61-64`
* **CONFIANCE** : 100% (Certain)
* **LOCALISATION TECHNIQUE** : `backend/routes/auth.js:54, 61-64` (backend) et secondairement `frontend-next/src/app/actions/auth.ts:43, 55` (frontend)
* **CAUSES SECONDAIRES** : Absence de validation / normalisation du format de téléphone dans les validateurs express-validator d'inscription.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Omission originelle dans le flux classique email/mot de passe).

### ANOMALIE-002
* **ANOMALIE-ID** : `ANOM-002`
* **TEST-ID** : `TEST-002`
* **CAUSE-ID** : `CAUSE-002`
* **STATUT** : `CAUSE CONFIRMÉE` (Divergence de spécification d'audit)
* **PREUVE** : `audit/04_RESULTATS/PREUVES/TEST-002_preuve-01.json` + `backend/routes/auth.js:525`
* **CONFIANCE** : 100% (Certain)
* **LOCALISATION TECHNIQUE** : `audit/02_PLAN_TESTS/PLAN_TESTS.md:40` (spécification) vs `backend/routes/auth.js:525` (route réelle `/profil`)
* **CAUSES SECONDAIRES** : Absence d'alias `/api/auth/moi` dans Express.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Faux échec applicatif induit par une hypothèse théorique de test).

### ANOMALIE-003
* **ANOMALIE-ID** : `ANOM-003`
* **TEST-ID** : `TEST-005`
* **CAUSE-ID** : `CAUSE-003`
* **STATUT** : `CAUSE PARTIELLEMENT CONFIRMÉE` (Mécanisme exact, périmètre sous-évalué)
* **PREUVE** : `audit/04_RESULTATS/PREUVES/TEST-005_preuve-01.json` + `backend/routes/boutiques-modules/boutiques-produits.js:127-130` + scan de l'ensemble de `boutiques-modules/`
* **CONFIANCE** : 100% (Certain sur l'absence de log, requalifié sur la portée)
* **LOCALISATION TECHNIQUE** : Ensemble des modules sous `backend/routes/boutiques-modules/` (`boutiques-produits.js`, `boutiques-integrations.js`, `credits.js`, `entrepots.js`, `boutiques-retours.js`)
* **CAUSES SECONDAIRES** : Absence d'utilisation effective du middleware `requireBoutiqueOwnership()` sur la stack Express.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Dette architecturale originelle de traçabilité).

### ANOMALIE-004
* **ANOMALIE-ID** : `ANOM-004`
* **TEST-ID** : `TEST-009`
* **CAUSE-ID** : `CAUSE-004`
* **STATUT** : `CAUSE PARTIELLEMENT CONFIRMÉE` (Cause multiple Backend + UI Panier)
* **PREUVE** : `audit/04_RESULTATS/PREUVES/TEST-009_preuve-01.json` + `backend/routes/comptabilite.js:985-989` + commit git `7ce40c00` + `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx:130-248`
* **CONFIANCE** : 100% (Certain)
* **LOCALISATION TECHNIQUE** :
  - Backend : `backend/routes/comptabilite.js:985-989`
  - Frontend : `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx:130-248` et `useDrawerCartCheckout.ts:333-345`
* **CAUSES SECONDAIRES** : Manque d'émulateur Wave Sandbox pour l'exécution des tests automatisés hors-ligne.
* **RÉGRESSION** : `RÉGRESSION CONFIRMÉE` (Introduite délibérément lors de `AUD-083` pour éviter des commandes fantômes, en rupture avec `CLAUDE.md:58`).

### ANOMALIE-005
* **ANOMALIE-ID** : `ANOM-005`
* **TEST-ID** : `TEST-010`
* **CAUSE-ID** : `CAUSE-005`
* **STATUT** : `CAUSE CONFIRMÉE` (Divergence de spécification d'audit)
* **PREUVE** : `audit/04_RESULTATS/PREUVES/TEST-010_preuve-01.json` + `backend/routes/boutiques-modules/boutiques-pos.js:803, 866, 993`
* **CONFIANCE** : 100% (Certain)
* **LOCALISATION TECHNIQUE** : `audit/02_PLAN_TESTS/PLAN_TESTS.md:212-214` (spécification) vs `boutiques-pos.js` (routes réelles)
* **CAUSES SECONDAIRES** : Aucune (le système de caisse réel fonctionne parfaitement).
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Faux échec applicatif).

### ANOMALIE-006
* **ANOMALIE-ID** : `ANOM-006`
* **TEST-ID** : `TEST-014`
* **CAUSE-ID** : `CAUSE-006`
* **STATUT** : `CAUSE CONFIRMÉE` (Faux positif de taille PDF & Erreur multi-tenant de test)
* **PREUVE** : `audit/04_RESULTATS/PREUVES/TEST-014_preuve-01.json` + `backend/routes/locatif-immo.js:83, 1145-1240`
* **CONFIANCE** : 100% (Certain)
* **LOCALISATION TECHNIQUE** : `audit/02_PLAN_TESTS/PLAN_TESTS.md:308, 311` (spécification d'audit)
* **CAUSES SECONDAIRES** : Aucune.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Faux positif caractérisé).

---

## CAUSES VALIDÉES

L'Agent 5 peut planifier des actions directes et sereines sur les causes suivantes :
1. **`CAUSE-001` (Persistance du Téléphone)** :
   - Extraire `telephone` dans `POST /api/auth/inscription` (`auth.js:54`).
   - Appliquer la normalisation `normalisePhone(telephone)` (cohérence avec `whatsapp-otp-register`).
   - Ajouter `telephone` dans la commande SQL `INSERT INTO utilisateurs (...) VALUES (...)` et dans la clause `RETURNING`.
   - Extraire `telephone` dans le Server Action `signup` (`frontend-next/src/app/actions/auth.ts`).
2. **`CAUSE-002`, `CAUSE-005`, `CAUSE-006` (Divergences de Spécifications)** :
   - Mettre à jour les spécifications d'audit dans `PLAN_TESTS.md` et les runners associés.
   - Optionnel mais recommandé pour `CAUSE-002` : Ajouter un alias rétro-compatible dans Express `router.get('/moi', (req, res) => res.redirect(307, '/api/auth/profil'))` ou un handler miroir.
   - Ajuster le seuil d'acceptation de la quittance PDF à `> 2 500 octets` dans `PLAN_TESTS.md:311`.

---

## CAUSES PARTIELLES

L'Agent 5 doit impérativement traiter la complexité additionnelle mise en lumière par l'Agent 4 sur :
1. **`CAUSE-003` (Périmètre IDOR & Traçabilité `security_audit_vault`)** :
   - L'Agent 3 ciblait uniquement `boutiques-produits.js:127-130`.
   - **Directive Agent 4** : L'Agent 5 ne doit pas se limiter aux produits. Il doit planifier soit :
     - (Option A - Recommandée) Le remplacement propre de la garde manuelle par le middleware `requireBoutiqueOwnership()` sur les routes de mutations privées des modules boutiques (`boutiques-produits`, `boutiques-integrations`, `credits`, `entrepots`, `boutiques-retours`).
     - (Option B - Défensive) L'insertion systématique de l'appel `logSecurityViolation()` dans tous les blocs `if (!own) { ... }`.
2. **`CAUSE-004` (Conflit Wave 502 / AUD-083 vs Fallback Manuel)** :
   - L'Agent 3 préconisait d'aligner le backend sur Orange Money en HTTP 201 avec `fallback_manuel: true`.
   - **Directive Agent 4** : Ne jamais appliquer ce changement backend sans planifier simultanément l'affichage du paiement manuel dans `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx`.
   - Le plan de correction doit impérativement comporter un volet Frontend qui restitue le numéro de dépôt Wave (`777202086` ou paramètre boutique) et le message d'instructions lorsque `fallback_manuel: true` est reçu par le panier.

---

## CAUSES REJETÉES

Aucune cause n'a été rejetée.

---

## ANALYSES À REFAIRE

Aucune analyse n'est à reprendre de zéro. Les 6 anomalies sont solidement étayées.

---

## POINTS À SURVEILLER (RISQUES POUR L'AGENT 5)

1. **Règle d'or Anti-Slop (Modales et UI)** :
   Lors de l'adaptation de `DrawerCartSuccessModal.tsx` pour afficher les consignes de repli manuel Wave/OM, **interdiction formelle d'utiliser des émojis Unicode** (`💳`, `📱`, `⚠️`). Utiliser exclusivement les icônes SVG de `lucide-react` (ex: `Phone`, `Info`, `ShieldCheck`).
2. **Préservation du Multi-Tenant Collaboratif** :
   Dans le plan de correction de `CAUSE-003`, veiller à ce que la vérification des droits via `checkBoutiqueAccess` ou `requireBoutiqueOwnership` continue d'autoriser les gérants et employés enregistrés dans `boutique_utilisateurs` (ne pas restreindre au seul propriétaire `boutiques.utilisateur_id`).
3. **Zéro Téléchargement de Polices Externes** :
   Ne jamais tenter de faire grossir artificiellement le PDF de quittance locative (`ANOM-006`) par injection de polices Google Fonts. La sobriété de 3,1 Ko est un standard d'ingénierie validé.
4. **Idempotence et Stocks (`ANOM-004`)** :
   En mode de repli manuel Wave (HTTP 201), s'assurer que la commande est enregistrée avec le statut `en_attente` et que le stock n'est décrémenté qu'une seule fois via la transaction SQL établie.

---

## INTERDICTIONS FORMELLES POUR L'AGENT 5

* **INTERDICTION N° 1** : Ne pas corriger une cause rejetée (aucune en l'espèce).
* **INTERDICTION N° 2** : Ne pas transformer une hypothèse en fait démontré.
* **INTERDICTION N° 3** : Ne pas concevoir un correctif backend isolé pour `ANOM-004` sans le couplage frontend `DrawerCartSuccessModal.tsx` (risque de réapparition de la régression `AUD-083`).
* **INTERDICTION N° 4** : Ne pas modifier le code applicatif ou exécuter des scripts pendant la Phase 5 (réservé à l'Agent 6).
* **INTERDICTION N° 5** : Conserver scrupuleusement la chaîne de traçabilité complète :
  `TEST` → `RÉSULTAT` → `ANOMALIE` → `CAUSE` → `CONTRE-EXPERTISE` → `FIX` → `RETEST`.
