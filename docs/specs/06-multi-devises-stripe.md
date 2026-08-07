# OpenSpec 06 : Multi-Devises (XOF / EUR / USD) & Simulation Carte Bancaire Stripe

## 🎯 Objectif
Permettre aux boutiques e-commerce d'afficher leurs prix en plusieurs devises (**XOF FCFA**, **EUR €**, **USD $**) avec conversion automatique en temps réel selon les taux de change officiels, et simuler l'encaissement par Carte Bancaire via un module **Stripe Checkout** sécurisé.

---

## 🗄️ Schéma de Base de Données (PostgreSQL)

```sql
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS devise_defaut VARCHAR(10) DEFAULT 'XOF';
```

---

## 🌐 API Endpoints

### 1. `GET /api/devises/taux` (Public)
Retourne les taux de conversion officiels par rapport au XOF.
* **Response HTTP 200 OK** :
```json
{
  "base": "XOF",
  "taux": {
    "XOF": 1,
    "EUR": 0.001524,
    "USD": 0.001667
  },
  "conversions_inverses": {
    "1_EUR_EN_XOF": 655.957,
    "1_USD_EN_XOF": 600.00
  }
}
```

### 2. `PUT /api/boutiques/:id/devise` (Marchand Auth)
Modification de la devise principale de la boutique.
* **Payload (JSON)** : `{ "devise_defaut": "EUR" }`

### 3. `POST /api/paiements/stripe/simuler` (Public Checkout)
Simulation sécurisée de paiement par Carte Bancaire (Stripe Test Mode).
* **Payload (JSON)** :
```json
{
  "boutique_id": "9b1deb4d-3b7d-416b-9f47-a87799d21e8a",
  "montant": 25000,
  "devise": "XOF",
  "card_number": "4242424242424242",
  "exp_month": 12,
  "exp_year": 2028,
  "cvc": "123"
}
```
* **Response HTTP 200 OK** :
```json
{
  "success": true,
  "transaction_id": "txn_stripe_sim_8f3a9b1c2d3e",
  "statut": "succeeded",
  "montant_paye": 25000,
  "devise": "XOF",
  "message": "Paiement par carte bancaire approuvé avec succès (Mode Simulation Stripe)."
}
```
* **Response HTTP 400 Bad Request** : Si le numéro de carte est invalide ou expiré (ex: cartes de test d'échec Stripe).

---

## 🧪 Scénarios de Test Automatisés (TDD)

1. **Test d'Intégration API (Jest / Supertest)** : `tests/unit/spec-06-multi-devises-stripe.test.js`
   * Récupération des taux de change (HTTP 200).
   * Mise à jour de la devise par le marchand (HTTP 200).
   * Simulation de paiement Carte Bancaire réussi (HTTP 200).
   * Rejet d'un numéro de carte décliné ou invalide (HTTP 400).
