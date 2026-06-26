import type { Metadata } from 'next'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

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

async function fetchAnnonces(categorie: string, page: number) {
  const params = new URLSearchParams({ limit: '24', page: String(page) })
  if (categorie) params.set('categorie', categorie)
  try {
    const r = await fetch(`${BACKEND}/api/annonces?${params}`, { next: { revalidate: 60 } })
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
  return {
    title: cat && cat.slug ? `Annonces ${cat.label} — Nopalou` : 'Annonces au Sénégal — Nopalou',
    description: 'Achetez et vendez entre particuliers au Sénégal. Téléphones, informatique, mode, maison, auto, services.',
  }
}

export default async function AnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; page?: string }>
}) {
  const { categorie = '', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr))

  const { annonces, total } = await fetchAnnonces(categorie, page)

  const totalPages = Math.ceil(total / 24)
  const catActuelle = CATEGORIES.find(c => c.slug === categorie) ?? CATEGORIES[0]

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (categorie) params.set('categorie', categorie)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/annonces${qs ? `?${qs}` : ''}`
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

      {/* Filtres catégories */}
      <div className="annonces-cats">
        {CATEGORIES.map(cat => {
          const active = cat.slug === categorie
          const href = cat.slug ? `/annonces?categorie=${cat.slug}` : '/annonces'
          return (
            <Link
              key={cat.slug}
              href={href}
              className={`annonces-cat-pill${active ? ' annonces-cat-pill--active' : ''}`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </Link>
          )
        })}
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
              <Link href={`/annonces/${a.id}`} key={a.id} className="annonce-pub-card">
                <div className="annonce-pub-img-wrap">
                  {photo
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photo} alt={a.titre} className="annonce-pub-img" />
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
