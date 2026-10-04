# PLAN GLOBAL DE REMÉDIATION TECHNIQUE — NOPALOU

```text
DOCUMENT : PLAN_REMEDIATION.md
SESSION-ID : AUDIT-2026-005-AG05
DATE : 2026-10-04
AGENT : AGENT-05 (Planificateur de Remédiation)
VERSION CIBLE : 4c0237273fde2d058d5eabca5f94b79ceb07d37e
STATUT : HOMOLOGUÉ — PRÊT POUR EXÉCUTION PAR AGENT 6
```

---

## 1. Résumé Exécutif

Le présent plan de remédiation technique traduit l'ensemble des anomalies identifiées et causes validées lors des phases 2, 3 et 4 de l'audit en un ensemble d'actions de correction univoques, ordonnancées, traçables et vérifiables.

### Métriques Clés de l'Audit :
* **Anomalies instruites** : 6 (`ANOM-001` à `ANOM-006`)
* **Causes confirmées à 100%** : 4 (`CAUSE-001`, `CAUSE-002`, `CAUSE-005`, `CAUSE-006`)
* **Causes partiellement confirmées (périmètre élargi / cause multiple)** : 2 (`CAUSE-003`, `CAUSE-004`)
* **Causes rejetées** : 0
* **Causes non démontrées** : 0
* **Corrections planifiées** : 6 (`FIX-001` à `FIX-006`)
* **Corrections bloquées pour cause non démontrée** : 0
* **Garde-fous d'exécution stricts** : 2 (interdiction formelle de patch backend isolé pour `FIX-004` ; interdiction absolue d'injection de polices CDN pour `FIX-006`).

---

## 2. Synthèse et Priorisation des Actions (P0 à P4)

La criticité de chaque intervention est graduée en fonction de son impact opérationnel réel, de son exposition sécuritaire et des risques financiers ou fonctionnels démontrés :

* **P0 — Bloquant Critique** : *Aucun cas en l'espèce* (aucun crash global de démarrage ni faille critique ouverte).
* **P1 — Critique / Majeur Métier & Sécurité** :
  - **`FIX-001`** : Persistance et normalisation du numéro de téléphone lors de l'inscription utilisateur (intégrité des comptes et notifications WhatsApp).
  - **`FIX-003`** : Traçabilité obligatoire des violations IDOR dans `security_audit_vault` sur les routes de mutation marchandes (`boutiques-produits.js`).
  - **`FIX-004`** : Suppression de l'erreur destructrice HTTP 502 Wave et rétablissement du mode de repli gracieux (HTTP 201 + fallback manuel guidé dans le panier `DrawerCartSuccessModal.tsx`).
* **P2 — Majeur Fonctionnel** : *Aucun cas*.
* **P3 — Modéré / Spécifications d'Audit & Cohérence REST** :
  - **`FIX-002`** : Alignement de spécification du plan d'audit sur `/api/auth/profil` et ajout d'un alias rétro-compatible `GET /api/auth/moi`.
  - **`FIX-005`** : Alignement de spécification du plan d'audit sur la nomenclature unifiée `/api/boutiques/:id/pos-sessions/...`.
  - **`FIX-006`** : Correction de l'URL multi-tenant agence du bail et réétalonnage du seuil de taille de quittance PDF (`> 2 500 octets`).
* **P4 — Mineur / Cosmétique** : *Aucun cas*.

---

## 3. Spécification Détaillée des Plans de Correction Individuels

---

### FIX-001 : Persistance et Normalisation du Téléphone à l'Inscription

* **FIX-ID** : `FIX-001`
* **ANOMALIE-ID** : `ANOM-001`
* **TEST-ID** : `TEST-001`
* **CAUSE-ID** : `CAUSE-001`
* **STATUT DE LA CAUSE** : `CAUSE CONFIRMÉE`
* **PRIORITÉ** : `P1`
* **GRAVITÉ** : `Majeure`
* **IMPACT** : Rupture du profil utilisateur à l'inscription classique : le champ `telephone` n'est pas inséré en base (reste `NULL`), ce qui désactive les notifications transactionnelles WhatsApp, fausse les exports et oblige l'utilisateur à ressaisir son numéro dans son profil.

#### PROBLÈME DÉMONTRÉ & PREUVE
* **Preuve** : Fichier `/audit/04_RESULTATS/PREUVES/TEST-001_preuve-01.json` montrant l'enregistrement utilisateur avec `telephone: null` après émission d'un payload contenant `telephone: "+221770000001"`.
* **Cause validée** : Omission du paramètre `telephone` lors de la déstructuration dans `backend/routes/auth.js:54` et absence de la colonne dans la requête `INSERT INTO utilisateurs` (`auth.js:61-64`). Côté frontend, le Server Action `signup` (`frontend-next/src/app/actions/auth.ts:43`) n'extrait pas non plus le champ `telephone` du `FormData`.

#### OBJECTIF DE LA CORRECTION
Garantir que tout numéro de téléphone transmis lors de l'inscription soit normalisé (format standard via `normalisePhone`), persisté dans la colonne `telephone` de la table `utilisateurs`, restitué dans l'objet réponse JSON et propagé dans le cookie de session Next.js.

#### ZONE TECHNIQUE CONCERNÉE
* **Fichiers** :
  - `backend/routes/auth.js` (lignes 35-77)
  - `frontend-next/src/app/actions/auth.ts` (lignes 42-66)
* **Modules** : `MOD-01` (Authentification, Sécurité & Sessions)
* **Composants** : Formulaire d'inscription (`InscriptionForm.tsx` transmet déjà `telephone`, action `signup` à aligner)
* **API** : `POST /api/auth/inscription`
* **Services** : `backend/services/whatsapp.js` (`normalisePhone`)
* **Base de données** : Table `utilisateurs` (colonne existante `telephone VARCHAR(20)`)
* **Configuration** : Aucune

#### MODIFICATION TECHNIQUE À EFFECTUER

