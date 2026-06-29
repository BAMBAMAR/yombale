# WhatsApp Catalogue + Chatbot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter WhatsApp Niveau 3 (Catalogue : Commerce Catalog Meta + Carousel Templates + bouton frontend) et Niveau 4 (Chatbot entrant : menu interactif, recherche, alertes prix, suivi commande) sur le backend Express + frontend Next.js de Nopalou.

**Architecture:** Un webhook unifié `/api/whatsapp/webhook` gère à la fois les messages entrants (chatbot) et les statuts de livraison. Le service `whatsapp.js` est étendu avec les nouvelles méthodes d'envoi. Un nouveau service `whatsapp-catalog.js` synchronise les produits boutique vers le catalogue Meta Commerce. Le chatbot utilise une machine à états stockée en PostgreSQL (pas de Redis).

**Tech Stack:** Node.js/Express, PostgreSQL (pg), axios, Meta Cloud API v18.0, Next.js 14, React Server Components + Client Components.

## Global Constraints

- Toujours utiliser `normalisePhone()` de `whatsapp.js` pour les numéros sénégalais
- Répondre `200` immédiatement sur le webhook POST avant tout traitement (exigence Meta — timeout 20s)
- Variables d'env : `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_TOKEN` (existants), `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_CATALOG_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` (nouveaux)
- Les templates Meta (`nopalou_carousel_annonce`, `nopalou_carousel_immo`, `nopalou_carousel_telecom`, `nopalou_fiche_texte`) doivent être créés et approuvés dans Meta Business Manager AVANT de les utiliser (~24h)
- Fallback texte si les credentials WhatsApp sont absents (comportement déjà en place dans `sendWhatsAppText`)
- Format prix : `new Intl.NumberFormat('fr-FR').format(prix) + ' FCFA'`
- URL site : `process.env.FRONTEND_URL || 'https://nopalou.com'`

---

## Fichiers créés / modifiés

| Fichier | Action | Rôle |
|---|---|---|
| `backend/routes/whatsapp.js` | Créer | Webhook GET/POST + route send |
| `backend/services/whatsapp-catalog.js` | Créer | Sync produits → Meta Commerce Catalog |
| `backend/services/whatsapp-chatbot.js` | Créer | Machine à états chatbot |
| `backend/services/whatsapp.js` | Modifier | +sendWhatsAppTemplate, +sendWhatsAppCarousel, +sendWhatsAppInteractive, +sendWhatsAppProduct, +sendReadReceipt, +sendTyping |
| `backend/services/notifications.js` | Modifier | notifierModerationImmo → carousel |
| `backend/routes/annonces.js` | Modifier | PUT /admin/:id → carousel à la validation |
| `backend/routes/boutiques.js` | Modifier | POST/PUT/DELETE produit → syncProduit/deleteProduit |
| `backend/app.js` | Modifier | Monter `/api/whatsapp` |
| `backend/migrate-inline.js` | Modifier | +whatsapp_sessions, +whatsapp_processed_messages |
| `.env.example` | Modifier | +4 variables WhatsApp |
| `frontend-next/src/components/BoutonWhatsApp.tsx` | Créer | Bouton "Recevoir par WhatsApp" |
| `frontend-next/src/components/ModalWhatsApp.tsx` | Créer | Modal saisie numéro (non connecté) |
| `frontend-next/src/app/annonces/[id]/page.tsx` | Modifier | +BoutonWhatsApp |
| `frontend-next/src/app/immo/[id]/page.tsx` | Modifier | +BoutonWhatsApp |
| `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx` | Modifier | +BoutonWhatsApp (Product Message) |

---

## Task 1 : DB migrations + route skeleton + app.js

**Files:**
- Modify: `backend/migrate-inline.js` (fin du fichier, avant `} catch`)
- Create: `backend/routes/whatsapp.js`
- Modify: `backend/app.js` (ligne ~128)
- Modify: `.env.example`

**Interfaces:**
- Produit: `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE` → retourne le challenge en texte plain
- Produit: `POST /api/whatsapp/webhook` → `200 OK` immédiat

- [ ] **Step 1 : Ajouter les deux tables dans migrate-inline.js**

Ouvrir `backend/migrate-inline.js`. Juste avant la ligne `} catch (e) {` à la toute fin du `pool.query(`` (le grand bloc SQL), ajouter :

```sql
      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        phone       TEXT PRIMARY KEY,
        state       TEXT NOT NULL DEFAULT 'IDLE',
        context     JSONB NOT NULL DEFAULT '{}',
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS whatsapp_processed_messages (
        message_id   TEXT PRIMARY KEY,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_wpm_processed_at
        ON whatsapp_processed_messages(processed_at);
```

- [ ] **Step 2 : Créer backend/routes/whatsapp.js (skeleton)**

```javascript
// backend/routes/whatsapp.js
const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

// ── Vérification signature HMAC-SHA256 Meta ──────────────────────────────────
function verifyHmac(req, res, next) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return next(); // Pas de secret configuré = dev local, on passe

  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return res.status(403).json({ error: 'Signature manquante' });

  // req.rawBody est alimenté par le middleware express.json avec verify (voir app.js)
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(403).json({ error: 'Signature invalide' });
  }
  next();
}

// ── GET /api/whatsapp/webhook — handshake Meta ───────────────────────────────
router.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[WHATSAPP] Webhook vérifié ✓');
    return res.status(200).send(challenge);
  }
  res.status(403).json({ error: 'Vérification échouée' });
});

// ── POST /api/whatsapp/webhook — messages entrants ───────────────────────────
router.post('/webhook', verifyHmac, (req, res) => {
  res.sendStatus(200); // Toujours 200 immédiatement (Meta timeout = 20s)

  const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
  if (!entry) return;

  if (entry.messages) {
    const msg = entry.messages[0];
    // TODO Task 8 : handleIncoming(msg)
    console.log('[WHATSAPP] Message entrant de', msg.from, ':', msg.type);
  }

  if (entry.statuses) {
    console.log('[WHATSAPP] Statut livraison:', entry.statuses[0].status);
  }
});

// ── POST /api/whatsapp/send — envoi manuel (bouton frontend) ─────────────────
const { verifierToken, tokenOptional } = require('../middlewares/auth');

