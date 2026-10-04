# Inventaire Exhaustif des Fonctionnalités de la Plateforme Nopalou

Ce document référence l'intégralité des fonctionnalités réelles identifiées dans la base de code du projet Nopalou, formalisées selon la nomenclature `FEATURE-XXX`.

---

## 1. Module Authentification, Compte & Conformité RGPD

### FEATURE-001 : Inscription Utilisateur Sécurisée
* **ID** : `FEATURE-001`
* **Nom** : Inscription Utilisateur (Email / Téléphone)
* **Description factuelle** : Permet à un utilisateur de créer un compte avec email normalisé, mot de passe robuste haché (bcrypt) et numéro de téléphone normalisé (+221).
* **Localisation** : `frontend-next/src/app/inscription`, `backend/routes/auth.js`
* **Rôle utilisateur** : Visiteur anonyme
* **Entrées** : Nom, Prénom, Email, Téléphone, Mot de passe.
* **Sorties** : Compte créé en base, email de bienvenue/vérification émis, token JWT généré.
* **API** : `POST /api/auth/inscription`
* **DB** : `utilisateurs`
* **Dépendances** : `backend/services/email.js`, `bcryptjs`, `jsonwebtoken`
* **Criticité** : P0
* **Parcours concernés** : Parcours Compte, Parcours Achat, Parcours Vendeur
* **Tests nécessaires** : Création avec email valide, rejet email dupliqué, validation format téléphone sénégalais.

### FEATURE-002 : Connexion & Gestion de Session JWT Sécurisée
* **ID** : `FEATURE-002`
* **Nom** : Authentification & Versioning JWT
* **Description factuelle** : Authentifie l'utilisateur via email/mot de passe, émet un token de session signé avec versioning (`jwt_version`) pour invalidation instantanée sur déconnexion.
* **Localisation** : `frontend-next/src/app/connexion`, `backend/routes/auth.js`, `backend/middlewares/auth.js`
* **Rôle utilisateur** : Visiteur
* **Entrées** : Email normalisé, Mot de passe.
* **Sorties** : Cookie de session `nopalou_session` (httpOnly), objet utilisateur retourné.
* **API** : `POST /api/auth/connexion`, `POST /api/auth/deconnexion`
* **DB** : `utilisateurs` (champs `jwt_version`, `derniere_connexion`)
* **Dépendances** : `backend/middlewares/auth.js`
* **Criticité** : P0
* **Parcours concernés** : Tous parcours authentifiés
* **Tests nécessaires** : Connexion réussie, rejet identifiants invalides, rate limiting (max 20 tentatives/15min), révocation immédiate du token après déconnexion.

### FEATURE-003 : Réinitialisation de Mot de Passe Découplée
* **ID** : `FEATURE-003`
* **Nom** : Mot de Passe Oublié & Secrets Découplés
* **Description factuelle** : Envoi d'un lien signé avec un secret dédié (`RESET_SECRET`) à usage unique empêchant l'utilisation du jeton de réinitialisation comme session.
* **Localisation** : `frontend-next/src/app/mot-de-passe-oublie`, `backend/routes/auth.js`
* **Rôle utilisateur** : Utilisateur inscrit
* **Entrées** : Email du compte.
* **Sorties** : Email HTML charte Nopalou contenant l'URL de réinitialisation avec token temporaire (1 heure).
* **API** : `POST /api/auth/mot-de-passe-oublie`, `POST /api/auth/reinitialiser-mot-de-passe`
* **DB** : `utilisateurs`
* **Dépendances** : `backend/services/email.js`
* **Criticité** : P1
* **Parcours concernés** : Parcours Compte
* **Tests nécessaires** : Demande de reset, application du nouveau mot de passe, vérification de l'incrémentation de `jwt_version` révoquant les anciennes sessions.

