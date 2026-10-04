# CAHIER DES CHARGES TECHNIQUE ET FONCTIONNEL — SURGA

**Projet :** Surga, l'assistant de poche de Nopalou
**Produit principal :** application installable (PWA) ; WhatsApp en canal à tâches précises ;
flux podcast privé en option
**Méthodologie :** Vibe Coding (Discover, Plan, Setup, Build)
**Statuts de tâches :** PROPOSED → IN_PROGRESS → IN_REVIEW → DONE → ARCHIVED
**Destinataires :** agents IA de développement et équipe technique

---

## 0. Périmètre vis-à-vis de Nopalou.com (règle de non-régression)
Surga est rattaché à Nopalou : même dépôt Git, même marque, même compte utilisateur, même
infrastructure de paiement. Protocole d'audit : `docs/surga/INTEGRATION_NOPALOU.md`.

**Réutilisé et étendu (ne pas dupliquer) :**
- Pôle immobilier existant, devenu la brique Immobilier.
- Espace PRO agences, devenu l'espace professionnel Surga.
- Transactions WhatsApp sans commission : philosophie de contact direct, reprise par Surga.
- "Nopalou Pay Safe" (séquestre) : cautions de location et facturation B2B.
- "Garantie Shopping" : badge "annonce vérifiée" / "fiche validée".
- Bulle "Assistant Nopalou" : devient l'entrée vers Surga.
- Authentification, paiement Mobile Money, stack : ceux déjà en place.

**Hors périmètre (ne pas toucher) :** comparateur d'achats (téléphonie, électroménager,
alimentation, auto/moto) et Caisse PRO.

---

## 1. Vision et Périmètre
Surga regroupe en un seul endroit ce qu'une personne cherche "à gauche et à droite" sur son
smartphone, de façon personnalisable et utilisable à la voix. Le but est qu'elle l'ouvre chaque
jour et le garde, parce qu'il contient ses notes, ses dépenses, ses rendez-vous et ses
préférences. L'utilisateur cible est actif sur les réseaux sociaux, sur Android en majorité, avec
une donnée mobile comptée.

**Principes :**
1. Indispensable par l'usage quotidien (briefing, outils personnels).
2. Personnalisable : briques, heure du briefing, langue, quartiers, équipes, sources.
3. Fiable : calculs exacts, confirmation avant enregistrement, contenu sourcé.
4. Léger : peu de donnée mobile, hors ligne minimal.
5. Audio d'écoute en option, jamais par défaut.

---

## 2. Spécifications Fonctionnelles

### 2.1. Noyau

**2.1.1 Compte et personnalisation**
- Inscription et connexion par OTP SMS (réutiliser l'auth existante).
- Profil : briques activées, heure du briefing, langue, quartiers, équipes suivies, sources,
  option audio (désactivée par défaut).
- Onboarding en 3 écrans maximum. Les briques non choisies ne s'affichent pas.

**2.1.2 Briefing quotidien**
- Généré à l'heure choisie, texte court personnalisé : agenda du jour, brèves, sport, trafic
  selon les briques actives.
- Chaque élément d'actualité renvoie vers sa source. Aucun article reproduit en entier.
- Livré par notification push web et, si activé, par WhatsApp (message court renvoyant vers
  l'app).

**2.1.3 Notes**
- Création, recherche, modification, suppression, au clavier ou à la voix.

**2.1.4 Dépenses**
- Entrées structurées : montant (FCFA), catégorie, date, note optionnelle.
- Récapitulatif mensuel par catégorie. Totaux calculés par le moteur déterministe.

**2.1.5 Calculatrice**
- Opérations de base et pourcentages. Moteur de calcul déterministe (ex. `mathjs`).
- Commande vocale : "100 divisé par 3" est transcrit, l'opération est extraite, le moteur
  exécute et l'app affiche l'opération comprise avec le résultat.

**2.1.6 Agenda et rappels**
- Événements et rappels (date, heure, répétition simple). Notifications push web ; relais
  WhatsApp par modèle approuvé si activé.

**2.1.7 Commandes vocales**
- Entrées : note vocale WhatsApp (transcrite côté serveur) et micro dans l'app (reconnaissance
  vocale du navigateur ou transcription serveur, selon la plateforme).
- Chaîne : transcription, extraction d'intention (JSON structuré par le modèle d'IA), exécution
  par un module déterministe, **confirmation avant toute écriture**.