##### Étape 1 — Préparation
- Vérifier que la table `utilisateurs` possède bien la colonne `telephone` (`VARCHAR(20)`).
- Vérifier que la fonction `normalisePhone` est bien importée à la ligne 9 de `backend/routes/auth.js`.

##### Étape 2 — Correction principale (Backend Express)
1. Dans les validateurs express-validator de `router.post('/inscription', ...)` (`auth.js:35-50`) :
   - Ajouter un validateur optionnel sur `telephone` :
     ```javascript
     body('telephone').optional({ nullable: true, checkFalsy: true }).isString().trim(),
     ```
2. Dans le contrôleur (`auth.js:54`) :
   - Déstructurer `telephone` :
     ```javascript
     const { nom, email, mot_de_passe, telephone } = req.body;
     ```
   - Normaliser le numéro s'il est renseigné :
     ```javascript
     const telNormalise = telephone ? normalisePhone(telephone) : null;
     ```
3. Mettre à jour la requête SQL `INSERT INTO utilisateurs` (`auth.js:61-64`) :
   - Insérer la colonne `telephone` :
     ```javascript
     ({ rows } = await pool.query(
       'INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, est_apporteur, code_apporteur, jwt_version) VALUES ($1, $2, $3, $4, true, $5, 1) RETURNING id, nom, email, telephone, code_apporteur, jwt_version',
       [nom, email, hash, telNormalise, codeApporteur]
     ));
     ```

##### Étape 3 — Correction Frontend (Server Action Next.js)
Dans `frontend-next/src/app/actions/auth.ts` (`export async function signup`) :
1. Extraire `telephone` du `formData` :
   ```typescript
   const telephone = formData.get('telephone')?.toString().trim() ?? ''
   ```
2. Transmettre `telephone` dans le corps de la requête POST :
   ```typescript
   body: JSON.stringify({ nom, email, mot_de_passe: password, telephone: telephone || undefined }),
   ```

##### Étape 4 — Cas limites
- **Téléphone absent ou chaîne vide** : La valeur stockée en base doit être `NULL` (et non la chaîne `""`).
- **Préfixes variés** (`00221...`, `+221...`, `77...`) : `normalisePhone()` doit convertir le numéro dans le format standard du système (sans espace ni tiret).
- **Course d'inscription concurrentielle** : Protégée par le bloc `try/catch` existant (`insertErr.code === '23505'`).

##### Étape 5 — Compatibilité & Non-Régression
- L'inscription reste 100% fonctionnelle si le champ téléphone n'est pas fourni (téléphone optionnel).
- Les flux d'inscription existants par OTP WhatsApp (`/api/auth/whatsapp-otp-register`) ne sont pas impactés.

#### COMPORTEMENT ACTUEL
`telephone` est ignoré par le contrôleur ; la colonne en base de données vaut `NULL`.

#### COMPORTEMENT ATTENDU
Le numéro est normalisé et enregistré en base ; la réponse API et le profil utilisateur contiennent le numéro propre.

#### CONTRAINTES À PRÉSERVER
- Conserver `est_apporteur = true` et la génération de `code_apporteur`.
- Conserver le statut HTTP 201 et l'envoi asynchrone de l'email de bienvenue.

#### DÉPENDANCES
- `backend/services/whatsapp.js` (`normalisePhone`).

#### RISQUES DE RÉGRESSION
- Rejet d'inscriptions valides si la validation était trop stricte (d'où l'usage de `.optional()`).

#### TESTS DE VALIDATION & RÉGRESSION
* **Validation** : `TEST-001-R`
* **Régression** : **GRAPPE C** (`TEST-002`, `TEST-003`, `TEST-004`).

#### CRITÈRES D'ACCEPTATION
1. `SELECT telephone FROM utilisateurs WHERE email = 'test@example.com'` retourne la valeur transmise.
2. Le JSON de réponse 201 contient `user.telephone !== null`.
3. Le rejeu de `TEST-001` sous runner de test passe avec statut `PASS`.

#### CONDITION DE CLÔTURE
Le test d'inscription persiste et restitue le téléphone sans altérer le flux de session.

---

### FIX-002 : Alignement du Contrat de Test & Alias Rétro-Compatible `/api/auth/moi`