### FEATURE-004 : Suppression Autonome de Compte & Droit à l'Oubli (RGPD Art. 17)
* **ID** : `FEATURE-004`
* **Nom** : Suppression Autonome de Compte avec Période de Grâce de 30 Jours
* **Description factuelle** : Permet à tout utilisateur d'initier la suppression de son compte avec confirmation par mot de passe. Le compte passe en période de grâce de 30 jours avec possibilité de réactivation en un clic.
* **Localisation** : `frontend-next/src/app/(account)/compte/components/SupprimerCompteSection.tsx`, `backend/routes/auth.js`
* **Rôle utilisateur** : Utilisateur authentifié
* **Entrées** : Mot de passe actuel, saisie confirmatoire du mot "SUPPRIMER".
* **Sorties** : Compte marqué `supprime_le = NOW()`, sessions invalidées.
* **API** : `POST /api/auth/supprimer-compte`, `POST /api/auth/annuler-suppression`, `GET /api/auth/statut-suppression`
* **DB** : `utilisateurs` (`supprime_le`, `supprime_par_utilisateur`, `anonymise_le`)
* **Dépendances** : `tests/unit/identity-and-self-delete.test.js`
* **Criticité** : P1
* **Parcours concernés** : Parcours Compte
* **Tests nécessaires** : Déclenchement de la suppression, tentative d'accès bloquée, restauration du compte pendant la grâce de 30j.

---

## 2. Module E-Commerce, Vitrines Marchandes & Commandes

### FEATURE-005 : Catalogue Public & Recherche Instantanée
* **ID** : `FEATURE-005`
* **Nom** : Recherche & Filtres Multi-Critères
* **Description factuelle** : Recherche plein texte avec tolérance aux fautes (trigrammes PostgreSQL), filtres par catégorie, tranche de prix, marchand et disponibilité.
* **Localisation** : `frontend-next/src/app/recherche`, `frontend-next/src/app/NavbarSearch.tsx`, `backend/routes/search.js`
* **Rôle utilisateur** : Tous
* **Entrées** : Chaîne de recherche, slug catégorie, min/max prix, tri.
* **Sorties** : Liste paginée d'articles avec prix min, nombre d'offres et badges marchands.
* **API** : `GET /api/search`
* **DB** : `produits`, `offres`, `categories`
* **Dépendances** : Extension `pg_trgm`
* **Criticité** : P0
* **Parcours concernés** : Parcours Achat
* **Tests nécessaires** : Recherche exacte, recherche approximative, application des filtres de prix, rate limiting search (150 req/15min).

### FEATURE-006 : Fiche Produit & Comparateur d'Offres
* **ID** : `FEATURE-006`
* **Nom** : Comparateur d'Offres Multi-Marchands
* **Description factuelle** : Affiche les détails d'un produit et liste l'ensemble des offres marchandes concurrentes classées par prix croissant avec lien direct d'achat.
* **Localisation** : `frontend-next/src/app/produit/[id]`, `backend/routes/produits.js`
* **Rôle utilisateur** : Tous
* **Entrées** : ID ou slug du produit.
* **Sorties** : Fiche produit complète, historique des prix, liste des offres en stock.
* **API** : `GET /api/produits/:id`
* **DB** : `produits`, `offres`, `marchands`, `historique_prix`
* **Dépendances** : Aucun
* **Criticité** : P0
* **Parcours concernés** : Parcours Achat
* **Tests nécessaires** : Affichage d'un produit avec 1 offre, avec multi-offres, avec offres hors stock masquées ou reléguées.

### FEATURE-007 : Vitrine E-Commerce Personnalisée de Boutique
* **ID** : `FEATURE-007`
* **Nom** : Vitrine Marchand (`/boutiques/[id]` et `/b/[slug]`)
* **Description factuelle** : Page storefront de la boutique marchande présentant son logo, bannière, coordonnées WhatsApp, catégories et catalogue d'articles.
* **Localisation** : `frontend-next/src/app/boutiques/[id]`, `frontend-next/src/app/b/[slug]`
* **Rôle utilisateur** : Tous
* **Entrées** : ID ou slug boutique.
* **Sorties** : Interface vitrine marchande optimisée SSR, bouton de contact direct WhatsApp, panier tiroir intégré.
* **API** : `GET /api/boutiques/:id/public`
* **DB** : `boutiques`, `boutique_produits`, `boutique_promotions`
* **Dépendances** : Serwist offline cache
* **Criticité** : P0
* **Parcours concernés** : Parcours Achat, Parcours Vendeur
* **Tests nécessaires** : Chargement vitrine avec slug personnalisé, affichage des prix barrés en promotion, panier persistant.

