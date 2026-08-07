# OpenSpec 01 : Mode Switcher Admin (Pure Player vs Hybride POS)

## 🎯 Objectif
Permettre à un marchand de basculer sa boutique entre 2 modes d'exploitation :
1. `hybride_pos` (Mode par défaut) : Affiche tous les outils d'un commerce physique (Caisse enregistreuse POS, stickers codes-barres EAN-13, carnet de dettes client, clôtures de caisse Z).
2. `pure_player` (Mode E-Commerce Web) : Masque totalement les outils POS physiques pour offrir une interface épurée, 100% axée sur les commandes web, la livraison, le marketing et l'analytics.

---

## 🗄️ Schéma de Base de Données (PostgreSQL)

### Modification de la table `boutiques`
```sql
ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS mode_fonctionnement VARCHAR(30) DEFAULT 'hybride_pos';
```
Valeurs autorisées : `'hybride_pos'`, `'pure_player'`.

---

## 🌐 API Endpoints

### 1. `PUT /api/boutiques/:id/mode`
Modification du mode de fonctionnement de la boutique.

* **Headers** : `Authorization: Bearer <token_marchand>`
* **Request Body** :
```json
{
  "mode_fonctionnement": "pure_player"
}
```
* **Response HTTP 200 OK** :
```json
{
  "succes": true,
  "message": "Mode d'exploitation mis à jour avec succès.",
  "mode_fonctionnement": "pure_player"
}
```
* **Validation Errors (HTTP 400 Bad Request)** : Si la valeur transmise n'est ni `'hybride_pos'` ni `'pure_player'`.

### 2. `GET /api/boutiques/:id`
Doit inclure la propriété `mode_fonctionnement` dans l'objet boutique retourné.

---

## 🖥️ UX & Interface Dashboard Vendeur

* **Composant Paramètres Boutique** : Ajout d'une carte d'option interactive "Mode d'Exploitation de la Boutique" avec 2 boutons de sélection radio/capsule (`🏪 Mode Hybride (Magasin + Web)` vs `⚡ Mode Pure Player (E-Commerce Web)`).
* **Affichage Conditionnel Dashboard** :
  * Si `mode_fonctionnement === 'pure_player'` :
    * Masquer les boutons `🖥️ Caisse enregistreuse POS`, `🏷️ Impression stickers EAN-13 par lot`, et `📒 Carnet de dettes client`.
    * Mettre en avant le bloc **Ventes Web, Commandes & Expéditions**.

---

## 🧪 Scénarios de Test Automatisés

1. **Test d'Intégration API (Jest / Supertest)** : `tests/unit/spec-01-mode-switch.test.js`
   * Vérifier que `mode_fonctionnement` vaut `'hybride_pos'` par défaut à la création de la boutique.
   * Vérifier qu'un `PUT` vers `/api/boutiques/:id/mode` avec `'pure_player'` met à jour la base de données.
   * Vérifier le rejet HTTP 400 avec une valeur invalide (ex: `'invalid_mode'`).

2. **Test E2E UI (Playwright)** : `tests/e2e/spec-01-mode-switch.spec.ts`
   * Simuler la bascule en mode `pure_player` et vérifier le masquage instantané des éléments POS dans l'UI du vendeur.
