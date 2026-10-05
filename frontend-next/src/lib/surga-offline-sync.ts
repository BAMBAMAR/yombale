// frontend-next/src/lib/surga-offline-sync.ts
// Gestionnaire offline-first et synchronisation pour Surga (Tranche 3)

import { formaterFCFA } from './surga-calculator'

export interface SurgaNote {
  id: string
  titre: string
  contenu: string
  created_at: string
  updated_at: string
  synced?: boolean
}

export interface SurgaDepense {
  id: string
  montant_xof: number
  categorie: string
  date_depense: string
  note?: string
  created_at: string
  updated_at?: string
  synced?: boolean
}

export interface SurgaDepensesStats {
  mois: string
  total_xof: number
  total_formate: string
  nb_depenses: number
  par_categorie: Array<{
    categorie: string
    total_xof: number
    total_formate: string
    pourcentage: number
    nb_items: number
  }>
}

export interface SurgaEvenement {
  id: string
  titre: string
  description?: string
  date_evenement: string
  heure_evenement?: string
  est_rappel: boolean
  repetition: 'AUCUNE' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'
  termine: boolean
  notification_envoyee?: boolean
  created_at: string
  updated_at?: string
  synced?: boolean
}

const STORAGE_KEY_NOTES = 'surga_offline_notes'
const STORAGE_KEY_DEPENSES = 'surga_offline_depenses'
const STORAGE_KEY_AGENDA = 'surga_offline_agenda'


export function genererId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}


export function getLocalNotes(): SurgaNote[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setLocalNotes(notes: SurgaNote[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes))
  } catch {}
}

export function getLocalDepenses(): SurgaDepense[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEPENSES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setLocalDepenses(depenses: SurgaDepense[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_DEPENSES, JSON.stringify(depenses))
  } catch {}
}

export function saveLocalNote(note: Partial<SurgaNote> & { titre: string }): SurgaNote {
  const existingNotes = getLocalNotes()
  const now = new Date().toISOString()

  if (note.id) {
    const index = existingNotes.findIndex((n) => n.id === note.id)
    if (index !== -1) {
      const updated: SurgaNote = {
        ...existingNotes[index],
        ...note,
        updated_at: now,
        synced: false,
      }
      existingNotes[index] = updated
      setLocalNotes(existingNotes)
      return updated
    }
  }

  const created: SurgaNote = {
    id: note.id || genererId(),
    titre: note.titre.trim(),
    contenu: note.contenu || '',
    created_at: note.created_at || now,
    updated_at: now,
    synced: false,
  }

  existingNotes.unshift(created)
  setLocalNotes(existingNotes)
  return created
}

export function deleteLocalNote(id: string): void {
  const notes = getLocalNotes().filter((n) => n.id !== id)
  setLocalNotes(notes)
}

export function saveLocalDepense(depense: Partial<SurgaDepense> & { montant_xof: number; categorie: string }): SurgaDepense {
  const existing = getLocalDepenses()
  const now = new Date().toISOString()

  const created: SurgaDepense = {
    id: depense.id || genererId(),
    montant_xof: Math.round(depense.montant_xof),
    categorie: depense.categorie,
    date_depense: depense.date_depense || now.slice(0, 10),
    note: depense.note || '',
    created_at: depense.created_at || now,
    updated_at: now,
    synced: false,
  }

  existing.unshift(created)
  setLocalDepenses(existing)
  return created
}

export function deleteLocalDepense(id: string): void {
  const depenses = getLocalDepenses().filter((d) => d.id !== id)
  setLocalDepenses(depenses)
}

export function calculerStatsLocales(mois?: string): SurgaDepensesStats {
  const depenses = getLocalDepenses()
  const moisCible = mois || new Date().toISOString().slice(0, 7)

  const filtre = depenses.filter((d) => d.date_depense && d.date_depense.startsWith(moisCible))

  const totalXof = filtre.reduce((acc, curr) => acc + (curr.montant_xof || 0), 0)

  const parCatMap: Record<string, { total: number; count: number }> = {}
  filtre.forEach((d) => {
    const cat = d.categorie || 'Autre'
    if (!parCatMap[cat]) parCatMap[cat] = { total: 0, count: 0 }
    parCatMap[cat].total += d.montant_xof || 0
    parCatMap[cat].count += 1
  })

  const par_categorie = Object.entries(parCatMap)
    .map(([categorie, stats]) => ({
      categorie,
      total_xof: stats.total,
      total_formate: formaterFCFA(stats.total),
      pourcentage: totalXof > 0 ? Math.round((stats.total / totalXof) * 100) : 0,
      nb_items: stats.count,
    }))
    .sort((a, b) => b.total_xof - a.total_xof)

  return {
    mois: moisCible,
    total_xof: totalXof,
    total_formate: formaterFCFA(totalXof),
    nb_depenses: filtre.length,
    par_categorie,
  }
}