### FEATURE-008 : Panier d'Achat Réactif (DrawerCart) & Calcul de Livraison
* **ID** : `FEATURE-008`
* **Nom** : Panier Tiroir & Options Universelles de Livraison
* **Description factuelle** : Panier fluide latéral affichant les articles sélectionnés, la gestion des quantités, et la sélection stricte du mode de livraison : Retrait en boutique (Gratuit - 0 F), Zone configurée, ou Frais à convenir avec le vendeur (sans faux libellé gratuit).
* **Localisation** : `frontend-next/src/components/cart/DrawerCart.tsx`, `frontend-next/src/hooks/useDrawerCartCheckout.ts`
* **Rôle utilisateur** : Client acheteur
* **Entrées** : Articles ajoutés, choix de la zone de livraison, code promo.
* **Sorties** : Sous-total exact, frais de livraison calculés, total à payer.
* **API** : `GET /api/boutiques/:id/zones-livraison`
* **DB** : `zones_livraison`, `boutique_promotions`
* **Dépendances** : LocalStorage persistant sécurisé SSR
* **Criticité** : P0
* **Parcours concernés** : Parcours Achat
* **Tests nécessaires** : Ajout/suppression d'articles, vérification de l'affichage 'Frais à convenir' (sans suffixe Gratuit), calcul mathématique sans centimes aberrants.

### FEATURE-009 : Tunnel de Commande & Paiement en Ligne (Wave / Orange Money / Cash)
* **ID** : `FEATURE-009`
* **Nom** : Enregistrement de Commande & Redirection Paiement
* **Description factuelle** : Crée la commande en base, réserve les stocks, génère la session de paiement Wave ou Orange Money, ou valide le paiement à la livraison, et envoie les notifications WhatsApp au client et au vendeur.
* **Localisation** : `frontend-next/src/components/cart/DrawerCartCheckout.tsx`, `backend/services/commande-service.js`, `backend/routes/comptabilite.js`
* **Rôle utilisateur** : Client acheteur
* **Entrées** : Nom client, Téléphone, Adresse de livraison, Moyen de paiement choisi.
* **Sorties** : Numéro de commande unique, URL de redirection Wave/OM ou confirmation immédiate, message WhatsApp reçu par le commerçant avec bouton 1-clic.
* **API** : `POST /api/comptabilite/:id/commandes`, `POST /api/boutiques/:id/commandes/express`
* **DB** : `commandes_boutique`, `commandes_boutique_items`, `paiements_inities`
* **Dépendances** : `backend/services/wave.js`, `backend/services/orange-money.js`, `whatsapp.js`
* **Criticité** : P0
* **Parcours concernés** : Parcours Achat
* **Tests nécessaires** : Création commande Wave, création commande Cash, vérification de non-crash (`ReferenceError: commande is not defined` résolu).

---

## 3. Module ERP Boutique & Logiciel de Caisse (POS)