router.post('/send', tokenOptional, async (req, res) => {
  try {
    const { type, id, phone } = req.body;
    if (!type || !id) return res.status(400).json({ error: 'type et id requis' });

    // Récupérer le numéro : depuis le compte connecté ou depuis le body
    let tel = phone;
    if (req.user?.userId && !tel) {
      const { pool } = require('../models/db');
      const u = await pool.query('SELECT telephone FROM utilisateurs WHERE id=$1', [req.user.userId]);
      tel = u.rows[0]?.telephone;
    }
    if (!tel) return res.status(400).json({ error: 'Numéro de téléphone requis' });

    await require('../services/whatsapp').sendFiche(type, id, tel);
    res.json({ success: true });
  } catch (err) {
    console.error('[WHATSAPP SEND]', err.message);
    res.status(500).json({ error: 'Erreur envoi' });
  }
});

module.exports = router;
```

- [ ] **Step 3 : Monter la route dans app.js**

Dans `backend/app.js`, après la ligne `app.use('/api/click', ...)` (ligne ~128), ajouter :

```javascript
app.use('/api/whatsapp', require('./routes/whatsapp'));
```

Pour que le HMAC fonctionne, il faut capturer le `rawBody` avant que `express.json` ne parse. Remplacer la ligne existante `app.use(express.json({ limit: '10mb' }));` par :

```javascript
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
```

- [ ] **Step 4 : Ajouter les variables dans .env.example**

Après le bloc `# WHATSAPP` existant, ajouter :

```
WHATSAPP_VERIFY_TOKEN=mon_token_de_verification_arbitraire
WHATSAPP_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_CATALOG_ID=xxxxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxxxxxxxxxxxxx
```

- [ ] **Step 5 : Tester le handshake webhook**

Démarrer le backend : `npm run dev`

```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=mon_token_de_verification_arbitraire&hub.challenge=TESTCHALLENGE"
```
Résultat attendu : `TESTCHALLENGE` (texte plain, status 200)

```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=MAUVAIS&hub.challenge=X"
```
Résultat attendu : `{"error":"Vérification échouée"}` (status 403)

- [ ] **Step 6 : Commit**

```bash
git add backend/migrate-inline.js backend/routes/whatsapp.js backend/app.js .env.example
git commit -m "feat: webhook WhatsApp unifié — skeleton + HMAC + DB migrations"
```

---

## Task 2 : Étendre whatsapp.js avec les nouvelles méthodes d'envoi

**Files:**
- Modify: `backend/services/whatsapp.js`

**Interfaces:**
- Produit: `sendWhatsAppTemplate(phone, templateName, components)` → Promise
- Produit: `sendWhatsAppCarousel(phone, templateName, cards)` → Promise (cards = array de {imageUrl, title, detail, pageUrl})
- Produit: `sendWhatsAppInteractive(phone, header, body, sections)` → Promise (sections = Interactive List)
- Produit: `sendWhatsAppProduct(phone, retailerProductId, bodyText)` → Promise
- Produit: `sendReadReceipt(messageId)` → Promise
- Produit: `sendTyping(phone)` → Promise
- Produit: `sendFiche(type, id, phone)` → Promise (dispatcher utilisé par /send)

- [ ] **Step 1 : Réécrire backend/services/whatsapp.js**

Remplacer le contenu entier par :

```javascript
// backend/services/whatsapp.js — Meta Cloud API v18.0
const axios = require('axios');

const PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN      = process.env.WHATSAPP_API_TOKEN;
const CATALOG_ID = process.env.WHATSAPP_CATALOG_ID;
const SITE       = process.env.FRONTEND_URL || 'https://nopalou.com';

function normalisePhone(phone) {
  let num = String(phone).replace(/[^\d]/g, '');
  if (num.startsWith('00221')) num = num.slice(2);
  if (num.length === 9) num = '221' + num;
  return num;
}

function apiUrl() {
  return `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
}

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

function guard() {
  if (!PHONE_ID || !TOKEN) {
    console.log('[WHATSAPP] Credentials manquants — ignoré');
    return false;
  }
  return true;
}

async function post(payload) {
  if (!guard()) return;
  try {
    const { data } = await axios.post(apiUrl(), payload, { headers: headers() });
    return data;
  } catch (err) {
    console.error('[WHATSAPP] Erreur:', err.response?.data?.error?.message || err.message);
  }
}

// ── Texte libre (existant) ────────────────────────────────────────────────────
async function sendWhatsAppText(phone, message) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'text',
    text: { body: message, preview_url: false },
  });
}

// ── Template simple (image ou texte) ─────────────────────────────────────────
async function sendWhatsAppTemplate(phone, templateName, components = []) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'fr' },
      components,
    },
  });
}

// ── Carousel Template (plusieurs cartes) ─────────────────────────────────────
// cards = [{ imageUrl, title, detail, pageUrl }] (max 10)
async function sendWhatsAppCarousel(phone, templateName, cards) {
  const carouselCards = cards.map((c, i) => ({
    card_index: i,
    components: [
      {
        type: 'header',
        parameters: c.imageUrl
          ? [{ type: 'image', image: { link: c.imageUrl } }]
          : [],
      },
      {
        type: 'body',
        parameters: [
          { type: 'text', text: c.title },
          { type: 'text', text: c.detail },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: c.pageUrl }],
      },
    ],
  }));

  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'fr' },
      components: [{ type: 'carousel', cards: carouselCards }],
    },
  });
}

// ── Interactive List Message (menu chatbot) ───────────────────────────────────
// sections = [{ title, rows: [{ id, title, description }] }]
async function sendWhatsAppInteractive(phone, headerText, bodyText, sections) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: headerText },
      body: { text: bodyText },
      footer: { text: 'Nopalou — Comparez les prix au Sénégal' },
      action: {
        button: 'Sélectionner ▾',
        sections,
      },
    },
  });
}

// ── Product Message (catalogue Meta Commerce) ─────────────────────────────────
async function sendWhatsAppProduct(phone, retailerProductId, bodyText) {
  if (!CATALOG_ID) {
    console.log('[WHATSAPP] CATALOG_ID manquant — fallback texte');
    return sendWhatsAppText(phone, bodyText);
  }
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'interactive',
    interactive: {
      type: 'product',
      body: { text: bodyText },
      action: {
        catalog_id: CATALOG_ID,
        product_retailer_id: retailerProductId,
      },
    },
  });
}

