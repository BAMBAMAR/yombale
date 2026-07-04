# Programme apporteur d'affaires — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully parameterized affiliate/referral program for Nopalou where "apporteurs d'affaires" (business referrers) recruit boutiques, earn a recurring commission on their subscription payments, and track it themselves — all rates/thresholds/toggles configurable from admin without redeploy.

**Architecture:** Reuses the existing JWT auth (`utilisateurs` table gets an `est_apporteur` flag + `code_apporteur`), the existing `settings` key-value config system (`backend/lib/settingsCache.js`) for all tunable parameters, and hooks into the existing Wave/Orange subscription webhooks in `backend/routes/paiement.js` to generate commission rows. Attribution of a boutique to an apporteur happens via a manual/pre-filled code field on the boutique creation form (server-component `searchParams` reads `?apporteur=CODE`, no changes to `middleware.ts`/CSP) plus an admin correction endpoint.

**Tech Stack:** Express + `pg` (backend), Next.js 14 App Router + Server Actions (frontend), PostgreSQL.

## Global Constraints

- All new settings keys MUST be added to `DEFAULTS` in `backend/lib/settingsCache.js` — the `PUT /api/settings` route (`backend/routes/settings.js:17`) filters incoming keys against `Object.keys(s.DEFAULTS)`, so any key missing from `DEFAULTS` is silently rejected.
- Auth for user-facing routes: `verifierToken` middleware sets `req.user.userId` (NOT `req.user.id`, NOT `req.usuario`) — see `backend/middlewares/auth.js:12-24`.
- Auth for admin routes: `adminSecretOnly` middleware, header `X-Admin-Secret` — see `backend/middlewares/auth.js:48-54`.
- Migrations are idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ADD COLUMN IF NOT EXISTS` blocks appended to `backend/migrate-inline.js`, each wrapped in its own `try/catch` with `console.warn` on failure — follow the existing pattern (see lines 300-320, 414-432 for examples), do not throw on failure.
- Money fields in `abonnements.prix_mensuel` and `commissions_apporteur.montant` are `NUMERIC(10,2)` — always pass JS numbers, not strings, to avoid implicit cast surprises.
- Commission amount is computed and stored at insert time (frozen); changing `apporteur_taux_commission` later must NOT retroactively alter existing `commissions_apporteur.montant` rows.
- No automatic payout (Wave/Orange payout API) — settlement is a manual admin action (`PUT .../payer`) that just flips a status column.
- No QR-per-apporteur, no automatic tiered commissions, no auto notifications — explicitly out of scope per the spec (`docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md`).
- **Deviation from spec:** the spec called for a 30-day cookie set by `middleware.ts` to extend attribution beyond a single visit. This plan implements the simpler, safer subset instead — reading `?apporteur=CODE` directly via `searchParams` on the boutique creation page, pre-filling a form field the user submits once. This avoids touching the CSP-nonce-sensitive `middleware.ts` (a shared, security-critical file) for a first version. The `apporteur_cookie_jours` setting is still added to the schema (Task 2) for forward compatibility, but nothing reads it yet — a follow-up plan can wire up the actual cookie behavior later if drop-off between click and signup proves to be a real problem in practice.

---

## File Structure

| File | Responsibility |
|---|---|
| `backend/migrate-inline.js` (append) | New columns on `utilisateurs`/`boutiques`, new `commissions_apporteur` table |
| `backend/lib/settingsCache.js` (modify `DEFAULTS`) | 4 new settings keys with defaults |
| `backend/routes/apporteurs.js` (new) | All apporteur routes (become/stats/admin list/admin pay/admin attribute) |
| `backend/routes/boutiques.js` (modify `POST /`) | Accept `code_apporteur` field, resolve to `apporteur_id`, attach to new boutique |
| `backend/routes/paiement.js` (modify both webhooks) | After subscription activation, insert a commission row if the boutique has an `apporteur_id` |
| `backend/app.js` (modify) | Mount `/api/apporteurs` router |
| `frontend-next/src/app/compte/apporteur/page.tsx` (new) | Server component: fetch stats, render `ApporteurClient` |
| `frontend-next/src/app/compte/apporteur/ApporteurClient.tsx` (new) | Client component: "become apporteur" button / stats display |
| `frontend-next/src/app/compte/apporteur/actions.ts` (new) | Server actions: `devenirApporteur`, `getMesStatsApporteur` |
| `frontend-next/src/app/compte/page.tsx` (modify) | Add "Programme apporteur" menu entry |
| `frontend-next/src/app/boutique/page.tsx` (modify) | Read `?apporteur=CODE` from `searchParams`, pass to `BoutiqueClient` |
| `frontend-next/src/app/boutique/BoutiqueClient.tsx` (modify) | Accept `codeApporteurDefaut` prop, add pre-filled input field in `BoutiqueForm` |
| `frontend-next/src/app/admin/(protected)/apporteurs/page.tsx` (new) | Server component: fetch settings + apporteurs + commissions |
| `frontend-next/src/app/admin/(protected)/apporteurs/ApporteursClient.tsx` (new) | Client component: config form + tables + pay button |

---

### Task 1: Database schema — apporteur columns and commission table

**Files:**
- Modify: `backend/migrate-inline.js` (append new block after the `abonnements` table block, i.e. after line ~432 where `console.log('[MIGRATE] ✅ Table abonnements OK');` appears)
- Test: manual verification via `psql` or a throwaway script (no automated migration test harness exists in this codebase)

**Interfaces:**
- Produces: columns `utilisateurs.est_apporteur` (BOOLEAN), `utilisateurs.code_apporteur` (VARCHAR(20), unique when not null), `boutiques.apporteur_id` (UUID FK to `utilisateurs.id`), table `commissions_apporteur(id, apporteur_id, boutique_id, abonnement_id, montant, statut, created_at, paye_at)`.

- [ ] **Step 1: Locate the insertion point**

Open `backend/migrate-inline.js` and find this exact block (around line 414-432):

```js
  // Table abonnements (plans Pro/Business pour les boutiques)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abonnements (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        plan           VARCHAR(20) NOT NULL CHECK (plan IN ('pro', 'business')),
        statut         VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'expire', 'annule')),
        prix_mensuel   NUMERIC(10,2) NOT NULL,
        debut          TIMESTAMPTZ DEFAULT NOW(),
        fin            TIMESTAMPTZ NOT NULL,
        commande_ref   VARCHAR(100),
        created_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_abonnements_user   ON abonnements(utilisateur_id, statut);
      CREATE INDEX IF NOT EXISTS idx_abonnements_fin    ON abonnements(fin) WHERE statut = 'actif';
    `);
    console.log('[MIGRATE] ✅ Table abonnements OK');
  } catch (e) { console.warn('[MIGRATE] abonnements:', e.message); }
```

Insert the new block immediately after this `catch` line.

- [ ] **Step 2: Add the apporteur migration block**

Insert this exact code after the `abonnements` block found in Step 1:

