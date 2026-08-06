import type { Metadata } from 'next'
import Link from 'next/link'
import SearchBar from './SearchBar'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}
import ProduitsListe from './ProduitsListe'
import RecentlyViewed from './RecentlyViewed'
import CompareFilterBanner from '@/components/CompareFilterBanner'
import ShowcaseTabs from './ShowcaseTabs'

export const metadata: Metadata = {
  title: 'Comparateur de prix au Sénégal · Dakar',
  description:
    'Nopalou est le comparateur de prix N°1 au Sénégal. Trouvez le prix le moins cher pour vos achats à Dakar : téléphones, TV, électroménager, informatique. Gratuit et mis à jour toutes les 6h.',
  keywords: [
    'comparateur de prix Sénégal', 'comparateur prix Dakar', 'prix moins cher Sénégal',
    'meilleur prix Dakar', 'comparer prix Sénégal', 'achat pas cher Dakar',
    'prix téléphone Sénégal', 'prix TV Dakar', 'Nopalou',
  ],
}

import { CATEGORIES as LIB_CATEGORIES } from '@/lib/categories'

const CATEGORIES = LIB_CATEGORIES.map(c => ({
  slug: c.value,
  label: c.label.replace(/^.*? /, ''), // Remove emoji
  emoji: c.label.split(' ')[0]
}))
CATEGORIES.push({ slug: 'telecom', label: 'Télécom & Forfaits', emoji: '📡' })

const BUDGETS = [
  { label: '< 5 000',    prixMax: '5000'   },
  { label: '5k – 15k',   prixMax: '15000'  },
  { label: '15k – 50k',  prixMax: '50000'  },
  { label: '50k – 100k', prixMax: '100000' },
  { label: '+ 100 000',  prixMax: ''       },
]

