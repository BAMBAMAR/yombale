# Marketing boutique — faciliter le partage, pas ajouter des templates à copier — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réduire le travail réel du marchand pour partager sa boutique et ses produits — partage produit en 1 clic vers WhatsApp avec message enrichi, traçage discret des produits jamais partagés, bandeau de conseils actionnable, et refonte qualité du visuel story boutique.

**Architecture:** Une nouvelle colonne backend additive (`boutique_produits.partage_le`) + une nouvelle route PATCH légère pour la marquer, sans toucher aux routes existantes de mise à jour produit. Côté frontend, un seul composant partagé (`BoutonPartager`) est modifié pour devenir une action 1-clic au lieu d'un menu à 3 choix, réutilisé identiquement par le catalogue produits et la carte boutique. L'état du filtre "jamais partagé" est remonté au niveau du parent (`BoutiqueManage`) pour permettre au bandeau de conseils (dans l'onglet Marketing) de faire basculer l'onglet Catalogue avec ce filtre pré-appliqué.

**Tech Stack:** Express (routes + PostgreSQL via `pool`), Next.js 14 Server Actions (`backendFetch`), React (Client Components), `next/og` `ImageResponse` pour le visuel.

## Global Constraints

- Aucun template de texte à copier-coller ajouté nulle part — l'objectif est de réduire les actions du marchand, pas de lui donner plus de texte à gérer manuellement.
- Aucun nouveau canal (Facebook/Instagram) dans `BoutonPartager` — WhatsApp reste l'unique canal d'action principale.
- Pas de refonte du visuel story **produit** (`/assets/produit-boutique/[id]/story`) — seul le visuel story **boutique** (`/assets/boutique/[id]/story`) est retouché.
- `boutique_produits.partage_le` est une colonne additive, nullable, sans défaut — ajoutée via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, suivant le pattern déjà en place dans `backend/migrate-inline.js`.
- La mise à jour de `partage_le` ne doit jamais bloquer ni retarder visuellement l'ouverture de WhatsApp ou la copie du lien — fire-and-forget côté UX.
- `export const runtime = 'edge'` doit être conservé dans `frontend-next/src/app/assets/boutique/[id]/story/route.tsx`. Dimensions inchangées : 1080×1920.
- Vérification finale : `npx tsc --noEmit` propre dans `frontend-next/`, et `node --check` propre sur tout fichier backend modifié.

---

### Task 1: Backend — colonne `partage_le` et route de marquage

**Files:**
- Modify: `backend/migrate-inline.js` (ajout de la colonne, à la suite des autres `ALTER TABLE boutique_produits` — voir bloc existant vers la ligne 610-615 pour le pattern exact à suivre)
- Modify: `backend/routes/boutiques.js` (nouvelle route, à ajouter après la route `PUT /:id/produits/:prodId` existante, ligne ~373)

**Interfaces:**
- Produces: route `PATCH /api/boutiques/:id/produits/:prodId/partage` — body vide, réponse `{ success: true, partage_le: string }` (ISO timestamp) en cas de succès, `{ error: string }` sinon. Authentification identique aux autres routes de gestion produit (`verifierToken` + vérification de propriété de la boutique).
- Consumes: rien d'une tâche précédente (première tâche du plan).

**Contexte — pattern existant à suivre pour la migration** (`backend/migrate-inline.js`, ligne ~610-615) :

```js
  // Variantes simples produit (options + valeurs, ex: Couleur/Taille) – 17 juillet 2026
  try {
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS variantes JSONB DEFAULT '[]'`);
    console.log('[MIGRATE] ✅ Colonne boutique_produits.variantes OK');
  } catch (e) { console.warn('[MIGRATE] bp_variantes:', e.message); }
