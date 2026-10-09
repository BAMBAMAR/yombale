// frontend-next/src/lib/surga-offline-sync.ts
// Gestionnaire offline-first et synchronisation pour Surga (Tranche 3)

import { formaterFCFA } from './surga-calculator'
import { marquerConfigure } from './surga-demarrage'
import { saveKalpeOperation, getKalpeOperations, deleteKalpeOperation } from './surga-kalpe'

export interface SurgaChecklistItem {
  id: string
  texte: string
  fait: boolean
}

export type SurgaNoteCategorie = 'general' | 'courses' | 'travail' | 'personnel' | 'urgent'
export type SurgaNoteCouleur = 'creme' | 'ambre' | 'vert' | 'bleu' | 'violet'

export interface SurgaNote {
  id: string
  titre: string
  contenu: string
  categorie?: SurgaNoteCategorie
  epingle?: boolean
  couleur?: SurgaNoteCouleur
  checklist?: SurgaChecklistItem[]
  is_checklist?: boolean
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

export type SurgaEvenementPriorite = 'normale' | 'importante' | 'urgente'
export type SurgaEvenementCategorie = 'rdv' | 'perso' | 'travail' | 'sante' | 'demarche' | 'famille'

export interface SurgaEvenement {
  id: string
  titre: string
  description?: string
  date_evenement: string
  heure_evenement?: string
  est_rappel: boolean
  repetition: 'AUCUNE' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'
  priorite?: SurgaEvenementPriorite
  categorie?: SurgaEvenementCategorie
  lieu?: string
  termine: boolean
  notification_envoyee?: boolean
  created_at: string
  updated_at?: string
  synced?: boolean
}

const STORAGE_KEY_NOTES = 'surga_offline_notes'
const STORAGE_KEY_DEPENSES = 'surga_offline_depenses'
const STORAGE_KEY_AGENDA = 'surga_offline_agenda'
const STORAGE_KEY_SUPPRESSIONS = 'surga_offline_suppressions'
const STORAGE_KEY_PROPRIETAIRE = 'surga_offline_proprietaire'

// Suppressions faites sur l'appareil et pas encore connues du serveur (SRG-A2-008 : une note supprimée hors ligne
// revenait au retour du réseau, parce que le serveur n'en était jamais informé).
type TypeDonnee = 'notes' | 'depenses' | 'agenda'
type Suppressions = Record<TypeDonnee, string[]>

function getSuppressions(): Suppressions {
  const vide: Suppressions = { notes: [], depenses: [], agenda: [] }
  if (typeof window === 'undefined') return vide
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY_SUPPRESSIONS) || 'null')
    return s ? { notes: s.notes || [], depenses: s.depenses || [], agenda: s.agenda || [] } : vide
  } catch {
    return vide
  }
}

function setSuppressions(s: Suppressions): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY_SUPPRESSIONS, JSON.stringify(s)) } catch {}
}

function noterSuppression(type: TypeDonnee, id: string): void {
  const s = getSuppressions()
  if (!s[type].includes(id)) s[type] = [...s[type], id].slice(-500)
  setSuppressions(s)
}


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
    window.dispatchEvent(new CustomEvent('surga-data-change'))
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
    window.dispatchEvent(new CustomEvent('surga-data-change'))
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
    categorie: note.categorie || 'general',
    epingle: Boolean(note.epingle),
    couleur: note.couleur || 'creme',
    checklist: note.checklist || [],
    is_checklist: Boolean(note.is_checklist),
    created_at: note.created_at || now,
    updated_at: now,
    synced: false,
  }

  existingNotes.unshift(created)
  setLocalNotes(existingNotes)
  return created
}

export function deleteLocalNote(id: string): void {
  noterSuppression('notes', id)
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

  // Synchronisation avec Sama Xaalis (Kalpé)
  try {
    saveKalpeOperation({
      direction: 'sortie',
      type: 'depense',
      montant: created.montant_xof,
      categorie: created.categorie || 'Dépenses',
      libelle: created.note || 'Dépense enregistrée',
      mode_paiement: 'cash',
      date_operation: created.date_depense,
    })
  } catch {}

  return created
}

