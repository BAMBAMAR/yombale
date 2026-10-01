import type { MetadataRoute } from 'next'
import { SOUS_CATEGORIES } from './categorie/sous-categories-data'
import { IMMO_LANDINGS } from './immo/landing-data'
import { TELECOM_LANDINGS } from './telecom/landing-data'
import { BUDGETS_PAGES } from '@/lib/budgets-categorie'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nopalou.com'
// AUD-135/139 : les appels serveur portent le jeton SSR (listes protégées par le filtre anti-bots et les budgets)
const SSR_SECRET = process.env.SSR_SECRET || ''
const SSR_HEADERS: Record<string, string> = SSR_SECRET ? { 'X-SSR-Token': SSR_SECRET } : {}

// beaute exclue : 0 produit en base — page vide contre-productive pour Google
const CATEGORY_SLUGS = [
  'smartphones', 'informatique', 'tv-electro', 'mode',
  'maison', 'auto-moto', 'jeux',
]

const BUDGETS_SITEMAP = BUDGETS_PAGES

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
  { url: `${BASE}/alternative-shopify-senegal`, changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/marchands`,                   changeFrequency: 'weekly', priority: 0.98 },
  { url: `${BASE}/logiciel-caisse-senegal`,     changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/pourquoi-nopalou`,            changeFrequency: 'monthly', priority: 0.90 },
  { url: `${BASE}/vendre-sur-whatsapp`,         changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/paiement-en-ligne-senegal`,   changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/gestion-stock-carnet-dettes`, changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/logiciel-gestion-locative-senegal`, changeFrequency: 'weekly', priority: 0.95 },
  // Boutique, POS & Forfaits Vendeurs existants
  { url: `${BASE}/sama-xaalis`,          changeFrequency: 'weekly', priority: 0.95 },
  { url: `${BASE}/partenaires`,          changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/migration`,            changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE}/creer-boutique`,       changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/tarifs-boutique`,      changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/guide-creer-boutique`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE}/guide-sourcing-revente`, changeFrequency: 'monthly', priority: 0.85 },
  // Guides
  { url: `${BASE}/guide-prix`,           changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-achat`,          changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-immo`,           changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-forfait`,        changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/guide-emploi`,         changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/guide-utilisation`,    changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/assistant-whatsapp`,   changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/demo`,                 changeFrequency: 'monthly', priority: 0.8 },
  // Informations légales & conformité
  { url: `${BASE}/cgu`,                  changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${BASE}/confidentialite`,      changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${BASE}/mentions-legales`,     changeFrequency: 'yearly',  priority: 0.3 },
]

interface SitemapItem {
  id: string
  slug?: string | null
  updated_at?: string | null
  boutique_id?: string | null
  boutique_slug?: string | null
}

type TypeSitemap = 'produit' | 'produit_boutique' | 'boutique' | 'annonce' | 'immo' | 'agence'

// AUD-139 : identifiants complets via l'endpoint réservé au rendu serveur (jeton SSR), page par page.
// Les listes publiques sont plafonnées et budgétées : elles tronquaient le sitemap (50 annonces sur 4 633).
async function recupererIds(backend: string, type: TypeSitemap): Promise<SitemapItem[]> {
  const items: SitemapItem[] = []
  for (let page = 1; page <= 20; page++) {
    try {
      const res = await fetch(`${backend}/api/sitemap/ids?type=${type}&page=${page}`, {
        headers: SSR_HEADERS,
        next: { revalidate: 3600 },
      })
      if (!res.ok) break
      const data = await res.json()
      items.push(...(data.items ?? []))
      if (page >= (data.pages ?? 1)) break
    } catch {
      break
    }
  }
  return items
}

const date = (d?: string | null) => (d ? new Date(d) : undefined)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

  const [produits, produitsBoutique, boutiques, annonces, immo, agences] = await Promise.all([
    recupererIds(BACKEND, 'produit'),
    recupererIds(BACKEND, 'produit_boutique'),
    recupererIds(BACKEND, 'boutique'),
    recupererIds(BACKEND, 'annonce'),
    recupererIds(BACKEND, 'immo'),
    recupererIds(BACKEND, 'agence'),
  ])

  const produitEntries: MetadataRoute.Sitemap = produits.map(p => ({
    url: `${BASE}/produit/${p.id}`,
    lastModified: date(p.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))
  const boutiqueProduitEntries: MetadataRoute.Sitemap = produitsBoutique.map(p => ({
    url: `${BASE}/boutiques/${p.boutique_slug || p.boutique_id}/produits/${p.id}`,
    lastModified: date(p.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }))
  const boutiqueEntries: MetadataRoute.Sitemap = boutiques.map(b => ({
    url: `${BASE}/boutiques/${b.slug || b.id}`,
    lastModified: date(b.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  const immoEntries: MetadataRoute.Sitemap = immo.map(a => ({
    url: `${BASE}/immo/${a.id}`,
    lastModified: date(a.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))
  const annonceEntries: MetadataRoute.Sitemap = annonces.map(a => ({
    url: `${BASE}/annonces/${a.id}`,
    lastModified: date(a.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }))
  const agenceEntries: MetadataRoute.Sitemap = agences.map(ag => ({
    url: `${BASE}/agences/${ag.slug || ag.id}`,
    lastModified: date(ag.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // Déduplication par URL
  const seenUrls = new Set<string>()
  const allEntries = [
    ...STATIC_ROUTES,
    ...produitEntries,
    ...boutiqueEntries,
    ...boutiqueProduitEntries,
    ...immoEntries,
    ...agenceEntries,
    ...annonceEntries,
  ]

  return allEntries.filter(entry => {
    if (seenUrls.has(entry.url)) return false
    seenUrls.add(entry.url)
    return true
  })
}
