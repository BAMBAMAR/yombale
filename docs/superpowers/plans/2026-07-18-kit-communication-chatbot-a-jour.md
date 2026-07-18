# Kit communication — mise à jour du volet assistant WhatsApp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre à jour le kit de communication (admin + page publique + visuel réseaux sociaux) pour refléter fidèlement toutes les capacités actuelles du chatbot WhatsApp, avec le volet boutiques/achat/panier mis en avant comme argument de vente principal.

**Architecture:** Contenu et présentation uniquement, 3 fichiers Next.js indépendants (aucune dépendance entre eux, aucun changement backend). Chaque fichier passe d'une liste plate de 6 items à une structure en 4 groupes thématiques : Recherche & comparaison, Boutiques & achat, Alertes & suivi, FAQ & support.

**Tech Stack:** Next.js 14 (App Router, Server Components), TypeScript, `next/og` `ImageResponse` (edge runtime) pour le visuel.

## Global Constraints

- Aucune modification de `backend/services/whatsapp-chatbot.js` ou de toute autre logique backend — contenu/présentation seulement.
- `runtime = 'edge'` doit être conservé dans `frontend-next/src/app/assets/chatbot-whatsapp/route.tsx` (obligatoire pour `next/og` sur ce projet).
- Le visuel garde ses dimensions 1080×1080.
- Structure de contenu à respecter partout : 4 groupes dans cet ordre — 🔍 Recherche & comparaison, 🛍️ Boutiques & achat, 🔔 Alertes & suivi, ❓ FAQ & support.
- Le groupe « Boutiques & achat » décrit la commande/panier en vue d'ensemble orientée bénéfice — ne pas énumérer les champs du formulaire (nom/téléphone/adresse/zone/paiement) comme une liste technique.
- Vérification finale : `npx tsc --noEmit` propre dans `frontend-next/`.
- Pas de nouvelle route, pas de nouveau fichier hors ceux listés dans ce plan.

---

### Task 1: Kit admin — restructurer `CHATBOT_FONCTIONS` et `CHATBOT_TEXTE`

**Files:**
- Modify: `frontend-next/src/app/admin/(protected)/communication/page.tsx:293-313` (constantes `CHATBOT_FONCTIONS`, `CHATBOT_TEXTE`)
- Modify: `frontend-next/src/app/admin/(protected)/communication/page.tsx:612-634` (JSX de rendu de la section "⚙️ Ce que le chatbot sait faire")

**Interfaces:**
- Produces: nouveau type de données pour `CHATBOT_FONCTIONS` — un tableau de groupes `{ groupe: string; items: { titre: string; detail: string }[] }[]`. Aucun autre fichier de ce plan ne consomme cette constante (chaque fichier a sa propre liste), donc le type est local à ce fichier.

**Contexte actuel (avant modification) :**

```tsx
const CHATBOT_FONCTIONS = [
  { titre: 'Recherche produit/annonce', detail: 'Texte libre (ex: "iPhone 14") → renvoie prix comparés, annonces classifiées ou biens immo correspondants, avec lien direct.' },
  { titre: 'Annonces immo', detail: 'Dernières annonces immobilières actives, envoyées en carrousel avec photo, prix et lien.' },
  { titre: 'Offres télécom', detail: 'Derniers forfaits Orange, Free, Expresso, Wave.' },
  { titre: 'Alerte de prix', detail: 'L\'utilisateur indique un produit et un prix cible — notifié par WhatsApp dès que le seuil est atteint, sans compte requis.' },
  { titre: 'Suivi de commande', detail: 'Référence de commande (ex: PAY-12345) → statut et montant.' },
  { titre: 'Support', detail: 'Coordonnées de l\'équipe Nopalou en un message.' },
]

const CHATBOT_TEXTE = `💬 Nopalou est maintenant sur WhatsApp !

Comparez les prix, suivez les annonces immo et créez des alertes de prix sans quitter votre conversation WhatsApp — pas d'app à installer, pas d'inscription.

Comment l'utiliser :
1. Enregistrez le +221 70 871 79 42 (ou cliquez wa.me/221708717942)
2. Envoyez "menu"
3. Choisissez une option : recherche, immo, télécom, alerte prix, suivi commande, support

100% gratuit, disponible 24h/24.

📲 wa.me/221708717942`
```

- [ ] **Step 1: Remplacer `CHATBOT_FONCTIONS` par la structure en 4 groupes**

Remplacer les lignes 293-300 par :