export function deleteLocalDepense(id: string): void {
  noterSuppression('depenses', id)
  const existing = getLocalDepenses().find((d) => d.id === id)
  const depenses = getLocalDepenses().filter((d) => d.id !== id)
  setLocalDepenses(depenses)

  if (existing) {
    try {
      const ops = getKalpeOperations()
      const match = ops.find(
        (o) =>
          o.direction === 'sortie' &&
          o.montant === existing.montant_xof &&
          (o.libelle === existing.note || (existing.note && o.libelle?.includes(existing.note)))
      )
      if (match) {
        deleteKalpeOperation(match.id)
      }
    } catch {}
  }
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
    window.dispatchEvent(new CustomEvent('surga-data-change'))
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
    priorite: evt.priorite || 'normale',
    categorie: evt.categorie || 'rdv',
    lieu: evt.lieu || undefined,
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
  noterSuppression('agenda', id)
  const filtered = getLocalAgenda().filter((e) => e.id !== id)
  setLocalAgenda(filtered)
}

/**
 * Rattache les données de l'appareil au compte qui vient de se connecter.
 * SRG-A1-028 : sur un appareil partagé, les notes, les dépenses, le portefeuille et le brouillon de CV d'un compte
 * passaient sur le compte suivant. Si l'appareil portait les données d'un autre compte, elles sont retirées avant
 * toute synchronisation. Les données saisies en invité (aucun propriétaire) sont adoptées par le premier compte.
 */
export function adopterProprietaire(userId: string): void {
  if (typeof window === 'undefined' || !userId) return
  sessionPerdueSignalee = false
  try {
    const precedent = localStorage.getItem(STORAGE_KEY_PROPRIETAIRE)
    if (precedent && precedent !== userId) {
      const aRetirer: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || ''
        if (k.startsWith('surga_offline_') || k.startsWith('surga_kalpe_') || k.startsWith('surga_xaalis_') || k === 'surga_profil_pro' || k === 'surga_documents_emploi') aRetirer.push(k)
      }
      aRetirer.forEach((k) => localStorage.removeItem(k))
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('surga-data-change'))
    }
    localStorage.setItem(STORAGE_KEY_PROPRIETAIRE, userId)
    rendreCoffre(userId)
  } catch {}
}

/**
 * SRG-A2-006 : un seul chemin d'écriture. La saisie est posée sur l'appareil, puis envoyée par la synchronisation ;
 * « apres » rafraîchit l'écran à la pose et au retour du serveur.
 */
export function enregistrerPuisSynchroniser(ecrire: () => void, apres: () => void): void {
  ecrire()
  apres()
  synchroniserSurga().then(apres).catch(() => {})
}

/**
 * La session n'est plus reconnue par le serveur. Le jeton périmé est retiré de l'appareil et l'écran est prévenu une
 * fois (événement « surga-session-perdue ») ; les saisies non envoyées restent en attente et partiront à la reconnexion.
 */
let sessionPerdueSignalee = false
// Vrai entre la perte de la session et la reconnexion : la fenêtre de connexion dit alors pourquoi elle s'ouvre.
export const sessionEstPerdue = (): boolean => sessionPerdueSignalee
export function signalerSessionPerdue(): void {
  if (typeof window === 'undefined' || sessionPerdueSignalee) return
  sessionPerdueSignalee = true
  try { localStorage.removeItem('token'); localStorage.removeItem('nopalou_session') } catch {}
  window.dispatchEvent(new CustomEvent('surga-session-perdue'))
  window.dispatchEvent(new CustomEvent('surga-toast', { detail: { message: 'Votre session a expiré. Reconnectez-vous : vos saisies sont gardées sur cet appareil.', type: 'info' } }))
}

const estCleDuCompte = (k: string): boolean =>
  k.startsWith('surga_offline_') || k.startsWith('surga_kalpe_') || k.startsWith('surga_xaalis_') ||
  k === 'surga_profil_pro' || k === 'surga_documents_emploi' || k === 'surga_preferences' || k === 'surga_onboarding_done' ||
  k === 'surga_meteo_ville' || k === 'surga_meteo_gps'

// Données qui n'existent que sur l'appareil : le portefeuille Sama Xaalis et ses réglages (D36, envoi au serveur, non fait).
const estCleAppareilSeul = (k: string): boolean => k.startsWith('surga_kalpe_') || k.startsWith('surga_xaalis_')
const PREFIXE_COFFRE = 'surga_coffre_'

/**
 * Rend à un compte ce qui avait été rangé à son nom sur cet appareil lors de sa déconnexion.
 * Les opérations saisies entre-temps (en invité) s'ajoutent aux siennes ; un réglage posé entre-temps est gardé.
 */
