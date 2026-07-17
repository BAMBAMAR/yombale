# Chatbot WhatsApp — navigation boutiques, catalogue et commande — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un client WhatsApp de découvrir une boutique précise (par lien direct, par secteur, ou depuis une recherche), de parcourir/chercher dans son catalogue, de voir une fiche produit complète, de contacter le vendeur, et de passer une commande complète sans quitter la conversation. Permettre au marchand de partager le lien de sa boutique depuis le site.

**Architecture:** Extension additive de la state machine existante de `backend/services/whatsapp-chatbot.js` (JSONB `whatsapp_sessions.context` reçoit `context.boutique` et `context.commande`), réutilisation du pattern de pagination `shownIds` déjà en place. La logique de création de commande de `backend/routes/comptabilite.js` est extraite en fonction pure réutilisable par la route HTTP existante et par le chatbot. Côté site, deux emplacements exposent le lien `wa.me/{numero}?text=boutique_{slug}` via le composant `BoutonPartager` déjà existant.

**Tech Stack:** Node.js/Express, PostgreSQL (`pg`), Meta WhatsApp Cloud API v18.0, Next.js 14 (App Router, composants client).

## Global Constraints

- Aucune migration de schéma DB : `boutiques.categorie/whatsapp/telephone/slug`, `boutique_produits.categorie/caracteristiques/variantes/stock_quantite`, `zones_livraison`, `commandes_boutique.source` existent déjà.
- `context` JSONB : ne jamais faire de merge partiel — `setSession(phone, state, context)` remplace `context` entièrement (comportement existant, confirmé dans `whatsapp-chatbot.js:78-85`) ; chaque écriture doit donc inclure explicitement tous les champs à conserver (`boutique`, `last`, etc.).
- Réutiliser `sendWhatsAppInteractive`, `sendWhatsAppButton`, `sendWhatsAppMenuOuFin`, `sendWhatsAppProduct`, `sendWhatsAppText`, `sendReadReceipt`, `normalisePhone` de `backend/services/whatsapp.js` — ne pas en créer de nouvelles.
- Liste interactive Meta (`sendWhatsAppInteractive`) : limite Meta de 10 rows au total toutes sections confondues — respecter ce plafond dans les nouvelles requêtes de liste (secteurs, catégories).
- `normaliserTexte(s)` (minuscule + suppression accents) déjà défini dans `whatsapp-chatbot.js:60-62` — le réutiliser pour toute comparaison de texte libre, ne pas le redéfinir.
- Le champ `variantes` de `boutique_produits` est un tableau `[{ nom: string, valeurs: string[] }]` (ex: `[{"nom":"Couleur","valeurs":["Rouge","Bleu"]}]`) — format confirmé dans `frontend-next/src/app/boutique/BoutiqueClient.tsx:51-53` et `backend/routes/boutiques.js:294-298`.
- Toute nouvelle route/fonction backend suit le style JS existant du fichier qu'elle modifie (pas de TypeScript côté backend).
- Commits fréquents, un par tâche.

---

### Task 1: Extraire `creerCommandeBoutique()` dans comptabilite.js

**Files:**
- Modify: `backend/routes/comptabilite.js:457-535` (bloc "Commandes boutique" + route `POST /:boutiqueId/commandes`)
- Modify: `backend/app.js:180` (adapter le require si l'export change de forme)

**Interfaces:**
- Produces: `creerCommandeBoutique({ boutiqueId, produitId, quantite, clientNom, clientTelephone, clientAdresse, note, source, methodePaiement, zoneLivraisonId })` → `Promise<{ commande: object }>`, exportée depuis `backend/routes/comptabilite.js`. Lève une erreur avec `.status` (404 boutique/produit introuvable, 400 stock insuffisant) et `.message` (message utilisateur).
- Consumes: rien de nouveau — réutilise `pool` (`../models/db`) et `sendWhatsAppText` (`../services/whatsapp`), déjà importés/importables dans ce fichier.

- [ ] **Step 1: Lire le bloc actuel pour confirmer les bornes exactes**

Le bloc à extraire est `backend/routes/comptabilite.js:457-535` (de `// ── Commandes boutique` jusqu'à la fermeture de la route `POST /:boutiqueId/commandes`, juste avant la ligne `router.get('/:boutiqueId/commandes'` suivante si elle existe). Confirmer avec :

```bash
grep -n "^router\." backend/routes/comptabilite.js | grep -A1 -B1 "commandes'"
```

- [ ] **Step 2: Créer la fonction `creerCommandeBoutique` au-dessus de la route**

Remplacer les lignes 457-535 de `backend/routes/comptabilite.js` par :

```js
// ── Commandes boutique ────────────────────────────────────────────────────────

const STATUTS_VALIDES = ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];

function genRefCommande() {
  return `C-${Date.now().toString(36).toUpperCase()}`;
}

// Logique de création de commande, partagée entre la route HTTP publique
// (POST /:boutiqueId/commandes, source='web') et le chatbot WhatsApp (source='whatsapp').
// Lève une erreur avec .status (404/400) et .message (message utilisateur) en cas d'échec.
async function creerCommandeBoutique({
  boutiqueId, produitId, quantite = 1, clientNom, clientTelephone, clientAdresse,
  note, source = 'web', methodePaiement = 'wave', zoneLivraisonId,
}) {
  const { rows: [boutique] } = await pool.query(
    'SELECT id, nom, telephone, whatsapp, utilisateur_id FROM boutiques WHERE id=$1 AND actif=true',
    [boutiqueId]
  );
  if (!boutique) {
    const e = new Error('Boutique introuvable');
    e.status = 404;
    throw e;
  }

  let nomProduit = 'Produit';
  let prixUnitaire = 0;
  let fraisLivraison = 0;

  if (zoneLivraisonId) {
    const { rows: [zone] } = await pool.query(
      'SELECT prix, nom FROM zones_livraison WHERE id=$1 AND boutique_id=$2',
      [zoneLivraisonId, boutiqueId]
    );
    if (zone) fraisLivraison = Number(zone.prix);
  }

  if (produitId) {
    const { rows: [p] } = await pool.query(
      'SELECT nom, prix, stock_quantite FROM boutique_produits WHERE id=$1 AND boutique_id=$2',
      [produitId, boutiqueId]
    );
    if (!p) {
      const e = new Error('Produit introuvable');
      e.status = 404;
      throw e;
    }
    nomProduit = p.nom;
    if (p.prix) prixUnitaire = Number(p.prix);
    if (p.stock_quantite !== null && p.stock_quantite < quantite) {
      const e = new Error('Stock insuffisant');
      e.status = 400;
      throw e;
    }
  }

  const montantTotal = prixUnitaire * quantite + fraisLivraison;
  const ref = genRefCommande();

  const { rows: [commande] } = await pool.query(
    `INSERT INTO commandes_boutique
       (reference, boutique_id, produit_id, nom_produit, quantite, prix_unitaire, montant_total,
        client_nom, client_telephone, client_adresse, note, source, methode_paiement, zone_livraison_id, frais_livraison)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [ref, boutiqueId, produitId || null, nomProduit, quantite, prixUnitaire, montantTotal,
     clientNom, clientTelephone, clientAdresse || null, note || null, source,
     methodePaiement, zoneLivraisonId || null, fraisLivraison]
  );

  const vendeurTel = boutique.whatsapp || boutique.telephone;
  if (vendeurTel) {
    const { sendWhatsAppText } = require('../services/whatsapp');
    const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces', virement: 'Virement' };
    const msg = `🛒 *Nouvelle commande — ${boutique.nom}*\n\nRéf : *${ref}*\nProduit : ${nomProduit} × ${quantite}${montantTotal > 0 ? `\nMontant : *${new Intl.NumberFormat('fr-FR').format(montantTotal)} FCFA*` : ''}${fraisLivraison > 0 ? `\nLivraison : ${new Intl.NumberFormat('fr-FR').format(fraisLivraison)} FCFA` : ''}\n💳 Paiement souhaité : ${methodeLabel[methodePaiement] || methodePaiement}\n\n👤 Client : ${clientNom}\n📞 ${clientTelephone}${clientAdresse ? `\n📍 ${clientAdresse}` : ''}${note ? `\n📝 ${note}` : ''}\n\n⚡ Répondez vite pour confirmer !`;
    sendWhatsAppText(vendeurTel, msg).catch(() => {});
  }

  return { commande };
}

