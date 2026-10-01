# Plan de correction : protection des données, anti-scraping, anti-copie (1er octobre 2026)

Rédigé pour : l'équipe technique de Nopalou, qui exécutera les corrections. Prérequis : `AUDIT-PROTECTION-DONNEES-2026-10-01.md` (fiches AUD-132 à AUD-152). **Ce document ne modifie aucun code.** Règles d'exécution (CLAUDE.md §3) : branche dédiée, commits locaux `fix(zone): AUD-NNN …`, jamais de `git push` sans ordre, environnement isolé `scripts/audit/`, preuve par test qui échoue sans le correctif (mutation), migrations idempotentes validées sur base vide puis existante.

## 1. Principe directeur : protéger sans dégrader l'expérience

Aucun contenu public légitime n'est retiré : on **plafonne le volume**, on **réduit les champs au nécessaire**, on **déplace les données sensibles derrière une action volontaire** et on **rend l'aspiration coûteuse**, par couches indépendantes :

| Couche | Mesure | Coût pour un utilisateur normal |
|---|---|---|
| 1. Minimisation | DTO publics explicites (fin des `SELECT *`/`o.*`), plafonds de pagination | nul |
| 2. Contacts à la demande | numéro masqué partout côté serveur, révélé par `POST …/reveal` limité et journalisé | un clic (déjà présent dans l'UI) |
| 3. Budgets par volume servi | limite en **lignes servies** par IP et par compte (pas en requêtes) | invisible en usage normal |
| 4. Robots vérifiés | liste blanche de crawlers légitimes (DNS inverse), jeton SSR conservé | nul |
| 5. Couche HTML | limiteur doux (Next ou CDN), jamais appliqué aux robots vérifiés | nul sous le seuil |
| 6. Détection | pièges (honeypots), tableau de bord de volume, alertes | nul |

Ce qui est écarté : blocage par User-Agent seul (contournable, nuisible aux partenaires), CAPTCHA systématique (friction), obfuscation côté client (contournée, voir AUD-137), retrait des pages du sitemap.

## 2. Matrice de non-blocage (à rejouer après chaque lot)

Chaque mécanisme de ce plan doit laisser ce tableau **vert** (test automatisé ou sonde, voir §6).

| Acteur / flux | Passe par | Attendu |
|---|---|---|
| Visiteur normal (navigateur, mobile 3G, PWA hors ligne) | pages SSR, API listes avec UA de navigateur | 200 ; aucune 429 sous 120 pages/min et sous le budget de lignes |
| Utilisateur connecté (marchand, POS, préchargement hors ligne) | API avec `Authorization` valide | budget compte supérieur ; préchargeur hors ligne (`useBoutiqueOfflinePreloader`) sans 429 |
| Googlebot, Bingbot | pages + sitemap | 200, jamais comptés ; DNS inverse vérifié |
| `facebookexternalhit`, WhatsApp, Twitterbot, LinkedInBot | pages + `opengraph-image` + `/assets/*` signés | 200 |
| Catalogue Meta / WhatsApp, Google Merchant | `/api/flux-catalogue/*`, `/api/boutiques/:slug/{meta,google}.xml`, `catalogue.csv` | 200 ; plafond propre au flux, hors budget des listes |
| Next SSR (rendu serveur) | `X-SSR-Token` | jamais limité ; `SSR_SECRET` présent sur les deux services |
| Chatbot web `/api/chat` | `limiterRecherche` 60/min | inchangé ; contacts masqués dans les réponses (voir AUD-137) |
| Bot WhatsApp | accès base direct (0 appel HTTP interne) | inchangé |
| API partenaire `/api/v1/*` | `X-Api-Key` | 401 si clé fausse, 200 si valide, pour curl/Python/Java ; **jamais 403 d'UA** |
| Webhooks Wave, Stripe, Orange, Meta | chemin `/webhook` + signature | inchangé |
| Locataire (portail) | OTP WhatsApp puis jeton de session | parcours complet jusqu'au PDF, signature, pièces |
| Paiement de loyer / de dette 1-clic | `/payer-loyer/:id`, `/payer-credit/:token` | inchangé |
| Administrateurs | JWT nominatif | inchangé |

## 3. Phases

**Statut au 01/10/2026 (branche `fix/protection-donnees`, commits locaux)** : Phase 0 faite ; AUD-132, 133, 134, 135 corrigées et prouvées (voir `JOURNAL-LIVRAISONS.md`) ; AUD-136 faite côté dépôt, révocation du jeton à la charge du propriétaire ; Phase 2 : AUD-137, 138, 139, 140, 141, 142 (partielle), 143 (partielle), 144, 146 corrigées et prouvées ; restent la Phase 3 (AUD-145, 147 à 152) et la configuration Cloudflare. Écarts par rapport au plan : AUD-133 protège les textes libres par la session (cookie) plutôt que par signature HMAC ; AUD-134 conserve `plan_actif` public (badges de vitrine).

| Phase | Contenu | Dépendances |
|---|---|---|
| 0 | Filet : kit de sondes `scripts/audit/protection/` (reprend l'annexe de l'audit), tests de référence, mesures de départ | — |
| 1 (P1) | AUD-136 (immédiat, hors code), AUD-132, AUD-133, AUD-134, AUD-135 | Phase 0 ; AUD-135 avant AUD-137/138/139 |
| 2 (P2) | AUD-137, 138, 139, 140, 141, 142, 143, 144, 146 | AUD-135 (DTO), AUD-140 avant AUD-141 |
| 3 (P3) | AUD-145, 147, 148, 149, 150 ; AUD-151/152 | — |
| 4 | Régression globale (§6) et mesures d'arrivée | tout |

Effort total estimé : ~16 à 20 jours-ingénieur (hors décisions produit et hors CDN).

## 4. Fiches de correction

Légende par fiche : **Cat.** catégorie ; **Preuve** renvoi à l'audit ; **Surface/Cause/Risque/Impact** repris de l'audit ; puis correction, fichiers, API, config, DB, protections, monitoring, critère d'acceptation (CA), test défensif (T), régression (R), retour arrière (RB), effort.

### Phase 1

#### AUD-136 — Jeton GitHub en clair (P1, secrets)
- Correction : **révoquer** le jeton aujourd'hui ; en créer un fine-grained (dépôt unique, droits minimaux, expiration 90 j) ; `git remote set-url origin https://github.com/BAMBAMAR/yombale.git` ; `git config --global credential.helper manager` ; pour un push ordonné, passer le jeton par `git -c http.extraheader="AUTHORIZATION: bearer $env:GITHUB_TOKEN" push` (variable d'environnement, jamais d'URL). Adapter la ligne « Authentification Git » de `CLAUDE.md` en ce sens. Activer GitHub secret scanning et push protection ; ajouter `gitleaks` en hook pre-commit.
- Config : aucune variable Render. DB/API : aucune.
- Monitoring : journal d'audit GitHub (connexions du jeton).
- CA : `git remote -v` ne contient aucun identifiant ; l'ancien jeton répond 401 (à vérifier par le propriétaire dans GitHub, pas depuis l'audit) ; `gitleaks detect` propre.
- T : `git remote -v | Select-String 'ghp_|github_pat_'` ne renvoie rien. R : push ordonné fonctionne avec la variable. RB : recréer un jeton. Effort : 0,25 j.

