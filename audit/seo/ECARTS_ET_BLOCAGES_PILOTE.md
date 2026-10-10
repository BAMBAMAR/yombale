# Registre des Écarts, Blocages et Anomalies Hors-Périmètre — Pilote SEO

```text
Document       : Suivi des Écarts, Décisions et Blocages du Pilote SEO
Fichier        : audit/seo/ECARTS_ET_BLOCAGES_PILOTE.md
Autorité       : Agent 10 (Ingénieur d'Exécution & Implémentation Technique SEO)
Date           : 2026-10-10
Branche Git    : main (Vérifiée via git branch --show-current -> main)
Statut         : 100% des Écarts et Arbitrages Documentés pour l'Agent 11 et la Direction
```

---

## 1. Synthèse des Écarts par Rapport au Plan Initial

| Sujet / Tâche | Plan Initial (Agent 8 / 9) | Réalisation Effective (Agent 10) | Justification Technique de l'Écart | Impact sur le Projet |
| :--- | :--- | :--- | :--- | :--- |
| **Résolution Soft-404 (`CORR-01`)** | Ajout d'interceptions redondantes dans les Server Components `page.tsx`. | **Suppression de `frontend-next/src/app/loading.tsx` à la racine globale**. | L'analyse approfondie a démontré que le streaming HTTP 200 prématuré était déclenché par l'enveloppement automatique en `<Suspense>` sous RootLayout causé par ce fichier. La suppression assainit la totalité des routes sans code verbeux. | **Gain d'efficacité majeur**. Résout le problème à la racine pour toutes les pages dynamiques. |
| **Sous-Hub Climatiseurs Astech (`BLOQ-03`)** | Déploiement simultané avec la Tranche 1. | **Maintien du séquençage en Tranche 2 (Cadrée)**. | L'architecture de routage Next.js actuelle `[slug]/[sousCategorie]` ne gère que 2 segments d'URL. L'introduction immédiate d'une route à 3 segments nécessitait un choix d'architecture (Option A sous-dossier `[marque]` vs Option B landing dédiée). | **Sécurité maximale**. Évite tout risque de 404 inattendue en production. |
| **Attribution SQL (`BLOQ-02`)** | Exécution d'un script Node local direct de migration. | **Intégration DDL dans `backend/migrate-inline.js` + script SQL autonome**. | Le gestionnaire de pool local `backend/models/db.js` déclenche une alerte WhatsApp d'urgence vers l'administrateur en cas d'échec de connexion locale à Render. | **Protection anti-spam WhatsApp**. La migration se fera lors du démarrage officiel sur Render. |
| **Émojis UI Découverts** | Non répertoriés dans le plan initial de l'Agent 8. | **Suppression et remplacement par des icônes Lucide** dans `creer-boutique-en-ligne/page.tsx`. | Respect impératif de la Règle d'or n°1 (`AGENTS.md`) : zéro émoji Unicode dans l'UI. | **Conformité stricte au Design System**. |

---

## 2. Anomalies Découvertes Hors Périmètre (À Traiter Post-Pilote)

Au cours de l'inspection approfondie du code pour l'implémentation du pilote, l'Agent 10 a consigné les anomalies suivantes qui dépassent le cadre strict du pilote SEO :

### Anomalie Hors-Périmètre 1 : Redirections Courtes Boutiques en HTTP 307 (`CORR-07`)
- **Constat** : Dans `frontend-next/src/app/b/[slug]/route.ts` (lignes 18, 25, 32), la redirection vers `/boutiques/[slug]` est émise avec un statut HTTP 307 (redirection temporaire) au lieu d'un statut HTTP 301 (redirection permanente).
- **Conséquence** : Googlebot ne transmet pas immédiatement l'équité de lien (PageRank) vers la vitrine canonique.
- **Statut** : Classé en P2 dans le backlog global. Non modifié dans ce pilote pour respecter strictement la consigne de non-extension non autorisée du périmètre.

### Anomalie Hors-Périmètre 2 : Cache-Control Agressif sur `/annonces` et `/immo` dans le Middleware
- **Constat** : Dans `frontend-next/src/middleware.ts` (lignes 200-206) :
  ```typescript
  if (pathname.startsWith('/immo') || pathname.startsWith('/annonces') ...) {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  }
  ```
  Ce cache est appliqué de manière globale à l'ensemble du sous-arbre, y compris sur les routes d'annonces qui renvoient `not-found`.
- **Recommandation** : S'assurer que le header `Cache-Control` est écrasé en `private, no-cache, no-store` lorsque la page rend un statut 404 pour éviter la mise en cache de fausses pages d'erreur par Cloudflare.

### Anomalie Hors-Périmètre 3 : Biais de l'Événement `purchase` GA4 sur les Commandes en Espèces / Crédit
- **Constat** : Dans `frontend-next/src/components/cart/useCommander.ts` (lignes 328-333), l'événement `purchase` est déclenché dès la soumission du formulaire, sans distinguer le paiement à la livraison (COD) ou le crédit.
- **Statut** : Identifié par l'Agent 7 (`MES-ANO-02`). À corriger dans le chantier panier/checkout e-commerce général.

---

## 3. Décisions Soumises à la Validation de la Direction / Agent 11

### Décision 1 : Choix d'Architecture de Routage pour la Tranche 2 (Astech Climatiseurs)
Pour héberger le sous-silo des 702 climatiseurs Astech, deux options techniques sont prêtes :
- **Option A (Hiérarchique)** : Création d'un sous-dossier `frontend-next/src/app/categorie/[slug]/[sousCategorie]/[marque]/page.tsx` pour servir `/categorie/tv-electro/climatiseurs/astech`.
- **Option B (Landing Dédiée - Recommandée)** : Création d'une page d'atterrissage directe ultra-ciblée `frontend-next/src/app/climatiseur-astech-dakar/page.tsx`, bénéficiant d'un ciblage exact sur la requête reine de recherche sans complexifier le routeur de catégorie.

### Décision 2 : Autorisation de Déploiement en Production
- Conformément à la règle de gouvernance `AGENTS.md`, **aucun push Git** n'a été exécuté par l'Agent 10.
- L'autorisation de déploiement en production dépend de la recette et de la validation indépendante menée par l'**Agent 11**.
