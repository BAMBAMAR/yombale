import {
  type LucideIcon,
  Tag,
  Package,
  Sparkles,
  Trophy,
  Radio,
  Home,
  TrendingDown,
  BookOpen,
  MessageCircle,
  Building2,
  CreditCard
} from 'lucide-react'

export interface GuideItem {
  href: string
  icon: LucideIcon
  label: string
  highlight?: boolean
  badge?: string
  badgeColor?: string
}

export const GUIDES: GuideItem[] = [
  { href: '/tarifs-boutique', icon: Tag, label: 'Tarifs & Forfaits Vendeurs', highlight: true, badge: 'OFFRE', badgeColor: '#C75B00' },
  { href: '/guide-creer-boutique', icon: Package, label: 'Guide Vendeur & Sourcing' },
  { href: '/demo', icon: Sparkles, label: 'Démo Interactive (Boutique & Agence)', highlight: true, badge: 'TESTER', badgeColor: 'var(--accent)' },
  { href: '/guide-achat', icon: Trophy, label: 'Guide d\'achat intelligent' },
  { href: '/guide-forfait', icon: Radio, label: 'Guide forfait télécom' },
  { href: '/guide-immo', icon: Home, label: 'Guide immobilier & baux' },
  { href: '/guide-prix', icon: TrendingDown, label: 'Guide des prix Sénégal' },
  { href: '/guide-emploi', icon: BookOpen, label: 'Comment utiliser Nopalou' },
  { href: '/assistant-whatsapp', icon: MessageCircle, label: 'Assistant WhatsApp & Bot', highlight: true, badge: '24/7', badgeColor: '#16A34A' },
]