// POST /api/comptabilite/:boutiqueId/commandes — public, client passe commande
router.post(
  '/:boutiqueId/commandes',
  param('boutiqueId').isUUID(),
  body('client_nom').trim().isLength({ min: 2, max: 150 }),
  body('client_telephone').trim().isLength({ min: 6, max: 30 }),
  body('produit_id').optional().isUUID(),
  body('nom_produit').optional().trim().isLength({ max: 300 }),
  body('quantite').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
    try {
      const { produit_id, quantite = 1, client_nom, client_telephone, client_adresse, note, source = 'web', methode_paiement = 'wave', zone_livraison_id } = req.body;

      const { commande } = await creerCommandeBoutique({
        boutiqueId: req.params.boutiqueId,
        produitId: produit_id,
        quantite,
        clientNom: client_nom,
        clientTelephone: client_telephone,
        clientAdresse: client_adresse,
        note,
        source,
        methodePaiement: methode_paiement,
        zoneLivraisonId: zone_livraison_id,
      });

      res.status(201).json({ commande, message: 'Commande envoyée avec succès' });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      console.error('[COMMANDE]', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
```

**Note importante** : le champ `nom_produit`/`prix_unitaire` fournis manuellement par le client (sans `produit_id`) existaient dans l'ancien code (`req.body.nom_produit`, `req.body.prix_unitaire`) — vérifier si ce cas (commande sans `produit_id`) est utilisé ailleurs dans le frontend avant de le supprimer. Si oui, garder ces deux paramètres optionnels dans `creerCommandeBoutique` (`nomProduitManuel`, `prixUnitaireManuel`) utilisés seulement si `produitId` n'est pas fourni :

```bash
grep -rn "nom_produit\|prix_unitaire" frontend-next/src --include=*.tsx
```

Si le grep montre des appels sans `produit_id`, réintégrer dans `creerCommandeBoutique` :
```js
let nomProduit = nomProduitManuel || 'Produit';
let prixUnitaire = Number(prixUnitaireManuel) || 0;
```
à la place de l'initialisation fixe, et passer ces deux valeurs dans les deux appelants (route HTTP passe `req.body.nom_produit`/`req.body.prix_unitaire`, chatbot ne les fournit jamais car toujours avec `produitId`).

- [ ] **Step 3: Modifier l'export du fichier**

À la fin de `backend/routes/comptabilite.js`, remplacer :
```js
module.exports = router;
```
par :
```js
module.exports = router;
module.exports.creerCommandeBoutique = creerCommandeBoutique;
```

- [ ] **Step 4: Vérifier la syntaxe**

```bash
node --check backend/routes/comptabilite.js
```
Expected: aucune sortie (succès).

- [ ] **Step 5: Vérifier que `app.js` fonctionne toujours tel quel**

`backend/app.js:180` fait `app.use('/api/comptabilite', require('./routes/comptabilite'))` — comme `module.exports` reste la fonction router (avec une propriété additionnelle dessus), aucun changement n'est nécessaire dans `app.js`. Confirmer par lecture :

```bash
grep -n "require('./routes/comptabilite')" backend/app.js
```

- [ ] **Step 6: Test manuel de non-régression de la route HTTP**

Démarrer le backend localement (`npm run dev` à la racine) et vérifier qu'une commande de test via `curl` fonctionne toujours (remplacer `BOUTIQUE_ID`/`PRODUIT_ID` par des UUID réels d'une boutique/produit de test) :

```bash
curl -X POST http://localhost:3000/api/comptabilite/BOUTIQUE_ID/commandes \
  -H "Content-Type: application/json" \
  -d '{"produit_id":"PRODUIT_ID","quantite":1,"client_nom":"Test Plan","client_telephone":"770000000"}'
```
Expected: HTTP 201, `{"commande": {...}, "message": "Commande envoyée avec succès"}`.

- [ ] **Step 7: Commit**

```bash
git add backend/routes/comptabilite.js
git commit -m "refactor(boutique): extrait creerCommandeBoutique pour réutilisation par le chatbot" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Ajouter `NEXT_PUBLIC_WHATSAPP_NUMBER` et le helper de lien boutique

**Files:**
- Modify: `frontend-next/.env.local` (ajout de la variable, valeur locale)
- Modify: `frontend-next/src/lib/format.ts` (nouvelle fonction `lienBoutiqueWhatsapp`)

**Interfaces:**
- Produces: `lienBoutiqueWhatsapp(slug: string): string` exportée depuis `frontend-next/src/lib/format.ts`, retourne `https://wa.me/{NEXT_PUBLIC_WHATSAPP_NUMBER}?text=boutique_{slug}` (slug encodé via `encodeURIComponent`).
- Consumes: `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` (chaîne de chiffres, ex: `221708717942`, sans `+` ni espace — format attendu par `wa.me`).

- [ ] **Step 1: Lire le fichier format.ts existant pour respecter son style**

```bash
grep -n "^export function\|^export const" frontend-next/src/lib/format.ts
```

- [ ] **Step 2: Ajouter la fonction dans `frontend-next/src/lib/format.ts`**

Ajouter à la fin du fichier :

```ts
export function lienBoutiqueWhatsapp(slug: string): string {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const texte = encodeURIComponent(`boutique_${slug}`)
  return `https://wa.me/${numero}?text=${texte}`
}
```

- [ ] **Step 3: Ajouter la variable d'environnement locale**

Dans `frontend-next/.env.local`, ajouter (numéro confirmé dans CLAUDE.md — vérifier avec l'utilisateur si le numéro réel diffère) :
```
NEXT_PUBLIC_WHATSAPP_NUMBER=221708717942
```

Vérifier d'abord que le fichier existe et voir son contenu actuel avant d'ajouter :
```bash
cat frontend-next/.env.local 2>/dev/null | head -5 || echo "fichier absent"
```

- [ ] **Step 4: Documenter la variable dans CLAUDE.md**

Ajouter une ligne dans le tableau "Next.js (`frontend-next/.env.local`)" de `CLAUDE.md` :
```
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp Business Nopalou (format `221XXXXXXXXX`, sans `+`) — utilisé pour générer les liens `wa.me` de partage boutique |
```

- [ ] **Step 5: Vérifier la compilation TypeScript**

```bash
cd frontend-next && npx tsc --noEmit
```
Expected: pas de nouvelle erreur liée à `format.ts`.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/lib/format.ts CLAUDE.md
git commit -m "feat(boutique): ajoute le helper de lien WhatsApp chatbot par boutique" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

**Note** : ne pas committer `.env.local` (déjà gitignoré normalement — vérifier avec `git status` que le fichier n'apparaît pas avant de committer cette tâche). Signaler à l'utilisateur que la même variable doit être ajoutée sur Render (service `nopalou-frontend`) pour la prod.

---

### Task 3: Bloc "Partager sur WhatsApp (assistant)" dans l'espace de gestion boutique

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx:735-770` (fonction `MarketingBoutique`)

**Interfaces:**
- Consumes: `lienBoutiqueWhatsapp` de `@/lib/format` (Task 2), composant `BoutonPartager` de `@/components/BoutonPartager` (déjà importé dans ce fichier — vérifier à l'étape 1).

- [ ] **Step 1: Vérifier l'import existant de BoutonPartager**

```bash
grep -n "BoutonPartager" frontend-next/src/app/boutique/BoutiqueClient.tsx | head -3
```
Confirmer la présence de `import BoutonPartager from '@/components/BoutonPartager'` en tête de fichier (déjà utilisé ligne 762-766 dans `MarketingBoutique`).

- [ ] **Step 2: Ajouter l'import du helper**

En tête de `frontend-next/src/app/boutique/BoutiqueClient.tsx`, à côté des autres imports de `@/lib/...` :

```bash
grep -n "^import.*@/lib" frontend-next/src/app/boutique/BoutiqueClient.tsx
```

Ajouter la ligne (adapter l'emplacement exact selon les imports existants trouvés à l'étape précédente) :
```ts
import { lienBoutiqueWhatsapp } from '@/lib/format'
```

- [ ] **Step 3: Ajouter le second bloc de partage dans `MarketingBoutique`**

Dans `frontend-next/src/app/boutique/BoutiqueClient.tsx`, modifier la fonction `MarketingBoutique` (actuellement lignes 737-770) :

```tsx
function MarketingBoutique({ boutique }: { boutique: Boutique }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutiques/${boutique.slug || boutique.id}`
  const messageBoutique = `Découvrez ${boutique.nom} sur Nopalou !\n\n${lienBoutique}`
  const lienAssistant = lienBoutiqueWhatsapp(boutique.slug || boutique.id)
  const messageAssistant = `Découvrez ${boutique.nom} sur Nopalou et commandez directement sur WhatsApp !\n\n${lienAssistant}`

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
        Partagez votre boutique sur WhatsApp, Instagram ou Facebook pour attirer plus de clients.
      </p>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px',
        marginBottom: 16,
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {boutique.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={boutique.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 28 }}>🏪</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{boutique.nom}</p>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{lienBoutique}</p>
        </div>
        <BoutonPartager
          lien={lienBoutique}
          message={messageBoutique}
          lienVisuel={`/assets/boutique/${boutique.id}/story`}
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px',
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28 }}>🤖</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Assistant WhatsApp de la boutique</p>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Ce lien ouvre directement votre catalogue dans l&apos;assistant Nopalou — vos clients peuvent chercher, voir vos produits et commander sans quitter WhatsApp.
          </p>
        </div>
        <BoutonPartager
          lien={lienAssistant}
          message={messageAssistant}
          lienVisuel={`/assets/boutique/${boutique.id}/story`}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Vérifier que `Boutique` (interface locale du fichier) a bien `slug`**

```bash
grep -n "^interface Boutique" -A 20 frontend-next/src/app/boutique/BoutiqueClient.tsx | grep slug
```
Si `slug` est absent de l'interface, l'ajouter (`slug: string | null`) dans la définition `interface Boutique { ... }` du même fichier.

- [ ] **Step 5: Vérifier la compilation**

```bash
cd frontend-next && npx tsc --noEmit
```
Expected: 0 erreur.

- [ ] **Step 6: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): ajoute le partage du lien assistant WhatsApp dans l'espace gestion" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Bouton "Discuter avec l'assistant" sur la page publique boutique

