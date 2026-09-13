export interface BoutiquePOS {
  id: string
  nom: string
  plan_actif?: string | null
  is_trial?: boolean
  regime_fiscal?: string
  prix_tva_incluse?: boolean
  timbre_fiscal_applicable?: boolean
  tva_taux_defaut?: number
  actif?: boolean
  adresse?: string | null
  telephone?: string | null
  message_bas_ticket?: string | null
  logo?: string | null
  pos_remise_max_caissier?: number
  pos_remise_seuil_auto_montant?: number
  pos_remise_seuil_auto_pct?: number
  pos_remise_motifs?: Array<{ id: string; nom: string; pct: number }>
}

export interface SessionCaisse {
  id: string
  dateOuverture: string
  fondDeCaisse: number
  caissierNom: string
  statut: 'ouverte' | 'fermee'
  ventes: {
    total: number
    especes: number
    wave: number
    orangeMoney: number
    carte: number
    mixte: number
    nbVentes: number
  }
}

export interface ClientCreditPOS {
  id: string
  nom: string
  telephone?: string | null
  solde_du: number
  plafond_credit?: number
  exonere_tva?: boolean
}
