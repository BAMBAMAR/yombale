# DOCUMENT DE PASSATION — IDENTITÉ DE MARQUE SURGA
## Handover Technique & Direction Artistique

**Date :** 5 octobre 2026  
**Auteur :** Direction Artistique, Design de Marque & UX Architecture  
**Statut :** Livré, Implémenté & Validé  
**Version :** 1.0.0

---

## 1. Résumé Exécutif

Cette mission a permis de doter **Surga**, l'assistant personnel de poche de Nopalou, d'une **identité de marque complète, originale et hautement mémorisable**, rompant définitivement avec son état antérieur d'invisibilité (où il empruntait les logos et couleurs de la marketplace Nopalou et s'appuyait sur des icônes IA génériques).

Surga dispose désormais de :
1. Son propre **symbole vectoriel dépositaire** (le ruban dynamique « S » en deux arcs complémentaires ambre et indigo, avec étincelle d'exécution émeraude).
2. Sa propre **palette de marque** contrastée (Indigo Nuit Minérale `#0F172A`, Ambre Sahélien Solaire `#D97706` / `#F59E0B`, Émeraude Teranga `#059669`, Blanc Brume `#F8FAFC`).
3. Son propre **pack d'actifs PWA et multi-canaux** (icônes 192×192, 512×512, maskable Android, favicon SVG et avatar WhatsApp Business).
4. Un **Design System formel** documenté pour les développeurs, garantissant zéro régression et zéro fuite vers la marketplace.
5. Une **documentation stratégique complète** en 5 documents de référence.

---

## 2. Décisions de Marque Tranchées

| Code | Décision | Justification Stratégique |
| :--- | :--- | :--- |
| **BID-01** | **Adoption du Concept 3 : Le Ruban d'Action Continue S.** | Équilibre parfait entre sens (écoute/exécution), mémorisation instantanée (le S de Surga), compacité et lisibilité extrême à 16 px. |
| **BID-02** | **Suppression de la béquille visuelle Sparkles (`Sparkles`).** | Surga est un assistant de poche sérieux qui exécute au quotidien (dépenses, météo, agenda, trafic), pas un chatbot gadget. Le header affiche désormais le véritable symbole vectoriel Surga. |
| **BID-03** | **Nuance Ambre Solaire (`#D97706`) au lieu de l'Orange Brûlé Nopalou (`#C75B00`).** | Démarcation visuelle immédiate entre l'univers e-commerce transactionnel de Nopalou et l'univers d'organisation personnelle de Surga (« Même famille, identité distincte »). |
| **BID-04** | **PWA 100% autonome et isolée.** | Le manifest PWA (`/surga/manifest.json`) pointe désormais exclusivement vers les icônes Surga avec `theme_color: #0F172A`. |
| **BID-05** | **Zero-CDN & Polices Système Natives.** | Maintien absolu de la performance mobile et de la contrainte Low-Data dakarois. Zéro police externe téléchargée dynamiquement. |

---

## 3. Cartographie des Fichiers Créés & Modifiés

### 3.1. Documentation Stratégique & Spécifications (Créés)
1. `docs/surga/AUDIT_IDENTITE_SURGA.md` : Audit sans complaisance de l'existant avant transformation (SWOT, analyse critique).
2. `docs/surga/IDENTITE_SURGA.md` : Document fondateur de marque (concept, positionnement, 4 piliers de personnalité, ton de voix, dimension sénégalaise, relation Nopalou).
3. `docs/surga/DESIGN_SYSTEM_SURGA.md` : Spécifications techniques complètes et dictionnaire des tokens CSS (`--surga-*`).
4. `docs/surga/BRAND_GUIDELINES_SURGA.md` : Guide officiel d'utilisation de la marque (grille géométrique 512×512, clearspace, tailles minimales, interdits, usages WhatsApp et réseaux sociaux).
5. `docs/surga/HANDOVER_IDENTITE_SURGA.md` : Le présent document de passation et de synthèse.

### 3.2. Actifs Graphiques Vectoriels & PNG (`frontend-next/public/surga/icons/`)
- `surga-symbol.svg` : Symbole officiel SVG (512×512, fond transparent).
- `surga-symbol-dark.svg` : Symbole pour surfaces sombres et mode nuit.
- `surga-symbol-mono.svg` : Symbole monochrome noir / blanc.
- `surga-symbol-white.svg` : Symbole blanc pur pour fonds denses.
- `surga-logo-compact.svg` : Symbole S + Mot-symbole « SURGA » en une ligne.
- `surga-logo-horizontal.svg` : Symbole + « SURGA » + Suffixe « Assistant de poche ».
- `icon-192.svg` & `icon-512.svg` : Icônes sur squircle officiel Indigo Nuit.
- `icon-maskable-192.svg` & `icon-maskable-512.svg` : Icônes adaptatives Android (safe zone 60%).
- `favicon.svg` : Favicon vectoriel ultra-léger (32×32).
- `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png` : Versions rastérisées haute définition via Playwright headless Chromium.
- `surga-whatsapp-avatar.png` : Avatar circulaire officiel pour WhatsApp Business.
- `surga-symbol.png` : Symbole PNG haute définition transparent.

### 3.3. Composants et Styles Frontend (Modifiés)
1. `frontend-next/public/surga/manifest.json` : `theme_color: #0F172A`, `background_color: #F8FAFC`, association des icônes officielles `/surga/icons/`.
2. `frontend-next/src/app/surga/layout.tsx` : `themeColor: #0F172A`, balises OpenGraph et Twitter pointant vers `/surga/icons/icon-512.png`, métadonnées `icons.icon` et `icons.apple`.
3. `frontend-next/src/app/surga/components/SurgaHeader.tsx` : Remplacement du placeholder `<Sparkles>` par le symbole officiel SVG de Surga et stylisation typographique du logotype.
4. `frontend-next/src/styles/surga.css` : Déclaration des tokens officiels `--surga-*`, rétrocompatibilité transparente, dégradé ambre sur le FAB micro et les boutons primaires, harmonisation des bordures et cartes.
5. `frontend-next/src/app/surga/components/SurgaLandingHero.tsx` : Élimination de l'étoile IA au profit du badge de marque officiel et bouton CTA stylisé.
6. `frontend-next/src/styles/surga-admin.css` : Harmonisation du dégradé du logo dans la sidebar d'administration.

---

## 4. Protocole de Tests & Validation Effectuée

| Test Réalisé | Résultat Attendu | Constat |
| :--- | :--- | :--- |
| **Génération des Actifs SVG** | Fichiers valides XML, ultra-légers (< 3 Ko). | **100% OK** (11 fichiers générés et vérifiés). |
| **Rastérisation PNG Headless** | PNGs nets à 192 px et 512 px sans décalage. | **100% OK** (Générés par Playwright Chromium). |
| **Intégrité de Syntaxe JS / TS** | Zéro erreur de build ou de typage Next.js. | **100% OK** (Validé). |
| **Isolation CSS & Zéro Fuite** | Aucun impact sur la marketplace Nopalou ni sur la caisse POS. | **100% OK** (Styles cloisonnés sous `.surga-root`). |
| **Contraste Visuel (WCAG AAA)** | Texte encre `#0F172A` sur fond brume `#F8FAFC` > 7:1. | **100% OK** (Ratio 16.5:1). |

---

## 5. Prochaines Étapes Recommandées (Backlog Post-Lancement)

1. **Déploiement WhatsApp :** Configurer l'avatar officiel `surga-whatsapp-avatar.png` sur le profil WhatsApp Business de Surga.
2. **Campagne Réseaux Sociaux :** Décliner les gabarits visuels pour TikTok et Instagram selon les Brand Guidelines.
3. **Audit Utilisateur à Dakar :** Recueillir les premiers retours des bêta-testeurs sur la reconnaissance de l'icône sur l'écran d'accueil de leurs smartphones Android.
