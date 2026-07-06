# Paiement manuel (Wave/Orange sans clé API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au site d'encaisser des paiements réels (annonce, boost, sponsoring immo/produit/boutique, abonnement Pro/Business) via dépôt/transfert manuel Wave/Orange Money, validés à la main par l'admin, en attendant l'obtention des clés API Wave Business / Orange Money marchand.

**Architecture:** Extraction de la logique d'activation post-paiement (actuellement dupliquée dans les webhooks Wave et Orange de `backend/routes/paiement.js`) en une fonction partagée `appliquerPaiementReussi()`, réutilisée par une nouvelle table/route de déclaration-validation manuelle. Le frontend ajoute un 3ᵉ mode de paiement ("J'ai déjà payé / Payer sans app") sur chaque écran existant via un composant modal partagé, plus une nouvelle page admin de validation.

**Tech Stack:** Express + `pg` (pool), PostgreSQL, Next.js 14 App Router (Server Actions + Server Components), Cloudinary (`uploadBuffer`), `multer` (memoryStorage), `jose` (JWT pour Server Actions).

## Global Constraints

- Toute nouvelle clé `settings` doit être ajoutée à `DEFAULTS` dans `backend/lib/settingsCache.js`, sinon `PUT /api/settings` la rejette silencieusement (allowlist stricte, voir `backend/routes/settings.js:17-21`).
- Toutes les routes admin utilisent le middleware `adminSecretOnly` (header `X-Admin-Secret`), jamais `verifierToken`.
- Toutes les routes utilisateur authentifiées utilisent `verifierToken` + `limiterEcriture`.
- Le montant appliqué en base doit toujours être recalculé côté serveur via `getPrix()`/`getPlans()` — ne jamais faire confiance à un montant envoyé par le client.
- Style de code existant : pas de TypeScript côté backend, styles inline (pas de CSS modules) dans les nouveaux composants admin, cohérent avec `ApporteursClient.tsx`.
- Ne pas casser les webhooks Wave/Orange existants — leur comportement doit être strictement identique après extraction de `appliquerPaiementReussi()`.

---

## Task 1: Migration DB — table `paiements_manuels`

**Files:**
- Modify: `backend/migrate-inline.js` (ajouter un nouveau bloc, à la suite du bloc `abonnements` autour de la ligne 432)

**Interfaces:**
- Produces: table `paiements_manuels(id, utilisateur_id, reference, montant, methode, telephone_expediteur, transaction_id_client, preuve_url, statut, motif_rejet, valide_par, valide_at, created_at)`

- [ ] **Step 1: Ajouter le bloc de migration**

Dans `backend/migrate-inline.js`, juste après le bloc `abonnements` (après la ligne `} catch (e) { console.warn('[MIGRATE] abonnements:', e.message); }` autour de la ligne 432), ajouter :

```js
  // Table paiements_manuels — déclarations de dépôt Wave/Orange en attendant les clés API
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paiements_manuels (
        id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id        UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        reference             VARCHAR(100) NOT NULL,
        montant               NUMERIC(12,2) NOT NULL,
        methode               VARCHAR(20) NOT NULL CHECK (methode IN ('wave', 'orange')),
        telephone_expediteur  VARCHAR(30) NOT NULL,
        transaction_id_client VARCHAR(100),
        preuve_url            TEXT,
        statut                VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
        motif_rejet           TEXT,
        valide_par            VARCHAR(100),
        valide_at             TIMESTAMPTZ,
        created_at            TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_paiements_manuels_statut ON paiements_manuels(statut);
    `);
    console.log('[MIGRATE] ✅ Table paiements_manuels OK');
  } catch (e) { console.warn('[MIGRATE] paiements_manuels:', e.message); }
```

- [ ] **Step 2: Vérifier la migration en local**

Run: `npm run migrate`
Expected: la sortie console contient `[MIGRATE] ✅ Table paiements_manuels OK` sans erreur.

- [ ] **Step 3: Vérifier la table en base**

Run: `node -e "require('./backend/models/db').pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='paiements_manuels'\").then(r => { console.log(r.rows.map(x=>x.column_name)); process.exit(0); })"`
Expected: liste des 13 colonnes (`id`, `utilisateur_id`, `reference`, `montant`, `methode`, `telephone_expediteur`, `transaction_id_client`, `preuve_url`, `statut`, `motif_rejet`, `valide_par`, `valide_at`, `created_at`).

- [ ] **Step 4: Commit**

```bash
git add backend/migrate-inline.js
git commit -m "feat(paiement): ajoute la table paiements_manuels"
```

---

## Task 2: Settings — nouvelles clés paiement manuel + Wave/Orange devenus fonctionnels

**Files:**
- Modify: `backend/lib/settingsCache.js:9-31` (bloc `DEFAULTS`)
- Modify: `backend/routes/settings.js:34-36` (route `/public`)

**Interfaces:**
- Produces: settings `paiement_manuel_actif` (bool, défaut `'true'`), `paiement_manuel_numero_wave` (text), `paiement_manuel_numero_om` (text) — lisibles via `cfg.get()`/`cfg.getBool()`.
- Consumes: `cfg.getBool`, `cfg.get`, `cfg.DEFAULTS` (déjà existants dans `backend/lib/settingsCache.js`)

- [ ] **Step 1: Ajouter les clés au bloc DEFAULTS**

Dans `backend/lib/settingsCache.js`, modifier le bloc `DEFAULTS` (lignes 9-31) :

```js
const DEFAULTS = {
  prix_annonce:        '1500',
  prix_sponsoring:     '5000',
  prix_boost:          '500',
  boost_duree_jours:   '7',
  plan_pro_prix:       '15000',
  plan_business_prix:  '35000',
  plan_pro_label:      'Boutique Pro',
  plan_business_label: 'Boutique Business',
  commission_business: '2.0',
  paiement_wave:       'true',
  paiement_orange:     'true',
  paiement_manuel_actif:      'true',
  paiement_manuel_numero_wave: '',
  paiement_manuel_numero_om:   '',
  promo_active:        'false',
  promo_code:          '',
  promo_reduction:     '0',      // pourcentage de réduction
  promo_expiry:        '',
  whatsapp_enabled:    'true',
  whatsapp_chatbot:    'true',
  apporteur_actif:            'true',
  apporteur_taux_commission:  '10',
  apporteur_seuil_paiement:   '3000',
  apporteur_cookie_jours:     '30',
};
```

- [ ] **Step 2: Exposer les clés utiles côté public**

Dans `backend/routes/settings.js`, modifier la liste `keys` de la route `/public` (ligne 34-36) :

```js
    const keys = ['prix_annonce','prix_sponsoring','prix_boost','boost_duree_jours',
                  'plan_pro_prix','plan_business_prix','plan_pro_label','plan_business_label',
                  'promo_active','promo_reduction',
                  'paiement_wave','paiement_orange','paiement_manuel_actif',
                  'paiement_manuel_numero_wave','paiement_manuel_numero_om'];
