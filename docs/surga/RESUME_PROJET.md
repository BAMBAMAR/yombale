# Résumé du Projet — Surga, l'assistant de poche de Nopalou

## 1. Point de départ
Nopalou.com existe déjà (c'est votre dépôt) : comparateur d'achats locaux, transactions
centralisées sur WhatsApp sans commission, "Caisse PRO" pour commerçants, espace agences
immobilières, pôle immobilier (villas vérifiées, quittances OHADA), "Garantie Shopping Nopalou",
"Nopalou Pay Safe" (paiement séquestre) et une bulle "Assistant Nopalou" sur le site.

## 2. La vision de Surga
Un **vrai assistant de poche** qui regroupe ce qu'une personne cherche aujourd'hui "à gauche et à
droite" sur son smartphone : calculatrice, bloc-notes, dépenses, agenda et rappels, trafic,
brèves, revue de presse résumée, programme sport du week-end, et plus tard immobilier, concours
et bons plans.

Trois idées structurent le produit :
- **Indispensable avec le temps.** Plus la personne y met de notes, de dépenses, de rendez-vous
  et de préférences, plus Surga devient difficile à remplacer. Le succès se mesure en **jours
  d'utilisation par semaine**, pas en abonnements d'agences.
- **Personnalisable.** Chaque personne choisit ses briques, l'heure de son briefing, ses
  quartiers, ses équipes, ses sources. Surga affine ensuite selon l'usage réel.
- **Utilisable à la voix.** "Calcule 100 divisé par 3", "note 2 500 FCFA de taxi", "rappelle-moi
  demain à 8h" : la voix est une façon de **commander** Surga. L'**écoute audio** des contenus
  (briefing, revue de presse) est une **option**, pas un pilier.

## 3. Premier utilisateur cible
Les personnes actives sur les réseaux sociaux (WhatsApp, Facebook, TikTok, Instagram) : surtout
sur Android, habituées aux contenus courts, aux notes vocales et au partage. Leur donnée mobile
est comptée. Leur fil d'actualité est plein de bruit et de fausses informations : l'avantage de
Surga est un contenu **fiable, sourcé, sans pub ni rumeur**, et **facile à partager**.

## 4. Architecture produit : l'app d'abord, WhatsApp pour les tâches précises
| Canal | Rôle |
|---|---|
| **App installable (PWA)** | Produit principal : briefing, notes, dépenses, agenda, calculatrice, personnalisation, discussion libre avec l'assistant, lecteur audio optionnel |
| **WhatsApp** | Canal à tâches précises : briefing du matin, alertes, rappels, commandes structurées, notes vocales à transcrire. Pas de conversation ouverte. |
| **Flux podcast privé** (option) | Briefing audio écoutable dans n'importe quelle appli de podcast |

**Pourquoi pas un assistant généraliste sur WhatsApp** : depuis le 15 janvier 2026, Meta interdit
sur l'API WhatsApp Business les fournisseurs d'IA dont la fonction principale est un assistant
généraliste. Les assistants à tâche précise restent autorisés. Surga doit donc rester dans ce
cadre côté WhatsApp. Le risque d'application à Surga est à confirmer directement avec Meta ou le
fournisseur d'accès à l'API avant tout engagement lourd.

## 5. Noyau et briques activables
**Noyau (livré en premier)** : compte et profil personnalisable, briefing quotidien texte, notes,
dépenses structurées, calculatrice, agenda et rappels, commandes vocales, partage.

**Briques activables (selon ce que les utilisateurs activent réellement)** :
- Actualités et revue de presse résumée (sources sénégalaises identifiées).
- Sport : scores, programme du week-end.
- Trafic à Dakar (source de données à valider avant engagement).
- Immobilier (réutilise le pôle immobilier existant de Nopalou).
- Concours et examens (rappels J-30 / J-7 / J-1).
- Bons plans (restaurants, sorties, via avis Google Maps résumés).

## 6. Voix et audio
- **Commande vocale** : note vocale WhatsApp transcrite, puis micro dans l'app (moins fiable sur
  iPhone). Français d'abord ; wolof à tester ensuite.
