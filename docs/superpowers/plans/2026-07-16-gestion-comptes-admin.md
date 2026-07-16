# Section "Gestion des comptes" admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une section admin `/admin/comptes` permettant de rechercher/consulter les comptes utilisateurs, agir en support client (vérification email, reset password), suspendre un compte, et gérer une suppression RGPD réversible (période de grâce 30j + purge manuelle par anonymisation).

**Architecture:** Nouvelle route backend `backend/routes/admin-utilisateurs.js` montée sur `/api/admin/utilisateurs`, protégée par le middleware `adminSecretOnly` déjà existant. 3 nouvelles colonnes sur `utilisateurs` (`suspendu`, `supprime_le`, `anonymise_le`) posées via `migrate-inline.js`. Le login (`POST /api/auth/connexion`) refuse les comptes suspendus/en grâce. Frontend Next.js suit le pattern déjà établi par `/admin/abonnements` : page serveur avec fetch + `X-Admin-Secret`, Client Component pour les actions avec confirmation.

**Tech Stack:** Express, PostgreSQL (`pg`), Next.js 14 App Router (Server Components + Server Actions), TypeScript.

## Global Constraints

- Toutes les nouvelles routes backend sont montées sous `/api/admin/utilisateurs` et protégées par `adminSecretOnly` (header `X-Admin-Secret`), jamais par `verifierToken`.
- Migration idempotente : chaque `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` dans un bloc `try/catch` avec `console.warn` en cas d'échec, suivant le pattern existant de `migrate-inline.js`.
- Purge = anonymisation (jamais de `DELETE` physique sur `utilisateurs`).
- Aucun cron automatique de purge — déclenchement manuel uniquement depuis l'admin.
- Aucun envoi d'email automatique lors de la suspension ou de la suppression.
- Le lien de reset généré par l'admin n'est jamais envoyé automatiquement — affiché à l'écran pour copie manuelle.
- Style inline (`style={{...}}`) pour les nouveaux composants admin, cohérent avec `/admin/abonnements` (pas de classes CSS globales à créer pour cette section).
- Toutes les dates affichées côté frontend en `toLocaleDateString('fr-FR')`.

---

### Task 1: Migration DB — colonnes suspendu/supprime_le/anonymise_le

**Files:**
- Modify: `backend/migrate-inline.js:748` (juste avant `try { await pool.end(); }`)

**Interfaces:**
- Produces: colonnes `utilisateurs.suspendu BOOLEAN`, `utilisateurs.supprime_le TIMESTAMPTZ`, `utilisateurs.anonymise_le TIMESTAMPTZ` — utilisées par toutes les tâches suivantes.

- [ ] **Step 1: Ajouter le bloc de migration**

Dans `backend/migrate-inline.js`, juste avant la ligne `try { await pool.end(); } catch (_) {}` (fin de fichier, après le bloc `colonnesSyncCatalogue`), ajouter :

```js
  // Gestion des comptes admin — suspension + suppression RGPD réversible
  const colonnesGestionComptes = [
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS suspendu BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS supprime_le TIMESTAMPTZ`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS anonymise_le TIMESTAMPTZ`,
  ];
  for (const sql of colonnesGestionComptes) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] gestion_comptes:', e.message); }
  }
  console.log('[MIGRATE] ✅ Colonnes gestion comptes (suspendu/supprime_le/anonymise_le) OK');
```

- [ ] **Step 2: Lancer le backend en local pour exécuter la migration**

Run: `node backend/app.js` (depuis la racine du repo, avec `.env` configuré)
Expected: dans les logs, la ligne `[MIGRATE] ✅ Colonnes gestion comptes (suspendu/supprime_le/anonymise_le) OK` apparaît sans erreur avant `✅ Nopalou → http://localhost:3000`. Arrêter le process une fois cette ligne vue (Ctrl+C ou kill du PID).

- [ ] **Step 3: Vérifier les colonnes en base**

Run:
```bash
node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='utilisateurs' AND column_name IN ('suspendu','supprime_le','anonymise_le')\").then(r => {
  console.log(r.rows.map(x => x.column_name));
  pool.end();
});
"
```
Expected: `[ 'suspendu', 'supprime_le', 'anonymise_le' ]` (ordre indifférent)

- [ ] **Step 4: Relancer pour vérifier l'idempotence**

Run: `node backend/app.js` une deuxième fois, arrêter après le même log.
Expected: même ligne `[MIGRATE] ✅ Colonnes gestion comptes...` sans erreur PostgreSQL de type "column already exists".

- [ ] **Step 5: Commit**

```bash
git add backend/migrate-inline.js
git commit -m "feat(db): colonnes suspendu/supprime_le/anonymise_le sur utilisateurs"
```

---

### Task 2: Backend — GET liste + GET détail

**Files:**
- Create: `backend/routes/admin-utilisateurs.js`
- Modify: `backend/app.js` (ajout du montage de route, près de la ligne 175 `app.use('/api/abonnements', ...)`)

**Interfaces:**
- Consumes: `pool` from `backend/models/db.js` (`const { pool } = require('../models/db')`), `adminSecretOnly` from `backend/middlewares/auth.js`.
- Produces:
  - `GET /api/admin/utilisateurs?q=&statut=&type=&tri=&page=` → `{ utilisateurs: Array<{id, nom, email, telephone, email_verifie, suspendu, supprime_le, created_at}>, total: number, page: number }`
  - `GET /api/admin/utilisateurs/:id` → `{ utilisateur: {...}, activite: {nb_annonces, nb_immo, a_boutique, est_apporteur}, abonnement: {plan, fin} | null }` ou `404 { error }`
  - Ces deux routes sont consommées par les Task 6 et 7 (frontend).

- [ ] **Step 1: Créer le fichier de routes avec la liste**

Créer `backend/routes/admin-utilisateurs.js` :

