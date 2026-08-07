# OpenSpec 05 : Webhooks & Clés API Marchands (Developer Portal)

## 🎯 Objectif
Permettre aux marchands et développeurs d'intégrer Nopalou avec leurs propres systèmes externes (CRM, ERP, Zapier, Make) grâce à :
1. Un système de **Clés API Marchands** (`nopalou_sk_live_...`) permettant un accès sécurisé aux données de la boutique.
2. Un système de **Webhooks Temps Réel** notifiant les serveurs tiers lors d'événements clés (`order.created`, `stock.low`), sécurisé par une signature **HMAC-SHA256** (`X-Nopalou-Signature`).

---

## 🗄️ Schéma de Base de Données (PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS boutique_api_keys (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  nom          VARCHAR(100) NOT NULL,
  key_prefix   VARCHAR(20) NOT NULL,
  key_hash     VARCHAR(128) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_api_keys_bq ON boutique_api_keys(boutique_id);

CREATE TABLE IF NOT EXISTS boutique_webhooks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boutique_id  UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  url          VARCHAR(500) NOT NULL,
  secret       VARCHAR(64) NOT NULL,
  events       TEXT[] NOT NULL DEFAULT '{"order.created"}',
  actif        BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhooks_bq ON boutique_webhooks(boutique_id, actif);
```

---

## 🌐 API Endpoints

### 1. `POST /api/boutiques/:id/api-keys` (Marchand Auth)
Génération d'une nouvelle clé API.
* **Payload (JSON)** : `{ "nom": "Intégration ERP Dakar" }`
* **Response HTTP 201 Created** :
```json
{
  "success": true,
  "key_id": "...",
  "api_key": "nopalou_sk_live_8f3a9b1c...",
  "message": "Conservez cette clé en lieu sûr. Elle ne sera plus réaffichée."
}
```

### 2. `GET /api/boutiques/:id/api-keys` & `DELETE /api/boutiques/:id/api-keys/:keyId`
Gestion des clés API (liste et révocation).

### 3. `POST /api/boutiques/:id/webhooks` (Marchand Auth)
Enregistrement d'une URL de Webhook.
* **Payload (JSON)** :
```json
{
  "url": "https://mon-crm.com/api/webhooks/nopalou",
  "events": ["order.created", "stock.low"]
}
```
* **Response HTTP 201 Created** :
```json
{
  "success": true,
  "webhook": {
    "id": "...",
    "url": "https://mon-crm.com/api/webhooks/nopalou",
    "secret": "whsec_...",
    "events": ["order.created", "stock.low"]
  }
}
```

---

## 🔐 Sécurisation des Webhooks (HMAC-SHA256)

Chaque requête HTTP POST envoyée au webhook contient l'en-tête :
* `X-Nopalou-Signature: t=1770418500,v1=a8f3...`
Calculé via `crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')`.

---

## 🧪 Scénarios de Test Automatisés (TDD)

1. **Test d'Intégration API (Jest / Supertest)** : `tests/unit/spec-05-webhooks-api-keys.test.js`
   * Génération de clé API avec préfixe `nopalou_sk_live_` (HTTP 201).
   * Révocation d'une clé API (HTTP 200).
   * Enregistrement d'un webhook endpoint (HTTP 201).
   * Calcul exact de la signature HMAC-SHA256.
