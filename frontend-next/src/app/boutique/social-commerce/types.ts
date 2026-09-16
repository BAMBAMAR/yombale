export interface ProduitCatalogue {
  id: string
  nom: string
  prix: number | null
  images: string[]
  en_stock: boolean
  categorie?: string | null
}

export interface SocialPostAdmin {
  id: string
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'whatsapp'
  external_post_id?: string | null
  post_url: string
  media_type: string
  thumbnail_url?: string | null
  caption?: string | null
  ocr_text?: string | null
  auteur?: string | null
  visible: boolean
  is_featured: boolean
  ordre: number
  engagement_score?: number
  created_at: string
  produits: Array<{
    id: string
    nom: string
    prix: number | null
    images: string[]
    en_stock: boolean
    confidence_score?: number
  }>
}

export interface SocialAccountAdmin {
  id: string
  plateforme: string
  nom_compte: string
  profil_url: string | null
  statut: string
  derniere_sync_at?: string | null
  auto_sync?: boolean
}

export interface DiscoveredPost {
  externalPostId?: string
  url: string
  platform: string
  mediaType: string
  thumbnailUrl?: string | null
  caption?: string
  author?: string
  is_already_imported?: boolean
  isProfilePlaceholder?: boolean
  matchedSuggestion?: ProductMatchSuggestion | null
}

export interface ProductMatchSuggestion {
  produit: ProduitCatalogue
  confidence_score: number
  confidence_level?: 'high' | 'medium' | 'low'
  suggested?: boolean
  price_matched?: boolean
  matched_price?: number | null
  matched_hashtags?: string[]
}

export interface SocialHealthAlert {
  type: 'info' | 'warning' | 'error'
  code: string
  message: string
  accountId?: string
  count?: number
}

export interface SocialHealthReport {
  healthy: boolean
  score_sante: number
  total_comptes: number
  alerts: SocialHealthAlert[]
}

export interface SocialShopManagerProps {
  boutiqueId: string
  boutiqueNom: string
  boutiqueSlug?: string | null
}

export type MainTab = 'posts' | 'import' | 'accounts'
export type PostFilter = 'all' | 'unlinked' | 'featured' | 'hidden'
export type TriOption = 'date_desc' | 'date_asc' | 'unlinked_first' | 'linked_first' | 'featured_first' | 'platform'
export type PlatformFilter = 'all' | 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'whatsapp'
export type ImportMode = 'profile' | 'batch' | 'single' | 'media'

export interface SocialStats {
  posts_affiches?: number
  total_posts?: number
  posts_sans_produits?: number
}

export interface SocialAnalytics {
  vues_sociales?: number
  clics_whatsapp?: number
}

