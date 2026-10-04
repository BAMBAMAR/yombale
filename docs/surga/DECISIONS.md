# Journal des décisions, Surga

Une décision tranchée se note ici avec sa date et sa raison, pour ne pas la rediscuter. L'agent
consulte ce fichier avant de remettre en question un point.

## Décisions tranchées (enregistrées le 2026-10-04)
| # | Décision | Raison |
|---|---|---|
| D1 | Surga est un assistant de poche personnalisable. Succès mesuré en jours d'utilisation par semaine et rétention. | Devenir indispensable avant de chercher le revenu B2B |
| D2 | Premier utilisateur : personnes actives sur les réseaux sociaux (Android en majorité, donnée mobile comptée). | Cible définie par le porteur du projet |
| D3 | Surga est rattaché à Nopalou : même dépôt, même compte, même paiement. Hors périmètre : comparateur d'achats et Caisse PRO. | Éviter doublons et cannibalisation, réutiliser la confiance acquise |
| D4 | L'app (PWA) est le produit principal. WhatsApp sert aux tâches précises. La discussion libre existe seulement dans l'app. | Politique Meta de janvier 2026 sur les assistants généralistes via l'API Business |
| D5 | Texte par défaut. L'audio d'écoute est une option désactivée par défaut : lecteur dans l'app et flux podcast privé. Appel téléphonique et Telegram à étudier plus tard. | L'audio est un confort, pas un pilier ; contrainte Low-Data |
| D6 | Les commandes vocales servent à commander. Calcul par moteur déterministe, confirmation avant toute écriture, français d'abord, wolof testé ensuite. | Fiabilité des chiffres, limites de la transcription |
| D7 | Noyau d'abord (briefing, notes, dépenses, calculatrice, agenda, voix, partage), briques ensuite selon l'usage observé. | Éviter une app qui fait tout sans devenir indispensable |
| D8 | Pas d'application native au lancement. | Coût et maintenance ; WhatsApp et PWA suffisent pour valider |
| D9 | Le bot s'appelle Surga (serviteur dévoué en wolof). Zéro émoji. | Choix de marque |
| D10 | Les documents vivent dans `docs/surga/`, les règles de l'agent dans `CLAUDE_SURGA.md`. | Ne pas mélanger avec la documentation existante |

## Décisions de l'audit Phase 0 (enregistrées le 2026-10-04, détail dans `AUDIT.md`)
| # | Décision | Raison |
|---|---|---|
| D11 | Stack existante : Express 4, `pg` brut avec migrations SQL idempotentes, Next.js 14 App Router, CSS vanilla. Routes dans `backend/routes/surga/`. Pas de Fastify, Prisma, Tailwind ni Meilisearch. | L'existant prime ; ne pas réécrire une stack en production |
| D12 | `utilisateurs` inchangée. Profil dans `surga_preferences` (FK `utilisateurs.id`) et tables Surga dédiées. Connexion via l'OTP WhatsApp existant. | Un seul compte Nopalou, aucun doublon d'auth |
| D13 | Premium payé par Wave et Orange Money existants, même compte marchand, type `surga_premium`, tables `abonnements` / `plans`. | Éviter une seconde intégration de paiement |
| D14 | Design system Nopalou (`design-tokens.css`, `lucide-react`, police système). Base 16px limitée aux écrans Surga via une classe de portée. Palette de `DESIGN.md` non retenue. | Une seule identité visuelle ; lisibilité du persona (choix fait sur aperçus) |
| D15 | WhatsApp : même numéro et même webhook, routage par intention vers un module isolé `backend/services/surga/`. Chatbot existant inchangé. | Réutiliser le numéro connu sans casser le comparateur |
| D16 | PWA Surga séparée : manifest et scope `/surga`, service worker dédié. | Choix du porteur du projet : app Surga identifiable et installable à part |
| D17 | La bulle « Assistant Nopalou » garde son rôle. Surga a son propre point d'entrée visible (emplacement à choisir en Tranche 1). | Visibilité de Surga sans cannibaliser l'assistant Nopalou |
| D18 | Fusion légère : courte section `## Module Surga — Règles Spécifiques` dans les règles de `CLAUDE.md`, qui renvoie à `CLAUDE_SURGA.md`. Journal Surga dans `docs/surga/JOURNAL-LIVRAISONS.md`. | `CLAUDE.md` est chargé à chaque session : le garder court |

## Points ouverts (à trancher en Phase 0, puis à déplacer ci-dessus)
| # | Point | Comment le trancher |
|---|---|---|
| O1 | Cadre WhatsApp autorisé pour Surga | Confirmation de Meta ou du fournisseur d'accès à l'API |
| O2 | Source de données du trafic à Dakar | Spike : faisabilité et coût (API payante, signalements) |
| O3 | Fournisseur de transcription vocale | Spike : test avec enregistrements réalistes, en français puis en wolof |
| O4 | Comportement de la PWA sur iPhone (push, audio en arrière-plan) | Test sur appareils réels ; part d'iPhone parmi les utilisateurs |
| O5 | Budget de poids de l'app connectée | À fixer en Tranche 1 (point de départ proposé : JS initial < 120 Ko) |
| O6 | Droits d'usage des sources de presse | Lecture des conditions de chaque site, flux RSS retenus |
| O7 | Tutoiement ou vouvoiement de Surga | Décision du porteur du projet |
| O8 | Calendrier réel | Estimation indicative : noyau en environ 3 mois, puis briques par 3 à 4 semaines ; à recalibrer après l'audit |
| O9 | Forfaits data "réseaux sociaux" des opérateurs | Vérification auprès des opérateurs ; impact sur le coût d'usage de la PWA |