```js
  // Programme apporteur d'affaires — colonnes + table de commissions
  const colonnesApporteur = [
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS est_apporteur BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS code_apporteur VARCHAR(20)`,
    `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS apporteur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL`,
  ];
  for (const sql of colonnesApporteur) {
    try { await pool.query(sql); }
    catch (e) { console.warn('[MIGRATE] colonne apporteur:', e.message); }
  }
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uidx_utilisateurs_code_apporteur ON utilisateurs(code_apporteur) WHERE code_apporteur IS NOT NULL`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_boutiques_apporteur ON boutiques(apporteur_id)`);
    console.log('[MIGRATE] ✅ Colonnes apporteur OK');
  } catch (e) { console.warn('[MIGRATE] index apporteur:', e.message); }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commissions_apporteur (
        id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        apporteur_id   UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
        boutique_id    UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
        abonnement_id  UUID REFERENCES abonnements(id) ON DELETE SET NULL,
        montant        NUMERIC(10,2) NOT NULL,
        statut         VARCHAR(20) DEFAULT 'du' CHECK (statut IN ('du', 'paye')),
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        paye_at        TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_commissions_apporteur ON commissions_apporteur(apporteur_id, statut);
    `);
    console.log('[MIGRATE] ✅ Table commissions_apporteur OK');
  } catch (e) { console.warn('[MIGRATE] commissions_apporteur:', e.message); }
```

- [ ] **Step 3: Run the migration locally**

Run: `node -e "require('./backend/migrate-inline.js')()"`

(Check `backend/migrate-inline.js` bottom export — if it exports a named function like `module.exports = migrate;` adjust the invocation accordingly; otherwise start the backend normally with `npm run dev` from repo root, since migration runs automatically on startup.)

Expected: console output includes `[MIGRATE] ✅ Colonnes apporteur OK` and `[MIGRATE] ✅ Table commissions_apporteur OK`, no `[MIGRATE] ❌` lines.

- [ ] **Step 4: Verify schema in psql**

Run: `psql $DATABASE_URL -c "\d commissions_apporteur"` and `psql $DATABASE_URL -c "\d boutiques" | grep apporteur`

Expected: `commissions_apporteur` table listed with all 8 columns; `boutiques` shows `apporteur_id` column.

- [ ] **Step 5: Commit**

```bash
git add backend/migrate-inline.js
git commit -m "feat(db): ajoute le schéma du programme apporteur d'affaires"
```

---

### Task 2: Settings — add configurable apporteur parameters

**Files:**
- Modify: `backend/lib/settingsCache.js:9-27` (the `DEFAULTS` object)

**Interfaces:**
- Consumes: nothing new
- Produces: `settingsCache.getBool('apporteur_actif')`, `settingsCache.getNum('apporteur_taux_commission')`, `settingsCache.getNum('apporteur_seuil_paiement')`, `settingsCache.getNum('apporteur_cookie_jours')` — all usable by later tasks via `require('../lib/settingsCache')`.

- [ ] **Step 1: Add the new keys to DEFAULTS**

In `backend/lib/settingsCache.js`, modify the `DEFAULTS` object (currently lines 9-27) to add these four lines right before the closing `};`:

```js
  apporteur_actif:            'true',
  apporteur_taux_commission:  '10',
  apporteur_seuil_paiement:   '3000',
  apporteur_cookie_jours:     '30',
```

The full object should read:

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

- [ ] **Step 2: Verify via node REPL**

Run: `node -e "const s=require('./backend/lib/settingsCache'); s.getNum('apporteur_taux_commission').then(console.log)"`

Expected output: `10`

- [ ] **Step 3: Verify the admin settings route accepts the new keys**

Start the backend (`npm run dev` from repo root) and run:

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{"apporteur_taux_commission":"12"}'
```

Expected: `200 OK`, JSON response `{"updated":{"apporteur_taux_commission":"12"}}` (not an error about invalid keys).

- [ ] **Step 4: Reset the value back to default for consistency**

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -d '{"apporteur_taux_commission":"10"}'
```

- [ ] **Step 5: Commit**

```bash
git add backend/lib/settingsCache.js
git commit -m "feat(settings): ajoute les paramètres du programme apporteur"
```

---

### Task 3: Backend — `backend/routes/apporteurs.js` (become + stats + admin list)

**Files:**
- Create: `backend/routes/apporteurs.js`
- Modify: `backend/app.js` (mount the router)

**Interfaces:**
- Consumes: `settingsCache.getBool`, `settingsCache.getNum` (Task 2), `pool` from `../models/db`, `verifierToken`/`adminSecretOnly` from `../middlewares/auth`.
- Produces: `POST /api/apporteurs/devenir`, `GET /api/apporteurs/mes-stats`, `GET /api/apporteurs/admin` — consumed by Task 5 (frontend) and Task 4 (payment webhook doesn't call these, but boutiques.js in Task 6 needs the code-resolution logic pattern established here).

- [ ] **Step 1: Create the file with the code generator and "devenir" route**

Create `backend/routes/apporteurs.js`:

```js
const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const settingsCache = require('../lib/settingsCache');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas de 0/O/1/I pour lisibilité

function genererCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}

async function genererCodeUnique() {
  for (let tentative = 0; tentative < 10; tentative++) {
    const code = genererCode();
    const { rows } = await pool.query('SELECT id FROM utilisateurs WHERE code_apporteur=$1', [code]);
    if (!rows[0]) return code;
  }
  throw new Error('Impossible de générer un code apporteur unique');
}

// POST /api/apporteurs/devenir — active le statut apporteur pour l'utilisateur connecté
router.post('/devenir', verifierToken, async (req, res) => {
  try {
    const actif = await settingsCache.getBool('apporteur_actif');
    if (!actif) return res.status(403).json({ error: 'Le programme apporteur d\'affaires n\'est pas actif actuellement.' });

    const userId = req.user.userId;
    const existing = await pool.query('SELECT est_apporteur, code_apporteur FROM utilisateurs WHERE id=$1', [userId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (existing.rows[0].est_apporteur && existing.rows[0].code_apporteur) {
      return res.json({ success: true, code_apporteur: existing.rows[0].code_apporteur, deja_apporteur: true });
    }

    const code = await genererCodeUnique();
    await pool.query('UPDATE utilisateurs SET est_apporteur=true, code_apporteur=$1 WHERE id=$2', [code, userId]);
    res.json({ success: true, code_apporteur: code, deja_apporteur: false });
  } catch (err) {
    console.error('[APPORTEURS DEVENIR]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Mount the router in app.js**

In `backend/app.js`, find this line (around line 160):

```js
app.use('/api/settings',        require('./routes/settings'));
```

Add immediately after it:

```js
app.use('/api/apporteurs',      require('./routes/apporteurs'));
```

- [ ] **Step 3: Manual test — become an apporteur**

Start backend, then get a valid JWT for a test user (via existing login flow), and run:

```bash
curl -X POST http://localhost:3000/api/apporteurs/devenir \
  -H "Authorization: Bearer <TOKEN>"
```

Expected: `200 OK`, `{"success":true,"code_apporteur":"XXXXXX","deja_apporteur":false}` — a 6-character code from the `ALPHABET` set.

- [ ] **Step 4: Manual test — idempotency**

Run the exact same curl command again.

Expected: `200 OK`, `{"success":true,"code_apporteur":"XXXXXX","deja_apporteur":true}` — same code as Step 3, not a new one.

- [ ] **Step 5: Add `GET /api/apporteurs/mes-stats`**

Append to `backend/routes/apporteurs.js`, before `module.exports = router;`:

```js
// GET /api/apporteurs/mes-stats — recrutements et commissions de l'apporteur connecté
router.get('/mes-stats', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await pool.query('SELECT est_apporteur, code_apporteur FROM utilisateurs WHERE id=$1', [userId]);
    if (!user.rows[0]?.est_apporteur) {
      return res.status(403).json({ error: 'Vous n\'êtes pas encore apporteur d\'affaires.' });
    }

    const boutiques = await pool.query(
      `SELECT b.id, b.nom, a.plan, a.statut AS abonnement_statut
       FROM boutiques b
       LEFT JOIN abonnements a ON a.utilisateur_id = b.utilisateur_id AND a.statut='actif' AND a.fin > NOW()
       WHERE b.apporteur_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    const totaux = await pool.query(
      `SELECT
         COALESCE(SUM(montant) FILTER (WHERE statut='du'), 0)   AS total_du,
         COALESCE(SUM(montant) FILTER (WHERE statut='paye'), 0) AS total_paye
       FROM commissions_apporteur WHERE apporteur_id=$1`,
      [userId]
    );

    const taux = await settingsCache.getNum('apporteur_taux_commission');
    const seuil = await settingsCache.getNum('apporteur_seuil_paiement');

    res.json({
      code_apporteur: user.rows[0].code_apporteur,
      boutiques: boutiques.rows,
      total_du: Number(totaux.rows[0].total_du),
      total_paye: Number(totaux.rows[0].total_paye),
      taux_commission: taux,
      seuil_paiement: seuil,
    });
  } catch (err) {
    console.error('[APPORTEURS MES-STATS]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

- [ ] **Step 6: Manual test — stats for a non-apporteur**

```bash
curl http://localhost:3000/api/apporteurs/mes-stats -H "Authorization: Bearer <TOKEN_NON_APPORTEUR>"
```

Expected: `403`, `{"error":"Vous n'êtes pas encore apporteur d'affaires."}`

- [ ] **Step 7: Manual test — stats for the apporteur created in Step 3**

```bash
curl http://localhost:3000/api/apporteurs/mes-stats -H "Authorization: Bearer <TOKEN>"
```

Expected: `200 OK`, JSON with `code_apporteur` matching Step 3's code, `boutiques: []`, `total_du: 0`, `total_paye: 0`, `taux_commission: 10`, `seuil_paiement: 3000`.

- [ ] **Step 8: Add admin list route**

Append to `backend/routes/apporteurs.js`, before `module.exports = router;`:

```js
// GET /api/apporteurs/admin — vue d'ensemble de tous les apporteurs (admin)
router.get('/admin', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.nom, u.email, u.code_apporteur,
             COUNT(b.id) AS nb_boutiques,
             COALESCE(SUM(c.montant) FILTER (WHERE c.statut='du'), 0)   AS total_du,
             COALESCE(SUM(c.montant) FILTER (WHERE c.statut='paye'), 0) AS total_paye
      FROM utilisateurs u
      LEFT JOIN boutiques b ON b.apporteur_id = u.id
      LEFT JOIN commissions_apporteur c ON c.apporteur_id = u.id
      WHERE u.est_apporteur = true
      GROUP BY u.id, u.nom, u.email, u.code_apporteur
      ORDER BY total_du DESC
    `);
    res.json({ apporteurs: rows });
  } catch (err) {
    console.error('[APPORTEURS ADMIN]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
```

(Note: this replaces the earlier `module.exports = router;` from Step 1 — make sure there's only one `module.exports` line at the end of the file.)

- [ ] **Step 9: Manual test — admin list**

```bash
curl http://localhost:3000/api/apporteurs/admin -H "X-Admin-Secret: $ADMIN_SECRET"
```

Expected: `200 OK`, `{"apporteurs":[{...,"code_apporteur":"XXXXXX","nb_boutiques":"0","total_du":"0","total_paye":"0"}]}` including the test user from Step 3.

- [ ] **Step 10: Commit**

```bash
git add backend/routes/apporteurs.js backend/app.js
git commit -m "feat(api): ajoute les routes apporteur (devenir, mes-stats, admin list)"
```

---

### Task 4: Backend — commission generation in payment webhooks

**Files:**
- Modify: `backend/routes/paiement.js` (Wave webhook block around lines 129-152, Orange webhook block around lines 384-402)

**Interfaces:**
- Consumes: `settingsCache.getBool('apporteur_actif')`, `settingsCache.getNum('apporteur_taux_commission')` (Task 2); table `commissions_apporteur`, `boutiques.apporteur_id` (Task 1).
- Produces: rows in `commissions_apporteur` — consumed by Task 3's `/mes-stats` (already written) and Task 6 (admin commissions list/pay).

- [ ] **Step 1: Confirm `settingsCache` is already required in paiement.js**

Read `backend/routes/paiement.js` lines 1-10. It should already have something like `const getPrix = ...` using a settings helper — check whether it imports `settingsCache` directly or via a local alias `cfg`. If `settingsCache` (or an equivalent alias) is not imported, add near the top of the file:

```js
const settingsCache = require('../lib/settingsCache');
```

(If an alias like `cfg` already points to `../lib/settingsCache`, reuse that alias instead of adding a duplicate import — check for `require('../lib/settingsCache')` anywhere in the file first with a search before adding.)

- [ ] **Step 2: Add commission logic to the Wave webhook**

In `backend/routes/paiement.js`, find this exact block (around line 129-152):

```js
    // Abonnement Boutique Pro/Business : ref = abmt_userId_plan
    if (ref && ref.startsWith('abmt_')) {
      const parts = ref.split('_');
      const userId = parts[1];
      const plan   = parts[2];
      const pxAbmt = await getPrix();
      const PRIX   = { pro: pxAbmt.pro, business: pxAbmt.business };
      if (userId && plan && PRIX[plan]) {
        const fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
           VALUES ($1,$2,'actif',$3,$4,$5)
           ON CONFLICT DO NOTHING`,
          [userId, plan, PRIX[plan], fin, ref]
        );
        // Boutiques Business → commission dynamique
        if (plan === 'business') {
          await pool.query(
            'UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2',
            [pxAbmt.commissionBiz, userId]
          );
        }
      }
    }
```

Replace it with (adds the apporteur commission block right after the existing subscription insert):

```js
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
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [userId, plan, PRIX[plan], fin, ref]
        );
        // Boutiques Business → commission dynamique
        if (plan === 'business') {
          await pool.query(
            'UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2',
            [pxAbmt.commissionBiz, userId]
          );
        }
        // Programme apporteur d'affaires : commission si la boutique a un apporteur attribué
        try {
          const apporteurActif = await settingsCache.getBool('apporteur_actif');
          if (apporteurActif) {
            const boutiqueApporteur = await pool.query(
              'SELECT id, apporteur_id FROM boutiques WHERE utilisateur_id=$1 AND apporteur_id IS NOT NULL LIMIT 1',
              [userId]
            );
            if (boutiqueApporteur.rows[0]) {
              const taux = await settingsCache.getNum('apporteur_taux_commission');
              const montantCommission = Number(PRIX[plan]) * (taux / 100);
              await pool.query(
                `INSERT INTO commissions_apporteur (apporteur_id, boutique_id, abonnement_id, montant)
                 VALUES ($1,$2,$3,$4)`,
                [boutiqueApporteur.rows[0].apporteur_id, boutiqueApporteur.rows[0].id, abonnementRow.rows[0]?.id || null, montantCommission]
              );
            }
          }
        } catch (commErr) {
          console.error('[WAVE WEBHOOK] commission apporteur:', commErr.message);
        }
      }
    }
