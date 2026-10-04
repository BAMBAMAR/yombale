# Cartographie des Parcours Critiques de la Plateforme Nopalou

Ce document détaille les 10 parcours utilisateurs et systèmes à fort impact de la plateforme Nopalou. Chaque parcours est décomposé en séquence chronologique rigoureuse, avec identification des points de défaillance potentiels et des contrôles requis.

---

## PARCOURS-01 : Parcours d'Achat & Commande E-commerce

```text
Recherche Multi-Critères
    ↓
Résultats & Filtres
    ↓
Fiche Produit / Vitrine Boutique
    ↓
Sélection Quantité / Variantes
    ↓
Ajout au Panier (DrawerCart)
    ↓
Choix Mode de Livraison (Retrait 0 F / Zone / À convenir)
    ↓
Formulaire Client & Adresse
    ↓
Validation & Choix Paiement (Wave / Orange Money / Cash)
    ↓
Création Commande Backend (Idempotency Key)
    ↓
Notification Commerçant WhatsApp 1-Clic
    ↓
Confirmation Client & Page de Suivi (/suivi-commande)
```

* **Composants impliqués** : `NavbarSearch`, `ProduitsListe`, `DrawerCart`, `DrawerCartCheckout`, `commande-service.js`, `comptabilite.js`, `wave.js`, `orange-money.js`.
* **Points de défaillance critiques** :
  - Disparition de l'option "Retrait en boutique" si des zones sont configurées.
  - Libellé fallacieux "Gratuit" sur l'option "Frais à convenir avec le vendeur".
  - Erreur runtime lors de l'envoi de notification vendeur (`ReferenceError: commande is not defined`).
  - Blocage lors de la génération de session de paiement Wave ou Orange Money en cas de token révoqué.

---

## PARCOURS-02 : Parcours Commerçant & Gestion de Boutique

```text
Inscription Utilisateur (/inscription)
    ↓
Création de Boutique (Wizard /creer-boutique)
    ↓
Onboarding & Paramétrage (Logo, WhatsApp, Zones de livraison)
    ↓
Création d'Articles (/boutique/produits)
    ↓
Gestion des Variantes & Niveaux de Stock
    ↓
Réception Commande Client en Temps Réel
    ↓
Préparation & Affectation Livreur
    ↓
Clôture Commande & Reversement Marchand
```

* **Composants impliqués** : `creer-boutique/page.tsx`, `BoutiqueClient.tsx`, `ProduitForm.tsx`, `boutiques-crud.js`, `boutiques-produits.js`, `reversement-marchand.js`.
* **Points de défaillance critiques** :
  - IDOR : Possibilité pour un autre utilisateur d'éditer les produits de la boutique.
  - Upload d'image corrompu ou trop lourd sur Cloudinary.
  - Incohérence de calcul sur le reversement après déduction de la commission Nopalou.

---

## PARCOURS-03 : Parcours Conversationnel WhatsApp

```text
Message Client Entrant (Texte, Bouton, Audio)
    ↓
Interception Webhook Meta Graph API (/api/whatsapp/webhook)
    ↓
Vérification Signature HMAC SHA-256
    ↓
Contrôle Anti-Rejeu & Déduplication (whatsapp_processed_messages)
    ↓
Chargement / Création Session (whatsapp_sessions)
    ↓
Moteur NLU / Détection d'Intention (whatsapp-chatbot.js)
    ↓
Consultation Catalogue / Actions Métier en Base
    ↓
Formatage Payload Interactif (Boutons, Listes, Carrousels)
    ↓
Envoi Réponse via Meta API Cloud
    ↓
Accusé de Réception & Rendu sur le Téléphone Client
```

* **Composants impliqués** : `backend/routes/whatsapp.js`, `whatsapp-chatbot.js`, `whatsapp.js`, `cloudinary.js`.
* **Points de défaillance critiques** :
  - Dépassement du timeout de webhook Meta (exigeant une réponse HTTP 200 en moins de 3 secondes).
  - Déduplication absente entraînant l'envoi de multiples messages identiques en cas de retry de Meta.
  - Mauvaise gestion des pièces jointes ou audios OGG/Opus.

