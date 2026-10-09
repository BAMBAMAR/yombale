# Tickets UI V2 — Surga, écran « Aujourd'hui » (mobile et ordinateur)

Source : revues de l'interface du 7 octobre 2026 (première capture ordinateur, puis seconde capture ordinateur de 11 h).
Emplacement : `docs/surga/TICKETS_UI_V2.md`.

## Règles communes à tous les tickets (définition de « terminé »)

- Une seule structure HTML pour toutes les tailles d'écran : l'adaptation se fait en CSS (grille et points de rupture), pas en chargeant des composants différents selon l'écran.
- Points de rupture : moins de 600 px (barre d'onglets en bas), 600 à 1 023 px (rail d'icônes à gauche), 1 024 px et plus (menu latéral, colonne centrale, colonne de droite).
- Budgets de poids respectés (pages publiques et app connectée, voir `CLAUDE_SURGA.md`).
- Composants React de moins de 450 lignes. Icônes SVG `lucide-react`. Zéro émoji. Montants en FCFA.
- Vérification visuelle à 360, 768, 1 280 et 1 920 px de large, en mode clair.
- Contraste du texte : 4,5:1 minimum pour le texte courant, 3:1 pour le texte de plus de 18 px.

## Tableau de suivi consolidé

| Ticket | Sujet | Priorité | Statut | Résolution / Fichiers |
|---|---|---|---|---|
| SRG-UI-01 | Ville de référence unique, ville consultée libre | P0 | Terminé | Séparation ville référence (profil) vs ville consultée (session locale météo). Titre dynamique `Météo · [ville]`. Messages de couverture explicites. |
| SRG-UI-02 | Pas de marées pour les villes de l'intérieur | P0 | Terminé | Table `LOCALITES_SENEGAL_LIST` (`estLocaliteMaritime`). Marées masquées pour l'intérieur (Kaffrine, Kaolack, etc.), affichées pour la côte. |
| SRG-UI-03 | Source et heure sous chaque titre | P0 | Terminé | Source et horodatage réel sous chaque article dans `SurgaNewsList` et le briefing. Liens sortants directs vers l'éditeur. |
| SRG-UI-04 | Heure de publication réelle et fraîcheur | P0 | Terminé | Suppression de la date artificielle. Lecture stricte `pubDate` / `isoDate` RSS. Fenêtre de fraîcheur 24h. |
| SRG-UI-05 | Aucun doublon sur ordinateur | P0 | Terminé | La section « Actualités et revue de presse » commence strictement là où le briefing s'arrête (`items.slice(brevesPhares.length)`). |
| SRG-UI-06 | Titres non tronqués | P1 | Terminé | 2 lignes max par titre, `line-clamp: 2`, pas de coupure agressive sur mobile. |
| SRG-UI-07 | Remplacer le bandeau « Alerte matinale » | P1 | Terminé | Heure du briefing cliquable ouvrant le réglage d'horaire sans bandeau intrusif. |
| SRG-UI-08 | Audio discret et désactivé par défaut | P1 | Terminé | Audio désactivé par défaut sur compte neuf ; affiché uniquement si activé dans les réglages. |
| SRG-UI-09 | Sport personnalisé et utile | P1 | Terminé | Priorisation : équipes suivies > Ligue 1 sénégalaise > autres. Heure « à 13 h 50 », mention `Vous suivez [équipe/joueur]`. |
| SRG-UI-10 | Phrase d'accueil plus courte et exacte | P1 | Terminé | « Bonjour. Pour [ville] ce matin : X brèves, Y actualités sportives et Z rappel à HH h. » |
| SRG-UI-11 | Largeur maximale de la colonne centrale | P1 | Terminé | Max 720 px centré pour `.surga-center-feed`, rail droit à 360 px à 1 920 px via `.surga-main-grid`. |
| SRG-UI-12 | Rien ne passe sous la barre de commande | P1 | Terminé | Sur mobile : `padding-bottom: 152px` garantissant la visibilité totale de la dernière carte au-dessus du FAB. |
| SRG-UI-13 | Étiquettes de section plus calmes | P1 | Terminé | Titres de section du menu latéral passés en gris (`#64748B`), majuscule initiale seule (retrait `text-transform: uppercase`). |
| SRG-UI-14 | Menu latéral : un seul état actif, moins de badges | P1 | Terminé | Un seul bouton actif à la fois ; badges réservés aux données réelles non nulles. |
| SRG-UI-15 | Trafic lisible et honnête | P2 | Terminé | Message géographique honnête : `Trafic indisponible pour [ville]. Disponible pour Dakar.` Statut texte explicite. |
| SRG-UI-16 | Mémo épinglé réel | P2 | Terminé | Synchronisé avec la note locale la plus récente. |
| SRG-UI-17 | Terme « Kalpé » | P2 | Terminé | Maintien du terme culturel avec sous-titre explicatif `(portefeuille)` et infobulle d'accessibilité. |
| SRG-UI-18 | Contraste de l'orange | P2 | Terminé | Remplacement des textes `#D97706` par `--surga-accent-text` (`#92400E`) pour un ratio WCAG >= 4.5:1. |
| SRG-UI-19 | Icône Wi-Fi de l'en-tête mobile | P2 | Terminé | Masquée quand la connexion est normale ; affichée uniquement en cas de mode hors ligne avec libellé clair. |
| SRG-UI-20 | Agenda : une seule donnée, aucune contradiction | P0 | Terminé | Briefing et rail droit lisent la même source au même instant (`agendaToday`). Libellé explicite : « 1 rappel à 14 h » ou « Aucun rendez-vous · 1 rappel ». |
| SRG-UI-21 | Titres d'actualité : le fait d'abord | P1 | Terminé | Exclusion des classements, tops et quiz sans fait récent ; priorité au fait d'actualité avec lien vers l'article d'origine. |
| SRG-UI-22 | Format unique des montants | P1 | Terminé | Module universel `formaterFCFA` (`Intl.NumberFormat('fr-FR')` + `\u202F` + `FCFA`). |
| SRG-UI-23 | Un seul bouton d'action par titre | P2 | Terminé | Bouton unique `<SurgaShareButton />` ; visible au survol sur desktop, visible en permanence sur mobile. |
| SRG-UI-24 | Typographie française et casse des titres | P2 | Terminé | Espace insécable fine devant les signes doubles (`:`, `?`, `!`, `« »`), casse naturelle avec majuscule initiale. |
| SRG-UI-25 | Radios FM : données, droits et emplacement | P1 | Terminé | Retrait de la colonne de contexte ; disponible dans Services. Lecteur flottant uniquement après lancement manuel. Estimation 30-60 Mo/h. |

