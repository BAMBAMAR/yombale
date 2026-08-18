# OpenSpec Proposal — Internationalisation de l’espace compte et boutique

## 1. Contexte & Problématique
Nopalou est le premier comparateur de prix et plateforme e-commerce/POS au Sénégal et dans la sous-région. Pour faciliter l'adoption auprès d'une communauté marchande et d'acheteurs diversifiée (locaux, diaspora, commerçants arabophones et anglophones), la plateforme a besoin d'une interface multilingue adaptée.

## 2. Objectif
Permettre à un utilisateur de choisir et basculer facilement entre :
- **Français** (`fr`) — langue par défaut
- **Anglais** (`en`)
- **Arabe** (`ar`) avec support RTL complet

La langue choisie est persistée via un cookie (`nopalou_locale`) et s'applique de manière cohérente à travers toute la session : authentification, espace compte utilisateur, gestion de boutique, carnet de dettes et caisse POS.

## 3. Périmètre (Scope)

### Inclus
- **Authentification** : `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/verification-email`, formulaires email & WhatsApp OTP, messages d'erreur et de confirmation.
- **Espace Compte SPA** : Tableau de bord, profil, mes annonces, mes biens immo, favoris, alertes prix, suivi de commande, apporteur d'affaires, fonctionnalités.
- **Boutique & Caisse POS** : Dashboard marchand, produits, commandes, clients, carnet de dettes, comptabilité, caisse POS, reçus et paiements.
- **Composant Sélecteur de Langue** : Accessible sur les pages d'auth, le compte, la boutique et la caisse.
- **Support RTL & Polices natives** : Support RTL automatique en arabe sans aucun appel CDN externe.

### Hors Périmètre Initial
- Traduction du catalogue public général et des URLs publiques (maintien du SEO existant).
- Traduction automatique du contenu libre généré par les utilisateurs (titres/descriptions libres des annonces).
- Back-office super-administrateur.

## 4. Critères d'Acceptation
1. Trois langues disponibles et commutables sans rupture de session (`fr`, `en`, `ar`).
2. Persistance via cookie `nopalou_locale` (1 an, SameSite=Lax).
3. L'Arabe active automatiquement l'attribut `dir="rtl"` et `lang="ar"` avec un alignement visuel adapté.
4. Zéro police externe téléchargée (conformité avec la directive stricte du projet).
5. Build de production Next.js 14 valide et tests d'intégrité i18n au vert.
