import type { Metadata } from 'next'
import Link from 'next/link'
import { cloudinaryHQ } from '@/lib/cloudinary'
import CardActions from '@/app/CardActions'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}

const CATEGORIES = [
  { slug: '',              label: 'Toutes',       emoji: '🗂' },
  { slug: 'smartphones',  label: 'Téléphones',   emoji: '📱' },
  { slug: 'informatique', label: 'Informatique', emoji: '💻' },
  { slug: 'tv-electro',   label: 'TV & Électro', emoji: '📺' },
  { slug: 'mode',         label: 'Mode',         emoji: '👗' },
  { slug: 'maison',       label: 'Maison',       emoji: '🏠' },
  { slug: 'auto-moto',    label: 'Auto & Moto',  emoji: '🚗' },
  { slug: 'jeux',         label: 'Jeux',         emoji: '🎮' },
  { slug: 'services',     label: 'Services',     emoji: '🛠' },
]

const TRIS = [
  { val: '',          label: 'Récent' },
  { val: 'prix_asc',  label: 'Prix ↑' },
  { val: 'prix_desc', label: 'Prix ↓' },
]

const PRIX_MAX = [
  { label: '< 10k',  val: '10000'   },
  { label: '< 50k',  val: '50000'   },
  { label: '< 100k', val: '100000'  },
  { label: '< 500k', val: '500000'  },
]

const VILLES_SN = ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Thiès', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Touba']

const SOURCES = [
  { val: '',         label: 'Toutes les sources' },
  { val: 'manuel',   label: 'Publiées sur Nopalou' },
  { val: 'facebook', label: 'Importées de Facebook' },
]

interface Annonce {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  categorie_slug: string
  photos: string[]
  contact_nom: string | null
  contact_tel: string
  created_at: string
}

async function fetchAnnonces(
  categorie: string, page: number, tri: string,
  q: string, prixMax: string, ville: string, source: string
) {
  const params = new URLSearchParams({ limit: '24', page: String(page) })
  if (categorie) params.set('categorie', categorie)
  if (tri)       params.set('tri', tri)
  if (q)         params.set('q', q)
  if (prixMax)   params.set('prixMax', prixMax)
  if (ville)     params.set('ville', ville)
  if (source)    params.set('source', source)
  try {
    const r = await fetch(`${BACKEND}/api/annonces?${params}`, { headers: SSR_HEADERS, next: { revalidate: 60 } })
    if (!r.ok) return { annonces: [], total: 0 }
    return r.json()
  } catch { return { annonces: [], total: 0 } }
}

