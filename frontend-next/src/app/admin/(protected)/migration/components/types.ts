export interface Boutique {
  id: string
  nom: string
  slug: string
  telephone: string
  logo?: string | null
  plan?: string | null
  nb_produits: number
}

export interface Categorie {
  id: string
  nom: string
  slug: string
  icone: string
}

export interface InitialData {
  boutiques: Boutique[]
  categories: Categorie[]
  totalMigres: number
}

export type MigrationTab = 'shopify' | 'csv' | 'magic' | 'dettes' | 'kit'

export interface ShopifyResult {
  ajoutes: number
  source: string
  totalDetectes: number
  error?: string
}

export interface CsvResult {
  ajoutes: number
  totalSoumis: number
  error?: string
}

export interface MagicResult {
  produit?: {
    nom: string
    prix: number
  }
  scraped?: {
    image?: string
  }
  error?: string
}

export interface DettesResult {
  ajoutes: number
  error?: string
}

export interface KitResult {
  messageWhatsApp: string
  storeUrl: string
  boutique?: {
    nom: string
  }
  error?: string
}
