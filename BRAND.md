# Charte d'Identité Visuelle — Nopalou

Guide officiel des actifs de marque, spécifications techniques et règles d'utilisation de l'identité visuelle **Nopalou**.

---

## 1. Fondations de la Marque

Nopalou est le premier comparateur de prix de référence au Sénégal (produits e-commerce, immobilier, forfaits télécom).

L'identité visuelle véhicule :
- **Clarté & Efficacité** : accès immédiat au meilleur prix sans friction.
- **Fiabilité Commerciale** : ancrage local fort, sérieux institutionnel et transparence.
- **Modernité & Performance** : actifs 100 % vectoriels, légers et ultra-lisibles sur tous les écrans.

---

## 2. Palette de Couleurs Officielles

| Rôle | Nom | Hex | Utilisation |
| :--- | :--- | :--- | :--- |
| **Primaire / Accent** | Orange Brûlé | `#C75B00` | Fond monogramme, boutons d'action (CTA), suffixe « lou », mise en avant |
| **Secondaire / Titres** | Bleu Marine | `#1C2B4A` | Fond footer, titres h1-h6, préfixe « Nopa », headers |
| **Gain / Économie** | Vert Forêt | `#0A5C36` | Prix bas, badges promotionnels, taux d'économie |
| **Fond Principal** | Sable Chaud | `#F8F5F0` | Arrière-plan global de l'application |
| **Cartes & Surfaces** | Blanc Pur | `#FFFFFF` | Cartes produits, conteneurs, popups |
| **Bordures** | Beige Sable | `#E8DDD2` | Lignes de séparation et contours discrets |
| **Texte Principal** | Encre Chaude | `#1A1612` | Typographie courante, descriptions |
| **Texte Secondaire** | Pierre Chaude | `#6B5E52` | Métadonnées, sous-titres, libellés secondaires |

---

## 3. Système de Logos

Tous les fichiers logos sont au format **SVG vectoriel pur** (aucun élément `<text>` dépendant d'une police système pour le symbole) et complétés par des versions PNG haute résolution pour la PWA.

### Fichiers Officiels dans `/public/icons/`

| Fichier | Format / Dimensions | Usage |
| :--- | :--- | :--- |
| `logo-mark.svg` | SVG (512×512 viewBox, 32×32 display) | Favicon web, icône d'application, en-tête compact |
| `logo-horizontal.svg` | SVG (220×40) | Logo complet horizontal pour header desktop, factures, documents |
| `logo-horizontal-white.svg` | SVG (220×40) | Version blanche pour fonds foncés (ex: footer `#1C2B4A`, bannières sombres) |
| `logo-mark-dark.svg` | SVG (512×512) | Monogramme sur fond bleu marine `#1C2B4A` pour fonds très clairs |
| `logo-mark-white.svg` | SVG (512×512) | Monogramme blanc translucide pour intégration photo/bannière |
| `logo-mark-mono.svg` | SVG (512×512) | Monogramme noir `#1A1612` sans fond pour impression économique / tampons |
| `logo-mark-transparent.svg` | SVG (512×512) | Monogramme blanc sur fond transparent |
| `icon-192.svg` & `icon-192.png` | 192×192 px | Icône PWA pour écran d'accueil Android / mobile |
| `icon-512.svg` & `icon-512.png` | 512×512 px | Splash screen PWA & icône haute résolution |
| `icon-maskable-512.svg` & `.png` | 512×512 px | Icône adaptative Android (symbole centré dans la zone sûre de 40 %) |
| `apple-icon.png` | 180×180 px | Icône Apple Touch pour iOS Safari |

---

## 4. Construction Géométrique du Monogramme « N »

Le monogramme **N** repose sur une géométrie vectorielle équilibrée :
- **Jambage gauche** : `x: 120 → 188` (largeur 68 px)
- **Jambage droit** : `x: 324 → 392` (largeur 68 px)
- **Diagonale directionnelle** : relie le sommet gauche `(188, 108)` à la base droite `(324, 404)`
- **Encoches triangulaires soustractives** :
  - Encoche supérieure : `(188, 108)` → `(324, 108)` → `(324, 306)`
  - Encoche inférieure : `(188, 206)` → `(324, 404)` → `(188, 404)`
- **Rayon de courbure du carré support** : `rx = 112 px` (21,8 % de la largeur)

---

## 5. Spécification PWA & Zone Sûre Android (Maskable Icon)

Conformément au standard W3C Web App Manifest :
- L'icône `icon-maskable-512.png` a un fond `#C75B00` plein (sans coins arrondis pré-découpés).
- Le symbole N est mis à l'échelle à 60 % et centré (`translate(102.4, 102.4) scale(0.6)`), garantissant qu'aucune partie du logo n'est rognée lors du recadrage en cercle, goutte, squircle ou carré par les lanceurs Android.

---

## 6. Règles d'Utilisation et Interdictions

### ✅ À Faire
- Toujours utiliser les fichiers SVG officiels fournis dans le répertoire `/public/icons/`.
- Respecter une zone de respiration minimale égale à 25 % de la hauteur du logo autour du symbole.
- Utiliser `logo-horizontal-white.svg` sur tout fond de luminosité inférieure à 40 %.
- Conserver la pile de polices système native haute lisibilité (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) pour toute composition textuelle associée.

### 🚫 À Ne Jamais Faire
- Ne pas déformer, étirer ou modifier les proportions du N.
- Ne pas remplacer le fond orange brûlé `#C75B00` par d'autres couleurs non chartées (ex: rouge vif, vert, violet).
- Ne pas appliquer d'effets de dégradé arbitraire, d'ombres portées agressives ou d'effets 3D sur le monogramme.
- Ne pas ajouter de soulignement CSS sous le mot « lou ».
- Ne pas réintroduire d'élément externe (ex: sac de shopping, caddie) qui alourdirait le signe et nuirait à la lisibilité à 16 px / 32 px.
- Ne jamais charger de polices web dynamiques externes (`@import`, CDN Google Fonts, jsdelivr) conformément aux règles d'optimisation et d'autonomie du projet.
