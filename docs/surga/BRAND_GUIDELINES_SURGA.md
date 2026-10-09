# GUIDE OFFICIEL D'UTILISATION DE LA MARQUE — SURGA
## Brand Guidelines & Normes Graphiques

**Version :** 1.0.0  
**Statut :** Document Officiel de Gouvernance de Marque  
**Audience :** Designers de Marque, Développeurs, Équipes Marketing, Partenaires  
**Marque Mère :** Nopalou Technologies

---

## 1. Introduction & Esprit de la Marque

**Surga** est la signature d'un assistant de poche personnel conçu pour l'Afrique francophone, né au Sénégal.

L'identité visuelle de Surga doit traduire en un coup d'œil :
- **La Serviabilité & le Dévouement :** Être présent sans s'imposer, prêt à servir avec loyauté.
- **La Précision Déterministe :** Rigueur des chiffres, exactitude arithmétique, fiabilité des sources.
- **La Chaleur Sahélienne :** Proximité humaine, énergie solaire matinale, ancrage local.

---

## 2. Construction Géométrique du Monogramme « S »

Le symbole officiel Surga est un monogramme vectoriel pur reposant sur une grille cartésienne stricte de **512×512 unités**.

```
                ┌────────────────────────────────┐
                │ 512×512 UNITES VECTORIELLES    │
                │                                │
                │        ╭──────────────╮ ─── AILE SUPÉRIEURE SOLAIRE
                │       ╱   AMBRE       │     (Écoute / Briefing)
                │      ╱    #D97706     │
                │     ╰─────────╮       │
                │               │       │
                │       ╭───────╯       │
                │       │   INDIGO      │ ─── BASE D'ANCRAGE
                │       │   #0F172A    ╱      (Exécution / Sécurité)
                │       ╰─────────────╯  │
                │                                │
                └────────────────────────────────┘
```

### 2.1. Spécifications Mathématiques
- **Grille de référence :** 512×512 px avec zone de protection périphérique de 32 px.
- **Rayon de courbure des arcs (Ruban S) :** Continuité de courbure de type *squircle* pour éviter tout angle cassé agressif.
- **Angle des biseaux directionnels :** 45° sur les jonctions intérieures, incarnant la flèche d'exécution.
- **Épaisseur du trait du ruban :** 76 unités constantes sur l'ensemble de la trajectoire pour assurer une visibilité absolue en très basse résolution.
- **Écartement de l'espace négatif central :** 24 unités créant une respiration nette sans affaiblir la silhouette.

---

## 3. Zone de Protection & Tailles Minimales

### 3.1. Zone de Respiration (Clearspace)
Aucun texte, élément graphique, photo ou bordure d'écran ne doit empiéter sur la zone de respiration entourant le logo.
- **Règle universelle :** La zone de protection minimale équivaut à **la moitié de la largeur du symbole (0.5 × X)** autour du logo ou du symbole.

### 3.2. Tailles Minimales d'Affichage
Pour garantir la netteté et la lisibilité du symbole :

| Support | Taille Minimale | Variante Recommandée |
| :--- | :--- | :--- |
| **Favicon Navigateur** | 16×16 px | `surga-symbol.svg` (simplifié sans sous-titre) |
| **Notification Barre d'État Android** | 24×24 px | `surga-symbol-mono.svg` (monochrome blanc) |
| **Icône d'Application PWA** | 48×48 px | `icon-192.svg` / `icon-512.svg` sur fond squircle |
| **Header Mobile App** | 32 px de hauteur | `surga-logo-compact.svg` |
| **Header Desktop / Web** | 40 px de hauteur | `surga-logo-horizontal.svg` |
| **Impression Papier (A4 / Reçus)** | 12 mm de largeur | `surga-symbol-mono.svg` (300 DPI) |

---

## 4. Variantes Autorisées du Logo

