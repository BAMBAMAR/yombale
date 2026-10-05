# DESIGN SYSTEM TECHNIQUE — SURGA
## Spécifications de Développement & Tokens CSS

**Version :** 1.0.0  
**Statut :** Spécification Technique de Référence  
**Audience :** Développeurs Frontend Next.js, Designers UI, Intégrateurs  
**Cible :** `frontend-next/src/styles/surga.css` & composants `frontend-next/src/app/surga/components/`

---

## 1. Principes d'Ingénierie & Règles d'Or

1. **Isolation CSS Totale :** Les règles de style de Surga sont encapsulées sous le sélecteur racine `.surga-root` ou via le pseudo-sélecteur `body:has(.surga-root)`. Aucun style de Nopalou Marketplace ne doit fuiter dans Surga, et aucun style de Surga ne doit altérer Nopalou.
2. **Zéro Police Web Externe (Zero-CDN) :** Utiliser exclusivement la pile système déclarée sous `var(--font-inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)`. Aucun `@import`, `fetch` ou balise `<link>` Google Fonts / jsDelivr n'est autorisé.
3. **Zéro Émoji Unicode dans l'UI :** 100 % des icônes proviennent de `lucide-react`. Dimensionnement strict : **14 px**, **16 px**, **18 px**, exceptionnellement **20 px** (navigation / FAB).
4. **Composants Limités à 450 Lignes :** Tout composant dépassant 450 lignes doit être découpé en sous-composants dédiés dans le sous-dossier `components/`.
5. **Modèle de Données & Devise :** Montants manipulés et affichés exclusivement en **FCFA (XOF)**. Formatage standard : espace insécable entre les milliers (ex: `15 000 FCFA`).

---

## 2. Dictionnaire des Tokens CSS Officiels

Ces tokens sont déclarés dans le contexte de Surga et garantissent l'autonomie visuelle de l'application.

```css
/* ==========================================================================
   TOKENS DU DESIGN SYSTEM SURGA (OFFICIELS)
   ========================================================================== */
:root {
  /* --- Couleurs Fondamentales --- */
  --surga-primary: #0F172A;        /* Indigo Nuit Minérale (fond sombre, titres h1-h2) */
  --surga-primary-light: #1E293B;  /* Indigo Nuit secondaire (cartes sombres, survols) */
  --surga-accent: #D97706;         /* Ambre Sahélien (bouton micro FAB, CTA, focus) */
  --surga-accent-hover: #B45309;   /* Ambre Sahélien assombri au survol/appui */
  --surga-accent-glow: #F59E0B;    /* Or Solaire (reflets, badges actifs, lueur) */
  --surga-accent-soft: rgba(217, 119, 6, 0.08); /* Fond translucide de pastille */

  /* --- Sémantique Métier & Données --- */
  --surga-emerald: #059669;        /* Émeraude Teranga (dépenses positives, validations) */
  --surga-emerald-soft: rgba(5, 150, 105, 0.09); /* Fond pastille validation */
  --surga-danger: #DC2626;         /* Rouge Kolda (dettes en retard, alertes bouchons) */
  --surga-danger-soft: rgba(220, 38, 38, 0.09);  /* Fond pastille alerte */
  --surga-info: #0284C7;           /* Bleu Gorée (veilles concours, météo, liens) */
  --surga-info-soft: rgba(2, 132, 199, 0.09);

  /* --- Surfaces & Arrière-plans --- */
  --surga-bg: #F8FAFC;             /* Blanc Brume Minimal (fond d'écran principal) */
  --surga-surface: #FFFFFF;        /* Blanc Pur (cartes, formulaires, tiroirs) */
  --surga-surface-subtle: #F1F5F9; /* Fond discret pour champs ou badges neutres */

  /* --- Lignes & Bordures --- */
  --surga-border: #E2E8F0;         /* Gris Épure (lignes 1px de cartes et séparateurs) */
  --surga-border-focus: #D97706;   /* Contour actif lors du focus clavier/tactile */

  /* --- Typographie & Textes --- */
  --surga-text1: #0F172A;          /* Encre Anthracite (texte principal, contraste 16.5:1) */
  --surga-text2: #475569;          /* Ardoise Tempérée (métadonnées, labels secondaires) */
  --surga-text3: #94A3B8;          /* Gris Neutre d'état désactivé ou placeholders */
  --surga-text-on-accent: #FFFFFF; /* Blanc pur pour texte sur fond d'accent */

  /* --- Typographie Modulaire --- */
  --surga-font: var(--font-inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  --surga-text-h1: 22px;
  --surga-text-h2: 18px;
  --surga-text-h3: 15px;
  --surga-text-body: 15px;
  --surga-text-caption: 13px;
  --surga-text-badge: 11px;

  /* --- Rayons de Courbure (Radius) --- */
  --surga-radius-sm: 6px;
  --surga-radius-md: 10px;
  --surga-radius-lg: 14px;
  --surga-radius-xl: 20px;
  --surga-radius-full: 9999px;

  /* --- Ombres Portées Subtiles (Elevation) --- */
  --surga-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --surga-shadow-md: 0 4px 12px rgba(15, 23, 42, 0.06);
  --surga-shadow-lg: 0 8px 24px rgba(15, 23, 42, 0.08);
  --surga-shadow-fab: 0 6px 20px rgba(217, 119, 6, 0.35);

  /* --- Transitions Mobiles --- */
  --surga-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --surga-duration-fast: 150ms;
  --surga-duration-norm: 250ms;
}
```