function rendreCoffre(userId: string): void {
  const prefixe = `${PREFIXE_COFFRE}${userId}::`
  const cles: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || ''
    if (k.startsWith(prefixe)) cles.push(k)
  }
  for (const cle of cles) {
    const k = cle.slice(prefixe.length)
    const range = localStorage.getItem(cle)
    const present = localStorage.getItem(k)
    let valeur: string | null = present ?? range
    try {
      const a = JSON.parse(range ?? 'null')
      const b = JSON.parse(present ?? 'null')
      if (Array.isArray(a)) {
        const dejaLa = new Set(a.map((x) => x?.id))
        valeur = JSON.stringify([...a, ...(Array.isArray(b) ? b.filter((x) => !dejaLa.has(x?.id)) : [])])
      }
    } catch {}
    if (valeur !== null) localStorage.setItem(k, valeur)
    localStorage.removeItem(cle)
  }
  if (cles.length > 0) {
    window.dispatchEvent(new CustomEvent('surga-data-change'))
    window.dispatchEvent(new CustomEvent('surga-kalpe-change'))
  }
}

/**
 * Nombre de saisies de l'appareil que le serveur n'a pas encore reçues.
 */
export function compterSaisiesNonEnvoyees(): number {
  if (typeof window === 'undefined') return 0
  const nonEnvoyees = (liste: Array<{ synced?: boolean }>) => liste.filter((e) => e.synced === false).length
  let suppressions = 0
  try {
    const brut = JSON.parse(localStorage.getItem('surga_offline_suppressions') || '{}')
    suppressions = Object.values(brut).reduce((n: number, v) => n + (Array.isArray(v) ? v.length : 0), 0)
  } catch {}
  return nonEnvoyees(getLocalNotes()) + nonEnvoyees(getLocalDepenses()) + nonEnvoyees(getLocalAgenda()) + suppressions
}

/**
 * Avant une déconnexion : dernier envoi des saisies au serveur. S'il en reste que le serveur n'a pas reçues,
 * l'utilisateur choisit : rester connecté, ou se déconnecter en les perdant. Rend false s'il renonce.
 */
export async function preparerDeconnexion(): Promise<boolean> {
  if (typeof window === 'undefined') return true
  if (compterSaisiesNonEnvoyees() > 0) {
    try { await synchroniserSurga() } catch {}
  }
  const reste = compterSaisiesNonEnvoyees()
  if (reste === 0) return true
  return window.confirm(
    `${reste} saisie${reste > 1 ? 's' : ''} de cet appareil n'${reste > 1 ? 'ont' : 'a'} pas pu être envoyée${reste > 1 ? 's' : ''} à votre compte. En vous déconnectant maintenant, ${reste > 1 ? 'elles seront effacées' : 'elle sera effacée'} de cet appareil. Se déconnecter quand même ?`
  )
}

/**
 * SRG-A1-028 : à la déconnexion, tout ce que le compte a laissé sur l'appareil est retiré (notes, dépenses, rappels,
 * brouillon de CV, préférences, localité météo). La personne suivante repart d'un appareil vide.
 * Le portefeuille n'est pas effacé : il n'existe nulle part ailleurs. Il est rangé au nom du compte, hors de la vue de
 * l'application, et lui est rendu à sa prochaine connexion sur cet appareil (rendreCoffre).
 * Limite : rangé, il reste lisible dans le stockage du navigateur par qui sait y regarder.
 */
export function retirerDonneesDuCompte(): void {
  if (typeof window === 'undefined') return
  try {
    const proprietaire = localStorage.getItem(STORAGE_KEY_PROPRIETAIRE)
    const aRetirer: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || ''
      if (estCleDuCompte(k)) aRetirer.push(k)
    }
    for (const k of aRetirer) {
      const v = localStorage.getItem(k)
      if (proprietaire && estCleAppareilSeul(k) && v !== null) localStorage.setItem(`${PREFIXE_COFFRE}${proprietaire}::${k}`, v)
      localStorage.removeItem(k)
    }
    marquerConfigure(false)
    window.dispatchEvent(new CustomEvent('surga-data-change'))
    window.dispatchEvent(new CustomEvent('surga-kalpe-change'))
  } catch {}
}

const jourSeul = (v: unknown): string => String(v || '').slice(0, 10)

