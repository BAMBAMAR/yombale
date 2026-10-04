# Matrice FIX → TEST — Nopalou

Ce document établit la traçabilité bidirectionnelle stricte entre chaque action de correction (`FIX-*`), son anomalie et son test d'origine, sa cause validée, son test de validation dédié et sa suite de tests de non-régression obligatoire.

---

## 1. Tableau de Correspondance FIX ↔ TEST

| FIX ID | ANOMALIE ID | TEST ORIGINE | CAUSE ID | OBJET DE LA CORRECTION | TEST DE VALIDATION | TESTS DE RÉGRESSION OBLIGATOIRES (BASELINE) | CRITÈRES D'ACCEPTATION SUCCINCTS |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`FIX-001`** | `ANOM-001` | `TEST-001` | `CAUSE-001` | Extraction, normalisation (`normalisePhone`) et insertion SQL de `telephone` dans `POST /api/auth/inscription` et extraction dans `signup` (Server Action). | `TEST-001-R` | **GRAPPE C** : `TEST-002`, `TEST-003`, `TEST-004` | La colonne `telephone` de `utilisateurs` est persistée en base (non NULL) et retournée dans le JSON utilisateur au format E.164. |
| **`FIX-002`** | `ANOM-002` | `TEST-002` | `CAUSE-002` | Alignement du contrat de test sur `GET /api/auth/profil` et ajout d'un alias rétro-compatible `GET /api/auth/moi` vers le handler de profil. | `TEST-002-R` | **GRAPPE C** : `TEST-001`, `TEST-003`, `TEST-004` | `GET /api/auth/profil` et l'alias `/api/auth/moi` renvoient HTTP 200 avant déconnexion et HTTP 401 après déconnexion (`jwt_version` incrémenté). |
| **`FIX-003`** | `ANOM-003` | `TEST-005` | `CAUSE-003` | Intégration systématique de la journalisation d'audit `logSecurityViolation()` lors des rejets 403 sur les routes marchandes privées (`boutiques-produits.js`). | `TEST-005-R` | **GRAPPE C & B** : `TEST-001`, `TEST-008`, `TEST-010` | Toute tentative d'accès non autorisé par un attaquant insère une ligne `IDOR_BOUTIQUE_ACCESS_DENIED` dans `security_audit_vault` tout en maintenant le 403. |
| **`FIX-004`** | `ANOM-004` | `TEST-009` | `CAUSE-004` | Correctif double indissociable : (1) Backend : remplacement du 502 destructeur par HTTP 201 + `fallback_manuel: true` ; (2) Frontend : affichage du numéro de dépôt Wave et des instructions dans `DrawerCartSuccessModal.tsx`. | `TEST-009-R` | **GRAPPE A** : `TEST-007`, `TEST-008`, `TEST-013` | En cas de défaillance API Wave, la commande est conservée `en_attente`, le stock est préservé, et le client voit le numéro de dépôt et les instructions Wave dans la modale panier. |
| **`FIX-005`** | `ANOM-005` | `TEST-010` | `CAUSE-005` | Alignement de la spécification d'audit `PLAN_TESTS.md` sur la nomenclature réelle `/api/boutiques/:id/pos-sessions/...` et documentation de la convention unifiée. | `TEST-010-R` | **GRAPPE B** : `TEST-011`, `TEST-012` | L'ouverture de session, le mouvement de tiroir et la clôture Z s'exécutent avec `ecart_caisse = 0.00 FCFA` sans altérer le synchroniseur IndexedDB. |
| **`FIX-006`** | `ANOM-006` | `TEST-014` | `CAUSE-006` | Alignement de la spécification d'audit bail sur `/api/locatif-immo/agence/:slugOrId/baux` et ajustement du seuil de taille de quittance PDF à `> 2 500 octets` (maintien du zéro police externe). | `TEST-014-R` | **GRAPPE E & F** : `TEST-006`, `TEST-016` | La quittance PDF vectorielle est émise avec ses mentions légales COCC complètes, sans police CDN externe, avec une taille comprise entre 2,8 Ko et 4 Ko. |

---

## 2. Définition des Scénarios de Retest (Validation)

### `TEST-001-R` : Validation Persistance Téléphone
- **Action** : Émettre `POST /api/auth/inscription` avec `nom`, `email`, `mot_de_passe`, et `telephone: "+221771234567"`.
- **Contrôle DB** : `SELECT telephone FROM utilisateurs WHERE email = $1;`.
- **Critère de Succès** : Valeur retournée égale à `+221771234567` (ou normalisée `221771234567`).

### `TEST-002-R` : Validation Route Profil et Alias Moi
- **Action** : 
  1. Login -> Récupération de `TOKEN`.
  2. `GET /api/auth/profil` avec `Authorization: Bearer TOKEN` -> Doit retourner HTTP 200 avec l'objet `user`.
  3. `GET /api/auth/moi` avec `Authorization: Bearer TOKEN` -> Doit retourner HTTP 200 avec l'objet `user`.
  4. Déconnexion via `POST /api/auth/deconnexion`.
  5. `GET /api/auth/profil` et `GET /api/auth/moi` avec l'ancien `TOKEN` -> Doit retourner strictement HTTP 401.

### `TEST-005-R` : Validation Journalisation Anti-IDOR
- **Action** : Avec le token de l'Utilisateur B (agresseur), émettre `POST /api/boutiques/:id_A/produits`.
- **Contrôle HTTP** : Réponse HTTP 403 Forbidden.
- **Contrôle DB** : `SELECT COUNT(*) FROM security_audit_vault WHERE user_id = $1 AND target_id = $2;`.
- **Critère de Succès** : Compteur >= 1 avec `event_type = 'IDOR_BOUTIQUE_ACCESS_DENIED'`.

### `TEST-009-R` : Validation Double Résilience Wave
- **Action** :
  1. Simuler l'échec de la session de paiement Wave (mauvaise clé Wave ou timeout réseau).
  2. Émettre `POST /api/comptabilite/:id/commandes` avec `methode_paiement: 'wave'`.
  3. Vérifier la réponse HTTP 201 avec `{ fallback_manuel: true, numero_depot: '777202086', ... }`.
  4. Vérifier en base : commande statut `'en_attente'`, stock décrémenté d'une seule unité.
  5. Vérifier dans le composant panier (`DrawerCartSuccessModal`) que le bloc de paiement manuel s'affiche avec le numéro de dépôt `777202086`.

### `TEST-010-R` : Validation Cycle POS Nomenclature Réelle
- **Action** : Exécuter le cycle complet d'ouverture, mouvement de caisse et clôture sur `/api/boutiques/:id/pos-sessions/ouvrir`, `/pos-sessions/:id/mouvements`, et `/pos-sessions/cloturer`.
- **Critère de Succès** : Réponses HTTP 201/200, calcul d'écart exact à 0.00 FCFA.

### `TEST-014-R` : Validation Quittance PDF Locatif Multi-Tenant
- **Action** : Exécuter `POST /api/locatif-immo/agence/:slugOrId/baux`, payer l'échéance et télécharger `GET /api/locatif-immo/quittance/:id/pdf`.
- **Critère de Succès** : Flux PDF valide retourné (Content-Type: application/pdf), taille > 2 500 octets, toutes mentions COCC présentes, 0 requête externe de polices.