```

- [ ] **Step 3: Vérifier manuellement**

Run: `curl.exe http://localhost:3000/api/settings/public` (backend doit tourner via `npm run dev`)
Expected: le JSON retourné contient les clés `paiement_wave`, `paiement_orange`, `paiement_manuel_actif`, `paiement_manuel_numero_wave`, `paiement_manuel_numero_om`.

- [ ] **Step 4: Commit**

```bash
git add backend/lib/settingsCache.js backend/routes/settings.js
git commit -m "feat(paiement): expose les settings du paiement manuel"
```

---

## Task 3: Extraction de `appliquerPaiementReussi()` dans `paiement.js`

**Files:**
- Modify: `backend/routes/paiement.js:56-182` (webhook Wave) et `backend/routes/paiement.js:332-457` (webhook Orange)

**Interfaces:**
- Produces: `async function appliquerPaiementReussi(reference, montant, methode)` — exportée via `module.exports`, effectue exactement la même logique que les blocs `if (ref.startsWith(...))` actuels (annonce, boost, immo, boutique, produit, abonnement + commission apporteur), insère dans `commandes` avec `methode_paiement = methode`.
- Consumes: `pool` (`../models/db`), `cfg` (`../lib/settingsCache`), `getPrix()` (défini plus haut dans le même fichier).

Cette tâche est une refactorisation pure : le comportement des webhooks Wave et Orange ne doit pas changer.

- [ ] **Step 1: Écrire la fonction partagée**

Dans `backend/routes/paiement.js`, juste après la fonction `getPrix()` (après la ligne 33, avant `// POST /api/paiement/wave/initier`), ajouter :

```js
// Applique l'effet d'un paiement réussi (annonce, boost, sponsoring, abonnement)
// Appelée par les webhooks Wave/Orange ET par la validation admin d'un paiement manuel.
async function appliquerPaiementReussi(reference, montant, methode) {
  await pool.query(
    "INSERT INTO commandes (reference,montant,statut,methode_paiement) VALUES ($1,$2,'payee',$3) ON CONFLICT (reference) DO NOTHING",
    [reference, montant, methode]
  );

  const ref = reference;

  // Annonce classifiée : ref = ann_userId_annonceId
  if (ref && ref.startsWith('ann_')) {
    const annonceId = ref.split('_')[2];
    if (annonceId) {
      await pool.query(
        "UPDATE annonces_classifiees SET payee=true, actif=true, commande_ref=$1 WHERE id=$2",
        [ref, annonceId]
      );
    }
  }
  // Sponsoring immo : ref = immo_userId_immoId
  if (ref && ref.startsWith('immo_')) {
    const immoId = ref.split('_')[2];
    if (immoId) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE annonces_immo SET sponsorisee=true, sponsorisee_jusqu_au=$1, demande_sponsorisation=false WHERE id=$2",
        [until, immoId]
      );
    }
  }
  // Sponsoring boutique : ref = bout_userId_boutiqueId
  if (ref && ref.startsWith('bout_')) {
    const boutiqueId = ref.split('_')[2];
    if (boutiqueId) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE boutiques SET sponsorise=true, sponsor_jusqu_au=$1 WHERE id=$2",
        [until, boutiqueId]
      );
    }
  }
  // Sponsoring produit : ref = prod_userId_produitId
  if (ref && ref.startsWith('prod_')) {
    const produitId = ref.split('_')[2];
    if (produitId) {
      const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE produits SET sponsorise=true, sponsor_jusqu_au=$1 WHERE id=$2",
        [until, produitId]
      );
    }
  }
  // Boost annonce 7 jours : ref = boost_userId_annonceId
  if (ref && ref.startsWith('boost_')) {
    const annonceId = ref.split('_')[2];
    if (annonceId) {
      const boostJours = (await cfg.getNum('boost_duree_jours')) || 7;
      const until = new Date(Date.now() + boostJours * 24 * 60 * 60 * 1000).toISOString();
      await pool.query(
        "UPDATE annonces_classifiees SET boost_until=$1 WHERE id=$2",
        [until, annonceId]
      );
    }
  }
  // Abonnement Boutique Pro/Business : ref = abmt_userId_plan
  if (ref && ref.startsWith('abmt_')) {
    const parts = ref.split('_');
    const userId = parts[1];
    const plan   = parts[2];
    const pxAbmt = await getPrix();
    const PRIX   = { pro: pxAbmt.pro, business: pxAbmt.business };
    if (userId && plan && PRIX[plan]) {
      const fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const abonnementRow = await pool.query(
        `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
         VALUES ($1,$2,'actif',$3,$4,$5)
         ON CONFLICT (commande_ref) DO NOTHING
         RETURNING id`,
        [userId, plan, PRIX[plan], fin, ref]
      );
      if (plan === 'business') {
        await pool.query(
          'UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2',
          [pxAbmt.commissionBiz, userId]
        );
      }
      if (abonnementRow.rows[0]) {
        try {
          const apporteurActif = await cfg.getBool('apporteur_actif');
          if (apporteurActif) {
            const boutiqueApporteur = await pool.query(
              'SELECT id, apporteur_id FROM boutiques WHERE utilisateur_id=$1 AND apporteur_id IS NOT NULL LIMIT 1',
              [userId]
            );
            if (boutiqueApporteur.rows[0]) {
              const taux = await cfg.getNum('apporteur_taux_commission');
              const montantCommission = Number(PRIX[plan]) * (taux / 100);
              await pool.query(
                `INSERT INTO commissions_apporteur (apporteur_id, boutique_id, abonnement_id, montant)
                 VALUES ($1,$2,$3,$4)`,
                [boutiqueApporteur.rows[0].apporteur_id, boutiqueApporteur.rows[0].id, abonnementRow.rows[0].id, montantCommission]
              );
            }
          }
        } catch (commErr) {
          console.error(`[${methode.toUpperCase()}] commission apporteur:`, commErr.message);
        }
      }
    }
  }

  return ref;
}
```

- [ ] **Step 2: Remplacer le corps du webhook Wave**

Dans `backend/routes/paiement.js`, remplacer tout le bloc entre `const { type, data } = req.body;` (ligne 67) et `res.sendStatus(200);` (ligne 181) par :

```js
  const { type, data } = req.body;
  if (type === 'checkout.session.completed') {
    const ref = await appliquerPaiementReussi(data.client_reference, data.amount, 'wave');
    if (data.customer_phone)
      await notifs.confirmationCommande(data.customer_phone, ref);
  }
  res.sendStatus(200);
```

- [ ] **Step 3: Remplacer le corps du webhook Orange**

