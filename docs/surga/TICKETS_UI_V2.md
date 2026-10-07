# Tickets UI V2 — Surga, écran « Aujourd'hui » (mobile et ordinateur)

Source : Revue de l'interface du 7 octobre 2026 (captures mobile et ordinateur).

## Règles communes à tous les tickets (définition de « terminé »)
- Une seule structure HTML pour toutes les tailles d'écran : adaptation en CSS (grille et points de rupture), pas en composants dupliqués.
- Points de rupture : < 600 px (barre d'onglets en bas), 600 à 1 023 px (rail d'icônes à gauche), 1 024 px et plus (menu latéral, colonne centrale, colonne de droite).
- Budgets de poids respectés (pages publiques et app connectée, voir `CLAUDE_SURGA.md`).
- Composants React de moins de 450 lignes. Icônes SVG `lucide-react`. Zéro émoji. Montants en FCFA.
- Vérification visuelle à 360, 768, 1 280 et 1 920 px de large, en mode clair.
- Contraste du texte : 4,5:1 minimum pour le texte courant, 3:1 pour le texte de plus de 18 px.

---

## P0 — Cohérence et fiabilité des données

### SRG-UI-01 — Une seule localisation pour tout l'écran
- **Problème** : Dakar Plateau (briefing), Kaffrine (météo centrale, compte), Dakar (météo de droite).
- **Attendu** : Source unique de localisation (profil utilisateur ou ville invitée). Toutes les briques lisent cette même valeur.
- **Critères** :
  - Changer de ville dans le profil met à jour toutes les briques sans rechargement manuel.
  - Localisation affichée une seule fois de façon visible (en tête du briefing), pas dans chaque carte.
  - Menu « Compte » n'affiche plus la ville entre parenthèses.
  - Si la brique Trafic ne couvre pas la ville choisie : état clair (« Trafic disponible pour Dakar uniquement »).

### SRG-UI-02 — Pas de marées pour les villes de l'intérieur
- **Problème** : « Météo et marées » pour Kaffrine (ville sans façade maritime).
- **Attendu** : Liste de localités côtières pour conditionner l'affichage des marées.
- **Critères** :
  - Kaffrine, Kaolack, Thiès, Tambacounda... : intitulé « Météo », zéro marée.
  - Dakar, Saint-Louis, Mbour, Ziguinchor... : marées affichées.
  - Fichier de données facile à compléter (`coastal-locations.ts` / json).

### SRG-UI-03 — Source et heure sous chaque titre d'actualité
- **Problème** : Pas de média ni d'heure visible sous les brèves sourcées.
- **Attendu** : En petit et gris sous chaque titre : « Nom du média · heure de publication ».
- **Critères** :
  - Chaque titre affiche média + heure (ou date si antérieur).
  - Clic ouvre l'article d'origine.
  - Bouton « Partager » par titre produisant texte court + lien source pour WhatsApp.

### SRG-UI-04 — Filtre de fraîcheur des actualités
- **Problème** : Actualités anciennes possibles dans le briefing.
- **Attendu** : Fenêtre récente (24h par défaut) pour le briefing matinal.
- **Critères** :
  - Fenêtre 24h par défaut (notée dans `DECISIONS.md`).
  - Article sans date fiable exclu du briefing.
  - Date lue depuis la source (flux RSS / métadonnées), jamais date de fetch.

### SRG-UI-05 — Supprimer les doublons sur ordinateur
- **Problème** : Météo au centre et à droite ; Journée libre dans briefing et Votre journée.
- **Attendu** : Blocs de contexte (journée, météo, Sama Xaalis, trafic, mémo) dans la colonne droite >=1024px, et flux central sous briefing <1024px.
- **Critères** :
  - Zéro information en double.
  - Réalisé en CSS sans duplication HTML.

---

## P1 — Briefing

### SRG-UI-06 — Titres non tronqués
- **Critères** : 2 lignes max par titre puis coupure propre ; titre normal complet. Préférer 2 titres complets à 3 coupés.

### SRG-UI-07 — Remplacer le bandeau « Alerte matinale »
- **Critères** : Bandeau orange supprimé. Heure cliquable en haut de carte ouvrant réglage (heure, statut). Accessible aussi dans Réglages.

### SRG-UI-08 — Audio discret et désactivé par défaut
- **Critères** : Si désactivé, aucun bloc audio. Si activé, ligne discrète « Écouter (durée) » sans bouton orange plein. Libellé « Lecture sans connexion ».

### SRG-UI-09 — Sport personnalisé et utile
- **Critères** : Priorité : équipes/joueurs suivis > L1 sénégalaise & sélections > reste. Raison affichée si compétition étrangère. Heure ou score.

### SRG-UI-10 — Phrase d'accueil plus courte
- **Critères** : « Bonjour. Pour [Ville] ce matin : X brèves et Y actualités sportives. » Pas de date répétée. Jour en minuscule en milieu de phrase.

---

## P1 — Mise en page

### SRG-UI-11 — Largeur maximale de la colonne centrale
- **Critères** : Max 720 px centré. À 1 920 px, colonne droite jusqu'à 360 px.

### SRG-UI-12 — Rien ne passe sous la barre de commande (ni sous le micro mobile)
- **Critères** : Marge basse = hauteur barre + 16 px. Fond opaque. Dernière carte 100% visible aux 4 largeurs.

### SRG-UI-13 — Étiquettes de section plus calmes
- **Critères** : Texte gris, majuscule initiale (« Votre journée »). Orange réservé.

### SRG-UI-14 — Menu latéral : un seul état actif, moins de badges
- **Critères** : « Plus de services » style neutre, seul item actif en surbrillance. Badges retirés sauf notes (et Live si branché). Libellés monolignes sans badge (« Shopping Nopalou »). Ordre et libellés cohérents avec barre mobile.

---

## P2 — Colonne de droite et détails

### SRG-UI-15 — Trafic : lisible et honnête
- **Critères** : État texte (« fluide », « dense », « bloqué »). « Mis à jour il y a X min ». Badge Live & brique visibles seulement si source connectée (sinon masquée par feature flag).

### SRG-UI-16 — Mémo épinglé réel
- **Critères** : Deux premières lignes de la note épinglée. Si vide : « Épinglez une note pour la garder ici ». Accords pluriel/singulier stricts.

### SRG-UI-17 — Terme « Kalpé »
- **Critères** : Infobulle d'explication ou choix utilisateur. Choix produit consigné dans `DECISIONS.md`.

### SRG-UI-18 — Contraste de l'orange
- **Critères** : Ratio >= 4,5:1 pour texte et étiquettes orange.

### SRG-UI-19 — Icône Wi-Fi de l'en-tête mobile
- **Critères** : Supprimée si tout est normal ; affichée avec libellé court et alerte uniquement en cas d'état réel (hors ligne, économie de données).