// ── Read receipt ──────────────────────────────────────────────────────────────
async function sendReadReceipt(messageId) {
  return post({
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  });
}

// ── Typing indicator ──────────────────────────────────────────────────────────
// Nota : supporté sur certains comptes Cloud API uniquement
async function sendTyping(phone) {
  return post({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalisePhone(phone),
    type: 'action',
    action: { name: 'typing_on' },
  }).catch(() => {}); // silencieux si non supporté
}

// ── Dispatcher /send ──────────────────────────────────────────────────────────
async function sendFiche(type, id, phone) {
  const { pool } = require('../models/db');
  const prixFmt = (p) => p ? new Intl.NumberFormat('fr-FR').format(p) + ' FCFA' : 'Prix non précisé';

  if (type === 'annonce') {
    const r = await pool.query('SELECT * FROM annonces_classifiees WHERE id=$1', [id]);
    const a = r.rows[0];
    if (!a) throw new Error('Annonce introuvable');
    const cards = [{
      imageUrl: a.photos?.[0] || null,
      title: a.titre,
      detail: prixFmt(a.prix),
      pageUrl: `${SITE}/annonces/${a.id}`,
    }];
    if (a.photos?.[0]) {
      return sendWhatsAppCarousel(phone, 'nopalou_carousel_annonce', cards);
    }
    return sendWhatsAppTemplate(phone, 'nopalou_fiche_texte', [
      { type: 'body', parameters: [{ type: 'text', text: a.titre }, { type: 'text', text: prixFmt(a.prix) }, { type: 'text', text: `${SITE}/annonces/${a.id}` }] },
    ]);
  }

  if (type === 'immo') {
    const r = await pool.query('SELECT * FROM annonces_immo WHERE id=$1', [id]);
    const a = r.rows[0];
    if (!a) throw new Error('Annonce immo introuvable');
    const detail = [a.type_bien, a.ville, prixFmt(a.prix)].filter(Boolean).join(' — ');
    const cards = [{
      imageUrl: a.photos?.[0] || null,
      title: a.titre,
      detail,
      pageUrl: `${SITE}/immo/${a.id}`,
    }];
    if (a.photos?.[0]) {
      return sendWhatsAppCarousel(phone, 'nopalou_carousel_immo', cards);
    }
    return sendWhatsAppTemplate(phone, 'nopalou_fiche_texte', [
      { type: 'body', parameters: [{ type: 'text', text: a.titre }, { type: 'text', text: detail }, { type: 'text', text: `${SITE}/immo/${a.id}` }] },
    ]);
  }

  if (type === 'produit') {
    const r = await pool.query(
      'SELECT p.*, b.slug AS boutique_slug FROM boutique_produits p JOIN boutiques b ON b.id=p.boutique_id WHERE p.id=$1',
      [id]
    );
    const p = r.rows[0];
    if (!p) throw new Error('Produit introuvable');
    return sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.nom} — ${prixFmt(p.prix)}\n\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`
    );
  }

  if (type === 'telecom') {
    const r = await pool.query('SELECT * FROM offres_telecom WHERE id=$1', [id]);
    const o = r.rows[0];
    if (!o) throw new Error('Offre télécom introuvable');
    const cards = [{
      imageUrl: null,
      title: o.nom || o.operateur,
      detail: prixFmt(o.prix),
      pageUrl: `${SITE}/telecom`,
    }];
    return sendWhatsAppTemplate(phone, 'nopalou_carousel_telecom', [
      { type: 'body', parameters: [{ type: 'text', text: o.nom || o.operateur }, { type: 'text', text: prixFmt(o.prix) }, { type: 'text', text: `${SITE}/telecom` }] },
    ]);
  }

  throw new Error(`Type inconnu : ${type}`);
}

module.exports = {
  sendWhatsAppText,
  sendWhatsAppTemplate,
  sendWhatsAppCarousel,
  sendWhatsAppInteractive,
  sendWhatsAppProduct,
  sendReadReceipt,
  sendTyping,
  sendFiche,
  normalisePhone,
};
```

- [ ] **Step 2 : Vérifier que les imports existants dans notifications.js fonctionnent toujours**

```bash
node -e "const w = require('./backend/services/whatsapp'); console.log(Object.keys(w))"
```
Résultat attendu : `[ 'sendWhatsAppText', 'sendWhatsAppTemplate', 'sendWhatsAppCarousel', 'sendWhatsAppInteractive', 'sendWhatsAppProduct', 'sendReadReceipt', 'sendTyping', 'sendFiche', 'normalisePhone' ]`

- [ ] **Step 3 : Tester /send sans credentials (fallback silencieux)**

```bash
curl -s -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"type":"annonce","id":"00000000-0000-0000-0000-000000000000","phone":"771234567"}'
```
Résultat attendu : `{"error":"Annonce introuvable"}` (pas de crash, juste 500 propre)

- [ ] **Step 4 : Commit**

```bash
git add backend/services/whatsapp.js
git commit -m "feat: whatsapp.js — sendCarousel, sendInteractive, sendProduct, sendFiche, sendReadReceipt"
```

---

## Task 3 : Meta Commerce Catalog — service + intégration boutiques

**Files:**
- Create: `backend/services/whatsapp-catalog.js`
- Modify: `backend/routes/boutiques.js`

**Interfaces:**
- Consomme: `WHATSAPP_CATALOG_ID`, `WHATSAPP_API_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID` depuis env
- Produit: `syncProduit(produit)` → Promise (produit = row boutique_produits avec boutique_slug)
- Produit: `deleteProduit(produitId)` → Promise

- [ ] **Step 1 : Créer backend/services/whatsapp-catalog.js**

```javascript
// backend/services/whatsapp-catalog.js — Sync vers Meta Commerce Catalog
const axios = require('axios');

const TOKEN      = process.env.WHATSAPP_API_TOKEN;
const CATALOG_ID = process.env.WHATSAPP_CATALOG_ID;
const SITE       = process.env.FRONTEND_URL || 'https://nopalou.com';

function guard() {
  if (!TOKEN || !CATALOG_ID) {
    console.log('[CATALOG] Credentials manquants — sync ignorée');
    return false;
  }
  return true;
}

// Crée ou met à jour un produit dans le catalogue Meta Commerce
async function syncProduit(produit) {
  if (!guard()) return;
  const retailerId = `nopalou-produit-${produit.id}`;
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${CATALOG_ID}/products`,
      {
        retailer_id:  retailerId,
        name:         produit.nom,
        description:  produit.description || produit.nom,
        price:        Math.round((produit.prix || 0) * 100), // en centimes
        currency:     'XOF',
        availability: produit.en_stock !== false ? 'in stock' : 'out of stock',
        url:          `${SITE}/boutiques/${produit.boutique_slug}/produits/${produit.id}`,
        image_url:    produit.images?.[0] || '',
      },
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    console.log(`[CATALOG] Sync produit ${retailerId} ✓`);
  } catch (err) {
    console.error('[CATALOG] Erreur sync:', err.response?.data?.error?.message || err.message);
  }
}