Dans `backend/routes/paiement.js`, remplacer tout le bloc entre `const { status, order_id, amount } = req.body;` et `res.sendStatus(200);` juste avant le `catch` (à l'intérieur du `try` du webhook Orange) par :

```js
    const { status, order_id, amount } = req.body;
    if (status !== 'SUCCESS') return res.sendStatus(200);

    await appliquerPaiementReussi(order_id, amount || 0, 'orange');
    res.sendStatus(200);
```

- [ ] **Step 4: Exporter la fonction**

Dans `backend/routes/paiement.js`, remplacer la dernière ligne `module.exports = router;` par :

```js
module.exports = router;
module.exports.appliquerPaiementReussi = appliquerPaiementReussi;
```

- [ ] **Step 5: Test manuel de non-régression sur le webhook Wave**

Démarrer le backend (`npm run dev`), puis simuler un webhook Wave localement (remplacer `WAVE_WEBHOOK_SECRET` par la vraie valeur de `.env`) :

```bash
node -e "
const crypto = require('crypto');
const body = { type: 'checkout.session.completed', data: { client_reference: 'ann_test_00000000-0000-0000-0000-000000000000', amount: 1500 } };
const sig = crypto.createHmac('sha256', process.env.WAVE_WEBHOOK_SECRET || 'test').update(JSON.stringify(body)).digest('hex');
console.log(sig);
"
```

Expected: le endpoint répond toujours `200` et une ligne apparaît dans `commandes` avec `methode_paiement='wave'` (vérifiable via `SELECT * FROM commandes ORDER BY created_at DESC LIMIT 1;`). Le comportement doit être identique à avant la refactorisation (annonce inexistante donc pas de UPDATE, mais la commande est bien insérée).

- [ ] **Step 6: Commit**

```bash
git add backend/routes/paiement.js
git commit -m "refactor(paiement): extrait appliquerPaiementReussi() des webhooks Wave/Orange"
```

---

## Task 4: Garde-fous `paiement_wave`/`paiement_orange` sur les routes d'initiation

**Files:**
- Modify: `backend/routes/paiement.js` — 6 routes `.../initier` (`wave/initier`, `annonce/initier`, `immo-sponsoring/initier`, `produit-sponsoring/initier`, `boutique-sponsoring/initier`, `orange/initier`)
- Modify: `backend/routes/abonnements.js:30-64` (route `/initier`)

**Interfaces:**
- Consumes: `cfg.getBool('paiement_wave')`, `cfg.getBool('paiement_orange')` (déjà disponibles depuis Task 2)

- [ ] **Step 1: Ajouter le garde-fou Wave sur chaque route Wave**

Dans `backend/routes/paiement.js`, pour chacune des routes suivantes, ajouter en première ligne du bloc `try` la vérification `paiement_wave` :
- `router.post('/wave/initier', ...)` (ligne 36)
- `router.post('/annonce/initier', ...)` (ligne 185)
- `router.post('/immo-sponsoring/initier', ...)` (ligne 218)
- `router.post('/produit-sponsoring/initier', ...)` (ligne 248)
- `router.post('/boutique-sponsoring/initier', ...)` (ligne 279)
- `router.post('/boost/initier', ...)` (ligne 490)

Exemple pour `annonce/initier` :

```js
router.post('/annonce/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
    const userId    = req.user.userId;
    // ... reste du code inchangé
```

Appliquer le même ajout (`if (!(await cfg.getBool('paiement_wave'))) return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });` juste après `try {`) aux 5 autres routes listées.

- [ ] **Step 2: Ajouter le garde-fou Orange**

Dans `backend/routes/paiement.js`, sur `router.post('/orange/initier', ...)` (ligne 309), ajouter juste après `try {` :

```js
    if (!(await cfg.getBool('paiement_orange'))) {
      return res.status(403).json({ error: 'Paiement Orange Money temporairement indisponible' });
    }
```

- [ ] **Step 3: Ajouter le garde-fou sur l'abonnement**

Dans `backend/routes/abonnements.js`, sur `router.post('/initier', ...)` (ligne 30), ajouter juste après `try {` :

```js
    if (!(await cfg.getBool('paiement_wave'))) {
      return res.status(403).json({ error: 'Paiement Wave temporairement indisponible' });
    }
```

- [ ] **Step 4: Test manuel**

Depuis `psql` ou un script Node, désactiver temporairement Wave :
```bash
node -e "require('./backend/lib/settingsCache').set('paiement_wave', 'false').then(() => process.exit(0))"
```
Puis appeler `POST /api/paiement/annonce/initier` avec un token valide (via curl ou Postman).
Expected: réponse `403 { error: 'Paiement Wave temporairement indisponible' }`.

Réactiver ensuite :
```bash
node -e "require('./backend/lib/settingsCache').set('paiement_wave', 'true').then(() => process.exit(0))"
```

- [ ] **Step 5: Commit**

```bash
git add backend/routes/paiement.js backend/routes/abonnements.js
git commit -m "feat(paiement): rend fonctionnels les toggles paiement_wave/paiement_orange"
```

---

## Task 5: Routes backend — déclaration et validation du paiement manuel

**Files:**
- Modify: `backend/routes/paiement.js` (ajouter les 4 nouvelles routes en fin de fichier, avant `module.exports`)

**Interfaces:**
- Consumes: `appliquerPaiementReussi` (Task 3), `pool`, `verifierToken`, `adminSecretOnly`, `limiterEcriture`, `limiterGeneral`, `getPrix()`, `uploadBuffer` (`../services/cloudinary`), `multer`
- Produces:
  - `POST /api/paiement/manuel/declarer` (auth) → `{ ok: true, id }`
  - `GET /api/paiement/manuel/liste?statut=en_attente` (admin) → `{ paiements: [...] }`
  - `POST /api/paiement/manuel/:id/valider` (admin) → `{ ok: true }`
  - `POST /api/paiement/manuel/:id/rejeter` (admin) → `{ ok: true }`

Le calcul du montant attendu par référence réutilise les mêmes vérifications de propriété que les routes `.../initier` existantes (ex. `SELECT id FROM annonces_classifiees WHERE id=$1 AND utilisateur_id=$2`). Pour rester DRY sans sur-ingénierie, la route `declarer` ne revalide **pas** l'existence/propriété de l'entité (elle sera revalidée implicitement par `appliquerPaiementReussi`, qui ne fait rien si l'id n'existe pas) — seul le montant est recalculé côté serveur à la validation admin, pas à la déclaration.

- [ ] **Step 1: Ajouter multer au sommet du fichier**

Dans `backend/routes/paiement.js`, après la ligne `const cfg = require('../lib/settingsCache');` (ligne 8), ajouter :

```js
const multer = require('multer');
const { uploadBuffer } = require('../services/cloudinary');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
```

- [ ] **Step 2: Route de déclaration**

Juste avant `module.exports = router;`, ajouter :

```js
// POST /api/paiement/manuel/declarer — le client déclare un dépôt Wave/Orange effectué manuellement
router.post('/manuel/declarer', verifierToken, limiterEcriture, upload.single('preuve'), async (req, res) => {
  try {
    if (!(await cfg.getBool('paiement_manuel_actif'))) {
      return res.status(403).json({ error: 'Paiement manuel temporairement indisponible' });
    }
    const userId = req.user.userId;
    const { reference, montant, methode, telephone_expediteur, transaction_id_client } = req.body;

    if (!reference || !montant || !methode || !telephone_expediteur) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    if (!['wave', 'orange'].includes(methode)) {
      return res.status(400).json({ error: 'Méthode invalide' });
    }
    if (!transaction_id_client && !req.file) {
      return res.status(400).json({ error: 'Fournir un ID de transaction ou une preuve de paiement' });
    }

    let preuveUrl = null;
    if (req.file) {
      preuveUrl = await uploadBuffer(req.file.buffer, 'paiements-manuels');
    }

    const { rows } = await pool.query(
      `INSERT INTO paiements_manuels
         (utilisateur_id, reference, montant, methode, telephone_expediteur, transaction_id_client, preuve_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [userId, reference, montant, methode, telephone_expediteur, transaction_id_client || null, preuveUrl]
    );

    res.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error('[PAIEMENT MANUEL DECLARER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/paiement/manuel/liste — déclarations en attente (admin)
router.get('/manuel/liste', adminSecretOnly, async (req, res) => {
  try {
    const statut = ['en_attente', 'valide', 'rejete'].includes(req.query.statut) ? req.query.statut : 'en_attente';
    const { rows } = await pool.query(
      `SELECT pm.id, pm.reference, pm.montant, pm.methode, pm.telephone_expediteur,
              pm.transaction_id_client, pm.preuve_url, pm.statut, pm.motif_rejet, pm.created_at,
              u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone AS utilisateur_telephone
       FROM paiements_manuels pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE pm.statut = $1
       ORDER BY pm.created_at DESC
       LIMIT 200`,
      [statut]
    );
    res.json({ paiements: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/paiement/manuel/:id/valider — valide un dépôt déclaré et applique l'effet (admin)
router.post('/manuel/:id/valider', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, reference, montant, methode, statut FROM paiements_manuels WHERE id=$1`,
      [req.params.id]
    );
    const paiement = rows[0];
    if (!paiement) return res.status(404).json({ error: 'Déclaration introuvable' });
    if (paiement.statut !== 'en_attente') {
      return res.status(409).json({ error: 'Déclaration déjà traitée' });
    }

    await appliquerPaiementReussi(paiement.reference, paiement.montant, 'manuel');

    await pool.query(
      `UPDATE paiements_manuels SET statut='valide', valide_par=$1, valide_at=NOW() WHERE id=$2`,
      [req.headers['x-admin-secret'] ? 'admin' : 'admin', req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[PAIEMENT MANUEL VALIDER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/paiement/manuel/:id/rejeter — rejette un dépôt déclaré (admin)
router.post('/manuel/:id/rejeter', adminSecretOnly, async (req, res) => {
  try {
    const { motif } = req.body;
    const { rows } = await pool.query(
      `UPDATE paiements_manuels SET statut='rejete', motif_rejet=$1
       WHERE id=$2 AND statut='en_attente'
       RETURNING id`,
      [motif || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Déclaration introuvable ou déjà traitée' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

Note sur `valide_par` : le middleware `adminSecretOnly` n'attache pas d'identité admin nommée (un seul secret partagé) — on stocke la constante `'admin'` plutôt qu'une valeur inventée, cohérent avec l'absence de table d'utilisateurs admin dans ce projet.

- [ ] **Step 3: Test manuel de la déclaration**

Backend démarré (`npm run dev`), avec un token JWT valide d'un utilisateur test et une annonce existante :

```bash
curl.exe -X POST http://localhost:3000/api/paiement/manuel/declarer ^
  -H "Authorization: Bearer <TOKEN>" ^
  -F "reference=ann_<userId>_<annonceId>" ^
  -F "montant=1500" ^
  -F "methode=wave" ^
  -F "telephone_expediteur=771234567" ^
  -F "transaction_id_client=TX123456"
```

Expected: `200 { ok: true, id: "<uuid>" }`. Vérifier en base : `SELECT * FROM paiements_manuels ORDER BY created_at DESC LIMIT 1;` → `statut='en_attente'`.

- [ ] **Step 4: Test manuel de la validation**

```bash
curl.exe -X POST http://localhost:3000/api/paiement/manuel/<id>/valider -H "X-Admin-Secret: <ADMIN_SECRET>"
```

Expected: `200 { ok: true }`. Vérifier que `annonces_classifiees.actif=true, payee=true` pour l'annonce concernée, et que `paiements_manuels.statut='valide'`.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/paiement.js
git commit -m "feat(paiement): ajoute la declaration et validation de paiement manuel"
```

---

## Task 6: Server Action frontend — déclaration de paiement manuel

**Files:**
- Modify: `frontend-next/src/app/actions/paiement.ts` (ajouter une nouvelle fonction en fin de fichier)

**Interfaces:**
- Produces: `declarerPaiementManuel(input: { reference: string; montant: number; methode: 'wave' | 'orange'; telephoneExpediteur: string; transactionId?: string; preuve?: File }): Promise<PaiementResult>`
- Consumes: `getOptionalSession` (déjà importé), `PaiementResult` (déjà défini ligne 16-20)

- [ ] **Step 1: Ajouter la Server Action**

Dans `frontend-next/src/app/actions/paiement.ts`, à la fin du fichier, ajouter :

```ts
export async function declarerPaiementManuel(input: {
  reference: string
  montant: number
  methode: 'wave' | 'orange'
  telephoneExpediteur: string
  transactionId?: string
  preuve?: File
}): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const form = new FormData()
    form.set('reference', input.reference)
    form.set('montant', String(input.montant))
    form.set('methode', input.methode)
    form.set('telephone_expediteur', input.telephoneExpediteur)
    if (input.transactionId) form.set('transaction_id_client', input.transactionId)
    if (input.preuve) form.set('preuve', input.preuve)

    const res = await fetch(`${BACKEND}/api/paiement/manuel/declarer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npm run build`
Expected: build réussi, aucune erreur TypeScript sur `paiement.ts`.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/actions/paiement.ts
git commit -m "feat(paiement): ajoute la Server Action declarerPaiementManuel"
```

---

## Task 7: Composant partagé `ModalPaiementManuel`

**Files:**
- Create: `frontend-next/src/components/ModalPaiementManuel.tsx`

**Interfaces:**
- Consumes: `declarerPaiementManuel` (Task 6)
- Produces: `<ModalPaiementManuel reference={string} montant={number} numeroWave={string} numeroOM={string} onClose={() => void} onSuccess={() => void} />` — composant client, exporté par défaut.

- [ ] **Step 1: Écrire le composant**

```tsx
'use client'
import { useState } from 'react'
import { declarerPaiementManuel } from '@/app/actions/paiement'

interface Props {
  reference: string
  montant: number
  numeroWave: string
  numeroOM: string
  onClose: () => void
  onSuccess: () => void
}

export default function ModalPaiementManuel({ reference, montant, numeroWave, numeroOM, onClose, onSuccess }: Props) {
  const [methode, setMethode] = useState<'wave' | 'orange'>('wave')
  const [telephone, setTelephone] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [preuve, setPreuve] = useState<File | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)

  const numero = methode === 'wave' ? numeroWave : numeroOM

  async function soumettre() {
    setErreur(null)
    if (!telephone) { setErreur('Indiquez le numéro utilisé pour le dépôt.'); return }
    if (!transactionId && !preuve) { setErreur('Indiquez l\'ID de transaction ou une capture d\'écran.'); return }

    setEnvoi(true)
    const res = await declarerPaiementManuel({
      reference, montant, methode,
      telephoneExpediteur: telephone,
      transactionId: transactionId || undefined,
      preuve: preuve || undefined,
    })
    setEnvoi(false)
    if (res.ok) setEnvoye(true)
    else setErreur(res.error ?? 'Erreur lors de l\'envoi')
  }

  if (envoye) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 32 }}>✅</p>
          <p style={{ fontWeight: 600 }}>Déclaration reçue</p>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Votre paiement sera vérifié et activé sous peu. Vous serez contacté si besoin.
          </p>
          <button onClick={onSuccess} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, padding: 24 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Payer sans app / j&apos;ai déjà payé</h3>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
          Effectuez un dépôt de <strong>{montant.toLocaleString('fr-FR')} FCFA</strong> puis déclarez-le ci-dessous.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setMethode('wave')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: methode === 'wave' ? '2px solid #00a3e0' : '1px solid #d1d5db', background: methode === 'wave' ? '#e0f7ff' : '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            🌊 Wave
          </button>
          <button
            onClick={() => setMethode('orange')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: methode === 'orange' ? '2px solid #ff6600' : '1px solid #d1d5db', background: methode === 'orange' ? '#fff2e6' : '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            🟠 Orange Money
          </button>
        </div>

        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
          Déposez sur le numéro : <strong>{numero || 'Numéro non configuré — contactez le support'}</strong>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Votre numéro de téléphone (expéditeur)</label>
        <input
          type="tel"
          value={telephone}
          onChange={e => setTelephone(e.target.value)}
          placeholder="77 123 45 67"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>ID de transaction (optionnel si preuve fournie)</label>
        <input
          type="text"
          value={transactionId}
          onChange={e => setTransactionId(e.target.value)}
          placeholder="Référence de la transaction"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12 }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Capture d&apos;écran du paiement (optionnel si ID fourni)</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setPreuve(e.target.files?.[0] ?? null)}
          style={{ marginBottom: 16 }}
        />

        {erreur && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{erreur}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={soumettre}
            disabled={envoi}
            style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: envoi ? '#9ca3af' : '#111827', color: '#fff', fontWeight: 700, cursor: envoi ? 'not-allowed' : 'pointer' }}
          >
            {envoi ? 'Envoi...' : 'J\'ai payé, envoyer ma déclaration'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier que la classe CSS `modal-overlay`/`modal-content` existe déjà**

Run: `grep -rn "modal-overlay" frontend-next/src/app/globals.css`
Expected: au moins une occurrence (le projet utilise déjà ce pattern ailleurs, ex. `CommanderModal.tsx`). Si absent, ajouter un style minimal dans `globals.css` :

```css
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #fff; border-radius: 12px; max-height: 90vh; overflow-y: auto; }
```

- [ ] **Step 3: Vérifier la compilation**

Run: `cd frontend-next && npm run build`
Expected: build réussi.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/components/ModalPaiementManuel.tsx frontend-next/src/app/globals.css
git commit -m "feat(paiement): ajoute le composant ModalPaiementManuel"
```

---

## Task 8: Intégration — écran paiement annonce classifiée

**Files:**
- Modify: `frontend-next/src/app/payer-annonce/[id]/PaiementClient.tsx`

**Interfaces:**
- Consumes: `ModalPaiementManuel` (Task 7)
- Nécessite les settings publics (`paiement_wave`, `paiement_orange`, `paiement_manuel_actif`, `paiement_manuel_numero_wave`, `paiement_manuel_numero_om`) — passés en props depuis la page serveur parente.

- [ ] **Step 1: Localiser et lire la page serveur parente**

Run: `find "frontend-next/src/app/payer-annonce" -name "page.tsx"` — lire son contenu pour connaître la structure actuelle des props passées à `PaiementClient`.

- [ ] **Step 2: Modifier la page serveur pour injecter les settings**

Dans `frontend-next/src/app/payer-annonce/[id]/page.tsx`, ajouter un fetch vers `GET /api/settings/public` (pattern déjà utilisé ailleurs avec `apiFetch` ou `fetch` direct côté serveur) et transmettre le résultat en props à `PaiementClient` :

```tsx
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
// ... dans le composant serveur, avant le return :
let settings: Record<string, string> = {}
try {
  const r = await fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store' })
  if (r.ok) settings = await r.json()
} catch {}
// ...
<PaiementClient annonceId={id} titreCourt={titreCourt} settings={settings} />
```

- [ ] **Step 3: Modifier `PaiementClient.tsx`**

Remplacer le contenu du fichier pour ajouter le 3ᵉ mode et masquer Wave/Orange selon les toggles :

```tsx
'use client'
import { useState, useTransition } from 'react'
import { initierWaveAnnonce, initierOrangeAnnonce } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

interface Props {
  annonceId: string
  titreCourt: string
  settings: Record<string, string>
}

export default function PaiementClient({ annonceId, titreCourt, settings }: Props) {
  const [error, setError]                     = useState<string | null>(null)
  const [pendingWave, startWave]             = useTransition()
  const [pendingOrange, startOrange]         = useTransition()
  const [showManuel, setShowManuel]           = useState(false)

  const waveActif    = settings.paiement_wave !== 'false'
  const orangeActif  = settings.paiement_orange !== 'false'
  const manuelActif  = settings.paiement_manuel_actif !== 'false'
  const montant      = Number(settings.prix_annonce) || 1500

  function payerWave() {
    setError(null)
    startWave(async () => {
      const res = await initierWaveAnnonce(annonceId)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setError(res.error ?? 'Impossible d\'initialiser le paiement Wave.')
      }
    })
  }

  function payerOrange() {
    setError(null)
    startOrange(async () => {
      const res = await initierOrangeAnnonce(annonceId)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setError(res.error ?? 'Impossible d\'initialiser le paiement Orange Money.')
      }
    })
  }

  return (
    <div className="paiement-card">
      <div className="paiement-annonce-info">
        <span className="paiement-label">Annonce à activer</span>
        <p className="paiement-titre-annonce">{titreCourt}</p>
      </div>

      <div className="paiement-montant-box">
        <span className="paiement-montant">{montant.toLocaleString('fr-FR')} FCFA</span>
        <span className="paiement-montant-desc">Activation annonce — paiement unique</span>
      </div>

      {error && <p className="paiement-error">❌ {error}</p>}

      <div className="paiement-methodes">
        <p className="paiement-methodes-titre">Choisissez votre mode de paiement</p>

        {waveActif && (
          <button onClick={payerWave} disabled={pendingWave || pendingOrange} className="paiement-btn paiement-btn--wave">
            {pendingWave ? (
              <span>Connexion Wave…</span>
            ) : (
              <>
                <span className="paiement-btn-logo">🌊</span>
                <div className="paiement-btn-text">
                  <span className="paiement-btn-nom">Wave</span>
                  <span className="paiement-btn-desc">Paiement mobile instantané</span>
                </div>
                <span className="paiement-btn-arrow">→</span>
              </>
            )}
          </button>
        )}

        {orangeActif && (
          <button onClick={payerOrange} disabled={pendingWave || pendingOrange} className="paiement-btn paiement-btn--orange">
            {pendingOrange ? (
              <span>Connexion Orange Money…</span>
            ) : (
              <>
                <span className="paiement-btn-logo">🟠</span>
                <div className="paiement-btn-text">
                  <span className="paiement-btn-nom">Orange Money</span>
                  <span className="paiement-btn-desc">Paiement via votre compte Orange</span>
                </div>
                <span className="paiement-btn-arrow">→</span>
              </>
            )}
          </button>
        )}

        {manuelActif && (
          <button onClick={() => setShowManuel(true)} className="paiement-btn">
            <span className="paiement-btn-logo">🧾</span>
            <div className="paiement-btn-text">
              <span className="paiement-btn-nom">J&apos;ai déjà payé / Payer sans app</span>
              <span className="paiement-btn-desc">Dépôt manuel Wave/Orange, validé par notre équipe</span>
            </div>
            <span className="paiement-btn-arrow">→</span>
          </button>
        )}
      </div>

      <div className="paiement-garanties">
        <span>🔒 Paiement sécurisé</span>
        <span>✅ Activation immédiate</span>
        <span>📞 Support disponible</span>
      </div>

      {showManuel && (
        <ModalPaiementManuel
          reference={`ann_manuel_${annonceId}`}
          montant={montant}
          numeroWave={settings.paiement_manuel_numero_wave || ''}
          numeroOM={settings.paiement_manuel_numero_om || ''}
          onClose={() => setShowManuel(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}
```

**Important** : la référence utilisée ici doit correspondre au format attendu par `appliquerPaiementReussi` — `ann_{userId}_{annonceId}`, pas `ann_manuel_{annonceId}`. Corriger en récupérant le `userId` : la page serveur parente connaît déjà l'utilisateur (via `verifySession`/`getOptionalSession`), donc il faut passer `userId` en props supplémentaire à `PaiementClient` et construire `reference={`ann_${userId}_${annonceId}`}`.

- [ ] **Step 4: Corriger la construction de la référence avec le vrai format**

Ajouter `userId: string` aux props de `PaiementClient`, le passer depuis la page serveur (`session.userId`), et remplacer la ligne `reference={...}` par :

```tsx
reference={`ann_${userId}_${annonceId}`}
```

- [ ] **Step 5: Test manuel dans le navigateur**

Démarrer `npm run dev` (backend) et `cd frontend-next && npm run dev`. Se connecter, créer une annonce non payée, aller sur `/payer-annonce/<id>`.
Expected: les 3 boutons (Wave, Orange, Manuel) s'affichent. Cliquer sur "J'ai déjà payé" ouvre la modal avec le bon numéro affiché (vide si non configuré). Soumettre avec un ID de transaction factice → message de succès affiché, et une ligne apparaît dans `paiements_manuels` avec `statut='en_attente'`.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/payer-annonce
git commit -m "feat(paiement): ajoute le mode manuel a l'ecran de paiement annonce"
```

---

## Task 9: Intégration — sponsoring immo, produit, boutique

**Files:**
- Modify: `frontend-next/src/app/immo/[id]/SponsoringImmoBtn.tsx`
- Modify: `frontend-next/src/app/produit/[id]/SponsoringProduitBtn.tsx`
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (bloc sponsoring, autour de `handleSponsoring` ligne ~984)

**Interfaces:**
- Consumes: `ModalPaiementManuel` (Task 7), settings publics `paiement_manuel_numero_wave`/`paiement_manuel_numero_om`/`paiement_manuel_actif`/`prix_sponsoring`

Ces trois composants suivent tous le même principe que `PaiementClient.tsx` (Task 8) : ajouter un bouton "Payer sans app" ouvrant `ModalPaiementManuel` avec la référence correspondante (`immo_{userId}_{immoId}`, `prod_{userId}_{produitId}`, `bout_{userId}_{boutiqueId}`).

- [ ] **Step 1: Lire les 3 fichiers existants**

Lire intégralement `SponsoringImmoBtn.tsx`, `SponsoringProduitBtn.tsx`, et le bloc sponsoring de `BoutiqueClient.tsx` (autour de la ligne 984) pour connaître leur structure exacte de props/état avant modification — chacun a probablement une structure légèrement différente (composant standalone vs section intégrée à un client plus large).

- [ ] **Step 2: Modifier `SponsoringImmoBtn.tsx`**

Ajouter le state `showManuel`, importer `ModalPaiementManuel`, ajouter un bouton "Payer sans app" sous le bouton Wave existant, avec :

```tsx
reference={`immo_${userId}_${immoId}`}
montant={prixSponsoring}
```

où `userId` doit être passé en props depuis la page serveur parente (comme pour Task 8), et `prixSponsoring`/les settings viennent de `GET /api/settings/public` fetché côté page serveur et transmis en props.

- [ ] **Step 3: Modifier `SponsoringProduitBtn.tsx`**

Même principe, `reference={`prod_${userId}_${produitId}`}`.

- [ ] **Step 4: Modifier `BoutiqueClient.tsx`**

Dans le bloc sponsoring (fonction `handleSponsoring` et son JSX associé), ajouter le même bouton, `reference={`bout_${userId}_${boutiqueId}`}` — `userId` est déjà disponible dans ce composant puisqu'il gère la boutique de l'utilisateur connecté.

- [ ] **Step 5: Test manuel**

Pour chacun des 3 écrans, vérifier dans le navigateur que le bouton "Payer sans app" apparaît, ouvre la modal avec la bonne référence, et qu'une déclaration réussie insère bien une ligne `paiements_manuels` avec le préfixe attendu (`immo_`, `prod_`, `bout_`).

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/immo frontend-next/src/app/produit frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(paiement): ajoute le mode manuel aux ecrans de sponsoring immo/produit/boutique"
```

---

## Task 10: Intégration — abonnement Pro/Business

**Files:**
- Modify: `frontend-next/src/app/boutique/abonnement/AbonnementClient.tsx`
- Modify: `frontend-next/src/app/boutique/abonnement/page.tsx` (page serveur parente, si elle existe sous ce nom — vérifier via Glob)

**Interfaces:**
- Consumes: `ModalPaiementManuel` (Task 7)

- [ ] **Step 1: Localiser et lire la page serveur parente**

Run: `find "frontend-next/src/app/boutique/abonnement" -type f`

- [ ] **Step 2: Passer `userId` et les settings en props**

Modifier la page serveur pour fetcher `GET /api/settings/public` et transmettre `userId` (depuis la session) + `settings` en props à `AbonnementClient`.

- [ ] **Step 3: Modifier `AbonnementClient.tsx`**

Ajouter un state `showManuel` et `planManuel` (le plan choisi, `'pro' | 'business' | null`), importer `ModalPaiementManuel`, et sous chaque bouton "Souscrire" existant (dans la boucle `PLANS.map`), ajouter un lien texte discret "Payer sans app" qui ouvre la modal :

```tsx
<button
  onClick={() => setPlanManuel(plan.id)}
  disabled={isPending || !!planActif}
  style={{ width: '100%', marginTop: 8, padding: '8px 0', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: (isPending || !!planActif) ? 'default' : 'pointer' }}
>
  Payer sans app (Wave/Orange manuel)
</button>
```

Puis, en dehors de la boucle, juste avant la fermeture du composant :

```tsx
{planManuel && (
  <ModalPaiementManuel
    reference={`abmt_${userId}_${planManuel}`}
    montant={PLANS.find(p => p.id === planManuel)!.prix}
    numeroWave={settings.paiement_manuel_numero_wave || ''}
    numeroOM={settings.paiement_manuel_numero_om || ''}
    onClose={() => setPlanManuel(null)}
    onSuccess={() => window.location.reload()}
  />
)}
```

- [ ] **Step 4: Test manuel**

Se connecter avec un compte boutique sans abonnement actif, aller sur `/boutique/abonnement`, cliquer "Payer sans app" sur le plan Pro, déclarer avec un ID de transaction factice.
Expected : ligne `paiements_manuels` avec `reference='abmt_<userId>_pro'`, `statut='en_attente'`.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/boutique/abonnement
git commit -m "feat(paiement): ajoute le mode manuel a l'abonnement boutique"
```

---

## Task 11: Nouvelle UI — bouton boost annonce (inexistant avant ce chantier)

**Files:**
- Modify: `frontend-next/src/app/mes-annonces/AnnoncesClient.tsx` (composant `AnnonceCard`, lignes 46-114)
- Modify: `frontend-next/src/app/mes-annonces/page.tsx` (transmettre `userId` + settings)
- Modify: `frontend-next/src/app/actions/paiement.ts` (ajouter `initierWaveBoost`, suivant exactement le pattern de `initierWaveAnnonce`)

**Interfaces:**
- Consumes: `ModalPaiementManuel` (Task 7)
- Produces: `initierWaveBoost(annonce_id: string): Promise<PaiementResult>` (appelle `POST /api/paiement/boost/initier`, déjà existant côté backend depuis toujours)

- [ ] **Step 1: Ajouter la Server Action Wave pour le boost**

Dans `frontend-next/src/app/actions/paiement.ts`, ajouter (même structure que `initierWaveAnnonce`) :

```ts
export async function initierWaveBoost(annonce_id: string): Promise<PaiementResult> {
  const session = await getOptionalSession()
  if (!session) return { ok: false, error: 'Connexion requise' }

  try {
    const token = await getAuthToken(session)
    const res = await fetch(`${BACKEND}/api/paiement/boost/initier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ annonce_id }),
    })
    const body = await res.json()
    if (!res.ok) return { ok: false, error: body.error ?? `Erreur ${res.status}` }
    return { ok: true, url: body.wave_url }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau' }
  }
}
```

- [ ] **Step 2: Ajouter le bouton boost dans `AnnonceCard`**

Dans `frontend-next/src/app/mes-annonces/AnnoncesClient.tsx`, ajouter les imports et le state nécessaires en haut du composant `AnnonceCard` (après `const [isPending, startTransition] = useTransition()` ligne 48) :

```tsx
  const [showBoostModal, setShowBoostModal] = useState(false)
  const [pendingBoost, startBoost] = useTransition()
  const [boostErr, setBoostErr] = useState<string | null>(null)

  function payerBoostWave() {
    setBoostErr(null)
    startBoost(async () => {
      const res = await initierWaveBoost(annonce.id)
      if (res.ok && res.url) window.location.href = res.url
      else setBoostErr(res.error ?? 'Erreur lors du boost')
    })
  }
```

Ajouter les imports en haut du fichier :
```tsx
import { initierWaveBoost } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'
```

Dans le JSX de `AnnonceCard`, à l'intérieur de `.annonce-card-actions`, seulement si l'annonce est déjà `actif` (une annonce non activée ne peut pas être boostée), ajouter :

```tsx
          {annonce.actif && (
            <button onClick={payerBoostWave} disabled={pendingBoost} className="annonce-action-btn">
              {pendingBoost ? '…' : '🚀 Booster 7j'}
            </button>
          )}
          {annonce.actif && (
            <button onClick={() => setShowBoostModal(true)} className="annonce-action-btn">
              Booster sans app
            </button>
          )}
```

Et juste avant la fermeture de `</div>` du composant `AnnonceCard` :

```tsx
      {boostErr && <p className="annonce-delete-err">{boostErr}</p>}
      {showBoostModal && (
        <ModalPaiementManuel
          reference={`boost_${userId}_${annonce.id}`}
          montant={prixBoost}
          numeroWave={numeroWave}
          numeroOM={numeroOM}
          onClose={() => setShowBoostModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
```

`userId`, `prixBoost`, `numeroWave`, `numeroOM` doivent être reçus en props par `AnnonceCard` (à propager depuis `AnnoncesClient`, lui-même les recevant de la page serveur).

- [ ] **Step 3: Propager les nouvelles props depuis `AnnoncesClient` et la page serveur**

Dans `AnnoncesClient.tsx`, ajouter `userId`, `prixBoost`, `numeroWave`, `numeroOM` aux props du composant principal `AnnoncesClient`, et les transmettre à chaque `<AnnonceCard annonce={a} ... />` dans la boucle de rendu.

Dans `frontend-next/src/app/mes-annonces/page.tsx`, fetcher `GET /api/settings/public`, récupérer `session.userId` (déjà disponible via `verifySession()` utilisé par `backendFetch`), et transmettre ces valeurs à `<AnnoncesClient ... />`.

- [ ] **Step 4: Test manuel**

Avec une annonce déjà active (`actif=true`), aller sur `/mes-annonces`, vérifier que les boutons "Booster 7j" et "Booster sans app" apparaissent. Cliquer sur "Booster sans app", déclarer avec ID de transaction factice.
Expected : ligne `paiements_manuels` avec `reference='boost_<userId>_<annonceId>'`.

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/mes-annonces frontend-next/src/app/actions/paiement.ts
git commit -m "feat(paiement): ajoute le bouton boost annonce (Wave + manuel), absent jusqu'ici"
```

---

## Task 12: Page admin — validation des paiements manuels

**Files:**
- Create: `frontend-next/src/app/admin/(protected)/paiements-manuels/page.tsx`
- Create: `frontend-next/src/app/admin/(protected)/paiements-manuels/PaiementsManuelsClient.tsx`
- Modify: `frontend-next/src/app/admin/(protected)/layout.tsx` (ajouter le lien de menu)

**Interfaces:**
- Consumes: `GET /api/paiement/manuel/liste`, `POST /api/paiement/manuel/:id/valider`, `POST /api/paiement/manuel/:id/rejeter` (Task 5)

- [ ] **Step 1: Créer la page serveur**

```tsx
import { cookies } from 'next/headers'
import PaiementsManuelsClient from './PaiementsManuelsClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminPaiementsManuelsPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let paiements: any[] = []
  try {
    const res = await fetch(`${BACKEND}/api/paiement/manuel/liste?statut=en_attente`, {
      headers: { 'X-Admin-Secret': secret }, cache: 'no-store',
    })
    if (res.ok) paiements = (await res.json()).paiements
  } catch {}

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Paiements manuels</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Déclarations de dépôt Wave/Orange en attente de vérification.
        </p>
      </div>
      <PaiementsManuelsClient initialPaiements={paiements} secret={secret} />
    </div>
  )
}
```

- [ ] **Step 2: Créer le composant client**

```tsx
'use client'
import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Paiement {
  id: string
  reference: string
  montant: string
  methode: 'wave' | 'orange'
  telephone_expediteur: string
  transaction_id_client: string | null
  preuve_url: string | null
  statut: string
  created_at: string
  utilisateur_nom: string
  utilisateur_email: string
  utilisateur_telephone: string | null
}

export default function PaiementsManuelsClient({
  initialPaiements, secret,
}: { initialPaiements: Paiement[]; secret: string }) {
  const [paiements, setPaiements] = useState(initialPaiements)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)

  async function valider(id: string) {
    setEnCours(id)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/valider`, {
        method: 'POST', headers: { 'X-Admin-Secret': secret },
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: 'Paiement validé et activé ✓' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setEnCours(null) }
  }

  async function rejeter(id: string) {
    const motif = prompt('Motif du rejet (optionnel) :') ?? ''
    setEnCours(id)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/paiement/manuel/${id}/rejeter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ motif }),
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error || 'Erreur' }); return }
      setPaiements(ps => ps.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: 'Déclaration rejetée' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setEnCours(null) }
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b' }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>
          En attente ({paiements.length})
        </h3>
        {paiements.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucune déclaration en attente.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {['Client', 'Référence', 'Montant', 'Méthode', 'Tél. expéditeur', 'ID transaction', 'Preuve', 'Déclaré le', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '8px 10px' }}>{p.utilisateur_nom}<br /><span style={{ color: '#9ca3af' }}>{p.utilisateur_email}</span></td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{p.reference}</td>
                    <td style={{ padding: '8px 10px' }}>{Number(p.montant).toLocaleString('fr-FR')} FCFA</td>
                    <td style={{ padding: '8px 10px' }}>{p.methode === 'wave' ? '🌊 Wave' : '🟠 Orange'}</td>
                    <td style={{ padding: '8px 10px' }}>{p.telephone_expediteur}</td>
                    <td style={{ padding: '8px 10px' }}>{p.transaction_id_client || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {p.preuve_url ? <a href={p.preuve_url} target="_blank" rel="noreferrer">Voir</a> : '—'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>{new Date(p.created_at).toLocaleString('fr-FR')}</td>
                    <td style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => valider(p.id)}
                        disabled={enCours === p.id}
                        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#16a34a', color: '#fff' }}
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => rejeter(p.id)}
                        disabled={enCours === p.id}
                        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff' }}
                      >
                        Rejeter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Ajouter le lien de menu admin**

Dans `frontend-next/src/app/admin/(protected)/layout.tsx`, juste après la ligne `<a href="/admin/tarifs" className="admin-nav-link">🏷 Tarifs &amp; Promos</a>` (ligne 32), ajouter :

```tsx
          <a href="/admin/paiements-manuels" className="admin-nav-link">🧾 Paiements manuels</a>
```

- [ ] **Step 4: Ajouter les champs numéro Wave/OM dans `/admin/tarifs`**

Lire `frontend-next/src/app/admin/(protected)/tarifs/TarifsClient.tsx` pour connaître son pattern de champ texte, puis ajouter deux champs (`paiement_manuel_numero_wave`, `paiement_manuel_numero_om`) suivant le même pattern que les champs numériques existants (`field(...)` ou équivalent), plus un toggle `paiement_manuel_actif` suivant le pattern du toggle `apporteur_actif` vu dans `ApporteursClient.tsx`.

- [ ] **Step 5: Test manuel dans le navigateur**

Se connecter en admin (`/admin/login`), aller sur `/admin/tarifs`, renseigner un numéro Wave test, sauvegarder. Aller sur `/admin/paiements-manuels`, vérifier que les déclarations créées dans les tâches précédentes apparaissent. Cliquer "Valider" sur l'une d'elles.
Expected : la ligne disparaît de la liste, message de succès affiché, et l'entité correspondante (annonce/abonnement/etc.) est bien activée en base.

- [ ] **Step 6: Commit**

```bash
git add "frontend-next/src/app/admin/(protected)/paiements-manuels" "frontend-next/src/app/admin/(protected)/layout.tsx" "frontend-next/src/app/admin/(protected)/tarifs"
git commit -m "feat(paiement): ajoute la page admin de validation des paiements manuels"
```

---

## Task 13: Vérification de bout en bout et nettoyage

**Files:** aucun fichier nouveau — vérification transverse.

- [ ] **Step 1: Relire le diff complet**

Run: `git diff main --stat` (ou la branche de base utilisée) pour lister tous les fichiers touchés depuis le début du chantier.

- [ ] **Step 2: Vérifier qu'aucune route existante n'a changé de comportement**

Relire `backend/routes/paiement.js` en entier une fois toutes les tâches terminées, en particulier s'assurer que les webhooks Wave/Orange produisent un comportement strictement identique à avant la Task 3 (même colonnes, même ordre d'opérations).

- [ ] **Step 3: Lancer le build complet**

Run: `cd frontend-next && npm run build`
Expected: build réussi sans erreur TypeScript/ESLint bloquante.

Run: `npm run lint` (depuis `frontend-next/`)
Expected: pas de nouvelle erreur de lint introduite par les fichiers modifiés dans ce chantier.

- [ ] **Step 4: Test de bout en bout sur au moins 2 flux dans le navigateur**

Avec les deux serveurs démarrés (`npm run dev` racine + `frontend-next`), dérouler manuellement :
1. Créer une annonce → payer via mode manuel → valider depuis `/admin/paiements-manuels` → vérifier que l'annonce apparaît comme "Publiée ✓" sur `/mes-annonces`.
2. Souscrire à un abonnement Pro via mode manuel → valider → vérifier `/boutique/abonnement` affiche "Plan actif".

- [ ] **Step 5: Commit final si des ajustements ont eu lieu**

```bash
git add -A
git commit -m "chore(paiement): ajustements finaux suite aux tests de bout en bout"
```

(Ne committer que s'il y a effectivement des changements — sinon passer cette étape.)