```tsx
const CHATBOT_FONCTIONS = [
  {
    groupe: '🔍 Recherche & comparaison',
    items: [
      { titre: 'Recherche unifiée', detail: 'Texte libre (ex: "iPhone 14") → renvoie en une seule requête les prix comparés du marketplace (3000+ produits scrapés, tous marchands), les boutiques marchandes Nopalou, les annonces classifiées ou les biens immo correspondants, avec lien direct.' },
      { titre: 'Annonces immo', detail: 'Dernières annonces immobilières actives (appartements, villas, terrains), envoyées avec photo, prix et lien.' },
      { titre: 'Offres télécom', detail: 'Derniers forfaits Orange, Yas, Expresso, Promobile.' },
      { titre: 'Pagination des résultats', detail: 'Le client peut dire "plus" ou "encore" pour voir d\'autres résultats sans reformuler sa recherche.' },
    ],
  },
  {
    groupe: '🛍️ Boutiques & achat',
    items: [
      { titre: 'Parcourir une boutique', detail: 'Le client accède à une boutique précise via un lien direct partagé par le commerçant, ou parcourt par secteur/catégorie.' },
      { titre: 'Commander dans le chat', detail: 'Le client choisit ses produits, indique ses coordonnées et son mode de livraison/paiement, sans quitter WhatsApp — la commande arrive directement chez le commerçant.' },
      { titre: 'Panier multi-produits (Meta Commerce)', detail: 'Depuis le catalogue WhatsApp d\'une boutique, le client compose un panier avec plusieurs articles et l\'envoie en une seule fois — pas besoin de chercher chaque produit un par un.' },
    ],
  },
  {
    groupe: '🔔 Alertes & suivi',
    items: [
      { titre: 'Alerte de prix', detail: 'L\'utilisateur indique un produit et un prix cible — notifié par WhatsApp dès que le seuil est atteint, sans compte requis.' },
      { titre: 'Suivi de commande', detail: 'Référence de commande (ex: PAY-12345) → statut et montant.' },
    ],
  },
  {
    groupe: '❓ FAQ & support',
    items: [
      { titre: 'Questions fréquentes automatiques', detail: 'Le bot répond seul aux questions courantes : gratuit/payant, publier une annonce/un bien immo, créer une boutique, comparer les prix, favoris, programme apporteur, forfaits télécom, guide général.' },
      { titre: 'Support', detail: 'Coordonnées de l\'équipe Nopalou en un message si aucune réponse automatique ne correspond.' },
    ],
  },
]
```

- [ ] **Step 2: Remplacer `CHATBOT_TEXTE`**

Remplacer les lignes 302-313 par :

```tsx
const CHATBOT_TEXTE = `💬 Nopalou est maintenant sur WhatsApp !

Comparez les prix (produits, boutiques, immo, télécom), commandez directement dans une boutique — même avec plusieurs produits en un seul panier — créez des alertes de prix et posez vos questions, sans quitter votre conversation WhatsApp. Pas d'app à installer, pas d'inscription.

Comment l'utiliser :
1. Enregistrez le +221 70 871 79 42 (ou cliquez wa.me/221708717942)
2. Envoyez "menu"
3. Choisissez une option : recherche, boutiques, immo, télécom, alerte prix, suivi commande, ou posez directement votre question

100% gratuit, disponible 24h/24.

📲 wa.me/221708717942`
```

- [ ] **Step 3: Adapter le JSX de rendu pour la structure en groupes**

Remplacer le bloc JSX aux lignes 612-634 (section complète `<section>` "⚙️ Ce que le chatbot sait faire") par :

```tsx
<section style={{ marginBottom: 48 }}>
  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C2B4A', marginBottom: 20 }}>
    ⚙️ Ce que le chatbot sait faire
  </h2>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
    {CHATBOT_FONCTIONS.map(groupe => (
      <div key={groupe.groupe}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#25D366', margin: '0 0 12px' }}>
          {groupe.groupe}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupe.items.map((f, i) => (
            <div key={f.titre} style={{
              border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
              background: '#fff', display: 'flex', gap: 14,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 800, color: '#25D366', background: '#f0fdf4',
                borderRadius: '50%', width: 26, height: 26, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{i + 1}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1C2B4A', margin: '0 0 4px' }}>{f.titre}</p>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur (0 output, exit code 0).

- [ ] **Step 5: Vérification visuelle locale**

Run: `cd frontend-next && npm run dev` (si le serveur ne tourne pas déjà sur le port 3001), puis ouvrir `http://localhost:3001/admin/communication` dans un navigateur (nécessite le cookie admin — se connecter via `/admin/login` si besoin) et vérifier que les 4 groupes s'affichent correctement avec leurs items numérotés par groupe.

