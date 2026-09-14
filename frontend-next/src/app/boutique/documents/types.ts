export interface LigneDocument {
  produitId: string
  nom: string
  quantite: number
  prix: number
  barcode?: string
  sku?: string
  stock?: number
}

export interface DocumentBoutique {
  id: string
  reference: string
  type: 'facture' | 'devis' | 'proforma'
  client_id?: string | null
  client_nom?: string | null
  client_ninea?: string | null
  statut: 'brouillon' | 'valide' | 'paye' | 'envoye'
  notes?: string | null
  items: string | any[]
  total_ht: number
  total_tva: number
  total_ttc: number
  created_at: string
}
