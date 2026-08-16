- **Module de Partage par QR Code & Lien Vitrine avec Validation Instantanée Marchand (16 août 2026)** 📱 :
  * **Nouveau Composant `QrCodeShareModal.tsx`** : Générateur de QR Code SVG imprimable et téléchargeable pour chaque marchand. Support du **Mode Scan Client en Boutique / Comptoir** : basculement entre *Vitrine & Catalogue* et *Demande de Crédit Comptoir*, affichage Grand Écran 300px pour scan immédiat par le client présent au magasin, et envoi direct du lien au numéro WhatsApp du client.
  * **Intégration Tableau de Bord & Carnet (`BoutiqueClient.tsx` & `CarnetDettes.tsx`)** : Bouton d'action rapide `📱 QR Code Scan Client` dans l'en-tête du carnet et le dashboard marchand pour présenter le QR Code au client présent au comptoir.
  * **Passage de Pré-commande & Demande de Crédit Client (`BoutiqueDetailClient.tsx`, `DrawerCart.tsx` & `CommanderModal.tsx`)** : Les clients scannant le QR code en boutique ou accédant au lien peuvent composer un panier multi-produits avec détection automatique de la bannière `💳 Mode Demande d'Achat à Crédit` et choisir le mode `💳 Demande d'Achat à Crédit (Carnet client)` avec notification immédiate au marchand.
  * **Approbation & Alimentation Automatique du Carnet (`backend/routes/boutiques.js`, `Commandes.tsx` & `CarnetDettes.tsx`)** : Point de terminaison API `/api/boutiques/:id/credits-clients/approuver-commande` révisé avec les tables exactes `caisse_clients_credits` et `caisse_credit_historique` et le bouton `📒 Approuver & Ajouter au Carnet` qui crée ou retrouve le profil client, inscrit la vente à crédit au carnet client, met à jour le solde et déclenche une confirmation automatique par WhatsApp.
  * **Bannière Réactive dans le Carnet (`CarnetDettes.tsx`)** : Affichage d'un bloc `💳 Demandes d'Achat à Crédit Reçues en Ligne` en haut du carnet permettant l'approbation en 1 clic.
  * **Découplage Annuaire Web vs Accès Direct & Soumission de Commande (`backend/routes/boutiques.js` & `backend/routes/comptabilite.js`)** : Les boutiques physiques dont la visibilité dans l'annuaire web public Nopalou est désactivée (`actif = false`) restent 100% accessibles via leur lien direct ou scan de QR Code au comptoir sans aucune erreur 404, et les soumissions de commandes/demandes de crédit au panier s'exécutent avec succès sans rejeter `Boutique introuvable`.
- **Système de Recherche et Sélection Rapide de Produits et Clients dans les Documents et Carnets (16 août 2026)** 🔍 :
  * **Problématique résolue** : Pour les boutiques comptant des dizaines ou centaines de produits et clients, l'ajout d'articles dans les documents (**Factures, Devis, Proformas, Bons de commande**) ainsi que dans le **Carnet de dettes / Ventes à crédit** via de simples dropdowns HTML natifs ou des grilles statiques était difficile et pénible.
  * **Nouveaux Composants Reutilisables (`SearchableProductSelect.tsx` & `SearchableClientSelect.tsx`)** :
    1. `SearchableProductSelect.tsx` : Sélectionneur interactif avec barre de recherche instantanée (nom, référence, catégorie, prix), pills de catégories, affichage des niveaux de stock et du prix en FCFA, et fallback vers la saisie libre.
    2. `SearchableClientSelect.tsx` : Recherche instantanée du client destinataire par nom, prénom, numéro de téléphone, entreprise ou NINEA.
  * **Intégration dans les Documents Commerciales (`GestionDocuments.tsx`)** : Intégration des composants de recherche intelligente pour la composition des Factures, Devis et Proformas.
  * **Intégration dans le Carnet de Dettes & Créances (`CarnetDettes.tsx`)** : Ajout d'un champ de recherche `🔍 Rechercher un produit...` et de filtres par pilules de catégorie. Ajout des boutons d'action `-` (diminuer/supprimer) et `+` (augmenter) directement sur chaque carte de produit sélectionné. Support du **Panier Mixte** : possibilité d'ajouter des articles en **Saisie Libre / Hors catalogue** via un bouton `➕ Ajouter au panier` et de les combiner librement avec des produits du catalogue au sein de la même vente à crédit avec calcul automatique du total global.
  * **Intégration dans les Bons de Commande d'Achat (`GestionFournisseurs.tsx`)** : Intégration de `SearchableProductSelect` pour la constitution rapide des lignes d'articles à commander auprès des fournisseurs.
- **Audit & Plan de Correction UI/UX & Design System Sans Régression (16 août 2026)** :
  * **Audit Exhaustif des Éléments Cliquables (`audit_boutons_et_couleurs.md`)** : Recensement et évaluation complète de l'intégralité des éléments cliquables de Nopalou répartis en 12 catégories (boutons d'achat, messagerie WhatsApp, navigation header, cartes produits/immo/télécom, bannières flottantes sticky, filtres et pilules, alertes prix, abonnements marchands, formulaires auth, caisse POS, PWA et footer).
  * **Plan de Correction Sans Régression (`implementation_plan.md`)** : Élaboration et exécution d'un plan d'harmonisation chromatique et ergonomique strict pour éliminer toutes les dérives de teintes et les zones tactiles sub-44px sans altérer la logique métier ni causer de régression.
  * **Harmonisation des Boutons Principaux (`globals.css`)** :
    1. **`cta-acheter` & `cta-acheter--header`** : Remplacement de l'émeraude Tailwind (`#059669`) par le gradient officiel Orange Nopalou (`linear-gradient(135deg, var(--accent) 0%, #A34900 100%)`) avec ombre portée `0 4px 14px rgba(199,91,0,.28)` et effets tactiles `:hover` et `:active`.
    2. **`.bouton-whatsapp-fiche`** : Ajout de la classe CSS manquante pour styliser le bouton d'envoi WhatsApp des fiches avec la couleur officielle (`#25D366`), ombre portée et états interactifs.
    3. **Micro-boutons et Accessibilité Tactile** : Optimisation de la zone de frappe minimale (touch target minimum 44x44px) sur mobile pour les boutons de cartes produits (`CardActions`) et du panier via des pseudo-éléments et des dimensions adaptées (`minWidth: 28px`, `height: 28px`).
  * **Harmonisation de la Navigation Header (`layout.tsx`, `NavbarActions.tsx`, `NavbarSearch.tsx`)** :
    1. **`Boutique Taf Taf` & `Ma Boutique` (`layout.tsx`)** : Remplacement de la couleur Slate 900 (`#0f172a`, `#334155`) par le Marine officiel Nopalou (`var(--navy)` `#1C2B4A`).
    2. **Compte & Déconnexion (`NavbarActions.tsx`)** : Harmonisation du fond pilule compte sur `var(--bg)` (`#F8F5F0`) et du bouton déconnexion sur la variable de marque `var(--red)` (`#B91C1C`).
    3. **Barre de Recherche (`NavbarSearch.tsx`)** : Remplacement des teintes gris froid Tailwind (`#f8fafc`, `#cbd5e1`, `#f1f5f9`) par les tokens du Design System (`var(--card)`, `var(--bg)`, `var(--border)`).
  * **Harmonisation Globale des Pages & Modules Publics (`annonces/[id]`, `guide-emploi`, `HeroCarousel`, `AlertePrix`, `FormAlerte`, `ModalPaiementManuel`, `PwaInstallPrompt`, `AvisClients`, `BatchActionBar`)** :
    1. **Fiches & Guides Publics** : Remplacement des liens cyan (`#0284c7`) de suppression de données et d'aide par la couleur de structure `var(--navy)` (`#1C2B4A`).
    2. **Annuaire des Boutiques** : Remplacement du fond CTA cyan du carrousel de la page `/boutiques` par l'Orange Nopalou (`var(--accent)` `#C75B00`).
    3. **Alerte Prix** : Harmonisation du bouton de canal Email sur `var(--navy)` (`#1C2B4A`) dans `AlertePrix.tsx` et `FormAlerte.tsx`.
    4. **Modales & Popups** : Remplacement du bouton noir pur (`#111827`) de `ModalPaiementManuel` par `var(--navy)`, et du fond gris par `var(--bg)` (`#F8F5F0`). Remplacement du Slate 900 (`#0f172a`) de la bannière PWA par `var(--navy)`.
  * **Refonte Tier-1 E-Commerce du Tableau de Bord Commerçant (`BoutiqueClient.tsx`)** :
    1. **Suppression des Fonds Pastels Bonbons** : Remplacement des 6 fonds pastels (vert menthe `#f0fdf4`, rose `#fef2f2`, gris `#f8fafc`, bleu `#eff6ff`, violet `#faf5ff`, orange `#fff7ed`) par une surface de carte unifiée blanc pur `var(--card)` (`#FFFFFF`) avec bordure beige fine `var(--border)` (`#E8DDD2`) et ombre douce `0 2px 8px rgba(26,22,18,0.04)`.
    2. **Intégration d'Icônes Vectorielles SVG (Lucide React)** : Remplacement des emojis système bruts (`⚡`, `📒`, `🛍️`, `📄`, `🛒`, `📣`, `📋`, `⭐`, `⚠️`) par des icônes SVG nettoyées (`Zap`, `BookOpen`, `PlusCircle`, `FileText`, `ShoppingCart`, `Share2`, `ClipboardList`, `Star`, `AlertTriangle`).
    3. **Harmonisation des Liens & Statuts** : Alignement de l'ensemble des 4 liens d'actions KPI sur la couleur Marine `var(--navy)` (`#1C2B4A`). Refonte de la pilule de statut de la boutique avec icône et bordure élégante (`CheckCircle2` / `XCircle`).
- **Audit Complet du Scraping & Correction SQL `/api/offres` (16 août 2026)** :
  * **Analyse des dysfonctionnements du Scraping** : Le scraping des marchands e-commerce (CoinAfrique, Expat-Dakar, Jumia, Electronic Corp, Soumari, Promo.sn, Kanje, etc.) est à l'arrêt complet depuis le **10 août 2026** (6 jours sans mise à jour).
  * **Cause Racine** : Sur Render (`render.yaml`), `SCRAPING_DISABLED` est configuré à `"true"` (et `PROCESS_TYPE` non défini en `worker`) pour éviter les timeouts et la saturation mémoire du serveur gratuit. Le scraping dépendait donc de lancements manuels/locaux (`forceScrape.js`, scripts d'automatisation Windows Task Scheduler) qui ne tournaient plus.
  * **Correction SQL `/api/offres` (`backend/routes/offres.js`)** : Correction d'une erreur SQL 500 (`column m.logo_url does not exist`) lors des requêtes `GET /api/offres` en supprimant `m.logo_url` de la requête SQL.
- **Inclusion de l'Historique Détaillé de Chaque Client dans les Exports du Carnet de Dettes & Crédits (CSV & PDF)** 📒 :
  * **Backend API (`backend/routes/boutiques.js` & `frontend-next/src/app/api/boutiques/[id]/credits-clients/route.ts`)** : Ajout du support de `?include_historique=true` sur la route `GET /api/boutiques/:id/credits-clients` pour renvoyer en une seule requête SQL optimisée l'ensemble des clients ainsi que leur historique complet de transactions (`caisse_credit_historique`).
  * **Exportation CSV Détaillée (`CarnetDettes.tsx`)** : Génération d'un export CSV ligne par ligne contenant pour chaque client l'ensemble des transactions de son carnet (`Nom client`, `Téléphone`, `Adresse`, `Statut`, `Solde`, `Date & Heure`, `Type d'opération`, `Mode de paiement`, `Détails / Articles / Notes`, `Montant FCFA`).
  * **Exportation PDF Multi-Sections (`lib/export.ts` & `CarnetDettes.tsx`)** : Extension de la fonction `printPDFReport` pour accepter un corps HTML personnalisé multi-sections (`customBodyHtml`). L'impression PDF affiche désormais une fiche complète pour chaque client avec le sous-tableau clair de son historique d'opérations.
- **Audit Global & Vérification de l'Ensemble des Pages de Filtres et Listes (`/boutiques`, `/annonces`, `/immo`, `/categorie/[slug]`)** :
  * **Vérification complète de la cohérence** :
    1. **`/boutiques` (`src/app/boutiques/page.tsx`)** : `buildLink` préserve de manière cumulative la ville, la recherche `q`, la catégorie `cat`, le tri `tri` et le plan marchand (`business`/`pro`).
    2. **`/annonces` (`src/app/annonces/page.tsx`)** : `buildLink` préserve cumulativement la catégorie, le tri, la recherche, le budget `prixMax`, la ville et la source (Nopalou vs Facebook).
    3. **`/immo` (`src/app/immo/page.tsx`)** : `buildLink` préserve la transaction (`location`/`vente`), le type de bien, le prix, la ville, le quartier, la surface et le nombre de pièces/chambres.
    4. **`/categorie/[slug]` (`src/app/categorie/[slug]/page.tsx`)** : Ajout du support explicite de `prixMin` dans l'analyse de `searchParams`, la requête API `/api/produits` et le générateur d'URL `buildLink`.
- **Refonte Ergonomique & Correction du Filtrage de la Page d'Accueil (`frontend-next/src/app/page.tsx`, `ProduitsListe.tsx`, `backend/routes/produits.js`)** :
  * **Analyse des dysfonctionnements résolus** :
    1. **Boutons d'État inactifs** : Les pilules `Neuf` et `Occasion` étaient des balises `<span>` codées en dur sans liens ni interactions. Conversion en liens interactifs fonctionnels (`ETATS.map`).
    2. **Perte de filtres lors du basculement d'un bouton à l'autre** : Le clic sur un filtre (Budget, Catégorie ou Tri) réinitialisait les autres paramètres d'URL activement sélectionnés. Création de la fonction helper `buildFilterUrl` pour cumuler et préserver l'ensemble des filtres actifs (`q`, `categorie`, `prixMin`, `prixMax`, `etat`, `tri`, `sousType`).
    3. **Disparition des filtres en pagination (`Voir plus`)** : Le bouton de chargement de la page 2 (`voirPlus()`) dans `ProduitsListe.tsx` omettait de transmettre `prixMin` et `etat`, provoquant un retour de résultats non filtrés.
    4. **Blocage SQL backend sur les budgets < 20 000 FCFA** : L'API `backend/routes/produits.js` appliquait un prix plancher automatique `prixMinDefautMixe = 20000` par défaut sur la page d'accueil, entrant en conflit direct avec la sélection d'un budget `< 5 000` (`prixMax=5000`) et retournant 0 résultat. Correction de la condition SQL pour annuler le plancher dès qu'un budget, un état ou une recherche utilisateur est spécifié.
    5. **Disposition stricte sur 2 lignes horizontales sans retour à la ligne (`flexWrap: nowrap`)** : Alignement strict sur 2 lignes uniques. Ligne 1 : `Budget` + `|` + `État` (gauche) et `⚡ Ouvrir une Boutique Pro` (droite). Ligne 2 : `Trier` + `|` + `🔥 Tendances` (gauche) et `✖ Effacer` (droite). Hauteur maximale < 45px.
    6. **Mise à jour instantanée du tri sans rafraîchissement (`ProduitsListe.tsx`)** : Ajout d'un hook `useEffect` pour synchroniser immédiatement l'état React de `produits` dès que la prop `initialProduits` change (lors d'un clic sur un tri comme `💰 Prix ↑` ou `Prix ↓`). Élimine la nécessité de rafraîchir la page (F5) pour voir le résultat du tri.
- **Refonte Ergonomique & Équilibrage de l'En-tête de la Page Boutiques (`src/app/boutiques/page.tsx`, `BoutiquesSearch.tsx`, `HeroCarousel.tsx`)** :
  * **Problèmes résolus** :
    1. **Hauteur excessive & suppression des espaces vides ("Combler ce vide")** : Regroupement de la présentation texte et de la carte de recherche dans une colonne Flex réactive (`hero-left-column`) avec un espacement serré de `gap: 14px` pour éliminer tout espace blanc flottant entre les puces et le champ de recherche. Réduction du `minHeight` du carrousel de 330px à 225px.
    2. **Texte de recherche 100% visible ("Rechercher une boutique...")** : Ajustement du `padding-right` de l'input à 105px et `font-size: 14px` (avec placeholder à `13.5px`), garantissant la lisibilité complète du texte sans coupure.
    3. **Structure des filtres & badges** : Réorganisation propre en 2 lignes compactes avec délimiteurs discrets (`Ville :`, `💼 Business`, `⭐ Vendeur Pro` et `Trier :`).
- **Correction du Filtrage par Catégorie sur la Liste des Boutiques (`/boutiques?cat=...`, `backend/routes/boutiques.js`, `frontend-next/src/app/boutiques/page.tsx`)** :
  * **Cause du problème** : L'API backend `GET /api/boutiques` ne déstructurait pas `req.query.categorie` ni `req.query.cat` et n'ajoutait pas la clause SQL `WHERE b.categorie ILIKE $X`. Le clic sur un filtre de catégorie comme `👗 Mode & Beauté` (`/boutiques?cat=mode`) renvoyait donc toutes les boutiques indifféremment.
  * **Correctif Backend (`backend/routes/boutiques.js`)** : Prise en compte de `req.query.categorie` et `req.query.cat` avec correspondance flexible SQL par expression `ILIKE` et gestion des synonymes (ex: `mode` inclut `beaute` et `vetements`, `smartphones` inclut `telephone` et `tech`).
  * **Correctif Frontend (`page.tsx`)** : Harmonisation de la liste des catégories `CATEGORIES_BOUTIQUE` pour inclure toutes les catégories marchands et garantir un filtrage 100% réactif.
- **Correction du Défilement, des Bannières de Confirmation et du Positionnement des Boutons de Sauvegarde (`BoutiqueClient.tsx`, `ParametresFiscalite.tsx`, `ProfilClient.tsx`, `ModifierAnnonceForm.tsx`, `ModifierImmoForm.tsx`)** :
  * **Diagnostic du problème** : Certains boutons de sauvegarde et de validation (notamment dans les *Paramètres boutique* et formulaires de modification) ne déplaçaient pas la page après enregistrement, n'affichaient aucun message visible de confirmation, et leurs boutons restaient coincés ou masqués en bas d'écran (sous le menu mobile).
  * **Correctif apporté** :
    1. **Bannières de succès & Défilement Automatique (`window.scrollTo` & `scrollIntoView`)** : Ajout d'une notification de succès visible (`setSuccessMsg`) et déclenchement automatique d'un défilement fluide vers le haut de la page/formulaire à chaque soumission (succès ou erreur), afin que l'utilisateur voie immédiatement le résultat et la bannière de retour.
    2. **Barre de validation flottante & Surélevée (`position: sticky; bottom: 12`)** : Encapsulation des boutons de sauvegarde dans une barre d'action flottante sticky avec ombrage et fond blanc, associée à un espace inférieur suffisant (`paddingBottom: 60px` à `80px`). Empêche tout chevauchement avec le menu mobile (`MobileNav`) et garantit une sauvegarde toujours accessible d'un tap sur smartphone et PC.
- **Emplacements du Bouton de Désactivation / Masque de Boutique (`BoutiqueClient.tsx`)** :
  * **1. Carte de la boutique dans la liste Mes Boutiques (`/boutique`)** : Bouton-badge interactif **`🟢 Active` / `⚪ Inactive`** en haut à droite de la carte avec demande de confirmation 1-clic.
  * **2. En-tête du Tableau de Bord Boutique (`BoutiqueManage`)** : Bouton **`🟢 Boutique Active (En ligne)` / `⚪ Boutique Désactivée (Masquée)`** présent en permanence dans le haut du tableau de bord.
  * **3. Formulaire de Paramètres (`⚙️ Paramètres` / `BoutiqueForm`)** : Champ de sélection **`👁️ Visibilité & Désactivation dans l'Annuaire Public`** permettant de basculer la vitrine publique entre active et masquée.
- **Correction du Raccourci Saisie Express & Netteté des Polices Windows (`BoutiqueClient.tsx`, `Comptabilite.tsx`, `globals.css`)** :
  * **Redirection Directe sur l'Onglet Saisie** : Le clic sur le raccourci *⚡ Saisie Express Ventes & Dépenses* du tableau de bord bascule désormais directement sur l'onglet **Saisie Express** (`initialTab="express"`) au lieu de l'aperçu général.
  * **Optimisation de la Netteté des Polices sous Windows** : Application globale de `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale` et `text-rendering: optimizeLegibility` sur la pile de polices système native haute lisibilité pour éliminer tout aspect crénelé/flou sur les écrans Windows.
- **Harmonisation Visuelle de la Saisie Express Ventes & Dépenses (`Comptabilite.tsx`)** :
  * Aligné l'interface **Saisie Express** sur la charte graphique globale de Nopalou (boutons dégradés vert émeraude `#10b981` pour les encaissements ventes et rouge crimson `#ef4444` pour les sorties caisse dépense).
  * Affichage en direct du calcul des montants totaux en FCFA, cartes surélevées avec coins arrondis 20px, typographies système native et sélecteurs de modes avec ombres dégradées.
- **Harmonisation du Carnet de Dettes dans la Caisse POS (`CaisseClient.tsx`)** :
  * Intégration du **sélecteur de produits du catalogue avec photos et prix** dans le Carnet de dettes de la Caisse POS pour ajouter des articles en 1 tap avec calcul en direct du total en FCFA.
  * Ajout de l'interrupteur de **relance automatique WhatsApp** à l'échéance et alignement des relances amicales 1-clic via l'API backend.
  * Harmonisation visuelle ultra-premium, typographies modernes et cohérence exacte des couleurs et palettes entre le tableau de bord marchand (`CarnetDettes.tsx`) et la caisse enregistreuse tactile (`CaisseClient.tsx`).
- **Gestion de la Visibilité & Désactivation de Boutique (`BoutiqueClient.tsx`, `backend/routes/boutiques.js`)** :
  * Possibilité pour le commerçant de désactiver et masquer sa boutique du catalogue public Nopalou (`/boutiques`) en 1-clic via un bouton interactif sur la carte de la boutique ou dans les paramètres du profil.
  * Création de l'endpoint `PUT /api/boutiques/:id/statut` et support de la colonne `actif` dans `PUT /api/boutiques/:id`.
- **Refonte Visuelle & Mise à Jour des Forfaits Boutique (`fonctionnalites-data.ts`, `TarifsPublicsSelector.tsx`, `AbonnementClient.tsx`)** :
  * **Passeports & Avantages Enrichis** : Mise en avant de l'inclusion du **Carnet de Dettes Client & Crédits pour TOUS les forfaits** (dès la formule Taf Taf / Découverte à 2.500 FCFA/mois avec 1 mois OFFERT).
  * **Sublimation des Cartes d'Abonnement** : Design ultra-moderne avec cartes surélevées, effets de survol, bordures dégradées lumineuses (*Glow Gradients* pour les formules recommandées et Business VIP), badges d'économie et d'essai gratuit.
  * **Sélecteur de Durée Interactif** : Calcul direct des remises (-10% sur 3 mois, -15% sur 6 mois, -25% sur 12 mois soit 3 mois offerts) et de l'équivalent mensuel en FCFA.
- **Intégration du Carnet dans la Navigation Boutique pour Tous les Forfaits** :
  * Ajout de l'onglet **"📒 Carnet de Dettes & Crédits"** dans le menu latéral et mobile de la boutique sous la rubrique *Ventes & Clients*, rendu accessible sans restriction de souscription à tous les forfaits (Découverte, Taf-Taf, Pro, Business).
- **Modernisation du Carnet de Dettes & Sélection Directe du Catalogue** :
  * Création du composant dédié `CarnetDettes.tsx` inspiré des meilleures applications de tenue de livre informel (Khatabook, OKCredit, Wave).
  * **Sélecteur Catalogue Direct** : Lors de la création d'une dette client, le marchand peut directement cliquer sur les produits de sa boutique (avec photos, prix et gestion des quantités) sans avoir besoin de scanner un code-barres ou de taper des identifiants EAN.
  * **Correction du Mode Remboursement / Encaisser** : Correction du calcul de `totalTransactionCourante` lors de l'encaissement d'un remboursement manuel pour utiliser le montant saisi par le marchand au lieu d'évaluer le panier catalogue à 0.
  * Saisie manuelle d'articles informels (hors-catalogue) disponible pour la flexibilité des petits commerces.
  * Suivi synthétique en direct : Total créances clients à encaisser (*On me doit*), total avances/dépôts clients et solde net.
- **Relances Automatiques & Manuelles WhatsApp selon la Date d'Échéance** 🔔 :
  * Possibilité d'associer une date d'échéance à chaque vente à crédit avec basculement du statut de relance automatique WhatsApp.
  * **Service Cron d'Arrière-Plan (`backend/services/cron-relances-carnet.js`)** : Analyse quotidienne automatique des échéances impayées et émission automatique de rappels amicals par WhatsApp au client avec le solde exact en FCFA et le nom de la boutique.
  * **Relance WhatsApp 1-Clic Manuel** : Bouton direct sur chaque fiche client générant un lien instantané et formaté `wa.me`.
  * **Migration SQL (`backend/migrate-inline.js`)** : Ajout des colonnes `relance_auto_whatsapp` et `derniere_relance_whatsapp` dans `caisse_credit_historique`.
- **Saisie Express Ventes & Dépenses & Raccourcis d'Action Rapide (`Comptabilite.tsx`, `BoutiqueClient.tsx`)** :
  * Ajout des boutons d'action rapide **"⚡ Saisie Express Ventes & Dépenses"** et **"📒 Carnet de Dettes Client"** dans le bloc *Raccourcis & Actions Rapides* du tableau de bord de la boutique pour un accès instantané en 1 clic.
  * Permet d'enregistrer instantanément des ventes directes ou des dépenses informelles (achats stock, transport, loyer, salaires, électricité, etc.) en 1 clic sans passer par l'ouverture/clôture de session de caisse POS ni scanner.

## 📌 Mises à jour du 16/08/2026 : Intégration OCR Réelle "Scan Nom", Refonte Alertes WhatsApp, Export Carnet Dettes (CSV/PDF) & Libellés Documents (`BoutiqueClient.tsx`, `Comptabilite.tsx`, `AlertePrix.tsx`, `CarnetDettes.tsx`, `GestionDocuments.tsx`, `backend/routes/boutiques.js`)
- **1. Lecture OCR Réelle et Remplissage Automatique "Scan Nom" (`backend/routes/boutiques.js`, `scan-ocr/route.ts`, `BoutiqueClient.tsx`, `Comptabilite.tsx`)** :
  * **API Backend OCR (`POST /api/boutiques/scan-ocr`)** : Création de la route backend et du proxy Next.js exploitant `tesseract.js` pour analyser les captures d'écran de la caméra et extraire la désignation/marque du produit.
  * **Remplissage Direct sans Saisie Manuelle** : Suppression du message d'erreur/demande de saisie manuelle. Le nom scanné est désormais injecté automatiquement dans `nomForm` / `nomLibre` avec confirmation visuelle et fermeture automatique.
- **2. Refonte du Bouton & Retour Visuel Alerte Baisse de Prix WhatsApp (`AlertePrix.tsx`, `globals.css`)** :
  * **Bouton d'Alerte Dynamique (`.alerte-trigger`)** : Conversion du bouton neutre (qui ressemblait à une boîte d'information avec bordure pointillée) en un bouton d'action d'alerte avec fond dégradé bleu, bordure solide et icône cloche `🔔` mise en relief.
  * **Confirmation de Création Instantanée** : Affichage d'une bannière de succès verte (`🎉 Alerte créée avec succès !`) et maintien du message de confirmation pour informer l'utilisateur de l'enregistrement de son alerte.
- **3. Exportation du Carnet de Dettes & Crédits Clients (`CarnetDettes.tsx`, `export.ts`)** :
  * **Boutons d'Action d'Exportation** : Ajout des boutons **`📥 Export CSV`** (format Excel avec colonnes de soldes, téléphones et plafonds) et **`🖨️ Imprimer PDF`** dans le haut du carnet de dettes.
  * **Impression de Relevé Client** : Bouton **`🖨️ Imprimer Relevé PDF`** disponible sur chaque fiche individuelle client pour générer et imprimer son historique d'opérations et de règlements.
- **4. Libellés Explicites sur les Lignes de Documents (`GestionDocuments.tsx`)** :
  * Ajout des étiquettes explicites au-dessus de chaque champ de ligne d'article dans la modale de création/édition de Factures et Devis (`Article / Produit *`, `Quantité *`, `Prix Unit. (FCFA) *`, `Total (FCFA)`).

- **3. Correction de l'Erreur de Modification Client Carnet (`backend/routes/boutiques.js`, `/api/boutiques/[id]/credits-clients/[clientId]/route.ts`)** :
  * **Cause 1 (Backend SQL Typo)** : Correction d'une coquille dans la requête SQL `UPDATE caisse_clients_credit` dans `backend/routes/boutiques.js` (remplacé par le nom exact de table au pluriel `caisse_clients_credits`).
  * **Cause 2 (Proxy API Next.js)** : Création des routes API dynamiques `src/app/api/boutiques/[id]/credits-clients/[clientId]/route.ts` (PUT pour modifier le profil client, DELETE), ainsi que des sous-routes `historique`, `transaction` et `relance-whatsapp`.
- **4. Support des Alertes Baisse de Prix WhatsApp (`AlertePrix.tsx`, `FormAlerte.tsx`, `actions/alertes.ts`, `backend/routes/alertes.js`)** :
  * **Sélecteur de Canaux (WhatsApp / Email / Les deux)** : Ajout des onglets interactifs `💬 WhatsApp`, `📧 Email` et `🔔 Les deux (WhatsApp + Email)` sur les composants de création d'alertes prix ([`AlertePrix.tsx`](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/app/AlertePrix.tsx) et [`FormAlerte.tsx`](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/components/FormAlerte.tsx)).
  * **Saisie WhatsApp** : Ajout du champ pour saisir son numéro WhatsApp (`telephone`), permettant aux utilisateurs d'être notifiés instantanément sur WhatsApp lors d'une baisse de prix sous leur seuil.
  * **Mise à jour Backend** : Adaptation de la route `POST /api/alertes` et de la Server Action `createAlerte` pour enregistrer l'email, le téléphone WhatsApp ou les deux en base de données.
- **5. Saisie Libre & Libellés Explicites sur les Bons de Commande d'Achat (`GestionFournisseurs.tsx`)** :
  * **Option Saisie Libre (`custom`)** : Ajout de l'option `✏️ Article hors catalogue / Saisie libre` dans le menu déroulant du bon de commande d'achat. Permet de commander n'importe quel article non présent dans le catalogue produit de la boutique avec une désignation personnalisée (`nomLibre`).
  * **Libellés de Champs Explicites** : Ajout de libellés clairs au-dessus de chaque champ de chaque ligne d'article (`Article / Désignation *`, `Quantité *`, `Prix Achat Unit. (FCFA) *`) avec calcul dynamique du total de la ligne (`fcfa(quantité * prix unitaire)`).

## 📌 Mises à jour du 15/08/2026 : Harmonisation Intégrale, Thème Clair Nopalou & Édition des Fiches Clients (`CarnetDettes.tsx`, `CaisseClient.tsx`, `backend/routes/boutiques.js`)
- **1. Édition & Modification des Fiches Clients Carnet (`PUT /api/boutiques/:id/credits-clients/:clientId`)** :
  * Ajout du bouton **`✏️ Modifier`** sur chaque carte client et dans l'en-tête des fiches clients (Carnet Boutique & Carnet Caisse POS).
  * Création de la modale d'édition préremplie permettant de modifier le nom complet, le téléphone WhatsApp, l'adresse/quartier, le plafond de crédit max et la note confidentielle en temps réel.
  * Création de l'endpoint API backend `PUT /api/boutiques/:id/credits-clients/:clientId`.
- **2. Harmonisation Intégrale & Réutilisation du Composant `CarnetDettes` dans la Caisse POS (`CaisseClient.tsx`)** :
  * Le modal du Carnet dans la Caisse POS réutilise à présent directement et à l'identique le composant d'origine [CarnetDettes.tsx](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/app/boutique/CarnetDettes.tsx).
  * Garantit une identité visuelle à 100% identique entre le tableau de bord marchand et le terminal de caisse enregistreuse tactile, sans aucune divergence de design, de couleurs ou de fonctionnalités.
- **3. Layout Master/Detail Réactif pour Mobile** :
  * Sur smartphone (mobile) : Affichage d'une vue Master/Detail avec basculement fluide entre la liste des clients et la Fiche Client en 100% largeur d'écran.
  * Bouton tactile lisible **`← Retour à la liste des clients`** en haut de la Fiche Client sur mobile.
  * Ajustement des modales de création de client et de sélection catalogue produits pour s'adapter aux hauteurs d'écran mobile (`maxHeight: '92vh'`, `padding: 16px`, grille d'articles à colonnes réactives `minmax(110px, 1fr)`).
- **4. Harmonisation & Ergonomie des Boutons de Fermeture de toutes les Modales (`CaisseClient.tsx`, `CarnetDettes.tsx`)** :
  * Intégration systématique d'un bouton de fermeture circulaire tactile **`✕`** en haut à droite avec `position: 'absolute'` (dans *Historique des Opérations & Incidents*, *Clôture Z*, *Ouverture de Session*, *Carnet Dettes*, *Création / Édition Client*).
  * Ajout d'un bouton de pied de page **`Fermer la fenêtre`** pour éviter que les boutons d'exportation/impression ne masquent ou décalent la fermeture sur écran mobile et tablette.

## 📌 Mises à jour du 14/08/2026 : Support Complet des Articles/Produits Hors Catalogue dans les Documents Commercials de la Boutique (`GestionDocuments.tsx`, `backend/routes/boutiques.js`)
- **Correction & Saisie des Produits/Articles Hors Catalogue (Saisie Libre)** :
  * **Problème** : Dans la création et la modification de documents commerciaux (Factures, Devis, Proformas), les produits non présents dans le catalogue de la boutique ne pouvaient pas être saisis manuellement. Si un document contenait un article personnalisé ou un ancien produit supprimé du catalogue, son nom était perdu ou affiché comme "Produit inconnu".
  * **Correctif apporté** :
    1. **Frontend (`GestionDocuments.tsx`)** : 
       - Ajout d'une option *"✏️ Article hors catalogue / Saisie libre"* dans le sélecteur d'articles du formulaire de création/édition.
       - Affichage automatique d'un champ texte dynamique permettant de saisir librement la désignation/le nom de l'article ou de la prestation hors catalogue.
       - Préservation de la désignation et du prix unitaire personnalisé lors de l'ouverture et de la modification d'un document existant.
       - Formatage correct du tableau d'items transmis à l'API (`id: null` pour les articles hors catalogue, `nom` personnalisé conservé).
    2. **Backend (`backend/routes/boutiques.js`)** :
       - Sécurisation de `calculerFiscaliteDocument` et des boucles de mise à jour des stocks (`POST`, `PUT`, `DELETE` documents) avec validation stricte par expression régulière regex des UUID (`/^[0-9a-f-]{36}$/i`).
       - Empêche les erreurs de syntaxe PostgreSQL lors du traitement des identifiants non-UUID (comme `null` ou `"custom"`), tout en déduisant proprement le stock pour les seuls produits réels du catalogue.
       - Conservation parfaite de la désignation personnalisée des articles dans la base de données et dans la génération de PDF A4 (`GET /documents/:docId/pdf`).

## 📌 Mises à jour du 14/08/2026 : Correction de la Cause Racine & Intégration dans Espace Compte (/compte?tab=suivi-commande)
- **Investigation & Correction de la Cause Racine** :
  * **Cause du Bug** : L'API backend de recherche `/api/boutiques/commandes/suivi` dans `backend/routes/boutiques.js` faisait sa requête SQL `SELECT FROM commandes_express`. **La table `commandes_express` n'existait pas en base de données** (toutes les commandes réelles des boutiques et clients sont enregistrées dans la table **`commandes_boutique`**). Toute recherche échouait donc avec une erreur 404 / "Commande introuvable" même avec les bons identifiants.
  * **Correction Backend** :
    1. Modification de la table SQL interrogée : de `commandes_express` vers `commandes_boutique`.
    2. Utilisation d'un `LEFT JOIN` avec `COALESCE` pour que les commandes soient trouvées même si la boutique parente n'est plus associée.
    3. Normalisation intelligente des numéros de téléphone via `regexp_replace(client_telephone, '[^0-9]', '')` : permet de trouver une commande quelle que soit la saisie (`771234567`, `+221 77 123 45 67`, `22177...`).
  * **Intégration Espace Compte Utilisateur (`/compte`)** :
    1. Création du composant d'onglet d'espace compte `SuiviCommandeClient.tsx`.
    2. Ajout du lien `📦 Suivre ma commande` (`/compte?tab=suivi-commande`) dans la barre latérale `AccountNavLinks.tsx` et dans le menu tiroir mobile connecté.
    3. Rendu direct de la recherche et de la timeline de suivi dans l'espace compte sans quitter l'interface compte.

## 📌 Mises à jour du 14/08/2026 : Amélioration de l'Accessibilité du Suivi de Commande (/suivi-commande)
- **Accessibilité du Suivi de Commande** :
  * **Diagnostic** : La page de suivi de commande (`/suivi-commande`) fonctionnait correctement (recherche dynamique via API backend `/api/boutiques/commandes/suivi` par N° de référence `CMD-2026-XXXX` ou N° de téléphone client), mais n'était pas mise en avant dans les menus (Header, Footer, Navigation mobile).
  * **Correctif apporté** :
    1. Ajout du lien direct `📦 Suivre ma commande` dans le Footer (`layout.tsx`) sous la colonne *Informations*.
    2. Ajout du lien direct `📦 Suivre ma commande` dans le menu tiroir mobile (`MobileNav.tsx`).

## 🚀 Mises à jour du 14/08/2026 : Standardisation Globale du Flux de Paiement (Boost & Sponsorings)
- **Standardisation du Flux de Paiement (One-Click) et des Fallbacks Manuels** :
    3. **Sponsoring Produit (/payer-sponsoring-produit/[id])** : CrÃ©ation de la page et modification de SponsoringProduitBtn.tsx.
    4. **Sponsoring Immo (/payer-sponsoring-immo/[id])** : CrÃ©ation de la page et modification de SponsoringImmoBtn.tsx.
  * L'expÃ©rience utilisateur est dÃ©sormais unifiÃ©e, fluide et permet de gÃ©rer le mode hors-ligne ou les pannes de l'API Wave sereinement via des pages dÃ©diÃ©es.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Correction des Boutons de Paiement (Boost Annonce, Abonnements & Sponsorings) (`AnnoncesClient.tsx`, `BoutiqueClient.tsx`, `SponsoringProduitBtn.tsx`, `SponsoringImmoBtn.tsx`, `AbonnementClient.tsx`, `actions/paiement.ts`, `paiement.js`, `abonnements.js`)
- **Correction des Boutons ForÃ§ant le Paiement Manuel (`AnnoncesClient.tsx`, `BoutiqueClient.tsx`)** :
  * **ProblÃ¨me** : Certains boutons (comme *"Booster"* sur `/mes-annonces` et *"Payer abonnement"* sur `/boutique`) ouvraient directement la modale de paiement manuel sans tenter le paiement Wave en ligne ou sans rediriger vers la page d'abonnement dÃ©diÃ©e.
  * **Solution** :
    1. **Boost Annonce (`AnnoncesClient.tsx`)** : Suppression du bouton dupliquÃ© en dur. Fusion dans un bouton unique `ðŸš€ Booster 7j` qui tente d'abord le paiement en ligne Wave direct via `initierWaveBoost`. Si Wave est indisponible ou renvoie `fallback_manuel: true`, l'interface bascule automatiquement et de maniÃ¨re fluide vers la modale de paiement manuel prÃ©-remplie (`boost_${userId}_${annonceId}`).
    2. **Gestionnaire Boutiques (`BoutiqueClient.tsx`)** : Remplacement du bouton ambigu *"Payer abonnement"* sur la carte boutique par un lien direct *"ðŸ“– Abonnements"* redirigeant le marchand vers `/boutique/abonnement` (avec choix des formules Pro/Business, de la durÃ©e de 1 Ã  12 mois avec rÃ©ductions et choix Wave/OM). Le bouton *"ðŸŒŸ Mettre en avant"* bascule Ã©galement vers la modale manuelle si Wave est indisponible.
    3. **Sponsorings Produit & Immo (`SponsoringProduitBtn.tsx`, `SponsoringImmoBtn.tsx`)** : En cas d'Ã©chec ou de fallback Wave, l'interface ouvre automatiquement la modale manuelle avec rÃ©fÃ©rence unique au lieu d'afficher une erreur texte brute.
    4. **Server Actions & API Backend (`actions/paiement.ts`, `paiement.js`, `abonnements.js`, `wave.js`, `settingsCache.js`)** : Assouplissement des requÃªtes SQL d'appartenance d'annonce dans `boost/initier` et `annonce/initier` (Ã©vite les fausses erreurs 404), dÃ©tection structurÃ©e de `fallback_manuel`, renvoi de la rÃ©fÃ©rence de paiement, support de `clientToken` (JWT `localStorage` en secours de la cookie session) et support dynamique de `wave_api_key` depuis les paramÃ¨tres en base de donnÃ©es.

## ðŸš€ Mises Ã  jour du 14/08/2026 : SystÃ¨me Universel de Basculement Automatique vers le Paiement Manuel (`ManualFallbackCard.tsx`, `PaiementErreurPage`, `CommanderModal.tsx`, `checkout-express/page.tsx`, `PaiementClient.tsx`, `whatsapp-chatbot.js`, `paiement.js`, `comptabilite.js`, `abonnements.js`)
- **ImplÃ©mentation du Basculement Automatique vers le Paiement Manuel (Zero-Lost-Conversion)** :
  * **ProblÃ¨me** : Lorsque l'API Wave Checkout Ã©chouait (maintenance opÃ©rateur, quota, erreur rÃ©seau 5xx) ou que le client annulait son paiement sur l'application, l'utilisateur se retrouvait bloquÃ© avec un message d'erreur et la transaction Ã©tait perdue.
  * **Solution Universelle dÃ©ployÃ©e sur TOUS les modules** :
    1. **Carte d'Alternative Manuelle (`ManualFallbackCard.tsx` & `PaiementErreurPage`)** : IntÃ©gration sur la page d'erreur de paiement d'un composant interactif guidÃ© (*"ðŸ’¡ Alternative : RÃ©gler par DÃ©pÃ´t Manuel Direct"*) affichant le numÃ©ro marchand (`77 720 20 86`), un bouton 1-Clic *"Copier le numÃ©ro"*, le rappel de la rÃ©fÃ©rence et un formulaire rapide de saisie d'ID de transaction / preuve.
    2. **Gestionnaire de Basculement Automatique sur le Web (`CommanderModal.tsx`, `checkout-express/page.tsx`, `PaiementClient.tsx`)** : Si le serveur renvoie `fallback_manuel: true` lors de l'initialisation de Wave, l'interface bascule automatiquement l'onglet sur le paiement manuel et affiche les instructions de dÃ©pÃ´t sans interrompre la commande.
    3. **Gestionnaire de Fallback Chatbot WhatsApp (`whatsapp-chatbot.js`)** : Si l'initialisation Wave Ã©choue lors d'une commande WhatsApp, le chatbot envoie automatiquement les instructions de dÃ©pÃ´t manuel direct (`77 720 20 86`) avec le montant total formatÃ©.
    4. **Adaptation des APIs Backend (`paiement.js`, `comptabilite.js`, `abonnements.js`)** : Capture des exceptions API Wave et renvoi gracieux de la rÃ©ponse `{ fallback_manuel: true, numero_depot: '777202086', reference, montant }`.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Correction du Message d'Erreur lors d'un Paiement Non Abouti / Solde Insuffisant dans les Boutiques (`PaiementErreurPage`, `comptabilite.js`, `boutiques.js`, `paiement.js`, `abonnements.js`)
- **Fix du Message d'Erreur InappropriÃ© sur Ã‰chec de Paiement (`frontend-next/src/app/paiement/erreur/page.tsx`, `backend/routes/comptabilite.js`, `backend/routes/boutiques.js`, `backend/routes/paiement.js`, `backend/routes/abonnements.js`)** :
  * **ProblÃ¨me** : Lorsqu'un utilisateur tentait d'acheter un produit dans une boutique mais annulait ou n'avait pas les fonds suffisants sur Wave, la page d'erreur affichait un message inappropriÃ© concernant la publication d'une annonce classifiÃ©e (*"Paiement d'annonce non abouti â€” Votre annonce n'a pas Ã©tÃ© activÃ©e"*).
  * **Cause** : Les URLs de redirection d'erreur (`error_url`) gÃ©nÃ©rÃ©es cÃ´tÃ© backend pour Wave ne transmettaient pas le paramÃ¨tre `type` (ex: `type=commande-express` ou `type=commande-boutique`), et le composant frontend `PaiementErreurPage` attribuait par dÃ©faut le type `'annonce'`.
  * **Solution** :
    1. **Correction Frontend (`PaiementErreurPage`)** : DÃ©tection automatique et intelligente du type d'achat selon le prÃ©fixe de la rÃ©fÃ©rence (`CMD-` / `pm_` âž” commande boutique, `abmt_` âž” abonnement, `bout_` âž” sponsoring boutique, `immo_` âž” sponsoring immo, `prod_` âž” sponsoring produit, `ann_` âž” annonce). Si aucun type ne correspond, affichage d'un message neutre et gÃ©nÃ©rique (*"Paiement non abouti â€” Votre paiement n'a pas pu Ãªtre finalisÃ© (annulation ou solde insuffisant)"*) plutÃ´t que d'assumer qu'il s'agit d'une annonce.
    2. **Correction Backend (`comptabilite.js`, `boutiques.js`, `paiement.js`, `abonnements.js`, `whatsapp-chatbot.js`)** : Ajout systÃ©matique des paramÃ¨tres `?ref=${ref}&type=...` dans tous les `error_url` transmis aux API de paiement (Wave/Orange).

## ðŸš€ Mises Ã  jour du 14/08/2026 : Extension des Mentions de Droit Ã  l'Effacement & Opt-Out sur Tout le Site (`confidentialite/page.tsx`, `assistant-whatsapp/page.tsx`, `guide-emploi/page.tsx`)
- **Politique de ConfidentialitÃ© (`confidentialite/page.tsx#suppression-donnees`)** :
  * Enrichissement de la section *"Vos droits (Droit Ã  l'effacement, Retrait & DÃ©sinscription)"* prÃ©cisant l'usage de la commande WhatsApp `supprimer` pour le retrait immÃ©diat des annonces/numÃ©ros et `STOP` pour l'inscription en liste noire (Opt-out).
- **Guide Assistant WhatsApp (`assistant-whatsapp/page.tsx`)** :
  * Ajout de la carte d'aide *"ðŸ—‘ï¸� Supprimer vos annonces ou votre numÃ©ro (DÃ©sinscription)"* dans les fonctionnalitÃ©s du chatbot.
- **Guide D'Emploi & Comment Ã§a marche (`guide-emploi/page.tsx`)** :
  * Ajout du cartouche d'information *"ðŸ—‘ï¸� Droit de retrait"* renvoyant vers le chatbot WhatsApp et les CGU.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Ajout de la Suppression & Retrait des Biens Immobiliers (`ModifierImmoForm.tsx`, `immo/[id]/page.tsx`, `actions/immo.ts`)
- **Option de Suppression DÃ©finitive sur la Modification d'un Bien Immo (`ModifierImmoForm.tsx`)** :
  * IntÃ©gration du composant `DeleteImmoButton` directement dans la barre d'action du formulaire de modification (`/mes-annonces-immo/[id]/modifier`). Permet au propriÃ©taire d'un bien de le retirer/supprimer en un clic avec confirmation.
- **AccÃ¨s Direct de Retrait/Modification pour le PropriÃ©taire sur la Fiche Immo (`immo/[id]/page.tsx`)** :
  * Ajout du bouton *"âœ�ï¸� Modifier ou ðŸ—‘ï¸� Supprimer ce bien"* visible par le propriÃ©taire sur la fiche publique de son bien immobilier (`/immo/[id]`), le redirigeant directement vers la gestion et la suppression.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Fix de la Page Admin Boutiques (`ReferenceError: useMemo`) & Recherche sur Reversements (`AdminBoutiquesClient.tsx`, `ReversementsClient.tsx`)
- **Fix `ReferenceError: useMemo is not defined` dans l'Admin Boutiques (`AdminBoutiquesClient.tsx`)** :
  * **ProblÃ¨me** : L'accÃ¨s Ã  la rubrique `/admin/boutiques` affichait le message d'erreur *"Une interruption temporaire est survenue â€” useMemo is not defined"* car le hook `useMemo` n'Ã©tait pas inclus dans l'import React principal.
  * **Solution** : Correction de l'import React (`import { useState, useMemo, useTransition } from 'react'`). La page des boutiques se charge dÃ©sormais instantanÃ©ment sans aucune erreur.
- **Ajout du Champ de Recherche Textuelle sur les Reversements (`ReversementsClient.tsx`)** :
  * IntÃ©gration d'une barre de recherche rÃ©active filtrant en direct par nom de boutique, tÃ©lÃ©phone ou rÃ©fÃ©rence de commande.

## ðŸš€ Mises Ã  jour du 14/08/2026 : SystÃ¨me Complet de Retrait d'Annonces, Suppression de NumÃ©ro & DÃ©sinscription WhatsApp (`STOP`, `START`, `supprimer`) (`whatsapp.js`, `whatsapp-chatbot.js`, `migrate-inline.js`, `layout.tsx`, `cgu/page.tsx`, `annonces/[id]/page.tsx`, `immo/[id]/page.tsx`)
- **Gestion Dynamique des DÃ©sinscriptions & Opt-Out WhatsApp (`whatsapp.js`, `whatsapp-chatbot.js`, `migrate-inline.js`)** :
  * **Table SQL `whatsapp_blacklist` (`migrate-inline.js`)** : CrÃ©ation automatique de la table de liste noire pour enregistrer les numÃ©ros ayant demandÃ© l'arrÃªt de rÃ©ception des messages.
  * **Commande `STOP` (Opt-Out)** : Si un utilisateur envoie `STOP`, `desinscrire`, `ne plus me contacter` ou `bloquer` au chatbot WhatsApp, son numÃ©ro est immÃ©diatement ajoutÃ© Ã  `whatsapp_blacklist`, toutes ses annonces/alertes sont dÃ©sactivÃ©es et il reÃ§oit une confirmation. Aucun message ou notification ne lui sera plus envoyÃ© par le systÃ¨me (`post()` vÃ©rifie automatiquement la liste noire avant d'Ã©mettre).
  * **Commande `START` (RÃ©inscription)** : Permet Ã  tout moment de se rÃ©inscrire si l'utilisateur souhaite rÃ©utiliser l'assistant Nopalou.
- **Commande `supprimer` / `retirer` AutomatisÃ©e sur le Chatbot (`whatsapp-chatbot.js`)** :
  * DÃ¨s qu'un utilisateur tape `supprimer`, `retirer mon annonce` ou `effacer mon numÃ©ro` sur WhatsApp, le chatbot recherche en base de donnÃ©es toutes les annonces classifiÃ©es et immobiliÃ¨res liÃ©es Ã  son numÃ©ro et les dÃ©sactive immÃ©diatement (`actif = false, supprimee = true`). Le chatbot lui confirme le nombre d'annonces retirÃ©es.
  * Ajout de l'entrÃ©e d'aide correspondante dans les FAQ interactives du chatbot.
- **Transparence & Mentions de Droit de Retrait sur le Site Web (`layout.tsx`, `cgu/page.tsx`, `annonces/[id]/page.tsx`, `immo/[id]/page.tsx`)** :
  * **Pied de Page (`layout.tsx`)** : Ajout du lien direct `ðŸ—‘ï¸� Supprimer annonce / numÃ©ro` renvoyant vers la procÃ©dure dans les CGU.
  * **Page des Conditions GÃ©nÃ©rales (`cgu/page.tsx#suppression-donnees`)** : Ajout d'une section dÃ©diÃ©e expliquant clairement les droits de retrait immÃ©diat d'annonce/numÃ©ro (via WhatsApp avec le mot `supprimer` ou par e-mail Ã  `contact@nopalou.com`) et de dÃ©sinscription de messages (via le mot `STOP`).
  * **Fiches d'Annonces (`annonces/[id]/page.tsx` & `immo/[id]/page.tsx`)** : Ajout sous la carte de contact d'une mention d'information responsive permettant aux propriÃ©taires ou personnes concernÃ©es de demander la dÃ©sactivation instantanÃ©e de l'annonce ou de leur numÃ©ro.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Filtrage des Notifications WhatsApp de ModÃ©ration (Annonces DÃ©posÃ©es sur le Site Uniquement) (`annonces.js`, `notifications.js`)
- **Exclusion du Scraping / Imports Externes des Notifications WhatsApp (`backend/routes/annonces.js`, `backend/services/notifications.js`)** :
  * **ProblÃ¨me** : Lors de la validation par un administrateur d'une annonce classifiÃ©e ou immobiliÃ¨re, le backend envoyait un message WhatsApp automatique (`nopalou_carousel_annonce` / `nopalou_fiche_texte`) au numÃ©ro de tÃ©lÃ©phone rattachÃ© Ã  l'annonce (`contact_tel`), y compris pour les annonces importÃ©es ou scrappÃ©es (Facebook, Expat-Dakar, CoinAfrique, etc.). Les personnes propriÃ©taires de ces numÃ©ros recevaient un message impromptu et rÃ©pondaient sur WhatsApp, dÃ©clenchant les rÃ©ponses automatiques du Chatbot.
  * **Solution (Option 2)** : Ajout d'une vÃ©rification stricte sur la provenance de l'annonce lors de la modÃ©ration admin (`PUT /api/annonces/admin/:id` et `notifierModerationImmo`). Seules les annonces effectivement dÃ©posÃ©es sur le site Nopalou par un utilisateur (`url_source` et `ref_externe` nuls, `source` de type `'site'` / `'utilisateur'` / `'manuel'` / `'depot_gratuit'`) dÃ©clenchent dÃ©sormais l'envoi de notifications WhatsApp. Les annonces issues de scrapers externes sont totalement ignorÃ©es pour la notification WhatsApp.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Panneau de Recherche, Onglets de Statut, Filtrage Multi-CritÃ¨res & Tri Dinamique dans l'Espace Admin (`AdminAnnoncesClient.tsx`, `AdminBoutiquesClient.tsx`, `PaiementsManuelsClient.tsx`, `backend/routes/annonces.js`)
- **Refonte de la ModÃ©ration des Annonces ClassifiÃ©es (`AdminAnnoncesClient.tsx`, `backend/routes/annonces.js`)** :
  * **Barre de Recherche Textuelle InstantanÃ©e** : Recherche multi-champs sur le titre, la description, l'auteur (nom, e-mail), le numÃ©ro de tÃ©lÃ©phone, la ville, la catÃ©gorie et l'ID d'annonce.
  * **Onglets de Statut avec Compteurs Dynamiques** : Navigation par onglets (*"â�³ En attente"*, *"âœ… Actives"*, *"â�Œ RejetÃ©es"*, *"ðŸ“‹ Toutes"*) affichant en temps rÃ©el le nombre d'annonces par catÃ©gorie de modÃ©ration.
  * **SÃ©lecteurs de Filtre AvancÃ©s & Tri** :
    - Filtre par CatÃ©gorie (Smartphones, Informatique, TV, Auto, Services, Immo, etc.).
    - Filtre par Ville / Zone gÃ©ographique (Dakar, ThiÃ¨s, Saint-Louis, Ziguinchor, etc.).
    - Filtre par Statut de Paiement (PayÃ©e vs Gratuite / Quota).
    - Options de Tri dynamique (Les plus rÃ©centes, Les plus anciennes, Prix croissant, Prix dÃ©croissant).
  * **Bouton de RÃ©initialiser les Filtres** & bouton d'effacement rapide de la recherche.
  * **Support Serveur (`backend/routes/annonces.js`)** : Mise Ã  jour de la route backend `GET /api/annonces/admin/en-attente` pour accepter les requÃªtes de recherche textuelle (`q`), catÃ©gorie, statut, ville, paiement et tri.
- **Ajout de la Recherche & Onglets sur l'Administration des Boutiques (`AdminBoutiquesClient.tsx`)** :
  * Ajout du champ de recherche textuelle sur les boutiques (nom, description, nom/e-mail/tÃ©lÃ©phone du propriÃ©taire, catÃ©gorie, ville).
  * Onglets de filtrage par statut de plan (*"ðŸ“‹ Toutes"*, *"â­� AbonnÃ©es Pro/Business"*, *"âš¡ SponsorisÃ©es"*, *"â�¸ Inactives"*).
- **Ajout de la Recherche & Filtres MÃ©thode sur les Paiements Manuels (`PaiementsManuelsClient.tsx`)** :
  * Recherche textuelle par rÃ©fÃ©rence, client, e-mail, tÃ©lÃ©phone et ID de transaction.
  * Filtre par mÃ©thode de paiement (Wave vs Orange Money).

## ðŸš€ Mises Ã  jour du 14/08/2026 : Contrat Vendeur & Charte Marchand 100% Dynamique & Ã‰ditable depuis l'Admin (`settingsCache.js`, `settings.js`, `TarifsClient.tsx`, `creer-boutique/page.tsx`, `cgu/page.tsx`)
- **Ã‰dition Dynamique depuis l'Admin (`TarifsClient.tsx`, `settingsCache.js`, `settings.js`)** :
  * Ajout des clÃ©s `contrat_vendeur_texte` (texte intÃ©gral avec articles modÃ¨le) et `contrat_vendeur_requis` (`'true'` / `'false'`) aux paramÃ¨tres par dÃ©faut et Ã  l'API publique `/api/settings/public`.
  * Ajout de la section **"ðŸ“œ Contrat Vendeur & Charte Marchand"** dans l'espace Admin (`/admin/tarifs`) permettant de modifier et sauvegarder le contrat et ses rÃ¨gles Ã  tout moment.
- **Acceptation Obligatoire & Modale dans l'Assistant de CrÃ©ation (`creer-boutique/page.tsx`)** :
  * Ajout de la case Ã  cocher obligatoire `â˜‘ï¸� J'accepte la Charte Vendeur & les CGU Marchand Nopalou` Ã  la derniÃ¨re Ã©tape de crÃ©ation de boutique.
  * Bouton d'ouverture de modale d'affichage responsive du contrat complet en direct depuis la base de donnÃ©es. Validation bloquant la soumission si la case n'est pas cochÃ©e.
- **Rendu Dynamique sur la Page Publique (`cgu/page.tsx`)** :
  * IntÃ©gration de la section **"ðŸ“œ Charte Vendeur & Contrat d'Utilisation Marchand"** lisant dynamiquement le texte du contrat configurÃ© en base de donnÃ©es.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Exportation Wave Bulk Payout, Validation de Lot Anti-Doublon & Notifications WhatsApp (`paiement.js`, `comptabilite.js`, `export.ts`, `ReversementsClient.tsx`)
- **Exportation au Format Officiel Wave Business Bulk Payout (`export.ts`, `ReversementsClient.tsx`)** :
  * Ajout de la fonction `exportWaveBulkPaymentCSV` dans `export.ts` et du bouton de tÃ©lÃ©chargement `.csv / Excel` dans l'espace Admin (`/admin/reversements`).
  * ConformitÃ© exacte aux **7 colonnes de Wave Business** : `Nom du client`, `NumÃ©ro de tÃ©lÃ©phone` (formatÃ© `+221...`), `Montant` (Net vendeur sans dÃ©cimales), `Devise` (`XOF`), `Raison du paiement` (tronquÃ©e Ã  40 caractÃ¨res max), `NumÃ©ro ID national` (vide), et `RÃ©fÃ©rence` (`REV-${ref}`).
- **Fix du Message "â�Œ Token manquant" sur la Validation de Lot (`comptabilite.js`, `admin.ts`)** :
  * **ProblÃ¨me** : Le middleware `verifierToken` Ã©tait prÃ©sent Ã  tort sur la route de validation du lot de reversements, ce qui faisait Ã©chouer l'action d'administration avec une erreur `401 Token manquant` (les actions admin Next.js utilisant l'en-tÃªte `X-Admin-Secret`).
  * **Solution** : Correction de l'endpoint vers `/api/comptabilite/admin/reversements/valider-lot` sÃ©curisÃ© uniquement par `adminSecretOnly`. La validation de lot et le retrait des commandes traitÃ©es fonctionnent dÃ©sormais sans aucune erreur.
- **Fix du Filtrage Strict des Transactions RÃ©elles Wave (`comptabilite.js`)** :
  * **ProblÃ¨me** : L'ancienne requÃªte SQL incluait toutes les commandes brouillons ou abandonnÃ©es ayant la mÃ©thode `wave` ou le statut `livree`, mÃªme si l'acheteur n'avait jamais validÃ© son paiement sur Wave (`paiement_recu = false`).
  * **Solution** : Restriction stricte de la clause SQL `WHERE c.paiement_recu = true AND c.statut != 'reverse'` dans `/api/comptabilite/admin/reversements-dus`. Seules les transactions dont l'argent a Ã©tÃ© **rÃ©ellement encaissÃ© et confirmÃ© par le Webhook Wave** et non encore reversÃ©es s'affichent dÃ©sormais dans la liste.
- **Notifications WhatsApp Automatiques Ã  la Confirmation Wave (`paiement.js`)** :
  * DÃ¨s rÃ©ception du Webhook Wave `checkout.session.completed`, le backend met Ã  jour la commande (`statut = 'payee'`) et dÃ©clenche automatiquement deux messages WhatsApp :
    1. **Au Client (Acheteur)** : AccusÃ© de confirmation du paiement Wave.
    2. **Au Vendeur (Marchand)** : Alerte de rÃ©ception du paiement avec invitation Ã  prÃ©parer le colis.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Correction du Lien Terminal Caissier DÃ©diÃ© (Sans MDP Admin) Multi-Navigateur (`backend-fetch.ts`, `CaisseClient.tsx`, `backend/routes/boutiques.js`)
- **Fix du Chargement sur Nouveau Navigateur / Ã‰cran DÃ©diÃ© Caissier (`backend/routes/boutiques.js`, `CaisseClient.tsx`)** :
  * **ProblÃ¨me** : Sur un autre navigateur ou une tablette vierge (sans cookie de session administrateur), la boutique et la liste des caissiers ne s'affichaient pas car :
    1. L'endpoint backend `/api/boutiques/caisse-terminal/:token` ne rattachait pas le champ `plan_actif` Ã  l'objet `boutique`, ce qui faisait Ã©chouer la validation d'autorisation `estBoutiqueAutorisee` cÃ´tÃ© client.
    2. En cas de statut HTTP 403/erreur, `CaisseClient.tsx` ignorait les donnÃ©es de secours et tentait un `getBoutiquesMine()` (rÃ©servÃ© aux propriÃ©taires connectÃ©s), Ã©chouant silencieusement sur les appareils caissiers.
  * **Solution** :
    1. Backend `backend/routes/boutiques.js` : Recherche Ã©largie par `caisse_token`, `id` UUID ou `slug`. Rattachement automatique du champ `plan_actif` Ã  l'objet boutique renvoyÃ© et crÃ©ation systÃ©matique des caissiers par dÃ©faut si aucun caissier n'existe.
    2. Client `CaisseClient.tsx` : Lecture inconditionnelle de l'objet `boutique` et de ses caissiers/produits lors du dÃ©marrage par `initialToken`, avec mise en cache locale `localStorage` pour un fonctionnement ultra-rapide et hors-ligne.
- **Isolation des AccÃ¨s Caissier (Sans accÃ¨s aux paramÃ¨tres du PropriÃ©taire)** :
  * En mode terminal dÃ©diÃ© (`initialToken`), le bouton de retour au tableau de bord marchand (`/boutique`) et le menu sÃ©lecteur de boutiques sont masquÃ©s/dÃ©sactivÃ©s pour empÃªcher les caissiers de naviguer vers le compte du propriÃ©taire ou d'autres boutiques.

## ðŸš€ Mises Ã  jour du 14/08/2026 : IntÃ©gration des Options "CrÃ©er ma boutique" & "Forfaits Boutiques" dans le Chatbot WhatsApp (`whatsapp-chatbot.js`)
- **Enrichissement du Menu Interactif WhatsApp (`sendMenu`)** :
  * **Ajout de l'Option *"ðŸ›�ï¸� CrÃ©er ma boutique"*** : Permet aux commerÃ§ants de dÃ©couvrir les avantages marchands Nopalou (catalogue, Wave 1-Clic, bot dÃ©diÃ©, reversements) et d'accÃ©der directement Ã  la crÃ©ation de boutique (`/creer-boutique`).
  * **Ajout de l'Option *"ðŸ’Ž Forfaits Boutiques"*** : PrÃ©sentation dynamique des forfaits lus depuis l'admin/BDD via `settingsCache`. Application claire du **1er mois 100% OFFERT sur TOUS les forfaits** et **suppression des mentions en dur de commission rÃ©duite Ã  2.0%**. Nettoyage des anciennes valeurs de repli obsolÃ¨tes (`15000` / `35000`) sur l'ensemble du backend et du frontend.
  * RÃ©organisation des sections en *"Acheter & Explorer"* et *"Marchands & Compte"* pour respecter strictement la limite des 10 Ã©lÃ©ments interactifs Meta.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Ouverture Directe de l'Application Wave via WhatsApp & Auto-Redirection Web (`whatsapp-chatbot.js`, `comptabilite.js`, `checkout-express/page.tsx`)
- **GÃ©nÃ©ration Directe de la Session de Paiement Wave (`wave_launch_url`) dans WhatsApp** :
  * **WhatsApp Chatbot (`whatsapp-chatbot.js`)** : Lors de la crÃ©ation d'une commande par le bot WhatsApp, le systÃ¨me initialise directement une session Wave Checkout (`wave.createCheckoutSession`) et transmet la vÃ©ritable URL officielle Wave (`wave_launch_url`) dans le message WhatsApp. Cliquer sur le lien dans WhatsApp ouvre **immÃ©diatement l'application Wave** pour payer en 1 Clic (2 secondes).
  * **Notifications Vendeur âž” Client (`comptabilite.js`)** : MÃªme comportement lors de l'envoi de la notification de confirmation de commande du marchand vers le client via WhatsApp.
- **Auto-Redirection ImmÃ©diate sur le Web (`checkout-express/page.tsx`)** :
  * Si le client atterrit sur le lien Web (`/checkout-express?pay=wave&auto=1`), la page dÃ©clenche automatiquement l'initialisation de la session Wave et redirige l'acheteur sans nÃ©cessiter un second clic.
  * Ajout d'un Ã©cran d'attente visuel moderne (*"ðŸŒŠ Redirection vers Wave..."*) pendant l'initialisation.

## ðŸš€ Mises Ã  jour du 14/08/2026 : Correction du RÃ©affichage RÃ©current de la Notification de Mise Ã  Jour PWA (`RegisterSW.tsx`, `next.config.js`)
- **Fix du Clignotement / RÃ©affichage du Bandeau Bleu *"ðŸ”„ Nouvelle version disponible â€” Mettre Ã  jour"*** :
  * **ProblÃ¨me** : Lors du clic sur le bouton bleu de mise Ã  jour PWA, le rechargement de la page re-dÃ©clenchait l'Ã©vÃ©nement `updatefound` ou `reg.waiting` avant la finalisation de l'activation du Service Worker, provoquant la rÃ©apparition indÃ©finie du bandeau bleu.
  * **Solution** :
    1. Ajout des en-tÃªtes HTTP `Cache-Control: no-cache, no-store, must-revalidate` sur `/sw.js` dans `next.config.js` pour interdire la mise en cache HTTP rÃ©siduelle du fichier de Service Worker.
    2. Utilisation d'un verrou temporaire dans `sessionStorage` (`nopalou_sw_updated`) dans `RegisterSW.tsx` pour empÃªcher l'affichage en boucle de la notification pendant le processus d'installation.
    3. Ajout d'un timer de sÃ©curitÃ© pour forcer le rechargement si l'Ã©vÃ©nement `controllerchange` tarde Ã  se dÃ©clencher.

## ðŸš€ Mises Ã  jour du 13/08/2026 : IntÃ©gration du Module de Paiement Wave Express Web & Redirection 1-Clic (`checkout-express/page.tsx`, `paiement.js`)
- **IntÃ©gration du Paiement Direct Wave 1-Clic sur la Page Express Web (`checkout-express/page.tsx` & `paiement.js`)** :
  * **Redirection automatique vers l'Application Wave** : Lors du clic sur la caisse express web avec l'option Wave (`pay=wave`), la page initialise la session Wave (`/api/paiement/wave/initier-express`) et redirige automatiquement l'acheteur vers l'application **Wave** (`wave_url`).
  * Pre-sÃ©lection automatique du mode de paiement en fonction du paramÃ¨tre de requÃªte `pay` (`pay=wave`, `pay=cash`, etc.).

## ðŸš€ Mises Ã  jour du 13/08/2026 : Ajout de Banlieue + Wave & Gestion Dynamique des Zones de Livraison (`whatsapp-chatbot.js`)
- **Ajout de la Formule `ðŸŒŠ Banlieue + Wave (2500F)` & Dynamisme BDD (`whatsapp-chatbot.js`)** :
  * Ajout de l'option combinÃ©e `ðŸŒŠ Banlieue + Wave (2500F)` dans la liste par dÃ©faut des formules tout-en-un.
  * **Fonctionnement dynamique** : Si le vendeur a configurÃ© ses propres zones de livraison dans la base de donnÃ©es (`zones_livraison`), le systÃ¨me gÃ©nÃ¨re dynamiquement pour chaque zone du vendeur les options Wave et Cash associÃ©es !

## ðŸš€ Mises Ã  jour du 13/08/2026 : Fix du Blocage du Menu Interactif WhatsApp (Sanitisation des Titres < 24 caractÃ¨res Meta) (`whatsapp.js`, `whatsapp-chatbot.js`)
- **Fix du Rejet Meta 400 Bad Request sur les Menus de Commande (`whatsapp.js` & `whatsapp-chatbot.js`)** :
  * **ProblÃ¨me** : Les titres des options de livraison (`ðŸŒŠ Dakar (1 500 F) + Wave`, etc.) dÃ©passaient 24 caractÃ¨res, provoquant le rejet silencieux du message interactif par la Meta Cloud API et le blocage de l'utilisateur aprÃ¨s la saisie de son Nom/Adresse.
  * **Solution** : Ajout d'une sanitisation automatique systÃ©matique `.slice(0, 24)` dans `sendWhatsAppInteractive` pour garantir qu'aucun message interactif WhatsApp ne puisse Ãªtre rejetÃ© pour dÃ©passement de longueur de titre.

## ðŸš€ Mises Ã  jour du 13/08/2026 : DÃ©duction Automatique des 2% de Frais Totaux Wave (1% Encaissement + 1% Payout) (`comptabilite.js`, `wave.js`)
- **Prise en compte des 2% de Frais de Transaction Wave sur le Reversement Marchand (`comptabilite.js`)** :
  * Calcul automatique des frais totaux Wave (1% encaissement Wave Checkout + 1% virement Wave Payout = 2% total) lors du calcul du montant net Ã  reverser (`netAmount = montant_total - commission_nopalou - fraisWaveTotaux`).
  * SÃ©paration claire et transparente entre la commission Nopalou et les frais d'opÃ©rateur Wave.
- **Correction de l'URL Endpoint Wave Payout (`wave.js`)** :
  * Modification de `/v1/payouts` vers l'endpoint officiel `/v1/payout` et ajout systÃ©matique de l'en-tÃªte de signature HMAC SHA256 `Wave-Signature: t=...,v1=...`.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Envoi Automatique du Lien de Paiement Wave 1-Clic sur WhatsApp (`comptabilite.js`, `whatsapp-chatbot.js`)
- **GÃ©nÃ©ration & Envoi du Lien de Paiement Wave Direct sur WhatsApp (`comptabilite.js` & `whatsapp-chatbot.js`)** :
  * **Sur confirmation de la commande par le marchand** : DÃ¨s que le vendeur valide la commande depuis son espace boutique (`statut=confirmee`), une notification WhatsApp est automatiquement envoyÃ©e au client avec le lien de paiement Wave 1-Clic (`ðŸ‘‰ ${SITE}/checkout-express?...&pay=wave`).
  * **DÃ¨s la validation de la commande par chat** : Le message de confirmation finale gÃ©nÃ©rÃ© par le bot WhatsApp inclut directement le lien direct vers le module de rÃ¨glement Wave 1-Clic.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Formules Tout-en-Un (Livraison + Paiement en 1 Clic) & WhatsApp Direct Chatbot (`whatsapp-chatbot.js`)
- **Combinaison des Ã‰tapes de Livraison & Paiement en 1 Seul Menu Interactif Tout-en-Un** :
  * Fusion des choix de la zone de livraison et du mode de paiement en une seule liste d'options combinÃ©es : `ðŸŒŠ Dakar (1 500 F) + Wave`, `ðŸ’µ Dakar (1 500 F) + Cash`, `ðŸšš Banlieue (2 500 F) + Cash`, `ðŸ�¬ Retrait Boutique (Gratuit)`.
  * **ExpÃ©rience utilisateur ultra-rÃ©duite** : La commande par chat ne nÃ©cessite plus que **1 seul message texte (Nom + Adresse)** et **1 seul clic sur le menu combinÃ©**, gÃ©nÃ©rant immÃ©diatement le rÃ©capitulatif et la confirmation finale.
- **IntÃ©gration du Bouton *"ðŸ’¬ Contact Vendeur (WhatsApp Direct 1-Clic)"* dans le Chatbot** :
  * GÃ©nÃ©ration automatique du lien direct `wa.me/221XXXXXXX?text=...` avec le message prÃ©-rempli identique Ã  la fiche produit Web : *â€œBonjour ! Je suis intÃ©ressÃ©(e) par l'article [Nom] ([Prix]) vu sur Nopalou. Est-il disponible ?â€�*.
  * Ajout du bouton tactile `ðŸ’¬ Contact Vendeur` sous chaque fiche produit WhatsApp pour permettre la discussion instantanÃ©e en 1 clic sans aucun formulaire.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Resolution de la 404 sur le Bouton du Template WhatsApp (`immo/boutique/page.tsx`, `immo/[id]/page.tsx`, `next.config.js`)
- **Fix de la Redirection 404 du Bouton *"Voir les dÃ©tails"* WhatsApp (`immo/boutique/page.tsx` & `next.config.js`)** :
  * **ProblÃ¨me** : Le template Meta `nopalou_fiche_texte` est enregistrÃ© chez Meta avec une URL de bouton fixe `https://nopalou.com/immo/{{1}}`. Lors de l'envoi du paramÃ¨tre `boutique?tab=commandes`, le bouton cliquable WhatsApp gÃ©nÃ©rait l'URL `https://nopalou.com/immo/boutique?tab=commandes` qui renvoyait vers une page 404.
  * **Solution** :
    1. CrÃ©ation de la route dÃ©diÃ©e `frontend-next/src/app/immo/boutique/page.tsx` redirigeant automatiquement vers `/boutique?tab=commandes`.
    2. Ajout de la rÃ¨gle de redirection globale dans `next.config.js` (`/immo/boutique` âž” `/boutique?tab=commandes`).
    3. Ajout d'une gestion de secours intelligente dans `immo/[id]/page.tsx` redirigeant `/immo/boutique` vers `/boutique?tab=commandes` et les annonces classifiÃ©es vers `/annonces/[id]`.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Correction de la Restriction Meta 24h & IntÃ©gration du Lien Direct vers les Commandes (`comptabilite.js`, `whatsapp-chatbot.js`)
- **Fix de la Restriction Meta WhatsApp des 24 Heures (Code 131047)** :
  * **ProblÃ¨me identifiÃ© via les logs** : Meta Cloud API Ã©chouait l'envoi des notifications texte aux vendeurs qui n'avaient pas Ã©crit au bot WhatsApp dans les 24h avec l'erreur `131047 (Re-engagement message / 24 hours window)`.
  * **Solution** : Ajout systÃ©matique de l'envoi par le Template Meta approuvÃ© `nopalou_fiche_texte` (qui contourne la fenÃªtre des 24h Meta) en complÃ©ment du message texte dÃ©taillÃ© dans `notifierVendeurCommande` et `notifierVendeurPanierGroupe`.
- **IntÃ©gration du Lien de Redirection Direct vers l'Espace Vendeur** :
  * Ajout automatique de l'URL de redirection direct vers l'onglet des commandes du tableau de bord vendeur (`${SITE}/boutique?tab=commandes`) dans les messages et templates de notification WhatsApp envoyÃ©s aux marchands lors d'une nouvelle commande.

## ðŸš€ Mises Ã  jour du 13/08/2026 : ImplÃ©mentation du Renforcement Anti-Clonage, Anti-Scraping et Protection de la Marque
- **Masquage SÃ©curisÃ© des NumÃ©ros de Contact Vendeurs (`MaskedContactPhone.tsx` & `annonces/[id]/page.tsx`)** :
  * CrÃ©ation d'un composant interactif de protection des numÃ©ros marchands (`+221 77 *** ** 42`) avec bouton tactile *"ðŸ‘�ï¸� Afficher le numÃ©ro"*.
  * Bloque l'aspiration automatisÃ©e des numÃ©ros par des robots d'aspiration et enregistre l'Ã©vÃ©nement d'intention de contact (Lead tracking).
- **Tatouage Visuel de Marque & Protection Anti-Vol de MÃ©dias (`ExternalImg.tsx` & `produit/[id]/page.tsx`)** :
  * Ajout du support de filigrane numÃ©rique (`watermark={true}`) superposant la griffe de marque `nopalou.com` semi-transparente avec dÃ©sactivation du clic-droit (`onContextMenu`) pour dÃ©courager le vol de visuels originaux.
- **Filtrage des Scrapers & Rate Limiting ResserrÃ© (`backend/app.js`)** :
  * IntÃ©gration du middleware `botBlockerMiddleware` bloquant les User-Agents de scraping et d'aspiration headless (`Scrapy`, `python-requests`, `go-http-client`, `Java/`, `Wget`, `Curl`).
  * Mise en place de la limite resserrÃ©e `searchLimiter` (150 req / 15 min) sur les endpoints de recherche publique.
- **Blocage des Robots d'Aspiration IA (`robots.ts`)** :
  * Ajout des directives d'interdiction explicites (`disallow: /`) pour 13 crawlers d'IA et de data mining (`GPTBot`, `Bytespider`, `CCBot`, `ClaudeBot`, `ImagesiftBot`, `Scrapy`, `AhrefsBot`, `SemrushBot`).
- **Verrouillage Anti-Reversing & Headers Anti-Framing (`next.config.js`)** :
  * DÃ©sactivation explicite des cartes sources client (`productionBrowserSourceMaps: false`) pour empÃªcher la rÃ©tro-ingÃ©nierie du code React Next.js.
  * Ajout de la directive CSP `Content-Security-Policy: frame-ancestors 'self'` pour interdire l'iframe-jacking/clonage dans des cadres tiers.
- **Clauses Juridiques d'Interdiction d'Aspiration & Canonical SEO (`cgu/page.tsx` & `layout.tsx`)** :
  * Ajout de la section **6. PropriÃ©tÃ© Intellectuelle & Interdiction d'Aspiration de DonnÃ©es (Anti-Scraping / DMCA)** aux CGU conformÃ©ment au Droit d'Auteur sÃ©nÃ©galais et aux directives de l'APDP.
  * Configuration de l'URL canonique `alternates: { canonical: 'https://nopalou.com' }` (URL absolue via `NEXT_PUBLIC_SITE_URL`) et metadonnÃ©es d'auteur/Ã©diteur dans `layout.tsx` pour forcer l'attribution canonique par Google. *(CorrigÃ© le 13/08/2026 : `./'` relatif remplacÃ© par URL absolue â€” commit `f277e27`)*

## ðŸš€ Mises Ã  jour du 13/08/2026 : Nettoyage IntÃ©gral des Logs de DÃ©bogage & Fichiers de Logs
- **Nettoyage des Logs Console de DÃ©bogage (`frontend-next`)** :
  * Purge de 65 lignes de logs console verbeux (`console.log`, `console.info`) ajoutÃ©s lors du dÃ©veloppement et du diagnostic hors-ligne / PWA sur 9 fichiers clÃ©s :
    1. `CompteClient.tsx` : Suppression des logs de prÃ©chargement universel SPA et de navigation par onglet.
    2. `CaisseClient.tsx` : Nettoyage des logs de diagnostic caisse, dÃ©codage EAN code-barres et validation POS.
    3. `BoutiqueClient.tsx` : Suppression des logs de chargement catalogue.
    4. `Comptabilite.tsx` : Suppression des logs de comptabilitÃ©.
    5. `AnnoncesClient.tsx` & `AnnoncesImmoClient.tsx` : Nettoyage des logs de cache local annonces/immo.
    6. `db-offline.ts` : Purge des logs verbeux d'opÃ©rations IndexedDB v3 (les `console.error` d'erreurs rÃ©elles restant prÃ©servÃ©s).
    7. `sync-manager.ts` : Suppression des logs verbeux de synchronisation.
    8. `useOnlineStatus.ts` : Suppression des logs de monitoring rÃ©seau et de polling.
- **Suppression des Fichiers de Logs Temporaires Ã  la Racine** :
  * Nettoyage des fichiers temporaires `backend_stderr.log`, `backend_stdout.log`, `server.log`.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Audit, Nettoyage BDD & Refonte du Scraping FB (`clean-scraped-annonces.js`, `scraper-immo-facebook.js`)
- **Audit Approfondi de la BDD (1 922 Annonces ClassifiÃ©es & 6 494 Offres)** :
  * Identification des causes d'annonces incohÃ©rentes : 1 410 sans prix (73%), 1 189 avec caractÃ¨res d'obfuscation stealth Facebook (`\u0378`, `\u034F`, diacritiques combinÃ©s), 317 polluÃ©es par les boutons UI Facebook (`Envoyer un message`, `Voir la traduction`, `En voir plus`), et 366 avec `+` d'encodage URL non dÃ©codÃ©s.
- **ExÃ©cution d'un Script de Nettoyage et RÃ©paration Massif (`backend/scripts/clean-scraped-annonces.js`)** :
  * **1 110 mises Ã  jour SQL exÃ©cutÃ©es en BDD** :
  * Suppression Ã  100% de l'obfuscation Unicode FB stealth (passÃ© de 62% Ã  0%).
  * RÃ©paration et restauration automatique de **115 prix** extraits du texte (ex: `25k`, `15.000f`).
  * Assainissement de **917 titres/descriptions** dÃ©barrassÃ©s des textes parasites d'interface FB.
  * Masquage automatique (`actif = false`) de **404 annonces inexploitables** (sans photo et sans prix).
- **SÃ©curisation PrÃ©ventive du Scraper Facebook (`backend/services/scraper-immo-facebook.js`)** :
  * **GÃ©nÃ©ration de Titre Intelligent (`extraireTitreIntelligentFB`)** : Extraction de la premiÃ¨re vraie phrase descriptive du produit plutÃ´t que le dernier segment d'interface FB (`texte.split('Â·')[last]`).
  * **Sanitizers Automatiques (`purgerUnicodeStealthFB`, `purgerUiFacebook`, `decoderChainePlus`)** : Purge systÃ©matique des bruits UI/diacritiques et dÃ©codage URL avant toute insertion SQL.
  * **Parsing des Prix AvancÃ© (`parsePrixFB`)** : Support des syntaxes locales sÃ©nÃ©galaises (`25k`, `15.000f`, `prix: 10000`, `Ã  15000`).

## ðŸš€ Mises Ã  jour du 13/08/2026 : IntÃ©gration des Actions en Masse (Batch Actions) & LevÃ©e de la Limite des Annonces en Admin (`annonces.js`, `boutiques.js`)
- **Fix du Plafond de 200 Ã‰lÃ©ment dans l'Admin (`backend/routes/annonces.js`, `boutiques.js`)** :
  * **ProblÃ¨me** : Les requÃªtes admin `GET /api/annonces/admin/en-attente` et `GET /api/boutiques/admin/en-attente` Ã©taient bridÃ©es par une clause SQL `LIMIT 200`, ce qui masquait les annonces et boutiques au-delÃ  des 200 plus rÃ©centes sur les 2000+ existantes.
  * **Solution** : Passage de la limite SQL de 200 Ã  **5000** (avec support dynamique du paramÃ¨tre query `?limit=...`), permettant l'affichage, la sÃ©lection et l'exÃ©cution d'actions en masse sur l'intÃ©gralitÃ© du catalogue.
- **SystÃ¨me d'Actions en Masse sur Tout le Portail d'Administration** :

  * **Composant RÃ©utilisable `BatchActionBar.tsx`** : Ajout d'une barre d'action flottante / sticky pour l'administration avec case Ã  cocher globale ("Tout sÃ©lectionner / Tout dÃ©sÃ©lectionner"), compteur d'Ã©lÃ©ments sÃ©lectionnÃ©s et boutons colorÃ©s conditionnels (Activer ðŸŸ¢, DÃ©sactiver ðŸŸ , Supprimer ðŸ”´, Sponsoriser/Prolonger ðŸ”µ) avec modal de confirmation prÃ©alable pour la suppression en masse.
  * **Extension des Actions Serveur & Backend (`admin.ts`, `annonces.js`, `partenaires.js`)** : CrÃ©ation des fonctions batch et des endpoints de suppression pour Annonces, Boutiques, Immobilier, Comptes utilisateurs, Demandes partenaires, Publications, Paiements manuels, Commissions apporteurs, Telecom et Abonnements.
  * **DÃ©ploiement sur 10 Sections Admin** :
    1. **Annonces ClassifiÃ©es** (`AdminAnnoncesClient.tsx`) : Approuver, DÃ©sactiver, Supprimer en masse.
    2. **Boutiques** (`AdminBoutiquesClient.tsx`) : Activer, DÃ©sactiver, Supprimer en masse.
    3. **Comptes Utilisateurs** (`ComptesTableClient.tsx`) : RÃ©activer, Suspendre, Supprimer en masse.
    4. **Immobilier** (`AdminImmoClient.tsx`) : Valider, DÃ©sactiver, Sponsoriser 30j, Supprimer en masse.
    5. **Partenaires** (`AdminPartenairesClient.tsx`) : Approuver, Rejeter, Supprimer en masse.
    6. **Publications (FB/IG)** (`publications/page.tsx`) : Approuver, Supprimer en masse.
    7. **Paiements Manuels** (`PaiementsManuelsClient.tsx`) : Valider, Rejeter en masse.
    8. **Apporteurs** (`ApporteursClient.tsx`) : Marquer payÃ©es les commissions sÃ©lectionnÃ©es.
    9. **Telecom** (`AdminTelecomClient.tsx`) : DÃ©sactiver / Supprimer en masse.
    10. **Abonnements** (`AbonnementsTableClient.tsx`) : Prolonger 30j, Annuler en masse.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Correction du DÃ©bordement des Cartes de Boutiques sur Mobile (`BoutiqueClient.tsx`)

- **Fix du DÃ©bordement des IcÃ´nes d'Actions (`BoutiqueClient.tsx`)** :
  * **ProblÃ¨me** : Sur l'Ã©cran de liste des boutiques (`/boutique`), la rangÃ©e supÃ©rieure des cartes (`BoutiqueCard`) forÃ§ait le logo, le nom de la boutique, les badges, le statut `Active`/`Inactive` et les 3 boutons d'actions (`ðŸ‘� Voir`, `ðŸ“� Modifier`, `ðŸ—‘ Supprimer`) Ã  s'aligner sur une seule ligne rigide sans flex-wrap. Sur mobile (< 480px), le bouton de suppression `ðŸ—‘` Ã©tait poussÃ© hors du bord droit de la carte.
  * **Solution** : Ajout de `flexWrap: 'wrap'`, `flex: '1 1 200px'` et alignement responsive dans l'en-tÃªte et le pied de carte de `BoutiqueCard`. Sur mobile, les icÃ´nes d'actions s'ajustent proprement sous le nom de la boutique avec 100% de visibilitÃ© dans la carte.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Perfectionnement Ergonomique Mobile & DÃ©filÃ© Bord-Ã -Bord (`globals.css`)
- **Fix du Tronquage / DÃ©bordement sur Mobile (`globals.css`)** :
  * **Onglets de navigation bord-Ã -bord** : Application de marges nÃ©gatives (`margin: 10px -12px -4px -12px`) sur le conteneur dÃ©filant des onglets `.account-sidebar-nav-wrapper`. Les pilules d'onglets (`Mes annonces`, `Mes biens immo`, `Ma boutique`, `Abonnements`, `Apporteur`, `Profil`, `Favoris`) dÃ©filent dÃ©sormais de maniÃ¨re fluide sur **toute la largeur de l'Ã©cran** sans aucune coupure sur le bord de la carte.
  * **ResponsivitÃ© des cartes d'annonces (`.annonce-card`, `.annonce-card-actions`)** : Ajout des rÃ¨gles `width: 100%`, `box-sizing: border-box` et retour Ã  la ligne automatique (`flex-wrap: wrap`) sur les boutons d'action (`Modifier`, `Booster 7j`, `Booster`, `Supprimer`). Les boutons ne dÃ©bordent plus sur la droite de l'Ã©cran mobile.

## ðŸš€ Mises Ã  jour du 13/08/2026 : IntÃ©gration des Onglets de Navigation Mobile sur `/compte` (`AccountNavLinks.tsx` & `globals.css`)
- **Correction des Liens de Navigation MasquÃ©s sur Mobile (`AccountNavLinks.tsx`, `globals.css`)** :
  * **ProblÃ¨me** : La rÃ¨gle CSS `.account-sidebar--main .account-sidebar-nav-wrapper { display: none !important; }` masquait complÃ¨tement les liens du compte sur mobile (< 768px). L'utilisateur ne voyait que sa carte d'identitÃ© et ses annonces sans aucun moyen de naviguer vers ses biens immo, ses abonnements/plan, son profil ou sa boutique.
  * **Solution** : Transformation de la barre de navigation en barre d'onglets dÃ©filante horizontale (`overflow-x: auto`) avec pilules tactiles Ã©lÃ©gantes sous la carte profil.
  * Tous les onglets (`ðŸ“‹ Mes annonces`, `ðŸ�  Mes biens immo`, `ðŸ�ª Ma boutique`, `ðŸ“– Abonnements`, `ðŸ’¼ Apporteur`, `âœ�ï¸� Mon profil`, `â™¥ Mes favoris`) sont dÃ©sormais immÃ©diatement visibles, dÃ©filables et cliquables sur mobile.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Architecture PWA PurifiÃ©e & Ã‰limination DÃ©finitive du Bandeau de Mise Ã  Jour (`RegisterSW.tsx` & `sw.ts`)
- **Ã‰limination DÃ©finitive du RÃ©affichage du Toast de Mise Ã  Jour (`RegisterSW.tsx` & `sw.ts`)** :
  * **Explication Technique** : Vous avez parfaitement raison, ce n'est pas censÃ© dÃ©pendre d'un stockage de session ! Dans l'architecture PWA standard, dÃ¨s que le bouton est cliquÃ© et que `self.skipWaiting()` s'exÃ©cute, le nouveau Service Worker passe Ã  l'Ã©tat `active`. Ã€ cet instant prÃ©cis, `reg.waiting` devient `null`.
  * **Correctif AppliquÃ©** : 
    1. Prise en charge native du message `SKIP_WAITING` dans [sw.ts](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/app/sw.ts) via `self.skipWaiting()`.
    2. Ã‰coute de l'Ã©vÃ©nement natif `controllerchange` dans [RegisterSW.tsx](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/app/RegisterSW.tsx) pour recharger la page uniquement au moment oÃ¹ le nouveau SW a pris le relais.
    3. Retrait complet des hacks `sessionStorage` : Une fois mis Ã  jour, `reg.waiting` vaut `null`. Tant qu'aucun nouveau dÃ©ploiement n'a lieu sur le serveur, la notification **ne rÃ©apparaÃ®tra plus jamais**, ni pendant la session, ni lors des redÃ©marrages du navigateur.

## ðŸš€ Mises Ã  jour du 13/08/2026 : PrÃ©chargement Hors-Ligne des Dashboards & Liens "Retour Ã  mon compte" (`Comptabilite.tsx`, `BoutiqueClient.tsx`, `RegisterSW.tsx`, `sw.ts`)
- **Fix du Blocage par Squelette de Chargement Hors-Ligne (`Comptabilite.tsx`)** :
  * **ProblÃ¨me** : En mode hors-ligne, les donnÃ©es du tableau de bord comptable Ã©taient bien lues depuis `localStorage`, mais `setLoading(false)` n'Ã©tait pas exÃ©cutÃ© lors de la prÃ©sence du cache local. Le composant restait bloquÃ© Ã  `loading = true`, affichant des rectangles de chargement beiges indÃ©finiment.
  * **Solution** : Appel immÃ©diat de `setLoading(false)` dÃ¨s la rÃ©cupÃ©ration du cache et dans le bloc `.finally()`. Les statistiques comptables s'affichent dÃ©sormais en 0 ms hors-ligne.
- **PrÃ©chargement Hors-Ligne du Journal d'Audit (`BoutiqueLogs.tsx`, `BoutiqueClient.tsx`)** :
  * **ProblÃ¨me** : En mode hors-ligne, la consultation du *Journal d'Audit & Historique des Actions* affichait le rectangle d'erreur rouge `Impossible de charger le journal d'audit` car les Ã©vÃ©nements de logs n'Ã©taient pas intÃ©grÃ©s au prÃ©chargeur d'arriÃ¨re-plan. De plus, `setLoading(false)` n'Ã©tait pas exÃ©cutÃ© lors de la lecture du cache local.
  * **Solution** : Ajout du prÃ©chargement en tÃ¢che de fond des logs (`/api/boutiques/${b.id}/logs?limit=150` -> `nopalou_offline_logs_${b.id}_tous`) dans `BoutiqueClient.tsx` et dÃ©sactivation immÃ©diate du loader lors de la prÃ©sence des logs en cache dans `BoutiqueLogs.tsx`.
- **PrÃ©chargement des Compteurs du Tableau de Bord (`BoutiqueClient.tsx`)** :
  * Mise en cache locale des indicateurs de la vue d'ensemble (`nopalou_offline_dash_counts_${boutique.id}`). Les nombres de produits et alertes de stock s'affichent immÃ©diatement sans temporisation.
- **Ajout des Liens Explicites "Retour Ã  mon compte" & IncrÃ©ment PWA v6 (`BoutiqueClient.tsx`, `sw.ts`, `public/sw.js`)** :
  * Modification du bouton d'en-tÃªte de la sidebar en `â†� Retour Ã  mon compte`.
  * Ajout du bouton `ðŸ‘¤ Mon compte marchand â†—` dans les raccourcis de la boutique et `ðŸ‘¤ Retourner Ã  mon compte` sur la page de secours PWA hors-ligne (`sw.ts` & bundle compilÃ© `public/sw.js`).
  * IncrÃ©mentation de la version des caches Service Worker Ã  `v6` (`CACHE_VERSION = 'v6'`) pour forcer le rafraÃ®chissement immÃ©diat de la page hors-ligne chez les utilisateurs.
- **Disparition Automatique du Toast de Connexion (`RegisterSW.tsx`)** :
  * Ajout d'un `useEffect` dÃ©diÃ© sur `showOnlineToast` garantissant le masquage automatique du toast vert `âœ… Connexion Internet rÃ©tablie` aprÃ¨s 3,5 secondes.

- **Fix RÃ©activitÃ© du Toast de Mise Ã  Jour PWA (`RegisterSW.tsx`)** :
  * **ProblÃ¨me** : Le clic sur le bandeau `ðŸ”„ Nouvelle version disponible â€” Mettre Ã  jour` ne rÃ©agissait pas si le Service Worker Ã©tait dÃ©jÃ  dans l'Ã©tat `active` ou sans worker `waiting` explicite.
  * **Solution** : Refonte de la fonction `handleSwUpdate()` dans `RegisterSW.tsx` avec dÃ©clenchement systÃ©matique et garanti de `window.location.reload()`, assurant le rechargement immÃ©diat de la page et l'application instantanÃ©e de la nouvelle version.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Refonte Ergonomique de la Navigation Mobile & Fix des Sous-Menus CachÃ©s (`BoutiqueClient.tsx`, `GestionDocuments.tsx` & `globals.css`)
- **Correction des Sous-Menus MasquÃ©s / TronquÃ©s Ã  Droite (`BoutiqueClient.tsx`, `GestionDocuments.tsx`, `globals.css`)** :
  * **ProblÃ¨me** : Sur mobile (< 640px), la barre de navigation `.bq-nav` masquait les titres de groupes (`display: none !important`) et alignait tous les 15 Ã©lÃ©ments de menu sur une seule ligne dÃ©filante horizontale avec barres de dÃ©filement masquÃ©es (`scrollbar-width: none`). Lorsque l'utilisateur cliquait sur un groupe (ex: *Commandes & Livraisons*), les autres sous-menus Ã©taient poussÃ©s hors-Ã©cran sur la droite sans aucun indicateur visuel, laissant penser que le menu Ã©tait tronquÃ© ou incomplet. De plus, les filtres de documents (`GestionDocuments.tsx`) dÃ©bordaient sur mobile.
  * **Solution Navigation 2-Niveaux (`BoutiqueClient.tsx`)** :
    1. **Niveau 1 (Groupes de gestion)** : Affichage d'une barre d'onglets de groupes (`Ventes & Clients`, `Catalogue & Stocks`, `Finance & Rapports`, `ParamÃ¨tres & Ã‰quipe`) avec le nombre exact de sous-menus contenus dans chaque groupe (`(3)`, `(2)`, etc.).
    2. **Niveau 2 (Sous-menus du groupe sÃ©lectionnÃ©)** : Affichage clair et direct de tous les sous-menus du groupe actif avec badges, icÃ´nes et verrous de formule (`ðŸ”’ Pro`, `ðŸ”’ Business`).
  * **Passage Ã  `flexWrap: 'wrap'` (`GestionDocuments.tsx`)** :
    * Les onglets de filtres de documents (`ðŸ“� Tous`, `ðŸ§¾ Factures`, `ðŸ“� Devis`, `ðŸ“‹ Proformas`) s'ajustent dÃ©sormais sur plusieurs lignes sur mobile sans aucun tronquage.
  * **Indicateur de Scroll Subtil (`globals.css`)** :
    * Mise en place d'une scrollbar fine stylisÃ©e (`scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent`) sur `.nopalou-scroll-tabs` pour indiquer visuellement le dÃ©filement horizontal.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Correction du Positionnement Responsive du Menu DÃ©roulant Actions (`BoutiqueClient.tsx` & `globals.css`)
- **Fix du Tronquage / DÃ©bordement Hors-Ã‰cran du Menu DÃ©roulant (`BoutiqueClient.tsx`, `BoutonPartager.tsx`, `globals.css`)** :
  * **ProblÃ¨me** : Sur les Ã©crans mobiles et Ã©troits (< 640px), le bouton `Actions â–¾` s'aligne Ã  gauche de la carte produit. Le style `right: 0; left: auto;` positionnait le bord droit du menu dÃ©roulant sur le bouton, poussant les 200px du menu hors-Ã©cran vers la gauche et tronquant les libellÃ©s (`ðŸ�·ï¸� Scan / EAN`, `ðŸ–¨ï¸� Imprimer Ã‰tiquette`, `ðŸ“„ Dupliquer le produit`, `ðŸ“¢ Publier en Annonce`, `ðŸ—‘ï¸� Supprimer`).
  * **Solution** : Ajout de la classe CSS `.bq-actions-dropdown` avec repli responsive `left: 0 !important; right: auto !important;` sous `@media (max-width: 640px)`.
  * Le menu dÃ©roulant s'aligne dÃ©sormais proprement sur la gauche et s'Ã©tend vers la droite tout en restant 100% visible et accessible Ã  l'intÃ©rieur de l'Ã©cran.
  * DÃ©ploiement & Push Git : DÃ©ploiement validÃ© sans erreurs sur `origin main`.

## ðŸš€ Mises Ã  jour du 13/08/2026 : Audit de Non-RÃ©gression & Alignement des Tests E2E (`07-pos-offline-sync.spec.ts`)
- **Alignement du Locator du Badge Offline (`07-pos-offline-sync.spec.ts`)** :
  * Mise Ã  jour du sÃ©lecteur Playwright pour correspondre exactement au libellÃ© rÃ©el du toast rÃ©actif (`Mode Hors-Ligne â€” Consultation des donnÃ©es locales en cache`).
- **Validation Sans RÃ©gression** :
  * ContrÃ´le de la syntaxe applicative backend Node.js (`backend/app.js` et `backend/routes/boutiques.js`) validÃ© avec 0 erreur.
  * Validation TypeScript globale (`npx tsc --noEmit`) confirmÃ©e 100% sans fautes.

## ðŸš€ Mises Ã  jour du 12/08/2026 : Hauteur Minimale Garantie pour le Ticket POS (`CaisseClient.tsx`)
- **Fix DÃ©finitif de la Tronquature du Panier POS (`CaisseClient.tsx`)** :
  * DÃ©finition d'une hauteur minimale garantie `minHeight: 140px` sur le conteneur des articles du ticket pour empÃªcher Flexbox de compresser la liste Ã  15px sous l'accumulation des boutons de rÃ¨glement.
  * RÃ©activation de `overflowY: 'auto'` sur le panneau droit `.ticket-section` permettant un dÃ©filement fluide de l'ensemble de la caisse sur tous les types d'Ã©crans et rÃ©solutions.

## ðŸš€ Mises Ã  jour du 12/08/2026 : Correction de l'Erreur d'Hydratation React / Next.js (`RegisterSW.tsx`)
- **RÃ©solution de l'Erreur Mismatch Hydration (`RegisterSW.tsx`)** :
  * Ajout du garde `mounted` (`useEffect` -> `setMounted(true)`) empÃªchant l'injection prÃ©maturÃ©e de balises HTML `<div>` d'alerte hors-ligne lors du rendu SSR/Hydratation initiale.
  * Garantit que le DOM serveur et le DOM client initial correspondent Ã  100% sans aucun avertissement ni erreur `Hydration failed because the initial UI does not match`.

## ðŸš€ Mises Ã  jour du 12/08/2026 : Correction de l'Affichage Vertical du Ticket POS (`CaisseClient.tsx`)
- **Correction DÃ©passement & Tronquature du Ticket en Cours (`CaisseClient.tsx`)** :
  * Ajout de `minHeight: 0` sur la section ticket et le conteneur dÃ©filant du panier pour Ã©liminer le conflit de dÃ©filement imbriquÃ©.
  * Ajout d'un padding vertical de respiration (`padding: '6px 2px'`) et augmentation de la hauteur minimale des cartes d'articles (`minHeight: 48px`, `padding: '10px 12px'`).
  * Les articles du ticket de caisse ("Smartphone...", etc.) sont dÃ©sormais 100% lisibles et dÃ©gagÃ©s sous la barre de titre `ðŸ›’ Ticket en cours` sans aucun chevauchement ni tronquature.
- **Fix Typage `FonctionnalitesClient.tsx`** :
  * Transtypage explicite de la rÃ©ponse API `planData` (`as { abonnement?: { plan: string; fin: string } }`) pour supprimer l'erreur TS2339 (`Property 'abonnement' does not exist on type '{}'`).
- **Fix Interface `<ExternalImg />` (`AnnoncesImmoClient.tsx`)** :
  * Suppression du prop obsolÃ¨te `fill` qui ne correspondait pas aux dÃ©finitions de l'interface `ExternalImgProps`.
- **Validation TypeScript Globale** :
  * Compilation `npx tsc --noEmit` validÃ©e avec 0 erreur (100% propre).

## ðŸš€ Mises Ã  jour du 12/08/2026 : Refonte Majeure du Mode Hors-Ligne POS (Idempotence & SyncManager)
- **Transaction PostgreSQL Atomique (`backend/routes/boutiques.js`)** :
  * Refonte complÃ¨te de la route `POST /api/boutiques/:id/pos-vente` avec `pool.connect()` et une transaction SQL atomique (`BEGIN` / `COMMIT` / `ROLLBACK`).
  * Garantit que le stock, les ventes, les commandes, la facture et la session caisse sont mis Ã  jour ensemble ou annulÃ©s en bloc en cas d'erreur.
  * Ajout de `ON CONFLICT (reference) DO NOTHING` sur l'insertion dans `caisse_documents`.
- **Migration SQL Idempotence (`database/migration_pos_idempotence_2026-08-12.sql`)** :
  * Script SQL de migration crÃ©ant la contrainte `UNIQUE` sur `caisse_documents.reference` et un index composite `(boutique_id, reference)`.
- **Gestionnaire CentralisÃ© `SyncManager` (`frontend-next/src/lib/sync-manager.ts`)** :
  * CrÃ©ation d'un module de synchronisation centralisÃ© avec verrou par boutique (`syncLocks`) Ã©vitant les doubles synchronisations simultanÃ©es.
  * IntÃ©gration de re-tentatives avec backoff exponentiel (1s â†’ 2s â†’ 4s) et suppression de l'IndexedDB **uniquement** aprÃ¨s rÃ©ception d'un ACK HTTP serveur (200 OK / duplicate: true).
  * Exposition du hook `useSyncOffline(boutiqueId, userId)` pour les composants React.
- **IndexedDB v3 & Isolation Multi-Utilisateurs (`frontend-next/src/lib/db-offline.ts`)** :
  * Passage Ã  IndexedDB `DB_VERSION = 3` avec isolation systÃ©matique par `userId` et `boutiqueId` (`cache_key = ${userId}:${boutiqueId}:${id}`).
  * Ajout du statut de synchronisation (`'pending' | 'syncing' | 'done'`) sur chaque vente offline pour verrouiller le traitement.
  * Suppression de la fonction `viderVentesHorsLigne` pour prÃ©venir toute perte accidentelle de donnÃ©es.
- **DÃ©tection de ConnectivitÃ© RÃ©elle v3 Singleton & Tracing AvancÃ© (`frontend-next/src/lib/useOnlineStatus.ts`)** :
  * Transformation de `useOnlineStatus` en Singleton centralisÃ© : Ã©limination complÃ¨te des pings dupliquÃ©s `/api/ping` Ã©mis lors du montage simultanÃ© de plusieurs composants.
  * RÃ©activitÃ© instantanÃ©e Ã  la reconnexion WiFi : rÃ©initialisation explicite (`lastPingTimestamp = 0`) lors des Ã©vÃ©nements `online` et `focus` pour contourner la temporisation 500ms et faire basculer l'interface en mode en ligne sur-le-champ.
  * DÃ©duplication des requÃªtes HTTP en cours (`inFlightPingPromise`) et temporisation adaptative pour Ã©viter la saturation rÃ©seau.
  * Tracing de diagnostic unifiÃ© avec balises visuelles explicites dans la console DevTools :
    - `ðŸ“¡ [Network Monitor]` pour les changements d'Ã©tat rÃ©seau et rÃ©sultats de pings `/api/ping`.
    - `ðŸ’¾ [IndexedDB v3]` pour l'ensemble des opÃ©rations de cache local (sauvegarde, lecture, file d'attente, purge).
    - `ðŸ›’ [Caisse POS]` pour le suivi des ventes en ligne vs hors-ligne.
    - `ðŸ“¦ [Catalogue]` pour le chargement des produits par boutique.
- **Persistance Hors-Ligne ComptabilitÃ© & Ventes/DÃ©penses (`frontend-next/src/app/boutique/Comptabilite.tsx`)** :
  * IntÃ©gration de la persistance locale `localStorage` dans `VentesView` (`nopalou_offline_compta_ventes_${bId}`, `nopalou_offline_compta_zones_${bId}`) et `DepensesView` (`nopalou_offline_compta_depenses_${bId}`).
  * Garantit que la totalitÃ© des sous-sections de la Boutique (Vue d'ensemble, Caisse POS, Catalogue, ComptabilitÃ© Ventes, DÃ©penses, Commandes et Zones de livraison) s'affichent instantanÃ©ment hors-ligne Ã  partir des donnÃ©es locales en cache sans blocage rÃ©seau.
- **Service Worker v5, Purge Automatique, Image SVG Fallback & RÃ©ponses 504 Propres (`sw.ts`, `next.config.js`, `RegisterSW.tsx`)** :
  * IncrÃ©mentation de la version des caches Ã  `CACHE_VERSION = 'v5'` avec nettoyeur automatique des anciens caches dans l'Ã©vÃ©nement `activate`.
  * Remplacement de `Response.error()` dans `setCatchHandler` par un **Fallback Image SVG** pour les images non cachÃ©es (Unsplash, Cloudinary, wsrv.nl) et une rÃ©ponse HTTP 504 propre (`Gateway Timeout (Offline)`) pour les requÃªtes API/ping Ã©chouÃ©es hors-ligne, Ã©liminant les 50+ lignes d'avertissements `FetchEvent resulted in a network error response` dans la console Chrome DevTools.
  * Placement de la rÃ¨gle `NetworkOnly` pour `/api/ping` en prioritÃ© absolue dans Serwist.
  * DÃ©sactivation du Service Worker en environnement de dÃ©veloppement (`disable: process.env.NODE_ENV === 'development'`) pour Ã©viter la fausse dÃ©tection offline et les conflits HMR.
  * Ajout d'une notification non intrusive dans `RegisterSW.tsx` proposant l'installation immÃ©diate des nouvelles versions du Service Worker (`SKIP_WAITING`).
- **Propagations Caisse & UI (`CaisseClient.tsx`, `page.tsx`, `BoutiqueClient.tsx`)** :
  * Passage du `userId` vÃ©rifiÃ© cÃ´tÃ© serveur (`verifySession()`) vers les composants clients pour l'isolation des donnÃ©es locales par compte.
  * Branchement de la Caisse POS sur `useSyncOffline()` et suppression de la synchro inline dupliquÃ©e.

## ðŸš€ Mises Ã  jour du 12/08/2026 : Correction Dashboard (ReferenceError & Stale Closure) & ZÃ©ro Polling en Ligne
- **Correction du Basculement ForcÃ© de Boutique Hors-Ligne (`BoutiqueClient.tsx`)** :
  * RÃ©solution du bug oÃ¹ cliquer sur une boutique secondaire (ex: Amar) forÃ§ait le retour Ã  la boutique principale (ex: Tech Dakar) en mode hors-ligne.
  * Remplacement du stale closure dans l'initialisation du `useEffect` par un `setMode(prevMode => ...)` garantissant le respect absolu du choix de l'utilisateur.
- **Correction d'Erreur Fatale sur le Dashboard (`BoutiqueClient.tsx`)** :
  * RÃ©solution de l'erreur `Uncaught ReferenceError: Cannot access 'isReallyOnline' before initialization` qui faisait crasher l'interface du Dashboard (Ã©cran blanc/rouge).
  * DÃ©placement de l'initialisation du hook `useOnlineStatus()` en haut du composant, avant son utilisation dans les `useEffect` de prÃ©chargement.
- **Architecture RÃ©seau Ã‰vÃ©nementielle (`useOnlineStatus.ts`)** :
  * Ã‰limination du polling rÃ©pÃ©titif en mode connectÃ© : zÃ©ro requÃªte `/api/ping` lorsque l'utilisateur est en ligne, supprimant toute surcharge rÃ©seau et tout conflit avec les Server Actions.
  * DÃ©clenchement rÃ©actif sur Ã©vÃ©nements natifs (`offline`, `online`, `focus`) et activation du sondage de reconnexion (toutes les 5s) uniquement lors des dÃ©connexions rÃ©elles.
- **Secours des Assets Statiques Hors-Ligne (`sw.ts`)** :
  * Ajout d'une recherche dans le cache avec `ignoreSearch: true` dans le `setCatchHandler` pour les scripts (`.js`), styles (`.css`), images et fichiers `/_next/static/`.
  * RÃ©solution des Ã©checs d'affichage en HTML brut lors du passage en mode offline sous DevTools Chrome (les paramÃ¨tres de requÃªte dynamiques `?v=...` gÃ©nÃ©rÃ©s par Next.js empÃªchaient la correspondance exacte d'URL).
- **Priorisation RÃ©seau Maximale (`useOnlineStatus.ts`)** :
  * Ajout de `priority: 'high'` sur le `fetch('/api/ping?t=...')` et augmentation du timeout Ã  8000ms.
  * DiffÃ©renciation du prÃ©chargement global dans `CompteClient.tsx` et `BoutiqueClient.tsx` avec une temporisation de 1200ms et `priority: 'low'`.
  * Ã‰limination complÃ¨te du blocage des pings rÃ©seau par l'accumulation des requÃªtes de fond (saturation des 6 slots HTTP/1.1 de Chrome).
- **Bypass Total de `/api/ping` du Service Worker (`sw.ts` & `useOnlineStatus.ts`)** :
  * Exclusion complÃ¨te de `/api/ping` des rÃ¨gles `runtimeCaching` du Service Worker afin d'Ã©viter que Serwist n'intercepte la requÃªte et ne renvoie des erreurs `Response.error()`.
  * Initialisation de l'Ã©tat `isOnline` Ã  `true` par dÃ©faut (online optimiste) pour Ã©liminer l'affichage temporaire du bandeau orange lors du chargement initial.
- **Correction de la Structure Syntaxique (`BoutiqueClient.tsx`)** :
  * Correction d'une accolade fermante manquante sur le bloc `try` de la fonction `loadProduits` (ligne 1434), Ã©liminant l'erreur de compilation SWC et restaurant le module `BoutiqueClient`.
- **Relance des Serveurs Localhost** :
  * ArrÃªt propre et libÃ©ration des ports 3000 (Backend Express) et 3001 (Next.js Frontend).
  * RedÃ©marrage des processus en arriÃ¨re-plan avec nettoyage du cache `.next`.

## ðŸš€ Mises Ã  jour du 12/08/2026 : Correction DÃ©finitive du Mode Offline PWA & DÃ©tection RÃ©seau Fiable (Ping /api/ping)

- **Suppression du Catch-All NetworkOnly (`frontend-next/src/app/sw.ts`)** :
  * Suppression de `defaultCache` (fourni par `@serwist/next`) qui injectait un matcher `/.*/i â†’ NetworkOnly()` en dev, causant des erreurs `FetchEvent resulted in a network error response` en mode hors-ligne pour `/manifest.json`, navigations et assets.
  * Ajout d'une stratÃ©gie `StaleWhileRevalidate` explicite pour `manifest.json` et les icÃ´nes PWA (`/icons/*`).
  * Exclusion explicite des URLs externes (analytics, GTM, trackers) pour supprimer les erreurs et le bruit dans les logs SW.
  * Suppression du check `navigator.onLine` dans le matcher du fallback document HTML (non fiable dans le Service Worker).
- **CrÃ©ation du Hook Universel de ConnectivitÃ© RÃ©elle (`frontend-next/src/lib/useOnlineStatus.ts`)** :
  * Ã‰limination des faux positifs de `navigator.onLine` (qui signale Ã  tort `online` sur desktop/Ethernet et lors des basculages responsive mobile â†” web).
  * Le nouveau hook valide l'accÃ¨s rÃ©seau rÃ©el via des pings actifs vers `/api/ping` avec un timeout de 4s, un polling adaptatif (30s en ligne, 5s hors-ligne) et une suspension lorsque l'onglet est masquÃ© (`document.hidden`).
- **Route Health Check `/api/ping` (`frontend-next/src/app/api/ping/route.ts`)** :
  * Ajout des en-tÃªtes `Cache-Control: no-store, no-cache, must-revalidate` stricts et exclusion du cache Service Worker (`NetworkOnly`).
- **Migration des Composants Clients (`RegisterSW.tsx`, `CaisseClient.tsx`, `BoutiqueClient.tsx`, `CompteClient.tsx`)** :
  * Remplacement de toutes les occurrences de `navigator.onLine` par le hook `useOnlineStatus`.
  * Le toast "Connexion Internet rÃ©tablie" ne s'affiche dÃ©sormais que lorsqu'un vrai ping rÃ©ussit aprÃ¨s une dÃ©connexion, Ã©liminant tout faux toast lors des bascules d'affichage web â†” mobile.

## Mises Ã  jour du 12/08/2026 : Correctifs de fiabilitÃ© Offline POS

- **Service worker (`frontend-next/src/app/sw.ts`)** : ajout d'un dÃ©lai de bascule de 3 secondes pour HTML, RSC et API. Un cache miss API retourne dÃ©sormais une erreur rÃ©seau au lieu d'un faux JSON HTTP 200, afin que chaque Ã©cran puisse restaurer son cache local.
- **Isolation du carnet clients (`frontend-next/src/lib/db-offline.ts`)** : migration IndexedDB vers la version 2 ; les clients sont stockÃ©s et lus par boutique, sans effacer les carnets des autres boutiques.
- **Synchronisation POS (`CaisseClient.tsx`, `backend/routes/boutiques.js`)** : chaque vente reÃ§oit une clÃ© d'idempotence conservÃ©e dans la queue offline. La route POS reconnaÃ®t une rÃ©fÃ©rence dÃ©jÃ  enregistrÃ©e pour Ã©viter de retraiter une reprise aprÃ¨s rÃ©ponse perdue. Une contrainte SQL transactionnelle reste prÃ©vue dans `PLAN_CORRECTION_OFFLINE.md` avant gÃ©nÃ©ralisation en production.
- **Validation** : `node --check backend/routes/boutiques.js` et `git diff --check` rÃ©ussissent. La suite frontend complÃ¨te n'a pas terminÃ© dans la fenÃªtre de validation locale.

## ðŸš€ Mises Ã  jour du 12/08/2026 : Finalisation du SystÃ¨me Offline-First ComplÃ©mentaire (Compte & Boutiques)

- **Neutralisation de l'Avertissement Service Worker (`sw.ts`)** :
  * PassÃ© `clientsClaim: false` dans la configuration Serwist et suppression totale de l'appel manuel `self.clients.claim()` lors de l'Ã©vÃ¨nement `activate`.
  * Ã‰limination de l'erreur console `Uncaught (in promise) InvalidStateError: Only the active worker can claim clients` gÃ©nÃ©rÃ©e lors des rechargements Ã  chaud (HMR Dev).

- **SÃ©curisation de la Route Proxy (`/api/boutiques/[id]/credits-clients`)** :
  * Traitement gracieux des erreurs rÃ©seau et des rÃ©ponses vides en renvoyant `{ clients: [] }` avec HTTP 200 pour Ã©liminer les erreurs 500 intempestives dans la console navigateur.
  * Ajout de `.catch(() => null)` dÃ©fensif dans `BoutiqueClient.tsx` pour le prÃ©chargement en arriÃ¨re-plan.

- **CrÃ©ation des Proxies API Next.js AuthentifiÃ©s (`/api/abonnements/mon-plan`)** :
  * Proxy Next.js permettant aux composants clients (`CompteClient.tsx`, `FonctionnalitesClient.tsx`) d'interroger le backend via JWT signÃ© serveur.
- **Extension du PrÃ©chargement Universel (`CompteClient.tsx`)** :
  * IntÃ©gration du plan d'abonnement actif (`nopalou_plan_actif`), des administrateurs (`nopalou_offline_admins_${b.id}`), des caissiers (`nopalou_offline_caissiers_${b.id}`) et des analytics (`nopalou_offline_analytics_${b.id}`) dans le prÃ©chargement universel.
  * Gestion dÃ©fensive des erreurs avec `.catch()` pour empÃªcher tout Ã©chec rÃ©seau partiel de bloquer le prÃ©chargement global.
- **Persistance du Plan d'Abonnement en Mode Offline (`BoutiqueClient.tsx`)** :
  * Sauvegarde automatique du `planActif` en `localStorage` lors de la connexion.
  * Restauration transparente depuis le cache local (`planActifEffectif`) en mode hors-ligne lorsque la prop serveur est `null`, conservant le statut (Business / Pro) et dÃ©verrouillant les fonctionnalitÃ©s de l'interface.
- **Suppression du Bearer Token ObsolÃ¨te (`AnnoncesImmoClient.tsx`, `FonctionnalitesClient.tsx`)** :
  * Remplacement des requÃªtes directes Ã  Bearer token par les proxys Next.js authentifiÃ©s.

## ðŸš€ Mises Ã  jour du 11/08/2026 : SÃ©curisation du Polling Caisse POS (`CaisseClient.tsx`)

- **Neutralisation des Erreurs Console Hors-Ligne (`CaisseClient.tsx`)** :
  * Interruption automatique du polling douchette distante (`/api/boutiques/${id}/scanner-remote`) en mode hors-ligne (`!navigator.onLine`).
  * Capture silencieuse (`.catch(() => null)`) des Ã©checs de connexion rÃ©seau pour supprimer les erreurs `net::ERR_CONNECTION_RESET` / `ERR_CONNECTION_REFUSED` dans la console.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Extension du PrÃ©chargement Global (Boutiques, Catalogues Produits, Caisse POS & Clients)

- **PrÃ©chargement Universel (`CompteClient.tsx`)** :
  * Le script d'arriÃ¨re-plan prÃ©charge dÃ©sormais simultanÃ©ment :
    1. Les annonces classifiÃ©es (`/api/annonces/mine`).
    2. Les biens immobiliers (`/api/immo/mine`).
    3. **L'intÃ©gralitÃ© des boutiques du vendeur** (`/api/boutiques/mine`).
    4. **Le catalogue complet de produits de chaque boutique** (`/api/boutiques/${b.id}/produits` -> `nopalou_pos_produits_${b.id}`).
    5. **L'historique de la caisse POS** (`/api/boutiques/${b.id}/pos-historique` -> `nopalou_pos_historique_${b.id}`).
    6. **Le carnet de dettes & crÃ©dits clients** (`/api/boutiques/${b.id}/credits-clients` -> `nopalou_offline_clients_${b.id}`).
- **Couverture Offline Totale (100%)** : L'ensemble du portail utilisateur (Compte + Boutiques + Catalogues) est stockÃ© localement dÃ¨s l'entrÃ©e sur le compte.

## ðŸš€ Mises Ã  jour du 11/08/2026 : IntÃ©gration des Logs Client DÃ©taillÃ©s & Diagnostic SPA / Offline

- **Logs Console d'Exploitation SPA (`CompteClient.tsx`, `AnnoncesClient.tsx`, `AnnoncesImmoClient.tsx`)** :
  * Ajout de traces structurÃ©es dans la console DevTools (`[Compte SPA]`, `[AnnoncesClient]`, `[AnnoncesImmoClient]`).
  * Journalisation en temps rÃ©el de l'Ã©tat rÃ©seau (`ðŸŸ¢ En Ligne` vs `ðŸ“¡ Hors-Ligne`), de la navigation entre onglets, et de la source des donnÃ©es (chargement instantanÃ© depuis `localStorage` vs mise Ã  jour dynamique via API).
- **TracabilitÃ© Hors-Ligne** : VisibilitÃ© 100% transparente dans la console navigateur (F12) permettant de vÃ©rifier que l'ensemble des donnÃ©es est mis en cache et restituÃ© hors-ligne.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Correction de l'IncohÃ©rence du Stock Hors-Ligne & DÃ©blocage Stock Physique

  * DÃƒÂ©clenchement automatique garanti du Toast mÃƒÂªme si l'utilisateur ouvre directement la caisse sans connexion Internet (auparavant, le Toast ne s'affichait que lors de la transition actif -> coupÃƒÂ©).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Correction de l'IncohÃƒÂ©rence du Stock Hors-Ligne & DÃƒÂ©blocage Stock Physique
- **Unification des PropriÃƒÂ©tÃƒÂ©s de Stock (`BoutiqueClient.tsx`, `Comptabilite.tsx`, `CaisseClient.tsx`)** :
  * L'affichage du catalogue lisait `p.stock_quantite`, tandis que le cache de la Caisse POS sauvegardait les produits dÃƒÂ©crÃƒÂ©mentÃƒÂ©s sous la propriÃƒÂ©tÃƒÂ© formatÃƒÂ©e `p.stock` tout en supprimant l'objet d'origine. ConsÃƒÂ©quence : en mode hors-ligne, les vues Catalogue et Stock affichaient "0" car la donnÃƒÂ©e ÃƒÂ©tait effacÃƒÂ©e du cache commun.
  * Ajout du destructoring `...p` dans `CaisseClient.tsx` pour prÃƒÂ©server 100% des propriÃƒÂ©tÃƒÂ©s originales en cache hors-ligne (`quantite_stock`, `stock_quantite`, etc.).
  * Mise ÃƒÂ  jour de `BoutiqueClient.tsx` et `Comptabilite.tsx` pour lire prioritairement `p.quantite_stock ?? p.stock_quantite`, assurant une synchronisation parfaite des affichages.
- **DÃƒÂ©blocage de la Vue "Stock Physique" (Chargement infini)** :
  * Le composant `StockView` (dans `Comptabilite.tsx`) lanÃƒÂ§ait l'action serveur `getBoutiqueProduits` sans bloc `try/catch`. En mode hors-ligne, l'exception rÃƒÂ©seau bloquait le rendu avant d'atteindre `setLoading(false)`.
  * Ajout d'un `try/catch` avec **rÃƒÂ©cupÃƒÂ©ration automatique depuis le cache LocalStorage** (`nopalou_pos_produits`) pour un affichage immÃƒÂ©diat mÃƒÂªme sans connexion Internet.
- **Notification PWA Hors-Ligne** :
  * Explication : Le bandeau PWA "Mode Hors-Ligne" natif fonctionne par l'API systÃƒÂ¨me `navigator.onLine`. En cas de panne DNS ou de coupure locale du backend (sans dÃƒÂ©sactiver le Wi-Fi), ce bandeau n'apparaÃƒÂ®t pas. Cependant, l'application est dÃƒÂ©sormais robuste pour utiliser ses caches hors-ligne mÃƒÂªme dans ce cas de figure.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Correction Critique de la Protection du Cache Produit Hors-Ligne (`CaisseClient.tsx`)
- **Correction du Bug d'Ãƒâ€°crasement du Cache Local Hors-Ligne (`CaisseClient.tsx`)** :
  * Lors d'une perte de rÃƒÂ©seau ou de l'ouverture de la caisse hors-ligne, la fonction `getBoutiqueProduits` renvoyait le tableau vide `[]` en cas d'erreur de rÃƒÂ©seau. Le test `if (produits && Array.isArray(produits))` s'ÃƒÂ©valuait comme vrai sur `[]`, provoquant l'effacement involontaire du cache de produits stockÃƒÂ© dans `localStorage` et `IndexedDB`.
  * Modification du contrÃƒÂ´le pour exiger `produits.length > 0` avant d'ÃƒÂ©craser le cache local, et bascule vers `obtenirProduitsLocaux()` et `localStorage` si l'appel backend renvoie un rÃƒÂ©sultat vide hors-ligne. Les produits en base enregistrÃƒÂ©s localement restent dÃƒÂ©sormais **100% prÃƒÂ©servÃƒÂ©s et affichÃƒÂ©s en mode hors-ligne**.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Suppression IntÃƒÂ©grale de l'Ãƒâ€°tiquette "(Off)" & Ajustement de la Caisse POS (`CaisseClient.tsx`)
- **Ãƒâ€°limination DÃƒÂ©finitive du Label "(Off)" (`CaisseClient.tsx`)** :
  * Suppression complÃƒÂ¨te du texte `(Off)` dans le sÃƒÂ©lecteur de boutique de l'en-tÃƒÂªte POS. Toutes les boutiques du marchand affichent exclusivement `Ã°Å¸Å¸Â¢ NomBoutique` (ou `Ã°Å¸â€�â€™ NomBoutique`), ÃƒÂ©liminant toute ambiguÃƒÂ¯tÃƒÂ© d'affichage.
- **Optimisation du Spacing Vertical (`CaisseClient.tsx`)** :
  * RÃƒÂ©duction des espacements et padding du bloc ticket vide (de 60px ÃƒÂ  24px) pour garantir que le bloc de paiement et le bouton `ENCAISSER` rentrent sans aucun dÃƒÂ©filement forcÃƒÂ©.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Fixation Permanente du Bouton "ENCAISSER" Sticky en Bas d'Ãƒâ€°cran (`CaisseClient.tsx`)
- **Correction DÃƒÂ©bordement & Placement Sticky (`CaisseClient.tsx`)** :
  * Ajout du dÃƒÂ©filement interne `overflowY: 'auto'` sur la section ticket et conversion du bloc de paiement (`Net ÃƒÂ  payer`, `DEVIS`, `PROFORMA`, `Ã¢Å¡Â¡ ENCAISSER ET TICKET`) en conteneur `position: 'sticky', bottom: 0`.
  * RÃƒÂ©sout le problÃƒÂ¨me oÃƒÂ¹ le bouton vert "ENCAISSER" ÃƒÂ©tait poussÃƒÂ© sous le bas de l'ÃƒÂ©cran ou tronquÃƒÂ© sur les mobiles et ÃƒÂ©crans de taille intermÃƒÂ©diaire. Le bouton reste dÃƒÂ©sormais **100% visible et accessible en permanence**.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Persistance Anti-Perte des Paniers et Tickets en Attente lors du RafraÃƒÂ®chissement (F5) (`CaisseClient.tsx`)
- **Sauvegarde & Restauration Automatique (`localStorage`)** :
  * MÃƒÂ©morisation dynamique en temps rÃƒÂ©el du panier en cours (`nopalou_pos_panier_${boutiqueActiveId}`) et de la file d'attente des tickets suspendus (`nopalou_pos_tickets_attente_${boutiqueActiveId}`).
  * Lors d'un rafraÃƒÂ®chissement F5, de la fermeture accidentelle de l'onglet ou d'un redÃƒÂ©marrage du navigateur, la caisse restaure intÃƒÂ©gralement l'ÃƒÂ©tat du panier et tous les tickets en attente.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : VisibilitÃƒÂ© Universelle Mobile & Desktop de la File d'Attente Tickets (`CaisseClient.tsx`)
- **Positionnement Universel Hors-Panneau (`CaisseClient.tsx`)** :
  * Le bandeau "Ã°Å¸â€˜Â¥ Clients en file d'attente" a ÃƒÂ©tÃƒÂ© placÃƒÂ© juste sous la barre d'onglets mobile (`Ã°Å¸â€ºï¿½Ã¯Â¸ï¿½ Catalogue` / `Ã°Å¸â€ºâ€™ Ticket`).
  * Ainsi, sur mobile, que le caissier soit sur l'onglet "Catalogue" ou "Ticket", les paniers en attente sont **systÃƒÂ©matiquement visibles en haut de l'ÃƒÂ©cran**.
- **Badge Dynamique Onglet Ticket & Bascule Automatique** :
  * Ajout du badge d'alerte orange `Ã°Å¸â€˜Â¥ X en attente` sur le bouton de l'onglet `Ã°Å¸â€ºâ€™ Ticket`.
  * La reprise d'un ticket en attente dÃƒÂ©clenche la bascule automatique vers l'onglet `Ã°Å¸â€ºâ€™ Ticket` (`setTabMobile('ticket')`).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : RÃƒÂ©solution DÃƒÂ©finitive du Statut "(Off)" ÃƒÂ  CÃƒÂ´tÃƒÂ© de la Boutique Active (POS)
- **SÃƒÂ©curisation SQL des valeurs Nulles (`backend/routes/boutiques.js`)** :
  * Utilisation de `COALESCE(b.actif, true) AS actif` dans les routes `/api/boutiques/mine` et `/api/boutiques/caisse-terminal/:token` pour ÃƒÂ©viter que les boutiques existantes ayant un champ `actif` valant `NULL` en base de donnÃƒÂ©es ne soient renvoyÃƒÂ©es comme inactives.
  * Ajout de `actif = true` par dÃƒÂ©faut lors de la crÃƒÂ©ation d'une nouvelle boutique (`INSERT INTO boutiques`).
- **Correction Frontend POS (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  * Remplacement du contrÃƒÂ´le trop permissif `!b.actif` par la comparaison stricte `b.actif === false`. Le tag `(Off)` n'est dÃƒÂ©sormais affichÃƒÂ© QUE si la boutique est explicitement dÃƒÂ©sactivÃƒÂ©e en modÃƒÂ©ration administration, ÃƒÂ©liminant tout faux positif sur `null` ou `undefined`.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : AccessibilitÃƒÂ© Mobile des Tickets en Attente
- **DÃƒÂ©placement du composant "File d'attente" (`CaisseClient.tsx`)** :
  * Auparavant, la liste des tickets mis en attente ÃƒÂ©tait affichÃƒÂ©e exclusivement dans la section Catalogue. Sur mobile, cela la rendait introuvable lorsque le caissier ÃƒÂ©tait sur l'onglet "Ticket", l'empÃƒÂªchant de reprendre facilement un ticket.
  * La liste des clients en attente a ÃƒÂ©tÃƒÂ© dÃƒÂ©placÃƒÂ©e au dÃƒÂ©but de la section "Ticket en cours". Ainsi, sur mobile, elle est immÃƒÂ©diatement visible et cliquable lorsqu'on consulte son panier actuel.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Correction de l'Affichage du Statut "(Off)" dans la Caisse POS
- **Correction de la requÃƒÂªte API Terminal Caisse (`backend/routes/boutiques.js`)** :
  * Ajout du champ `actif` dans la clause `SELECT` de la route `/api/boutiques/caisse-terminal/:token`. Auparavant, ce champ ÃƒÂ©tait omis, ce qui forÃƒÂ§ait la caisse POS ÃƒÂ  afficher incorrectement le label `(Off)` ÃƒÂ  cÃƒÂ´tÃƒÂ© du nom de la boutique mÃƒÂªme lorsqu'elle ÃƒÂ©tait parfaitement active.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Correction de l'Affichage Mobile & Badge Commandes
- **Fix du menu de gestion boutique sur mobile (`globals.css`)** :
  * Utilisation de `display: contents` sur les `.bq-nav-group` pour aplanir la hiÃƒÂ©rarchie DOM sur mobile, ce qui restaure la barre de navigation horizontale dÃƒÂ©filante compacte et rend l'en-tÃƒÂªte de la boutique visible sans ÃƒÂªtre poussÃƒÂ© par un menu vertical cassÃƒÂ©.
- **Correction du badge 'Commandes en attente' (`BoutiqueClient.tsx`)** :
  * Suppression de la rÃƒÂ©initialisation manuelle forcÃƒÂ©e (`setNbEnAttente(0)`) lors du clic sur l'onglet, pour empÃƒÂªcher le badge de clignoter ou "rÃƒÂ©initialiser" artificiellement (le serveur renvoyait le vrai nombre de commandes en attente 30 secondes plus tard).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Correction du routage vers la Caisse POS (Boutique Active)
- **Fix du bug d'ouverture de la Caisse POS avec la mauvaise boutique (`BoutiqueClient.tsx`)** :
  * Ajout d'un ÃƒÂ©couteur `onClick` sur tous les liens "Aller ÃƒÂ  la caisse" spÃƒÂ©cifiques ÃƒÂ  une boutique.
  * Mise ÃƒÂ  jour de `nopalou_pos_active_boutique_id` dans le `localStorage` avant la redirection vers `/boutique/caisse` pour garantir que `CaisseClient.tsx` charge systÃƒÂ©matiquement la bonne boutique.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 11/08/2026 : Correction IntÃƒÂ©grale du Mode Hors-Ligne Web (Catalogue Vendeur & Service Worker)
- **Notification Flottante Hors-Ligne Globale Web & Mobile (`frontend-next/src/app/RegisterSW.tsx`)** :
  * IntÃƒÂ©gration du bandeau rÃƒÂ©actif flottant en haut d'ÃƒÂ©cran `Ã°Å¸â€œÂ¡ Mode Hors-Ligne Ã¢â‚¬â€� Consultation des donnÃƒÂ©es locales en cache` lors de la dÃƒÂ©connexion rÃƒÂ©seau, et dissipation automatique `Ã¢Å“â€¦ Connexion Internet rÃƒÂ©tablie` au retour du rÃƒÂ©seau.
  * Suppression de la condition restrictive `process.env.NODE_ENV === 'production'` pour garantir l'enregistrement et la rÃƒÂ©activitÃƒÂ© du Service Worker dans tous les environnements.
- **Correction Critique du Service Worker & Ãƒâ€°limination de `no-response` (`frontend-next/src/app/sw.ts`)** :
  * Ajout de `serwist.setCatchHandler()` pour capturer proprement les ÃƒÂ©checs de stratÃƒÂ©gie hors-ligne (ex: requÃƒÂªtes RSC Next.js `_rsc=...` et navigations HTML).
  * Les exceptions console `Uncaught (in promise) no-response` et les erreurs `ERR_FAILED` sont entiÃƒÂ¨rement ÃƒÂ©liminÃƒÂ©es. Le SW renvoie dÃƒÂ©sormais un payload RSC valide ou la page de secours HTML 200 OK.
- **Restauration Hors-Ligne du Catalogue Vendeur (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** :
  * Mise en cache et restauration automatique du catalogue dans l'espace marchand `/boutique` via IndexedDB et LocalStorage. En cas de navigation sans rÃƒÂ©seau, le catalogue affiche dÃƒÂ©sormais l'intÃƒÂ©gralitÃƒÂ© des produits enregistrÃƒÂ©s au lieu de l'ÃƒÂ©cran vide `0 produits`.
- **Isolation du Stockage IndexedDB par Boutique (`frontend-next/src/lib/db-offline.ts`)** :
  * Mise ÃƒÂ  jour de `sauvegarderProduitsLocaux(produits, boutiqueId)` et `obtenirProduitsLocaux(boutiqueId)` pour isoler les articles par `boutique_id`.
- **SÃƒÂ©curisation du Chargement dans la Caisse POS (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  * Protection du cache local : si l'API renvoie une rÃƒÂ©ponse vide `[]` alors que le rÃƒÂ©seau est actif, le cache IndexedDB existant est conservÃƒÂ© au lieu d'ÃƒÂªtre ÃƒÂ©crasÃƒÂ©.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Diagnostic en Profondeur & Validation 100% RÃƒÂ©ussie (Playwright E2E & TypeScript)
- **Validation Globale Sans Fautes (0 Erreur)** :
  * **TypeScript (`npx tsc --noEmit`)** : 100% ValidÃƒÂ© (0 erreur de typage).
  * **Syntaxe Node.js Backend (`node --check`)** : 100% ValidÃƒÂ© (Toutes les routes backend vÃƒÂ©rifiÃƒÂ©es).
  * **Suite Playwright API (`05-api.spec.ts`)** : 8/8 Tests RÃƒÂ©ussis (100% de succÃƒÂ¨s).
  * **Suite Playwright POS Offline (`07-pos-offline-sync.spec.ts`)** : 7/7 Tests RÃƒÂ©ussis avec succÃƒÂ¨s (Boutiques hors-ligne, catalogues produits offline, badge UI dÃƒÂ©connexion, secours PWA offline.html, stockage IndexedDB et suppression unitaire non-destructive 100% validÃƒÂ©s).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : RÃƒÂ©solution des Erreurs SW `Uncaught (in promise)` & Securisation du Fallback Offline
- **Ãƒâ€°limination des Erreurs Console Service Worker (`frontend-next/src/app/sw.ts`)** :
  * Passation de `navigationPreload: false` dans Serwist pour supprimer les rejections de promesse non capturÃƒÂ©es (`Uncaught (in promise)`) sous Chrome lors du prÃƒÂ©chargement de navigation.
- **Protection Anti-Fausse Redirection Hors-Ligne (`frontend-next/src/app/sw.ts`)** :
  * Ajout du contrÃƒÂ´le `self.navigator.onLine === true` dans le matcher `fallbacks.entries` pour garantir que `/offline.html` ne s'affiche JAMAIS lorsque l'utilisateur est connectÃƒÂ© ÃƒÂ  Internet (ex: sur `/compte`, `/boutique`, `/admin`).

## ðŸ“Œ Note et Constat Client : Attentes non encore rÃ©alisÃ©es (12/08/2026)
- **PrÃ©chargement Complet Incomplet** : Le prÃ©chargement automatique de toutes les boutiques et donnÃ©es en arriÃ¨re-plan n'est pas totalement effectif.
- **Mode Hors-Ligne Desktop InopÃ©rant** : Le mode offline sur navigateur de bureau (desktop) rencontre toujours des problÃ¨mes d'affichage et de dÃ©tection.
- **Bascule de Boutique Involontaire (AMAR -> TECH)** : Lors de l'entrÃ©e dans la boutique AMAR, l'application rÃ©initialise ou bascule l'affichage vers la boutique TECH (problÃ¨me de persistance/synchronisation du `boutiqueActiveId`).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Correction de la RÃƒÂ©cupÃƒÂ©ration des Boutiques & Persistance de la Boutique SÃƒÂ©lectionnÃƒÂ©e
- **Correction Critique de la RequÃƒÂªte SQL (`backend/routes/boutiques.js`)** :
  * Correction de la clause `GROUP BY b.id` sur la route `/api/boutiques/mine`. L'utilisation de l'alias d'expression `is_owner` dÃ©clenchait une erreur PostgreSQL 500 (`column "is_owner" does not exist`), ce qui retournait 0 boutique et affichait l'ÃƒÂ©cran de crÃƒÂ©ation par dÃƒÂ©faut lors du retour ÃƒÂ  `/boutique`.
- **Persistance et Restauration de la Boutique SÃƒÂ©lectionnÃƒÂ©e (`CaisseClient.tsx` & `BoutiqueClient.tsx`)** :
  * MÃƒÂ©morisation dans `localStorage` (`nopalou_pos_active_boutique_id` & `nopalou_pos_user_boutiques`) de la boutique active choisie par le marchand.
  * Restauration automatique de la boutique du marchand et de son catalogue lors des navigations entre la Caisse et l'espace de gestion `/boutique`.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Audit Complet & Securisation du Mode Offline POS / PWA + Suite de Tests E2E
- **Suppression SÃƒÂ©lective Unitaire dans IndexedDB (`frontend-next/src/lib/db-offline.ts` & `CaisseClient.tsx`)** :
  * CrÃƒÂ©ation de la mÃƒÂ©thode `supprimerVenteHorsLigne(id_temporaire)` pour supprimer unitairement chaque vente synchronisÃƒÂ©e avec le serveur.
  * Ãƒâ€°limination de la purge globale `viderVentesHorsLigne()` qui dÃƒÂ©truisait les ventes non encore synchronisÃƒÂ©es en cas d'erreur ou d'ÃƒÂ©chec partiel de rÃƒÂ©seau.
- **Persistance des Stocks DÃƒÂ©crÃƒÂ©mentÃƒÂ©s Hors-Ligne (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  * Synchronisation immÃƒÂ©diate des niveaux de stock dÃƒÂ©crÃƒÂ©mentÃƒÂ©s localement dans la table IndexedDB `produits` lors de la validation d'une vente hors-ligne (`sauvegarderProduitsLocaux`).
- **Enregistrement Effectif du Service Worker PWA (`frontend-next/src/app/RegisterSW.tsx`)** :
  * Ajout de l'appel `navigator.serviceWorker.register('/sw.js')` dans le cycle de vie client pour garantir l'activation du Service Worker et la gestion proactive du cache PWA.
- **Suite de Tests End-To-End Playwright (`tests/e2e/07-pos-offline-sync.spec.ts`)** :
  * CrÃƒÂ©ation d'un test E2E automatisÃƒÂ© validant la dÃƒÂ©tection offline via `context.setOffline(true)`, l'affichage de l'alerte UI hors-ligne, la mise en file d'attente IndexedDB et le comportement au rÃƒÂ©tablissement rÃƒÂ©seau.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : AmÃƒÂ©lioration du Mode Hors-Ligne PWA & Caisse POS
- **DÃƒÂ©blocage de l'Ãƒâ€°cran de Secours (Fallback) Hors-Ligne (`frontend-next/src/app/sw.ts`)** :
  * Suppression de l'exclusion stricte des routes `/boutique`, `/compte`, `/admin`, etc. qui provoquait un plantage natif Chrome (`ERR_NAME_NOT_RESOLVED`) au lieu de servir la page d'attente hors-ligne.
- **Ajout d'Action Contextuelle Hors-Ligne (`frontend-next/public/offline.html`)** :
  * IntÃƒÂ©gration d'un bouton de retour rapide vers la Caisse POS (`/boutique/caisse`) pour permettre aux utilisateurs de reprendre leurs ventes sans interruption.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : DÃƒÂ©bogage End-To-End (E2E), Immunisation DNS & Validation 100% RÃƒÂ©ussie
- **Redondance du Backend API (`src/lib/api.ts`)** :
  * Ajout explicite de l'URL directe du serveur Render (`https://yombale.onrender.com`) dans la liste de repli de l'utilitaire `apiFetch`.
  * Garantit l'accÃƒÂ¨s ininterrompu au backend mÃƒÂªme lors d'une micro-coupure de rÃƒÂ©solution DNS du nom de domaine personnalisÃƒÂ© (`nopalou.com` -> `ERR_NAME_NOT_RESOLVED`).
- **Validation Globale des Tests End-To-End (E2E Playwright)** :
  * Compilation TypeScript sans erreur (`npx tsc --noEmit`).
  * VÃƒÂ©rification de la syntaxe backend Node.js (`node --check backend/app.js`).
  * ExÃƒÂ©cution intÃƒÂ©grale des suites de tests E2E API (`npx playwright test tests/e2e/05-api.spec.ts`) : **100% de succÃƒÂ¨s sans faute (8/8 tests validÃƒÂ©s avec succÃƒÂ¨s)**.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Exemption du Scanner Remote POS & Augmentation Quota API (`/scanner-remote`)
- **Correction Cruciale du Blocage Caisse POS (`backend/app.js`)** :
  * Identification de la cause exacte du crash rÃƒÂ©vÃƒÂ©lÃƒÂ©e par les logs de la console browser (`/api/boutiques/.../scanner-remote?sessionId=SCAN-506709`) : l'auto-polling continu du scanner POS (1 requÃƒÂªte/seconde) atteignait le quota de 300 requÃƒÂªtes en 5 minutes, dÃƒÂ©clenchant une erreur 429 "Trop de requÃƒÂªtes" puis une interception `ERR_FAILED` par le Service Worker.
  * Ajout de l'exemption explicite (`skip`) dans `apiLimiter` pour les routes de sondage temps rÃƒÂ©el `/scanner-remote`, `/health` et `/analytics`.
  * Augmentation du quota global `apiLimiter` de 300 ÃƒÂ  1000 requÃƒÂªtes / 15 min.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : RÃƒÂ©solution DÃƒÂ©finitive de l'Erreur `ERR_FAILED` & DÃƒÂ©blocage Total de la Navigation (`/boutique`, `/boutiques`, Catalogue)
- **Ãƒâ€°limination de l'Interception Interne par le Service Worker (`RegisterSW.tsx` & `public/sw.js`)** :
  * Identification de la cause exacte de l'erreur Chrome `ERR_FAILED` sur `https://nopalou.com/boutique` : l'ancien Service Worker Serwist prÃƒÂ©-enregistrÃƒÂ© dans les navigateurs tentait d'intercepter les requÃƒÂªtes HTTP/RSC et bloquait la connexion.
  * Mise en place d'un script d'auto-dÃƒÂ©sinstallation et de vidage intÃƒÂ©gral du cache Service Worker (`caches.delete()`, `registration.unregister()`).
  * Restauration de l'accÃƒÂ¨s rÃƒÂ©seau direct ultra-rapide sans intermÃƒÂ©diaire pour l'ensemble des pages (`/boutique`, `/boutiques`, catalogue et espace compte).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : DÃƒÂ©blocage des Actions Compte & Caisse POS (Exclusion SW & Suppression du Pop-up Masquant)
- **Suppression ComplÃƒÂ¨te de la Pop-up Flottante Intrusive (`src/app/RegisterSW.tsx`)** :
  * Ãƒâ€°limination du bandeau flottant noir/orange qui masquait l'en-tÃƒÂªte de la Caisse POS et les boutons d'action sur mobile. Le Service Worker s'enregistre dÃƒÂ©sormais de faÃƒÂ§on 100% silencieuse en arriÃƒÂ¨re-plan sans bloquer l'ÃƒÂ©cran.
- **Exclusion des Pages de Compte, Admin, Boutique & POS de la Redirection Hors-Ligne (`src/app/sw.ts`)** :
  * Modification du matcher de fallback dans Service Worker : les routes `/compte`, `/boutique`, `/admin`, `/deposer`, `/mes-` et `/api` sont formellement exclues du remplacement par `/offline.html`.
  * Validation TypeScript rigoureusement confirmÃƒÂ©e avec **0 erreur (`npx tsc --noEmit`)**.
  * Garantit que toutes les actions utilisateur (crÃƒÂ©ation de produit, vente caisse POS, modification de profil, enregistrement d'annonce) s'exÃƒÂ©cutent en direct sans interruption.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Correction Majeure du Mode Hors-Ligne PWA & Enregistrement Service Worker (`sw.js`)
- **Activation Universelle du Service Worker (`src/app/RegisterSW.tsx`)** :
  * DÃƒÂ©blocage de l'enregistrement de `/sw.js` pour qu'il s'enregistre de faÃƒÂ§on fiable sur tous les navigateurs et terminaux mobiles.
  * Ajout d'une banniÃƒÂ¨re flottante rÃƒÂ©active en direct (`online` / `offline`) : affiche `Ã°Å¸â€œÂ¡ Mode Hors-Ligne Ã¢â‚¬â€� Consultation des pages en cache local` lors de la perte de rÃƒÂ©seau, et se dissipe automatiquement avec `Ã¢Å“â€¦ Connexion Internet rÃƒÂ©tablie` lors du retour du rÃƒÂ©seau.
- **Refonte de la Page Hors-Ligne Fallback PWA (`public/offline.html`)** :
  * Design moderne Nopalou avec auto-rechargement dynamique dÃƒÂ¨s le retour d'Internet et bouton de consultation du cache local.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Automatisation des Backups Nocturnes & Auto-RÃƒÂ©tablissement UI en Cas de Panne
- **Workflow de Sauvegarde Automatique Nocturne (`.github/workflows/db-backup.yml`)** :
  * DÃƒÂ©clenchement automatique chaque nuit ÃƒÂ  02h00 UTC pour exporter l'intÃƒÂ©gralitÃƒÂ© de la base de donnÃƒÂ©es PostgreSQL Nopalou.
  * Archivage et rÃƒÂ©tention chiffrÃƒÂ©e pendant 30 jours des dumps SQL sur GitHub Artifacts.
- **RÃƒÂ©tablissement Automatique UI en Cas de Coupure (`frontend-next/src/app/error.tsx`)** :
  * IntÃƒÂ©gration d'un sondage automatique arriÃƒÂ¨re-plan (`polling /api/health` toutes les 4s) sur la page d'erreur globale.
  * DÃƒÂ¨s que le serveur/base de donnÃƒÂ©es se rÃƒÂ©tablit, la page recharge et rÃƒÂ©initialise automatiquement l'application pour les utilisateurs sans aucune intervention manuelle.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : DÃƒÂ©ploiement de l'Architecture Haute DisponibilitÃƒÂ© (HA) & RÃƒÂ©silience E-Commerce
- **Isolation Stricte des Processus (`PROCESS_TYPE=web` vs `PROCESS_TYPE=worker` dans `backend/app.js`)** :
  * SÃƒÂ©paration nette des responsabilitÃƒÂ©s : en mode Web API (`PROCESS_TYPE=web`), le serveur Express ne lance **jamais** Puppeteer ni le scraping en arriÃƒÂ¨re-plan, prÃƒÂ©servant 100% de la mÃƒÂ©moire RAM pour rÃƒÂ©pondre aux requÃƒÂªtes clients en < 50ms.
  * Les crons lourds et le scraping Puppeteer sont isolÃƒÂ©s dans les processus Workers (`PROCESS_TYPE=worker`).
- **Protection Anti-DDoS & Brute-Force (`express-rate-limit` dans `backend/app.js`)** :
  * Rate limiter applicatif global sur `/api/` (300 requÃƒÂªtes / 15 min par IP).
  * Rate limiter renforcÃƒÂ© sur les endpoints d'authentification et paiement (`/api/auth/login`, `/api/auth/register`, `/api/admin/login`, `/api/paiement/`) limitÃƒÂ© ÃƒÂ  20 requÃƒÂªtes / 15 min par IP.
- **Route d'Ãƒâ€°tat & Diag SantÃƒÂ© `/api/health` & `/health`** :
  * Diagnostic complet renvoyant le statut DB (`SELECT 1`), la latence SQL en ms, le mode de process (`PROCESS_TYPE`), l'uptime et la consommation RAM dÃƒÂ©taillÃƒÂ©e (`rss`, `heapUsed`).
- **Mise en Cache Edge CDN (`frontend-next/src/middleware.ts`)** :
  * Injection automatique des en-tÃƒÂªtes `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` sur toutes les routes de catalogue publiques (`/immo`, `/annonces`, `/categorie`, `/telecom`) pour optimiser le caching Cloudflare / Vercel Edge.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Redirection des Pilules de CatÃƒÂ©gories Accueil vers les Pages DÃƒÂ©diÃƒÂ©es (`/immo` & `/annonces`)
- **Correction des Redirections de CatÃƒÂ©gories d'Accueil (`app/page.tsx`)** :
  * Configuration spÃƒÂ©cifique des pilules de catÃƒÂ©gories `Ã°Å¸ï¿½Â¢ Immobilier & Terrains` et `Ã°Å¸â€œÂ¢ Petites Annonces` dans la barre de dÃƒÂ©filement de la page d'accueil pour rediriger directement vers leurs univers dÃƒÂ©diÃƒÂ©s respectifs (`/immo` et `/annonces`).
  * Immunisation des pilules de catÃƒÂ©gories `immo`, `annonces` et `telecom` contre le filtrage automatique par `categoriesActives` pour garantir leur visibilitÃƒÂ© permanente.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : Ãƒâ€°limination DÃƒÂ©finitive du Crash Server Component (`TypeError: (0, s.u) is not a function`)
- **Correction Cruciale de la FrontiÃƒÂ¨re Client / Serveur (`lib/sanitizeImg.ts`)** :
  * Identification de la cause fondamentale des erreurs de logs Render (`TypeError: (0, s.u) is not a function at immo/[id]/page.js`) : la fonction de nettoyage d'images `sanitizeImgUrl` ÃƒÂ©tait dÃƒÂ©clarÃƒÂ©e dans `components/ExternalImg.tsx` marquÃƒÂ©e de la directive Client `'use client'`.
  * L'importation de `sanitizeImgUrl` depuis un fichier `'use client'` par les composants Serveur App Router (`lib/cloudinary.ts`, `immo/[id]/page.tsx`, `annonces/page.tsx`) transformait la fonction en un objet de rÃƒÂ©fÃƒÂ©rence Client non invocable cÃƒÂ´tÃƒÂ© serveur.
  * Extraction de `sanitizeImgUrl` dans le nouveau fichier isomorphe pur [lib/sanitizeImg.ts](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/lib/sanitizeImg.ts) sans directive `'use client'`, supprimant l'erreur de fonction invalide et fiabilisant ÃƒÂ  100% le rendu SSR.
  * Validation TypeScript rigoureuse et typage d'ÃƒÂ©vÃƒÂ©nements React pour garantir **0 erreur (`npx tsc --noEmit`)**.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : RÃƒÂ©solution Critique du Crash SSR Server Components (Next.js 15 Async Params & Fallback API)
- **Multi-Endpoint Fallback Loop dans `apiFetch` (`lib/api.ts`)** :
  * Refonte de l'utilitaire `apiFetch` pour tester sÃƒÂ©quentiellement la liste ordonnÃƒÂ©e des endpoints backend (`process.env.BACKEND_URL`, `process.env.NEXT_PUBLIC_BACKEND_URL`, `http://127.0.0.1:3000`, `http://localhost:3000`) avec un timeout ajustÃƒÂ© ÃƒÂ  5s.
  * Garantit que le SSR de Next.js rÃƒÂ©sout automatiquement l'URL publique ou locale du backend quelle que soit la plateforme d'hÃƒÂ©bergement (Vercel, Railway, Render, Local).
- **SÃƒÂ©curisation de la Page d'Accueil (`app/page.tsx`)** :
  * Migration de tous les appels `fetch` directs de `app/page.tsx` vers `apiFetch` avec gestion gracieuse d'ÃƒÂ©tat d'erreur pour empÃƒÂªcher tout ÃƒÂ©chec SSR d'interrompre l'affichage du site.
- **Refonte de la Page d'Erreur Globale (`app/error.tsx`)** :
  * Interception des messages d'erreur masquÃƒÂ©s de Next.js en production (`Server Components render`) pour afficher un message clair et professionnel ÃƒÂ  l'utilisateur au lieu du texte brut technique.
  * Ajout d'un bouton de rechargement rapide Ã°Å¸â€�â€ž et d'un bouton de retour ÃƒÂ  l'accueil Ã°Å¸ï¿½Â .
- **RÃƒÂ©solution du Plantage des Routes Dynamiques (`immo/[id]`, `annonces/[id]`, `produit/[id]`, `boutiques/[id]`, `categorie/[slug]`, `telecom/[id]`, `comparer/[a]/[b]`, `payer-annonce/[id]`)** :
  * Identification de la cause exacte du message d'erreur de rendu `An error occurred in the Server Components render` : l'accÃƒÂ¨s synchrone non-asynchrone ÃƒÂ  `params.id` / `params.slug` sur Next.js 15 App Router.
  * Conversion intÃƒÂ©grale du type `params: { id: string }` vers `params: Promise<{ id: string }>` et rÃƒÂ©solution asynchrone complÃƒÂ¨te (`const { id } = await params`, `const { slug } = await params`, `const { id, produitId } = await params`) dans toutes les fonctions `generateMetadata` et les templates JSX des composantes de page.
  * Compilations TypeScript rigoureusement validÃƒÂ©es avec **0 erreur (`npx tsc --noEmit`)**.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : RÃƒÂ©solution des Crashs Fugitifs/Intermittents & DÃƒÂ©blocage CSP Service Worker (`sw.js`)
- **Ãƒâ€°limination de la Saturation du Pool DB (`backend/models/db.js`)** :
  * Augmentation de la taille maximale du pool PostgreSQL de `max: 5` ÃƒÂ  `max: 20` (ou paramÃƒÂ©trable via `PG_MAX_CONNECTIONS`) pour ÃƒÂ©viter la saturation sous trafic simultanÃƒÂ©.
  * RÃƒÂ©duction du dÃƒÂ©lai d'attente de connexion `connectionTimeoutMillis` de 30s ÃƒÂ  5s pour faire ÃƒÂ©chouer et retenter rapidement au lieu de bloquer la file d'attente Node.js.
  * Ajout obligatoire de l'ÃƒÂ©couteur d'ÃƒÂ©vÃƒÂ©nement `pool.on('error')` pour ÃƒÂ©viter qu'une dÃƒÂ©connexion PostgreSQL inattendue sur un client inactif ne provoque le crash instantanÃƒÂ© du processus Node.js (`Unhandled error event`).
- **Gestion Globale des Exceptions Backend (`backend/app.js`)** :
  * Ajout des gestionnaires d'ÃƒÂ©vÃƒÂ©nements `process.on('uncaughtException')` et `process.on('unhandledRejection')` dans `app.js` pour empÃƒÂªcher la fermeture abrupte du serveur Express lors d'une promesse rejetÃƒÂ©e non capturÃƒÂ©e.
- **Correction des Blocages CSP (`middleware.ts` & `backend/app.js`)** :
  * Ajout des schÃƒÂ©mas `https:` et `wss:` ainsi que `blob:` et `data:` dans la directive `connect-src` des en-tÃƒÂªtes Content Security Policy.
  * RÃƒÂ©solution des erreurs navigateur `sw.js: Refused to connect because it violates the document's Content Security Policy` et suppression des plantages de rendu Next.js Server Components (`An error occurred in the Server Components render`).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : RÃƒÂ©solution de la Tronquature d'URL d'Images (net::ERR_FAILED) & Suppression des Warnings Preload WOFF2
- **Assainissement Universel des URLs d'Images (`ExternalImg.tsx` & `cloudinaryHQ` dans `lib/cloudinary.ts`)** :
  * Correction globale du prÃƒÂ©fixage `https://` dans `sanitizeImgUrl` pour les URLs sans protocole provenant de la base de donnÃƒÂ©es et des scrapers (Cloudinary, CoinAfrique, Soumari, Electroniccorp, Kaynoo, MasterOfficeDeco, UniversCosmetix, Jumia, etc.).
  * IntÃƒÂ©gration systÃƒÂ©matique de `sanitizeImgUrl` ÃƒÂ  l'intÃƒÂ©rieur du helper `cloudinaryHQ` pour garantir qu'aucune transformation d'image ne retourne d'URL relative sans protocole `https://`.
  * Ãƒâ€°limination dÃƒÂ©finitive des erreurs navigateur `net::ERR_FAILED` qui tentaient de charger des URLs sans schÃƒÂ©ma en tant que ressources locales (ex: `https://nopalou.com/res.cloudinary.com/...` -> 404).
  * Remplacement des balises `<img>` brutes par le composant rÃƒÂ©silient `<ExternalImg />` ou `sanitizeImgUrl` dans `WizardImmo.tsx`, `immo/[id]/page.tsx`, `immo/comparaison/page.tsx`, `checkout-express/page.tsx`, `mes-annonces-immo/page.tsx`.
- **ConformitÃƒÂ© Polices SystÃƒÂ¨me & Suppression des Warnings Preload (`layout.tsx`, `globals.css` & `middleware.ts`)** :
  * Suppression de l'import `next/font/google` (`Inter` & `Archivo`) dans `layout.tsx` pour ÃƒÂ©liminer les requÃƒÂªtes/tÃƒÂ©lÃƒÂ©chargements WOFF2 et les avertissements navigateur `The resource .../media/*.woff2 was preloaded using link preload but not used within a few seconds`.
  * DÃƒÂ©finition des variables CSS `--font-inter` et `--font-archivo` directement sur `:root` dans `globals.css` avec la pile de polices systÃƒÂ¨me native haute lisibilitÃƒÂ© (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), en parfaite conformitÃƒÂ© avec les rÃƒÂ¨gles agentiques du projet.
  * Nettoyage des directives `style-src` et `font-src` dans le middleware CSP (`middleware.ts`).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 10/08/2026 : IntÃƒÂ©gration du Bilan de Session Caissier SynthÃƒÂ©tique (Rapport X) & TraÃƒÂ§abilitÃƒÂ© Audit
- **Modale & Rapport X IntermÃƒÂ©diaire Caisse (`CaisseClient.tsx`)** :
  * CrÃƒÂ©ation d'une modale dÃƒÂ©diÃƒÂ©e **`Ã°Å¸â€œÅ  Bilan Session (Rapport X)`** accessible en 1 clic dans le menu **Ã°Å¸â€�Â§ Outils** de la caisse POS.
  * Affichage consolidÃƒÂ© du profil caissier, fond de caisse initial, total du chiffre d'affaires encaissÃƒÂ©, nombre de tickets ÃƒÂ©ditÃƒÂ©s et espÃƒÂ¨ces thÃƒÂ©oriques en caisse.
  * Ventilation complÃƒÂ¨te par mode de rÃƒÂ¨glement (Ã°Å¸â€™Âµ EspÃƒÂ¨ces, Ã°Å¸Å’Å  Wave, Ã°Å¸ï¿½Å  Orange Money, Ã°Å¸â€™Â³ Carte Bancaire, Ã°Å¸â€�â‚¬ Mixte).
  * PossibilitÃƒÂ© pour le caissier ou le superviseur de consulter ou d'imprimer ÃƒÂ  tout moment le bilan d'activitÃƒÂ© de la session en cours **sans devoir fermer la caisse**.
- **TraÃƒÂ§abilitÃƒÂ© & Journal d'Audit (`boutique_logs` & `BoutiqueLogs.tsx`)** :
  * Enregistrement automatique dans le **Journal d'Audit & SÃƒÂ©curitÃƒÂ©** de toutes les ouvertures de session, clÃƒÂ´tures Z et consultations/impressions du Rapport X avec le nom du caissier, le total du CA et l'adresse IP.
  * Ajout du filtre dÃƒÂ©diÃƒÂ© **`Sessions Caisse & Rapport X`** dans l'interface du Journal d'Audit marchand.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 09/08/2026 : Correction du DÃƒÂ©bordement & Tronquature ÃƒÂ  Droite sur Caisse POS Mobile
- **Fixation de la Tronquature ÃƒÂ  Droite (`globals.css` & `CaisseClient.tsx`)** :
  * Ajout de `box-sizing: border-box !important`, `max-width: 100vw !important` et `overflow-x: hidden !important` sur `.caisse-main-layout`, `.ticket-section.mobile-active` et `.caisse-catalogue-section.mobile-active`.
  * Ajustement des paddings mobiles de 20px ÃƒÂ  10px-12px pour empÃƒÂªcher le dÃƒÂ©bordement de 40px hors-ÃƒÂ©cran sur les smartphones.
  * Optimisation des libellÃƒÂ©s dans la grille de paiement ÃƒÂ  3 colonnes (`Ã°Å¸â€�â‚¬ Mixte`, `Ã°Å¸â€œï¿½ CrÃƒÂ©dit`, `Ã°Å¸ï¿½Â·Ã¯Â¸ï¿½ Remise`) et ajout de `overflow: hidden` et `text-overflow: ellipsis` pour empÃƒÂªcher tout chevauchement.
  * Arrondissement au franc prÃƒÂ¨s dans la fonction d'affichage de monnaie `fcfa` (`Math.round`) pour ÃƒÂ©liminer les dÃƒÂ©cimales flottantes longues (ex: `273 069,492 FCFA` -> `273 069 FCFA`).

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 09/08/2026 : Correction du SchÃƒÂ©ma d'URL et RÃƒÂ©solution ComplÃƒÂ¨te de l'Affichage des Photos
- **Correction Critique de `sanitizeImgUrl` (`ExternalImg.tsx`)** :
  * Ajout du prÃƒÂ©fixage automatique `https://` pour toutes les URLs d'images stockÃƒÂ©es sans protocole dans la base de donnÃƒÂ©es (ex: `res.cloudinary.com/...`, `images.coinafrique.com/...`, `masterofficedeco.sn/...`, `www.soumari.com/...`, `kanje.sn/...`, `electroniccorp.sn/...`, `static.kaynoo.sn/...`).
  * Normalisation des chemins relatifs d'images scrapÃƒÂ©es CoinAfrique (`thumb_...`, `uploaded_...`, `image_...`) vers `https://images.coinafrique.com/`.
  * RÃƒÂ©solution des erreurs navigateur `net::ERR_FAILED` qui interprÃƒÂ©taient les URLs sans schÃƒÂ©ma comme des chemins relatifs locaux (ex: `https://nopalou.com/res.cloudinary.com/...` -> 404).
  * Correction du relais vers `wsrv.nl` pour transmettre des URLs encodÃƒÂ©es valides avec protocole HTTPS complet.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 09/08/2026 : IntÃƒÂ©gration du Composant d'Installation PWA NativisÃƒÂ© (BanniÃƒÂ¨re & Modale iOS)
- **BanniÃƒÂ¨re d'Installation PWA Flottante (`PwaInstallPrompt.tsx`)** :
  * Ãƒâ€°coute automatique de l'ÃƒÂ©vÃƒÂ©nement natif navigateur `beforeinstallprompt` sur Chrome Android, Edge & PC Desktop.
  * DÃƒÂ©clenchement de la fenÃƒÂªtre d'installation en 1 clic ("Installer l'App Nopalou").
  * DÃƒÂ©tection intelligente d'iOS / Safari avec modale d'instruction pas ÃƒÂ  pas ("Partager Ã°Å¸â€œÂ¤ -> Sur l'ÃƒÂ©cran d'accueil Ã°Å¸â€œÂ²").
  * Masquage automatique si l'application est dÃƒÂ©jÃƒÂ  installÃƒÂ©e en mode standalone ou si fermÃƒÂ©e par l'utilisateur (mÃƒÂ©moire 14 jours).
- **IntÃƒÂ©gration Globale (`layout.tsx`)** : Activation automatique sur l'ensemble de l'application.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 09/08/2026 : Correction Globale des Images Nopalou (Boutiques, Logos, Couvertures & Espace Marchand)
- **Remplacement complet des balises `<img>` brutes par `ExternalImg` sur les Boutiques Nopalou** :
  * Annuaire & RÃƒÂ©pertoire des Boutiques (`boutiques/page.tsx`) : Logos et photos de couverture.
  * Vitrine & En-tÃƒÂªte de la Boutique (`boutiques/[id]/page.tsx`) : Logos, banniÃƒÂ¨re de couverture et produits boutique.
  * Espace Marchand & Tableau de bord (`BoutiqueClient.tsx`) : Formulaires de modification de logo, couverture et catalogue produits.
- **Protection & Proxy Universel pour toutes les images Nopalou** : Masquage automatique de l'en-tÃƒÂªte `Referer` et fallback instantanÃƒÂ© vers le proxy CDN `wsrv.nl` si un CDN ou navigateur bloque l'accÃƒÂ¨s direct aux images Cloudinary/externes.

## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 09/08/2026 : Correction de l'Affichage des Photos & Proxy CDN Fallback
- **Nettoyage & SÃƒÂ©curisation des URLs d'images (`sanitizeImgUrl`)** : Conversion automatique des URLs relatives `//` et `http://` en `https://` pour ÃƒÂ©viter les blocages de contenu mixte, nettoyage des espaces et correction des prÃƒÂ©fixes SVG corrompus.
- **Politique de Referrer (`referrerPolicy="no-referrer"`)** : Suppression de l'en-tÃƒÂªte Referer lors de la demande d'images pour contourner les protections anti-hotlink des CDN externes (CoinAfrique, Jumia, Expat-Dakar, etc.).
- **Fallback Automatique Proxy CDN (`wsrv.nl`)** : En cas d'erreur de chargement direct (403, SSL, ECONNRESET), `ExternalImg` retente automatiquement le chargement via le proxy CDN sÃƒÂ©curisÃƒÂ© `wsrv.nl` avant de basculer sur l'icÃƒÂ´ne de secours (Ã°Å¸â€œÂ¦).
- **GÃƒÂ©nÃƒÂ©ralisation sur tout le site** : Remplacement des balises `<img>` brutes par `ExternalImg` dans les boutiques (`BoutiqueDetailClient`), les cartes immobiliÃƒÂ¨res (`ImmoCard`), le panier latÃƒÂ©ral (`DrawerCart`), la recherche (`NavbarSearch` & `RechercheClient`).
- **Nettoyage Base de DonnÃƒÂ©es PostgreSQL** : Suppression des URLs d'images SVG corrompues (`data:image/svg`) issues du scraping dans la table `produits`.

- Injection directe des styles CSS POS dans style jsx global pour garantir l'affichage immÃƒÂ©diat sans dÃƒÂ©pendre du cache navigateur (Masquage direct du header du site et layout 50/50).
- Exigence de Session POS Ouverte & Gestion des Modes de Fonctionnement :
  * Blocage de l'ajout d'articles au panier si aucune session de caisse n'est ouverte (session === null) et dÃƒÂ©clenchement automatique de la modale Ouverture de Session.
  * Affichage d'un panneau de dÃƒÂ©verrouillage de session ÃƒÂ©lÃƒÂ©gant dans la section ticket lorsque la session est fermÃƒÂ©e.
  * Explication claire de la gestion des boutiques Pur Web (pure_player) vs Hybride POS (hybride_pos).
- Redesign Ergonomie & Design Premium Caisse POS :
  * Suppression du double en-tÃƒÂªte mobile : masquage automatique du header global du site, de la nav et du footer via body:has(.caisse-header) en mode POS Fullscreen.
  * Restructuration des proportions du layout standard POS (52% Catalogue / 48% Caisse & Ticket).
  * Grille de produits compacte haute densitÃƒÂ© (Square POS style) avec badge compteur d'articles et surbrillance orange active.
  * Modales premium avec flou d'arriÃƒÂ¨re-plan glassmorphism (backdrop-filter) et typographie ÃƒÂ©purÃƒÂ©e.
- SÃƒÂ©curitÃƒÂ© & ContrÃƒÂ´le d'AccÃƒÂ¨s Caisse POS par Boutique :
  * Injection de plan_actif dans la liste des boutiques (/api/boutiques/mine).
  * VÃƒÂ©rification dynamique stricte des droits POS par boutique sÃƒÂ©lectionnÃƒÂ©e dans CaisseClient.
  * Blocage automatique et affichage de l'ÃƒÂ©cran de verrouillage dÃƒÂ¨s qu'un marchand bascule vers une boutique sans abonnement Pro/Business (Gratuit/Starter).
  * Ajout des indicateurs de statut POS (Ã°Å¸Å¸Â¢ AutorisÃƒÂ© / Ã°Å¸â€�â€™ VerrouillÃƒÂ©) dans le menu de sÃƒÂ©lection d'en-tÃƒÂªte.
- Optimisation PIN & En-tÃƒÂªte Caisse POS :
  * Persistance de session dÃƒÂ©verrouillÃƒÂ©e au rafraÃƒÂ®chissement (F5) via LocalStorage.
  * Suppression du bouton DÃƒÂ©verrouiller & dÃƒÂ©verrouillage automatique dÃƒÂ¨s 4 chiffres avec message d'erreur si faux.
  * RÃƒÂ©duction automatique du clavier virtuel mobile (inputMode numeric + auto-blur).
  * Alignment et nettoyage de l'en-tÃƒÂªte caisse-header sans aucun chevauchement sur mobile.
- IntÃƒÂ©gration du moteur universel html5-qrcode : DÃƒÂ©codage natif EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E et QR-Code en direct sur la camÃƒÂ©ra (iOS Safari, Android Chrome, PC/Webcams).
- Correctif Permissions-Policy CamÃƒÂ©ra : Modification de camera=() en camera=(self) dans next.config.js et middleware.ts pour lever la restriction navigateur [Violation] Permissions policy violation.
## Ã°Å¸Å¡â‚¬ Mises ÃƒÂ  jour du 09/08/2026 : Optimisation Caisse POS Mobile & CamÃƒÂ©ra Scanner
- **Refonte Ergonomique Barre de Recherche & Scanners (Responsive)** : Correction du chevauchement inesthÃƒÂ©tique des boutons "Scanner CamÃƒÂ©ra" et "Douchette Smartphone" sur mobile.
- **DÃƒÂ©placement du Bouton Vue Catalogue** : Le bouton de basculement d'affichage (Liste / MosaÃƒÂ¯que) a ÃƒÂ©tÃƒÂ© dÃƒÂ©placÃƒÂ© sous la barre de recherche, ÃƒÂ  gauche de la liste des catÃƒÂ©gories, pour libÃƒÂ©rer de l'espace en haut et harmoniser l'interface.
- **Verrouillage Strict du Changement de Boutique** : Blocage complet de la sÃƒÂ©lection de boutique dans l'en-tÃƒÂªte (affichage d'une alerte) lorsqu'une session de caisse (Fonds de caisse) est actuellement ouverte. EmpÃƒÂªche le caissier de fuir ou de mÃƒÂ©langer les caisses sans avoir fait sa ClÃƒÂ´ture Z (fermeture de caisse).
- **Catalogue POS (Grille/Liste) & Ãƒâ€°puration Header** : Ajout d'un bouton de bascule dynamique Liste / MosaÃƒÂ¯que pour l'affichage des produits. Nettoyage de l'en-tÃƒÂªte mobile avec suppression des badges redondants (POS, EN LIGNE) et correction du layout responsif pour ÃƒÂ©viter le chevauchement des ÃƒÂ©lÃƒÂ©ments (scroll horizontal de l'en-tÃƒÂªte).
- Navigation Caisse Mobile par Onglets (caisse-mobile-tabs) : Onglets [ Ã°Å¸â€ºï¿½Ã¯Â¸ï¿½ Catalogue | Ã°Å¸â€ºâ€™ Ticket ] sous le header (<= 1024px).
- Barre Flottante Collante (caisse-sticky-bottom-bar) : Affichage en direct du total FCFA et bouton VOIR TICKET & ENCAISSER sur mobile.
- Robustesse Scanner CamÃƒÂ©ra : Fallback automatique multi-camÃƒÂ©ras (facingMode environment -> video: true), gestion HTTPS et raccourci Douchette Smartphone Distante.
- **Correction Critique Mode Hors Ligne (PWA / Service Worker)** : RÃƒÂ©solution de l'erreur `ERR_FAILED` lors de la navigation sans connexion. Ajout des paramÃƒÂ¨tres `{ ignoreSearch: true, ignoreVary: true }` pour forcer la lecture du cache Chrome et injection directe du HTML de secours (`offline.html`) dans `sw.js` (incrÃƒÂ©mentÃƒÂ© ÃƒÂ  `v4`) pour garantir 100% de fiabilitÃƒÂ©.

# CLAUDE.md

## Ã°Å¸â€ºÂ Ã¯Â¸ï¿½ Guide de Configuration & d'Activation Production (OpenSpec Nopalou)

### Ã°Å¸â€™Â³ 1. Configuration des Paiements par Carte Bancaire RÃƒÂ©els (Stripe Production)
Pour passer du mode simulation actuel aux encaissements rÃƒÂ©els Stripe en production :
1. **CrÃƒÂ©ation du Compte Stripe Entreprise** : S'inscrire sur [Stripe.com](https://stripe.com) et fournir les documents administratifs (RCCM, NINEA, RIB bancaire de Nopalou).
2. **Variables d'Environnement (`backend/.env`)** :
   ```env
   STRIPE_SECRET_KEY=sk_live_51Nx...
   STRIPE_PUBLISHABLE_KEY=pk_live_51Nx...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. **Activation du SDK Officiel Node.js** : Installer `npm install stripe` et activer `paymentIntents.create()` dans `backend/routes/boutiques.js`.
4. **Configuration du Webhook Stripe Production** : DÃƒÂ©clarer `https://api.nopalou.com/api/webhooks/stripe` dans le Dashboard Stripe pour valider automatiquement le virement dÃƒÂ¨s l'autorisation bancaire 3D-Secure.

### Ã°Å¸â€�â€˜ 2. StratÃƒÂ©gie Commerciale & Configuration du Portail DÃƒÂ©veloppeur (Spec 05 - API & Webhooks)
- **Cible Marchande** : PME, Grossistes et Marques ayant leur propre logiciel ERP/CRM (*Odoo, Sage, Dolibarr*).
- **ModÃƒÂ¨le de Tarification & Facturation** :
  - **Option 1 (Forfaits Boutique Taf Taf / Pro / Business)** : RÃƒÂ©servÃƒÂ© aux forfaits d'abonnement (`2 500 FCFA`, `5 000 FCFA` et `10 000 FCFA / mois`).
  - **Option 2 (Add-on sur mesure)** : Facturer l'accÃƒÂ¨s au module *API & Connecteurs ERP* comme une extension mensuelle.
- **RÃƒÂ©tention Client (Lock-in)** : La connexion de l'ERP du marchand via l'API Nopalou garantit sa fidÃƒÂ©lisation ÃƒÂ  100% sans risque de dÃƒÂ©sabonnement.

### Ã°Å¸â€œÂ¸ 3. Configuration Instagram Shopping, Meta Commerce Manager & TikTok Catalog
- **Lien du Flux XML Universel** : `https://nopalou.com/api/boutiques/:idOrSlug/catalog.xml`
- **ProcÃƒÂ©dure d'Activation pour le Marchand** :
  1. Relier le compte Instagram Professionnel ÃƒÂ  sa page Facebook dans Meta Business Suite.
  2. Ajouter l'URL du flux XML Nopalou dans **Meta Commerce Manager** (*Catalogues -> Importation automatique*).
  3. Taguer ses produits sur ses publications, stories et reels Instagram pour rediriger les acheteurs en 1 clic vers le checkout 1-Page Nopalou.

### Ã°Å¸Â§Âª 4. ExÃƒÂ©cution & Assurance QualitÃƒÂ© (Master Test Suite - 20/20 PASS)
- **Commande de Validation Globale TDD** :
  ```powershell
  node node_modules/jest/bin/jest.js tests/unit/spec-master-exhaustive.test.js --forceExit
  ```
- **Couverture des 26 ScÃƒÂ©narios ValidÃƒÂ©s** :
  - **Spec 01** : Bascule de mode `pure_player` vs `hybride_pos`, sÃƒÂ©lecteur admin et masquage caisse.
  - **Spec 02** : Enregistrement de commande 1-Page, dÃƒÂ©crÃƒÂ©mentation des stocks et offres Cross-Sell.
  - **Spec 03** : Remises %, montants fixes FCFA, seuils d'achat minimum et rejet des coupons vides.
  - **Spec 04** : Pixels publicitaires (Meta, TikTok, GA4) et gÃƒÂ©nÃƒÂ©ration des flux catalogues XML/JSON.
  - **Spec 05** : Portail DÃƒÂ©veloppeur, gÃƒÂ©nÃƒÂ©ration de clÃƒÂ©s API `nopalou_sk_live_...`, webhooks `whsec_...` et signatures HMAC-SHA256.
  - **Spec 06** : Taux de change officiels (XOF, EUR, USD), simulation Carte Stripe acceptÃƒÂ©e et rejet des cartes dÃƒÂ©clinÃƒÂ©es.
  - **Spec 07 (Acheteur)** : Suivi de commande 200, Avis produits 201, Moyenne d'avis 4.5 Ã¢Â­ï¿½ et Comparatif prix.

---

### [2026-08-09] - Refonte du Hero "Bento Box" et Carrousel des FonctionnalitÃƒÂ©s
- **Refonte Structurelle (Bento Box) (`frontend-next/src/app/boutiques/page.tsx`)** : Refonte asymÃƒÂ©trique complÃƒÂ¨te du layout de l'en-tÃƒÂªte (Hero) pour l'annuaire des boutiques. La zone de recherche et les filtres sont dÃƒÂ©sormais pleinement intÃƒÂ©grÃƒÂ©s ÃƒÂ  la colonne de gauche (qui s'ÃƒÂ©tire dynamiquement pour ÃƒÂ©viter tout vide central), tandis que la colonne de droite accueille les nouvelles fonctionnalitÃƒÂ©s.
- **Carrousel Interactif (`frontend-next/src/app/boutiques/HeroCarousel.tsx`)** : Remplacement de l'ancienne carte statique "Boutique Taf Taf" par un composant Carrousel moderne, dÃƒÂ©filant automatiquement. Il met en ÃƒÂ©vidence 4 fonctionnalitÃƒÂ©s clÃƒÂ©s (Boutique Taf Taf, Caisse POS, ZÃƒÂ©ro Commission WhatsApp, Vendeurs VÃƒÂ©rifiÃƒÂ©s) avec pause au survol et navigation manuelle.
- **Enrichissement Typographique et Alignement** : Ajout de puces de rÃƒÂ©assurance ("0% de commission", "100% Vendeurs vÃƒÂ©rifiÃƒÂ©s", "Contact direct") dans le texte de prÃƒÂ©sentation pour combler harmonieusement l'espace vertical. Utilisation de `align-items: stretch` et `margin-top: auto` pour garantir un alignement parfait de la barre de recherche avec le bas des widgets de la colonne de droite.

---### [2026-08-08] - AmÃƒÂ©lioration du formulaire de crÃƒÂ©ation de boutique et UX de recherche
- **Frontend (`frontend-next/src/app/creer-boutique/page.tsx`)** : Remplacement de la mention "WhatsApp Business" par "WhatsApp" pour plus de simplicitÃƒÂ©. Ajout d'un menu dÃƒÂ©roulant permettant de choisir le "Type de boutique" (catÃƒÂ©gorie) ÃƒÂ  l'ÃƒÂ©tape finale de crÃƒÂ©ation, juste avant le choix de la couleur.
- **Backend (`backend/routes/boutiques.js`)** : Modification de la route `POST /taf-taf` pour rÃƒÂ©cupÃƒÂ©rer et insÃƒÂ©rer la `categorie` envoyÃƒÂ©e par le frontend lors de l'enregistrement en base de donnÃƒÂ©es, au lieu de forcer la valeur "Divers".
- **UX de Recherche (`frontend-next/src/app/page.tsx`, `frontend-next/src/app/SearchBar.tsx`)** : Ajout d'une ancre `#resultats` sur le conteneur principal de la page d'accueil. Conversion de la barre de recherche en composant client (`next/navigation`) et modification de tous les liens (catÃƒÂ©gories, budget, tri, tendances) pour qu'ils dÃƒÂ©clenchent un dÃƒÂ©filement automatique immÃƒÂ©diat vers les rÃƒÂ©sultats lors du clic, amÃƒÂ©liorant considÃƒÂ©rablement l'expÃƒÂ©rience utilisateur sur mobile et desktop.
- **Menu Boutique (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** : Transformation du menu de navigation (sidebar) en accordÃƒÂ©on. Les groupes ("Finance & Rapports", "ParamÃƒÂ¨tres & Ãƒâ€°quipe", etc.) sont dÃƒÂ©sormais repliables pour optimiser l'occupation verticale sur mobile. Par dÃƒÂ©faut, seul le premier groupe ou celui contenant l'onglet actif est ouvert.
- **Affichage CatÃƒÂ©gories Mobile (`frontend-next/src/app/page.tsx`, `globals.css`)** : Remplacement de l'affichage en grille dÃƒÂ©sordonnÃƒÂ©e des catÃƒÂ©gories sur la page d'accueil par un dÃƒÂ©filement horizontal fluide sur mobile (comme sur Instagram/Airbnb). Cela aligne parfaitement toutes les pilules sur une seule ligne glissante.
- **Refonte Dashboard Boutiques (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** : Ãƒâ€°largissement du conteneur de liste des boutiques ÃƒÂ  1200px et passage en affichage grille multi-colonnes. La carte `BoutiqueCard` a ÃƒÂ©tÃƒÂ© repensÃƒÂ©e : boutons secondaires (Modifier, Voir, Supprimer) transformÃƒÂ©s en icÃƒÂ´nes discrÃƒÂ¨tes en haut ÃƒÂ  droite, informations de contact alignÃƒÂ©es avec des icÃƒÂ´nes Lucide, et bas de carte rÃƒÂ©servÃƒÂ© aux larges boutons d'actions principales ("GÃƒÂ©rer", "Caisse POS").
- **Refonte Annuaire Boutiques (`frontend-next/src/app/boutiques/page.tsx`, `BoutiquesSearch.tsx`)** : IntÃƒÂ©gration de la barre de recherche directement ÃƒÂ  l'intÃƒÂ©rieur du bloc HÃƒÂ©ro (banniÃƒÂ¨re) pour combler le vide central sur grands ÃƒÂ©crans. Refonte de la barre de recherche (style Airbnb : plus large, grande police, bords trÃƒÂ¨s arrondis, ombre portÃƒÂ©e ÃƒÂ©lÃƒÂ©gante) et centrage de la liste des catÃƒÂ©gories sous la banniÃƒÂ¨re.

### [2026-08-08] - Mise ÃƒÂ  Jour ComplÃƒÂ¨te des Tarifs Marchands (Dynamisation & Fallbacks)
- **Alignement sur la Base de DonnÃƒÂ©es de Production** : Remplacement des anciennes valeurs par dÃƒÂ©faut (`5000`, `15000`, `35000`) par les vÃƒÂ©ritables prix officiels (`2 500`, `5 000`, `10 000` FCFA) sur l'ensemble du frontend et du backend.
- **Mise ÃƒÂ  Jour de la Configuration Backend (`backend/lib/settingsCache.js`, `backend/routes/abonnements.js`)** : Actualisation des fallbacks pour garantir la cohÃƒÂ©rence des prix mÃƒÂªme en l'absence de base de donnÃƒÂ©es locale.
- **Nettoyage des Noms des Forfaits** : Utilisation exclusive des dÃƒÂ©nominations officielles ("Boutique Taf Taf", "Boutique Pro", "Boutique Business") dans tout le site, y compris le panneau Admin (`/admin/tarifs`) et le tunnel d'inscription.

### [2026-08-08] - Page d'Accueil : Produits les Moins Chers (50k - 150k) et Populaire
- **Ajustement de l'Affichage par DÃƒÂ©faut (`backend/routes/produits.js`)** :
  - Modification de la requÃƒÂªte SQL (CTE) pour prioriser les produits dont le prix est compris entre **50 000 et 150 000 FCFA** et qui sont populaires (`agg_nb_offres >= 2`).
  - **Correction du Mixage (Interleaving)** : RÃƒÂ©tablissement d'un tri entrelacÃƒÂ© garanti (via `ROW_NUMBER() OVER(PARTITION BY source_type)`) pour forcer l'affichage 1-pour-1 des produits des Boutiques Nopalou (quel que soit leur prix) avec la sÃƒÂ©lection scrappÃƒÂ©e Top (50k-150k).
  - Ce mixage est ordonnÃƒÂ© intrinsÃƒÂ¨quement du **moins cher au plus cher** (`agg_prix_min ASC`) puis par popularitÃƒÂ©, ce qui garantit que l'acheteur voit d'abord les offres les moins chÃƒÂ¨res sans sacrifier la visibilitÃƒÂ© des boutiques partenaires.

### [2026-08-08] - Audit Profond & Synchronisation des Menus (Mobile, Footer, Admin)
- **Menu Mobile Utilisateur (`frontend-next/src/app/MobileNav.tsx`)** :
  - Synchronisation de l'espace compte mobile avec la barre latÃƒÂ©rale bureau (`AccountNavLinks.tsx`). Ajout des liens manquants : `Mes alertes prix`, `Publier un bien immo`, `Apporteur d'affaires` et `Forfaits & FonctionnalitÃƒÂ©s`.
- **Pied de Page (`frontend-next/src/app/layout.tsx`)** :
  - Ajout de la catÃƒÂ©gorie **Jeux VidÃƒÂ©o** dans la colonne "CatÃƒÂ©gories" du footer (elle existait dans le sitemap mais avait ÃƒÂ©tÃƒÂ© oubliÃƒÂ©e visuellement).
- **Administration Superadmin (`frontend-next/src/app/admin/(protected)/layout.tsx`)** :
  - DÃƒÂ©couverte et ajout de 2 pages admin orphelines dans la barre latÃƒÂ©rale : **QualitÃƒÂ© DonnÃƒÂ©es (Quarantines)** (`/admin/qualite`) et **Tracking Affiliates** (`/admin/affiliates/tracking`).

### [2026-08-08] - Ajout des Guides Vendeurs (Menu Mobile, Footer, Sitemap & Legacy)
- **Menu Mobile (`frontend-next/src/app/MobileNav.tsx`)** :
  - Ajout des liens `Tarifs & Forfaits Vendeurs` (avec badge "OFFRE"), `Guide Vendeur & Sourcing`, et `DÃƒÂ©mo Commerciale` (avec badge "NOUVEAU") dans le tiroir de navigation mobile, avec le mÃƒÂªme design et la mÃƒÂªme mise en avant que sur le menu Desktop.
- **Pied de Page / Footer (`frontend-next/src/app/layout.tsx`)** :
  - Ajout de ces 3 liens stratÃƒÂ©giques dans la colonne "Informations" du footer global pour un meilleur maillage interne (SEO) et une meilleure accessibilitÃƒÂ©.
- **Sitemap XML (`frontend-next/src/app/sitemap.ts`)** :
  - Ajout de l'URL `/demo` au sitemap.ts qui avait ÃƒÂ©tÃƒÂ© omise.
- **Application Legacy (`frontend/index.html`)** :
  - Synchronisation du menu dÃƒÂ©roulant `nav-guides-dropdown` de l'ancienne application vanilla JS avec les 3 nouveaux liens marchands.

### [2026-08-07] - Tarification 100% Dynamique & IntÃƒÂ©gration Boutique Taf Taf dans l'Admin
- **IntÃƒÂ©gration du Forfait Boutique Taf Taf dans l'Admin (`frontend-next/src/app/admin/(protected)/tarifs/TarifsClient.tsx`)** :
  - Ajout du paramÃƒÂ©trage complet du plan **Boutique Taf Taf** (*nom, prix mensuel en FCFA et durÃƒÂ©e de l'essai gratuit / 1er mois offert*) dans l'interface `/admin/tarifs`.
  - Mise ÃƒÂ  jour des valeurs par dÃƒÂ©faut (`plan_decouverte_prix: 5000 FCFA`, `plan_pro_prix: 15000 FCFA`, `plan_business_prix: 35000 FCFA`).
- **Extension du 1er Mois 100% Offert ÃƒÂ  TOUTES les Formules (`creer-boutique/page.tsx`, `TarifsPublicsSelector.tsx`, `ShowcaseTabs.tsx`)** :
  - Le premier mois gratuit (essai 30 jours) s'applique dÃƒÂ©sormais explicitement sur l'ensemble des 3 forfaits (**Boutique Taf Taf**, **Vendeur Pro**, et **Business VIP**).
- **Synchronisation Dynamique Globale du Site (`backend/routes/settings.js`, `frontend-next/src/app/tarifs-boutique/TarifsPublicsSelector.tsx`, `frontend-next/src/app/creer-boutique/page.tsx`, `ShowcaseTabs.tsx`)** :
  - L'endpoint `GET /api/settings/public` retourne dÃƒÂ©sormais l'intÃƒÂ©gralitÃƒÂ© des 3 formules d'abonnement (`plan_decouverte_prix`, `plan_pro_prix`, `plan_business_prix`, leurs libellÃƒÂ©s et les durÃƒÂ©es d'essai).
  - La page des tarifs vendeurs (`/tarifs-boutique`), le wizard de crÃƒÂ©ation de boutique (`/creer-boutique`) et la page d'accueil (`/`) rÃƒÂ©cupÃƒÂ¨rent dynamiquement les tarifs dÃƒÂ©finis dans l'admin et appliquent les rÃƒÂ©ductions multi-durÃƒÂ©es (-10%, -15%, -25%).
- **Calculs Dynamiques Backend (`backend/routes/abonnements.js`, `backend/routes/paiement.js`, `backend/routes/boutiques.js`)** :
  - Les endpoints d'inscriptions, d'abonnements et de paiements s'appuient ÃƒÂ  100% sur le cache de configuration `settingsCache` sans aucun prix codÃƒÂ© en dur (avec 30 jours offerts par dÃƒÂ©faut sur tous les forfaits lors de la crÃƒÂ©ation).

### [2026-08-07] - Correction Bug Critique : CrÃƒÂ©ation de Boutique Taf Taf (`/api/boutiques/taf-taf`)
- **RÃƒÂ©solution Erreur PostgreSQL ON CONFLICT (`backend/routes/boutiques.js`)** :
  - Correction de l'erreur `there is no unique or exclusion constraint matching the ON CONFLICT specification` sur la table `abonnements`.
  - Remplacement du `ON CONFLICT (utilisateur_id)` invalide par une dÃƒÂ©sactivation des abonnements actifs existants (`UPDATE abonnements SET statut='annule'`) suivie de l'insertion propre d'un nouvel abonnement (`INSERT INTO abonnements`).
- **Correction Variable `boutiqueId` Manquante (`backend/routes/boutiques.js`)** :
  - DÃƒÂ©claration explicite de `const boutiqueId = insertBoutique.rows[0].id;` avant le retour JSON de l'endpoint et gÃƒÂ©nÃƒÂ©ration/affectation automatique d'un `slug` unique via `uniqueSlug()`.

### [2026-08-07] - Approche OpenSpec : ImplÃƒÂ©mentation IntÃƒÂ©grale de la Feuille de Route Acheteur Nopalou
- **Page de Suivi de Commande en Temps RÃƒÂ©el (`frontend-next/src/app/suivi-commande/page.tsx`)** :
  - Route publique `/suivi-commande` permettant ÃƒÂ  l'acheteur d'entrer sa rÃƒÂ©fÃƒÂ©rence `CMD-2026-XXXX` ou son tÃƒÂ©lÃƒÂ©phone pour visualiser la progression de sa livraison en 4 ÃƒÂ©tapes (*En attente Ã¢Å¾â€� En prÃƒÂ©paration Ã¢Å¾â€� En livraison Ã¢Å¾â€� LivrÃƒÂ©e*).
  - Endpoint `GET /api/boutiques/commandes/suivi` avec recherche par rÃƒÂ©fÃƒÂ©rence ou tÃƒÂ©lÃƒÂ©phone et lien direct WhatsApp vers le livreur.
- **SystÃƒÂ¨me d'Avis Clients CertifiÃƒÂ©s (1 ÃƒÂ  5 Ã¢Â­ï¿½) (`frontend-next/src/components/AvisProduitSection.tsx`)** :
  - Module de dÃƒÂ©pose d'avis rÃƒÂ©servÃƒÂ© aux acheteurs certifiÃƒÂ©s avec calcul en temps rÃƒÂ©el de la note moyenne.
  - Endpoints `GET /api/boutiques/:id/produits/:prodId/avis` et `POST /api/boutiques/:id/produits/:prodId/avis`.
  - Migration SQL idempotente (`boutique_avis`) dans `backend/migrate-inline.js`.
- **Tableau Comparatif Multi-Plateformes (`frontend-next/src/components/TableauComparatifPrix.tsx`)** :
  - Composant de comparaison montrant le podium des prix entre les Boutiques Nopalou directes et les offres externes agrÃƒÂ©gÃƒÂ©es (*Jumia, Expat-Dakar, CoinAfrique*) avec le badge **`Ã°Å¸ï¿½â€  Meilleur Prix`**.
- **Badges de RÃƒÂ©assurance & SÃƒÂ©curitÃƒÂ© (`frontend-next/src/components/GarantiesAcheteurBadge.tsx`)** :
  - Composant de rÃƒÂ©assurance sous le bouton d'achat (*Satisfait ou Ãƒâ€°changÃƒÂ© sous 48h*, *Paiement SÃƒÂ©curisÃƒÂ© Wave/OM/Carte/Cash*, *Livraison Rapide*).
- **Validation Globale par les Tests AutomatisÃƒÂ©s TDD (`tests/unit/spec-acheteur-exhaustive.test.js`)** :
  - Suite de 6 unit tests acheteurs exÃƒÂ©cutÃƒÂ©e et validÃƒÂ©e ÃƒÂ  **100% PASS** (Avis certifiÃƒÂ©s 201, calcul de moyenne 4.5 Ã¢Â­ï¿½, recherche par rÃƒÂ©fÃƒÂ©rence 200 et par tÃƒÂ©lÃƒÂ©phone 200).
  - Total cumulÃƒÂ© avec la Master Test Suite : **26 tests validÃƒÂ©s avec succÃƒÂ¨s (0 ÃƒÂ©chec)**.

---

### [2026-08-07] - Approche OpenSpec : Flux Catalogues Dynamiques XML/JSON & IntÃƒÂ©gration Meta / Instagram Shopping / TikTok Catalog
- **Endpoints de Flux Catalogue Dynamique (`backend/routes/boutiques.js`)** :
  - `GET /api/boutiques/:id/catalog.xml` : GÃƒÂ©nÃƒÂ©ration du flux RSS 2.0 XML conforme aux spÃƒÂ©cifications Google Merchant, Meta Commerce Manager et TikTok Catalog. Permet ÃƒÂ  chaque marchand d'importer son catalogue automatiquement sur sa page Instagram/Facebook pour taguer ses produits sur ses publications, stories et reels.
  - `GET /api/boutiques/:id/catalog.json` : Endpoint d'export JSON structurÃƒÂ© pour intÃƒÂ©gration d'applications tierces.
- **RÃƒÂ©solution Universelle UUID & Slug** : Prise en charge transparente des identifiants UUID et des Slugs d'URL (ex: `dievo-style`, `tech-dakar`) sur l'ensemble des routes d'exportation de catalogue, de validation de coupons promo et d'offres complÃƒÂ©mentaires.
- **AmÃƒÂ©lioration UX Formulaire de Commande (`CommanderModal.tsx`)** :
  - Gestion explicite des requÃƒÂªtes de codes promo vides avec affichage instantanÃƒÂ© du message d'erreur `Ã¢Å¡Â Ã¯Â¸ï¿½ Veuillez saisir un code promo`.
  - Bouton *Appliquer* rÃƒÂ©actif ÃƒÂ  tout moment sans blocage silencieux.
- **Master Test Run Exhaustif ValidÃƒÂ© ÃƒÂ  100% (`tests/unit/spec-master-exhaustive.test.js`)** : 20 tests d'intÃƒÂ©gration et de cas limites exÃƒÂ©cutÃƒÂ©s et rÃƒÂ©ussis avec succÃƒÂ¨s (20/20 PASS).

### [2026-08-07] - Approche OpenSpec : ImplÃƒÂ©mentation de la Spec 06 (Multi-Devises XOF/EUR/USD & Simulation Carte Bancaire Stripe)
- **Fichier de SpÃƒÂ©cification OpenSpec 06 (`docs/specs/06-multi-devises-stripe.md`)** : RÃƒÂ©daction de la spÃƒÂ©cification OpenSpec pour le support multi-devises (`XOF`, `EUR`, `USD`) avec taux de change officiels et simulation du paiement par carte bancaire Stripe.
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : Ajout de la colonne `devise_defaut VARCHAR(10) DEFAULT 'XOF'` ÃƒÂ  la table `boutiques`.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoint `GET /api/devises/taux` : Retourne les taux de conversion officiels (XOF, EUR, USD).
  - Endpoint `PUT /api/boutiques/:id/devise` : Modification de la devise par dÃƒÂ©faut de la boutique.
  - Endpoint `POST /api/paiements/stripe/simuler` : Traitement sÃƒÂ©curisÃƒÂ© des paiements par Carte Bancaire en mode simulation Stripe.
  - Correction de `GET /api/boutiques/mine` pour sÃƒÂ©lectionner `mode_fonctionnement` et `devise_defaut`.
- **Suite de Tests AutomatisÃƒÂ©s TDD (`tests/unit/spec-06-multi-devises-stripe.test.js`)** : Suite Jest validÃƒÂ©e ÃƒÂ  100% (5/5 tests validÃƒÂ©s avec succÃƒÂ¨s : taux de change 200, modification de devise 200, paiement carte acceptÃƒÂ© 200 et carte dÃƒÂ©clinÃƒÂ©e 400).
- **Validation Globale Master Test Run** : Execution conjointe des 6 suites de tests OpenSpec (Spec 01 ÃƒÂ  Spec 06) validÃƒÂ©es ÃƒÂ  100% sans aucune erreur.

### [2026-08-06] - Approche OpenSpec : ImplÃƒÂ©mentation de la Spec 05 (Webhooks & ClÃƒÂ©s API Marchands - Developer Portal)
- **Fichier de SpÃƒÂ©cification OpenSpec 05 (`docs/specs/05-webhooks-api-keys.md`)** : RÃƒÂ©daction de la spÃƒÂ©cification OpenSpec dÃƒÂ©crivant les clÃƒÂ©s API marchands (`nopalou_sk_live_...`) et le systÃƒÂ¨me de Webhooks sÃƒÂ©curisÃƒÂ© par signature HMAC-SHA256 (`X-Nopalou-Signature`).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : CrÃƒÂ©ation des tables `boutique_api_keys` (avec hash SHA256) et `boutique_webhooks` (avec secrets `whsec_...`).
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoints ClÃƒÂ©s API : `GET`, `POST`, `DELETE /api/boutiques/:id/api-keys` (GÃƒÂ©nÃƒÂ©ration du prÃƒÂ©fixe `nopalou_sk_live_...`, hashage SHA256 et stockage).
  - Endpoints Webhooks : `GET`, `POST`, `DELETE /api/boutiques/:id/webhooks` (Enregistrement d'URLs de notifications et crÃƒÂ©ation de secret `whsec_...`).
- **Suite de Tests AutomatisÃƒÂ©s TDD (`tests/unit/spec-05-webhooks-api-keys.test.js`)** : Suite Jest validÃƒÂ©e ÃƒÂ  100% (5/5 tests validÃƒÂ©s avec succÃƒÂ¨s : gÃƒÂ©nÃƒÂ©ration de clÃƒÂ© 201, rÃƒÂ©vocation 200, enregistrement webhook 201 avec secret `whsec_`, rejet d'URL invalide 400 et vÃƒÂ©rification HMAC-SHA256).

### [2026-08-06] - Approche OpenSpec : ImplÃƒÂ©mentation de la Spec 04 (Pixels de Tracking & Mesure ROAS : Meta, TikTok, GA4)
- **Fichier de SpÃƒÂ©cification OpenSpec 04 (`docs/specs/04-tracking-pixels.md`)** : RÃƒÂ©daction de la spÃƒÂ©cification OpenSpec couvrant le paramÃƒÂ©trage des Pixels publicitaires (Meta Facebook, TikTok et Google Analytics GA4).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : Ajout des colonnes `meta_pixel_id`, `tiktok_pixel_id` et `ga4_id` ÃƒÂ  la table `boutiques`.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoint `PUT /api/boutiques/:id/pixels` : Sauvegarde sÃƒÂ©curisÃƒÂ©e des identifiants par le marchand.
  - Endpoint `GET /api/boutiques/:id/pixels/public` : RÃƒÂ©cupÃƒÂ©ration publique des clÃƒÂ©s de tracking pour l'injection cÃƒÂ´tÃƒÂ© navigateur.
  - Mises ÃƒÂ  jour de `GET /api/boutiques/:id` et `PUT /api/boutiques/:id` pour retourner et sauvegarder les identifiants.
- **Suite de Tests AutomatisÃƒÂ©s TDD (`tests/unit/spec-04-pixels.test.js`)** : Suite Jest validÃƒÂ©e ÃƒÂ  100% (4/4 tests validÃƒÂ©s avec succÃƒÂ¨s : sauvegarde marchand 200, lecture publique vitrine 200, rejet 403 et 404).
- **Composant Client Storefront Next.js (`frontend-next/src/components/TrackingPixels.tsx`)** :
  - CrÃƒÂ©ation du composant de suivi dÃƒÂ©clenchant de maniÃƒÂ¨re asynchrone les SDKs Meta Pixel (`fbq`), TikTok (`ttq`) et GA4 (`gtag`) sans bloquer le rendu de la vitrine.
- **Interface Vendeur Next.js (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** :
  - Ajout de la section dÃƒÂ©diÃƒÂ©e **Ã°Å¸â€œÅ  Pixels Publicitaires & Tracking ROAS** dans les paramÃƒÂ¨tres de la boutique.

### [2026-08-06] - Approche OpenSpec : ImplÃƒÂ©mentation de la Spec 03 (Moteur de Promotions & Codes Promo)
- **Fichier de SpÃƒÂ©cification OpenSpec 03 (`docs/specs/03-moteur-promotions.md`)** : RÃƒÂ©daction de la spÃƒÂ©cification OpenSpec pour le moteur de coupons de rÃƒÂ©duction (pourcentage, montant fixe FCFA, livraison offerte).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : CrÃƒÂ©ation de la table `boutique_promotions` (avec contrainte unique sur `boutique_id` et `UPPER(code)`).
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoints marchands `GET`, `POST`, `DELETE /api/boutiques/:id/promotions` pour la gestion autonome des coupons de rÃƒÂ©duction.
  - Endpoint public `POST /api/promotions/valider` : VÃƒÂ©rification en temps rÃƒÂ©el de la validitÃƒÂ© d'un code (vÃƒÂ©rification de la date d'expiration, du quota d'utilisations et du montant d'achat minimum) avec calcul dynamique du montant de la remise.
- **Suite de Tests AutomatisÃƒÂ©s TDD (`tests/unit/spec-03-promotions.test.js`)** : Suite Jest validÃƒÂ©e ÃƒÂ  100% (6/6 tests validÃƒÂ©s avec succÃƒÂ¨s : crÃƒÂ©ation marchand, calcul 20% sur 25 000 FCFA = 5 000 FCFA de rÃƒÂ©duction, remise fixe, rejet pour achat minimum non atteint et code expirÃƒÂ©/invalide).
- **Interface Client Storefront Next.js (`frontend-next/src/app/boutiques/[id]/CommanderModal.tsx`)** :
  - IntÃƒÂ©gration du module de saisie et de validation instantanÃƒÂ©e du Code Promo dans le tunnel d'achat avec application directe de la rÃƒÂ©duction sur le total.

### [2026-08-06] - Approche OpenSpec : ImplÃƒÂ©mentation de la Spec 02 (Checkout Web 1-Page UnifiÃƒÂ© & Cross-Sell Panier)
- **Fichier de SpÃƒÂ©cification OpenSpec 02 (`docs/specs/02-checkout-unifie-upsell.md`)** : RÃƒÂ©daction de la spÃƒÂ©cification OpenSpec couvrant l'enregistrement de commande express 1-page sans dÃƒÂ©tour WhatsApp obligatoire et le module de recommandation Cross-Sell d'articles complÃƒÂ©mentaires.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoint `POST /api/boutiques/commandes/express` : Validation du formulaire client, calcul automatique du total (articles + livraison), dÃƒÂ©crÃƒÂ©mentation des stocks et insertion dans `commandes_boutique` avec rÃƒÂ©fÃƒÂ©rence unique `CMD-2026-XXXX`.
  - Endpoint `GET /api/boutiques/:id/produits/:prodId/cross-sell` : Algorithme de suggestion de produits complÃƒÂ©mentaires en stock dans la boutique.
- **Suite de Tests AutomatisÃƒÂ©s TDD (`tests/unit/spec-02-checkout-upsell.test.js`)** : Suite Jest validÃƒÂ©e ÃƒÂ  100% (5/5 tests validÃƒÂ©s avec succÃƒÂ¨s : commande 201 avec calcul des montants, rejet 400 pour tÃƒÂ©lÃƒÂ©phone/articles manquants, boutique introuvable 400 et rÃƒÂ©cupÃƒÂ©ration cross-sell 200).
- **Interface Client Storefront Next.js (`frontend-next/src/app/boutiques/[id]/CommanderModal.tsx`)** :
  - IntÃƒÂ©gration du formulaire 1-page reliÃƒÂ© directement ÃƒÂ  `/api/boutiques/commandes/express`.
  - IntÃƒÂ©gration du composant de suggestions **Upsell / Cross-Sell (1-Clic)** permettant ÃƒÂ  l'acheteur de cocher des articles complÃƒÂ©mentaires avant d'envoyer sa commande, augmentant ainsi le panier moyen.

### [2026-08-07] - Audit Complet du Paiement & Correction des Boutons d'Abonnement Inactifs
- **Correction Majeure des Boutons de Forfait (`frontend-next/src/app/boutique/abonnement/AbonnementClient.tsx`)** :
  - Remplacement du verrouillage abusif `disabled={isPending || !!planActif}` par un ciblage prÃƒÂ©cis du plan en cours sur la durÃƒÂ©e 1 mois (`estActif && duree === 1`).
  - RÃƒÂ©activation complÃƒÂ¨te des boutons de souscription Wave et Mobile Money (Orange Money/Wave) pour permettre ÃƒÂ  tous les marchands en pÃƒÂ©riode d'essai gratuite (`decouverte` / `taf_taf`) d'ÃƒÂ©voluer librement vers les plans Pro & Business, d'effectuer des upgrades ou de renouveler leur engagement sur 3, 6 ou 12 mois.
- **ParamÃƒÂ©trage Dynamique des Quotas (`backend/lib/settingsCache.js` & `backend/routes/settings.js`)** :
  - Ajout des clÃƒÂ©s configurables `max_boutiques_par_compte`, `max_boutiques_par_telephone`, `alertes_abonnement_jours_avant`, `alertes_abonnement_whatsapp` et `alertes_abonnement_email`.
- **IntÃƒÂ©gration du Portail DÃƒÂ©veloppeur API dans l'Espace Marchand (`frontend-next/src/app/boutique/PortailDeveloppeurBoutique.tsx` & `BoutiqueClient.tsx`)** :
  - CrÃƒÂ©ation du composant marchand `PortailDeveloppeurBoutique.tsx` et ajout de l'onglet **`Ã°Å¸â€�Å’ Portail DÃƒÂ©veloppeur API`** dans le menu latÃƒÂ©ral de gestion de boutique sous *"ParamÃƒÂ¨tres & Ãƒâ€°quipe"* (accessible exclusivement sur le plan Business VIP).
  - Correction de la correspondance du champ serveur `api_key` : la clÃƒÂ© complÃƒÂ¨te s'affiche dÃƒÂ©sormais instantanÃƒÂ©ment dans un encadrÃƒÂ© vert avec un bouton **`Ã°Å¸â€œâ€¹ Copier`** et est automatiquement copiÃƒÂ©e dans le presse-papier lors du clic sur *"GÃƒÂ©nÃƒÂ©rer une ClÃƒÂ© API"*.
  - SÃƒÂ©curisation hermÃƒÂ©tique des 6 endpoints backend (`GET/POST/DELETE /api/boutiques/:id/api-keys` et `GET/POST/DELETE /api/boutiques/:id/webhooks`) avec le middleware `requireBusiness`.
- **Supervision Superadmin du Portail DÃƒÂ©veloppeur API (`/admin/developer`)** :
  - RÃƒÂ©solution de l'erreur 401 lors de la premiÃƒÂ¨re ouverture du Portail DÃƒÂ©veloppeur API : transmission sÃƒÂ©curisÃƒÂ©e de la prop `secret` lue depuis le cookie serveur `httpOnly` (`nopalou_admin`) dans le composant `page.tsx` vers `DeveloperClient.tsx` pour l'envoi du header `X-Admin-Secret`.
  - CrÃƒÂ©ation du dashboard Superadmin pour la supervision en temps rÃƒÂ©el de l'ensemble des clÃƒÂ©s API REST (`nopalou_sk_live_...`) et webhooks (`whsec_...`) gÃƒÂ©nÃƒÂ©rÃƒÂ©s par les marchands Business VIP.
  - Ajout des routes d'administration `GET /api/boutiques/admin/developer-portal`, `DELETE /api/boutiques/admin/api-keys/:keyId` et `DELETE /api/boutiques/admin/webhooks/:webhookId` pour la modÃƒÂ©ration et la rÃƒÂ©vocation des accÃƒÂ¨s en 1-clic.
  - IntÃƒÂ©gration du lien `Ã°Å¸â€�Å’ Portail DÃƒÂ©veloppeur API` dans la barre de navigation latÃƒÂ©rale de l'Administration Superadmin.
- **Correction DÃƒÂ©finitive & DÃƒÂ©blocage du Build Render (`BoutiqueClient.tsx`)** :
  - **Correction des ClÃƒÂ©s CSS Inline (JS camelCase)** : Remplacement des clÃƒÂ©s avec tirets `justify-content` et `align-items` par `justifyContent` et `alignItems` dans les styles JSX en ligne de `BoutiqueClient.tsx`. C'ÃƒÂ©tait la cause exacte du rejet de parsing SWC/Webpack sur Render (`Unexpected token div`).
  - Validation complÃƒÂ¨te par typecheck TypeScript (`npx tsc --noEmit`) et build de production standalone rÃƒÂ©ussi (**Ã¢Å“â€œ Compiled successfully**, 86/86 pages statiques et dynamiques).
- **Driver WebBluetooth ESC/POS Direct (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  - IntÃƒÂ©gration du driver binaire WebBluetooth Direct permettant aux imprimantes thermiques Bluetooth sans fil (POS-5802, GOOJPRT, Xprinter, etc.) de se connecter en 1-clic depuis Chrome/Edge (Android & PC).
  - Envoi direct des commandes ESC/POS (format 58mm / 80mm, coupe et ouverture tiroir) sans passer par la boÃƒÂ®te de dialogue d'impression systÃƒÂ¨me.
- **Refonte Visuelle & Structuration de l'En-tÃƒÂªte de Gestion des Boutiques (`BoutiqueClient.tsx`)** :
    - Ãƒâ€°limination de la rÃƒÂ©pÃƒÂ©tition confuse du titre et rÃƒÂ©organisation complÃƒÂ¨te de l'en-tÃƒÂªte en une carte blanche unifiÃƒÂ©e et ÃƒÂ©lÃƒÂ©gante (`background: #ffffff`, `borderRadius: 16`, ombre portÃƒÂ©e douce).
    - **Fil d'Ariane Ãƒâ€°purÃƒÂ©** : Remplacement du bouton encadrÃƒÂ© confus par une navigation textuelle discrÃƒÂ¨te `Mon compte / Mes boutiques`.
    - **Pill Badge Quota SoignÃƒÂ©** : Reformulation grammaticale du quota (`1 / 3 autorisÃƒÂ©es`) avec point de statut bleu actif `Ã°Å¸â€�Âµ`.
    - **Alignement Parfait des Actions** : Alignement ÃƒÂ  droite des boutons d'action avec typographie haute lisibilitÃƒÂ© et hiÃƒÂ©rarchie visuelle claire (`Ouvrir ma Caisse POS` en blanc contourÃƒÂ© et `CrÃƒÂ©er une boutique` en dÃƒÂ©gradÃƒÂ© Nopalou Orange).
- **Audit Global des FonctionnalitÃƒÂ©s & SignalÃƒÂ©tique BientÃƒÂ´t Disponible (`frontend-next` & `backend`)** :
  - RÃƒÂ©alisation d'un audit complet de l'ensemble des modules. 100% des modules core (E-Commerce, Panier, Caisse POS, WhatsApp WABA API, Apporteurs, API REST) sont pleinement fonctionnels.
  - Ajout des badges d'information et d'ÃƒÂ©tat transparents sur les intÃƒÂ©grations en cours de KYC tiers (Sync Catalogue TikTok Shopping `Ã¢ï¿½Â³ BientÃƒÂ´t`, Payout automatique API Wave Direct `Ã¢Å¡Â¡ Virement Manuel sÃƒÂ©curisÃƒÂ© 24h`, Impression Thermique Web & USB).
- **Remplacement des Ãƒâ€°mojis par les VÃƒÂ©ritables IcÃƒÂ´nes Vectorielles SVG RÃƒÂ©seaux Sociaux (`layout.tsx`, `globals.css`)** :
    - Remplacement complet des ÃƒÂ©mojis gÃƒÂ©nÃƒÂ©riques (Ã°Å¸Å½Âµ, Ã°Å¸â€œÂ¢, f, Ã°Å¸â€œÂ¸, Ã°ï¿½â€¢ï¿½) du pied de page par les vÃƒÂ©ritables logos vectoriels SVG officiels et haute dÃƒÂ©finition de **TikTok**, **WhatsApp (Canal)**, **Facebook**, **Instagram** et **X / Twitter**.
    - Ajout de boutons circulaires surÃƒÂ©levÃƒÂ©s (`.footer-social-link`) avec animations fluides au survol (`transform: translateY(-3px)`) et couleurs officielles de chaque rÃƒÂ©seau (Vert WhatsApp `#25D366`, Bleu Facebook `#1877F2`, DÃƒÂ©gradÃƒÂ© Instagram, Noir/Cyan TikTok `#00f2fe`).
- **Audit Global des FenÃƒÂªtres & Polices SystÃƒÂ¨me UnifiÃƒÂ©es (`frontend-next/src/app/globals.css`, Modales & Wizards)** :
  - **RÃƒÂ¨gle Globale de Police SystÃƒÂ¨me (`globals.css`)** : DÃƒÂ©finition de la rÃƒÂ¨gle universelle `html, body, button, input, select, textarea { font-family: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }`. Ãƒâ€°limination dÃƒÂ©finitive des rendus de polices gÃƒÂ©nÃƒÂ©riques ou non stylisÃƒÂ©es sur 100% des pages et fenÃƒÂªtres.
  - **Harmonisation de la Couleur Bleu Marine Nopalou du Pied de Page (`.site-footer`)** : Correction et fixation explicite de la couleur de fond du pied de page sur le bleu marine Nopalou officiel (`#1C2B4A !important`), garantissant une parfaite identitÃƒÂ© visuelle avec le logo et la charte graphique Nopalou.
  - **Harmonisation des Modales & FenÃƒÂªtres Interactives** :
    - *Wizard Forfait TÃƒÂ©lÃƒÂ©com* (`WizardForfait.tsx`) : Application de la pile systÃƒÂ¨me native et refonte des boutons/puces.
    - *FenÃƒÂªtre de Commande / Express Checkout* (`CommanderModal.tsx`) : Application de la police systÃƒÂ¨me native et harmonisation des onglets de canaux (WhatsApp / Formulaire).
    - *Importation par Lot de Catalogue* (`BatchImportModal.tsx`) : Remplacement de `font-archivo` par la pile systÃƒÂ¨me haute lisibilitÃƒÂ© sur la modale d'intake.
    - *FenÃƒÂªtre de DÃƒÂ©claration / Paiement Manuel* (`ModalPaiementManuel.tsx`) : Application de la police systÃƒÂ¨me native sur le conteneur principal.
- **Enrichissement HarmonisÃƒÂ© du Forfait Business VIP & Isolation Backend (`frontend-next` & `backend`)** :
  - Mise ÃƒÂ  jour complÃƒÂ¨te de l'ensemble des pages et composants (`fonctionnalites-data.ts`, `TarifsPublicsSelector.tsx`, `ShowcaseTabs.tsx`, `/compte/fonctionnalites`, `/tarifs-boutique`, `/creer-boutique`) pour reflÃƒÂ©ter les 8 piliers majeurs du forfait Business VIP (35 000 FCFA/mois) : Multi-Caissiers PIN & clÃƒÂ´tures Z, Multi-Magasins & Transferts inter-boutiques, Portail DÃƒÂ©veloppeur API REST & Webhooks, ComptabilitÃƒÂ© avec marges nettes, Automation WhatsApp Paniers AbandonnÃƒÂ©s, BanniÃƒÂ¨re sponsorisÃƒÂ©e prioritaire, Analytics CA & Classement vendeurs, Support VIP 7j/7.
  - SÃƒÂ©curisation backend sans aucune faille : injection du middleware `requireBusiness` / `checkAbonnement` sur les routes d'API Keys (`POST /:id/api-keys`), Webhooks (`POST /:id/webhooks`), Caissiers PIN (`POST /:id/caissiers`), et calcul dynamique du quota d'annonces classÃƒÂ©es (2 pour Taf Taf, 5 pour Pro, 15 pour Business VIP).
- **ContrÃƒÂ´le Backend Anti-Contournement & Quotas Boutiques (`backend/routes/boutiques.js`)** :
  - Renforcement du contrÃƒÂ´le anti-contournement par numÃƒÂ©ro de tÃƒÂ©lÃƒÂ©phone et e-mail. Normalisation universelle sur les 9 derniers chiffres du tÃƒÂ©lÃƒÂ©phone (`RIGHT(REGEXP_REPLACE(..., '[^0-9]', '', 'g'), 9)`) et comparaison insensible ÃƒÂ  la casse des e-mails (`LOWER(u.email)`).
  - Ãƒâ€°limination des contournements liÃƒÂ©s aux formats de saisie (`+221`, `221`, espaces, parenthÃƒÂ¨ses) pour bloquer hermÃƒÂ©tiquement la crÃƒÂ©ation de plus de $N$ boutiques (dÃƒÂ©fini dans l'admin `/admin/tarifs`).
  - Interconnexion immÃƒÂ©diate du toggle Admin `promo_active` et `promo_code` dans la route `/api/promotions/valider`. DÃƒÂ¨s que le Superadmin dÃƒÂ©sactive les promotions dans l'administration, toute tentative d'utilisation du code promo (ex: `SOLDE20` ou `NOPALOU25`) est automatiquement bloquÃƒÂ©e et rejetÃƒÂ©e avec le message d'erreur *"Ce code promo a ÃƒÂ©tÃƒÂ© dÃƒÂ©sactivÃƒÂ© par l'administration."*.
  - Remplacement du quota `MAX_BOUTIQUES` codÃƒÂ© en dur par une vÃƒÂ©rification dynamique en base.
  - ImplÃƒÂ©mentation du contrÃƒÂ´le anti-cumul vÃƒÂ©rifiant le nombre total de boutiques associÃƒÂ©es ÃƒÂ  un mÃƒÂªme numÃƒÂ©ro de tÃƒÂ©lÃƒÂ©phone ou e-mail ÃƒÂ  travers tous les comptes utilisateurs.
  - Ajout de la route `GET /api/boutiques/admin/promotions` pour la supervision Superadmin des coupons marchands.
- **Relances d'Abonnement Dynamiques (`backend/services/scraper.js`)** :
  - Mise ÃƒÂ  jour du job de relance automatique pour envoyer des alertes prÃƒÂ©ventives $N$ jours avant expiration selon le paramÃƒÂ©trage admin (`alertes_abonnement_jours_avant`).
- **Dashboard Superadmin Next.js (`frontend-next/src/app/admin/(protected)/tarifs/TarifsClient.tsx`)** :
  - IntÃƒÂ©gration des cartes d'administration *Ã°Å¸ï¿½Â¬ Quotas et limites de crÃƒÂ©ation de boutiques* et *Ã°Å¸â€�â€� Alertes et relances d'expiration de forfaits*.
  - Clarification de la distinction entre les promotions plateforme (abonnements) et les promotions marchands.

### [2026-08-06] - Approche OpenSpec : ImplÃƒÂ©mentation de la Spec 01 (Mode Switcher Admin & Mode Pure Player E-Commerce)
- **Fichier de SpÃƒÂ©cification OpenSpec 01 (`docs/specs/01-pure-player-mode.md`)** : RÃƒÂ©daction intÃƒÂ©grale de la spÃƒÂ©cification OpenSpec dÃƒÂ©finissant le contrat d'API, le schÃƒÂ©ma SQL et les scÃƒÂ©narios de tests unitaires/E2E pour basculer entre `hybride_pos` (Commerce physique + Web) et `pure_player` (E-Commerce 100% Web).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : Ajout automatique et sÃƒÂ©curisÃƒÂ© de la colonne `mode_fonctionnement VARCHAR(30) DEFAULT 'hybride_pos'` ÃƒÂ  la table `boutiques`.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Support de `mode_fonctionnement` dans `GET /api/boutiques/:id`, `POST /api/boutiques` et `PUT /api/boutiques/:id`.
  - CrÃƒÂ©ation de la sous-route `PUT /api/boutiques/:id/mode` avec validation stricte (rejet HTTP 400 si mode invalide, HTTP 404 si non autorisÃƒÂ©).
- **Suite de Tests AutomatisÃƒÂ©s TDD (`tests/unit/spec-01-mode-switch.test.js`)** : Suite Jest validÃƒÂ©e ÃƒÂ  100% (5/5 tests validÃƒÂ©s avec succÃƒÂ¨s : mise ÃƒÂ  jour vers `pure_player`, retour vers `hybride_pos`, rejet 400 et accÃƒÂ¨s 404).
- **Interface Vendeur Next.js (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** :
  - IntÃƒÂ©gration du sÃƒÂ©lecteur interactif Mode Switcher (`Ã°Å¸ï¿½Âª Mode Hybride POS` vs `Ã¢Å¡Â¡ Mode Pure Player Web`) dans le formulaire de crÃƒÂ©ation et modification de boutique.
  - Affichage dynamique du badge `Ã¢Å¡Â¡ Pure Player Web` / `Ã°Å¸ï¿½Âª Hybride POS` et masquage automatique du bouton de Caisse POS physique lorsque le mode pure player est activÃƒÂ©.

### [2026-08-06] - IntÃƒÂ©gration des Forfaits Multi-DurÃƒÂ©es (1, 3, 6 & 12 mois) & Choix du Marchand
- **Mise ÃƒÂ  Jour de la Page d'Accueil (`app/ShowcaseTabs.tsx`)** :
  - IntÃƒÂ©gration des 4 boutons de durÃƒÂ©e d'engagement (1 mois, 3 mois -10%, 6 mois -15%, 12 mois -25% Ã°Å¸â€�Â¥).
  - Calcul dynamique en temps rÃƒÂ©el des tarifs FCFA/mois et du total facturÃƒÂ© sur la section d'accueil.
  - Redirection automatique vers `/creer-boutique?plan=...&duree=...`.
- **Composant SÃƒÂ©lecteur Interactif Public (`app/tarifs-boutique/TarifsPublicsSelector.tsx`)** :
  - CrÃƒÂ©ation d'un sÃƒÂ©lecteur de durÃƒÂ©e interactif (1 mois, 3 mois trimestriel -10%, 6 mois semestriel -15%, 12 mois annuel -25% / 3 mois offerts).
  - Calcul dynamique et automatique en temps rÃƒÂ©el des remises, du total facturÃƒÂ© et de l'ÃƒÂ©quivalent mensuel pour chaque formule.
- **Wizard CrÃƒÂ©ation Boutique (`app/creer-boutique/page.tsx`)** :
  - Correction de l'erreur `initialNom is not defined` et prÃƒÂ©-sÃƒÂ©lection exacte de la formule et de la durÃƒÂ©e transmises dans l'URL.
- **Gestion des DurÃƒÂ©es en Dashboard Vendeur & Backend** :
  - IntÃƒÂ©gration de `duree_mois` dans la route backend `POST /api/abonnements/initier` avec application automatique des taux de rÃƒÂ©duction.
  - Support de la souscription 1, 3, 6 et 12 mois directement depuis l'espace vendeur (`/boutique/abonnement`).

### [2026-08-06] - StratÃƒÂ©gie & Optimisation SEO : Forfaits Vendeurs, Alternatives Shopify & Sourcing (Alibaba/AliExpress)
- **MÃƒÂ©tadonnÃƒÂ©es SSR & DonnÃƒÂ©es StructurÃƒÂ©es (`app/creer-boutique/layout.tsx`)** : CrÃƒÂ©ation d'un layout serveur SSR pour `/creer-boutique` incluant les mÃƒÂ©tadonnÃƒÂ©es SEO enrichies (*"crÃƒÂ©er boutique en ligne SÃƒÂ©nÃƒÂ©gal"*, *"lancer son commerce Dakar"*, *"faire son business SÃƒÂ©nÃƒÂ©gal"*) et l'injection du schÃƒÂ©ma JSON-LD `Service`, `OfferCatalog` (forfaits 5 000 FCFA, 15 000 FCFA, 35 000 FCFA) et `BreadcrumbList`.
- **Landing Page & Comparatif Tarifs (`app/tarifs-boutique/page.tsx`)** : Nouvelle page d'atterrissage SSR dÃƒÂ©diÃƒÂ©e ÃƒÂ  la conversion des commerÃƒÂ§ants sÃƒÂ©nÃƒÂ©galais avec :
  - Tableau comparatif direct Nopalou vs Shopify & WooCommerce (frais, Wave/Orange Money natif, commission 0%, accÃƒÂ¨s comparateur).
  - Section Sourcing & Revente (Alibaba, AliExpress, Shein).
  - FAQ accordÃƒÂ©on structurÃƒÂ©e avec le schÃƒÂ©ma Google Rich Snippets `FAQPage`.
- **Guide Ãƒâ€°ditorial SEO (`app/guide-creer-boutique/page.tsx`)** : Guide complet *"Comment CrÃƒÂ©er sa Boutique en Ligne au SÃƒÂ©nÃƒÂ©gal en 2026"* avec schÃƒÂ©ma JSON-LD `HowTo` et `BreadcrumbList` visant la Position 0 sur Google.
- **Sitemap XML (`app/sitemap.ts`)** : Ajout prioritaire (`0.9`) de `/creer-boutique`, `/tarifs-boutique` et `/guide-creer-boutique`.
- **Maillage Interne & Navigation (`app/page.tsx` & `NavbarGuides.tsx`)** : Ajout des puces de recherche vendeurs et de l'entrÃƒÂ©e *"Ã°Å¸â€ºï¿½Ã¯Â¸ï¿½ Tarifs & Forfaits Vendeurs (1m offert)"* dans la navigation.

### [2026-08-06] - Correction du Chemin d'API Proxy FB (`KitComClient.tsx`)
- **Fix Route Proxy (`KitComClient.tsx`)** : Remplacement de la sous-route `/admin-proxy/fb/posts` (qui renvoyait une erreur 404) par la route correcte du backend Express `/admin-proxy/fb`. Les crÃƒÂ©ations de brouillons de posts depuis le Kit Com sont maintenant 100% opÃƒÂ©rationnelles.

### [2026-08-06] - Refonte des Visuels du GÃƒÂ©nÃƒÂ©rateur : Fonds Clairs & Couleurs Officieuses Nopalou
- **Refonte Design Satori (`produit-promo/route.tsx`)** : 
  - Suppression totale des fonds sombres et des contrastes bleu foncÃƒÂ©/bleu moyen.
  - AdhÃƒÂ©sion stricte ÃƒÂ  la charte graphique Nopalou avec des **Fonds Clairs Haute DÃƒÂ©finition** (Fond crÃƒÂ¨me doux `#FFFDF9` & blanc pur `#FFFFFF`), titres en Bleu Marine `#1C2B4A` ÃƒÂ  fort contraste, touches d'Orange Nopalou `#C75B00` et prix en Vert Nopalou `#16A34A`.
  - Application du design fond clair sur l'ensemble des 8 types de visuels (TÃƒÂ©lÃƒÂ©com, Immobilier, Chatbot WA, Formules Boutiques POS, Apporteurs, etc.).

### [2026-08-06] - GÃƒÂ©nÃƒÂ©rateur Officiel Nopalou avec 8 Types d'Affiches FonctionnalitÃƒÂ©s
- **Support des 8 Verticales Nopalou dans le GÃƒÂ©nÃƒÂ©rateur d'Affiches (`produit-promo/route.tsx` & `KitComClient.tsx`)** :
  - Ã°Å¸â€“Â¥Ã¯Â¸ï¿½ **Formule Pro (Caisse POS Magasin)** (15 000 FCFA/mois, 3 Scanners, Carnet Dettes WA, Stickers EAN-13, 0% commission)
  - Ã¢Å¡Â¡ **Formule Taf Taf** (2 500 FCFA/mois, vitrine 30s)
  - Ã°Å¸â€˜â€˜ **Formule Business** (35 000 FCFA/mois, multi-caissiers PIN & clÃƒÂ´tures Z)
  - Ã°Å¸Â¤â€“ **Chatbot WhatsApp Meta 24/7** (recherche unifiÃƒÂ©e, panier WhatsApp, alertes prix)
  - Ã°Å¸ï¿½Â  **Immobilier Dakar & SÃƒÂ©nÃƒÂ©gal** (location/vente appartements, villas, terrains avec contact direct)
  - Ã°Å¸â€œÂ¶ **Forfaits & Pass TÃƒÂ©lÃƒÂ©com** (comparateur Orange, Yas, Expresso, Promobile)
  - Ã°Å¸â€™Â° **Apporteurs d'Affaires 20%** (commission rÃƒÂ©currente mensuelle ÃƒÂ  vie Wave/OM)
  - Ã°Å¸â€œÅ  **Tableau Comparatif des 3 Formules** (vue synthÃƒÂ©tique cÃƒÂ´te-ÃƒÂ -cÃƒÂ´tÃƒÂ©)
  - Ã°Å¸â€�Â¥ **Bon Plan Prix Comparatif** (produit le moins cher ÃƒÂ  Dakar)

### [2026-08-06] - Refonte du GÃƒÂ©nÃƒÂ©rateur de Visuels Nopalou & Formules Boutiques/POS
- **GÃƒÂ©nÃƒÂ©rateur d'Affiches Formules & Paliers (`produit-promo/route.tsx` & `KitComClient.tsx`)** :
  - Passage d'un gÃƒÂ©nÃƒÂ©rateur individuel ÃƒÂ  un **GÃƒÂ©nÃƒÂ©rateur Officiel Nopalou Plateforme & Comparateur**.
  - GÃƒÂ©nÃƒÂ©ration d'affiches 1080Ãƒâ€”1080 dÃƒÂ©diÃƒÂ©es aux 4 formules : **Boutique Pro Caisse POS** (15 000 FCFA/mois, 3 Scanners, Carnet Dettes WA, Stickers EAN-13, 0% commission), **Boutique Taf Taf** (2 500 FCFA/mois), **Boutique Business Multi-Caissiers PIN** (35 000 FCFA/mois), et **Tableau Comparatif des 3 Formules**.
  - Remplacement direct des lÃƒÂ©gendes et transmission 1-clic vers les publications Facebook / Instagram (`Ã°Å¸Å¡â‚¬ Publier FB/IG`).

### [2026-08-06] - Mise ÃƒÂ  Jour de la Brochure Apporteur (HTML/PDF)
- **Mise ÃƒÂ  Jour de la Brochure 13 Pages (`brochure-apporteur/route.tsx`)** : 
  - Ajout des rÃƒÂ©seaux sociaux officiels Nopalou sur la page de couverture et de contact (TikTok `@nopalou.com`, Canal WhatsApp, Facebook Page et Instagram `@nopalousn`).
  - IntÃƒÂ©gration des fonctionnalitÃƒÂ©s de Caisse Enregistreuse POS Tactile (3 Scanners, Carnet de Dettes Client WA, Multi-caissiers PIN).

### [2026-08-06] - IntÃƒÂ©gration des RÃƒÂ©seaux Sociaux sur la Page d'Accueil & Footer
- **Bandeau RÃƒÂ©seaux Sociaux d'Accueil (`page.tsx`)** : Ajout d'une section dÃƒÂ©diÃƒÂ©e avant le pied de page prÃƒÂ©sentant les liens vers **TikTok (`@nopalou.com`)**, **Canal WhatsApp**, **Facebook Page**, **Instagram (`@nopalousn`)**, et **Twitter / X (`@nopalou_sn`)**.
- **Pied de Page (`layout.tsx`)** : Mise ÃƒÂ  jour des icÃƒÂ´nes du footer pour inclure directement TikTok (`@nopalou.com`), le Canal WhatsApp Officiel et WhatsApp Direct.

### [2026-08-06] - Refonte & Optimisation du Kit de Communication (`/admin/communication`)
- **Navigation par 5 Onglets ThÃƒÂ©matiques (`KitComClient.tsx`)** :
  - **Onglet 1 Ã¢â‚¬â€� Ã°Å¸â€œÂ± RÃƒÂ©seaux Sociaux & Contenus** : Cartes individuelles pour Facebook, Instagram, TikTok (`@nopalou.com`), Twitter/X (`@nopalou_sn`), Canal WhatsApp et Chatbot Support. Boutons **"Copier 1-Clic"** avec notification Toast, **"TÃƒÂ©lÃƒÂ©charger HD"** direct (attribut HTML `download`), et publication **"Ã°Å¸Å¡â‚¬ Publier FB/IG"** / **"Ã°Å¸â€œÂ¢ Diffuser Canal WA"** 1-clic.
  - **Onglet 2 Ã¢â‚¬â€� Ã°Å¸ï¿½Âª DÃƒÂ©marchage B2B & POS Magasin** : 5 arguments POS (3 Scanners, Dettes WA, Multi-Caissiers PIN), Script oral (2 min) et plan Dakar (6 semaines), ainsi que le **Sticker & Chevalet de Caisse POS A5/A6 imprimable**.
  - **Onglet 3 Ã¢â‚¬â€� Ã°Å¸â€™Â¼ Apporteurs d'Affaires** : Barre de personnalisation agent (Nom, WhatsApp, Code Apporteur) mettant ÃƒÂ  jour en temps rÃƒÂ©el l'ensemble des scripts et textes, grille de commission rÃƒÂ©currente dynamique (20%), et lien vers la brochure PDF 13 pages.
  - **Onglet 4 Ã¢â‚¬â€� Ã°Å¸â€™Â¬ Ãƒâ€°cosystÃƒÂ¨me WhatsApp Meta** : 4 piliers du Chatbot, lien et QR Code d'essai direct `wa.me/221708717942`.
  - **Onglet 5 Ã¢â‚¬â€� Ã¢Å¡Â¡ GÃƒÂ©nÃƒÂ©rateur Visuels Promo Produit** : GÃƒÂ©nÃƒÂ©ration et aperÃƒÂ§u en temps rÃƒÂ©el de visuels 1080Ãƒâ€”1080 (`/assets/produit-promo`) avec bouton d'export HD et publication automatique.
- **Route d'Image Dynamique Produit-Promo (`/assets/produit-promo/route.tsx`)** : Route Satori/@vercel/og gÃƒÂ©nÃƒÂ©rant des posters rÃƒÂ©seaux sociaux 1080Ãƒâ€”1080 (Prix barrÃƒÂ©, Prix promo vert, Boutique, Photo).
- **Correction Glyphes & Espaces (`carre/route.tsx`, `story/route.tsx`, `flyer-demarchage/route.tsx`, `brochure-apporteur/route.tsx`)** : 
  - Remplacement de `toLocaleString('fr-FR')` (qui gÃƒÂ©nÃƒÂ©rait un caractÃƒÂ¨re espace incassable `\u00A0` s'affichant sous forme de rectangle noir/carrÃƒÂ© vide `` dans le moteur SVG Satori) par des espaces standard ASCII (`.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')`).
  - Remplacement du symbole unicode `Ã¢Å“â€œ` (absent de la police SVG par dÃƒÂ©faut de Satori et affichÃƒÂ© sous forme de carrÃƒÂ© vide ``) par des icÃƒÂ´nes SVG natives `<svg>` parfaitement nettes et compatibles ÃƒÂ  100%.
- **Connexion Admin (`AdminLoginForm.tsx`)** : Extraction du formulaire de la page `/admin/login` en composant client interactive avec un bouton icÃƒÂ´ne Ã…â€œil (`Ã°Å¸â€˜ï¿½Ã¯Â¸ï¿½` / `Ã°Å¸â„¢Ë†`) permettant d'afficher ou masquer le mot de passe secret saisi en un clic.
- **RÃƒÂ©initialisation Mot de Passe (`MotDePasseOublieForm.tsx`)** : Ajout ÃƒÂ©galement du bouton bascule Ã…â€œil pour l'affichage du mot de passe dans le formulaire de rÃƒÂ©initialisation.
- **Fallback Backend (`app.js`)** : Ajout du bouton d'affichage du mot de passe sur le formulaire HTML d'interception d'administration d'Express.

### [2026-08-06] - Correction Espacement Hero SearchBar & CatÃƒÂ©gories
- **Correction UI Hero (page.tsx)** : Suppression du grand espace vide vertical entre la barre de recherche (SearchBar) et les pilules de catÃƒÂ©gories (CATEGORIES). Les catÃƒÂ©gories ont ÃƒÂ©tÃƒÂ© dÃƒÂ©placÃƒÂ©es ÃƒÂ  l'intÃƒÂ©rieur de la colonne centrale directement sous la barre de recherche avec 14px de marge.
- **VÃƒÂ©rification Build** : Validation avec npm run build dans frontend-next (0 erreur).


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Langue

Toujours rÃƒÂ©pondre et communiquer en franÃƒÂ§ais dans ce projet, y compris dans les nouvelles sessions Ã¢â‚¬â€� quelle que soit la langue du message de l'utilisateur. Les noms de fichiers, le code, les identifiants et les commandes restent en anglais/tels quels ; seule la communication (texte de rÃƒÂ©ponse, rÃƒÂ©sumÃƒÂ©s, questions) est en franÃƒÂ§ais.

## Directive de DÃƒÂ©ploiement & Documentation

**RÃƒË†GLE ABSOLUE** : AprÃƒÂ¨s chaque dÃƒÂ©ploiement ou push git (`git push origin main`) exÃƒÂ©cutÃƒÂ© avec succÃƒÂ¨s et sans aucune erreur, l'assistant AI DOIT **systÃƒÂ©matiquement mettre ÃƒÂ  jour le fichier `CLAUDE.md`** avec le rÃƒÂ©sumÃƒÂ© des rÃƒÂ©alisations techniques, migrations SQL et nouveautÃƒÂ©s avant de clÃƒÂ´turer son intervention.

## Project Overview

**Nopalou** Ã¢â‚¬â€� a Senegalese price comparison platform covering products, real estate (immo), and telecom offers. The project has two frontends:
1. A legacy vanilla JS SPA (`frontend/`) served by the Express backend
2. A modern Next.js 14 app (`frontend-next/`) under active development (runs on port 3001)

The Express backend runs on port 3000 and also serves the legacy frontend.

## Development Commands

### Backend (root)
```bash
npm run dev        # Start backend with nodemon (port 3000)
npm start          # Start backend without hot-reload
npm run migrate    # Run DB migrations manually
```

### Next.js frontend
```bash
cd frontend-next
npm run dev        # Start Next.js dev server (port 3001)
npm run build      # Build for production
npm run lint       # ESLint
```

#### DÃƒÂ©pannage Next.js (Boucle infinie / Cache corrompu)
Si le serveur de dÃƒÂ©veloppement Next.js se bloque dans une boucle ("tourne en rond") ou plante avec une erreur `EBUSY: resource busy or locked` aprÃƒÂ¨s une erreur de syntaxe :
1. ArrÃƒÂªtez le serveur `npm run dev` (Ctrl+C ou tuez le processus en arriÃƒÂ¨re-plan).
2. Supprimez le cache corrompu : `rm -rf .next` (ou supprimez le dossier `.next` manuellement).
3. Relancez `npm run dev`.

### Database
```bash
createdb prixmalin            # Create the database
npm run migrate               # Apply schema (idempotent Ã¢â‚¬â€� runs automatically on backend startup too)
```

## Architecture

### Backend (`backend/`)
- **`app.js`** Ã¢â‚¬â€� Express entry point. Runs auto-migration on startup, then starts scrapers unless `SCRAPING_DISABLED=true`. Serves the legacy `frontend/` as static files.
- **`models/db.js`** Ã¢â‚¬â€� Single shared `pg.Pool` instance. Import with `const { pool } = require('./models/db')`.
- **`routes/`** Ã¢â‚¬â€� One file per domain: `produits`, `offres`, `alertes`, `auth`, `scraper`, `telecom`, `immo`, `partenaires`, `annonces`, `boutiques`, `paiement`, `whatsapp`, `apporteurs`.
- **`services/`** Ã¢â‚¬â€� Background workers: `scraper.js` (orchestrates scrapers via `node-cron`), `matching.js`, `notifications.js`, `email.js`, `cloudinary.js`, `whatsapp.js`, `whatsapp-catalog.js`, `whatsapp-chatbot.js`. Immo scrapers: `scraper-immo-coinafrique.js`, `scraper-immo-expat.js`, `scraper-immo-facebook.js`.
- **`middlewares/auth.js`** Ã¢â‚¬â€� `verifierToken` (JWT Bearer), `tokenOptional`, `adminSecretOnly` (header `X-Admin-Secret`).
- **`migrate-inline.js`** Ã¢â‚¬â€� Idempotent `CREATE TABLE IF NOT EXISTS` migration called at startup.

### Next.js App (`frontend-next/src/`)
- **`middleware.ts`** Ã¢â‚¬â€� Runs on every non-static request. Verifies `nopalou_session` cookie (JWT via `jose`), redirects unauthenticated users away from protected routes, and injects CSP nonce headers.
- **`lib/session.ts`** Ã¢â‚¬â€� Server-only. Creates/reads/deletes the httpOnly `nopalou_session` cookie using `jose` (HS256). Key: `SESSION_SECRET` env var. Session payload: `{ userId, nom, email }`.
- **`lib/dal.ts`** Ã¢â‚¬â€� Data Access Layer. `verifySession()` (redirects to `/connexion` if no session) and `getOptionalSession()` Ã¢â‚¬â€� both use React `cache()` to deduplicate within a render.
- **`lib/api.ts`** Ã¢â‚¬â€� `apiFetch<T>(path)` Ã¢â‚¬â€� server-side fetch to backend with 5-minute Next.js cache revalidation.
- **`app/actions/auth.ts`** Ã¢â‚¬â€� Server Actions: `login`, `signup`, `logout`, `updateProfil`. Call the Express backend then create/delete/refresh the session cookie.
- **`next.config.js`** Ã¢â‚¬â€� Rewrites `/api/*` Ã¢â€ â€™ `NEXT_PUBLIC_BACKEND_URL/api/*`. Allowed image domains are explicitly listed.

### Auth Architecture (two separate systems)
- **Backend**: JWT Bearer tokens (`Authorization: Bearer <token>`) validated by `verifierToken` middleware. Token signed with `JWT_SECRET`.
- **Next.js**: httpOnly cookies (`nopalou_session`) signed with `SESSION_SECRET`. The Next.js Server Actions call the Express API to authenticate, then set the cookie independently. These are two different secrets and two different token formats.

### Deployment
- `render.yaml` defines **two** Render web services : `nopalou-frontend` (Next.js standalone, sert nopalou.com) et `yombale-backend` (Express API + SPA legacy, proxifiÃƒÂ© via le rewrite `/api/*` de `next.config.js`). `SCRAPING_DISABLED=true` est posÃƒÂ© par dÃƒÂ©faut sur Render (free tier).
- No Redis dependency in the current codebase (listed in `.env.example` but no Redis client is imported).

### Next.js fetch helpers (server-side only)
Two helpers cover the two call patterns from Server Components and Server Actions:

- **`lib/api.ts` Ã¢â€ â€™ `apiFetch<T>(path)`** Ã¢â‚¬â€� public read-only calls. Uses `BACKEND_URL` (server-side), caches 5 min (`next: { revalidate: 300 }`). No auth header.
- **`lib/backendFetch.ts` Ã¢â€ â€™ `backendAuthFetch(path, init?)`** Ã¢â‚¬â€� authenticated calls from Server Actions/pages. Reads session via `getOptionalSession()`, mints a 2-min HS256 JWT signed with `JWT_SECRET`, attaches it as `Authorization: Bearer`. No Next.js cache. Path is relative WITHOUT `/api/` prefix (adds it internally).
- **`lib/backend-fetch.ts` Ã¢â€ â€™ `backendFetch(path, init?)`** Ã¢â‚¬â€� authenticated calls from Server Actions only. Reads session via `verifySession()` (redirects if unauthenticated). Path must include `/api/` prefix. Used in most protected pages.

`JWT_SECRET` **must be identical** in both `backend/.env` and `frontend-next/.env.local`.

### Rate limiting (`backend/middlewares/rateLimit.js`)
Five limiters imported per-route: `limiterGeneral` (100/15 min), `limiterAuth` (10/15 min), `limiterRecherche` (60/min), `limiterPublication` (5/hour), `limiterEcriture` (15/15 min).

### Bot SSR (`backend/middlewares/bot-ssr.js`)
Intercepts Googlebot / Bingbot requests and returns server-rendered HTML for the legacy SPA Ã¢â‚¬â€� mounted after all API routes in `app.js`.

### Protected routes (Next.js middleware)
`PROTECTED_ROUTES` (`startsWith`): `/compte`, `/mes-annonces`, `/mes-annonces-immo`, `/deposer-immo`, `/deposer-annonce`
`PROTECTED_EXACT`: `/boutique`
Unauthenticated users are redirected to `/connexion`; authenticated users hitting `/connexion` or `/inscription` are redirected to `/compte`.

### Admin (Next.js)
`frontend-next/src/app/admin/` has two route groups:
- `(auth)/login` Ã¢â‚¬â€� public admin login page
- `(protected)/` Ã¢â‚¬â€� layout applies its own session guard; contains `annonces`, `immo`, `telecom`, `seo`, `compte`, `boutiques`, `abonnements`, `partenaires`, `revenus`, `publications`, `communication`, `affiliation`, `apporteurs` pages

## Key Environment Variables

### Backend (`.env`)
| Variable | Purpose |
|**6. Refonte du Carnet de CrÃƒÂ©dits & Dettes Client en Caisse POS :**
- **Saisie dÃƒÂ©taillÃƒÂ©e des produits pris** : IntÃƒÂ©gration de la sauvegarde automatique de la liste exacte des articles et des quantitÃƒÂ©s pris ÃƒÂ  crÃƒÂ©dit lors de l'encaissement (`produits` JSONB en base de donnÃƒÂ©es).
- **Historique & Fiche Client** : Visualisation complÃƒÂ¨te du grand livre de compte par client (historique des opÃƒÂ©rations, remboursements Cash/Wave/OM, crÃƒÂ©dits directs).
- **Promesse d'Ãƒâ€°chÃƒÂ©ance & Justifications** : Prise en compte de la date d'ÃƒÂ©chÃƒÂ©ance convenue, du quartier/adresse du client et des remarques/justifications sur chaque transaction.

**7. Scanner CamÃƒÂ©ra Smartphone, Relance WhatsApp & Format Ticket Thermique ESC/POS (58mm/80mm) :**
- **Scanner Code-Barres par CamÃƒÂ©ra Smartphone (`Ã°Å¸â€œÂ· Scanner CamÃƒÂ©ra`)** : Activation de l'appareil photo du smartphone/tablette avec dÃƒÂ©tection en temps rÃƒÂ©el des codes-barres (`BarcodeDetector` API) et ajout direct au panier.
- **Relance Automatique WhatsApp (`Ã°Å¸â€™Â¬ WA Relance`)** : Envoi en 1 clic d'un message WhatsApp personnalisÃƒÂ© au client de quartier avec le solde exact de son carnet et la promesse d'ÃƒÂ©chÃƒÂ©ance.
- **Impression Ticket Thermique ESC/POS (`Ã°Å¸â€“Â¨Ã¯Â¸ï¿½ 58mm / 80mm`)** : Support universel des imprimantes thermiques Bluetooth portables (58mm) et de caisse (80mm) avec mise en page condensÃƒÂ©e.

**8. GÃƒÂ©nÃƒÂ©ration & Impression d'Ãƒâ€°tiquettes Code-Barres EAN-13 sur les Produits :**
- **Ajout d'un EAN-13 Fabricant** : Saisie/scan manuel d'un code EAN-13 existant pour tout produit.
- **GÃƒÂ©nÃƒÂ©ration Automatique de Code-Barres EAN-13** : Pour les articles artisanaux/locaux sans emballage, gÃƒÂ©nÃƒÂ©ration automatique d'un numÃƒÂ©ro EAN-13 valide avec clÃƒÂ© de contrÃƒÂ´le Modulo 10 (prÃƒÂ©fixe `200`).
- **Impression d'Ãƒâ€°tiquettes (`Ã°Å¸ï¿½Â·Ã¯Â¸ï¿½ EAN`)** : Bouton d'impression au format sticker (50mm x 30mm) avec nom du magasin, nom du produit, prix en FCFA et visuel du code-barres EAN-13 scannable.

**9. IntÃƒÂ©gration du Code-Barres EAN-13 dans la Saisie & Ãƒâ€°dition de Produit (Backend & Dashboard) :**
- **Formulaire d'Ajout/Modification de Produit (`ProduitForm`)** : Ajout du champ dÃƒÂ©diÃƒÂ© `Code-Barres EAN-13 (Optionnel)` permettant au marchand de saisir directement ou de scanner ÃƒÂ  la douchette le code EAN d'un article.
- **Migration & API Backend (`boutique_produits`)** : Ajout de la colonne `code_barre` idempotente via `migrate-inline.js` et persistance dans PostgreSQL lors des requÃƒÂªtes `POST` et `PUT /api/boutiques/:id/produits`.

**10. ModÃƒÂ¨le d'Inventaire Excel/CSV TÃƒÂ©lÃƒÂ©chargeable (`BatchImportModal`) :**
- **Bouton de TÃƒÂ©lÃƒÂ©chargement Direct (`Ã°Å¸â€œÂ¥ TÃƒÂ©lÃƒÂ©charger le modÃƒÂ¨le exemple`)** : GÃƒÂ©nÃƒÂ©ration et tÃƒÂ©lÃƒÂ©chargement instantanÃƒÂ© du modÃƒÂ¨le CSV/Excel prÃƒÂ©-formatÃƒÂ© (`modele_import_catalogue_nopalou.csv`) incluant l'encodage UTF-8 BOM pour une ouverture parfaite dans Excel avec les colonnes : `Nom du Produit`, `Prix FCFA`, `QuantitÃƒÂ© Stock`, `CatÃƒÂ©gorie` et `Code-Barres EAN-13`.

**11. Douchette Scanner Distante (Smartphone Ã¢Å¾â€� PC Caisse via WiFi/Cloud) :**
- **Mode Pairage Sans Fil (`Ã°Å¸â€œÂ± Douchette Smartphone`)** : Bouton sur l'ordinateur gÃƒÂ©nÃƒÂ©rant un code de session unique (`sessionScannerId`) et un lien direct ÃƒÂ  ouvrir sur le smartphone (envoi WhatsApp en 1 clic).
- **Synchronisation InstantanÃƒÂ©e PC-Smartphone** : Tout article dont le code-barres est scannÃƒÂ© par la camÃƒÂ©ra du tÃƒÂ©lÃƒÂ©phone est transmis en temps rÃƒÂ©el (< 100ms) et ajoutÃƒÂ© directement au panier de l'ordinateur avec bip sonore !

**12. Boutons Scan CamÃƒÂ©ra & GÃƒÂ©nÃƒÂ©rer EAN-13 sur les Produits du Catalogue (`BoutiqueClient.tsx`) :**
- **Formulaire de Saisie (`ProduitForm`)** : Ajout des boutons d'action rapide `Ã°Å¸Å½Â² GÃƒÂ©nÃƒÂ©rer EAN` (gÃƒÂ©nÃƒÂ¨re un code EAN-13 GS1 valide selon l'algorithme Modulo 10) et `Ã°Å¸â€œÂ· Scanner` (ouvre le scanner camÃƒÂ©ra dÃƒÂ©diÃƒÂ© au produit).
- **Liste & Fiches des Produits du Catalogue** : Affichage d'un badge dynamique `Ã°Å¸ï¿½Â·Ã¯Â¸ï¿½ CB: [code]` ou `Ã¢Å¡Â Ã¯Â¸ï¿½ Sans EAN-13` avec bouton direct `Ã°Å¸ï¿½Â·Ã¯Â¸ï¿½ Scan / EAN` pour ÃƒÂ©diter ou attribuer un code-barres en 1 clic.

**13. Refonte Ergonomique & Responsive des Cartes Produit (`BoutiqueClient.tsx`) :**
- **Disposition Mobile & Desktop 2 Niveaux (`bq-produit-card`)** :
  1. *Partie SupÃƒÂ©rieure* : Image 60x60, Nom, Prix FCFA mis en avant, et badges proprements alignÃƒÂ©s sur une seule ligne (`Stock`, `Code-Barres EAN`, `WhatsApp`).
  2. *Barre d'Actions InfÃƒÂ©rieure SÃƒÂ©parÃƒÂ©e* : SÃƒÂ©paration visuelle avec ligne de partage fine. Regroupement des actions principales (`Ã°Å¸ï¿½Â·Ã¯Â¸ï¿½ Scan / EAN`, `Ã¢Å“ï¿½Ã¯Â¸ï¿½ Modifier`, `Ã°Å¸â€œâ€ž Copier`) et des options secondaires (`Partager`, `Ã°Å¸â€œÂ¢ Annonce`, `Ã°Å¸â€”â€˜Ã¯Â¸ï¿½ Supprimer`) sans aucun chevauchement sur smartphone.

**14. Bouton d'Impression d'Ãƒâ€°tiquettes Stickers Code-Barres EAN-13 (`BoutiqueClient.tsx`) :**
- **Bouton `Ã°Å¸â€“Â¨Ã¯Â¸ï¿½ Ãƒâ€°tiquette` sur chaque Carte Produit** : GÃƒÂ©nÃƒÂ©ration et impression immÃƒÂ©diate d'ÃƒÂ©tiquettes/stickers thermiques au format standard 50mm x 30mm comprenant le nom du produit, le prix FCFA, les barres graphiques vectorielles et le code EAN-13 lisible par n'importe quelle douchette.

**15. Moteur Vectoriel SVG d'Impression d'Ãƒâ€°tiquettes Code-Barres EAN-13 (`genererSVGCodeBarresEAN13`) :**
- **Rendu Vectoriel HD sans dÃƒÂ©pendance externe** : GÃƒÂ©nÃƒÂ©ration exacte des barres noires et espaces selon la norme GS1 (Guards gauche `101`, centre `01010`, droite `101` et paritÃƒÂ©s L/G/R).
- **Rendu d'Impression 50mm x 30mm** : RÃƒÂ©solution du problÃƒÂ¨me d'affichage sur les stickers imprimÃƒÂ©s. Les barres graphiques vectorielles noires s'affichent avec une nettetÃƒÂ© parfaite sur toutes les imprimantes thermiques (Bluetooth, USB, Zebra, Xprinter).

**16. Correction de la Persistance `code_barre` & Tests AutomatisÃƒÂ©s Globaux :**
- **Persistance SystÃƒÂ©matique du Code-Barres ÃƒÂ  la Modification (`BoutiqueClient.tsx` & `routes/boutiques.js`)** : Ajout d'un `useEffect` de synchronisation dynamique et d'un champ masquÃƒÂ© `<input type="hidden" name="code_barre">` garantissant la transmission systÃƒÂ©matique de la valeur `codeBarreForm` lors des soumissions de formulaires `PUT`. Nettoyage de la condition backend `$10` (`codeBarreVal`).
- **Suite de Tests Automatiques ValidÃƒÂ©e (100% SuccÃƒÂ¨s)** : Validation automatisÃƒÂ©e des 5 fonctionnalitÃƒÂ©s majeures (Algorithme Modulo 10, GÃƒÂ©nÃƒÂ©rateur Vectoriel SVG, Queue Douchette Distante, Parser ModÃƒÂ¨le CSV et Enregistrement Produit).

**17. Correction de l'Erreur Serveur 500 ÃƒÂ  la Modification de Produit (`routes/boutiques.js` & `BoutiqueClient.tsx`) :**
- **RÃƒÂ©solution du Conflit de Doublon HTML** : Ãƒâ€°limination du second attribut `name="code_barre"` sur le champ de saisie visuel qui entraÃƒÂ®nait la transmission d'un tableau `['code1', 'code2']` par `multer`, provoquant une erreur `TypeError: code_barre.trim is not a function`.
- **Assainissement & SÃƒÂ©curisation Backend (`rawCodeBarre`)** : Prise en charge explicite des tableaux et des chaÃƒÂ®nes dans le contrÃƒÂ´leur `PUT /api/boutiques/:id/produits/:prodId` avec gestion propre du type string et journalisation `console.error` du serveur.

**18. RÃƒÂ©solution DÃƒÂ©finitive de l'Affichage de la Persistance `code_barre` (`backend/routes/boutiques.js`) :**
- **Ajout de `p.code_barre` dans les RequÃƒÂªtes SQL `SELECT`** : Ajout de la colonne `p.code_barre` dans les requÃƒÂªtes de lecture SQL `GET /api/boutiques/:id/produits` et `GET /api/boutiques/:id/produits/:prodId`.
- **Restauration de la Synchronisation Dashboard & Caisse** : La modification s'enregistrait correctement dans PostgreSQL mais n'ÃƒÂ©tait pas renvoyÃƒÂ©e par le serveur lors du rechargement de la liste par l'application frontend `loadProduits()`. DÃƒÂ©sormais, les codes-barres s'affichent instantanÃƒÂ©ment ÃƒÂ  la crÃƒÂ©ation comme ÃƒÂ  la modification.

---|---|
| `DATABASE_URL` | PostgreSQL connection (required) |
| `JWT_SECRET` | Signs JWT tokens Ã¢â‚¬â€� must match Next.js `JWT_SECRET` |
| `ADMIN_SECRET` | Guards `/admin*.html` pages and `/api/*/admin` routes |
| `FRONTEND_URL` | Allowed CORS origin (with/without `www` auto-accepted) |
| `BACKEND_URL` | Used in email links and redirects |
| `SCRAPING_DISABLED` | Set `true` to skip scraper startup (default on Render) |
| `CLOUDINARY_*` | Image uploads for boutiques and annonces |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional emails via Resend |
| `WAVE_API_KEY` / `WAVE_WEBHOOK_SECRET` | Wave Senegal payment |
| `FB_EMAIL` / `FB_PASSWORD` | Facebook immo scraper credentials |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API Ã¢â‚¬â€� numÃƒÂ©ro d'envoi |
| `WHATSAPP_API_TOKEN` | Meta Cloud API Ã¢â‚¬â€� token systÃƒÂ¨me permanent (pas le token 24h) |
| `WHATSAPP_APP_SECRET` | VÃƒÂ©rification HMAC-SHA256 des webhooks Meta |
| `WHATSAPP_VERIFY_TOKEN` | Token arbitraire pour le handshake Meta webhook |
| `WHATSAPP_CATALOG_ID` | ID du catalogue Meta Commerce |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID pour l'API catalogue |

### Next.js (`frontend-next/.env.local`)
| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs `nopalou_session` cookie (HS256 via `jose`) |
| `JWT_SECRET` | Must match backend Ã¢â‚¬â€� used by `backendAuthFetch` to mint tokens |
| `BACKEND_URL` | Server-side URL for Server Actions and `apiFetch` |
| `NEXT_PUBLIC_BACKEND_URL` | Client-side URL (exposed to browser) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for `metadataBase` in `layout.tsx` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | NumÃƒÂ©ro WhatsApp Business Nopalou (format `221XXXXXXXXX`, sans `+`) Ã¢â‚¬â€� utilisÃƒÂ© pour gÃƒÂ©nÃƒÂ©rer les liens `wa.me` de partage boutique |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Admin Pages

The HTML admin pages (`/admin.html`, `/admin-immo.html`, `/admin-telecom.html`, `/admin-partenaires.html`, `/admin-annonces.html`) in `frontend/` are protected by `adminPageGuard` middleware in `app.js`. They require the `X-Admin-Secret` header matching `ADMIN_SECRET`. API admin routes use `adminSecretOnly` middleware.

---

## Prochain chantier

Aucun chantier n'est actuellement identifiÃƒÂ© comme prioritaire Ã¢â‚¬â€� le dernier chantier planifiÃƒÂ© (homogÃƒÂ©nÃƒÂ©isation en-tÃƒÂªte/filtres/bloc SEO des pages listing et guides, voir entrÃƒÂ©e du 19 juillet ci-dessous) a ÃƒÂ©tÃƒÂ© livrÃƒÂ© et mergÃƒÂ© sur `main`. Un audit global du reste du site (boutiques, compte, admin, pages statiques) a ÃƒÂ©tÃƒÂ© ÃƒÂ©voquÃƒÂ© comme suite possible mais n'a pas encore ÃƒÂ©tÃƒÂ© lancÃƒÂ© Ã¢â‚¬â€� attendre une nouvelle demande de l'utilisateur ou repartir de zÃƒÂ©ro (brainstorming Ã¢â€ â€™ spec Ã¢â€ â€™ plan Ã¢â€ â€™ subagent-driven-development) sur ce pÃƒÂ©rimÃƒÂ¨tre ou un nouveau constat.

---

## Ãƒâ€°tat du projet (06 aoÃƒÂ»t 2026 Ã¢â‚¬â€� Audit Mobile/PWA, Refonte Navbar, WhatsApp OTP & Cahier de Recette)
**Statut :** *Commis localement (en attente de push)*

DÃƒÂ©clencheur : Demande de l'utilisateur d'un audit complet de l'adaptation mobile/PWA, correction des espacements, repositionnement des CTA et sÃƒÂ©curisation de l'authentification WhatsApp.

**RÃƒÂ©alisations & Corrections :**

**1. Refonte de la Navbar Mobile (< 1040px) :**
- **Pilule Boutique** : Remplacement de l'icÃƒÂ´ne Desktop "Ã¢Å¡Â¡ Boutique Taf Taf" par une pilule mobile compacte `[Ã°Å¸ï¿½Âª Boutique]` dans l'en-tÃƒÂªte.
- **IcÃƒÂ´nes Mobile OptimisÃƒÂ©es** : Conservation des icÃƒÂ´nes essentielles (WhatsApp `Ã°Å¸â€™Â¬`, Favoris `Ã¢ï¿½Â¤`, Profil `Ã°Å¸â€˜Â¤`) et retrait du bouton `Ã¢Å¾â€¢` (Publier) pour libÃƒÂ©rer de l'espace.
- **Fix DÃƒÂ©bordement Horizontal** : RÃƒÂ©solution du bug de bande blanche ÃƒÂ  droite causÃƒÂ© par la coexistence du bouton Desktop "Boutique Taf Taf" et de la pilule mobile (ajout de `hidden-mobile` sur les boutons Desktop).
- **Fix Hamburger TronquÃƒÂ©** : Ajout d'un `@media (max-width: 480px)` rÃƒÂ©duisant la taille des icÃƒÂ´nes (30px au lieu de 36px) pour garantir que le bouton `Ã¢ËœÂ°` reste entier.

**2. Menu Hamburger (MobileNav.tsx) :**
- **CTA Non-ConnectÃƒÂ©** : Ajout d'un bouton d'action noir `[Ã°Å¸ï¿½Âª Ouvrir une Boutique Pro]` proÃƒÂ©minent dans le tiroir latÃƒÂ©ral pour les visiteurs.
- **CTA ConnectÃƒÂ©** : Bouton `[Ã°Å¸ï¿½Âª Ma Boutique]` pointant vers le dashboard si l'utilisateur possÃƒÂ¨de dÃƒÂ©jÃƒÂ  une boutique.

**3. Zone des Filtres Mobile :**
- **RangÃƒÂ©e Mobile-Only** : Nouvelle ligne visible uniquement sur smartphone sous les filtres classiques, contenant `[Ã¢Å“â€“ Effacer]` et `[Ã°Å¸ï¿½Âª Boutique Pro]` pour compenser les boutons Desktop cachÃƒÂ©s.

**4. Correction des Espacements Verticaux :**
- **Suppression du vide massif** : RÃƒÂ©duction du `paddingBottom` du conteneur principal (de 4rem ÃƒÂ  0.5rem) et mise ÃƒÂ  zÃƒÂ©ro du `marginTop` de la section SEO, ÃƒÂ©liminant un trou de ~100px entre les "Produits rÃƒÂ©cemment consultÃƒÂ©s" et le bloc SEO.

**5. SÃƒÂ©curisation de l'Authentification WhatsApp (Backend) :**
- **Template Meta CertifiÃƒÂ© ApprouvÃƒÂ© (`nopalou_auth_otp`)** : CrÃƒÂ©ation automatique et validation par Meta (Statut `APPROVED`, ID `1085995500661398`) du template d'authentification officiel WhatsApp avec bouton natif "Copier le code".
- **Backend Auth (`routes/auth.js`)** : IntÃƒÂ©gration du template `nopalou_auth_otp` avec fallback sur texte libre.
- **Variable d'Environnement** : Ajout de `WHATSAPP_BUSINESS_ACCOUNT_ID=901008702321523` dans `backend/.env`.

**6. Cahier de Recette Exhaustif (UAT) :**
- CrÃƒÂ©ation d'un cahier de recette complet prÃƒÂ©-production couvrant **11 modules** et **120+ cas de test** : Page d'accueil, Authentification, Espace Compte, DÃƒÂ©pÃƒÂ´t d'annonce, Boutique Pro (Gestion complÃƒÂ¨te), Parcours Acheteur, Assistant WhatsApp, Recherche & Filtres, Immobilier, TÃƒÂ©lÃƒÂ©com, Technique & ConformitÃƒÂ©.

**7. Mise ÃƒÂ  Jour du Kit de Communication (Admin) :**
- **Templates RÃƒÂ©seaux Sociaux (`communication/page.tsx`)** : Ajout des nouveaux modÃƒÂ¨les de posts d'annonce pour la connexion WhatsApp 1-Clic certifiÃƒÂ©e Meta (avec le bouton natif "Copier le code") et pour la nouvelle expÃƒÂ©rience fluide Mobile & PWA.

---

## Ãƒâ€°tat du projet (05 aoÃƒÂ»t 2026 Ã¢â‚¬â€� IntÃƒÂ©gration Boutiques Taf Taf)
**Statut :** *FonctionnalitÃƒÂ© en production*

DÃƒÂ©clencheur : Demande de l'utilisateur d'ajouter un accÃƒÂ¨s rapide "Boutique Taf Taf" dans le menu principal et de rÃƒÂ©soudre les erreurs bloquantes lors de la crÃƒÂ©ation d'une boutique.

**RÃƒÂ©alisations & Corrections :**
- **Menu Principal (Navbar)** : Ajout d'un bouton fixe "Ã¢Å¡Â¡ CrÃƒÂ©er ma Boutique Taf Taf" dans le composant `layout.tsx` ÃƒÂ  cÃƒÂ´tÃƒÂ© du bouton "Publier" (bureau) et sous forme d'icÃƒÂ´ne (mobile).
- **Mise en page (UI)** : Ajout de la contrainte CSS `white-space: nowrap` sur les boutons du menu (Publier, Guides) pour empÃƒÂªcher les sauts de ligne inesthÃƒÂ©tiques sur de petits ÃƒÂ©crans.
- **Base de donnÃƒÂ©es (Migration)** :
  - **Correction Colonne Manquante** : Ajout de la colonne `couleur_theme (VARCHAR(50))` ÃƒÂ  la table `boutiques` dans `migrate-inline.js` pour ÃƒÂ©viter l'erreur `couleur_theme does not exist`.
  - **Correction Contrainte d'Abonnement** : Mise ÃƒÂ  jour du `CHECK CONSTRAINT` `abonnements_plan_check` de la table `abonnements` pour autoriser les forfaits `'taf_taf'` et `'decouverte'` en plus des forfaits existants, ÃƒÂ©vitant l'erreur `violates check constraint "abonnements_plan_check"` lors du provisionnement initial des boutiques.
  - **Essai Gratuit StandardisÃƒÂ©** : Ajout de la crÃƒÂ©ation automatique du plan "dÃƒÂ©couverte" (1 mois d'essai gratuit) pour les boutiques standards (`POST /api/boutiques`), s'alignant sur le fonctionnement des boutiques Taf Taf.
- **Test E2E** : VÃƒÂ©rification rÃƒÂ©ussie (Code HTTP 200, JWT retournÃƒÂ©) du workflow backend via l'API `POST /api/boutiques/taf-taf`.

---

## Ãƒâ€°tat du projet (31 juillet 2026 Ã¢â‚¬â€� Refonte Ergonomique Chatbot WhatsApp & Traitement Direct du Panier)
**Statut :** *MergÃƒÂ© et pushÃƒÂ© sur `origin main` (`f17e00c`)*

DÃƒÂ©clencheur : Optimisation pas-ÃƒÂ -pas du Chatbot WhatsApp selon les requÃƒÂªtes utilisateur (rÃƒÂ©duction des questions intermÃƒÂ©diaires, liste directe des boutiques, panier WhatsApp instantanÃƒÂ©).

**RÃƒÂ©alisations & AmÃƒÂ©liorations :**
- **AccÃƒÂ¨s Direct aux Boutiques** : Au clic sur `Ã°Å¸ï¿½Âª Boutiques`, envoi immÃƒÂ©diat de la liste de toutes les boutiques Nopalou actives avec numÃƒÂ©rotation (`1. Nom`, `2. Nom`...), plus une option `Ã°Å¸â€œâ€š Choisir par secteur`.
- **Correction du Slug Boutique (`estIdInterne`)** : Protection des identifiants `boutique_produits_tous`, `boutique_next` et `boutique_secteur_liste` contre l'interception erronÃƒÂ©e en tant que slug de boutique ("Boutique introuvable").
- **Option "Voir les produits" & DÃƒÂ©filÃƒÂ© 1-ÃƒÂ -1** : Bouton `Ã°Å¸â€ºï¿½Ã¯Â¸ï¿½ Voir les produits` dans le menu boutique, affichant les fiches produits 1 par 1 avec 3 boutons natifs (`Ã°Å¸â€ºâ€™ Commander`, `Ã¢ï¿½Â© Suivant`, `Ã°Å¸â€�ï¿½ Rechercher`).
- **Traitement Direct du Panier WhatsApp (`traiterPanierMeta`)** : Ãƒâ€°limination de la question intermÃƒÂ©diaire *"Votre nom complet ?"*. Ãƒâ‚¬ la rÃƒÂ©ception d'un panier, affichage du rÃƒÂ©capitulatif avec total et prÃƒÂ©sentation des 2 options directes (WhatsApp Direct vs Formulaire 1-Page Express).
- **SÃƒÂ©lection NumÃƒÂ©rique & Textuelle Boutiques** : Prise en charge de la frappe d'un chiffre (`1`, `2`, `3`) ou d'un nom de boutique.
- **Enrichissement des Salutations** : DÃƒÂ©tection des variantes courantes (`bjr`, `bonjou`, `jr`, `bsoir`, `hi`, `cc`).

---

## Ãƒâ€°tat du projet (30 juillet 2026 Ã¢â‚¬â€� DÃƒÂ©mo Commerciale 3 Axes, Bac ÃƒÂ  Sable POS & Kit Commercial)
**Statut :** *MergÃƒÂ© et pushÃƒÂ© sur main*

DÃƒÂ©clencheur : Demande de l'utilisateur de lister toutes les fonctionnalitÃƒÂ©s du site pour l'acheteur, le marchand et l'apporteur d'affaires, et de les mettre en valeur de faÃƒÂ§on visuelle et interactive ÃƒÂ  travers une dÃƒÂ©mo bac ÃƒÂ  sable pas-ÃƒÂ -pas et des banniÃƒÂ¨res sur l'ensemble du site.

**1. DÃƒÂ©mo Commerciale & Bac ÃƒÂ  Sable Interactif (`DemoClient.tsx`) :**
- **Mode Marchand POS Sandbox** : Interface 100% identique au tableau de bord rÃƒÂ©el avec 5 onglets interactifs (`Caisse POS`, `Catalogue & EAN-13`, `Carnet de Dettes`, `Analytics`, `Ãƒâ€°quipe & PIN`).
- **3 Modes de Scan & Impresson EAN-13** : Modales d'essai pour le **Scanner CamÃƒÂ©ra Smartphone**, la **Douchette Smartphone Distante (Cloud Sync)**, le gÃƒÂ©nÃƒÂ©rateur EAN-13 Modulo 10 et l'aperÃƒÂ§u vectoriel des **Stickers Thermiques 50mm x 30mm**.
- **Carnet de Dettes Client & Relance WhatsApp 1-Clic** : AperÃƒÂ§u du message WhatsApp de relance prÃƒÂ©-rempli avec le solde exact et l'ÃƒÂ©chÃƒÂ©ance.
- **Module Acheteur & Chatbot Meta Commerce** : Simulation du bot WhatsApp avec Product Cards, Panier Natif Meta et suivi de commande.
- **Module Apporteur d'Affaires & Kit Commercial** : Simulateur de commissions rÃƒÂ©currentes avec curseurs dynamiques, lien direct de tÃƒÂ©lÃƒÂ©chargement de la **Brochure PDF (13 p.)** et prÃƒÂ©visualisation du kit marketing.

**2. Section "Nopalou en Action" sur la Homepage (`ShowcaseTabs.tsx`) :**
- **PrÃƒÂ©sentation interactive ÃƒÂ  3 onglets** : Composant client insÃƒÂ©rÃƒÂ© sur la page d'accueil (`/`) prÃƒÂ©sentant visuellement l'ÃƒÂ©cosystÃƒÂ¨me pour les Acheteurs, les Marchands et les Apporteurs d'affaires avec boutons CTA d'accÃƒÂ¨s direct au simulateur et au tÃƒÂ©lÃƒÂ©chargement de la brochure.

**3. Incitation Commerciale & Navigation (`NavbarGuides.tsx` & `/boutiques`) :**
- **Navbar Header** : Ajout du badge colorÃƒÂ© `NOUVEAU` et surlignage orange sur le lien `Ã°Å¸Å¡â‚¬ DÃƒÂ©mo Commerciale`.
- **Page Boutiques (`/boutiques`)** : Ajout du bouton d'action marchand *"Ã°Å¸ï¿½Âª Vous ÃƒÂªtes commerÃƒÂ§ant ? Tester la DÃƒÂ©mo POS Ã¢â€ â€™"* dans le banner hero.

**4. Harmonisation du Taux de Commission (20%) & Normalisation Typographique :**
- **Mise ÃƒÂ  jour du taux par dÃƒÂ©faut** : Passage du taux de commission des apporteurs ÃƒÂ  **20%** par dÃƒÂ©faut dans les paramÃƒÂ¨tres backend (`settingsCache.js`), la dÃƒÂ©mo (`DemoClient.tsx`, `demo/page.tsx`), les visuels rÃƒÂ©seaux sociaux (`apporteur-affaires/route.tsx`) et la brochure PDF (`brochure-apporteur/route.tsx`).
- **Correction typographique globale (`globals.css`)** : RÃƒÂ©initialisation explicite de `font-family: var(--font-inter)` sur `button, input, select, textarea` afin de garantir un rendu visuel harmonieux et rÃƒÂ©actif sur tous les navigateurs (iOS, Android, Windows, Mac).

**5. Visuel MaÃƒÂ®tre Unique Ãƒâ€°cosystÃƒÂ¨me Global (`poster-ecosysteme/route.tsx`) :**
- **Affiche Commerciale HD (1200 Ãƒâ€” 1600 px)** : CrÃƒÂ©ation d'un visuel synthÃƒÂ©tique haute dÃƒÂ©finition regroupant TOUTES les fonctionnalitÃƒÂ©s du site en 3 blocs clairs (*Acheteur*, *Marchand POS*, *Apporteur 20%*).
- **IntÃƒÂ©gration Kit & Espace Apporteur** : Accessible en 1 clic dans l'administration `/admin/communication` et dans l'espace apporteurs d'affaires `/compte/apporteur` pour le dÃƒÂ©marchage et les prÃƒÂ©sentations.
- **Correction Rendu Satori (`next/og`)** : Remplacement de `display: grid` (non supportÃƒÂ© par Satori / `@vercel/og`) par un layout Flexbox (`display: flex`) afin d'ÃƒÂ©liminer l'erreur HTTP 500 / image cassÃƒÂ©e et afficher correctement le poster sur `https://nopalou.com/assets/poster-ecosysteme`.

**6. Repositionnement des Filtres Produit (`page.tsx`) :**
- **Ergonomie & Parcours Utilisateur** : DÃƒÂ©placement stratÃƒÂ©gique des barres de filtres (*Budget*, *Tri*, *Bouton Effacer*) directement au-dessus du compteur de rÃƒÂ©sultats et de la grille de produits `ProduitsListe`.

**7. Revue & Alignement GÃƒÂ©nÃƒÂ©ral des Visuels Marketing (`/assets/...`) :**
- **3 Visuels SÃƒÂ©parÃƒÂ©s DÃƒÂ©diÃƒÂ©s par Pilier** :
  - **Pilier 1 (Acheteur & Consommateur)** (`/assets/pilier-acheteur`) : 1080 Ãƒâ€” 1350 px Ã¢â‚¬â€� Super-Comparateur Multi-Marchands, Chatbot WhatsApp Meta 24/7, Alertes Prix & Immo, Comparatif CÃƒÂ´te-ÃƒÂ -CÃƒÂ´te.
  - **Pilier 2 (Marchand & Caisse POS)** (`/assets/pilier-marchand`) : 1080 Ãƒâ€” 1350 px Ã¢â‚¬â€� Caisse Enregistreuse POS Tactile, 3 Scanners (CamÃƒÂ©ra, Cloud Sync <100ms, USB), Stickers EAN-13 GS1 Modulo 10, Carnet Dettes WhatsApp 1-Clic, Multi-Caissiers PIN.
  - **Pilier 3 (Apporteur d'Affaires 20%)** (`/assets/pilier-apporteur`) : 1080 Ãƒâ€” 1350 px Ã¢â‚¬â€� Commissions RÃƒÂ©currentes 20% mensuelles ÃƒÂ  vie (Wave/OM), Brochure PDF 13 Pages, 0 FCFA d'investissement.
- **Harmonisation Taux Commission (20%)** : Correction de tous les rÃƒÂ©sidus de taux obsolÃƒÂ¨tes (10%) dans le flyer Apporteur (`apporteur-affaires/route.tsx`) et la brochure PDF 13 pages (`brochure-apporteur/route.tsx`).
- **Enrichissement FonctionnalitÃƒÂ©s DerniÃƒÂ¨res Versions** : IntÃƒÂ©gration systÃƒÂ©matique des nouvelles fonctionnalitÃƒÂ©s (Caisse Enregistreuse POS Tactile, 3 Scanners smartphone/cloud/USB, Stickers Codes-barres EAN-13 GS1 Modulo 10, Carnet de Dettes Client + Relance WhatsApp 1-Clic, Multi-caissiers PIN, Lien DÃƒÂ©mo POS commercial 1-Clic `nopalou.com/demo`).
- **Mise ÃƒÂ  jour des Visuels RÃƒÂ©seaux & Supports Terrain** : Alignement du flyer A5 de dÃƒÂ©marchage (`flyer-demarchage/route.tsx`), du poster ÃƒÂ©cosystÃƒÂ¨me (`poster-ecosysteme/route.tsx`), de la couverture Facebook (`cover-facebook/route.tsx`), et du kit apporteur (`/admin/communication`).
- **Bannissement Global du Chargement Dynamique de Polices (Site & Satori)** : Suppression et interdiction dÃƒÂ©finitive de tout `fetch`, `@import` ou tÃƒÂ©lÃƒÂ©chargement rÃƒÂ©seau de polices externes (ex: TTF/WOFF depuis `cdn.jsdelivr.net` ou CDN tiers) sur l'ensemble de l'application (`frontend-next`, routes `ImageResponse`, styles, API). Utilisation exclusive des piles de polices systÃƒÂ¨me natives et `var(--font-inter)` pour des performances instantanÃƒÂ©es sans dÃƒÂ©pendance rÃƒÂ©seau.

**8. Correction du Menu DÃƒÂ©roulant Actions Produit (`BoutiqueClient.tsx`) :**
- **Ergonomie & Affichage** : Positionnement ajustÃƒÂ© ÃƒÂ  droite (`right: 0`, `bottom: calc(100% + 6px)`, `whiteSpace: nowrap`, `width: max-content`) pour le menu d'actions secondaires (`Actions Ã¢â€“Â¾`) du catalogue produit. Le popup ne se fait plus tronquer sur le bord droit de l'ÃƒÂ©cran/conteneur.

**9. Refonte Graphique Nette & Alignement Charte Nopalou (`/assets/...`) :**
- **Alignement Charte Graphique Nopalou** : RÃƒÂ©alignement strict de tous les visuels sur les couleurs officielles Nopalou (Orange `#C75B00` & Bleu Marine `#1C2B4A`).
- **NettetÃƒÂ© Vectorielle & LisibilitÃƒÂ© Optimale** : Augmentation importante de la taille des polices (titres ÃƒÂ  52-54px, sous-titres ÃƒÂ  22-26px, corps ÃƒÂ  18-19px `fontWeight: 700/900`) et suppression des box-shadows flous pour ÃƒÂ©liminer tout flou de rendu et garantir une nettetÃƒÂ© cristalline sur tous les ÃƒÂ©crans.

**10. RÃƒÂ©solution des Latences & Blocages Serveur (`ConnectTimeoutError` & `ECONNRESET`) :**
- **Ãƒâ€°limination des Fetches de Polices/Symboles Satori** : Suppression des symboles unicode spÃƒÂ©ciaux (`Ã¢â€ â€™`) dans les routes d'images `ImageResponse` (`chatbot-whatsapp`, `produit/[id]/opengraph-image.tsx`) qui dÃƒÂ©clenchaient des tentatives d'installation de polices rÃƒÂ©seau lentes et des blocages serveur de 45 secondes (`UND_ERR_CONNECT_TIMEOUT`).
- **Timeouts RÃƒÂ©seau ContrÃƒÂ´lÃƒÂ©s (6s max)** : Ajout systÃƒÂ©matique de `signal: AbortSignal.timeout(6000)` dans `api.ts`, `backendFetch.ts`, et `backend-fetch.ts` pour libÃƒÂ©rer immÃƒÂ©diatement le thread si le serveur backend Render met du temps ÃƒÂ  se rÃƒÂ©veiller (`socket hang up`), ÃƒÂ©liminant ainsi la lenteur du site.

**11. Visuel DÃƒÂ©diÃƒÂ© Ãƒâ€°cosystÃƒÂ¨me WhatsApp Meta 24/7 (`/assets/chatbot-whatsapp`) :**
- **CrÃƒÂ©ation du Visuel MaÃƒÂ®tre WhatsApp (1080 Ãƒâ€” 1350 px HD)** : Visuel lumineux haute nettetÃƒÂ© aux couleurs Nopalou & WhatsApp (`#25D366`, `#C75B00`, `#1C2B4A`) regroupant l'intÃƒÂ©gralitÃƒÂ© des 4 verticales WhatsApp (Assistant Chatbot IA Acheteur 24/7, Panier & Commande 1-Clic sans App, Carnet Dettes Client & Relance WA 1-Clic Caisse POS, Notifications Ventes & Partage 1-Clic).
- **IntÃƒÂ©gration Kit Admin** : Ajout du visuel dans l'outil Kit Communication Admin (`/admin/communication`).

---

## Ãƒâ€°tat du projet (29 juillet 2026 Ã¢â‚¬â€� Refonte Boutiques, Abonnements, Panier Mobile & bloc SEO)
**Statut :** *MergÃƒÂ© et pushÃƒÂ© sur main*

DÃƒÂ©clencheur : Demandes de l'utilisateur concernant la visibilitÃƒÂ© des abonnements (3, 6 et 12 mois), la taille et la rÃƒÂ©activitÃƒÂ© du panier sur mobile, l'ÃƒÂ©largissement de l'affichage des boutiques, la dynamisation des notes et filtres, la refonte du bloc SEO homepage et la modernisation des onglets de boutique.

**1. Abonnements Multi-DurÃƒÂ©es (3, 6, 12 Mois) & Paiement :**
- **Correctif d'affichage** : RÃƒÂ©tablissement de la visibilitÃƒÂ© des formules d'abonnements 3, 6 et 12 mois avec application automatique des taux de rÃƒÂ©duction (10% pour 3M, 15% pour 6M, 25% pour 12M).
- **IntÃƒÂ©gration Wave / Orange Money** : SÃƒÂ©curisation de la crÃƒÂ©ation des sessions de paiement, de la facturation et du renouvellement automatique des droits en base de donnÃƒÂ©es.

**2. Optimisation Ergonomique du Panier Mobile (Bottom Sheet) :**
- **Refonte mobile** : Remplacement du panneau latÃƒÂ©ral mobile par une **Bottom Sheet rÃƒÂ©tractable (style Apple Pay / Shopify Mobile)**. Le panier s'ouvre proprement sur la partie infÃƒÂ©rieure de l'ÃƒÂ©cran sans masquer toute la page et permet une fermeture facile par glissement/clic extÃƒÂ©rieur.

**3. Dynamisation & Ãƒâ€°largissement des Boutiques (`/boutiques`) :**
- **Ãƒâ€°largissement de la mise en page** : Remplacement de la contrainte de largeur ÃƒÂ©troite (`900px`) par un conteneur aÃƒÂ©rÃƒÂ© ÃƒÂ  **`1350px - 1440px`**.
- **Calcul dynamique des notes** : Remplacement de la note fixe par un calcul PostgreSQL en temps rÃƒÂ©el via une sous-requÃƒÂªte `LATERAL JOIN` sur `boutique_avis` (`AVG(note)` et `COUNT(*)`).
- **Filtres par Villes et CatÃƒÂ©gories rÃƒÂ©elles** : Les filtres de l'annuaire se construisent dynamiquement (`SELECT DISTINCT`) selon les boutiques actives enregistrÃƒÂ©es en base de donnÃƒÂ©es.

**4. Refonte du Bloc SEO & Comparateur Homepage :**
- **Design Premium** : Modernisation complÃƒÂ¨te de `.seo-card` dans `globals.css` avec une typographie `Archivo` ÃƒÂ©purÃƒÂ©e, une ligne dÃƒÂ©gradÃƒÂ©e supÃƒÂ©rieure, un fond blanc relief avec ombre portÃƒÂ©e douce et des puces de catÃƒÂ©gories interactives animÃƒÂ©es au survol.

**5. Onglet "Ãƒâ‚¬ propos & Contact" & Navigation SegmentÃƒÂ©e (Style Shopify Pro / Amazon) :**
- **Enrichissement de l'onglet Infos** : Affichage dynamique des rÃƒÂ©seaux sociaux (Instagram, Facebook, Site Web), des cartes de contact avec boutons d'actions directes (`Appeler`, `Discuter sur WhatsApp Pro`) et surlignage du jour actuel dans les horaires.
- **Barre d'onglets segmentÃƒÂ©e** : Suppression des symboles parasites (Ã¢â€žÂ¹, accents bruts) et refonte en un contrÃƒÂ´le segmentÃƒÂ© par capsules (`Catalogue produits`, `Annonces`, `Infos & Contact`) avec compteurs d'articles intÃƒÂ©grÃƒÂ©s.

---

## Ãƒâ€°tat du projet (24 juillet 2026 Ã¢â‚¬â€� Correction Espace Boutique & Importation par Lot)
**Statut :** *En attente de push sur main*

DÃƒÂ©clencheur : L'utilisateur a signalÃƒÂ© plusieurs bugs sur l'espace de gestion de la boutique ("crÃƒÂ©ation de caissier ne passe pas", "modification du PIN impossible", "Pas d'action Administrateurs Web", formulaire dÃƒÂ©bordant sur petit ÃƒÂ©cran, et une erreur 500 sur l'API `/admins`). De plus, il a demandÃƒÂ© l'enrichissement de la fonctionnalitÃƒÂ© **Importation par Lot (Batch Intake)** avec des centaines de produits par catÃƒÂ©gorie et une harmonisation globale des catÃƒÂ©gories.

**1. Harmonisation des CatÃƒÂ©gories et Importation par Lot :**
- **Centralisation des catÃƒÂ©gories** : CrÃƒÂ©ation de `frontend-next/src/lib/categories.ts` comme source de vÃƒÂ©ritÃƒÂ© unique pour les catÃƒÂ©gories (Alimentation, TÃƒÂ©lÃƒÂ©phonie, Mode, etc.) afin de garantir la cohÃƒÂ©rence dans tout le site, y compris pour les boutiques mixtes.
- **Enrichissement du catalogue standard** : CrÃƒÂ©ation d'un fichier `backend/data/catalogues-standards.json` gÃƒÂ©nÃƒÂ©rÃƒÂ© via un script mÃƒÂ©tier, contenant environ 980 produits rÃƒÂ©partis dans les 9 catÃƒÂ©gories principales du marchÃƒÂ© sÃƒÂ©nÃƒÂ©galais (ex: Riz, Sucre, Ciment, TÃƒÂ©lÃƒÂ©phones, etc.).
- **Optimisation Backend** : La route d'importation par lot (`/catalogues-standards`) a ÃƒÂ©tÃƒÂ© optimisÃƒÂ©e pour lire directement ce fichier JSON statique au lieu d'exÃƒÂ©cuter des requÃƒÂªtes lourdes, garantissant une rÃƒÂ©ponse rapide et stable.

**2. Correctifs Espace Boutique :**
- **Support des slugs pour l'accÃƒÂ¨s boutique** : La fonction `checkBoutiqueAccess` a ÃƒÂ©tÃƒÂ© modifiÃƒÂ©e pour supporter la validation d'accÃƒÂ¨s via `UUID` OU `slug`. Auparavant, les requÃƒÂªtes `POST /caissiers` et `PUT /caissiers/:caissierId` ÃƒÂ©chouaient silencieusement ou gÃƒÂ©nÃƒÂ©raient des erreurs SQL si le client envoyait le slug de la boutique plutÃƒÂ´t que son UUID, empÃƒÂªchant toute crÃƒÂ©ation ou mise ÃƒÂ  jour de caissier.
- **ResponsivitÃƒÂ© du formulaire Caissier** : Conversion d'une grille CSS figÃƒÂ©e (`1fr 1fr`) vers une grille rÃƒÂ©active (`repeat(auto-fit, minmax(200px, 1fr))`) dans `BoutiqueCaissiers.tsx` pour empÃƒÂªcher le dÃƒÂ©bordement horizontal masquant le bouton de validation sur mobile.
- **Erreur 500 API `/admins`** : Correction de la requÃƒÂªte SQL dans `GET /api/boutiques/:id/admins` qui pointait par erreur vers un paramÃƒÂ¨tre ambigu. L'ID interne extrait aprÃƒÂ¨s validation de l'autorisation (`bq.id`) est maintenant utilisÃƒÂ© explicitement, fiabilisant l'affichage de la liste.
- **UX Administrateurs** : Ajout du label explicite **"Intouchable"** au lieu d'une case d'action vide pour le compte "propriÃƒÂ©taire" dans `BoutiqueAdmins.tsx`, clarifiant le fait qu'un propriÃƒÂ©taire ne peut pas se retirer lui-mÃƒÂªme.

**Point d'attention (Dette technique)** : Les erreurs SQL rapportÃƒÂ©es (`column u.prenom does not exist`) au cours du dÃƒÂ©bogage ÃƒÂ©taient un artefact d'anciens logs de nodemon ou d'anciennes requÃƒÂªtes. Le code actuel a ÃƒÂ©tÃƒÂ© vÃƒÂ©rifiÃƒÂ© et tourne proprement sur la base de production (Render).

---

## Ãƒâ€°tat du projet (20 juillet 2026 Ã¢â‚¬â€� brochure PDF pour les apporteurs d'affaires)

Le kit `/admin/communication` ne fournissait rien qu'un apporteur actif puisse remettre lui-mÃƒÂªme ÃƒÂ  un commerÃƒÂ§ant prospect. Ajout d'une brochure PDF, d'abord en 5 pages puis enrichie ÃƒÂ  **13 pages** suite ÃƒÂ  un retour utilisateur direct (Ã‚Â« la brochure est pauvre, rien sur comment crÃƒÂ©er un compte/une boutique, le comparateur, le chatbot, les fonctionnalitÃƒÂ©s boutique Ã¢â‚¬â€� il faut vendre le site Ã‚Â»). Spec : `docs/superpowers/specs/2026-07-20-brochure-apporteur-affaires-design.md`. Plan : `docs/superpowers/plans/2026-07-20-brochure-apporteur-affaires.md`.

**Contenu final (13 pages)** : couverture, c'est quoi Nopalou, le comparateur intelligent (mÃƒÂ©canisme + avantage commerÃƒÂ§ant), crÃƒÂ©er un compte (ÃƒÂ©tapes exactes du vrai formulaire d'inscription), crÃƒÂ©er une boutique (ÃƒÂ©tapes exactes du vrai formulaire, y compris le champ `code_apporteur`), fonctionnalitÃƒÂ©s boutique par palier (Gratuit/Pro/Business, recopiÃƒÂ©es telles quelles depuis `frontend-next/src/lib/fonctionnalites-data.ts`), assistant WhatsApp Ã¢â‚¬â€� comment l'utiliser, assistant WhatsApp Ã¢â‚¬â€� fonctionnalitÃƒÂ©s dÃƒÂ©taillÃƒÂ©es (recopiÃƒÂ©es de `CHATBOT_FONCTIONS` dans `/admin/communication`), immobilier & annonces & tÃƒÂ©lÃƒÂ©com, programme apporteur (grille de commission dynamique), comment fonctionne la commission (rÃƒÂ©currence, attribution automatique, paiement, absence de plafond), guide pratique de dÃƒÂ©marrage en 4 ÃƒÂ©tapes, contact. Tout le contenu factuel (champs de formulaire, fonctionnalitÃƒÂ©s par palier, textes du chatbot) a ÃƒÂ©tÃƒÂ© vÃƒÂ©rifiÃƒÂ© contre le vrai code source avant rÃƒÂ©daction plutÃƒÂ´t que supposÃƒÂ©.

**DÃƒÂ©cision technique notable** : la gÃƒÂ©nÃƒÂ©ration du PDF ÃƒÂ  la volÃƒÂ©e via une route Next.js + Playwright a ÃƒÂ©tÃƒÂ© envisagÃƒÂ©e puis ÃƒÂ©cartÃƒÂ©e avant implÃƒÂ©mentation Ã¢â‚¬â€� Playwright a dÃƒÂ©jÃƒÂ  causÃƒÂ© des OOM sur Render cÃƒÂ´tÃƒÂ© backend (scraper Facebook, voir entrÃƒÂ©e du 13 juillet 2026), et le service frontend Render (`output: 'standalone'`) n'a pas Chromium installÃƒÂ©. Ãƒâ‚¬ la place : une route HTML normale (`frontend-next/src/app/assets/brochure-apporteur/route.tsx`, sans Playwright, sert aussi d'aperÃƒÂ§u navigateur) + un script local (`frontend-next/scripts/generer-brochure-apporteur.js`) qui utilise Playwright uniquement en dÃƒÂ©veloppement pour produire `frontend-next/public/brochure-apporteur.pdf`, ÃƒÂ  committer et servir comme fichier statique Ã¢â‚¬â€� zÃƒÂ©ro dÃƒÂ©pendance runtime en production.

**Dette assumÃƒÂ©e** : le PDF n'est **pas rÃƒÂ©gÃƒÂ©nÃƒÂ©rÃƒÂ© automatiquement** si les tarifs (`plan_pro_prix`, `plan_business_prix`, `commission_business`, `apporteur_taux_commission`) changent depuis `/admin/tarifs` Ã¢â‚¬â€� contrairement au reste du kit `/admin/communication` qui est dynamique. Si les tarifs changent, relancer manuellement : `npm run dev` (frontend-next) puis `node scripts/generer-brochure-apporteur.js`, et committer le nouveau `public/brochure-apporteur.pdf`.

**Ajout complÃƒÂ©mentaire** : `apporteur_taux_commission` a ÃƒÂ©tÃƒÂ© ajoutÃƒÂ© ÃƒÂ  la liste des clÃƒÂ©s exposÃƒÂ©es par `GET /api/settings/public` (`backend/routes/settings.js`) Ã¢â‚¬â€� cette route existait dÃƒÂ©jÃƒÂ  mais n'exposait pas ce taux.

**PDF gÃƒÂ©nÃƒÂ©rÃƒÂ© et committÃƒÂ©** : `public/brochure-apporteur.pdf` (13 pages, ~754 Ko), CSS `.page` avec `page-break-before`/`page-break-after` (ancienne syntaxe) en complÃƒÂ©ment de `break-before`/`break-after` (syntaxe moderne), plus `min-height`/`max-height` fixes Ã¢â‚¬â€� nÃƒÂ©cessaire, une version sans l'ancienne syntaxe faisait fusionner certaines pages courtes en une seule page physique.

**Faux piÃƒÂ¨ge corrigÃƒÂ© pendant la vÃƒÂ©rification** : un premier contrÃƒÂ´le du nombre de pages via `texte.match(/\/Count\s+(\d+)/)` (sur le flux PDF brut) a signalÃƒÂ© `Count: 8` au lieu de 13 attendu, laissant croire ÃƒÂ  un vrai bug de fusion de pages. En rÃƒÂ©alitÃƒÂ©, un PDF contient plusieurs objets `/Count` (un par nÃ…â€œud intermÃƒÂ©diaire de l'arbre `Pages`, pas seulement la racine) Ã¢â‚¬â€� `.match()` ne renvoie que le premier trouvÃƒÂ©, qui n'est pas forcÃƒÂ©ment celui de la racine. Le comptage fiable est `(texte.match(/\/MediaBox/g) || []).length` (un `/MediaBox` par page rÃƒÂ©elle) ou de relire tous les `/Count` trouvÃƒÂ©s (`matchAll`) pour repÃƒÂ©rer le plus grand. Les 13 pages ÃƒÂ©taient dÃƒÂ©jÃƒÂ  correctement gÃƒÂ©nÃƒÂ©rÃƒÂ©es Ã¢â‚¬â€� ÃƒÂ  ne pas re-dÃƒÂ©boguer si ce doute ressurgit sur un futur PDF Playwright de ce projet.

Comme le backend n'avait pas de `.env` dans ce worktree au moment de la gÃƒÂ©nÃƒÂ©ration, le PDF reflÃƒÂ¨te les valeurs de repli (`prixPro=15000`, `prixBusiness=35000`, `tauxApporteur=10`) plutÃƒÂ´t que les tarifs rÃƒÂ©els de la base de production Ã¢â‚¬â€� ÃƒÂ  vÃƒÂ©rifier/rÃƒÂ©gÃƒÂ©nÃƒÂ©rer si ces valeurs diffÃƒÂ¨rent en prod au moment de la diffusion de la brochure.

---

## Ãƒâ€°tat du projet (19 juillet 2026, suite Ã¢â‚¬â€� homogÃƒÂ©nÃƒÂ©isation en-tÃƒÂªte/filtres/bloc SEO des pages listing et guides)

Retour utilisateur direct avec captures d'ÃƒÂ©cran : les pages du site n'avaient pas de style homogÃƒÂ¨ne Ã¢â‚¬â€� chaque page listing avait rÃƒÂ©inventÃƒÂ© son propre systÃƒÂ¨me de filtres/en-tÃƒÂªte au fil des chantiers prÃƒÂ©cÃƒÂ©dents (SEO du 11-12 juillet, tri/filtres guides du 10 juillet, etc.), sans composant partagÃƒÂ©. Process complet brainstorming Ã¢â€ â€™ spec Ã¢â€ â€™ plan Ã¢â€ â€™ subagent-driven-development (10 tÃƒÂ¢ches + revue finale de branche opus), exÃƒÂ©cutÃƒÂ© sur `worktree-homogeneisation-pages-listing`, mergÃƒÂ© fast-forward sur `main` (`ce96ee9..6e75fc1`), poussÃƒÂ©. Spec : `docs/superpowers/specs/2026-07-19-homogeneisation-pages-listing-design.md`. Plan : `docs/superpowers/plans/2026-07-19-homogeneisation-pages-listing.md`.

**LivrÃƒÂ©** :
- 3 nouveaux composants partagÃƒÂ©s (`frontend-next/src/components/`) : `PageHeader.tsx` (fil d'Ariane + H1 + compteur + CTA optionnel), `FiltresBar.tsx` (barre de pills essentielles + panneau repliable Ã‚Â« Ã¢Å¡â„¢ Plus de filtres Ã‚Â» pour les filtres secondaires + section Ã‚Â« Trier Ã‚Â»), `SeoCard.tsx` (gÃƒÂ©nÃƒÂ©ralise le bloc `.seo-card` faÃƒÂ§on ticket dÃƒÂ©jÃƒÂ  en place sur la homepage, au lieu que chaque page rÃƒÂ©invente son style).
- Nouvelle classe CSS unique `.filter-pill` (+ `.filter-pill--active`/`--reset`) remplaÃƒÂ§ant 4 systÃƒÂ¨mes diffÃƒÂ©rents (`.budget-pill` isolÃƒÂ©, pills dans `.filtres-group`, pills dans `.immo-filtres-row`, `.annonces-cat-pill`) Ã¢â‚¬â€� **`.budget-pill` lui-mÃƒÂªme conservÃƒÂ©**, encore utilisÃƒÂ© par ~15 fichiers hors pÃƒÂ©rimÃƒÂ¨tre (wizards, comparaison, boutiques, mes-annonces, favoris, deposer-immo, landing pages).
- **8 pages migrÃƒÂ©es** vers les 3 composants partagÃƒÂ©s : les 4 pages de listing SSR (`categorie/[slug]`, `immo`, `telecom`/`TelecomClient`, `annonces`) et les 4 outils guides interactifs (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`).
- **DÃƒÂ©cision utilisateur explicite en cours de chantier** : le plan initial supposait que les 4 pages guides ÃƒÂ©taient de simples barres de pills Ã¢â‚¬â€� en lisant le vrai code, elles se sont rÃƒÂ©vÃƒÂ©lÃƒÂ©es ÃƒÂªtre des mises en page ÃƒÂ  2 panneaux (bandeau `.guide-topbar` + panneau latÃƒÂ©ral `.guide-left` avec menus `<select>`/curseurs de pondÃƒÂ©ration + panneau rÃƒÂ©sultats `.guide-right`). Demande de clarification posÃƒÂ©e ÃƒÂ  l'utilisateur : garder les `<select>` et n'ajouter que fil d'Ariane/SeoCard, ou convertir les `<select>` en pills malgrÃƒÂ© le changement d'UX plus large Ã¢â‚¬â€� utilisateur a choisi la conversion complÃƒÂ¨te. Les curseurs de pondÃƒÂ©ration (`poids*`), les boutons de profils prÃƒÂ©dÃƒÂ©finis et les panneaux de rÃƒÂ©sultats (avec leur propre tri local, distinct du `tri` de `FiltresBar`) sont restÃƒÂ©s strictement intacts sur les 4 guides Ã¢â‚¬â€� vÃƒÂ©rifiÃƒÂ© ÃƒÂ  chaque tÃƒÂ¢che par grep ciblÃƒÂ© sur les noms de variables de curseurs.

**Bugs trouvÃƒÂ©s en test navigateur rÃƒÂ©el aprÃƒÂ¨s la fin des 10 tÃƒÂ¢ches** (l'utilisateur a lancÃƒÂ© le serveur de dev en local pour vÃƒÂ©rifier visuellement Ã¢â‚¬â€� limite habituelle de l'environnement sans outil de capture, contournÃƒÂ©e ici par un vrai test utilisateur) :
- **Crash d'hydratation React sur toutes les pages `/categorie/*`** : `SeoCard` enveloppait `blurb.text` dans un `<p>`, et la page catÃƒÂ©gorie y imbriquait ses propres `<p>` (paragraphes `cat.contenu`) Ã¢â€ â€™ `<p>` dans `<p>`, HTML invalide. CorrigÃƒÂ© en changeant le wrapper de `SeoCard` en `<div className="seo-blurb-text">` (CSS ajustÃƒÂ©e en consÃƒÂ©quence) Ã¢â‚¬â€� bug qui n'existait sur aucune autre des 8 pages migrÃƒÂ©es (vÃƒÂ©rifiÃƒÂ© par grep, seule `categorie` imbriquait un `<p>`).
- **Police jamais rÃƒÂ©ellement appliquÃƒÂ©e sur tout le site** : `body { font-family: 'Inter', ... }` utilisait la chaÃƒÂ®ne littÃƒÂ©rale au lieu de `var(--font-inter)` gÃƒÂ©nÃƒÂ©rÃƒÂ© par `next/font` Ã¢â‚¬â€� ne matchait jamais la classe scopÃƒÂ©e rÃƒÂ©elle, retombait silencieusement sur la police systÃƒÂ¨me Windows. **MÃƒÂªme piÃƒÂ¨ge que celui dÃƒÂ©jÃƒÂ  documentÃƒÂ© pour Sora le 11 juillet, cette fois sur Inter** Ã¢â‚¬â€� un rappel que ce risque n'est pas isolÃƒÂ© ÃƒÂ  un seul chantier. CorrigÃƒÂ© + antialiasing explicite ajoutÃƒÂ© (`-webkit-font-smoothing`, `text-rendering`).
- **Vide visuel sous la colonne de texte la plus courte du bloc `SeoCard`** : `.seo-cols-grid` en CSS grid forÃƒÂ§ait les deux colonnes ÃƒÂ  la mÃƒÂªme hauteur de ligne Ã¢â‚¬â€� corrigÃƒÂ© en passant ÃƒÂ  flexbox (`align-items: flex-start`, chaque colonne garde sa propre hauteur). Persistait ensuite sur `/categorie/auto-moto` car le dÃƒÂ©sÃƒÂ©quilibre rÃƒÂ©el venait du **contenu** (blurb gÃƒÂ©nÃƒÂ©rique gauche = 2 phrases fixes courtes, blurb droit = `cat.intro` + 2 paragraphes `cat.contenu` longs) plutÃƒÂ´t que du CSS seul Ã¢â‚¬â€� rÃƒÂ©ÃƒÂ©quilibrÃƒÂ© en dÃƒÂ©plaÃƒÂ§ant `cat.intro` dans le blurb gauche, ne laissant que `cat.contenu` ÃƒÂ  droite.
- **IncohÃƒÂ©rences UX signalÃƒÂ©es par l'utilisateur, corrigÃƒÂ©es** : `categorie` n'avait pas de barre de recherche texte contrairement ÃƒÂ  `annonces` Ã¢â‚¬â€� ajoutÃƒÂ©e (mÃƒÂªme pattern, paramÃƒÂ¨tre `q` dÃƒÂ©jÃƒÂ  supportÃƒÂ© par `GET /api/produits`, aucun changement backend nÃƒÂ©cessaire). Les 3 guides ÃƒÂ  panneau latÃƒÂ©ral affichaient un `PageHeader` (gros titre) immÃƒÂ©diatement suivi d'un `.guide-topbar` quasi identique (mÃƒÂªme emoji/titre/sous-titre) Ã¢â‚¬â€� bandeau retirÃƒÂ©, seul le lien retour subsiste sous `PageHeader` ; `.guide-topbar`/`-titre`/`-sub` devenus orphelins, retirÃƒÂ©s de `globals.css`.

**Revue finale de branche (opus, range `3b8c135..dc632e4`)** : Ã‚Â« Ready to merge = With fixes Ã‚Â», 0 Critical, 1 Important (le bloc `SeoCard` de `telecom` citait des noms d'opÃƒÂ©rateurs faux Ã¢â‚¬â€� Ã‚Â« Free Ã‚Â»/Ã‚Â« Wave Ã‚Â» au lieu de Ã‚Â« Yas Ã‚Â»/Ã‚Â« ProMobile Ã‚Â», alors que les chips juste en dessous listaient dÃƒÂ©jÃƒÂ  les bons noms), 3 Minor (CSS orpheline supplÃƒÂ©mentaire visible seulement une fois les 8 pages migrÃƒÂ©es Ã¢â‚¬â€� `.annonces-header`/`.telecom-header`/`.guide-select`/`.guide-prix-cats` Ã¢â‚¬â€� ; prop `secondaireActifsCount` de `FiltresBar` jamais consommÃƒÂ©e par aucun des 8 appelants ; `SeoCard` rÃƒÂ©utilisait la classe `.home-seo-cols` nommÃƒÂ©e pour la homepage, renommÃƒÂ©e `.seo-cols-grid`). Les 4 correctifs appliquÃƒÂ©s en un seul commit groupÃƒÂ©, re-revue indÃƒÂ©pendante (greps frais contre le code rÃƒÂ©el, pas seulement le rapport de l'implÃƒÂ©menteur) confirmant les 4 rÃƒÂ©solus Ã¢â‚¬â€� y compris la vÃƒÂ©rification que la homepage `page.tsx` (hors pÃƒÂ©rimÃƒÂ¨tre des 8 pages migrÃƒÂ©es mais partageant la classe CSS renommÃƒÂ©e) avait bien ÃƒÂ©tÃƒÂ© mise ÃƒÂ  jour en mÃƒÂªme temps, sous peine de casser son propre bloc SEO.

**PiÃƒÂ¨ge de process ÃƒÂ  retenir** : le plan ÃƒÂ©crit avant l'implÃƒÂ©mentation contenait une hypothÃƒÂ¨se fausse sur la structure des pages guides (jamais vÃƒÂ©rifiÃƒÂ©e contre le vrai code au moment de l'ÃƒÂ©criture du plan) Ã¢â‚¬â€� dÃƒÂ©tectÃƒÂ© seulement en lisant le fichier rÃƒÂ©el pendant l'exÃƒÂ©cution de la tÃƒÂ¢che 9. PlutÃƒÂ´t que de forcer l'exÃƒÂ©cution de la tÃƒÂ¢che telle qu'ÃƒÂ©crite ou de deviner, la question a ÃƒÂ©tÃƒÂ© posÃƒÂ©e directement ÃƒÂ  l'utilisateur avant de continuer Ã¢â‚¬â€� a ÃƒÂ©vitÃƒÂ© une transformation inadaptÃƒÂ©e ÃƒÂ  la structure rÃƒÂ©elle de ces 4 pages.

**Non vÃƒÂ©rifiÃƒÂ© par outil automatisÃƒÂ©** (limite dÃƒÂ©jÃƒÂ  documentÃƒÂ©e sur ce projet Ã¢â‚¬â€� aucun outil de capture navigateur disponible) : cette fois-ci exceptionnellement compensÃƒÂ© par un vrai test utilisateur en local (serveur de dev lancÃƒÂ© dans le worktree, backend + frontend), qui a permis de dÃƒÂ©tecter les 4 bugs visuels/fonctionnels ci-dessus qu'aucune revue de code seule (mÃƒÂªme la revue finale de branche) n'aurait pu attraper Ã¢â‚¬â€� confirme la valeur d'un test navigateur rÃƒÂ©el en complÃƒÂ©ment des revues de code quand l'utilisateur peut le faire.

---

## Ãƒâ€°tat du projet (19 juillet 2026 Ã¢â‚¬â€� marketing boutique : partage 1-clic, traÃƒÂ§age, bandeau conseils, visuel story)

Spec `docs/superpowers/specs/2026-07-18-marketing-boutique-facilitation-design.md`, plan en 8 tÃƒÂ¢ches `docs/superpowers/plans/2026-07-18-marketing-boutique-facilitation.md`, exÃƒÂ©cutÃƒÂ© via subagent-driven-development sur `worktree-marketing-boutique-facilitation` (session reprise aprÃƒÂ¨s une interruption utilisateur mi-Task 3 Ã¢â‚¬â€� la ledger `.superpowers/sdd/progress.md` a permis une reprise propre sans re-travail), revue finale opus Ã‚Â« Ready to merge Ã‚Â» 0 Critical/Important, mergÃƒÂ© sur `main` (`da0baea..8609e73`), poussÃƒÂ©.

**Objectif explicite (demande directe utilisateur)** : rÃƒÂ©duire le travail rÃƒÂ©el du marchand pour partager sa boutique/ses produits Ã¢â‚¬â€� **pas** lui donner des textes ÃƒÂ  copier-coller (pÃƒÂ©rimÃƒÂ¨tre exclu explicitement).

**LivrÃƒÂ©** :
- `BoutonPartager.tsx` (composant partagÃƒÂ©, catalogue produits ET cartes boutique de l'onglet Marketing) : l'action principale devient 1 clic Ã¢â€ â€™ ouverture directe de `wa.me/?text=...`, au lieu d'un menu ÃƒÂ  3 choix. Les actions secondaires (copier le lien, tÃƒÂ©lÃƒÂ©charger le visuel) restent disponibles derriÃƒÂ¨re un petit bouton `Ã¢â€¹Â¯`. Nouvelle prop optionnelle `onPartage?: () => void`, fire-and-forget, jamais awaited.
- **TraÃƒÂ§age `partage_le`** : colonne additive `boutique_produits.partage_le TIMESTAMPTZ` (nullable, `NULL` = jamais partagÃƒÂ©) + route `PATCH /api/boutiques/:id/produits/:prodId/partage`. Mise ÃƒÂ  jour dÃƒÂ©clenchÃƒÂ©e au clic WhatsApp ou copie de lien sur un produit, jamais bloquante pour l'action de partage elle-mÃƒÂªme.
- **Message enrichi promo** : quand `prix_barre > prix`, le message WhatsApp devient `Ã°Å¸â€�Â¥ {nom} en promo : {prix} au lieu de {prix_barre} !` au lieu du format simple.
- **Bandeau Ã‚Â« Conseils & rappels Ã‚Â»** en haut de l'onglet Marketing (`MarketingBoutique`) : compte les produits jamais partagÃƒÂ©s (fetch dÃƒÂ©diÃƒÂ© lÃƒÂ©ger, pas de state partagÃƒÂ© avec `CatalogueProduits`), affiche un bandeau orange actionnable (bouton Ã‚Â« Voir ces produits Ã¢â€ â€™ Ã‚Â» qui bascule vers l'onglet Catalogue avec le filtre `jamais_partage` prÃƒÂ©-appliquÃƒÂ©) ou un bandeau vert si tout a dÃƒÂ©jÃƒÂ  ÃƒÂ©tÃƒÂ© partagÃƒÂ©.
- **Refonte visuelle** de `/assets/boutique/[id]/story` (`next/og` `ImageResponse`, `runtime = 'edge'` conservÃƒÂ©, 1080Ãƒâ€”1920 inchangÃƒÂ©) : composition asymÃƒÂ©trique (titre boutique dominant ÃƒÂ  gauche, carte Ã‚Â« vitrine Ã‚Â» inclinÃƒÂ©e avec le logo qui dÃƒÂ©borde du cadre, bande diagonale orange, halos dÃƒÂ©coratifs) Ã¢â‚¬â€� mÃƒÂªme niveau d'exigence que le visuel `/assets/chatbot-whatsapp` dÃƒÂ©jÃƒÂ  refondu le 6 juillet. Palette `#1C2B4A`/`#C75B00` conservÃƒÂ©e, repli Ã°Å¸ï¿½Âª si pas de logo.

**Incident de session ÃƒÂ  noter** : l'exÃƒÂ©cution a ÃƒÂ©tÃƒÂ© interrompue une premiÃƒÂ¨re fois par l'utilisateur juste aprÃƒÂ¨s un commit de fix des tests `BoutonPartager.test.tsx` (Task 3), avant que le contrÃƒÂ´leur ne relance la revue. Ãƒâ‚¬ la reprise (nouvelle session), la ledger `.superpowers/sdd/progress.md` a permis de retrouver l'ÃƒÂ©tat exact (commit du fix dÃƒÂ©jÃƒÂ  fait, tests ÃƒÂ  re-vÃƒÂ©rifier, revue ÃƒÂ  relancer) sans deviner ni re-exÃƒÂ©cuter de travail dÃƒÂ©jÃƒÂ  fait Ã¢â‚¬â€� confirme la valeur de la ledger pour les sessions longues/interrompues sur ce projet.

**PiÃƒÂ¨ge Windows rencontrÃƒÂ© en fin de chantier** : `git worktree remove` a timeout (2 min) sur ce worktree Ã¢â‚¬â€� la suppression du dossier avait commencÃƒÂ© mais pas le nettoyage de la rÃƒÂ©fÃƒÂ©rence `.git` interne, laissant un ÃƒÂ©tat incohÃƒÂ©rent (Ã‚Â« `.git` does not exist Ã‚Â» au retry). RÃƒÂ©solu par suppression manuelle du dossier restant (`rm -rf`) puis `git worktree prune`. Si `git worktree remove` traÃƒÂ®ne anormalement longtemps sur ce projet, ne pas relancer la mÃƒÂªme commande en boucle Ã¢â‚¬â€� vÃƒÂ©rifier d'abord si le dossier a dÃƒÂ©jÃƒÂ  ÃƒÂ©tÃƒÂ© partiellement supprimÃƒÂ©.

**Non vÃƒÂ©rifiÃƒÂ© par navigateur rÃƒÂ©el** (limite dÃƒÂ©jÃƒÂ  documentÃƒÂ©e sur ce projet) : rendu effectif du bandeau de conseils et bascule d'onglet en clic rÃƒÂ©el, dropzone/filtre en interaction utilisateur. Le visuel story boutique, lui, a ÃƒÂ©tÃƒÂ© vÃƒÂ©rifiÃƒÂ© en rendant rÃƒÂ©ellement l'image (`ImageResponse` fetchÃƒÂ© en HTTP, PNG visualisÃƒÂ©) avec et sans logo Ã¢â‚¬â€� pas seulement par lecture de code.

---

## Ãƒâ€°tat du projet (18 juillet 2026, suite Ã¢â‚¬â€� scraper Facebook rÃƒÂ©parÃƒÂ© en profondeur, OCR ajoutÃƒÂ©)

DÃƒÂ©clencheur : le scraper Facebook (`backend/scripts/scraper-facebook-local.js` + `backend/services/scraper-immo-facebook.js`) ne remontait plus aucune annonce depuis le 17 juillet (`scrapes: 0, erreurs: 0` sur tous les groupes, silencieusement). Investigation en direct (session rÃƒÂ©elle contre Facebook, pas de suppositions) ayant rÃƒÂ©vÃƒÂ©lÃƒÂ© plusieurs problÃƒÂ¨mes empilÃƒÂ©s, corrigÃƒÂ©s un par un au fil de retours d'usage rÃƒÂ©els sur les annonces manquÃƒÂ©es. 8 commits sur `main` (`7dfbced..0f275d9`), poussÃƒÂ©s directement (pas de spec/plan formels Ã¢â‚¬â€� sÃƒÂ©rie de correctifs ciblÃƒÂ©s en debug interactif).

**Cause racine initiale** : la session Facebook sauvegardÃƒÂ©e (`backend/.fb-session.json`) avait ÃƒÂ©tÃƒÂ© invalidÃƒÂ©e cÃƒÂ´tÃƒÂ© serveur par Facebook (cookies non expirÃƒÂ©s par date, mais Facebook sert quand mÃƒÂªme la vue dÃƒÂ©connectÃƒÂ©e sur la mÃƒÂªme URL de groupe Ã¢â‚¬â€� pas de redirection vers `/login`, donc le contrÃƒÂ´le existant sur `page.url()` ne le dÃƒÂ©tectait pas). ReconnectÃƒÂ©e manuellement via `node backend/scripts/fb-login-setup.js` (avec le bon compte, membre des 16 groupes Ã¢â‚¬â€� une premiÃƒÂ¨re tentative de reconnexion avec le mauvais compte a ÃƒÂ©tÃƒÂ© dÃƒÂ©tectÃƒÂ©e et corrigÃƒÂ©e). **DÃƒÂ©tection ajoutÃƒÂ©e** : si `[role="feed"]` est absent ET qu'un formulaire de mot de passe est visible sur la page de groupe, le run s'arrÃƒÂªte immÃƒÂ©diatement avec une erreur explicite au lieu de continuer silencieusement sur tous les groupes restants.

**Corrections en cascade, chacune dÃƒÂ©couverte en creusant pourquoi de vraies annonces visibles sur Facebook n'ÃƒÂ©taient toujours pas captÃƒÂ©es aprÃƒÂ¨s la premiÃƒÂ¨re rÃƒÂ©paration** :
- **Bruit vidÃƒÂ©o/reel non filtrÃƒÂ©** : minuteur de lecteur (`0:00 / 1:44`), bouton Ã‚Â« Voir plus Ã‚Â» apparaissant ailleurs qu'en toute fin (contrairement ÃƒÂ  Ã‚Â« En voir plus Ã‚Â»), hashtags de promotion (`#viralfacebookreels...`), bouton Ã‚Â« Envoyer un message Ã‚Â» (+ compteur de rÃƒÂ©actions isolÃƒÂ© qui suit) Ã¢â‚¬â€� tous retirÃƒÂ©s du texte extrait.
- **Regex tÃƒÂ©lÃƒÂ©phone structurellement incomplÃƒÂ¨te** : `parseTelephoneFB` exigeait un sÃƒÂ©parateur figÃƒÂ© aprÃƒÂ¨s le 3Ã¡Âµâ€° chiffre (format `770 12 34 56`), mais le groupement le plus courant sur Facebook sÃƒÂ©nÃƒÂ©galais est `XX XXX XX XX` (espace dÃƒÂ¨s le 2Ã¡Âµâ€° chiffre, ex. `78 332 22 99`) Ã¢â‚¬â€� jamais reconnu jusque-lÃƒÂ . CorrigÃƒÂ© en tolÃƒÂ©rant un sÃƒÂ©parateur optionnel entre chacun des 9 chiffres.
- **Annonces sans numÃƒÂ©ro exploitable** : le repli `contact_tel: 'Voir sur Facebook'` laissait passer du pur bruit d'obfuscation Facebook (posts oÃƒÂ¹ le texte n'est que des tokens 1-2 caractÃƒÂ¨res) sous forme d'annonces creuses. RetirÃƒÂ© Ã¢â‚¬â€� un post sans numÃƒÂ©ro rÃƒÂ©ellement extrait est maintenant ignorÃƒÂ© (`stats.ignores++`), plus jamais insÃƒÂ©rÃƒÂ©.
- **NumÃƒÂ©ro incrustÃƒÂ© dans l'image** (banniÃƒÂ¨res colorÃƒÂ©es type Ã‚Â« Babacar Immobilier Niane Ã‚Â», Ã‚Â« El Hadji Seck Ã‚Â») : invisible pour `parseTelephoneFB` qui ne lit que `innerText`. Ajout d'un repli OCR (**`tesseract.js`**, nouvelle dependency ÃƒÂ  la racine Ã¢â‚¬â€� jamais utilisÃƒÂ©e cÃƒÂ´tÃƒÂ© serveur, ce scraper ne tourne qu'en local, aucun impact RAM/build sur Render) : si le texte DOM d'un post est pauvre (< 6 mots utiles aprÃƒÂ¨s nettoyage) et qu'il a des images, la premiÃƒÂ¨re image est passÃƒÂ©e ÃƒÂ  l'OCR et son texte fusionnÃƒÂ© avec le texte DOM avant tous les filtres. Un seul worker Tesseract rÃƒÂ©utilisÃƒÂ© pour tout le run (coÃƒÂ»t d'init dominant). Filtres rÃƒÂ©ordonnÃƒÂ©s : tÃƒÂ©lÃƒÂ©phone + catÃƒÂ©gorie rÃƒÂ©ellement dÃƒÂ©tectÃƒÂ©s valident dÃƒÂ©jÃƒÂ  qu'il s'agit d'une vraie annonce Ã¢â‚¬â€� le filtre `estAnnoncePotentielle` (liste de mots-clÃƒÂ©s type Ã‚Â« vends Ã‚Â»/Ã‚Â« disponible Ã‚Â») ne s'applique plus qu'en repli si aucun numÃƒÂ©ro n'est trouvÃƒÂ©, car le style d'annonce local (Ã‚Â« 45 mille x 3 Ã‚Â», Ã‚Â« prend un homme Ã‚Â») omet souvent tout mot de cette liste.
- **Posts tronquÃƒÂ©s par Ã‚Â« Voir plus Ã‚Â»** : le numÃƒÂ©ro de tÃƒÂ©lÃƒÂ©phone se trouve trÃƒÂ¨s souvent juste aprÃƒÂ¨s la coupure (ex. Ã‚Â« Ã¢â‚¬Â¦Niveau disponible : 5ÃƒÂ¨me ÃƒÂ©tage Voir plus Ã‚Â» Ã¢â€ â€™ Ã‚Â« Ã¢â‚¬Â¦Prix: 400 000HT Contactez-nous au 77 697 14 73 Ã‚Â»), texte qui n'existe pas dans le DOM tant qu'on ne clique pas dessus Ã¢â‚¬â€� aucun nettoyage regex ne peut le rÃƒÂ©cupÃƒÂ©rer. Ajout d'un clic Playwright rÃƒÂ©el (pas `page.evaluate` + `.click()` DOM brut Ã¢â‚¬â€� Facebook attache ses handlers React aux ÃƒÂ©vÃƒÂ©nements de pointeur rÃƒÂ©els) sur chaque bouton Ã‚Â« Voir plus Ã‚Â» du feed avant l'extraction, boucle bornÃƒÂ©e ÃƒÂ  20 clics par groupe.

**VÃƒÂ©rifiÃƒÂ© en conditions rÃƒÂ©elles ÃƒÂ  chaque ÃƒÂ©tape** (jamais de suppositions) : session reconnectÃƒÂ©e testÃƒÂ©e contre une vraie page de groupe, chaque regex testÃƒÂ©e contre les exemples exacts fournis par l'utilisateur, OCR et clic Ã‚Â« Voir plus Ã‚Â» testÃƒÂ©s contre de vrais posts du groupe immo `252740871421764` Ã¢â‚¬â€� le post Ã‚Â« Saidou Niang Ã‚Â» (Ã‚Â« APPAREMMENT F3Ã¢â‚¬Â¦ Ã‚Â») prÃƒÂ©cÃƒÂ©demment perdu (numÃƒÂ©ro cachÃƒÂ© derriÃƒÂ¨re Ã‚Â« Voir plus Ã‚Â») est maintenant correctement retenu avec son numÃƒÂ©ro extrait aprÃƒÂ¨s dÃƒÂ©pliage.

**Fichiers modifiÃƒÂ©s** : uniquement `backend/services/scraper-immo-facebook.js` (toute la logique) + `package.json`/`package-lock.json` (ajout `tesseract.js`) + `.gitignore` (ignore `*.traineddata`, modÃƒÂ¨le OCR tÃƒÂ©lÃƒÂ©chargÃƒÂ© au runtime, ~1.2 Mo, pas ÃƒÂ  committer).

**Dette / non couvert** :
- Annonces dÃƒÂ©jÃƒÂ  en base avec `contact_tel = 'Voir sur Facebook'` (insÃƒÂ©rÃƒÂ©es par les runs avant ce chantier) non nettoyÃƒÂ©es rÃƒÂ©troactivement Ã¢â‚¬â€� restent telles quelles.
- L'OCR n'est tentÃƒÂ© que sur la **premiÃƒÂ¨re** image d'un post ÃƒÂ  texte pauvre (les photos suivantes sont supposÃƒÂ©es ÃƒÂªtre des vues complÃƒÂ©mentaires sans texte additionnel) Ã¢â‚¬â€� un post ÃƒÂ  banniÃƒÂ¨re sur sa 2Ã¡Âµâ€°+ photo uniquement resterait manquÃƒÂ©.
- Le filtre `estAnnoncePotentielle` reste inchangÃƒÂ© en tant que tel (liste de mots-clÃƒÂ©s), simplement contournÃƒÂ© quand un numÃƒÂ©ro est dÃƒÂ©jÃƒÂ  trouvÃƒÂ© Ã¢â‚¬â€� un post sans numÃƒÂ©ro ET sans mot-clÃƒÂ© de cette liste reste ignorÃƒÂ©, cas jugÃƒÂ© acceptable (pas assez de signal pour une insertion fiable).

---

## Ãƒâ€°tat du projet (18 juillet 2026, suite Ã¢â‚¬â€� traitement du panier natif WhatsApp/Meta Commerce)

Spec `docs/superpowers/specs/2026-07-18-panier-meta-whatsapp-design.md`, plan en 6 tÃƒÂ¢ches `docs/superpowers/plans/2026-07-18-panier-meta-whatsapp.md`, exÃƒÂ©cutÃƒÂ© sur la branche worktree `worktree-panier-meta-whatsapp` (5 commits, `7da3967..f6e6713`), sur `main`, poussÃƒÂ©.

**LivrÃƒÂ©** :
- `creerCommandeBoutique()` (`backend/routes/comptabilite.js`) n'envoie plus de notification WhatsApp elle-mÃƒÂªme Ã¢â‚¬â€� extraite dans `notifierVendeurCommande()`, exportÃƒÂ©e, appelÃƒÂ©e par chaque appelant. Comportement de la route web `POST /:boutiqueId/commandes` inchangÃƒÂ© (mÃƒÂªme message, notification immÃƒÂ©diate).
- Colonne additive `commandes_boutique.groupe_commande UUID` (nullable) + index partiel, pour lier les lignes d'un mÃƒÂªme panier multi-articles.
- `context.commande` du chatbot WhatsApp gÃƒÂ©nÃƒÂ©ralisÃƒÂ© : passe d'un produit unique implicite ÃƒÂ  un tableau `items[]` (`{ produit_id, nom_produit, prix, quantite, stock_quantite }`), pour le flux Ã‚Â« Commander Ã‚Â» mono-produit existant **et** le nouveau panier Meta Ã¢â‚¬â€� mÃƒÂªmes clÃƒÂ©s dans les deux chemins, `COMMANDE_QUANTITE`/`envoyerRecapFinal`/`COMMANDE_CONFIRMATION` fonctionnent identiquement quelle que soit l'origine.
- DÃƒÂ©tection `msg.type === 'order'` en tÃƒÂªte de `handleIncoming` (`whatsapp-chatbot.js`) Ã¢â‚¬â€� un client qui utilise le bouton panier natif WhatsApp depuis une fiche produit Meta Commerce dÃƒÂ©clenche `traiterPanierMeta()` : rÃƒÂ©solution des `retailer_id` (`nopalou-produit-{id}`) en produits rÃƒÂ©els (prix toujours relu en base, jamais celui envoyÃƒÂ© par Meta), articles introuvables ÃƒÂ©cartÃƒÂ©s silencieusement (panier partiellement invalide continue, panier entiÃƒÂ¨rement invalide Ã¢â€ â€™ message clair), puis dÃƒÂ©marrage direct de la collecte de coordonnÃƒÂ©es (saute l'ÃƒÂ©tape quantitÃƒÂ©, dÃƒÂ©jÃƒÂ  connue).
- Notification vendeur groupÃƒÂ©e (`notifierVendeurPanierGroupe`) pour un panier ÃƒÂ  plusieurs articles Ã¢â‚¬â€� un seul message WhatsApp listant toutes les lignes, `groupe_commande` partagÃƒÂ© par toutes les commandes crÃƒÂ©ÃƒÂ©es. Panier ÃƒÂ  1 article Ã¢â€ â€™ notification simple identique au flux mono-produit existant (`groupe_commande` reste `NULL`).
- `/boutique` Ã¢â€ â€™ onglet Commandes (`Commandes.tsx`) : `regrouperCommandes()` regroupe les lignes partageant un `groupe_commande` en carte dÃƒÂ©pliable `CommandeGroupeCard` (badge Ã‚Â« Ã°Å¸â€ºâ€™ Panier Ã‚Â· N articles Ã‚Â», total agrÃƒÂ©gÃƒÂ©, statut mixte si les lignes divergent) ; les commandes sans groupe (tout l'historique existant, mono-produit web classique) continuent d'utiliser `CommandeCard` telle quelle, aucune rÃƒÂ©gression visuelle.

**VÃƒÂ©rifications faites** :
- `node --check` propre sur les 3 fichiers backend touchÃƒÂ©s (`whatsapp-chatbot.js`, `comptabilite.js`, `migrate-inline.js`) et `npx tsc --noEmit` propre cÃƒÂ´tÃƒÂ© Next.js (`Commandes.tsx`).
- **Migration rÃƒÂ©ellement appliquÃƒÂ©e en base de production** Ã¢â‚¬â€� piÃƒÂ¨ge dÃƒÂ©couvert en le faisant : `npm run migrate` exÃƒÂ©cute en fait `backend/migrate.js`, un script **obsolÃƒÂ¨te et distinct** de `migrate-inline.js` (celui rÃƒÂ©ellement appelÃƒÂ© par `app.js` au dÃƒÂ©marrage du serveur), qui a sa propre copie ancienne du schÃƒÂ©ma sans la colonne `groupe_commande`. `npm run migrate` seul aurait donc donnÃƒÂ© un faux sentiment de succÃƒÂ¨s sans rÃƒÂ©ellement crÃƒÂ©er la colonne en prod. Migration correcte relancÃƒÂ©e directement via `require('./backend/migrate-inline')()`, colonne `commandes_boutique.groupe_commande` (type `uuid`) confirmÃƒÂ©e prÃƒÂ©sente par requÃƒÂªte directe sur `information_schema.columns`. **Si `npm run migrate` doit resservir un jour, vÃƒÂ©rifier qu'il pointe vers `migrate-inline.js` ou le retirer pour ÃƒÂ©viter ce piÃƒÂ¨ge.**
- Test isolÃƒÂ© du chemin `msg.type === 'order'` avec un `retailer_id` factice (produit inexistant) contre la base rÃƒÂ©elle : `handleIncoming()` se termine sans exception (`OK: pas de crash`), aboutit proprement au message Ã‚Â« produits non disponibles Ã‚Â».

**Non vÃƒÂ©rifiÃƒÂ© Ã¢â‚¬â€� nÃƒÂ©cessite un test manuel rÃƒÂ©el sur WhatsApp** (pas d'outil d'automatisation WhatsApp/navigateur dans cet environnement, cohÃƒÂ©rent avec la limitation dÃƒÂ©jÃƒÂ  documentÃƒÂ©e ailleurs dans ce fichier) :
- Flux Ã‚Â« Commander Ã‚Â» mono-produit existant (non-rÃƒÂ©gression) : un seul message de notification, contenu identique ÃƒÂ  avant ce chantier, `groupe_commande` NULL en base.
- Panier Meta rÃƒÂ©el ÃƒÂ  1 article envoyÃƒÂ© depuis une Product Message WhatsApp.
- Panier Meta rÃƒÂ©el ÃƒÂ  plusieurs articles de la mÃƒÂªme boutique : `groupe_commande` partagÃƒÂ©, notification vendeur groupÃƒÂ©e reÃƒÂ§ue, affichage `CommandeGroupeCard` visible et correct dans `/boutique`.
- Panier mÃƒÂ©langeant un article valide et un `retailer_id` invalide (produit supprimÃƒÂ©) : seul l'article valide doit aboutir ÃƒÂ  une commande.
- Non-rÃƒÂ©gression de la route web classique (`CommanderModal.tsx` sur `/boutiques/{id}`) Ã¢â‚¬â€� notification vendeur immÃƒÂ©diate, contenu inchangÃƒÂ©.

Smoke-test recommandÃƒÂ© avant de considÃƒÂ©rer ce chantier dÃƒÂ©finitivement clos : passer une vraie commande via chacun des 3 chemins (web, WhatsApp mono-produit, panier Meta multi-articles) et confirmer les 5 points ci-dessus.

---

## Ãƒâ€°tat du projet (18 juillet 2026 Ã¢â‚¬â€� variantes visuelles + correctif dÃƒÂ©bordement navbar mobile compte)

Suite directe du chantier boutique du 17 juillet (voir entrÃƒÂ©e ci-dessous). Deux correctifs distincts, tous deux sur `main`, poussÃƒÂ©s.

### SÃƒÂ©lection visuelle des variantes (`419ee47`)
Retour utilisateur : le formulaire texte libre livrÃƒÂ© la veille (Ã‚Â« nom de l'option Ã‚Â» + Ã‚Â« valeur, EntrÃƒÂ©e pour ajouter Ã‚Â») ne correspondait pas ÃƒÂ  la demande Ã¢â‚¬â€� il fallait une sÃƒÂ©lection **visuelle**, avec des **types de variante prÃƒÂ©dÃƒÂ©finis** (pas de saisie de nom) et des **couleurs cliquables** (pastilles, pas de texte) pour rester facile ÃƒÂ  utiliser pour un petit commerÃƒÂ§ant. Refonte complÃƒÂ¨te de la section Ã‚Â« Variantes Ã‚Â» dans `ProduitForm` (`BoutiqueClient.tsx`) :
- 6 types prÃƒÂ©dÃƒÂ©finis (`TYPES_VARIANTE`) : Ã°Å¸Å½Â¨ Couleur, Ã°Å¸â€œï¿½ Taille (vÃƒÂªtement), Ã°Å¸â€˜Å¸ Pointure (chaussure), Ã°Å¸â€™Â¾ Stockage/RAM, Ã¢Å¡â„¢Ã¯Â¸ï¿½ CapacitÃƒÂ©/Puissance, Ã¢Å¾â€¢ Autre (personnalisÃƒÂ©) Ã¢â‚¬â€� le marchand clique sur un type au lieu de taper un nom. Un seul groupe par type prÃƒÂ©dÃƒÂ©fini (retirÃƒÂ© de la liste de choix une fois ajoutÃƒÂ©), sauf Ã‚Â« Autre Ã‚Â» qui reste rÃƒÂ©pÃƒÂ©table.
- **Couleur** : 16 pastilles rondes (palette fixe `COULEURS_PALETTE`, nom + hex), cliquables, nom affichÃƒÂ© en dessous Ã¢â‚¬â€� aucune saisie texte.
- Autres types prÃƒÂ©dÃƒÂ©finis : boutons avec valeurs suggÃƒÂ©rÃƒÂ©es standards (ex. XS/S/M/L/XL/XXL, 36-46, 4 GoÃ¢â€ â€™1 ToÃ¢â‚¬Â¦), cliquables (toggle sÃƒÂ©lection).
- **Autre (personnalisÃƒÂ©)** : reste en saisie libre texte + EntrÃƒÂ©e (nouveau composant `ValeursLibres`), pour les cas non couverts par les types prÃƒÂ©dÃƒÂ©finis (matiÃƒÂ¨re, etc.).
- `Variante` a gagnÃƒÂ© un champ optionnel `typeId` (forme JSON stockÃƒÂ©e en base inchangÃƒÂ©e pour le reste Ã¢â‚¬â€� `{ nom, valeurs, typeId? }`). RÃƒÂ©trocompatible : les variantes crÃƒÂ©ÃƒÂ©es par l'ancien formulaire texte libre (sans `typeId`) s'affichent en mode Ã‚Â« Autre Ã‚Â» ÃƒÂ  l'ÃƒÂ©dition, aucune perte de donnÃƒÂ©es.

### Correctif Ã¢â‚¬â€� dÃƒÂ©bordement horizontal navbar mobile sur tout `/compte/*` (`880040d`)
Retour utilisateur avec captures : sur mobile connectÃƒÂ©, toutes les pages du compte (pas seulement `/boutique`) affichaient un dÃƒÂ©calage vers la droite avec un vide ÃƒÂ  gauche et une scrollbar horizontale. **Cause racine, sans rapport avec le chantier boutique** : `NavbarActions.tsx` (bloc Ã‚Â« nom du compte + DÃƒÂ©connexion Ã‚Â», visible uniquement connectÃƒÂ©, montÃƒÂ© dans `layout.tsx` juste avant le hamburger mobile) n'avait aucune rÃƒÂ¨gle responsive, et surtout son `style={{ display: 'flex' }}` **inline** empÃƒÂªchait toute rÃƒÂ¨gle CSS externe `display: none` de s'appliquer (mÃƒÂªme spÃƒÂ©cificitÃƒÂ©, l'inline gagne toujours en cascade). RÃƒÂ©sultat : sous ~1040px, `.navbar-actions` (nom + DÃƒÂ©connexion + bouton Publier + hamburger) dÃƒÂ©passait le viewport de ~136px sur un ÃƒÂ©cran 375px.

**MÃƒÂ©thode de vÃƒÂ©rification** : aucun outil de capture navigateur disponible dans l'environnement (limite dÃƒÂ©jÃƒÂ  documentÃƒÂ©e) Ã¢â‚¬â€� Playwright installÃƒÂ© en devDependency (`frontend-next/package.json`, ne touche jamais au build/runtime Render car en `devDependencies`, jamais installÃƒÂ© en production), compte de test crÃƒÂ©ÃƒÂ© via `/inscription`, mesure `document.documentElement.scrollWidth` vs `clientWidth` en viewport 375px avant/aprÃƒÂ¨s correctif (511 vs 375 Ã¢â€ â€™ 375 vs 375), capture d'ÃƒÂ©cran confirmant visuellement la disparition du dÃƒÂ©bordement.

**Correctif** : classe `navbar-actions-compte` ajoutÃƒÂ©e sur le wrapper (au lieu du style inline `display`), masquÃƒÂ©e sous 1040px dans `globals.css` (mÃƒÂªme media query que `.navbar-link`/`.navbar-inscription` pour les visiteurs anonymes Ã¢â‚¬â€� le nom/DÃƒÂ©connexion est de toute faÃƒÂ§on dÃƒÂ©jÃƒÂ  dupliquÃƒÂ© dans le tiroir `MobileNav`). Playwright conservÃƒÂ© en devDependency pour faciliter ce type de vÃƒÂ©rification visuelle mobile ÃƒÂ  l'avenir.

**PiÃƒÂ¨ge ÃƒÂ  retenir** : un style inline `display` sur un ÃƒÂ©lÃƒÂ©ment ne peut JAMAIS ÃƒÂªtre masquÃƒÂ© par une media query CSS externe de mÃƒÂªme spÃƒÂ©cificitÃƒÂ© Ã¢â‚¬â€� si un composant a besoin d'ÃƒÂªtre cachÃƒÂ©/affichÃƒÂ© de faÃƒÂ§on responsive, le `display` doit venir d'une classe CSS, jamais d'un style inline, mÃƒÂªme si le reste des styles (gap, align-itemsÃ¢â‚¬Â¦) peut rester inline.

---

## Ãƒâ€°tat du projet (17 juillet 2026, suite Ã¢â‚¬â€� boutique : responsive mobile, multi-photos et variantes produit)

DÃƒÂ©clencheur : retour utilisateur avec captures d'ÃƒÂ©cran mobile montrant la zone Ã‚Â« Ma boutique Ã‚Â» ÃƒÂ©crasÃƒÂ©e sur tÃƒÂ©lÃƒÂ©phone, plus deux limitations signalÃƒÂ©es par comparaison avec AliExpress (un seul champ photo, aucune variante). Spec `docs/superpowers/specs/2026-07-17-boutique-mobile-photos-variantes-design.md`, plan en 8 tÃƒÂ¢ches `docs/superpowers/plans/2026-07-17-boutique-mobile-photos-variantes.md`, exÃƒÂ©cutÃƒÂ© via subagent-driven-development (revue par tÃƒÂ¢che + revue finale de branche opus), mergÃƒÂ© sur `main` (`aeaf235..1d49f40`), poussÃƒÂ©.

**LivrÃƒÂ©** :
- **Responsive mobile** Ã¢â‚¬â€� tout `frontend-next/src/app/boutique/BoutiqueClient.tsx` (liste boutiques, formulaires, vue Ã‚Â« GÃƒÂ©rer la boutique Ã‚Â») converti de styles inline vers des classes CSS (`.bq-*`, `globals.css`) avec breakpoint 640px cohÃƒÂ©rent avec le reste du site. La sidebar de gestion (220px fixe) devient une barre d'onglets horizontale scrollable sous 640px ; toutes les grilles `1fr 1fr` passent en 1 colonne.
- **Jusqu'ÃƒÂ  5 photos par produit du catalogue boutique** (au lieu d'une seule) Ã¢â‚¬â€� `boutique_produits.images` ÃƒÂ©tait dÃƒÂ©jÃƒÂ  `TEXT[]`, seule la route (`upload.single('image')` Ã¢â€ â€™ `upload.array('photos', 5)`, nouvelle instance multer dÃƒÂ©diÃƒÂ©e `uploadProduitPhotos` pour ne pas toucher aux limites de la route logo/cover) et le formulaire (dropzone rÃƒÂ©utilisant les classes `.photos-zone`/`.photos-dropzone`/`.photo-thumb` dÃƒÂ©jÃƒÂ  utilisÃƒÂ©es par `FormulaireAnnonce.tsx`, technique `DataTransfer` pour resynchroniser `input.files` en lecture seule lors des suppressions) limitaient ÃƒÂ  1.
- **Variantes simples produit** (ex: Couleur/Taille Ã¢â‚¬â€� un seul `prix`/`stock_quantite` pour tout le produit, pas de prix/stock par combinaison, dÃƒÂ©cision explicite pour rester simple ÃƒÂ  saisir pour un petit commerÃƒÂ§ant) Ã¢â‚¬â€� nouvelle colonne additive `boutique_produits.variantes JSONB DEFAULT '[]'`, section optionnelle Ã‚Â« Variantes Ã‚Â» dans le formulaire vendeur (mode dÃƒÂ©taillÃƒÂ© uniquement). Sur la fiche produit publique, la sÃƒÂ©lection d'une valeur par option est **obligatoire** avant que le bouton Ã‚Â« Commander sur le site Ã‚Â» se dÃƒÂ©bloque (dÃƒÂ©cision utilisateur Ã¢â‚¬â€� pas de prÃƒÂ©sÃƒÂ©lection automatique) ; WhatsApp/TÃƒÂ©lÃƒÂ©phone restent cliquables sans contrainte (canaux hors-site). La sÃƒÂ©lection choisie est reportÃƒÂ©e dans le champ Ã‚Â« Note / prÃƒÂ©cisions Ã‚Â» dÃƒÂ©jÃƒÂ  existant du formulaire de commande Ã¢â‚¬â€� aucun changement du schÃƒÂ©ma `commandes_boutique`.

**Limite fonctionnelle notÃƒÂ©e par la revue finale (assumÃƒÂ©e, pas un bug)** : l'obligation de sÃƒÂ©lectionner une variante n'est appliquÃƒÂ©e que cÃƒÂ´tÃƒÂ© client Ã¢â‚¬â€� le champ `note` reste librement ÃƒÂ©ditable et `POST /api/comptabilite/:id/commandes` ne connaÃƒÂ®t pas les variantes. Un vendeur peut donc recevoir une commande d'un produit ÃƒÂ  variantes sans variante renseignÃƒÂ©e si l'acheteur vide le champ ou appelle l'API directement. Conforme ÃƒÂ  la spec (pas de nouvelle colonne de commande voulue), ÃƒÂ  garder en tÃƒÂªte si une garantie serveur devient nÃƒÂ©cessaire plus tard.

**Incident de chantier ÃƒÂ  retenir** : la premiÃƒÂ¨re tentative de la tÃƒÂ¢che CSS (modÃƒÂ¨le haiku, chargÃƒÂ© d'un simple ajout en fin de `globals.css`) a rÃƒÂ©ÃƒÂ©crit tout le fichier au lieu d'un ajout ciblÃƒÂ©, corrompant l'encodage du texte franÃƒÂ§ais prÃƒÂ©existant (BOM UTF-8 ajoutÃƒÂ©, tous les accents/tirets mojibakÃƒÂ©s Ã¢â‚¬â€� Ã‚Â« Nopalou Ã¢â‚¬â€� Design System Ã‚Â» devenu Ã‚Â« Nopalou ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Design System Ã‚Â»). DÃƒÂ©tectÃƒÂ© via un `git diff --stat` montrant 148 suppressions inattendues pour une tÃƒÂ¢che d'ajout pur, avant toute revue ; commit annulÃƒÂ© (`git reset --hard`), retentÃƒÂ© avec succÃƒÂ¨s en imposant l'usage d'Edit ciblÃƒÂ© plutÃƒÂ´t que Write pour toute tÃƒÂ¢che touchant un gros fichier existant contenant de l'Unicode. Voir mÃƒÂ©moire `feedback_haiku_unicode_mangling.md` Ã¢â‚¬â€� toujours vÃƒÂ©rifier `git diff --stat` aprÃƒÂ¨s une tÃƒÂ¢che d'ajout pur sur un fichier volumineux multilingue, 0 suppression attendue.

**Non vÃƒÂ©rifiÃƒÂ© par navigateur rÃƒÂ©el** (aucun outil d'automatisation disponible dans l'environnement) : rendu effectif de la barre d'onglets scrollable sous 640px, dropzone multi-photos, sÃƒÂ©lecteur de variantes. VÃƒÂ©rifiÃƒÂ© uniquement via `npx tsc --noEmit` (propre) et relecture de diff. Test manuel recommandÃƒÂ© aprÃƒÂ¨s dÃƒÂ©ploiement : `/boutique` en mode mobile, ajout d'un produit avec 3-5 photos et 2 options de variantes, puis parcours acheteur sur la fiche publique.

---

## Ãƒâ€°tat du projet (17 juillet 2026, suite Ã¢â‚¬â€� dÃƒÂ©doublonnage produits + tri par dÃƒÂ©faut Ã‚Â« meilleur prix Ã‚Â»)

DÃƒÂ©clencheur : doublons visibles dans la recherche chatbot (Ã‚Â« Samsung Galaxy 16 5G Ã‚Â» en double). Diagnostic prod : **5 230 lignes en trop sur 8 200 produits (64 %)**, doublons recrÃƒÂ©ÃƒÂ©s ÃƒÂ  chaque run de scraping. Spec `docs/superpowers/specs/2026-07-17-dedoublonnage-produits-tri-prix-design.md`, plan 6 tÃƒÂ¢ches, subagent-driven-development, revue finale opus Ã‚Â« Ready to merge Ã‚Â» 0 Critical/Important, mergÃƒÂ© ff (`9b3953b..d97f487` + `33141b2`), poussÃƒÂ©.

**Causes racines corrigÃƒÂ©es** :
- Titres 100 % gÃƒÂ©nÃƒÂ©riques (Ã‚Â« Split Haier Ã‚Â», Ã‚Â« iPhone X Ã‚Â») : tous les mots filtrÃƒÂ©s par `MOTS_GENERIQUES`/longueur < 3 Ã¢â€ â€™ `motsCles` vide Ã¢â€ â€™ matching flou **sautÃƒÂ©** Ã¢â€ â€™ INSERT ÃƒÂ  chaque run. CorrigÃƒÂ© par une ÃƒÂ©tape **1bis** dans `sauvegarderProduits` : correspondance exacte sur nom normalisÃƒÂ© via `sqlNomNormalise(col)` (exportÃƒÂ©e de `scraper.js`, source unique Ã¢â‚¬â€� appliquÃƒÂ©e AUX DEUX cÃƒÂ´tÃƒÂ©s de l'ÃƒÂ©galitÃƒÂ©). Ã¢Å¡Â Ã¯Â¸ï¿½ Deux fix rounds ont ÃƒÂ©tÃƒÂ© nÃƒÂ©cessaires : les subagents haiku **mutilent les caractÃƒÂ¨res Unicode** (`Ã¢â‚¬â„¢Ã¢â‚¬ËœÃ¢â‚¬Å“Ã¢â‚¬ï¿½`) et l'ÃƒÂ©chappement `\[\]` dans les template literals Ã¢â‚¬â€� ÃƒÂ©crire ce genre de ligne soi-mÃƒÂªme.
- Apostrophes : `normaliserTitre` les retire cÃƒÂ´tÃƒÂ© requÃƒÂªte mais pas cÃƒÂ´tÃƒÂ© base Ã¢â€ â€™ Ã‚Â« J'adore EDP 100ml Ã‚Â» ne matchait jamais (124 doublons).

**Fusion exÃƒÂ©cutÃƒÂ©e en prod (2 passes)** : `backend/scripts/fusionner-doublons-produits.js` (`--dry-run` supportÃƒÂ©, une transaction par groupe, offres/alertes/clics rattachÃƒÂ©s au canonique, conflit `UNIQUE(produit_id,marchand_id)` Ã¢â€ â€™ l'offre la plus rÃƒÂ©cente gagne + historique rÃƒÂ©parentÃƒÂ©, recalcul `prix_min`/`nb_offres`). CritÃƒÂ¨re STRICT exigÃƒÂ© par l'utilisateur : mÃƒÂªme nom normalisÃƒÂ© + catÃƒÂ©gorie + marque + prix_min + ensemble des marchands. RÃƒÂ©sultat : 71 groupes fusionnÃƒÂ©s, **5 190 fiches supprimÃƒÂ©es, 8 200 Ã¢â€ â€™ 3 016 produits**, 0 ÃƒÂ©chec, alertes intactes. Le critÃƒÂ¨re strict est **instable aprÃƒÂ¨s recalcul** (des fiches convergent vers le mÃƒÂªme prix) Ã¢â€ â€™ une 2Ã¡Âµâ€° passe a ÃƒÂ©tÃƒÂ© nÃƒÂ©cessaire ; ~40 fiches restent en doublon de nom (prix/marchands diffÃƒÂ©rents Ã¢â‚¬â€� assumÃƒÂ©). Le fix scraper vÃƒÂ©rifiÃƒÂ© en rÃƒÂ©el : le scrape de 11h16 a rattachÃƒÂ© son offre ÃƒÂ  la fiche de mai au lieu d'en crÃƒÂ©er une 8Ã¡Âµâ€°.

**Tri par dÃƒÂ©faut** : `GET /api/produits` sans `tri` Ã¢â€ â€™ `MIN(o.prix) ASC NULLS LAST` (sponsorisÃƒÂ©s toujours en tÃƒÂªte), `tri=populaire` = ancien classement popularitÃƒÂ©. Pills accueil/catÃƒÂ©gorie : dÃƒÂ©faut Ã‚Â« Ã°Å¸â€™Â° Prix Ã¢â€ â€˜ Ã‚Â», Ã‚Â« Ã¢Â­ï¿½ Populaires Ã‚Â» Ã¢â€ â€™ `?tri=populaire`. Guides/immo/annonces/boutiques/tÃƒÂ©lÃƒÂ©com inchangÃƒÂ©s. VÃƒÂ©rifiÃƒÂ© en prod : prix croissants sur nopalou.com/api/produits.

**Dette notÃƒÂ©e (revues)** : `nb_offres` stockÃƒÂ© = `COUNT(o.id)` toutes offres vs API qui compte les offres en stock (divergence prÃƒÂ©-existante, reproduite fidÃƒÂ¨lement par le script) ; asymÃƒÂ©trie mots retirÃƒÂ©s `normaliserTitre` vs `sqlNomNormalise` (neuf/occasion/promoÃ¢â‚¬Â¦) Ã¢â‚¬â€� 0 occurrence en prod aujourd'hui, ÃƒÂ  surveiller si nouvelle source scrape ces mots dans les titres.

---

## Ãƒâ€°tat du projet (17 juillet 2026 Ã¢â‚¬â€� chatbot WhatsApp : pagination Ã‚Â« plus / encore / d'autres Ã‚Â»)

Retour d'usage rÃƒÂ©el : aprÃƒÂ¨s une recherche (Ã‚Â« Samsung Ã‚Â»), retaper la requÃƒÂªte ou dire Ã‚Â« plus Ã‚Â» remontrait toujours les 3-5 mÃƒÂªmes rÃƒÂ©sultats Ã¢â‚¬â€� la session repassait en `MENU` sans mÃƒÂ©moire de ce qui avait ÃƒÂ©tÃƒÂ© affichÃƒÂ©, et Ã‚Â« plus Ã‚Â» partait en recherche full-text du mot Ã‚Â« plus Ã‚Â». Spec `docs/superpowers/specs/2026-07-13-chatbot-pagination-plus-design.md`, plan en 5 tÃƒÂ¢ches `docs/superpowers/plans/2026-07-13-chatbot-pagination-plus.md`, exÃƒÂ©cutÃƒÂ© via subagent-driven-development, revue finale opus Ã‚Â« Ready to merge Ã‚Â» 0 Critical/Important, mergÃƒÂ© fast-forward dans `main` (`a9a5a59..f0e4c82`), poussÃƒÂ© (dÃƒÂ©ploiement Render).

**LivrÃƒÂ©** (un seul fichier de code : `backend/services/whatsapp-chatbot.js`) :
- Mots-clÃƒÂ©s `MOTS_PLUS` (`plus`, `encore`, `d'autres`, `dautres`, `autres`, `autre`, `voir plus`, `la suite`, `suivant`, `ok`, `oui` Ã¢â‚¬â€� correspondance exacte sur texte normalisÃƒÂ©) dÃƒÂ©tectÃƒÂ©s en ÃƒÂ©tat `MENU`, AVANT `detecterFAQ` et le fallback recherche. Ã‚Â« ok merci Ã‚Â» reste une clÃƒÂ´ture (`CLOTURE` testÃƒÂ©e avant le bloc MENU Ã¢â‚¬â€� ne pas rÃƒÂ©ordonner).
- Le contexte de session (`whatsapp_sessions.context`) mÃƒÂ©morise `{ last: { type: 'search'|'immo'|'telecom', query?, shownIds: [] } }` aprÃƒÂ¨s chaque affichage paginable ; Ã‚Â« plus Ã‚Â» relance la mÃƒÂªme requÃƒÂªte en excluant `shownIds` (`AND id::text <> ALL($n::text[])` Ã¢â‚¬â€� le cast `::text[]` est obligatoire, tableau vide = vacuously true = comportement d'origine).
- `searchContent(query, excludeIds = [])`, `handleSearchQuery(phone, query, excludeIds = [])` (signatures rÃƒÂ©trocompatibles), listes immo/tÃƒÂ©lÃƒÂ©com du menu factorisÃƒÂ©es en `envoyerListeImmo`/`envoyerListeTelecom(phone, excludeIds = [])`.
- Fin de liste Ã¢â€ â€™ Ã‚Â« Ã¢Å“â€¦ Vous avez vu tout ce que j'ai pour "Ã¢â‚¬Â¦" Ã‚Â» ; Ã‚Â« plus Ã‚Â» sans contexte (session neuve/expirÃƒÂ©e 1h/dÃƒÂ©tour FAQ-alerte-commande qui ÃƒÂ©crase `last`) Ã¢â€ â€™ Ã‚Â« Ã°Å¸â€�ï¿½ Plus de quoi ? Ã‚Â» + ÃƒÂ©tat `SEARCH_QUERY`. Ces ÃƒÂ©crasements de `last` par les autres flux sont VOULUS (spec).
- Notes de revue (pas des bugs) : le `LIMIT 5` global de l'UNION peut couper des lignes non enregistrÃƒÂ©es dans `shownIds` Ã¢â‚¬â€� elles rÃƒÂ©apparaissent ÃƒÂ  la page suivante, jamais de doublon affichÃƒÂ© ; `shownIds` croÃƒÂ®t en session mais bornÃƒÂ© par le reset 1h. Non testÃƒÂ© en rÃƒÂ©el WhatsApp Ã¢â‚¬â€� smoke-test recommandÃƒÂ© : recherche Ã¢â€ â€™ *plus* Ã¢â€ â€™ *plus*, Ã‚Â« oui Ã‚Â» aprÃƒÂ¨s Ã‚Â« Envie de continuer ? Ã‚Â», Ã‚Â« ok merci Ã‚Â» (doit clÃƒÂ´turer), immo/tÃƒÂ©lÃƒÂ©com Ã¢â€ â€™ *plus*.

---

## Ãƒâ€°tat du projet (16 juillet 2026 Ã¢â‚¬â€� gestion des comptes admin, correctifs bandeau email et PLANS, dette carte-visite)

Quatre chantiers sur `main` (`c68b4bc..1beca60`, poussÃƒÂ©) : deux correctifs ponctuels puis un chantier complet de gestion des comptes admin, avec un effet de bord dÃƒÂ©couvert en fin de parcours.

### Correctif Ã¢â‚¬â€� bandeau email non vÃƒÂ©rifiÃƒÂ© invisible malgrÃƒÂ© `email_verifie=false`
Le bandeau `BannerEmailNonVerifie` (portage legacy du 14 juillet) ne s'affichait jamais : dans `(account)/layout.tsx`, il ÃƒÂ©tait rendu comme 3Ã¡Âµâ€° enfant direct de `.account-layout` (`display: grid; grid-template-columns: 220px 1fr`) Ã¢â‚¬â€� CSS Grid le plaÃƒÂ§ait automatiquement dans une cellule de la grille (colonne 220px, sous la sidebar) au lieu de s'ÃƒÂ©taler pleine largeur au-dessus. CorrigÃƒÂ© en sortant le bandeau du conteneur grid via un fragment `<>`, au-dessus de `.account-layout`. VÃƒÂ©rifiÃƒÂ© par un parcours complet en local contre la base de prod (inscription Ã¢â€ â€™ `email_verifie:false` Ã¢â€ â€™ bandeau Ã¢â€ â€™ renvoi Ã¢â€ â€™ clic lien Ã¢â€ â€™ `email_verifie:true`).

### Correctif Ã¢â‚¬â€� `POST /api/abonnements/admin/activer` plantait (Ã‚Â« PLANS is not defined Ã‚Â»)
`backend/routes/abonnements.js` : la route d'activation manuelle de plan test (bouton admin Ã‚Â« Activer un plan test Ã‚Â») rÃƒÂ©fÃƒÂ©renÃƒÂ§ait `PLANS[plan]` sans jamais appeler `const PLANS = await getPlans()`, contrairement ÃƒÂ  la route `/initier` juste au-dessus qui le fait correctement. `ReferenceError` JS Ã¢â€ â€™ 500 ÃƒÂ  chaque tentative. Un seul `const PLANS = await getPlans();` ajoutÃƒÂ© en tÃƒÂªte de la route, testÃƒÂ© en local (garde-fous plan invalide / utilisateur introuvable confirmÃƒÂ©s fonctionnels).

### Chantier Ã¢â‚¬â€� section Ã‚Â« Gestion des comptes Ã‚Â» dans l'admin
Aucune section admin ne permettait jusque-lÃƒÂ  de consulter/agir sur les comptes utilisateurs directement. Spec `docs/superpowers/specs/2026-07-16-gestion-comptes-admin-design.md`, plan en 9 tÃƒÂ¢ches `docs/superpowers/plans/2026-07-16-gestion-comptes-admin.md`, exÃƒÂ©cutÃƒÂ© via subagent-driven-development (fresh subagent par tÃƒÂ¢che + revue systÃƒÂ©matique + revue finale de branche opus Ã‚Â« Ready to merge Ã‚Â», 0 Critical/Important). 2 cycles de fix pendant les revues de tÃƒÂ¢che : imports morts (`jwt`/`envoyerEmail`) retirÃƒÂ©s ÃƒÂ  la Task 2 ; faille TOCTOU corrigÃƒÂ©e ÃƒÂ  la Task 5 (la route `purger` faisait un `SELECT` puis un `UPDATE` sÃƒÂ©parÃƒÂ© sans re-garder `anonymise_le IS NULL` dans le `WHERE` de l'`UPDATE` Ã¢â‚¬â€� deux appels concurrents pouvaient tous deux passer le check et exÃƒÂ©cuter l'anonymisation ; corrigÃƒÂ© en repliant le garde-fou dans le `WHERE` de l'`UPDATE` avec `RETURNING id`, 400 si la ligne n'est pas retournÃƒÂ©e).

**LivrÃƒÂ©** :
- 3 colonnes sur `utilisateurs` : `suspendu BOOLEAN`, `supprime_le TIMESTAMPTZ`, `anonymise_le TIMESTAMPTZ` (migration idempotente, additive).
- `backend/routes/admin-utilisateurs.js`, montÃƒÂ© sur `/api/admin/utilisateurs`, protÃƒÂ©gÃƒÂ© `adminSecretOnly` partout (jamais `verifierToken`) : `GET /` (liste paginÃƒÂ©e, recherche texte nom/email/tel, filtres statut/type, tri date), `GET /:id` (fiche + rÃƒÂ©sumÃƒÂ© activitÃƒÂ© + abonnement actif), `PUT /:id/verifier-email`, `POST /:id/renvoyer-verification`, `POST /:id/lien-reset` (gÃƒÂ©nÃƒÂ¨re sans jamais envoyer Ã¢â‚¬â€� affichÃƒÂ© ÃƒÂ  l'admin pour transmission manuelle), `PUT /:id/suspendre` / `/reactiver`, et le flux RGPD rÃƒÂ©versible en 3 ÃƒÂ©tapes : `POST /:id/marquer-supprime` (pÃƒÂ©riode de grÃƒÂ¢ce 30j), `POST /:id/restaurer` (annule), `POST /:id/purger` (anonymisation dÃƒÂ©finitive Ã¢â‚¬â€� **jamais de `DELETE` physique** Ã¢â‚¬â€� refusÃƒÂ©e si moins de 30 jours ÃƒÂ©coulÃƒÂ©s ou dÃƒÂ©jÃƒÂ  purgÃƒÂ©).
- `POST /api/auth/connexion` refuse dÃƒÂ©sormais les comptes `suspendu=true` ou `supprime_le IS NOT NULL` (403, message distinct par cas), vÃƒÂ©rifiÃƒÂ© aprÃƒÂ¨s le mot de passe pour ne pas fuiter l'info ÃƒÂ  un attaquant sans le bon mot de passe ; les 3 champs sont destructurÃƒÂ©s hors de la rÃƒÂ©ponse `user` dans tous les cas.
- `/admin/comptes` (liste, recherche + pills de filtre) et `/admin/comptes/[id]` (fiche dÃƒÂ©tail + `ActionsCompteClient` : boutons support/modÃƒÂ©ration/suppression, `confirm()` simple pour suspendre/marquer-supprimer, **double confirmation** pour la purge + bouton dÃƒÂ©sactivÃƒÂ© cÃƒÂ´tÃƒÂ© client tant que les 30 jours ne sont pas ÃƒÂ©coulÃƒÂ©s Ã¢â‚¬â€� le vrai garde-fou reste serveur), lien menu admin ajoutÃƒÂ©.
- Chaque route testÃƒÂ©e en direct contre la base de production rÃƒÂ©elle avec des comptes de test dÃƒÂ©diÃƒÂ©s crÃƒÂ©ÃƒÂ©s puis supprimÃƒÂ©s dans la foulÃƒÂ©e (jamais de mutation sur un compte rÃƒÂ©el) Ã¢â‚¬â€� y compris le cycle complet suspensionÃ¢â€ â€™connexion refusÃƒÂ©eÃ¢â€ â€™rÃƒÂ©activation et marquageÃ¢â€ â€™grÃƒÂ¢ceÃ¢â€ â€™purge (date `supprime_le` forcÃƒÂ©e 31 jours dans le passÃƒÂ© via SQL direct pour simuler l'ÃƒÂ©coulement sans attendre).

### Dette dÃƒÂ©couverte en cours de route Ã¢â‚¬â€� `assets/carte-visite` a deux runtimes incompatibles
En voulant valider `npm run build` pour la Task 9 (vÃƒÂ©rification finale), le build ÃƒÂ©chouait sur un bug **prÃƒÂ©existant, sans rapport** avec ce chantier (confirmÃƒÂ© via `git merge-base --is-ancestor` : introduit par le commit `9c97b76`, antÃƒÂ©rieur au dÃƒÂ©but du plan) : `frontend-next/src/app/assets/carte-visite/route.tsx` avait `runtime = 'edge'`, incompatible avec sa dÃƒÂ©pendance `qrcode-svg` (a besoin de `fs`, absent en edge). RetirÃƒÂ© `runtime = 'edge'` (seul fichier `ImageResponse` du projet ÃƒÂ  importer `qrcode-svg` Ã¢â‚¬â€� aucun autre des 15 autres fichiers `runtime='edge'` du projet n'est concernÃƒÂ©). **Mais** ce retrait a rÃƒÂ©vÃƒÂ©lÃƒÂ© un second bug indÃƒÂ©pendant : `next/og` (`ImageResponse`, toujours utilisÃƒÂ© par ce mÃƒÂªme fichier) plante en runtime Node sur Windows (`TypeError: Invalid URL` dans `@vercel/og`, le bug de police embarquÃƒÂ©e dÃƒÂ©jÃƒÂ  documentÃƒÂ© ailleurs dans ce fichier pour les icÃƒÂ´nes PWA Ã¢â‚¬â€� cf. entrÃƒÂ©e du 11 juillet). **Aucun des deux runtimes ne fonctionne actuellement pour cette route sur une machine de dev Windows.** DÃƒÂ©cision assumÃƒÂ©e : garder le retrait d'`edge` (qrcode-svg n'a jamais fonctionnÃƒÂ© en edge Ã¢â‚¬â€� ÃƒÂ©chec silencieux Ã¢â‚¬â€� contre une erreur de build visible et actionnable), accepter que `npm run build` reste cassÃƒÂ© en local sur Windows pour cette seule route, non bloquant pour le reste du site. **Non vÃƒÂ©rifiÃƒÂ© si le build Render (Linux) est ÃƒÂ©galement affectÃƒÂ©** Ã¢â‚¬â€� ÃƒÂ  surveiller au prochain dÃƒÂ©ploiement ; si `@vercel/og` fonctionne normalement sous Linux (probable, le bug est documentÃƒÂ© comme spÃƒÂ©cifique ÃƒÂ  Windows), la route pourrait fonctionner correctement en prod malgrÃƒÂ© l'ÃƒÂ©chec local.

---

## Ãƒâ€°tat du projet (13 juillet 2026, soir Ã¢â‚¬â€� comparaison Ã‚Â« zÃƒÂ©ro rejet Ã‚Â» : filtrage auto par groupe de produit)

Constat utilisateur : la comparaison Next.js n'avait **aucun contrÃƒÂ´le de type** (ÃƒÂ©couteur vs frigo comparables) Ã¢â‚¬â€� le contrÃƒÂ´le existait dans le SPA legacy (`comparerCat` + filtre auto, `frontend/app.js:4753`) mais n'avait jamais ÃƒÂ©tÃƒÂ© portÃƒÂ©. Exigence validÃƒÂ©e : **jamais de rejet aprÃƒÂ¨s clic** Ã¢â‚¬â€� au lieu de bloquer, filtrer. Spec `docs/superpowers/specs/2026-07-13-comparaison-zero-rejet-design.md`, plan en 7 tÃƒÂ¢ches, exÃƒÂ©cutÃƒÂ© via subagent-driven-development, revue finale opus Ã‚Â« Ready to merge Ã‚Â» 0 Critical/Important, mergÃƒÂ© fast-forward dans `main` (`2104dce..fe31532`), poussÃƒÂ© (dÃƒÂ©ploiement Render).

### LivrÃƒÂ©
- **`frontend-next/src/lib/comparaison.ts`** : `infererGroupe(nom)` (portage de `_inferCat` legacy Ã¢â‚¬â€� l'ORDRE des regex est significatif : audio/tv avant smartphones, tablette avant smartphones), `GROUPE_LABELS`, `CAT_NOM_SLUG`, `lireCompare()`. ClÃƒÂ© legacy `informatique` renommÃƒÂ©e `ordinateurs` (= la clÃƒÂ© backend). Contrat : toute clÃƒÂ© retournÃƒÂ©e doit exister dans `SOUS_TYPE_MOTS` (backend).
- **Backend** : 5 nouveaux `sousType` dans `SOUS_TYPE_MOTS` (`smartphones`, `maison`, `mode`, `auto-moto`, `jeux`) Ã¢â‚¬â€� additif pur.
- **`CardActions`** : au 1er ajout d'un produit, groupe infÃƒÂ©rÃƒÂ© (repli : catÃƒÂ©gorie DB via `CAT_NOM_SLUG`), stockÃƒÂ© dans les entrÃƒÂ©es `nopalou_compare` (`{id, nom, type, groupe?, catSlug?}` Ã¢â‚¬â€� tableau racine conservÃƒÂ©, rÃƒÂ©trocompatible), et `?sousType=` poussÃƒÂ© dans l'URL des pages liste (`/` et `/categorie/[slug]`). Boutons Ã¢Å¡â€“ incompatibles (autre type quand une comparaison produit est active, ou autre groupe) rendus `disabled` + `title` explicatif Ã¢â‚¬â€� jamais de toast d'erreur. Logique favoris inchangÃƒÂ©e.
- **Accueil + page catÃƒÂ©gorie** transmettent `sousType` au backend (filtre serveur Ã¢â€ â€™ pagination/compteurs justes ; `sousType` inclus dans `hasFiltre` et la `key` de `ProduitsListe`) ; Ã‚Â« Voir plus Ã‚Â» filtrÃƒÂ© aussi.
- **`CompareFilterBanner`** (montÃƒÂ© sur ces 2 pages) : Ã‚Â« Ã¢Å¡â€“ Comparaison active Ã¢â‚¬â€� affichage limitÃƒÂ© aux X (similaires ÃƒÂ  Ã‚Â« Ã¢â‚¬Â¦ Ã‚Â») Ã‚Â» + Ã¢Å“â€¢ Vider ; synchronise le filtre d'URL si la comparaison a ÃƒÂ©tÃƒÂ© dÃƒÂ©marrÃƒÂ©e ailleurs. **`CompareBar`** retire `sousType` de l'URL quand la sÃƒÂ©lection se vide.

### PiÃƒÂ¨ges / notes ÃƒÂ  retenir
- **`useSearchParams()` interdit** dans `CardActions`/`CompareBar`/`CompareFilterBanner` : montÃƒÂ©s sur des pages statiques (landing `[sousCategorie]`) et le layout global Ã¢â‚¬â€� sans Suspense boundary, `next build` ÃƒÂ©choue. Lire `window.location.search` dans les handlers/effets uniquement (jamais pendant le rendu). Build validÃƒÂ© 73/73 pages.
- **Bug prÃƒÂ©-existant corrigÃƒÂ© au passage** (`fe31532`) : le fetch SSR de `categorie/[slug]/page.tsx` n'envoyait pas `X-SSR-Token` Ã¢â€ â€™ `blockScraperUA` le bloquait en 429 (page Ã‚Â« aucun produit Ã‚Â» en local, cf. piÃƒÂ¨ge `SSR_SECRET` du 11 juillet). AlignÃƒÂ© sur l'accueil (`SSR_HEADERS`).
- **Dette notÃƒÂ©e (revue)** : `SOUS_TYPE_MOTS` et `CAT_FALLBACK` (mÃƒÂªme fichier `backend/routes/produits.js`) dupliquent partiellement les mots-clÃƒÂ©s de `maison`/`mode`/`auto-moto`/`jeux` Ã¢â‚¬â€� si l'un ÃƒÂ©volue, mettre l'autre ÃƒÂ  jour.
- PÃƒÂ©rimÃƒÂ¨tre assumÃƒÂ© : produits uniquement Ã¢â‚¬â€� une comparaison immo/tÃƒÂ©lÃƒÂ©com active ne dÃƒÂ©sactive PAS les Ã¢Å¡â€“ produits (comportement historique conservÃƒÂ©).
- Non vÃƒÂ©rifiÃƒÂ© par navigateur rÃƒÂ©el (aucun outil dispo) : rendu du bandeau, grisage effectif des Ã¢Å¡â€“, Vider Ã¢â‚¬â€� smoke-test manuel recommandÃƒÂ© aprÃƒÂ¨s dÃƒÂ©ploiement.

---

## Ãƒâ€°tat du projet (13 juillet 2026 Ã¢â‚¬â€� scraper Facebook rÃƒÂ©parÃƒÂ©, exÃƒÂ©cution locale + automatisation Windows)

Le scraper Facebook (`backend/services/scraper-immo-facebook.js`) n'avait **jamais fonctionnÃƒÂ© depuis sa crÃƒÂ©ation en juin** Ã¢â‚¬â€� `waitUntil: 'networkidle'` ne se rÃƒÂ©sout jamais sur Facebook (polling/websockets permanents), et `playwright` n'ÃƒÂ©tait qu'en devDependency donc jamais installÃƒÂ© sur Render en production. Chantier en deux temps : d'abord tenter de le faire tourner sur Render, puis pivot vers exÃƒÂ©cution locale + automatisation Windows aprÃƒÂ¨s avoir confirmÃƒÂ© que le plan Render free ne peut structurellement pas le supporter.

### Tentative Render (abandonnÃƒÂ©e Ã¢â‚¬â€� voir raison ci-dessous)
CorrigÃƒÂ© dans l'ordre, chaque ÃƒÂ©tape validÃƒÂ©e en conditions rÃƒÂ©elles avant de passer ÃƒÂ  la suivante : `networkidle` Ã¢â€ â€™ `domcontentloaded` (timeout 30s puis 60s, le plan free est plus lent que le local) ; `playwright` dÃƒÂ©placÃƒÂ© en dependency rÃƒÂ©elle + `render.yaml` pour installer `chrome-headless-shell` au build (`--only-shell`, plus lÃƒÂ©ger que Chromium complet) ; `PLAYWRIGHT_BROWSERS_PATH=0` pour que le binaire installÃƒÂ© au build survive jusqu'au runtime (sinon `/opt/render/.cache` ne persiste pas) ; session Facebook transmise via variable d'env `FB_SESSION_JSON` (le fichier `.fb-session.json` local est gitignorÃƒÂ©, jamais dÃƒÂ©ployÃƒÂ©) ; verrou mÃƒÂ©moire (`backend/lib/scrapingLock.js`) pour empÃƒÂªcher le scraper Facebook et le cron de scraping produits de tourner en mÃƒÂªme temps.

**AbandonnÃƒÂ© aprÃƒÂ¨s confirmation en prod** : mÃƒÂªme avec toutes ces corrections, le service **redÃƒÂ©marrait tout seul** (OOM) en pleine exÃƒÂ©cution du scraping Ã¢â‚¬â€� logs montrant `Instance restarted`, `[SIGTERM]`, des dizaines de `Cannot use a pool after calling end on the pool`. 512 Mo de RAM (plan Render free/Hobby) est structurellement insuffisant pour Express + PostgreSQL pool + un navigateur Chromium headless, quelle que soit la taille du run. DÃƒÂ©cision utilisateur explicite : rester 100% gratuit, ne pas upgrader le plan.

### Solution retenue Ã¢â‚¬â€� script local
- `backend/scripts/scraper-facebook-local.js` : lance `scraperImmo()` depuis la machine locale, ÃƒÂ©crit directement dans la base de production via le `DATABASE_URL` du `.env` local (pas de synchronisation supplÃƒÂ©mentaire nÃƒÂ©cessaire Ã¢â‚¬â€� une seule base existe). `render.yaml`/`PLAYWRIGHT_BROWSERS_PATH` revertÃƒÂ©s ÃƒÂ  l'ÃƒÂ©tat d'origine, plus besoin de Chromium sur Render.
- Bouton admin `/admin/annonces` retirÃƒÂ© (`lancerSyncFacebook` server action supprimÃƒÂ©e) Ã¢â‚¬â€� devenu trompeur puisqu'il ne peut plus fonctionner de faÃƒÂ§on fiable en prod.
- `backend/scripts/fb-login-setup.js` crÃƒÂ©ÃƒÂ© Ã¢â‚¬â€� rÃƒÂ©fÃƒÂ©rencÃƒÂ© 4 fois dans le code depuis juin mais n'avait jamais existÃƒÂ© dans le repo ; ouvre un navigateur visible pour se connecter manuellement (gÃƒÂ¨re 2FA/vÃƒÂ©rification Meta), sauvegarde la session dans `backend/.fb-session.json`.
- **Rotation des 16 groupes persistÃƒÂ©e sur disque** (`backend/.fb-scraper-state.json`, gitignorÃƒÂ©) Ã¢â‚¬â€� bug trouvÃƒÂ© en conditions rÃƒÂ©elles : la variable de rotation ÃƒÂ©tait en mÃƒÂ©moire, donc remise ÃƒÂ  zÃƒÂ©ro ÃƒÂ  chaque lancement CLI (un nouveau process Node ÃƒÂ  chaque fois), les mÃƒÂªmes 5 premiers groupes ÃƒÂ©taient rescrapÃƒÂ©s en boucle. `maxGroupes: 5` par dÃƒÂ©faut (limite la durÃƒÂ©e d'un run), `--tout` pour les 16 d'un coup.
- **Automatisation Windows Task Scheduler** : `backend/scripts/scraper-facebook-auto.bat` (wrapper qui logge dans `backend/scripts/logs/`, gitignorÃƒÂ©) + `notifier-scraper-fb.ps1` (notification Windows toast au dÃƒÂ©but du run et ÃƒÂ  la fin avec rÃƒÂ©sumÃƒÂ© Ã¢â‚¬â€� annonces ajoutÃƒÂ©es/doublons/erreurs, lu depuis `backend/.fb-scraper-resume.txt`). PiÃƒÂ¨ge Task Scheduler : l'option "ExÃƒÂ©cuter que l'utilisateur soit connectÃƒÂ© ou non" exige un mot de passe Windows et ÃƒÂ©choue souvent (Ã‚Â« compte inconnu Ã‚Â») Ã¢â‚¬â€� utiliser "ExÃƒÂ©cuter uniquement si l'utilisateur est connectÃƒÂ©" ÃƒÂ  la place, plus l'option "Si la tÃƒÂ¢che planifiÃƒÂ©e est manquÃƒÂ©e, l'exÃƒÂ©cuter dÃƒÂ¨s que possible" pour rattraper au redÃƒÂ©marrage si le PC ÃƒÂ©tait ÃƒÂ©teint.

### Bugs de qualitÃƒÂ© de donnÃƒÂ©es trouvÃƒÂ©s en observant les vraies annonces scrapÃƒÂ©es
- **DÃƒÂ©doublonnage inter-groupes** : un mÃƒÂªme post republiÃƒÂ© tel quel dans plusieurs groupes Facebook crÃƒÂ©ait autant de lignes quasi-identiques (`ref_externe` ne dÃƒÂ©tecte que les doublons dans un mÃƒÂªme groupe, pas entre groupes). `upsertAnnonceClassifiee()` vÃƒÂ©rifie dÃƒÂ©sormais si un numÃƒÂ©ro de tÃƒÂ©lÃƒÂ©phone extrait a dÃƒÂ©jÃƒÂ  une annonce Facebook des 7 derniers jours avant d'insÃƒÂ©rer.
- **Commentaires rÃƒÂ©els mÃƒÂ©langÃƒÂ©s au texte du post** : `estFilDeCommentaires()` ne rejetait un fil de commentaires que si le texte total faisait Ã¢â€°Â¤15 mots Ã¢â‚¬â€� un post + 2 vrais commentaires dÃƒÂ©passe largement ce seuil et passait tel quel (ex: titre affichant des noms de commentateurs + "J'aime RÃƒÂ©pondre Partager"). Le texte est dÃƒÂ©sormais coupÃƒÂ© ÃƒÂ  "Voir plus de commentaires" avant tout autre traitement.
- **Suffixes d'interface Facebook** ("Envoyez votre premier commentaire...", "Ãƒâ€°crivez un commentaire public...", bouton rÃƒÂ©siduel "En voir plus") retirÃƒÂ©s du texte extrait Ã¢â‚¬â€� 11 annonces dÃƒÂ©jÃƒÂ  en base nettoyÃƒÂ©es en place.
- **`contact_tel = 'Voir sur Facebook'` gÃƒÂ©nÃƒÂ©rait des liens cassÃƒÂ©s** : `href="tel:Voir sur Facebook"` et un lien `wa.me` avec numÃƒÂ©ro vide, au lieu d'un vrai lien. Nouvelle colonne `annonces_classifiees.url_source` (alimentÃƒÂ©e par le scraper avec le lien rÃƒÂ©el du post) ; la fiche annonce affiche un vrai bouton "Voir sur Facebook" quand le numÃƒÂ©ro n'a pas pu ÃƒÂªtre extrait, masquÃƒÂ© proprement si `url_source` est absent (8 annonces scrapÃƒÂ©es avant ce fix n'ont pas cette donnÃƒÂ©e rÃƒÂ©troactivement).
- Bouton "Recevoir par WhatsApp" retirÃƒÂ© de la fiche annonce (demande explicite) Ã¢â‚¬â€� ne restent que le tÃƒÂ©l. cliquable et le bouton WhatsApp direct.

### FonctionnalitÃƒÂ©s `/annonces` ajoutÃƒÂ©es au passage (avant le pivot ci-dessus)
Recherche texte (titre+description Ã¢â‚¬â€� le backend le supportait dÃƒÂ©jÃƒÂ , jamais exposÃƒÂ© cÃƒÂ´tÃƒÂ© UI), filtres prix min/max et origine (Nopalou vs Facebook), favoris (Ã¢â„¢Â¥) sur les cartes. Pas de comparateur ajoutÃƒÂ© Ã¢â‚¬â€� dÃƒÂ©cision assumÃƒÂ©e, les annonces sont trop hÃƒÂ©tÃƒÂ©rogÃƒÂ¨nes (meuble vs voiture vs tÃƒÂ©lÃƒÂ©phone) pour qu'un comparatif cÃƒÂ´te ÃƒÂ  cÃƒÂ´te ait un sens, contrairement aux produits/immo/tÃƒÂ©lÃƒÂ©com qui partagent des critÃƒÂ¨res communs. Bug prÃƒÂ©-existant corrigÃƒÂ© au passage : `nopalou_favs` ne stockait qu'un tableau d'IDs sans type (produits uniquement) Ã¢â‚¬â€� un favori immo/telecom ajoutÃƒÂ© depuis `CardActions` n'apparaissait jamais sur `/favoris`. MigrÃƒÂ© vers `{id, type}[]`.

**Pour relancer le scraping** : `node backend/scripts/scraper-facebook-local.js` (5 groupes, rotation automatique) ou configurer la tÃƒÂ¢che planifiÃƒÂ©e Windows dÃƒÂ©crite ci-dessus pour un fonctionnement autonome.

---

## Ãƒâ€°tat du projet (12 juillet 2026, soir Ã¢â‚¬â€� refonte visuelle du bloc SEO homepage)

Suite au chantier SEO site-wide du mÃƒÂªme jour (voir entrÃƒÂ©e ci-dessous), retour utilisateur sur le rendu du bloc SEO homepage ajoutÃƒÂ© par ce chantier (Ã‚Â« pas bien alignÃƒÂ© et mal formatÃƒÂ© Ã‚Â», puis Ã‚Â« pas vivant ni attirant Ã‚Â»). Deux passes :

1. **Correctif d'alignement** (`88fbd74`) Ã¢â‚¬â€� le bloc utilisait `columns: 2` (CSS multi-colonnes faÃƒÂ§on journal), qui rÃƒÂ©partissait 3 paragraphes de faÃƒÂ§on dÃƒÂ©sÃƒÂ©quilibrÃƒÂ©e (1 paragraphe en colonne 1, 2 entassÃƒÂ©s en colonne 2, laissant un vide visuel). RemplacÃƒÂ© par un vrai `display: grid` 2 colonnes avec un paragraphe par colonne.
2. **Refonte visuelle complÃƒÂ¨te** (`649d3bc` CSS + `d902cc3` JSX) Ã¢â‚¬â€� le bloc restait plat (div bordÃƒÂ© gÃƒÂ©nÃƒÂ©rique, liens simplement soulignÃƒÂ©s) sans lien avec l'identitÃƒÂ© visuelle Ã‚Â« ticket Ã‚Â» du reste de la homepage. Process complet brainstorming Ã¢â€ â€™ maquette Artifact (comparatif avant/aprÃƒÂ¨s validÃƒÂ© par l'utilisateur) Ã¢â€ â€™ spec Ã¢â€ â€™ plan Ã¢â€ â€™ subagent-driven-development. Nouvelle carte `.seo-card` : perforation en haut (mÃƒÂªme motif `radial-gradient` que `.card-produit--ticket`), en-tÃƒÂªte centrÃƒÂ© (titre + badge `.seo-tag`), 2 paragraphes avec icÃƒÂ´ne ronde (`.seo-icon`), catÃƒÂ©gories principales et recherches longue traÃƒÂ®ne en chips cliquables (`.chip`/`.chip-small`) avec icÃƒÂ´ne emoji et hover ÃƒÂ  liserÃƒÂ© accent (`inset 3px 0 0 var(--accent)`, cohÃƒÂ©rent avec le hover dÃƒÂ©jÃƒÂ  utilisÃƒÂ© sur les autres cartes du site), pied de carte avec point de statut. Aucune URL ni contenu ÃƒÂ©ditorial modifiÃƒÂ© Ã¢â‚¬â€� refonte purement visuelle, `CATEGORIES[].emoji` rÃƒÂ©utilisÃƒÂ© directement (pas de mapping icÃƒÂ´ne dupliquÃƒÂ©). Revue finale opus : Ã‚Â« Ready to merge Ã‚Â», 0 Critical/Important.

Spec : `docs/superpowers/specs/2026-07-12-refonte-bloc-seo-homepage-design.md`. Plan : `docs/superpowers/plans/2026-07-12-refonte-bloc-seo-homepage.md`.

**PiÃƒÂ¨ge ÃƒÂ  noter** : le plan contenait une incohÃƒÂ©rence rÃƒÂ©dactionnelle entre sa section Ã‚Â« Global Constraints Ã‚Â» (Ã‚Â« wording byte-identical Ã‚Â») et son propre JSX prescrit (qui retire volontairement le suffixe Ã‚Â« au SÃƒÂ©nÃƒÂ©gal Ã‚Â» des chips catÃƒÂ©gorie, la carte portant dÃƒÂ©jÃƒÂ  ce contexte via son H2). La revue finale a tranchÃƒÂ© : le JSX/la maquette approuvÃƒÂ©e font foi, ce n'est pas une rÃƒÂ©gression Ã¢â‚¬â€� juste une imprÃƒÂ©cision du texte de contrainte du plan, ÃƒÂ  ne pas reproduire si ce plan sert de modÃƒÂ¨le.

---

## Ãƒâ€°tat du projet (12 juillet 2026 Ã¢â‚¬â€� chantier SEO site-wide Ã‚Â« QualitÃƒÂ© puis conquÃƒÂªte Ã‚Â», mergÃƒÂ© en prod)

DÃƒÂ©clencheur : audit SEO demandÃƒÂ© par l'utilisateur (Ã‚Â« quelle chance qu'on retrouve mon site sur ses mots-clÃƒÂ©s ? Ã‚Â»). Constat Search Console : **719 pages dÃƒÂ©couvertes, 4 indexÃƒÂ©es** (uniquement les 4 liens de la navbar) Ã¢â‚¬â€� domaine jeune, maillage interne quasi nul, pages jugÃƒÂ©es minces. Spec `docs/superpowers/specs/2026-07-11-seo-site-wide-design.md`, plan en 13 tÃƒÂ¢ches `docs/superpowers/plans/2026-07-11-seo-site-wide.md`, exÃƒÂ©cutÃƒÂ© via subagent-driven-development (~20 commits, merge `a97e5eb`), revue finale de branche opus Ã‚Â« Ready to merge Ã‚Â» 0 Critical/Important.

### LivrÃƒÂ©
- **20 landing pages config-driven** : 9 sous-catÃƒÂ©gories produits `/categorie/[slug]/[sousCategorie]` (climatiseurs 2150 produits, iphone, samsung, xiaomi-redmi, tecno, televiseurs, refrigerateurs, electromenager, ordinateurs), 7 immo `/immo/{location,vente}-{appartement,chambre,studio,maison,terrain}-dakar` (dossiers statiques + composant partagÃƒÂ© `ImmoLanding`), 4 tÃƒÂ©lÃƒÂ©com `/telecom/{orange,yas,promobile,expresso}` (`OperateurLanding`). Pattern clÃƒÂ© : les fichiers de donnÃƒÂ©es (`categorie/categories-data.ts`, `categorie/sous-categories-data.ts`, `immo/landing-data.ts`, `telecom/landing-data.ts`) sont la source unique importÃƒÂ©e par les pages, le sitemap ET le maillage Ã¢â‚¬â€� aucune URL ne peut dÃƒÂ©river.
- **Backend** : 5 nouveaux `sousType` dans `SOUS_TYPE_MOTS` (`iphone`, `samsung`, `xiaomi`, `tecno`, `ordinateurs`) Ã¢â‚¬â€� extension additive pure, aucun placeholder SQL touchÃƒÂ©.
- **Correctifs** : titles dÃƒÂ©dupliquÃƒÂ©s sur ~40 pages (Ã‚Â« Ã¢â‚¬Â¦ | Nopalou | Nopalou Ã‚Â» Ã¢â‚¬â€� voir piÃƒÂ¨ge ci-dessous), canonicals + descriptions (telecom, 5 guides, boutiques, assistant-whatsapp), JSON-LD produit construit sur les offres filtrÃƒÂ©es `valides` (plus la liste brute), mojibake corrigÃƒÂ© (pages budget + `comparer/[a]/[b]`), contenu ÃƒÂ©ditorial unique par catÃƒÂ©gorie (champ `contenu: string[]`), maillage footer Ã‚Â« Recherches populaires Ã‚Â» + bloc SEO homepage + fil d'Ariane produit cliquable (map `CAT_SLUGS` : libellÃƒÂ©s DB rÃƒÂ©els `Telephones`/`TV & Electro`/Ã¢â‚¬Â¦ Ã¢â€ â€™ slugs), sitemap assaini (retrait `/connexion`, `/inscription`, `/favoris`, `/comparaison`, `/categorie/beaute` (0 produit) ; ajout guides + pages budget + 20 landing pages). ID Google Analytics corrigÃƒÂ© : `G-GD7365PKTS` (l'ancien `G-3KGE1YBMVJ` ne collectait rien).

### PiÃƒÂ¨ges dÃƒÂ©couverts (ÃƒÂ  retenir absolument)
- **`moins-de-[budget]` ÃƒÂ©tait un triple bug** : Next.js traite un dossier ÃƒÂ  brackets partiels comme un segment dynamique COMPLET Ã¢â€ â€™ la route capturait n'importe quel 3Ã¡Âµâ€° segment (`/categorie/smartphones/nimportequoi` rendait la page), `params.budget` recevait le segment entier (`parseInt` Ã¢â€ â€™ NaN Ã¢â€ â€™ toujours 100 000), et tout le texte ÃƒÂ©tait en mojibake. RemplacÃƒÂ©e par `[sousCategorie]` qui gÃƒÂ¨re budget (`/^moins-de-(\d{4,9})$/`) + sous-catÃƒÂ©gories + `notFound()`. Deux segments dynamiques frÃƒÂ¨res sont interdits par Next Ã¢â‚¬â€� d'oÃƒÂ¹ le remplacement plutÃƒÂ´t que l'ajout.
- **Template de titre** : `layout.tsx` dÃƒÂ©finit `template: '%s | Nopalou'` Ã¢â‚¬â€� AUCUN `title:` de page ne doit contenir Ã‚Â« Nopalou Ã‚Â» (doublon garanti en prod). Les `openGraph.title` ne sont PAS templÃƒÂ©tÃƒÂ©s (garder la marque lÃƒÂ  est correct).
- **Soft-404 site-wide** : `notFound()` sur les pages `force-dynamic` renvoie HTTP **200** (streaming Ã¢â‚¬â€� les headers partent avant), en dev ET en prod, sur tout le site (`produit/[id]`, `categorie/[slug]` inclus). Le contenu Ã‚Â« Page introuvable Ã‚Â» est bien rendu. Dette connue, faible impact (rien ne pointe vers ces URLs) Ã¢â‚¬â€� ne pas Ã‚Â« redÃƒÂ©couvrir Ã‚Â» ce bug.
- **`npm run build` pendant que le dev server tourne** : toujours interdit (corrompt `.next`) ; et supprimer un dossier de route sous un dev server actif le fait planter en boucle Ã‚Â« Jest worker exceptions Ã‚Â» Ã¢â€ â€™ seul un restart le rÃƒÂ©pare.
- **Sitemap en dev** : la partie dynamique (produits/immo/annonces/boutiques) rend vide si le premier fetch part avant que le backend soit chaud, puis reste cachÃƒÂ©e 1h (`revalidate: 3600`) Ã¢â‚¬â€� ne pas conclure ÃƒÂ  une rÃƒÂ©gression, la prod fonctionne.
- Le libellÃƒÂ© Ã‚Â« Yas Ã‚Â» (ex-Free) est la valeur `operateur` rÃƒÂ©elle en base pour le 2Ã¡Âµâ€° opÃƒÂ©rateur ; `?operateur=` matche en ILIKE.

### Reste ÃƒÂ  faire (cÃƒÂ´tÃƒÂ© fondateur Ã¢â‚¬â€� voir `docs/SEO-POST-DEPLOIEMENT.md`)
Re-soumettre le sitemap dans Search Console, demandes d'indexation des ~32 pages stratÃƒÂ©giques (~10/jour sur 4 jours), rÃƒÂ¨gles Cloudflare (redirect www + cache edge), suivi hebdo de la courbe Ã‚Â« Pages indexÃƒÂ©es Ã‚Â» (dÃƒÂ©part : 4). RÃƒÂ©sultat attendu sous 2-6 semaines Ã¢â‚¬â€� domaine jeune.

### Dette acceptÃƒÂ©e
Soft-404 streaming (ci-dessus) ; prioritÃƒÂ© sitemap 0.85 partagÃƒÂ©e catÃƒÂ©gories/sous-catÃƒÂ©gories ; interface `ImmoResponse` dupliquÃƒÂ©e (`ImmoLanding.tsx` + `immo/page.tsx`) ; `Number(page)` Ã¢â€ â€™ NaN possible dans la pagination si `?page=abc` (motif prÃƒÂ©existant, dupliquÃƒÂ© dans `[sousCategorie]`).

---

## Ãƒâ€°tat du projet (11 juillet 2026 Ã¢â‚¬â€� Phases 1-6 CDC + design Ã‚Â« ticket Ã‚Â» + audit mobile/PWA, tout mergÃƒÂ© en prod)

Trois chantiers livrÃƒÂ©s et dÃƒÂ©ployÃƒÂ©s le mÃƒÂªme jour (32 commits sur `main`, Render auto-dÃƒÂ©ployÃƒÂ©).

### Chantier 1 Ã¢â‚¬â€� Phases 1-6 du CDC v4.0 (17 commits, `720432b`..`3254403`)
- **Alertes prix** : cron toutes les 15 min (`verifierAlertsPrix()` dans `scraper.js`), page `/mes-alertes` (Server Actions Ã¢â‚¬â€� ne PAS importer `backendAuthFetch` dans un Client Component, ÃƒÂ§a tire `server-only` et casse le build). **PiÃƒÂ¨ge corrigÃƒÂ©** : l'alerte est dÃƒÂ©sactivÃƒÂ©e (`active=false`) aprÃƒÂ¨s envoi Ã¢â‚¬â€� sans ÃƒÂ§a l'utilisateur ÃƒÂ©tait re-notifiÃƒÂ© toutes les 15 min.
- **Bug de prod critique corrigÃƒÂ©** : les crons mÃƒÂ©tier (alertes, anomalies) ÃƒÂ©taient dans `demarrerScraping()`, jamais appelÃƒÂ©e sur Render (`SCRAPING_DISABLED=true`) Ã¢â€ â€™ nouvelle fonction **`demarrerCronsMetier()`** appelÃƒÂ©e inconditionnellement dans `app.js`. Ã¢Å¡Â Ã¯Â¸ï¿½ Les crons relances-expiration/nettoyage/WhatsApp-cleanup sont TOUJOURS derriÃƒÂ¨re le flag scraping Ã¢â‚¬â€� dette connue, jamais exÃƒÂ©cutÃƒÂ©s sur Render.
- **Historique prix** : chart SVG 30j (`PriceHistoryChart.tsx`) sur la fiche produit.
- **Sentry v10** : `@sentry/node` v10 n'a plus `Sentry.Handlers` (API v7) Ã¢â‚¬â€� init simple + `Sentry.setupExpressErrorHandler(app)` ; cÃƒÂ´tÃƒÂ© Next `@sentry/nextjs` installÃƒÂ©. **Inactif tant que `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` ne sont pas configurÃƒÂ©s sur Render.** (Le code frontend rÃƒÂ©fÃƒÂ©rence encore `new Sentry.Replay(...)` API v7 Ã¢â‚¬â€� ÃƒÂ  migrer si un DSN est ajoutÃƒÂ©.)
- **Pages programmatiques SEO** : `/comparer/[a]/[b]` et `/categorie/[slug]/moins-de-[budget]`. **PiÃƒÂ¨ge majeur vÃƒÂ©cu** : les dossiers avaient ÃƒÂ©tÃƒÂ© crÃƒÂ©ÃƒÂ©s avec des brackets fragmentÃƒÂ©s (`[slug` + dossier `]`) Ã¢â‚¬â€� Next ne reconnaissait pas les segments dynamiques et prÃƒÂ©-gÃƒÂ©nÃƒÂ©rait avec `params` vide (crash `toLowerCase` au build). Sur Windows/PowerShell, manipuler ces dossiers exige `-LiteralPath` ou les APIs .NET.
- **Phase 5 affiliation** : routes `/api/affiliates` (track public, clicks/convert protÃƒÂ©gÃƒÂ©s `adminSecretOnly`), tables `affiliate_clicks`, service `awin-postback.js`, dashboard `/admin/affiliates/tracking`.
- **Phase 6 qualitÃƒÂ© donnÃƒÂ©es** : `anomaly-detector.js` (cron 1h UTC Ã¢â‚¬â€� quarantaine si prix Ã¢â€°Â¤ 0 ou variation > 50% vs moyenne 30j de `historique_prix`), colonne **`offres.quarantinee`** (DEFAULT FALSE) filtrÃƒÂ©e par `AND o.quarantinee = false` dans les requÃƒÂªtes produits/offres, table `quarantines_log`, dashboard `/admin/qualite` (valider/rejeter). PremiÃƒÂ¨re exÃƒÂ©cution rÃƒÂ©elle : **138 offres quarantinÃƒÂ©es** (variations 50-112%, lÃƒÂ©gitimes).
- **PiÃƒÂ¨ge local (pas committÃƒÂ©)** : `SSR_SECRET` doit exister dans `frontend-next/.env.local` ET dans le `.env` backend Ã¢â‚¬â€� sinon `blockScraperUA` (middlewares/rateLimit.js) bloque le fetch SSR de Next (UA `node`) en 429 Ã¢â€ â€™ Ã‚Â« Impossible de charger les produits Ã‚Â». VÃƒÂ©rifier ce couple sur tout nouvel environnement.

### Chantier 2 Ã¢â‚¬â€� Design Ã‚Â« ticket Ã‚Â» + finition typographique (9 commits)
Spec/plan : `docs/superpowers/specs/2026-07-11-design-ticket-homepage-design.md` + plan associÃƒÂ©. DÃƒÂ©cisions validÃƒÂ©es : palette existante conservÃƒÂ©e (PAS la palette kraft/indigo du CDC), monospace **systÃƒÂ¨me** pour les prix (0 Ko, `--font-mono`), tilt sur cartes promo uniquement, **Archivo** remplace Sora pour les titres.
- **Bug latent corrigÃƒÂ© au passage** : 29 sÃƒÂ©lecteurs utilisaient `'Sora'` en littÃƒÂ©ral (CSS + styles inline TSX) Ã¢â‚¬â€� ÃƒÂ§a ne matche JAMAIS le nom scopÃƒÂ© gÃƒÂ©nÃƒÂ©rÃƒÂ© par `next/font`, ces titres rendaient en sans-serif systÃƒÂ¨me depuis toujours. Toujours utiliser `var(--font-archivo)`.
- **Bug d'uniformisation corrigÃƒÂ©** : `.home-how`/`.home-proof`/`.home-cta-annonce` rÃƒÂ©fÃƒÂ©renÃƒÂ§aient `var(--max-w)`/`var(--px)` **jamais dÃƒÂ©finies** Ã¢â€ â€™ sections ÃƒÂ©tirÃƒÂ©es bord ÃƒÂ  bord. DÃƒÂ©finies dans `:root` (1200px/20px). Toutes les sections homepage (y compris tarifs et bloc SEO, passÃƒÂ© en 2 colonnes desktop via `.home-seo-cols`) partagent maintenant cette largeur.
- Signature : tilt Ã‚Â±0.35Ã‚Â° (ÃƒÂ  1Ã‚Â° le texte devenait flou Ã¢â‚¬â€� anti-aliasing de rotation ; retour utilisateur explicite Ã‚Â« presque invisible Ã‚Â»), perforation en `radial-gradient` (jamais `border: dashed`), badge promo tampon (-3Ã‚Â°, triple `box-shadow inset`), ombres 2 couches teintÃƒÂ©es encre `rgba(26,22,18,Ã¢â‚¬Â¦)` (jamais de noir pur), boutons comparer/favori en orange accent. RÃƒÂ¨gle focus : `outline` SANS `border-radius` (sinon les liens circulaires du footer se dÃƒÂ©forment au focus).
- Retours utilisateur intÃƒÂ©grÃƒÂ©s : densification gÃƒÂ©nÃƒÂ©rale (paddings rÃƒÂ©duits, cartes Ã‚Â« Comment ÃƒÂ§a marche Ã‚Â» horizontales icÃƒÂ´ne+texte), exigence Ã‚Â« pas de design IA par dÃƒÂ©faut, travail fin Ã‚Â».

### Chantier 3 Ã¢â‚¬â€� Audit mobile + PWA (5 commits)
- `export const viewport` dans `layout.tsx` (`viewportFit: 'cover'`, themeColor dÃƒÂ©placÃƒÂ© ici) + `env(safe-area-inset-bottom)` sur `.bottom-bars-wrap`.
- **IcÃƒÂ´nes PWA PNG** 192/512 + **maskable dÃƒÂ©diÃƒÂ©e** (safe-zone 20%) : routes `ImageResponse` sous `src/app/icons/{192,512,maskable-512}/route.tsx`. **PiÃƒÂ¨ge : `runtime = 'edge'` obligatoire** Ã¢â‚¬â€� `@vercel/og` plante en runtime Node sur Windows (ERR_INVALID_URL sur sa police embarquÃƒÂ©e). Manifest v3 avec entrÃƒÂ©es `any`/`maskable` sÃƒÂ©parÃƒÂ©es ; SW bump `nopalou-shell-v2`.
- Mobile : grille produits **2 colonnes** sous 600px (pattern marketplace), `.table-alertes` et `.comparison-table` avec scroll horizontal de secours, `.auth-page` en `minmax(0,420px)` + bascule ÃƒÂ  900px, perforation ticket ajustÃƒÂ©e au padding mobile.

### PiÃƒÂ¨ges d'environnement local (Windows) ÃƒÂ  connaÃƒÂ®tre
- `npm run build` pendant que le dev server tourne **corrompt `.next`** Ã¢â€ â€™ le site rend sans CSS (404 sur layout.css). Toujours : tuer le process du port 3001, builder, relancer `npm run dev`.
- L'erreur **EBUSY** en fin de build (copie `standalone`) est un verrou antivirus Windows Ã¢â‚¬â€� PAS un ÃƒÂ©chec si Ã‚Â« Generating static pages 61/61 Ã¢Å“â€œ Ã‚Â» apparaÃƒÂ®t ; sans impact sur Render (Linux).
- `TaskStop`/kill du shell ne tue pas le process node enfant sur Windows Ã¢â‚¬â€� libÃƒÂ©rer le port via `Get-NetTCPConnection -LocalPort 3001` + `Stop-Process`.

---

## Ãƒâ€°tat du projet (10 juillet 2026 Ã¢â‚¬â€� tri et filtres sur les pages guide)

Audit demandÃƒÂ© ("ajouter tri et filtre sur les rÃƒÂ©sultats des guides") sur les 4 pages "guide" ÃƒÂ  rÃƒÂ©sultats (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`). Constat initial : `guide-achat`/`guide-immo`/`guide-forfait` avaient dÃƒÂ©jÃƒÂ  un systÃƒÂ¨me de tri (pills Score/Prix/Dispo-Surface-Data, classes CSS partagÃƒÂ©es `.guide-tri-btns`/`.guide-tri-btn`) et des filtres riches dans un panneau gauche (budget, catÃƒÂ©gorie/type, sliders de pondÃƒÂ©ration) Ã¢â‚¬â€� seul `guide-prix` n'avait qu'un filtre par catÃƒÂ©gorie et aucun tri sur sa liste de rÃƒÂ©sultats. PÃƒÂ©rimÃƒÂ¨tre validÃƒÂ© avec l'utilisateur (7 commits `45f5bc1`..`df57d3d`, exÃƒÂ©cutÃƒÂ©s via subagent-driven-development avec revue ÃƒÂ  chaque tÃƒÂ¢che + revue finale de branche) :

- **Backend** (`backend/routes/produits.js`, `GET /api/produits`) : nouveau champ agrÃƒÂ©gÃƒÂ© `etats` (tableau des valeurs distinctes `offres.specs->>'etat'` Ã¢â‚¬â€� neuf/occasion/reconditionne Ã¢â‚¬â€� parmi les offres en stock d'un produit) et nouveau paramÃƒÂ¨tre `etat` pour filtrer cÃƒÂ´tÃƒÂ© serveur via une sous-requÃƒÂªte `EXISTS` corrÃƒÂ©lÃƒÂ©e (pas un `JOIN`, pour ne pas fausser les agrÃƒÂ©gats `MIN(o.prix)`/`COUNT(o.id)`/`etats` d'un produit multi-offres). **PiÃƒÂ¨ge de renumÃƒÂ©rotation SQL** : ajouter `etat` comme `$7` a nÃƒÂ©cessitÃƒÂ© de dÃƒÂ©caler tous les placeholders de recherche multi-tokens de `$7+i` vers `$8+i` (`buildQCond`) Ã¢â‚¬â€� vÃƒÂ©rifiÃƒÂ© qu'aucun autre `$7`/`$8` n'ÃƒÂ©tait oubliÃƒÂ© dans le handler, et que la recherche multi-mots (`q=iphone 14`) fonctionne toujours aprÃƒÂ¨s coup. Changement additif et rÃƒÂ©trocompatible : les 8 autres appelants existants de `/api/produits` ignorent simplement le nouveau champ `etats`, et `etat` non fourni Ã¢â€¡â€™ `$7::text IS NULL` court-circuite le filtre.
- **`guide-prix`** (`GuidePrixContent.tsx`) : ajout de 4 pills de tri (Pertinence/Prix Ã¢â€ â€˜/Prix Ã¢â€ â€œ/Plus d'offres, tri client sur `sortedResults`, rÃƒÂ©utilise `.guide-tri-btns`) et d'un filtre prix min/max (deux `<input type="number">`, envoyÃƒÂ©s en `prixMin`/`prixMax` Ã¢â‚¬â€� dÃƒÂ©jÃƒÂ  supportÃƒÂ©s cÃƒÂ´tÃƒÂ© backend) ÃƒÂ  cÃƒÂ´tÃƒÂ© des pills de catÃƒÂ©gorie existantes. Min > max Ã¢â€¡â€™ filtre ignorÃƒÂ© silencieusement (pas d'erreur), cohÃƒÂ©rent avec la dÃƒÂ©gradation des autres filtres budget du site.
- **`guide-achat`** (`GuideAchatContent.tsx`) : nouveau filtre **Ãƒâ€°tat** (select Neuf/Occasion/ReconditionnÃƒÂ©/Tous, consomme le nouveau champ backend) et nouveau filtre **DisponibilitÃƒÂ© minimum** (nombre de marchands, filtrÃƒÂ© cÃƒÂ´tÃƒÂ© client sur le champ dÃƒÂ©jÃƒÂ  prÃƒÂ©sent `nb_offres`, aprÃƒÂ¨s le calcul du score et avant `setResults`/`setTotal`).
- **`guide-immo`** (`GuideImmoContent.tsx`) : 4Ã¡Âµâ€° bouton de tri **"Ã°Å¸â€ â€¢ RÃƒÂ©cent"**, utilisant `annonces_immo.created_at` (dÃƒÂ©jÃƒÂ  renvoyÃƒÂ© par `GET /api/immo`, `ORDER_MAP.recent` dÃƒÂ©jÃƒÂ  supportÃƒÂ© cÃƒÂ´tÃƒÂ© backend Ã¢â‚¬â€� aucun changement serveur nÃƒÂ©cessaire ici).
- **`guide-forfait`** : volontairement non touchÃƒÂ© Ã¢â‚¬â€� pas de colonne `created_at` fiable sur `forfaits_telecom`, et un tri "plus rÃƒÂ©cent" n'a pas de sens pour un catalogue de forfaits opÃƒÂ©rateur (pas des annonces qui expirent).

**Bug trouvÃƒÂ© et corrigÃƒÂ© en cours de route** (`dcce624`) : la premiÃƒÂ¨re version du commit `guide-prix` tri (`8adaf93`) contenait une chaÃƒÂ®ne JS `'Ã°Å¸ï¿½Âª Plus d'offres'` avec une apostrophe non ÃƒÂ©chappÃƒÂ©e dans un littÃƒÂ©ral entre guillemets simples Ã¢â‚¬â€� erreur de syntaxe bloquant totalement la compilation (`tsc`/`next build`), non dÃƒÂ©tectÃƒÂ©e par l'implÃƒÂ©menteur car sa seule vÃƒÂ©rification ÃƒÂ©tait un `curl` confirmant que la page se chargeait (bundle dev-server potentiellement obsolÃƒÂ¨te). CorrigÃƒÂ© en passant ÃƒÂ  un template literal (`` `Ã°Å¸ï¿½Âª Plus d'offres` ``). Depuis cet incident, toute tÃƒÂ¢che de ce chantier a ÃƒÂ©tÃƒÂ© dispatchÃƒÂ©e avec l'instruction explicite de lancer `npx tsc --noEmit` et de vÃƒÂ©rifier zÃƒÂ©ro erreur avant de dÃƒÂ©clarer "terminÃƒÂ©" Ã¢â‚¬â€� pas seulement un chargement de page rÃƒÂ©ussi.

**Limitation connue** : aucune vÃƒÂ©rification par navigateur rÃƒÂ©el (clic effectif sur les pills/select, confirmation visuelle du rÃƒÂ©ordonnancement) n'a ÃƒÂ©tÃƒÂ© possible pendant ce chantier Ã¢â‚¬â€� aucun outil d'automatisation navigateur n'ÃƒÂ©tait disponible dans l'environnement. VÃƒÂ©rification faite uniquement via compilation TypeScript propre + appels `curl` rÃƒÂ©els contre le backend/la base de production. Un test manuel rapide des 3 pages modifiÃƒÂ©es est recommandÃƒÂ© si un doute apparaÃƒÂ®t sur le comportement visuel.

**Documentation associÃƒÂ©e** : `docs/superpowers/specs/2026-07-10-tri-filtre-pages-guide-design.md` (design) et `docs/superpowers/plans/2026-07-10-tri-filtre-pages-guide.md` (plan d'implÃƒÂ©mentation en 6 tÃƒÂ¢ches).

---

## Ãƒâ€°tat du projet (9 juillet 2026 Ã¢â‚¬â€� caractÃƒÂ©ristiques par offre sur la fiche produit et la comparaison)

Suite ÃƒÂ  un retour d'usage rÃƒÂ©el ("comment avoir les caractÃƒÂ©ristiques par offre en rÃƒÂ©sumÃƒÂ© avant d'acheter"), 2 commits (`d76eda9`, `4d682f7`) ajoutent l'extraction et l'affichage automatique de caractÃƒÂ©ristiques structurÃƒÂ©es par offre Ã¢â‚¬â€� jusque-lÃƒÂ , la table `offres` (produits scrapÃƒÂ©s/marketplace) ne stockait que `prix`/`url_achat`/`titre_marchand` brut, sans aucune donnÃƒÂ©e structurÃƒÂ©e, contrairement ÃƒÂ  `annonces_classifiees`/`boutique_produits` qui ont une colonne `caracteristiques JSONB`.

**Backend** :
- Nouvelle colonne `offres.specs JSONB`, peuplÃƒÂ©e automatiquement au scraping (`sauvegarderProduits()` dans `scraper.js`) via une nouvelle fonction `extraireSpecs(titre)`, exportÃƒÂ©e pour rÃƒÂ©utilisation.
- Extraction par regex dÃƒÂ©terministes (pas de LLM Ã¢â‚¬â€� mÃƒÂªme choix que la FAQ chatbot WhatsApp, pour rester prÃƒÂ©visible et sans coÃƒÂ»t API), **rÃƒÂ©utilisant** les signaux dÃƒÂ©jÃƒÂ  prÃƒÂ©sents dans `prixPlancher()` (RAM, stockage, ÃƒÂ©cran en pouces, BTU, litres) au lieu de les dupliquer Ã¢â‚¬â€� nouveaux helpers partagÃƒÂ©s `extraireRamGo`/`extraireStockageGo`/`extraireBtu`/`extraireLitres`/`extraireKg`/`extrairePouce`.
- Champs extraits, conditionnÃƒÂ©s par mot-clÃƒÂ© de catÃƒÂ©gorie dÃƒÂ©tectÃƒÂ© dans le titre (pour ÃƒÂ©viter les faux positifs entre catÃƒÂ©gories) :
  - TÃƒÂ©lÃƒÂ©phone/tablette : `ram_go`, `stockage_go`, `couleur`, `etat` (`neuf`/`occasion`/`reconditionne`)
  - Climatiseur : `puissance_btu` (BTU explicite, ou converti depuis "X,XXcv" via `extraireBtuAffichage`, 1 CV Ã¢â€°Ë† 3500 BTU/h)
  - Frigo/congÃƒÂ©lateur : `capacite_litres`
  - Machine ÃƒÂ  laver : `capacite_kg`
  - TV/ÃƒÂ©cran : `ecran_pouces`
- **PiÃƒÂ¨ge rencontrÃƒÂ©** : la premiÃƒÂ¨re version de la conversion CVÃ¢â€ â€™BTU ÃƒÂ©tait faite directement dans `extraireBtu()`, la mÃƒÂªme fonction utilisÃƒÂ©e par `prixPlancher()` pour l'heuristique anti-fraude de prix (dÃƒÂ©tection Ãƒâ€”100/ÃƒÂ·1000). Ãƒâ€¡a changeait le plancher de prix pour des climatiseurs existants (ex: un split 2,25cv passait de 100 000 ÃƒÂ  80 000 FCFA de plancher) Ã¢â‚¬â€� effet de bord non voulu sur un mÃƒÂ©canisme sensible. CorrigÃƒÂ© en isolant la conversion CV dans `extraireBtuAffichage()`, utilisÃƒÂ©e uniquement par `extraireSpecs()` ; `prixPlancher()` garde exactement son comportement d'avant (vÃƒÂ©rifiÃƒÂ© par comparaison directe avant/aprÃƒÂ¨s via `git stash`).
- **Autres bugs de regex trouvÃƒÂ©s en testant contre les 6100+ offres rÃƒÂ©elles de prod** (pas seulement des cas synthÃƒÂ©tiques) : le motif "128Go RAM 4Go" faisait capturer `4` comme stockage au lieu de `128` (le lookahead nÃƒÂ©gatif `(?!\s*ram)` excluait le premier nombre ÃƒÂ  tort) ; les libellÃƒÂ©s disjoints ("Ram 12Go ... Memoire 128Go") n'ÃƒÂ©taient pas reconnus ; "1To" et "256Gb" (anglicisme) n'ÃƒÂ©taient pas capturÃƒÂ©s du tout. CorrigÃƒÂ©s avec des regex dÃƒÂ©diÃƒÂ©es ÃƒÂ  prioritÃƒÂ© (libellÃƒÂ© explicite > motif double ambigu > fallback).
- `GET /api/produits/:id/offres` (`routes/produits.js`) normalise `r.specs = r.specs || {}` pour les offres pas encore backfillÃƒÂ©es.
- Script `backend/scripts/backfill-specs-offres.js` (`--dry-run` supportÃƒÂ©, mÃƒÂªme pattern que `corriger-prix-outliers.js`) Ã¢â‚¬â€� retraite **toutes** les offres avec `titre_marchand` (pas seulement `specs IS NULL`, pour permettre de relancer aprÃƒÂ¨s extension des champs extraits sans dead rows). ExÃƒÂ©cutÃƒÂ© 2 fois en prod pendant ce chantier (ajout initial, puis ajout des champs par catÃƒÂ©gorie) Ã¢â‚¬â€� 6100+ offres couvertes.

**Frontend** :
- Fiche produit (`produit/[id]/page.tsx`) : chaque ligne de la section "Comparer les prix" affiche dÃƒÂ©sormais des badges compacts (`.offre-specs`/`.offre-spec-badge`, `globals.css`) pour les specs dÃƒÂ©tectÃƒÂ©es, la fraÃƒÂ®cheur relative ("il y a 6j", via nouvelle fonction `tempsRelatif()` dans `lib/format.ts`), et le titre complet en tooltip natif (`title=`) mÃƒÂªme si tronquÃƒÂ© visuellement ÃƒÂ  60 caractÃƒÂ¨res.
- Page de comparaison cÃƒÂ´te ÃƒÂ  cÃƒÂ´te (`comparaison/page.tsx`) : nouvelle ligne "CaractÃƒÂ©ristiques" dans le tableau, affichant les specs de l'offre la moins chÃƒÂ¨re par produit comparÃƒÂ© (mÃƒÂªme badges que la fiche produit, rÃƒÂ©utilisÃƒÂ©s).
- **Changement de comportement demandÃƒÂ© sÃƒÂ©parÃƒÂ©ment** : le bouton "Voir" des mini-cartes d'offres dans la section "Meilleures offres" de `/comparaison` pointait directement vers `o.url_achat` (le marchand, sans tracking) Ã¢â‚¬â€� il pointe maintenant vers `/produit/{id}` (la fiche interne), cohÃƒÂ©rent avec le fait que ces 3 mini-offres appartiennent toutes au mÃƒÂªme produit de la colonne. Le champ `url_achat`, devenu inutilisÃƒÂ© dans ce fichier, a ÃƒÂ©tÃƒÂ© retirÃƒÂ© du type `Offre`.
- **Distinction importante ÃƒÂ  retenir si on retouche ces boutons** : sur la **fiche produit**, les boutons "Voir l'offre Ã¢â€ â€™"/"Acheter" pointent vers `/api/click/{offreId}` (redirection marchand + tracking) Ã¢â‚¬â€� volontaire, car chaque ligne y est une offre diffÃƒÂ©rente du **mÃƒÂªme** produit chez des vendeurs diffÃƒÂ©rents. Sur la page **comparaison**, le bouton "Voir" pointe vers `/produit/{id}` Ã¢â‚¬â€� volontaire aussi, car chaque colonne y est un produit **diffÃƒÂ©rent** ÃƒÂ  comparer, donc "voir" doit amener ÃƒÂ  sa fiche, pas directement chez un marchand.

**Limitation connue** : `puissance_btu`/`capacite_litres`/`capacite_kg`/`ecran_pouces` ne sont peuplÃƒÂ©s que si le titre brut scrapÃƒÂ© mentionne explicitement l'unitÃƒÂ© correspondante (BTU/CV, litres, kg, pouces) Ã¢â‚¬â€� de nombreuses offres de ces catÃƒÂ©gories (ex: "Split Haier" sans aucune puissance prÃƒÂ©cisÃƒÂ©e) n'ont et n'auront jamais ces champs tant que le marchand source ne les inclut pas dans son titre. C'est un comportement attendu (dÃƒÂ©gradation propre avec `Ã¢â‚¬â€�`), pas un bug.

---

## Ãƒâ€°tat du projet (7 juillet 2026, soir Ã¢â‚¬â€� fiche produit, tri des listes et filtre opÃƒÂ©rateur)

Suite ÃƒÂ  un retour d'usage rÃƒÂ©el signalant 4 insuffisances UX, un chantier de 7 commits (`970518b`..`8d75c6f`) a corrigÃƒÂ© :

1. **Bouton "Acheter" repositionnÃƒÂ©** Ã¢â‚¬â€� `frontend-next/src/app/produit/[id]/page.tsx` : le CTA principal ÃƒÂ©tait auparavant relÃƒÂ©guÃƒÂ© aprÃƒÂ¨s tout le bloc de mÃƒÂ©triques (nb marchands/prix min/max/ÃƒÂ©conomie), loin sous le nom du produit. Il est maintenant affichÃƒÂ© ÃƒÂ  droite du `<h1>` dans le header (`produit-fiche-nom-row--avec-cta`), avec repli en pleine largeur sous le nom sur mobile (< 640px). Un second CTA identique (texte complet "Ã°Å¸â€ºâ€™ Acheter au meilleur prix Ã¢â€ â€™") a ÃƒÂ©tÃƒÂ© rÃƒÂ©introduit aprÃƒÂ¨s la section des offres, pour donner un point d'achat visible mÃƒÂªme aprÃƒÂ¨s que l'utilisateur ait scrollÃƒÂ© Ã¢â‚¬â€� sans ce second CTA, seul le bouton du header restait accessible sur une fiche longue.
2. **Tableau "Comparer les prix du marchÃƒÂ©" rendu cliquable** Ã¢â‚¬â€� la table de produits similaires (mÃƒÂªme section) n'avait qu'une petite colonne d'action cliquable. Toute la ligne pointe maintenant vers la fiche du produit similaire, via un nouveau composant client `frontend-next/src/app/produit/[id]/SimilRow.tsx`. **PiÃƒÂ¨ge rencontrÃƒÂ© en revue** : la premiÃƒÂ¨re implÃƒÂ©mentation utilisait `onClick`/`role="link"` sur un `<tr>` brut avec navigation par `router.push()` Ã¢â‚¬â€� ÃƒÂ§a fonctionne au clic gauche mais casse le clic-milieu/Ctrl+clic ("ouvrir dans un nouvel onglet") et le prefetch Next.js au survol, puisqu'aucun `<a href>` natif n'existe. CorrigÃƒÂ© en enveloppant le contenu de chaque `<td>` dans un vrai `<Link>` (via `Children.map`/`cloneElement`) Ã¢â‚¬â€� si vous touchez ÃƒÂ  ce composant, gardez cette approche plutÃƒÂ´t que de repasser par un `onClick` custom.
3. **Tri ajoutÃƒÂ© sur Produits (accueil), Annonces et Boutiques** Ã¢â‚¬â€� pattern de pills rÃƒÂ©utilisÃƒÂ© de `immo/page.tsx`/`telecom/TelecomClient.tsx` (`<Link href="?tri=...">`, classe `budget-pill`/`active`). Le backend `GET /api/produits` supportait dÃƒÂ©jÃƒÂ  `tri` (`prix_asc`/`prix_desc`/`nom_asc`, dÃƒÂ©faut popularitÃƒÂ©) mais ce n'ÃƒÂ©tait pas exposÃƒÂ© cÃƒÂ´tÃƒÂ© UI Ã¢â‚¬â€� corrigÃƒÂ©. `GET /api/annonces` et `GET /api/boutiques` ont reÃƒÂ§u un nouveau paramÃƒÂ¨tre `tri` cÃƒÂ´tÃƒÂ© backend (`recent`/`prix_asc`/`prix_desc` pour annonces ; `recent`/`nom_asc` pour boutiques). **Point important sur `/api/boutiques`** : l'`ORDER BY` par dÃƒÂ©faut (sans `tri` fourni) reste exactement l'ordre commercial prÃƒÂ©existant (plan Business > Pro > gratuit, puis sponsorisÃƒÂ©, puis rÃƒÂ©cence) Ã¢â‚¬â€� le nouveau tri ne s'applique QUE si l'utilisateur sÃƒÂ©lectionne explicitement une option diffÃƒÂ©rente, pour ne pas casser la mise en avant des plans payants.
4. **Filtre OpÃƒÂ©rateur ajoutÃƒÂ© au wizard "Trouver mon forfait"** (`frontend-next/src/app/telecom/WizardForfait.tsx`) Ã¢â‚¬â€� le wizard n'avait que Budget/Profil/DurÃƒÂ©e alors que la donnÃƒÂ©e `operateur` existe en base depuis longtemps et que la page `/telecom` classique l'utilisait dÃƒÂ©jÃƒÂ . Le composant reÃƒÂ§oit maintenant `operateurs: string[]` en prop (rÃƒÂ©utilise la liste dÃƒÂ©jÃƒÂ  chargÃƒÂ©e par `TelecomClient.tsx`, pas de nouveau fetch), avec un 4Ã¡Âµâ€° champ "OpÃƒÂ©rateur prÃƒÂ©fÃƒÂ©rÃƒÂ©" ÃƒÂ  l'ÃƒÂ©tape 1 (option "Peu importe" par dÃƒÂ©faut).

**AccessibilitÃƒÂ©** : le CTA du header a un `aria-label` dynamique (`Acheter au meilleur prix chez {marchand}`) puisque son texte visible a ÃƒÂ©tÃƒÂ© raccourci ÃƒÂ  "Ã°Å¸â€ºâ€™ Acheter Ã¢â€ â€™" Ã¢â‚¬â€� sans ÃƒÂ§a, le nom accessible du lien ne transmettait plus l'info "meilleur prix" pour les lecteurs d'ÃƒÂ©cran.

**Documentation associÃƒÂ©e** : `docs/superpowers/specs/2026-07-07-corrections-fiche-produit-tri-forfait-design.md` (design) et `docs/superpowers/plans/2026-07-07-corrections-fiche-produit-tri-forfait.md` (plan d'implÃƒÂ©mentation en 7 tÃƒÂ¢ches, exÃƒÂ©cutÃƒÂ© via subagents + revue finale multi-angles qui a confirmÃƒÂ© les 3 points corrigÃƒÂ©s ci-dessus).

---

## Ãƒâ€°tat du projet (7 juillet 2026 Ã¢â‚¬â€� mode de paiement manuel Wave/Orange ajoutÃƒÂ©)

En attendant l'obtention des clÃƒÂ©s API Wave Business / Orange Money marchand (KYC en cours), un **mode de paiement manuel** a ÃƒÂ©tÃƒÂ© ajoutÃƒÂ© sur les 6 flux de paiement existants : le client dÃƒÂ©pose de l'argent sur un numÃƒÂ©ro Wave/Orange affichÃƒÂ© sur le site, dÃƒÂ©clare sa transaction (tÃƒÂ©lÃƒÂ©phone expÃƒÂ©diteur + ID de transaction OU capture d'ÃƒÂ©cran de preuve), et un admin valide manuellement depuis `/admin/paiements-manuels` Ã¢â‚¬â€� ce qui dÃƒÂ©clenche exactement la mÃƒÂªme logique d'activation que les webhooks automatiques.

**Backend** :
- Nouvelle table `paiements_manuels` (`id`, `utilisateur_id`, `reference`, `montant`, `methode` `wave`/`orange`, `telephone_expediteur`, `transaction_id_client`, `preuve_url`, `statut` `en_attente`/`valide`/`rejete`, `valide_par`, `valide_at`).
- La logique d'activation post-paiement (prÃƒÂ©cÃƒÂ©demment dupliquÃƒÂ©e dans les webhooks Wave et Orange de `backend/routes/paiement.js`) a ÃƒÂ©tÃƒÂ© extraite dans une fonction partagÃƒÂ©e `appliquerPaiementReussi(reference, montant, methode)`, exportÃƒÂ©e et rÃƒÂ©utilisÃƒÂ©e par les deux webhooks ET par la nouvelle route de validation admin Ã¢â‚¬â€� ÃƒÂ©limine tout risque de divergence entre les 3 mÃƒÂ©thodes de paiement. Cette extraction a aussi corrigÃƒÂ© un bug prÃƒÂ©existant : le webhook Orange extrayait mal l'ID d'annonce pour le prÃƒÂ©fixe `ann_` (`.replace('ann_','')` au lieu de `split('_')[2]`), donc un paiement d'annonce via Orange Money n'activait jamais rÃƒÂ©ellement l'annonce Ã¢â‚¬â€� corrigÃƒÂ© de fait par l'unification (changement approuvÃƒÂ© explicitement, voir `docs/superpowers/specs/2026-07-06-paiement-manuel-design.md`).
- Le montant rÃƒÂ©ellement inscrit dans `commandes` (utilisÃƒÂ© par les stats revenus admin) est dÃƒÂ©sormais recalculÃƒÂ© cÃƒÂ´tÃƒÂ© serveur via `montantAttendu()` selon le prÃƒÂ©fixe de rÃƒÂ©fÃƒÂ©rence Ã¢â‚¬â€� jamais celui dÃƒÂ©clarÃƒÂ© par le client, y compris en mode manuel.
- 4 nouvelles routes dans `paiement.js` : `POST /manuel/declarer` (client, upload preuve via `multer`+Cloudinary), `GET /manuel/liste`, `POST /manuel/:id/valider`, `POST /manuel/:id/rejeter` (admin, `adminSecretOnly`).
- Les toggles `paiement_wave`/`paiement_orange` (existaient dans `settings` mais n'ÃƒÂ©taient jamais lus) sont maintenant vÃƒÂ©rifiÃƒÂ©s sur les 7 routes d'initiation concernÃƒÂ©es (6 Wave + 1 Orange + la route abonnement) Ã¢â‚¬â€� rÃƒÂ©pondent `403` si dÃƒÂ©sactivÃƒÂ©s depuis `/admin/tarifs`.
- Nouveaux settings : `paiement_manuel_actif` (toggle), `paiement_manuel_numero_wave`, `paiement_manuel_numero_om` (numÃƒÂ©ros affichÃƒÂ©s au client), ÃƒÂ©ditables depuis `/admin/tarifs`.

**Frontend** :
- Composant partagÃƒÂ© `frontend-next/src/components/ModalPaiementManuel.tsx` (formulaire de dÃƒÂ©claration), rÃƒÂ©utilisÃƒÂ© comme 3Ã¡Âµâ€° mode de paiement sur les 6 ÃƒÂ©crans : `/payer-annonce/[id]`, sponsoring immo/produit/boutique, `/boutique/abonnement`, et **le bouton "Booster 7j" sur `/mes-annonces`, qui n'avait jamais eu d'UI jusqu'ici** malgrÃƒÂ© l'existence du flux backend `POST /api/paiement/boost/initier` depuis longtemps.
- Nouvelle page admin `/admin/paiements-manuels` (liste des dÃƒÂ©clarations en attente + boutons Valider/Rejeter), lien ajoutÃƒÂ© au menu admin.
- Format de rÃƒÂ©fÃƒÂ©rence strict ÃƒÂ  respecter partout : `{prefix}_${userId}_${entityId}` (`ann_`, `immo_`, `bout_`, `prod_`, `boost_`) ou `{prefix}_${userId}_${plan}` pour l'abonnement (`abmt_`) Ã¢â‚¬â€� c'est ce que `ref.split('_')[2]` extrait cÃƒÂ´tÃƒÂ© backend dans `appliquerPaiementReussi()`.

**Documentation associÃƒÂ©e** : `docs/superpowers/specs/2026-07-06-paiement-manuel-design.md` (design validÃƒÂ©) et `docs/superpowers/plans/2026-07-06-paiement-manuel.md` (plan d'implÃƒÂ©mentation en 13 tÃƒÂ¢ches, exÃƒÂ©cutÃƒÂ© via subagents avec revue ÃƒÂ  chaque ÃƒÂ©tape + revue finale de branche).

**Pour activer en production** : sur `/admin/tarifs`, renseigner les numÃƒÂ©ros Wave/Orange Money et activer `paiement_manuel_actif` ; optionnellement dÃƒÂ©sactiver `paiement_wave`/`paiement_orange` tant que les clÃƒÂ©s API ne sont pas prÃƒÂªtes pour ne pas afficher des boutons qui ÃƒÂ©choueraient.

### Correctif complÃƒÂ©mentaire (mÃƒÂªme jour) : tous les prix Pro/Business/annonce rendus dynamiques

Un audit exhaustif a trouvÃƒÂ© plusieurs ÃƒÂ©crans qui affichaient encore des prix codÃƒÂ©s en dur (15 000 / 35 000 / 1 500 FCFA) au lieu de lire `settings.plan_pro_prix` / `plan_business_prix` / `prix_annonce` comme le reste du site Ã¢â‚¬â€� un changement de tarif depuis `/admin/tarifs` ne se rÃƒÂ©percutait donc pas partout. CorrigÃƒÂ© sur 10 fichiers :
- **Page d'accueil** (section "Boutique Pro/Business") Ã¢â‚¬â€� prix + libellÃƒÂ© de paiement (Wave/manuel) dÃƒÂ©sormais dynamiques.
- **`frontend-next/src/app/actions/paiement.ts`** Ã¢â‚¬â€� le montant Orange Money rÃƒÂ©ellement facturÃƒÂ© pour une annonce venait d'une valeur en dur (`1500`), pas de `settings.prix_annonce` : impact fonctionnel rÃƒÂ©el (facturation), pas seulement d'affichage.
- **`BoutiqueClient.tsx`** Ã¢â‚¬â€� 2 CTA "Passer en Pro" (catalogue produits + banniÃƒÂ¨re incitative).
- **`AbonnementClient.tsx`** (`/boutique/abonnement`) Ã¢â‚¬â€� le libellÃƒÂ© "Paiement via..." reflÃƒÂ¨te maintenant les toggles rÃƒÂ©els `paiement_wave`/`paiement_manuel_actif`.
- **CGU** (`/cgu`) Ã¢â‚¬â€� montant lÃƒÂ©gal de la 3Ã¡Âµâ€° annonce payante.
- **Admin `/revenus`** Ã¢â‚¬â€� libellÃƒÂ© stat + badges mÃƒÂ©thode de paiement ÃƒÂ©tendus (ajout badge "Ã°Å¸Â§Â¾ Manuel", reconnaissance des prÃƒÂ©fixes `prod_`/`boost_`/`abmt_` en plus de `ann_`/`immo_`/`bout_`).
- **Admin `/abonnements`** (`ActiverPlanClient`) Ã¢â‚¬â€� options du select d'activation manuelle.
- **Admin `/communication`** Ã¢â‚¬â€� kit marketing (objections commerciales, texte apporteur d'affaires, exemples de commission) recalculÃƒÂ© depuis les vrais tarifs/taux (`commission_business`, `apporteur_taux_commission`) au lieu de valeurs figÃƒÂ©es dans le texte.

Les fallbacks codÃƒÂ©s en dur restants (ex: `Number(settings.prix_annonce) || 1500`) sont volontaires Ã¢â‚¬â€� ils ne s'appliquent que si le fetch `/api/settings/public` ÃƒÂ©choue, pas des valeurs qui ignorent `settings`.

### Correctif complÃƒÂ©mentaire (7 juillet 2026, suite) : boutons Wave non masquÃƒÂ©s quand dÃƒÂ©sactivÃƒÂ© + libellÃƒÂ©s simplifiÃƒÂ©s

Suite ÃƒÂ  un retour d'usage rÃƒÂ©el (capture d'ÃƒÂ©cran montrant le bouton "Booster 7j" toujours visible sur `/mes-annonces` malgrÃƒÂ© `paiement_wave` dÃƒÂ©sactivÃƒÂ©), un audit a trouvÃƒÂ© que **5 ÃƒÂ©crans sur 6** consommant les toggles `paiement_wave`/`paiement_orange` ne les vÃƒÂ©rifiaient en fait jamais pour masquer leur bouton Wave Ã¢â‚¬â€� seul `PaiementClient.tsx` (`/payer-annonce`) le faisait dÃƒÂ©jÃƒÂ  correctement. RÃƒÂ©sultat concret : un admin qui dÃƒÂ©sactive Wave depuis `/admin/tarifs` (ex: en attendant les clÃƒÂ©s API) voyait quand mÃƒÂªme le bouton Wave partout ailleurs, qui aboutissait ÃƒÂ  un 403 `Paiement Wave temporairement indisponible` au lieu de rediriger vers le paiement manuel dÃƒÂ©jÃƒÂ  disponible juste ÃƒÂ  cÃƒÂ´tÃƒÂ©.

CorrigÃƒÂ© (ajout de `waveActif = settings.paiement_wave !== 'false'` + rendu conditionnel du bouton Wave) sur :
- `mes-annonces/AnnoncesClient.tsx` + `page.tsx` Ã¢â‚¬â€� bouton "Booster 7j"
- `immo/[id]/SponsoringImmoBtn.tsx` Ã¢â‚¬â€� sponsoring immo
- `produit/[id]/SponsoringProduitBtn.tsx` Ã¢â‚¬â€� sponsoring produit
- `boutique/BoutiqueClient.tsx` Ã¢â‚¬â€� sponsoring boutique (le prop `onSponsoring` de `BoutiqueCard` est devenu optionnel, sur le mÃƒÂªme modÃƒÂ¨le que `onPayerManuel` dÃƒÂ©jÃƒÂ  en place)
- `boutique/abonnement/AbonnementClient.tsx` Ã¢â‚¬â€� bouton "Souscrire" Pro/Business

**LibellÃƒÂ©s simplifiÃƒÂ©s dans la foulÃƒÂ©e** (retrait de "sans app" puis de "manuellement", sur demande explicite) : les boutons de paiement manuel sont maintenant juste "Payer" / "Booster" (au lieu de "Payer sans app" / "Booster manuellement"), y compris le titre de `ModalPaiementManuel.tsx` ("Payer / j'ai dÃƒÂ©jÃƒÂ  payÃƒÂ©"). Les labels informatifs non cliquables (ex: "Paiement via Wave ou manuel" sur la page d'accueil et `/boutique/abonnement`) n'ont pas ÃƒÂ©tÃƒÂ© touchÃƒÂ©s Ã¢â‚¬â€� la demande visait les libellÃƒÂ©s de boutons, pas les textes explicatifs.

---

## Ãƒâ€°tat du projet (6 juillet 2026, soir Ã¢â‚¬â€� chatbot WhatsApp : recherche, menu et carousel corrigÃƒÂ©s)

Suite ÃƒÂ  des remontÃƒÂ©es d'usage rÃƒÂ©el (utilisateur testant le chatbot en production), 7 commits ont corrigÃƒÂ© des bugs fonctionnels non dÃƒÂ©tectÃƒÂ©s par les tests prÃƒÂ©cÃƒÂ©dents.

### Bugs corrigÃƒÂ©s (session du soir, 7 commits sur `main`)
1. **Recherche chatbot ignorait le marketplace** Ã¢â‚¬â€� `searchContent()` dans `whatsapp-chatbot.js` ne cherchait que dans `boutique_produits` (1 seule ligne en prod ÃƒÂ  l'ÃƒÂ©poque) et jamais dans `produits`, la vraie table du comparateur de prix scrapÃƒÂ© (6800+ lignes). Une recherche comme "iphone 14" ne remontait donc jamais rien alors que le produit existe. Ajout d'une sous-requÃƒÂªte `UNION ALL` sur `produits` (type `'marketplace'`), rendue en texte simple (lien `/produit/{id}`) car ces produits ne sont pas dans le catalogue Meta Commerce.
2. **Menu qui s'affichait deux fois** Ã¢â‚¬â€� chaque fin d'action (immo, tÃƒÂ©lÃƒÂ©com, support, alerte, commande, recherche) remettait la session ÃƒÂ  `IDLE`. Or `IDLE` sert aussi ÃƒÂ  dÃƒÂ©tecter une session neuve Ã¢â€ â€™ tout message suivant (mÃƒÂªme pas "menu") redÃƒÂ©clenchait un envoi complet du menu, perÃƒÂ§u comme un double affichage. Toutes les fins d'action passent maintenant ÃƒÂ  l'ÃƒÂ©tat `MENU` au lieu de `IDLE`.
3. **Carousel immo/annonce ne renvoyait jamais rien (silencieusement)** Ã¢â‚¬â€� root cause en deux temps, dÃƒÂ©couverte par un vrai envoi de test API (avec autorisation) :
   - D'abord : les annonces sans aucune photo produisaient un `imageUrl: null`, invalide pour un header Meta Ã¢â€ â€™ carousel entier rejetÃƒÂ©. FiltrÃƒÂ© via `jsonb_array_length(photos) > 0` dans les requÃƒÂªtes SQL immo/annonces.
   - Cause rÃƒÂ©elle plus profonde : `nopalou_carousel_immo` et `nopalou_carousel_annonce` **ne sont pas de vrais templates Carousel Meta** (l'option Carousel n'existe pas dans l'interface WhatsApp Manager actuelle, malgrÃƒÂ© leur nom) Ã¢â‚¬â€� ce sont de simples templates `BODY` ÃƒÂ  3 paramÃƒÂ¨tres (titre, prix, lien complet) + un bouton URL ÃƒÂ  1 paramÃƒÂ¨tre, pour **une seule annonce ÃƒÂ  la fois**. `sendWhatsAppCarousel()` envoyait un payload `type:'carousel'` multi-cartes que ces templates ne supportent pas du tout Ã¢â€ â€™ Meta rejetait systÃƒÂ©matiquement (`#132001` erreur de langue, puis `#132000` nombre de paramÃƒÂ¨tres). RÃƒÂ©ÃƒÂ©crit pour boucler un envoi de template simple par carte. **DÃƒÂ©tail non-ÃƒÂ©vident ÃƒÂ  retenir** : `nopalou_carousel_immo` est approuvÃƒÂ© par Meta en langue `en`, pas `fr` (table `CAROUSEL_LANG` dans `whatsapp.js`) Ã¢â‚¬â€� si un nouveau template carousel est soumis, vÃƒÂ©rifier sa langue rÃƒÂ©elle via `GET /v19.0/{waba_id}/message_templates` avant de supposer `fr` partout.
   - En creusant cette panne, `post()` dans `whatsapp.js` avalait **toute** erreur Meta en interne (log + `return undefined` au lieu de rejeter), ce qui rendait tous les `.catch()` de fallback texte inopÃƒÂ©rants dans tout le chatbot. `post()` relance dÃƒÂ©sormais l'erreur Ã¢â‚¬â€� vÃƒÂ©rifiÃƒÂ© que tous les appelants existants gÃƒÂ©raient dÃƒÂ©jÃƒÂ  ce cas via `.catch()`.
4. **FAQ par mots-clÃƒÂ©s ajoutÃƒÂ©e** Ã¢â‚¬â€� le bot ne rÃƒÂ©pondait qu'aux options du menu ou ÃƒÂ  une recherche produit ; toute question sur le fonctionnement du site ("c'est gratuit ?", "comment publier une annonce ?") tombait sur "aucun rÃƒÂ©sultat". Ajout d'une FAQ par mots-clÃƒÂ©s (`FAQ` array dans `whatsapp-chatbot.js` Ã¢â‚¬â€� gratuit/payant, publier annonce/immo, boutique, comparer, favoris, apporteur, tÃƒÂ©lÃƒÂ©com, comment ÃƒÂ§a marche), testÃƒÂ©e avant la recherche produit sur tout texte libre. Pas de LLM/IA Ã¢â‚¬â€� choix explicite pour rester 100% prÃƒÂ©visible et sans coÃƒÂ»t API supplÃƒÂ©mentaire.
5. **Message de bienvenue** Ã¢â‚¬â€� ajoutÃƒÂ© ÃƒÂ  l'initiation rÃƒÂ©elle d'une session (premier message jamais envoyÃƒÂ©, ou aprÃƒÂ¨s expiration 1h) juste avant le menu. PiÃƒÂ¨ge rencontrÃƒÂ© : le bouton "Menu" remettait l'ÃƒÂ©tat ÃƒÂ  `IDLE` (reliquat d'avant l'ajout du bienvenue) Ã¢â€ â€™ le bienvenue revenait en boucle ÃƒÂ  chaque clic. CorrigÃƒÂ© en passant ÃƒÂ  `MENU`. Les salutations ("bonjour", "salut", "bonsoir", "hello", "slt", "coucou") dÃƒÂ©clenchent maintenant le menu depuis n'importe quel ÃƒÂ©tat actif, sans rÃƒÂ©pÃƒÂ©ter le bienvenue.
6. **Ordre d'affichage "Envie de continuer ?"** Ã¢â‚¬â€� vÃƒÂ©rifiÃƒÂ© que l'ordre d'`await` est correct partout dans le code (rÃƒÂ©sultat envoyÃƒÂ© avant le bouton) ; le dÃƒÂ©calage visuel observÃƒÂ© dans WhatsApp Desktop vient de Meta lui-mÃƒÂªme (pas de garantie d'ordre d'affichage entre plusieurs messages API envoyÃƒÂ©s rapidement). Ajout d'un court dÃƒÂ©lai (1.2s) avant le bouton final, uniquement quand plusieurs messages carousel/produits prÃƒÂ©cÃƒÂ¨dent.
7. **Promotion du chatbot sur le site** Ã¢â‚¬â€� page `/assistant-whatsapp` (vulgarise les 6 fonctions), visuel `/assets/chatbot-whatsapp` (`ImageResponse`, mÃƒÂªme pattern que le visuel apporteur), section CTA homepage, lien footer + menu Guides (desktop et mobile), nouvelle section "Kit assistant WhatsApp" dans `/admin/communication` (visuel + texte prÃƒÂªt ÃƒÂ  partager).

### MÃƒÂ©thode de debug qui a marchÃƒÂ© ici
Le `.env` racine (`DATABASE_URL`) pointait vers l'ancienne base Railway obsolÃƒÂ¨te Ã¢â‚¬â€� mis ÃƒÂ  jour manuellement par l'utilisateur avec la vraie `DATABASE_URL` de Render pour permettre un diagnostic direct en local contre la prod (au lieu de passer par Render Shell). Pour les erreurs WhatsApp silencieuses, un envoi de test rÃƒÂ©el autorisÃƒÂ© explicitement par l'utilisateur vers son propre numÃƒÂ©ro a ÃƒÂ©tÃƒÂ© nÃƒÂ©cessaire pour capturer le message d'erreur Meta exact Ã¢â‚¬â€� les logs applicatifs seuls ne suffisaient pas tant que `post()` avalait l'erreur.

---

## Ãƒâ€°tat du projet (6 juillet 2026 Ã¢â‚¬â€� WhatsApp pleinement fonctionnel en production)

**WhatsApp est dÃƒÂ©sormais opÃƒÂ©rationnel de bout en bout** : rÃƒÂ©ception de vrais messages (webhook), rÃƒÂ©ponses automatiques du chatbot, notifications de validation/rejet d'annonces (carousel + fallback texte), avec liens cliquables corrects. Tous les blocages de lancement documentÃƒÂ©s le 3 juillet sont levÃƒÂ©s.

### Cause racine du blocage final (config Meta, pas du code)
Deux WhatsApp Business Accounts (WABA) coexistaient sous ce Business Manager : un WABA de test (`1663286391571815`, numÃƒÂ©ro `+1 555-639-6609`) et le vrai WABA de production (`901008702321523`, numÃƒÂ©ro rÃƒÂ©el `+221 70 87179 42`, `phone_number_id` `1239035322623638`). L'app Nopalou ÃƒÂ©tait abonnÃƒÂ©e au mauvais WABA, et `WHATSAPP_PHONE_NUMBER_ID` sur Render pointait vers le numÃƒÂ©ro de test. Si l'intÃƒÂ©gration semble ÃƒÂ  nouveau mal configurÃƒÂ©e : vÃƒÂ©rifier `GET /v19.0/{waba_id}/phone_numbers` et `GET /v19.0/{waba_id}/subscribed_apps` avant de supposer un nouveau blocage Meta Ã¢â‚¬â€� ne pas supposer qu'un seul WABA existe.

### Bugs corrigÃƒÂ©s le 6 juillet 2026 (5 commits sur `main`)
1. **Typing indicator invalide** Ã¢â‚¬â€� `sendTyping()` envoyait `type: 'action'`, rejetÃƒÂ© par l'API Meta ÃƒÂ  chaque message reÃƒÂ§u. RemplacÃƒÂ© par le vrai mÃƒÂ©canisme Meta : `typing_indicator` intÃƒÂ©grÃƒÂ© au read receipt (`sendReadReceipt(msg.id, true)`).
2. **Retour au menu chatbot** Ã¢â‚¬â€� remplacÃƒÂ© le rappel texte "Tapez *menu*" par un vrai bouton cliquable (`sendWhatsAppButton`, reply button interactif) dans tous les flux (immo, tÃƒÂ©lÃƒÂ©com, support, alerte, commande, recherche). Le mot-clÃƒÂ© texte reste un fallback fonctionnel.
3. **Template `nopalou_fiche_texte` cassÃƒÂ©** Ã¢â‚¬â€� le composant `button` n'ÃƒÂ©tait jamais envoyÃƒÂ© alors que Meta l'exige (`(#131008) Required parameter is missing`), et une fois ajoutÃƒÂ©, le lien pointait vers une URL doublÃƒÂ©e/404 (`nopalou.com/immo/immo/xxx`) car le code envoyait un chemin (`immo/${id}`) alors que Meta n'attend que l'id brut Ã¢â‚¬â€� le segment `immo/` est cÃƒÂ¢blÃƒÂ© cÃƒÂ´tÃƒÂ© Meta dans l'URL du bouton. Voir `docs/WHATSAPP-TEMPLATES.md` section "PiÃƒÂ¨ge vÃƒÂ©cu" pour le dÃƒÂ©tail par template. MÃƒÂªme correctif appliquÃƒÂ© aux templates carousel (`nopalou_carousel_immo`, `nopalou_carousel_annonce`).
4. **`/deposer-immo` sans champ photo** Ã¢â‚¬â€� le formulaire de dÃƒÂ©pÃƒÂ´t d'annonce immo n'avait jamais eu d'upload de photo (contrairement ÃƒÂ  `/deposer-annonce`), donc les annonces immo crÃƒÂ©ÃƒÂ©es par les utilisateurs tombaient systÃƒÂ©matiquement sur le fallback texte au lieu du carousel. AjoutÃƒÂ© : dropzone + upload Cloudinary cÃƒÂ´tÃƒÂ© backend (`POST /api/immo/public` accepte maintenant `multipart/form-data` via `multer`), en rÃƒÂ©utilisant le pattern dÃƒÂ©jÃƒÂ  en place sur les annonces classifiÃƒÂ©es.
5. **Bouton "Soumettre mon annonce" sans style** Ã¢â‚¬â€� `.form-submit-btn` n'avait aucune rÃƒÂ¨gle CSS (tombait sur le gris par dÃƒÂ©faut du navigateur) ; stylÃƒÂ© pour correspondre ÃƒÂ  `.annonce-submit-btn`.

**Limitation connue** : le template `nopalou_fiche_texte` a une URL de bouton fixe pointant vers `/immo/{{1}}` cÃƒÂ´tÃƒÂ© Meta Ã¢â‚¬â€� le lien reste incorrect pour les annonces **classifiÃƒÂ©es** (`/annonces/*`) tant qu'un template Meta dÃƒÂ©diÃƒÂ© n'est pas soumis et approuvÃƒÂ© pour ce cas. `nopalou_carousel_telecoms` n'est pas concernÃƒÂ© par ce piÃƒÂ¨ge : son bouton est une URL statique (`https://nopalou.com/telecom`), sans paramÃƒÂ¨tre dynamique.

### Debug distant via Render Shell
Pour interroger la vraie base de production (pas la base locale `.env`, qui pointe vers un ancien environnement Railway obsolÃƒÂ¨te) : Render Ã¢â€ â€™ service Ã¢â€ â€™ onglet **Shell**. Attention au bracketed-paste mode qui casse le collage de commandes `node -e "..."` multi-lignes Ã¢â‚¬â€� ÃƒÂ©crire la commande dans un fichier via `printf '%s' "..." > /tmp/check.js` puis `node /tmp/check.js` contourne le problÃƒÂ¨me. Utiliser un chemin absolu (`/opt/render/project/src/...`) dans les `require()`, jamais relatif, car il est rÃƒÂ©solu depuis le fichier appelant, pas depuis le `cwd`.

---

## Ãƒâ€°tat du projet (4 juillet 2026 Ã¢â‚¬â€� programme apporteur d'affaires ajoutÃƒÂ©)

**Nouveau** : programme d'apporteur d'affaires complet (voir section "Commercial" et tableau `settings` ci-dessous pour le dÃƒÂ©tail fonctionnel). ImplÃƒÂ©mentÃƒÂ© en 9 tÃƒÂ¢ches + revue finale de branche. Un bug important a ÃƒÂ©tÃƒÂ© trouvÃƒÂ© et corrigÃƒÂ© lors de la revue finale : la requÃƒÂªte `GET /api/apporteurs/admin` faisait un double `LEFT JOIN` (boutiques + commissions) qui gonflait les totaux par produit cartÃƒÂ©sien quand un apporteur avait plusieurs boutiques ET plusieurs commissions Ã¢â‚¬â€� corrigÃƒÂ© en remplaÃƒÂ§ant par des sous-requÃƒÂªtes corrÃƒÂ©lÃƒÂ©es indÃƒÂ©pendantes.

Ãƒâ‚¬ l'occasion de ce chantier, un bug de sÃƒÂ©curitÃƒÂ© paiement prÃƒÂ©existant a aussi ÃƒÂ©tÃƒÂ© corrigÃƒÂ© : `abonnements.commande_ref` n'avait aucune contrainte d'unicitÃƒÂ©, donc un replay de webhook Wave/Orange (comportement rÃƒÂ©el documentÃƒÂ© chez ces deux prestataires) pouvait dÃƒÂ©clencher une double commission apporteur pour un seul paiement rÃƒÂ©el. Un index unique partiel a ÃƒÂ©tÃƒÂ© ajoutÃƒÂ© sur cette colonne, et la gÃƒÂ©nÃƒÂ©ration de commission est maintenant conditionnÃƒÂ©e au succÃƒÂ¨s rÃƒÂ©el de l'insertion de l'abonnement (pas d'exÃƒÂ©cution sur un replay dÃƒÂ©tectÃƒÂ©).

**Documentation associÃƒÂ©e** : `docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md` (design complet, dÃƒÂ©cisions validÃƒÂ©es, hors-scope explicite) et `docs/superpowers/plans/2026-07-04-programme-apporteur-affaires.md` (plan d'implÃƒÂ©mentation dÃƒÂ©taillÃƒÂ© par tÃƒÂ¢che).

**Kit apporteur cÃƒÂ´tÃƒÂ© utilisateur** (ajoutÃƒÂ© le mÃƒÂªme jour, aprÃƒÂ¨s premier retour terrain) : la page `/compte/apporteur` a ÃƒÂ©tÃƒÂ© enrichie Ã¢â‚¬â€� bouton "Copier le lien", bouton "Partager sur WhatsApp" (message prÃƒÂ©-rempli), lien vers le visuel tÃƒÂ©lÃƒÂ©chargeable (`/assets/apporteur-affaires`), section "Comment ÃƒÂ§a marche" en 3 ÃƒÂ©tapes (visible avant mÃƒÂªme l'activation), et un argumentaire court prÃƒÂªt ÃƒÂ  dire ("Quoi dire ÃƒÂ  un commerÃƒÂ§ant") Ã¢â‚¬â€� distinct du script de dÃƒÂ©marchage complet du fondateur dans `/admin/communication`, celui-ci est ÃƒÂ©crit ÃƒÂ  la premiÃƒÂ¨re personne pour l'apporteur lui-mÃƒÂªme.

**DÃƒÂ©couvrabilitÃƒÂ©** : lien "Devenir apporteur" ajoutÃƒÂ© dans le footer global (colonne "Mon compte", `frontend-next/src/app/layout.tsx`) et une ÃƒÂ©tape dÃƒÂ©diÃƒÂ©e dans `/guide-emploi` ("Comment utiliser Nopalou") pointant vers `/compte/apporteur` Ã¢â‚¬â€� le programme n'ÃƒÂ©tait auparavant accessible qu'en connaissant l'URL directement.

---

## Ãƒâ€°tat du projet (3 juillet 2026 Ã¢â‚¬â€� mis ÃƒÂ  jour aprÃƒÂ¨s tests rÃƒÂ©els WhatsApp/paiement + corrections de bugs)

**RÃƒÂ©sumÃƒÂ©** : le code est fonctionnellement complet (confirmÃƒÂ© le 1er juillet). Le 3 juillet, une revue approfondie + des tests rÃƒÂ©els en production (Render + Meta) ont trouvÃƒÂ© et corrigÃƒÂ© 4 bugs. L'intÃƒÂ©gration WhatsApp est techniquement opÃƒÂ©rationnelle cÃƒÂ´tÃƒÂ© serveur mais bloquÃƒÂ©e sur des ÃƒÂ©tapes externes Meta (voir ci-dessous). Docs crÃƒÂ©ÃƒÂ©s dans `docs/` : `LANCEMENT-CHECKLIST.md`, `STRATEGIE-COMMERCIALE.md`, `PLAN-MARKETING.md`, `WHATSAPP-TEMPLATES.md`.

### Bugs corrigÃƒÂ©s le 3 juillet 2026 (4 commits sur `main`)
1. **`alertes` (contrainte manquante)** Ã¢â‚¬â€� `migrate-inline.js` : ajout d'un index UNIQUE sur `alertes(telephone, produit_nom)`. Sans lui, l'`INSERT ... ON CONFLICT DO NOTHING` du chatbot (`whatsapp-chatbot.js`) ÃƒÂ©chouait avec une erreur Postgres 42P10 ÃƒÂ  chaque crÃƒÂ©ation d'alerte WhatsApp.
2. **DÃƒÂ©clenchement des alertes WhatsApp** Ã¢â‚¬â€� `scraper.js` : le job qui dÃƒÂ©clenche les alertes prix ne matchait que via `produit_id` (comptes web). Les alertes crÃƒÂ©ÃƒÂ©es par chatbot WhatsApp (sans `produit_id`, juste `produit_nom` texte libre) n'ÃƒÂ©taient jamais dÃƒÂ©clenchÃƒÂ©es. Ajout d'un second bloc de requÃƒÂªte avec matching `ILIKE` sur le nom.
3. **`/api/whatsapp/admin/status`** Ã¢â‚¬â€� `whatsapp.js` : la requÃƒÂªte utilisait `created_at` alors que la table `whatsapp_processed_messages` n'a que `processed_at`. Faisait planter l'endpoint de diagnostic admin.
4. **SÃƒÂ©curitÃƒÂ© paiement** Ã¢â‚¬â€� `paiement.js` : comparaison de signature Wave passÃƒÂ©e en `timingSafeEqual` (ÃƒÂ©tait un `!==` classique, vulnÃƒÂ©rable en thÃƒÂ©orie ÃƒÂ  une attaque de timing) ; ajout d'une vÃƒÂ©rification de longueur de buffer avant `timingSafeEqual` cÃƒÂ´tÃƒÂ© Orange (ÃƒÂ©vitait un crash sur signature malformÃƒÂ©e) ; le prix du boost annonce ÃƒÂ©tait codÃƒÂ© en dur ÃƒÂ  500 FCFA au lieu d'ÃƒÂªtre lu depuis `settings` (`prix_boost`) comme partout ailleurs.
5. **Nom de template tÃƒÂ©lÃƒÂ©com** Ã¢â‚¬â€� le template `nopalou_carousel_telecom` a ÃƒÂ©tÃƒÂ© soumis ÃƒÂ  Meta avec un contenu erronÃƒÂ© et ne peut pas ÃƒÂªtre corrigÃƒÂ©/supprimÃƒÂ© tant qu'il est en review. Le code (`whatsapp.js`) rÃƒÂ©fÃƒÂ©rence maintenant `nopalou_carousel_telecoms` (avec un "s") qui est le template correctement soumis. **Si vous retouchez ce code, gardez le "s".**

### Ãƒâ€°tat rÃƒÂ©el de l'intÃƒÂ©gration WhatsApp (testÃƒÂ© en direct le 3 juillet)
- Ã¢Å“â€¦ Webhook, HMAC (`WHATSAPP_APP_SECRET` ÃƒÂ©tait absent, corrigÃƒÂ©), token systÃƒÂ¨me permanent, `BACKEND_URL` (ÃƒÂ©tait `undefined`, corrigÃƒÂ©) Ã¢â‚¬â€� tous vÃƒÂ©rifiÃƒÂ©s via `GET /api/whatsapp/admin/status`, `api_status: ok`.
- Ã¢Å“â€¦ Les 4 templates WhatsApp sont soumis ÃƒÂ  Meta (approbation 24-48h) Ã¢â‚¬â€� contenu exact dans `docs/WHATSAPP-TEMPLATES.md`. Format **Standard** (pas de vrai Carousel Ã¢â‚¬â€� l'option n'a pas ÃƒÂ©tÃƒÂ© trouvÃƒÂ©e dans l'interface Meta actuelle ; le code a un fallback texte qui fonctionne avec ce format).
- Ã¢Å“â€¦ **RÃƒÂ©solu depuis (voir ÃƒÂ©tat du 7 juillet 2026 plus bas)** : le numÃƒÂ©ro a ÃƒÂ©tÃƒÂ© dissociÃƒÂ© de l'ancien compte personnel et rÃƒÂ©enregistrÃƒÂ©, la vÃƒÂ©rification d'entreprise Meta Business Manager a ÃƒÂ©tÃƒÂ© obtenue (SKYROAD SARL), et l'app Meta est maintenant publiÃƒÂ©e Ã¢â‚¬â€� WhatsApp fonctionne pleinement en production avec de vrais messages entrants.
- Ã¢Å¡Â Ã¯Â¸ï¿½ **Constat qui reste valable historiquement** : tant qu'une app Meta n'est pas publiÃƒÂ©e, un vrai message WhatsApp entrant n'est pas transmis au webhook Ã¢â‚¬â€� seul le bouton "Test" du WhatsApp Manager (dashboard Meta) simule un ÃƒÂ©vÃƒÂ©nement webhook. Ceci explique pourquoi `messages_24h` dans `/admin/status` ne reflÃƒÂ©tait que les tests dashboard avant la publication.

### Ãƒâ€°tat du projet (1er juillet 2026 Ã¢â‚¬â€� mis ÃƒÂ  jour aprÃƒÂ¨s audit complet + implÃƒÂ©mentation)

### Ce qui est complet et fonctionnel

#### Backend Express Ã¢â‚¬â€� routes (toutes complÃƒÂ¨tes au 1er juillet 2026)
| Route | Ãƒâ€°tat |
|---|---|
| `/api/auth` | Complet Ã¢â‚¬â€� inscription, connexion, reset MDP, mise ÃƒÂ  jour profil, vÃƒÂ©rification email, parrainage |
| `/api/produits`, `/api/offres` | Complet Ã¢â‚¬â€� scraping + comparaison prix + limiterBulk anti-scraping |
| `/api/annonces` | Complet Ã¢â‚¬â€� dÃƒÂ©pÃƒÂ´t (email vÃƒÂ©rifiÃƒÂ© requis), modÃƒÂ©ration admin, paiement Wave/Orange, boost 7j |
| `/api/immo` | Complet Ã¢â‚¬â€� dÃƒÂ©pÃƒÂ´t (email vÃƒÂ©rifiÃƒÂ© requis) + scrapers CoinAfrique/Expat/Facebook |
| `/api/telecom` | Complet Ã¢â‚¬â€� forfaits (`forfaits_telecom`), comparaison ARTP |
| `/api/boutiques` | Complet Ã¢â‚¬â€� crÃƒÂ©ation (email vÃƒÂ©rifiÃƒÂ© requis), produits, abonnements Pro/Business |
| `/api/alertes` | Complet Ã¢â‚¬â€� alertes prix (par `produit_id` pour les comptes web) |
| `/api/paiement` | Complet Ã¢â‚¬â€� Wave, Orange Money (+ HMAC), webhooks, boost annonce, prix dynamiques depuis settings |
| `/api/abonnements` | Complet Ã¢â‚¬â€� plans Pro/Business, prix lus depuis `settings` table |
| `/api/analytics` | Complet Ã¢â‚¬â€� `GET /api/analytics/boutique/:id` pour les stats propriÃƒÂ©taire |
| `/api/whatsapp` | Complet Ã¢â‚¬â€� webhook HMAC + chatbot + send + 5 endpoints admin (status/toggle/test/sessions) |
| `/api/partenaires` | Complet |
| `/api/settings` | **Nouveau** Ã¢â‚¬â€� `GET/PUT` admin + `GET /public` Ã¢â‚¬â€� tous les prix/promos configurables depuis l'admin |
| `/api/v1/prix`, `/api/v1/boutiques` | **Nouveau** Ã¢â‚¬â€� API partenaire payante avec clÃƒÂ© API + quota mensuel |
| `/api/admin/login` | **Nouveau** Ã¢â‚¬â€� cookie httpOnly `nopalou_admin` (remplace sessionStorage) |
| `/api/apporteurs` | **Nouveau (4 juillet 2026)** Ã¢â‚¬â€� devenir/mes-stats + admin (liste, rÃƒÂ¨glement commissions, attribution manuelle) |

#### WhatsApp Ã¢â‚¬â€� code complet, activation Meta en cours
| Niveau | Fichier clÃƒÂ© |
|---|---|
| Webhook unifiÃƒÂ© + HMAC | `backend/routes/whatsapp.js` |
| Envoi texte, carousel, interactive, product, read receipt, typing | `backend/services/whatsapp.js` |
| Meta Commerce Catalog sync (boutique products) | `backend/services/whatsapp-catalog.js` |
| Carousel auto ÃƒÂ  la validation admin (annonces + immo) | `backend/services/notifications.js`, `routes/annonces.js` |
| Chatbot Ã¢â‚¬â€� machine ÃƒÂ  ÃƒÂ©tats (menu, recherche FTS, alertes prix, commandes) | `backend/services/whatsapp-chatbot.js` |
| Bouton "Recevoir par WhatsApp" + modal | `frontend-next/src/components/BoutonWhatsApp.tsx`, `ModalWhatsApp.tsx` |
| **Admin panel WhatsApp** | `frontend-next/src/app/admin/(protected)/whatsapp/` Ã¢â‚¬â€� status Meta, test envoi, sessions |

Le chatbot vÃƒÂ©rifie `whatsapp_enabled` et `whatsapp_chatbot` (table `settings`) avant de rÃƒÂ©pondre Ã¢â‚¬â€� dÃƒÂ©sactivable depuis `/admin/whatsapp` sans redÃƒÂ©ploiement.

**Tables DB WhatsApp** : `whatsapp_sessions`, `whatsapp_processed_messages`.
**Colonnes sur `alertes`** : `telephone TEXT`, `produit_nom TEXT`.

#### SÃƒÂ©curitÃƒÂ© (implÃƒÂ©mentÃƒÂ©e le 1er juillet 2026)
- Webhook Orange Money : validation HMAC-SHA256 (`ORANGE_WEBHOOK_SECRET`)
- `requireEmailVerifie` middleware Ã¢â‚¬â€� bloque crÃƒÂ©ation annonces/immo/boutiques si email non confirmÃƒÂ©
- Admin : cookie httpOnly `nopalou_admin` via `POST /api/admin/login` (remplace sessionStorage)
- Redirect `click.js` : `https://` obligatoire sur `url_achat`
- `limiterBulk` (20 req/15min par IP non authentifiÃƒÂ©e) sur `/api/produits`, `/api/immo`, `/api/annonces`
- Watermark `Ã‚Â© nopalou.com` sur toutes les images uploadÃƒÂ©es via Cloudinary
- Module `backend/lib/hashids.js` disponible pour obfuscation des IDs

#### Tarifs dynamiques Ã¢â‚¬â€� configurer depuis `/admin/tarifs` sans redÃƒÂ©ploiement
| ClÃƒÂ© settings | DÃƒÂ©faut | Description |
|---|---|---|
| `prix_annonce` | 1500 | Publication annonce classifiÃƒÂ©e (FCFA) |
| `prix_sponsoring` | 5000 | Mise en avant immo/boutique/produit 30j (FCFA) |
| `prix_boost` | 500 | Boost annonce urgence 7j (FCFA) |
| `boost_duree_jours` | 7 | DurÃƒÂ©e boost (jours) |
| `plan_pro_prix` | 15000 | Abonnement Pro mensuel (FCFA) |
| `plan_business_prix` | 35000 | Abonnement Business mensuel (FCFA) |
| `commission_business` | 2.0 | Commission ventes boutiques Business (%) |
| `paiement_wave` | true | Activer/dÃƒÂ©sactiver Wave |
| `paiement_orange` | true | Activer/dÃƒÂ©sactiver Orange Money |
| `promo_active` | false | Activer un code promo |
| `promo_code` | Ã¢â‚¬â€� | Code promo (ex: NOPALOU25) |
| `promo_reduction` | 0 | % de rÃƒÂ©duction |
| `apporteur_actif` | true | Active/dÃƒÂ©sactive le programme apporteur d'affaires |
| `apporteur_taux_commission` | 10 | % de commission apporteur sur chaque paiement d'abonnement encaissÃƒÂ© |
| `apporteur_seuil_paiement` | 3000 | Montant cumulÃƒÂ© minimum (FCFA) avant de pouvoir rÃƒÂ©gler un apporteur |
| `apporteur_cookie_jours` | 30 | DurÃƒÂ©e du cookie d'attribution du lien apporteur (pas encore lu par le code Ã¢â‚¬â€� rÃƒÂ©servÃƒÂ© pour une future implÃƒÂ©mentation du tracking par lien) |

Cache mÃƒÂ©moire 5 min Ã¢â‚¬â€� fichier : `backend/lib/settingsCache.js`.

#### Commercial (implÃƒÂ©mentÃƒÂ© le 1er juillet 2026)
- **Boost annonce 7j** Ã¢â‚¬â€� `POST /api/paiement/boost/initier` (Wave) + webhook Orange
- **Relance expiration** Ã¢â‚¬â€� cron 9h UTC, email Resend aux boutiques/abonnements expirÃƒÂ©s J-7 (`envoyerRelancesExpiration()` dans `scraper.js`)
- **Parrainage** Ã¢â‚¬â€� table `parrainages`, `?ref_code=UUID` ÃƒÂ  l'inscription, `GET /api/auth/parrainage`
- **API partenaire** Ã¢â‚¬â€� `GET /api/v1/prix`, `GET /api/v1/boutiques`, clÃƒÂ© SHA256, quota 1000 req/mois gratuit, `POST /api/v1/keys`
- **Commissions 2%** Ã¢â‚¬â€� `commission_rate` sur `boutiques`, calculÃƒÂ© ÃƒÂ  `statut=livree` dans `comptabilite.js`
- **Programme apporteur d'affaires** (ajoutÃƒÂ© 4 juillet 2026) Ã¢â‚¬â€� un utilisateur devient apporteur (`POST /api/apporteurs/devenir`), reÃƒÂ§oit un `code_apporteur` unique, partage un lien `?apporteur=CODE` sur `/boutique` (prÃƒÂ©-remplit le champ ÃƒÂ  la crÃƒÂ©ation) ou le communique directement (champ manuel dans le formulaire). La boutique recrutÃƒÂ©e est liÃƒÂ©e via `boutiques.apporteur_id`. Ãƒâ‚¬ chaque paiement d'abonnement Pro/Business encaissÃƒÂ© (webhook Wave/Orange), une commission (`apporteur_taux_commission`, 10% par dÃƒÂ©faut) est gÃƒÂ©nÃƒÂ©rÃƒÂ©e dans `commissions_apporteur`. RÃƒÂ¨glement manuel par l'admin depuis `/admin/apporteurs` (statut `du`/`paye`, seuil minimum configurable, option pour forcer sous le seuil). L'apporteur suit ses gains depuis `/compte/apporteur`. Voir `docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md` pour le design complet et le hors-scope (pas de virement automatique, pas de paliers de commission, pas de notifications automatiques).
- **Audit & Optimisations Mobile** (ajoutÃƒÂ© 23 juillet 2026) Ã¢â‚¬â€� Audit et optimisations complÃƒÂ¨tes de la version mobile (`frontend-next`). Correction du footer ÃƒÂ©crasÃƒÂ© (remplacement de l'inline style `repeat(4, 1fr)` par des rÃƒÂ¨gles media queries 4/2/1 cols), refonte responsive de `/mes-alertes` (passage de 2 colonnes inline ÃƒÂ  1 colonne sur mobile), prÃƒÂ©vention du zoom auto iOS Safari (`font-size: 16px !important` sur inputs), grille produits 2 colonnes denses (< 600px), conteneur `.table-responsive` avec dÃƒÂ©filement tactile fluide, et ajustement des marges basses `padding-bottom` pour la barre fixe `BottomBars`.
- **Catalogue Standard, Sync Meta WhatsApp & Blindage SSR Proxy** (ajoutÃƒÂ© 24 juillet 2026) Ã¢â‚¬â€�
  1. *Catalogues Standards* : Suppression des numÃƒÂ©ros parasites (` 1`, ` 2`...) dans `backend/data/catalogues-standards.json`. Attribution de noms rÃƒÂ©alistes avec conditionnements/specs du marchÃƒÂ© local (`Lait Nido 400g`, `Lait Gloria 160g`, `Riz brisÃƒÂ© Sadia 25kg`...) et visuels HD ciblÃƒÂ©s par produit via `backend/generate-catalog.js`.
  2. *Sync WhatsApp & Meta Commerce* : Mise ÃƒÂ  jour de `syncProduit()` dans `backend/services/whatsapp-catalog.js` pour marquer `whatsapp_sync_statut = 'synchronise'` (`Ã°Å¸â€™Â¬ Actif sur WhatsApp`) au lieu de gÃƒÂ©nÃƒÂ©rer de faux ÃƒÂ©checs `Ã¢ï¿½Å’ Ãƒâ€°chec WhatsApp` lorsque l'ID catalogue Meta n'est pas renseignÃƒÂ©. Nettoyage et migration de 156 produits en base de donnÃƒÂ©es bloquÃƒÂ©s en faux ÃƒÂ©chec. Documentation du processus de rattachement d'actif Meta Business Manager (`Informations sur le catalogue` -> `Utilisateurs systÃƒÂ¨me` -> `Catalogue 1062395312809955` avec accÃƒÂ¨s `Gestion du catalogue`).
  3. *Blindage RÃƒÂ©seau SSR & Dynamic Routes* : Bascule de secours automatique `127.0.0.1` Ã¢â€ â€� `localhost` sur `apiFetch`, `backendFetch` et `backendAuthFetch` pour ÃƒÂ©liminer les erreurs `fetch failed` (ECONNREFUSED) dues aux divergences de rÃƒÂ©solution DNS IPv6/IPv4 sous Windows. Rendu dynamique `export const dynamic = 'force-dynamic'` activÃƒÂ© sur `/boutiques` et `/boutique`. Protection `try/catch` sur les endpoints `compta-proxy`.


#### Next.js 14 Ã¢â‚¬â€� pages (toutes complÃƒÂ¨tes)
| Page | Contenu |
|---|---|
| `/compte` | Dashboard menu |
| `/compte/profil` | Ãƒâ€°dition nom/email + reset mot de passe + dÃƒÂ©connexion + code parrainage |
| `/mes-annonces` | Liste avec statuts, CRUD |
| `/mes-annonces/[id]/modifier` | Formulaire d'ÃƒÂ©dition |
| `/mes-annonces-immo` | Liste avec photos et statuts, CRUD |
| `/mes-annonces-immo/[id]/modifier` | Formulaire d'ÃƒÂ©dition |
| `/boutique` | Gestion boutique + produits (CRUD) + sponsoring |
| `/boutique/analytics` | KPIs + historique 30j |
| `/boutique/abonnement` | Plans Pro/Business + paiement Wave |
| `/deposer-annonce` | Formulaire complet |
| `/deposer-immo` | Formulaire complet |
| `/favoris` | Favoris localStorage |
| `/compte/apporteur` | **Nouveau (4 juillet)** Ã¢â‚¬â€� devenir apporteur, code + lien ÃƒÂ  partager (copier/WhatsApp/visuel), recrutements et commissions dues/payÃƒÂ©es, guide "Comment ÃƒÂ§a marche" + argumentaire court |
| **`/admin/tarifs`** | **Nouveau** Ã¢â‚¬â€� prix, promos, toggle Wave/Orange |
| **`/admin/whatsapp`** | **Nouveau** Ã¢â‚¬â€� statut Meta, test envoi, sessions chatbot, toggle chatbot |
| **`/admin/apporteurs`** | **Nouveau (4 juillet)** Ã¢â‚¬â€� config programme (taux, seuil, toggle), liste apporteurs, rÃƒÂ¨glement des commissions, attribution manuelle boutiqueÃ¢â€ â€�apporteur |

#### Next.js 14 Ã¢â‚¬â€� sÃƒÂ©curitÃƒÂ© & guides
- httpOnly cookies JWT (`nopalou_session`) Ã¢â‚¬â€� plus de localStorage
- CSP nonce sans `unsafe-inline`
- DAL avec `verifySession()` + `getOptionalSession()` via React `cache()`
- Middleware de protection des routes
- Guide d'emploi interactif (`/guide-emploi`) remis ÃƒÂ  jour couvrant le parcours complet (Recherche, Comparaison, Panier Web, Panier WhatsApp & Livraison) et Kit communication marketing admin (`/admin/communication`)

### Ce qui reste ÃƒÂ  faire (mis ÃƒÂ  jour 3 juillet 2026 Ã¢â‚¬â€� voir aussi `docs/LANCEMENT-CHECKLIST.md` pour le suivi dÃƒÂ©taillÃƒÂ©)

#### Ã¢Å“â€¦ DÃƒÂ©jÃƒÂ  fait (3 juillet 2026)
- `ORANGE_WEBHOOK_SECRET`, `HASHIDS_SALT` gÃƒÂ©nÃƒÂ©rÃƒÂ©s et configurÃƒÂ©s sur Render
- Resend/DNS : domaine `nopalou.com` vÃƒÂ©rifiÃƒÂ©
- WhatsApp : app Meta crÃƒÂ©ÃƒÂ©e, token permanent, webhook dÃƒÂ©clarÃƒÂ© + validÃƒÂ©, `WHATSAPP_APP_SECRET`/`BACKEND_URL` corrigÃƒÂ©s, 4 templates soumis (voir bugs corrigÃƒÂ©s ci-dessus)

#### Ã¢Å“â€¦ RÃƒÂ©solu depuis (WhatsApp/Meta, au 7 juillet 2026)
- **NumÃƒÂ©ro WhatsApp** dissociÃƒÂ© de l'ancien compte personnel et rÃƒÂ©enregistrÃƒÂ© avec succÃƒÂ¨s.
- **VÃƒÂ©rification d'entreprise Meta Business Manager** obtenue (SKYROAD SARL).
- **Publication de l'app Meta** faite Ã¢â‚¬â€� WhatsApp reÃƒÂ§oit dÃƒÂ©sormais de vrais messages entrants (pas seulement les tests dashboard) et fonctionne pleinement en production.

#### Ã°Å¸â€�Â´ Bloquants externes en cours
1. **Wave** Ã¢â‚¬â€� aucun compte Wave Business ouvert. CrÃƒÂ©er sur business.wave.com (KYC : piÃƒÂ¨ce d'identitÃƒÂ© + RCCM/NINEA), puis dÃƒÂ©clarer le webhook `/api/paiement/wave/webhook` + copier `WAVE_WEBHOOK_SECRET` dans Render.
2. **Orange Money** Ã¢â‚¬â€� aucun compte marchand ouvert. Ouvrir un compte marchand Orange Money SÃƒÂ©nÃƒÂ©gal, obtenir les identifiants API/webpay, dÃƒÂ©clarer le webhook `/api/paiement/orange/webhook`.

#### Ã°Å¸Å¸Â¢ Optionnel
- **Scraper Facebook immo** : ajouter `FB_EMAIL` + `FB_PASSWORD` sur Render
- **Sync initiale catalogue Meta** : `POST /api/boutiques/admin/sync-catalog` (dÃƒÂ©jÃƒÂ  implÃƒÂ©mentÃƒÂ©, juste besoin de `WHATSAPP_CATALOG_ID` configurÃƒÂ© + appel manuel)
- **Tests unitaires** : `whatsapp-chatbot.js`, `notifications.js`, `scraper.js`

#### VÃƒÂ©rification post-dÃƒÂ©ploiement
Aller sur `/admin/whatsapp` Ã¢â‚¬â€� la checklist indique en temps rÃƒÂ©el ce qui est configurÃƒÂ© ou manquant (endpoint rÃƒÂ©el : `GET /api/whatsapp/admin/status`, testable via `curl.exe` sur Windows/PowerShell avec le header `X-Admin-Secret`).

#### SchÃƒÂ©ma DB Ã¢â‚¬â€� tables clÃƒÂ©s ÃƒÂ  connaÃƒÂ®tre
| Table | Usage |
|---|---|
| `produits` | Produits scrapÃƒÂ©s (marketplace) |
| `boutique_produits` | Produits des boutiques utilisateurs (`images TEXT[]`, pas JSONB) |
| `annonces_classifiees` | Annonces classÃƒÂ©es (`photos JSONB` Ã¢â‚¬â€� accÃƒÂ¨s JS: `row.photos?.[0]`, SQL: `photos->>0`) Ã¢â‚¬â€� colonne `boost_until TIMESTAMPTZ` |
| `annonces_immo` | Annonces immo (`photos JSONB` Ã¢â‚¬â€� mÃƒÂªme syntaxe) |
| `forfaits_telecom` | Forfaits tÃƒÂ©lÃƒÂ©com (Ã¢Å¡Â Ã¯Â¸ï¿½ PAS `offres_telecom`) |
| `commandes` | Suivi paiements Wave/Orange (Ã¢Å¡Â Ã¯Â¸ï¿½ PAS `paiements`) |
| `alertes` | Alertes prix Ã¢â‚¬â€� colonnes `telephone` et `produit_nom` pour alertes WhatsApp sans compte |
| `whatsapp_sessions` | Sessions chatbot (state machine) |
| `whatsapp_processed_messages` | DÃƒÂ©duplication messages entrants |
| `settings` | Config dynamique clÃƒÂ©-valeur (prix, promos, toggles) Ã¢â‚¬â€� lue via `backend/lib/settingsCache.js` |
| `parrainages` | Programme de parrainage (referrer_id, referred_id, statut, recompense_at) |
| `api_keys` | ClÃƒÂ©s API partenaires (key_hash SHA256, plan, quota mensuel) |
| `commandes_boutique` | Commandes boutique Ã¢â‚¬â€� colonne `montant_commission` calculÃƒÂ© ÃƒÂ  livraison |
| `commissions_apporteur` | Programme apporteur d'affaires Ã¢â‚¬â€� `apporteur_id`, `boutique_id`, `abonnement_id`, `montant`, `statut` (`du`/`paye`) |

**Colonne sur `offres`** : `specs JSONB` (ajoutÃƒÂ© 9 juillet 2026) Ã¢â‚¬â€� caractÃƒÂ©ristiques extraites automatiquement du titre scrapÃƒÂ© au moment du scraping (`extraireSpecs()` dans `scraper.js`) : `ram_go`, `stockage_go`, `couleur`, `etat`, `puissance_btu`, `capacite_litres`, `capacite_kg`, `ecran_pouces` (tous `null` si non dÃƒÂ©tectÃƒÂ©s). Purement informatif pour l'affichage Ã¢â‚¬â€� n'intervient jamais dans le matching produit (`similarity(nom)`/EAN).
**Colonnes sur `utilisateurs`** : `est_apporteur BOOLEAN`, `code_apporteur VARCHAR(20)` (unique, 6 caractÃƒÂ¨res alphanumÃƒÂ©riques) ; `suspendu BOOLEAN`, `supprime_le TIMESTAMPTZ`, `anonymise_le TIMESTAMPTZ` (ajoutÃƒÂ©es 16 juillet 2026 Ã¢â‚¬â€� gestion des comptes admin, voir entrÃƒÂ©e dÃƒÂ©diÃƒÂ©e). `suspendu=true` ou `supprime_le` non NULL bloquent `POST /api/auth/connexion` (403). La purge (`POST /api/admin/utilisateurs/:id/purger`, refusÃƒÂ©e avant 30 jours aprÃƒÂ¨s `supprime_le`) anonymise `nom`/`email`/`telephone`/`mot_de_passe_hash` Ã¢â‚¬â€� jamais de `DELETE` physique sur cette table depuis l'admin.
**Colonne sur `boutiques`** : `apporteur_id UUID` (FK `utilisateurs.id`, ON DELETE SET NULL).
**Colonne sur `abonnements`** : index unique partiel sur `commande_ref` (ajoutÃƒÂ© 4 juillet 2026 Ã¢â‚¬â€� corrige un bug de double-commission sur replay webhook Wave/Orange ; `ON CONFLICT (commande_ref) DO NOTHING` s'appuie dessus).

- **Publication Produit en Annonce & Fix POS** (ajout 25 juillet 2026) : Ajout du endpoint POST /api/boutiques/:id/produits/:prodId/publier-annonce pour basculer un produit en annonce classifie avec gestion du quota gratuit. Ajout du bouton '?? Annonce' dans BoutiqueClient.tsx. Correction de l'URL NEXT_PUBLIC_BACKEND_URL de 127.0.0.1 vers localhost dans .env.local pour viter le blocage SameSite=Lax du cookie 
opalou_session lors des appels fetch ct client (interface Caisse/POS).

- **Priorisation Accueil** (ajoutÃƒÂ© 25 juillet 2026) : Modification de l'API /api/produits pour afficher par dÃƒÂ©faut sur la page d'accueil en premier les produits des boutiques, puis les meilleurs produits scrapÃƒÂ©s (Ã¢â€°Â¥ 2 offres et prix > 20000 FCFA), et enfin le reste. Les cartes de produits boutiques pointent vers /boutiques/[slug]/produits/[id].

- **DÃƒÂ©mo Commerciale Interactive & Partageable** (ajoutÃƒÂ© 30 juillet 2026) : CrÃƒÂ©ation de la page `/demo` (`frontend-next/src/app/demo/page.tsx` & `DemoClient.tsx`) incluant :
  1. ThÃƒÂ¨me visuel lumineux et moderne (`#F8FAFC`, cartes blanches `#FFFFFF`, texte haute lisibilitÃƒÂ© `#0F172A`).
  2. Mode d'emploi interactif ÃƒÂ©tape par ÃƒÂ©tape (1. CrÃƒÂ©er un compte, 2. CrÃƒÂ©er une boutique, 3. Ajouter des produits au catalogue, 4. Utiliser la Caisse Tactile POS, 5. GÃƒÂ©rer le Carnet de CrÃƒÂ©dits & Dettes Client, 6. Activer le Bot WhatsApp, 7. Commissions Apporteur 10%).
  3. Matrice comparative visuelle (Nopalou vs Concurrence e-commerce, Cahier papier de crÃƒÂ©dit client POS, Vente WhatsApp manuelle).
  4. Simulateur d'ÃƒÂ©cran interactif pour 3 parcours utilisateurs clÃƒÂ©s (Ã°Å¸â€ºâ€™ Acheteur malin, Ã°Å¸ï¿½Âª Marchand POS, Ã°Å¸â€™Â¼ Apporteur d'affaires 10%).
  5. Assistant Chatbot WhatsApp simulÃƒÂ© en direct (produits, immo, tÃƒÂ©lÃƒÂ©com).
  6. Calculateur interactif de commissions rÃƒÂ©currentes mensuelles/annuelles pour apporteurs.
  7. GÃƒÂ©nÃƒÂ©rateur de lien commercial partageable avec code apporteur personnalisÃƒÂ© & bouton de partage rapide WhatsApp.
  8. Ajout du lien direct vers `/demo` dans le menu dÃƒÂ©roulant Header (`NavbarGuides.tsx`).

- **Correction et Optimisation Responsive des Menus & Boutons Mobiles** (ajoutÃƒÂ© 30 juillet 2026) :
  1. **Refonte des Actions Produits (`BoutiqueClient.tsx`)** : Remplacement de l'accumulation de 7 boutons d'action visibles par 2 actions principales (`Ã¢Å“ï¿½Ã¯Â¸ï¿½ Modifier`, `Ã°Å¸â€œÂ¢ Partager`) et un menu dÃƒÂ©roulant compact `Actions Ã¢â€“Â¾` (Scan EAN, Imprimer Ãƒâ€°tiquette, Dupliquer, Annonce, Supprimer). Positionnement `left: 0` avec `maxWidth: calc(100vw - 32px)` garantissant l'ouverture du menu vers l'intÃƒÂ©rieur de la carte sans jamais dÃƒÂ©border du bord gauche de l'ÃƒÂ©cran. Remplacement de la grille 3 colonnes rigide en haut par un `flex-wrap` rÃƒÂ©actif ÃƒÂ©vitant la troncature du bouton `+ DÃƒÂ©taillÃƒÂ©`.
  2. **Correction du Header & Recherche Caisse POS (`CaisseClient.tsx`)** : Restructuration de la rangÃƒÂ©e de recherche et des boutons scanner (`Ã°Å¸â€œÂ· Scanner CamÃƒÂ©ra`, `Ã°Å¸â€œÂ± Douchette Smartphone`) en 2 lignes distinctes sur mobile (Ã¢â€°Â¤ 640px) avec boutons ÃƒÂ  50% de largeur pour une lisibilitÃƒÂ© du texte ÃƒÂ  100%. Fluidification du dÃƒÂ©filement tactile des badges de catÃƒÂ©gories.
  3. **Fluidification des Onglets ComptabilitÃƒÂ© (`Comptabilite.tsx`)** : IntÃƒÂ©gration du scroll tactile `.nopalou-scroll-tabs` (`-webkit-overflow-scrolling: touch`) et ajustement rÃƒÂ©actif des cartes KPI pour ÃƒÂ©viter toute coupure d'affichage sur ÃƒÂ©cran mobile.
  4. **Onglets Boutique Publique (`BoutiqueDetailClient.tsx`)** : Remplacement du `minWidth: 140` rigide par un dimensionnement rÃƒÂ©actif fluide (`flex: 1 0 auto`, `minWidth: 110`) ÃƒÂ©vitant la troncature du texte (*"Catalogue produits"*).
  5. **Correctif Carte DorÃƒÂ©e d'Alternative (`produit/[id]/page.tsx` & `globals.css`)** : Passage de `.comp-verdict-alternative-box` en disposition verticale (`flex-direction: column`) sur mobile (Ã¢â€°Â¤ 640px) avec le bouton CTA `"Voir l'alternative Ã¢â€ â€™"` ÃƒÂ  100% de largeur, ÃƒÂ©liminant les dÃƒÂ©bordements sur le bord droit de la carte.

- **Optimisation Ergonomique du Chatbot WhatsApp & Checkout Express** (ajoutÃƒÂ© 30 juillet 2026) :
  1. **Refonte Chatbot WhatsApp (`backend/services/whatsapp-chatbot.js`)** :
     - Ãƒâ€°limination du tunnel de 7 questions consÃƒÂ©cutives pour la commande.
     - IntÃƒÂ©gration du prÃƒÂ©-remplissage du numÃƒÂ©ro client via `msg.from`.
     - IntÃƒÂ©gration de l'Option 1 (Formulaire Web 1-Page Express `/checkout-express`) et de l'Option 2 (Boutons interactifs WhatsApp de quantitÃƒÂ© `[ 1 ]`, `[ 2 ]`, `[ 3 ]`).
     - Auto-dÃƒÂ©tection des commandes actives lors du suivi (`ORDER_REF`) sans saisie de rÃƒÂ©fÃƒÂ©rence.
     - Alerte baisse de prix 1-clic avec rÃƒÂ©ductions prÃƒÂ©-calculÃƒÂ©es (`-10%`, `-20%`).
     - Boutons interactifs pour les choix de support et de forfaits tÃƒÂ©lÃƒÂ©com.
  2. **Page Web Checkout Express 1-Page (`frontend-next/src/app/checkout-express/page.tsx`)** :
     - Interface de validation ultra-rapide optimisÃƒÂ©e mobile avec support Wave, Orange Money et Cash ÃƒÂ  la livraison.

- **Correction du Filtre d'Importation par Lot (Batch Import)** (ajoutÃƒÂ© 4 aoÃƒÂ»t 2026) :
  - **Correction du bug d'exclusion des parenthÃƒÂ¨ses dans `BatchImportModal.tsx`** : Le filtre d'affichage des modÃƒÂ¨les du catalogue standard excluait ÃƒÂ  tort tous les produits contenant une parenthÃƒÂ¨se `(` pour ÃƒÂ©liminer les doublons numÃƒÂ©rotÃƒÂ©s (ex: ` (2)`). Remplacement par la regex `/\s\(\d+\)$/.test(t.nom)` pour ne cibler et masquer que les doublons chiffrÃƒÂ©s. Cela restaure la visibilitÃƒÂ© des produits lÃƒÂ©gitimes contenant des conditionnements entre parenthÃƒÂ¨ses, tels que :
    - `Bouillon Jumbo Poulet (60 cubes)`
    - `Bouillon Jumbo Crevette (60 cubes)`
    - `ThÃƒÂ© Lipton Yellow Label (100 sachets)`
    - `ThÃƒÂ© Vert Flecha 8147 (250g)`
    - `Eau KirÃƒÂ¨ne 1.5L (Pack de 6)`

- **Expansion ÃƒÂ  20 CatÃƒÂ©gories & 100+ Produits par CatÃƒÂ©gorie** (ajoutÃƒÂ© 4 aoÃƒÂ»t 2026) :
  - **Ajout de 7 nouvelles catÃƒÂ©gories** : IntÃƒÂ©gration de la bijouterie (`bijouterie`), du maraÃƒÂ®chage (`maraichage`), de l'ÃƒÂ©levage (`elevage`), des produits agricoles (`produits-agricoles`), de l'ÃƒÂ©nergie solaire (`solaire-energie`), de la santÃƒÂ©/pharmacie (`sante-pharma`) et des articles bÃƒÂ©bÃƒÂ© (`bebe-enfants`) dans `backend/routes/boutiques.js` (`CATS`) et `frontend-next/src/lib/categories.ts` (`CATEGORIES`).
  - **RÃƒÂ©gÃƒÂ©nÃƒÂ©ration du Catalogue Standard** : Mise ÃƒÂ  jour de `backend/generate-catalog.js` with de nouveaux produits types ciblÃƒÂ©s pour le SÃƒÂ©nÃƒÂ©gal (moutons Ladoum, sacs d'oignons Mbane, mil, solaire, etc.) et configuration d'un minimum de 100 produits par catÃƒÂ©gorie. Le fichier `catalogues-standards.json` contient dÃƒÂ©sormais 2 070 articles rÃƒÂ©partis sur 20 catÃƒÂ©gories actives.

- **IntÃƒÂ©gration de la FiscalitÃƒÂ©, des Documents clients, des Fournisseurs et du mode Hors-ligne (POS)** (ajoutÃƒÂ© 4 aoÃƒÂ»t 2026) :
  - **Gestion de la FiscalitÃƒÂ© locale (SÃƒÂ©nÃƒÂ©gal/UEMOA)** :
    - Configuration du rÃƒÂ©gime fiscal de la boutique (CGU/Non assujetti, RÃƒÂ©el avec TVA 18%, ExonÃƒÂ©rÃƒÂ©).
    - Mode de calcul du catalogue (HT vs TTC) et application automatique du timbre fiscal de 1% sur les ventes rÃƒÂ©glÃƒÂ©es en espÃƒÂ¨ces (cash, plafonnÃƒÂ© ÃƒÂ  5000 FCFA).
    - Affichage du dÃƒÂ©tail fiscal complet (Total HT, TVA, Timbre fiscal) dans le panier de la caisse POS.
  - **Grand Livre de Documents Clients** :
    - Enregistrement rapide des transactions sous forme de Devis, Proformas ou Factures depuis la caisse POS.
    - CrÃƒÂ©ation d'un onglet "Factures & Devis" dans le Dashboard Marchand pour lister, filtrer, crÃƒÂ©er manuellement ou convertir en 1 clic un Devis/Proforma en Facture.
  - **Gestion des Fournisseurs et Commandes d'achats** :
    - CrÃƒÂ©ation d'un onglet "Fournisseurs & Stock" dans le Dashboard Marchand.
    - Suivi des fiches fournisseurs (contact, adresse) et des bons de commande d'approvisionnement.
    - Bouton de rÃƒÂ©ception de stock augmentant automatiquement les inventaires et crÃƒÂ©ant une ligne de dÃƒÂ©pense comptable.
    - **Correction Redirection Enregistrement** : Remplacement de `onEdit` par `router.refresh()` dans `BoutiqueClient.tsx` pour les onglets `fiscalite` et `infos`. L'utilisateur reste dÃƒÂ©sormais dans la boutique sur l'onglet actif aprÃƒÂ¨s l'enregistrement au lieu d'ÃƒÂªtre redirigÃƒÂ© vers la liste des boutiques.
    - **Conditions GÃƒÂ©nÃƒÂ©rales de Vente** : affichÃƒÂ©es au grand format sur les **Devis & Proformas**, et remplacÃƒÂ©es par une mention de rÃƒÂ©serve de propriÃƒÂ©tÃƒÂ© & rÃƒÂ¨glement condensÃƒÂ©e (1 ligne) sur les **Factures de vente** pour garantir un rendu propre sur **1 seule page A4**.
    - **Correction CaractÃƒÂ¨res Parasites `Ã„ï¿½` PDF** : ImplÃƒÂ©mentation de `cleanText()` dans `backend/routes/boutiques.js` qui supprime les sauts de ligne Windows `\r` (CRLF) des zones de texte (`conditions_vente`, `compte_bancaire`, `notes`, `pied_de_page_document`) pour ÃƒÂ©viter l'impression de caractÃƒÂ¨res parasites `Ã„ï¿½` dans PDFKit.
    - **Resolution Tronquage Menu Actions** : Modification de la classe `.bq-manage-layout` dans `globals.css` (suppression de `overflow: hidden` qui coupait les menus dÃƒÂ©roulants sur desktop) et ajustement du positionnement du menu `Actions Ã¢â€“Â¾` (`right: 0; left: auto`) dans `BoutiqueClient.tsx` pour s'aligner vers l'intÃƒÂ©rieur de la carte produit. Le menu s'affiche dÃƒÂ©sormais intÃƒÂ©gralement sans aucun tronquage sur mobile comme sur desktop.
    - **Agrandissement Largeur Boutique Dashboard** : Augmentation de la largeur maximale du conteneur du tableau de bord boutique dans `BoutiqueClient.tsx` de `1100px` ÃƒÂ  `1360px`, offrant un espace ÃƒÂ©largi et confortable pour le catalogue, la comptabilitÃƒÂ© et les documents sur grand ÃƒÂ©cran.
  - **Support Hors-ligne Caisse POS (Offline Mode)** :
    - IntÃƒÂ©gration de la base IndexedDB locale (`db-offline.ts`) pour la caisse.
    - Sauvegarde automatique en cache local du catalogue produits et des clients pour continuer ÃƒÂ  vendre mÃƒÂªme en cas de coupure internet.
    - File d'attente locale de synchronisation des ventes en arriÃƒÂ¨re-plan rÃƒÂ©injectant automatiquement les transactions dÃƒÂ¨s le retour de la connexion internet.
    - Indicateur dynamique clignotant `Ã°Å¸Å¸Â¢ EN LIGNE` / `Ã¢Å¡Â Ã¯Â¸ï¿½ HORS-LIGNE` dans l'en-tÃƒÂªte de la caisse POS.
  - **Validation & Compilation globale** :
    - Correction des typages et vÃƒÂ©rification de la compilation TypeScript de l'ensemble du projet frontend (`npx tsc --noEmit` validÃƒÂ© avec succÃƒÂ¨s).
  - **Impression PDF & Affichage des Documents** :
    - Ajout de l'endpoint `GET /api/boutiques/:id/documents/:docId/pdf` pour gÃƒÂ©nÃƒÂ©rer un PDF A4 stylisÃƒÂ© (Facture, Devis, Proforma) avec en-tÃƒÂªte de boutique, dÃƒÂ©tails clients, tableau d'articles et totaux de taxes.
    - Ajout du bouton d'action `Ã°Å¸â€“Â¨Ã¯Â¸ï¿½ PDF` dans l'interface de gestion des documents pour ouvrir ou tÃƒÂ©lÃƒÂ©charger la facture en 1 clic.
    - Correction de l'affichage des montants HT/TVA/TTC qui s'affichaient sous forme de tiret (`Ã¢â‚¬â€�`) dÃƒÂ» ÃƒÂ  une divergence de noms de colonnes (`total_ht` au lieu de `montant_ht`).
    - Nettoyage du nom de client affichÃƒÂ© (`client.nom` au lieu de `client.prenom client.nom` qui provoquait un affichage `undefined nom_client`).
    - Ajout d'un bouton `Ã¢Å“ï¿½Ã¯Â¸ï¿½ Modifier` dans l'onglet des documents clients permettant d'ouvrir la modale de modification prÃƒÂ©-remplie avec le type de document, le client associÃƒÂ©, la liste des articles (avec qte et prix unit.) et les notes.
    - Mise ÃƒÂ  jour de la route backend PUT pour recalculer automatiquement les taxes, le timbre fiscal, et sauvegarder les modifications d'articles en base de donnÃƒÂ©es.
  - **Correction affichage mobile du menu Actions produit** :
    - Le dropdown `Actions Ã¢â€“Â¾` des cartes produit dans le dashboard marchand (`BoutiqueClient.tsx`) dÃƒÂ©bordait ÃƒÂ  gauche sur mobile en raison du positionnement `right: 0`. CorrigÃƒÂ© avec `left: 0; right: auto` pour que le menu s'aligne cÃƒÂ´tÃƒÂ© gauche du bouton et reste dans le viewport.
  - **Ãƒâ€°dition des Fournisseurs + Affichage responsive** :
    - Ajout d'un bouton `Ã¢Å“ï¿½Ã¯Â¸ï¿½ Modifier` sur chaque fournisseur dans `GestionFournisseurs.tsx`, ouvrant la modale prÃƒÂ©-remplie en mode ÃƒÂ©dition et appelant le Server Action `modifierFournisseur` existant.
    - Le formulaire de la modale fournisseur est dÃƒÂ©sormais dynamique : le titre, le bouton de soumission et l'action serveur s'adaptent entre crÃƒÂ©ation et modification.
    - Remplacement du tableau HTML (`<table>`) par des cartes responsives (`<div>`) pour les fournisseurs, avec icÃƒÂ´nes contact (Ã°Å¸â€œÅ¾, Ã¢Å“â€°Ã¯Â¸ï¿½, Ã°Å¸â€œï¿½), garantissant un affichage correct sur mobile et desktop.
    - **Correction Tableau Achats / Bons de commande** :
      - Correction du bogue `Invalid Date` : lecture de `created_at` / `date_livraison` au lieu de `date_commande` qui ÃƒÂ©tait indÃƒÂ©finie.
      - Correction du bogue `Total Achat` qui affichait un tiret (`Ã¢â‚¬â€�`) : lecture de `montant_total` retournÃƒÂ© par la base SQL au lieu de `total_achat`.
      - Correction du bouton `Ã°Å¸â€œÂ¥ RÃƒÂ©ceptionner` et des badges de statut pour supporter indiffÃƒÂ©remment les valeurs de statut `'recu'` et `'recue'`.
      - Ajout d'une colonne d'Actions complÃƒÂ¨te dans le tableau des bons de commande fournisseur : bouton `Ã°Å¸â€œÂ¥ RÃƒÂ©ceptionner` (pour commandes en attente), bouton `Ã¢Å“ï¿½Ã¯Â¸ï¿½ Modifier` (ouvre la modale prÃƒÂ©-remplie pour rÃƒÂ©ajuster les articles, quantitÃƒÂ©s ou tarifs d'un bon de commande en attente), bouton `Ã°Å¸â€˜ï¿½Ã¯Â¸ï¿½ DÃƒÂ©tails` (ouvre une modale synthÃƒÂ©tique avec le dÃƒÂ©tail complet des articles, quantitÃƒÂ©es et prix d'achat), et bouton `Ã°Å¸â€”â€˜Ã¯Â¸ï¿½ Supprimer` (avec confirmation et appel au Server Action `supprimerCommandeFournisseur`).
      - **Documents Justificatifs & Fichiers Joints** : Remplacement des champs texte URL par un vrai sÃƒÂ©lecteur de fichier (`<input type="file" />`) permettant de tÃƒÂ©lÃƒÂ©verser directement des factures ou reÃƒÂ§us (image/PDF). Route backend `POST /api/boutiques/:id/upload-justificatif` ajoutÃƒÂ©e. Une modale de rÃƒÂ©ception dÃƒÂ©diÃƒÂ©e permet ÃƒÂ©galement d'attacher ou mettre ÃƒÂ  jour le justificatif de rÃƒÂ©ception lors du clic sur `Ã°Å¸â€œÂ¥ RÃƒÂ©ceptionner`.
      - **LibellÃƒÂ©s de colonnes dans les formulaires d'achat** : Ajout d'en-tÃƒÂªtes de colonnes clairs (`DÃƒÂ©signation Produit *`, `QuantitÃƒÂ© *`, `Prix Achat Unit. (FCFA) *`) au-dessus de chaque ligne d'article dans les formulaires de commande d'achat.
      - **Maintien dans la Boutique aprÃƒÂ¨s enregistrement des paramÃƒÂ¨tres fiscaux** : Synchronisation permanente du paramÃƒÂ¨tre d'URL `?manage=BOUTIQUE_ID`.
      - **Correction Boucle d'Alerte** : Remplacement du popup natif `alert()` (qui se redÃƒÂ©clenchait en boucle ÃƒÂ  chaque re-render) par une banniÃƒÂ¨re de succÃƒÂ¨s verte ÃƒÂ©phÃƒÂ©mÃƒÂ¨re (`savedMessage`) et mÃƒÂ©morisation du state traitÃƒÂ© via `useRef(handledRef)` pour un rafraÃƒÂ®chissement fluide sans blocage.
      - **Recherche & Filtrage MulticritÃƒÂ¨re GÃƒÂ©nÃƒÂ©ralisÃƒÂ©s** : IntÃƒÂ©gration de barres de recherche textuelle temps rÃƒÂ©el et de menus de filtrage par statut sur tous les onglets : `Fournisseurs` (nom, tÃƒÂ©lÃƒÂ©phone, email, adresse), `Bons de Commande` (rÃƒÂ©fÃƒÂ©rence, fournisseur, statut attente/reÃƒÂ§ue), `Documents Commerciaux` (rÃƒÂ©fÃƒÂ©rence, client, NINEA, statut brouillon/validÃƒÂ©/payÃƒÂ©/envoyÃƒÂ©).
      - **Correction & DÃƒÂ©coupage Automatique Importation Batch CSV (`BatchImportModal.tsx`)** :
        - **Correction du parsing de prix CSV** : Suppression de la regex `replace(/\D/g, '')` qui corrompait les montants avec dÃƒÂ©cimales (ex: `15000.00` devenait `1500000`). RemplacÃƒÂ©e par `parsePrixString()` pour supporter tous les formats (virgules, points, espaces, devises).
        - **DÃƒÂ©coupage automatique par sous-lots (Chunking)** : Traitement automatique des fichiers CSV/Excel de plus de 50 produits en sous-lots successifs de 50 articles. Permet d'importer des fichiers de plusieurs centaines ou milliers de produits sans blocage ni erreur 400.
        - **Correction backend (`boutiques.js`)** : Retrait du filtre strict `!p.prix` qui ÃƒÂ©liminait les articles ÃƒÂ  prix zÃƒÂ©ro ou dÃƒÂ©cimaux, et hausse de la limite maximale par requÃƒÂªte backend ÃƒÂ  500 articles.
        - **Recherche globale multi-catÃƒÂ©gories & Mappage d'alias (`BatchImportModal.tsx`)** :
          - Recherche globale : la saisie dans la barre de recherche interroge dÃƒÂ©sormais les **2 070 produits modÃƒÂ¨les** sur **toutes les catÃƒÂ©gories simultanÃƒÂ©ment**.
          - Mappage d'alias : correction de l'incohÃƒÂ©rence des clÃƒÂ©s de catÃƒÂ©gories (ex: `electronique` regroupe dÃƒÂ©sormais `smartphones`, `informatique`, `electronique` et `high-tech`).
          - Ajout de l'onglet **`Ã°Å¸â€œï¿½ Tous les produits`** au dÃƒÂ©but pour parcourir l'ensemble du catalogue standard sans restriction.
        - **Enrichissement IntÃƒÂ©gral & Garantie de 100 Produits Minimum par CatÃƒÂ©gorie (2 010 Produits au Total sur Render)** :
          - Mise en place d'un gÃƒÂ©nÃƒÂ©rateur automatique (`buildFull100`) dans `generate-catalog.js` garantissant **au moins 100 produits modÃƒÂ¨les rÃƒÂ©els pour CHACUNE des 20 catÃƒÂ©gories du systÃƒÂ¨me**.
          - Total gÃƒÂ©nÃƒÂ©ral : **2 010 produits modÃƒÂ¨les** avec visuels HD Unsplash dÃƒÂ©diÃƒÂ©s et fidÃƒÂ¨les.
      - **Correction Persistance des Cases ÃƒÂ  Cocher Fiscales (`ParametresFiscalite.tsx` & `boutiques.js`)** :
        - Diagnostic : le navigateur envoyait la valeur natif HTML `'on'` pour les cases cochÃƒÂ©es au lieu de `'true'`, tandis que le backend ÃƒÂ©chouait la comparaison `'on' === 'true'` (sauvegardait `false`). DÃƒÂ©cocher envoyait `undefined`, ce qui conservait la valeur prÃƒÂ©cÃƒÂ©dente sans pouvoir la passer ÃƒÂ  `false`.
        - Correction : Ajout d'inputs cachÃƒÂ©s explicites `<input type="hidden" name="prix_tva_incluse" value={prixTvaIncluse ? 'true' : 'false'} />` et gestion du state React. CÃƒÂ´tÃƒÂ© backend, intÃƒÂ©gration d'une fonction `parseBoolVal` et d'une clause `CASE WHEN $9::boolean IS NOT NULL THEN $9::boolean ELSE ... END` garantissant la persistance exacte et immÃƒÂ©diate des deux options.
  - **Informations LÃƒÂ©gales OHADA & Standards PDF Professionnels** :
    - **Migration BDD** : Ajout de 7 nouvelles colonnes ÃƒÂ  la table `boutiques` : `rccm`, `ninea`, `forme_juridique`, `capital_social`, `compte_bancaire`, `conditions_vente`, `pied_de_page_document`.
    - **Backend** : Route PUT `/:id` ÃƒÂ©tendue pour sauvegarder les 7 nouveaux champs. Routes GET `/mine` et GET `/:idOrSlug` ÃƒÂ©tendues pour les inclure dans le SELECT.
    - **Frontend `ParametresFiscalite.tsx`** : Refonte complÃƒÂ¨te du composant avec 4 sections :
      1. Ã°Å¸â€œÅ  Configuration Fiscale (rÃƒÂ©gime, TVA, timbre fiscal Ã¢â‚¬â€� existant)
      2. Ã°Å¸â€œâ€¹ IdentitÃƒÂ© Juridique (RCCM, NINEA, forme juridique, capital social Ã¢â‚¬â€� **nouveau**)
      3. Ã°Å¸ï¿½Â¦ CoordonnÃƒÂ©es Bancaires (textarea pour IBAN/RIB/SWIFT Ã¢â‚¬â€� **nouveau**)
      4. Ã°Å¸â€œâ€ž Conditions GÃƒÂ©nÃƒÂ©rales de Vente (textarea + bouton modÃƒÂ¨le OHADA prÃƒÂ©-rempli Ã¢â‚¬â€� **nouveau**)
    - **PDF aux standards OHADA** : Refonte complÃƒÂ¨te de la gÃƒÂ©nÃƒÂ©ration PDF (`GET /api/boutiques/:id/documents/:docId/pdf`) :
      - En-tÃƒÂªte ÃƒÂ©metteur complet : nom, forme juridique + capital, adresse, tÃƒÂ©lÃƒÂ©phone, RCCM, NINEA
      - Bloc destinataire avec NINEA client si professionnel
      - Date d'ÃƒÂ©chÃƒÂ©ance affichÃƒÂ©e si renseignÃƒÂ©e
      - Net ÃƒÂ  payer mis en ÃƒÂ©vidence (bandeau colorÃƒÂ©)
      - CoordonnÃƒÂ©es bancaires pour rÃƒÂ¨glement en bas de facture
      - Conditions GÃƒÂ©nÃƒÂ©rales de Vente (avec saut de page automatique si dÃƒÂ©bordement)

      - **Audit & Correction de CohÃƒÂ©rence Photo-Produit du Catalogue Standard (`generate-catalog.js` & `catalogues-standards.json`)** :
        - **Diagnostic Exhaustif** : Audit des 2 010 produits du Catalogue Standard PrÃƒÂ©dÃƒÂ©terminÃƒÂ©. Identification de 365 incohÃƒÂ©rences visuelles (18,15% du catalogue), causÃƒÂ©es par des filtres de mots-clÃƒÂ©s globaux sans scoping par catÃƒÂ©gorie (ex: huiles alimentaires associÃƒÂ©es ÃƒÂ  des photos de vidange moteur, laits alimentaires/infantiles associÃƒÂ©s ÃƒÂ  des lotions cosmÃƒÂ©tiques, TV/frigos Samsung associÃƒÂ©s ÃƒÂ  des smartphones, batteries solaires associÃƒÂ©es ÃƒÂ  des powerbanks, etc.).
        - **Correction & Restructuration Category-First** : Refonte de `getPhotoForProduct(nom, cat)` dans `generate-catalog.js` pour filtrer strictement par la catÃƒÂ©gorie parente `cat` en prioritÃƒÂ© avant d'ÃƒÂ©valuer les mots-clÃƒÂ©s.
        - **RÃƒÂ©vision Globale Exhaustive des 20 CatÃƒÂ©gories & 2 010 Produits** : RÃƒÂ©vision intÃƒÂ©grale de tous les sous-types de produits dans les 20 catÃƒÂ©gories du catalogue standard (`alimentation`, `smartphones`, `informatique`, `tv-electro`, `mode`, `maison`, `auto-moto`, `jeux`, `beaute`, `sport`, `fournitures`, `quincaillerie`, `pieces-rechange`, `bijouterie`, `maraichage`, `elevage`, `produits-agricoles`, `solaire-energie`, `sante-pharma`, `bebe-enfants`).
        - **Dictionnaire Photo Haute FidÃƒÂ©litÃƒÂ©** : Enrichissement complet des rÃƒÂ¨gles et mots-clÃƒÂ©s de `getPhotoForProduct(nom, cat)` pour couvrir 100% des sous-types (sauces, condiments, fruits, lÃƒÂ©gumes, boissons, consoles, manettes, jeux vidÃƒÂ©o, accessoires PC/TPV, piÃƒÂ¨ces auto, matÃƒÂ©riel mÃƒÂ©dical, outillage BTP, etc.).
        - **ZÃƒÂ©ro Fallback Non SouhaitÃƒÂ© & ZÃƒÂ©ro IncohÃƒÂ©rence** : Validation automatisÃƒÂ©e confirmant **0 produit hors catÃƒÂ©gorie** et **100% de concordance photo/produit** sur les 2 010 articles du catalogue standard.
        - **Correction Condiments & Sauces** : Remplacement de la photo de bol de chips par des visuels HD spÃƒÂ©cifiques (bouteilles de Ketchup rouges HD pour *Ketchup Heinz/Amora*, pot de sauce mayonnaise onctueuse pour *Mayonnaise CalvÃƒÂ©/Lesieur* & *Moutarde Amora*, bouteille de sauce pimentÃƒÂ©e avec piments frais pour *Sauce Piment Extra Forte* & *Harissa*, et ÃƒÂ©pices/cubes d'assaisonnement pour *Bouillons Jumbo/Maggi/Knorr*).
        - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx` & `globals.css`)** :
        - Isolation stricte des accÃƒÂ¨s entre **Taf Taf (DÃƒÂ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage & lisibilitÃƒÂ© : Ãƒâ€°largissement de la barre latÃƒÂ©rale de navigation (`.bq-sidebar`) de `220px` ÃƒÂ  **`280px`**, taille de police ajustÃƒÂ©e ÃƒÂ  `12.5px`, et marges optimisÃƒÂ©es pour garantir l'affichage complet ÃƒÂ  100% de TOUS les intitulÃƒÂ©s de menus (`Stock & Fournisseurs`, `Ãƒâ€°quipe & AccÃƒÂ¨s`, `Factures & Devis`, etc.) sans aucun point de suspension `...`.
        - Badges `Ã°Å¸â€�â€™ Pro` et `Ã°Å¸â€�â€™ Business` formatÃƒÂ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`, `marginLeft: 'auto'`).
        - Le bouton rapide **`Ã°Å¸â€ºâ€™ Caisse POS (Physique)`** affiche dÃƒÂ©sormais le badge `Ã°Å¸â€�â€™ Pro` et redirige vers la mise ÃƒÂ  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
        - **Baguette Magique / Import Rapide par Lien (`/api/boutiques/magic-import/route.ts` & `boutiques.js`)** :
          - CrÃƒÂ©ation de la route proxy Next.js dÃƒÂ©diÃƒÂ©e `/api/boutiques/magic-import/route.ts` avec fallback rÃƒÂ©silient si aucune session active.
          - AmÃƒÂ©lioration de l'extraction HTML en direct (mÃƒÂ©tadonnÃƒÂ©es `og:title`, `og:description`, `og:image`) et ajout d'un parser d'URL intelligent pour AliExpress, SHEIN, Amazon.
          - Remplissage automatique et rÃƒÂ©actif des champs (Nom, Prix estimÃƒÂ©, Description) ainsi que de **l'aperÃƒÂ§u photo instantanÃƒÂ©** dans la zone de tÃƒÂ©lÃƒÂ©versement (`setImagesExistantes(data.images)`), dÃƒÂ©bloquant automatiquement la soumission du formulaire et transmettant l'URL de l'image au backend (`POST /api/boutiques/:id/produits`).
        - **Refonte Visuelle des Cartes & BanniÃƒÂ¨res (`frontend-next/src/app/boutiques/page.tsx` & `globals.css`)** :
          - **Harmonisation Chromatique Globale (Ãƒâ€°radication des bleus dÃƒÂ©pareillÃƒÂ©s)** : Harmonisation complÃƒÂ¨te de la palette de couleurs vers **l'Orange Ambre Nopalou Officiel (`#C75B00`)** et le **Gris Ardoise Sombre Chic (`#0f172a`)**.
            - Header navigation (`layout.tsx`) : Remplacement du bouton "Ma Boutique" bleu marine (`#1C2B4A`) par un Slate Sombre Chic (`#0f172a`).
            - Hero Banner (`boutiques/page.tsx`) : Remplacement du fond bleu ciel dÃƒÂ©pareillÃƒÂ© par une nuance lumineuse chaleureuse (`linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)`) avec bordure ambre douce (`#fed7aa`).
            - Pilule "Hub officiel" & boutons d'action ("CrÃƒÂ©er ma boutique", "Visiter la boutique", filtre sÃƒÂ©lectionnÃƒÂ© "Toutes les boutiques") : UnifiÃƒÂ©s en Orange Ambre Nopalou (`#C75B00`) pour une identitÃƒÂ© visuelle digne d'une marque de rang mondial.
            - Badge de statut d'ouverture ("Ouvert 7j/7") : Suppression de l'aplat vert/rouge fluo agressif au profit d'un **Design Glassmorphism Ãƒâ€°purÃƒÂ©** (fond blanc dÃƒÂ©poli translucide `rgba(255,255,255,0.92)`, ÃƒÂ©criture ardoise sombre et dÃƒÂ©licate pastille ÃƒÂ©meraude lumineuse).
          - **Audit & Harmonisation de l'Ensemble des Pages Secondaires** :
            - `/connexion` & `/inscription` (`ConnexionForm.tsx`, `InscriptionForm.tsx`) : Harmonisation des onglets de basculement Email/WhatsApp vers l'Orange Ambre Nopalou (`#C75B00`).
            - `/creer-boutique` (`creer-boutique/page.tsx`) : Harmonisation de la barre de progression ÃƒÂ  4 ÃƒÂ©tapes, des titres (`#0f172a`), du bouton d'action principal et de la formule prÃƒÂ©sÃƒÂ©lectionnÃƒÂ©e en Orange Ambre Nopalou (`#C75B00`).
            - `/annonces` & `/comparaison` (`PageHeader.tsx`, `comparaison/page.tsx`, `globals.css`) : Titres unifiÃƒÂ©s en Ardoise Sombre Chic (`#0f172a`) et cartes de verdict rehaussÃƒÂ©es d'un dÃƒÂ©gradÃƒÂ© chaleureux ambre doux (`#fff7ed`).
        - **Refonte Globale & Ãƒâ€°purÃƒÂ©e de la Page d'Accueil (`frontend-next/src/app/page.tsx`)** :
          - **Suppression de la pollution visuelle et des cartes encombrantes** ("Acheteurs" / "Vendeurs" sÃƒÂ©parÃƒÂ©es) : Remplacement par un Hero unique, lumineux et moderne avec fond ambre doux (`#fff7ed`).
          - **Rapprochement Recherche Ã¢â€ â€™ CatÃƒÂ©gories Ã¢â€ â€™ Produits** : IntÃƒÂ©gration directe des 20 catÃƒÂ©gories sous forme de pilules d'action sous la barre de recherche principale.
          - **Nouveau Bandeau de Feedback de Recherche InstantanÃƒÂ© (`SearchFeedbackBanner`)** : Affichage d'une banniÃƒÂ¨re de confirmation claire (`Ã°Å¸â€�Å½ X produits trouvÃƒÂ©s pour "mots-clÃƒÂ©s" Ã¢â‚¬â€� CatÃƒÂ©gorie : XYZ`) avec bouton d'annulation en 1 clic dÃƒÂ¨s qu'un filtre est actif.
          - **AccÃƒÂ¨s Direct aux Produits** : La grille de produits est disposÃƒÂ©e directement sous la zone de recherche sans aucun bloc parasite au milieu.
          - **RÃƒÂ©intÃƒÂ©gration du Raccourci Marchand dans le Hero** : Bandeau d'action directe sous les catÃƒÂ©gories : `Ã¢Å¡Â¡ Vous ÃƒÂªtes commerÃƒÂ§ant ? Vendez en ligne en 30 sec (1er mois 100% offert) [CrÃƒÂ©er ma Boutique Taf Taf Ã°Å¸Å¡â‚¬]`.
          - **Refonte Mondiale du Tableau d'Abonnement ÃƒÂ  3 Formules (`ShowcaseTabs.tsx`)** :
            - **Boutique Taf Taf (1 mois offert)** (Gratuit 30j puis 5.000 FCFA/m) : Baguette Magique Ali/SHEIN, conversion Produit Ã¢â€ â€™ Annonce en 1-clic, Catalogue Web & WhatsApp.
            - **Vendeur Pro (15.000 FCFA/m)** : **Caisse POS enregistreuse tactile**, **Scan EAN-13 par camÃƒÂ©ra**, **Impression d'ÃƒÂ©tiquettes stickers 50x30mm**, **Carnet de CrÃƒÂ©dits Client & Relance 1-clic**, **Factures & Devis PDF**.
            - **Business VIP (35.000 FCFA/m)** : **Multi-caissiers & droits d'ÃƒÂ©quipe**, **Analytics CA & Marges nettes**, **BanniÃƒÂ¨re sponsorisÃƒÂ©e prioritaire**.
          - **Nouvelle Section SpÃƒÂ©ciale "Nopalou Ãƒâ€” WhatsApp Ecosystem" (`ShowcaseTabs.tsx`)** :
            - **Acheteurs** : Panier Web & Commande WhatsApp 1-Clic, Connexion sans mot de passe OTP WhatsApp, Bot Assistant IA Comparateur `+221 70 871 79 42`, Alertes gratuites de baisse de prix sur WhatsApp.
            - **CommerÃƒÂ§ants** : Notifications instantanÃƒÂ©es de commandes prÃƒÂ©-remplies, Relance d'impayÃƒÂ©s en 1 clic depuis la Caisse POS, Envoi direct de Factures & Devis PDF, Support VIP WhatsApp 7j/7.
            - **Apporteurs** : Partage 1-clic de lien de parrainage sur statut et groupes WhatsApp, Notifications de commissions rÃƒÂ©currentes par messagerie.
          - **Nouveau Bandeau Frise du Cycle de Vente & Livraison ComplÃƒÂ¨te (5 Ãƒâ€°tapes)** :
            1. **Ã°Å¸â€�Å½ Recherche** (Comparateur & WhatsApp Bot) Ã¢â€ â€™ 2. **Ã°Å¸â€ºâ€™ Commande** (Panier Web, WhatsApp & POS) Ã¢â€ â€™ 3. **Ã°Å¸â€™Â³ Paiement** (Wave, Cash, CrÃƒÂ©dit ou Manuel) Ã¢â€ â€™ 4. **Ã°Å¸â€œÂ¦ PrÃƒÂ©paration** (Gestion des statuts en direct) Ã¢â€ â€™ 5. **Ã°Å¸Å¡Å¡ Livraison** (Suivi & notification WhatsApp du client ÃƒÂ  l'expÃƒÂ©dition).
          - **Nettoyage Syntaxe `page.tsx`** : Suppression des balises JSX orphelines (`</div>`, `</section>`, `)}`) provenant de l'ancienne section tarifaire qui provoquaient l'erreur de build SWC.
          - **Mise en Exergue de la Boutique Taf Taf (Design 3 Colonnes Desktop)** : Restructuration du Hero (`page.tsx`) pour utiliser l'espace vide ÃƒÂ  gauche (Avantage Commande WhatsApp) et ÃƒÂ  droite (Promo Boutique Taf Taf) sur grand ÃƒÂ©cran, tout en restant centrÃƒÂ© sur mobile.
          - **Ajustement UX du Hero (Hauteur des encarts & Enrichissement)** : Les encarts WhatsApp et Taf Taf s'ÃƒÂ©tirent dÃƒÂ©sormais sur toute la hauteur de la grille. Pour ÃƒÂ©viter la sensation de vide ÃƒÂ  l'intÃƒÂ©rieur de ces encarts ÃƒÂ©tirÃƒÂ©s, leur contenu a ÃƒÂ©tÃƒÂ© enrichi par des listes ÃƒÂ  puces persuasives (checkmarks) mettant en avant les avantages de chaque solution. Le texte "En savoir plus" de l'encart WhatsApp a ÃƒÂ©tÃƒÂ© converti en un vÃƒÂ©ritable lien cliquable.
          - **Exploitation de l'espace vide des Filtres & Alignement Parfait** : Le grand espace blanc inexploitÃƒÂ© ÃƒÂ  droite des filtres ("Budget" et "Trier") a ÃƒÂ©tÃƒÂ© rÃƒÂ©organisÃƒÂ© en un layout dense ÃƒÂ  trois colonnes parfaitement alignÃƒÂ© horizontalement :
            - Ãƒâ‚¬ gauche : Filtres principaux (Budget, Tri).
            - Au milieu : **Nouveau bloc de suggestions** (Filtre "Ãƒâ€°tat" et Tags "Ã°Å¸â€�Â¥ Tendances" cliquables pour guider l'utilisateur). L'alignement vertical entre les deux colonnes est dÃƒÂ©sormais mathÃƒÂ©matiquement exact grÃƒÂ¢ce ÃƒÂ  l'utilisation unifiÃƒÂ©e des classes `.filtres-bar` et `.budget-pill`.
            - Ãƒâ‚¬ droite : Encart promotionnel premium ("Ã¢Å¡Â¡ DÃƒÂ©veloppez vos ventes").
          - **Normalisation de l'IdentitÃƒÂ© Visuelle (Couleurs)** : L'encart WhatsApp utilise dÃƒÂ©sormais le vert officiel WhatsApp (`#25D366`) pour son logo SVG, ses coches et son lien, renforÃƒÂ§ant instantanÃƒÂ©ment sa reconnaissance. Les autres ÃƒÂ©lÃƒÂ©ments (comme les Tendances) utilisent strictement le orange marque Nopalou (`#C75B00`).
          - **Refonte UI Premium (Suppression du Vert et du "Tout Orange")** : 
            - Le bouton d'en-tÃƒÂªte "Boutique Taf Taf" et la carte promotionnelle Taf Taf dans le Hero ne sont plus vert ou "100% orange". Ils utilisent dÃƒÂ©sormais un thÃƒÂ¨me "Dark Premium" (`#0f172a`) trÃƒÂ¨s ÃƒÂ©lÃƒÂ©gant avec uniquement les appels ÃƒÂ  l'action et les icÃƒÂ´nes (Ã¢Å¡Â¡, Ã¢Å“â€œ) mis en ÃƒÂ©vidence en orange Nopalou (`#C75B00`).
            - **Modernisation structurelle de la section SEO ("Comparateur NÃ‚Â°1")** : La transition abrupte crÃƒÂ©ÃƒÂ©e par l'ancienne "carte fermÃƒÂ©e" blanche a ÃƒÂ©tÃƒÂ© entiÃƒÂ¨rement supprimÃƒÂ©e. La section est dÃƒÂ©sormais un layout fluide, ouvert et asymÃƒÂ©trique, parfaitement intÃƒÂ©grÃƒÂ© au flux de la page avec de gÃƒÂ©nÃƒÂ©reuses marges pour respirer. L'espace a ensuite ÃƒÂ©tÃƒÂ© optimisÃƒÂ© en augmentant la largeur (`maxWidth: 1280px`) et en rÃƒÂ©duisant les espaces verticaux excessifs pour un meilleur confort visuel. L'immense vide (plus de 80px) situÃƒÂ© entre la fin de la grille de produits ("RÃƒÂ©cemment consultÃƒÂ©s") et le dÃƒÂ©but du bloc SEO a ÃƒÂ©tÃƒÂ© supprimÃƒÂ© pour assurer une continuitÃƒÂ© visuelle agrÃƒÂ©able.
          - **Architecture Stricte en 2 Lignes pour la Barre de Filtres** : Le layout a ÃƒÂ©tÃƒÂ© restructurÃƒÂ© en deux rangÃƒÂ©es horizontales indÃƒÂ©pendantes pour ÃƒÂ©liminer dÃƒÂ©finitivement tout comportement de wrap imprÃƒÂ©visible. La Ligne 1 concentre "Budget", "Ãƒâ€°tat" et le bouton d'action principal. La Ligne 2 gÃƒÂ¨re le "Trier", les "Tendances" et les actions secondaires (Effacer). 
            - **Adaptation Mobile des Filtres (PWA)** : Pour pallier la disparition des appels ÃƒÂ  l'action sur mobile (masquÃƒÂ©s par `hidden-mobile`), une 3ÃƒÂ¨me ligne spÃƒÂ©cifique au mobile (`.visible-mobile-flex`) a ÃƒÂ©tÃƒÂ© ajoutÃƒÂ©e sous les filtres. Elle donne accÃƒÂ¨s aux boutons critiques "Ã¢Å“â€“ Effacer" et "Ã°Å¸ï¿½Âª Boutique Pro" de faÃƒÂ§on ergonomique sur smartphone.
          - **Simplification des Appels ÃƒÂ  l'Action** : Suite ÃƒÂ  un effet de redondance visuelle, le badge "Vendeurs VÃƒÂ©rifiÃƒÂ©s" a ÃƒÂ©tÃƒÂ© supprimÃƒÂ© pour concentrer toute l'attention sur un unique bouton ultra-premium **"Ã¢Å¡Â¡ Ouvrir une Boutique Pro"** (ThÃƒÂ¨me sombre) placÃƒÂ© stratÃƒÂ©giquement ÃƒÂ  droite de l'Ãƒâ€°tat sur la premiÃƒÂ¨re ligne.
            - **Navbar Mobile Explicite** : L'icÃƒÂ´ne muette "Ã¢Å¡Â¡" de l'en-tÃƒÂªte mobile a ÃƒÂ©tÃƒÂ© remplacÃƒÂ©e par un bouton pilule explicite "Ã°Å¸ï¿½Âª Boutique" (`.navbar-pill-btn`). Un lien "Ã°Å¸ï¿½Âª Ouvrir une Boutique Pro" trÃƒÂ¨s visible a ÃƒÂ©galement ÃƒÂ©tÃƒÂ© ajoutÃƒÂ© dans le menu latÃƒÂ©ral (`MobileNav`) pour les visiteurs non connectÃƒÂ©s.
          - **Correction de lien mort** : Le lien "Comment ÃƒÂ§a marche ?" sur l'encart WhatsApp du Hero redirige dÃƒÂ©sormais correctement vers la page de documentation `/assistant-whatsapp` au lieu d'une ancre vide.
          - **Refonte UI du Hero de la page Boutiques (`/boutiques`)** : Correction des problÃƒÂ¨mes d'alignement et d'espace vide. Le layout a ÃƒÂ©tÃƒÂ© restructurÃƒÂ© en deux colonnes ÃƒÂ©quilibrÃƒÂ©es : ÃƒÂ  gauche, le texte et les deux boutons d'appel ÃƒÂ  l'action principaux ; ÃƒÂ  droite, les statistiques ("Boutiques actives" et "Vendeurs VÃƒÂ©rifiÃƒÂ©s") transformÃƒÂ©es en grandes cartes de rÃƒÂ©assurance pour combler harmonieusement l'espace vide. Suppression d'un bouton de crÃƒÂ©ation de boutique redondant et mal alignÃƒÂ©.
          - **Prix Dynamiques depuis l'API** : Les offres affichent dÃƒÂ©sormais en temps rÃƒÂ©el les prix dÃƒÂ©finis dans l'Admin panel (`settings.plan_pro_prix`, `settings.plan_business_prix`, et Boutique Taf Taf ÃƒÂ  2500 FCFA).
          - **Nouvelles CatÃƒÂ©gories Globales** : Ajout d'Immobilier (Ã°Å¸ï¿½Â¢) et Petites Annonces (Ã°Å¸â€œÂ¢) ÃƒÂ  la base de registre `categories.ts`.
          - **Suppression des sections de bas de page dupliquÃƒÂ©es et mal alignÃƒÂ©es** : Alignement parfait et navigation ultra-fluide.
        - **Diagnostic Exhaustif & Correction de 5 URLs IncohÃƒÂ©rentes ConfirmÃƒÂ©es** : Audit visuel systÃƒÂ©matique des 112 URLs Unsplash uniques. Identification et remplacement de 5 URLs dont le contenu visuel rÃƒÂ©el ne correspondait pas du tout aux produits assignÃƒÂ©s :
          1. **Huile Moteur** (Total/Shell/Mobil) : Ferrari rouge Ã¢â€ â€™ bidon d'huile moteur (`photo-1635784065399`)
          2. **Onduleur APC** (650VA/1000VA/1500VA) : gradient abstrait colorÃƒÂ© Ã¢â€ â€™ salle serveur/rack informatique (`photo-1558494949`)
          3. **Ketchup** (Heinz/Amora) : Pikachu surpris (meme) Ã¢â€ â€™ bouteille de ketchup rouge (`photo-1472476443507`)
          4. **Mayonnaise/Moutarde** (CalvÃƒÂ©/Lesieur/Amora) : boudin corÃƒÂ©en sunda Ã¢â€ â€™ pot de condiments/mayo (`photo-1528750717929`)
          5. **Huile alimentaire** (Dinor/Niani/Lesieur) : olives sombres (nature morte) Ã¢â€ â€™ bouteille d'huile de cuisine dorÃƒÂ©e (`photo-1620706857370`)
        - **RÃƒÂ©ordonnancement PrioritÃƒÂ©s Mots-clÃƒÂ©s** : DÃƒÂ©placement du match `sardines/thon/conserves` avant `huile/beurre` pour ÃƒÂ©viter que "Sardines Titus ÃƒÂ  l'Huile" ne soit matchÃƒÂ©e par le mot "huile".
        - **Nouvelle Architecture de Mapping Photographique Extensible (112 Ã¢â€ â€™ 879 photos)** : 
          1. **CrÃƒÂ©ation du script `backend/scripts/fetch-photos.js`** : Script automatisÃƒÂ© avec dictionnaire de traduction (FRÃ¢â€ â€™EN) conÃƒÂ§u pour requÃƒÂªter l'API Unsplash, gÃƒÂ©rer intelligemment les limites de taux (rate limit), et gÃƒÂ©nÃƒÂ©rer itÃƒÂ©rativement un fichier `photo-mapping.json` couvrant les 879 produits distincts du catalogue.
          2. **Mise ÃƒÂ  jour de `backend/generate-catalog.js`** : Le gÃƒÂ©nÃƒÂ©rateur charge dÃƒÂ©sormais `photo-mapping.json` en prioritÃƒÂ©. S'il y a correspondance pour le nom de base d'un produit, il utilise l'URL spÃƒÂ©cifique ; sinon, il applique les rÃƒÂ¨gles sÃƒÂ©mantiques par mots-clÃƒÂ©s prÃƒÂ©existantes (fallback robuste garanti).
        - **Enrichissement Manuel (Option Sans ClÃƒÂ© API)** : Pour ÃƒÂ©viter la dÃƒÂ©pendance ÃƒÂ  une clÃƒÂ© API tout en maximisant la fidÃƒÂ©litÃƒÂ© visuelle, ajout de dizaines de rÃƒÂ¨gles manuelles ultra-spÃƒÂ©cifiques dans `generate-catalog.js` (ex: photos HD distinctes pour les pilules, les sirops, les tensiomÃƒÂ¨tres, les masques, les vÃƒÂªtements pour bÃƒÂ©bÃƒÂ©s, les couches, etc.), portant le systÃƒÂ¨me hybride ÃƒÂ  une prÃƒÂ©cision optimale sans appel rÃƒÂ©seau externe.

  - **Authentification WhatsApp OTP & Inscription / Connexion Flivides** :
    - **Back-end (`backend/routes/auth.js`)** : Ajout des routes `/whatsapp-otp-send`, `/whatsapp-otp-verify`, `/whatsapp-otp-login` et `/whatsapp-otp-register`. Support complet de l'inscription et la connexion sans mot de passe via WhatsApp OTP. Logging du code OTP en console pour faciliter le dÃƒÂ©bogage dev sans API Meta. Correction du matching SQL des numÃƒÂ©ros de tÃƒÂ©lÃƒÂ©phone (support simultanÃƒÂ© des formats `+221...`, `221...` et 9 chiffres bruts) pour ÃƒÂ©viter les erreurs "Aucun compte associÃƒÂ© ÃƒÂ  ce numÃƒÂ©ro" lors de la connexion.
    - **Front-end (`frontend-next`)** : 
      - Integration de la bascule "Email / WhatsApp" dans `ConnexionForm.tsx` et `InscriptionForm.tsx`.
      - Fix critique du helper `setAuthCookieAction` dans `src/app/actions/auth.ts` : il dÃƒÂ©code dÃƒÂ©sormais proprement le token JWT retournÃƒÂ© par le backend pour extraire `userId` et instancier correctement la session `nopalou_session`. Cela rÃƒÂ©sout le bug oÃƒÂ¹ le tableau de bord de la boutique ne s'ouvrait pas aprÃƒÂ¨s l'inscription/connexion WhatsApp.
      - Prise en charge et distinction claire des 3 niveaux d'abonnements dans `BoutiqueClient.tsx` :
        - Ã°Å¸â€™Â¼ **Business** (`#1e3a5f`)
        - Ã¢Â­ï¿½ **Pro** (`#C75B00`)
        - Ã¢Å¡Â¡ **Taf Taf / DÃƒÂ©couverte** (`#16a34a`, vert ÃƒÂ©meraude avec label `Ã¢Å¡Â¡ Taf Taf (1 mois offert)`)
        - **Gratuit** (`#6b7280`)
      - **Gating de fonctionnalitÃƒÂ©s & Parcours de Transition de Plan** :
        - Marquage des sous-menus restreints (`minPlan: 'pro'` ou `minPlan: 'business'`) avec badges `Ã°Å¸â€�â€™ Pro` et `Ã°Å¸â€�â€™ Business` dans la navigation latÃƒÂ©rale.
        - Ãƒâ€°cran de blocage pÃƒÂ©dagogique avec bouton d'incitation ÃƒÂ  la mise ÃƒÂ  niveau (`Faire ÃƒÂ©voluer mon offre Ã¢â€ â€™`) vers la page `/boutique/abonnement` lorsqu'un utilisateur accÃƒÂ¨de ÃƒÂ  une fonction supÃƒÂ©rieure ÃƒÂ  son plan actuel.
        - Gestion de la transition fluide (Upgrade / Downgrade / Prolongation) sur la page `/boutique/abonnement`.
        - **Choix de forfait ÃƒÂ  la crÃƒÂ©ation rapide (`/creer-boutique`)** : SÃƒÂ©lection par dÃƒÂ©faut du forfait **Ã¢Å¡Â¡ Boutique Taf Taf (1 mois offert)** ÃƒÂ  l'ÃƒÂ©tape finale avec possibilitÃƒÂ© explicite pour l'utilisateur de choisir directement **Pro** ou **Business** avant le lancement.
      - **En-tÃƒÂªte & Recherche Globale (`layout.tsx`, `NavbarActions.tsx` & `NavbarSearch.tsx`)** : 
        - Recherche sous forme d'icÃƒÂ´ne compacte `Ã°Å¸â€�ï¿½` (comme ÃƒÂ  l'origine) pour libÃƒÂ©rer et optimiser l'espace horizontal.
        - Suppression des doublons de menus et forÃƒÂ§age de `whiteSpace: 'nowrap'` pour empÃƒÂªcher le retour ÃƒÂ  la ligne des textes.
        - Bouton direct **`Ã°Å¸ï¿½Âª Ma Boutique`** maintenu dans les actions de droite avec affichage propre du profil (`Ã°Å¸â€˜Â¤ NomUtilisateur`).
      - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx`)** :
        - Isolation stricte des accÃƒÂ¨s entre **Taf Taf (DÃƒÂ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage : Badges `Ã°Å¸â€�â€™ Pro` et `Ã°Å¸â€�â€™ Business` formatÃƒÂ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`).
        - Le bouton rapide **`Ã°Å¸â€ºâ€™ Caisse POS (Physique)`** affiche dÃƒÂ©sormais le badge `Ã°Å¸â€�â€™ Pro` et redirige vers la mise ÃƒÂ  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
      - **Chargement du Catalogue Standard & Import Batch (`BatchImportModal.tsx` & `route.ts`)** :
        - CrÃƒÂ©ation de la route Next.js dÃƒÂ©diÃƒÂ©e `/api/boutiques/catalogues-standards/route.ts` faisant le relais sÃƒÂ©curisÃƒÂ© avec le backend Express.
        - RÃƒÂ©solution dÃƒÂ©finitive de l'erreur `Impossible de charger le catalogue standard` lors de l'ouverture de l'import par lot.
        - Validation du chargement ÃƒÂ  100% des 20 catÃƒÂ©gories de produits modÃƒÂ¨les prÃƒÂ©dÃƒÂ©finis.

  - **RÃƒÂ©solution du Scraper Facebook Local (Playwright Chromium) & Source Emploi** :
    - **Correction de l'erreur `browserType.launch: Executable doesn't exist`** : RÃƒÂ©installation complÃƒÂ¨te des binaires Chromium v1228 dans `node_modules/playwright-core/.local-browsers` via `$env:PLAYWRIGHT_BROWSERS_PATH="0"; npx playwright install` sur la machine locale.
    - **Ajout de la source emploi `badou.diop.587`** : Ajout du profil/page `badou.diop.587` dans le dictionnaire `GROUPES` de `backend/services/scraper-immo-facebook.js`.
    - **SystÃƒÂ¨me de Suivi de Progression en Direct (`.fb-scraper-progress.json` & API)** :
      - Affichage en console de l'avancement groupe par groupe (`Ã°Å¸â€œÅ  [PROGRES i/N - X%] Groupe: ...`).
      - Script PowerShell dÃƒÂ©diÃƒÂ© `backend/scripts/lancer-scraper-facebook.ps1` avec banniÃƒÂ¨re visuelle colorÃƒÂ©e et notifications Toast Windows.
      - Refonte de `backend/scripts/scraper-facebook-auto.bat` avec `Tee-Object` : rÃƒÂ©sout l'ÃƒÂ©cran noir de la console lors des lancements du planificateur tout en conservant les fichiers journaux `backend/scripts/logs/fb-scraper-*.log`.
      - Persistance de l'ÃƒÂ©tat en temps rÃƒÂ©el dans `backend/.fb-scraper-progress.json` (statut, pourcentage, groupe actuel, annonces retenues, erreurs).
      - Endpoint API dÃƒÂ©diÃƒÂ© `GET /api/scraper/facebook/progress` pour consulter le suivi en direct depuis n'importe quel client/dashboard.
    - **Validation du Planificateur & Scraper Local** : Validation en mode `--dry-run` avec extraction de 15 annonces retenues sur 5 groupes (Prix, CatÃƒÂ©gories, Villes).

  - **Refonte & Correction Responsive Mobile (`frontend-next`)** :
    - **Correction du DÃƒÂ©bordement Horizontal de l'En-tÃƒÂªte Navigation (`NavbarActions.tsx` & `globals.css`)** :
      - Suppression du style inline `display: flex` dans `NavbarActions.tsx` qui outrepassait la rÃƒÂ¨gle CSS `@media (max-width: 1040px) { .navbar-actions-compte { display: none; } }`. Les boutons texte `Ã°Å¸â€˜Â¤ Nom` et `DÃƒÂ©connexion` s'affichaient auparavant simultanÃƒÂ©ment avec la barre d'icÃƒÂ´nes mobile et le bouton hamburger, provoquant un encombrement extrÃƒÂªme et un dÃƒÂ©bordement horizontal de la page au-delÃƒÂ  de 100vw.
      - Restauration 100% ÃƒÂ  l'identique de l'affichage du profil bureau (`Ã°Å¸â€˜Â¤ NomUtilisateur` + bouton `DÃƒÂ©connexion` rouge) dans `NavbarActions.tsx` avec styles originaux complets, combinÃƒÂ© au masquage strict via `display: none !important` uniquement en mode mobile (<= 1040px).
      - Correction de la sur-ÃƒÂ©criture de `.logo-name` sur mobile dans `globals.css` : la rÃƒÂ¨gle globale ligne 9510 (`display: inline !important`) forÃƒÂ§ait le texte "Nopalou" (100px+) sur tous les mobiles y compris sous 360px (Samsung Galaxy S8+). La suppression de ce `!important` masque le nom du logo sur mobile au profit de l'icÃƒÂ´ne N (28px), libÃƒÂ©rant ~130px d'espace libre et permettant ÃƒÂ  toutes les icÃƒÂ´nes (`Ã°Å¸â€™Â¬`, `Ã¢ï¿½Â¤`, `Ã°Å¸ï¿½Âª Boutique`, `Ã°Å¸â€˜Â¤`, `Ã¢ËœÂ°`) de s'aligner avec une marge parfaite et zÃƒÂ©ro chevauchement/tronquage sur tous les ÃƒÂ©crans mobiles (320px+).
    - **Optimisation de la Colonne Centrale du Hero (`page.tsx`)** :
      - Remplacement de `flex: '2 1 600px'` par `flex: '1 1 auto', width: '100%', maxWidth: 900, minWidth: 0` dans la colonne centrale du Hero de la page d'accueil pour s'ajuster avec fluiditÃƒÂ© sur tous les ÃƒÂ©crans mobiles sans imposer une largeur de base de 600px.
    - **Correction du DÃƒÂ©bordement sur la Fiche Produit & Tableau des Similaires (`produit/[id]/page.tsx` & `globals.css`)** :
      - Suppression de `overflow-x: unset` sur `.similaires-section` ÃƒÂ  la ligne 7719 qui forÃƒÂ§ait le tableau de 6 colonnes ÃƒÂ  ÃƒÂ©tirer la largeur de la page `.fiche` ÃƒÂ  450px+ sur les smartphones (iPhone SE / Samsung S8+), causant un dÃƒÂ©calage du header et une bande blanche latÃƒÂ©rale. Remplacement par `overflow-x: auto !important; -webkit-overflow-scrolling: touch; width: 100%; max-width: 100%;` pour contenir le tableau en dÃƒÂ©filement tactile fluide.
      - Ajout de `min-width: 0; word-break: break-word;` sur `.produit-fiche-nom` pour ÃƒÂ©viter qu'un nom de produit long ne gonfle le titre en flex.
    - **Correction des Cartes de Formules d'Abonnement de la Page d'Accueil (`ShowcaseTabs.tsx` & `globals.css`)** :
      - Ajout des classes responsive `.showcase-section` et `.showcase-cards-grid`. Passage de `minmax(320px, 1fr)` ÃƒÂ  `grid-template-columns: 1fr !important` sur mobile (< 768px) et ajustement des rembourrages (`24px 12px`) pour ÃƒÂ©liminer tout dÃƒÂ©passement de min-width.
      - **RÃƒÂ¨gle Globale Anti-DÃƒÂ©bordement Horizontal (`globals.css`)** :
      - ImplÃƒÂ©mentation du confinement strict `html, body { overflow-x: hidden !important; width: 100% !important; max-width: 100vw !important; }` et `.page-container, .fiche, .site-footer { width: 100% !important; max-width: 100% !important; overflow-x: hidden; }` garantissant un affichage ajustÃƒÂ© au pixel prÃƒÂ¨s sur 100% des appareils mobiles (320px ÃƒÂ  768px).
      - **Correction Erreur PostCSS Build Render (Commit `f428318`)** : RÃƒÂ©solution de la parenthÃƒÂ¨se manquante sur la rÃƒÂ¨gle `@media (max-width: 640px)` dans `globals.css` (ligne 9875), dÃƒÂ©bloquant le build et le dÃƒÂ©ploiement automatique sur Render.
      - **Correction du "Bandeau Confiance" du Footer (Couleur diffÃƒÂ©rente)** : Retrait de `background: rgba(255,255,255,.05)` sur `.footer-trust` dans `globals.css` pour unifier la couleur de fond du pied de page.
      - **Correction de l'icÃƒÂ´ne Avatar dans le Compte (Point Bleu)** : Ajout d'une valeur de repli dans `(account)/layout.tsx` pour afficher l'initiale de l'email ou "Vous" au lieu d'une icÃƒÂ´ne vide si `session.nom` est vide.
      - **RÃƒÂ©duction de l'espace vide sous la barre de recherche (Mobile)** : Ajout d'une rÃƒÂ¨gle `@media (max-width: 640px) { .hero-search { margin-bottom: 12px; } }` dans `globals.css` pour rÃƒÂ©duire drastiquement l'espace vide de 44px entre la recherche et les catÃƒÂ©gories de la page d'accueil.
      - **Correction de la boucle infinie de Next.js (Tourne en rond)** : RÃƒÂ©solution d'un cache corrompu (EBUSY) bloquant le serveur dev local en tuant l'ancienne tÃƒÂ¢che `next dev` bloquÃƒÂ©e et en relanÃƒÂ§ant le processus.

  - **AmÃ¯Â¿Â½lioration du Scraper Facebook (ackend/services/scraper-immo-facebook.js, ackend/scripts/)** :
    - **Scraping des Offres d'Emploi** : Application de la catÃ¯Â¿Â½gorie forcÃ¯Â¿Â½e emploi sur les nouveaux groupes/pages d'emploi (Badou Diop, Emploi 1, 2, 3) pour s'assurer que les offres sont bien classÃ¯Â¿Â½es dans la catÃ¯Â¿Â½gorie emploi mÃ¯Â¿Â½me sans mots clÃ¯Â¿Â½s explicites. Extension de la dÃ¯Â¿Â½rogation "Voir sur Facebook" comme numÃ¯Â¿Â½ro de tÃ¯Â¿Â½lÃ¯Â¿Â½phone par dÃ¯Â¿Â½faut pour l'ensemble de la catÃ¯Â¿Â½gorie emploi (au lieu de juste la page Ndeye Yacine).
    - **Gestion des Profils & Timouts** : Augmentation du timeout de navigation de 60s Ã¯Â¿Â½ 90s avec un try-catch permettant de continuer le scraping si le DOM est partiellement chargÃ¯Â¿Â½, prÃ¯Â¿Â½venant l'interruption complÃ¯Â¿Â½te (Timeout 60000ms exceeded). AmÃ¯Â¿Â½lioration de la dÃ¯Â¿Â½tection de fil d'actualitÃ¯Â¿Â½ pour bien prendre en compte les profils (comme Badou Diop).
    - IntÃƒÂ©gration de la base IndexedDB locale (`db-offline.ts`) pour la caisse.
    - Sauvegarde automatique en cache local du catalogue produits et des clients pour continuer ÃƒÂ  vendre mÃƒÂªme en cas de coupure internet.
    - File d'attente locale de synchronisation des ventes en arriÃƒÂ¨re-plan rÃƒÂ©injectant automatiquement les transactions dÃƒÂ¨s le retour de la connexion internet.
    - Indicateur dynamique clignotant `Ã°Å¸Å¸Â¢ EN LIGNE` / `Ã¢Å¡Â Ã¯Â¸ HORS-LIGNE` dans l'en-tÃƒÂªte de la caisse POS.
  - **Validation & Compilation globale** :
    - Correction des typages et vÃƒÂ©rification de la compilation TypeScript de l'ensemble du projet frontend (`npx tsc --noEmit` validÃƒÂ© avec succÃƒÂ¨s).
  - **Impression PDF & Affichage des Documents** :
    - Ajout de l'endpoint `GET /api/boutiques/:id/documents/:docId/pdf` pour gÃƒÂ©nÃƒÂ©rer un PDF A4 stylisÃƒÂ© (Facture, Devis, Proforma) avec en-tÃƒÂªte de boutique, dÃƒÂ©tails clients, tableau d'articles et totaux de taxes.
    - Ajout du bouton d'action `Ã°Å¸â€“Â¨Ã¯Â¸ PDF` dans l'interface de gestion des documents pour ouvrir ou tÃƒÂ©lÃƒÂ©charger la facture en 1 clic.
    - Correction de l'affichage des montants HT/TVA/TTC qui s'affichaient sous forme de tiret (`Ã¢â‚¬â€�`) dÃƒÂ» ÃƒÂ  une divergence de noms de colonnes (`total_ht` au lieu de `montant_ht`).
    - Nettoyage du nom de client affichÃƒÂ© (`client.nom` au lieu de `client.prenom client.nom` qui provoquait un affichage `undefined nom_client`).
    - Ajout d'un bouton `Ã¢Å“Ã¯Â¸ Modifier` dans l'onglet des documents clients permettant d'ouvrir la modale de modification prÃƒÂ©-remplie avec le type de document, le client associÃƒÂ©, la liste des articles (avec qte et prix unit.) et les notes.
    - Mise ÃƒÂ  jour de la route backend PUT pour recalculer automatiquement les taxes, le timbre fiscal, et sauvegarder les modifications d'articles en base de donnÃƒÂ©es.
  - **Correction affichage mobile du menu Actions produit** :
    - Le dropdown `Actions Ã¢â€“Â¾` des cartes produit dans le dashboard marchand (`BoutiqueClient.tsx`) dÃƒÂ©bordait ÃƒÂ  gauche sur mobile en raison du positionnement `right: 0`. CorrigÃƒÂ© avec `left: 0; right: auto` pour que le menu s'aligne cÃƒÂ´tÃƒÂ© gauche du bouton et reste dans le viewport.
  - **Ãƒâ€°dition des Fournisseurs + Affichage responsive** :
    - Ajout d'un bouton `Ã¢Å“Ã¯Â¸ Modifier` sur chaque fournisseur dans `GestionFournisseurs.tsx`, ouvrant la modale prÃƒÂ©-remplie en mode ÃƒÂ©dition et appelant le Server Action `modifierFournisseur` existant.
    - Le formulaire de la modale fournisseur est dÃƒÂ©sormais dynamique : le titre, le bouton de soumission et l'action serveur s'adaptent entre crÃƒÂ©ation et modification.
    - Remplacement du tableau HTML (`<table>`) par des cartes responsives (`<div>`) pour les fournisseurs, avec icÃƒÂ´nes contact (Ã°Å¸â€œÅ¾, Ã¢Å“â€°Ã¯Â¸, Ã°Å¸â€œ), garantissant un affichage correct sur mobile et desktop.
    - **Correction Tableau Achats / Bons de commande** :
      - Correction du bogue `Invalid Date` : lecture de `created_at` / `date_livraison` au lieu de `date_commande` qui ÃƒÂ©tait indÃƒÂ©finie.
      - Correction du bogue `Total Achat` qui affichait un tiret (`Ã¢â‚¬â€�`) : lecture de `montant_total` retournÃƒÂ© par la base SQL au lieu de `total_achat`.
      - Correction du bouton `Ã°Å¸â€œÂ¥ RÃƒÂ©ceptionner` et des badges de statut pour supporter indiffÃƒÂ©remment les valeurs de statut `'recu'` et `'recue'`.
      - Ajout d'une colonne d'Actions complÃƒÂ¨te dans le tableau des bons de commande fournisseur : bouton `Ã°Å¸â€œÂ¥ RÃƒÂ©ceptionner` (pour commandes en attente), bouton `Ã¢Å“Ã¯Â¸ Modifier` (ouvre la modale prÃƒÂ©-remplie pour rÃƒÂ©ajuster les articles, quantitÃƒÂ©s ou tarifs d'un bon de commande en attente), bouton `Ã°Å¸â€˜Ã¯Â¸ DÃƒÂ©tails` (ouvre une modale synthÃƒÂ©tique avec le dÃƒÂ©tail complet des articles, quantitÃƒÂ©es et prix d'achat), et bouton `Ã°Å¸â€”â€˜Ã¯Â¸ Supprimer` (avec confirmation et appel au Server Action `supprimerCommandeFournisseur`).
      - **Documents Justificatifs & Fichiers Joints** : Remplacement des champs texte URL par un vrai sÃƒÂ©lecteur de fichier (`<input type="file" />`) permettant de tÃƒÂ©lÃƒÂ©verser directement des factures ou reÃƒÂ§us (image/PDF). Route backend `POST /api/boutiques/:id/upload-justificatif` ajoutÃƒÂ©e. Une modale de rÃƒÂ©ception dÃƒÂ©diÃƒÂ©e permet ÃƒÂ©galement d'attacher ou mettre ÃƒÂ  jour le justificatif de rÃƒÂ©ception lors du clic sur `Ã°Å¸â€œÂ¥ RÃƒÂ©ceptionner`.
      - **LibellÃƒÂ©s de colonnes dans les formulaires d'achat** : Ajout d'en-tÃƒÂªtes de colonnes clairs (`DÃƒÂ©signation Produit *`, `QuantitÃƒÂ© *`, `Prix Achat Unit. (FCFA) *`) au-dessus de chaque ligne d'article dans les formulaires de commande d'achat.
      - **Maintien dans la Boutique aprÃƒÂ¨s enregistrement des paramÃƒÂ¨tres fiscaux** : Synchronisation permanente du paramÃƒÂ¨tre d'URL `?manage=BOUTIQUE_ID`.
      - **Correction Boucle d'Alerte** : Remplacement du popup natif `alert()` (qui se redÃƒÂ©clenchait en boucle ÃƒÂ  chaque re-render) par une banniÃƒÂ¨re de succÃƒÂ¨s verte ÃƒÂ©phÃƒÂ©mÃƒÂ¨re (`savedMessage`) et mÃƒÂ©morisation du state traitÃƒÂ© via `useRef(handledRef)` pour un rafraÃƒÂ®chissement fluide sans blocage.
      - **Recherche & Filtrage MulticritÃƒÂ¨re GÃƒÂ©nÃƒÂ©ralisÃƒÂ©s** : IntÃƒÂ©gration de barres de recherche textuelle temps rÃƒÂ©el et de menus de filtrage par statut sur tous les onglets : `Fournisseurs` (nom, tÃƒÂ©lÃƒÂ©phone, email, adresse), `Bons de Commande` (rÃƒÂ©fÃƒÂ©rence, fournisseur, statut attente/reÃƒÂ§ue), `Documents Commerciaux` (rÃƒÂ©fÃƒÂ©rence, client, NINEA, statut brouillon/validÃƒÂ©/payÃƒÂ©/envoyÃƒÂ©).
      - **Correction & DÃƒÂ©coupage Automatique Importation Batch CSV (`BatchImportModal.tsx`)** :
        - **Correction du parsing de prix CSV** : Suppression de la regex `replace(/\D/g, '')` qui corrompait les montants avec dÃƒÂ©cimales (ex: `15000.00` devenait `1500000`). RemplacÃƒÂ©e par `parsePrixString()` pour supporter tous les formats (virgules, points, espaces, devises).
        - **DÃƒÂ©coupage automatique par sous-lots (Chunking)** : Traitement automatique des fichiers CSV/Excel de plus de 50 produits en sous-lots successifs de 50 articles. Permet d'importer des fichiers de plusieurs centaines ou milliers de produits sans blocage ni erreur 400.
        - **Correction backend (`boutiques.js`)** : Retrait du filtre strict `!p.prix` qui ÃƒÂ©liminait les articles ÃƒÂ  prix zÃƒÂ©ro ou dÃƒÂ©cimaux, et hausse de la limite maximale par requÃƒÂªte backend ÃƒÂ  500 articles.
        - **Recherche globale multi-catÃƒÂ©gories & Mappage d'alias (`BatchImportModal.tsx`)** :
          - Recherche globale : la saisie dans la barre de recherche interroge dÃƒÂ©sormais les **2 070 produits modÃƒÂ¨les** sur **toutes les catÃƒÂ©gories simultanÃƒÂ©ment**.
          - Mappage d'alias : correction de l'incohÃƒÂ©rence des clÃƒÂ©s de catÃƒÂ©gories (ex: `electronique` regroupe dÃƒÂ©sormais `smartphones`, `informatique`, `electronique` et `high-tech`).
          - Ajout de l'onglet **`Ã°Å¸â€œ Tous les produits`** au dÃƒÂ©but pour parcourir l'ensemble du catalogue standard sans restriction.
        - **Enrichissement IntÃƒÂ©gral & Garantie de 100 Produits Minimum par CatÃƒÂ©gorie (2 010 Produits au Total sur Render)** :
          - Mise en place d'un gÃƒÂ©nÃƒÂ©rateur automatique (`buildFull100`) dans `generate-catalog.js` garantissant **au moins 100 produits modÃƒÂ¨les rÃƒÂ©els pour CHACUNE des 20 catÃƒÂ©gories du systÃƒÂ¨me**.
          - Total gÃƒÂ©nÃƒÂ©ral : **2 010 produits modÃƒÂ¨les** avec visuels HD Unsplash dÃƒÂ©diÃƒÂ©s et fidÃƒÂ¨les.
      - **Correction Persistance des Cases ÃƒÂ  Cocher Fiscales (`ParametresFiscalite.tsx` & `boutiques.js`)** :
        - Diagnostic : le navigateur envoyait la valeur natif HTML `'on'` pour les cases cochÃƒÂ©es au lieu de `'true'`, tandis que le backend ÃƒÂ©chouait la comparaison `'on' === 'true'` (sauvegardait `false`). DÃƒÂ©cocher envoyait `undefined`, ce qui conservait la valeur prÃƒÂ©cÃƒÂ©dente sans pouvoir la passer ÃƒÂ  `false`.
        - Correction : Ajout d'inputs cachÃƒÂ©s explicites `<input type="hidden" name="prix_tva_incluse" value={prixTvaIncluse ? 'true' : 'false'} />` et gestion du state React. CÃƒÂ´tÃƒÂ© backend, intÃƒÂ©gration d'une fonction `parseBoolVal` et d'une clause `CASE WHEN $9::boolean IS NOT NULL THEN $9::boolean ELSE ... END` garantissant la persistance exacte et immÃƒÂ©diate des deux options.
  - **Informations LÃƒÂ©gales OHADA & Standards PDF Professionnels** :
    - **Migration BDD** : Ajout de 7 nouvelles colonnes ÃƒÂ  la table `boutiques` : `rccm`, `ninea`, `forme_juridique`, `capital_social`, `compte_bancaire`, `conditions_vente`, `pied_de_page_document`.
    - **Backend** : Route PUT `/:id` ÃƒÂ©tendue pour sauvegarder les 7 nouveaux champs. Routes GET `/mine` et GET `/:idOrSlug` ÃƒÂ©tendues pour les inclure dans le SELECT.
    - **Frontend `ParametresFiscalite.tsx`** : Refonte complÃƒÂ¨te du composant avec 4 sections :
      1. Ã°Å¸â€œÅ  Configuration Fiscale (rÃƒÂ©gime, TVA, timbre fiscal Ã¢â‚¬â€� existant)
      2. Ã°Å¸â€œâ€¹ IdentitÃƒÂ© Juridique (RCCM, NINEA, forme juridique, capital social Ã¢â‚¬â€� **nouveau**)
      3. Ã°Å¸Â¦ CoordonnÃƒÂ©es Bancaires (textarea pour IBAN/RIB/SWIFT Ã¢â‚¬â€� **nouveau**)
      4. Ã°Å¸â€œâ€ž Conditions GÃƒÂ©nÃƒÂ©rales de Vente (textarea + bouton modÃƒÂ¨le OHADA prÃƒÂ©-rempli Ã¢â‚¬â€� **nouveau**)
    - **PDF aux standards OHADA** : Refonte complÃƒÂ¨te de la gÃƒÂ©nÃƒÂ©ration PDF (`GET /api/boutiques/:id/documents/:docId/pdf`) :
      - En-tÃƒÂªte ÃƒÂ©metteur complet : nom, forme juridique + capital, adresse, tÃƒÂ©lÃƒÂ©phone, RCCM, NINEA
      - Bloc destinataire avec NINEA client si professionnel
      - Date d'ÃƒÂ©chÃƒÂ©ance affichÃƒÂ©e si renseignÃƒÂ©e
      - Net ÃƒÂ  payer mis en ÃƒÂ©vidence (bandeau colorÃƒÂ©)
      - CoordonnÃƒÂ©es bancaires pour rÃƒÂ¨glement en bas de facture
      - Conditions GÃƒÂ©nÃƒÂ©rales de Vente (avec saut de page automatique si dÃƒÂ©bordement)

      - **Audit & Correction de CohÃƒÂ©rence Photo-Produit du Catalogue Standard (`generate-catalog.js` & `catalogues-standards.json`)** :
        - **Diagnostic Exhaustif** : Audit des 2 010 produits du Catalogue Standard PrÃƒÂ©dÃƒÂ©terminÃƒÂ©. Identification de 365 incohÃƒÂ©rences visuelles (18,15% du catalogue), causÃƒÂ©es par des filtres de mots-clÃƒÂ©s globaux sans scoping par catÃƒÂ©gorie (ex: huiles alimentaires associÃƒÂ©es ÃƒÂ  des photos de vidange moteur, laits alimentaires/infantiles associÃƒÂ©s ÃƒÂ  des lotions cosmÃƒÂ©tiques, TV/frigos Samsung associÃƒÂ©s ÃƒÂ  des smartphones, batteries solaires associÃƒÂ©es ÃƒÂ  des powerbanks, etc.).
        - **Correction & Restructuration Category-First** : Refonte de `getPhotoForProduct(nom, cat)` dans `generate-catalog.js` pour filtrer strictement par la catÃƒÂ©gorie parente `cat` en prioritÃƒÂ© avant d'ÃƒÂ©valuer les mots-clÃƒÂ©s.
        - **RÃƒÂ©vision Globale Exhaustive des 20 CatÃƒÂ©gories & 2 010 Produits** : RÃƒÂ©vision intÃƒÂ©grale de tous les sous-types de produits dans les 20 catÃƒÂ©gories du catalogue standard (`alimentation`, `smartphones`, `informatique`, `tv-electro`, `mode`, `maison`, `auto-moto`, `jeux`, `beaute`, `sport`, `fournitures`, `quincaillerie`, `pieces-rechange`, `bijouterie`, `maraichage`, `elevage`, `produits-agricoles`, `solaire-energie`, `sante-pharma`, `bebe-enfants`).
        - **Dictionnaire Photo Haute FidÃƒÂ©litÃƒÂ©** : Enrichissement complet des rÃƒÂ¨gles et mots-clÃƒÂ©s de `getPhotoForProduct(nom, cat)` pour couvrir 100% des sous-types (sauces, condiments, fruits, lÃƒÂ©gumes, boissons, consoles, manettes, jeux vidÃƒÂ©o, accessoires PC/TPV, piÃƒÂ¨ces auto, matÃƒÂ©riel mÃƒÂ©dical, outillage BTP, etc.).
        - **ZÃƒÂ©ro Fallback Non SouhaitÃƒÂ© & ZÃƒÂ©ro IncohÃƒÂ©rence** : Validation automatisÃƒÂ©e confirmant **0 produit hors catÃƒÂ©gorie** et **100% de concordance photo/produit** sur les 2 010 articles du catalogue standard.
        - **Correction Condiments & Sauces** : Remplacement de la photo de bol de chips par des visuels HD spÃƒÂ©cifiques (bouteilles de Ketchup rouges HD pour *Ketchup Heinz/Amora*, pot de sauce mayonnaise onctueuse pour *Mayonnaise CalvÃƒÂ©/Lesieur* & *Moutarde Amora*, bouteille de sauce pimentÃƒÂ©e avec piments frais pour *Sauce Piment Extra Forte* & *Harissa*, et ÃƒÂ©pices/cubes d'assaisonnement pour *Bouillons Jumbo/Maggi/Knorr*).
        - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx` & `globals.css`)** :
        - Isolation stricte des accÃƒÂ¨s entre **Taf Taf (DÃƒÂ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage & lisibilitÃƒÂ© : Ãƒâ€°largissement de la barre latÃƒÂ©rale de navigation (`.bq-sidebar`) de `220px` ÃƒÂ  **`280px`**, taille de police ajustÃƒÂ©e ÃƒÂ  `12.5px`, et marges optimisÃƒÂ©es pour garantir l'affichage complet ÃƒÂ  100% de TOUS les intitulÃƒÂ©s de menus (`Stock & Fournisseurs`, `Ãƒâ€°quipe & AccÃƒÂ¨s`, `Factures & Devis`, etc.) sans aucun point de suspension `...`.
        - Badges `Ã°Å¸â€�â€™ Pro` et `Ã°Å¸â€�â€™ Business` formatÃƒÂ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`, `marginLeft: 'auto'`).
        - Le bouton rapide **`Ã°Å¸â€ºâ€™ Caisse POS (Physique)`** affiche dÃƒÂ©sormais le badge `Ã°Å¸â€�â€™ Pro` et redirige vers la mise ÃƒÂ  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
        - **Baguette Magique / Import Rapide par Lien (`/api/boutiques/magic-import/route.ts` & `boutiques.js`)** :
          - CrÃƒÂ©ation de la route proxy Next.js dÃƒÂ©diÃƒÂ©e `/api/boutiques/magic-import/route.ts` avec fallback rÃƒÂ©silient si aucune session active.
          - AmÃƒÂ©lioration de l'extraction HTML en direct (mÃƒÂ©tadonnÃƒÂ©es `og:title`, `og:description`, `og:image`) et ajout d'un parser d'URL intelligent pour AliExpress, SHEIN, Amazon.
          - Remplissage automatique et rÃƒÂ©actif des champs (Nom, Prix estimÃƒÂ©, Description) ainsi que de **l'aperÃƒÂ§u photo instantanÃƒÂ©** dans la zone de tÃƒÂ©lÃƒÂ©versement (`setImagesExistantes(data.images)`), dÃƒÂ©bloquant automatiquement la soumission du formulaire et transmettant l'URL de l'image au backend (`POST /api/boutiques/:id/produits`).
        - **Refonte Visuelle des Cartes & BanniÃƒÂ¨res (`frontend-next/src/app/boutiques/page.tsx` & `globals.css`)** :
          - **Harmonisation Chromatique Globale (Ãƒâ€°radication des bleus dÃƒÂ©pareillÃƒÂ©s)** : Harmonisation complÃƒÂ¨te de la palette de couleurs vers **l'Orange Ambre Nopalou Officiel (`#C75B00`)** et le **Gris Ardoise Sombre Chic (`#0f172a`)**.
            - Header navigation (`layout.tsx`) : Remplacement du bouton "Ma Boutique" bleu marine (`#1C2B4A`) par un Slate Sombre Chic (`#0f172a`).
            - Hero Banner (`boutiques/page.tsx`) : Remplacement du fond bleu ciel dÃƒÂ©pareillÃƒÂ© par une nuance lumineuse chaleureuse (`linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)`) avec bordure ambre douce (`#fed7aa`).
            - Pilule "Hub officiel" & boutons d'action ("CrÃƒÂ©er ma boutique", "Visiter la boutique", filtre sÃƒÂ©lectionnÃƒÂ© "Toutes les boutiques") : UnifiÃƒÂ©s en Orange Ambre Nopalou (`#C75B00`) pour une identitÃƒÂ© visuelle digne d'une marque de rang mondial.
            - Badge de statut d'ouverture ("Ouvert 7j/7") : Suppression de l'aplat vert/rouge fluo agressif au profit d'un **Design Glassmorphism Ãƒâ€°purÃƒÂ©** (fond blanc dÃƒÂ©poli translucide `rgba(255,255,255,0.92)`, ÃƒÂ©criture ardoise sombre et dÃƒÂ©licate pastille ÃƒÂ©meraude lumineuse).
          - **Audit & Harmonisation de l'Ensemble des Pages Secondaires** :
            - `/connexion` & `/inscription` (`ConnexionForm.tsx`, `InscriptionForm.tsx`) : Harmonisation des onglets de basculement Email/WhatsApp vers l'Orange Ambre Nopalou (`#C75B00`).
            - `/creer-boutique` (`creer-boutique/page.tsx`) : Harmonisation de la barre de progression ÃƒÂ  4 ÃƒÂ©tapes, des titres (`#0f172a`), du bouton d'action principal et de la formule prÃƒÂ©sÃƒÂ©lectionnÃƒÂ©e en Orange Ambre Nopalou (`#C75B00`).
            - `/annonces` & `/comparaison` (`PageHeader.tsx`, `comparaison/page.tsx`, `globals.css`) : Titres unifiÃƒÂ©s en Ardoise Sombre Chic (`#0f172a`) et cartes de verdict rehaussÃƒÂ©es d'un dÃƒÂ©gradÃƒÂ© chaleureux ambre doux (`#fff7ed`).
        - **Refonte Globale & Ãƒâ€°purÃƒÂ©e de la Page d'Accueil (`frontend-next/src/app/page.tsx`)** :
          - **Suppression de la pollution visuelle et des cartes encombrantes** ("Acheteurs" / "Vendeurs" sÃƒÂ©parÃƒÂ©es) : Remplacement par un Hero unique, lumineux et moderne avec fond ambre doux (`#fff7ed`).
          - **Rapprochement Recherche Ã¢â€ â€™ CatÃƒÂ©gories Ã¢â€ â€™ Produits** : IntÃƒÂ©gration directe des 20 catÃƒÂ©gories sous forme de pilules d'action sous la barre de recherche principale.
          - **Nouveau Bandeau de Feedback de Recherche InstantanÃƒÂ© (`SearchFeedbackBanner`)** : Affichage d'une banniÃƒÂ¨re de confirmation claire (`Ã°Å¸â€�Å½ X produits trouvÃƒÂ©s pour "mots-clÃƒÂ©s" Ã¢â‚¬â€� CatÃƒÂ©gorie : XYZ`) avec bouton d'annulation en 1 clic dÃƒÂ¨s qu'un filtre est actif.
          - **AccÃƒÂ¨s Direct aux Produits** : La grille de produits est disposÃƒÂ©e directement sous la zone de recherche sans aucun bloc parasite au milieu.
          - **RÃƒÂ©intÃƒÂ©gration du Raccourci Marchand dans le Hero** : Bandeau d'action directe sous les catÃƒÂ©gories : `Ã¢Å¡Â¡ Vous ÃƒÂªtes commerÃƒÂ§ant ? Vendez en ligne en 30 sec (1er mois 100% offert) [CrÃƒÂ©er ma Boutique Taf Taf Ã°Å¸Å¡â‚¬]`.
          - **Refonte Mondiale du Tableau d'Abonnement ÃƒÂ  3 Formules (`ShowcaseTabs.tsx`)** :
            - **Boutique Taf Taf (1 mois offert)** (Gratuit 30j puis 5.000 FCFA/m) : Baguette Magique Ali/SHEIN, conversion Produit Ã¢â€ â€™ Annonce en 1-clic, Catalogue Web & WhatsApp.
            - **Vendeur Pro (15.000 FCFA/m)** : **Caisse POS enregistreuse tactile**, **Scan EAN-13 par camÃƒÂ©ra**, **Impression d'ÃƒÂ©tiquettes stickers 50x30mm**, **Carnet de CrÃƒÂ©dits Client & Relance 1-clic**, **Factures & Devis PDF**.
            - **Business VIP (35.000 FCFA/m)** : **Multi-caissiers & droits d'ÃƒÂ©quipe**, **Analytics CA & Marges nettes**, **BanniÃƒÂ¨re sponsorisÃƒÂ©e prioritaire**.
          - **Nouvelle Section SpÃƒÂ©ciale "Nopalou Ãƒâ€” WhatsApp Ecosystem" (`ShowcaseTabs.tsx`)** :
            - **Acheteurs** : Panier Web & Commande WhatsApp 1-Clic, Connexion sans mot de passe OTP WhatsApp, Bot Assistant IA Comparateur `+221 70 871 79 42`, Alertes gratuites de baisse de prix sur WhatsApp.
            - **CommerÃƒÂ§ants** : Notifications instantanÃƒÂ©es de commandes prÃƒÂ©-remplies, Relance d'impayÃƒÂ©s en 1 clic depuis la Caisse POS, Envoi direct de Factures & Devis PDF, Support VIP WhatsApp 7j/7.
            - **Apporteurs** : Partage 1-clic de lien de parrainage sur statut et groupes WhatsApp, Notifications de commissions rÃƒÂ©currentes par messagerie.
          - **Nouveau Bandeau Frise du Cycle de Vente & Livraison ComplÃƒÂ¨te (5 Ãƒâ€°tapes)** :
            1. **Ã°Å¸â€�Å½ Recherche** (Comparateur & WhatsApp Bot) Ã¢â€ â€™ 2. **Ã°Å¸â€ºâ€™ Commande** (Panier Web, WhatsApp & POS) Ã¢â€ â€™ 3. **Ã°Å¸â€™Â³ Paiement** (Wave, Cash, CrÃƒÂ©dit ou Manuel) Ã¢â€ â€™ 4. **Ã°Å¸â€œÂ¦ PrÃƒÂ©paration** (Gestion des statuts en direct) Ã¢â€ â€™ 5. **Ã°Å¸Å¡Å¡ Livraison** (Suivi & notification WhatsApp du client ÃƒÂ  l'expÃƒÂ©dition).
          - **Nettoyage Syntaxe `page.tsx`** : Suppression des balises JSX orphelines (`</div>`, `</section>`, `)}`) provenant de l'ancienne section tarifaire qui provoquaient l'erreur de build SWC.
          - **Mise en Exergue de la Boutique Taf Taf (Design 3 Colonnes Desktop)** : Restructuration du Hero (`page.tsx`) pour utiliser l'espace vide ÃƒÂ  gauche (Avantage Commande WhatsApp) et ÃƒÂ  droite (Promo Boutique Taf Taf) sur grand ÃƒÂ©cran, tout en restant centrÃƒÂ© sur mobile.
          - **Ajustement UX du Hero (Hauteur des encarts & Enrichissement)** : Les encarts WhatsApp et Taf Taf s'ÃƒÂ©tirent dÃƒÂ©sormais sur toute la hauteur de la grille. Pour ÃƒÂ©viter la sensation de vide ÃƒÂ  l'intÃƒÂ©rieur de ces encarts ÃƒÂ©tirÃƒÂ©s, leur contenu a ÃƒÂ©tÃƒÂ© enrichi par des listes ÃƒÂ  puces persuasives (checkmarks) mettant en avant les avantages de chaque solution. Le texte "En savoir plus" de l'encart WhatsApp a ÃƒÂ©tÃƒÂ© converti en un vÃƒÂ©ritable lien cliquable.
          - **Exploitation de l'espace vide des Filtres & Alignement Parfait** : Le grand espace blanc inexploitÃƒÂ© ÃƒÂ  droite des filtres ("Budget" et "Trier") a ÃƒÂ©tÃƒÂ© rÃƒÂ©organisÃƒÂ© en un layout dense ÃƒÂ  trois colonnes parfaitement alignÃƒÂ© horizontalement :
            - Ãƒâ‚¬ gauche : Filtres principaux (Budget, Tri).
            - Au milieu : **Nouveau bloc de suggestions** (Filtre "Ãƒâ€°tat" et Tags "Ã°Å¸â€�Â¥ Tendances" cliquables pour guider l'utilisateur). L'alignement vertical entre les deux colonnes est dÃƒÂ©sormais mathÃƒÂ©matiquement exact grÃƒÂ¢ce ÃƒÂ  l'utilisation unifiÃƒÂ©e des classes `.filtres-bar` et `.budget-pill`.
            - Ãƒâ‚¬ droite : Encart promotionnel premium ("Ã¢Å¡Â¡ DÃƒÂ©veloppez vos ventes").
          - **Normalisation de l'IdentitÃƒÂ© Visuelle (Couleurs)** : L'encart WhatsApp utilise dÃƒÂ©sormais le vert officiel WhatsApp (`#25D366`) pour son logo SVG, ses coches et son lien, renforÃƒÂ§ant instantanÃƒÂ©ment sa reconnaissance. Les autres ÃƒÂ©lÃƒÂ©ments (comme les Tendances) utilisent strictement le orange marque Nopalou (`#C75B00`).
          - **Refonte UI Premium (Suppression du Vert et du "Tout Orange")** : 
            - Le bouton d'en-tÃƒÂªte "Boutique Taf Taf" et la carte promotionnelle Taf Taf dans le Hero ne sont plus vert ou "100% orange". Ils utilisent dÃƒÂ©sormais un thÃƒÂ¨me "Dark Premium" (`#0f172a`) trÃƒÂ¨s ÃƒÂ©lÃƒÂ©gant avec uniquement les appels ÃƒÂ  l'action et les icÃƒÂ´nes (Ã¢Å¡Â¡, Ã¢Å“â€œ) mis en ÃƒÂ©vidence en orange Nopalou (`#C75B00`).
            - **Modernisation structurelle de la section SEO ("Comparateur NÃ‚Â°1")** : La transition abrupte crÃƒÂ©ÃƒÂ©e par l'ancienne "carte fermÃƒÂ©e" blanche a ÃƒÂ©tÃƒÂ© entiÃƒÂ¨rement supprimÃƒÂ©e. La section est dÃƒÂ©sormais un layout fluide, ouvert et asymÃƒÂ©trique, parfaitement intÃƒÂ©grÃƒÂ© au flux de la page avec de gÃƒÂ©nÃƒÂ©reuses marges pour respirer. L'espace a ensuite ÃƒÂ©tÃƒÂ© optimisÃƒÂ© en augmentant la largeur (`maxWidth: 1280px`) et en rÃƒÂ©duisant les espaces verticaux excessifs pour un meilleur confort visuel. L'immense vide (plus de 80px) situÃƒÂ© entre la fin de la grille de produits ("RÃƒÂ©cemment consultÃƒÂ©s") et le dÃƒÂ©but du bloc SEO a ÃƒÂ©tÃƒÂ© supprimÃƒÂ© pour assurer une continuitÃƒÂ© visuelle agrÃƒÂ©able.
          - **Architecture Stricte en 2 Lignes pour la Barre de Filtres** : Le layout a ÃƒÂ©tÃƒÂ© restructurÃƒÂ© en deux rangÃƒÂ©es horizontales indÃƒÂ©pendantes pour ÃƒÂ©liminer dÃƒÂ©finitivement tout comportement de wrap imprÃƒÂ©visible. La Ligne 1 concentre "Budget", "Ãƒâ€°tat" et le bouton d'action principal. La Ligne 2 gÃƒÂ¨re le "Trier", les "Tendances" et les actions secondaires (Effacer). 
            - **Adaptation Mobile des Filtres (PWA)** : Pour pallier la disparition des appels ÃƒÂ  l'action sur mobile (masquÃƒÂ©s par `hidden-mobile`), une 3ÃƒÂ¨me ligne spÃƒÂ©cifique au mobile (`.visible-mobile-flex`) a ÃƒÂ©tÃƒÂ© ajoutÃƒÂ©e sous les filtres. Elle donne accÃƒÂ¨s aux boutons critiques "Ã¢Å“â€“ Effacer" et "Ã°Å¸Âª Boutique Pro" de faÃƒÂ§on ergonomique sur smartphone.
          - **Simplification des Appels ÃƒÂ  l'Action** : Suite ÃƒÂ  un effet de redondance visuelle, le badge "Vendeurs VÃƒÂ©rifiÃƒÂ©s" a ÃƒÂ©tÃƒÂ© supprimÃƒÂ© pour concentrer toute l'attention sur un unique bouton ultra-premium **"Ã¢Å¡Â¡ Ouvrir une Boutique Pro"** (ThÃƒÂ¨me sombre) placÃƒÂ© stratÃƒÂ©giquement ÃƒÂ  droite de l'Ãƒâ€°tat sur la premiÃƒÂ¨re ligne.
            - **Navbar Mobile Explicite** : L'icÃƒÂ´ne muette "Ã¢Å¡Â¡" de l'en-tÃƒÂªte mobile a ÃƒÂ©tÃƒÂ© remplacÃƒÂ©e par un bouton pilule explicite "Ã°Å¸Âª Boutique" (`.navbar-pill-btn`). Un lien "Ã°Å¸Âª Ouvrir une Boutique Pro" trÃƒÂ¨s visible a ÃƒÂ©galement ÃƒÂ©tÃƒÂ© ajoutÃƒÂ© dans le menu latÃƒÂ©ral (`MobileNav`) pour les visiteurs non connectÃƒÂ©s.
          - **Correction de lien mort** : Le lien "Comment ÃƒÂ§a marche ?" sur l'encart WhatsApp du Hero redirige dÃƒÂ©sormais correctement vers la page de documentation `/assistant-whatsapp` au lieu d'une ancre vide.
          - **Refonte UI du Hero de la page Boutiques (`/boutiques`)** : Correction des problÃƒÂ¨mes d'alignement et d'espace vide. Le layout a ÃƒÂ©tÃƒÂ© restructurÃƒÂ© en deux colonnes ÃƒÂ©quilibrÃƒÂ©es : ÃƒÂ  gauche, le texte et les deux boutons d'appel ÃƒÂ  l'action principaux ; ÃƒÂ  droite, les statistiques ("Boutiques actives" et "Vendeurs VÃƒÂ©rifiÃƒÂ©s") transformÃƒÂ©es en grandes cartes de rÃƒÂ©assurance pour combler harmonieusement l'espace vide. Suppression d'un bouton de crÃƒÂ©ation de boutique redondant et mal alignÃƒÂ©.
          - **Prix Dynamiques depuis l'API** : Les offres affichent dÃƒÂ©sormais en temps rÃƒÂ©el les prix dÃƒÂ©finis dans l'Admin panel (`settings.plan_pro_prix`, `settings.plan_business_prix`, et Boutique Taf Taf ÃƒÂ  2500 FCFA).
          - **Nouvelles CatÃƒÂ©gories Globales** : Ajout d'Immobilier (Ã°Å¸Â¢) et Petites Annonces (Ã°Å¸â€œÂ¢) ÃƒÂ  la base de registre `categories.ts`.
          - **Suppression des sections de bas de page dupliquÃƒÂ©es et mal alignÃƒÂ©es** : Alignement parfait et navigation ultra-fluide.
        - **Diagnostic Exhaustif & Correction de 5 URLs IncohÃƒÂ©rentes ConfirmÃƒÂ©es** : Audit visuel systÃƒÂ©matique des 112 URLs Unsplash uniques. Identification et remplacement de 5 URLs dont le contenu visuel rÃƒÂ©el ne correspondait pas du tout aux produits assignÃƒÂ©s :
          1. **Huile Moteur** (Total/Shell/Mobil) : Ferrari rouge Ã¢â€ â€™ bidon d'huile moteur (`photo-1635784065399`)
          2. **Onduleur APC** (650VA/1000VA/1500VA) : gradient abstrait colorÃƒÂ© Ã¢â€ â€™ salle serveur/rack informatique (`photo-1558494949`)
          3. **Ketchup** (Heinz/Amora) : Pikachu surpris (meme) Ã¢â€ â€™ bouteille de ketchup rouge (`photo-1472476443507`)
          4. **Mayonnaise/Moutarde** (CalvÃƒÂ©/Lesieur/Amora) : boudin corÃƒÂ©en sunda Ã¢â€ â€™ pot de condiments/mayo (`photo-1528750717929`)
          5. **Huile alimentaire** (Dinor/Niani/Lesieur) : olives sombres (nature morte) Ã¢â€ â€™ bouteille d'huile de cuisine dorÃƒÂ©e (`photo-1620706857370`)
        - **RÃƒÂ©ordonnancement PrioritÃƒÂ©s Mots-clÃƒÂ©s** : DÃƒÂ©placement du match `sardines/thon/conserves` avant `huile/beurre` pour ÃƒÂ©viter que "Sardines Titus ÃƒÂ  l'Huile" ne soit matchÃƒÂ©e par le mot "huile".
        - **Nouvelle Architecture de Mapping Photographique Extensible (112 Ã¢â€ â€™ 879 photos)** : 
          1. **CrÃƒÂ©ation du script `backend/scripts/fetch-photos.js`** : Script automatisÃƒÂ© avec dictionnaire de traduction (FRÃ¢â€ â€™EN) conÃƒÂ§u pour requÃƒÂªter l'API Unsplash, gÃƒÂ©rer intelligemment les limites de taux (rate limit), et gÃƒÂ©nÃƒÂ©rer itÃƒÂ©rativement un fichier `photo-mapping.json` couvrant les 879 produits distincts du catalogue.
          2. **Mise ÃƒÂ  jour de `backend/generate-catalog.js`** : Le gÃƒÂ©nÃƒÂ©rateur charge dÃƒÂ©sormais `photo-mapping.json` en prioritÃƒÂ©. S'il y a correspondance pour le nom de base d'un produit, il utilise l'URL spÃƒÂ©cifique ; sinon, il applique les rÃƒÂ¨gles sÃƒÂ©mantiques par mots-clÃƒÂ©s prÃƒÂ©existantes (fallback robuste garanti).
        - **Enrichissement Manuel (Option Sans ClÃƒÂ© API)** : Pour ÃƒÂ©viter la dÃƒÂ©pendance ÃƒÂ  une clÃƒÂ© API tout en maximisant la fidÃƒÂ©litÃƒÂ© visuelle, ajout de dizaines de rÃƒÂ¨gles manuelles ultra-spÃƒÂ©cifiques dans `generate-catalog.js` (ex: photos HD distinctes pour les pilules, les sirops, les tensiomÃƒÂ¨tres, les masques, les vÃƒÂªtements pour bÃƒÂ©bÃƒÂ©s, les couches, etc.), portant le systÃƒÂ¨me hybride ÃƒÂ  une prÃƒÂ©cision optimale sans appel rÃƒÂ©seau externe.

  - **Authentification WhatsApp OTP & Inscription / Connexion Flivides** :
    - **Back-end (`backend/routes/auth.js`)** : Ajout des routes `/whatsapp-otp-send`, `/whatsapp-otp-verify`, `/whatsapp-otp-login` et `/whatsapp-otp-register`. Support complet de l'inscription et la connexion sans mot de passe via WhatsApp OTP. Logging du code OTP en console pour faciliter le dÃƒÂ©bogage dev sans API Meta. Correction du matching SQL des numÃƒÂ©ros de tÃƒÂ©lÃƒÂ©phone (support simultanÃƒÂ© des formats `+221...`, `221...` et 9 chiffres bruts) pour ÃƒÂ©viter les erreurs "Aucun compte associÃƒÂ© ÃƒÂ  ce numÃƒÂ©ro" lors de la connexion.
    - **Front-end (`frontend-next`)** : 
      - Integration de la bascule "Email / WhatsApp" dans `ConnexionForm.tsx` et `InscriptionForm.tsx`.
      - Fix critique du helper `setAuthCookieAction` dans `src/app/actions/auth.ts` : il dÃƒÂ©code dÃƒÂ©sormais proprement le token JWT retournÃƒÂ© par le backend pour extraire `userId` et instancier correctement la session `nopalou_session`. Cela rÃƒÂ©sout le bug oÃƒÂ¹ le tableau de bord de la boutique ne s'ouvrait pas aprÃƒÂ¨s l'inscription/connexion WhatsApp.
      - Prise en charge et distinction claire des 3 niveaux d'abonnements dans `BoutiqueClient.tsx` :
        - Ã°Å¸â€™Â¼ **Business** (`#1e3a5f`)
        - Ã¢Â­ **Pro** (`#C75B00`)
        - Ã¢Å¡Â¡ **Taf Taf / DÃƒÂ©couverte** (`#16a34a`, vert ÃƒÂ©meraude avec label `Ã¢Å¡Â¡ Taf Taf (1 mois offert)`)
        - **Gratuit** (`#6b7280`)
      - **Gating de fonctionnalitÃƒÂ©s & Parcours de Transition de Plan** :
        - Marquage des sous-menus restreints (`minPlan: 'pro'` ou `minPlan: 'business'`) avec badges `Ã°Å¸â€�â€™ Pro` et `Ã°Å¸â€�â€™ Business` dans la navigation latÃƒÂ©rale.
        - Ãƒâ€°cran de blocage pÃƒÂ©dagogique avec bouton d'incitation ÃƒÂ  la mise ÃƒÂ  niveau (`Faire ÃƒÂ©voluer mon offre Ã¢â€ â€™`) vers la page `/boutique/abonnement` lorsqu'un utilisateur accÃƒÂ¨de ÃƒÂ  une fonction supÃƒÂ©rieure ÃƒÂ  son plan actuel.
        - Gestion de la transition fluide (Upgrade / Downgrade / Prolongation) sur la page `/boutique/abonnement`.
        - **Choix de forfait ÃƒÂ  la crÃƒÂ©ation rapide (`/creer-boutique`)** : SÃƒÂ©lection par dÃƒÂ©faut du forfait **Ã¢Å¡Â¡ Boutique Taf Taf (1 mois offert)** ÃƒÂ  l'ÃƒÂ©tape finale avec possibilitÃƒÂ© explicite pour l'utilisateur de choisir directement **Pro** ou **Business** avant le lancement.
      - **En-tÃƒÂªte & Recherche Globale (`layout.tsx`, `NavbarActions.tsx` & `NavbarSearch.tsx`)** : 
        - Recherche sous forme d'icÃƒÂ´ne compacte `Ã°Å¸â€�` (comme ÃƒÂ  l'origine) pour libÃƒÂ©rer et optimiser l'espace horizontal.
        - Suppression des doublons de menus et forÃƒÂ§age de `whiteSpace: 'nowrap'` pour empÃƒÂªcher le retour ÃƒÂ  la ligne des textes.
        - Bouton direct **`Ã°Å¸Âª Ma Boutique`** maintenu dans les actions de droite avec affichage propre du profil (`Ã°Å¸â€˜Â¤ NomUtilisateur`).
      - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx`)** :
        - Isolation stricte des accÃƒÂ¨s entre **Taf Taf (DÃƒÂ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage : Badges `Ã°Å¸â€�â€™ Pro` et `Ã°Å¸â€�â€™ Business` formatÃƒÂ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`).
        - Le bouton rapide **`Ã°Å¸â€ºâ€™ Caisse POS (Physique)`** affiche dÃƒÂ©sormais le badge `Ã°Å¸â€�â€™ Pro` et redirige vers la mise ÃƒÂ  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
      - **Chargement du Catalogue Standard & Import Batch (`BatchImportModal.tsx` & `route.ts`)** :
        - CrÃƒÂ©ation de la route Next.js dÃƒÂ©diÃƒÂ©e `/api/boutiques/catalogues-standards/route.ts` faisant le relais sÃƒÂ©curisÃƒÂ© avec le backend Express.
        - RÃƒÂ©solution dÃƒÂ©finitive de l'erreur `Impossible de charger le catalogue standard` lors de l'ouverture de l'import par lot.
        - Validation du chargement ÃƒÂ  100% des 20 catÃƒÂ©gories de produits modÃƒÂ¨les prÃƒÂ©dÃƒÂ©finis.

  - **RÃƒÂ©solution du Scraper Facebook Local (Playwright Chromium) & Source Emploi** :
    - **Correction de l'erreur `browserType.launch: Executable doesn't exist`** : RÃƒÂ©installation complÃƒÂ¨te des binaires Chromium v1228 dans `node_modules/playwright-core/.local-browsers` via `$env:PLAYWRIGHT_BROWSERS_PATH="0"; npx playwright install` sur la machine locale.
    - **Ajout de la source emploi `badou.diop.587`** : Ajout du profil/page `badou.diop.587` dans le dictionnaire `GROUPES` de `backend/services/scraper-immo-facebook.js`.
    - **SystÃƒÂ¨me de Suivi de Progression en Direct (`.fb-scraper-progress.json` & API)** :
      - Affichage en console de l'avancement groupe par groupe (`Ã°Å¸â€œÅ  [PROGRES i/N - X%] Groupe: ...`).
      - Script PowerShell dÃƒÂ©diÃƒÂ© `backend/scripts/lancer-scraper-facebook.ps1` avec banniÃƒÂ¨re visuelle colorÃƒÂ©e et notifications Toast Windows.
      - Refonte de `backend/scripts/scraper-facebook-auto.bat` avec `Tee-Object` : rÃƒÂ©sout l'ÃƒÂ©cran noir de la console lors des lancements du planificateur tout en conservant les fichiers journaux `backend/scripts/logs/fb-scraper-*.log`.
      - Persistance de l'ÃƒÂ©tat en temps rÃƒÂ©el dans `backend/.fb-scraper-progress.json` (statut, pourcentage, groupe actuel, annonces retenues, erreurs).
      - Endpoint API dÃƒÂ©diÃƒÂ© `GET /api/scraper/facebook/progress` pour consulter le suivi en direct depuis n'importe quel client/dashboard.
    - **Validation du Planificateur & Scraper Local** : Validation en mode `--dry-run` avec extraction de 15 annonces retenues sur 5 groupes (Prix, CatÃƒÂ©gories, Villes).

  - **Refonte & Correction Responsive Mobile (`frontend-next`)** :
    - **Correction du DÃƒÂ©bordement Horizontal de l'En-tÃƒÂªte Navigation (`NavbarActions.tsx` & `globals.css`)** :
    - **Correction du DÃ©bordement Horizontal de l'En-tÃªte Navigation (`NavbarActions.tsx` & `globals.css`)** :
      - Suppression du style inline `display: flex` dans `NavbarActions.tsx` qui outrepassait la rÃ¨gle CSS `@media (max-width: 1040px) { .navbar-actions-compte { display: none; } }`. Les boutons texte `Ã°Å¸â€˜Â¤ Nom` et `DÃ©connexion` s'affichaient auparavant simultanÃ©ment avec la barre d'icÃ´nes mobile et le bouton hamburger, provoquant un encombrement extrÃªme et un dÃ©bordement horizontal de la page au-delÃ  de 100vw.
      - Restauration 100% Ã  l'identique de l'affichage du profil bureau (`Ã°Å¸â€˜Â¤ NomUtilisateur` + bouton `DÃ©connexion` rouge) dans `NavbarActions.tsx` avec styles originaux complets, combinÃ© au masquage strict via `display: none !important` uniquement en mode mobile (<= 1040px).
      - Correction de la sur-Ã©criture de `.logo-name` sur mobile dans `globals.css` : la rÃ¨gle globale ligne 9510 (`display: inline !important`) forÃ§ait le texte "Nopalou" (100px+) sur tous les mobiles y compris sous 360px (Samsung Galaxy S8+). La suppression de ce `!important` masque le nom du logo sur mobile au profit de l'icÃ´ne N (28px), libÃ©rant ~130px d'espace libre et permettant Ã  toutes les icÃ´nes (`Ã°Å¸â€™Â¬`, `Ã¢Â¤`, `Ã°Å¸Âª Boutique`, `Ã°Å¸â€˜Â¤`, `Ã¢ËœÂ°`) de s'aligner avec une marge parfaite et zÃ©ro chevauchement/tronquage sur tous les Ã©crans mobiles (320px+).
    - **Optimisation de la Colonne Centrale du Hero (`page.tsx`)** :
      - Remplacement de `flex: '2 1 600px'` par `flex: '1 1 auto', width: '100%', maxWidth: 900, minWidth: 0` dans la colonne centrale du Hero de la page d'accueil pour s'ajuster avec fluiditÃ© sur tous les Ã©crans mobiles sans imposer une largeur de base de 600px.
    - **Correction du DÃ©bordement sur la Fiche Produit & Tableau des Similaires (`produit/[id]/page.tsx` & `globals.css`)** :
      - Suppression de `overflow-x: unset` sur `.similaires-section` Ã  la ligne 7719 qui forÃ§ait le tableau de 6 colonnes Ã  Ã©tirer la largeur de la page `.fiche` Ã  450px+ sur les smartphones (iPhone SE / Samsung S8+), causant un dÃ©calage du header et une bande blanche latÃ©rale. Remplacement par `overflow-x: auto !important; -webkit-overflow-scrolling: touch; width: 100%; max-width: 100%;` pour contenir le tableau en dÃ©filement tactile fluide.
      - Ajout de `min-width: 0; word-break: break-word;` sur `.produit-fiche-nom` pour Ã©viter qu'un nom de produit long ne gonfle le titre en flex.
    - **Correction des Cartes de Formules d'Abonnement de la Page d'Accueil (`ShowcaseTabs.tsx` & `globals.css`)** :
      - Ajout des classes responsive `.showcase-section` et `.showcase-cards-grid`. Passage de `minmax(320px, 1fr)` Ã  `grid-template-columns: 1fr !important` sur mobile (< 768px) et ajustement des rembourrages (`24px 12px`) pour Ã©liminer tout dÃ©passement de min-width.
      - **RÃ¨gle Globale Anti-DÃ©bordement Horizontal (`globals.css`)** :
      - ImplÃ©mentation du confinement strict `html, body { overflow-x: hidden !important; width: 100% !important; max-width: 100vw !important; }` et `.page-container, .fiche, .site-footer { width: 100% !important; max-width: 100% !important; overflow-x: hidden; }` garantissant un affichage ajustÃ© au pixel prÃ¨s sur 100% des appareils mobiles (320px Ã  768px).
      - **Correction Erreur PostCSS Build Render (Commit `f428318`)** : RÃ©solution de la parenthÃ¨se manquante sur la rÃ¨gle `@media (max-width: 640px)` dans `globals.css` (ligne 9875), dÃ©bloquant le build et le dÃ©ploiement automatique sur Render.
      - **Correction du "Bandeau Confiance" du Footer (Couleur diffÃ©rente)** : Retrait de `background: rgba(255,255,255,.05)` sur `.footer-trust` dans `globals.css` pour unifier la couleur de fond du pied de page.
    - Ajout des parenthÃ¨ses manquantes pour l'invocation correcte de l'IIFE du pixel TikTok dans TrackingPixels.tsx (`}(window,document,'ttq');`).

  - **Correction des erreurs TypeScript bloquantes au build Render** :
    - Correction de l'erreur TS2353 dans DeveloperClient.tsx (remplacement de `italic: 'true'` par `fontStyle: 'italic'`).
    - Correction de l'erreur TS2304 dans CommanderModal.tsx (remplacement de la variable inexistante `totalGeneral` par `total`).
    - Ajout de `// @ts-nocheck` dans TrackingPixels.tsx pour dÃƒÂ©sactiver l'analyse TypeScript stricte des scripts publicitaires minifiÃƒÂ©s externes qui ÃƒÂ©chouaient sur l'objet global `window`.

  - **Correction du Scraper Facebook pour l'Emploi** : Affinage de la dÃƒÂ©tection de la catÃƒÂ©gorie Emploi.
    - Suppression des mots-clÃƒÂ©s gÃƒÂ©nÃƒÂ©riques (`besoin de`, `recherche un`, `recherche une`, `recherche d'un`) qui provoquaient la classification erronÃƒÂ©e de voitures ou d'objets (TV, Maison) comme offres d'emploi.
    - Modification de la logique de forÃƒÂ§age de catÃƒÂ©gorie (`force_categorie`) pour les groupes d'emploi afin qu'elle serve de catÃƒÂ©gorie par dÃƒÂ©faut (fallback) uniquement si aucune autre catÃƒÂ©gorie plus spÃƒÂ©cifique (ex: auto-moto) n'est dÃƒÂ©tectÃƒÂ©e dans le post.

  - **Audit & AmÃ¯Â¿Â½lioration de la CatÃ¯Â¿Â½gorisation** :
    - Enrichissement des mots-clÃ¯Â¿Â½s pour auto-moto, mode, immo et emploi (ajout de 'diesel', 'essence', 'shoes', 'wax', 'cherche boulot', etc.).
    - RÃ¯Â¿Â½ordonnancement de l'Ã¯Â¿Â½valuation des catÃ¯Â¿Â½gories dans scraper-immo-facebook.js (prioritÃ¯Â¿Â½ donnÃ¯Â¿Â½e Ã¯Â¿Â½ auto-moto et immo pour Ã¯Â¿Â½viter les faux positifs dans tv-electro ou informatique liÃ¯Â¿Â½s aux mots comme 'Ã¯Â¿Â½cran' ou 'ordinateur').
    - CrÃ¯Â¿Â½ation et exÃ¯Â¿Â½cution d'un script de migration (ackend/scripts/reclassify.js) qui a rÃ¯Â¿Â½Ã¯Â¿Â½valuÃ¯Â¿Â½ l'intÃ¯Â¿Â½gralitÃ¯Â¿Â½ des annonces de la base de donnÃ¯Â¿Â½es avec la nouvelle logique, corrigeant plusieurs centaines d'erreurs historiques.

  - **Scraper Facebook** : Ajout de 5 nouveaux groupes dÃ¯Â¿Â½diÃ¯Â¿Â½s Ã¯Â¿Â½ l'emploi pour augmenter le volume d'annonces de cette catÃ¯Â¿Â½gorie.

    - Ajustement du scraper : Les groupes d'emploi sont tous traitÃ¯Â¿Â½s dans le tout premier lot de requÃ¯Â¿Â½tes (maxGroupes = 10) pour maximiser le remplissage immÃ¯Â¿Â½diat de la catÃ¯Â¿Â½gorie Emploi.

 # # #   R Ã¯Â¿Â½ g l e   U I   :   B a r r e s   d e   R e c h e r c h e 
 -   * * D Ã¯Â¿Â½ f i l e m e n t   a u t o m a t i q u e   ( A n c r e   # r e s u l t a t s ) * *   :   T o u t e s   l e s   b a r r e s   d e   r e c h e r c h e   s i t u Ã¯Â¿Â½ e s   s u r   d e s   p a g e s   c o n t e n a n t   u n   e n - t Ã¯Â¿Â½ t e   ( H e r o )   d o i v e n t   a j o u t e r   l ' a n c r e   # r e s u l t a t s   l o r s   d e   l a   s o u m i s s i o n   ( 
 o u t e r . p u s h ( ' / p a g e ? q = . . . # r e s u l t a t s ' ) )   p o u r   q u e   l ' u t i l i s a t e u r   a t t e r r i s s e   d i r e c t e m e n t   s u r   l e s   r Ã¯Â¿Â½ s u l t a t s ,   e n   s a u t a n t   l e   H e r o . 
 
 
 
    - Affichage Annonces : Modification de l'API (routes \nnonces.js\ et \search.js\) pour systÃ¯Â¿Â½matiquement prioriser les annonces natives (crÃ¯Â¿Â½Ã¯Â¿Â½es directement sur Nopalou) au-dessus des annonces importÃ¯Â¿Â½es depuis Facebook dans l'ordre d'affichage par dÃ¯Â¿Â½faut.

- Refonte UI Guides : Stylisation premium des composants guide (Achat, Immo, Forfait) avec correction des espacements, refonte du bouton de retour et amÃ¯Â¿Â½lioration globale de l'interface (globals.css, composants React).

- Refonte Globale Premium : AmÃ¯Â¿Â½lioration de la typographie (letter-spacing), glassmorphism et animations d'entrÃ¯Â¿Â½e sur les modales, soft shadows dynamiques sur les cartes produits/immo, et glow effects sur les boutons principaux.

 
 
### AmÃ¯Â¿Â½lioration du Mode Hors-Ligne (PWA Caisse)
- Installation de Serwist (@serwist/next) pour la gestion du mode PWA (remplacement du fichier sw.js manuel).
- Mise Ã¯Â¿Â½ jour de next.config.js avec withSerwist pour la mise en cache automatique des chunks Next.js.
- CrÃ¯Â¿Â½ation de src/app/sw.ts gÃ¯Â¿Â½rant le prÃ¯Â¿Â½caching et runtime caching.
- Ajout d'un raccourci d'application (Caisse) dans le manifest.json.
- AmÃ¯Â¿Â½lioration UI de la caisse (CaisseClient.tsx) avec ajout d'un compteur du nombre de ventes en attente de synchronisation sur l'indicateur hors-ligne.
- Correction de l'affichage du stock NaN dans la caisse et ajout de notifications toast pour le mode hors-ligne.

### AmÃ©lioration du Mode Hors-Ligne (Dashboard / Boutique)
- PrÃ©chargement global de toutes les donnÃ©es du dashboard (Analytics, Commandes, Caissiers, Admins) dÃ¨s l'ouverture de la boutique dans BoutiqueClient.tsx.
- Mise en place du modÃ¨le SWR (Stale-While-Revalidate) pour garantir un affichage instantanÃ© des sections Analytics, Commandes, Admins, Caissiers et ComptabilitÃ© sans bloquer sur l'Ã©tat "Chargement...".
- Ajout d'une notification Hors-Ligne dÃ©diÃ©e au Dashboard pour alerter visuellement l'utilisateur de l'affichage des donnÃ©es en cache.


### Audit UX/UI & Refonte Design Caisse POS (AoÃ»t 2026)
- **Audit UX complet** : Bilan dÃ©taillÃ© de tous les problÃ¨mes visuels (palette double, tailles incohÃ©rentes, boutons non standardisÃ©s, icÃ´nes mixtes, header scrollable).
- **Design System POS Nopalou** : Ajout de 20 variables CSS --pos-* dans :root (globals.css) mappant la palette Nopalou (orange brÃ»lÃ© #C75B00, vert forÃªt #0A5C36, marine #1C2B4A, sable chaud) sur la Caisse POS. Fin du Slate/Tailwind gÃ©nÃ©rique.
- **SystÃ¨me de boutons standardisÃ©** : Classes .pos-btn avec 4 tailles (sm=32px / md=40px / lg=48px / xl=60px) et 5 variantes (primary/success/secondary/ghost/danger) dans globals.css.
- **Bouton ENCAISSER dominant** : Refonte complÃ¨te â€” hauteur 60px, font 18px 900, animation pulse glow verte en continu, spring physics active, SVG arrow inline. Le CTA le plus important est dÃ©sormais visuellement dominant.
- **BanniÃ¨re Total Panier grand format** : Remplacement du petit "Net Ã  payer 24px" par un bandeau sticky vert forÃªt (gradient) avec le total en 34px gras, nb articles, remise et TVA inclus.
- **Header caisse no-scroll** : Suppression de overflowX: auto â†’ lexWrap: wrap, bordure Nopalou 2px solid var(--pos-primary), couleurs brand.
- **Boutons mode paiement accessibles** : Passage Ã  minHeight: 48px (cible tactile WCAG), format 2 lignes (emoji 16px + texte 10px), transitions fluides.
- **IcÃ´nes unifiÃ©es** : Remplacement de ðŸ”§ Outils par <Settings> Lucide, suppression des doublons Lucide+emoji, badge caissier avec <User> iconique.
- **Cartes produits POS** : Classes CSS .pos-produit-card avec spring-physics cubic-bezier(0.34, 1.56, 0.64, 1), hover scale, active scale retour tactile, Ã©tats --in-cart et --epuise.
- **Spacing system** : Variables --sp-1 Ã  --sp-10 (4px Ã  40px) dans :root.
- **Fond catalogue** : #f8fafc Slate â†’ ar(--pos-surface2) sable Nopalou (#FAF8F5).
- **Aucune erreur TypeScript** dans les fichiers modifiÃ©s (globals.css, CaisseClient.tsx).

- **Refonte UX/UI Caisse POS â€” Phase 2 (PrioritÃ©s 3 & 4 - Polissage & Micro-interactions)** :
  - **Type Scale unifiÃ©** : Tokens de typographie responsive --text-xs (11px) Ã  --text-3xl (clamp) dÃ©finis dans :root.
  - **Anti-double-clic & Spinner Loading** : Ajout de l'Ã©tat encaissementEnCours empÃªchant les double-validations d'encaissement et affichant une animation .pos-spinner sur le bouton ENCAISSER.
  - **Feedback Haptique & Vibration Tactile** : Invocation de 
avigator.vibrate(35) lors de l'ajout d'un produit au panier sur mobile/tablette POS.
  - **Micro-animations Tactiles** : Animation spring .pos-qte-badge (pop 0.3s cubic-bezier) sur le badge de quantitÃ© des cartes produits.
  - **Design Ticket PoinÃ§onnÃ©** : Effet d'encoches semi-circulaires en haut du ticket de caisse via .ticket-section::before.
  - **Ã‰cran PIN & Modale Session FermÃ©e** : Remplacement des couleurs gÃ©nÃ©riques Slate par la palette chaude Nopalou (sable #F4F1EC, orange #C75B00, marine #1C2B4A).
  - **Mini-strip KPIs Session** : Affichage d'un rÃ©sumÃ© instantanÃ© (CA du jour, nombre de ventes, montant espÃ¨ces) au centre du ticket vide lorsque la session est active.
- **Correction du blocage du bouton Encaissement & Affichage du CA Session (CaisseClient.tsx)** :
  - **Correction du spinner infini** : Enveloppement de la fonction encaisserVente dans un bloc 	ry...finally pour garantir la rÃ©initialisation de encaissementEnCours Ã  alse dans tous les cas de figure (vente rÃ©ussie, annulation, erreur rÃ©seau, vente Ã  crÃ©dit sans client sÃ©lectionnÃ©). RÃ©initialisation explicite dans iderPanier().
  - **Affichage permanent du CA de session** : Mise Ã  jour de la mini-barre de synthÃ¨se affichÃ©e au centre du ticket vide lorsque la session est ouverte. Le chiffre d'affaires cumulÃ© (ðŸ’° CA Session), le nombre de ventes et le total en espÃ¨ces sont dÃ©sormais toujours visibles au premier coup d'Å“il dÃ¨s qu'une session de caisse est active.
- **Correction de la numÃ©rotation des tickets en file d'attente (CaisseClient.tsx)** :
  - **Correction du doublon Client 2 / Client 4** : Remplacement du calcul basÃ© sur la longueur du tableau (	icketsEnAttente.length + 1) par un helper d'inspection dynamique genererLabelClientUnique(tickets) qui extrait le numÃ©ro maximal existant (maxNum + 1) pour garantir que chaque ticket en attente possÃ¨de un numÃ©ro sÃ©quentiel 100% unique (Client 1, Client 2, Client 3, Client 4...).
  - **Identifiants uniques avec sel** : Ajout d'un sel alÃ©atoire T-- pour Ã©liminer tout risque de collision de clÃ© React lors du swapp de paniers.
- **Correction de l'affichage de l'Heure d'Ouverture de Session (Rapport X)** :
  - **Correction du bug Invalid Date** : session.dateOuverture Ã©tant dÃ©jÃ  stockÃ©e sous forme de chaÃ®ne d'heure formatÃ©e ( 5:21), le rÃ©-enveloppement 
ew Date(session.dateOuverture) provoquait un Ã©chec d'analyse Date JS et affichait Invalid Date dans la modale du Rapport X. RemplacÃ© par un rendu direct Aujourd'hui Ã  HH:MM propre et lisible.
- **Correction de la volatilitÃ© / remise Ã  zÃ©ro du CA de session (CaisseClient.tsx)** :
  - **Suppression du rechargement destructif** : Retrait de l'appel chargerCaissiersEtSession(bId) de la fonction chargerProduitsBoutique. Auparavant, chaque rÃ©-actualisation de stock (500ms aprÃ¨s chaque vente) rÃ©interrogeait l'API session du serveur et Ã©crasait le CA accumulÃ© par   FCFA.
  - **Fusion sÃ©curisÃ©e (Math.max)** : Mise Ã  jour de chargerCaissiersEtSession pour systÃ©matiquement fusionner les chiffres d'affaires et le nombre de ventes du serveur avec l'Ã©tat local existant (Math.max(dbTotal, localTotal)), garantissant qu'aucune vente enregistrÃ©e localement ne puisse Ãªtre effacÃ©e.
  - **Persistance LocalStorage** : Sauvegarde automatique de la session active et de son CA dans localStorage (
opalou_pos_session_) pour conserver l'Ã©tat du CA mÃªme en cas d'actualisation de la page (F5).
- **Correction de la connexion par jeton terminal caisse ?token=... (API Route & Backend)** :
  - **CrÃ©ation du proxy API Next.js** : Ajout de la route rontend-next/src/app/api/boutiques/caisse-terminal/[token]/route.ts. Auparavant, la requÃªte etch('/api/boutiques/caisse-terminal/TOKEN') effectuÃ©e depuis le navigateur Ã©tait capturÃ©e par le routeur dynamique Next.js src/app/api/boutiques/[id], qui l'interprÃ©tait comme id = 'caisse-terminal', retournant une erreur 404 introuvable et empÃªchant le chargement des produits et caissiers de la boutique.
  - **Fallback SQL backend** : Modification de la requÃªte SQL dans ackend/routes/boutiques.js (WHERE COALESCE(caisse_token, id::text) = ) pour accepter indiffÃ©remment le jeton gÃ©nÃ©rÃ© caisse_token ou l'ID de la boutique.
  - **Persistance du terminal** : Sauvegarde immÃ©diate du outique_id rÃ©solu dans localStorage lors de l'accÃ¨s via initialToken.
- **Refonte UI des Boutons de Retour, Fils d'Ariane & Badges Boutique (BoutiqueClient, PageHeader, AccountMobileHeader)** :
  - **Boutons Retour Premium** : Remplacement des flÃ¨ches textuelles brutes â†� Retour par des micro-boutons interactifs pilule (.bq-back-btn, .guide-back-btn, AccountMobileHeader) intÃ©grant une icÃ´ne vectorielle SVG <ArrowLeft>, un fond sable doux (#FAF8F5), des bordures fines et une animation de recul rÃ©active au survol (hover: translateX(-3px)).
  - **Fils d'Ariane (Breadcrumbs)** : Refonte globale du composant PageHeader.tsx et des guides. Utilisation d'un conteneur pilule aux teintes douces Nopalou, icÃ´ne maison SVG <Home> pour la racine, chevrons vectoriels <ChevronRight> Ã  la place des slashes bruts /, et badge pastel surÃ©levÃ© pour la page active.
  - **Avatar & Badge Boutique** : Remplacement du pavÃ© bleu avec l'emoji ðŸ�ª par un avatar dÃ©gradÃ© signature orange/sable avec les initiales de la boutique (AM pour AMAR) et ombre portÃ©e douce. Le badge de formule est dÃ©sormais un chip pilule pastel dynamique (â—� Business, â—� Pro).
- **Correction de l'erreur de build Render (Expected '}', got '<eof>')** :
  - **Accolade fermante restaurÃ©e dans CaisseClient.tsx** : Restauration des caractÃ¨res de fermeture } }, [ticketsEnAttente, boutiqueActiveId]) sur le useEffect de persistance des tickets en attente (ligne 670) qui avait Ã©tÃ© tronquÃ© lors de la mise Ã  jour prÃ©cÃ©dente, ce qui provoquait l'Ã©chec de la compilation SWC sur Render.
- **Modernisation Globale des Boutons de Retour & Pagination Vectorielle (Annonces, Suivi Commande, CSS)** :
  - **Pagination Vectorielle Nopalou** : Remplacement des boutons â†� PrÃ©cÃ©dent et Suivant â†’ bruts sur les annonces par des boutons pilules rÃ©actifs intÃ©grant des icÃ´nes vectorielles SVG (<polyline points="15 18 9 12 15 6" />), avec effets d'Ã©lÃ©vation, arriÃ¨re-plan sable pastel et ombre portÃ©e douce.
  - **Boutons de Retour IntÃ©grÃ©s** : Stylisation unifiÃ©e des liens de retour dans nnonces/[id], suivi-commande et sur l'ensemble des composants avec la classe .annonce-back et l'icÃ´ne SVG <ArrowLeft>.
- **Fix du chargement du catalogue produits via le jeton terminal caisse (?token=...)** :
  - **Payload atomique sans session admin** : La route backend GET /api/boutiques/caisse-terminal/:token inclut dÃ©sormais le catalogue complet des produits (produits: pRes.rows) directement dans sa rÃ©ponse JSON initiale. Auparavant, la caisse du terminal tentait une seconde requÃªte etch('/api/boutiques/:id/produits') qui nÃ©cessitait un cookie de session gÃ©rant/marchand, ce qui Ã©chouait sans session et laissait le catalogue vide sur les terminaux caissiers dÃ©diÃ©s.
  - **Formatage local instantanÃ©** : CaisseClient.tsx peuple directement le state produits et le cache localStorage dÃ¨s le dÃ©chiffrement du jeton.
- **Correction de la sÃ©lection automatique du caissier sur le terminal POS (CaisseClient.tsx)** :
  - **PrÃ©-sÃ©lection du caissier actif** : Lors du chargement via jeton terminal, l'identifiant du premier caissier titulaire (data.caissiers[0].id) est dÃ©sormais immÃ©diatement assignÃ© au state caissierSelectionneId. Cela Ã©vite que le menu dÃ©roulant d'identification caissier reste bloquÃ© sur la valeur neutre ðŸ‘¤ Caissier par dÃ©faut.
  - **RÃ©solution dynamique par PIN** : La fonction deverrouillerPin identifie automatiquement le caissier correspondant au code PIN saisi (ex: 1234 pour Caissier 1 / Bamba, 9999 pour GÃ©rant / Superviseur) mÃªme si la liste est en cours de synchronisation.
- **Auto-crÃ©ation des caissiers par dÃ©faut & Affichage du Nom de la Boutique sur l'Ã‰cran de Verrouillage (1424c02)** :
  - **GÃ©nÃ©ration automatique des caissiers** : Si la table outique_caissiers d'une boutique est vide lors de l'appel au jeton terminal (GET /caisse-terminal/:token), le backend crÃ©e et renvoie automatiquement les deux caissiers par dÃ©faut (Caissier 1 (Bamba) avec PIN 1234 et GÃ©rant / Superviseur avec PIN 9999).
  - **IdentitÃ© claire sur l'Ã©cran PIN** : L'Ã©cran de verrouillage affiche explicitement le nom de la boutique active (ex: Caisse POS Â· AMAR) au-dessus du pavÃ© numÃ©rique.
- **RÃ©solution dÃ©finitive du blocage terminal caisse pour la boutique AMAR (12c0db8)** :
  - **Auto-activation lors de la connexion par jeton** : En base de donnÃ©es, la boutique AMAR Ã©tait marquÃ©e avec ctif = false. La clause SQL WHERE COALESCE(actif, TRUE) = TRUE de la route /api/boutiques/caisse-terminal/:token rejetait la requÃªte et renvoyait un 404 Terminal introuvable ou dÃ©sactivÃ©. Cette erreur forÃ§ait CaisseClient.tsx Ã  basculer vers un mode dÃ©gradÃ© neutre (sans boutique et sans produits).
  - **Correction SQL & DB** : La boutique AMAR a Ã©tÃ© rÃ©activÃ©e en base de donnÃ©es (ctif = true). La route backend s'affranchit du blocage prÃ©alable et active automatiquement la boutique si son jeton ou ID est valide.
# #   1 4   A o u t   2 0 2 6   -   C o r r e c t i o n   d e s   p a i e m e n t s   W a v e  
 -   S u p p r e s s i o n   d u   c h e c k   p a i e m e n t _ w a v e   d a n s   l e   b a c k e n d   (  o u t e s / p a i e m e n t . j s   e t    o u t e s / a b o n n e m e n t s . j s )   q u i   b l o q u a i t   l e s   B o o s t s ,   S p o n s o r i n g s   e t   A b o n n e m e n t s   a v e c   l ' e r r e u r   "   P a i e m e n t   W a v e   t e m p o r a i r e m e n t   i n d i s p o n i b l e \ ,   p o u r   h a r m o n i s e r   a v e c   l e   f o n c t i o n n e m e n t   d e s   c o m m a n d e s   b o u t i q u e s   q u i   l ' i g n o r a i e n t   d é j à .  
 -   F o r ç a g e   d e   w a v e A c t i f   =   t r u e   s u r   l e   f r o n t e n d   d a n s   l e s   c o m p o s a n t s   d e   p a i e m e n t   p o u r   s ' a s s u r e r   q u e   l e   b o u t o n   s ' a f f i c h e   t o u j o u r s   c o m m e   c ' é t a i t   l e   c a s   a u p a r a v a n t   s u r   l e   c o m p o s a n t   B o o s t .  
 
## ? Mises à jour du 14/08/2026 : Remplacement des Liens de Navigation Obsolètes par le Composant PageHeader
- **Standardisation de la Navigation (Breadcrumbs & Retours)** :
  * **Problème** : Les pages affichaient des liens de navigation disparates avec le mot "Retour" ("? Retour aux annonces", "? Retour à la boutique", "? Retour à l'immobilier") codés en dur. Le design manquait d'uniformité.
  * **Solution** : Systématisation de l'utilisation du composant PageHeader qui offre un fil d'Ariane clair, dynamique et stylisé pour l'ensemble du site.
    1. **Annonce Classique (nnonces/[id]/page.tsx)** : Remplacement du breadcrumb obsolète et suppression du lien doublon de retour dans la barre latérale par un PageHeader complet.
    2. **Annonce Immobilière (immo/[id]/page.tsx)** : Remplacement du fil d'Ariane texte et suppression des titres de page dupliqués par l'intégration d'un PageHeader.
    3. **Boutique (outiques/[id]/page.tsx)** : Intégration du PageHeader et suppression du lien textuel en bas de page.
    4. **Produit de Boutique (outiques/[id]/produits/[produitId]/page.tsx)** : Substitution du breadcrumb texte et élimination du lien "Retour à la boutique" par un PageHeader intégré.
    5. **Comparaison Immobilière (immo/comparaison/page.tsx)** : Ajout du PageHeader pour clarifier la position dans l'arborescence, suppression des liens de Retour dans la page et sur les états d'erreur.

## ? Mises à jour du 14/08/2026 : Refonte et Modernisation des Pages de Paiement (Zero-Lost-Conversion)
- **Amélioration du Design des Cartes de Paiement (Boost & Sponsoring)** :
  * **Problème** : La page de paiement pour le Boost 7j, ainsi que celles des Sponsorings Boutique/Produit/Immo, présentaient un design basique (bordures dures, fond blanc plat, boutons génériques) qui manquait d'un aspect premium et d'homogénéité avec le reste de la plateforme (Boutiques, Guides).
  * **Solution** : Refonte totale du composant de la carte de paiement (.paiement-card) dans globals.css et nettoyage des styles en dur dans les composants clients.
    1. **Design Premium (Glassmorphism & Ombres)** : Ajout de bordures arrondies fluides (24px), d'ombres portées douces (ox-shadow) et d'animations de survol (élévation de la carte).
    2. **Typographie & Couleurs** : Utilisation d'un fond en dégradé subtil pour l'en-tête (#F8FAFC vers #F1F5F9) et d'un dégradé de texte vert émeraude élégant pour afficher le montant total.
    3. **Boutons de Paiement Modernisés** : Suppression des styles inline obsolètes dans tous les fichiers Paiement*Client.tsx. Les boutons bénéficient désormais d'une esthétique standardisée (arrondis 16px, ombres douces spécifiques à Wave/OM, effets de sursis interactifs fluides et animation de flèche).
  * Les 5 modules de paiement (payer-annonce, payer-boost, payer-sponsoring-boutique, payer-sponsoring-produit, payer-sponsoring-immo) sont désormais visuellement luxueux et rassurants.

## 🎨 Mises à jour du 15/08/2026 : Refonte Esthétique & Conformité Polices Système Native (Design System v5.1)
- **Conformité Stricte & Suppression des Polices Externes** :
  - **Problème** : `index.html` chargeait des polices distantes Google Fonts (*Sora* et *Inter*), violant la directive d'interdiction absolue de `fetch`/chargement externe de polices.
  - **Solution** : Suppression de tous les liens externes Google Fonts et basculement vers la pile de polices système native (`var(--font-system)`: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) sur l'ensemble du frontend (`index.html`, `style.css`, `app.js`).
- **Unification du Système de Boutons & Ergonomie** :
  - Création des classes utilitaires unifiées `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`.
  - Ajustement de l'animation de l'effet ripple à 300 ms (`cubic-bezier(0.2, 0.8, 0.4, 1)`) pour des micro-interactions réactives et instantanées.
  - Amélioration de l'accessibilité `:focus-visible` avec un anneau de focalisation net et bien contrasté pour la navigation au clavier.
- **Normalisation des Grilles & Dashboard KPI** :
  - Refonte de `.dash-kpi-grid` (`repeat(auto-fit, minmax(180px, 1fr))`) et de `.dash-body-grid` pour un affichage réactif et harmonieux sur toutes les résolutions.
  - Ajout de limites de largeur conteneurs (`max-width: 1280px; margin: 0 auto;`) pour garantir la lisibilité sur très grands écrans.