**Files:**
- Modify: `frontend-next/src/app/boutiques/[id]/page.tsx` (ajouter `slug` à l'interface `Boutique`, la passer en prop)
- Modify: `frontend-next/src/app/boutiques/[id]/BoutiqueDetailClient.tsx` (ajouter `slug` au type de prop `boutique`, nouveau bouton)

**Interfaces:**
- Consumes: `lienBoutiqueWhatsapp` de `@/lib/format` (Task 2).

- [ ] **Step 1: Ajouter `slug` à l'interface Boutique de page.tsx**

Dans `frontend-next/src/app/boutiques/[id]/page.tsx`, modifier l'interface (actuellement lignes 8-26) en ajoutant `slug` :

```ts
interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp: string | null
  slug: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  site_web: string | null
  facebook: string | null
  instagram: string | null
  horaires: Record<string, string> | null
  utilisateur_id: string
  plan_actif: 'pro' | 'business' | null
  created_at: string
}
```

- [ ] **Step 2: Vérifier comment `boutique` est passé à `BoutiqueDetailClient` et ajouter `slug`**

```bash
grep -n "<BoutiqueDetailClient" -A 15 "frontend-next/src/app/boutiques/[id]/page.tsx"
```

Repérer le bloc `boutique={{ ... }}` (ou équivalent `boutique={b}`) passé en prop, et s'assurer que `slug: b.slug` y figure. Si le composant reçoit `boutique={{ id: b.id, nom: b.nom, ... }}` explicitement listé champ par champ, ajouter `slug: b.slug,` dans cet objet littéral.

- [ ] **Step 3: Ajouter `slug` au type de prop dans BoutiqueDetailClient.tsx**

Dans `frontend-next/src/app/boutiques/[id]/BoutiqueDetailClient.tsx`, modifier la signature du composant (actuellement lignes 112-134) :

```tsx
export default function BoutiqueDetailClient({
  boutique,
  produits,
  annonces,
}: {
  boutique: {
    id: string
    nom: string
    telephone: string | null
    whatsapp: string | null
    slug: string | null
    facebook: string | null
    instagram: string | null
    site_web: string | null
    horaires: Record<string, string> | null
    adresse: string | null
    ville: string
    categorie: string | null
    description: string | null
    plan_actif: 'pro' | 'business' | null
  }
  produits: Produit[]
  annonces: Annonce[]
}) {
```

- [ ] **Step 4: Ajouter l'import du helper**

En tête de `frontend-next/src/app/boutiques/[id]/BoutiqueDetailClient.tsx`, à côté des imports existants (`cloudinaryHQ`, `fcfa`) :

```ts
import { lienBoutiqueWhatsapp } from '@/lib/format'
```

- [ ] **Step 5: Ajouter le bouton dans le bloc "Boutons d'action principaux"**

Dans `frontend-next/src/app/boutiques/[id]/BoutiqueDetailClient.tsx`, juste après le bloc existant "Boutons d'action principaux" (actuellement lignes 371-399, qui se termine par la fermeture du `</div>` du grid whatsapp/téléphone), ajouter un nouveau bloc séparé, visuellement distinct du bouton "💬 Écrire sur WhatsApp" existant (qui contacte directement le marchand) :

```tsx
          {boutique.slug && (
            <a
              href={lienBoutiqueWhatsapp(boutique.slug)}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#fff', color: '#16a34a', border: '2px solid #bbf7d0',
                padding: '14px 20px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15,
              }}
            >
              🤖 Voir le catalogue sur l&apos;assistant Nopalou
            </a>
          )}
```

Ce bloc doit être inséré immédiatement après la fermeture du `<div>` contenant "💬 Écrire sur WhatsApp"/"📞 Appeler" (repérer la ligne exacte via l'étape suivante).

- [ ] **Step 6: Repérer précisément où insérer le nouveau bloc**

```bash
grep -n "Écrire sur WhatsApp" -A 5 "frontend-next/src/app/boutiques/[id]/BoutiqueDetailClient.tsx"
```
Insérer le nouveau bloc de l'étape 5 juste après la fermeture du `</div>` qui contient ces deux boutons (whatsapp direct + téléphone), avant la fermeture de leur conteneur parent le cas échéant — vérifier l'indentation JSX en lisant les ~15 lignes suivantes avant de modifier.

- [ ] **Step 7: Vérifier la compilation**

```bash
cd frontend-next && npx tsc --noEmit
```
Expected: 0 erreur.

- [ ] **Step 8: Commit**

```bash
git add "frontend-next/src/app/boutiques/[id]/page.tsx" "frontend-next/src/app/boutiques/[id]/BoutiqueDetailClient.tsx"
git commit -m "feat(boutique): ajoute le bouton catalogue assistant WhatsApp sur la page publique" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Détection du lien direct `boutique_{slug}` et menu boutique (état `BOUTIQUE_MENU`)

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js`

**Interfaces:**
- Produces: `async function envoyerMenuBoutique(phone, boutique)` — envoie l'en-tête + menu interactif boutique, appelle `setSession(phone, 'BOUTIQUE_MENU', { boutique })`. Exportée en interne (pas dans `module.exports`, utilisée seulement dans ce fichier).
- Consumes: `sendWhatsAppText`, `sendWhatsAppInteractive`, `getSession`, `setSession`, `normaliserTexte` (tous déjà définis dans ce fichier).

- [ ] **Step 1: Ajouter la fonction `envoyerMenuBoutique` après `sendMenu`**

Dans `backend/services/whatsapp-chatbot.js`, juste après la fonction `sendMenu` (actuellement lignes 112-137), ajouter :

```js
// ── Menu d'une boutique précise (état BOUTIQUE_MENU) ───────────────────────────
async function envoyerMenuBoutique(phone, boutique) {
  const infos = [boutique.categorie, boutique.ville].filter(Boolean).join(' — ');
  let entete = `🏪 *${boutique.nom}*`;
  if (infos) entete += `\n${infos}`;
  if (boutique.description) entete += `\n${boutique.description}`;
  await sendWhatsAppText(phone, entete);

  await sendWhatsAppInteractive(
    phone,
    boutique.nom,
    'Que voulez-vous faire ?',
    [
      {
        title: 'Catalogue',
        rows: [
          { id: 'boutique_recherche', title: '🔍 Rechercher', description: 'Chercher un produit dans cette boutique' },
          { id: 'boutique_categorie', title: '📂 Par catégorie', description: 'Parcourir les catégories de produits' },
        ],
      },
      {
        title: 'Autre',
        rows: [
          { id: 'boutique_contact', title: '📞 Contacter le vendeur', description: 'Ouvrir une conversation directe' },
          { id: 'boutique_quitter', title: '⬅️ Changer de boutique', description: 'Retour au menu principal' },
        ],
      },
    ]
  );

  await setSession(phone, 'BOUTIQUE_MENU', { boutique });
}
```

- [ ] **Step 2: Ajouter la détection du lien direct dans `handleIncoming`**

Dans `backend/services/whatsapp-chatbot.js`, dans `handleIncoming`, juste après la ligne `const interactiveId = ...` (actuellement ligne 263) et avant le bloc `// ── IDLE →` (actuellement ligne 271-280), insérer :

```js
  // ── Lien direct partagé par un marchand : "boutique_{slug}" ────────────────
  const matchBoutique = text.match(/^boutique_(.+)$/i);
  if (matchBoutique) {
    const slug = matchBoutique[1].trim();
    const r = await pool.query(
      'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE slug=$1 AND actif=true',
      [slug]
    );
    if (!r.rows[0]) {
      await sendWhatsAppText(phone, '😕 Cette boutique est introuvable ou n\'est plus active.');
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    await envoyerMenuBoutique(phone, r.rows[0]);
    return;
  }
```

- [ ] **Step 3: Vérifier l'ordre d'insertion (avant IDLE, après la déduplication/read receipt)**

```bash
grep -n "const interactiveId\|state === 'IDLE'" backend/services/whatsapp-chatbot.js
```
Confirmer que le bloc de l'étape 2 est bien positionné entre ces deux lignes.

- [ ] **Step 4: Vérifier la syntaxe**

```bash
node --check backend/services/whatsapp-chatbot.js
```
Expected: aucune sortie.

- [ ] **Step 5: Test manuel isolé (sans WhatsApp réel) via un script Node**

Créer un script temporaire pour valider la requête SQL et la fonction sans dépendre de l'API Meta (le `guard()` de `whatsapp.js` bloque silencieusement l'envoi si les credentials sont absents, donc ce test vérifie surtout l'absence de crash) :

```bash
node -e "
const { handleIncoming } = require('./backend/services/whatsapp-chatbot');
handleIncoming({ id: 'test-msg-1', from: '221770000000', text: { body: 'boutique_slug-inexistant' } })
  .then(() => console.log('OK: pas de crash'))
  .catch(e => { console.error('FAIL:', e); process.exit(1); });
"
```
Expected: `OK: pas de crash` (nécessite que `DATABASE_URL` soit configuré dans l'environnement local — utiliser le `.env` racine existant).

- [ ] **Step 6: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): lien direct boutique_{slug} ouvre le menu de la boutique" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Entrée en mode boutique depuis le menu principal (secteur → liste)

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js`

**Interfaces:**
- Consumes: `envoyerMenuBoutique` (Task 5).
- Produces: états `BOUTIQUE_SECTEUR`, `BOUTIQUE_LISTE` gérés dans `handleIncoming` ; fonction `envoyerListeBoutiques(phone, secteur, excludeIds = [])`.

- [ ] **Step 1: Ajouter l'option "🏪 Boutiques" au menu principal**

Dans `backend/services/whatsapp-chatbot.js`, dans `sendMenu` (actuellement lignes 112-137), ajouter une row dans la section "Découvrir" :

```js
async function sendMenu(phone) {
  await sendWhatsAppInteractive(
    phone,
    '🛍️ Nopalou',
    'Comment puis-je vous aider ?',
    [
      {
        title: 'Découvrir',
        rows: [
          { id: 'search',    title: '🔍 Rechercher',      description: 'Trouver un produit ou annonce' },
          { id: 'boutiques', title: '🏪 Boutiques',        description: 'Découvrir les boutiques Nopalou' },
          { id: 'immo',      title: '🏠 Annonces immo',   description: 'Maisons, appartements, terrains' },
          { id: 'telecom',   title: '📱 Offres télécom',  description: 'Mobile, internet, forfaits' },
        ],
      },
      {
        title: 'Mon compte',
        rows: [
          { id: 'alert',   title: '🔔 Alerte prix',     description: 'Être notifié d\'une baisse' },
          { id: 'order',   title: '📦 Suivre commande', description: 'Statut de votre paiement' },
          { id: 'support', title: '💬 Support',         description: 'Contacter l\'équipe Nopalou' },
          { id: 'guide',   title: 'ℹ️ Comment ça marche', description: 'Utiliser le site Nopalou' },
        ],
      },
    ]
  );
}
```

**Attention à la limite Meta de 10 rows totales** : cette liste passe de 7 à 8 rows (4 + 4) — toujours sous la limite de 10, aucun ajustement nécessaire.

- [ ] **Step 2: Ajouter `envoyerListeBoutiques` après `envoyerListeTelecom`**

Dans `backend/services/whatsapp-chatbot.js`, juste après la fonction `envoyerListeTelecom` (actuellement lignes 225-249), ajouter :

```js
async function envoyerListeBoutiques(phone, secteur, excludeIds = []) {
  const r = await pool.query(
    `SELECT id, nom, slug, ville FROM boutiques
     WHERE actif=true AND categorie=$1 AND id::text <> ALL($2::text[])
     ORDER BY created_at DESC LIMIT 3`,
    [secteur, excludeIds]
  );
  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? '✅ Vous avez vu toutes les boutiques de ce secteur. Tapez *menu* pour revenir.'
        : 'Aucune boutique disponible dans ce secteur pour le moment.'
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'MENU', {});
    return;
  }

  const rows = r.rows.map(b => ({
    id: `boutique_choisie_${b.id}`,
    title: b.nom.slice(0, 24),
    description: b.ville || undefined,
  }));
  await sendWhatsAppInteractive(phone, 'Boutiques', `Boutiques du secteur *${secteur}* :`, [
    { title: secteur, rows },
  ]);

  await attendre(400);
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres boutiques, ou choisissez-en une ci-dessus :').catch(() => {});
  await setSession(phone, 'BOUTIQUE_LISTE', {
    secteur,
    last: { type: 'boutique_liste', shownIds: excludeIds.concat(r.rows.map(b => String(b.id))) },
  });
}
```

**Note** : les `id` de rows Meta doivent rester ≤ 200 caractères — `boutique_choisie_{uuid}` (36 caractères d'UUID + préfixe) reste largement dans la limite. Les `title` de rows sont limités à 24 caractères par Meta — `.slice(0, 24)` gère ce cas pour `b.nom`.

- [ ] **Step 3: Ajouter la gestion de l'état `MENU` → `boutiques`**

Dans `backend/services/whatsapp-chatbot.js`, dans le bloc `if (state === 'MENU')` (actuellement lignes 304-367), ajouter avant le bloc `if (action === 'support')` :

```js
    if (action === 'boutiques') {
      const r = await pool.query(
        `SELECT DISTINCT categorie FROM boutiques WHERE actif=true AND categorie IS NOT NULL ORDER BY categorie LIMIT 10`
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Aucune boutique disponible pour le moment.');
        await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
        await setSession(phone, 'MENU', {});
        return;
      }
      const rows = r.rows.map(row => ({ id: `secteur_${row.categorie}`, title: row.categorie.slice(0, 24) }));
      await sendWhatsAppInteractive(phone, '🏪 Boutiques', 'Choisissez un secteur :', [
        { title: 'Secteurs', rows },
      ]);
      await setSession(phone, 'BOUTIQUE_SECTEUR', {});
      return;
    }
