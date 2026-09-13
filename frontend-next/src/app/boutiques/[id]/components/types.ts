export interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  categorie: string | null
  caracteristiques: Record<string, string> | null
  variantes?: { nom: string; valeurs: string[] }[] | null
  variantes_skus?: {
    id: string
    sku?: string
    code_barre?: string
    attributs: Record<string, string>
    prix: number
    prix_barre?: number
    stock_quantite?: number
    image_url?: string
  }[] | null
  unite_vente?: string | null
  has_variants?: boolean
  date_expiration?: string | null
  quantite_stock?: number | null
  stock_quantite?: number | null
}

export interface Annonce {
  id: string
  titre: string
  prix: number | null
  ville: string | null
  quartier: string | null
  categorie_slug: string
  photos: string[]
}

export interface BoutiqueData {
  id: string
  slug: string | null
  nom: string
  telephone: string | null
  whatsapp: string | null
  facebook: string | null
  instagram: string | null
  tiktok?: string | null
  youtube?: string | null
  site_web: string | null
  horaires: Record<string, string> | null
  adresse: string | null
  ville: string
  categorie: string | null
  description: string | null
  plan_actif: 'pro' | 'business' | null
  couleur_theme?: string | null
  couleur_secondaire?: string | null
  slogan?: string | null
  theme_style?: string | null
  forme_boutons?: string | null
  bandeau_promo?: string | null
  bandeau_promo_actif?: boolean
  message_accueil?: string | null
  disposition_catalogue?: string | null
  disposition_sections?: string | any[] | null
}

export function getContrastColor(hexColor?: string | null): string {
  if (!hexColor) return '#ffffff'
  const cleanHex = hexColor.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 140 ? '#111827' : '#ffffff'
}
