export interface PublicSettings {
  plan_pro_prix?: string
  plan_business_prix?: string
  plan_pro_label?: string
  plan_business_label?: string
  apporteur_taux_commission?: string
  paiement_wave?: string
  paiement_orange?: string
  reduc_3_mois?: string
  reduc_6_mois?: string
  reduc_12_mois?: string
}

export interface DemoExplanation {
  title: string
  desc: string
  backend: string
  benefit: string
}

export interface PosCartItem {
  id: string
  name: string
  price: number
  qty: number
  ean: string
}

export interface ChatMessage {
  sender: 'user' | 'bot'
  text: string
  time: string
}

export interface StickerProduct {
  nom: string
  prix: number
  ean: string
}

export interface RelanceClient {
  nom: string
  tel: string
  solde: number
  echeance: string
  quartier: string
}