### FEATURE-010 : Gestion des Sessions de Caisse & Fond de Caisse
* **ID** : `FEATURE-010`
* **Nom** : Ouverture, Gestion et Clôture de Session Caisse POS
* **Description factuelle** : Permet au caissier d'ouvrir une session avec un montant de fond de caisse, d'enregistrer les mouvements d'entrées/sorties de tiroir, et de clôturer avec comptage physique et génération du rapport Z.
* **Localisation** : `frontend-next/src/app/boutique/caisse`, `backend/routes/boutiques-modules/boutiques-pos.js`
* **Rôle utilisateur** : Vendeur, Caissier
* **Entrées** : Montant fond de caisse initial, mouvements de tiroir (motif, montant), montant physique final.
* **Sorties** : Session active créée, calcul des écarts de caisse, ticket de clôture imprimable.
* **API** : `POST /api/boutiques/:id/pos/sessions/ouvrir`, `POST /api/boutiques/:id/pos/sessions/fermer`, `POST /api/boutiques/:id/pos/tiroir`
* **DB** : `boutique_pos_sessions`, `boutique_pos_mouvements_caisse`
* **Dépendances** : PIN caissier
* **Criticité** : P0
* **Parcours concernés** : Parcours POS & Caisse
* **Tests nécessaires** : Ouverture de session avec montant > 0, tentative d'encaissement sans session ouverte (rejeté), clôture avec calcul d'écart.

### FEATURE-011 : Encaissement Tactile & Scan Codes-Barres Caisse
* **ID** : `FEATURE-011`
* **Nom** : Vente Rapide POS (Tactile, Clavier Numérique & Douchette)
* **Description factuelle** : Interface plein écran haute rapidité pour ajouter des articles par tap tactile, numpad ou scan de code-barres douchette, et finaliser l'encaissement multi-devises/moyens de paiement.
* **Localisation** : `frontend-next/src/app/boutique/caisse/components/PosPanierSidebar.tsx`, `PosNumpad.tsx`
* **Rôle utilisateur** : Caissier
* **Entrées** : Code-barre EAN, ID article, quantité, mode de règlement (Espèces, Wave, OM, Carte, Dette).
* **Sorties** : Vente enregistrée avec clé d'idempotence, stock décrémenté, ticket édité.
* **API** : `POST /api/boutiques/:id/pos/ventes`
* **DB** : `ventes`, `boutique_produits`, `boutique_pos_sessions`
* **Dépendances** : ESC/POS printing
* **Criticité** : P0
* **Parcours concernés** : Parcours POS & Caisse
* **Tests nécessaires** : Vente d'un article en stock, vente avec remise en %, encaissement espèces avec calcul automatique du rendu de monnaie.

### FEATURE-012 : Vente Vocale Wolof/Français à la Caisse
* **ID** : `FEATURE-012`
* **Nom** : Saisie Vocale POS Bilingue
* **Description factuelle** : Reconnaissance vocale directe sur l'écran de caisse permettant d'énoncer une commande en français ou wolof ("2 jus d'orange", "benn téemeer pomme de terre") et d'insérer automatiquement les lignes dans le panier de caisse.
* **Localisation** : `frontend-next/src/app/boutique/caisse/components/PosVoiceInput.tsx`, `frontend-next/src/lib/voice-assistant.ts`
* **Rôle utilisateur** : Caissier
* **Entrées** : Voix captée par micro.
* **Sorties** : Ligne d'article et quantité injectées dans le panier avec feedback sonore et visuel.
* **API** : Traitement local Web Speech API couplé à la base d'articles en mémoire.
* **DB** : Aucun appel direct (client-side) ; persistance lors de la vente.
* **Dépendances** : Support Web Speech API du navigateur
* **Criticité** : P1
* **Parcours concernés** : Parcours POS & Caisse, Parcours Vocal
* **Tests nécessaires** : Énonciation en français standard, énonciation en wolof avec nombres phonétiques, fallback si produit inconnu.