- **Le calcul n'est jamais fait par l'IA** : l'IA comprend la phrase, un moteur de calcul exécute.
- **Confirmation avant enregistrement** : "Noté : 2 500 FCFA, transport. Correct ?"
- **Audio d'écoute en option** (désactivé par défaut) : lecteur dans l'app avec contenu
  pré-généré téléchargeable en Wi-Fi, et flux podcast privé. Appel téléphonique et Telegram :
  pistes à étudier plus tard.

## 7. Intégration dans Nopalou : rattaché, pas détaché
Surga vit dans le **même dépôt** que Nopalou : même marque, même compte utilisateur, même
infrastructure de paiement et de vérification. Il réutilise le pôle immobilier, l'espace PRO
agences, "Nopalou Pay Safe", "Garantie Shopping" et la bulle "Assistant Nopalou" (qui devient
l'entrée vers Surga). **Hors périmètre, à ne jamais toucher** : le comparateur d'achats et la
Caisse PRO. Le protocole d'audit à suivre avant tout code est dans
`docs/surga/INTEGRATION_NOPALOU.md`.

## 8. Identité : "Surga"
- **Nopalou** : "se reposer / se décharger d'un fardeau" en wolof, la promesse de la plateforme.
- **Surga** : terme wolof traditionnel pour le disciple ou serviteur dévoué, loyal et fiable.
  Positionnement : *"Le serviteur dévoué qui exécute jusqu'au bout."*
- **Ton** : direct, respectueux, proactif, zéro émoji.

## 9. Contraintes techniques non négociables
- Pages publiques (SSR) : < 50 Ko transférés, HTML < 30 Ko, JS initial < 80 Ko.
- App connectée : budget de poids propre, à fixer à la Tranche 1 (point de départ proposé :
  JS initial < 120 Ko).
- Images AVIF qualité 60 %, lazy loading. Icônes SVG `lucide-react`, zéro émoji.
- Composants React < 450 lignes. Montants en FCFA (XOF) uniquement.
- Messages WhatsApp en texte par défaut ; l'audio reste une option.
- Données personnelles (dépenses, notes, agenda) : consentement, protection, export, suppression.

## 10. Rentabilité
- **B2C premium** : personnalisation avancée, quotas vocaux étendus, audio, stockage.
- **Sponsoring** du briefing (marques, opérateurs), une fois l'audience installée.
- **B2B** (agences, centres de formation, restaurateurs) : abonnements Gratuit / Pro 5 000 FCFA /
  Business 10 000 FCFA par mois, activés quand les briques correspondantes ont de l'audience.

## 11. Points à valider tôt (risques connus)
1. Politique WhatsApp : confirmer le cadre autorisé pour Surga.
2. Source de données du trafic à Dakar (API payante, crowdsourcing ou autre).
3. Droits de la revue de presse (flux RSS, conditions des sites, liens vers les sources).
4. Qualité de la transcription vocale en français puis en wolof, dans le bruit.
5. Notifications push et audio en arrière-plan sur iPhone pour une PWA.
6. Forfaits data "réseaux sociaux" des opérateurs (impact sur le coût d'usage de la PWA).
7. Stack réelle du dépôt Nopalou (audit obligatoire).

## 12. Documents du projet
Tout se trouve dans `docs/surga/`, sauf `CLAUDE_SURGA.md` et `.env.example` à la racine.
Commencer par `docs/surga/README.md` (index et ordre de lecture).
- `CLAUDE_SURGA.md` : directives permanentes de l'agent.
- `docs/surga/INTEGRATION_NOPALOU.md` : audit et questions à poser, à lire en premier.
- `docs/surga/PRD.md`, `CAHIER_DES_CHARGES.md`, `PLAN.md`, `DESIGN.md` : produit, périmètre,
  ordre de travail, visuel.
- `docs/surga/DECISIONS.md` : décisions tranchées et points ouverts.
- `docs/surga/AUDIT.md` : état réel du dépôt (Phase 0).
- `docs/surga/LECONS_APPRISES.md`, `JOURNAL-LIVRAISONS.md` : erreurs passées, livraisons.
- `.env.example` : variables d'environnement.
