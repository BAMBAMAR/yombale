export interface ClientCredit {
  id: string
  boutique_id: string
  nom: string
  telephone: string
  adresse?: string | null
  solde: number
  plafond_max: number
  statut?: 'actif' | 'bloque' | 'archive'
  note_client?: string | null
  created_at?: string
  historique?: TransactionCredit[]
}

export interface TransactionCredit {
  id: string
  client_id: string
  boutique_id: string
  type: 'vente_credit' | 'remboursement' | 'depot_avance'
  montant: number
  mode_paiement: string
  note?: string | null
  produits?: any[]
  date_echeance?: string | null
  relance_auto_whatsapp?: boolean
  derniere_relance_whatsapp?: string | null
  created_at: string
}

export interface ProduitBoutique {
  id: string
  nom: string
  prix: number | null
  prix_promo?: number | null
  images?: string[] | null
  photo_url?: string | null
  image_url?: string | null
  stock_quantite?: number | null
  quantite_stock?: number | null
  code_barre?: string | null
  categorie?: string | null
}

export interface BoutiqueCarnetInfo {
  id: string
  nom: string
  slug?: string | null
  telephone?: string | null
  whatsapp?: string | null
  currency?: string
}

export interface VoiceActionPending {
  type: 'vente_credit' | 'remboursement' | 'nouveau_client'
  client?: ClientCredit
  nomClientPropose?: string
  montant: number
  transcriptRaw?: string
  description?: string
}
