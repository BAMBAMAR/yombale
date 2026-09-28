export interface VisualItem {
  titre: string
  desc: string
  url: string
  usage: string
}

export interface SocialItem {
  reseau: string
  emoji?: string
  nom: string
  categorie: string
  bio: string
  site: string
  hashtags: string
}

export interface PostTemplate {
  titre: string
  texte: string
}

export interface SocialLinkItem {
  id: string
  name: string
  handle: string
  url: string
  code: string
  bg: string
  color: string
  actif: boolean
  description?: string
  ordre?: number
}

export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  { id: 'tiktok', name: 'TikTok Officiel', handle: '@nopalou.com', url: 'https://www.tiktok.com/@nopalou.com', code: 'TT', bg: '#000000', color: '#ffffff', actif: true, ordre: 1, description: 'Vidéos démos & astuces commerçants' },
  { id: 'whatsapp_channel', name: 'Canal WhatsApp', handle: 'Canal Nopalou.com', url: 'https://whatsapp.com/channel/0029Vb8fc4bBadmW40AFKx33', code: 'WA', bg: '#25D366', color: '#ffffff', actif: true, ordre: 2, description: 'Canal officiel des alertes et bons plans' },
  { id: 'facebook', name: 'Facebook Page', handle: 'Nopalou Sénégal', url: 'https://www.facebook.com/profile.php?id=61591675701726', code: 'FB', bg: '#1877F2', color: '#ffffff', actif: true, ordre: 3, description: 'Actualités, communauté et événements' },
  { id: 'instagram', name: 'Instagram', handle: '@nopalousn', url: 'https://www.instagram.com/nopalousn/', code: 'IG', bg: '#E4405F', color: '#ffffff', actif: true, ordre: 4, description: 'Photos boutiques, carrousels et stories' },
  { id: 'twitter', name: 'Twitter / X', handle: '@nopalou_sn', url: 'https://x.com/nopalou_sn', code: 'X', bg: '#0f172a', color: '#ffffff', actif: true, ordre: 5, description: 'Fil d\'actualités et mises à jour produit' },
  { id: 'whatsapp_support', name: 'WhatsApp Support', handle: '+221 70 871 79 42', url: 'https://wa.me/221708717942', code: 'SP', bg: '#128C7E', color: '#ffffff', actif: true, ordre: 6, description: 'Ligne directe assistance marchands & acheteurs' },
]

export type KitComTab = 'reseaux' | 'demarchage' | 'battlecard' | 'apporteur' | 'whatsapp' | 'generateur'

export interface KitComProps {
  visuels: VisualItem[]
  textes: SocialItem[]
  postTemplates: PostTemplate[]
  prixDecouverte: number
  prixPro: number
  prixBusiness: number
  commissionBusiness: number
  tauxApporteur: number
  initialSocialLinks?: SocialLinkItem[]
}