---

## PARCOURS-04 : Parcours Assistant Vocal & Sama Xaalis

```text
Énonciation Vocale (Microphone navigateur ou Note audio WhatsApp)
    ↓
Capture Flux Audio & Transcription Speech-to-Text
    ↓
Normalisation Phonétique Bilingue Wolof/Français (voice-assistant.ts)
    ↓
Conversion des Unités Monétaires (benn téemeer = 500 F, junni = 5 000 F)
    ↓
Extraction de l'Intention (Vente, Dépense, Créance Bor)
    ↓
Appel API Backend Authentifié (/api/comptabilite/:id/*)
    ↓
Enregistrement en Base PostgreSQL (ventes, depenses, caisse_clients_credits)
    ↓
Synthèse Vocale & Feedback Visuel Instantané sur l'Écran
```

* **Composants impliqués** : `PosVoiceInput.tsx`, `sama-xaalis/page.tsx`, `voice-assistant.ts`, `comptabilite.js`.
* **Points de défaillance critiques** :
  - Confusion phonétique entre des chiffres et des noms de produits.
  - Refus de permission microphone par le navigateur sans guidage utilisateur clair.
  - Écriture d'un montant erroné en base si l'unité wolof est mal interprétée.

---

## PARCOURS-05 : Parcours ERP Immobilier & Gestion Locative

```text
Recherche Bien ou Vitrine Agence (/immo, /agence/[slug])
    ↓
Consultation Fiche Bien & Carte Interactive
    ↓
Contact Agence & Visite
    ↓
Saisie Mandat & Création Bail Locatif (/locatif-immo/baux)
    ↓
Génération Mensuelle des Échéances de Loyers
    ↓
Encaissement du Loyer (Wave, Espèces, Virement)
    ↓
Émission Instantanée de la Quittance Certifiée PDF
    ↓
Reversement au Propriétaire Bailleur déduction faite des honoraires
```

* **Composants impliqués** : `frontend-next/src/app/agence/[slug]`, `biens.js`, `locatif-immo.js`, `agence-documents-pdf.js`, PDFKit.
* **Points de défaillance critiques** :
  - Faille IDOR permettant à une agence concurrente d'accéder aux baux d'une autre agence.
  - Génération de quittance de loyer pour une échéance non payée.
  - Erreur de mise en page PDF en cas de caractères spéciaux ou accents.

---

## PARCOURS-06 : Parcours Petites Annonces & Immo C2C

```text
Dépôt d'Annonce (/deposer-annonce, /deposer-immo)
    ↓
Upload des Photos & Saisie des Caractéristiques
    ↓
Enregistrement Statut 'en_attente_moderation'
    ↓
Revue par l'Équipe Modération Nopalou (/admin/annonces)
    ↓
Validation & Publication Publique
    ↓
Optionnel : Achat d'un Boost / Sponsoring (Wave/Orange Money)
    ↓
Mise en Avant sur la Page d'Accueil et Top Recherche
```

* **Composants impliqués** : `annonces.js`, `immo.js`, `admin-produits.js`, `paiement.js`.
* **Points de défaillance critiques** :
  - Publication d'annonces frauduleuses sans filtre de modération.
  - Échec d'activation du sponsoring après paiement Wave réussi.

---

## PARCOURS-07 : Parcours Identité, Compte & Droit à l'Oubli RGPD

```text
Création de Compte & Envoi Email de Vérification
    ↓
Validation du Lien Unique Signé (VERIFY_SECRET)
    ↓
Connexion & Réception Token Session (JWT_SECRET)
    ↓
Consultation & Modification des Informations Personnelles
    ↓
Déconnexion : Incrémentation jwt_version & Révocation Globale
    ↓
Demande de Suppression Autonome de Compte (RGPD Art. 17)
    ↓
Période de Grâce de 30 Jours (Restauration possible en 1 clic)
    ↓
Passé 30 jours : Anonymisation Totale (anonymise_le = NOW())
```

