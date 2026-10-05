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
- [x] `DONE` Contexte audio persistant `SurgaRadioContext` (`frontend-next/src/lib/surga-radio-context.tsx`) assurant l'écoute ininterrompue en arrière-plan pendant la navigation dans tout Surga.
- [x] `DONE` Barre flottante persistante `SurgaPersistentRadioBar.tsx` au-dessus de la barre d'onglets avec égaliseur dynamique animé, contrôles Play/Pause, Mute, Stop et support de l'API standard `navigator.mediaSession`.
- [x] `DONE` Composants React modulaires (< 450 lignes) : `SurgaRadioModal.tsx` (305 l.), `SurgaPersistentRadioBar.tsx` (234 l.), `SurgaRadioMiniPlayer.tsx` (130 l.), `SurgaRadioCard.tsx` (121 l.), `SurgaRadioProvider.tsx` (15 l.).
- [x] `DONE` Accès ergonomique : bouton "Radios FM" dans `SurgaAudioPlayer`, dans `SurgaPresseView` et dans l'onglet Paramètres.
- [x] `DONE` Tests unitaires Jest : 99/99 passés (100%).
- **Démonstration** : l'utilisateur explore les stations sénégalaises, lance l'écoute en direct et continue de naviguer librement dans Surga avec une barre flottante persistante et des contrôles sur l'écran de verrouillage.

### Tranche 11 — Trafic à Dakar (Corridors, Heures de Pointe & Sondes TomTom Live)
- [x] `DONE` Tables SQL `surga_trafic_axes` et `surga_trafic_signalements` (migration idempotente dans `backend/migrate-inline.js`) et 11 corridors synchronisés par seeding idempotent (`scripts/seed-surga-data.js`).
- [x] `DONE` Connecteur temps réel TomTom Traffic Flow & Incidents API (`interrogerTomTomSegment`, `interrogerTomTomIncidents`) avec coordonnées GPS des 11 corridors de Dakar.
- [x] `DONE` Cache mémoire serveur Low-Data (TTL 6 min) respectant strictement les 2 500 requêtes gratuites/jour sans carte bancaire.
- [x] `DONE` Modèle déterministe d'heures de pointe de repli recalibré (matin vers Plateau, soir vers banlieue + goulots EMG/Hann Maristes sur A1 entrant et Route du Front de Terre, TER et BRT fluides par défaut) et signalements participatifs citoyens vérifiés (< 180 caractères).
- [x] `DONE` Passerelle directe 1-tap vers le trafic crowdsourcé Google Maps Live (`https://www.google.com/maps/@14.7300,-17.4480,13z/data=!5m1!1e1`) sur `SurgaTraficModal.tsx` et `SurgaTraficCard.tsx`, avec boutons d'itinéraire direct par axe dans `SurgaTraficItemCard.tsx`.
- [x] `DONE` Service `backend/services/surga/trafic-service.js` avec synthèse vocale/briefing au vouvoiement strict D19.
- [x] `DONE` Routes REST complètes sur `/api/surga/trafic` (`GET /`, `GET /synthese`, `GET /axes`, `GET /incidents`, `POST /signalements`).
- [x] `DONE` Composants React modulaires (< 450 lignes) : `SurgaTraficCard.tsx` (277 l.), `SurgaTraficModal.tsx` (448 l.), `SurgaTraficItemCard.tsx` (139 l.), `SurgaTraficReportForm.tsx` (118 l.).
- [x] `DONE` Tests unitaires Jest : 99/99 passés (100%).
- **Démonstration** : l'utilisateur consulte l'état des axes clés de Dakar en direct avec vitesse constatée (km/h) et badge DIRECT, accède en 1 clic à la carte en direct Google Maps, explore les corridors et transports (TER/BRT), et signale un incident avec confirmation immédiate.

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

### Tranche 13 — Concours et examens du Sénégal
- [x] `DONE` Tables SQL idempotentes `surga_concours` et `surga_suivi_concours` avec index de performance dans `backend/migrate-inline.js`.
- [x] `DONE` Service `backend/services/surga/concours-service.js` avec :
  - Catalogue riche des concours nationaux (ENA, FASTEF, Douanes, Police, CREM, Baccalauréat, BFEM, CESTI, ESP, ENSA).
  - Calcul déterministe des échéances et phases d'urgence (`calculerEcheances` : J-30, J-7, J-1, Clôture).
  - Moteur de suivi (`suivreConcours`) avec injection automatique des rappels dans l'Agenda Surga (`surga_agenda`).
  - Synthèse pour le briefing du matin au vouvoiement strict D19 (`genererSyntheseConcoursBriefing`).
