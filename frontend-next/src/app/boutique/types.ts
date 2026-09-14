export interface Boutique {
  id: string
  nom: string
  description: string | null
  categorie: string | null
  telephone: string | null
  whatsapp: string | null
  adresse: string | null
  ville: string
  logo_url: string | null
  cover_url: string | null
  site_web: string | null
  facebook: string | null
  instagram: string | null
  tiktok?: string | null
  youtube?: string | null
  slug: string | null
  mode_fonctionnement?: 'hybride_pos' | 'pure_player'
  meta_pixel_id?: string | null
  tiktok_pixel_id?: string | null
  ga4_id?: string | null
  actif: boolean
  sponsorise: boolean | null
  sponsor_jusqu_au: string | null
  fidelite_actif?: boolean
  fidelite_type?: 'cagnotte' | 'tampons'
  fidelite_taux_cashback?: number
  fidelite_tampons_max?: number
  fidelite_seuil_tampon?: number
  pos_remise_max_caissier?: number
  pos_remise_seuil_auto_montant?: number
  pos_remise_seuil_auto_pct?: number
  pos_remise_motifs?: any
  couleur_theme?: string | null
  couleur_secondaire?: string | null
  slogan?: string | null
  theme_style?: string | null
  forme_boutons?: string | null
  bandeau_promo?: string | null
  bandeau_promo_actif?: boolean
  message_accueil?: string | null
  disposition_catalogue?: string | null
  horaires?: Record<string, string> | null
  created_at: string
  plan_actif?: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  plan_souscrit?: string | null
  is_trial?: boolean
  jours_restants_essai?: number
}

export interface Variante {
  nom: string
  valeurs: string[]
  typeId?: string
}

export interface Produit {
  id: string
  nom: string
  description: string | null
  prix: number | null
  prix_barre: number | null
  images: string[]
  en_stock: boolean
  stock_quantite: number | null
  quantite_stock?: number | null
  categorie: string | null
  caracteristiques: Record<string, string> | null
  variantes: Variante[] | null
  whatsapp_sync_statut: 'synchronise' | 'en_attente' | 'echec' | null
  whatsapp_sync_erreur: string | null
  partage_le: string | null
}

export type ManageTab = 'dashboard' | 'produits' | 'commandes' | 'carnet' | 'express' | 'compta' | 'analytics' | 'personnaliser' | 'studio' | 'infos' | 'marketing' | 'social' | 'equipe' | 'admins' | 'caissiers' | 'documents' | 'fournisseurs' | 'fiscalite' | 'journal' | 'developer' | 'fidelite' | 'appstore' | 'entrepots' | 'abtesting' | 'blog' | 'abonnements'

export interface NavItem {
  key: ManageTab
  icon: any
  label: string
  minPlan?: 'pro' | 'business'
}

export interface NavGroup {
  icon: any
  title: string
  items: NavItem[]
}

