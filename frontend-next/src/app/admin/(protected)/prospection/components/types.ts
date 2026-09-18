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

export interface AuditQualiteData {
  score_sante: number
  total_leads: number
  mobiles_valides: number
  pct_mobiles_valides: number
  quartiers_precis: number
  pct_quartiers_precis: number
  noms_authentiques: number
  pct_noms_authentiques: number
  noms_generiques: number
  avec_contact_nom: number
  avec_email: number
  haut_fit: number
  scores_moyens: {
    qualite: number
    fit: number
    priorite: number
  }
  immo: {
    total: number
    agences: number
    gestionnaires: number
    courtiers: number
    promoteurs: number
    agents: number
    noms_generiques: number
    quartiers_flous: number
    annonces_mal_classees: number
    agences_nopalou_reelles: number
  }
  statuts: {
    nouveaux: number
    contactes: number
    en_discussion: number
    convertis: number
    invalides: number
    desinscrits: number
  }
  categories: Array<{ categorie: string; count: string | number }>
}

export interface AssainirImmoResult {
  success: boolean
  annoncesReclassees: number
  leadsImmoImportes: number
  quartiersEnrichis: number
  nomsAssainis: number
  sousProfilsCorriges: number
  agencesReconciliees: number
  scoreSanteAvant: number
  scoreSanteApres: number
  auditApres?: AuditQualiteData
  error?: string
}