- [ ] **Step 6: Commit**

```bash
git add "frontend-next/src/app/admin/(protected)/communication/page.tsx"
git commit -m "feat(admin): kit communication - chatbot WhatsApp a jour (boutiques, panier, FAQ)"
```

---

### Task 2: Page publique `/assistant-whatsapp` — restructurer `FONCTIONS`

**Files:**
- Modify: `frontend-next/src/app/assistant-whatsapp/page.tsx:14-45` (constante `FONCTIONS`)
- Modify: `frontend-next/src/app/assistant-whatsapp/page.tsx:90-102` (JSX de rendu de la liste)

**Interfaces:**
- Consumes: rien de Task 1 (fichier indépendant, structure de données propre à ce fichier).
- Produces: nouveau type `{ groupe: string; items: { icon: string; couleur: string; titre: string; texte: string }[] }[]` pour `FONCTIONS`, local à ce fichier.

**Contexte actuel (avant modification) :**

```tsx
const FONCTIONS = [
  {
    icon: '🔍', couleur: '#1d4ed8',
    titre: 'Rechercher un produit ou une annonce',
    texte: "Tapez le nom d'un produit (ex : \"iPhone 14\", \"climatiseur Haier\") et l'assistant vous répond avec les prix trouvés chez les marchands partenaires, une annonce classifiée ou un bien immo correspondant — avec le lien direct vers la fiche.",
  },
  {
    icon: '🏠', couleur: '#059669',
    titre: 'Parcourir les annonces immo',
    texte: "Recevez directement dans la conversation les dernières annonces immobilières (appartements, villas, terrains) avec photo, prix et lien vers l'annonce complète.",
  },
  {
    icon: '📱', couleur: '#7c3aed',
    titre: 'Comparer les offres télécom',
    texte: "Consultez les derniers forfaits mobiles Orange, Free, Expresso et Wave sans quitter WhatsApp.",
  },
  {
    icon: '🔔', couleur: '#f59e0b',
    titre: 'Créer une alerte de prix',
    texte: "Dites à l'assistant quel produit vous intéresse et à quel prix vous voulez être alerté — vous serez notifié par WhatsApp dès que le prix cible est atteint, sans avoir de compte.",
  },
  {
    icon: '📦', couleur: '#0891b2',
    titre: 'Suivre une commande',
    texte: "Entrez votre référence de commande (ex : PAY-12345) pour connaître son statut et son montant, à tout moment.",
  },
  {
    icon: '💬', couleur: '#C75B00',
    titre: 'Contacter le support',
    texte: "Besoin d'aide ? L'assistant vous donne les coordonnées de l'équipe Nopalou en un message.",
  },
]
```

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
  {FONCTIONS.map((f) => (
    <div key={f.titre} className="guide-emploi-step">
      <div className="guide-emploi-icon" style={{ background: f.couleur + '18' }}>
        {f.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="guide-emploi-titre">{f.titre}</div>
        <div className="guide-emploi-texte">{f.texte}</div>
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 1: Remplacer `FONCTIONS` par la structure en 4 groupes**

Remplacer les lignes 14-45 par :

```tsx
const FONCTIONS = [
  {
    groupe: '🔍 Recherche & comparaison',
    items: [
      {
        icon: '🔍', couleur: '#1d4ed8',
        titre: 'Rechercher un produit, une boutique ou une annonce',
        texte: "Tapez le nom d'un produit (ex : \"iPhone 14\", \"climatiseur Haier\") et l'assistant vous répond avec les prix trouvés chez les marchands partenaires, dans les boutiques Nopalou, une annonce classifiée ou un bien immo correspondant — avec le lien direct vers la fiche.",
      },
      {
        icon: '🏠', couleur: '#059669',
        titre: 'Parcourir les annonces immo',
        texte: "Recevez directement dans la conversation les dernières annonces immobilières (appartements, villas, terrains) avec photo, prix et lien vers l'annonce complète.",
      },
      {
        icon: '📱', couleur: '#7c3aed',
        titre: 'Comparer les offres télécom',
        texte: "Consultez les derniers forfaits mobiles Orange, Yas, Expresso et Promobile sans quitter WhatsApp.",
      },
      {
        icon: '➡️', couleur: '#64748b',
        titre: 'Voir plus de résultats',
        texte: "Dites \"plus\" ou \"encore\" pour continuer une recherche sans avoir à la retaper.",
      },
    ],
  },
  {
    groupe: '🛍️ Boutiques & achat',
    items: [
      {
        icon: '🏪', couleur: '#25D366',
        titre: 'Commander directement sur WhatsApp',
        texte: "Parcourez une boutique via son lien ou par catégorie, choisissez vos produits — même plusieurs à la fois grâce au panier WhatsApp — et passez commande sans quitter la conversation. Le vendeur reçoit tout instantanément.",
      },
    ],
  },
  {
    groupe: '🔔 Alertes & suivi',
    items: [
      {
        icon: '🔔', couleur: '#f59e0b',
        titre: 'Créer une alerte de prix',
        texte: "Dites à l'assistant quel produit vous intéresse et à quel prix vous voulez être alerté — vous serez notifié par WhatsApp dès que le prix cible est atteint, sans avoir de compte.",
      },
      {
        icon: '📦', couleur: '#0891b2',
        titre: 'Suivre une commande',
        texte: "Entrez votre référence de commande (ex : PAY-12345) pour connaître son statut et son montant, à tout moment.",
      },
    ],
  },
  {
    groupe: '❓ FAQ & support',
    items: [
      {
        icon: '💬', couleur: '#C75B00',
        titre: 'Poser une question sur le site',
        texte: "Gratuit ou payant, comment publier une annonce, créer une boutique, comparer les prix... L'assistant répond directement aux questions les plus courantes, et vous donne les coordonnées de l'équipe Nopalou si besoin.",
      },
    ],
  },
]
```

- [ ] **Step 2: Adapter le JSX pour la structure en groupes**

Remplacer les lignes 90-102 par :

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 24 }}>
  {FONCTIONS.map(groupe => (
    <div key={groupe.groupe}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>
        {groupe.groupe}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groupe.items.map((f) => (
          <div key={f.titre} className="guide-emploi-step">
            <div className="guide-emploi-icon" style={{ background: f.couleur + '18' }}>
              {f.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="guide-emploi-titre">{f.titre}</div>
              <div className="guide-emploi-texte">{f.texte}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Vérification visuelle locale**

Ouvrir `http://localhost:3001/assistant-whatsapp` et vérifier que les 4 groupes s'affichent avec un sous-titre visible entre chaque groupe, et que la section "Boutiques & achat" reste lisible même avec un seul item (pas de bloc vide ou mal aligné).

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/assistant-whatsapp/page.tsx
git commit -m "feat(assistant-whatsapp): page publique a jour (boutiques, panier, FAQ)"
```

---

### Task 3: Refonte visuelle du visuel `/assets/chatbot-whatsapp`

**Files:**
- Modify: `frontend-next/src/app/assets/chatbot-whatsapp/route.tsx` (fichier entier, 109 lignes)

**Interfaces:**
- Consumes: rien des tasks précédentes (fichier isolé, `ImageResponse` autonome).
- Produces: rien consommé ailleurs — route HTTP `/assets/chatbot-whatsapp` servant une image PNG 1080×1080, référencée en dur par son URL dans `frontend-next/src/app/admin/(protected)/communication/page.tsx` (`VISUELS` array, déjà présent, ne pas modifier) et dans `frontend-next/src/app/(account)/compte/apporteur/ApporteurClient.tsx` — aucun de ces deux fichiers ne change, ils référencent l'URL, pas le contenu.

**Contexte actuel (avant modification) :** voir le fichier tel que lu ci-dessus — dégradé bleu marine avec 2 cercles décoratifs, header logo, badge "NOUVEAU", titre 2 lignes, liste de bullet-points centrée sur 3 lignes de texte (6 anciennes fonctions), CTA numéro, footer.

- [ ] **Step 1: Invoquer le skill frontend-design pour calibrer la direction visuelle**

Avant d'écrire le JSX, invoquer le skill `frontend-design` pour obtenir une direction artistique cohérente avec l'identité "ticket"/marque Nopalou déjà en place sur le site (couleurs `#1C2B4A` navy, `#C75B00` accent orange, `#25D366` vert WhatsApp — cf. palette déjà utilisée dans ce fichier et documentée dans CLAUDE.md pour le design "ticket" homepage). Objectif : un visuel de qualité nettement supérieure à la version actuelle (liste de texte plate), qui représente les 4 groupes de fonctions de façon plus vivante — par exemple via un mockup stylisé de bulles de conversation WhatsApp plutôt qu'une simple liste centrée, tout en restant dans les contraintes techniques `ImageResponse` (flexbox uniquement, pas de CSS Grid, pas de `gap` sur certains navigateurs de rendu Satori — vérifier en testant).

- [ ] **Step 2: Réécrire le contenu et la composition du fichier**

Réécrire entièrement `frontend-next/src/app/assets/chatbot-whatsapp/route.tsx` en conservant :
- `export const runtime = 'edge'` (ligne 3 actuelle) — ne jamais retirer.
- Les dimensions `{ width: 1080, height: 1080 }` dans l'appel `ImageResponse`.
- La palette de marque : `#1C2B4A` (navy), `#C75B00` (accent), `#25D366` (vert WhatsApp officiel).

Et en mettant à jour le contenu texte pour refléter les 4 groupes de fonctions (au minimum : recherche multi-catalogue, boutiques/achat/panier, alertes, FAQ — condensés pour tenir sur un visuel carré, pas besoin de reproduire l'intégralité du détail des Tasks 1/2). Le numéro `wa.me/221708717942` et la mention "100% gratuit" doivent rester visibles, cohérents avec le reste du kit.

La composition précise (mockup de conversation vs. liste de cartes iconographiques vs. autre) est décidée à cette étape en s'appuyant sur la sortie de frontend-design du Step 1 — pas de code figé à l'avance dans ce plan, car l'objectif explicite du chantier est la qualité visuelle, pas la reproduction d'une maquette texte.

- [ ] **Step 3: Vérifier le rendu de l'image en local**

Run: `cd frontend-next && npm run dev` (si pas déjà lancé), puis ouvrir `http://localhost:3001/assets/chatbot-whatsapp` dans un navigateur et confirmer :
- L'image se charge sans erreur (pas de page d'erreur Next.js/edge runtime).
- Dimensions 1080×1080 (vérifiable via les DevTools ou en enregistrant le fichier).
- Le texte reflète les 4 groupes (boutiques/achat visible, pas seulement les 6 anciennes fonctions).
- Rendu visuellement net (pas de texte tronqué, pas de chevauchement — les contraintes Satori/`next/og` n'acceptent pas tout le CSS, tester réellement plutôt que supposer).

Si le rendu edge pose problème en local sur Windows (cf. piège documenté dans CLAUDE.md — `next/og` peut planter en runtime Node sur Windows, mais fonctionne en edge), confirmer que `runtime = 'edge'` est bien actif et que le serveur dev tourne correctement ce chemin ; sinon documenter le blocage plutôt que de retirer `edge`.

- [ ] **Step 4: Commit**

```bash
git add frontend-next/src/app/assets/chatbot-whatsapp/route.tsx
git commit -m "feat(visuel): refonte qualite du visuel assistant WhatsApp (boutiques, panier, FAQ)"
```

---

### Task 4: Vérification finale de branche

**Files:** aucun fichier modifié — vérification uniquement.

**Interfaces:** aucune (task de vérification transverse).

- [ ] **Step 1: Compilation TypeScript complète**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0, aucune erreur.

- [ ] **Step 2: Revue croisée des 3 fichiers modifiés contre la liste réelle des capacités du chatbot**

Ouvrir `backend/services/whatsapp-chatbot.js` et confirmer que chaque capacité listée dans le fichier (recherche unifiée `produits`+boutiques, immo, télécom, pagination `MOTS_PLUS`, parcours boutique `BOUTIQUE_SECTEUR`/`BOUTIQUE_MENU`, commande `COMMANDE_*`, panier Meta `traiterPanierMeta`, alertes `ALERT_*`, suivi `ORDER_REF`, FAQ `detecterFAQ`) apparaît bien dans au moins un des 3 fichiers modifiés (Tasks 1-3). Lister toute capacité manquante et l'ajouter avant de continuer.

- [ ] **Step 3: Vérification visuelle finale des 3 surfaces**

Avec `npm run dev` actif sur le port 3001 :
1. `/admin/communication` (connecté admin) — section "⚙️ Ce que le chatbot sait faire" affiche 4 groupes.
2. `/assistant-whatsapp` — 4 groupes visibles, section boutiques mise en avant.
3. `/assets/chatbot-whatsapp` — image à jour, qualité visuelle jugée satisfaisante.

- [ ] **Step 4: Commit final si des ajustements ont été faits pendant la vérification**

```bash
git add -A
git commit -m "fix: ajustements suite a la verification finale du kit communication chatbot"
```

(Ne committer que s'il y a effectivement des changements — `git status` doit montrer des fichiers modifiés avant ce commit.)
