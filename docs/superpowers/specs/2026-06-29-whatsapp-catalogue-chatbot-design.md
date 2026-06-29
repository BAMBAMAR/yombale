# WhatsApp Nopalou — Niveau 3 Catalogue + Niveau 4 Chatbot

**Date :** 2026-06-29
**Auteur :** BAMBAMAR
**Statut :** Approuvé

---

## Contexte

Nopalou dispose déjà d'un service WhatsApp basique (Niveau 1-2) :
- `backend/services/whatsapp.js` — envoi texte libre via Meta Cloud API
- Notifications sortantes : alerte prix, confirmation paiement, modération immo
- Liens wa.me enrichis sur les pages annonces/immo/boutiques

Ce document couvre l'implémentation du Niveau 3 (Catalogue) et du Niveau 4 (Chatbot) en utilisant les meilleures pratiques Meta Cloud API 2024-2025.

---

## Principe directeur : Webhook unifié

Un seul endpoint gère tout le trafic WhatsApp, évitant tout reconfiguration Meta entre les deux niveaux :

```
GET  /api/whatsapp/webhook   ← handshake Meta (vérification hub.verify_token)
POST /api/whatsapp/webhook   ← messages entrants (chatbot) + statuts livraison
POST /api/whatsapp/send      ← envoi manuel déclenché par bouton frontend
```

---

## Section 1 — Architecture & Sécurité

### Nouveaux fichiers backend

| Fichier | Rôle |
|---|---|
| `backend/routes/whatsapp.js` | Route Express — webhook + send |
| `backend/services/whatsapp-catalog.js` | Sync produits vers Meta Commerce Catalog |
| `backend/services/whatsapp-chatbot.js` | Machine à états chatbot |

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `backend/services/whatsapp.js` | +`sendWhatsAppTemplate()`, `sendWhatsAppCarousel()`, `sendWhatsAppInteractive()`, `sendWhatsAppProduct()` |
| `backend/services/notifications.js` | Extension `notifierModerationImmo()` avec Carousel |
| `backend/routes/boutiques.js` | Appel `syncProduit()` sur création/modification/suppression |
| `backend/routes/annonces.js` | Appel carousel à la validation admin |
| `backend/app.js` | Montage route `/api/whatsapp` |
| `backend/migrate-inline.js` | +2 tables : `whatsapp_sessions`, `whatsapp_processed_messages` |
| `frontend-next/src/app/annonces/[id]/page.tsx` | Composant `<BoutonWhatsApp>` |
| `frontend-next/src/app/immo/[id]/page.tsx` | Composant `<BoutonWhatsApp>` |
| `frontend-next/src/app/boutiques/[id]/produits/[produitId]/page.tsx` | Product Message WhatsApp |
| `frontend-next/src/components/BoutonWhatsApp.tsx` | Nouveau composant |
| `frontend-next/src/components/ModalWhatsApp.tsx` | Modal saisie numéro (non-connecté) |

### Sécurité webhook

Chaque POST entrant est vérifié via signature HMAC-SHA256 :
```
X-Hub-Signature-256: sha256=<HMAC(WHATSAPP_APP_SECRET, body)>
```
Rejet 403 si signature invalide ou absente.

### Variables d'environnement (ajouts)

```env
# .env (backend)
WHATSAPP_VERIFY_TOKEN=       # Token arbitraire pour handshake Meta
WHATSAPP_APP_SECRET=         # Secret app Meta pour vérification HMAC
WHATSAPP_CATALOG_ID=         # ID catalogue Meta Commerce
WHATSAPP_BUSINESS_ACCOUNT_ID= # WABA ID pour l'API catalogue

# Déjà existants (inchangés)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_TOKEN=
```

---

## Section 2 — Niveau 3 : Catalogue

### 2.1 Meta Commerce Catalog (produits boutique)

Les produits boutique Nopalou sont synchronisés dans un catalogue Meta Business via l'API Graph :

```
POST /{catalog_id}/products
```

Payload par produit :
```json
{
  "retailer_id": "nopalou-produit-{id}",
  "name": "Nom du produit",
  "description": "Description courte",
  "price": 150000,
  "currency": "XOF",
  "availability": "in stock",
  "url": "https://nopalou.com/boutiques/{slug}/produits/{id}",
  "image_url": "https://res.cloudinary.com/..."
}
```

