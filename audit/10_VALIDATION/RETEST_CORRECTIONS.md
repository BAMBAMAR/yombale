# RETEST DES CORRECTIONS — Agent 8

## 0. Session

| Champ | Valeur |
| :--- | :--- |
| SESSION-ID | `AUDIT-08-20261004-1150` |
| Agent | AGENT 8 — Validation indépendante & non-régression |
| Commit de référence | `4c0237273fde2d058d5eabca5f94b79ceb07d37e` (branche `main`) |
| État du projet testé | Modifications **non commitées** de l'arbre de travail (9 fichiers modifiés, aucun push) |
| Environnement | Local isolé : PostgreSQL `nopalou_audit` (port 54329), garde réseau `audit-guard.js` (aucune API externe réelle) |
| Backend « APRÈS » (corrigé) | `http://localhost:4100` — arbre de travail courant |
| Backend « AVANT » (baseline) | `http://localhost:4101` — `git archive HEAD` extrait dans `scripts/audit/.local/baseline-head/` (ignoré par git) |
| Statut session Agent 7 | **ABSENTE** : `/audit/09_CONTRE_EXPERTISE_CORRECTIONS/` n'existe pas, `ETAT_AUDIT.md` indiquait encore l'Agent 6. Aucune conclusion de l'Agent 7 n'a pu être utilisée ; seul le `HANDOVER_AGENT_06.md` a servi d'entrée. |
| Différences depuis Agent 6 | Les preuves « avant » d'origine (`03_PREUVES`, `04_RESULTATS/PREUVES`) avaient été **écrasées** par les rejeux de l'Agent 6 (les runners écrivent dans ces dossiers). Un « AVANT » indépendant a donc été reconstruit en rejouant les mêmes tests sur le HEAD pristine (port 4101). |
| Code projet modifié par l'Agent 8 | **Aucun**. Seuls `audit/10_VALIDATION/**` et le dossier git-ignoré `.local` ont été créés. |

Méthode : chaque FIX est rejoué par un script dédié (`SCRIPTS/val-fixNNN.js`) contre **les deux** backends, avec les mêmes données et les mêmes oracles, plus le test d'origine, des cas limites, une vérification de persistance en base (`pg`) et un parcours de bout en bout quand il est possible. Les statuts ne reposent ni sur le journal de l'Agent 6, ni sur un HTTP 200 seul, ni sur le commit.

Contournement documenté : le limiteur `authLimiter` (20 req / 15 min, en mémoire, `trust proxy=1`) fausserait les rejeux ; mes scripts envoient un `X-Forwarded-For` aléatoire par requête (`lib.js`, `xff-preload.js`). Cela révèle au passage que ce limiteur est contournable par en-tête spoofé tant que le proxy de confiance n'est pas strict (observation hors périmètre, voir `HANDOVER_AGENT_08.md`).

Commande de rejeu type :

```powershell
. .\scripts\audit\audit-env.ps1
$env:BACKEND_URL='http://localhost:4101'; $env:LABEL='before'; node audit\10_VALIDATION\SCRIPTS\val-fix001.js
$env:BACKEND_URL='http://localhost:4100'; $env:LABEL='after';  node audit\10_VALIDATION\SCRIPTS\val-fix001.js
```

## 1. Synthèse

| FIX | Test original | AVANT (HEAD) | APRÈS (corrigé) | Conclusion |
| :--- | :--- | :--- | :--- | :--- |
| FIX-001 | TEST-001 | 5/10 (original FAIL) | 6/10 (original **PASS**) | **PARTIELLEMENT VALIDÉ** — régression cachée confirmée |
| FIX-002 | TEST-002 | 2/11 (`/moi` 404) | **11/11** | **VALIDÉ** |
| FIX-003 | TEST-005 (+TEST-006) | 7/14 | 13/14 | **PARTIELLEMENT VALIDÉ** |
| FIX-004 | TEST-009 | 3/9 (502 + commande annulée) | **9/9** backend ; UI 6/7 | **PARTIELLEMENT VALIDÉ** |
| FIX-005 | TEST-010 | 9/11 | 9/11 (identique) | **VALIDÉ** (correction documentaire, produit inchangé) |
| FIX-006 | TEST-014 | 12/14 | 12/14 (identique) | **VALIDÉ** (correction documentaire, produit inchangé) |

Preuves brutes : `PREUVES/FIX-00X/{before,after}/tests/FIX-00X_validation_{before,after}.json`.

---

## 2. FIX-001 — Persistance du téléphone à l'inscription (ANOM-001 / TEST-001 / CAUSE-001)