```js
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { envoyerEmail } = require('../services/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// GET /api/admin/utilisateurs — liste paginée, recherche, filtres
router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const { q, statut, type, tri = 'recent', page = 1 } = req.query;
    const limit = 30;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    const conditions = [];
    const values = [];
    let i = 1;

    if (q) {
      conditions.push(`(nom ILIKE $${i} OR email ILIKE $${i} OR telephone ILIKE $${i})`);
      values.push(`%${q}%`);
      i++;
    }
    if (statut === 'verifie')   conditions.push('email_verifie = TRUE');
    if (statut === 'non_verifie') conditions.push('email_verifie = FALSE');
    if (statut === 'suspendu') conditions.push('suspendu = TRUE');
    if (statut === 'en_grace') conditions.push('supprime_le IS NOT NULL');
    if (type === 'apporteur')  conditions.push('est_apporteur = TRUE');
    if (type === 'boutique')   conditions.push('EXISTS (SELECT 1 FROM boutiques b WHERE b.utilisateur_id = utilisateurs.id)');

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = tri === 'ancien' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM utilisateurs ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count);

    const listRes = await pool.query(
      `SELECT id, nom, email, telephone, email_verifie, suspendu, supprime_le, created_at
       FROM utilisateurs ${whereClause} ${orderClause}
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset]
    );

    res.json({ utilisateurs: listRes.rows, total, page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/utilisateurs/:id — fiche détail
router.get('/:id', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await pool.query(
      `SELECT id, nom, email, telephone, ville, email_verifie, suspendu, supprime_le, anonymise_le, est_apporteur, code_apporteur, created_at
       FROM utilisateurs WHERE id = $1`,
      [id]
    );
    if (!userRes.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const activiteRes = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM annonces_classifiees WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_annonces,
        (SELECT COUNT(*) FROM annonces_immo        WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_immo,
        EXISTS(SELECT 1 FROM boutiques WHERE utilisateur_id=$1) AS a_boutique`,
      [id]
    );

    const abonnementRes = await pool.query(
      `SELECT plan, fin FROM abonnements WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW() ORDER BY fin DESC LIMIT 1`,
      [id]
    );

    res.json({
      utilisateur: userRes.rows[0],
      activite: {
        nb_annonces: parseInt(activiteRes.rows[0].nb_annonces),
        nb_immo: parseInt(activiteRes.rows[0].nb_immo),
        a_boutique: activiteRes.rows[0].a_boutique,
        est_apporteur: userRes.rows[0].est_apporteur,
      },
      abonnement: abonnementRes.rows[0] || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

- [ ] **Step 2: Monter la route dans app.js**

Dans `backend/app.js`, après la ligne `app.use('/api/abonnements', require('./routes/abonnements'));` (ligne 175), ajouter :

```js
app.use('/api/admin/utilisateurs', require('./routes/admin-utilisateurs'));
```

- [ ] **Step 3: Démarrer le backend et tester la liste**

Run: `node backend/app.js` en arrière-plan, attendre le log `✅ Nopalou → http://localhost:3000`, puis :
```bash
ADMIN_SECRET=$(node -e "require('dotenv').config(); console.log(process.env.ADMIN_SECRET||'')")
curl -s http://127.0.0.1:3000/api/admin/utilisateurs -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: JSON avec `{ "utilisateurs": [...], "total": <nombre>, "page": 1 }`, sans erreur 500.

- [ ] **Step 4: Tester la recherche et les filtres**

```bash
curl -s "http://127.0.0.1:3000/api/admin/utilisateurs?q=test" -H "X-Admin-Secret: $ADMIN_SECRET"
curl -s "http://127.0.0.1:3000/api/admin/utilisateurs?statut=suspendu" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: réponses JSON valides (200), listes filtrées cohérentes (peuvent être vides).

- [ ] **Step 5: Tester le détail avec un id existant**

```bash
USER_ID=$(node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query('SELECT id FROM utilisateurs LIMIT 1').then(r => { console.log(r.rows[0].id); pool.end(); });
")
curl -s "http://127.0.0.1:3000/api/admin/utilisateurs/$USER_ID" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: JSON avec `utilisateur`, `activite` (nb_annonces, nb_immo, a_boutique, est_apporteur), `abonnement` (objet ou null).

- [ ] **Step 6: Tester le détail avec un id inexistant**

```bash
curl -s -w "\n%{http_code}\n" "http://127.0.0.1:3000/api/admin/utilisateurs/00000000-0000-0000-0000-000000000000" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"error":"Utilisateur introuvable"}` suivi de `404`.

- [ ] **Step 7: Arrêter le backend de test**

Identifier le PID via PowerShell (`Get-CimInstance Win32_Process -Filter "Name='node.exe'"`) et l'arrêter proprement avec `Stop-Process -Id <PID> -Force` sur le PID exact lancé à l'étape 3 — ne jamais tuer tous les `node.exe` par nom.

- [ ] **Step 8: Commit**

```bash
git add backend/routes/admin-utilisateurs.js backend/app.js
git commit -m "feat(admin): routes GET liste et detail comptes utilisateurs"
```

---

### Task 3: Backend — actions support (email, reset)

**Files:**
- Modify: `backend/routes/admin-utilisateurs.js`

**Interfaces:**
- Consumes: `jwt` (déjà importé Task 2), `envoyerEmail` from `../services/email` (déjà importé Task 2), `FRONTEND_URL` (déjà défini Task 2).
- Produces:
  - `PUT /api/admin/utilisateurs/:id/verifier-email` → `{ success: true }`
  - `POST /api/admin/utilisateurs/:id/renvoyer-verification` → `{ success: true, message }`
  - `POST /api/admin/utilisateurs/:id/lien-reset` → `{ lien: string }`
  - Consommées par Task 8 (frontend actions).

- [ ] **Step 1: Ajouter les 3 routes avant `module.exports`**

Dans `backend/routes/admin-utilisateurs.js`, juste avant `module.exports = router;`, ajouter :

```js
// PUT /api/admin/utilisateurs/:id/verifier-email — force email_verifie=true
router.put('/:id/verifier-email', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET email_verifie=true WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/renvoyer-verification
router.post('/:id/renvoyer-verification', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT nom, email, email_verifie FROM utilisateurs WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (rows[0].email_verifie) return res.status(400).json({ error: 'Email déjà vérifié' });

    const verifToken = jwt.sign({ userId: req.params.id, type: 'verify' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const lien = `${FRONTEND_URL}/api/auth/verifier-email?token=${verifToken}`;
    await envoyerEmail({
      to: rows[0].email,
      subject: 'Nopalou — vérifiez votre email',
      html: `<p>Bonjour ${rows[0].nom},</p>
             <p><a href="${lien}">Cliquez ici pour vérifier votre adresse email</a> (lien valide 24h).</p>`,
    });
    res.json({ success: true, message: 'Email de vérification renvoyé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/lien-reset — génère le lien sans l'envoyer
router.post('/:id/lien-reset', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM utilisateurs WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const resetToken = jwt.sign({ userId: req.params.id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const lien = `${FRONTEND_URL}/mot-de-passe-oublie?token=${resetToken}`;
    res.json({ lien });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

- [ ] **Step 2: Démarrer le backend et tester verifier-email**

Run: `node backend/app.js` en arrière-plan, attendre le démarrage complet.
```bash
ADMIN_SECRET=$(node -e "require('dotenv').config(); console.log(process.env.ADMIN_SECRET||'')")
USER_ID=$(node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query(\"SELECT id FROM utilisateurs WHERE email_verifie=false LIMIT 1\").then(r => { console.log(r.rows[0]?.id || ''); pool.end(); });
")
echo "USER_ID=$USER_ID"
curl -s -X PUT "http://127.0.0.1:3000/api/admin/utilisateurs/$USER_ID/verifier-email" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"success":true}`. Si `USER_ID` est vide (aucun compte non vérifié en base), passer directement à l'étape 4 sans exécuter ce test — ne pas créer de compte réel pour ce test.

- [ ] **Step 3: Vérifier en base que email_verifie est passé à true**

```bash
node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query('SELECT email_verifie FROM utilisateurs WHERE id=\$1', [process.argv[1]]).then(r => { console.log(r.rows[0]); pool.end(); });
" "$USER_ID"
```
Expected: `{ email_verifie: true }`

- [ ] **Step 4: Tester lien-reset avec un id existant**

```bash
curl -s -X POST "http://127.0.0.1:3000/api/admin/utilisateurs/$USER_ID/lien-reset" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"lien":"http://localhost:8080/mot-de-passe-oublie?token=eyJ..."}` (ou l'URL de `FRONTEND_URL` configurée).

- [ ] **Step 5: Tester renvoyer-verification sur un compte déjà vérifié**

```bash
curl -s -X POST "http://127.0.0.1:3000/api/admin/utilisateurs/$USER_ID/renvoyer-verification" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"error":"Email déjà vérifié"}` (puisque l'étape 2 vient de le vérifier).

- [ ] **Step 6: Arrêter le backend de test**

Identifier et arrêter le PID exact lancé à l'étape 2 (PowerShell, jamais un kill global par nom).

- [ ] **Step 7: Commit**

```bash
git add backend/routes/admin-utilisateurs.js
git commit -m "feat(admin): actions support compte (verifier email, renvoi, lien reset)"
```

---

### Task 4: Backend — suspension/réactivation + refus de connexion

**Files:**
- Modify: `backend/routes/admin-utilisateurs.js`
- Modify: `backend/routes/auth.js:70-90` (route `POST /connexion`)

**Interfaces:**
- Produces:
  - `PUT /api/admin/utilisateurs/:id/suspendre` → `{ success: true }`
  - `PUT /api/admin/utilisateurs/:id/reactiver` → `{ success: true }`
  - `POST /api/auth/connexion` refuse désormais avec `403` si `suspendu=true` ou `supprime_le IS NOT NULL`.

- [ ] **Step 1: Ajouter les 2 routes suspendre/reactiver**

Dans `backend/routes/admin-utilisateurs.js`, avant `module.exports`, ajouter :

```js
// PUT /api/admin/utilisateurs/:id/suspendre
router.put('/:id/suspendre', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET suspendu=true WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/reactiver
router.put('/:id/reactiver', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET suspendu=false WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

- [ ] **Step 2: Modifier la route de connexion pour refuser suspendu/supprime**

Dans `backend/routes/auth.js`, la route `POST /connexion` (lignes 70-90) contient actuellement :

```js
      const { rows } = await pool.query(
        'SELECT id,nom,email,mot_de_passe_hash,email_verifie FROM utilisateurs WHERE email=$1', [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Identifiants incorrects' });
      const ok = await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe_hash);
      if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });
      const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const { mot_de_passe_hash, ...user } = rows[0];
      res.json({ user, token });
```

Remplacer par :

```js
      const { rows } = await pool.query(
        'SELECT id,nom,email,mot_de_passe_hash,email_verifie,suspendu,supprime_le FROM utilisateurs WHERE email=$1', [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Identifiants incorrects' });
      const ok = await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe_hash);
      if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });
      if (rows[0].suspendu) return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' });
      if (rows[0].supprime_le) return res.status(403).json({ error: 'Ce compte est en cours de suppression.' });
      const token = jwt.sign({ userId: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      const { mot_de_passe_hash, suspendu, supprime_le, ...user } = rows[0];
      res.json({ user, token });
```

- [ ] **Step 2b: Vérifier que la ligne SELECT modifiée compile sans erreur de syntaxe**

Run: `node -c backend/routes/auth.js`
Expected: aucune sortie (pas d'erreur de syntaxe).

- [ ] **Step 3: Démarrer le backend et créer un compte de test dédié**

Run: `node backend/app.js` en arrière-plan, attendre le démarrage complet.
```bash
EMAIL="test-suspension-$(date +%s)@nopalou-test.local"
curl -s -X POST http://127.0.0.1:3000/api/auth/inscription \
  -H "Content-Type: application/json" \
  -d "{\"nom\":\"Test Suspension\",\"email\":\"$EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Expected: JSON avec `user.id` et `token`. Noter l'`id` retourné comme `TEST_USER_ID` et l'email comme `TEST_EMAIL` pour les étapes suivantes.

- [ ] **Step 4: Vérifier que la connexion fonctionne avant suspension**

```bash
curl -s -w "\n%{http_code}\n" -X POST http://127.0.0.1:3000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Expected: `200`, JSON avec `user` et `token`.

- [ ] **Step 5: Suspendre le compte de test**

```bash
ADMIN_SECRET=$(node -e "require('dotenv').config(); console.log(process.env.ADMIN_SECRET||'')")
curl -s -X PUT "http://127.0.0.1:3000/api/admin/utilisateurs/$TEST_USER_ID/suspendre" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"success":true}`

- [ ] **Step 6: Vérifier que la connexion est refusée après suspension**

```bash
curl -s -w "\n%{http_code}\n" -X POST http://127.0.0.1:3000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Expected: `{"error":"Compte suspendu. Contactez le support."}` suivi de `403`.

- [ ] **Step 7: Réactiver et vérifier que la connexion refonctionne**

```bash
curl -s -X PUT "http://127.0.0.1:3000/api/admin/utilisateurs/$TEST_USER_ID/reactiver" -H "X-Admin-Secret: $ADMIN_SECRET"
curl -s -w "\n%{http_code}\n" -X POST http://127.0.0.1:3000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Expected: réactivation `{"success":true}`, puis connexion `200` avec `user`/`token`.

- [ ] **Step 8: Nettoyer le compte de test**

```bash
node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query('DELETE FROM utilisateurs WHERE id=\$1', [process.argv[1]]).then(r => { console.log('deleted:', r.rowCount); pool.end(); });
" "$TEST_USER_ID"
```
Expected: `deleted: 1`

- [ ] **Step 9: Arrêter le backend de test**

Identifier et arrêter le PID exact lancé à l'étape 3 (PowerShell, jamais un kill global par nom).

- [ ] **Step 10: Commit**

```bash
git add backend/routes/admin-utilisateurs.js backend/routes/auth.js
git commit -m "feat(admin): suspension/reactivation compte + refus connexion suspendu"
```

---

### Task 5: Backend — suppression RGPD réversible (marquage, restauration, purge)

**Files:**
- Modify: `backend/routes/admin-utilisateurs.js`

**Interfaces:**
- Produces:
  - `POST /api/admin/utilisateurs/:id/marquer-supprime` → `{ success: true, supprime_le }`
  - `POST /api/admin/utilisateurs/:id/restaurer` → `{ success: true }`
  - `POST /api/admin/utilisateurs/:id/purger` → `{ success: true }` ou `400 { error }` si moins de 30 jours écoulés

- [ ] **Step 1: Ajouter les 3 routes avant `module.exports`**

Dans `backend/routes/admin-utilisateurs.js`, avant `module.exports`, ajouter :

```js
// POST /api/admin/utilisateurs/:id/marquer-supprime — démarre la période de grâce (30j)
router.post('/:id/marquer-supprime', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE utilisateurs SET supprime_le=NOW() WHERE id=$1 AND anonymise_le IS NULL RETURNING id, supprime_le`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable ou déjà purgé' });
    res.json({ success: true, supprime_le: rows[0].supprime_le });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/restaurer — annule la suppression pendant la période de grâce
router.post('/:id/restaurer', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE utilisateurs SET supprime_le=NULL WHERE id=$1 AND anonymise_le IS NULL RETURNING id`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable ou déjà purgé' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/purger — anonymisation définitive après 30j révolus
router.post('/:id/purger', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, supprime_le, anonymise_le FROM utilisateurs WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (!rows[0].supprime_le) return res.status(400).json({ error: 'Ce compte n\'est pas marqué pour suppression' });
    if (rows[0].anonymise_le) return res.status(400).json({ error: 'Ce compte a déjà été purgé' });

    const joursEcoules = (Date.now() - new Date(rows[0].supprime_le).getTime()) / (1000 * 60 * 60 * 24);
    if (joursEcoules < 30) {
      return res.status(400).json({ error: `Période de grâce en cours (${Math.ceil(30 - joursEcoules)} jour(s) restant(s))` });
    }

    const id = req.params.id;
    await pool.query(
      `UPDATE utilisateurs
       SET nom = 'Utilisateur supprimé',
           email = 'deleted-' || id || '@nopalou.local',
           telephone = NULL,
           mot_de_passe_hash = 'INVALIDATED',
           anonymise_le = NOW()
       WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

- [ ] **Step 2: Démarrer le backend et créer un compte de test dédié**

Run: `node backend/app.js` en arrière-plan, attendre le démarrage complet.
```bash
EMAIL="test-suppression-$(date +%s)@nopalou-test.local"
curl -s -X POST http://127.0.0.1:3000/api/auth/inscription \
  -H "Content-Type: application/json" \
  -d "{\"nom\":\"Test Suppression\",\"email\":\"$EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Expected: JSON avec `user.id`. Noter comme `TEST_USER_ID`.

- [ ] **Step 3: Marquer pour suppression**

```bash
ADMIN_SECRET=$(node -e "require('dotenv').config(); console.log(process.env.ADMIN_SECRET||'')")
curl -s -X POST "http://127.0.0.1:3000/api/admin/utilisateurs/$TEST_USER_ID/marquer-supprime" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"success":true,"supprime_le":"<timestamp récent>"}`

- [ ] **Step 4: Vérifier que la connexion est refusée pendant la période de grâce**

```bash
curl -s -w "\n%{http_code}\n" -X POST http://127.0.0.1:3000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Expected: `{"error":"Ce compte est en cours de suppression."}` suivi de `403`.

- [ ] **Step 5: Tenter une purge avant les 30 jours (doit être refusée)**

```bash
curl -s -w "\n%{http_code}\n" -X POST "http://127.0.0.1:3000/api/admin/utilisateurs/$TEST_USER_ID/purger" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"error":"Période de grâce en cours (30 jour(s) restant(s))"}` suivi de `400`.

- [ ] **Step 6: Restaurer et vérifier que la connexion refonctionne**

```bash
curl -s -X POST "http://127.0.0.1:3000/api/admin/utilisateurs/$TEST_USER_ID/restaurer" -H "X-Admin-Secret: $ADMIN_SECRET"
curl -s -w "\n%{http_code}\n" -X POST http://127.0.0.1:3000/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Expected: restauration `{"success":true}`, puis connexion `200`.

- [ ] **Step 7: Simuler les 30 jours écoulés en forçant supprime_le dans le passé, puis purger**

```bash
node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query(\"UPDATE utilisateurs SET supprime_le = NOW() - INTERVAL '31 days' WHERE id=\$1\", [process.argv[1]])
  .then(() => pool.end());
" "$TEST_USER_ID"
curl -s -X POST "http://127.0.0.1:3000/api/admin/utilisateurs/$TEST_USER_ID/purger" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"success":true}`

- [ ] **Step 8: Vérifier l'anonymisation en base**

```bash
node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query('SELECT nom, email, telephone, mot_de_passe_hash, anonymise_le FROM utilisateurs WHERE id=\$1', [process.argv[1]]).then(r => {
  console.log(r.rows[0]);
  pool.end();
});
" "$TEST_USER_ID"
```
Expected: `nom: 'Utilisateur supprimé'`, `email: 'deleted-<id>@nopalou.local'`, `telephone: null`, `mot_de_passe_hash: 'INVALIDATED'`, `anonymise_le` rempli.

- [ ] **Step 9: Vérifier qu'une seconde purge est refusée**

```bash
curl -s -w "\n%{http_code}\n" -X POST "http://127.0.0.1:3000/api/admin/utilisateurs/$TEST_USER_ID/purger" -H "X-Admin-Secret: $ADMIN_SECRET"
```
Expected: `{"error":"Ce compte a déjà été purgé"}` suivi de `400`.

- [ ] **Step 10: Nettoyer le compte de test (suppression physique réelle, car c'est un compte de test jetable)**

```bash
node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query('DELETE FROM utilisateurs WHERE id=\$1', [process.argv[1]]).then(r => { console.log('deleted:', r.rowCount); pool.end(); });
" "$TEST_USER_ID"
```
Expected: `deleted: 1`

- [ ] **Step 11: Arrêter le backend de test**

Identifier et arrêter le PID exact lancé à l'étape 2 (PowerShell, jamais un kill global par nom).

- [ ] **Step 12: Commit**

```bash
git add backend/routes/admin-utilisateurs.js
git commit -m "feat(admin): suppression RGPD reversible (marquage, restauration, purge anonymisation)"
```

---

### Task 6: Frontend — page liste `/admin/comptes`

**Files:**
- Create: `frontend-next/src/app/admin/(protected)/comptes/page.tsx`
- Modify: `frontend-next/src/app/admin/(protected)/layout.tsx:28` (ajout du lien menu)

**Interfaces:**
- Consumes: `GET /api/admin/utilisateurs?q=&statut=&type=&tri=&page=` (Task 2).
- Produces: page `/admin/comptes` navigable, chaque ligne linke vers `/admin/comptes/[id]` (consommé visuellement par Task 7, aucune interface de code partagée hors la route).

- [ ] **Step 1: Créer la page liste**

Créer `frontend-next/src/app/admin/(protected)/comptes/page.tsx` :

```tsx
import { cookies } from 'next/headers'
import Link from 'next/link'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface Utilisateur {
  id: string
  nom: string
  email: string
  telephone: string | null
  email_verifie: boolean
  suspendu: boolean
  supprime_le: string | null
  created_at: string
}

function dateF(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

const PILLS_STATUT = [
  { value: '', label: 'Tous' },
  { value: 'verifie', label: 'Vérifiés' },
  { value: 'non_verifie', label: 'Non vérifiés' },
  { value: 'suspendu', label: 'Suspendus' },
  { value: 'en_grace', label: 'En suppression' },
]

const PILLS_TYPE = [
  { value: '', label: 'Tous' },
  { value: 'apporteur', label: 'Apporteurs' },
  { value: 'boutique', label: 'Avec boutique' },
]

export default async function AdminComptesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; type?: string; tri?: string; page?: string }>
}) {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  const sp = await searchParams
  const q = sp.q ?? ''
  const statut = sp.statut ?? ''
  const type = sp.type ?? ''
  const tri = sp.tri ?? 'recent'
  const page = sp.page ?? '1'

  let utilisateurs: Utilisateur[] = []
  let total = 0

  try {
    const params = new URLSearchParams({ q, statut, type, tri, page })
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs?${params}`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      utilisateurs = data.utilisateurs ?? []
      total = data.total ?? 0
    }
  } catch {}

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({ q, statut, type, tri, ...overrides })
    return `/admin/comptes?${params}`
  }

  const badge = (u: Utilisateur) => (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {u.email_verifie
        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ vérifié</span>
        : <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>non vérifié</span>}
      {u.suspendu && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>🚫 suspendu</span>}
      {u.supprime_le && <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>⏳ en suppression</span>}
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Comptes utilisateurs</h1>

      <form method="GET" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input type="hidden" name="statut" value={statut} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="tri" value={tri} />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher nom, email, téléphone…"
          style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 320 }}
        />
        <button type="submit" style={{ padding: '9px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Rechercher
        </button>
      </form>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PILLS_STATUT.map(p => (
            <Link
              key={p.value}
              href={buildHref({ statut: p.value, page: '1' })}
              style={{
                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 16,
                textDecoration: 'none',
                background: statut === p.value ? '#1d4ed8' : '#f1f5f9',
                color: statut === p.value ? '#fff' : '#374151',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PILLS_TYPE.map(p => (
            <Link
              key={p.value}
              href={buildHref({ type: p.value, page: '1' })}
              style={{
                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 16,
                textDecoration: 'none',
                background: type === p.value ? '#16a34a' : '#f1f5f9',
                color: type === p.value ? '#fff' : '#374151',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{total} compte(s)</p>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Nom / Email', 'Téléphone', 'Statuts', 'Inscrit le', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {utilisateurs.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Aucun compte trouvé</td></tr>
            )}
            {utilisateurs.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600 }}>{u.nom}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>{u.email}</div>
                </td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>{u.telephone ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>{badge(u)}</td>
                <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#64748b' }}>{dateF(u.created_at)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <Link href={`/admin/comptes/${u.id}`} style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', textDecoration: 'none' }}>
                    Voir →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {parseInt(page) > 1 && (
          <Link href={buildHref({ page: String(parseInt(page) - 1) })} style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>← Précédent</Link>
        )}
        {utilisateurs.length === 30 && (
          <Link href={buildHref({ page: String(parseInt(page) + 1) })} style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>Suivant →</Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Ajouter le lien menu dans le layout admin**

Dans `frontend-next/src/app/admin/(protected)/layout.tsx`, ligne 28, juste avant `<a href="/admin/abonnements" className="admin-nav-link">⭐ Abonnements</a>`, ajouter :

```tsx
          <a href="/admin/comptes" className="admin-nav-link">👥 Comptes utilisateurs</a>
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune sortie (0 erreur).

- [ ] **Step 4: Commit**

```bash
git add "frontend-next/src/app/admin/(protected)/comptes/page.tsx" "frontend-next/src/app/admin/(protected)/layout.tsx"
git commit -m "feat(admin): page liste /admin/comptes avec recherche et filtres"
```

---

### Task 7: Frontend — fiche détail `/admin/comptes/[id]`

**Files:**
- Create: `frontend-next/src/app/admin/(protected)/comptes/[id]/page.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/utilisateurs/:id` (Task 2).
- Produces: page `/admin/comptes/[id]` affichant les infos, avec un emplacement pour `<ActionsCompteClient />` (composant créé en Task 8 — cette tâche l'importe déjà avec la bonne interface de props).

- [ ] **Step 1: Créer la page détail**

Créer `frontend-next/src/app/admin/(protected)/comptes/[id]/page.tsx` :

```tsx
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ActionsCompteClient from './ActionsCompteClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface DetailResponse {
  utilisateur: {
    id: string
    nom: string
    email: string
    telephone: string | null
    ville: string | null
    email_verifie: boolean
    suspendu: boolean
    supprime_le: string | null
    anonymise_le: string | null
    est_apporteur: boolean
    code_apporteur: string | null
    created_at: string
  }
  activite: {
    nb_annonces: number
    nb_immo: number
    a_boutique: boolean
    est_apporteur: boolean
  }
  abonnement: { plan: string; fin: string } | null
}

function dateF(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

export default async function AdminCompteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  const { id } = await params

  let data: DetailResponse | null = null
  try {
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) data = await res.json()
  } catch {}

  if (!data) return notFound()

  const { utilisateur: u, activite, abonnement } = data

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <a href="/admin/comptes" style={{ fontSize: 13, color: '#1d4ed8', textDecoration: 'none' }}>← Retour à la liste</a>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 4px' }}>{u.nom}</h1>
      <p style={{ color: '#64748b', marginBottom: 4 }}>{u.email}</p>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>{u.telephone ?? 'Pas de téléphone'} · {u.ville ?? 'Dakar'} · Inscrit le {dateF(u.created_at)}</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {u.email_verifie
          ? <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: 6 }}>✓ Email vérifié</span>
          : <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>Email non vérifié</span>}
        {u.suspendu && <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '4px 10px', borderRadius: 6 }}>🚫 Suspendu</span>}
        {u.supprime_le && !u.anonymise_le && <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '4px 10px', borderRadius: 6 }}>⏳ En suppression depuis le {dateF(u.supprime_le)}</span>}
        {u.anonymise_le && <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', background: '#f9fafb', padding: '4px 10px', borderRadius: 6 }}>Purgé le {dateF(u.anonymise_le)}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Résumé d&apos;activité</h2>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>📋 {activite.nb_annonces} annonce(s) classifiée(s)</p>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>🏠 {activite.nb_immo} bien(s) immo</p>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>🏪 {activite.a_boutique ? 'A une boutique' : 'Pas de boutique'}</p>
          <p style={{ fontSize: 13, color: '#374151', margin: '4px 0' }}>💼 {activite.est_apporteur ? `Apporteur (${u.code_apporteur})` : 'Pas apporteur'}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Abonnement</h2>
          {abonnement
            ? <p style={{ fontSize: 13, color: '#374151' }}>Plan <strong>{abonnement.plan.toUpperCase()}</strong> actif jusqu&apos;au {dateF(abonnement.fin)}</p>
            : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun abonnement actif</p>}
        </div>
      </div>

      <ActionsCompteClient
        id={u.id}
        emailVerifie={u.email_verifie}
        suspendu={u.suspendu}
        supprimeLe={u.supprime_le}
        anonymiseLe={u.anonymise_le}
      />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck (échouera tant que ActionsCompteClient n'existe pas — attendu à ce stade)**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: erreur `Cannot find module './ActionsCompteClient'` — normal, ce fichier est créé en Task 8. Ne pas committer cette tâche seule tant que Task 8 n'est pas faite ; les deux tâches sont committées ensemble à la fin de Task 8.

- [ ] **Step 3: Pas de commit séparé ici**

Ce fichier sera commité avec Task 8 (Step final), car il ne compile pas seul (dépendance directe sur `ActionsCompteClient`).

---

### Task 8: Frontend — actions client (support, suspension, suppression)

**Files:**
- Create: `frontend-next/src/app/admin/(protected)/comptes/[id]/actions.ts`
- Create: `frontend-next/src/app/admin/(protected)/comptes/[id]/ActionsCompteClient.tsx`

**Interfaces:**
- Consumes: `cookies` from `next/headers`, `revalidatePath` from `next/cache` (Server Actions), les 8 routes backend créées en Task 3/4/5.
- Produces: composant `<ActionsCompteClient id supprimeLe anonymiseLe emailVerifie suspendu />` déjà consommé par `[id]/page.tsx` (Task 7).

- [ ] **Step 1: Créer le fichier de Server Actions**

Créer `frontend-next/src/app/admin/(protected)/comptes/[id]/actions.ts` :

```ts
'use server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

export interface ActionState { error?: string; success?: boolean; info?: string; lien?: string }

async function adminHeaders() {
  const jar = await cookies()
  const secret = jar.get(COOKIE)?.value
  if (!secret) throw new Error('Non authentifié')
  return { 'X-Admin-Secret': secret, 'Content-Type': 'application/json' }
}

export async function verifierEmail(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/verifier-email`, { method: 'PUT', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Email marqué comme vérifié.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function renvoyerVerification(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/renvoyer-verification`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    return { success: true, info: data.message ?? 'Email renvoyé.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function genererLienReset(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/lien-reset`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    return { success: true, lien: data.lien }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function suspendreCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/suspendre`, { method: 'PUT', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte suspendu.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function reactiverCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/reactiver`, { method: 'PUT', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte réactivé.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function marquerSupprime(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/marquer-supprime`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte marqué pour suppression (période de grâce 30 jours).' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function restaurerCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/restaurer`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Suppression annulée, compte restauré.' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}

export async function purgerCompte(id: string): Promise<ActionState> {
  try {
    const headers = await adminHeaders()
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs/${id}/purger`, { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) return { error: data.error ?? `Erreur ${res.status}` }
    revalidatePath(`/admin/comptes/${id}`)
    return { success: true, info: 'Compte purgé définitivement (anonymisé).' }
  } catch (e: unknown) { return { error: e instanceof Error ? e.message : 'Erreur' } }
}
```

- [ ] **Step 2: Créer le composant client d'actions**

Créer `frontend-next/src/app/admin/(protected)/comptes/[id]/ActionsCompteClient.tsx` :

```tsx
'use client'
import { useState, useTransition } from 'react'
import {
  verifierEmail, renvoyerVerification, genererLienReset,
  suspendreCompte, reactiverCompte,
  marquerSupprime, restaurerCompte, purgerCompte,
} from './actions'

interface Props {
  id: string
  emailVerifie: boolean
  suspendu: boolean
  supprimeLe: string | null
  anonymiseLe: string | null
}

const btnStyle = (bg: string, color: string, border: string) => ({
  fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8,
  background: bg, color, border: `1px solid ${border}`, cursor: 'pointer',
})

export default function ActionsCompteClient({ id, emailVerifie, suspendu, supprimeLe, anonymiseLe }: Props) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [lienReset, setLienReset] = useState<string | null>(null)

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 5000)
  }

  function run(action: () => Promise<{ error?: string; info?: string; success?: boolean; lien?: string }>) {
    startTransition(async () => {
      const res = await action()
      if (res.lien) setLienReset(res.lien)
      flash(!!res.success, res.info ?? res.error ?? '…')
    })
  }

  if (anonymiseLe) {
    return (
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, fontSize: 13, color: '#6b7280' }}>
        Ce compte a été purgé (anonymisé) le {new Date(anonymiseLe).toLocaleDateString('fr-FR')}. Aucune action supplémentaire disponible.
      </div>
    )
  }

  const joursRestants = supprimeLe
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(supprimeLe).getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {msg && (
        <div style={{
          fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
          background: msg.ok ? '#f0fdf4' : '#fef2f2',
          color: msg.ok ? '#16a34a' : '#dc2626',
          border: `1px solid ${msg.ok ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {msg.ok ? '✅' : '❌'} {msg.text}
        </div>
      )}

      {lienReset && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
          <strong>Lien de reset (à transmettre manuellement) :</strong>
          <div style={{ marginTop: 6, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 11 }}>{lienReset}</div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Support client</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!emailVerifie && (
            <button disabled={isPending} onClick={() => run(() => verifierEmail(id))} style={btnStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>
              ✓ Forcer vérification email
            </button>
          )}
          {!emailVerifie && (
            <button disabled={isPending} onClick={() => run(() => renvoyerVerification(id))} style={btnStyle('#eff6ff', '#1d4ed8', '#bfdbfe')}>
              ✉️ Renvoyer email de vérification
            </button>
          )}
          <button disabled={isPending} onClick={() => run(() => genererLienReset(id))} style={btnStyle('#fffbeb', '#d97706', '#fde68a')}>
            🔑 Générer lien de reset
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Modération</h2>
        {suspendu ? (
          <button disabled={isPending} onClick={() => run(() => reactiverCompte(id))} style={btnStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>
            ▶ Réactiver le compte
          </button>
        ) : (
          <button
            disabled={isPending}
            onClick={() => { if (confirm('Suspendre ce compte ? L\'utilisateur ne pourra plus se connecter.')) run(() => suspendreCompte(id)) }}
            style={btnStyle('#fef2f2', '#dc2626', '#fecaca')}
          >
            🚫 Suspendre le compte
          </button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Suppression RGPD</h2>
        {!supprimeLe && (
          <button
            disabled={isPending}
            onClick={() => { if (confirm('Marquer ce compte pour suppression ? Il sera désactivé immédiatement et purgé définitivement après 30 jours (réversible pendant cette période).')) run(() => marquerSupprime(id)) }}
            style={btnStyle('#fef2f2', '#dc2626', '#fecaca')}
          >
            🗑 Marquer pour suppression
          </button>
        )}
        {supprimeLe && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>
              ⏳ Période de grâce en cours — {joursRestants} jour(s) restant(s) avant purge possible.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button disabled={isPending} onClick={() => run(() => restaurerCompte(id))} style={btnStyle('#f0fdf4', '#16a34a', '#bbf7d0')}>
                ↩ Restaurer le compte
              </button>
              <button
                disabled={isPending || (joursRestants !== null && joursRestants > 0)}
                onClick={() => {
                  if (confirm('Purger définitivement ce compte ? Cette action est IRRÉVERSIBLE : nom/email/téléphone seront anonymisés.')) {
                    if (confirm('Confirmation finale : purger DÉFINITIVEMENT ce compte ?')) run(() => purgerCompte(id))
                  }
                }}
                style={{
                  ...btnStyle('#fef2f2', '#dc2626', '#fecaca'),
                  opacity: (joursRestants !== null && joursRestants > 0) ? 0.5 : 1,
                  cursor: (joursRestants !== null && joursRestants > 0) ? 'not-allowed' : 'pointer',
                }}
              >
                ⚠ Purger définitivement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck complet (Task 7 + Task 8 ensemble)**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune sortie (0 erreur). Si des erreurs de types apparaissent sur les props passées depuis `page.tsx` (Task 7), vérifier que les noms correspondent exactement : `emailVerifie`, `suspendu`, `supprimeLe`, `anonymiseLe`.

- [ ] **Step 4: Démarrer le backend et frontend pour un test manuel bout-en-bout**

S'assurer qu'aucun process node ne tourne déjà sur les ports 3000/3001 avant de lancer (vérifier avec la commande appropriée pour l'OS). Démarrer le backend (`node backend/app.js`) et le frontend (`cd frontend-next && npm run dev`) chacun en arrière-plan, attendre leur démarrage complet.

- [ ] **Step 5: Créer un compte de test et vérifier son affichage dans la liste**

```bash
EMAIL="test-admin-ui-$(date +%s)@nopalou-test.local"
curl -s -X POST http://127.0.0.1:3000/api/auth/inscription \
  -H "Content-Type: application/json" \
  -d "{\"nom\":\"Test UI Admin\",\"email\":\"$EMAIL\",\"mot_de_passe\":\"testpass123\"}"
```
Noter `user.id` comme `TEST_USER_ID`. Puis :
```bash
curl -s "http://127.0.0.1:3001/admin/comptes" -o /dev/null -w "%{http_code}\n"
curl -s "http://127.0.0.1:3001/admin/comptes/$TEST_USER_ID" -o /dev/null -w "%{http_code}\n"
```
Expected: `200` pour les deux (nécessite d'être connecté en admin — si `302` redirection vers `/admin/login` apparaît, c'est attendu si aucun cookie admin n'est présent dans la session curl ; dans ce cas valider uniquement que la page ne renvoie pas `500`).

- [ ] **Step 6: Nettoyer le compte de test**

```bash
node -e "
require('dotenv').config();
const { pool } = require('./backend/models/db');
pool.query('DELETE FROM utilisateurs WHERE id=\$1', [process.argv[1]]).then(r => { console.log('deleted:', r.rowCount); pool.end(); });
" "$TEST_USER_ID"
```
Expected: `deleted: 1`

- [ ] **Step 7: Arrêter le backend et le frontend de test**

Identifier et arrêter les PIDs exacts lancés à l'étape 4 (PowerShell, jamais un kill global par nom).

- [ ] **Step 8: Commit (Task 7 + Task 8 ensemble)**

```bash
git add "frontend-next/src/app/admin/(protected)/comptes/[id]/page.tsx" "frontend-next/src/app/admin/(protected)/comptes/[id]/actions.ts" "frontend-next/src/app/admin/(protected)/comptes/[id]/ActionsCompteClient.tsx"
git commit -m "feat(admin): fiche detail compte avec actions support/moderation/suppression RGPD"
```

---

### Task 9: Vérification finale et build de production

**Files:**
- Aucun fichier nouveau — vérification uniquement.

**Interfaces:**
- Consumes: l'ensemble des routes et pages créées dans les tâches précédentes.
- Produces: confirmation que le build de production passe sans erreur.

- [ ] **Step 1: Typecheck final**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune sortie (0 erreur).

- [ ] **Step 2: S'assurer qu'aucun dev server Next.js ne tourne (port 3001 libre)**

Vérifier via la méthode appropriée à l'OS qu'aucun process n'écoute sur le port 3001 avant de lancer le build (un build pendant qu'un dev server tourne corrompt `.next`).

- [ ] **Step 3: Build de production**

Run: `cd frontend-next && npm run build`
Expected: sortie se terminant par un résumé de pages générées sans erreur bloquante, incluant les nouvelles routes `/admin/comptes` et `/admin/comptes/[id]`. Une erreur EBUSY isolée en toute fin de build (verrou antivirus Windows sur la copie `standalone`) n'est pas bloquante si le résumé des pages générées est déjà affiché sans erreur.

- [ ] **Step 4: Vérifier la syntaxe du backend modifié**

Run: `node -c backend/routes/admin-utilisateurs.js && node -c backend/routes/auth.js && node -c backend/migrate-inline.js`
Expected: aucune sortie (pas d'erreur de syntaxe sur les 3 fichiers).

- [ ] **Step 5: Récapitulatif final — vérifier tous les commits de la branche**

Run: `git log --oneline -15`
Expected: voir les 8 commits de ce plan (migration, GET liste/détail, actions support, suspension, suppression RGPD, page liste, fiche détail+actions) dans l'historique, dans cet ordre.

Ce plan ne prévoit pas de push automatique — la décision de pousser vers `main` reste manuelle, comme pour les chantiers précédents de ce projet.