const TRIS = [
  { val: '',          label: '⭐ Pertinence' },
  { val: 'prix_asc',  label: '💰 Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
  { val: 'populaire', label: '🔥 Populaires' },
  { val: 'nom_asc',   label: 'Nom A-Z' },
]

interface Produit {
  id: number
  nom: string
  marque: string | null
  categorie: string | null
  prix_min: number | null
  prix_max: number | null
  nb_offres: number | null
  image_url: string | null
}

interface ApiResponse {
  produits?: Produit[]
  data?: Produit[]
  total?: number
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categorie?: string; prixMax?: string; page?: string; tri?: string; sousType?: string }> | { q?: string; categorie?: string; prixMax?: string; page?: string; tri?: string; sousType?: string }
}) {
  const sp        = await Promise.resolve(searchParams)
  const q         = sp?.q         ?? ''
  const categorie = sp?.categorie ?? ''
  const prixMax   = sp?.prixMax   ?? ''
  const page      = sp?.page      ?? '1'
  const tri       = sp?.tri       ?? ''
  const sousType  = sp?.sousType  ?? ''

  let produits: Produit[] = []
  let total               = 0
  let erreur: string | null = null

  try {
    const params = new URLSearchParams({ limit: '24', page })
    if (q)         params.set('q',         q)
    if (categorie) params.set('categorie', categorie)
    if (prixMax)   params.set('prixMax',   prixMax)
    if (tri)       params.set('tri',       tri)
    if (sousType)  params.set('sousType',  sousType)

    const url = `${BACKEND}/api/produits?${params}`
    let r: Response
    try {
      r = await fetch(url, { cache: 'no-store', headers: SSR_HEADERS })
    } catch {
      const fallbackUrl = url.includes('127.0.0.1')
        ? url.replace('127.0.0.1', 'localhost')
        : url.replace('localhost', '127.0.0.1')
      r = await fetch(fallbackUrl, { cache: 'no-store', headers: SSR_HEADERS })
    }
    if (!r.ok) throw new Error(`API produits → ${r.status}`)
    const data: ApiResponse | Produit[] = await r.json()
    if (Array.isArray(data)) {
      produits = data
      total    = data.length
    } else {
      produits = data.produits ?? data.data ?? []
      total    = data.total ?? produits.length
    }
  } catch (e) {
    erreur = e instanceof Error ? e.message : 'Erreur inconnue'
  }

  const hasFiltre = q || categorie || prixMax || sousType

  let settings: Record<string, string> = {}
  let categoriesActives: string[] | null = null
  try {
    const [rSettings, rCat] = await Promise.all([
      fetch(`${BACKEND}/api/settings/public`, { cache: 'no-store', headers: SSR_HEADERS }).catch(() => null),
      fetch(`${BACKEND}/api/produits/categories-actives`, { cache: 'no-store', headers: SSR_HEADERS }).catch(() => null)
    ])
    if (rSettings && rSettings.ok) settings = await rSettings.json()
    if (rCat && rCat.ok) {
      categoriesActives = await rCat.json()
      // Always include 'mixte' if it's not present, or maybe it's not needed if we filter by slug
    }
  } catch {
    // valeurs par défaut ci-dessous
  }
  const prixPro = Number(settings.plan_pro_prix) || 15000;
  const prixBusiness = Number(settings.plan_business_prix) || 35000;
  const prixTafTaf = Number(settings.plan_taftaf_prix) || 2500;

  return (
    <>
      {/* ── HERO HOME ÉPURÉ & MODERNE (NOPALOU BRAND SYSTEM) ────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #fff7ed 100%)',
        borderBottom: '1px solid #fed7aa',
        padding: '24px 20px 16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Layout en 3 colonnes pour utiliser l'espace Desktop (Gauche, Centre, Droite) */}
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 40, position: 'relative', zIndex: 2 }}>
          
          {/* COLONNE GAUCHE (Desktop seulement) */}
          <div className="hero-side-card" style={{ flex: '1 1 250px', maxWidth: 300, textAlign: 'left', background: '#fff', padding: 20, borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 24, marginBottom: 8, color: '#25D366' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.22 5.22 0 0 0-.571-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Commandez sur WhatsApp</h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5, marginBottom: 16 }}>Trouvez le produit et passez commande directement au vendeur en un clic.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#25D366' }}>✓</span> Sans inscription
              </li>
              <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#25D366' }}>✓</span> Contact direct vendeur
              </li>
              <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#25D366' }}>✓</span> Suivi de livraison en temps réel
              </li>
            </ul>

            <Link href="/assistant-whatsapp" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, fontWeight: 800, color: '#25D366', textDecoration: 'none' }}>Comment ça marche ? →</Link>
          </div>

          {/* COLONNE CENTRALE */}
          <div style={{ flex: '2 1 600px', maxWidth: 900 }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff7ed', color: '#c75b00', padding: '4px 14px', borderRadius: 30,
            fontSize: 11, fontWeight: 800, marginBottom: 8, border: '1px solid #ffedd5',
          }}>
            <span>✨ Comparateur N°1 de prix & vendeurs au Sénégal</span>
          </div>

          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Comparez les prix & trouvez les meilleurs vendeurs au <span style={{ color: '#C75B00' }}>Sénégal</span>
          </h1>

          <p style={{ fontSize: 15, color: '#475569', margin: '0 auto 16px', maxWidth: 640, lineHeight: 1.5 }}>
            Accédez instantanément à des milliers de produits, téléphones, électroménager et boutiques vérifiées à Dakar et dans toutes les régions.
          </p>

          {/* BARRE DE RECHERCHE PRINCIPALE */}
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <SearchBar defaultValue={q} />
          </div>

          </div>

          {/* COLONNE DROITE (Desktop seulement) */}
          <div className="hero-side-card" style={{ flex: '1 1 250px', maxWidth: 300, textAlign: 'left', background: '#0f172a', padding: 20, borderRadius: 16, color: '#f8fafc', border: '1px solid #1e293b', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div><span style={{ display: 'inline-block', background: 'rgba(199,91,0,0.2)', color: '#fed7aa', padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 800, marginBottom: 12, border: '1px solid rgba(199,91,0,0.3)' }}>🚀 NOUVEAU</span></div>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 6, color: '#fff' }}>Boutique Taf Taf</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.4 }}>Créez votre boutique complète en 30 secondes chrono pour {prixTafTaf} FCFA !</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                <span style={{ color: '#C75B00' }}>✓</span> Lien personnalisé (nopalou.com/shop)
              </li>
              <li style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                <span style={{ color: '#C75B00' }}>✓</span> Gestionnaire de commandes Web
              </li>
              <li style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                <span style={{ color: '#C75B00' }}>✓</span> Plus de visibilité sur Nopalou
              </li>
            </ul>

            <Link href="/creer-boutique" style={{ display: 'block', textAlign: 'center', background: '#C75B00', color: '#fff', fontWeight: 800, fontSize: 13, padding: '10px', borderRadius: 8, textDecoration: 'none', marginTop: 16, boxShadow: '0 4px 12px rgba(199,91,0,0.2)', transition: 'background 0.2s' }}>Créer ma vitrine →</Link>
          </div>

        </div>

        {/* CATÉGORIES EN PILULES FLUIDES (Pleine largeur, sous la grille 3-colonnes) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1000, margin: '16px auto 0', position: 'relative', zIndex: 2 }}>
          {CATEGORIES.map((c) => {
            if (categoriesActives !== null && !categoriesActives.includes(c.slug) && c.slug !== 'telecom') {
              return null;
            }
            const isSelected = categorie === c.slug
            if (c.slug === 'telecom') {
              return (
                <Link key={c.slug} href="/telecom" className={`categ-pill${isSelected ? ' active' : ''}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  background: '#fff', color: '#334155', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}>
                  <span>{c.emoji}</span> <span>{c.label}</span>
                </Link>
              )
            }
            return (
              <Link
                key={c.slug}
                href={isSelected ? '/' : `/?categorie=${c.slug}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13,
                  fontWeight: isSelected ? 800 : 600, textDecoration: 'none',
                  background: isSelected ? '#C75B00' : '#fff',
                  color: isSelected ? '#fff' : '#334155',
                  border: isSelected ? '1px solid #C75B00' : '1px solid #e2e8f0',
                  boxShadow: isSelected ? '0 4px 12px rgba(199,91,0,0.22)' : '0 2px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{c.emoji}</span> <span>{c.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── CONTENU PRINCIPAL & RÉSULTATS DIRECTS ──────────────────── */}
      <main className="page-container" style={{ maxWidth: 1440, paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
        
        {/* BANDEAU FEEDBACK RECHERCHE & CONFIRMATION DES RÉSULTATS */}
        {hasFiltre && (
          <div style={{
            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16,
            padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(199,91,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>🔎</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  {total > 0 ? `${total} produit${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}` : 'Aucun produit trouvé'}
                  {q ? ` pour "${q}"` : ''}
                  {categorie ? ` — Catégorie : ${CATEGORIES.find(c => c.slug === categorie)?.label || categorie}` : ''}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Résultats actualisés en temps réel.
                </p>
              </div>
            </div>

            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff', color: '#dc2626',
                border: '1px solid #fca5a5', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 800,
                textDecoration: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              <span>Réinitialiser les filtres</span>
              <span>✕</span>
            </Link>
          </div>
        )}

        {/* ── BARRE DE FILTRES EN 2 LIGNES STRICTES ────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          
          {/* LIGNE 1 : Budget, État, Bouton Boutique */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            {/* 1. Budget */}
            <div className="filtres-bar" style={{ margin: 0 }}>
              <span className="filtres-label">Budget :</span>
              {BUDGETS.map((b) => {
                const ps = new URLSearchParams()
                if (q)         ps.set('q',         q)
                if (categorie) ps.set('categorie', categorie)
                if (b.prixMax) ps.set('prixMax',   b.prixMax)
                return (
                  <Link key={b.label} href={`/?${ps}`} className={`budget-pill${prixMax === b.prixMax && b.prixMax ? ' active' : ''}`}>
                    {b.label}
                  </Link>
                )
              })}
            </div>

            {/* 2. État */}
            <div className="filtres-bar hidden-mobile" style={{ margin: 0 }}>
              <span className="filtres-label">État :</span>
              <span className="budget-pill active" style={{ cursor: 'pointer' }}>Tout</span>
              <span className="budget-pill" style={{ cursor: 'pointer', opacity: 0.8 }}>Neuf</span>
              <span className="budget-pill" style={{ cursor: 'pointer', opacity: 0.8 }}>Occasion</span>
            </div>

            {/* Espace flexible */}
            <div style={{ flex: '1 1 auto' }} className="hidden-mobile" />

            {/* 3. Bouton Boutique (Unique bouton très mis en valeur) */}
            <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="/creer-boutique" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: '#fff', padding: '10px 20px', borderRadius: 30, fontSize: 13, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
                <span style={{ color: '#C75B00', fontSize: 16 }}>⚡</span>
                Ouvrir une Boutique Pro
              </Link>
            </div>
          </div>

          {/* LIGNE 2 : Trier, Tendances, Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            {/* 4. Trier */}
            <div className="filtres-bar" style={{ margin: 0 }}>
              <span className="filtres-label">Trier :</span>
              {TRIS.map((t) => {
                const ps = new URLSearchParams()
                if (q)         ps.set('q',         q)
                if (categorie) ps.set('categorie', categorie)
                if (prixMax)   ps.set('prixMax',   prixMax)
                if (t.val)     ps.set('tri',       t.val)
                return (
                  <Link key={t.val || 'defaut'} href={`/?${ps}`} className={`budget-pill${tri === t.val ? ' active' : ''}`}>
                    {t.label}
                  </Link>
                )
              })}
            </div>

            {/* 5. Tendances */}
            <div className="filtres-bar hidden-mobile" style={{ margin: 0 }}>
              <span className="filtres-label" style={{ color: '#C75B00' }}>🔥 Tendances :</span>
              <Link href="/?q=iphone" className="budget-pill">iPhone 15</Link>
              <Link href="/?q=climatiseur" className="budget-pill">Climatiseurs</Link>
              <Link href="/?q=samsung" className="budget-pill">Samsung S24</Link>
            </div>

            <div style={{ flex: '1 1 auto' }} className="hidden-mobile" />

            {/* Actions secondaires */}
            <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {(q || categorie || prixMax || sousType) ? (
                <Link href="/" className="budget-pill" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2', margin: 0 }}>
                  <span>✖</span> Effacer filtres
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* GRILLE DES PRODUITS IMMÉDIATE */}
        <CompareFilterBanner />
        <ProduitsListe
          key={`${q}-${categorie}-${prixMax}-${tri}-${sousType}`}
          initialProduits={produits}
          total={total}
          q={q}
          categorie={categorie}
          prixMax={prixMax}
          tri={tri}
          sousType={sousType}
        />
        {/* SECTION DES 3 FORMULES & TARIFS DE MARQUE */}
        <ShowcaseTabs prixTafTaf={prixTafTaf} prixPro={prixPro} prixBusiness={prixBusiness} />

        {/* PRODUITS RÉCEMMENT CONSULTÉS */}
        <RecentlyViewed />
      </main>

      {/* ── Bloc SEO (MODERNISÉ, SANS BOÎTE) ─────────────────────────────────────────────── */}
      {!hasFiltre && (
        <section style={{ maxWidth: 1280, margin: '0 auto 32px', padding: '0 20px' }}>
          
          {/* En-tête de section épuré */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ display: 'inline-block', background: '#fff7ed', color: '#C75B00', padding: '6px 16px', borderRadius: 30, fontSize: 12, fontWeight: 800, marginBottom: 12, border: '1px solid #fed7aa' }}>
              6800+ produits · mis à jour toutes les 6h
            </span>
            <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Le comparateur de prix N°1 au <span style={{ color: '#C75B00' }}>Sénégal</span>
            </h2>
          </div>

          {/* Grille de texte moderne */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 48 }}>
            <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15,23,42,0.03)' }}>
              <span style={{ fontSize: 32, marginBottom: 16, display: 'block' }}>📊</span>
              <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                <strong>Nopalou</strong> est le premier comparateur de prix dédié au marché sénégalais. Vous cherchez le <strong>prix le moins cher</strong> pour un téléphone, une télévision, un réfrigérateur ou un ordinateur ? Nopalou compare en temps réel les prix de milliers de produits chez tous les grands marchands en ligne au Sénégal.
              </p>
            </div>
            
            <div style={{ background: '#ffffff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15,23,42,0.03)' }}>
              <span style={{ fontSize: 32, marginBottom: 16, display: 'block' }}>📍</span>
              <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.7 }}>
                Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis, Ziguinchor ou Kaolack — trouvez le meilleur prix avant d&apos;acheter. Nos prix sont mis à jour automatiquement toutes les 6 heures depuis Jumia, Expat-Dakar, CoinAfrique et d&apos;autres. <strong>Gratuit, sans inscription, sans pub.</strong>
              </p>
            </div>
          </div>

          <p className="chip-row-label">Comparer par catégorie</p>
            <div className="chip-row">
              {CATEGORIES.filter(c => c.slug !== 'telecom').map(c => (
                <Link key={c.slug} href={`/categorie/${c.slug}`} className="chip">
                  <span className="chip-em">{c.emoji}</span>
                  {c.label}
                </Link>
              ))}
            </div>

            <p className="chip-row-label">Recherches populaires à Dakar</p>
            <div className="chip-row">
              {[
                { href: '/categorie/tv-electro/climatiseurs', label: 'Climatiseur prix Dakar', emoji: '❄️' },
                { href: '/categorie/smartphones/iphone', label: 'iPhone prix Dakar', emoji: '📱' },
                { href: '/categorie/smartphones/samsung', label: 'Samsung Galaxy prix Dakar', emoji: '📱' },
                { href: '/categorie/tv-electro/televiseurs', label: 'TV prix Dakar', emoji: '📺' },
                { href: '/categorie/tv-electro/refrigerateurs', label: 'Frigo prix Dakar', emoji: '🧊' },
                { href: '/categorie/informatique/ordinateurs', label: 'Ordinateur portable prix Dakar', emoji: '💻' },
                { href: '/immo/location-appartement-dakar', label: 'Location appartement Dakar', emoji: '🏢' },
                { href: '/immo/location-chambre-dakar', label: 'Chambre à louer Dakar', emoji: '🛏️' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="chip chip-small">
                  <span className="chip-em">{l.emoji}</span>
                  {l.label}
                </Link>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40, padding: 16, background: '#f8fafc', borderRadius: 12, color: '#64748b', fontSize: 13, border: '1px solid #e2e8f0' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: '50%', marginRight: 8 }} />
              Prix vérifiés automatiquement toutes les 6 heures sur tous les grands marchands sénégalais
            </div>
        </section>
      )}
    </>
  )
}