* **FIX** : extraction + normalisation de `telephone` dans `POST /api/auth/inscription` (`backend/routes/auth.js`) et dans la Server Action `signup` (`frontend-next/src/app/actions/auth.ts`).
* **ANOMALIE** : le téléphone saisi n'était pas écrit en base (`utilisateurs.telephone = NULL`).
* **CAUSE VALIDÉE** : confirmée sur HEAD (V1-01 AVANT : 201 mais `telephone` NULL).
* **PRÉCONDITIONS** : base d'audit migrée, backend démarré, e-mail jamais utilisé. **DONNÉES** : e-mails `*@audit8.test` uniques, numéros `+221 77 xxx xx xx` générés.
* **PERSISTANCE** : relecture SQL directe + `GET /api/auth/profil` après reconnexion.

| ID | Test de retest | Résultat attendu | AVANT | APRÈS | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| V1-01 | TEST-001 original : inscription avec numéro local formaté | 201 + `+221771912401` en base | FAIL (NULL) | **PASS** | PASS |
| V1-02 | Reconnexion + `GET /profil` | téléphone retourné | FAIL | PASS | PASS |
| V1-03 | Formats `+221 77…`, `00221…`, `221…`, parenthèses | normalisés `+221XXXXXXXXX` | FAIL | PASS | PASS |
| V1-04 | Absent / vide / null / espaces | 201, NULL, pas d'erreur SQL | PASS | PASS | PASS |
| V1-05 | Valeurs invalides (lettres, court, 25 chiffres, injection, types non string) | ni 500, ni valeur invalide persistée | PASS | **FAIL** | **FAIL (nouveau défaut)** |
| V1-06 | Doublon : 2e compte e-mail avec le même numéro | refus explicite (409) comme `PUT /profil` | FAIL (aucun téléphone stocké) | **FAIL** (2e compte accepté) | FAIL |
| V1-07 | Régression cachée : inscription d'un tiers avec le numéro d'une victime OTP | connexion OTP de la victime inchangée | PASS (200) | **FAIL (409)** | **RÉGRESSION CONFIRMÉE** |
| V1-08 | Cohérence de format `PUT /profil` vs inscription | même format stocké | FAIL | FAIL (`771912409` vs `+221771912409`) | FAIL |
| V1-09 | E2E : inscription → accès → déconnexion (401) → reconnexion | OK | PASS | PASS | PASS |
| V1-10 | Normalisation e-mail (non-régression) | minuscules | PASS | PASS | PASS |

**RÉSULTAT OBSERVÉ (détails)** :

