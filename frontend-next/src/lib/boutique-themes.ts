// frontend-next/src/lib/boutique-themes.ts
export interface BoutiqueTheme {
  id: string
  nom: string
  description: string
  preview: string
  css: {
    // Couleurs
    primary: string
    primaryDark: string
    primaryLight: string
    background: string
    cardBg: string
    textPrimary: string
    textSecondary: string
    border: string
    // Typographie
    fontFamily: string
    headingWeight: number
    // Layout
    borderRadius: string
    cardShadow: string
    // Sections
    headerStyle: 'minimal' | 'banner' | 'hero' | 'split'
    productCardStyle: 'grid' | 'list' | 'masonry'
    productImageRatio: '1:1' | '4:3' | '3:4'
  }
}

export const THEMES_BOUTIQUE: BoutiqueTheme[] = [
  {
    id: 'classique',
    nom: 'Classique Nopalou',
    description: 'Design épuré et chaleureux, identité signature Nopalou',
    preview: '/themes/classique.webp',
    css: {
      primary: '#C75B00',
      primaryDark: '#A34900',
      primaryLight: '#FFF3E8',
      background: '#F8F5F0',
      cardBg: '#FFFFFF',
      textPrimary: '#1C2B4A',
      textSecondary: '#5A4E42',
      border: '#E8DDD2',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 800,
      borderRadius: '12px',
      cardShadow: '0 2px 8px rgba(26,22,18,0.06)',
      headerStyle: 'banner',
      productCardStyle: 'grid',
      productImageRatio: '1:1',
    },
  },
  {
    id: 'luxe-sombre',
    nom: 'Luxe Sombre',
    description: 'Élégant, premium et nocturne avec touches or chaleureux',
    preview: '/themes/luxe-sombre.webp',
    css: {
      primary: '#D4A574',
      primaryDark: '#B8895C',
      primaryLight: '#2A2420',
      background: '#1A1612',
      cardBg: '#2A2420',
      textPrimary: '#F5F0EB',
      textSecondary: '#B8A99C',
      border: '#3A3430',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 700,
      borderRadius: '8px',
      cardShadow: '0 4px 16px rgba(0,0,0,0.3)',
      headerStyle: 'hero',
      productCardStyle: 'grid',
      productImageRatio: '3:4',
    },
  },
  {
    id: 'nature-vert',
    nom: 'Nature & Bio',
    description: 'Frais, végétal et naturel pour l’artisanat et les produits frais',
    preview: '/themes/nature.webp',
    css: {
      primary: '#2D6A4F',
      primaryDark: '#1B4332',
      primaryLight: '#D8F3DC',
      background: '#F0F7F4',
      cardBg: '#FFFFFF',
      textPrimary: '#1B4332',
      textSecondary: '#52796F',
      border: '#B7E4C7',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 700,
      borderRadius: '16px',
      cardShadow: '0 2px 12px rgba(45,106,79,0.08)',
      headerStyle: 'banner',
      productCardStyle: 'masonry',
      productImageRatio: '4:3',
    },
  },
  {
    id: 'tech-moderne',
    nom: 'Tech & Moderne',
    description: 'Design ultra-net et contemporain pour l’électronique et gadgets',
    preview: '/themes/tech.webp',
    css: {
      primary: '#3B82F6',
      primaryDark: '#2563EB',
      primaryLight: '#EFF6FF',
      background: '#F8FAFC',
      cardBg: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 800,
      borderRadius: '12px',
      cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
      headerStyle: 'minimal',
      productCardStyle: 'grid',
      productImageRatio: '1:1',
    },
  },
  {
    id: 'mode-chic',
    nom: 'Mode & Chic',
    description: 'Haute couture et raffinement pour le prêt-à-porter et bijoux',
    preview: '/themes/mode.webp',
    css: {
      primary: '#9F1239',
      primaryDark: '#881337',
      primaryLight: '#FFF1F2',
      background: '#FAFAF9',
      cardBg: '#FFFFFF',
      textPrimary: '#1C1917',
      textSecondary: '#78716C',
      border: '#E7E5E4',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 600,
      borderRadius: '4px',
      cardShadow: 'none',
      headerStyle: 'hero',
      productCardStyle: 'masonry',
      productImageRatio: '3:4',
    },
  },
]

export function getBoutiqueTheme(themeId?: string | null): BoutiqueTheme {
  if (!themeId) return THEMES_BOUTIQUE[0]
  return THEMES_BOUTIQUE.find(t => t.id === themeId) || THEMES_BOUTIQUE[0]
}
