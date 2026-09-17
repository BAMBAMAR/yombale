// frontend-next/src/lib/boutique-themes.ts
// Nopalou — 8 Thèmes Sectoriels Pré-Configurés pour Vitrines Digitales Marchandes

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
    // Typographie (Strictement polices système, 0 CDN)
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
    description: 'Design épuré et chaleureux, identité signature Nopalou avec accents solaires.',
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
      headingWeight: 850,
      borderRadius: '12px',
      cardShadow: '0 2px 8px rgba(26,22,18,0.06)',
      headerStyle: 'banner',
      productCardStyle: 'grid',
      productImageRatio: '1:1',
    },
  },
  {
    id: 'mode-wax',
    nom: 'Mode & Wax Élégant',
    description: 'Tons terracotta et ocre noble avec disposition lookbook pour prêt-à-porter et couture.',
    preview: '/themes/mode.webp',
    css: {
      primary: '#B45309',
      primaryDark: '#92400E',
      primaryLight: '#FEF3C7',
      background: '#FAF8F5',
      cardBg: '#FFFFFF',
      textPrimary: '#292524',
      textSecondary: '#78716C',
      border: '#E7E5E4',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 700,
      borderRadius: '8px',
      cardShadow: '0 4px 14px rgba(0,0,0,0.05)',
      headerStyle: 'hero',
      productCardStyle: 'masonry',
      productImageRatio: '3:4',
    },
  },
  {
    id: 'tech-moderne',
    nom: 'Tech & Moderne',
    description: 'Cartes nettes et contrastes vifs pour smartphones, informatique et accessoires connectés.',
    preview: '/themes/tech.webp',
    css: {
      primary: '#0284C7',
      primaryDark: '#0369A1',
      primaryLight: '#E0F2FE',
      background: '#F8FAFC',
      cardBg: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 800,
      borderRadius: '12px',
      cardShadow: '0 1px 4px rgba(0,0,0,0.06)',
      headerStyle: 'minimal',
      productCardStyle: 'grid',
      productImageRatio: '1:1',
    },
  },
  {
    id: 'superette-frais',
    nom: 'Supérette & Alimentation',
    description: 'Harmonie verte fraîche et boutons d’achat rapide pour épiceries, primeurs et marchés.',
    preview: '/themes/nature.webp',
    css: {
      primary: '#0A5C36',
      primaryDark: '#074226',
      primaryLight: '#DCFCE7',
      background: '#F0FDF4',
      cardBg: '#FFFFFF',
      textPrimary: '#14532D',
      textSecondary: '#4B5563',
      border: '#BBF7D0',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 800,
      borderRadius: '16px',
      cardShadow: '0 2px 10px rgba(10,92,54,0.08)',
      headerStyle: 'banner',
      productCardStyle: 'grid',
      productImageRatio: '1:1',
    },
  },
  {
    id: 'beaute-cosmetique',
    nom: 'Cosmétique & Beauté',
    description: 'Esthétique satinée et teintes douces mettant en valeur parfums, soins et maquillage.',
    preview: '/themes/beaute.webp',
    css: {
      primary: '#BE185D',
      primaryDark: '#9D174D',
      primaryLight: '#FCE7F3',
      background: '#FDF4F8',
      cardBg: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#6B7280',
      border: '#FBCFE8',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 700,
      borderRadius: '18px',
      cardShadow: '0 4px 16px rgba(190,24,93,0.07)',
      headerStyle: 'split',
      productCardStyle: 'masonry',
      productImageRatio: '3:4',
    },
  },
  {
    id: 'quincaillerie-pro',
    nom: 'Quincaillerie & Pro',
    description: 'Lignes industrielles solides et indicateurs de stock nets pour outillage, auto et BTP.',
    preview: '/themes/quincaillerie.webp',
    css: {
      primary: '#1C2B4A',
      primaryDark: '#0F1A30',
      primaryLight: '#F1F5F9',
      background: '#F8FAFC',
      cardBg: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      border: '#CBD5E1',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 850,
      borderRadius: '6px',
      cardShadow: '0 1px 3px rgba(0,0,0,0.05)',
      headerStyle: 'minimal',
      productCardStyle: 'grid',
      productImageRatio: '1:1',
    },
  },
  {
    id: 'restauration-delices',
    nom: 'Restauration & Délices',
    description: 'Ambiance gourmande et visuels généreux pour traiteurs, restaurants et pâtisseries.',
    preview: '/themes/delices.webp',
    css: {
      primary: '#C2410C',
      primaryDark: '#9A3412',
      primaryLight: '#FFEDD5',
      background: '#FFFBEB',
      cardBg: '#FFFFFF',
      textPrimary: '#1C1917',
      textSecondary: '#78716C',
      border: '#FED7AA',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 800,
      borderRadius: '14px',
      cardShadow: '0 3px 12px rgba(194,65,12,0.1)',
      headerStyle: 'hero',
      productCardStyle: 'grid',
      productImageRatio: '4:3',
    },
  },
  {
    id: 'artisanat-deco',
    nom: 'Artisanat & Décoration',
    description: 'Tons lin et terre cuite valorisant l’artisanat sénégalais, le fait-main et l’art déco.',
    preview: '/themes/artisanat.webp',
    css: {
      primary: '#854D0E',
      primaryDark: '#713F12',
      primaryLight: '#FEF9C3',
      background: '#FAF8F5',
      cardBg: '#FFFFFF',
      textPrimary: '#292524',
      textSecondary: '#57534E',
      border: '#E7E5E4',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 700,
      borderRadius: '10px',
      cardShadow: '0 2px 8px rgba(133,77,14,0.08)',
      headerStyle: 'split',
      productCardStyle: 'masonry',
      productImageRatio: '3:4',
    },
  },
]

export function getBoutiqueTheme(themeId?: string | null): BoutiqueTheme {
  if (!themeId) return THEMES_BOUTIQUE[0]
  return THEMES_BOUTIQUE.find(t => t.id === themeId) || THEMES_BOUTIQUE[0]
}