| Nom du Fichier | Description | Contexte d'Utilisation |
| :--- | :--- | :--- |
| `surga-symbol.svg` | Monogramme S ambre et indigo sur fond transparent. | Avatars, boutons, micro-icônes, watermarks discrets. |
| `surga-symbol-dark.svg` | Monogramme S ambre et blanc bleuté pour surfaces sombres. | Thème sombre, fond `#0F172A`, écrans OLED, console admin. |
| `surga-symbol-mono.svg` | Monogramme S monochrome noir 100% ou blanc 100%. | Documents imprimés N&B, tampons, notifications système. |
| `surga-logo-compact.svg` | Symbole S + Mot-symbole « SURGA » en 1 ligne compacte. | En-tête de l'application PWA, navigation mobile, popins. |
| `surga-logo-horizontal.svg`| Symbole S + Mot-symbole « SURGA » + Suffixe « Assistant de poche ». | Bannières officielles, présentations, partenariats, site vitrine. |
| `icon-192.svg` & `icon-512.svg`| Symbole S centré sur squircle officiel Nuit Indigo `#0F172A`. | Écran d'accueil Android / iOS, splash screen PWA. |
| `icon-maskable-512.svg`| Symbole S réduit à 60% avec fond plein sans coins arrondis. | Lanceurs Android adaptatifs (Pixel, Samsung One UI). |

---

## 5. Interdictions Strictes (Ce qu'il ne faut JAMAIS faire)

Pour préserver la valeur et l'intégrité de la marque :

1. **Ne jamais étirer, condenser ou déformer les proportions du logo.** (Toujours conserver le ratio 1:1 pour le symbole).
2. **Ne jamais remplacer les couleurs officielles par des teintes arbitraires.** (Interdit d'utiliser du violet néon, du vert fluo, ou du rose bonbon).
3. **Ne jamais appliquer d'ombres portées 3D agressives ou de contours (stroke) extérieurs sur le symbole.**
4. **Ne jamais ajouter d'émojis Unicode ou d'icônes étrangères à côté du logo** (ex: `✨ SURGA`, `⚡ SURGA`, `🤖 SURGA`).
5. **Ne jamais fusionner le logo Surga avec le logo Nopalou dans un même bloc insécable.** (Garder une distance de respiration minimale entre les deux marques).
6. **Ne jamais utiliser le logo sur un arrière-plan à motif bruyant ou sans contraste suffisant.** (Toujours assurer un contraste minimal de 4.5:1, et 7:1 pour le texte).

---

## 6. Déclinaisons Canaux & Réseaux Sociaux

### 6.1. WhatsApp Business
- **Photo de Profil (Avatar) :** Utiliser l'actif `surga-whatsapp-avatar.png` (symbole S ambre éclatant centré dans un cercle Indigo Nuit `#0F172A`).
- **Nom du profil :** **Surga — Assistant de poche**
- **Description courte :** *« Votre assistant quotidien à Dakar : briefing, dépenses FCFA, notes, calculs et alertes. Sans bavardage. »*

### 6.2. TikTok, Instagram & Facebook
- **Format Story / Reels (9:16) :**
  - En-tête : Logo compact Surga en haut à gauche (hauteur 28 px).
  - Badge discret : *« Par Nopalou »* en bas d'écran.
  - Cartouches de contenu : Fond blanc `#FFFFFF` sur fond brume `#F8FAFC`, typographie encre `#0F172A`, chiffres de dépenses en vert émeraude `#059669`.
- **Miniature Vidéo (16:9 / 1:1) :**
  - Fond épuré avec dégradé subtil Indigo Nuit vers Ambre.
  - Titre accrocheur en moins de 6 mots (ex: *« Vos dépenses en FCFA calculées à la voix »*).

---

## 7. Règles Photographiques & Iconographiques

### 7.1. Photographies
- **Authenticité Dakar & Afrique :** Privilégier des photographies réelles de la vie urbaine dakaroise (rues de Dakar, transports BRT/TER, marchés, bureaux modernes du Plateau ou des Almadies).
- **Zéro Cliché Folklorique :** Éviter les mises en scène stéréotypées ou passéistes. Surga incarne une Afrique moderne, dynamique, digitale et ambitieuse.
- **Zéro Image Générée par IA Dégénérative :** Bannir les visages synthétiques aux sourires plastifiés, les robots humanoïdes et les écrans holographiques de science-fiction.

### 7.2. Iconographie
- **Style :** Traits vectoriels nets, épurés, ouverts.
- **Épaisseur :** 2 px constantes sur toutes les interfaces.
- **Règle absolue :** Zéro émoji dans toute communication officielle de produit.
