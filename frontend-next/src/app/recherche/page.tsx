import type { Metadata } from 'next'
import Link from 'next/link'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface Produit {
  id: string
  nom: string
  marque: string | null
  prix_min: number | null
  image_url: string | null
  categorie_slug: string | null
}

interface Annonce {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  categorie_slug: string
  photos: string[]
  created_at: string
}

async function rechercherProduits(q: string): Promise<Produit[]> {
  try {
    const r = await fetch(`${BACKEND}/api/produits?q=${encodeURIComponent(q)}&limit=12`, { next: { revalidate: 60 } })
    if (!r.ok) return []
    const data = await r.json()
    return data.produits ?? []
  } catch { return [] }
}

async function rechercherAnnonces(q: string): Promise<Annonce[]> {
  try {
    const r = await fetch(`${BACKEND}/api/annonces?q=${encodeURIComponent(q)}&limit=12`, { next: { revalidate: 60 } })
    if (!r.ok) return []
    const data = await r.json()
    return data.annonces ?? []
  } catch { return [] }
}

function formatPrix(p: number | null) {
  if (!p) return null
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Recherche "${q}"` : 'Recherche',
    robots: 'noindex',
  }
}

export default async function RecherchePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  if (!query) {
    return (
      <div className="recherche-vide">
        <div className="recherche-vide-inner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Tapez un mot-clé dans la barre de recherche pour trouver des produits et annonces.</p>
        </div>
      </div>
    )
  }

  const [produits, annonces] = await Promise.all([
    rechercherProduits(query),
    rechercherAnnonces(query),
  ])

  const total = produits.length + annonces.length

  return (
    <div className="recherche-page">
      <div className="recherche-header">
        <h1 className="recherche-titre">
          Résultats pour <span>&ldquo;{query}&rdquo;</span>
        </h1>
        <p className="recherche-count">{total} résultat{total > 1 ? 's' : ''}</p>
      </div>

      {total === 0 ? (
        <div className="recherche-empty">
          <p>Aucun résultat pour <strong>&ldquo;{query}&rdquo;</strong>.</p>
          <p className="recherche-empty-hint">Essayez avec un autre mot-clé ou vérifiez l&apos;orthographe.</p>
        </div>
      ) : (
        <div className="recherche-sections">
          {produits.length > 0 && (
            <section className="recherche-section">
              <h2 className="recherche-section-titre">
                Produits
                <span className="recherche-section-count">{produits.length}</span>
              </h2>
              <div className="recherche-grid">
                {produits.map(p => (
                  <Link href={`/produit/${p.id}`} key={p.id} className="recherche-card">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.nom} className="recherche-card-img" />
                    ) : (
                      <div className="recherche-card-img recherche-card-img--vide" aria-hidden="true" />
                    )}
                    <div className="recherche-card-body">
                      <p className="recherche-card-nom">{p.nom}</p>
                      {p.marque && <p className="recherche-card-marque">{p.marque}</p>}
                      {p.prix_min != null && (
                        <p className="recherche-card-prix">à partir de {formatPrix(p.prix_min)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {produits.length === 12 && (
                <Link href={`/?q=${encodeURIComponent(query)}`} className="recherche-voir-plus">
                  Voir tous les produits →
                </Link>
              )}
            </section>
          )}

          {annonces.length > 0 && (
            <section className="recherche-section">
              <h2 className="recherche-section-titre">
                Annonces
                <span className="recherche-section-count">{annonces.length}</span>
              </h2>
              <div className="recherche-grid">
                {annonces.map(a => {
                  const photo = Array.isArray(a.photos) ? a.photos[0] : null
                  return (
                    <div key={a.id} className="recherche-card">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt={a.titre} className="recherche-card-img" />
                      ) : (
                        <div className="recherche-card-img recherche-card-img--vide" aria-hidden="true" />
                      )}
                      <div className="recherche-card-body">
                        <p className="recherche-card-nom">{a.titre}</p>
                        {a.ville && <p className="recherche-card-marque">{a.ville}</p>}
                        {a.prix != null && (
                          <p className="recherche-card-prix">{formatPrix(a.prix)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