---

## 3. Spécifications des Composants Fondamentaux

### 3.1. En-tête Sticky (`SurgaHeader`)
- **Structure :** 
  - À gauche : Symbole vectoriel officiel Surga (hauteur 28 px) + Mot-symbole « SURGA » (police système ultra-bold 18 px) + Sous-titre ou date dynamique (12 px).
  - À droite : Badge de connectivité réseau (En ligne / Hors-ligne avec icône vectorielle 12 px) + raccourci profil/réglages.
- **Position :** `position: sticky; top: 0; z-index: 40;`
- **Hauteur fixe :** 56 px.
- **Bordure :** 1px solide `var(--surga-border)`.
- **Fond :** `rgba(255, 255, 255, 0.95)` avec effet de flou natif `backdrop-filter: blur(8px)`.

### 3.2. Cartes Conteneurs (`.surga-card`)
- **Fond :** `#FFFFFF`
- **Bordure :** `1px solid var(--surga-border)`
- **Rayon :** `14px`
- **Padding :** `16px`
- **Ombre :** `var(--surga-shadow-sm)`
- **Espacement vertical :** `margin-bottom: 12px`
- **Règle Mobile :** Pleine largeur (`width: 100%; box-sizing: border-box;`).

### 3.3. Cartes d'Items en 2 Sous-Lignes Calibrées (`.surga-item-row`)
Ce composant structure l'affichage des dépenses, des notes, des rendez-vous et des flashs infos sans troncature sauvage :
- **Ligne 1 (`.surga-item-line1`) :** Nom complet ou description lisible (`font-size: 15px; font-weight: 600; color: var(--surga-text1);`).
- **Ligne 2 (`.surga-item-line2`) :** Métadonnées essentielles (`font-size: 13px; color: var(--surga-text2);`) associées au montant en FCFA (`color: var(--surga-emerald); font-weight: 700; white-space: nowrap;`).
- **Zone d'action droite :** Bouton iconique discret (Action Sheet ou suppression) calé à droite sans déborder.

