import { cookies } from 'next/headers'
import ProspectionClient from './ProspectionClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

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
  notes: string | null
  derniere_action_at: string | null
  created_at: string
}

export interface StatsLeads {
  total: number
  nouveaux: number
  contactes: number
  convertis: number
  desinscrits?: number
  blacklist?: number
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
  titre: string
  query: string
  urlGoogle: string
  plateforme: string
}

export default async function AdminProspectionPage() {
  const jar = await cookies()
  const secret = jar.get('nopalou_admin')?.value || ''

  let initialLeads: Lead[] = []
  let initialStats: StatsLeads = { total: 0, nouveaux: 0, contactes: 0, convertis: 0 }
  let templates: TemplateMsg[] = []
  let dorking: DorkingRequete[] = []

  try {
    const [resLeads, resTemplates, resDorking] = await Promise.all([
      fetch(`${BACKEND}/api/prospection/leads?limit=100`, {
        headers: { 'x-admin-secret': secret },
        cache: 'no-store',
      }),
      fetch(`${BACKEND}/api/prospection/templates`, {
        headers: { 'x-admin-secret': secret },
        cache: 'no-store',
      }),
      fetch(`${BACKEND}/api/prospection/dorking`, {
        headers: { 'x-admin-secret': secret },
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
      secret={secret}
    />
  )
}