* V1-05 APRÈS : `'123'` → stocké `+123` ; chaîne d'injection → stocké `+77` ; **25 chiffres → HTTP 500** `Erreur serveur lors de l'inscription` (dépassement `VARCHAR(20)`) ; AVANT ces cas renvoyaient 201 en ignorant le champ. Nombre JSON et objet → 400 (OK).
* V1-06 APRÈS : deux comptes e-mail distincts partagent `+221771912407` ; aucune preuve de possession du numéro (pas d'OTP) ; la règle `telephoneEstLibrePourCompte` de `PUT /profil` est contournée par l'inscription.
* V1-07 APRÈS : la victime (compte OTP, téléphone stocké sans `+`, `221…`) ; un attaquant s'inscrit avec le même numéro, stocké `+221…` ; `/api/auth/whatsapp-otp-login` pour la victime renvoie **409 « Plusieurs comptes sont associés à ce numéro »** (AVANT : 200). C'est un verrouillage / squat de compte rendu possible par la correction.
* V1-08 : deux conventions coexistent (inscription E.164 `+221…`, OTP et `PUT /profil` sans `+`), ce qui est la cause directe de V1-07.
* Interface : le formulaire d'inscription e-mail (`InscriptionForm.tsx`) **n'a pas de champ téléphone** (seul le formulaire WhatsApp en a un). La modification de la Server Action est donc **inatteignable depuis l'UI** ; la validation de bout en bout côté interface est **NON DÉMONTRABLE**. Envoi OTP/WhatsApp réel : **NON EXÉCUTÉ** (API externe interdite).

**END-TO-END** : API seulement (V1-09 PASS). **CAS LIMITES** : couverts (V1-03/04/05). **PREUVES** : `PREUVES/FIX-001/{before,after}/tests/`, `PREUVES/FIX-001/logs/backend4100_signup_500_excerpt.log`.

**STATUT : PARTIELLEMENT VALIDÉ.** Le test original TEST-001 passe (FAIL → PASS) et la persistance fonctionne ; mais la correction introduit un 500 sur entrée longue, stocke des numéros invalides, n'applique pas l'unicité, et provoque une **régression confirmée** sur la connexion OTP (V1-07).

---

## 3. FIX-002 — Alias `GET /api/auth/moi` (ANOM-002 / TEST-002 / CAUSE-002)

* **FIX** : ajout de l'alias `/moi` pointant vers le même handler que `/profil` (`backend/routes/auth.js`).
* **CAUSE VALIDÉE** : la route `/moi` n'existait pas (404 sur HEAD), la spécification du plan était fausse.

| ID | Test | Attendu | AVANT | APRÈS |
| :--- | :--- | :--- | :--- | :--- |
| V2 | `GET /moi` avec jeton valide | 200, corps identique à `/profil` | **404** | PASS |
| V2 | `GET /profil` avec jeton valide | 200 | PASS | PASS |
| V2 | Anonyme, jeton absurde, forgé (mauvaise clé), expiré, jeton de type reset | 401 sur `/profil` **et** `/moi` | 401 sur `/profil`, 404 sur `/moi` | 401 / 401 |
| V2 | `POST/PUT` sur `/moi` | refusés (alias en lecture seule) | 404 | PASS |
| V2 | Déconnexion | `jwt_version` +1, ancien jeton 401 sur les deux routes | PASS (profil) | PASS (les deux) |
| V2 | Reconnexion, demande de suppression | accès rétabli ; jeton révoqué | PASS | PASS |
| V2 | IDOR / champs sensibles | aucun champ d'un autre compte, pas de hash | n/a | PASS |

**RÉSULTAT** : 11/11 PASS APRÈS contre 2/11 AVANT. **PERSISTANCE** : `jwt_version` relu en base. **END-TO-END** : login → `/moi` → logout → 401 → relogin OK. **STATUT : VALIDÉ.** Aucune régression observée sur TEST-001/003/004 (grappe C).

---

## 4. FIX-003 — Journalisation IDOR sur les routes produits (ANOM-003 / TEST-005 / CAUSE-003)

* **FIX** : appel `await logSecurityViolation(...)` sur les rejets 403 de `boutiques-produits.js` (+ extension à `comptabilite.js` commandes, `tenantSecurityImmo.js` — déviation DEV-001/002).
* **Méthode** : attaquant B (abonné) contre la boutique de A ; comptage SQL dans `security_audit_vault` avant/après.

| ID | Test | Attendu | AVANT | APRÈS |
| :--- | :--- | :--- | :--- | :--- |
| V3-01 | TEST-005 original : `POST /produits` cross-boutique | 403 + ligne `IDOR_BOUTIQUE_ACCESS_DENIED` | FAIL (403 sans trace) | PASS |
| V3-04/05/05b | `PUT`, `DELETE`, `dupliquer` cross-boutique | 403 + trace | FAIL | PASS |
| V3-02/03 | Propriétaire et gérant (`boutique_utilisateurs`) | accès conservé (pas de faux positif) | PASS | PASS |
| V3-07 | Anonyme | 401, aucune pollution du vault | PASS | PASS |
| V3-08 | Attaquant sans abonnement | bloqué par `checkAbonnement` avant le contrôle IDOR (information) | PASS | PASS |
| V3-09/10 | Routes commandes (`comptabilite.js`), événement harmonisé | 403 + trace | PASS | PASS |
| V3-11 | Rafale de 5 rejets | 5 traces (pas de limitation de volume, observation) | FAIL | PASS |
| V3-13 | TEST-006 cross-agence (UUID + slug) | 403 + 2 traces `IDOR_AGENCE_ACCESS_DENIED` | FAIL (course fire-and-forget) | PASS (`await`) |
| V3-14 | Propriétaire d'agence | 200 conservé | PASS | PASS |
| **V3-06** | **Couverture** : tous les gardes `if (!own)` des routes produits | chaque 403 est tracé | FAIL | **FAIL** |

**V3-06 APRÈS (échec de couverture, détail)** : `PATCH /produits/:id/partage` (`boutiques-produits.js` ~583), `POST /produits/batch` (~600) et `POST /produits/:id/composants` (~844) renvoient 403 **sans trace**. D'autres gardes restent non journalisés : `boutiques-crud.js` ~1654, `boutiques-club-vip.js` ~66 et ~83. Le middleware `requireBoutiqueOwnership` reste « fire and forget » (scan statique : 4 des 10 sites `if (!own)` journalisés).

**PERSISTANCE** : relecture de `security_audit_vault` (`PREUVES/FIX-003/db/vault_{before,after}.json`). **STATUT : PARTIELLEMENT VALIDÉ** — la route et les 4 mutations visées par TEST-005 sont couvertes, mais au moins 6 sites de rejet voisins restent non tracés : la protection est donc incomplète.

---

## 5. FIX-004 — Repli manuel Wave (ANOM-004 / TEST-009 / CAUSE-004)

* **FIX** : backend `comptabilite.js` — si l'API Wave est indisponible, renvoie `201 {fallback_manuel:true, numero_depot, operateur}` et conserve la commande `en_attente` ; frontend — `useDrawerCartCheckout.ts`, `types.ts`, `DrawerCartSuccessModal.tsx` affichent le numéro de dépôt.

**Backend (réel, 9 vérifications) :**

| ID | Test | AVANT | APRÈS |
| :--- | :--- | :--- | :--- |
| V4-01 | TEST-009 : Wave indisponible → 201 + `fallback_manuel` + `numero_depot` 777202086 + commande `en_attente` + stock −1 | **FAIL : 502, commande annulée, stock restitué** (reproduit ANOM-004) | PASS |
| V4-02/03 | Quantité 2 (stock −2) ; alias `pay_wave` | FAIL | PASS |
| V4-04 | Orange Money inchangé | PASS | PASS |
| V4-05 | Espèces inchangé | PASS | PASS |
| V4-06 | Double soumission (même `idempotency_key`) → 200 doublon, 1 commande | PASS | PASS |
| V4-07 | Quantité > stock refusée, stock inchangé | PASS | PASS |
| V4-08 | Concurrence sur le dernier article : 1 seule acceptée | PASS | PASS |
| V4-09 | Corps de repli sans `wave_url` trompeuse | FAIL | PASS |

**Effets de bord constatés (non couverts par le plan, `val-fix004b-notif.js`)** :

| ID | Test | APRÈS |
| :--- | :--- | :--- |
| V4N-01 | Témoin : commande espèces → notification marchand + confirmation client | PASS |
| **V4N-02** | Commande Wave en repli : marchand notifié | **FAIL** — `notifierCommande()` jamais appelée dans la branche de repli (notifications différées à la réussite de la session Wave, AUD-102) |
| **V4N-03** | Commande Wave en repli : client reçoit la confirmation | **FAIL** (idem) |

* Le cron `annulerCommandesImpayeesExpirees` annule la commande de repli après 2 h (vérifié : statut `annulee`, stock restitué ; `after.extra.cron_expiration_2h`) : la plainte AUD-083 (« annulation silencieuse après 2 h ») subsiste pour le paiement manuel, sans notification marchand. La route Express `boutiques-commandes.js:485` annule toujours en cas d'échec Wave (comportement incohérent entre les deux chemins). Le numéro `777202086` est codé en dur côté backend et frontend.

**Interface (`SCRIPTS/ui/fix004-modal.test.tsx`, Vitest + jsdom, composant réel, sortie `PREUVES/FIX-004/ui/vitest_modal_run.txt`) :**

| ID | Test | Résultat |
| :--- | :--- | :--- |
| UI-01 | Repli : affiche 777202086, « Wave », référence en motif | PASS |
| UI-02 | Sans repli : aucun bloc manuel (pas de faux positif) | PASS |
| UI-03 | Aucun émoji Unicode dans le rendu | PASS |
| UI-04 | Icônes SVG lucide présentes | PASS |
| UI-05 | Lien WhatsApp marchand contient la mention de transfert manuel | PASS |
| UI-06 | Sans `numeroDepot` fourni : défaut 777202086 | PASS |
| UI-07 | Aucune couleur hexadécimale ad hoc (règle d'or n°3) | **FAIL** : `#059669` (ligne 109, préexistant) ; revue du diff : `background: '#ffffff'` ajouté (ligne 259, non détecté par le test car jsdom le normalise en `rgb`), plus des repli `var(--x, #hex)` |