```

**Contexte — pattern existant à suivre pour la route** (`backend/routes/boutiques.js`, route `DELETE` juste après `PUT`, ligne 376-386) :

```js
router.delete('/:id/produits/:prodId', verifierToken, param('id').isUUID(), param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query('DELETE FROM boutique_produits WHERE id=$1 AND boutique_id=$2 RETURNING id', [prodId, id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});
```

- [ ] **Step 1: Ajouter la colonne `partage_le` dans la migration**

Dans `backend/migrate-inline.js`, juste après le bloc `variantes` cité ci-dessus, ajouter :

```js
  // Traçage du partage produit (marketing boutique) – 18 juillet 2026
  try {
    await pool.query(`ALTER TABLE boutique_produits ADD COLUMN IF NOT EXISTS partage_le TIMESTAMPTZ`);
    console.log('[MIGRATE] ✅ Colonne boutique_produits.partage_le OK');
  } catch (e) { console.warn('[MIGRATE] bp_partage_le:', e.message); }
```

- [ ] **Step 2: Ajouter `partage_le` dans le SELECT de `GET /:id/produits`**

Dans `backend/routes/boutiques.js`, ligne ~225, la requête actuelle :

```js
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes,
              p.whatsapp_sync_statut, p.whatsapp_sync_erreur
       FROM boutique_produits p
```

devient (ajout de `p.partage_le` à la liste des colonnes sélectionnées) :

```js
      `SELECT p.id, p.nom, p.description, p.prix, p.prix_barre, p.images, p.en_stock, p.ordre, p.categorie, p.caracteristiques, p.stock_quantite, p.variantes,
              p.whatsapp_sync_statut, p.whatsapp_sync_erreur, p.partage_le
       FROM boutique_produits p
```

- [ ] **Step 3: Ajouter la route `PATCH /:id/produits/:prodId/partage`**

Dans `backend/routes/boutiques.js`, juste après la route `DELETE /:id/produits/:prodId` (donc après le bloc cité en contexte ci-dessus), ajouter :

```js
// ── PATCH /api/boutiques/:id/produits/:prodId/partage — marquer un produit comme partagé
router.patch('/:id/produits/:prodId/partage', verifierToken, param('id').isUUID(), param('prodId').isUUID(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'ID invalide' });
  try {
    const { id, prodId } = req.params;
    const own = await pool.query('SELECT id FROM boutiques WHERE id=$1 AND utilisateur_id=$2', [id, req.user.userId]);
    if (!own.rows[0]) return res.status(403).json({ error: 'Accès refusé' });

    const r = await pool.query(
      'UPDATE boutique_produits SET partage_le=NOW() WHERE id=$1 AND boutique_id=$2 RETURNING partage_le',
      [prodId, id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ success: true, partage_le: r.rows[0].partage_le });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});
```

- [ ] **Step 4: Vérifier la syntaxe des fichiers backend modifiés**

Run: `node --check backend/migrate-inline.js`
Expected: aucune sortie, exit code 0.

Run: `node --check backend/routes/boutiques.js`
Expected: aucune sortie, exit code 0.

- [ ] **Step 5: Tester la migration et la route en local**

Démarrer le backend local (`npm run dev` depuis la racine du projet, ou confirmer qu'il tourne déjà) et vérifier dans les logs de démarrage la ligne `[MIGRATE] ✅ Colonne boutique_produits.partage_le OK`.

Puis, avec un token JWT valide d'un compte possédant une boutique avec au moins un produit (obtenir via connexion normale ou un token de test existant dans l'environnement), tester :

```bash
curl -X PATCH http://localhost:3000/api/boutiques/{BOUTIQUE_ID}/produits/{PRODUIT_ID}/partage \
  -H "Authorization: Bearer {TOKEN}"
```

Expected: `{"success":true,"partage_le":"2026-07-18T..."}`. Vérifier ensuite que `GET /api/boutiques/{BOUTIQUE_ID}/produits` renvoie bien ce produit avec `partage_le` non-null.

- [ ] **Step 6: Commit**

```bash
git add backend/migrate-inline.js backend/routes/boutiques.js
git commit -m "feat(boutique): ajoute le tracage partage_le et la route PATCH de marquage"
```

---

### Task 2: Frontend — Server Action `marquerProduitPartage`

**Files:**
- Modify: `frontend-next/src/app/boutique/actions.ts` (nouvelle fonction, à ajouter après `deleteProduit`, ligne ~111)

**Interfaces:**
- Consumes: la route backend `PATCH /api/boutiques/:id/produits/:prodId/partage` créée en Task 1.
- Produces: `marquerProduitPartage(boutiqueId: string, produitId: string): Promise<ActionState>` — exportée, consommée par Task 3 (`BoutonPartager`) et Task 4 (carte boutique).

**Contexte — pattern existant à suivre** (`frontend-next/src/app/boutique/actions.ts`, fonction `deleteProduit`, ligne 100-111) :

```ts
export async function deleteProduit(boutiqueId: string, produitId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: data.error ?? 'Impossible de supprimer le produit' }
    }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
```

- [ ] **Step 1: Ajouter `marquerProduitPartage`**

Dans `frontend-next/src/app/boutique/actions.ts`, juste après `deleteProduit`, ajouter :

```ts
export async function marquerProduitPartage(boutiqueId: string, produitId: string): Promise<ActionState> {
  try {
    const res = await backendFetch(`/api/boutiques/${boutiqueId}/produits/${produitId}/partage`, { method: 'PATCH' })
    if (!res.ok) return { error: 'Impossible de marquer le produit comme partagé' }
    return { success: true }
  } catch {
    return { error: 'Erreur de connexion au serveur' }
  }
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/boutique/actions.ts
git commit -m "feat(boutique): ajoute la server action marquerProduitPartage"
```

---

### Task 3: `BoutonPartager` — action 1-clic WhatsApp + menu secondaire réduit

**Files:**
- Modify: `frontend-next/src/components/BoutonPartager.tsx` (fichier entier, réécriture du composant — 67 lignes actuelles)

**Interfaces:**
- Consumes: rien de nouveau en dépendance directe — le composant reste autonome, mais reçoit une nouvelle prop optionnelle pour le callback de traçage (voir signature ci-dessous), appelée par les tâches 4 et 5 qui l'utilisent.
- Produces: nouvelle signature de props, consommée par Task 4 (carte produit catalogue) et Task 5 (carte boutique marketing) :

```ts
interface Props {
  lien: string
  message: string
  lienVisuel: string
  onPartage?: () => void  // NOUVEAU — appelé (fire-and-forget, jamais awaité par l'appelant) après ouverture WhatsApp ou copie du lien
}
```

**Contexte — fichier actuel complet** (pour référence, avant modification) :

```tsx
'use client'
import { useState } from 'react'

interface Props {
  lien: string
  message: string
  lienVisuel: string
}

export default function BoutonPartager({ lien, message, lienVisuel }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)

  function copierLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    })
  }

  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOuvert(o => !o)}
        style={{
          padding: '8px 16px', background: '#fff', color: '#374151',
          border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}
      >
        📤 Partager
      </button>
      {ouvert && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 10,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 8, minWidth: 220, maxWidth: 'calc(100vw - 24px)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <button
            onClick={copierLien}
            style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            💬 Partager sur WhatsApp
          </a>
          <a
            href={lienVisuel}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 1: Réécrire le composant avec l'action principale WhatsApp directe**

Remplacer l'intégralité du fichier `frontend-next/src/components/BoutonPartager.tsx` par :

```tsx
'use client'
import { useState } from 'react'

interface Props {
  lien: string
  message: string
  lienVisuel: string
  onPartage?: () => void
}

export default function BoutonPartager({ lien, message, lienVisuel, onPartage }: Props) {
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)

  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(message)}`

  function partagerWhatsApp() {
    window.open(urlWhatsApp, '_blank', 'noopener,noreferrer')
    onPartage?.()
  }

  function copierLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
      onPartage?.()
    })
    setOuvert(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', gap: 4 }}>
      <button
        onClick={partagerWhatsApp}
        style={{
          padding: '8px 16px', background: '#25D366', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}
      >
        💬 Partager
      </button>
      <button
        onClick={() => setOuvert(o => !o)}
        aria-label="Plus d'options de partage"
        style={{
          padding: '8px 10px', background: '#fff', color: '#374151',
          border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, cursor: 'pointer',
        }}
      >
        ⋯
      </button>
      {ouvert && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 10,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: 8, minWidth: 200, maxWidth: 'calc(100vw - 24px)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <button
            onClick={copierLien}
            style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6 }}
          >
            {copie ? '✓ Copié' : '📋 Copier le lien'}
          </button>
          <a
            href={lienVisuel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOuvert(false)}
            style={{ padding: '8px 12px', textDecoration: 'none', color: '#111827', fontSize: 13, fontWeight: 600, borderRadius: 6 }}
          >
            🖼 Télécharger le visuel
          </a>
        </div>
      )}
    </div>
  )
}
```