### FEATURE-013 : Mode Hors-Ligne (Offline PWA) & Synchronisation Différée
* **ID** : `FEATURE-013`
* **Nom** : Continuité d'Encaissement Hors-Réseau
* **Description factuelle** : Permet au point de vente d'encaisser des ventes même en cas de coupure internet totale (fréquente en Afrique de l'Ouest) via IndexedDB et Service Worker, avec renvoi sécurisé dès retour du réseau.
* **Localisation** : `frontend-next/src/app/sw.ts`, `frontend-next/src/app/boutique/caisse/hooks/usePosOfflineSync.ts`
* **Rôle utilisateur** : Caissier
* **Entrées** : Ventes conclues hors connexion.
* **Sorties** : Données conservées dans IndexedDB, indicateur "Mode Hors-Ligne", synchronisation automatique en tâche de fond.
* **API** : Rejeu automatique sur `/api/boutiques/:id/pos/ventes`
* **DB** : IndexedDB locale -> `ventes` PostgreSQL
* **Dépendances** : Serwist, IndexedDB API
* **Criticité** : P0
* **Parcours concernés** : Parcours POS & Caisse
* **Tests nécessaires** : Simulation offline, encaissement 3 ventes, rétablissement réseau, synchronisation sans perte ni duplication.

### FEATURE-014 : Carnet de Dettes & Gestion des Crédits Clients
* **ID** : `FEATURE-014`
* **Nom** : Carnet de Dettes Numérique & Échéanciers
* **Description factuelle** : Gestion des ardoises et crédits accordés aux clients fidèles : enregistrement de dette à la caisse, échéanciers, remboursements partiels, et relances automatisées par WhatsApp.
* **Localisation** : `frontend-next/src/app/boutique/carnet`, `backend/routes/boutiques-modules/credits.js`
* **Rôle utilisateur** : Commerçant, Caissier
* **Entrées** : Nom client, Téléphone, Montant de dette, Date d'échéance.
* **Sorties** : Créance enregistrée, reçu de dette, rappel programmé.
* **API** : `POST /api/boutiques/:id/credits`, `POST /api/boutiques/:id/credits/:creditId/rembourser`
* **DB** : `caisse_clients_credits`, `caisse_credit_historique`, `caisse_credit_plans`, `caisse_credit_echeances`
* **Dépendances** : `backend/services/cron-relances-carnet.js`
* **Criticité** : P1
* **Parcours concernés** : Parcours POS & Caisse, Parcours Vendeur
* **Tests nécessaires** : Création d'une créance, encaissement d'un acompte partiel, mise à jour du solde restant dû, émission du reçu.

---

## 4. Module Chatbot WhatsApp & Assistant Intelligent

### FEATURE-015 : Prise de Commande Conversationnelle WhatsApp
* **ID** : `FEATURE-015`
* **Nom** : Tunnel de Commande Intégral par Chat WhatsApp
* **Description factuelle** : Un client envoie un message sur le numéro officiel Nopalou, consulte le catalogue d'une boutique, ajoute des articles et confirme sa commande directement sans quitter WhatsApp.
* **Localisation** : `backend/services/whatsapp-chatbot.js`
* **Rôle utilisateur** : Client WhatsApp
* **Entrées** : Messages textuels, clics sur listes interactives et boutons.
* **Sorties** : Messages de guidage étape par étape, commande boutique insérée, lien de paiement généré.
* **API** : Webhook `POST /api/whatsapp/webhook`
* **DB** : `whatsapp_sessions`, `whatsapp_processed_messages`, `commandes_boutique`
* **Dépendances** : Meta Graph API WhatsApp Cloud
* **Criticité** : P0
* **Parcours concernés** : Parcours WhatsApp
* **Tests nécessaires** : Simulation flux commande : Bonjour -> Sélection Boutique -> Choix Article -> Adresse -> Confirmation.

### FEATURE-016 : Ajout Rapide de Produit Commerçant par Photo WhatsApp
* **ID** : `FEATURE-016`
* **Nom** : Création d'Article par Envoi d'Image WhatsApp
* **Description factuelle** : Un commerçant envoie une photo de son article sur WhatsApp avec une légende ("Robe Wax 15000"). Le bot télécharge l'image, la stocke sur Cloudinary et crée le produit dans sa boutique.
* **Localisation** : `backend/services/whatsapp-chatbot.js` (fonction `telechargerMediaWhatsApp`)
* **Rôle utilisateur** : Commerçant authentifié par téléphone
* **Entrées** : Photo WhatsApp + légende texte.
* **Sorties** : Produit créé dans la boutique, image hébergée sur Cloudinary, confirmation envoyée au commerçant avec lien de partage.
* **API** : Webhook WhatsApp -> Cloudinary API -> PostgreSQL
* **DB** : `boutique_produits`, `boutiques`
* **Dépendances** : Meta Media API, `backend/services/cloudinary.js`
* **Criticité** : P1
* **Parcours concernés** : Parcours Vendeur, Parcours WhatsApp
* **Tests nécessaires** : Réception d'image, extraction du prix dans la légende, upload Cloudinary, vérification de création du produit en DB.

