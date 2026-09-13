import {
  Sparkles,
  Smartphone,
  ShoppingBag,
  Zap,
  Store,
  Palette,
} from 'lucide-react'
import type { StylePreset } from './types'

export const STYLES_PRESETS: StylePreset[] = [
  {
    id: 'elegant',
    nom: 'Élégant & Chic',
    description: 'Tons raffinés, contrastes nobles et finitions soignées pour sublimer vos créations.',
    badge: 'Mode, Bijoux, Parfums',
    couleurTheme: '#832729', // Bordeaux noble
    couleurSecondaire: '#FDFBF7',
    formeBoutons: 'squircle',
    disposition: 'lookbook',
    icon: Sparkles,
    exemples: 'Idéal pour le prêt-à-porter de luxe, couture sur-mesure et maroquinerie fine.',
  },
  {
    id: 'moderne',
    nom: 'Moderne & High-Tech',
    description: 'Interface épurée, cartes nettes et accents technologiques pour rassurer les acheteurs.',
    badge: 'Smartphones, PC, Électro',
    couleurTheme: '#0284c7', // Bleu technologique
    couleurSecondaire: '#F8FAFC',
    formeBoutons: 'squircle',
    disposition: 'grille',
    icon: Smartphone,
    exemples: 'Parfait pour les smartphones, ordinateurs et équipements connectés.',
  },
  {
    id: 'naturel',
    nom: 'Naturel & Frais',
    description: 'Harmonie végétale et tons chaleureux invitant à la fraîcheur et à l\'authenticité.',
    badge: 'Alimentation, Bio, Épicerie',
    couleurTheme: '#0A5C36', // Vert forêt profond
    couleurSecondaire: '#F0FDF4',
    formeBoutons: 'arrondi',
    disposition: 'grille',
    icon: ShoppingBag,
    exemples: 'Conseillé pour fruits & légumes, alimentation générale, santé et cosmétique bio.',
  },
  {
    id: 'dynamique',
    nom: 'Dynamique & Promo',
    description: 'Couleurs vibrantes et bannières énergiques pour capter l\'attention et booster les ventes.',
    badge: 'Bons plans, Destockage',
    couleurTheme: '#EA580C', // Orange solaire percutant
    couleurSecondaire: '#FFF7ED',
    formeBoutons: 'pill',
    disposition: 'grille',
    icon: Zap,
    exemples: 'Idéal pour les boutiques à fort volume, promos régulières et articles populaires.',
  },
  {
    id: 'professionnel',
    nom: 'Pro & Sérieux',
    description: 'Sobriété institutionnelle, lignes rassurantes inspirant la confiance des pros et particuliers.',
    badge: 'Quincaillerie, Auto, BTP',
    couleurTheme: '#1C2B4A', // Bleu marine confiance
    couleurSecondaire: '#F8FAFC',
    formeBoutons: 'droit',
    disposition: 'compact',
    icon: Store,
    exemples: 'Recommandé pour quincaillerie, pièces automobiles, outillage et services pro.',
  },
  {
    id: 'colore',
    nom: 'Pop & Coloré',
    description: 'Ambiance pétillante, joyeuse et chaleureuse qui donne le sourire et donne envie d\'explorer.',
    badge: 'Enfants, Déco, Fêtes',
    couleurTheme: '#7C3AED', // Violet éclatant
    couleurSecondaire: '#FAF5FF',
    formeBoutons: 'pill',
    disposition: 'grille',
    icon: Palette,
    exemples: 'Idéal pour univers bébé, jouets, cadeaux, accessoires et déco de fête.',
  },
]

export const PALETTES_POPULAIRES = [
  { nom: 'Orange Solaire (Nopalou)', hex: '#C75B00' },
  { nom: 'Bordeaux Chic', hex: '#832729' },
  { nom: 'Bleu Royal Tech', hex: '#2563EB' },
  { nom: 'Vert Forêt Bio', hex: '#0A5C36' },
  { nom: 'Émeraude Frais', hex: '#16A34A' },
  { nom: 'Bleu Marine Pro', hex: '#1C2B4A' },
  { nom: 'Violet Impérial', hex: '#7C3AED' },
  { nom: 'Rose Poudré / Pop', hex: '#DB2777' },
  { nom: 'Noir Carbone Chic', hex: '#1A1612' },
  { nom: 'Ocre Doré', hex: '#D97706' },
]

export const RADIUS_MAP: Record<string, string> = {
  droit: '4px',
  squircle: '12px',
  arrondi: '16px',
  pill: '9999px',
}

// Fonction de calcul de contraste WCAG simple pour garantir la lisibilité
export function getContrastColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0
  // Formule de luminance relative standard YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 140 ? '#111827' : '#ffffff'
}