- [x] `DONE` Routes REST dans `backend/routes/surga/concours.js` (`GET /concours`, `GET /concours/categories`, `GET /concours/suivis`, `GET /concours/synthese`, `GET /concours/:id`, `POST /concours/:id/suivre`, `DELETE /concours/:id/suivre`).
- [x] `DONE` Composants React modulaires (< 450 lignes) :
  - `SurgaConcoursCard.tsx` (175 l.) : carte d'aperçu d'un concours avec statut, décompte J-X et bouton Suivre.
  - `SurgaConcoursDetailModal.tsx` (340 l.) : modale avec calendrier officiel, checklist interactive des pièces administratives et centres de préparation.
  - `SurgaConcoursModal.tsx` (395 l.) : vue complète avec barre de recherche instantanée, filtres par catégorie et onglets *Tous* et *Mes concours suivis*.
  - `SurgaConcoursDashboardCard.tsx` (170 l.) : carte d'aperçu sur le tableau de bord Surga.
  - `SurgaParametresTab.tsx` (190 l.) : raccourci de paramétrage vers les concours nationaux.
- [x] `DONE` Tests unitaires Jest : **73/73 passés (100%)**.
- **Démonstration** : l'utilisateur explore les concours ouverts de la fonction publique et des grandes écoles, active le suivi en 1 clic pour recevoir les alertes J-30/J-7/J-1 dans son agenda et utilise la checklist pour préparer ses pièces justificatives.

### Tranche 14 — Bons plans & Adresses à Dakar
- [x] `DONE` Tables SQL idempotentes `surga_places` et `surga_favoris_places` avec index de performance dans `backend/migrate-inline.js`.
- [x] `DONE` Catalogue référentiel complet de 42 adresses certifiées (`backend/data/surga-places-catalogue.json`, 927 l.) couvrant les 5 catégories (Restaurants, Dibiteries, Cafés & Coworking, Bord de Mer, Brunchs & Pâtisseries) et 13 quartiers/villes (Plateau, Almadies, Ngor, Ouakam, Point E, Mermoz, Fann, Mamelles, Yoff, Médina, Liberté, Rufisque, Pikine, Guédiawaye, Saly).
- [x] `DONE` Seeding PostgreSQL automatisé (`scripts/seed-surga-data.js`) avec `ON CONFLICT (id) DO UPDATE` pour synchroniser les 42 adresses en base `surga_places`.
- [x] `DONE` Service `backend/services/surga/places-service.js` avec :
  - Repli mémoire instantané sur le catalogue JSON `surga-places-catalogue.json`.
  - Résumés honnêtes des avis clients en 3 lignes (< 260 caractères) avec points forts, spécialités et bémols constructifs sans complaisance.
  - Parser de recherche en langage naturel (`parserRecherchePlacesNaturelle`) extrayant envie (dibi, thieb, café, burger, brunch), quartier, ambiance (calme, wifi rapide, vue mer, terrasse, climatisé) et budget maximal.
  - Recherche multi-critères pondérée avec tri par note et nombre d'avis, et calcul exact du total via `COUNT(*) OVER() AS full_count`.
  - Gestion des coups de cœur (favoris) persistés par utilisateur.
  - Synthèse vocale et briefing au vouvoiement strict D19 (`genererSynthesePlacesBriefing`).
- [x] `DONE` Routes REST dans `backend/routes/surga/places.js` (`GET /`, `GET /categories`, `GET /favoris`, `GET /synthese`, `GET /:id`, `POST /recherche-vocale`, `POST /:id/favori`) avec `limit=100` par défaut et normalisation numérique systématique (`normaliserPlaceRow` pour `NUMERIC(2,1)` de PostgreSQL).
- [x] `DONE` Composants React modulaires (< 450 lignes) & Rendu défensif :
  - `SurgaPlaceCard.tsx` (354 l.) : affichage de la fiche avec note numérique défensive, résumé honnête 3 lignes, spécialité, contact direct WhatsApp et bouton favori.
  - `SurgaPlaceDetailModal.tsx` (393 l.) : modale avec détails complets, horaires, adresse, avis honnête, itinéraire Google Maps et partage.
  - `SurgaPlacesModal.tsx` (382 l.) : vue complète avec recherche en langage naturel, filtres par catégorie, filtres par quartier enrichis (Rufisque, Pikine, Guédiawaye, Yoff, Médina, Liberté, Saly) et onglets *Toutes les adresses (42)* et *Coups de cœur*.
  - `SurgaPlacesDashboardCard.tsx` (135 l.) : carte de recommandation du jour sur le tableau de bord Surga avec protection anti-crash `.toFixed`.
  - `SurgaParametresTab.tsx` (217 l.) : raccourci de paramétrage vers les bonnes adresses.
