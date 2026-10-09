# AUDIT DE L'IDENTITÉ VISUELLE & DE MARQUE — SURGA (AVANT TRANSFORMATION)

**Date de l'audit :** 5 octobre 2026  
**Auditeur :** Direction Artistique & Architecture de Marque  
**Périmètre :** Application PWA `/surga`, sous-domaine `surga.nopalou.com`, console `/admin/surga`, code frontend (`frontend-next`), documentation produit (`docs/surga/`), manifest et assets statiques (`public/`).

---

## 1. Résumé Exécutif & Constat Majeur

Surga a bénéficié d'un développement fonctionnel remarquable (briefing matinal, gestion financière *Sama Xaalis* en FCFA, calculatrice déterministe, météo par géolocalisation, alertes trafic TomTom Dakar, kiosque des Unes de presse, radios FM en direct, commande vocale et synchronisation hors-ligne).

Cependant, sur le plan de la **marque et de l'identité visuelle**, Surga se trouvait jusqu'à présent dans un état de **dépendance et d'inachèvement critique** :

> **Constat Clé :** Surga n'avait **aucun logo propre**, **aucun symbole distinctif**, **aucune icône d'application dédiée**, et empruntait littéralement le monogramme « N » et la palette orange brûlé de la marketplace Nopalou, tout en utilisant des icônes génériques d'IA comme béquille visuelle.

Ce manque d'autonomie visuelle enfreignait directement la décision tranchée **D22** et la règle permanente de démarcation :  
*« Surga fonctionne comme une application autonome à part entière, sans élément marketplace Nopalou : Même famille, identité distincte. »*

---

## 2. Inventaire Exhaustif de l'Existant (Avant Transformation)

### 2.1. Assets Graphiques & Manifest PWA
| Élément | État Avant Transformation | Problème Identifié |
| :--- | :--- | :--- |
| **Logo Surga** | Aucun fichier de logo existant dans le dépôt. | Absence totale d'actif de marque dépositaire. |
| **Symbole / Monogramme** | Aucun symbole propre. | Impossible d'identifier l'application sans lire son nom. |
| **En-tête de l'application (`SurgaHeader.tsx`)** | Balise `<Sparkles size={20} color="var(--accent, #C75B00)" />` devant le texte brut "Surga". | Cliché IA générique (l'étoile à 4 branches des chatbots IA) en contradiction avec la posture d'assistant d'exécution sérieux. |
| **Manifest PWA (`public/surga/manifest.json`)** | Pointe vers `/icons/icon-192.png`, `/icons/icon-512.png` et `/icons/icon-maskable-512.png`. | Ce sont les icônes de Nopalou (monogramme « N » orange). L'utilisateur qui installe Surga sur son écran d'accueil voit le logo Nopalou ! |
| **Couleur de thème PWA (`theme_color`)** | `#1C2B4A` (Bleu marine Nopalou) | Aucune distinction de couleur de barre d'état Android. |
| **Favicon** | Favicon standard Nopalou. | Pas de favicon propre dans l'onglet de navigation. |
| **Métadonnées OpenGraph (`layout.tsx`)** | `images: ['https://nopalou.com/icons/icon-512.png']` | Lors d'un partage WhatsApp ou Facebook d'un lien Surga, l'image d'aperçu est celle de la marketplace Nopalou. |

### 2.2. Palette de Couleurs & Tokens CSS
| Token | Valeur Avant | Analyse Critique |
| :--- | :--- | :--- |
| `--navy` | `#1C2B4A` | Bleu institutionnel historique de Nopalou. Utilisé massivement pour les titres de Surga. |
| `--accent` | `#C75B00` | Orange brûlé marketplace Nopalou. Omniprésent sur les boutons principaux, le micro flottant (FAB), les onglets actifs et les badges. |
| `--bg` | `#F8F5F0` | Fond sable chaud Nopalou. Agréable et doux, mais identique au comparateur de prix. |
| `--border` | `#E8DDD2` | Beige sable Nopalou. |
| `--price` | `#0A5C36` | Vert forêt Nopalou utilisé pour les montants FCFA. |

