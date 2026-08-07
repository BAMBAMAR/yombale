# OpenSpec 04 : Pixels de Tracking & Mesure ROAS (Meta, TikTok, GA4)

## 🎯 Objectif
Permettre aux marchands de configurer les identifiants de leurs **Pixels publicitaires** (**Meta Facebook Pixel**, **TikTok Pixel**, **Google Analytics GA4**) dans les paramètres de leur boutique, et déclencher automatiquement les événements e-commerce standards (`PageView`, `AddToCart`, `InitiateCheckout`, `Purchase`) sur leur vitrine pour mesurer l'efficacité de leurs publicités (ROAS).

---

## 🗄️ Schéma de Base de Données (PostgreSQL)

```sql
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS meta_pixel_id VARCHAR(50);
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS tiktok_pixel_id VARCHAR(50);
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS ga4_id VARCHAR(50);
```

---

## 🌐 API Endpoints

### 1. `PUT /api/boutiques/:id/pixels` (Marchand Auth)
Enregistrement des IDs de Pixels publicitaires.
* **Payload (JSON)** :
```json
{
  "meta_pixel_id": "123456789012345",
  "tiktok_pixel_id": "C1234567890ABC",
  "ga4_id": "G-XYZ1234567"
}
```
* **Response HTTP 200 OK** :
```json
{
  "success": true,
  "pixels": {
    "meta_pixel_id": "123456789012345",
    "tiktok_pixel_id": "C1234567890ABC",
    "ga4_id": "G-XYZ1234567"
  }
}
```

### 2. `GET /api/boutiques/:id/pixels/public` (Public Storefront)
Lecture publique des identifiants de Pixels pour l'injection côté navigateur.
* **Response HTTP 200 OK** :
```json
{
  "meta_pixel_id": "123456789012345",
  "tiktok_pixel_id": "C1234567890ABC",
  "ga4_id": "G-XYZ1234567"
}
```

---

## 🖥️ Intégration Frontend Storefront (Next.js)

* composant **`TrackingPixels.tsx`** :
  * Injected dans la page produit/vitrine (`/boutiques/[id]`).
  * Déclenche de manière asynchrone les scripts officiels de tracking :
    * Meta Facebook Pixel (`fbq('track', 'Purchase', { value: 15000, currency: 'XOF' })`)
    * TikTok Pixel (`ttq.track('CompletePayment', { value: 15000, currency: 'XOF' })`)
    * Google Analytics 4 (`gtag('event', 'purchase', { value: 15000, currency: 'XOF' })`)

---

## 🧪 Scénarios de Test Automatisés (TDD)

1. **Test d'Intégration API (Jest / Supertest)** : `tests/unit/spec-04-pixels.test.js`
   * Mise à jour des pixels par le marchand via `PUT /api/boutiques/:id/pixels` (HTTP 200).
   * Récupération publique des pixels via `GET /api/boutiques/:id/pixels/public` (HTTP 200).
   * Rejet d'un utilisateur non autorisé (HTTP 403).
