# OpenSpec 02 : Checkout Web 1-Page Unifié & Upsell Post-Ajout Panier

## 🎯 Objectif
1. Offrir aux acheteurs un **Checkout Web 1-Page ultra-rapide** (formulaire express avec nom, téléphone, adresse, mode de paiement Wave / Orange Money / Cash) sans imposer de redirection ou d'échange WhatsApp.
2. Augmenter le **Panier Moyen (AOV)** des marchands grâce à un bloc **Upsell & Cross-Sell** proposant des articles complémentaires au moment de l'ajout au panier ou de la validation.

---

## 🌐 API Endpoints

### 1. `POST /api/commandes/express`
Soumission directe d'une commande web 1-page.

* **Request Body (JSON)** :
```json
{
  "boutique_id": "9b1deb4d-3b7d-416b-9f47-a87799d21e8a",
  "client_nom": "Amadou Diallo",
  "client_telephone": "771234567",
  "client_adresse": "Mermoz, Dakar",
  "methode_paiement": "wave",
  "note": "Livrer avant 18h",
  "articles": [
    { "produit_id": "4e4c3e49-9fe9-4557-ae16-fd54d2d2e535", "quantite": 2, "prix_unitaire": 15000 }
  ],
  "frais_livraison": 1500
}
```
* **Response HTTP 201 Created** :
```json
{
  "succes": true,
  "reference": "CMD-2026-9814",
  "montant_total": 31500,
  "statut": "en_attente",
  "message": "Votre commande a été enregistrée avec succès."
}
```
* **Validation (HTTP 400 Bad Request)** : Rejet si `client_nom`, `client_telephone` ou `articles` est manquant/vide.

### 2. `GET /api/boutiques/:id/produits/:prodId/cross-sell`
Obtention des suggestions d'articles complémentaires pour le cross-selling.

* **Response HTTP 200 OK** :
```json
{
  "produits": [
    { "id": "...", "nom": "Coque en Silicone", "prix": 3000, "images": ["..."] },
    { "id": "...", "nom": "Verre Trempé 9H", "prix": 2000, "images": ["..."] }
  ]
}
```

---

## 🧪 Scénarios de Test Automatisés (TDD)

1. **Test d'Intégration API (Jest / Supertest)** : `tests/unit/spec-02-checkout-upsell.test.js`
   * Valider la création d'une commande express via `POST /api/commandes/express` (référence unique, calcul du montant total, status HTTP 201).
   * Rejet des données invalides (HTTP 400 si téléphone ou articles manquant).
   * Récupération des suggestions cross-sell via `GET /api/boutiques/:id/produits/:prodId/cross-sell` (HTTP 200).