* **FIX-ID** : `FIX-002`
* **ANOMALIE-ID** : `ANOM-002`
* **TEST-ID** : `TEST-002`
* **CAUSE-ID** : `CAUSE-002`
* **STATUT DE LA CAUSE** : `CAUSE CONFIRMÉE` (Divergence de spécification d'audit)
* **PRIORITÉ** : `P3`
* **GRAVITÉ** : `Mineure`
* **IMPACT** : Faux échec de test d'audit HTTP 404 sur `/api/auth/moi` alors que la route réelle de profil `/api/auth/profil` est active, sécurisée et intègre.

#### PROBLÈME DÉMONTRÉ & PREUVE
* **Preuve** : `/audit/04_RESULTATS/PREUVES/TEST-002_preuve-01.json` montrant une réponse 404 sur `/api/auth/moi` et un fonctionnement impeccable (200 puis 401 après révocation de token) sur `/api/auth/profil`.
* **Cause validée** : L'Agent 1 a formulé une hypothèse théorique de nommage `/api/auth/moi` non implémentée sur Nopalou.

#### OBJECTIF DE LA CORRECTION
1. Mettre à jour la spécification `audit/02_PLAN_TESTS/PLAN_TESTS.md` (lignes 40, 42) pour documenter la route contractuelle `/api/auth/profil`.
2. Par souci d'ergonomie et de compatibilité avec les clients REST standards, exposer un alias direct `GET /api/auth/moi` dans Express réutilisant exactement le contrôleur de `GET /api/auth/profil`.

#### ZONE TECHNIQUE CONCERNÉE
* **Fichiers** :
  - `backend/routes/auth.js` (lignes 524-534)
  - `audit/02_PLAN_TESTS/PLAN_TESTS.md` (lignes 39-44)
* **Modules** : `MOD-01`
* **Composants** : Routeur d'authentification Express
* **API** : `GET /api/auth/profil` & `GET /api/auth/moi`
* **Services** : Middleware `verifierToken`
* **Base de données** : Table `utilisateurs`
* **Configuration** : Aucune

#### MODIFICATION TECHNIQUE À EFFECTUER

##### Étape 1 — Préparation
- Inspecter `backend/routes/auth.js:525-534` pour extraire la fonction de consultation du profil.

##### Étape 2 — Correction principale (Backend Express)
- Dans `backend/routes/auth.js`, factoriser le handler de profil ou déclarer le multi-routing :
  ```javascript
  // GET /api/auth/profil & alias GET /api/auth/moi — obtenir les informations du profil utilisateur
  const getProfilHandler = async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, nom, email, telephone, email_verifie, created_at FROM utilisateurs WHERE id=$1',
        [req.user.userId]
      );
      if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
      res.json({ user: rows[0] });
    } catch (err) { res.status(500).json({ error: erreurPublique(err, req) }); }
  };

  router.get('/profil', verifierToken, getProfilHandler);
  router.get('/moi', verifierToken, getProfilHandler);
  ```

##### Étape 3 — Correction Spécification d'Audit
- Dans `audit/02_PLAN_TESTS/PLAN_TESTS.md:40-42`, mentionner `/api/auth/profil` (avec mention de l'alias `/api/auth/moi`).

##### Étape 4 — Cas limites
- Token révoqué (`jwt_version` incrémenté lors d'une déconnexion) : Le middleware `verifierToken` doit bloquer avec HTTP 401 sur `/profil` COMME sur `/moi`.

##### Étape 5 — Compatibilité
- Aucun impact sur les clients existants (le frontend web continue d'appeler `/profil`).

#### COMPORTEMENT ACTUEL
`GET /api/auth/moi` renvoie HTTP 404.

#### COMPORTEMENT ATTENDU
`GET /api/auth/moi` renvoie exactement le même résultat sécurisé que `GET /api/auth/profil`.

#### CONTRAINTES À PRÉSERVER
- Protection stricte par `verifierToken` (rejet immédiat si token révoqué).
- Projection SQL limitée (`id, nom, email, telephone, email_verifie, created_at`) sans exposer `mot_de_passe_hash`.

#### DÉPENDANCES
- Middleware `verifierToken`.

#### RISQUES DE RÉGRESSION
- Risque nul.

#### TESTS DE VALIDATION & RÉGRESSION
* **Validation** : `TEST-002-R` (Test conjoint sur `/profil` et `/moi`).
* **Régression** : **GRAPPE C** (`TEST-001`, `TEST-003`, `TEST-004`).

#### CRITÈRES D'ACCEPTATION
1. `GET /api/auth/moi` avec token valide renvoie HTTP 200 + profil.
2. Après déconnexion, `GET /api/auth/moi` renvoie HTTP 401.

#### CONDITION DE CLÔTURE
Les deux URLs `/profil` et `/moi` valident le cycle complet d'invalidation de token.

---

### FIX-003 : Journalisation Obligatoire des Violations IDOR sur les Modules Marchands

* **FIX-ID** : `FIX-003`
* **ANOMALIE-ID** : `ANOM-003`
* **TEST-ID** : `TEST-005`
* **CAUSE-ID** : `CAUSE-003`
* **STATUT DE LA CAUSE** : `CAUSE PARTIELLEMENT CONFIRMÉE` (Périmètre étendu à l'ensemble de `boutiques-modules/`)
* **PRIORITÉ** : `P1`
* **GRAVITÉ** : `Majeure (Sécurité / Auditabilité)`
* **IMPACT** : Déficit de détection et d'auditabilité des attaques multi-tenants : un attaquant qui tente d'ajouter, modifier ou supprimer des produits ou données marchandes sur une boutique tierce reçoit bien un rejet HTTP 403, mais l'incident n'est pas consigné dans le coffre-fort d'audit `security_audit_vault`.

#### PROBLÈME DÉMONTRÉ & PREUVE
* **Preuve** : `/audit/04_RESULTATS/PREUVES/TEST-005_preuve-01.json` montrant 0 log d'audit inséré lors du rejet 403 sur `POST /api/boutiques/:id/produits`.
* **Cause validée** : L'implémentation de la garde dans `backend/routes/boutiques-modules/boutiques-produits.js:128-129` fait `const own = await checkBoutiqueAccess(id, req.user.userId); if (!own) return res.status(403).json({ error: 'Accès refusé' });` sans appeler la fonction de journalisation `logSecurityViolation()`. L'Agent 4 a démontré que ce défaut est généralisé sur les mutations privées de `boutiques-modules/`.

#### OBJECTIF DE LA CORRECTION
Garantir que toute tentative d'accès non autorisé à une boutique déclenche un enregistrement immédiat dans `security_audit_vault` avec les détails de l'incident (userId, targetId, ip, endpoint, méthode), tout en retournant un statut HTTP 403 propre.

#### ZONE TECHNIQUE CONCERNÉE
* **Fichiers** :
  - `backend/routes/boutiques-modules/boutiques-produits.js` (lignes 127-130, 260, 389, 413)
  - `backend/middlewares/tenantSecurity.js` (définition de `logSecurityViolation` et `requireBoutiqueOwnership`)
* **Modules** : `MOD-03` (Gestion Catalogue & Inventaire Marchand) & `MOD-01` (Sécurité Multi-Tenant)
* **Composants** : Contrôleurs REST d'administration boutique
* **API** : `POST /api/boutiques/:id/produits`, `PUT /api/boutiques/:id/produits/:prodId`, `DELETE /:id/produits/:prodId`
* **Services** : `logSecurityViolation`
* **Base de données** : Table `security_audit_vault`
* **Configuration** : Aucune

#### MODIFICATION TECHNIQUE À EFFECTUER

##### Étape 1 — Préparation
- Vérifier l'importation de `logSecurityViolation` dans `boutiques-produits.js`.
  Si absent, ajouter au sommet du fichier :
  ```javascript
  const { checkBoutiqueAccess, logSecurityViolation } = require('../../middlewares/tenantSecurity');
  ```

##### Étape 2 — Correction principale (Routes de Mutations Produits)
Dans `backend/routes/boutiques-modules/boutiques-produits.js`, sur chaque garde de contrôle d'accès boutique :
1. Sur `POST /:id/produits` (lignes 128-130) :
   ```javascript
   const own = await checkBoutiqueAccess(id, req.user.userId);
   if (!own) {
     logSecurityViolation({
       eventType: 'IDOR_BOUTIQUE_ACCESS_DENIED',
       userId: req.user.userId,
       tenantType: 'boutique',
       targetId: id,
       req,
       details: { action: 'creer_produit', reason: 'Accès boutique non autorisé' }
     });
     return res.status(403).json({ error: 'Accès refusé' });
   }
   ```
2. Sur `PUT /:id/produits/:prodId` (ligne 260) :
   Intégrer le même appel `logSecurityViolation` avec `{ action: 'modifier_produit', targetId: id }`.
3. Sur `DELETE /:id/produits/:prodId` (ligne 389) :
   Intégrer le même appel `logSecurityViolation` avec `{ action: 'supprimer_produit', targetId: id }`.
4. Sur `POST /:id/produits/:prodId/dupliquer` (ligne 413) :
   Intégrer le même appel `logSecurityViolation` avec `{ action: 'dupliquer_produit', targetId: id }`.

##### Étape 3 — Extension progressive aux autres modules critiques
Pour les routes sensibles de gestion de stock et caisse (`boutiques-pos.js`, `entrepots.js`, `credits.js`), vérifier que les rejets non autorisés consignent systématiquement l'événement.

##### Étape 4 — Cas limites & Préservation du Multi-Tenant Collaboratif
- **Employés & Gérants autorisés** : La fonction `checkBoutiqueAccess` vérifie `(b.utilisateur_id = $2 OR bu.utilisateur_id = $2)`. Un collaborateur légitime ne doit JAMAIS être consigné comme attaquant et ne doit pas recevoir de 403.
- **Résilience en cas d'échec SQL de journalisation** : `logSecurityViolation` est enveloppée d'un `try/catch` interne et ne fait jamais crasher la réponse HTTP.

##### Étape 5 — Compatibilité
- Les codes d'erreur HTTP 403 et les messages retournés aux clients restent inchangés (`{ error: 'Accès refusé' }`).

#### COMPORTEMENT ACTUEL
Le client reçoit HTTP 403 mais la table `security_audit_vault` reste vide pour cette action.

#### COMPORTEMENT ATTENDU
Le client reçoit HTTP 403 ET une trace probante est insérée dans `security_audit_vault`.

#### CONTRAINTES À PRÉSERVER
- Ne pas bloquer les collaborateurs légitimes inscrits dans `boutique_utilisateurs`.
- Performance : la journalisation s'exécute de manière non-bloquante ou rapide en base.

#### DÉPENDANCES
- Table `security_audit_vault`.
- `backend/middlewares/tenantSecurity.js`.

#### RISQUES DE RÉGRESSION
- Risque de faux positifs si un utilisateur valide était mal résolu (écarté car `checkBoutiqueAccess` est déjà éprouvé).

#### TESTS DE VALIDATION & RÉGRESSION
* **Validation** : `TEST-005-R`
* **Régression** : **GRAPPE C & B** (`TEST-001`, `TEST-008`, `TEST-010`).

#### CRITÈRES D'ACCEPTATION
1. `POST /api/boutiques/:autreId/produits` renvoie HTTP 403.
2. `SELECT * FROM security_audit_vault WHERE event_type = 'IDOR_BOUTIQUE_ACCESS_DENIED' AND target_id = $1` retourne au moins 1 enregistrement complet.

#### CONDITION DE CLÔTURE
Le test `TEST-005` passe avec détection et journalisation effective de l'IDOR.

---

### FIX-004 : Résilience Double Wave (Suppression du 502 Destructeur & Interface Repli Panier)

* **FIX-ID** : `FIX-004`
* **ANOMALIE-ID** : `ANOM-004`
* **TEST-ID** : `TEST-009`
* **CAUSE-ID** : `CAUSE-004`
* **STATUT DE LA CAUSE** : `CAUSE PARTIELLEMENT CONFIRMÉE` (Régression avérée + Cause Multiple Backend & Frontend)
* **PRIORITÉ** : `P1`
* **GRAVITÉ** : `Critique (Financière & Conversion E-commerce)`
* **IMPACT** : 
  1. En cas de dysfonctionnement passager de l'API Wave ou des clés API, le serveur détruit la commande du client (`annulerCommandeNonPayee`), remet le stock en rayon et renvoie une erreur violente HTTP 502 Bad Gateway.
  2. Le commerçant perd la vente et ne peut pas relancer le client sur WhatsApp.
  3. Violation directe de la directive maîtresse de résilience `CLAUDE.md:58`.

#### PROBLÈME DÉMONTRÉ & PREUVE
* **Preuve** : `/audit/04_RESULTATS/PREUVES/TEST-009_preuve-01.json` montrant l'erreur 502 Bad Gateway Wave et l'annulation de la commande.
* **Historique Git** : Commit `7ce40c00` (`AUD-083`) ayant introduit l'annulation destructive pour contourner le fait que la modale panier `DrawerCartSuccessModal.tsx` ne savait pas afficher les consignes de transfert Wave manuel.

#### OBJECTIF DE LA CORRECTION (CORRECTIF DOUBLE INDISSOCIABLE)
1. **Volet Backend** : Aligner le contrôleur Wave sur le modèle éprouvé d'Orange Money dans `backend/routes/comptabilite.js` : conserver la commande avec le statut `'en_attente'`, maintenir la réservation du stock, et renvoyer HTTP 201 avec `fallback_manuel: true`, `numero_depot: '777202086'`, et les instructions de paiement.
2. **Volet Frontend** : Adapter le hook de commande `useDrawerCartCheckout.ts` et la modale de succès `DrawerCartSuccessModal.tsx` pour intercepter `fallback_manuel` et afficher de manière ergonomique, rassurante et professionnelle le numéro de dépôt Wave et les instructions de transfert, **sans aucun emoji Unicode** (respect absolu de la règle anti-slop).

#### ZONE TECHNIQUE CONCERNÉE
* **Fichiers** :
  - Backend : `backend/routes/comptabilite.js` (lignes 982-990)
  - Frontend Hook : `frontend-next/src/components/cart/useDrawerCartCheckout.ts` (lignes 326-365)
  - Frontend Types : `frontend-next/src/components/cart/types.ts` (lignes 7-25)
  - Frontend Modale : `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx` (lignes 120-250)
* **Modules** : `MOD-04` (Commandes & Tunnels de Vente) & `MOD-02` (Paiements Mobiles & Passerelles)
* **Composants** : `DrawerCartSuccessModal.tsx` & `useDrawerCartCheckout.ts`
* **API** : `POST /api/comptabilite/:id/commandes`
* **Services** : `backend/services/commande-service.js`
* **Base de données** : Table `commandes` (colonne `statut` = `'en_attente'`)
* **Configuration** : Numéro de repli Wave (`777202086` ou paramètre boutique)

#### MODIFICATION TECHNIQUE À EFFECTUER

##### Étape 1 — Préparation
- Vérifier que la table `commandes` supporte bien le statut `'en_attente'`.
- Noter les icônes de `lucide-react` déjà disponibles dans `DrawerCartSuccessModal.tsx` (`CheckCircle`, `CreditCard`, `MessageCircle`, `AlertCircle`, `Phone`, `Info`).

##### Étape 2 — Correction Backend (`backend/routes/comptabilite.js`)
Aux lignes 982-989, remplacer le bloc destructeur :
```javascript
// REMPLACER :
} catch (waveErr) {
  const waveMsg = waveErr.response?.data?.message || waveErr.response?.data?.code || waveErr.message;
  console.error('[COMMANDE WAVE INIT ERR]:', waveMsg);
  try { await require('../services/commande-service').annulerCommandeNonPayee(commande.reference, 'initialisation Wave impossible'); } catch (e) { console.error('[COMMANDE COMPENSATION ERR]:', e.message); }
  return res.status(502).json({ error: 'Le paiement Wave n’a pas pu être initialisé. Votre commande n’a pas été enregistrée, réessayez ou choisissez un autre mode de paiement.' });
}

// PAR LE MODE DE REPLI GRACIEUX STANDARD :
} catch (waveErr) {
  const waveMsg = waveErr.response?.data?.message || waveErr.response?.data?.code || waveErr.message;
  console.warn('[COMMANDE WAVE INIT FALLBACK]: API Wave indisponible, bascule en paiement manuel.', waveMsg);
  // La commande reste en attente avec stock alloué, conforme à CLAUDE.md:58
  return res.status(201).json({
    commande,
    fallback_manuel: true,
    numero_depot: '777202086',
    operateur: 'wave',
    message: 'Commande enregistrée. L\'API Wave étant momentanément indisponible, effectuez votre paiement par transfert Wave au 77 720 20 86.'
  });
}
```

##### Étape 3 — Correction Frontend Types (`frontend-next/src/components/cart/types.ts`)
Enrichir l'interface `OrderSuccessData` :
```typescript
export interface OrderSuccessData {
  boutiqueNom: string
  boutiqueId: string
  whatsapp?: string | null
  modeLivraison?: 'retrait' | 'a_convenir' | 'livraison'
  reference: string
  total: number
  sousTotal: number
  fraisLivraison: number
  reduction: number
  codePromo?: string
  methodePaiement: string
  clientNom: string
  clientTel: string
  clientAdresse?: string
  items: Array<{ nom: string; quantite: number; prix: number; detailsVariante?: string | null }>
  // NOUVEAUX CHAMPS REPLI MANUEL
  fallbackManuel?: boolean
  numeroDepot?: string
  operateurManuel?: string
}
```

##### Étape 4 — Correction Frontend Hook (`frontend-next/src/components/cart/useDrawerCartCheckout.ts`)
Dans `setOrderSuccessData` (lignes 341-364), propager les drapeaux de repli :
```typescript
fallbackManuel: Boolean(data.fallback_manuel),
numeroDepot: data.numero_depot || '777202086',
operateurManuel: data.operateur || (currentMethode.includes('wave') ? 'Wave' : 'Orange Money'),
```

##### Étape 5 — Correction Frontend Modale (`frontend-next/src/components/cart/DrawerCartSuccessModal.tsx`)
1. Dans le corps du composant, détecter le mode repli :
   ```typescript
   const isFallback = Boolean(orderSuccessData.fallbackManuel)
   const numDepot = orderSuccessData.numeroDepot || '77 720 20 86'
   const operateur = orderSuccessData.operateurManuel || 'Wave / OM'
   ```
2. Lorsque `isFallback` est vrai, insérer un bloc d'instructions de paiement d'une clarté exemplaire sous le récapitulatif du total (lignes 225-248), avec les tokens CSS du Design System Nopalou (`var(--navy)`, `var(--accent)`, `var(--bg)`), et **exclusivement des icônes SVG Lucide** :
   ```tsx
   {isFallback && (
     <div
       style={{
         marginTop: 12,
         padding: '14px 16px',
         background: '#fffbeb',
         border: '1px solid #fef3c7',
         borderRadius: 14,
         textAlign: 'left',
         display: 'flex',
         flexDirection: 'column',
         gap: 8,
       }}
     >
       <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent, #C75B00)', fontWeight: 800, fontSize: 14 }}>
         <AlertCircle size={18} style={{ flexShrink: 0 }} />
         <span>Paiement manuel requis ({operateur})</span>
       </div>
       <p style={{ margin: 0, fontSize: 13, color: '#451a03', lineHeight: 1.5 }}>
         La passerelle automatique est temporairement indisponible. Votre commande est bien réservée. Veuillez effectuer votre transfert vers le numéro :
       </p>
       <div
         style={{
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'space-between',
           background: '#ffffff',
           border: '1.5px dashed var(--accent, #C75B00)',
           borderRadius: 10,
           padding: '8px 12px',
         }}
       >
         <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)', letterSpacing: '0.5px' }}>
           {numDepot}
         </span>
         <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent, #C75B00)', background: '#fff7ed', padding: '2px 8px', borderRadius: 6 }}>
           {operateur}
         </span>
       </div>
       <div style={{ fontSize: 12, color: '#78350f', display: 'flex', alignItems: 'center', gap: 6 }}>
         <Info size={14} style={{ flexShrink: 0 }} />
         <span>Précisez la référence <strong>{orderSuccessData.reference}</strong> en motif de transfert.</span>
       </div>
     </div>
   )}
   ```
3. Mettre à jour le bouton d'action principal et WhatsApp pour que le message WhatsApp pré-rempli intègre la mention : `Paiement en cours via transfert manuel ${operateur} au ${numDepot} pour la référence ${orderSuccessData.reference}`.

##### Étape 6 — Cas limites
- **Passerelle Wave active en production** : Si Wave renvoie `wave_url`, le comportement nominal de redirection immédiate s'applique sans aucun changement.
- **Idempotence & Stock** : Le stock ayant été décrémenté au moment de la création de commande, il reste alloué au client pendant la période d'attente du règlement.
- **Purge après délai** : Si le client ne paye jamais, le cron de gestion des commandes impayées annulera la commande et restituera le stock selon la règle métier normale (24h/48h).

#### COMPORTEMENT ACTUEL
Le client subit un crash HTTP 502, la commande est détruite et le stock remis en vente.

#### COMPORTEMENT ATTENDU
Le client reçoit HTTP 201, la commande est enregistrée avec statut `'en_attente'`, et la modale panier affiche les instructions et le numéro de dépôt Wave.

#### CONTRAINTES À PRÉSERVER
- Zéro emoji Unicode dans la modale (Règle d'or Anti-Slop).
- Respect des tokens de couleurs Nopalou.
- Préservation de la redirection Wave nominale lorsque `wave_url` est présent.

#### DÉPENDANCES
- `backend/routes/comptabilite.js`
- `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx`

#### RISQUES DE RÉGRESSION
- Risque de double commande ou d'incohérence de panier : prévenu car `clearCart(currentBoutiqueId)` est bien exécuté lors du succès.

#### TESTS DE VALIDATION & RÉGRESSION
* **Validation** : `TEST-009-R`
* **Régression** : **GRAPPE A** (`TEST-007`, `TEST-008`, `TEST-013`).

#### CRITÈRES D'ACCEPTATION
1. `POST /api/comptabilite/:id/commandes` avec Wave défaillant renvoie HTTP 201 avec `fallback_manuel: true`.
2. La commande en base a `statut = 'en_attente'`.
3. Le composant `DrawerCartSuccessModal` affiche le bloc jaune avec le numéro `777202086` et la référence.

#### CONDITION DE CLÔTURE
Le tunnel de commande Wave ne produit plus jamais de 502 lors d'une indisponibilité passerelle et guide le client vers le transfert manuel.

---

### FIX-005 : Alignement de la Spécification d'Audit sur la Nomenclature Réelle POS

* **FIX-ID** : `FIX-005`
* **ANOMALIE-ID** : `ANOM-005`
* **TEST-ID** : `TEST-010`
* **CAUSE-ID** : `CAUSE-005`
* **STATUT DE LA CAUSE** : `CAUSE CONFIRMÉE` (Divergence de spécification d'audit)
* **PRIORITÉ** : `P3`
* **GRAVITÉ** : `Mineure`
* **IMPACT** : Faux échec de test d'audit HTTP 404 sur les endpoints de caisse enregistreuse alors que l'ensemble du système de point de vente (backend, frontend, synchronisation hors-ligne IndexedDB) fonctionne parfaitement sur la convention unifiée `/pos-sessions/...`.

#### PROBLÈME DÉMONTRÉ & PREUVE
* **Preuve** : `/audit/04_RESULTATS/PREUVES/TEST-010_preuve-01.json` montrant 404 sur `/pos/sessions/...` et succès parfait (201/200/200 avec calcul d'écart 0.00 FCFA) sur `/pos-sessions/...`.
* **Cause validée** : L'Agent 1 a postulé une route théorique `/api/boutiques/:id/pos/sessions/ouvrir` qui n'a jamais existé.

#### OBJECTIF DE LA CORRECTION
Mettre à jour la spécification `audit/02_PLAN_TESTS/PLAN_TESTS.md` (lignes 212-214) avec les routes de production réelles :
1. `POST /api/boutiques/:id/pos-sessions/ouvrir`
2. `POST /api/boutiques/:id/pos-sessions/:sessionId/mouvements`
3. `POST /api/boutiques/:id/pos-sessions/cloturer`

#### ZONE TECHNIQUE CONCERNÉE
* **Fichiers** :
  - `audit/02_PLAN_TESTS/PLAN_TESTS.md` (lignes 212-214)
* **Modules** : `MOD-06` (Point de Vente Caisse POS & Matériel)
* **Composants** : Caisse enregistreuse
* **API** : Routes `/pos-sessions/...`
* **Services** : `backend/routes/boutiques-modules/boutiques-pos.js`
* **Base de données** : Table `boutique_pos_sessions`
* **Configuration** : Aucune

#### MODIFICATION TECHNIQUE À EFFECTUER

##### Étape 1 — Correction Spécification d'Audit (`audit/02_PLAN_TESTS/PLAN_TESTS.md`)
Remplacer les étapes 1, 2, 3 du cas `TEST-010` :
```text
ÉTAPES RÉVISÉES :
1. POST /api/boutiques/:id/pos-sessions/ouvrir avec { "fond_caisse": 25000 } -> HTTP 201.
2. POST /api/boutiques/:id/pos-sessions/:sessionId/mouvements avec { "type": "retrait", "montant": 5000, "motif": "Achat monnaie" } -> HTTP 200.
3. POST /api/boutiques/:id/pos-sessions/cloturer avec { "session_id": sessionId, "montant_cloture_reel": 20000 } -> HTTP 200.
```

##### Étape 2 — Validation de non-altération du code
- **Ne pas renommer les routes dans `boutiques-pos.js`** : le synchroniseur IndexedDB (`frontend-next/src/lib/sync-manager.ts`) et les composants React de caisse sont câblés dessus. Toute modification de route risquerait de casser la synchronisation hors-ligne des commerçants.

#### COMPORTEMENT ACTUEL
Le test d'audit teste des routes inexistantes et échoue en 404 strict.

#### COMPORTEMENT ATTENDU
Le test d'audit teste les routes unifiées réelles et valide le cycle de caisse avec succès (PASS).

#### CONTRAINTES À PRÉSERVER
- Préserver l'intégralité du module POS et des structures de données IndexedDB.

#### DÉPENDANCES
- `boutiques-pos.js`

#### RISQUES DE RÉGRESSION
- Risque nul.

#### TESTS DE VALIDATION & RÉGRESSION
* **Validation** : `TEST-010-R`
* **Régression** : **GRAPPE B** (`TEST-011`, `TEST-012`).

#### CRITÈRES D'ACCEPTATION
1. Le cycle de caisse s'exécute avec les routes réelles.
2. L'écart de caisse final calculé est strictement égal à `0.00 FCFA`.

#### CONDITION DE CLÔTURE
Le test `TEST-010` passe avec statut `PASS`.

---

### FIX-006 : Correction Multi-Tenant du Bail Locatif & Réétalonnage du Seuil PDF

* **FIX-ID** : `FIX-006`
* **ANOMALIE-ID** : `ANOM-006`
* **TEST-ID** : `TEST-014`
* **CAUSE-ID** : `CAUSE-006`
* **STATUT DE LA CAUSE** : `CAUSE CONFIRMÉE` (Faux positif de taille & Omission slug agence)
* **PRIORITÉ** : `P3`
* **GRAVITÉ** : `Faible (Spécification de test)`
* **IMPACT** : 
  1. Omission du segment `:slugOrId` de l'agence dans l'URL de test du bail, provoquant un 404 (alors que le multi-tenant exige l'isolation par agence).
  2. Définition d'un critère de taille arbitraire (> 5 Ko) pour une quittance PDF compacte et optimisée (3 161 octets) générée avec des polices vectorielles système conformes au COCC du Sénégal, incitant à tort à télécharger des polices externes CDN en violation des règles d'or Nopalou.

#### PROBLÈME DÉMONTRÉ & PREUVE
* **Preuve** : `/audit/04_RESULTATS/PREUVES/TEST-014_preuve-01.json` montrant que le bail, le paiement et la quittance PDF sont générés avec une perfection légale et graphique totale (taille 3 161 octets).
* **Cause validée** : Mauvais calibrage du test par l'Agent 1.

#### OBJECTIF DE LA CORRECTION
1. Mettre à jour `audit/02_PLAN_TESTS/PLAN_TESTS.md:308` pour cibler l'URL multi-tenant effective : `POST /api/locatif-immo/agence/:slugOrId/baux`.
2. Mettre à jour `audit/02_PLAN_TESTS/PLAN_TESTS.md:311` pour fixer le seuil minimal de quittance PDF valide à `> 2 500 octets` (couvrant la plage 2,8 Ko à 4 Ko).
3. Sanctuariser l'interdiction d'ajouter des polices externes pour ce PDF.

#### ZONE TECHNIQUE CONCERNÉE
* **Fichiers** :
  - `audit/02_PLAN_TESTS/PLAN_TESTS.md` (lignes 308, 311)
* **Modules** : `MOD-11` (ERP Gestion Locative & Baux Immobiliers)
* **Composants** : Moteur de quittances PDF (`genererPdfQuittanceStream`)
* **API** : `POST /api/locatif-immo/agence/:slugOrId/baux` & `GET /api/locatif-immo/quittance/:id/pdf`
* **Services** : `backend/routes/locatif-immo.js`
* **Base de données** : Tables `locatif_baux`, `locatif_echeances`
* **Configuration** : Aucune

#### MODIFICATION TECHNIQUE À EFFECTUER

##### Étape 1 — Correction Spécification d'Audit (`audit/02_PLAN_TESTS/PLAN_TESTS.md`)
1. Ligne 308 :
   ```text
   1. POST /api/locatif-immo/agence/:slugOrId/baux -> Création du bail actif sous le tenant agence.
   ```
2. Ligne 311 :
   ```text
   RÉSULTAT ATTENDU : Échéance marquée statut = 'paye', flux binaire PDF retourné avec Content-Type: application/pdf et taille > 2 500 octets (PDF vectoriel compact sans polices CDN externes).
   ```

##### Étape 2 — Validation de non-altération du générateur PDF
- Ne modifier AUCUNE ligne de `backend/routes/locatif-immo.js:1145-1240`. Le générateur utilise les polices standard ISO 32000 (`Helvetica`) et respecte scrupuleusement le COCC sénégalais.

#### COMPORTEMENT ACTUEL
Le test d'audit rejette la quittance sous prétexte que 3 161 octets < 5 000 octets.

#### COMPORTEMENT ATTENDU
Le test d'audit valide la quittance avec un seuil calibré sur la réalité technique du moteur vectoriel.

#### CONTRAINTES À PRÉSERVER
- Bannissement absolu de tout fetch externe de polices (Google Fonts / CDN).
- Respect du visa COCC et du timbre de quittance légal (100 FCFA).

#### DÉPENDANCES
- `backend/routes/locatif-immo.js`

#### RISQUES DE RÉGRESSION
- Risque nul.

#### TESTS DE VALIDATION & RÉGRESSION
* **Validation** : `TEST-014-R`
* **Régression** : **GRAPPE E & F** (`TEST-006`, `TEST-016`).

#### CRITÈRES D'ACCEPTATION
1. `GET /api/locatif-immo/quittance/:id/pdf` renvoie `application/pdf`.
2. Taille binaire > 2 500 octets.
3. Marqueur de fin de fichier PDF `%%EOF` présent.

#### CONDITION DE CLÔTURE
Le test `TEST-014` passe avec statut `PASS`.

---

## 4. Ordre d'Exécution & Dépendances Techniques

Pour éviter toute interférence entre les couches applicatives et maximiser l'efficacité de l'Agent 6, les 6 correctifs doivent être déployés selon l'ordonnancement séquentiel et par lots suivant :

```text
                                  SÉQUENCE D'EXÉCUTION AGENT 6
                                                │
         ┌──────────────────────────────────────┴──────────────────────────────────────┐
         ▼                                                                             ▼
       LOT 1 : CONTRATS DE TEST & ALIAS                                LOT 2 : AUTHENTIFICATION & COMPTES
       (Risque nul, calage de l'audit)                                  (Backend Express + Server Action)
         │                                                                             │
   ┌─────┴─────┐                                                                       ▼
   ▼           ▼                                                                    FIX-001
FIX-005     FIX-006                                                      (telephone inscription)
(URL POS)   (URL Bail & Seuil PDF)                                                     │
   │           │                                                                       ▼
   └─────┬─────┘                                                                    FIX-002
         │                                                               (alias /moi + /profil)
         └──────────────────────────────────────┬──────────────────────────────────────┘
                                                ▼
                                   LOT 3 : SÉCURITÉ MULTI-TENANT
                                 (Journalisation IDOR Centralisée)
                                                │
                                                ▼
                                             FIX-003
                              (logSecurityViolation sur boutiques-produits)
                                                │
                                                ▼
                                 LOT 4 : DOUBLE RÉSOLUTION WAVE
                                    (Backend 201 + UI Panier)
                                                │
                                                ▼
                                             FIX-004
                         ┌──────────────────────┴──────────────────────┐
                         ▼                                             ▼
                 Volet 1 : Backend                             Volet 2 : Frontend
            (comptabilite.js : 201 fallback)             (types.ts, checkout.ts, modal.tsx)
```

### Règles de Parallélisme :
* `FIX-005` et `FIX-006` sont **entièrement parallélisables** (mises à jour de documentation de test).
* `FIX-001` et `FIX-002` peuvent être exécutés consécutivement dans `backend/routes/auth.js`.
* `FIX-003` doit être appliqué indépendamment dans `boutiques-produits.js`.
* `FIX-004` **DOIT IMPÉRATIVEMENT** être appliqué de manière synchronisée (Volet Backend + Volet Frontend) avant de rejouer le test de validation `TEST-009-R`.

---

## 5. Analyse Globale des Risques & Stratégie de Non-Régression

| RISQUE IDENTIFIÉ | IMPACT POTENTIEL | MESURE DE PROTECTION FORMALISÉE |
| :--- | :--- | :--- |
| **Résurgence de la commande fantôme Wave** | Commandes non payées annulées silencieusement 2h plus tard (`AUD-083`). | **Interdiction formelle** de livrer le backend HTTP 201 sans le composant frontend `DrawerCartSuccessModal.tsx` affichant le numéro de dépôt `777202086`. |
| **Bannissement de collaborateurs légitimes** | Rejet 403 d'un gérant délégué en caisse ou boutique. | `checkBoutiqueAccess` vérifie déjà la jointure `boutique_utilisateurs`. Ne modifier que l'émission du log `logSecurityViolation` dans les cas où l'accès est déjà refusé. |
| **Rejet d'inscriptions valides sans téléphone** | Perte d'acquisitions utilisateurs. | Déclarer `telephone` en `.optional({ nullable: true, checkFalsy: true })` pour que l'inscription reste possible sans téléphone. |
| **Dégradation de performance par police externe** | Ralentissement du build Next.js ou blocage SSR. | **Interdiction formelle** d'injecter des polices Google Fonts dans le PDF locatif (`FIX-006`). Réétalonnage exclusif de la borne de test à `> 2 500 octets`. |
| **Régression de caisse offline** | Rupture du cache IndexedDB des commerçants. | Maintien absolu de la nomenclature `/pos-sessions/...` dans le code source (`FIX-005`). |

---

## 6. Corrections Bloquées & Critères d'Exclusion

Aucune anomalie n'est classée `BLOQUÉ — CAUSE INSUFFISAMMENT DÉMONTRÉE` car les 6 causes ont été matériellement prouvées lors de la contre-expertise.

En revanche, **deux directives de blocage conditionnel** sont imposées à l'Agent 6 :

1. **`BLOCAGE-001` (Interdiction du Patch Backend Isolé sur Wave)** :
   - L'Agent 6 a l'interdiction de marquer `FIX-004` comme terminé s'il n'a modifié que `backend/routes/comptabilite.js`.
   - La condition de clôture exige la présence effective du bloc d'instructions de transfert dans `frontend-next/src/components/cart/DrawerCartSuccessModal.tsx`.
2. **`BLOCAGE-002` (Interdiction des Polices Externes sur la Quittance)** :
   - L'Agent 6 a l'interdiction formelle de modifier `backend/routes/locatif-immo.js` pour importer des polices TTF/WOFF distantes depuis un CDN.
   - Le correctif de `FIX-006` s'applique exclusivement au fichier `audit/02_PLAN_TESTS/PLAN_TESTS.md`.
