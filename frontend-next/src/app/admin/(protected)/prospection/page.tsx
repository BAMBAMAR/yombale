import { cookies } from 'next/headers'
import ProspectionClient from './ProspectionClient'
import { BACKEND, adminHeaders } from '@/app/actions/admin'

export interface Lead {
  id: string
  nom_boutique: string
  contact_nom: string | null
  telephone: string
  telephone_brut: string | null
  operateur: string
  email: string | null
  categorie: string
  ville: string
  quartier: string | null
  source: string
  statut: string
  score: number
  fit_score: number
  engagement_score?: number
  conversion_score?: number
  contactability_score?: number
  priority_score?: number
  next_best_action?: string
  scoring_details?: string[] | string
  nb_contacts?: number
  dernier_contact_at?: string | null
  derniere_reponse_at?: string | null
  sous_profil?: string | null
  notes: string | null
  derniere_action_at: string | null
  created_at: string
}

export interface StatsLeads {
  total: number
  nouveaux: number
  contactes: number
  en_discussion: number
  convertis: number
  agences_converties?: number
  boutiques_converties?: number
  sans_reponse?: number
  desinscrits: number
  invalides: number
  qualifies: number
  haut_fit: number
  priorite_haute?: number
  priorite_moyenne?: number
  priorite_basse?: number
  avg_score: number
  avg_fit_score: number
  avg_priority_score?: number
  blacklist: number
}

export interface BlacklistItem {
  phone: string
  reason: string
  created_at: string
  lead_id?: string | null
  nom_boutique?: string | null
  contact_nom?: string | null
  categorie?: string | null
  ville?: string | null
  quartier?: string | null
  operateur?: string | null
  lead_statut?: string | null
}

export interface TemplateMsg {
  id: string
  titre: string
  canal: string
  categorie: string
  sujet?: string
  texte: string
}

export interface DorkingRequete {
  key?: string
  titre: string
  query: string
  urlGoogle: string
  plateforme: string
}

export default async function AdminProspectionPage() {
  const jar = await cookies()
  const token = jar.get('nopalou_admin_jwt')?.value || jar.get('nopalou_admin')?.value || ''

  let initialLeads: Lead[] = []
  let initialStats: StatsLeads = { total: 0, nouveaux: 0, contactes: 0, en_discussion: 0, convertis: 0, desinscrits: 0, invalides: 0, qualifies: 0, haut_fit: 0, avg_score: 0, avg_fit_score: 0, blacklist: 0 }
  let templates: TemplateMsg[] = []
  let dorking: DorkingRequete[] = []

  try {
    const headers = adminHeaders(token)
    const [resLeads, resTemplates, resDorking] = await Promise.all([
      fetch(`${BACKEND}/api/prospection/leads?limit=100`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${BACKEND}/api/prospection/templates`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${BACKEND}/api/prospection/dorking`, {
        headers,
        cache: 'no-store',
      }),
    ])

    if (resLeads.ok) {
      const data = await resLeads.json()
      initialLeads = data.leads || []
      initialStats = data.stats || initialStats
    }

    if (resTemplates.ok) {
      const tData = await resTemplates.json()
      templates = tData.templates || []
    }

    if (resDorking.ok) {
      const dData = await resDorking.json()
      dorking = dData.requetes || []
    }
  } catch (err) {
    console.error('[ADMIN PROSPECTION SSR ERR]:', err)
  }

  return (
    <ProspectionClient
      initialLeads={initialLeads}
      initialStats={initialStats}
      templates={templates}
      dorking={dorking}
      secret={token}
    />
  )
}
