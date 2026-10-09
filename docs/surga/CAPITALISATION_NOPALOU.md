# 🏛️ CAPITALISATION DE L'EXPÉRIENCE NOPALOU VERS SURGA
## Document de Référence Stratégique & Architecturale (Agent -1)

```text
DOCUMENT        : CAPITALISATION_NOPALOU.md
AUTEUR          : AGENT -1 — Audit Préalable de Capitalisation Nopalou → Surga
DATE            : 5 Octobre 2026
STATUT          : DOCUMENT STRATÉGIQUE MAÎTRE — OBLIGATOIRE AVANT CODAGE
PORTÉE          : Expérience Globale Nopalou (Technique, UX, SEO, Data, Voix, WhatsApp, Sécurité, Marketing)
PRODUIT CIBLE   : SURGA (Assistant personnel de poche)
```

---

## 0. INTRODUCTION & PRINCIPE DIRECTEUR

Surga est un produit autonome développé au sein de l'infrastructure et du dépôt de Nopalou.
L'objectif fondamental de cet audit préalable (**Agent -1**) est d'éviter le piège récurrent des projets logiciels : **recommencer à zéro et reproduire à l'identique les erreurs, régressions et failles déjà documentées, subies et payées au prix fort sur Nopalou**.

> **Règle d'or de l'Agent -1** :  
> *« Ne jamais considérer qu'une leçon est acquise parce qu'elle est mentionnée dans une note ou un cahier des charges. Une leçon n'est capitalisée que si elle est prouvée par du code étanche, un test automatisé vérifiable et un comportement système résilient. »*

Ce document cartographie l'expérience réelle accumulée sur Nopalou à travers ses 14 sessions d'audit, ses 212 fiches d'anomalies (`AUD-001` à `AUD-212`), ses 6 plans de correction, ses benchmarks terrain et son exploitation quotidienne à Dakar.

---

## A. CE QUE NOPALOU A APPRIS (LA RÉALITÉ DU TERRAIN DAKAROIS)

L'exploitation de Nopalou depuis juin 2026 sur le marché sénégalais a mis en lumière des réalités économiques, sociologiques et techniques incontournables :

1. **La suprématie du Mobile Money et le rejet de la CB** :
   - Plus de 85% des transactions numériques passent par Wave (~46%) et Orange Money (~38%). Moins de 25% de la population dispose d'une carte bancaire active.
   - Tout flux de paiement exige une confirmation instantanée, une tolérance aux pannes réseaux locales et un reçu WhatsApp lisible.
2. **La culture de l'oralité et du Mobile-First sous contrainte Data** :
   - Les utilisateurs naviguent à 92% sur smartphone Android d'entrée ou de milieu de gamme (Transsion / Tecno / Infinix / Samsung A-series).
   - Les forfaits internet mobile sont achetés au pass journalier (100 F à 500 F) ou hebdomadaire. La donnée est strictement comptée. Tout kilo-octet superflu, tout rechargement intempestif ou bundle JavaScript obèse est vécu comme une ponction financière directe.
3. **Le rôle central et ambivalent de WhatsApp** :
   - WhatsApp est à la fois le système d'exploitation commercial du Sénégal (prospection, envoi de photos, négociation, SAV) et un canal sous haute surveillance de Meta (règles strictes sur l'API Business depuis janvier 2026, plafonds marketing, fenêtres de 24h, interdiction des chatbots généralistes ouverts).
4. **L'illusion des tests unitaires isolés (Mocks trompeurs)** :
   - Des suites de tests affichant 100% au vert sur des mocks peuvent masquer des pannes totales en production : imports de chemins cassés, colonnes manquantes en base, `catch` silencieux avalant les erreurs 500, désynchronisation totale entre interface client et base de données.
5. **Le risque de "Slop IA" et de perte de confiance** :
   - Des interfaces encombrées d'émojis criards, des calculs financiers approximatifs générés par des LLM, des flux RSS non nettoyés injectant des titres tronqués ou des numéros de téléphone privés dans le SEO détruisent instantanément la réassurance de la marque.

---

## B. CE QUI FONCTIONNE SUR NOPALOU (LES ACQUIS INDUSTRIELS)

Ces briques ont été éprouvées, auditées et validées en conditions réelles. Elles constituent les fondations solides à réutiliser sans réinvention :

