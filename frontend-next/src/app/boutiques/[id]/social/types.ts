import React from 'react'
import { Camera, Music2, Globe, Play } from 'lucide-react'

export interface SocialProduct {
  id: string
  nom: string
  prix: number | null
  prix_barre?: number | null
  images: string[]
  en_stock: boolean
  categorie?: string | null
  confidence_score?: number
}

export interface SocialPost {
  id: string
  boutique_id: string
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'youtube'
  external_post_id?: string | null
  post_url: string
  media_type: string
  media_url?: string | null
  thumbnail_url?: string | null
  embed_html?: string | null
  caption?: string | null
  auteur?: string | null
  is_featured: boolean
  ordre: number
  published_at: string
  produits_associes: SocialProduct[]
}

export interface SocialAccount {
  plateforme: string
  nom_compte: string
  profil_url: string | null
}

export interface SocialShopFeedProps {
  boutiqueId: string
  boutiqueNom: string
  boutiqueSlug?: string | null
  whatsappNumber?: string | null
  initialPosts?: SocialPost[]
  socialAccounts?: SocialAccount[]
  activePostId?: string | null
}

export interface PlatformMeta {
  label: string
  color: string
  bg: string
  border: string
  IconComponent: React.ComponentType<any>
}

export const PLATFORM_CONFIG: Record<string, PlatformMeta> = {
  instagram: {
    label: 'Instagram',
    color: '#e1306c',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    IconComponent: Camera,
  },
  tiktok: {
    label: 'TikTok',
    color: '#0f172a',
    bg: '#f1f5f9',
    border: '#e2e8f0',
    IconComponent: Music2,
  },
  facebook: {
    label: 'Facebook',
    color: '#1877f2',
    bg: '#eff6ff',
    border: '#bfdbfe',
    IconComponent: Globe,
  },
  youtube: {
    label: 'YouTube',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    IconComponent: Play,
  },
}

export function formatHandle(raw?: string | null): string {
  if (!raw) return ''
  let u = raw.trim()
  try {
    if (u.startsWith('http://') || u.startsWith('https://')) {
      const parsed = new URL(u)
      const parts = parsed.pathname.split('/').filter(Boolean)
      u = parts[0] || ''
    }
  } catch (err) {
    console.warn('[Nopalou:SocialShopFeed:formatHandle]', err)
  }
  const cleaned = u.replace(/^@+/, '').replace(/\/+$/, '').trim()
  return cleaned ? `@${cleaned}` : raw
}