---

## Détails d'implémentation et vérifications par ticket

### SRG-UI-01 — Ville de référence unique, ville consultée libre (P0)
- **Ville de référence** : lue depuis le profil (`preferences?.quartiers?.[0]` ou `'Dakar'`). Aucune brique ne la code en dur.
- **Ville consultée** : l'utilisateur peut explorer la météo d'une autre ville sans que cela n'écrase ni le profil, ni le briefing du matin, ni le widget trafic.
- **Briques informatives** : affichent toujours la ville ciblée (`Météo · Saint-Louis`, `Trafic indisponible pour Kaffrine. Disponible pour Dakar.`).

### SRG-UI-02 — Pas de marées pour les villes de l'intérieur (P0)
- Table canonique des 28 localités avec indicateur maritime `estLocaliteMaritime` (`lib/surga-meteo.ts`).
- Villes intérieures (Kaffrine, Kaolack, Thiès, Tambacounda) : zéro marée affichée.
- Villes côtières (Dakar, Saint-Louis, Mbour, Ziguinchor) : marée haute / marée basse affichées.

### SRG-UI-03 & SRG-UI-04 — Heure de publication réelle et fraîcheur (P0)
- `backend/services/surga/rss-collector.js` : suppression du calcul artificiel `maintenant - alea`. Lecture rigoureuse de `pubDate` et `isoDate`.
- `lib/surga-formatting.ts` : fonction universelle `formaterHeurePublication(isoDate)`. Si > 24 h, affichage du format date (`hier, 18 h 20` ou `5 oct.`).
- Clic sur le titre ouvrant l'URL source directe dans un nouvel onglet avec `rel="noopener noreferrer"`.

