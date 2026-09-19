import { fcfa, escapeHtml } from '@/lib/format'

export interface Produit {
  id: number
  nom: string
  marque: string | null
  categorie: string | null
  categorie_nom: string | null
  description: string | null
  prix_min: number | null
  image_url: string | null
}

export interface OffreSpecs {
  stockage_go?: number | null
  ram_go?: number | null
  couleur?: string | null
  etat?: 'neuf' | 'occasion' | 'reconditionne' | null
  puissance_btu?: number | null
  capacite_litres?: number | null
  capacite_kg?: number | null
  ecran_pouces?: number | null
}

export interface Offre {
  id: number
  prix: number | null
  url_achat: string | null
  site_url: string | null
  stock: boolean | null
  scraped_at: string | null
  marchand_nom: string | null
  titre_affiche: string | null
  specs?: OffreSpecs | null
  _suspect?: boolean
}

export interface HistoriquePoint {
  jour: string
  prix_min: string
  prix_max: string
}

export interface ProduitSimilaire {
  id: string
  nom: string
  image_url: string | null
  prix_min: string | null
  nb_offres: string | null
  categorie_nom: string | null
  similarite: string | null
}

export const CAT_SLUGS: Record<string, string> = {
  Telephones: 'smartphones',
  Informatique: 'informatique',
  'TV & Electro': 'tv-electro',
  Mode: 'mode',
  Maison: 'maison',
  'Auto & Moto': 'auto-moto',
  Jeux: 'jeux',
}

export function parseSpecsFromName(name: string): OffreSpecs {
  const nameLower = name.toLowerCase()
  const storageMatch = nameLower.match(/(\d+)\s*(go|gb|tb|to)(?!\s*ram)/i)
  const ramMatch = nameLower.match(/(\d+)\s*(go|gb)\s*ram/i)
  const btuMatch = nameLower.match(/(\d+)\s*btu/i)
  const litresMatch = nameLower.match(/(\d+)\s*(litres|l)(?!\w)/i)
  const kgMatch = nameLower.match(/(\d+)\s*kg/i)
  const ecranMatch = nameLower.match(/(\d+)\s*(pouces|"|”)/i)

  return {
    stockage_go: storageMatch ? parseInt(storageMatch[1]) : null,
    ram_go: ramMatch ? parseInt(ramMatch[1]) : null,
    puissance_btu: btuMatch ? parseInt(btuMatch[1]) : null,
    capacite_litres: litresMatch ? parseInt(litresMatch[1]) : null,
    capacite_kg: kgMatch ? parseInt(kgMatch[1]) : null,
    ecran_pouces: ecranMatch ? parseInt(ecranMatch[1]) : null,
  }
}

export function buildJsonLd(produit: Produit, offres: Offre[]): string {
  const validOffers = offres.filter(o => o.prix != null && !o._suspect)
  const offersList = validOffers.map(o => ({
    '@type': 'Offer',
    price: o.prix,
    priceCurrency: 'XOF',
    availability: 'https://schema.org/InStock',
    seller: o.marchand_nom ? { '@type': 'Organization', name: escapeHtml(o.marchand_nom) } : undefined,
    url: o.url_achat ?? `https://nopalou.com/produit/${produit.id}`,
  }))

  let offers: any = undefined
  if (offersList.length === 1) {
    offers = offersList[0]
  } else if (offersList.length > 1) {
    const prices = offersList.map(o => Number(o.price)).filter(p => !isNaN(p) && p > 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : (produit.prix_min ?? undefined)
    const maxPrice = prices.length > 0 ? Math.max(...prices) : (produit.prix_min ?? undefined)
    if (minPrice != null && maxPrice != null && minPrice !== maxPrice) {
      offers = {
        '@type': 'AggregateOffer',
        priceCurrency: 'XOF',
        lowPrice: minPrice,
        highPrice: maxPrice,
        offerCount: offersList.length,
        offers: offersList,
      }
    } else {
      offers = offersList
    }
  } else if (produit.prix_min) {
    offers = {
      '@type': 'Offer',
      price: produit.prix_min,
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      url: `https://nopalou.com/produit/${produit.id}`,
    }
  }

  const sku = String(produit.id)

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://nopalou.com/produit/${produit.id}`,
    name: produit.nom,
    sku,
    mpn: sku,
    ...(produit.marque ? { brand: { '@type': 'Brand', name: produit.marque } } : {}),
    ...(produit.description ? { description: produit.description } : {}),
    ...(produit.image_url ? { image: produit.image_url } : {}),
    ...(offers ? { offers } : {}),
  })
}