### 3.4. Bouton Vocal Flottant (`.surga-fab-mic`)
Le micro est la porte d'entrée rapide de l'assistant de poche :
- **Dimensions :** 56×56 px, cercle parfait.
- **Fond :** `linear-gradient(135deg, #F59E0B 0%, #D97706 100%)`.
- **Ombre portée :** `var(--surga-shadow-fab)`.
- **Position :** `position: fixed; bottom: 80px; right: 20px; z-index: 50;`.
- **Micro-interaction :** Au tap/clic, scale(0.95) immédiat et pulsation douce lors de l'enregistrement actif.

### 3.5. Navigation Basse Mobile à 5 Onglets (`.surga-bottom-nav`)
- **Structure fixe :** 5 entrées équipées d'icônes Lucide :
  1. *Aujourd'hui* (`Sun`, 20 px)
  2. *Notes* (`FileText`, 20 px)
  3. *Sama Xaalis* (`Wallet`, 20 px)
  4. *Agenda* (`Calendar`, 20 px)
  5. *Plus* (`SlidersHorizontal`, 20 px)
- **Hauteur :** 64 px.
- **Comportement actif :** Couleur d'icône et label passant à `var(--surga-accent)` avec poids 700 et micro-point lumineux sous l'onglet.
- **Safe Area Inset :** `padding-bottom: env(safe-area-inset-bottom, 0px);`.

### 3.6. Boutons & Contrôles d'Action
- **Bouton Principal (`.surga-btn-primary`) :**
  - Fond : `var(--surga-accent)` (ou dégradé ambre subtil).
  - Couleur texte : `#FFFFFF` (contraste 4.8:1 sur fond ambre).
  - Hauteur minimale : 48 px (zone tactile ergonomique Google & Apple).
  - Rayon : 12 px.
  - Typographie : 16 px, poids 700.
- **Bouton Secondaire (`.surga-btn-secondary`) :**
  - Fond : Transparent ou `#FFFFFF`.
  - Bordure : `1px solid var(--surga-border)`.
  - Couleur texte : `var(--surga-primary)`.
  - Hauteur minimale : 44 px.

---

## 4. Composants Spécifiques à l'Assistant

### 4.1. Carte de Confirmation Vocale & Modale Écoute
- **Règle absolue :** Aucune écriture n'est validée en base de données sans une confirmation visuelle explicite.
- **Présentation :**
  - Badge d'état : *« Ce que Surga a compris »* avec icône `CheckCircle2` (14 px).
  - Bloc structuré : Montant en grand (`24 px, #059669`), Catégorie (`14 px, badge`), Date.
  - Deux boutons horizontaux calibrés : **[Corriger]** (secondaire) et **[Confirmer]** (primaire ambre).

### 4.2. Lecteur Persistant des Radios FM (`SurgaPersistentRadioBar`)
- **Position :** Fixé au-dessus de la barre de navigation basse (hauteur 48 px).
- **Égaliseur audio animé :** 3 barres CSS pures de couleur ambre (`surga-eq-bar`) animées par keyframes.
- **Zéro fuite visuelle :** Ajuste automatiquement la position du FAB micro (`bottom: 124px`) pour éviter tout chevauchement d'interface.

---

## 5. États Système (Empty, Loading, Error, Offline)

1. **État Vide (Empty State) :**
   - Icône Lucide neutre (36 px, couleur `--surga-text3`) dans un conteneur circulaire doux.
   - Message court en 2 lignes (Titre 15 px bold + Sous-titre 13 px expliquant comment démarrer au clavier ou au micro).
   - Zéro illustration lourde.
2. **État de Chargement (Skeleton Loading) :**
   - Squelettes animés en CSS pur via dégradé shimmer linéaire gris clair (`#F1F5F9` → `#E2E8F0` → `#F1F5F9`).
   - Strictement calibrés aux hauteurs réelles des cartes (56 px pour un item, 140 px pour une carte de briefing).
3. **État Hors-Ligne (Offline Mode) :**
   - Bannière ou badge compact vert/ambre doux : *« Mode local actif — Données synchronisées au retour de la connexion »*.
   - Aucun blocage d'interface : la consultation et la création locale restent 100% fluides.
