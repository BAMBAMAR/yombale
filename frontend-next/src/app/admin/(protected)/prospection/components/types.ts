import type { Lead, StatsLeads, TemplateMsg, DorkingRequete, BlacklistItem } from '../page'

export type { Lead, StatsLeads, TemplateMsg, DorkingRequete, BlacklistItem }

export type TabType = 'crm' | 'import' | 'campagnes' | 'logs' | 'control' | 'blacklist'

export interface EditLeadFormState {
  id: string
  nom_boutique: string
  contact_nom: string
  telephone: string
  email: string
  categorie: string
  ville: string
  quartier: string
  statut: string
  notes: string
}

export interface AddLeadFormState {
  nom_boutique: string
  contact_nom: string
  telephone: string
  email: string
  categorie: string
  ville: string
  quartier: string
  notes: string
}

export interface AddBlacklistFormState {
  phone: string
  reason: string
}

export interface ProspectionProps {
  initialLeads: Lead[]
  initialStats: StatsLeads
  templates: TemplateMsg[]
  dorking: DorkingRequete[]
  secret: string
}

export interface AutoCollecteResult {
  success?: boolean
  totalAjoutes?: number
  totalIgnores?: number
  totalTraites?: number
  dureeMs?: number
  ramDeltaMb?: number
  error?: string
}

export interface ScrapingResult {
  succes?: boolean
  ajoutes?: number
  ignores?: number
  totalScrapes?: number
  zone?: string
  error?: string
}

export interface RelancesResult {
  resultats?: {
    marchands?: {
      stats?: {
        total?: number
        j1?: number
        j7?: number
        j25?: number
      }
    }
    dettes?: {
      relancesEnvoyees?: number
    }
  }
}
