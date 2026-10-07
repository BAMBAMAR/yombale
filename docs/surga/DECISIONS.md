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
| D17 | La bulle « Assistant Nopalou » garde son rôle. Surga a son propre point d'entrée visible. | Visibilité de Surga sans cannibaliser l'assistant Nopalou |
| D18 | Fusion légère : courte section `## Module Surga — Règles Spécifiques` dans les règles de `CLAUDE.md`, qui renvoie à `CLAUDE_SURGA.md`. Journal Surga dans `docs/surga/JOURNAL-LIVRAISONS.md`. | `CLAUDE.md` est chargé à chaque session : le garder court |
| D19 | Ton de Surga : vouvoiement (« Bonjour, voici votre briefing »). | Respectueux, universel et rassurant pour un assistant personnel et financier |
| D20 | Visibilité maximale de Surga dès l'entrée sur le site : bandeau/carte d'appel sur la page d'accueil (`/`) au-dessus de la ligne de flottaison + onglet permanent dans la navigation mobile / desktop. | Immédiatement visible par tout visiteur sans dépendre de la bulle |
| D21 | Console d'administration dynamique `/admin/surga` : tout le contenu Surga (bonnes adresses, concours, unes de presse, trafic, abonnements) est administrable dynamiquement avec audit trail et RBAC admin. | Évite tout codage en dur et donne le plein contrôle opérationnel aux administrateurs |
| D22 | Détachement total de l'interface Surga vis-à-vis de Nopalou et support sous-domaine `surga.nopalou.com` : Surga fonctionne comme une application autonome à part entière, sans header, footer, panier ou chat marketplace Nopalou (isolation SSR et CSS). | Expérience utilisateur pure, épurée, dédiée à l'assistant de poche sans distraction e-commerce |

## Décisions de l'Extension — Alertes Vidéos, Emploi, Démarches (enregistrées le 2026-10-06)
| # | Décision | Raison |
|---|---|---|
| D23 | Le CV, les lettres et l'entretien forment une seule brique unifiée « Emploi » partageant un profil professionnel centralisé (`surga_profil_pro`). | Cohérence du parcours candidat, zéro ressaisie, interopérabilité naturelle |
| D24 | Préparation à l'entretien et génération de CV : exclusivité dans l'app PWA, jamais en conversation WhatsApp. | Conformité stricte à la politique Meta sur l'API WhatsApp Business et respect de l'ergonomie documentaire |
| D25 | Démarches administratives : fiches éditoriales vérifiées avec source officielle et date, sans aucune improvisation ou réponse générative hallucinée. | Éviter tout coût réel ou démarche erronée pour l'usager sénégalais (frais de timbre, pièces, tribunaux) |
| D26 | Alertes vidéos séries et lutte : ingestion Atom/RSS YouTube, métadonnées et liens directs sortants uniquement, aucun hébergement vidéo interne. | Économie de bande passante, respect de la propriété intellectuelle des producteurs sénégalais, Low-Data |
| D27 | Modèle de droits unifié (gratuit, achat à l'acte et Premium) avec contrôle serveur strict via `surga_usages` et source unique de vérité dans l'onglet Plans. Option A retenue : le CV sans mention s'achète à l'unité pour 500 FCFA, en plus du Premium. | Fin de l'incohérence de quotas, protection absolue des coûts d'infrastructure et d'IA, conversion sans blocage silencieux |
| D28 | CV et lettres de motivation rédigés en français uniquement au lancement. | L'anglais est hors périmètre pour le lancement sénégalais et constitue une évolution future |
| D29 | Aucune fiche réelle de démarche administrative n'est publiée tant qu'un responsable éditorial n'est pas formellement désigné. La Tranche 20 est livrée « techniquement terminée, contenu en attente » avec des fiches de test marquées `BROUILLON`. | Empêcher toute diffusion de consignes administratives ou coûts erronés préjudiciables aux usagers |

## Points ouverts (à trancher en Phase 0, puis à déplacer ci-dessus)
| # | Point | Comment le trancher |
|---|---|---|
| O1 | Cadre WhatsApp autorisé pour Surga | Confirmation de Meta ou du fournisseur d'accès à l'API |
| O2 | Source de données du trafic à Dakar | Spike : faisabilité et coût (API payante, signalements) |
| O3 | Fournisseur de transcription vocale | Spike : test avec enregistrements réalistes, en français puis en wolof |
| O4 | Comportement de la PWA sur iPhone (push, audio en arrière-plan) | Test sur appareils réels ; part d'iPhone parmi les utilisateurs |
| O5 | Budget de poids de l'app connectée | À fixer en Tranche 1 (point de départ proposé : JS initial < 120 Ko) |
| O6 | Droits d'usage des sources de presse | Lecture des conditions de chaque site, flux RSS retenus |
| O8 | Calendrier réel | Estimation indicative : noyau en environ 3 mois, puis briques par 3 à 4 semaines ; à recalibrer après l'audit |
| O9 | Forfaits data "réseaux sociaux" des opérateurs | Vérification auprès des opérateurs ; impact sur le coût d'usage de la PWA |
| O10 | Fenêtre de fraîcheur du briefing matinal (SRG-UI-04) | Valeur par défaut : 24h. Les actualités >24h ou sans date RSS/meta vérifiée sont exclues du briefing. À arbitrer par le responsable produit si extension souhaitée (ex: 36h le weekend). |
| O11 | Désignation du module dépenses / budget : terme « Kalpé » (SRG-UI-17) | « Kalpé » (portefeuille en wolof) : option 1 = infobulle d'explication au premier affichage (« Kalpé : votre carnet de budget et dépenses »), option 2 = nom personnalisable dans les réglages. À trancher par le responsable produit. |
