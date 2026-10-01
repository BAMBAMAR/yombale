# Audit défensif de protection de Nopalou : scraping, fuite de données, anti-copie, anti-espionnage (1er octobre 2026)

Rédigé pour : le propriétaire et l'équipe technique de Nopalou. Fiches `AUD-132` à `AUD-152` (la numérotation suit `AUD-131`, dernière fiche du 01/10 croissance). Plan de correction associé : `PLAN-PROTECTION-DONNEES-2026-10-01.md`. **Aucun correctif n'a été appliqué pendant cet audit.**

## 1. Résumé

| Gravité | Nb | Fiches |
|---|---|---|
| P0 | 0 | aucune fuite prouvée sur la production (la production n'a pas été touchée) |
| P1 | 5 | AUD-132 portail locataire sans OTP, AUD-133 SSRF aveugle du générateur d'images, AUD-134 fiche boutique publique avec champs fiscaux et bancaires, AUD-135 extraction en masse sans plafond, AUD-136 jeton GitHub en clair dans le remote git |
| P2 | 9 | AUD-137 à AUD-144 et AUD-146 (AUD-142 : P2/P3) |
| P3 | 7 | AUD-145, AUD-147 à AUD-152 |

Verdict en une phrase : **le catalogue, les annonces et leurs numéros de téléphone peuvent être aspirés intégralement en quelques requêtes (aucun plafond de volume), les protections anti-bots existantes sont contournables et gênent des utilisateurs légitimes (API partenaire), et le badge « Vendeur Vérifié Nopalou » n'est adossé à aucune vérification, ce qui rend l'usurpation de marque triviale.** À l'inverse, les secrets sont bien absents du code client, des sources suivies par git et des bundles, et les correctifs de sécurité antérieurs rejoués tiennent (sauf AUD-030, partiellement).

## 2. Méthode, périmètre, limites

- Environnement isolé uniquement (`scripts/audit/`) : base locale `nopalou_audit` (graines) et `nopalou_audit_data` (copie de production du 24/09, lecture seule, **agrégats uniquement dans ce rapport**, aucune donnée personnelle reproduite). Garde réseau en liste blanche bouclée. Aucune requête vers Render, les API réelles, ni nopalou.com.
- Piles lancées : backend `NODE_ENV=development` :4100, **backend `NODE_ENV=production` :4101** (pour exercer les filtres qui ne s'activent qu'en production), frontend en build de production `next start` :3001. L'IP source locale étant la boucle locale (traitée comme « interne » par les limiteurs), les IP publiques ont été simulées avec `X-Forwarded-For` (valable car `trust proxy: 1`).
- Données de test fictives (comptes `a@audit.test`, un bail/locataire fictif) créées puis supprimées. Aucun test destructif, aucune charge au-delà de 320 requêtes séquentielles.
- Contrôles réels exécutés (pas de simple lecture de code) : sondes HTTP, comptages sur réponses, scan de bundles, scan de fichiers suivis, replays des correctifs antérieurs. Les scripts temporaires sont dans le dossier temporaire de session (non versionnés).
- Statuts utilisés : **VÉRIFIÉ** (reproduit), **CODE** (lu dans le code, comportement non rejoué), **NON VÉRIFIÉ**.

## 3. État de départ et recoupement avec l'existant

Branche `fix/croissance-audit`, arbre propre, HEAD `9c8ddc8b`. Les audits précédents (30/09 sécurité, 30/09 hors-ligne, 01/10 croissance) n'ont **pas** traité le scraping, l'anti-copie ni la minimisation des champs publics. Correctifs antérieurs du même périmètre rejoués :

| Fiche antérieure | Rejeu | Résultat |
|---|---|---|
| AUD-014 routes internes publiques (`/api/scraper/*`, `server-ip`, `whatsapp/health`, `abonnements/admin`, `facebook-posts/token-status`) | GET anonyme, mode production | **recoupé, tenu** (401) |
| AUD-013 webhooks sans signature | POST sans signature Wave/Stripe/Orange/WhatsApp | **recoupé, tenu** (401/403) |
| AUD-025 XSS stocké JSON-LD | nom/description/slogan de boutique contenant `</script><script>…`, page publique du build de production | **recoupé, tenu** (`<`, aucun `<script>` brut, JSON-LD parsable) |
| AUD-026 SSRF `magic-import`, AUD-027 relais WhatsApp | POST anonyme | **recoupé, tenu** (401) |
| AUD-028 RBAC | `verify-rbac.js` | **recoupé, tenu** (150/150) |
| Multi-tenant / IDOR | `idor.js` comptes A et C contre la boutique B, 475 routes | **recoupé, tenu** (aucun 2xx sur la ressource de B ; les 2 seuls 200 sont des suppressions idempotentes sur les propres favoris/alertes de l'appelant) |
| AUD-029 secrets de `/api/settings` | admin (en-tête secret), valeurs jamais affichées | **recoupé, tenu** (4 clés de type secret, 4 masquées) |
| AUD-030 secret maître | login admin + 40 mauvais secrets | **recoupé, partiel** : verrou anti-devinette tenu (429 après 10 essais par IP) mais le secret reste copié en clair dans un cookie → **AUD-143** |
| AUD-079 joker `ILIKE` du suivi de commande | `ref=CMD-%`, `%`, `CMD-_` | **recoupé, tenu** (400) |
| AUD-016 limiteur contournable (`/analytics`) | 12 POST | **recoupé** : l'endpoint porte un limiteur propre (compteur 188/200 restant) |

## 4. Fiches d'anomalies

### AUD-132 — P1 — Portail locataire : un numéro de téléphone suffit, l'OTP est contourné (accès non autorisé, fuite de données personnelles)
- **Surface** : `backend/routes/locatif-immo.js` : `GET /public/locataire-lookup?tel=` (l.2257), `GET /public/bail/:id.pdf` (l.1785), `POST /public/bail/:id/signer` (l.1830), `POST /public/bail/:id/documents` (l.1885).
- **Preuve (VÉRIFIÉ, données fictives)** : sans aucune authentification, `locataire-lookup?tel=770000099` renvoie 200 avec identité du locataire (nom, prénom, téléphone, WhatsApp), adresse du bien, loyer, dépôt de garantie, conditions, **URLs des pièces jointes (CNI)**, signatures, échéances, lien du contrat. Le PDF du contrat se télécharge avec le même numéro seul (200 `application/pdf`) **et même sans paramètre `tel`** (200 : la clause `$2 = ''` désactive le contrôle). 60 numéros consécutifs sont traités sans aucun 429 (404 pour les inconnus : le statut sert d'oracle « ce numéro est locataire »). `signer` et `documents` s'autorisent sur le seul couple bail + téléphone.
- **Cause** : le flux sécurisé par OTP WhatsApp (`demander-otp` / `verifier-otp`, commit `a176632a`) a été ajouté, mais les routes historiques par téléphone n'ont pas été retirées et le frontend les utilise encore (`PortailLocataireClient.tsx:121`, `BailLocataireCard.tsx:94`, `DossierPiecesModal.tsx:68`, lien du message WhatsApp `immo-whatsapp-notifications.js:387`). Un numéro de téléphone n'est pas un secret.
- **Impact** : toute personne connaissant (ou devinant) le numéro d'un locataire lit ses données personnelles et pièces d'identité, télécharge son contrat et peut **signer électroniquement le bail à sa place**. Volume réel en production : NON VÉRIFIÉ (la copie du 24/09 ne contient aucun bail).
- **Gravité** : P1 (P0 si des baux existent en production : à mesurer côté exploitation).
- **Limite de la preuve** : le dépôt de fichier a renvoyé 500 car Cloudinary est neutralisé en audit ; l'absence de contrôle du type de fichier est établie par lecture du code (CODE).

### AUD-133 — P1 — Générateur d'images : SSRF aveugle non authentifié, et visuels « officiels » falsifiables
- **Surface** : `frontend-next/src/app/assets/produit-promo/route.tsx:39` (paramètre `image`), ainsi que `api/og-image`.
- **Preuve (VÉRIFIÉ)** : `GET /assets/produit-promo?type=produit&nom=…&image=http://127.0.0.1:4100/api/health?ssrf_probe=…` → 200 PNG, et le backend a journalisé la requête entrante `GET /api/health?ssrf_probe=…` : **le serveur Next récupère n'importe quelle URL fournie par un anonyme** (réponse non renvoyée au client : SSRF aveugle).
- **Impact** : sondage du réseau interne Render et des services de métadonnées, amplification de requêtes, déni de ressources (génération d'image sans limiteur : 10 images distinctes en 0,9 s). Même route : fabrication anonyme d'une carte portant le logo Nopalou avec n'importe quel nom, prix, prix barré et vendeur (valeur par défaut « Vendeur Vérifié Nopalou »), par exemple « Offre OFFICIELLE Nopalou -90 % » (200 `image/png`, test exécuté) → voir AUD-141.
- **Cause** : paramètres du corps de l'image pris tels quels, URL d'image sans liste blanche d'hôtes, aucune signature des paramètres.

### AUD-134 — P1 — La fiche boutique publique expose les données fiscales, bancaires et d'exploitation
- **Surface** : `GET /api/boutiques/:idOuSlug` (`boutiques-crud.js:735-785`), anonyme.
- **Preuve (VÉRIFIÉ)** : sur 65 boutiques actives de la copie, `utilisateur_id`, `regime_fiscal`, `pos_remise_max_caissier`, `pos_remise_seuil_auto_*`, `plan_actif`, `mode_fonctionnement` sont renvoyés pour 65/65. Avec un marchand de test qui renseigne ses champs (valeurs fictives), la lecture anonyme (par id et par slug) renvoie `rccm`, `ninea`, **`compte_bancaire`**, `capital_social`, `forme_juridique`, `pos_remise_max_caissier = 25.00`, `utilisateur_id`. Dans la copie du 24/09 ces champs fiscaux sont vides pour les 65 boutiques : l'exposition est structurelle et se matérialise dès qu'un marchand utilise la fiscalité (écran `ParametresFiscalite.tsx`) ou les remises POS.
- **Cause** : `SELECT` explicite mais mélangeant vitrine publique et paramètres de gestion. La page vitrine HTML ne contient pas ces champs (vérifié) : seule l'API les sert.
- **Impact** : fuite de coordonnées bancaires et d'identifiants légaux de commerçants, politique de remise des caisses (ouvre la fraude interne : plafonds connus), identifiant interne du propriétaire (utilisé pour `GET /api/annonces?utilisateur_id=` et le repérage des annonces d'un même compte), niveau d'abonnement de chaque boutique (renseignement commercial pour un concurrent).
- **Consommateurs à préserver** : écrans marchands qui lisent `boutique.compte_bancaire`, `utilisateur_id` (storefront `boutiques/[id]/page.tsx:153`, immo `immo/[id]/page.tsx:230`).

### AUD-135 — P1 — Aspiration du catalogue et des annonces possible en quelques requêtes (aucun plafond de volume)
- **Preuve (VÉRIFIÉ, mode production, IP publique simulée, UA de navigateur)** :
  - `GET /api/offres/` : **12 348 offres en une requête, 7,9 Mo, 0,4 s**, 12 123 avec `url_achat` (liens des 17 marchands concurrents), offres mises en quarantaine incluses (723, champ `quarantinee`), `o.*` complet. Aucun plafond, aucun limiteur propre (seul le global 1 000/15 min : jusqu'à ~8 Go par IP par fenêtre). Les 500 renvoient le message SQL (AUD-145).
  - `GET /api/immo/?limit=100000` : **3 091 annonces en une requête** (3,5 Mo, 0,1 s) dont **425 avec téléphone en clair** (208 numéros distincts), `utilisateur_id`, `ref_externe`, `url_source` (2 690 : adresses des sources tierces), `source`. Le limiteur `limiterBulk` (300/15 min) ne compte qu'une requête.
  - `GET /api/annonces` : plafond 50/page mais 93 pages suffisent pour le catalogue complet : **4 633 annonces, 3 808 avec téléphone, 1 574 numéros distincts** ; 100 pages consécutives ont toutes été servies (`searchLimiter` 150 + `limiterBulk` 300 par 15 min ne bloquent pas).
  - `GET /api/produits` plafonné à 5 000 lignes : le catalogue de 10 197 produits sort en 3 requêtes. `telecom` : 144 forfaits en une requête (limite non plafonnée).
  - `limiterBulk` est ignoré pour tout appel portant un compte (`req.user`) : le message de l'API le dit (« créez un compte gratuit pour un accès illimité »). L'inscription étant gratuite, la limite ne protège rien.
- **Impact** : copie automatisée de l'intégralité du comparateur et des annonces (valeur propre de Nopalou), moissonnage de numéros de téléphone de particuliers (spam, démarchage, arnaques), revente. Les données sont publiquement affichées par conception ; le défaut est l'absence de plafond, de DTO minimal et de limitation par coût de requête.

### AUD-136 — P1 (action d'exploitation) — Jeton d'accès GitHub en clair dans l'URL du dépôt distant
- **Preuve (VÉRIFIÉ)** : `git remote -v` affiche `https://ghp_…@github.com/BAMBAMAR/yombale.git` (jeton personnel classique, 40 caractères, **non reproduit ici**). Il est stocké en clair dans `.git/config`, apparaît dans toute commande ou journal qui affiche le remote, et **a été affiché dans la sortie d'un outil pendant cet audit** (session Claude Code). Aucun test d'usage du jeton n'a été fait.
- **Impact** : toute personne ou outil lisant `.git/config`, un journal de terminal ou une transcription obtient l'accès en écriture au dépôt (code, dont les routes d'administration) selon ses droits.
- **Correction** : révoquer et régénérer le jeton, passer à un jeton à portée minimale (fine-grained, dépôt unique, expiration), utiliser le gestionnaire d'identifiants Windows (`git config credential.helper manager`) et remettre l'URL sans identifiant.

### AUD-137 — P2 — Le masquage partiel des numéros n'est qu'un habillage
- **Preuve (VÉRIFIÉ, build de production)** : la page `/immo/<id>` affiche `••` à l'écran mais le **HTML initial contient le numéro en clair**, y compris dans le JSON-LD, 7 occurrences au total (flux Next + schéma) ; idem `/annonces/<id>`. Les API listes renvoient aussi `contact_tel`. Un moissonneur sans JavaScript lit tout.
- **Cause** : le masquage est fait côté client sur des données déjà livrées. Le clic « Afficher » (événement `show_phone_number_immo`) ne protège donc rien.

### AUD-138 — P2 — Filtres anti-bots inefficaces contre le scraping, mais bloquants pour des utilisateurs légitimes
- **Preuves (VÉRIFIÉ, mode production)** : `botBlockerMiddleware` (`app.js:130-147`) renvoie 403 pour `python-requests`, `curl`, `Go-http-client`, `Java/`, `aiohttp`, `Scrapy`, `Wget`, mais passe 200 pour `okhttp`, `node`, UA vide ou **UA de navigateur copié**, et pour **n'importe quelle requête portant un en-tête `Authorization` quelconque** (`Bearer x` testé). `blockScraperUA` (`rateLimit.js:45`) bloque (429) `node`, UA vide, `okhttp`, mais pas un UA de navigateur.
- **Effets indésirables** : l'**API partenaire** `/api/v1/*` (clé dans `X-Api-Key`, offre Business) est refusée en **403 avant la vérification de clé** pour tout client curl/Python/Java/Go (`/api/v1/prix`, 403 au lieu de 401). Les pages HTML du frontend ne sont filtrées par aucun UA (`/boutiques` : 200 pour python-requests, curl, Scrapy, GPTBot ; 150 pages en 9,8 s sans limite) : **la couche HTML, la plus simple à aspirer, n'a aucune protection**. Le `robots.txt` interdit des robots d'IA (GPTBot, ClaudeBot, CCBot…) mais n'est qu'indicatif (non appliqué : GPTBot = 200).
- **Conforme** : Googlebot, `facebookexternalhit` et `WhatsApp` ne sont pas bloqués (200) ; le jeu de limiteurs ne se déclenche pas sur `X-Forwarded-For` gauche forgé (`XFF: 198.51.100.1, 203.0.113.9` reste dans le seau de `203.0.113.9`).

### AUD-139 — P2 — `sitemap.ts` appelle des routes filtrées sans jeton SSR ; couverture tronquée
- **Surface** : `frontend-next/src/app/sitemap.ts:112-118` appelle `/api/produits`, `/api/immo`, `/api/annonces` (routes protégées par `blockScraperUA` + `limiterBulk`) sans `X-SSR-Token`. 21 fichiers côté frontend appellent le backend sans jeton SSR (liste dans l'annexe) ; seules les routes listes sont filtrées.
- **Preuve** : au niveau API, une requête sans jeton, UA `node` (UA par défaut de `fetch` Next) et IP publique donne 429 (VÉRIFIÉ). Comme les deux services Render sont distincts (`render.yaml`) et que le backend est joint par son URL publique, l'IP source n'est pas « privée » : **le sitemap de production peut perdre ses produits, annonces et biens** (NON VÉRIFIÉ en production, à contrôler : `curl -s https://nopalou.com/sitemap.xml` et compter les `<loc>`). Le sitemap du build local contenait 74 URLs sans produit ni boutique (backend indisponible au build : non concluant).
- **Couverture** : `limit=1000` annonces et `limit=500` boutiques demandés mais plafonnés à 50 par l'API : le sitemap ne peut pas référencer plus de 50 annonces (sur 4 633) ni 50 boutiques (sur 65). `render.yaml` ne déclare pas `SSR_SECRET` (peut être défini dans le tableau de bord : NON VÉRIFIÉ).

### AUD-140 — P2 — « Vendeur Vérifié Nopalou » est affiché sans aucune vérification
- **Preuve (VÉRIFIÉ)** : aucune colonne de vérification ou certification n'existe sur `boutiques` (schéma : seuls `agences_immo.numero_agrement` texte libre, `boutique_avis.verifie`, `email_verifie`). `BoutiqueInfosTab.tsx:65` affiche « Vendeur Vérifié Nopalou » **inconditionnellement** ; `BoutiqueCard.tsx:176` affiche « Vendeur vérifié » pour toute boutique sans avis. Textes de marque : « 100% vérifiés » (`boutiques/page.tsx:451`), « Badge Vendeur Vérifié & Certifié » (`marchands/page.tsx:366`), « Agréments Contrôlés » (`agences/page.tsx:398`). Création de boutique en libre-service.
- **Impact** : le signe de confiance de la marque est détenu par n'importe quel vendeur, y compris frauduleux ; aucune distinction technique entre Nopalou officiel, vendeur certifié, vendeur non vérifié, contenu tiers (comparateur scrapé). Risque de publicité trompeuse et de perte de valeur de la marque.

### AUD-141 — P2 — Usurpation de la marque Nopalou non empêchée
- **Preuve (VÉRIFIÉ)** : un marchand de test renomme sa boutique « Nopalou Officiel - Support Paiement » avec le slogan « Compte officiel Nopalou certifié » : 200, publié sur la fiche publique ; inscription d'un compte nommé « Nopalou Support Officiel » : 201. La copie de données compte 2 boutiques dont le nom contient « nopalou » (légitimité NON VÉRIFIÉE). Aucune liste de noms réservés. Avec AUD-133, un tiers fabrique en plus un visuel « Nopalou ».
- **Impact** : hameçonnage de paiement et de support sous le nom de la plateforme.

### AUD-142 — P2/P3 — Champs internes dans les réponses publiques
- **Preuve (VÉRIFIÉ)** :
  - `/api/boutiques/:id/produits` (anonyme) : `stock_quantite` exact de chaque article (permet de suivre les ventes d'un concurrent par différence), `statut_moderation`, `motif_moderation`, `modere_le`, `whatsapp_sync_statut`, `whatsapp_sync_erreur`, `partage_le`, `code_barre`, `variantes_skus`, `date_expiration`. Le détail produit ajoute `meta_pixel_id`, `tiktok_pixel_id`, `ga4_id` de la boutique.
  - `/api/immo` : `SELECT ai.*` (`utilisateur_id`, `ref_externe`, `url_source`, `source`, `rejete`, `motif_rejet`, `bien_id`, `demande_sponsorisation`…).
  - `/api/agences/public` : objet `parametres` complet (studio, publications sociales) et `email_contact`.
  - `/api/boutiques/` : `plan_actif`, `sponsor_jusqu_au` pour chaque boutique.
  - `/api/settings/public` : règles internes (`max_boutiques_par_telephone`, `max_agences_par_compte`, `alertes_abonnement_*`, `commission_business`, `apporteur_taux_commission`, numéros de réception Wave/OM manuels).
- **Impact** : renseignement commercial et règles anti-abus facilitant le contournement ; moderation divulguée publiquement.

### AUD-143 — P2 — Le secret maître administrateur est encore copié dans un cookie (AUD-030 partiel)
- **Preuve (VÉRIFIÉ)** : `POST /api/admin/login` avec le secret d'audit renvoie un cookie `nopalou_admin` dont la valeur **est** le secret (`app.js:283`, aussi `admin-auth.js:42`, `admin-auth.ts:124` qui écrit `ADMIN_SECRET` dans un cookie 7 jours et le compare par `===` non constant). Cookie HttpOnly + SameSite, `Secure` en production. Le verrou par IP tient (10 essais) mais ne couvre pas un attaquant distribué.
- **Impact** : le secret (13 caractères en production selon l'audit du 30/09) réside dans le navigateur, les proxys d'entreprise éventuels et les sauvegardes de profil ; il donne `super_admin` sans journal nominatif.

### AUD-144 — P2 — Les journaux d'accès contiennent clés API et numéros de téléphone
- **Preuve (VÉRIFIÉ, format de production de `morgan`)** : `GET /api/v1/prix?api_key=nopalou_sk_live_…` et `GET /api/locatif-immo/public/locataire-lookup?tel=770000042` apparaissent intégralement dans le journal. `requireApiKey` accepte `?api_key=`.
- **Impact** : secrets et données personnelles dans les journaux Render et tout outil qui les collecte.

### AUD-145 — P3 — Messages d'erreur bruts renvoyés aux clients
- **Preuve (VÉRIFIÉ, mode production)** : `/api/immo/?limit=abc`, `/api/offres/?produit_id=zzz`, `/api/telecom/?limit=abc` renvoient le texte PostgreSQL (« syntaxe en entrée invalide pour le type bigint : « abc » »). 171 retours de `err.message` dans 28 fichiers de routes non admin (recherche par motif, estimation haute). Le gestionnaire global d'erreurs, lui, masque bien le message en production.

### AUD-146 — P2 — Téléversements : filtre de type absent sur 8 envois, dont un anonyme
- **CODE** : `multer` sans `fileFilter` dans `agences.js`, `biens.js` (photos et vidéo 50 Mo), `comptabilite.js`, `paiement.js` (preuve de paiement), `locatif-immo.js` (15 Mo, y compris la route anonyme `public/bail/:id/documents`), `social-shop.js`, `boutiques-modules/helpers.js` (justificatif). Plafonds de taille présents partout. Comportement de stockage Cloudinary NON VÉRIFIÉ (neutralisé en audit).
- **Impact potentiel** : hébergement de fichiers arbitraires (HTML, SVG, exécutables) sous le compte Cloudinary de Nopalou.

### AUD-147 — P3 — Documents d'architecture et d'audit internes versionnés ; données réelles dans des fichiers de test
- **Preuve (VÉRIFIÉ)** : le dépôt suit `Cahier des Charges Technique et Architectural Intégral _ Nopalou.docx` (8,5 Mo ; contenu d'architecture générique, 0 motif de secret), `docs/AUDIT-*.md` et `PLAN-*.md` (cartographie détaillée des failles), `tests/test-compte-nav.js` (identifiant et adresse e-mail réels d'une agence partenaire), `scripts/qa-campaign/report-*.json` (numéros de téléphone), `docs/JOURNAL-LIVRAISONS.md` (1,8 Mo). **Visibilité du dépôt GitHub : NON VÉRIFIÉE** (aucun appel externe).
- Aucun secret réel trouvé dans les fichiers suivis (motifs `sk_live_`, `whsec_`, `EAA…`, `ghp_…`, jetons Telegram, URL PostgreSQL, clés Resend) ; `.env.example` ne contient que des valeurs d'exemple ; jamais de `.env` versionné dans l'historique (0 commit).

### AUD-148 — P3 — Aucune limitation par compte à la connexion
- **Preuve (VÉRIFIÉ)** : 25 mots de passe faux sur le même compte depuis 25 « IP » → 25 × 401, puis connexion correcte 200 (pas de verrou par compte). Seul le limiteur par IP existe (20/15 min). Même famille qu'AUD-064. Aucun CAPTCHA ni preuve de travail nulle part dans le code (recherche de motifs).

### AUD-149 — P3 — Politique de sécurité de contenu permissive et chunks d'administration publics
- `script-src 'unsafe-inline' 'unsafe-eval'` et `connect-src https: wss:` (`middleware.ts:97-102`) : le nonce généré n'est pas exploité. Les 303 fichiers de `.next/static` (dont chunks `app/admin/…`) sont servis sans authentification et révèlent 11 chemins `/api/admin/*` : inévitable avec Next, sans impact tant que l'autorisation serveur tient (rejouée ci-dessus). Aucune carte source dans `.next/static` (**conforme**).

### AUD-150 — P3 — Aucune détection de miroir, de proxy-clone ou de scraping
- **Preuve (VÉRIFIÉ)** : le frontend répond 200 pour `Host: evil.example` (aucune liste d'hôtes) ; les balises `canonical` et `og:url` sont absolues vers `NEXT_PUBLIC_SITE_URL` (point positif : un clone par proxy inverse garde la page canonique de Nopalou). Aucune télémétrie de scraping, piège (honeypot) ni alerte ; `vue_boutique` (7 549 événements dans la copie) compte aussi les robots.

### AUD-151 — P3 — Autres constats mineurs vérifiés
- Les erreurs CORS d'origine étrangère renvoient un 500 JSON générique (aucune fuite, comportement conforme mais bruyant). Les 404 d'API détaillent la route demandée (réfléchie en JSON, sans risque XSS).
- Les routes `produits/:prodId/{avis,composants,cross-sell,tarifs-quantite}` et `paiement-sequestre/*/statut` répondent 500 sur la copie de données avec un identifiant inexistant (cause non investiguée ici ; AUD-012 les avait traitées sur la base d'audit).

### AUD-152 — P3 — Aucune vérification de fraîcheur des correctifs de dépendances
- `npm audit` exige le registre npm (bloqué par la garde réseau) : **NON VÉRIFIÉ** (AUD-033 reste la référence).

## 5. Ce qui est conforme (avec preuve)

- Aucun secret dans les bundles client : 36 valeurs du `.env` racine et du `.env.local` frontend recherchées dans `.next/static` (303 fichiers), `public/` et `.next/server` (805 fichiers) ; seules `FRONTEND_URL` et le numéro public de contact `ADMIN_WHATSAPP_PHONE` (numéro affiché sur le site) y figurent ; aucun motif `sk_live`, `whsec`, `EAA`, JWT, jeton Telegram, URL de base. Aucune carte source servie (`productionBrowserSourceMaps: false`).
- Sondes de reconnaissance sur le frontend de production : `.env`, `.git/config`, `package.json`, `/graphql`, `/swagger`, `/metrics`, `/debug` → 404 (le 404 de `/.git/config` est la page « Page introuvable », sans contenu de dépôt) ; pas d'en-tête `Server` ni `X-Powered-By`.
- En-têtes de sécurité présents (HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, CSP) ; cookies de session `HttpOnly`, `Secure` en production, `SameSite=Lax`.
- Webhooks fail-closed, CORS strict (origines étrangères sans en-tête `Access-Control-Allow-Origin`), RBAC et isolation multi-tenant (voir §3).
- Les robots légitimes (Googlebot, `facebookexternalhit`, WhatsApp) passent ; le backend n'appelle jamais sa propre API en HTTP (recherche de motifs : 0) : le chatbot WhatsApp et le chatbot web interrogent la base directement.

## 6. Ce qui n'a pas pu être vérifié, et pourquoi

| Point | Raison / méthode de vérification |
|---|---|
| Topologie réelle de production (IP vue par le backend, Cloudflare ou WAF devant Render, `X-Forwarded-For`) | hors périmètre isolé ; relever dans les journaux Render la valeur de `:remote-addr` pour des visiteurs distincts |
| Contenu réel du sitemap de production | ne pas sonder nopalou.com depuis l'audit ; le propriétaire peut compter les `<loc>` de `/sitemap.xml` |
| `SSR_SECRET` défini sur les deux services Render | absent de `render.yaml` ; vérifier dans le tableau de bord |
| Baux et pièces d'identité réels en production | la copie du 24/09 ne contient aucun bail |
| Visibilité (privé ou public) du dépôt GitHub | aucun appel externe |
| Stockage Cloudinary des fichiers téléversés | clés factices en audit |
| Rappels Orange Money (UA du serveur Sonatel) | le chemin `/api/paiement/orange/webhook` contient `/webhook` donc est exempté du filtre d'UA (vérifié avec UA `Java/17`) ; comportement réel de Sonatel non rejouable |
| `npm audit` | registre npm inaccessible |
| Efficacité réelle du limiteur derrière le proxy de production | voir première ligne |

## 7. Actions hors code (à décider par le propriétaire)

1. **Révoquer immédiatement** le jeton GitHub du remote (AUD-136) et en créer un à portée minimale ; le jeton figure dans une transcription de session.
2. Vérifier en production : `SSR_SECRET` identique sur backend et frontend, contenu du sitemap, IP source vue par le backend.
3. Mesurer en base de production le nombre de baux et de pièces jointes (gravité réelle d'AUD-132) et de boutiques avec `rccm`/`ninea`/`compte_bancaire` renseignés (AUD-134).
4. Rotation de `ADMIN_SECRET` à ≥ 32 caractères (AUD-143) et purge des cookies existants.
5. Décider de la politique des numéros de téléphone d'annonces (révélation à la demande avec limite, ou affichage conservé), et du sens commercial du badge « vérifié » (critères de vérification : pièce d'identité, RCCM/NINEA, test d'appel).
6. Confirmer la visibilité du dépôt et envisager de sortir `docs/AUDIT-*`, `PLAN-*` et le `.docx` d'un dépôt qui serait public.

## 8. Annexe : commandes rejouables (environnement isolé)

- Démarrage : `. scripts\audit\audit-env.ps1` puis `powershell -File scripts\audit\start-stack.ps1 -Db nopalou_audit_data` ; mode production : relancer `node backend\app.js` avec `NODE_ENV=production` et `PORT=4101`, `SSR_SECRET=audit-ssr`.
- Plafonds : `GET /api/offres/`, `GET /api/immo/?limit=100000`, pagination `GET /api/annonces/?limit=50&page=1..93`.
- Filtre d'UA : requêtes avec `user-agent` = `python-requests/2.31`, `curl/8.4.0`, `node`, vide, navigateur ; avec et sans `authorization: Bearer x` ; `/api/v1/prix` avec `x-api-key`.
- IP publique simulée : en-tête `X-Forwarded-For: 203.0.113.9` (mode production).
- Fuite fiche boutique : `PUT /api/boutiques/:id` (propriétaire) avec `rccm`, `ninea`, `compte_bancaire` fictifs puis `GET /api/boutiques/:id` anonyme.
- Portail locataire : `GET /api/locatif-immo/public/locataire-lookup?tel=<9 chiffres>` avec un bail fictif inséré dans `nopalou_audit` (supprimé après l'audit).
- SSRF : `GET /assets/produit-promo?type=produit&nom=x&image=http://127.0.0.1:4100/api/health?ssrf_probe=1` puis lecture du journal du backend.
- Bundles : recherche des valeurs des fichiers `.env` dans `frontend-next/.next/static` (noms de variables seulement dans la sortie).

### Fichiers du frontend appelant le backend sans jeton SSR (heuristique, hors admin)
`sitemap.ts`, `categorie/[slug]/[sousCategorie]/page.tsx`, `recherche/page.tsx`, `promo/page.tsx`, `tarifs-boutique/page.tsx`, `creer-boutique/page.tsx`, `cgu/page.tsx`, `guide-emploi/page.tsx`, `checkout-express/page.tsx`, `suivi-commande/page.tsx`, `payer-annonce/[id]`, `payer-boost/[id]`, `payer-credit/[token]`, `payer-loyer/[echeanceId]`, `connexion/magique/page.tsx`, `[slug]/route.ts`, `assets/brochure-apporteur`, `assets/palier/[plan]/{carre,story}`, `api/auth/magic-login`, `admin-proxy/fb`. Seuls ceux qui joignent `GET /api/{produits,immo,annonces}` sont concernés par les filtres actuels.
