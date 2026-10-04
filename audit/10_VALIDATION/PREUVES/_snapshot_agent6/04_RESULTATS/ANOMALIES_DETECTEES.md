# ANOMALIES DÉTECTÉES — SESSION AGENT-02

```text
SESSION-ID: NOPALOU-AUDIT-AGENT-02-20261004-0135
AGENT: AGENT-02
PHASE: TEST-EXECUTOR
DATE: 2026-10-04
VERSION DU PROJET: 4c0237273fde2d058d5eabca5f94b79ceb07d37e
```

---

## REGISTRE DES ANOMALIES

### ANOM-001
- **TEST-ID** : TEST-001
- **DATE** : 2026-10-04T01:38:00Z
- **ENVIRONNEMENT** : Local isolé (Node 20, PostgreSQL 16, Port 4100)
- **ÉTAPES DE REPRODUCTION** :
  1. Émettre une requête `POST /api/auth/inscription` avec le corps JSON :
     `{ "email": "test-audit-user1@nopalou.local", "mot_de_passe": "MotDePasse123!", "nom": "Audit User 1", "telephone": "+221770000001" }`
  2. Vérifier la réponse HTTP (reçoit HTTP 201 avec le JWT).
  3. Inspecter la ligne correspondante dans la table `utilisateurs` via SQL :
     `SELECT id, email, telephone FROM utilisateurs WHERE email = 'test-audit-user1@nopalou.local';`
- **ATTENDU** :
  La colonne `telephone` de l'enregistrement en base contient la chaîne `+221770000001`.
- **OBSERVÉ** :
  La colonne `telephone` contient la valeur `NULL`.
- **PREUVE** :
  `audit/04_RESULTATS/PREUVES/TEST-001_preuve-01.json` (champ `db_record.telephone: null`).
- **IMPACT OBSERVÉ** :
  Perte silencieuse du numéro de téléphone renseigné par l'utilisateur lors de l'enregistrement de compte.
- **FRÉQUENCE** : 100% systématique sur chaque inscription.
- **STATUT DU TEST** : FAIL
- **CAUSE** : À ANALYSER PAR AGENT 3
- **HISTORIQUE** : NEW

---

### ANOM-002
- **TEST-ID** : TEST-002
- **DATE** : 2026-10-04T01:38:00Z
- **ENVIRONNEMENT** : Local isolé (Port 4100)
- **ÉTAPES DE REPRODUCTION** :
  1. Se connecter via `POST /api/auth/connexion` et récupérer le JWT.
  2. Interroger `GET /api/auth/moi` avec l'en-tête `Authorization: Bearer <token>`.
- **ATTENDU** :
  Le endpoint `GET /api/auth/moi` répond avec les informations de profil de l'utilisateur authentifié (HTTP 200).
- **OBSERVÉ** :
  Le serveur renvoie HTTP 404 `Cannot GET /api/auth/moi` car la route déclarée dans le routeur Express est `GET /api/auth/profil`.
- **PREUVE** :
  `audit/04_RESULTATS/PREUVES/TEST-002_preuve-01.json` (`strict_result.status: 404`).
- **IMPACT OBSERVÉ** :
  Incompatibilité entre la spécification du plan d'audit et le contrat d'interface réel du backend, provoquant l'échec des clients ou tests automatisés ciblant `/api/auth/moi`.
- **FRÉQUENCE** : 100% systématique.
- **STATUT DU TEST** : FAIL (Strict)
- **CAUSE** : À ANALYSER PAR AGENT 3
- **HISTORIQUE** : NEW

---

### ANOM-003
- **TEST-ID** : TEST-005
- **DATE** : 2026-10-04T01:39:00Z
- **ENVIRONNEMENT** : Local isolé (Port 4100)
- **ÉTAPES DE REPRODUCTION** :
  1. Créer une Boutique A appartenant à l'Utilisateur A.
  2. Authentifier l'Utilisateur B (tiers).
  3. Avec le jeton de l'Utilisateur B, tenter de créer un produit dans la Boutique A :
     `POST /api/boutiques/<boutiqueA_id>/produits` avec les données produit.
  4. Interroger la table `security_audit_vault` :
     `SELECT * FROM security_audit_vault WHERE user_id = '<userB_id>';`
- **ATTENDU** :
  La tentative non autorisée est rejetée avec HTTP 403 ET un événement de violation de sécurité IDOR est enregistré dans la table `security_audit_vault`.
- **OBSERVÉ** :
  La tentative est bien rejetée avec HTTP 403, mais aucun enregistrement n'est inséré dans la table `security_audit_vault` pour cette route (contrairement à `GET /api/comptabilite/:id/commandes` qui insère correctement `UNAUTHORIZED_ORDERS_ACCESS`).
- **PREUVE** :
  `audit/04_RESULTATS/PREUVES/TEST-005_preuve-01.json` (`vault_records: 1` au lieu des 2 attendus pour les deux actions testées).
