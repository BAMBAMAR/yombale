# Plan marketing — Nopalou

Ce document contient des briefs texte (messages, specs) — aucune génération d'image n'est incluse ; les briefs visuels sont prêts à être transmis à un designer.

## 1. Message clé (positionnement)

> **"Comparez avant d'acheter. Vendez directement sur WhatsApp."**

Décliné par segment :
- Acheteur : *"Ne payez plus le prix fort — comparez les prix produits, immo et forfaits télécom en un clic."*
- Vendeur particulier : *"Publiez votre annonce en 2 minutes, recevez les demandes directement sur WhatsApp."*
- Commerçant : *"Votre boutique en ligne + votre catalogue WhatsApp, gérés depuis un seul endroit."*

## 2. Canaux prioritaires

1. **WhatsApp** (différenciateur produit)
   - Chaque fiche produit/annonce/immo est partageable en carousel WhatsApp — encourager le partage natif ("Envoyer à un ami" sur chaque fiche).
   - Le chatbot sert de canal d'acquisition passif : toute personne qui écrit au numéro Nopalou découvre le menu (recherche, alertes prix, commandes).
2. **Réseaux sociaux** (Facebook groupes locaux, Instagram, TikTok) — aller chercher l'audience déjà active sur les groupes d'annonces sénégalais existants, ne pas attendre qu'elle vienne.
3. **SEO / bot SSR** — déjà technique en place (`bot-ssr.js`), s'assurer que chaque page produit/annonce/immo a un titre et une description uniques exploitables par Google.
4. **Partenariats terrain** — recruter les 20-30 premiers commerçants Pro en direct (marchés, quartiers commerçants de Dakar), pas seulement en ligne.

## 3. Calendrier de lancement (4-6 semaines)

| Semaine | Action |
|---|---|
| 1 | Finaliser checklist technique (voir LANCEMENT-CHECKLIST.md), recruter 10-15 premiers commerçants en Pro gratuit |
| 2 | Ouvrir inscriptions publiques particuliers, premiers posts réseaux sociaux (lancement), activer parrainage |
| 3 | Push contenu réseaux sociaux ciblé par catégorie (produits high-demand, immo, télécom), 1er bilan KPIs |
| 4 | Activer facturation normale Pro/Business pour nouveaux inscrits, ajuster prix si besoin |
| 5-6 | Consolidation, témoignages commerçants early adopters, 2e vague de partenariats |

## 4. Briefs visuels (specs pour designer — pas de génération d'image ici)

### Bannière web (page d'accueil)
- Dimensions : 1920x600px (desktop), version mobile 750x1000px
- Message : "Comparez avant d'acheter" + CTA "Voir les prix"
- Ton : couleurs vives, sénégalaises (à définir avec identité de marque existante si logo déjà fait)

### Visuels réseaux sociaux
- Post carré (Instagram/Facebook feed) : 1080x1080px
  - Thème 1 : "Lancement Nopalou" — logo + accroche + CTA site
  - Thème 2 : "Comparez avant d'acheter" — visuel produit + prix comparés
- Story (Instagram/Facebook/WhatsApp Status) : 1080x1920px
  - Format court, un seul message, swipe-up/lien vers l'app

### Templates carousel WhatsApp (à soumettre à Meta, contenu texte à préparer)
- `nopalou_carousel_annonce` — carte annonce : photo, titre, prix, bouton "Voir l'annonce"
- `nopalou_carousel_immo` — carte bien immo : photo, type, prix, localisation, bouton "Voir le bien"
- `nopalou_carousel_telecom` — carte forfait : opérateur, prix, data/minutes, bouton "Comparer"
- `nopalou_fiche_texte` — fiche texte simple avec boutons rapides (Voir, Contacter, Alerte prix)

## 5. Argumentaire commercial B2B (boutiques / agences)

Points clés à utiliser en démarchage direct :
1. **Visibilité gratuite immédiate** en phase de lancement (30j Pro offert)
2. **Pas de commission cachée** — 2% clair, uniquement en Business, contre des commissions plus élevées ailleurs
3. **WhatsApp intégré** — le commerçant reçoit ses commandes directement là où il travaille déjà (pas un nouvel outil à apprendre)
4. **Analytics inclus** — voir combien de vues/contacts génère sa boutique (`/boutique/analytics`)
5. **Pas de développement requis** — création de boutique en quelques minutes

## 6. Contenu à préparer avant lancement

- [ ] Textes des 4 templates WhatsApp (pour soumission Meta — délai approbation 24-48h, donc à préparer tôt)
- [ ] 5-10 visuels de lancement (à briefer à un designer selon specs ci-dessus)
- [ ] Argumentaire B2B imprimé/PDF pour démarchage terrain
- [ ] Script de présentation pour recrutement commerçants (2-3 min, en français/wolof si pertinent)