Complémentaires : `npx tsc --noEmit` (frontend-next) : exit 0 (`PREUVES/FIX-004/ui/tsc_noEmit.txt`) ; `npm test` frontend : 97/97. `lint:slop` : consultatif (872 émojis préexistants dans le projet, aucun dans le bloc modifié). Textes français codés en dur hors `t()`. Le fichier fait 377 lignes (< 450).

**Non exécuté** : parcours navigateur réel (le build Next sur `:3001` date du 3 octobre et ne contient pas les changements ; aucune reconstruction pour ne pas perturber le serveur existant). Les vérifications UI reposent donc sur le rendu jsdom du composant réel, pas sur un navigateur ; l'enchaînement hook → modale dans le panier n'est vérifié que par revue du diff.

**PERSISTANCE** : commande, stock et statut relus en base (`PREUVES/FIX-004/after/tests/`). **PREUVES** : `PREUVES/FIX-004/logs/backend4100_wave_notif_excerpt.log`.

**STATUT : PARTIELLEMENT VALIDÉ.** Le défaut d'origine (commande détruite + 502) est corrigé et le client voit les instructions, mais le marchand et le client ne sont pas notifiés de la commande de repli, la commande est annulée au bout de 2 h, et l'interface n'a pas été validée dans un navigateur réel.