**`backend/services/whatsapp-catalog.js`** expose :
- `syncProduit(produit)` — crée ou met à jour (upsert via `retailer_id`)
- `deleteProduit(produitId)` — retire du catalogue Meta
- `syncAllProduits()` — sync complète (utilisé au démarrage ou manuellement)

**Déclencheurs :**
- Création produit boutique → `syncProduit()`
- Modification produit boutique → `syncProduit()`
- Suppression produit boutique → `deleteProduit()`

L'utilisateur WhatsApp reçoit une **Product Message** native (carte avec image, prix, bouton "Voir le produit") plutôt qu'un simple texte.

### 2.2 Carousel Templates (annonces + immo + télécom)

Pour les contenus sans catalogue Meta, on utilise les **Carousel Templates** Meta (jusqu'à 10 cartes) :

Structure d'une carte :
- En-tête : IMAGE (URL Cloudinary ou photo de l'annonce)
- Corps : titre + prix + localisation (pour immo)
- Bouton : URL vers la page Nopalou

**Templates à créer dans Meta Business Manager :**

| Nom template | Domaine | Fallback si pas de photo |
|---|---|---|
| `nopalou_carousel_annonce` | Annonces | `nopalou_fiche_texte` |
| `nopalou_carousel_immo` | Immo | `nopalou_fiche_texte` |
| `nopalou_carousel_telecom` | Télécom | `nopalou_fiche_texte` |
| `nopalou_fiche_texte` | Tous | — (c'est le fallback) |

Variables par carte : `{{1}}` titre, `{{2}}` prix/détails, `{{3}}` URL.

### 2.3 Bouton "Recevoir par WhatsApp" (frontend)

Composant `<BoutonWhatsApp type="annonce|immo|produit|telecom" id={id} />` ajouté sur les pages de détail.

**Comportement selon l'état de connexion :**

```
Connecté    → POST /api/whatsapp/send { type, id }
              (numéro récupéré depuis le compte)
              → Toast "Fiche envoyée sur WhatsApp ✓"

Non-connecté → Ouvre <ModalWhatsApp>
               Champ numéro + validation /^(\+221|221)?[0-9]{9}$/
               → POST /api/whatsapp/send { type, id, phone }
               → Toast "Fiche envoyée sur WhatsApp ✓"
```

### 2.4 Envoi automatique à la validation admin

Extension de `notifications.js` :

- **Annonce validée** → carousel de l'annonce + 2 annonces similaires envoyé au déposant
- **Immo validé** → carousel de l'annonce immo envoyé au déposant
- **Immo rejeté** → message texte existant (inchangé)

### 2.5 Route `/api/whatsapp/send`

```
POST /api/whatsapp/send
Auth: verifierToken (optionnel — si non connecté, phone requis dans le body)
Body: { type: "annonce"|"immo"|"produit"|"telecom", id: number, phone?: string }
```

1. Charge l'entité depuis la DB
2. Si `type === "produit"` → envoie Product Message (catalogue Meta)
3. Sinon → choisit carousel (photo présente) ou texte (pas de photo)
4. Retourne `{ success: true }`

---

## Section 3 — Niveau 4 : Chatbot

### 3.1 Tables PostgreSQL (migration idempotente)

```sql
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  phone         TEXT PRIMARY KEY,
  state         TEXT NOT NULL DEFAULT 'IDLE',
  context       JSONB NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_processed_messages (
  message_id    TEXT PRIMARY KEY,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nettoyage auto des messages traités > 24h (évite la croissance infinie)
CREATE INDEX IF NOT EXISTS idx_wpm_processed_at
  ON whatsapp_processed_messages(processed_at);
```

### 3.2 Machine à états

```
IDLE
  └─ tout message → envoie menu interactif → MENU

MENU
  ├─ "Rechercher" → SEARCH_QUERY
  ├─ "Annonces immo" → IMMO_FILTERS
  ├─ "Offres télécom" → TELECOM_LIST (liste les offres du moment)
  ├─ "Alertes prix" → ALERT_PHONE
  ├─ "Suivre commande" → ORDER_REF
  └─ "Support" → SUPPORT (message + email support)

SEARCH_QUERY
  └─ texte libre → recherche PostgreSQL full-text → SEARCH_RESULTS
       ├─ résultats → carousel 3 items → IDLE
       └─ rien → "Aucun résultat" + retour MENU

IMMO_FILTERS
  └─ liste interactive (Type: Maison/Appart/Terrain) → IMMO_LOCATION
       └─ texte ville/quartier → résultats → IDLE

ALERT_PHONE
  └─ numéro confirmé → ALERT_PRODUCT
       └─ nom produit → ALERT_PRICE
            └─ prix cible → INSERT alertes → "Alerte créée ✓" → IDLE

ORDER_REF
  └─ référence commande → lookup DB → statut → IDLE
```

### 3.3 Menu interactif (Interactive List Message)

```
🛍️ *Bienvenue sur Nopalou !*
Comment puis-je vous aider ?

[Sélectionner ▾]
  Section "Découvrir"
  • 🔍 Rechercher un produit
  • 🏠 Annonces immobilières
  • 📱 Offres télécom

  Section "Mon compte"
  • 🔔 Créer une alerte prix
  • 📦 Suivre ma commande
  • 💬 Contacter le support
```

### 3.4 UX — 3 mécanismes de qualité

**1. Read receipt** (dès réception du message) :
```json
POST /messages
{ "messaging_product": "whatsapp", "status": "read", "message_id": "..." }
```

**2. Typing indicator** (avant chaque réponse, 1.5s) :
```json
POST /messages
{ "messaging_product": "whatsapp", "recipient_type": "individual",
  "to": "...", "type": "action", "action": "typing_on" }
```

**3. Déduplication** : avant tout traitement, vérification en DB :
```sql
INSERT INTO whatsapp_processed_messages(message_id) VALUES($1)
ON CONFLICT DO NOTHING
RETURNING message_id
```
Si aucune ligne retournée → message déjà traité, on ignore.

### 3.5 Recherche full-text PostgreSQL

```sql
SELECT p.id, p.nom, p.prix, b.slug AS boutique_slug
FROM produits p
JOIN boutiques b ON b.id = p.boutique_id
WHERE to_tsvector('french', p.nom || ' ' || COALESCE(p.description,''))
      @@ plainto_tsquery('french', $1)
UNION ALL
SELECT a.id, a.titre, a.prix, NULL
FROM annonces a
WHERE to_tsvector('french', a.titre || ' ' || COALESCE(a.description,''))
      @@ plainto_tsquery('french', $1)
LIMIT 3
```

Résultats → Carousel Template ou Product Messages selon le type.

### 3.6 Webhook handler (dispatch)

```javascript
// backend/routes/whatsapp.js
router.post('/webhook', verifyHmac, async (req, res) => {
  res.sendStatus(200); // Toujours 200 immédiatement (exigence Meta)

  const entry = req.body.entry?.[0]?.changes?.[0]?.value;
  if (!entry) return;

  // Messages entrants
  if (entry.messages) {
    const msg = entry.messages[0];
    await handleIncoming(msg); // async, non-bloquant
  }

  // Statuts de livraison → logs seulement
  if (entry.statuses) {
    console.log('[WHATSAPP] Statut:', entry.statuses[0].status);
  }
});
```

**Important :** le `res.sendStatus(200)` est envoyé AVANT le traitement — Meta considère le webhook en timeout si pas de réponse dans 20s.

---

## Périmètre et limites

**Inclus :**
- Webhook unifié (GET handshake + POST entrant/sortant)
- Meta Commerce Catalog sync (produits boutique)
- Carousel Templates (annonces + immo + télécom)
- Bouton "Recevoir par WhatsApp" + modal (frontend Next.js)
- Chatbot : menu interactif, recherche, alertes prix, suivi commande, support
- Read receipts + typing indicator + déduplication

**Exclus (roadmap future) :**
- Panier WhatsApp natif (checkout intégré Meta Pay — non disponible au Sénégal)
- WhatsApp Flows (formulaires riches intégrés dans le chat)
- Notifications push périodiques / newsletters WhatsApp
- Multilangue (wolof, anglais) — uniquement français pour l'instant

---

## Prérequis Meta Business

Avant le déploiement :
1. Compte Meta Business Manager vérifié
2. WhatsApp Business Account (WABA) actif
3. Numéro de téléphone dédié enregistré
4. Catalogue Meta Commerce créé et lié au WABA
5. Templates soumis et approuvés (~24h) : `nopalou_carousel_annonce`, `nopalou_carousel_immo`, `nopalou_carousel_telecom`, `nopalou_fiche_texte`
6. Webhook configuré dans Meta Developer Console avec `WHATSAPP_VERIFY_TOKEN`