function formatPrix(p: number | null) {
  if (!p) return 'Prix à négocier'
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

function formatDate(s: string) {
  const d = new Date(s)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('fr-SN', { day: '2-digit', month: 'short' })
}

function catLabel(slug: string) {
  return CATEGORIES.find(c => c.slug === slug)?.label ?? slug
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ categorie?: string }> }): Promise<Metadata> {
  const { categorie } = await searchParams
  const cat = CATEGORIES.find(c => c.slug === (categorie ?? ''))
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
  const titre = cat && cat.slug ? `Annonces ${cat.label} — Nopalou` : 'Annonces au Sénégal — Nopalou'
  const desc = cat && cat.slug
    ? `Petites annonces ${cat.label} entre particuliers au Sénégal — téléphones, voitures, électro, mode et plus.`
    : 'Achetez et vendez entre particuliers au Sénégal. Téléphones, informatique, mode, maison, auto, services.'
  return {
    title: titre,
    description: desc,
    alternates: { canonical: `${BASE}/annonces` },
    openGraph: {
      title: titre,
      description: desc,
      type: 'website',
      images: [{ url: '/api/og-image', width: 1200, height: 630, alt: titre }],
    },
  }
}

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{
    categorie?: string; page?: string; tri?: string
    q?: string; prixMax?: string; ville?: string; source?: string
  }>
}) {
  const {
    categorie = '', page: pageStr = '1', tri = '',
    q = '', prixMax = '', ville = '', source = '',
  } = await searchParams
  const page = Math.max(1, parseInt(pageStr))

  const { annonces, total } = await fetchAnnonces(categorie, page, tri, q, prixMax, ville, source)

  const totalPages = Math.ceil(total / 24)
  const catActuelle = CATEGORIES.find(c => c.slug === categorie) ?? CATEGORIES[0]

  function buildLink(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    if (categorie) params.set('categorie', categorie)
    if (tri)       params.set('tri', tri)
    if (q)         params.set('q', q)
    if (prixMax)   params.set('prixMax', prixMax)
    if (ville)     params.set('ville', ville)
    if (source)    params.set('source', source)
    Object.entries(overrides).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)))
    const qs = params.toString()
    return `/annonces${qs ? `?${qs}` : ''}`
  }

  function pageUrl(p: number) {
    return buildLink({ page: p > 1 ? String(p) : '' })
  }

  return (
    <div className="annonces-page">
      {/* Header */}
      <div className="annonces-header">
        <div className="annonces-header-text">
          <h1 className="annonces-titre">Petites annonces — Sénégal</h1>
          <p className="annonces-sous-titre">
            {total > 0 ? `${total.toLocaleString('fr-SN')} annonce${total > 1 ? 's' : ''}` : 'Aucune annonce'}
            {catActuelle.slug ? ` en ${catActuelle.label}` : ''}
          </p>
        </div>
        <Link href="/deposer-annonce" className="annonces-cta-btn">
          + Publier une annonce
        </Link>
      </div>

      {/* Recherche texte */}
      <form action="/annonces" method="get" className="annonces-search">
        {categorie && <input type="hidden" name="categorie" value={categorie} />}
        {tri       && <input type="hidden" name="tri" value={tri} />}
        {prixMax   && <input type="hidden" name="prixMax" value={prixMax} />}
        {ville     && <input type="hidden" name="ville" value={ville} />}
        {source    && <input type="hidden" name="source" value={source} />}
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher une annonce (ex: iphone, canapé, voiture…)"
          className="annonces-search-input"
        />
        <button type="submit" className="annonces-search-btn">🔍 Rechercher</button>
        {q && (
          <Link href={buildLink({ q: '' })} className="budget-pill budget-pill--reset">
            ✕ Recherche
          </Link>
        )}
      </form>

      {/* Filtres catégories */}
      <div className="annonces-cats">
        {CATEGORIES.map(cat => {
          const active = cat.slug === categorie
          return (
            <Link
              key={cat.slug}
              href={buildLink({ categorie: cat.slug, page: '' })}
              className={`annonces-cat-pill${active ? ' annonces-cat-pill--active' : ''}`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </Link>
          )
        })}
      </div>

      {/* Tri */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Trier :</span>
        {TRIS.map(t => (
          <Link
            key={t.val || 'defaut'}
            href={buildLink({ tri: t.val, page: '' })}
            className={`annonces-cat-pill${tri === t.val ? ' annonces-cat-pill--active' : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Prix max */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Budget max :</span>
        {PRIX_MAX.map(p => (
          <Link
            key={p.val}
            href={buildLink({ prixMax: prixMax === p.val ? '' : p.val, page: '' })}
            className={`annonces-cat-pill${prixMax === p.val ? ' annonces-cat-pill--active' : ''}`}
          >
            {p.label}
          </Link>
        ))}
        {prixMax && (
          <Link href={buildLink({ prixMax: '', page: '' })} className="budget-pill budget-pill--reset">
            ✕ Budget
          </Link>
        )}
      </div>

      {/* Ville */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Ville :</span>
        {VILLES_SN.map(v => (
          <Link
            key={v}
            href={buildLink({ ville: ville === v ? '' : v, page: '' })}
            className={`annonces-cat-pill${ville === v ? ' annonces-cat-pill--active' : ''}`}
          >
            {v}
          </Link>
        ))}
        {ville && (
          <Link href={buildLink({ ville: '', page: '' })} className="budget-pill budget-pill--reset">
            ✕ Ville
          </Link>
        )}
      </div>

      {/* Source */}
      <div className="annonces-cats" style={{ marginTop: 8 }}>
        <span className="filtres-label">Origine :</span>
        {SOURCES.map(s => (
          <Link
            key={s.val || 'toutes'}
            href={buildLink({ source: s.val, page: '' })}
            className={`annonces-cat-pill${source === s.val ? ' annonces-cat-pill--active' : ''}`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Grille */}
      {annonces.length === 0 ? (
        <div className="annonces-empty">
          <p>Aucune annonce{catActuelle.slug ? ` en ${catActuelle.label}` : ''} pour le moment.</p>
          <Link href="/deposer-annonce" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Soyez le premier à publier
          </Link>
        </div>
      ) : (
        <div className="annonces-grid">
          {(annonces as Annonce[]).map(a => {
            const photo = Array.isArray(a.photos) ? a.photos[0] : null
            return (
              <Link href={`/annonces/${a.id}`} key={a.id} className="annonce-pub-card" style={{ position: 'relative' }}>
                <CardActions id={a.id} nom={a.titre} type="annonce" />
                <div className="annonce-pub-img-wrap">
                  {photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={cloudinaryHQ(photo, { width: 400 })} alt={a.titre} className="annonce-pub-img" />
                    : <div className="annonce-pub-img annonce-pub-img--vide">
                        <span>{CATEGORIES.find(c => c.slug === a.categorie_slug)?.emoji ?? '📦'}</span>
                      </div>
                  }
                  <span className="annonce-pub-cat">{catLabel(a.categorie_slug)}</span>
                </div>
                <div className="annonce-pub-body">
                  <p className="annonce-pub-titre">{a.titre}</p>
                  <p className="annonce-pub-prix">{formatPrix(a.prix)}</p>
                  <div className="annonce-pub-meta">
                    <span>{a.quartier ? `${a.quartier}, ` : ''}{a.ville ?? 'Dakar'}</span>
                    <span>{formatDate(a.created_at)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="annonces-pagination">
          {page > 1 && (
            <Link href={pageUrl(page - 1)} className="pag-btn">← Précédent</Link>
          )}
          <span className="pag-info">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={pageUrl(page + 1)} className="pag-btn">Suivant →</Link>
          )}
        </div>
      )}
    </div>
  )
}
