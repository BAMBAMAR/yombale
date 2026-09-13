import type { LucideIcon } from 'lucide-react'
import type { SectionItem } from '../StudioDispositionSections'

export interface BoutiqueCustomizationData {
  id: string
  nom: string
  slug: string | null
  description?: string | null
  categorie?: string | null
  telephone?: string | null
  whatsapp?: string | null
  ville?: string | null
  adresse?: string | null
  logo_url?: string | null
  cover_url?: string | null
  couleur_theme?: string | null
  couleur_secondaire?: string | null
  slogan?: string | null
  theme_style?: string | null
  forme_boutons?: string | null
  bandeau_promo?: string | null
  bandeau_promo_actif?: boolean
  message_accueil?: string | null
  disposition_catalogue?: string | null
  disposition_sections?: string | any[] | null
  horaires?: Record<string, string> | null
  theme_id?: string | null
}

export interface StylePreset {
  id: string
  nom: string
  description: string
  badge: string
  couleurTheme: string
  couleurSecondaire: string
  formeBoutons: 'squircle' | 'pill' | 'arrondi' | 'droit'
  disposition: 'grille' | 'lookbook' | 'compact'
  icon: LucideIcon
  exemples: string
}

export type { SectionItem }