- [x] `DONE` Tests unitaires Jest : **99/99 passés (100%)**.
- **Démonstration** : l'utilisateur tape ou dicte son envie ("un bon dibi aux Almadies", "café calme coworking Point E", "restaurant à Rufisque"), explore les 42 recommandations authentiques avec résumés honnêtes sans complaisance, contacte directement par WhatsApp en un clic et ajoute ses adresses favorites à ses coups de cœur.

---

## MONÉTISATION ET SORTIE

### Tranche 15 — Premium et espaces professionnels
- [x] `DONE` Table SQL `surga_abonnements` (migration idempotente avec index dans `backend/migrate-inline.js`).
- [x] `DONE` Service `backend/services/surga/abonnement-service.js` :
  - Catalogue des formules B2C et B2B : Surga Premium (1 500 FCFA/mois ou 15 000 FCFA/an avec 2 mois offerts), Surga Visibilité Resto (5 000 FCFA/mois), Surga Immo Pro (5 000 FCFA/mois), Surga Éducation & Prépa Concours (10 000 FCFA/mois).
  - Déblocage automatique des quotas illimités pour les utilisateurs Premium dans `verifierQuota` (`backend/services/surga/whatsapp-handler.js`).
  - Intention de paiement Wave Checkout et Orange Money avec génération de référence unique.
  - Calcul et supervision financière en direct (MRR estimé en FCFA, volume encaissé, abonnés actifs).
- [x] `DONE` Routes REST publiques et authentifiées dans `backend/routes/surga/abonnements.js` (`GET /plans`, `GET /mon-statut`, `POST /initier`, `POST /verifier`).
- [x] `DONE` Supervision administrative complète dans `backend/routes/admin-surga.js` (`GET /abonnements`, `PUT /abonnements/:id/statut`).
- [x] `DONE` Composants React modulaires (< 450 lignes, zéro émoji, tokens Nopalou) :
  - `SurgaPremiumModal.tsx` (360 l.) : modale 1-clic pour les utilisateurs avec choix de cycle (mensuel/annuel), provider (Wave/OM) et confirmation.
  - `SurgaProModal.tsx` (320 l.) : modale d'adhésion pour les partenaires B2B (restaurateurs, agences, centres de concours).
  - `SurgaParametresTab.tsx` (314 l.) : affichage du badge Premium, jours restants et bouton d'action.
  - `SurgaModalsContainer.tsx` (136 l.) : factorisation pour maintenir `surga/page.tsx` à 428 lignes.
  - `AdminAbonnementsTab.tsx` (288 l.) : onglet de supervision MRR et abonnements avec filtres et actions de modération.
  - `AdminSurgaClient.tsx` (384 l.) : intégration de l'onglet financier *Abonnements & MRR*.
- [x] `DONE` Tests unitaires Jest : **87/87 passés (100%)**.
- **Démonstration** : un utilisateur particulier souscrit à Surga Premium par Wave ou Orange Money et débloque le vocal illimité et les alertes immédiates ; un restaurateur ou une agence souscrit à une formule pro pour être mis en avant ; l'administrateur suit le MRR et gère les abonnements en direct sur `/admin/surga`.

### Tranche 16 — Durcissement, Sécurité Anti-IDOR, Export/Suppression RGPD & Clôture
- [x] `DONE` Revue de sécurité anti-IDOR complète sur 100% des routes privées (`/api/surga/*` et `/api/admin/surga/*`).
- [x] `DONE` Service `backend/services/surga/donnees-service.js` :
  - Portabilité des données : extraction exhaustive de toutes les données liées à l'utilisateur (préférences, notes, dépenses, agenda, alertes immo, concours, favoris, abonnements).
  - Droit à l'oubli définitif : purge irréversible et complète de toutes les tables avec confirmation obligatoire.