### SRG-UI-05 — Aucun doublon sur ordinateur (P0)
- Le briefing matinal affiche les 3 premières brèves phares.
- La section « Actualités et revue de presse » reprend les articles à partir de l'index 3 (`items.slice(brevesPhares.length, brevesPhares.length + 3)`).
- Zéro titre dupliqué entre le briefing et la liste d'actualités.

### SRG-UI-09 — Sport personnalisé et utile (P1)
- `backend/services/surga/sport-service.js` : tri prioritaire par équipes suivies de l'utilisateur, puis championnats locaux sénégalais, puis compétitions internationales.
- Mention `Vous suivez [équipe/joueur]` sur les matches internationaux des équipes suivies.
- Horaires formatés rigoureusement : `à 13 h 50` pour match à venir, score pour match terminé, `en cours` pour match en direct.

### SRG-UI-10 & SRG-UI-20 — Phrase d'accueil exacte et cohérence Agenda (P0/P1)
- Phrase d'accueil : « Bonjour. Pour Dakar ce matin : X brèves, Y actualités sportives et Z rappel à 14 h. »
- Plus de répétition de date déjà affichée dans l'en-tête.
- Colonne de droite (« Votre journée ») synchronisée avec l'état réel : « Aucun rendez-vous · 1 rappel » au lieu d'une phrase contradictoire « Journée libre, aucun rendez-vous bloquant ».

### SRG-UI-11 & SRG-UI-12 — Ergonomie responsive et espacement (P1)
- Flux central limité à 720 px et centré dans sa zone (`.surga-center-feed .surga-container`).
- Grille desktop (`.surga-main-grid`) ajustée : 240 px menu, 740 px centre, 300 px rail (s'élargit à 360 px à 1920 px).
- Dégagement bas mobile (`padding-bottom: 152px`) empêchant tout masquage sous le bouton micro FAB.

### SRG-UI-13 & SRG-UI-18 — Design apaisé et contraste WCAG AA (P1/P2)
- Titres de la barre latérale passés en gris `#64748B` avec majuscule initiale uniquement.
- Contraste des textes d'accentuation sécurisé avec `#92400E` (ratio 7.2:1 sur fond clair).

### SRG-UI-22 — Format unique des montants FCFA (P1)
- Implémenté dans `lib/surga-formatting.ts` (`formaterFCFA(montant)`).
- Formatage via `Intl.NumberFormat('fr-FR')` avec espace insécable fine `\u202F` et suffixe `FCFA`.

### SRG-UI-23 — Un seul bouton d'action par titre (P2)
- Composant unifié `SurgaShareButton.tsx`.
- Déclenche le partage natif (Web Share API) ou la copie directe du lien avec feedback visuel temporaire « Copié ».
- Visible au survol sur desktop, visible en continu sur mobile.

### SRG-UI-24 — Typographie française et casse des titres (P2)
- Fonction `normaliserTypographieFrancaise` insérant des espaces insécables avant la ponctuation double (`:`, `;`, `!`, `?`, `« »`).
- Titres de section en casse normale (« Briefing du matin », « Actualités et revue de presse »).

### SRG-UI-25 — Radios FM (P1)
- Retrait du widget radio de la colonne de contexte par défaut.
- Mini-lecteur persistant affiché uniquement après déclenchement explicite par l'usager.
- Décision O6 inscrite dans `docs/surga/DECISIONS.md` concernant les accords de diffusion des flux.
