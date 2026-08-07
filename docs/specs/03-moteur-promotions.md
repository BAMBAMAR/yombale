# OpenSpec 03 : Moteur de Promotions & Codes Promo

## 🎯 Objectif
Permettre aux marchands de créer et gérer des **codes promo (coupons de réduction)** pour leur boutique (pourcentage `%`, montant fixe `FCFA`, ou livraison offerte) avec des conditions d'achat minimales et des limites d'utilisation, et permettre aux acheteurs de les valider en 1-clic lors du checkout.

---

## 🗄️ Schéma de Base de Données (PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS boutique_promotions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boutique_id        UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
  code               VARCHAR(50) NOT NULL,
  type_remise        VARCHAR(30) NOT NULL CHECK (type_remise IN ('pourcentage', 'fixe', 'livraison_offerte')),
  valeur             NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_achat          NUMERIC(12,2) DEFAULT 0,
  limite_utilisation INT DEFAULT NULL,
  fois_utilise       INT DEFAULT 0,
  actif              BOOLEAN DEFAULT TRUE,
  debut              TIMESTAMPTZ DEFAULT NOW(),
  fin                TIMESTAMPTZ DEFAULT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_boutique_code ON boutique_promotions(boutique_id, code);
```

---

## 🌐 API Endpoints

### 1. `POST /api/boutiques/:id/promotions` (Marchand Auth)
Création d'un nouveau code promo.
* **Payload (JSON)** :
```json
{
  "code": "SOLDE20",
  "type_remise": "pourcentage",
  "valeur": 20,
  "min_achat": 10000,
  "limite_utilisation": 100
}
```

### 2. `GET /api/boutiques/:id/promotions` (Marchand Auth)
Liste des codes promo de la boutique.

### 3. `DELETE /api/boutiques/:id/promotions/:promoId` (Marchand Auth)
Suppression d'un code promo.

### 4. `POST /api/promotions/valider` (Public Checkout)
Validation d'un code promo lors de la commande.
* **Payload (JSON)** :
```json
{
  "boutique_id": "9b1deb4d-3b7d-416b-9f47-a87799d21e8a",
  "code": "SOLDE20",
  "total_panier": 25000
}
```
* **Response HTTP 200 OK** :
```json
{
  "valide": true,
  "code": "SOLDE20",
  "type_remise": "pourcentage",
  "valeur": 20,
  "montant_reduction": 5000,
  "nouveau_total": 20000
}
```
* **Response HTTP 400 Bad Request** : Si le code est expiré, inexistant, inactif, ou si `total_panier < min_achat`.

---

## 🧪 Scénarios de Test Automatisés (TDD)

1. **Test d'Intégration API (Jest / Supertest)** : `tests/unit/spec-03-promotions.test.js`
   * Création et liste de codes promo par le marchand (HTTP 201).
   * Validation d'un code promo en pourcentage (ex: 20% sur 25 000 = 5 000 FCFA de réduction).
   * Validation d'un code promo à montant fixe (ex: 3 000 FCFA de réduction).
   * Rejet d'un code promo si `total_panier < min_achat` (HTTP 400).
   * Rejet d'un code promo inactif ou ayant dépassé la limite d'utilisation (HTTP 400).