// Retire un produit du catalogue Meta Commerce
async function deleteProduit(produitId) {
  if (!guard()) return;
  const retailerId = `nopalou-produit-${produitId}`;
  try {
    await axios.delete(
      `https://graph.facebook.com/v18.0/${CATALOG_ID}/products`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        data: { retailer_id: retailerId },
      }
    );
    console.log(`[CATALOG] Suppression ${retailerId} ✓`);
  } catch (err) {
    console.error('[CATALOG] Erreur suppression:', err.response?.data?.error?.message || err.message);
  }
}

module.exports = { syncProduit, deleteProduit };
```

- [ ] **Step 2 : Enrichir la requête de création produit dans boutiques.js pour inclure boutique_slug**

Dans `backend/routes/boutiques.js`, après la ligne `res.status(201).json({ success: true, produit: r.rows[0] });` du POST produit, ajouter la sync catalogue. D'abord, en haut du fichier ajouter l'import :

```javascript
const { syncProduit, deleteProduit } = require('../services/whatsapp-catalog');
```

Puis, dans le handler POST produit, après `res.status(201).json(...)`, ajouter (feu et oublie) :

```javascript
    // Sync catalogue Meta (async, non-bloquant)
    const boutique = await pool.query('SELECT slug FROM boutiques WHERE id=$1', [id]);
    syncProduit({ ...r.rows[0], boutique_slug: boutique.rows[0]?.slug }).catch(() => {});
```

- [ ] **Step 3 : Ajouter sync dans le PUT produit**

Dans le handler `PUT /:id/produits/:prodId`, après la ligne `res.json({ success: true, produit: r.rows[0] });`, ajouter :

```javascript
    const bout = await pool.query('SELECT slug FROM boutiques WHERE id=$1', [id]);
    syncProduit({ ...r.rows[0], boutique_slug: bout.rows[0]?.slug }).catch(() => {});
```

- [ ] **Step 4 : Ajouter la suppression dans le DELETE produit**

Dans le handler `DELETE /:id/produits/:prodId` (vers ligne 295), avant ou après `res.json(...)`, ajouter :

```javascript
    deleteProduit(prodId).catch(() => {});
```

- [ ] **Step 5 : Vérifier syntaxe**

```bash
node -e "require('./backend/routes/boutiques')" && echo "OK"
```
Résultat attendu : `OK` (pas d'erreur de syntaxe)

- [ ] **Step 6 : Commit**

```bash
git add backend/services/whatsapp-catalog.js backend/routes/boutiques.js
git commit -m "feat: Meta Commerce Catalog sync — syncProduit/deleteProduit sur boutique_produits"
```

---

## Task 4 : Carousel automatique à la validation admin (annonces + immo)

**Files:**
- Modify: `backend/routes/annonces.js`
- Modify: `backend/services/notifications.js`

**Interfaces:**
- Consomme: `sendWhatsAppCarousel`, `sendWhatsAppTemplate` depuis `whatsapp.js`
- Produit: `notifierModerationImmo(annonce)` étendue — envoie carousel si photo présente

- [ ] **Step 1 : Étendre notifierModerationImmo dans notifications.js**

Remplacer la fonction `notifierModerationImmo` existante par :

```javascript
async function notifierModerationImmo(annonce) {
  if (!annonce.contact_tel) return;
  const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';

  if (annonce.rejete) {
    const msg = `❌ *Annonce refusée — Nopalou*\n\nVotre annonce *"${annonce.titre}"* n'a pas pu être publiée.\n\n📝 Motif : ${annonce.motif_rejet || 'Non précisé'}\n\nVous pouvez la corriger et la soumettre à nouveau sur Nopalou.`;
    return sendWhatsAppText(annonce.contact_tel, msg).catch(() => {});
  }

  if (annonce.actif) {
    const card = {
      imageUrl: annonce.photos?.[0] || null,
      title:    annonce.titre,
      detail:   annonce.prix
        ? new Intl.NumberFormat('fr-FR').format(annonce.prix) + ' FCFA'
        : 'Prix non précisé',
      pageUrl: `${SITE}/immo/${annonce.id}`,
    };
    if (card.imageUrl) {
      return sendWhatsAppCarousel(annonce.contact_tel, 'nopalou_carousel_immo', [card]).catch(() => {});
    }
    return sendWhatsAppTemplate(annonce.contact_tel, 'nopalou_fiche_texte', [
      { type: 'body', parameters: [
        { type: 'text', text: card.title },
        { type: 'text', text: card.detail },
        { type: 'text', text: card.pageUrl },
      ]},
    ]).catch(() => {});
  }
}
```

Ajouter les imports en haut de `notifications.js` si pas déjà présents :

```javascript
const { sendWhatsAppText, sendWhatsAppCarousel, sendWhatsAppTemplate } = require('./whatsapp');
```

- [ ] **Step 2 : Ajouter carousel dans annonces.js à la validation admin**

Dans `backend/routes/annonces.js`, en haut du fichier ajouter :

```javascript
const { sendWhatsAppCarousel, sendWhatsAppTemplate } = require('../services/whatsapp');
```

Dans le handler `PUT /admin/:id`, après le `pool.query(UPDATE annonces_classifiees SET actif=...)`, ajouter :

```javascript
    // Notification WhatsApp au déposant si approbation
    if (newActif) {
      const ann = await pool.query('SELECT * FROM annonces_classifiees WHERE id=$1', [req.params.id]);
      const a = ann.rows[0];
      if (a?.contact_tel) {
        const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
        const card = {
          imageUrl: a.photos?.[0] || null,
          title:    a.titre,
          detail:   a.prix ? new Intl.NumberFormat('fr-FR').format(a.prix) + ' FCFA' : 'Prix non précisé',
          pageUrl:  `${SITE}/annonces/${a.id}`,
        };
        if (card.imageUrl) {
          sendWhatsAppCarousel(a.contact_tel, 'nopalou_carousel_annonce', [card]).catch(() => {});
        } else {
          sendWhatsAppTemplate(a.contact_tel, 'nopalou_fiche_texte', [
            { type: 'body', parameters: [
              { type: 'text', text: card.title },
              { type: 'text', text: card.detail },
              { type: 'text', text: card.pageUrl },
            ]},
          ]).catch(() => {});
        }
      }
    }