#### AUD-132 — Portail locataire contourne l'OTP (P1, accès non autorisé)
- Correction :
  1. Supprimer les accès par numéro seul : `GET /public/locataire-lookup`, `GET /public/bail/:id.pdf` sans jeton, `POST /public/bail/:id/signer`, `POST /public/bail/:id/documents`.
  2. `verifier-otp` (déjà présent) émet un **jeton de session locataire** signé (HMAC ou JWT, scope `locataire`, ids de baux, 30 min). Les routes lecture, PDF, signature et dépôt de pièces exigent ce jeton.
  3. Liens envoyés par WhatsApp (`immo-whatsapp-notifications.js:387`) : lien signé par bail (`lib/…Token.js` sur le modèle de `creditPaymentToken.js`), expirant (7 j), à usage de lecture du PDF uniquement ; plus jamais de route sans paramètre de preuve (supprimer la clause `$2 = ''`).
  4. Limiteurs : `demander-otp` et `verifier-otp` par IP et par numéro (5/h, déjà partiellement en service `otp`) ; réponse identique pour numéro inconnu et connu (fin de l'oracle).
  5. Pièces : `fileFilter` PDF/JPEG/PNG (AUD-146), 10 Mo.
  6. `quittance/:loyerId.pdf` : conserver l'URL UUID (capacité) mais la remplacer par lien signé à l'étape suivante si la décision produit l'accepte.
- Fichiers : `backend/routes/locatif-immo.js`, `backend/services/immo-whatsapp-notifications.js`, `backend/lib/` (nouveau jeton), `frontend-next/src/app/payer-loyer/components/{PortailLocataireClient,BailLocataireCard}.tsx`, `frontend-next/src/components/immo/DossierPiecesModal.tsx`.
- DB : aucune migration obligatoire. Config : `LOCATAIRE_TOKEN_SECRET` (nouveau, distinct de `JWT_SECRET`).
- Monitoring : compteur de refus 401/429 sur ces routes dans `security_audit_vault`.
- CA : sans OTP, toutes les routes ci-dessus renvoient 401 ; avec OTP valide, le parcours complet (consultation, PDF, signature, dépôt) fonctionne ; 60 numéros consécutifs → 429 dès le 6e ; réponses indistinguables pour numéro inconnu.
- T : test d'intégration contre `DATABASE_URL_TEST` avec bail fictif (comme dans l'audit), **contrôle par mutation** (réintroduire le contrôle par téléphone → le test doit échouer) ; Playwright : parcours locataire OTP.
- R : liens WhatsApp déjà envoyés (`?tel=`) cessent de fonctionner : prévoir un message de repli « demandez un nouveau lien » et un drapeau temporaire `LOCATAIRE_LEGACY_LINKS=true` (défaut `false`, retiré à la release suivante). Notifications immo, paiement 1-clic inchangés.
- RB : drapeau ci-dessus ou revert du commit. Effort : 2,5 j.