- Intentions du lancement : `ADD_EXPENSE`, `ADD_NOTE`, `CALCULATE`, `ADD_REMINDER`,
  `ADD_EVENT`. Toute phrase hors de ces intentions reçoit une réponse de limite claire, pas une
  improvisation.
- Langue : français au lancement ; wolof testé ensuite.
- Quotas : plafond gratuit par jour, au-delà réservé au premium. Chaque appel est mesuré.

**2.1.8 Partage**
- Cartes partageables (brève, score, programme du week-end) vers WhatsApp et statuts, avec lien
  vers l'app.

**2.1.9 Hors ligne**
- Notes, dépenses, calculatrice et dernier briefing disponibles sans réseau ; synchronisation au
  retour. Stratégie de résolution de conflits simple (dernière modification gagne, avec garde du
  contenu des deux versions pour les notes).

### 2.2. Canal WhatsApp (tâches précises uniquement)
- Autorisé : briefing, rappels, alertes, commandes structurées, notes vocales transcrites avec
  confirmation.
- Interdit : conversation libre généraliste (politique Meta sur l'API Business, en vigueur depuis
  le 15 janvier 2026). Les phrases hors intentions reçoivent un message invitant à ouvrir l'app.
- Messages sortants hors fenêtre de conversation via modèles approuvés.
- Réponses courtes, texte par défaut, zéro émoji.
- Le cadre exact autorisé est à confirmer avec Meta ou le fournisseur d'accès (Phase 0).

### 2.3. Audio (option)
- Désactivé par défaut, activable dans les réglages.
- Contenu du briefing converti en audio, **pré-généré et compressé**, téléchargeable en Wi-Fi ;
  lecteur dans l'app (lecture hors ligne).
- Flux podcast privé par utilisateur (URL personnelle non devinable, révocable), pour l'écoute
  dans n'importe quelle appli de podcast.
- Français au lancement ; wolof après tests de qualité.
- Pistes futures à étudier : appel téléphonique, Telegram.

### 2.4. Briques activables

**Actualités et revue de presse** : sources sénégalaises identifiées, flux RSS, résumés courts,
lien vers l'article, respect des conditions de chaque site. Table `Source`, `BriefingItem`.

**Sport** : scores, programme du week-end, équipes suivies. Table `SportEvent`. Source : API
sportive publique à choisir (couverture football et lutte à valider).

**Trafic à Dakar** : brique conditionnée au résultat du spike de la Phase 0 (API payante,
signalements communautaires ou autre). Chaque information affiche sa fraîcheur. Table
`TrafficReport`.

**Immobilier** : recherche en langage naturel, alertes (app et WhatsApp), annonces d'agences
(photos AVIF), badge "vérifié". Réutilise le pôle immobilier existant. Table `Property`
(étendue, pas dupliquée).

**Concours et examens** : suivi d'un concours, rappels J-30 / J-7 / J-1, catalogue de centres de
formation. Table `Exam`.

**Bons plans** : recommandations géolocalisées (quartier ou position), résumé honnête des avis
Google Maps (3 lignes), tags d'ambiance, budget estimé en FCFA. Table `Place`.

### 2.5. Espaces professionnels (B2B, ensuite)
- **Agences et centres** : Gratuit (5 offres actives), Pro 5 000 FCFA/mois (mise en avant,
  statistiques), Business 10 000 FCFA/mois (illimité, leads qualifiés, API).
- **Restaurateurs** : Gratuit (fiche issue de Google Maps), Visibilité 5 000 FCFA/mois (tête de
  liste, menu à jour, bouton WhatsApp direct), activé quand le trafic Bons plans le justifie.
- Palier masqué plutôt que grisé. Sécurité anti-IDOR obligatoire.

---

## 3. Modèle de Monétisation (FCFA uniquement)
- **Premium B2C** : quotas vocaux étendus, option audio, personnalisation avancée, stockage.
  Paiement Mobile Money (intégration existante).
- **Sponsoring du briefing** : à activer une fois l'audience installée.
- **B2B** : abonnements décrits en 2.5 ; commission pay-per-lead immobilier possible.
- **Gratuit** : noyau utilisable gratuitement, avec quotas, pour installer l'habitude.

---

## 4. Modèle de Données (cible, à adapter à l'existant)
Ce schéma est une cible : l'agent l'adapte au modèle réel du dépôt en étendant les tables
existantes, sans créer de doublon (`docs/surga/INTEGRATION_NOPALOU.md`).

