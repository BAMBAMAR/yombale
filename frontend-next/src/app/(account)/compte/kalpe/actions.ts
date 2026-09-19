'use server'

import { backendFetch } from '@/lib/backend-fetch'
import type {
  KalpeEtat,
  KalpeSynthese,
  KalpeOperation,
  KalpeDette,
  KalpeObjectif,
  KalpeStats,
} from './types'

export async function getKalpeEtat(): Promise<KalpeEtat> {
  try {
    const res = await backendFetch('/api/kalpe/etat')
    if (!res.ok) return { actif: false, hasBoutique: false }
    const d = await res.json()
    return d
  } catch (err) {
    console.error('[KALPE_ACTION] getKalpeEtat error:', err)
    return { actif: false, hasBoutique: false }
  }
}

export async function activerKalpe(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await backendFetch('/api/kalpe/activer', { method: 'POST' })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Échec de l’activation' }
    return { success: true, message: d.message }
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function getKalpeSynthese(contexte: string = 'all'): Promise<KalpeSynthese | null> {
  try {
    const res = await backendFetch(`/api/kalpe/synthese?contexte=${contexte}`)
    if (!res.ok) return null
    const d = await res.json()
    return d.synthese || null
  } catch (err) {
    console.error('[KALPE_ACTION] getKalpeSynthese error:', err)
    return null
  }
}

export async function ajouterKalpeOperation(data: {
  type: string
  montant: number
  categorie: string
  libelle?: string
  contexte?: 'personnel' | 'activite'
  tiers_nom?: string
  tiers_tel?: string
  date_operation?: string
  boutique_id?: string
  objectif_id?: string
}): Promise<{ success: boolean; operation?: KalpeOperation; error?: string }> {
  try {
    const res = await backendFetch('/api/kalpe/operation', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Erreur lors de l’enregistrement' }
    return { success: true, operation: d.operation }
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function getKalpeOperations(params: {
  contexte?: string
  type?: string
  categorie?: string
  q?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
} = {}): Promise<{ operations: KalpeOperation[]; total: number }> {
  try {
    const qs = new URLSearchParams()
    if (params.contexte && params.contexte !== 'all') qs.set('contexte', params.contexte)
    if (params.type) qs.set('type', params.type)
    if (params.categorie) qs.set('categorie', params.categorie)
    if (params.q) qs.set('q', params.q)
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.offset) qs.set('offset', String(params.offset))

    const res = await backendFetch(`/api/kalpe/operations?${qs.toString()}`)
    if (!res.ok) return { operations: [], total: 0 }
    const d = await res.json()
    return { operations: d.operations || [], total: d.total || 0 }
  } catch (err) {
    return { operations: [], total: 0 }
  }
}

export async function supprimerKalpeOperation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await backendFetch(`/api/kalpe/operations/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Impossible de supprimer' }
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function getKalpeDettes(params: {
  direction?: 'a_recevoir' | 'a_payer'
  statut?: 'en_cours' | 'solde' | 'en_retard'
  contexte?: string
} = {}): Promise<KalpeDette[]> {
  try {
    const qs = new URLSearchParams()
    if (params.direction) qs.set('direction', params.direction)
    if (params.statut) qs.set('statut', params.statut)
    if (params.contexte && params.contexte !== 'all') qs.set('contexte', params.contexte)

    const res = await backendFetch(`/api/kalpe/dettes?${qs.toString()}`)
    if (!res.ok) return []
    const d = await res.json()
    return d.dettes || []
  } catch (err) {
    return []
  }
}

export async function ajouterKalpeDette(data: {
  tiers_nom: string
  tiers_telephone?: string
  montant: number
  direction?: 'a_recevoir' | 'a_payer'
  date_echeance?: string
  note?: string
  contexte?: 'personnel' | 'activite'
  boutique_id?: string
}): Promise<{ success: boolean; dette?: KalpeDette; error?: string }> {
  try {
    const res = await backendFetch('/api/kalpe/dettes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Impossible d’enregistrer la créance' }
    return { success: true, dette: d.dette }
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function rembourserKalpeDette(
  id: string,
  data: { montant: number; mode_paiement?: string; note?: string }
): Promise<{ success: boolean; message?: string; dette?: KalpeDette; error?: string }> {
  try {
    const res = await backendFetch(`/api/kalpe/dettes/${id}/remboursement`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Erreur lors du règlement' }
    return { success: true, message: d.message, dette: d.dette }
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function relancerKalpeDetteWhatsApp(detteId: string): Promise<{
  success: boolean
  whatsapp_url?: string | null
  wave_url?: string
  message_texte?: string
  error?: string
}> {
  try {
    const res = await backendFetch('/api/kalpe/relance-whatsapp', {
      method: 'POST',
      body: JSON.stringify({ dette_id: detteId }),
    })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Erreur relance WhatsApp' }
    return d
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function getKalpeObjectifs(): Promise<KalpeObjectif[]> {
  try {
    const res = await backendFetch('/api/kalpe/objectifs')
    if (!res.ok) return []
    const d = await res.json()
    return d.objectifs || []
  } catch (err) {
    return []
  }
}

export async function creerKalpeObjectif(data: {
  titre: string
  montant_cible: number
  date_echeance?: string
  categorie?: string
}): Promise<{ success: boolean; objectif?: KalpeObjectif; error?: string }> {
  try {
    const res = await backendFetch('/api/kalpe/objectifs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Impossible de créer l’objectif' }
    return { success: true, objectif: d.objectif }
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function verserKalpeObjectif(
  id: string,
  data: { montant: number; note?: string }
): Promise<{ success: boolean; message?: string; objectif?: KalpeObjectif; error?: string }> {
  try {
    const res = await backendFetch(`/api/kalpe/objectifs/${id}/verser`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const d = await res.json()
    if (!res.ok) return { success: false, error: d.error || 'Erreur lors du versement' }
    return { success: true, message: d.message, objectif: d.objectif }
  } catch (err) {
    return { success: false, error: 'Erreur réseau' }
  }
}

export async function getKalpeStats(periode: string = 'mois', contexte: string = 'all'): Promise<KalpeStats | null> {
  try {
    const res = await backendFetch(`/api/kalpe/stats?periode=${periode}&contexte=${contexte}`)
    if (!res.ok) return null
    const d = await res.json()
    return d.stats || null
  } catch (err) {
    return null
  }
}
