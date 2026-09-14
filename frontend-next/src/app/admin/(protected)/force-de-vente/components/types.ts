export type TabType = 'strategie' | 'formation' | 'pitchs' | 'guide' | 'supports' | 'generateur' | 'simulateur'
export type CategorieCommerce = 'mode' | 'tech' | 'superette' | 'quincaillerie' | 'cosmetique' | 'resto' | 'grossiste'
export type StatutEquipement = 'sans_app' | 'avec_app'

export interface ForceDeVenteProps {
  secret?: string
  prixDecouverte?: number
  prixPro?: number
  prixBusiness?: number
  tauxApporteur?: number
}

export interface MatriceProfile {
  pitch: string
  diagnostic: string[]
  demo: string
  objection: { q: string; r: string }
  closing: string
}

export interface MatriceCommerce {
  label: string
  category: string
  sans_app: MatriceProfile
  avec_app: MatriceProfile
}

export interface QuizQuestion {
  id: number
  q: string
  options: string[]
  correct: number
  explication: string
}
