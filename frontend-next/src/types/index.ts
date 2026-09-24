/**
 * frontend-next/src/types/index.ts
 * Types TypeScript canoniques et partagés du domaine Nopalou
 */

// ── Utilitaires d'API standardisés ──────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Entités Métier Principales ──────────────────────────────────────────────

export type Devise = 'XOF' | 'EUR' | 'USD'

export interface Boutique {
  id: string
  nom: string
  slug: string
  description?: string | null
  telephone?: string | null
  whatsapp?: string | null
  adresse?: string | null
  ville?: string | null
  logo_url?: string | null
  couverture_url?: string | null
  actif: boolean
  plan?: 'gratuit' | 'starter' | 'pro' | 'illimite'
  commission_taux?: number
  created_at: string
  updated_at?: string
  utilisateur_id?: string
}

export interface ProduitVariante {
  id: string
  produit_id: string
  nom: string
  valeur: string
  prix_difference?: number
  stock_quantite: number
  sku?: string | null
}

export interface Produit {
  id: string
  boutique_id: string
  nom: string
  slug?: string
  description?: string | null
  prix: number
  prix_promo?: number | null
  prix_achat?: number | null
  stock_quantite?: number | null
  en_stock?: boolean
  actif?: boolean
  images?: string[] | null
  categories?: string[]
  variantes?: ProduitVariante[]
  created_at?: string
  updated_at?: string
}

export type StatutCommande =
  | 'en_attente'
  | 'confirmee'
  | 'en_preparation'
  | 'expediee'
  | 'livree'
  | 'annulee'

export type MethodePaiement =
  | 'wave'
  | 'orange_money'
  | 'cash'
  | 'virement'
  | 'credit'

export interface CommandeItem {
  id?: string
  commande_id?: string
  produit_id?: string | null
  variante_id?: string | null
  nom_produit: string
  details_variante?: string | null
  prix_unitaire: number
  prix_achat?: number | null
  quantite: number
  montant_total?: number
}

export interface Commande {
  id: string
  reference: string
  boutique_id: string
  client_nom: string
  client_telephone: string
  client_adresse?: string | null
  note?: string | null
  source?: 'web' | 'whatsapp' | 'pos' | 'autre'
  methode_paiement: MethodePaiement
  zone_livraison_id?: string | null
  frais_livraison: number
  montant_total: number
  statut: StatutCommande
  items?: CommandeItem[]
  groupe_commande?: string | null
  code_promo?: string | null
  montant_reduction?: number
  created_at: string
  updated_at?: string
}

export interface ZoneLivraison {
  id: string
  boutique_id: string
  nom: string
  prix: number
  delai_estime?: string | null
  actif: boolean
}

export interface ClientCredit {
  id: string
  boutique_id: string
  nom: string
  telephone: string
  adresse?: string | null
  limite_credit?: number
  encours_total?: number
  statut: 'actif' | 'bloque'
  created_at: string
}

export interface SessionUtilisateur {
  id: string
  telephone: string
  nom?: string | null
  role: 'marchand' | 'admin' | 'client' | 'apporteur'
  boutiques?: Array<{ id: string; nom: string; slug: string }>
}