```

- [ ] **Step 4: Ajouter le nouvel état `BOUTIQUE_SECTEUR` dans `handleIncoming`**

Dans `backend/services/whatsapp-chatbot.js`, juste après le bloc `if (state === 'MENU') { ... }` (qui se termine actuellement ligne 367) et avant `// ── SEARCH_QUERY ──` (actuellement ligne 369), ajouter :

```js
  // ── BOUTIQUE_SECTEUR → choix du secteur ─────────────────────────────────────
  if (state === 'BOUTIQUE_SECTEUR') {
    const secteurMatch = interactiveId.match(/^secteur_(.+)$/);
    if (!secteurMatch) {
      await sendWhatsAppText(phone, 'Choisissez un secteur dans la liste ci-dessus, ou tapez *menu*.');
      return;
    }
    await envoyerListeBoutiques(phone, secteurMatch[1]);
    return;
  }

  // ── BOUTIQUE_LISTE → choix d'une boutique ou pagination ─────────────────────
  if (state === 'BOUTIQUE_LISTE') {
    if (MOTS_PLUS.includes(normaliserTexte(text))) {
      const shownIds = Array.isArray(context?.last?.shownIds) ? context.last.shownIds : [];
      await envoyerListeBoutiques(phone, context.secteur, shownIds);
      return;
    }
    const choixMatch = interactiveId.match(/^boutique_choisie_(.+)$/);
    if (!choixMatch) {
      await sendWhatsAppText(phone, 'Choisissez une boutique dans la liste ci-dessus, ou tapez *menu*.');
      return;
    }
    const r = await pool.query(
      'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE id=$1 AND actif=true',
      [choixMatch[1]]
    );
    if (!r.rows[0]) {
      await sendWhatsAppText(phone, '😕 Cette boutique n\'est plus disponible.');
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    await envoyerMenuBoutique(phone, r.rows[0]);
    return;
  }
```

