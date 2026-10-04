# Matrice de Couverture des Tests Nopalou

Ce document relie chaque fonctionnalité critique (`FEATURE-XXX`) aux parcours utilisateurs, aux risques majeurs identifiés, aux cas de test correspondants et aux preuves attendues.

---

## Matrice Croisée de Couverture

| Fonctionnalité | Parcours | Risque Identifié | Test Associé | Preuve Attendue | Criticité |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **FEATURE-001 (Inscription)** | PARCOURS-07 | Données mal formées, doublons d'email, mot de passe en clair | `TEST-001` | JSON 201 + SELECT SQL avec email normalisé et hash bcrypt | **P0** |
| **FEATURE-002 (Connexion & Sessions)** | PARCOURS-07 | Maintien d'accès après déconnexion, faille de révocation de session | `TEST-002` | Requête 401 Unauthorized post-déconnexion + jwt_version incrémenté | **P0** |
| **FEATURE-003 (Secrets Découplés)** | PARCOURS-07 | Élévation de privilège via token temporaire de mot de passe oublié | `TEST-003` | Rejet HTTP 401 sur token type 'reset' avec message explicite | **P0** |
| **FEATURE-004 (Suppression RGPD)** | PARCOURS-07 | Suppression irréversible immédiate ou impossibilité d'annuler | `TEST-004` | Ligne `utilisateurs` avec `supprime_le` horodaté puis réinitialisé | **P1** |
| **FEATURE-005 (Recherche & Filtres)** | PARCOURS-01 | Crash sur termes accentués, lenteur extrême, injection SQL | `TEST-005` (Couplé API) | Résultats JSON pertinents en < 200ms avec trigrammes | **P0** |
| **FEATURE-007 (Vitrines Marchandes)** | PARCOURS-02 | Faux slug, panier non synchronisé, isolation multi-tenant violée | `TEST-005` | Rejet 403 Forbidden sur tentative d'accès boutique concurrente | **P0** |
| **FEATURE-008 (Panier & Livraison)** | PARCOURS-01 | Tromperie sur les frais ("Gratuit" au lieu d'"À convenir"), panier vide | `TEST-007` | Capture DOM sans suffixe 'Gratuit' sur frais à convenir | **P1** |
| **FEATURE-009 (Commandes & Paiement)** | PARCOURS-01 | Crash 500 (`ReferenceError: commande is not defined`), échec Wave/OM | `TEST-008`, `TEST-009` | Commande 201 insérée en base + Logs sans crash 500 | **P0** |
| **FEATURE-010 (Sessions Caisse POS)** | PARCOURS-08 | Écart de caisse injustifié, vente hors session, vol d'espèces | `TEST-010` | Bilan de clôture Z avec `ecart_caisse = 0` dans PostgreSQL | **P0** |
| **FEATURE-011 (Vente Rapide POS)** | PARCOURS-08 | Blocage de caisse lors de pic d'affluence, calcul erroné de monnaie | `TEST-010` | Ticket de vente imprimé / retourné avec montants exacts | **P0** |
| **FEATURE-012 (Voix & Sama Xaalis)** | PARCOURS-04 | Interprétation erronée des unités Wolof (téemeer, junni), mauvaise imputation | `TEST-012` | Rapport de test unitaire confirmant la conversion exacte en FCFA | **P1** |
| **FEATURE-013 (Résilience Offline)** | PARCOURS-08 | Perte totale des ventes réalisées pendant une coupure réseau | `TEST-011` | Vente stockée dans IndexedDB et réconciliée en base post-reconnexion | **P0** |
| **FEATURE-014 (Carnet de Dettes)** | PARCOURS-08 | Oubli de créance, double comptabilisation, relance client erronée | `TEST-010` | Échéancier mis à jour après encaissement partiel | **P1** |
| **FEATURE-015 (Commandes WhatsApp)** | PARCOURS-03 | Doublon de commandes lors des retries Meta, blocage compte | `TEST-013` | Log serveur confirmant l'idempotence et l'unicité de traitement | **P0** |
| **FEATURE-018 (Gestion Locative)** | PARCOURS-05 | Quittance de loyer émise sans paiement, accès croisé aux baux (IDOR) | `TEST-006`, `TEST-014` | Rejet 403 sur bail tiers + Quittance PDF binaire valide | **P0** |
| **FEATURE-019 (Scraping Omnisource)** | PARCOURS-09 | Blocage IP, prix aberrants faussant le comparateur, verrou bloqué | `TEST-015` | Fiches produits et offres insérées sans collision sémantique | **P1** |
| **MOD-13 (SEO & Polices Système)** | Tous | Crash SSR Satori (@vercel/og), dépendance fragile à des CDN de polices | `TEST-016` | Rapport grep 0 CDN de polices + PNG OpenGraph 200 OK | **P1** |