| Composant / Pratique | Preuve d'Efficacité | Réutilisabilité pour Surga |
| :--- | :--- | :--- |
| **Moteur Déterministe Caisse/Calcul** | 91/91 tests Jest validés ; séparation stricte entre extraction d'intention et moteur mathématique déterministe. Aucun calcul financier confié à un modèle d'IA. | **OBLIGATOIRE** pour la calculatrice Surga et le totalisateur des dépenses quotidiennes en FCFA. |
| **Isolation Visuelle & Zéro Émoji** | Règle d'or anti-slop : interdiction stricte des émojis Unicode dans l'UI. Utilisation exclusive des icônes SVG calibrées `lucide-react`. | **OBLIGATOIRE** sur tout l'écosystème Surga (PWA, notifications, messages WhatsApp). |
| **Sécurité Anti-IDOR Multi-Tenant** | Middlewares de contrôle strict de propriété (`requireBoutiqueOwnership`, `checkBoutiqueAccess`) avec rejet 403 et journalisation synchrone dans `security_audit_vault`. | **OBLIGATOIRE** pour protéger les notes privées, dépenses et données personnelles des utilisateurs. |
| **Normalisation Téléphonique E.164** | Fonction `normalisePhone` convertissant tout format local (`77...`, `00221...`, `+221...`) vers le format canonique `+221XXXXXXXXX`. | **OBLIGATOIRE** pour toutes les clés d'identification, de session et d'alertes Surga. |
| **Webhooks Idempotents & Déduplication** | Traitement ultra-rapide des webhooks entrants (réponse HTTP 200 < 20 ms) avec table de déduplication `isDuplicate(msg.id)`. | **OBLIGATOIRE** pour le webhook WhatsApp et les réceptions Wave / Orange Money. |
| **Boutique PWA & Offline-First** | Architecture de stockage local (IndexedDB) pour continuer les opérations clés hors réseau. | **OBLIGATOIRE** pour consulter le briefing, noter une dépense ou faire un calcul sans connexion. |

---

## C. CE QUI N'A PAS FONCTIONNÉ SUR NOPALOU (LES ÉCHECS HISTORIQUES)

L'historique des audits (`AUD-001` à `AUD-212`) et de la campagne finale révèle des faiblesses récurrentes qui ont coûté des semaines de remédiation :

1. **Les failles IDOR par négligence sur les routes publiques** :
   - Dans le portail locataire (`AUD-132`), la simple fourniture d'un numéro de téléphone dans l'URL permettait de lire l'identité, les quittances et de signer électroniquement le bail à la place d'un tiers.
   - Dans le wizard d'inscription (`AUD-108`), l'API renvoyait le jeton de session d'un compte sur la seule base de son numéro de téléphone, sans exiger l'OTP côté serveur.
2. **Le piège du Service Worker `@serwist/next` (Recharge intempestive)** :
   - La configuration par défaut `reloadOnOnline: true` provoquait un rechargement brutal de la page à chaque micro-coupure réseau (2,5 s en mobilité à Dakar), effaçant les formulaires en cours, redemandant le PIN et tuant la synchronisation (`AUD-087`, `AUD-088`).
3. **La course d'état React dans la capture vocale** :
   - Dans Sama Xaalis (`AUD-196`), un `useEffect` de réinitialisation asynchrone vidait les champs du formulaire 30 millisecondes après leur remplissage par la reconnaissance vocale.
4. **La falsification des données et les fausses dates** :
   - Des données hors-ligne synchronisées étaient horodatées à l'heure de la reconnexion au lieu de l'heure réelle de l'action (`AUD-096`).
   - Des scrapers en échec injectaient des articles avec `new Date()` pour masquer l'obsolescence (`AUD-173`).
5. **Le mirage des abonnements et les métriques de vanité** :
   - L'administration affichait 65 000 FCFA de MRR alors que tous les abonnements provenaient de tests administrateurs et que le MRR réel issu de paiements était de 0 FCFA (`AUD-110`).
   - Chaque appel API d'inscription réinitialisait la période d'essai gratuit indéfiniment (`AUD-109`).
6. **L'abandon silencieux des notes vocales WhatsApp** :
   - Le bot recevait les notes vocales, rassurait l'utilisateur (« Note vocale bien reçue »), mais ne disposait d'aucune chaîne de transcription et n'enregistrait aucune commande (`AUD-201`).