export function getLocalAgenda(): SurgaEvenement[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AGENDA)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setLocalAgenda(agenda: SurgaEvenement[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_AGENDA, JSON.stringify(agenda))
  } catch {}
}

export function saveLocalEvenement(evt: Partial<SurgaEvenement> & { titre: string; date_evenement: string }): SurgaEvenement {
  const existing = getLocalAgenda()
  const now = new Date().toISOString()

  if (evt.id) {
    const index = existing.findIndex((e) => e.id === evt.id)
    if (index !== -1) {
      const updated: SurgaEvenement = {
        ...existing[index],
        ...evt,
        updated_at: now,
        synced: false,
      }
      existing[index] = updated
      setLocalAgenda(existing)
      return updated
    }
  }

  const created: SurgaEvenement = {
    id: evt.id || genererId(),
    titre: evt.titre.trim(),
    description: evt.description || '',
    date_evenement: evt.date_evenement,
    heure_evenement: evt.heure_evenement || undefined,
    est_rappel: evt.est_rappel ?? true,
    repetition: evt.repetition || 'AUCUNE',
    termine: Boolean(evt.termine),
    notification_envoyee: false,
    created_at: evt.created_at || now,
    updated_at: now,
    synced: false,
  }

  existing.push(created)
  setLocalAgenda(existing)
  return created
}

export function toggleLocalEvenement(id: string): SurgaEvenement | null {
  const existing = getLocalAgenda()
  const index = existing.findIndex((e) => e.id === id)
  if (index === -1) return null

  existing[index].termine = !existing[index].termine
  existing[index].updated_at = new Date().toISOString()
  existing[index].synced = false
  setLocalAgenda(existing)
  return existing[index]
}

export function deleteLocalEvenement(id: string): void {
  const filtered = getLocalAgenda().filter((e) => e.id !== id)
  setLocalAgenda(filtered)
}

export async function synchroniserSurga(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false

  const notesNonSync = getLocalNotes().filter((n) => !n.synced)
  const depensesNonSync = getLocalDepenses().filter((d) => !d.synced)
  const agendaNonSync = getLocalAgenda().filter((a) => !a.synced)

  if (notesNonSync.length === 0 && depensesNonSync.length === 0 && agendaNonSync.length === 0) return true

  try {
    const token = localStorage.getItem('nopalou_session') || localStorage.getItem('token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch('/api/surga/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        notes: notesNonSync,
        depenses: depensesNonSync,
        agenda: agendaNonSync,
      }),
    })

    if (!res.ok) return false
    const data = await res.json()

    if (data.success) {
      const idMappings = data.id_mappings || {}

      if (Array.isArray(data.notes)) {
        const mergedNotes = data.notes.map((n: SurgaNote) => ({ ...n, synced: true }))
        setLocalNotes(mergedNotes)
      } else {
        const notes = getLocalNotes().map((n) => ({
          ...n,
          id: idMappings[n.id] || n.id,
          synced: true,
        }))
        setLocalNotes(notes)
      }

      if (Array.isArray(data.depenses)) {
        const mergedDepenses = data.depenses.map((d: SurgaDepense) => ({ ...d, synced: true }))
        setLocalDepenses(mergedDepenses)
      } else {
        const depenses = getLocalDepenses().map((d) => ({
          ...d,
          id: idMappings[d.id] || d.id,
          synced: true,
        }))
        setLocalDepenses(depenses)
      }

      if (Array.isArray(data.agenda)) {
        const mergedAgenda = data.agenda.map((a: SurgaEvenement) => ({ ...a, synced: true }))
        setLocalAgenda(mergedAgenda)
      } else {
        const agenda = getLocalAgenda().map((a) => ({
          ...a,
          id: idMappings[a.id] || a.id,
          synced: true,
        }))
        setLocalAgenda(agenda)
      }
      return true
    }
  } catch (err) {
    console.warn('[SURGA SYNC FAILED]:', err)
  }

  return false
}