#### AUD-133 — SSRF aveugle et visuels falsifiables (P1, SSRF / anti-contrefaçon)
- Correction :
  1. `assets/produit-promo` : supprimer le paramètre `image` libre ; le serveur retrouve l'image par `produit_id` en base. Si le paramètre reste nécessaire, n'accepter que `https`, hôte dans une liste blanche (`res.cloudinary.com`, domaines Nopalou), pas d'adresse IP littérale, pas de redirection, délai 3 s, taille 2 Mo.
  2. **Signer** les paramètres de tous les générateurs `/assets/*` et `api/og-image` : `?…&sig=HMAC(params)` avec `ASSET_SIGNING_SECRET`; les liens de partage générés par le site et par le kit com admin portent la signature ; sans signature valide : visuel neutre générique (pas de texte libre) et `Cache-Control: no-store`.
  3. Limiteur par IP sur ces routes (30/min) et plafond de longueur de paramètres (120 caractères).
  4. Valeur par défaut « Vendeur Vérifié Nopalou » remplacée par une chaîne neutre (liée à AUD-140).
- Fichiers : `frontend-next/src/app/assets/**/route.tsx`, `src/app/api/og-image/route.tsx`, helper `src/lib/asset-signature.ts`, générateurs de liens du kit com admin et des pages de partage boutique.
- CA : la sonde `image=http://127.0.0.1:4100/…?ssrf_probe` **n'apparaît plus** dans le journal du backend ; un lien sans signature n'affiche pas de texte libre ; tous les liens générés par l'interface restent valides.
- T : test Vitest sur le validateur d'URL (hôtes, IP, redirection) ; sonde SSRF rejouée contre le build de production local ; mutation : retirer la liste blanche → la sonde doit de nouveau atteindre le backend.
- R : cartes déjà diffusées sur WhatsApp/Facebook : les anciennes URLs non signées donnent le visuel neutre (conserver 30 jours l'ancien rendu pour les seuls types `forfait_*` qui n'acceptent pas de texte libre) ; aperçus OG des crawlers (signature incluse dans `generateMetadata`).
- RB : revert ; drapeau `ASSET_SIGNATURE_ENFORCE=false` pour passer en mode journalisation seule. Effort : 2 j.

#### AUD-134 — Fiche boutique publique trop bavarde (P1, fuite de données)
- Correction : deux sérialiseurs dans `boutiques-crud.js` (ou `lib/serializers/boutique.js`) :
  - **public** : identité, description, catégorie, contacts publics, adresse, ville, logo, couverture, réseaux, horaires, slug, thème, bandeau, message d'accueil, devise, conditions de vente, mentions légales **seulement si** `mentions_legales_publiques = true` (nouvelle colonne, défaut `false` ; `rccm`, `ninea`, `forme_juridique` y sont affichés quand le marchand l'active ; **`compte_bancaire` jamais public**), identifiants de pixels (déjà visibles dans la page), badge de vérification (AUD-140) ; plus de `utilisateur_id`, `pos_remise_*`, `plan_actif` (remplacé au besoin par un booléen `vitrine_pro`), `regime_fiscal`, `mode_fonctionnement`, `capital_social`, `fidelite_*` hors affichage nécessaire.
  - **propriétaire** (jeton valide + appartenance via `requireBoutiqueOwnership`/`checkBoutiqueAccess`) : tous les champs actuels.