7. **La rupture de la base de données masquée par des `try/catch` vides** :
   - Des routes renvoyaient 500 sans journaliser d'erreur (`AUD-017`), ou des modules pointaient vers de mauvais fichiers et basculaient silencieusement sur des données factices.

---

## D. POURQUOI CELA N'A PAS FONCTIONNÉ (LES CAUSES RACINES PROFONDES)

L'analyse causale (`ANALYSE_CAUSES.md`) et la contre-expertise technique ont dégagé 4 causes systémiques :

```
                                  +-------------------------------------------------+
                                  |         CAUSES RACINES DES ÉCHECS NOPALOU       |
                                  +-----------------------+-------------------------+
                                                          |
             +--------------------+-----------------------+--------------------+--------------------+
             |                                            |                                         |
             v                                            v                                         v
+---------------------------+              +---------------------------+              +---------------------------+
| 1. Disconnexion des Mocks |              | 2. Confiance Côté Client  |              | 3. Absorbation d'Erreurs  |
| Les tests testent des     |              | Validation faite en UI    |              | Les blocs catch avalent   |
| objets en mémoire, jamais |              | mais contournable par une |              | les exceptions pour ne    |
| les vraies tables SQL.    |              | simple requête curl REST. |              | pas faire crasher l'app.  |
+---------------------------+              +---------------------------+              +---------------------------+
```

1. **L'illusion du "Fail-Safe" mal compris** :
   - En voulant éviter à tout prix qu'une page affiche une erreur, les développeurs ont multiplié les replis silencieux vers des données en mémoire (`pool = null; return mockData;`). Résultat : l'application semble fonctionner, mais le backend est mort.
2. **Absence de test E2E de bout en bout** :
   - Les tests vérifiaient unitairement que le parseur vocal extrayait bien `"2500"`, mais aucun test ne vérifiait que les 2 500 FCFA arrivaient bien dans la table `kalpe_depenses` après passage dans le composant React et la Server Action.
3. **Confusion entre Canal WhatsApp et Moteur Applicatif** :
   - Considérer WhatsApp comme un simple afficheur de texte alors qu'il nécessite une gestion d'état transactionnelle avec machine à états finis et déduplication stricte.

---

## E. CORRECTIONS RÉALISÉES SUR NOPALOU

Face à ces constats, Nopalou a mis en œuvre des corrections structurelles qui constituent désormais le standard de l'ingénierie du dépôt :

1. **Correction Auth & Unicité Téléphonique (`FIX-001`, `VAL8-001`, `VAL8-002`)** :
   - Interdiction formelle d'attribuer un numéro de téléphone sans vérification de possession.
   - Validation stricte de format E.164 (`+221[70|75|76|77|78]\d{7}`) et rejet 409 si le numéro est déjà rattaché à un compte actif.
2. **Cloisonnement Multi-Tenant Immo (`FIX-003`, `VAL8-009`)** :
   - Vérification croisée : un agent ne peut lier qu'un bien, un locataire et un propriétaire appartenant strictement à son agence. Rejet 403 et journalisation immédiate dans `security_audit_vault`.
3. **Résilience et Reprise Hors-Ligne (`AUD-087`, `AUD-096`)** :
   - Désactivation de `reloadOnOnline` dans `@serwist/next`.
   - Conservation de la date réelle de la transaction locale via `client_tx_time` plutôt que `NOW()` lors de la synchronisation.
4. **Assainissement SEO & Soft-404 (`AUD-153`, `AUD-154`)** :
   - Remplacement des faux statuts HTTP 200 par de vrais statuts 404 via `notFound()` Next.js pour toute ressource inexistante.
   - Élimination des doubles suffixes de marque dans les gabarits de métadonnées.

---

## F. LEÇONS TRANSFÉRABLES À SURGA (LES RÈGLES D'OR)

Ces leçons s'appliquent directement et intégralement au périmètre de Surga :

### 1. Fiabilité Déterministe et Zéro Calcul IA
- **Leçon** : Un modèle de langage (LLM) est un moteur linguistique probabiliste, jamais un calculateur comptable.
- **Règle Surga** : L'IA extrait l'intention et les entités. Tout calcul d'addition, de division, de budget ou de total de dépenses est délégué à `mathjs` ou à un script déterministe.