**Observation :** Les tokens utilisés dans `surga.css` étaient un simple copier-coller des variables de `design-tokens.css` de Nopalou. Si l'utilisateur bascule entre la marketplace et Surga, la palette est indiscernable.

### 2.3. Typographie
- **Police déclarée :** `var(--font-inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)`.
- **Comportement :** Police système native performante, conforme aux règles d'or (zéro chargement externe).
- **Problème :** Absence d'échelle modulaire formalisée et de règles d'empattement pour les données financières XOF et les synthèses courtes du briefing.

### 2.4. Ergonomie & Composants UI
- **Points forts réels :**
  - Respect strict de la règle "Cartes en 2 sous-lignes calibrées".
  - Zéro émoji Unicode dans l'interface (100% `lucide-react`).
  - Navigation basse à 5 onglets claire et ergonomique.
  - Micro flottant accessible.
  - Pas d'encombrement superflu.
- **Points faibles d'identité :**
  - Boutons génériques `.btn-npl` et `.surga-btn-primary` sans texture de marque.
  - Le micro flottant reprend l'orange pur Nopalou au lieu d'incarner une signature sonore et vocale Surga.
  - Aucune grille géométrique ni silhouette visuelle qui signe l'appartenance à Surga.

---

## 3. Matrice SWOT de l'Identité Surga Existante

### Forces (Strengths)
1. **Nom fort et enraciné :** « Surga » résonne culturellement au Sénégal comme l'allié de confiance, dévoué et travailleur.
2. **Clarté d'usage :** Les fonctionnalités (dépenses, notes, agenda, revue de presse, trafic) sont extrêmement utiles au quotidien.
3. **Respect technique exemplaire :** Zéro émoji, base 16px, légèreté mobile-first, conformité PWA.

### Faiblesses (Weaknesses)
1. **Invisibilité de marque :** Pas de logo, pas d'icône d'app, pas de favicon distinct.
2. **Parasitisme graphique avec Nopalou :** Même palette orange/marine que le site marchand, créant la confusion chez l'utilisateur ("Est-ce une boutique ? Un outil de commande ?").
3. **Béquille visuelle Sparkles (`Sparkles`) :** Fait penser à un énième chatbot IA générique de Silicon Valley, affaiblissant l'image d'un assistant de poche utile qui exécute.

### Opportunités (Opportunities)
1. **Création d'un symbole iconique mémorisable :** Une marque capable de devenir un réflexe sur l'écran d'accueil Android de milliers de Sénégalais.
2. **Palette propre à haute valeur perçue :** Une identité visuelle associant la précision nocturne, la chaleur sahélienne et la vitalité locale.
3. **Diffusion WhatsApp & Réseaux Sociaux :** Un avatar WhatsApp percutant et des cartes de partage identifiables d'un coup d'œil dans les statuts et stories.

### Menaces (Threats)
1. **Rejet par confusion avec Nopalou Marketplace :** Les utilisateurs refusant les sollicitations commerciales pourraient fuir Surga s'ils le perçoivent comme un canal promotionnel.
2. **Cliché folklorique ou IA :** Risque de tomber dans une illustration caricaturale ou un style tech néon générique.

---

## 4. Objectifs Stratégiques de la Nouvelle Identité

1. **Autonomie & Reconnaissance Immédiate (1 seconde) :** Surga doit être immédiatement identifiable sur l'écran d'un smartphone au milieu de 50 autres applications, sans qu'on ait besoin de lire son nom.
2. **Territoire Sémantique d'Exécution :** Exprimer le service, la fidélité, l'efficacité sans bruit, la structure et la simplicité.
3. **Harmonie sans Confusion avec Nopalou :** Exprimer la filiation technologique et la solidité de l'écosystème Nopalou tout en affirmant une personnalité 100% singulière.
4. **Performance Mobile & Vectorielle Pure :** 100% vectoriel (SVG), ultra-léger (< 5 Ko par asset), adapté aux écrans OLED, haute lisibilité en plein soleil à Dakar.
