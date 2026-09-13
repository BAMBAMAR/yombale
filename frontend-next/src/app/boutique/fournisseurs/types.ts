export interface Fournisseur {
  id: string
  nom: string
  telephone?: string | null
  email?: string | null
  adresse?: string | null
  created_at?: string
}

export interface CommandeFournisseurItem {
  id?: string
  produitId?: string
  nom?: string
  nomLibre?: string
  quantite: number
  prix_achat?: number
  prixAchat?: number
}

export interface CommandeFournisseur {
  id: string
  reference: string
  fournisseur_id: string
  montant_total?: number | null
  total_achat?: number | null
  created_at?: string
  date_commande?: string
  date_livraison?: string
  statut: 'attente' | 'recu' | 'recue' | string
  items?: string | CommandeFournisseurItem[]
  justificatif_url?: string | null
}

export interface LigneCommandeForm {
  produitId: string
  nomLibre?: string
  quantite: number
  prixAchat: number
}
