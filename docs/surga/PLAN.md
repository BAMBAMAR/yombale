# PLAN — Surga, l'assistant de poche de Nopalou

> Format aligné sur le skill `/planifie` (Claude Mastery) : **tranches verticales** ("tracer
> bullets"). Chaque tranche est livrable et démontrable de bout en bout (données, API, écran de
> l'app ou message WhatsApp). Les durées sont indicatives et seront recalibrées après l'audit.

Statuts : `PROPOSED` → `IN_PROGRESS` → `IN_REVIEW` → `DONE` → `ARCHIVED`. Chaque tranche livrée
donne lieu à une entrée dans `docs/surga/JOURNAL-LIVRAISONS.md`.

---

## Phase 0 — Audit du dépôt existant et validations préalables
**Surga s'intègre dans le dépôt Nopalou existant. Cette phase commence toujours par l'audit.**
- [x] `DONE` Exécuter l'audit de `docs/surga/INTEGRATION_NOPALOU.md` (section 1) et en rendre un
  résumé court.
- [x] `DONE` Poser les questions de clarification nécessaires (section 3 du protocole).
- [x] `DONE` Fusionner le `CLAUDE.md` existant avec `CLAUDE_SURGA.md` si applicable, validation
  de l'utilisateur requise (fusion légère D18, section 4 de `CLAUDE.md`, validée le 2026-10-04).
- [x] `DONE` Créer la branche `feature/surga`.
- [x] `DONE` Enregistrer le résultat de l'audit dans `docs/surga/AUDIT.md` et chaque
  décision tranchée dans `docs/surga/DECISIONS.md` (D11 à D18).
- [ ] `PROPOSED` Valider le cadre WhatsApp autorisé pour Surga (Meta / fournisseur d'accès).
- [ ] `PROPOSED` Spike de validation : source de données du trafic à Dakar (faisabilité, coût).
- [ ] `PROPOSED` Spike de validation : qualité de la transcription vocale en français avec
  enregistrements réalistes (bruit de rue, chiffres).
- [ ] `PROPOSED` Test PWA sur iPhone et Android : installation, notifications, audio en
  arrière-plan.

---

## NOYAU — l'assistant indispensable au quotidien

### Tranche 1 — "Je m'installe et je personnalise mon Surga"
- [x] `DONE` Inscription et connexion OTP SMS / WhatsApp (réutiliser l'auth existante).
- [x] `DONE` PWA installable (manifest `/surga/manifest.json`, service worker dédié `/surga/sw.js`, icônes).
- [x] `DONE` Profil de personnalisation : briques choisies, heure du briefing, langue, quartiers, équipes suivies (table `surga_preferences`, API `/api/surga/preferences` et `/api/surga/onboarding`).
- [x] `DONE` Fixer le budget de poids de l'app connectée (point de départ : JS initial < 120 Ko tenu, zéro dépendance lourde).
- [x] `DONE` Point d'entrée visible sur l'accueil (`/`) et dans la navigation desktop (D20).
- **Démonstration** : un testeur installe l'app, choisit ses briques et son heure de briefing en moins de 2 minutes, et retrouve ses choix à la réouverture.

### Tranche 2 — "Je reçois mon briefing du matin"
- [x] `DONE` Ingestion de sources (flux RSS d'actualité APS/Le Soleil/Seneweb, programme/scores sportifs).
- [x] `DONE` Génération du briefing texte personnalisé (résumés courts, liens vers les sources).
- [x] `DONE` Écran "Aujourd'hui" et notification à l'heure choisie (push web & notification API).
- **Démonstration** : à l'heure choisie, le testeur reçoit une notification et ouvre un briefing correspondant à ses briques.

### Tranche 3 — "Je note, je compte, je calcule"
- [x] `DONE` Notes (création, recherche instantanée, modification, suppression locale et distante).
- [x] `DONE` Dépenses structurées (montant FCFA, catégories prédéfinies, date, note) et récapitulatif mensuel déterministe.
- [x] `DONE` Calculatrice avec moteur de calcul déterministe (arithmétique exacte, pourcentages, sans eval, sans appel LLM).
- [x] `DONE` Fonctionnement hors ligne minimal (offline-first) avec synchronisation bidirectionnelle au retour du réseau via `/api/surga/sync`.
- **Démonstration** : en mode avion, le testeur ajoute une dépense et fait un calcul ; au retour
  du réseau, la dépense apparaît dans son récapitulatif.

### Tranche 4 — "Mon agenda et mes rappels"
- [x] `DONE` Événements et rappels (date, heure, répétition simple, marquer comme terminé, persistance hors ligne).
- [x] `DONE` Notifications de rappel (API Web Notification locale & Service Worker) et affichage dans le briefing du matin.
- **Démonstration** : un rappel créé pour dans 5 minutes déclenche une notification à l'heure.

### Tranche 5 — "Surga sur WhatsApp, pour des tâches précises"
- [x] `DONE` Webhook WhatsApp et commandes structurées ("note 2500 taxi", "rappel demain 8h", "calcule 12000 * 3", "briefing").
- [x] `DONE` Moteur d'extraction d'intention déterministe avec confirmation obligatoire avant toute écriture ("Souhaitez-vous enregistrer cette dépense ? Répondez OUI ou NON").
- [x] `DONE` Chaîne de validation et de persistance (`surga_whatsapp_sessions`, liaison utilisateur par numéro de téléphone).
- [x] `DONE` Quotas stricts (20 commandes/jour avec `surga_quotas`), zéro émoji Unicode et vouvoiement strict.
- **Démonstration** : le testeur envoie "note 2 500 taxi", confirme par "oui", et la dépense apparaît dans l'application web.

### Tranche 6 — "Je commande à la voix dans l'app"
- [x] `DONE` Reconnaissance vocale Web Speech API dans l'app avec repli élégant si non supporté ou bloqué sur certains navigateurs.
- [x] `DONE` Normalisation orale déterministe des nombres et opérateurs ("cent divisé par trois", "deux mille cinq cents").
- [x] `DONE` Calcul arithmétique dicté ("100 divisé par 3") exécuté instantanément par le moteur arithmétique sans appel LLM.
- [x] `DONE` Chaîne de confirmation obligatoire avant enregistrement pour les dépenses, notes et rappels ("Souhaitez-vous enregistrer cette dépense ?").
- [x] `DONE` Sous-composants React modulaires (< 450 lignes) : `SurgaVoiceModal.tsx` et `SurgaDashboardTools.tsx`.
- **Démonstration** : le testeur dicte un calcul ("100 divisé par 3") et une dépense ("note 2500 de taxi") ; le calcul est exact et la dépense n'est enregistrée qu'après confirmation explicite.

### Tranche 7 — "Je partage"
- [x] `DONE` Cartes partageables (brèves d'actualité, score/sport, calcul arithmétique déterministe) vers WhatsApp et statuts avec lien direct d'ouverture.
- [x] `DONE` Moteur de partage (`surga-share.ts` et `share-formatter.js`) avec API standard `navigator.share`, repli universel WhatsApp et copie presse-papier.
- [x] `DONE` Zéro émoji Unicode dans les messages de partage, mise en valeur sobre en gras Markdown (`*...*`) et puces (`•`).
- [x] `DONE` Métadonnées OpenGraph et Twitter Cards conformes à AUD-163 avec image valide pour un aperçu riche sur WhatsApp et les réseaux.
- **Démonstration** : un contenu partagé génère un message WhatsApp soigné et son lien ouvre directement Surga.

---

## BRIQUES ACTIVABLES — ordre à ajuster selon l'usage observé

### Tranche 8 — Revue de presse résumée
- [x] `DONE` Sélection de sources sénégalaises nationales certifiées (APS, Le Soleil, Seneweb, Le Quotidien, Sud Quotidien).
- [x] `DONE` Sourcing éthique et légal : résumés concis (< 180 car.), lien obligatoire vers l'article source, aucun article reproduit intégralement.
- [x] `DONE` Catégorisation thématique déterministe (Économie, Société, Tech & Digital, Politique/Institutions, Général).
- [x] `DONE` Route REST `/api/surga/presse` avec filtrage par rubrique et endpoint d'actualisation `/api/surga/presse/refresh`.
- [x] `DONE` Composant modulaire `SurgaPresseView.tsx` (< 450 lignes, zéro émoji, tokens Nopalou) avec sélecteur de rubriques défilable et intégration du bouton de partage.
- **Démonstration** : l'utilisateur explore la revue de presse par rubrique thématique, consulte les résumés sourcés et peut partager une brève en 1 clic.

### Tranche 9 — Audio en option
- [x] `DONE` Option audio désactivée par défaut (respect strict du principe Low-Data et de la décision D5), activable dans les paramètres.
- [x] `DONE` Synthèse vocale locale native (`window.speechSynthesis`, voix française, 0 Mo de données mobiles) via `surga-audio.ts`.
- [x] `DONE` Composant modulaire `SurgaAudioPlayer.tsx` (< 220 lignes) : Play/Pause, vitesse variable (1.0x, 1.25x, 1.5x), progression fluide et indicateur d'écoute.
- [x] `DONE` Flux Podcast RSS 2.0 privé par utilisateur (`/api/surga/podcast/:token/feed.xml`) avec jeton sécurisé révocable.
- [x] `DONE` Composant modulaire `SurgaPodcastModal.tsx` (< 200 lignes) avec copie de l'URL privée et régénération du lien de sécurité.
- **Démonstration** : l'utilisateur active l'option audio, écoute son briefing matinal dans l'application à vitesse réglable, et peut s'abonner via son flux podcast privé dans Apple Podcasts / AntennaPod.

### Tranche 10 — Radios Locales du Sénégal (Directs FM & Low-Data)
- [x] `DONE` Bouquet de radios nationales et régionales sénégalaises (RTS 92.5 RSI, Sud FM 98.5, Rewmi FM 97.5, Oxy Jeunes 103.4, Radio Al Fayda Kaolack 90.1, GMS Ziguinchor 89.3, Zig FM 100.8, RTS Matam 89.1, RTS Tamba 92.0, Dakar Musique, Radio Fulbe FM 102.6).
- [x] `DONE` Mode Low-Data strict : flux légers (64 à 128 kbps), zéro vidéo, proxy backend sécurisé `/api/surga/radios/:id/stream` pour compatibilité HTTPS et arrêt immédiat à la déconnexion.
- [x] `DONE` Composants React modulaires (< 450 lignes) : `SurgaRadioModal.tsx` (411 l.), `SurgaRadioMiniPlayer.tsx` (115 l.), `SurgaRadioCard.tsx` (115 l.), `SurgaArticleCard.tsx` (85 l.).
- [x] `DONE` Accès ergonomique : bouton "Radios FM" dans `SurgaAudioPlayer`, dans `SurgaPresseView` et dans l'onglet Paramètres.
- [x] `DONE` Tests unitaires Jest : 49/49 passés (100%).
- **Démonstration** : l'utilisateur explore les stations sénégalaises par région ou thématique et lance l'écoute en direct d'un simple clic sans interruption.

### Tranche 11 — Trafic à Dakar (Corridors, Heures de Pointe & Sondes TomTom Live)
- [x] `DONE` Tables SQL `surga_trafic_axes` et `surga_trafic_signalements` (migration idempotente dans `backend/migrate-inline.js`).
- [x] `DONE` Connecteur temps réel TomTom Traffic Flow & Incidents API (`interrogerTomTomSegment`, `interrogerTomTomIncidents`) avec coordonnées GPS des 8 corridors de Dakar, détection des vitesses réelles (km/h) et des incidents.
- [x] `DONE` Cache mémoire serveur Low-Data (TTL 6 min) respectant strictement les 2 500 requêtes gratuites/jour sans carte bancaire.
- [x] `DONE` Modèle déterministe d'heures de pointe de repli (matin vers Plateau, soir vers banlieue, TER et BRT fluides par défaut) et signalements participatifs citoyens vérifiés (< 180 caractères).
- [x] `DONE` Service `backend/services/surga/trafic-service.js` avec synthèse vocale/briefing au vouvoiement strict D19.
- [x] `DONE` Routes REST complètes sur `/api/surga/trafic` (`GET /`, `GET /synthese`, `GET /axes`, `GET /incidents`, `POST /signalements`).
- [x] `DONE` Composants React modulaires (< 450 lignes) : `SurgaTraficCard.tsx` (252 l.), `SurgaTraficModal.tsx` (409 l.), `SurgaTraficItemCard.tsx` (121 l.), `SurgaTraficReportForm.tsx` (118 l.).
- [x] `DONE` Tests unitaires Jest : 58/58 passés (100%).
- **Démonstration** : l'utilisateur consulte l'état des axes clés de Dakar en direct avec vitesse constatée (km/h) et badge DIRECT, explore les corridors et transports (TER/BRT), et signale un incident avec confirmation immédiate.

### Tranche 12 — Immobilier (réutilise le pôle existant)
- [x] `DONE` Réutilisation stricte du pôle immobilier existant (`annonces_immo`, `agences_immo`, `backend/lib/immo-publiable.js`) sans aucun doublon de catalogue.
- [x] `DONE` Table `surga_alertes_immo` et index de performance dans `backend/migrate-inline.js`.
- [x] `DONE` Service `backend/services/surga/immo-service.js` avec :
  - Liste canonique des 27 quartiers majeurs de Dakar (`QUARTIERS_DAKAR`).
  - Parser en langage naturel (`parserRechercheImmoNaturelle`) : type de bien (villa, appartement, studio, terrain, bureau), transaction (location, vente), quartier dakarois, budget maximum (détection des millions FCFA, k et montants bruts), meublé et nombre de pièces/chambres.
  - Recherche multi-critères sécurisée anti-IDOR (`rechercherBiensImmo`).
  - Moteur d'évaluation d'alertes en temps réel (`evaluerAlertesPourNouvelleAnnonce`, matching < 2 min).
  - Synthèse briefing immobilier au vouvoiement strict D19 (`genererSyntheseImmoBriefing`).
- [x] `DONE` Routes REST dans `backend/routes/surga/immo.js` (`GET /immo/biens`, `GET /immo/biens/:id`, `GET /immo/quartiers`, `POST /immo/recherche-vocale`, `GET /immo/alertes`, `POST /immo/alertes`, `PATCH /immo/alertes/:id/toggle`, `DELETE /immo/alertes/:id`, `GET /immo/synthese`).
- [x] `DONE` Composants React modulaires (< 450 lignes) :
  - `SurgaImmoCard.tsx` (195 l.) : affichage des fiches avec badge "Vérifié", photos, quartier, prix FCFA et contact direct Téléphone / WhatsApp.
  - `SurgaImmoAlerteModal.tsx` (340 l.) : formulaire épuré de veille personnalisée.
  - `SurgaImmoModal.tsx` (448 l.) : modale de navigation avec onglets "Biens disponibles" et "Mes alertes", recherche en langage naturel et filtres rapides.
  - `SurgaImmoDashboardCard.tsx` (160 l.) : carte d'aperçu pour le tableau de bord avec synthèse D19.
  - `SurgaParametresTab.tsx` (145 l.) : factorisation de l'onglet paramètres permettant à `page.tsx` de rester à 395 lignes (< 450 l.).
- [x] `DONE` Tests unitaires Jest : 67/67 passés (100%).
- **Démonstration** : l'utilisateur explore les biens certifiés de Dakar par filtres ou recherche libre, active une alerte personnalisée avec notification sous 2 minutes et contacte directement l'agence par WhatsApp en 1 clic.

### Tranche 13 — Concours et examens
- [ ] `PROPOSED` Table `Exam`, suivi d'un concours, rappels J-30 / J-7 / J-1.
- **Démonstration** : un rappel part le jour J-1 prévu.

### Tranche 13 — Bons plans
- [ ] `PROPOSED` Table `Place`, ingestion des avis Google Maps, résumé honnête, tags d'ambiance,
  budget estimé en FCFA, recherche par quartier.
- **Démonstration** : l'utilisateur envoie un quartier et reçoit 3 recommandations résumées.

---

## MONÉTISATION ET SORTIE

### Tranche 14 — Premium et espaces professionnels
- [ ] `PROPOSED` Premium B2C (quotas vocaux étendus, audio, personnalisation avancée) payé par
  Mobile Money (réutiliser l'intégration existante).
- [ ] `PROPOSED` Espaces pro : agences, centres de formation, restaurateurs (Gratuit,
  Pro 5 000 FCFA, Business 10 000 FCFA), avec limites et statistiques selon le palier.
- **Démonstration** : un utilisateur passe en premium ; une agence souscrit un abonnement et en
  voit l'effet.

### Tranche 15 — Durcissement et mise en production
- [ ] `PROPOSED` Audit de poids (pages publiques et app), Lighthouse.
- [ ] `PROPOSED` Revue de sécurité anti-IDOR sur toutes les ressources utilisateur et pro.
- [ ] `PROPOSED` Export et suppression des données personnelles ; revue du consentement.
- [ ] `PROPOSED` Pull request de `feature/surga` vers `main`, relue par l'utilisateur.
- **Critère de sortie** : tranches 1 à 7 `DONE`, briques activées validées, audits conformes et
  ordre explicite de déploiement de l'utilisateur.

---

## Évolutions futures (hors plan actuel)
- Application native si la part d'iPhone ou l'usage l'exigent.
- Appel téléphonique pour écouter le briefing (coût par minute à étudier).
- Telegram comme canal complémentaire (règles à vérifier).
- Wolof pour la voix et l'audio, après tests de qualité.
- Sponsoring du briefing.

## Règles Transverses
- Aucun `git push` sans ordre explicite. Une entrée de journal par tranche livrée.
- Une tranche est démontrable de bout en bout avant de passer à la suivante.
- En cas de doute (portée, conflit avec l'existant, flux WhatsApp), poser la question
  (`docs/surga/INTEGRATION_NOPALOU.md`, section 3).
- Ne jamais toucher au comparateur d'achats ni à la Caisse PRO.