---

## 6. FIX-005 — Spécification POS alignée sur les routes réelles (ANOM-005 / TEST-010 / CAUSE-005)

* **FIX** : modification de `PLAN_TESTS.md` + runner `section4-pos.js` uniquement (aucune modification du produit).
* **Résultat** : 9/11 AVANT **et** 9/11 APRÈS : comportement du produit **identique**, la correction est documentaire.

Passent : anciennes URLs restent 404 (V5-01), ouverture fond 25 000 (V5-02), mouvement 5 000 + montants invalides refusés (V5-04), clôture 20 000 → écart 0 (V5-05), écart −1 000 calculé et persisté (V5-06), isolation B → 403/404 (V5-08), anonyme 401 (V5-09), TEST-011 rejeu hors ligne : 201 puis 200 `duplicate`, 1 vente, stock 10→9 (V5-10), `PLAN_TESTS.md` référence les routes réelles (V5-11).

Échecs **préexistants, identiques avant/après, non causés par le FIX** (nouvelles constatations) :

* **V5-03** : deux sessions de caisse peuvent être ouvertes simultanément sur la même boutique.
* **V5-07** : un mouvement « sortie » est accepté (200) sur une session déjà clôturée.

**STATUT : VALIDÉ** en tant que correction documentaire (spécification alignée, TEST-010 rejouable). Aucune correction du produit n'a été faite ni validée ; les deux nouvelles constatations restent ouvertes.

---

## 7. FIX-006 — Spécification bail/quittance alignée (ANOM-006 / TEST-014 / CAUSE-006)

* **FIX** : `PLAN_TESTS.md` + runner `section7-immo.js` (route `/api/locatif-immo/agence/:slugOrId/baux`, seuil PDF abaissé). Produit inchangé.
* **Résultat** : 12/14 AVANT **et** APRÈS (identique).

Passent : ancienne URL `/locatif-immo/baux` reste 404 ; bail par UUID et par slug (201 + 12 échéances) ; encaissement exact → `paye`, reste 0 ; partiel / sur-paiement / double paiement protégés ; PDF valide (`%PDF`, `%%EOF`, Helvetica uniquement, 0 URL externe ; texte contenant COCC, QUITTANCE, locataire, 2026, montants) ; PDF distincts par échéance (3 140 octets, dans la fenêtre 2,8–4 Ko de la matrice, `PREUVES/FIX-006/ui/quittance_after.pdf`) ; échéance impayée refusée ; anonyme 401 ; cross-agence 403 + trace ; Y ne peut pas encaisser chez X.

Le journal de l'Agent 6 annonce un seuil `> 2500` octets alors que le runner contient `pdfSize > 1000` (ligne 186) : écart document/code (le seuil a été **recalibré**, de 5 000 à 1 000). La validité du PDF est néanmoins démontrée par le contenu, pas par la taille.

Échecs **préexistants, identiques avant/après** :

* **V6-10** : `GET /public/quittance/not-a-uuid.pdf` → **500** (attendu 4xx).
* **V6-12b** : l'agence X peut créer **dans sa propre agence** un bail visant le bien, le locataire et le propriétaire de l'agence Y → **201** (liaison inter-tenants, gravité P1, non couverte par TEST-006).

La route citée par l'Agent 5 (`/api/locatif-immo/quittance/:id/pdf`) diffère de la route réelle publique par UUID (`/public/quittance/:id.pdf`) ; statut enregistré dans `after.extra.route_matrice_agent5_quittance_id_pdf`.

**STATUT : VALIDÉ** (documentaire) + 2 constatations nouvelles (V6-10, V6-12b).

---

## 8. Limites de ce retest

* Aucun navigateur réel : UI validée par rendu jsdom du composant, `tsc`, tests unitaires et revue du diff.
* Wave, Orange Money, OTP/WhatsApp : API externes bloquées par la garde réseau (simulation uniquement).
* Le « AVANT » est rejoué sur HEAD pristine, pas lu dans les preuves historiques (écrasées).
* Données de test persistantes dans `nopalou_audit` (utilisateurs `*@audit8.test`), sans impact hors environnement isolé.