* **Composants impliqués** : `auth.js`, `email.js`, `SupprimerCompteSection.tsx`, `BannerCompteSuppression.tsx`.
* **Points de défaillance critiques** :
  - Collision de secrets permettant à un token de vérification d'ouvrir une session.
  - Réutilisation d'un token après déconnexion si `jwt_version` n'est pas contrôlé.
  - Suppression immédiate sans possibilité de récupération pendant la période légale de grâce.

---

## PARCOURS-08 : Parcours Caisse POS Physique & Résilience Hors-Ligne

```text
Ouverture Session Caisse avec Saisie Fond de Caisse
    ↓
Saisie Rapide des Articles (Scan EAN / Numpad / Voix)
    ↓
Application Remise ou Affectation Client Fidélité
    ↓
Encaissement (Espèces avec rendu de monnaie / Mobile Money)
    ↓
Impression Reçu Ticket de Caisse
    ↓
[INCIDENT] Perte Totale de Connexion Internet
    ↓
Bascule Transparente sur Serwist Service Worker & IndexedDB
    ↓
Encaissement Continu des Ventes Hors-Ligne
    ↓
[RÉTABLISSEMENT] Détection de Réseau (navigator.onLine)
    ↓
Rejeu des Ventes en File d'Attente avec Idempotency Keys
    ↓
Réconciliation des Stocks & Clôture de Caisse (Rapport Z)
```

* **Composants impliqués** : `PosPanierSidebar.tsx`, `PosNumpad.tsx`, `usePosOfflineSync.ts`, `sw.ts`, `boutiques-pos.js`.
* **Points de défaillance critiques** :
  - Perte des ventes offline si l'onglet est fermé avant reconnexion.
  - Création de doublons lors de la synchronisation si la clé d'idempotence est absente ou mal gérée.
  - Blocage de l'interface POS si le cache IndexedDB est saturé.

---

## PARCOURS-09 : Parcours Scraping & Rapprochement de Marché

```text
Déclenchement Tâche Cron ou Commande Admin
    ↓
Acquisition Verrou Concurrence (scrapingLock)
    ↓
Itération sur les Sources (Expat, Jumia, CoinAfrique)
    ↓
Requête HTTP avec Rotation User-Agent & Pause Aléatoire
    ↓
Extraction Cheerio du DOM HTML
    ↓
Normalisation du Prix FCFA & Filtrage des Aberrations
    ↓
Extraction des Spécifications (RAM, Stockage, État)
    ↓
Algorithme de Matching Trigramme (matching.js)
    ↓
Offre Attachée ou Nouveau Produit Maître Créé
    ↓
Historisation du Relevé de Prix (historique_prix)
    ↓
Libération du Verrou & Enregistrement du Rapport de Run
```

* **Composants impliqués** : `scraper.js`, `matching.js`, `scrapingRun.js`, `scrapingLock.js`.
* **Points de défaillance critiques** :
  - Blocage par Cloudflare / Captcha sans détection propre.
  - Fusion erronée de deux produits distincts en raison de mots génériques non filtrés.
  - Verrou de scraping restant bloqué en mémoire après un crash imprévu.

---

## PARCOURS-10 : Parcours Prospection Commerciale Automatisée

```text
Collecte de Données Publiques Commerçants
    ↓
Normalisation Téléphone Format E.164 (+221...)
    ↓
Calcul de Pertinence & Scoring Intelligent (fit_score)
    ↓
Création ou Assignation à une Campagne Ciblée
    ↓
Envoi Template Approuvé WhatsApp via Cron
    ↓
Enregistrement dans prospection_messages_log
    ↓
Réception Éventuelle d'un Mot-Clé "STOP" -> Blacklist Immédiate
    ↓
Conversion du Prospect : Création Boutique Nopalou
    ↓
Réconciliation Automatique Lead CRM <-> Boutique Créée
```

* **Composants impliqués** : `prospection.js`, `scraper-prospection.js`, `cron-relances-prospects.js`, `whatsapp.js`.
* **Points de défaillance critiques** :
  - Envoi répété à un numéro ayant envoyé STOP.
  - Désynchronisation entre le statut du lead dans le CRM et les messages réellement délivrés.
