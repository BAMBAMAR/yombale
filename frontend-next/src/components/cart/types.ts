export interface Zone {
  id: string
  nom: string
  prix: number
}

export interface OrderSuccessData {
  boutiqueNom: string
  boutiqueId: string
  whatsapp?: string | null
  reference: string
  total: number
  sousTotal: number
  fraisLivraison: number
  reduction: number
  codePromo?: string
  methodePaiement: string
  clientNom: string
  clientTel: string
  clientAdresse?: string
  items: Array<{ nom: string; quantite: number; prix: number; detailsVariante?: string | null }>
}
