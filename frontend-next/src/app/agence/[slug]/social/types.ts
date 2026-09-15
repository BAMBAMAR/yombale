// frontend-next/src/app/agence/[slug]/social/types.ts
// Types pour le Social Shop Immobilier (Hérité de l'architecture Social Commerce Boutique)

export interface BienItem {
  id: string
  reference?: string
  titre: string
  type_bien: string
  ville: string
  quartier?: string
  surface_m2?: number
  nb_pieces?: number
  nb_chambres?: number
  prix_location?: number
  prix_vente?: number
  meuble?: boolean
  description?: string
  images?: string[]
}

export interface SocialAccountProfile {
  id: string
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'whatsapp' | 'linkedin' | 'youtube' | 'twitter' | 'site_web'
  nom_compte: string
  profil_url: string
  statut: 'connecte' | 'non_configure'
  auto_sync?: boolean
  derniere_sync_at?: string
}

export interface SocialPostItem {
  id: string
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'youtube'
  external_post_id?: string
  post_url: string
  media_type: 'video' | 'reel' | 'image' | 'post'
  thumbnail_url?: string
  caption?: string
  auteur?: string
  visible: boolean
  is_featured: boolean
  created_at: string
  biens_associes?: Array<{
    id: string
    titre: string
    prix: number
    type_operation: 'vente' | 'location'
    quartier?: string
    image_url?: string
  }>
}

export interface SocialAccountsConfig {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  linkedin?: string
  youtube?: string
  twitter?: string
  site_web?: string
}

export type SocialMainTab = 'posts' | 'import' | 'accounts' | 'generator'