Note : `onPartage` est optionnel et n'est jamais `await`é par ce composant — l'appelant (Task 4/5) lui passe une fonction qui déclenche l'appel serveur en fire-and-forget, sans jamais bloquer `partagerWhatsApp`/`copierLien`.

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: des erreurs sont attendues à ce stade dans `BoutiqueClient.tsx` et `assistant-whatsapp`/autres appelants existants SI ils utilisaient un comportement désormais absent — mais comme `onPartage` est optionnel et que les autres props (`lien`, `message`, `lienVisuel`) sont inchangées, aucun appelant existant ne devrait casser. Confirmer 0 erreur.

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/components/BoutonPartager.tsx
git commit -m "feat(marketing): BoutonPartager devient une action WhatsApp directe en 1 clic"
```

---

### Task 4: Catalogue produits — message enrichi (promo) et traçage du partage

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (interface `Produit` ligne 57-70, composant `CatalogueProduits` — carte produit ligne ~1205-1277, filtre ligne ~1049 et ~1092-1097)

**Interfaces:**
- Consumes: `marquerProduitPartage` (Task 2), nouvelle prop `onPartage` de `BoutonPartager` (Task 3).
- Produces: nouveau filtre `filtreStatut` étendu avec la valeur `'jamais_partage'` ; nouvelle prop optionnelle sur `CatalogueProduits` pour permettre à un composant parent de forcer ce filtre au montage — consommée par Task 6 (bandeau de conseils).

**Contexte — interface `Produit` actuelle** (ligne 57-70) :

```ts
interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
  variantes: Variante[] | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
}
```

**Contexte — carte produit actuelle avec `BoutonPartager`** (ligne 1249-1254) :

```tsx
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <BoutonPartager
                  lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  message={`${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  lienVisuel={`/assets/produit-boutique/${p.id}/story?boutiqueId=${boutique.id}`}
                />
```

**Contexte — définition de `CatalogueProduits`, `filtreStatut`, et le filtre** (ligne 1042-1097) :

```tsx
function CatalogueProduits({ boutique, planActif, prixPro }: { boutique: Boutique; planActif: 'pro' | 'business' | null; prixPro: number }) {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | { creating: 'rapide' | 'detaille' } | { editing: Produit }>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [rechercheTexte, setRechercheTexte] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'synchronise' | 'en_attente' | 'echec'>('tous')
  const [filtreCategorie, setFiltreCategorie] = useState<string>('toutes')
  const [, startTransition] = useTransition()
  // ...
  const produitsFiltres = produits.filter(p => {
    if (rechercheTexte.trim() && !p.nom.toLowerCase().includes(rechercheTexte.trim().toLowerCase())) return false
    if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) return false
    if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false
    return true
  })
```

**Contexte — select du filtre statut** (ligne 1156-1165) :

```tsx
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value as typeof filtreStatut)}
            style={{ padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="synchronise">✓ Sur WhatsApp</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="echec">✗ Échec</option>
          </select>
```

- [ ] **Step 1: Ajouter `partage_le` à l'interface `Produit`**

Remplacer (ligne 57-70) :

```ts
interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
  variantes: Variante[] | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
}
```

par :

```ts
interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
  variantes: Variante[] | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
  partage_le: string | null
}
```

- [ ] **Step 2: Importer `marquerProduitPartage` dans `BoutiqueClient.tsx`**

En haut du fichier (ligne 6), remplacer :

```ts
import { createBoutique, updateBoutique, deleteBoutique, createProduit, updateProduit, deleteProduit } from './actions'
```

par :

```ts
import { createBoutique, updateBoutique, deleteBoutique, createProduit, updateProduit, deleteProduit, marquerProduitPartage } from './actions'
```

- [ ] **Step 3: Ajouter la prop `filtreInitial` optionnelle et étendre `filtreStatut`**

Remplacer la signature de `CatalogueProduits` (ligne 1042) :

```tsx
function CatalogueProduits({ boutique, planActif, prixPro }: { boutique: Boutique; planActif: 'pro' | 'business' | null; prixPro: number }) {
```

par :

```tsx
function CatalogueProduits({ boutique, planActif, prixPro, filtreInitial }: { boutique: Boutique; planActif: 'pro' | 'business' | null; prixPro: number; filtreInitial?: 'jamais_partage' }) {
```

Remplacer la ligne du state `filtreStatut` (ligne 1049) :

```tsx
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'synchronise' | 'en_attente' | 'echec'>('tous')
```

par :

```tsx
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'synchronise' | 'en_attente' | 'echec' | 'jamais_partage'>(filtreInitial ?? 'tous')
```

- [ ] **Step 4: Étendre la logique de filtrage pour `jamais_partage`**

Remplacer (ligne 1092-1097) :

```tsx
  const produitsFiltres = produits.filter(p => {
    if (rechercheTexte.trim() && !p.nom.toLowerCase().includes(rechercheTexte.trim().toLowerCase())) return false
    if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) return false
    if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false
    return true
  })
```

par :

```tsx
  const produitsFiltres = produits.filter(p => {
    if (rechercheTexte.trim() && !p.nom.toLowerCase().includes(rechercheTexte.trim().toLowerCase())) return false
    if (filtreStatut === 'jamais_partage') { if (p.partage_le) return false }
    else if (filtreStatut !== 'tous' && (p.whatsapp_sync_statut || 'en_attente') !== filtreStatut) return false
    if (filtreCategorie !== 'toutes' && p.categorie !== filtreCategorie) return false
    return true
  })
```

- [ ] **Step 5: Ajouter l'option `jamais_partage` au select du filtre**

Remplacer (ligne 1156-1165) :

```tsx
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value as typeof filtreStatut)}
            style={{ padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="synchronise">✓ Sur WhatsApp</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="echec">✗ Échec</option>
          </select>
```

par :

```tsx
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value as typeof filtreStatut)}
            style={{ padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="synchronise">✓ Sur WhatsApp</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="echec">✗ Échec</option>
            <option value="jamais_partage">📢 Jamais partagés</option>
          </select>
```

- [ ] **Step 6: Enrichir le message et brancher `onPartage` sur la carte produit**

Remplacer (ligne 1249-1254) :

```tsx
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <BoutonPartager
                  lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  message={`${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  lienVisuel={`/assets/produit-boutique/${p.id}/story?boutiqueId=${boutique.id}`}
                />
```

par :

```tsx
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <BoutonPartager
                  lien={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`}
                  message={
                    p.prix_barre && p.prix && p.prix_barre > p.prix
                      ? `🔥 ${p.nom} en promo : ${fcfa(p.prix)} au lieu de ${fcfa(p.prix_barre)} !\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`
                      : `${p.nom}${p.prix ? ` — ${fcfa(p.prix)}` : ''}\n\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'}/boutiques/${boutique.id}/produits/${p.id}`
                  }
                  lienVisuel={`/assets/produit-boutique/${p.id}/story?boutiqueId=${boutique.id}`}
                  onPartage={() => { marquerProduitPartage(boutique.id, p.id).catch(() => {}) }}
                />
```

Note : `marquerProduitPartage(...).catch(() => {})` — l'appel n'est jamais `await`é ici, et son échec éventuel est avalé silencieusement, conformément à la contrainte "ne jamais bloquer ni faire échouer visuellement le partage".

- [ ] **Step 7: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 8: Vérification manuelle locale**

Avec le dev server actif (`npm run dev` dans `frontend-next/` si pas déjà lancé) et connecté à un compte boutique de test :
1. Aller dans `/boutique` → Catalogue, créer ou éditer un produit avec un `prix_barre` supérieur au `prix`.
2. Cliquer sur le bouton `💬 Partager` de ce produit — vérifier que WhatsApp s'ouvre avec un message commençant par `🔥` et mentionnant les deux prix.
3. Vérifier en base (ou via un rafraîchissement de la page) que `partage_le` s'est mis à jour pour ce produit.
4. Sélectionner le filtre "📢 Jamais partagés" et vérifier que ce produit n'apparaît plus dans la liste filtrée.

- [ ] **Step 9: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): message promo enrichi et tracage du partage sur le catalogue"
```

---

### Task 5: Carte boutique — action 1-clic sur l'onglet Marketing

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (composant `MarketingBoutique`, ligne 980-1038)

**Interfaces:**
- Consumes: `marquerProduitPartage` n'est PAS utilisé ici (le partage boutique n'est pas un produit — pas de traçage `partage_le` sur la carte boutique, seulement sur les produits individuels, conformément à la spec). `BoutonPartager` (Task 3) est réutilisé tel quel, sans `onPartage`.
- Produces: rien consommé par une tâche suivante — dernière modification de `MarketingBoutique` avant Task 6 qui ajoute le bandeau au-dessus.

**Contexte — `MarketingBoutique` actuel** (ligne 980-1038, déjà lu intégralement plus haut dans la conversation — reproduit ici pour la tâche) :

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

Cette tâche ne modifie **aucune ligne de ce composant** — `BoutonPartager` est déjà réutilisé tel quel par les deux cartes existantes (boutique classique + assistant WhatsApp), et la Task 3 a déjà transformé son comportement en action 1-clic pour tous ses appelants simultanément. Le seul travail de cette tâche est de vérifier que le comportement attendu est bien observé ici aussi, sans modification de code.

- [ ] **Step 1: Vérification manuelle locale — carte boutique**

Avec le dev server actif, aller dans `/boutique` → Marketing, et pour chacune des deux cartes (boutique classique, assistant WhatsApp) :
1. Cliquer sur `💬 Partager` — vérifier l'ouverture immédiate de WhatsApp avec le message correspondant (`messageBoutique` ou `messageAssistant`), sans étape de menu intermédiaire.
2. Cliquer sur `⋯` — vérifier que "Copier le lien" et "Télécharger le visuel" sont toujours accessibles et fonctionnels.

Si le comportement observé ne correspond pas à ces deux points, c'est un défaut de la Task 3 (le composant partagé), pas de cette tâche — remonter à la Task 3 plutôt que de dupliquer un correctif ici.

- [ ] **Step 2: Documenter la vérification**

Aucun commit de code n'est attendu pour cette tâche (aucune ligne modifiée). Si l'implémenteur de cette tâche constate un écart de comportement, il doit le rapporter comme un BLOCKED pointant vers la Task 3, pas modifier `MarketingBoutique` lui-même.

---

### Task 6: Bandeau "Conseils & rappels" dans l'onglet Marketing

**Files:**
- Modify: `frontend-next/src/app/boutique/BoutiqueClient.tsx` (composant `MarketingBoutique` ligne 980-1038, composant `BoutiqueManage` ligne 1402-1535 pour le passage du filtre au Catalogue, texte d'intro ligne 1519)

**Interfaces:**
- Consumes: interface `Produit.partage_le` (Task 4), prop `filtreInitial` de `CatalogueProduits` (Task 4).
- Produces: rien consommé par une tâche suivante (dernière tâche fonctionnelle avant la refonte visuelle Task 7, indépendante).

**Contexte — `MarketingBoutique` doit maintenant charger la liste des produits pour compter ceux jamais partagés.** Actuellement ce composant ne reçoit que `boutique` en prop et ne fait aucun appel réseau — `CatalogueProduits` (composant frère) fait déjà l'appel `GET /api/boutiques/{id}/produits` en interne. Pour éviter un double-fetch inutile ET pour permettre au bandeau de déclencher un changement d'onglet avec filtre, l'approche retenue est : `MarketingBoutique` fait son propre appel léger à la même route (le coût réseau d'un `GET` supplémentaire sur une route déjà publique et rapide est acceptable — pas besoin de state partagé complexe entre onglets pour ce chantier).

**Contexte — signature actuelle de `BoutiqueManage`** (ligne 1402-1409) :

```tsx
function BoutiqueManage({ boutique, planActif, onBack, onEdit, prixPro }: {
  boutique: Boutique
  planActif: 'pro' | 'business' | null
  onBack: () => void
  onEdit: () => void
  prixPro: number
}) {
  const [tab, setTab] = useState<'produits' | 'commandes' | 'compta' | 'analytics' | 'infos' | 'marketing'>('produits')
```

**Contexte — rendu du tab `marketing` et du texte d'intro** (ligne 1519, 1531) :

```tsx
          {tab === 'marketing' && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Partagez votre boutique pour attirer plus de clients.</p>}
```

```tsx
        {tab === 'produits'  && <CatalogueProduits boutique={boutique} planActif={planActif} prixPro={prixPro} />}
        ...
        {tab === 'marketing' && <MarketingBoutique boutique={boutique} />}
```

- [ ] **Step 1: Ajouter un state de filtre partagé dans `BoutiqueManage`**

Dans `BoutiqueManage` (ligne 1409, juste après la déclaration de `tab`), ajouter :

```tsx
  const [filtreProduitsMarketing, setFiltreProduitsMarketing] = useState<'jamais_partage' | undefined>(undefined)
```

- [ ] **Step 2: Passer le filtre et le setter aux composants enfants**

Remplacer (ligne 1522 et 1531) :

```tsx
        {tab === 'produits'  && <CatalogueProduits boutique={boutique} planActif={planActif} prixPro={prixPro} />}
```

par :

```tsx
        {tab === 'produits'  && <CatalogueProduits boutique={boutique} planActif={planActif} prixPro={prixPro} filtreInitial={filtreProduitsMarketing} />}
```

et remplacer :

```tsx
        {tab === 'marketing' && <MarketingBoutique boutique={boutique} />}
```

par :

```tsx
        {tab === 'marketing' && <MarketingBoutique boutique={boutique} onVoirJamaisPartages={() => { setFiltreProduitsMarketing('jamais_partage'); setTab('produits') }} />}
```

- [ ] **Step 3: Retirer le texte d'intro statique du parent (déplacé dans le bandeau du composant)**

Remplacer (ligne 1519) :

```tsx
          {tab === 'marketing' && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Partagez votre boutique pour attirer plus de clients.</p>}
```

par (suppression pure — cette ligne disparaît, le bandeau du Step 5 la remplace directement dans `MarketingBoutique`) : rien, retirer la ligne entièrement.

- [ ] **Step 4: Réécrire `MarketingBoutique` avec le chargement des produits et le bandeau**

Remplacer l'intégralité du composant `MarketingBoutique` (ligne 980-1038, texte complet reproduit dans la section Contexte de cette tâche) par :

```tsx
function MarketingBoutique({ boutique, onVoirJamaisPartages }: { boutique: Boutique; onVoirJamaisPartages: () => void }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const lienBoutique = `${siteUrl}/boutiques/${boutique.slug || boutique.id}`
  const messageBoutique = `Découvrez ${boutique.nom} sur Nopalou !\n\n${lienBoutique}`
  const lienAssistant = lienBoutiqueWhatsapp(boutique.slug || boutique.id)
  const messageAssistant = `Découvrez ${boutique.nom} sur Nopalou et commandez directement sur WhatsApp !\n\n${lienAssistant}`

  const [nbJamaisPartages, setNbJamaisPartages] = useState<number | null>(null)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    let annule = false
    fetch(`${backendUrl}/api/boutiques/${boutique.id}/produits`)
      .then(res => res.json())
      .then((data: { produits?: { partage_le: string | null }[] }) => {
        if (annule) return
        const produits = data.produits ?? []
        setNbJamaisPartages(produits.filter(p => !p.partage_le).length)
      })
      .catch(() => { if (!annule) setNbJamaisPartages(0) })
    return () => { annule = true }
  }, [boutique.id, backendUrl])

  return (
    <div>
      {nbJamaisPartages === null ? null : nbJamaisPartages > 0 ? (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 20 }}>📢</span>
          <p style={{ margin: 0, fontSize: 13, color: '#78350f', flex: 1, minWidth: 200 }}>
            <strong>{nbJamaisPartages} produit{nbJamaisPartages > 1 ? 's' : ''}</strong> n&apos;{nbJamaisPartages > 1 ? 'ont' : 'a'} jamais été partagé{nbJamaisPartages > 1 ? 's' : ''} — un partage régulier aide vos produits à être vus.
          </p>
          <button
            onClick={onVoirJamaisPartages}
            style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Voir ces produits →
          </button>
        </div>
      ) : (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <p style={{ margin: 0, fontSize: 13, color: '#166534' }}>
            Tous vos produits ont déjà été partagés au moins une fois.
          </p>
        </div>
      )}

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

Note : `useState` et `useEffect` sont déjà importés en haut du fichier (ligne 2, `import { useState, useEffect, useTransition, useRef } from 'react'`) — aucun nouvel import nécessaire.

- [ ] **Step 5: Vérifier la compilation TypeScript**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Vérification manuelle locale**

Avec le dev server actif :
1. Aller dans `/boutique` → Marketing avec une boutique ayant au moins un produit jamais partagé — vérifier l'affichage du bandeau orange avec le bon décompte et le bon accord singulier/pluriel.
2. Cliquer sur "Voir ces produits →" — vérifier la bascule vers l'onglet Catalogue avec le filtre "📢 Jamais partagés" déjà sélectionné.
3. Partager tous les produits restants (via le bouton `💬 Partager` de chaque carte), revenir sur Marketing — vérifier que le bandeau devient vert ("Tous vos produits ont déjà été partagés").

- [ ] **Step 7: Commit**

```bash
git add frontend-next/src/app/boutique/BoutiqueClient.tsx
git commit -m "feat(boutique): bandeau de conseils actionnable dans l'onglet Marketing"
```

---

### Task 7: Refonte qualité du visuel story boutique

**Files:**
- Modify: `frontend-next/src/app/assets/boutique/[id]/story/route.tsx` (fichier entier, 101 lignes actuelles)

**Interfaces:**
- Consumes: rien des tâches précédentes (fichier isolé, route `ImageResponse` autonome).
- Produces: rien consommé ailleurs dans ce plan — l'URL `/assets/boutique/{id}/story` est déjà référencée telle quelle par `MarketingBoutique` (Task 6, `lienVisuel={`/assets/boutique/${boutique.id}/story`}`) sans changement de signature nécessaire.

**Contexte — fichier actuel complet** (déjà lu intégralement plus haut — voir aussi le composant frère déjà refondu `frontend-next/src/app/assets/chatbot-whatsapp/route.tsx` comme référence de qualité à atteindre, chantier précédent) :

```tsx
import { ImageResponse } from 'next/og'
import { apiFetch } from '@/lib/api'

export const runtime = 'edge'

interface BoutiqueDetail {
  id: string
  nom: string
  categorie: string | null
  ville: string
  logo_url: string | null
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let boutique: BoutiqueDetail | null = null
  try {
    const data = await apiFetch<{ id: string; nom: string; categorie: string | null; ville: string; logo_url: string | null }>(
      `/boutiques/${params.id}`
    )
    boutique = data as BoutiqueDetail
  } catch { /* fallback générique ci-dessous */ }

  const nom = boutique?.nom ?? 'Boutique'
  const categorie = boutique?.categorie ?? ''
  const ville = boutique?.ville ?? 'Sénégal'
  const logo = boutique?.logo_url ?? null

  return new ImageResponse(
    (
      <div style={{
        width: 1080, height: 1920,
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #1C2B4A 0%, #0f1d35 60%, #C75B00 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Logo Nopalou */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '70px 70px 0' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, background: '#C75B00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, fontWeight: 900, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#fff' }}>
            Nopa<span style={{ color: '#C75B00' }}>lou</span>
          </span>
        </div>

        {/* Logo boutique */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '50px 70px', gap: 40,
        }}>
          <div style={{
            width: 320, height: 320, borderRadius: '50%', overflow: 'hidden',
            background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '6px solid rgba(255,255,255,0.25)',
          }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 120 }}>🏪</span>
            )}
          </div>

          <p style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', margin: 0, textAlign: 'center' }}>
            Découvrez
          </p>
          <p style={{
            fontSize: 56, fontWeight: 900, color: '#fff', margin: 0, textAlign: 'center', lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {nom}
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {categorie && (
              <span style={{ fontSize: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: 999 }}>
                {categorie}
              </span>
            )}
            <span style={{ fontSize: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 20px', borderRadius: 999 }}>
              📍 {ville}
            </span>
          </div>
        </div>

        {/* CTA bas */}
        <div style={{ padding: '0 70px 100px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px 60px', fontSize: 32, fontWeight: 900, color: '#C75B00' }}>
            sur Nopalou
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  )
}
```

- [ ] **Step 1: Invoquer le skill frontend-design pour calibrer la direction visuelle**

Avant d'écrire le JSX, invoquer le skill `frontend-design` pour obtenir une direction cohérente avec l'identité Nopalou et avec le visuel déjà refondu `frontend-next/src/app/assets/chatbot-whatsapp/route.tsx` (même famille technique, même exigence de qualité — composition intentionnelle plutôt que dégradé + texte centré générique). Objectif : mettre davantage en valeur le logo et le nom de la boutique — le fichier actuel est déjà raisonnablement composé (logo Nopalou en en-tête, cercle logo boutique, nom, tags catégorie/ville, CTA bas) mais reste un dégradé plat avec des éléments simplement empilés au centre, sans traitement distinctif.

- [ ] **Step 2: Réécrire le contenu et la composition du fichier**

Réécrire `frontend-next/src/app/assets/boutique/[id]/story/route.tsx` en conservant strictement :
- `export const runtime = 'edge'` (ligne 4 actuelle) — ne jamais retirer.
- La logique de fetch existante (`apiFetch<{...}>(`/boutiques/${params.id}`)`, avec son `try/catch` de repli sur des valeurs génériques) — ne pas la modifier, seule la présentation JSX change.
- Les dimensions `{ width: 1080, height: 1920 }` dans l'appel `ImageResponse`.
- La palette de marque : `#1C2B4A` (navy), `#C75B00` (accent Nopalou).
- L'affichage du logo boutique (avec repli emoji 🏪 si absent), du nom, de la catégorie et de la ville — ces 4 informations doivent rester visibles quelque part dans la composition finale, sous quelque forme que ce soit.

La composition précise est décidée à cette étape en s'appuyant sur la sortie de frontend-design du Step 1 — pas de code figé à l'avance dans cette tâche, l'objectif étant la qualité visuelle, pas la reproduction d'une maquette texte.

- [ ] **Step 3: Vérifier le rendu de l'image en local**

Run: `cd frontend-next && npm run dev` (si pas déjà lancé), puis récupérer un ID ou slug de boutique de test existant et ouvrir `http://localhost:3001/assets/boutique/{ID}/story` dans un navigateur (ou via `curl -s -o preview.png -w "%{http_code} %{content_type}\n" http://localhost:3001/assets/boutique/{ID}/story`). Confirmer :
- L'image se charge sans erreur (200, `image/png`).
- Dimensions 1080×1920.
- Logo boutique (ou repli 🏪), nom, catégorie et ville tous visibles et lisibles, sans chevauchement ni troncature.
- Rendu visuellement net et distinctif par rapport à la version précédente (dégradé plat + empilement centré).

Tester aussi avec un ID de boutique qui n'a pas de `logo_url` pour confirmer que le repli 🏪 fonctionne toujours proprement dans la nouvelle composition.

- [ ] **Step 4: Commit**

```bash
git add "frontend-next/src/app/assets/boutique/[id]/story/route.tsx"
git commit -m "feat(marketing): refonte qualite du visuel story boutique"
```

---

### Task 8: Vérification finale de branche

**Files:** aucun fichier modifié — vérification uniquement.

**Interfaces:** aucune (task de vérification transverse).

- [ ] **Step 1: Compilation TypeScript complète**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0, aucune erreur.

- [ ] **Step 2: Vérification syntaxique backend**

Run: `node --check backend/migrate-inline.js && node --check backend/routes/boutiques.js`
Expected: aucune sortie, exit code 0.

- [ ] **Step 3: Revue de cohérence contre la spec**

Relire `docs/superpowers/specs/2026-07-18-marketing-boutique-facilitation-design.md` et confirmer pour chacun des 5 points :
1. Partage produit 1-clic WhatsApp + message enrichi promo — Task 3+4.
2. Traçage `partage_le` — Task 1, 2, 4.
3. Bandeau conseils & rappels actionnable — Task 6.
4. Carte boutique suit la même simplification (pas de fonctionnalité séparée) — Task 5 (vérification, pas de code).
5. Refonte visuelle story boutique — Task 7.

Confirmer qu'aucun template de texte à copier-coller n'a été ajouté nulle part, et qu'aucun nouveau canal (Facebook/Instagram) n'a été introduit dans `BoutonPartager`.

- [ ] **Step 4: Parcours manuel complet en local**

Avec le dev server actif et un compte boutique de test ayant plusieurs produits (certains avec `prix_barre`, certains sans) :
1. Onglet Marketing → bandeau conseils visible et correct.
2. Clic "Voir ces produits →" → bascule Catalogue avec filtre appliqué.
3. Partage d'un produit en promo → message enrichi, `partage_le` mis à jour.
4. Partage de la carte boutique et de la carte assistant WhatsApp → 1 clic, pas de menu intermédiaire.
5. Visuel story boutique → qualité visuelle satisfaisante, infos boutique visibles.

- [ ] **Step 5: Commit final si des ajustements ont été faits pendant la vérification**

```bash
git add -A
git commit -m "fix: ajustements suite a la verification finale marketing boutique"
```

(Ne committer que s'il y a effectivement des changements — `git status` doit montrer des fichiers modifiés avant ce commit.)
