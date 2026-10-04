# Baseline de Régression Obligatoire Nopalou

Ce document définit les grappes de tests d'impact à rejouer systématiquement dès qu'une modification ou un correctif est apporté à un composant de la plateforme. Toute correction ne peut être validée par les agents suivants que si sa baseline de régression complète a été rejouée avec succès.

---

## 1. Grappes de Non-Régression par Périmètre Modifié

### GRAPPE A : Panier, Frais de Livraison & Tunnel de Commande
* **Déclencheur** : Modification de `DrawerCart.tsx`, `useDrawerCartCheckout.ts`, `commande-service.js`, `comptabilite.js` ou des routes `/api/comptabilite/:id/commandes`.
* **Tests à rejouer impérativement** :
  1. `TEST-007` : Vérification du libellé exact sur "Frais de livraison à convenir" (absence de faux libellé "Gratuit").
  2. `TEST-008` : Création de commande panier et absence de crash `ReferenceError: commande is not defined`.
  3. `TEST-009` : Initialisation des flux de paiement Wave et Orange Money avec génération d'URL.
  4. `TEST-013` : Réception de la notification WhatsApp commerçant avec bouton 1-clic.
  5. `TEST-005` : Contrôle d'isolation multi-tenant (impossibilité de créer une commande au nom d'une autre boutique).

### GRAPPE B : Caisse Enregistreuse POS, Stock & Mode Hors-Ligne
* **Déclencheur** : Modification de `PosPanierSidebar.tsx`, `usePosOfflineSync.ts`, `sw.ts`, `boutiques-pos.js` ou de la table `ventes`.
* **Tests à rejouer impérativement** :
  1. `TEST-010` : Ouverture de session caisse, saisie fond de caisse et clôture Z avec calcul d'écart.
  2. `TEST-011` : Encaissement hors-ligne en simulation coupure réseau, persistance IndexedDB et rejeu automatique post-reconnexion.
  3. `TEST-012` : Saisie vocale Wolof/Français à la caisse et injection correcte de la ligne article.
  4. `TEST-005` : Contrôle d'isolation multi-tenant (un caissier ne peut pas clôturer la session d'un autre magasin).

### GRAPPE C : Authentification, Tokens JWT & Gestion des Profils
* **Déclencheur** : Modification de `auth.js`, `admin-rbac.js`, `tenantSecurity.js`, ou de la table `utilisateurs`.
* **Tests à rejouer impérativement** :
  1. `TEST-001` : Inscription avec normalisation d'email et format international de téléphone.
  2. `TEST-002` : Invalidation immédiate de session JWT lors de la déconnexion (`jwt_version`).
  3. `TEST-003` : Rejet des tokens temporaires (reset/verify) utilisés comme jetons de session.
  4. `TEST-004` : Suppression autonome de compte avec période de grâce de 30 jours et restauration.
  5. `TEST-005` : Protection anti-IDOR sur les ressources marchandes.

### GRAPPE D : Chatbot WhatsApp & Messagerie Automatisée
* **Déclencheur** : Modification de `whatsapp-chatbot.js`, `whatsapp.js`, `immo-chatbot.js` ou des crons de relance.
* **Tests à rejouer impérativement** :
  1. `TEST-013` : Déduplication stricte des webhooks Meta via `whatsapp_processed_messages`.
  2. `TEST-008` : Création de commande initiée par message conversationnel.
  3. `TEST-012` : Interprétation d'un message audio ou d'une commande vocale transmise par WhatsApp.

### GRAPPE E : ERP Immobilier & Gestion Locative
* **Déclencheur** : Modification de `locatif-immo.js`, `biens.js`, `agence-documents-pdf.js` ou `tenantSecurityImmo.js`.
* **Tests à rejouer impérativement** :
  1. `TEST-006` : Isolation multi-tenant stricte entre agences immobilières concurrentes.
  2. `TEST-014` : Génération complète de bail, appel de loyer, paiement et émission de quittance PDF certifiée.

### GRAPPE F : SEO, Sitemaps & Rendu d'Images Sociales
* **Déclencheur** : Modification de `sitemap.ts`, `opengraph-image.tsx`, `layout.tsx` ou des balises metadata.
* **Tests à rejouer impérativement** :
  1. `TEST-016` : Absence absolue de téléchargement dynamique de polices externes (Google Fonts/CDN).
  2. `TEST-016` : Rendu de la carte OpenGraph sans plantage Satori (`width`/`height` absolus sur `<img>`).

---

## 2. Procédure d'Exécution de la Baseline

1. Lors de toute tentative de correction par l'Agent 6 :
   - Identifier la grappe correspondant aux fichiers modifiés.
   - Exécuter la totalité des tests de la grappe sur l'environnement de test isolé.
   - Si un seul test de la grappe échoue, le correctif est rejeté pour régression.
2. L'Agent 8 procédera au rejeu complet de l'ensemble des grappes A à F avant toute validation d'audit final.