---

## 5. Module ERP Immobilier & Gestion Locative

### FEATURE-017 : Gestion du Portefeuille de Biens & Vitrine Agence
* **ID** : `FEATURE-017`
* **Nom** : Gestion des Biens Immobiliers & Fiches Publiques
* **Description factuelle** : Permet aux agences de répertorier leurs biens (vente/location, surface, pièces, quartier, loyer/prix) et de générer une vitrine agence publique avec carte interactive.
* **Localisation** : `frontend-next/src/app/agence/[slug]/biens`, `backend/routes/biens.js`
* **Rôle utilisateur** : Gestionnaire d'agence immobilière
* **Entrées** : Titre, Type de bien, Quartier de Dakar, Photos, Prix, Caractéristiques.
* **Sorties** : Bien répertorié, fiche publique consultable avec géolocalisation.
* **API** : `POST /api/agences/:slug/biens`, `GET /api/agences/:slug/biens`
* **DB** : `biens_immo`, `agences_immo`, `proprietaires_immo`
* **Dépendances** : Cloudinary (photos HD)
* **Criticité** : P1
* **Parcours concernés** : Parcours Immobilier
* **Tests nécessaires** : Création de bien avec multiples photos, mise à jour des caractéristiques, contrôle d'isolation multi-agence (anti-IDOR).

### FEATURE-018 : Baux Locatifs, Échéanciers & Quittances PDF
* **ID** : `FEATURE-018`
* **Nom** : Gestion Locative & Génération de Quittances Certifiées
* **Description factuelle** : Création des contrats de bail, génération automatique des appels de loyers mensuels, enregistrement des règlements et émission instantanée de quittances de loyer au format PDF.
* **Localisation** : `frontend-next/src/app/agence/[slug]/locatif`, `backend/routes/locatif-immo.js`
* **Rôle utilisateur** : Gestionnaire d'agence
* **Entrées** : ID bien, ID locataire, Loyer mensuel, Date de prise d'effet, Dépôt de garantie.
* **Sorties** : Contrat de bail actif, échéances générées, quittance PDF téléchargeable.
* **API** : `POST /api/locatif-immo/baux`, `POST /api/locatif-immo/echeances/:id/payer`, `GET /api/locatif-immo/quittance/:id/pdf`
* **DB** : `baux_immo`, `loyers_echeances`, `factures_immo`
* **Dépendances** : PDFKit
* **Criticité** : P0
* **Parcours concernés** : Parcours Immobilier
* **Tests nécessaires** : Création d'un bail, paiement de loyer complet, génération du PDF et vérification du format et des mentions légales.

---

## 6. Module Scraping, Intelligence Marché & CRM Prospection

### FEATURE-019 : Scraping Omnisource & Pipeline de Collecte
* **ID** : `FEATURE-019`
* **Nom** : Collecte Automatisée Multi-Sites
* **Description factuelle** : Scrapers planifiés extrayant quotidiennement les annonces et produits depuis Expat-Dakar, CoinAfrique, Jumia et autres, avec rotation d'en-têtes et respect des robots.txt.
* **Localisation** : `backend/services/scraper.js`, `backend/lib/scrapingRun.js`
* **Rôle utilisateur** : Système / Cron
* **Entrées** : URLs de pagination des catégories cibles.
* **Sorties** : Enregistrement des offres scrapées, historisation des prix, détection des ruptures.
* **API** : `POST /api/scraper/lancer`
* **DB** : `marchands`, `offres`, `produits`, `scraping_runs`
* **Dépendances** : Cheerio, Axios, node-cron
* **Criticité** : P1
* **Parcours concernés** : Parcours Scraping
* **Tests nécessaires** : Exécution sur une page de test locale, extraction correcte du prix en FCFA sans caractères parasites, insertion sans doublon.