/**
 * Fusionne la liste du serveur avec celle de l'appareil.
 * - une ligne du serveur remplace la ligne locale de même identifiant, sauf si celle-ci a été modifiée pendant l'échange ;
 * - une ligne locale non envoyée et inconnue du serveur est gardée (saisie pendant l'échange, ou refusée par le serveur) ;
 * - une ligne supprimée sur l'appareil ne revient pas.
 */
function fusionner<T extends { id: string; updated_at?: string; synced?: boolean }>(
  locales: T[],
  serveur: T[],
  idMappings: Record<string, string>,
  debut: string,
  supprimes: string[],
  normaliser: (x: T) => T
): T[] {
  const idFinal = (id: string) => idMappings[id] || id
  const parId = new Map<string, T>()
  for (const l of locales) parId.set(idFinal(l.id), l)
  const resultat: T[] = []
  const vus = new Set<string>()
  for (const s of serveur) {
    if (supprimes.includes(s.id)) continue
    vus.add(s.id)
    const local = parId.get(s.id)
    if (local && local.synced === false && (local.updated_at || '') > debut) resultat.push({ ...local, id: s.id })
    else resultat.push(normaliser({ ...s, synced: true }))
  }
  for (const l of locales) {
    const id = idFinal(l.id)
    if (vus.has(id) || supprimes.includes(l.id)) continue
    if (l.synced === false) resultat.push({ ...l, id })
  }
  return resultat
}

/**
 * Synchronise l'appareil et le serveur.
 * SRG-A2-001 : un invité recevait « succès » et ses saisies étaient marquées envoyées sans l'être ; elles disparaissaient
 *              à la première vraie synchronisation. Une réponse « invité » ne marque plus rien.
 * SRG-A2-002 : la liste du serveur écrasait celle de l'appareil ; elle est maintenant fusionnée.
 * SRG-A2-003 : sans rien à envoyer, l'appareil ne demandait rien : un second appareil restait vide. L'échange a
 *              toujours lieu ; il sert aussi à récupérer.
 * SRG-A2-008 : les suppressions faites sur l'appareil sont transmises.
 * Retourne true quand le serveur a confirmé l'échange pour un compte connecté.
 */
export async function synchroniserSurga(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false

  const debut = new Date().toISOString()
  const notesNonSync = getLocalNotes().filter((n) => !n.synced)
  const depensesNonSync = getLocalDepenses().filter((d) => !d.synced)
  const agendaNonSync = getLocalAgenda().filter((a) => !a.synced)
  const suppressions = getSuppressions()

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
        suppressions,
      }),
    })

    // SRG-A3-008 : le serveur refuse la session (expirée, ou révoquée depuis un autre appareil). L'écran est prévenu.
    if (res.status === 401) { signalerSessionPerdue(); return false }
    if (!res.ok) return false
    const data = await res.json()
    // Invité, ou refus : rien n'est enregistré côté serveur, les saisies restent « à envoyer ».
    if (!data.success || data.guest) return false

    const idMappings: Record<string, string> = data.id_mappings || {}
    const restant = getSuppressions()

    if (Array.isArray(data.notes)) {
      setLocalNotes(fusionner<SurgaNote>(getLocalNotes(), data.notes, idMappings, debut, restant.notes, (n) => n))
    }
    if (Array.isArray(data.depenses)) {
      setLocalDepenses(fusionner<SurgaDepense>(getLocalDepenses(), data.depenses, idMappings, debut, restant.depenses, (d) => ({ ...d, date_depense: jourSeul(d.date_depense) })))
    }
    if (Array.isArray(data.agenda)) {
      setLocalAgenda(fusionner<SurgaEvenement>(getLocalAgenda(), data.agenda, idMappings, debut, restant.agenda, (a) => ({ ...a, date_evenement: jourSeul(a.date_evenement) })))
    }

    // Les suppressions transmises sont acquises ; celles faites pendant l'échange partiront au prochain.
    setSuppressions({
      notes: restant.notes.filter((id) => !suppressions.notes.includes(id)),
      depenses: restant.depenses.filter((id) => !suppressions.depenses.includes(id)),
      agenda: restant.agenda.filter((id) => !suppressions.agenda.includes(id)),
    })
    return true
  } catch (err) {
    console.warn('[SURGA SYNC FAILED]:', err)
  }

  return false
}

// SRG-A2-019 : au retour du réseau, les saisies en attente partent sans attendre que l'utilisateur ouvre un onglet.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    synchroniserSurga()
      .then((ok) => { if (ok) window.dispatchEvent(new CustomEvent('surga-data-change')) })
      .catch(() => {})
  })
}