```

- [ ] **Step 3 : Vérifier syntaxe**

```bash
node -e "require('./backend/routes/annonces')" && echo "OK"
node -e "require('./backend/services/notifications')" && echo "OK"
```
Résultat attendu : `OK` les deux fois

- [ ] **Step 4 : Tester le flow admin annonce (sans credentials WhatsApp = logs seulement)**

```bash
curl -s -X PUT http://localhost:3000/api/annonces/admin/00000000-0000-0000-0000-000000000000 \
  -H "X-Admin-Secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"actif":true}'
```
Résultat attendu : `{"success":true}` + dans les logs `[WHATSAPP] Credentials manquants — ignoré`

- [ ] **Step 5 : Commit**

```bash
git add backend/routes/annonces.js backend/services/notifications.js
git commit -m "feat: carousel WhatsApp automatique à la validation admin (annonces + immo)"
```

---

## Task 5 : Frontend — BoutonWhatsApp + ModalWhatsApp

**Files:**
- Create: `frontend-next/src/components/BoutonWhatsApp.tsx`
- Create: `frontend-next/src/components/ModalWhatsApp.tsx`
- Modify: `frontend-next/src/app/annonces/[id]/page.tsx`
- Modify: `frontend-next/src/app/immo/[id]/page.tsx`
- Modify: `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx`

**Interfaces:**
- Consomme: Session via `getOptionalSession()` côté serveur pour passer `isConnecte` en prop
- Consomme: `POST /api/whatsapp/send` → `{ success: true }` ou `{ error: string }`
- Produit: `<BoutonWhatsApp type="annonce"|"immo"|"produit"|"telecom" id={string} isConnecte={boolean} />`

- [ ] **Step 1 : Créer frontend-next/src/components/ModalWhatsApp.tsx**

```tsx
'use client';
import { useState } from 'react';

interface Props {
  type: string;
  id: string;
  onClose: () => void;
}