**Attention** : `MOTS_PLUS` est défini localement dans `handleIncoming` (actuellement ligne 269) — vérifier qu'il est bien accessible à cet endroit du fichier (il l'est, tout ce bloc reste à l'intérieur de la même fonction `handleIncoming`).

- [ ] **Step 5: Vérifier la syntaxe**

```bash
node --check backend/services/whatsapp-chatbot.js
```
Expected: aucune sortie.

- [ ] **Step 6: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): liste des boutiques par secteur accessible depuis le menu principal" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Menu boutique — recherche, navigation par catégorie, contact, sortie

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js`

**Interfaces:**
- Produces: `async function envoyerFicheProduitBoutique(phone, produit, boutique)` (fiche complète + bouton Commander) et `async function envoyerProduitsBoutique(phone, boutique, { query, categorie, excludeIds })` (requête + envoi paginé des produits d'une boutique, recherche ou catégorie selon les paramètres fournis, appelle `envoyerFicheProduitBoutique` pour chaque résultat). Les deux sont définies dans cette même tâche (Step 1), pas de dépendance externe.
- Consumes: `envoyerMenuBoutique` (Task 5), `MOTS_PLUS`, `normaliserTexte`, `sendWhatsAppProduct`, `sendWhatsAppButton` (existants dans `whatsapp.js`).

- [ ] **Step 1: Ajouter `envoyerFicheProduitBoutique` (fiche complète + bouton commander)**

Dans `backend/services/whatsapp-chatbot.js`, après `envoyerListeBoutiques` (Task 6, Step 2), ajouter :

```js
// ── Fiche produit complète (boutique) ───────────────────────────────────────
// Product Message Meta native + message texte détaillé + bouton "Commander".
async function envoyerFicheProduitBoutique(phone, produit, boutique) {
  await sendWhatsAppProduct(
    phone,
    `nopalou-produit-${produit.id}`,
    `${produit.nom} — ${prixFmt(produit.prix)}\n📍 ${boutique.nom}`
  ).catch(async () => {
    await sendWhatsAppText(phone, `• *${produit.nom}* — ${prixFmt(produit.prix)}\n📍 *${boutique.nom}*`);
  });

  const lignes = [`🏪 *${boutique.nom}*`];
  if (produit.description) lignes.push(produit.description);

  const variantes = Array.isArray(produit.variantes) ? produit.variantes : [];
  for (const v of variantes) {
    if (v?.nom && Array.isArray(v.valeurs) && v.valeurs.length) {
      lignes.push(`*${v.nom}* : ${v.valeurs.join(', ')}`);
    }
  }

  const carac = produit.caracteristiques && typeof produit.caracteristiques === 'object' ? produit.caracteristiques : {};
  for (const [cle, val] of Object.entries(carac)) {
    if (val) lignes.push(`*${cle}* : ${val}`);
  }

  if (produit.stock_quantite !== null && produit.stock_quantite !== undefined) {
    lignes.push(produit.stock_quantite > 0 ? `✅ ${produit.stock_quantite} en stock` : '❌ Rupture de stock');
  } else {
    lignes.push(produit.en_stock === false ? '❌ Rupture de stock' : '✅ En stock');
  }

  await sendWhatsAppText(phone, lignes.join('\n'));
  await sendWhatsAppButton(phone, 'Intéressé par ce produit ?', `commander_${produit.id}`, '🛒 Commander').catch(() => {});
}