```

- [ ] **Step 3: Apply the equivalent change to the Orange webhook**

In `backend/routes/paiement.js`, find this exact block (around line 384-402):

```js
    // Abonnement Pro/Business (Orange)
    if (order_id?.startsWith('abmt_')) {
      const parts  = order_id.split('_');
      const userId = parts[1];
      const plan   = parts[2];
      const pxO    = await getPrix();
      const PRIX   = { pro: pxO.pro, business: pxO.business };
      if (userId && plan && PRIX[plan]) {
        const fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await pool.query(
          `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
           VALUES ($1,$2,'actif',$3,$4,$5)
           ON CONFLICT DO NOTHING`,
          [userId, plan, PRIX[plan], fin, order_id]
        );
        if (plan === 'business') {
          await pool.query('UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2', [pxO.commissionBiz, userId]);
        }
      }
    }
```

Replace it with:

```js
    // Abonnement Pro/Business (Orange)
    if (order_id?.startsWith('abmt_')) {
      const parts  = order_id.split('_');
      const userId = parts[1];
      const plan   = parts[2];
      const pxO    = await getPrix();
      const PRIX   = { pro: pxO.pro, business: pxO.business };
      if (userId && plan && PRIX[plan]) {
        const fin = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const abonnementRow = await pool.query(
          `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
           VALUES ($1,$2,'actif',$3,$4,$5)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [userId, plan, PRIX[plan], fin, order_id]
        );
        if (plan === 'business') {
          await pool.query('UPDATE boutiques SET commission_rate=$1 WHERE utilisateur_id=$2', [pxO.commissionBiz, userId]);
        }
        try {
          const apporteurActif = await settingsCache.getBool('apporteur_actif');
          if (apporteurActif) {
            const boutiqueApporteur = await pool.query(
              'SELECT id, apporteur_id FROM boutiques WHERE utilisateur_id=$1 AND apporteur_id IS NOT NULL LIMIT 1',
              [userId]
            );
            if (boutiqueApporteur.rows[0]) {
              const taux = await settingsCache.getNum('apporteur_taux_commission');
              const montantCommission = Number(PRIX[plan]) * (taux / 100);
              await pool.query(
                `INSERT INTO commissions_apporteur (apporteur_id, boutique_id, abonnement_id, montant)
                 VALUES ($1,$2,$3,$4)`,
                [boutiqueApporteur.rows[0].apporteur_id, boutiqueApporteur.rows[0].id, abonnementRow.rows[0]?.id || null, montantCommission]
              );
            }
          }
        } catch (commErr) {
          console.error('[ORANGE WEBHOOK] commission apporteur:', commErr.message);
        }
      }
    }
```

- [ ] **Step 4: Manual test — simulate the commission flow end-to-end**

Given the webhooks require valid HMAC signatures from Wave/Orange (hard to forge locally), test the SQL logic directly via a scratch script instead. Create a temporary test (do NOT commit this file — delete it after Step 5) at `backend/scratch-test-commission.js`:

```js
const { pool } = require('./models/db');
const settingsCache = require('./lib/settingsCache');

(async () => {
  // Setup: reuse the apporteur created in Task 3 Step 3, and any existing boutique with a utilisateur_id
  const apporteur = await pool.query("SELECT id FROM utilisateurs WHERE est_apporteur=true LIMIT 1");
  const boutique = await pool.query("SELECT id, utilisateur_id FROM boutiques LIMIT 1");
  if (!apporteur.rows[0] || !boutique.rows[0]) {
    console.log('SKIP: need at least one apporteur and one boutique in DB to test');
    process.exit(0);
  }

  await pool.query('UPDATE boutiques SET apporteur_id=$1 WHERE id=$2', [apporteur.rows[0].id, boutique.rows[0].id]);

  const taux = await settingsCache.getNum('apporteur_taux_commission');
  const montant = 15000 * (taux / 100);
  const result = await pool.query(
    `INSERT INTO commissions_apporteur (apporteur_id, boutique_id, montant) VALUES ($1,$2,$3) RETURNING *`,
    [apporteur.rows[0].id, boutique.rows[0].id, montant]
  );
  console.log('Commission créée:', result.rows[0]);
  process.exit(0);
})();
```

Run: `node backend/scratch-test-commission.js`

Expected: `Commission créée: { id: ..., apporteur_id: ..., boutique_id: ..., montant: '1500.00', statut: 'du', ... }` (1500.00 = 15000 * 10%)

Delete the scratch file after confirming: `rm backend/scratch-test-commission.js`

- [ ] **Step 5: Commit**

```bash
git add backend/routes/paiement.js
git commit -m "feat(paiement): génère une commission apporteur à chaque paiement d'abonnement encaissé"
```

---

### Task 5: Backend — boutique creation accepts `code_apporteur`

**Files:**
- Modify: `backend/routes/boutiques.js:358-414` (the `POST /` route)

**Interfaces:**
- Consumes: `req.body.code_apporteur` (optional string from multipart form)
- Produces: `boutiques.apporteur_id` set at creation time — consumed by Task 4 (commission trigger reads this column).

- [ ] **Step 1: Add code resolution to the POST / route**

In `backend/routes/boutiques.js`, find this exact block (around line 391-398):

```js
    // INSERT avec colonnes de base (toujours présentes)
    const r = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, description, categorie, telephone, adresse, ville, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [userId, nom.trim(), description||null, categorie||null, telephone||null,
       adresse||null, ville||'Dakar', logo_url]
    );
    const newId = r.rows[0].id;
```

Replace it with:

```js
    // Résoudre le code apporteur (optionnel) en apporteur_id
    let apporteurId = null;
    const codeApporteur = req.body.code_apporteur?.trim().toUpperCase();
    if (codeApporteur) {
      const apporteurRow = await pool.query(
        'SELECT id FROM utilisateurs WHERE code_apporteur=$1 AND est_apporteur=true',
        [codeApporteur]
      );
      if (apporteurRow.rows[0]) apporteurId = apporteurRow.rows[0].id;
    }

    // INSERT avec colonnes de base (toujours présentes)
    const r = await pool.query(
      `INSERT INTO boutiques (utilisateur_id, nom, description, categorie, telephone, adresse, ville, logo_url, apporteur_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [userId, nom.trim(), description||null, categorie||null, telephone||null,
       adresse||null, ville||'Dakar', logo_url, apporteurId]
    );
    const newId = r.rows[0].id;
```

- [ ] **Step 2: Manual test — create a boutique with a valid apporteur code**

Using the code from Task 3 Step 3 (call it `CODE123` for this example — substitute the real generated code):

```bash
curl -X POST http://localhost:3000/api/boutiques \
  -H "Authorization: Bearer <TOKEN_AUTRE_UTILISATEUR>" \
  -F "nom=Boutique Test Apporteur" \
  -F "code_apporteur=CODE123"
```

Expected: `201`, `{"success":true,"id":"<uuid>"}`

- [ ] **Step 3: Verify apporteur_id was set**

```bash
psql $DATABASE_URL -c "SELECT id, nom, apporteur_id FROM boutiques WHERE nom='Boutique Test Apporteur'"
```

Expected: `apporteur_id` column populated with the apporteur's user id (not NULL).

- [ ] **Step 4: Manual test — create a boutique with an invalid/absent code (must not fail)**

```bash
curl -X POST http://localhost:3000/api/boutiques \
  -H "Authorization: Bearer <TOKEN>" \
  -F "nom=Boutique Sans Apporteur" \
  -F "code_apporteur=INVALIDXX"
```

Expected: `201`, boutique created successfully. Then verify `apporteur_id IS NULL` for this boutique — an invalid code must not block creation.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/boutiques.js
git commit -m "feat(boutiques): attache la boutique à un apporteur via code_apporteur optionnel"
```

---

### Task 6: Backend — admin commission settlement routes

**Files:**
- Modify: `backend/routes/apporteurs.js` (append routes)

**Interfaces:**
- Consumes: `commissions_apporteur` table (Task 1), `settingsCache.getNum('apporteur_seuil_paiement')` (Task 2).
- Produces: `GET /api/apporteurs/admin/commissions`, `PUT /api/apporteurs/admin/commissions/:id/payer`, `PUT /api/apporteurs/admin/boutiques/:id/attribuer` — consumed by Task 8 (admin frontend).

- [ ] **Step 1: Add `GET /api/apporteurs/admin/commissions`**

In `backend/routes/apporteurs.js`, insert this route before the final `module.exports = router;` line:

```js
// GET /api/apporteurs/admin/commissions — toutes les lignes de commission (admin)
router.get('/admin/commissions', adminSecretOnly, async (req, res) => {
  try {
    const statutFiltre = req.query.statut; // 'du' | 'paye' | undefined
    const params = [];
    let where = '';
    if (statutFiltre === 'du' || statutFiltre === 'paye') {
      params.push(statutFiltre);
      where = 'WHERE c.statut = $1';
    }

    const { rows } = await pool.query(`
      SELECT c.id, c.montant, c.statut, c.created_at, c.paye_at,
             u.nom AS apporteur_nom, u.code_apporteur,
             b.nom AS boutique_nom,
             (SELECT COALESCE(SUM(montant),0) FROM commissions_apporteur WHERE apporteur_id = u.id AND statut='du') AS cumul_du_apporteur
      FROM commissions_apporteur c
      JOIN utilisateurs u ON u.id = c.apporteur_id
      JOIN boutiques b ON b.id = c.boutique_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT 500
    `, params);

    const seuil = await settingsCache.getNum('apporteur_seuil_paiement');
    const enrichi = rows.map(r => ({
      ...r,
      seuil_atteint: Number(r.cumul_du_apporteur) >= seuil,
    }));

    res.json({ commissions: enrichi, seuil_paiement: seuil });
  } catch (err) {
    console.error('[APPORTEURS ADMIN COMMISSIONS]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

- [ ] **Step 2: Add `PUT /api/apporteurs/admin/commissions/:id/payer`**

Insert immediately after the route from Step 1:

```js
// PUT /api/apporteurs/admin/commissions/:id/payer — marquer une commission comme payée (admin)
router.put('/admin/commissions/:id/payer', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const ignorerSeuil = req.body?.ignorer_seuil === true;

    const ligne = await pool.query('SELECT id, apporteur_id, statut FROM commissions_apporteur WHERE id=$1', [id]);
    if (!ligne.rows[0]) return res.status(404).json({ error: 'Commission introuvable' });
    if (ligne.rows[0].statut === 'paye') return res.status(409).json({ error: 'Cette commission est déjà payée' });

    if (!ignorerSeuil) {
      const cumul = await pool.query(
        `SELECT COALESCE(SUM(montant),0) AS total FROM commissions_apporteur WHERE apporteur_id=$1 AND statut='du'`,
        [ligne.rows[0].apporteur_id]
      );
      const seuil = await settingsCache.getNum('apporteur_seuil_paiement');
      if (Number(cumul.rows[0].total) < seuil) {
        return res.status(422).json({
          error: `Le cumul dû (${cumul.rows[0].total} FCFA) est sous le seuil de règlement (${seuil} FCFA). Utilisez ignorer_seuil pour forcer.`,
        });
      }
    }

    const { rows } = await pool.query(
      `UPDATE commissions_apporteur SET statut='paye', paye_at=NOW() WHERE id=$1 RETURNING *`,
      [id]
    );
    res.json({ success: true, commission: rows[0] });
  } catch (err) {
    console.error('[APPORTEURS PAYER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

- [ ] **Step 3: Add `PUT /api/apporteurs/admin/boutiques/:id/attribuer`**

Insert immediately after the route from Step 2, before `module.exports = router;`:

```js
// PUT /api/apporteurs/admin/boutiques/:id/attribuer — attribution manuelle boutique <-> apporteur (admin)
router.put('/admin/boutiques/:id/attribuer', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { code_apporteur, apporteur_id } = req.body;

    const boutique = await pool.query('SELECT id FROM boutiques WHERE id=$1', [id]);
    if (!boutique.rows[0]) return res.status(404).json({ error: 'Boutique introuvable' });

    if (apporteur_id === null) {
      await pool.query('UPDATE boutiques SET apporteur_id=NULL WHERE id=$1', [id]);
      return res.json({ success: true, apporteur_id: null });
    }

    if (!code_apporteur) return res.status(400).json({ error: 'code_apporteur ou apporteur_id: null requis' });

    const apporteur = await pool.query(
      'SELECT id FROM utilisateurs WHERE code_apporteur=$1 AND est_apporteur=true',
      [code_apporteur.trim().toUpperCase()]
    );
    if (!apporteur.rows[0]) return res.status(404).json({ error: 'Code apporteur introuvable' });

    await pool.query('UPDATE boutiques SET apporteur_id=$1 WHERE id=$2', [apporteur.rows[0].id, id]);
    res.json({ success: true, apporteur_id: apporteur.rows[0].id });
  } catch (err) {
    console.error('[APPORTEURS ATTRIBUER]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

- [ ] **Step 4: Manual test — commissions list**

Using the commission created in Task 4 Step 4:

```bash
curl http://localhost:3000/api/apporteurs/admin/commissions -H "X-Admin-Secret: $ADMIN_SECRET"
```

Expected: `200 OK`, `{"commissions":[{...,"montant":"1500.00","statut":"du","seuil_atteint":false,...}],"seuil_paiement":3000}` — `seuil_atteint: false` since 1500 < 3000 default threshold.

- [ ] **Step 5: Manual test — pay attempt blocked by threshold**

```bash
curl -X PUT http://localhost:3000/api/apporteurs/admin/commissions/<ID>/payer -H "X-Admin-Secret: $ADMIN_SECRET"
```

Expected: `422`, error message mentioning the threshold.

- [ ] **Step 6: Manual test — pay attempt forced**

```bash
curl -X PUT http://localhost:3000/api/apporteurs/admin/commissions/<ID>/payer \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"ignorer_seuil":true}'
```

Expected: `200 OK`, `{"success":true,"commission":{...,"statut":"paye","paye_at":"..."}}`

- [ ] **Step 7: Manual test — double-pay rejected**

Run the exact same command from Step 6 again.

Expected: `409`, `{"error":"Cette commission est déjà payée"}`

- [ ] **Step 8: Commit**

```bash
git add backend/routes/apporteurs.js
git commit -m "feat(api): ajoute le règlement des commissions et l'attribution manuelle (admin)"
```

---

### Task 7: Frontend — `/compte/apporteur` page

**Files:**
- Create: `frontend-next/src/app/compte/apporteur/actions.ts`
- Create: `frontend-next/src/app/compte/apporteur/page.tsx`
- Create: `frontend-next/src/app/compte/apporteur/ApporteurClient.tsx`
- Modify: `frontend-next/src/app/compte/page.tsx` (add menu entry)

**Interfaces:**
- Consumes: `backendFetch` from `@/lib/backend-fetch` (existing helper, see Global Constraints), `POST /api/apporteurs/devenir` and `GET /api/apporteurs/mes-stats` (Task 3).
- Produces: nothing consumed by later tasks (leaf feature).

- [ ] **Step 1: Create the server actions file**

Create `frontend-next/src/app/compte/apporteur/actions.ts`:

```ts
'use server'
import { backendFetch, type ActionState } from '@/lib/backend-fetch'

export interface StatsApporteur {
  code_apporteur: string
  boutiques: { id: string; nom: string; plan: string | null; abonnement_statut: string | null }[]
  total_du: number
  total_paye: number
  taux_commission: number
  seuil_paiement: number
}

export async function devenirApporteur(): Promise<ActionState & { code_apporteur?: string }> {
  try {
    const res = await backendFetch('/api/apporteurs/devenir', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { error: data.error ?? 'Impossible d\'activer le statut apporteur' }
    return { success: true, code_apporteur: data.code_apporteur }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}

export async function getMesStatsApporteur(): Promise<StatsApporteur | null> {
  try {
    const res = await backendFetch('/api/apporteurs/mes-stats')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Create the server component page**

Create `frontend-next/src/app/compte/apporteur/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { getMesStatsApporteur } from './actions'
import ApporteurClient from './ApporteurClient'

export const metadata: Metadata = { title: 'Programme apporteur — Nopalou' }

export default async function ApporteurPage() {
  const stats = await getMesStatsApporteur()

  return (
    <div className="page-container" style={{ paddingTop: '2rem', maxWidth: 680 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>💼 Programme apporteur d&apos;affaires</h1>
      <p style={{ color: '#64748B', marginBottom: 32, fontSize: 14 }}>
        Recommandez Nopalou aux commerçants de votre réseau et touchez une commission sur leurs abonnements.
      </p>
      <ApporteurClient statsInitiales={stats} />
    </div>
  )
}
```

- [ ] **Step 3: Create the client component**

Create `frontend-next/src/app/compte/apporteur/ApporteurClient.tsx`:

```tsx
'use client'
import { useState, useTransition } from 'react'
import { devenirApporteur, type StatsApporteur } from './actions'

export default function ApporteurClient({ statsInitiales }: { statsInitiales: StatsApporteur | null }) {
  const [stats, setStats] = useState(statsInitiales)
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  function activer() {
    setErreur(null)
    startTransition(async () => {
      const result = await devenirApporteur()
      if (result.error) { setErreur(result.error); return }
      // Recharger les stats complètes après activation
      const { getMesStatsApporteur } = await import('./actions')
      const fraiches = await getMesStatsApporteur()
      setStats(fraiches)
    })
  }

  if (!stats) {
    return (
      <div>
        {erreur && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
            {erreur}
          </div>
        )}
        <button
          onClick={activer}
          disabled={isPending}
          style={{ padding: '12px 32px', background: isPending ? '#9ca3af' : '#C75B00', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer' }}
        >
          {isPending ? 'Activation...' : 'Devenir apporteur d\'affaires'}
        </button>
      </div>
    )
  }

  const lien = `https://nopalou.com/boutique?apporteur=${stats.code_apporteur}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>Votre code apporteur</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', margin: '0 0 12px' }}>{stats.code_apporteur}</p>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>Lien à partager</p>
        <code style={{ fontSize: 13, background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, display: 'block' }}>{lien}</code>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Commission due</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>{stats.total_du.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Déjà payé</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: 0 }}>{stats.total_paye.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#94A3B8' }}>
        Taux de commission actuel : {stats.taux_commission}% · Règlement à partir de {stats.seuil_paiement.toLocaleString('fr-FR')} FCFA cumulés
      </p>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Boutiques recrutées ({stats.boutiques.length})</h3>
        {stats.boutiques.length === 0 ? (
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Aucune boutique recrutée pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.boutiques.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 14 }}>
                <span>{b.nom}</span>
                <span style={{ color: b.abonnement_statut === 'actif' ? '#16a34a' : '#94A3B8' }}>
                  {b.plan ? `${b.plan} — ${b.abonnement_statut ?? 'inactif'}` : 'Sans abonnement'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add the menu entry to /compte**

In `frontend-next/src/app/compte/page.tsx`, find this line (in the `MENU` array, around line 16):

```ts
  { href: '/compte/profil',      label: 'Mon profil',        emoji: '✏️', desc: 'Modifier mes informations',       actif: true },
```

Add immediately before it:

```ts
  { href: '/compte/apporteur',   label: 'Apporteur d\'affaires', emoji: '💼', desc: 'Recommandez Nopalou et touchez une commission', actif: true },
```

- [ ] **Step 5: Type-check**

Run: `cd frontend-next && npx tsc --noEmit -p tsconfig.json`

Expected: no errors.

- [ ] **Step 6: Manual browser test**

Start both backend (`npm run dev` from repo root) and frontend (`cd frontend-next && npm run dev`), log in as a test user, navigate to `http://localhost:3001/compte/apporteur`.

Expected: "Devenir apporteur d'affaires" button visible. Click it → page shows a generated code, a shareable link, commission totals (both 0), and "Aucune boutique recrutée pour l'instant."

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/compte/apporteur frontend-next/src/app/compte/page.tsx
git commit -m "feat(compte): ajoute l'espace apporteur d'affaires (code, lien, stats)"
```

---

### Task 8: Frontend — boutique creation form pre-fills apporteur code

**Files:**
- Modify: `frontend-next/src/app/boutique/page.tsx`
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx`

**Interfaces:**
- Consumes: `searchParams.apporteur` (Next.js server component prop)
- Produces: `code_apporteur` form field submitted to `POST /api/boutiques` (Task 5 already consumes this on the backend).

- [ ] **Step 1: Read the query param in the page server component**

In `frontend-next/src/app/boutique/page.tsx`, find the function signature (around line 32):

```tsx
export default async function BoutiquePage() {
```

Replace with:

```tsx
export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ apporteur?: string }>
}) {
  const params = await searchParams
  const codeApporteurDefaut = params.apporteur?.trim().toUpperCase() || ''
```

- [ ] **Step 2: Pass the prop down to BoutiqueClient**

Find where `BoutiqueClient` is rendered in the same file (near the end of the function, likely a `return (<BoutiqueClient ... />)` block). Read the surrounding 15 lines first to see the exact prop list, then add `codeApporteurDefaut={codeApporteurDefaut}` to the JSX props passed to `<BoutiqueClient>`.

- [ ] **Step 3: Accept the prop in BoutiqueClient**

In `frontend-next/src/app/boutique/BoutiqueClient.tsx`, find the main exported client component function signature (search for `export default function BoutiqueClient`). Add `codeApporteurDefaut` to its destructured props, typed as `string`.

- [ ] **Step 4: Thread the prop into BoutiqueForm**

Find where `<BoutiqueForm` is rendered inside `BoutiqueClient` (only for the creation case — when `boutique` prop is undefined/null, not the edit case). Add `codeApporteurDefaut={codeApporteurDefaut}` to that specific render call.

Then modify the `BoutiqueForm` function signature (currently at line 244-248):

```tsx
function BoutiqueForm({ boutique, onCancel, onSuccess }: {
  boutique?: Boutique
  onCancel: () => void
  onSuccess: () => void
}) {
```

Replace with:

```tsx
function BoutiqueForm({ boutique, onCancel, onSuccess, codeApporteurDefaut }: {
  boutique?: Boutique
  onCancel: () => void
  onSuccess: () => void
  codeApporteurDefaut?: string
}) {
```

- [ ] **Step 5: Add the input field**

In the same `BoutiqueForm` function, find the `SectionTitle` and `nom` input block (currently lines 266-271):

```tsx
      <SectionTitle>📋 Informations</SectionTitle>

      <div>
        <label style={labelStyle}>Nom de la boutique *</label>
        <input name="nom" required maxLength={200} defaultValue={boutique?.nom} style={inputStyle} placeholder="Ex: Tech Dakar" />
      </div>
```

Only for the creation case (`!boutique`), add the apporteur field right after the `nom` field's closing `</div>`:

```tsx
      <SectionTitle>📋 Informations</SectionTitle>

      <div>
        <label style={labelStyle}>Nom de la boutique *</label>
        <input name="nom" required maxLength={200} defaultValue={boutique?.nom} style={inputStyle} placeholder="Ex: Tech Dakar" />
      </div>
      {!boutique && (
        <div>
          <label style={labelStyle}>Code apporteur (si recommandé par quelqu&apos;un)</label>
          <input name="code_apporteur" maxLength={20} defaultValue={codeApporteurDefaut} style={inputStyle} placeholder="Ex: A3F9K2" />
        </div>
      )}
```

- [ ] **Step 6: Type-check**

Run: `cd frontend-next && npx tsc --noEmit -p tsconfig.json`

Expected: no errors. If `searchParams` typing causes an issue, check the Next.js version's expected type (Next 14 App Router — `searchParams` is a plain object, not necessarily a `Promise`; verify against another page in the codebase that already uses `searchParams` before assuming the `Promise` wrapper — grep for `searchParams` across `frontend-next/src/app` to confirm the convention used elsewhere in this specific codebase, since this detail is version-sensitive and must match what's already there).

- [ ] **Step 7: Manual browser test**

Navigate to `http://localhost:3001/boutique?apporteur=CODE123` (using a real code from Task 7), log in if needed, click "Créer une boutique".

Expected: the "Code apporteur" field is pre-filled with `CODE123`. Submit the form with a boutique name → verify in DB (`SELECT apporteur_id FROM boutiques ORDER BY created_at DESC LIMIT 1`) that `apporteur_id` was set correctly.

- [ ] **Step 8: Manual browser test — no query param**

Navigate to `http://localhost:3001/boutique` (no `?apporteur=`), click "Créer une boutique".

Expected: the "Code apporteur" field is empty, optional, submitting without it works fine (boutique created with `apporteur_id = NULL`).

- [ ] **Step 9: Commit**

```bash
git add frontend-next/src/app/boutique/page.tsx frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): pré-remplit le code apporteur depuis le lien de recommandation"
```

---

### Task 9: Frontend — `/admin/apporteurs` page (config + tables)

**Files:**
- Create: `frontend-next/src/app/admin/(protected)/apporteurs/page.tsx`
- Create: `frontend-next/src/app/admin/(protected)/apporteurs/ApporteursClient.tsx`

**Interfaces:**
- Consumes: `GET /api/settings`, `PUT /api/settings`, `GET /api/apporteurs/admin`, `GET /api/apporteurs/admin/commissions`, `PUT /api/apporteurs/admin/commissions/:id/payer`, `PUT /api/apporteurs/admin/boutiques/:id/attribuer` (Tasks 2, 3, 6).
- Produces: nothing consumed by later tasks (leaf feature).

- [ ] **Step 1: Create the server component page**

Create `frontend-next/src/app/admin/(protected)/apporteurs/page.tsx`, following the exact pattern of `frontend-next/src/app/admin/(protected)/tarifs/page.tsx`:

```tsx
import { cookies } from 'next/headers'
import ApporteursClient from './ApporteursClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

export default async function AdminApporteursPage() {
  const jar    = await cookies()
  const secret = jar.get('nopalou_admin')?.value ?? ''
  if (!secret) return null

  let settings: Record<string, string> = {}
  let apporteurs: any[] = []
  let commissions: any[] = []

  try {
    const [settingsRes, apporteursRes, commissionsRes] = await Promise.all([
      fetch(`${BACKEND}/api/settings`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/apporteurs/admin`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
      fetch(`${BACKEND}/api/apporteurs/admin/commissions`, { headers: { 'X-Admin-Secret': secret }, cache: 'no-store' }),
    ])
    if (settingsRes.ok) settings = await settingsRes.json()
    if (apporteursRes.ok) apporteurs = (await apporteursRes.json()).apporteurs
    if (commissionsRes.ok) commissions = (await commissionsRes.json()).commissions
  } catch {}

  return (
    <div className="admin-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Programme apporteur d&apos;affaires</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>
          Configuration, suivi des recrutements et règlement des commissions.
        </p>
      </div>
      <ApporteursClient
        initialSettings={settings as any}
        initialApporteurs={apporteurs}
        initialCommissions={commissions}
        secret={secret}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create the client component — configuration block**

Create `frontend-next/src/app/admin/(protected)/apporteurs/ApporteursClient.tsx`:

```tsx
'use client'
import { useState } from 'react'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Settings {
  apporteur_actif: string
  apporteur_taux_commission: string
  apporteur_seuil_paiement: string
  apporteur_cookie_jours: string
}

interface Apporteur {
  id: string
  nom: string
  email: string
  code_apporteur: string
  nb_boutiques: string
  total_du: string
  total_paye: string
}

interface Commission {
  id: string
  montant: string
  statut: 'du' | 'paye'
  created_at: string
  paye_at: string | null
  apporteur_nom: string
  code_apporteur: string
  boutique_nom: string
  cumul_du_apporteur: string
  seuil_atteint: boolean
}

export default function ApporteursClient({
  initialSettings, initialApporteurs, initialCommissions, secret,
}: {
  initialSettings: Settings
  initialApporteurs: Apporteur[]
  initialCommissions: Commission[]
  secret: string
}) {
  const [form, setForm] = useState<Settings>(initialSettings)
  const [apporteurs] = useState<Apporteur[]>(initialApporteurs)
  const [commissions, setCommissions] = useState<Commission[]>(initialCommissions)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function saveSettings() {
    setSaving(true)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify(form),
      })
      const data = await r.json()
      if (r.ok) setMsg({ type: 'ok', text: `${Object.keys(data.updated || {}).length} paramètre(s) sauvegardé(s) ✓` })
      else setMsg({ type: 'err', text: data.error || 'Erreur' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    } finally { setSaving(false) }
  }

  async function payerCommission(id: string, forcer: boolean) {
    try {
      const r = await fetch(`${BACKEND}/api/apporteurs/admin/commissions/${id}/payer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
        body: JSON.stringify({ ignorer_seuil: forcer }),
      })
      const data = await r.json()
      if (!r.ok) { setMsg({ type: 'err', text: data.error }); return }
      setCommissions(cs => cs.map(c => c.id === id ? { ...c, statut: 'paye', paye_at: data.commission.paye_at } : c))
      setMsg({ type: 'ok', text: 'Commission marquée payée ✓' })
    } catch {
      setMsg({ type: 'err', text: 'Erreur réseau' })
    }
  }

  const field = (key: keyof Settings, label: string, suffix: string) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 13, color: '#374151' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 180 }}
        />
        <span style={{ color: '#6b7280', fontSize: 13 }}>{suffix}</span>
      </div>
    </div>
  )

  const actif = form.apporteur_actif === 'true'

  return (
    <div style={{ maxWidth: 960 }}>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#166534' : '#991b1b' }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>⚙️ Configuration</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button
            onClick={() => setForm(f => ({ ...f, apporteur_actif: actif ? 'false' : 'true' }))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: actif ? '#16a34a' : '#d1d5db', position: 'relative' }}
          >
            <span style={{ position: 'absolute', top: 3, left: actif ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Programme actif — <strong style={{ color: actif ? '#16a34a' : '#dc2626' }}>{actif ? 'Activé' : 'Désactivé'}</strong>
          </span>
        </div>

        {field('apporteur_taux_commission', 'Taux de commission', '%')}
        {field('apporteur_seuil_paiement', 'Seuil minimum de règlement', 'FCFA')}
        {field('apporteur_cookie_jours', 'Durée du lien de recommandation', 'jours')}

        <button
          onClick={saveSettings}
          disabled={saving}
          style={{ padding: '12px 32px', background: saving ? '#9ca3af' : '#ff6600', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>👥 Apporteurs ({apporteurs.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Nom', 'Code', 'Boutiques', 'Dû', 'Payé'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apporteurs.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '8px 10px' }}>{a.nom}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#C75B00' }}>{a.code_apporteur}</td>
                  <td style={{ padding: '8px 10px' }}>{a.nb_boutiques}</td>
                  <td style={{ padding: '8px 10px' }}>{Number(a.total_du).toLocaleString('fr-FR')} FCFA</td>
                  <td style={{ padding: '8px 10px', color: '#16a34a' }}>{Number(a.total_paye).toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>💰 Commissions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Apporteur', 'Boutique', 'Montant', 'Statut', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '8px 10px' }}>{c.apporteur_nom} ({c.code_apporteur})</td>
                  <td style={{ padding: '8px 10px' }}>{c.boutique_nom}</td>
                  <td style={{ padding: '8px 10px' }}>{Number(c.montant).toLocaleString('fr-FR')} FCFA</td>
                  <td style={{ padding: '8px 10px', color: c.statut === 'paye' ? '#16a34a' : '#dc2626' }}>{c.statut}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {c.statut === 'du' && (
                      <button
                        onClick={() => payerCommission(c.id, !c.seuil_atteint)}
                        title={!c.seuil_atteint ? 'Cumul sous le seuil — cliquer pour forcer le paiement' : undefined}
                        style={{
                          padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: c.seuil_atteint ? '#16a34a' : '#f59e0b', color: '#fff',
                        }}
                      >
                        {c.seuil_atteint ? 'Marquer payé' : 'Forcer le paiement'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `cd frontend-next && npx tsc --noEmit -p tsconfig.json`

Expected: no errors.

- [ ] **Step 4: Manual browser test — config save**

Navigate to `http://localhost:3001/admin/apporteurs` (logged in as admin), change "Taux de commission" to `12`, click "Sauvegarder la configuration".

Expected: success message, and `curl http://localhost:3000/api/settings -H "X-Admin-Secret: $ADMIN_SECRET"` confirms `apporteur_taux_commission: "12"`. Reset back to `10` afterward via the same UI.

- [ ] **Step 5: Manual browser test — commission list and payment**

With the commission created in Task 4's manual test still in `du` status, verify it appears in the "Commissions" table with a "Forcer le paiement" button (amber, since 1500 < 3000 threshold). Click it.

Expected: row updates to `statut: paye` in the UI without a page reload.

- [ ] **Step 6: Add the admin nav link**

Search `frontend-next/src/app/admin/(protected)/layout.tsx` (or wherever the admin sidebar/nav links are defined — grep for an existing link like `/admin/tarifs` or `/admin/communication` to find the nav data structure) and add an entry for `/admin/apporteurs` following the exact same pattern (label, icon, href) as the neighboring entries.

- [ ] **Step 7: Commit**

```bash
git add "frontend-next/src/app/admin/(protected)/apporteurs"
git commit -m "feat(admin): ajoute la page de gestion du programme apporteur d'affaires"
```

---

## Post-Implementation Checklist

- [ ] All 9 tasks committed individually (not squashed) — makes it easy to `git revert` a single task if something breaks in production
- [ ] Full manual end-to-end walkthrough on a staging/local environment: create an apporteur account → copy their link → open it in an incognito window → sign up as a different user → create a boutique via the pre-filled link → confirm `apporteur_id` set → manually trigger the Wave/Orange sandbox webhook (or the scratch script pattern from Task 4) → confirm a commission row appears in `/admin/apporteurs` → mark it paid → confirm it disappears from the "due" view and the apporteur's `/compte/apporteur` page shows updated totals
- [ ] Update `docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md` status line from "validé, prêt pour plan d'implémentation" to "implémenté" once all tasks are merged
- [ ] Update `CLAUDE.md` "État du projet" section to mention the new `commissions_apporteur` table and `/api/apporteurs` routes, following the existing documentation style for other features
