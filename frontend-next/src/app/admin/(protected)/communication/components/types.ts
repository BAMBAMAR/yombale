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
}