export default function ModalWhatsApp({ type, id, onClose }: Props) {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const phoneRegex = /^(\+221|221)?[0-9]{9}$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Numéro invalide (ex: 771234567)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/whatsapp/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, id, phone: phone.replace(/\s/g, '') }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setTimeout(onClose, 2000);
      } else {
        setError(data.error || 'Erreur envoi');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-whatsapp-overlay" onClick={onClose}>
      <div className="modal-whatsapp-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-whatsapp-close" onClick={onClose} aria-label="Fermer">✕</button>
        <h3>Recevoir par WhatsApp</h3>
        {sent ? (
          <p className="modal-whatsapp-success">✅ Fiche envoyée sur WhatsApp !</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="wa-phone">Votre numéro WhatsApp</label>
            <input
              id="wa-phone"
              type="tel"
              placeholder="77 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {error && <p className="modal-whatsapp-error">{error}</p>}
            <button type="submit" disabled={loading || !phone}>
              {loading ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Créer frontend-next/src/components/BoutonWhatsApp.tsx**

```tsx
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ModalWhatsApp = dynamic(() => import('./ModalWhatsApp'), { ssr: false });

interface Props {
  type: 'annonce' | 'immo' | 'produit' | 'telecom';
  id: string;
  isConnecte: boolean;
}

export default function BoutonWhatsApp({ type, id, isConnecte }: Props) {
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);

  async function handleClick() {
    if (sent) return;
    if (!isConnecte) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/whatsapp/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type, id }),
        }
      );
      const data = await res.json();
      if (data.success) setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || sent}
        className="bouton-whatsapp-fiche"
        aria-label="Recevoir cette fiche par WhatsApp"
      >
        {sent ? '✅ Envoyé !' : loading ? 'Envoi…' : '📩 Recevoir par WhatsApp'}
      </button>
      {showModal && (
        <ModalWhatsApp type={type} id={id} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
```

- [ ] **Step 3 : Ajouter BoutonWhatsApp dans annonces/[id]/page.tsx**

Dans `frontend-next/src/app/annonces/[id]/page.tsx`, ajouter l'import en haut (section imports client) :

```tsx
import BoutonWhatsApp from '@/components/BoutonWhatsApp';
```

Lire la session pour déterminer si l'utilisateur est connecté — ajouter dans le Server Component (avant le return) :

```tsx
const session = await getOptionalSession();
```

(S'assurer que `getOptionalSession` est importé depuis `@/lib/dal`)

Puis, juste après le lien WhatsApp existant (ligne ~154), ajouter :

```tsx
<BoutonWhatsApp type="annonce" id={annonce.id} isConnecte={!!session} />
```

- [ ] **Step 4 : Ajouter BoutonWhatsApp dans immo/[id]/page.tsx**

Même pattern. Ajouter import `BoutonWhatsApp` et `getOptionalSession`. Après le lien WhatsApp existant (vers ligne 217), ajouter :

```tsx
<BoutonWhatsApp type="immo" id={annonce.id} isConnecte={!!session} />
```

- [ ] **Step 5 : Ajouter BoutonWhatsApp dans boutiques/[id]/produits/[produitId]/page.tsx**

Ajouter import. Dans la section action du produit (bouton "Contacter"), ajouter :

```tsx
<BoutonWhatsApp type="produit" id={produit.id} isConnecte={!!session} />
```

- [ ] **Step 6 : Vérifier le build Next.js**

```bash
cd frontend-next && npm run build 2>&1 | tail -20
```
Résultat attendu : `✓ Compiled successfully` sans erreurs TypeScript

- [ ] **Step 7 : Tester dans le navigateur**

Démarrer : `cd frontend-next && npm run dev`

- Ouvrir une fiche annonce → vérifier que le bouton "📩 Recevoir par WhatsApp" apparaît
- Non connecté → cliquer → modal doit s'ouvrir avec champ numéro
- Saisir `771234567` → cliquer Envoyer → toast "Fiche envoyée" (le backend log "[WHATSAPP] Credentials manquants")
- Numéro invalide `123` → message d'erreur sous le champ

- [ ] **Step 8 : Commit**

```bash
cd ..
git add frontend-next/src/components/BoutonWhatsApp.tsx \
        frontend-next/src/components/ModalWhatsApp.tsx \
        frontend-next/src/app/annonces/[id]/page.tsx \
        frontend-next/src/app/immo/[id]/page.tsx \
        "frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx"
git commit -m "feat: bouton 'Recevoir par WhatsApp' + modal saisie numéro (annonces, immo, produits)"
```

---

## Task 6 : Chatbot — machine à états

**Files:**
- Create: `backend/services/whatsapp-chatbot.js`

**Interfaces:**
- Consomme: `pool` depuis `../models/db`, `sendWhatsAppText`, `sendWhatsAppInteractive`, `sendWhatsAppCarousel`, `sendWhatsAppProduct`, `sendReadReceipt`, `sendTyping` depuis `./whatsapp`
- Produit: `handleIncoming(msg)` → Promise (msg = objet message Meta entrant)

- [ ] **Step 1 : Créer backend/services/whatsapp-chatbot.js**

```javascript
// backend/services/whatsapp-chatbot.js
const { pool } = require('../models/db');
const {
  sendWhatsAppText,
  sendWhatsAppInteractive,
  sendWhatsAppCarousel,
  sendWhatsAppProduct,
  sendReadReceipt,
  sendTyping,
  normalisePhone,
} = require('./whatsapp');

const SITE = process.env.FRONTEND_URL || 'https://nopalou.com';
const prixFmt = (p) => p ? new Intl.NumberFormat('fr-FR').format(p) + ' FCFA' : 'N/C';

// ── Session DB ────────────────────────────────────────────────────────────────
async function getSession(phone) {
  const r = await pool.query(
    'SELECT state, context FROM whatsapp_sessions WHERE phone=$1',
    [phone]
  );
  return r.rows[0] || { state: 'IDLE', context: {} };
}

async function setSession(phone, state, context = {}) {
  await pool.query(
    `INSERT INTO whatsapp_sessions(phone, state, context, updated_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT(phone) DO UPDATE SET state=$2, context=$3, updated_at=NOW()`,
    [phone, state, JSON.stringify(context)]
  );
}

// ── Déduplication ─────────────────────────────────────────────────────────────
async function isDuplicate(messageId) {
  const r = await pool.query(
    `INSERT INTO whatsapp_processed_messages(message_id) VALUES($1)
     ON CONFLICT DO NOTHING RETURNING message_id`,
    [messageId]
  );
  return r.rows.length === 0; // true = déjà traité
}

// ── Nettoyage sessions inactives > 24h ────────────────────────────────────────
async function cleanupOldMessages() {
  await pool.query(
    `DELETE FROM whatsapp_processed_messages WHERE processed_at < NOW() - INTERVAL '24 hours'`
  );
}

// ── Menu principal ────────────────────────────────────────────────────────────
async function sendMenu(phone) {
  await sendWhatsAppInteractive(
    phone,
    '🛍️ Nopalou',
    'Comment puis-je vous aider ?',
    [
      {
        title: 'Découvrir',
        rows: [
          { id: 'search',  title: '🔍 Rechercher',      description: 'Trouver un produit ou annonce' },
          { id: 'immo',    title: '🏠 Annonces immo',   description: 'Maisons, appartements, terrains' },
          { id: 'telecom', title: '📱 Offres télécom',  description: 'Mobile, internet, forfaits' },
        ],
      },
      {
        title: 'Mon compte',
        rows: [
          { id: 'alert',   title: '🔔 Alerte prix',     description: 'Être notifié d\'une baisse' },
          { id: 'order',   title: '📦 Suivre commande', description: 'Statut de votre paiement' },
          { id: 'support', title: '💬 Support',         description: 'Contacter l\'équipe Nopalou' },
        ],
      },
    ]
  );
}

// ── Recherche full-text ───────────────────────────────────────────────────────
async function searchContent(query) {
  const r = await pool.query(
    `(
      SELECT 'produit' AS type, p.id::text, p.nom AS titre, p.prix,
             p.images[1] AS photo, b.slug AS boutique_slug, NULL AS ville
      FROM boutique_produits p
      JOIN boutiques b ON b.id = p.boutique_id
      WHERE to_tsvector('french', p.nom || ' ' || COALESCE(p.description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'annonce', id::text, titre, prix, photos[1], NULL, NULL
      FROM annonces_classifiees
      WHERE actif=true AND supprimee=false
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    UNION ALL
    (
      SELECT 'immo', id::text, titre, prix, photos[1], NULL, ville
      FROM annonces_immo
      WHERE actif=true
        AND to_tsvector('french', titre || ' ' || COALESCE(description,''))
            @@ plainto_tsquery('french', $1)
      LIMIT 3
    )
    LIMIT 3`,
    [query]
  );
  return r.rows;
}

// ── Dispatcher principal ──────────────────────────────────────────────────────
async function handleIncoming(msg) {
  const phone = normalisePhone(msg.from);

  // Déduplication
  if (await isDuplicate(msg.id)) return;

  // Read receipt immédiat
  await sendReadReceipt(msg.id).catch(() => {});

  const { state, context } = await getSession(phone);
  const text = msg.text?.body?.trim() || '';
  const interactiveId = msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || '';

  // Typing pendant traitement
  await sendTyping(phone).catch(() => {});

  // Mots-clés globaux : "menu" ou "aide" depuis n'importe quel état
  if (['menu', 'aide', 'help', '0'].includes(text.toLowerCase())) {
    await setSession(phone, 'IDLE', {});
    await sendMenu(phone);
    return;
  }

  // ── IDLE → envoyer le menu ─────────────────────────────────────────────────
  if (state === 'IDLE') {
    await setSession(phone, 'MENU', {});
    await sendMenu(phone);
    return;
  }

  // ── MENU → réponse au menu interactif ─────────────────────────────────────
  if (state === 'MENU') {
    const action = interactiveId || text.toLowerCase();

    if (action === 'search') {
      await setSession(phone, 'SEARCH_QUERY', {});
      await sendWhatsAppText(phone, '🔍 Que recherchez-vous ? (ex: télévision Samsung, canapé, forfait Tigo...)');
      return;
    }
    if (action === 'immo') {
      const r = await pool.query(
        `SELECT id, titre, prix, photos[1] AS photo FROM annonces_immo WHERE actif=true ORDER BY created_at DESC LIMIT 3`
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Aucune annonce immo disponible pour le moment.');
      } else {
        const cards = r.rows.map(a => ({
          imageUrl: a.photo || null,
          title: a.titre,
          detail: prixFmt(a.prix),
          pageUrl: `${SITE}/immo/${a.id}`,
        }));
        await sendWhatsAppCarousel(phone, 'nopalou_carousel_immo', cards).catch(() =>
          sendWhatsAppText(phone, cards.map(c => `• ${c.title} — ${c.detail}\n${c.pageUrl}`).join('\n\n'))
        );
      }
      await setSession(phone, 'IDLE', {});
      return;
    }
    if (action === 'telecom') {
      const r = await pool.query(
        `SELECT id, nom, operateur, prix FROM offres_telecom ORDER BY created_at DESC LIMIT 5`
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Aucune offre télécom disponible pour le moment.');
      } else {
        const lines = r.rows.map(o => `📱 *${o.nom || o.operateur}* — ${prixFmt(o.prix)}\n👉 ${SITE}/telecom`);
        await sendWhatsAppText(phone, lines.join('\n\n'));
      }
      await setSession(phone, 'IDLE', {});
      return;
    }
    if (action === 'alert') {
      await setSession(phone, 'ALERT_PRODUCT', { phone });
      await sendWhatsAppText(phone, '🔔 Quel produit voulez-vous surveiller ? (ex: iPhone 15, Samsung TV 55")');
      return;
    }
    if (action === 'order') {
      await setSession(phone, 'ORDER_REF', {});
      await sendWhatsAppText(phone, '📦 Entrez votre référence de commande (ex: PAY-12345) :');
      return;
    }
    if (action === 'support') {
      await sendWhatsAppText(phone, '💬 *Support Nopalou*\n\nPour nous contacter :\n📧 contact@nopalou.com\n🌐 nopalou.com\n\nNous répondons sous 24h. Merci !');
      await setSession(phone, 'IDLE', {});
      return;
    }
    // Texte libre reçu en état MENU → traiter comme recherche
    await setSession(phone, 'SEARCH_QUERY', {});
    // Traiter le texte immédiatement (sans attendre une 2e réponse)
    await handleSearchQuery(phone, text);
    return;
  }

  // ── SEARCH_QUERY ──────────────────────────────────────────────────────────
  if (state === 'SEARCH_QUERY') {
    await handleSearchQuery(phone, text);
    return;
  }

  // ── ALERT_PRODUCT ─────────────────────────────────────────────────────────
  if (state === 'ALERT_PRODUCT') {
    await setSession(phone, 'ALERT_PRICE', { phone, produit_nom: text });
    await sendWhatsAppText(phone, `🎯 À quel prix voulez-vous être alerté pour *${text}* ? (en FCFA, ex: 150000)`);
    return;
  }

  // ── ALERT_PRICE ───────────────────────────────────────────────────────────
  if (state === 'ALERT_PRICE') {
    const prix = parseInt(text.replace(/[^\d]/g, ''), 10);
    if (!prix || prix < 100) {
      await sendWhatsAppText(phone, '⚠️ Montant invalide. Entrez un prix en FCFA (ex: 150000) :');
      return;
    }
    await pool.query(
      `INSERT INTO alertes (telephone, produit_nom, prix_cible, active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT DO NOTHING`,
      [phone, context.produit_nom, prix]
    );
    await sendWhatsAppText(
      phone,
      `✅ *Alerte créée !*\n\nJe vous notifierai dès que *${context.produit_nom}* passe sous *${prixFmt(prix)}*.\n\nTapez *menu* pour revenir au menu.`
    );
    await setSession(phone, 'IDLE', {});
    return;
  }

  // ── ORDER_REF ─────────────────────────────────────────────────────────────
  if (state === 'ORDER_REF') {
    const r = await pool.query(
      `SELECT reference, statut, montant, created_at FROM paiements WHERE reference ILIKE $1 LIMIT 1`,
      [text.trim()]
    );
    if (!r.rows[0]) {
      await sendWhatsAppText(phone, `❌ Commande *${text}* introuvable. Vérifiez la référence ou tapez *menu*.`);
    } else {
      const p = r.rows[0];
      const date = new Date(p.created_at).toLocaleDateString('fr-FR');
      await sendWhatsAppText(
        phone,
        `📦 *Commande ${p.reference}*\n\nStatut : *${p.statut}*\nMontant : *${prixFmt(p.montant)}*\nDate : ${date}\n\nPour toute question, contactez contact@nopalou.com`
      );
    }
    await setSession(phone, 'IDLE', {});
    return;
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  await setSession(phone, 'IDLE', {});
  await sendMenu(phone);
}

async function handleSearchQuery(phone, query) {
  if (!query || query.length < 2) {
    await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 caractères.');
    return;
  }
  const results = await searchContent(query);
  if (!results.length) {
    await sendWhatsAppText(phone, `😕 Aucun résultat pour *"${query}"*.\n\nEssayez avec d'autres mots-clés ou tapez *menu*.`);
    await setSession(phone, 'IDLE', {});
    return;
  }

  const produits = results.filter(r => r.type === 'produit');
  const autres   = results.filter(r => r.type !== 'produit');

  // Product Messages pour les produits boutique
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
  }

  // Carousel pour annonces/immo
  if (autres.length) {
    const cards = autres.map(a => ({
      imageUrl: a.photo || null,
      title:    a.titre,
      detail:   prixFmt(a.prix),
      pageUrl:  `${SITE}/${a.type === 'immo' ? 'immo' : 'annonces'}/${a.id}`,
    }));
    const template = autres[0]?.type === 'immo' ? 'nopalou_carousel_immo' : 'nopalou_carousel_annonce';
    await sendWhatsAppCarousel(phone, template, cards).catch(async () => {
      const lines = cards.map(c => `• *${c.title}* — ${c.detail}\n${c.pageUrl}`);
      await sendWhatsAppText(phone, lines.join('\n\n'));
    });
  }

  await sendWhatsAppText(phone, `\nTapez *menu* pour revenir au menu ou faites une nouvelle recherche.`);
  await setSession(phone, 'IDLE', {});
}

module.exports = { handleIncoming };
```

- [ ] **Step 2 : Vérifier syntaxe**

```bash
node -e "require('./backend/services/whatsapp-chatbot')" && echo "OK"
```
Résultat attendu : `OK`

- [ ] **Step 3 : Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat: chatbot WhatsApp — machine à états, menu interactif, recherche, alertes, commandes"
```

---

## Task 7 : Brancher le chatbot dans le webhook

**Files:**
- Modify: `backend/routes/whatsapp.js`

**Interfaces:**
- Consomme: `handleIncoming` depuis `../services/whatsapp-chatbot`

- [ ] **Step 1 : Remplacer le TODO dans le POST webhook**

Dans `backend/routes/whatsapp.js`, remplacer le bloc `if (entry.messages)` par :

```javascript
  if (entry.messages) {
    const msg = entry.messages[0];
    require('../services/whatsapp-chatbot').handleIncoming(msg).catch(err =>
      console.error('[WHATSAPP CHATBOT]', err.message)
    );
  }
```

- [ ] **Step 2 : Tester le webhook avec un message simulé**

```bash
curl -s -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "wamid.test123",
            "from": "221771234567",
            "type": "text",
            "text": { "body": "bonjour" }
          }]
        }
      }]
    }]
  }'
```
Résultat attendu : `OK` (status 200) immédiatement. Dans les logs :
```
[WHATSAPP] Credentials manquants — ignoré  (read receipt)
[WHATSAPP] Credentials manquants — ignoré  (typing)
[WHATSAPP] Credentials manquants — ignoré  (menu interactif)
```

- [ ] **Step 3 : Tester la déduplication (même message_id)**

Renvoyer la même requête curl. Dans les logs : aucune nouvelle ligne WhatsApp (message ignoré silencieusement).

- [ ] **Step 4 : Tester le flow recherche**

```bash
curl -s -X POST http://localhost:3000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "id": "wamid.test456",
            "from": "221771234567",
            "type": "interactive",
            "interactive": {
              "type": "list_reply",
              "list_reply": { "id": "search", "title": "Rechercher" }
            }
          }]
        }
      }]
    }]
  }'
```
Résultat attendu : 200 immédiat. Vérifier en DB que la session est passée à `SEARCH_QUERY` :
```bash
psql $DATABASE_URL -c "SELECT phone, state FROM whatsapp_sessions;"
```

- [ ] **Step 5 : Commit**

```bash
git add backend/routes/whatsapp.js
git commit -m "feat: webhook POST branché sur le chatbot — dedup + handleIncoming"
```

---

## Task 8 : Vérification alertes DB + colonne telephone

**Files:**
- Modify: `backend/migrate-inline.js` (si besoin)

**Interfaces:**
- Consomme: table `alertes` — s'assurer que la colonne `telephone` existe et que la colonne `produit_nom` existe (pour les alertes WhatsApp sans produit_id)

- [ ] **Step 1 : Vérifier la structure de la table alertes**

```bash
psql $DATABASE_URL -c "\d alertes"
```
Vérifier que les colonnes `telephone`, `produit_nom`, `prix_cible`, `active` existent.

- [ ] **Step 2 : Si produit_nom manquant — ajouter dans migrate-inline.js**

Si la colonne `produit_nom` n'existe pas (les alertes existantes référencent un `produit_id`), ajouter dans `migrate-inline.js` après les tables whatsapp :

```sql
      DO $$ BEGIN
        ALTER TABLE alertes ADD COLUMN IF NOT EXISTS produit_nom TEXT;
      EXCEPTION WHEN others THEN NULL; END $$;
```

- [ ] **Step 3 : Relancer les migrations**

```bash
npm run migrate
```
Résultat attendu : pas d'erreur

- [ ] **Step 4 : Vérifier que la table paiements a la colonne reference**

```bash
psql $DATABASE_URL -c "\d paiements"
```
Vérifier les colonnes `reference`, `statut`, `montant`, `created_at`.

- [ ] **Step 5 : Commit (si modification)**

```bash
git add backend/migrate-inline.js
git commit -m "fix: migration — colonne produit_nom dans alertes pour alertes WhatsApp sans produit_id"
```

---

## Récapitulatif des prérequis Meta (hors code)

Ces étapes sont à faire dans Meta Business Manager **avant le déploiement en production** :

1. **WhatsApp Business Account (WABA)** actif et vérifié
2. **Numéro de téléphone dédié** enregistré (pas le numéro personnel)
3. **Catalogue Meta Commerce** créé et lié au WABA → noter le `catalog_id`
4. **Templates à soumettre** (4 templates, approbation ~24h) :
   - `nopalou_carousel_annonce` — type CAROUSEL — variables : titre `{{1}}`, prix `{{2}}`, bouton URL suffixe `{{3}}`
   - `nopalou_carousel_immo` — même structure
   - `nopalou_carousel_telecom` — même structure
   - `nopalou_fiche_texte` — type TEXT — variables : titre `{{1}}`, détail `{{2}}`, URL `{{3}}`
5. **Webhook configuré** dans Meta Developer Console :
   - URL : `https://ton-backend.onrender.com/api/whatsapp/webhook`
   - Verify Token : valeur de `WHATSAPP_VERIFY_TOKEN`
   - Champs souscrits : `messages`
