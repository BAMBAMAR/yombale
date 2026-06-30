import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

const CATEGORY_SLUGS = [
  'smartphones', 'informatique', 'tv-electro', 'mode',
  'maison', 'auto-moto', 'jeux', 'beaute',
]

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE}/`,              changeFrequency: 'daily',   priority: 1.0 },
  { url: `${BASE}/immo`,          changeFrequency: 'hourly',  priority: 0.9 },
  { url: `${BASE}/telecom`,       changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE}/annonces`,      changeFrequency: 'daily',   priority: 0.8 },
  ...CATEGORY_SLUGS.map(slug => ({
    url: `${BASE}/categorie/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  })),
  { url: `${BASE}/favoris`,       changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE}/comparaison`,   changeFrequency: 'monthly', priority: 0.4 },
  { url: `${BASE}/connexion`,     changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE}/inscription`,   changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE}/deposer-annonce`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/deposer-immo`,  changeFrequency: 'monthly', priority: 0.5 },
]

interface Produit { id: string; updated_at?: string }
interface Annonce { id: string; updated_at?: string }
interface AnnonceClassifiee { id: string; updated_at?: string }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

  let produitEntries: MetadataRoute.Sitemap  = []
  let immoEntries: MetadataRoute.Sitemap     = []
  let annonceEntries: MetadataRoute.Sitemap  = []

  try {
    const [prodRes, immoRes, annonceRes] = await Promise.allSettled([
      fetch(`${BACKEND}/api/produits?limit=500&page=1`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND}/api/immo?limit=200&page=1&transaction=location`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND}/api/annonces?limit=200&page=1`, { next: { revalidate: 3600 } }),
    ])

    if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
      const data = await prodRes.value.json()
      const items: Produit[] = data.produits ?? data.data ?? []
      produitEntries = items.map(p => ({
        url: `${BASE}/produit/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }))
    }

    if (immoRes.status === 'fulfilled' && immoRes.value.ok) {
      const data = await immoRes.value.json()
      const items: Annonce[] = data.annonces ?? []
      immoEntries = items.map(a => ({
        url: `${BASE}/immo/${a.id}`,
        lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }

    if (annonceRes.status === 'fulfilled' && annonceRes.value.ok) {
      const data = await annonceRes.value.json()
      const items: AnnonceClassifiee[] = data.annonces ?? []
      annonceEntries = items.map(a => ({
        url: `${BASE}/annonces/${a.id}`,
        lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.65,
      }))
    }
  } catch {
    // sitemap dégradé si backend indisponible
  }

  return [...STATIC_ROUTES, ...produitEntries, ...immoEntries, ...annonceEntries]
}
