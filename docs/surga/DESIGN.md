# DESIGN — Surga, l'assistant de poche de Nopalou

> Format aligné sur le skill `/design` (Claude Mastery) : typographie, couleurs, layout, motion.
> Fait autorité pour les décisions visuelles **sauf si une charte graphique est déjà établie dans
> le dépôt Nopalou** : dans ce cas l'existant prime (`docs/surga/INTEGRATION_NOPALOU.md`, section 2).
> Pour les contraintes de poids, `CLAUDE.md` fait autorité.

---

## 1. Identité
- **Plateforme** : Nopalou. **Assistant** : Surga, le serviteur dévoué qui exécute jusqu'au bout.
- **Ton** : direct, respectueux, proactif, sans blabla commercial. Phrases courtes.
- **Vocabulaire wolof en réserve** pour nommer de futures fonctions : *Yombal* (simplifier),
  *Xettali* (secourir en urgence), *Dalal xel* (rassurer), *Nooflaay* (confort premium).

## 2. Typographie
- Police système sans-serif (`-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`),
  aucune police web non essentielle.
- Base 16px. Titre d'écran 22-24px (600-700). Titre de carte 16-18px (600). Corps 16px (400).
  Métadonnées 13-14px (500). Texte aligné à gauche.
- Contraste minimum 7:1 sur tout texte porteur d'information.

## 3. Couleurs (tokens CSS, cible à confronter à l'existant)
| Token | Valeur | Usage |
|---|---|---|
| `--paper` | `#F1EDE4` | Fond principal, cartes claires |
| `--ink` | `#1B2A2E` | Texte principal, titres |
| `--indigo` | `#2B4570` | Accent primaire, liens, boutons principaux |
| `--ocre` | `#C8722A` | Accent secondaire, badges, actions premium |
| `--vert` | `#3F7A5C` | États positifs (validé, disponible) |
| `--rouge` | `#B23A2E` | Alertes, erreurs, échéances dépassées |

Aucune couleur hex ad-hoc inline : tout passe par les tokens. Thème sombre : tokens redéfinis,
fond explicite.

## 4. Iconographie
`lucide-react` uniquement, tailles 14, 16 ou 18px. Aucun émoji Unicode, dans l'interface comme
dans les messages du bot.

## 5. Structure de l'app (PWA)
**Navigation basse à 5 entrées** : Aujourd'hui, Notes, Dépenses, Agenda, Plus. Le micro est un
bouton flottant accessible depuis tous les écrans.

- **Aujourd'hui (accueil)** : le briefing du jour en cartes empilées (agenda, brèves, sport,
  trafic selon les briques actives). Chaque carte est partageable en un geste.
- **Notes** : liste pleine largeur, recherche en haut, création rapide au clavier ou à la voix.
- **Dépenses** : saisie rapide (montant, catégorie), récapitulatif du mois en liste simple.
  Calculatrice accessible depuis ce même écran et depuis le bouton micro.
- **Agenda** : jour et semaine, rappels, création rapide.
- **Plus** : personnalisation (briques, heure du briefing, langue, quartiers, équipes), audio en
  option, briques activables (immobilier, concours, bons plans), compte, export et suppression
  des données.

**Onboarding** : 3 écrans maximum (choix des briques, heure du briefing, autorisation des
notifications). Les briques non choisies ne s'affichent nulle part.

## 6. Layout
- Pleine largeur (`width: 100%`), listes plutôt que grilles de vignettes.
- Cartes en 2 sous-lignes : ligne 1 titre complet sans troncature agressive ; ligne 2 donnée clé
  (montant FCFA, heure, score) + badge, en `whiteSpace: 'nowrap'` ; bouton d'action à droite.
- Affichage strictement conditionnel : aucun panneau, bouton ou formulaire vide ou inutile à
  l'étape en cours. Actions secondaires dans des tiroirs contextuels (Action Sheets).
- En-têtes sur une seule ligne tant que l'espace le permet.
- Espaces B2B : mêmes règles de densité ; fonctions hors palier masquées, pas grisées avec un
  cadenas ostentatoire.

## 7. Voix et confirmation
- Le bouton micro ouvre un état d'écoute simple (indicateur de niveau léger en CSS).
- Après chaque commande qui enregistre une donnée, une **carte de confirmation** affiche ce qui a
  été compris (montant, catégorie, date) avec deux actions : Confirmer, Corriger. Rien n'est
  enregistré avant confirmation.
- Les calculs affichent l'opération comprise et le résultat, pour que l'utilisateur vérifie.
- Message d'erreur de transcription : court, avec l'invitation à réessayer ou à saisir au clavier.

## 8. Audio (option)
- Désactivé par défaut. Une fois activé : lecteur compact (lecture, vitesse, téléchargement
  Wi-Fi), mini-lecteur persistant en bas d'écran.
- Indication claire du poids avant téléchargement et de l'état hors ligne.

## 9. Motion
- Aucune animation décorative, aucune vidéo en lecture automatique.
- Micro-transitions fonctionnelles en CSS pur, 150-200 ms (apparition d'un tiroir, état d'un
  bouton).
- Retour d'action par changement d'état immédiat. Chargement par squelette léger en CSS.

## 10. Messages du bot Surga (WhatsApp)
Pas d'émoji, pas de ponctuation excessive, pas de tournure publicitaire. Structure : accusé
court, information ou question, action claire.

- Briefing :
  > Bonjour. Votre briefing du jour : 2 rendez-vous, 3 brèves, match de l'équipe nationale à
  > 20h. Ouvrez l'app pour le détail.
- Confirmation vocale :
  > Noté : 2 500 FCFA, transport, aujourd'hui. Répondez OUI pour confirmer ou indiquez la
  > correction.
- Rappel :
  > Rappel : rendez-vous à 8h. Répondez REPORTER pour le décaler d'une heure.

## 11. Accessibilité et poids
- Contraste 7:1, base 16px, zones de tap suffisantes sur petit écran.
- Images AVIF qualité 60 %, `loading="lazy"`. Tailwind JIT avec purge stricte.
- Pages publiques < 50 Ko ; app connectée soumise au budget fixé à la Tranche 1.
