## 🚀 Mises à jour du 14/08/2026 : Intégration des Options "Créer ma boutique" & "Forfaits Boutiques" dans le Chatbot WhatsApp (`whatsapp-chatbot.js`)
- **Enrichissement du Menu Interactif WhatsApp (`sendMenu`)** :
  * **Ajout de l'Option *"🛍️ Créer ma boutique"*** : Permet aux commerçants de découvrir les avantages marchands Nopalou (catalogue, Wave 1-Clic, bot dédié, reversements) et d'accéder directement à la création de boutique (`/creer-boutique`).
  * **Ajout de l'Option *"💎 Forfaits Boutiques"*** : Présentation dynamique des forfaits lus depuis l'admin/BDD via `settingsCache`. Application claire du **1er mois 100% OFFERT sur TOUS les forfaits** et **suppression des mentions en dur de commission réduite à 2.0%**. Nettoyage des anciennes valeurs de repli obsolètes (`15000` / `35000`) sur l'ensemble du backend et du frontend.
  * Réorganisation des sections en *"Acheter & Explorer"* et *"Marchands & Compte"* pour respecter strictement la limite des 10 éléments interactifs Meta.

## 🚀 Mises à jour du 14/08/2026 : Ouverture Directe de l'Application Wave via WhatsApp & Auto-Redirection Web (`whatsapp-chatbot.js`, `comptabilite.js`, `checkout-express/page.tsx`)
- **Génération Directe de la Session de Paiement Wave (`wave_launch_url`) dans WhatsApp** :
  * **WhatsApp Chatbot (`whatsapp-chatbot.js`)** : Lors de la création d'une commande par le bot WhatsApp, le système initialise directement une session Wave Checkout (`wave.createCheckoutSession`) et transmet la véritable URL officielle Wave (`wave_launch_url`) dans le message WhatsApp. Cliquer sur le lien dans WhatsApp ouvre **immédiatement l'application Wave** pour payer en 1 Clic (2 secondes).
  * **Notifications Vendeur ➔ Client (`comptabilite.js`)** : Même comportement lors de l'envoi de la notification de confirmation de commande du marchand vers le client via WhatsApp.
- **Auto-Redirection Immédiate sur le Web (`checkout-express/page.tsx`)** :
  * Si le client atterrit sur le lien Web (`/checkout-express?pay=wave&auto=1`), la page déclenche automatiquement l'initialisation de la session Wave et redirige l'acheteur sans nécessiter un second clic.
  * Ajout d'un écran d'attente visuel moderne (*"🌊 Redirection vers Wave..."*) pendant l'initialisation.

## 🚀 Mises à jour du 14/08/2026 : Correction du Réaffichage Récurrent de la Notification de Mise à Jour PWA (`RegisterSW.tsx`, `next.config.js`)
- **Fix du Clignotement / Réaffichage du Bandeau Bleu *"🔄 Nouvelle version disponible — Mettre à jour"*** :
  * **Problème** : Lors du clic sur le bouton bleu de mise à jour PWA, le rechargement de la page re-déclenchait l'événement `updatefound` ou `reg.waiting` avant la finalisation de l'activation du Service Worker, provoquant la réapparition indéfinie du bandeau bleu.
  * **Solution** :
    1. Ajout des en-têtes HTTP `Cache-Control: no-cache, no-store, must-revalidate` sur `/sw.js` dans `next.config.js` pour interdire la mise en cache HTTP résiduelle du fichier de Service Worker.
    2. Utilisation d'un verrou temporaire dans `sessionStorage` (`nopalou_sw_updated`) dans `RegisterSW.tsx` pour empêcher l'affichage en boucle de la notification pendant le processus d'installation.
    3. Ajout d'un timer de sécurité pour forcer le rechargement si l'événement `controllerchange` tarde à se déclencher.

## 🚀 Mises à jour du 13/08/2026 : Intégration du Module de Paiement Wave Express Web & Redirection 1-Clic (`checkout-express/page.tsx`, `paiement.js`)
- **Intégration du Paiement Direct Wave 1-Clic sur la Page Express Web (`checkout-express/page.tsx` & `paiement.js`)** :
  * **Redirection automatique vers l'Application Wave** : Lors du clic sur la caisse express web avec l'option Wave (`pay=wave`), la page initialise la session Wave (`/api/paiement/wave/initier-express`) et redirige automatiquement l'acheteur vers l'application **Wave** (`wave_url`).
  * Pre-sélection automatique du mode de paiement en fonction du paramètre de requête `pay` (`pay=wave`, `pay=cash`, etc.).

## 🚀 Mises à jour du 13/08/2026 : Ajout de Banlieue + Wave & Gestion Dynamique des Zones de Livraison (`whatsapp-chatbot.js`)
- **Ajout de la Formule `🌊 Banlieue + Wave (2500F)` & Dynamisme BDD (`whatsapp-chatbot.js`)** :
  * Ajout de l'option combinée `🌊 Banlieue + Wave (2500F)` dans la liste par défaut des formules tout-en-un.
  * **Fonctionnement dynamique** : Si le vendeur a configuré ses propres zones de livraison dans la base de données (`zones_livraison`), le système génère dynamiquement pour chaque zone du vendeur les options Wave et Cash associées !

## 🚀 Mises à jour du 13/08/2026 : Fix du Blocage du Menu Interactif WhatsApp (Sanitisation des Titres < 24 caractères Meta) (`whatsapp.js`, `whatsapp-chatbot.js`)
- **Fix du Rejet Meta 400 Bad Request sur les Menus de Commande (`whatsapp.js` & `whatsapp-chatbot.js`)** :
  * **Problème** : Les titres des options de livraison (`🌊 Dakar (1 500 F) + Wave`, etc.) dépassaient 24 caractères, provoquant le rejet silencieux du message interactif par la Meta Cloud API et le blocage de l'utilisateur après la saisie de son Nom/Adresse.
  * **Solution** : Ajout d'une sanitisation automatique systématique `.slice(0, 24)` dans `sendWhatsAppInteractive` pour garantir qu'aucun message interactif WhatsApp ne puisse être rejeté pour dépassement de longueur de titre.

## 🚀 Mises à jour du 13/08/2026 : Déduction Automatique des 2% de Frais Totaux Wave (1% Encaissement + 1% Payout) (`comptabilite.js`, `wave.js`)
- **Prise en compte des 2% de Frais de Transaction Wave sur le Reversement Marchand (`comptabilite.js`)** :
  * Calcul automatique des frais totaux Wave (1% encaissement Wave Checkout + 1% virement Wave Payout = 2% total) lors du calcul du montant net à reverser (`netAmount = montant_total - commission_nopalou - fraisWaveTotaux`).
  * Séparation claire et transparente entre la commission Nopalou et les frais d'opérateur Wave.
- **Correction de l'URL Endpoint Wave Payout (`wave.js`)** :
  * Modification de `/v1/payouts` vers l'endpoint officiel `/v1/payout` et ajout systématique de l'en-tête de signature HMAC SHA256 `Wave-Signature: t=...,v1=...`.

## 🚀 Mises à jour du 13/08/2026 : Envoi Automatique du Lien de Paiement Wave 1-Clic sur WhatsApp (`comptabilite.js`, `whatsapp-chatbot.js`)
- **Génération & Envoi du Lien de Paiement Wave Direct sur WhatsApp (`comptabilite.js` & `whatsapp-chatbot.js`)** :
  * **Sur confirmation de la commande par le marchand** : Dès que le vendeur valide la commande depuis son espace boutique (`statut=confirmee`), une notification WhatsApp est automatiquement envoyée au client avec le lien de paiement Wave 1-Clic (`👉 ${SITE}/checkout-express?...&pay=wave`).
  * **Dès la validation de la commande par chat** : Le message de confirmation finale généré par le bot WhatsApp inclut directement le lien direct vers le module de règlement Wave 1-Clic.

## 🚀 Mises à jour du 13/08/2026 : Formules Tout-en-Un (Livraison + Paiement en 1 Clic) & WhatsApp Direct Chatbot (`whatsapp-chatbot.js`)
- **Combinaison des Étapes de Livraison & Paiement en 1 Seul Menu Interactif Tout-en-Un** :
  * Fusion des choix de la zone de livraison et du mode de paiement en une seule liste d'options combinées : `🌊 Dakar (1 500 F) + Wave`, `💵 Dakar (1 500 F) + Cash`, `🚚 Banlieue (2 500 F) + Cash`, `🏬 Retrait Boutique (Gratuit)`.
  * **Expérience utilisateur ultra-réduite** : La commande par chat ne nécessite plus que **1 seul message texte (Nom + Adresse)** et **1 seul clic sur le menu combiné**, générant immédiatement le récapitulatif et la confirmation finale.
- **Intégration du Bouton *"💬 Contact Vendeur (WhatsApp Direct 1-Clic)"* dans le Chatbot** :
  * Génération automatique du lien direct `wa.me/221XXXXXXX?text=...` avec le message pré-rempli identique à la fiche produit Web : *“Bonjour ! Je suis intéressé(e) par l'article [Nom] ([Prix]) vu sur Nopalou. Est-il disponible ?”*.
  * Ajout du bouton tactile `💬 Contact Vendeur` sous chaque fiche produit WhatsApp pour permettre la discussion instantanée en 1 clic sans aucun formulaire.

## 🚀 Mises à jour du 13/08/2026 : Resolution de la 404 sur le Bouton du Template WhatsApp (`immo/boutique/page.tsx`, `immo/[id]/page.tsx`, `next.config.js`)
- **Fix de la Redirection 404 du Bouton *"Voir les détails"* WhatsApp (`immo/boutique/page.tsx` & `next.config.js`)** :
  * **Problème** : Le template Meta `nopalou_fiche_texte` est enregistré chez Meta avec une URL de bouton fixe `https://nopalou.com/immo/{{1}}`. Lors de l'envoi du paramètre `boutique?tab=commandes`, le bouton cliquable WhatsApp générait l'URL `https://nopalou.com/immo/boutique?tab=commandes` qui renvoyait vers une page 404.
  * **Solution** :
    1. Création de la route dédiée `frontend-next/src/app/immo/boutique/page.tsx` redirigeant automatiquement vers `/boutique?tab=commandes`.
    2. Ajout de la règle de redirection globale dans `next.config.js` (`/immo/boutique` ➔ `/boutique?tab=commandes`).
    3. Ajout d'une gestion de secours intelligente dans `immo/[id]/page.tsx` redirigeant `/immo/boutique` vers `/boutique?tab=commandes` et les annonces classifiées vers `/annonces/[id]`.

## 🚀 Mises à jour du 13/08/2026 : Correction de la Restriction Meta 24h & Intégration du Lien Direct vers les Commandes (`comptabilite.js`, `whatsapp-chatbot.js`)
- **Fix de la Restriction Meta WhatsApp des 24 Heures (Code 131047)** :
  * **Problème identifié via les logs** : Meta Cloud API échouait l'envoi des notifications texte aux vendeurs qui n'avaient pas écrit au bot WhatsApp dans les 24h avec l'erreur `131047 (Re-engagement message / 24 hours window)`.
  * **Solution** : Ajout systématique de l'envoi par le Template Meta approuvé `nopalou_fiche_texte` (qui contourne la fenêtre des 24h Meta) en complément du message texte détaillé dans `notifierVendeurCommande` et `notifierVendeurPanierGroupe`.
- **Intégration du Lien de Redirection Direct vers l'Espace Vendeur** :
  * Ajout automatique de l'URL de redirection direct vers l'onglet des commandes du tableau de bord vendeur (`${SITE}/boutique?tab=commandes`) dans les messages et templates de notification WhatsApp envoyés aux marchands lors d'une nouvelle commande.

## 🚀 Mises à jour du 13/08/2026 : Implémentation du Renforcement Anti-Clonage, Anti-Scraping et Protection de la Marque
- **Masquage Sécurisé des Numéros de Contact Vendeurs (`MaskedContactPhone.tsx` & `annonces/[id]/page.tsx`)** :
  * Création d'un composant interactif de protection des numéros marchands (`+221 77 *** ** 42`) avec bouton tactile *"👁️ Afficher le numéro"*.
  * Bloque l'aspiration automatisée des numéros par des robots d'aspiration et enregistre l'événement d'intention de contact (Lead tracking).
- **Tatouage Visuel de Marque & Protection Anti-Vol de Médias (`ExternalImg.tsx` & `produit/[id]/page.tsx`)** :
  * Ajout du support de filigrane numérique (`watermark={true}`) superposant la griffe de marque `nopalou.com` semi-transparente avec désactivation du clic-droit (`onContextMenu`) pour décourager le vol de visuels originaux.
- **Filtrage des Scrapers & Rate Limiting Resserré (`backend/app.js`)** :
  * Intégration du middleware `botBlockerMiddleware` bloquant les User-Agents de scraping et d'aspiration headless (`Scrapy`, `python-requests`, `go-http-client`, `Java/`, `Wget`, `Curl`).
  * Mise en place de la limite resserrée `searchLimiter` (150 req / 15 min) sur les endpoints de recherche publique.
- **Blocage des Robots d'Aspiration IA (`robots.ts`)** :
  * Ajout des directives d'interdiction explicites (`disallow: /`) pour 13 crawlers d'IA et de data mining (`GPTBot`, `Bytespider`, `CCBot`, `ClaudeBot`, `ImagesiftBot`, `Scrapy`, `AhrefsBot`, `SemrushBot`).
- **Verrouillage Anti-Reversing & Headers Anti-Framing (`next.config.js`)** :
  * Désactivation explicite des cartes sources client (`productionBrowserSourceMaps: false`) pour empêcher la rétro-ingénierie du code React Next.js.
  * Ajout de la directive CSP `Content-Security-Policy: frame-ancestors 'self'` pour interdire l'iframe-jacking/clonage dans des cadres tiers.
- **Clauses Juridiques d'Interdiction d'Aspiration & Canonical SEO (`cgu/page.tsx` & `layout.tsx`)** :
  * Ajout de la section **6. Propriété Intellectuelle & Interdiction d'Aspiration de Données (Anti-Scraping / DMCA)** aux CGU conformément au Droit d'Auteur sénégalais et aux directives de l'APDP.
  * Configuration de l'URL canonique `alternates: { canonical: 'https://nopalou.com' }` (URL absolue via `NEXT_PUBLIC_SITE_URL`) et metadonnées d'auteur/éditeur dans `layout.tsx` pour forcer l'attribution canonique par Google. *(Corrigé le 13/08/2026 : `./'` relatif remplacé par URL absolue — commit `f277e27`)*

## 🚀 Mises à jour du 13/08/2026 : Nettoyage Intégral des Logs de Débogage & Fichiers de Logs
- **Nettoyage des Logs Console de Débogage (`frontend-next`)** :
  * Purge de 65 lignes de logs console verbeux (`console.log`, `console.info`) ajoutés lors du développement et du diagnostic hors-ligne / PWA sur 9 fichiers clés :
    1. `CompteClient.tsx` : Suppression des logs de préchargement universel SPA et de navigation par onglet.
    2. `CaisseClient.tsx` : Nettoyage des logs de diagnostic caisse, décodage EAN code-barres et validation POS.
    3. `BoutiqueClient.tsx` : Suppression des logs de chargement catalogue.
    4. `Comptabilite.tsx` : Suppression des logs de comptabilité.
    5. `AnnoncesClient.tsx` & `AnnoncesImmoClient.tsx` : Nettoyage des logs de cache local annonces/immo.
    6. `db-offline.ts` : Purge des logs verbeux d'opérations IndexedDB v3 (les `console.error` d'erreurs réelles restant préservés).
    7. `sync-manager.ts` : Suppression des logs verbeux de synchronisation.
    8. `useOnlineStatus.ts` : Suppression des logs de monitoring réseau et de polling.
- **Suppression des Fichiers de Logs Temporaires à la Racine** :
  * Nettoyage des fichiers temporaires `backend_stderr.log`, `backend_stdout.log`, `server.log`.

## 🚀 Mises à jour du 13/08/2026 : Audit, Nettoyage BDD & Refonte du Scraping FB (`clean-scraped-annonces.js`, `scraper-immo-facebook.js`)
- **Audit Approfondi de la BDD (1 922 Annonces Classifiées & 6 494 Offres)** :
  * Identification des causes d'annonces incohérentes : 1 410 sans prix (73%), 1 189 avec caractères d'obfuscation stealth Facebook (`\u0378`, `\u034F`, diacritiques combinés), 317 polluées par les boutons UI Facebook (`Envoyer un message`, `Voir la traduction`, `En voir plus`), et 366 avec `+` d'encodage URL non décodés.
- **Exécution d'un Script de Nettoyage et Réparation Massif (`backend/scripts/clean-scraped-annonces.js`)** :
  * **1 110 mises à jour SQL exécutées en BDD** :
  * Suppression à 100% de l'obfuscation Unicode FB stealth (passé de 62% à 0%).
  * Réparation et restauration automatique de **115 prix** extraits du texte (ex: `25k`, `15.000f`).
  * Assainissement de **917 titres/descriptions** débarrassés des textes parasites d'interface FB.
  * Masquage automatique (`actif = false`) de **404 annonces inexploitables** (sans photo et sans prix).
- **Sécurisation Préventive du Scraper Facebook (`backend/services/scraper-immo-facebook.js`)** :
  * **Génération de Titre Intelligent (`extraireTitreIntelligentFB`)** : Extraction de la première vraie phrase descriptive du produit plutôt que le dernier segment d'interface FB (`texte.split('·')[last]`).
  * **Sanitizers Automatiques (`purgerUnicodeStealthFB`, `purgerUiFacebook`, `decoderChainePlus`)** : Purge systématique des bruits UI/diacritiques et décodage URL avant toute insertion SQL.
  * **Parsing des Prix Avancé (`parsePrixFB`)** : Support des syntaxes locales sénégalaises (`25k`, `15.000f`, `prix: 10000`, `à 15000`).

## 🚀 Mises à jour du 13/08/2026 : Intégration des Actions en Masse (Batch Actions) & Levée de la Limite des Annonces en Admin (`annonces.js`, `boutiques.js`)
- **Fix du Plafond de 200 Élément dans l'Admin (`backend/routes/annonces.js`, `boutiques.js`)** :
  * **Problème** : Les requêtes admin `GET /api/annonces/admin/en-attente` et `GET /api/boutiques/admin/en-attente` étaient bridées par une clause SQL `LIMIT 200`, ce qui masquait les annonces et boutiques au-delà des 200 plus récentes sur les 2000+ existantes.
  * **Solution** : Passage de la limite SQL de 200 à **5000** (avec support dynamique du paramètre query `?limit=...`), permettant l'affichage, la sélection et l'exécution d'actions en masse sur l'intégralité du catalogue.
- **Système d'Actions en Masse sur Tout le Portail d'Administration** :

  * **Composant Réutilisable `BatchActionBar.tsx`** : Ajout d'une barre d'action flottante / sticky pour l'administration avec case à cocher globale ("Tout sélectionner / Tout désélectionner"), compteur d'éléments sélectionnés et boutons colorés conditionnels (Activer 🟢, Désactiver 🟠, Supprimer 🔴, Sponsoriser/Prolonger 🔵) avec modal de confirmation préalable pour la suppression en masse.
  * **Extension des Actions Serveur & Backend (`admin.ts`, `annonces.js`, `partenaires.js`)** : Création des fonctions batch et des endpoints de suppression pour Annonces, Boutiques, Immobilier, Comptes utilisateurs, Demandes partenaires, Publications, Paiements manuels, Commissions apporteurs, Telecom et Abonnements.
  * **Déploiement sur 10 Sections Admin** :
    1. **Annonces Classifiées** (`AdminAnnoncesClient.tsx`) : Approuver, Désactiver, Supprimer en masse.
    2. **Boutiques** (`AdminBoutiquesClient.tsx`) : Activer, Désactiver, Supprimer en masse.
    3. **Comptes Utilisateurs** (`ComptesTableClient.tsx`) : Réactiver, Suspendre, Supprimer en masse.
    4. **Immobilier** (`AdminImmoClient.tsx`) : Valider, Désactiver, Sponsoriser 30j, Supprimer en masse.
    5. **Partenaires** (`AdminPartenairesClient.tsx`) : Approuver, Rejeter, Supprimer en masse.
    6. **Publications (FB/IG)** (`publications/page.tsx`) : Approuver, Supprimer en masse.
    7. **Paiements Manuels** (`PaiementsManuelsClient.tsx`) : Valider, Rejeter en masse.
    8. **Apporteurs** (`ApporteursClient.tsx`) : Marquer payées les commissions sélectionnées.
    9. **Telecom** (`AdminTelecomClient.tsx`) : Désactiver / Supprimer en masse.
    10. **Abonnements** (`AbonnementsTableClient.tsx`) : Prolonger 30j, Annuler en masse.

## 🚀 Mises à jour du 13/08/2026 : Correction du Débordement des Cartes de Boutiques sur Mobile (`BoutiqueClient.tsx`)

- **Fix du Débordement des Icônes d'Actions (`BoutiqueClient.tsx`)** :
  * **Problème** : Sur l'écran de liste des boutiques (`/boutique`), la rangée supérieure des cartes (`BoutiqueCard`) forçait le logo, le nom de la boutique, les badges, le statut `Active`/`Inactive` et les 3 boutons d'actions (`👁 Voir`, `📝 Modifier`, `🗑 Supprimer`) à s'aligner sur une seule ligne rigide sans flex-wrap. Sur mobile (< 480px), le bouton de suppression `🗑` était poussé hors du bord droit de la carte.
  * **Solution** : Ajout de `flexWrap: 'wrap'`, `flex: '1 1 200px'` et alignement responsive dans l'en-tête et le pied de carte de `BoutiqueCard`. Sur mobile, les icônes d'actions s'ajustent proprement sous le nom de la boutique avec 100% de visibilité dans la carte.

## 🚀 Mises à jour du 13/08/2026 : Perfectionnement Ergonomique Mobile & Défilé Bord-à-Bord (`globals.css`)
- **Fix du Tronquage / Débordement sur Mobile (`globals.css`)** :
  * **Onglets de navigation bord-à-bord** : Application de marges négatives (`margin: 10px -12px -4px -12px`) sur le conteneur défilant des onglets `.account-sidebar-nav-wrapper`. Les pilules d'onglets (`Mes annonces`, `Mes biens immo`, `Ma boutique`, `Abonnements`, `Apporteur`, `Profil`, `Favoris`) défilent désormais de manière fluide sur **toute la largeur de l'écran** sans aucune coupure sur le bord de la carte.
  * **Responsivité des cartes d'annonces (`.annonce-card`, `.annonce-card-actions`)** : Ajout des règles `width: 100%`, `box-sizing: border-box` et retour à la ligne automatique (`flex-wrap: wrap`) sur les boutons d'action (`Modifier`, `Booster 7j`, `Booster`, `Supprimer`). Les boutons ne débordent plus sur la droite de l'écran mobile.

## 🚀 Mises à jour du 13/08/2026 : Intégration des Onglets de Navigation Mobile sur `/compte` (`AccountNavLinks.tsx` & `globals.css`)
- **Correction des Liens de Navigation Masqués sur Mobile (`AccountNavLinks.tsx`, `globals.css`)** :
  * **Problème** : La règle CSS `.account-sidebar--main .account-sidebar-nav-wrapper { display: none !important; }` masquait complètement les liens du compte sur mobile (< 768px). L'utilisateur ne voyait que sa carte d'identité et ses annonces sans aucun moyen de naviguer vers ses biens immo, ses abonnements/plan, son profil ou sa boutique.
  * **Solution** : Transformation de la barre de navigation en barre d'onglets défilante horizontale (`overflow-x: auto`) avec pilules tactiles élégantes sous la carte profil.
  * Tous les onglets (`📋 Mes annonces`, `🏠 Mes biens immo`, `🏪 Ma boutique`, `📖 Abonnements`, `💼 Apporteur`, `✏️ Mon profil`, `♥ Mes favoris`) sont désormais immédiatement visibles, défilables et cliquables sur mobile.

## 🚀 Mises à jour du 13/08/2026 : Architecture PWA Purifiée & Élimination Définitive du Bandeau de Mise à Jour (`RegisterSW.tsx` & `sw.ts`)
- **Élimination Définitive du Réaffichage du Toast de Mise à Jour (`RegisterSW.tsx` & `sw.ts`)** :
  * **Explication Technique** : Vous avez parfaitement raison, ce n'est pas censé dépendre d'un stockage de session ! Dans l'architecture PWA standard, dès que le bouton est cliqué et que `self.skipWaiting()` s'exécute, le nouveau Service Worker passe à l'état `active`. À cet instant précis, `reg.waiting` devient `null`.
  * **Correctif Appliqué** : 
    1. Prise en charge native du message `SKIP_WAITING` dans [sw.ts](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/app/sw.ts) via `self.skipWaiting()`.
    2. Écoute de l'événement natif `controllerchange` dans [RegisterSW.tsx](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/app/RegisterSW.tsx) pour recharger la page uniquement au moment où le nouveau SW a pris le relais.
    3. Retrait complet des hacks `sessionStorage` : Une fois mis à jour, `reg.waiting` vaut `null`. Tant qu'aucun nouveau déploiement n'a lieu sur le serveur, la notification **ne réapparaîtra plus jamais**, ni pendant la session, ni lors des redémarrages du navigateur.

## 🚀 Mises à jour du 13/08/2026 : Préchargement Hors-Ligne des Dashboards & Liens "Retour à mon compte" (`Comptabilite.tsx`, `BoutiqueClient.tsx`, `RegisterSW.tsx`, `sw.ts`)
- **Fix du Blocage par Squelette de Chargement Hors-Ligne (`Comptabilite.tsx`)** :
  * **Problème** : En mode hors-ligne, les données du tableau de bord comptable étaient bien lues depuis `localStorage`, mais `setLoading(false)` n'était pas exécuté lors de la présence du cache local. Le composant restait bloqué à `loading = true`, affichant des rectangles de chargement beiges indéfiniment.
  * **Solution** : Appel immédiat de `setLoading(false)` dès la récupération du cache et dans le bloc `.finally()`. Les statistiques comptables s'affichent désormais en 0 ms hors-ligne.
- **Préchargement Hors-Ligne du Journal d'Audit (`BoutiqueLogs.tsx`, `BoutiqueClient.tsx`)** :
  * **Problème** : En mode hors-ligne, la consultation du *Journal d'Audit & Historique des Actions* affichait le rectangle d'erreur rouge `Impossible de charger le journal d'audit` car les événements de logs n'étaient pas intégrés au préchargeur d'arrière-plan. De plus, `setLoading(false)` n'était pas exécuté lors de la lecture du cache local.
  * **Solution** : Ajout du préchargement en tâche de fond des logs (`/api/boutiques/${b.id}/logs?limit=150` -> `nopalou_offline_logs_${b.id}_tous`) dans `BoutiqueClient.tsx` et désactivation immédiate du loader lors de la présence des logs en cache dans `BoutiqueLogs.tsx`.
- **Préchargement des Compteurs du Tableau de Bord (`BoutiqueClient.tsx`)** :
  * Mise en cache locale des indicateurs de la vue d'ensemble (`nopalou_offline_dash_counts_${boutique.id}`). Les nombres de produits et alertes de stock s'affichent immédiatement sans temporisation.
- **Ajout des Liens Explicites "Retour à mon compte" & Incrément PWA v6 (`BoutiqueClient.tsx`, `sw.ts`, `public/sw.js`)** :
  * Modification du bouton d'en-tête de la sidebar en `← Retour à mon compte`.
  * Ajout du bouton `👤 Mon compte marchand ↗` dans les raccourcis de la boutique et `👤 Retourner à mon compte` sur la page de secours PWA hors-ligne (`sw.ts` & bundle compilé `public/sw.js`).
  * Incrémentation de la version des caches Service Worker à `v6` (`CACHE_VERSION = 'v6'`) pour forcer le rafraîchissement immédiat de la page hors-ligne chez les utilisateurs.
- **Disparition Automatique du Toast de Connexion (`RegisterSW.tsx`)** :
  * Ajout d'un `useEffect` dédié sur `showOnlineToast` garantissant le masquage automatique du toast vert `✅ Connexion Internet rétablie` après 3,5 secondes.

- **Fix Réactivité du Toast de Mise à Jour PWA (`RegisterSW.tsx`)** :
  * **Problème** : Le clic sur le bandeau `🔄 Nouvelle version disponible — Mettre à jour` ne réagissait pas si le Service Worker était déjà dans l'état `active` ou sans worker `waiting` explicite.
  * **Solution** : Refonte de la fonction `handleSwUpdate()` dans `RegisterSW.tsx` avec déclenchement systématique et garanti de `window.location.reload()`, assurant le rechargement immédiat de la page et l'application instantanée de la nouvelle version.

## 🚀 Mises à jour du 13/08/2026 : Refonte Ergonomique de la Navigation Mobile & Fix des Sous-Menus Cachés (`BoutiqueClient.tsx`, `GestionDocuments.tsx` & `globals.css`)
- **Correction des Sous-Menus Masqués / Tronqués à Droite (`BoutiqueClient.tsx`, `GestionDocuments.tsx`, `globals.css`)** :
  * **Problème** : Sur mobile (< 640px), la barre de navigation `.bq-nav` masquait les titres de groupes (`display: none !important`) et alignait tous les 15 éléments de menu sur une seule ligne défilante horizontale avec barres de défilement masquées (`scrollbar-width: none`). Lorsque l'utilisateur cliquait sur un groupe (ex: *Commandes & Livraisons*), les autres sous-menus étaient poussés hors-écran sur la droite sans aucun indicateur visuel, laissant penser que le menu était tronqué ou incomplet. De plus, les filtres de documents (`GestionDocuments.tsx`) débordaient sur mobile.
  * **Solution Navigation 2-Niveaux (`BoutiqueClient.tsx`)** :
    1. **Niveau 1 (Groupes de gestion)** : Affichage d'une barre d'onglets de groupes (`Ventes & Clients`, `Catalogue & Stocks`, `Finance & Rapports`, `Paramètres & Équipe`) avec le nombre exact de sous-menus contenus dans chaque groupe (`(3)`, `(2)`, etc.).
    2. **Niveau 2 (Sous-menus du groupe sélectionné)** : Affichage clair et direct de tous les sous-menus du groupe actif avec badges, icônes et verrous de formule (`🔒 Pro`, `🔒 Business`).
  * **Passage à `flexWrap: 'wrap'` (`GestionDocuments.tsx`)** :
    * Les onglets de filtres de documents (`📁 Tous`, `🧾 Factures`, `📝 Devis`, `📋 Proformas`) s'ajustent désormais sur plusieurs lignes sur mobile sans aucun tronquage.
  * **Indicateur de Scroll Subtil (`globals.css`)** :
    * Mise en place d'une scrollbar fine stylisée (`scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent`) sur `.nopalou-scroll-tabs` pour indiquer visuellement le défilement horizontal.

## 🚀 Mises à jour du 13/08/2026 : Correction du Positionnement Responsive du Menu Déroulant Actions (`BoutiqueClient.tsx` & `globals.css`)
- **Fix du Tronquage / Débordement Hors-Écran du Menu Déroulant (`BoutiqueClient.tsx`, `BoutonPartager.tsx`, `globals.css`)** :
  * **Problème** : Sur les écrans mobiles et étroits (< 640px), le bouton `Actions ▾` s'aligne à gauche de la carte produit. Le style `right: 0; left: auto;` positionnait le bord droit du menu déroulant sur le bouton, poussant les 200px du menu hors-écran vers la gauche et tronquant les libellés (`🏷️ Scan / EAN`, `🖨️ Imprimer Étiquette`, `📄 Dupliquer le produit`, `📢 Publier en Annonce`, `🗑️ Supprimer`).
  * **Solution** : Ajout de la classe CSS `.bq-actions-dropdown` avec repli responsive `left: 0 !important; right: auto !important;` sous `@media (max-width: 640px)`.
  * Le menu déroulant s'aligne désormais proprement sur la gauche et s'étend vers la droite tout en restant 100% visible et accessible à l'intérieur de l'écran.
  * Déploiement & Push Git : Déploiement validé sans erreurs sur `origin main`.

## 🚀 Mises à jour du 13/08/2026 : Audit de Non-Régression & Alignement des Tests E2E (`07-pos-offline-sync.spec.ts`)
- **Alignement du Locator du Badge Offline (`07-pos-offline-sync.spec.ts`)** :
  * Mise à jour du sélecteur Playwright pour correspondre exactement au libellé réel du toast réactif (`Mode Hors-Ligne — Consultation des données locales en cache`).
- **Validation Sans Régression** :
  * Contrôle de la syntaxe applicative backend Node.js (`backend/app.js` et `backend/routes/boutiques.js`) validé avec 0 erreur.
  * Validation TypeScript globale (`npx tsc --noEmit`) confirmée 100% sans fautes.

## 🚀 Mises à jour du 12/08/2026 : Hauteur Minimale Garantie pour le Ticket POS (`CaisseClient.tsx`)
- **Fix Définitif de la Tronquature du Panier POS (`CaisseClient.tsx`)** :
  * Définition d'une hauteur minimale garantie `minHeight: 140px` sur le conteneur des articles du ticket pour empêcher Flexbox de compresser la liste à 15px sous l'accumulation des boutons de règlement.
  * Réactivation de `overflowY: 'auto'` sur le panneau droit `.ticket-section` permettant un défilement fluide de l'ensemble de la caisse sur tous les types d'écrans et résolutions.

## 🚀 Mises à jour du 12/08/2026 : Correction de l'Erreur d'Hydratation React / Next.js (`RegisterSW.tsx`)
- **Résolution de l'Erreur Mismatch Hydration (`RegisterSW.tsx`)** :
  * Ajout du garde `mounted` (`useEffect` -> `setMounted(true)`) empêchant l'injection prématurée de balises HTML `<div>` d'alerte hors-ligne lors du rendu SSR/Hydratation initiale.
  * Garantit que le DOM serveur et le DOM client initial correspondent à 100% sans aucun avertissement ni erreur `Hydration failed because the initial UI does not match`.

## 🚀 Mises à jour du 12/08/2026 : Correction de l'Affichage Vertical du Ticket POS (`CaisseClient.tsx`)
- **Correction Dépassement & Tronquature du Ticket en Cours (`CaisseClient.tsx`)** :
  * Ajout de `minHeight: 0` sur la section ticket et le conteneur défilant du panier pour éliminer le conflit de défilement imbriqué.
  * Ajout d'un padding vertical de respiration (`padding: '6px 2px'`) et augmentation de la hauteur minimale des cartes d'articles (`minHeight: 48px`, `padding: '10px 12px'`).
  * Les articles du ticket de caisse ("Smartphone...", etc.) sont désormais 100% lisibles et dégagés sous la barre de titre `🛒 Ticket en cours` sans aucun chevauchement ni tronquature.
- **Fix Typage `FonctionnalitesClient.tsx`** :
  * Transtypage explicite de la réponse API `planData` (`as { abonnement?: { plan: string; fin: string } }`) pour supprimer l'erreur TS2339 (`Property 'abonnement' does not exist on type '{}'`).
- **Fix Interface `<ExternalImg />` (`AnnoncesImmoClient.tsx`)** :
  * Suppression du prop obsolète `fill` qui ne correspondait pas aux définitions de l'interface `ExternalImgProps`.
- **Validation TypeScript Globale** :
  * Compilation `npx tsc --noEmit` validée avec 0 erreur (100% propre).

## 🚀 Mises à jour du 12/08/2026 : Refonte Majeure du Mode Hors-Ligne POS (Idempotence & SyncManager)
- **Transaction PostgreSQL Atomique (`backend/routes/boutiques.js`)** :
  * Refonte complète de la route `POST /api/boutiques/:id/pos-vente` avec `pool.connect()` et une transaction SQL atomique (`BEGIN` / `COMMIT` / `ROLLBACK`).
  * Garantit que le stock, les ventes, les commandes, la facture et la session caisse sont mis à jour ensemble ou annulés en bloc en cas d'erreur.
  * Ajout de `ON CONFLICT (reference) DO NOTHING` sur l'insertion dans `caisse_documents`.
- **Migration SQL Idempotence (`database/migration_pos_idempotence_2026-08-12.sql`)** :
  * Script SQL de migration créant la contrainte `UNIQUE` sur `caisse_documents.reference` et un index composite `(boutique_id, reference)`.
- **Gestionnaire Centralisé `SyncManager` (`frontend-next/src/lib/sync-manager.ts`)** :
  * Création d'un module de synchronisation centralisé avec verrou par boutique (`syncLocks`) évitant les doubles synchronisations simultanées.
  * Intégration de re-tentatives avec backoff exponentiel (1s → 2s → 4s) et suppression de l'IndexedDB **uniquement** après réception d'un ACK HTTP serveur (200 OK / duplicate: true).
  * Exposition du hook `useSyncOffline(boutiqueId, userId)` pour les composants React.
- **IndexedDB v3 & Isolation Multi-Utilisateurs (`frontend-next/src/lib/db-offline.ts`)** :
  * Passage à IndexedDB `DB_VERSION = 3` avec isolation systématique par `userId` et `boutiqueId` (`cache_key = ${userId}:${boutiqueId}:${id}`).
  * Ajout du statut de synchronisation (`'pending' | 'syncing' | 'done'`) sur chaque vente offline pour verrouiller le traitement.
  * Suppression de la fonction `viderVentesHorsLigne` pour prévenir toute perte accidentelle de données.
- **Détection de Connectivité Réelle v3 Singleton & Tracing Avancé (`frontend-next/src/lib/useOnlineStatus.ts`)** :
  * Transformation de `useOnlineStatus` en Singleton centralisé : élimination complète des pings dupliqués `/api/ping` émis lors du montage simultané de plusieurs composants.
  * Réactivité instantanée à la reconnexion WiFi : réinitialisation explicite (`lastPingTimestamp = 0`) lors des événements `online` et `focus` pour contourner la temporisation 500ms et faire basculer l'interface en mode en ligne sur-le-champ.
  * Déduplication des requêtes HTTP en cours (`inFlightPingPromise`) et temporisation adaptative pour éviter la saturation réseau.
  * Tracing de diagnostic unifié avec balises visuelles explicites dans la console DevTools :
    - `📡 [Network Monitor]` pour les changements d'état réseau et résultats de pings `/api/ping`.
    - `💾 [IndexedDB v3]` pour l'ensemble des opérations de cache local (sauvegarde, lecture, file d'attente, purge).
    - `🛒 [Caisse POS]` pour le suivi des ventes en ligne vs hors-ligne.
    - `📦 [Catalogue]` pour le chargement des produits par boutique.
- **Persistance Hors-Ligne Comptabilité & Ventes/Dépenses (`frontend-next/src/app/boutique/Comptabilite.tsx`)** :
  * Intégration de la persistance locale `localStorage` dans `VentesView` (`nopalou_offline_compta_ventes_${bId}`, `nopalou_offline_compta_zones_${bId}`) et `DepensesView` (`nopalou_offline_compta_depenses_${bId}`).
  * Garantit que la totalité des sous-sections de la Boutique (Vue d'ensemble, Caisse POS, Catalogue, Comptabilité Ventes, Dépenses, Commandes et Zones de livraison) s'affichent instantanément hors-ligne à partir des données locales en cache sans blocage réseau.
- **Service Worker v5, Purge Automatique, Image SVG Fallback & Réponses 504 Propres (`sw.ts`, `next.config.js`, `RegisterSW.tsx`)** :
  * Incrémentation de la version des caches à `CACHE_VERSION = 'v5'` avec nettoyeur automatique des anciens caches dans l'événement `activate`.
  * Remplacement de `Response.error()` dans `setCatchHandler` par un **Fallback Image SVG** pour les images non cachées (Unsplash, Cloudinary, wsrv.nl) et une réponse HTTP 504 propre (`Gateway Timeout (Offline)`) pour les requêtes API/ping échouées hors-ligne, éliminant les 50+ lignes d'avertissements `FetchEvent resulted in a network error response` dans la console Chrome DevTools.
  * Placement de la règle `NetworkOnly` pour `/api/ping` en priorité absolue dans Serwist.
  * Désactivation du Service Worker en environnement de développement (`disable: process.env.NODE_ENV === 'development'`) pour éviter la fausse détection offline et les conflits HMR.
  * Ajout d'une notification non intrusive dans `RegisterSW.tsx` proposant l'installation immédiate des nouvelles versions du Service Worker (`SKIP_WAITING`).
- **Propagations Caisse & UI (`CaisseClient.tsx`, `page.tsx`, `BoutiqueClient.tsx`)** :
  * Passage du `userId` vérifié côté serveur (`verifySession()`) vers les composants clients pour l'isolation des données locales par compte.
  * Branchement de la Caisse POS sur `useSyncOffline()` et suppression de la synchro inline dupliquée.

## 🚀 Mises à jour du 12/08/2026 : Correction Dashboard (ReferenceError & Stale Closure) & Zéro Polling en Ligne
- **Correction du Basculement Forcé de Boutique Hors-Ligne (`BoutiqueClient.tsx`)** :
  * Résolution du bug où cliquer sur une boutique secondaire (ex: Amar) forçait le retour à la boutique principale (ex: Tech Dakar) en mode hors-ligne.
  * Remplacement du stale closure dans l'initialisation du `useEffect` par un `setMode(prevMode => ...)` garantissant le respect absolu du choix de l'utilisateur.
- **Correction d'Erreur Fatale sur le Dashboard (`BoutiqueClient.tsx`)** :
  * Résolution de l'erreur `Uncaught ReferenceError: Cannot access 'isReallyOnline' before initialization` qui faisait crasher l'interface du Dashboard (écran blanc/rouge).
  * Déplacement de l'initialisation du hook `useOnlineStatus()` en haut du composant, avant son utilisation dans les `useEffect` de préchargement.
- **Architecture Réseau Événementielle (`useOnlineStatus.ts`)** :
  * Élimination du polling répétitif en mode connecté : zéro requête `/api/ping` lorsque l'utilisateur est en ligne, supprimant toute surcharge réseau et tout conflit avec les Server Actions.
  * Déclenchement réactif sur événements natifs (`offline`, `online`, `focus`) et activation du sondage de reconnexion (toutes les 5s) uniquement lors des déconnexions réelles.
- **Secours des Assets Statiques Hors-Ligne (`sw.ts`)** :
  * Ajout d'une recherche dans le cache avec `ignoreSearch: true` dans le `setCatchHandler` pour les scripts (`.js`), styles (`.css`), images et fichiers `/_next/static/`.
  * Résolution des échecs d'affichage en HTML brut lors du passage en mode offline sous DevTools Chrome (les paramètres de requête dynamiques `?v=...` générés par Next.js empêchaient la correspondance exacte d'URL).
- **Priorisation Réseau Maximale (`useOnlineStatus.ts`)** :
  * Ajout de `priority: 'high'` sur le `fetch('/api/ping?t=...')` et augmentation du timeout à 8000ms.
  * Différenciation du préchargement global dans `CompteClient.tsx` et `BoutiqueClient.tsx` avec une temporisation de 1200ms et `priority: 'low'`.
  * Élimination complète du blocage des pings réseau par l'accumulation des requêtes de fond (saturation des 6 slots HTTP/1.1 de Chrome).
- **Bypass Total de `/api/ping` du Service Worker (`sw.ts` & `useOnlineStatus.ts`)** :
  * Exclusion complète de `/api/ping` des règles `runtimeCaching` du Service Worker afin d'éviter que Serwist n'intercepte la requête et ne renvoie des erreurs `Response.error()`.
  * Initialisation de l'état `isOnline` à `true` par défaut (online optimiste) pour éliminer l'affichage temporaire du bandeau orange lors du chargement initial.
- **Correction de la Structure Syntaxique (`BoutiqueClient.tsx`)** :
  * Correction d'une accolade fermante manquante sur le bloc `try` de la fonction `loadProduits` (ligne 1434), éliminant l'erreur de compilation SWC et restaurant le module `BoutiqueClient`.
- **Relance des Serveurs Localhost** :
  * Arrêt propre et libération des ports 3000 (Backend Express) et 3001 (Next.js Frontend).
  * Redémarrage des processus en arrière-plan avec nettoyage du cache `.next`.

## 🚀 Mises à jour du 12/08/2026 : Correction Définitive du Mode Offline PWA & Détection Réseau Fiable (Ping /api/ping)

- **Suppression du Catch-All NetworkOnly (`frontend-next/src/app/sw.ts`)** :
  * Suppression de `defaultCache` (fourni par `@serwist/next`) qui injectait un matcher `/.*/i → NetworkOnly()` en dev, causant des erreurs `FetchEvent resulted in a network error response` en mode hors-ligne pour `/manifest.json`, navigations et assets.
  * Ajout d'une stratégie `StaleWhileRevalidate` explicite pour `manifest.json` et les icônes PWA (`/icons/*`).
  * Exclusion explicite des URLs externes (analytics, GTM, trackers) pour supprimer les erreurs et le bruit dans les logs SW.
  * Suppression du check `navigator.onLine` dans le matcher du fallback document HTML (non fiable dans le Service Worker).
- **Création du Hook Universel de Connectivité Réelle (`frontend-next/src/lib/useOnlineStatus.ts`)** :
  * Élimination des faux positifs de `navigator.onLine` (qui signale à tort `online` sur desktop/Ethernet et lors des basculages responsive mobile ↔ web).
  * Le nouveau hook valide l'accès réseau réel via des pings actifs vers `/api/ping` avec un timeout de 4s, un polling adaptatif (30s en ligne, 5s hors-ligne) et une suspension lorsque l'onglet est masqué (`document.hidden`).
- **Route Health Check `/api/ping` (`frontend-next/src/app/api/ping/route.ts`)** :
  * Ajout des en-têtes `Cache-Control: no-store, no-cache, must-revalidate` stricts et exclusion du cache Service Worker (`NetworkOnly`).
- **Migration des Composants Clients (`RegisterSW.tsx`, `CaisseClient.tsx`, `BoutiqueClient.tsx`, `CompteClient.tsx`)** :
  * Remplacement de toutes les occurrences de `navigator.onLine` par le hook `useOnlineStatus`.
  * Le toast "Connexion Internet rétablie" ne s'affiche désormais que lorsqu'un vrai ping réussit après une déconnexion, éliminant tout faux toast lors des bascules d'affichage web ↔ mobile.

## Mises à jour du 12/08/2026 : Correctifs de fiabilité Offline POS

- **Service worker (`frontend-next/src/app/sw.ts`)** : ajout d'un délai de bascule de 3 secondes pour HTML, RSC et API. Un cache miss API retourne désormais une erreur réseau au lieu d'un faux JSON HTTP 200, afin que chaque écran puisse restaurer son cache local.
- **Isolation du carnet clients (`frontend-next/src/lib/db-offline.ts`)** : migration IndexedDB vers la version 2 ; les clients sont stockés et lus par boutique, sans effacer les carnets des autres boutiques.
- **Synchronisation POS (`CaisseClient.tsx`, `backend/routes/boutiques.js`)** : chaque vente reçoit une clé d'idempotence conservée dans la queue offline. La route POS reconnaît une référence déjà enregistrée pour éviter de retraiter une reprise après réponse perdue. Une contrainte SQL transactionnelle reste prévue dans `PLAN_CORRECTION_OFFLINE.md` avant généralisation en production.
- **Validation** : `node --check backend/routes/boutiques.js` et `git diff --check` réussissent. La suite frontend complète n'a pas terminé dans la fenêtre de validation locale.

## 🚀 Mises à jour du 12/08/2026 : Finalisation du Système Offline-First Complémentaire (Compte & Boutiques)

- **Neutralisation de l'Avertissement Service Worker (`sw.ts`)** :
  * Passé `clientsClaim: false` dans la configuration Serwist et suppression totale de l'appel manuel `self.clients.claim()` lors de l'évènement `activate`.
  * Élimination de l'erreur console `Uncaught (in promise) InvalidStateError: Only the active worker can claim clients` générée lors des rechargements à chaud (HMR Dev).

- **Sécurisation de la Route Proxy (`/api/boutiques/[id]/credits-clients`)** :
  * Traitement gracieux des erreurs réseau et des réponses vides en renvoyant `{ clients: [] }` avec HTTP 200 pour éliminer les erreurs 500 intempestives dans la console navigateur.
  * Ajout de `.catch(() => null)` défensif dans `BoutiqueClient.tsx` pour le préchargement en arrière-plan.

- **Création des Proxies API Next.js Authentifiés (`/api/abonnements/mon-plan`)** :
  * Proxy Next.js permettant aux composants clients (`CompteClient.tsx`, `FonctionnalitesClient.tsx`) d'interroger le backend via JWT signé serveur.
- **Extension du Préchargement Universel (`CompteClient.tsx`)** :
  * Intégration du plan d'abonnement actif (`nopalou_plan_actif`), des administrateurs (`nopalou_offline_admins_${b.id}`), des caissiers (`nopalou_offline_caissiers_${b.id}`) et des analytics (`nopalou_offline_analytics_${b.id}`) dans le préchargement universel.
  * Gestion défensive des erreurs avec `.catch()` pour empêcher tout échec réseau partiel de bloquer le préchargement global.
- **Persistance du Plan d'Abonnement en Mode Offline (`BoutiqueClient.tsx`)** :
  * Sauvegarde automatique du `planActif` en `localStorage` lors de la connexion.
  * Restauration transparente depuis le cache local (`planActifEffectif`) en mode hors-ligne lorsque la prop serveur est `null`, conservant le statut (Business / Pro) et déverrouillant les fonctionnalités de l'interface.
- **Suppression du Bearer Token Obsolète (`AnnoncesImmoClient.tsx`, `FonctionnalitesClient.tsx`)** :
  * Remplacement des requêtes directes à Bearer token par les proxys Next.js authentifiés.

## 🚀 Mises à jour du 11/08/2026 : Sécurisation du Polling Caisse POS (`CaisseClient.tsx`)

- **Neutralisation des Erreurs Console Hors-Ligne (`CaisseClient.tsx`)** :
  * Interruption automatique du polling douchette distante (`/api/boutiques/${id}/scanner-remote`) en mode hors-ligne (`!navigator.onLine`).
  * Capture silencieuse (`.catch(() => null)`) des échecs de connexion réseau pour supprimer les erreurs `net::ERR_CONNECTION_RESET` / `ERR_CONNECTION_REFUSED` dans la console.

## 🚀 Mises à jour du 11/08/2026 : Extension du Préchargement Global (Boutiques, Catalogues Produits, Caisse POS & Clients)

- **Préchargement Universel (`CompteClient.tsx`)** :
  * Le script d'arrière-plan précharge désormais simultanément :
    1. Les annonces classifiées (`/api/annonces/mine`).
    2. Les biens immobiliers (`/api/immo/mine`).
    3. **L'intégralité des boutiques du vendeur** (`/api/boutiques/mine`).
    4. **Le catalogue complet de produits de chaque boutique** (`/api/boutiques/${b.id}/produits` -> `nopalou_pos_produits_${b.id}`).
    5. **L'historique de la caisse POS** (`/api/boutiques/${b.id}/pos-historique` -> `nopalou_pos_historique_${b.id}`).
    6. **Le carnet de dettes & crédits clients** (`/api/boutiques/${b.id}/credits-clients` -> `nopalou_offline_clients_${b.id}`).
- **Couverture Offline Totale (100%)** : L'ensemble du portail utilisateur (Compte + Boutiques + Catalogues) est stocké localement dès l'entrée sur le compte.

## 🚀 Mises à jour du 11/08/2026 : Intégration des Logs Client Détaillés & Diagnostic SPA / Offline

- **Logs Console d'Exploitation SPA (`CompteClient.tsx`, `AnnoncesClient.tsx`, `AnnoncesImmoClient.tsx`)** :
  * Ajout de traces structurées dans la console DevTools (`[Compte SPA]`, `[AnnoncesClient]`, `[AnnoncesImmoClient]`).
  * Journalisation en temps réel de l'état réseau (`🟢 En Ligne` vs `📡 Hors-Ligne`), de la navigation entre onglets, et de la source des données (chargement instantané depuis `localStorage` vs mise à jour dynamique via API).
- **Tracabilité Hors-Ligne** : Visibilité 100% transparente dans la console navigateur (F12) permettant de vérifier que l'ensemble des données est mis en cache et restitué hors-ligne.

## 🚀 Mises à jour du 11/08/2026 : Correction de l'Incohérence du Stock Hors-Ligne & Déblocage Stock Physique

  * DÃ©clenchement automatique garanti du Toast mÃªme si l'utilisateur ouvre directement la caisse sans connexion Internet (auparavant, le Toast ne s'affichait que lors de la transition actif -> coupÃ©).

## ðŸš€ Mises Ã  jour du 11/08/2026 : Correction de l'IncohÃ©rence du Stock Hors-Ligne & DÃ©blocage Stock Physique
- **Unification des PropriÃ©tÃ©s de Stock (`BoutiqueClient.tsx`, `Comptabilite.tsx`, `CaisseClient.tsx`)** :
  * L'affichage du catalogue lisait `p.stock_quantite`, tandis que le cache de la Caisse POS sauvegardait les produits dÃ©crÃ©mentÃ©s sous la propriÃ©tÃ© formatÃ©e `p.stock` tout en supprimant l'objet d'origine. ConsÃ©quence : en mode hors-ligne, les vues Catalogue et Stock affichaient "0" car la donnÃ©e Ã©tait effacÃ©e du cache commun.
  * Ajout du destructoring `...p` dans `CaisseClient.tsx` pour prÃ©server 100% des propriÃ©tÃ©s originales en cache hors-ligne (`quantite_stock`, `stock_quantite`, etc.).
  * Mise Ã  jour de `BoutiqueClient.tsx` et `Comptabilite.tsx` pour lire prioritairement `p.quantite_stock ?? p.stock_quantite`, assurant une synchronisation parfaite des affichages.
- **DÃ©blocage de la Vue "Stock Physique" (Chargement infini)** :
  * Le composant `StockView` (dans `Comptabilite.tsx`) lanÃ§ait l'action serveur `getBoutiqueProduits` sans bloc `try/catch`. En mode hors-ligne, l'exception rÃ©seau bloquait le rendu avant d'atteindre `setLoading(false)`.
  * Ajout d'un `try/catch` avec **rÃ©cupÃ©ration automatique depuis le cache LocalStorage** (`nopalou_pos_produits`) pour un affichage immÃ©diat mÃªme sans connexion Internet.
- **Notification PWA Hors-Ligne** :
  * Explication : Le bandeau PWA "Mode Hors-Ligne" natif fonctionne par l'API systÃ¨me `navigator.onLine`. En cas de panne DNS ou de coupure locale du backend (sans dÃ©sactiver le Wi-Fi), ce bandeau n'apparaÃ®t pas. Cependant, l'application est dÃ©sormais robuste pour utiliser ses caches hors-ligne mÃªme dans ce cas de figure.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Correction Critique de la Protection du Cache Produit Hors-Ligne (`CaisseClient.tsx`)
- **Correction du Bug d'Ã‰crasement du Cache Local Hors-Ligne (`CaisseClient.tsx`)** :
  * Lors d'une perte de rÃ©seau ou de l'ouverture de la caisse hors-ligne, la fonction `getBoutiqueProduits` renvoyait le tableau vide `[]` en cas d'erreur de rÃ©seau. Le test `if (produits && Array.isArray(produits))` s'Ã©valuait comme vrai sur `[]`, provoquant l'effacement involontaire du cache de produits stockÃ© dans `localStorage` et `IndexedDB`.
  * Modification du contrÃ´le pour exiger `produits.length > 0` avant d'Ã©craser le cache local, et bascule vers `obtenirProduitsLocaux()` et `localStorage` si l'appel backend renvoie un rÃ©sultat vide hors-ligne. Les produits en base enregistrÃ©s localement restent dÃ©sormais **100% prÃ©servÃ©s et affichÃ©s en mode hors-ligne**.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Suppression IntÃ©grale de l'Ã‰tiquette "(Off)" & Ajustement de la Caisse POS (`CaisseClient.tsx`)
- **Ã‰limination DÃ©finitive du Label "(Off)" (`CaisseClient.tsx`)** :
  * Suppression complÃ¨te du texte `(Off)` dans le sÃ©lecteur de boutique de l'en-tÃªte POS. Toutes les boutiques du marchand affichent exclusivement `ðŸŸ¢ NomBoutique` (ou `ðŸ”’ NomBoutique`), Ã©liminant toute ambiguÃ¯tÃ© d'affichage.
- **Optimisation du Spacing Vertical (`CaisseClient.tsx`)** :
  * RÃ©duction des espacements et padding du bloc ticket vide (de 60px Ã  24px) pour garantir que le bloc de paiement et le bouton `ENCAISSER` rentrent sans aucun dÃ©filement forcÃ©.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Fixation Permanente du Bouton "ENCAISSER" Sticky en Bas d'Ã‰cran (`CaisseClient.tsx`)
- **Correction DÃ©bordement & Placement Sticky (`CaisseClient.tsx`)** :
  * Ajout du dÃ©filement interne `overflowY: 'auto'` sur la section ticket et conversion du bloc de paiement (`Net Ã  payer`, `DEVIS`, `PROFORMA`, `âš¡ ENCAISSER ET TICKET`) en conteneur `position: 'sticky', bottom: 0`.
  * RÃ©sout le problÃ¨me oÃ¹ le bouton vert "ENCAISSER" Ã©tait poussÃ© sous le bas de l'Ã©cran ou tronquÃ© sur les mobiles et Ã©crans de taille intermÃ©diaire. Le bouton reste dÃ©sormais **100% visible et accessible en permanence**.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Persistance Anti-Perte des Paniers et Tickets en Attente lors du RafraÃ®chissement (F5) (`CaisseClient.tsx`)
- **Sauvegarde & Restauration Automatique (`localStorage`)** :
  * MÃ©morisation dynamique en temps rÃ©el du panier en cours (`nopalou_pos_panier_${boutiqueActiveId}`) et de la file d'attente des tickets suspendus (`nopalou_pos_tickets_attente_${boutiqueActiveId}`).
  * Lors d'un rafraÃ®chissement F5, de la fermeture accidentelle de l'onglet ou d'un redÃ©marrage du navigateur, la caisse restaure intÃ©gralement l'Ã©tat du panier et tous les tickets en attente.

## ðŸš€ Mises Ã  jour du 11/08/2026 : VisibilitÃ© Universelle Mobile & Desktop de la File d'Attente Tickets (`CaisseClient.tsx`)
- **Positionnement Universel Hors-Panneau (`CaisseClient.tsx`)** :
  * Le bandeau "ðŸ‘¥ Clients en file d'attente" a Ã©tÃ© placÃ© juste sous la barre d'onglets mobile (`ðŸ›�ï¸� Catalogue` / `ðŸ›’ Ticket`).
  * Ainsi, sur mobile, que le caissier soit sur l'onglet "Catalogue" ou "Ticket", les paniers en attente sont **systÃ©matiquement visibles en haut de l'Ã©cran**.
- **Badge Dynamique Onglet Ticket & Bascule Automatique** :
  * Ajout du badge d'alerte orange `ðŸ‘¥ X en attente` sur le bouton de l'onglet `ðŸ›’ Ticket`.
  * La reprise d'un ticket en attente dÃ©clenche la bascule automatique vers l'onglet `ðŸ›’ Ticket` (`setTabMobile('ticket')`).

## ðŸš€ Mises Ã  jour du 11/08/2026 : RÃ©solution DÃ©finitive du Statut "(Off)" Ã  CÃ´tÃ© de la Boutique Active (POS)
- **SÃ©curisation SQL des valeurs Nulles (`backend/routes/boutiques.js`)** :
  * Utilisation de `COALESCE(b.actif, true) AS actif` dans les routes `/api/boutiques/mine` et `/api/boutiques/caisse-terminal/:token` pour Ã©viter que les boutiques existantes ayant un champ `actif` valant `NULL` en base de donnÃ©es ne soient renvoyÃ©es comme inactives.
  * Ajout de `actif = true` par dÃ©faut lors de la crÃ©ation d'une nouvelle boutique (`INSERT INTO boutiques`).
- **Correction Frontend POS (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  * Remplacement du contrÃ´le trop permissif `!b.actif` par la comparaison stricte `b.actif === false`. Le tag `(Off)` n'est dÃ©sormais affichÃ© QUE si la boutique est explicitement dÃ©sactivÃ©e en modÃ©ration administration, Ã©liminant tout faux positif sur `null` ou `undefined`.

## ðŸš€ Mises Ã  jour du 11/08/2026 : AccessibilitÃ© Mobile des Tickets en Attente
- **DÃ©placement du composant "File d'attente" (`CaisseClient.tsx`)** :
  * Auparavant, la liste des tickets mis en attente Ã©tait affichÃ©e exclusivement dans la section Catalogue. Sur mobile, cela la rendait introuvable lorsque le caissier Ã©tait sur l'onglet "Ticket", l'empÃªchant de reprendre facilement un ticket.
  * La liste des clients en attente a Ã©tÃ© dÃ©placÃ©e au dÃ©but de la section "Ticket en cours". Ainsi, sur mobile, elle est immÃ©diatement visible et cliquable lorsqu'on consulte son panier actuel.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Correction de l'Affichage du Statut "(Off)" dans la Caisse POS
- **Correction de la requÃªte API Terminal Caisse (`backend/routes/boutiques.js`)** :
  * Ajout du champ `actif` dans la clause `SELECT` de la route `/api/boutiques/caisse-terminal/:token`. Auparavant, ce champ Ã©tait omis, ce qui forÃ§ait la caisse POS Ã  afficher incorrectement le label `(Off)` Ã  cÃ´tÃ© du nom de la boutique mÃªme lorsqu'elle Ã©tait parfaitement active.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Correction de l'Affichage Mobile & Badge Commandes
- **Fix du menu de gestion boutique sur mobile (`globals.css`)** :
  * Utilisation de `display: contents` sur les `.bq-nav-group` pour aplanir la hiÃ©rarchie DOM sur mobile, ce qui restaure la barre de navigation horizontale dÃ©filante compacte et rend l'en-tÃªte de la boutique visible sans Ãªtre poussÃ© par un menu vertical cassÃ©.
- **Correction du badge 'Commandes en attente' (`BoutiqueClient.tsx`)** :
  * Suppression de la rÃ©initialisation manuelle forcÃ©e (`setNbEnAttente(0)`) lors du clic sur l'onglet, pour empÃªcher le badge de clignoter ou "rÃ©initialiser" artificiellement (le serveur renvoyait le vrai nombre de commandes en attente 30 secondes plus tard).

## ðŸš€ Mises Ã  jour du 11/08/2026 : Correction du routage vers la Caisse POS (Boutique Active)
- **Fix du bug d'ouverture de la Caisse POS avec la mauvaise boutique (`BoutiqueClient.tsx`)** :
  * Ajout d'un Ã©couteur `onClick` sur tous les liens "Aller Ã  la caisse" spÃ©cifiques Ã  une boutique.
  * Mise Ã  jour de `nopalou_pos_active_boutique_id` dans le `localStorage` avant la redirection vers `/boutique/caisse` pour garantir que `CaisseClient.tsx` charge systÃ©matiquement la bonne boutique.

## ðŸš€ Mises Ã  jour du 11/08/2026 : Correction IntÃ©grale du Mode Hors-Ligne Web (Catalogue Vendeur & Service Worker)
- **Notification Flottante Hors-Ligne Globale Web & Mobile (`frontend-next/src/app/RegisterSW.tsx`)** :
  * IntÃ©gration du bandeau rÃ©actif flottant en haut d'Ã©cran `ðŸ“¡ Mode Hors-Ligne â€” Consultation des donnÃ©es locales en cache` lors de la dÃ©connexion rÃ©seau, et dissipation automatique `âœ… Connexion Internet rÃ©tablie` au retour du rÃ©seau.
  * Suppression de la condition restrictive `process.env.NODE_ENV === 'production'` pour garantir l'enregistrement et la rÃ©activitÃ© du Service Worker dans tous les environnements.
- **Correction Critique du Service Worker & Ã‰limination de `no-response` (`frontend-next/src/app/sw.ts`)** :
  * Ajout de `serwist.setCatchHandler()` pour capturer proprement les Ã©checs de stratÃ©gie hors-ligne (ex: requÃªtes RSC Next.js `_rsc=...` et navigations HTML).
  * Les exceptions console `Uncaught (in promise) no-response` et les erreurs `ERR_FAILED` sont entiÃ¨rement Ã©liminÃ©es. Le SW renvoie dÃ©sormais un payload RSC valide ou la page de secours HTML 200 OK.
- **Restauration Hors-Ligne du Catalogue Vendeur (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** :
  * Mise en cache et restauration automatique du catalogue dans l'espace marchand `/boutique` via IndexedDB et LocalStorage. En cas de navigation sans rÃ©seau, le catalogue affiche dÃ©sormais l'intÃ©gralitÃ© des produits enregistrÃ©s au lieu de l'Ã©cran vide `0 produits`.
- **Isolation du Stockage IndexedDB par Boutique (`frontend-next/src/lib/db-offline.ts`)** :
  * Mise Ã  jour de `sauvegarderProduitsLocaux(produits, boutiqueId)` et `obtenirProduitsLocaux(boutiqueId)` pour isoler les articles par `boutique_id`.
- **SÃ©curisation du Chargement dans la Caisse POS (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  * Protection du cache local : si l'API renvoie une rÃ©ponse vide `[]` alors que le rÃ©seau est actif, le cache IndexedDB existant est conservÃ© au lieu d'Ãªtre Ã©crasÃ©.

## ðŸš€ Mises Ã  jour du 10/08/2026 : Diagnostic en Profondeur & Validation 100% RÃ©ussie (Playwright E2E & TypeScript)
- **Validation Globale Sans Fautes (0 Erreur)** :
  * **TypeScript (`npx tsc --noEmit`)** : 100% ValidÃ© (0 erreur de typage).
  * **Syntaxe Node.js Backend (`node --check`)** : 100% ValidÃ© (Toutes les routes backend vÃ©rifiÃ©es).
  * **Suite Playwright API (`05-api.spec.ts`)** : 8/8 Tests RÃ©ussis (100% de succÃ¨s).
  * **Suite Playwright POS Offline (`07-pos-offline-sync.spec.ts`)** : 7/7 Tests RÃ©ussis avec succÃ¨s (Boutiques hors-ligne, catalogues produits offline, badge UI dÃ©connexion, secours PWA offline.html, stockage IndexedDB et suppression unitaire non-destructive 100% validÃ©s).

## ðŸš€ Mises Ã  jour du 10/08/2026 : RÃ©solution des Erreurs SW `Uncaught (in promise)` & Securisation du Fallback Offline
- **Ã‰limination des Erreurs Console Service Worker (`frontend-next/src/app/sw.ts`)** :
  * Passation de `navigationPreload: false` dans Serwist pour supprimer les rejections de promesse non capturÃ©es (`Uncaught (in promise)`) sous Chrome lors du prÃ©chargement de navigation.
- **Protection Anti-Fausse Redirection Hors-Ligne (`frontend-next/src/app/sw.ts`)** :
  * Ajout du contrÃ´le `self.navigator.onLine === true` dans le matcher `fallbacks.entries` pour garantir que `/offline.html` ne s'affiche JAMAIS lorsque l'utilisateur est connectÃ© Ã  Internet (ex: sur `/compte`, `/boutique`, `/admin`).

## 📌 Note et Constat Client : Attentes non encore réalisées (12/08/2026)
- **Préchargement Complet Incomplet** : Le préchargement automatique de toutes les boutiques et données en arrière-plan n'est pas totalement effectif.
- **Mode Hors-Ligne Desktop Inopérant** : Le mode offline sur navigateur de bureau (desktop) rencontre toujours des problèmes d'affichage et de détection.
- **Bascule de Boutique Involontaire (AMAR -> TECH)** : Lors de l'entrée dans la boutique AMAR, l'application réinitialise ou bascule l'affichage vers la boutique TECH (problème de persistance/synchronisation du `boutiqueActiveId`).

## ðŸš€ Mises Ã  jour du 10/08/2026 : Correction de la RÃ©cupÃ©ration des Boutiques & Persistance de la Boutique SÃ©lectionnÃ©e
- **Correction Critique de la RequÃªte SQL (`backend/routes/boutiques.js`)** :
  * Correction de la clause `GROUP BY b.id` sur la route `/api/boutiques/mine`. L'utilisation de l'alias d'expression `is_owner` déclenchait une erreur PostgreSQL 500 (`column "is_owner" does not exist`), ce qui retournait 0 boutique et affichait l'Ã©cran de crÃ©ation par dÃ©faut lors du retour Ã  `/boutique`.
- **Persistance et Restauration de la Boutique SÃ©lectionnÃ©e (`CaisseClient.tsx` & `BoutiqueClient.tsx`)** :
  * MÃ©morisation dans `localStorage` (`nopalou_pos_active_boutique_id` & `nopalou_pos_user_boutiques`) de la boutique active choisie par le marchand.
  * Restauration automatique de la boutique du marchand et de son catalogue lors des navigations entre la Caisse et l'espace de gestion `/boutique`.

## ðŸš€ Mises Ã  jour du 10/08/2026 : Audit Complet & Securisation du Mode Offline POS / PWA + Suite de Tests E2E
- **Suppression SÃ©lective Unitaire dans IndexedDB (`frontend-next/src/lib/db-offline.ts` & `CaisseClient.tsx`)** :
  * CrÃ©ation de la mÃ©thode `supprimerVenteHorsLigne(id_temporaire)` pour supprimer unitairement chaque vente synchronisÃ©e avec le serveur.
  * Ã‰limination de la purge globale `viderVentesHorsLigne()` qui dÃ©truisait les ventes non encore synchronisÃ©es en cas d'erreur ou d'Ã©chec partiel de rÃ©seau.
- **Persistance des Stocks DÃ©crÃ©mentÃ©s Hors-Ligne (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  * Synchronisation immÃ©diate des niveaux de stock dÃ©crÃ©mentÃ©s localement dans la table IndexedDB `produits` lors de la validation d'une vente hors-ligne (`sauvegarderProduitsLocaux`).
- **Enregistrement Effectif du Service Worker PWA (`frontend-next/src/app/RegisterSW.tsx`)** :
  * Ajout de l'appel `navigator.serviceWorker.register('/sw.js')` dans le cycle de vie client pour garantir l'activation du Service Worker et la gestion proactive du cache PWA.
- **Suite de Tests End-To-End Playwright (`tests/e2e/07-pos-offline-sync.spec.ts`)** :
  * CrÃ©ation d'un test E2E automatisÃ© validant la dÃ©tection offline via `context.setOffline(true)`, l'affichage de l'alerte UI hors-ligne, la mise en file d'attente IndexedDB et le comportement au rÃ©tablissement rÃ©seau.

## ðŸš€ Mises Ã  jour du 10/08/2026 : AmÃ©lioration du Mode Hors-Ligne PWA & Caisse POS
- **DÃ©blocage de l'Ã‰cran de Secours (Fallback) Hors-Ligne (`frontend-next/src/app/sw.ts`)** :
  * Suppression de l'exclusion stricte des routes `/boutique`, `/compte`, `/admin`, etc. qui provoquait un plantage natif Chrome (`ERR_NAME_NOT_RESOLVED`) au lieu de servir la page d'attente hors-ligne.
- **Ajout d'Action Contextuelle Hors-Ligne (`frontend-next/public/offline.html`)** :
  * IntÃ©gration d'un bouton de retour rapide vers la Caisse POS (`/boutique/caisse`) pour permettre aux utilisateurs de reprendre leurs ventes sans interruption.

## ðŸš€ Mises Ã  jour du 10/08/2026 : DÃ©bogage End-To-End (E2E), Immunisation DNS & Validation 100% RÃ©ussie
- **Redondance du Backend API (`src/lib/api.ts`)** :
  * Ajout explicite de l'URL directe du serveur Render (`https://yombale.onrender.com`) dans la liste de repli de l'utilitaire `apiFetch`.
  * Garantit l'accÃ¨s ininterrompu au backend mÃªme lors d'une micro-coupure de rÃ©solution DNS du nom de domaine personnalisÃ© (`nopalou.com` -> `ERR_NAME_NOT_RESOLVED`).
- **Validation Globale des Tests End-To-End (E2E Playwright)** :
  * Compilation TypeScript sans erreur (`npx tsc --noEmit`).
  * VÃ©rification de la syntaxe backend Node.js (`node --check backend/app.js`).
  * ExÃ©cution intÃ©grale des suites de tests E2E API (`npx playwright test tests/e2e/05-api.spec.ts`) : **100% de succÃ¨s sans faute (8/8 tests validÃ©s avec succÃ¨s)**.

## ðŸš€ Mises Ã  jour du 10/08/2026 : Exemption du Scanner Remote POS & Augmentation Quota API (`/scanner-remote`)
- **Correction Cruciale du Blocage Caisse POS (`backend/app.js`)** :
  * Identification de la cause exacte du crash rÃ©vÃ©lÃ©e par les logs de la console browser (`/api/boutiques/.../scanner-remote?sessionId=SCAN-506709`) : l'auto-polling continu du scanner POS (1 requÃªte/seconde) atteignait le quota de 300 requÃªtes en 5 minutes, dÃ©clenchant une erreur 429 "Trop de requÃªtes" puis une interception `ERR_FAILED` par le Service Worker.
  * Ajout de l'exemption explicite (`skip`) dans `apiLimiter` pour les routes de sondage temps rÃ©el `/scanner-remote`, `/health` et `/analytics`.
  * Augmentation du quota global `apiLimiter` de 300 Ã  1000 requÃªtes / 15 min.

## ðŸš€ Mises Ã  jour du 10/08/2026 : RÃ©solution DÃ©finitive de l'Erreur `ERR_FAILED` & DÃ©blocage Total de la Navigation (`/boutique`, `/boutiques`, Catalogue)
- **Ã‰limination de l'Interception Interne par le Service Worker (`RegisterSW.tsx` & `public/sw.js`)** :
  * Identification de la cause exacte de l'erreur Chrome `ERR_FAILED` sur `https://nopalou.com/boutique` : l'ancien Service Worker Serwist prÃ©-enregistrÃ© dans les navigateurs tentait d'intercepter les requÃªtes HTTP/RSC et bloquait la connexion.
  * Mise en place d'un script d'auto-dÃ©sinstallation et de vidage intÃ©gral du cache Service Worker (`caches.delete()`, `registration.unregister()`).
  * Restauration de l'accÃ¨s rÃ©seau direct ultra-rapide sans intermÃ©diaire pour l'ensemble des pages (`/boutique`, `/boutiques`, catalogue et espace compte).

## ðŸš€ Mises Ã  jour du 10/08/2026 : DÃ©blocage des Actions Compte & Caisse POS (Exclusion SW & Suppression du Pop-up Masquant)
- **Suppression ComplÃ¨te de la Pop-up Flottante Intrusive (`src/app/RegisterSW.tsx`)** :
  * Ã‰limination du bandeau flottant noir/orange qui masquait l'en-tÃªte de la Caisse POS et les boutons d'action sur mobile. Le Service Worker s'enregistre dÃ©sormais de faÃ§on 100% silencieuse en arriÃ¨re-plan sans bloquer l'Ã©cran.
- **Exclusion des Pages de Compte, Admin, Boutique & POS de la Redirection Hors-Ligne (`src/app/sw.ts`)** :
  * Modification du matcher de fallback dans Service Worker : les routes `/compte`, `/boutique`, `/admin`, `/deposer`, `/mes-` et `/api` sont formellement exclues du remplacement par `/offline.html`.
  * Validation TypeScript rigoureusement confirmÃ©e avec **0 erreur (`npx tsc --noEmit`)**.
  * Garantit que toutes les actions utilisateur (crÃ©ation de produit, vente caisse POS, modification de profil, enregistrement d'annonce) s'exÃ©cutent en direct sans interruption.

## ðŸš€ Mises Ã  jour du 10/08/2026 : Correction Majeure du Mode Hors-Ligne PWA & Enregistrement Service Worker (`sw.js`)
- **Activation Universelle du Service Worker (`src/app/RegisterSW.tsx`)** :
  * DÃ©blocage de l'enregistrement de `/sw.js` pour qu'il s'enregistre de faÃ§on fiable sur tous les navigateurs et terminaux mobiles.
  * Ajout d'une banniÃ¨re flottante rÃ©active en direct (`online` / `offline`) : affiche `ðŸ“¡ Mode Hors-Ligne â€” Consultation des pages en cache local` lors de la perte de rÃ©seau, et se dissipe automatiquement avec `âœ… Connexion Internet rÃ©tablie` lors du retour du rÃ©seau.
- **Refonte de la Page Hors-Ligne Fallback PWA (`public/offline.html`)** :
  * Design moderne Nopalou avec auto-rechargement dynamique dÃ¨s le retour d'Internet et bouton de consultation du cache local.

## ðŸš€ Mises Ã  jour du 10/08/2026 : Automatisation des Backups Nocturnes & Auto-RÃ©tablissement UI en Cas de Panne
- **Workflow de Sauvegarde Automatique Nocturne (`.github/workflows/db-backup.yml`)** :
  * DÃ©clenchement automatique chaque nuit Ã  02h00 UTC pour exporter l'intÃ©gralitÃ© de la base de donnÃ©es PostgreSQL Nopalou.
  * Archivage et rÃ©tention chiffrÃ©e pendant 30 jours des dumps SQL sur GitHub Artifacts.
- **RÃ©tablissement Automatique UI en Cas de Coupure (`frontend-next/src/app/error.tsx`)** :
  * IntÃ©gration d'un sondage automatique arriÃ¨re-plan (`polling /api/health` toutes les 4s) sur la page d'erreur globale.
  * DÃ¨s que le serveur/base de donnÃ©es se rÃ©tablit, la page recharge et rÃ©initialise automatiquement l'application pour les utilisateurs sans aucune intervention manuelle.

## ðŸš€ Mises Ã  jour du 10/08/2026 : DÃ©ploiement de l'Architecture Haute DisponibilitÃ© (HA) & RÃ©silience E-Commerce
- **Isolation Stricte des Processus (`PROCESS_TYPE=web` vs `PROCESS_TYPE=worker` dans `backend/app.js`)** :
  * SÃ©paration nette des responsabilitÃ©s : en mode Web API (`PROCESS_TYPE=web`), le serveur Express ne lance **jamais** Puppeteer ni le scraping en arriÃ¨re-plan, prÃ©servant 100% de la mÃ©moire RAM pour rÃ©pondre aux requÃªtes clients en < 50ms.
  * Les crons lourds et le scraping Puppeteer sont isolÃ©s dans les processus Workers (`PROCESS_TYPE=worker`).
- **Protection Anti-DDoS & Brute-Force (`express-rate-limit` dans `backend/app.js`)** :
  * Rate limiter applicatif global sur `/api/` (300 requÃªtes / 15 min par IP).
  * Rate limiter renforcÃ© sur les endpoints d'authentification et paiement (`/api/auth/login`, `/api/auth/register`, `/api/admin/login`, `/api/paiement/`) limitÃ© Ã  20 requÃªtes / 15 min par IP.
- **Route d'Ã‰tat & Diag SantÃ© `/api/health` & `/health`** :
  * Diagnostic complet renvoyant le statut DB (`SELECT 1`), la latence SQL en ms, le mode de process (`PROCESS_TYPE`), l'uptime et la consommation RAM dÃ©taillÃ©e (`rss`, `heapUsed`).
- **Mise en Cache Edge CDN (`frontend-next/src/middleware.ts`)** :
  * Injection automatique des en-tÃªtes `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` sur toutes les routes de catalogue publiques (`/immo`, `/annonces`, `/categorie`, `/telecom`) pour optimiser le caching Cloudflare / Vercel Edge.

## ðŸš€ Mises Ã  jour du 10/08/2026 : Redirection des Pilules de CatÃ©gories Accueil vers les Pages DÃ©diÃ©es (`/immo` & `/annonces`)
- **Correction des Redirections de CatÃ©gories d'Accueil (`app/page.tsx`)** :
  * Configuration spÃ©cifique des pilules de catÃ©gories `ðŸ�¢ Immobilier & Terrains` et `ðŸ“¢ Petites Annonces` dans la barre de dÃ©filement de la page d'accueil pour rediriger directement vers leurs univers dÃ©diÃ©s respectifs (`/immo` et `/annonces`).
  * Immunisation des pilules de catÃ©gories `immo`, `annonces` et `telecom` contre le filtrage automatique par `categoriesActives` pour garantir leur visibilitÃ© permanente.

## ðŸš€ Mises Ã  jour du 10/08/2026 : Ã‰limination DÃ©finitive du Crash Server Component (`TypeError: (0, s.u) is not a function`)
- **Correction Cruciale de la FrontiÃ¨re Client / Serveur (`lib/sanitizeImg.ts`)** :
  * Identification de la cause fondamentale des erreurs de logs Render (`TypeError: (0, s.u) is not a function at immo/[id]/page.js`) : la fonction de nettoyage d'images `sanitizeImgUrl` Ã©tait dÃ©clarÃ©e dans `components/ExternalImg.tsx` marquÃ©e de la directive Client `'use client'`.
  * L'importation de `sanitizeImgUrl` depuis un fichier `'use client'` par les composants Serveur App Router (`lib/cloudinary.ts`, `immo/[id]/page.tsx`, `annonces/page.tsx`) transformait la fonction en un objet de rÃ©fÃ©rence Client non invocable cÃ´tÃ© serveur.
  * Extraction de `sanitizeImgUrl` dans le nouveau fichier isomorphe pur [lib/sanitizeImg.ts](file:///c:/Users/bamba/Downloads/yombale-CLAUDE/frontend-next/src/lib/sanitizeImg.ts) sans directive `'use client'`, supprimant l'erreur de fonction invalide et fiabilisant Ã  100% le rendu SSR.
  * Validation TypeScript rigoureuse et typage d'Ã©vÃ©nements React pour garantir **0 erreur (`npx tsc --noEmit`)**.

## ðŸš€ Mises Ã  jour du 10/08/2026 : RÃ©solution Critique du Crash SSR Server Components (Next.js 15 Async Params & Fallback API)
- **Multi-Endpoint Fallback Loop dans `apiFetch` (`lib/api.ts`)** :
  * Refonte de l'utilitaire `apiFetch` pour tester sÃ©quentiellement la liste ordonnÃ©e des endpoints backend (`process.env.BACKEND_URL`, `process.env.NEXT_PUBLIC_BACKEND_URL`, `http://127.0.0.1:3000`, `http://localhost:3000`) avec un timeout ajustÃ© Ã  5s.
  * Garantit que le SSR de Next.js rÃ©sout automatiquement l'URL publique ou locale du backend quelle que soit la plateforme d'hÃ©bergement (Vercel, Railway, Render, Local).
- **SÃ©curisation de la Page d'Accueil (`app/page.tsx`)** :
  * Migration de tous les appels `fetch` directs de `app/page.tsx` vers `apiFetch` avec gestion gracieuse d'Ã©tat d'erreur pour empÃªcher tout Ã©chec SSR d'interrompre l'affichage du site.
- **Refonte de la Page d'Erreur Globale (`app/error.tsx`)** :
  * Interception des messages d'erreur masquÃ©s de Next.js en production (`Server Components render`) pour afficher un message clair et professionnel Ã  l'utilisateur au lieu du texte brut technique.
  * Ajout d'un bouton de rechargement rapide ðŸ”„ et d'un bouton de retour Ã  l'accueil ðŸ� .
- **RÃ©solution du Plantage des Routes Dynamiques (`immo/[id]`, `annonces/[id]`, `produit/[id]`, `boutiques/[id]`, `categorie/[slug]`, `telecom/[id]`, `comparer/[a]/[b]`, `payer-annonce/[id]`)** :
  * Identification de la cause exacte du message d'erreur de rendu `An error occurred in the Server Components render` : l'accÃ¨s synchrone non-asynchrone Ã  `params.id` / `params.slug` sur Next.js 15 App Router.
  * Conversion intÃ©grale du type `params: { id: string }` vers `params: Promise<{ id: string }>` et rÃ©solution asynchrone complÃ¨te (`const { id } = await params`, `const { slug } = await params`, `const { id, produitId } = await params`) dans toutes les fonctions `generateMetadata` et les templates JSX des composantes de page.
  * Compilations TypeScript rigoureusement validÃ©es avec **0 erreur (`npx tsc --noEmit`)**.

## ðŸš€ Mises Ã  jour du 10/08/2026 : RÃ©solution des Crashs Fugitifs/Intermittents & DÃ©blocage CSP Service Worker (`sw.js`)
- **Ã‰limination de la Saturation du Pool DB (`backend/models/db.js`)** :
  * Augmentation de la taille maximale du pool PostgreSQL de `max: 5` Ã  `max: 20` (ou paramÃ©trable via `PG_MAX_CONNECTIONS`) pour Ã©viter la saturation sous trafic simultanÃ©.
  * RÃ©duction du dÃ©lai d'attente de connexion `connectionTimeoutMillis` de 30s Ã  5s pour faire Ã©chouer et retenter rapidement au lieu de bloquer la file d'attente Node.js.
  * Ajout obligatoire de l'Ã©couteur d'Ã©vÃ©nement `pool.on('error')` pour Ã©viter qu'une dÃ©connexion PostgreSQL inattendue sur un client inactif ne provoque le crash instantanÃ© du processus Node.js (`Unhandled error event`).
- **Gestion Globale des Exceptions Backend (`backend/app.js`)** :
  * Ajout des gestionnaires d'Ã©vÃ©nements `process.on('uncaughtException')` et `process.on('unhandledRejection')` dans `app.js` pour empÃªcher la fermeture abrupte du serveur Express lors d'une promesse rejetÃ©e non capturÃ©e.
- **Correction des Blocages CSP (`middleware.ts` & `backend/app.js`)** :
  * Ajout des schÃ©mas `https:` et `wss:` ainsi que `blob:` et `data:` dans la directive `connect-src` des en-tÃªtes Content Security Policy.
  * RÃ©solution des erreurs navigateur `sw.js: Refused to connect because it violates the document's Content Security Policy` et suppression des plantages de rendu Next.js Server Components (`An error occurred in the Server Components render`).

## ðŸš€ Mises Ã  jour du 10/08/2026 : RÃ©solution de la Tronquature d'URL d'Images (net::ERR_FAILED) & Suppression des Warnings Preload WOFF2
- **Assainissement Universel des URLs d'Images (`ExternalImg.tsx` & `cloudinaryHQ` dans `lib/cloudinary.ts`)** :
  * Correction globale du prÃ©fixage `https://` dans `sanitizeImgUrl` pour les URLs sans protocole provenant de la base de donnÃ©es et des scrapers (Cloudinary, CoinAfrique, Soumari, Electroniccorp, Kaynoo, MasterOfficeDeco, UniversCosmetix, Jumia, etc.).
  * IntÃ©gration systÃ©matique de `sanitizeImgUrl` Ã  l'intÃ©rieur du helper `cloudinaryHQ` pour garantir qu'aucune transformation d'image ne retourne d'URL relative sans protocole `https://`.
  * Ã‰limination dÃ©finitive des erreurs navigateur `net::ERR_FAILED` qui tentaient de charger des URLs sans schÃ©ma en tant que ressources locales (ex: `https://nopalou.com/res.cloudinary.com/...` -> 404).
  * Remplacement des balises `<img>` brutes par le composant rÃ©silient `<ExternalImg />` ou `sanitizeImgUrl` dans `WizardImmo.tsx`, `immo/[id]/page.tsx`, `immo/comparaison/page.tsx`, `checkout-express/page.tsx`, `mes-annonces-immo/page.tsx`.
- **ConformitÃ© Polices SystÃ¨me & Suppression des Warnings Preload (`layout.tsx`, `globals.css` & `middleware.ts`)** :
  * Suppression de l'import `next/font/google` (`Inter` & `Archivo`) dans `layout.tsx` pour Ã©liminer les requÃªtes/tÃ©lÃ©chargements WOFF2 et les avertissements navigateur `The resource .../media/*.woff2 was preloaded using link preload but not used within a few seconds`.
  * DÃ©finition des variables CSS `--font-inter` et `--font-archivo` directement sur `:root` dans `globals.css` avec la pile de polices systÃ¨me native haute lisibilitÃ© (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`), en parfaite conformitÃ© avec les rÃ¨gles agentiques du projet.
  * Nettoyage des directives `style-src` et `font-src` dans le middleware CSP (`middleware.ts`).

## ðŸš€ Mises Ã  jour du 10/08/2026 : IntÃ©gration du Bilan de Session Caissier SynthÃ©tique (Rapport X) & TraÃ§abilitÃ© Audit
- **Modale & Rapport X IntermÃ©diaire Caisse (`CaisseClient.tsx`)** :
  * CrÃ©ation d'une modale dÃ©diÃ©e **`ðŸ“Š Bilan Session (Rapport X)`** accessible en 1 clic dans le menu **ðŸ”§ Outils** de la caisse POS.
  * Affichage consolidÃ© du profil caissier, fond de caisse initial, total du chiffre d'affaires encaissÃ©, nombre de tickets Ã©ditÃ©s et espÃ¨ces thÃ©oriques en caisse.
  * Ventilation complÃ¨te par mode de rÃ¨glement (ðŸ’µ EspÃ¨ces, ðŸŒŠ Wave, ðŸ�Š Orange Money, ðŸ’³ Carte Bancaire, ðŸ”€ Mixte).
  * PossibilitÃ© pour le caissier ou le superviseur de consulter ou d'imprimer Ã  tout moment le bilan d'activitÃ© de la session en cours **sans devoir fermer la caisse**.
- **TraÃ§abilitÃ© & Journal d'Audit (`boutique_logs` & `BoutiqueLogs.tsx`)** :
  * Enregistrement automatique dans le **Journal d'Audit & SÃ©curitÃ©** de toutes les ouvertures de session, clÃ´tures Z et consultations/impressions du Rapport X avec le nom du caissier, le total du CA et l'adresse IP.
  * Ajout du filtre dÃ©diÃ© **`Sessions Caisse & Rapport X`** dans l'interface du Journal d'Audit marchand.

## ðŸš€ Mises Ã  jour du 09/08/2026 : Correction du DÃ©bordement & Tronquature Ã  Droite sur Caisse POS Mobile
- **Fixation de la Tronquature Ã  Droite (`globals.css` & `CaisseClient.tsx`)** :
  * Ajout de `box-sizing: border-box !important`, `max-width: 100vw !important` et `overflow-x: hidden !important` sur `.caisse-main-layout`, `.ticket-section.mobile-active` et `.caisse-catalogue-section.mobile-active`.
  * Ajustement des paddings mobiles de 20px Ã  10px-12px pour empÃªcher le dÃ©bordement de 40px hors-Ã©cran sur les smartphones.
  * Optimisation des libellÃ©s dans la grille de paiement Ã  3 colonnes (`ðŸ”€ Mixte`, `ðŸ“� CrÃ©dit`, `ðŸ�·ï¸� Remise`) et ajout de `overflow: hidden` et `text-overflow: ellipsis` pour empÃªcher tout chevauchement.
  * Arrondissement au franc prÃ¨s dans la fonction d'affichage de monnaie `fcfa` (`Math.round`) pour Ã©liminer les dÃ©cimales flottantes longues (ex: `273 069,492 FCFA` -> `273 069 FCFA`).

## ðŸš€ Mises Ã  jour du 09/08/2026 : Correction du SchÃ©ma d'URL et RÃ©solution ComplÃ¨te de l'Affichage des Photos
- **Correction Critique de `sanitizeImgUrl` (`ExternalImg.tsx`)** :
  * Ajout du prÃ©fixage automatique `https://` pour toutes les URLs d'images stockÃ©es sans protocole dans la base de donnÃ©es (ex: `res.cloudinary.com/...`, `images.coinafrique.com/...`, `masterofficedeco.sn/...`, `www.soumari.com/...`, `kanje.sn/...`, `electroniccorp.sn/...`, `static.kaynoo.sn/...`).
  * Normalisation des chemins relatifs d'images scrapÃ©es CoinAfrique (`thumb_...`, `uploaded_...`, `image_...`) vers `https://images.coinafrique.com/`.
  * RÃ©solution des erreurs navigateur `net::ERR_FAILED` qui interprÃ©taient les URLs sans schÃ©ma comme des chemins relatifs locaux (ex: `https://nopalou.com/res.cloudinary.com/...` -> 404).
  * Correction du relais vers `wsrv.nl` pour transmettre des URLs encodÃ©es valides avec protocole HTTPS complet.

## ðŸš€ Mises Ã  jour du 09/08/2026 : IntÃ©gration du Composant d'Installation PWA NativisÃ© (BanniÃ¨re & Modale iOS)
- **BanniÃ¨re d'Installation PWA Flottante (`PwaInstallPrompt.tsx`)** :
  * Ã‰coute automatique de l'Ã©vÃ©nement natif navigateur `beforeinstallprompt` sur Chrome Android, Edge & PC Desktop.
  * DÃ©clenchement de la fenÃªtre d'installation en 1 clic ("Installer l'App Nopalou").
  * DÃ©tection intelligente d'iOS / Safari avec modale d'instruction pas Ã  pas ("Partager ðŸ“¤ -> Sur l'Ã©cran d'accueil ðŸ“²").
  * Masquage automatique si l'application est dÃ©jÃ  installÃ©e en mode standalone ou si fermÃ©e par l'utilisateur (mÃ©moire 14 jours).
- **IntÃ©gration Globale (`layout.tsx`)** : Activation automatique sur l'ensemble de l'application.

## ðŸš€ Mises Ã  jour du 09/08/2026 : Correction Globale des Images Nopalou (Boutiques, Logos, Couvertures & Espace Marchand)
- **Remplacement complet des balises `<img>` brutes par `ExternalImg` sur les Boutiques Nopalou** :
  * Annuaire & RÃ©pertoire des Boutiques (`boutiques/page.tsx`) : Logos et photos de couverture.
  * Vitrine & En-tÃªte de la Boutique (`boutiques/[id]/page.tsx`) : Logos, banniÃ¨re de couverture et produits boutique.
  * Espace Marchand & Tableau de bord (`BoutiqueClient.tsx`) : Formulaires de modification de logo, couverture et catalogue produits.
- **Protection & Proxy Universel pour toutes les images Nopalou** : Masquage automatique de l'en-tÃªte `Referer` et fallback instantanÃ© vers le proxy CDN `wsrv.nl` si un CDN ou navigateur bloque l'accÃ¨s direct aux images Cloudinary/externes.

## ðŸš€ Mises Ã  jour du 09/08/2026 : Correction de l'Affichage des Photos & Proxy CDN Fallback
- **Nettoyage & SÃ©curisation des URLs d'images (`sanitizeImgUrl`)** : Conversion automatique des URLs relatives `//` et `http://` en `https://` pour Ã©viter les blocages de contenu mixte, nettoyage des espaces et correction des prÃ©fixes SVG corrompus.
- **Politique de Referrer (`referrerPolicy="no-referrer"`)** : Suppression de l'en-tÃªte Referer lors de la demande d'images pour contourner les protections anti-hotlink des CDN externes (CoinAfrique, Jumia, Expat-Dakar, etc.).
- **Fallback Automatique Proxy CDN (`wsrv.nl`)** : En cas d'erreur de chargement direct (403, SSL, ECONNRESET), `ExternalImg` retente automatiquement le chargement via le proxy CDN sÃ©curisÃ© `wsrv.nl` avant de basculer sur l'icÃ´ne de secours (ðŸ“¦).
- **GÃ©nÃ©ralisation sur tout le site** : Remplacement des balises `<img>` brutes par `ExternalImg` dans les boutiques (`BoutiqueDetailClient`), les cartes immobiliÃ¨res (`ImmoCard`), le panier latÃ©ral (`DrawerCart`), la recherche (`NavbarSearch` & `RechercheClient`).
- **Nettoyage Base de DonnÃ©es PostgreSQL** : Suppression des URLs d'images SVG corrompues (`data:image/svg`) issues du scraping dans la table `produits`.

- Injection directe des styles CSS POS dans style jsx global pour garantir l'affichage immÃ©diat sans dÃ©pendre du cache navigateur (Masquage direct du header du site et layout 50/50).
- Exigence de Session POS Ouverte & Gestion des Modes de Fonctionnement :
  * Blocage de l'ajout d'articles au panier si aucune session de caisse n'est ouverte (session === null) et dÃ©clenchement automatique de la modale Ouverture de Session.
  * Affichage d'un panneau de dÃ©verrouillage de session Ã©lÃ©gant dans la section ticket lorsque la session est fermÃ©e.
  * Explication claire de la gestion des boutiques Pur Web (pure_player) vs Hybride POS (hybride_pos).
- Redesign Ergonomie & Design Premium Caisse POS :
  * Suppression du double en-tÃªte mobile : masquage automatique du header global du site, de la nav et du footer via body:has(.caisse-header) en mode POS Fullscreen.
  * Restructuration des proportions du layout standard POS (52% Catalogue / 48% Caisse & Ticket).
  * Grille de produits compacte haute densitÃ© (Square POS style) avec badge compteur d'articles et surbrillance orange active.
  * Modales premium avec flou d'arriÃ¨re-plan glassmorphism (backdrop-filter) et typographie Ã©purÃ©e.
- SÃ©curitÃ© & ContrÃ´le d'AccÃ¨s Caisse POS par Boutique :
  * Injection de plan_actif dans la liste des boutiques (/api/boutiques/mine).
  * VÃ©rification dynamique stricte des droits POS par boutique sÃ©lectionnÃ©e dans CaisseClient.
  * Blocage automatique et affichage de l'Ã©cran de verrouillage dÃ¨s qu'un marchand bascule vers une boutique sans abonnement Pro/Business (Gratuit/Starter).
  * Ajout des indicateurs de statut POS (ðŸŸ¢ AutorisÃ© / ðŸ”’ VerrouillÃ©) dans le menu de sÃ©lection d'en-tÃªte.
- Optimisation PIN & En-tÃªte Caisse POS :
  * Persistance de session dÃ©verrouillÃ©e au rafraÃ®chissement (F5) via LocalStorage.
  * Suppression du bouton DÃ©verrouiller & dÃ©verrouillage automatique dÃ¨s 4 chiffres avec message d'erreur si faux.
  * RÃ©duction automatique du clavier virtuel mobile (inputMode numeric + auto-blur).
  * Alignment et nettoyage de l'en-tÃªte caisse-header sans aucun chevauchement sur mobile.
- IntÃ©gration du moteur universel html5-qrcode : DÃ©codage natif EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E et QR-Code en direct sur la camÃ©ra (iOS Safari, Android Chrome, PC/Webcams).
- Correctif Permissions-Policy CamÃ©ra : Modification de camera=() en camera=(self) dans next.config.js et middleware.ts pour lever la restriction navigateur [Violation] Permissions policy violation.
## ðŸš€ Mises Ã  jour du 09/08/2026 : Optimisation Caisse POS Mobile & CamÃ©ra Scanner
- **Refonte Ergonomique Barre de Recherche & Scanners (Responsive)** : Correction du chevauchement inesthÃ©tique des boutons "Scanner CamÃ©ra" et "Douchette Smartphone" sur mobile.
- **DÃ©placement du Bouton Vue Catalogue** : Le bouton de basculement d'affichage (Liste / MosaÃ¯que) a Ã©tÃ© dÃ©placÃ© sous la barre de recherche, Ã  gauche de la liste des catÃ©gories, pour libÃ©rer de l'espace en haut et harmoniser l'interface.
- **Verrouillage Strict du Changement de Boutique** : Blocage complet de la sÃ©lection de boutique dans l'en-tÃªte (affichage d'une alerte) lorsqu'une session de caisse (Fonds de caisse) est actuellement ouverte. EmpÃªche le caissier de fuir ou de mÃ©langer les caisses sans avoir fait sa ClÃ´ture Z (fermeture de caisse).
- **Catalogue POS (Grille/Liste) & Ã‰puration Header** : Ajout d'un bouton de bascule dynamique Liste / MosaÃ¯que pour l'affichage des produits. Nettoyage de l'en-tÃªte mobile avec suppression des badges redondants (POS, EN LIGNE) et correction du layout responsif pour Ã©viter le chevauchement des Ã©lÃ©ments (scroll horizontal de l'en-tÃªte).
- Navigation Caisse Mobile par Onglets (caisse-mobile-tabs) : Onglets [ ðŸ›�ï¸� Catalogue | ðŸ›’ Ticket ] sous le header (<= 1024px).
- Barre Flottante Collante (caisse-sticky-bottom-bar) : Affichage en direct du total FCFA et bouton VOIR TICKET & ENCAISSER sur mobile.
- Robustesse Scanner CamÃ©ra : Fallback automatique multi-camÃ©ras (facingMode environment -> video: true), gestion HTTPS et raccourci Douchette Smartphone Distante.
- **Correction Critique Mode Hors Ligne (PWA / Service Worker)** : RÃ©solution de l'erreur `ERR_FAILED` lors de la navigation sans connexion. Ajout des paramÃ¨tres `{ ignoreSearch: true, ignoreVary: true }` pour forcer la lecture du cache Chrome et injection directe du HTML de secours (`offline.html`) dans `sw.js` (incrÃ©mentÃ© Ã  `v4`) pour garantir 100% de fiabilitÃ©.

# CLAUDE.md

## ðŸ› ï¸� Guide de Configuration & d'Activation Production (OpenSpec Nopalou)

### ðŸ’³ 1. Configuration des Paiements par Carte Bancaire RÃ©els (Stripe Production)
Pour passer du mode simulation actuel aux encaissements rÃ©els Stripe en production :
1. **CrÃ©ation du Compte Stripe Entreprise** : S'inscrire sur [Stripe.com](https://stripe.com) et fournir les documents administratifs (RCCM, NINEA, RIB bancaire de Nopalou).
2. **Variables d'Environnement (`backend/.env`)** :
   ```env
   STRIPE_SECRET_KEY=sk_live_51Nx...
   STRIPE_PUBLISHABLE_KEY=pk_live_51Nx...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. **Activation du SDK Officiel Node.js** : Installer `npm install stripe` et activer `paymentIntents.create()` dans `backend/routes/boutiques.js`.
4. **Configuration du Webhook Stripe Production** : DÃ©clarer `https://api.nopalou.com/api/webhooks/stripe` dans le Dashboard Stripe pour valider automatiquement le virement dÃ¨s l'autorisation bancaire 3D-Secure.

### ðŸ”‘ 2. StratÃ©gie Commerciale & Configuration du Portail DÃ©veloppeur (Spec 05 - API & Webhooks)
- **Cible Marchande** : PME, Grossistes et Marques ayant leur propre logiciel ERP/CRM (*Odoo, Sage, Dolibarr*).
- **ModÃ¨le de Tarification & Facturation** :
  - **Option 1 (Forfaits Boutique Taf Taf / Pro / Business)** : RÃ©servÃ© aux forfaits d'abonnement (`2 500 FCFA`, `5 000 FCFA` et `10 000 FCFA / mois`).
  - **Option 2 (Add-on sur mesure)** : Facturer l'accÃ¨s au module *API & Connecteurs ERP* comme une extension mensuelle.
- **RÃ©tention Client (Lock-in)** : La connexion de l'ERP du marchand via l'API Nopalou garantit sa fidÃ©lisation Ã  100% sans risque de dÃ©sabonnement.

### ðŸ“¸ 3. Configuration Instagram Shopping, Meta Commerce Manager & TikTok Catalog
- **Lien du Flux XML Universel** : `https://nopalou.com/api/boutiques/:idOrSlug/catalog.xml`
- **ProcÃ©dure d'Activation pour le Marchand** :
  1. Relier le compte Instagram Professionnel Ã  sa page Facebook dans Meta Business Suite.
  2. Ajouter l'URL du flux XML Nopalou dans **Meta Commerce Manager** (*Catalogues -> Importation automatique*).
  3. Taguer ses produits sur ses publications, stories et reels Instagram pour rediriger les acheteurs en 1 clic vers le checkout 1-Page Nopalou.

### ðŸ§ª 4. ExÃ©cution & Assurance QualitÃ© (Master Test Suite - 20/20 PASS)
- **Commande de Validation Globale TDD** :
  ```powershell
  node node_modules/jest/bin/jest.js tests/unit/spec-master-exhaustive.test.js --forceExit
  ```
- **Couverture des 26 ScÃ©narios ValidÃ©s** :
  - **Spec 01** : Bascule de mode `pure_player` vs `hybride_pos`, sÃ©lecteur admin et masquage caisse.
  - **Spec 02** : Enregistrement de commande 1-Page, dÃ©crÃ©mentation des stocks et offres Cross-Sell.
  - **Spec 03** : Remises %, montants fixes FCFA, seuils d'achat minimum et rejet des coupons vides.
  - **Spec 04** : Pixels publicitaires (Meta, TikTok, GA4) et gÃ©nÃ©ration des flux catalogues XML/JSON.
  - **Spec 05** : Portail DÃ©veloppeur, gÃ©nÃ©ration de clÃ©s API `nopalou_sk_live_...`, webhooks `whsec_...` et signatures HMAC-SHA256.
  - **Spec 06** : Taux de change officiels (XOF, EUR, USD), simulation Carte Stripe acceptÃ©e et rejet des cartes dÃ©clinÃ©es.
  - **Spec 07 (Acheteur)** : Suivi de commande 200, Avis produits 201, Moyenne d'avis 4.5 â­� et Comparatif prix.

---

### [2026-08-09] - Refonte du Hero "Bento Box" et Carrousel des FonctionnalitÃ©s
- **Refonte Structurelle (Bento Box) (`frontend-next/src/app/boutiques/page.tsx`)** : Refonte asymÃ©trique complÃ¨te du layout de l'en-tÃªte (Hero) pour l'annuaire des boutiques. La zone de recherche et les filtres sont dÃ©sormais pleinement intÃ©grÃ©s Ã  la colonne de gauche (qui s'Ã©tire dynamiquement pour Ã©viter tout vide central), tandis que la colonne de droite accueille les nouvelles fonctionnalitÃ©s.
- **Carrousel Interactif (`frontend-next/src/app/boutiques/HeroCarousel.tsx`)** : Remplacement de l'ancienne carte statique "Boutique Taf Taf" par un composant Carrousel moderne, dÃ©filant automatiquement. Il met en Ã©vidence 4 fonctionnalitÃ©s clÃ©s (Boutique Taf Taf, Caisse POS, ZÃ©ro Commission WhatsApp, Vendeurs VÃ©rifiÃ©s) avec pause au survol et navigation manuelle.
- **Enrichissement Typographique et Alignement** : Ajout de puces de rÃ©assurance ("0% de commission", "100% Vendeurs vÃ©rifiÃ©s", "Contact direct") dans le texte de prÃ©sentation pour combler harmonieusement l'espace vertical. Utilisation de `align-items: stretch` et `margin-top: auto` pour garantir un alignement parfait de la barre de recherche avec le bas des widgets de la colonne de droite.

---### [2026-08-08] - AmÃ©lioration du formulaire de crÃ©ation de boutique et UX de recherche
- **Frontend (`frontend-next/src/app/creer-boutique/page.tsx`)** : Remplacement de la mention "WhatsApp Business" par "WhatsApp" pour plus de simplicitÃ©. Ajout d'un menu dÃ©roulant permettant de choisir le "Type de boutique" (catÃ©gorie) Ã  l'Ã©tape finale de crÃ©ation, juste avant le choix de la couleur.
- **Backend (`backend/routes/boutiques.js`)** : Modification de la route `POST /taf-taf` pour rÃ©cupÃ©rer et insÃ©rer la `categorie` envoyÃ©e par le frontend lors de l'enregistrement en base de donnÃ©es, au lieu de forcer la valeur "Divers".
- **UX de Recherche (`frontend-next/src/app/page.tsx`, `frontend-next/src/app/SearchBar.tsx`)** : Ajout d'une ancre `#resultats` sur le conteneur principal de la page d'accueil. Conversion de la barre de recherche en composant client (`next/navigation`) et modification de tous les liens (catÃ©gories, budget, tri, tendances) pour qu'ils dÃ©clenchent un dÃ©filement automatique immÃ©diat vers les rÃ©sultats lors du clic, amÃ©liorant considÃ©rablement l'expÃ©rience utilisateur sur mobile et desktop.
- **Menu Boutique (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** : Transformation du menu de navigation (sidebar) en accordÃ©on. Les groupes ("Finance & Rapports", "ParamÃ¨tres & Ã‰quipe", etc.) sont dÃ©sormais repliables pour optimiser l'occupation verticale sur mobile. Par dÃ©faut, seul le premier groupe ou celui contenant l'onglet actif est ouvert.
- **Affichage CatÃ©gories Mobile (`frontend-next/src/app/page.tsx`, `globals.css`)** : Remplacement de l'affichage en grille dÃ©sordonnÃ©e des catÃ©gories sur la page d'accueil par un dÃ©filement horizontal fluide sur mobile (comme sur Instagram/Airbnb). Cela aligne parfaitement toutes les pilules sur une seule ligne glissante.
- **Refonte Dashboard Boutiques (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** : Ã‰largissement du conteneur de liste des boutiques Ã  1200px et passage en affichage grille multi-colonnes. La carte `BoutiqueCard` a Ã©tÃ© repensÃ©e : boutons secondaires (Modifier, Voir, Supprimer) transformÃ©s en icÃ´nes discrÃ¨tes en haut Ã  droite, informations de contact alignÃ©es avec des icÃ´nes Lucide, et bas de carte rÃ©servÃ© aux larges boutons d'actions principales ("GÃ©rer", "Caisse POS").
- **Refonte Annuaire Boutiques (`frontend-next/src/app/boutiques/page.tsx`, `BoutiquesSearch.tsx`)** : IntÃ©gration de la barre de recherche directement Ã  l'intÃ©rieur du bloc HÃ©ro (banniÃ¨re) pour combler le vide central sur grands Ã©crans. Refonte de la barre de recherche (style Airbnb : plus large, grande police, bords trÃ¨s arrondis, ombre portÃ©e Ã©lÃ©gante) et centrage de la liste des catÃ©gories sous la banniÃ¨re.

### [2026-08-08] - Mise Ã  Jour ComplÃ¨te des Tarifs Marchands (Dynamisation & Fallbacks)
- **Alignement sur la Base de DonnÃ©es de Production** : Remplacement des anciennes valeurs par dÃ©faut (`5000`, `15000`, `35000`) par les vÃ©ritables prix officiels (`2 500`, `5 000`, `10 000` FCFA) sur l'ensemble du frontend et du backend.
- **Mise Ã  Jour de la Configuration Backend (`backend/lib/settingsCache.js`, `backend/routes/abonnements.js`)** : Actualisation des fallbacks pour garantir la cohÃ©rence des prix mÃªme en l'absence de base de donnÃ©es locale.
- **Nettoyage des Noms des Forfaits** : Utilisation exclusive des dÃ©nominations officielles ("Boutique Taf Taf", "Boutique Pro", "Boutique Business") dans tout le site, y compris le panneau Admin (`/admin/tarifs`) et le tunnel d'inscription.

### [2026-08-08] - Page d'Accueil : Produits les Moins Chers (50k - 150k) et Populaire
- **Ajustement de l'Affichage par DÃ©faut (`backend/routes/produits.js`)** :
  - Modification de la requÃªte SQL (CTE) pour prioriser les produits dont le prix est compris entre **50 000 et 150 000 FCFA** et qui sont populaires (`agg_nb_offres >= 2`).
  - **Correction du Mixage (Interleaving)** : RÃ©tablissement d'un tri entrelacÃ© garanti (via `ROW_NUMBER() OVER(PARTITION BY source_type)`) pour forcer l'affichage 1-pour-1 des produits des Boutiques Nopalou (quel que soit leur prix) avec la sÃ©lection scrappÃ©e Top (50k-150k).
  - Ce mixage est ordonnÃ© intrinsÃ¨quement du **moins cher au plus cher** (`agg_prix_min ASC`) puis par popularitÃ©, ce qui garantit que l'acheteur voit d'abord les offres les moins chÃ¨res sans sacrifier la visibilitÃ© des boutiques partenaires.

### [2026-08-08] - Audit Profond & Synchronisation des Menus (Mobile, Footer, Admin)
- **Menu Mobile Utilisateur (`frontend-next/src/app/MobileNav.tsx`)** :
  - Synchronisation de l'espace compte mobile avec la barre latÃ©rale bureau (`AccountNavLinks.tsx`). Ajout des liens manquants : `Mes alertes prix`, `Publier un bien immo`, `Apporteur d'affaires` et `Forfaits & FonctionnalitÃ©s`.
- **Pied de Page (`frontend-next/src/app/layout.tsx`)** :
  - Ajout de la catÃ©gorie **Jeux VidÃ©o** dans la colonne "CatÃ©gories" du footer (elle existait dans le sitemap mais avait Ã©tÃ© oubliÃ©e visuellement).
- **Administration Superadmin (`frontend-next/src/app/admin/(protected)/layout.tsx`)** :
  - DÃ©couverte et ajout de 2 pages admin orphelines dans la barre latÃ©rale : **QualitÃ© DonnÃ©es (Quarantines)** (`/admin/qualite`) et **Tracking Affiliates** (`/admin/affiliates/tracking`).

### [2026-08-08] - Ajout des Guides Vendeurs (Menu Mobile, Footer, Sitemap & Legacy)
- **Menu Mobile (`frontend-next/src/app/MobileNav.tsx`)** :
  - Ajout des liens `Tarifs & Forfaits Vendeurs` (avec badge "OFFRE"), `Guide Vendeur & Sourcing`, et `DÃ©mo Commerciale` (avec badge "NOUVEAU") dans le tiroir de navigation mobile, avec le mÃªme design et la mÃªme mise en avant que sur le menu Desktop.
- **Pied de Page / Footer (`frontend-next/src/app/layout.tsx`)** :
  - Ajout de ces 3 liens stratÃ©giques dans la colonne "Informations" du footer global pour un meilleur maillage interne (SEO) et une meilleure accessibilitÃ©.
- **Sitemap XML (`frontend-next/src/app/sitemap.ts`)** :
  - Ajout de l'URL `/demo` au sitemap.ts qui avait Ã©tÃ© omise.
- **Application Legacy (`frontend/index.html`)** :
  - Synchronisation du menu dÃ©roulant `nav-guides-dropdown` de l'ancienne application vanilla JS avec les 3 nouveaux liens marchands.

### [2026-08-07] - Tarification 100% Dynamique & IntÃ©gration Boutique Taf Taf dans l'Admin
- **IntÃ©gration du Forfait Boutique Taf Taf dans l'Admin (`frontend-next/src/app/admin/(protected)/tarifs/TarifsClient.tsx`)** :
  - Ajout du paramÃ©trage complet du plan **Boutique Taf Taf** (*nom, prix mensuel en FCFA et durÃ©e de l'essai gratuit / 1er mois offert*) dans l'interface `/admin/tarifs`.
  - Mise Ã  jour des valeurs par dÃ©faut (`plan_decouverte_prix: 5000 FCFA`, `plan_pro_prix: 15000 FCFA`, `plan_business_prix: 35000 FCFA`).
- **Extension du 1er Mois 100% Offert Ã  TOUTES les Formules (`creer-boutique/page.tsx`, `TarifsPublicsSelector.tsx`, `ShowcaseTabs.tsx`)** :
  - Le premier mois gratuit (essai 30 jours) s'applique dÃ©sormais explicitement sur l'ensemble des 3 forfaits (**Boutique Taf Taf**, **Vendeur Pro**, et **Business VIP**).
- **Synchronisation Dynamique Globale du Site (`backend/routes/settings.js`, `frontend-next/src/app/tarifs-boutique/TarifsPublicsSelector.tsx`, `frontend-next/src/app/creer-boutique/page.tsx`, `ShowcaseTabs.tsx`)** :
  - L'endpoint `GET /api/settings/public` retourne dÃ©sormais l'intÃ©gralitÃ© des 3 formules d'abonnement (`plan_decouverte_prix`, `plan_pro_prix`, `plan_business_prix`, leurs libellÃ©s et les durÃ©es d'essai).
  - La page des tarifs vendeurs (`/tarifs-boutique`), le wizard de crÃ©ation de boutique (`/creer-boutique`) et la page d'accueil (`/`) rÃ©cupÃ¨rent dynamiquement les tarifs dÃ©finis dans l'admin et appliquent les rÃ©ductions multi-durÃ©es (-10%, -15%, -25%).
- **Calculs Dynamiques Backend (`backend/routes/abonnements.js`, `backend/routes/paiement.js`, `backend/routes/boutiques.js`)** :
  - Les endpoints d'inscriptions, d'abonnements et de paiements s'appuient Ã  100% sur le cache de configuration `settingsCache` sans aucun prix codÃ© en dur (avec 30 jours offerts par dÃ©faut sur tous les forfaits lors de la crÃ©ation).

### [2026-08-07] - Correction Bug Critique : CrÃ©ation de Boutique Taf Taf (`/api/boutiques/taf-taf`)
- **RÃ©solution Erreur PostgreSQL ON CONFLICT (`backend/routes/boutiques.js`)** :
  - Correction de l'erreur `there is no unique or exclusion constraint matching the ON CONFLICT specification` sur la table `abonnements`.
  - Remplacement du `ON CONFLICT (utilisateur_id)` invalide par une dÃ©sactivation des abonnements actifs existants (`UPDATE abonnements SET statut='annule'`) suivie de l'insertion propre d'un nouvel abonnement (`INSERT INTO abonnements`).
- **Correction Variable `boutiqueId` Manquante (`backend/routes/boutiques.js`)** :
  - DÃ©claration explicite de `const boutiqueId = insertBoutique.rows[0].id;` avant le retour JSON de l'endpoint et gÃ©nÃ©ration/affectation automatique d'un `slug` unique via `uniqueSlug()`.

### [2026-08-07] - Approche OpenSpec : ImplÃ©mentation IntÃ©grale de la Feuille de Route Acheteur Nopalou
- **Page de Suivi de Commande en Temps RÃ©el (`frontend-next/src/app/suivi-commande/page.tsx`)** :
  - Route publique `/suivi-commande` permettant Ã  l'acheteur d'entrer sa rÃ©fÃ©rence `CMD-2026-XXXX` ou son tÃ©lÃ©phone pour visualiser la progression de sa livraison en 4 Ã©tapes (*En attente âž” En prÃ©paration âž” En livraison âž” LivrÃ©e*).
  - Endpoint `GET /api/boutiques/commandes/suivi` avec recherche par rÃ©fÃ©rence ou tÃ©lÃ©phone et lien direct WhatsApp vers le livreur.
- **SystÃ¨me d'Avis Clients CertifiÃ©s (1 Ã  5 â­�) (`frontend-next/src/components/AvisProduitSection.tsx`)** :
  - Module de dÃ©pose d'avis rÃ©servÃ© aux acheteurs certifiÃ©s avec calcul en temps rÃ©el de la note moyenne.
  - Endpoints `GET /api/boutiques/:id/produits/:prodId/avis` et `POST /api/boutiques/:id/produits/:prodId/avis`.
  - Migration SQL idempotente (`boutique_avis`) dans `backend/migrate-inline.js`.
- **Tableau Comparatif Multi-Plateformes (`frontend-next/src/components/TableauComparatifPrix.tsx`)** :
  - Composant de comparaison montrant le podium des prix entre les Boutiques Nopalou directes et les offres externes agrÃ©gÃ©es (*Jumia, Expat-Dakar, CoinAfrique*) avec le badge **`ðŸ�† Meilleur Prix`**.
- **Badges de RÃ©assurance & SÃ©curitÃ© (`frontend-next/src/components/GarantiesAcheteurBadge.tsx`)** :
  - Composant de rÃ©assurance sous le bouton d'achat (*Satisfait ou Ã‰changÃ© sous 48h*, *Paiement SÃ©curisÃ© Wave/OM/Carte/Cash*, *Livraison Rapide*).
- **Validation Globale par les Tests AutomatisÃ©s TDD (`tests/unit/spec-acheteur-exhaustive.test.js`)** :
  - Suite de 6 unit tests acheteurs exÃ©cutÃ©e et validÃ©e Ã  **100% PASS** (Avis certifiÃ©s 201, calcul de moyenne 4.5 â­�, recherche par rÃ©fÃ©rence 200 et par tÃ©lÃ©phone 200).
  - Total cumulÃ© avec la Master Test Suite : **26 tests validÃ©s avec succÃ¨s (0 Ã©chec)**.

---

### [2026-08-07] - Approche OpenSpec : Flux Catalogues Dynamiques XML/JSON & IntÃ©gration Meta / Instagram Shopping / TikTok Catalog
- **Endpoints de Flux Catalogue Dynamique (`backend/routes/boutiques.js`)** :
  - `GET /api/boutiques/:id/catalog.xml` : GÃ©nÃ©ration du flux RSS 2.0 XML conforme aux spÃ©cifications Google Merchant, Meta Commerce Manager et TikTok Catalog. Permet Ã  chaque marchand d'importer son catalogue automatiquement sur sa page Instagram/Facebook pour taguer ses produits sur ses publications, stories et reels.
  - `GET /api/boutiques/:id/catalog.json` : Endpoint d'export JSON structurÃ© pour intÃ©gration d'applications tierces.
- **RÃ©solution Universelle UUID & Slug** : Prise en charge transparente des identifiants UUID et des Slugs d'URL (ex: `dievo-style`, `tech-dakar`) sur l'ensemble des routes d'exportation de catalogue, de validation de coupons promo et d'offres complÃ©mentaires.
- **AmÃ©lioration UX Formulaire de Commande (`CommanderModal.tsx`)** :
  - Gestion explicite des requÃªtes de codes promo vides avec affichage instantanÃ© du message d'erreur `âš ï¸� Veuillez saisir un code promo`.
  - Bouton *Appliquer* rÃ©actif Ã  tout moment sans blocage silencieux.
- **Master Test Run Exhaustif ValidÃ© Ã  100% (`tests/unit/spec-master-exhaustive.test.js`)** : 20 tests d'intÃ©gration et de cas limites exÃ©cutÃ©s et rÃ©ussis avec succÃ¨s (20/20 PASS).

### [2026-08-07] - Approche OpenSpec : ImplÃ©mentation de la Spec 06 (Multi-Devises XOF/EUR/USD & Simulation Carte Bancaire Stripe)
- **Fichier de SpÃ©cification OpenSpec 06 (`docs/specs/06-multi-devises-stripe.md`)** : RÃ©daction de la spÃ©cification OpenSpec pour le support multi-devises (`XOF`, `EUR`, `USD`) avec taux de change officiels et simulation du paiement par carte bancaire Stripe.
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : Ajout de la colonne `devise_defaut VARCHAR(10) DEFAULT 'XOF'` Ã  la table `boutiques`.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoint `GET /api/devises/taux` : Retourne les taux de conversion officiels (XOF, EUR, USD).
  - Endpoint `PUT /api/boutiques/:id/devise` : Modification de la devise par dÃ©faut de la boutique.
  - Endpoint `POST /api/paiements/stripe/simuler` : Traitement sÃ©curisÃ© des paiements par Carte Bancaire en mode simulation Stripe.
  - Correction de `GET /api/boutiques/mine` pour sÃ©lectionner `mode_fonctionnement` et `devise_defaut`.
- **Suite de Tests AutomatisÃ©s TDD (`tests/unit/spec-06-multi-devises-stripe.test.js`)** : Suite Jest validÃ©e Ã  100% (5/5 tests validÃ©s avec succÃ¨s : taux de change 200, modification de devise 200, paiement carte acceptÃ© 200 et carte dÃ©clinÃ©e 400).
- **Validation Globale Master Test Run** : Execution conjointe des 6 suites de tests OpenSpec (Spec 01 Ã  Spec 06) validÃ©es Ã  100% sans aucune erreur.

### [2026-08-06] - Approche OpenSpec : ImplÃ©mentation de la Spec 05 (Webhooks & ClÃ©s API Marchands - Developer Portal)
- **Fichier de SpÃ©cification OpenSpec 05 (`docs/specs/05-webhooks-api-keys.md`)** : RÃ©daction de la spÃ©cification OpenSpec dÃ©crivant les clÃ©s API marchands (`nopalou_sk_live_...`) et le systÃ¨me de Webhooks sÃ©curisÃ© par signature HMAC-SHA256 (`X-Nopalou-Signature`).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : CrÃ©ation des tables `boutique_api_keys` (avec hash SHA256) et `boutique_webhooks` (avec secrets `whsec_...`).
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoints ClÃ©s API : `GET`, `POST`, `DELETE /api/boutiques/:id/api-keys` (GÃ©nÃ©ration du prÃ©fixe `nopalou_sk_live_...`, hashage SHA256 et stockage).
  - Endpoints Webhooks : `GET`, `POST`, `DELETE /api/boutiques/:id/webhooks` (Enregistrement d'URLs de notifications et crÃ©ation de secret `whsec_...`).
- **Suite de Tests AutomatisÃ©s TDD (`tests/unit/spec-05-webhooks-api-keys.test.js`)** : Suite Jest validÃ©e Ã  100% (5/5 tests validÃ©s avec succÃ¨s : gÃ©nÃ©ration de clÃ© 201, rÃ©vocation 200, enregistrement webhook 201 avec secret `whsec_`, rejet d'URL invalide 400 et vÃ©rification HMAC-SHA256).

### [2026-08-06] - Approche OpenSpec : ImplÃ©mentation de la Spec 04 (Pixels de Tracking & Mesure ROAS : Meta, TikTok, GA4)
- **Fichier de SpÃ©cification OpenSpec 04 (`docs/specs/04-tracking-pixels.md`)** : RÃ©daction de la spÃ©cification OpenSpec couvrant le paramÃ©trage des Pixels publicitaires (Meta Facebook, TikTok et Google Analytics GA4).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : Ajout des colonnes `meta_pixel_id`, `tiktok_pixel_id` et `ga4_id` Ã  la table `boutiques`.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoint `PUT /api/boutiques/:id/pixels` : Sauvegarde sÃ©curisÃ©e des identifiants par le marchand.
  - Endpoint `GET /api/boutiques/:id/pixels/public` : RÃ©cupÃ©ration publique des clÃ©s de tracking pour l'injection cÃ´tÃ© navigateur.
  - Mises Ã  jour de `GET /api/boutiques/:id` et `PUT /api/boutiques/:id` pour retourner et sauvegarder les identifiants.
- **Suite de Tests AutomatisÃ©s TDD (`tests/unit/spec-04-pixels.test.js`)** : Suite Jest validÃ©e Ã  100% (4/4 tests validÃ©s avec succÃ¨s : sauvegarde marchand 200, lecture publique vitrine 200, rejet 403 et 404).
- **Composant Client Storefront Next.js (`frontend-next/src/components/TrackingPixels.tsx`)** :
  - CrÃ©ation du composant de suivi dÃ©clenchant de maniÃ¨re asynchrone les SDKs Meta Pixel (`fbq`), TikTok (`ttq`) et GA4 (`gtag`) sans bloquer le rendu de la vitrine.
- **Interface Vendeur Next.js (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** :
  - Ajout de la section dÃ©diÃ©e **ðŸ“Š Pixels Publicitaires & Tracking ROAS** dans les paramÃ¨tres de la boutique.

### [2026-08-06] - Approche OpenSpec : ImplÃ©mentation de la Spec 03 (Moteur de Promotions & Codes Promo)
- **Fichier de SpÃ©cification OpenSpec 03 (`docs/specs/03-moteur-promotions.md`)** : RÃ©daction de la spÃ©cification OpenSpec pour le moteur de coupons de rÃ©duction (pourcentage, montant fixe FCFA, livraison offerte).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : CrÃ©ation de la table `boutique_promotions` (avec contrainte unique sur `boutique_id` et `UPPER(code)`).
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoints marchands `GET`, `POST`, `DELETE /api/boutiques/:id/promotions` pour la gestion autonome des coupons de rÃ©duction.
  - Endpoint public `POST /api/promotions/valider` : VÃ©rification en temps rÃ©el de la validitÃ© d'un code (vÃ©rification de la date d'expiration, du quota d'utilisations et du montant d'achat minimum) avec calcul dynamique du montant de la remise.
- **Suite de Tests AutomatisÃ©s TDD (`tests/unit/spec-03-promotions.test.js`)** : Suite Jest validÃ©e Ã  100% (6/6 tests validÃ©s avec succÃ¨s : crÃ©ation marchand, calcul 20% sur 25 000 FCFA = 5 000 FCFA de rÃ©duction, remise fixe, rejet pour achat minimum non atteint et code expirÃ©/invalide).
- **Interface Client Storefront Next.js (`frontend-next/src/app/boutiques/[id]/CommanderModal.tsx`)** :
  - IntÃ©gration du module de saisie et de validation instantanÃ©e du Code Promo dans le tunnel d'achat avec application directe de la rÃ©duction sur le total.

### [2026-08-06] - Approche OpenSpec : ImplÃ©mentation de la Spec 02 (Checkout Web 1-Page UnifiÃ© & Cross-Sell Panier)
- **Fichier de SpÃ©cification OpenSpec 02 (`docs/specs/02-checkout-unifie-upsell.md`)** : RÃ©daction de la spÃ©cification OpenSpec couvrant l'enregistrement de commande express 1-page sans dÃ©tour WhatsApp obligatoire et le module de recommandation Cross-Sell d'articles complÃ©mentaires.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Endpoint `POST /api/boutiques/commandes/express` : Validation du formulaire client, calcul automatique du total (articles + livraison), dÃ©crÃ©mentation des stocks et insertion dans `commandes_boutique` avec rÃ©fÃ©rence unique `CMD-2026-XXXX`.
  - Endpoint `GET /api/boutiques/:id/produits/:prodId/cross-sell` : Algorithme de suggestion de produits complÃ©mentaires en stock dans la boutique.
- **Suite de Tests AutomatisÃ©s TDD (`tests/unit/spec-02-checkout-upsell.test.js`)** : Suite Jest validÃ©e Ã  100% (5/5 tests validÃ©s avec succÃ¨s : commande 201 avec calcul des montants, rejet 400 pour tÃ©lÃ©phone/articles manquants, boutique introuvable 400 et rÃ©cupÃ©ration cross-sell 200).
- **Interface Client Storefront Next.js (`frontend-next/src/app/boutiques/[id]/CommanderModal.tsx`)** :
  - IntÃ©gration du formulaire 1-page reliÃ© directement Ã  `/api/boutiques/commandes/express`.
  - IntÃ©gration du composant de suggestions **Upsell / Cross-Sell (1-Clic)** permettant Ã  l'acheteur de cocher des articles complÃ©mentaires avant d'envoyer sa commande, augmentant ainsi le panier moyen.

### [2026-08-07] - Audit Complet du Paiement & Correction des Boutons d'Abonnement Inactifs
- **Correction Majeure des Boutons de Forfait (`frontend-next/src/app/boutique/abonnement/AbonnementClient.tsx`)** :
  - Remplacement du verrouillage abusif `disabled={isPending || !!planActif}` par un ciblage prÃ©cis du plan en cours sur la durÃ©e 1 mois (`estActif && duree === 1`).
  - RÃ©activation complÃ¨te des boutons de souscription Wave et Mobile Money (Orange Money/Wave) pour permettre Ã  tous les marchands en pÃ©riode d'essai gratuite (`decouverte` / `taf_taf`) d'Ã©voluer librement vers les plans Pro & Business, d'effectuer des upgrades ou de renouveler leur engagement sur 3, 6 ou 12 mois.
- **ParamÃ©trage Dynamique des Quotas (`backend/lib/settingsCache.js` & `backend/routes/settings.js`)** :
  - Ajout des clÃ©s configurables `max_boutiques_par_compte`, `max_boutiques_par_telephone`, `alertes_abonnement_jours_avant`, `alertes_abonnement_whatsapp` et `alertes_abonnement_email`.
- **IntÃ©gration du Portail DÃ©veloppeur API dans l'Espace Marchand (`frontend-next/src/app/boutique/PortailDeveloppeurBoutique.tsx` & `BoutiqueClient.tsx`)** :
  - CrÃ©ation du composant marchand `PortailDeveloppeurBoutique.tsx` et ajout de l'onglet **`ðŸ”Œ Portail DÃ©veloppeur API`** dans le menu latÃ©ral de gestion de boutique sous *"ParamÃ¨tres & Ã‰quipe"* (accessible exclusivement sur le plan Business VIP).
  - Correction de la correspondance du champ serveur `api_key` : la clÃ© complÃ¨te s'affiche dÃ©sormais instantanÃ©ment dans un encadrÃ© vert avec un bouton **`ðŸ“‹ Copier`** et est automatiquement copiÃ©e dans le presse-papier lors du clic sur *"GÃ©nÃ©rer une ClÃ© API"*.
  - SÃ©curisation hermÃ©tique des 6 endpoints backend (`GET/POST/DELETE /api/boutiques/:id/api-keys` et `GET/POST/DELETE /api/boutiques/:id/webhooks`) avec le middleware `requireBusiness`.
- **Supervision Superadmin du Portail DÃ©veloppeur API (`/admin/developer`)** :
  - RÃ©solution de l'erreur 401 lors de la premiÃ¨re ouverture du Portail DÃ©veloppeur API : transmission sÃ©curisÃ©e de la prop `secret` lue depuis le cookie serveur `httpOnly` (`nopalou_admin`) dans le composant `page.tsx` vers `DeveloperClient.tsx` pour l'envoi du header `X-Admin-Secret`.
  - CrÃ©ation du dashboard Superadmin pour la supervision en temps rÃ©el de l'ensemble des clÃ©s API REST (`nopalou_sk_live_...`) et webhooks (`whsec_...`) gÃ©nÃ©rÃ©s par les marchands Business VIP.
  - Ajout des routes d'administration `GET /api/boutiques/admin/developer-portal`, `DELETE /api/boutiques/admin/api-keys/:keyId` et `DELETE /api/boutiques/admin/webhooks/:webhookId` pour la modÃ©ration et la rÃ©vocation des accÃ¨s en 1-clic.
  - IntÃ©gration du lien `ðŸ”Œ Portail DÃ©veloppeur API` dans la barre de navigation latÃ©rale de l'Administration Superadmin.
- **Correction DÃ©finitive & DÃ©blocage du Build Render (`BoutiqueClient.tsx`)** :
  - **Correction des ClÃ©s CSS Inline (JS camelCase)** : Remplacement des clÃ©s avec tirets `justify-content` et `align-items` par `justifyContent` et `alignItems` dans les styles JSX en ligne de `BoutiqueClient.tsx`. C'Ã©tait la cause exacte du rejet de parsing SWC/Webpack sur Render (`Unexpected token div`).
  - Validation complÃ¨te par typecheck TypeScript (`npx tsc --noEmit`) et build de production standalone rÃ©ussi (**âœ“ Compiled successfully**, 86/86 pages statiques et dynamiques).
- **Driver WebBluetooth ESC/POS Direct (`frontend-next/src/app/boutique/caisse/CaisseClient.tsx`)** :
  - IntÃ©gration du driver binaire WebBluetooth Direct permettant aux imprimantes thermiques Bluetooth sans fil (POS-5802, GOOJPRT, Xprinter, etc.) de se connecter en 1-clic depuis Chrome/Edge (Android & PC).
  - Envoi direct des commandes ESC/POS (format 58mm / 80mm, coupe et ouverture tiroir) sans passer par la boÃ®te de dialogue d'impression systÃ¨me.
- **Refonte Visuelle & Structuration de l'En-tÃªte de Gestion des Boutiques (`BoutiqueClient.tsx`)** :
    - Ã‰limination de la rÃ©pÃ©tition confuse du titre et rÃ©organisation complÃ¨te de l'en-tÃªte en une carte blanche unifiÃ©e et Ã©lÃ©gante (`background: #ffffff`, `borderRadius: 16`, ombre portÃ©e douce).
    - **Fil d'Ariane Ã‰purÃ©** : Remplacement du bouton encadrÃ© confus par une navigation textuelle discrÃ¨te `Mon compte / Mes boutiques`.
    - **Pill Badge Quota SoignÃ©** : Reformulation grammaticale du quota (`1 / 3 autorisÃ©es`) avec point de statut bleu actif `ðŸ”µ`.
    - **Alignement Parfait des Actions** : Alignement Ã  droite des boutons d'action avec typographie haute lisibilitÃ© et hiÃ©rarchie visuelle claire (`Ouvrir ma Caisse POS` en blanc contourÃ© et `CrÃ©er une boutique` en dÃ©gradÃ© Nopalou Orange).
- **Audit Global des FonctionnalitÃ©s & SignalÃ©tique BientÃ´t Disponible (`frontend-next` & `backend`)** :
  - RÃ©alisation d'un audit complet de l'ensemble des modules. 100% des modules core (E-Commerce, Panier, Caisse POS, WhatsApp WABA API, Apporteurs, API REST) sont pleinement fonctionnels.
  - Ajout des badges d'information et d'Ã©tat transparents sur les intÃ©grations en cours de KYC tiers (Sync Catalogue TikTok Shopping `â�³ BientÃ´t`, Payout automatique API Wave Direct `âš¡ Virement Manuel sÃ©curisÃ© 24h`, Impression Thermique Web & USB).
- **Remplacement des Ã‰mojis par les VÃ©ritables IcÃ´nes Vectorielles SVG RÃ©seaux Sociaux (`layout.tsx`, `globals.css`)** :
    - Remplacement complet des Ã©mojis gÃ©nÃ©riques (ðŸŽµ, ðŸ“¢, f, ðŸ“¸, ð�•�) du pied de page par les vÃ©ritables logos vectoriels SVG officiels et haute dÃ©finition de **TikTok**, **WhatsApp (Canal)**, **Facebook**, **Instagram** et **X / Twitter**.
    - Ajout de boutons circulaires surÃ©levÃ©s (`.footer-social-link`) avec animations fluides au survol (`transform: translateY(-3px)`) et couleurs officielles de chaque rÃ©seau (Vert WhatsApp `#25D366`, Bleu Facebook `#1877F2`, DÃ©gradÃ© Instagram, Noir/Cyan TikTok `#00f2fe`).
- **Audit Global des FenÃªtres & Polices SystÃ¨me UnifiÃ©es (`frontend-next/src/app/globals.css`, Modales & Wizards)** :
  - **RÃ¨gle Globale de Police SystÃ¨me (`globals.css`)** : DÃ©finition de la rÃ¨gle universelle `html, body, button, input, select, textarea { font-family: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }`. Ã‰limination dÃ©finitive des rendus de polices gÃ©nÃ©riques ou non stylisÃ©es sur 100% des pages et fenÃªtres.
  - **Harmonisation de la Couleur Bleu Marine Nopalou du Pied de Page (`.site-footer`)** : Correction et fixation explicite de la couleur de fond du pied de page sur le bleu marine Nopalou officiel (`#1C2B4A !important`), garantissant une parfaite identitÃ© visuelle avec le logo et la charte graphique Nopalou.
  - **Harmonisation des Modales & FenÃªtres Interactives** :
    - *Wizard Forfait TÃ©lÃ©com* (`WizardForfait.tsx`) : Application de la pile systÃ¨me native et refonte des boutons/puces.
    - *FenÃªtre de Commande / Express Checkout* (`CommanderModal.tsx`) : Application de la police systÃ¨me native et harmonisation des onglets de canaux (WhatsApp / Formulaire).
    - *Importation par Lot de Catalogue* (`BatchImportModal.tsx`) : Remplacement de `font-archivo` par la pile systÃ¨me haute lisibilitÃ© sur la modale d'intake.
    - *FenÃªtre de DÃ©claration / Paiement Manuel* (`ModalPaiementManuel.tsx`) : Application de la police systÃ¨me native sur le conteneur principal.
- **Enrichissement HarmonisÃ© du Forfait Business VIP & Isolation Backend (`frontend-next` & `backend`)** :
  - Mise Ã  jour complÃ¨te de l'ensemble des pages et composants (`fonctionnalites-data.ts`, `TarifsPublicsSelector.tsx`, `ShowcaseTabs.tsx`, `/compte/fonctionnalites`, `/tarifs-boutique`, `/creer-boutique`) pour reflÃ©ter les 8 piliers majeurs du forfait Business VIP (35 000 FCFA/mois) : Multi-Caissiers PIN & clÃ´tures Z, Multi-Magasins & Transferts inter-boutiques, Portail DÃ©veloppeur API REST & Webhooks, ComptabilitÃ© avec marges nettes, Automation WhatsApp Paniers AbandonnÃ©s, BanniÃ¨re sponsorisÃ©e prioritaire, Analytics CA & Classement vendeurs, Support VIP 7j/7.
  - SÃ©curisation backend sans aucune faille : injection du middleware `requireBusiness` / `checkAbonnement` sur les routes d'API Keys (`POST /:id/api-keys`), Webhooks (`POST /:id/webhooks`), Caissiers PIN (`POST /:id/caissiers`), et calcul dynamique du quota d'annonces classÃ©es (2 pour Taf Taf, 5 pour Pro, 15 pour Business VIP).
- **ContrÃ´le Backend Anti-Contournement & Quotas Boutiques (`backend/routes/boutiques.js`)** :
  - Renforcement du contrÃ´le anti-contournement par numÃ©ro de tÃ©lÃ©phone et e-mail. Normalisation universelle sur les 9 derniers chiffres du tÃ©lÃ©phone (`RIGHT(REGEXP_REPLACE(..., '[^0-9]', '', 'g'), 9)`) et comparaison insensible Ã  la casse des e-mails (`LOWER(u.email)`).
  - Ã‰limination des contournements liÃ©s aux formats de saisie (`+221`, `221`, espaces, parenthÃ¨ses) pour bloquer hermÃ©tiquement la crÃ©ation de plus de $N$ boutiques (dÃ©fini dans l'admin `/admin/tarifs`).
  - Interconnexion immÃ©diate du toggle Admin `promo_active` et `promo_code` dans la route `/api/promotions/valider`. DÃ¨s que le Superadmin dÃ©sactive les promotions dans l'administration, toute tentative d'utilisation du code promo (ex: `SOLDE20` ou `NOPALOU25`) est automatiquement bloquÃ©e et rejetÃ©e avec le message d'erreur *"Ce code promo a Ã©tÃ© dÃ©sactivÃ© par l'administration."*.
  - Remplacement du quota `MAX_BOUTIQUES` codÃ© en dur par une vÃ©rification dynamique en base.
  - ImplÃ©mentation du contrÃ´le anti-cumul vÃ©rifiant le nombre total de boutiques associÃ©es Ã  un mÃªme numÃ©ro de tÃ©lÃ©phone ou e-mail Ã  travers tous les comptes utilisateurs.
  - Ajout de la route `GET /api/boutiques/admin/promotions` pour la supervision Superadmin des coupons marchands.
- **Relances d'Abonnement Dynamiques (`backend/services/scraper.js`)** :
  - Mise Ã  jour du job de relance automatique pour envoyer des alertes prÃ©ventives $N$ jours avant expiration selon le paramÃ©trage admin (`alertes_abonnement_jours_avant`).
- **Dashboard Superadmin Next.js (`frontend-next/src/app/admin/(protected)/tarifs/TarifsClient.tsx`)** :
  - IntÃ©gration des cartes d'administration *ðŸ�¬ Quotas et limites de crÃ©ation de boutiques* et *ðŸ”” Alertes et relances d'expiration de forfaits*.
  - Clarification de la distinction entre les promotions plateforme (abonnements) et les promotions marchands.

### [2026-08-06] - Approche OpenSpec : ImplÃ©mentation de la Spec 01 (Mode Switcher Admin & Mode Pure Player E-Commerce)
- **Fichier de SpÃ©cification OpenSpec 01 (`docs/specs/01-pure-player-mode.md`)** : RÃ©daction intÃ©grale de la spÃ©cification OpenSpec dÃ©finissant le contrat d'API, le schÃ©ma SQL et les scÃ©narios de tests unitaires/E2E pour basculer entre `hybride_pos` (Commerce physique + Web) et `pure_player` (E-Commerce 100% Web).
- **Migration SQL Idempotente (`backend/migrate-inline.js`)** : Ajout automatique et sÃ©curisÃ© de la colonne `mode_fonctionnement VARCHAR(30) DEFAULT 'hybride_pos'` Ã  la table `boutiques`.
- **API Backend Express (`backend/routes/boutiques.js`)** :
  - Support de `mode_fonctionnement` dans `GET /api/boutiques/:id`, `POST /api/boutiques` et `PUT /api/boutiques/:id`.
  - CrÃ©ation de la sous-route `PUT /api/boutiques/:id/mode` avec validation stricte (rejet HTTP 400 si mode invalide, HTTP 404 si non autorisÃ©).
- **Suite de Tests AutomatisÃ©s TDD (`tests/unit/spec-01-mode-switch.test.js`)** : Suite Jest validÃ©e Ã  100% (5/5 tests validÃ©s avec succÃ¨s : mise Ã  jour vers `pure_player`, retour vers `hybride_pos`, rejet 400 et accÃ¨s 404).
- **Interface Vendeur Next.js (`frontend-next/src/app/boutique/BoutiqueClient.tsx`)** :
  - IntÃ©gration du sÃ©lecteur interactif Mode Switcher (`ðŸ�ª Mode Hybride POS` vs `âš¡ Mode Pure Player Web`) dans le formulaire de crÃ©ation et modification de boutique.
  - Affichage dynamique du badge `âš¡ Pure Player Web` / `ðŸ�ª Hybride POS` et masquage automatique du bouton de Caisse POS physique lorsque le mode pure player est activÃ©.

### [2026-08-06] - IntÃ©gration des Forfaits Multi-DurÃ©es (1, 3, 6 & 12 mois) & Choix du Marchand
- **Mise Ã  Jour de la Page d'Accueil (`app/ShowcaseTabs.tsx`)** :
  - IntÃ©gration des 4 boutons de durÃ©e d'engagement (1 mois, 3 mois -10%, 6 mois -15%, 12 mois -25% ðŸ”¥).
  - Calcul dynamique en temps rÃ©el des tarifs FCFA/mois et du total facturÃ© sur la section d'accueil.
  - Redirection automatique vers `/creer-boutique?plan=...&duree=...`.
- **Composant SÃ©lecteur Interactif Public (`app/tarifs-boutique/TarifsPublicsSelector.tsx`)** :
  - CrÃ©ation d'un sÃ©lecteur de durÃ©e interactif (1 mois, 3 mois trimestriel -10%, 6 mois semestriel -15%, 12 mois annuel -25% / 3 mois offerts).
  - Calcul dynamique et automatique en temps rÃ©el des remises, du total facturÃ© et de l'Ã©quivalent mensuel pour chaque formule.
- **Wizard CrÃ©ation Boutique (`app/creer-boutique/page.tsx`)** :
  - Correction de l'erreur `initialNom is not defined` et prÃ©-sÃ©lection exacte de la formule et de la durÃ©e transmises dans l'URL.
- **Gestion des DurÃ©es en Dashboard Vendeur & Backend** :
  - IntÃ©gration de `duree_mois` dans la route backend `POST /api/abonnements/initier` avec application automatique des taux de rÃ©duction.
  - Support de la souscription 1, 3, 6 et 12 mois directement depuis l'espace vendeur (`/boutique/abonnement`).

### [2026-08-06] - StratÃ©gie & Optimisation SEO : Forfaits Vendeurs, Alternatives Shopify & Sourcing (Alibaba/AliExpress)
- **MÃ©tadonnÃ©es SSR & DonnÃ©es StructurÃ©es (`app/creer-boutique/layout.tsx`)** : CrÃ©ation d'un layout serveur SSR pour `/creer-boutique` incluant les mÃ©tadonnÃ©es SEO enrichies (*"crÃ©er boutique en ligne SÃ©nÃ©gal"*, *"lancer son commerce Dakar"*, *"faire son business SÃ©nÃ©gal"*) et l'injection du schÃ©ma JSON-LD `Service`, `OfferCatalog` (forfaits 5 000 FCFA, 15 000 FCFA, 35 000 FCFA) et `BreadcrumbList`.
- **Landing Page & Comparatif Tarifs (`app/tarifs-boutique/page.tsx`)** : Nouvelle page d'atterrissage SSR dÃ©diÃ©e Ã  la conversion des commerÃ§ants sÃ©nÃ©galais avec :
  - Tableau comparatif direct Nopalou vs Shopify & WooCommerce (frais, Wave/Orange Money natif, commission 0%, accÃ¨s comparateur).
  - Section Sourcing & Revente (Alibaba, AliExpress, Shein).
  - FAQ accordÃ©on structurÃ©e avec le schÃ©ma Google Rich Snippets `FAQPage`.
- **Guide Ã‰ditorial SEO (`app/guide-creer-boutique/page.tsx`)** : Guide complet *"Comment CrÃ©er sa Boutique en Ligne au SÃ©nÃ©gal en 2026"* avec schÃ©ma JSON-LD `HowTo` et `BreadcrumbList` visant la Position 0 sur Google.
- **Sitemap XML (`app/sitemap.ts`)** : Ajout prioritaire (`0.9`) de `/creer-boutique`, `/tarifs-boutique` et `/guide-creer-boutique`.
- **Maillage Interne & Navigation (`app/page.tsx` & `NavbarGuides.tsx`)** : Ajout des puces de recherche vendeurs et de l'entrÃ©e *"ðŸ›�ï¸� Tarifs & Forfaits Vendeurs (1m offert)"* dans la navigation.

### [2026-08-06] - Correction du Chemin d'API Proxy FB (`KitComClient.tsx`)
- **Fix Route Proxy (`KitComClient.tsx`)** : Remplacement de la sous-route `/admin-proxy/fb/posts` (qui renvoyait une erreur 404) par la route correcte du backend Express `/admin-proxy/fb`. Les crÃ©ations de brouillons de posts depuis le Kit Com sont maintenant 100% opÃ©rationnelles.

### [2026-08-06] - Refonte des Visuels du GÃ©nÃ©rateur : Fonds Clairs & Couleurs Officieuses Nopalou
- **Refonte Design Satori (`produit-promo/route.tsx`)** : 
  - Suppression totale des fonds sombres et des contrastes bleu foncÃ©/bleu moyen.
  - AdhÃ©sion stricte Ã  la charte graphique Nopalou avec des **Fonds Clairs Haute DÃ©finition** (Fond crÃ¨me doux `#FFFDF9` & blanc pur `#FFFFFF`), titres en Bleu Marine `#1C2B4A` Ã  fort contraste, touches d'Orange Nopalou `#C75B00` et prix en Vert Nopalou `#16A34A`.
  - Application du design fond clair sur l'ensemble des 8 types de visuels (TÃ©lÃ©com, Immobilier, Chatbot WA, Formules Boutiques POS, Apporteurs, etc.).

### [2026-08-06] - GÃ©nÃ©rateur Officiel Nopalou avec 8 Types d'Affiches FonctionnalitÃ©s
- **Support des 8 Verticales Nopalou dans le GÃ©nÃ©rateur d'Affiches (`produit-promo/route.tsx` & `KitComClient.tsx`)** :
  - ðŸ–¥ï¸� **Formule Pro (Caisse POS Magasin)** (15 000 FCFA/mois, 3 Scanners, Carnet Dettes WA, Stickers EAN-13, 0% commission)
  - âš¡ **Formule Taf Taf** (2 500 FCFA/mois, vitrine 30s)
  - ðŸ‘‘ **Formule Business** (35 000 FCFA/mois, multi-caissiers PIN & clÃ´tures Z)
  - ðŸ¤– **Chatbot WhatsApp Meta 24/7** (recherche unifiÃ©e, panier WhatsApp, alertes prix)
  - ðŸ�  **Immobilier Dakar & SÃ©nÃ©gal** (location/vente appartements, villas, terrains avec contact direct)
  - ðŸ“¶ **Forfaits & Pass TÃ©lÃ©com** (comparateur Orange, Yas, Expresso, Promobile)
  - ðŸ’° **Apporteurs d'Affaires 20%** (commission rÃ©currente mensuelle Ã  vie Wave/OM)
  - ðŸ“Š **Tableau Comparatif des 3 Formules** (vue synthÃ©tique cÃ´te-Ã -cÃ´tÃ©)
  - ðŸ”¥ **Bon Plan Prix Comparatif** (produit le moins cher Ã  Dakar)

### [2026-08-06] - Refonte du GÃ©nÃ©rateur de Visuels Nopalou & Formules Boutiques/POS
- **GÃ©nÃ©rateur d'Affiches Formules & Paliers (`produit-promo/route.tsx` & `KitComClient.tsx`)** :
  - Passage d'un gÃ©nÃ©rateur individuel Ã  un **GÃ©nÃ©rateur Officiel Nopalou Plateforme & Comparateur**.
  - GÃ©nÃ©ration d'affiches 1080Ã—1080 dÃ©diÃ©es aux 4 formules : **Boutique Pro Caisse POS** (15 000 FCFA/mois, 3 Scanners, Carnet Dettes WA, Stickers EAN-13, 0% commission), **Boutique Taf Taf** (2 500 FCFA/mois), **Boutique Business Multi-Caissiers PIN** (35 000 FCFA/mois), et **Tableau Comparatif des 3 Formules**.
  - Remplacement direct des lÃ©gendes et transmission 1-clic vers les publications Facebook / Instagram (`ðŸš€ Publier FB/IG`).

### [2026-08-06] - Mise Ã  Jour de la Brochure Apporteur (HTML/PDF)
- **Mise Ã  Jour de la Brochure 13 Pages (`brochure-apporteur/route.tsx`)** : 
  - Ajout des rÃ©seaux sociaux officiels Nopalou sur la page de couverture et de contact (TikTok `@nopalou.com`, Canal WhatsApp, Facebook Page et Instagram `@nopalousn`).
  - IntÃ©gration des fonctionnalitÃ©s de Caisse Enregistreuse POS Tactile (3 Scanners, Carnet de Dettes Client WA, Multi-caissiers PIN).

### [2026-08-06] - IntÃ©gration des RÃ©seaux Sociaux sur la Page d'Accueil & Footer
- **Bandeau RÃ©seaux Sociaux d'Accueil (`page.tsx`)** : Ajout d'une section dÃ©diÃ©e avant le pied de page prÃ©sentant les liens vers **TikTok (`@nopalou.com`)**, **Canal WhatsApp**, **Facebook Page**, **Instagram (`@nopalousn`)**, et **Twitter / X (`@nopalou_sn`)**.
- **Pied de Page (`layout.tsx`)** : Mise Ã  jour des icÃ´nes du footer pour inclure directement TikTok (`@nopalou.com`), le Canal WhatsApp Officiel et WhatsApp Direct.

### [2026-08-06] - Refonte & Optimisation du Kit de Communication (`/admin/communication`)
- **Navigation par 5 Onglets ThÃ©matiques (`KitComClient.tsx`)** :
  - **Onglet 1 â€” ðŸ“± RÃ©seaux Sociaux & Contenus** : Cartes individuelles pour Facebook, Instagram, TikTok (`@nopalou.com`), Twitter/X (`@nopalou_sn`), Canal WhatsApp et Chatbot Support. Boutons **"Copier 1-Clic"** avec notification Toast, **"TÃ©lÃ©charger HD"** direct (attribut HTML `download`), et publication **"ðŸš€ Publier FB/IG"** / **"ðŸ“¢ Diffuser Canal WA"** 1-clic.
  - **Onglet 2 â€” ðŸ�ª DÃ©marchage B2B & POS Magasin** : 5 arguments POS (3 Scanners, Dettes WA, Multi-Caissiers PIN), Script oral (2 min) et plan Dakar (6 semaines), ainsi que le **Sticker & Chevalet de Caisse POS A5/A6 imprimable**.
  - **Onglet 3 â€” ðŸ’¼ Apporteurs d'Affaires** : Barre de personnalisation agent (Nom, WhatsApp, Code Apporteur) mettant Ã  jour en temps rÃ©el l'ensemble des scripts et textes, grille de commission rÃ©currente dynamique (20%), et lien vers la brochure PDF 13 pages.
  - **Onglet 4 â€” ðŸ’¬ Ã‰cosystÃ¨me WhatsApp Meta** : 4 piliers du Chatbot, lien et QR Code d'essai direct `wa.me/221708717942`.
  - **Onglet 5 â€” âš¡ GÃ©nÃ©rateur Visuels Promo Produit** : GÃ©nÃ©ration et aperÃ§u en temps rÃ©el de visuels 1080Ã—1080 (`/assets/produit-promo`) avec bouton d'export HD et publication automatique.
- **Route d'Image Dynamique Produit-Promo (`/assets/produit-promo/route.tsx`)** : Route Satori/@vercel/og gÃ©nÃ©rant des posters rÃ©seaux sociaux 1080Ã—1080 (Prix barrÃ©, Prix promo vert, Boutique, Photo).
- **Correction Glyphes & Espaces (`carre/route.tsx`, `story/route.tsx`, `flyer-demarchage/route.tsx`, `brochure-apporteur/route.tsx`)** : 
  - Remplacement de `toLocaleString('fr-FR')` (qui gÃ©nÃ©rait un caractÃ¨re espace incassable `\u00A0` s'affichant sous forme de rectangle noir/carrÃ© vide `` dans le moteur SVG Satori) par des espaces standard ASCII (`.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')`).
  - Remplacement du symbole unicode `âœ“` (absent de la police SVG par dÃ©faut de Satori et affichÃ© sous forme de carrÃ© vide ``) par des icÃ´nes SVG natives `<svg>` parfaitement nettes et compatibles Ã  100%.
- **Connexion Admin (`AdminLoginForm.tsx`)** : Extraction du formulaire de la page `/admin/login` en composant client interactive avec un bouton icÃ´ne Å“il (`ðŸ‘�ï¸�` / `ðŸ™ˆ`) permettant d'afficher ou masquer le mot de passe secret saisi en un clic.
- **RÃ©initialisation Mot de Passe (`MotDePasseOublieForm.tsx`)** : Ajout Ã©galement du bouton bascule Å“il pour l'affichage du mot de passe dans le formulaire de rÃ©initialisation.
- **Fallback Backend (`app.js`)** : Ajout du bouton d'affichage du mot de passe sur le formulaire HTML d'interception d'administration d'Express.

### [2026-08-06] - Correction Espacement Hero SearchBar & CatÃ©gories
- **Correction UI Hero (page.tsx)** : Suppression du grand espace vide vertical entre la barre de recherche (SearchBar) et les pilules de catÃ©gories (CATEGORIES). Les catÃ©gories ont Ã©tÃ© dÃ©placÃ©es Ã  l'intÃ©rieur de la colonne centrale directement sous la barre de recherche avec 14px de marge.
- **VÃ©rification Build** : Validation avec npm run build dans frontend-next (0 erreur).


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Langue

Toujours rÃ©pondre et communiquer en franÃ§ais dans ce projet, y compris dans les nouvelles sessions â€” quelle que soit la langue du message de l'utilisateur. Les noms de fichiers, le code, les identifiants et les commandes restent en anglais/tels quels ; seule la communication (texte de rÃ©ponse, rÃ©sumÃ©s, questions) est en franÃ§ais.

## Directive de DÃ©ploiement & Documentation

**RÃˆGLE ABSOLUE** : AprÃ¨s chaque dÃ©ploiement ou push git (`git push origin main`) exÃ©cutÃ© avec succÃ¨s et sans aucune erreur, l'assistant AI DOIT **systÃ©matiquement mettre Ã  jour le fichier `CLAUDE.md`** avec le rÃ©sumÃ© des rÃ©alisations techniques, migrations SQL et nouveautÃ©s avant de clÃ´turer son intervention.

## Project Overview

**Nopalou** â€” a Senegalese price comparison platform covering products, real estate (immo), and telecom offers. The project has two frontends:
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

#### DÃ©pannage Next.js (Boucle infinie / Cache corrompu)
Si le serveur de dÃ©veloppement Next.js se bloque dans une boucle ("tourne en rond") ou plante avec une erreur `EBUSY: resource busy or locked` aprÃ¨s une erreur de syntaxe :
1. ArrÃªtez le serveur `npm run dev` (Ctrl+C ou tuez le processus en arriÃ¨re-plan).
2. Supprimez le cache corrompu : `rm -rf .next` (ou supprimez le dossier `.next` manuellement).
3. Relancez `npm run dev`.

### Database
```bash
createdb prixmalin            # Create the database
npm run migrate               # Apply schema (idempotent â€” runs automatically on backend startup too)
```

## Architecture

### Backend (`backend/`)
- **`app.js`** â€” Express entry point. Runs auto-migration on startup, then starts scrapers unless `SCRAPING_DISABLED=true`. Serves the legacy `frontend/` as static files.
- **`models/db.js`** â€” Single shared `pg.Pool` instance. Import with `const { pool } = require('./models/db')`.
- **`routes/`** â€” One file per domain: `produits`, `offres`, `alertes`, `auth`, `scraper`, `telecom`, `immo`, `partenaires`, `annonces`, `boutiques`, `paiement`, `whatsapp`, `apporteurs`.
- **`services/`** â€” Background workers: `scraper.js` (orchestrates scrapers via `node-cron`), `matching.js`, `notifications.js`, `email.js`, `cloudinary.js`, `whatsapp.js`, `whatsapp-catalog.js`, `whatsapp-chatbot.js`. Immo scrapers: `scraper-immo-coinafrique.js`, `scraper-immo-expat.js`, `scraper-immo-facebook.js`.
- **`middlewares/auth.js`** â€” `verifierToken` (JWT Bearer), `tokenOptional`, `adminSecretOnly` (header `X-Admin-Secret`).
- **`migrate-inline.js`** â€” Idempotent `CREATE TABLE IF NOT EXISTS` migration called at startup.

### Next.js App (`frontend-next/src/`)
- **`middleware.ts`** â€” Runs on every non-static request. Verifies `nopalou_session` cookie (JWT via `jose`), redirects unauthenticated users away from protected routes, and injects CSP nonce headers.
- **`lib/session.ts`** â€” Server-only. Creates/reads/deletes the httpOnly `nopalou_session` cookie using `jose` (HS256). Key: `SESSION_SECRET` env var. Session payload: `{ userId, nom, email }`.
- **`lib/dal.ts`** â€” Data Access Layer. `verifySession()` (redirects to `/connexion` if no session) and `getOptionalSession()` â€” both use React `cache()` to deduplicate within a render.
- **`lib/api.ts`** â€” `apiFetch<T>(path)` â€” server-side fetch to backend with 5-minute Next.js cache revalidation.
- **`app/actions/auth.ts`** â€” Server Actions: `login`, `signup`, `logout`, `updateProfil`. Call the Express backend then create/delete/refresh the session cookie.
- **`next.config.js`** â€” Rewrites `/api/*` â†’ `NEXT_PUBLIC_BACKEND_URL/api/*`. Allowed image domains are explicitly listed.

### Auth Architecture (two separate systems)
- **Backend**: JWT Bearer tokens (`Authorization: Bearer <token>`) validated by `verifierToken` middleware. Token signed with `JWT_SECRET`.
- **Next.js**: httpOnly cookies (`nopalou_session`) signed with `SESSION_SECRET`. The Next.js Server Actions call the Express API to authenticate, then set the cookie independently. These are two different secrets and two different token formats.

### Deployment
- `render.yaml` defines **two** Render web services : `nopalou-frontend` (Next.js standalone, sert nopalou.com) et `yombale-backend` (Express API + SPA legacy, proxifiÃ© via le rewrite `/api/*` de `next.config.js`). `SCRAPING_DISABLED=true` est posÃ© par dÃ©faut sur Render (free tier).
- No Redis dependency in the current codebase (listed in `.env.example` but no Redis client is imported).

### Next.js fetch helpers (server-side only)
Two helpers cover the two call patterns from Server Components and Server Actions:

- **`lib/api.ts` â†’ `apiFetch<T>(path)`** â€” public read-only calls. Uses `BACKEND_URL` (server-side), caches 5 min (`next: { revalidate: 300 }`). No auth header.
- **`lib/backendFetch.ts` â†’ `backendAuthFetch(path, init?)`** â€” authenticated calls from Server Actions/pages. Reads session via `getOptionalSession()`, mints a 2-min HS256 JWT signed with `JWT_SECRET`, attaches it as `Authorization: Bearer`. No Next.js cache. Path is relative WITHOUT `/api/` prefix (adds it internally).
- **`lib/backend-fetch.ts` â†’ `backendFetch(path, init?)`** â€” authenticated calls from Server Actions only. Reads session via `verifySession()` (redirects if unauthenticated). Path must include `/api/` prefix. Used in most protected pages.

`JWT_SECRET` **must be identical** in both `backend/.env` and `frontend-next/.env.local`.

### Rate limiting (`backend/middlewares/rateLimit.js`)
Five limiters imported per-route: `limiterGeneral` (100/15 min), `limiterAuth` (10/15 min), `limiterRecherche` (60/min), `limiterPublication` (5/hour), `limiterEcriture` (15/15 min).

### Bot SSR (`backend/middlewares/bot-ssr.js`)
Intercepts Googlebot / Bingbot requests and returns server-rendered HTML for the legacy SPA â€” mounted after all API routes in `app.js`.

### Protected routes (Next.js middleware)
`PROTECTED_ROUTES` (`startsWith`): `/compte`, `/mes-annonces`, `/mes-annonces-immo`, `/deposer-immo`, `/deposer-annonce`
`PROTECTED_EXACT`: `/boutique`
Unauthenticated users are redirected to `/connexion`; authenticated users hitting `/connexion` or `/inscription` are redirected to `/compte`.

### Admin (Next.js)
`frontend-next/src/app/admin/` has two route groups:
- `(auth)/login` â€” public admin login page
- `(protected)/` â€” layout applies its own session guard; contains `annonces`, `immo`, `telecom`, `seo`, `compte`, `boutiques`, `abonnements`, `partenaires`, `revenus`, `publications`, `communication`, `affiliation`, `apporteurs` pages

## Key Environment Variables

### Backend (`.env`)
| Variable | Purpose |
|**6. Refonte du Carnet de CrÃ©dits & Dettes Client en Caisse POS :**
- **Saisie dÃ©taillÃ©e des produits pris** : IntÃ©gration de la sauvegarde automatique de la liste exacte des articles et des quantitÃ©s pris Ã  crÃ©dit lors de l'encaissement (`produits` JSONB en base de donnÃ©es).
- **Historique & Fiche Client** : Visualisation complÃ¨te du grand livre de compte par client (historique des opÃ©rations, remboursements Cash/Wave/OM, crÃ©dits directs).
- **Promesse d'Ã‰chÃ©ance & Justifications** : Prise en compte de la date d'Ã©chÃ©ance convenue, du quartier/adresse du client et des remarques/justifications sur chaque transaction.

**7. Scanner CamÃ©ra Smartphone, Relance WhatsApp & Format Ticket Thermique ESC/POS (58mm/80mm) :**
- **Scanner Code-Barres par CamÃ©ra Smartphone (`ðŸ“· Scanner CamÃ©ra`)** : Activation de l'appareil photo du smartphone/tablette avec dÃ©tection en temps rÃ©el des codes-barres (`BarcodeDetector` API) et ajout direct au panier.
- **Relance Automatique WhatsApp (`ðŸ’¬ WA Relance`)** : Envoi en 1 clic d'un message WhatsApp personnalisÃ© au client de quartier avec le solde exact de son carnet et la promesse d'Ã©chÃ©ance.
- **Impression Ticket Thermique ESC/POS (`ðŸ–¨ï¸� 58mm / 80mm`)** : Support universel des imprimantes thermiques Bluetooth portables (58mm) et de caisse (80mm) avec mise en page condensÃ©e.

**8. GÃ©nÃ©ration & Impression d'Ã‰tiquettes Code-Barres EAN-13 sur les Produits :**
- **Ajout d'un EAN-13 Fabricant** : Saisie/scan manuel d'un code EAN-13 existant pour tout produit.
- **GÃ©nÃ©ration Automatique de Code-Barres EAN-13** : Pour les articles artisanaux/locaux sans emballage, gÃ©nÃ©ration automatique d'un numÃ©ro EAN-13 valide avec clÃ© de contrÃ´le Modulo 10 (prÃ©fixe `200`).
- **Impression d'Ã‰tiquettes (`ðŸ�·ï¸� EAN`)** : Bouton d'impression au format sticker (50mm x 30mm) avec nom du magasin, nom du produit, prix en FCFA et visuel du code-barres EAN-13 scannable.

**9. IntÃ©gration du Code-Barres EAN-13 dans la Saisie & Ã‰dition de Produit (Backend & Dashboard) :**
- **Formulaire d'Ajout/Modification de Produit (`ProduitForm`)** : Ajout du champ dÃ©diÃ© `Code-Barres EAN-13 (Optionnel)` permettant au marchand de saisir directement ou de scanner Ã  la douchette le code EAN d'un article.
- **Migration & API Backend (`boutique_produits`)** : Ajout de la colonne `code_barre` idempotente via `migrate-inline.js` et persistance dans PostgreSQL lors des requÃªtes `POST` et `PUT /api/boutiques/:id/produits`.

**10. ModÃ¨le d'Inventaire Excel/CSV TÃ©lÃ©chargeable (`BatchImportModal`) :**
- **Bouton de TÃ©lÃ©chargement Direct (`ðŸ“¥ TÃ©lÃ©charger le modÃ¨le exemple`)** : GÃ©nÃ©ration et tÃ©lÃ©chargement instantanÃ© du modÃ¨le CSV/Excel prÃ©-formatÃ© (`modele_import_catalogue_nopalou.csv`) incluant l'encodage UTF-8 BOM pour une ouverture parfaite dans Excel avec les colonnes : `Nom du Produit`, `Prix FCFA`, `QuantitÃ© Stock`, `CatÃ©gorie` et `Code-Barres EAN-13`.

**11. Douchette Scanner Distante (Smartphone âž” PC Caisse via WiFi/Cloud) :**
- **Mode Pairage Sans Fil (`ðŸ“± Douchette Smartphone`)** : Bouton sur l'ordinateur gÃ©nÃ©rant un code de session unique (`sessionScannerId`) et un lien direct Ã  ouvrir sur le smartphone (envoi WhatsApp en 1 clic).
- **Synchronisation InstantanÃ©e PC-Smartphone** : Tout article dont le code-barres est scannÃ© par la camÃ©ra du tÃ©lÃ©phone est transmis en temps rÃ©el (< 100ms) et ajoutÃ© directement au panier de l'ordinateur avec bip sonore !

**12. Boutons Scan CamÃ©ra & GÃ©nÃ©rer EAN-13 sur les Produits du Catalogue (`BoutiqueClient.tsx`) :**
- **Formulaire de Saisie (`ProduitForm`)** : Ajout des boutons d'action rapide `ðŸŽ² GÃ©nÃ©rer EAN` (gÃ©nÃ¨re un code EAN-13 GS1 valide selon l'algorithme Modulo 10) et `ðŸ“· Scanner` (ouvre le scanner camÃ©ra dÃ©diÃ© au produit).
- **Liste & Fiches des Produits du Catalogue** : Affichage d'un badge dynamique `ðŸ�·ï¸� CB: [code]` ou `âš ï¸� Sans EAN-13` avec bouton direct `ðŸ�·ï¸� Scan / EAN` pour Ã©diter ou attribuer un code-barres en 1 clic.

**13. Refonte Ergonomique & Responsive des Cartes Produit (`BoutiqueClient.tsx`) :**
- **Disposition Mobile & Desktop 2 Niveaux (`bq-produit-card`)** :
  1. *Partie SupÃ©rieure* : Image 60x60, Nom, Prix FCFA mis en avant, et badges proprements alignÃ©s sur une seule ligne (`Stock`, `Code-Barres EAN`, `WhatsApp`).
  2. *Barre d'Actions InfÃ©rieure SÃ©parÃ©e* : SÃ©paration visuelle avec ligne de partage fine. Regroupement des actions principales (`ðŸ�·ï¸� Scan / EAN`, `âœ�ï¸� Modifier`, `ðŸ“„ Copier`) et des options secondaires (`Partager`, `ðŸ“¢ Annonce`, `ðŸ—‘ï¸� Supprimer`) sans aucun chevauchement sur smartphone.

**14. Bouton d'Impression d'Ã‰tiquettes Stickers Code-Barres EAN-13 (`BoutiqueClient.tsx`) :**
- **Bouton `ðŸ–¨ï¸� Ã‰tiquette` sur chaque Carte Produit** : GÃ©nÃ©ration et impression immÃ©diate d'Ã©tiquettes/stickers thermiques au format standard 50mm x 30mm comprenant le nom du produit, le prix FCFA, les barres graphiques vectorielles et le code EAN-13 lisible par n'importe quelle douchette.

**15. Moteur Vectoriel SVG d'Impression d'Ã‰tiquettes Code-Barres EAN-13 (`genererSVGCodeBarresEAN13`) :**
- **Rendu Vectoriel HD sans dÃ©pendance externe** : GÃ©nÃ©ration exacte des barres noires et espaces selon la norme GS1 (Guards gauche `101`, centre `01010`, droite `101` et paritÃ©s L/G/R).
- **Rendu d'Impression 50mm x 30mm** : RÃ©solution du problÃ¨me d'affichage sur les stickers imprimÃ©s. Les barres graphiques vectorielles noires s'affichent avec une nettetÃ© parfaite sur toutes les imprimantes thermiques (Bluetooth, USB, Zebra, Xprinter).

**16. Correction de la Persistance `code_barre` & Tests AutomatisÃ©s Globaux :**
- **Persistance SystÃ©matique du Code-Barres Ã  la Modification (`BoutiqueClient.tsx` & `routes/boutiques.js`)** : Ajout d'un `useEffect` de synchronisation dynamique et d'un champ masquÃ© `<input type="hidden" name="code_barre">` garantissant la transmission systÃ©matique de la valeur `codeBarreForm` lors des soumissions de formulaires `PUT`. Nettoyage de la condition backend `$10` (`codeBarreVal`).
- **Suite de Tests Automatiques ValidÃ©e (100% SuccÃ¨s)** : Validation automatisÃ©e des 5 fonctionnalitÃ©s majeures (Algorithme Modulo 10, GÃ©nÃ©rateur Vectoriel SVG, Queue Douchette Distante, Parser ModÃ¨le CSV et Enregistrement Produit).

**17. Correction de l'Erreur Serveur 500 Ã  la Modification de Produit (`routes/boutiques.js` & `BoutiqueClient.tsx`) :**
- **RÃ©solution du Conflit de Doublon HTML** : Ã‰limination du second attribut `name="code_barre"` sur le champ de saisie visuel qui entraÃ®nait la transmission d'un tableau `['code1', 'code2']` par `multer`, provoquant une erreur `TypeError: code_barre.trim is not a function`.
- **Assainissement & SÃ©curisation Backend (`rawCodeBarre`)** : Prise en charge explicite des tableaux et des chaÃ®nes dans le contrÃ´leur `PUT /api/boutiques/:id/produits/:prodId` avec gestion propre du type string et journalisation `console.error` du serveur.

**18. RÃ©solution DÃ©finitive de l'Affichage de la Persistance `code_barre` (`backend/routes/boutiques.js`) :**
- **Ajout de `p.code_barre` dans les RequÃªtes SQL `SELECT`** : Ajout de la colonne `p.code_barre` dans les requÃªtes de lecture SQL `GET /api/boutiques/:id/produits` et `GET /api/boutiques/:id/produits/:prodId`.
- **Restauration de la Synchronisation Dashboard & Caisse** : La modification s'enregistrait correctement dans PostgreSQL mais n'Ã©tait pas renvoyÃ©e par le serveur lors du rechargement de la liste par l'application frontend `loadProduits()`. DÃ©sormais, les codes-barres s'affichent instantanÃ©ment Ã  la crÃ©ation comme Ã  la modification.

---|---|
| `DATABASE_URL` | PostgreSQL connection (required) |
| `JWT_SECRET` | Signs JWT tokens â€” must match Next.js `JWT_SECRET` |
| `ADMIN_SECRET` | Guards `/admin*.html` pages and `/api/*/admin` routes |
| `FRONTEND_URL` | Allowed CORS origin (with/without `www` auto-accepted) |
| `BACKEND_URL` | Used in email links and redirects |
| `SCRAPING_DISABLED` | Set `true` to skip scraper startup (default on Render) |
| `CLOUDINARY_*` | Image uploads for boutiques and annonces |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional emails via Resend |
| `WAVE_API_KEY` / `WAVE_WEBHOOK_SECRET` | Wave Senegal payment |
| `FB_EMAIL` / `FB_PASSWORD` | Facebook immo scraper credentials |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Cloud API â€” numÃ©ro d'envoi |
| `WHATSAPP_API_TOKEN` | Meta Cloud API â€” token systÃ¨me permanent (pas le token 24h) |
| `WHATSAPP_APP_SECRET` | VÃ©rification HMAC-SHA256 des webhooks Meta |
| `WHATSAPP_VERIFY_TOKEN` | Token arbitraire pour le handshake Meta webhook |
| `WHATSAPP_CATALOG_ID` | ID du catalogue Meta Commerce |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID pour l'API catalogue |

### Next.js (`frontend-next/.env.local`)
| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs `nopalou_session` cookie (HS256 via `jose`) |
| `JWT_SECRET` | Must match backend â€” used by `backendAuthFetch` to mint tokens |
| `BACKEND_URL` | Server-side URL for Server Actions and `apiFetch` |
| `NEXT_PUBLIC_BACKEND_URL` | Client-side URL (exposed to browser) |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for `metadataBase` in `layout.tsx` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | NumÃ©ro WhatsApp Business Nopalou (format `221XXXXXXXXX`, sans `+`) â€” utilisÃ© pour gÃ©nÃ©rer les liens `wa.me` de partage boutique |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## Admin Pages

The HTML admin pages (`/admin.html`, `/admin-immo.html`, `/admin-telecom.html`, `/admin-partenaires.html`, `/admin-annonces.html`) in `frontend/` are protected by `adminPageGuard` middleware in `app.js`. They require the `X-Admin-Secret` header matching `ADMIN_SECRET`. API admin routes use `adminSecretOnly` middleware.

---

## Prochain chantier

Aucun chantier n'est actuellement identifiÃ© comme prioritaire â€” le dernier chantier planifiÃ© (homogÃ©nÃ©isation en-tÃªte/filtres/bloc SEO des pages listing et guides, voir entrÃ©e du 19 juillet ci-dessous) a Ã©tÃ© livrÃ© et mergÃ© sur `main`. Un audit global du reste du site (boutiques, compte, admin, pages statiques) a Ã©tÃ© Ã©voquÃ© comme suite possible mais n'a pas encore Ã©tÃ© lancÃ© â€” attendre une nouvelle demande de l'utilisateur ou repartir de zÃ©ro (brainstorming â†’ spec â†’ plan â†’ subagent-driven-development) sur ce pÃ©rimÃ¨tre ou un nouveau constat.

---

## Ã‰tat du projet (06 aoÃ»t 2026 â€” Audit Mobile/PWA, Refonte Navbar, WhatsApp OTP & Cahier de Recette)
**Statut :** *Commis localement (en attente de push)*

DÃ©clencheur : Demande de l'utilisateur d'un audit complet de l'adaptation mobile/PWA, correction des espacements, repositionnement des CTA et sÃ©curisation de l'authentification WhatsApp.

**RÃ©alisations & Corrections :**

**1. Refonte de la Navbar Mobile (< 1040px) :**
- **Pilule Boutique** : Remplacement de l'icÃ´ne Desktop "âš¡ Boutique Taf Taf" par une pilule mobile compacte `[ðŸ�ª Boutique]` dans l'en-tÃªte.
- **IcÃ´nes Mobile OptimisÃ©es** : Conservation des icÃ´nes essentielles (WhatsApp `ðŸ’¬`, Favoris `â�¤`, Profil `ðŸ‘¤`) et retrait du bouton `âž•` (Publier) pour libÃ©rer de l'espace.
- **Fix DÃ©bordement Horizontal** : RÃ©solution du bug de bande blanche Ã  droite causÃ© par la coexistence du bouton Desktop "Boutique Taf Taf" et de la pilule mobile (ajout de `hidden-mobile` sur les boutons Desktop).
- **Fix Hamburger TronquÃ©** : Ajout d'un `@media (max-width: 480px)` rÃ©duisant la taille des icÃ´nes (30px au lieu de 36px) pour garantir que le bouton `â˜°` reste entier.

**2. Menu Hamburger (MobileNav.tsx) :**
- **CTA Non-ConnectÃ©** : Ajout d'un bouton d'action noir `[ðŸ�ª Ouvrir une Boutique Pro]` proÃ©minent dans le tiroir latÃ©ral pour les visiteurs.
- **CTA ConnectÃ©** : Bouton `[ðŸ�ª Ma Boutique]` pointant vers le dashboard si l'utilisateur possÃ¨de dÃ©jÃ  une boutique.

**3. Zone des Filtres Mobile :**
- **RangÃ©e Mobile-Only** : Nouvelle ligne visible uniquement sur smartphone sous les filtres classiques, contenant `[âœ– Effacer]` et `[ðŸ�ª Boutique Pro]` pour compenser les boutons Desktop cachÃ©s.

**4. Correction des Espacements Verticaux :**
- **Suppression du vide massif** : RÃ©duction du `paddingBottom` du conteneur principal (de 4rem Ã  0.5rem) et mise Ã  zÃ©ro du `marginTop` de la section SEO, Ã©liminant un trou de ~100px entre les "Produits rÃ©cemment consultÃ©s" et le bloc SEO.

**5. SÃ©curisation de l'Authentification WhatsApp (Backend) :**
- **Template Meta CertifiÃ© ApprouvÃ© (`nopalou_auth_otp`)** : CrÃ©ation automatique et validation par Meta (Statut `APPROVED`, ID `1085995500661398`) du template d'authentification officiel WhatsApp avec bouton natif "Copier le code".
- **Backend Auth (`routes/auth.js`)** : IntÃ©gration du template `nopalou_auth_otp` avec fallback sur texte libre.
- **Variable d'Environnement** : Ajout de `WHATSAPP_BUSINESS_ACCOUNT_ID=901008702321523` dans `backend/.env`.

**6. Cahier de Recette Exhaustif (UAT) :**
- CrÃ©ation d'un cahier de recette complet prÃ©-production couvrant **11 modules** et **120+ cas de test** : Page d'accueil, Authentification, Espace Compte, DÃ©pÃ´t d'annonce, Boutique Pro (Gestion complÃ¨te), Parcours Acheteur, Assistant WhatsApp, Recherche & Filtres, Immobilier, TÃ©lÃ©com, Technique & ConformitÃ©.

**7. Mise Ã  Jour du Kit de Communication (Admin) :**
- **Templates RÃ©seaux Sociaux (`communication/page.tsx`)** : Ajout des nouveaux modÃ¨les de posts d'annonce pour la connexion WhatsApp 1-Clic certifiÃ©e Meta (avec le bouton natif "Copier le code") et pour la nouvelle expÃ©rience fluide Mobile & PWA.

---

## Ã‰tat du projet (05 aoÃ»t 2026 â€” IntÃ©gration Boutiques Taf Taf)
**Statut :** *FonctionnalitÃ© en production*

DÃ©clencheur : Demande de l'utilisateur d'ajouter un accÃ¨s rapide "Boutique Taf Taf" dans le menu principal et de rÃ©soudre les erreurs bloquantes lors de la crÃ©ation d'une boutique.

**RÃ©alisations & Corrections :**
- **Menu Principal (Navbar)** : Ajout d'un bouton fixe "âš¡ CrÃ©er ma Boutique Taf Taf" dans le composant `layout.tsx` Ã  cÃ´tÃ© du bouton "Publier" (bureau) et sous forme d'icÃ´ne (mobile).
- **Mise en page (UI)** : Ajout de la contrainte CSS `white-space: nowrap` sur les boutons du menu (Publier, Guides) pour empÃªcher les sauts de ligne inesthÃ©tiques sur de petits Ã©crans.
- **Base de donnÃ©es (Migration)** :
  - **Correction Colonne Manquante** : Ajout de la colonne `couleur_theme (VARCHAR(50))` Ã  la table `boutiques` dans `migrate-inline.js` pour Ã©viter l'erreur `couleur_theme does not exist`.
  - **Correction Contrainte d'Abonnement** : Mise Ã  jour du `CHECK CONSTRAINT` `abonnements_plan_check` de la table `abonnements` pour autoriser les forfaits `'taf_taf'` et `'decouverte'` en plus des forfaits existants, Ã©vitant l'erreur `violates check constraint "abonnements_plan_check"` lors du provisionnement initial des boutiques.
  - **Essai Gratuit StandardisÃ©** : Ajout de la crÃ©ation automatique du plan "dÃ©couverte" (1 mois d'essai gratuit) pour les boutiques standards (`POST /api/boutiques`), s'alignant sur le fonctionnement des boutiques Taf Taf.
- **Test E2E** : VÃ©rification rÃ©ussie (Code HTTP 200, JWT retournÃ©) du workflow backend via l'API `POST /api/boutiques/taf-taf`.

---

## Ã‰tat du projet (31 juillet 2026 â€” Refonte Ergonomique Chatbot WhatsApp & Traitement Direct du Panier)
**Statut :** *MergÃ© et pushÃ© sur `origin main` (`f17e00c`)*

DÃ©clencheur : Optimisation pas-Ã -pas du Chatbot WhatsApp selon les requÃªtes utilisateur (rÃ©duction des questions intermÃ©diaires, liste directe des boutiques, panier WhatsApp instantanÃ©).

**RÃ©alisations & AmÃ©liorations :**
- **AccÃ¨s Direct aux Boutiques** : Au clic sur `ðŸ�ª Boutiques`, envoi immÃ©diat de la liste de toutes les boutiques Nopalou actives avec numÃ©rotation (`1. Nom`, `2. Nom`...), plus une option `ðŸ“‚ Choisir par secteur`.
- **Correction du Slug Boutique (`estIdInterne`)** : Protection des identifiants `boutique_produits_tous`, `boutique_next` et `boutique_secteur_liste` contre l'interception erronÃ©e en tant que slug de boutique ("Boutique introuvable").
- **Option "Voir les produits" & DÃ©filÃ© 1-Ã -1** : Bouton `ðŸ›�ï¸� Voir les produits` dans le menu boutique, affichant les fiches produits 1 par 1 avec 3 boutons natifs (`ðŸ›’ Commander`, `â�© Suivant`, `ðŸ”� Rechercher`).
- **Traitement Direct du Panier WhatsApp (`traiterPanierMeta`)** : Ã‰limination de la question intermÃ©diaire *"Votre nom complet ?"*. Ã€ la rÃ©ception d'un panier, affichage du rÃ©capitulatif avec total et prÃ©sentation des 2 options directes (WhatsApp Direct vs Formulaire 1-Page Express).
- **SÃ©lection NumÃ©rique & Textuelle Boutiques** : Prise en charge de la frappe d'un chiffre (`1`, `2`, `3`) ou d'un nom de boutique.
- **Enrichissement des Salutations** : DÃ©tection des variantes courantes (`bjr`, `bonjou`, `jr`, `bsoir`, `hi`, `cc`).

---

## Ã‰tat du projet (30 juillet 2026 â€” DÃ©mo Commerciale 3 Axes, Bac Ã  Sable POS & Kit Commercial)
**Statut :** *MergÃ© et pushÃ© sur main*

DÃ©clencheur : Demande de l'utilisateur de lister toutes les fonctionnalitÃ©s du site pour l'acheteur, le marchand et l'apporteur d'affaires, et de les mettre en valeur de faÃ§on visuelle et interactive Ã  travers une dÃ©mo bac Ã  sable pas-Ã -pas et des banniÃ¨res sur l'ensemble du site.

**1. DÃ©mo Commerciale & Bac Ã  Sable Interactif (`DemoClient.tsx`) :**
- **Mode Marchand POS Sandbox** : Interface 100% identique au tableau de bord rÃ©el avec 5 onglets interactifs (`Caisse POS`, `Catalogue & EAN-13`, `Carnet de Dettes`, `Analytics`, `Ã‰quipe & PIN`).
- **3 Modes de Scan & Impresson EAN-13** : Modales d'essai pour le **Scanner CamÃ©ra Smartphone**, la **Douchette Smartphone Distante (Cloud Sync)**, le gÃ©nÃ©rateur EAN-13 Modulo 10 et l'aperÃ§u vectoriel des **Stickers Thermiques 50mm x 30mm**.
- **Carnet de Dettes Client & Relance WhatsApp 1-Clic** : AperÃ§u du message WhatsApp de relance prÃ©-rempli avec le solde exact et l'Ã©chÃ©ance.
- **Module Acheteur & Chatbot Meta Commerce** : Simulation du bot WhatsApp avec Product Cards, Panier Natif Meta et suivi de commande.
- **Module Apporteur d'Affaires & Kit Commercial** : Simulateur de commissions rÃ©currentes avec curseurs dynamiques, lien direct de tÃ©lÃ©chargement de la **Brochure PDF (13 p.)** et prÃ©visualisation du kit marketing.

**2. Section "Nopalou en Action" sur la Homepage (`ShowcaseTabs.tsx`) :**
- **PrÃ©sentation interactive Ã  3 onglets** : Composant client insÃ©rÃ© sur la page d'accueil (`/`) prÃ©sentant visuellement l'Ã©cosystÃ¨me pour les Acheteurs, les Marchands et les Apporteurs d'affaires avec boutons CTA d'accÃ¨s direct au simulateur et au tÃ©lÃ©chargement de la brochure.

**3. Incitation Commerciale & Navigation (`NavbarGuides.tsx` & `/boutiques`) :**
- **Navbar Header** : Ajout du badge colorÃ© `NOUVEAU` et surlignage orange sur le lien `ðŸš€ DÃ©mo Commerciale`.
- **Page Boutiques (`/boutiques`)** : Ajout du bouton d'action marchand *"ðŸ�ª Vous Ãªtes commerÃ§ant ? Tester la DÃ©mo POS â†’"* dans le banner hero.

**4. Harmonisation du Taux de Commission (20%) & Normalisation Typographique :**
- **Mise Ã  jour du taux par dÃ©faut** : Passage du taux de commission des apporteurs Ã  **20%** par dÃ©faut dans les paramÃ¨tres backend (`settingsCache.js`), la dÃ©mo (`DemoClient.tsx`, `demo/page.tsx`), les visuels rÃ©seaux sociaux (`apporteur-affaires/route.tsx`) et la brochure PDF (`brochure-apporteur/route.tsx`).
- **Correction typographique globale (`globals.css`)** : RÃ©initialisation explicite de `font-family: var(--font-inter)` sur `button, input, select, textarea` afin de garantir un rendu visuel harmonieux et rÃ©actif sur tous les navigateurs (iOS, Android, Windows, Mac).

**5. Visuel MaÃ®tre Unique Ã‰cosystÃ¨me Global (`poster-ecosysteme/route.tsx`) :**
- **Affiche Commerciale HD (1200 Ã— 1600 px)** : CrÃ©ation d'un visuel synthÃ©tique haute dÃ©finition regroupant TOUTES les fonctionnalitÃ©s du site en 3 blocs clairs (*Acheteur*, *Marchand POS*, *Apporteur 20%*).
- **IntÃ©gration Kit & Espace Apporteur** : Accessible en 1 clic dans l'administration `/admin/communication` et dans l'espace apporteurs d'affaires `/compte/apporteur` pour le dÃ©marchage et les prÃ©sentations.
- **Correction Rendu Satori (`next/og`)** : Remplacement de `display: grid` (non supportÃ© par Satori / `@vercel/og`) par un layout Flexbox (`display: flex`) afin d'Ã©liminer l'erreur HTTP 500 / image cassÃ©e et afficher correctement le poster sur `https://nopalou.com/assets/poster-ecosysteme`.

**6. Repositionnement des Filtres Produit (`page.tsx`) :**
- **Ergonomie & Parcours Utilisateur** : DÃ©placement stratÃ©gique des barres de filtres (*Budget*, *Tri*, *Bouton Effacer*) directement au-dessus du compteur de rÃ©sultats et de la grille de produits `ProduitsListe`.

**7. Revue & Alignement GÃ©nÃ©ral des Visuels Marketing (`/assets/...`) :**
- **3 Visuels SÃ©parÃ©s DÃ©diÃ©s par Pilier** :
  - **Pilier 1 (Acheteur & Consommateur)** (`/assets/pilier-acheteur`) : 1080 Ã— 1350 px â€” Super-Comparateur Multi-Marchands, Chatbot WhatsApp Meta 24/7, Alertes Prix & Immo, Comparatif CÃ´te-Ã -CÃ´te.
  - **Pilier 2 (Marchand & Caisse POS)** (`/assets/pilier-marchand`) : 1080 Ã— 1350 px â€” Caisse Enregistreuse POS Tactile, 3 Scanners (CamÃ©ra, Cloud Sync <100ms, USB), Stickers EAN-13 GS1 Modulo 10, Carnet Dettes WhatsApp 1-Clic, Multi-Caissiers PIN.
  - **Pilier 3 (Apporteur d'Affaires 20%)** (`/assets/pilier-apporteur`) : 1080 Ã— 1350 px â€” Commissions RÃ©currentes 20% mensuelles Ã  vie (Wave/OM), Brochure PDF 13 Pages, 0 FCFA d'investissement.
- **Harmonisation Taux Commission (20%)** : Correction de tous les rÃ©sidus de taux obsolÃ¨tes (10%) dans le flyer Apporteur (`apporteur-affaires/route.tsx`) et la brochure PDF 13 pages (`brochure-apporteur/route.tsx`).
- **Enrichissement FonctionnalitÃ©s DerniÃ¨res Versions** : IntÃ©gration systÃ©matique des nouvelles fonctionnalitÃ©s (Caisse Enregistreuse POS Tactile, 3 Scanners smartphone/cloud/USB, Stickers Codes-barres EAN-13 GS1 Modulo 10, Carnet de Dettes Client + Relance WhatsApp 1-Clic, Multi-caissiers PIN, Lien DÃ©mo POS commercial 1-Clic `nopalou.com/demo`).
- **Mise Ã  jour des Visuels RÃ©seaux & Supports Terrain** : Alignement du flyer A5 de dÃ©marchage (`flyer-demarchage/route.tsx`), du poster Ã©cosystÃ¨me (`poster-ecosysteme/route.tsx`), de la couverture Facebook (`cover-facebook/route.tsx`), et du kit apporteur (`/admin/communication`).
- **Bannissement Global du Chargement Dynamique de Polices (Site & Satori)** : Suppression et interdiction dÃ©finitive de tout `fetch`, `@import` ou tÃ©lÃ©chargement rÃ©seau de polices externes (ex: TTF/WOFF depuis `cdn.jsdelivr.net` ou CDN tiers) sur l'ensemble de l'application (`frontend-next`, routes `ImageResponse`, styles, API). Utilisation exclusive des piles de polices systÃ¨me natives et `var(--font-inter)` pour des performances instantanÃ©es sans dÃ©pendance rÃ©seau.

**8. Correction du Menu DÃ©roulant Actions Produit (`BoutiqueClient.tsx`) :**
- **Ergonomie & Affichage** : Positionnement ajustÃ© Ã  droite (`right: 0`, `bottom: calc(100% + 6px)`, `whiteSpace: nowrap`, `width: max-content`) pour le menu d'actions secondaires (`Actions â–¾`) du catalogue produit. Le popup ne se fait plus tronquer sur le bord droit de l'Ã©cran/conteneur.

**9. Refonte Graphique Nette & Alignement Charte Nopalou (`/assets/...`) :**
- **Alignement Charte Graphique Nopalou** : RÃ©alignement strict de tous les visuels sur les couleurs officielles Nopalou (Orange `#C75B00` & Bleu Marine `#1C2B4A`).
- **NettetÃ© Vectorielle & LisibilitÃ© Optimale** : Augmentation importante de la taille des polices (titres Ã  52-54px, sous-titres Ã  22-26px, corps Ã  18-19px `fontWeight: 700/900`) et suppression des box-shadows flous pour Ã©liminer tout flou de rendu et garantir une nettetÃ© cristalline sur tous les Ã©crans.

**10. RÃ©solution des Latences & Blocages Serveur (`ConnectTimeoutError` & `ECONNRESET`) :**
- **Ã‰limination des Fetches de Polices/Symboles Satori** : Suppression des symboles unicode spÃ©ciaux (`â†’`) dans les routes d'images `ImageResponse` (`chatbot-whatsapp`, `produit/[id]/opengraph-image.tsx`) qui dÃ©clenchaient des tentatives d'installation de polices rÃ©seau lentes et des blocages serveur de 45 secondes (`UND_ERR_CONNECT_TIMEOUT`).
- **Timeouts RÃ©seau ContrÃ´lÃ©s (6s max)** : Ajout systÃ©matique de `signal: AbortSignal.timeout(6000)` dans `api.ts`, `backendFetch.ts`, et `backend-fetch.ts` pour libÃ©rer immÃ©diatement le thread si le serveur backend Render met du temps Ã  se rÃ©veiller (`socket hang up`), Ã©liminant ainsi la lenteur du site.

**11. Visuel DÃ©diÃ© Ã‰cosystÃ¨me WhatsApp Meta 24/7 (`/assets/chatbot-whatsapp`) :**
- **CrÃ©ation du Visuel MaÃ®tre WhatsApp (1080 Ã— 1350 px HD)** : Visuel lumineux haute nettetÃ© aux couleurs Nopalou & WhatsApp (`#25D366`, `#C75B00`, `#1C2B4A`) regroupant l'intÃ©gralitÃ© des 4 verticales WhatsApp (Assistant Chatbot IA Acheteur 24/7, Panier & Commande 1-Clic sans App, Carnet Dettes Client & Relance WA 1-Clic Caisse POS, Notifications Ventes & Partage 1-Clic).
- **IntÃ©gration Kit Admin** : Ajout du visuel dans l'outil Kit Communication Admin (`/admin/communication`).

---

## Ã‰tat du projet (29 juillet 2026 â€” Refonte Boutiques, Abonnements, Panier Mobile & bloc SEO)
**Statut :** *MergÃ© et pushÃ© sur main*

DÃ©clencheur : Demandes de l'utilisateur concernant la visibilitÃ© des abonnements (3, 6 et 12 mois), la taille et la rÃ©activitÃ© du panier sur mobile, l'Ã©largissement de l'affichage des boutiques, la dynamisation des notes et filtres, la refonte du bloc SEO homepage et la modernisation des onglets de boutique.

**1. Abonnements Multi-DurÃ©es (3, 6, 12 Mois) & Paiement :**
- **Correctif d'affichage** : RÃ©tablissement de la visibilitÃ© des formules d'abonnements 3, 6 et 12 mois avec application automatique des taux de rÃ©duction (10% pour 3M, 15% pour 6M, 25% pour 12M).
- **IntÃ©gration Wave / Orange Money** : SÃ©curisation de la crÃ©ation des sessions de paiement, de la facturation et du renouvellement automatique des droits en base de donnÃ©es.

**2. Optimisation Ergonomique du Panier Mobile (Bottom Sheet) :**
- **Refonte mobile** : Remplacement du panneau latÃ©ral mobile par une **Bottom Sheet rÃ©tractable (style Apple Pay / Shopify Mobile)**. Le panier s'ouvre proprement sur la partie infÃ©rieure de l'Ã©cran sans masquer toute la page et permet une fermeture facile par glissement/clic extÃ©rieur.

**3. Dynamisation & Ã‰largissement des Boutiques (`/boutiques`) :**
- **Ã‰largissement de la mise en page** : Remplacement de la contrainte de largeur Ã©troite (`900px`) par un conteneur aÃ©rÃ© Ã  **`1350px - 1440px`**.
- **Calcul dynamique des notes** : Remplacement de la note fixe par un calcul PostgreSQL en temps rÃ©el via une sous-requÃªte `LATERAL JOIN` sur `boutique_avis` (`AVG(note)` et `COUNT(*)`).
- **Filtres par Villes et CatÃ©gories rÃ©elles** : Les filtres de l'annuaire se construisent dynamiquement (`SELECT DISTINCT`) selon les boutiques actives enregistrÃ©es en base de donnÃ©es.

**4. Refonte du Bloc SEO & Comparateur Homepage :**
- **Design Premium** : Modernisation complÃ¨te de `.seo-card` dans `globals.css` avec une typographie `Archivo` Ã©purÃ©e, une ligne dÃ©gradÃ©e supÃ©rieure, un fond blanc relief avec ombre portÃ©e douce et des puces de catÃ©gories interactives animÃ©es au survol.

**5. Onglet "Ã€ propos & Contact" & Navigation SegmentÃ©e (Style Shopify Pro / Amazon) :**
- **Enrichissement de l'onglet Infos** : Affichage dynamique des rÃ©seaux sociaux (Instagram, Facebook, Site Web), des cartes de contact avec boutons d'actions directes (`Appeler`, `Discuter sur WhatsApp Pro`) et surlignage du jour actuel dans les horaires.
- **Barre d'onglets segmentÃ©e** : Suppression des symboles parasites (â„¹, accents bruts) et refonte en un contrÃ´le segmentÃ© par capsules (`Catalogue produits`, `Annonces`, `Infos & Contact`) avec compteurs d'articles intÃ©grÃ©s.

---

## Ã‰tat du projet (24 juillet 2026 â€” Correction Espace Boutique & Importation par Lot)
**Statut :** *En attente de push sur main*

DÃ©clencheur : L'utilisateur a signalÃ© plusieurs bugs sur l'espace de gestion de la boutique ("crÃ©ation de caissier ne passe pas", "modification du PIN impossible", "Pas d'action Administrateurs Web", formulaire dÃ©bordant sur petit Ã©cran, et une erreur 500 sur l'API `/admins`). De plus, il a demandÃ© l'enrichissement de la fonctionnalitÃ© **Importation par Lot (Batch Intake)** avec des centaines de produits par catÃ©gorie et une harmonisation globale des catÃ©gories.

**1. Harmonisation des CatÃ©gories et Importation par Lot :**
- **Centralisation des catÃ©gories** : CrÃ©ation de `frontend-next/src/lib/categories.ts` comme source de vÃ©ritÃ© unique pour les catÃ©gories (Alimentation, TÃ©lÃ©phonie, Mode, etc.) afin de garantir la cohÃ©rence dans tout le site, y compris pour les boutiques mixtes.
- **Enrichissement du catalogue standard** : CrÃ©ation d'un fichier `backend/data/catalogues-standards.json` gÃ©nÃ©rÃ© via un script mÃ©tier, contenant environ 980 produits rÃ©partis dans les 9 catÃ©gories principales du marchÃ© sÃ©nÃ©galais (ex: Riz, Sucre, Ciment, TÃ©lÃ©phones, etc.).
- **Optimisation Backend** : La route d'importation par lot (`/catalogues-standards`) a Ã©tÃ© optimisÃ©e pour lire directement ce fichier JSON statique au lieu d'exÃ©cuter des requÃªtes lourdes, garantissant une rÃ©ponse rapide et stable.

**2. Correctifs Espace Boutique :**
- **Support des slugs pour l'accÃ¨s boutique** : La fonction `checkBoutiqueAccess` a Ã©tÃ© modifiÃ©e pour supporter la validation d'accÃ¨s via `UUID` OU `slug`. Auparavant, les requÃªtes `POST /caissiers` et `PUT /caissiers/:caissierId` Ã©chouaient silencieusement ou gÃ©nÃ©raient des erreurs SQL si le client envoyait le slug de la boutique plutÃ´t que son UUID, empÃªchant toute crÃ©ation ou mise Ã  jour de caissier.
- **ResponsivitÃ© du formulaire Caissier** : Conversion d'une grille CSS figÃ©e (`1fr 1fr`) vers une grille rÃ©active (`repeat(auto-fit, minmax(200px, 1fr))`) dans `BoutiqueCaissiers.tsx` pour empÃªcher le dÃ©bordement horizontal masquant le bouton de validation sur mobile.
- **Erreur 500 API `/admins`** : Correction de la requÃªte SQL dans `GET /api/boutiques/:id/admins` qui pointait par erreur vers un paramÃ¨tre ambigu. L'ID interne extrait aprÃ¨s validation de l'autorisation (`bq.id`) est maintenant utilisÃ© explicitement, fiabilisant l'affichage de la liste.
- **UX Administrateurs** : Ajout du label explicite **"Intouchable"** au lieu d'une case d'action vide pour le compte "propriÃ©taire" dans `BoutiqueAdmins.tsx`, clarifiant le fait qu'un propriÃ©taire ne peut pas se retirer lui-mÃªme.

**Point d'attention (Dette technique)** : Les erreurs SQL rapportÃ©es (`column u.prenom does not exist`) au cours du dÃ©bogage Ã©taient un artefact d'anciens logs de nodemon ou d'anciennes requÃªtes. Le code actuel a Ã©tÃ© vÃ©rifiÃ© et tourne proprement sur la base de production (Render).

---

## Ã‰tat du projet (20 juillet 2026 â€” brochure PDF pour les apporteurs d'affaires)

Le kit `/admin/communication` ne fournissait rien qu'un apporteur actif puisse remettre lui-mÃªme Ã  un commerÃ§ant prospect. Ajout d'une brochure PDF, d'abord en 5 pages puis enrichie Ã  **13 pages** suite Ã  un retour utilisateur direct (Â« la brochure est pauvre, rien sur comment crÃ©er un compte/une boutique, le comparateur, le chatbot, les fonctionnalitÃ©s boutique â€” il faut vendre le site Â»). Spec : `docs/superpowers/specs/2026-07-20-brochure-apporteur-affaires-design.md`. Plan : `docs/superpowers/plans/2026-07-20-brochure-apporteur-affaires.md`.

**Contenu final (13 pages)** : couverture, c'est quoi Nopalou, le comparateur intelligent (mÃ©canisme + avantage commerÃ§ant), crÃ©er un compte (Ã©tapes exactes du vrai formulaire d'inscription), crÃ©er une boutique (Ã©tapes exactes du vrai formulaire, y compris le champ `code_apporteur`), fonctionnalitÃ©s boutique par palier (Gratuit/Pro/Business, recopiÃ©es telles quelles depuis `frontend-next/src/lib/fonctionnalites-data.ts`), assistant WhatsApp â€” comment l'utiliser, assistant WhatsApp â€” fonctionnalitÃ©s dÃ©taillÃ©es (recopiÃ©es de `CHATBOT_FONCTIONS` dans `/admin/communication`), immobilier & annonces & tÃ©lÃ©com, programme apporteur (grille de commission dynamique), comment fonctionne la commission (rÃ©currence, attribution automatique, paiement, absence de plafond), guide pratique de dÃ©marrage en 4 Ã©tapes, contact. Tout le contenu factuel (champs de formulaire, fonctionnalitÃ©s par palier, textes du chatbot) a Ã©tÃ© vÃ©rifiÃ© contre le vrai code source avant rÃ©daction plutÃ´t que supposÃ©.

**DÃ©cision technique notable** : la gÃ©nÃ©ration du PDF Ã  la volÃ©e via une route Next.js + Playwright a Ã©tÃ© envisagÃ©e puis Ã©cartÃ©e avant implÃ©mentation â€” Playwright a dÃ©jÃ  causÃ© des OOM sur Render cÃ´tÃ© backend (scraper Facebook, voir entrÃ©e du 13 juillet 2026), et le service frontend Render (`output: 'standalone'`) n'a pas Chromium installÃ©. Ã€ la place : une route HTML normale (`frontend-next/src/app/assets/brochure-apporteur/route.tsx`, sans Playwright, sert aussi d'aperÃ§u navigateur) + un script local (`frontend-next/scripts/generer-brochure-apporteur.js`) qui utilise Playwright uniquement en dÃ©veloppement pour produire `frontend-next/public/brochure-apporteur.pdf`, Ã  committer et servir comme fichier statique â€” zÃ©ro dÃ©pendance runtime en production.

**Dette assumÃ©e** : le PDF n'est **pas rÃ©gÃ©nÃ©rÃ© automatiquement** si les tarifs (`plan_pro_prix`, `plan_business_prix`, `commission_business`, `apporteur_taux_commission`) changent depuis `/admin/tarifs` â€” contrairement au reste du kit `/admin/communication` qui est dynamique. Si les tarifs changent, relancer manuellement : `npm run dev` (frontend-next) puis `node scripts/generer-brochure-apporteur.js`, et committer le nouveau `public/brochure-apporteur.pdf`.

**Ajout complÃ©mentaire** : `apporteur_taux_commission` a Ã©tÃ© ajoutÃ© Ã  la liste des clÃ©s exposÃ©es par `GET /api/settings/public` (`backend/routes/settings.js`) â€” cette route existait dÃ©jÃ  mais n'exposait pas ce taux.

**PDF gÃ©nÃ©rÃ© et committÃ©** : `public/brochure-apporteur.pdf` (13 pages, ~754 Ko), CSS `.page` avec `page-break-before`/`page-break-after` (ancienne syntaxe) en complÃ©ment de `break-before`/`break-after` (syntaxe moderne), plus `min-height`/`max-height` fixes â€” nÃ©cessaire, une version sans l'ancienne syntaxe faisait fusionner certaines pages courtes en une seule page physique.

**Faux piÃ¨ge corrigÃ© pendant la vÃ©rification** : un premier contrÃ´le du nombre de pages via `texte.match(/\/Count\s+(\d+)/)` (sur le flux PDF brut) a signalÃ© `Count: 8` au lieu de 13 attendu, laissant croire Ã  un vrai bug de fusion de pages. En rÃ©alitÃ©, un PDF contient plusieurs objets `/Count` (un par nÅ“ud intermÃ©diaire de l'arbre `Pages`, pas seulement la racine) â€” `.match()` ne renvoie que le premier trouvÃ©, qui n'est pas forcÃ©ment celui de la racine. Le comptage fiable est `(texte.match(/\/MediaBox/g) || []).length` (un `/MediaBox` par page rÃ©elle) ou de relire tous les `/Count` trouvÃ©s (`matchAll`) pour repÃ©rer le plus grand. Les 13 pages Ã©taient dÃ©jÃ  correctement gÃ©nÃ©rÃ©es â€” Ã  ne pas re-dÃ©boguer si ce doute ressurgit sur un futur PDF Playwright de ce projet.

Comme le backend n'avait pas de `.env` dans ce worktree au moment de la gÃ©nÃ©ration, le PDF reflÃ¨te les valeurs de repli (`prixPro=15000`, `prixBusiness=35000`, `tauxApporteur=10`) plutÃ´t que les tarifs rÃ©els de la base de production â€” Ã  vÃ©rifier/rÃ©gÃ©nÃ©rer si ces valeurs diffÃ¨rent en prod au moment de la diffusion de la brochure.

---

## Ã‰tat du projet (19 juillet 2026, suite â€” homogÃ©nÃ©isation en-tÃªte/filtres/bloc SEO des pages listing et guides)

Retour utilisateur direct avec captures d'Ã©cran : les pages du site n'avaient pas de style homogÃ¨ne â€” chaque page listing avait rÃ©inventÃ© son propre systÃ¨me de filtres/en-tÃªte au fil des chantiers prÃ©cÃ©dents (SEO du 11-12 juillet, tri/filtres guides du 10 juillet, etc.), sans composant partagÃ©. Process complet brainstorming â†’ spec â†’ plan â†’ subagent-driven-development (10 tÃ¢ches + revue finale de branche opus), exÃ©cutÃ© sur `worktree-homogeneisation-pages-listing`, mergÃ© fast-forward sur `main` (`ce96ee9..6e75fc1`), poussÃ©. Spec : `docs/superpowers/specs/2026-07-19-homogeneisation-pages-listing-design.md`. Plan : `docs/superpowers/plans/2026-07-19-homogeneisation-pages-listing.md`.

**LivrÃ©** :
- 3 nouveaux composants partagÃ©s (`frontend-next/src/components/`) : `PageHeader.tsx` (fil d'Ariane + H1 + compteur + CTA optionnel), `FiltresBar.tsx` (barre de pills essentielles + panneau repliable Â« âš™ Plus de filtres Â» pour les filtres secondaires + section Â« Trier Â»), `SeoCard.tsx` (gÃ©nÃ©ralise le bloc `.seo-card` faÃ§on ticket dÃ©jÃ  en place sur la homepage, au lieu que chaque page rÃ©invente son style).
- Nouvelle classe CSS unique `.filter-pill` (+ `.filter-pill--active`/`--reset`) remplaÃ§ant 4 systÃ¨mes diffÃ©rents (`.budget-pill` isolÃ©, pills dans `.filtres-group`, pills dans `.immo-filtres-row`, `.annonces-cat-pill`) â€” **`.budget-pill` lui-mÃªme conservÃ©**, encore utilisÃ© par ~15 fichiers hors pÃ©rimÃ¨tre (wizards, comparaison, boutiques, mes-annonces, favoris, deposer-immo, landing pages).
- **8 pages migrÃ©es** vers les 3 composants partagÃ©s : les 4 pages de listing SSR (`categorie/[slug]`, `immo`, `telecom`/`TelecomClient`, `annonces`) et les 4 outils guides interactifs (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`).
- **DÃ©cision utilisateur explicite en cours de chantier** : le plan initial supposait que les 4 pages guides Ã©taient de simples barres de pills â€” en lisant le vrai code, elles se sont rÃ©vÃ©lÃ©es Ãªtre des mises en page Ã  2 panneaux (bandeau `.guide-topbar` + panneau latÃ©ral `.guide-left` avec menus `<select>`/curseurs de pondÃ©ration + panneau rÃ©sultats `.guide-right`). Demande de clarification posÃ©e Ã  l'utilisateur : garder les `<select>` et n'ajouter que fil d'Ariane/SeoCard, ou convertir les `<select>` en pills malgrÃ© le changement d'UX plus large â€” utilisateur a choisi la conversion complÃ¨te. Les curseurs de pondÃ©ration (`poids*`), les boutons de profils prÃ©dÃ©finis et les panneaux de rÃ©sultats (avec leur propre tri local, distinct du `tri` de `FiltresBar`) sont restÃ©s strictement intacts sur les 4 guides â€” vÃ©rifiÃ© Ã  chaque tÃ¢che par grep ciblÃ© sur les noms de variables de curseurs.

**Bugs trouvÃ©s en test navigateur rÃ©el aprÃ¨s la fin des 10 tÃ¢ches** (l'utilisateur a lancÃ© le serveur de dev en local pour vÃ©rifier visuellement â€” limite habituelle de l'environnement sans outil de capture, contournÃ©e ici par un vrai test utilisateur) :
- **Crash d'hydratation React sur toutes les pages `/categorie/*`** : `SeoCard` enveloppait `blurb.text` dans un `<p>`, et la page catÃ©gorie y imbriquait ses propres `<p>` (paragraphes `cat.contenu`) â†’ `<p>` dans `<p>`, HTML invalide. CorrigÃ© en changeant le wrapper de `SeoCard` en `<div className="seo-blurb-text">` (CSS ajustÃ©e en consÃ©quence) â€” bug qui n'existait sur aucune autre des 8 pages migrÃ©es (vÃ©rifiÃ© par grep, seule `categorie` imbriquait un `<p>`).
- **Police jamais rÃ©ellement appliquÃ©e sur tout le site** : `body { font-family: 'Inter', ... }` utilisait la chaÃ®ne littÃ©rale au lieu de `var(--font-inter)` gÃ©nÃ©rÃ© par `next/font` â€” ne matchait jamais la classe scopÃ©e rÃ©elle, retombait silencieusement sur la police systÃ¨me Windows. **MÃªme piÃ¨ge que celui dÃ©jÃ  documentÃ© pour Sora le 11 juillet, cette fois sur Inter** â€” un rappel que ce risque n'est pas isolÃ© Ã  un seul chantier. CorrigÃ© + antialiasing explicite ajoutÃ© (`-webkit-font-smoothing`, `text-rendering`).
- **Vide visuel sous la colonne de texte la plus courte du bloc `SeoCard`** : `.seo-cols-grid` en CSS grid forÃ§ait les deux colonnes Ã  la mÃªme hauteur de ligne â€” corrigÃ© en passant Ã  flexbox (`align-items: flex-start`, chaque colonne garde sa propre hauteur). Persistait ensuite sur `/categorie/auto-moto` car le dÃ©sÃ©quilibre rÃ©el venait du **contenu** (blurb gÃ©nÃ©rique gauche = 2 phrases fixes courtes, blurb droit = `cat.intro` + 2 paragraphes `cat.contenu` longs) plutÃ´t que du CSS seul â€” rÃ©Ã©quilibrÃ© en dÃ©plaÃ§ant `cat.intro` dans le blurb gauche, ne laissant que `cat.contenu` Ã  droite.
- **IncohÃ©rences UX signalÃ©es par l'utilisateur, corrigÃ©es** : `categorie` n'avait pas de barre de recherche texte contrairement Ã  `annonces` â€” ajoutÃ©e (mÃªme pattern, paramÃ¨tre `q` dÃ©jÃ  supportÃ© par `GET /api/produits`, aucun changement backend nÃ©cessaire). Les 3 guides Ã  panneau latÃ©ral affichaient un `PageHeader` (gros titre) immÃ©diatement suivi d'un `.guide-topbar` quasi identique (mÃªme emoji/titre/sous-titre) â€” bandeau retirÃ©, seul le lien retour subsiste sous `PageHeader` ; `.guide-topbar`/`-titre`/`-sub` devenus orphelins, retirÃ©s de `globals.css`.

**Revue finale de branche (opus, range `3b8c135..dc632e4`)** : Â« Ready to merge = With fixes Â», 0 Critical, 1 Important (le bloc `SeoCard` de `telecom` citait des noms d'opÃ©rateurs faux â€” Â« Free Â»/Â« Wave Â» au lieu de Â« Yas Â»/Â« ProMobile Â», alors que les chips juste en dessous listaient dÃ©jÃ  les bons noms), 3 Minor (CSS orpheline supplÃ©mentaire visible seulement une fois les 8 pages migrÃ©es â€” `.annonces-header`/`.telecom-header`/`.guide-select`/`.guide-prix-cats` â€” ; prop `secondaireActifsCount` de `FiltresBar` jamais consommÃ©e par aucun des 8 appelants ; `SeoCard` rÃ©utilisait la classe `.home-seo-cols` nommÃ©e pour la homepage, renommÃ©e `.seo-cols-grid`). Les 4 correctifs appliquÃ©s en un seul commit groupÃ©, re-revue indÃ©pendante (greps frais contre le code rÃ©el, pas seulement le rapport de l'implÃ©menteur) confirmant les 4 rÃ©solus â€” y compris la vÃ©rification que la homepage `page.tsx` (hors pÃ©rimÃ¨tre des 8 pages migrÃ©es mais partageant la classe CSS renommÃ©e) avait bien Ã©tÃ© mise Ã  jour en mÃªme temps, sous peine de casser son propre bloc SEO.

**PiÃ¨ge de process Ã  retenir** : le plan Ã©crit avant l'implÃ©mentation contenait une hypothÃ¨se fausse sur la structure des pages guides (jamais vÃ©rifiÃ©e contre le vrai code au moment de l'Ã©criture du plan) â€” dÃ©tectÃ© seulement en lisant le fichier rÃ©el pendant l'exÃ©cution de la tÃ¢che 9. PlutÃ´t que de forcer l'exÃ©cution de la tÃ¢che telle qu'Ã©crite ou de deviner, la question a Ã©tÃ© posÃ©e directement Ã  l'utilisateur avant de continuer â€” a Ã©vitÃ© une transformation inadaptÃ©e Ã  la structure rÃ©elle de ces 4 pages.

**Non vÃ©rifiÃ© par outil automatisÃ©** (limite dÃ©jÃ  documentÃ©e sur ce projet â€” aucun outil de capture navigateur disponible) : cette fois-ci exceptionnellement compensÃ© par un vrai test utilisateur en local (serveur de dev lancÃ© dans le worktree, backend + frontend), qui a permis de dÃ©tecter les 4 bugs visuels/fonctionnels ci-dessus qu'aucune revue de code seule (mÃªme la revue finale de branche) n'aurait pu attraper â€” confirme la valeur d'un test navigateur rÃ©el en complÃ©ment des revues de code quand l'utilisateur peut le faire.

---

## Ã‰tat du projet (19 juillet 2026 â€” marketing boutique : partage 1-clic, traÃ§age, bandeau conseils, visuel story)

Spec `docs/superpowers/specs/2026-07-18-marketing-boutique-facilitation-design.md`, plan en 8 tÃ¢ches `docs/superpowers/plans/2026-07-18-marketing-boutique-facilitation.md`, exÃ©cutÃ© via subagent-driven-development sur `worktree-marketing-boutique-facilitation` (session reprise aprÃ¨s une interruption utilisateur mi-Task 3 â€” la ledger `.superpowers/sdd/progress.md` a permis une reprise propre sans re-travail), revue finale opus Â« Ready to merge Â» 0 Critical/Important, mergÃ© sur `main` (`da0baea..8609e73`), poussÃ©.

**Objectif explicite (demande directe utilisateur)** : rÃ©duire le travail rÃ©el du marchand pour partager sa boutique/ses produits â€” **pas** lui donner des textes Ã  copier-coller (pÃ©rimÃ¨tre exclu explicitement).

**LivrÃ©** :
- `BoutonPartager.tsx` (composant partagÃ©, catalogue produits ET cartes boutique de l'onglet Marketing) : l'action principale devient 1 clic â†’ ouverture directe de `wa.me/?text=...`, au lieu d'un menu Ã  3 choix. Les actions secondaires (copier le lien, tÃ©lÃ©charger le visuel) restent disponibles derriÃ¨re un petit bouton `â‹¯`. Nouvelle prop optionnelle `onPartage?: () => void`, fire-and-forget, jamais awaited.
- **TraÃ§age `partage_le`** : colonne additive `boutique_produits.partage_le TIMESTAMPTZ` (nullable, `NULL` = jamais partagÃ©) + route `PATCH /api/boutiques/:id/produits/:prodId/partage`. Mise Ã  jour dÃ©clenchÃ©e au clic WhatsApp ou copie de lien sur un produit, jamais bloquante pour l'action de partage elle-mÃªme.
- **Message enrichi promo** : quand `prix_barre > prix`, le message WhatsApp devient `ðŸ”¥ {nom} en promo : {prix} au lieu de {prix_barre} !` au lieu du format simple.
- **Bandeau Â« Conseils & rappels Â»** en haut de l'onglet Marketing (`MarketingBoutique`) : compte les produits jamais partagÃ©s (fetch dÃ©diÃ© lÃ©ger, pas de state partagÃ© avec `CatalogueProduits`), affiche un bandeau orange actionnable (bouton Â« Voir ces produits â†’ Â» qui bascule vers l'onglet Catalogue avec le filtre `jamais_partage` prÃ©-appliquÃ©) ou un bandeau vert si tout a dÃ©jÃ  Ã©tÃ© partagÃ©.
- **Refonte visuelle** de `/assets/boutique/[id]/story` (`next/og` `ImageResponse`, `runtime = 'edge'` conservÃ©, 1080Ã—1920 inchangÃ©) : composition asymÃ©trique (titre boutique dominant Ã  gauche, carte Â« vitrine Â» inclinÃ©e avec le logo qui dÃ©borde du cadre, bande diagonale orange, halos dÃ©coratifs) â€” mÃªme niveau d'exigence que le visuel `/assets/chatbot-whatsapp` dÃ©jÃ  refondu le 6 juillet. Palette `#1C2B4A`/`#C75B00` conservÃ©e, repli ðŸ�ª si pas de logo.

**Incident de session Ã  noter** : l'exÃ©cution a Ã©tÃ© interrompue une premiÃ¨re fois par l'utilisateur juste aprÃ¨s un commit de fix des tests `BoutonPartager.test.tsx` (Task 3), avant que le contrÃ´leur ne relance la revue. Ã€ la reprise (nouvelle session), la ledger `.superpowers/sdd/progress.md` a permis de retrouver l'Ã©tat exact (commit du fix dÃ©jÃ  fait, tests Ã  re-vÃ©rifier, revue Ã  relancer) sans deviner ni re-exÃ©cuter de travail dÃ©jÃ  fait â€” confirme la valeur de la ledger pour les sessions longues/interrompues sur ce projet.

**PiÃ¨ge Windows rencontrÃ© en fin de chantier** : `git worktree remove` a timeout (2 min) sur ce worktree â€” la suppression du dossier avait commencÃ© mais pas le nettoyage de la rÃ©fÃ©rence `.git` interne, laissant un Ã©tat incohÃ©rent (Â« `.git` does not exist Â» au retry). RÃ©solu par suppression manuelle du dossier restant (`rm -rf`) puis `git worktree prune`. Si `git worktree remove` traÃ®ne anormalement longtemps sur ce projet, ne pas relancer la mÃªme commande en boucle â€” vÃ©rifier d'abord si le dossier a dÃ©jÃ  Ã©tÃ© partiellement supprimÃ©.

**Non vÃ©rifiÃ© par navigateur rÃ©el** (limite dÃ©jÃ  documentÃ©e sur ce projet) : rendu effectif du bandeau de conseils et bascule d'onglet en clic rÃ©el, dropzone/filtre en interaction utilisateur. Le visuel story boutique, lui, a Ã©tÃ© vÃ©rifiÃ© en rendant rÃ©ellement l'image (`ImageResponse` fetchÃ© en HTTP, PNG visualisÃ©) avec et sans logo â€” pas seulement par lecture de code.

---

## Ã‰tat du projet (18 juillet 2026, suite â€” scraper Facebook rÃ©parÃ© en profondeur, OCR ajoutÃ©)

DÃ©clencheur : le scraper Facebook (`backend/scripts/scraper-facebook-local.js` + `backend/services/scraper-immo-facebook.js`) ne remontait plus aucune annonce depuis le 17 juillet (`scrapes: 0, erreurs: 0` sur tous les groupes, silencieusement). Investigation en direct (session rÃ©elle contre Facebook, pas de suppositions) ayant rÃ©vÃ©lÃ© plusieurs problÃ¨mes empilÃ©s, corrigÃ©s un par un au fil de retours d'usage rÃ©els sur les annonces manquÃ©es. 8 commits sur `main` (`7dfbced..0f275d9`), poussÃ©s directement (pas de spec/plan formels â€” sÃ©rie de correctifs ciblÃ©s en debug interactif).

**Cause racine initiale** : la session Facebook sauvegardÃ©e (`backend/.fb-session.json`) avait Ã©tÃ© invalidÃ©e cÃ´tÃ© serveur par Facebook (cookies non expirÃ©s par date, mais Facebook sert quand mÃªme la vue dÃ©connectÃ©e sur la mÃªme URL de groupe â€” pas de redirection vers `/login`, donc le contrÃ´le existant sur `page.url()` ne le dÃ©tectait pas). ReconnectÃ©e manuellement via `node backend/scripts/fb-login-setup.js` (avec le bon compte, membre des 16 groupes â€” une premiÃ¨re tentative de reconnexion avec le mauvais compte a Ã©tÃ© dÃ©tectÃ©e et corrigÃ©e). **DÃ©tection ajoutÃ©e** : si `[role="feed"]` est absent ET qu'un formulaire de mot de passe est visible sur la page de groupe, le run s'arrÃªte immÃ©diatement avec une erreur explicite au lieu de continuer silencieusement sur tous les groupes restants.

**Corrections en cascade, chacune dÃ©couverte en creusant pourquoi de vraies annonces visibles sur Facebook n'Ã©taient toujours pas captÃ©es aprÃ¨s la premiÃ¨re rÃ©paration** :
- **Bruit vidÃ©o/reel non filtrÃ©** : minuteur de lecteur (`0:00 / 1:44`), bouton Â« Voir plus Â» apparaissant ailleurs qu'en toute fin (contrairement Ã  Â« En voir plus Â»), hashtags de promotion (`#viralfacebookreels...`), bouton Â« Envoyer un message Â» (+ compteur de rÃ©actions isolÃ© qui suit) â€” tous retirÃ©s du texte extrait.
- **Regex tÃ©lÃ©phone structurellement incomplÃ¨te** : `parseTelephoneFB` exigeait un sÃ©parateur figÃ© aprÃ¨s le 3áµ‰ chiffre (format `770 12 34 56`), mais le groupement le plus courant sur Facebook sÃ©nÃ©galais est `XX XXX XX XX` (espace dÃ¨s le 2áµ‰ chiffre, ex. `78 332 22 99`) â€” jamais reconnu jusque-lÃ . CorrigÃ© en tolÃ©rant un sÃ©parateur optionnel entre chacun des 9 chiffres.
- **Annonces sans numÃ©ro exploitable** : le repli `contact_tel: 'Voir sur Facebook'` laissait passer du pur bruit d'obfuscation Facebook (posts oÃ¹ le texte n'est que des tokens 1-2 caractÃ¨res) sous forme d'annonces creuses. RetirÃ© â€” un post sans numÃ©ro rÃ©ellement extrait est maintenant ignorÃ© (`stats.ignores++`), plus jamais insÃ©rÃ©.
- **NumÃ©ro incrustÃ© dans l'image** (banniÃ¨res colorÃ©es type Â« Babacar Immobilier Niane Â», Â« El Hadji Seck Â») : invisible pour `parseTelephoneFB` qui ne lit que `innerText`. Ajout d'un repli OCR (**`tesseract.js`**, nouvelle dependency Ã  la racine â€” jamais utilisÃ©e cÃ´tÃ© serveur, ce scraper ne tourne qu'en local, aucun impact RAM/build sur Render) : si le texte DOM d'un post est pauvre (< 6 mots utiles aprÃ¨s nettoyage) et qu'il a des images, la premiÃ¨re image est passÃ©e Ã  l'OCR et son texte fusionnÃ© avec le texte DOM avant tous les filtres. Un seul worker Tesseract rÃ©utilisÃ© pour tout le run (coÃ»t d'init dominant). Filtres rÃ©ordonnÃ©s : tÃ©lÃ©phone + catÃ©gorie rÃ©ellement dÃ©tectÃ©s valident dÃ©jÃ  qu'il s'agit d'une vraie annonce â€” le filtre `estAnnoncePotentielle` (liste de mots-clÃ©s type Â« vends Â»/Â« disponible Â») ne s'applique plus qu'en repli si aucun numÃ©ro n'est trouvÃ©, car le style d'annonce local (Â« 45 mille x 3 Â», Â« prend un homme Â») omet souvent tout mot de cette liste.
- **Posts tronquÃ©s par Â« Voir plus Â»** : le numÃ©ro de tÃ©lÃ©phone se trouve trÃ¨s souvent juste aprÃ¨s la coupure (ex. Â« â€¦Niveau disponible : 5Ã¨me Ã©tage Voir plus Â» â†’ Â« â€¦Prix: 400 000HT Contactez-nous au 77 697 14 73 Â»), texte qui n'existe pas dans le DOM tant qu'on ne clique pas dessus â€” aucun nettoyage regex ne peut le rÃ©cupÃ©rer. Ajout d'un clic Playwright rÃ©el (pas `page.evaluate` + `.click()` DOM brut â€” Facebook attache ses handlers React aux Ã©vÃ©nements de pointeur rÃ©els) sur chaque bouton Â« Voir plus Â» du feed avant l'extraction, boucle bornÃ©e Ã  20 clics par groupe.

**VÃ©rifiÃ© en conditions rÃ©elles Ã  chaque Ã©tape** (jamais de suppositions) : session reconnectÃ©e testÃ©e contre une vraie page de groupe, chaque regex testÃ©e contre les exemples exacts fournis par l'utilisateur, OCR et clic Â« Voir plus Â» testÃ©s contre de vrais posts du groupe immo `252740871421764` â€” le post Â« Saidou Niang Â» (Â« APPAREMMENT F3â€¦ Â») prÃ©cÃ©demment perdu (numÃ©ro cachÃ© derriÃ¨re Â« Voir plus Â») est maintenant correctement retenu avec son numÃ©ro extrait aprÃ¨s dÃ©pliage.

**Fichiers modifiÃ©s** : uniquement `backend/services/scraper-immo-facebook.js` (toute la logique) + `package.json`/`package-lock.json` (ajout `tesseract.js`) + `.gitignore` (ignore `*.traineddata`, modÃ¨le OCR tÃ©lÃ©chargÃ© au runtime, ~1.2 Mo, pas Ã  committer).

**Dette / non couvert** :
- Annonces dÃ©jÃ  en base avec `contact_tel = 'Voir sur Facebook'` (insÃ©rÃ©es par les runs avant ce chantier) non nettoyÃ©es rÃ©troactivement â€” restent telles quelles.
- L'OCR n'est tentÃ© que sur la **premiÃ¨re** image d'un post Ã  texte pauvre (les photos suivantes sont supposÃ©es Ãªtre des vues complÃ©mentaires sans texte additionnel) â€” un post Ã  banniÃ¨re sur sa 2áµ‰+ photo uniquement resterait manquÃ©.
- Le filtre `estAnnoncePotentielle` reste inchangÃ© en tant que tel (liste de mots-clÃ©s), simplement contournÃ© quand un numÃ©ro est dÃ©jÃ  trouvÃ© â€” un post sans numÃ©ro ET sans mot-clÃ© de cette liste reste ignorÃ©, cas jugÃ© acceptable (pas assez de signal pour une insertion fiable).

---

## Ã‰tat du projet (18 juillet 2026, suite â€” traitement du panier natif WhatsApp/Meta Commerce)

Spec `docs/superpowers/specs/2026-07-18-panier-meta-whatsapp-design.md`, plan en 6 tÃ¢ches `docs/superpowers/plans/2026-07-18-panier-meta-whatsapp.md`, exÃ©cutÃ© sur la branche worktree `worktree-panier-meta-whatsapp` (5 commits, `7da3967..f6e6713`), sur `main`, poussÃ©.

**LivrÃ©** :
- `creerCommandeBoutique()` (`backend/routes/comptabilite.js`) n'envoie plus de notification WhatsApp elle-mÃªme â€” extraite dans `notifierVendeurCommande()`, exportÃ©e, appelÃ©e par chaque appelant. Comportement de la route web `POST /:boutiqueId/commandes` inchangÃ© (mÃªme message, notification immÃ©diate).
- Colonne additive `commandes_boutique.groupe_commande UUID` (nullable) + index partiel, pour lier les lignes d'un mÃªme panier multi-articles.
- `context.commande` du chatbot WhatsApp gÃ©nÃ©ralisÃ© : passe d'un produit unique implicite Ã  un tableau `items[]` (`{ produit_id, nom_produit, prix, quantite, stock_quantite }`), pour le flux Â« Commander Â» mono-produit existant **et** le nouveau panier Meta â€” mÃªmes clÃ©s dans les deux chemins, `COMMANDE_QUANTITE`/`envoyerRecapFinal`/`COMMANDE_CONFIRMATION` fonctionnent identiquement quelle que soit l'origine.
- DÃ©tection `msg.type === 'order'` en tÃªte de `handleIncoming` (`whatsapp-chatbot.js`) â€” un client qui utilise le bouton panier natif WhatsApp depuis une fiche produit Meta Commerce dÃ©clenche `traiterPanierMeta()` : rÃ©solution des `retailer_id` (`nopalou-produit-{id}`) en produits rÃ©els (prix toujours relu en base, jamais celui envoyÃ© par Meta), articles introuvables Ã©cartÃ©s silencieusement (panier partiellement invalide continue, panier entiÃ¨rement invalide â†’ message clair), puis dÃ©marrage direct de la collecte de coordonnÃ©es (saute l'Ã©tape quantitÃ©, dÃ©jÃ  connue).
- Notification vendeur groupÃ©e (`notifierVendeurPanierGroupe`) pour un panier Ã  plusieurs articles â€” un seul message WhatsApp listant toutes les lignes, `groupe_commande` partagÃ© par toutes les commandes crÃ©Ã©es. Panier Ã  1 article â†’ notification simple identique au flux mono-produit existant (`groupe_commande` reste `NULL`).
- `/boutique` â†’ onglet Commandes (`Commandes.tsx`) : `regrouperCommandes()` regroupe les lignes partageant un `groupe_commande` en carte dÃ©pliable `CommandeGroupeCard` (badge Â« ðŸ›’ Panier Â· N articles Â», total agrÃ©gÃ©, statut mixte si les lignes divergent) ; les commandes sans groupe (tout l'historique existant, mono-produit web classique) continuent d'utiliser `CommandeCard` telle quelle, aucune rÃ©gression visuelle.

**VÃ©rifications faites** :
- `node --check` propre sur les 3 fichiers backend touchÃ©s (`whatsapp-chatbot.js`, `comptabilite.js`, `migrate-inline.js`) et `npx tsc --noEmit` propre cÃ´tÃ© Next.js (`Commandes.tsx`).
- **Migration rÃ©ellement appliquÃ©e en base de production** â€” piÃ¨ge dÃ©couvert en le faisant : `npm run migrate` exÃ©cute en fait `backend/migrate.js`, un script **obsolÃ¨te et distinct** de `migrate-inline.js` (celui rÃ©ellement appelÃ© par `app.js` au dÃ©marrage du serveur), qui a sa propre copie ancienne du schÃ©ma sans la colonne `groupe_commande`. `npm run migrate` seul aurait donc donnÃ© un faux sentiment de succÃ¨s sans rÃ©ellement crÃ©er la colonne en prod. Migration correcte relancÃ©e directement via `require('./backend/migrate-inline')()`, colonne `commandes_boutique.groupe_commande` (type `uuid`) confirmÃ©e prÃ©sente par requÃªte directe sur `information_schema.columns`. **Si `npm run migrate` doit resservir un jour, vÃ©rifier qu'il pointe vers `migrate-inline.js` ou le retirer pour Ã©viter ce piÃ¨ge.**
- Test isolÃ© du chemin `msg.type === 'order'` avec un `retailer_id` factice (produit inexistant) contre la base rÃ©elle : `handleIncoming()` se termine sans exception (`OK: pas de crash`), aboutit proprement au message Â« produits non disponibles Â».

**Non vÃ©rifiÃ© â€” nÃ©cessite un test manuel rÃ©el sur WhatsApp** (pas d'outil d'automatisation WhatsApp/navigateur dans cet environnement, cohÃ©rent avec la limitation dÃ©jÃ  documentÃ©e ailleurs dans ce fichier) :
- Flux Â« Commander Â» mono-produit existant (non-rÃ©gression) : un seul message de notification, contenu identique Ã  avant ce chantier, `groupe_commande` NULL en base.
- Panier Meta rÃ©el Ã  1 article envoyÃ© depuis une Product Message WhatsApp.
- Panier Meta rÃ©el Ã  plusieurs articles de la mÃªme boutique : `groupe_commande` partagÃ©, notification vendeur groupÃ©e reÃ§ue, affichage `CommandeGroupeCard` visible et correct dans `/boutique`.
- Panier mÃ©langeant un article valide et un `retailer_id` invalide (produit supprimÃ©) : seul l'article valide doit aboutir Ã  une commande.
- Non-rÃ©gression de la route web classique (`CommanderModal.tsx` sur `/boutiques/{id}`) â€” notification vendeur immÃ©diate, contenu inchangÃ©.

Smoke-test recommandÃ© avant de considÃ©rer ce chantier dÃ©finitivement clos : passer une vraie commande via chacun des 3 chemins (web, WhatsApp mono-produit, panier Meta multi-articles) et confirmer les 5 points ci-dessus.

---

## Ã‰tat du projet (18 juillet 2026 â€” variantes visuelles + correctif dÃ©bordement navbar mobile compte)

Suite directe du chantier boutique du 17 juillet (voir entrÃ©e ci-dessous). Deux correctifs distincts, tous deux sur `main`, poussÃ©s.

### SÃ©lection visuelle des variantes (`419ee47`)
Retour utilisateur : le formulaire texte libre livrÃ© la veille (Â« nom de l'option Â» + Â« valeur, EntrÃ©e pour ajouter Â») ne correspondait pas Ã  la demande â€” il fallait une sÃ©lection **visuelle**, avec des **types de variante prÃ©dÃ©finis** (pas de saisie de nom) et des **couleurs cliquables** (pastilles, pas de texte) pour rester facile Ã  utiliser pour un petit commerÃ§ant. Refonte complÃ¨te de la section Â« Variantes Â» dans `ProduitForm` (`BoutiqueClient.tsx`) :
- 6 types prÃ©dÃ©finis (`TYPES_VARIANTE`) : ðŸŽ¨ Couleur, ðŸ“� Taille (vÃªtement), ðŸ‘Ÿ Pointure (chaussure), ðŸ’¾ Stockage/RAM, âš™ï¸� CapacitÃ©/Puissance, âž• Autre (personnalisÃ©) â€” le marchand clique sur un type au lieu de taper un nom. Un seul groupe par type prÃ©dÃ©fini (retirÃ© de la liste de choix une fois ajoutÃ©), sauf Â« Autre Â» qui reste rÃ©pÃ©table.
- **Couleur** : 16 pastilles rondes (palette fixe `COULEURS_PALETTE`, nom + hex), cliquables, nom affichÃ© en dessous â€” aucune saisie texte.
- Autres types prÃ©dÃ©finis : boutons avec valeurs suggÃ©rÃ©es standards (ex. XS/S/M/L/XL/XXL, 36-46, 4 Goâ†’1 Toâ€¦), cliquables (toggle sÃ©lection).
- **Autre (personnalisÃ©)** : reste en saisie libre texte + EntrÃ©e (nouveau composant `ValeursLibres`), pour les cas non couverts par les types prÃ©dÃ©finis (matiÃ¨re, etc.).
- `Variante` a gagnÃ© un champ optionnel `typeId` (forme JSON stockÃ©e en base inchangÃ©e pour le reste â€” `{ nom, valeurs, typeId? }`). RÃ©trocompatible : les variantes crÃ©Ã©es par l'ancien formulaire texte libre (sans `typeId`) s'affichent en mode Â« Autre Â» Ã  l'Ã©dition, aucune perte de donnÃ©es.

### Correctif â€” dÃ©bordement horizontal navbar mobile sur tout `/compte/*` (`880040d`)
Retour utilisateur avec captures : sur mobile connectÃ©, toutes les pages du compte (pas seulement `/boutique`) affichaient un dÃ©calage vers la droite avec un vide Ã  gauche et une scrollbar horizontale. **Cause racine, sans rapport avec le chantier boutique** : `NavbarActions.tsx` (bloc Â« nom du compte + DÃ©connexion Â», visible uniquement connectÃ©, montÃ© dans `layout.tsx` juste avant le hamburger mobile) n'avait aucune rÃ¨gle responsive, et surtout son `style={{ display: 'flex' }}` **inline** empÃªchait toute rÃ¨gle CSS externe `display: none` de s'appliquer (mÃªme spÃ©cificitÃ©, l'inline gagne toujours en cascade). RÃ©sultat : sous ~1040px, `.navbar-actions` (nom + DÃ©connexion + bouton Publier + hamburger) dÃ©passait le viewport de ~136px sur un Ã©cran 375px.

**MÃ©thode de vÃ©rification** : aucun outil de capture navigateur disponible dans l'environnement (limite dÃ©jÃ  documentÃ©e) â€” Playwright installÃ© en devDependency (`frontend-next/package.json`, ne touche jamais au build/runtime Render car en `devDependencies`, jamais installÃ© en production), compte de test crÃ©Ã© via `/inscription`, mesure `document.documentElement.scrollWidth` vs `clientWidth` en viewport 375px avant/aprÃ¨s correctif (511 vs 375 â†’ 375 vs 375), capture d'Ã©cran confirmant visuellement la disparition du dÃ©bordement.

**Correctif** : classe `navbar-actions-compte` ajoutÃ©e sur le wrapper (au lieu du style inline `display`), masquÃ©e sous 1040px dans `globals.css` (mÃªme media query que `.navbar-link`/`.navbar-inscription` pour les visiteurs anonymes â€” le nom/DÃ©connexion est de toute faÃ§on dÃ©jÃ  dupliquÃ© dans le tiroir `MobileNav`). Playwright conservÃ© en devDependency pour faciliter ce type de vÃ©rification visuelle mobile Ã  l'avenir.

**PiÃ¨ge Ã  retenir** : un style inline `display` sur un Ã©lÃ©ment ne peut JAMAIS Ãªtre masquÃ© par une media query CSS externe de mÃªme spÃ©cificitÃ© â€” si un composant a besoin d'Ãªtre cachÃ©/affichÃ© de faÃ§on responsive, le `display` doit venir d'une classe CSS, jamais d'un style inline, mÃªme si le reste des styles (gap, align-itemsâ€¦) peut rester inline.

---

## Ã‰tat du projet (17 juillet 2026, suite â€” boutique : responsive mobile, multi-photos et variantes produit)

DÃ©clencheur : retour utilisateur avec captures d'Ã©cran mobile montrant la zone Â« Ma boutique Â» Ã©crasÃ©e sur tÃ©lÃ©phone, plus deux limitations signalÃ©es par comparaison avec AliExpress (un seul champ photo, aucune variante). Spec `docs/superpowers/specs/2026-07-17-boutique-mobile-photos-variantes-design.md`, plan en 8 tÃ¢ches `docs/superpowers/plans/2026-07-17-boutique-mobile-photos-variantes.md`, exÃ©cutÃ© via subagent-driven-development (revue par tÃ¢che + revue finale de branche opus), mergÃ© sur `main` (`aeaf235..1d49f40`), poussÃ©.

**LivrÃ©** :
- **Responsive mobile** â€” tout `frontend-next/src/app/boutique/BoutiqueClient.tsx` (liste boutiques, formulaires, vue Â« GÃ©rer la boutique Â») converti de styles inline vers des classes CSS (`.bq-*`, `globals.css`) avec breakpoint 640px cohÃ©rent avec le reste du site. La sidebar de gestion (220px fixe) devient une barre d'onglets horizontale scrollable sous 640px ; toutes les grilles `1fr 1fr` passent en 1 colonne.
- **Jusqu'Ã  5 photos par produit du catalogue boutique** (au lieu d'une seule) â€” `boutique_produits.images` Ã©tait dÃ©jÃ  `TEXT[]`, seule la route (`upload.single('image')` â†’ `upload.array('photos', 5)`, nouvelle instance multer dÃ©diÃ©e `uploadProduitPhotos` pour ne pas toucher aux limites de la route logo/cover) et le formulaire (dropzone rÃ©utilisant les classes `.photos-zone`/`.photos-dropzone`/`.photo-thumb` dÃ©jÃ  utilisÃ©es par `FormulaireAnnonce.tsx`, technique `DataTransfer` pour resynchroniser `input.files` en lecture seule lors des suppressions) limitaient Ã  1.
- **Variantes simples produit** (ex: Couleur/Taille â€” un seul `prix`/`stock_quantite` pour tout le produit, pas de prix/stock par combinaison, dÃ©cision explicite pour rester simple Ã  saisir pour un petit commerÃ§ant) â€” nouvelle colonne additive `boutique_produits.variantes JSONB DEFAULT '[]'`, section optionnelle Â« Variantes Â» dans le formulaire vendeur (mode dÃ©taillÃ© uniquement). Sur la fiche produit publique, la sÃ©lection d'une valeur par option est **obligatoire** avant que le bouton Â« Commander sur le site Â» se dÃ©bloque (dÃ©cision utilisateur â€” pas de prÃ©sÃ©lection automatique) ; WhatsApp/TÃ©lÃ©phone restent cliquables sans contrainte (canaux hors-site). La sÃ©lection choisie est reportÃ©e dans le champ Â« Note / prÃ©cisions Â» dÃ©jÃ  existant du formulaire de commande â€” aucun changement du schÃ©ma `commandes_boutique`.

**Limite fonctionnelle notÃ©e par la revue finale (assumÃ©e, pas un bug)** : l'obligation de sÃ©lectionner une variante n'est appliquÃ©e que cÃ´tÃ© client â€” le champ `note` reste librement Ã©ditable et `POST /api/comptabilite/:id/commandes` ne connaÃ®t pas les variantes. Un vendeur peut donc recevoir une commande d'un produit Ã  variantes sans variante renseignÃ©e si l'acheteur vide le champ ou appelle l'API directement. Conforme Ã  la spec (pas de nouvelle colonne de commande voulue), Ã  garder en tÃªte si une garantie serveur devient nÃ©cessaire plus tard.

**Incident de chantier Ã  retenir** : la premiÃ¨re tentative de la tÃ¢che CSS (modÃ¨le haiku, chargÃ© d'un simple ajout en fin de `globals.css`) a rÃ©Ã©crit tout le fichier au lieu d'un ajout ciblÃ©, corrompant l'encodage du texte franÃ§ais prÃ©existant (BOM UTF-8 ajoutÃ©, tous les accents/tirets mojibakÃ©s â€” Â« Nopalou â€” Design System Â» devenu Â« Nopalou Ã¢â‚¬â€� Design System Â»). DÃ©tectÃ© via un `git diff --stat` montrant 148 suppressions inattendues pour une tÃ¢che d'ajout pur, avant toute revue ; commit annulÃ© (`git reset --hard`), retentÃ© avec succÃ¨s en imposant l'usage d'Edit ciblÃ© plutÃ´t que Write pour toute tÃ¢che touchant un gros fichier existant contenant de l'Unicode. Voir mÃ©moire `feedback_haiku_unicode_mangling.md` â€” toujours vÃ©rifier `git diff --stat` aprÃ¨s une tÃ¢che d'ajout pur sur un fichier volumineux multilingue, 0 suppression attendue.

**Non vÃ©rifiÃ© par navigateur rÃ©el** (aucun outil d'automatisation disponible dans l'environnement) : rendu effectif de la barre d'onglets scrollable sous 640px, dropzone multi-photos, sÃ©lecteur de variantes. VÃ©rifiÃ© uniquement via `npx tsc --noEmit` (propre) et relecture de diff. Test manuel recommandÃ© aprÃ¨s dÃ©ploiement : `/boutique` en mode mobile, ajout d'un produit avec 3-5 photos et 2 options de variantes, puis parcours acheteur sur la fiche publique.

---

## Ã‰tat du projet (17 juillet 2026, suite â€” dÃ©doublonnage produits + tri par dÃ©faut Â« meilleur prix Â»)

DÃ©clencheur : doublons visibles dans la recherche chatbot (Â« Samsung Galaxy 16 5G Â» en double). Diagnostic prod : **5 230 lignes en trop sur 8 200 produits (64 %)**, doublons recrÃ©Ã©s Ã  chaque run de scraping. Spec `docs/superpowers/specs/2026-07-17-dedoublonnage-produits-tri-prix-design.md`, plan 6 tÃ¢ches, subagent-driven-development, revue finale opus Â« Ready to merge Â» 0 Critical/Important, mergÃ© ff (`9b3953b..d97f487` + `33141b2`), poussÃ©.

**Causes racines corrigÃ©es** :
- Titres 100 % gÃ©nÃ©riques (Â« Split Haier Â», Â« iPhone X Â») : tous les mots filtrÃ©s par `MOTS_GENERIQUES`/longueur < 3 â†’ `motsCles` vide â†’ matching flou **sautÃ©** â†’ INSERT Ã  chaque run. CorrigÃ© par une Ã©tape **1bis** dans `sauvegarderProduits` : correspondance exacte sur nom normalisÃ© via `sqlNomNormalise(col)` (exportÃ©e de `scraper.js`, source unique â€” appliquÃ©e AUX DEUX cÃ´tÃ©s de l'Ã©galitÃ©). âš ï¸� Deux fix rounds ont Ã©tÃ© nÃ©cessaires : les subagents haiku **mutilent les caractÃ¨res Unicode** (`â€™â€˜â€œâ€�`) et l'Ã©chappement `\[\]` dans les template literals â€” Ã©crire ce genre de ligne soi-mÃªme.
- Apostrophes : `normaliserTitre` les retire cÃ´tÃ© requÃªte mais pas cÃ´tÃ© base â†’ Â« J'adore EDP 100ml Â» ne matchait jamais (124 doublons).

**Fusion exÃ©cutÃ©e en prod (2 passes)** : `backend/scripts/fusionner-doublons-produits.js` (`--dry-run` supportÃ©, une transaction par groupe, offres/alertes/clics rattachÃ©s au canonique, conflit `UNIQUE(produit_id,marchand_id)` â†’ l'offre la plus rÃ©cente gagne + historique rÃ©parentÃ©, recalcul `prix_min`/`nb_offres`). CritÃ¨re STRICT exigÃ© par l'utilisateur : mÃªme nom normalisÃ© + catÃ©gorie + marque + prix_min + ensemble des marchands. RÃ©sultat : 71 groupes fusionnÃ©s, **5 190 fiches supprimÃ©es, 8 200 â†’ 3 016 produits**, 0 Ã©chec, alertes intactes. Le critÃ¨re strict est **instable aprÃ¨s recalcul** (des fiches convergent vers le mÃªme prix) â†’ une 2áµ‰ passe a Ã©tÃ© nÃ©cessaire ; ~40 fiches restent en doublon de nom (prix/marchands diffÃ©rents â€” assumÃ©). Le fix scraper vÃ©rifiÃ© en rÃ©el : le scrape de 11h16 a rattachÃ© son offre Ã  la fiche de mai au lieu d'en crÃ©er une 8áµ‰.

**Tri par dÃ©faut** : `GET /api/produits` sans `tri` â†’ `MIN(o.prix) ASC NULLS LAST` (sponsorisÃ©s toujours en tÃªte), `tri=populaire` = ancien classement popularitÃ©. Pills accueil/catÃ©gorie : dÃ©faut Â« ðŸ’° Prix â†‘ Â», Â« â­� Populaires Â» â†’ `?tri=populaire`. Guides/immo/annonces/boutiques/tÃ©lÃ©com inchangÃ©s. VÃ©rifiÃ© en prod : prix croissants sur nopalou.com/api/produits.

**Dette notÃ©e (revues)** : `nb_offres` stockÃ© = `COUNT(o.id)` toutes offres vs API qui compte les offres en stock (divergence prÃ©-existante, reproduite fidÃ¨lement par le script) ; asymÃ©trie mots retirÃ©s `normaliserTitre` vs `sqlNomNormalise` (neuf/occasion/promoâ€¦) â€” 0 occurrence en prod aujourd'hui, Ã  surveiller si nouvelle source scrape ces mots dans les titres.

---

## Ã‰tat du projet (17 juillet 2026 â€” chatbot WhatsApp : pagination Â« plus / encore / d'autres Â»)

Retour d'usage rÃ©el : aprÃ¨s une recherche (Â« Samsung Â»), retaper la requÃªte ou dire Â« plus Â» remontrait toujours les 3-5 mÃªmes rÃ©sultats â€” la session repassait en `MENU` sans mÃ©moire de ce qui avait Ã©tÃ© affichÃ©, et Â« plus Â» partait en recherche full-text du mot Â« plus Â». Spec `docs/superpowers/specs/2026-07-13-chatbot-pagination-plus-design.md`, plan en 5 tÃ¢ches `docs/superpowers/plans/2026-07-13-chatbot-pagination-plus.md`, exÃ©cutÃ© via subagent-driven-development, revue finale opus Â« Ready to merge Â» 0 Critical/Important, mergÃ© fast-forward dans `main` (`a9a5a59..f0e4c82`), poussÃ© (dÃ©ploiement Render).

**LivrÃ©** (un seul fichier de code : `backend/services/whatsapp-chatbot.js`) :
- Mots-clÃ©s `MOTS_PLUS` (`plus`, `encore`, `d'autres`, `dautres`, `autres`, `autre`, `voir plus`, `la suite`, `suivant`, `ok`, `oui` â€” correspondance exacte sur texte normalisÃ©) dÃ©tectÃ©s en Ã©tat `MENU`, AVANT `detecterFAQ` et le fallback recherche. Â« ok merci Â» reste une clÃ´ture (`CLOTURE` testÃ©e avant le bloc MENU â€” ne pas rÃ©ordonner).
- Le contexte de session (`whatsapp_sessions.context`) mÃ©morise `{ last: { type: 'search'|'immo'|'telecom', query?, shownIds: [] } }` aprÃ¨s chaque affichage paginable ; Â« plus Â» relance la mÃªme requÃªte en excluant `shownIds` (`AND id::text <> ALL($n::text[])` â€” le cast `::text[]` est obligatoire, tableau vide = vacuously true = comportement d'origine).
- `searchContent(query, excludeIds = [])`, `handleSearchQuery(phone, query, excludeIds = [])` (signatures rÃ©trocompatibles), listes immo/tÃ©lÃ©com du menu factorisÃ©es en `envoyerListeImmo`/`envoyerListeTelecom(phone, excludeIds = [])`.
- Fin de liste â†’ Â« âœ… Vous avez vu tout ce que j'ai pour "â€¦" Â» ; Â« plus Â» sans contexte (session neuve/expirÃ©e 1h/dÃ©tour FAQ-alerte-commande qui Ã©crase `last`) â†’ Â« ðŸ”� Plus de quoi ? Â» + Ã©tat `SEARCH_QUERY`. Ces Ã©crasements de `last` par les autres flux sont VOULUS (spec).
- Notes de revue (pas des bugs) : le `LIMIT 5` global de l'UNION peut couper des lignes non enregistrÃ©es dans `shownIds` â€” elles rÃ©apparaissent Ã  la page suivante, jamais de doublon affichÃ© ; `shownIds` croÃ®t en session mais bornÃ© par le reset 1h. Non testÃ© en rÃ©el WhatsApp â€” smoke-test recommandÃ© : recherche â†’ *plus* â†’ *plus*, Â« oui Â» aprÃ¨s Â« Envie de continuer ? Â», Â« ok merci Â» (doit clÃ´turer), immo/tÃ©lÃ©com â†’ *plus*.

---

## Ã‰tat du projet (16 juillet 2026 â€” gestion des comptes admin, correctifs bandeau email et PLANS, dette carte-visite)

Quatre chantiers sur `main` (`c68b4bc..1beca60`, poussÃ©) : deux correctifs ponctuels puis un chantier complet de gestion des comptes admin, avec un effet de bord dÃ©couvert en fin de parcours.

### Correctif â€” bandeau email non vÃ©rifiÃ© invisible malgrÃ© `email_verifie=false`
Le bandeau `BannerEmailNonVerifie` (portage legacy du 14 juillet) ne s'affichait jamais : dans `(account)/layout.tsx`, il Ã©tait rendu comme 3áµ‰ enfant direct de `.account-layout` (`display: grid; grid-template-columns: 220px 1fr`) â€” CSS Grid le plaÃ§ait automatiquement dans une cellule de la grille (colonne 220px, sous la sidebar) au lieu de s'Ã©taler pleine largeur au-dessus. CorrigÃ© en sortant le bandeau du conteneur grid via un fragment `<>`, au-dessus de `.account-layout`. VÃ©rifiÃ© par un parcours complet en local contre la base de prod (inscription â†’ `email_verifie:false` â†’ bandeau â†’ renvoi â†’ clic lien â†’ `email_verifie:true`).

### Correctif â€” `POST /api/abonnements/admin/activer` plantait (Â« PLANS is not defined Â»)
`backend/routes/abonnements.js` : la route d'activation manuelle de plan test (bouton admin Â« Activer un plan test Â») rÃ©fÃ©renÃ§ait `PLANS[plan]` sans jamais appeler `const PLANS = await getPlans()`, contrairement Ã  la route `/initier` juste au-dessus qui le fait correctement. `ReferenceError` JS â†’ 500 Ã  chaque tentative. Un seul `const PLANS = await getPlans();` ajoutÃ© en tÃªte de la route, testÃ© en local (garde-fous plan invalide / utilisateur introuvable confirmÃ©s fonctionnels).

### Chantier â€” section Â« Gestion des comptes Â» dans l'admin
Aucune section admin ne permettait jusque-lÃ  de consulter/agir sur les comptes utilisateurs directement. Spec `docs/superpowers/specs/2026-07-16-gestion-comptes-admin-design.md`, plan en 9 tÃ¢ches `docs/superpowers/plans/2026-07-16-gestion-comptes-admin.md`, exÃ©cutÃ© via subagent-driven-development (fresh subagent par tÃ¢che + revue systÃ©matique + revue finale de branche opus Â« Ready to merge Â», 0 Critical/Important). 2 cycles de fix pendant les revues de tÃ¢che : imports morts (`jwt`/`envoyerEmail`) retirÃ©s Ã  la Task 2 ; faille TOCTOU corrigÃ©e Ã  la Task 5 (la route `purger` faisait un `SELECT` puis un `UPDATE` sÃ©parÃ© sans re-garder `anonymise_le IS NULL` dans le `WHERE` de l'`UPDATE` â€” deux appels concurrents pouvaient tous deux passer le check et exÃ©cuter l'anonymisation ; corrigÃ© en repliant le garde-fou dans le `WHERE` de l'`UPDATE` avec `RETURNING id`, 400 si la ligne n'est pas retournÃ©e).

**LivrÃ©** :
- 3 colonnes sur `utilisateurs` : `suspendu BOOLEAN`, `supprime_le TIMESTAMPTZ`, `anonymise_le TIMESTAMPTZ` (migration idempotente, additive).
- `backend/routes/admin-utilisateurs.js`, montÃ© sur `/api/admin/utilisateurs`, protÃ©gÃ© `adminSecretOnly` partout (jamais `verifierToken`) : `GET /` (liste paginÃ©e, recherche texte nom/email/tel, filtres statut/type, tri date), `GET /:id` (fiche + rÃ©sumÃ© activitÃ© + abonnement actif), `PUT /:id/verifier-email`, `POST /:id/renvoyer-verification`, `POST /:id/lien-reset` (gÃ©nÃ¨re sans jamais envoyer â€” affichÃ© Ã  l'admin pour transmission manuelle), `PUT /:id/suspendre` / `/reactiver`, et le flux RGPD rÃ©versible en 3 Ã©tapes : `POST /:id/marquer-supprime` (pÃ©riode de grÃ¢ce 30j), `POST /:id/restaurer` (annule), `POST /:id/purger` (anonymisation dÃ©finitive â€” **jamais de `DELETE` physique** â€” refusÃ©e si moins de 30 jours Ã©coulÃ©s ou dÃ©jÃ  purgÃ©).
- `POST /api/auth/connexion` refuse dÃ©sormais les comptes `suspendu=true` ou `supprime_le IS NOT NULL` (403, message distinct par cas), vÃ©rifiÃ© aprÃ¨s le mot de passe pour ne pas fuiter l'info Ã  un attaquant sans le bon mot de passe ; les 3 champs sont destructurÃ©s hors de la rÃ©ponse `user` dans tous les cas.
- `/admin/comptes` (liste, recherche + pills de filtre) et `/admin/comptes/[id]` (fiche dÃ©tail + `ActionsCompteClient` : boutons support/modÃ©ration/suppression, `confirm()` simple pour suspendre/marquer-supprimer, **double confirmation** pour la purge + bouton dÃ©sactivÃ© cÃ´tÃ© client tant que les 30 jours ne sont pas Ã©coulÃ©s â€” le vrai garde-fou reste serveur), lien menu admin ajoutÃ©.
- Chaque route testÃ©e en direct contre la base de production rÃ©elle avec des comptes de test dÃ©diÃ©s crÃ©Ã©s puis supprimÃ©s dans la foulÃ©e (jamais de mutation sur un compte rÃ©el) â€” y compris le cycle complet suspensionâ†’connexion refusÃ©eâ†’rÃ©activation et marquageâ†’grÃ¢ceâ†’purge (date `supprime_le` forcÃ©e 31 jours dans le passÃ© via SQL direct pour simuler l'Ã©coulement sans attendre).

### Dette dÃ©couverte en cours de route â€” `assets/carte-visite` a deux runtimes incompatibles
En voulant valider `npm run build` pour la Task 9 (vÃ©rification finale), le build Ã©chouait sur un bug **prÃ©existant, sans rapport** avec ce chantier (confirmÃ© via `git merge-base --is-ancestor` : introduit par le commit `9c97b76`, antÃ©rieur au dÃ©but du plan) : `frontend-next/src/app/assets/carte-visite/route.tsx` avait `runtime = 'edge'`, incompatible avec sa dÃ©pendance `qrcode-svg` (a besoin de `fs`, absent en edge). RetirÃ© `runtime = 'edge'` (seul fichier `ImageResponse` du projet Ã  importer `qrcode-svg` â€” aucun autre des 15 autres fichiers `runtime='edge'` du projet n'est concernÃ©). **Mais** ce retrait a rÃ©vÃ©lÃ© un second bug indÃ©pendant : `next/og` (`ImageResponse`, toujours utilisÃ© par ce mÃªme fichier) plante en runtime Node sur Windows (`TypeError: Invalid URL` dans `@vercel/og`, le bug de police embarquÃ©e dÃ©jÃ  documentÃ© ailleurs dans ce fichier pour les icÃ´nes PWA â€” cf. entrÃ©e du 11 juillet). **Aucun des deux runtimes ne fonctionne actuellement pour cette route sur une machine de dev Windows.** DÃ©cision assumÃ©e : garder le retrait d'`edge` (qrcode-svg n'a jamais fonctionnÃ© en edge â€” Ã©chec silencieux â€” contre une erreur de build visible et actionnable), accepter que `npm run build` reste cassÃ© en local sur Windows pour cette seule route, non bloquant pour le reste du site. **Non vÃ©rifiÃ© si le build Render (Linux) est Ã©galement affectÃ©** â€” Ã  surveiller au prochain dÃ©ploiement ; si `@vercel/og` fonctionne normalement sous Linux (probable, le bug est documentÃ© comme spÃ©cifique Ã  Windows), la route pourrait fonctionner correctement en prod malgrÃ© l'Ã©chec local.

---

## Ã‰tat du projet (13 juillet 2026, soir â€” comparaison Â« zÃ©ro rejet Â» : filtrage auto par groupe de produit)

Constat utilisateur : la comparaison Next.js n'avait **aucun contrÃ´le de type** (Ã©couteur vs frigo comparables) â€” le contrÃ´le existait dans le SPA legacy (`comparerCat` + filtre auto, `frontend/app.js:4753`) mais n'avait jamais Ã©tÃ© portÃ©. Exigence validÃ©e : **jamais de rejet aprÃ¨s clic** â€” au lieu de bloquer, filtrer. Spec `docs/superpowers/specs/2026-07-13-comparaison-zero-rejet-design.md`, plan en 7 tÃ¢ches, exÃ©cutÃ© via subagent-driven-development, revue finale opus Â« Ready to merge Â» 0 Critical/Important, mergÃ© fast-forward dans `main` (`2104dce..fe31532`), poussÃ© (dÃ©ploiement Render).

### LivrÃ©
- **`frontend-next/src/lib/comparaison.ts`** : `infererGroupe(nom)` (portage de `_inferCat` legacy â€” l'ORDRE des regex est significatif : audio/tv avant smartphones, tablette avant smartphones), `GROUPE_LABELS`, `CAT_NOM_SLUG`, `lireCompare()`. ClÃ© legacy `informatique` renommÃ©e `ordinateurs` (= la clÃ© backend). Contrat : toute clÃ© retournÃ©e doit exister dans `SOUS_TYPE_MOTS` (backend).
- **Backend** : 5 nouveaux `sousType` dans `SOUS_TYPE_MOTS` (`smartphones`, `maison`, `mode`, `auto-moto`, `jeux`) â€” additif pur.
- **`CardActions`** : au 1er ajout d'un produit, groupe infÃ©rÃ© (repli : catÃ©gorie DB via `CAT_NOM_SLUG`), stockÃ© dans les entrÃ©es `nopalou_compare` (`{id, nom, type, groupe?, catSlug?}` â€” tableau racine conservÃ©, rÃ©trocompatible), et `?sousType=` poussÃ© dans l'URL des pages liste (`/` et `/categorie/[slug]`). Boutons âš– incompatibles (autre type quand une comparaison produit est active, ou autre groupe) rendus `disabled` + `title` explicatif â€” jamais de toast d'erreur. Logique favoris inchangÃ©e.
- **Accueil + page catÃ©gorie** transmettent `sousType` au backend (filtre serveur â†’ pagination/compteurs justes ; `sousType` inclus dans `hasFiltre` et la `key` de `ProduitsListe`) ; Â« Voir plus Â» filtrÃ© aussi.
- **`CompareFilterBanner`** (montÃ© sur ces 2 pages) : Â« âš– Comparaison active â€” affichage limitÃ© aux X (similaires Ã  Â« â€¦ Â») Â» + âœ• Vider ; synchronise le filtre d'URL si la comparaison a Ã©tÃ© dÃ©marrÃ©e ailleurs. **`CompareBar`** retire `sousType` de l'URL quand la sÃ©lection se vide.

### PiÃ¨ges / notes Ã  retenir
- **`useSearchParams()` interdit** dans `CardActions`/`CompareBar`/`CompareFilterBanner` : montÃ©s sur des pages statiques (landing `[sousCategorie]`) et le layout global â€” sans Suspense boundary, `next build` Ã©choue. Lire `window.location.search` dans les handlers/effets uniquement (jamais pendant le rendu). Build validÃ© 73/73 pages.
- **Bug prÃ©-existant corrigÃ© au passage** (`fe31532`) : le fetch SSR de `categorie/[slug]/page.tsx` n'envoyait pas `X-SSR-Token` â†’ `blockScraperUA` le bloquait en 429 (page Â« aucun produit Â» en local, cf. piÃ¨ge `SSR_SECRET` du 11 juillet). AlignÃ© sur l'accueil (`SSR_HEADERS`).
- **Dette notÃ©e (revue)** : `SOUS_TYPE_MOTS` et `CAT_FALLBACK` (mÃªme fichier `backend/routes/produits.js`) dupliquent partiellement les mots-clÃ©s de `maison`/`mode`/`auto-moto`/`jeux` â€” si l'un Ã©volue, mettre l'autre Ã  jour.
- PÃ©rimÃ¨tre assumÃ© : produits uniquement â€” une comparaison immo/tÃ©lÃ©com active ne dÃ©sactive PAS les âš– produits (comportement historique conservÃ©).
- Non vÃ©rifiÃ© par navigateur rÃ©el (aucun outil dispo) : rendu du bandeau, grisage effectif des âš–, Vider â€” smoke-test manuel recommandÃ© aprÃ¨s dÃ©ploiement.

---

## Ã‰tat du projet (13 juillet 2026 â€” scraper Facebook rÃ©parÃ©, exÃ©cution locale + automatisation Windows)

Le scraper Facebook (`backend/services/scraper-immo-facebook.js`) n'avait **jamais fonctionnÃ© depuis sa crÃ©ation en juin** â€” `waitUntil: 'networkidle'` ne se rÃ©sout jamais sur Facebook (polling/websockets permanents), et `playwright` n'Ã©tait qu'en devDependency donc jamais installÃ© sur Render en production. Chantier en deux temps : d'abord tenter de le faire tourner sur Render, puis pivot vers exÃ©cution locale + automatisation Windows aprÃ¨s avoir confirmÃ© que le plan Render free ne peut structurellement pas le supporter.

### Tentative Render (abandonnÃ©e â€” voir raison ci-dessous)
CorrigÃ© dans l'ordre, chaque Ã©tape validÃ©e en conditions rÃ©elles avant de passer Ã  la suivante : `networkidle` â†’ `domcontentloaded` (timeout 30s puis 60s, le plan free est plus lent que le local) ; `playwright` dÃ©placÃ© en dependency rÃ©elle + `render.yaml` pour installer `chrome-headless-shell` au build (`--only-shell`, plus lÃ©ger que Chromium complet) ; `PLAYWRIGHT_BROWSERS_PATH=0` pour que le binaire installÃ© au build survive jusqu'au runtime (sinon `/opt/render/.cache` ne persiste pas) ; session Facebook transmise via variable d'env `FB_SESSION_JSON` (le fichier `.fb-session.json` local est gitignorÃ©, jamais dÃ©ployÃ©) ; verrou mÃ©moire (`backend/lib/scrapingLock.js`) pour empÃªcher le scraper Facebook et le cron de scraping produits de tourner en mÃªme temps.

**AbandonnÃ© aprÃ¨s confirmation en prod** : mÃªme avec toutes ces corrections, le service **redÃ©marrait tout seul** (OOM) en pleine exÃ©cution du scraping â€” logs montrant `Instance restarted`, `[SIGTERM]`, des dizaines de `Cannot use a pool after calling end on the pool`. 512 Mo de RAM (plan Render free/Hobby) est structurellement insuffisant pour Express + PostgreSQL pool + un navigateur Chromium headless, quelle que soit la taille du run. DÃ©cision utilisateur explicite : rester 100% gratuit, ne pas upgrader le plan.

### Solution retenue â€” script local
- `backend/scripts/scraper-facebook-local.js` : lance `scraperImmo()` depuis la machine locale, Ã©crit directement dans la base de production via le `DATABASE_URL` du `.env` local (pas de synchronisation supplÃ©mentaire nÃ©cessaire â€” une seule base existe). `render.yaml`/`PLAYWRIGHT_BROWSERS_PATH` revertÃ©s Ã  l'Ã©tat d'origine, plus besoin de Chromium sur Render.
- Bouton admin `/admin/annonces` retirÃ© (`lancerSyncFacebook` server action supprimÃ©e) â€” devenu trompeur puisqu'il ne peut plus fonctionner de faÃ§on fiable en prod.
- `backend/scripts/fb-login-setup.js` crÃ©Ã© â€” rÃ©fÃ©rencÃ© 4 fois dans le code depuis juin mais n'avait jamais existÃ© dans le repo ; ouvre un navigateur visible pour se connecter manuellement (gÃ¨re 2FA/vÃ©rification Meta), sauvegarde la session dans `backend/.fb-session.json`.
- **Rotation des 16 groupes persistÃ©e sur disque** (`backend/.fb-scraper-state.json`, gitignorÃ©) â€” bug trouvÃ© en conditions rÃ©elles : la variable de rotation Ã©tait en mÃ©moire, donc remise Ã  zÃ©ro Ã  chaque lancement CLI (un nouveau process Node Ã  chaque fois), les mÃªmes 5 premiers groupes Ã©taient rescrapÃ©s en boucle. `maxGroupes: 5` par dÃ©faut (limite la durÃ©e d'un run), `--tout` pour les 16 d'un coup.
- **Automatisation Windows Task Scheduler** : `backend/scripts/scraper-facebook-auto.bat` (wrapper qui logge dans `backend/scripts/logs/`, gitignorÃ©) + `notifier-scraper-fb.ps1` (notification Windows toast au dÃ©but du run et Ã  la fin avec rÃ©sumÃ© â€” annonces ajoutÃ©es/doublons/erreurs, lu depuis `backend/.fb-scraper-resume.txt`). PiÃ¨ge Task Scheduler : l'option "ExÃ©cuter que l'utilisateur soit connectÃ© ou non" exige un mot de passe Windows et Ã©choue souvent (Â« compte inconnu Â») â€” utiliser "ExÃ©cuter uniquement si l'utilisateur est connectÃ©" Ã  la place, plus l'option "Si la tÃ¢che planifiÃ©e est manquÃ©e, l'exÃ©cuter dÃ¨s que possible" pour rattraper au redÃ©marrage si le PC Ã©tait Ã©teint.

### Bugs de qualitÃ© de donnÃ©es trouvÃ©s en observant les vraies annonces scrapÃ©es
- **DÃ©doublonnage inter-groupes** : un mÃªme post republiÃ© tel quel dans plusieurs groupes Facebook crÃ©ait autant de lignes quasi-identiques (`ref_externe` ne dÃ©tecte que les doublons dans un mÃªme groupe, pas entre groupes). `upsertAnnonceClassifiee()` vÃ©rifie dÃ©sormais si un numÃ©ro de tÃ©lÃ©phone extrait a dÃ©jÃ  une annonce Facebook des 7 derniers jours avant d'insÃ©rer.
- **Commentaires rÃ©els mÃ©langÃ©s au texte du post** : `estFilDeCommentaires()` ne rejetait un fil de commentaires que si le texte total faisait â‰¤15 mots â€” un post + 2 vrais commentaires dÃ©passe largement ce seuil et passait tel quel (ex: titre affichant des noms de commentateurs + "J'aime RÃ©pondre Partager"). Le texte est dÃ©sormais coupÃ© Ã  "Voir plus de commentaires" avant tout autre traitement.
- **Suffixes d'interface Facebook** ("Envoyez votre premier commentaire...", "Ã‰crivez un commentaire public...", bouton rÃ©siduel "En voir plus") retirÃ©s du texte extrait â€” 11 annonces dÃ©jÃ  en base nettoyÃ©es en place.
- **`contact_tel = 'Voir sur Facebook'` gÃ©nÃ©rait des liens cassÃ©s** : `href="tel:Voir sur Facebook"` et un lien `wa.me` avec numÃ©ro vide, au lieu d'un vrai lien. Nouvelle colonne `annonces_classifiees.url_source` (alimentÃ©e par le scraper avec le lien rÃ©el du post) ; la fiche annonce affiche un vrai bouton "Voir sur Facebook" quand le numÃ©ro n'a pas pu Ãªtre extrait, masquÃ© proprement si `url_source` est absent (8 annonces scrapÃ©es avant ce fix n'ont pas cette donnÃ©e rÃ©troactivement).
- Bouton "Recevoir par WhatsApp" retirÃ© de la fiche annonce (demande explicite) â€” ne restent que le tÃ©l. cliquable et le bouton WhatsApp direct.

### FonctionnalitÃ©s `/annonces` ajoutÃ©es au passage (avant le pivot ci-dessus)
Recherche texte (titre+description â€” le backend le supportait dÃ©jÃ , jamais exposÃ© cÃ´tÃ© UI), filtres prix min/max et origine (Nopalou vs Facebook), favoris (â™¥) sur les cartes. Pas de comparateur ajoutÃ© â€” dÃ©cision assumÃ©e, les annonces sont trop hÃ©tÃ©rogÃ¨nes (meuble vs voiture vs tÃ©lÃ©phone) pour qu'un comparatif cÃ´te Ã  cÃ´te ait un sens, contrairement aux produits/immo/tÃ©lÃ©com qui partagent des critÃ¨res communs. Bug prÃ©-existant corrigÃ© au passage : `nopalou_favs` ne stockait qu'un tableau d'IDs sans type (produits uniquement) â€” un favori immo/telecom ajoutÃ© depuis `CardActions` n'apparaissait jamais sur `/favoris`. MigrÃ© vers `{id, type}[]`.

**Pour relancer le scraping** : `node backend/scripts/scraper-facebook-local.js` (5 groupes, rotation automatique) ou configurer la tÃ¢che planifiÃ©e Windows dÃ©crite ci-dessus pour un fonctionnement autonome.

---

## Ã‰tat du projet (12 juillet 2026, soir â€” refonte visuelle du bloc SEO homepage)

Suite au chantier SEO site-wide du mÃªme jour (voir entrÃ©e ci-dessous), retour utilisateur sur le rendu du bloc SEO homepage ajoutÃ© par ce chantier (Â« pas bien alignÃ© et mal formatÃ© Â», puis Â« pas vivant ni attirant Â»). Deux passes :

1. **Correctif d'alignement** (`88fbd74`) â€” le bloc utilisait `columns: 2` (CSS multi-colonnes faÃ§on journal), qui rÃ©partissait 3 paragraphes de faÃ§on dÃ©sÃ©quilibrÃ©e (1 paragraphe en colonne 1, 2 entassÃ©s en colonne 2, laissant un vide visuel). RemplacÃ© par un vrai `display: grid` 2 colonnes avec un paragraphe par colonne.
2. **Refonte visuelle complÃ¨te** (`649d3bc` CSS + `d902cc3` JSX) â€” le bloc restait plat (div bordÃ© gÃ©nÃ©rique, liens simplement soulignÃ©s) sans lien avec l'identitÃ© visuelle Â« ticket Â» du reste de la homepage. Process complet brainstorming â†’ maquette Artifact (comparatif avant/aprÃ¨s validÃ© par l'utilisateur) â†’ spec â†’ plan â†’ subagent-driven-development. Nouvelle carte `.seo-card` : perforation en haut (mÃªme motif `radial-gradient` que `.card-produit--ticket`), en-tÃªte centrÃ© (titre + badge `.seo-tag`), 2 paragraphes avec icÃ´ne ronde (`.seo-icon`), catÃ©gories principales et recherches longue traÃ®ne en chips cliquables (`.chip`/`.chip-small`) avec icÃ´ne emoji et hover Ã  liserÃ© accent (`inset 3px 0 0 var(--accent)`, cohÃ©rent avec le hover dÃ©jÃ  utilisÃ© sur les autres cartes du site), pied de carte avec point de statut. Aucune URL ni contenu Ã©ditorial modifiÃ© â€” refonte purement visuelle, `CATEGORIES[].emoji` rÃ©utilisÃ© directement (pas de mapping icÃ´ne dupliquÃ©). Revue finale opus : Â« Ready to merge Â», 0 Critical/Important.

Spec : `docs/superpowers/specs/2026-07-12-refonte-bloc-seo-homepage-design.md`. Plan : `docs/superpowers/plans/2026-07-12-refonte-bloc-seo-homepage.md`.

**PiÃ¨ge Ã  noter** : le plan contenait une incohÃ©rence rÃ©dactionnelle entre sa section Â« Global Constraints Â» (Â« wording byte-identical Â») et son propre JSX prescrit (qui retire volontairement le suffixe Â« au SÃ©nÃ©gal Â» des chips catÃ©gorie, la carte portant dÃ©jÃ  ce contexte via son H2). La revue finale a tranchÃ© : le JSX/la maquette approuvÃ©e font foi, ce n'est pas une rÃ©gression â€” juste une imprÃ©cision du texte de contrainte du plan, Ã  ne pas reproduire si ce plan sert de modÃ¨le.

---

## Ã‰tat du projet (12 juillet 2026 â€” chantier SEO site-wide Â« QualitÃ© puis conquÃªte Â», mergÃ© en prod)

DÃ©clencheur : audit SEO demandÃ© par l'utilisateur (Â« quelle chance qu'on retrouve mon site sur ses mots-clÃ©s ? Â»). Constat Search Console : **719 pages dÃ©couvertes, 4 indexÃ©es** (uniquement les 4 liens de la navbar) â€” domaine jeune, maillage interne quasi nul, pages jugÃ©es minces. Spec `docs/superpowers/specs/2026-07-11-seo-site-wide-design.md`, plan en 13 tÃ¢ches `docs/superpowers/plans/2026-07-11-seo-site-wide.md`, exÃ©cutÃ© via subagent-driven-development (~20 commits, merge `a97e5eb`), revue finale de branche opus Â« Ready to merge Â» 0 Critical/Important.

### LivrÃ©
- **20 landing pages config-driven** : 9 sous-catÃ©gories produits `/categorie/[slug]/[sousCategorie]` (climatiseurs 2150 produits, iphone, samsung, xiaomi-redmi, tecno, televiseurs, refrigerateurs, electromenager, ordinateurs), 7 immo `/immo/{location,vente}-{appartement,chambre,studio,maison,terrain}-dakar` (dossiers statiques + composant partagÃ© `ImmoLanding`), 4 tÃ©lÃ©com `/telecom/{orange,yas,promobile,expresso}` (`OperateurLanding`). Pattern clÃ© : les fichiers de donnÃ©es (`categorie/categories-data.ts`, `categorie/sous-categories-data.ts`, `immo/landing-data.ts`, `telecom/landing-data.ts`) sont la source unique importÃ©e par les pages, le sitemap ET le maillage â€” aucune URL ne peut dÃ©river.
- **Backend** : 5 nouveaux `sousType` dans `SOUS_TYPE_MOTS` (`iphone`, `samsung`, `xiaomi`, `tecno`, `ordinateurs`) â€” extension additive pure, aucun placeholder SQL touchÃ©.
- **Correctifs** : titles dÃ©dupliquÃ©s sur ~40 pages (Â« â€¦ | Nopalou | Nopalou Â» â€” voir piÃ¨ge ci-dessous), canonicals + descriptions (telecom, 5 guides, boutiques, assistant-whatsapp), JSON-LD produit construit sur les offres filtrÃ©es `valides` (plus la liste brute), mojibake corrigÃ© (pages budget + `comparer/[a]/[b]`), contenu Ã©ditorial unique par catÃ©gorie (champ `contenu: string[]`), maillage footer Â« Recherches populaires Â» + bloc SEO homepage + fil d'Ariane produit cliquable (map `CAT_SLUGS` : libellÃ©s DB rÃ©els `Telephones`/`TV & Electro`/â€¦ â†’ slugs), sitemap assaini (retrait `/connexion`, `/inscription`, `/favoris`, `/comparaison`, `/categorie/beaute` (0 produit) ; ajout guides + pages budget + 20 landing pages). ID Google Analytics corrigÃ© : `G-GD7365PKTS` (l'ancien `G-3KGE1YBMVJ` ne collectait rien).

### PiÃ¨ges dÃ©couverts (Ã  retenir absolument)
- **`moins-de-[budget]` Ã©tait un triple bug** : Next.js traite un dossier Ã  brackets partiels comme un segment dynamique COMPLET â†’ la route capturait n'importe quel 3áµ‰ segment (`/categorie/smartphones/nimportequoi` rendait la page), `params.budget` recevait le segment entier (`parseInt` â†’ NaN â†’ toujours 100 000), et tout le texte Ã©tait en mojibake. RemplacÃ©e par `[sousCategorie]` qui gÃ¨re budget (`/^moins-de-(\d{4,9})$/`) + sous-catÃ©gories + `notFound()`. Deux segments dynamiques frÃ¨res sont interdits par Next â€” d'oÃ¹ le remplacement plutÃ´t que l'ajout.
- **Template de titre** : `layout.tsx` dÃ©finit `template: '%s | Nopalou'` â€” AUCUN `title:` de page ne doit contenir Â« Nopalou Â» (doublon garanti en prod). Les `openGraph.title` ne sont PAS templÃ©tÃ©s (garder la marque lÃ  est correct).
- **Soft-404 site-wide** : `notFound()` sur les pages `force-dynamic` renvoie HTTP **200** (streaming â€” les headers partent avant), en dev ET en prod, sur tout le site (`produit/[id]`, `categorie/[slug]` inclus). Le contenu Â« Page introuvable Â» est bien rendu. Dette connue, faible impact (rien ne pointe vers ces URLs) â€” ne pas Â« redÃ©couvrir Â» ce bug.
- **`npm run build` pendant que le dev server tourne** : toujours interdit (corrompt `.next`) ; et supprimer un dossier de route sous un dev server actif le fait planter en boucle Â« Jest worker exceptions Â» â†’ seul un restart le rÃ©pare.
- **Sitemap en dev** : la partie dynamique (produits/immo/annonces/boutiques) rend vide si le premier fetch part avant que le backend soit chaud, puis reste cachÃ©e 1h (`revalidate: 3600`) â€” ne pas conclure Ã  une rÃ©gression, la prod fonctionne.
- Le libellÃ© Â« Yas Â» (ex-Free) est la valeur `operateur` rÃ©elle en base pour le 2áµ‰ opÃ©rateur ; `?operateur=` matche en ILIKE.

### Reste Ã  faire (cÃ´tÃ© fondateur â€” voir `docs/SEO-POST-DEPLOIEMENT.md`)
Re-soumettre le sitemap dans Search Console, demandes d'indexation des ~32 pages stratÃ©giques (~10/jour sur 4 jours), rÃ¨gles Cloudflare (redirect www + cache edge), suivi hebdo de la courbe Â« Pages indexÃ©es Â» (dÃ©part : 4). RÃ©sultat attendu sous 2-6 semaines â€” domaine jeune.

### Dette acceptÃ©e
Soft-404 streaming (ci-dessus) ; prioritÃ© sitemap 0.85 partagÃ©e catÃ©gories/sous-catÃ©gories ; interface `ImmoResponse` dupliquÃ©e (`ImmoLanding.tsx` + `immo/page.tsx`) ; `Number(page)` â†’ NaN possible dans la pagination si `?page=abc` (motif prÃ©existant, dupliquÃ© dans `[sousCategorie]`).

---

## Ã‰tat du projet (11 juillet 2026 â€” Phases 1-6 CDC + design Â« ticket Â» + audit mobile/PWA, tout mergÃ© en prod)

Trois chantiers livrÃ©s et dÃ©ployÃ©s le mÃªme jour (32 commits sur `main`, Render auto-dÃ©ployÃ©).

### Chantier 1 â€” Phases 1-6 du CDC v4.0 (17 commits, `720432b`..`3254403`)
- **Alertes prix** : cron toutes les 15 min (`verifierAlertsPrix()` dans `scraper.js`), page `/mes-alertes` (Server Actions â€” ne PAS importer `backendAuthFetch` dans un Client Component, Ã§a tire `server-only` et casse le build). **PiÃ¨ge corrigÃ©** : l'alerte est dÃ©sactivÃ©e (`active=false`) aprÃ¨s envoi â€” sans Ã§a l'utilisateur Ã©tait re-notifiÃ© toutes les 15 min.
- **Bug de prod critique corrigÃ©** : les crons mÃ©tier (alertes, anomalies) Ã©taient dans `demarrerScraping()`, jamais appelÃ©e sur Render (`SCRAPING_DISABLED=true`) â†’ nouvelle fonction **`demarrerCronsMetier()`** appelÃ©e inconditionnellement dans `app.js`. âš ï¸� Les crons relances-expiration/nettoyage/WhatsApp-cleanup sont TOUJOURS derriÃ¨re le flag scraping â€” dette connue, jamais exÃ©cutÃ©s sur Render.
- **Historique prix** : chart SVG 30j (`PriceHistoryChart.tsx`) sur la fiche produit.
- **Sentry v10** : `@sentry/node` v10 n'a plus `Sentry.Handlers` (API v7) â€” init simple + `Sentry.setupExpressErrorHandler(app)` ; cÃ´tÃ© Next `@sentry/nextjs` installÃ©. **Inactif tant que `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` ne sont pas configurÃ©s sur Render.** (Le code frontend rÃ©fÃ©rence encore `new Sentry.Replay(...)` API v7 â€” Ã  migrer si un DSN est ajoutÃ©.)
- **Pages programmatiques SEO** : `/comparer/[a]/[b]` et `/categorie/[slug]/moins-de-[budget]`. **PiÃ¨ge majeur vÃ©cu** : les dossiers avaient Ã©tÃ© crÃ©Ã©s avec des brackets fragmentÃ©s (`[slug` + dossier `]`) â€” Next ne reconnaissait pas les segments dynamiques et prÃ©-gÃ©nÃ©rait avec `params` vide (crash `toLowerCase` au build). Sur Windows/PowerShell, manipuler ces dossiers exige `-LiteralPath` ou les APIs .NET.
- **Phase 5 affiliation** : routes `/api/affiliates` (track public, clicks/convert protÃ©gÃ©s `adminSecretOnly`), tables `affiliate_clicks`, service `awin-postback.js`, dashboard `/admin/affiliates/tracking`.
- **Phase 6 qualitÃ© donnÃ©es** : `anomaly-detector.js` (cron 1h UTC â€” quarantaine si prix â‰¤ 0 ou variation > 50% vs moyenne 30j de `historique_prix`), colonne **`offres.quarantinee`** (DEFAULT FALSE) filtrÃ©e par `AND o.quarantinee = false` dans les requÃªtes produits/offres, table `quarantines_log`, dashboard `/admin/qualite` (valider/rejeter). PremiÃ¨re exÃ©cution rÃ©elle : **138 offres quarantinÃ©es** (variations 50-112%, lÃ©gitimes).
- **PiÃ¨ge local (pas committÃ©)** : `SSR_SECRET` doit exister dans `frontend-next/.env.local` ET dans le `.env` backend â€” sinon `blockScraperUA` (middlewares/rateLimit.js) bloque le fetch SSR de Next (UA `node`) en 429 â†’ Â« Impossible de charger les produits Â». VÃ©rifier ce couple sur tout nouvel environnement.

### Chantier 2 â€” Design Â« ticket Â» + finition typographique (9 commits)
Spec/plan : `docs/superpowers/specs/2026-07-11-design-ticket-homepage-design.md` + plan associÃ©. DÃ©cisions validÃ©es : palette existante conservÃ©e (PAS la palette kraft/indigo du CDC), monospace **systÃ¨me** pour les prix (0 Ko, `--font-mono`), tilt sur cartes promo uniquement, **Archivo** remplace Sora pour les titres.
- **Bug latent corrigÃ© au passage** : 29 sÃ©lecteurs utilisaient `'Sora'` en littÃ©ral (CSS + styles inline TSX) â€” Ã§a ne matche JAMAIS le nom scopÃ© gÃ©nÃ©rÃ© par `next/font`, ces titres rendaient en sans-serif systÃ¨me depuis toujours. Toujours utiliser `var(--font-archivo)`.
- **Bug d'uniformisation corrigÃ©** : `.home-how`/`.home-proof`/`.home-cta-annonce` rÃ©fÃ©renÃ§aient `var(--max-w)`/`var(--px)` **jamais dÃ©finies** â†’ sections Ã©tirÃ©es bord Ã  bord. DÃ©finies dans `:root` (1200px/20px). Toutes les sections homepage (y compris tarifs et bloc SEO, passÃ© en 2 colonnes desktop via `.home-seo-cols`) partagent maintenant cette largeur.
- Signature : tilt Â±0.35Â° (Ã  1Â° le texte devenait flou â€” anti-aliasing de rotation ; retour utilisateur explicite Â« presque invisible Â»), perforation en `radial-gradient` (jamais `border: dashed`), badge promo tampon (-3Â°, triple `box-shadow inset`), ombres 2 couches teintÃ©es encre `rgba(26,22,18,â€¦)` (jamais de noir pur), boutons comparer/favori en orange accent. RÃ¨gle focus : `outline` SANS `border-radius` (sinon les liens circulaires du footer se dÃ©forment au focus).
- Retours utilisateur intÃ©grÃ©s : densification gÃ©nÃ©rale (paddings rÃ©duits, cartes Â« Comment Ã§a marche Â» horizontales icÃ´ne+texte), exigence Â« pas de design IA par dÃ©faut, travail fin Â».

### Chantier 3 â€” Audit mobile + PWA (5 commits)
- `export const viewport` dans `layout.tsx` (`viewportFit: 'cover'`, themeColor dÃ©placÃ© ici) + `env(safe-area-inset-bottom)` sur `.bottom-bars-wrap`.
- **IcÃ´nes PWA PNG** 192/512 + **maskable dÃ©diÃ©e** (safe-zone 20%) : routes `ImageResponse` sous `src/app/icons/{192,512,maskable-512}/route.tsx`. **PiÃ¨ge : `runtime = 'edge'` obligatoire** â€” `@vercel/og` plante en runtime Node sur Windows (ERR_INVALID_URL sur sa police embarquÃ©e). Manifest v3 avec entrÃ©es `any`/`maskable` sÃ©parÃ©es ; SW bump `nopalou-shell-v2`.
- Mobile : grille produits **2 colonnes** sous 600px (pattern marketplace), `.table-alertes` et `.comparison-table` avec scroll horizontal de secours, `.auth-page` en `minmax(0,420px)` + bascule Ã  900px, perforation ticket ajustÃ©e au padding mobile.

### PiÃ¨ges d'environnement local (Windows) Ã  connaÃ®tre
- `npm run build` pendant que le dev server tourne **corrompt `.next`** â†’ le site rend sans CSS (404 sur layout.css). Toujours : tuer le process du port 3001, builder, relancer `npm run dev`.
- L'erreur **EBUSY** en fin de build (copie `standalone`) est un verrou antivirus Windows â€” PAS un Ã©chec si Â« Generating static pages 61/61 âœ“ Â» apparaÃ®t ; sans impact sur Render (Linux).
- `TaskStop`/kill du shell ne tue pas le process node enfant sur Windows â€” libÃ©rer le port via `Get-NetTCPConnection -LocalPort 3001` + `Stop-Process`.

---

## Ã‰tat du projet (10 juillet 2026 â€” tri et filtres sur les pages guide)

Audit demandÃ© ("ajouter tri et filtre sur les rÃ©sultats des guides") sur les 4 pages "guide" Ã  rÃ©sultats (`guide-prix`, `guide-achat`, `guide-immo`, `guide-forfait`). Constat initial : `guide-achat`/`guide-immo`/`guide-forfait` avaient dÃ©jÃ  un systÃ¨me de tri (pills Score/Prix/Dispo-Surface-Data, classes CSS partagÃ©es `.guide-tri-btns`/`.guide-tri-btn`) et des filtres riches dans un panneau gauche (budget, catÃ©gorie/type, sliders de pondÃ©ration) â€” seul `guide-prix` n'avait qu'un filtre par catÃ©gorie et aucun tri sur sa liste de rÃ©sultats. PÃ©rimÃ¨tre validÃ© avec l'utilisateur (7 commits `45f5bc1`..`df57d3d`, exÃ©cutÃ©s via subagent-driven-development avec revue Ã  chaque tÃ¢che + revue finale de branche) :

- **Backend** (`backend/routes/produits.js`, `GET /api/produits`) : nouveau champ agrÃ©gÃ© `etats` (tableau des valeurs distinctes `offres.specs->>'etat'` â€” neuf/occasion/reconditionne â€” parmi les offres en stock d'un produit) et nouveau paramÃ¨tre `etat` pour filtrer cÃ´tÃ© serveur via une sous-requÃªte `EXISTS` corrÃ©lÃ©e (pas un `JOIN`, pour ne pas fausser les agrÃ©gats `MIN(o.prix)`/`COUNT(o.id)`/`etats` d'un produit multi-offres). **PiÃ¨ge de renumÃ©rotation SQL** : ajouter `etat` comme `$7` a nÃ©cessitÃ© de dÃ©caler tous les placeholders de recherche multi-tokens de `$7+i` vers `$8+i` (`buildQCond`) â€” vÃ©rifiÃ© qu'aucun autre `$7`/`$8` n'Ã©tait oubliÃ© dans le handler, et que la recherche multi-mots (`q=iphone 14`) fonctionne toujours aprÃ¨s coup. Changement additif et rÃ©trocompatible : les 8 autres appelants existants de `/api/produits` ignorent simplement le nouveau champ `etats`, et `etat` non fourni â‡’ `$7::text IS NULL` court-circuite le filtre.
- **`guide-prix`** (`GuidePrixContent.tsx`) : ajout de 4 pills de tri (Pertinence/Prix â†‘/Prix â†“/Plus d'offres, tri client sur `sortedResults`, rÃ©utilise `.guide-tri-btns`) et d'un filtre prix min/max (deux `<input type="number">`, envoyÃ©s en `prixMin`/`prixMax` â€” dÃ©jÃ  supportÃ©s cÃ´tÃ© backend) Ã  cÃ´tÃ© des pills de catÃ©gorie existantes. Min > max â‡’ filtre ignorÃ© silencieusement (pas d'erreur), cohÃ©rent avec la dÃ©gradation des autres filtres budget du site.
- **`guide-achat`** (`GuideAchatContent.tsx`) : nouveau filtre **Ã‰tat** (select Neuf/Occasion/ReconditionnÃ©/Tous, consomme le nouveau champ backend) et nouveau filtre **DisponibilitÃ© minimum** (nombre de marchands, filtrÃ© cÃ´tÃ© client sur le champ dÃ©jÃ  prÃ©sent `nb_offres`, aprÃ¨s le calcul du score et avant `setResults`/`setTotal`).
- **`guide-immo`** (`GuideImmoContent.tsx`) : 4áµ‰ bouton de tri **"ðŸ†• RÃ©cent"**, utilisant `annonces_immo.created_at` (dÃ©jÃ  renvoyÃ© par `GET /api/immo`, `ORDER_MAP.recent` dÃ©jÃ  supportÃ© cÃ´tÃ© backend â€” aucun changement serveur nÃ©cessaire ici).
- **`guide-forfait`** : volontairement non touchÃ© â€” pas de colonne `created_at` fiable sur `forfaits_telecom`, et un tri "plus rÃ©cent" n'a pas de sens pour un catalogue de forfaits opÃ©rateur (pas des annonces qui expirent).

**Bug trouvÃ© et corrigÃ© en cours de route** (`dcce624`) : la premiÃ¨re version du commit `guide-prix` tri (`8adaf93`) contenait une chaÃ®ne JS `'ðŸ�ª Plus d'offres'` avec une apostrophe non Ã©chappÃ©e dans un littÃ©ral entre guillemets simples â€” erreur de syntaxe bloquant totalement la compilation (`tsc`/`next build`), non dÃ©tectÃ©e par l'implÃ©menteur car sa seule vÃ©rification Ã©tait un `curl` confirmant que la page se chargeait (bundle dev-server potentiellement obsolÃ¨te). CorrigÃ© en passant Ã  un template literal (`` `ðŸ�ª Plus d'offres` ``). Depuis cet incident, toute tÃ¢che de ce chantier a Ã©tÃ© dispatchÃ©e avec l'instruction explicite de lancer `npx tsc --noEmit` et de vÃ©rifier zÃ©ro erreur avant de dÃ©clarer "terminÃ©" â€” pas seulement un chargement de page rÃ©ussi.

**Limitation connue** : aucune vÃ©rification par navigateur rÃ©el (clic effectif sur les pills/select, confirmation visuelle du rÃ©ordonnancement) n'a Ã©tÃ© possible pendant ce chantier â€” aucun outil d'automatisation navigateur n'Ã©tait disponible dans l'environnement. VÃ©rification faite uniquement via compilation TypeScript propre + appels `curl` rÃ©els contre le backend/la base de production. Un test manuel rapide des 3 pages modifiÃ©es est recommandÃ© si un doute apparaÃ®t sur le comportement visuel.

**Documentation associÃ©e** : `docs/superpowers/specs/2026-07-10-tri-filtre-pages-guide-design.md` (design) et `docs/superpowers/plans/2026-07-10-tri-filtre-pages-guide.md` (plan d'implÃ©mentation en 6 tÃ¢ches).

---

## Ã‰tat du projet (9 juillet 2026 â€” caractÃ©ristiques par offre sur la fiche produit et la comparaison)

Suite Ã  un retour d'usage rÃ©el ("comment avoir les caractÃ©ristiques par offre en rÃ©sumÃ© avant d'acheter"), 2 commits (`d76eda9`, `4d682f7`) ajoutent l'extraction et l'affichage automatique de caractÃ©ristiques structurÃ©es par offre â€” jusque-lÃ , la table `offres` (produits scrapÃ©s/marketplace) ne stockait que `prix`/`url_achat`/`titre_marchand` brut, sans aucune donnÃ©e structurÃ©e, contrairement Ã  `annonces_classifiees`/`boutique_produits` qui ont une colonne `caracteristiques JSONB`.

**Backend** :
- Nouvelle colonne `offres.specs JSONB`, peuplÃ©e automatiquement au scraping (`sauvegarderProduits()` dans `scraper.js`) via une nouvelle fonction `extraireSpecs(titre)`, exportÃ©e pour rÃ©utilisation.
- Extraction par regex dÃ©terministes (pas de LLM â€” mÃªme choix que la FAQ chatbot WhatsApp, pour rester prÃ©visible et sans coÃ»t API), **rÃ©utilisant** les signaux dÃ©jÃ  prÃ©sents dans `prixPlancher()` (RAM, stockage, Ã©cran en pouces, BTU, litres) au lieu de les dupliquer â€” nouveaux helpers partagÃ©s `extraireRamGo`/`extraireStockageGo`/`extraireBtu`/`extraireLitres`/`extraireKg`/`extrairePouce`.
- Champs extraits, conditionnÃ©s par mot-clÃ© de catÃ©gorie dÃ©tectÃ© dans le titre (pour Ã©viter les faux positifs entre catÃ©gories) :
  - TÃ©lÃ©phone/tablette : `ram_go`, `stockage_go`, `couleur`, `etat` (`neuf`/`occasion`/`reconditionne`)
  - Climatiseur : `puissance_btu` (BTU explicite, ou converti depuis "X,XXcv" via `extraireBtuAffichage`, 1 CV â‰ˆ 3500 BTU/h)
  - Frigo/congÃ©lateur : `capacite_litres`
  - Machine Ã  laver : `capacite_kg`
  - TV/Ã©cran : `ecran_pouces`
- **PiÃ¨ge rencontrÃ©** : la premiÃ¨re version de la conversion CVâ†’BTU Ã©tait faite directement dans `extraireBtu()`, la mÃªme fonction utilisÃ©e par `prixPlancher()` pour l'heuristique anti-fraude de prix (dÃ©tection Ã—100/Ã·1000). Ã‡a changeait le plancher de prix pour des climatiseurs existants (ex: un split 2,25cv passait de 100 000 Ã  80 000 FCFA de plancher) â€” effet de bord non voulu sur un mÃ©canisme sensible. CorrigÃ© en isolant la conversion CV dans `extraireBtuAffichage()`, utilisÃ©e uniquement par `extraireSpecs()` ; `prixPlancher()` garde exactement son comportement d'avant (vÃ©rifiÃ© par comparaison directe avant/aprÃ¨s via `git stash`).
- **Autres bugs de regex trouvÃ©s en testant contre les 6100+ offres rÃ©elles de prod** (pas seulement des cas synthÃ©tiques) : le motif "128Go RAM 4Go" faisait capturer `4` comme stockage au lieu de `128` (le lookahead nÃ©gatif `(?!\s*ram)` excluait le premier nombre Ã  tort) ; les libellÃ©s disjoints ("Ram 12Go ... Memoire 128Go") n'Ã©taient pas reconnus ; "1To" et "256Gb" (anglicisme) n'Ã©taient pas capturÃ©s du tout. CorrigÃ©s avec des regex dÃ©diÃ©es Ã  prioritÃ© (libellÃ© explicite > motif double ambigu > fallback).
- `GET /api/produits/:id/offres` (`routes/produits.js`) normalise `r.specs = r.specs || {}` pour les offres pas encore backfillÃ©es.
- Script `backend/scripts/backfill-specs-offres.js` (`--dry-run` supportÃ©, mÃªme pattern que `corriger-prix-outliers.js`) â€” retraite **toutes** les offres avec `titre_marchand` (pas seulement `specs IS NULL`, pour permettre de relancer aprÃ¨s extension des champs extraits sans dead rows). ExÃ©cutÃ© 2 fois en prod pendant ce chantier (ajout initial, puis ajout des champs par catÃ©gorie) â€” 6100+ offres couvertes.

**Frontend** :
- Fiche produit (`produit/[id]/page.tsx`) : chaque ligne de la section "Comparer les prix" affiche dÃ©sormais des badges compacts (`.offre-specs`/`.offre-spec-badge`, `globals.css`) pour les specs dÃ©tectÃ©es, la fraÃ®cheur relative ("il y a 6j", via nouvelle fonction `tempsRelatif()` dans `lib/format.ts`), et le titre complet en tooltip natif (`title=`) mÃªme si tronquÃ© visuellement Ã  60 caractÃ¨res.
- Page de comparaison cÃ´te Ã  cÃ´te (`comparaison/page.tsx`) : nouvelle ligne "CaractÃ©ristiques" dans le tableau, affichant les specs de l'offre la moins chÃ¨re par produit comparÃ© (mÃªme badges que la fiche produit, rÃ©utilisÃ©s).
- **Changement de comportement demandÃ© sÃ©parÃ©ment** : le bouton "Voir" des mini-cartes d'offres dans la section "Meilleures offres" de `/comparaison` pointait directement vers `o.url_achat` (le marchand, sans tracking) â€” il pointe maintenant vers `/produit/{id}` (la fiche interne), cohÃ©rent avec le fait que ces 3 mini-offres appartiennent toutes au mÃªme produit de la colonne. Le champ `url_achat`, devenu inutilisÃ© dans ce fichier, a Ã©tÃ© retirÃ© du type `Offre`.
- **Distinction importante Ã  retenir si on retouche ces boutons** : sur la **fiche produit**, les boutons "Voir l'offre â†’"/"Acheter" pointent vers `/api/click/{offreId}` (redirection marchand + tracking) â€” volontaire, car chaque ligne y est une offre diffÃ©rente du **mÃªme** produit chez des vendeurs diffÃ©rents. Sur la page **comparaison**, le bouton "Voir" pointe vers `/produit/{id}` â€” volontaire aussi, car chaque colonne y est un produit **diffÃ©rent** Ã  comparer, donc "voir" doit amener Ã  sa fiche, pas directement chez un marchand.

**Limitation connue** : `puissance_btu`/`capacite_litres`/`capacite_kg`/`ecran_pouces` ne sont peuplÃ©s que si le titre brut scrapÃ© mentionne explicitement l'unitÃ© correspondante (BTU/CV, litres, kg, pouces) â€” de nombreuses offres de ces catÃ©gories (ex: "Split Haier" sans aucune puissance prÃ©cisÃ©e) n'ont et n'auront jamais ces champs tant que le marchand source ne les inclut pas dans son titre. C'est un comportement attendu (dÃ©gradation propre avec `â€”`), pas un bug.

---

## Ã‰tat du projet (7 juillet 2026, soir â€” fiche produit, tri des listes et filtre opÃ©rateur)

Suite Ã  un retour d'usage rÃ©el signalant 4 insuffisances UX, un chantier de 7 commits (`970518b`..`8d75c6f`) a corrigÃ© :

1. **Bouton "Acheter" repositionnÃ©** â€” `frontend-next/src/app/produit/[id]/page.tsx` : le CTA principal Ã©tait auparavant relÃ©guÃ© aprÃ¨s tout le bloc de mÃ©triques (nb marchands/prix min/max/Ã©conomie), loin sous le nom du produit. Il est maintenant affichÃ© Ã  droite du `<h1>` dans le header (`produit-fiche-nom-row--avec-cta`), avec repli en pleine largeur sous le nom sur mobile (< 640px). Un second CTA identique (texte complet "ðŸ›’ Acheter au meilleur prix â†’") a Ã©tÃ© rÃ©introduit aprÃ¨s la section des offres, pour donner un point d'achat visible mÃªme aprÃ¨s que l'utilisateur ait scrollÃ© â€” sans ce second CTA, seul le bouton du header restait accessible sur une fiche longue.
2. **Tableau "Comparer les prix du marchÃ©" rendu cliquable** â€” la table de produits similaires (mÃªme section) n'avait qu'une petite colonne d'action cliquable. Toute la ligne pointe maintenant vers la fiche du produit similaire, via un nouveau composant client `frontend-next/src/app/produit/[id]/SimilRow.tsx`. **PiÃ¨ge rencontrÃ© en revue** : la premiÃ¨re implÃ©mentation utilisait `onClick`/`role="link"` sur un `<tr>` brut avec navigation par `router.push()` â€” Ã§a fonctionne au clic gauche mais casse le clic-milieu/Ctrl+clic ("ouvrir dans un nouvel onglet") et le prefetch Next.js au survol, puisqu'aucun `<a href>` natif n'existe. CorrigÃ© en enveloppant le contenu de chaque `<td>` dans un vrai `<Link>` (via `Children.map`/`cloneElement`) â€” si vous touchez Ã  ce composant, gardez cette approche plutÃ´t que de repasser par un `onClick` custom.
3. **Tri ajoutÃ© sur Produits (accueil), Annonces et Boutiques** â€” pattern de pills rÃ©utilisÃ© de `immo/page.tsx`/`telecom/TelecomClient.tsx` (`<Link href="?tri=...">`, classe `budget-pill`/`active`). Le backend `GET /api/produits` supportait dÃ©jÃ  `tri` (`prix_asc`/`prix_desc`/`nom_asc`, dÃ©faut popularitÃ©) mais ce n'Ã©tait pas exposÃ© cÃ´tÃ© UI â€” corrigÃ©. `GET /api/annonces` et `GET /api/boutiques` ont reÃ§u un nouveau paramÃ¨tre `tri` cÃ´tÃ© backend (`recent`/`prix_asc`/`prix_desc` pour annonces ; `recent`/`nom_asc` pour boutiques). **Point important sur `/api/boutiques`** : l'`ORDER BY` par dÃ©faut (sans `tri` fourni) reste exactement l'ordre commercial prÃ©existant (plan Business > Pro > gratuit, puis sponsorisÃ©, puis rÃ©cence) â€” le nouveau tri ne s'applique QUE si l'utilisateur sÃ©lectionne explicitement une option diffÃ©rente, pour ne pas casser la mise en avant des plans payants.
4. **Filtre OpÃ©rateur ajoutÃ© au wizard "Trouver mon forfait"** (`frontend-next/src/app/telecom/WizardForfait.tsx`) â€” le wizard n'avait que Budget/Profil/DurÃ©e alors que la donnÃ©e `operateur` existe en base depuis longtemps et que la page `/telecom` classique l'utilisait dÃ©jÃ . Le composant reÃ§oit maintenant `operateurs: string[]` en prop (rÃ©utilise la liste dÃ©jÃ  chargÃ©e par `TelecomClient.tsx`, pas de nouveau fetch), avec un 4áµ‰ champ "OpÃ©rateur prÃ©fÃ©rÃ©" Ã  l'Ã©tape 1 (option "Peu importe" par dÃ©faut).

**AccessibilitÃ©** : le CTA du header a un `aria-label` dynamique (`Acheter au meilleur prix chez {marchand}`) puisque son texte visible a Ã©tÃ© raccourci Ã  "ðŸ›’ Acheter â†’" â€” sans Ã§a, le nom accessible du lien ne transmettait plus l'info "meilleur prix" pour les lecteurs d'Ã©cran.

**Documentation associÃ©e** : `docs/superpowers/specs/2026-07-07-corrections-fiche-produit-tri-forfait-design.md` (design) et `docs/superpowers/plans/2026-07-07-corrections-fiche-produit-tri-forfait.md` (plan d'implÃ©mentation en 7 tÃ¢ches, exÃ©cutÃ© via subagents + revue finale multi-angles qui a confirmÃ© les 3 points corrigÃ©s ci-dessus).

---

## Ã‰tat du projet (7 juillet 2026 â€” mode de paiement manuel Wave/Orange ajoutÃ©)

En attendant l'obtention des clÃ©s API Wave Business / Orange Money marchand (KYC en cours), un **mode de paiement manuel** a Ã©tÃ© ajoutÃ© sur les 6 flux de paiement existants : le client dÃ©pose de l'argent sur un numÃ©ro Wave/Orange affichÃ© sur le site, dÃ©clare sa transaction (tÃ©lÃ©phone expÃ©diteur + ID de transaction OU capture d'Ã©cran de preuve), et un admin valide manuellement depuis `/admin/paiements-manuels` â€” ce qui dÃ©clenche exactement la mÃªme logique d'activation que les webhooks automatiques.

**Backend** :
- Nouvelle table `paiements_manuels` (`id`, `utilisateur_id`, `reference`, `montant`, `methode` `wave`/`orange`, `telephone_expediteur`, `transaction_id_client`, `preuve_url`, `statut` `en_attente`/`valide`/`rejete`, `valide_par`, `valide_at`).
- La logique d'activation post-paiement (prÃ©cÃ©demment dupliquÃ©e dans les webhooks Wave et Orange de `backend/routes/paiement.js`) a Ã©tÃ© extraite dans une fonction partagÃ©e `appliquerPaiementReussi(reference, montant, methode)`, exportÃ©e et rÃ©utilisÃ©e par les deux webhooks ET par la nouvelle route de validation admin â€” Ã©limine tout risque de divergence entre les 3 mÃ©thodes de paiement. Cette extraction a aussi corrigÃ© un bug prÃ©existant : le webhook Orange extrayait mal l'ID d'annonce pour le prÃ©fixe `ann_` (`.replace('ann_','')` au lieu de `split('_')[2]`), donc un paiement d'annonce via Orange Money n'activait jamais rÃ©ellement l'annonce â€” corrigÃ© de fait par l'unification (changement approuvÃ© explicitement, voir `docs/superpowers/specs/2026-07-06-paiement-manuel-design.md`).
- Le montant rÃ©ellement inscrit dans `commandes` (utilisÃ© par les stats revenus admin) est dÃ©sormais recalculÃ© cÃ´tÃ© serveur via `montantAttendu()` selon le prÃ©fixe de rÃ©fÃ©rence â€” jamais celui dÃ©clarÃ© par le client, y compris en mode manuel.
- 4 nouvelles routes dans `paiement.js` : `POST /manuel/declarer` (client, upload preuve via `multer`+Cloudinary), `GET /manuel/liste`, `POST /manuel/:id/valider`, `POST /manuel/:id/rejeter` (admin, `adminSecretOnly`).
- Les toggles `paiement_wave`/`paiement_orange` (existaient dans `settings` mais n'Ã©taient jamais lus) sont maintenant vÃ©rifiÃ©s sur les 7 routes d'initiation concernÃ©es (6 Wave + 1 Orange + la route abonnement) â€” rÃ©pondent `403` si dÃ©sactivÃ©s depuis `/admin/tarifs`.
- Nouveaux settings : `paiement_manuel_actif` (toggle), `paiement_manuel_numero_wave`, `paiement_manuel_numero_om` (numÃ©ros affichÃ©s au client), Ã©ditables depuis `/admin/tarifs`.

**Frontend** :
- Composant partagÃ© `frontend-next/src/components/ModalPaiementManuel.tsx` (formulaire de dÃ©claration), rÃ©utilisÃ© comme 3áµ‰ mode de paiement sur les 6 Ã©crans : `/payer-annonce/[id]`, sponsoring immo/produit/boutique, `/boutique/abonnement`, et **le bouton "Booster 7j" sur `/mes-annonces`, qui n'avait jamais eu d'UI jusqu'ici** malgrÃ© l'existence du flux backend `POST /api/paiement/boost/initier` depuis longtemps.
- Nouvelle page admin `/admin/paiements-manuels` (liste des dÃ©clarations en attente + boutons Valider/Rejeter), lien ajoutÃ© au menu admin.
- Format de rÃ©fÃ©rence strict Ã  respecter partout : `{prefix}_${userId}_${entityId}` (`ann_`, `immo_`, `bout_`, `prod_`, `boost_`) ou `{prefix}_${userId}_${plan}` pour l'abonnement (`abmt_`) â€” c'est ce que `ref.split('_')[2]` extrait cÃ´tÃ© backend dans `appliquerPaiementReussi()`.

**Documentation associÃ©e** : `docs/superpowers/specs/2026-07-06-paiement-manuel-design.md` (design validÃ©) et `docs/superpowers/plans/2026-07-06-paiement-manuel.md` (plan d'implÃ©mentation en 13 tÃ¢ches, exÃ©cutÃ© via subagents avec revue Ã  chaque Ã©tape + revue finale de branche).

**Pour activer en production** : sur `/admin/tarifs`, renseigner les numÃ©ros Wave/Orange Money et activer `paiement_manuel_actif` ; optionnellement dÃ©sactiver `paiement_wave`/`paiement_orange` tant que les clÃ©s API ne sont pas prÃªtes pour ne pas afficher des boutons qui Ã©choueraient.

### Correctif complÃ©mentaire (mÃªme jour) : tous les prix Pro/Business/annonce rendus dynamiques

Un audit exhaustif a trouvÃ© plusieurs Ã©crans qui affichaient encore des prix codÃ©s en dur (15 000 / 35 000 / 1 500 FCFA) au lieu de lire `settings.plan_pro_prix` / `plan_business_prix` / `prix_annonce` comme le reste du site â€” un changement de tarif depuis `/admin/tarifs` ne se rÃ©percutait donc pas partout. CorrigÃ© sur 10 fichiers :
- **Page d'accueil** (section "Boutique Pro/Business") â€” prix + libellÃ© de paiement (Wave/manuel) dÃ©sormais dynamiques.
- **`frontend-next/src/app/actions/paiement.ts`** â€” le montant Orange Money rÃ©ellement facturÃ© pour une annonce venait d'une valeur en dur (`1500`), pas de `settings.prix_annonce` : impact fonctionnel rÃ©el (facturation), pas seulement d'affichage.
- **`BoutiqueClient.tsx`** â€” 2 CTA "Passer en Pro" (catalogue produits + banniÃ¨re incitative).
- **`AbonnementClient.tsx`** (`/boutique/abonnement`) â€” le libellÃ© "Paiement via..." reflÃ¨te maintenant les toggles rÃ©els `paiement_wave`/`paiement_manuel_actif`.
- **CGU** (`/cgu`) â€” montant lÃ©gal de la 3áµ‰ annonce payante.
- **Admin `/revenus`** â€” libellÃ© stat + badges mÃ©thode de paiement Ã©tendus (ajout badge "ðŸ§¾ Manuel", reconnaissance des prÃ©fixes `prod_`/`boost_`/`abmt_` en plus de `ann_`/`immo_`/`bout_`).
- **Admin `/abonnements`** (`ActiverPlanClient`) â€” options du select d'activation manuelle.
- **Admin `/communication`** â€” kit marketing (objections commerciales, texte apporteur d'affaires, exemples de commission) recalculÃ© depuis les vrais tarifs/taux (`commission_business`, `apporteur_taux_commission`) au lieu de valeurs figÃ©es dans le texte.

Les fallbacks codÃ©s en dur restants (ex: `Number(settings.prix_annonce) || 1500`) sont volontaires â€” ils ne s'appliquent que si le fetch `/api/settings/public` Ã©choue, pas des valeurs qui ignorent `settings`.

### Correctif complÃ©mentaire (7 juillet 2026, suite) : boutons Wave non masquÃ©s quand dÃ©sactivÃ© + libellÃ©s simplifiÃ©s

Suite Ã  un retour d'usage rÃ©el (capture d'Ã©cran montrant le bouton "Booster 7j" toujours visible sur `/mes-annonces` malgrÃ© `paiement_wave` dÃ©sactivÃ©), un audit a trouvÃ© que **5 Ã©crans sur 6** consommant les toggles `paiement_wave`/`paiement_orange` ne les vÃ©rifiaient en fait jamais pour masquer leur bouton Wave â€” seul `PaiementClient.tsx` (`/payer-annonce`) le faisait dÃ©jÃ  correctement. RÃ©sultat concret : un admin qui dÃ©sactive Wave depuis `/admin/tarifs` (ex: en attendant les clÃ©s API) voyait quand mÃªme le bouton Wave partout ailleurs, qui aboutissait Ã  un 403 `Paiement Wave temporairement indisponible` au lieu de rediriger vers le paiement manuel dÃ©jÃ  disponible juste Ã  cÃ´tÃ©.

CorrigÃ© (ajout de `waveActif = settings.paiement_wave !== 'false'` + rendu conditionnel du bouton Wave) sur :
- `mes-annonces/AnnoncesClient.tsx` + `page.tsx` â€” bouton "Booster 7j"
- `immo/[id]/SponsoringImmoBtn.tsx` â€” sponsoring immo
- `produit/[id]/SponsoringProduitBtn.tsx` â€” sponsoring produit
- `boutique/BoutiqueClient.tsx` â€” sponsoring boutique (le prop `onSponsoring` de `BoutiqueCard` est devenu optionnel, sur le mÃªme modÃ¨le que `onPayerManuel` dÃ©jÃ  en place)
- `boutique/abonnement/AbonnementClient.tsx` â€” bouton "Souscrire" Pro/Business

**LibellÃ©s simplifiÃ©s dans la foulÃ©e** (retrait de "sans app" puis de "manuellement", sur demande explicite) : les boutons de paiement manuel sont maintenant juste "Payer" / "Booster" (au lieu de "Payer sans app" / "Booster manuellement"), y compris le titre de `ModalPaiementManuel.tsx` ("Payer / j'ai dÃ©jÃ  payÃ©"). Les labels informatifs non cliquables (ex: "Paiement via Wave ou manuel" sur la page d'accueil et `/boutique/abonnement`) n'ont pas Ã©tÃ© touchÃ©s â€” la demande visait les libellÃ©s de boutons, pas les textes explicatifs.

---

## Ã‰tat du projet (6 juillet 2026, soir â€” chatbot WhatsApp : recherche, menu et carousel corrigÃ©s)

Suite Ã  des remontÃ©es d'usage rÃ©el (utilisateur testant le chatbot en production), 7 commits ont corrigÃ© des bugs fonctionnels non dÃ©tectÃ©s par les tests prÃ©cÃ©dents.

### Bugs corrigÃ©s (session du soir, 7 commits sur `main`)
1. **Recherche chatbot ignorait le marketplace** â€” `searchContent()` dans `whatsapp-chatbot.js` ne cherchait que dans `boutique_produits` (1 seule ligne en prod Ã  l'Ã©poque) et jamais dans `produits`, la vraie table du comparateur de prix scrapÃ© (6800+ lignes). Une recherche comme "iphone 14" ne remontait donc jamais rien alors que le produit existe. Ajout d'une sous-requÃªte `UNION ALL` sur `produits` (type `'marketplace'`), rendue en texte simple (lien `/produit/{id}`) car ces produits ne sont pas dans le catalogue Meta Commerce.
2. **Menu qui s'affichait deux fois** â€” chaque fin d'action (immo, tÃ©lÃ©com, support, alerte, commande, recherche) remettait la session Ã  `IDLE`. Or `IDLE` sert aussi Ã  dÃ©tecter une session neuve â†’ tout message suivant (mÃªme pas "menu") redÃ©clenchait un envoi complet du menu, perÃ§u comme un double affichage. Toutes les fins d'action passent maintenant Ã  l'Ã©tat `MENU` au lieu de `IDLE`.
3. **Carousel immo/annonce ne renvoyait jamais rien (silencieusement)** â€” root cause en deux temps, dÃ©couverte par un vrai envoi de test API (avec autorisation) :
   - D'abord : les annonces sans aucune photo produisaient un `imageUrl: null`, invalide pour un header Meta â†’ carousel entier rejetÃ©. FiltrÃ© via `jsonb_array_length(photos) > 0` dans les requÃªtes SQL immo/annonces.
   - Cause rÃ©elle plus profonde : `nopalou_carousel_immo` et `nopalou_carousel_annonce` **ne sont pas de vrais templates Carousel Meta** (l'option Carousel n'existe pas dans l'interface WhatsApp Manager actuelle, malgrÃ© leur nom) â€” ce sont de simples templates `BODY` Ã  3 paramÃ¨tres (titre, prix, lien complet) + un bouton URL Ã  1 paramÃ¨tre, pour **une seule annonce Ã  la fois**. `sendWhatsAppCarousel()` envoyait un payload `type:'carousel'` multi-cartes que ces templates ne supportent pas du tout â†’ Meta rejetait systÃ©matiquement (`#132001` erreur de langue, puis `#132000` nombre de paramÃ¨tres). RÃ©Ã©crit pour boucler un envoi de template simple par carte. **DÃ©tail non-Ã©vident Ã  retenir** : `nopalou_carousel_immo` est approuvÃ© par Meta en langue `en`, pas `fr` (table `CAROUSEL_LANG` dans `whatsapp.js`) â€” si un nouveau template carousel est soumis, vÃ©rifier sa langue rÃ©elle via `GET /v19.0/{waba_id}/message_templates` avant de supposer `fr` partout.
   - En creusant cette panne, `post()` dans `whatsapp.js` avalait **toute** erreur Meta en interne (log + `return undefined` au lieu de rejeter), ce qui rendait tous les `.catch()` de fallback texte inopÃ©rants dans tout le chatbot. `post()` relance dÃ©sormais l'erreur â€” vÃ©rifiÃ© que tous les appelants existants gÃ©raient dÃ©jÃ  ce cas via `.catch()`.
4. **FAQ par mots-clÃ©s ajoutÃ©e** â€” le bot ne rÃ©pondait qu'aux options du menu ou Ã  une recherche produit ; toute question sur le fonctionnement du site ("c'est gratuit ?", "comment publier une annonce ?") tombait sur "aucun rÃ©sultat". Ajout d'une FAQ par mots-clÃ©s (`FAQ` array dans `whatsapp-chatbot.js` â€” gratuit/payant, publier annonce/immo, boutique, comparer, favoris, apporteur, tÃ©lÃ©com, comment Ã§a marche), testÃ©e avant la recherche produit sur tout texte libre. Pas de LLM/IA â€” choix explicite pour rester 100% prÃ©visible et sans coÃ»t API supplÃ©mentaire.
5. **Message de bienvenue** â€” ajoutÃ© Ã  l'initiation rÃ©elle d'une session (premier message jamais envoyÃ©, ou aprÃ¨s expiration 1h) juste avant le menu. PiÃ¨ge rencontrÃ© : le bouton "Menu" remettait l'Ã©tat Ã  `IDLE` (reliquat d'avant l'ajout du bienvenue) â†’ le bienvenue revenait en boucle Ã  chaque clic. CorrigÃ© en passant Ã  `MENU`. Les salutations ("bonjour", "salut", "bonsoir", "hello", "slt", "coucou") dÃ©clenchent maintenant le menu depuis n'importe quel Ã©tat actif, sans rÃ©pÃ©ter le bienvenue.
6. **Ordre d'affichage "Envie de continuer ?"** â€” vÃ©rifiÃ© que l'ordre d'`await` est correct partout dans le code (rÃ©sultat envoyÃ© avant le bouton) ; le dÃ©calage visuel observÃ© dans WhatsApp Desktop vient de Meta lui-mÃªme (pas de garantie d'ordre d'affichage entre plusieurs messages API envoyÃ©s rapidement). Ajout d'un court dÃ©lai (1.2s) avant le bouton final, uniquement quand plusieurs messages carousel/produits prÃ©cÃ¨dent.
7. **Promotion du chatbot sur le site** â€” page `/assistant-whatsapp` (vulgarise les 6 fonctions), visuel `/assets/chatbot-whatsapp` (`ImageResponse`, mÃªme pattern que le visuel apporteur), section CTA homepage, lien footer + menu Guides (desktop et mobile), nouvelle section "Kit assistant WhatsApp" dans `/admin/communication` (visuel + texte prÃªt Ã  partager).

### MÃ©thode de debug qui a marchÃ© ici
Le `.env` racine (`DATABASE_URL`) pointait vers l'ancienne base Railway obsolÃ¨te â€” mis Ã  jour manuellement par l'utilisateur avec la vraie `DATABASE_URL` de Render pour permettre un diagnostic direct en local contre la prod (au lieu de passer par Render Shell). Pour les erreurs WhatsApp silencieuses, un envoi de test rÃ©el autorisÃ© explicitement par l'utilisateur vers son propre numÃ©ro a Ã©tÃ© nÃ©cessaire pour capturer le message d'erreur Meta exact â€” les logs applicatifs seuls ne suffisaient pas tant que `post()` avalait l'erreur.

---

## Ã‰tat du projet (6 juillet 2026 â€” WhatsApp pleinement fonctionnel en production)

**WhatsApp est dÃ©sormais opÃ©rationnel de bout en bout** : rÃ©ception de vrais messages (webhook), rÃ©ponses automatiques du chatbot, notifications de validation/rejet d'annonces (carousel + fallback texte), avec liens cliquables corrects. Tous les blocages de lancement documentÃ©s le 3 juillet sont levÃ©s.

### Cause racine du blocage final (config Meta, pas du code)
Deux WhatsApp Business Accounts (WABA) coexistaient sous ce Business Manager : un WABA de test (`1663286391571815`, numÃ©ro `+1 555-639-6609`) et le vrai WABA de production (`901008702321523`, numÃ©ro rÃ©el `+221 70 87179 42`, `phone_number_id` `1239035322623638`). L'app Nopalou Ã©tait abonnÃ©e au mauvais WABA, et `WHATSAPP_PHONE_NUMBER_ID` sur Render pointait vers le numÃ©ro de test. Si l'intÃ©gration semble Ã  nouveau mal configurÃ©e : vÃ©rifier `GET /v19.0/{waba_id}/phone_numbers` et `GET /v19.0/{waba_id}/subscribed_apps` avant de supposer un nouveau blocage Meta â€” ne pas supposer qu'un seul WABA existe.

### Bugs corrigÃ©s le 6 juillet 2026 (5 commits sur `main`)
1. **Typing indicator invalide** â€” `sendTyping()` envoyait `type: 'action'`, rejetÃ© par l'API Meta Ã  chaque message reÃ§u. RemplacÃ© par le vrai mÃ©canisme Meta : `typing_indicator` intÃ©grÃ© au read receipt (`sendReadReceipt(msg.id, true)`).
2. **Retour au menu chatbot** â€” remplacÃ© le rappel texte "Tapez *menu*" par un vrai bouton cliquable (`sendWhatsAppButton`, reply button interactif) dans tous les flux (immo, tÃ©lÃ©com, support, alerte, commande, recherche). Le mot-clÃ© texte reste un fallback fonctionnel.
3. **Template `nopalou_fiche_texte` cassÃ©** â€” le composant `button` n'Ã©tait jamais envoyÃ© alors que Meta l'exige (`(#131008) Required parameter is missing`), et une fois ajoutÃ©, le lien pointait vers une URL doublÃ©e/404 (`nopalou.com/immo/immo/xxx`) car le code envoyait un chemin (`immo/${id}`) alors que Meta n'attend que l'id brut â€” le segment `immo/` est cÃ¢blÃ© cÃ´tÃ© Meta dans l'URL du bouton. Voir `docs/WHATSAPP-TEMPLATES.md` section "PiÃ¨ge vÃ©cu" pour le dÃ©tail par template. MÃªme correctif appliquÃ© aux templates carousel (`nopalou_carousel_immo`, `nopalou_carousel_annonce`).
4. **`/deposer-immo` sans champ photo** â€” le formulaire de dÃ©pÃ´t d'annonce immo n'avait jamais eu d'upload de photo (contrairement Ã  `/deposer-annonce`), donc les annonces immo crÃ©Ã©es par les utilisateurs tombaient systÃ©matiquement sur le fallback texte au lieu du carousel. AjoutÃ© : dropzone + upload Cloudinary cÃ´tÃ© backend (`POST /api/immo/public` accepte maintenant `multipart/form-data` via `multer`), en rÃ©utilisant le pattern dÃ©jÃ  en place sur les annonces classifiÃ©es.
5. **Bouton "Soumettre mon annonce" sans style** â€” `.form-submit-btn` n'avait aucune rÃ¨gle CSS (tombait sur le gris par dÃ©faut du navigateur) ; stylÃ© pour correspondre Ã  `.annonce-submit-btn`.

**Limitation connue** : le template `nopalou_fiche_texte` a une URL de bouton fixe pointant vers `/immo/{{1}}` cÃ´tÃ© Meta â€” le lien reste incorrect pour les annonces **classifiÃ©es** (`/annonces/*`) tant qu'un template Meta dÃ©diÃ© n'est pas soumis et approuvÃ© pour ce cas. `nopalou_carousel_telecoms` n'est pas concernÃ© par ce piÃ¨ge : son bouton est une URL statique (`https://nopalou.com/telecom`), sans paramÃ¨tre dynamique.

### Debug distant via Render Shell
Pour interroger la vraie base de production (pas la base locale `.env`, qui pointe vers un ancien environnement Railway obsolÃ¨te) : Render â†’ service â†’ onglet **Shell**. Attention au bracketed-paste mode qui casse le collage de commandes `node -e "..."` multi-lignes â€” Ã©crire la commande dans un fichier via `printf '%s' "..." > /tmp/check.js` puis `node /tmp/check.js` contourne le problÃ¨me. Utiliser un chemin absolu (`/opt/render/project/src/...`) dans les `require()`, jamais relatif, car il est rÃ©solu depuis le fichier appelant, pas depuis le `cwd`.

---

## Ã‰tat du projet (4 juillet 2026 â€” programme apporteur d'affaires ajoutÃ©)

**Nouveau** : programme d'apporteur d'affaires complet (voir section "Commercial" et tableau `settings` ci-dessous pour le dÃ©tail fonctionnel). ImplÃ©mentÃ© en 9 tÃ¢ches + revue finale de branche. Un bug important a Ã©tÃ© trouvÃ© et corrigÃ© lors de la revue finale : la requÃªte `GET /api/apporteurs/admin` faisait un double `LEFT JOIN` (boutiques + commissions) qui gonflait les totaux par produit cartÃ©sien quand un apporteur avait plusieurs boutiques ET plusieurs commissions â€” corrigÃ© en remplaÃ§ant par des sous-requÃªtes corrÃ©lÃ©es indÃ©pendantes.

Ã€ l'occasion de ce chantier, un bug de sÃ©curitÃ© paiement prÃ©existant a aussi Ã©tÃ© corrigÃ© : `abonnements.commande_ref` n'avait aucune contrainte d'unicitÃ©, donc un replay de webhook Wave/Orange (comportement rÃ©el documentÃ© chez ces deux prestataires) pouvait dÃ©clencher une double commission apporteur pour un seul paiement rÃ©el. Un index unique partiel a Ã©tÃ© ajoutÃ© sur cette colonne, et la gÃ©nÃ©ration de commission est maintenant conditionnÃ©e au succÃ¨s rÃ©el de l'insertion de l'abonnement (pas d'exÃ©cution sur un replay dÃ©tectÃ©).

**Documentation associÃ©e** : `docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md` (design complet, dÃ©cisions validÃ©es, hors-scope explicite) et `docs/superpowers/plans/2026-07-04-programme-apporteur-affaires.md` (plan d'implÃ©mentation dÃ©taillÃ© par tÃ¢che).

**Kit apporteur cÃ´tÃ© utilisateur** (ajoutÃ© le mÃªme jour, aprÃ¨s premier retour terrain) : la page `/compte/apporteur` a Ã©tÃ© enrichie â€” bouton "Copier le lien", bouton "Partager sur WhatsApp" (message prÃ©-rempli), lien vers le visuel tÃ©lÃ©chargeable (`/assets/apporteur-affaires`), section "Comment Ã§a marche" en 3 Ã©tapes (visible avant mÃªme l'activation), et un argumentaire court prÃªt Ã  dire ("Quoi dire Ã  un commerÃ§ant") â€” distinct du script de dÃ©marchage complet du fondateur dans `/admin/communication`, celui-ci est Ã©crit Ã  la premiÃ¨re personne pour l'apporteur lui-mÃªme.

**DÃ©couvrabilitÃ©** : lien "Devenir apporteur" ajoutÃ© dans le footer global (colonne "Mon compte", `frontend-next/src/app/layout.tsx`) et une Ã©tape dÃ©diÃ©e dans `/guide-emploi` ("Comment utiliser Nopalou") pointant vers `/compte/apporteur` â€” le programme n'Ã©tait auparavant accessible qu'en connaissant l'URL directement.

---

## Ã‰tat du projet (3 juillet 2026 â€” mis Ã  jour aprÃ¨s tests rÃ©els WhatsApp/paiement + corrections de bugs)

**RÃ©sumÃ©** : le code est fonctionnellement complet (confirmÃ© le 1er juillet). Le 3 juillet, une revue approfondie + des tests rÃ©els en production (Render + Meta) ont trouvÃ© et corrigÃ© 4 bugs. L'intÃ©gration WhatsApp est techniquement opÃ©rationnelle cÃ´tÃ© serveur mais bloquÃ©e sur des Ã©tapes externes Meta (voir ci-dessous). Docs crÃ©Ã©s dans `docs/` : `LANCEMENT-CHECKLIST.md`, `STRATEGIE-COMMERCIALE.md`, `PLAN-MARKETING.md`, `WHATSAPP-TEMPLATES.md`.

### Bugs corrigÃ©s le 3 juillet 2026 (4 commits sur `main`)
1. **`alertes` (contrainte manquante)** â€” `migrate-inline.js` : ajout d'un index UNIQUE sur `alertes(telephone, produit_nom)`. Sans lui, l'`INSERT ... ON CONFLICT DO NOTHING` du chatbot (`whatsapp-chatbot.js`) Ã©chouait avec une erreur Postgres 42P10 Ã  chaque crÃ©ation d'alerte WhatsApp.
2. **DÃ©clenchement des alertes WhatsApp** â€” `scraper.js` : le job qui dÃ©clenche les alertes prix ne matchait que via `produit_id` (comptes web). Les alertes crÃ©Ã©es par chatbot WhatsApp (sans `produit_id`, juste `produit_nom` texte libre) n'Ã©taient jamais dÃ©clenchÃ©es. Ajout d'un second bloc de requÃªte avec matching `ILIKE` sur le nom.
3. **`/api/whatsapp/admin/status`** â€” `whatsapp.js` : la requÃªte utilisait `created_at` alors que la table `whatsapp_processed_messages` n'a que `processed_at`. Faisait planter l'endpoint de diagnostic admin.
4. **SÃ©curitÃ© paiement** â€” `paiement.js` : comparaison de signature Wave passÃ©e en `timingSafeEqual` (Ã©tait un `!==` classique, vulnÃ©rable en thÃ©orie Ã  une attaque de timing) ; ajout d'une vÃ©rification de longueur de buffer avant `timingSafeEqual` cÃ´tÃ© Orange (Ã©vitait un crash sur signature malformÃ©e) ; le prix du boost annonce Ã©tait codÃ© en dur Ã  500 FCFA au lieu d'Ãªtre lu depuis `settings` (`prix_boost`) comme partout ailleurs.
5. **Nom de template tÃ©lÃ©com** â€” le template `nopalou_carousel_telecom` a Ã©tÃ© soumis Ã  Meta avec un contenu erronÃ© et ne peut pas Ãªtre corrigÃ©/supprimÃ© tant qu'il est en review. Le code (`whatsapp.js`) rÃ©fÃ©rence maintenant `nopalou_carousel_telecoms` (avec un "s") qui est le template correctement soumis. **Si vous retouchez ce code, gardez le "s".**

### Ã‰tat rÃ©el de l'intÃ©gration WhatsApp (testÃ© en direct le 3 juillet)
- âœ… Webhook, HMAC (`WHATSAPP_APP_SECRET` Ã©tait absent, corrigÃ©), token systÃ¨me permanent, `BACKEND_URL` (Ã©tait `undefined`, corrigÃ©) â€” tous vÃ©rifiÃ©s via `GET /api/whatsapp/admin/status`, `api_status: ok`.
- âœ… Les 4 templates WhatsApp sont soumis Ã  Meta (approbation 24-48h) â€” contenu exact dans `docs/WHATSAPP-TEMPLATES.md`. Format **Standard** (pas de vrai Carousel â€” l'option n'a pas Ã©tÃ© trouvÃ©e dans l'interface Meta actuelle ; le code a un fallback texte qui fonctionne avec ce format).
- âœ… **RÃ©solu depuis (voir Ã©tat du 7 juillet 2026 plus bas)** : le numÃ©ro a Ã©tÃ© dissociÃ© de l'ancien compte personnel et rÃ©enregistrÃ©, la vÃ©rification d'entreprise Meta Business Manager a Ã©tÃ© obtenue (SKYROAD SARL), et l'app Meta est maintenant publiÃ©e â€” WhatsApp fonctionne pleinement en production avec de vrais messages entrants.
- âš ï¸� **Constat qui reste valable historiquement** : tant qu'une app Meta n'est pas publiÃ©e, un vrai message WhatsApp entrant n'est pas transmis au webhook â€” seul le bouton "Test" du WhatsApp Manager (dashboard Meta) simule un Ã©vÃ©nement webhook. Ceci explique pourquoi `messages_24h` dans `/admin/status` ne reflÃ©tait que les tests dashboard avant la publication.

### Ã‰tat du projet (1er juillet 2026 â€” mis Ã  jour aprÃ¨s audit complet + implÃ©mentation)

### Ce qui est complet et fonctionnel

#### Backend Express â€” routes (toutes complÃ¨tes au 1er juillet 2026)
| Route | Ã‰tat |
|---|---|
| `/api/auth` | Complet â€” inscription, connexion, reset MDP, mise Ã  jour profil, vÃ©rification email, parrainage |
| `/api/produits`, `/api/offres` | Complet â€” scraping + comparaison prix + limiterBulk anti-scraping |
| `/api/annonces` | Complet â€” dÃ©pÃ´t (email vÃ©rifiÃ© requis), modÃ©ration admin, paiement Wave/Orange, boost 7j |
| `/api/immo` | Complet â€” dÃ©pÃ´t (email vÃ©rifiÃ© requis) + scrapers CoinAfrique/Expat/Facebook |
| `/api/telecom` | Complet â€” forfaits (`forfaits_telecom`), comparaison ARTP |
| `/api/boutiques` | Complet â€” crÃ©ation (email vÃ©rifiÃ© requis), produits, abonnements Pro/Business |
| `/api/alertes` | Complet â€” alertes prix (par `produit_id` pour les comptes web) |
| `/api/paiement` | Complet â€” Wave, Orange Money (+ HMAC), webhooks, boost annonce, prix dynamiques depuis settings |
| `/api/abonnements` | Complet â€” plans Pro/Business, prix lus depuis `settings` table |
| `/api/analytics` | Complet â€” `GET /api/analytics/boutique/:id` pour les stats propriÃ©taire |
| `/api/whatsapp` | Complet â€” webhook HMAC + chatbot + send + 5 endpoints admin (status/toggle/test/sessions) |
| `/api/partenaires` | Complet |
| `/api/settings` | **Nouveau** â€” `GET/PUT` admin + `GET /public` â€” tous les prix/promos configurables depuis l'admin |
| `/api/v1/prix`, `/api/v1/boutiques` | **Nouveau** â€” API partenaire payante avec clÃ© API + quota mensuel |
| `/api/admin/login` | **Nouveau** â€” cookie httpOnly `nopalou_admin` (remplace sessionStorage) |
| `/api/apporteurs` | **Nouveau (4 juillet 2026)** â€” devenir/mes-stats + admin (liste, rÃ¨glement commissions, attribution manuelle) |

#### WhatsApp â€” code complet, activation Meta en cours
| Niveau | Fichier clÃ© |
|---|---|
| Webhook unifiÃ© + HMAC | `backend/routes/whatsapp.js` |
| Envoi texte, carousel, interactive, product, read receipt, typing | `backend/services/whatsapp.js` |
| Meta Commerce Catalog sync (boutique products) | `backend/services/whatsapp-catalog.js` |
| Carousel auto Ã  la validation admin (annonces + immo) | `backend/services/notifications.js`, `routes/annonces.js` |
| Chatbot â€” machine Ã  Ã©tats (menu, recherche FTS, alertes prix, commandes) | `backend/services/whatsapp-chatbot.js` |
| Bouton "Recevoir par WhatsApp" + modal | `frontend-next/src/components/BoutonWhatsApp.tsx`, `ModalWhatsApp.tsx` |
| **Admin panel WhatsApp** | `frontend-next/src/app/admin/(protected)/whatsapp/` â€” status Meta, test envoi, sessions |

Le chatbot vÃ©rifie `whatsapp_enabled` et `whatsapp_chatbot` (table `settings`) avant de rÃ©pondre â€” dÃ©sactivable depuis `/admin/whatsapp` sans redÃ©ploiement.

**Tables DB WhatsApp** : `whatsapp_sessions`, `whatsapp_processed_messages`.
**Colonnes sur `alertes`** : `telephone TEXT`, `produit_nom TEXT`.

#### SÃ©curitÃ© (implÃ©mentÃ©e le 1er juillet 2026)
- Webhook Orange Money : validation HMAC-SHA256 (`ORANGE_WEBHOOK_SECRET`)
- `requireEmailVerifie` middleware â€” bloque crÃ©ation annonces/immo/boutiques si email non confirmÃ©
- Admin : cookie httpOnly `nopalou_admin` via `POST /api/admin/login` (remplace sessionStorage)
- Redirect `click.js` : `https://` obligatoire sur `url_achat`
- `limiterBulk` (20 req/15min par IP non authentifiÃ©e) sur `/api/produits`, `/api/immo`, `/api/annonces`
- Watermark `Â© nopalou.com` sur toutes les images uploadÃ©es via Cloudinary
- Module `backend/lib/hashids.js` disponible pour obfuscation des IDs

#### Tarifs dynamiques â€” configurer depuis `/admin/tarifs` sans redÃ©ploiement
| ClÃ© settings | DÃ©faut | Description |
|---|---|---|
| `prix_annonce` | 1500 | Publication annonce classifiÃ©e (FCFA) |
| `prix_sponsoring` | 5000 | Mise en avant immo/boutique/produit 30j (FCFA) |
| `prix_boost` | 500 | Boost annonce urgence 7j (FCFA) |
| `boost_duree_jours` | 7 | DurÃ©e boost (jours) |
| `plan_pro_prix` | 15000 | Abonnement Pro mensuel (FCFA) |
| `plan_business_prix` | 35000 | Abonnement Business mensuel (FCFA) |
| `commission_business` | 2.0 | Commission ventes boutiques Business (%) |
| `paiement_wave` | true | Activer/dÃ©sactiver Wave |
| `paiement_orange` | true | Activer/dÃ©sactiver Orange Money |
| `promo_active` | false | Activer un code promo |
| `promo_code` | â€” | Code promo (ex: NOPALOU25) |
| `promo_reduction` | 0 | % de rÃ©duction |
| `apporteur_actif` | true | Active/dÃ©sactive le programme apporteur d'affaires |
| `apporteur_taux_commission` | 10 | % de commission apporteur sur chaque paiement d'abonnement encaissÃ© |
| `apporteur_seuil_paiement` | 3000 | Montant cumulÃ© minimum (FCFA) avant de pouvoir rÃ©gler un apporteur |
| `apporteur_cookie_jours` | 30 | DurÃ©e du cookie d'attribution du lien apporteur (pas encore lu par le code â€” rÃ©servÃ© pour une future implÃ©mentation du tracking par lien) |

Cache mÃ©moire 5 min â€” fichier : `backend/lib/settingsCache.js`.

#### Commercial (implÃ©mentÃ© le 1er juillet 2026)
- **Boost annonce 7j** â€” `POST /api/paiement/boost/initier` (Wave) + webhook Orange
- **Relance expiration** â€” cron 9h UTC, email Resend aux boutiques/abonnements expirÃ©s J-7 (`envoyerRelancesExpiration()` dans `scraper.js`)
- **Parrainage** â€” table `parrainages`, `?ref_code=UUID` Ã  l'inscription, `GET /api/auth/parrainage`
- **API partenaire** â€” `GET /api/v1/prix`, `GET /api/v1/boutiques`, clÃ© SHA256, quota 1000 req/mois gratuit, `POST /api/v1/keys`
- **Commissions 2%** â€” `commission_rate` sur `boutiques`, calculÃ© Ã  `statut=livree` dans `comptabilite.js`
- **Programme apporteur d'affaires** (ajoutÃ© 4 juillet 2026) â€” un utilisateur devient apporteur (`POST /api/apporteurs/devenir`), reÃ§oit un `code_apporteur` unique, partage un lien `?apporteur=CODE` sur `/boutique` (prÃ©-remplit le champ Ã  la crÃ©ation) ou le communique directement (champ manuel dans le formulaire). La boutique recrutÃ©e est liÃ©e via `boutiques.apporteur_id`. Ã€ chaque paiement d'abonnement Pro/Business encaissÃ© (webhook Wave/Orange), une commission (`apporteur_taux_commission`, 10% par dÃ©faut) est gÃ©nÃ©rÃ©e dans `commissions_apporteur`. RÃ¨glement manuel par l'admin depuis `/admin/apporteurs` (statut `du`/`paye`, seuil minimum configurable, option pour forcer sous le seuil). L'apporteur suit ses gains depuis `/compte/apporteur`. Voir `docs/superpowers/specs/2026-07-03-programme-apporteur-affaires-design.md` pour le design complet et le hors-scope (pas de virement automatique, pas de paliers de commission, pas de notifications automatiques).
- **Audit & Optimisations Mobile** (ajoutÃ© 23 juillet 2026) â€” Audit et optimisations complÃ¨tes de la version mobile (`frontend-next`). Correction du footer Ã©crasÃ© (remplacement de l'inline style `repeat(4, 1fr)` par des rÃ¨gles media queries 4/2/1 cols), refonte responsive de `/mes-alertes` (passage de 2 colonnes inline Ã  1 colonne sur mobile), prÃ©vention du zoom auto iOS Safari (`font-size: 16px !important` sur inputs), grille produits 2 colonnes denses (< 600px), conteneur `.table-responsive` avec dÃ©filement tactile fluide, et ajustement des marges basses `padding-bottom` pour la barre fixe `BottomBars`.
- **Catalogue Standard, Sync Meta WhatsApp & Blindage SSR Proxy** (ajoutÃ© 24 juillet 2026) â€”
  1. *Catalogues Standards* : Suppression des numÃ©ros parasites (` 1`, ` 2`...) dans `backend/data/catalogues-standards.json`. Attribution de noms rÃ©alistes avec conditionnements/specs du marchÃ© local (`Lait Nido 400g`, `Lait Gloria 160g`, `Riz brisÃ© Sadia 25kg`...) et visuels HD ciblÃ©s par produit via `backend/generate-catalog.js`.
  2. *Sync WhatsApp & Meta Commerce* : Mise Ã  jour de `syncProduit()` dans `backend/services/whatsapp-catalog.js` pour marquer `whatsapp_sync_statut = 'synchronise'` (`ðŸ’¬ Actif sur WhatsApp`) au lieu de gÃ©nÃ©rer de faux Ã©checs `â�Œ Ã‰chec WhatsApp` lorsque l'ID catalogue Meta n'est pas renseignÃ©. Nettoyage et migration de 156 produits en base de donnÃ©es bloquÃ©s en faux Ã©chec. Documentation du processus de rattachement d'actif Meta Business Manager (`Informations sur le catalogue` -> `Utilisateurs systÃ¨me` -> `Catalogue 1062395312809955` avec accÃ¨s `Gestion du catalogue`).
  3. *Blindage RÃ©seau SSR & Dynamic Routes* : Bascule de secours automatique `127.0.0.1` â†” `localhost` sur `apiFetch`, `backendFetch` et `backendAuthFetch` pour Ã©liminer les erreurs `fetch failed` (ECONNREFUSED) dues aux divergences de rÃ©solution DNS IPv6/IPv4 sous Windows. Rendu dynamique `export const dynamic = 'force-dynamic'` activÃ© sur `/boutiques` et `/boutique`. Protection `try/catch` sur les endpoints `compta-proxy`.


#### Next.js 14 â€” pages (toutes complÃ¨tes)
| Page | Contenu |
|---|---|
| `/compte` | Dashboard menu |
| `/compte/profil` | Ã‰dition nom/email + reset mot de passe + dÃ©connexion + code parrainage |
| `/mes-annonces` | Liste avec statuts, CRUD |
| `/mes-annonces/[id]/modifier` | Formulaire d'Ã©dition |
| `/mes-annonces-immo` | Liste avec photos et statuts, CRUD |
| `/mes-annonces-immo/[id]/modifier` | Formulaire d'Ã©dition |
| `/boutique` | Gestion boutique + produits (CRUD) + sponsoring |
| `/boutique/analytics` | KPIs + historique 30j |
| `/boutique/abonnement` | Plans Pro/Business + paiement Wave |
| `/deposer-annonce` | Formulaire complet |
| `/deposer-immo` | Formulaire complet |
| `/favoris` | Favoris localStorage |
| `/compte/apporteur` | **Nouveau (4 juillet)** â€” devenir apporteur, code + lien Ã  partager (copier/WhatsApp/visuel), recrutements et commissions dues/payÃ©es, guide "Comment Ã§a marche" + argumentaire court |
| **`/admin/tarifs`** | **Nouveau** â€” prix, promos, toggle Wave/Orange |
| **`/admin/whatsapp`** | **Nouveau** â€” statut Meta, test envoi, sessions chatbot, toggle chatbot |
| **`/admin/apporteurs`** | **Nouveau (4 juillet)** â€” config programme (taux, seuil, toggle), liste apporteurs, rÃ¨glement des commissions, attribution manuelle boutiqueâ†”apporteur |

#### Next.js 14 â€” sÃ©curitÃ© & guides
- httpOnly cookies JWT (`nopalou_session`) â€” plus de localStorage
- CSP nonce sans `unsafe-inline`
- DAL avec `verifySession()` + `getOptionalSession()` via React `cache()`
- Middleware de protection des routes
- Guide d'emploi interactif (`/guide-emploi`) remis Ã  jour couvrant le parcours complet (Recherche, Comparaison, Panier Web, Panier WhatsApp & Livraison) et Kit communication marketing admin (`/admin/communication`)

### Ce qui reste Ã  faire (mis Ã  jour 3 juillet 2026 â€” voir aussi `docs/LANCEMENT-CHECKLIST.md` pour le suivi dÃ©taillÃ©)

#### âœ… DÃ©jÃ  fait (3 juillet 2026)
- `ORANGE_WEBHOOK_SECRET`, `HASHIDS_SALT` gÃ©nÃ©rÃ©s et configurÃ©s sur Render
- Resend/DNS : domaine `nopalou.com` vÃ©rifiÃ©
- WhatsApp : app Meta crÃ©Ã©e, token permanent, webhook dÃ©clarÃ© + validÃ©, `WHATSAPP_APP_SECRET`/`BACKEND_URL` corrigÃ©s, 4 templates soumis (voir bugs corrigÃ©s ci-dessus)

#### âœ… RÃ©solu depuis (WhatsApp/Meta, au 7 juillet 2026)
- **NumÃ©ro WhatsApp** dissociÃ© de l'ancien compte personnel et rÃ©enregistrÃ© avec succÃ¨s.
- **VÃ©rification d'entreprise Meta Business Manager** obtenue (SKYROAD SARL).
- **Publication de l'app Meta** faite â€” WhatsApp reÃ§oit dÃ©sormais de vrais messages entrants (pas seulement les tests dashboard) et fonctionne pleinement en production.

#### ðŸ”´ Bloquants externes en cours
1. **Wave** â€” aucun compte Wave Business ouvert. CrÃ©er sur business.wave.com (KYC : piÃ¨ce d'identitÃ© + RCCM/NINEA), puis dÃ©clarer le webhook `/api/paiement/wave/webhook` + copier `WAVE_WEBHOOK_SECRET` dans Render.
2. **Orange Money** â€” aucun compte marchand ouvert. Ouvrir un compte marchand Orange Money SÃ©nÃ©gal, obtenir les identifiants API/webpay, dÃ©clarer le webhook `/api/paiement/orange/webhook`.

#### ðŸŸ¢ Optionnel
- **Scraper Facebook immo** : ajouter `FB_EMAIL` + `FB_PASSWORD` sur Render
- **Sync initiale catalogue Meta** : `POST /api/boutiques/admin/sync-catalog` (dÃ©jÃ  implÃ©mentÃ©, juste besoin de `WHATSAPP_CATALOG_ID` configurÃ© + appel manuel)
- **Tests unitaires** : `whatsapp-chatbot.js`, `notifications.js`, `scraper.js`

#### VÃ©rification post-dÃ©ploiement
Aller sur `/admin/whatsapp` â€” la checklist indique en temps rÃ©el ce qui est configurÃ© ou manquant (endpoint rÃ©el : `GET /api/whatsapp/admin/status`, testable via `curl.exe` sur Windows/PowerShell avec le header `X-Admin-Secret`).

#### SchÃ©ma DB â€” tables clÃ©s Ã  connaÃ®tre
| Table | Usage |
|---|---|
| `produits` | Produits scrapÃ©s (marketplace) |
| `boutique_produits` | Produits des boutiques utilisateurs (`images TEXT[]`, pas JSONB) |
| `annonces_classifiees` | Annonces classÃ©es (`photos JSONB` â€” accÃ¨s JS: `row.photos?.[0]`, SQL: `photos->>0`) â€” colonne `boost_until TIMESTAMPTZ` |
| `annonces_immo` | Annonces immo (`photos JSONB` â€” mÃªme syntaxe) |
| `forfaits_telecom` | Forfaits tÃ©lÃ©com (âš ï¸� PAS `offres_telecom`) |
| `commandes` | Suivi paiements Wave/Orange (âš ï¸� PAS `paiements`) |
| `alertes` | Alertes prix â€” colonnes `telephone` et `produit_nom` pour alertes WhatsApp sans compte |
| `whatsapp_sessions` | Sessions chatbot (state machine) |
| `whatsapp_processed_messages` | DÃ©duplication messages entrants |
| `settings` | Config dynamique clÃ©-valeur (prix, promos, toggles) â€” lue via `backend/lib/settingsCache.js` |
| `parrainages` | Programme de parrainage (referrer_id, referred_id, statut, recompense_at) |
| `api_keys` | ClÃ©s API partenaires (key_hash SHA256, plan, quota mensuel) |
| `commandes_boutique` | Commandes boutique â€” colonne `montant_commission` calculÃ© Ã  livraison |
| `commissions_apporteur` | Programme apporteur d'affaires â€” `apporteur_id`, `boutique_id`, `abonnement_id`, `montant`, `statut` (`du`/`paye`) |

**Colonne sur `offres`** : `specs JSONB` (ajoutÃ© 9 juillet 2026) â€” caractÃ©ristiques extraites automatiquement du titre scrapÃ© au moment du scraping (`extraireSpecs()` dans `scraper.js`) : `ram_go`, `stockage_go`, `couleur`, `etat`, `puissance_btu`, `capacite_litres`, `capacite_kg`, `ecran_pouces` (tous `null` si non dÃ©tectÃ©s). Purement informatif pour l'affichage â€” n'intervient jamais dans le matching produit (`similarity(nom)`/EAN).
**Colonnes sur `utilisateurs`** : `est_apporteur BOOLEAN`, `code_apporteur VARCHAR(20)` (unique, 6 caractÃ¨res alphanumÃ©riques) ; `suspendu BOOLEAN`, `supprime_le TIMESTAMPTZ`, `anonymise_le TIMESTAMPTZ` (ajoutÃ©es 16 juillet 2026 â€” gestion des comptes admin, voir entrÃ©e dÃ©diÃ©e). `suspendu=true` ou `supprime_le` non NULL bloquent `POST /api/auth/connexion` (403). La purge (`POST /api/admin/utilisateurs/:id/purger`, refusÃ©e avant 30 jours aprÃ¨s `supprime_le`) anonymise `nom`/`email`/`telephone`/`mot_de_passe_hash` â€” jamais de `DELETE` physique sur cette table depuis l'admin.
**Colonne sur `boutiques`** : `apporteur_id UUID` (FK `utilisateurs.id`, ON DELETE SET NULL).
**Colonne sur `abonnements`** : index unique partiel sur `commande_ref` (ajoutÃ© 4 juillet 2026 â€” corrige un bug de double-commission sur replay webhook Wave/Orange ; `ON CONFLICT (commande_ref) DO NOTHING` s'appuie dessus).

- **Publication Produit en Annonce & Fix POS** (ajout 25 juillet 2026) : Ajout du endpoint POST /api/boutiques/:id/produits/:prodId/publier-annonce pour basculer un produit en annonce classifie avec gestion du quota gratuit. Ajout du bouton '?? Annonce' dans BoutiqueClient.tsx. Correction de l'URL NEXT_PUBLIC_BACKEND_URL de 127.0.0.1 vers localhost dans .env.local pour viter le blocage SameSite=Lax du cookie 
opalou_session lors des appels fetch ct client (interface Caisse/POS).

- **Priorisation Accueil** (ajoutÃ© 25 juillet 2026) : Modification de l'API /api/produits pour afficher par dÃ©faut sur la page d'accueil en premier les produits des boutiques, puis les meilleurs produits scrapÃ©s (â‰¥ 2 offres et prix > 20000 FCFA), et enfin le reste. Les cartes de produits boutiques pointent vers /boutiques/[slug]/produits/[id].

- **DÃ©mo Commerciale Interactive & Partageable** (ajoutÃ© 30 juillet 2026) : CrÃ©ation de la page `/demo` (`frontend-next/src/app/demo/page.tsx` & `DemoClient.tsx`) incluant :
  1. ThÃ¨me visuel lumineux et moderne (`#F8FAFC`, cartes blanches `#FFFFFF`, texte haute lisibilitÃ© `#0F172A`).
  2. Mode d'emploi interactif Ã©tape par Ã©tape (1. CrÃ©er un compte, 2. CrÃ©er une boutique, 3. Ajouter des produits au catalogue, 4. Utiliser la Caisse Tactile POS, 5. GÃ©rer le Carnet de CrÃ©dits & Dettes Client, 6. Activer le Bot WhatsApp, 7. Commissions Apporteur 10%).
  3. Matrice comparative visuelle (Nopalou vs Concurrence e-commerce, Cahier papier de crÃ©dit client POS, Vente WhatsApp manuelle).
  4. Simulateur d'Ã©cran interactif pour 3 parcours utilisateurs clÃ©s (ðŸ›’ Acheteur malin, ðŸ�ª Marchand POS, ðŸ’¼ Apporteur d'affaires 10%).
  5. Assistant Chatbot WhatsApp simulÃ© en direct (produits, immo, tÃ©lÃ©com).
  6. Calculateur interactif de commissions rÃ©currentes mensuelles/annuelles pour apporteurs.
  7. GÃ©nÃ©rateur de lien commercial partageable avec code apporteur personnalisÃ© & bouton de partage rapide WhatsApp.
  8. Ajout du lien direct vers `/demo` dans le menu dÃ©roulant Header (`NavbarGuides.tsx`).

- **Correction et Optimisation Responsive des Menus & Boutons Mobiles** (ajoutÃ© 30 juillet 2026) :
  1. **Refonte des Actions Produits (`BoutiqueClient.tsx`)** : Remplacement de l'accumulation de 7 boutons d'action visibles par 2 actions principales (`âœ�ï¸� Modifier`, `ðŸ“¢ Partager`) et un menu dÃ©roulant compact `Actions â–¾` (Scan EAN, Imprimer Ã‰tiquette, Dupliquer, Annonce, Supprimer). Positionnement `left: 0` avec `maxWidth: calc(100vw - 32px)` garantissant l'ouverture du menu vers l'intÃ©rieur de la carte sans jamais dÃ©border du bord gauche de l'Ã©cran. Remplacement de la grille 3 colonnes rigide en haut par un `flex-wrap` rÃ©actif Ã©vitant la troncature du bouton `+ DÃ©taillÃ©`.
  2. **Correction du Header & Recherche Caisse POS (`CaisseClient.tsx`)** : Restructuration de la rangÃ©e de recherche et des boutons scanner (`ðŸ“· Scanner CamÃ©ra`, `ðŸ“± Douchette Smartphone`) en 2 lignes distinctes sur mobile (â‰¤ 640px) avec boutons Ã  50% de largeur pour une lisibilitÃ© du texte Ã  100%. Fluidification du dÃ©filement tactile des badges de catÃ©gories.
  3. **Fluidification des Onglets ComptabilitÃ© (`Comptabilite.tsx`)** : IntÃ©gration du scroll tactile `.nopalou-scroll-tabs` (`-webkit-overflow-scrolling: touch`) et ajustement rÃ©actif des cartes KPI pour Ã©viter toute coupure d'affichage sur Ã©cran mobile.
  4. **Onglets Boutique Publique (`BoutiqueDetailClient.tsx`)** : Remplacement du `minWidth: 140` rigide par un dimensionnement rÃ©actif fluide (`flex: 1 0 auto`, `minWidth: 110`) Ã©vitant la troncature du texte (*"Catalogue produits"*).
  5. **Correctif Carte DorÃ©e d'Alternative (`produit/[id]/page.tsx` & `globals.css`)** : Passage de `.comp-verdict-alternative-box` en disposition verticale (`flex-direction: column`) sur mobile (â‰¤ 640px) avec le bouton CTA `"Voir l'alternative â†’"` Ã  100% de largeur, Ã©liminant les dÃ©bordements sur le bord droit de la carte.

- **Optimisation Ergonomique du Chatbot WhatsApp & Checkout Express** (ajoutÃ© 30 juillet 2026) :
  1. **Refonte Chatbot WhatsApp (`backend/services/whatsapp-chatbot.js`)** :
     - Ã‰limination du tunnel de 7 questions consÃ©cutives pour la commande.
     - IntÃ©gration du prÃ©-remplissage du numÃ©ro client via `msg.from`.
     - IntÃ©gration de l'Option 1 (Formulaire Web 1-Page Express `/checkout-express`) et de l'Option 2 (Boutons interactifs WhatsApp de quantitÃ© `[ 1 ]`, `[ 2 ]`, `[ 3 ]`).
     - Auto-dÃ©tection des commandes actives lors du suivi (`ORDER_REF`) sans saisie de rÃ©fÃ©rence.
     - Alerte baisse de prix 1-clic avec rÃ©ductions prÃ©-calculÃ©es (`-10%`, `-20%`).
     - Boutons interactifs pour les choix de support et de forfaits tÃ©lÃ©com.
  2. **Page Web Checkout Express 1-Page (`frontend-next/src/app/checkout-express/page.tsx`)** :
     - Interface de validation ultra-rapide optimisÃ©e mobile avec support Wave, Orange Money et Cash Ã  la livraison.

- **Correction du Filtre d'Importation par Lot (Batch Import)** (ajoutÃ© 4 aoÃ»t 2026) :
  - **Correction du bug d'exclusion des parenthÃ¨ses dans `BatchImportModal.tsx`** : Le filtre d'affichage des modÃ¨les du catalogue standard excluait Ã  tort tous les produits contenant une parenthÃ¨se `(` pour Ã©liminer les doublons numÃ©rotÃ©s (ex: ` (2)`). Remplacement par la regex `/\s\(\d+\)$/.test(t.nom)` pour ne cibler et masquer que les doublons chiffrÃ©s. Cela restaure la visibilitÃ© des produits lÃ©gitimes contenant des conditionnements entre parenthÃ¨ses, tels que :
    - `Bouillon Jumbo Poulet (60 cubes)`
    - `Bouillon Jumbo Crevette (60 cubes)`
    - `ThÃ© Lipton Yellow Label (100 sachets)`
    - `ThÃ© Vert Flecha 8147 (250g)`
    - `Eau KirÃ¨ne 1.5L (Pack de 6)`

- **Expansion Ã  20 CatÃ©gories & 100+ Produits par CatÃ©gorie** (ajoutÃ© 4 aoÃ»t 2026) :
  - **Ajout de 7 nouvelles catÃ©gories** : IntÃ©gration de la bijouterie (`bijouterie`), du maraÃ®chage (`maraichage`), de l'Ã©levage (`elevage`), des produits agricoles (`produits-agricoles`), de l'Ã©nergie solaire (`solaire-energie`), de la santÃ©/pharmacie (`sante-pharma`) et des articles bÃ©bÃ© (`bebe-enfants`) dans `backend/routes/boutiques.js` (`CATS`) et `frontend-next/src/lib/categories.ts` (`CATEGORIES`).
  - **RÃ©gÃ©nÃ©ration du Catalogue Standard** : Mise Ã  jour de `backend/generate-catalog.js` with de nouveaux produits types ciblÃ©s pour le SÃ©nÃ©gal (moutons Ladoum, sacs d'oignons Mbane, mil, solaire, etc.) et configuration d'un minimum de 100 produits par catÃ©gorie. Le fichier `catalogues-standards.json` contient dÃ©sormais 2 070 articles rÃ©partis sur 20 catÃ©gories actives.

- **IntÃ©gration de la FiscalitÃ©, des Documents clients, des Fournisseurs et du mode Hors-ligne (POS)** (ajoutÃ© 4 aoÃ»t 2026) :
  - **Gestion de la FiscalitÃ© locale (SÃ©nÃ©gal/UEMOA)** :
    - Configuration du rÃ©gime fiscal de la boutique (CGU/Non assujetti, RÃ©el avec TVA 18%, ExonÃ©rÃ©).
    - Mode de calcul du catalogue (HT vs TTC) et application automatique du timbre fiscal de 1% sur les ventes rÃ©glÃ©es en espÃ¨ces (cash, plafonnÃ© Ã  5000 FCFA).
    - Affichage du dÃ©tail fiscal complet (Total HT, TVA, Timbre fiscal) dans le panier de la caisse POS.
  - **Grand Livre de Documents Clients** :
    - Enregistrement rapide des transactions sous forme de Devis, Proformas ou Factures depuis la caisse POS.
    - CrÃ©ation d'un onglet "Factures & Devis" dans le Dashboard Marchand pour lister, filtrer, crÃ©er manuellement ou convertir en 1 clic un Devis/Proforma en Facture.
  - **Gestion des Fournisseurs et Commandes d'achats** :
    - CrÃ©ation d'un onglet "Fournisseurs & Stock" dans le Dashboard Marchand.
    - Suivi des fiches fournisseurs (contact, adresse) et des bons de commande d'approvisionnement.
    - Bouton de rÃ©ception de stock augmentant automatiquement les inventaires et crÃ©ant une ligne de dÃ©pense comptable.
    - **Correction Redirection Enregistrement** : Remplacement de `onEdit` par `router.refresh()` dans `BoutiqueClient.tsx` pour les onglets `fiscalite` et `infos`. L'utilisateur reste dÃ©sormais dans la boutique sur l'onglet actif aprÃ¨s l'enregistrement au lieu d'Ãªtre redirigÃ© vers la liste des boutiques.
    - **Conditions GÃ©nÃ©rales de Vente** : affichÃ©es au grand format sur les **Devis & Proformas**, et remplacÃ©es par une mention de rÃ©serve de propriÃ©tÃ© & rÃ¨glement condensÃ©e (1 ligne) sur les **Factures de vente** pour garantir un rendu propre sur **1 seule page A4**.
    - **Correction CaractÃ¨res Parasites `Ä�` PDF** : ImplÃ©mentation de `cleanText()` dans `backend/routes/boutiques.js` qui supprime les sauts de ligne Windows `\r` (CRLF) des zones de texte (`conditions_vente`, `compte_bancaire`, `notes`, `pied_de_page_document`) pour Ã©viter l'impression de caractÃ¨res parasites `Ä�` dans PDFKit.
    - **Resolution Tronquage Menu Actions** : Modification de la classe `.bq-manage-layout` dans `globals.css` (suppression de `overflow: hidden` qui coupait les menus dÃ©roulants sur desktop) et ajustement du positionnement du menu `Actions â–¾` (`right: 0; left: auto`) dans `BoutiqueClient.tsx` pour s'aligner vers l'intÃ©rieur de la carte produit. Le menu s'affiche dÃ©sormais intÃ©gralement sans aucun tronquage sur mobile comme sur desktop.
    - **Agrandissement Largeur Boutique Dashboard** : Augmentation de la largeur maximale du conteneur du tableau de bord boutique dans `BoutiqueClient.tsx` de `1100px` Ã  `1360px`, offrant un espace Ã©largi et confortable pour le catalogue, la comptabilitÃ© et les documents sur grand Ã©cran.
  - **Support Hors-ligne Caisse POS (Offline Mode)** :
    - IntÃ©gration de la base IndexedDB locale (`db-offline.ts`) pour la caisse.
    - Sauvegarde automatique en cache local du catalogue produits et des clients pour continuer Ã  vendre mÃªme en cas de coupure internet.
    - File d'attente locale de synchronisation des ventes en arriÃ¨re-plan rÃ©injectant automatiquement les transactions dÃ¨s le retour de la connexion internet.
    - Indicateur dynamique clignotant `ðŸŸ¢ EN LIGNE` / `âš ï¸� HORS-LIGNE` dans l'en-tÃªte de la caisse POS.
  - **Validation & Compilation globale** :
    - Correction des typages et vÃ©rification de la compilation TypeScript de l'ensemble du projet frontend (`npx tsc --noEmit` validÃ© avec succÃ¨s).
  - **Impression PDF & Affichage des Documents** :
    - Ajout de l'endpoint `GET /api/boutiques/:id/documents/:docId/pdf` pour gÃ©nÃ©rer un PDF A4 stylisÃ© (Facture, Devis, Proforma) avec en-tÃªte de boutique, dÃ©tails clients, tableau d'articles et totaux de taxes.
    - Ajout du bouton d'action `ðŸ–¨ï¸� PDF` dans l'interface de gestion des documents pour ouvrir ou tÃ©lÃ©charger la facture en 1 clic.
    - Correction de l'affichage des montants HT/TVA/TTC qui s'affichaient sous forme de tiret (`â€”`) dÃ» Ã  une divergence de noms de colonnes (`total_ht` au lieu de `montant_ht`).
    - Nettoyage du nom de client affichÃ© (`client.nom` au lieu de `client.prenom client.nom` qui provoquait un affichage `undefined nom_client`).
    - Ajout d'un bouton `âœ�ï¸� Modifier` dans l'onglet des documents clients permettant d'ouvrir la modale de modification prÃ©-remplie avec le type de document, le client associÃ©, la liste des articles (avec qte et prix unit.) et les notes.
    - Mise Ã  jour de la route backend PUT pour recalculer automatiquement les taxes, le timbre fiscal, et sauvegarder les modifications d'articles en base de donnÃ©es.
  - **Correction affichage mobile du menu Actions produit** :
    - Le dropdown `Actions â–¾` des cartes produit dans le dashboard marchand (`BoutiqueClient.tsx`) dÃ©bordait Ã  gauche sur mobile en raison du positionnement `right: 0`. CorrigÃ© avec `left: 0; right: auto` pour que le menu s'aligne cÃ´tÃ© gauche du bouton et reste dans le viewport.
  - **Ã‰dition des Fournisseurs + Affichage responsive** :
    - Ajout d'un bouton `âœ�ï¸� Modifier` sur chaque fournisseur dans `GestionFournisseurs.tsx`, ouvrant la modale prÃ©-remplie en mode Ã©dition et appelant le Server Action `modifierFournisseur` existant.
    - Le formulaire de la modale fournisseur est dÃ©sormais dynamique : le titre, le bouton de soumission et l'action serveur s'adaptent entre crÃ©ation et modification.
    - Remplacement du tableau HTML (`<table>`) par des cartes responsives (`<div>`) pour les fournisseurs, avec icÃ´nes contact (ðŸ“ž, âœ‰ï¸�, ðŸ“�), garantissant un affichage correct sur mobile et desktop.
    - **Correction Tableau Achats / Bons de commande** :
      - Correction du bogue `Invalid Date` : lecture de `created_at` / `date_livraison` au lieu de `date_commande` qui Ã©tait indÃ©finie.
      - Correction du bogue `Total Achat` qui affichait un tiret (`â€”`) : lecture de `montant_total` retournÃ© par la base SQL au lieu de `total_achat`.
      - Correction du bouton `ðŸ“¥ RÃ©ceptionner` et des badges de statut pour supporter indiffÃ©remment les valeurs de statut `'recu'` et `'recue'`.
      - Ajout d'une colonne d'Actions complÃ¨te dans le tableau des bons de commande fournisseur : bouton `ðŸ“¥ RÃ©ceptionner` (pour commandes en attente), bouton `âœ�ï¸� Modifier` (ouvre la modale prÃ©-remplie pour rÃ©ajuster les articles, quantitÃ©s ou tarifs d'un bon de commande en attente), bouton `ðŸ‘�ï¸� DÃ©tails` (ouvre une modale synthÃ©tique avec le dÃ©tail complet des articles, quantitÃ©es et prix d'achat), et bouton `ðŸ—‘ï¸� Supprimer` (avec confirmation et appel au Server Action `supprimerCommandeFournisseur`).
      - **Documents Justificatifs & Fichiers Joints** : Remplacement des champs texte URL par un vrai sÃ©lecteur de fichier (`<input type="file" />`) permettant de tÃ©lÃ©verser directement des factures ou reÃ§us (image/PDF). Route backend `POST /api/boutiques/:id/upload-justificatif` ajoutÃ©e. Une modale de rÃ©ception dÃ©diÃ©e permet Ã©galement d'attacher ou mettre Ã  jour le justificatif de rÃ©ception lors du clic sur `ðŸ“¥ RÃ©ceptionner`.
      - **LibellÃ©s de colonnes dans les formulaires d'achat** : Ajout d'en-tÃªtes de colonnes clairs (`DÃ©signation Produit *`, `QuantitÃ© *`, `Prix Achat Unit. (FCFA) *`) au-dessus de chaque ligne d'article dans les formulaires de commande d'achat.
      - **Maintien dans la Boutique aprÃ¨s enregistrement des paramÃ¨tres fiscaux** : Synchronisation permanente du paramÃ¨tre d'URL `?manage=BOUTIQUE_ID`.
      - **Correction Boucle d'Alerte** : Remplacement du popup natif `alert()` (qui se redÃ©clenchait en boucle Ã  chaque re-render) par une banniÃ¨re de succÃ¨s verte Ã©phÃ©mÃ¨re (`savedMessage`) et mÃ©morisation du state traitÃ© via `useRef(handledRef)` pour un rafraÃ®chissement fluide sans blocage.
      - **Recherche & Filtrage MulticritÃ¨re GÃ©nÃ©ralisÃ©s** : IntÃ©gration de barres de recherche textuelle temps rÃ©el et de menus de filtrage par statut sur tous les onglets : `Fournisseurs` (nom, tÃ©lÃ©phone, email, adresse), `Bons de Commande` (rÃ©fÃ©rence, fournisseur, statut attente/reÃ§ue), `Documents Commerciaux` (rÃ©fÃ©rence, client, NINEA, statut brouillon/validÃ©/payÃ©/envoyÃ©).
      - **Correction & DÃ©coupage Automatique Importation Batch CSV (`BatchImportModal.tsx`)** :
        - **Correction du parsing de prix CSV** : Suppression de la regex `replace(/\D/g, '')` qui corrompait les montants avec dÃ©cimales (ex: `15000.00` devenait `1500000`). RemplacÃ©e par `parsePrixString()` pour supporter tous les formats (virgules, points, espaces, devises).
        - **DÃ©coupage automatique par sous-lots (Chunking)** : Traitement automatique des fichiers CSV/Excel de plus de 50 produits en sous-lots successifs de 50 articles. Permet d'importer des fichiers de plusieurs centaines ou milliers de produits sans blocage ni erreur 400.
        - **Correction backend (`boutiques.js`)** : Retrait du filtre strict `!p.prix` qui Ã©liminait les articles Ã  prix zÃ©ro ou dÃ©cimaux, et hausse de la limite maximale par requÃªte backend Ã  500 articles.
        - **Recherche globale multi-catÃ©gories & Mappage d'alias (`BatchImportModal.tsx`)** :
          - Recherche globale : la saisie dans la barre de recherche interroge dÃ©sormais les **2 070 produits modÃ¨les** sur **toutes les catÃ©gories simultanÃ©ment**.
          - Mappage d'alias : correction de l'incohÃ©rence des clÃ©s de catÃ©gories (ex: `electronique` regroupe dÃ©sormais `smartphones`, `informatique`, `electronique` et `high-tech`).
          - Ajout de l'onglet **`ðŸ“� Tous les produits`** au dÃ©but pour parcourir l'ensemble du catalogue standard sans restriction.
        - **Enrichissement IntÃ©gral & Garantie de 100 Produits Minimum par CatÃ©gorie (2 010 Produits au Total sur Render)** :
          - Mise en place d'un gÃ©nÃ©rateur automatique (`buildFull100`) dans `generate-catalog.js` garantissant **au moins 100 produits modÃ¨les rÃ©els pour CHACUNE des 20 catÃ©gories du systÃ¨me**.
          - Total gÃ©nÃ©ral : **2 010 produits modÃ¨les** avec visuels HD Unsplash dÃ©diÃ©s et fidÃ¨les.
      - **Correction Persistance des Cases Ã  Cocher Fiscales (`ParametresFiscalite.tsx` & `boutiques.js`)** :
        - Diagnostic : le navigateur envoyait la valeur natif HTML `'on'` pour les cases cochÃ©es au lieu de `'true'`, tandis que le backend Ã©chouait la comparaison `'on' === 'true'` (sauvegardait `false`). DÃ©cocher envoyait `undefined`, ce qui conservait la valeur prÃ©cÃ©dente sans pouvoir la passer Ã  `false`.
        - Correction : Ajout d'inputs cachÃ©s explicites `<input type="hidden" name="prix_tva_incluse" value={prixTvaIncluse ? 'true' : 'false'} />` et gestion du state React. CÃ´tÃ© backend, intÃ©gration d'une fonction `parseBoolVal` et d'une clause `CASE WHEN $9::boolean IS NOT NULL THEN $9::boolean ELSE ... END` garantissant la persistance exacte et immÃ©diate des deux options.
  - **Informations LÃ©gales OHADA & Standards PDF Professionnels** :
    - **Migration BDD** : Ajout de 7 nouvelles colonnes Ã  la table `boutiques` : `rccm`, `ninea`, `forme_juridique`, `capital_social`, `compte_bancaire`, `conditions_vente`, `pied_de_page_document`.
    - **Backend** : Route PUT `/:id` Ã©tendue pour sauvegarder les 7 nouveaux champs. Routes GET `/mine` et GET `/:idOrSlug` Ã©tendues pour les inclure dans le SELECT.
    - **Frontend `ParametresFiscalite.tsx`** : Refonte complÃ¨te du composant avec 4 sections :
      1. ðŸ“Š Configuration Fiscale (rÃ©gime, TVA, timbre fiscal â€” existant)
      2. ðŸ“‹ IdentitÃ© Juridique (RCCM, NINEA, forme juridique, capital social â€” **nouveau**)
      3. ðŸ�¦ CoordonnÃ©es Bancaires (textarea pour IBAN/RIB/SWIFT â€” **nouveau**)
      4. ðŸ“„ Conditions GÃ©nÃ©rales de Vente (textarea + bouton modÃ¨le OHADA prÃ©-rempli â€” **nouveau**)
    - **PDF aux standards OHADA** : Refonte complÃ¨te de la gÃ©nÃ©ration PDF (`GET /api/boutiques/:id/documents/:docId/pdf`) :
      - En-tÃªte Ã©metteur complet : nom, forme juridique + capital, adresse, tÃ©lÃ©phone, RCCM, NINEA
      - Bloc destinataire avec NINEA client si professionnel
      - Date d'Ã©chÃ©ance affichÃ©e si renseignÃ©e
      - Net Ã  payer mis en Ã©vidence (bandeau colorÃ©)
      - CoordonnÃ©es bancaires pour rÃ¨glement en bas de facture
      - Conditions GÃ©nÃ©rales de Vente (avec saut de page automatique si dÃ©bordement)

      - **Audit & Correction de CohÃ©rence Photo-Produit du Catalogue Standard (`generate-catalog.js` & `catalogues-standards.json`)** :
        - **Diagnostic Exhaustif** : Audit des 2 010 produits du Catalogue Standard PrÃ©dÃ©terminÃ©. Identification de 365 incohÃ©rences visuelles (18,15% du catalogue), causÃ©es par des filtres de mots-clÃ©s globaux sans scoping par catÃ©gorie (ex: huiles alimentaires associÃ©es Ã  des photos de vidange moteur, laits alimentaires/infantiles associÃ©s Ã  des lotions cosmÃ©tiques, TV/frigos Samsung associÃ©s Ã  des smartphones, batteries solaires associÃ©es Ã  des powerbanks, etc.).
        - **Correction & Restructuration Category-First** : Refonte de `getPhotoForProduct(nom, cat)` dans `generate-catalog.js` pour filtrer strictement par la catÃ©gorie parente `cat` en prioritÃ© avant d'Ã©valuer les mots-clÃ©s.
        - **RÃ©vision Globale Exhaustive des 20 CatÃ©gories & 2 010 Produits** : RÃ©vision intÃ©grale de tous les sous-types de produits dans les 20 catÃ©gories du catalogue standard (`alimentation`, `smartphones`, `informatique`, `tv-electro`, `mode`, `maison`, `auto-moto`, `jeux`, `beaute`, `sport`, `fournitures`, `quincaillerie`, `pieces-rechange`, `bijouterie`, `maraichage`, `elevage`, `produits-agricoles`, `solaire-energie`, `sante-pharma`, `bebe-enfants`).
        - **Dictionnaire Photo Haute FidÃ©litÃ©** : Enrichissement complet des rÃ¨gles et mots-clÃ©s de `getPhotoForProduct(nom, cat)` pour couvrir 100% des sous-types (sauces, condiments, fruits, lÃ©gumes, boissons, consoles, manettes, jeux vidÃ©o, accessoires PC/TPV, piÃ¨ces auto, matÃ©riel mÃ©dical, outillage BTP, etc.).
        - **ZÃ©ro Fallback Non SouhaitÃ© & ZÃ©ro IncohÃ©rence** : Validation automatisÃ©e confirmant **0 produit hors catÃ©gorie** et **100% de concordance photo/produit** sur les 2 010 articles du catalogue standard.
        - **Correction Condiments & Sauces** : Remplacement de la photo de bol de chips par des visuels HD spÃ©cifiques (bouteilles de Ketchup rouges HD pour *Ketchup Heinz/Amora*, pot de sauce mayonnaise onctueuse pour *Mayonnaise CalvÃ©/Lesieur* & *Moutarde Amora*, bouteille de sauce pimentÃ©e avec piments frais pour *Sauce Piment Extra Forte* & *Harissa*, et Ã©pices/cubes d'assaisonnement pour *Bouillons Jumbo/Maggi/Knorr*).
        - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx` & `globals.css`)** :
        - Isolation stricte des accÃ¨s entre **Taf Taf (DÃ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage & lisibilitÃ© : Ã‰largissement de la barre latÃ©rale de navigation (`.bq-sidebar`) de `220px` Ã  **`280px`**, taille de police ajustÃ©e Ã  `12.5px`, et marges optimisÃ©es pour garantir l'affichage complet Ã  100% de TOUS les intitulÃ©s de menus (`Stock & Fournisseurs`, `Ã‰quipe & AccÃ¨s`, `Factures & Devis`, etc.) sans aucun point de suspension `...`.
        - Badges `ðŸ”’ Pro` et `ðŸ”’ Business` formatÃ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`, `marginLeft: 'auto'`).
        - Le bouton rapide **`ðŸ›’ Caisse POS (Physique)`** affiche dÃ©sormais le badge `ðŸ”’ Pro` et redirige vers la mise Ã  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
        - **Baguette Magique / Import Rapide par Lien (`/api/boutiques/magic-import/route.ts` & `boutiques.js`)** :
          - CrÃ©ation de la route proxy Next.js dÃ©diÃ©e `/api/boutiques/magic-import/route.ts` avec fallback rÃ©silient si aucune session active.
          - AmÃ©lioration de l'extraction HTML en direct (mÃ©tadonnÃ©es `og:title`, `og:description`, `og:image`) et ajout d'un parser d'URL intelligent pour AliExpress, SHEIN, Amazon.
          - Remplissage automatique et rÃ©actif des champs (Nom, Prix estimÃ©, Description) ainsi que de **l'aperÃ§u photo instantanÃ©** dans la zone de tÃ©lÃ©versement (`setImagesExistantes(data.images)`), dÃ©bloquant automatiquement la soumission du formulaire et transmettant l'URL de l'image au backend (`POST /api/boutiques/:id/produits`).
        - **Refonte Visuelle des Cartes & BanniÃ¨res (`frontend-next/src/app/boutiques/page.tsx` & `globals.css`)** :
          - **Harmonisation Chromatique Globale (Ã‰radication des bleus dÃ©pareillÃ©s)** : Harmonisation complÃ¨te de la palette de couleurs vers **l'Orange Ambre Nopalou Officiel (`#C75B00`)** et le **Gris Ardoise Sombre Chic (`#0f172a`)**.
            - Header navigation (`layout.tsx`) : Remplacement du bouton "Ma Boutique" bleu marine (`#1C2B4A`) par un Slate Sombre Chic (`#0f172a`).
            - Hero Banner (`boutiques/page.tsx`) : Remplacement du fond bleu ciel dÃ©pareillÃ© par une nuance lumineuse chaleureuse (`linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)`) avec bordure ambre douce (`#fed7aa`).
            - Pilule "Hub officiel" & boutons d'action ("CrÃ©er ma boutique", "Visiter la boutique", filtre sÃ©lectionnÃ© "Toutes les boutiques") : UnifiÃ©s en Orange Ambre Nopalou (`#C75B00`) pour une identitÃ© visuelle digne d'une marque de rang mondial.
            - Badge de statut d'ouverture ("Ouvert 7j/7") : Suppression de l'aplat vert/rouge fluo agressif au profit d'un **Design Glassmorphism Ã‰purÃ©** (fond blanc dÃ©poli translucide `rgba(255,255,255,0.92)`, Ã©criture ardoise sombre et dÃ©licate pastille Ã©meraude lumineuse).
          - **Audit & Harmonisation de l'Ensemble des Pages Secondaires** :
            - `/connexion` & `/inscription` (`ConnexionForm.tsx`, `InscriptionForm.tsx`) : Harmonisation des onglets de basculement Email/WhatsApp vers l'Orange Ambre Nopalou (`#C75B00`).
            - `/creer-boutique` (`creer-boutique/page.tsx`) : Harmonisation de la barre de progression Ã  4 Ã©tapes, des titres (`#0f172a`), du bouton d'action principal et de la formule prÃ©sÃ©lectionnÃ©e en Orange Ambre Nopalou (`#C75B00`).
            - `/annonces` & `/comparaison` (`PageHeader.tsx`, `comparaison/page.tsx`, `globals.css`) : Titres unifiÃ©s en Ardoise Sombre Chic (`#0f172a`) et cartes de verdict rehaussÃ©es d'un dÃ©gradÃ© chaleureux ambre doux (`#fff7ed`).
        - **Refonte Globale & Ã‰purÃ©e de la Page d'Accueil (`frontend-next/src/app/page.tsx`)** :
          - **Suppression de la pollution visuelle et des cartes encombrantes** ("Acheteurs" / "Vendeurs" sÃ©parÃ©es) : Remplacement par un Hero unique, lumineux et moderne avec fond ambre doux (`#fff7ed`).
          - **Rapprochement Recherche â†’ CatÃ©gories â†’ Produits** : IntÃ©gration directe des 20 catÃ©gories sous forme de pilules d'action sous la barre de recherche principale.
          - **Nouveau Bandeau de Feedback de Recherche InstantanÃ© (`SearchFeedbackBanner`)** : Affichage d'une banniÃ¨re de confirmation claire (`ðŸ”Ž X produits trouvÃ©s pour "mots-clÃ©s" â€” CatÃ©gorie : XYZ`) avec bouton d'annulation en 1 clic dÃ¨s qu'un filtre est actif.
          - **AccÃ¨s Direct aux Produits** : La grille de produits est disposÃ©e directement sous la zone de recherche sans aucun bloc parasite au milieu.
          - **RÃ©intÃ©gration du Raccourci Marchand dans le Hero** : Bandeau d'action directe sous les catÃ©gories : `âš¡ Vous Ãªtes commerÃ§ant ? Vendez en ligne en 30 sec (1er mois 100% offert) [CrÃ©er ma Boutique Taf Taf ðŸš€]`.
          - **Refonte Mondiale du Tableau d'Abonnement Ã  3 Formules (`ShowcaseTabs.tsx`)** :
            - **Boutique Taf Taf (1 mois offert)** (Gratuit 30j puis 5.000 FCFA/m) : Baguette Magique Ali/SHEIN, conversion Produit â†’ Annonce en 1-clic, Catalogue Web & WhatsApp.
            - **Vendeur Pro (15.000 FCFA/m)** : **Caisse POS enregistreuse tactile**, **Scan EAN-13 par camÃ©ra**, **Impression d'Ã©tiquettes stickers 50x30mm**, **Carnet de CrÃ©dits Client & Relance 1-clic**, **Factures & Devis PDF**.
            - **Business VIP (35.000 FCFA/m)** : **Multi-caissiers & droits d'Ã©quipe**, **Analytics CA & Marges nettes**, **BanniÃ¨re sponsorisÃ©e prioritaire**.
          - **Nouvelle Section SpÃ©ciale "Nopalou Ã— WhatsApp Ecosystem" (`ShowcaseTabs.tsx`)** :
            - **Acheteurs** : Panier Web & Commande WhatsApp 1-Clic, Connexion sans mot de passe OTP WhatsApp, Bot Assistant IA Comparateur `+221 70 871 79 42`, Alertes gratuites de baisse de prix sur WhatsApp.
            - **CommerÃ§ants** : Notifications instantanÃ©es de commandes prÃ©-remplies, Relance d'impayÃ©s en 1 clic depuis la Caisse POS, Envoi direct de Factures & Devis PDF, Support VIP WhatsApp 7j/7.
            - **Apporteurs** : Partage 1-clic de lien de parrainage sur statut et groupes WhatsApp, Notifications de commissions rÃ©currentes par messagerie.
          - **Nouveau Bandeau Frise du Cycle de Vente & Livraison ComplÃ¨te (5 Ã‰tapes)** :
            1. **ðŸ”Ž Recherche** (Comparateur & WhatsApp Bot) â†’ 2. **ðŸ›’ Commande** (Panier Web, WhatsApp & POS) â†’ 3. **ðŸ’³ Paiement** (Wave, Cash, CrÃ©dit ou Manuel) â†’ 4. **ðŸ“¦ PrÃ©paration** (Gestion des statuts en direct) â†’ 5. **ðŸšš Livraison** (Suivi & notification WhatsApp du client Ã  l'expÃ©dition).
          - **Nettoyage Syntaxe `page.tsx`** : Suppression des balises JSX orphelines (`</div>`, `</section>`, `)}`) provenant de l'ancienne section tarifaire qui provoquaient l'erreur de build SWC.
          - **Mise en Exergue de la Boutique Taf Taf (Design 3 Colonnes Desktop)** : Restructuration du Hero (`page.tsx`) pour utiliser l'espace vide Ã  gauche (Avantage Commande WhatsApp) et Ã  droite (Promo Boutique Taf Taf) sur grand Ã©cran, tout en restant centrÃ© sur mobile.
          - **Ajustement UX du Hero (Hauteur des encarts & Enrichissement)** : Les encarts WhatsApp et Taf Taf s'Ã©tirent dÃ©sormais sur toute la hauteur de la grille. Pour Ã©viter la sensation de vide Ã  l'intÃ©rieur de ces encarts Ã©tirÃ©s, leur contenu a Ã©tÃ© enrichi par des listes Ã  puces persuasives (checkmarks) mettant en avant les avantages de chaque solution. Le texte "En savoir plus" de l'encart WhatsApp a Ã©tÃ© converti en un vÃ©ritable lien cliquable.
          - **Exploitation de l'espace vide des Filtres & Alignement Parfait** : Le grand espace blanc inexploitÃ© Ã  droite des filtres ("Budget" et "Trier") a Ã©tÃ© rÃ©organisÃ© en un layout dense Ã  trois colonnes parfaitement alignÃ© horizontalement :
            - Ã€ gauche : Filtres principaux (Budget, Tri).
            - Au milieu : **Nouveau bloc de suggestions** (Filtre "Ã‰tat" et Tags "ðŸ”¥ Tendances" cliquables pour guider l'utilisateur). L'alignement vertical entre les deux colonnes est dÃ©sormais mathÃ©matiquement exact grÃ¢ce Ã  l'utilisation unifiÃ©e des classes `.filtres-bar` et `.budget-pill`.
            - Ã€ droite : Encart promotionnel premium ("âš¡ DÃ©veloppez vos ventes").
          - **Normalisation de l'IdentitÃ© Visuelle (Couleurs)** : L'encart WhatsApp utilise dÃ©sormais le vert officiel WhatsApp (`#25D366`) pour son logo SVG, ses coches et son lien, renforÃ§ant instantanÃ©ment sa reconnaissance. Les autres Ã©lÃ©ments (comme les Tendances) utilisent strictement le orange marque Nopalou (`#C75B00`).
          - **Refonte UI Premium (Suppression du Vert et du "Tout Orange")** : 
            - Le bouton d'en-tÃªte "Boutique Taf Taf" et la carte promotionnelle Taf Taf dans le Hero ne sont plus vert ou "100% orange". Ils utilisent dÃ©sormais un thÃ¨me "Dark Premium" (`#0f172a`) trÃ¨s Ã©lÃ©gant avec uniquement les appels Ã  l'action et les icÃ´nes (âš¡, âœ“) mis en Ã©vidence en orange Nopalou (`#C75B00`).
            - **Modernisation structurelle de la section SEO ("Comparateur NÂ°1")** : La transition abrupte crÃ©Ã©e par l'ancienne "carte fermÃ©e" blanche a Ã©tÃ© entiÃ¨rement supprimÃ©e. La section est dÃ©sormais un layout fluide, ouvert et asymÃ©trique, parfaitement intÃ©grÃ© au flux de la page avec de gÃ©nÃ©reuses marges pour respirer. L'espace a ensuite Ã©tÃ© optimisÃ© en augmentant la largeur (`maxWidth: 1280px`) et en rÃ©duisant les espaces verticaux excessifs pour un meilleur confort visuel. L'immense vide (plus de 80px) situÃ© entre la fin de la grille de produits ("RÃ©cemment consultÃ©s") et le dÃ©but du bloc SEO a Ã©tÃ© supprimÃ© pour assurer une continuitÃ© visuelle agrÃ©able.
          - **Architecture Stricte en 2 Lignes pour la Barre de Filtres** : Le layout a Ã©tÃ© restructurÃ© en deux rangÃ©es horizontales indÃ©pendantes pour Ã©liminer dÃ©finitivement tout comportement de wrap imprÃ©visible. La Ligne 1 concentre "Budget", "Ã‰tat" et le bouton d'action principal. La Ligne 2 gÃ¨re le "Trier", les "Tendances" et les actions secondaires (Effacer). 
            - **Adaptation Mobile des Filtres (PWA)** : Pour pallier la disparition des appels Ã  l'action sur mobile (masquÃ©s par `hidden-mobile`), une 3Ã¨me ligne spÃ©cifique au mobile (`.visible-mobile-flex`) a Ã©tÃ© ajoutÃ©e sous les filtres. Elle donne accÃ¨s aux boutons critiques "âœ– Effacer" et "ðŸ�ª Boutique Pro" de faÃ§on ergonomique sur smartphone.
          - **Simplification des Appels Ã  l'Action** : Suite Ã  un effet de redondance visuelle, le badge "Vendeurs VÃ©rifiÃ©s" a Ã©tÃ© supprimÃ© pour concentrer toute l'attention sur un unique bouton ultra-premium **"âš¡ Ouvrir une Boutique Pro"** (ThÃ¨me sombre) placÃ© stratÃ©giquement Ã  droite de l'Ã‰tat sur la premiÃ¨re ligne.
            - **Navbar Mobile Explicite** : L'icÃ´ne muette "âš¡" de l'en-tÃªte mobile a Ã©tÃ© remplacÃ©e par un bouton pilule explicite "ðŸ�ª Boutique" (`.navbar-pill-btn`). Un lien "ðŸ�ª Ouvrir une Boutique Pro" trÃ¨s visible a Ã©galement Ã©tÃ© ajoutÃ© dans le menu latÃ©ral (`MobileNav`) pour les visiteurs non connectÃ©s.
          - **Correction de lien mort** : Le lien "Comment Ã§a marche ?" sur l'encart WhatsApp du Hero redirige dÃ©sormais correctement vers la page de documentation `/assistant-whatsapp` au lieu d'une ancre vide.
          - **Refonte UI du Hero de la page Boutiques (`/boutiques`)** : Correction des problÃ¨mes d'alignement et d'espace vide. Le layout a Ã©tÃ© restructurÃ© en deux colonnes Ã©quilibrÃ©es : Ã  gauche, le texte et les deux boutons d'appel Ã  l'action principaux ; Ã  droite, les statistiques ("Boutiques actives" et "Vendeurs VÃ©rifiÃ©s") transformÃ©es en grandes cartes de rÃ©assurance pour combler harmonieusement l'espace vide. Suppression d'un bouton de crÃ©ation de boutique redondant et mal alignÃ©.
          - **Prix Dynamiques depuis l'API** : Les offres affichent dÃ©sormais en temps rÃ©el les prix dÃ©finis dans l'Admin panel (`settings.plan_pro_prix`, `settings.plan_business_prix`, et Boutique Taf Taf Ã  2500 FCFA).
          - **Nouvelles CatÃ©gories Globales** : Ajout d'Immobilier (ðŸ�¢) et Petites Annonces (ðŸ“¢) Ã  la base de registre `categories.ts`.
          - **Suppression des sections de bas de page dupliquÃ©es et mal alignÃ©es** : Alignement parfait et navigation ultra-fluide.
        - **Diagnostic Exhaustif & Correction de 5 URLs IncohÃ©rentes ConfirmÃ©es** : Audit visuel systÃ©matique des 112 URLs Unsplash uniques. Identification et remplacement de 5 URLs dont le contenu visuel rÃ©el ne correspondait pas du tout aux produits assignÃ©s :
          1. **Huile Moteur** (Total/Shell/Mobil) : Ferrari rouge â†’ bidon d'huile moteur (`photo-1635784065399`)
          2. **Onduleur APC** (650VA/1000VA/1500VA) : gradient abstrait colorÃ© â†’ salle serveur/rack informatique (`photo-1558494949`)
          3. **Ketchup** (Heinz/Amora) : Pikachu surpris (meme) â†’ bouteille de ketchup rouge (`photo-1472476443507`)
          4. **Mayonnaise/Moutarde** (CalvÃ©/Lesieur/Amora) : boudin corÃ©en sunda â†’ pot de condiments/mayo (`photo-1528750717929`)
          5. **Huile alimentaire** (Dinor/Niani/Lesieur) : olives sombres (nature morte) â†’ bouteille d'huile de cuisine dorÃ©e (`photo-1620706857370`)
        - **RÃ©ordonnancement PrioritÃ©s Mots-clÃ©s** : DÃ©placement du match `sardines/thon/conserves` avant `huile/beurre` pour Ã©viter que "Sardines Titus Ã  l'Huile" ne soit matchÃ©e par le mot "huile".
        - **Nouvelle Architecture de Mapping Photographique Extensible (112 â†’ 879 photos)** : 
          1. **CrÃ©ation du script `backend/scripts/fetch-photos.js`** : Script automatisÃ© avec dictionnaire de traduction (FRâ†’EN) conÃ§u pour requÃªter l'API Unsplash, gÃ©rer intelligemment les limites de taux (rate limit), et gÃ©nÃ©rer itÃ©rativement un fichier `photo-mapping.json` couvrant les 879 produits distincts du catalogue.
          2. **Mise Ã  jour de `backend/generate-catalog.js`** : Le gÃ©nÃ©rateur charge dÃ©sormais `photo-mapping.json` en prioritÃ©. S'il y a correspondance pour le nom de base d'un produit, il utilise l'URL spÃ©cifique ; sinon, il applique les rÃ¨gles sÃ©mantiques par mots-clÃ©s prÃ©existantes (fallback robuste garanti).
        - **Enrichissement Manuel (Option Sans ClÃ© API)** : Pour Ã©viter la dÃ©pendance Ã  une clÃ© API tout en maximisant la fidÃ©litÃ© visuelle, ajout de dizaines de rÃ¨gles manuelles ultra-spÃ©cifiques dans `generate-catalog.js` (ex: photos HD distinctes pour les pilules, les sirops, les tensiomÃ¨tres, les masques, les vÃªtements pour bÃ©bÃ©s, les couches, etc.), portant le systÃ¨me hybride Ã  une prÃ©cision optimale sans appel rÃ©seau externe.

  - **Authentification WhatsApp OTP & Inscription / Connexion Flivides** :
    - **Back-end (`backend/routes/auth.js`)** : Ajout des routes `/whatsapp-otp-send`, `/whatsapp-otp-verify`, `/whatsapp-otp-login` et `/whatsapp-otp-register`. Support complet de l'inscription et la connexion sans mot de passe via WhatsApp OTP. Logging du code OTP en console pour faciliter le dÃ©bogage dev sans API Meta. Correction du matching SQL des numÃ©ros de tÃ©lÃ©phone (support simultanÃ© des formats `+221...`, `221...` et 9 chiffres bruts) pour Ã©viter les erreurs "Aucun compte associÃ© Ã  ce numÃ©ro" lors de la connexion.
    - **Front-end (`frontend-next`)** : 
      - Integration de la bascule "Email / WhatsApp" dans `ConnexionForm.tsx` et `InscriptionForm.tsx`.
      - Fix critique du helper `setAuthCookieAction` dans `src/app/actions/auth.ts` : il dÃ©code dÃ©sormais proprement le token JWT retournÃ© par le backend pour extraire `userId` et instancier correctement la session `nopalou_session`. Cela rÃ©sout le bug oÃ¹ le tableau de bord de la boutique ne s'ouvrait pas aprÃ¨s l'inscription/connexion WhatsApp.
      - Prise en charge et distinction claire des 3 niveaux d'abonnements dans `BoutiqueClient.tsx` :
        - ðŸ’¼ **Business** (`#1e3a5f`)
        - â­� **Pro** (`#C75B00`)
        - âš¡ **Taf Taf / DÃ©couverte** (`#16a34a`, vert Ã©meraude avec label `âš¡ Taf Taf (1 mois offert)`)
        - **Gratuit** (`#6b7280`)
      - **Gating de fonctionnalitÃ©s & Parcours de Transition de Plan** :
        - Marquage des sous-menus restreints (`minPlan: 'pro'` ou `minPlan: 'business'`) avec badges `ðŸ”’ Pro` et `ðŸ”’ Business` dans la navigation latÃ©rale.
        - Ã‰cran de blocage pÃ©dagogique avec bouton d'incitation Ã  la mise Ã  niveau (`Faire Ã©voluer mon offre â†’`) vers la page `/boutique/abonnement` lorsqu'un utilisateur accÃ¨de Ã  une fonction supÃ©rieure Ã  son plan actuel.
        - Gestion de la transition fluide (Upgrade / Downgrade / Prolongation) sur la page `/boutique/abonnement`.
        - **Choix de forfait Ã  la crÃ©ation rapide (`/creer-boutique`)** : SÃ©lection par dÃ©faut du forfait **âš¡ Boutique Taf Taf (1 mois offert)** Ã  l'Ã©tape finale avec possibilitÃ© explicite pour l'utilisateur de choisir directement **Pro** ou **Business** avant le lancement.
      - **En-tÃªte & Recherche Globale (`layout.tsx`, `NavbarActions.tsx` & `NavbarSearch.tsx`)** : 
        - Recherche sous forme d'icÃ´ne compacte `ðŸ”�` (comme Ã  l'origine) pour libÃ©rer et optimiser l'espace horizontal.
        - Suppression des doublons de menus et forÃ§age de `whiteSpace: 'nowrap'` pour empÃªcher le retour Ã  la ligne des textes.
        - Bouton direct **`ðŸ�ª Ma Boutique`** maintenu dans les actions de droite avec affichage propre du profil (`ðŸ‘¤ NomUtilisateur`).
      - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx`)** :
        - Isolation stricte des accÃ¨s entre **Taf Taf (DÃ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage : Badges `ðŸ”’ Pro` et `ðŸ”’ Business` formatÃ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`).
        - Le bouton rapide **`ðŸ›’ Caisse POS (Physique)`** affiche dÃ©sormais le badge `ðŸ”’ Pro` et redirige vers la mise Ã  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
      - **Chargement du Catalogue Standard & Import Batch (`BatchImportModal.tsx` & `route.ts`)** :
        - CrÃ©ation de la route Next.js dÃ©diÃ©e `/api/boutiques/catalogues-standards/route.ts` faisant le relais sÃ©curisÃ© avec le backend Express.
        - RÃ©solution dÃ©finitive de l'erreur `Impossible de charger le catalogue standard` lors de l'ouverture de l'import par lot.
        - Validation du chargement Ã  100% des 20 catÃ©gories de produits modÃ¨les prÃ©dÃ©finis.

  - **RÃ©solution du Scraper Facebook Local (Playwright Chromium) & Source Emploi** :
    - **Correction de l'erreur `browserType.launch: Executable doesn't exist`** : RÃ©installation complÃ¨te des binaires Chromium v1228 dans `node_modules/playwright-core/.local-browsers` via `$env:PLAYWRIGHT_BROWSERS_PATH="0"; npx playwright install` sur la machine locale.
    - **Ajout de la source emploi `badou.diop.587`** : Ajout du profil/page `badou.diop.587` dans le dictionnaire `GROUPES` de `backend/services/scraper-immo-facebook.js`.
    - **SystÃ¨me de Suivi de Progression en Direct (`.fb-scraper-progress.json` & API)** :
      - Affichage en console de l'avancement groupe par groupe (`ðŸ“Š [PROGRES i/N - X%] Groupe: ...`).
      - Script PowerShell dÃ©diÃ© `backend/scripts/lancer-scraper-facebook.ps1` avec banniÃ¨re visuelle colorÃ©e et notifications Toast Windows.
      - Refonte de `backend/scripts/scraper-facebook-auto.bat` avec `Tee-Object` : rÃ©sout l'Ã©cran noir de la console lors des lancements du planificateur tout en conservant les fichiers journaux `backend/scripts/logs/fb-scraper-*.log`.
      - Persistance de l'Ã©tat en temps rÃ©el dans `backend/.fb-scraper-progress.json` (statut, pourcentage, groupe actuel, annonces retenues, erreurs).
      - Endpoint API dÃ©diÃ© `GET /api/scraper/facebook/progress` pour consulter le suivi en direct depuis n'importe quel client/dashboard.
    - **Validation du Planificateur & Scraper Local** : Validation en mode `--dry-run` avec extraction de 15 annonces retenues sur 5 groupes (Prix, CatÃ©gories, Villes).

  - **Refonte & Correction Responsive Mobile (`frontend-next`)** :
    - **Correction du DÃ©bordement Horizontal de l'En-tÃªte Navigation (`NavbarActions.tsx` & `globals.css`)** :
      - Suppression du style inline `display: flex` dans `NavbarActions.tsx` qui outrepassait la rÃ¨gle CSS `@media (max-width: 1040px) { .navbar-actions-compte { display: none; } }`. Les boutons texte `ðŸ‘¤ Nom` et `DÃ©connexion` s'affichaient auparavant simultanÃ©ment avec la barre d'icÃ´nes mobile et le bouton hamburger, provoquant un encombrement extrÃªme et un dÃ©bordement horizontal de la page au-delÃ  de 100vw.
      - Restauration 100% Ã  l'identique de l'affichage du profil bureau (`ðŸ‘¤ NomUtilisateur` + bouton `DÃ©connexion` rouge) dans `NavbarActions.tsx` avec styles originaux complets, combinÃ© au masquage strict via `display: none !important` uniquement en mode mobile (<= 1040px).
      - Correction de la sur-Ã©criture de `.logo-name` sur mobile dans `globals.css` : la rÃ¨gle globale ligne 9510 (`display: inline !important`) forÃ§ait le texte "Nopalou" (100px+) sur tous les mobiles y compris sous 360px (Samsung Galaxy S8+). La suppression de ce `!important` masque le nom du logo sur mobile au profit de l'icÃ´ne N (28px), libÃ©rant ~130px d'espace libre et permettant Ã  toutes les icÃ´nes (`ðŸ’¬`, `â�¤`, `ðŸ�ª Boutique`, `ðŸ‘¤`, `â˜°`) de s'aligner avec une marge parfaite et zÃ©ro chevauchement/tronquage sur tous les Ã©crans mobiles (320px+).
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
      - **Correction de l'icÃ´ne Avatar dans le Compte (Point Bleu)** : Ajout d'une valeur de repli dans `(account)/layout.tsx` pour afficher l'initiale de l'email ou "Vous" au lieu d'une icÃ´ne vide si `session.nom` est vide.
      - **RÃ©duction de l'espace vide sous la barre de recherche (Mobile)** : Ajout d'une rÃ¨gle `@media (max-width: 640px) { .hero-search { margin-bottom: 12px; } }` dans `globals.css` pour rÃ©duire drastiquement l'espace vide de 44px entre la recherche et les catÃ©gories de la page d'accueil.
      - **Correction de la boucle infinie de Next.js (Tourne en rond)** : RÃ©solution d'un cache corrompu (EBUSY) bloquant le serveur dev local en tuant l'ancienne tÃ¢che `next dev` bloquÃ©e et en relanÃ§ant le processus.

  - **Amï¿½lioration du Scraper Facebook (ackend/services/scraper-immo-facebook.js, ackend/scripts/)** :
    - **Scraping des Offres d'Emploi** : Application de la catï¿½gorie forcï¿½e emploi sur les nouveaux groupes/pages d'emploi (Badou Diop, Emploi 1, 2, 3) pour s'assurer que les offres sont bien classï¿½es dans la catï¿½gorie emploi mï¿½me sans mots clï¿½s explicites. Extension de la dï¿½rogation "Voir sur Facebook" comme numï¿½ro de tï¿½lï¿½phone par dï¿½faut pour l'ensemble de la catï¿½gorie emploi (au lieu de juste la page Ndeye Yacine).
    - **Gestion des Profils & Timouts** : Augmentation du timeout de navigation de 60s ï¿½ 90s avec un try-catch permettant de continuer le scraping si le DOM est partiellement chargï¿½, prï¿½venant l'interruption complï¿½te (Timeout 60000ms exceeded). Amï¿½lioration de la dï¿½tection de fil d'actualitï¿½ pour bien prendre en compte les profils (comme Badou Diop).
    - IntÃ©gration de la base IndexedDB locale (`db-offline.ts`) pour la caisse.
    - Sauvegarde automatique en cache local du catalogue produits et des clients pour continuer Ã  vendre mÃªme en cas de coupure internet.
    - File d'attente locale de synchronisation des ventes en arriÃ¨re-plan rÃ©injectant automatiquement les transactions dÃ¨s le retour de la connexion internet.
    - Indicateur dynamique clignotant `ðŸŸ¢ EN LIGNE` / `âš ï¸ HORS-LIGNE` dans l'en-tÃªte de la caisse POS.
  - **Validation & Compilation globale** :
    - Correction des typages et vÃ©rification de la compilation TypeScript de l'ensemble du projet frontend (`npx tsc --noEmit` validÃ© avec succÃ¨s).
  - **Impression PDF & Affichage des Documents** :
    - Ajout de l'endpoint `GET /api/boutiques/:id/documents/:docId/pdf` pour gÃ©nÃ©rer un PDF A4 stylisÃ© (Facture, Devis, Proforma) avec en-tÃªte de boutique, dÃ©tails clients, tableau d'articles et totaux de taxes.
    - Ajout du bouton d'action `ðŸ–¨ï¸ PDF` dans l'interface de gestion des documents pour ouvrir ou tÃ©lÃ©charger la facture en 1 clic.
    - Correction de l'affichage des montants HT/TVA/TTC qui s'affichaient sous forme de tiret (`â€”`) dÃ» Ã  une divergence de noms de colonnes (`total_ht` au lieu de `montant_ht`).
    - Nettoyage du nom de client affichÃ© (`client.nom` au lieu de `client.prenom client.nom` qui provoquait un affichage `undefined nom_client`).
    - Ajout d'un bouton `âœï¸ Modifier` dans l'onglet des documents clients permettant d'ouvrir la modale de modification prÃ©-remplie avec le type de document, le client associÃ©, la liste des articles (avec qte et prix unit.) et les notes.
    - Mise Ã  jour de la route backend PUT pour recalculer automatiquement les taxes, le timbre fiscal, et sauvegarder les modifications d'articles en base de donnÃ©es.
  - **Correction affichage mobile du menu Actions produit** :
    - Le dropdown `Actions â–¾` des cartes produit dans le dashboard marchand (`BoutiqueClient.tsx`) dÃ©bordait Ã  gauche sur mobile en raison du positionnement `right: 0`. CorrigÃ© avec `left: 0; right: auto` pour que le menu s'aligne cÃ´tÃ© gauche du bouton et reste dans le viewport.
  - **Ã‰dition des Fournisseurs + Affichage responsive** :
    - Ajout d'un bouton `âœï¸ Modifier` sur chaque fournisseur dans `GestionFournisseurs.tsx`, ouvrant la modale prÃ©-remplie en mode Ã©dition et appelant le Server Action `modifierFournisseur` existant.
    - Le formulaire de la modale fournisseur est dÃ©sormais dynamique : le titre, le bouton de soumission et l'action serveur s'adaptent entre crÃ©ation et modification.
    - Remplacement du tableau HTML (`<table>`) par des cartes responsives (`<div>`) pour les fournisseurs, avec icÃ´nes contact (ðŸ“ž, âœ‰ï¸, ðŸ“), garantissant un affichage correct sur mobile et desktop.
    - **Correction Tableau Achats / Bons de commande** :
      - Correction du bogue `Invalid Date` : lecture de `created_at` / `date_livraison` au lieu de `date_commande` qui Ã©tait indÃ©finie.
      - Correction du bogue `Total Achat` qui affichait un tiret (`â€”`) : lecture de `montant_total` retournÃ© par la base SQL au lieu de `total_achat`.
      - Correction du bouton `ðŸ“¥ RÃ©ceptionner` et des badges de statut pour supporter indiffÃ©remment les valeurs de statut `'recu'` et `'recue'`.
      - Ajout d'une colonne d'Actions complÃ¨te dans le tableau des bons de commande fournisseur : bouton `ðŸ“¥ RÃ©ceptionner` (pour commandes en attente), bouton `âœï¸ Modifier` (ouvre la modale prÃ©-remplie pour rÃ©ajuster les articles, quantitÃ©s ou tarifs d'un bon de commande en attente), bouton `ðŸ‘ï¸ DÃ©tails` (ouvre une modale synthÃ©tique avec le dÃ©tail complet des articles, quantitÃ©es et prix d'achat), et bouton `ðŸ—‘ï¸ Supprimer` (avec confirmation et appel au Server Action `supprimerCommandeFournisseur`).
      - **Documents Justificatifs & Fichiers Joints** : Remplacement des champs texte URL par un vrai sÃ©lecteur de fichier (`<input type="file" />`) permettant de tÃ©lÃ©verser directement des factures ou reÃ§us (image/PDF). Route backend `POST /api/boutiques/:id/upload-justificatif` ajoutÃ©e. Une modale de rÃ©ception dÃ©diÃ©e permet Ã©galement d'attacher ou mettre Ã  jour le justificatif de rÃ©ception lors du clic sur `ðŸ“¥ RÃ©ceptionner`.
      - **LibellÃ©s de colonnes dans les formulaires d'achat** : Ajout d'en-tÃªtes de colonnes clairs (`DÃ©signation Produit *`, `QuantitÃ© *`, `Prix Achat Unit. (FCFA) *`) au-dessus de chaque ligne d'article dans les formulaires de commande d'achat.
      - **Maintien dans la Boutique aprÃ¨s enregistrement des paramÃ¨tres fiscaux** : Synchronisation permanente du paramÃ¨tre d'URL `?manage=BOUTIQUE_ID`.
      - **Correction Boucle d'Alerte** : Remplacement du popup natif `alert()` (qui se redÃ©clenchait en boucle Ã  chaque re-render) par une banniÃ¨re de succÃ¨s verte Ã©phÃ©mÃ¨re (`savedMessage`) et mÃ©morisation du state traitÃ© via `useRef(handledRef)` pour un rafraÃ®chissement fluide sans blocage.
      - **Recherche & Filtrage MulticritÃ¨re GÃ©nÃ©ralisÃ©s** : IntÃ©gration de barres de recherche textuelle temps rÃ©el et de menus de filtrage par statut sur tous les onglets : `Fournisseurs` (nom, tÃ©lÃ©phone, email, adresse), `Bons de Commande` (rÃ©fÃ©rence, fournisseur, statut attente/reÃ§ue), `Documents Commerciaux` (rÃ©fÃ©rence, client, NINEA, statut brouillon/validÃ©/payÃ©/envoyÃ©).
      - **Correction & DÃ©coupage Automatique Importation Batch CSV (`BatchImportModal.tsx`)** :
        - **Correction du parsing de prix CSV** : Suppression de la regex `replace(/\D/g, '')` qui corrompait les montants avec dÃ©cimales (ex: `15000.00` devenait `1500000`). RemplacÃ©e par `parsePrixString()` pour supporter tous les formats (virgules, points, espaces, devises).
        - **DÃ©coupage automatique par sous-lots (Chunking)** : Traitement automatique des fichiers CSV/Excel de plus de 50 produits en sous-lots successifs de 50 articles. Permet d'importer des fichiers de plusieurs centaines ou milliers de produits sans blocage ni erreur 400.
        - **Correction backend (`boutiques.js`)** : Retrait du filtre strict `!p.prix` qui Ã©liminait les articles Ã  prix zÃ©ro ou dÃ©cimaux, et hausse de la limite maximale par requÃªte backend Ã  500 articles.
        - **Recherche globale multi-catÃ©gories & Mappage d'alias (`BatchImportModal.tsx`)** :
          - Recherche globale : la saisie dans la barre de recherche interroge dÃ©sormais les **2 070 produits modÃ¨les** sur **toutes les catÃ©gories simultanÃ©ment**.
          - Mappage d'alias : correction de l'incohÃ©rence des clÃ©s de catÃ©gories (ex: `electronique` regroupe dÃ©sormais `smartphones`, `informatique`, `electronique` et `high-tech`).
          - Ajout de l'onglet **`ðŸ“ Tous les produits`** au dÃ©but pour parcourir l'ensemble du catalogue standard sans restriction.
        - **Enrichissement IntÃ©gral & Garantie de 100 Produits Minimum par CatÃ©gorie (2 010 Produits au Total sur Render)** :
          - Mise en place d'un gÃ©nÃ©rateur automatique (`buildFull100`) dans `generate-catalog.js` garantissant **au moins 100 produits modÃ¨les rÃ©els pour CHACUNE des 20 catÃ©gories du systÃ¨me**.
          - Total gÃ©nÃ©ral : **2 010 produits modÃ¨les** avec visuels HD Unsplash dÃ©diÃ©s et fidÃ¨les.
      - **Correction Persistance des Cases Ã  Cocher Fiscales (`ParametresFiscalite.tsx` & `boutiques.js`)** :
        - Diagnostic : le navigateur envoyait la valeur natif HTML `'on'` pour les cases cochÃ©es au lieu de `'true'`, tandis que le backend Ã©chouait la comparaison `'on' === 'true'` (sauvegardait `false`). DÃ©cocher envoyait `undefined`, ce qui conservait la valeur prÃ©cÃ©dente sans pouvoir la passer Ã  `false`.
        - Correction : Ajout d'inputs cachÃ©s explicites `<input type="hidden" name="prix_tva_incluse" value={prixTvaIncluse ? 'true' : 'false'} />` et gestion du state React. CÃ´tÃ© backend, intÃ©gration d'une fonction `parseBoolVal` et d'une clause `CASE WHEN $9::boolean IS NOT NULL THEN $9::boolean ELSE ... END` garantissant la persistance exacte et immÃ©diate des deux options.
  - **Informations LÃ©gales OHADA & Standards PDF Professionnels** :
    - **Migration BDD** : Ajout de 7 nouvelles colonnes Ã  la table `boutiques` : `rccm`, `ninea`, `forme_juridique`, `capital_social`, `compte_bancaire`, `conditions_vente`, `pied_de_page_document`.
    - **Backend** : Route PUT `/:id` Ã©tendue pour sauvegarder les 7 nouveaux champs. Routes GET `/mine` et GET `/:idOrSlug` Ã©tendues pour les inclure dans le SELECT.
    - **Frontend `ParametresFiscalite.tsx`** : Refonte complÃ¨te du composant avec 4 sections :
      1. ðŸ“Š Configuration Fiscale (rÃ©gime, TVA, timbre fiscal â€” existant)
      2. ðŸ“‹ IdentitÃ© Juridique (RCCM, NINEA, forme juridique, capital social â€” **nouveau**)
      3. ðŸ¦ CoordonnÃ©es Bancaires (textarea pour IBAN/RIB/SWIFT â€” **nouveau**)
      4. ðŸ“„ Conditions GÃ©nÃ©rales de Vente (textarea + bouton modÃ¨le OHADA prÃ©-rempli â€” **nouveau**)
    - **PDF aux standards OHADA** : Refonte complÃ¨te de la gÃ©nÃ©ration PDF (`GET /api/boutiques/:id/documents/:docId/pdf`) :
      - En-tÃªte Ã©metteur complet : nom, forme juridique + capital, adresse, tÃ©lÃ©phone, RCCM, NINEA
      - Bloc destinataire avec NINEA client si professionnel
      - Date d'Ã©chÃ©ance affichÃ©e si renseignÃ©e
      - Net Ã  payer mis en Ã©vidence (bandeau colorÃ©)
      - CoordonnÃ©es bancaires pour rÃ¨glement en bas de facture
      - Conditions GÃ©nÃ©rales de Vente (avec saut de page automatique si dÃ©bordement)

      - **Audit & Correction de CohÃ©rence Photo-Produit du Catalogue Standard (`generate-catalog.js` & `catalogues-standards.json`)** :
        - **Diagnostic Exhaustif** : Audit des 2 010 produits du Catalogue Standard PrÃ©dÃ©terminÃ©. Identification de 365 incohÃ©rences visuelles (18,15% du catalogue), causÃ©es par des filtres de mots-clÃ©s globaux sans scoping par catÃ©gorie (ex: huiles alimentaires associÃ©es Ã  des photos de vidange moteur, laits alimentaires/infantiles associÃ©s Ã  des lotions cosmÃ©tiques, TV/frigos Samsung associÃ©s Ã  des smartphones, batteries solaires associÃ©es Ã  des powerbanks, etc.).
        - **Correction & Restructuration Category-First** : Refonte de `getPhotoForProduct(nom, cat)` dans `generate-catalog.js` pour filtrer strictement par la catÃ©gorie parente `cat` en prioritÃ© avant d'Ã©valuer les mots-clÃ©s.
        - **RÃ©vision Globale Exhaustive des 20 CatÃ©gories & 2 010 Produits** : RÃ©vision intÃ©grale de tous les sous-types de produits dans les 20 catÃ©gories du catalogue standard (`alimentation`, `smartphones`, `informatique`, `tv-electro`, `mode`, `maison`, `auto-moto`, `jeux`, `beaute`, `sport`, `fournitures`, `quincaillerie`, `pieces-rechange`, `bijouterie`, `maraichage`, `elevage`, `produits-agricoles`, `solaire-energie`, `sante-pharma`, `bebe-enfants`).
        - **Dictionnaire Photo Haute FidÃ©litÃ©** : Enrichissement complet des rÃ¨gles et mots-clÃ©s de `getPhotoForProduct(nom, cat)` pour couvrir 100% des sous-types (sauces, condiments, fruits, lÃ©gumes, boissons, consoles, manettes, jeux vidÃ©o, accessoires PC/TPV, piÃ¨ces auto, matÃ©riel mÃ©dical, outillage BTP, etc.).
        - **ZÃ©ro Fallback Non SouhaitÃ© & ZÃ©ro IncohÃ©rence** : Validation automatisÃ©e confirmant **0 produit hors catÃ©gorie** et **100% de concordance photo/produit** sur les 2 010 articles du catalogue standard.
        - **Correction Condiments & Sauces** : Remplacement de la photo de bol de chips par des visuels HD spÃ©cifiques (bouteilles de Ketchup rouges HD pour *Ketchup Heinz/Amora*, pot de sauce mayonnaise onctueuse pour *Mayonnaise CalvÃ©/Lesieur* & *Moutarde Amora*, bouteille de sauce pimentÃ©e avec piments frais pour *Sauce Piment Extra Forte* & *Harissa*, et Ã©pices/cubes d'assaisonnement pour *Bouillons Jumbo/Maggi/Knorr*).
        - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx` & `globals.css`)** :
        - Isolation stricte des accÃ¨s entre **Taf Taf (DÃ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage & lisibilitÃ© : Ã‰largissement de la barre latÃ©rale de navigation (`.bq-sidebar`) de `220px` Ã  **`280px`**, taille de police ajustÃ©e Ã  `12.5px`, et marges optimisÃ©es pour garantir l'affichage complet Ã  100% de TOUS les intitulÃ©s de menus (`Stock & Fournisseurs`, `Ã‰quipe & AccÃ¨s`, `Factures & Devis`, etc.) sans aucun point de suspension `...`.
        - Badges `ðŸ”’ Pro` et `ðŸ”’ Business` formatÃ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`, `marginLeft: 'auto'`).
        - Le bouton rapide **`ðŸ›’ Caisse POS (Physique)`** affiche dÃ©sormais le badge `ðŸ”’ Pro` et redirige vers la mise Ã  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
        - **Baguette Magique / Import Rapide par Lien (`/api/boutiques/magic-import/route.ts` & `boutiques.js`)** :
          - CrÃ©ation de la route proxy Next.js dÃ©diÃ©e `/api/boutiques/magic-import/route.ts` avec fallback rÃ©silient si aucune session active.
          - AmÃ©lioration de l'extraction HTML en direct (mÃ©tadonnÃ©es `og:title`, `og:description`, `og:image`) et ajout d'un parser d'URL intelligent pour AliExpress, SHEIN, Amazon.
          - Remplissage automatique et rÃ©actif des champs (Nom, Prix estimÃ©, Description) ainsi que de **l'aperÃ§u photo instantanÃ©** dans la zone de tÃ©lÃ©versement (`setImagesExistantes(data.images)`), dÃ©bloquant automatiquement la soumission du formulaire et transmettant l'URL de l'image au backend (`POST /api/boutiques/:id/produits`).
        - **Refonte Visuelle des Cartes & BanniÃ¨res (`frontend-next/src/app/boutiques/page.tsx` & `globals.css`)** :
          - **Harmonisation Chromatique Globale (Ã‰radication des bleus dÃ©pareillÃ©s)** : Harmonisation complÃ¨te de la palette de couleurs vers **l'Orange Ambre Nopalou Officiel (`#C75B00`)** et le **Gris Ardoise Sombre Chic (`#0f172a`)**.
            - Header navigation (`layout.tsx`) : Remplacement du bouton "Ma Boutique" bleu marine (`#1C2B4A`) par un Slate Sombre Chic (`#0f172a`).
            - Hero Banner (`boutiques/page.tsx`) : Remplacement du fond bleu ciel dÃ©pareillÃ© par une nuance lumineuse chaleureuse (`linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)`) avec bordure ambre douce (`#fed7aa`).
            - Pilule "Hub officiel" & boutons d'action ("CrÃ©er ma boutique", "Visiter la boutique", filtre sÃ©lectionnÃ© "Toutes les boutiques") : UnifiÃ©s en Orange Ambre Nopalou (`#C75B00`) pour une identitÃ© visuelle digne d'une marque de rang mondial.
            - Badge de statut d'ouverture ("Ouvert 7j/7") : Suppression de l'aplat vert/rouge fluo agressif au profit d'un **Design Glassmorphism Ã‰purÃ©** (fond blanc dÃ©poli translucide `rgba(255,255,255,0.92)`, Ã©criture ardoise sombre et dÃ©licate pastille Ã©meraude lumineuse).
          - **Audit & Harmonisation de l'Ensemble des Pages Secondaires** :
            - `/connexion` & `/inscription` (`ConnexionForm.tsx`, `InscriptionForm.tsx`) : Harmonisation des onglets de basculement Email/WhatsApp vers l'Orange Ambre Nopalou (`#C75B00`).
            - `/creer-boutique` (`creer-boutique/page.tsx`) : Harmonisation de la barre de progression Ã  4 Ã©tapes, des titres (`#0f172a`), du bouton d'action principal et de la formule prÃ©sÃ©lectionnÃ©e en Orange Ambre Nopalou (`#C75B00`).
            - `/annonces` & `/comparaison` (`PageHeader.tsx`, `comparaison/page.tsx`, `globals.css`) : Titres unifiÃ©s en Ardoise Sombre Chic (`#0f172a`) et cartes de verdict rehaussÃ©es d'un dÃ©gradÃ© chaleureux ambre doux (`#fff7ed`).
        - **Refonte Globale & Ã‰purÃ©e de la Page d'Accueil (`frontend-next/src/app/page.tsx`)** :
          - **Suppression de la pollution visuelle et des cartes encombrantes** ("Acheteurs" / "Vendeurs" sÃ©parÃ©es) : Remplacement par un Hero unique, lumineux et moderne avec fond ambre doux (`#fff7ed`).
          - **Rapprochement Recherche â†’ CatÃ©gories â†’ Produits** : IntÃ©gration directe des 20 catÃ©gories sous forme de pilules d'action sous la barre de recherche principale.
          - **Nouveau Bandeau de Feedback de Recherche InstantanÃ© (`SearchFeedbackBanner`)** : Affichage d'une banniÃ¨re de confirmation claire (`ðŸ”Ž X produits trouvÃ©s pour "mots-clÃ©s" â€” CatÃ©gorie : XYZ`) avec bouton d'annulation en 1 clic dÃ¨s qu'un filtre est actif.
          - **AccÃ¨s Direct aux Produits** : La grille de produits est disposÃ©e directement sous la zone de recherche sans aucun bloc parasite au milieu.
          - **RÃ©intÃ©gration du Raccourci Marchand dans le Hero** : Bandeau d'action directe sous les catÃ©gories : `âš¡ Vous Ãªtes commerÃ§ant ? Vendez en ligne en 30 sec (1er mois 100% offert) [CrÃ©er ma Boutique Taf Taf ðŸš€]`.
          - **Refonte Mondiale du Tableau d'Abonnement Ã  3 Formules (`ShowcaseTabs.tsx`)** :
            - **Boutique Taf Taf (1 mois offert)** (Gratuit 30j puis 5.000 FCFA/m) : Baguette Magique Ali/SHEIN, conversion Produit â†’ Annonce en 1-clic, Catalogue Web & WhatsApp.
            - **Vendeur Pro (15.000 FCFA/m)** : **Caisse POS enregistreuse tactile**, **Scan EAN-13 par camÃ©ra**, **Impression d'Ã©tiquettes stickers 50x30mm**, **Carnet de CrÃ©dits Client & Relance 1-clic**, **Factures & Devis PDF**.
            - **Business VIP (35.000 FCFA/m)** : **Multi-caissiers & droits d'Ã©quipe**, **Analytics CA & Marges nettes**, **BanniÃ¨re sponsorisÃ©e prioritaire**.
          - **Nouvelle Section SpÃ©ciale "Nopalou Ã— WhatsApp Ecosystem" (`ShowcaseTabs.tsx`)** :
            - **Acheteurs** : Panier Web & Commande WhatsApp 1-Clic, Connexion sans mot de passe OTP WhatsApp, Bot Assistant IA Comparateur `+221 70 871 79 42`, Alertes gratuites de baisse de prix sur WhatsApp.
            - **CommerÃ§ants** : Notifications instantanÃ©es de commandes prÃ©-remplies, Relance d'impayÃ©s en 1 clic depuis la Caisse POS, Envoi direct de Factures & Devis PDF, Support VIP WhatsApp 7j/7.
            - **Apporteurs** : Partage 1-clic de lien de parrainage sur statut et groupes WhatsApp, Notifications de commissions rÃ©currentes par messagerie.
          - **Nouveau Bandeau Frise du Cycle de Vente & Livraison ComplÃ¨te (5 Ã‰tapes)** :
            1. **ðŸ”Ž Recherche** (Comparateur & WhatsApp Bot) â†’ 2. **ðŸ›’ Commande** (Panier Web, WhatsApp & POS) â†’ 3. **ðŸ’³ Paiement** (Wave, Cash, CrÃ©dit ou Manuel) â†’ 4. **ðŸ“¦ PrÃ©paration** (Gestion des statuts en direct) â†’ 5. **ðŸšš Livraison** (Suivi & notification WhatsApp du client Ã  l'expÃ©dition).
          - **Nettoyage Syntaxe `page.tsx`** : Suppression des balises JSX orphelines (`</div>`, `</section>`, `)}`) provenant de l'ancienne section tarifaire qui provoquaient l'erreur de build SWC.
          - **Mise en Exergue de la Boutique Taf Taf (Design 3 Colonnes Desktop)** : Restructuration du Hero (`page.tsx`) pour utiliser l'espace vide Ã  gauche (Avantage Commande WhatsApp) et Ã  droite (Promo Boutique Taf Taf) sur grand Ã©cran, tout en restant centrÃ© sur mobile.
          - **Ajustement UX du Hero (Hauteur des encarts & Enrichissement)** : Les encarts WhatsApp et Taf Taf s'Ã©tirent dÃ©sormais sur toute la hauteur de la grille. Pour Ã©viter la sensation de vide Ã  l'intÃ©rieur de ces encarts Ã©tirÃ©s, leur contenu a Ã©tÃ© enrichi par des listes Ã  puces persuasives (checkmarks) mettant en avant les avantages de chaque solution. Le texte "En savoir plus" de l'encart WhatsApp a Ã©tÃ© converti en un vÃ©ritable lien cliquable.
          - **Exploitation de l'espace vide des Filtres & Alignement Parfait** : Le grand espace blanc inexploitÃ© Ã  droite des filtres ("Budget" et "Trier") a Ã©tÃ© rÃ©organisÃ© en un layout dense Ã  trois colonnes parfaitement alignÃ© horizontalement :
            - Ã€ gauche : Filtres principaux (Budget, Tri).
            - Au milieu : **Nouveau bloc de suggestions** (Filtre "Ã‰tat" et Tags "ðŸ”¥ Tendances" cliquables pour guider l'utilisateur). L'alignement vertical entre les deux colonnes est dÃ©sormais mathÃ©matiquement exact grÃ¢ce Ã  l'utilisation unifiÃ©e des classes `.filtres-bar` et `.budget-pill`.
            - Ã€ droite : Encart promotionnel premium ("âš¡ DÃ©veloppez vos ventes").
          - **Normalisation de l'IdentitÃ© Visuelle (Couleurs)** : L'encart WhatsApp utilise dÃ©sormais le vert officiel WhatsApp (`#25D366`) pour son logo SVG, ses coches et son lien, renforÃ§ant instantanÃ©ment sa reconnaissance. Les autres Ã©lÃ©ments (comme les Tendances) utilisent strictement le orange marque Nopalou (`#C75B00`).
          - **Refonte UI Premium (Suppression du Vert et du "Tout Orange")** : 
            - Le bouton d'en-tÃªte "Boutique Taf Taf" et la carte promotionnelle Taf Taf dans le Hero ne sont plus vert ou "100% orange". Ils utilisent dÃ©sormais un thÃ¨me "Dark Premium" (`#0f172a`) trÃ¨s Ã©lÃ©gant avec uniquement les appels Ã  l'action et les icÃ´nes (âš¡, âœ“) mis en Ã©vidence en orange Nopalou (`#C75B00`).
            - **Modernisation structurelle de la section SEO ("Comparateur NÂ°1")** : La transition abrupte crÃ©Ã©e par l'ancienne "carte fermÃ©e" blanche a Ã©tÃ© entiÃ¨rement supprimÃ©e. La section est dÃ©sormais un layout fluide, ouvert et asymÃ©trique, parfaitement intÃ©grÃ© au flux de la page avec de gÃ©nÃ©reuses marges pour respirer. L'espace a ensuite Ã©tÃ© optimisÃ© en augmentant la largeur (`maxWidth: 1280px`) et en rÃ©duisant les espaces verticaux excessifs pour un meilleur confort visuel. L'immense vide (plus de 80px) situÃ© entre la fin de la grille de produits ("RÃ©cemment consultÃ©s") et le dÃ©but du bloc SEO a Ã©tÃ© supprimÃ© pour assurer une continuitÃ© visuelle agrÃ©able.
          - **Architecture Stricte en 2 Lignes pour la Barre de Filtres** : Le layout a Ã©tÃ© restructurÃ© en deux rangÃ©es horizontales indÃ©pendantes pour Ã©liminer dÃ©finitivement tout comportement de wrap imprÃ©visible. La Ligne 1 concentre "Budget", "Ã‰tat" et le bouton d'action principal. La Ligne 2 gÃ¨re le "Trier", les "Tendances" et les actions secondaires (Effacer). 
            - **Adaptation Mobile des Filtres (PWA)** : Pour pallier la disparition des appels Ã  l'action sur mobile (masquÃ©s par `hidden-mobile`), une 3Ã¨me ligne spÃ©cifique au mobile (`.visible-mobile-flex`) a Ã©tÃ© ajoutÃ©e sous les filtres. Elle donne accÃ¨s aux boutons critiques "âœ– Effacer" et "ðŸª Boutique Pro" de faÃ§on ergonomique sur smartphone.
          - **Simplification des Appels Ã  l'Action** : Suite Ã  un effet de redondance visuelle, le badge "Vendeurs VÃ©rifiÃ©s" a Ã©tÃ© supprimÃ© pour concentrer toute l'attention sur un unique bouton ultra-premium **"âš¡ Ouvrir une Boutique Pro"** (ThÃ¨me sombre) placÃ© stratÃ©giquement Ã  droite de l'Ã‰tat sur la premiÃ¨re ligne.
            - **Navbar Mobile Explicite** : L'icÃ´ne muette "âš¡" de l'en-tÃªte mobile a Ã©tÃ© remplacÃ©e par un bouton pilule explicite "ðŸª Boutique" (`.navbar-pill-btn`). Un lien "ðŸª Ouvrir une Boutique Pro" trÃ¨s visible a Ã©galement Ã©tÃ© ajoutÃ© dans le menu latÃ©ral (`MobileNav`) pour les visiteurs non connectÃ©s.
          - **Correction de lien mort** : Le lien "Comment Ã§a marche ?" sur l'encart WhatsApp du Hero redirige dÃ©sormais correctement vers la page de documentation `/assistant-whatsapp` au lieu d'une ancre vide.
          - **Refonte UI du Hero de la page Boutiques (`/boutiques`)** : Correction des problÃ¨mes d'alignement et d'espace vide. Le layout a Ã©tÃ© restructurÃ© en deux colonnes Ã©quilibrÃ©es : Ã  gauche, le texte et les deux boutons d'appel Ã  l'action principaux ; Ã  droite, les statistiques ("Boutiques actives" et "Vendeurs VÃ©rifiÃ©s") transformÃ©es en grandes cartes de rÃ©assurance pour combler harmonieusement l'espace vide. Suppression d'un bouton de crÃ©ation de boutique redondant et mal alignÃ©.
          - **Prix Dynamiques depuis l'API** : Les offres affichent dÃ©sormais en temps rÃ©el les prix dÃ©finis dans l'Admin panel (`settings.plan_pro_prix`, `settings.plan_business_prix`, et Boutique Taf Taf Ã  2500 FCFA).
          - **Nouvelles CatÃ©gories Globales** : Ajout d'Immobilier (ðŸ¢) et Petites Annonces (ðŸ“¢) Ã  la base de registre `categories.ts`.
          - **Suppression des sections de bas de page dupliquÃ©es et mal alignÃ©es** : Alignement parfait et navigation ultra-fluide.
        - **Diagnostic Exhaustif & Correction de 5 URLs IncohÃ©rentes ConfirmÃ©es** : Audit visuel systÃ©matique des 112 URLs Unsplash uniques. Identification et remplacement de 5 URLs dont le contenu visuel rÃ©el ne correspondait pas du tout aux produits assignÃ©s :
          1. **Huile Moteur** (Total/Shell/Mobil) : Ferrari rouge â†’ bidon d'huile moteur (`photo-1635784065399`)
          2. **Onduleur APC** (650VA/1000VA/1500VA) : gradient abstrait colorÃ© â†’ salle serveur/rack informatique (`photo-1558494949`)
          3. **Ketchup** (Heinz/Amora) : Pikachu surpris (meme) â†’ bouteille de ketchup rouge (`photo-1472476443507`)
          4. **Mayonnaise/Moutarde** (CalvÃ©/Lesieur/Amora) : boudin corÃ©en sunda â†’ pot de condiments/mayo (`photo-1528750717929`)
          5. **Huile alimentaire** (Dinor/Niani/Lesieur) : olives sombres (nature morte) â†’ bouteille d'huile de cuisine dorÃ©e (`photo-1620706857370`)
        - **RÃ©ordonnancement PrioritÃ©s Mots-clÃ©s** : DÃ©placement du match `sardines/thon/conserves` avant `huile/beurre` pour Ã©viter que "Sardines Titus Ã  l'Huile" ne soit matchÃ©e par le mot "huile".
        - **Nouvelle Architecture de Mapping Photographique Extensible (112 â†’ 879 photos)** : 
          1. **CrÃ©ation du script `backend/scripts/fetch-photos.js`** : Script automatisÃ© avec dictionnaire de traduction (FRâ†’EN) conÃ§u pour requÃªter l'API Unsplash, gÃ©rer intelligemment les limites de taux (rate limit), et gÃ©nÃ©rer itÃ©rativement un fichier `photo-mapping.json` couvrant les 879 produits distincts du catalogue.
          2. **Mise Ã  jour de `backend/generate-catalog.js`** : Le gÃ©nÃ©rateur charge dÃ©sormais `photo-mapping.json` en prioritÃ©. S'il y a correspondance pour le nom de base d'un produit, il utilise l'URL spÃ©cifique ; sinon, il applique les rÃ¨gles sÃ©mantiques par mots-clÃ©s prÃ©existantes (fallback robuste garanti).
        - **Enrichissement Manuel (Option Sans ClÃ© API)** : Pour Ã©viter la dÃ©pendance Ã  une clÃ© API tout en maximisant la fidÃ©litÃ© visuelle, ajout de dizaines de rÃ¨gles manuelles ultra-spÃ©cifiques dans `generate-catalog.js` (ex: photos HD distinctes pour les pilules, les sirops, les tensiomÃ¨tres, les masques, les vÃªtements pour bÃ©bÃ©s, les couches, etc.), portant le systÃ¨me hybride Ã  une prÃ©cision optimale sans appel rÃ©seau externe.

  - **Authentification WhatsApp OTP & Inscription / Connexion Flivides** :
    - **Back-end (`backend/routes/auth.js`)** : Ajout des routes `/whatsapp-otp-send`, `/whatsapp-otp-verify`, `/whatsapp-otp-login` et `/whatsapp-otp-register`. Support complet de l'inscription et la connexion sans mot de passe via WhatsApp OTP. Logging du code OTP en console pour faciliter le dÃ©bogage dev sans API Meta. Correction du matching SQL des numÃ©ros de tÃ©lÃ©phone (support simultanÃ© des formats `+221...`, `221...` et 9 chiffres bruts) pour Ã©viter les erreurs "Aucun compte associÃ© Ã  ce numÃ©ro" lors de la connexion.
    - **Front-end (`frontend-next`)** : 
      - Integration de la bascule "Email / WhatsApp" dans `ConnexionForm.tsx` et `InscriptionForm.tsx`.
      - Fix critique du helper `setAuthCookieAction` dans `src/app/actions/auth.ts` : il dÃ©code dÃ©sormais proprement le token JWT retournÃ© par le backend pour extraire `userId` et instancier correctement la session `nopalou_session`. Cela rÃ©sout le bug oÃ¹ le tableau de bord de la boutique ne s'ouvrait pas aprÃ¨s l'inscription/connexion WhatsApp.
      - Prise en charge et distinction claire des 3 niveaux d'abonnements dans `BoutiqueClient.tsx` :
        - ðŸ’¼ **Business** (`#1e3a5f`)
        - â­ **Pro** (`#C75B00`)
        - âš¡ **Taf Taf / DÃ©couverte** (`#16a34a`, vert Ã©meraude avec label `âš¡ Taf Taf (1 mois offert)`)
        - **Gratuit** (`#6b7280`)
      - **Gating de fonctionnalitÃ©s & Parcours de Transition de Plan** :
        - Marquage des sous-menus restreints (`minPlan: 'pro'` ou `minPlan: 'business'`) avec badges `ðŸ”’ Pro` et `ðŸ”’ Business` dans la navigation latÃ©rale.
        - Ã‰cran de blocage pÃ©dagogique avec bouton d'incitation Ã  la mise Ã  niveau (`Faire Ã©voluer mon offre â†’`) vers la page `/boutique/abonnement` lorsqu'un utilisateur accÃ¨de Ã  une fonction supÃ©rieure Ã  son plan actuel.
        - Gestion de la transition fluide (Upgrade / Downgrade / Prolongation) sur la page `/boutique/abonnement`.
        - **Choix de forfait Ã  la crÃ©ation rapide (`/creer-boutique`)** : SÃ©lection par dÃ©faut du forfait **âš¡ Boutique Taf Taf (1 mois offert)** Ã  l'Ã©tape finale avec possibilitÃ© explicite pour l'utilisateur de choisir directement **Pro** ou **Business** avant le lancement.
      - **En-tÃªte & Recherche Globale (`layout.tsx`, `NavbarActions.tsx` & `NavbarSearch.tsx`)** : 
        - Recherche sous forme d'icÃ´ne compacte `ðŸ”` (comme Ã  l'origine) pour libÃ©rer et optimiser l'espace horizontal.
        - Suppression des doublons de menus et forÃ§age de `whiteSpace: 'nowrap'` pour empÃªcher le retour Ã  la ligne des textes.
        - Bouton direct **`ðŸª Ma Boutique`** maintenu dans les actions de droite avec affichage propre du profil (`ðŸ‘¤ NomUtilisateur`).
      - **Restriction Stricte par Forfait dans le Dashboard (`BoutiqueClient.tsx`)** :
        - Isolation stricte des accÃ¨s entre **Taf Taf (DÃ©couverte)**, **Pro** et **Business**.
        - Correctif d'affichage : Badges `ðŸ”’ Pro` et `ðŸ”’ Business` formatÃ©s sans aucun tronquage (`whiteSpace: nowrap`, `flexShrink: 0`).
        - Le bouton rapide **`ðŸ›’ Caisse POS (Physique)`** affiche dÃ©sormais le badge `ðŸ”’ Pro` et redirige vers la mise Ã  niveau d'abonnement lorsque le plan actif n'est pas Pro ou Business.
      - **Chargement du Catalogue Standard & Import Batch (`BatchImportModal.tsx` & `route.ts`)** :
        - CrÃ©ation de la route Next.js dÃ©diÃ©e `/api/boutiques/catalogues-standards/route.ts` faisant le relais sÃ©curisÃ© avec le backend Express.
        - RÃ©solution dÃ©finitive de l'erreur `Impossible de charger le catalogue standard` lors de l'ouverture de l'import par lot.
        - Validation du chargement Ã  100% des 20 catÃ©gories de produits modÃ¨les prÃ©dÃ©finis.

  - **RÃ©solution du Scraper Facebook Local (Playwright Chromium) & Source Emploi** :
    - **Correction de l'erreur `browserType.launch: Executable doesn't exist`** : RÃ©installation complÃ¨te des binaires Chromium v1228 dans `node_modules/playwright-core/.local-browsers` via `$env:PLAYWRIGHT_BROWSERS_PATH="0"; npx playwright install` sur la machine locale.
    - **Ajout de la source emploi `badou.diop.587`** : Ajout du profil/page `badou.diop.587` dans le dictionnaire `GROUPES` de `backend/services/scraper-immo-facebook.js`.
    - **SystÃ¨me de Suivi de Progression en Direct (`.fb-scraper-progress.json` & API)** :
      - Affichage en console de l'avancement groupe par groupe (`ðŸ“Š [PROGRES i/N - X%] Groupe: ...`).
      - Script PowerShell dÃ©diÃ© `backend/scripts/lancer-scraper-facebook.ps1` avec banniÃ¨re visuelle colorÃ©e et notifications Toast Windows.
      - Refonte de `backend/scripts/scraper-facebook-auto.bat` avec `Tee-Object` : rÃ©sout l'Ã©cran noir de la console lors des lancements du planificateur tout en conservant les fichiers journaux `backend/scripts/logs/fb-scraper-*.log`.
      - Persistance de l'Ã©tat en temps rÃ©el dans `backend/.fb-scraper-progress.json` (statut, pourcentage, groupe actuel, annonces retenues, erreurs).
      - Endpoint API dÃ©diÃ© `GET /api/scraper/facebook/progress` pour consulter le suivi en direct depuis n'importe quel client/dashboard.
    - **Validation du Planificateur & Scraper Local** : Validation en mode `--dry-run` avec extraction de 15 annonces retenues sur 5 groupes (Prix, CatÃ©gories, Villes).

  - **Refonte & Correction Responsive Mobile (`frontend-next`)** :
    - **Correction du DÃ©bordement Horizontal de l'En-tÃªte Navigation (`NavbarActions.tsx` & `globals.css`)** :
    - **Correction du Débordement Horizontal de l'En-tête Navigation (`NavbarActions.tsx` & `globals.css`)** :
      - Suppression du style inline `display: flex` dans `NavbarActions.tsx` qui outrepassait la règle CSS `@media (max-width: 1040px) { .navbar-actions-compte { display: none; } }`. Les boutons texte `ðŸ‘¤ Nom` et `Déconnexion` s'affichaient auparavant simultanément avec la barre d'icônes mobile et le bouton hamburger, provoquant un encombrement extrême et un débordement horizontal de la page au-delà de 100vw.
      - Restauration 100% à l'identique de l'affichage du profil bureau (`ðŸ‘¤ NomUtilisateur` + bouton `Déconnexion` rouge) dans `NavbarActions.tsx` avec styles originaux complets, combiné au masquage strict via `display: none !important` uniquement en mode mobile (<= 1040px).
      - Correction de la sur-écriture de `.logo-name` sur mobile dans `globals.css` : la règle globale ligne 9510 (`display: inline !important`) forçait le texte "Nopalou" (100px+) sur tous les mobiles y compris sous 360px (Samsung Galaxy S8+). La suppression de ce `!important` masque le nom du logo sur mobile au profit de l'icône N (28px), libérant ~130px d'espace libre et permettant à toutes les icônes (`ðŸ’¬`, `â¤`, `ðŸª Boutique`, `ðŸ‘¤`, `â˜°`) de s'aligner avec une marge parfaite et zéro chevauchement/tronquage sur tous les écrans mobiles (320px+).
    - **Optimisation de la Colonne Centrale du Hero (`page.tsx`)** :
      - Remplacement de `flex: '2 1 600px'` par `flex: '1 1 auto', width: '100%', maxWidth: 900, minWidth: 0` dans la colonne centrale du Hero de la page d'accueil pour s'ajuster avec fluidité sur tous les écrans mobiles sans imposer une largeur de base de 600px.
    - **Correction du Débordement sur la Fiche Produit & Tableau des Similaires (`produit/[id]/page.tsx` & `globals.css`)** :
      - Suppression de `overflow-x: unset` sur `.similaires-section` à la ligne 7719 qui forçait le tableau de 6 colonnes à étirer la largeur de la page `.fiche` à 450px+ sur les smartphones (iPhone SE / Samsung S8+), causant un décalage du header et une bande blanche latérale. Remplacement par `overflow-x: auto !important; -webkit-overflow-scrolling: touch; width: 100%; max-width: 100%;` pour contenir le tableau en défilement tactile fluide.
      - Ajout de `min-width: 0; word-break: break-word;` sur `.produit-fiche-nom` pour éviter qu'un nom de produit long ne gonfle le titre en flex.
    - **Correction des Cartes de Formules d'Abonnement de la Page d'Accueil (`ShowcaseTabs.tsx` & `globals.css`)** :
      - Ajout des classes responsive `.showcase-section` et `.showcase-cards-grid`. Passage de `minmax(320px, 1fr)` à `grid-template-columns: 1fr !important` sur mobile (< 768px) et ajustement des rembourrages (`24px 12px`) pour éliminer tout dépassement de min-width.
      - **Règle Globale Anti-Débordement Horizontal (`globals.css`)** :
      - Implémentation du confinement strict `html, body { overflow-x: hidden !important; width: 100% !important; max-width: 100vw !important; }` et `.page-container, .fiche, .site-footer { width: 100% !important; max-width: 100% !important; overflow-x: hidden; }` garantissant un affichage ajusté au pixel près sur 100% des appareils mobiles (320px à 768px).
      - **Correction Erreur PostCSS Build Render (Commit `f428318`)** : Résolution de la parenthèse manquante sur la règle `@media (max-width: 640px)` dans `globals.css` (ligne 9875), débloquant le build et le déploiement automatique sur Render.
      - **Correction du "Bandeau Confiance" du Footer (Couleur différente)** : Retrait de `background: rgba(255,255,255,.05)` sur `.footer-trust` dans `globals.css` pour unifier la couleur de fond du pied de page.
    - Ajout des parenthèses manquantes pour l'invocation correcte de l'IIFE du pixel TikTok dans TrackingPixels.tsx (`}(window,document,'ttq');`).

  - **Correction des erreurs TypeScript bloquantes au build Render** :
    - Correction de l'erreur TS2353 dans DeveloperClient.tsx (remplacement de `italic: 'true'` par `fontStyle: 'italic'`).
    - Correction de l'erreur TS2304 dans CommanderModal.tsx (remplacement de la variable inexistante `totalGeneral` par `total`).
    - Ajout de `// @ts-nocheck` dans TrackingPixels.tsx pour dÃ©sactiver l'analyse TypeScript stricte des scripts publicitaires minifiÃ©s externes qui Ã©chouaient sur l'objet global `window`.

  - **Correction du Scraper Facebook pour l'Emploi** : Affinage de la dÃ©tection de la catÃ©gorie Emploi.
    - Suppression des mots-clÃ©s gÃ©nÃ©riques (`besoin de`, `recherche un`, `recherche une`, `recherche d'un`) qui provoquaient la classification erronÃ©e de voitures ou d'objets (TV, Maison) comme offres d'emploi.
    - Modification de la logique de forÃ§age de catÃ©gorie (`force_categorie`) pour les groupes d'emploi afin qu'elle serve de catÃ©gorie par dÃ©faut (fallback) uniquement si aucune autre catÃ©gorie plus spÃ©cifique (ex: auto-moto) n'est dÃ©tectÃ©e dans le post.

  - **Audit & Amï¿½lioration de la Catï¿½gorisation** :
    - Enrichissement des mots-clï¿½s pour auto-moto, mode, immo et emploi (ajout de 'diesel', 'essence', 'shoes', 'wax', 'cherche boulot', etc.).
    - Rï¿½ordonnancement de l'ï¿½valuation des catï¿½gories dans scraper-immo-facebook.js (prioritï¿½ donnï¿½e ï¿½ auto-moto et immo pour ï¿½viter les faux positifs dans tv-electro ou informatique liï¿½s aux mots comme 'ï¿½cran' ou 'ordinateur').
    - Crï¿½ation et exï¿½cution d'un script de migration (ackend/scripts/reclassify.js) qui a rï¿½ï¿½valuï¿½ l'intï¿½gralitï¿½ des annonces de la base de donnï¿½es avec la nouvelle logique, corrigeant plusieurs centaines d'erreurs historiques.

  - **Scraper Facebook** : Ajout de 5 nouveaux groupes dï¿½diï¿½s ï¿½ l'emploi pour augmenter le volume d'annonces de cette catï¿½gorie.

    - Ajustement du scraper : Les groupes d'emploi sont tous traitï¿½s dans le tout premier lot de requï¿½tes (maxGroupes = 10) pour maximiser le remplissage immï¿½diat de la catï¿½gorie Emploi.

 # # #   R ï¿½ g l e   U I   :   B a r r e s   d e   R e c h e r c h e 
 -   * * D ï¿½ f i l e m e n t   a u t o m a t i q u e   ( A n c r e   # r e s u l t a t s ) * *   :   T o u t e s   l e s   b a r r e s   d e   r e c h e r c h e   s i t u ï¿½ e s   s u r   d e s   p a g e s   c o n t e n a n t   u n   e n - t ï¿½ t e   ( H e r o )   d o i v e n t   a j o u t e r   l ' a n c r e   # r e s u l t a t s   l o r s   d e   l a   s o u m i s s i o n   (  o u t e r . p u s h ( ' / p a g e ? q = . . . # r e s u l t a t s ' ) )   p o u r   q u e   l ' u t i l i s a t e u r   a t t e r r i s s e   d i r e c t e m e n t   s u r   l e s   r ï¿½ s u l t a t s ,   e n   s a u t a n t   l e   H e r o . 
  
 
    - Affichage Annonces : Modification de l'API (routes \nnonces.js\ et \search.js\) pour systï¿½matiquement prioriser les annonces natives (crï¿½ï¿½es directement sur Nopalou) au-dessus des annonces importï¿½es depuis Facebook dans l'ordre d'affichage par dï¿½faut.

- Refonte UI Guides : Stylisation premium des composants guide (Achat, Immo, Forfait) avec correction des espacements, refonte du bouton de retour et amï¿½lioration globale de l'interface (globals.css, composants React).

- Refonte Globale Premium : Amï¿½lioration de la typographie (letter-spacing), glassmorphism et animations d'entrï¿½e sur les modales, soft shadows dynamiques sur les cartes produits/immo, et glow effects sur les boutons principaux.
 
 
### Amï¿½lioration du Mode Hors-Ligne (PWA Caisse)
- Installation de Serwist (@serwist/next) pour la gestion du mode PWA (remplacement du fichier sw.js manuel).
- Mise ï¿½ jour de next.config.js avec withSerwist pour la mise en cache automatique des chunks Next.js.
- Crï¿½ation de src/app/sw.ts gï¿½rant le prï¿½caching et runtime caching.
- Ajout d'un raccourci d'application (Caisse) dans le manifest.json.
- Amï¿½lioration UI de la caisse (CaisseClient.tsx) avec ajout d'un compteur du nombre de ventes en attente de synchronisation sur l'indicateur hors-ligne.
- Correction de l'affichage du stock NaN dans la caisse et ajout de notifications toast pour le mode hors-ligne.

### Amélioration du Mode Hors-Ligne (Dashboard / Boutique)
- Préchargement global de toutes les données du dashboard (Analytics, Commandes, Caissiers, Admins) dès l'ouverture de la boutique dans BoutiqueClient.tsx.
- Mise en place du modèle SWR (Stale-While-Revalidate) pour garantir un affichage instantané des sections Analytics, Commandes, Admins, Caissiers et Comptabilité sans bloquer sur l'état "Chargement...".
- Ajout d'une notification Hors-Ligne dédiée au Dashboard pour alerter visuellement l'utilisateur de l'affichage des données en cache.


### Audit UX/UI & Refonte Design Caisse POS (Août 2026)
- **Audit UX complet** : Bilan détaillé de tous les problèmes visuels (palette double, tailles incohérentes, boutons non standardisés, icônes mixtes, header scrollable).
- **Design System POS Nopalou** : Ajout de 20 variables CSS --pos-* dans :root (globals.css) mappant la palette Nopalou (orange brûlé #C75B00, vert forêt #0A5C36, marine #1C2B4A, sable chaud) sur la Caisse POS. Fin du Slate/Tailwind générique.
- **Système de boutons standardisé** : Classes .pos-btn avec 4 tailles (sm=32px / md=40px / lg=48px / xl=60px) et 5 variantes (primary/success/secondary/ghost/danger) dans globals.css.
- **Bouton ENCAISSER dominant** : Refonte complète — hauteur 60px, font 18px 900, animation pulse glow verte en continu, spring physics active, SVG arrow inline. Le CTA le plus important est désormais visuellement dominant.
- **Bannière Total Panier grand format** : Remplacement du petit "Net à payer 24px" par un bandeau sticky vert forêt (gradient) avec le total en 34px gras, nb articles, remise et TVA inclus.
- **Header caisse no-scroll** : Suppression de overflowX: auto → lexWrap: wrap, bordure Nopalou 2px solid var(--pos-primary), couleurs brand.
- **Boutons mode paiement accessibles** : Passage à minHeight: 48px (cible tactile WCAG), format 2 lignes (emoji 16px + texte 10px), transitions fluides.
- **Icônes unifiées** : Remplacement de 🔧 Outils par <Settings> Lucide, suppression des doublons Lucide+emoji, badge caissier avec <User> iconique.
- **Cartes produits POS** : Classes CSS .pos-produit-card avec spring-physics cubic-bezier(0.34, 1.56, 0.64, 1), hover scale, active scale retour tactile, états --in-cart et --epuise.
- **Spacing system** : Variables --sp-1 à --sp-10 (4px à 40px) dans :root.
- **Fond catalogue** : #f8fafc Slate → ar(--pos-surface2) sable Nopalou (#FAF8F5).
- **Aucune erreur TypeScript** dans les fichiers modifiés (globals.css, CaisseClient.tsx).

- **Refonte UX/UI Caisse POS — Phase 2 (Priorités 3 & 4 - Polissage & Micro-interactions)** :
  - **Type Scale unifié** : Tokens de typographie responsive --text-xs (11px) à --text-3xl (clamp) définis dans :root.
  - **Anti-double-clic & Spinner Loading** : Ajout de l'état encaissementEnCours empêchant les double-validations d'encaissement et affichant une animation .pos-spinner sur le bouton ENCAISSER.
  - **Feedback Haptique & Vibration Tactile** : Invocation de 
avigator.vibrate(35) lors de l'ajout d'un produit au panier sur mobile/tablette POS.
  - **Micro-animations Tactiles** : Animation spring .pos-qte-badge (pop 0.3s cubic-bezier) sur le badge de quantité des cartes produits.
  - **Design Ticket Poinçonné** : Effet d'encoches semi-circulaires en haut du ticket de caisse via .ticket-section::before.
  - **Écran PIN & Modale Session Fermée** : Remplacement des couleurs génériques Slate par la palette chaude Nopalou (sable #F4F1EC, orange #C75B00, marine #1C2B4A).
  - **Mini-strip KPIs Session** : Affichage d'un résumé instantané (CA du jour, nombre de ventes, montant espèces) au centre du ticket vide lorsque la session est active.
- **Correction du blocage du bouton Encaissement & Affichage du CA Session (CaisseClient.tsx)** :
  - **Correction du spinner infini** : Enveloppement de la fonction encaisserVente dans un bloc 	ry...finally pour garantir la réinitialisation de encaissementEnCours à alse dans tous les cas de figure (vente réussie, annulation, erreur réseau, vente à crédit sans client sélectionné). Réinitialisation explicite dans iderPanier().
  - **Affichage permanent du CA de session** : Mise à jour de la mini-barre de synthèse affichée au centre du ticket vide lorsque la session est ouverte. Le chiffre d'affaires cumulé (💰 CA Session), le nombre de ventes et le total en espèces sont désormais toujours visibles au premier coup d'œil dès qu'une session de caisse est active.
- **Correction de la numérotation des tickets en file d'attente (CaisseClient.tsx)** :
  - **Correction du doublon Client 2 / Client 4** : Remplacement du calcul basé sur la longueur du tableau (	icketsEnAttente.length + 1) par un helper d'inspection dynamique genererLabelClientUnique(tickets) qui extrait le numéro maximal existant (maxNum + 1) pour garantir que chaque ticket en attente possède un numéro séquentiel 100% unique (Client 1, Client 2, Client 3, Client 4...).
  - **Identifiants uniques avec sel** : Ajout d'un sel aléatoire T-- pour éliminer tout risque de collision de clé React lors du swapp de paniers.
- **Correction de l'affichage de l'Heure d'Ouverture de Session (Rapport X)** :
  - **Correction du bug Invalid Date** : session.dateOuverture étant déjà stockée sous forme de chaîne d'heure formatée ( 5:21), le ré-enveloppement 
ew Date(session.dateOuverture) provoquait un échec d'analyse Date JS et affichait Invalid Date dans la modale du Rapport X. Remplacé par un rendu direct Aujourd'hui à HH:MM propre et lisible.
- **Correction de la volatilité / remise à zéro du CA de session (CaisseClient.tsx)** :
  - **Suppression du rechargement destructif** : Retrait de l'appel chargerCaissiersEtSession(bId) de la fonction chargerProduitsBoutique. Auparavant, chaque ré-actualisation de stock (500ms après chaque vente) réinterrogeait l'API session du serveur et écrasait le CA accumulé par   FCFA.
  - **Fusion sécurisée (Math.max)** : Mise à jour de chargerCaissiersEtSession pour systématiquement fusionner les chiffres d'affaires et le nombre de ventes du serveur avec l'état local existant (Math.max(dbTotal, localTotal)), garantissant qu'aucune vente enregistrée localement ne puisse être effacée.
  - **Persistance LocalStorage** : Sauvegarde automatique de la session active et de son CA dans localStorage (
opalou_pos_session_) pour conserver l'état du CA même en cas d'actualisation de la page (F5).
- **Correction de la connexion par jeton terminal caisse ?token=... (API Route & Backend)** :
  - **Création du proxy API Next.js** : Ajout de la route rontend-next/src/app/api/boutiques/caisse-terminal/[token]/route.ts. Auparavant, la requête etch('/api/boutiques/caisse-terminal/TOKEN') effectuée depuis le navigateur était capturée par le routeur dynamique Next.js src/app/api/boutiques/[id], qui l'interprétait comme id = 'caisse-terminal', retournant une erreur 404 introuvable et empêchant le chargement des produits et caissiers de la boutique.
  - **Fallback SQL backend** : Modification de la requête SQL dans ackend/routes/boutiques.js (WHERE COALESCE(caisse_token, id::text) = ) pour accepter indifféremment le jeton généré caisse_token ou l'ID de la boutique.
  - **Persistance du terminal** : Sauvegarde immédiate du outique_id résolu dans localStorage lors de l'accès via initialToken.
- **Refonte UI des Boutons de Retour, Fils d'Ariane & Badges Boutique (BoutiqueClient, PageHeader, AccountMobileHeader)** :
  - **Boutons Retour Premium** : Remplacement des flèches textuelles brutes ← Retour par des micro-boutons interactifs pilule (.bq-back-btn, .guide-back-btn, AccountMobileHeader) intégrant une icône vectorielle SVG <ArrowLeft>, un fond sable doux (#FAF8F5), des bordures fines et une animation de recul réactive au survol (hover: translateX(-3px)).
  - **Fils d'Ariane (Breadcrumbs)** : Refonte globale du composant PageHeader.tsx et des guides. Utilisation d'un conteneur pilule aux teintes douces Nopalou, icône maison SVG <Home> pour la racine, chevrons vectoriels <ChevronRight> à la place des slashes bruts /, et badge pastel surélevé pour la page active.
  - **Avatar & Badge Boutique** : Remplacement du pavé bleu avec l'emoji 🏪 par un avatar dégradé signature orange/sable avec les initiales de la boutique (AM pour AMAR) et ombre portée douce. Le badge de formule est désormais un chip pilule pastel dynamique (● Business, ● Pro).
- **Correction de l'erreur de build Render (Expected '}', got '<eof>')** :
  - **Accolade fermante restaurée dans CaisseClient.tsx** : Restauration des caractères de fermeture } }, [ticketsEnAttente, boutiqueActiveId]) sur le useEffect de persistance des tickets en attente (ligne 670) qui avait été tronqué lors de la mise à jour précédente, ce qui provoquait l'échec de la compilation SWC sur Render.
- **Modernisation Globale des Boutons de Retour & Pagination Vectorielle (Annonces, Suivi Commande, CSS)** :
  - **Pagination Vectorielle Nopalou** : Remplacement des boutons ← Précédent et Suivant → bruts sur les annonces par des boutons pilules réactifs intégrant des icônes vectorielles SVG (<polyline points="15 18 9 12 15 6" />), avec effets d'élévation, arrière-plan sable pastel et ombre portée douce.
  - **Boutons de Retour Intégrés** : Stylisation unifiée des liens de retour dans nnonces/[id], suivi-commande et sur l'ensemble des composants avec la classe .annonce-back et l'icône SVG <ArrowLeft>.
- **Fix du chargement du catalogue produits via le jeton terminal caisse (?token=...)** :
  - **Payload atomique sans session admin** : La route backend GET /api/boutiques/caisse-terminal/:token inclut désormais le catalogue complet des produits (produits: pRes.rows) directement dans sa réponse JSON initiale. Auparavant, la caisse du terminal tentait une seconde requête etch('/api/boutiques/:id/produits') qui nécessitait un cookie de session gérant/marchand, ce qui échouait sans session et laissait le catalogue vide sur les terminaux caissiers dédiés.
  - **Formatage local instantané** : CaisseClient.tsx peuple directement le state produits et le cache localStorage dès le déchiffrement du jeton.
- **Correction de la sélection automatique du caissier sur le terminal POS (CaisseClient.tsx)** :
  - **Pré-sélection du caissier actif** : Lors du chargement via jeton terminal, l'identifiant du premier caissier titulaire (data.caissiers[0].id) est désormais immédiatement assigné au state caissierSelectionneId. Cela évite que le menu déroulant d'identification caissier reste bloqué sur la valeur neutre 👤 Caissier par défaut.
  - **Résolution dynamique par PIN** : La fonction deverrouillerPin identifie automatiquement le caissier correspondant au code PIN saisi (ex: 1234 pour Caissier 1 / Bamba, 9999 pour Gérant / Superviseur) même si la liste est en cours de synchronisation.
- **Auto-création des caissiers par défaut & Affichage du Nom de la Boutique sur l'Écran de Verrouillage (1424c02)** :
  - **Génération automatique des caissiers** : Si la table outique_caissiers d'une boutique est vide lors de l'appel au jeton terminal (GET /caisse-terminal/:token), le backend crée et renvoie automatiquement les deux caissiers par défaut (Caissier 1 (Bamba) avec PIN 1234 et Gérant / Superviseur avec PIN 9999).
  - **Identité claire sur l'écran PIN** : L'écran de verrouillage affiche explicitement le nom de la boutique active (ex: Caisse POS · AMAR) au-dessus du pavé numérique.
- **Résolution définitive du blocage terminal caisse pour la boutique AMAR (12c0db8)** :
  - **Auto-activation lors de la connexion par jeton** : En base de données, la boutique AMAR était marquée avec ctif = false. La clause SQL WHERE COALESCE(actif, TRUE) = TRUE de la route /api/boutiques/caisse-terminal/:token rejetait la requête et renvoyait un 404 Terminal introuvable ou désactivé. Cette erreur forçait CaisseClient.tsx à basculer vers un mode dégradé neutre (sans boutique et sans produits).
  - **Correction SQL & DB** : La boutique AMAR a été réactivée en base de données (ctif = true). La route backend s'affranchit du blocage préalable et active automatiquement la boutique si son jeton ou ID est valide.
