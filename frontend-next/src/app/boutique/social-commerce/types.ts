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
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'youtube'
  external_post_id?: string | null
  post_url: string
  media_type: string
  thumbnail_url?: string | null
  caption?: string | null
  auteur?: string | null
  visible: boolean
  is_featured: boolean
  ordre: number
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
}

export interface SocialShopManagerProps {
  boutiqueId: string
  boutiqueNom: string
  boutiqueSlug?: string | null
}

export type MainTab = 'posts' | 'import' | 'accounts'
export type PostFilter = 'all' | 'unlinked' | 'featured' | 'hidden'
export type TriOption = 'date_desc' | 'date_asc' | 'unlinked_first' | 'linked_first' | 'featured_first' | 'platform'
export type PlatformFilter = 'all' | 'instagram' | 'tiktok' | 'facebook' | 'youtube'
export type ImportMode = 'profile' | 'batch' | 'single'

export interface SocialStats {
  posts_affiches?: number
  total_posts?: number
  posts_sans_produits?: number
}

export interface SocialAnalytics {
  vues_sociales?: number
  clics_whatsapp?: number
}