// ── Recherche / navigation par catégorie dans une boutique précise ─────────────
async function envoyerProduitsBoutique(phone, boutique, { query, categorie, excludeIds = [] }) {
  let sql, params;
  if (query) {
    sql = `SELECT id, nom, description, prix, en_stock, stock_quantite, caracteristiques, variantes
           FROM boutique_produits
           WHERE boutique_id=$1
             AND to_tsvector('french', nom || ' ' || COALESCE(description,'')) @@ plainto_tsquery('french', $2)
             AND id::text <> ALL($3::text[])
           LIMIT 3`;
    params = [boutique.id, query, excludeIds];
  } else {
    sql = `SELECT id, nom, description, prix, en_stock, stock_quantite, caracteristiques, variantes
           FROM boutique_produits
           WHERE boutique_id=$1 AND categorie=$2
             AND id::text <> ALL($3::text[])
           LIMIT 3`;
    params = [boutique.id, categorie, excludeIds];
  }

  const r = await pool.query(sql, params);

  if (!r.rows.length) {
    await sendWhatsAppText(
      phone,
      excludeIds.length
        ? `✅ Vous avez vu tous les produits ${query ? `pour *"${query}"*` : `de la catégorie *${categorie}*`} dans cette boutique.`
        : `😕 Aucun produit trouvé ${query ? `pour *"${query}"*` : `dans cette catégorie`}.`
    );
    await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
    await setSession(phone, 'BOUTIQUE_MENU', { boutique });
    return;
  }

  for (const p of r.rows) {
    await envoyerFicheProduitBoutique(phone, p, boutique);
  }

  await attendre(1200);
  await sendWhatsAppMenuOuFin(phone, 'Tapez *plus* pour d\'autres produits, ou :').catch(() => {});
  await setSession(phone, 'BOUTIQUE_MENU', {
    boutique,
    last: {
      type: query ? 'boutique_search' : 'boutique_categorie',
      query, categorie,
      shownIds: excludeIds.concat(r.rows.map(p => String(p.id))),
    },
  });
}
```

- [ ] **Step 2: Ajouter la gestion de l'état `BOUTIQUE_MENU` dans `handleIncoming`**

Dans `backend/services/whatsapp-chatbot.js`, juste après le bloc `BOUTIQUE_LISTE` ajouté en Task 6 Step 4, ajouter :

```js
  // ── BOUTIQUE_MENU → actions du menu boutique ────────────────────────────────
  if (state === 'BOUTIQUE_MENU') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }

    if (interactiveId === 'boutique_recherche') {
      await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
      await sendWhatsAppText(phone, `🔍 Que recherchez-vous chez *${boutique.nom}* ?`);
      return;
    }
    if (interactiveId === 'boutique_categorie') {
      const r = await pool.query(
        `SELECT DISTINCT categorie FROM boutique_produits WHERE boutique_id=$1 AND categorie IS NOT NULL ORDER BY categorie LIMIT 10`,
        [boutique.id]
      );
      if (!r.rows.length) {
        await sendWhatsAppText(phone, 'Cette boutique n\'a pas encore de catégories définies.');
        await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
        await setSession(phone, 'BOUTIQUE_MENU', { boutique });
        return;
      }
      const rows = r.rows.map(row => ({ id: `bcat_${row.categorie}`, title: row.categorie.slice(0, 24) }));
      await sendWhatsAppInteractive(phone, boutique.nom, 'Choisissez une catégorie :', [{ title: 'Catégories', rows }]);
      await setSession(phone, 'BOUTIQUE_CATEGORIE', { boutique });
      return;
    }
    if (interactiveId === 'boutique_contact') {
      const contact = boutique.whatsapp || boutique.telephone;
      if (!contact) {
        await sendWhatsAppText(phone, 'Cette boutique n\'a pas encore renseigné de contact direct.');
      } else {
        await sendWhatsAppText(phone, `📞 Contactez directement *${boutique.nom}* :\nhttps://wa.me/${normalisePhone(contact)}`);
      }
      await sendWhatsAppMenuOuFin(phone, 'Envie de continuer ?').catch(() => {});
      await setSession(phone, 'BOUTIQUE_MENU', { boutique });
      return;
    }
    if (interactiveId === 'boutique_quitter' || interactiveId === 'menu') {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    const commanderMatch = interactiveId.match(/^commander_(.+)$/);
    if (commanderMatch) {
      await demarrerCommande(phone, boutique, commanderMatch[1]);
      return;
    }
    if (MOTS_PLUS.includes(normaliserTexte(text))) {
      const last = context?.last;
      if (!last || !last.type) {
        await sendWhatsAppText(phone, '🔍 Plus de quoi ? Dites-moi ce que vous cherchez, ou choisissez dans le menu.');
        return;
      }
      const shownIds = Array.isArray(last.shownIds) ? last.shownIds : [];
      if (last.type === 'boutique_search') {
        await envoyerProduitsBoutique(phone, boutique, { query: last.query, excludeIds: shownIds });
      } else {
        await envoyerProduitsBoutique(phone, boutique, { categorie: last.categorie, excludeIds: shownIds });
      }
      return;
    }
    // Texte libre en BOUTIQUE_MENU = recherche directe dans cette boutique
    await setSession(phone, 'BOUTIQUE_SEARCH_QUERY', { boutique });
    await envoyerProduitsBoutique(phone, boutique, { query: text });
    return;
  }

  // ── BOUTIQUE_SEARCH_QUERY → recherche dans la boutique ──────────────────────
  if (state === 'BOUTIQUE_SEARCH_QUERY') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    if (!text || text.length < 2) {
      await sendWhatsAppText(phone, '⚠️ Entrez au moins 2 caractères.');
      return;
    }
    await envoyerProduitsBoutique(phone, boutique, { query: text });
    return;
  }

  // ── BOUTIQUE_CATEGORIE → choix d'une catégorie ───────────────────────────────
  if (state === 'BOUTIQUE_CATEGORIE') {
    const boutique = context?.boutique;
    if (!boutique) {
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    const catMatch = interactiveId.match(/^bcat_(.+)$/);
    if (!catMatch) {
      await sendWhatsAppText(phone, 'Choisissez une catégorie dans la liste ci-dessus, ou tapez *menu*.');
      return;
    }
    await envoyerProduitsBoutique(phone, boutique, { categorie: catMatch[1] });
    return;
  }
```

**Note** : `demarrerCommande` est définie en Task 9 — cette tâche l'appelle par avance. Le fichier ne sera syntaxiquement complet qu'après Task 9 (l'appel à une fonction non encore définie ne casse pas `node --check`, qui ne valide que la syntaxe, pas les références — mais laisser le fichier dans cet état intermédiaire est acceptable seulement si Task 9 suit immédiatement dans la même session d'implémentation).

- [ ] **Step 3: Vérifier la syntaxe**

```bash
node --check backend/services/whatsapp-chatbot.js
```
Expected: aucune sortie (la syntaxe est valide même si `demarrerCommande` n'existe pas encore — ce sera une `ReferenceError` seulement à l'exécution de ce chemin précis).

- [ ] **Step 4: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): recherche, navigation par catégorie et fiche produit complète dans une boutique" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Entrée en mode boutique depuis une recherche globale existante

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js` (fonction `handleSearchQuery`)

**Interfaces:**
- Consumes: `envoyerMenuBoutique` (Task 5).

- [ ] **Step 1: Ajouter le bouton "Voir toute la boutique" après chaque Product Message de recherche globale**

Dans `backend/services/whatsapp-chatbot.js`, dans `handleSearchQuery` (actuellement lignes 437-499), le bloc actuel :

```js
  // Product Messages pour les produits boutique (catalogue Meta)
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}\n📍 ${p.boutique_nom}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n📍 *${p.boutique_nom}*\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
  }
```

devient :

```js
  // Product Messages pour les produits boutique (catalogue Meta)
  for (const p of produits) {
    await sendWhatsAppProduct(
      phone,
      `nopalou-produit-${p.id}`,
      `${p.titre} — ${prixFmt(p.prix)}\n📍 ${p.boutique_nom}`
    ).catch(async () => {
      await sendWhatsAppText(phone, `• *${p.titre}* — ${prixFmt(p.prix)}\n📍 *${p.boutique_nom}*\n👉 ${SITE}/boutiques/${p.boutique_slug}/produits/${p.id}`);
    });
    if (p.boutique_slug) {
      await sendWhatsAppButton(phone, `Envie de voir tout le catalogue de ${p.boutique_nom} ?`, `boutique_${p.boutique_slug}`, '🏪 Voir la boutique').catch(() => {});
    }
  }
```

**Justification du choix d'`id` de bouton** : réutiliser directement `boutique_${slug}` comme `id` de reply button permet de traiter ce clic exactement comme le lien direct externe — un clic renvoie `interactiveId = 'boutique_' + slug`, qui matche le même pattern `/^boutique_(.+)$/i` détecté en Task 5 Step 2 sur `text`. **Attention** : ce pattern est actuellement testé sur `text`, pas sur `interactiveId` — il faut donc élargir la détection.

- [ ] **Step 2: Élargir la détection du lien direct pour couvrir aussi les boutons interactifs**

Dans `backend/services/whatsapp-chatbot.js`, revenir sur le bloc ajouté en Task 5 Step 2 et le modifier pour tester `interactiveId` en plus de `text` :

```js
  // ── Lien direct partagé par un marchand : "boutique_{slug}" (texte ou bouton) ─
  const matchBoutique = (text.match(/^boutique_(.+)$/i)) || (interactiveId.match(/^boutique_(.+)$/i));
  if (matchBoutique) {
    const slug = matchBoutique[1].trim();
    const r = await pool.query(
      'SELECT id, nom, slug, categorie, ville, description, telephone, whatsapp FROM boutiques WHERE slug=$1 AND actif=true',
      [slug]
    );
    if (!r.rows[0]) {
      await sendWhatsAppText(phone, '😕 Cette boutique est introuvable ou n\'est plus active.');
      await setSession(phone, 'MENU', {});
      await sendMenu(phone);
      return;
    }
    await envoyerMenuBoutique(phone, r.rows[0]);
    return;
  }
```

- [ ] **Step 2bis: Retirer la note Task 5 obsolète**

Cette étape ne demande aucune action de code — elle documente que le Step 2 de cette tâche remplace définitivement le Step 2 de Task 5 (même bloc, version élargie). Rien à committer séparément pour ce point.

- [ ] **Step 3: Vérifier la syntaxe**

```bash
node --check backend/services/whatsapp-chatbot.js
```
Expected: aucune sortie.

- [ ] **Step 4: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): bouton pour entrer dans une boutique depuis une recherche globale" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Flux de commande complet (`COMMANDE_*`)

**Files:**
- Modify: `backend/services/whatsapp-chatbot.js`

**Interfaces:**
- Produces: `async function demarrerCommande(phone, boutique, produitId)` (appelée depuis Task 7 Step 2), états `COMMANDE_QUANTITE`, `COMMANDE_NOM`, `COMMANDE_TELEPHONE`, `COMMANDE_ADRESSE`, `COMMANDE_ZONE`, `COMMANDE_PAIEMENT`, `COMMANDE_CONFIRMATION`.
- Consumes: `creerCommandeBoutique` de `backend/routes/comptabilite.js` (Task 1).

- [ ] **Step 1: Importer `creerCommandeBoutique` en tête de whatsapp-chatbot.js**

Dans `backend/services/whatsapp-chatbot.js`, ajouter en tête du fichier, à côté des autres `require` (actuellement lignes 1-12) :

```js
const { creerCommandeBoutique } = require('../routes/comptabilite');
```

- [ ] **Step 2: Ajouter `demarrerCommande`**

Dans `backend/services/whatsapp-chatbot.js`, après `envoyerProduitsBoutique` (Task 7, Step 1), ajouter :

```js
// ── Démarrage du flux de commande ────────────────────────────────────────────
async function demarrerCommande(phone, boutique, produitId) {
  const r = await pool.query(
    'SELECT id, nom, prix, stock_quantite FROM boutique_produits WHERE id=$1 AND boutique_id=$2',
    [produitId, boutique.id]
  );
  const produit = r.rows[0];
  if (!produit) {
    await sendWhatsAppText(phone, '😕 Ce produit n\'est plus disponible.');
    await setSession(phone, 'BOUTIQUE_MENU', { boutique });
    return;
  }
  await sendWhatsAppText(phone, `🛒 *Commande — ${produit.nom}*\n\nCombien en voulez-vous ? (tapez un nombre, ex: 1)`);
  await setSession(phone, 'COMMANDE_QUANTITE', {
    boutique,
    commande: { produit_id: produit.id, nom_produit: produit.nom, prix: Number(produit.prix) || 0, stock_quantite: produit.stock_quantite },
  });
}
```

