# CONTRE-EXPERTISE DES CAUSES — NOPALOU

## SESSION
* **SESSION-ID** : `AUDIT-2026-004-AG04`
* **DATE** : 2026-10-04
* **VERSION DU PROJET** : `4c0237273fde2d058d5eabca5f94b79ceb07d37e`
* **AGENT** : `AGENT-04` (Contre-Expert / Reviewer Indépendant)
* **SESSION PRÉCÉDENTE** : `NOPALOU-AUDIT-AGENT-03-20261004-0155`
* **HANDOVER REÇU** : `/audit/05_ANALYSE_CAUSES/HANDOVER_AGENT_03.md`
* **PHASE EN COURS** : `PHASE 4 — CONTRE-EXPERTISE INDÉPENDANTE DES CAUSES`

---

## PÉRIMÈTRE

Le périmètre de cette contre-expertise couvre l'évaluation critique, contradictoire et indépendante de l'ensemble des six diagnostics de causes établis par l'Agent 3 (`CAUSE-001` à `CAUSE-006`) associés aux six anomalies détectées lors de la campagne de tests (`ANOM-001` à `ANOM-006` sur `TEST-001` à `TEST-016`), ainsi que la résolution formelle des quatre incertitudes ouvertes dans `/audit/05_ANALYSE_CAUSES/INCERTITUDES.md`.

Le travail porte exclusivement sur :
1. La vérification matérielle de la chaîne de causalité (`TEST` → `RÉSULTAT` → `SYMPTÔME` → `PREUVE` → `INVESTIGATION` → `OBSERVATION TECHNIQUE` → `CAUSE` → `PREUVE DE CAUSE`).
2. L'inspection statique et l'analyse d'historique git du code backend (`Express`), des Server Actions (`Next.js 14`), des composants React et du schéma PostgreSQL.
3. La recherche systématique de causes alternatives, de causes multiples ou de biais de diagnostic.
4. L'élucidation des incertitudes UX / sécurité laissées par l'Agent 3.

---

## MÉTHODE