- [x] `DONE` Routes REST `/api/surga/donnees` (`GET /export`, `DELETE /supprimer`).
- [x] `DONE` Modale PWA `SurgaDonneesModal.tsx` (268 l.) avec téléchargement direct du fichier JSON et garde-fou strict avec saisie de confirmation `SUPPRIMER`.
- [x] `DONE` Accès direct dans `SurgaParametresTab.tsx` (347 l.) et `surga/page.tsx` maintenu à 431 lignes (< 450 l.).
- [x] `DONE` Audit de performance et Low-Data : zéro police externe téléchargée, strict respect des polices natives système.
- [x] `DONE` Suite de tests unitaires Jest : **91/91 passés (100%)**.
- [x] `DONE` Tests unitaires frontend Next.js : **97/97 passés (100%)**.
- [x] `DONE` Compilation TypeScript : **0 erreur**.
- **Critère de sortie** : 100% des tranches (1 à 16) `DONE`, console d'administration `/admin/surga` opérationnelle, audits conformes, code prêt pour la fusion/déploiement sur ordre de l'utilisateur.

### Tranche 17 — Sama Xaalis & Sport Direct Multi-Ligues (05 Octobre 2026)
- [x] `DONE` Reproduction complète de Sama Xaalis dans Surga (`surga-kalpe.ts`, `SurgaSamaXaalisView.tsx`).
- [x] `DONE` Portefeuille personnel intégré dans la barre d'onglets principale (`SurgaBottomNav.tsx`).
- [x] `DONE` Suivi des dettes et créances avec remboursement direct, cagnottes et épargne avec jauges de progression.
- [x] `DONE` Sport temps réel multi-ligues (Europe, Ligue 1 Sénégal, Lions de la Teranga) et modal de personnalisation (`SurgaSportCustomModal.tsx`).

### Tranche 18 — Météo Multi-Localités (23 Zones), GPS 1-Clic & Kiosque Fluide (05 Octobre 2026)
- [x] `DONE` Météo & Marées océaniques Open-Meteo haute précision (`meteo-service.js`, `SurgaMeteoCard.tsx`).
- [x] `DONE` Catalogue exhaustif de 23 localités (Dakar intra-muros, banlieue, régions) et modale de sélection (`SurgaMeteoLocaliteModal.tsx`).
- [x] `DONE` Géolocalisation GPS 1-clic avec algorithme de plus proche voisin (`trouverLocalitePlusProche`) et persistance `localStorage`.
- [x] `DONE` Algorithme de résolution strict à deux passes (priorité absolue aux quartiers spécifiques comme "Dakar Plateau" ou "Ouakam" avant la ville générique "Dakar").
- [x] `DONE` Défilement horizontal tactile fluide pour le Kiosque des Unes de la presse sénégalaise (`SurgaPresseCard.tsx`).
- [x] `DONE` Durcissement des en-têtes HTTP de sécurité : `Permissions-Policy: geolocation=(self)` et conditionnement de `CSP-Report-Only` en production.
- [x] `DONE` Ergonomie & anti-troncature de la modale météo : `flexShrink: 0` sur l'en-tête, `minHeight: 0` sur la liste scrollable et `touchAction: 'manipulation'` sur chaque bouton.
- [x] `DONE` Suite de tests Jest portée à **98/98 passés (100%)**, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 0 violation.

### Tranche 19 — Météo 14 Régions, API Next.js Autonome & Recherche Anti-Diacritiques (05 Octobre 2026)
- [x] `DONE` Extension du catalogue à 28 localités couvrant l'intégralité des 14 régions du Sénégal et les quartiers clés de Dakar (`src/lib/surga-meteo.ts`).
- [x] `DONE` Normalisation NFD anti-diacritiques et ligatures (`[œŒ]` -> `oe`) garantissant la détection parfaite des requêtes sans accent ("thies", "guediawaye", "sacre coeur").
- [x] `DONE` Route Handler Next.js autonome (`src/app/api/surga/meteo/route.ts`) servant la météo Open-Meteo sans dépendre du backend Express distant.
- [x] `DONE` Modale de sélection résiliente (`SurgaMeteoLocaliteModal.tsx`, 382 l.) avec fallback catalogue automatique immédiat et détection de sélection fiabilisée.
- [x] `DONE` Carte Météo (`SurgaMeteoCard.tsx`, 412 l.) avec extraction modulaire de `SurgaMeteoPrevisions.tsx` (101 l., règle des 450 lignes), bouton d'action explicite « Changer » (`MapPin`), callback `onVilleChange` liant la météo aux préférences du briefing et fallback local gracieux.
- [x] `DONE` Alignement du backend (`meteo-service.js`, `briefing.js`) et enrichissement des tests Jest portés à **99/99 passés (100%)**, `npx tsc --noEmit` 0 erreur, Anti-AI-Slop 0 violation.

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