- [ ] **Step 3: Ajouter les états `COMMANDE_QUANTITE` → `COMMANDE_ADRESSE`**

Dans `backend/services/whatsapp-chatbot.js`, après le bloc `BOUTIQUE_CATEGORIE` ajouté en Task 7 Step 2, et avant `// ── ALERT_PRODUCT ──` (bloc existant), ajouter :

```js
  // ── COMMANDE_* : séquence de collecte des infos de commande ────────────────
  const ANNULER = ['annuler', 'annule', 'stop', 'abandonner'];

  if (state === 'COMMANDE_QUANTITE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    const quantite = parseInt(text.replace(/[^\d]/g, ''), 10);
    if (!quantite || quantite < 1) {
      await sendWhatsAppText(phone, '⚠️ Entrez un nombre valide (ex: 1, 2, 3...).');
      return;
    }
    const stock = context.commande?.stock_quantite;
    if (stock !== null && stock !== undefined && stock < quantite) {
      await sendWhatsAppText(phone, `⚠️ Il ne reste que ${stock} en stock. Entrez une quantité inférieure ou égale.`);
      return;
    }
    await sendWhatsAppText(phone, 'Votre nom complet ?');
    await setSession(phone, 'COMMANDE_NOM', { boutique, commande: { ...context.commande, quantite } });
    return;
  }

  if (state === 'COMMANDE_NOM') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    if (!text || text.trim().length < 2) {
      await sendWhatsAppText(phone, '⚠️ Entrez votre nom complet.');
      return;
    }
    await sendWhatsAppText(phone, `Quel numéro de téléphone pour vous joindre ? (ex: ${phone})`);
    await setSession(phone, 'COMMANDE_TELEPHONE', { boutique, commande: { ...context.commande, client_nom: text.trim() } });
    return;
  }

  if (state === 'COMMANDE_TELEPHONE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    const chiffres = text.replace(/[^\d]/g, '');
    if (chiffres.length < 6) {
      await sendWhatsAppText(phone, '⚠️ Entrez un numéro de téléphone valide.');
      return;
    }
    await sendWhatsAppText(phone, 'Votre adresse de livraison ? (quartier, ville...)');
    await setSession(phone, 'COMMANDE_ADRESSE', { boutique, commande: { ...context.commande, client_telephone: chiffres } });
    return;
  }

  if (state === 'COMMANDE_ADRESSE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    if (!text || text.trim().length < 3) {
      await sendWhatsAppText(phone, '⚠️ Entrez une adresse de livraison.');
      return;
    }
    const commandeAvecAdresse = { ...context.commande, client_adresse: text.trim() };

    const zones = await pool.query('SELECT id, nom, prix FROM zones_livraison WHERE boutique_id=$1 ORDER BY prix ASC', [boutique.id]);
    if (!zones.rows.length) {
      await envoyerRecapCommande(phone, boutique, commandeAvecAdresse);
      return;
    }
    const rows = zones.rows.map(z => ({ id: `zone_${z.id}`, title: z.nom.slice(0, 24), description: prixFmt(Number(z.prix)) }));
    await sendWhatsAppInteractive(phone, 'Livraison', 'Choisissez votre zone de livraison :', [{ title: 'Zones', rows }]);
    await setSession(phone, 'COMMANDE_ZONE', { boutique, commande: commandeAvecAdresse });
    return;
  }
```

- [ ] **Step 4: Ajouter les états `COMMANDE_ZONE`, `COMMANDE_PAIEMENT`, `COMMANDE_CONFIRMATION`**

À la suite immédiate du bloc précédent :

```js
  if (state === 'COMMANDE_ZONE') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    const zoneMatch = interactiveId.match(/^zone_(.+)$/);
    if (!zoneMatch) {
      await sendWhatsAppText(phone, 'Choisissez une zone dans la liste ci-dessus.');
      return;
    }
    const { rows: [zone] } = await pool.query('SELECT id, nom, prix FROM zones_livraison WHERE id=$1 AND boutique_id=$2', [zoneMatch[1], boutique.id]);
    if (!zone) {
      await sendWhatsAppText(phone, '⚠️ Zone invalide, réessayez.');
      return;
    }
    await envoyerRecapCommande(phone, boutique, {
      ...context.commande,
      zone_livraison_id: zone.id,
      zone_nom: zone.nom,
      frais_livraison: Number(zone.prix),
    });
    return;
  }

  if (state === 'COMMANDE_PAIEMENT') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    const PAIEMENTS = { pay_wave: 'wave', pay_om: 'orange_money', pay_cash: 'cash', pay_virement: 'virement' };
    const methode = PAIEMENTS[interactiveId];
    if (!methode) {
      await sendWhatsAppText(phone, 'Choisissez un mode de paiement dans les boutons ci-dessus.');
      return;
    }
    await envoyerRecapFinal(phone, boutique, { ...context.commande, methode_paiement: methode });
    return;
  }

  if (state === 'COMMANDE_CONFIRMATION') {
    const boutique = context?.boutique;
    if (!boutique) { await setSession(phone, 'MENU', {}); await sendMenu(phone); return; }
    if (interactiveId === 'cmd_annuler' || ANNULER.includes(normaliserTexte(text))) {
      await sendWhatsAppText(phone, 'Commande annulée.');
      await envoyerMenuBoutique(phone, boutique);
      return;
    }
    if (interactiveId !== 'cmd_confirmer') {
      await sendWhatsAppText(phone, 'Cliquez sur ✅ Confirmer ou ✏️ Annuler ci-dessus.');
      return;
    }
    const c = context.commande;
    try {
      const { commande } = await creerCommandeBoutique({
        boutiqueId: boutique.id,
        produitId: c.produit_id,
        quantite: c.quantite,
        clientNom: c.client_nom,
        clientTelephone: c.client_telephone,
        clientAdresse: c.client_adresse,
        source: 'whatsapp',
        methodePaiement: c.methode_paiement,
        zoneLivraisonId: c.zone_livraison_id || null,
      });
      await sendWhatsAppText(
        phone,
        `✅ *Commande ${commande.reference} envoyée !*\n\nLe vendeur *${boutique.nom}* va vous contacter pour finaliser le paiement et la livraison.`
      );
    } catch (err) {
      await sendWhatsAppText(phone, `😕 Impossible de créer la commande : ${err.message}. Réessayez ou tapez *menu*.`);
    }
    await envoyerMenuBoutique(phone, boutique);
    return;
  }
```

- [ ] **Step 5: Ajouter les fonctions `envoyerRecapCommande` et `envoyerRecapFinal`**

Dans `backend/services/whatsapp-chatbot.js`, après `demarrerCommande` (Step 2 de cette tâche), ajouter :

```js
async function envoyerRecapCommande(phone, boutique, commande) {
  await sendWhatsAppInteractive(
    phone,
    'Paiement',
    'Quel mode de paiement souhaitez-vous utiliser ?',
    [{
      title: 'Paiement',
      rows: [
        { id: 'pay_wave', title: 'Wave' },
        { id: 'pay_om', title: 'Orange Money' },
        { id: 'pay_cash', title: 'Espèces à la livraison' },
        { id: 'pay_virement', title: 'Virement' },
      ],
    }]
  );
  await setSession(phone, 'COMMANDE_PAIEMENT', { boutique, commande });
}

async function envoyerRecapFinal(phone, boutique, commande) {
  const methodeLabel = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces à la livraison', virement: 'Virement' };
  const total = (commande.prix * commande.quantite) + (commande.frais_livraison || 0);
  const lignes = [
    `📋 *Récapitulatif de votre commande*`,
    ``,
    `🛍️ ${commande.nom_produit} × ${commande.quantite}`,
    `💰 ${prixFmt(commande.prix * commande.quantite)}`,
  ];
  if (commande.frais_livraison) lignes.push(`🚚 Livraison (${commande.zone_nom}) : ${prixFmt(commande.frais_livraison)}`);
  lignes.push(`*Total : ${prixFmt(total)}*`, ``);
  lignes.push(`👤 ${commande.client_nom}`, `📞 ${commande.client_telephone}`, `📍 ${commande.client_adresse}`);
  lignes.push(`💳 Paiement : ${methodeLabel[commande.methode_paiement] || commande.methode_paiement}`);

  await sendWhatsAppText(phone, lignes.join('\n'));
  await sendWhatsAppInteractive(
    phone,
    'Confirmation',
    'Confirmez-vous cette commande ?',
    [{ title: 'Action', rows: [
      { id: 'cmd_confirmer', title: '✅ Confirmer' },
      { id: 'cmd_annuler', title: '✏️ Annuler' },
    ] }]
  );
  await setSession(phone, 'COMMANDE_CONFIRMATION', { boutique, commande });
}
```

