# 🤝 DOCUMENT DE HANDOVER & REPRISE DE SESSION — MODULE SURGA

> **Dernière mise à jour** : 06 Octobre 2026 (Session Matin 3)  
> **Branche de travail** : `feature/surga`  
> **Statut global** : 🟢 **100% Prêt & Validé (Tranche 18 : Emploi, Profil Pro, CV PDF & Lettres de Motivation, Tranche 17 : Séries TV & Lutte Sénégalaise, Alertes Vidéos Atom YouTube, Quota WhatsApp 2 req/j, Logo Officiel Caftan S, Zéro Or, Orange Micro Calibré & Pack PWA, En-tête Cliquable & Navigation Retour, Résolution Incohérence Sama Xaalis, Raccordement Kiosque ProjetBI, Météo 14 Régions, Passerelles Transversales, Console Pro 12 Modules)**  
> **Auteur** : Antigravity (Assistant AI Senior & Ingénieur Full-Stack)

---

## 1. 🎯 Résumé Exécutif & Ce qui a été Réalisé

L'assistant personnel de poche **Surga** intègre désormais le pôle complet **Emploi & Carrière (Tranche 18)** : profil professionnel exhaustif, générateur de CV PDF natif `pdfkit` avec choix de modèles (`sobre_moderne` et `classique_pro`), générateur déterministe de lettres de motivation, respect strict de la règle Zéro-Hallucination avec case à cocher obligatoire d'exactitude, et modèle de droits & quotas équilibré (1 CV gratuit avec mention, puis 500 FCFA à l'acte selon Option A ou Surga Premium ; 1 lettre/mois puis Premium).

0. **Emploi, Profil Pro, CV PDF & Lettres de Motivation (Tranche 18 — 100% DONE)** :
   - **Base de Données & Migrations Idempotentes** : Tables `surga_profil_pro` (unique user_id), `surga_documents_emploi` (index user_id), `surga_usages` (unique `user_id, type_action, mois_cle`) dans `backend/migrate-inline.js`.
   - **Service Métier & Générateur PDF Natif** : `backend/services/surga/emploi-service.js` avec moteur direct `pdfkit` (stream HTTP direct, header `%PDF-1.3`, modèles A4 `sobre_moderne` et `classique_pro`), assainissement des retours chariots (`cleanPdfText`), proposition déterministe de lettre (vouvoiement D19, zéro extrapolation).
   - **Modèle de Droits & Quotas (Section 1 bis & D27)** : 1er CV gratuit avec mention discrète en pied de page, puis blocage pour paiement à l'acte à 500 FCFA (Option A validée) ou Surga Premium (1 500 F/mois) ; 1 lettre/mois gratuit puis Premium.
   - **Sécurité Anti-IDOR & Portabilité RGPD** : Vérification stricte du token et de l'appartenance `req.user.id`, export JSON complet et suppression en cascade dans `donnees-service.js` et `SurgaDonneesModal.tsx`.
   - **Composants Frontend PWA (< 450 lignes & Zéro Émoji)** :
     - `SurgaProfilProTab.tsx` (360 l.) : Saisie complète du profil, expériences, formations, compétences et coordonnées.
     - `SurgaCvTab.tsx` (260 l.) : Choix du modèle de mise en page, affichage des quotas, case d'exactitude obligatoire et téléchargement PDF.
     - `SurgaLettreTab.tsx` (274 l.) : Rapprochement avec l'offre d'emploi, rédaction libre, case de relecture obligatoire et export PDF.
     - `SurgaEmploiModal.tsx` (387 l.) : Tiroir principal à 4 onglets avec historique des documents et téléchargement instantané Blob.
     - Raccordement dans `SurgaParametresTab.tsx`, `SurgaModalsContainer.tsx` et maintien de `surga/page.tsx` à 447 lignes (< 450 l.).

0. **Séries TV & Lutte Sénégalaise (Alertes Vidéos, Cron Atom & Modularisation) (Tranche 17 — 100% DONE)** :
   - **Ingestion Officielle Atom/RSS YouTube** : Décodage XML via `cheerio` des chaînes de production de fictions dakaroises (Marodi TV, EvenProd, Leuz Média) et des promoteurs d'arène de lutte (Lutte TV, Albourakh Events, Gaston Productions).
   - **Dédoublonnage Strict & Base de Données** : Tables `surga_video_sources`, `surga_video_items` (contrainte d'unicité sur `url`) et `surga_video_abonnements` (unicité `(user_id, source_id)`).
   - **Cron Périodique Mutualisé** : Synchronisation toutes les 30 minutes dans `backend/services/cron-surga-rss.js` sans créer de processus arrière-plan lourd.
   - **Modularisation Stricte (< 450 lignes)** :
     - Client : `SurgaVideosModal.tsx` (393 l.) avec extraction de `SurgaVideoCard.tsx` (96 l.) : Onglets Séries / Lutte / Suivis, recherche instantanée, liens sortants direct YouTube Low-Data et passerelle Agenda.
     - Admin : `AdminVideosTab.tsx` (375 l.) avec extraction de `AdminVideoSourceModal.tsx` (175 l.) dans `/admin/surga` : CRUD dynamique des flux, bascule actif/inactif et bouton de synchronisation immédiate.
   - **Rectification Quota WhatsApp Déterministe** : Alignement de l'administration et des comptes sur 2 requêtes gratuites/jour conformément à `CORR-P1-06`, fiabilisation de la requête SQL de jointure dans `backend/routes/admin-surga.js`.
   - **Conformité RGPD Intégrale** : Prise en charge des abonnements vidéo dans l'export de données et la purge intégrale (`donnees-service.js` et `SurgaDonneesModal.tsx`).

0. **Logo Officiel de Marque, Symbole S Caftan & Pack PWA HD (Tranche 28 — 100% DONE)** :
   - **Sculpture Anatomique Synchronisée** : Silhouette noble d'un homme en caftan d'action dont la tête et les épaules tournent de concert vers la droite, suivant naturellement le sens dynamique de la courbe supérieure du S.
   - **Profil Unique & Zéro Artefact Fantôme** : Élimination méticuleuse de tout double profil résiduel ou ombre de tête superposée à l'arrière du crâne grâce à une découpe vectorielle et un masque occipital lissé.
   - **Ligne Svelte & Élimination des Planches Inférieures** : Suppression radicale des deux blocs rectangulaires artificiels sous la ceinture ; affinement du corps du S par conversion des rubans et bandes secondaires en bleu marine nuit d'ombre (`#0A1128`), apportant légèreté et lisibilité à petite échelle.
   - **Zéro Or & Accord Chromatique Parfait** : Éradication totale des tons dorés/jaunes éclatants. Étalonnage direct de l'accent sur l'orange exact `#EA8F09` (`rgb(234, 143, 9)`) échantillonné sur le FAB micro de l'application Surga, réservé au nœud du ceinturon (*takku ndig*).
   - **Génération & Déploiement des Actifs PWA** :
     - Master HD : `frontend-next/public/surga/surga-symbol.png` (1024×1024).
     - Pack PWA & Favicons : `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.png`, `favicon.svg` et miroir `public/surga/icons/`.
     - Intégration en-tête `SurgaHeader.tsx` : affichage du symbole officiel squircle 34×34px avec bord arrondi 8px.
   - **Validation In-App & Tests** : Rendu validé en conditions réelles sur serveur de développement Next.js (iPhone mobile et desktop). Zéro régression TypeScript (`tsc --noEmit`), linter Anti-AI-Slop 100% au vert.

0. **En-tête Cliquable & Navigation Retour sur les Vues Internes (Tranche 27 — 100% DONE)** :
   - Fin de la rigidité de l'en-tête : `SurgaHeader.tsx` est désormais doté des props `onRetour` et `afficherRetour`.
   - Bouton de retour discret `<ChevronLeft />` intégré au design squircle à gauche de la marque lors de la navigation sur les onglets secondaires (`Sama Xaalis`, `Notes`, `Agenda`, `Paramètres`).
   - Cliquabilité globale de la zone de marque (`cursor: pointer`, `role="button"`, touches `Enter`/`Space`) déclenchant le retour immédiat à l'accueil `Aujourd'hui` ou le scroll au sommet de la page.
   - Validation automatisée Playwright mobile vérifiant le curseur et la navigation instantanée au clic.

0. **Synchronisation & Résolution de l'Incohérence Sama Xaalis (Tranche 26 — 100% DONE)** :
   - Éradication de la divergence d'affichage : la tuile du tableau de bord affichait `0 FCFA • Suivi entrées & dépenses` au lieu du solde réel calculé par `surga-kalpe.ts` (ex. `102 778 FCFA` pour l'utilisateur avec +150 000 F d'entrées et -47 222 F de dépenses).
   - Raccordement réactif dans `frontend-next/src/lib/surga-kalpe.ts` : émission de `surga-kalpe-change` et `surga-data-change` (`notifierKalpe()`) lors de tout ajout/modification/suppression dans Sama Xaalis (opérations, dettes, objectifs).
   - Passerelle bidirectionnelle dans `frontend-next/src/lib/surga-offline-sync.ts` répercutant automatiquement les dépenses vocales et transversales dans `surga_kalpe_operations`.
   - Prop `soldeKalpeFormate` dans `SurgaDashboardTools.tsx` et gestion d'état réactive dans `page.tsx` (< 450 lignes respecté).
   - Export et purge locale dans `SurgaDonneesModal.tsx` couvrant désormais l'ensemble des clés Sama Xaalis.
   - Validation automatisée Playwright confirmant le rendu visuel au pixel près (`102 778 FCFA • Suivi entrées & dépenses`).

0. **Raccordement Kiosque des Unes & ProjetBI (`LE-PROJET` / `projetbi.org`) (Tranche 25 — 100% DONE)** :
   - Détection du dossier racine `../LE-PROJET/` et de son flux live `press.json` avec 41 Unes de quotidiens du jour (05/10/2026).
   - Module `synchroniserUnesProjetBi()` dans `kiosque-service.js` gérant la synchronisation automatique en local et à distance via `https://projetbi.org/`.
   - Normalisation du formatage des dates (« Aujourd'hui ») dans `SurgaKiosqueUnes.tsx` et affichage mobile validé des 41 quotidiens.
   - Endpoint de synchronisation forcée `POST /api/surga/kiosque/sync` et raccordement au rafraîchissement global.

0. **Identité de Marque & Territoire Visuel Dépositaire (Tranche 24 — 100% DONE)** :
   - **Audit sans complaisance (`docs/surga/AUDIT_IDENTITE_SURGA.md`)** : Éradication de l'emprunt des logos/couleurs Nopalou et des béquilles visuelles IA (Sparkles).
   - **Document Fondateur de Marque (`docs/surga/IDENTITE_SURGA.md`)** : Positionnement d'assistant qui exécute au quotidien au Sénégal, 4 piliers de personnalité, ton de voix vouvoiement direct sans bavardage, démarcation stricte « Même famille, identité distincte ».
   - **Sélection du Symbole Officiel : Le Ruban d'Action Continue S** : Alliance de l'Écoute (Ambre Solaire `#F59E0B` → `#D97706`), de l'Exécution (Indigo Nuit Minérale `#1E293B` → `#0F172A`) et de l'étincelle de validation émeraude (`#059669`).
   - **Pack d'Actifs Vectoriels & PNG (`frontend-next/public/surga/icons/`)** : 11 SVG officiels (`surga-symbol.svg`, `surga-logo-compact.svg`, `surga-logo-horizontal.svg`, `icon-192.svg`, `icon-512.svg`, `icon-maskable-512.svg`, `favicon.svg`) et PNGs rastérisés par Playwright Chromium (`icon-192.png`, `icon-512.png`, `surga-whatsapp-avatar.png`).
   - **Design System Technique (`docs/surga/DESIGN_SYSTEM_SURGA.md`) & Brand Guidelines (`docs/surga/BRAND_GUIDELINES_SURGA.md`)** : Tokens CSS complets, grilles 512×512, clearspace 0.5X, zéro police externe, zéro émoji.
   - **Intégration Frontend & Visibilité Garantie** : `manifest.json` mis à jour (`theme_color: #0F172A`, `background_color: #F8FAFC`), `layout.tsx` (OpenGraph Surga, favicon SVG), `SurgaHeader.tsx` (symbole SVG officiel, logotype SURGA), `surga.css` (exclusion de `.surga-header` de l'isolation CSS, `display: flex !important;` et logo-wrap squircle 38×38 px, dégradé ambre sur le FAB micro et boutons).
   - **PWA Autonome & Onboarding** : Installation plein écran, onboarding rapide, stockage des préférences (`surga_preferences`).
   - **Briefing Matinal & Revue de Presse** : Ingestion RSS Cheerio/Axios de la presse sénégalaise, Kiosque des Unes avec carrousel horizontal fluide et zoom Lightbox.
   - **Notes & Agenda v2** : Prise de notes catégorisée, rappels programmés et notifications locales par Service Worker.
   - **Sama Xaalis (Gestion Financière Personnelle)** : Portefeuille complet intégré dans la navigation principale (`surga-kalpe.ts`, `SurgaSamaXaalisView.tsx`), cartes de soldes/flux, suivi rigoureux des dettes et créances avec remboursement direct, épargne et cagnottes avec jauges de progression.
   - **Passerelles Transversales Dynamiques & États Actifs Persistants (`surga-cross-actions.ts`, `SurgaToastContainer.tsx`)** :
     - De véritables relations dynamiques bidirectionnelles (Toggle) entre toutes les briques de Surga avec persistance locale offline-first (`surga-offline-sync.ts`) :
       * Sport ➔ Agenda (Rappel de match : bouton actif `Rappelé` orange persistant avec icône `BellCheck`, toggle au clic pour retirer) & Sama Xaalis (Budget match : bouton actif `Budgeté` vert, toggle au clic).
       * Bonnes Adresses ➔ Agenda (`Sortie fixée ✓`), Sama Xaalis (`Dépense notée ✓`) & Notes (`En note ✓`), basculables au clic et synchronisés en temps réel.
       * Concours Nationaux ➔ Notes (`Checklist en Note ✓` avec cases à cocher) & Sama Xaalis (`Quittance notée ✓`).
       * Immobilier ➔ Agenda (`Visite ✓`) & Notes (`En note ✓`).
       * Revue de Presse ➔ Notes (`Épinglé ✓` / `En Note`).
       * Notes ➔ Sama Xaalis (Détection automatique de montants FCFA, inscription/retrait de dépense) & Agenda (Rappel à 10h `Rappelé` actif).
     - Réactivité événementielle globale instantanée : un CustomEvent `surga-data-change` est émis à chaque écriture/suppression dans `surga-offline-sync.ts`, de sorte que la suppression d'un élément dans l'Agenda ou Sama Xaalis repasse instantanément les boutons sources à l'état inactif sans rafraîchir.
     - Toast global non-intrusif réactif avec surélévation automatique si la radio est active.
   - **Sport Temps Réel & Personnalisation Multi-Ligues** : Scores et statuts en direct (badge clignotant `EN_DIRECT`, minute de jeu), sélecteur de ligues (`SurgaSportCustomModal.tsx`) couvrant UEFA Champions League, Premier League, LaLiga, Ligue 1, Serie A, Saudi Pro League, Ligue 1 sénégalaise et les Lions de la Teranga.
   - **Météo & Marées Live avec Sélecteur Multi-Localités, 14 Régions & Résilience Hors-Ligne** :
     - Catalogue national exhaustif de 28 localités couvrant l'intégralité des 14 régions du Sénégal (Dakar, Thiès, Saint-Louis, Diourbel, Louga, Fatick, Kaolack, Kaffrine, Tambacounda, Kédougou, Kolda, Ziguinchor, Sédhiou, Matam).
     - Bibliothèque partagée (`src/lib/surga-meteo.ts`, 198 l.) avec normalisation NFD anti-diacritiques et remplacement des ligatures (`[œŒ]` -> `oe`).
     - Route Handler Next.js autonome (`src/app/api/surga/meteo/route.ts`, 166 l.) assurant la résolution immédiate sans dépendre du déploiement séparé du backend Express.
     - Modale dédiée (`SurgaMeteoLocaliteModal.tsx`, 382 l.) avec fallback catalogue automatique immédiat, recherche insensible aux accents et détection de sélection fiabilisée.
     - Carte Météo modulaire (`SurgaMeteoCard.tsx`, 412 l. et `SurgaMeteoPrevisions.tsx`, 101 l.), bouton d'accès rapide « Changer », synchronisation `onVilleChange` avec les préférences du briefing et fallback hors-ligne gracieux.
     - Algorithme de résolution strict à deux passes dans `meteo-service.js` et détection GPS automatique du quartier le plus proche via `navigator.geolocation`.
   - **Bons Plans & Bonnes Adresses à Dakar (Catalogue 42 Adresses & Seeding PostgreSQL)** :
     - Catalogue certifié complet (`backend/data/surga-places-catalogue.json`, 42 établissements authentiques, 927 l.) couvrant les 5 catégories (Restaurants, Dibiteries, Cafés & Coworking, Bord de Mer, Brunchs & Pâtisseries) et 13 quartiers/villes (Plateau, Almadies, Ngor, Ouakam, Point E, Mermoz, Fann, Mamelles, Yoff, Médina, Liberté, Rufisque, Pikine, Guédiawaye, Saly).
     - Seeding PostgreSQL exécuté (`scripts/seed-surga-data.js`) : 42 adresses synchronisées en base `surga_places` avec téléphones, WhatsApp, budgets FCFA réalistes et résumés honnêtes d'avis clients en 3 lignes.
     - Service backend enrichi avec repli JSON mémoire, calcul exact `COUNT(*) OVER() AS full_count`, normalisation sécurisée des JSONB et `limit=100` par défaut.
     - Modale UI (`SurgaPlacesModal.tsx`, 382 l. <= 450 l.) avec filtres complets par quartier (Rufisque, Pikine, Guédiawaye...) et affichage exhaustif sans troncature.
   - **Commandes WhatsApp & Vocal Web Speech** : Commandes précises (quotas 20/jour, confirmation stricte OUI/NON), reconnaissance vocale bilingue avec normalisation orale déterministe.
   - **Services Quotidiens Locaux** : Trafic Dakar en direct (TomTom Live + corridors clés), pôle immobilier certifié Dakar (< 2 min), concours & examens nationaux (J-30/J-7/J-1).
   - **Audio Low-Data & Radios FM** : Synthèse locale gratuite (0 Mo de data) et radios locales en direct (RTS, Sud FM, etc.).

2. **Console d'Administration Pro Décloisonnée (`/admin/surga` & `/surga/admin` — 100% DONE)** :
   - **Thème « Obsidian Deep Space »** : Identité visuelle SaaS IA d'élite entièrement affranchie de Nopalou (Obsidian `#0B132B`, Surface `#121D33`, Neon Emerald `#10B981`, Cyber Amber `#F59E0B`, Cyan `#06B6D4`).
   - **Décloisonnement Structurel Strict** : Logée sous `frontend-next/src/app/admin/surga/` avec son propre `layout.tsx` (garde RBAC `getAdminSession()`) et sa feuille de styles `surga-admin.css`. Zéro présence de la barre latérale e-commerce Nopalou (Boutiques, Commandes, POS masqués), zéro barre omnisearch marketplace.
   - **Barre Latérale Autonome Organisée en 4 Domaines (`AdminSurgaSidebar.tsx`, 286 l.)** :
     - *Pilotage & Monétisation* : Vue d'Ensemble, Abonnements & MRR, Tarifs & Formules.
     - *Utilisateurs & Diffusion* : Comptes & Rôles, Réseaux & WhatsApp.
     - *Contenus Territoriaux* : Bonnes Adresses, Concours Nationaux, Kiosque des Unes, Modération Trafic.
     - *Audio & Système* : Radios & Podcasts, Configuration & IA.
   - **11 Volets d'Administration Exhaustifs** :
     1. *Tableau de Bord & Supervision* (`AdminOverviewTab.tsx`) : 4 KPIs métiers, état des services (PostgreSQL, Wave, TomTom, IA) et actions rapides.
     2. *Abonnements & MRR* (`AdminAbonnementsTab.tsx`) : Suivi des souscriptions B2C/B2B, calcul déterministe MRR FCFA, validation & résiliation manuelle 1-clic.
     3. *Tarifs & Formules Dynamiques* (`AdminPlansTab.tsx`, 357 l.) : Modification directe des montants FCFA mensuels et annuels, remises, badges et avantages avec répercussion immédiate sur la facturation Wave/Orange Money.
     4. *Comptes & Rôles Utilisateurs* (`AdminComptesTab.tsx`, 391 l.) : Annuaire complet, recherche instantanée (Nom, Tél `+221...`, Email), attribution VIP 1-clic (1, 3, 6, 12 mois) et réinitialisation de quotas vocaux.
     5. *Réseaux Sociaux & WhatsApp* (`AdminReseauxTab.tsx`, 339 l.) : Passerelle Bot WhatsApp (+221 77 845 00 00), test de ping direct, éditeur de modèles automatiques et liens des canaux officiels.
     6. *Bonnes Adresses* (`AdminPlacesTab.tsx` + `AdminPlaceModal.tsx`) : CRUD complet des 42 adresses dakaroises, quartiers, résumés d'avis honnêtes.
     7. *Concours Nationaux* (`AdminConcoursTab.tsx` + `AdminConcoursModal.tsx`) : Calendrier officiel (ENA, Douanes...), quittances Trésor, pièces requises, alertes J-30/J-7/J-1.
     8. *Kiosque des Unes* (`AdminUnesTab.tsx`) : Gestion quotidienne des Unes des 10 quotidiens du Sénégal.
     9. *Modération Trafic* (`AdminTraficTab.tsx`) : Modération temps réel des incidents VDN, Autoroute, Corniche, BRT.
     10. *Radios Locales & Podcasts* (`AdminRadiosTab.tsx`) : Lecteur de test audio des flux en direct et flux RSS privé.
     11. *Configuration Système & IA* (`AdminConfigTab.tsx`) : Persona D19, vouvoiement strict, quotas vocaux et état des clés API.
   - **Redirection Automatique** : Route `frontend-next/src/app/surga/admin/page.tsx` redirigeant immédiatement vers `/admin/surga`.

3. **Monétisation & RGPD (100% DONE)** :
   - Table `surga_abonnements`, facturation Wave & Orange Money (Surga Premium 1 500 FCFA/mois ou 15 000 FCFA/an ; formules B2B).
   - Portabilité des données (export JSON complet) et droit à l'oubli définitif en cascade (`backend/services/surga/donnees-service.js`).

4. **Détachement Visuel Total & Support du Sous-Domaine (`surga.nopalou.com` — 100% DONE)** :
   - **Omission SSR stricte** : dans `frontend-next/src/app/layout.tsx`, quand `isSurga === true`, aucun composant Nopalou (navbar, footer, panier, chatbot, bottom nav) n'est injecté dans le DOM.
   - **Isolation CSS étanche** : règle `body:has(.surga-root) header[role="banner"], .site-footer, ... { display: none !important; }` dans `frontend-next/src/styles/surga.css`.
   - **Sous-domaine transparent** : détection de l'hôte `surga.*` dans `frontend-next/src/middleware.ts` avec réécriture transparente (`NextResponse.rewrite`) de `/` vers `/surga`.
   - **Permissions & Sécurité En-têtes** : `Permissions-Policy: geolocation=(self)` débloquant la géolocalisation native, et conditionnement de `Content-Security-Policy-Report-Only` en production uniquement pour assainir la console dev.

---

## 2. 📁 Cartographie des Fichiers Clés

### Frontend Next.js (`frontend-next/`)
| Rôle | Emplacement |
|---|---|
| Page principale Surga | `src/app/surga/page.tsx` (411 l. < 450 l.) |
| Layout & Manifest PWA | `src/app/surga/layout.tsx`, `public/surga/manifest.json` |
| Logo Officiel & Actifs PWA | `public/surga/surga-symbol.png`, `public/surga/icon-*.png`, `public/surga/icons/` |
| Styles & Isolation CSS | `src/styles/surga.css` |
| Routage & Sous-domaine | `src/middleware.ts`, `src/app/[slug]/route.ts`, `src/app/layout.tsx` |
| Passerelles Transversales & Toasts | `src/lib/surga-cross-actions.ts` (368 l.), `src/app/surga/components/SurgaToastContainer.tsx` (65 l.) |
| Navigation & En-tête | `src/app/surga/components/SurgaHeader.tsx`, `SurgaBottomNav.tsx` |
| Sama Xaalis (Finances) | `src/app/surga/components/SurgaSamaXaalisView.tsx`, `src/lib/surga-kalpe.ts` |
| Emploi, Profil Pro & CV PDF | `src/app/surga/components/SurgaEmploiModal.tsx` (387 l.), `SurgaProfilProTab.tsx` (360 l.), `SurgaCvTab.tsx` (260 l.), `SurgaLettreTab.tsx` (274 l.) |
| Alertes Vidéos (Séries & Lutte) | `src/app/surga/components/SurgaVideosModal.tsx` (393 l.), `SurgaVideoCard.tsx` (96 l.) |
| Météo & Marées Live | `src/app/surga/components/SurgaMeteoCard.tsx` (412 l.), `SurgaMeteoLocaliteModal.tsx` (382 l.), `SurgaMeteoPrevisions.tsx` (101 l.), `src/lib/surga-meteo.ts` (198 l.), `src/app/api/surga/meteo/route.ts` (166 l.) |
| Sport Live & Customisation | `src/app/surga/components/SurgaSportCard.tsx`, `SurgaSportCustomModal.tsx` |
| Revue de Presse & Kiosque | `src/app/surga/components/SurgaPresseCard.tsx` (carrousel horizontal) |
| Bons plans & Adresses | `src/app/surga/components/SurgaPlaceCard.tsx` (354 l.), `SurgaPlaceDetailModal.tsx` (393 l.), `SurgaPlacesModal.tsx` (382 l.), `backend/data/surga-places-catalogue.json` (927 l., 42 adresses) |
| Briques & Vues Surga | `src/app/surga/components/Surga*.tsx` (tous < 450 l.) |
| Console d'Administration Pro | `src/app/admin/surga/page.tsx`, `AdminSurgaClient.tsx`, `AdminSurgaSidebar.tsx`, 12 sous-composants `Admin*Tab.tsx` dont `AdminVideosTab.tsx` (375 l.) et `AdminVideoSourceModal.tsx` (175 l.) |
| Synchronisation & Hors-ligne | `src/lib/surga-offline-sync.ts`, `src/lib/surga-reminders.ts`, `src/lib/surga-voice.ts` |

### Backend Express (`backend/`)
| Rôle | Emplacement |
|---|---|
| Routeur maître Surga | `routes/surga/index.js` (monté sur `/api/surga`) |
| Sous-routeurs REST | `routes/surga/` (`briefing.js`, `preferences.js`, `notes.js`, `depenses.js`, `agenda.js`, `presse.js`, `kiosque.js`, `audio.js`, `podcast.js`, `radios.js`, `trafic.js`, `immo.js`, `concours.js`, `places.js`, `abonnements.js`, `donnees.js`, `meteo.js`, `videos.js`, `emploi.js`) |
| Routeur Administration Pro | `routes/admin-surga.js` (`/plans`, `/utilisateurs`, `/canaux`, `/abonnements`, `/videos/sources`, etc.) |
| Services Métier Surga | `services/surga/` (`emploi-service.js`, `video-service.js`, `abonnement-service.js`, `meteo-service.js`, `calculator.js`, `whatsapp-handler.js`, `trafic-service.js`, `immo-service.js`, `concours-service.js`, `places-service.js`, `donnees-service.js`) |
| Synchronisation Cron | `services/cron-surga-rss.js` (cycle 30 min Presse & Vidéos Atom) |
| Migrations SQL Idempotentes | `migrate-inline.js` (tables `surga_*` dont `surga_profil_pro`, `surga_documents_emploi`, `surga_usages`, `surga_video_sources`, `surga_video_items`, `surga_video_abonnements`) |

---

## 3. 🚀 Commandes pour Lancer et Tester en Local

### 1. Démarrer le Backend Express (Port 3000)
```powershell
# À la racine du projet
$env:PORT="3000"
node backend/app.js
```
*Le serveur affiche `✅ Nopalou → http://localhost:3000` et applique automatiquement les migrations `surga_*`.*

### 2. Démarrer le Frontend Next.js (Port 3001)
```powershell
# Dans le dossier frontend-next
cd frontend-next
npm run dev
```
*L'application est disponible sur `http://localhost:3001`.*

### 3. URLs de Test Directes
- **Surga (Application Web 100% Autonome)** : [http://localhost:3001/surga](http://localhost:3001/surga)
- **Console d'Administration Surga** : [http://localhost:3001/admin/surga](http://localhost:3001/admin/surga)
- **API Briefing Backend** : [http://localhost:3000/api/surga/briefing](http://localhost:3000/api/surga/briefing)
- **API Emploi & Profil Pro** : [http://localhost:3000/api/surga/emploi/profil](http://localhost:3000/api/surga/emploi/profil)
- **API Météo & Localités** : [http://localhost:3000/api/surga/meteo?ville=Dakar+Plateau](http://localhost:3000/api/surga/meteo?ville=Dakar+Plateau)
- **API Bonnes Adresses & Bons Plans** : [http://localhost:3000/api/surga/places](http://localhost:3000/api/surga/places)
- **API Alertes Vidéos (Séries & Lutte)** : [http://localhost:3000/api/surga/videos/sources](http://localhost:3000/api/surga/videos/sources)
- **Simulation Sous-Domaine (`surga.localhost`)** : [http://surga.localhost:3001/](http://surga.localhost:3001/) *(si `127.0.0.1 surga.localhost` est renseigné dans `hosts`)*

---

## 4. 🧪 Commandes de Validation & Tests

Toutes les suites de tests sont actuellement au vert à 100% :
```powershell
# 1. Tests Jest Surga (Backend) : 113/113 passés (100%)
npx jest tests/unit/surga.test.js

# 2. Tests Unitaires Frontend / Vitest CSP : 97/97 passés (100%)
cd frontend-next
npm test

# 3. Compilation TypeScript stricte : 0 erreur
cd frontend-next
npx tsc --noEmit

# 4. Linter Anti-AI-Slop & Standard Ingénieur Senior : 0 violation
cd frontend-next
npm run lint:slop
```

---

## 5. 🚢 Déploiement en Production (Quand l'Utilisateur le Demandera)

Conformément à la règle absolue : **Aucun push automatique sans ordre explicite de l'utilisateur.**

### Procédure de Déploiement :
1. **Fusionner et Pousser sur GitHub** :
   ```bash
   git checkout main
   git merge feature/surga
   git -c http.extraheader="AUTHORIZATION: bearer $env:GITHUB_TOKEN" push origin main
   ```
2. **Configuration DNS (chez Cloudflare / OVH / etc.)** :
   - Ajouter un enregistrement `CNAME` : `surga` pointant vers la cible du frontend (ex: `nopalou-frontend.onrender.com`).
3. **Configuration Render** :
   - Dans le service frontend sur Render : Ajouter le Custom Domain `surga.nopalou.com`.
   - Variable d'environnement optionnelle : `TOMTOM_API_KEY` pour les vitesses réelles de Dakar.

---

## 6. 🔮 Pistes pour les Prochaines Sessions (Évolutions Futures)

Si l'utilisateur souhaite aller plus loin dans une nouvelle session :
1. **Extension Wolof pour la Voix & l'Audio** :
   - Intégrer un modèle de transcription ou de synthèse vocale en langue Wolof pour les chiffres et annonces locales.
2. **Canal Telegram Complémentaire** :
   - Réutiliser le `whatsapp-handler.js` pour créer un bot Telegram Surga miroir à destination des utilisateurs de la diaspora.
3. **Application Mobile Dédiée (TWA / Capacitor / React Native)** :
   - Créer un wrapper APK / Android Bundle pour publication sur le Google Play Store sénégalais si besoin.