L'Agent 4 adopte une méthodologie adversarial-first conforme aux directives de la gouvernance :
- **Principe de doute systématique** : Une cause n'est jamais acceptée sur simple plausibilité ou déclaration d'un agent précédent. Le handover de l'Agent 3 n'est pas une preuve.
- **Règle des 4 statuts d'affirmation** :
  - **FACT** : Démontré par une preuve matérielle directe (code, log d'exécution, trace HTTP, base de données).
  - **DÉDUCTION TECHNIQUE** : Déduction logique irréfutable liant plusieurs faits vérifiés.
  - **HYPOTHÈSE** : Explication plausible non démontrée (bannie pour déclarer une cause confirmée).
  - **INCONNU** : Absence d'éléments probants.
- **Statuts d'homologation de cause** :
  - `CAUSE CONFIRMÉE` : La preuve matérielle établit sans équivoque le lien causal direct et suffisant.
  - `CAUSE PARTIELLEMENT CONFIRMÉE` : La cause est exacte mais partielle, omet une dépendance critique ou un périmètre plus vaste.
  - `CAUSE REJETÉE` : Les preuves démontrent que l'explication est fausse ou contredite par les faits.
  - `CAUSE NON DÉMONTRÉE` : La cause reste au stade de supposition sans preuve formelle.
  - `ANALYSE À REFAIRE` : Investigation incomplète, incohérente ou reposant sur des prémisses erronées.
- **Contrôle strict de non-intervention** : Aucun code, configuration ou table de base de données n'est altéré au cours de cette session.

---

## SYNTHÈSE GLOBALE

Sur les 6 causes instruites par l'Agent 3 :
- **4 causes sont CONFIRMÉES à 100%** (`CAUSE-001`, `CAUSE-002`, `CAUSE-005`, `CAUSE-006`).
- **2 causes sont PARTIELLEMENT CONFIRMÉES avec réévaluation majeure du périmètre et de la complexité** (`CAUSE-003`, `CAUSE-004`).
- **0 cause rejetée**, **0 analyse à refaire**.

### Synthèse des Découvertes Clés de Contre-Expertise :
1. **`CAUSE-004` (Wave 502 vs Fallback Manuel — ANOM-004)** : L'Agent 3 a diagnostiqué une asymétrie de code backend due au patch `AUD-083`. La contre-expertise indépendante révèle que `AUD-083` avait été mis en place délibérément pour compenser une carence de l'interface frontend (`DrawerCartSuccessModal.tsx`) qui ne dispose d'aucun écran pour guider un paiement manuel Wave. Corriger uniquement le backend provoquerait une régression sévère (commandes non payées et annulations silencieuses 2h plus tard). Il s'agit d'une **cause multiple (Backend + Frontend)**.
2. **`CAUSE-003` (Absence de log audit IDOR — ANOM-003)** : L'Agent 3 a circonscrit le problème à la route `POST /api/boutiques/:id/produits`. La contre-expertise révèle que le middleware centralisé `requireBoutiqueOwnership()` **n'est utilisé dans AUCUNE route de l'application**. Des dizaines d'endpoints de gestion marchande (`boutiques-produits`, `boutiques-integrations`, `credits`, `entrepots`, `boutiques-retours`) omettent l'enregistrement dans `security_audit_vault`. Le périmètre est systémique.
3. **Résolution intégrale des 4 incertitudes ouvertes** :
   - `INCERTITUDE-001` (Wave UX/Sécurité) : Résolue (dépendance frontend démontrée).
   - `INCERTITUDE-002` (Périmètre IDOR) : Résolue (cartographie complète des routes fournie).
   - `INCERTITUDE-003` (Inscription WhatsApp) : Résolue (`whatsapp-otp-register` persiste bien le téléphone, l'omission est cantonnée à `POST /inscription`).
   - `INCERTITUDE-004` (Divergences REST) : Résolue (erreur de spécification du plan de tests sans impact applicatif).

---

## CAUSES CONFIRMÉES

### CAUSE-001

* **CAUSE-ID** : `CAUSE-001`
* **ANOMALIE-ID** : `ANOM-001`
* **TEST-ID** : `TEST-001`
* **CAUSE PROPOSÉE PAR AGENT 3** : Omission du paramètre `telephone` lors de la déstructuration du payload HTTP et absence de la colonne `telephone` dans la requête d'insertion SQL `INSERT INTO utilisateurs`.
* **STATUT INITIAL** : `CAUSE CONFIRMÉE`
* **PREUVES EXAMINÉES** :
  - `audit/04_RESULTATS/PREUVES/TEST-001_preuve-01.json` (db_record avec `telephone: null`).
  - `backend/routes/auth.js:35-112` (contrôleur `POST /api/auth/inscription`).
  - `backend/migrate-inline.js:145` (déclaration de table `utilisateurs`).
  - `frontend-next/src/app/actions/auth.ts:42-69` (Server Action `signup`).
  - `backend/routes/auth.js:852-898` (contrôleur `POST /api/auth/whatsapp-otp-register`).
* **FAITS CONFIRMÉS** :
  - FACT 1 : La colonne `telephone VARCHAR(20)` existe dans la table PostgreSQL `utilisateurs`.
  - FACT 2 : Le payload de test envoyait explicitement `telephone: "+221770000001"`.
  - FACT 3 : À la ligne 54 de `backend/routes/auth.js`, l'extraction est `const { nom, email, mot_de_passe } = req.body;` : `telephone` est ignoré.
  - FACT 4 : Aux lignes 61-64, la requête `INSERT INTO utilisateurs (nom,email,mot_de_passe_hash,est_apporteur,code_apporteur,jwt_version) VALUES ($1,$2,$3,true,$4,1) RETURNING ...` n'insère ni ne retourne `telephone`.
* **OBSERVATIONS TECHNIQUES** :
  - L'Agent 4 note une cause secondaire côté client : dans `frontend-next/src/app/actions/auth.ts:42-56`, l'action `signup` n'extrait pas non plus `telephone` du `FormData` pour le transmettre à l'API. En revanche, à la ligne 64, elle tente d'initialiser la session avec `telephone: data.user.telephone`.
  - La route alternative `POST /api/auth/whatsapp-otp-register` (`backend/routes/auth.js:882`) gère quant à elle parfaitement l'insertion de `telephone`.
* **PREUVE DU LIEN CAUSAL** : L'absence de la variable dans le tuple d'insertion SQL garantit mécaniquement que la colonne PostgreSQL conserve sa valeur par défaut `NULL`.
* **CONTRE-ARGUMENTS** :
  - *Argument testé* : Un trigger SQL efface-t-il le numéro ? Rejeté : aucun trigger `BEFORE/AFTER INSERT` n'altère le téléphone.
  - *Argument testé* : Est-ce une volonté délibérée de sécurité (RGPD) ? Rejeté : `PUT /api/auth/profil` et `whatsapp-otp-register` acceptent et stockent le téléphone en clair.
* **CAUSES ALTERNATIVES** :
  - *Alternative 1* : Échec de validation express-validator ? Écartée : `telephone` n'est même pas mentionné dans les validateurs des lignes 37-49.
  - *Alternative 2* : Masquage par la clause `RETURNING` ? Partielle : la clause ne le retourne pas, mais la base confirme que la valeur stockée est effectivement `NULL`.
* **TESTS/VÉRIFICATIONS EFFECTUÉS** : Relecture intégrale du contrôleur `backend/routes/auth.js`, vérification du schéma dans `migrate-inline.js` et inspection croisée avec `whatsapp-otp-register`.
* **RÉSULTATS** : 100% cohérent.
* **HISTORIQUE** : Aucune trace dans Git d'une régression ; omission présente dès la création initiale de la route.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Anomalie native).
* **LOCALISATION TECHNIQUE VALIDÉE** : `backend/routes/auth.js:54, 61-64` (et secondairement `frontend-next/src/app/actions/auth.ts:43, 55`).
* **PÉRIMÈTRE DE LA CAUSE** : Contrôleur d'inscription classique email/mot de passe.
* **CAUSES SECONDAIRES** : Absence de validation / normalisation de numéro (`normalisePhone`) dans le validateur `express-validator` d'inscription.
* **CONCLUSION DE LA CONTRE-EXPERTISE** : Le diagnostic de l'Agent 3 est parfaitement exact et démontré.
* **STATUT FINAL** : **CAUSE CONFIRMÉE**

---

### CAUSE-002

* **CAUSE-ID** : `CAUSE-002`
* **ANOMALIE-ID** : `ANOM-002`
* **TEST-ID** : `TEST-002`
* **CAUSE PROPOSÉE PAR AGENT 3** : Divergence de spécification entre le plan de tests d'audit rédigé par l'Agent 1 (qui a postulé l'URL conventionnelle `/api/auth/moi`) et l'architecture logicielle établie du backend et du frontend Nopalou (qui utilise universellement `/api/auth/profil`). Absence d'alias de compatibilité `/api/auth/moi` côté Express.
* **STATUT INITIAL** : `CAUSE CONFIRMÉE`
* **PREUVES EXAMINÉES** :
  - `audit/04_RESULTATS/PREUVES/TEST-002_preuve-01.json` (404 sur `/api/auth/moi`, 200 puis 401 sur `/api/auth/profil`).
  - `backend/routes/auth.js:525-534` (déclaration de `GET /profil`).
  - `frontend-next/src/app/actions/auth.ts:97`, `frontend-next/src/app/(account)/compte/page.tsx:16` (appels à `/api/auth/profil`).
  - Historique Git global (`git log -S "auth/moi"`).
* **FAITS CONFIRMÉS** :
  - FACT 1 : La route `GET /api/auth/moi` n'existe nulle part dans le code source de Nopalou.
  - FACT 2 : La route `GET /api/auth/profil` est active, protégée par `verifierToken`, et retourne les données du profil utilisateur.
  - FACT 3 : Le test adapté exécuté par l'Agent 2 prouve que le mécanisme de révocation par `jwt_version` fonctionne avec une intégrité parfaite (HTTP 200 avant déconnexion, HTTP 401 après déconnexion).
* **OBSERVATIONS TECHNIQUES** : L'anomalie `ANOM-002` est un pur faux échec applicatif induit par une hypothèse théorique de nommage formulée par l'Agent 1 lors de la conception du plan de tests.
* **PREUVE DU LIEN CAUSAL** : Express renvoie son handler 404 standard (`Endpoint API introuvable : GET /api/auth/moi`) car aucune route de ce nom n'est enregistrée dans le routeur.
* **CONTRE-ARGUMENTS** :
  - *Argument testé* : `/api/auth/moi` a-t-il été supprimé lors d'un refactoring ? Rejeté : recherche git confirmant 0 occurrence historique.
* **CAUSES ALTERNATIVES** :
  - *Alternative 1* : Middleware de réécriture d'URL défaillant ? Écartée : aucun middleware de rewrite d'URL n'existe dans `backend/app.js`.
* **TESTS/VÉRIFICATIONS EFFECTUÉS** : Scan ripgrep de la base de code, vérification de la table de routage Express.
* **RÉSULTATS** : Conforme.
* **HISTORIQUE** : Aucune régression.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Erreur de spécification d'audit).
* **LOCALISATION TECHNIQUE VALIDÉE** : `audit/02_PLAN_TESTS/PLAN_TESTS.md:40` (spécification en cause) vs `backend/routes/auth.js:525` (route réelle).
* **PÉRIMÈTRE DE LA CAUSE** : Documentation du plan d'audit et contrat d'interface public.
* **CAUSES SECONDAIRES** : Absence d'un alias de complaisance REST `/api/auth/moi` dans Express.
* **CONCLUSION DE LA CONTRE-EXPERTISE** : Diagnostic validé. L'application est saine ; le cas de test reposait sur une URL inexacte.
* **STATUT FINAL** : **CAUSE CONFIRMÉE**

---

### CAUSE-005

* **CAUSE-ID** : `CAUSE-005`
* **ANOMALIE-ID** : `ANOM-005`
* **TEST-ID** : `TEST-010`
* **CAUSE PROPOSÉE PAR AGENT 3** : Divergence de convention de nommage REST entre la spécification théorique de l'Agent 1 (`/pos/sessions/...` et `/pos/tiroir`) et la nomenclature réelle unifiée du projet (`/pos-sessions/...`).
* **STATUT INITIAL** : `CAUSE CONFIRMÉE`
* **PREUVES EXAMINÉES** :
  - `audit/04_RESULTATS/PREUVES/TEST-010_preuve-01.json` (404 sur routes strictes, 201/200/200 sur routes adaptées avec écart de caisse 0.00 FCFA).
  - `backend/routes/boutiques-modules/boutiques-pos.js:803, 866, 993`.
  - `frontend-next/src/lib/sync-manager.ts:171, 274`.
  - `frontend-next/src/app/boutique/caisse/components/PosModalsHost.tsx:174`.
* **FAITS CONFIRMÉS** :
  - FACT 1 : Les routes réelles implémentées sont `POST /:id/pos-sessions/ouvrir`, `POST /:id/pos-sessions/:sessionId/mouvements` et `POST /:id/pos-sessions/cloturer`.
  - FACT 2 : L'ensemble du code frontend (synchroniseur IndexedDB, modales de caisse) utilise strictement `/pos-sessions/...`.
  - FACT 3 : Le cycle POS s'exécute sans aucune anomalie métier lors de l'appel aux routes réelles (fond initial, déduction du mouvement de tiroir, calcul de clôture).
* **OBSERVATIONS TECHNIQUES** : La structure `/pos/sessions` et `/pos/tiroir` imaginée par l'Agent 1 n'a jamais été codée ni revendiquée par l'application.
* **PREUVE DU LIEN CAUSAL** : Express retourne 404 sur les endpoints stricts faute de concordance de route.
* **CONTRE-ARGUMENTS** : Aucun.
* **CAUSES ALTERNATIVES** : Écartées après vérification de l'historique du module POS (commit `86bb7b21`).
* **TESTS/VÉRIFICATIONS EFFECTUÉS** : Inspection du routeur `boutiques-pos.js` et des clients d'appel POS.
* **RÉSULTATS** : Conforme.
* **HISTORIQUE** : Aucune régression.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE` (Erreur de spécification d'audit).
* **LOCALISATION TECHNIQUE VALIDÉE** : `audit/02_PLAN_TESTS/PLAN_TESTS.md:212-214`.
* **PÉRIMÈTRE DE LA CAUSE** : Suite de tests d'audit.
* **CAUSES SECONDAIRES** : Aucune.
* **CONCLUSION DE LA CONTRE-EXPERTISE** : Diagnostic confirmé.
* **STATUT FINAL** : **CAUSE CONFIRMÉE**

---

### CAUSE-006

* **CAUSE-ID** : `CAUSE-006`
* **ANOMALIE-ID** : `ANOM-006`
* **TEST-ID** : `TEST-014`
* **CAUSE PROPOSÉE PAR AGENT 3** : Omission de la dimension multi-tenant `:slugOrId` de l'agence dans la spécification du cas de test, et définition d'un seuil d'acceptation de taille binaire arbitraire (> 5 000 octets) déconnecté des caractéristiques physiques d'un PDF vectoriel optimisé sans polices externes intégrées.
* **STATUT INITIAL** : `CAUSE CONFIRMÉE`
* **PREUVES EXAMINÉES** :
  - `audit/04_RESULTATS/PREUVES/TEST-014_preuve-01.json` (bail 201, paiement 200, PDF 200 avec taille 3 161 octets).
  - `backend/routes/locatif-immo.js:83, 1145-1240` (générateur `genererPdfQuittanceStream`).
  - Spécification `audit/02_PLAN_TESTS/PLAN_TESTS.md:308, 311`.
  - Règle d'or Nopalou `AGENTS.md` (interdiction formelle des polices externes / CDN fonts).
* **FAITS CONFIRMÉS** :
  - FACT 1 : La route `POST /api/locatif-immo/agence/:slugOrId/baux` applique scrupuleusement la sécurité multi-tenant via `requireAgenceAccess()`. Une route globale sans agence constituerait une faille IDOR.
  - FACT 2 : Le document PDF produit par PDFKit utilise les polices standard ISO 32000 (`Helvetica`, `Helvetica-Bold`), qui ne sont pas embarquées dans le flux binaire, produisant une taille structurelle minimale et hautement optimisée de 3 161 octets.
  - FACT 3 : L'inspection détaillée du code du générateur aux lignes 1154-1240 confirme la présence de **l'ensemble des mentions légales obligatoires du Code des Obligations Civiles et Commerciales (COCC) du Sénégal** : visa de conformité COCC, agrément professionnel de l'agence mandataire, identités preneur/bailleur, décomposition loyer / charges / timbre de quittance légal (100 FCFA), mention de quittance libératoire intégrale et cartouche de visa d'agence.
* **OBSERVATIONS TECHNIQUES** : Le seuil de 5 000 octets inventé par l'Agent 1 imposait de facto une surcharge binaire inutile ou l'embarquement d'une police TTF externe, ce qui est formellement prohibé par les directives de performance Nopalou.
* **PREUVE DU LIEN CAUSAL** :
  1. 404 strict causé par l'omission du segment de routage `:slugOrId`.
  2. Échec du critère de taille causé par une borne arbitraire non calibrée sur le moteur vectoriel natif.
* **CONTRE-ARGUMENTS** :
  - *Argument testé* : Le PDF est-il incomplet ou tronqué ? Rejeté : le marqueur `%%EOF` et tous les éléments graphiques et textuels sont présents.
* **CAUSES ALTERNATIVES** : Écartées.
* **TESTS/VÉRIFICATIONS EFFECTUÉS** : Revue légale du texte généré par rapport aux exigences du droit locatif sénégalais (COCC).
* **RÉSULTATS** : Le document est 100% conforme et directement exploitable.
* **HISTORIQUE** : Aucune régression.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE`.
* **LOCALISATION TECHNIQUE VALIDÉE** : `audit/02_PLAN_TESTS/PLAN_TESTS.md:308, 311`.
* **PÉRIMÈTRE DE LA CAUSE** : Cadrage du test d'audit locatif.
* **CAUSES SECONDAIRES** : Aucune.
* **CONCLUSION DE LA CONTRE-EXPERTISE** : Diagnostic confirmé. L'anomalie de taille est un faux positif d'audit caractérisé.
* **STATUT FINAL** : **CAUSE CONFIRMÉE**

---

## CAUSES PARTIELLEMENT CONFIRMÉES

### CAUSE-003

* **CAUSE-ID** : `CAUSE-003`
* **ANOMALIE-ID** : `ANOM-003`
* **TEST-ID** : `TEST-005`
* **CAUSE PROPOSÉE PAR AGENT 3** : Implémentation défensive manuelle (`checkBoutiqueAccess` suivi de `res.status(403)`) omettant l'appel à la fonction de journalisation `logSecurityViolation()` et ne recourant pas au middleware centralisé `requireBoutiqueOwnership()` sur `POST /api/boutiques/:id/produits`.
* **STATUT INITIAL** : `CAUSE CONFIRMÉE`
* **PREUVES EXAMINÉES** :
  - `audit/04_RESULTATS/PREUVES/TEST-005_preuve-01.json` (0 log d'audit pour le test sur les produits).
  - `backend/routes/boutiques-modules/boutiques-produits.js:123-130`.
  - `backend/middlewares/tenantSecurity.js:72-123` (implémentation de `requireBoutiqueOwnership`).
  - Scan de l'ensemble de l'arborescence `backend/routes/boutiques-modules/`.
* **FAITS CONFIRMÉS** :
  - FACT 1 : La sécurité anti-IDOR est fonctionnellement active : `checkBoutiqueAccess(id, req.user.userId)` bloque effectivement l'agresseur avec un statut HTTP 403 Forbidden.
  - FACT 2 : Aucun appel à `logSecurityViolation()` n'est exécuté dans `POST /:id/produits`, ni dans `PUT /:id/produits/:prodId` (l. 260), ni dans `DELETE /:id/produits/:prodId` (l. 389), ni dans `POST /:id/produits/:prodId/dupliquer` (l. 413).
  - FACT 3 : Le middleware `requireBoutiqueOwnership()` défini dans `backend/middlewares/tenantSecurity.js:72` **n'est utilisé dans AUCUNE route de toute l'application backend**.
* **OBSERVATIONS TECHNIQUES & ÉLARGISSEMENT MAJEUR DU PÉRIMÈTRE (CONTRE-EXPERTISE)** :
  L'Agent 3 a qualifié l'anomalie de "vérification manuelle ponctuelle sur les produits".
  L'investigation approfondie menée par l'Agent 4 prouve que **le problème est systémique à travers la totalité des modules boutiques** :
  1. Dans `backend/routes/boutiques-modules/boutiques-integrations.js` : 12 routes utilisent `checkBoutiqueAccess` sans jamais journaliser dans `security_audit_vault`.
  2. Dans `backend/routes/boutiques-modules/credits.js` : 13 routes effectuent une vérification manuelle sans journalisation.
  3. Dans `backend/routes/boutiques-modules/entrepots.js` : 5 routes sans journalisation.
  4. Dans `backend/routes/boutiques-modules/boutiques-retours.js` : 2 routes sans journalisation.
  5. Seules 5 routes dans tout le backend appellent manuellement `logSecurityViolation()` : `boutiques-equipe.js:140`, `boutiques-fidelite.js:51`, et 3 routes dans `boutiques-pos.js:118, 567, 612`.
* **PREUVE DU LIEN CAUSAL** : L'événement n'est pas inséré dans `security_audit_vault` tout simplement parce que la fonction `logSecurityViolation` n'est pas invoquée par le code du handler.
* **CONTRE-ARGUMENTS** :
  - *Argument testé* : S'agit-il d'une panne du coffre d'audit (table verrouillée ou erreur SQL) ? Rejeté : lors du même test, la tentative sur `comptabilite.js` a inséré avec succès l'événement `UNAUTHORIZED_ORDERS_ACCESS`.
* **CAUSES ALTERNATIVES** : Écartées.
* **TESTS/VÉRIFICATIONS EFFECTUÉS** : Analyse par recherche syntaxique complète de l'usage de `logSecurityViolation` et `requireBoutiqueOwnership` dans l'ensemble du projet.
* **RÉSULTATS** : Diagnostic partiel de l'Agent 3 confirmé, mais **périmètre réel sous-estimé d'un facteur 10**.
* **HISTORIQUE** : Aucune régression ; dette architecturale d'adoption du middleware.
* **RÉGRESSION** : `RÉGRESSION NON DÉMONTRÉE`.
* **LOCALISATION TECHNIQUE VALIDÉE** : Non pas uniquement `boutiques-produits.js:127-130`, mais l'ensemble des modules marchands sous `backend/routes/boutiques-modules/`.
* **PÉRIMÈTRE DE LA CAUSE** : Architecture globale de contrôle d'accès boutique.
* **CAUSES SECONDAIRES** : Absence de standardisation du middleware de route `requireBoutiqueOwnership()` sur la stack Express.
* **CONCLUSION DE LA CONTRE-EXPERTISE** :
  La cause identifiée explique le symptôme sur `TEST-005`, mais l'analyse de l'Agent 3 est incomplète car elle présente comme ponctuel un défaut architectural transverse. L'Agent 5 devra traiter l'adoption générale du middleware ou de la journalisation.
* **STATUT FINAL** : **CAUSE PARTIELLEMENT CONFIRMÉE** (Mécanisme exact, périmètre incomplet).

---

### CAUSE-004

* **CAUSE-ID** : `CAUSE-004`
* **ANOMALIE-ID** : `ANOM-004`
* **TEST-ID** : `TEST-009`
* **CAUSE PROPOSÉE PAR AGENT 3** : Gestion asymétrique et contradictoire des erreurs de passerelle entre Wave et Orange Money, résultant du maintien dans le handler Wave de la règle historique `AUD-083` (qui prescrit l'annulation de commande et un code 502) en conflit direct avec le standard de résilience documenté dans `CLAUDE.md:58` et validé sur Orange Money (fallback manuel en HTTP 201).
* **STATUT INITIAL** : `CAUSE CONFIRMÉE`
* **PREUVES EXAMINÉES** :
  - `audit/04_RESULTATS/PREUVES/TEST-009_preuve-01.json` (502 Bad Gateway Wave).
  - `backend/routes/comptabilite.js:965-989` (bloc `catch (waveErr)` et commentaire `AUD-083`).
  - Commit historique `7ce40c00` (`fix(commerce): AUD-072 a AUD-086...`).
  - `frontend-next/src/components/cart/useDrawerCartCheckout.ts:326-340`.
  - `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx:130-300`.
  - `frontend-next/src/app/boutiques/[id]/commander/useCommander.ts:294`.
* **FAITS CONFIRMÉS** :
  - FACT 1 : Avant le commit `7ce40c00`, Wave renvoyait exactement le même fallback manuel qu'Orange Money (HTTP 201 + `fallback_manuel: true`).
  - FACT 2 : Le commit `7ce40c00` a introduit le remplacement par `annulerCommandeNonPayee` et code HTTP 502 avec le commentaire explicite :
    `// AUD-083 : comme la route express, la commande sans session de paiement est annulée et le stock restitué (auparavant : 201 + paiement manuel que le panier n'affichait pas, annulation silencieuse 2 h plus tard).`
  - FACT 3 : L'inspection de `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx` prouve que la modale de succès du panier ne possède **aucun affichage pour le numéro de dépôt Wave ou les consignes de transfert manuel**. Elle affiche simplement "Commande enregistrée" avec un lien de suivi et WhatsApp.
  - FACT 4 : D'autres pages du frontend (`useCommander.ts:294`, `checkout-express/page.tsx:298`) gèrent déjà le fallback manuel, mais pas le composant principal du panier boutique (`DrawerCart`).
* **OBSERVATIONS TECHNIQUES & DÉMONSTRATION DE LA CAUSE MULTIPLE (CONTRE-EXPERTISE)** :
  L'Agent 3 a conclu à une simple "asymétrie de code backend à aligner sur Orange Money".
  **Cette conclusion est dangereuse si appliquée telle quelle par l'Agent 5.**
  En effet :
  1. Pourquoi `AUD-083` avait-il été codé ainsi ? Parce qu'un fallback HTTP 201 renvoyé au panier trompait l'utilisateur en lui affichant "Commande enregistrée" sans lui donner le moyen de payer. Le client ne payait donc jamais, et le cron de purge annulait la commande 2h plus tard !
  2. Si l'Agent 5 supprime purement et simplement le code 502 côté backend pour retourner HTTP 201 avec `fallback_manuel: true` (modèle Orange Money), **le panier retombera exactement dans le piège décrit par `AUD-083`**.
  3. L'anomalie `ANOM-004` est donc la conséquence d'une **cause multiple indissociable** :
     - **Cause Racine Backend** : Rupture du contrat de résilience unifié (`CLAUDE.md:58`) par introduction d'une annulation destructive HTTP 502 dans `catch (waveErr)`.
     - **Cause Racine Frontend** : Absence de prise en charge du mode de paiement manuel / numéro de dépôt dans le composant `DrawerCartSuccessModal.tsx`.
* **PREUVE DU LIEN CAUSAL** : Le statut 502 est expressément généré par la ligne 988 de `backend/routes/comptabilite.js` suite à la capture de l'erreur réseau/API Wave.
* **CONTRE-ARGUMENTS** :
  - *Argument testé* : Le statut 502 est-il émis par un proxy inverse Render/Nginx ? Formellement réfuté : le JSON retourné contient le texte littéral codé dans le contrôleur Express.
* **CAUSES ALTERNATIVES** : Écartées.
* **TESTS/VÉRIFICATIONS EFFECTUÉS** : Analyse du diff Git du commit `7ce40c00`, traçage du flux de paiement dans `useDrawerCartCheckout.ts` et `DrawerCartSuccessModal.tsx`.
* **RÉSULTATS** : La causalité est prouvée, mais le diagnostic de l'Agent 3 est incomplet en omettant la dépendance frontend.
* **HISTORIQUE** : Dégradation fonctionnelle introduite lors du lot AUD-083 (commit `7ce40c00`).
* **RÉGRESSION** : `RÉGRESSION CONFIRMÉE` (Régression volontaire introduite pour pallier un défaut d'interface, entrant en conflit avec la directive maîtresse `CLAUDE.md:58`).
* **LOCALISATION TECHNIQUE VALIDÉE** :
  - Backend : `backend/routes/comptabilite.js:982-989`.
  - Frontend : `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx:130-248` et `useDrawerCartCheckout.ts:333-345`.
* **PÉRIMÈTRE DE LA CAUSE** : Tunnel de commande complet (création backend + modale de validation panier).
* **CAUSES SECONDAIRES** : Manque d'environnement de simulation Wave Sandbox (mock) pour les tests automatisés d'audit.
* **CONCLUSION DE LA CONTRE-EXPERTISE** :
  Le diagnostic backend de l'Agent 3 est confirmé, mais la contre-expertise alerte formellement l'Agent 5 : **le plan de correction ne peut pas être un simple patch backend**. Il devra obligatoirement être un correctif couplé (alignement backend en 201 + affichage des instructions de dépôt Wave dans la modale panier) pour éradiquer définitivement le dilemme `AUD-083`.
* **STATUT FINAL** : **CAUSE PARTIELLEMENT CONFIRMÉE** (Cause exacte côté backend, mais cause multiple avec dépendance UI obligatoire).

---

## CAUSES REJETÉES

*(Aucune cause n'a été rejetée. Les 6 causes examinées reposent toutes sur des faits matériels réels et vérifiables).*

---

## CAUSES NON DÉMONTRÉES

*(Aucune cause n'a été laissée à l'état de cause non démontrée).*

---

## ANALYSES À REFAIRE

*(Aucune analyse n'est à refaire de zéro. En revanche, les périmètres de remédiation de `CAUSE-003` et `CAUSE-004` doivent être considérablement enrichis par l'Agent 5 conformément aux conclusions de la présente contre-expertise).*

---

## RÉGRESSIONS

L'analyse de non-régression menée sur l'historique Git et les versions antérieures permet d'établir les qualifications formelles suivantes :

| ANOMALIE-ID | STATUT RÉGRESSION | JUSTIFICATION TECHNIQUE DÉMONTRÉE |
| :--- | :---: | :--- |
| `ANOM-001` | **RÉGRESSION NON DÉMONTRÉE** | Omission originelle dans le contrôleur d'inscription classique dès sa création. |
| `ANOM-002` | **RÉGRESSION NON DÉMONTRÉE** | La route `/api/auth/moi` n'a jamais existé. Faux échec de test. |
| `ANOM-003` | **RÉGRESSION NON DÉMONTRÉE** | Le middleware `requireBoutiqueOwnership` n'a jamais été câblé sur ces modules. Dette technique native. |
| `ANOM-004` | **RÉGRESSION CONFIRMÉE** | **Preuve Git** : Avant le commit `7ce40c00`, le contrôleur Wave appliquait le même fallback 201 qu'Orange Money. Le patch `AUD-083` a délibérément supprimé ce mode de repli au profit d'un 502 avec annulation de commande, créant une régression d'expérience d'achat en contradiction avec `CLAUDE.md:58`. |
| `ANOM-005` | **RÉGRESSION NON DÉMONTRÉE** | Les routes `/pos-sessions/...` ont toujours été les routes effectives du système. Faux échec de test. |
| `ANOM-006` | **RÉGRESSION NON DÉMONTRÉE** | Le multi-tenant agence a toujours requis `:slugOrId`, et le PDF vectoriel a toujours fait ~3 Ko. Faux échec de test. |

---

## CAUSES COMMUNES

La contre-expertise consolide et confirme la classification transversale en deux familles identifiée par l'Agent 3 :

```text
                                ANOMALIES D'AUDIT
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
   FAMILLE I : DIVERGENCES DE SPÉCIFICATION             FAMILLE II : ARCHITECTURE & SÉCURITÉ BACKEND
        (Contrat de test vs Réalité)                            (Code Applicatif & Cohérence)
             │                                                     │
   ┌─────────┼─────────┐                                 ┌─────────┼─────────┐
   ▼         ▼         ▼                                 ▼         ▼         ▼
ANOM-002  ANOM-005  ANOM-006                          ANOM-001  ANOM-003  ANOM-004
(route    (routes   (route baux                       (téléphone (carence (conflit résilience
 profil)   pos)      & seuil PDF)                      oublié)    audit)   Wave 502/AUD-083)
```

1. **Famille I (`ANOM-002`, `ANOM-005`, `ANOM-006`) — Cause Commune de Rédaction** :
   - L'Agent 1 a rédigé le plan de tests à partir d'abstractions théoriques REST sans confronter les endpoints aux routeurs réels ni aux directives techniques de sobriété binaire (PDF vectoriel compact).
   - Ces 3 anomalies ne requièrent aucune intervention corrective risquée sur le code applicatif principal.

2. **Famille II (`ANOM-001`, `ANOM-003`, `ANOM-004`) — Cause Commune d'Hétérogénéité d'Implémentation** :
   - Manque d'homogénéité dans l'application des standards transversaux :
     - La persistance du téléphone est faite dans le flux WhatsApp mais oubliée dans le flux email.
     - La journalisation IDOR est implémentée sur les commandes et les agences immo, mais oubliée sur les catalogues produits et modules boutiques.
     - Le repli gracieux de paiement est actif sur Orange Money mais sabordé par un 502 destructeur sur Wave.

---

## CAUSES MULTIPLES

L'analyse de contre-expertise confirme formellement que l'anomalie `ANOM-004` relève d'une structure de **causes multiples intriquées** :

```text
                                  ANOM-004 (Échec Commande Wave)
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
         CAUSE PRINCIPALE 1                                            CAUSE PRINCIPALE 2
       (Backend Express / AUD-083)                                  (Frontend React / Panier)
  Annulation destructive de la commande                       Absence de restitution visuelle du
    et émission d'une erreur 502 au lieu                        numéro de dépôt et des consignes Wave
    de retourner HTTP 201 + fallback_manuel.                     dans DrawerCartSuccessModal.tsx.
                 │                                                             │
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                                   CONDITION AGGRAVANTE (Réseau)
                               Échec de communication réseau sortant
                               vers l'API externe Wave (Sandbox/Prod).
```

Toute tentative de résoudre `ANOM-004` en traitant uniquement la Cause 1 sans traiter la Cause 2 provoquera la résurgence immédiate de la régression `AUD-083`.

---

## RISQUES POUR LA PHASE DE CORRECTION (RECOMMANDATIONS POUR L'AGENT 5)

L'Agent 4 consigne les 5 règles d'or et avertissements suivants pour la conception du plan de correction :

1. **Risque de Commande Fantôme sur Wave (`ANOM-004`)** :
   - Ne PAS se contenter de modifier `backend/routes/comptabilite.js` pour renvoyer 201 avec `fallback_manuel: true`.
   - L'Agent 5 DOIT impérativement planifier la modification de `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx` et `useDrawerCartCheckout.ts` pour afficher distinctement le numéro de dépôt et les instructions de transfert lorsque `fallback_manuel === true`.
2. **Risque de Régression sur les Rôles Collaborateurs (`ANOM-003`)** :
   - Lors de la généralisation de `requireBoutiqueOwnership()` ou de `logSecurityViolation()`, s'assurer que les employés / gérants délégués (table `boutique_utilisateurs`) conservent leurs droits légitimes et ne soient pas faussement bloqués comme des attaquants IDOR.
3. **Risque de Normalisation Téléphonique (`ANOM-001`)** :
   - Ne pas insérer aveuglément le numéro de téléphone sans lui appliquer la fonction `normalisePhone()` (gestion des préfixes `+221`, `00221` et espaces).
   - Compléter la chaîne côté client dans `frontend-next/src/app/actions/auth.ts` pour extraire `telephone` du `FormData`.
4. **Préservation de l'Interdiction des Polices Externes (`ANOM-006`)** :
   - Ne SURTOUT PAS tenter d'alourdir le PDF avec des polices CDN pour satisfaire le seuil artificiel de 5 Ko. La quittance est juridiquement et graphiquement impeccable à 3,1 Ko. Ajuster le plan de test.
5. **Stratégie d'Alias REST (`ANOM-002`, `ANOM-005`)** :
   - Privilégier la mise à jour des spécifications du plan de test. Si des alias Express sont créés (`/api/auth/moi` -> redirect ou handler commun), s'assurer qu'ils ne créent pas de redondance ou de faille de rate-limiting.

---

## CONCLUSION

La contre-expertise indépendante de l'Agent 4 valide avec force la solidité fondamentale des constats techniques de l'Agent 3, tout en apportant des corrections d'orientation décisives :
- `CAUSE-001`, `CAUSE-002`, `CAUSE-005` et `CAUSE-006` sont **CONFIRMÉES** sans réserve.
- `CAUSE-003` est **PARTIELLEMENT CONFIRMÉE**, son périmètre réel étant requalifié de ponctuel à systémique (dizaines de routes concernées sous `boutiques-modules`).
- `CAUSE-004` est **PARTIELLEMENT CONFIRMÉE**, requalifiée de régression avérée avec cause multiple indissociable (Backend + UI Panier).
- Les 4 incertitudes documentées sont intégralement levées avec démonstrations matérielles à l'appui.

L'Agent 5 dispose d'un diagnostic exhaustif, sécurisé et dépourvu de toute ambiguïté pour bâtir un plan de remédiation fiable.