**Note sur `sendWhatsAppInteractive` pour la confirmation** : ce composant utilise le type `list` (pas `button`) car `sendWhatsAppButton`/`sendWhatsAppMenuOuFin` sont limités à des `body`+2 boutons fixes de bibliothèque — ici on veut un texte libre "Confirmez-vous cette commande ?" avec 2 choix personnalisés, donc `sendWhatsAppInteractive` avec une seule section convient mieux et reste cohérent avec le reste du fichier qui l'utilise déjà pour des choix similaires.

- [ ] **Step 6: Vérifier la syntaxe**

```bash
node --check backend/services/whatsapp-chatbot.js
```
Expected: aucune sortie.

- [ ] **Step 7: Vérifier que toutes les fonctions référencées existent (pas de `ReferenceError` évidente)**

```bash
grep -n "^async function \|^function " backend/services/whatsapp-chatbot.js
```
Confirmer la présence de : `sendMenu`, `envoyerMenuBoutique`, `envoyerListeImmo`, `envoyerListeTelecom`, `envoyerListeBoutiques`, `envoyerFicheProduitBoutique`, `envoyerProduitsBoutique`, `demarrerCommande`, `envoyerRecapCommande`, `envoyerRecapFinal`, `handleIncoming`, `handleSearchQuery`, `searchContent`, `getSession`, `setSession`, `cleanupOldMessages`, `resetInactiveSessions`, `isDuplicate`, `detecterFAQ`, `normaliserTexte`.

- [ ] **Step 8: Commit**

```bash
git add backend/services/whatsapp-chatbot.js
git commit -m "feat(chatbot): flux de commande complet (quantité, coordonnées, zone, paiement, confirmation)" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: Vérification manuelle de bout en bout en conditions réelles

**Files:** aucun fichier modifié — tâche de vérification uniquement.

**Interfaces:** aucune.

- [ ] **Step 1: Vérifier la syntaxe complète une dernière fois**

```bash
node --check backend/services/whatsapp-chatbot.js
node --check backend/routes/comptabilite.js
```
Expected: aucune sortie pour les deux.

- [ ] **Step 2: Démarrer le backend local**

```bash
npm run dev
```
Attendre le message de démarrage sans erreur (`Serveur démarré sur le port 3000` ou équivalent), vérifier l'absence d'erreur `require` liée à `comptabilite`/`whatsapp-chatbot`.

- [ ] **Step 3: Vérifier `frontend-next` compile et démarre**

```bash
cd frontend-next && npx tsc --noEmit && npm run dev
```
Expected : 0 erreur TypeScript, serveur démarré sur le port 3001.

- [ ] **Step 4: Test manuel visuel des deux emplacements de lien**

- Se connecter en tant que propriétaire d'une boutique de test sur `/boutique`, onglet Marketing → confirmer la présence du nouveau bloc "Assistant WhatsApp de la boutique" avec bouton Partager fonctionnel (copier + ouvrir wa.me).
- Visiter `/boutiques/{slug-de-test}` en tant que visiteur non connecté → confirmer la présence du bouton "🤖 Voir le catalogue sur l'assistant Nopalou", distinct visuellement du bouton "💬 Écrire sur WhatsApp" existant.

- [ ] **Step 5: Test manuel du chatbot en conditions réelles WhatsApp**

Envoyer au numéro WhatsApp Business Nopalou, dans l'ordre, en notant le résultat de chaque étape :
1. `boutique_{slug-de-test}` → doit afficher directement le menu de cette boutique (pas le message de bienvenue générique).
2. Depuis le menu principal (`menu`) → `🏪 Boutiques` → choisir un secteur → confirmer la liste paginée, tester `plus`.
3. Depuis le menu boutique → `🔍 Rechercher` → taper un mot-clé présent dans un produit de test → confirmer Product Message + message texte détaillé (description, variantes/caractéristiques, stock) + bouton `🛒 Commander`.
4. Depuis le menu boutique → `📂 Par catégorie` → choisir une catégorie → confirmer les mêmes fiches produits.
5. Depuis le menu boutique → `📞 Contacter le vendeur` → confirmer le lien `wa.me` reçu pointe bien vers le numéro du marchand (pas le bot).
6. Cliquer `🛒 Commander` sur un produit → suivre toute la séquence (quantité → nom → téléphone → adresse → zone si configurée → paiement → récapitulatif → Confirmer) → vérifier en base :

```sql
SELECT reference, source, methode_paiement, montant_total, client_nom, client_telephone, statut
FROM commandes_boutique
WHERE source = 'whatsapp'
ORDER BY created_at DESC LIMIT 1;
```
Expected: une ligne avec `source='whatsapp'` et les données saisies pendant le test.

7. Vérifier que le vendeur (numéro `whatsapp`/`telephone` de la boutique de test) a bien reçu la notification de nouvelle commande.
8. Tester l'annulation en tapant `annuler` à une étape intermédiaire de la commande (ex: après avoir donné la quantité) → confirmer le retour au menu boutique sans commande créée.
9. Tester une recherche globale (`menu` → `🔍 Rechercher` → mot-clé d'un produit boutique) → confirmer la présence du bouton "🏪 Voir la boutique" → cliquer → confirmer l'entrée dans le menu boutique.
10. Tester `menu` à n'importe quelle étape du flux boutique/commande → confirmer le retour au menu principal et l'effacement du contexte (redémarrer le flux boutique doit repartir de zéro, pas reprendre une commande abandonnée).

- [ ] **Step 6: Documenter les résultats dans CLAUDE.md**

Ajouter une entrée d'état de projet en tête du fichier `CLAUDE.md` (au-dessus de la première entrée « État du projet » existante), résumant ce qui a été livré, ce qui a été vérifié en réel (lister précisément les points du Step 5 confirmés vs en échec), et toute limitation découverte pendant le test réel (ex: limite Meta atteinte, template manquant, etc.) — suivre le style des entrées « État du projet » déjà présentes dans ce fichier.

- [ ] **Step 7: Commit final si des ajustements ont été faits pendant la vérification**

```bash
git add -A
git commit -m "fix(chatbot): ajustements suite à la vérification manuelle en conditions réelles" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

Si aucun ajustement n'a été nécessaire, ignorer ce commit et simplement committer la mise à jour de `CLAUDE.md` du Step 6 :

```bash
git add CLAUDE.md
git commit -m "docs: documente la livraison de la navigation boutiques dans le chatbot WhatsApp" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Notes de cohérence entre tâches

- Task 5 introduit la détection `boutique_{slug}` sur `text` uniquement ; Task 8 l'élargit pour couvrir aussi `interactiveId` (bouton). Un reviewer qui n'implémente que Task 5 verra un chemin fonctionnel mais incomplet — c'est attendu, Task 8 complète.
- `demarrerCommande` est appelée dans Task 7 mais définie dans Task 9 : si les tâches sont exécutées par des subagents indépendants sans ordre garanti, Task 9 doit être appliquée avant tout test d'exécution du flux "Commander" — mais l'ordre d'écriture du fichier (Task 7 avant Task 9) ne casse pas `node --check`, seulement l'exécution réelle de ce chemin.
- Toutes les nouvelles fonctions (`envoyerMenuBoutique`, `envoyerListeBoutiques`, `envoyerFicheProduitBoutique`, `envoyerProduitsBoutique`, `demarrerCommande`, `envoyerRecapCommande`, `envoyerRecapFinal`) restent internes au fichier `whatsapp-chatbot.js` (non exportées) — cohérent avec `module.exports = { handleIncoming, cleanupOldMessages, resetInactiveSessions, handleSearchQuery }` existant, qu'aucune tâche ne modifie.