**Noyau**
- `User` : id, phone_number (unique), role (`USER`, `PRO_AGENCY`, `PRO_EDUCATION`, `PRO_PLACE`),
  created_at.
- `Preference` : user_id, modules_enabled (liste), briefing_time, language, neighborhoods,
  followed_teams, audio_enabled, consent_flags.
- `Note` : id, user_id, content, created_at, updated_at.
- `Expense` : id, user_id, amount_xof, category, spent_at, note.
- `CalendarEvent` : id, user_id, title, starts_at, remind_at, repeat_rule.
- `VoiceCommandLog` : id, user_id, intent, confirmed (booléen), created_at. **Ne pas stocker la
  transcription en clair au-delà du traitement**, sauf consentement explicite.
- `PushSubscription` : id, user_id, endpoint, keys, created_at.
- `Subscription` : id, user_id, plan (`FREE`, `PREMIUM`, `PRO`, `BUSINESS`, `VISIBILITY`),
  status, expires_at.

**Contenu**
- `Source` : id, name, rss_url, active. `BriefingItem` : id, source_id, title, summary,
  url, published_at.
- `SportEvent` : id, competition, teams, score, status, starts_at.
- `TrafficReport` : id, zone, level, reported_at, source_type.

**Briques**
- `Property`, `Exam`, `Place`, `Alert` (user_id, module, search_criteria JSON, channel,
  is_active), `Subscription_Topic` (user_id, topic_key, channel).

---

## 5. Architecture Technique (cible, l'existant prime)
| Composant | Cible |
|---|---|
| Frontend | Next.js 14 (App Router) en PWA, Tailwind JIT |
| Backend | Node.js + Fastify |
| Données | PostgreSQL 16 + Prisma |
| Recherche | Meilisearch (index `properties`, `exams`, `places`) |
| Cache / sessions | Upstash Redis |
| Notifications | Web Push (VAPID) ; WhatsApp par modèles approuvés |
| Tâches planifiées | Cron / file de jobs (briefing, rappels, alertes, ingestion RSS) |
| IA | Modèle d'IA pour extraire les intentions et résumer ; transcription vocale (fournisseur à choisir) ; synthèse vocale pour l'option audio |
| Calcul | Moteur déterministe (`mathjs`) |
| Hébergement | VPS OVHcloud + Cloudflare (PoP Dakar) |
| Sources externes | Flux RSS, API sportive, Google Places API, source de trafic à valider |

Latences cibles : calcul local et réponses texte < 3 s ; note vocale transcrite et confirmée
~ 5 s ; `/search` P95 < 200 ms ; alerte < 2 min.

---

## 6. Contraintes Transverses
- **Poids** : pages publiques < 50 Ko (HTML < 30 Ko, JS < 80 Ko) ; app connectée selon budget
  fixé à la Tranche 1 (point de départ : JS initial < 120 Ko).
- **Fiabilité** : aucun calcul par le modèle d'IA ; confirmation avant écriture vocale.
- **Données personnelles** : consentement, chiffrement en transit, accès limité, export et
  suppression complète, pas de contenu sensible dans les logs.
- **Sécurité** : anti-IDOR sur toutes les ressources utilisateur et pro ; limitation de débit
  sur les endpoints vocaux et d'authentification.
- **Contenu** : sourcé, liens vers les originaux, pas de reproduction intégrale.
- **Design** : `docs/surga/DESIGN.md`, zéro émoji, icônes `lucide-react`, FCFA uniquement.

---

## 7. Plan d'Exécution
Détail dans `docs/surga/PLAN.md` : Phase 0 (audit et validations), noyau (tranches 1 à 7), briques
(tranches 8 à 13), monétisation et sortie (tranches 14 et 15). Estimation indicative : noyau en
environ 3 mois, puis briques par tranches de 3 à 4 semaines, à recalibrer après l'audit.

---

## 8. Points en Attente de Décision
- Résultat de l'audit du dépôt existant.
- Cadre WhatsApp autorisé pour Surga (confirmation Meta / fournisseur).
- Source de données du trafic à Dakar.
- Fournisseurs de transcription vocale, de synthèse vocale et modèle d'IA ; coûts et quotas.
- Conditions d'utilisation des flux de presse sénégalais retenus.
- Part d'iPhone parmi les utilisateurs et comportement de la PWA (notifications, audio).
- Budget de poids exact de l'app connectée.
- Persona conversationnel détaillé de Surga (tutoiement ou vouvoiement).