- **IMPACT OBSERVÉ** :
  Défaut de traçabilité dans le journal d'audit de sécurité lors de tentatives d'injection frauduleuse de produits dans la boutique d'un tiers.
- **FRÉQUENCE** : 100% systématique sur cette route.
- **STATUT DU TEST** : FAIL
- **CAUSE** : À ANALYSER PAR AGENT 3
- **HISTORIQUE** : NEW

---

### ANOM-004
- **TEST-ID** : TEST-009
- **DATE** : 2026-10-04T01:40:00Z
- **ENVIRONNEMENT** : Local isolé sous garde réseau stricte
- **ÉTAPES DE REPRODUCTION** :
  1. Créer une commande dans une boutique.
  2. Initier une demande de paiement Wave avec clé de test/simulation :
     `POST /api/boutiques/<id>/commandes/<cmdId>/paiement` avec `{ "methode": "wave" }`.
- **ATTENDU** :
  En environnement de test ou hors ligne, le système fournit une URL de redirection de simulation ou des instructions de paiement manuel de repli (HTTP 201), préservant la commande.
- **OBSERVÉ** :
  L'API backend effectue un appel externe bloqué vers `api.wave.com`, intercepte l'erreur réseau et renvoie une réponse HTTP 502 Bad Gateway en annulant prématurément la commande en base de données.
- **PREUVE** :
  `audit/04_RESULTATS/PREUVES/TEST-009_preuve-01.json` (`wave: { status: 502, error: "Erreur Wave..." }`).
- **IMPACT OBSERVÉ** :
  Rupture brutale du parcours de commande pour le client et annulation de sa commande en cas de défaillance réseau ou indisponibilité temporaire de l'infrastructure Wave.
- **FRÉQUENCE** : 100% reproductible sans connectivité Wave active.
- **STATUT DU TEST** : FAIL
- **CAUSE** : À ANALYSER PAR AGENT 3
- **HISTORIQUE** : NEW

---

### ANOM-005
- **TEST-ID** : TEST-010
- **DATE** : 2026-10-04T01:41:00Z
- **ENVIRONNEMENT** : Local isolé (Port 4100)
- **ÉTAPES DE REPRODUCTION** :
  1. Tenter d'ouvrir une session de caisse POS via l'URL du plan :
     `POST /api/pos/sessions/ouvrir`.
  2. Tenter d'enregistrer un mouvement de tiroir-caisse via :
     `POST /api/pos/tiroir`.
  3. Tenter de clôturer la session via :
     `POST /api/pos/sessions/fermer`.
- **ATTENDU** :
  Les endpoints répondent conformément aux règles métier du module POS.
- **OBSERVÉ** :
  Les trois URLs renvoient HTTP 404. Les routes effectives implémentées dans le backend Express sont :
  - `POST /api/pos-sessions/ouvrir`
  - `POST /api/pos-sessions/:id/mouvements`
  - `POST /api/pos-sessions/cloturer`
- **PREUVE** :
  `audit/04_RESULTATS/PREUVES/TEST-010_preuve-01.json` (`strict_results: 404`).
- **IMPACT OBSERVÉ** :
  Divergence entre le plan d'audit et les endpoints réels exposés par le contrôleur POS.
- **FRÉQUENCE** : 100% systématique.
- **STATUT DU TEST** : FAIL (Strict)
- **CAUSE** : À ANALYSER PAR AGENT 3
- **HISTORIQUE** : NEW

---

### ANOM-006
- **TEST-ID** : TEST-014
- **DATE** : 2026-10-04T01:44:00Z
- **ENVIRONNEMENT** : Local isolé (Port 4100)
- **ÉTAPES DE REPRODUCTION** :
  1. Tenter d'accéder au module des baux immobiliers via l'URL sans slug :
     `POST /api/locatif-immo/baux`.
  2. Télécharger la quittance générée sur `/api/locatif-immo/public/quittance/:id.pdf` et vérifier sa taille binaire par rapport au seuil du plan (> 5 000 octets).
- **ATTENDU** :
  Création de bail sur `/locatif-immo/baux` et taille de quittance PDF supérieure à 5 000 octets.
- **OBSERVÉ** :
  La route `/locatif-immo/baux` renvoie HTTP 404 car le routeur requiert le slug d'agence (`/api/locatif-immo/agence/:slug/baux`). Le PDF généré sur la route publique mesure 3 163 octets (< 5 000 octets) car il utilise la police standard intégrée Helvetica sans embarquer de polices externes lourdes.
- **PREUVE** :
  `audit/04_RESULTATS/PREUVES/TEST-014_preuve-01.json` (`strict_result.status: 404`, `pdf_size_bytes: 3163`).
- **IMPACT OBSERVÉ** :
  Divergence de spécification de route ; seuil de taille PDF arbitrairement trop élevé dans le plan d'audit pour un document vectoriel optimisé.
- **FRÉQUENCE** : 100% systématique.
- **STATUT DU TEST** : FAIL (Strict)
- **CAUSE** : À ANALYSER PAR AGENT 3
- **HISTORIQUE** : NEW