### 2. Confirmation Vocale Avant Persistance
- **Leçon** : Dans l'environnement bruyant de Dakar (circulation, transports, marchés), la reconnaissance vocale est imprécise sur les chiffres et les noms propres.
- **Règle Surga** : Aucune écriture (dépense, note, rendez-vous) déclenchée par la voix ne doit être enregistrée sans une étape de confirmation explicite à l'écran ou par retour textuel WhatsApp (montant, libellé, date).

### 3. Étanchéité Anti-IDOR sur les Données Privées
- **Leçon** : Un numéro de téléphone n'est pas un secret. Une API qui sert ou détruit des données sur la seule foi d'un numéro passé en paramètre est une faille critique.
- **Règle Surga** : Toute route de consultation, d'export ou de suppression (`/api/surga/donnees/*`) exige une session authentifiée (JWT valide ou vérification OTP préalable).

### 4. Sourcing Strict et Fraîcheur Réelle des Données
- **Leçon** : Un utilisateur qui lit une fausse information ou une actualité périmée horodatée du jour perd définitivement confiance.
- **Règle Surga** : Tout article ou brève de presse doit comporter le nom de la source originale, son lien canonique, et sa date réelle de publication. Interdiction formelle de régénérer une date avec `new Date()` sur du contenu de secours.

### 5. Validation Réelle des Paiements Wave / OM
- **Leçon** : Ne jamais faire confiance au frontend pour valider un paiement.
- **Règle Surga** : L'activation d'un abonnement Premium ou Pro n'a lieu que sur réception d'un webhook signé ou après interrogation directe et vérifiée de l'API Wave / Orange Money.

---

## G. LEÇONS SPÉCIFIQUES À NOPALOU (NON TRANSFÉRABLES)

Il est tout aussi vital d'identifier les pratiques de Nopalou qui **ne doivent PAS être transposées dans Surga** afin d'éviter la pollution conceptuelle :

| Pratique Nopalou | Pourquoi elle est Non Transférable à Surga |
| :--- | :--- |
| **Tunnel d'achat e-commerce & Panier multi-vendeurs** | Surga n'est pas une marketplace. Il ne gère pas de caddie, pas de frais de livraison tiak-tiak, pas de commission marchande. |
| **Logiciel de caisse physique magasin (POS)** | Surga est un assistant personnel de poche, pas un terminal point de vente commerçant pour imprimer des tickets Z. |
| **Scraping massif multi-plateformes de produits** | Surga ingère des flux d'actualité légitimes et sourcés (RSS), des informations de trafic (API TomTom) et des données de concours officielles. Il ne scrappe pas le web sauvage. |
| **Prospection WhatsApp agressive (Cold Messaging)** | Surga s'appuie sur une démarche opt-in d'assistance personnelle utile. Le spam marketing WhatsApp est interdit par sa vision et par Meta. |
| **Baux de location et quittances locatives complexes** | Surga propose une consultation des biens et des alertes personnalisées pour le citoyen, sans embarquer le logiciel de gestion de syndic ou de baux notariés. |

---

## H. RISQUES MAJEURS DE REPRODUCTION DANS SURGA