- Consommateurs : `boutiques/[id]/page.tsx:153` utilise `utilisateur_id` pour lister les annonces du marchand → fournir `GET /api/boutiques/:id/annonces` côté serveur ; `immo/[id]/page.tsx:230` (`isOwner`) : comparer côté serveur et renvoyer `est_proprietaire`. Écrans marchands (`ParametresFiscalite`, `RemisesPosTab`, `FideliteTab`) : lire via `GET /api/boutiques/mine` (vérifier que cette route renvoie bien tous les champs).
- DB : `ALTER TABLE boutiques ADD COLUMN IF NOT EXISTS mentions_legales_publiques BOOLEAN DEFAULT false` (idempotent ; valider sur `nopalou_fresh` et `nopalou_audit_data`).
- CA : `GET /api/boutiques/:id` anonyme ne contient aucune des clés `compte_bancaire, utilisateur_id, pos_remise_*, plan_actif, regime_fiscal` ; contient `rccm/ninea` uniquement si activés ; le propriétaire voit tout ; le storefront et le POS fonctionnent.
- T : intégration (marchand de test + anonyme + autre marchand) ; mutation : retirer le sérialiseur public → échec ; `tsc --noEmit`, suites front et back, `lint:slop`.
- R : types `boutiqueTypes.ts`/`types/index.ts`, caisse hors ligne (`boutique/caisse/types.ts` : lecture du plafond de remise caissier via la route propriétaire/caissier authentifiée, **à vérifier avant** de retirer les champs), documents PDF (utilisent la base, pas l'API publique : confirmer). RB : revert. Effort : 2 j.

#### AUD-135 — Aspiration du catalogue sans plafond (P1, scraping)
- Correction :
  1. Utilitaire `clampPagination(req, {def: 24, max: 50})` appliqué à **toutes** les routes listes publiques : `immo` (aujourd'hui sans plafond), `telecom`, `produits` (5 000 → 100), `annonces`, `boutiques`, `search`, `agences/public`.
  2. `GET /api/offres` : exiger `produit_id` ou `marchand_id`, plafond 200, colonnes explicites (sans `o.*`, sans `quarantinee`, sans `scraped_at` si inutile) ; export complet réservé à `adminAccess('produits')`.
  3. **Budget de lignes servies** : `limiterBudget` (clé IP, ou compte pour les connectés) comptant les lignes renvoyées : anonyme 600 lignes/15 min, compte avec e-mail vérifié 3 000/15 min, SSR et robots vérifiés exemptés. Réponse 429 `Retry-After` et message sans mention « accès illimité ». Remplace l'exemption actuelle `req.user` de `limiterBulk`.
  4. Pagination par curseur pour les gros parcours légitimes (sitemap, flux) via endpoints dédiés (AUD-139).
  5. En-têtes de cache sur les listes (`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`) : réduit la charge et la valeur de la rafale, sans effet visible.
- Fichiers : `backend/routes/{offres,immo,annonces,produits,telecom,boutiques-modules/boutiques-crud,agences,search}.js`, `backend/middlewares/rateLimit.js`, nouveau `backend/lib/pagination.js`.
- Config : `SCRAPE_BUDGET_ANON`, `SCRAPE_BUDGET_USER` (valeurs par défaut ci-dessus, réglables sans redéploiement via `settings`).
- Monitoring : compteur de lignes servies par IP/compte ; à 70 % du budget, entrée `security_audit_vault` ; tableau « Top 10 consommateurs » dans `/admin/system` (AUD-150).
- CA : `GET /api/offres/` sans filtre → 400 ; `immo?limit=100000` renvoie ≤ 50 lignes ; l'aspiration scriptée de 93 pages d'annonces est interrompue par un 429 avant la page 25 (anonyme) ; un utilisateur qui parcourt 20 pages à la main n'est jamais limité ; le SSR et le sitemap restent à 200.
- T : script `scripts/audit/protection/harvest.js` (rafale en mode production avec `X-Forwarded-For`), mutation (retirer le plafond → le script récupère de nouveau tout) ; test de non-blocage de la matrice §2 ; mesure de la taille/temps des listes.
- R : écrans qui demandent beaucoup de lignes (admin, comparateur `?limit=`, `ProduitsListe` « voir plus », sitemap, cartes immo) : recenser les `limit=` du frontend (`rg "limit=" frontend-next/src`) et ajuster ; flux catalogue exclus du budget.
- RB : variables de budget à valeur très haute (désactivation sans revert). Effort : 3,5 j.

### Phase 2

#### AUD-137 — Masquage des numéros : le rendre réel (P2, scraping/vie privée)
- Correction : serveur renvoie `contact_tel_masque` (`78 589 •• ••`) et `contact_tel_disponible: true`, **jamais** `contact_tel` dans les listes, détails et JSON-LD des particuliers ; `POST /api/immo/:id/contact` et `POST /api/annonces/:id/contact` renvoient le numéro et un lien WhatsApp ; limiteur 10/h/IP et 40/jour/compte ; Turnstile invisible déclenché au-delà de 5 révélations/h (décision CDN, voir §5) ; chaque révélation enregistrée comme lead (`show_phone_number_immo` côté serveur, remplace l'événement client). Les agences certifiées conservent leur numéro de contact commercial officiel dans le JSON-LD. Chatbot web et WhatsApp (`searchImmoIlike`, `searchContentIlike`) : n'affichent que les numéros masqués, révélation sur demande explicite avec la même limite par utilisateur.
- Fichiers : `routes/immo.js`, `routes/annonces.js`, pages `immo/[id]`, `annonces/[id]`, `BlocAgenceAnnonce.tsx`, cartes de liste, JSON-LD, `chat.js`.
- CA : le HTML initial, le flux Next et le JSON-LD ne contiennent aucun numéro complet de particulier ; un clic le révèle en < 500 ms ; 11 révélations en 1 h depuis une IP → 429/Turnstile.
- T : Playwright (page détail, lien `tel:` après clic), grep du HTML (0 occurrence du numéro), mutation. R : SEO (aucun impact attendu : le numéro de particulier n'est pas un signal), accessibilité du bouton, analytique de leads (continuité des courbes à valider). RB : drapeau `CONTACT_REVEAL_ENFORCE=false`. Effort : 3 j.

#### AUD-138 — Remplacer le filtre d'UA par des protections efficaces et inoffensives (P2)
- Correction : retirer `botBlockerMiddleware` d'`app.js` ; ne garder `blockScraperUA` que comme **signal** (journalisé, abaisse le budget), jamais comme refus des clients à clé API ; exempter `/api/v1/*` et toute requête avec `X-Api-Key` (la clé a son propre limiteur) ; ne plus exempter sur la seule présence d'un en-tête `Authorization` (utiliser `req.user` validé). Nouveau `lib/verified-bots.js` : Googlebot et Bingbot validés par DNS inverse + DNS direct (cache 24 h), `facebookexternalhit`/WhatsApp/Twitterbot/LinkedInBot/Google-Merchant acceptés par UA sur les seules routes pages/flux/aperçus (sans contacts). Couche HTML : limiteur doux dans `middleware.ts` (120 pages/min/IP hors robots vérifiés, réponse 429 `Retry-After`) **ou**, de préférence, règle CDN (§5). `robots.txt` : conserver l'interdiction des robots d'IA, ajouter `Google-Extended`, `PerplexityBot`, `Applebot-Extended`, `Amazonbot` selon décision ; précision : indicatif seulement.
- CA : `/api/v1/prix` avec `X-Api-Key` factice → 401 pour curl, Python, Java, Go ; Googlebot de test (UA + IP simulée vérifiée par stub) → 200 ; 150 pages/min depuis une IP anonyme → 429 au-delà du seuil ; navigation normale jamais limitée.
- T : `ua-test.js`/`limit-test.js` rejoués (mode production), tests unitaires du validateur DNS avec résolveur simulé. R : matrice §2 entière. RB : drapeaux `BOT_SIGNAL_ONLY`, `HTML_LIMITER_ENFORCE`. Effort : 3 j.

#### AUD-139 — Sitemap complet et sans filtre (P2)
- Correction : endpoint `GET /api/sitemap/ids?type=produit|boutique|annonce|immo|agence&page=N` (jeton SSR **obligatoire**, 5 000 ids + `updated_at`, aucun champ personnel) ; `sitemap.ts` et `generateSitemaps` produisent un index avec plusieurs fichiers ; tous les `fetch` serveur du frontend passent par `backendFetch`/`apiFetch` (jeton SSR). Vérifier `SSR_SECRET` sur les deux services Render et l'ajouter à `render.yaml` (`sync: false`).
- CA : `sitemap.xml` contient toutes les annonces, boutiques et biens actifs (comptage = comptage SQL) ; en production simulée (IP publique, UA `node`) le sitemap reste complet. T : intégration + comparaison au comptage base ; mutation : retirer le jeton → le sitemap doit tomber, ce qui prouve que le test détecte le défaut. R : budget SEO (soumission Search Console après déploiement). RB : revert. Effort : 1,5 j.

#### AUD-140 / AUD-141 — Badge de confiance réel et noms de marque réservés (P2, anti-contrefaçon)
- Taxonomie à afficher et à exposer en API/JSON-LD : **Nopalou officiel** (comptes de la plateforme), **Vendeur certifié** (vérifié par Nopalou), **Vendeur non vérifié** (par défaut), **Source tierce** (comparateur, avec nom du marchand scrapé).
- DB (idempotent) : `boutiques.statut_verification VARCHAR(20) NOT NULL DEFAULT 'non_verifie' CHECK (statut_verification IN ('non_verifie','verifie','certifie'))`, `verifie_le TIMESTAMPTZ`, `verifie_par UUID` ; idem `agences_immo` (distinct de `numero_agrement` texte libre). Table `entites_officielles` (canaux officiels : site, WhatsApp, Telegram, réseaux).
- Correction : action admin « Vérifier / Certifier / Retirer » dans `/admin/boutiques` et `/admin/immo/agences` avec journal `admin_audit_logs` ; critères documentés (pièce d'identité, RCCM/NINEA, appel de contrôle). `BoutiqueInfosTab.tsx` et `BoutiqueCard.tsx` n'affichent le badge (icône `ShieldCheck` Lucide 14 px, tokens Nopalou) **que** si `statut_verification !== 'non_verifie'` ; textes « 100 % vérifiés », « Agréments Contrôlés », « Badge Vendeur Vérifié & Certifié » reformulés selon le réel (même démarche qu'AUD-115) ; compteur « boutiques vérifiées » calculé. Page publique `/verifier/[slug]` + `GET /api/verifier/:slug` (statut, date) et page `/officiel` listant les seuls canaux officiels. Noms réservés : `lib/noms-reserves.js` (normalisation NFKD, minuscules, suppression d'accents, de séparateurs et substitutions `0→o`, `1→l`, `$→s`) bloquant « nopalou », « yombale », « officiel nopalou », « support nopalou », « service client nopalou » dans nom/slug de boutique et d'agence, sauf compte `entites_officielles` ; les 2 boutiques existantes contenant « nopalou » sont signalées pour revue manuelle (aucune suppression automatique).
- CA : une boutique neuve n'affiche aucun badge ; l'admin certifie → badge et JSON-LD cohérents ; « Nopalou Officiel - Support Paiement » refusé en création et en renommage (400 explicite) ; slugs réservés refusés.
- T : intégration, Playwright (badge conditionnel), test des variantes homoglyphes ; mutation. R : colonne par défaut `non_verifie` pour toutes les boutiques existantes **réduit la confiance affichée** : prévoir un lot de vérification des ~65 boutiques actives (décision produit §5) avant le déploiement visible. RB : drapeau `BADGE_VERIFICATION_ENFORCE`. Effort : 4 j.

#### AUD-142 — Champs internes publics (P2/P3)
- Correction : DTO publics pour `boutiques/:id/produits` et détail (`stock_quantite` remplacé par `stock_etat: 'disponible' | 'faible' | 'rupture'`, retrait de `statut_moderation`, `motif_moderation`, `modere_le`, `whatsapp_sync_*`, `partage_le`, `code_barre`, `variantes_skus` si non affichés, `date_expiration` conservée seulement pour les produits périssables affichés), `immo` (liste blanche de colonnes), `agences/public` (sélection des champs vitrine de `parametres`, `email_contact` retiré si non affiché), `settings/public` en **liste blanche** de clés (retirer `max_*_par_*`, `alertes_*`, `commission_business`, taux apporteur ; numéros Wave/OM manuels seulement sur l'écran de paiement authentifié ou conservés si affichés publiquement par choix produit). `plan_actif` retiré de la liste (voir AUD-134).
- CA/T : test de contrat « aucune clé interdite » par route (liste de clés interdites versionnée) ; consommateurs front vérifiés par `tsc`. R : POS/stock côté marchand (routes authentifiées inchangées). RB : revert. Effort : 2 j.

#### AUD-143 — Secret maître encore en cookie (P2, secrets)
- Correction : ne plus écrire `ADMIN_SECRET` dans un cookie (`app.js:283`, `admin-auth.js:42`, `admin-auth.ts:124`) ; la connexion par secret délivre un JWT admin court (8 h) comme la connexion nominative ; l'accès par en-tête `X-Admin-Secret` devient « break-glass » désactivé par défaut (`ADMIN_BREAKGLASS=false`), comparaison à temps constant ; alerte à chaque usage ; rotation à ≥ 32 caractères (action d'exploitation). Migrer les actions serveur qui lisent `COOKIE_SECRET` (dépendance notée dans le plan du 30/09).
- CA : aucune réponse ne contient de `Set-Cookie` à la valeur du secret ; accès admin par JWT intact ; ancien cookie ignoré. T : sonde `admin-chk.js` rejouée, `verify-rbac.js` 150/150. RB : `ADMIN_BREAKGLASS=true`. Effort : 1,5 j.

#### AUD-144 — Secrets et numéros dans les journaux (P2)
- Correction : jeton `morgan` `:safeurl` qui masque `api_key`, `token`, `tel`, `code`, `secret`, `email`, `phone`, `apikey`, `access_token` dans la requête (aussi dans le journal de requête SSR et Sentry via `beforeSend`) ; `requireApiKey` n'accepte plus `?api_key=` (en-tête uniquement, période de dépréciation de 30 jours avec avertissement dans la réponse) ; journaux existants : purge selon la rétention Render.
- CA : après appels de test, aucune occurrence de la clé ou du numéro dans le journal. T : test unitaire du formateur. R : partenaires utilisant `?api_key=` (prévenir). RB : revert. Effort : 1 j.

#### AUD-146 — Téléversements sans filtre de type (P2)
- Correction : `lib/upload-filters.js` (liste blanche de types par usage + vérification des octets magiques via `file-type`), appliqué aux 8 envois ; Cloudinary `allowed_formats` et `resource_type` explicites ; la route anonyme disparaît avec AUD-132.
- CA : un fichier `text/html` ou exécutable est refusé (400) sur chaque route ; images et PDF légitimes passent. T : test de téléversement par type (Cloudinary simulé). R : formats HEIC des mobiles (convertir ou accepter), vidéos de bien. RB : revert. Effort : 1,5 j.

### Phase 3

| Fiche | Correction | Fichiers | CA / T | Effort |
|---|---|---|---|---|
| AUD-145 | `lib/safe-error.js` ; validation `express-validator` des `limit`, `page`, `uuid` (400, plus de 500) ; remplacer les 171 `err.message` en commençant par les routes publiques (`immo`, `offres`, `telecom`, `auth`, `produits`) | `backend/routes/*` | `limit=abc` → 400 sans texte SQL ; test de contrat sur les routes publiques | 2 j |
| AUD-147 | `git rm --cached` du `.docx`, des `docs/AUDIT-*`, `PLAN-*`, rapports `scripts/qa-campaign/report-*.json`, anonymisation de `tests/test-compte-nav.js` ; `.gitignore` ; décision sur la réécriture d'historique (`git filter-repo`, coordination requise) si le dépôt est ou a été public ; `gitleaks` en CI | racine, `docs/`, `tests/` | `git ls-files` sans ces fichiers ; scan propre | 0,5 j |
| AUD-148 | limiteur par compte : 5 échecs/15 min puis délai progressif (table `login_attempts` ou Redis), Turnstile après 3 échecs, alerte admin sur motif répété | `routes/auth.js`, `middlewares/rateLimit.js` | 25 échecs depuis 25 IP → verrou du compte, connexion correcte après délai ; mutation | 1,5 j |
| AUD-149 | CSP en `Report-Only` d'abord (nonce + `strict-dynamic`, retrait de `unsafe-eval` si GTM le permet) puis application ; surveiller les rapports | `frontend-next/src/middleware.ts` | zéro violation sur les parcours critiques (Playwright) | 1,5 j |
| AUD-150 | Détection : (a) pièges invisibles (`aria-hidden`, `tabindex=-1`, interdits par robots) dont l'ouverture marque l'IP ; (b) panneau « Consommation » dans `/admin/system` (top IP/comptes par lignes servies, 429 par route, classes d'UA) ; (c) journalisation (sans blocage) des `Host` hors liste d'hôtes de Nopalou pour repérer les miroirs ; (d) exclusion des robots des événements `vue_boutique` ; (e) hors code : veille de marque (alertes sur « Nopalou », domaines proches `nopalou.co/.sn`), clause CGU interdisant l'extraction automatisée, procédure de signalement DMCA/hébergeur | `security_audit_vault`, `admin-system.js`, `SystemAlertsCard.tsx` | un hit sur le piège est visible dans le panneau en < 1 min ; faux positifs humains = 0 sur le parcours Playwright | 3 j |
| AUD-151 | CORS : répondre 403 JSON au lieu de 500 ; recenser les 500 des routes produits-boutique avec identifiants inexistants | `app.js`, `boutiques-produits.js` | 403 sur origine étrangère ; 404 propres | 0,5 j |
| AUD-152 | `npm audit --omit=dev` hors environnement isolé (poste connecté) ; traiter selon AUD-033 | `package.json` | rapport joint au journal | 0,5 j |

## 5. Décisions du propriétaire (questionnaire du 01/10/2026)

| Décision | Choix retenu | Effet sur le plan |
|---|---|---|
| CDN/WAF devant `nopalou.com` et l'API | **Oui, Cloudflare** | AUD-138 : règles de débit et mode anti-bots au niveau CDN ; limiteur Next en secours seulement ; Turnstile pour AUD-137 et AUD-148 ; action d'exploitation (DNS, règles) à planifier |
| Numéros d'annonces de particuliers | **Masqués, révélés au clic** | AUD-137 tel que décrit |
| Badge « Vendeur Vérifié » | **Calculé : abonnement payant actif + 20 commandes livrées, avec décision manuelle possible de l'admin** | AUD-140 : `statut_verification` = attribution automatique par tâche planifiée (abonnement payant actif hors essai et hors attributions admin, via les encaissements réels `abmt_` ; ≥ 20 commandes `livree` ; aucun litige ouvert) **ou** forçage par l'admin (certifier / retirer, journalisé) ; l'admin l'emporte sur le calcul ; perte du badge si l'abonnement expire. Les boutiques actuelles repartent sans badge tant que le seuil n'est pas atteint (pas de lot manuel obligatoire). **Précisions décidées** : abonnement payant actif depuis ≥ 30 jours ; sont exclus du calcul les abonnements offerts (`admin_test_`), les commandes de test et les ventes POS de la boutique sur elle-même (seules les commandes web livrées à un tiers comptent) |
| RCCM / NINEA / forme juridique | **Sur option du marchand** | AUD-134 : colonne `mentions_legales_publiques` (défaut `false`) ; validation juridique à faire |
| Dépôt GitHub | **Privé ; sortir les documents sensibles du suivi git** | AUD-147 sans réécriture d'historique ; confirmer la visibilité du dépôt dans les paramètres GitHub (non vérifiable depuis l'audit) |
| Robots d'IA | **Interdire l'entraînement, autoriser les assistants** | AUD-138 : `robots.txt` interdit GPTBot, CCBot, ClaudeBot, Google-Extended, Applebot-Extended, Bytespider, PerplexityBot (indexation/entraînement), Amazonbot, etc. ; autorise ChatGPT-User, Perplexity-User et équivalents agissant à la demande d'un utilisateur (retirer `ChatGPT-User` de la liste actuelle) ; application réelle par règles Cloudflare |

## 6. Stratégie de test et indicateurs de sortie

- **Phase 0** : transformer l'annexe de l'audit en kit `scripts/audit/protection/` (`harvest.js`, `ua-test.js`, `limit-test.js`, `exposure.js` contrôlant les clés interdites, `lookup.js` portail locataire, `ssrf.js`, `bundle-scan.js`) et enregistrer les mesures de départ (12 348 offres/requête, 3 091 annonces/requête, 3 808 numéros par moissonnage, etc.).
- Tests : unitaires (validateurs, sérialiseurs, jetons), intégration contre la base locale (`DATABASE_URL_TEST`), **mutation** pour chaque fiche, Playwright (révélation de numéro, badge, portail locataire, partage d'image), non-régression des suites existantes (`tsc --noEmit`, suites back/front, `npm run lint:slop`).
- Chaque lot : migration validée `MIGRATE_STRICT=true node scripts/audit/freshmig.js 2 nobase` puis sur `nopalou_audit_data` ; entrée en tête de `docs/JOURNAL-LIVRAISONS.md`.
- **Indicateurs de sortie** : (1) aspiration scriptée anonyme du catalogue d'annonces interrompue avant 25 % du volume et `offres` non exportable ; (2) 0 numéro de particulier dans HTML, JSON-LD et listes API ; (3) 0 clé interdite dans les réponses publiques ; (4) 0 % de 403/429 sur la matrice de non-blocage §2 ; (5) portail locataire : 0 accès par numéro seul ; (6) sonde SSRF sans trace ; (7) sitemap complet en simulation de production ; (8) matrices IDOR (475 routes) et RBAC (150/150) toujours conformes ; (9) `gitleaks` propre et remote sans identifiant.

## 7. Plans de retour arrière (synthèse)

Chaque protection est livrée **derrière un drapeau dans `settings`** (valeur par défaut = active), de façon à la désactiver sans redéploiement en cas de blocage d'un flux légitime : `BOT_SIGNAL_ONLY`, `HTML_LIMITER_ENFORCE`, `CONTACT_REVEAL_ENFORCE`, `ASSET_SIGNATURE_ENFORCE`, `LOCATAIRE_LEGACY_LINKS`, `BADGE_VERIFICATION_ENFORCE`, `ADMIN_BREAKGLASS`, budgets `SCRAPE_BUDGET_*`. Les migrations sont additives (colonnes avec défaut, aucune suppression) ; le retour arrière applicatif est un revert de commit.
