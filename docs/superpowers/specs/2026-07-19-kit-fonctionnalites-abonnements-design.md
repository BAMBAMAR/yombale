# Kit fonctionnalités & abonnements — page compte + visuels commerciaux

## Contexte

Retour utilisateur direct : dans `/compte`, aucun lien ne présente les fonctionnalités du site ni les paliers d'abonnement boutique. Côté admin, 3 kits de communication existent déjà (`/admin/communication` : communication générale, démarchage partenaires B2B, assistant WhatsApp) mais aucun ne couvre spécifiquement « qu'est-ce que le site propose et qu'est-ce qui change selon l'abonnement » — utile à la fois pour convaincre un marchand d'upgrader et pour donner à un apporteur d'affaires un support visuel à partager.

La liste des avantages Pro/Business existe déjà, mais seulement en dur dans `AbonnementClient.tsx` (`PLANS_INFO`), sans palier Gratuit explicite, et sans lien vers les autres fonctionnalités du site (comparateur produits, immo, télécom, alertes, assistant WhatsApp, apporteur d'affaires).

## Objectif

Un chantier unique en 5 volets, alimentés par une seule source de données :
1. Une page `/compte/fonctionnalites` — vue d'ensemble du site + paliers boutique, personnalisée légèrement selon l'abonnement actuel de l'utilisateur connecté.
2. Trois visuels commerciaux par palier (Gratuit / Pro / Business), en 2 formats chacun (carré 1080×1080 et story 1080×1920) — même niveau d'exigence visuelle que `/assets/chatbot-whatsapp`.
3. Diffusion de ces visuels : nouvelle section dans `/admin/communication` (usage fondateur), plus liens réutilisant les mêmes routes depuis `/compte/apporteur` et l'onglet Marketing de `/boutique`.
4. Un 5ᵉ type de génération automatique sur `/admin/publications` (« 🎯 Promo abonnement ») produisant un post Facebook/Instagram prêt à publier autour d'un palier — réutilise `PALIERS_BOUTIQUE` et les visuels du volet 2.
5. Plus de variation dans les 4 types de génération automatique existants (`bon-plan`, `comparatif`, `immo`, `conseil`) — chacun gagne plusieurs gabarits de texte tirés au hasard en plus de la donnée déjà variable (produit/annonce), et `conseil` (actuellement 0 donnée dynamique, seulement 2 textes fixes) passe à 8 textes fixes.

## Hors périmètre

- Pas de nouveau champ en base — tout le contenu (paliers, avantages, prix) reste dérivé des `settings` déjà lus par `AbonnementClient.tsx` (`plan_pro_prix`, `plan_business_prix`) et d'une nouvelle liste statique côté frontend.
- Pas d'onboarding interactif / tour guidé — une page de référence statique, pas un parcours pas-à-pas.
- Pas de personnalisation profonde de la page compte (pas de contenu différent selon le palier, seulement une mise en surbrillance + CTA).
- Aucun texte de démarchage/copier-coller supplémentaire n'est un objectif en soi — si le kit admin en inclut, il suit le pattern déjà en place dans les 3 autres kits (texte court contextualisant chaque visuel), pas un nouveau système de templates.

## 1. Source de données partagée

Nouveau fichier `frontend-next/src/lib/fonctionnalites-data.ts`, exporté et importé par les 3 volets ci-dessous — jamais dupliqué.

**Contenu** :
- `FONCTIONNALITES_PLATEFORME` : liste des fonctionnalités non liées à un abonnement (comparateur produits, immo, télécom, alertes prix, assistant WhatsApp, apporteur d'affaires) — `{ id, emoji, label, description }`.
- `PALIERS_BOUTIQUE` : 3 entrées (`gratuit`, `pro`, `business`), chacune `{ id, label, couleur, avantages: string[] }`. Migré et étendu depuis `PLANS_INFO` (`AbonnementClient.tsx` lignes 11-36) — le palier `gratuit` est nouveau (n'existe dans aucune liste actuelle), ses avantages sont à rédiger en cohérence avec ce que `boutique/BoutiqueClient.tsx` autorise réellement sans abonnement (à vérifier en implémentation contre le code réel, pas supposé).
- Les prix (`plan_pro_prix`/`plan_business_prix`) restent lus depuis `settings` là où ils sont affichés (page compte, visuels) — jamais codés en dur dans ce fichier, cohérent avec la règle déjà établie sur ce projet (voir CLAUDE.md, correctif du 7 juillet sur les prix codés en dur).

**Remplacement de `PLANS_INFO`** : `AbonnementClient.tsx` importe `PALIERS_BOUTIQUE` depuis ce nouveau fichier au lieu de sa liste locale — aucun changement de comportement visuel attendu sur cette page, seule la source change.

## 2. Page `/compte/fonctionnalites`

**Fichier** : `frontend-next/src/app/(account)/compte/fonctionnalites/page.tsx` — Server Component, dans le même groupe de routes que le reste de `/compte` (protection déjà couverte par `PROTECTED_ROUTES` du middleware, préfixe `/compte`).

**Contenu** :
- Section 1 « Ce que Nopalou propose » — les 6 fonctionnalités plateforme en cartes simples (emoji + label + description courte), sans dépendance à l'abonnement.
- Section 2 « Boutique — choisissez votre palier » — 3 colonnes (Gratuit/Pro/Business), avantages listés depuis `PALIERS_BOUTIQUE`.

**Personnalisation légère** : le composant lit si l'utilisateur possède une boutique et son abonnement actif (même mécanisme que `/boutique/abonnement`, page qui fait déjà cette lecture). Si oui : bordure/badge « Votre palier actuel » sur la colonne correspondante, CTA « Passer à Pro »/« Passer à Business » vers `/boutique/abonnement` sur les paliers supérieurs. Si non (pas de boutique) : page neutre, aucune section ne se distingue visuellement.

**Découvrabilité** :
- Nouvelle carte dans `compte/page.tsx` (`MENU`) : `{ href: '/compte/fonctionnalites', label: 'Fonctionnalités & abonnements', emoji: '📖', desc: 'Découvrez tout ce que Nopalou propose', actif: true }`.
- Nouveau lien dans `AccountNavLinks.tsx`, groupe « Compte », à côté de « Mon profil ».

## 3. Visuels par palier

**Routes** : `frontend-next/src/app/assets/palier/[plan]/carre/route.tsx` (1080×1080) et `frontend-next/src/app/assets/palier/[plan]/story/route.tsx` (1080×1920), `plan` ∈ `gratuit`/`pro`/`business` — validé en début de route, `notFound()` si valeur hors de cette liste.

**Contraintes techniques** (identiques aux chantiers visuels précédents sur ce projet) :
- `export const runtime = 'edge'` obligatoire.
- `system-ui` uniquement (pas de police custom — bug documenté `@vercel/og` sous Windows).
- `display: flex` explicite sur chaque élément (contrainte Satori/`next/og`).

**Contenu** : nom du palier, ses avantages (`PALIERS_BOUTIQUE[plan].avantages`), prix si Pro/Business (lu depuis `settings` server-side, `apiFetch` ou équivalent), palette de marque `#1C2B4A`/`#C75B00` plus une couleur d'accent par palier (`PALIERS_BOUTIQUE[plan].couleur` — Pro `#C75B00`, Business `#1e3a5f` déjà définis, Gratuit à définir en implémentation, ex. une teinte neutre `#64748B`).

**Direction visuelle** : même niveau d'exigence que `/assets/chatbot-whatsapp` (composition asymétrique, halos décoratifs, badges à bordure, pas de simple liste centrée sur fond plat) — à calibrer via le skill `frontend-design` en implémentation, pas de JSX figé dans cette spec.

## 4. Diffusion

**Admin** — nouvelle section « 🎯 Kit fonctionnalités & abonnements » ajoutée à `frontend-next/src/app/admin/(protected)/communication/page.tsx` (4e kit, même pattern que les 3 existants) : les 6 liens de visuels (3 paliers × 2 formats), avec un court texte contextualisant chaque palier pour le démarchage — suit le pattern déjà en place dans les kits existants du même fichier, pas de nouveau système.

**Apporteur** — `frontend-next/src/app/(account)/compte/apporteur/page.tsx` (ou son composant client associé) gagne un lien/bouton vers les 3 visuels (au moins le format carré, pour rester simple) — réutilise directement les routes ci-dessus, pas de nouvelle génération d'image.

**Marchand** — l'onglet Marketing de `/boutique` (`MarketingBoutique`, `BoutiqueClient.tsx`) gagne un lien vers le visuel de son propre palier actuel (déjà connu via `planActif`, prop déjà présente sur ce composant) — pas de nouvelle section complexe, un lien simple vers `/assets/palier/{planActif}/carre`.

## 5. Nouveau type de génération « Promo abonnement »

**Fichier** : `backend/routes/facebook-posts.js`, route `GET /generer/:type` — nouveau branchement `type === 'abonnement'`.

**Contenu** : tire au hasard un palier parmi `pro`/`business` (jamais `gratuit` — rien à vendre sur ce palier), compose un message à partir de `PALIERS_BOUTIQUE[palier].avantages` (les 3 premiers avantages listés en aperçu dans le texte) et du prix réel lu depuis `settings.plan_{pro,business}_prix` (jamais codé en dur, même règle que le reste de ce chantier). `image_url` pointe vers la route déjà créée `/assets/palier/{palier}/carre` (volet 2) — pas de nouvelle génération d'image, réutilisation directe. `lien` pointe vers `https://nopalou.com/boutique/abonnement`.

**Frontend** : nouveau bouton `🎯 Promo abonnement` dans `frontend-next/src/app/admin/(protected)/publications/page.tsx`, à côté des 4 boutons existants (`generer('abonnement')`), même pattern que les autres.

**Backend — accès à `PALIERS_BOUTIQUE`** : ce fichier de données vit actuellement dans `frontend-next/src/lib/` (TypeScript, importé par des Server/Client Components). `facebook-posts.js` est un fichier backend Express (CommonJS). La liste des avantages et couleurs par palier est donc dupliquée en JS pur dans `facebook-posts.js` (tableau `PALIERS_AVANTAGES` local, 3 entrées, mêmes textes que `PALIERS_BOUTIQUE.avantages` au moment de l'implémentation) — dupliquer une liste de 3×3 chaînes entre backend et frontend est acceptable ici (pas de logique, juste du texte d'affichage), largement moins risqué que de faire dépendre le backend Express du bundler Next.js. Si l'un évolue, mettre l'autre à jour (note à ajouter en commentaire dans les deux fichiers).

## 6. Plus de variation dans les 4 types de génération existants

**Fichier** : `backend/routes/facebook-posts.js`, route `GET /generer/:type`.

**`conseil`** (actuellement 2 textes fixes, `type === 'conseil'`, lignes 190-202) : passe à 8 textes fixes, même structure (`{ message, image_url: null, lien: 'https://nopalou.com' }`), tirage aléatoire dans le tableau élargi — thèmes variés (téléphone déjà couvert, ajouter : immobilier, télécom/forfaits, sécurité de paiement en ligne, comment repérer un bon vendeur, profiter des alertes de prix, utiliser l'assistant WhatsApp, comparer avant les fêtes/rentrée).

**`bon-plan`, `comparatif`, `immo`** (actuellement chacun a un seul gabarit de message, la variation ne vient que du produit/annonce tiré au hasard en base) : chaque type gagne 2-3 gabarits de texte alternatifs (accroche différente, même structure d'information — prix, marchand/lieu, lien, hashtags), un gabarit tiré au hasard à chaque génération en plus du produit/annonce déjà aléatoire. Les gabarits restent des template literals JS (pas de nouveau système de templating) — cohérent avec le style actuel du fichier.

## Vérification

- `npx tsc --noEmit` propre côté `frontend-next`.
- Les 6 routes `ImageResponse` testées par fetch direct (HTTP 200, `image/png`, dimensions correctes) pour les 3 paliers × 2 formats — même méthode que les chantiers visuels précédents (aucun outil de capture navigateur disponible dans l'environnement).
- Page `/compte/fonctionnalites` vérifiée avec un compte sans boutique (page neutre) et un compte avec boutique Pro ou Business active (palier actuel mis en surbrillance, CTA correct) — parcours manuel local.
- `AbonnementClient.tsx` : confirmer visuellement (ou par diff) qu'aucun changement de comportement n'apparaît après la migration vers `PALIERS_BOUTIQUE` (non-régression).
- Grep pour confirmer qu'aucun prix Pro/Business n'est codé en dur dans le nouveau fichier de données ni dans les routes de visuels (cohérent avec la règle déjà établie sur ce projet).
- `node --check backend/routes/facebook-posts.js` propre.
- `GET /api/facebook-posts/generer/abonnement` testé en local (avec un secret admin valide) plusieurs fois de suite — confirme la variation du palier tiré, un prix réel (pas codé en dur), une `image_url` qui charge (route `/assets/palier/{palier}/carre`).
- `GET /api/facebook-posts/generer/conseil` appelé plusieurs fois — confirme au moins 3-4 textes distincts observés sur 10 tirages (signal suffisant que le tableau élargi est bien utilisé, pas de preuve exhaustive nécessaire).
- `GET /api/facebook-posts/generer/{bon-plan,comparatif,immo}` appelés plusieurs fois chacun — confirme que le gabarit de texte varie indépendamment du produit/annonce tiré (deux appels différents peuvent remonter le même produit avec un texte différent, ou l'inverse).
