# PLAN — Surga, l'assistant de poche de Nopalou

> Format aligné sur le skill `/planifie` (Claude Mastery) : **tranches verticales** ("tracer
> bullets"). Chaque tranche est livrable et démontrable de bout en bout (données, API, écran de
> l'app ou message WhatsApp). Les durées sont indicatives et seront recalibrées après l'audit.

Statuts : `PROPOSED` → `IN_PROGRESS` → `IN_REVIEW` → `DONE` → `ARCHIVED`. Chaque tranche livrée
donne lieu à une entrée dans `docs/surga/JOURNAL-LIVRAISONS.md`.

---

## Phase 0 — Audit du dépôt existant et validations préalables
**Surga s'intègre dans le dépôt Nopalou existant. Cette phase commence toujours par l'audit.**
- [ ] `PROPOSED` Exécuter l'audit de `docs/surga/INTEGRATION_NOPALOU.md` (section 1) et en rendre un
  résumé court.
- [ ] `PROPOSED` Poser les questions de clarification nécessaires (section 3 du protocole).
- [ ] `PROPOSED` Fusionner le `CLAUDE.md` existant avec `CLAUDE_SURGA.md` si applicable, validation
  de l'utilisateur requise.
- [ ] `PROPOSED` Créer la branche `feature/surga`.
- [ ] `PROPOSED` Enregistrer le résultat de l'audit dans `docs/surga/AUDIT.md` et chaque
  décision tranchée dans `docs/surga/DECISIONS.md`.
- [ ] `PROPOSED` Valider le cadre WhatsApp autorisé pour Surga (Meta / fournisseur d'accès).
- [ ] `PROPOSED` Spike de validation : source de données du trafic à Dakar (faisabilité, coût).
- [ ] `PROPOSED` Spike de validation : qualité de la transcription vocale en français avec
  enregistrements réalistes (bruit de rue, chiffres).
- [ ] `PROPOSED` Test PWA sur iPhone et Android : installation, notifications, audio en
  arrière-plan.

---

## NOYAU — l'assistant indispensable au quotidien

### Tranche 1 — "Je m'installe et je personnalise mon Surga"
- [ ] `PROPOSED` Inscription et connexion OTP SMS (réutiliser l'auth existante).
- [ ] `PROPOSED` PWA installable (manifest, service worker, icône).
- [ ] `PROPOSED` Profil de personnalisation : briques choisies, heure du briefing, langue,
  quartiers, équipes suivies.
- [ ] `PROPOSED` Fixer le budget de poids de l'app connectée (point de départ : JS initial
  < 120 Ko).
- **Démonstration** : un testeur installe l'app, choisit ses briques et son heure de briefing en
  moins de 2 minutes, et retrouve ses choix à la réouverture.

### Tranche 2 — "Je reçois mon briefing du matin"
- [ ] `PROPOSED` Ingestion de sources (flux RSS d'actualité, programme/scores sportifs).
- [ ] `PROPOSED` Génération du briefing texte personnalisé (résumés courts, liens vers les
  sources).
- [ ] `PROPOSED` Écran "Aujourd'hui" et notification à l'heure choisie (push web).
- **Démonstration** : à l'heure choisie, le testeur reçoit une notification et ouvre un briefing
  correspondant à ses briques.

### Tranche 3 — "Je note, je compte, je calcule"
- [ ] `PROPOSED` Notes (création, recherche, suppression).
- [ ] `PROPOSED` Dépenses structurées (montant FCFA, catégorie, date) et récapitulatif du mois.
- [ ] `PROPOSED` Calculatrice avec moteur de calcul déterministe.
- [ ] `PROPOSED` Fonctionnement hors ligne minimal avec synchronisation au retour du réseau.
- **Démonstration** : en mode avion, le testeur ajoute une dépense et fait un calcul ; au retour
  du réseau, la dépense apparaît dans son récapitulatif.

### Tranche 4 — "Mon agenda et mes rappels"
- [ ] `PROPOSED` Événements et rappels (date, heure, répétition simple).
- [ ] `PROPOSED` Notifications de rappel (push web) et affichage dans le briefing.
- **Démonstration** : un rappel créé pour dans 5 minutes déclenche une notification à l'heure.

### Tranche 5 — "Surga sur WhatsApp, pour des tâches précises"
- [ ] `PROPOSED` Webhook WhatsApp et templates approuvés (briefing, rappels, alertes).
- [ ] `PROPOSED` Commandes structurées ("note 2500 taxi", "rappel demain 8h").
- [ ] `PROPOSED` Note vocale : transcription, extraction de l'intention, confirmation
  ("Noté : 2 500 FCFA, transport. Correct ?"), enregistrement après confirmation.
- [ ] `PROPOSED` Quotas de commandes vocales et mesure des coûts.
- **Démonstration** : le testeur envoie une note vocale "note 2 500 de taxi", confirme, et voit
  la dépense apparaître dans l'app.

### Tranche 6 — "Je commande à la voix dans l'app"
- [ ] `PROPOSED` Micro dans l'app (reconnaissance vocale, avec repli si non supporté sur
  iPhone).
- [ ] `PROPOSED` Même chaîne de confirmation que sur WhatsApp ; "100 divisé par 3" exécuté par le
  moteur de calcul.
- **Démonstration** : le testeur dicte un calcul et une dépense ; le résultat est exact et la
  dépense n'est enregistrée qu'après confirmation.

### Tranche 7 — "Je partage"
- [ ] `PROPOSED` Cartes partageables (brève, score, programme du week-end) vers WhatsApp et
  statuts, avec lien vers l'app.
- **Démonstration** : un contenu partagé s'affiche correctement dans WhatsApp et son lien ouvre
  Surga.

---

## BRIQUES ACTIVABLES — ordre à ajuster selon l'usage observé

### Tranche 8 — Revue de presse résumée
- [ ] `PROPOSED` Sélection de sources sénégalaises (conformité aux conditions des flux),
  résumés courts, liens, aucun article reproduit en entier.
- **Démonstration** : l'utilisateur active la brique et reçoit une revue de presse sourcée.

### Tranche 9 — Audio en option
- [ ] `PROPOSED` Génération audio pré-générée et compressée du briefing (désactivée par défaut).
- [ ] `PROPOSED` Lecteur dans l'app, téléchargement en Wi-Fi.
- [ ] `PROPOSED` Flux podcast privé par utilisateur.
- **Démonstration** : l'utilisateur active l'option, télécharge son briefing en Wi-Fi et
  l'écoute hors connexion ; le même épisode apparaît dans son appli de podcast.

### Tranche 10 — Trafic à Dakar
- [ ] `PROPOSED` Selon le résultat du spike de la Phase 0 : intégration de la source retenue ou
  signalements communautaires, présentés avec leur fraîcheur.
- **Démonstration** : l'utilisateur voit l'état de ses trajets habituels avec l'heure de mise à
  jour.

### Tranche 11 — Immobilier (réutilise le pôle existant)
- [ ] `PROPOSED` Étendre `Property` et le pôle immobilier existant (pas de doublon).
- [ ] `PROPOSED` Recherche, alertes (app et WhatsApp), annonces d'agences.
- **Démonstration** : une nouvelle annonce déclenche une alerte en moins de 2 minutes.

### Tranche 12 — Concours et examens
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