L'analyse de l'état actuel de Surga (réalisée lors de la phase initiale de l'audit) montre que **plusieurs erreurs historiques de Nopalou ont déjà commencé à se réincarner dans Surga** :

1. **La déconnexion silencieuse de la base de données** :
   - Dans `backend/services/surga/`, 4 services majeurs (`immo-service.js`, `concours-service.js`, `places-service.js`, `trafic-service.js`) tentent d'importer `require('../../db')`.
   - Ce fichier n'existant pas, un bloc `catch` vide neutralise l'erreur : ces services tournent à 100% sur des données factices en mémoire sans lever d'alerte, reproduisant exactement `AUD-017` et `AUD-173` de Nopalou !
2. **L'IDOR béante sur l'export et la suppression de données** :
   - `/api/surga/donnees/export` et `/api/surga/donnees/supprimer` autorisent l'opération dès qu'un paramètre `phone` est transmis, sans vérifier le jeton d'authentification. C'est la réplique exacte de la faille locataire `AUD-132` de Nopalou.
3. **L'activation gratuite d'abonnements payants** :
   - `/api/surga/abonnements/verifier` active instantanément un abonnement annuel Premium sur simple envoi d'une chaîne de référence sans validation bancaire. C'est la résurgence de `AUD-108/AUD-109`.
4. **L'interception muette des vocaux WhatsApp** :
   - Les notes vocales WhatsApp envoyées à Surga sont interceptées par le vieux gestionnaire Nopalou qui répond avec des boutons e-commerce (« Nos Boutiques », « Mes Commandes ») au lieu de transcrire l'audio. C'est la reproduction flagrante de `AUD-201`.
5. **La falsification des dates de briefing** :
   - Le collecteur RSS utilise `new Date().toISOString()` pour ses 5 articles de secours en cas d'échec de collecte, trompant l'utilisateur sur la fraîcheur des nouvelles (`AUD-096`/`AUD-173`).

---

## I. MESURES PRÉVENTIVES OBLIGATOIRES

Pour éradiquer définitivement ces risques, Surga doit adopter 5 garde-fous structurels :

```text
+---------------------------------------------------------------------------------------+
|                         LES 5 GARDE-FOUS STRUCTURELS DE SURGA                         |
+---------------------------------------------------------------------------------------+
| 1. DB HEALTHCHECK SYSTÉMIQUE : Interdiction des catch silencieux sur l'accès DB.     |
|    Si la base PostgreSQL n'est pas jointe, le service doit logger explicitement.     |
| 2. BARRIÈRE AUTHENTIFIÉE ANTI-IDOR : tokenOptional interdit sur toute mutation        |
|    de données personnelles. requireAuth strict avec vérification req.user.id.         |
| 3. VALIDATION TRANSACTIONNELLE DU MOBILE MONEY : Webhook avec signature HMAC          |
|    ou interrogation API directe avant toute mise à jour de la table surga_abonnements.|
| 4. DÉMARCATION ÉTANCHE DES CANAUX WHATSAPP : Routage dédié de l'audio vers un service |
|    STT (Whisper/Gemini) avant tout message de réponse à l'utilisateur.                |
| 5. HORODATAGE IMMUABLE ET TRAÇABILITÉ DES SOURCES : Bannissement de new Date()        |
|    sur les contenus archivés ou de secours. Présence obligatoire du champ source_url. |
+---------------------------------------------------------------------------------------+
```

---

## J. TESTS NÉCESSAIRES (LE CATALOGUE ANTI-RÉGRESSION)

Chaque leçon issue de Nopalou doit être adossée à un test automatisé exécutable :

| ID Test | Cible | Scénario de Test | Résultat Attendu |
| :--- | :--- | :--- | :--- |
| **TEST-CAP-01** | Connecteur DB | Exécuter une requête SQL réelle sur les 4 services Surga (concours, places, trafic, immo). | Données issues de PostgreSQL, zéro appel aux mocks mémoire par défaut. |
| **TEST-CAP-02** | Anti-IDOR Données | Appeler `GET /api/surga/donnees/export?phone=+221770000000` sans en-tête `Authorization`. | **HTTP 401 Unauthorized** (rejet immédiat). |
| **TEST-CAP-03** | Anti-Suppression Tiers | Appeler `DELETE /api/surga/donnees/supprimer` avec `phone` seul et confirmation. | **HTTP 401 Unauthorized** (rejet immédiat). |
| **TEST-CAP-04** | Paiement Sécurisé | Appeler `/api/surga/abonnements/verifier` avec une fausse référence arbitraire. | **HTTP 400 / 403** (rejet sans confirmation bancaire prouvée). |
| **TEST-CAP-05** | Isolation WhatsApp | Envoyer un message contenant `surga` ou une commande personnelle au bot WhatsApp. | Réponse stricte Surga, **zéro mention de boutiques ni d'émojis e-commerce**. |
| **TEST-CAP-06** | Audio / Voix | Soumettre un fichier audio OGG/Opus WhatsApp au endpoint de réception. | Audio transmis au STT, transcription validée, demande de confirmation générée. |
| **TEST-CAP-07** | Fraîcheur Presse | Interroger l'API de briefing quotidien. | Tous les articles affichés ont leur URL d'origine et une date historique certifiée. |
