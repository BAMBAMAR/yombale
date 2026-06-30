import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fcfa } from '@/lib/format'
import CardActions from '@/app/CardActions'

export const dynamic = 'force-dynamic'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

// ── Données SEO par catégorie ────────────────────────────────────────

const CATEGORIES: Record<string, {
  label: string
  h1: string
  intro: string
  description: string
  keywords: string[]
  emoji: string
  exemples: string
}> = {
  smartphones: {
    label: 'Téléphones & Smartphones',
    emoji: '📱',
    h1: 'Téléphones & Smartphones au Sénégal',
    intro: 'Comparez les prix de smartphones et téléphones portables chez tous les marchands du Sénégal. Samsung, iPhone, Infinix, Tecno, Xiaomi — trouvez le meilleur prix à Dakar et dans tout le pays sans vous déplacer.',
    description: 'Comparez les prix de smartphones et téléphones portables au Sénégal. Samsung, iPhone, Infinix, Xiaomi — les meilleures offres à Dakar et partout au Sénégal.',
    keywords: [
      'smartphone Sénégal', 'téléphone Dakar', 'prix téléphone Sénégal', 'Samsung Dakar', 'iPhone Sénégal', 'Infinix prix Dakar', 'Tecno Sénégal', 'Xiaomi Dakar',
      'Téléphone 20000 FCFA', 'Jumia Promo Téléphone', 'Téléphone de 30000 FCFA', 'Téléphone moins cher Dakar',
      'Téléphone portable prix Sénégal', 'Téléphone 40000 FCFA', 'Téléphone 10000 FCFA', 'Promo téléphone Orange Senegal',
    ],
    exemples: 'Samsung Galaxy, iPhone, Infinix, Tecno, Xiaomi',
  },
  informatique: {
    label: 'Informatique & Ordinateurs',
    emoji: '💻',
    h1: 'Ordinateurs & Informatique au Sénégal',
    intro: 'Comparez les prix d\'ordinateurs portables, PC de bureau, tablettes, imprimantes et accessoires informatiques au Sénégal. Les meilleures offres HP, Dell, Lenovo, Asus à Dakar et dans tout le pays.',
    description: 'Comparez les prix d\'ordinateurs portables et matériel informatique au Sénégal. HP, Dell, Lenovo — les meilleures offres à Dakar.',
    keywords: ['ordinateur portable Dakar', 'PC Sénégal', 'laptop prix Dakar', 'informatique Sénégal', 'tablette Dakar', 'HP Sénégal', 'Dell Dakar', 'Lenovo Sénégal'],
    exemples: 'Laptops HP, Dell, Lenovo, tablettes Samsung',
  },
  'tv-electro': {
    label: 'Télévisions & Électroménager',
    emoji: '📺',
    h1: 'Télévisions & Électroménager au Sénégal',
    intro: 'Comparez les prix de télévisions, réfrigérateurs, climatiseurs, machines à laver et tout l\'électroménager au Sénégal. Samsung, LG, Hisense, TCL — les meilleures offres TV et électro à Dakar.',
    description: 'Comparez les prix de télévisions et électroménager au Sénégal. TV Samsung, LG, Hisense — réfrigérateurs, climatiseurs, les meilleures offres à Dakar.',
    keywords: [
      'télévision Dakar', 'TV Sénégal', 'réfrigérateur Dakar', 'électroménager Sénégal', 'climatiseur Dakar', 'Samsung TV Sénégal', 'LG prix Dakar', 'Hisense Sénégal', 'machine à laver Dakar',
      'TV Smart 43 pouces Prix Dakar', 'Smart TV 32 pouces Prix Sénégal', 'Télévision Smart TV 32', 'Smart TV prix Sénégal',
      'Jumia TV 43 Pouces', 'Télévision Dakar', 'Télévision Smart TV 43 pouces', 'Jumia TV 32 Pouces',
      'Prix Frigo Sénégal', 'Prix frigo Samsung Sénégal', 'Jumia Frigo Prix', 'Frigo congélateur prix',
      'Prix Frigo ASTECH', 'Frigo deux portes prix', 'Frigo Bar prix Dakar', 'Jumia Frigo bar Prix',
      'Climatiseur 1.5CV prix Dakar', 'Climatiseur 2 chevaux prix Dakar', 'Prix Climatiseur Samsung Sénégal',
      'Climatiseur Inverter 1.5CV prix Dakar', 'Climatiseur 1 CV prix', 'Climatiseur Dakar prix',
      'Climatiseur Inverter prix Dakar', 'Climatiseur Beko Dakar prix',
    ],
    exemples: 'TV Samsung, LG, Hisense, réfrigérateurs, climatiseurs',
  },
  mode: {
    label: 'Mode & Vêtements',
    emoji: '👗',
    h1: 'Mode & Vêtements au Sénégal',
    intro: 'Découvrez et comparez les prix de vêtements, chaussures, sacs et accessoires de mode au Sénégal. Les meilleures offres shopping en ligne à Dakar.',
    description: 'Comparez les prix de vêtements et accessoires de mode au Sénégal. Les meilleures offres à Dakar et partout au Sénégal.',
    keywords: ['mode Dakar', 'vêtements Sénégal', 'shopping Dakar', 'chaussures Dakar', 'mode Sénégal'],
    exemples: 'Vêtements, chaussures, sacs, accessoires',
  },
  maison: {
    label: 'Maison & Décoration',
    emoji: '🏠',
    h1: 'Maison & Décoration au Sénégal',
    intro: 'Comparez les prix de meubles, articles de décoration intérieure et équipements pour la maison au Sénégal. Trouvez les meilleures offres à Dakar et dans toutes les villes.',
    description: 'Comparez les prix de meubles et décoration pour la maison au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['meubles Dakar', 'décoration maison Sénégal', 'ameublement Dakar', 'maison Sénégal', 'mobilier Dakar'],
    exemples: 'Meubles, canapés, décoration, cuisine',
  },
  'auto-moto': {
    label: 'Auto & Moto',
    emoji: '🚗',
    h1: 'Auto & Moto au Sénégal',
    intro: 'Comparez les prix de pièces automobiles, accessoires moto, pneus et équipements pour voitures au Sénégal. Les meilleures offres pour votre véhicule à Dakar.',
    description: 'Comparez les prix de pièces auto et accessoires moto au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['pièces auto Dakar', 'moto Sénégal', 'accessoires voiture Dakar', 'auto Sénégal', 'pneus Dakar'],
    exemples: 'Pièces auto, accessoires, pneus, équipement moto',
  },
  jeux: {
    label: 'Jeux Vidéo & Consoles',
    emoji: '🎮',
    h1: 'Jeux Vidéo & Consoles au Sénégal',
    intro: 'Comparez les prix de jeux vidéo, consoles PlayStation, Xbox, Nintendo Switch et accessoires gaming au Sénégal. Les meilleures offres gaming à Dakar.',
    description: 'Comparez les prix de jeux vidéo et consoles gaming au Sénégal. PlayStation, Xbox, Nintendo — les meilleures offres à Dakar.',
    keywords: ['PlayStation Dakar', 'jeux vidéo Sénégal', 'console jeux Dakar', 'Xbox Sénégal', 'Nintendo Dakar', 'gaming Sénégal'],
    exemples: 'PlayStation, Xbox, Nintendo Switch, manettes, jeux',
  },
  beaute: {
    label: 'Beauté & Santé',
    emoji: '💄',
    h1: 'Beauté & Cosmétiques au Sénégal',
    intro: 'Comparez les prix de cosmétiques, parfums, produits de soin beauté et articles de santé au Sénégal. Les meilleures offres beauté à Dakar et dans tout le pays.',
    description: 'Comparez les prix de cosmétiques et produits beauté au Sénégal. Les meilleures offres à Dakar.',
    keywords: ['cosmétiques Dakar', 'beauté Sénégal', 'parfum Dakar', 'soin beauté Sénégal', 'maquillage Dakar'],
    exemples: 'Parfums, cosmétiques, soins, maquillage',
  },
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

interface Produit {
  id: string
  nom: string
  marque: string | null
  prix_min: number | null
  nb_offres: number | null
  image_url: string | null
  categorie_nom: string | null
}

interface ApiResponse {
  produits?: Produit[]
  data?: Produit[]
  total?: number
}

// ── generateMetadata ─────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const cat = CATEGORIES[params.slug]
  if (!cat) return { title: 'Catégorie introuvable' }

  return {
    title: `${cat.label} au Sénégal — Comparer les prix | Nopalou`,
    description: cat.description,
    keywords: cat.keywords,
    openGraph: {
      title: `${cat.label} au Sénégal — Nopalou`,
      description: cat.description,
      type: 'website',
      url: `${BASE}/categorie/${params.slug}`,
    },
    alternates: {
      canonical: `${BASE}/categorie/${params.slug}`,
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────

export default async function CategoriePage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { page?: string; prixMax?: string; tri?: string }
}) {
  const cat = CATEGORIES[params.slug]
  if (!cat) notFound()

  const page   = searchParams.page   ?? '1'
  const prixMax = searchParams.prixMax ?? ''
  const tri    = searchParams.tri    ?? 'pertinence'

  const qs = new URLSearchParams({ limit: '24', page, categorie: params.slug })
  if (prixMax) qs.set('prixMax', prixMax)
  if (tri !== 'pertinence') qs.set('tri', tri)

  let produits: Produit[] = []
  let total = 0
  let pages = 1

  try {
    const res  = await fetch(`${BACKEND}/api/produits?${qs}`, { cache: 'no-store' })
    if (res.ok) {
      const data: ApiResponse = await res.json()
      produits = data.produits ?? data.data ?? []
      total    = data.total ?? produits.length
      pages    = Math.ceil(total / 24) || 1
    }
  } catch {
    // empty state
  }

  const currentPage = Number(page)

  function buildLink(p: Record<string, string>) {
    const ps = new URLSearchParams()
    if (prixMax) ps.set('prixMax', prixMax)
    if (tri !== 'pertinence') ps.set('tri', tri)
    Object.entries(p).forEach(([k, v]) => (v ? ps.set(k, v) : ps.delete(k)))
    const qs2 = ps.toString()
    return `/categorie/${params.slug}${qs2 ? `?${qs2}` : ''}`
  }

  // JSON-LD BreadcrumbList + ItemList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: BASE },
      { '@type': 'ListItem', position: 2, name: cat.label, item: `${BASE}/categorie/${params.slug}` },
    ],
  }

  const itemListJsonLd = produits.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cat.h1,
    description: cat.description,
    numberOfItems: total,
    itemListElement: produits.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE}/produit/${p.id}`,
      name: p.nom,
    })),
  } : null

  const TRIS = [
    { val: 'pertinence', label: 'Pertinence' },
    { val: 'prix_asc',   label: 'Prix ↑' },
    { val: 'prix_desc',  label: 'Prix ↓' },
  ]

  const BUDGETS = [
    { label: '< 5 000',    val: '5000'   },
    { label: '< 15 000',   val: '15000'  },
    { label: '< 50 000',   val: '50000'  },
    { label: '< 150 000',  val: '150000' },
    { label: '< 500 000',  val: '500000' },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <div className="page-container" style={{ paddingTop: '1.5rem' }}>

        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          <Link href="/" style={{ color: 'var(--text2)' }}>Accueil</Link>
          {' › '}
          <span style={{ color: 'var(--text1)' }}>{cat.label}</span>
        </nav>

        {/* En-tête SEO */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2, marginBottom: 10 }}>
            {cat.emoji} {cat.h1}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 720 }}>
            {cat.intro}
          </p>
          {total > 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
              <strong style={{ color: 'var(--accent)' }}>{total.toLocaleString('fr-FR')} produit{total > 1 ? 's' : ''}</strong> comparés au Sénégal · Prix mis à jour toutes les 6h
            </p>
          )}
        </div>

        {/* Filtres */}
        <div className="filtres-bar" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <span className="filtres-label">Budget :</span>
          {BUDGETS.map(b => (
            <Link
              key={b.val}
              href={buildLink({ prixMax: prixMax === b.val ? '' : b.val, page: '1' })}
              className={`budget-pill${prixMax === b.val ? ' active' : ''}`}
            >
              {b.label}
            </Link>
          ))}
          {prixMax && (
            <Link href={buildLink({ prixMax: '', page: '1' })} className="budget-pill budget-pill--reset">
              ✕ Budget
            </Link>
          )}
          <span style={{ marginLeft: 8, color: 'var(--text3)', fontSize: 13 }}>Trier :</span>
          {TRIS.map(t => (
            <Link
              key={t.val}
              href={buildLink({ tri: t.val, page: '1' })}
              className={`budget-pill${tri === t.val ? ' active' : ''}`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Grille produits */}
        {produits.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>{cat.emoji}</span>
            <p>Aucun produit disponible dans cette catégorie pour l&apos;instant.</p>
            <Link href="/" className="budget-pill active" style={{ marginTop: 12 }}>
              Voir tous les produits
            </Link>
          </div>
        ) : (
          <div className="grid-produits">
            {produits.map(p => (
              <Link key={p.id} href={`/produit/${p.id}`} style={{ display: 'contents' }}>
                <article className="card-produit">
                  <div className="card-img">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.nom} loading="lazy" />
                    ) : (
                      <span className="card-img-placeholder">{cat.emoji}</span>
                    )}
                  </div>
                  {p.marque && <p className="marque">{p.marque}</p>}
                  <p className="nom">{p.nom}</p>
                  <p className="prix">{p.prix_min ? fcfa(p.prix_min) : 'Prix sur demande'}</p>
                  {p.nb_offres != null && p.nb_offres > 1 && (
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      {p.nb_offres} offres
                    </p>
                  )}
                  <CardActions id={p.id} nom={p.nom} />
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            {currentPage > 1 && (
              <Link href={buildLink({ page: String(currentPage - 1) })} className="page-btn">
                ← Précédent
              </Link>
            )}
            <span className="page-info">Page {currentPage} / {pages}</span>
            {currentPage < pages && (
              <Link href={buildLink({ page: String(currentPage + 1) })} className="page-btn">
                Suivant →
              </Link>
            )}
          </div>
        )}

        {/* Bloc texte SEO en bas */}
        <div style={{
          marginTop: 48, padding: '24px 28px',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, maxWidth: 720,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
            Pourquoi comparer les prix {cat.label.toLowerCase()} sur Nopalou ?
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
            Nopalou est le premier comparateur de prix dédié au marché sénégalais.
            Nous indexons les prix de {cat.exemples} chez tous les grands marchands en ligne du Sénégal — Jumia, Expat-Dakar, CoinAfrique et bien d&apos;autres.
            Les prix sont mis à jour automatiquement toutes les 6 heures.
            Que vous soyez à <strong>Dakar</strong>, Thiès, Saint-Louis ou Ziguinchor, trouvez le meilleur prix avant d&apos;acheter.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <Link href="/" className="budget-pill active">Tous les produits</Link>
            {Object.entries(CATEGORIES)
              .filter(([s]) => s !== params.slug)
              .slice(0, 4)
              .map(([s, c]) => (
                <Link key={s} href={`/categorie/${s}`} className="budget-pill">
                  {c.emoji} {c.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