### FEATURE-020 : Matching & Déduplication Intelligente des Produits
* **ID** : `FEATURE-020`
* **Nom** : Algorithme de Regroupement Sémantique d'Offres
* **Description factuelle** : Analyse les titres des offres scrapées pour identifier la marque, le modèle et les caractéristiques clés (RAM, stockage) afin de les fusionner sous une même fiche produit canonique.
* **Localisation** : `backend/services/matching.js`
* **Rôle utilisateur** : Système
* **Entrées** : Titre marchand, marque détectée, prix.
* **Sorties** : Rattachement à un `produit_id` existant ou création d'une nouvelle fiche maître.
* **API** : Appel interne depuis le scraper.
* **DB** : `produits`, `offres`
* **Dépendances** : `pg_trgm`, liste d'exclusion `MOTS_GENERIQUES`
* **Criticité** : P1
* **Parcours concernés** : Parcours Scraping
* **Tests nécessaires** : Vérification que deux titres similaires sont fusionnés (ex: "iPhone 13 128Go" et "Apple iPhone 13 128 Go") et que des produits distincts ne sont pas confondus.

### FEATURE-021 : Prospection Commerciale & Relances WhatsApp
* **ID** : `FEATURE-021`
* **Nom** : Prospection Automatisée & Fit Score Marchands
* **Description factuelle** : Détection de leads commerçants, calcul d'un score d'éligibilité (`fit_score`) et diffusion programmée d'invitations personnalisées à créer une boutique Nopalou.
* **Localisation** : `backend/services/prospection.js`, `backend/services/cron-relances-prospects.js`
* **Rôle utilisateur** : Administrateur / Système
* **Entrées** : Fichier ou scraping de prospects avec numéro WhatsApp.
* **Sorties** : Leads qualifiés, messages de contact envoyés, conversion vers boutique.
* **API** : `POST /api/prospection/campagnes`, `GET /api/prospection/leads`
* **DB** : `prospection_leads`, `prospection_campagnes`, `prospection_messages_log`
* **Dépendances** : WhatsApp Cloud API
* **Criticité** : P2
* **Parcours concernés** : Parcours Prospection
* **Tests nécessaires** : Calcul du score, envoi de message modèle, gestion immédiate du mot-clé de désinscription "STOP".

---

## 7. Module Administration Globale & Contrôle Opérationnel

### FEATURE-022 : Tableau de Bord Administrateur & RBAC
* **ID** : `FEATURE-022`
* **Nom** : Back-Office Centralisé & Sécurité des Rôles
* **Description factuelle** : Espace d'administration multi-rôles (Super Admin, Opérationnel, Finance, Support, Modérateur) avec statistiques en temps réel, gestion des utilisateurs, des boutiques et traçabilité complète des actions.
* **Localisation** : `frontend-next/src/app/admin/(protected)`, `backend/middlewares/admin-rbac.js`
* **Rôle utilisateur** : Administrateurs
* **Entrées** : Jeton administrateur valide avec rôle.
* **Sorties** : Métriques consolidées, actions administratives consignées dans les journaux d'audit.
* **API** : `/api/admin/dashboard`, `/api/admin/utilisateurs`, `/api/admin/boutiques`
* **DB** : `admin_utilisateurs`, `admin_audit_logs`, `boutiques`, `utilisateurs`
* **Dépendances** : Cookie sécurisé `nopalou_admin_jwt`
* **Criticité** : P0
* **Parcours concernés** : Parcours Administration
* **Tests nécessaires** : Contrôle d'accès par rôle, journalisation de chaque action dans `admin_audit_logs`, rejet des requêtes sans privilèges suffisants.
