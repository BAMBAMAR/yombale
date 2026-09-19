import type { MetadataRoute } from 'next'
import { SOUS_CATEGORIES } from './categorie/sous-categories-data'
import { IMMO_LANDINGS } from './immo/landing-data'
import { TELECOM_LANDINGS } from './telecom/landing-data'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'

// beaute exclue : 0 produit en base — page vide contre-productive pour Google
const CATEGORY_SLUGS = [
  'smartphones', 'informatique', 'tv-electro', 'mode',
  'maison', 'auto-moto', 'jeux',
]

const BUDGETS_SITEMAP = [50000, 100000]

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
  // Landing pages sous-catégories produits
  ...Object.keys(SOUS_CATEGORIES).map(key => ({
    url: `${BASE}/categorie/${key}`,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  })),
  // Pages budget (route [sousCategorie], segment moins-de-<n>)
  ...CATEGORY_SLUGS.flatMap(slug =>
    BUDGETS_SITEMAP.map(b => ({
      url: `${BASE}/categorie/${slug}/moins-de-${b}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ),
  // Landing pages immo
  ...Object.keys(IMMO_LANDINGS).map(slug => ({
    url: `${BASE}/immo/${slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  })),
  // Landing pages télécom
  ...Object.keys(TELECOM_LANDINGS).map(slug => ({
    url: `${BASE}/telecom/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })),
  // Agences Immobilières certifiées
  { url: `${BASE}/agences`,                   changeFrequency: 'daily',   priority: 0.95 },
  // Annuaire des Boutiques et Vendeurs vérifiés
  { url: `${BASE}/boutiques`,                 changeFrequency: 'daily',   priority: 0.95 },
  // Silos B2B Solutions Marchands & "Problème → Solution" SEO
  { url: `${BASE}/creer-boutique-en-ligne`,     changeFrequency: 'weekly', priority: 0.98 },
  { url: `${BASE}/logiciel-caisse-senegal`,     changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/alternative-shopify-senegal`, changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/vendre-sur-whatsapp`,         changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/paiement-en-ligne-senegal`,   changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/gestion-stock-carnet-dettes`, changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/logiciel-gestion-locative-senegal`, changeFrequency: 'weekly', priority: 0.95 },
  // Boutique, POS & Forfaits Vendeurs existants
  { url: `${BASE}/marchands`,            changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/pos`,                  changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/whatsapp`,             changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/migration`,            changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE}/pourquoi-nopalou`,     changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE}/creer-boutique`,       changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/tarifs-boutique`,      changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/guide-creer-boutique`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE}/guide-sourcing-revente`, changeFrequency: 'monthly', priority: 0.85 },
  // Guides
  { url: `${BASE}/guide-prix`,    changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-achat`,   changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-immo`,    changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-forfait`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-emploi`,  changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/assistant-whatsapp`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/demo`, changeFrequency: 'monthly', priority: 0.8 },
]

interface Produit {
  id: string
  updated_at?: string
  boutique_id?: string | null
  boutique_slug?: string | null
}
interface Annonce { id: string; updated_at?: string }
interface AnnonceClassifiee { id: string; updated_at?: string }
interface Boutique { id: string; slug: string | null; updated_at?: string }
interface AgenceItem { id: string; slug: string; updated_at?: string }
interface BoutiqueProductItem { id: string; updated_at?: string }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

  let produitEntries: MetadataRoute.Sitemap         = []
  let immoEntries: MetadataRoute.Sitemap            = []
  let annonceEntries: MetadataRoute.Sitemap         = []
  let boutiqueEntries: MetadataRoute.Sitemap        = []
  let agenceEntries: MetadataRoute.Sitemap          = []
  let boutiqueProduitEntries: MetadataRoute.Sitemap = []

  try {
    const [prodRes, immoRes, annonceRes, boutiqueRes, agenceRes] = await Promise.allSettled([
      fetch(`${BACKEND}/api/produits?limit=500&page=1`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND}/api/immo?limit=300&page=1`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND}/api/annonces?limit=200&page=1`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND}/api/boutiques?limit=200&page=1`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND}/api/agences/public?limit=200`, { next: { revalidate: 3600 } }),
    ])

    if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
      const data = await prodRes.value.json()
      const items: Produit[] = data.produits ?? data.data ?? []
      produitEntries = items.map(p => ({
        url: p.boutique_id
          ? `${BASE}/boutiques/${p.boutique_slug || p.boutique_id}/produits/${p.id}`
          : `${BASE}/produit/${p.id}`,
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
        priority: 0.75,
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

    if (boutiqueRes.status === 'fulfilled' && boutiqueRes.value.ok) {
      const data = await boutiqueRes.value.json()
      const items: Boutique[] = data.boutiques ?? []
      boutiqueEntries = items.map(b => ({
        url: `${BASE}/boutiques/${b.slug || b.id}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

      // Indexation des fiches produits des boutiques partenaires actives
      try {
        const topBoutiques = items.slice(0, 15)
        const prodsResponses = await Promise.allSettled(
          topBoutiques.map(b =>
            fetch(`${BACKEND}/api/boutiques/${b.id}/produits`, { next: { revalidate: 3600 } })
              .then(r => r.ok ? r.json() : null)
          )
        )
        prodsResponses.forEach((res, idx) => {
          if (res.status === 'fulfilled' && res.value?.produits) {
            const b = topBoutiques[idx]
            const bProds: BoutiqueProductItem[] = res.value.produits
            bProds.forEach(bp => {
              boutiqueProduitEntries.push({
                url: `${BASE}/boutiques/${b.slug || b.id}/produits/${bp.id}`,
                lastModified: bp.updated_at ? new Date(bp.updated_at) : undefined,
                changeFrequency: 'daily' as const,
                priority: 0.75,
              })
            })
          }
        })
      } catch {
        // Fallback silencieux si sous-requête boutique échoue
      }
    }

    if (agenceRes.status === 'fulfilled' && agenceRes.value.ok) {
      const data = await agenceRes.value.json()
      const items: AgenceItem[] = data.agences ?? []
      agenceEntries = items.map(ag => ({
        url: `${BASE}/agences/${ag.slug || ag.id}`,
        lastModified: ag.updated_at ? new Date(ag.updated_at) : undefined,
        changeFrequency: 'daily' as const,
        priority: 0.85,
      }))
    }
  } catch {
    // sitemap dégradé si backend indisponible
  }

  // Déduplication par URL
  const seenUrls = new Set<string>()
  const allEntries = [
    ...STATIC_ROUTES,
    ...produitEntries,
    ...boutiqueEntries,
    ...boutiqueProduitEntries,
    ...immoEntries,
    ...agenceEntries,
    ...annonceEntries
  ]

  return allEntries.filter(entry => {
    if (seenUrls.has(entry.url)) return false
    seenUrls.add(entry.url)
    return true
  })
}
